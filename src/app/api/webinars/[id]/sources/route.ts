import { NextRequest, NextResponse } from "next/server";

type Params = { params: Promise<{ id: string }> };

// In-memory source store (replace with DB)
const sourcesStore: Map<string, Record<string, unknown>[]> = new Map();

/** GET /api/webinars/:id/sources — List sources for a webinar */
export async function GET(_request: NextRequest, { params }: Params) {
  const { id } = await params;
  const sources = sourcesStore.get(id) ?? [];

  return NextResponse.json({ sources });
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

  const sourceId = crypto.randomUUID();
  const now = new Date().toISOString();

  const source: Record<string, unknown> = {
    id: sourceId,
    webinarId,
    type,
    status: "pending",
    createdAt: now,
  };

  if (type === "url") {
    if (!url) {
      return NextResponse.json({ error: "url is required for URL sources" }, { status: 400 });
    }
    source.url = url;
  } else if (file) {
    source.fileName = file.name;
    // TODO: Upload file to Supabase Storage
    // const { path } = await uploadFile(STORAGE_BUCKETS.SOURCES, `${webinarId}/${sourceId}/${file.name}`, file);
    // source.storagePath = path;
  }

  const existing = sourcesStore.get(webinarId) ?? [];
  existing.push(source);
  sourcesStore.set(webinarId, existing);

  // TODO: Send inngest event "webinar/source.added"
  // await inngest.send({ name: "webinar/source.added", data: { webinarId, sourceId } });

  return NextResponse.json({ source }, { status: 201 });
}

/** DELETE /api/webinars/:id/sources?sourceId=xxx — Remove a source */
export async function DELETE(request: NextRequest, { params }: Params) {
  const { id: webinarId } = await params;
  const sourceId = request.nextUrl.searchParams.get("sourceId");

  if (!sourceId) {
    return NextResponse.json({ error: "sourceId is required" }, { status: 400 });
  }

  const existing = sourcesStore.get(webinarId) ?? [];
  const filtered = existing.filter((s) => s.id !== sourceId);
  sourcesStore.set(webinarId, filtered);

  return NextResponse.json({ deleted: true });
}

export { sourcesStore };
