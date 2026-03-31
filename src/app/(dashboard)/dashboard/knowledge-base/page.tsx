"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Upload,
  FileText,
  Trash2,
  Loader2,
  CheckCircle2,
  XCircle,
  HardDrive,
} from "lucide-react";

type KBFile = {
  id: string;
  fileName: string;
  fileSize: number;
  extractedText: string;
  chunksCount: number;
  status: "processing" | "completed" | "failed";
  createdAt: string;
};

const ACCEPTED = ".pdf,.csv,.xlsx,.xls,.txt";

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function KnowledgeBasePage() {
  const [files, setFiles] = useState<KBFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchFiles = async () => {
    const res = await fetch("/api/knowledge-base");
    const data = await res.json();
    setFiles(data.files ?? []);
  };

  useEffect(() => {
    fetchFiles().finally(() => setLoading(false));
  }, []);

  const handleUpload = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    setUploading(true);

    for (const file of Array.from(fileList)) {
      const formData = new FormData();
      formData.append("file", file);

      try {
        await fetch("/api/knowledge-base", {
          method: "POST",
          body: formData,
        });
      } catch (e) {
        console.error(`Failed to upload ${file.name}:`, e);
      }
    }

    await fetchFiles();
    setUploading(false);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleDelete = async (id: string) => {
    setDeleting(id);
    await fetch(`/api/knowledge-base?id=${id}`, { method: "DELETE" });
    setFiles((prev) => prev.filter((f) => f.id !== id));
    setDeleting(null);
  };

  const totalChunks = files.reduce((sum, f) => sum + f.chunksCount, 0);
  const completedFiles = files.filter((f) => f.status === "completed").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Knowledge Base</h1>
          <p className="text-muted-foreground">
            Upload reference materials available to all webinars
          </p>
        </div>
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPTED}
            multiple
            className="hidden"
            onChange={(e) => handleUpload(e.target.files)}
          />
          <Button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Upload className="size-4" />
            )}
            {uploading ? "Uploading..." : "Upload Files"}
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <HardDrive className="size-5 text-muted-foreground" />
              <div>
                <p className="text-2xl font-bold">{files.length}</p>
                <p className="text-xs text-muted-foreground">Total files</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="size-5 text-green-600" />
              <div>
                <p className="text-2xl font-bold">{completedFiles}</p>
                <p className="text-xs text-muted-foreground">Processed</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <FileText className="size-5 text-muted-foreground" />
              <div>
                <p className="text-2xl font-bold">{totalChunks}</p>
                <p className="text-xs text-muted-foreground">Text chunks</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* File list */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : files.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <Upload className="size-10 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground mb-2">
                No files in the knowledge base yet
              </p>
              <p className="text-sm text-muted-foreground">
                Upload PDF, CSV, XLSX, or TXT files to build a shared reference
                library for all webinar generators.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Files</CardTitle>
            <CardDescription>
              Uploaded reference materials, parsed and embedded for RAG
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {files.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center justify-between rounded-md border px-4 py-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <FileText className="size-5 shrink-0 text-muted-foreground" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">
                        {file.fileName}
                      </p>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span>{formatBytes(file.fileSize)}</span>
                        {file.status === "completed" && (
                          <span>{file.chunksCount} chunks</span>
                        )}
                        <span>
                          {new Date(file.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {file.status === "processing" && (
                      <Badge variant="outline" className="gap-1">
                        <Loader2 className="size-3 animate-spin" />
                        Processing
                      </Badge>
                    )}
                    {file.status === "completed" && (
                      <Badge variant="default" className="bg-green-600 gap-1">
                        <CheckCircle2 className="size-3" />
                        Ready
                      </Badge>
                    )}
                    {file.status === "failed" && (
                      <Badge variant="destructive" className="gap-1">
                        <XCircle className="size-3" />
                        Failed
                      </Badge>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8 text-destructive hover:text-destructive"
                      onClick={() => handleDelete(file.id)}
                      disabled={deleting === file.id}
                    >
                      {deleting === file.id ? (
                        <Loader2 className="size-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="size-3.5" />
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
