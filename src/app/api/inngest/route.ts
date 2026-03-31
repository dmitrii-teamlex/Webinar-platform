import { serve } from "inngest/next";
import { inngest } from "@/lib/inngest/client";
import { fanOutArtifactGeneration } from "@/lib/inngest/functions/artifact-generation";
import { ingestionWorkflow } from "@/lib/inngest/functions/ingestion";
import { thesisGenerationWorkflow } from "@/lib/inngest/functions/thesis-generation";
import { presentationGenerator } from "@/lib/inngest/functions/generators/presentation";
import { landingPageGenerator } from "@/lib/inngest/functions/generators/landing-page";
import { thankYouGenerator } from "@/lib/inngest/functions/generators/thank-you";
import { attendanceChainGenerator } from "@/lib/inngest/functions/generators/attendance-chain";
import { giftGenerator } from "@/lib/inngest/functions/generators/gift";

// Register all Inngest functions here.
// Each developer appends their generator functions to this array.
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    fanOutArtifactGeneration,
    ingestionWorkflow,
    thesisGenerationWorkflow,
    // Dev 1 generators:
    presentationGenerator,
    landingPageGenerator,
    thankYouGenerator,

    // Dev 2 generators:
    attendanceChainGenerator,
    giftGenerator,
  ],
});
