/**
 * Context Builder Interface.
 * Provides relevant context (from RAG / knowledge base) for AI generation.
 *
 * Dev 2 implements the full version with pgvector similarity search.
 * Dev 1 can mock this during development.
 */

export type ContextChunk = {
  text: string;
  source: string;
  score: number;
};

export type BuildContextOptions = {
  webinarId: string;
  query: string;
  maxChunks?: number;
};

export interface IContextBuilder {
  buildContext(options: BuildContextOptions): Promise<ContextChunk[]>;
}

/**
 * Stub implementation — returns empty context.
 * Replace with RAG-based implementation once embeddings pipeline is ready.
 */
export class StubContextBuilder implements IContextBuilder {
  async buildContext(_options: BuildContextOptions): Promise<ContextChunk[]> {
    return [];
  }
}

// Default export for import convenience
export const contextBuilder: IContextBuilder = new StubContextBuilder();
