import mongoose from "mongoose";
import { connectToDatabase } from "../connect";
import { ChatSession } from "../models/chat-session.model";
import { DEFAULT_MODEL } from "@/lib/config";
import type { ChatMessage, ChatRole, MessagePart } from "@/lib/types/parts";
import type { SessionDTO, SessionListItem } from "@/lib/types/api";

const DEFAULT_TITLE = "New chat";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toMessage(m: any): ChatMessage {
  return {
    _id: String(m._id),
    role: m.role,
    content: (m.content ?? []) as MessagePart[],
    createdAt: m.createdAt ? new Date(m.createdAt).toISOString() : undefined,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toSessionDTO(doc: any): SessionDTO {
  return {
    id: String(doc._id),
    title: doc.title ?? DEFAULT_TITLE,
    model: doc.model ?? DEFAULT_MODEL,
    messages: (doc.messages ?? []).map(toMessage),
    createdAt: new Date(doc.createdAt).toISOString(),
    updatedAt: new Date(doc.updatedAt).toISOString(),
  };
}

export async function createSession(userId: string): Promise<SessionDTO> {
  await connectToDatabase();
  const doc = await ChatSession.create({
    userId,
    title: DEFAULT_TITLE,
    model: DEFAULT_MODEL,
  });
  return toSessionDTO(doc.toObject());
}

export async function listSessions(userId: string): Promise<SessionListItem[]> {
  await connectToDatabase();
  const docs = await ChatSession.find({ userId })
    .select("title createdAt updatedAt")
    .sort({ updatedAt: -1 })
    .lean();
  return docs.map((d) => ({
    id: String(d._id),
    title: d.title ?? DEFAULT_TITLE,
    createdAt: new Date(d.createdAt).toISOString(),
    updatedAt: new Date(d.updatedAt).toISOString(),
  }));
}

export async function getSession(
  id: string,
  userId: string,
): Promise<SessionDTO | null> {
  if (!mongoose.isValidObjectId(id)) return null;
  await connectToDatabase();
  const doc = await ChatSession.findOne({ _id: id, userId }).lean();
  return doc ? toSessionDTO(doc) : null;
}

export async function deleteSession(
  id: string,
  userId: string,
): Promise<boolean> {
  if (!mongoose.isValidObjectId(id)) return false;
  await connectToDatabase();
  const res = await ChatSession.findOneAndDelete({ _id: id, userId }).lean();
  return Boolean(res);
}

export async function getMessages(
  sessionId: string,
  userId: string,
): Promise<ChatMessage[]> {
  const session = await getSession(sessionId, userId);
  return session ? session.messages : [];
}

/** Append a message and return the generated subdocument id. */
export async function appendMessage(
  sessionId: string,
  userId: string,
  message: { role: ChatRole; content: MessagePart[] },
): Promise<string> {
  await connectToDatabase();
  const messageId = new mongoose.Types.ObjectId();
  await ChatSession.updateOne(
    { _id: sessionId, userId },
    {
      $push: {
        messages: { _id: messageId, role: message.role, content: message.content },
      },
    },
  );
  return String(messageId);
}

/**
 * Overwrite a message's content parts. Called repeatedly while streaming to
 * checkpoint the assistant turn, so a refresh mid-stream never loses progress.
 */
export async function updateMessageContent(
  sessionId: string,
  userId: string,
  messageId: string,
  content: MessagePart[],
): Promise<void> {
  await connectToDatabase();
  await ChatSession.updateOne(
    { _id: sessionId, userId, "messages._id": messageId },
    { $set: { "messages.$.content": content } },
  );
}

/** Set the session title only if it is still the default — used to auto-title from the first message. */
export async function setTitleIfDefault(
  sessionId: string,
  userId: string,
  title: string,
): Promise<void> {
  await connectToDatabase();
  const clean = title.trim().slice(0, 80) || DEFAULT_TITLE;
  await ChatSession.updateOne(
    { _id: sessionId, userId, title: DEFAULT_TITLE },
    { $set: { title: clean } },
  );
}
