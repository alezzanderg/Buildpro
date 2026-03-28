import { pgTable, serial, text, numeric, timestamp } from "drizzle-orm/pg-core";

export const settingsTable = pgTable("settings", {
  id: serial("id").primaryKey(),
  companyName: text("company_name").notNull().default("ProBuilder"),
  companyEmail: text("company_email").notNull().default(""),
  companyPhone: text("company_phone").notNull().default(""),
  companyAddress: text("company_address").notNull().default(""),
  companyCity: text("company_city").notNull().default(""),
  companyState: text("company_state").notNull().default(""),
  companyZip: text("company_zip").notNull().default(""),
  companyLicense: text("company_license").notNull().default(""),
  companyWebsite: text("company_website").notNull().default(""),
  logoUrl: text("logo_url").default(""),
  defaultTaxRate: numeric("default_tax_rate", { precision: 8, scale: 3 }).notNull().default("0"),
  defaultMarkup: numeric("default_markup", { precision: 8, scale: 3 }).notNull().default("0"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type Settings = typeof settingsTable.$inferSelect;
