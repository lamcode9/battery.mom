'use client'

import { useEffect, useState, type ComponentProps } from 'react'
import { ResponsiveContainer as RechartsResponsiveContainer } from 'recharts'
import ErrorBoundary from '@/components/ErrorBoundary'

/**
 * SSR-safe drop-in replacement for recharts' ResponsiveContainer.
 * Defers chart rendering until after hydration to prevent SVG mismatches
 * (recharts generates different SVG on server vs client).
 *
 * Also wraps every chart in a per-chart ErrorBoundary so one chart that throws
 * (bad data transform, recharts edge case) degrades to a small inline message
 * instead of blanking the whole section.
 */
export default function ResponsiveContainer(
  props: ComponentProps<typeof RechartsResponsiveContainer>
) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  const height = typeof props.height === 'number' ? props.height : 200
  const width = typeof props.width === 'number' ? props.width : '100%'

  if (!mounted) {
    // Render a placeholder with the same dimensions to avoid layout shift
    return <div style={{ width, height }} />
  }

  return (
    <ErrorBoundary
      section="chart"
      fallback={
        <div
          style={{ width, height }}
          className="flex items-center justify-center rounded-xl bg-gray-50 border border-gray-200 text-sm text-gray-500"
        >
          This chart couldn&apos;t be displayed.
        </div>
      }
    >
      <RechartsResponsiveContainer
        {...props}
        style={{ overflow: 'visible', ...(typeof props.style === 'object' && props.style ? props.style : {}) }}
      />
    </ErrorBoundary>
  )
}
