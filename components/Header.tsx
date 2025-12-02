'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const siteName = "battery.mom"
const tagline = "Clear data for the energy transition. No sponsors, no noise."

type NavLink = {
  href: string
  label: string
  tooltip?: string
  dropdown?: Array<{ href: string; label: string }>
}

const navLinks: NavLink[] = [
  { href: '/', label: 'Home' },
  { href: '/about', label: 'About' },
  { href: '/ev', label: 'EV' },
  { 
    href: '/bess', 
    label: 'BESS', 
    tooltip: 'Battery Energy Storage Systems',
    dropdown: [
      { href: '/bess/home', label: 'Batteries at Home' },
      { href: '/bess/commercial', label: 'Commercial BESS' },
      { href: '/bess/grid', label: 'Grid / Industrial BESS' },
    ]
  },
  { href: '/scoreboard', label: 'Scoreboard' },
  { href: '/calculators', label: 'Calculators' },
  { href: '/insights', label: 'Insights' },
]

export default function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isMenuClosing, setIsMenuClosing] = useState(false)
  const [hoveredTooltip, setHoveredTooltip] = useState<string | null>(null)
  const [hoveredDropdown, setHoveredDropdown] = useState<string | null>(null)
  const pathname = usePathname()

  // Close mobile menu when route changes
  useEffect(() => {
    if (isMobileMenuOpen) {
      handleCloseMenu()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname])

  const handleCloseMenu = () => {
    setIsMenuClosing(true)
    setTimeout(() => {
      setIsMobileMenuOpen(false)
      setIsMenuClosing(false)
    }, 200) // Match animation duration
  }

  const handleOpenMenu = () => {
    setIsMenuClosing(false)
    setIsMobileMenuOpen(true)
  }

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

  const isBessHovered = hoveredDropdown === '/bess'

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 backdrop-blur-md border-b border-gray-200/50 transition-all duration-200 ${
          isBessHovered ? 'h-32 md:h-36' : 'h-12 md:h-14'
        }`}
        style={{
          backgroundColor: 'rgba(255, 255, 255, 0.5)',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
        }}
        onMouseLeave={() => setHoveredDropdown(null)}
      >
        <div className="max-w-[1200px] mx-auto h-full px-4 md:px-6 relative">
          {/* Logo (Left) */}
          <Link href="/" className="flex items-center absolute left-4 md:left-6 top-1/2 -translate-y-1/2">
            <span className="font-bold text-gray-900 text-sm leading-tight">
              {siteName}
            </span>
          </Link>

          {/* Desktop Navigation (Center) */}
          <nav className="hidden md:flex items-center gap-0.5 justify-center h-12 md:h-14 relative">
              {navLinks.map((link, index) => (
                <span 
                  key={link.href} 
                  className="flex items-center relative"
                  onMouseEnter={() => {
                    if (link.dropdown) {
                      setHoveredDropdown(link.href)
                    } else if (link.tooltip) {
                      setHoveredTooltip(link.tooltip)
                    }
                  }}
                  onMouseLeave={() => {
                    if (!link.dropdown) {
                      setHoveredTooltip(null)
                    }
                  }}
                >
                  <Link
                    href={link.href}
                    className={`px-3 py-2 text-sm font-medium transition-colors ${
                      isActive(link.href) || (link.dropdown && link.dropdown.some(item => isActive(item.href)))
                        ? 'text-emerald-600'
                        : 'text-gray-700 hover:text-emerald-600'
                    }`}
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

          {/* Extended BESS Dropdown Area */}
          {isBessHovered && (
            <div className="hidden md:flex items-center justify-center h-20 md:h-22 border-t border-gray-200/30">
              <div className="flex items-center gap-6">
                {navLinks.find(link => link.href === '/bess')?.dropdown?.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`px-4 py-2 text-sm font-medium transition-colors ${
                      isActive(item.href)
                        ? 'text-emerald-600'
                        : 'text-gray-700 hover:text-emerald-600'
                    }`}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Mobile Hamburger Button (Right) */}
          <button
            onClick={() => isMobileMenuOpen ? handleCloseMenu() : handleOpenMenu()}
            className="md:hidden p-2 text-gray-700 hover:text-emerald-600 transition-all duration-300 absolute right-4 top-1/2 -translate-y-1/2"
            aria-label="Toggle menu"
          >
            <div className="relative w-6 h-6">
              <svg
                className={`absolute inset-0 w-6 h-6 transition-all duration-300 ${
                  isMobileMenuOpen ? 'opacity-0 rotate-180' : 'opacity-100 rotate-0'
                }`}
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
              <svg
                className={`absolute inset-0 w-6 h-6 transition-all duration-300 ${
                  isMobileMenuOpen ? 'opacity-100 rotate-0' : 'opacity-0 -rotate-180'
                }`}
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
            </div>
          </button>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {(isMobileMenuOpen || isMenuClosing) && (
        <>
          {/* Dark Overlay */}
          <div
            className={`fixed inset-0 bg-black/60 z-40 md:hidden transition-opacity duration-300 ${
              isMenuClosing ? 'opacity-0' : 'opacity-100'
            }`}
            onClick={handleCloseMenu}
          />

          {/* Floating Rounded Menu Box with Fade Effect */}
          <div
            className={`fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 max-w-[90vw] min-h-[70vh] max-h-[85vh] z-50 md:hidden ${
              isMenuClosing ? 'animate-fade-out' : 'animate-fade-in'
            }`}
            style={{
              backgroundColor: 'rgba(15, 15, 15, 0.5)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              borderRadius: '20px',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
            }}
          >
            <div className="flex flex-col justify-center h-full p-6">
              {/* Menu Navigation */}
              <nav className="w-full">
                <ul className="space-y-1">
                  {navLinks.map((link) => (
                    <li key={link.href}>
                      {link.dropdown ? (
                        <div>
                          <div className="px-4 py-3 text-base font-medium text-gray-300">
                            <span className="block">{link.label}</span>
                            {link.tooltip && (
                              <span className="block text-sm text-gray-500 mt-0.5">
                                {link.tooltip}
                              </span>
                            )}
                          </div>
                          <ul className="ml-4 mt-1 space-y-1">
                            {link.dropdown.map((item) => (
                              <li key={item.href}>
                                <Link
                                  href={item.href}
                                  className={`block px-4 py-2 text-sm font-medium rounded-xl transition-all text-left ${
                                    isActive(item.href)
                                      ? 'text-emerald-500 bg-gray-800/50'
                                      : 'text-gray-400 hover:text-emerald-500 hover:bg-gray-800/50'
                                  }`}
                                  onClick={handleCloseMenu}
                                >
                                  {item.label}
                                </Link>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ) : (
                      <Link
                        href={link.href}
                        className={`block px-4 py-3 text-base font-medium rounded-xl transition-all text-left ${
                          isActive(link.href)
                            ? 'text-emerald-500 bg-gray-800/50'
                            : 'text-gray-300 hover:text-emerald-500 hover:bg-gray-800/50'
                        }`}
                        title={link.tooltip || undefined}
                        onClick={handleCloseMenu}
                      >
                        <span className="block">{link.label}</span>
                        {link.tooltip && (
                          <span className="block text-sm text-gray-500 mt-0.5">
                            {link.tooltip}
                          </span>
                        )}
                      </Link>
                      )}
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

