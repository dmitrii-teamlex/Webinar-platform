import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

type Params = { params: Promise<{ id: string }> };

/** GET /api/webinars/:id — Get a single webinar */
export async function GET(_request: NextRequest, { params }: Params) {
  const { id } = await params;
  const supabase = createAdminClient();

  const { data: webinar, error } = await supabase
    .from("webinars")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !webinar) {
    return NextResponse.json({ error: "Webinar not found" }, { status: 404 });
  }

  return NextResponse.json({ webinar });
}

/** PATCH /api/webinars/:id — Update webinar */
export async function PATCH(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const body = await request.json();
  const supabase = createAdminClient();

  const { data: webinar, error } = await supabase
    .from("webinars")
    .update({ ...body, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error || !webinar) {
    return NextResponse.json({ error: "Webinar not found" }, { status: 404 });
  }

  return NextResponse.json({ webinar });
}
