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

export const attendanceChainGenerator = inngest.createFunction(
  {
    id: "generate-attendance-chain",
    name: "Generate Attendance Chain",
    triggers: [{ event: EVENTS.ARTIFACT_GENERATION_REQUESTED }],
    concurrency: { limit: 5 },
    retries: 1,
    onFailure: async ({ event }) => {
      const artifactId = event.data.event?.data?.artifactId;
      if (!artifactId) return;
      const supabase = createAdminClient();
      await supabase.from("artifacts").update({ status: "failed", error: "Generation failed", updated_at: new Date().toISOString() }).eq("id", artifactId);
    },
  },
  async ({ event, step }) => {
    const { webinarId, artifactId, artifactType } = event.data as {
      webinarId: string;
      artifactId: string;
      artifactType: string;
    };

    if (artifactType !== "attendance_chain") return;

    const webinarData = await step.run("load-webinar-data", async () => {
      return loadWebinarContext(webinarId);
    });

    const prompt = await step.run("build-prompt", async () => {
      const template = getDefaultPrompt("attendance_chain");
      if (!template) throw new Error("No default prompt for attendance_chain");

      const userPrompt = interpolatePrompt(template.userPromptTemplate, {
        title: webinarData.title,
        topic: webinarData.topic,
        date: webinarData.date,
        targetAudience: webinarData.targetAudience,
        speakerName: webinarData.speakerName,
        theses: webinarData.theses,
        context: "No additional context available.",
      });

      return { systemPrompt: template.systemPrompt, userPrompt };
    });

    const result = await step.run("call-ai", async () => {
      return aiGenerate({
        messages: [
          { role: "system", content: prompt.systemPrompt + "\n\nRespond with valid JSON matching: { stages: { type: string, timing: string, messages: { channel: string, subject?: string, body: string, timing: string }[] }[] }" },
          { role: "user", content: prompt.userPrompt },
        ],
        temperature: 0.7,
        maxTokens: 8192,
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

    await step.sendEvent("generation-completed", {
      name: EVENTS.ARTIFACT_GENERATION_COMPLETED,
      data: { webinarId, artifactId, artifactType: "attendance_chain" },
    });

    return { artifactId, content, model: result.model, usage: result.usage };
  }
);
