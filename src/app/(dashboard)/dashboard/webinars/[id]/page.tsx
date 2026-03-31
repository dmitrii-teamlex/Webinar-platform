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
} from "lucide-react";

type WebinarDetail = {
  id: string;
  title: string;
  topic: string;
  date: string;
  targetAudience: string;
  speakerName: string;
  speakerBio?: string;
  status: string;
};

type Source = {
  id: string;
  type: string;
  url?: string;
  fileName?: string;
  status: string;
};

export default function WebinarDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [webinar, setWebinar] = useState<WebinarDetail | null>(null);
  const [sources, setSources] = useState<Source[]>([]);
  const [loading, setLoading] = useState(true);

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
          {webinar.speakerName}
        </span>
        {webinar.targetAudience && (
          <span className="flex items-center gap-1.5">
            <Users className="size-4" />
            {webinar.targetAudience}
          </span>
        )}
      </div>

      <Separator />

      {/* Sources */}
      <Card>
        <CardHeader>
          <CardTitle>Sources</CardTitle>
          <CardDescription>
            Materials used for content generation
          </CardDescription>
        </CardHeader>
        <CardContent>
          {sources.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No sources added yet.
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

      {/* Next step: theses */}
      <Card>
        <CardHeader>
          <CardTitle>Next Step</CardTitle>
        </CardHeader>
        <CardContent>
          <Button asChild>
            <Link href={`/dashboard/webinars/${id}/theses`}>
              Go to Theses
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
