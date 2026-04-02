import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

type Params = { params: Promise<{ id: string }> };

/** POST /api/artifacts/:id/edit — Save user edit with version tracking */
export async function POST(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const body = await request.json();
  const { content, changeDescription } = body;

  if (!content) {
    return NextResponse.json(
      { error: "content is required" },
      { status: 400 }
    );
  }

  const supabase = createAdminClient();

  const { data: existing, error: fetchErr } = await supabase
    .from("artifacts")
    .select("*")
    .eq("id", id)
    .single();

  if (fetchErr || !existing) {
    return NextResponse.json({ error: "Artifact not found" }, { status: 404 });
  }

  // Save current content as a version
  if (existing.content) {
    await supabase.from("artifact_versions").insert({
      artifact_id: id,
      version: existing.version,
      content: existing.content,
      edited_by: "user",
      change_description: changeDescription ?? null,
    });
  }

  const newVersion = (existing.version ?? 1) + 1;

  const { data: updated, error: updateErr } = await supabase
    .from("artifacts")
    .update({
      content,
      version: newVersion,
      status: "completed",
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (updateErr) {
    return NextResponse.json({ error: updateErr.message }, { status: 500 });
  }

  return NextResponse.json({ artifact: updated });
}
