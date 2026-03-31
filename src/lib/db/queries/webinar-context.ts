import { eq } from "drizzle-orm";
import { getDb } from "../index";
import { webinars, theses } from "../schema";

export type WebinarContext = {
  title: string;
  topic: string;
  targetAudience: string;
  speakerName: string;
  speakerBio: string;
  date: string;
  theses: string;
};

/**
 * Load webinar data + approved theses formatted for prompt interpolation.
 * Falls back to stub data if DB is not connected (dev without Supabase).
 */
export async function loadWebinarContext(webinarId: string): Promise<WebinarContext> {
  try {
    const db = getDb();

    const webinar = await db
      .select()
      .from(webinars)
      .where(eq(webinars.id, webinarId))
      .limit(1)
      .then((rows) => rows[0]);

    if (!webinar) {
      throw new Error(`Webinar ${webinarId} not found`);
    }

    const approvedTheses = await db
      .select()
      .from(theses)
      .where(eq(theses.webinarId, webinarId))
      .orderBy(theses.order);

    const thesesText = approvedTheses
      .map((t, i) => `${i + 1}. ${t.title}${t.description ? `: ${t.description}` : ""}`)
      .join("\n");

    return {
      title: webinar.title,
      topic: webinar.topic,
      targetAudience: webinar.targetAudience,
      speakerName: webinar.speakerName,
      speakerBio: webinar.speakerBio ?? "",
      date: webinar.date.toISOString(),
      theses: thesesText || "No theses available.",
    };
  } catch (err) {
    // Fallback for development without DB
    if ((err as Error).message?.includes("DATABASE_URL")) {
      console.warn("[webinar-context] No DATABASE_URL — using stub data");
      return {
        title: `Webinar ${webinarId.slice(0, 8)}`,
        topic: "Topic placeholder",
        targetAudience: "Target audience placeholder",
        speakerName: "Speaker Name",
        speakerBio: "Speaker bio placeholder",
        date: new Date().toISOString(),
        theses: "1. Thesis one\n2. Thesis two\n3. Thesis three",
      };
    }
    throw err;
  }
}
