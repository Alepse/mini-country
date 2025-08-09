"use client"

import { useEffect, useRef, useState } from "react"
import { ComposableMap, Geographies, Geography, ZoomableGroup, Marker } from "react-simple-maps"
import { geoCentroid } from "d3-geo"
import { motion } from "framer-motion"
import Image from "next/image"

import type { Feature, Geometry } from "geojson"
import worldCountries from "world-countries"

type CountryDetails = {
  name: string
  code: string // ISO-2 or ISO-3
  region?: string
  capital?: string
  population?: number
  flag?: string // URL or emoji
}

const TOPO_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json"

// Build mapping from world-atlas numeric id => ISO-2 and ISO-3
const idToIso2: Record<number, string> = {}
const idToIso3: Record<number, string> = {}
const codeToName: Record<string, string> = {}
for (const wc of worldCountries as Array<{ ccn3: string; cca3: string; cca2: string; name: { common?: string } | string }>) {
  const n = Number.parseInt(wc.ccn3, 10)
  const name = typeof wc.name === "string" ? wc.name : wc.name?.common
  const c2 = wc.cca2?.toUpperCase?.() || ""
  const c3 = wc.cca3?.toUpperCase?.() || ""
  if (!Number.isNaN(n)) {
    if (c2) idToIso2[n] = c2
    if (c3) idToIso3[n] = c3
  }
  if (c2) codeToName[c2] = name || c2
  if (c3) codeToName[c3] = name || c3
}

// Precise centroid overrides (lon, lat) for small territories as requested
const CENTROID_OVERRIDES: Record<string, [number, number]> = {
  AD: [1.601554, 42.546245],
  AG: [-61.796428, 17.060816],
  AX: [19.91561, 60.178525],
  AS: [-170.132217, -14.270972],
  AI: [-63.06082, 18.2256],
}

export default function MapCore({
  selectedCode = null,
  onSelect,
  highlightCodes = [],
  activeCode = null,
  focusCode = null,
  focusZoom = 2.2,
  detailsByCode,
  accentColor = "#5A3FB9",
  // theme colors
  fillDefault = "rgba(241,241,239,0.06)",
  fillHover = "rgba(90,63,185,0.22)",
  fillSelected = "rgba(90,63,185,0.28)",
  strokeDefault = "rgba(90,63,185,0.35)",
  strokeSelected = "rgba(90,63,185,0.9)",
  strokeWidthDefault = 0.65,
  strokeWidthSelected = 1.5,
}: {
  selectedCode?: string | null
  onSelect?: (code: string | null) => void
  highlightCodes?: string[]
  activeCode?: string | null
  focusCode?: string | null
  focusZoom?: number
  detailsByCode?: Record<string, CountryDetails>
  accentColor?: string
  fillDefault?: string
  fillHover?: string
  fillSelected?: string
  strokeDefault?: string
  strokeSelected?: string
  strokeWidthDefault?: number
  strokeWidthSelected?: number
}) {
  const [zoom, setZoom] = useState(1)
  const [center, setCenter] = useState<[number, number] | undefined>(undefined)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const interactionsEnabled = true
  const codeToCentroidRef = useRef<Map<string, [number, number]>>(new Map())

  const activeKey = (activeCode || selectedCode || "").toUpperCase()
  const activeDetails: CountryDetails | undefined = activeKey ? detailsByCode?.[activeKey] : undefined

  useEffect(() => {
    if (focusCode) {
      const c = codeToCentroidRef.current.get(focusCode.toUpperCase())
      if (c) {
        setCenter(c)
        setZoom(focusZoom)
      }
    }
  }, [focusCode, focusZoom])

  return (
    <div
      ref={wrapperRef}
      className="relative"
      style={{ background: "transparent" }}
      onDoubleClick={() => setZoom((z) => Math.min(8, Math.round((z + 0.8) * 10) / 10))}
    >
      <ComposableMap projection="geoMercator" style={{ width: "100%", height: "56vw", maxHeight: 560, minHeight: 320 }}>
        <ZoomableGroup
          zoom={zoom}
          minZoom={1}
          maxZoom={8}
          center={center}
          onMove={(params: { zoom: number }) => setZoom(params.zoom)}
          onMoveEnd={(params: { zoom: number }) => setZoom(params.zoom)}
          translateExtent={[
            [-1000, -600],
            [1000, 600],
          ]}
        >
          {/* Transparent capture to dismiss card when clicking outside countries */}
          <rect
            x={-1000}
            y={-600}
            width={2000}
            height={1200}
            fill="transparent"
            onClick={() => onSelect?.(null)}
          />
          <Geographies geography={TOPO_URL}>
            {({ geographies }: { geographies: Array<Feature<Geometry, { id?: string | number }>> }) => {
              let bubbleCentroid: [number, number] | null = null
              // rebuild centroid map for focus
              const map = new Map<string, [number, number]>()

              const nodes = geographies.map((geo: Feature<Geometry, { id?: string | number }>, idx: number) => {
                const idNum = Number(geo.id)
                const code2 = (idToIso2[idNum] || "").toUpperCase()
                const code3 = (idToIso3[idNum] || "").toUpperCase()
                const code = code2 || code3
                const isInDataset = !!detailsByCode?.[code2] || !!detailsByCode?.[code3]

                const isHighlighted =
                  isInDataset && (highlightCodes?.includes(code2) || highlightCodes?.includes(code3))
                const isSelected = !!selectedCode && (code2 === selectedCode || code3 === selectedCode)

                if (activeKey && (code2 === activeKey || code3 === activeKey)) {
                  try {
                    bubbleCentroid = geoCentroid(geo) as [number, number]
                  } catch {
                    bubbleCentroid = null
                  }
                }

                try {
                  const c = geoCentroid(geo) as [number, number]
                  if (code2) map.set(code2, c)
                  if (code3) map.set(code3, c)
                } catch {}


                const name = codeToName[code] || code

                const effectiveFill = isSelected || isHighlighted ? fillSelected : fillDefault
                const effectiveStroke = isSelected || isHighlighted ? strokeSelected : strokeDefault
                const effectiveStrokeWidth = isSelected || isHighlighted ? strokeWidthSelected : strokeWidthDefault

                return (
                  <Geography
                    key={(geo as Feature<Geometry, { id?: string | number }> & { rsmKey?: string }).rsmKey || geo.id || `geo-${idx}`}
                    geography={geo}
                    role="button"
                     tabIndex={isInDataset && interactionsEnabled ? 0 : -1}
                    aria-label={`Country: ${name}`}
                    onClick={() => {
                       if (!isInDataset || !code) return
                      onSelect?.(code2 || code3)
                    }}
                    style={{
                      default: {
                        fill: effectiveFill,
                        stroke: effectiveStroke,
                        strokeWidth: effectiveStrokeWidth,
                        outline: "none",
                         pointerEvents: isInDataset ? "auto" : "none",
                         cursor: isInDataset ? "pointer" : "default",
                      },
                      hover: {
                        fill: fillHover,
                        outline: "none",
                      },
                      pressed: {
                        fill: fillSelected,
                        outline: "none",
                      },
                    }}
                  />
                )
              })

              codeToCentroidRef.current = map

              // Apply precise overrides to the centroid map
              for (const k in CENTROID_OVERRIDES) {
                map.set(k, CENTROID_OVERRIDES[k])
              }
              // If active is a tiny territory, ensure bubbleCentroid exists so the card shows
              if (!bubbleCentroid && activeKey) {
                const c = map.get(activeKey)
                if (c) bubbleCentroid = c as [number, number]
              }

              // Build fallback markers for territories missing in topojson
              const missingMarkers: Array<{ code: string; center: [number, number] }> = []
              const FORCE_MARKER_CODES = new Set<string>(["AS", "AX", "AD", "AG", "AI"]) // small territories to always mark
              if (detailsByCode) {
                const present = new Set(Array.from(map.keys()))
                for (const k of Object.keys(detailsByCode)) {
                  const ku = k.toUpperCase()
                  if (!present.has(ku)) {
                    const override = CENTROID_OVERRIDES[ku]
                    if (override) {
                      missingMarkers.push({ code: ku, center: override })
                      map.set(ku, override)
                    } else {
                      const feat = (worldCountries as Array<{ cca2?: string; cca3?: string; type?: string; geometry?: unknown }>).find(
                        (f) => f.cca2?.toUpperCase?.() === ku || f.cca3?.toUpperCase?.() === ku
                      )
                      try {
                        if (feat && feat.type && feat.geometry) {
                          const c = geoCentroid(feat as unknown as Feature) as [number, number]
                          if (Array.isArray(c)) {
                            missingMarkers.push({ code: ku, center: c })
                            map.set(ku, c)
                          }
                        }
                      } catch {}
                    }
                  }
                }
              }

              // Force markers for tiny countries even if present in topojson
              const forcedMarkers: Array<{ code: string; center: [number, number] }> = []
              for (const code of FORCE_MARKER_CODES) {
                const override = CENTROID_OVERRIDES[code]
                const c = override || map.get(code)
                if (c) {
                  forcedMarkers.push({ code, center: c })
                } else {
                  const feat = (worldCountries as Array<{ cca2?: string; cca3?: string; type?: string; geometry?: unknown }>).find(
                    (f) => f.cca2?.toUpperCase?.() === code || f.cca3?.toUpperCase?.() === code
                  )
                  try {
                    if (feat && feat.type && feat.geometry) {
                      const cc = geoCentroid(feat as unknown as Feature) as [number, number]
                      if (Array.isArray(cc)) forcedMarkers.push({ code, center: cc })
                    }
                  } catch {}
                }
              }

              return (
                <>
                  {nodes}
                  {/* Render fallback markers for missing territories */}
                  {missingMarkers.map(({ code, center }) => {
                    const isHighlighted = highlightCodes?.includes(code)
                    const isSelected = !!selectedCode && code === selectedCode
                    const color = isSelected || isHighlighted ? strokeSelected : strokeDefault
                    return (
                      <Marker key={`mk-${code}`} coordinates={center}>
                        <circle
                          r={3.2}
                          fill={color}
                          stroke={color}
                          strokeWidth={1}
                          onClick={() => onSelect?.(code)}
                          style={{ cursor: "pointer" }}
                        />
                      </Marker>
                    )
                  })}
                  {/* Always show small forced markers */}
                  {forcedMarkers.map(({ code, center }) => {
                    const isHighlighted = highlightCodes?.includes(code)
                    const isSelected = !!selectedCode && code === selectedCode
                    const color = isSelected || isHighlighted ? strokeSelected : strokeDefault
                    return (
                      <Marker key={`fmk-${code}`} coordinates={center}>
                        <circle
                          r={3.4}
                          fill={color}
                          stroke={color}
                          strokeWidth={1}
                          onClick={() => onSelect?.(code)}
                          style={{ cursor: "pointer" }}
                        />
                      </Marker>
                    )
                  })}
                  {bubbleCentroid && activeDetails && (
                    <Marker coordinates={bubbleCentroid}>
                      <motion.circle
                        r={10}
                        fill="transparent"
                        stroke={accentColor}
                        strokeWidth={2}
                        initial={{ opacity: 0.6, scale: 0.8 }}
                        animate={{ opacity: [0.6, 0, 0.6], scale: [0.9, 1.6, 0.9] }}
                        transition={{ duration: 1.6, repeat: Number.POSITIVE_INFINITY, ease: "easeOut" }}
                      />
                      <circle r={3} fill={accentColor} />
                      <foreignObject x={12} y={-90} width={220} height={98}>
                        <div
                          className="rounded-xl border border-white/10 bg-black/80 backdrop-blur px-3 py-2 text-xs text-white shadow"
                          style={{ width: 210 }}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <div className="h-4 w-6 overflow-hidden rounded-[2px] bg-white/10 flex items-center justify-center">
                              {activeDetails.flag && /^https?:/.test(activeDetails.flag) ? (
                                <Image src={activeDetails.flag} alt="" width={24} height={16} />
                              ) : (
                                <span className="text-base leading-none">{activeDetails.flag || "🌐"}</span>
                              )}
                            </div>
                            <span className="font-semibold">{activeDetails.name}</span>
                            <span className="ml-auto rounded-full bg-white/10 px-2 py-0.5 text-[10px] text-white/70">
                              {activeDetails.code}
                            </span>
                          </div>
                          <div className="text-white/90 space-y-0.5">
                            <div>
                              <span className="text-white/70">Region:</span> {activeDetails.region || "—"}
                            </div>
                            <div>
                              <span className="text-white/70">Capital:</span> {activeDetails.capital || "—"}
                            </div>
                            <div>
                              <span className="text-white/70">Pop:</span> {new Intl.NumberFormat().format(activeDetails.population || 0)}
                            </div>
                          </div>
                          <div className="mt-2 h-0.5 w-12 rounded-full" style={{ backgroundColor: accentColor }} />
                        </div>
                      </foreignObject>
                    </Marker>
                  )}
                </>
              )
            }}
          </Geographies>
        </ZoomableGroup>
      </ComposableMap>

      {/* Zoom controls */}
      <div className="absolute left-3 bottom-3 z-10 flex items-center gap-2 rounded-md border border-white/10 bg-black/40 backdrop-blur px-2 py-1">
        <button
          aria-label="Zoom out"
          className="rounded bg-white/10 text-white px-2 py-1 hover:bg-white/20"
          onClick={() => setZoom((z) => Math.max(1, Math.round((z - 0.5) * 10) / 10))}
        >
          −
        </button>
        <input
          aria-label="Zoom"
          type="range"
          min={1}
          max={8}
          step={0.1}
          value={zoom}
          onChange={(e) => setZoom(parseFloat(e.target.value))}
        />
        <button
          aria-label="Zoom in"
          className="rounded bg-white/10 text-white px-2 py-1 hover:bg-white/20"
          onClick={() => setZoom((z) => Math.min(8, Math.round((z + 0.5) * 10) / 10))}
        >
          +
        </button>
      </div>

      {!interactionsEnabled && (
        <div className="pointer-events-none absolute inset-x-0 bottom-3 flex justify-center">
          <div
            className="rounded-full px-3 py-1 text-xs"
            style={{
              background: "rgba(255,255,255,0.04)",
              boxShadow: "0 0 0 1px rgba(255,255,255,0.06) inset",
              color: "#F1F1EF",
            }}
          >
            Zoom controls: use slider or buttons; preview comes from search or list
          </div>
        </div>
      )}
    </div>
  )
}
