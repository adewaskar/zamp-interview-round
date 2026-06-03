import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Mongoose must run as a real Node module on the server, not be bundled by webpack.
  serverExternalPackages: ["mongoose"],
};

export default nextConfig;
