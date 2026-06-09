import { D1Database } from "@cloudflare/workers-types";
import { drizzle } from "drizzle-orm/d1";
import * as schema from "../../schema/schema";
import type { Bindings } from "../common/types";

export const getDrizzleDb = (d1: D1Database) => {
  return drizzle(d1, { schema });
};

// call db to use db derectly into the controller functions
export const useDB = (c: { env: Bindings }) => {
  return drizzle(c.env.DB, { schema });
};
