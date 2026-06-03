import styled from "styled-components";
import { Avatar, Typography } from "antd";

const { Text } = Typography;

export const Row = styled.div<{ $role: "user" | "assistant" }>`
  display: flex;
  gap: 10px;
  width: 100%;
  justify-content: ${({ $role }) =>
    $role === "user" ? "flex-end" : "flex-start"};
`;

export const UserBubble = styled.div`
  max-width: 78%;
  background: ${({ theme }) => theme.colorPrimary};
  color: ${({ theme }) => theme.colorTextLightSolid};
  padding: 9px ${({ theme }) => theme.paddingSM}px;
  border-radius: ${({ theme }) => theme.borderRadiusLG}px
    ${({ theme }) => theme.borderRadiusLG}px
    ${({ theme }) => theme.borderRadiusSM}px
    ${({ theme }) => theme.borderRadiusLG}px;
  white-space: pre-wrap;
  word-break: break-word;
  line-height: 1.5;
  box-shadow: ${({ theme }) => theme.boxShadowTertiary};
`;

export const StyledAvatar = styled(Avatar)`
  flex: 0 0 auto;
  background: ${({ theme }) => theme.colorCodeBg};
`;

export const AssistantBody = styled.div`
  min-width: 0;
  max-width: 88%;
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.paddingXXS}px;
`;

export const Author = styled(Text)`
  font-size: ${({ theme }) => theme.fontSizeSM}px;
  font-weight: 600;
`;
