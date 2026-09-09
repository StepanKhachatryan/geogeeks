# GeoGeeks

The GeoGeeks LLC website: GIS analysis, hydrological studies, flood modelling and
GIS education in Armenia. Built with Next.js (App Router, TypeScript) and exported
as a static site.

## Commands

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # static export into out/
npm run serve      # serve the built out/ directory locally
npm run lint
npm run typecheck
```

`next.config.ts` sets `output: 'export'` and `trailingSlash: true`, so `npm run build`
writes a complete static site to `out/` — every route becomes `<route>/index.html`.
Deploy the contents of `out/`; no Node server runs in production.

## Routes

| Route | Page |
| --- | --- |
| `/` | Home: rotating product hero and the newest projects |
| `/services` | The three service groups; a card expands into its subsections |
| `/projects` | Sector tiles |
| `/projects/[sector]` | Projects in one sector |
| `/projects/[sector]/[project]` | One project |
| `/about` | Company, team, partners |
| `/contact` | Contact details and social links |

## Where the content lives

All copy and imagery are static data — no CMS, no fetching. Editing these files is
all that is needed to add or change content:

- `src/data/projects.ts` — sectors and projects. Adding a project also updates the
  sector page, the sitemap and (when it is the newest of its sector) the "latest
  projects" row on Home, which is computed rather than hardcoded.
- `src/data/services.ts` — service groups, their cards and subsections.
- `src/data/team.ts`, `src/data/partners.ts`, `src/data/products.ts`.
- `src/i18n/messages.ts` — Armenian and English strings for the interface chrome.

Images live under `public/assets/img/`. A project's `slug` is its URL segment, so
changing one changes a public URL.

## Language

Armenian is the default and the language the static HTML is prerendered in. The nav
toggle switches the interface to English and stores the choice in `localStorage`
(`src/i18n/langStore.ts`). Project and service copy stays Armenian, as in the design
handoff. Locale-prefixed URLs (`/en/...`) are not implemented; adding them would mean
moving the routes under a `[locale]` segment.

## Motion

- **Page transition** — six coloured bars rise over the viewport, the route swaps at
  470 ms while covered, and clicks are ignored until 1100 ms
  (`src/components/TransitionProvider.tsx`). The curtain is created imperatively
  outside the React tree, because a re-render mid-flight restarts the CSS animation.
- **Reveal and parallax** — `[data-reveal]` and `[data-parallax]` elements are driven
  by hooks in `src/hooks/`, re-armed on every route change.
- **Viewport fitting** — the expanded Services panel and the Projects tile grid
  measure the space left by the nav, footer and section padding so they fit without
  scrolling (`src/hooks/useAvailableSpace.ts`).

All three respect `prefers-reduced-motion: reduce`.

## Design source

`docs/design-handoff.md` is the handoff that this implementation follows: tokens,
type scale, motion timings and per-screen behaviour. The interactive prototype it
refers to (`GeoGeeks Site.dc.html`) is not in this repository.
