import { Hono } from "hono";
import { getAnalyticsRisks } from "../../controllers/analytics/get-analytics-risks";
import { getAnalyticsSummary } from "../../controllers/analytics/get-analytics-summary";
import { Bindings } from "../../lib/common/types";

const analyticsRoutes = new Hono<{ Bindings: Bindings }>();

analyticsRoutes.get("/summary", getAnalyticsSummary);
analyticsRoutes.get("/risks", getAnalyticsRisks);

export default analyticsRoutes;
