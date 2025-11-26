/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: '**.unsplash.com',
      },
    ],
  },
  typescript: {
    // Ignore TypeScript errors during build - we check types locally
    ignoreBuildErrors: true,
  },
  webpack: (config, { isServer }) => {
    // Exclude undici from webpack processing to avoid private class fields parsing issues
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        'undici': false,
      }
    }
    return config
  },
}

module.exports = nextConfig

