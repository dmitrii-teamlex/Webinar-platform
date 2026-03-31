import { createAdminClient } from "@/lib/supabase/server";

export type WebinarContext = {
  title: string;
  topic: string;
  targetAudience: string;
  speakerName: string;
  speakerBio: string;
  date: string;
  theses: string;
};

/**
 * Load webinar data + approved theses formatted for prompt interpolation.
 * Uses Supabase client (works without DATABASE_URL).
 * Falls back to stub data if webinar not found (dev mode).
 */
export async function loadWebinarContext(webinarId: string): Promise<WebinarContext> {
  try {
    const supabase = createAdminClient();

    const { data: webinar, error: wErr } = await supabase
      .from("webinars")
      .select("*")
      .eq("id", webinarId)
      .single();

    if (wErr || !webinar) {
      throw new Error(`Webinar ${webinarId} not found`);
    }

    const { data: thesesRows } = await supabase
      .from("theses")
      .select("*")
      .eq("webinar_id", webinarId)
      .order("order", { ascending: true });

    const thesesText = (thesesRows ?? [])
      .map((t, i) => `${i + 1}. ${t.title}${t.description ? `: ${t.description}` : ""}`)
      .join("\n");

    return {
      title: webinar.title,
      topic: webinar.topic,
      targetAudience: webinar.target_audience,
      speakerName: webinar.speaker_name,
      speakerBio: webinar.speaker_bio ?? "",
      date: webinar.date,
      theses: thesesText || "No theses available.",
    };
  } catch {
    // Fallback for development
    console.warn("[webinar-context] Using stub data");
    return {
      title: `Webinar ${webinarId.slice(0, 8)}`,
      topic: "Topic placeholder",
      targetAudience: "Target audience placeholder",
      speakerName: "Speaker Name",
      speakerBio: "Speaker bio placeholder",
      date: new Date().toISOString(),
      theses: "1. Thesis one\n2. Thesis two\n3. Thesis three",
    };
  }
}
