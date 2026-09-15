import createNextIntlPlugin from 'next-intl/plugin'

const withNextIntl = createNextIntlPlugin('./i18n/request.ts')

/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    const proxyUrl = process.env.API_PROXY_URL
    if (!proxyUrl) return []

    return [{
      source: '/api/:path*',
      destination: `${proxyUrl.replace(/\/$/, '')}/:path*`,
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
