/**
 * AI Gateway — unified wrapper over Anthropic/OpenAI providers.
 * Both developer streams call this instead of provider SDKs directly.
 */

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
 * Generate text using the configured AI provider.
 * Defaults to Anthropic Claude Sonnet.
 */
export async function aiGenerate(
  options: AIGenerateOptions
): Promise<AIGenerateResult> {
  const {
    provider = "anthropic",
    model = "claude-sonnet-4-20250514",
    messages,
    maxTokens = 4096,
    temperature = 0.7,
  } = options;

  if (provider === "anthropic") {
    return generateWithAnthropic({ model, messages, maxTokens, temperature });
  }

  return generateWithOpenAI({ model, messages, maxTokens, temperature });
}

// ── Provider implementations (stubs — replace with SDK calls) ──

async function generateWithAnthropic(params: {
  model: string;
  messages: AIMessage[];
  maxTokens: number;
  temperature: number;
}): Promise<AIGenerateResult> {
  // TODO: Replace with actual Anthropic SDK call
  // import Anthropic from '@anthropic-ai/sdk';
  // const client = new Anthropic();
  // const response = await client.messages.create({ ... });

  console.log(`[AI Gateway] Anthropic ${params.model} — ${params.messages.length} messages`);

  return {
    content: "[stub] AI response placeholder",
    model: params.model,
    usage: { inputTokens: 0, outputTokens: 0 },
  };
}

async function generateWithOpenAI(params: {
  model: string;
  messages: AIMessage[];
  maxTokens: number;
  temperature: number;
}): Promise<AIGenerateResult> {
  // TODO: Replace with actual OpenAI SDK call
  // import OpenAI from 'openai';
  // const client = new OpenAI();
  // const response = await client.chat.completions.create({ ... });

  console.log(`[AI Gateway] OpenAI ${params.model} — ${params.messages.length} messages`);

  return {
    content: "[stub] AI response placeholder",
    model: params.model,
    usage: { inputTokens: 0, outputTokens: 0 },
  };
}
