export type SourceEntry = {
  id: string;
  type: "url" | "pdf" | "csv" | "xlsx" | "txt";
  url?: string;
  file?: File;
  fileName?: string;
};
