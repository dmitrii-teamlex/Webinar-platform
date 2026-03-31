"use client";

import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Globe, FileText, Calendar, User, Users } from "lucide-react";
import type { WizardData } from "./page";

type Props = {
  data: WizardData;
};

export function StepReview({ data }: Props) {
  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Review the details before creating your webinar.
      </p>

      {/* Webinar info */}
      <div className="space-y-3">
        <h3 className="font-semibold">Webinar Details</h3>
        <div className="grid gap-3 text-sm">
          <div>
            <span className="text-muted-foreground">Title:</span>{" "}
            <span className="font-medium">{data.title}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Topic:</span>{" "}
            <span>{data.topic}</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <Calendar className="size-3.5" />
              {data.date
                ? new Date(data.date).toLocaleString()
                : "Not set"}
            </span>
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <User className="size-3.5" />
              {data.speakerName}
            </span>
            {data.targetAudience && (
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <Users className="size-3.5" />
                {data.targetAudience}
              </span>
            )}
          </div>
          {data.speakerBio && (
            <div>
              <span className="text-muted-foreground">Speaker Bio:</span>{" "}
              <span>{data.speakerBio}</span>
            </div>
          )}
        </div>
      </div>

      <Separator />

      {/* Sources */}
      <div className="space-y-3">
        <h3 className="font-semibold">
          Sources ({data.sources.length})
        </h3>
        {data.sources.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No sources added. You can add them after creation.
          </p>
        ) : (
          <div className="space-y-1.5">
            {data.sources.map((source) => (
              <div
                key={source.id}
                className="flex items-center gap-2 text-sm"
              >
                {source.type === "url" ? (
                  <Globe className="size-3.5 text-muted-foreground" />
                ) : (
                  <FileText className="size-3.5 text-muted-foreground" />
                )}
                <span className="truncate">
                  {source.type === "url" ? source.url : source.fileName}
                </span>
                <Badge variant="secondary" className="text-xs">
                  {source.type.toUpperCase()}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
