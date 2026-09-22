import type { Metadata, Viewport } from 'next'

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
}

export const metadata: Metadata = {
  title: 'battery.mom, embed widget',
  robots: { index: false, follow: false },
}

/**
 * Nested layout for the iframe embed widgets. The root layout supplies the
 * (transparent) <html>/<body>; SiteShell omits the site header/footer for
 * `/embed/*`. This layout only adds the widget padding + attribution link, so
 * the widget renders chrome-free and blends into whatever host page frames it.
 */
export default function EmbedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="p-4">
      {children}
      <div className="mt-4 pt-3 border-t border-ink/10 text-center">
        <a
          href="https://battery.mom"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-ink-400 hover:text-brand-600 transition-colors"
        >
          Powered by battery.mom
        </a>
      </div>
    </div>
  )
}
