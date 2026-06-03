"use client";

import { useState } from "react";
import { Button, Input } from "antd";
import { SendOutlined } from "@ant-design/icons";
import styles from "./Composer.module.css";

/**
 * Message composer. Enter sends, Shift+Enter inserts a newline. The whole
 * control is disabled while a turn is streaming so a user cannot interleave
 * turns. Trims and clears on a successful send.
 */
export function Composer({
  disabled,
  onSend,
}: {
  disabled: boolean;
  onSend: (text: string) => void;
}) {
  const [value, setValue] = useState("");
  const canSend = value.trim().length > 0 && !disabled;

  const submit = () => {
    const text = value.trim();
    if (!text || disabled) return;
    onSend(text);
    setValue("");
  };

  return (
    <div className={styles.bar}>
      <div className={styles.inner}>
        <Input.TextArea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              submit();
            }
          }}
          placeholder="Ask anything — Scout will research and delegate as needed."
          autoSize={{ minRows: 1, maxRows: 6 }}
          disabled={disabled}
          className={styles.textarea}
          aria-label="Message Scout"
        />
        <Button
          type="primary"
          icon={<SendOutlined />}
          onClick={submit}
          disabled={!canSend}
          className={styles.send}
          aria-label="Send message"
        />
      </div>
      <div className={styles.hint}>
        Enter to send · Shift + Enter for a new line
      </div>
    </div>
  );
}
