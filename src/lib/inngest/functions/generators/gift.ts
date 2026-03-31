import { inngest } from "../../client";
import { EVENTS } from "../../events";
import { aiGenerate } from "@/lib/ai/gateway";
import { contextBuilder } from "@/lib/ai/context-builder";
import {
  getDefaultPrompt,
  getPromptById,
  interpolatePrompt,
} from "@/lib/ai/prompt-registry";
import { GiftContentSchema } from "@/types/artifact";
import { createLogger } from "@/lib/logger";

const log = createLogger("generator.gift");

/**
 * Gift Generator.
 *
 * User controls the prompt because:
 * - Number of gift ideas varies (1 lead magnet vs 3-5 bonus items)
 * - Tone and format of copy differs per brand
 * - Visual brief depth depends on the design team's needs
 */
export const giftGenerator = inngest.createFunction(
  {
    id: "generate-gift",
    name: "Generate Gifts",
    triggers: [{ event: EVENTS.ARTIFACT_GENERATION_REQUESTED }],
    concurrency: { limit: 5 },
    retries: 2,
  },
  async ({ event, step }) => {
    const { webinarId, artifactId, artifactType } = event.data as {
      webinarId: string;
      artifactId: string;
      artifactType: string;
    };

    if (artifactType !== "gift") return;

    // Step 1: Fetch webinar + theses
    const { webinar, theses, promptId } = await step.run("fetch-data", async () => {
      // TODO: Replace with DB queries
      log.debug(`Fetching data`, { webinarId });
      return {
        webinar: {
          title: "Stub Webinar",
          topic: "Stub Topic",
          targetAudience: "Marketers",
          speakerName: "Speaker",
        },
        theses: [{ title: "Thesis 1", description: "Description 1" }],
        promptId: null as string | null,
      };
    });

    // Step 2: Resolve prompt
    const prompt = await step.run("resolve-prompt", async () => {
      if (promptId) {
        const custom = getPromptById(promptId);
        if (custom) return custom;
      }
      const defaultPrompt = getDefaultPrompt("gift");
      if (!defaultPrompt) {
        throw new Error("No prompt found for gift");
      }
      return defaultPrompt;
    });

    // Step 3: Build RAG context
    const context = await step.run("build-context", async () => {
      const chunks = await contextBuilder.buildContext({
        webinarId,
        query: `${webinar.topic} gift lead magnet bonus`,
        maxChunks: 10,
      });
      return chunks.map((c) => c.text).join("\n\n");
    });

    // Step 4: Interpolate prompt
    const userPrompt = interpolatePrompt(prompt.userPromptTemplate, {
      title: webinar.title,
      topic: webinar.topic,
      targetAudience: webinar.targetAudience,
      speakerName: webinar.speakerName,
      theses: theses.map((t, i) => `${i + 1}. ${t.title}: ${t.description}`).join("\n"),
      context: context || "No additional context available.",
    });

    // Step 5: Call AI
    const raw = await step.run("call-ai", async () => {
      const result = await aiGenerate({
        messages: [
          { role: "system", content: prompt.systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.8,
        maxTokens: 4096,
        responseFormat: "json",
      });
      return result.content;
    });

    // Step 6: Parse, validate, save
    const content = await step.run("parse-and-save", async () => {
      const cleaned = raw.replace(/```json\n?|\n?```/g, "").trim();
      let parsed: unknown;
      try {
        parsed = JSON.parse(cleaned);
      } catch {
        throw new Error(`Failed to parse AI JSON response for gift`);
      }

      const result = GiftContentSchema.safeParse(parsed);
      if (!result.success) {
        log.warn(`Schema validation failed`, { artifactId, error: String(result.error) });
      }

      // TODO: Update artifact in DB
      // await db.update(schema.artifacts)
      //   .set({ content: parsed, status: "completed", version: 1, updatedAt: new Date() })
      //   .where(eq(schema.artifacts.id, artifactId));

      log.info(`Artifact generated`, { artifactId, webinarId });
      return parsed;
    });

    // Step 7: Fire completion event
    await step.sendEvent("generation-completed", {
      name: EVENTS.ARTIFACT_GENERATION_COMPLETED,
      data: { webinarId, artifactId, artifactType: "gift" },
    });

    return { artifactId, webinarId };
  }
);
