import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { suppliersTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

router.get("/suppliers", async (_req, res) => {
  const suppliers = await db.select().from(suppliersTable).orderBy(suppliersTable.name);
  res.json(suppliers);
});

router.post("/suppliers", async (req, res) => {
  const { name, website, phone, notes } = req.body;
  const [supplier] = await db.insert(suppliersTable).values({ name, website, phone, notes }).returning();
  res.status(201).json(supplier);
});

router.put("/suppliers/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const { name, website, phone, notes } = req.body;
  const [supplier] = await db.update(suppliersTable).set({ name, website, phone, notes }).where(eq(suppliersTable.id, id)).returning();
  if (!supplier) return res.status(404).json({ error: "Supplier not found" });
  res.json(supplier);
});

router.delete("/suppliers/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  await db.delete(suppliersTable).where(eq(suppliersTable.id, id));
  res.status(204).send();
});

export default router;
