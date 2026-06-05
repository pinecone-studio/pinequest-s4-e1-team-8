import { Hono } from "hono";
import { getAnalyticsSummary } from "../../controllers/analytics/get-analytics-summary";
import { Bindings } from "../../lib/common/types";

const analyticsRoutes = new Hono<{ Bindings: Bindings }>();

analyticsRoutes.get("/summary", getAnalyticsSummary);

export default analyticsRoutes;
