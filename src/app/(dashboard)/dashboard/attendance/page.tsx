"use client";

import React, { Suspense } from "react";
import type { AttendanceChainContent } from "@/types/artifact";
import { ArtifactEditor } from "@/components/features/editor/artifact-editor";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { useSearchParams } from "next/navigation";
import { useArtifact } from "@/lib/hooks/use-artifact";
import { ArtifactChat } from "@/components/features/editor/artifact-chat";

const STAGE_LABELS: Record<string, string> = {
  registration_confirmation: "Registration Confirmation",
  warmup: "Warmup",
  day_of: "Day Of Webinar",
  during_webinar: "During Webinar",
  post_webinar: "Post-Webinar",
};

const CHANNEL_COLORS: Record<string, "default" | "secondary" | "outline"> = {
  email: "default",
  messenger: "secondary",
  sms: "outline",
};

export default function AttendanceChainPage() {
  return (
    <Suspense fallback={<div className="space-y-6"><div><h1 className="text-2xl font-bold">Attendance Chain</h1><p className="text-muted-foreground">Loading...</p></div></div>}>
      <AttendanceChainInner />
    </Suspense>
  );
}

function AttendanceChainInner() {
  const searchParams = useSearchParams();
  const webinarId = searchParams.get("webinarId") ?? undefined;
  const { artifact, loading, save, regenerate, generate, refetch } =
    useArtifact(webinarId, "attendance_chain");

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Attendance Chain</h1>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  const renderEditor = ({
    content,
    onChange,
    readOnly,
  }: {
    content: unknown;
    onChange: (content: unknown) => void;
    readOnly: boolean;
  }) => {
    const data = content as AttendanceChainContent | null;
    if (!data) return <p className="text-muted-foreground">No content yet.</p>;

    if (readOnly) {
      return (
        <div className="space-y-6">
          {data.stages.map((stage, si) => (
            <div key={si} className="space-y-3">
              <div className="flex items-center gap-2">
                <Badge variant="outline">
                  {STAGE_LABELS[stage.type] ?? stage.type}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {stage.timing}
                </span>
              </div>

              <div className="space-y-2 pl-4 border-l-2 border-muted">
                {stage.messages.map((msg, mi) => (
                  <Card key={mi}>
                    <CardContent className="py-3 space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={CHANNEL_COLORS[msg.channel] ?? "outline"}
                          className="text-xs"
                        >
                          {msg.channel}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {msg.timing}
                        </span>
                      </div>
                      {msg.subject && (
                        <p className="text-sm font-medium">{msg.subject}</p>
                      )}
                      <p className="text-sm whitespace-pre-wrap">{msg.body}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {si < data.stages.length - 1 && <Separator />}
            </div>
          ))}
        </div>
      );
    }

    // Edit mode
    const updateStage = (
      stageIndex: number,
      msgIndex: number,
      patch: Record<string, string>
    ) => {
      const stages = [...data.stages];
      const messages = [...stages[stageIndex].messages];
      messages[msgIndex] = { ...messages[msgIndex], ...patch };
      stages[stageIndex] = { ...stages[stageIndex], messages };
      onChange({ ...data, stages });
    };

    return (
      <div className="space-y-6">
        {data.stages.map((stage, si) => (
          <div key={si} className="space-y-3">
            <div className="flex items-center gap-2">
              <Badge variant="outline">
                {STAGE_LABELS[stage.type] ?? stage.type}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {stage.timing}
              </span>
            </div>

            <div className="space-y-3 pl-4 border-l-2 border-muted">
              {stage.messages.map((msg, mi) => (
                <Card key={mi}>
                  <CardContent className="py-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={CHANNEL_COLORS[msg.channel] ?? "outline"}
                        className="text-xs"
                      >
                        {msg.channel}
                      </Badge>
                    </div>
                    {msg.channel === "email" && (
                      <Input
                        value={msg.subject ?? ""}
                        onChange={(e) =>
                          updateStage(si, mi, { subject: e.target.value })
                        }
                        placeholder="Subject line"
                      />
                    )}
                    <Textarea
                      value={msg.body}
                      onChange={(e) =>
                        updateStage(si, mi, { body: e.target.value })
                      }
                      rows={4}
                    />
                  </CardContent>
                </Card>
              ))}
            </div>

            {si < data.stages.length - 1 && <Separator />}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Attendance Chain</h1>
        <p className="text-muted-foreground">
          Multi-stage messaging: confirmation, warmup, day-of, during, post-webinar
        </p>
      </div>

      <ArtifactEditor
        artifactId={artifact?.id ?? ""}
        artifactType="attendance_chain"
        content={artifact?.content ?? null}
        version={artifact?.version ?? 1}
        status={artifact?.status ?? "pending"}
        onSave={save}
        onRegenerate={regenerate}
        onGenerate={generate}
        renderEditor={renderEditor}
      />

      {artifact?.status === "completed" && artifact.id && (
        <ArtifactChat artifactId={artifact.id} onRefined={refetch} />
      )}
    </div>
  );
}
