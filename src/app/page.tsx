"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { App, ConfigProvider, Space, Spin, theme as antdTheme } from "antd";
import { LogoutOutlined, TeamOutlined } from "@ant-design/icons";
import { useDrawer } from "@highstack/antd-utils";
import type { ChatMessage, MessagePart } from "@/lib/types/parts";
import type { SessionDTO, SessionListItem, UserDTO } from "@/lib/types/api";
import { api } from "@/lib/client/api";
import { auth } from "@/lib/client/auth";
import {
  optimisticUserMessage,
  useChatStream,
} from "@/lib/client/useChatStream";
import { BRAND_PRIMARY } from "@/lib/theme";
import { TokenThemeBridge } from "@/lib/styled/TokenThemeBridge";
import { Sidebar } from "@/components/Sidebar";
import { ChatWindow } from "@/components/ChatWindow";
import { AgentManager } from "@/components/AgentManager";
import { AuthModal } from "@/components/AuthModal";
import { Shell, Rail, Main, AuthBackdrop, AuthGrid } from "./page.styles";

/**
 * Scout workspace. Owns all client state and orchestrates the composed
 * sub-components: session sidebar, chat window, and the sub-agent manager.
 * The antd `<App>` (for context-aware `message`/`modal`) and the imperative
 * modal/drawer provider live in the root layout, so this tree can freely use
 * `App.useApp()` and `useDrawer()`.
 *
 * Only mounts once the user is authenticated (the `AuthGate` below gates on
 * `user`), so its `loadSessions()` / agent fetches always run for a logged-in
 * user whose data is scoped server-side via the auth cookie.
 */
function Workspace({
  user,
  onLogout,
}: {
  user: UserDTO;
  onLogout: () => void;
}) {
  const { message, modal } = App.useApp();
  const { openDrawer } = useDrawer();
  const chat = useChatStream();

  // Logging out is a context switch (it tears down the workspace), so confirm
  // first. The dialog comes from the root `App`, so it tracks the app theme.
  const confirmLogout = useCallback(() => {
    modal.confirm({
      title: "Log out of Scout?",
      icon: <LogoutOutlined />,
      content: "You'll need to sign back in to reach your chats and sub-agents.",
      okText: "Log out",
      cancelText: "Cancel",
      okButtonProps: { danger: true },
      centered: true,
      onOk: onLogout,
    });
  }, [modal, onLogout]);

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
              user={user}
              onLogout={confirmLogout}
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

/**
 * Authentication gate around the workspace. Checks the session on mount via
 * `auth.me()` (the auth cookie rides along automatically). While the check is
 * pending it shows a centered spinner; if unauthenticated it shows the blocking
 * `AuthModal`; once a `user` is known it mounts the `Workspace`. Gating on
 * `user` ensures the workspace's data fetches only run for a logged-in user.
 */
function AuthGate() {
  const [user, setUser] = useState<UserDTO | null>(null);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const me = await auth.me();
        if (active) setUser(me);
      } catch {
        if (active) setUser(null);
      } finally {
        if (active) setAuthChecked(true);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const handleLogout = useCallback(async () => {
    await auth.logout();
    setUser(null);
  }, []);

  if (!authChecked) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100dvh",
        }}
      >
        <Spin size="large" />
      </div>
    );
  }

  if (!user) {
    // Themed by the root ConfigProvider, so the gate's own light/dark toggle
    // (in AuthModal) flips it like the rest of the app.
    return (
      <AuthBackdrop>
        <AuthGrid aria-hidden focusable="false" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern
              id="auth-grid"
              width="44"
              height="44"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M44 0H0V44"
                fill="none"
                stroke="currentColor"
                strokeWidth="1"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#auth-grid)" />
        </AuthGrid>
        <AuthModal onAuthed={setUser} />
      </AuthBackdrop>
    );
  }

  return <Workspace user={user} onLogout={handleLogout} />;
}

export default function Page() {
  return <AuthGate />;
}
