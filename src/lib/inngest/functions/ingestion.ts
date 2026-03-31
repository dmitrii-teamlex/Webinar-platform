import { inngest } from "../client";
import { EVENTS } from "../events";
import { parseUrl } from "@/lib/ingestion/url-parser";
import { parseFile } from "@/lib/ingestion/file-parsers";
import { generateEmbeddings, storeEmbeddings } from "@/lib/ingestion/embeddings";
import { createLogger } from "@/lib/logger";

const log = createLogger("inngest.ingestion");

/**
 * Ingestion workflow — triggered when a source is added to a webinar.
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

    log.info(`Ingestion started`, { webinarId, sourceId });

    const source = await step.run("fetch-source", async () => {
      // TODO: Replace with actual DB query
      log.debug(`Fetching source`, { sourceId });
      return {
        id: sourceId,
        webinarId,
        type: "url" as const,
        url: "https://example.com",
        status: "processing",
      };
    });

    const extractedText = await step.run("parse-source", async () => {
      if (source.type === "url" && source.url) {
        const parsed = await parseUrl(source.url);
        return parsed.text;
      }
      // TODO: file fetch from storage
      return "";
    });

    const embeddingResults = await step.run("generate-embeddings", async () => {
      if (!extractedText) return [];
      return generateEmbeddings(extractedText);
    });

    await step.run("store-embeddings", async () => {
      if (embeddingResults.length === 0) return;
      await storeEmbeddings(webinarId, sourceId, embeddingResults);
    });

    await step.run("update-source-status", async () => {
      // TODO: Update source in DB
      log.info(`Source ingestion completed`, {
        sourceId,
        webinarId,
        chunksCount: embeddingResults.length,
        textLength: extractedText.length,
      });
    });

    await step.run("check-all-sources", async () => {
      // TODO: Check if all sources processed, fire ingestion.completed
      log.debug(`Checking all sources`, { webinarId });
    });

    return { sourceId, webinarId, chunksCount: embeddingResults.length };
  }
);
