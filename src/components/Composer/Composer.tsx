"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { SendOutlined } from "@ant-design/icons";
import type { AgentDTO } from "@/lib/types/api";
import { api } from "@/lib/client/api";
import {
  Bar,
  Inner,
  Textarea,
  Option,
  OptName,
  OptSlug,
  Send,
  Hint,
} from "./Composer.styles";

/**
 * Message composer. Enter sends, Shift+Enter inserts a newline. Typing `@`
 * opens a dropdown of the user's enabled sub-agents; picking one inserts
 * `@slug`, which the backend expands into an explicit `<agent>slug</agent>`
 * delegation directive. The whole control is disabled while a turn streams.
 */
export function Composer({
  disabled,
  onSend,
}: {
  disabled: boolean;
  onSend: (text: string) => void;
}) {
  const [value, setValue] = useState("");
  const [agents, setAgents] = useState<AgentDTO[]>([]);
  // Tracks whether the @-mention dropdown is currently open, so Enter selects
  // an option instead of sending the message.
  const mentioning = useRef(false);

  const canSend = value.trim().length > 0 && !disabled;

  const loadAgents = useCallback(async () => {
    try {
      const list = await api.listAgents();
      setAgents(list.filter((a) => a.enabled));
    } catch {
      // A failed roster fetch just means no @-autocomplete; not worth surfacing.
    }
  }, []);

  useEffect(() => {
    void loadAgents();
  }, [loadAgents]);

  const submit = () => {
    const text = value.trim();
    if (!text || disabled) return;
    onSend(text);
    setValue("");
  };

  const options = agents.map((a) => ({
    value: a.slug,
    key: a.id,
    label: (
      <Option>
        <OptName>{a.name}</OptName>
        <OptSlug>@{a.slug}</OptSlug>
      </Option>
    ),
  }));

  return (
    <Bar>
      <Inner>
        <Textarea
          value={value}
          onChange={setValue}
          options={options}
          prefix="@"
          placement="top"
          autoSize={{ minRows: 1, maxRows: 6 }}
          disabled={disabled}
          placeholder="Ask anything — Scout will research and delegate as needed.  (type @ to call a sub-agent)"
          aria-label="Message Scout"
          notFoundContent={agents.length ? undefined : "No sub-agents yet"}
          filterOption={(input, option) => {
            const q = input.toLowerCase();
            const slug = String(option?.value ?? "").toLowerCase();
            const name =
              agents.find((a) => a.slug === option?.value)?.name.toLowerCase() ?? "";
            return slug.includes(q) || name.includes(q);
          }}
          onFocus={() => void loadAgents()}
          onSearch={() => {
            mentioning.current = true;
          }}
          onSelect={() => {
            mentioning.current = false;
          }}
          onBlur={() => {
            mentioning.current = false;
          }}
          onKeyDown={(e) => {
            // A space or escape ends the in-progress mention.
            if (e.key === "Escape" || e.key === " ") mentioning.current = false;
            if (e.key === "Enter" && !e.shiftKey) {
              if (mentioning.current) return; // let the dropdown select an option
              e.preventDefault();
              submit();
            }
          }}
        />
        <Send
          type="primary"
          icon={<SendOutlined />}
          onClick={submit}
          disabled={!canSend}
          aria-label="Send message"
        />
      </Inner>
      <Hint>
        Enter to send · Shift + Enter for a new line · @ to call a sub-agent
      </Hint>
    </Bar>
  );
}
