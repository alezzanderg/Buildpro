import { pgTable, serial, text, timestamp, integer } from "drizzle-orm/pg-core";
import { clientsTable } from "./clients";

export const proposalsTable = pgTable("proposals", {
  id: serial("id").primaryKey(),
  proposalNumber: text("proposal_number").notNull().unique(),
  clientId: integer("client_id").references(() => clientsTable.id),
  projectName: text("project_name").notNull(),
  status: text("status").notNull().default("draft"),
  // ── Client-specific sections ──────────────────────────────
  introText:       text("intro_text"),
  projectOverview: text("project_overview"),
  scopeOfWork:     text("scope_of_work"),
  exclusions:      text("exclusions"),
  allowances:      text("allowances"),
  deliverables:    text("deliverables"),
  timeline:        text("timeline"),
  paymentTerms:    text("payment_terms"),
  // ── Standard boilerplate sections (pre-filled) ───────────
  changeOrders:    text("change_orders"),
  siteConditions:  text("site_conditions"),
  materials:       text("materials"),
  permits:         text("permits"),
  access:          text("access"),
  cleanup:         text("cleanup"),
  warranty:        text("warranty"),
  cancellation:    text("cancellation"),
  liability:       text("liability"),
  // ── Terms configuration ──────────────────────────────────
  termsConfig:     text("terms_config"),   // JSON: { changeOrders: true, materials: false, ... }
  warrantyPeriod:  text("warranty_period").default("1 year"),
  // ── Legacy / internal ────────────────────────────────────
  terms:           text("terms"),
  notes:           text("notes"),
  validUntil:      text("valid_until"),
  createdAt:       timestamp("created_at").defaultNow().notNull(),
});

export type Proposal = typeof proposalsTable.$inferSelect;
