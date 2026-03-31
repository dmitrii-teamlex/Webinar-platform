import { NextRequest, NextResponse } from "next/server";
import { CreateWebinarSchema } from "@/types/webinar";
import { createAdminClient } from "@/lib/supabase/server";

/** GET /api/webinars — List all webinars */
export async function GET() {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("webinars")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ webinars: data });
}

/** POST /api/webinars — Create a new webinar */
export async function POST(request: NextRequest) {
  const body = await request.json();

  const parsed = CreateWebinarSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.issues },
      { status: 400 }
    );
  }

  const supabase = createAdminClient();

  const { data: webinar, error } = await supabase
    .from("webinars")
    .insert({
      title: parsed.data.title,
      topic: parsed.data.topic,
      date: parsed.data.date,
      target_audience: parsed.data.targetAudience ?? "",
      speaker_name: parsed.data.speakerName ?? "",
      speaker_bio: parsed.data.speakerBio ?? null,
      status: "draft",
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ webinar }, { status: 201 });
}
