'use client'

import { useLocale } from 'next-intl'
import { useRouter, usePathname } from 'next/navigation'
import { useTransition } from 'react'

export default function LangToggle() {
  const locale = useLocale()
  const router = useRouter()
  const pathname = usePathname()
  const [isPending, startTransition] = useTransition()

  function switchLocale(nextLocale: string) {
    if (nextLocale === locale) return

    // Set cookie for next-intl
    document.cookie = `NEXT_LOCALE=${nextLocale}; path=/; max-age=31536000; SameSite=Lax`

    startTransition(() => {
      router.push(pathname)
      router.refresh()
    })
  }

  return (
    <div
      role="group"
      aria-label="Language selection"
      className="inline-flex rounded-lg border border-border p-0.5 bg-background text-xs font-semibold"
    >
      <button
        type="button"
        onClick={() => switchLocale('en')}
        disabled={isPending}
        className={`px-2.5 py-1 rounded-md transition-colors ${
          locale === 'en'
            ? 'bg-primary text-white shadow-sm'
            : 'text-textSecondary hover:text-textPrimary'
        }`}
        aria-pressed={locale === 'en'}
      >
        EN
      </button>
      <button
        type="button"
        onClick={() => switchLocale('sw')}
        disabled={isPending}
        className={`px-2.5 py-1 rounded-md transition-colors ${
          locale === 'sw'
            ? 'bg-primary text-white shadow-sm'
            : 'text-textSecondary hover:text-textPrimary'
        }`}
        aria-pressed={locale === 'sw'}
      >
        SW
      </button>
    </div>
  )
}
