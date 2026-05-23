# MediBill RMV — Project Guide

Production PWA + Chrome extension for Dr. Rodrigo Múnera Vélez, plastic surgeon in Medellín, Colombia.

## Purpose
Capture patient billing data from photos taken in surgery or consultation, review records, and export to Excel — all from a phone, offline-capable.

## Tech Stack
- **Framework:** Vite + React (no TypeScript)
- **Styling:** Tailwind CSS v4 via @tailwindcss/vite plugin
- **Font:** Outfit (Google Fonts) — no other fonts
- **Colors:** Navy `#172137` and white `#ffffff` — no other colors ever
- **Spreadsheet:** SheetJS (xlsx)
- **Persistence:** IndexedDB via idb
- **AI Vision:** Claude API via Vercel serverless function at `/api/extract`
- **Deployment:** Vercel

## Brand Rules (Non-Negotiable)
- Navy `#172137` background on every screen
- White `#ffffff` text and buttons only
- Outfit font everywhere
- No gradients, no purple, no Inter font, no startup-SaaS patterns
- All UI copy in Spanish
- Monogram "RMV" appears on every primary screen, large, letter-spaced
- Aesthetic: luxury medical, surgical precision — calm and high-trust

## Screen Flow
1. **DatePicker** — pick session date → Continuar
2. **Camera** — capture patient photos one by one → AI extraction → review each
3. **Review** — list all captured patients, edit inline → Exportar
4. **Export** — confirm and download `.xlsx` file → start new session

## Folder Structure
```
src/
  screens/      DatePicker, Camera, Review, Export
  components/   shared UI (Button, Monogram, etc.)
  lib/          indexedDB.js, xlsx.js, extract.js
api/
  extract.js    Vercel edge function — calls Claude claude-opus-4-7 vision
extension/
  manifest.json, popup.html, content.js
public/
  manifest.json (PWA)
```

## Component Conventions
- No default export from barrel index files — import directly from file
- All screens receive props for data + navigation callbacks (no global router library)
- Inline styles used for brand-critical values (colors, font); Tailwind for layout utilities
- Touch targets minimum 64px height
- All form labels visible (no placeholder-only inputs)
- Spanish copy throughout

## Environment Variables
- `ANTHROPIC_API_KEY` — set in Vercel dashboard, never committed

## Commands
```bash
npm run dev      # local dev
npm run build    # production build
npm run preview  # preview production build
```
