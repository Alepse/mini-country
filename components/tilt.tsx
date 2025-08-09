"use client"

import type React from "react"

import { useRef } from "react"
import { motion, useMotionValue, useTransform, animate } from "framer-motion"
import { cn } from "@/lib/utils"

export default function Tilt({
  children,
  className,
  max = 6,
  glare = true,
}: {
  children: React.ReactNode
  className?: string
  max?: number
  glare?: boolean
}) {
  const ref = useRef<HTMLDivElement>(null)
  const mx = useMotionValue(0)
  const my = useMotionValue(0)
  const rx = useTransform(my, [-0.5, 0.5], [max, -max])
  const ry = useTransform(mx, [-0.5, 0.5], [-max, max])

  const handleMove = (e: React.MouseEvent) => {
    const el = ref.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width - 0.5
    const y = (e.clientY - rect.top) / rect.height - 0.5
    mx.set(x)
    my.set(y)
  }
  const handleLeave = () => {
    animate(mx, 0, { duration: 0.4 })
    animate(my, 0, { duration: 0.4 })
  }

  return (
    <motion.div
      ref={ref}
      className={cn("will-change-transform", className)}
      style={{ perspective: 1000 }}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
    >
      <motion.div style={{ rotateX: rx, rotateY: ry }}>
        <div className="relative">
          {children}
          {glare && (
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 rounded-xl"
              style={{
                background: "radial-gradient(300px 120px at var(--mx,50%) 0%, rgba(255,255,255,0.12), transparent 60%)",
                mixBlendMode: "soft-light",
              }}
            />
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}
