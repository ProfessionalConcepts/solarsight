'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  adminGetInstallers,
  adminGetLeads,
  getInstallerProfile,
  updateInstallerProfile,
} from '@/lib/api'
import type {
  AdminInstaller,
  AdminLead,
  InstallerProductItem,
  InstallerWorkflowStep,
} from '@/lib/types'

export default function InstallerDashboardPage() {
  const [installers, setInstallers] = useState<AdminInstaller[]>([])
  const [selectedInstallerId, setSelectedInstallerId] = useState<number>(1)
  const [installer, setInstaller] = useState<AdminInstaller | null>(null)
  const [leads, setLeads] = useState<AdminLead[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'profile' | 'products' | 'workflow' | 'leads'>('profile')

  // Product modal
  const [showProductModal, setShowProductModal] = useState(false)
  const [newProduct, setNewProduct] = useState<InstallerProductItem>({
    id: '',
    category: 'panel',
    brand: '',
    model: '',
    specs: '',
    warranty_years: 25,
    in_stock: true,
  })

  // Load initial installer list and leads
  useEffect(() => {
    async function init() {
      try {
        setLoading(true)
        const installersRes = await adminGetInstallers('demo-token')
        const installerList = installersRes.installers || []
        setInstallers(installerList)

        if (installerList.length > 0) {
          const first = installerList[0]
          setSelectedInstallerId(first.id)
          const profile = await getInstallerProfile(first.id)
          setInstaller(profile)
        }

        const leadsRes = await adminGetLeads('demo-token')
        setLeads(leadsRes.leads || [])
      } catch (err) {
        console.error('Failed to load installer portal data:', err)
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [])

  // Switch selected installer
  async function handleSelectInstaller(id: number) {
    setSelectedInstallerId(id)
    try {
      setLoading(true)
      const profile = await getInstallerProfile(id)
      setInstaller(profile)
    } catch (err) {
      console.error('Failed to load installer profile:', err)
    } finally {
      setLoading(false)
    }
  }

  // Save changes to profile
  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault()
    if (!installer) return

    try {
      setSaving(true)
      setSuccessMessage(null)
      const res = await updateInstallerProfile(installer.id, installer)
      setInstaller(res.installer)
      setSuccessMessage('Company profile & equipment catalog updated successfully!')
      setTimeout(() => setSuccessMessage(null), 4000)
    } catch (err: any) {
      alert(`Save failed: ${err.message}`)
    } finally {
      setSaving(false)
    }
  }

  // Add new product
  function handleAddProduct(e: React.FormEvent) {
    e.preventDefault()
    if (!installer || !newProduct.brand || !newProduct.model) return

    const productToAdd: InstallerProductItem = {
      ...newProduct,
      id: `prod-${Date.now()}`,
    }

    const updatedProducts = [productToAdd, ...(installer.products || [])]
    setInstaller({
      ...installer,
      products: updatedProducts,
    })

    setShowProductModal(false)
    setNewProduct({
      id: '',
      category: 'panel',
      brand: '',
      model: '',
      specs: '',
      warranty_years: 25,
      in_stock: true,
    })
  }

  // Toggle in stock
  function handleToggleStock(productId: string) {
    if (!installer || !installer.products) return
    const updated = installer.products.map((p) =>
      p.id === productId ? { ...p, in_stock: !p.in_stock } : p
    )
    setInstaller({ ...installer, products: updated })
  }

  // Delete product
  function handleDeleteProduct(productId: string) {
    if (!installer || !installer.products) return
    const updated = installer.products.filter((p) => p.id !== productId)
    setInstaller({ ...installer, products: updated })
  }

  if (loading && !installer) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm font-semibold text-textPrimary">Loading Solar Installer Portal...</p>
      </div>
    )
  }

  const installerLeads = leads.filter((l) =>
    l.matched_installers?.some((m) => m.installer_id === selectedInstallerId)
  )

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 sm:py-12 space-y-8">
      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-border">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-teal-100 text-teal-800 text-xs font-bold uppercase tracking-wide">
              Installer Portal
            </span>
            <span className="text-xs text-textSecondary">EPRA Registered Partner Network</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-textPrimary">
            {installer?.name || 'Solar Installer Dashboard'}
          </h1>
          <p className="text-xs sm:text-sm text-textSecondary mt-1">
            Manage your company profile, hardware product line, field visit workflow, and customer dossiers.
          </p>
        </div>

        {/* Company Switcher */}
        <div className="flex items-center gap-3">
          <label htmlFor="company-select" className="text-xs font-bold text-textSecondary whitespace-nowrap">
            Switch Company:
          </label>
          <select
            id="company-select"
            value={selectedInstallerId}
            onChange={(e) => handleSelectInstaller(Number(e.target.value))}
            className="text-xs font-semibold px-3 py-2 bg-surface border border-border rounded-xl shadow-sm focus:ring-2 focus:ring-primary focus:outline-none"
          >
            {installers.map((inst) => (
              <option key={inst.id} value={inst.id}>
                {inst.name} ({inst.county || 'Nairobi'})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Success Notification */}
      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl flex items-center gap-3 text-sm animate-in fade-in">
          <svg className="w-5 h-5 text-emerald-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span className="font-semibold">{successMessage}</span>
        </div>
      )}

      {/* ── Navigation Tabs ── */}
      <div className="flex overflow-x-auto gap-2 border-b border-border pb-px scrollbar-none">
        <button
          onClick={() => setActiveTab('profile')}
          className={`px-4 py-2.5 text-xs sm:text-sm font-bold rounded-xl transition-all whitespace-nowrap ${
            activeTab === 'profile'
              ? 'bg-primary text-white shadow-sm'
              : 'text-textSecondary hover:text-textPrimary hover:bg-slate-100'
          }`}
        >
          🏢 Company Profile & EPRA
        </button>
        <button
          onClick={() => setActiveTab('products')}
          className={`px-4 py-2.5 text-xs sm:text-sm font-bold rounded-xl transition-all whitespace-nowrap ${
            activeTab === 'products'
              ? 'bg-primary text-white shadow-sm'
              : 'text-textSecondary hover:text-textPrimary hover:bg-slate-100'
          }`}
        >
          ⚡ Products & Hardware ({installer?.products?.length || 0})
        </button>
        <button
          onClick={() => setActiveTab('workflow')}
          className={`px-4 py-2.5 text-xs sm:text-sm font-bold rounded-xl transition-all whitespace-nowrap ${
            activeTab === 'workflow'
              ? 'bg-primary text-white shadow-sm'
              : 'text-textSecondary hover:text-textPrimary hover:bg-slate-100'
          }`}
        >
          📋 Customer Roadmap & Process
        </button>
        <button
          onClick={() => setActiveTab('leads')}
          className={`px-4 py-2.5 text-xs sm:text-sm font-bold rounded-xl transition-all whitespace-nowrap ${
            activeTab === 'leads'
              ? 'bg-primary text-white shadow-sm'
              : 'text-textSecondary hover:text-textPrimary hover:bg-slate-100'
          }`}
        >
          📬 Matched Customer Leads ({installerLeads.length})
        </button>
      </div>

      {installer && (
        <form onSubmit={handleSaveProfile} className="space-y-8">
          {/* ═══════════════════════════════════════════════════════════════════ */}
          {/* TAB 1: COMPANY PROFILE */}
          {/* ═══════════════════════════════════════════════════════════════════ */}
          {activeTab === 'profile' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="bg-surface rounded-2xl p-6 border border-border shadow-soft space-y-5">
                <h2 className="text-lg font-bold text-textPrimary flex items-center gap-2">
                  <span>General Information</span>
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-textSecondary mb-1">Company Name</label>
                    <input
                      type="text"
                      value={installer.name}
                      onChange={(e) => setInstaller({ ...installer, name: e.target.value })}
                      required
                      className="w-full text-sm px-3.5 py-2.5 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-textSecondary mb-1">EPRA License Number</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={installer.epra_license_no || ''}
                        onChange={(e) => setInstaller({ ...installer, epra_license_no: e.target.value })}
                        placeholder="e.g. EPRA/SOL/2023/0481"
                        className="w-full text-sm px-3.5 py-2.5 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary focus:outline-none"
                      />
                      <span className="absolute right-3 top-2.5 text-xs font-bold text-teal-600 bg-teal-50 px-2 py-0.5 rounded">
                        Class V1
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-textSecondary mb-1">Primary Phone</label>
                    <input
                      type="text"
                      value={installer.phone || ''}
                      onChange={(e) => setInstaller({ ...installer, phone: e.target.value })}
                      placeholder="+254711234567"
                      className="w-full text-sm px-3.5 py-2.5 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-textSecondary mb-1">WhatsApp Forwarding Number</label>
                    <input
                      type="text"
                      value={installer.whatsapp || ''}
                      onChange={(e) => setInstaller({ ...installer, whatsapp: e.target.value })}
                      placeholder="254711234567"
                      className="w-full text-sm px-3.5 py-2.5 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-textSecondary mb-1">Base County</label>
                    <input
                      type="text"
                      value={installer.county || ''}
                      onChange={(e) => setInstaller({ ...installer, county: e.target.value })}
                      placeholder="Nairobi"
                      className="w-full text-sm px-3.5 py-2.5 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-textSecondary mb-1">Base Town / Estate</label>
                    <input
                      type="text"
                      value={installer.town || ''}
                      onChange={(e) => setInstaller({ ...installer, town: e.target.value })}
                      placeholder="Westlands"
                      className="w-full text-sm px-3.5 py-2.5 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-textSecondary mb-1">Service Radius (km)</label>
                    <input
                      type="number"
                      value={installer.service_radius_km}
                      onChange={(e) => setInstaller({ ...installer, service_radius_km: Number(e.target.value) })}
                      min={10}
                      max={300}
                      className="w-full text-sm px-3.5 py-2.5 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-textSecondary mb-1">Installations Completed</label>
                    <input
                      type="number"
                      value={installer.projects_completed || 100}
                      onChange={(e) => setInstaller({ ...installer, projects_completed: Number(e.target.value) })}
                      className="w-full text-sm px-3.5 py-2.5 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-textSecondary mb-1">Company Bio & Overview</label>
                  <textarea
                    rows={3}
                    value={installer.bio || ''}
                    onChange={(e) => setInstaller({ ...installer, bio: e.target.value })}
                    placeholder="Tell homeowners and SMEs about your engineering expertise, warranty, and response time..."
                    className="w-full text-sm px-3.5 py-2.5 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary focus:outline-none"
                  />
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <input
                    type="checkbox"
                    id="epra_verified"
                    checked={installer.epra_verified}
                    onChange={(e) => setInstaller({ ...installer, epra_verified: e.target.checked })}
                    className="w-4 h-4 text-primary rounded border-border focus:ring-primary"
                  />
                  <label htmlFor="epra_verified" className="text-xs font-bold text-textPrimary cursor-pointer">
                    Display Verified EPRA Badge on Customer Reports
                  </label>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-3 bg-primary hover:bg-teal-700 text-white font-bold rounded-xl text-sm transition-all shadow"
                >
                  {saving ? 'Saving Changes...' : 'Save Profile Changes'}
                </button>
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════════════ */}
          {/* TAB 2: PRODUCTS & HARDWARE CATALOG */}
          {/* ═══════════════════════════════════════════════════════════════════ */}
          {activeTab === 'products' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-textPrimary">Products & Equipment Line</h2>
                  <p className="text-xs text-textSecondary">
                    Add the panels, inverters, and battery brands you supply to customers in Kenya.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowProductModal(true)}
                  className="px-4 py-2 bg-accent hover:bg-amber-500 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all shadow"
                >
                  <span>+ Add Product</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(installer.products || []).map((product) => (
                  <div
                    key={product.id}
                    className="p-5 bg-surface rounded-2xl border border-border shadow-soft flex flex-col justify-between space-y-3"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
                          {product.category}
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleToggleStock(product.id)}
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full transition-all ${
                              product.in_stock
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {product.in_stock ? '● In Stock' : '○ Out of Stock'}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteProduct(product.id)}
                            className="text-xs text-rose-600 hover:text-rose-800 p-1"
                            title="Delete product"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                      <h3 className="font-bold text-sm text-textPrimary">{product.brand} — {product.model}</h3>
                      <p className="text-xs text-textSecondary mt-1 leading-relaxed">{product.specs}</p>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-textSecondary">
                      <span>Warranty: <strong>{product.warranty_years} Years</strong></span>
                      <span className="text-[11px] text-teal-700 font-semibold">EPRA Compliant</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-3 bg-primary hover:bg-teal-700 text-white font-bold rounded-xl text-sm transition-all shadow"
                >
                  {saving ? 'Saving Changes...' : 'Save Product Changes'}
                </button>
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════════════ */}
          {/* TAB 3: CUSTOMER ROADMAP & PROCESS */}
          {/* ═══════════════════════════════════════════════════════════════════ */}
          {activeTab === 'workflow' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="bg-surface rounded-2xl p-6 border border-border shadow-soft space-y-6">
                <div>
                  <h2 className="text-lg font-bold text-textPrimary">Customer Installation Roadmap</h2>
                  <p className="text-xs text-textSecondary mt-1">
                    This step-by-step timeline is displayed to customers when they choose your company on their project tracker.
                  </p>
                </div>

                <div className="space-y-4">
                  {(installer.workflow_steps || []).map((step, idx) => (
                    <div
                      key={step.step}
                      className="p-4 bg-background rounded-xl border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-teal-100 text-teal-800 font-extrabold flex items-center justify-center text-xs flex-shrink-0">
                          {idx + 1}
                        </div>
                        <div>
                          <h4 className="font-bold text-sm text-textPrimary">{step.title}</h4>
                          <p className="text-xs text-textSecondary mt-0.5 leading-relaxed">{step.description}</p>
                          {step.required_from_customer && (
                            <p className="text-[11px] text-amber-700 font-semibold mt-1">
                              Required from client: {step.required_from_customer}
                            </p>
                          )}
                        </div>
                      </div>
                      <span className="text-xs font-bold text-textSecondary bg-surface px-3 py-1 rounded-full border border-border whitespace-nowrap self-start sm:self-center">
                        ⏳ {step.duration}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="pt-4 border-t border-border">
                  <h3 className="font-bold text-sm text-textPrimary mb-2">What Customers Must Prepare Before Site Visit:</h3>
                  <div className="space-y-2">
                    {(installer.customer_requirements || []).map((req, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs text-textSecondary">
                        <span className="text-teal-600 font-bold">✓</span>
                        <span>{req}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-3 bg-primary hover:bg-teal-700 text-white font-bold rounded-xl text-sm transition-all shadow"
                >
                  {saving ? 'Saving Changes...' : 'Save Process Changes'}
                </button>
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════════════ */}
          {/* TAB 4: LEADS & CUSTOMER DOSSIERS */}
          {/* ═══════════════════════════════════════════════════════════════════ */}
          {activeTab === 'leads' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div>
                <h2 className="text-lg font-bold text-textPrimary">Customer Leads Matched to You</h2>
                <p className="text-xs text-textSecondary">
                  Customers in your service radius who ran feasibility checks and requested contractor quotes.
                </p>
              </div>

              {installerLeads.length === 0 ? (
                <div className="p-8 text-center bg-surface rounded-2xl border border-dashed border-border text-textSecondary">
                  <p className="text-sm font-semibold">No active leads matched to this company yet.</p>
                  <p className="text-xs mt-1">When customers run assessments in {installer.county || 'Nairobi'}, they will appear here.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {installerLeads.map((lead) => {
                    const text = encodeURIComponent(
                      `Hi ${lead.name}, this is ${installer.name}. We received your SolarSight assessment for ${lead.location_label}. We'd be glad to discuss your ${lead.recommended_kwp || 3} kWp system and arrange a site visit.`
                    )
                    const waUrl = `https://wa.me/${lead.phone.replace(/[\+\s]/g, '')}?text=${text}`

                    return (
                      <div
                        key={lead.lead_id}
                        className="p-5 bg-surface rounded-2xl border border-border shadow-soft flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                      >
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-base text-textPrimary">{lead.name}</h3>
                            <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                              {lead.status}
                            </span>
                          </div>
                          <p className="text-xs text-textSecondary">
                            📍 {lead.location_label} · 📱 {lead.phone}
                          </p>
                          <div className="flex flex-wrap gap-2 text-xs text-textSecondary pt-1">
                            <span className="bg-slate-100 px-2 py-0.5 rounded">
                              System: <strong>{lead.recommended_kwp || 3} kWp</strong>
                            </span>
                            {lead.monthly_bill_ksh && (
                              <span className="bg-slate-100 px-2 py-0.5 rounded">
                                Bill: <strong>KSh {lead.monthly_bill_ksh.toLocaleString()}</strong>
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Link
                            href={`/report/${lead.assessment_id}`}
                            target="_blank"
                            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl text-xs transition-all"
                          >
                            View Full Dossier
                          </Link>
                          <a
                            href={waUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-sm"
                          >
                            <span>WhatsApp Client</span>
                          </a>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </form>
      )}

      {/* ── Add Product Modal ── */}
      {showProductModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-surface w-full max-w-md rounded-2xl p-6 border border-border shadow-xl space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <h3 className="font-bold text-base text-textPrimary">Add Solar Hardware Product</h3>
              <button
                type="button"
                onClick={() => setShowProductModal(false)}
                className="text-textSecondary hover:text-textPrimary text-sm font-bold p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddProduct} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-textSecondary mb-1">Category</label>
                <select
                  value={newProduct.category}
                  onChange={(e) =>
                    setNewProduct({
                      ...newProduct,
                      category: e.target.value as any,
                    })
                  }
                  className="w-full text-xs font-semibold px-3 py-2 bg-background border border-border rounded-xl"
                >
                  <option value="panel">Solar Panels (PV)</option>
                  <option value="inverter">Solar Inverter</option>
                  <option value="battery">Energy Storage Battery</option>
                  <option value="bos">Balance of System & Protection</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-textSecondary mb-1">Brand Name</label>
                <input
                  type="text"
                  placeholder="e.g. Jinko, Deye, Huawei, Pylontech"
                  value={newProduct.brand}
                  onChange={(e) => setNewProduct({ ...newProduct, brand: e.target.value })}
                  required
                  className="w-full text-xs px-3 py-2 bg-background border border-border rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-textSecondary mb-1">Model Name / Capacity</label>
                <input
                  type="text"
                  placeholder="e.g. Tiger Pro 550W / SUN-5K Hybrid"
                  value={newProduct.model}
                  onChange={(e) => setNewProduct({ ...newProduct, model: e.target.value })}
                  required
                  className="w-full text-xs px-3 py-2 bg-background border border-border rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-textSecondary mb-1">Key Specifications</label>
                <textarea
                  rows={2}
                  placeholder="e.g. 550W, Monocrystalline TOPCon, 21.3% efficiency, dual MPPT"
                  value={newProduct.specs}
                  onChange={(e) => setNewProduct({ ...newProduct, specs: e.target.value })}
                  required
                  className="w-full text-xs px-3 py-2 bg-background border border-border rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-textSecondary mb-1">Warranty (Years)</label>
                  <input
                    type="number"
                    value={newProduct.warranty_years}
                    onChange={(e) =>
                      setNewProduct({
                        ...newProduct,
                        warranty_years: Number(e.target.value),
                      })
                    }
                    min={1}
                    max={30}
                    className="w-full text-xs px-3 py-2 bg-background border border-border rounded-xl"
                  />
                </div>
                <div className="flex items-center pt-5">
                  <label className="flex items-center gap-2 text-xs font-bold text-textPrimary cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newProduct.in_stock}
                      onChange={(e) => setNewProduct({ ...newProduct, in_stock: e.target.checked })}
                      className="w-4 h-4 text-primary rounded"
                    />
                    <span>Available In Stock</span>
                  </label>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowProductModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary text-white font-bold rounded-xl text-xs"
                >
                  Add to Catalog
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
