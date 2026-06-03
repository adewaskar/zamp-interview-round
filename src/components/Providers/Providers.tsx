"use client";

import { App, ConfigProvider, theme as antdTheme } from "antd";
import { HighstackAntDProvider } from "@highstack/antd-utils";
import { theme } from "@/lib/theme";
import { ThemeModeProvider, useThemeMode } from "@/lib/theme-mode";
import { StyledComponentsRegistry } from "@/lib/styled/registry";
import { TokenThemeBridge } from "@/lib/styled/TokenThemeBridge";
import { GlobalStyle } from "@/lib/styled/GlobalStyle";

/**
 * Inner client surface whose antd algorithm tracks the current theme mode, so
 * flipping light/dark restyles the whole root surface (and everything bridged
 * into styled-components via TokenThemeBridge) automatically.
 */
function ThemedApp({ children }: { children: React.ReactNode }) {
  const { mode } = useThemeMode();
  return (
    <ConfigProvider
      theme={{
        ...theme,
        algorithm:
          mode === "dark"
            ? antdTheme.darkAlgorithm
            : antdTheme.defaultAlgorithm,
      }}
    >
      <TokenThemeBridge>
        <GlobalStyle />
        <App style={{ height: "100dvh" }}>
          <HighstackAntDProvider>{children}</HighstackAntDProvider>
        </App>
      </TokenThemeBridge>
    </ConfigProvider>
  );
}

/**
 * All client-side context the app depends on, composed once:
 *  - StyledComponentsRegistry — SSR style flushing for styled-components
 *  - ThemeModeProvider        — light/dark mode state (persisted to localStorage)
 *  - ConfigProvider           — antd design tokens, algorithm reactive to mode
 *  - TokenThemeBridge         — exposes those tokens to styled-components
 *  - GlobalStyle              — token-driven document reset
 *  - App                      — context-aware message/modal/notification
 *  - HighstackAntDProvider    — imperative modals & drawers (@highstack/antd-utils)
 */
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <StyledComponentsRegistry>
      <ThemeModeProvider>
        <ThemedApp>{children}</ThemedApp>
      </ThemeModeProvider>
    </StyledComponentsRegistry>
  );
}
