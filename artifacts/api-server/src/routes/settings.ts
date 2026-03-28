import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { settingsTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { ObjectStorageService, ObjectNotFoundError } from "../lib/objectStorage";

const router: IRouter = Router();
const objectStorageService = new ObjectStorageService();

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

/**
 * GET /settings/logo-data
 * Returns the company logo as a base64 data URL so react-pdf can embed it
 * without making any network requests from its render worker.
 */
router.get("/settings/logo-data", async (req, res) => {
  try {
    const s = await getOrCreateSettings();
    if (!s.logoUrl) {
      res.json({ dataUrl: null });
      return;
    }
    const objectFile = await objectStorageService.getObjectEntityFile(s.logoUrl);
    const [metadata] = await objectFile.getMetadata();
    const contentType = (metadata.contentType as string) || "image/png";
    const chunks: Buffer[] = [];
    const stream = objectFile.createReadStream();
    await new Promise<void>((resolve, reject) => {
      stream.on("data", (chunk: Buffer) => chunks.push(chunk));
      stream.on("end", resolve);
      stream.on("error", reject);
    });
    const buffer = Buffer.concat(chunks);
    const dataUrl = `data:${contentType};base64,${buffer.toString("base64")}`;
    res.setHeader("Cache-Control", "private, max-age=300");
    res.json({ dataUrl });
  } catch (err) {
    if (err instanceof ObjectNotFoundError) {
      res.json({ dataUrl: null });
      return;
    }
    req.log.error({ err }, "Error fetching logo data");
    res.status(500).json({ error: "Failed to load logo" });
  }
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
