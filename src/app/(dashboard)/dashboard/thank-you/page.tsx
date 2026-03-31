"use client";

import React from "react";
import type { ThankYouContent } from "@/types/artifact";
import { ArtifactEditor } from "@/components/features/editor/artifact-editor";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";

// TODO: Replace with real data fetching from API
const MOCK_CONTENT: ThankYouContent | null = null;

export default function ThankYouPage() {
  const renderEditor = ({
    content,
    onChange,
    readOnly,
  }: {
    content: unknown;
    onChange: (content: unknown) => void;
    readOnly: boolean;
  }) => {
    const data = content as ThankYouContent | null;
    if (!data) return <p className="text-muted-foreground">No content yet.</p>;

    const update = (patch: Partial<ThankYouContent>) =>
      onChange({ ...data, ...patch });

    if (readOnly) {
      return (
        <div className="space-y-6">
          <div className="space-y-2">
            <h2 className="text-2xl font-bold">{data.headline}</h2>
            <p className="text-muted-foreground whitespace-pre-wrap">{data.body}</p>
          </div>

          <Separator />

          <div className="space-y-3">
            <Badge variant="outline">Next Steps</Badge>
            <div className="grid gap-3">
              {data.nextSteps.map((ns) => (
                <Card key={ns.step}>
                  <CardContent className="py-3">
                    <div className="flex items-start gap-3">
                      <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">
                        {ns.step}
                      </div>
                      <div>
                        <h4 className="font-semibold text-sm">{ns.title}</h4>
                        <p className="text-sm text-muted-foreground">
                          {ns.description}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {data.giftDeliveryMessage && (
            <>
              <Separator />
              <div className="space-y-2">
                <Badge variant="outline">Gift Delivery</Badge>
                <p className="text-sm whitespace-pre-wrap">
                  {data.giftDeliveryMessage}
                </p>
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
          <label className="text-sm font-medium">Body</label>
          <Textarea
            value={data.body}
            onChange={(e) => update({ body: e.target.value })}
            rows={4}
          />
        </div>

        <Separator />

        <div className="space-y-3">
          <label className="text-sm font-medium">Next Steps</label>
          {data.nextSteps.map((ns, i) => (
            <Card key={ns.step}>
              <CardContent className="py-3 space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">Step {ns.step}</Badge>
                  <Input
                    value={ns.title}
                    onChange={(e) => {
                      const next = [...data.nextSteps];
                      next[i] = { ...ns, title: e.target.value };
                      update({ nextSteps: next });
                    }}
                    placeholder="Step title"
                    className="flex-1"
                  />
                </div>
                <Textarea
                  value={ns.description}
                  onChange={(e) => {
                    const next = [...data.nextSteps];
                    next[i] = { ...ns, description: e.target.value };
                    update({ nextSteps: next });
                  }}
                  placeholder="Step description"
                  rows={2}
                />
              </CardContent>
            </Card>
          ))}
        </div>

        <Separator />

        <div className="space-y-3">
          <label className="text-sm font-medium">Gift Delivery Message (optional)</label>
          <Textarea
            value={data.giftDeliveryMessage ?? ""}
            onChange={(e) =>
              update({ giftDeliveryMessage: e.target.value || undefined })
            }
            rows={3}
          />
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Thank-You Page</h1>
        <p className="text-muted-foreground">
          Post-registration confirmation: next steps and gift delivery
        </p>
      </div>

      <ArtifactEditor
        artifactId="mock-thank-you-id"
        artifactType="thank_you"
        content={MOCK_CONTENT}
        version={1}
        status={MOCK_CONTENT ? "completed" : "pending"}
        renderEditor={renderEditor}
      />
    </div>
  );
}
