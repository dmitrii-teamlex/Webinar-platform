/**
 * URL Parser — extracts content from URLs using Perplexity API.
 * Falls back to basic fetch + HTML text extraction if Perplexity is unavailable.
 */

import { createLogger } from "@/lib/logger";

const log = createLogger("ingestion.url");

export type ParsedUrl = {
  url: string;
  title: string;
  text: string;
  summary: string;
};

/**
 * Parse a URL and extract meaningful text content.
 * Uses Perplexity API for intelligent extraction when available.
 */
export async function parseUrl(url: string): Promise<ParsedUrl> {
  const apiKey = process.env.PERPLEXITY_API_KEY;
  const method = apiKey ? "perplexity" : "fetch";

  log.info(`Parsing URL`, { url, method });
  const start = Date.now();

  try {
    const result = apiKey
      ? await parseWithPerplexity(url, apiKey)
      : await parseWithFetch(url);

    log.info(`URL parsed`, {
      url,
      method,
      durationMs: Date.now() - start,
      textLength: result.text.length,
      title: result.title,
    });

    return result;
  } catch (error) {
    log.error(`URL parse failed`, {
      url,
      method,
      durationMs: Date.now() - start,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

async function parseWithPerplexity(
  url: string,
  apiKey: string
): Promise<ParsedUrl> {
  const response = await fetch("https://api.perplexity.ai/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "sonar",
      messages: [
        {
          role: "user",
          content: `Extract and summarize the key content from this URL. Return the main text content, focusing on factual information, key points, and any data that would be useful for creating webinar content.\n\nURL: ${url}`,
        },
      ],
    }),
  });

  if (!response.ok) {
    console.warn(`Perplexity API error (${response.status}), falling back to fetch`);
    return parseWithFetch(url);
  }

  const data = await response.json();
  const text = data.choices?.[0]?.message?.content ?? "";

  return {
    url,
    title: url,
    text,
    summary: text.slice(0, 500),
  };
}

async function parseWithFetch(url: string): Promise<ParsedUrl> {
  const response = await fetch(url, {
    headers: {
      "User-Agent": "WebinarPlatform/1.0",
    },
    signal: AbortSignal.timeout(15000),
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch URL: ${response.status} ${response.statusText}`);
  }

  const html = await response.text();
  const text = stripHtml(html);
  const title = extractTitle(html) ?? url;

  return {
    url,
    title,
    text,
    summary: text.slice(0, 500),
  };
}

function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<nav[\s\S]*?<\/nav>/gi, "")
    .replace(/<footer[\s\S]*?<\/footer>/gi, "")
    .replace(/<header[\s\S]*?<\/header>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

function extractTitle(html: string): string | null {
  const match = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return match ? match[1].trim() : null;
}
