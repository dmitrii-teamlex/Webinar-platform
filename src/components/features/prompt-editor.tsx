"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ChevronDown, ChevronUp, Save, RotateCcw } from "lucide-react";
import type { ArtifactType } from "@/types/artifact";

type PromptData = {
  id: string;
  artifactType: ArtifactType;
  name: string;
  systemPrompt: string;
  userPromptTemplate: string;
  isDefault: boolean;
};

type Props = {
  /** Which artifact types to show prompts for */
  artifactTypes: ArtifactType[];
};

const TYPE_LABELS: Record<ArtifactType, string> = {
  theses: "Theses",
  presentation: "Presentation",
  landing_page: "Landing Page",
  thank_you: "Thank-You Page",
  attendance_chain: "Attendance Chain",
  gift: "Gifts",
};

export function PromptEditor({ artifactTypes }: Props) {
  const [prompts, setPrompts] = useState<PromptData[]>([]);
  const [originals, setOriginals] = useState<Map<string, PromptData>>(new Map());
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/settings/prompts")
      .then((r) => r.json())
      .then((data) => {
        const filtered = (data.prompts as PromptData[]).filter((p) =>
          artifactTypes.includes(p.artifactType)
        );
        setPrompts(filtered);
        setOriginals(new Map(filtered.map((p) => [p.id, { ...p }])));
      })
      .catch(console.error);
  }, [artifactTypes]);

  const updatePrompt = (id: string, field: "systemPrompt" | "userPromptTemplate", value: string) => {
    setPrompts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, [field]: value } : p))
    );
  };

  const savePrompt = async (prompt: PromptData) => {
    setSaving(prompt.id);
    try {
      await fetch("/api/settings/prompts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(prompt),
      });
      setOriginals((prev) => new Map(prev).set(prompt.id, { ...prompt }));
    } catch (e) {
      console.error("Failed to save prompt:", e);
    } finally {
      setSaving(null);
    }
  };

  const resetPrompt = (id: string) => {
    const original = originals.get(id);
    if (original) {
      setPrompts((prev) =>
        prev.map((p) => (p.id === id ? { ...original } : p))
      );
    }
  };

  const hasChanges = (id: string) => {
    const current = prompts.find((p) => p.id === id);
    const original = originals.get(id);
    if (!current || !original) return false;
    return (
      current.systemPrompt !== original.systemPrompt ||
      current.userPromptTemplate !== original.userPromptTemplate
    );
  };

  if (prompts.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Generation Prompts</CardTitle>
        <CardDescription>
          Customize AI prompts before generation. The prompt defines what the AI
          generates — number of messages, structure, tone, etc.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {prompts.map((prompt) => {
          const expanded = expandedId === prompt.id;
          const changed = hasChanges(prompt.id);

          return (
            <div key={prompt.id} className="rounded-lg border">
              {/* Header — always visible */}
              <button
                className="flex w-full items-center justify-between px-4 py-3 text-left"
                onClick={() => setExpandedId(expanded ? null : prompt.id)}
              >
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">
                    {TYPE_LABELS[prompt.artifactType]}
                  </span>
                  <Badge variant="secondary" className="text-xs">
                    {prompt.name}
                  </Badge>
                  {changed && (
                    <Badge variant="outline" className="text-xs text-orange-600 border-orange-300">
                      modified
                    </Badge>
                  )}
                </div>
                {expanded ? (
                  <ChevronUp className="size-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="size-4 text-muted-foreground" />
                )}
              </button>

              {/* Expanded content */}
              {expanded && (
                <div className="border-t px-4 pb-4 pt-3 space-y-4">
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">
                      System Prompt (role & output format)
                    </Label>
                    <Textarea
                      value={prompt.systemPrompt}
                      onChange={(e) =>
                        updatePrompt(prompt.id, "systemPrompt", e.target.value)
                      }
                      rows={4}
                      className="font-mono text-xs"
                    />
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">
                      User Prompt Template (variables: {"{{title}}"}, {"{{topic}}"}, {"{{theses}}"}, {"{{context}}"}, {"{{date}}"}, {"{{targetAudience}}"}, {"{{speakerName}}"})
                    </Label>
                    <Textarea
                      value={prompt.userPromptTemplate}
                      onChange={(e) =>
                        updatePrompt(prompt.id, "userPromptTemplate", e.target.value)
                      }
                      rows={6}
                      className="font-mono text-xs"
                    />
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <Button
                      size="sm"
                      onClick={() => savePrompt(prompt)}
                      disabled={!changed || saving === prompt.id}
                    >
                      <Save className="size-3.5" />
                      {saving === prompt.id ? "Saving..." : "Save"}
                    </Button>
                    {changed && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => resetPrompt(prompt.id)}
                      >
                        <RotateCcw className="size-3.5" />
                        Reset
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
