import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { invoicesTable, lineItemsTable, clientsTable } from "@workspace/db/schema";
import { eq, sql } from "drizzle-orm";

const router: IRouter = Router();

function formatInvoice(i: typeof invoicesTable.$inferSelect, clientName?: string | null) {
  return {
    ...i,
    clientName: clientName ?? null,
    subtotal: parseFloat(i.subtotal),
    markupAmount: parseFloat(i.markupAmount),
    taxAmount: parseFloat(i.taxAmount),
    total: parseFloat(i.total),
    amountPaid: parseFloat(i.amountPaid),
    amountDue: parseFloat(i.amountDue),
    createdAt: i.createdAt.toISOString(),
  };
}

router.get("/invoices", async (req, res) => {
  const { status } = req.query;
  const invoices = await db
    .select({ i: invoicesTable, clientName: clientsTable.name })
    .from(invoicesTable)
    .leftJoin(clientsTable, eq(invoicesTable.clientId, clientsTable.id))
    .where(status ? eq(invoicesTable.status, String(status)) : undefined)
    .orderBy(sql`${invoicesTable.createdAt} DESC`);

  res.json(invoices.map(({ i, clientName }) => formatInvoice(i, clientName)));
});

router.post("/invoices", async (req, res) => {
  const { estimateId, clientId, projectName, status, dueDate, notes } = req.body;
  const [invCount] = await db.select({ count: sql<number>`count(*)` }).from(invoicesTable);
  const invoiceNumber = `INV-${String((invCount?.count ?? 0) + 1).padStart(4, "0")}`;

  const [invoice] = await db.insert(invoicesTable).values({
    invoiceNumber,
    estimateId: estimateId || null,
    clientId: clientId || null,
    projectName,
    status: status || "draft",
    dueDate,
    notes,
    amountDue: "0",
  }).returning();

  res.status(201).json(formatInvoice(invoice));
});

router.get("/invoices/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const [row] = await db.select({ i: invoicesTable, client: clientsTable })
    .from(invoicesTable)
    .leftJoin(clientsTable, eq(invoicesTable.clientId, clientsTable.id))
    .where(eq(invoicesTable.id, id));

  if (!row) return res.status(404).json({ error: "Invoice not found" });

  // Get line items from the associated estimate if any
  let lineItems: ReturnType<typeof formatLineItem>[] = [];
  if (row.i.estimateId) {
    const items = await db.select().from(lineItemsTable)
      .where(eq(lineItemsTable.estimateId, row.i.estimateId))
      .orderBy(lineItemsTable.sortOrder);
    lineItems = items.map(formatLineItem);
  }

  const client = row.client ? {
    ...row.client,
    createdAt: row.client.createdAt.toISOString(),
  } : null;

  res.json({
    ...formatInvoice(row.i, row.client?.name),
    client,
    lineItems,
  });
});

router.put("/invoices/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const { status, dueDate, notes, amountPaid, paidAt } = req.body;

  const [existing] = await db.select().from(invoicesTable).where(eq(invoicesTable.id, id));
  if (!existing) return res.status(404).json({ error: "Invoice not found" });

  const newAmountPaid = amountPaid !== undefined ? parseFloat(String(amountPaid)) : parseFloat(existing.amountPaid);
  const amountDue = Math.max(0, parseFloat(existing.total) - newAmountPaid);

  const [invoice] = await db.update(invoicesTable).set({
    status: status ?? existing.status,
    dueDate: dueDate !== undefined ? dueDate : existing.dueDate,
    notes: notes !== undefined ? notes : existing.notes,
    amountPaid: String(newAmountPaid),
    amountDue: String(amountDue),
    paidAt: paidAt !== undefined ? paidAt : existing.paidAt,
  }).where(eq(invoicesTable.id, id)).returning();

  const [row] = await db.select({ i: invoicesTable, client: clientsTable })
    .from(invoicesTable)
    .leftJoin(clientsTable, eq(invoicesTable.clientId, clientsTable.id))
    .where(eq(invoicesTable.id, id));

  let lineItems: ReturnType<typeof formatLineItem>[] = [];
  if (row.i.estimateId) {
    const items = await db.select().from(lineItemsTable)
      .where(eq(lineItemsTable.estimateId, row.i.estimateId))
      .orderBy(lineItemsTable.sortOrder);
    lineItems = items.map(formatLineItem);
  }

  const client = row.client ? { ...row.client, createdAt: row.client.createdAt.toISOString() } : null;

  res.json({
    ...formatInvoice(row.i, row.client?.name),
    client,
    lineItems,
  });
});

function formatLineItem(li: typeof lineItemsTable.$inferSelect) {
  return {
    ...li,
    quantity: parseFloat(li.quantity),
    unitCost: parseFloat(li.unitCost),
    total: parseFloat(li.total),
  };
}

export default router;
