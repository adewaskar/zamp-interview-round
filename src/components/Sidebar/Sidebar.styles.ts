import { Button, Typography } from "antd";
import styled from "styled-components";

const { Text } = Typography;

export const SidebarRoot = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  color: ${({ theme }) => theme.colorText};
`;

export const Brand = styled.div`
  display: flex;
  align-items: center;
  gap: 11px;
  padding: 18px 18px 14px;
`;

export const Logo = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  border-radius: 9px;
  background: linear-gradient(
    135deg,
    ${({ theme }) => theme.colorPrimaryHover},
    ${({ theme }) => theme.colorPrimary}
  );
  color: ${({ theme }) => theme.colorText};
  font-size: 17px;
`;

export const BrandText = styled.div`
  display: flex;
  flex-direction: column;
  line-height: 1.2;
`;

export const AppName = styled(Text)`
  color: ${({ theme }) => theme.colorText};
  font-size: 17px;
  font-weight: 700;
  letter-spacing: 0.2px;
`;

export const AppSub = styled(Text)`
  color: ${({ theme }) => theme.colorTextTertiary};
  font-size: 11.5px;
`;

export const NewChatWrap = styled.div`
  padding: 4px 14px 10px;
`;

export const NewChatButton = styled(Button)`
  font-weight: 600;
`;

export const Sessions = styled.div`
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  border-top: 1px solid ${({ theme }) => theme.colorBorderSecondary};
  border-bottom: 1px solid ${({ theme }) => theme.colorBorderSecondary};
`;

export const Footer = styled.div`
  padding: 12px 14px;
`;

export const ThemeToggleRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 4px 2px 10px;
`;

export const ThemeToggleLabel = styled(Text)`
  color: ${({ theme }) => theme.colorTextSecondary};
  font-size: 13px;
`;
