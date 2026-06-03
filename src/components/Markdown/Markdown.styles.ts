import styled from "styled-components";

/**
 * Wraps GitHub-flavored markdown output. Owns its own typography, code, and
 * table styling via antd design tokens (this used to live in the global
 * `.markdown-body` rules in globals.css).
 */
export const MarkdownBody = styled.div`
  line-height: 1.6;
  word-break: break-word;

  > :first-child {
    margin-top: 0;
  }

  > :last-child {
    margin-bottom: 0;
  }

  pre {
    background: ${({ theme }) => theme.colorCodeBg};
    color: ${({ theme }) => theme.colorCodeText};
    padding: ${({ theme }) => theme.paddingSM}px 14px;
    border-radius: ${({ theme }) => theme.borderRadius}px;
    overflow-x: auto;
    font-size: 13px;
  }

  code {
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  }

  :not(pre) > code {
    background: ${({ theme }) => theme.colorFillTertiary};
    padding: 1px 5px;
    border-radius: ${({ theme }) => theme.borderRadiusSM}px;
    font-size: 0.9em;
  }

  table {
    border-collapse: collapse;
    width: 100%;
    margin: ${({ theme }) => theme.paddingXS}px 0;
  }

  th,
  td {
    border: 1px solid ${({ theme }) => theme.colorBorderSecondary};
    padding: 6px 10px;
    text-align: left;
  }
`;
