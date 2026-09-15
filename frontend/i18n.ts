import { getRequestConfig } from 'next-intl/server'
import { cookies } from 'next/headers'
import { fileURLToPath } from 'url'
import path from 'path'

// Manually define the missing modern ES module path variables
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export const locales = ['en', 'sw'] as const
export type Locale = (typeof locales)[number]
export const defaultLocale: Locale = 'en'

const messageLoaders = {
  en: () => import('./messages/en.json'),
  sw: () => import('./messages/sw.json'),
}

export default getRequestConfig(async ({ requestLocale }) => {
  const requestedLocale = await requestLocale
  const cookieLocale = cookies().get('NEXT_LOCALE')?.value
  const selectedLocale = requestedLocale ?? cookieLocale
  
  const locale: Locale = locales.includes(selectedLocale as Locale)
    ? (selectedLocale as Locale)
    : defaultLocale

  const messages = (await messageLoaders[locale]()).default

  return {
    locale,
    messages,
  }
})
