import type { ArtifactType } from "./artifact";

// ── Inngest Event Payloads ──────────────────────────────────

export type WebinarCreatedEvent = {
  name: "webinar/created";
  data: {
    webinarId: string;
  };
};

export type SourceAddedEvent = {
  name: "webinar/source.added";
  data: {
    webinarId: string;
    sourceId: string;
  };
};

export type IngestionCompletedEvent = {
  name: "webinar/ingestion.completed";
  data: {
    webinarId: string;
  };
};

export type ThesesGeneratedEvent = {
  name: "webinar/theses.generated";
  data: {
    webinarId: string;
    thesisIds: string[];
  };
};

export type WebinarApprovedEvent = {
  name: "webinar/approved";
  data: {
    webinarId: string;
    thesisIds: string[];
  };
};

export type ArtifactGenerationRequestedEvent = {
  name: "artifact/generation.requested";
  data: {
    webinarId: string;
    artifactType: ArtifactType;
    artifactId: string;
  };
};

export type ArtifactGenerationCompletedEvent = {
  name: "artifact/generation.completed";
  data: {
    webinarId: string;
    artifactId: string;
    artifactType: ArtifactType;
  };
};

export type ArtifactGenerationFailedEvent = {
  name: "artifact/generation.failed";
  data: {
    webinarId: string;
    artifactId: string;
    artifactType: ArtifactType;
    error: string;
  };
};

export type ArtifactRegenerationRequestedEvent = {
  name: "artifact/regeneration.requested";
  data: {
    webinarId: string;
    artifactId: string;
    artifactType: ArtifactType;
    promptOverride?: string;
  };
};

// ── All Events Union ────────────────────────────────────────

export type WebinarPlatformEvents = {
  "webinar/created": WebinarCreatedEvent;
  "webinar/source.added": SourceAddedEvent;
  "webinar/ingestion.completed": IngestionCompletedEvent;
  "webinar/theses.generated": ThesesGeneratedEvent;
  "webinar/approved": WebinarApprovedEvent;
  "artifact/generation.requested": ArtifactGenerationRequestedEvent;
  "artifact/generation.completed": ArtifactGenerationCompletedEvent;
  "artifact/generation.failed": ArtifactGenerationFailedEvent;
  "artifact/regeneration.requested": ArtifactRegenerationRequestedEvent;
};
