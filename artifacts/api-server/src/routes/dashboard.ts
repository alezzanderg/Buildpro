import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { estimatesTable, invoicesTable } from "@workspace/db/schema";
import { eq, sum, avg, count, sql } from "drizzle-orm";

const router: IRouter = Router();

router.get("/dashboard/stats", async (_req, res) => {
  const [estimateStats] = await db.select({
    total: count(),
    pending: sql<number>`count(*) filter (where status in ('draft', 'sent'))`,
    approved: sql<number>`count(*) filter (where status = 'approved')`,
  }).from(estimatesTable);

  const [invoiceStats] = await db.select({
    total: count(),
    paid: sql<number>`count(*) filter (where status = 'paid')`,
    overdue: sql<number>`count(*) filter (where status = 'overdue')`,
    totalRevenue: sql<string>`coalesce(sum(total) filter (where status = 'paid'), 0)`,
    pendingRevenue: sql<string>`coalesce(sum(amount_due) filter (where status in ('sent', 'draft')), 0)`,
    totalProfit: sql<string>`coalesce(sum(total) filter (where status = 'paid'), 0)`,
  }).from(invoicesTable);

  const [profitStats] = await db.select({
    avgMargin: sql<string>`coalesce(avg(profit_margin), 0)`,
    totalProfit: sql<string>`coalesce(sum(total * profit_margin / 100), 0)`,
  }).from(estimatesTable).where(eq(estimatesTable.status, 'approved'));

  res.json({
    totalEstimates: estimateStats?.total ?? 0,
    pendingEstimates: estimateStats?.pending ?? 0,
    approvedEstimates: estimateStats?.approved ?? 0,
    totalInvoices: invoiceStats?.total ?? 0,
    paidInvoices: invoiceStats?.paid ?? 0,
    overdueInvoices: invoiceStats?.overdue ?? 0,
    totalRevenue: parseFloat(invoiceStats?.totalRevenue ?? "0"),
    pendingRevenue: parseFloat(invoiceStats?.pendingRevenue ?? "0"),
    totalProfit: parseFloat(profitStats?.totalProfit ?? "0"),
    avgProfitMargin: parseFloat(profitStats?.avgMargin ?? "0"),
  });
});

export default router;
