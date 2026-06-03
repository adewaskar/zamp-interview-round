import { tool } from "ai";
import { z } from "zod";
import { extractText, getDocumentProxy } from "unpdf";

/**
 * Fetch a PDF by URL and extract its text. Uses `unpdf` (a serverless-friendly
 * pdf.js build with no native dependencies). Output is capped so a large
 * document doesn't blow the model's context — the agent can ask follow-up
 * questions against the returned text.
 */

const MAX_CHARS = 20000;
const MAX_BYTES = 25 * 1024 * 1024; // 25MB guard

const InputSchema = z.object({
  url: z.string().url().describe("Direct URL of the PDF to read."),
});

const OutputSchema = z.object({
  success: z.boolean(),
  url: z.string(),
  pages: z.number().optional(),
  text: z.string(),
  truncated: z.boolean().optional(),
  error: z.string().optional(),
});

export const readPdfTool = tool({
  description:
    "Fetch a PDF document by URL and extract its text content. Use this to read reports, papers, filings, or any PDF found via web search.",
  inputSchema: InputSchema,
  outputSchema: OutputSchema,
  execute: async ({ url }) => {
    try {
      const res = await fetch(url);
      if (!res.ok) {
        return { success: false, url, text: "", error: `Fetch failed: HTTP ${res.status}` };
      }

      const buf = await res.arrayBuffer();
      if (buf.byteLength > MAX_BYTES) {
        return { success: false, url, text: "", error: "PDF is too large to read (>25MB)." };
      }

      const pdf = await getDocumentProxy(new Uint8Array(buf));
      const { totalPages, text } = await extractText(pdf, { mergePages: true });
      const full = (text ?? "").trim();

      if (!full) {
        return {
          success: false,
          url,
          pages: totalPages,
          text: "",
          error: "No extractable text (the PDF may be scanned images).",
        };
      }

      const truncated = full.length > MAX_CHARS;
      return {
        success: true,
        url,
        pages: totalPages,
        text: truncated ? full.slice(0, MAX_CHARS) : full,
        truncated,
      };
    } catch (err) {
      return {
        success: false,
        url,
        text: "",
        error: err instanceof Error ? err.message : "Failed to read PDF.",
      };
    }
  },
});
