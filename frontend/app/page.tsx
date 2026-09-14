import Link from 'next/link'
import type { Metadata } from 'next'
import HomeHero from '@/components/HomeHero'
import ScrollReveal from '@/components/ScrollReveal'

export const metadata: Metadata = {
  title: 'SolarSight — Free Solar Feasibility Check for Kenya',
  description:
    'Free solar assessment for Kenyan homes, farms, and SMEs. Share your location and electricity bill to get system size, savings, and payback.',
}

export default function LandingPage() {
  return (
    <div className="space-y-12 pb-12">
      <HomeHero />
      <div className="max-w-3xl mx-auto px-4 space-y-12">

      {/* ── How It Works ── */}
      <ScrollReveal className="-mt-16 relative z-10 sm:-mt-24">
      <section className="bg-surface rounded-3xl p-6 sm:p-8 border border-border shadow-soft space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-textPrimary">How SolarSight Works</h2>
          <p className="text-xs sm:text-sm text-textSecondary mt-1">
            Three simple steps to clarity on your solar investment
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2.5 text-center sm:text-left">
            <div className="w-10 h-10 rounded-2xl bg-teal-50 text-primary font-bold flex items-center justify-center text-base border border-teal-100 mx-auto sm:mx-0">
              1
            </div>
            <h3 className="font-bold text-base text-textPrimary">Drop Your Pin</h3>
            <p className="text-xs text-textSecondary leading-relaxed">
              Use your phone's GPS or search your estate to zoom into your exact building on high-resolution satellite imagery.
            </p>
          </div>

          <div className="space-y-2.5 text-center sm:text-left">
            <div className="w-10 h-10 rounded-2xl bg-teal-50 text-primary font-bold flex items-center justify-center text-base border border-teal-100 mx-auto sm:mx-0">
              2
            </div>
            <h3 className="font-bold text-base text-textPrimary">Tell Us Your Bill</h3>
            <p className="text-xs text-textSecondary leading-relaxed">
              Enter your monthly KPLC power bill, or pick your household appliances. Trace your roof outline if you want exact measurements.
            </p>
          </div>

          <div className="space-y-2.5 text-center sm:text-left">
            <div className="w-10 h-10 rounded-2xl bg-teal-50 text-primary font-bold flex items-center justify-center text-base border border-teal-100 mx-auto sm:mx-0">
              3
            </div>
            <h3 className="font-bold text-base text-textPrimary">Get Your Assessment</h3>
            <p className="text-xs text-textSecondary leading-relaxed">
              Instantly see system size (kWp), estimated monthly savings, battery backup hours, and connect with up to 3 vetted installers.
            </p>
          </div>
        </div>
      </section>
      </ScrollReveal>

      {/* ── Trust Signals ── */}
      <ScrollReveal delay={80}>
      <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-5 bg-surface rounded-2xl border border-border shadow-soft flex items-start gap-3.5">
          <div className="p-2.5 bg-amber-50 rounded-xl text-accent flex-shrink-0">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </div>
          <div>
            <h4 className="font-bold text-sm text-textPrimary">EU PVGIS Satellite Data</h4>
            <p className="text-xs text-textSecondary mt-1 leading-relaxed">
              We query the European Commission's PVGIS irradiance database, factoring in local solar angles, cloud patterns, and rainy season dips.
            </p>
          </div>
        </div>

        <div className="p-5 bg-surface rounded-2xl border border-border shadow-soft flex items-start gap-3.5">
          <div className="p-2.5 bg-teal-50 rounded-xl text-primary flex-shrink-0">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <div>
            <h4 className="font-bold text-sm text-textPrimary">EPRA Licensed Installers</h4>
            <p className="text-xs text-textSecondary mt-1 leading-relaxed">
              We match you only with vetted installers registered with Kenya's Energy and Petroleum Regulatory Authority (EPRA).
            </p>
          </div>
        </div>
      </section>
      </ScrollReveal>

      {/* ── FAQ Section ── */}
      <ScrollReveal delay={160}>
      <section className="space-y-4">
        <div className="text-center mb-4">
          <h2 className="text-2xl font-bold text-textPrimary">Frequently Asked Questions</h2>
          <p className="text-xs text-textSecondary">Real answers about solar in Kenya</p>
        </div>

        <div className="space-y-3">
          <div className="p-4 bg-surface rounded-2xl border border-border shadow-soft">
            <h3 className="font-bold text-sm text-textPrimary">
              Which direction should solar panels face in Kenya?
            </h3>
            <p className="text-xs text-textSecondary mt-1.5 leading-relaxed">
              Because Kenya is just south of the equator, the sun sits slightly to the north for most of the year. Panels should face <strong>NORTH</strong> (azimuth 0°), rather than south like US or European tutorials recommend.
            </p>
          </div>

          <div className="p-4 bg-surface rounded-2xl border border-border shadow-soft">
            <h3 className="font-bold text-sm text-textPrimary">
              Does solar work during KPLC power blackouts?
            </h3>
            <p className="text-xs text-textSecondary mt-1.5 leading-relaxed">
              A standard <strong>grid-tie</strong> system automatically shuts off during blackouts for safety reasons. If you want power during blackouts, choose a <strong>hybrid</strong> system with a lithium battery to keep your lights, fridge, Wi-Fi, and TV running.
            </p>
          </div>

          <div className="p-4 bg-surface rounded-2xl border border-border shadow-soft">
            <h3 className="font-bold text-sm text-textPrimary">
              How long does it take for solar to pay for itself?
            </h3>
            <p className="text-xs text-textSecondary mt-1.5 leading-relaxed">
              For homes and SMEs paying regular KPLC domestic or commercial tariffs, a grid-tie solar setup typically pays for itself in <strong>5 to 8 years</strong>. Adding battery backup extends this to 8–12 years due to battery costs.
            </p>
          </div>
        </div>
      </section>
      </ScrollReveal>

      {/* ── Bottom CTA ── */}
      <ScrollReveal delay={240}>
      <section className="text-center p-8 bg-gradient-to-br from-teal-900 to-slate-900 text-white rounded-3xl shadow-xl space-y-4">
        <h2 className="text-2xl sm:text-3xl font-extrabold">Ready to see your solar numbers?</h2>
        <p className="text-xs sm:text-sm text-slate-300 max-w-md mx-auto">
          It takes less than 2 minutes. No email or phone number required to view your feasibility report.
        </p>
        <div className="pt-2">
          <Link
            href="/assess"
            className="inline-flex items-center gap-2 px-8 py-3.5 bg-accent hover:bg-amber-500 text-slate-950 font-bold rounded-2xl transition-all shadow text-sm"
          >
            Start Free Assessment
          </Link>
        </div>
      </section>
      </ScrollReveal>
      </div>
    </div>
  )
}
