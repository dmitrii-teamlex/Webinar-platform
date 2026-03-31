import { NextRequest, NextResponse } from "next/server";
import { parseFile } from "@/lib/ingestion/file-parsers";
import { generateEmbeddings } from "@/lib/ingestion/embeddings";

// In-memory store (replace with DB)
type KBFile = {
  id: string;
  fileName: string;
  fileSize: number;
  extractedText: string;
  chunksCount: number;
  status: "processing" | "completed" | "failed";
  createdAt: string;
};

const kbStore: Map<string, KBFile> = new Map();

/** GET /api/knowledge-base — List all KB files */
export async function GET() {
  const files = Array.from(kbStore.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  return NextResponse.json({ files });
}

/** POST /api/knowledge-base — Upload and process a file */
export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "file is required" }, { status: 400 });
  }

  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  const entry: KBFile = {
    id,
    fileName: file.name,
    fileSize: file.size,
    extractedText: "",
    chunksCount: 0,
    status: "processing",
    createdAt: now,
  };

  kbStore.set(id, entry);

  // Process synchronously for now (move to Inngest for production)
  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const parsed = await parseFile(buffer, file.name);

    const embeddings = await generateEmbeddings(parsed.text);

    // TODO: Store embeddings in DB (global KB, not webinar-scoped)
    // await db.insert(schema.knowledgeBaseFiles).values({
    //   id, fileName: file.name, storagePath: ..., extractedText: parsed.text
    // });
    // for (const emb of embeddings) {
    //   await db.insert(schema.embeddings).values({
    //     webinarId: null, sourceId: id,
    //     chunkText: emb.chunkText, chunkIndex: emb.chunkIndex, embedding: emb.embedding
    //   });
    // }

    entry.extractedText = parsed.text;
    entry.chunksCount = embeddings.length;
    entry.status = "completed";
    kbStore.set(id, entry);
  } catch (e) {
    entry.status = "failed";
    kbStore.set(id, entry);
    console.error(`[KB] Failed to process ${file.name}:`, e);
  }

  return NextResponse.json({ file: entry }, { status: 201 });
}

/** DELETE /api/knowledge-base?id=xxx — Remove a KB file */
export async function DELETE(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  const deleted = kbStore.delete(id);

  if (!deleted) {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }

  // TODO: Delete embeddings from DB
  // await db.delete(schema.embeddings).where(eq(schema.embeddings.sourceId, id));
  // await db.delete(schema.knowledgeBaseFiles).where(eq(schema.knowledgeBaseFiles.id, id));

  return NextResponse.json({ deleted: true });
}
