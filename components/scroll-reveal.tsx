"use client"

import { motion } from "framer-motion"
import type { ReactNode } from "react"

export default function ScrollReveal({
  children,
  delay = 0,
  y = 24,
  x = 0,
  duration = 0.6,
  className,
}: {
  children: ReactNode
  delay?: number
  y?: number
  x?: number
  duration?: number
  className?: string
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y, x }}
      whileInView={{ opacity: 1, y: 0, x: 0 }}
      transition={{ delay, duration, ease: "easeOut" }}
      viewport={{ once: true, amount: 0.2 }}
    >
      {children}
    </motion.div>
  )
}


