import "styled-components";
import type { GlobalToken } from "antd";
import type { CustomTokens } from "@/lib/theme";

declare module "styled-components" {
  /**
   * Bridge antd's design tokens into styled-components' `theme`, so any styled
   * component can read `${({ theme }) => theme.colorPrimary}` with full typing.
   * The shape is antd's complete `GlobalToken` plus our custom design tokens.
   */
  export interface DefaultTheme extends GlobalToken, CustomTokens {}
}
