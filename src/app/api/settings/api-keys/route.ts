import { NextRequest, NextResponse } from "next/server";
import { API_KEY_GROUPS } from "@/config/api-keys";

/**
 * In-memory API keys store.
 * In production, these should be stored encrypted in the database
 * or managed via environment variables.
 */
const keysStore: Map<string, string> = new Map();

// Pre-populate from env vars on startup
for (const group of API_KEY_GROUPS) {
  for (const field of group.fields) {
    const envValue = process.env[field.key];
    if (envValue) {
      keysStore.set(field.key, envValue);
    }
  }
}

function maskKey(value: string): string {
  if (value.length <= 8) return "••••••••";
  return value.slice(0, 4) + "••••" + value.slice(-4);
}

/** GET /api/settings/api-keys — List all keys (masked) with status */
export async function GET() {
  const keys: Record<string, { set: boolean; masked: string }> = {};

  for (const group of API_KEY_GROUPS) {
    for (const field of group.fields) {
      const value = keysStore.get(field.key) ?? "";
      keys[field.key] = {
        set: value.length > 0,
        masked: value ? maskKey(value) : "",
      };
    }
  }

  return NextResponse.json({ keys });
}

/** POST /api/settings/api-keys — Save or update keys */
export async function POST(request: NextRequest) {
  const body = await request.json();
  const updates = body as Record<string, string>;

  // Validate that only known keys are being set
  const allKeys = new Set(
    API_KEY_GROUPS.flatMap((g) => g.fields.map((f) => f.key))
  );

  const saved: string[] = [];

  for (const [key, value] of Object.entries(updates)) {
    if (!allKeys.has(key)) continue;

    if (value && value.trim()) {
      keysStore.set(key, value.trim());
      saved.push(key);
    }
  }

  return NextResponse.json({ saved, count: saved.length });
}

/** DELETE /api/settings/api-keys?key=xxx — Remove a key */
export async function DELETE(request: NextRequest) {
  const key = request.nextUrl.searchParams.get("key");

  if (!key) {
    return NextResponse.json({ error: "key param is required" }, { status: 400 });
  }

  keysStore.delete(key);

  return NextResponse.json({ deleted: true });
}
