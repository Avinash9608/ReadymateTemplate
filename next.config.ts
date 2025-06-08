import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
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
  },
};

export default nextConfig;
