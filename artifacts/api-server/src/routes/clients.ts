import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { clientsTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

router.get("/clients", async (req, res) => {
  const clients = await db.select().from(clientsTable).orderBy(clientsTable.name);
  res.json(clients.map(c => ({
    ...c,
    createdAt: c.createdAt.toISOString(),
  })));
});

router.post("/clients", async (req, res) => {
  const { name, email, phone, address, city, state, zip, notes } = req.body;
  const [client] = await db.insert(clientsTable).values({ name, email, phone, address, city, state, zip, notes }).returning();
  res.status(201).json({ ...client, createdAt: client.createdAt.toISOString() });
});

router.get("/clients/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const [client] = await db.select().from(clientsTable).where(eq(clientsTable.id, id));
  if (!client) return res.status(404).json({ error: "Client not found" });
  res.json({ ...client, createdAt: client.createdAt.toISOString() });
});

router.put("/clients/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const { name, email, phone, address, city, state, zip, notes } = req.body;
  const [client] = await db.update(clientsTable).set({ name, email, phone, address, city, state, zip, notes }).where(eq(clientsTable.id, id)).returning();
  if (!client) return res.status(404).json({ error: "Client not found" });
  res.json({ ...client, createdAt: client.createdAt.toISOString() });
});

router.delete("/clients/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  await db.delete(clientsTable).where(eq(clientsTable.id, id));
  res.status(204).send();
});

export default router;
