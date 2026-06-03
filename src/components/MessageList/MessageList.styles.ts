import styled from "styled-components";

export const Scroll = styled.div`
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: ${({ theme }) => theme.paddingLG}px 0;
`;

export const Thread = styled.div`
  max-width: 820px;
  margin: 0 auto;
  padding: 0 ${({ theme }) => theme.paddingLG}px;
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

export const Empty_ = styled.div`
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
`;

export const Thinking = styled.div`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.paddingXS}px;
  padding: ${({ theme }) => theme.paddingXS}px ${({ theme }) => theme.paddingSM}px;
  background: ${({ theme }) => theme.colorBgContainer};
  border: 1px solid ${({ theme }) => theme.colorBorderSecondary};
  border-radius: ${({ theme }) => theme.borderRadiusLG}px;
`;
