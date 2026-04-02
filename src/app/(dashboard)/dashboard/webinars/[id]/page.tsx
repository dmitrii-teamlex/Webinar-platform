"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
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
  CheckCircle2,
  Lock,
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

type Thesis = {
  id: string;
  title: string;
  approved: boolean;
};

type ArtifactSummary = {
  id: string;
  type: string;
  status: string;
};

const ARTIFACT_CARDS: {
  type: string;
  label: string;
  icon: React.ElementType;
  href: string;
  description: string;
}[] = [
  {
    type: "presentation",
    label: "Presentation",
    icon: Presentation,
    href: "/dashboard/presentation",
    description: "~90 slides: intro, content, sales",
  },
  {
    type: "landing_page",
    label: "Landing Page",
    icon: LayoutTemplate,
    href: "/dashboard/landing",
    description: "Registration page copy",
  },
  {
    type: "thank_you",
    label: "Thank-You Page",
    icon: Heart,
    href: "/dashboard/thank-you",
    description: "Post-registration confirmation",
  },
  {
    type: "attendance_chain",
    label: "Attendance Chain",
    icon: Mail,
    href: "/dashboard/attendance",
    description: "Multi-stage messaging flow",
  },
  {
    type: "gift",
    label: "Gifts",
    icon: Gift,
    href: "/dashboard/gifts",
    description: "Attendance incentives",
  },
];

export default function WebinarDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [webinar, setWebinar] = useState<WebinarDetail | null>(null);
  const [sources, setSources] = useState<Source[]>([]);
  const [theses, setTheses] = useState<Thesis[]>([]);
  const [artifacts, setArtifacts] = useState<ArtifactSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch(`/api/webinars/${id}`).then((r) => r.json()),
      fetch(`/api/webinars/${id}/sources`).then((r) => r.json()),
      fetch(`/api/webinars/${id}/theses`).then((r) => r.json()),
      fetch(`/api/webinars/${id}/artifacts`).then((r) => r.json()),
    ])
      .then(([wData, sData, tData, aData]) => {
        setWebinar(wData.webinar ?? null);
        setSources(sData.sources ?? []);
        setTheses(tData.theses ?? []);
        setArtifacts(aData.artifacts ?? []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

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

  const approvedTheses = theses.filter((t) => t.approved);
  const thesesApproved = approvedTheses.length > 0;
  const artifactsByType = new Map(artifacts.map((a) => [a.type, a]));

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

      {/* Step 1: Theses (mandatory gate) */}
      <Card className={thesesApproved ? "border-green-500/50" : "border-primary"}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`flex size-8 items-center justify-center rounded-full text-sm font-bold ${
                  thesesApproved
                    ? "bg-green-500 text-white"
                    : "bg-primary text-primary-foreground"
                }`}
              >
                1
              </div>
              <div>
                <CardTitle className="flex items-center gap-2">
                  Theses
                  {thesesApproved && (
                    <CheckCircle2 className="size-4 text-green-500" />
                  )}
                </CardTitle>
                <CardDescription>
                  {thesesApproved
                    ? `${approvedTheses.length} theses approved — artifacts unlocked`
                    : "Generate and approve theses to unlock artifact generation"}
                </CardDescription>
              </div>
            </div>
            <Button variant={thesesApproved ? "outline" : "default"} asChild>
              <Link href={`/dashboard/webinars/${id}/theses`}>
                {thesesApproved ? "View Theses" : "Manage Theses"}
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
        </CardHeader>
        {theses.length > 0 && (
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {theses.slice(0, 5).map((t) => (
                <Badge
                  key={t.id}
                  variant={t.approved ? "default" : "outline"}
                >
                  {t.title}
                </Badge>
              ))}
              {theses.length > 5 && (
                <Badge variant="secondary">+{theses.length - 5} more</Badge>
              )}
            </div>
          </CardContent>
        )}
      </Card>

      {/* Step 2: Artifacts (unlocked after theses approval) */}
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <div
            className={`flex size-8 items-center justify-center rounded-full text-sm font-bold ${
              thesesApproved
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground"
            }`}
          >
            2
          </div>
          <div>
            <h2 className="text-lg font-semibold">Artifacts</h2>
            <p className="text-sm text-muted-foreground">
              {thesesApproved
                ? "Generate each artifact individually, then refine with AI chat"
                : "Approve theses first to unlock artifact generation"}
            </p>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {ARTIFACT_CARDS.map((card) => {
            const existing = artifactsByType.get(card.type);
            const Icon = card.icon;
            const isLocked = !thesesApproved;

            return (
              <Card
                key={card.type}
                className={isLocked ? "opacity-60" : ""}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Icon className="size-4 text-muted-foreground" />
                      <CardTitle className="text-sm">{card.label}</CardTitle>
                    </div>
                    {isLocked ? (
                      <Lock className="size-4 text-muted-foreground" />
                    ) : existing ? (
                      <Badge
                        variant={
                          existing.status === "completed"
                            ? "default"
                            : existing.status === "generating"
                              ? "secondary"
                              : "outline"
                        }
                      >
                        {existing.status}
                      </Badge>
                    ) : (
                      <Badge variant="outline">not started</Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground mb-3">
                    {card.description}
                  </p>
                  {isLocked ? (
                    <Button variant="outline" size="sm" disabled className="w-full">
                      <Lock className="size-3" />
                      Locked
                    </Button>
                  ) : (
                    <Button variant="outline" size="sm" asChild className="w-full">
                      <Link href={`${card.href}?webinarId=${id}`}>
                        {existing?.status === "completed"
                          ? "View & Edit"
                          : existing
                            ? "View"
                            : "Generate"}
                        <ArrowRight className="size-3" />
                      </Link>
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

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
                    variant={
                      source.status === "completed" ? "default" : "outline"
                    }
                  >
                    {source.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
