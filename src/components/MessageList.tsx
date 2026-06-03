"use client";

import { useEffect, useRef } from "react";
import { Empty, Spin, Typography } from "antd";
import type { ChatMessage } from "@/lib/types/parts";
import { MessageBubble, ThinkingRow } from "./MessageBubble";
import styles from "./MessageList.module.css";

const { Text } = Typography;

/**
 * Scrollable transcript. Auto-sticks to the bottom as new content streams in,
 * but only when the user is already near the bottom — so scrolling up to read
 * history is not yanked back down mid-stream.
 */
export function MessageList({
  messages,
  streaming,
  awaitingFirstToken,
}: {
  messages: ChatMessage[];
  streaming: boolean;
  /** True between "send" and the first streamed token (show the spinner row). */
  awaitingFirstToken: boolean;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const stickToBottom = useRef(true);

  // Track whether the viewport is pinned to the bottom.
  const onScroll = () => {
    const el = containerRef.current;
    if (!el) return;
    const distance = el.scrollHeight - el.scrollTop - el.clientHeight;
    stickToBottom.current = distance < 120;
  };

  useEffect(() => {
    const el = containerRef.current;
    if (el && stickToBottom.current) {
      el.scrollTop = el.scrollHeight;
    }
  }, [messages, streaming, awaitingFirstToken]);

  const isEmpty = messages.length === 0 && !awaitingFirstToken;

  return (
    <div
      ref={containerRef}
      className={styles.scroll}
      onScroll={onScroll}
      role="log"
      aria-live="polite"
    >
      {isEmpty ? (
        <div className={styles.empty}>
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              <Text type="secondary">
                Ask a research question to get started.
              </Text>
            }
          />
        </div>
      ) : (
        <div className={styles.thread}>
          {messages.map((m) => (
            <MessageBubble key={m._id ?? Math.random()} message={m} />
          ))}
          {awaitingFirstToken && (
            <ThinkingRow>
              <div className={styles.thinking}>
                <Spin size="small" />
                <Text type="secondary">Thinking…</Text>
              </div>
            </ThinkingRow>
          )}
        </div>
      )}
    </div>
  );
}
