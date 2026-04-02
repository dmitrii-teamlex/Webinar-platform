"use client";

import { useState, useEffect, useCallback, useRef } from "react";
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

/**
 * Hook to load and manage a single artifact by webinar + type.
 * Polls while status is "generating".
 */
export function useArtifact(webinarId: string | undefined, artifactType: ArtifactType) {
  const [artifact, setArtifact] = useState<ArtifactData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchArtifact = useCallback(async () => {
    if (!webinarId) return;
    try {
      const res = await fetch(
        `/api/webinars/${webinarId}/artifacts?type=${artifactType}`
      );
      if (!res.ok) throw new Error("Failed to fetch artifact");
      const data = await res.json();
      const artifacts = data.artifacts ?? [];
      if (artifacts.length > 0) {
        const a = artifacts[0];
        setArtifact({
          id: a.id,
          webinarId: a.webinar_id,
          type: a.type,
          status: a.status,
          content: a.content,
          version: a.version,
          error: a.error,
        });
      } else {
        setArtifact(null);
      }
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Fetch failed");
    } finally {
      setLoading(false);
    }
  }, [webinarId, artifactType]);

  // Initial fetch
  useEffect(() => {
    setLoading(true);
    fetchArtifact();
  }, [fetchArtifact]);

  // Poll while generating
  useEffect(() => {
    if (artifact?.status === "generating") {
      pollRef.current = setInterval(fetchArtifact, 3000);
    } else if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [artifact?.status, fetchArtifact]);

  const generate = useCallback(async () => {
    if (!webinarId) return;
    try {
      setError(null);
      const res = await fetch(`/api/webinars/${webinarId}/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ types: [artifactType] }),
      });
      if (!res.ok) throw new Error("Failed to start generation");
      // Immediately refetch to get the new artifact record
      await fetchArtifact();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Generation failed");
    }
  }, [webinarId, artifactType, fetchArtifact]);

  const save = useCallback(
    async (content: unknown) => {
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
          prev
            ? { ...prev, content, version: (prev.version ?? 1) + 1 }
            : prev
        );
        return data;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Save failed");
      }
    },
    [artifact]
  );

  const regenerate = useCallback(async () => {
    if (!artifact) return;
    try {
      setArtifact((prev) =>
        prev ? { ...prev, status: "generating" } : prev
      );
      const res = await fetch(`/api/artifacts/${artifact.id}/regenerate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (!res.ok) throw new Error("Failed to regenerate");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Regeneration failed");
      setArtifact((prev) =>
        prev ? { ...prev, status: "failed" } : prev
      );
    }
  }, [artifact]);

  return { artifact, loading, error, generate, save, regenerate, refetch: fetchArtifact };
}
