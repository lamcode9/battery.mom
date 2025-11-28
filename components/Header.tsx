'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const siteName = "battery.mom"
const tagline = "Clear data for the energy transition. No sponsors, no noise."

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/about', label: 'About' },
  { href: '/ev', label: 'EV', tooltip: 'Electric Vehicles' },
  { href: '/bess', label: 'BESS', tooltip: 'Battery Energy Storage Systems' },
  { href: '/scoreboard', label: 'Scoreboard' },
  { href: '/calculators', label: 'Calculators' },
]

export default function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [hoveredTooltip, setHoveredTooltip] = useState<string | null>(null)
  const pathname = usePathname()

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false)
  }, [pathname])

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isMobileMenuOpen])

  const isActive = (href: string) => {
    if (href === '/') {
      return pathname === '/'
    }
    return pathname.startsWith(href)
  }

  return (
    <>
      <header
        className="fixed top-0 left-0 right-0 z-50 h-12 md:h-14 backdrop-blur-md border-b border-gray-200/50"
        style={{
          backgroundColor: 'rgba(255, 255, 255, 0.5)',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
        }}
      >
        <div className="max-w-[1200px] mx-auto h-full px-4 md:px-6 relative">
          {/* Logo (Left) */}
          <Link href="/" className="flex items-center absolute left-4 md:left-6 top-1/2 -translate-y-1/2">
            <span className="font-bold text-gray-900 text-sm leading-tight">
              {siteName}
            </span>
          </Link>

          {/* Desktop Navigation (Center) */}
          <nav className="hidden md:flex items-center gap-0.5 justify-center h-full relative">
              {navLinks.map((link, index) => (
                <span key={link.href} className="flex items-center">
                  <Link
                    href={link.href}
                    className={`px-3 py-2 text-sm font-medium transition-colors ${
                      isActive(link.href)
                        ? 'text-emerald-600'
                        : 'text-gray-700 hover:text-emerald-600'
                    }`}
                    onMouseEnter={() => link.tooltip && setHoveredTooltip(link.tooltip)}
                    onMouseLeave={() => setHoveredTooltip(null)}
                  >
                    {link.label}
                  </Link>
                  {index < navLinks.length - 1 && (
                    <span className="text-gray-400 mx-1">·</span>
                  )}
                </span>
              ))}
              {/* Shared Tooltip - appears after last nav link */}
              {hoveredTooltip && (
                <div className="absolute left-full top-1/2 transform -translate-y-1/2 ml-1 px-2.5 py-1.5 text-[10px] text-gray-500 bg-white/90 backdrop-blur-sm border border-gray-200/60 rounded-md shadow-[0_1px_3px_rgba(0,0,0,0.08),inset_0_2px_3px_rgba(0,0,0,0.1),inset_0_1px_1px_rgba(255,255,255,0.9)] whitespace-nowrap z-50">
                  {hoveredTooltip}
                </div>
              )}
            </nav>

          {/* Mobile Hamburger Button (Right) */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 text-gray-700 hover:text-emerald-600 transition-colors absolute right-4 top-1/2 -translate-y-1/2"
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? (
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            ) : (
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            )}
          </button>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <>
          {/* Dark Overlay */}
          <div
            className="fixed inset-0 bg-black/60 z-40 md:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          />

          {/* Slide-out Drawer */}
          <div
            className={`fixed top-0 left-0 h-full w-80 max-w-[85vw] bg-[#0f0f0f] z-50 transform transition-transform duration-300 ease-in-out md:hidden ${
              isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
            }`}
          >
            <div className="flex flex-col h-full">
              {/* Drawer Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-800">
                <div>
                  <span className="font-bold text-white text-base">
                    {siteName}
                  </span>
                </div>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-2 text-gray-400 hover:text-white transition-colors"
                  aria-label="Close menu"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              {/* Drawer Navigation */}
              <nav className="flex-1 overflow-y-auto p-6">
                <ul className="space-y-1">
                  {navLinks.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        className={`block px-4 py-3 text-base font-medium rounded-lg transition-colors ${
                          isActive(link.href)
                            ? 'text-emerald-600 dark:text-emerald-500 bg-gray-800'
                            : 'text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-500 hover:bg-gray-800'
                        }`}
                        title={link.tooltip || undefined}
                      >
                        {link.label}
                        {link.tooltip && (
                          <span className="ml-2 text-xs text-gray-500">
                            ({link.tooltip})
                          </span>
                        )}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            </div>
          </div>
        </>
      )}
    </>
  )
}

