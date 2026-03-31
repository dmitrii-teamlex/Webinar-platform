/**
 * Structured logger for the platform.
 * Stores logs in-memory (replace with DB/external service in production).
 * Every module writes here so we have a single place to debug.
 */

export type LogLevel = "debug" | "info" | "warn" | "error";

export type LogEntry = {
  id: string;
  timestamp: string;
  level: LogLevel;
  /** Module that produced the log: "ai", "ingestion", "inngest", "api", etc. */
  module: string;
  message: string;
  /** Structured metadata — webinarId, artifactId, duration, etc. */
  meta?: Record<string, unknown>;
};

const MAX_ENTRIES = 2000;
const entries: LogEntry[] = [];

let minLevel: LogLevel = "debug";

const LEVEL_ORDER: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

function shouldLog(level: LogLevel): boolean {
  return LEVEL_ORDER[level] >= LEVEL_ORDER[minLevel];
}

function write(level: LogLevel, module: string, message: string, meta?: Record<string, unknown>) {
  if (!shouldLog(level)) return;

  const entry: LogEntry = {
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    level,
    module,
    message,
    meta,
  };

  entries.push(entry);

  // Trim oldest entries if over limit
  if (entries.length > MAX_ENTRIES) {
    entries.splice(0, entries.length - MAX_ENTRIES);
  }

  // Also output to console for dev server
  const prefix = `[${level.toUpperCase()}] [${module}]`;
  if (level === "error") {
    console.error(prefix, message, meta ?? "");
  } else if (level === "warn") {
    console.warn(prefix, message, meta ?? "");
  } else {
    console.log(prefix, message, meta ?? "");
  }
}

/**
 * Create a scoped logger for a specific module.
 */
export function createLogger(module: string) {
  return {
    debug: (message: string, meta?: Record<string, unknown>) =>
      write("debug", module, message, meta),
    info: (message: string, meta?: Record<string, unknown>) =>
      write("info", module, message, meta),
    warn: (message: string, meta?: Record<string, unknown>) =>
      write("warn", module, message, meta),
    error: (message: string, meta?: Record<string, unknown>) =>
      write("error", module, message, meta),
  };
}

// ── Query API (used by /api/logs) ──

export type LogQuery = {
  level?: LogLevel;
  module?: string;
  search?: string;
  limit?: number;
  offset?: number;
};

export function queryLogs(query: LogQuery = {}): { logs: LogEntry[]; total: number } {
  let filtered = [...entries];

  if (query.level) {
    const minOrder = LEVEL_ORDER[query.level];
    filtered = filtered.filter((e) => LEVEL_ORDER[e.level] >= minOrder);
  }

  if (query.module) {
    filtered = filtered.filter((e) => e.module === query.module);
  }

  if (query.search) {
    const q = query.search.toLowerCase();
    filtered = filtered.filter(
      (e) =>
        e.message.toLowerCase().includes(q) ||
        JSON.stringify(e.meta ?? {}).toLowerCase().includes(q)
    );
  }

  const total = filtered.length;

  // Newest first
  filtered.reverse();

  const offset = query.offset ?? 0;
  const limit = query.limit ?? 100;
  filtered = filtered.slice(offset, offset + limit);

  return { logs: filtered, total };
}

export function getLogModules(): string[] {
  const modules = new Set(entries.map((e) => e.module));
  return Array.from(modules).sort();
}

export function clearLogs(): number {
  const count = entries.length;
  entries.length = 0;
  return count;
}

export function setMinLevel(level: LogLevel) {
  minLevel = level;
}

export function getStats(): Record<LogLevel, number> {
  const stats: Record<LogLevel, number> = { debug: 0, info: 0, warn: 0, error: 0 };
  for (const e of entries) {
    stats[e.level]++;
  }
  return stats;
}
