/** @type {import('next').NextConfig} */
const nextConfig = {
  // Setiap paket bersama mengekspor TypeScript mentah (./src/index.ts), jadi
  // semuanya harus di-transpile Next.js - bukan hanya @repo/ui.
  transpilePackages: ['@repo/ui', '@repo/data'],
  reactStrictMode: true,
};

export default nextConfig;
