import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { settingsTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

async function getOrCreateSettings() {
  const rows = await db.select().from(settingsTable).where(eq(settingsTable.id, 1));
  if (rows.length) return rows[0];
  const [created] = await db.insert(settingsTable).values({ id: 1 }).returning();
  return created;
}

function fmt(s: typeof settingsTable.$inferSelect) {
  return {
    ...s,
    defaultTaxRate: parseFloat(s.defaultTaxRate),
    defaultMarkup: parseFloat(s.defaultMarkup),
    updatedAt: s.updatedAt.toISOString(),
  };
}

router.get("/settings", async (_req, res) => {
  const s = await getOrCreateSettings();
  res.json(fmt(s));
});

router.put("/settings", async (req, res) => {
  const {
    companyName, companyEmail, companyPhone, companyAddress,
    companyCity, companyState, companyZip, companyLicense,
    companyWebsite, defaultTaxRate, defaultMarkup, logoUrl,
  } = req.body;

  await getOrCreateSettings();

  const [updated] = await db.update(settingsTable).set({
    ...(companyName    !== undefined ? { companyName }    : {}),
    ...(companyEmail   !== undefined ? { companyEmail }   : {}),
    ...(companyPhone   !== undefined ? { companyPhone }   : {}),
    ...(companyAddress !== undefined ? { companyAddress } : {}),
    ...(companyCity    !== undefined ? { companyCity }    : {}),
    ...(companyState   !== undefined ? { companyState }   : {}),
    ...(companyZip     !== undefined ? { companyZip }     : {}),
    ...(companyLicense !== undefined ? { companyLicense } : {}),
    ...(companyWebsite !== undefined ? { companyWebsite } : {}),
    ...(defaultTaxRate !== undefined ? { defaultTaxRate: String(defaultTaxRate) } : {}),
    ...(defaultMarkup  !== undefined ? { defaultMarkup:  String(defaultMarkup)  } : {}),
    ...(logoUrl        !== undefined ? { logoUrl }        : {}),
    updatedAt: new Date(),
  }).where(eq(settingsTable.id, 1)).returning();

  res.json(fmt(updated));
});

export default router;
