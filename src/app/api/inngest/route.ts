import { serve } from "inngest/next";
import { inngest } from "@/lib/inngest/client";
import { fanOutArtifactGeneration } from "@/lib/inngest/functions/artifact-generation";
import { presentationGenerator } from "@/lib/inngest/functions/generators/presentation";
import { landingPageGenerator } from "@/lib/inngest/functions/generators/landing-page";
import { thankYouGenerator } from "@/lib/inngest/functions/generators/thank-you";

// Register all Inngest functions here.
// Each developer appends their generator functions to this array.
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    fanOutArtifactGeneration,
    // Dev 1 generators:
    presentationGenerator,
    landingPageGenerator,
    thankYouGenerator,

    // Dev 2 generators: (append here)
    // attendanceChainGenerator,
    // giftGenerator,
    // ingestionWorkflow,
    // thesisGenerationWorkflow,
  ],
});
