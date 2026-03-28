import { pgTable, serial, text, numeric, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { suppliersTable } from "./suppliers";

export const materialsTable = pgTable("materials", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  category: text("category"),
  unit: text("unit"),
  currentPrice: numeric("current_price", { precision: 12, scale: 2 }).notNull().default("0"),
  supplierId: integer("supplier_id").references(() => suppliersTable.id),
  sku: text("sku"),
  url: text("url"),
  lastUpdated: timestamp("last_updated").defaultNow().notNull(),
});

export const materialPriceHistoryTable = pgTable("material_price_history", {
  id: serial("id").primaryKey(),
  materialId: integer("material_id").references(() => materialsTable.id).notNull(),
  price: numeric("price", { precision: 12, scale: 2 }).notNull(),
  recordedAt: timestamp("recorded_at").defaultNow().notNull(),
  notes: text("notes"),
});

export const insertMaterialSchema = createInsertSchema(materialsTable).omit({ id: true, lastUpdated: true });
export type InsertMaterial = z.infer<typeof insertMaterialSchema>;
export type Material = typeof materialsTable.$inferSelect;

export const insertPriceHistorySchema = createInsertSchema(materialPriceHistoryTable).omit({ id: true, recordedAt: true });
export type InsertPriceHistory = z.infer<typeof insertPriceHistorySchema>;
export type PriceHistory = typeof materialPriceHistoryTable.$inferSelect;
