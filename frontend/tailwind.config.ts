import type { Config } from 'tailwindcss'
import forms from '@tailwindcss/forms'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#0F766E',
        accent: '#F59E0B',
        verdict: {
          yes: '#16A34A',
          explore: '#F59E0B',
          caution: '#DC2626',
        },
        background: '#F8FAFC',
        surface: '#FFFFFF',
        textPrimary: '#0F172A',
        textSecondary: '#64748B',
        border: '#E2E8F0',
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
      },
      maxWidth: {
        wizard: '640px',
      },
      boxShadow: {
        card: '0 1px 4px 0 rgba(15, 23, 42, 0.08)',
      },
    },
  },
  plugins: [forms],
}

export default config
