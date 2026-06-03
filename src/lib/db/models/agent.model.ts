import mongoose, { InferSchemaType, Model, Schema } from "mongoose";
import { Collection, ModelName } from "./constants";

/**
 * A user-defined sub-agent. The orchestrator reads the roster of enabled agents
 * and decides whether to delegate. `instructions` is the sub-agent's system
 * prompt; `tools` is the set of tool ids it is allowed to use.
 */
export const AgentSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: ModelName.USER,
      required: true,
      index: true,
    },
    slug: { type: String, required: true, trim: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    instructions: { type: String, required: true },
    tools: { type: [String], default: [] },
    model: { type: String, default: "gpt-4.1" },
    enabled: { type: Boolean, default: true },
  },
  { timestamps: true, collection: Collection.AGENT },
);

// Slugs are unique per user, not globally.
AgentSchema.index({ userId: 1, slug: 1 }, { unique: true });

export type AgentDoc = InferSchemaType<typeof AgentSchema>;

export const Agent: Model<AgentDoc> =
  (mongoose.models[ModelName.AGENT] as Model<AgentDoc>) ||
  mongoose.model<AgentDoc>(ModelName.AGENT, AgentSchema);

export default Agent;
