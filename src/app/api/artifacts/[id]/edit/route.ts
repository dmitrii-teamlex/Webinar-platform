import { NextRequest, NextResponse } from "next/server";

type Params = { params: Promise<{ id: string }> };

/** POST /api/artifacts/:id/edit — Save user edit with version tracking */
export async function POST(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const body = await request.json();

  const { content, changeDescription } = body;

  if (!content) {
    return NextResponse.json(
      { error: "content is required" },
      { status: 400 }
    );
  }

  // TODO:
  // 1. Get current artifact
  // 2. Insert version record (editedBy: "user", content: old content)
  // 3. Update artifact with new content, bump version
  // 4. Return updated artifact

  return NextResponse.json({
    message: `Edit saved for artifact ${id} — stub`,
    id,
    changeDescription,
  });
}
