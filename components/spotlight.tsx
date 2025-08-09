"use client"

import { useEffect, useRef, useState } from "react"
import { cn } from "@/lib/utils"

export default function Spotlight({
  className,
  color = "#8B5CF6",
  size = 480,
}: {
  className?: string
  color?: string
  size?: number
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState({ x: 50, y: 40 })

  useEffect(() => {
    const el = ref.current?.parentElement
    if (!el) return
    const handler = (e: MouseEvent) => {
      const r = el.getBoundingClientRect()
      const x = ((e.clientX - r.left) / r.width) * 100
      const y = ((e.clientY - r.top) / r.height) * 100
      setPos({ x, y })
    }
    el.addEventListener("mousemove", handler)
    return () => el.removeEventListener("mousemove", handler)
  }, [])

  return (
    <div
      ref={ref}
      aria-hidden="true"
      className={cn("pointer-events-none absolute inset-0", className)}
      style={{
        background: `radial-gradient(${size}px ${size}px at ${pos.x}% ${pos.y}%, ${hexToRgba(
          color,
          0.35,
        )} 0%, rgba(0,0,0,0) 60%)`,
      }}
    />
  )
}

function hexToRgba(hex: string, alpha = 1) {
  const v = hex.replace("#", "")
  const bigint = Number.parseInt(v, 16)
  const r = (bigint >> 16) & 255
  const g = (bigint >> 8) & 255
  const b = bigint & 255
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}
