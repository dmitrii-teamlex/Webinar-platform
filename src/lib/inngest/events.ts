// Re-export all event types for convenience
export type {
  WebinarCreatedEvent,
  SourceAddedEvent,
  IngestionCompletedEvent,
  ThesesGeneratedEvent,
  WebinarApprovedEvent,
  ArtifactGenerationRequestedEvent,
  ArtifactGenerationCompletedEvent,
  ArtifactGenerationFailedEvent,
  ArtifactRegenerationRequestedEvent,
  WebinarPlatformEvents,
} from "@/types/events";

// Event name constants for type-safe references
export const EVENTS = {
  WEBINAR_CREATED: "webinar/created",
  SOURCE_ADDED: "webinar/source.added",
  INGESTION_COMPLETED: "webinar/ingestion.completed",
  THESES_GENERATED: "webinar/theses.generated",
  WEBINAR_APPROVED: "webinar/approved",
  ARTIFACT_GENERATION_REQUESTED: "artifact/generation.requested",
  ARTIFACT_GENERATION_COMPLETED: "artifact/generation.completed",
  ARTIFACT_GENERATION_FAILED: "artifact/generation.failed",
  ARTIFACT_REGENERATION_REQUESTED: "artifact/regeneration.requested",
} as const;
