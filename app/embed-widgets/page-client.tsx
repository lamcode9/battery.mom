'use client'

import { useState } from 'react'

const WIDGETS = [
  {
    id: 'scoreboard',
    title: 'SEA EV & Energy Scoreboard',
    description: 'Country-by-country comparison of EV adoption, charging infrastructure, solar capacity, and policy grades across Southeast Asia.',
    path: '/embed/scoreboard',
    defaultWidth: 600,
    defaultHeight: 480,
    icon: '🌏',
  },
  {
    id: 'ev-stats',
    title: 'EV Database Stats',
    description: 'Live stats from the EV database. Vehicle counts by country, and top models by range and efficiency.',
    path: '/embed/ev-stats',
    defaultWidth: 600,
    defaultHeight: 520,
    icon: '⚡',
  },
  {
    id: 'ev-vs-ice',
    title: 'EV vs Petrol Calculator',
    description: 'Interactive mini-calculator comparing annual EV vs petrol fuel costs across 6 SEA countries.',
    path: '/embed/ev-vs-ice',
    defaultWidth: 480,
    defaultHeight: 400,
    icon: '🔋',
  },
] as const

type WidgetId = typeof WIDGETS[number]['id']

export default function EmbedPageClient() {
  const [selected, setSelected] = useState<WidgetId>('scoreboard')
  const [width, setWidth] = useState(600)
  const [height, setHeight] = useState(480)
  const [copied, setCopied] = useState(false)

  const widget = WIDGETS.find((w) => w.id === selected)!
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://battery.mom'
  const embedUrl = `${baseUrl}${widget.path}`

  const embedCode = `<iframe src="${embedUrl}" width="${width}" height="${height}" style="border:none;border-radius:12px;overflow:hidden;" loading="lazy" title="${widget.title}, battery.mom"></iframe>`

  const handleCopy = async () => {
    await navigator.clipboard.writeText(embedCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <main className="min-h-screen bg-paper py-12 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-3xl sm:text-4xl font-bold text-ink mb-3">
            Embed <span className="text-brand-600">battery.mom</span> Widgets
          </h1>
          <p className="text-ink-600 max-w-2xl mx-auto">
            Add live energy transition data to your website. Choose a widget, customize the size,
            copy the embed code. Free forever, no API key needed.
          </p>
        </div>

        {/* Widget selector cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {WIDGETS.map((w) => (
            <button
              key={w.id}
              onClick={() => {
                setSelected(w.id)
                setWidth(w.defaultWidth)
                setHeight(w.defaultHeight)
              }}
              className={`text-left p-4 rounded-card border-2 transition-all ${
                selected === w.id
                  ? 'border-brand-500 bg-paper-100 shadow-md ring-1 ring-brand-200'
                  : 'border-ink/10 bg-paper-100 hover:border-ink/15 hover:shadow-sm'
              }`}
            >
              <div className="text-2xl mb-2">{w.icon}</div>
              <h3 className="font-semibold text-ink text-sm">{w.title}</h3>
              <p className="text-xs text-ink-500 mt-1 line-clamp-2">{w.description}</p>
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Preview */}
          <div>
            <h2 className="text-sm font-semibold text-ink-700 uppercase tracking-wider mb-3">
              Preview
            </h2>
            <div
              className="bg-paper-100 rounded-card shadow-lg border border-ink/10 overflow-hidden"
              style={{ maxWidth: Math.min(width, 600) }}
            >
              <iframe
                src={widget.path}
                width="100%"
                height={height}
                style={{ border: 'none' }}
                title={`${widget.title} Preview`}
              />
            </div>
          </div>

          {/* Configuration */}
          <div className="space-y-6">
            <div>
              <h2 className="text-sm font-semibold text-ink-700 uppercase tracking-wider mb-3">
                Customize
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <label className="block">
                  <span className="text-xs font-medium text-ink-600">Width (px)</span>
                  <input
                    type="number"
                    value={width}
                    onChange={(e) => setWidth(Number(e.target.value))}
                    min={300}
                    max={1200}
                    className="mt-1 w-full rounded-lg border border-ink/15 px-3 py-2 text-sm"
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-medium text-ink-600">Height (px)</span>
                  <input
                    type="number"
                    value={height}
                    onChange={(e) => setHeight(Number(e.target.value))}
                    min={200}
                    max={800}
                    className="mt-1 w-full rounded-lg border border-ink/15 px-3 py-2 text-sm"
                  />
                </label>
              </div>
            </div>

            <div>
              <h2 className="text-sm font-semibold text-ink-700 uppercase tracking-wider mb-3">
                Embed code
              </h2>
              <div className="relative">
                <pre className="bg-ink text-brand-400 text-xs p-4 rounded-card overflow-x-auto font-mono leading-relaxed whitespace-pre-wrap break-all">
                  {embedCode}
                </pre>
                <button
                  onClick={handleCopy}
                  className={`absolute top-2 right-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    copied
                      ? 'bg-brand-500 text-white'
                      : 'bg-ink-700 text-paper-200 hover:bg-ink-600'
                  }`}
                >
                  {copied ? '✓ Copied' : 'Copy'}
                </button>
              </div>
            </div>

            <div className="bg-brand-50 rounded-card p-4 border border-brand-200">
              <h3 className="text-sm font-semibold text-brand-800 mb-2">Usage guidelines</h3>
              <ul className="text-xs text-brand-700 space-y-1.5">
                <li>✓ Free for personal and commercial use</li>
                <li>✓ No API key or signup required</li>
                <li>✓ Data updates automatically</li>
                <li>✓ Please keep the &quot;Powered by battery.mom&quot; attribution</li>
                <li>✓ Works on any website, CMS, or blog platform</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
