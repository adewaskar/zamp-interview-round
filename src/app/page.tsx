"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { App, ConfigProvider, Space, theme as antdTheme } from "antd";
import { TeamOutlined } from "@ant-design/icons";
import { useDrawer } from "@highstack/antd-utils";
import type { ChatMessage, MessagePart } from "@/lib/types/parts";
import type { SessionDTO, SessionListItem } from "@/lib/types/api";
import { api } from "@/lib/client/api";
import {
  optimisticUserMessage,
  useChatStream,
} from "@/lib/client/useChatStream";
import { BRAND_PRIMARY } from "@/lib/theme";
import { TokenThemeBridge } from "@/lib/styled/TokenThemeBridge";
import { Sidebar } from "@/components/Sidebar";
import { ChatWindow } from "@/components/ChatWindow";
import { AgentManager } from "@/components/AgentManager";
import { Shell, Rail, Main } from "./page.styles";

/**
 * Scout workspace. Owns all client state and orchestrates the composed
 * sub-components: session sidebar, chat window, and the sub-agent manager.
 * The antd `<App>` (for context-aware `message`/`modal`) and the imperative
 * modal/drawer provider live in the root layout, so this tree can freely use
 * `App.useApp()` and `useDrawer()`.
 */
function Workspace() {
  const { message } = App.useApp();
  const { openDrawer } = useDrawer();
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

  // Open the sub-agent manager as an imperative drawer (@highstack/antd-utils).
  const openAgents = useCallback(() => {
    openDrawer(<AgentManager />, {
      title: (
        <Space>
          <TeamOutlined />
          <span>Sub-agents</span>
        </Space>
      ),
      width: 520,
      destroyOnHidden: true,
    });
  }, [openDrawer]);

  return (
    <Shell hasSider>
      <Rail width={280} theme="dark">
        {/* The rail's contents are themed dark via a nested ConfigProvider; the
            same styled components then resolve dark tokens through the bridge. */}
        <ConfigProvider
          theme={{
            algorithm: antdTheme.darkAlgorithm,
            token: { colorPrimary: BRAND_PRIMARY },
          }}
        >
          <TokenThemeBridge>
            <Sidebar
              sessions={sessions}
              activeId={activeId}
              loading={sessionsLoading}
              creating={creating}
              onNewChat={newChat}
              onSelect={selectSession}
              onDelete={deleteSession}
              onManageAgents={openAgents}
            />
          </TokenThemeBridge>
        </ConfigProvider>
      </Rail>

      <Main>
        <ChatWindow
          session={session}
          messages={messages}
          loadingSession={loadingSession}
          streaming={chat.streaming}
          awaitingFirstToken={awaitingFirstToken}
          onSend={sendMessage}
          onManageAgents={openAgents}
          onNewChat={newChat}
        />
      </Main>
    </Shell>
  );
}

export default function Page() {
  return <Workspace />;
}
