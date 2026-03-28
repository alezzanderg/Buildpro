import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { materialsTable, materialPriceHistoryTable, suppliersTable } from "@workspace/db/schema";
import { eq, and } from "drizzle-orm";

const router: IRouter = Router();

router.get("/materials", async (req, res) => {
  const { category, supplierId } = req.query;
  const conditions = [];
  if (category) conditions.push(eq(materialsTable.category, String(category)));
  if (supplierId) conditions.push(eq(materialsTable.supplierId, parseInt(String(supplierId))));

  const materials = await db
    .select({
      id: materialsTable.id,
      name: materialsTable.name,
      description: materialsTable.description,
      category: materialsTable.category,
      unit: materialsTable.unit,
      currentPrice: materialsTable.currentPrice,
      supplierId: materialsTable.supplierId,
      supplierName: suppliersTable.name,
      sku: materialsTable.sku,
      url: materialsTable.url,
      lastUpdated: materialsTable.lastUpdated,
    })
    .from(materialsTable)
    .leftJoin(suppliersTable, eq(materialsTable.supplierId, suppliersTable.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(materialsTable.name);

  res.json(materials.map(m => ({
    ...m,
    currentPrice: parseFloat(m.currentPrice),
    lastUpdated: m.lastUpdated.toISOString(),
  })));
});

router.post("/materials", async (req, res) => {
  const { name, description, category, unit, currentPrice, supplierId, sku, url } = req.body;
  const [material] = await db.insert(materialsTable).values({
    name, description, category, unit,
    currentPrice: String(currentPrice),
    supplierId: supplierId || null,
    sku, url,
  }).returning();

  // Record initial price in history
  await db.insert(materialPriceHistoryTable).values({
    materialId: material.id,
    price: String(currentPrice),
    notes: "Initial price",
  });

  const supplier = supplierId
    ? await db.select().from(suppliersTable).where(eq(suppliersTable.id, supplierId)).then(r => r[0])
    : null;

  res.status(201).json({
    ...material,
    supplierName: supplier?.name ?? null,
    currentPrice: parseFloat(material.currentPrice),
    lastUpdated: material.lastUpdated.toISOString(),
  });
});

router.put("/materials/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const { name, description, category, unit, currentPrice, supplierId, sku, url } = req.body;

  const existing = await db.select().from(materialsTable).where(eq(materialsTable.id, id)).then(r => r[0]);
  if (!existing) return res.status(404).json({ error: "Material not found" });

  const [material] = await db.update(materialsTable).set({
    name, description, category, unit,
    currentPrice: String(currentPrice),
    supplierId: supplierId || null,
    sku, url,
    lastUpdated: new Date(),
  }).where(eq(materialsTable.id, id)).returning();

  // Record price change if price changed
  if (parseFloat(existing.currentPrice) !== parseFloat(String(currentPrice))) {
    await db.insert(materialPriceHistoryTable).values({
      materialId: id,
      price: String(currentPrice),
      notes: "Price updated",
    });
  }

  const supplier = material.supplierId
    ? await db.select().from(suppliersTable).where(eq(suppliersTable.id, material.supplierId)).then(r => r[0])
    : null;

  res.json({
    ...material,
    supplierName: supplier?.name ?? null,
    currentPrice: parseFloat(material.currentPrice),
    lastUpdated: material.lastUpdated.toISOString(),
  });
});

router.delete("/materials/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  await db.delete(materialPriceHistoryTable).where(eq(materialPriceHistoryTable.materialId, id));
  await db.delete(materialsTable).where(eq(materialsTable.id, id));
  res.status(204).send();
});

router.get("/materials/:id/price-history", async (req, res) => {
  const id = parseInt(req.params.id);
  const history = await db
    .select()
    .from(materialPriceHistoryTable)
    .where(eq(materialPriceHistoryTable.materialId, id))
    .orderBy(materialPriceHistoryTable.recordedAt);

  res.json(history.map(h => ({
    ...h,
    price: parseFloat(h.price),
    recordedAt: h.recordedAt.toISOString(),
  })));
});

export default router;
