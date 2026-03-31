"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  RefreshCw,
  Trash2,
  Search,
  AlertTriangle,
  XCircle,
  Info,
  Bug,
  Loader2,
} from "lucide-react";

type LogEntry = {
  id: string;
  timestamp: string;
  level: "debug" | "info" | "warn" | "error";
  module: string;
  message: string;
  meta?: Record<string, unknown>;
};

type Stats = Record<string, number>;

const LEVEL_STYLES: Record<
  string,
  { color: string; bg: string; icon: React.ReactNode }
> = {
  debug: {
    color: "text-muted-foreground",
    bg: "",
    icon: <Bug className="size-3.5" />,
  },
  info: {
    color: "text-blue-600",
    bg: "",
    icon: <Info className="size-3.5" />,
  },
  warn: {
    color: "text-amber-600",
    bg: "bg-amber-50 dark:bg-amber-950/20",
    icon: <AlertTriangle className="size-3.5" />,
  },
  error: {
    color: "text-red-600",
    bg: "bg-red-50 dark:bg-red-950/20",
    icon: <XCircle className="size-3.5" />,
  },
};

export default function LogsPage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [modules, setModules] = useState<string[]>([]);
  const [stats, setStats] = useState<Stats>({});
  const [loading, setLoading] = useState(true);

  // Filters
  const [level, setLevel] = useState<string>("all");
  const [module, setModule] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [autoRefresh, setAutoRefresh] = useState(false);

  const fetchLogs = useCallback(async () => {
    const params = new URLSearchParams();
    if (level !== "all") params.set("level", level);
    if (module !== "all") params.set("module", module);
    if (search.trim()) params.set("search", search.trim());
    params.set("limit", "200");

    const res = await fetch(`/api/logs?${params}`);
    const data = await res.json();
    setLogs(data.logs ?? []);
    setTotal(data.total ?? 0);
    setModules(data.modules ?? []);
    setStats(data.stats ?? {});
  }, [level, module, search]);

  useEffect(() => {
    fetchLogs().finally(() => setLoading(false));
  }, [fetchLogs]);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(fetchLogs, 3000);
    return () => clearInterval(interval);
  }, [autoRefresh, fetchLogs]);

  const handleClear = async () => {
    await fetch("/api/logs", { method: "DELETE" });
    await fetchLogs();
  };

  const formatTime = (ts: string) => {
    const d = new Date(ts);
    return d.toLocaleTimeString("en-US", {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }) + "." + String(d.getMilliseconds()).padStart(3, "0");
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Logs</h1>
          <p className="text-muted-foreground">
            System logs for debugging and monitoring
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={autoRefresh ? "default" : "outline"}
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            <RefreshCw
              className={`size-3.5 ${autoRefresh ? "animate-spin" : ""}`}
            />
            {autoRefresh ? "Live" : "Auto-refresh"}
          </Button>
          <Button variant="outline" size="sm" onClick={fetchLogs}>
            <RefreshCw className="size-3.5" />
            Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleClear}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="size-3.5" />
            Clear
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        {(["debug", "info", "warn", "error"] as const).map((lvl) => {
          const style = LEVEL_STYLES[lvl];
          return (
            <Card key={lvl} className="cursor-pointer" onClick={() => setLevel(lvl)}>
              <CardContent className="pt-3 pb-3">
                <div className="flex items-center justify-between">
                  <span className={`flex items-center gap-1.5 text-sm font-medium ${style.color}`}>
                    {style.icon}
                    {lvl.charAt(0).toUpperCase() + lvl.slice(1)}
                  </span>
                  <span className="text-lg font-bold">{stats[lvl] ?? 0}</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Search logs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={level} onValueChange={setLevel}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Level" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All levels</SelectItem>
            <SelectItem value="debug">Debug+</SelectItem>
            <SelectItem value="info">Info+</SelectItem>
            <SelectItem value="warn">Warn+</SelectItem>
            <SelectItem value="error">Error only</SelectItem>
          </SelectContent>
        </Select>
        <Select value={module} onValueChange={setModule}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Module" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All modules</SelectItem>
            {modules.map((m) => (
              <SelectItem key={m} value={m}>
                {m}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Badge variant="outline" className="shrink-0">
          {total} entries
        </Badge>
      </div>

      {/* Log entries */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : logs.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No logs yet. Logs will appear as you interact with the platform.
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="divide-y max-h-[600px] overflow-y-auto">
              {logs.map((log) => {
                const style = LEVEL_STYLES[log.level];
                return (
                  <div
                    key={log.id}
                    className={`flex items-start gap-3 px-4 py-2.5 text-sm ${style.bg}`}
                  >
                    {/* Time */}
                    <span className="shrink-0 font-mono text-xs text-muted-foreground w-[90px]">
                      {formatTime(log.timestamp)}
                    </span>

                    {/* Level */}
                    <span className={`shrink-0 ${style.color}`}>
                      {style.icon}
                    </span>

                    {/* Module */}
                    <Badge variant="secondary" className="shrink-0 text-xs font-mono">
                      {log.module}
                    </Badge>

                    {/* Message */}
                    <span className="flex-1 min-w-0 break-words">
                      {log.message}
                    </span>

                    {/* Meta */}
                    {log.meta && Object.keys(log.meta).length > 0 && (
                      <span className="shrink-0 text-xs text-muted-foreground font-mono max-w-[300px] truncate">
                        {JSON.stringify(log.meta)}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
