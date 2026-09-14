'use client'

import { useState, useEffect } from 'react'
import {
  adminGetLeads,
  adminUpdateLeadStatus,
  adminGetInstallers,
  adminCreateInstaller,
  adminDeleteInstaller,
  adminGetConfig,
  adminUpdateConfig,
} from '@/lib/api'
import type { AdminLead, AdminInstaller } from '@/lib/types'

export default function AdminPage() {
  const [token, setToken] = useState<string>('')
  const [authenticated, setAuthenticated] = useState<boolean>(false)
  const [activeTab, setActiveTab] = useState<'leads' | 'installers' | 'config'>('leads')
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  // Data
  const [leads, setLeads] = useState<AdminLead[]>([])
  const [installers, setInstallers] = useState<AdminInstaller[]>([])
  const [configData, setConfigData] = useState<Record<string, { value: any; updated_at: string }>>({})

  // New installer form state
  const [showInstallerModal, setShowInstallerModal] = useState(false)
  const [newInstaller, setNewInstaller] = useState({
    name: '',
    phone: '',
    whatsapp: '',
    county: 'Nairobi',
    town: 'Westlands',
    lat: -1.2678,
    lng: 36.8122,
    service_radius_km: 50,
    epra_license_no: '',
    epra_verified: true,
    product_types: ['pv_hybrid', 'pv_gridtie'],
    size_min_kw: 0.5,
    size_max_kw: 20,
    lead_fee_ksh: 500,
    active: true,
  })

  // Editable config state
  const [editedConfig, setEditedConfig] = useState<Record<string, any>>({})

  // Load data when authenticated or tab changes
  useEffect(() => {
    if (!authenticated) return

    async function loadTabData() {
      setLoading(true)
      setError(null)
      try {
        if (activeTab === 'leads') {
          const data = await adminGetLeads(token)
          setLeads(data.leads || [])
        } else if (activeTab === 'installers') {
          const data = await adminGetInstallers(token)
          setInstallers(data.installers || [])
        } else if (activeTab === 'config') {
          const data = await adminGetConfig(token)
          setConfigData(data || {})
          const initialEdits: Record<string, any> = {}
          Object.entries(data || {}).forEach(([k, v]) => {
            initialEdits[k] = v.value
          })
          setEditedConfig(initialEdits)
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load admin data. Check token.')
      } finally {
        setLoading(false)
      }
    }

    loadTabData()
  }, [authenticated, activeTab, token])

  function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    if (!token.trim()) return
    setAuthenticated(true)
  }

  async function handleStatusChange(leadId: string, status: string) {
    try {
      await adminUpdateLeadStatus(token, leadId, status)
      setLeads((prev) =>
        prev.map((l) => (l.lead_id === leadId ? { ...l, status } : l))
      )
    } catch (err: any) {
      alert(`Failed to update status: ${err.message}`)
    }
  }

  async function handleCreateInstaller(e: React.FormEvent) {
    e.preventDefault()
    try {
      await adminCreateInstaller(token, newInstaller)
      setShowInstallerModal(false)
      const data = await adminGetInstallers(token)
      setInstallers(data.installers || [])
      setSuccessMsg('Installer created successfully.')
      setTimeout(() => setSuccessMsg(null), 3000)
    } catch (err: any) {
      alert(`Error creating installer: ${err.message}`)
    }
  }

  async function handleDeleteInstaller(id: number) {
    if (!confirm('Are you sure you want to delete this installer?')) return
    try {
      await adminDeleteInstaller(token, id)
      setInstallers((prev) => prev.filter((i) => i.id !== id))
    } catch (err: any) {
      alert(`Error deleting installer: ${err.message}`)
    }
  }

  async function handleSaveConfig() {
    setLoading(true)
    try {
      await adminUpdateConfig(token, editedConfig)
      const fresh = await adminGetConfig(token)
      setConfigData(fresh)
      setSuccessMsg('Config values updated and Redis cache cleared.')
      setTimeout(() => setSuccessMsg(null), 3000)
    } catch (err: any) {
      alert(`Failed to save config: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  if (!authenticated) {
    return (
      <div className="max-w-md mx-auto px-4 py-16">
        <div className="bg-surface rounded-2xl p-6 border border-border shadow-soft space-y-4">
          <div className="text-center">
            <h1 className="text-xl font-bold text-textPrimary">SolarSight Admin</h1>
            <p className="text-xs text-textSecondary mt-1">
              Enter the ADMIN_TOKEN configured in your environment
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-textPrimary mb-1">
                Admin Token
              </label>
              <input
                type="password"
                placeholder="Enter ADMIN_TOKEN"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                required
                className="w-full px-3.5 py-2 rounded-xl border border-border bg-background text-sm focus:ring-2 focus:ring-primary focus:outline-none"
              />
            </div>
            <button
              type="submit"
              className="w-full py-2.5 bg-primary hover:bg-teal-800 text-white font-bold rounded-xl text-sm transition-colors"
            >
              Sign In
            </button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <h1 className="text-2xl font-bold text-textPrimary">SolarSight Operations Portal</h1>
          <p className="text-xs text-textSecondary">
            Manage solar leads, installers, and tariff/cost configurations
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-xl border border-border bg-surface p-1">
            {(['leads', 'installers', 'config'] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold capitalize transition-colors ${
                  activeTab === tab
                    ? 'bg-primary text-white shadow-sm'
                    : 'text-textSecondary hover:text-textPrimary'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setAuthenticated(false)}
            className="px-3 py-1.5 border border-border rounded-xl text-xs font-semibold text-textSecondary hover:text-textPrimary"
          >
            Sign Out
          </button>
        </div>
      </div>

      {successMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl">
          {successMsg}
        </div>
      )}

      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl">
          {error}
        </div>
      )}

      {loading && (
        <div className="py-12 text-center text-xs text-textSecondary">Loading...</div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* Tab 1: Leads Inbox */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {!loading && activeTab === 'leads' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-textPrimary">
              Lead Inbox ({leads.length})
            </h2>
            <span className="text-xs text-textSecondary">
              Forward customer assessment directly to installer via WhatsApp
            </span>
          </div>

          {leads.length === 0 ? (
            <div className="p-8 bg-surface rounded-2xl border border-border text-center text-xs text-textSecondary">
              No leads received yet.
            </div>
          ) : (
            <div className="bg-surface rounded-2xl border border-border shadow-soft overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-textSecondary uppercase tracking-wider font-semibold border-b border-border">
                    <tr>
                      <th className="py-3 px-4">Customer</th>
                      <th className="py-3 px-3">Location</th>
                      <th className="py-3 px-3">System / Bill</th>
                      <th className="py-3 px-3">Status</th>
                      <th className="py-3 px-4">Matched Installers & WhatsApp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border text-textPrimary">
                    {leads.map((lead) => (
                      <tr key={lead.lead_id} className="hover:bg-slate-50/50">
                        <td className="py-3.5 px-4 font-semibold">
                          <div>{lead.name}</div>
                          <a
                            href={`tel:${lead.phone}`}
                            className="text-primary font-mono hover:underline"
                          >
                            {lead.phone}
                          </a>
                        </td>
                        <td className="py-3.5 px-3 text-textSecondary">
                          {lead.location_label}
                        </td>
                        <td className="py-3.5 px-3">
                          <span className="font-bold text-primary">
                            {lead.recommended_kwp || '3.0'} kWp
                          </span>
                          <span className="block text-[11px] text-textSecondary">
                            {lead.monthly_bill_ksh
                              ? `KSh ${Math.round(lead.monthly_bill_ksh).toLocaleString()}`
                              : 'N/A'}
                          </span>
                        </td>
                        <td className="py-3.5 px-3">
                          <select
                            value={lead.status}
                            onChange={(e) => handleStatusChange(lead.lead_id, e.target.value)}
                            className="px-2 py-1 rounded-lg border border-border bg-background text-xs font-medium focus:ring-1 focus:ring-primary"
                          >
                            <option value="new">New</option>
                            <option value="matched">Matched</option>
                            <option value="contacted">Contacted</option>
                            <option value="quoted">Quoted</option>
                            <option value="won">Won</option>
                            <option value="lost">Lost</option>
                            <option value="unmatched">Unmatched</option>
                          </select>
                        </td>
                        <td className="py-3.5 px-4 space-y-1">
                          {lead.matched_installers && lead.matched_installers.length > 0 ? (
                            lead.matched_installers.map((inst, i) => (
                              <div key={i} className="flex items-center gap-2">
                                <span className="font-medium text-[11px] truncate max-w-[130px]">
                                  {inst.name}
                                </span>
                                {inst.forward_url ? (
                                  <a
                                    href={inst.forward_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-100 hover:bg-emerald-200 text-emerald-800 font-bold text-[10px] transition-colors"
                                  >
                                    Forward on WhatsApp
                                  </a>
                                ) : (
                                  <span className="text-[10px] text-slate-400">No WA</span>
                                )}
                              </div>
                            ))
                          ) : (
                            <span className="text-textSecondary italic">No match in radius</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* Tab 2: Installers CRUD */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {!loading && activeTab === 'installers' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-textPrimary">
              Registered Solar Installers ({installers.length})
            </h2>
            <button
              type="button"
              onClick={() => setShowInstallerModal(true)}
              className="px-4 py-2 bg-primary hover:bg-teal-800 text-white font-bold rounded-xl text-xs shadow"
            >
              + Add Installer
            </button>
          </div>

          <div className="bg-surface rounded-2xl border border-border shadow-soft overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-textSecondary uppercase tracking-wider font-semibold border-b border-border">
                  <tr>
                    <th className="py-3 px-4">Name</th>
                    <th className="py-3 px-3">Location</th>
                    <th className="py-3 px-3">Radius</th>
                    <th className="py-3 px-3">EPRA</th>
                    <th className="py-3 px-3">Rating</th>
                    <th className="py-3 px-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border text-textPrimary">
                  {installers.map((inst) => (
                    <tr key={inst.id} className="hover:bg-slate-50/50">
                      <td className="py-3.5 px-4 font-semibold">
                        <div>{inst.name}</div>
                        <div className="text-[11px] text-textSecondary">{inst.whatsapp || inst.phone}</div>
                      </td>
                      <td className="py-3.5 px-3 text-textSecondary">
                        {inst.town}, {inst.county}
                      </td>
                      <td className="py-3.5 px-3">
                        {inst.service_radius_km} km
                      </td>
                      <td className="py-3.5 px-3">
                        {inst.epra_verified ? (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                            Verified
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px]">
                            Pending
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-3 font-semibold">
                        ★ {inst.rating_avg || 'New'}
                      </td>
                      <td className="py-3.5 px-3">
                        <button
                          type="button"
                          onClick={() => handleDeleteInstaller(inst.id)}
                          className="text-rose-600 hover:underline font-semibold"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Add Installer Modal */}
          {showInstallerModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
              <div className="bg-surface w-full max-w-md rounded-2xl p-6 border border-border shadow-xl space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-base font-bold text-textPrimary">Add Solar Installer</h3>
                  <button
                    type="button"
                    onClick={() => setShowInstallerModal(false)}
                    className="text-textSecondary hover:text-textPrimary"
                  >
                    ✕
                  </button>
                </div>

                <form onSubmit={handleCreateInstaller} className="space-y-3 text-xs">
                  <div>
                    <label className="block font-semibold mb-1">Company Name</label>
                    <input
                      type="text"
                      required
                      value={newInstaller.name}
                      onChange={(e) => setNewInstaller({ ...newInstaller, name: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-border"
                      placeholder="Solar Solutions Ltd"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block font-semibold mb-1">Phone</label>
                      <input
                        type="text"
                        value={newInstaller.phone}
                        onChange={(e) => setNewInstaller({ ...newInstaller, phone: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-border"
                        placeholder="+254711..."
                      />
                    </div>
                    <div>
                      <label className="block font-semibold mb-1">WhatsApp</label>
                      <input
                        type="text"
                        value={newInstaller.whatsapp}
                        onChange={(e) => setNewInstaller({ ...newInstaller, whatsapp: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-border"
                        placeholder="+254711..."
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block font-semibold mb-1">Town</label>
                      <input
                        type="text"
                        value={newInstaller.town}
                        onChange={(e) => setNewInstaller({ ...newInstaller, town: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-border"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold mb-1">County</label>
                      <input
                        type="text"
                        value={newInstaller.county}
                        onChange={(e) => setNewInstaller({ ...newInstaller, county: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-border"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block font-semibold mb-1">Lat</label>
                      <input
                        type="number"
                        step="0.0001"
                        value={newInstaller.lat}
                        onChange={(e) => setNewInstaller({ ...newInstaller, lat: parseFloat(e.target.value) })}
                        className="w-full px-3 py-2 rounded-xl border border-border"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold mb-1">Lng</label>
                      <input
                        type="number"
                        step="0.0001"
                        value={newInstaller.lng}
                        onChange={(e) => setNewInstaller({ ...newInstaller, lng: parseFloat(e.target.value) })}
                        className="w-full px-3 py-2 rounded-xl border border-border"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="checkbox"
                      id="epra-check"
                      checked={newInstaller.epra_verified}
                      onChange={(e) => setNewInstaller({ ...newInstaller, epra_verified: e.target.checked })}
                      className="rounded text-primary"
                    />
                    <label htmlFor="epra-check" className="font-semibold cursor-pointer">
                      EPRA Licensed & Verified
                    </label>
                  </div>

                  <div className="pt-2 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowInstallerModal(false)}
                      className="px-4 py-2 border rounded-xl"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 bg-primary text-white font-bold rounded-xl shadow"
                    >
                      Save Installer
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* Tab 3: App Config Manager */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {!loading && activeTab === 'config' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-textPrimary">App Config Single Source of Truth</h2>
              <p className="text-xs text-textSecondary">
                Edit KPLC tariffs, hardware pricing, and defaults without redeploying.
              </p>
            </div>
            <button
              type="button"
              onClick={handleSaveConfig}
              className="px-6 py-2.5 bg-accent hover:bg-amber-500 text-slate-950 font-extrabold rounded-xl text-xs shadow transition-colors"
            >
              Save Changes
            </button>
          </div>

          <div className="bg-surface rounded-2xl border border-border shadow-soft p-5 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(editedConfig).map(([key, val]) => (
                <div key={key} className="p-3 bg-slate-50 border border-border rounded-xl space-y-1">
                  <label className="block text-xs font-semibold text-textPrimary font-mono">
                    {key}
                  </label>
                  <input
                    type="text"
                    value={typeof val === 'object' ? JSON.stringify(val) : String(val)}
                    onChange={(e) => {
                      let parsedVal: any = e.target.value
                      if (!isNaN(Number(parsedVal)) && parsedVal.trim() !== '') {
                        parsedVal = Number(parsedVal)
                      } else if (parsedVal.startsWith('[') || parsedVal.startsWith('{')) {
                        try {
                          parsedVal = JSON.parse(parsedVal)
                        } catch {
                          // Keep as text until valid
                        }
                      }
                      setEditedConfig({ ...editedConfig, [key]: parsedVal })
                    }}
                    className="w-full px-3 py-1.5 rounded-lg border border-border bg-white text-xs font-mono"
                  />
                  <div className="text-[10px] text-textSecondary">
                    Last updated: {configData[key]?.updated_at?.split('T')[0] || 'Default'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
