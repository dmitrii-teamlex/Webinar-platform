import { NextRequest, NextResponse } from "next/server";

type Params = { params: Promise<{ id: string }> };

// In-memory theses store (replace with DB)
const thesesStore: Map<string, Record<string, unknown>[]> = new Map();

/** GET /api/webinars/:id/theses — List theses for a webinar */
export async function GET(_request: NextRequest, { params }: Params) {
  const { id } = await params;
  const theses = thesesStore.get(id) ?? [];

  return NextResponse.json({ theses });
}

/** POST /api/webinars/:id/theses — Create or batch-create theses */
export async function POST(request: NextRequest, { params }: Params) {
  const { id: webinarId } = await params;
  const body = await request.json();

  // Support both single thesis and array
  const items: { title: string; description: string }[] = Array.isArray(body)
    ? body
    : [body];

  const existing = thesesStore.get(webinarId) ?? [];
  const created: Record<string, unknown>[] = [];

  for (let i = 0; i < items.length; i++) {
    const thesis = {
      id: crypto.randomUUID(),
      webinarId,
      title: items[i].title,
      description: items[i].description ?? "",
      order: existing.length + i,
      approved: false,
      createdAt: new Date().toISOString(),
    };
    created.push(thesis);
  }

  thesesStore.set(webinarId, [...existing, ...created]);

  return NextResponse.json({ theses: created }, { status: 201 });
}

/** PATCH /api/webinars/:id/theses — Bulk update (approve, reorder, edit) */
export async function PATCH(request: NextRequest, { params }: Params) {
  const { id: webinarId } = await params;
  const body = await request.json();

  // body.action: "approve_all" | "approve_selected" | "update"
  const { action, thesisIds, updates } = body as {
    action: string;
    thesisIds?: string[];
    updates?: { id: string; title?: string; description?: string; order?: number; approved?: boolean }[];
  };

  const existing = thesesStore.get(webinarId) ?? [];

  if (action === "approve_all") {
    for (const thesis of existing) {
      thesis.approved = true;
    }
    thesesStore.set(webinarId, existing);

    // TODO: Fire webinar/approved event
    // const approvedIds = existing.map(t => t.id as string);
    // await inngest.send({
    //   name: "webinar/approved",
    //   data: { webinarId, thesisIds: approvedIds },
    // });

    return NextResponse.json({ theses: existing, approved: true });
  }

  if (action === "approve_selected" && thesisIds) {
    const selectedSet = new Set(thesisIds);
    for (const thesis of existing) {
      if (selectedSet.has(thesis.id as string)) {
        thesis.approved = true;
      }
    }
    thesesStore.set(webinarId, existing);

    // TODO: Fire webinar/approved event with only approved theses
    // await inngest.send({
    //   name: "webinar/approved",
    //   data: { webinarId, thesisIds },
    // });

    return NextResponse.json({ theses: existing, approved: true });
  }

  if (action === "update" && updates) {
    for (const update of updates) {
      const thesis = existing.find((t) => t.id === update.id);
      if (thesis) {
        if (update.title !== undefined) thesis.title = update.title;
        if (update.description !== undefined) thesis.description = update.description;
        if (update.order !== undefined) thesis.order = update.order;
        if (update.approved !== undefined) thesis.approved = update.approved;
      }
    }
    thesesStore.set(webinarId, existing);

    return NextResponse.json({ theses: existing });
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

  const existing = thesesStore.get(webinarId) ?? [];
  thesesStore.set(
    webinarId,
    existing.filter((t) => t.id !== thesisId)
  );

  return NextResponse.json({ deleted: true });
}

export { thesesStore };
