import { NextRequest, NextResponse } from "next/server";
import { queryLogs, getLogModules, clearLogs, getStats, type LogLevel } from "@/lib/logger";

/** GET /api/logs?level=warn&module=ai&search=foo&limit=50&offset=0 */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;

  const logs = queryLogs({
    level: (params.get("level") as LogLevel) || undefined,
    module: params.get("module") || undefined,
    search: params.get("search") || undefined,
    limit: params.has("limit") ? Number(params.get("limit")) : undefined,
    offset: params.has("offset") ? Number(params.get("offset")) : undefined,
  });

  const modules = getLogModules();
  const stats = getStats();

  return NextResponse.json({ ...logs, modules, stats });
}

/** DELETE /api/logs — Clear all logs */
export async function DELETE() {
  const cleared = clearLogs();
  return NextResponse.json({ cleared });
}
