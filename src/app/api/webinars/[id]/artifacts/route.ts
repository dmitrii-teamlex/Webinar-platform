import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

type Params = { params: Promise<{ id: string }> };

/** GET /api/webinars/:id/artifacts — List artifacts for a webinar */
export async function GET(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const supabase = createAdminClient();

  // Optional type filter: ?type=presentation
  const typeFilter = request.nextUrl.searchParams.get("type");

  let query = supabase
    .from("artifacts")
    .select("*")
    .eq("webinar_id", id)
    .order("created_at", { ascending: true });

  if (typeFilter) {
    query = query.eq("type", typeFilter);
  }

  const { data: artifacts, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ artifacts: artifacts ?? [] });
}
