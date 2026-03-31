"use client";

import React from "react";
import type { LandingPageContent } from "@/types/artifact";
import { ArtifactEditor } from "@/components/features/editor/artifact-editor";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { useArtifact } from "@/lib/hooks/use-artifact";

export default function LandingPagePage() {
  const { artifact, loading, save, regenerate } = useArtifact("landing_page");

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Landing Page Brief</h1>
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
    const data = content as LandingPageContent | null;
    if (!data) return <p className="text-muted-foreground">No content yet.</p>;

    const update = (patch: Partial<LandingPageContent>) =>
      onChange({ ...data, ...patch });

    if (readOnly) {
      return (
        <div className="space-y-6">
          {/* Hero */}
          <div className="space-y-2">
            <Badge variant="outline">Hero</Badge>
            <h2 className="text-2xl font-bold">{data.headline}</h2>
            <p className="text-lg text-muted-foreground">{data.subheadline}</p>
          </div>

          <Separator />

          {/* Bullets */}
          <div className="space-y-2">
            <Badge variant="outline">Key Points</Badge>
            <ul className="list-disc pl-5 space-y-1">
              {data.bullets.map((b, i) => (
                <li key={i} className="text-sm">{b}</li>
              ))}
            </ul>
          </div>

          <Separator />

          {/* Social Proof */}
          <div className="space-y-3">
            <Badge variant="outline">Social Proof</Badge>
            {data.socialProof.map((sp, i) => (
              <Card key={i}>
                <CardContent className="py-3">
                  <p className="text-sm italic">&ldquo;{sp.text}&rdquo;</p>
                  <p className="text-xs text-muted-foreground mt-1">— {sp.author}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <Separator />

          {/* CTA */}
          <div className="space-y-2">
            <Badge variant="outline">CTA</Badge>
            <div className="bg-primary/10 rounded-lg p-4 text-center">
              <p className="font-bold text-lg">{data.cta.text}</p>
              {data.cta.subtext && (
                <p className="text-sm text-muted-foreground">{data.cta.subtext}</p>
              )}
            </div>
          </div>

          <Separator />

          {/* Speaker Bio */}
          <div className="space-y-2">
            <Badge variant="outline">Speaker Bio</Badge>
            <p className="text-sm whitespace-pre-wrap">{data.speakerBio}</p>
          </div>

          {/* Urgency */}
          {data.urgencyBlock && (
            <>
              <Separator />
              <div className="space-y-2">
                <Badge variant="outline">Urgency Block</Badge>
                <p className="text-sm whitespace-pre-wrap">{data.urgencyBlock}</p>
              </div>
            </>
          )}
        </div>
      );
    }

    // Edit mode
    return (
      <div className="space-y-6">
        <div className="space-y-3">
          <label className="text-sm font-medium">Headline</label>
          <Input
            value={data.headline}
            onChange={(e) => update({ headline: e.target.value })}
          />
        </div>

        <div className="space-y-3">
          <label className="text-sm font-medium">Subheadline</label>
          <Textarea
            value={data.subheadline}
            onChange={(e) => update({ subheadline: e.target.value })}
            rows={2}
          />
        </div>

        <Separator />

        <div className="space-y-3">
          <label className="text-sm font-medium">Bullet Points</label>
          {data.bullets.map((b, i) => (
            <Input
              key={i}
              value={b}
              onChange={(e) => {
                const next = [...data.bullets];
                next[i] = e.target.value;
                update({ bullets: next });
              }}
              placeholder={`Bullet ${i + 1}`}
            />
          ))}
        </div>

        <Separator />

        <div className="space-y-3">
          <label className="text-sm font-medium">Social Proof</label>
          {data.socialProof.map((sp, i) => (
            <Card key={i}>
              <CardContent className="py-3 space-y-2">
                <Textarea
                  value={sp.text}
                  onChange={(e) => {
                    const next = [...data.socialProof];
                    next[i] = { ...sp, text: e.target.value };
                    update({ socialProof: next });
                  }}
                  placeholder="Quote text"
                  rows={2}
                />
                <Input
                  value={sp.author}
                  onChange={(e) => {
                    const next = [...data.socialProof];
                    next[i] = { ...sp, author: e.target.value };
                    update({ socialProof: next });
                  }}
                  placeholder="Author"
                />
              </CardContent>
            </Card>
          ))}
        </div>

        <Separator />

        <div className="space-y-3">
          <label className="text-sm font-medium">CTA</label>
          <Input
            value={data.cta.text}
            onChange={(e) =>
              update({ cta: { ...data.cta, text: e.target.value } })
            }
            placeholder="CTA text"
          />
          <Input
            value={data.cta.subtext ?? ""}
            onChange={(e) =>
              update({
                cta: { ...data.cta, subtext: e.target.value || undefined },
              })
            }
            placeholder="CTA subtext (optional)"
          />
        </div>

        <Separator />

        <div className="space-y-3">
          <label className="text-sm font-medium">Speaker Bio</label>
          <Textarea
            value={data.speakerBio}
            onChange={(e) => update({ speakerBio: e.target.value })}
            rows={4}
          />
        </div>

        <div className="space-y-3">
          <label className="text-sm font-medium">Urgency Block (optional)</label>
          <Textarea
            value={data.urgencyBlock ?? ""}
            onChange={(e) =>
              update({ urgencyBlock: e.target.value || undefined })
            }
            rows={2}
          />
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Landing Page Brief</h1>
        <p className="text-muted-foreground">
          Registration page copy: headline, bullets, social proof, CTA, speaker bio
        </p>
      </div>

      <ArtifactEditor
        artifactId={artifact?.id ?? ""}
        artifactType="landing_page"
        content={artifact?.content ?? null}
        version={artifact?.version ?? 1}
        status={artifact?.status ?? "pending"}
        onSave={save}
        onRegenerate={regenerate}
        renderEditor={renderEditor}
      />
    </div>
  );
}
