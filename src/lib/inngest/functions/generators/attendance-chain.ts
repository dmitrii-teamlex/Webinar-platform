import { inngest } from "../../client";
import { EVENTS } from "../../events";
import { aiGenerate } from "@/lib/ai/gateway";
import { contextBuilder } from "@/lib/ai/context-builder";
import {
  getDefaultPrompt,
  getPromptById,
  interpolatePrompt,
} from "@/lib/ai/prompt-registry";
import { AttendanceChainContentSchema } from "@/types/artifact";

/**
 * Attendance Chain Generator.
 *
 * The user controls the prompt (via prompt registry) because:
 * - Different webinars need different numbers of messages per stage
 * - Channel mix (email vs messenger vs SMS) varies
 * - Timing and tone depend on the funnel strategy
 *
 * The generator pulls the prompt, interpolates variables, calls AI,
 * validates output against the Zod schema, and saves.
 */
export const attendanceChainGenerator = inngest.createFunction(
  {
    id: "generate-attendance-chain",
    name: "Generate Attendance Chain",
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

    if (artifactType !== "attendance_chain") return;

    // Step 1: Fetch webinar + theses + artifact (for promptId override)
    const { webinar, theses, promptId } = await step.run("fetch-data", async () => {
      // TODO: Replace with DB queries
      console.log(`[AttendanceChain] Fetching data for webinar ${webinarId}`);
      return {
        webinar: {
          title: "Stub Webinar",
          topic: "Stub Topic",
          date: "2026-04-15",
          targetAudience: "Marketers",
          speakerName: "Speaker",
        },
        theses: [{ title: "Thesis 1", description: "Description 1" }],
        promptId: null as string | null,
      };
    });

    // Step 2: Get the prompt (user-customized or default)
    const prompt = await step.run("resolve-prompt", async () => {
      if (promptId) {
        const custom = getPromptById(promptId);
        if (custom) return custom;
      }
      const defaultPrompt = getDefaultPrompt("attendance_chain");
      if (!defaultPrompt) {
        throw new Error("No prompt found for attendance_chain");
      }
      return defaultPrompt;
    });

    // Step 3: Build RAG context
    const context = await step.run("build-context", async () => {
      const chunks = await contextBuilder.buildContext({
        webinarId,
        query: `${webinar.topic} email marketing attendance`,
        maxChunks: 10,
      });
      return chunks.map((c) => c.text).join("\n\n");
    });

    // Step 4: Interpolate user prompt template with webinar variables
    const userPrompt = interpolatePrompt(prompt.userPromptTemplate, {
      title: webinar.title,
      topic: webinar.topic,
      date: webinar.date,
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
        temperature: 0.7,
        maxTokens: 8192,
        responseFormat: "json",
      });
      return result.content;
    });

    // Step 6: Parse and validate against Zod schema
    const content = await step.run("parse-and-save", async () => {
      const cleaned = raw.replace(/```json\n?|\n?```/g, "").trim();
      let parsed: unknown;
      try {
        parsed = JSON.parse(cleaned);
      } catch {
        throw new Error(`Failed to parse AI JSON response for attendance chain`);
      }

      // Validate against schema
      const result = AttendanceChainContentSchema.safeParse(parsed);
      if (!result.success) {
        console.error("[AttendanceChain] Schema validation failed:", result.error);
        // Save raw content anyway — user can fix via editor
      }

      // TODO: Update artifact in DB
      // await db.update(schema.artifacts)
      //   .set({ content: parsed, status: "completed", version: 1, updatedAt: new Date() })
      //   .where(eq(schema.artifacts.id, artifactId));

      console.log(`[AttendanceChain] Artifact ${artifactId} generated`);
      return parsed;
    });

    // Step 7: Fire completion event
    await step.sendEvent("generation-completed", {
      name: EVENTS.ARTIFACT_GENERATION_COMPLETED,
      data: { webinarId, artifactId, artifactType: "attendance_chain" },
    });

    return { artifactId, webinarId };
  }
);
