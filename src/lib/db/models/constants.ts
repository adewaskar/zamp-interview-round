/** Mongo collection names — single source of truth, kept in sync with schemas. */
export enum Collection {
  AGENT = "agents",
  CHAT_SESSION = "chatsessions",
  USER = "users",
}

/** Mongoose model registration names. */
export enum ModelName {
  AGENT = "Agent",
  CHAT_SESSION = "ChatSession",
  USER = "User",
}
