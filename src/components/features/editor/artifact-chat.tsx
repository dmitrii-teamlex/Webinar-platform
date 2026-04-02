"use client";

import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Send, Loader2, MessageSquare } from "lucide-react";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

type ArtifactChatProps = {
  artifactId: string;
  onRefined?: () => void;
};

export function ArtifactChat({ artifactId, onRefined }: ArtifactChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMessage: ChatMessage = { role: "user", content: text };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch(`/api/artifacts/${artifactId}/refine`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          history: messages,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Refinement failed");
      }

      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `Content updated (v${data.artifact.version}). ${
            data.usage
              ? `Used ${data.usage.inputTokens + data.usage.outputTokens} tokens.`
              : ""
          }`,
        },
      ]);
      onRefined?.();
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `Error: ${err instanceof Error ? err.message : "Unknown error"}`,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) {
    return (
      <Button
        variant="outline"
        onClick={() => setIsOpen(true)}
        className="w-full"
      >
        <MessageSquare className="size-4" />
        Refine with AI Chat
      </Button>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <MessageSquare className="size-4" />
            AI Refinement Chat
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsOpen(false)}
          >
            Close
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {messages.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Describe what you&apos;d like to change. The AI will update the artifact content directly.
          </p>
        )}

        {messages.length > 0 && (
          <div className="max-h-60 overflow-y-auto space-y-2 rounded-md border p-3">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`text-sm rounded-lg px-3 py-2 ${
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground ml-8"
                    : "bg-muted mr-8"
                }`}
              >
                {msg.content}
              </div>
            ))}
            <div ref={bottomRef} />
          </div>
        )}

        <div className="flex gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="e.g. Make the headline more attention-grabbing..."
            rows={2}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
          />
          <Button
            size="icon"
            onClick={handleSend}
            disabled={!input.trim() || loading}
            className="shrink-0 self-end"
          >
            {loading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Send className="size-4" />
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
