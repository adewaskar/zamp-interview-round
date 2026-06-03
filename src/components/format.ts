/**
 * Small presentation-only helpers shared across the chat renderers. These make
 * the `unknown`-typed tool args/results skimmable without dumping raw JSON,
 * while degrading gracefully when a shape is unfamiliar.
 */

/** Relative time like "just now", "5m", "3h", "2d", falling back to a date. */
export function relativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";
  const diff = Date.now() - then;
  const sec = Math.round(diff / 1000);
  if (sec < 45) return "just now";
  const min = Math.round(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.round(hr / 24);
  if (day < 7) return `${day}d ago`;
  return new Date(iso).toLocaleDateString();
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value : undefined;
}

/** A single web search source extracted from a tool result. */
export interface SearchSource {
  title?: string;
  url?: string;
  snippet?: string;
}

export interface WebSearchSummary {
  queries: string[];
  sources: SearchSource[];
}

/**
 * Best-effort summary of a `web_search` call. Reads queries from the args and
 * sources from the result, tolerating a few common shapes
 * (`results`/`sources`/bare array of `{title,url}`).
 */
export function summarizeWebSearch(
  args: unknown,
  result: unknown,
): WebSearchSummary {
  const queries: string[] = [];
  if (isRecord(args)) {
    const q = args.query ?? args.queries ?? args.q;
    if (typeof q === "string") queries.push(q);
    else if (Array.isArray(q))
      queries.push(...q.filter((x): x is string => typeof x === "string"));
  } else if (typeof args === "string") {
    queries.push(args);
  }

  const rows: unknown[] = Array.isArray(result)
    ? result
    : isRecord(result)
      ? ((result.results ?? result.sources ?? result.items ?? []) as unknown[])
      : [];

  const sources: SearchSource[] = [];
  for (const row of rows) {
    if (!isRecord(row)) continue;
    const title = asString(row.title) ?? asString(row.name);
    const url = asString(row.url) ?? asString(row.link);
    const snippet =
      asString(row.snippet) ??
      asString(row.summary) ??
      asString(row.text)?.slice(0, 240);
    if (url || title) sources.push({ title, url, snippet });
  }

  return { queries, sources };
}

export interface ReadPdfSummary {
  url?: string;
  textLength?: number;
  snippet?: string;
}

/** Best-effort summary of a `read_pdf` call. */
export function summarizeReadPdf(
  args: unknown,
  result: unknown,
): ReadPdfSummary {
  const url =
    (isRecord(args) ? asString(args.url) ?? asString(args.href) : undefined) ??
    (isRecord(result) ? asString(result.url) : undefined);

  let text: string | undefined;
  if (typeof result === "string") text = result;
  else if (isRecord(result))
    text =
      asString(result.text) ??
      asString(result.content) ??
      asString(result.extractedText);

  return {
    url,
    textLength: text ? text.length : undefined,
    snippet: text ? text.slice(0, 280) : undefined,
  };
}

/** Stable pretty-printed JSON for "raw" expanders. */
export function prettyJson(value: unknown): string {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

/** One-line preview of arbitrary args for a tool header. */
export function inlineArgs(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "string") return value;
  if (isRecord(value)) {
    const parts = Object.entries(value)
      .slice(0, 3)
      .map(([k, v]) => {
        const text =
          typeof v === "string" ? v : Array.isArray(v) ? `[${v.length}]` : String(v);
        return `${k}: ${text}`;
      });
    return parts.join("  ");
  }
  return String(value);
}
