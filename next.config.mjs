/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: {
    // O lint roda separado (`npm run lint`). Não bloqueia o build.
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
