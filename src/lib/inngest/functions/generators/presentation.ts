import { inngest } from "../../client";
import { EVENTS } from "../../events";
import { aiGenerate } from "@/lib/ai/gateway";
import { getDefaultPrompt, interpolatePrompt } from "@/lib/ai/prompt-registry";
import { contextBuilder } from "@/lib/ai/context-builder";
import { PresentationContentSchema } from "@/types/artifact";

export const presentationGenerator = inngest.createFunction(
  {
    id: "generator-presentation",
    name: "Presentation Generator",
    retries: 2,
    triggers: [{ event: EVENTS.ARTIFACT_GENERATION_REQUESTED }],
  },
  async ({ event, step }) => {
    const { webinarId, artifactId, artifactType } = event.data;
    if (artifactType !== "presentation") return;

    // Step 1: Load webinar data and theses
    const webinarData = await step.run("load-webinar-data", async () => {
      // TODO: Load from DB once Dev 2 builds the webinar CRUD
      return {
        title: "Webinar Title",
        topic: "Webinar Topic",
        targetAudience: "Target Audience",
        speakerName: "Speaker Name",
        speakerBio: "Speaker Bio",
        date: new Date().toISOString(),
        theses: "1. Thesis one\n2. Thesis two\n3. Thesis three",
      };
    });

    // Step 2: Fetch relevant context via RAG
    const context = await step.run("fetch-context", async () => {
      const chunks = await contextBuilder.buildContext({
        webinarId,
        query: `presentation slides for ${webinarData.topic}`,
        maxChunks: 10,
      });
      return chunks.map((c) => c.text).join("\n\n");
    });

    // Step 3: Build prompt from registry
    const prompt = await step.run("build-prompt", async () => {
      const template = getDefaultPrompt("presentation");
      if (!template) throw new Error("No default prompt for presentation");

      const userPrompt = interpolatePrompt(template.userPromptTemplate, {
        title: webinarData.title,
        topic: webinarData.topic,
        targetAudience: webinarData.targetAudience,
        speakerName: webinarData.speakerName,
        speakerBio: webinarData.speakerBio ?? "",
        date: webinarData.date,
        theses: webinarData.theses,
        context: context || "No additional context available.",
      });

      return { systemPrompt: template.systemPrompt, userPrompt };
    });

    // Step 4: Generate with AI
    const result = await step.run("generate-presentation", async () => {
      const response = await aiGenerate({
        messages: [
          { role: "system", content: prompt.systemPrompt + "\n\nRespond with valid JSON matching the schema: { intro: Slide[], content: Slide[], sales: Slide[] } where Slide = { slideNumber: number, title: string, body: string, speakerNotes?: string, visualDirection?: string, layout?: 'title'|'text'|'bullets'|'image'|'quote'|'two_column'|'cta' }" },
          { role: "user", content: prompt.userPrompt },
        ],
        maxTokens: 16384,
        temperature: 0.7,
        responseFormat: "json",
      });

      return response;
    });

    // Step 5: Parse and validate
    const content = await step.run("validate-content", async () => {
      try {
        const parsed = JSON.parse(result.content);
        const validated = PresentationContentSchema.parse(parsed);
        return { type: "presentation" as const, data: validated };
      } catch {
        throw new Error("Failed to parse presentation content from AI response");
      }
    });

    // Step 6: Emit completion
    await step.sendEvent("notify-complete", {
      name: EVENTS.ARTIFACT_GENERATION_COMPLETED,
      data: { webinarId, artifactId, artifactType: "presentation" as const },
    });

    return { artifactId, content, model: result.model, usage: result.usage };
  }
);
