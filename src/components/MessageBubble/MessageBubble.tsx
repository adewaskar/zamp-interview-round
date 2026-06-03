"use client";

import { RobotOutlined } from "@ant-design/icons";
import { isTextPart, type ChatMessage } from "@/lib/types/parts";
import { APP_NAME } from "@/lib/config";
import { MessageParts } from "@/components/parts/MessageParts";
import {
  Row,
  UserBubble,
  StyledAvatar,
  AssistantBody,
  Author,
} from "./MessageBubble.styles";

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
      <Row $role="user">
        <UserBubble>{text}</UserBubble>
      </Row>
    );
  }

  if (message.role !== "assistant") return null;

  return (
    <Row $role="assistant">
      <StyledAvatar size={30} icon={<RobotOutlined />} />
      <AssistantBody>
        <Author type="secondary">{APP_NAME}</Author>
        <MessageParts content={message.content} />
      </AssistantBody>
    </Row>
  );
}

/** Assistant-styled row used for the live "thinking" indicator. */
export function ThinkingRow({ children }: { children?: React.ReactNode }) {
  return (
    <Row $role="assistant">
      <StyledAvatar size={30} icon={<RobotOutlined />} />
      <AssistantBody>{children}</AssistantBody>
    </Row>
  );
}
