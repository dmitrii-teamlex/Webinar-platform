import { NextRequest, NextResponse } from "next/server";

type Params = { params: Promise<{ id: string }> };

/** GET /api/artifacts/:id — Fetch a single artifact */
export async function GET(_request: NextRequest, { params }: Params) {
  const { id } = await params;

  // TODO: Fetch artifact from DB
  // const artifact = await db.query.artifacts.findFirst({ where: eq(artifacts.id, id) });

  return NextResponse.json({
    message: `Artifact ${id} — stub`,
    id,
  });
}

/** PATCH /api/artifacts/:id — Update artifact content (inline edit) */
export async function PATCH(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const body = await request.json();

  // TODO: Update artifact in DB + create version record
  // 1. Get current artifact
  // 2. Increment version
  // 3. Insert version record with old content
  // 4. Update artifact with new content

  return NextResponse.json({
    message: `Artifact ${id} updated — stub`,
    id,
    content: body.content,
  });
}

/** DELETE /api/artifacts/:id — Delete artifact */
export async function DELETE(_request: NextRequest, { params }: Params) {
  const { id } = await params;

  // TODO: Delete artifact from DB (versions cascade)

  return NextResponse.json({
    message: `Artifact ${id} deleted — stub`,
    id,
  });
}
