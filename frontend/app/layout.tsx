import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages, getLocale } from 'next-intl/server'
import './globals.css'
import LangToggle from '@/components/LangToggle'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'SolarSight — Know your solar potential',
  description:
    'Get a free, personalised solar assessment using satellite data. Find out if solar is right for your home or business in Kenya.',
  keywords: ['solar Kenya', 'solar assessment', 'PVGIS', 'solar panels Kenya', 'solar savings'],
  openGraph: {
    title: 'SolarSight — Know your solar potential',
    description: 'Free solar assessment for Kenya. No signup needed.',
    locale: 'en_KE',
    type: 'website',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0F766E',
}

export const dynamic = 'force-dynamic'

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const locale = await getLocale()
  const messages = await getMessages()

  return (
    <html lang={locale} className={inter.variable}>
      <body className="min-h-screen flex flex-col bg-background">
        <NextIntlClientProvider messages={messages}>
          {/* ── Header ── */}
          <header className="sticky top-0 z-50 border-b border-white/50 bg-white/65 shadow-[0_4px_24px_rgba(8,31,26,0.12)] backdrop-blur-xl">
            <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
              <a
                href="/"
                className="flex items-center gap-2 text-primary font-bold text-lg focus-visible:ring-2 focus-visible:ring-primary rounded"
              >
                {/* Solar icon SVG */}
                <svg
                  aria-hidden="true"
                  width="28"
                  height="28"
                  viewBox="0 0 28 28"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <circle cx="14" cy="14" r="6" fill="#F59E0B" />
                  <path
                    d="M14 2v3M14 23v3M2 14h3M23 14h3M5.5 5.5l2.1 2.1M20.4 20.4l2.1 2.1M5.5 22.5l2.1-2.1M20.4 7.6l2.1-2.1"
                    stroke="#F59E0B"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
                <span>SolarSight</span>
              </a>
              <LangToggle />
            </div>
          </header>

          {/* ── Main ── */}
          <main className="flex-1">{children}</main>

          {/* ── Footer ── */}
          <footer className="border-t border-border bg-surface mt-auto">
            <div className="max-w-3xl mx-auto px-4 py-6 text-center text-sm text-textSecondary">
              <p>
                Sunlight data:{' '}
                <a
                  href="https://re.jrc.ec.europa.eu/pvg_tools/en/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-primary"
                >
                  EU PVGIS
                </a>{' '}
                ·{' '}
                <a
                  href="https://epra.go.ke"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-primary"
                >
                  EPRA
                </a>{' '}
                verified information
              </p>
              <p className="mt-1">© {new Date().getFullYear()} SolarSight</p>
            </div>
          </footer>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
