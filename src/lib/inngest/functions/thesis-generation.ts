import { inngest } from "../client";
import { EVENTS } from "../events";
import { aiGenerate } from "@/lib/ai/gateway";
import { contextBuilder } from "@/lib/ai/context-builder";

/**
 * Thesis generation workflow — triggered after all sources are ingested.
 * 1. Build RAG context from embeddings
 * 2. Generate thesis ideas via AI
 * 3. Save theses to DB
 * 4. Update webinar status to "theses_ready"
 */
export const thesisGenerationWorkflow = inngest.createFunction(
  {
    id: "thesis-generation",
    name: "Thesis Generation",
    triggers: [{ event: EVENTS.INGESTION_COMPLETED }],
    retries: 2,
  },
  async ({ event, step }) => {
    const { webinarId } = event.data as { webinarId: string };

    // Step 1: Fetch webinar details
    const webinar = await step.run("fetch-webinar", async () => {
      // TODO: Replace with DB query
      // const webinar = await db.query.webinars.findFirst({
      //   where: eq(schema.webinars.id, webinarId),
      // });
      console.log(`[Thesis] Fetching webinar ${webinarId}`);
      return {
        id: webinarId,
        title: "Stub Webinar",
        topic: "Stub Topic",
        targetAudience: "General",
        speakerName: "Speaker",
      };
    });

    // Step 2: Build context from ingested sources via RAG
    const context = await step.run("build-context", async () => {
      const chunks = await contextBuilder.buildContext({
        webinarId,
        query: `${webinar.topic} key ideas main points`,
        maxChunks: 20,
      });
      return chunks.map((c) => c.text).join("\n\n");
    });

    // Step 3: Generate theses via AI
    const thesesRaw = await step.run("generate-theses", async () => {
      const result = await aiGenerate({
        messages: [
          {
            role: "system",
            content: `You are an expert webinar strategist. Generate 5-8 thesis ideas for a webinar. Each thesis should be a key point or idea that the webinar will cover. Return a JSON array of objects with "title" and "description" fields. Return ONLY valid JSON, no markdown.`,
          },
          {
            role: "user",
            content: `Webinar: "${webinar.title}"
Topic: ${webinar.topic}
Target audience: ${webinar.targetAudience}
Speaker: ${webinar.speakerName}

Source materials context:
${context || "No source materials provided."}

Generate thesis ideas for this webinar.`,
          },
        ],
        responseFormat: "json",
        temperature: 0.8,
      });

      return result.content;
    });

    // Step 4: Parse and save theses
    const thesisIds = await step.run("save-theses", async () => {
      let parsed: { title: string; description: string }[];
      try {
        const content = thesesRaw.replace(/```json\n?|\n?```/g, "").trim();
        parsed = JSON.parse(content);
        if (!Array.isArray(parsed)) {
          parsed = [parsed];
        }
      } catch {
        console.error("[Thesis] Failed to parse AI response:", thesesRaw);
        parsed = [
          {
            title: "Default Thesis",
            description: "AI response could not be parsed. Please regenerate.",
          },
        ];
      }

      const ids: string[] = [];
      for (let i = 0; i < parsed.length; i++) {
        const id = crypto.randomUUID();
        ids.push(id);

        // TODO: Insert into DB
        // await db.insert(schema.theses).values({
        //   id,
        //   webinarId,
        //   title: parsed[i].title,
        //   description: parsed[i].description,
        //   order: i,
        //   approved: false,
        // });

        console.log(`[Thesis] Created: ${parsed[i].title}`);
      }

      return ids;
    });

    // Step 5: Update webinar status
    await step.run("update-webinar-status", async () => {
      // TODO: Update webinar status in DB
      // await db.update(schema.webinars)
      //   .set({ status: "theses_ready", updatedAt: new Date() })
      //   .where(eq(schema.webinars.id, webinarId));
      console.log(`[Thesis] Webinar ${webinarId} → theses_ready`);
    });

    // Step 6: Fire theses.generated event
    await step.sendEvent("theses-generated", {
      name: EVENTS.THESES_GENERATED,
      data: { webinarId, thesisIds },
    });

    return { webinarId, thesisIds, count: thesisIds.length };
  }
);
