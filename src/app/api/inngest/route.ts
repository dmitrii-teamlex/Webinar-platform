import { serve } from "inngest/next";
import { inngest } from "@/lib/inngest/client";
import { fanOutArtifactGeneration } from "@/lib/inngest/functions/artifact-generation";
import { ingestionWorkflow } from "@/lib/inngest/functions/ingestion";
import { thesisGenerationWorkflow } from "@/lib/inngest/functions/thesis-generation";

// Register all Inngest functions here.
// Each developer appends their generator functions to this array.
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    fanOutArtifactGeneration,
    ingestionWorkflow,
    thesisGenerationWorkflow,
    // Dev 1 generators: (append here)
    // presentationGenerator,
    // landingPageGenerator,
    // thankYouGenerator,

    // Dev 2 generators: (append here)
    // attendanceChainGenerator,
    // giftGenerator,
    // thesisGenerationWorkflow,
  ],
});
