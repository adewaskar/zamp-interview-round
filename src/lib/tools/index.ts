import type { ToolSet } from "ai";
import { buildLeafTools } from "./leaf";
import { delegateTool } from "./delegate";

export { webSearchTool } from "./web-search";
export { readPdfTool } from "./read-pdf";
export { delegateTool } from "./delegate";
export { buildLeafTools } from "./leaf";

/**
 * The orchestrator's tool set: it can search and read PDFs itself, and it can
 * delegate to sub-agents. (Sub-agents get only leaf tools — see `buildLeafTools`.)
 */
export function buildMainAgentTools(): ToolSet {
  return {
    ...buildLeafTools(["web_search", "read_pdf"]),
    delegate: delegateTool,
  };
}
