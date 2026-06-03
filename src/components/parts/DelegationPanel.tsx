"use client";

import {
  Alert,
  Collapse,
  Space,
  Tag,
  Typography,
  theme as antdTheme,
} from "antd";
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
import { Markdown } from "../Markdown";
import { PartsTrace } from "./PartsTrace";
import styles from "./DelegationPanel.module.css";

const { Text, Paragraph } = Typography;

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
  const { token } = antdTheme.useToken();
  const delegations = result?.delegations ?? [];
  const rejected = result?.rejected ?? [];

  if (delegations.length === 0 && rejected.length === 0) {
    return null;
  }

  return (
    <section
      className={styles.panel}
      style={{ borderColor: token.colorPrimaryBorder }}
      aria-label="Delegation to sub-agents"
    >
      <header className={styles.panelHeader}>
        <span className={styles.panelIcon} style={{ color: token.colorPrimary }}>
          <PartitionOutlined />
        </span>
        <Text strong className={styles.panelTitle}>
          Delegated to {delegations.length}{" "}
          {delegations.length === 1 ? "sub-agent" : "sub-agents"}
        </Text>
      </header>

      <div className={styles.list}>
        {delegations.map((d) => (
          <DelegationCard key={d.delegationId} delegation={d} />
        ))}
      </div>

      {rejected.length > 0 && (
        <div className={styles.rejected}>
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
        </div>
      )}
    </section>
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
  const hasSummary = Boolean(delegation.summary?.trim());
  const hasTrace = (delegation.parts?.length ?? 0) > 0;

  return (
    <article className={styles.card}>
      <div className={styles.cardHeader}>
        <div className={styles.agentMeta}>
          <Text strong className={styles.agentName}>
            {delegation.agentName}
          </Text>
          <Tag bordered={false} className={styles.slug}>
            {delegation.agentSlug}
          </Tag>
        </div>
        {statusTag(delegation.status, hasSummary)}
      </div>

      <div className={styles.task}>
        <Text type="secondary" className={styles.taskLabel}>
          Task
        </Text>
        <Paragraph className={styles.taskText} ellipsis={{ rows: 3, expandable: true, symbol: "more" }}>
          {delegation.input}
        </Paragraph>
      </div>

      {hasTrace && (
        <Collapse
          ghost
          size="small"
          className={styles.traceCollapse}
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
        <Alert
          type="error"
          showIcon
          className={styles.error}
          message={delegation.error}
        />
      )}

      {hasSummary && (
        <div className={styles.summary}>
          <Space size={6} className={styles.summaryLabel}>
            <CheckCircleFilled style={{ color: "#52c41a" }} />
            <Text type="secondary">Summary</Text>
          </Space>
          <Markdown>{delegation.summary}</Markdown>
        </div>
      )}
    </article>
  );
}
