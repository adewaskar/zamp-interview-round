"use client";

import { useEffect } from "react";
import { Form, Input, Select, Switch, Typography } from "antd";
import type { FormInstance } from "antd";
import { useForm } from "@highstack/antd-utils";
import type { AgentDTO, CreateAgentBody } from "@/lib/types/api";
import { agentFormSchema, type AgentFormValues } from "@/lib/schemas/agent";
import { SUBAGENT_TOOLS } from "@/lib/tools/catalog";

const { Text } = Typography;

export type { AgentFormValues };

/** Tool ids the form can actually grant (excludes the orchestrator-only `delegate`). */
const FORM_TOOL_IDS = SUBAGENT_TOOLS.map((t) => t.id);

/**
 * Keep only tools the sub-agent form can represent. A stored `agent.tools` is
 * typed as the wider `ToolId[]` (which includes `delegate`); the form value is
 * narrowed to the `SUBAGENT_TOOLS` subset, so filter on populate.
 */
const toFormTools = (tools: AgentDTO["tools"]): AgentFormValues["tools"] =>
  tools.filter((t): t is AgentFormValues["tools"][number] =>
    (FORM_TOOL_IDS as string[]).includes(t),
  );

/**
 * Create / edit form for a sub-agent. Controlled by the parent through an antd
 * `FormInstance`; the parent reads values via `form.validateFields()` on submit.
 * Pre-populates from `agent` when editing.
 */
export function AgentForm({
  form,
  agent,
  onSubmit,
}: {
  form: FormInstance<AgentFormValues>;
  agent?: AgentDTO | null;
  /** Called when the form is submitted via Enter inside a field. */
  onSubmit: () => void;
}) {
  const { rules } = useForm(form, agentFormSchema);

  useEffect(() => {
    if (agent) {
      form.setFieldsValue({
        name: agent.name,
        slug: agent.slug,
        description: agent.description,
        instructions: agent.instructions,
        tools: toFormTools(agent.tools),
        enabled: agent.enabled,
      });
    } else {
      form.resetFields();
      form.setFieldsValue({ enabled: true, tools: [] });
    }
  }, [agent, form]);

  return (
    <Form<AgentFormValues>
      form={form}
      layout="vertical"
      requiredMark="optional"
      initialValues={{ enabled: true, tools: [] }}
      onFinish={onSubmit}
    >
      <Form.Item name="name" label="Name" rules={rules.name}>
        <Input placeholder="e.g. Market Analyst" maxLength={80} />
      </Form.Item>

      <Form.Item
        name="slug"
        label="Slug"
        tooltip="A stable identifier the main agent uses to address this sub-agent."
        rules={rules.slug}
      >
        <Input placeholder="auto-generated from name" maxLength={60} />
      </Form.Item>

      <Form.Item
        name="description"
        label="Description"
        tooltip="A short summary the main agent reads to decide when to delegate here."
        rules={rules.description}
      >
        <Input.TextArea
          placeholder="What this sub-agent is good at — used by the main agent to pick it."
          autoSize={{ minRows: 2, maxRows: 4 }}
          maxLength={400}
          showCount
        />
      </Form.Item>

      <Form.Item
        name="instructions"
        label="Instructions"
        tooltip="The sub-agent's system prompt — how it should approach its tasks."
        rules={rules.instructions}
      >
        <Input.TextArea
          placeholder="You are a focused research sub-agent. When given a task, …"
          autoSize={{ minRows: 5, maxRows: 12 }}
        />
      </Form.Item>

      <Form.Item name="tools" label="Tools" rules={rules.tools}>
        <Select
          mode="multiple"
          placeholder="Grant tools this sub-agent may use"
          options={SUBAGENT_TOOLS.map((t) => ({
            label: t.label,
            value: t.id,
            title: t.description,
          }))}
          optionRender={(option) => {
            const meta = SUBAGENT_TOOLS.find(
              (t) => t.id === String(option.value),
            );
            return (
              <div>
                <div>{option.label}</div>
                {meta && (
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {meta.description}
                  </Text>
                )}
              </div>
            );
          }}
        />
      </Form.Item>

      <Form.Item
        name="enabled"
        label="Enabled"
        valuePropName="checked"
        tooltip="Disabled sub-agents stay defined but cannot be delegated to."
        rules={rules.enabled}
      >
        <Switch />
      </Form.Item>
    </Form>
  );
}

/** Map validated form values to the create/update request body. */
export function toAgentBody(values: AgentFormValues): CreateAgentBody {
  const slug = values.slug?.trim();
  return {
    name: values.name.trim(),
    ...(slug ? { slug } : {}),
    description: values.description.trim(),
    instructions: values.instructions.trim(),
    tools: values.tools ?? [],
    enabled: values.enabled,
  };
}
