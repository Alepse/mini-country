"use client"

import { useEffect, useMemo, useState } from "react"
import dynamic from "next/dynamic"
import { motion } from "framer-motion"
import Image from "next/image"
import { Badge } from "@/components/ui/badge"
import { MapPinned, Search } from "lucide-react"
import Spotlight from "@/components/spotlight"
import BlurFade from "@/components/blur-fade"
import ShinyButton from "@/components/shiny-button"
import localCountries from "@/data/countries.json"
// Flags experiments removed per latest design
import ScrollReveal from "@/components/scroll-reveal"

// Client-only map core (react-simple-maps)
const MapCore = dynamic(() => import("@/components/map-core"), { ssr: false })

type Country = {
  name: string
  code: string // ISO-3
  capital: string
  region: string
  population: number
  flag: string // URL or emoji
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

//

export default function Page() {
  const [query, setQuery] = useState("")
  const [debouncedQuery, setDebouncedQuery] = useState("")
  const [selectedCode, setSelectedCode] = useState<string | null>(null)
  const [hoverCode, setHoverCode] = useState<string | null>(null)
  const [data, setData] = useState<Country[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [regionHighlight, setRegionHighlight] = useState<string[]>([])

  // Load from local countries.json
  useEffect(() => {
    setLoading(true)
    try {
      const json = (localCountries as RawCountryData[]).map((r) => ({
        name: String((typeof r.name === "string" ? r.name : r.name?.common) ?? "").trim(),
        code: String(r.cca3 ?? r.code ?? "").toUpperCase(),
        capital: String(r.capital ?? "").trim(),
        region: String(r.region ?? "").trim(),
        population: Number(r.population ?? 0),
        flag: String(r.flag ?? ""),
      })) as Country[]
        setData(json)
      setError(null)
    } catch {
      setError("Failed to load local countries.json")
      } finally {
      setLoading(false)
    }
  }, [])

  // Debounce the query to avoid excessive filtering/highlighting
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query), 150)
    return () => clearTimeout(t)
  }, [query])

  const filtered = useMemo(() => {
    const q = debouncedQuery.trim().toLowerCase()
    if (!q) return []
    const tokens = q.split(/\s+/).filter(Boolean)
    const score = (c: Country) => {
      const name = c.name.toLowerCase()
      const code = c.code.toLowerCase()
      const capital = (c.capital || "").toLowerCase()
      // priority: name startsWith > word-start includes > code startsWith > capital startsWith > generic includes
      if (name.startsWith(q)) return 0
      if (name.split(/\s+/).some((w) => w.startsWith(q))) return 1
      if (code.startsWith(q)) return 2
      if (capital.startsWith(q)) return 3
      if (tokens.every((t) => name.includes(t))) return 4
      return 99
    }
    return data
      .map((c) => ({ c, s: score(c) }))
      .filter((x) => x.s < 99)
      .sort((a, b) => (a.s - b.s) || a.c.name.localeCompare(b.c.name))
      .map((x) => x.c)
  }, [data, debouncedQuery])

  // When the user types, clear any locked selection and hide hover card
  useEffect(() => {
    const q = debouncedQuery.trim().toLowerCase()
    setSelectedCode(null)
    if (!q) {
      setHoverCode(null)
      return
    }
    setHoverCode(null)
  }, [debouncedQuery])

  const detailsByCode = useMemo(() => {
    const map: Record<string, Country> = {}
    for (const c of data) map[c.code.toUpperCase()] = c
    return map
  }, [data])

  const accent = "#8B5CF6"
  const highlightCodes = useMemo(() => {
    const fromSearch = debouncedQuery.trim().length > 0 ? filtered.map((c) => c.code) : []
    if (regionHighlight.length === 0) return fromSearch
    const s = new Set<string>(fromSearch)
    for (const code of regionHighlight) s.add(code)
    return Array.from(s)
  }, [debouncedQuery, filtered, regionHighlight])
  const [focusCode, setFocusCode] = useState<string | null>(null)

  return (
    <main className="min-h-[100dvh] bg-black text-white ">
      {/* Hero */}
      <section className="relative overflow-hidden p-12 section-reveal">
        <Spotlight className="opacity-50" color={accent} size={520} />
        <div className="container mx-auto px-4 min-h-dvh flex items-center justify-center">
          <div className="max-w-3xl mx-auto text-center py-16 md:py-24">
            <BlurFade delay={0} y={8}>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 mb-4">
                <MapPinned className="w-9 h-9 text-purple-400" aria-hidden="true" />
                <span className="text-xs text-white/70">Mini-Country</span>
              </div>
            </BlurFade>
            <BlurFade delay={0.1} y={10}>
              <h1 className="text-4xl md:text-6xl font-semibold tracking-tight">
                <span className="bg-clip-text text-transparent bg-gradient-to-b from-white to-white/60">
                  Find any country in seconds.
                </span>
              </h1>
            </BlurFade>
            <BlurFade delay={0.2} y={10}>
              <p className="mt-4 text-white/70 md:text-lg">
                Type a country and see it light up. Click to dive into details.
              </p>
              <div className="mt-4 flex justify-center gap-2 text-xs text-white/70">
                <span className="rounded-full bg-white/5 border border-white/10 px-2 py-1">⌘K Quick search</span>
                <span className="rounded-full bg-white/5 border border-white/10 px-2 py-1">Scroll to zoom</span>
                <span className="rounded-full bg-white/5 border border-white/10 px-2 py-1">Drag to pan</span>
              </div>
            </BlurFade>
            <BlurFade delay={0.3} y={12}>
              <div className="mt-8 flex items-center justify-center gap-3">
                <ShinyButton asChild>
                  <a href="#map-and-search" aria-label="Start exploring the interactive map">
                    Start Exploring
                  </a>
                </ShinyButton>
              </div>
              {/* subtle brand below button */}
              <div className="mt-6 flex items-center justify-center gap-2 opacity-60">
                <Image src="/gg.svg" alt="GROWGAMI logo" width={24} height={24} className="rounded-full" />
                <span className="text-sm tracking-wide text-white/80">by <span className="font-semibold">GROWGAMI</span></span>
              </div>
            </BlurFade>

            {/* Subtle scroll hint */}
            <motion.div
              className="mt-16 flex justify-center"
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                delay: 0.6,
                duration: 0.6,
                ease: "easeOut",
                repeat: Number.POSITIVE_INFINITY,
                repeatType: "reverse",
              }}
              aria-hidden="true"
            >
              <div className="h-6 w-px bg-white/15" />
            </motion.div>
          </div>
        </div>
     

        {/* Map + Search inside hero to share background */}
        <section id="map-and-search" className="relative z-10 scroll-mt-24 md:scroll-mt-32 p-9 section-reveal-x">
          <div className="container mx-auto px-4 pt-12 md:pt-16 pb-8">
            <ScrollReveal y={30}>
            {/* Compact insights moved above map/search */}
            <div className="mb-6">
              <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-md p-4 md:p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_8px_30px_rgba(0,0,0,0.22)]">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <h3 className="text-lg font-semibold">Global insights</h3>
                  <button
                    className="text-[11px] rounded-md border border-white/10 bg-white/5 px-2 py-1 text-white/70 hover:bg-white/10"
                    onClick={() => setRegionHighlight([])}
                    aria-label="Clear region filters"
                  >
                    Clear filters
                  </button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4 text-sm">
                  <div className="rounded-lg border border-white/10 bg-white/5 p-3">
                    <div className="text-[11px] text-white/60">Countries</div>
                    <div className="mt-0.5 text-xl font-semibold">{data.length}</div>
                  </div>
                  <div className="rounded-lg border border-white/10 bg-white/5 p-3">
                    <div className="text-[11px] text-white/60">Regions</div>
                    <div className="mt-0.5 text-xl font-semibold">{Array.from(new Set(data.map(d => d.region || ""))).filter(Boolean).length}</div>
                  </div>
                  <div className="rounded-lg border border-white/10 bg-white/5 p-3">
                    <div className="text-[11px] text-white/60">Total population</div>
                    <div className="mt-0.5 text-xl font-semibold">{new Intl.NumberFormat().format(data.reduce((s, d) => s + (d.population || 0), 0))}</div>
                  </div>
                  <div className="rounded-lg border border-white/10 bg-white/5 p-3">
                    <div className="text-[11px] text-white/60">With capitals</div>
                    <div className="mt-0.5 text-xl font-semibold">{data.filter(d => (d.capital || "").trim().length > 0).length}</div>
                  </div>
                </div>
                <div className="mb-2 text-xs text-white/70">Explore by region</div>
                <div className="flex flex-wrap gap-2">
                  {Array.from(new Set(data.map(d => d.region || ""))).filter(Boolean).map(region => {
                    const codes = data.filter(d => d.region === region).map(d => d.code)
                    const active = regionHighlight.length > 0 && codes.every(c => regionHighlight.includes(c))
                    return (
                      <button
                        key={region}
                        onClick={() => {
                          setRegionHighlight(active ? [] : codes)
                          if (codes.length > 0) setFocusCode(codes[0])
                          document.getElementById("map-and-search")?.scrollIntoView({ behavior: "smooth", block: "start" })
                        }}
                        className={`rounded-full px-3 py-1 text-xs border transition cursor-pointer ${active ? "border-purple-400/60 bg-purple-500/10 text-white" : "border-white/10 bg-white/5 text-white/80 hover:bg-white/10"}`}
                        title={`Highlight ${region}`}
                      >
                        {region} <span className="ml-1 text-white/50">({codes.length})</span>
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
            <div className="grid md:grid-cols-5 gap-6 items-start">
              <div id="map-focus" className="md:col-span-3 bg-black rounded-xl ring-[1px] ring-white/10">
                    <MapCore
                      accentColor="#5A3FB9"
                      selectedCode={selectedCode}
                  onSelect={(code) => {
                    setSelectedCode(code)
                  }}
                  highlightCodes={highlightCodes}
                  activeCode={hoverCode || selectedCode || null}
                  focusCode={focusCode}
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
              <div className="md:col-span-2 bg-black rounded-xl ring-[1px] ring-white/10">
                <div className="text-white p-4 md:p-6 space-y-4 rounded-xl">
                    <div className="space-y-2">
                      <h2 className="text-xl font-medium">Live Search</h2>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Type country name..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        className="w-full pl-9 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-transparent"
                      />
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/50" />
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="secondary" className="bg-white/10 text-white border-white/10">
                        {loading ? "Loading..." : `${filtered.length} result${filtered.length === 1 ? "" : "s"}`}
                      </Badge>
                      {selectedCode && (
                        <Badge variant="outline" className="border-purple-400/50 text-purple-200">
                          Selected: {selectedCode}
                        </Badge>
                      )}
                    </div>
                    {error && <p className="text-xs text-red-300">{error}</p>}
                    <p className="text-xs text-white/50">Tip: Type to auto-preview the first match, then click a country to lock selection. Zoom with the slider or buttons.</p>

                    {/* Results list */}
                    {debouncedQuery.trim().length > 0 && (
                      <div className="mt-3 max-h-64 overflow-auto glass-scrollbar space-y-2 pr-1 rounded-md">
                        {filtered.map((c) => (
                          <button
                    key={c.code}
                            className="w-full flex items-center gap-3 rounded-md border border-white/10 bg-white/5 hover:bg-white/10 px-3 py-2 text-left transition cursor-pointer"
                    onClick={() => {
                      setSelectedCode(c.code)
                              setFocusCode(c.code)
                              // scroll to map
                              document.getElementById("map-focus")?.scrollIntoView({ behavior: "smooth", block: "center" })
                            }}
                          >
                            <span className="inline-flex h-5 w-7 items-center justify-center overflow-hidden rounded-sm bg-white/10">
                              {/^https?:/.test(c.flag) ? (
                                <Image src={c.flag} alt="" width={28} height={20} />
                              ) : (
                                <span className="text-sm leading-none">{c.flag || "🌐"}</span>
                              )}
                          </span>
                            <span className="truncate">{c.name}</span>
                            <span className="ml-auto text-xs text-white/60">{c.code}</span>
                          </button>
                        ))}
                      </div>
                    )}
                      </div>
                      </div>
                    </div>
                        </div>
            </ScrollReveal>
          </div>
        </section>


        {/* Footer inside hero */}
        <footer className="mt-16 border-t-[1px] border-white/10/0 p-9 section-reveal-x">
          <ScrollReveal y={24}>
            <div className="container mx-auto px-4 py-10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Image src="/gg.svg" alt="GROWGAMI" width={28} height={28} className="rounded-full opacity-80" />
              <span className="text-sm text-white/80">GROWGAMI</span>
            </div>
            <div className="text-xs text-white/50">© {new Date().getFullYear()} Mini-Country. All rights reserved.</div>
        </div>
          </ScrollReveal>
        </footer>

        {/* bottom fade for smooth blend into next section */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-b from-transparent to-black/40" />
      </section>

      
    </main>
  )
}
