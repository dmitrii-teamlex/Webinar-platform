import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { inngest } from "@/lib/inngest/client";
import { EVENTS } from "@/lib/inngest/events";
import type { ArtifactType } from "@/types/artifact";

const ALL_ARTIFACT_TYPES: ArtifactType[] = [
  "presentation",
  "landing_page",
  "thank_you",
  "attendance_chain",
  "gift",
];

type Params = { params: Promise<{ id: string }> };

/**
 * POST /api/webinars/:id/generate
 * Triggers artifact generation for all types.
 * Works without sources — uses webinar info + default prompts.
 * Optionally accepts { types: ["presentation", "landing_page"] } to generate specific types.
 */
export async function POST(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const supabase = createAdminClient();

  // Verify webinar exists
  const { data: webinar, error: wErr } = await supabase
    .from("webinars")
    .select("id, title, status")
    .eq("id", id)
    .single();

  if (wErr || !webinar) {
    return NextResponse.json({ error: "Webinar not found" }, { status: 404 });
  }

  // Parse optional types filter from body
  let typesToGenerate = ALL_ARTIFACT_TYPES;
  try {
    const body = await request.json();
    if (body.types && Array.isArray(body.types)) {
      typesToGenerate = body.types.filter((t: string) =>
        ALL_ARTIFACT_TYPES.includes(t as ArtifactType)
      ) as ArtifactType[];
    }
  } catch {
    // No body or invalid JSON — generate all types
  }

  // Create artifact records in DB
  const artifactRecords = typesToGenerate.map((type) => ({
    webinar_id: id,
    type,
    status: "generating" as const,
    version: 1,
  }));

  const { data: artifacts, error: aErr } = await supabase
    .from("artifacts")
    .insert(artifactRecords)
    .select("id, type");

  if (aErr || !artifacts) {
    return NextResponse.json({ error: "Failed to create artifacts" }, { status: 500 });
  }

  // Update webinar status to generating
  await supabase
    .from("webinars")
    .update({ status: "generating", updated_at: new Date().toISOString() })
    .eq("id", id);

  // Fan-out: send generation event for each artifact
  const events = artifacts.map((artifact) => ({
    name: EVENTS.ARTIFACT_GENERATION_REQUESTED,
    data: {
      webinarId: id,
      artifactType: artifact.type,
      artifactId: artifact.id,
    },
  }));

  await inngest.send(events);

  return NextResponse.json({
    message: `Generation started for ${artifacts.length} artifacts`,
    artifacts: artifacts.map((a) => ({ id: a.id, type: a.type, status: "generating" })),
  });
}
