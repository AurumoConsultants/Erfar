import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  transpilePackages: ['@erfar/shared'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/**',
      },
    ],
  },
}

export default nextConfig
