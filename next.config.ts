import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    // ignoreBuildErrors: true, // Removed to enforce TypeScript error checking
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        hostname: 'www.ironplane.com',
      },
      {
        hostname: 'encrypted-tbn0.gstatic.com',
      },
    ],
    domains: ['res.cloudinary.com'],
  },
};

export default nextConfig;
