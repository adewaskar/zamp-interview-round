import styled from "styled-components";
import { Collapse, Space, Typography } from "antd";

const { Paragraph, Text } = Typography;

const MONO = "ui-monospace, SFMono-Regular, Menlo, monospace";

/** Outer collapsible card wrapping a single tool step. */
export const Card = styled(Collapse)`
  background: ${({ theme }) => theme.colorBgContainer};
  border: ${({ theme }) => theme.lineWidth}px solid
    ${({ theme }) => theme.colorBorderSecondary};
  border-radius: ${({ theme }) => theme.borderRadiusLG}px;
  margin: ${({ theme }) => theme.marginXS}px 0;

  & .ant-collapse-header {
    align-items: center !important;
    padding: ${({ theme }) => theme.paddingXS}px
      ${({ theme }) => theme.paddingSM}px !important;
  }
  & .ant-collapse-content-box {
    padding: ${({ theme }) => theme.paddingXXS}px
      ${({ theme }) => theme.paddingSM}px
      ${({ theme }) => theme.paddingSM}px !important;
  }
`;

export const Header = styled(Space)`
  flex: 1;
  min-width: 0;
`;

export const Icon = styled.span`
  display: inline-flex;
  font-size: 15px;
`;

export const ArgPreview = styled(Text)`
  font-size: ${({ theme }) => theme.fontSizeSM}px;
  max-width: 360px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const Body = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

export const Queries = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

export const Sources = styled.ol`
  margin: 0;
  padding-left: 20px;
  display: flex;
  flex-direction: column;
  gap: 10px;

  & li {
    line-height: 1.4;
  }
`;

export const Snippet = styled(Paragraph)`
  margin: ${({ theme }) => theme.marginXXS}px 0 0 !important;
  font-size: 12.5px;
`;

export const PdfUrl = styled(Paragraph)`
  margin-bottom: ${({ theme }) => theme.marginXXS}px !important;
  word-break: break-all;
`;

/** Inner collapsible for the raw payload, kept flush with no extra chrome. */
export const Raw = styled(Collapse)`
  margin-top: 2px;

  & .ant-collapse-header {
    padding: ${({ theme }) => theme.paddingXXS}px 0 !important;
  }
  & .ant-collapse-content-box {
    padding: ${({ theme }) => theme.paddingXXS}px 0 0 !important;
  }
`;

export const Pre = styled.pre`
  margin: 0;
  max-height: 280px;
  overflow: auto;
  background: ${({ theme }) => theme.colorCodeBg};
  color: ${({ theme }) => theme.colorCodeText};
  padding: 10px ${({ theme }) => theme.paddingSM}px;
  border-radius: ${({ theme }) => theme.borderRadius}px;
  font-size: ${({ theme }) => theme.fontSizeSM}px;
  font-family: ${MONO};
`;
