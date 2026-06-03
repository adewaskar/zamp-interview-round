import { tool } from "ai";
import { z } from "zod";

/**
 * Web search via the Tavily API. Accepts a small batch of queries (so the agent
 * can cover several angles in one step), runs them in parallel, flattens and
 * de-duplicates by URL, and returns compact sources the agent can cite.
 */

const MAX_QUERIES = 4;
const RESULTS_PER_QUERY = 5;
const SEARCH_URL = "https://api.tavily.com/search";

const InputSchema = z.object({
  queries: z
    .array(z.string().min(1))
    .min(1)
    .max(MAX_QUERIES)
    .describe(
      `1-${MAX_QUERIES} focused search queries. Use complementary queries to cover the question from several angles in one call.`,
    ),
});

const SourceSchema = z.object({
  title: z.string(),
  url: z.string(),
  snippet: z.string(),
});

const OutputSchema = z.object({
  sources: z.array(SourceSchema),
  error: z.string().optional(),
});

interface TavilyResult {
  title?: string;
  url?: string;
  content?: string;
}

export const webSearchTool = tool({
  description:
    "Search the web and read summarized snippets from the top results. Returns a list of sources (title, url, snippet). Use this to gather current, verifiable facts and to find documents to read.",
  inputSchema: InputSchema,
  outputSchema: OutputSchema,
  execute: async ({ queries }) => {
    const apiKey = process.env.TAVILY_API_KEY;
    if (!apiKey) {
      return { sources: [], error: "TAVILY_API_KEY is not configured." };
    }

    const runQuery = async (query: string): Promise<TavilyResult[]> => {
      const res = await fetch(SEARCH_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          api_key: apiKey,
          query,
          max_results: RESULTS_PER_QUERY,
          search_depth: "basic",
        }),
      });
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`Search API error ${res.status}: ${text.slice(0, 160)}`);
      }
      const data = (await res.json()) as { results?: TavilyResult[] };
      return data.results ?? [];
    };

    const settled = await Promise.allSettled(queries.map(runQuery));

    const seen = new Set<string>();
    const sources: z.infer<typeof SourceSchema>[] = [];
    let lastError: string | undefined;

    for (const outcome of settled) {
      if (outcome.status === "rejected") {
        lastError =
          outcome.reason instanceof Error ? outcome.reason.message : "Web search failed.";
        continue;
      }
      for (const r of outcome.value) {
        if (!r?.url || seen.has(r.url)) continue;
        seen.add(r.url);
        sources.push({
          title: r.title ?? r.url,
          url: r.url,
          snippet: (r.content ?? "").trim(),
        });
      }
    }

    if (sources.length === 0 && lastError) {
      return { sources: [], error: lastError };
    }
    return { sources };
  },
});
