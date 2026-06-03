import { Typography } from "antd";
import styled from "styled-components";

const { Text } = Typography;

export const List = styled.ul`
  list-style: none;
  margin: 0;
  padding: 4px 8px;
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

export const DeleteButton = styled.button`
  flex: 0 0 auto;
  border: none;
  background: transparent;
  color: ${({ theme }) => theme.colorTextTertiary};
  cursor: pointer;
  padding: 4px;
  border-radius: 6px;
  opacity: 0;
  transition: opacity 0.12s ease, color 0.12s ease, background 0.12s ease;

  &:hover {
    color: ${({ theme }) => theme.colorError};
    background: ${({ theme }) => theme.colorErrorBg};
  }
`;

export const Row = styled.div<{ $active?: boolean }>`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 10px;
  border-radius: 8px;
  cursor: pointer;
  color: ${({ $active, theme }) =>
    $active ? theme.colorText : theme.colorTextSecondary};
  background: ${({ $active, theme }) =>
    $active ? theme.controlItemBgActive : "transparent"};
  transition: background 0.12s ease, color 0.12s ease;

  &:hover {
    background: ${({ $active, theme }) =>
      $active ? theme.controlItemBgActive : theme.controlItemBgHover};
    color: ${({ theme }) => theme.colorText};
  }

  &:hover ${DeleteButton} {
    opacity: 1;
  }
`;

export const RowIcon = styled.span`
  flex: 0 0 auto;
  font-size: 14px;
  opacity: 0.8;
`;

export const RowText = styled.div`
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  line-height: 1.25;
`;

export const Title = styled.span`
  font-size: 13.5px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

export const Time = styled.span`
  font-size: 11px;
  color: ${({ theme }) => theme.colorTextTertiary};
`;

export const Center = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px 12px;
`;

export const Empty = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px 12px;
`;

export const EmptyText = styled(Text)`
  color: ${({ theme }) => theme.colorTextTertiary};
  font-size: 13px;
`;
