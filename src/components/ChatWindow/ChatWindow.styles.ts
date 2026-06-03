import styled from "styled-components";
import { Button, Typography } from "antd";

const { Title, Text } = Typography;

export const Window = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  background: ${({ theme }) => theme.colorBgLayout};
`;

export const Header = styled.header`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.paddingSM}px;
  height: 56px;
  padding: 0 20px;
  background: ${({ theme }) => theme.colorBgContainer};
  border-bottom: 1px solid ${({ theme }) => theme.colorBorderSecondary};
  flex: 0 0 auto;
`;

export const HeaderTitle = styled.div`
  min-width: 0;
  flex: 1;
`;

export const Title_ = styled(Text)`
  font-size: ${({ theme }) => theme.fontSizeLG}px;
`;

export const ManageBtn = styled(Button)`
  color: ${({ theme }) => theme.colorTextSecondary};
`;

export const Loading = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
`;

export const Intro = styled.div`
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: ${({ theme }) => theme.paddingLG}px;
  background: ${({ theme }) => theme.colorBgLayout};
`;

export const IntroLogo = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 60px;
  height: 60px;
  border-radius: ${({ theme }) => theme.borderRadiusLG}px;
  background: linear-gradient(
    135deg,
    ${({ theme }) => theme.colorPrimaryHover},
    ${({ theme }) => theme.colorPrimary}
  );
  color: ${({ theme }) => theme.colorTextLightSolid};
  font-size: 28px;
  box-shadow: ${({ theme }) => theme.boxShadowTertiary};
  margin-bottom: 18px;
`;

export const IntroTitle = styled(Title)`
  margin: 0 0 6px !important;
`;

export const IntroTagline = styled(Text)`
  font-size: ${({ theme }) => theme.fontSizeLG}px;
  max-width: 440px;
`;

export const IntroActions = styled.div`
  margin-top: 26px;
  display: flex;
  gap: ${({ theme }) => theme.paddingSM}px;
  flex-wrap: wrap;
  justify-content: center;
`;
