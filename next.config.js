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

