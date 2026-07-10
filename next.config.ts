import type { NextConfig } from "next";

const config: NextConfig = {
  typedRoutes: false,
  serverExternalPackages: ["postgres"],
};

export default config;
