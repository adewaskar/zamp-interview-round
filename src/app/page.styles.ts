import styled from "styled-components";
import { Layout } from "antd";

const { Sider, Content } = Layout;

/** Full-viewport workspace shell. */
export const Shell = styled(Layout)`
  height: 100dvh;
`;

/**
 * Left rail. Its near-black background comes from antd's Layout `siderBg`
 * token (set in the theme); contents are themed dark by a nested ConfigProvider
 * in the page.
 */
export const Rail = styled(Sider)`
  height: 100%;
  position: sticky;
  top: 0;
`;

export const Main = styled(Content)`
  height: 100%;
  min-width: 0;
`;

/**
 * Full-viewport backdrop behind the auth modal: the near-black brand surface
 * lit by soft brand-colored glows. All colors derive from antd tokens (read
 * through the dark bridge), so it tracks the theme.
 */
export const AuthBackdrop = styled.div`
  height: 100dvh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: ${({ theme }) => theme.paddingLG}px;
  background:
    radial-gradient(
      135% 100% at 50% -25%,
      ${({ theme }) => `color-mix(in srgb, ${theme.colorPrimary} 32%, transparent)`} 0%,
      transparent 55%
    ),
    radial-gradient(
      90% 70% at 85% 115%,
      ${({ theme }) => `color-mix(in srgb, ${theme.colorPrimary} 16%, transparent)`} 0%,
      transparent 50%
    ),
    ${({ theme }) => theme.colorSiderBg};
`;
