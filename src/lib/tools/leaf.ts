import type { ToolSet } from "ai";
import { webSearchTool } from "./web-search";
import { readPdfTool } from "./read-pdf";

/**
 * "Leaf" tools — the ones a sub-agent (or the orchestrator) actually executes,
 * as opposed to `delegate` which spawns more agents. Kept in its own module so
 * the sub-agent runner can import it without pulling in `delegate` (which would
 * create an import cycle: delegate -> sub-agent -> leaf).
 */
const LEAF_TOOLS: ToolSet = {
  web_search: webSearchTool,
  read_pdf: readPdfTool,
};

/** Build the subset of leaf tools whose ids were granted to an agent. */
export function buildLeafTools(ids: string[]): ToolSet {
  const out: ToolSet = {};
  for (const id of ids) {
    if (id in LEAF_TOOLS) out[id] = LEAF_TOOLS[id];
  }
  return out;
}
