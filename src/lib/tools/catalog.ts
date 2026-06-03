/**
 * Client-safe tool catalog. Holds tool *metadata* only (no implementations),
 * so both the sub-agent builder form (frontend) and the runtime tool factory
 * (backend) agree on the same set of tool ids without the client importing any
 * server code.
 */
export type ToolId = "web_search" | "read_pdf" | "delegate";

export interface ToolMeta {
  id: ToolId;
  label: string;
  description: string;
}

/** Tools a user can grant to a sub-agent when building it. */
export const SUBAGENT_TOOLS: ToolMeta[] = [
  {
    id: "web_search",
    label: "Web search",
    description: "Search the web and read summarized snippets from the top results.",
  },
  {
    id: "read_pdf",
    label: "Read PDF",
    description: "Fetch a PDF by URL and extract its text.",
  },
];

/**
 * `delegate` is granted to the orchestrator automatically (never selectable in
 * the sub-agent form), so it is intentionally excluded from SUBAGENT_TOOLS.
 */
export const ALL_TOOL_IDS: ToolId[] = ["web_search", "read_pdf", "delegate"];

export const isToolId = (value: string): value is ToolId =>
  (ALL_TOOL_IDS as string[]).includes(value);
