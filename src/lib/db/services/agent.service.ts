import { connectToDatabase } from "../connect";
import { Agent } from "../models/agent.model";
import { isToolId, type ToolId } from "@/lib/tools/catalog";
import { DEFAULT_MODEL } from "@/lib/config";
import type { AgentDTO, CreateAgentBody, UpdateAgentBody } from "@/lib/types/api";

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

function sanitizeTools(tools: unknown): ToolId[] {
  if (!Array.isArray(tools)) return [];
  return tools.filter((t): t is ToolId => typeof t === "string" && isToolId(t));
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toDTO(doc: any): AgentDTO {
  return {
    id: String(doc._id),
    slug: doc.slug,
    name: doc.name,
    description: doc.description,
    instructions: doc.instructions,
    tools: sanitizeTools(doc.tools),
    model: doc.model ?? DEFAULT_MODEL,
    enabled: doc.enabled ?? true,
    createdAt: new Date(doc.createdAt).toISOString(),
    updatedAt: new Date(doc.updatedAt).toISOString(),
  };
}

/** Ensure the slug is unique by appending -2, -3, … on collision. */
async function ensureUniqueSlug(base: string, excludeId?: string): Promise<string> {
  const root = base || "agent";
  let candidate = root;
  let n = 1;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const existing = await Agent.findOne({ slug: candidate }).lean();
    if (!existing || String(existing._id) === excludeId) return candidate;
    n += 1;
    candidate = `${root}-${n}`;
  }
}

export async function listAgents(): Promise<AgentDTO[]> {
  await connectToDatabase();
  const docs = await Agent.find().sort({ createdAt: 1 }).lean();
  return docs.map(toDTO);
}

export async function getAgentBySlug(slug: string): Promise<AgentDTO | null> {
  await connectToDatabase();
  const doc = await Agent.findOne({ slug }).lean();
  return doc ? toDTO(doc) : null;
}

export async function createAgent(body: CreateAgentBody): Promise<AgentDTO> {
  await connectToDatabase();
  const name = body.name?.trim();
  if (!name) throw new Error("name is required");
  if (!body.description?.trim()) throw new Error("description is required");
  if (!body.instructions?.trim()) throw new Error("instructions is required");

  const slug = await ensureUniqueSlug(slugify(body.slug || name));
  const doc = await Agent.create({
    slug,
    name,
    description: body.description.trim(),
    instructions: body.instructions.trim(),
    tools: sanitizeTools(body.tools),
    model: body.model || DEFAULT_MODEL,
    enabled: body.enabled ?? true,
  });
  return toDTO(doc.toObject());
}

export async function updateAgent(
  id: string,
  body: UpdateAgentBody,
): Promise<AgentDTO | null> {
  await connectToDatabase();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const update: Record<string, any> = {};
  if (body.name !== undefined) update.name = body.name.trim();
  if (body.description !== undefined) update.description = body.description.trim();
  if (body.instructions !== undefined) update.instructions = body.instructions.trim();
  if (body.tools !== undefined) update.tools = sanitizeTools(body.tools);
  if (body.model !== undefined) update.model = body.model;
  if (body.enabled !== undefined) update.enabled = body.enabled;
  if (body.slug !== undefined) {
    update.slug = await ensureUniqueSlug(slugify(body.slug), id);
  }

  const doc = await Agent.findByIdAndUpdate(id, update, { new: true }).lean();
  return doc ? toDTO(doc) : null;
}

export async function deleteAgent(id: string): Promise<boolean> {
  await connectToDatabase();
  const res = await Agent.findByIdAndDelete(id).lean();
  return Boolean(res);
}
