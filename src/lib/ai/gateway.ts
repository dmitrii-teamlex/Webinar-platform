/**
 * AI Gateway — unified wrapper over Anthropic/OpenAI providers.
 * Both developer streams call this instead of provider SDKs directly.
 */

import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import { createLogger } from "@/lib/logger";

const log = createLogger("ai");

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
  if (model.startsWith("claude") || model.startsWith("claude-")) return "anthropic";
  return "openai";
}

/**
 * Generate text using the configured AI provider.
 * Defaults to Anthropic Claude Sonnet.
 */
export async function aiGenerate(
  options: AIGenerateOptions
): Promise<AIGenerateResult> {
  const {
    model = "claude-sonnet-4-20250514",
    messages,
    maxTokens = 4096,
    temperature = 0.7,
    responseFormat,
  } = options;

  const provider = options.provider ?? detectProvider(model);

  log.info(`Generating with ${provider}/${model}`, {
    provider,
    model,
    messagesCount: messages.length,
    maxTokens,
    temperature,
  });

  const start = Date.now();

  try {
    const result = provider === "anthropic"
      ? await generateWithAnthropic({ model, messages, maxTokens, temperature, responseFormat })
      : await generateWithOpenAI({ model, messages, maxTokens, temperature, responseFormat });

    log.info(`Generation completed`, {
      provider,
      model,
      durationMs: Date.now() - start,
      inputTokens: result.usage.inputTokens,
      outputTokens: result.usage.outputTokens,
    });

    return result;
  } catch (error) {
    log.error(`Generation failed`, {
      provider,
      model,
      durationMs: Date.now() - start,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

// ── Lazy SDK clients ──

let _anthropic: Anthropic | null = null;
function getAnthropic() {
  if (!_anthropic) _anthropic = new Anthropic();
  return _anthropic;
}

let _openai: OpenAI | null = null;
function getOpenAI() {
  if (!_openai) _openai = new OpenAI();
  return _openai;
}

// ── Anthropic implementation ──

async function generateWithAnthropic(params: {
  model: string;
  messages: AIMessage[];
  maxTokens: number;
  temperature: number;
  responseFormat?: "text" | "json";
}): Promise<AIGenerateResult> {
  const systemMessage = params.messages.find((m) => m.role === "system");
  const nonSystemMessages = params.messages
    .filter((m) => m.role !== "system")
    .map((m) => ({ role: m.role as "user" | "assistant", content: m.content }));

  const response = await getAnthropic().messages.create({
    model: params.model,
    max_tokens: params.maxTokens,
    temperature: params.temperature,
    system: systemMessage?.content,
    messages: nonSystemMessages,
  });

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
}): Promise<AIGenerateResult> {
  const response = await getOpenAI().chat.completions.create({
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
