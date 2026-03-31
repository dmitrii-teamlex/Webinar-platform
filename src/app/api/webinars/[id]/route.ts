import { NextRequest, NextResponse } from "next/server";
import { webinarStore } from "../route";

type Params = { params: Promise<{ id: string }> };

/** GET /api/webinars/:id — Get a single webinar */
export async function GET(_request: NextRequest, { params }: Params) {
  const { id } = await params;
  const webinar = webinarStore.get(id);

  if (!webinar) {
    return NextResponse.json({ error: "Webinar not found" }, { status: 404 });
  }

  return NextResponse.json({ webinar });
}

/** PATCH /api/webinars/:id — Update webinar */
export async function PATCH(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const webinar = webinarStore.get(id);

  if (!webinar) {
    return NextResponse.json({ error: "Webinar not found" }, { status: 404 });
  }

  const body = await request.json();
  const updated = {
    ...webinar,
    ...body,
    updatedAt: new Date().toISOString(),
  };

  webinarStore.set(id, updated);

  return NextResponse.json({ webinar: updated });
}
