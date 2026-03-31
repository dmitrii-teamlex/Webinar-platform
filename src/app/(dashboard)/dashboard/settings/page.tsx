"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Save, RotateCcw } from "lucide-react";

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
            <Button
              variant="outline"
              size="sm"
              onClick={handleReset}
              disabled={!dirty}
            >
              <RotateCcw className="size-3.5" />
              Reset
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={!dirty || saving}
            >
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
            onChange={(e) =>
              handleChange({ userPromptTemplate: e.target.value })
            }
            rows={8}
            className="font-mono text-sm"
          />
        </div>
      </CardContent>
    </Card>
  );
}

export default function SettingsPage() {
  const [prompts, setPrompts] = useState<PromptTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("presentation");

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
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Settings</h1>
          <p className="text-muted-foreground">Loading prompts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground">
          Configure AI prompts for each artifact type
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
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
                  <PromptEditor
                    key={prompt.id}
                    prompt={prompt}
                    onSave={handleSave}
                  />
                ))
              )}
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
}
