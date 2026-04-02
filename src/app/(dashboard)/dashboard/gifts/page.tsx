"use client";

import React, { Suspense } from "react";
import type { GiftContent } from "@/types/artifact";
import { ArtifactEditor } from "@/components/features/editor/artifact-editor";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { useSearchParams } from "next/navigation";
import { useArtifact } from "@/lib/hooks/use-artifact";
import { ArtifactChat } from "@/components/features/editor/artifact-chat";

export default function GiftsPage() {
  return (
    <Suspense fallback={<div className="space-y-6"><div><h1 className="text-2xl font-bold">Gifts</h1><p className="text-muted-foreground">Loading...</p></div></div>}>
      <GiftsPageInner />
    </Suspense>
  );
}

function GiftsPageInner() {
  const searchParams = useSearchParams();
  const webinarId = searchParams.get("webinarId") ?? undefined;
  const { artifact, loading, save, regenerate, generate, refetch } =
    useArtifact(webinarId, "gift");

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Gifts</h1>
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
    const data = content as GiftContent | null;
    if (!data) return <p className="text-muted-foreground">No content yet.</p>;

    if (readOnly) {
      return (
        <div className="space-y-6">
          {data.gifts.map((gift, i) => (
            <div key={i} className="space-y-3">
              <div className="flex items-center gap-2">
                <Badge variant="outline">Gift {i + 1}</Badge>
                <span className="font-medium">{gift.title}</span>
              </div>

              <div className="pl-4 border-l-2 border-muted space-y-3">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
                    Concept
                  </p>
                  <p className="text-sm">{gift.concept}</p>
                </div>

                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
                    Copy
                  </p>
                  <p className="text-sm whitespace-pre-wrap">{gift.fullCopy}</p>
                </div>

                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
                    Visual Brief
                  </p>
                  <p className="text-sm whitespace-pre-wrap">{gift.visualBrief}</p>
                </div>
              </div>

              {i < data.gifts.length - 1 && <Separator />}
            </div>
          ))}
        </div>
      );
    }

    // Edit mode
    const updateGift = (index: number, patch: Record<string, string>) => {
      const gifts = [...data.gifts];
      gifts[index] = { ...gifts[index], ...patch };
      onChange({ ...data, gifts });
    };

    return (
      <div className="space-y-6">
        {data.gifts.map((gift, i) => (
          <div key={i} className="space-y-3">
            <Badge variant="outline">Gift {i + 1}</Badge>

            <div className="space-y-3 pl-4 border-l-2 border-muted">
              <div className="space-y-1">
                <label className="text-sm font-medium">Title</label>
                <Input
                  value={gift.title}
                  onChange={(e) => updateGift(i, { title: e.target.value })}
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium">Concept</label>
                <Textarea
                  value={gift.concept}
                  onChange={(e) => updateGift(i, { concept: e.target.value })}
                  rows={2}
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium">Full Copy</label>
                <Textarea
                  value={gift.fullCopy}
                  onChange={(e) => updateGift(i, { fullCopy: e.target.value })}
                  rows={4}
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium">Visual Brief</label>
                <Textarea
                  value={gift.visualBrief}
                  onChange={(e) => updateGift(i, { visualBrief: e.target.value })}
                  rows={3}
                />
              </div>
            </div>

            {i < data.gifts.length - 1 && <Separator />}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Gifts</h1>
        <p className="text-muted-foreground">
          Attendance incentives: concept, copywriting, visual brief for designers
        </p>
      </div>

      <ArtifactEditor
        artifactId={artifact?.id ?? ""}
        artifactType="gift"
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
