import { pgTable, uuid, text, timestamp, integer, jsonb, pgEnum } from "drizzle-orm/pg-core";
import { webinars } from "./webinars";

export const artifactTypeEnum = pgEnum("artifact_type", [
  "presentation",
  "landing_page",
  "thank_you",
  "attendance_chain",
  "gift",
]);

export const artifactStatusEnum = pgEnum("artifact_status", [
  "pending",
  "generating",
  "completed",
  "failed",
]);

export const editedByEnum = pgEnum("edited_by", ["ai", "user"]);

export const artifacts = pgTable("artifacts", {
  id: uuid("id").primaryKey().defaultRandom(),
  webinarId: uuid("webinar_id")
    .notNull()
    .references(() => webinars.id, { onDelete: "cascade" }),
  type: artifactTypeEnum("type").notNull(),
  status: artifactStatusEnum("status").notNull().default("pending"),
  content: jsonb("content"),
  version: integer("version").notNull().default(1),
  promptId: uuid("prompt_id"),
  error: text("error"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const artifactVersions = pgTable("artifact_versions", {
  id: uuid("id").primaryKey().defaultRandom(),
  artifactId: uuid("artifact_id")
    .notNull()
    .references(() => artifacts.id, { onDelete: "cascade" }),
  version: integer("version").notNull(),
  content: jsonb("content").notNull(),
  editedBy: editedByEnum("edited_by").notNull(),
  changeDescription: text("change_description"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
