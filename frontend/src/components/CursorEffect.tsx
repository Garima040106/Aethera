import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'

export default function CursorEffect() {
  const cursorRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const cursor = cursorRef.current
    if (!cursor) return

    let targetX = 0
    let targetY = 0
    let currentX = 0
    let currentY = 0
    let animationFrame = 0
    let hasPosition = false

    const followCursor = () => {
      currentX += (targetX - currentX) * 0.12
      currentY += (targetY - currentY) * 0.12
      cursor.style.left = `${currentX}px`
      cursor.style.top = `${currentY}px`

      if (Math.abs(targetX - currentX) > 0.1 || Math.abs(targetY - currentY) > 0.1) {
        animationFrame = requestAnimationFrame(followCursor)
      } else {
        animationFrame = 0
      }
    }

    const moveCursor = (event: MouseEvent) => {
      targetX = event.clientX
      targetY = event.clientY
      cursor.classList.remove('cursor-hidden')
      cursor.classList.toggle(
        'cursor-interactive',
        event.target instanceof Element &&
          event.target.closest('a, button, input, textarea, select, [role="button"]') !== null,
      )

      if (!hasPosition) {
        currentX = targetX
        currentY = targetY
        cursor.style.left = `${currentX}px`
        cursor.style.top = `${currentY}px`
        hasPosition = true
      }

      if (!animationFrame) animationFrame = requestAnimationFrame(followCursor)
    }

    const leaveWindow = () => {
      cursor.classList.add('cursor-hidden')
    }

    window.addEventListener('mousemove', moveCursor)
    window.addEventListener('mouseleave', leaveWindow)
    return () => {
      window.removeEventListener('mousemove', moveCursor)
      window.removeEventListener('mouseleave', leaveWindow)
      cancelAnimationFrame(animationFrame)
    }
  }, [])

  return createPortal(
    <span ref={cursorRef} className="custom-cursor-ring cursor-hidden" aria-hidden="true" />,
    document.body,
  )
}
