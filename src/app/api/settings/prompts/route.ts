import { NextRequest, NextResponse } from "next/server";
import {
  getAllPrompts,
  getPromptsByType,
  upsertPrompt,
  deletePrompt,
} from "@/lib/ai/prompt-registry";
import type { ArtifactType } from "@/types/artifact";

/** GET /api/settings/prompts?type=presentation — List prompts */
export async function GET(request: NextRequest) {
  const type = request.nextUrl.searchParams.get("type") as ArtifactType | null;

  const prompts = type ? getPromptsByType(type) : getAllPrompts();

  return NextResponse.json({ prompts });
}

/** POST /api/settings/prompts — Create or update a prompt */
export async function POST(request: NextRequest) {
  const body = await request.json();

  upsertPrompt(body);

  return NextResponse.json({ prompt: body });
}

/** DELETE /api/settings/prompts?id=xxx — Delete a prompt */
export async function DELETE(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  const deleted = deletePrompt(id);

  if (!deleted) {
    return NextResponse.json({ error: "Prompt not found" }, { status: 404 });
  }

  return NextResponse.json({ deleted: true });
}
