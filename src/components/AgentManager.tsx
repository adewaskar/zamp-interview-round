"use client";

import { useCallback, useEffect, useState } from "react";
import {
  App,
  Button,
  Drawer,
  Empty,
  Form,
  Modal,
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
  TeamOutlined,
} from "@ant-design/icons";
import type { AgentDTO } from "@/lib/types/api";
import { SUBAGENT_TOOLS, type ToolId } from "@/lib/tools/catalog";
import { api } from "@/lib/client/api";
import { AgentForm, toAgentBody, type AgentFormValues } from "./AgentForm";
import styles from "./AgentManager.module.css";

const { Text, Paragraph, Title } = Typography;

const toolLabel = (id: ToolId) =>
  SUBAGENT_TOOLS.find((t) => t.id === id)?.label ?? id;

/**
 * Sub-agent manager, presented as a right-hand Drawer over the workspace. Lists
 * defined sub-agents and offers create / edit / delete and an inline enable
 * toggle. Editing/creating opens a nested Modal hosting `AgentForm`. The list
 * refreshes after every mutation.
 */
export function AgentManager({
  open,
  onClose,
  onAgentsChanged,
}: {
  open: boolean;
  onClose: () => void;
  /** Notifies the parent so other surfaces can react to agent changes. */
  onAgentsChanged?: (agents: AgentDTO[]) => void;
}) {
  const { message } = App.useApp();
  const [agents, setAgents] = useState<AgentDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<AgentDTO | null>(null);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm<AgentFormValues>();

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
    if (open) void refresh(false);
  }, [open, refresh]);

  const openCreate = () => {
    setEditing(null);
    setEditorOpen(true);
  };

  const openEdit = (agent: AgentDTO) => {
    setEditing(agent);
    setEditorOpen(true);
  };

  const closeEditor = () => {
    setEditorOpen(false);
    setEditing(null);
    form.resetFields();
  };

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
      if (editing) {
        await api.updateAgent(editing.id, body);
        message.success("Sub-agent updated");
      } else {
        await api.createAgent(body);
        message.success("Sub-agent created");
      }
      closeEditor();
      await refresh();
    } catch (err) {
      message.error(
        err instanceof Error ? err.message : "Failed to save sub-agent",
      );
    } finally {
      setSaving(false);
    }
  };

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
    <Drawer
      title={
        <Space>
          <TeamOutlined />
          <span>Sub-agents</span>
        </Space>
      }
      width={520}
      open={open}
      onClose={onClose}
      destroyOnHidden
      extra={
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
          New agent
        </Button>
      }
    >
      <Paragraph type="secondary" className={styles.intro}>
        Sub-agents are focused researchers you define here. The main agent reads
        each one&apos;s description and can <Text strong>delegate</Text> parts of
        a question to any that are enabled, then weaves their findings into its
        answer.
      </Paragraph>

      {loading && agents.length === 0 ? (
        <Skeleton active paragraph={{ rows: 4 }} />
      ) : agents.length === 0 ? (
        <Empty
          className={styles.empty}
          description="No sub-agents yet"
        >
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
            Create your first sub-agent
          </Button>
        </Empty>
      ) : (
        <div className={styles.list}>
          {agents.map((agent) => (
            <article key={agent.id} className={styles.card}>
              <div className={styles.cardTop}>
                <div className={styles.identity}>
                  <Text strong className={styles.name}>
                    {agent.name}
                  </Text>
                  <Tag className={styles.slug} bordered={false}>
                    {agent.slug}
                  </Tag>
                </div>
                <div className={styles.actions}>
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
                      onClick={() => openEdit(agent)}
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
                </div>
              </div>

              <Paragraph
                type="secondary"
                className={styles.description}
                ellipsis={{ rows: 2, expandable: true, symbol: "more" }}
              >
                {agent.description}
              </Paragraph>

              <Space size={[6, 6]} wrap>
                {agent.tools.length > 0 ? (
                  agent.tools.map((t) => (
                    <Tag key={t} color="geekblue" bordered={false}>
                      {toolLabel(t)}
                    </Tag>
                  ))
                ) : (
                  <Text type="secondary" className={styles.noTools}>
                    No tools granted
                  </Text>
                )}
              </Space>
            </article>
          ))}
        </div>
      )}

      <Modal
        title={
          <Title level={5} style={{ margin: 0 }}>
            {editing ? "Edit sub-agent" : "New sub-agent"}
          </Title>
        }
        open={editorOpen}
        onCancel={closeEditor}
        onOk={submit}
        okText={editing ? "Save changes" : "Create"}
        confirmLoading={saving}
        destroyOnHidden
        width={560}
        maskClosable={false}
      >
        <AgentForm form={form} agent={editing} onSubmit={submit} />
      </Modal>
    </Drawer>
  );
}
