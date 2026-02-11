/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
  },
  // ✅ Next 14
  serverComponentsExternalPackages: ["pdf-parse"],
};

export default nextConfig;
