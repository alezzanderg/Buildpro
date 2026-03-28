import { pgTable, serial, text, timestamp, integer } from "drizzle-orm/pg-core";
import { clientsTable } from "./clients";

export const proposalsTable = pgTable("proposals", {
  id: serial("id").primaryKey(),
  proposalNumber: text("proposal_number").notNull().unique(),
  clientId: integer("client_id").references(() => clientsTable.id),
  projectName: text("project_name").notNull(),
  status: text("status").notNull().default("draft"),
  introText: text("intro_text"),
  scopeOfWork: text("scope_of_work"),
  deliverables: text("deliverables"),
  timeline: text("timeline"),
  paymentTerms: text("payment_terms"),
  terms: text("terms"),
  notes: text("notes"),
  validUntil: text("valid_until"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Proposal = typeof proposalsTable.$inferSelect;
