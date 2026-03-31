"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { StepInfo } from "./step-info";
import { StepSources } from "./step-sources";
import { StepReview } from "./step-review";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { SourceEntry } from "./types";

export type WizardData = {
  title: string;
  topic: string;
  date: string;
  targetAudience: string;
  speakerName: string;
  speakerBio: string;
  sources: SourceEntry[];
};

const STEPS = ["Webinar Info", "Sources", "Review"] as const;

const INITIAL_DATA: WizardData = {
  title: "",
  topic: "",
  date: "",
  targetAudience: "",
  speakerName: "",
  speakerBio: "",
  sources: [],
};

export default function NewWebinarPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [data, setData] = useState<WizardData>(INITIAL_DATA);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateData = (partial: Partial<WizardData>) => {
    setData((prev) => ({ ...prev, ...partial }));
  };

  const canProceedFromInfo =
    data.title.trim() !== "" &&
    data.topic.trim() !== "" &&
    data.date !== "" &&
    data.speakerName.trim() !== "";

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      // 1. Create webinar
      const res = await fetch("/api/webinars", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: data.title,
          topic: data.topic,
          date: data.date,
          targetAudience: data.targetAudience,
          speakerName: data.speakerName,
          speakerBio: data.speakerBio,
        }),
      });

      if (!res.ok) throw new Error("Failed to create webinar");

      const { webinar } = await res.json();

      // 2. Add sources (if any)
      for (const source of data.sources) {
        const formData = new FormData();
        formData.append("type", source.type);
        if (source.type === "url") {
          formData.append("url", source.url!);
        } else if (source.file) {
          formData.append("file", source.file);
        }

        await fetch(`/api/webinars/${webinar.id}/sources`, {
          method: "POST",
          body: formData,
        });
      }

      router.push(`/dashboard/webinars/${webinar.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">New Webinar</h1>
        <p className="text-muted-foreground">
          Set up your webinar and add source materials
        </p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2">
        {STEPS.map((label, i) => (
          <div key={label} className="flex items-center gap-2">
            <button
              onClick={() => i < step && setStep(i)}
              disabled={i > step}
              className={cn(
                "flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
                i === step
                  ? "bg-primary text-primary-foreground"
                  : i < step
                    ? "bg-secondary text-secondary-foreground cursor-pointer hover:bg-secondary/80"
                    : "bg-muted text-muted-foreground cursor-not-allowed"
              )}
            >
              <span className="flex size-5 items-center justify-center rounded-full bg-background/20 text-xs">
                {i + 1}
              </span>
              {label}
            </button>
            {i < STEPS.length - 1 && (
              <div className="h-px w-8 bg-border" />
            )}
          </div>
        ))}
      </div>

      {/* Step content */}
      <Card>
        <CardContent className="pt-6">
          {step === 0 && <StepInfo data={data} onChange={updateData} />}
          {step === 1 && <StepSources data={data} onChange={updateData} />}
          {step === 2 && <StepReview data={data} />}
        </CardContent>
      </Card>

      {/* Error */}
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      {/* Navigation */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={() => (step === 0 ? router.back() : setStep(step - 1))}
        >
          {step === 0 ? "Cancel" : "Back"}
        </Button>
        <div className="flex gap-2">
          {step < 2 ? (
            <Button
              onClick={() => setStep(step + 1)}
              disabled={step === 0 && !canProceedFromInfo}
            >
              Next
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create Webinar"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
