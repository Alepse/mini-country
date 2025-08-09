"use client"

import { ComposableMap, Geographies, Geography } from "react-simple-maps"
import type { Feature, Geometry } from "geojson"

type CountryDetails = {
  name: string
  code: string
  region?: string
  capital?: string
  population?: number
  flag?: string
}

const TOPO_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json"

export default function SimpleWorldMap({
  onSelect,
  selectedCode,
  detailsByCode,
  accentColor = "#8B5CF6",
  fillDefault = "rgba(255,255,255,0.03)",
  fillHover = "rgba(139,92,246,0.18)",
  fillSelected = "rgba(139,92,246,0.28)",
  strokeDefault = "rgba(139,92,246,0.25)",
  strokeSelected = accentColor,
  strokeWidthDefault = 0.6,
  strokeWidthSelected = 1.5,
}: {
  onSelect?: (code: string | null) => void
  selectedCode?: string | null
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
  return (
    <ComposableMap projection="geoMercator" style={{ width: "100%", height: 360 }}>
      <Geographies geography={TOPO_URL}>
        {({ geographies }: { geographies: Array<Feature<Geometry, { id?: string | number }>> }) =>
          geographies.map((geo: Feature<Geometry, { id?: string | number }>) => {
            const code = String((geo as Feature<Geometry, { id?: string | number }>)?.id ?? "").toUpperCase()
            const isSelected = !!selectedCode && code === selectedCode
            const details = detailsByCode?.[code]
            const name = details?.name || code
            return (
              <Geography
                key={(geo as Feature<Geometry, { id?: string | number }> & { rsmKey?: string }).rsmKey || geo.id}
                geography={geo}
                role="button"
                aria-label={`Country: ${name}`}
                onClick={() => onSelect?.(code)}
                style={{
                  default: {
                    fill: isSelected ? fillSelected : fillDefault,
                    stroke: isSelected ? strokeSelected : strokeDefault,
                    strokeWidth: isSelected ? strokeWidthSelected : strokeWidthDefault,
                    outline: "none",
                  },
                  hover: { fill: fillHover, outline: "none" },
                  pressed: { fill: fillSelected, outline: "none" },
                }}
              />
            )
          })
        }
      </Geographies>
    </ComposableMap>
  )
}


