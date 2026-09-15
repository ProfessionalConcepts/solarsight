import createNextIntlPlugin from 'next-intl/plugin'

const withNextIntl = createNextIntlPlugin()

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Explicitly transpile packages that try to invoke legacy Node globals like __dirname
  serverExternalPackages: ['next-intl', 'ua-parser-js'],
  
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.API_PROXY_URL ?? 'http://localhost:8000/api/'}:path*`,
      }
    ]
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'server.arcgisonline.com',
      },
    ],
  },
}

export default withNextIntl(nextConfig)
