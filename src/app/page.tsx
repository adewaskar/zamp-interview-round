"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { App, Layout } from "antd";
import type { ChatMessage, MessagePart } from "@/lib/types/parts";
import type { SessionDTO, SessionListItem } from "@/lib/types/api";
import { api } from "@/lib/client/api";
import {
  optimisticUserMessage,
  useChatStream,
} from "@/lib/client/useChatStream";
import { Sidebar } from "@/components/Sidebar";
import { ChatWindow } from "@/components/ChatWindow";
import { AgentManager } from "@/components/AgentManager";
import styles from "./page.module.css";

const { Sider, Content } = Layout;

/**
 * Scout workspace. Owns all client state and orchestrates the composed
 * sub-components: session sidebar, chat window, and the sub-agent manager.
 * Wrapped in antd's `<App>` so descendants can use `App.useApp()` for
 * context-aware `message`/`modal` (the root layout only provides ConfigProvider).
 */
function Workspace() {
  const { message } = App.useApp();
  const chat = useChatStream();

  // ----- sessions -----
  const [sessions, setSessions] = useState<SessionListItem[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  // ----- active session -----
  const [activeId, setActiveId] = useState<string | null>(null);
  const [session, setSession] = useState<SessionDTO | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loadingSession, setLoadingSession] = useState(false);
  const [awaitingFirstToken, setAwaitingFirstToken] = useState(false);

  const [agentsOpen, setAgentsOpen] = useState(false);

  // Guards against a stale session-load resolving after the user switched away.
  const loadTokenRef = useRef(0);

  const loadSessions = useCallback(async () => {
    setSessionsLoading(true);
    try {
      const list = await api.listSessions();
      setSessions(list);
      return list;
    } catch (err) {
      message.error(
        err instanceof Error ? err.message : "Failed to load chats",
      );
      return [];
    } finally {
      setSessionsLoading(false);
    }
  }, [message]);

  useEffect(() => {
    void loadSessions();
  }, [loadSessions]);

  const selectSession = useCallback(
    async (id: string) => {
      if (id === activeId) return;
      chat.abort();
      setAwaitingFirstToken(false);
      setActiveId(id);
      setLoadingSession(true);
      setMessages([]);
      const token = ++loadTokenRef.current;
      try {
        const dto = await api.getSession(id);
        if (loadTokenRef.current !== token) return; // superseded
        setSession(dto);
        setMessages(dto.messages);
      } catch (err) {
        if (loadTokenRef.current !== token) return;
        message.error(
          err instanceof Error ? err.message : "Failed to open chat",
        );
        setSession(null);
      } finally {
        if (loadTokenRef.current === token) setLoadingSession(false);
      }
    },
    [activeId, chat, message],
  );

  const newChat = useCallback(async () => {
    setCreating(true);
    chat.abort();
    try {
      const created = await api.createSession();
      setSessions((prev) => [
        { id: created.id, title: created.title, createdAt: created.createdAt, updatedAt: created.updatedAt },
        ...prev,
      ]);
      setActiveId(created.id);
      setSession(created);
      setMessages(created.messages);
      loadTokenRef.current++; // invalidate any in-flight load
      setLoadingSession(false);
    } catch (err) {
      message.error(
        err instanceof Error ? err.message : "Failed to create chat",
      );
    } finally {
      setCreating(false);
    }
  }, [chat, message]);

  const deleteSession = useCallback(
    async (id: string) => {
      try {
        await api.deleteSession(id);
        setSessions((prev) => prev.filter((s) => s.id !== id));
        if (id === activeId) {
          chat.abort();
          setActiveId(null);
          setSession(null);
          setMessages([]);
        }
        message.success("Chat deleted");
      } catch (err) {
        message.error(
          err instanceof Error ? err.message : "Failed to delete chat",
        );
      }
    },
    [activeId, chat, message],
  );

  // Patch the assistant message (identified by streamed id) in local state.
  const upsertAssistant = useCallback(
    (messageId: string, content: MessagePart[]) => {
      setMessages((prev) => {
        const idx = prev.findIndex((m) => m._id === messageId);
        if (idx === -1) {
          return [...prev, { _id: messageId, role: "assistant", content }];
        }
        const next = prev.slice();
        next[idx] = { ...next[idx], content };
        return next;
      });
    },
    [],
  );

  const sendMessage = useCallback(
    (text: string) => {
      if (!activeId || chat.streaming) return;
      const sessionId = activeId;

      // Optimistic user echo.
      setMessages((prev) => [...prev, optimisticUserMessage(text)]);
      setAwaitingFirstToken(true);

      void chat.send(sessionId, text, {
        onMessageStart: (messageId) => {
          setAwaitingFirstToken(false);
          upsertAssistant(messageId, []);
        },
        onAssistantUpdate: (messageId, content) => {
          upsertAssistant(messageId, content);
        },
        onError: (msg) => {
          setAwaitingFirstToken(false);
          message.error(msg);
        },
        onDone: () => {
          setAwaitingFirstToken(false);
          // Refresh the sidebar so an auto-generated title / ordering appears.
          void loadSessions();
        },
      });
    },
    [activeId, chat, loadSessions, message, upsertAssistant],
  );

  return (
    <Layout className={styles.layout} hasSider>
      <Sider width={280} className={styles.sider} theme="dark">
        <Sidebar
          sessions={sessions}
          activeId={activeId}
          loading={sessionsLoading}
          creating={creating}
          onNewChat={newChat}
          onSelect={selectSession}
          onDelete={deleteSession}
          onManageAgents={() => setAgentsOpen(true)}
        />
      </Sider>

      <Content className={styles.content}>
        <ChatWindow
          session={session}
          messages={messages}
          loadingSession={loadingSession}
          streaming={chat.streaming}
          awaitingFirstToken={awaitingFirstToken}
          onSend={sendMessage}
          onManageAgents={() => setAgentsOpen(true)}
          onNewChat={newChat}
        />
      </Content>

      <AgentManager
        open={agentsOpen}
        onClose={() => setAgentsOpen(false)}
      />
    </Layout>
  );
}

export default function Page() {
  return (
    <App className={styles.app}>
      <Workspace />
    </App>
  );
}
