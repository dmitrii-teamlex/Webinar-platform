import { pgTable, uuid, text, timestamp, boolean } from "drizzle-orm/pg-core";
import { artifactTypeEnum } from "./artifacts";

export const prompts = pgTable("prompts", {
  id: uuid("id").primaryKey().defaultRandom(),
  artifactType: artifactTypeEnum("artifact_type").notNull(),
  name: text("name").notNull(),
  systemPrompt: text("system_prompt").notNull(),
  userPromptTemplate: text("user_prompt_template").notNull(),
  isDefault: boolean("is_default").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
