import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { aiGenerate } from "@/lib/ai/gateway";

/** Strip markdown fences and extract raw JSON from AI response */
function extractJson(text: string): string {
  const fenced = text.match(/```(?:json)?\s*\n?([\s\S]*?)\n?\s*```/);
  if (fenced) return fenced[1].trim();
  return text.trim();
}

type Params = { params: Promise<{ id: string }> };

/**
 * POST /api/artifacts/:id/refine — AI chat refinement
 * Body: { message: string, history?: { role: "user" | "assistant", content: string }[] }
 *
 * Takes the current artifact content + user's instruction, asks AI to refine,
 * saves old version, updates artifact with new content.
 */
export async function POST(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const body = await request.json();
  const { message, history } = body as {
    message: string;
    history?: { role: "user" | "assistant"; content: string }[];
  };

  if (!message) {
    return NextResponse.json({ error: "message is required" }, { status: 400 });
  }

  const supabase = createAdminClient();

  const { data: artifact, error: fetchErr } = await supabase
    .from("artifacts")
    .select("*")
    .eq("id", id)
    .single();

  if (fetchErr || !artifact) {
    return NextResponse.json({ error: "Artifact not found" }, { status: 404 });
  }

  if (!artifact.content) {
    return NextResponse.json(
      { error: "Artifact has no content to refine. Generate it first." },
      { status: 400 }
    );
  }

  const systemPrompt = `You are an expert content editor for webinar materials. You are refining a "${artifact.type}" artifact.

Current content (JSON):
${JSON.stringify(artifact.content, null, 2)}

The user will ask you to make changes. Return ONLY the updated JSON content — no explanation, no markdown fences, just valid JSON that matches the original structure.`;

  const messages = [
    { role: "system" as const, content: systemPrompt },
    ...(history ?? []).map((h) => ({
      role: h.role as "user" | "assistant",
      content: h.content,
    })),
    { role: "user" as const, content: message },
  ];

  try {
    const result = await aiGenerate({
      messages,
      temperature: 0.5,
      responseFormat: "json",
    });

    let refinedContent;
    try {
      refinedContent = JSON.parse(extractJson(result.content));
    } catch {
      return NextResponse.json(
        { error: "AI returned invalid JSON", raw: result.content },
        { status: 502 }
      );
    }

    // Save current content as a version
    await supabase.from("artifact_versions").insert({
      artifact_id: id,
      version: artifact.version,
      content: artifact.content,
      edited_by: "ai",
      change_description: message,
    });

    const newVersion = (artifact.version ?? 1) + 1;

    const { data: updated, error: updateErr } = await supabase
      .from("artifacts")
      .update({
        content: refinedContent,
        version: newVersion,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (updateErr) {
      return NextResponse.json({ error: updateErr.message }, { status: 500 });
    }

    return NextResponse.json({
      artifact: updated,
      aiResponse: message,
      usage: result.usage,
    });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "AI generation failed";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
