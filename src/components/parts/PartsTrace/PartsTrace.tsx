"use client";

import {
  isTextPart,
  isToolCallPart,
  isToolResultPart,
  type MessagePart,
  type ToolResultPart,
} from "@/lib/types/parts";
import { Markdown } from "@/components/Markdown";
import { ToolPart } from "@/components/parts/ToolPart";
import { Trace } from "./PartsTrace.styles";

/**
 * Renders an ordered `MessagePart[]` as a readable trace: text → markdown, and
 * each tool-call paired with its matching tool-result (by `toolCallId`) into a
 * single `ToolPart` card. Used for the assistant turn's own steps AND for a
 * sub-agent's nested transcript inside a delegation — so both render identically.
 *
 * `delegate` parts are intentionally NOT handled here; the parent
 * (`MessageParts`) renders those as a `DelegationPanel`. Sub-agents cannot
 * delegate, so a nested trace never contains a delegate part.
 */
export function PartsTrace({ parts }: { parts: MessagePart[] }) {
  // Index tool-results by call id so a call renders together with its result.
  const resultByCallId = new Map<string, ToolResultPart>();
  for (const part of parts) {
    if (isToolResultPart(part)) resultByCallId.set(part.toolCallId, part);
  }

  const rendered: React.ReactNode[] = [];
  parts.forEach((part, index) => {
    if (isTextPart(part)) {
      if (part.text.trim()) {
        rendered.push(<Markdown key={index}>{part.text}</Markdown>);
      }
      return;
    }
    if (isToolCallPart(part)) {
      rendered.push(
        <ToolPart
          key={index}
          call={part}
          result={resultByCallId.get(part.toolCallId)}
        />,
      );
      return;
    }
    // A tool-result whose call was never seen (defensive): render standalone.
    if (isToolResultPart(part)) {
      const orphan = !parts.some(
        (p) => isToolCallPart(p) && p.toolCallId === part.toolCallId,
      );
      if (orphan) {
        rendered.push(
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
    }
  });

  return <Trace>{rendered}</Trace>;
}
