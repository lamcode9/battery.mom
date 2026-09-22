'use client'

import { useState } from 'react'
import { COUNTRY_NAMES } from '@/lib/constants'

interface CorrectionItem {
  id: string
  type: string
  country: string
  itemName: string
  field: string
  currentValue: string
  suggestedValue: string
  source: string | null
  email: string | null
  notes: string | null
  status: string
  reviewedAt: string | null
  reviewedBy: string | null
  createdAt: string
}

interface AuditItem {
  id: string
  action: string
  vehicleId: string | null
  vehicleName: string | null
  changes: unknown
  createdAt: string
}

interface AdminStats {
  totalVehicles: number
  availableVehicles: number
  countryCounts: { country: string; count: number }[]
  pendingCorrections: number
  recentCorrections: CorrectionItem[]
  recentAuditLogs: AuditItem[]
  staleVehicles: number
  priceSnapshotCount: number
  freshness: { fresh: number; aging: number; stale: number }
}

export default function AdminDashboardClient({ stats }: { stats: AdminStats }) {
  const [activeTab, setActiveTab] = useState<'overview' | 'corrections' | 'audit'>('overview')
  const [reviewingId, setReviewingId] = useState<string | null>(null)

  const handleReview = async (correctionId: string, action: 'approved' | 'rejected') => {
    setReviewingId(correctionId)
    try {
      await fetch(`/api/admin/corrections/${correctionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: action }),
      })
      window.location.reload()
    } catch {
      alert('Failed to update correction')
    } finally {
      setReviewingId(null)
    }
  }

  const totalFreshness = stats.freshness.fresh + stats.freshness.aging + stats.freshness.stale
  const freshPct = totalFreshness > 0 ? Math.round((stats.freshness.fresh / totalFreshness) * 100) : 0
  const agingPct = totalFreshness > 0 ? Math.round((stats.freshness.aging / totalFreshness) * 100) : 0
  const stalePct = totalFreshness > 0 ? Math.round((stats.freshness.stale / totalFreshness) * 100) : 0

  return (
    <main className="min-h-screen pt-12 md:pt-14">
      <section className="container mx-auto px-4 pt-12 pb-16 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Admin dashboard</h1>
          <p className="mt-2 text-gray-500">Data review, corrections queue, and audit trail.</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-8 border-b border-gray-200">
          {(['overview', 'corrections', 'audit'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2.5 text-sm font-medium capitalize transition-colors border-b-2 -mb-px ${
                activeTab === tab
                  ? 'border-emerald-500 text-emerald-700'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab}
              {tab === 'corrections' && stats.pendingCorrections > 0 && (
                <span className="ml-2 bg-red-100 text-red-700 text-xs font-semibold px-2 py-0.5 rounded-full">
                  {stats.pendingCorrections}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard label="Total Vehicles" value={stats.totalVehicles.toLocaleString()} />
              <StatCard label="Available" value={stats.availableVehicles.toLocaleString()} accent="emerald" />
              <StatCard label="Pending Corrections" value={stats.pendingCorrections} accent={stats.pendingCorrections > 0 ? 'red' : 'emerald'} />
              <StatCard label="Price Snapshots" value={stats.priceSnapshotCount.toLocaleString()} />
            </div>

            {/* Country Breakdown */}
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Vehicles by country</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                {stats.countryCounts
                  .sort((a, b) => b.count - a.count)
                  .map((c) => (
                    <div key={c.country} className="bg-gray-50 rounded-lg p-3 text-center">
                      <div className="text-2xl font-bold text-gray-900">{c.count.toLocaleString()}</div>
                      <div className="text-xs text-gray-500 mt-1">{COUNTRY_NAMES[c.country] || c.country}</div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Data Freshness */}
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Data freshness</h2>
              <div className="mb-4">
                <div className="flex h-4 rounded-full overflow-hidden bg-gray-100">
                  <div className="bg-emerald-500 transition-all" style={{ width: `${freshPct}%` }} />
                  <div className="bg-yellow-400 transition-all" style={{ width: `${agingPct}%` }} />
                  <div className="bg-red-400 transition-all" style={{ width: `${stalePct}%` }} />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <span className="w-3 h-3 rounded-full bg-emerald-500" />
                    <span className="text-sm font-medium text-gray-700">Fresh (&lt;30d)</span>
                  </div>
                  <div className="text-xl font-bold text-gray-900">{stats.freshness.fresh}</div>
                  <div className="text-xs text-gray-500">{freshPct}%</div>
                </div>
                <div>
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <span className="w-3 h-3 rounded-full bg-yellow-400" />
                    <span className="text-sm font-medium text-gray-700">Aging (30–90d)</span>
                  </div>
                  <div className="text-xl font-bold text-gray-900">{stats.freshness.aging}</div>
                  <div className="text-xs text-gray-500">{agingPct}%</div>
                </div>
                <div>
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <span className="w-3 h-3 rounded-full bg-red-400" />
                    <span className="text-sm font-medium text-gray-700">Stale (&gt;90d)</span>
                  </div>
                  <div className="text-xl font-bold text-gray-900">{stats.freshness.stale}</div>
                  <div className="text-xs text-gray-500">{stalePct}%</div>
                </div>
              </div>
              {stats.staleVehicles > 0 && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                  ⚠ {stats.staleVehicles} vehicle{stats.staleVehicles !== 1 ? 's' : ''} have not been updated in over 90 days.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Corrections Tab */}
        {activeTab === 'corrections' && (
          <div className="space-y-4">
            {stats.recentCorrections.length === 0 ? (
              <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
                <p className="text-gray-500">No corrections submitted yet.</p>
              </div>
            ) : (
              stats.recentCorrections.map((c) => (
                <div
                  key={c.id}
                  className={`bg-white border rounded-xl p-5 ${
                    c.status === 'pending' ? 'border-yellow-300' : 'border-gray-200'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span
                          className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                            c.status === 'pending'
                              ? 'bg-yellow-100 text-yellow-700'
                              : c.status === 'approved'
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {c.status}
                        </span>
                        <span className="text-xs text-gray-400 uppercase">{c.type}</span>
                        <span className="text-xs text-gray-400">{COUNTRY_NAMES[c.country] || c.country}</span>
                      </div>
                      <h3 className="font-semibold text-gray-900">{c.itemName}</h3>
                      <div className="mt-2 text-sm space-y-1">
                        <p>
                          <span className="text-gray-500">Field:</span>{' '}
                          <span className="font-medium text-gray-700">{c.field}</span>
                        </p>
                        <p>
                          <span className="text-gray-500">Current:</span>{' '}
                          <span className="text-red-600 line-through">{c.currentValue}</span>
                        </p>
                        <p>
                          <span className="text-gray-500">Suggested:</span>{' '}
                          <span className="text-emerald-600 font-medium">{c.suggestedValue}</span>
                        </p>
                        {c.source && (
                          <p>
                            <span className="text-gray-500">Source:</span>{' '}
                            <a href={c.source} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                              {c.source}
                            </a>
                          </p>
                        )}
                        {c.notes && (
                          <p className="text-gray-500 italic">{c.notes}</p>
                        )}
                      </div>
                      <div className="mt-2 text-xs text-gray-400">
                        Submitted {new Date(c.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                        {c.email && ` · ${c.email}`}
                      </div>
                    </div>
                    {c.status === 'pending' && (
                      <div className="flex gap-2 flex-shrink-0">
                        <button
                          onClick={() => handleReview(c.id, 'approved')}
                          disabled={reviewingId === c.id}
                          className="px-3 py-1.5 text-xs font-medium bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleReview(c.id, 'rejected')}
                          disabled={reviewingId === c.id}
                          className="px-3 py-1.5 text-xs font-medium bg-red-100 text-red-700 rounded-lg hover:bg-red-200 disabled:opacity-50 transition-colors"
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Audit Log Tab */}
        {activeTab === 'audit' && (
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            {stats.recentAuditLogs.length === 0 ? (
              <div className="p-12 text-center">
                <p className="text-gray-500">No audit log entries yet.</p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left px-4 py-3 font-medium text-gray-500">Action</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500">Vehicle</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recentAuditLogs.map((log) => (
                    <tr key={log.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <span
                          className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                            log.action === 'CREATE'
                              ? 'bg-emerald-100 text-emerald-700'
                              : log.action === 'UPDATE'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {log.action}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-900">{log.vehicleName || log.vehicleId || '—'}</td>
                      <td className="px-4 py-3 text-gray-500">
                        {new Date(log.createdAt).toLocaleDateString('en-GB', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </section>
    </main>
  )
}

function StatCard({ label, value, accent }: { label: string; value: string | number; accent?: 'emerald' | 'red' }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5">
      <div
        className={`text-2xl font-bold ${
          accent === 'emerald' ? 'text-emerald-600' : accent === 'red' ? 'text-red-600' : 'text-gray-900'
        }`}
      >
        {value}
      </div>
      <div className="text-sm text-gray-500 mt-1">{label}</div>
    </div>
  )
}
