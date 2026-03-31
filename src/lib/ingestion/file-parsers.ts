/**
 * File parsers — extract text from PDF, CSV, XLSX, TXT files.
 */

import { PDFParse, type TextResult } from "pdf-parse";
import { parse as csvParse } from "csv-parse/sync";
import * as XLSX from "xlsx";

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

  switch (ext) {
    case "pdf":
      return parsePdf(buffer, fileName);
    case "csv":
      return parseCsv(buffer, fileName);
    case "xlsx":
    case "xls":
      return parseXlsx(buffer, fileName);
    case "txt":
      return parseTxt(buffer, fileName);
    default:
      throw new Error(`Unsupported file type: .${ext}`);
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
