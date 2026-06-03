import mongoose, { Model, Schema } from "mongoose";
import { Collection, ModelName } from "./constants";

/**
 * One content part of a message. A part is exactly one of:
 *  - text        → { text }
 *  - tool-call   → { toolCallId, toolName, args }
 *  - tool-result → { toolCallId, toolName, args?, result }
 * `args` and `result` are arbitrary JSON, so they are stored as Mixed.
 */
const MessagePartSchema = new Schema(
  {
    type: {
      type: String,
      enum: ["text", "tool-call", "tool-result"],
      required: true,
    },
    text: { type: String, required: false },
    toolCallId: { type: String, required: false },
    toolName: { type: String, required: false },
    args: { type: Schema.Types.Mixed, required: false },
    result: { type: Schema.Types.Mixed, required: false },
  },
  { _id: false },
);

/**
 * A single turn. `content` is an ordered list of parts. Each message keeps its
 * own `_id` (Mongoose default) so the chat route can target it for streaming
 * checkpoint updates: `{ 'messages.$._id': messageId }`.
 */
const MessageSchema = new Schema(
  {
    role: {
      type: String,
      enum: ["user", "assistant", "tool", "system"],
      required: true,
    },
    content: { type: [MessagePartSchema], default: [] },
  },
  { timestamps: true },
);

const ChatSessionSchema = new Schema(
  {
    title: { type: String, default: "New chat" },
    model: { type: String, default: "gpt-4.1" },
    messages: { type: [MessageSchema], default: [] },
  },
  { timestamps: true, collection: Collection.CHAT_SESSION },
);

// The sidebar lists sessions newest-first.
ChatSessionSchema.index({ updatedAt: -1 });

export type ChatSessionDoc = mongoose.InferSchemaType<typeof ChatSessionSchema>;

export const ChatSession: Model<ChatSessionDoc> =
  (mongoose.models[ModelName.CHAT_SESSION] as Model<ChatSessionDoc>) ||
  mongoose.model<ChatSessionDoc>(ModelName.CHAT_SESSION, ChatSessionSchema);

export default ChatSession;
