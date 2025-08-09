import type { Metadata } from "next"
import BackgroundBeams from "@/components/background-beams"
import Tilt from "@/components/tilt"
import MapOrnaments from "@/components/map-ornaments"
import countries from "@/data/countries.json"
import MapCore from "@/components/map-core"

export const metadata: Metadata = {
  title: "World Map • Mini-Country Viewer",
  description:
    "Flat SVG map with zoom-gated interactivity, pulsing markers, and subtle micro-interactions on a dark theme.",
}

type Country = {
  name: string
  code: string // ISO-3
  region?: string
  capital?: string
  population?: number
  flag?: string
}

type RawCountryData = {
  cca3?: string
  code?: string
  name?: string | { common?: string }
  capital?: string
  region?: string
  population?: number
  flag?: string
}

export default function MapPage() {
  const data: Country[] = (countries as RawCountryData[]).map((r) => ({
    name: typeof r.name === 'string' ? r.name : r.name?.common || '',
    code: String(r.cca3 ?? r.code ?? "").toUpperCase(),
    region: r.region ?? "",
    capital: r.capital ?? "",
    population: Number(r.population ?? 0),
    flag: String(r.flag ?? ""),
  }))
  const detailsByCode: Record<string, Country> = {}
  for (const c of data) detailsByCode[c.code] = c // normalized map for O(1) lookups [^2]

  return (
    <div style={{ backgroundColor: "#010101", color: "#F1F1EF" }}>
      <div className="relative min-h-[100dvh]">
        <BackgroundBeams />
        <div className="mx-auto max-w-6xl px-4 py-10 md:py-14">
          <header className="mb-6 md:mb-8">
            <h1 className="text-2xl md:text-3xl font-semibold">World Map</h1>
            <p className="text-sm opacity-70">
              Zoom in to interact. Hover for details, click to drop a pulsing marker. Accent: #5A3FB9
            </p>
          </header>

          <Tilt className="rounded-2xl">
            <div
              className="relative rounded-2xl"
              style={{
                background: "rgba(255,255,255,0.03)",
                boxShadow:
                  "0 0 0 1px rgba(255,255,255,0.06) inset, 0 10px 40px rgba(0,0,0,0.25), 0 0 20px rgba(90,63,185,0.12)",
              }}
            >
              <div className="p-3 md:p-4">
                <div className="relative">
                  <MapOrnaments />
                  <MapCore
                    accentColor="#5A3FB9"
                    detailsByCode={detailsByCode}
                    fillDefault="rgba(241,241,239,0.06)"
                    fillHover="rgba(90,63,185,0.22)"
                    fillSelected="rgba(90,63,185,0.28)"
                    strokeDefault="rgba(90,63,185,0.35)"
                    strokeSelected="rgba(90,63,185,0.9)"
                    strokeWidthDefault={0.65}
                    strokeWidthSelected={1.5}
                  />
                </div>
              </div>
            </div>
          </Tilt>
        </div>
      </div>
    </div>
  )
}
