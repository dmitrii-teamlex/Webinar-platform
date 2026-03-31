import { inngest } from "../../client";
import { EVENTS } from "../../events";
import { aiGenerate } from "@/lib/ai/gateway";
import { getDefaultPrompt, interpolatePrompt } from "@/lib/ai/prompt-registry";
import { loadWebinarContext } from "@/lib/db/queries/webinar-context";
import { ThankYouContentSchema } from "@/types/artifact";

export const thankYouGenerator = inngest.createFunction(
  {
    id: "generator-thank-you",
    name: "Thank-You Page Generator",
    retries: 2,
    triggers: [{ event: EVENTS.ARTIFACT_GENERATION_REQUESTED }],
  },
  async ({ event, step }) => {
    const { webinarId, artifactId, artifactType } = event.data;
    if (artifactType !== "thank_you") return;

    const webinarData = await step.run("load-webinar-data", async () => {
      return loadWebinarContext(webinarId);
    });

    const prompt = await step.run("build-prompt", async () => {
      const template = getDefaultPrompt("thank_you");
      if (!template) throw new Error("No default prompt for thank_you");

      const userPrompt = interpolatePrompt(template.userPromptTemplate, {
        title: webinarData.title,
        topic: webinarData.topic,
        speakerName: webinarData.speakerName,
        date: webinarData.date,
        theses: webinarData.theses,
      });

      return { systemPrompt: template.systemPrompt, userPrompt };
    });

    const result = await step.run("generate-thank-you", async () => {
      const response = await aiGenerate({
        messages: [
          { role: "system", content: prompt.systemPrompt + "\n\nRespond with valid JSON matching: { headline: string, body: string, nextSteps: { step: number, title: string, description: string }[], giftDeliveryMessage?: string }" },
          { role: "user", content: prompt.userPrompt },
        ],
        maxTokens: 2048,
        temperature: 0.7,
        responseFormat: "json",
      });

      return response;
    });

    const content = await step.run("validate-content", async () => {
      try {
        const parsed = JSON.parse(result.content);
        const validated = ThankYouContentSchema.parse(parsed);
        return { type: "thank_you" as const, data: validated };
      } catch {
        throw new Error("Failed to parse thank-you content from AI response");
      }
    });

    await step.sendEvent("notify-complete", {
      name: EVENTS.ARTIFACT_GENERATION_COMPLETED,
      data: { webinarId, artifactId, artifactType: "thank_you" as const },
    });

    return { artifactId, content, model: result.model, usage: result.usage };
  }
);
