import type { ThemeConfig } from "antd";

/** Brand seed — the single indigo antd derives the whole primary palette from. */
export const BRAND_PRIMARY = "#4f46e5";

/**
 * Custom design tokens for surfaces antd's token system doesn't model (a
 * near-black rail and a dark code surface used inside an otherwise light UI).
 * These are merged into the styled-components theme by `TokenThemeBridge`, so
 * they're readable as `theme.colorSiderBg` alongside antd's `GlobalToken`.
 * Keeping them here means the whole app stays themeable from one file.
 */
export interface CustomTokens {
  /** Near-black background of the left navigation rail. */
  colorSiderBg: string;
  /** Dark surface for code blocks, `pre`, and the assistant avatar. */
  colorCodeBg: string;
  /** Text color on the dark code surface. */
  colorCodeText: string;
}

export const customTokens: CustomTokens = {
  colorSiderBg: "#0f1117",
  colorCodeBg: "#0f1117",
  colorCodeText: "#e6e6e6",
};

/** Single source of truth for the antd theme tokens (light surface). */
export const theme: ThemeConfig = {
  token: {
    colorPrimary: BRAND_PRIMARY,
    borderRadius: 8,
    fontSize: 14,
    // colorBgLayout is intentionally NOT pinned: letting the active algorithm
    // (default/dark) derive it is what lets the light/dark toggle flip the
    // whole layout surface. The antd light default (#f5f5f5) ≈ the old #f6f7f9.
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  },
  components: {
    Layout: {
      siderBg: customTokens.colorSiderBg,
    },
  },
};
