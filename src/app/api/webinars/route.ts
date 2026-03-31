import { NextRequest, NextResponse } from "next/server";
import { CreateWebinarSchema } from "@/types/webinar";

// In-memory store (replace with DB when connected)
const webinars: Map<string, Record<string, unknown>> = new Map();

/** GET /api/webinars — List all webinars */
export async function GET() {
  const list = Array.from(webinars.values()).sort(
    (a, b) =>
      new Date(b.createdAt as string).getTime() -
      new Date(a.createdAt as string).getTime()
  );

  return NextResponse.json({ webinars: list });
}

/** POST /api/webinars — Create a new webinar */
export async function POST(request: NextRequest) {
  const body = await request.json();

  const parsed = CreateWebinarSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.issues },
      { status: 400 }
    );
  }

  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  const webinar = {
    id,
    ...parsed.data,
    status: "draft" as const,
    createdAt: now,
    updatedAt: now,
  };

  webinars.set(id, webinar);

  // TODO: Send inngest event "webinar/created"
  // await inngest.send({ name: "webinar/created", data: { webinarId: id } });

  return NextResponse.json({ webinar }, { status: 201 });
}

// Export store for use by sub-routes (sources, theses, etc.)
export { webinars as webinarStore };
