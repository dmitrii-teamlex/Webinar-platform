import { inngest } from "../client";
import { EVENTS } from "../events";
import type { ArtifactType } from "@/types/artifact";

/**
 * Fan-out orchestration: when a webinar is approved, create pending artifacts
 * and dispatch parallel generation requests for each artifact type.
 */
const ALL_ARTIFACT_TYPES: ArtifactType[] = [
  "presentation",
  "landing_page",
  "thank_you",
  "attendance_chain",
  "gift",
];

export const fanOutArtifactGeneration = inngest.createFunction(
  {
    id: "fan-out-artifact-generation",
    name: "Fan-out Artifact Generation",
    triggers: [{ event: EVENTS.WEBINAR_APPROVED }],
  },
  async ({ event, step }) => {
    const { webinarId } = event.data as { webinarId: string };

    // Step 1: Create pending artifact records in DB
    const artifactIds = await step.run("create-pending-artifacts", async () => {
      // TODO: Create artifact records in DB, return map of type -> id
      const ids: Record<string, string> = {};
      for (const type of ALL_ARTIFACT_TYPES) {
        ids[type] = crypto.randomUUID();
      }
      return ids;
    });

    // Step 2: Fan-out — send generation event for each artifact type
    const events = ALL_ARTIFACT_TYPES.map((artifactType) => ({
      name: EVENTS.ARTIFACT_GENERATION_REQUESTED,
      data: {
        webinarId,
        artifactType,
        artifactId: artifactIds[artifactType],
      },
    }));

    await step.sendEvent("dispatch-generators", events);

    return { webinarId, artifactIds };
  }
);
