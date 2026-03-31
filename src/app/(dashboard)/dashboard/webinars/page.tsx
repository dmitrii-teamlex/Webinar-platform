"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Calendar, User } from "lucide-react";
import type { Webinar } from "@/types/webinar";

const STATUS_COLORS: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  draft: "secondary",
  sources_added: "secondary",
  ingesting: "outline",
  theses_ready: "outline",
  approved: "default",
  generating: "outline",
  completed: "default",
};

export default function WebinarsPage() {
  const [webinars, setWebinars] = useState<Webinar[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/webinars")
      .then((res) => res.json())
      .then((data) => setWebinars(data.webinars))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Webinars</h1>
          <p className="text-muted-foreground">All your webinar projects</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/webinars/new">
            <Plus className="size-4" />
            New Webinar
          </Link>
        </Button>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading...</p>
      ) : webinars.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-4">
              No webinars yet. Create your first one.
            </p>
            <Button asChild>
              <Link href="/dashboard/webinars/new">
                <Plus className="size-4" />
                Create Webinar
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {webinars.map((w) => (
            <Link key={w.id} href={`/dashboard/webinars/${w.id}`}>
              <Card className="hover:border-primary/50 transition-colors cursor-pointer">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{w.title}</CardTitle>
                    <Badge variant={STATUS_COLORS[w.status] ?? "secondary"}>
                      {w.status.replace("_", " ")}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-1">
                    {w.topic}
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="size-3.5" />
                      {new Date(w.date).toLocaleDateString()}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <User className="size-3.5" />
                      {w.speakerName}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
