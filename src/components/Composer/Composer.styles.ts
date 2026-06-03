import styled from "styled-components";
import { Button, Mentions } from "antd";

export const Bar = styled.div`
  border-top: 1px solid ${({ theme }) => theme.colorBorderSecondary};
  background: ${({ theme }) => theme.colorBgContainer};
  padding: 14px ${({ theme }) => theme.paddingLG}px 10px;
`;

export const Inner = styled.div`
  max-width: 820px;
  margin: 0 auto;
  display: flex;
  align-items: flex-end;
  gap: 10px;
`;

export const Textarea = styled(Mentions)`
  flex: 1;
  border-radius: ${({ theme }) => theme.borderRadiusLG}px !important;

  textarea {
    border-radius: ${({ theme }) => theme.borderRadiusLG}px !important;
    padding: 10px ${({ theme }) => theme.padding}px !important;
    resize: none;
  }
`;

export const Option = styled.span`
  display: flex;
  align-items: baseline;
  gap: ${({ theme }) => theme.paddingXS}px;
`;

export const OptName = styled.span`
  font-weight: 600;
`;

export const OptSlug = styled.span`
  color: ${({ theme }) => theme.colorTextTertiary};
  font-size: ${({ theme }) => theme.fontSizeSM}px;
`;

export const Send = styled(Button)`
  height: 40px;
  width: 40px;
  flex: 0 0 auto;
`;

export const Hint = styled.div`
  max-width: 820px;
  margin: 6px auto 0;
  font-size: 11.5px;
  color: ${({ theme }) => theme.colorTextTertiary};
  text-align: center;
`;
