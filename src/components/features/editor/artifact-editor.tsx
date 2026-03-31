"use client";

import React, { useState } from "react";
import type { ArtifactType } from "@/types/artifact";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { RefreshCw, Save, History, Pencil, Eye } from "lucide-react";

type ArtifactEditorProps = {
  artifactId: string;
  artifactType: ArtifactType;
  content: unknown;
  version: number;
  status: "pending" | "generating" | "completed" | "failed";
  onSave?: (content: unknown) => void;
  onRegenerate?: () => void;
  /** Each artifact type provides its own editor view component */
  renderEditor?: (props: {
    content: unknown;
    onChange: (content: unknown) => void;
    readOnly: boolean;
  }) => React.ReactNode;
};

export function ArtifactEditor({
  artifactId,
  artifactType,
  content,
  version,
  status,
  onSave,
  onRegenerate,
  renderEditor,
}: ArtifactEditorProps) {
  const [mode, setMode] = useState<"view" | "edit">("view");
  const [editedContent, setEditedContent] = useState(content);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave?.(editedContent);
      setMode("view");
    } finally {
      setIsSaving(false);
    }
  };

  if (status === "generating") {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="size-4 animate-spin" />
            Generating {artifactType.replace("_", " ")}...
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (status === "failed") {
    return (
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="text-destructive">Generation Failed</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Something went wrong during generation. You can retry.
          </p>
          <Button onClick={onRegenerate} variant="outline">
            <RefreshCw className="size-4" />
            Retry Generation
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (status === "pending" || !content) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-muted-foreground">
            {artifactType.replace("_", " ")} — Not yet generated
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            This artifact will be generated after thesis approval.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CardTitle className="capitalize">
              {artifactType.replace("_", " ")}
            </CardTitle>
            <Badge variant="secondary">v{version}</Badge>
          </div>
          <div className="flex items-center gap-2">
            <Tabs
              value={mode}
              onValueChange={(v) => setMode(v as "view" | "edit")}
            >
              <TabsList>
                <TabsTrigger value="view">
                  <Eye className="size-3.5 mr-1" />
                  View
                </TabsTrigger>
                <TabsTrigger value="edit">
                  <Pencil className="size-3.5 mr-1" />
                  Edit
                </TabsTrigger>
              </TabsList>
            </Tabs>
            <Button
              variant="outline"
              size="sm"
              onClick={onRegenerate}
            >
              <RefreshCw className="size-3.5" />
              Regenerate
            </Button>
            <Button variant="outline" size="sm">
              <History className="size-3.5" />
              History
            </Button>
            {mode === "edit" && (
              <Button size="sm" onClick={handleSave} disabled={isSaving}>
                <Save className="size-3.5" />
                {isSaving ? "Saving..." : "Save"}
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {renderEditor ? (
          renderEditor({
            content: mode === "edit" ? editedContent : content,
            onChange: setEditedContent,
            readOnly: mode === "view",
          })
        ) : (
          <pre className="whitespace-pre-wrap text-sm font-mono bg-muted p-4 rounded-md overflow-auto max-h-[600px]">
            {JSON.stringify(content, null, 2)}
          </pre>
        )}
      </CardContent>
    </Card>
  );
}
