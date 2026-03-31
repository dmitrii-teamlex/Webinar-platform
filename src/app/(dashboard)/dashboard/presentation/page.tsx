"use client";

import React, { useState } from "react";
import type { PresentationContent, Slide } from "@/types/artifact";
import { ArtifactEditor } from "@/components/features/editor/artifact-editor";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

// ── Slide Card Component ──────────────────────────────────────

function SlideCard({
  slide,
  onChange,
  readOnly,
}: {
  slide: Slide;
  onChange: (updated: Slide) => void;
  readOnly: boolean;
}) {
  const layoutColors: Record<string, string> = {
    title: "bg-blue-100 text-blue-800",
    text: "bg-gray-100 text-gray-800",
    bullets: "bg-green-100 text-green-800",
    image: "bg-purple-100 text-purple-800",
    quote: "bg-amber-100 text-amber-800",
    two_column: "bg-cyan-100 text-cyan-800",
    cta: "bg-red-100 text-red-800",
  };

  if (readOnly) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium">
              Slide {slide.slideNumber}
            </CardTitle>
            <div className="flex gap-1.5">
              {slide.layout && (
                <Badge
                  variant="secondary"
                  className={layoutColors[slide.layout] ?? ""}
                >
                  {slide.layout}
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          <h4 className="font-semibold text-sm">{slide.title}</h4>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">
            {slide.body}
          </p>
          {slide.speakerNotes && (
            <div className="border-t pt-2 mt-2">
              <p className="text-xs text-muted-foreground italic">
                Speaker notes: {slide.speakerNotes}
              </p>
            </div>
          )}
          {slide.visualDirection && (
            <div className="border-t pt-2 mt-2">
              <p className="text-xs text-muted-foreground">
                Visual: {slide.visualDirection}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">
            Slide {slide.slideNumber}
          </CardTitle>
          {slide.layout && (
            <Badge
              variant="secondary"
              className={layoutColors[slide.layout] ?? ""}
            >
              {slide.layout}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <Input
          value={slide.title}
          onChange={(e) => onChange({ ...slide, title: e.target.value })}
          placeholder="Slide title"
          className="font-semibold"
        />
        <Textarea
          value={slide.body}
          onChange={(e) => onChange({ ...slide, body: e.target.value })}
          placeholder="Slide content"
          rows={3}
        />
        <Textarea
          value={slide.speakerNotes ?? ""}
          onChange={(e) =>
            onChange({ ...slide, speakerNotes: e.target.value || undefined })
          }
          placeholder="Speaker notes (optional)"
          rows={2}
          className="text-sm"
        />
        <Input
          value={slide.visualDirection ?? ""}
          onChange={(e) =>
            onChange({
              ...slide,
              visualDirection: e.target.value || undefined,
            })
          }
          placeholder="Visual direction (optional)"
          className="text-sm"
        />
      </CardContent>
    </Card>
  );
}

// ── Section Component ─────────────────────────────────────────

function SectionView({
  title,
  slides,
  sectionKey,
  onChange,
  readOnly,
}: {
  title: string;
  slides: Slide[];
  sectionKey: "intro" | "content" | "sales";
  onChange: (sectionKey: "intro" | "content" | "sales", slides: Slide[]) => void;
  readOnly: boolean;
}) {
  const handleSlideChange = (index: number, updated: Slide) => {
    const next = [...slides];
    next[index] = updated;
    onChange(sectionKey, next);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">{title}</h3>
        <Badge variant="outline">{slides.length} slides</Badge>
      </div>
      <div className="grid gap-3">
        {slides.map((slide, i) => (
          <SlideCard
            key={slide.slideNumber}
            slide={slide}
            onChange={(updated) => handleSlideChange(i, updated)}
            readOnly={readOnly}
          />
        ))}
      </div>
    </div>
  );
}

// ── Main Presentation Page ────────────────────────────────────

import { useArtifact } from "@/lib/hooks/use-artifact";

export default function PresentationPage() {
  const [activeSection, setActiveSection] = useState<string>("intro");
  const { artifact, loading, save, regenerate } = useArtifact("presentation");

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Presentation Brief</h1>
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
    const data = content as PresentationContent | null;
    if (!data) return <p className="text-muted-foreground">No content yet.</p>;

    const handleSectionChange = (
      sectionKey: "intro" | "content" | "sales",
      slides: Slide[]
    ) => {
      onChange({ ...data, [sectionKey]: slides });
    };

    const totalSlides =
      data.intro.length + data.content.length + data.sales.length;

    return (
      <div className="space-y-4">
        <div className="flex gap-4 text-sm text-muted-foreground">
          <span>Total: {totalSlides} slides</span>
          <span>Intro: {data.intro.length}</span>
          <span>Content: {data.content.length}</span>
          <span>Sales: {data.sales.length}</span>
        </div>

        <Tabs value={activeSection} onValueChange={setActiveSection}>
          <TabsList>
            <TabsTrigger value="intro">
              Intro ({data.intro.length})
            </TabsTrigger>
            <TabsTrigger value="content">
              Content ({data.content.length})
            </TabsTrigger>
            <TabsTrigger value="sales">
              Sales ({data.sales.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="intro" className="mt-4">
            <SectionView
              title="Intro Section"
              slides={data.intro}
              sectionKey="intro"
              onChange={handleSectionChange}
              readOnly={readOnly}
            />
          </TabsContent>

          <TabsContent value="content" className="mt-4">
            <SectionView
              title="Content Section"
              slides={data.content}
              sectionKey="content"
              onChange={handleSectionChange}
              readOnly={readOnly}
            />
          </TabsContent>

          <TabsContent value="sales" className="mt-4">
            <SectionView
              title="Sales Section"
              slides={data.sales}
              sectionKey="sales"
              onChange={handleSectionChange}
              readOnly={readOnly}
            />
          </TabsContent>
        </Tabs>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Presentation Brief</h1>
        <p className="text-muted-foreground">
          ~90 slides: intro, content, and sales sections
        </p>
      </div>

      <ArtifactEditor
        artifactId={artifact?.id ?? ""}
        artifactType="presentation"
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
