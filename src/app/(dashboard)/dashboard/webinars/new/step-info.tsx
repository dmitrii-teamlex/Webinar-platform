"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { WizardData } from "./page";

type Props = {
  data: WizardData;
  onChange: (partial: Partial<WizardData>) => void;
};

export function StepInfo({ data, onChange }: Props) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title">Webinar Title *</Label>
        <Input
          id="title"
          placeholder="e.g. How to Scale Your SaaS to $10M ARR"
          value={data.title}
          onChange={(e) => onChange({ title: e.target.value })}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="topic">Topic *</Label>
        <Textarea
          id="topic"
          placeholder="Describe the main topic and what will be covered..."
          value={data.topic}
          onChange={(e) => onChange({ topic: e.target.value })}
          rows={3}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="date">Webinar Date *</Label>
          <Input
            id="date"
            type="datetime-local"
            value={data.date}
            onChange={(e) => onChange({ date: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="audience">Target Audience</Label>
          <Input
            id="audience"
            placeholder="e.g. SaaS founders, B2B marketers"
            value={data.targetAudience}
            onChange={(e) => onChange({ targetAudience: e.target.value })}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="speaker">Speaker Name *</Label>
          <Input
            id="speaker"
            placeholder="John Doe"
            value={data.speakerName}
            onChange={(e) => onChange({ speakerName: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="bio">Speaker Bio</Label>
          <Input
            id="bio"
            placeholder="CEO at Acme, 10+ years in SaaS"
            value={data.speakerBio}
            onChange={(e) => onChange({ speakerBio: e.target.value })}
          />
        </div>
      </div>
    </div>
  );
}
