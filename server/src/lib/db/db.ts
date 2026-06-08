import { D1Database } from "@cloudflare/workers-types";
import { drizzle } from "drizzle-orm/d1";
import { Context } from "hono";
import * as schema from "../../schema/schema";
import type { Bindings } from "../common/types";

export const getDrizzleDb = (d1: D1Database) => {
  return drizzle(d1, { schema });
};

export const useDB = (c: Context<{ Bindings: Bindings }>) => {
  return drizzle(c.env.DB, { schema });
};
