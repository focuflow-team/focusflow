'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV_ITEMS = [
  { href: '/app', label: '타이머', exact: true },
  { href: '/app/stats', label: '통계', exact: false },
  { href: '/app/leaderboard', label: '리더보드', exact: false },
  { href: '/app/settings', label: '설정', exact: false },
]

export function NavLinks() {
  const pathname = usePathname()

  return (
    <>
      {NAV_ITEMS.map(({ href, label, exact }) => {
        const isActive = exact ? pathname === href : pathname.startsWith(href)
        return (
          <Link
            key={href}
            href={href}
            className={`rounded-md px-1.5 sm:px-2 py-1.5 text-xs sm:text-sm whitespace-nowrap transition-colors hover:bg-muted ${
              isActive
                ? 'text-foreground font-medium'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {label}
          </Link>
        )
      })}
    </>
  )
}
