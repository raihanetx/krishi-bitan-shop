'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useCallback, memo } from 'react'
import { prefetchApi, preloadImage } from '@/lib/smart-cache'

interface PrefetchLinkProps {
  href: string
  children: React.ReactNode
  className?: string
  prefetchApiEndpoint?: string
  prefetchImages?: string[]
  onClick?: () => void
  style?: React.CSSProperties
  target?: string
  rel?: string
}

// Smart Link component with prefetching
export const PrefetchLink = memo(function PrefetchLink({
  href,
  children,
  className,
  prefetchApiEndpoint,
  prefetchImages,
  onClick,
  style,
  target,
  rel,
}: PrefetchLinkProps) {
  const router = useRouter()
  const [isNavigating, setIsNavigating] = useState(false)

  // Prefetch on hover (instant feel!)
  const handleMouseEnter = useCallback(() => {
    // Prefetch the page
    router.prefetch(href)
    
    // Prefetch API data if specified
    if (prefetchApiEndpoint) {
      prefetchApi(prefetchApiEndpoint)
    }
    
    // Prefetch images if specified
    if (prefetchImages && prefetchImages.length > 0) {
      prefetchImages.forEach(url => preloadImage(url))
    }
  }, [href, router, prefetchApiEndpoint, prefetchImages])

  // Handle click with loading state
  const handleClick = useCallback((e: React.MouseEvent) => {
    if (target === '_blank') return // Let default behavior for new tabs
    
    e.preventDefault()
    setIsNavigating(true)
    
    if (onClick) {
      onClick()
    }
    
    // Small delay for transition feel
    setTimeout(() => {
      router.push(href)
      setIsNavigating(false)
    }, 50)
  }, [href, router, onClick, target])

  return (
    <Link
      href={href}
      className={className}
      onMouseEnter={handleMouseEnter}
      onClick={handleClick}
      style={style}
      target={target}
      rel={rel}
    >
      {isNavigating ? (
        <span className="inline-flex items-center gap-2">
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          {children}
        </span>
      ) : (
        children
      )}
    </Link>
  )
})

export default PrefetchLink
