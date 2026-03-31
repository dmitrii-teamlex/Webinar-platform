import { z } from "zod/v4";

// ── Webinar Status ──────────────────────────────────────────

export const WebinarStatusSchema = z.enum([
  "draft",
  "sources_added",
  "ingesting",
  "theses_ready",
  "approved",
  "generating",
  "completed",
]);

export type WebinarStatus = z.infer<typeof WebinarStatusSchema>;

// ── Source Types ─────────────────────────────────────────────

export const SourceTypeSchema = z.enum(["url", "pdf", "csv", "xlsx", "txt"]);
export type SourceType = z.infer<typeof SourceTypeSchema>;

export const SourceStatusSchema = z.enum([
  "pending",
  "processing",
  "completed",
  "failed",
]);
export type SourceStatus = z.infer<typeof SourceStatusSchema>;

// ── Webinar ─────────────────────────────────────────────────

export const WebinarSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1),
  topic: z.string().min(1),
  date: z.coerce.date(),
  targetAudience: z.string(),
  speakerName: z.string(),
  speakerBio: z.string().optional(),
  status: WebinarStatusSchema,
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export type Webinar = z.infer<typeof WebinarSchema>;

// ── Source ───────────────────────────────────────────────────

export const SourceSchema = z.object({
  id: z.string().uuid(),
  webinarId: z.string().uuid(),
  type: SourceTypeSchema,
  url: z.string().optional(),
  fileName: z.string().optional(),
  storagePath: z.string().optional(),
  status: SourceStatusSchema,
  extractedText: z.string().optional(),
  createdAt: z.coerce.date(),
});

export type Source = z.infer<typeof SourceSchema>;

// ── Thesis ──────────────────────────────────────────────────

export const ThesisSchema = z.object({
  id: z.string().uuid(),
  webinarId: z.string().uuid(),
  title: z.string().min(1),
  description: z.string(),
  order: z.number().int().min(0),
  approved: z.boolean().default(false),
  createdAt: z.coerce.date(),
});

export type Thesis = z.infer<typeof ThesisSchema>;

// ── Create / Update DTOs ────────────────────────────────────

export const CreateWebinarSchema = WebinarSchema.pick({
  title: true,
  topic: true,
  date: true,
  targetAudience: true,
  speakerName: true,
  speakerBio: true,
});

export type CreateWebinar = z.infer<typeof CreateWebinarSchema>;
