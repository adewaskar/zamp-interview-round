import { createOpenAI } from "@ai-sdk/openai";
import { createProviderRegistry } from "ai";

/**
 * Provider registry. A registry (rather than a bare provider) keeps model
 * references as portable `"provider:model"` strings and leaves room to add more
 * providers later without touching call sites.
 */
export const registry = createProviderRegistry({
  openai: createOpenAI({ apiKey: process.env.OPENAI_API_KEY }),
});

/** Resolve a model id (`"gpt-4.1"` or `"openai:gpt-4.1"`) to a language model. */
export function languageModel(modelId: string) {
  const id = modelId.includes(":") ? modelId : `openai:${modelId}`;
  return registry.languageModel(id as `openai:${string}`);
}
