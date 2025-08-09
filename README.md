# Mini‑Country

Search the world by country on an interactive, glassy SVG map.

## Setup (≤ 1 min)
- Requirements: Node 20+
- Install: `npm install`
- Dev: `npm run dev` → http://localhost:3000
- Build/Start: `npm run build && npm run start`

## Key design decisions
- Next.js App Router + React 19. The map is client‑only via dynamic import to avoid SSR pitfalls.
- `react-simple-maps` + D3: smooth wheel zoom, drag pan, and double‑click zoom. Background click clears selection/filters.
- Tiny territories (AD, AG, AX, AS, AI) use precise centroid overrides and forced markers so they are always visible and clickable.
- Local data (`data/countries.json`) is the single source of truth; normalized on load. Ranked, debounced search (name/code/capital, multi‑token).
- UI: glassmorphism, spotlight background, scroll‑reveal. Compact “Global insights” (stats + region chips) refocuses the map.
- Perf & a11y: minimal client state, Next Image for flags, focusable geographies, pointer cursor only where interactive.
