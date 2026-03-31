/**
 * File parsers — extract text from PDF, CSV, XLSX, TXT files.
 */

import { PDFParse, type TextResult } from "pdf-parse";
import { parse as csvParse } from "csv-parse/sync";
import * as XLSX from "xlsx";
import { createLogger } from "@/lib/logger";

const log = createLogger("ingestion.file");

export type ParsedFile = {
  fileName: string;
  text: string;
  pageCount?: number;
};

/**
 * Parse a file buffer and extract text based on file type.
 */
export async function parseFile(
  buffer: Buffer,
  fileName: string
): Promise<ParsedFile> {
  const ext = fileName.split(".").pop()?.toLowerCase() ?? "";

  log.info(`Parsing file`, { fileName, ext, sizeBytes: buffer.length });
  const start = Date.now();

  try {
    let result: ParsedFile;
    switch (ext) {
    case "pdf":
      result = await parsePdf(buffer, fileName); break;
    case "csv":
      result = parseCsv(buffer, fileName); break;
    case "xlsx":
    case "xls":
      result = parseXlsx(buffer, fileName); break;
    case "txt":
      result = parseTxt(buffer, fileName); break;
    default:
      throw new Error(`Unsupported file type: .${ext}`);
    }

    log.info(`File parsed`, {
      fileName,
      ext,
      durationMs: Date.now() - start,
      textLength: result.text.length,
      pageCount: result.pageCount,
    });

    return result;
  } catch (error) {
    log.error(`File parse failed`, {
      fileName,
      ext,
      durationMs: Date.now() - start,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

async function parsePdf(buffer: Buffer, fileName: string): Promise<ParsedFile> {
  const parser = new PDFParse({ data: new Uint8Array(buffer) });
  const result: TextResult = await parser.getText();

  return {
    fileName,
    text: result.text,
    pageCount: result.pages?.length,
  };
}

function parseCsv(buffer: Buffer, fileName: string): ParsedFile {
  const content = buffer.toString("utf-8");

  const records = csvParse(content, {
    columns: true,
    skip_empty_lines: true,
    relax_column_count: true,
  }) as Record<string, string>[];

  // Convert CSV rows to readable text
  const lines = records.map((row) => {
    return Object.entries(row)
      .map(([key, value]) => `${key}: ${value}`)
      .join(", ");
  });

  return {
    fileName,
    text: lines.join("\n"),
  };
}

function parseXlsx(buffer: Buffer, fileName: string): ParsedFile {
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const textParts: string[] = [];

  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet);

    textParts.push(`--- Sheet: ${sheetName} ---`);

    for (const row of rows) {
      const line = Object.entries(row)
        .map(([key, value]) => `${key}: ${value}`)
        .join(", ");
      textParts.push(line);
    }
  }

  return {
    fileName,
    text: textParts.join("\n"),
  };
}

function parseTxt(buffer: Buffer, fileName: string): ParsedFile {
  return {
    fileName,
    text: buffer.toString("utf-8"),
  };
}
