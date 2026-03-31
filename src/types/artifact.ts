import { z } from "zod/v4";

// ── Artifact Type Enum ──────────────────────────────────────

export const ArtifactTypeSchema = z.enum([
  "presentation",
  "landing_page",
  "thank_you",
  "attendance_chain",
  "gift",
]);

export type ArtifactType = z.infer<typeof ArtifactTypeSchema>;

// ── Artifact Status ─────────────────────────────────────────

export const ArtifactStatusSchema = z.enum([
  "pending",
  "generating",
  "completed",
  "failed",
]);

export type ArtifactStatus = z.infer<typeof ArtifactStatusSchema>;

// ── Content Schemas (owned by respective devs, defined here for contracts) ──

// Dev 1: Presentation (~90 slides: intro ~10, content ~50, sales ~30)
export const SlideSchema = z.object({
  slideNumber: z.number().int(),
  title: z.string(),
  body: z.string(),
  speakerNotes: z.string().optional(),
  visualDirection: z.string().optional(),
  layout: z.enum(["title", "text", "bullets", "image", "quote", "two_column", "cta"]).optional(),
});

export type Slide = z.infer<typeof SlideSchema>;

export const PresentationContentSchema = z.object({
  intro: z.array(SlideSchema),
  content: z.array(SlideSchema),
  sales: z.array(SlideSchema),
});

export type PresentationContent = z.infer<typeof PresentationContentSchema>;

// Dev 1: Landing Page Brief
export const LandingPageContentSchema = z.object({
  headline: z.string(),
  subheadline: z.string(),
  bullets: z.array(z.string()),
  socialProof: z.array(z.object({
    text: z.string(),
    author: z.string(),
  })),
  cta: z.object({
    text: z.string(),
    subtext: z.string().optional(),
  }),
  speakerBio: z.string(),
  urgencyBlock: z.string().optional(),
});

export type LandingPageContent = z.infer<typeof LandingPageContentSchema>;

// Dev 1: Thank-You Page
export const ThankYouContentSchema = z.object({
  headline: z.string(),
  body: z.string(),
  nextSteps: z.array(z.object({
    step: z.number().int(),
    title: z.string(),
    description: z.string(),
  })),
  giftDeliveryMessage: z.string().optional(),
});

export type ThankYouContent = z.infer<typeof ThankYouContentSchema>;

// Dev 2: Attendance Chain
export const AttendanceStageTypeSchema = z.enum([
  "registration_confirmation",
  "warmup",
  "day_of",
  "during_webinar",
  "post_webinar",
]);

export const ChannelSchema = z.enum(["email", "messenger", "sms"]);

export const AttendanceMessageSchema = z.object({
  channel: ChannelSchema,
  subject: z.string().optional(),
  body: z.string(),
  timing: z.string(),
});

export const AttendanceStageSchema = z.object({
  type: AttendanceStageTypeSchema,
  timing: z.string(),
  messages: z.array(AttendanceMessageSchema),
});

export const AttendanceChainContentSchema = z.object({
  stages: z.array(AttendanceStageSchema),
});

export type AttendanceChainContent = z.infer<typeof AttendanceChainContentSchema>;

// Dev 2: Gift Ideas
export const GiftItemSchema = z.object({
  title: z.string(),
  concept: z.string(),
  fullCopy: z.string(),
  visualBrief: z.string(),
});

export const GiftContentSchema = z.object({
  gifts: z.array(GiftItemSchema),
});

export type GiftContent = z.infer<typeof GiftContentSchema>;

// ── Discriminated Content Union ─────────────────────────────

export const ArtifactContentSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("presentation"), data: PresentationContentSchema }),
  z.object({ type: z.literal("landing_page"), data: LandingPageContentSchema }),
  z.object({ type: z.literal("thank_you"), data: ThankYouContentSchema }),
  z.object({ type: z.literal("attendance_chain"), data: AttendanceChainContentSchema }),
  z.object({ type: z.literal("gift"), data: GiftContentSchema }),
]);

export type ArtifactContent = z.infer<typeof ArtifactContentSchema>;

// ── Artifact ────────────────────────────────────────────────

export const ArtifactSchema = z.object({
  id: z.string().uuid(),
  webinarId: z.string().uuid(),
  type: ArtifactTypeSchema,
  status: ArtifactStatusSchema,
  content: z.any().nullable(),
  version: z.number().int().default(1),
  promptId: z.string().uuid().optional(),
  error: z.string().optional(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export type Artifact = z.infer<typeof ArtifactSchema>;

// ── Artifact Version ────────────────────────────────────────

export const ArtifactVersionSchema = z.object({
  id: z.string().uuid(),
  artifactId: z.string().uuid(),
  version: z.number().int(),
  content: z.any(),
  editedBy: z.enum(["ai", "user"]),
  changeDescription: z.string().optional(),
  createdAt: z.coerce.date(),
});

export type ArtifactVersion = z.infer<typeof ArtifactVersionSchema>;
