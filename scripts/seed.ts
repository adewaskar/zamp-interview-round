/**
 * Seed a few example sub-agents so the orchestrator has specialists to delegate
 * to on first run. Self-contained (talks to Mongo directly) so it needs no app
 * wiring. Safe to re-run — it upserts by slug.
 *
 *   pnpm seed
 */
import "dotenv/config";
import mongoose from "mongoose";

type SeedAgent = {
  slug: string;
  name: string;
  description: string;
  instructions: string;
  tools: string[];
  model: string;
  enabled: boolean;
};

const AGENTS: SeedAgent[] = [
  {
    slug: "web-researcher",
    name: "Web Researcher",
    description:
      "Gathers current facts from the open web and returns a sourced briefing. Good for news, definitions, and 'what is the latest on X'.",
    instructions:
      "You are a meticulous web researcher. Break the task into a few search angles, run web searches, and read the most promising pages. Prefer primary and recent sources. Return a concise briefing of concrete findings (numbers, dates, names) with the source URLs you used.",
    tools: ["web_search", "read_pdf"],
    model: "gpt-4.1",
    enabled: true,
  },
  {
    slug: "company-profiler",
    name: "Company Profiler",
    description:
      "Builds a structured profile of a single company: what it does, business model, scale, funding, and recent developments.",
    instructions:
      "You profile one company at a time. Produce: (1) overview & what they sell, (2) business model & how they make money, (3) scale signals (employees, revenue, funding if public), (4) notable recent developments. Use web search to verify every claim and cite sources. If a figure is uncertain, say so rather than guessing.",
    tools: ["web_search", "read_pdf"],
    model: "gpt-4.1",
    enabled: true,
  },
  {
    slug: "market-analyst",
    name: "Market Analyst",
    description:
      "Analyzes a market or industry: size, key players, trends, and risks. Good for 'how big is X market' or 'who competes in Y'.",
    instructions:
      "You analyze markets. Deliver: (1) what the market is and rough size/growth if findable, (2) the main players and how they differ, (3) the 2-4 trends shaping it, (4) key risks. Ground everything in web sources and cite them. Be explicit about confidence when data is thin.",
    tools: ["web_search", "read_pdf"],
    model: "gpt-4.1",
    enabled: true,
  },
];

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI is not set. Copy .env.example to .env.");

  await mongoose.connect(uri);
  const agents = mongoose.connection.collection("agents");

  for (const a of AGENTS) {
    await agents.updateOne(
      { slug: a.slug },
      { $set: { ...a, updatedAt: new Date() }, $setOnInsert: { createdAt: new Date() } },
      { upsert: true },
    );
    console.log(`seeded sub-agent: ${a.slug}`);
  }

  await mongoose.disconnect();
  console.log(`done — ${AGENTS.length} sub-agents ready.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
