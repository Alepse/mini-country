"use client"

import type React from "react"

import { Slot } from "@radix-ui/react-slot"
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"

export default function ShinyButton({
  className,
  asChild,
  children,
}: {
  className?: string
  asChild?: boolean
  children: React.ReactNode
}) {
  const classes = cn(
    "relative inline-flex h-10 items-center justify-center rounded-md px-5 text-sm font-medium text-white",
    "bg-gradient-to-b from-purple-500 to-purple-600 shadow",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-300",
    className,
  )

  if (asChild) {
    return (
      <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
        <Slot className={classes}>{children}</Slot>
      </motion.div>
    )
  }

  return (
    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
      <button className={classes}>{children}</button>
    </motion.div>
  )
}
