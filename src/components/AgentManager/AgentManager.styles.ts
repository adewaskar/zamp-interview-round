import styled from "styled-components";

const MONO_FONT = "ui-monospace, SFMono-Regular, Menlo, monospace";

export const Intro = styled.div`
  font-size: 13px;
  margin-bottom: 18px;

  /* antd Paragraph carries its own bottom margin; override it. */
  &.ant-typography {
    margin-bottom: 18px;
  }
`;

export const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  margin-bottom: ${({ theme }) => theme.padding}px;
`;

export const EmptyWrap = styled.div`
  margin-top: 48px;
`;

export const List = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

export const Card = styled.article`
  border: 1px solid ${({ theme }) => theme.colorBorderSecondary};
  border-radius: ${({ theme }) => theme.borderRadiusLG}px;
  padding: 14px 16px;
  background: ${({ theme }) => theme.colorBgContainer};
  transition:
    border-color 0.12s ease,
    box-shadow 0.12s ease;

  &:hover {
    border-color: ${({ theme }) => theme.colorBorder};
    box-shadow: ${({ theme }) => theme.boxShadowTertiary};
  }
`;

export const CardTop = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
`;

export const Identity = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  flex-wrap: wrap;
`;

export const Name = styled.span`
  font-size: 14.5px;
`;

export const Slug = styled.span`
  font-family: ${MONO_FONT};
  font-size: 11.5px;
  background: ${({ theme }) => theme.colorFillTertiary};
  color: ${({ theme }) => theme.colorTextSecondary};
`;

export const Actions = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  flex: 0 0 auto;
`;

export const Description = styled.div`
  margin: 8px 0 10px;
  font-size: 13px;

  &.ant-typography {
    margin: 8px 0 10px;
  }
`;

export const NoTools = styled.span`
  font-size: 12.5px;
  font-style: italic;
`;
