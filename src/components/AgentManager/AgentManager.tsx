"use client";

import { useCallback, useEffect, useState } from "react";
import {
  App,
  Button,
  Empty,
  Form,
  Popconfirm,
  Skeleton,
  Space,
  Switch,
  Tag,
  Tooltip,
  Typography,
} from "antd";
import {
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import { useModal } from "@highstack/antd-utils";
import type { AgentDTO } from "@/lib/types/api";
import { SUBAGENT_TOOLS, type ToolId } from "@/lib/tools/catalog";
import { api } from "@/lib/client/api";
import { AgentForm, toAgentBody, type AgentFormValues } from "@/components/AgentForm";
import {
  Actions,
  Card,
  CardTop,
  Description,
  EmptyWrap,
  Header,
  Identity,
  Intro,
  List,
  Name,
  NoTools,
  Slug,
} from "./AgentManager.styles";

const { Text, Paragraph } = Typography;

const toolLabel = (id: ToolId) =>
  SUBAGENT_TOOLS.find((t) => t.id === id)?.label ?? id;

/**
 * Sub-agent manager content. Rendered as the body of a Drawer that the
 * orchestrator opens via `useDrawer` in `page.tsx`. Lists defined sub-agents
 * and offers create / edit / delete and an inline enable toggle. Editing /
 * creating opens an imperative Modal (via `useModal`) hosting `AgentForm`. The
 * list refreshes after every mutation.
 */
export function AgentManager({
  onAgentsChanged,
}: {
  /** Notifies the parent so other surfaces can react to agent changes. */
  onAgentsChanged?: (agents: AgentDTO[]) => void;
}) {
  const { message } = App.useApp();
  const { openModal, hideModal } = useModal();
  const [agents, setAgents] = useState<AgentDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const refresh = useCallback(
    async (notify = true) => {
      setLoading(true);
      try {
        const list = await api.listAgents();
        setAgents(list);
        if (notify) onAgentsChanged?.(list);
      } catch (err) {
        message.error(
          err instanceof Error ? err.message : "Failed to load sub-agents",
        );
      } finally {
        setLoading(false);
      }
    },
    [message, onAgentsChanged],
  );

  useEffect(() => {
    void refresh(false);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const openEditor = (agent: AgentDTO | null) =>
    openModal(
      <AgentEditor
        agent={agent}
        onCancel={hideModal}
        onSaved={() => {
          hideModal();
          void refresh();
        }}
      />,
      {
        title: agent ? "Edit sub-agent" : "New sub-agent",
        width: 560,
        maskClosable: false,
        footer: () => null,
      },
    );

  const remove = async (agent: AgentDTO) => {
    try {
      await api.deleteAgent(agent.id);
      message.success(`Deleted "${agent.name}"`);
      await refresh();
    } catch (err) {
      message.error(
        err instanceof Error ? err.message : "Failed to delete sub-agent",
      );
    }
  };

  const toggleEnabled = async (agent: AgentDTO, enabled: boolean) => {
    setTogglingId(agent.id);
    // Optimistic flip for snappy UX; reconciled by refresh.
    setAgents((prev) =>
      prev.map((a) => (a.id === agent.id ? { ...a, enabled } : a)),
    );
    try {
      await api.updateAgent(agent.id, { enabled });
      const list = await api.listAgents();
      setAgents(list);
      onAgentsChanged?.(list);
    } catch (err) {
      message.error(
        err instanceof Error ? err.message : "Failed to update sub-agent",
      );
      setAgents((prev) =>
        prev.map((a) => (a.id === agent.id ? { ...a, enabled: !enabled } : a)),
      );
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <>
      <Intro as={Paragraph} type="secondary">
        Sub-agents are focused researchers you define here. The main agent reads
        each one&apos;s description and can <Text strong>delegate</Text> parts of
        a question to any that are enabled, then weaves their findings into its
        answer.
      </Intro>

      <Header>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => openEditor(null)}
        >
          New agent
        </Button>
      </Header>

      {loading && agents.length === 0 ? (
        <Skeleton active paragraph={{ rows: 4 }} />
      ) : agents.length === 0 ? (
        <EmptyWrap as={Empty} description="No sub-agents yet">
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => openEditor(null)}
          >
            Create your first sub-agent
          </Button>
        </EmptyWrap>
      ) : (
        <List>
          {agents.map((agent) => (
            <Card key={agent.id}>
              <CardTop>
                <Identity>
                  <Name as={Text} strong>
                    {agent.name}
                  </Name>
                  <Slug as={Tag} bordered={false}>
                    {agent.slug}
                  </Slug>
                </Identity>
                <Actions>
                  <Tooltip title={agent.enabled ? "Enabled" : "Disabled"}>
                    <Switch
                      size="small"
                      checked={agent.enabled}
                      loading={togglingId === agent.id}
                      onChange={(checked) => toggleEnabled(agent, checked)}
                      aria-label={`Toggle ${agent.name}`}
                    />
                  </Tooltip>
                  <Tooltip title="Edit">
                    <Button
                      type="text"
                      size="small"
                      icon={<EditOutlined />}
                      onClick={() => openEditor(agent)}
                      aria-label={`Edit ${agent.name}`}
                    />
                  </Tooltip>
                  <Popconfirm
                    title="Delete this sub-agent?"
                    okText="Delete"
                    okButtonProps={{ danger: true }}
                    onConfirm={() => remove(agent)}
                  >
                    <Tooltip title="Delete">
                      <Button
                        type="text"
                        size="small"
                        danger
                        icon={<DeleteOutlined />}
                        aria-label={`Delete ${agent.name}`}
                      />
                    </Tooltip>
                  </Popconfirm>
                </Actions>
              </CardTop>

              <Description
                as={Paragraph}
                type="secondary"
                ellipsis={{ rows: 2, expandable: true, symbol: "more" }}
              >
                {agent.description}
              </Description>

              <Space size={[6, 6]} wrap>
                {agent.tools.length > 0 ? (
                  agent.tools.map((t) => (
                    <Tag key={t} color="geekblue" bordered={false}>
                      {toolLabel(t)}
                    </Tag>
                  ))
                ) : (
                  <NoTools as={Text} type="secondary">
                    No tools granted
                  </NoTools>
                )}
              </Space>
            </Card>
          ))}
        </List>
      )}
    </>
  );
}

/**
 * Self-contained editor hosted inside the imperative modal. Owns its own submit
 * + saving state so the modal footer never reads stale closures.
 */
function AgentEditor({
  agent,
  onSaved,
  onCancel,
}: {
  agent: AgentDTO | null;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const { message } = App.useApp();
  const [form] = Form.useForm<AgentFormValues>();
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    let values: AgentFormValues;
    try {
      values = await form.validateFields();
    } catch {
      return; // validation errors are shown inline by antd
    }
    const body = toAgentBody(values);
    setSaving(true);
    try {
      if (agent) {
        await api.updateAgent(agent.id, body);
        message.success("Sub-agent updated");
      } else {
        await api.createAgent(body);
        message.success("Sub-agent created");
      }
      onSaved();
    } catch (err) {
      message.error(
        err instanceof Error ? err.message : "Failed to save sub-agent",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <AgentForm form={form} agent={agent} onSubmit={submit} />
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          gap: 8,
          marginTop: 8,
        }}
      >
        <Button onClick={onCancel}>Cancel</Button>
        <Button type="primary" loading={saving} onClick={submit}>
          {agent ? "Save changes" : "Create"}
        </Button>
      </div>
    </>
  );
}
