import createNextIntlPlugin from 'next-intl/plugin'

const withNextIntl = createNextIntlPlugin('./i18n.ts')

/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [{
      source: '/api/:path*',
      destination: `${process.env.API_PROXY_URL ?? 'http://localhost:8000/api'}/:path*`,
    }]
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
