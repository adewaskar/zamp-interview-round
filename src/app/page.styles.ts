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
 * Full-viewport backdrop behind the auth modal: the brand surface lit by soft
 * brand-colored glows. All colors derive from antd tokens (read through the
 * theme bridge), so it tracks light/dark automatically. A faint SVG grid
 * (`AuthGrid`) sits on top of this for texture.
 */
export const AuthBackdrop = styled.div`
  position: relative;
  overflow: hidden;
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
    ${({ theme }) => theme.colorBgLayout};
`;

/**
 * Decorative full-bleed grid drawn behind the auth modal. Stroke color is a
 * low-alpha mix of the foreground token so it reads in both themes, and a
 * radial mask fades the grid out toward the center so it never competes with
 * the modal. Purely ornamental — hidden from assistive tech, no pointer events.
 */
export const AuthGrid = styled.svg`
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  color: ${({ theme }) =>
    `color-mix(in srgb, ${theme.colorBorder} 70%, transparent)`};
  -webkit-mask-image: radial-gradient(
    120% 95% at 50% 42%,
    transparent 0%,
    transparent 35%,
    #000 78%
  );
  mask-image: radial-gradient(
    120% 95% at 50% 42%,
    transparent 0%,
    transparent 35%,
    #000 78%
  );
`;
