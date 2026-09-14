'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

export default function HomeHero() {
  const [parallaxOffset, setParallaxOffset] = useState(0)

  useEffect(() => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduceMotion) return

    let frame = 0
    const updatePosition = () => {
      frame = 0
      setParallaxOffset(Math.min(window.scrollY * 0.18, 150))
    }
    const handleScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(updatePosition)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', handleScroll)
      if (frame) window.cancelAnimationFrame(frame)
    }
  }, [])

  return (
    <section className="home-hero relative isolate min-h-[650px] overflow-hidden text-white sm:min-h-[720px]">
      <div
        aria-hidden="true"
        className="home-hero__image absolute inset-0 -top-10 -bottom-10 bg-cover bg-center bg-no-repeat will-change-transform"
        style={{
          backgroundImage: "url('/solar.jpg')",
          transform: `translate3d(0, ${parallaxOffset}px, 0)`,
        }}
      />
      <div aria-hidden="true" className="absolute inset-0 bg-[#12211d]/42" />
      <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-b from-[#10251f]/60 via-[#173b32]/25 to-[#101b1a]/68" />

      <div className="relative mx-auto flex min-h-[650px] max-w-4xl items-center px-5 py-20 sm:min-h-[720px] sm:px-8">
        <div className="max-w-2xl space-y-6">
          <h1 className="max-w-2xl text-4xl font-black leading-[1.05] tracking-tight text-white sm:text-6xl">
            Find out if solar is worth it for your home or business
          </h1>

          <p className="max-w-xl text-base leading-relaxed text-emerald-50/90 sm:text-lg">
            Pin your roof on our satellite map, share your electricity bill, and get instant sizing,
            savings, and payback in plain language, free, with zero signup.
          </p>

          <div className="flex flex-col items-start gap-4 pt-2 sm:flex-row sm:items-center">
            <Link
              href="/assess"
              className="flex min-h-[50px] w-full items-center justify-center gap-2 rounded-2xl bg-amber-400 px-8 py-4 text-base font-extrabold text-[#17251d] shadow-[0_12px_30px_rgba(0,0,0,0.25)] transition-colors hover:bg-amber-300 sm:w-auto"
            >
              <span>Check My Solar Potential</span>
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M14 5l7 7m0 0l-7 7m7-7H3" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
          </div>

          <div className="flex flex-wrap gap-x-5 gap-y-2 pt-2 text-xs text-emerald-50/85">
            <span className="flex items-center gap-1.5"><span className="text-amber-300">✓</span>No credit card or login</span>
            <span className="flex items-center gap-1.5"><span className="text-amber-300">✓</span>Satellite solar data</span>
            <span className="flex items-center gap-1.5"><span className="text-amber-300">✓</span>EPRA-verified installers</span>
          </div>
        </div>
      </div>
    </section>
  )
}
