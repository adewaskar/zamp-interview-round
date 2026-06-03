"use client";

import { Button, Typography } from "antd";
import {
  CompassFilled,
  PlusOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import type { SessionListItem } from "@/lib/types/api";
import { APP_NAME } from "@/lib/config";
import { SessionList } from "./SessionList";
import styles from "./Sidebar.module.css";

const { Text } = Typography;

/**
 * Left navigation rail: brand, "New chat", the scrollable session list, and a
 * "Manage agents" entry point at the bottom.
 */
export function Sidebar({
  sessions,
  activeId,
  loading,
  creating,
  onNewChat,
  onSelect,
  onDelete,
  onManageAgents,
}: {
  sessions: SessionListItem[];
  activeId: string | null;
  loading: boolean;
  creating: boolean;
  onNewChat: () => void;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onManageAgents: () => void;
}) {
  return (
    <div className={styles.sidebar}>
      <div className={styles.brand}>
        <span className={styles.logo}>
          <CompassFilled />
        </span>
        <div className={styles.brandText}>
          <Text className={styles.appName}>{APP_NAME}</Text>
          <Text className={styles.appSub}>Research assistant</Text>
        </div>
      </div>

      <div className={styles.newChatWrap}>
        <Button
          type="primary"
          block
          icon={<PlusOutlined />}
          onClick={onNewChat}
          loading={creating}
          className={styles.newChat}
        >
          New chat
        </Button>
      </div>

      <div className={styles.sessions}>
        <SessionList
          sessions={sessions}
          activeId={activeId}
          loading={loading}
          onSelect={onSelect}
          onDelete={onDelete}
        />
      </div>

      <div className={styles.footer}>
        <Button
          block
          ghost
          icon={<TeamOutlined />}
          onClick={onManageAgents}
          className={styles.manage}
        >
          Manage agents
        </Button>
      </div>
    </div>
  );
}
