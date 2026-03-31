"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { PromptEditor } from "@/components/features/prompt-editor";
import type { ArtifactType } from "@/types/artifact";
import {
  CheckCircle2,
  Circle,
  Pencil,
  Trash2,
  Save,
  X,
  Loader2,
  ArrowLeft,
  Sparkles,
  CheckCheck,
} from "lucide-react";

type Thesis = {
  id: string;
  title: string;
  description: string;
  order: number;
  approved: boolean;
};

export default function ThesesPage() {
  const { id: webinarId } = useParams<{ id: string }>();
  const router = useRouter();
  const [theses, setTheses] = useState<Thesis[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [approving, setApproving] = useState(false);

  const fetchTheses = useCallback(async () => {
    const res = await fetch(`/api/webinars/${webinarId}/theses`);
    const data = await res.json();
    setTheses(data.theses ?? []);
  }, [webinarId]);

  useEffect(() => {
    fetchTheses().finally(() => setLoading(false));
  }, [fetchTheses]);

  const toggleApproval = async (thesisId: string, current: boolean) => {
    await fetch(`/api/webinars/${webinarId}/theses`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "update",
        updates: [{ id: thesisId, approved: !current }],
      }),
    });
    setTheses((prev) =>
      prev.map((t) =>
        t.id === thesisId ? { ...t, approved: !current } : t
      )
    );
  };

  const startEdit = (thesis: Thesis) => {
    setEditingId(thesis.id);
    setEditTitle(thesis.title);
    setEditDescription(thesis.description);
  };

  const saveEdit = async () => {
    if (!editingId) return;
    await fetch(`/api/webinars/${webinarId}/theses`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "update",
        updates: [{ id: editingId, title: editTitle, description: editDescription }],
      }),
    });
    setTheses((prev) =>
      prev.map((t) =>
        t.id === editingId
          ? { ...t, title: editTitle, description: editDescription }
          : t
      )
    );
    setEditingId(null);
  };

  const deleteThesis = async (thesisId: string) => {
    await fetch(`/api/webinars/${webinarId}/theses?thesisId=${thesisId}`, {
      method: "DELETE",
    });
    setTheses((prev) => prev.filter((t) => t.id !== thesisId));
  };

  const approveSelected = async () => {
    setApproving(true);
    const approvedIds = theses.filter((t) => t.approved).map((t) => t.id);

    if (approvedIds.length === 0) {
      setApproving(false);
      return;
    }

    await fetch(`/api/webinars/${webinarId}/theses`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "approve_selected",
        thesisIds: approvedIds,
      }),
    });

    setApproving(false);
    router.push(`/dashboard/webinars/${webinarId}`);
  };

  const approveAll = async () => {
    setApproving(true);
    await fetch(`/api/webinars/${webinarId}/theses`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "approve_all" }),
    });
    setApproving(false);
    router.push(`/dashboard/webinars/${webinarId}`);
  };

  const approvedCount = theses.filter((t) => t.approved).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push(`/dashboard/webinars/${webinarId}`)}
        >
          <ArrowLeft className="size-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Theses Review</h1>
          <p className="text-muted-foreground">
            Review, edit, and approve thesis ideas before generation
          </p>
        </div>
      </div>

      {/* Status bar */}
      <div className="flex items-center justify-between rounded-lg border px-4 py-3">
        <div className="flex items-center gap-4 text-sm">
          <span>
            <strong>{theses.length}</strong> theses total
          </span>
          <Separator orientation="vertical" className="h-4" />
          <span className="text-green-600">
            <strong>{approvedCount}</strong> approved
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={approveAll}
            disabled={approving || theses.length === 0}
          >
            <CheckCheck className="size-3.5" />
            Approve All
          </Button>
          <Button
            size="sm"
            onClick={approveSelected}
            disabled={approving || approvedCount === 0}
          >
            {approving ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Sparkles className="size-3.5" />
            )}
            Approve & Generate ({approvedCount})
          </Button>
        </div>
      </div>

      {/* Prompt customization — user edits before approval */}
      <PromptEditor
        artifactTypes={
          [
            "presentation",
            "landing_page",
            "thank_you",
            "attendance_chain",
            "gift",
          ] as ArtifactType[]
        }
      />

      {/* Theses list */}
      {theses.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              No theses generated yet. Theses will appear here after source
              materials are processed.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {theses
            .sort((a, b) => a.order - b.order)
            .map((thesis) => (
              <Card
                key={thesis.id}
                className={thesis.approved ? "border-green-200 bg-green-50/50 dark:border-green-900 dark:bg-green-950/20" : ""}
              >
                <CardContent className="pt-4 pb-4">
                  {editingId === thesis.id ? (
                    /* Edit mode */
                    <div className="space-y-3">
                      <Input
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        placeholder="Thesis title"
                      />
                      <Textarea
                        value={editDescription}
                        onChange={(e) => setEditDescription(e.target.value)}
                        placeholder="Description"
                        rows={3}
                      />
                      <div className="flex gap-2">
                        <Button size="sm" onClick={saveEdit}>
                          <Save className="size-3.5" />
                          Save
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setEditingId(null)}
                        >
                          <X className="size-3.5" />
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    /* View mode */
                    <div className="flex items-start gap-3">
                      {/* Approve toggle */}
                      <button
                        onClick={() => toggleApproval(thesis.id, thesis.approved)}
                        className="mt-0.5 shrink-0"
                      >
                        {thesis.approved ? (
                          <CheckCircle2 className="size-5 text-green-600" />
                        ) : (
                          <Circle className="size-5 text-muted-foreground hover:text-green-600 transition-colors" />
                        )}
                      </button>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium">{thesis.title}</h3>
                          {thesis.approved && (
                            <Badge variant="default" className="bg-green-600 text-xs">
                              Approved
                            </Badge>
                          )}
                        </div>
                        {thesis.description && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {thesis.description}
                          </p>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1 shrink-0">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-7"
                          onClick={() => startEdit(thesis)}
                        >
                          <Pencil className="size-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-7 text-destructive hover:text-destructive"
                          onClick={() => deleteThesis(thesis.id)}
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
        </div>
      )}
    </div>
  );
}
