import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { inngest } from "@/lib/inngest/client";
import { EVENTS } from "@/lib/inngest/events";

type Params = { params: Promise<{ id: string }> };

/** POST /api/artifacts/:id/regenerate — Trigger artifact regeneration */
export async function POST(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const supabase = createAdminClient();

  const { data: artifact, error: fetchErr } = await supabase
    .from("artifacts")
    .select("*")
    .eq("id", id)
    .single();

  if (fetchErr || !artifact) {
    return NextResponse.json({ error: "Artifact not found" }, { status: 404 });
  }

  // Save current content as a version before regenerating
  if (artifact.content) {
    await supabase.from("artifact_versions").insert({
      artifact_id: id,
      version: artifact.version,
      content: artifact.content,
      edited_by: "ai",
      change_description: "Before regeneration",
    });
  }

  // Set status to generating
  await supabase
    .from("artifacts")
    .update({
      status: "generating",
      error: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  // Send Inngest event — reuse the same generation event since generators handle both
  try {
    await inngest.send({
      name: EVENTS.ARTIFACT_GENERATION_REQUESTED,
      data: {
        webinarId: artifact.webinar_id,
        artifactType: artifact.type,
        artifactId: id,
      },
    });
  } catch {
    await supabase
      .from("artifacts")
      .update({ status: "failed", error: "Inngest dev server is not running", updated_at: new Date().toISOString() })
      .eq("id", id);
    return NextResponse.json({ error: "Inngest dev server is not running" }, { status: 503 });
  }

  return NextResponse.json({
    artifact: { id, type: artifact.type, status: "generating" },
  });
}
