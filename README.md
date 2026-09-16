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

## Tools

`/tools/shp-to-dxf` converts a zipped cadastre extract into DXF drawings. It runs
entirely in the visitor's browser: the archive is unzipped with JSZip, read by
`src/lib/shapefile.ts`, and written out by `src/lib/dxf.ts` as AutoCAD R12 ASCII
DXF. Nothing is uploaded, so the feature works on static hosting with no server.

- The archive must hold a `parcel` and/or a `building` layer, matched by file
  name. Either one alone is accepted: a plot may have no buildings on it.
- Each layer produces two files, so a full extract yields four:
  `<layer>_lines.dxf` with the boundaries and `<layer>_points.dxf` with the
  vertices as POINT entities, each corner written once. They are delivered as
  one zip.
- Uploads are capped at 7 MB (`MAX_ZIP_BYTES`); past that the page points to
  geogeeksllc@gmail.com. A non-Latin archive name raises a warning, not an error.
- Output as one POLYLINE per ring, or exploded into LINE segments; Z elevations
  are kept when the source carries them.
- Coordinates are never reprojected. The `.prj` is read only to name the
  coordinate system on screen, because a CAD drawing has to keep the survey
  coordinates it came with.

The parser and writer are plain functions with no browser dependency, so they
can be exercised directly from Node against fixtures generated with pyshp and
validated with ezdxf.

### Paying for a conversion

The tool is free until a verification endpoint is configured. `supabase/` holds
the backend that turns it into a paid tool: a visitor enters the number they pay
from, scans the Idram QR, receives a six-character code over Telegram, and types
it in. `supabase/README.md` covers deployment and says plainly what the gate can
and cannot enforce.

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

## Search engines

Every route ships a canonical URL, its own title, description and social card,
and JSON-LD structured data: the company and the site on every page, plus
breadcrumbs, a service catalogue, sector collections and one record per project.
`src/lib/seo.ts` holds the helpers; `src/app/sitemap.ts` generates
`/sitemap.xml` from the project data, and `public/robots.txt` points to it.
Pages the design leaves without a visible heading carry a screen-reader `h1`
(`.gg-sr-only`), so each one states what it is.

Two steps happen outside the repository:

1. Verify the domain in Google Search Console. For the HTML-tag method, set
   `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` to the token before building; the meta
   tag is then rendered on every page. DNS verification needs no code change.
2. Submit `https://geogeeks.am/sitemap.xml` in Search Console and request
   indexing for the home page. Indexing is Google's decision and takes days to
   weeks; the site cannot force it.

## Design source

`docs/design-handoff.md` is the handoff that this implementation follows: tokens,
type scale, motion timings and per-screen behaviour. The interactive prototype it
refers to (`GeoGeeks Site.dc.html`) is not in this repository.
