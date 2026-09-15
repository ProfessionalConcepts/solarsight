import { getRequestConfig } from 'next-intl/server'
import { cookies } from 'next/headers'

export const locales = ['en', 'sw'] as const
export type Locale = (typeof locales)[number]
export const defaultLocale: Locale = 'en'

const messageLoaders = {
  en: () => import('../messages/en.json'),
  sw: () => import('../messages/sw.json'),
}

export default getRequestConfig(async ({ requestLocale }) => {
  const requestedLocale = await requestLocale
  const cookieLocale = cookies().get('NEXT_LOCALE')?.value
  const selectedLocale = requestedLocale ?? cookieLocale
  const locale: Locale = locales.includes(selectedLocale as Locale)
    ? (selectedLocale as Locale)
    : defaultLocale

  return {
    locale,
    messages: (await messageLoaders[locale]()).default,
  }
})
