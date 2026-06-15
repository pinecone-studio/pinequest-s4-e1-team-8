import { relations } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { users } from "./user.model";

export type StandaloneScriptSegment = {
  speakerLabel: string;
  text: string;
};

export const standaloneRecordings = sqliteTable("standalone_recordings", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  audioUrl: text("audio_url").notNull(),
  status: text("status", {
    enum: ["pending", "processing", "done", "failed"],
  })
    .notNull()
    .default("processing"),
  speakerCount: integer("speaker_count"),
  transcript: text("transcript"),
  keyPoints: text("key_points", { mode: "json" }).$type<string[]>(),
  scriptSegments: text("script_segments", { mode: "json" }).$type<
    StandaloneScriptSegment[]
  >(),
  errorMessage: text("error_message"),
  durationSeconds: integer("duration_seconds"),
  fileSizeBytes: integer("file_size_bytes"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date())
    .$onUpdateFn(() => new Date()),
});

export const standaloneRecordingsRelations = relations(
  standaloneRecordings,
  ({ one }) => ({
    owner: one(users, {
      fields: [standaloneRecordings.userId],
      references: [users.id],
    }),
  }),
);

export type StandaloneRecording = typeof standaloneRecordings.$inferSelect;
export type NewStandaloneRecording = typeof standaloneRecordings.$inferInsert;
