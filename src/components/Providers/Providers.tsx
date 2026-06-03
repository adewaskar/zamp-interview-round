"use client";

import { App, ConfigProvider } from "antd";
import { HighstackAntDProvider } from "@highstack/antd-utils";
import { theme } from "@/lib/theme";
import { StyledComponentsRegistry } from "@/lib/styled/registry";
import { TokenThemeBridge } from "@/lib/styled/TokenThemeBridge";
import { GlobalStyle } from "@/lib/styled/GlobalStyle";

/**
 * All client-side context the app depends on, composed once:
 *  - StyledComponentsRegistry — SSR style flushing for styled-components
 *  - ConfigProvider           — antd design tokens (light surface)
 *  - TokenThemeBridge         — exposes those tokens to styled-components
 *  - GlobalStyle              — token-driven document reset
 *  - App                      — context-aware message/modal/notification
 *  - HighstackAntDProvider    — imperative modals & drawers (@highstack/antd-utils)
 */
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <StyledComponentsRegistry>
      <ConfigProvider theme={theme}>
        <TokenThemeBridge>
          <GlobalStyle />
          <App style={{ height: "100dvh" }}>
            <HighstackAntDProvider>{children}</HighstackAntDProvider>
          </App>
        </TokenThemeBridge>
      </ConfigProvider>
    </StyledComponentsRegistry>
  );
}
