"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Save,
  Eye,
  EyeOff,
  CheckCircle2,
  XCircle,
  Loader2,
  Brain,
  Sparkles,
  Globe,
  Database,
  HardDrive,
  Workflow,
  type LucideIcon,
} from "lucide-react";
import { API_KEY_GROUPS, type ApiKeyGroup } from "@/config/api-keys";

const ICON_MAP: Record<string, LucideIcon> = {
  brain: Brain,
  sparkles: Sparkles,
  globe: Globe,
  database: Database,
  "hard-drive": HardDrive,
  workflow: Workflow,
};

type KeyStatus = { set: boolean; masked: string };

export default function SettingsPage() {
  const [statuses, setStatuses] = useState<Record<string, KeyStatus>>({});
  const [values, setValues] = useState<Record<string, string>>({});
  const [visible, setVisible] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/settings/api-keys")
      .then((r) => r.json())
      .then((data) => setStatuses(data.keys ?? {}))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const toggleVisibility = (key: string) => {
    setVisible((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const handleSave = async () => {
    // Only send non-empty values
    const toSave: Record<string, string> = {};
    for (const [key, value] of Object.entries(values)) {
      if (value.trim()) toSave[key] = value;
    }

    if (Object.keys(toSave).length === 0) return;

    setSaving(true);
    try {
      await fetch("/api/settings/api-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(toSave),
      });

      // Refresh statuses
      const res = await fetch("/api/settings/api-keys");
      const data = await res.json();
      setStatuses(data.keys ?? {});
      setValues({});
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      console.error("Failed to save:", e);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (key: string) => {
    await fetch(`/api/settings/api-keys?key=${key}`, { method: "DELETE" });
    setStatuses((prev) => ({
      ...prev,
      [key]: { set: false, masked: "" },
    }));
  };

  const configuredCount = Object.values(statuses).filter((s) => s.set).length;
  const totalCount = API_KEY_GROUPS.reduce((sum, g) => sum + g.fields.length, 0);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground">
            Manage API keys and service connections
          </p>
        </div>
        <Badge variant="outline" className="text-sm">
          {configuredCount}/{totalCount} configured
        </Badge>
      </div>

      {/* API Key Groups */}
      {API_KEY_GROUPS.map((group) => {
        const Icon = ICON_MAP[group.icon] ?? Database;

        return (
          <Card key={group.id}>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex size-9 items-center justify-center rounded-lg bg-muted">
                  <Icon className="size-4" />
                </div>
                <div>
                  <CardTitle className="text-base">{group.label}</CardTitle>
                  <CardDescription>{group.description}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {group.fields.map((field) => {
                const status = statuses[field.key];
                const inputValue = values[field.key] ?? "";
                const isVisible = visible.has(field.key);

                return (
                  <div key={field.key} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor={field.key} className="flex items-center gap-2">
                        {field.label}
                        {field.required && (
                          <span className="text-destructive text-xs">*</span>
                        )}
                        {status?.set ? (
                          <CheckCircle2 className="size-3.5 text-green-600" />
                        ) : (
                          <XCircle className="size-3.5 text-muted-foreground" />
                        )}
                      </Label>
                      {status?.set && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 text-xs text-destructive hover:text-destructive"
                          onClick={() => handleDelete(field.key)}
                        >
                          Remove
                        </Button>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Input
                          id={field.key}
                          type={isVisible ? "text" : "password"}
                          placeholder={
                            status?.set
                              ? status.masked
                              : field.placeholder
                          }
                          value={inputValue}
                          onChange={(e) =>
                            setValues((prev) => ({
                              ...prev,
                              [field.key]: e.target.value,
                            }))
                          }
                          className="pr-10 font-mono text-sm"
                        />
                        <button
                          type="button"
                          onClick={() => toggleVisibility(field.key)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          {isVisible ? (
                            <EyeOff className="size-4" />
                          ) : (
                            <Eye className="size-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    {field.helpText && (
                      <p className="text-xs text-muted-foreground">
                        {field.helpText}
                      </p>
                    )}
                  </div>
                );
              })}
            </CardContent>
          </Card>
        );
      })}

      {/* Save button */}
      <div className="flex items-center justify-end gap-3">
        {saved && (
          <span className="flex items-center gap-1.5 text-sm text-green-600">
            <CheckCircle2 className="size-4" />
            Saved
          </span>
        )}
        <Button
          onClick={handleSave}
          disabled={saving || Object.values(values).every((v) => !v.trim())}
        >
          {saving ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Save className="size-4" />
          )}
          {saving ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </div>
  );
}
