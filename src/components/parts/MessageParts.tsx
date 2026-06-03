"use client";

import {
  isTextPart,
  isToolCallPart,
  isToolResultPart,
  type MessagePart,
  type ToolResultPart,
} from "@/lib/types/parts";
import type { DelegateToolResult } from "@/lib/types/delegation";
import { Markdown } from "../Markdown";
import { ToolPart } from "./ToolPart";
import { DelegationPanel } from "./DelegationPanel";
import styles from "./MessageParts.module.css";

const DELEGATE_TOOL = "delegate";

/**
 * Top-level renderer for an assistant message's `content`, in stream order:
 *  - text            → markdown
 *  - delegate result → `DelegationPanel` (signature feature)
 *  - other tool call → `ToolPart`, paired with its tool-result by `toolCallId`
 *
 * Pairing a tool-call with its result means the standalone result part is
 * skipped where it appears (its call already rendered it). A delegate result
 * can also arrive as a synthesized tool-result with no preceding tool-call
 * (when `agent-start` precedes the `tool-call` frame), which is handled too.
 */
export function MessageParts({ content }: { content: MessagePart[] }) {
  const resultByCallId = new Map<string, ToolResultPart>();
  for (const part of content) {
    if (isToolResultPart(part)) resultByCallId.set(part.toolCallId, part);
  }
  const callIds = new Set(
    content.filter(isToolCallPart).map((p) => p.toolCallId),
  );

  const nodes: React.ReactNode[] = [];

  content.forEach((part, index) => {
    if (isTextPart(part)) {
      if (part.text.trim()) {
        nodes.push(<Markdown key={index}>{part.text}</Markdown>);
      }
      return;
    }

    if (isToolCallPart(part)) {
      if (part.toolName === DELEGATE_TOOL) {
        const result = resultByCallId.get(part.toolCallId);
        nodes.push(
          <DelegationPanel
            key={index}
            result={
              (result?.result as DelegateToolResult) ?? {
                delegations: [],
                message: "",
              }
            }
          />,
        );
        return;
      }
      nodes.push(
        <ToolPart
          key={index}
          call={part}
          result={resultByCallId.get(part.toolCallId)}
        />,
      );
      return;
    }

    if (isToolResultPart(part)) {
      // Skip results already rendered alongside their call.
      if (callIds.has(part.toolCallId)) return;

      if (part.toolName === DELEGATE_TOOL) {
        nodes.push(
          <DelegationPanel
            key={index}
            result={part.result as DelegateToolResult}
          />,
        );
        return;
      }
      // Orphan non-delegate result (defensive): render on its own.
      nodes.push(
        <ToolPart
          key={index}
          call={{
            type: "tool-call",
            toolCallId: part.toolCallId,
            toolName: part.toolName,
            args: part.args,
          }}
          result={part}
        />,
      );
    }
  });

  return <div className={styles.parts}>{nodes}</div>;
}
