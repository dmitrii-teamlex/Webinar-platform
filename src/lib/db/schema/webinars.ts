import { pgTable, uuid, text, timestamp, pgEnum } from "drizzle-orm/pg-core";

export const webinarStatusEnum = pgEnum("webinar_status", [
  "draft",
  "sources_added",
  "ingesting",
  "theses_ready",
  "approved",
  "generating",
  "completed",
]);

export const webinars = pgTable("webinars", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  topic: text("topic").notNull(),
  date: timestamp("date", { withTimezone: true }).notNull(),
  targetAudience: text("target_audience").notNull().default(""),
  speakerName: text("speaker_name").notNull().default(""),
  speakerBio: text("speaker_bio"),
  status: webinarStatusEnum("status").notNull().default("draft"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
