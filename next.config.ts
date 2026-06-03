import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Mongoose must run as a real Node module on the server, not be bundled by webpack.
  serverExternalPackages: ["mongoose"],
  // Enable the SWC transform for styled-components (stable class names for SSR
  // hydration, component display names, and dead-code elimination).
  compiler: { styledComponents: true },
};

export default nextConfig;
