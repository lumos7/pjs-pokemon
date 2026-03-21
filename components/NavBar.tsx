'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const LINKS = [
  { href: '/',             label: '🏠 Home'      },
  { href: '/encounter',    label: '🗺️ Adventure'  },
  { href: '/pokemon-list', label: '📖 Pokédex'   },
  { href: '/quiz',         label: '🔍 Quiz'      },
]

export function NavBar() {
  const pathname = usePathname()

  return (
    <nav className="sticky top-0 z-50 w-full bg-[#CC0000] border-b-4 border-[#FFCB05] shadow-md">
      <div className="max-w-5xl mx-auto px-4 flex items-center justify-between h-12">
        {/* Logo */}
        <Link
          href="/"
          className="text-[#FFCB05] font-bold text-lg tracking-wide leading-none hover:opacity-80 transition-opacity"
          style={{ fontFamily: "'Bangers', 'Impact', cursive", letterSpacing: '0.05em', WebkitTextStroke: '0.5px #2A75BB' }}
        >
          PJ&apos;s Pokemon
        </Link>

        {/* Nav links */}
        <div className="flex items-center gap-1">
          {LINKS.map(({ href, label }) => {
            const active = pathname === href
            return (
              <Link
                key={href}
                href={href}
                className={`px-3 py-1 rounded-full text-sm font-bold transition-colors whitespace-nowrap ${
                  active
                    ? 'bg-[#FFCB05] text-gray-900'
                    : 'text-white hover:bg-white/20'
                }`}
              >
                {label}
              </Link>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
