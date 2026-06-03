"use client";

import { Button, Spin } from "antd";
import { CompassFilled, TeamOutlined } from "@ant-design/icons";
import type { ChatMessage } from "@/lib/types/parts";
import type { SessionDTO } from "@/lib/types/api";
import { APP_NAME, APP_TAGLINE } from "@/lib/config";
import { MessageList } from "@/components/MessageList";
import { Composer } from "@/components/Composer";
import {
  Window,
  Header,
  HeaderTitle,
  Title_,
  ManageBtn,
  Loading,
  Intro,
  IntroLogo,
  IntroTitle,
  IntroTagline,
  IntroActions,
} from "./ChatWindow.styles";

/**
 * The right-hand chat surface for the selected session: a slim header, the
 * scrollable transcript, and the composer. When no session is selected it shows
 * a friendly intro built from `APP_TAGLINE`.
 */
export function ChatWindow({
  session,
  messages,
  loadingSession,
  streaming,
  awaitingFirstToken,
  onSend,
  onManageAgents,
  onNewChat,
}: {
  session: SessionDTO | null;
  messages: ChatMessage[];
  loadingSession: boolean;
  streaming: boolean;
  awaitingFirstToken: boolean;
  onSend: (text: string) => void;
  onManageAgents: () => void;
  onNewChat: () => void;
}) {
  if (!session) {
    return (
      <Intro>
        <IntroLogo>
          <CompassFilled />
        </IntroLogo>
        <IntroTitle level={3}>Welcome to {APP_NAME}</IntroTitle>
        <IntroTagline type="secondary">{APP_TAGLINE}</IntroTagline>
        <IntroActions>
          <Button type="primary" size="large" onClick={onNewChat}>
            Start a new chat
          </Button>
          <Button
            size="large"
            icon={<TeamOutlined />}
            onClick={onManageAgents}
          >
            Manage sub-agents
          </Button>
        </IntroActions>
      </Intro>
    );
  }

  return (
    <Window>
      <Header>
        <HeaderTitle>
          <Title_ strong ellipsis>
            {session.title || "New chat"}
          </Title_>
        </HeaderTitle>
        <ManageBtn type="text" icon={<TeamOutlined />} onClick={onManageAgents}>
          Agents
        </ManageBtn>
      </Header>

      {loadingSession ? (
        <Loading>
          <Spin />
        </Loading>
      ) : (
        <MessageList
          messages={messages}
          streaming={streaming}
          awaitingFirstToken={awaitingFirstToken}
        />
      )}

      <Composer disabled={streaming} onSend={onSend} />
    </Window>
  );
}
