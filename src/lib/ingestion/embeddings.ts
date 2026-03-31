/**
 * Embeddings — generate vector embeddings and store in pgvector.
 * Uses OpenAI text-embedding-3-small (1536 dimensions).
 */

import { chunkText, type Chunk, type ChunkOptions } from "./chunking";
import { createLogger } from "@/lib/logger";

const log = createLogger("ingestion.embeddings");

export type EmbeddingResult = {
  chunkIndex: number;
  chunkText: string;
  embedding: number[];
};

/**
 * Generate embeddings for a text by chunking it first.
 */
export async function generateEmbeddings(
  text: string,
  chunkOptions?: ChunkOptions
): Promise<EmbeddingResult[]> {
  const chunks = chunkText(text, chunkOptions);

  if (chunks.length === 0) {
    log.debug(`No chunks to embed`, { textLength: text.length });
    return [];
  }

  log.info(`Generating embeddings`, { chunksCount: chunks.length, textLength: text.length });
  const start = Date.now();

  const embeddings = await embedBatch(chunks.map((c) => c.text));

  log.info(`Embeddings generated`, { chunksCount: chunks.length, durationMs: Date.now() - start });

  return chunks.map((chunk, i) => ({
    chunkIndex: chunk.index,
    chunkText: chunk.text,
    embedding: embeddings[i],
  }));
}

/**
 * Embed a batch of texts using OpenAI embeddings API.
 */
async function embedBatch(texts: string[]): Promise<number[][]> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    console.warn("[Embeddings] No OPENAI_API_KEY — returning zero vectors");
    return texts.map(() => new Array(1536).fill(0));
  }

  const response = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "text-embedding-3-small",
      input: texts,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`OpenAI Embeddings API error: ${response.status} ${err}`);
  }

  const data = await response.json();

  return (data.data as { embedding: number[] }[])
    .sort((a: any, b: any) => a.index - b.index)
    .map((d: { embedding: number[] }) => d.embedding);
}

/**
 * Store embeddings in the database.
 * Stub — will use Drizzle + pgvector when DB is connected.
 */
export async function storeEmbeddings(
  webinarId: string,
  sourceId: string,
  results: EmbeddingResult[]
): Promise<void> {
  // TODO: Insert into embeddings table
  // await db.insert(schema.embeddings).values(
  //   results.map((r) => ({
  //     webinarId,
  //     sourceId,
  //     chunkText: r.chunkText,
  //     chunkIndex: r.chunkIndex,
  //     embedding: r.embedding,
  //   }))
  // );

  log.info(`Embeddings stored`, { webinarId, sourceId, chunksCount: results.length });
}
