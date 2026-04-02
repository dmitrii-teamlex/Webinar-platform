import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

type Params = { params: Promise<{ id: string }> };

/** GET /api/webinars/:id/theses — List theses for a webinar */
export async function GET(_request: NextRequest, { params }: Params) {
  const { id } = await params;
  const supabase = createAdminClient();

  const { data: theses, error } = await supabase
    .from("theses")
    .select("*")
    .eq("webinar_id", id)
    .order("order", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ theses: theses ?? [] });
}

/** POST /api/webinars/:id/theses — Create or batch-create theses */
export async function POST(request: NextRequest, { params }: Params) {
  const { id: webinarId } = await params;
  const body = await request.json();
  const supabase = createAdminClient();

  const items: { title: string; description?: string }[] = Array.isArray(body)
    ? body
    : [body];

  // Get current max order
  const { data: existing } = await supabase
    .from("theses")
    .select("order")
    .eq("webinar_id", webinarId)
    .order("order", { ascending: false })
    .limit(1);

  const startOrder = (existing?.[0]?.order ?? -1) + 1;

  const records = items.map((item, i) => ({
    webinar_id: webinarId,
    title: item.title,
    description: item.description ?? "",
    order: startOrder + i,
    approved: false,
  }));

  const { data: created, error } = await supabase
    .from("theses")
    .insert(records)
    .select();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ theses: created }, { status: 201 });
}

/** PATCH /api/webinars/:id/theses — Bulk update (approve, reorder, edit) */
export async function PATCH(request: NextRequest, { params }: Params) {
  const { id: webinarId } = await params;
  const body = await request.json();
  const supabase = createAdminClient();

  const { action, thesisIds, updates } = body as {
    action: string;
    thesisIds?: string[];
    updates?: { id: string; title?: string; description?: string; order?: number; approved?: boolean }[];
  };

  if (action === "approve_all") {
    await supabase
      .from("theses")
      .update({ approved: true })
      .eq("webinar_id", webinarId);

    // Update webinar status to theses_ready
    await supabase
      .from("webinars")
      .update({ status: "theses_ready", updated_at: new Date().toISOString() })
      .eq("id", webinarId);

    const { data: theses } = await supabase
      .from("theses")
      .select("*")
      .eq("webinar_id", webinarId)
      .order("order", { ascending: true });

    return NextResponse.json({ theses, approved: true });
  }

  if (action === "approve_selected" && thesisIds) {
    for (const thesisId of thesisIds) {
      await supabase
        .from("theses")
        .update({ approved: true })
        .eq("id", thesisId)
        .eq("webinar_id", webinarId);
    }

    // Update webinar status
    await supabase
      .from("webinars")
      .update({ status: "theses_ready", updated_at: new Date().toISOString() })
      .eq("id", webinarId);

    const { data: theses } = await supabase
      .from("theses")
      .select("*")
      .eq("webinar_id", webinarId)
      .order("order", { ascending: true });

    return NextResponse.json({ theses, approved: true });
  }

  if (action === "update" && updates) {
    for (const update of updates) {
      const patch: Record<string, unknown> = {};
      if (update.title !== undefined) patch.title = update.title;
      if (update.description !== undefined) patch.description = update.description;
      if (update.order !== undefined) patch.order = update.order;
      if (update.approved !== undefined) patch.approved = update.approved;

      await supabase
        .from("theses")
        .update(patch)
        .eq("id", update.id)
        .eq("webinar_id", webinarId);
    }

    const { data: theses } = await supabase
      .from("theses")
      .select("*")
      .eq("webinar_id", webinarId)
      .order("order", { ascending: true });

    return NextResponse.json({ theses });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}

/** DELETE /api/webinars/:id/theses?thesisId=xxx — Delete a thesis */
export async function DELETE(request: NextRequest, { params }: Params) {
  const { id: webinarId } = await params;
  const thesisId = request.nextUrl.searchParams.get("thesisId");

  if (!thesisId) {
    return NextResponse.json({ error: "thesisId is required" }, { status: 400 });
  }

  await createAdminClient()
    .from("theses")
    .delete()
    .eq("id", thesisId)
    .eq("webinar_id", webinarId);

  return NextResponse.json({ deleted: true });
}
