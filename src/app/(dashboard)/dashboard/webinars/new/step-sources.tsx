"use client";

import { useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, X, Globe, FileText, Upload } from "lucide-react";
import type { WizardData } from "./page";
import type { SourceEntry } from "./types";

type Props = {
  data: WizardData;
  onChange: (partial: Partial<WizardData>) => void;
};

const FILE_EXTENSIONS: Record<string, SourceEntry["type"]> = {
  pdf: "pdf",
  csv: "csv",
  xlsx: "xlsx",
  xls: "xlsx",
  txt: "txt",
};

const ACCEPTED_FILES = ".pdf,.csv,.xlsx,.xls,.txt";

export function StepSources({ data, onChange }: Props) {
  const [urlInput, setUrlInput] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addUrl = () => {
    const trimmed = urlInput.trim();
    if (!trimmed) return;

    const entry: SourceEntry = {
      id: crypto.randomUUID(),
      type: "url",
      url: trimmed,
    };

    onChange({ sources: [...data.sources, entry] });
    setUrlInput("");
  };

  const addFiles = (files: FileList | null) => {
    if (!files) return;

    const entries: SourceEntry[] = Array.from(files).map((file) => {
      const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
      return {
        id: crypto.randomUUID(),
        type: FILE_EXTENSIONS[ext] ?? "txt",
        file,
        fileName: file.name,
      };
    });

    onChange({ sources: [...data.sources, ...entries] });

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeSource = (id: string) => {
    onChange({ sources: data.sources.filter((s) => s.id !== id) });
  };

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Add URLs and files that will be used as context for generating webinar
        content. This step is optional — you can add sources later.
      </p>

      {/* URL input */}
      <div className="space-y-2">
        <Label>Add URL</Label>
        <div className="flex gap-2">
          <Input
            placeholder="https://example.com/article"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addUrl())}
          />
          <Button type="button" variant="outline" onClick={addUrl} disabled={!urlInput.trim()}>
            <Plus className="size-4" />
            Add
          </Button>
        </div>
      </div>

      {/* File upload */}
      <div className="space-y-2">
        <Label>Upload Files</Label>
        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPTED_FILES}
          multiple
          className="hidden"
          onChange={(e) => addFiles(e.target.files)}
        />
        <Button
          type="button"
          variant="outline"
          className="w-full h-20 border-dashed"
          onClick={() => fileInputRef.current?.click()}
        >
          <div className="flex flex-col items-center gap-1 text-muted-foreground">
            <Upload className="size-5" />
            <span className="text-sm">
              Click to upload PDF, CSV, XLSX, or TXT
            </span>
          </div>
        </Button>
      </div>

      {/* Sources list */}
      {data.sources.length > 0 && (
        <div className="space-y-2">
          <Label>Added Sources ({data.sources.length})</Label>
          <div className="space-y-2">
            {data.sources.map((source) => (
              <div
                key={source.id}
                className="flex items-center justify-between rounded-md border px-3 py-2"
              >
                <div className="flex items-center gap-2 min-w-0">
                  {source.type === "url" ? (
                    <Globe className="size-4 shrink-0 text-muted-foreground" />
                  ) : (
                    <FileText className="size-4 shrink-0 text-muted-foreground" />
                  )}
                  <span className="text-sm truncate">
                    {source.type === "url" ? source.url : source.fileName}
                  </span>
                  <Badge variant="secondary" className="shrink-0">
                    {source.type.toUpperCase()}
                  </Badge>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-7 shrink-0"
                  onClick={() => removeSource(source.id)}
                >
                  <X className="size-3.5" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
