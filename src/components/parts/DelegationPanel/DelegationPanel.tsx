"use client";

import { Alert, Tag, Typography, theme as antdTheme } from "antd";
import {
  CheckCircleFilled,
  CloseCircleFilled,
  LoadingOutlined,
  PartitionOutlined,
} from "@ant-design/icons";
import type {
  DelegateToolResult,
  DelegationOutcome,
} from "@/lib/types/delegation";
import { Markdown } from "@/components/Markdown";
import { PartsTrace } from "@/components/parts/PartsTrace";
import {
  AgentMeta,
  AgentName,
  Card,
  CardHeader,
  ErrorAlert,
  List,
  Panel,
  PanelHeader,
  PanelIcon,
  PanelTitle,
  Rejected,
  Slug,
  Summary,
  SummaryLabel,
  Task,
  TaskLabel,
  TaskText,
  TraceCollapse,
} from "./DelegationPanel.styles";

const { Text } = Typography;

/**
 * The product's signature surface: a clear panel showing that the main agent
 * handed work to one or more sub-agents.
 *
 * Renders a `DelegateToolResult` and is shape-agnostic about where it came
 * from — the live stream reducer (`useChatStream`) accumulates `agent-*` events
 * into exactly this structure, and a reloaded session already stores it as the
 * delegate tool-result. Both paths render identically here.
 */
export function DelegationPanel({ result }: { result: DelegateToolResult }) {
  const delegations = result?.delegations ?? [];
  const rejected = result?.rejected ?? [];

  if (delegations.length === 0 && rejected.length === 0) {
    return null;
  }

  return (
    <Panel aria-label="Delegation to sub-agents">
      <PanelHeader>
        <PanelIcon>
          <PartitionOutlined />
        </PanelIcon>
        <PanelTitle strong>
          Delegated to {delegations.length}{" "}
          {delegations.length === 1 ? "sub-agent" : "sub-agents"}
        </PanelTitle>
      </PanelHeader>

      <List>
        {delegations.map((d) => (
          <DelegationCard key={d.delegationId} delegation={d} />
        ))}
      </List>

      {rejected.length > 0 && (
        <Rejected>
          {rejected.map((r) => (
            <Alert
              key={r.taskId}
              type="warning"
              showIcon
              banner
              message={
                <Text>
                  Skipped <Text code>{r.agentSlug}</Text>: {r.reason}
                </Text>
              }
            />
          ))}
        </Rejected>
      )}
    </Panel>
  );
}

function statusTag(status: DelegationOutcome["status"], hasSummary: boolean) {
  if (status === "failed") {
    return (
      <Tag icon={<CloseCircleFilled />} color="error" bordered={false}>
        failed
      </Tag>
    );
  }
  // "completed" with no summary yet means it is still streaming.
  if (!hasSummary) {
    return (
      <Tag icon={<LoadingOutlined />} color="processing" bordered={false}>
        working
      </Tag>
    );
  }
  return (
    <Tag icon={<CheckCircleFilled />} color="success" bordered={false}>
      done
    </Tag>
  );
}

function DelegationCard({ delegation }: { delegation: DelegationOutcome }) {
  const { token } = antdTheme.useToken();
  const hasSummary = Boolean(delegation.summary?.trim());
  const hasTrace = (delegation.parts?.length ?? 0) > 0;

  return (
    <Card>
      <CardHeader>
        <AgentMeta>
          <AgentName strong>{delegation.agentName}</AgentName>
          <Slug bordered={false}>{delegation.agentSlug}</Slug>
        </AgentMeta>
        {statusTag(delegation.status, hasSummary)}
      </CardHeader>

      <Task>
        <TaskLabel type="secondary">Task</TaskLabel>
        <TaskText ellipsis={{ rows: 3, expandable: true, symbol: "more" }}>
          {delegation.input}
        </TaskText>
      </Task>

      {hasTrace && (
        <TraceCollapse
          ghost
          size="small"
          items={[
            {
              key: "trace",
              label: (
                <Text type="secondary">
                  Sub-agent trace ({delegation.parts.length}{" "}
                  {delegation.parts.length === 1 ? "step" : "steps"})
                </Text>
              ),
              children: <PartsTrace parts={delegation.parts} />,
            },
          ]}
        />
      )}

      {delegation.error && (
        <ErrorAlert type="error" showIcon message={delegation.error} />
      )}

      {hasSummary && (
        <Summary>
          <SummaryLabel size={6}>
            <CheckCircleFilled style={{ color: token.colorSuccess }} />
            <Text type="secondary">Summary</Text>
          </SummaryLabel>
          <Markdown>{delegation.summary}</Markdown>
        </Summary>
      )}
    </Card>
  );
}
