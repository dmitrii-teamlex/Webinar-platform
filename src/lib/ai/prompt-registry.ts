/**
 * Prompt Registry — manages system/user prompt templates for each artifact type.
 * Both developer streams use this to fetch prompts for their generators.
 *
 * In production, prompts are stored in the `prompts` DB table.
 * This module provides the interface + in-memory defaults for development.
 */

import type { ArtifactType } from "@/types/artifact";

export type PromptTemplate = {
  id: string;
  artifactType: ArtifactType;
  name: string;
  systemPrompt: string;
  userPromptTemplate: string;
  isDefault: boolean;
};

// ── In-memory defaults (seed data) ──────────────────────────

const DEFAULT_PROMPTS: PromptTemplate[] = [
  // Theses — generated first, all other artifacts depend on them
  {
    id: "default-theses",
    artifactType: "theses",
    name: "Default Theses Generator",
    systemPrompt:
      "You are an expert webinar content strategist. Generate a list of key theses (main points) that attendees will learn during the webinar. Each thesis should be a clear, specific takeaway. Return valid JSON: an array of objects with 'title' (short thesis statement) and 'description' (1-2 sentence explanation of what the attendee will learn).",
    userPromptTemplate:
      "Generate 7-10 key theses for a webinar titled '{{title}}' on the topic '{{topic}}'. Target audience: {{targetAudience}}. Speaker: {{speakerName}}.\n\nTheses should represent the main points and takeaways that attendees will gain from this webinar. Each thesis should be concrete and actionable.",
    isDefault: true,
  },
  // Dev 1 artifacts
  {
    id: "default-presentation",
    artifactType: "presentation",
    name: "Default Presentation Generator",
    systemPrompt:
      "You are an expert presentation designer. Generate a structured webinar presentation brief with approximately 90 slides divided into three sections: intro (~10 slides), content (~50 slides), and sales (~30 slides).",
    userPromptTemplate:
      "Create a presentation brief for a webinar titled '{{title}}' on the topic '{{topic}}'. Target audience: {{targetAudience}}. Speaker: {{speakerName}}.\n\nApproved theses:\n{{theses}}\n\nContext:\n{{context}}",
    isDefault: true,
  },
  {
    id: "default-landing-page",
    artifactType: "landing_page",
    name: "Default Landing Page Generator",
    systemPrompt:
      "You are a conversion-focused copywriter. Generate a landing page brief for a webinar registration page with headline, subheadline, bullet points, social proof, CTA, and speaker bio.",
    userPromptTemplate:
      "Create a landing page brief for webinar '{{title}}'. Topic: {{topic}}. Speaker: {{speakerName}} ({{speakerBio}}). Target audience: {{targetAudience}}.\n\nKey theses:\n{{theses}}\n\nContext:\n{{context}}",
    isDefault: true,
  },
  {
    id: "default-thank-you",
    artifactType: "thank_you",
    name: "Default Thank-You Page Generator",
    systemPrompt:
      "You are a UX copywriter. Generate a thank-you page for webinar registration confirmation with next steps and gift delivery messaging.",
    userPromptTemplate:
      "Create a thank-you page for webinar '{{title}}' happening on {{date}}. Speaker: {{speakerName}}.\n\nTheses:\n{{theses}}",
    isDefault: true,
  },
  // Dev 2 artifacts
  {
    id: "default-attendance-chain",
    artifactType: "attendance_chain",
    name: "Default Attendance Chain Generator",
    systemPrompt:
      "You are an email marketing expert. Generate a complete attendance chain with messages for each stage: registration confirmation, warmup, day-of, during webinar, and post-webinar. Include both email and messenger channels.",
    userPromptTemplate:
      "Create an attendance chain for webinar '{{title}}' on {{date}}. Topic: {{topic}}. Speaker: {{speakerName}}. Audience: {{targetAudience}}.\n\nTheses:\n{{theses}}\n\nContext:\n{{context}}",
    isDefault: true,
  },
  {
    id: "default-gift",
    artifactType: "gift",
    name: "Default Gift Generator",
    systemPrompt:
      "You are a creative marketer. Generate gift ideas for webinar attendees, including concept description, full copywriting text, and visual brief for designers.",
    userPromptTemplate:
      "Create gift ideas for webinar '{{title}}'. Topic: {{topic}}. Target audience: {{targetAudience}}.\n\nTheses:\n{{theses}}\n\nContext:\n{{context}}",
    isDefault: true,
  },
];

// ── Registry API (in-memory for now, DB-backed in production) ──

let prompts: PromptTemplate[] = [...DEFAULT_PROMPTS];

export function getPromptsByType(artifactType: ArtifactType): PromptTemplate[] {
  return prompts.filter((p) => p.artifactType === artifactType);
}

export function getDefaultPrompt(
  artifactType: ArtifactType
): PromptTemplate | undefined {
  return prompts.find(
    (p) => p.artifactType === artifactType && p.isDefault
  );
}

export function getPromptById(id: string): PromptTemplate | undefined {
  return prompts.find((p) => p.id === id);
}

export function upsertPrompt(prompt: PromptTemplate): void {
  const index = prompts.findIndex((p) => p.id === prompt.id);
  if (index >= 0) {
    prompts[index] = prompt;
  } else {
    prompts.push(prompt);
  }
}

export function deletePrompt(id: string): boolean {
  const before = prompts.length;
  prompts = prompts.filter((p) => p.id !== id);
  return prompts.length < before;
}

export function getAllPrompts(): PromptTemplate[] {
  return [...prompts];
}

/**
 * Interpolate variables into a user prompt template.
 * Variables are in {{variableName}} format.
 */
export function interpolatePrompt(
  template: string,
  variables: Record<string, string>
): string {
  return Object.entries(variables).reduce(
    (result, [key, value]) =>
      result.replace(new RegExp(`\\{\\{${key}\\}\\}`, "g"), value),
    template
  );
}
