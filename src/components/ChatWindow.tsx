"use client";

import { Button, Spin, Typography } from "antd";
import { CompassFilled, TeamOutlined } from "@ant-design/icons";
import type { ChatMessage } from "@/lib/types/parts";
import type { SessionDTO } from "@/lib/types/api";
import { APP_NAME, APP_TAGLINE } from "@/lib/config";
import { MessageList } from "./MessageList";
import { Composer } from "./Composer";
import styles from "./ChatWindow.module.css";

const { Title, Text } = Typography;

/**
 * The right-hand chat surface for the selected session: a slim header, the
 * scrollable transcript, and the composer. When no session is selected it shows
 * a friendly intro built from `APP_TAGLINE`.
 */
export function ChatWindow({
  session,
  messages,
  loadingSession,
  streaming,
  awaitingFirstToken,
  onSend,
  onManageAgents,
  onNewChat,
}: {
  session: SessionDTO | null;
  messages: ChatMessage[];
  loadingSession: boolean;
  streaming: boolean;
  awaitingFirstToken: boolean;
  onSend: (text: string) => void;
  onManageAgents: () => void;
  onNewChat: () => void;
}) {
  if (!session) {
    return (
      <div className={styles.intro}>
        <span className={styles.introLogo}>
          <CompassFilled />
        </span>
        <Title level={3} className={styles.introTitle}>
          Welcome to {APP_NAME}
        </Title>
        <Text type="secondary" className={styles.introTagline}>
          {APP_TAGLINE}
        </Text>
        <div className={styles.introActions}>
          <Button type="primary" size="large" onClick={onNewChat}>
            Start a new chat
          </Button>
          <Button
            size="large"
            icon={<TeamOutlined />}
            onClick={onManageAgents}
          >
            Manage sub-agents
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.window}>
      <header className={styles.header}>
        <div className={styles.headerTitle}>
          <Text strong ellipsis className={styles.title}>
            {session.title || "New chat"}
          </Text>
        </div>
        <Button
          type="text"
          icon={<TeamOutlined />}
          onClick={onManageAgents}
          className={styles.manageBtn}
        >
          Agents
        </Button>
      </header>

      {loadingSession ? (
        <div className={styles.loading}>
          <Spin />
        </div>
      ) : (
        <MessageList
          messages={messages}
          streaming={streaming}
          awaitingFirstToken={awaitingFirstToken}
        />
      )}

      <Composer disabled={streaming} onSend={onSend} />
    </div>
  );
}
