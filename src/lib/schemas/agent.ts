import { z } from "zod";
import { SUBAGENT_TOOLS, type ToolId } from "@/lib/tools/catalog";

const toolIds = SUBAGENT_TOOLS.map((t) => t.id) as [ToolId, ...ToolId[]];
const toolEnum = z.enum(toolIds);

/** UI form for building a sub-agent. */
export const agentFormSchema = z.object({
  name: z.string().min(1, "Give the sub-agent a name").max(80),
  slug: z.string().max(60).optional(),
  description: z.string().min(1, "Describe what this sub-agent does").max(400),
  instructions: z.string().min(1, "Provide instructions (system prompt)"),
  tools: z.array(toolEnum).default([]),
  enabled: z.boolean(),
});
export type AgentFormValues = z.infer<typeof agentFormSchema>;

/** API request body for creating a sub-agent (server source of truth). */
export const createAgentSchema = z.object({
  name: z.string().min(1, "name is required").max(80),
  slug: z.string().max(60).optional(),
  description: z.string().min(1, "description is required").max(400),
  instructions: z.string().min(1, "instructions is required"),
  tools: z.array(toolEnum).optional(),
  model: z.string().optional(),
  enabled: z.boolean().optional(),
});
export type CreateAgentBody = z.infer<typeof createAgentSchema>;

export const updateAgentSchema = createAgentSchema.partial();
export type UpdateAgentBody = z.infer<typeof updateAgentSchema>;
