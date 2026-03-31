"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Save,
  RotateCcw,
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
  KeyRound,
  MessageSquare,
  type LucideIcon,
} from "lucide-react";
import { API_KEY_GROUPS } from "@/config/api-keys";

// ── Icon map for API key groups ──

const ICON_MAP: Record<string, LucideIcon> = {
  brain: Brain,
  sparkles: Sparkles,
  globe: Globe,
  database: Database,
  "hard-drive": HardDrive,
  workflow: Workflow,
};

// ── Types ──

type KeyStatus = { set: boolean; masked: string };

type PromptTemplate = {
  id: string;
  artifactType: string;
  name: string;
  systemPrompt: string;
  userPromptTemplate: string;
  isDefault: boolean;
};

const ARTIFACT_LABELS: Record<string, string> = {
  presentation: "Presentation",
  landing_page: "Landing Page",
  thank_you: "Thank-You Page",
  attendance_chain: "Attendance Chain",
  gift: "Gifts",
};

// ── API Keys Section ──

function ApiKeysSection() {
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Manage API keys and service connections
        </p>
        <Badge variant="outline" className="text-sm">
          {configuredCount}/{totalCount} configured
        </Badge>
      </div>

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
                            status?.set ? status.masked : field.placeholder
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

// ── Prompt Editor Section ──

function PromptEditor({
  prompt,
  onSave,
}: {
  prompt: PromptTemplate;
  onSave: (updated: PromptTemplate) => Promise<void>;
}) {
  const [edited, setEdited] = useState(prompt);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    setEdited(prompt);
    setDirty(false);
  }, [prompt]);

  const handleChange = (patch: Partial<PromptTemplate>) => {
    setEdited((prev) => ({ ...prev, ...patch }));
    setDirty(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(edited);
      setDirty(false);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setEdited(prompt);
    setDirty(false);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-base">{edited.name}</CardTitle>
            {edited.isDefault && <Badge variant="secondary">Default</Badge>}
            {dirty && <Badge variant="outline" className="text-amber-600">Unsaved</Badge>}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleReset} disabled={!dirty}>
              <RotateCcw className="size-3.5" />
              Reset
            </Button>
            <Button size="sm" onClick={handleSave} disabled={!dirty || saving}>
              <Save className="size-3.5" />
              {saving ? "Saving..." : "Save"}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Prompt Name</label>
          <Input
            value={edited.name}
            onChange={(e) => handleChange({ name: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">System Prompt</label>
          <p className="text-xs text-muted-foreground">
            Instructions that define the AI&apos;s role and output format
          </p>
          <Textarea
            value={edited.systemPrompt}
            onChange={(e) => handleChange({ systemPrompt: e.target.value })}
            rows={6}
            className="font-mono text-sm"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">User Prompt Template</label>
          <p className="text-xs text-muted-foreground">
            {"Variables: {{title}}, {{topic}}, {{targetAudience}}, {{speakerName}}, {{speakerBio}}, {{date}}, {{theses}}, {{context}}"}
          </p>
          <Textarea
            value={edited.userPromptTemplate}
            onChange={(e) => handleChange({ userPromptTemplate: e.target.value })}
            rows={8}
            className="font-mono text-sm"
          />
        </div>
      </CardContent>
    </Card>
  );
}

function PromptsSection() {
  const [prompts, setPrompts] = useState<PromptTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeArtifact, setActiveArtifact] = useState("presentation");

  const fetchPrompts = useCallback(async () => {
    try {
      const res = await fetch("/api/settings/prompts");
      const data = await res.json();
      setPrompts(data.prompts);
    } catch {
      console.error("Failed to fetch prompts");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPrompts();
  }, [fetchPrompts]);

  const handleSave = async (updated: PromptTemplate) => {
    const res = await fetch("/api/settings/prompts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updated),
    });
    if (!res.ok) throw new Error("Failed to save prompt");
    await fetchPrompts();
  };

  const artifactTypes = Object.keys(ARTIFACT_LABELS);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Configure AI prompts for each artifact type
      </p>

      <Tabs value={activeArtifact} onValueChange={setActiveArtifact}>
        <TabsList>
          {artifactTypes.map((type) => (
            <TabsTrigger key={type} value={type}>
              {ARTIFACT_LABELS[type]}
            </TabsTrigger>
          ))}
        </TabsList>

        {artifactTypes.map((type) => {
          const typePrompts = prompts.filter((p) => p.artifactType === type);

          return (
            <TabsContent key={type} value={type} className="mt-4 space-y-4">
              {typePrompts.length === 0 ? (
                <Card>
                  <CardContent className="py-8 text-center text-muted-foreground">
                    No prompts configured for {ARTIFACT_LABELS[type]}.
                  </CardContent>
                </Card>
              ) : (
                typePrompts.map((prompt) => (
                  <PromptEditor key={prompt.id} prompt={prompt} onSave={handleSave} />
                ))
              )}
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
}

// ── Main Settings Page ──

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("api-keys");

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold">Settings</h1>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="api-keys" className="gap-2">
            <KeyRound className="size-4" />
            API Keys
          </TabsTrigger>
          <TabsTrigger value="prompts" className="gap-2">
            <MessageSquare className="size-4" />
            Prompts
          </TabsTrigger>
        </TabsList>

        <TabsContent value="api-keys" className="mt-6">
          <ApiKeysSection />
        </TabsContent>

        <TabsContent value="prompts" className="mt-6">
          <PromptsSection />
        </TabsContent>
      </Tabs>
    </div>
  );
}
