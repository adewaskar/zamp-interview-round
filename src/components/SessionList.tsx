"use client";

import { Popconfirm, Spin, Tooltip, Typography } from "antd";
import { DeleteOutlined, MessageOutlined } from "@ant-design/icons";
import type { SessionListItem } from "@/lib/types/api";
import { relativeTime } from "./format";
import styles from "./SessionList.module.css";

const { Text } = Typography;

/**
 * The list of chat sessions in the dark sider. The active row is highlighted;
 * each row exposes a delete affordance guarded by a Popconfirm. Clicking a row
 * (outside the delete control) selects it.
 */
export function SessionList({
  sessions,
  activeId,
  loading,
  onSelect,
  onDelete,
}: {
  sessions: SessionListItem[];
  activeId: string | null;
  loading: boolean;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  if (loading && sessions.length === 0) {
    return (
      <div className={styles.center}>
        <Spin size="small" />
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <div className={styles.empty}>
        <Text className={styles.emptyText}>No chats yet</Text>
      </div>
    );
  }

  return (
    <ul className={styles.list}>
      {sessions.map((session) => {
        const active = session.id === activeId;
        return (
          <li key={session.id}>
            <div
              role="button"
              tabIndex={0}
              aria-current={active}
              className={`${styles.row} ${active ? styles.active : ""}`}
              onClick={() => onSelect(session.id)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onSelect(session.id);
                }
              }}
            >
              <MessageOutlined className={styles.rowIcon} />
              <div className={styles.rowText}>
                <span className={styles.title}>
                  {session.title || "New chat"}
                </span>
                <span className={styles.time}>
                  {relativeTime(session.updatedAt)}
                </span>
              </div>
              <Popconfirm
                title="Delete this chat?"
                description="This conversation will be permanently removed."
                okText="Delete"
                okButtonProps={{ danger: true }}
                cancelText="Cancel"
                onConfirm={() => onDelete(session.id)}
              >
                <Tooltip title="Delete chat">
                  <button
                    type="button"
                    className={styles.delete}
                    aria-label={`Delete chat ${session.title || "New chat"}`}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <DeleteOutlined />
                  </button>
                </Tooltip>
              </Popconfirm>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
