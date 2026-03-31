import { pgTable, uuid, text, timestamp, integer, vector } from "drizzle-orm/pg-core";
import { webinars } from "./webinars";

export const embeddings = pgTable("embeddings", {
  id: uuid("id").primaryKey().defaultRandom(),
  webinarId: uuid("webinar_id")
    .notNull()
    .references(() => webinars.id, { onDelete: "cascade" }),
  sourceId: uuid("source_id"),
  chunkText: text("chunk_text").notNull(),
  chunkIndex: integer("chunk_index").notNull().default(0),
  embedding: vector("embedding", { dimensions: 1536 }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const knowledgeBaseFiles = pgTable("knowledge_base_files", {
  id: uuid("id").primaryKey().defaultRandom(),
  fileName: text("file_name").notNull(),
  storagePath: text("storage_path").notNull(),
  extractedText: text("extracted_text"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
