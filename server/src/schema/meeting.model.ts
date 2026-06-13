import { relations } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { users } from "./user.model";

export const meetings = sqliteTable("meetings", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date())
    .$onUpdateFn(() => new Date()),
});

export const meetingTranscriptSegments = sqliteTable("meeting_transcript_segments", {
  id: text("id").primaryKey(),
  meetingId: text("meeting_id")
    .notNull()
    .references(() => meetings.id, { onDelete: "cascade" }),
  speakerName: text("speaker_name").notNull(),
  text: text("text").notNull(),
  timestamp: integer("timestamp", { mode: "timestamp" }).notNull(),
});

export type MeetingSummaryActionItem = {
  owner: string;
  action: string;
};

export const meetingSummaries = sqliteTable("meeting_summaries", {
  id: text("id").primaryKey(),
  meetingId: text("meeting_id")
    .notNull()
    .unique()
    .references(() => meetings.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  keyPoints: text("key_points", { mode: "json" }).$type<string[]>(),
  actionItems: text("action_items", { mode: "json" }).$type<
    MeetingSummaryActionItem[]
  >(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date())
    .$onUpdateFn(() => new Date()),
});

export const meetingsRelations = relations(meetings, ({ one, many }) => ({
  owner: one(users, {
    fields: [meetings.userId],
    references: [users.id],
  }),
  transcriptSegments: many(meetingTranscriptSegments),
  summary: one(meetingSummaries, {
    fields: [meetings.id],
    references: [meetingSummaries.meetingId],
  }),
}));

export const meetingTranscriptSegmentsRelations = relations(meetingTranscriptSegments, ({ one }) => ({
  meeting: one(meetings, {
    fields: [meetingTranscriptSegments.meetingId],
    references: [meetings.id],
  }),
}));

export const meetingSummariesRelations = relations(meetingSummaries, ({ one }) => ({
  meeting: one(meetings, {
    fields: [meetingSummaries.meetingId],
    references: [meetings.id],
  }),
}));

export type Meeting = typeof meetings.$inferSelect;
export type NewMeeting = typeof meetings.$inferInsert;

export type MeetingTranscriptSegment = typeof meetingTranscriptSegments.$inferSelect;
export type NewMeetingTranscriptSegment = typeof meetingTranscriptSegments.$inferInsert;

export type MeetingSummary = typeof meetingSummaries.$inferSelect;
export type NewMeetingSummary = typeof meetingSummaries.$inferInsert;
