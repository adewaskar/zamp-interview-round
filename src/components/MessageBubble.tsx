"use client";

import { Avatar, Typography } from "antd";
import { RobotOutlined } from "@ant-design/icons";
import { isTextPart, type ChatMessage } from "@/lib/types/parts";
import { APP_NAME } from "@/lib/config";
import { MessageParts } from "./parts/MessageParts";
import styles from "./MessageBubble.module.css";

const { Text } = Typography;

/**
 * One conversation turn. User turns are right-aligned plain bubbles (their
 * content is always a single text part); assistant turns are left-aligned and
 * render their full ordered `content` (text, tool steps, delegations) via
 * `MessageParts`. `tool`/`system` roles are not surfaced as standalone bubbles.
 */
export function MessageBubble({ message }: { message: ChatMessage }) {
  if (message.role === "user") {
    const text = message.content
      .filter(isTextPart)
      .map((p) => p.text)
      .join("");
    return (
      <div className={`${styles.row} ${styles.userRow}`}>
        <div className={styles.userBubble}>{text}</div>
      </div>
    );
  }

  if (message.role !== "assistant") return null;

  return (
    <div className={`${styles.row} ${styles.assistantRow}`}>
      <Avatar
        size={30}
        icon={<RobotOutlined />}
        className={styles.avatar}
      />
      <div className={styles.assistantBody}>
        <Text type="secondary" className={styles.author}>
          {APP_NAME}
        </Text>
        <MessageParts content={message.content} />
      </div>
    </div>
  );
}

/** Assistant-styled row used for the live "thinking" indicator. */
export function ThinkingRow({ children }: { children?: React.ReactNode }) {
  return (
    <div className={`${styles.row} ${styles.assistantRow}`}>
      <Avatar size={30} icon={<RobotOutlined />} className={styles.avatar} />
      <div className={styles.assistantBody}>{children}</div>
    </div>
  );
}
