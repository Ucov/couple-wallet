'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'

export default function SwipeNavigation() {
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    // Si estamos en auth, no hacer nada
    if (!pathname || pathname === '/login' || pathname === '/setup-couple') return

    let touchStartX = 0
    let touchEndX = 0
    let touchStartY = 0
    let touchEndY = 0

    const routes = ['/', '/shopping', '/menu', '/profile']
    const currentIndex = routes.indexOf(pathname)

    const handleTouchStart = (e: TouchEvent) => {
      const target = e.target as HTMLElement
      if (target.closest('.no-swipe')) {
        touchStartX = -1 // Usamos -1 como flag de ignorar
        return
      }
      touchStartX = e.changedTouches[0].screenX
      touchStartY = e.changedTouches[0].screenY
    }

    const handleTouchEnd = (e: TouchEvent) => {
      if (touchStartX === -1) return
      
      touchEndX = e.changedTouches[0].screenX
      touchEndY = e.changedTouches[0].screenY
      handleSwipe()
    }

    const handleSwipe = () => {
      if (currentIndex === -1) return

      const deltaX = touchEndX - touchStartX
      const deltaY = touchEndY - touchStartY

      // Ignorar si el scroll fue mayormente vertical
      if (Math.abs(deltaY) > Math.abs(deltaX)) return

      const SWIPE_THRESHOLD = 50 // mínima distancia para considerar un swipe

      if (deltaX > SWIPE_THRESHOLD) {
        // Swipe Right -> Ir a la pantalla anterior
        if (currentIndex > 0) {
          router.push(routes[currentIndex - 1])
        }
      } else if (deltaX < -SWIPE_THRESHOLD) {
        // Swipe Left -> Ir a la siguiente pantalla
        if (currentIndex < routes.length - 1) {
          router.push(routes[currentIndex + 1])
        }
      }
    }

    document.addEventListener('touchstart', handleTouchStart, { passive: true })
    document.addEventListener('touchend', handleTouchEnd, { passive: true })

    return () => {
      document.removeEventListener('touchstart', handleTouchStart)
      document.removeEventListener('touchend', handleTouchEnd)
    }
  }, [pathname, router])

  return null
}
