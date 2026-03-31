/**
 * Text chunking — splits large text into overlapping chunks for embedding.
 */

export type Chunk = {
  text: string;
  index: number;
  startChar: number;
  endChar: number;
};

export type ChunkOptions = {
  /** Max characters per chunk */
  chunkSize?: number;
  /** Overlap between consecutive chunks in characters */
  overlap?: number;
};

const DEFAULT_CHUNK_SIZE = 1000;
const DEFAULT_OVERLAP = 200;

/**
 * Split text into overlapping chunks, breaking at sentence boundaries
 * where possible.
 */
export function chunkText(
  text: string,
  options: ChunkOptions = {}
): Chunk[] {
  const { chunkSize = DEFAULT_CHUNK_SIZE, overlap = DEFAULT_OVERLAP } = options;

  const cleaned = text.replace(/\s+/g, " ").trim();

  if (cleaned.length <= chunkSize) {
    return [{ text: cleaned, index: 0, startChar: 0, endChar: cleaned.length }];
  }

  const chunks: Chunk[] = [];
  let start = 0;
  let index = 0;

  while (start < cleaned.length) {
    let end = Math.min(start + chunkSize, cleaned.length);

    // Try to break at a sentence boundary
    if (end < cleaned.length) {
      const segment = cleaned.slice(start, end);
      const lastSentenceEnd = findLastSentenceEnd(segment);

      if (lastSentenceEnd > chunkSize * 0.5) {
        end = start + lastSentenceEnd;
      }
    }

    chunks.push({
      text: cleaned.slice(start, end).trim(),
      index,
      startChar: start,
      endChar: end,
    });

    // Move start forward by (end - start - overlap)
    const step = end - start - overlap;
    start += Math.max(step, 1);
    index++;
  }

  return chunks;
}

/**
 * Find the position of the last sentence-ending character in a string.
 */
function findLastSentenceEnd(text: string): number {
  const endings = [". ", "! ", "? ", ".\n", "!\n", "?\n"];
  let lastPos = -1;

  for (const ending of endings) {
    const pos = text.lastIndexOf(ending);
    if (pos > lastPos) {
      lastPos = pos + ending.length;
    }
  }

  // Fallback: try to break at paragraph or newline
  if (lastPos <= 0) {
    const nlPos = text.lastIndexOf("\n");
    if (nlPos > 0) return nlPos + 1;
  }

  return lastPos;
}
