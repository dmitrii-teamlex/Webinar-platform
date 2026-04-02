/**
 * AI Gateway — unified wrapper over Anthropic/OpenAI providers.
 * Both developer streams call this instead of provider SDKs directly.
 */

import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";

export type AIProvider = "anthropic" | "openai";

export type AIModel =
  | "claude-sonnet-4-20250514"
  | "claude-haiku-4-5-20251001"
  | "gpt-4o"
  | "gpt-4o-mini";

export type AIMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type AIGenerateOptions = {
  provider?: AIProvider;
  model?: AIModel;
  messages: AIMessage[];
  maxTokens?: number;
  temperature?: number;
  responseFormat?: "text" | "json";
};

export type AIGenerateResult = {
  content: string;
  model: string;
  usage: {
    inputTokens: number;
    outputTokens: number;
  };
};

/**
 * Detect provider from model name if not explicitly set.
 */
function detectProvider(model: string): AIProvider {
  if (model.startsWith("claude")) return "anthropic";
  return "openai";
}

function env(name: string): string {
  // CLAUDE_API_KEY is used as a fallback because Turbopack inlines
  // process.env.ANTHROPIC_API_KEY as "" due to @anthropic-ai/sdk referencing it
  if (name === "ANTHROPIC_API_KEY") {
    return process.env.CLAUDE_API_KEY || process.env.ANTHROPIC_API_KEY || "";
  }
  return process.env[name] ?? "";
}

function getAvailableProvider(): { provider: AIProvider; model: string } {
  if (env("ANTHROPIC_API_KEY")) return { provider: "anthropic", model: "claude-sonnet-4-20250514" };
  if (env("OPENAI_API_KEY")) return { provider: "openai", model: "gpt-4o" };

  throw new Error(
    "No AI provider configured. Set either ANTHROPIC_API_KEY or OPENAI_API_KEY in your environment variables."
  );
}

/**
 * Generate text using the configured AI provider.
 * Auto-detects provider from API keys if not specified.
 * Anthropic (Claude) is preferred when both keys are present.
 */
export async function aiGenerate(
  options: AIGenerateOptions
): Promise<AIGenerateResult> {
  const available = getAvailableProvider();

  const {
    model = available.model,
    messages,
    maxTokens = 4096,
    temperature = 0.7,
    responseFormat,
  } = options;

  const provider = options.provider ?? detectProvider(model);

  if (provider === "anthropic") {
    const apiKey = env("ANTHROPIC_API_KEY");
    if (!apiKey) {
      throw new Error("ANTHROPIC_API_KEY is required for Claude models. Set it in Settings → API Keys.");
    }
    return generateWithAnthropic({ model, messages, maxTokens, temperature, responseFormat, apiKey });
  }

  const apiKey = env("OPENAI_API_KEY");
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is required for OpenAI models. Set it in Settings → API Keys.");
  }
  return generateWithOpenAI({ model, messages, maxTokens, temperature, responseFormat, apiKey });
}

// ── Anthropic implementation ──

async function generateWithAnthropic(params: {
  model: string;
  messages: AIMessage[];
  maxTokens: number;
  temperature: number;
  responseFormat?: "text" | "json";
  apiKey: string;
}): Promise<AIGenerateResult> {
  const client = new Anthropic({ apiKey: params.apiKey });

  const systemMessage = params.messages.find((m) => m.role === "system");
  const nonSystemMessages = params.messages
    .filter((m) => m.role !== "system")
    .map((m) => ({ role: m.role as "user" | "assistant", content: m.content }));

  const response = await client.messages.create(
    {
      model: params.model,
      max_tokens: params.maxTokens,
      temperature: params.temperature,
      system: systemMessage?.content,
      messages: nonSystemMessages,
    },
    { timeout: 120_000 }
  );

  const textBlock = response.content.find((b) => b.type === "text");
  const content = textBlock?.type === "text" ? textBlock.text : "";

  return {
    content,
    model: response.model,
    usage: {
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
    },
  };
}

// ── OpenAI implementation ──

async function generateWithOpenAI(params: {
  model: string;
  messages: AIMessage[];
  maxTokens: number;
  temperature: number;
  responseFormat?: "text" | "json";
  apiKey: string;
}): Promise<AIGenerateResult> {
  const client = new OpenAI({ apiKey: params.apiKey });

  const response = await client.chat.completions.create({
    model: params.model,
    messages: params.messages.map((m) => ({
      role: m.role,
      content: m.content,
    })),
    max_tokens: params.maxTokens,
    temperature: params.temperature,
    ...(params.responseFormat === "json" && {
      response_format: { type: "json_object" },
    }),
  });

  const choice = response.choices[0];

  return {
    content: choice?.message?.content ?? "",
    model: response.model,
    usage: {
      inputTokens: response.usage?.prompt_tokens ?? 0,
      outputTokens: response.usage?.completion_tokens ?? 0,
    },
  };
}
