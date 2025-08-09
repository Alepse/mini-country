"use client"

export default function MapOrnaments() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0">
      <div
        className="absolute inset-0"
        style={{
          background: "linear-gradient(90deg, transparent 0%, rgba(90,63,185,0.08) 50%, transparent 100%)",
          maskImage: "linear-gradient(to right, transparent, black 20%, black 80%, transparent)",
          animation: "scan 5.5s ease-in-out infinite",
        }}
      />
      <style>{`@keyframes scan { 0% { transform: translateX(-60%); } 50% { transform: translateX(60%); } 100% { transform: translateX(-60%); } }`}</style>
    </div>
  )
}
