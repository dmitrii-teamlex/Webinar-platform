import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

type Params = { params: Promise<{ id: string }> };

/** GET /api/artifacts/:id/versions — List all versions of an artifact */
export async function GET(_request: NextRequest, { params }: Params) {
  const { id } = await params;
  const supabase = createAdminClient();

  const { data: versions, error } = await supabase
    .from("artifact_versions")
    .select("*")
    .eq("artifact_id", id)
    .order("version", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ artifactId: id, versions: versions ?? [] });
}
