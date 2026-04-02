import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { aiGenerate } from "@/lib/ai/gateway";
import { getDefaultPrompt, interpolatePrompt } from "@/lib/ai/prompt-registry";

/** Strip markdown fences and extract raw JSON from AI response */
function extractJson(text: string): string {
  // Remove ```json ... ``` or ``` ... ``` wrapping
  const fenced = text.match(/```(?:json)?\s*\n?([\s\S]*?)\n?\s*```/);
  if (fenced) return fenced[1].trim();
  // Already raw JSON
  return text.trim();
}

type Params = { params: Promise<{ id: string }> };

/**
 * POST /api/webinars/:id/theses/generate
 * Generates theses using AI based on webinar topic and the theses prompt from Settings.
 */
export async function POST(_request: NextRequest, { params }: Params) {
  const { id: webinarId } = await params;
  const supabase = createAdminClient();

  // Fetch webinar details
  const { data: webinar, error: wErr } = await supabase
    .from("webinars")
    .select("*")
    .eq("id", webinarId)
    .single();

  if (wErr || !webinar) {
    return NextResponse.json({ error: "Webinar not found" }, { status: 404 });
  }

  // Get the theses prompt from registry
  const prompt = getDefaultPrompt("theses");
  if (!prompt) {
    return NextResponse.json(
      { error: "No theses prompt configured. Add one in Settings → Prompts." },
      { status: 400 }
    );
  }

  // Interpolate variables into the user prompt
  const userPrompt = interpolatePrompt(prompt.userPromptTemplate, {
    title: webinar.title ?? "",
    topic: webinar.topic ?? "",
    targetAudience: webinar.target_audience ?? "",
    speakerName: webinar.speaker_name ?? "",
    speakerBio: webinar.speaker_bio ?? "",
    date: webinar.date ?? "",
  });

  try {
    const result = await aiGenerate({
      messages: [
        { role: "system", content: prompt.systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.7,
      responseFormat: "json",
    });

    // Parse the AI response
    let thesesData: { title: string; description?: string }[];
    try {
      const jsonStr = extractJson(result.content);
      const parsed = JSON.parse(jsonStr);
      // Handle both { theses: [...] } and direct array formats
      thesesData = Array.isArray(parsed) ? parsed : parsed.theses ?? parsed.items ?? [];
    } catch {
      return NextResponse.json(
        { error: "AI returned invalid JSON", raw: result.content },
        { status: 502 }
      );
    }

    // Get current max order
    const { data: existing } = await supabase
      .from("theses")
      .select("order")
      .eq("webinar_id", webinarId)
      .order("order", { ascending: false })
      .limit(1);

    const startOrder = (existing?.[0]?.order ?? -1) + 1;

    // Insert theses into DB
    const records = thesesData.map((item, i) => ({
      webinar_id: webinarId,
      title: item.title,
      description: item.description ?? "",
      order: startOrder + i,
      approved: false,
    }));

    const { data: created, error: insertErr } = await supabase
      .from("theses")
      .insert(records)
      .select();

    if (insertErr) {
      return NextResponse.json({ error: insertErr.message }, { status: 500 });
    }

    return NextResponse.json({
      theses: created,
      usage: result.usage,
    }, { status: 201 });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "AI generation failed";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
