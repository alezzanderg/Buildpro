import { pgTable, serial, text, numeric, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { clientsTable } from "./clients";
import { materialsTable } from "./materials";
import { suppliersTable } from "./suppliers";

export const estimatesTable = pgTable("estimates", {
  id: serial("id").primaryKey(),
  estimateNumber: text("estimate_number").notNull().unique(),
  clientId: integer("client_id").references(() => clientsTable.id),
  projectName: text("project_name").notNull(),
  status: text("status").notNull().default("draft"),
  subtotal: numeric("subtotal", { precision: 12, scale: 2 }).notNull().default("0"),
  materialsCost: numeric("materials_cost", { precision: 12, scale: 2 }).notNull().default("0"),
  laborCost: numeric("labor_cost", { precision: 12, scale: 2 }).notNull().default("0"),
  markupPercent: numeric("markup_percent", { precision: 5, scale: 2 }).notNull().default("0"),
  markupAmount: numeric("markup_amount", { precision: 12, scale: 2 }).notNull().default("0"),
  taxPercent: numeric("tax_percent", { precision: 5, scale: 2 }).notNull().default("0"),
  taxAmount: numeric("tax_amount", { precision: 12, scale: 2 }).notNull().default("0"),
  total: numeric("total", { precision: 12, scale: 2 }).notNull().default("0"),
  profitMargin: numeric("profit_margin", { precision: 5, scale: 2 }).notNull().default("0"),
  notes: text("notes"),
  validUntil: text("valid_until"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const lineItemsTable = pgTable("line_items", {
  id: serial("id").primaryKey(),
  estimateId: integer("estimate_id").references(() => estimatesTable.id).notNull(),
  type: text("type").notNull().default("material"),
  category: text("category"),
  description: text("description").notNull(),
  quantity: numeric("quantity", { precision: 12, scale: 3 }).notNull().default("1"),
  unit: text("unit"),
  unitCost: numeric("unit_cost", { precision: 12, scale: 2 }).notNull().default("0"),
  total: numeric("total", { precision: 12, scale: 2 }).notNull().default("0"),
  materialId: integer("material_id").references(() => materialsTable.id),
  supplierId: integer("supplier_id").references(() => suppliersTable.id),
  supplierName: text("supplier_name"),
  notes: text("notes"),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const insertEstimateSchema = createInsertSchema(estimatesTable).omit({
  id: true, createdAt: true, estimateNumber: true,
  subtotal: true, materialsCost: true, laborCost: true,
  markupAmount: true, taxAmount: true, total: true, profitMargin: true,
});
export type InsertEstimate = z.infer<typeof insertEstimateSchema>;
export type Estimate = typeof estimatesTable.$inferSelect;

export const insertLineItemSchema = createInsertSchema(lineItemsTable).omit({ id: true, total: true });
export type InsertLineItem = z.infer<typeof insertLineItemSchema>;
export type LineItem = typeof lineItemsTable.$inferSelect;
