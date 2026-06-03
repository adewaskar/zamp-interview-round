"use client";

import { Popconfirm, Spin, Tooltip } from "antd";
import { DeleteOutlined, MessageOutlined } from "@ant-design/icons";
import type { SessionListItem } from "@/lib/types/api";
import { relativeTime } from "@/lib/format";
import {
  Center,
  DeleteButton,
  Empty,
  EmptyText,
  List,
  Row,
  RowIcon,
  RowText,
  Time,
  Title,
} from "./SessionList.styles";

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
      <Center>
        <Spin size="small" />
      </Center>
    );
  }

  if (sessions.length === 0) {
    return (
      <Empty>
        <EmptyText>No chats yet</EmptyText>
      </Empty>
    );
  }

  return (
    <List>
      {sessions.map((session) => {
        const active = session.id === activeId;
        return (
          <li key={session.id}>
            <Row
              role="button"
              tabIndex={0}
              aria-current={active}
              $active={active}
              onClick={() => onSelect(session.id)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onSelect(session.id);
                }
              }}
            >
              <RowIcon as={MessageOutlined} />
              <RowText>
                <Title>{session.title || "New chat"}</Title>
                <Time>{relativeTime(session.updatedAt)}</Time>
              </RowText>
              <Popconfirm
                title="Delete this chat?"
                description="This conversation will be permanently removed."
                okText="Delete"
                okButtonProps={{ danger: true }}
                cancelText="Cancel"
                onConfirm={() => onDelete(session.id)}
              >
                <Tooltip title="Delete chat">
                  <DeleteButton
                    type="button"
                    aria-label={`Delete chat ${session.title || "New chat"}`}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <DeleteOutlined />
                  </DeleteButton>
                </Tooltip>
              </Popconfirm>
            </Row>
          </li>
        );
      })}
    </List>
  );
}
