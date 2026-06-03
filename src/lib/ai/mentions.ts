import type { AgentDTO } from "@/lib/types/api";

/**
 * Expand `@slug` mentions of known sub-agents into `<agent>slug</agent>`
 * directives the orchestrator understands as "the user explicitly wants this
 * sub-agent." Only mentions matching a real sub-agent slug are rewritten;
 * anything else (including email-style `a@b`) is left untouched.
 *
 * Applied to the model-facing copy of the user's message only — the raw text
 * the user typed is what gets stored and shown in the UI.
 */
export function applyAgentMentions(text: string, agents: AgentDTO[]): string {
  if (agents.length === 0 || !text.includes("@")) return text;

  const bySlug = new Map(agents.map((a) => [a.slug.toLowerCase(), a.slug]));

  // Require the `@` to start the string or follow whitespace, so we don't
  // rewrite the middle of an email address or handle.
  return text.replace(
    /(^|\s)@([a-zA-Z0-9][a-zA-Z0-9_-]*)/g,
    (whole, pre: string, token: string) => {
      const slug = bySlug.get(token.toLowerCase());
      return slug ? `${pre}<agent>${slug}</agent>` : whole;
    },
  );
}
