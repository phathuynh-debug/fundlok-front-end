"use client"

import { useEffect, useRef } from "react"

interface GuillocheWavesProps {
  activeIndex: number
}

export function GuillocheWaves({ activeIndex }: GuillocheWavesProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const activeIndexRef = useRef(activeIndex)
  const rippleRef = useRef(0)
  const animationFrameRef = useRef<number | null>(null)

  // Track activeIndex changes to trigger a ripple pulse
  useEffect(() => {
    if (activeIndex !== activeIndexRef.current) {
      activeIndexRef.current = activeIndex
      rippleRef.current = 1.5 // Trigger ripple pulse
    }
  }, [activeIndex])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Resize handler: uses window width for full screen width, parent height for hero height
    const handleResize = () => {
      const dpr = window.devicePixelRatio || 1
      const parent = canvas.parentElement || document.body
      const width = window.innerWidth
      const height = parent.clientHeight || window.innerHeight
      
      canvas.width = width * dpr
      canvas.height = height * dpr
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`
      ctx.scale(dpr, dpr)
    }

    handleResize()
    window.addEventListener("resize", handleResize)

    let time = 0
    const lineCount = 32
    
    // Main animation loop
    const animate = () => {
      const parent = canvas.parentElement || document.body
      const width = window.innerWidth
      const height = parent.clientHeight || window.innerHeight
      
      // Clear canvas
      ctx.clearRect(0, 0, width, height)

      // Detect dark mode from the document
      const isDark = document.documentElement.classList.contains("dark")
      
      // Use a richer, darker emerald green (emerald-600 in light mode, emerald-500 in dark mode)
      const waveColor = isDark ? "rgb(16, 185, 129)" : "rgb(5, 150, 105)"

      // Decay ripple pulse
      rippleRef.current *= 0.95
      if (rippleRef.current < 0.01) {
        rippleRef.current = 0
      }

      time += 0.005

      // Draw left and right wave sets
      const drawHalf = (isLeft: boolean) => {
        const centerX = width / 2
        const centerY = height / 2

        // Set line styling
        ctx.lineWidth = 1.0
        ctx.strokeStyle = waveColor

        for (let i = 0; i < lineCount; i++) {
          // Adjust opacity per line for depth (outer lines are slightly fainter)
          const centerDist = Math.abs(i - lineCount / 2) / (lineCount / 2)
          
          // Higher baseline opacity to make the waves more visible and distinct
          const baseAlpha = (isDark ? 0.22 : 0.14) + (1 - centerDist) * (isDark ? 0.28 : 0.18)
          ctx.globalAlpha = baseAlpha

          ctx.beginPath()

          const step = 8 // Draw point every N pixels for performance
          const startX = isLeft ? 0 : centerX
          const endX = isLeft ? centerX : width

          // Setup initial point
          let first = true

          for (let x = startX; x <= endX; x += step) {
            // Determine normalized distance from the edge (0 at center, 1 at outer edges)
            const t = isLeft ? 1 - x / centerX : (x - centerX) / (width - centerX)
            
            // Power curve to shape the convergence (higher power = sharper funnel)
            const tCurve = Math.pow(t, 2.2)

            // Outer edge starting Y (spaced out vertically)
            const yStart = 40 + (i / (lineCount - 1)) * (height - 80)
            
            // Center convergence Y (spaced out in a narrow band behind the card)
            const yCenter = centerY + (i - lineCount / 2) * 1.5

            // Base interpolated height
            let y = yCenter + (yStart - yCenter) * tCurve

            // Add wave oscillation
            const waveFreq = 0.008 + i * 0.0001
            const waveSpeed = 1.5 + (i % 3) * 0.2
            
            // Primary sine wave
            let wave = Math.sin(x * waveFreq - time * waveSpeed + i * 0.1) * 20 * Math.pow(t, 1.2)

            // Secondary ripple wave if transition pulse is active
            if (rippleRef.current > 0) {
              const rippleDist = isLeft ? (centerX - x) : (x - centerX)
              const rippleOffset = Math.sin(rippleDist * 0.03 - time * 12) * 25 * rippleRef.current * t
              wave += rippleOffset
            }

            y += wave

            if (first) {
              ctx.moveTo(x, y)
              first = false
            } else {
              ctx.lineTo(x, y)
            }
          }

          ctx.stroke()
        }
      }

      drawHalf(true)  // Draw Left Waves
      drawHalf(false) // Draw Right Waves

      animationFrameRef.current = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      window.removeEventListener("resize", handleResize)
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [activeIndex])

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none z-0"
    />
  )
}
