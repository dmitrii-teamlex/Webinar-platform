import { pgTable, uuid, text, timestamp, integer, boolean } from "drizzle-orm/pg-core";
import { webinars } from "./webinars";

export const theses = pgTable("theses", {
  id: uuid("id").primaryKey().defaultRandom(),
  webinarId: uuid("webinar_id")
    .notNull()
    .references(() => webinars.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description").notNull().default(""),
  order: integer("order").notNull().default(0),
  approved: boolean("approved").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
