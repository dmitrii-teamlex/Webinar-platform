import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

type Params = { params: Promise<{ id: string }> };

/** GET /api/artifacts/:id — Fetch a single artifact */
export async function GET(_request: NextRequest, { params }: Params) {
  const { id } = await params;
  const supabase = createAdminClient();

  const { data: artifact, error } = await supabase
    .from("artifacts")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !artifact) {
    return NextResponse.json({ error: "Artifact not found" }, { status: 404 });
  }

  return NextResponse.json({ artifact });
}

/** PATCH /api/artifacts/:id — Update artifact content (inline edit) */
export async function PATCH(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const body = await request.json();
  const supabase = createAdminClient();

  const { data: existing, error: fetchErr } = await supabase
    .from("artifacts")
    .select("*")
    .eq("id", id)
    .single();

  if (fetchErr || !existing) {
    return NextResponse.json({ error: "Artifact not found" }, { status: 404 });
  }

  // Save current content as a version before overwriting
  if (existing.content) {
    await supabase.from("artifact_versions").insert({
      artifact_id: id,
      version: existing.version,
      content: existing.content,
      edited_by: "user",
      change_description: body.changeDescription ?? null,
    });
  }

  const newVersion = (existing.version ?? 1) + 1;

  const { data: updated, error: updateErr } = await supabase
    .from("artifacts")
    .update({
      content: body.content,
      version: newVersion,
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

/** DELETE /api/artifacts/:id — Delete artifact */
export async function DELETE(_request: NextRequest, { params }: Params) {
  const { id } = await params;
  const supabase = createAdminClient();

  const { error } = await supabase
    .from("artifacts")
    .delete()
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ deleted: true });
}
