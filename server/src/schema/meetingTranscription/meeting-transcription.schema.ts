import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const meetingTranscriptions = sqliteTable("meeting_transcriptions", {
  id: text("id").primaryKey(),
  meetingId: text("meeting_id").notNull(),
  roomName: text("room_name").notNull(),
  audioUrl: text("audio_url"),
  egressId: text("egress_id"),
  transcript: text("transcript"),
  summary: text("summary"),
  errorMessage: text("error_message"),
  status: text("status", {
    enum: ["pending", "processing", "done", "failed"],
  })
    .notNull()
    .default("pending"),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(
    () => new Date(),
  ),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$onUpdateFn(
    () => new Date(),
  ),
  completedAt: integer("completed_at", { mode: "timestamp" }),
});

export type MeetingTranscription = typeof meetingTranscriptions.$inferSelect;
export type NewMeetingTranscription = typeof meetingTranscriptions.$inferInsert;
