import { inngest } from "../../client";
import { EVENTS } from "../../events";
import { aiGenerate } from "@/lib/ai/gateway";
import { getDefaultPrompt, interpolatePrompt } from "@/lib/ai/prompt-registry";
import { loadWebinarContext } from "@/lib/db/queries/webinar-context";
import { createAdminClient } from "@/lib/supabase/server";

function extractJson(text: string): string {
  const fenced = text.match(/```(?:json)?\s*\n?([\s\S]*?)\n?\s*```/);
  if (fenced) return fenced[1].trim();
  return text.trim();
}

export const thankYouGenerator = inngest.createFunction(
  {
    id: "generator-thank-you",
    name: "Thank-You Page Generator",
    retries: 1,
    onFailure: async ({ event }) => {
      const artifactId = event.data.event?.data?.artifactId;
      if (!artifactId) return;
      const supabase = createAdminClient();
      await supabase.from("artifacts").update({ status: "failed", error: "Generation failed", updated_at: new Date().toISOString() }).eq("id", artifactId);
    },
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
      return aiGenerate({
        messages: [
          { role: "system", content: prompt.systemPrompt + "\n\nRespond with valid JSON matching: { headline: string, body: string, nextSteps: { step: number, title: string, description: string }[], giftDeliveryMessage?: string }" },
          { role: "user", content: prompt.userPrompt },
        ],
        maxTokens: 2048,
        temperature: 0.7,
      });
    });

    const content = await step.run("parse-and-save", async () => {
      const parsed = JSON.parse(extractJson(result.content));
      const supabase = createAdminClient();

      await supabase
        .from("artifacts")
        .update({
          content: parsed,
          status: "completed",
          updated_at: new Date().toISOString(),
        })
        .eq("id", artifactId);

      return parsed;
    });

    await step.sendEvent("notify-complete", {
      name: EVENTS.ARTIFACT_GENERATION_COMPLETED,
      data: { webinarId, artifactId, artifactType: "thank_you" },
    });

    return { artifactId, content, model: result.model, usage: result.usage };
  }
);
