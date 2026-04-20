# EarthTwin

EarthTwin is a React + TypeScript single-page app that renders a 3D interactive globe and simulates environmental metrics from a user's lifestyle.

This repository contains the frontend app (Vite). The project uses react-three-fiber (three.js) for 3D rendering, Tailwind CSS for styling, and Radix/shadcn UI primitives.

## Quick overview

- Frontend: React + TypeScript, Vite
- 3D: react-three-fiber (three.js)
- UI: Tailwind CSS, Radix primitives, shadcn components
- Snapshot/capture: `src/components/ShareSnapshot.tsx` (special handling for WebGL canvases and SVGs)
- API wrapper: `src/lib/earthApi.ts`

## Recent changes (important)

- Client-side mock fallbacks removed — app expects backend at `http://localhost:5000`.
- Earth globe sizing and masking fixed (canvas rounded to avoid visible corners).
- Snapshot improvements — canvases and inline SVGs are swapped to images before capture; Carbon Score is hidden during capture to produce a globe-only image.

## Local development

Requirements: Node.js (LTS), npm

Install dependencies:

```pwsh
npm install
```

Run dev server:

```pwsh
npm run dev
```

Build for production:

```pwsh
npm run build
```

## Files of interest

- `src/components/EarthGlobe.tsx` — 3D globe and shaders
- `src/components/ShareSnapshot.tsx` — snapshot/capture logic
- `src/components/MetricGauge.tsx` — carbon score gauge
- `src/lib/earthApi.ts` — API wrapper
