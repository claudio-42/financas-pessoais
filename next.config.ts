import type { NextConfig } from "next";

const repository = process.env.GITHUB_REPOSITORY?.split("/")[1];
const pagesBasePath = process.env.GITHUB_PAGES === "true" && repository
  ? `/${repository}`
  : "";

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  basePath: pagesBasePath,
  assetPrefix: pagesBasePath,
  images: { unoptimized: true },
};

export default nextConfig;
