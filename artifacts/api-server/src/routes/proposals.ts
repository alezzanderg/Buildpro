import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { proposalsTable, clientsTable } from "@workspace/db/schema";
import { eq, sql } from "drizzle-orm";

const router: IRouter = Router();

// ── Simplified boilerplate defaults ──────────────────────────────────
const WARRANTY_PERIOD_DEFAULT = "1 year";

function makeWarrantyText(period: string): string {
  return `Our workmanship is warranted for ${period} from the date of substantial completion against defects caused by our installation or labor under normal use conditions. This warranty does not cover owner misuse, manufacturer defects, normal wear and tear, or damage caused by third parties or conditions outside our control.`;
}

const BOILERPLATE_DEFAULTS = {
  introText: "Thank you for the opportunity to provide this proposal for your project. Our goal is to deliver professional workmanship, clear communication, and an organized process from start to finish. This proposal outlines the scope of work, project assumptions, estimated timeline, payment terms, and conditions associated with the services requested.\n\nWe are committed to completing the work in a professional and timely manner while maintaining jobsite safety, cleanliness, and respect for the property. Any client-specific requests, selections, or special considerations should be documented and approved before work begins.",
  changeOrders:   "Any work outside the original scope requires written approval before proceeding. Change orders may affect the project price and timeline.",
  siteConditions: "This proposal is based on visible conditions at the time of the estimate. Hidden conditions discovered after work begins — including rot, mold, water damage, structural issues, or outdated systems — are not included in this price and will be communicated before any additional work is performed.",
  materials:      "Materials will be installed as specified or per approved selections. If a specified item becomes unavailable, a comparable substitute will be recommended for approval. Supply delays may affect the project schedule.",
  permits:        "Permits, engineering, inspections, and municipal approvals are excluded from this proposal unless explicitly stated. Any code-required upgrades discovered during the project may result in additional cost.",
  access:         "The client agrees to provide reasonable access to the work area during working hours and ensure utilities (water, electricity) are available as needed. The work area should be cleared of furniture, valuables, and personal items before work begins.",
  cleanup:        "Basic jobsite cleanup is included — construction debris from our work will be removed from active work areas. Deep cleaning, hazardous waste handling, and specialized disposal are excluded unless specifically listed.",
  warranty:       makeWarrantyText(WARRANTY_PERIOD_DEFAULT),
  cancellation:   "Deposits may be non-refundable once materials have been ordered or scheduling has begun. If the project is cancelled after acceptance, the client is responsible for work completed, materials ordered, and costs incurred to date.",
  liability:      "Our liability is limited to the value of contracted work performed. We are not liable for incidental, indirect, or consequential damages, or for pre-existing conditions not caused by our work.",
  // Default Basic mode config (6 core sections enabled)
  termsConfig: JSON.stringify({
    changeOrders: true, siteConditions: true, materials: false,
    permits: true, access: false, cleanup: true,
    warranty: true, cancellation: true, liability: false,
  }),
};

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

// ── List ──────────────────────────────────────────────────────────────
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

// ── Create ────────────────────────────────────────────────────────────
router.post("/proposals", async (req, res) => {
  const {
    clientId, projectName, status,
    introText, projectOverview, scopeOfWork, exclusions, allowances,
    deliverables, timeline, paymentTerms,
    changeOrders, siteConditions, materials, permits, access, cleanup,
    warranty, cancellation, liability,
    termsConfig, warrantyPeriod,
    terms, notes, validUntil,
  } = req.body;

  const period = warrantyPeriod || WARRANTY_PERIOD_DEFAULT;
  const proposalNumber = await nextProposalNumber();

  const [proposal] = await db.insert(proposalsTable).values({
    proposalNumber,
    clientId: clientId || null,
    projectName,
    status: status || "draft",
    introText:       introText       || BOILERPLATE_DEFAULTS.introText,
    projectOverview: projectOverview || null,
    scopeOfWork:     scopeOfWork     || null,
    exclusions:      exclusions      || null,
    allowances:      allowances      || null,
    deliverables:    deliverables    || null,
    timeline:        timeline        || null,
    paymentTerms:    paymentTerms    || null,
    changeOrders:    changeOrders    || BOILERPLATE_DEFAULTS.changeOrders,
    siteConditions:  siteConditions  || BOILERPLATE_DEFAULTS.siteConditions,
    materials:       materials       || BOILERPLATE_DEFAULTS.materials,
    permits:         permits         || BOILERPLATE_DEFAULTS.permits,
    access:          access          || BOILERPLATE_DEFAULTS.access,
    cleanup:         cleanup         || BOILERPLATE_DEFAULTS.cleanup,
    warranty:        warranty        || makeWarrantyText(period),
    cancellation:    cancellation    || BOILERPLATE_DEFAULTS.cancellation,
    liability:       liability       || BOILERPLATE_DEFAULTS.liability,
    termsConfig:     termsConfig     || BOILERPLATE_DEFAULTS.termsConfig,
    warrantyPeriod:  period,
    terms:           terms           || null,
    notes:           notes           || null,
    validUntil:      validUntil      || null,
  }).returning();

  const client = proposal.clientId
    ? await db.select({ name: clientsTable.name }).from(clientsTable).where(eq(clientsTable.id, proposal.clientId)).then(r => r[0])
    : null;

  res.status(201).json(fmt({ ...proposal, clientName: client?.name ?? null }));
});

// ── Get one ───────────────────────────────────────────────────────────
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
      projectOverview: proposalsTable.projectOverview,
      scopeOfWork: proposalsTable.scopeOfWork,
      exclusions: proposalsTable.exclusions,
      allowances: proposalsTable.allowances,
      deliverables: proposalsTable.deliverables,
      timeline: proposalsTable.timeline,
      paymentTerms: proposalsTable.paymentTerms,
      changeOrders: proposalsTable.changeOrders,
      siteConditions: proposalsTable.siteConditions,
      materials: proposalsTable.materials,
      permits: proposalsTable.permits,
      access: proposalsTable.access,
      cleanup: proposalsTable.cleanup,
      warranty: proposalsTable.warranty,
      cancellation: proposalsTable.cancellation,
      liability: proposalsTable.liability,
      termsConfig: proposalsTable.termsConfig,
      warrantyPeriod: proposalsTable.warrantyPeriod,
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

// ── Update ────────────────────────────────────────────────────────────
router.put("/proposals/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const {
    clientId, projectName, status, validUntil,
    introText, projectOverview, scopeOfWork, exclusions, allowances,
    deliverables, timeline, paymentTerms,
    changeOrders, siteConditions, materials, permits, access, cleanup,
    warranty, cancellation, liability,
    termsConfig, warrantyPeriod,
    terms, notes,
  } = req.body;

  const set: Record<string, unknown> = {};
  if (clientId       !== undefined) set.clientId       = clientId || null;
  if (projectName    !== undefined) set.projectName    = projectName;
  if (status         !== undefined) set.status         = status;
  if (validUntil     !== undefined) set.validUntil     = validUntil || null;
  if (introText      !== undefined) set.introText      = introText || null;
  if (projectOverview !== undefined) set.projectOverview = projectOverview || null;
  if (scopeOfWork    !== undefined) set.scopeOfWork    = scopeOfWork || null;
  if (exclusions     !== undefined) set.exclusions     = exclusions || null;
  if (allowances     !== undefined) set.allowances     = allowances || null;
  if (deliverables   !== undefined) set.deliverables   = deliverables || null;
  if (timeline       !== undefined) set.timeline       = timeline || null;
  if (paymentTerms   !== undefined) set.paymentTerms   = paymentTerms || null;
  if (changeOrders   !== undefined) set.changeOrders   = changeOrders || null;
  if (siteConditions !== undefined) set.siteConditions = siteConditions || null;
  if (materials      !== undefined) set.materials      = materials || null;
  if (permits        !== undefined) set.permits        = permits || null;
  if (access         !== undefined) set.access         = access || null;
  if (cleanup        !== undefined) set.cleanup        = cleanup || null;
  if (warranty       !== undefined) set.warranty       = warranty || null;
  if (cancellation   !== undefined) set.cancellation   = cancellation || null;
  if (liability      !== undefined) set.liability      = liability || null;
  if (termsConfig    !== undefined) set.termsConfig    = termsConfig || null;
  if (warrantyPeriod !== undefined) set.warrantyPeriod = warrantyPeriod || WARRANTY_PERIOD_DEFAULT;
  if (terms          !== undefined) set.terms          = terms || null;
  if (notes          !== undefined) set.notes          = notes || null;

  const [proposal] = await db.update(proposalsTable)
    .set(set as Partial<typeof proposalsTable.$inferInsert>)
    .where(eq(proposalsTable.id, id))
    .returning();
  if (!proposal) return res.status(404).json({ error: "Proposal not found" });

  const client = proposal.clientId
    ? await db.select({ name: clientsTable.name }).from(clientsTable).where(eq(clientsTable.id, proposal.clientId)).then(r => r[0])
    : null;

  res.json(fmt({ ...proposal, clientName: client?.name ?? null }));
});

// ── Delete ────────────────────────────────────────────────────────────
router.delete("/proposals/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  await db.delete(proposalsTable).where(eq(proposalsTable.id, id));
  res.status(204).send();
});

export default router;
