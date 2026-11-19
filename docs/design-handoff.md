# Handoff: GeoGeeks website (page-based, animated)

## Overview
A redesign of the GeoGeeks website (`github.com/StepanKhachatryan/geogeeks`, branch `main`). The current live site is a multi-file static HTML site with a scrolling home page, separate `services.html` / `projects.html` / `about.html` / `contact.html` pages and per-sector project pages under `projects/`.

The redesign keeps all real content from that repo but restructures the site as a **single-page-app-style page router with animated transitions**: Home, Services, Projects, About, Contact — each rendered as a full page, never scrolled to. Sector project lists and project detail views are pages too, not modals.

Target implementation: **React / Next.js** (chosen by the site owner). The existing repo is plain static HTML — this handoff replaces it.

## About the Design Files
The files in this bundle are **design references created in HTML** — a working prototype that shows the intended look and behaviour. They are *not* production code to copy verbatim.

`GeoGeeks Site.dc.html` runs on a proprietary preview runtime (`support.js`, `<x-dc>`, `<sc-for>`, `<sc-if>`, `{{ }}` holes). Do not port that runtime. Read the file as a spec: the markup shows structure and exact inline styles, the `class Component` block at the bottom holds all data (projects, services, team, partners) and all behaviour.

The task is to **recreate this design in a Next.js app** using its own conventions (components, CSS modules / Tailwind / styled-components — whatever the team prefers), with the content and values documented below.

## Fidelity
**High-fidelity.** Colors, typography, spacing, animation timings and copy are final. Recreate pixel-for-pixel. All copy is Armenian with an English translation available via a language toggle (see *Internationalisation*).

## Design Tokens

### Colors
| Token | Hex | Use |
| --- | --- | --- |
| Teal (primary) | `#0c8495` | Primary buttons, active accents, links, curtain bars |
| Green (secondary) | `#00a97a` | Hover state of primary, section kickers, curtain bars |
| Yellow (accent) | `#f7db5d` | Highlight accents, selection background, curtain bar |
| Warm grey | `#605c5c` | Secondary text, curtain bar |
| Ink | `#16302c` | Body text, headings, active nav text and borders |
| Body text | `#3f4f4b` | Paragraph text inside panels |
| Muted label | `#95a5a6` | Small uppercase metadata labels |
| Surface | `#ffffff` | Page background, cards |
| Off-white | `#fbfcfb` | Services section background, inactive chips |
| Tint | `#eef4f2` | Chip backgrounds, tech tags |
| Tint (yellow) | `#fdf6d9` | Yellow chip background |
| Hover grey | `#f2f5f4` | Nav / secondary button hover |

Common alphas: borders `rgba(22,48,44,0.10)`, dividers `rgba(22,48,44,0.09)`, card shadow `0 4px 14px rgba(22,48,44,0.05)`, raised shadow `0 18px 50px rgba(22,48,44,0.07)`, hover shadow `0 24px 48px rgba(22,48,44,0.10)`, modal shadow `0 40px 90px rgba(10,38,36,0.35)`.

### Typography
- Single family: **Noto Sans Armenian** (`https://fonts.googleapis.com/css2?family=Noto+Sans+Armenian:wght@300..900&display=swap`), fallback `system-ui, sans-serif`.
- Body: 16px / line-height 1.6, color `#16302c`, `-webkit-font-smoothing:antialiased`.
- Page/section headings: `clamp(26px, 3.4vw, 44px)`, weight 700, letter-spacing `-0.02em`.
- Hero title (over image): `clamp(19px, 1.9vw, 26px)`, weight 700, line-height 1.2.
- Hero description: `clamp(13px, 0.95vw, 15px)`, line-height 1.55.
- Card titles: 16–17px / 700. Body copy in panels: 15–16px / 1.65–1.8.
- Kickers: 11–12px, weight 700–800, `letter-spacing:0.14–0.16em`, uppercase.
- Metadata labels: 11px, `letter-spacing:0.1em`, uppercase, `#95a5a6`.

### Radii & spacing
- Radii: 8px (buttons, chips), 10px (pill buttons), 12–14px (small cards), 16–18px (media, tiles), 20px (large panels), 999px (dots/badges), 50% (avatars).
- Section padding: `clamp(20px, 2.6vw, 38px) clamp(14px, 3vw, 40px)` (Projects, Services), `clamp(56px, 7vw, 110px)` vertical for About/Contact/Partners; About top padding is reduced to `clamp(28px, 3.4vw, 56px)`.
- Content max width: 1500px (1300px for partners, 1200px for contact), centred.
- Grid gaps: 12–26px depending on density.

### Motion
| Name | Spec |
| --- | --- |
| `gg-curtain` | `0% translateY(101%) → 40% translateY(0) → 60% translateY(0) → 100% translateY(-101%)`; per-bar duration `0.85–1.09s`, easing `cubic-bezier(.76,0,.24,1)`, per-bar delay `i × 0.045s` |
| `gg-pagein` | `opacity 0 / translateY(26px) → opacity 1 / translateY(0)`, 0.8s `cubic-bezier(.2,.7,.2,1)` |
| Scroll reveal | element starts `opacity:0; translateY(22px)`, transitions to visible over 0.7s `cubic-bezier(.2,.7,.2,1)`, staggered ~60ms |
| Card hover | `translateY(-4px…-8px)` + shadow, 0.45s `cubic-bezier(.2,.7,.2,1)` |
| Image hover zoom | `scale(1.07–1.08)`, 0.6–1.2s `cubic-bezier(.2,.7,.2,1)` |
| Hero cross-fade | image/title/description drop to `opacity:0.08` then back to 1 over 0.8s |
| Parallax | elements with a parallax factor translate by `scrollY × factor` (hero image `-0.03`, decorative blobs `0.06–0.08`) |

## Screens / Views

### Global chrome

**Top navigation** (sticky, full width, white, bottom border `rgba(22,48,44,0.10)`, height ~72px, padding `clamp(14px,3vw,40px)`, `z-index` above content)
- Left: GeoGeeks logo image (`assets/img/GeoGeeks_logo.png`, 40px) + wordmark, clicking returns Home.
- Right: buttons `Գլխավոր` / `Ծառայություններ` / `Նախագծեր` / `Մեր մասին` / `Կապ`, then a language toggle showing `ENG`/`ՀԱՅ`.
- Nav item styling: `padding:9px 14px; border-radius:8px; font-size:15px; font-weight:600; color:#16302c;` — **always dark text, never blue**.
- Active item: `background:#ffffff; border:1px solid #16302c` (inactive: transparent background, transparent 1px border so nothing shifts).
- Hover: `background:#f2f5f4` only. No color change.
- Contact button uses the same treatment at `font-weight:700`.
- The nav is always visible (no hide-on-scroll).

**Page transition curtain**
- Six equal-width vertical bars covering the viewport, `position:fixed; inset:0; display:flex; z-index:3000; pointer-events:none`.
- Bar colors in order: `#0c8495`, `#00a97a`, `#f7db5d`, `#0c8495`, `#00a97a`, `#605c5c`.
- On any page change each bar runs `gg-curtain` with its own duration and delay, so the columns rise at different speeds, hold, then exit upward.
- The page content swaps at ~470ms (while covered), scrolls to top, and replays `gg-pagein`. The transition lock releases at 1100ms.
- **Implementation note:** in the prototype the curtain is created imperatively and appended to `document.body`, deliberately outside the React tree, because re-renders during the transition restart CSS animations. In Next.js, render it in a portal with a `key` that changes per transition, or use a Framer Motion `AnimatePresence` exit animation — but keep it out of the re-rendering subtree.

**Footer** — 34px padding, top border, logo + copyright left, social links right. No "back to top" link (the site does not scroll between sections).

---

### 1. Home (`page: 'home'`)

**Hero — full-width product showcase**
- A single rounded rectangle: `width:100%; height:clamp(360px,46vw,560px); border-radius:20px; overflow:hidden; box-shadow:0 22px 60px rgba(22,48,44,0.14)`, with parallax factor `-0.03`.
- Background image fills it (`background-size:cover; center`), cross-fading between slides.
- Overlay wash: `linear-gradient(to top right, rgba(255,255,255,0.35), rgba(255,255,255,0) 55%)`.
- Caption panel, bottom-left, inset `clamp(18px,3vw,46px)` from both edges (not flush to the corner): `max-width:min(92%,520px); padding:clamp(16px,1.8vw,24px); border-radius:16px; background:rgba(255,255,255,0.22); backdrop-filter:blur(16px); box-shadow:0 16px 40px rgba(22,48,44,0.12); border:1px solid rgba(255,255,255,0.32)`.
- Panel contains: title, description, a small CTA (`padding:7px 13px; border-radius:8px; background:#0c8495; color:#fff; font-size:12px; font-weight:700`, hover `#00a97a`) and the slide dots (active dot 34px wide `#0c8495`, inactive 10px `rgba(22,48,44,0.18)`, 8px tall, pill).
- Two slides, auto-advancing every 7s (paused while an overlay/other page is active), also clickable via dots:

  1. **Բերքատեղ** — image `assets/img/products/berqategh.jpg`, link `https://berqategh.am/`
     > Քարտեզի վրա հիմնված հարթակ հայկական բերքի համար․ արտադրողները տեղադրում են իրենց ապրանքը՝ մեծածախ և մանրածախ գներով, քանակով և տեղանքով, իսկ գնորդները գտնում են դրանք քարտեզի վրա։
  2. **Ջրհեղեղների տեղեկատվական հարթակ** — image `assets/img/products/fiparmenia.jpg`, link `https://fiparmenia.netlify.app/`
     > Մեր նախաձեռնությունը՝ հավաքագրում է սոցիալական հարթակներում օգտատերերի հրապարակած ջրհեղեղների վերաբերյալ նյութերը և քարտեզագրում մեկ ընդհանուր բազայում։

  CTA label: `Բացել հարթակը →` / `Open the platform →`.

**Վերջին նախագծեր** (below hero, `margin-top:clamp(48px,6vw,84px)`)
- Heading `clamp(20px,2vw,28px)/700`, then a `repeat(auto-fit, minmax(280px,1fr))` grid, 20px gap, of three project cards.
- Selection rule: take the **most recent project from each sector by year**, excluding the `our` (own-initiative) sector since it already appears in the hero, then sort those by year descending and show the top three. This must be computed, not hardcoded — the project list will grow.
- Card: image (16/10), title, client, year; hover lifts the card and zooms the image. Clicking opens that project's detail page.

---

### 2. Services (`page: 'services'`)

No section heading or kicker — the cards are the content.

**Idle state** — three large cards, `repeat(auto-fit, minmax(300px,1fr))`, 22px gap. Card: white, `border-radius:18px`, 1px border `rgba(22,48,44,0.10)`, image top, then title, description, and a row of chips. Whole card is clickable (cursor pointer); hover `translateY(-8px)` + shadow. **No "More" button** — the card itself opens the subsections.

| Card | Image | Chips |
| --- | --- | --- |
| Աշխարհագրական տեղեկատվական համակարգերի (GIS) ծառայություններ | `serv_gis.jpg` | GIS, RS, Earth Engine |
| Ջրային ռեսուրսների և հիդրոլոգիական ծառայություններ | `serv_hydro.jpg` | HEC-HMS, HEC-RAS, DEM / DTM |
| GIS կրթություն | `serv_edu.jpg` | QGIS, ArcGIS, Web քարտեզներ |

**Expanded state** — when a card is clicked the layout becomes a two-band grid sized to fit the viewport with **no page scroll** (`grid-template-rows: auto minmax(0,1fr)`, height measured from `window.innerHeight` minus nav, footer and section padding; falls back to `auto` under ~620px of available height):
- **Top band:** the three services collapse into compact horizontal cards (82px image strip + title + a small state label `Բացված` / `Ավելին`). The active one gets `border:2px solid #0c8495; background:#eef4f2` and a teal shadow. **Order is fixed** — cards must not reorder when one is selected. Clicking another compact card switches directly to its subsections (no need to close first).
- **Bottom band:** a white rounded panel (`border-radius:20px`, 1px border, `box-shadow:0 18px 50px rgba(22,48,44,0.07)`) with a chip row of that service's subsections plus a `Փակել` button, and below it a two-column body: scrollable text (intro paragraph + a list of `<strong>label</strong> text` rows separated by 1px dividers) and a square-ish image.

Subsections:

| Service | Subsections | Image |
| --- | --- | --- |
| GIS | `GIS վերլուծություն`, `Հեռահար զոնդավորում (RS)` | `serv_gis_01.jpg`, `serv_rs_01.png` |
| Hydro | `Հիդրոլոգիական հետազոտություն`, `Ջրհեղեղների մոդելավորում` | `serv_hydro_01.jpg`, `serv_flood_01.png` |
| Education | `GIS դասընթացներ` | `serv_edu_01.jpg` |

Full copy for each subsection is in `serviceGroups()` in the prototype's logic class — port it verbatim.

---

### 3. Projects (`page: 'projects'`)

No heading or kicker. A uniform tile grid of the eight sectors:
- `grid-template-columns: repeat(auto-fill, minmax(min(100%,250px), 1fr))`, gap `clamp(14px,1.6vw,22px)`.
- Row height is computed so all eight tiles fit the viewport without scrolling: `max(120, (availableHeight − 20×(rows−1)) / rows)` px, where `rows = ceil(8 / columns)` and columns is derived from available width. All tiles are the same size — earlier random-size variants were rejected.
- Tile: rounded 16px, full-bleed background image, dark gradient scrim at the bottom, sector name in white 700 plus a small `Դիտել` label in `#f7db5d`. Hover: `translateY(-8px)`, teal shadow, image `scale(1.08)`.

Sectors and images (`assets/img/projects_img/`): Հիդրոլոգիական հետազոտություններ `hydro_projects.jpg`, Ջրհեղեղների մոդելավորում և ռիսկի գնահատում `flood_projects.jpg`, Ջրային ռեսուրսների կառավարում `wr_projects.jpg`, Քաղաքաշինություն `urban_projects.png`, Գյուղատնտեսություն `agri_projects.jpg`, Անտառային ոլորտ `forest_projects.JPG`, GIS կրթություն `edu_projects.jpg`, Մեր նախագծերը `our_projects.jpg`.

**Sector page** (a page, not a modal) — a header row with only a `← Հետ` button on the right (no sector title, no kicker), then a `repeat(auto-fill, minmax(360px,1fr))` grid of project cards (3/2 aspect, image with a frosted white caption bar at the bottom). Empty sectors show `Այս ոլորտում դեռ հրապարակված նախագիծ չկա:`.

**Project detail page** — header with `← Հետ` (returns to the sector page), then two columns: image (`min-height:clamp(260px,32vw,460px)`, radius 18) and a text column with title (`clamp(20px,2.2vw,30px)`), `Պատվիրատու՝ …`, a divider row with `Տարեթիվ` and `Տևողություն`, the description, and technology tags (`background:#eef4f2; color:#0c8495; border-radius:6px`).

All project records (title, client, year, duration, tech, description, card image, detail image) live in `sectors()` in the prototype — 13 projects across 8 sectors, ported from `projects/*.html` in the repo. Treat this as seed data; **the counts of projects, sectors, team members and partners must be data-driven so they can grow.**

---

### 4. About (`page: 'about'`)

Teal (`#0c8495`) section, white text, decorative radial blob top-left with parallax `0.08`.

- **Intro panel:** a white card (`border-radius:20px; padding:clamp(24px,3vw,44px); box-shadow:0 18px 50px rgba(10,38,36,0.18)`) holding two columns — heading `GeoGeeks-ը հիմնադրվել է 2021 թվականին։` in `#16302c`, and one paragraph in `#3f4f4b`:
  > Մեր տեսլականն է մասնավոր և հանրային հատվածին մատուցել նոր որակի տեխնոլոգիական և գիտահեն հետազոտական ծառայություններ քաղաքաշինության, գյուղատնտեսության, աղետների ռիսկի, շրջակա միջավայրի և կրթության ոլորտներում։ Նոր տեխնոլոգիաներով մենք թեթևացնում ենք այս ոլորտների խնդիրները և ահռելի թվացող բեռը՝ լուծումները վերցնելով մեր վրա։
  No "Մեր մասին" kicker.
- **Մեր թիմը:** `repeat(auto-fit, minmax(220px,1fr))`, 24px gap. Each member is a **borderless, background-free** column (only `translateY(-6px)` on hover): 132px circular avatar with a 3px `rgba(255,255,255,0.55)` ring, name (17/700), role (14px, `rgba(255,255,255,0.78)`), and a LinkedIn icon button (`rgba(255,255,255,0.16)`, hover `#f7db5d`).

  | Name | Role | Image |
  | --- | --- | --- |
  | Ստեփան Խաչատրյան | Հիմնադիր · Հիդրոլոգ և ԱՏՀ վերլուծաբան | `team_01.jpg` |
  | Հայկ Խաչատրյան | ԱՏՀ մասնագետ | `team_02.jpg` |
  | Արամ Զաքարյան | Գեոդեզիստ | `team_03.jpg` |

- **Մեզ վստահել են** (partners, white section below): heading only — same size as a section heading (`clamp(26px,3.4vw,44px)`, 700) in `#00a97a`. No kicker, no "Ում հետ ենք աշխատում" line.
  - Grid `repeat(auto-fit, minmax(150px,1fr))`, gap `34px 26px`, centred.
  - Each logo is an `<a target="_blank">`, 118px tall, containing a 132×80 contain-fitted logo **in full color** (no grayscale filter, full opacity) and a hidden caption below it (11.5px/700, `#16302c`).
  - On hover, that logo scales to `1.22`, gains a white background and `0 18px 44px rgba(22,48,44,0.16)`, and its caption fades in. **Other logos do not move or shrink.**

  16 partners with links — see `partners` in the prototype logic (`assets/img/partners/`). Note `client_16.svg` is a monogram placeholder generated for a sole proprietor with no logo of their own.

---

### 5. Contact (`page: 'contact'`)

No heading and no "Պատմեք…" line — the cards are the content: contact details (email, phone, address), a social block, and a form/CTA panel, in `repeat(auto-fit, minmax(300px,1fr))` cards with 22px gap on `#fbfcfb`.

## Interactions & Behavior
- **Routing:** five top-level pages plus two nested project views. In Next.js use real routes (`/`, `/services`, `/projects`, `/projects/[sector]`, `/projects/[sector]/[project]`, `/about`, `/contact`) so links are shareable; run the curtain animation on route change.
- **Transition lock:** ignore nav clicks while a transition is in flight (1100ms window).
- **Scroll reveal:** an IntersectionObserver adds the visible state to `[data-reveal]` elements; re-run after every page change.
- **Parallax:** on scroll, translate `[data-parallax]` elements by `scrollY × factor` (rAF-throttled). Disable under `prefers-reduced-motion`.
- **Hero rotation:** 7s interval; reset the index when the page changes; pause while a sector/service view is open.
- **Viewport fitting:** Services (expanded) and Projects measure available height on mount and on resize to avoid scrolling. Do not run the measurement while a transition is active (it triggers re-renders that break the animation).
- **Reduced motion:** respect `prefers-reduced-motion: reduce` — skip curtain, parallax and reveal offsets.

## State Management
| State | Purpose |
| --- | --- |
| `page` | `'home' \| 'services' \| 'projects' \| 'about' \| 'contact'` — becomes the route |
| `sector` / `project` | Which sector list / project detail is shown (route params) |
| `service` / `sub` | Which service is expanded and which subsection is active |
| `feature` | Hero slide index |
| `lang` | `'hy' \| 'en'` |
| `availH` / `availW` | Measured viewport space for the fitting logic |

No data fetching — all content is static. Move `sectors()`, `serviceGroups()`, `team` and `partners` into typed data modules (`data/projects.ts`, `data/services.ts`, `data/team.ts`, `data/partners.ts`) or a CMS if the owner wants to edit without deploys.

## Internationalisation
The prototype ships Armenian as default with English strings inline (`data-en` attributes for static copy, `en ? … : …` ternaries in the logic). In Next.js use `next-intl` or the built-in i18n routing with `hy` and `en` message catalogues; the toggle lives in the nav and shows the *other* language's label.

## Assets
All under `assets/` in this bundle, imported from the geogeeks repo unless noted:
- `img/GeoGeeks_logo.png`, `img/icons/LinkedIn_icon.png`
- `img/products/berqategh.jpg`, `img/products/fiparmenia.jpg` — **new**, screenshots supplied by the owner
- `img/projects_img/` — 8 sector tiles
- `img/ind_project_img/` — 30 per-project card and detail images
- `img/serv_img/` — 8 service and subsection images
- `img/team/team_01–03.jpg` — `team_03.jpg` is **new** (supplied by the owner)
- `img/partners/` — 17 logos; `client_16.svg` is **generated** (monogram placeholder), `client_14.svg` is superseded by `client_14.jpg`

## Files
- `GeoGeeks Site.dc.html` — the design reference (markup = layout and styles; `class Component` = data and behaviour)
- `support.js` — preview runtime, **do not port**
- `assets/` — all images
