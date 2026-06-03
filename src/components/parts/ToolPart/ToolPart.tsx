"use client";

import { useMemo } from "react";
import { Alert, Empty, Space, Tag, Typography, theme as antdTheme } from "antd";
import {
  FilePdfOutlined,
  GlobalOutlined,
  LinkOutlined,
  LoadingOutlined,
  ToolOutlined,
} from "@ant-design/icons";
import type { ToolCallPart, ToolResultPart } from "@/lib/types/parts";
import {
  inlineArgs,
  prettyJson,
  summarizeReadPdf,
  summarizeWebSearch,
} from "@/lib/format";
import {
  ArgPreview,
  Body,
  Card,
  Header,
  Icon,
  PdfUrl,
  Pre,
  Queries,
  Raw,
  Snippet,
  Sources,
} from "./ToolPart.styles";

const { Text, Link } = Typography;

/**
 * A `web_search` / `read_pdf` step rendered as a compact, collapsible card.
 *
 * Takes the tool-call part and (optionally) its matching tool-result part —
 * paired by the caller via `toolCallId`. While the result is still pending the
 * card shows a running indicator; once it arrives the body shows a skimmable
 * summary with a "raw" expander for the full payload.
 */
export function ToolPart({
  call,
  result,
}: {
  call: ToolCallPart;
  result?: ToolResultPart;
}) {
  const { token } = antdTheme.useToken();
  const pending = !result;
  const toolName = call.toolName;
  const args = call.args ?? result?.args;

  const icon =
    toolName === "web_search" ? (
      <GlobalOutlined />
    ) : toolName === "read_pdf" ? (
      <FilePdfOutlined />
    ) : (
      <ToolOutlined />
    );

  const label =
    toolName === "web_search"
      ? "Web search"
      : toolName === "read_pdf"
        ? "Read PDF"
        : toolName;

  const header = (
    <Header size={8} wrap>
      <Icon style={{ color: token.colorPrimary }}>{icon}</Icon>
      <Text strong>{label}</Text>
      <ArgPreview type="secondary">{inlineArgs(args)}</ArgPreview>
      {pending ? (
        <Tag icon={<LoadingOutlined />} color="processing" bordered={false}>
          running
        </Tag>
      ) : null}
    </Header>
  );

  return (
    <Card
      ghost
      size="small"
      items={[
        {
          key: toolName,
          label: header,
          children: (
            <ToolBody toolName={toolName} args={args} result={result?.result} />
          ),
        },
      ]}
    />
  );
}

function ToolBody({
  toolName,
  args,
  result,
}: {
  toolName: string;
  args: unknown;
  result: unknown;
}) {
  if (result === undefined) {
    return <Text type="secondary">Waiting for the result…</Text>;
  }
  const error = toolError(result);
  const body =
    toolName === "web_search" ? (
      <WebSearchBody args={args} result={result} />
    ) : toolName === "read_pdf" ? (
      <ReadPdfBody args={args} result={result} />
    ) : (
      <RawJson value={result} />
    );

  return (
    <div>
      {error && (
        <Alert
          type="warning"
          showIcon
          message={error}
          style={{ marginBottom: 8 }}
        />
      )}
      {body}
    </div>
  );
}

/** Pull a human-readable error string off a tool result, if it carries one. */
function toolError(result: unknown): string | null {
  if (result && typeof result === "object") {
    const e = (result as { error?: unknown }).error;
    if (typeof e === "string" && e.trim()) return e;
  }
  return null;
}

function WebSearchBody({ args, result }: { args: unknown; result: unknown }) {
  const summary = useMemo(() => summarizeWebSearch(args, result), [args, result]);
  return (
    <Body>
      {summary.queries.length > 0 && (
        <Queries>
          <Text type="secondary">Queries</Text>
          <Space size={[6, 6]} wrap>
            {summary.queries.map((q, i) => (
              <Tag key={i} bordered={false} color="blue">
                {q}
              </Tag>
            ))}
          </Space>
        </Queries>
      )}
      {summary.sources.length > 0 ? (
        <Sources>
          {summary.sources.map((s, i) => (
            <li key={i}>
              {s.url ? (
                <Link href={s.url} target="_blank" rel="noopener noreferrer">
                  <LinkOutlined /> {s.title || s.url}
                </Link>
              ) : (
                <Text strong>{s.title}</Text>
              )}
              {s.snippet && (
                <Snippet type="secondary" ellipsis={{ rows: 2 }}>
                  {s.snippet}
                </Snippet>
              )}
            </li>
          ))}
        </Sources>
      ) : (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description="No sources returned"
        />
      )}
      <RawJson value={result} />
    </Body>
  );
}

function ReadPdfBody({ args, result }: { args: unknown; result: unknown }) {
  const summary = useMemo(() => summarizeReadPdf(args, result), [args, result]);
  return (
    <Body>
      {summary.url && (
        <PdfUrl>
          <FilePdfOutlined />{" "}
          <Link href={summary.url} target="_blank" rel="noopener noreferrer">
            {summary.url}
          </Link>
        </PdfUrl>
      )}
      {typeof summary.textLength === "number" && (
        <Text type="secondary">
          Extracted {summary.textLength.toLocaleString()} characters
        </Text>
      )}
      {summary.snippet && (
        <Snippet type="secondary" ellipsis={{ rows: 3 }}>
          {summary.snippet}
        </Snippet>
      )}
      <RawJson value={result} />
    </Body>
  );
}

/** A nested expander for the full raw payload, kept out of the primary view. */
function RawJson({ value }: { value: unknown }) {
  return (
    <Raw
      ghost
      size="small"
      items={[
        {
          key: "raw",
          label: <Text type="secondary">Raw result</Text>,
          children: <Pre>{prettyJson(value)}</Pre>,
        },
      ]}
    />
  );
}
