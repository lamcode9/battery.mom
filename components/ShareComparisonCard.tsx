'use client'

import { useRef, useState, useCallback } from 'react'
import { Vehicle } from '@/types/vehicle'
import { computeScore, type ScoreBreakdown } from './EVScoreGauge'
import { computeBadges } from './WinnerBadges'
import { formatPrice } from '@/lib/utils'

interface ShareComparisonCardProps {
  vehicles: Vehicle[]
}

export default function ShareComparisonCard({ vehicles }: ShareComparisonCardProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [showPreview, setShowPreview] = useState(false)

  const scores = vehicles.map(v => ({
    vehicle: v,
    score: computeScore(v, vehicles),
  }))

  const badges = computeBadges(vehicles)

  const getLabel = (v: Vehicle) => v.modelTrim ? `${v.name} ${v.modelTrim}` : v.name

  const handleShare = useCallback(async () => {
    if (!cardRef.current) return
    setIsGenerating(true)
    try {
      const html2canvas = (await import('html2canvas')).default
      const canvas = await html2canvas(cardRef.current, {
        scale: 2,
        backgroundColor: '#ffffff',
        useCORS: true,
        logging: false,
      })
      canvas.toBlob(async (blob) => {
        if (!blob) return
        try {
          await navigator.clipboard.write([
            new ClipboardItem({ 'image/png': blob }),
          ])
          alert('Comparison card copied to clipboard!')
        } catch {
          // Fallback: download
          const url = URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          a.download = `battery-mom-comparison-${new Date().toISOString().split('T')[0]}.png`
          a.click()
          URL.revokeObjectURL(url)
        }
      }, 'image/png')
    } catch (err) {
      console.error('Failed to generate card:', err)
    } finally {
      setIsGenerating(false)
    }
  }, [])

  const handleDownload = useCallback(async () => {
    if (!cardRef.current) return
    setIsGenerating(true)
    try {
      const html2canvas = (await import('html2canvas')).default
      const canvas = await html2canvas(cardRef.current, {
        scale: 2,
        backgroundColor: '#ffffff',
        useCORS: true,
        logging: false,
      })
      const url = canvas.toDataURL('image/png')
      const a = document.createElement('a')
      a.href = url
      a.download = `battery-mom-comparison-${new Date().toISOString().split('T')[0]}.png`
      a.click()
    } catch (err) {
      console.error('Failed to generate card:', err)
    } finally {
      setIsGenerating(false)
    }
  }, [])

  if (vehicles.length < 2) return null

  const winner = scores.reduce((a, b) => (a.score.total >= b.score.total ? a : b))

  const SCORE_COLOR = (s: number) => s >= 80 ? '#10b981' : s >= 60 ? '#f59e0b' : s >= 40 ? '#f97316' : '#ef4444'

  return (
    <>
      {/* Trigger buttons */}
      <div className="flex gap-2">
        <button
          onClick={() => setShowPreview(!showPreview)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 text-white rounded-lg text-xs font-semibold hover:bg-purple-700 transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          {showPreview ? 'Hide Card' : 'Share as Image'}
        </button>
      </div>

      {/* Preview + hidden render target */}
      {showPreview && (
        <div className="mt-4 space-y-3">
          <div className="flex gap-2">
            <button
              onClick={handleShare}
              disabled={isGenerating}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-brand-600 text-white rounded-lg text-xs font-semibold hover:bg-brand-700 transition-colors disabled:opacity-50"
            >
              {isGenerating ? 'Generating…' : '📋 Copy to Clipboard'}
            </button>
            <button
              onClick={handleDownload}
              disabled={isGenerating}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-paper-200 text-ink-700 rounded-lg text-xs font-semibold hover:bg-paper-300 transition-colors disabled:opacity-50"
            >
              {isGenerating ? '…' : '💾 Download PNG'}
            </button>
          </div>

          {/* The card that gets captured */}
          <div
            ref={cardRef}
            className="bg-paper-100 border border-ink/10 rounded-card overflow-hidden max-w-xl"
            style={{ width: 540 }}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-ink to-ink-800 px-5 py-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-white font-bold text-sm">battery.mom</div>
                  <div className="text-ink-400 text-[10px]">EV Comparison Scorecard</div>
                </div>
                <div className="text-ink-500 text-[9px]">
                  {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </div>
              </div>
            </div>

            {/* Vehicles */}
            <div className="px-5 py-4">
              <div className={`grid gap-3 ${vehicles.length === 2 ? 'grid-cols-2' : vehicles.length === 3 ? 'grid-cols-3' : 'grid-cols-4'}`}>
                {scores.map(({ vehicle, score }, i) => {
                  const isWinner = vehicle.id === winner.vehicle.id
                  const vBadges = badges.get(vehicle.id) ?? []
                  const color = SCORE_COLOR(score.total)

                  return (
                    <div
                      key={vehicle.id}
                      className={`rounded-card border p-3 text-center transition-all
                        ${isWinner ? 'border-brand-300 bg-brand-50/50 ring-1 ring-brand-200' : 'border-ink/10 bg-paper-200/50'}`}
                    >
                      {isWinner && (
                        <div className="text-[9px] font-bold text-brand-600 uppercase tracking-wider mb-1">
                          🏆 Winner
                        </div>
                      )}

                      {/* Score circle */}
                      <div className="relative mx-auto mb-2" style={{ width: 56, height: 56 }}>
                        <svg width={56} height={56} className="transform -rotate-90">
                          <circle cx={28} cy={28} r={23} fill="none" stroke="#f3f4f6" strokeWidth={4} />
                          <circle
                            cx={28} cy={28} r={23}
                            fill="none" stroke={color} strokeWidth={4}
                            strokeLinecap="round"
                            strokeDasharray={2 * Math.PI * 23}
                            strokeDashoffset={2 * Math.PI * 23 * (1 - score.total / 100)}
                          />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <span className="text-base font-bold" style={{ color }}>{score.total}</span>
                        </div>
                      </div>

                      {/* Name */}
                      <div className="text-xs font-semibold text-ink leading-tight">{vehicle.name}</div>
                      {vehicle.modelTrim && (
                        <div className="text-[9px] text-ink-500 mt-0.5 truncate">{vehicle.modelTrim}</div>
                      )}

                      {/* Badges */}
                      {vBadges.length > 0 && (
                        <div className="flex flex-wrap gap-0.5 justify-center mt-1.5">
                          {vBadges.slice(0, 2).map(b => (
                            <span key={b.id} className="text-[8px] px-1 py-0 rounded-full bg-paper-200 text-ink-600">
                              {b.icon} {b.label}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Key specs */}
                      <div className="mt-2 space-y-0.5 text-[9px] text-ink-600">
                        {vehicle.rangeKm && <div>{vehicle.rangeKm} km range</div>}
                        {vehicle.efficiencyKwhPer100km && <div>{vehicle.efficiencyKwhPer100km} kWh/100km</div>}
                        {vehicle.basePriceLocalCurrency && (
                          <div className="font-medium text-ink">
                            {formatPrice(vehicle.basePriceLocalCurrency, vehicle.country)}
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Footer */}
            <div className="bg-paper-200 px-5 py-2 border-t border-ink/10">
              <div className="flex items-center justify-between text-[9px] text-ink-400">
                <span>battery.mom. Clear data for the energy transition</span>
                <span>Score methodology: Range 25% · Efficiency 25% · Value 20% · Charging 15% · Battery 15%</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
