import { pgTable, uuid, text, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { webinars } from "./webinars";

export const sourceTypeEnum = pgEnum("source_type", [
  "url",
  "pdf",
  "csv",
  "xlsx",
  "txt",
]);

export const sourceStatusEnum = pgEnum("source_status", [
  "pending",
  "processing",
  "completed",
  "failed",
]);

export const sources = pgTable("sources", {
  id: uuid("id").primaryKey().defaultRandom(),
  webinarId: uuid("webinar_id")
    .notNull()
    .references(() => webinars.id, { onDelete: "cascade" }),
  type: sourceTypeEnum("type").notNull(),
  url: text("url"),
  fileName: text("file_name"),
  storagePath: text("storage_path"),
  status: sourceStatusEnum("status").notNull().default("pending"),
  extractedText: text("extracted_text"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
