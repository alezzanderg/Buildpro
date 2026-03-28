import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { proposalsTable, clientsTable } from "@workspace/db/schema";
import { eq, sql } from "drizzle-orm";

const router: IRouter = Router();

async function nextProposalNumber(): Promise<string> {
  const rows = await db
    .select({ num: proposalsTable.proposalNumber })
    .from(proposalsTable)
    .orderBy(sql`LENGTH(proposal_number) DESC, proposal_number DESC`)
    .limit(1);
  if (!rows.length) return "PROP-0001";
  const last = parseInt(rows[0].num.replace("PROP-", ""), 10);
  return `PROP-${String(last + 1).padStart(4, "0")}`;
}

function fmt(p: typeof proposalsTable.$inferSelect & { clientName?: string | null }) {
  return { ...p, clientName: p.clientName ?? null, createdAt: p.createdAt.toISOString() };
}

router.get("/proposals", async (_req, res) => {
  const rows = await db
    .select({
      id: proposalsTable.id,
      proposalNumber: proposalsTable.proposalNumber,
      clientId: proposalsTable.clientId,
      clientName: clientsTable.name,
      projectName: proposalsTable.projectName,
      status: proposalsTable.status,
      validUntil: proposalsTable.validUntil,
      createdAt: proposalsTable.createdAt,
    })
    .from(proposalsTable)
    .leftJoin(clientsTable, eq(proposalsTable.clientId, clientsTable.id))
    .orderBy(sql`${proposalsTable.createdAt} DESC`);
  res.json(rows.map(r => ({ ...r, clientName: r.clientName ?? null, createdAt: r.createdAt.toISOString() })));
});

router.post("/proposals", async (req, res) => {
  const { clientId, projectName, status, introText, scopeOfWork, deliverables, timeline, paymentTerms, terms, notes, validUntil } = req.body;
  const proposalNumber = await nextProposalNumber();
  const [proposal] = await db.insert(proposalsTable).values({
    proposalNumber,
    clientId: clientId || null,
    projectName,
    status: status || "draft",
    introText: introText || null,
    scopeOfWork: scopeOfWork || null,
    deliverables: deliverables || null,
    timeline: timeline || null,
    paymentTerms: paymentTerms || null,
    terms: terms || null,
    notes: notes || null,
    validUntil: validUntil || null,
  }).returning();

  const client = proposal.clientId
    ? await db.select({ name: clientsTable.name }).from(clientsTable).where(eq(clientsTable.id, proposal.clientId)).then(r => r[0])
    : null;

  res.status(201).json(fmt({ ...proposal, clientName: client?.name ?? null }));
});

router.get("/proposals/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const [row] = await db
    .select({
      id: proposalsTable.id,
      proposalNumber: proposalsTable.proposalNumber,
      clientId: proposalsTable.clientId,
      clientName: clientsTable.name,
      projectName: proposalsTable.projectName,
      status: proposalsTable.status,
      introText: proposalsTable.introText,
      scopeOfWork: proposalsTable.scopeOfWork,
      deliverables: proposalsTable.deliverables,
      timeline: proposalsTable.timeline,
      paymentTerms: proposalsTable.paymentTerms,
      terms: proposalsTable.terms,
      notes: proposalsTable.notes,
      validUntil: proposalsTable.validUntil,
      createdAt: proposalsTable.createdAt,
    })
    .from(proposalsTable)
    .leftJoin(clientsTable, eq(proposalsTable.clientId, clientsTable.id))
    .where(eq(proposalsTable.id, id));
  if (!row) return res.status(404).json({ error: "Proposal not found" });
  res.json(fmt({ ...row, clientName: row.clientName ?? null }));
});

router.put("/proposals/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const { clientId, projectName, status, introText, scopeOfWork, deliverables, timeline, paymentTerms, terms, notes, validUntil } = req.body;
  const [proposal] = await db.update(proposalsTable).set({
    ...(clientId !== undefined ? { clientId: clientId || null } : {}),
    ...(projectName !== undefined ? { projectName } : {}),
    ...(status !== undefined ? { status } : {}),
    ...(introText !== undefined ? { introText: introText || null } : {}),
    ...(scopeOfWork !== undefined ? { scopeOfWork: scopeOfWork || null } : {}),
    ...(deliverables !== undefined ? { deliverables: deliverables || null } : {}),
    ...(timeline !== undefined ? { timeline: timeline || null } : {}),
    ...(paymentTerms !== undefined ? { paymentTerms: paymentTerms || null } : {}),
    ...(terms !== undefined ? { terms: terms || null } : {}),
    ...(notes !== undefined ? { notes: notes || null } : {}),
    ...(validUntil !== undefined ? { validUntil: validUntil || null } : {}),
  }).where(eq(proposalsTable.id, id)).returning();
  if (!proposal) return res.status(404).json({ error: "Proposal not found" });

  const client = proposal.clientId
    ? await db.select({ name: clientsTable.name }).from(clientsTable).where(eq(clientsTable.id, proposal.clientId)).then(r => r[0])
    : null;

  res.json(fmt({ ...proposal, clientName: client?.name ?? null }));
});

router.delete("/proposals/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  await db.delete(proposalsTable).where(eq(proposalsTable.id, id));
  res.status(204).send();
});

export default router;
