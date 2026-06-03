"use client";

import { theme as antdTheme } from "antd";
import { ThemeProvider } from "styled-components";
import { customTokens } from "@/lib/theme";

/**
 * Feeds antd's *resolved* design tokens (from the nearest `ConfigProvider`)
 * into styled-components' `ThemeProvider`. Every styled component then reads
 * theme via antd tokens — `theme.colorPrimary`, `theme.colorBorderSecondary`, …
 *
 * Because it reads the nearest ConfigProvider, placing a second bridge inside a
 * dark `ConfigProvider({ algorithm: darkAlgorithm })` makes the *same* styled
 * components resolve dark tokens — that's how the sider themes itself.
 */
export function TokenThemeBridge({ children }: { children: React.ReactNode }) {
  const { token } = antdTheme.useToken();
  return (
    <ThemeProvider theme={{ ...token, ...customTokens }}>
      {children}
    </ThemeProvider>
  );
}
