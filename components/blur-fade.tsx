"use client"

import { motion } from "framer-motion"
import type { ReactNode } from "react"

export default function BlurFade({
  children,
  delay = 0,
  y = 6,
}: {
  children: ReactNode
  delay?: number
  y?: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y, filter: "blur(6px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{ duration: 0.6, ease: "easeOut", delay }}
    >
      {children}
    </motion.div>
  )
}
