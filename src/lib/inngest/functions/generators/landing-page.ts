import { inngest } from "../../client";
import { EVENTS } from "../../events";
import { aiGenerate } from "@/lib/ai/gateway";
import { getDefaultPrompt, interpolatePrompt } from "@/lib/ai/prompt-registry";
import { contextBuilder } from "@/lib/ai/context-builder";
import { LandingPageContentSchema } from "@/types/artifact";

export const landingPageGenerator = inngest.createFunction(
  {
    id: "generator-landing-page",
    name: "Landing Page Generator",
    retries: 2,
    triggers: [{ event: EVENTS.ARTIFACT_GENERATION_REQUESTED }],
  },
  async ({ event, step }) => {
    const { webinarId, artifactId, artifactType } = event.data;
    if (artifactType !== "landing_page") return;

    const webinarData = await step.run("load-webinar-data", async () => {
      // TODO: Load from DB
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

    const context = await step.run("fetch-context", async () => {
      const chunks = await contextBuilder.buildContext({
        webinarId,
        query: `landing page copy for ${webinarData.topic} webinar`,
        maxChunks: 8,
      });
      return chunks.map((c) => c.text).join("\n\n");
    });

    const prompt = await step.run("build-prompt", async () => {
      const template = getDefaultPrompt("landing_page");
      if (!template) throw new Error("No default prompt for landing_page");

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

    const result = await step.run("generate-landing-page", async () => {
      const response = await aiGenerate({
        messages: [
          { role: "system", content: prompt.systemPrompt + "\n\nRespond with valid JSON matching: { headline: string, subheadline: string, bullets: string[], socialProof: { text: string, author: string }[], cta: { text: string, subtext?: string }, speakerBio: string, urgencyBlock?: string }" },
          { role: "user", content: prompt.userPrompt },
        ],
        maxTokens: 4096,
        temperature: 0.7,
        responseFormat: "json",
      });

      return response;
    });

    const content = await step.run("validate-content", async () => {
      try {
        const parsed = JSON.parse(result.content);
        const validated = LandingPageContentSchema.parse(parsed);
        return { type: "landing_page" as const, data: validated };
      } catch {
        throw new Error("Failed to parse landing page content from AI response");
      }
    });

    await step.sendEvent("notify-complete", {
      name: EVENTS.ARTIFACT_GENERATION_COMPLETED,
      data: { webinarId, artifactId, artifactType: "landing_page" as const },
    });

    return { artifactId, content, model: result.model, usage: result.usage };
  }
);
