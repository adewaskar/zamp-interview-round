import type { ThemeConfig } from "antd";

/** Single source of truth for the antd theme tokens. */
export const theme: ThemeConfig = {
  token: {
    colorPrimary: "#4f46e5",
    borderRadius: 8,
    fontSize: 14,
  },
  components: {
    Layout: {
      siderBg: "#0f1117",
      bodyBg: "#f6f7f9",
    },
  },
};
