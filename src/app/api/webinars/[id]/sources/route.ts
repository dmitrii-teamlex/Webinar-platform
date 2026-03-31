import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

type Params = { params: Promise<{ id: string }> };

/** GET /api/webinars/:id/sources — List sources for a webinar */
export async function GET(_request: NextRequest, { params }: Params) {
  const { id } = await params;
  const supabase = createAdminClient();

  const { data: sources, error } = await supabase
    .from("sources")
    .select("*")
    .eq("webinar_id", id)
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ sources: sources ?? [] });
}

/** POST /api/webinars/:id/sources — Add a source to a webinar */
export async function POST(request: NextRequest, { params }: Params) {
  const { id: webinarId } = await params;
  const formData = await request.formData();

  const type = formData.get("type") as string;
  const url = formData.get("url") as string | null;
  const file = formData.get("file") as File | null;

  if (!type) {
    return NextResponse.json({ error: "type is required" }, { status: 400 });
  }

  const supabase = createAdminClient();

  const record: Record<string, unknown> = {
    webinar_id: webinarId,
    type,
    status: "pending",
  };

  if (type === "url") {
    if (!url) {
      return NextResponse.json({ error: "url is required for URL sources" }, { status: 400 });
    }
    record.url = url;
  } else if (file) {
    record.file_name = file.name;
    // TODO: Upload file to Supabase Storage
  }

  const { data: source, error } = await supabase
    .from("sources")
    .insert(record)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ source }, { status: 201 });
}

/** DELETE /api/webinars/:id/sources?sourceId=xxx — Remove a source */
export async function DELETE(request: NextRequest, { params }: Params) {
  const { id: webinarId } = await params;
  const sourceId = request.nextUrl.searchParams.get("sourceId");

  if (!sourceId) {
    return NextResponse.json({ error: "sourceId is required" }, { status: 400 });
  }

  const supabase = createAdminClient();

  await supabase
    .from("sources")
    .delete()
    .eq("id", sourceId)
    .eq("webinar_id", webinarId);

  return NextResponse.json({ deleted: true });
}
