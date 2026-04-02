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

export const presentationGenerator = inngest.createFunction(
  {
    id: "generator-presentation",
    name: "Presentation Generator",
    retries: 1,
    onFailure: async ({ event }) => {
      const artifactId = event.data.event?.data?.artifactId;
      if (!artifactId) return;
      const supabase = createAdminClient();
      await supabase
        .from("artifacts")
        .update({ status: "failed", error: "Generation failed after retries", updated_at: new Date().toISOString() })
        .eq("id", artifactId);
    },
    triggers: [{ event: EVENTS.ARTIFACT_GENERATION_REQUESTED }],
  },
  async ({ event, step }) => {
    const { webinarId, artifactId, artifactType } = event.data;
    if (artifactType !== "presentation") return;

    const webinarData = await step.run("load-webinar-data", async () => {
      return loadWebinarContext(webinarId);
    });

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
        context: "No additional context available.",
      });

      return { systemPrompt: template.systemPrompt, userPrompt };
    });

    const result = await step.run("generate-presentation", async () => {
      return aiGenerate({
        messages: [
          { role: "system", content: prompt.systemPrompt + "\n\nGenerate a concise presentation brief with approximately 15 slides total: intro (2-3 slides), content (8-10 slides), sales (3-4 slides). Keep body text short — bullet points, not paragraphs. Respond with valid JSON matching: { intro: Slide[], content: Slide[], sales: Slide[] } where Slide = { slideNumber: number, title: string, body: string, speakerNotes?: string, layout?: 'title'|'text'|'bullets'|'image'|'quote'|'two_column'|'cta' }" },
          { role: "user", content: prompt.userPrompt },
        ],
        maxTokens: 4096,
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
      data: { webinarId, artifactId, artifactType: "presentation" },
    });

    return { artifactId, content, model: result.model, usage: result.usage };
  }
);
