"use client";

import { Button, Switch } from "antd";
import {
  BulbFilled,
  BulbOutlined,
  CompassFilled,
  LogoutOutlined,
  PlusOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import type { SessionListItem } from "@/lib/types/api";
import { APP_NAME } from "@/lib/config";
import { useThemeMode } from "@/lib/theme-mode";
import { SessionList } from "@/components/SessionList";
import {
  AppName,
  AppSub,
  Brand,
  BrandText,
  Footer,
  Logo,
  NewChatButton,
  NewChatWrap,
  Sessions,
  SidebarRoot,
  ThemeToggleLabel,
  ThemeToggleRow,
  UserEmail,
  UserRow,
} from "./Sidebar.styles";

/**
 * Left navigation rail: brand, "New chat", the scrollable session list, and a
 * "Manage agents" entry point at the bottom.
 */
export function Sidebar({
  sessions,
  activeId,
  loading,
  creating,
  onNewChat,
  onSelect,
  onDelete,
  onManageAgents,
  user,
  onLogout,
}: {
  sessions: SessionListItem[];
  activeId: string | null;
  loading: boolean;
  creating: boolean;
  onNewChat: () => void;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onManageAgents: () => void;
  user?: { email: string };
  onLogout?: () => void;
}) {
  const { mode, toggle } = useThemeMode();

  return (
    <SidebarRoot>
      <Brand>
        <Logo>
          <CompassFilled />
        </Logo>
        <BrandText>
          <AppName>{APP_NAME}</AppName>
          <AppSub>Research assistant</AppSub>
        </BrandText>
      </Brand>

      <NewChatWrap>
        <NewChatButton
          type="primary"
          block
          icon={<PlusOutlined />}
          onClick={onNewChat}
          loading={creating}
        >
          New chat
        </NewChatButton>
      </NewChatWrap>

      <Sessions>
        <SessionList
          sessions={sessions}
          activeId={activeId}
          loading={loading}
          onSelect={onSelect}
          onDelete={onDelete}
        />
      </Sessions>

      <Footer>
        <ThemeToggleRow>
          <ThemeToggleLabel>Dark mode</ThemeToggleLabel>
          <Switch
            size="small"
            checked={mode === "dark"}
            onChange={toggle}
            checkedChildren={<BulbFilled />}
            unCheckedChildren={<BulbOutlined />}
            aria-label="Toggle dark mode"
          />
        </ThemeToggleRow>
        <Button block ghost icon={<TeamOutlined />} onClick={onManageAgents}>
          Manage agents
        </Button>

        {user && (
          <UserRow>
            <UserEmail ellipsis title={user.email}>
              {user.email}
            </UserEmail>
            <Button
              type="text"
              icon={<LogoutOutlined />}
              onClick={onLogout}
              aria-label="Log out"
            />
          </UserRow>
        )}
      </Footer>
    </SidebarRoot>
  );
}
