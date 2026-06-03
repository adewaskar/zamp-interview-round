"use client";

import { createGlobalStyle } from "styled-components";

/**
 * Minimal document-level reset and base typography, driven by antd tokens.
 * Anything component-scoped lives in that component's styled definitions.
 */
export const GlobalStyle = createGlobalStyle`
  *,
  *::before,
  *::after {
    box-sizing: border-box;
  }

  html,
  body {
    margin: 0;
    padding: 0;
    height: 100%;
  }

  body {
    font-family: ${({ theme }) => theme.fontFamily};
    font-size: ${({ theme }) => theme.fontSize}px;
    color: ${({ theme }) => theme.colorText};
    background: ${({ theme }) => theme.colorBgLayout};
  }
`;
