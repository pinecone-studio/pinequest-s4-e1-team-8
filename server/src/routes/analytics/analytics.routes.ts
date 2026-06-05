import { Hono } from "hono";
import { getAnalyticsRisks } from "../../controllers/analytics/get-analytics-risks";
import { getAnalyticsSummary } from "../../controllers/analytics/get-analytics-summary";
import { getAnalyticsWeekly } from "../../controllers/analytics/get-analytics-weekly";
import { postAnalyticsWeeklySummary } from "../../controllers/analytics/post-analytics-weekly-summary";
import { Bindings } from "../../lib/common/types";

const analyticsRoutes = new Hono<{ Bindings: Bindings }>();

analyticsRoutes.get("/summary", getAnalyticsSummary);
analyticsRoutes.get("/risks", getAnalyticsRisks);
analyticsRoutes.get("/weekly", getAnalyticsWeekly);
analyticsRoutes.post("/weekly-summary", postAnalyticsWeeklySummary);

export default analyticsRoutes;
