"use client";

import { useState, useEffect, useCallback } from "react";
import type { ArtifactType, ArtifactStatus } from "@/types/artifact";

export type ArtifactData = {
  id: string;
  webinarId: string;
  type: ArtifactType;
  status: ArtifactStatus;
  content: unknown;
  version: number;
  error?: string;
};

export function useArtifact(artifactType: ArtifactType) {
  const [artifact, setArtifact] = useState<ArtifactData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // TODO: Replace with real artifact lookup by type + active webinar
  // For now, returns null (no artifact yet)
  useEffect(() => {
    setLoading(false);
  }, [artifactType]);

  const save = useCallback(async (content: unknown) => {
    if (!artifact) return;
    try {
      const res = await fetch(`/api/artifacts/${artifact.id}/edit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, changeDescription: "Manual edit" }),
      });
      if (!res.ok) throw new Error("Failed to save");
      const data = await res.json();
      setArtifact((prev) =>
        prev ? { ...prev, content, version: (prev.version ?? 1) + 1 } : prev
      );
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    }
  }, [artifact]);

  const regenerate = useCallback(async () => {
    if (!artifact) return;
    try {
      setArtifact((prev) => prev ? { ...prev, status: "generating" } : prev);
      const res = await fetch(`/api/artifacts/${artifact.id}/regenerate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (!res.ok) throw new Error("Failed to regenerate");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Regeneration failed");
      setArtifact((prev) => prev ? { ...prev, status: "failed" } : prev);
    }
  }, [artifact]);

  return { artifact, loading, error, save, regenerate };
}
