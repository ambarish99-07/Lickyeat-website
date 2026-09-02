/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@lickyeat/shared-types", "@lickyeat/pricing"],
  eslint: { ignoreDuringBuilds: true },
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${process.env.API_URL ?? "http://localhost:4100"}/:path*`,
      },
    ];
  },
};

export default nextConfig;
