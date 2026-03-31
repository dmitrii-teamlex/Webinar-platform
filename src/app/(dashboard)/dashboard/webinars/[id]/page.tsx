"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Calendar,
  User,
  Users,
  Globe,
  FileText,
  ArrowRight,
  Loader2,
  Sparkles,
  CheckCircle2,
  Presentation,
  LayoutTemplate,
  Heart,
  Mail,
  Gift,
} from "lucide-react";

type WebinarDetail = {
  id: string;
  title: string;
  topic: string;
  date: string;
  target_audience: string;
  speaker_name: string;
  speaker_bio?: string;
  status: string;
};

type Source = {
  id: string;
  type: string;
  url?: string;
  fileName?: string;
  status: string;
};

type GeneratedArtifact = {
  id: string;
  type: string;
  status: string;
};

const ARTIFACT_INFO: Record<string, { label: string; icon: React.ElementType; href: string }> = {
  presentation: { label: "Presentation", icon: Presentation, href: "/dashboard/presentation" },
  landing_page: { label: "Landing Page", icon: LayoutTemplate, href: "/dashboard/landing" },
  thank_you: { label: "Thank-You Page", icon: Heart, href: "/dashboard/thank-you" },
  attendance_chain: { label: "Attendance Chain", icon: Mail, href: "/dashboard/attendance-chain" },
  gift: { label: "Gifts", icon: Gift, href: "/dashboard/gifts" },
};

export default function WebinarDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [webinar, setWebinar] = useState<WebinarDetail | null>(null);
  const [sources, setSources] = useState<Source[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [generatedArtifacts, setGeneratedArtifacts] = useState<GeneratedArtifact[]>([]);

  useEffect(() => {
    Promise.all([
      fetch(`/api/webinars/${id}`).then((r) => r.json()),
      fetch(`/api/webinars/${id}/sources`).then((r) => r.json()),
    ])
      .then(([wData, sData]) => {
        setWebinar(wData.webinar ?? null);
        setSources(sData.sources ?? []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const res = await fetch(`/api/webinars/${id}/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      if (res.ok) {
        setGeneratedArtifacts(data.artifacts ?? []);
        if (webinar) {
          setWebinar({ ...webinar, status: "generating" });
        }
      } else {
        console.error("Generation failed:", data.error);
      }
    } catch (e) {
      console.error("Generation error:", e);
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!webinar) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">Webinar not found</p>
      </div>
    );
  }

  const isGenerating = webinar.status === "generating" || generating;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold">{webinar.title}</h1>
          <p className="text-muted-foreground mt-1">{webinar.topic}</p>
        </div>
        <Badge variant="secondary" className="text-sm">
          {webinar.status.replace("_", " ")}
        </Badge>
      </div>

      {/* Meta */}
      <div className="flex items-center gap-6 text-sm text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <Calendar className="size-4" />
          {new Date(webinar.date).toLocaleString()}
        </span>
        <span className="flex items-center gap-1.5">
          <User className="size-4" />
          {webinar.speaker_name}
        </span>
        {webinar.target_audience && (
          <span className="flex items-center gap-1.5">
            <Users className="size-4" />
            {webinar.target_audience}
          </span>
        )}
      </div>

      <Separator />

      {/* Generate All Artifacts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="size-5" />
            Generate Artifacts
          </CardTitle>
          <CardDescription>
            Generate all marketing materials based on webinar info and configured prompts.
            Sources are optional — the AI will use the webinar details to create content.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            size="lg"
            onClick={handleGenerate}
            disabled={isGenerating}
            className="w-full"
          >
            {isGenerating ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="size-4" />
                Generate All Artifacts
              </>
            )}
          </Button>

          {generatedArtifacts.length > 0 && (
            <div className="space-y-2">
              {generatedArtifacts.map((artifact) => {
                const info = ARTIFACT_INFO[artifact.type];
                if (!info) return null;
                const Icon = info.icon;
                return (
                  <div
                    key={artifact.id}
                    className="flex items-center justify-between rounded-md border px-3 py-2"
                  >
                    <div className="flex items-center gap-2 text-sm">
                      <Icon className="size-4 text-muted-foreground" />
                      <span>{info.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={artifact.status === "completed" ? "default" : "outline"}>
                        {artifact.status}
                      </Badge>
                      {artifact.status === "completed" && (
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={info.href}>
                            View <ArrowRight className="size-3" />
                          </Link>
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sources (optional) */}
      <Card>
        <CardHeader>
          <CardTitle>Sources</CardTitle>
          <CardDescription>
            Optional — add materials for richer, more grounded content
          </CardDescription>
        </CardHeader>
        <CardContent>
          {sources.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No sources added. Generation will use webinar info and default prompts.
            </p>
          ) : (
            <div className="space-y-2">
              {sources.map((source) => (
                <div
                  key={source.id}
                  className="flex items-center justify-between rounded-md border px-3 py-2"
                >
                  <div className="flex items-center gap-2 text-sm">
                    {source.type === "url" ? (
                      <Globe className="size-4 text-muted-foreground" />
                    ) : (
                      <FileText className="size-4 text-muted-foreground" />
                    )}
                    <span className="truncate">
                      {source.type === "url" ? source.url : source.fileName}
                    </span>
                    <Badge variant="secondary">
                      {source.type.toUpperCase()}
                    </Badge>
                  </div>
                  <Badge
                    variant={source.status === "completed" ? "default" : "outline"}
                  >
                    {source.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Theses */}
      <Card>
        <CardHeader>
          <CardTitle>Theses</CardTitle>
          <CardDescription>
            Optional — define key points before generating
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" asChild>
            <Link href={`/dashboard/webinars/${id}/theses`}>
              Manage Theses
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
