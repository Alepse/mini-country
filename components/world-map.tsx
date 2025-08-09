"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import type { Feature, FeatureCollection, MultiPolygon, Polygon, Geometry, GeoJsonProperties } from "geojson"
import countriesGeo from "world-countries"
import { geoMercator, geoPath } from "d3-geo"
import { select } from "d3-selection"
import { zoom as d3zoom } from "d3-zoom"
import "d3-transition"
import { motion } from "framer-motion"
import Image from "next/image"

type CountryDetails = {
  name: string
  code: string // ISO-3
  region: string
  capital: string
  population: number
  flag: string
}

export default function WorldMap({
  onSelect,
  selectedCode,
  detailsByCode,
  accentColor = "#8B5CF6",
}: {
  onSelect?: (code: string | null) => void
  selectedCode?: string | null
  detailsByCode?: Record<string, CountryDetails>
  accentColor?: string
}) {
  const svgRef = useRef<SVGSVGElement>(null)
  const gRef = useRef<SVGGElement>(null)

  const [hover, setHover] = useState<{ code: string; x: number; y: number } | null>(null)

  const width = 1024
  const height = 560

  const featureCollection = useMemo<FeatureCollection>(() => {
    return {
      type: "FeatureCollection",
      features: (countriesGeo as unknown as Feature[]).filter(
        (f) =>
          (f.geometry?.type === "Polygon" || f.geometry?.type === "MultiPolygon") &&
          f.properties &&
          (f.properties as { cca3?: string }).cca3,
      ),
    }
  }, [])

  const projection = useMemo(() => geoMercator().fitSize([width, height], featureCollection), [featureCollection])
  const path = useMemo(() => geoPath(projection), [projection])

  useEffect(() => {
    if (!svgRef.current || !gRef.current) return
    const svg = select(svgRef.current)
    const g = select(gRef.current)

    const zoom = d3zoom<SVGSVGElement, unknown>()
      .scaleExtent([1, 8])
      .translateExtent([
        [-width, -height],
        [width * 2, height * 2],
      ])
      .on("zoom", (event) => {
        const t = event.transform
        g.attr("transform", t.toString())
      })

    svg.call(zoom)

    // prevent page scroll when zooming over the map
    const node = svgRef.current
    const onWheel = (e: WheelEvent) => {
      if (node && node.matches(":hover")) e.preventDefault()
    }
    node?.addEventListener("wheel", onWheel, { passive: false })
    return () => {
      node?.removeEventListener("wheel", onWheel)
      svg.on(".zoom", null)
    }
  }, [])

  const tooltip = useMemo(() => {
    if (!hover) return null
    const info = detailsByCode?.[hover.code] ?? null
    const fcFeature = (featureCollection.features as Array<Feature<Polygon | MultiPolygon, { cca3?: string; name?: string | { common?: string } }>>).find((ft) => ft.properties?.cca3 === hover.code)
    const fcName = fcFeature?.properties?.name
    const name = info?.name || (typeof fcName === 'string' ? fcName : fcName?.common) || hover.code
    const region = info?.region
    const cap = info?.capital
    const pop = info?.population
    const flag = info?.flag

    return (
      <div
        role="status"
        className="pointer-events-none absolute z-10 rounded-lg border border-white/10 bg-black/80 backdrop-blur px-3 py-2 text-xs text-white shadow"
        style={{ left: hover.x + 12, top: hover.y + 12, maxWidth: 260 }}
      >
        <div className="flex items-center gap-2">
          <div className="h-4 w-6 overflow-hidden rounded-[2px] bg-white/10 flex items-center justify-center">
            {flag ? (
              <Image
                src={flag || "/placeholder.svg"}
                alt=""
                className="h-4 w-auto"
                width={24}
                height={16}
                loading="lazy"
              />
            ) : (
              <span className="text-base leading-none">{"🌐"}</span>
            )}
          </div>
          <span className="font-medium">{name}</span>
          <span className="ml-auto rounded-full bg-white/10 px-2 py-0.5 text-[10px] text-white/70">{hover.code}</span>
        </div>
        {(region || cap || pop) && (
          <div className="mt-1 text-white/70">
            {region && <div>Region: {region}</div>}
            {cap && <div>Capital: {cap}</div>}
            {pop && <div>Pop: {new Intl.NumberFormat().format(pop)}</div>}
          </div>
        )}
        <div className="mt-2 h-0.5 w-10 rounded-full" style={{ backgroundColor: accentColor }} />
      </div>
    )
  }, [hover, detailsByCode, accentColor, featureCollection])

  return (
    <div className="relative" aria-label="Interactive world map">
      {/* Subtle aceternity-like glow background */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(139,92,246,0.12),transparent_45%),radial-gradient(circle_at_70%_80%,rgba(139,92,246,0.08),transparent_45%)]" />
      <svg
        ref={svgRef}
        viewBox={`0 0 ${width} ${height}`}
        className="relative z-0 w-full h-[56vw] max-h-[560px] min-h-[300px] outline-none"
        role="region"
        aria-label="World map"
        tabIndex={0}
        onMouseLeave={() => setHover(null)}
      >
        <rect width={width} height={height} fill="transparent" />
        <g ref={gRef}>
          {(featureCollection.features as Feature<Polygon | MultiPolygon>[]).map((f, idx) => {
            const code = ((f.properties as { cca3?: string }).cca3 as string).toUpperCase()
            const fName = (f.properties as { name?: string | { common?: string } }).name
            const name = (typeof fName === 'string' ? fName : fName?.common) || code
            const isSelected = selectedCode === code
            return (
              <motion.path
                key={code || idx}
                d={geoSafePath(path, f)}
                className="outline-none"
                fill={isSelected ? "rgba(139,92,246,0.28)" : "rgba(255,255,255,0.03)"}
                stroke={isSelected ? accentColor : "rgba(139,92,246,0.25)"}
                strokeWidth={isSelected ? 1.5 : 0.6}
                tabIndex={0}
                role="button"
                aria-label={`Country: ${name}`}
                onMouseMove={(e) => {
                  const svg = e.currentTarget.ownerSVGElement!
                  const { left, top } = svg.getBoundingClientRect()
                  setHover({ code, x: e.clientX - left, y: e.clientY - top })
                }}
                onMouseEnter={(e) => {
                  const svg = e.currentTarget.ownerSVGElement!
                  const { left, top } = svg.getBoundingClientRect()
                  setHover({ code, x: e.clientX - left, y: e.clientY - top })
                }}
                onClick={() => onSelect?.(code)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault()
                    onSelect?.(code)
                  }
                }}
                whileHover={{
                  fill: "rgba(139,92,246,0.18)",
                  transition: { duration: 0.15, ease: "easeOut" },
                }}
              />
            )
          })}
        </g>
      </svg>
      {tooltip}
      {/* Controls */}
      <div className="absolute right-3 bottom-3 z-10 flex items-center gap-2">
        <button
          aria-label="Reset view"
          onClick={() => {
            const g = select(gRef.current)
            g.transition().duration(300).attr("transform", "translate(0,0) scale(1)")
            setHover(null)
            onSelect?.(null)
          }}
          className="rounded-md border border-white/10 bg-black/60 px-2 py-1 text-xs text-white hover:bg-black/80 transition"
        >
          Reset
        </button>
      </div>
    </div>
  )
}

function geoSafePath(p: ReturnType<typeof geoPath>, f: Feature<Geometry, GeoJsonProperties>) {
  try {
    return p(f) || ""
  } catch {
    return ""
  }
}
