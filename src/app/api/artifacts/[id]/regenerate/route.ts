import { NextRequest, NextResponse } from "next/server";

type Params = { params: Promise<{ id: string }> };

/** POST /api/artifacts/:id/regenerate — Trigger artifact regeneration */
export async function POST(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const body = await request.json().catch(() => ({}));

  // TODO:
  // 1. Fetch artifact from DB to get webinarId and type
  // 2. Set artifact status to "generating"
  // 3. Save current content as a version
  // 4. Send Inngest event: artifact/regeneration.requested

  return NextResponse.json({
    message: `Regeneration requested for artifact ${id} — stub`,
    id,
    promptOverride: body.promptOverride,
  });
}
