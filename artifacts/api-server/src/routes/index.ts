import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import clientsRouter from "./clients.js";
import suppliersRouter from "./suppliers.js";
import materialsRouter from "./materials.js";
import estimatesRouter from "./estimates.js";
import invoicesRouter from "./invoices.js";
import dashboardRouter from "./dashboard.js";
import proposalsRouter from "./proposals.js";
import enhanceRouter from "./enhance.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use(clientsRouter);
router.use(suppliersRouter);
router.use(materialsRouter);
router.use(estimatesRouter);
router.use(invoicesRouter);
router.use(dashboardRouter);
router.use(proposalsRouter);
router.use(enhanceRouter);

export default router;
