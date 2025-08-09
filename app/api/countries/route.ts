import { NextResponse } from "next/server"
import raw from "@/data/countries.json"

type RawCountryData = {
  cca3?: string
  code?: string
  name?: string | { common?: string }
  capital?: string
  region?: string
  population?: number
  flag?: string
}

// Normalize data into a consistent Country shape and deduplicate by ISO-3 code
export async function GET() {
  const seen = new Set<string>()
  const countries = (raw as RawCountryData[])
    .map((r) => {
      const code = String(r.cca3 ?? r.code ?? "").toUpperCase()
      const name = typeof r.name === 'string' ? r.name : r.name?.common || ''
      return {
        name: String(name).trim(),
        code, // ISO-3
        capital: String(r.capital ?? "").trim(),
        region: String(r.region ?? "").trim(),
        population: Number(r.population ?? 0),
        flag: String(r.flag ?? ""), // URL or emoji
      }
    })
    .filter((c) => c.code && !seen.has(c.code) && seen.add(c.code))

  return NextResponse.json(countries)
}
