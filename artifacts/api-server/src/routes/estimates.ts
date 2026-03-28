import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import {
  estimatesTable, lineItemsTable, clientsTable, invoicesTable,
} from "@workspace/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { calculateEstimateTotals } from "../lib/calc.js";

const router: IRouter = Router();

function formatEstimate(e: typeof estimatesTable.$inferSelect, clientName?: string | null) {
  return {
    ...e,
    clientName: clientName ?? null,
    subtotal: parseFloat(e.subtotal),
    materialsCost: parseFloat(e.materialsCost),
    laborCost: parseFloat(e.laborCost),
    markupPercent: parseFloat(e.markupPercent),
    markupAmount: parseFloat(e.markupAmount),
    taxPercent: parseFloat(e.taxPercent),
    taxAmount: parseFloat(e.taxAmount),
    total: parseFloat(e.total),
    profitMargin: parseFloat(e.profitMargin),
    createdAt: e.createdAt.toISOString(),
  };
}

function formatLineItem(li: typeof lineItemsTable.$inferSelect) {
  return {
    ...li,
    quantity: parseFloat(li.quantity),
    unitCost: parseFloat(li.unitCost),
    total: parseFloat(li.total),
  };
}

async function getEstimateNumber() {
  const [result] = await db.select({ count: sql<number>`count(*)` }).from(estimatesTable);
  const num = (result?.count ?? 0) + 1;
  return `EST-${String(num).padStart(4, "0")}`;
}

async function recalculate(estimateId: number, markupPercent: number, taxPercent: number) {
  const items = await db.select().from(lineItemsTable).where(eq(lineItemsTable.estimateId, estimateId));
  const parsed = items.map(i => ({
    type: i.type,
    quantity: parseFloat(i.quantity),
    unitCost: parseFloat(i.unitCost),
  }));
  const totals = calculateEstimateTotals(parsed, markupPercent, taxPercent);
  await db.update(estimatesTable).set({
    subtotal: String(totals.subtotal),
    materialsCost: String(totals.materialsCost),
    laborCost: String(totals.laborCost),
    markupAmount: String(totals.markupAmount),
    taxAmount: String(totals.taxAmount),
    total: String(totals.total),
    profitMargin: String(totals.profitMargin),
  }).where(eq(estimatesTable.id, estimateId));
}

router.get("/estimates", async (req, res) => {
  const { status, clientId } = req.query;
  const conditions = [];
  if (status) conditions.push(eq(estimatesTable.status, String(status)));
  if (clientId) conditions.push(eq(estimatesTable.clientId, parseInt(String(clientId))));

  const estimates = await db
    .select({
      e: estimatesTable,
      clientName: clientsTable.name,
    })
    .from(estimatesTable)
    .leftJoin(clientsTable, eq(estimatesTable.clientId, clientsTable.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(sql`${estimatesTable.createdAt} DESC`);

  res.json(estimates.map(({ e, clientName }) => formatEstimate(e, clientName)));
});

router.post("/estimates", async (req, res) => {
  const { clientId, projectName, status, markupPercent, taxPercent, notes, validUntil, lineItems } = req.body;
  const estimateNumber = await getEstimateNumber();

  const [estimate] = await db.insert(estimatesTable).values({
    estimateNumber,
    clientId: clientId || null,
    projectName,
    status: status || "draft",
    markupPercent: String(markupPercent ?? 0),
    taxPercent: String(taxPercent ?? 0),
    notes,
    validUntil,
  }).returning();

  // Insert line items if provided
  if (lineItems && lineItems.length > 0) {
    for (const item of lineItems) {
      const total = parseFloat(item.quantity) * parseFloat(item.unitCost);
      await db.insert(lineItemsTable).values({
        estimateId: estimate.id,
        type: item.type || "material",
        category: item.category,
        description: item.description,
        quantity: String(item.quantity),
        unit: item.unit,
        unitCost: String(item.unitCost),
        total: String(total),
        materialId: item.materialId || null,
        supplierId: item.supplierId || null,
        supplierName: item.supplierName,
        notes: item.notes,
        sortOrder: item.sortOrder ?? 0,
      });
    }
    await recalculate(estimate.id, parseFloat(estimate.markupPercent), parseFloat(estimate.taxPercent));
  }

  const [updated] = await db.select({ e: estimatesTable, clientName: clientsTable.name })
    .from(estimatesTable)
    .leftJoin(clientsTable, eq(estimatesTable.clientId, clientsTable.id))
    .where(eq(estimatesTable.id, estimate.id));

  res.status(201).json(formatEstimate(updated.e, updated.clientName));
});

router.get("/estimates/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const [row] = await db.select({ e: estimatesTable, client: clientsTable })
    .from(estimatesTable)
    .leftJoin(clientsTable, eq(estimatesTable.clientId, clientsTable.id))
    .where(eq(estimatesTable.id, id));

  if (!row) return res.status(404).json({ error: "Estimate not found" });

  const items = await db.select().from(lineItemsTable).where(eq(lineItemsTable.estimateId, id)).orderBy(lineItemsTable.sortOrder);

  const client = row.client ? {
    ...row.client,
    createdAt: row.client.createdAt.toISOString(),
  } : null;

  res.json({
    ...formatEstimate(row.e, row.client?.name),
    client,
    lineItems: items.map(formatLineItem),
  });
});

router.put("/estimates/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const { clientId, projectName, status, markupPercent, taxPercent, notes, validUntil, lineItems } = req.body;

  const [existing] = await db.select().from(estimatesTable).where(eq(estimatesTable.id, id));
  if (!existing) return res.status(404).json({ error: "Estimate not found" });

  await db.update(estimatesTable).set({
    clientId: clientId !== undefined ? (clientId || null) : existing.clientId,
    projectName: projectName ?? existing.projectName,
    status: status ?? existing.status,
    markupPercent: markupPercent !== undefined ? String(markupPercent) : existing.markupPercent,
    taxPercent: taxPercent !== undefined ? String(taxPercent) : existing.taxPercent,
    notes: notes !== undefined ? notes : existing.notes,
    validUntil: validUntil !== undefined ? validUntil : existing.validUntil,
  }).where(eq(estimatesTable.id, id));

  // Replace line items if provided
  if (lineItems !== undefined) {
    await db.delete(lineItemsTable).where(eq(lineItemsTable.estimateId, id));
    for (const item of lineItems) {
      const total = parseFloat(String(item.quantity)) * parseFloat(String(item.unitCost));
      await db.insert(lineItemsTable).values({
        estimateId: id,
        type: item.type || "material",
        category: item.category,
        description: item.description,
        quantity: String(item.quantity),
        unit: item.unit,
        unitCost: String(item.unitCost),
        total: String(total),
        materialId: item.materialId || null,
        supplierId: item.supplierId || null,
        supplierName: item.supplierName,
        notes: item.notes,
        sortOrder: item.sortOrder ?? 0,
      });
    }
  }

  const [updated] = await db.select().from(estimatesTable).where(eq(estimatesTable.id, id));
  await recalculate(id, parseFloat(updated.markupPercent), parseFloat(updated.taxPercent));

  const [row] = await db.select({ e: estimatesTable, client: clientsTable })
    .from(estimatesTable)
    .leftJoin(clientsTable, eq(estimatesTable.clientId, clientsTable.id))
    .where(eq(estimatesTable.id, id));

  const items = await db.select().from(lineItemsTable).where(eq(lineItemsTable.estimateId, id)).orderBy(lineItemsTable.sortOrder);

  const client = row.client ? {
    ...row.client,
    createdAt: row.client.createdAt.toISOString(),
  } : null;

  res.json({
    ...formatEstimate(row.e, row.client?.name),
    client,
    lineItems: items.map(formatLineItem),
  });
});

router.delete("/estimates/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  await db.delete(lineItemsTable).where(eq(lineItemsTable.estimateId, id));
  await db.delete(estimatesTable).where(eq(estimatesTable.id, id));
  res.status(204).send();
});

router.post("/estimates/:id/convert-to-invoice", async (req, res) => {
  const id = parseInt(req.params.id);
  const [row] = await db.select({ e: estimatesTable, client: clientsTable })
    .from(estimatesTable)
    .leftJoin(clientsTable, eq(estimatesTable.clientId, clientsTable.id))
    .where(eq(estimatesTable.id, id));

  if (!row) return res.status(404).json({ error: "Estimate not found" });

  const e = row.e;
  const [invCount] = await db.select({ count: sql<number>`count(*)` }).from(invoicesTable);
  const invoiceNumber = `INV-${String((invCount?.count ?? 0) + 1).padStart(4, "0")}`;

  const amountDue = parseFloat(e.total);
  const [invoice] = await db.insert(invoicesTable).values({
    invoiceNumber,
    estimateId: e.id,
    clientId: e.clientId,
    projectName: e.projectName,
    status: "draft",
    subtotal: e.subtotal,
    markupAmount: e.markupAmount,
    taxAmount: e.taxAmount,
    total: e.total,
    amountPaid: "0",
    amountDue: String(amountDue),
    notes: e.notes,
  }).returning();

  // Mark estimate as invoiced
  await db.update(estimatesTable).set({ status: "invoiced" }).where(eq(estimatesTable.id, id));

  res.status(201).json({
    ...invoice,
    clientName: row.client?.name ?? null,
    subtotal: parseFloat(invoice.subtotal),
    markupAmount: parseFloat(invoice.markupAmount),
    taxAmount: parseFloat(invoice.taxAmount),
    total: parseFloat(invoice.total),
    amountPaid: parseFloat(invoice.amountPaid),
    amountDue: parseFloat(invoice.amountDue),
    createdAt: invoice.createdAt.toISOString(),
  });
});

// Line items
router.post("/estimates/:id/line-items", async (req, res) => {
  const estimateId = parseInt(req.params.id);
  const { type, category, description, quantity, unit, unitCost, materialId, supplierId, supplierName, notes, sortOrder } = req.body;
  const total = parseFloat(quantity) * parseFloat(unitCost);

  const [item] = await db.insert(lineItemsTable).values({
    estimateId,
    type: type || "material",
    category,
    description,
    quantity: String(quantity),
    unit,
    unitCost: String(unitCost),
    total: String(total),
    materialId: materialId || null,
    supplierId: supplierId || null,
    supplierName,
    notes,
    sortOrder: sortOrder ?? 0,
  }).returning();

  const [est] = await db.select().from(estimatesTable).where(eq(estimatesTable.id, estimateId));
  await recalculate(estimateId, parseFloat(est.markupPercent), parseFloat(est.taxPercent));

  res.status(201).json(formatLineItem(item));
});

router.put("/estimates/:id/line-items/:lineItemId", async (req, res) => {
  const estimateId = parseInt(req.params.id);
  const lineItemId = parseInt(req.params.lineItemId);
  const { type, category, description, quantity, unit, unitCost, materialId, supplierId, supplierName, notes, sortOrder } = req.body;
  const total = parseFloat(quantity) * parseFloat(unitCost);

  const [item] = await db.update(lineItemsTable).set({
    type,
    category,
    description,
    quantity: String(quantity),
    unit,
    unitCost: String(unitCost),
    total: String(total),
    materialId: materialId || null,
    supplierId: supplierId || null,
    supplierName,
    notes,
    sortOrder: sortOrder ?? 0,
  }).where(and(eq(lineItemsTable.id, lineItemId), eq(lineItemsTable.estimateId, estimateId))).returning();

  if (!item) return res.status(404).json({ error: "Line item not found" });

  const [est] = await db.select().from(estimatesTable).where(eq(estimatesTable.id, estimateId));
  await recalculate(estimateId, parseFloat(est.markupPercent), parseFloat(est.taxPercent));

  res.json(formatLineItem(item));
});

router.delete("/estimates/:id/line-items/:lineItemId", async (req, res) => {
  const estimateId = parseInt(req.params.id);
  const lineItemId = parseInt(req.params.lineItemId);
  await db.delete(lineItemsTable).where(and(eq(lineItemsTable.id, lineItemId), eq(lineItemsTable.estimateId, estimateId)));

  const [est] = await db.select().from(estimatesTable).where(eq(estimatesTable.id, estimateId));
  if (est) {
    await recalculate(estimateId, parseFloat(est.markupPercent), parseFloat(est.taxPercent));
  }

  res.status(204).send();
});

export default router;
