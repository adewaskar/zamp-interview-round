import styled from "styled-components";
import { Alert, Collapse, Space, Tag, Typography } from "antd";

const { Paragraph } = Typography;

const MONO = "ui-monospace, SFMono-Regular, Menlo, monospace";

/** Signature indigo-tinted panel framing a delegation to sub-agents. */
export const Panel = styled.section`
  margin: 10px 0;
  border: ${({ theme }) => theme.lineWidth}px solid
    ${({ theme }) => theme.colorPrimaryBorder};
  border-radius: ${({ theme }) => theme.borderRadiusLG}px;
  background: linear-gradient(
    180deg,
    ${({ theme }) => theme.colorPrimaryBg} 0%,
    ${({ theme }) => theme.colorBgContainer} 100%
  );
  overflow: hidden;
`;

export const PanelHeader = styled.header`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.marginXS}px;
  padding: 10px 14px;
  border-bottom: ${({ theme }) => theme.lineWidth}px solid
    ${({ theme }) => theme.colorPrimaryBorder};
  background: ${({ theme }) => theme.colorPrimaryBg};
`;

export const PanelIcon = styled.span`
  display: inline-flex;
  font-size: 16px;
  color: ${({ theme }) => theme.colorPrimary};
`;

export const PanelTitle = styled(Typography.Text)`
  font-size: 13.5px;
`;

export const List = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: ${({ theme }) => theme.paddingSM}px;
`;

export const Card = styled.article`
  border: ${({ theme }) => theme.lineWidth}px solid
    ${({ theme }) => theme.colorBorderSecondary};
  border-radius: ${({ theme }) => theme.borderRadiusLG}px;
  background: ${({ theme }) => theme.colorBgContainer};
  padding: ${({ theme }) => theme.paddingSM}px 14px;
`;

export const CardHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.marginXS}px;
  flex-wrap: wrap;
`;

export const AgentMeta = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.marginXS}px;
  min-width: 0;
`;

export const AgentName = styled(Typography.Text)`
  font-size: ${({ theme }) => theme.fontSize}px;
`;

export const Slug = styled(Tag)`
  font-family: ${MONO};
  font-size: 11.5px;
  background: ${({ theme }) => theme.colorFillTertiary};
  color: ${({ theme }) => theme.colorTextSecondary};
`;

export const Task = styled.div`
  margin-top: ${({ theme }) => theme.marginXS}px;
  padding: ${({ theme }) => theme.paddingXS}px 10px;
  background: ${({ theme }) => theme.colorFillQuaternary};
  border-left: 3px solid ${({ theme }) => theme.colorPrimaryBorder};
  border-radius: ${({ theme }) => theme.borderRadiusSM}px;
`;

export const TaskLabel = styled(Typography.Text)`
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
`;

export const TaskText = styled(Paragraph)`
  margin: 2px 0 0 !important;
  font-size: ${({ theme }) => theme.fontSize}px;
  white-space: pre-wrap;
`;

/** Nested expander for the sub-agent's own step trace. */
export const TraceCollapse = styled(Collapse)`
  margin-top: ${({ theme }) => theme.marginXS}px;
  border-top: ${({ theme }) => theme.lineWidth}px dashed
    ${({ theme }) => theme.colorBorderSecondary};

  & .ant-collapse-header {
    padding: ${({ theme }) => theme.paddingXS}px 0
      ${({ theme }) => theme.paddingXXS}px !important;
  }
  & .ant-collapse-content-box {
    padding: ${({ theme }) => theme.paddingXXS}px 0 0 !important;
  }
`;

export const ErrorAlert = styled(Alert)`
  margin-top: ${({ theme }) => theme.marginXS}px;
`;

export const Summary = styled.div`
  margin-top: 10px;
  padding-top: 10px;
  border-top: ${({ theme }) => theme.lineWidth}px solid
    ${({ theme }) => theme.colorBorderSecondary};
`;

export const SummaryLabel = styled(Space)`
  margin-bottom: ${({ theme }) => theme.marginXXS}px;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
`;

export const Rejected = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.marginXS}px;
  padding: 0 ${({ theme }) => theme.paddingSM}px
    ${({ theme }) => theme.paddingSM}px;
`;
