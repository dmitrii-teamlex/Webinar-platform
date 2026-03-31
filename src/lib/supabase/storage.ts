/**
 * Supabase Storage helpers — file upload/download for source materials.
 *
 * Stub: actual implementation requires connected Supabase client.
 */

export const STORAGE_BUCKETS = {
  SOURCES: "webinar-sources",
  KNOWLEDGE_BASE: "knowledge-base",
} as const;

export type UploadResult = {
  path: string;
  fullUrl: string;
};

export async function uploadFile(
  _bucket: string,
  _path: string,
  _file: File | Buffer
): Promise<UploadResult> {
  // TODO: Implement with Supabase Storage
  throw new Error("Storage not configured");
}

export async function getFileUrl(
  _bucket: string,
  _path: string
): Promise<string> {
  // TODO: Implement with Supabase Storage
  throw new Error("Storage not configured");
}

export async function deleteFile(
  _bucket: string,
  _path: string
): Promise<void> {
  // TODO: Implement with Supabase Storage
  throw new Error("Storage not configured");
}
