import { describe, expect, it } from "vitest";
import type { ChatMessage, MessagePart } from "@/lib/types/parts";
import {
  pushTextDelta,
  toModelMessages,
  toToolOutput,
  toolCallPart,
  toolResultPart,
  textPart,
} from "./messages";

describe("pushTextDelta", () => {
  it("coalesces consecutive text into one part", () => {
    const parts = [textPart("Hel")];
    pushTextDelta(parts, "lo ");
    pushTextDelta(parts, "world");
    expect(parts).toEqual([{ type: "text", text: "Hello world" }]);
  });

  it("starts a new text part after a non-text part", () => {
    const parts: MessagePart[] = [textPart("before")];
    parts.push(toolCallPart("c1", "web_search", { queries: ["x"] }));
    pushTextDelta(parts, "after");
    expect(parts).toHaveLength(3);
    expect(parts[2]).toEqual({ type: "text", text: "after" });
  });

  it("ignores empty deltas", () => {
    const parts: MessagePart[] = [];
    pushTextDelta(parts, "");
    expect(parts).toHaveLength(0);
  });
});

describe("toToolOutput", () => {
  it("wraps strings as text and objects as json", () => {
    expect(toToolOutput("hi")).toEqual({ type: "text", value: "hi" });
    expect(toToolOutput({ a: 1 })).toEqual({ type: "json", value: { a: 1 } });
    expect(toToolOutput(null)).toEqual({ type: "json", value: null });
  });
});

describe("toModelMessages", () => {
  it("maps a user turn to a plain user message", () => {
    const msgs: ChatMessage[] = [
      { role: "user", content: [{ type: "text", text: "hello" }] },
    ];
    expect(toModelMessages(msgs)).toEqual([{ role: "user", content: "hello" }]);
  });

  it("splits an assistant tool turn into assistant + tool messages", () => {
    const msgs: ChatMessage[] = [
      {
        role: "assistant",
        content: [
          { type: "text", text: "Let me search." },
          { type: "tool-call", toolCallId: "c1", toolName: "web_search", args: { queries: ["ev"] } },
          { type: "tool-result", toolCallId: "c1", toolName: "web_search", result: { sources: [] } },
        ],
      },
    ];

    const out = toModelMessages(msgs);
    expect(out).toHaveLength(2);

    expect(out[0]).toEqual({
      role: "assistant",
      content: [
        { type: "text", text: "Let me search." },
        { type: "tool-call", toolCallId: "c1", toolName: "web_search", input: { queries: ["ev"] } },
      ],
    });

    expect(out[1]).toEqual({
      role: "tool",
      content: [
        {
          type: "tool-result",
          toolCallId: "c1",
          toolName: "web_search",
          output: { type: "json", value: { sources: [] } },
        },
      ],
    });
  });

  it("keeps interleaved order across multiple tool steps", () => {
    const msgs: ChatMessage[] = [
      {
        role: "assistant",
        content: [
          { type: "text", text: "step1" },
          { type: "tool-call", toolCallId: "a", toolName: "web_search", args: {} },
          { type: "tool-result", toolCallId: "a", toolName: "web_search", result: "ra" },
          { type: "text", text: "step2" },
          { type: "tool-call", toolCallId: "b", toolName: "read_pdf", args: {} },
          { type: "tool-result", toolCallId: "b", toolName: "read_pdf", result: "rb" },
        ],
      },
    ];

    const [assistant, tool] = toModelMessages(msgs);
    expect(assistant.role).toBe("assistant");
    expect((assistant.content as { type: string }[]).map((p) => p.type)).toEqual([
      "text",
      "tool-call",
      "text",
      "tool-call",
    ]);
    expect(tool.role).toBe("tool");
    expect((tool.content as { toolCallId: string }[]).map((p) => p.toolCallId)).toEqual(["a", "b"]);
  });

  it("replays a delegate result as the compact rollup, not the full transcript", () => {
    const rich = {
      message: "### Researcher — t1\nfound it",
      delegations: [
        {
          delegationId: "d1",
          taskId: "t1",
          agentSlug: "researcher",
          agentName: "Researcher",
          input: "go",
          status: "completed",
          summary: "found it",
          parts: [{ type: "text", text: "lots of internal trace" }],
        },
      ],
    };
    const msgs: ChatMessage[] = [
      {
        role: "assistant",
        content: [
          { type: "tool-call", toolCallId: "c1", toolName: "delegate", args: { tasks: [] } },
          { type: "tool-result", toolCallId: "c1", toolName: "delegate", result: rich },
        ],
      },
    ];

    const out = toModelMessages(msgs);
    const toolMsg = out.find((m) => m.role === "tool")!;
    const part = (toolMsg.content as { output: { type: string; value: unknown } }[])[0];
    // The model should see ONLY the compact message, never the sub-agent transcript.
    expect(part.output).toEqual({ type: "text", value: rich.message });
    expect(JSON.stringify(part.output)).not.toContain("internal trace");
  });

  it("round-trips: stored parts the runner builds convert to a valid model history", () => {
    // Simulate what the engine accumulates during a turn.
    const built = [
      textPart("Answer:"),
      toolCallPart("c1", "web_search", { queries: ["q"] }),
      toolResultPart("c1", "web_search", { sources: [{ url: "http://x" }] }, { queries: ["q"] }),
      textPart(" done"),
    ];
    const msgs: ChatMessage[] = [{ role: "assistant", content: built }];
    const out = toModelMessages(msgs);
    expect(out[0].role).toBe("assistant");
    expect(out[1].role).toBe("tool");
    // assistant carries both text parts and the tool-call (with `input`)
    const aTypes = (out[0].content as { type: string }[]).map((p) => p.type);
    expect(aTypes).toEqual(["text", "tool-call", "text"]);
  });
});
