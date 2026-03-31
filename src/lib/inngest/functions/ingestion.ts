import { inngest } from "../client";
import { EVENTS } from "../events";
import { parseUrl } from "@/lib/ingestion/url-parser";
import { parseFile } from "@/lib/ingestion/file-parsers";
import { generateEmbeddings, storeEmbeddings } from "@/lib/ingestion/embeddings";

/**
 * Ingestion workflow — triggered when a source is added to a webinar.
 * 1. Parse the source (URL or file)
 * 2. Generate embeddings from extracted text
 * 3. Store embeddings in pgvector
 * 4. Update source status
 */
export const ingestionWorkflow = inngest.createFunction(
  {
    id: "source-ingestion",
    name: "Source Ingestion",
    triggers: [{ event: EVENTS.SOURCE_ADDED }],
    retries: 2,
  },
  async ({ event, step }) => {
    const { webinarId, sourceId } = event.data as {
      webinarId: string;
      sourceId: string;
    };

    // Step 1: Fetch source details from DB
    const source = await step.run("fetch-source", async () => {
      // TODO: Replace with actual DB query
      // const source = await db.query.sources.findFirst({
      //   where: eq(schema.sources.id, sourceId),
      // });
      console.log(`[Ingestion] Fetching source ${sourceId}`);
      return {
        id: sourceId,
        webinarId,
        type: "url" as const,
        url: "https://example.com",
        status: "processing",
      };
    });

    // Step 2: Parse the source
    const extractedText = await step.run("parse-source", async () => {
      if (source.type === "url" && source.url) {
        const parsed = await parseUrl(source.url);
        return parsed.text;
      }

      // For files: fetch from storage, parse
      // TODO: Replace with actual file fetch from Supabase Storage
      // const fileBuffer = await downloadFile(source.storagePath);
      // const parsed = await parseFile(fileBuffer, source.fileName);
      // return parsed.text;

      return "";
    });

    // Step 3: Generate embeddings
    const embeddingResults = await step.run("generate-embeddings", async () => {
      if (!extractedText) return [];
      return generateEmbeddings(extractedText);
    });

    // Step 4: Store embeddings
    await step.run("store-embeddings", async () => {
      if (embeddingResults.length === 0) return;
      await storeEmbeddings(webinarId, sourceId, embeddingResults);
    });

    // Step 5: Update source status to completed
    await step.run("update-source-status", async () => {
      // TODO: Update source in DB
      // await db.update(schema.sources)
      //   .set({ status: "completed", extractedText })
      //   .where(eq(schema.sources.id, sourceId));
      console.log(`[Ingestion] Source ${sourceId} completed — ${embeddingResults.length} chunks`);
    });

    // Step 6: Check if all sources are processed, fire event
    await step.run("check-all-sources", async () => {
      // TODO: Check if all sources for this webinar are completed
      // If yes, fire ingestion.completed event
      // const pendingSources = await db.query.sources.findMany({
      //   where: and(
      //     eq(schema.sources.webinarId, webinarId),
      //     ne(schema.sources.status, "completed"),
      //   ),
      // });
      // if (pendingSources.length === 0) {
      //   await inngest.send({
      //     name: EVENTS.INGESTION_COMPLETED,
      //     data: { webinarId },
      //   });
      // }
      console.log(`[Ingestion] Check all sources done for webinar ${webinarId}`);
    });

    return {
      sourceId,
      webinarId,
      chunksCount: embeddingResults.length,
    };
  }
);
