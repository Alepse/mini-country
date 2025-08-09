"use client"

import { cn } from "@/lib/utils"

export default function BackgroundBeams({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "pointer-events-none fixed inset-0 -z-10",
        // subtle layered radial glows
        "bg-[radial-gradient(1200px_800px_at_50%_-10%,rgba(90,63,185,0.12),transparent_60%),radial-gradient(900px_600px_at_90%_110%,rgba(241,241,239,0.08),transparent_60%)]",
        className,
      )}
    >
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(120deg, transparent 0%, rgba(90,63,185,0.10) 20%, transparent 40%, transparent 60%, rgba(241,241,239,0.06) 80%, transparent 100%)",
          backgroundSize: "200% 100%",
          animation: "bg-pan 16s linear infinite",
          willChange: "background-position",
        }}
      />
      <style>{`@keyframes bg-pan { 0% { background-position: 0% 0%; } 100% { background-position: -200% 0%; } }`}</style>
    </div>
  )
}
