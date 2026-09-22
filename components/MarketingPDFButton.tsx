'use client'

import { useState, useCallback } from 'react'
import type { Country } from '@/types/bess'
import { CURRENCY_SYMBOLS, COUNTRY_NAMES } from '@/lib/constants'

function fmt(amount: number, country: Country, digits = 0) {
  return `${CURRENCY_SYMBOLS[country]}${amount.toLocaleString('en-US', {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  })}`
}

interface SalesSheetData {
  country: Country
  mode: 'retrofit' | 'new'
  units: number
  solarKw: number
  batteryCapacityKwh: number
  batteryName: string
  costPerUnit: number
  monthlySavings: number
  paybackYears: number
  blackoutHours: number
  co2Avoided: number
  zeroBillDays: number
  coverage: number
  totalSystemCost: number
}

function drawRoundedRect(doc: any, x: number, y: number, w: number, h: number, r: number) {
  doc.roundedRect(x, y, w, h, r, r, 'F')
}

export default function MarketingPDFButton({
  data,
  className = '',
}: {
  data: SalesSheetData
  className?: string
}) {
  const [generating, setGenerating] = useState(false)

  const generate = useCallback(async () => {
    setGenerating(true)
    try {
      const { default: jsPDF } = await import('jspdf')
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
      const W = 210
      const H = 297
      const margin = 16

      // ── Background ──────────────────────────────────────────────
      doc.setFillColor(255, 255, 255)
      doc.rect(0, 0, W, H, 'F')

      // ── Top emerald banner ──────────────────────────────────────
      doc.setFillColor(16, 185, 129) // emerald-500
      doc.rect(0, 0, W, 58, 'F')

      // Title
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(26)
      doc.setTextColor(255, 255, 255)
      doc.text('Green Living, Built In.', margin, 28)

      doc.setFontSize(12)
      doc.setFont('helvetica', 'normal')
      doc.text(`Solar + Battery Storage · ${data.units}-Unit ${data.mode === 'retrofit' ? 'Retrofit' : 'New Development'}`, margin, 40)
      doc.text(`${COUNTRY_NAMES[data.country]} · ${new Date().toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}`, margin, 50)

      // Logo text
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(10)
      doc.text('battery.mom', W - margin, 50, { align: 'right' })

      // ── Stat cards row ──────────────────────────────────────────
      const cardY = 66
      const cardH = 38
      const cardW = (W - margin * 2 - 12) / 3
      const cards = [
        { label: 'Monthly Saving', value: fmt(data.monthlySavings, data.country, 0), sub: 'per household' },
        { label: 'Payback Period', value: `${data.paybackYears.toFixed(1)} years`, sub: 'from move-in day' },
        { label: 'Zero-Bill Days', value: `${data.zeroBillDays} days/yr`, sub: `${Math.round(data.coverage * 100)}% self-powered` },
      ]

      cards.forEach((card, i) => {
        const cx = margin + i * (cardW + 6)
        doc.setFillColor(240, 253, 244) // emerald-50
        drawRoundedRect(doc, cx, cardY, cardW, cardH, 3)

        doc.setFontSize(9)
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(75, 85, 99) // gray-600
        doc.text(card.label, cx + 6, cardY + 10)

        doc.setFontSize(18)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(5, 150, 105) // emerald-600
        doc.text(card.value, cx + 6, cardY + 22)

        doc.setFontSize(8)
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(107, 114, 128) // gray-500
        doc.text(card.sub, cx + 6, cardY + 30)
      })

      // ── System specs ────────────────────────────────────────────
      let y = cardY + cardH + 16
      doc.setFillColor(249, 250, 251) // gray-50
      drawRoundedRect(doc, margin, y, W - margin * 2, 60, 3)

      doc.setFontSize(12)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(17, 24, 39) // gray-900
      doc.text('System Specifications', margin + 8, y + 12)

      const specs = [
        ['Solar capacity', `${Math.round(data.solarKw)} kW rooftop solar`],
        ['Battery storage', `${Math.round(data.batteryCapacityKwh)} kWh (${data.batteryName})`],
        ['Blackout cover', `${data.blackoutHours.toFixed(1)} hours whole-building backup`],
        ['CO₂ reduction', `${(data.co2Avoided / 1000).toFixed(1)} tonnes/year avoided`],
        ['Total system', fmt(data.totalSystemCost, data.country, 0)],
        ['Cost per unit', fmt(data.costPerUnit, data.country, 0)],
      ]

      doc.setFontSize(9)
      const col1X = margin + 8
      const col2X = margin + 52
      const col3X = margin + (W - margin * 2) / 2 + 4
      const col4X = col3X + 44
      specs.forEach((s, i) => {
        const row = Math.floor(i / 2)
        const col = i % 2
        const rx = col === 0 ? col1X : col3X
        const rv = col === 0 ? col2X : col4X
        const ry = y + 22 + row * 10

        doc.setFont('helvetica', 'normal')
        doc.setTextColor(107, 114, 128)
        doc.text(s[0], rx, ry)

        doc.setFont('helvetica', 'bold')
        doc.setTextColor(17, 24, 39)
        doc.text(s[1], rv, ry)
      })

      // ── Buyer benefits ──────────────────────────────────────────
      y += 72
      doc.setFontSize(12)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(17, 24, 39)
      doc.text('What the buyer gets', margin, y)

      const benefits = [
        `Save ${fmt(data.monthlySavings, data.country)} every month, ${data.zeroBillDays} zero-bill days a year`,
        `${data.blackoutHours.toFixed(1)} hours of backup during grid outages, with no generator`,
        `Cut carbon by ${(data.co2Avoided / 1000).toFixed(1)} tonnes of CO₂ a year`,
        `Pays back in ${data.paybackYears.toFixed(1)} years, then savings for 15 or more years after that`,
        `A shared system costs ${Math.round(data.coverage * 100)}% less than one installation per unit`,
      ]

      doc.setFontSize(10)
      benefits.forEach((line, i) => {
        const by = y + 10 + i * 12
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(55, 65, 81)
        doc.text(line, margin + 4, by)
      })

      // ── CTA banner ──────────────────────────────────────────────
      y += 10 + benefits.length * 12 + 10
      doc.setFillColor(5, 150, 105) // emerald-600
      drawRoundedRect(doc, margin, y, W - margin * 2, 28, 3)

      doc.setFontSize(14)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(255, 255, 255)
      doc.text('Run your own building', margin + 10, y + 12)

      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      doc.text('Visit battery.mom/bess/shared-residential to customize your building\'s system →', margin + 10, y + 22)

      // ── Footer ──────────────────────────────────────────────────
      doc.setFontSize(7)
      doc.setTextColor(156, 163, 175) // gray-400
      doc.setFont('helvetica', 'normal')
      doc.text(
        `Generated by battery.mom · ${new Date().toLocaleDateString('en-GB')} · Estimates based on ${COUNTRY_NAMES[data.country]} tariffs & solar data. Actual results may vary.`,
        W / 2,
        H - 8,
        { align: 'center' }
      )

      doc.save(`green-living-${data.units}-units-${data.country.toLowerCase()}.pdf`)
    } finally {
      setGenerating(false)
    }
  }, [data])

  return (
    <button
      onClick={generate}
      disabled={generating}
      className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm transition-colors disabled:opacity-60 ${className}`}
    >
      {generating ? (
        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      ) : (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      )}
      {generating ? 'Generating…' : 'Sales Sheet PDF'}
    </button>
  )
}
