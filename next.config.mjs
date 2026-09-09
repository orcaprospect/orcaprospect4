/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: {
    // O lint roda separado (`npm run lint`). Não bloqueia o build.
    ignoreDuringBuilds: true,
  },
  experimental: {
    // Driver Postgres/Supabase usado apenas no servidor (API Routes).
    serverComponentsExternalPackages: ["pg"],
  },
};

export default nextConfig;
