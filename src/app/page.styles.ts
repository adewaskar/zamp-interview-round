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
