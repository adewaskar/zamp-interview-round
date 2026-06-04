"use client";

import { useState } from "react";
import { App, Button, Form, Input, Modal, Segmented, Switch } from "antd";
import {
  BulbFilled,
  BulbOutlined,
  CompassFilled,
  LockOutlined,
} from "@ant-design/icons";
import { useForm } from "@highstack/antd-utils";
import {
  loginSchema,
  signupSchema,
  type LoginBody,
  type SignupBody,
} from "@/lib/schemas/auth";
import type { UserDTO } from "@/lib/types/api";
import { APP_NAME } from "@/lib/config";
import { auth } from "@/lib/client/auth";
import { useThemeMode } from "@/lib/theme-mode";
import {
  BrandHeader,
  BrandLogo,
  BrandName,
  DemoHint,
  ModeToggleWrap,
  SecurityNote,
  Subtitle,
  TitleBar,
} from "./AuthModal.styles";

type Mode = "login" | "signup";

const DEMO_EMAIL = "demo@scout.app";
const DEMO_PASSWORD = "demodemo";

/**
 * Blocking authentication dialog. It cannot be dismissed (no close, mask click,
 * or Esc) — the user must log in or sign up before the workspace mounts.
 *
 * A single always-mounted antd form switches between modes (the optional name
 * field only shows for sign-up); the zod schema for the active mode drives both
 * the inline `rules` and the submit-time `validateFields()`. The submit button
 * uses `htmlType="submit"` so the form's `onFinish` fires on both click and
 * Enter.
 */
export function AuthModal({ onAuthed }: { onAuthed: (user: UserDTO) => void }) {
  const { message } = App.useApp();
  const { mode: themeMode, toggle: toggleTheme } = useThemeMode();
  const [mode, setMode] = useState<Mode>("login");
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();
  const { rules } = useForm(form, mode === "login" ? loginSchema : signupSchema);

  const switchMode = (next: Mode) => {
    setMode(next);
    form.resetFields();
  };

  const fillDemo = () => {
    form.setFieldsValue({ email: DEMO_EMAIL, password: DEMO_PASSWORD });
  };

  const submit = async () => {
    if (submitting) return;
    let values: Record<string, unknown>;
    try {
      values = await form.validateFields();
    } catch {
      return; // inline validation errors are shown by antd
    }
    setSubmitting(true);
    try {
      const user =
        mode === "login"
          ? await auth.login(values as LoginBody)
          : await auth.signup(values as SignupBody);
      onAuthed(user);
    } catch (err) {
      message.error(
        err instanceof Error
          ? err.message
          : mode === "login"
            ? "Could not log in"
            : "Could not create account",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open
      centered
      width={420}
      mask={false}
      closable={false}
      maskClosable={false}
      keyboard={false}
      footer={null}
      title={
        <TitleBar>
          <BrandHeader>
            <BrandLogo>
              <CompassFilled />
            </BrandLogo>
            <BrandName>{APP_NAME}</BrandName>
          </BrandHeader>
          <Switch
            size="small"
            checked={themeMode === "dark"}
            onChange={toggleTheme}
            checkedChildren={<BulbFilled />}
            unCheckedChildren={<BulbOutlined />}
            aria-label="Toggle dark mode"
          />
        </TitleBar>
      }
    >
      <Subtitle>
        {mode === "login"
          ? "Welcome back. Log in to continue your research."
          : "Create an account to start researching with Scout."}
      </Subtitle>

      <ModeToggleWrap>
        <Segmented<Mode>
          block
          value={mode}
          onChange={switchMode}
          options={[
            { label: "Log in", value: "login" },
            { label: "Sign up", value: "signup" },
          ]}
        />
      </ModeToggleWrap>

      <Form form={form} layout="vertical" requiredMark={false} onFinish={submit}>
        {mode === "signup" && (
          <Form.Item name="name" label="Name" rules={rules.name}>
            <Input
              size="large"
              autoComplete="name"
              placeholder="Your name (optional)"
              aria-label="Name"
            />
          </Form.Item>
        )}
        <Form.Item name="email" label="Email" rules={rules.email}>
          <Input
            size="large"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            aria-label="Email"
          />
        </Form.Item>
        <Form.Item name="password" label="Password" rules={rules.password}>
          <Input.Password
            size="large"
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            placeholder={mode === "login" ? "Your password" : "At least 8 characters"}
            aria-label="Password"
          />
        </Form.Item>
        <Button
          type="primary"
          htmlType="submit"
          size="large"
          block
          loading={submitting}
        >
          {mode === "login" ? "Log in" : "Create account"}
        </Button>

        <SecurityNote>
          <LockOutlined />
          Protected by an encrypted, httpOnly session.
        </SecurityNote>

        {mode === "login" && (
          <DemoHint>
            Just exploring?
            <Button type="link" onClick={fillDemo}>
              Use the demo account
            </Button>
          </DemoHint>
        )}
      </Form>
    </Modal>
  );
}
