"use client";

import { Button } from "antd";
import {
  CompassFilled,
  PlusOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import type { SessionListItem } from "@/lib/types/api";
import { APP_NAME } from "@/lib/config";
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
}: {
  sessions: SessionListItem[];
  activeId: string | null;
  loading: boolean;
  creating: boolean;
  onNewChat: () => void;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onManageAgents: () => void;
}) {
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
        <Button block ghost icon={<TeamOutlined />} onClick={onManageAgents}>
          Manage agents
        </Button>
      </Footer>
    </SidebarRoot>
  );
}
