import { afterEach, describe, expect, it } from "vitest";
import { webSearchTool } from "./web-search";

describe("web_search tool", () => {
  const prev = process.env.TAVILY_API_KEY;
  afterEach(() => {
    if (prev === undefined) delete process.env.TAVILY_API_KEY;
    else process.env.TAVILY_API_KEY = prev;
  });

  it("fails gracefully (no throw) when the search API key is missing", async () => {
    delete process.env.TAVILY_API_KEY;
    const res = (await webSearchTool.execute!(
      { queries: ["anything"] },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      { toolCallId: "t", messages: [] } as any,
    )) as { sources: unknown[]; error?: string };
    expect(res.sources).toEqual([]);
    expect(res.error).toMatch(/TAVILY_API_KEY/);
  });
});
