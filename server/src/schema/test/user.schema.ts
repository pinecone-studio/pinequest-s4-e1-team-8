import { int, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const usersTable = sqliteTable("users_table", {
  id: int("id").primaryKey({ autoIncrement: true }),
  role: text("role"),
  name: text("name"),
  email: text("email").unique(),
  password: text("password"),
  age: int("age"),
  tel: text("tel"),
});
