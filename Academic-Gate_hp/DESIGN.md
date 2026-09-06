# Academic Gates — Design System

**Status:** Shipped and maintained. This document describes the design system as it exists in
the code now; §13 is the round-by-round decision log, §14 is the current Round-12 work.
**Codename:** *The Gate* — a scroll-driven cosmic site.

The site feels like standing at the gateway to all human knowledge: a pure-black canvas, a
glowing WebGL flow field that forms and disperses as you scroll (Round 12; earlier it morphed
between fixed formations), a **teal/cyan-dominant** spectrum with warm confined to hot cores,
and very large, very light typography floating on top. This document defines the tokens, type,
components, the index.html flow-field choreography, fallbacks, and per-page adaptation.

---

## 1. Design principles

1. **The black is the design.** `#000000` everywhere. Every glow, every star, every
   heading reads *because* the base is truly black. No lighter panels, no glass tint.
2. **Light, huge, calm typography.** One geometric sans at weight 300 for headings. The
   type and the particle field are co-equal heroes; nothing else competes.
3. **Glow through layered light, not shadow spam.** Bloom = additive-blended WebGL + a few
   low-opacity `radial-gradient` halos. Zero decorative `text-shadow`.
4. **Motion serves narrative.** The particle field tells a 4-act story (Gate → Path →
   Archive → Index). Motion never hijacks scroll and always degrades to a readable page.
5. **Readable first, cinematic second.** Content is visible in CSS by default. WebGL,
   scroll animation, and reveals are progressive enhancement layered on top.

---

## 2. Color tokens

All tokens live in `:root` at the top of `css/style.css`. Hex is authoritative; `rgb()`
shown where alpha is used.

### 2.1 Base & surfaces

| Token | Value | Use |
|---|---|---|
| `--bg` | `#000000` | Page background, canvas clear color |
| `--surface` | `rgba(255,255,255,0.02)` | Card fill |
| `--surface-hover` | `rgba(255,255,255,0.04)` | Card fill on hover |
| `--nav-bg` | `rgba(10,10,14,0.60)` | Floating nav pill (blurred) |
| `--hairline` | `rgba(255,255,255,0.14)` | Borders, dividers, card outlines |
| `--hairline-strong` | `rgba(255,255,255,0.24)` | Focused / hovered borders |

### 2.2 Text

| Token | Value | Contrast on `#000` | Use |
|---|---|---|---|
| `--text-primary` | `#FFFFFF` | 21:1 | Headings, key labels |
| `--text-secondary` | `rgba(255,255,255,0.62)` | ~9.9:1 | Body copy |
| `--text-tertiary` | `rgba(255,255,255,0.40)` | ~5.6:1 | Eyebrow labels, meta, captions |

All three clear the 4.5:1 body-text requirement against black. Tertiary is used only for
short non-essential labels but still passes.

### 2.3 The spectrum (particles + accents) — TEAL-DOMINANT (rev, reconciling both references)

The new reference reads **teal / cyan → deep blue**, near-monochrome cool. The originals were
blue→violet→magenta→ember. Decision: **cool (teal→cyan→blue) is the dominant register by
area; warm (magenta→ember) is confined to the hottest core of a formation only** — the galaxy
nucleus, the star, the ring's hot point. Cool structure, hot core; satisfies both references.

The `energy` value (0→1) a particle carries maps through this ramp. Formations keep ~85% of
their particles in the **cool 0.0–0.65 band**, and push only cores to **0.9–1.0**, so cool
dominates by area.

| Token | Hex | energy stop | Role |
|---|---|---|---|
| `--spec-blue-deep` | `#0B3BE0` | 0.00 | Coolest floor / far outer structure |
| `--spec-teal` | `#2BD9C4` | 0.22 | **Signature teal** — dominant mid-cool |
| `--spec-cyan` | `#00C2CB` | 0.40 | Cyan — dominant |
| `--spec-blue` | `#3D8BFF` | 0.62 | Electric blue — cool-to-transition edge |
| `--spec-violet` | `#7B4DFF` | 0.80 | Transition (narrow) |
| `--spec-magenta` | `#FF3D8B` | 0.90 | Hot — **core only** |
| `--spec-ember` | `#FF5A3C` | 1.00 | Hottest — core center only |

Derived UI accents (interactive UI stays blue for familiarity; glows lean teal):

| Token | Value | Use |
|---|---|---|
| `--accent` | `#3D8BFF` | Primary interactive accent, focus ring |
| `--accent-warm` | `#FF3D8B` | Secondary accent, CTA hover glow (core-hot only) |
| `--glow-cool` | `rgba(43,217,196,0.22)` | Card/button teal halo |
| `--glow-warm` | `rgba(255,61,139,0.20)` | CTA warm halo |
| `--spill-teal` | `rgba(43,217,196,0.10)` | Per-stage ambient light-spill (§ composition) |
| `--spill-cyan` | `rgba(0,194,203,0.10)` | Per-stage ambient light-spill |

### 2.4 Stars

Tiny 1–2px dots at very low density across the whole viewport (CSS layer, behind content,
above canvas clear). Three tints, 0.2–0.6 opacity:

| Token | Value |
|---|---|
| `--star-white` | `rgba(255,255,255,0.55)` |
| `--star-blue` | `rgba(120,170,255,0.45)` |
| `--star-red` | `rgba(255,120,90,0.30)` |

---

## 3. Typography

### 3.1 Chosen family: **Inter Tight** (Latin) + **Noto Sans JP** (Japanese), both weight 300 for display

**Justification.** The references show a neo-grotesque with a large x-height, near-neutral
letterforms, and very tight tracking at display sizes — the type reads as engineered and
quiet, not decorative. Of the three candidates:

- **Inter Tight** — a display-tuned cut of Inter with condensed side-bearings built for
  exactly this: large, tightly-tracked, light-weight headings. It ships a true 300 weight,
  and its metrics (x-height, cap-height) are near-identical to **Noto Sans JP**, so mixed
  JP/Latin headings sit on one optical line with no jarring size step. This metric harmony
  is the deciding factor — every heading on this site mixes English and 日本語.
- **Schibsted Grotesk** — more characterful and the most "agency" of the three, but its
  geometric quirks (the single-story-ish `a`, wider proportions) fight Noto Sans JP in
  mixed headings and it tracks looser.
- **Instrument Sans** — clean but slightly warmer/humanist; less of the precise,
  engineered feel the brief asks for.

**Decision: Inter Tight.** Neutral enough to let the particle field lead, tight enough to
hit the reference's display look, and the best metric partner for Noto Sans JP.
Schibsted Grotesk is the fallback choice if you want more character in review.

Loaded via Google Fonts CDN with `display=swap`:
`Inter Tight` 300/400/500, `Noto Sans JP` 300/400. Latin body also uses Inter Tight 400.

```
--font-display: 'Inter Tight', 'Noto Sans JP', system-ui, sans-serif;
--font-body:    'Inter Tight', 'Noto Sans JP', system-ui, sans-serif;
```

`:lang(ja)` headings get `font-weight: 300` on Noto Sans JP explicitly. **No serif/mincho
anywhere** — the two current `Times New Roman` declarations are removed.

### 3.2 Type scale

| Role | Size | Weight | Line-height | Tracking |
|---|---|---|---|---|
| Stage heading (index hero, `.scene h2`) | `clamp(1.9rem, 3.4vw, 3rem)` | 500 | 1.08 | `-0.01em` |
| **Page title** (`--fs-page-title`, interior + section titles, base `h1`) | `clamp(2rem, 4vw, 3.25rem)` | 300 | 1.05 | `-0.02em` |
| Sub-heading (base `h2`) | `clamp(1.4rem, 2.4vw, 1.9rem)` | 300 | 1.1 | `-0.01em` |
| Section-note label (`PDFはこちら` etc.) | `0.72rem` | 500 | — | `0.18em`, uppercase |
| Sub-heading (`h3`) | `clamp(1.25rem, 2.5vw, 1.75rem)` | 400 | 1.15 | `-0.01em` |
| Card title (`h4`) | `1.1rem` | 500 | 1.2 | `-0.01em` |
| Body | `0.95rem` | 400 | 1.75 | `0` |
| Eyebrow label | `0.7rem` | 500 | 1.4 | `0.2em`, uppercase |
| Nav / small UI | `0.8rem` | 400 | 1.4 | `0.01em` |

Headings clamp to 2 lines max (`-webkit-line-clamp` where used as titles). Body max width
`62ch`, color `--text-secondary`.

### 3.3 Eyebrow labels (signature detail)

Every major section on every page gets a sequential eyebrow: a two-digit index, an em
dash, an all-caps label.

```
01 — WELCOME TO THE ARCHIVE
02 — 勉強の軌跡
03 — THE KNOWLEDGE MAP
```

Markup: `<p class="eyebrow"><span class="eyebrow-num">01</span> — LABEL</p>`
Style: `0.7rem`, `letter-spacing:.2em`, `text-transform:uppercase`, `color:--text-tertiary`.
Numbering is per-page, sequential top-to-bottom. (JP labels keep the uppercase Latin
`NN —` prefix; the JP text itself is not uppercased.)

---

## 4. Spacing, radii, hairlines, glow

### 4.1 Spacing scale (8px base)

`--space-1: 0.5rem`, `--space-2: 1rem`, `--space-3: 1.5rem`, `--space-4: 2rem`,
`--space-6: 3rem`, `--space-8: 4rem`, `--space-12: 6rem`, `--space-16: 8rem`.
Section vertical rhythm: `--space-16` desktop, `--space-8` mobile.
Page gutter: `clamp(1.25rem, 5vw, 6rem)`.

### 4.2 Radii

| Token | Value | Use |
|---|---|---|
| `--radius-pill` | `999px` | Nav bar, buttons |
| `--radius-lg` | `24px` | Cards |
| `--radius-md` | `16px` | Inner surfaces, control panel |
| `--radius-sm` | `8px` | Inputs, small chips |

### 4.3 Hairlines & glow

- Hairline width: `1px` everywhere, color `--hairline`; interactive → `--hairline-strong`.
- **Glow treatment** — three legal sources only:
  1. WebGL additive blending (the particle bloom itself).
  2. CSS `radial-gradient` halos at low opacity, used as pseudo-element backdrops behind
     the hero ring, CTAs, and card hover edges.
  3. `filter: blur()` on a dedicated glow element (never on text).
- **Forbidden:** decorative `text-shadow` on headings/logo, `box-shadow` used as a colored
  glow, and any glow that would drop text contrast below 4.5:1.
- Motion budget: transitions animate **only** `transform` and `opacity`, 200–400ms,
  `cubic-bezier(0.22,1,0.36,1)`.

---

## 5. Components

### 5.1 Floating nav (replaces the full-width fixed header)

- Centered pill, `position: fixed; top: 20px; left: 50%; transform: translateX(-50%)`.
- `border-radius: 999px`, `background: --nav-bg`, `backdrop-filter: blur(20px)`,
  `1px solid --hairline`.
- Layout: small logo mark (a tiny ring glyph echoing THE GATE) on the left · nav links at
  `0.8rem` center · one pill CTA on the right (outlined, → SNS/contact).
- Active link: `--text-primary` + a 3px `--accent` dot under it (no glow).
- Mobile (≤768px): collapses to logo + hamburger; the existing `.menu-toggle` /
  `.nav-menu` markup and `main.js` toggle logic are **preserved**, just restyled. The
  expanded menu drops into a blurred rounded panel below the pill.

### 5.2 Buttons

- Pill, `1px --hairline` border, transparent fill, `0.85rem` label + a small circular icon
  disc on the right (`→`, `▶`, etc.).
- Hover: border → `--hairline-strong`, label → `--text-primary`, a soft `--glow-cool`
  radial halo fades in behind (pseudo-element, blurred).
- **Primary CTA:** disc filled with `--accent`; warm `--glow-warm` on hover.
- **Secondary:** no border, label + disc only.
- Focus-visible: `2px solid --accent` ring, `2px` offset — always visible, never removed.

### 5.3 Cards (blog / videos / sns / notes)

- `background: --surface`, `1px --hairline`, `--radius-lg`, generous padding
  (`--space-4`/`--space-6`).
- Hover: `--surface-hover`, and a faint blue→violet gradient bleeds in from one edge
  (pseudo-element, `opacity` 0→1). No cyan, no heavy blur, no lift-and-shadow.
- Media placeholders (thumbnails) become subtle gradient rectangles in the spectrum, not
  flat cyan blocks.

### 5.4 Star field (replaces `body::before` grid)

A fixed, full-viewport, `pointer-events:none`, `z-index:0` layer of tiny dots via
`radial-gradient` stacks (or a single generated CSS layer), in the three star tints at low
density. Present on **every** page — it is the shared cosmic baseline that interior pages
lean on instead of the full particle choreography.

### 5.5 Knowledge-graph control panel (study.html) — restyle only

Re-skin the existing panel to the system: `--surface` / `--radius-md` panel, hairline
borders, spectrum accents on sliders/checkboxes, pill buttons. **The graph logic, the
`#graph-container`, and all control IDs/handlers in `knowledge-graph.js` are untouched.**
The three colored buttons (reset/fullscreen) are re-colored to spectrum tokens but keep
their IDs.

---

## 6. index.html — scroll choreography (cosmic origin → modern society)

One persistent `THREE.WebGLRenderer` + one `THREE.Points`, built **once**, morphs through a
narrative that descends from the birth of the universe to the present day. Each stage is a
metaphor for moving from **foundational to applied knowledge** — the site's whole thesis.
Morphing is driven by a single `uProgress` uniform interpolating between **precomputed
position + energy attribute sets** (one per stage). `uProgress` is read once per frame from a
rect measurement of the hero and lerped — never from a raw scroll handler, never hijacked.
Every cross-morph is a pure function of `uProgress`, so **scrolling back runs the narrative
cleanly in reverse — no snapping.**

### Structure & timing (rev — four text stages)
- **Hero = 320vh desktop, FOUR text-bearing stages at 80vh each: BEGINNING · GALAXIES ·
  EARTH · SOCIETY.** MATTER and THE SOLAR SYSTEM still render (the six-form morph chain is
  intact) but as **text-less transitional forms** between the text stages — no heading,
  copy, CTA, or eyebrow. This is a budget fix: six text stages in 320vh gave ~53vh each and
  ~0.3–0.6s of readable copy at 600px/s; four gives 80vh each.
- **Each text block is `position: sticky`**, so it pins near the reading zone and holds
  legibly while the field morphs under it, instead of sweeping past in a narrow fade band.
  Measured readable window (copy >0.5 opacity, continuous 600px/s): BEGINNING **0.86s**,
  GALAXIES/EARTH **1.74s**, SOCIETY **1.86s** — a ~3× improvement, but still under the 2.5s
  target (see §13: 2.5s is unreachable at 4 stages / 320vh one-at-a-time; the hard ceiling is
  ~1.2s, and sticky reaches ~1.74s by allowing a clean leave/arrive handoff overlap).
- The **基礎領域 / 専門領域 content moved into the card region** below the hero, where it is
  read properly and links to study.html.
- Formation peaks: text forms peak where their scene centers; MATTER/SOLAR peak at the
  midpoint between the text stages they bridge. Scrolling back reverses cleanly.
- **Mobile (≤768px) = the same four stages within ~208vh** (55vh each). MATTER/SOLAR forms
  are skipped entirely (the JS builds only the 4 formations).
- Particle count: **~15,000 desktop / ~6,000 mobile**.

### Storyboard (desktop, peaks at the `uProgress` where each stage's text centers)

```
 peak    STAGE                       PARTICLE FORM (crisp, structured)      CONTENT CARRIED
 ─────────────────────────────────────────────────────────────────────────────────────────
 0.00  ① THE BEGINNING           ▟▀▀▙        a glowing RING of light (the   eyebrow 01
       宇宙の始まり               █ () █       gate) with a faint hot core;   Academic Gates
                                   ▜▄▄▛        warm at the top, cool at the   tagline · ▼ scroll
                                               bottom. It detonates outward
                                               into MATTER as you scroll.
 0.14  ② MATTER                   ▪ ▪  ▪ ▪   shell cools → discrete,        02 — 基礎領域
       粒子の生成                   ▪ ▪  ▪ ▪   separated CLUSTERS on a        foundational
                                    ▪ ▪  ▪ ▪   lattice (structure from       studies (学部
                                               chaos)                        レベル)
 0.38  ③ GALAXIES                     ╱◝✦◜╲    clusters collapse into a      03 — 知識マップ
       銀河の誕生                  ◜╱  ●●●  ╲◝  SPIRAL: sharp bright core,    Archive Sphere
                                    ╲   ✦✦   ╱  readable arms                → study.html
 0.62  ④ THE SOLAR SYSTEM         ◜ ⊙ ◝        core zooms to a STAR with     04 — 専門領域
       太陽系                     (( ★ ))       concentric ORBIT rings —      specialized
                                    ◟ ⊙ ◞       distinct elliptical LINES,    fields, each an
                                               not haze                      orbit
 0.86  ⑤ EARTH                       ◜◝        one orbit's body grows into   05 — 自分の研究
       地球                       ( ◕ )         a rotating GLOBE: lat/long    現在地 (my
                                    ◟◞          wireframe + hard terminator   research / here)
 1.00  ⑥ SOCIETY                  •─•─•        globe surface lifts off →     06 — 現代社会
       現代社会の分析             │╳│╳│         NETWORK graph: nodes + edge   → notes/blog/
                                  •─•─•         lines (city-lights), settles  videos/SNS cards
       ▼ below the hero: canvas fades dormant, the card grids scroll on pure black + stars
```

Rotation is keyframed per stage (galaxy tilts to a low angle; the solar system tilts; the
globe spins slowly on Y). Depth size-attenuation is on so near particles read larger than
far — the cue that makes a point cloud read as 3D rather than fog.

### Rendering rules (rev — DENSE surfaces, not outlines)
The reference runs **~91k particles** and samples its objects so finely that moiré appears
across them — they read as **solid volumes**. Ours ran 13k on thin curves and read "thin."
The fix is density + surfaces, keeping the crisp sprite.

- **Density target: ~80,000–100,000 desktop.** Picked once at init from a **device tier**
  (desktop / low-power / mobile), never degraded mid-scroll ("step down by device, never by
  frame rate"). The shipped counts and the count-vs-frame-time curve are reported with the
  stills. Tiers: desktop **≈80k**, low-power **≈35k**, mobile **≈14k** (final numbers from the
  measured curve).
- **Formations are point-sampled SURFACES / volumetric shells, not single-pixel curves**
  (this replaces the old "particles ride curves" rule):
  - **Globe** → a **densely sampled sphere surface** (uniform points over the whole sphere),
    shaded by a hard terminator — not a lat/long wireframe.
  - **Galaxy arms** → **dense sampled bands** with radial falloff and internal density
    variation — not thin traces. Dense hot nucleus.
  - **Ring** (beginning) → a **thick torus shell** (tube with real thickness), densely filled.
  - **Matter** → dense **cluster shells** on the lattice. **Solar** → orbit **bands** (rings
    with thickness). **Society** → node volumes + sampled edge bands.
- **Depth of field.** In the vertex/fragment shader (no post pass): near particles are
  **larger and softer**, far ones **smaller and sharper** — a size-and-softness ramp by view
  depth. This variance is a big part of the reference's perceived resolution.
- **Sharp sprite, core-only bloom kept.** Crisp dot base; only hot (core) particles bloom.
- **Cool dominates by area, warm at the core only** (§2.3): ~85% of each formation's particles
  sit in the teal→cyan→blue band; only the nucleus/star/hot-point pushes to magenta→ember.
- **No additive white-out:** avoid solid centres (shells / falloff), so hot cores read
  ember, not white.
- **Deterministic layout:** seeded **mulberry32** PRNG (`Math.imul`, exact 32-bit — a plain
  LCG overflowed 2^53 and clustered particles, the real cause of past sparseness).
- **Text legibility:** composition-first — headings are **left-aligned with the formation
  offset to the opposite side** (§ composition), so type sits on dark ground structurally;
  a dark `text-shadow` + soft feathered vignette are the backup. Verified ≥4.5:1 (beginning
  ≥7:1).

### EARTH — dense sampled sphere surface + hard terminator (0 added bytes)
Superseding the wireframe: the globe is now a **densely, uniformly point-sampled sphere
surface** (thousands of points over the whole sphere), shaded by `dot(surfaceNormal,
lightDir)` for a **hard day/night terminator** — lit hemisphere bright cool-white, dark
hemisphere dim — rotating slowly on Y. It reads as a solid rotating world, not a wire cage.
Still procedural, zero bytes. **Option (a), a <1 KB continent landmask** biasing surface
density onto land, remains a drop-in upgrade if you want literal Earth geography.

### Composition & typography (rev — reference-aligned)
- **Stage headings are left-aligned; the formation is offset to the opposite (right) side.**
  Type never centres over the bright formation, which fixes the text-on-particles contrast
  **structurally** (text sits on the dark left; the dense surface reads whole on the right).
- **Heading scale down, weight up.** Old `clamp(2.5rem, 6vw, 5.5rem)` @300 read oversized and
  thin. New stage-heading proposal: **`clamp(1.9rem, 3.4vw, 3rem)` at weight 500** (Latin 500 /
  JP Noto 500). The brand wordmark ("Academic Gates") stays a touch larger at weight 400.
- **Bracketed micro-labels** along the bottom edge, small/tracked/tertiary:
  `[ 基礎領域 ] · [ 専門領域 ] · [ ARCHIVE ]`.
- **Ambient light-spill:** one large, very-low-opacity radial per stage (`--spill-teal/cyan`),
  positioned to balance the composition (opposite the formation), not pure black + stars.
- **Live telemetry** (particles · **FRAME MS** · fps), corner, tertiary. The ms figure is
  labelled `FRAME MS` because on this GPU it is dominated by fixed per-frame overhead, not
  point cost (the count-vs-time curve is flat) — it is not a "budget headroom" claim. It
  doubles as the real GPU-time readout used to pick the density tier, and thematically a
  physics student's page owning its frame budget fits. Shipping it small and quiet.

### Mobile hero (shipped)
The narrow single column can't do left-text / right-formation, so mobile gets its own layout:
- **Text upper, formation lower.** The formation is scaled to `0.58` and dropped to
  `position.y −2.05` (from centre) — the whole form stays inside the viewport (verified
  per-stage: no edge clipped) and clears the CTA pill in the text column.
- **Even scene centres.** The hero adds `padding-block: 51vh` head/tail spacers so the four
  scene centres land at **12.5 / 37.5 / 62.5 / 87.5%** of scroll (`tp ≈ [0.123, 0.374, 0.625,
  0.877]`) instead of clamping to 0/1. Each stage then gets a real dwell.
- **Text opacity is tp-synced.** Opacity keys off a fractional stage index interpolated through
  the true scene centres, so each block peaks exactly when its formation peaks (no desync). The
  whole `.scene__content` fades as one value (children inherit). Measured: max 1 block >0.5 at
  once, 0 px two-visible, 0 px blank gap. (Desktop keeps the wider block-centre fade — it has
  horizontal separation, so a long read is safe.)

### Fallbacks & readability (unchanged intent)
Text is visible by default in CSS (JS-off shows all stages stacked, readable). Under
`prefers-reduced-motion: reduce` the **Three.js download is skipped entirely** and the page
renders the static CSS ambient glow + star field. Three.js loads **non-blocking** (injected
by JS, not a render-blocking `<script>`), with the jsdelivr→unpkg fallback preserved; if it
or WebGL is unavailable the canvas is dropped and the same CSS fallback stands in. The card
region (SOCIETY content) sits below the hero on pure black + star field once the canvas goes
dormant.

**Content mapping (fixes the orphaned-videos bug):** the SOCIETY card region carries 人気
ノート (→ study/peskin), 最新ブログ (→ blog.html), 最新動画 (→ **videos.html**), 企画,
and SNS — each a card grid per §5.3.

All of the above lives in a new `js/scroll-scenes.js`. `main.js` is not bloated.

---

## 7. Fallbacks & accessibility (built in from the start)

| Condition | Behavior |
|---|---|
| **JS disabled** | Full content visible; `body::before` static radial spectrum glow behind the hero (the star field is canvas-painted, so it needs JS, but the glow stands in). Nav/footer render from the `<noscript>` fallback (`.noscript-nav`, plain always-visible links) — the site stays navigable. No blank screens, no reveal-gated content. |
| **WebGL unavailable** | `scroll-scenes.js` detects context-creation failure and skips the canvas entirely; the `body::before` gradient hero stands in. Page stays beautiful. |
| **`prefers-reduced-motion: reduce`** | **Three.js is not downloaded at all**; the canvas element is removed and the static CSS ambient glow renders the page. All content shown immediately. Required, honored in both CSS and JS. |
| **PDF embeds (iOS Safari)** | iOS Safari renders PDFs in `<iframe>` poorly (first page, no scroll). Every section note shows a primary 「PDFを開く ↗」 pill + 「ダウンロード」 link above the embed; direct links verified HTTP 200 / `application/pdf`. Content never gated behind the embed. |
| **Canvas off-screen / tab hidden** | Render loop paused (`cancelAnimationFrame`) via `IntersectionObserver` on the hero + `visibilitychange`; canvas fades dormant below the hero. |
| **Perf caps** | `devicePixelRatio` capped; device-tier particle count **90k desktop / 45k low-power / 35k mobile** (`?n=` override); only shader uniforms animated. Real GPU-time on Apple M5 ~2–3 ms via `EXT_disjoint_timer_query_webgl2`; 60 fps, 0 dropped frames. iOS device pass: thermals fine. |
| **Focus** | Visible `2px --accent` focus ring on every interactive element, never removed. |

---

## 8. Per-page adaptation

Interior pages get the **calm** treatment: shared floating nav, star field, a subtle static
spectrum gradient — **no** 4-scene particle choreography, **no** `scroll-scenes.js` heavy
morph. Each still gets sequential eyebrow labels and the type/component system.

| Page | Treatment |
|---|---|
| **index.html** | Full six-stage (four on mobile) WebGL choreography (the only page with it). |
| **self-intro.html** | Calm. Profile: photo in a hairline/`--radius-lg` frame, bio in the type system, spectrum star field. Keep `self-intro.js`. Eyebrows: `01 — PROFILE`, `02 — RESEARCH`, … |
| **study.html** | **Background particle canvas suppressed** (static gradient only) so it never competes with `knowledge-graph.js`'s WebGL context. Accordion restyled to hairline/surface tokens. Control panel re-skinned per §5.5. Graph logic untouched. |
| **blog.html** | Calm. Card grid per §5.3, spectrum placeholders. |
| **videos.html** | Calm. Video card grid; now linked from index scene ④. |
| **sns.html** | Calm. SNS links become hairline cards with spectrum hover, disc icons. |
| **peskin-qft.html** | Calm. TOC + accordion restyled. Eyebrow `01 — CONTENTS`. |
| **peskin-qft_sec2-1…4.html** | Calm. **MathJax config + the PDF `<iframe>` embeds kept exactly as-is**; iframe wrapped in a hairline/`--radius-md` frame. Eyebrows per section. |

**Shared nav/footer are unified across all 11 pages** — one canonical 6-item nav
(ホーム · 自己紹介 · 勉強の軌跡 · 動画 · ブログ · 各種SNS) with the correct `active` per
page, and one canonical footer (logo + nav links + SNS + copyright). This fixes the
5-vs-6-item nav inconsistency and the three-way footer inconsistency.

---

## 9. Bugs fixed during the redesign

- `index.html` ~line 12: stray `gg` before `<nav>` — removed.
- `index.html` ~line 130: stray `e` after `</div>` — removed.
- Nav unified to 6 items on every page; videos.html gains a homepage entry point (scene ④).
- Footer unified across all pages.
- Two `Times New Roman` serif declarations removed (system is all-sans).

---

## 10. What we are removing (explicit)

- **Cyan `#00ffff`** and every `rgba(0,255,255,*)` (14 occurrences) — the entire cyan
  accent system, including the glowing logo and nav hover glow.
- **Heavy glassmorphism** — the current 10 `backdrop-filter` uses on content/cards/header
  are cut; `backdrop-filter` survives **only** on the floating nav pill (§5.1).
- **`body::before` cyan grid overlay** — replaced by the star field (§5.4).
- **All decorative `text-shadow`** (12 occurrences) on headings/logo/nav — replaced by
  WebGL + radial-gradient bloom. (Text-shadow is not used for glow anywhere.)
- **The full-width fixed `<header>`** — replaced by the floating centered nav pill.
- **The dark sci-fi / gaming flavor** generally: high-saturation neon, box-shadow glows,
  serif accents — all gone.
- The old `:root` cyan/glass token block is replaced wholesale by §2's tokens.

---

## 11. Shared header/footer — Option A (IMPLEMENTED)

The header/nav/footer are injected from one source, `js/layout.js`, on every page — no more
copy-paste drift.

- Each page carries `<div id="site-nav">` and `<div id="site-footer">` placeholders. Each
  placeholder holds a `<noscript>` fallback nav (`.noscript-nav`, plain always-visible links)
  so the site stays navigable with JS disabled.
- `layout.js` writes the canonical `<header>` + `<footer>` into those placeholders and sets the
  active nav link from `document.body.dataset.page` (map: `index→index.html`,
  `self-intro→self-intro.html`, `study→study.html`, `videos→videos.html`, `blog→blog.html`,
  `sns→sns.html`, `peskin→study.html` — section notes highlight 勉強の軌跡).
- **Load order:** `layout.js` is included immediately *before* `main.js` and *after* the body
  placeholders, so the document is already parsed when it runs — it injects **synchronously on
  execution**, before `main.js` registers its `DOMContentLoaded` handlers (which query
  `.menu-toggle` / `.nav-menu` / `header`). No ordering race; `main.js` was not modified.
- Verified on all 11 pages: correct `active` per page, 6-item nav, byte-identical footer,
  hamburger open + outside-click close, 0 console errors, and the `<noscript>` path renders
  6 links with scripts disabled.

Rejected alternatives: **B (HTML includes)** needs a build step or SSI — not viable on a static
host. **C (copy-paste + a CI diff lint)** keeps the drift risk and the toil.

---

## 11b. Knowledge map (Archive Sphere) — constraints for the replacement

`study.html`'s 3D graph (`js/knowledge-graph.js`) is being **rebuilt from scratch** later. No
further work is being done on the current one (label overlap from the randomized layout is left
as-is). The rebuild should inherit what this round learned:

- **Palette only.** Use the spectrum tokens — teal/cyan for structure (nodes, edges), violet /
  magenta for accents. **No off-palette colours**: the original shipped **lime-green edges**
  (`0x00ff00`) and orange/green button states, all corrected to teal/blue/magenta. Edges read
  cool + dim, nodes brighter.
- **Label sprite canvas must be sized from measured text width** (`ctx.measureText(id).width +
  padding`), never a fixed width, and the sprite scale derived from the canvas aspect
  (`world_h × width/height`). A fixed 512px canvas + a larger font clipped long labels at both
  ends — that regression must not return.
- **Legible minimum label size** at the default camera distance (current: `bold 34px` on the
  label canvas, sprite world-height ~1.05).
- **Fit the container, no large empty region.** Reference starting point: nodes sit on a sphere
  of radius ~20; camera distance **34**, container height **56vh**. Tune to fill the frame.
- **study.html suppresses the hero particle canvas** (`#scene-canvas`) so the map never competes
  for a second WebGL context / GPU budget. The replacement **must keep this arrangement**.
- **Vector-math reassignment bug (class to avoid):** lines 302 and 802 declared the edge
  `perpendicular` with `const` and then reassigned it in the vertical-edge branch
  (`crossVectors(direction, (0,1,0))` degenerates when the edge is vertical → recompute against
  `(1,0,0)`). `const` threw on that branch. Any recompute-on-degenerate path must use `let`.

### Three.js is pinned at the r160 removal boundary (do not bump without migrating)

The site is pinned to **`three@0.160.0`**, loaded via the entry point **`build/three.min.js`** (the
UMD/global build that sets `window.THREE`). r150+ deprecated that entry point with the console
warning *"Scripts build/three.js and build/three.min.js are deprecated with r150+, and will be
removed with r160"*; **0.160.0 is the last version that still ships it** (verified: it loads 200
and reports `THREE.REVISION = 160`). We are sitting exactly on that boundary.

**Loaded by two places** (grep-verified — `build/three.min.js`, `three@0.160.0`):
- `html/study.html` (lines 8–9) — a direct `<script src="…jsdelivr…/three.min.js"
  onerror="…unpkg…">` in `<head>`. Drives `js/knowledge-graph.js` (a *consumer* — it calls
  `new THREE.*` and `console.error`s if `typeof THREE === 'undefined'`; it does **not** load Three
  itself).
- `js/scroll-scenes.js` (line 58) — the `loadThree()` dynamic-injection loader
  `attempt('…jsdelivr…', '…unpkg…')`. This is how **`index.html`** gets Three.js (transitively;
  index.html has no Three `<script>` of its own — see its line-18 comment).

**A version bump breaks both files together, and the unpkg fallback cannot help.** Both CDNs serve
the *same npm package* `three@0.160.0`, so both hold byte-identical files; the jsdelivr→unpkg
fallback is a **CDN-availability** fallback (one host down → try the other), not a version/path
fallback. Any bump to a version where the package no longer ships `build/three.min.js` removes the
file from **both** CDNs simultaneously, so `index.html` (via scroll-scenes.js) and `study.html`
(and therefore the Archive Sphere) all break at once, with the fallback offering no rescue.

**Deliberately not migrating now.** Moving off the UMD build means ES-module imports
(`import * as THREE from 'three'` via an import-map or a bundler) across both the scroll-field and
the knowledge-graph rebuild — out of scope here. Until then, **hold the pin at exactly
0.160.0**; treat any change to the version number in those two locations as a breaking change that
must be co-migrated, not a routine dependency bump. (The knowledge-graph rebuild noted above is
the natural time to do the ES-module migration.)

### CDN fallback pattern — always create a new `<script>`, never reassign `.src`

**All three jsdelivr→unpkg fallbacks in the repo now use the same createElement mechanism:** on
load error, **create a new `<script>` element** pointing at unpkg and append it to `<head>`.
- `js/scroll-scenes.js` (`loadThree()`, drives `index.html`) — the original working form.
- `html/study.html`'s Three.js tag — `onerror="this.onerror=null; var
  s=document.createElement('script'); s.src='…unpkg…'; document.head.appendChild(s);"`.
- the `peskin-qft*.html` MathJax tags — same onerror, `es5/tex-mml-chtml.js`.

**Do NOT reintroduce the inline `this.src='…'` form anywhere** — it is known broken. **Spec
reason (one line):** reassigning `.src` on an already-run/failed parser-inserted `<script>` is a
no-op because its "already started" flag is set, so the browser never re-fetches.

Measured, jsdelivr blocked at the network layer: **study.html** recovers Three.js from unpkg
(200, `THREE.REVISION 160`) and `knowledge-graph.js` initializes with no `Three.js` console error;
**index.html** recovers via `scroll-scenes.js` (unpkg 200, unaffected by the study.html edit);
**peskin-qft.html** recovers MathJax from unpkg (`3.2.2`, `$e^+ e^-$` renders). Normal loads use
jsdelivr and the fallbacks do not fire. Both CDNs serve byte-identical `three@0.160.0` and
`mathjax@3 = 3.2.2`, so these are host-availability fallbacks, not version ones — the versions,
pinned URLs and entry points are unchanged.

(Before this pass, study.html's fallback used the inline `this.src=` form and was latently broken
— it only ever mattered when jsdelivr was unreachable, which is why it went unnoticed.)

One remaining pre-existing quirk, **not fixed** (out of scope; do not touch the config object):
`peskin-qft_sec2-1..4.html` set `window.MathJax` config *after* the loader `<script>`, which
overwrites the loaded runtime object — harmless today only because those four pages embed PDFs and
carry **no inline HTML math** (only `peskin-qft.html` does, and it orders config before the loader,
correctly).

---

## 12. Rollout order (unchanged from your process)

1. **This document** → your review. *(current step — stop here)*
2. On approval: rewrite `css/style.css` (tokens first, then sectioned) + complete
   **index.html only** with `scroll-scenes.js`. Stop for review.
3. On approval: roll the calm treatment out to the remaining 10 pages; unify nav/footer;
   restyle the study.html control panel; verify MathJax, PDF embeds, and the 3D graph.

---

---

## 13. Implementation notes — deviations & justifications

**Round-11 (Safari / iOS pass — PDF fallback + compat review):**
- **PDF access hardened for iOS Safari.** iOS Safari renders PDFs in an `<iframe>` poorly (first
  page only, no internal scroll). All four section notes now show a primary **「PDFを開く ↗」**
  pill + **「ダウンロード」** link *above* the embed (the iframe stays for browsers that handle it
  inline). Direct links verified reachable on every page: `pdf/PeskinQFT_Sec2-{1..4}.pdf` →
  HTTP 200, `application/pdf`. So the notes' substance is never gated behind a render quirk.
- **Static Safari-compat review** (live Safari automation is unavailable on this machine — see
  below): `backdrop-filter` carries its `-webkit-` prefix (nav pill); the WebGL GPU-timer
  extension is fully null-guarded (Safari lacks `EXT_disjoint_timer_query_webgl2` → telemetry
  falls back to an fps figure, no crash); the particle shader is standard WebGL math (additive
  blend + in-shader ACES; three.js prepends `precision highp`); `scroll-padding/​margin-top` are
  standard properties (Safari 15+); no Safari-unsupported JS APIs in use.
- **iOS Safari: device-verified clean** (real-device pass by the owner) — PDF rendering + the
  new fallback, hero scroll under iOS momentum, particle density, thermals, reduced-motion, and
  touch all fine. It could not be automated *in this build environment* (Command Line Tools only,
  no Simulator/device), so the pass is the owner's, not this harness's.
- **Desktop Safari: still unverified at runtime.** `safaridriver` WebDriver is gated behind
  "Allow Remote Automation" (GUI/sudo), which this environment can't enable, so the live
  desktop-Safari render/console pass was never run. What's known is code-level only:
  `-webkit-backdrop-filter` present, GPU-timer extension null-guarded, standard-WebGL shader,
  standard scroll props, no unsupported JS APIs. **Documented unknown:** particle ACES fidelity
  in *desktop* Safari. (This is a genuine gap, left as a known unknown per the owner.)

**Round-10 (label-clip regression + graph fit + CTA polish):**
- **Graph label clipping (regressed in round-9 from the 24px→34px bump):** the sprite canvas was
  a fixed 512px while the text grew, so long centred strings overflowed and clipped at both ends
  (`he Klein-Gordon Field in Space-`). Fix: size the canvas from `measureText(id).width + pad`,
  and set the sprite scale from the canvas aspect (`world_h × width/height`) so nothing is
  squished or cut. Verified: 13/13 sprites have canvas width ≥ text width, **0 clipped labels**,
  and every label renders complete in the still.
- **Graph container fit:** camera pulled in (36 → 34), container 62vh → 56vh, so the node cloud
  is centred in the space it occupies (less empty bottom).
- **Mobile CTA clearance:** formation dropped `position.y −1.85 → −2.05` so the Earth sphere /
  galaxy arm clear the CTA pill in the text column. Re-verified in-viewport: bottoms now
  73–118px, still no clip on any edge; the four stills still read [1,0,0,0]…[0,0,0,1].

**Round-9 (mobile timing/sync + graph fit) — four fixes, browser-verified:**
- **Root cause of the "duplicated body copy" and the stage/formation desync: uneven scene
  centres.** The 4 mobile scenes centred at progress **tp = [0, 0.265, 0.735, 1]** (endpoints
  clamped, middles pulled in). The old text metric assumed even thirds, so (a) it desynced from
  the formation morph, which keys off tp, and (b) evenly-spaced sample offsets landed *between*
  stages, showing two blocks part-lit at once (read as "duplication"). Fixes:
  - **Mobile head/tail hero spacers `padding-block: 51vh`** move the first/last scene centres off
    the 0/1 ends, so tp is now **[0.123, 0.374, 0.625, 0.877]** — the four centres sit at
    12.5/37.5/62.5/87.5%, exactly the evenly-spaced sample offsets. Each stage's text-centre now
    coincides with its formation peak.
  - **Text opacity keys off a tp-synced fractional stage index** (`stageIndex()` interpolates the
    true scene centres), so text and its formation peak together — no desync. The whole block
    fades as one value on `.scene__content` (children inherit; verified every child = parent).
  - Re-measured over 240 samples, **block-level** (eyebrow+heading+body+CTA), not headings:
    **max simultaneous blocks >0.5 = 1, two-blocks-above-0.5 = 0px, blank-gap = 0px**; the four
    evenly-spaced stills each read [1,0,0,0]…[0,0,0,1]. *The earlier round-8 metric instrumented
    headings and forced even thirds — it hid this; corrected here.*
- **Formations verified in-viewport numerically** (not by eye): at each stage peak, with text +
  nav + starfield hidden, the formation's lit-pixel bbox margins to the viewport are — beginning
  L54/R48/T189/B92, galaxies L54/R60/T189/B123, **earth L105/R61/T189/B137**, society L27/R27/
  T189/B105 px; **none clipped on any edge**. The earlier earth right-edge clip was a mid-morph
  artefact of sampling 62.5% while earth actually peaked at 0.735 — gone now that the still rests
  on the peak. Mobile keeps scale 0.58 + `position.y −1.85` (lower portion).
- **Knowledge-graph fit + labels** (camera/zoom + label size only; no layout/IDs): camera pulled
  in (z/cameraRadius 50 → 36) so the radius-20 node cloud fills the frame; container 70vh → 62vh;
  label sprites 5→7.5 wide, font 24px → bold 34px (legible). Re-scan: still 0.00% lime-green.

**Round-8 (mobile composition + interior polish) — six fixes, all browser-verified:**
- **Mobile text hand-off rebuilt on a continuous scene-index metric.** The old distance-from-
  viewport-centre fade left two headings both >0.5 for 22.5% of the hero (a lingering ghost in
  the single mobile column). Opacity is now `1 − smooth(0.40, 0.60, |i − progress·(n−1)|)`:
  each heading plateaus at 1 for the middle 40% of its scene, cross-fades in the 20% around the
  boundary (both = 0.5 exactly at the midpoint → no blank flash), and a neighbour >0.6 scenes
  away is **exactly 0** — the leaving block vanishes, no ghost. Measured over 120 samples:
  **max simultaneous headings >0.5 = 1, two-visible-above-0.5 band = 0px (0%)**; the only
  overlap is a 141px (14%) sub-0.5 cross-fade. Desktop keeps its wider block-centre fade
  (horizontal separation makes a long read safe). *The earlier "126px two-visible" figure was
  wrong — it measured >0.5 only and the stills were caught mid-hand-off; this round re-measured
  honestly at evenly-spaced offsets.*
- **Mobile formation composition.** Single column, so the formation is scaled to `0.58` and
  dropped to `position.y −1.85` (lower portion) — at fov 55°/z9 the mobile half-width is only
  ~2.16 world units, less than a ring's 2.4 radius, so at full scale the ring/torus/galaxy
  clipped at the sides. Now the whole form sits inside the viewport under the upper-column text.
- **Shared nav-clearance rule** (`--nav-clearance: 92px` = pill offset + height + margin):
  `scroll-padding-top` on `html` + `scroll-margin-top` on `main > section, .page-header,
  h1/h2/h3, .eyebrow`, so any content that lands at the top of the viewport clears the floating
  pill. Fixes the study eyebrow clipping under the nav; defined once so it can't regress page by page.
- **study.html heading left-aligned** (`.knowledge-map` given `max-width:900px; margin:0 auto`,
  h1 `text-align:left`) to match the rest of the (left-aligned) system; eyebrow and h1 now share
  one left edge. **Control-panel toggle** moved above the panel it controls.
- **Knowledge-graph on-palette** (colour constants only, no logic/IDs): edges cool + dim
  (default `#1c3a3f`, tag `#1f8a80` teal, hierarchy `#2a52c8` blue — was lime `#00ff00`); nodes
  from the palette (teal/cyan + violet/magenta accents). Fullscreen-toggle state colours moved
  off orange/green onto the teal/magenta system. Verified: **0.00% lime-green canvas pixels**
  (was the edge colour), 43.9% teal/cyan, 0 console errors.
- **Graph `const`→`let` on line 802** (the second occurrence of the round-7 bug), same one-line
  constraint as line 302.

**Round-6 (de-saturation) — the 90k render was additive-clipping to flat fills.** Fix:
per-particle alpha dropped ~10× (`uAlpha 0.16`), point size shrunk (`uSize 14→16`, ~2–3px so
dots + dark gaps stay visible), **ACES filmic rolloff** in-shader (hot cores read warm, not
clipped white). Verified numerically, not by eye: **clipped pixels 0.02–1.27% per stage
(target <2%, and only at cores), lit-body median 0.45–0.53 (target 0.4–0.6)** — nothing
pinned near 1.0. EARTH terminator is now a brightness gradient over UNIFORM density (dark
side dim, not missing → no speckle). SOCIETY has hierarchy: bright hub nodes (by degree),
dim small nodes, dimmer thin edges. Mobile tier raised to **35k** (16k read near-empty after
the alpha drop; chosen on appearance). Count-vs-GPU-time stays flat (2–3.4ms, 40k–200k) — the
small-point/low-alpha additive render is trivially cheap on M5; the floor is fixed frame
overhead, not point cost.

**Round-5 (density + surfaces + teal) — shipped values:**
- **90,000 particles desktop / 40,000 low-power / 16,000 mobile**, picked once by device tier.
  Count-vs-frame-time on Apple M5 (vsync off, true render ms): 40k→2.0 · 60k→2.0 · 80k→2.1 ·
  100k→2.0 · 120k→2.0 ms. Chosen 90k (≈ reference's 91k); on-screen telemetry reads
  **~3.5ms GPU / 60fps** via `EXT_disjoint_timer_query_webgl2`. Vsync-capped frame time 16.7ms
  median, 0 dropped frames. Enormous headroom on M5 — a slower desktop still gets the
  reference's own 91k-class load without mid-scroll degradation.
- **Formations are dense sampled surfaces:** torus shell (beginning), sphere surface (earth),
  arm bands with falloff (galaxy), orbit bands (solar), node/edge bands (society) — replacing
  the thin-curve rule. **Depth of field** in-shader (near = larger+softer, far = smaller+sharper).
- **Teal-dominant palette** (`--spec-teal #2BD9C4`, `--spec-cyan #00C2CB`): cool fills 0.0–0.62
  of the energy ramp, warm (magenta→ember) only above 0.8 → cores only.
- **Composition solves contrast structurally:** headings left-aligned on the dark left, the
  formation offset to the right. All stages now measure **~21:1** (was a per-frame scrim fight).
- Added **ambient light-spill** (teal, per §comp), **bracketed micro-labels**, and **live
  telemetry** (particles · GPU ms · fps). Asset URLs are versioned (`?v=r5`) for cache-busting.
- The PRNG-clustering bug from round 4 is fixed (mulberry32); it was the true prior cause of
  "sparse," compounding the low count.

---


**Explicit deviation from §4.3 (no `text-shadow`):** hero text uses a **dark**
`text-shadow` as a legibility aid (a dark halo hugging each glyph), *not* the decorative
glow §4.3 forbids. Over a moving particle field a box-scrim reads as a pasted panel; a dark
per-glyph shadow plus a soft, fully-feathered vignette keeps text legible with no visible
edge. This is a deliberate, recorded exception — §4.3's ban on decorative/glow `text-shadow`
still holds everywhere else.

**Deterministic-layout PRNG bug (fixed):** the seeded RNG was a plain LCG
(`seedState*1103515245+…`), whose multiply overflows JS's 2^53 integer limit and clustered
particles — the real cause of the "sparse arms/ring." Replaced with mulberry32 (`Math.imul`,
exact 32-bit), which restored dense rings and arms.

Recorded for your review; these differ from a naive reading of §1–12.

- **Six-stage narrative (BEGINNING→MATTER→GALAXIES→SOLAR→EARTH→SOCIETY)** replaces the
  earlier GATE/PATH/ARCHIVE/INDEX. Hero = **BEGINNING 100vh + five stages × 44vh = 320–321vh**
  measured at 1024/1280/1440/1920. BEGINNING is a full 100vh (not an even 53vh) so the site
  name is centered and fully legible at load; the other five carry the applied-knowledge
  content and are 44vh each. Mobile builds only four stages (BEGINNING, GALAXIES, EARTH,
  SOCIETY), MATTER + SOLAR `display:none`, measured ~202vh.
- **One-stage-at-a-time text** is driven by JS opacity keyed to each scene's distance from
  viewport-center (verified: max 1 hero text block with opacity>0.5 at any scroll point).
  This resolves "no two texts at once" + "clears the nav pill" + "formation peaks when its
  own text is centered" within 320vh, which fixed spacing alone cannot. Text is opacity:1 by
  default so the page reads fully with JS off.
- **Crisp rendering:** particles ride curves/surfaces or tight clusters (no volume fill);
  sharp sprite `smoothstep(0.5,0.36,d)`; depth size-attenuation on; core-only bloom (hot
  particles get a wider halo + larger size, cool structure stays small/sharp); no global glow
  pass. To beat additive white-out, MATTER clusters are thin **shells** on a 2D grid and
  galaxy/star cores are **sparse + dimmed** so hot centres read ember, not white. Layout is
  from a **seeded PRNG** (deterministic every load). **Shipped ~13,000 desktop / ~5,000
  mobile** (down from 24k — clarity beat quantity).
- **BEGINNING is the ring** (the old GATE), restored as the strongest asset: a glowing warm-
  top/cool-bottom ring with the site name inside and a faint hot core, detonating outward
  into MATTER on scroll.
- **EARTH = wireframe lat/long globe + hard terminator, 0 bytes** (option b; see §6). Reads
  as a rotating world; (a) literal continents remains a <1 KB upgrade.
- **Hero copy is full white**, not secondary (0.62 measured 3.4:1 over particles). Scoped to
  `.hero p`; interior pages keep secondary body text.
- **Text legibility = dark text-shadow + a soft, fully-feathered vignette** behind each block
  (continuous falloff, heavy blur, no detectable edge — not a panel). Verified **all six
  stages pass ≥4.5:1** worst-case across a 3-point scroll sweep each (99th-percentile
  brightest background, glyphs made transparent so the vignette+shadow are measured, not the
  glyphs): beginning 6.4/4.7, matter 17.4/17.6, galaxies 18.1/15.7, solar 17.5/16.9, earth
  18.9/17.7, society 18.6/15.5 (heading/copy).
- **Three.js loads non-blocking** (injected `async` by JS; zero `three` references in the
  HTML source) and is **not downloaded at all under `prefers-reduced-motion`** (verified: no
  network request; canvas removed; title visible). jsdelivr→unpkg fallback preserved.
- **Canvas goes dormant** once the hero leaves the viewport; render loop paused with
  `cancelAnimationFrame` on hero-IntersectionObserver + `visibilitychange`.
- **§A/§D/§F/§G:** JP headings weight 400 / Latin 300 / body 1rem / JP line-height 1.9;
  star field is a single canvas painted once (`starfield.js`); `main.js` anchor offset now
  uses the nav-pill height and the menu toggle/aria/outside-click all verified against the
  pill; site name is HTML-first, canvas fades in after.

*Delivered: `css/style.css`, `html/index.html`, `js/scroll-scenes.js`, `js/starfield.js`,
`js/main.js`. Interior pages untouched (step 3).*

---
---

# 14. Round 12 — Full-page flow field (IMPLEMENTED)

A large change to a verified build: the particle field becomes a **continuous flow that runs
the whole page**, scene forms become **attractors** in that flow, the composition goes
**full-bleed**, the **galaxy is cut** for a new four-motif world, and **scenes get longer**.
Aesthetic target: teamLab — continuous, immersive, organic, no visible mechanism. Palette
unchanged (teal/cyan dominant, warm confined to hot cores).

Work lands on branch `feature/full-page-particles`, off the `v2.0-redesign` tag.

## 14.1 Part 1 — four bugs at the bottom of index.html (diagnosed, fixes planned)

Measured in headless Chrome at 1440×900; root causes confirmed, not guessed.

1. **Closing line collides with the nav pill.** `.final-message` is `main > .index-region >
   section` — the shared nav-clearance rule targets `main > section, .page-header, h1/h2/h3,
   .eyebrow`, so it never matches this nested section (measured `scroll-margin-top: 0px`).
   **Fix:** broaden the clearance selector to reach nested sections (add `.final-message`, or
   switch to `section` + a scoped exclusion), so it inherits `--nav-clearance`.
2. **Near-full-viewport empty black band around the closing line.** The document flow is
   actually dense (0px between card blocks); the void is `.final-message`'s own padding —
   `var(--space-16)` = **128px top + 128px bottom** isolating one line — and it reads as *dead*
   black because the canvas goes dormant below the hero (Part 2). **Fix:** trim the padding to
   normal section rhythm; Part 2's calm full-page field fills the space so it is never dead
   black.
3. **Telemetry overlaps the footer.** `#telemetry` and `.stage-labels` are `position: fixed;
   bottom: 16px` — hero readouts that float over whatever sits at the viewport bottom, so at
   page-bottom they land on the footer. **Fix:** hide both once the hero leaves the viewport /
   the footer enters it (they are only meaningful over the hero). Ties into Part 2's new canvas
   lifecycle.
4. **Placeholder contact in the footer.** `mailto:contact@example.com` lives in the injected
   footer (`layout.js`). **Fix (needs your input):** I don't have the real address, so I will
   **remove the line** unless you give me one. *Also flagging:* the footer's `YouTube` and
   `各種SNS` links both point at `sns.html` (placeholders) — same question; left as-is unless
   you provide real URLs.

## 14.2 Part 2 — the field runs the whole page

- The canvas **stops going dormant** after the hero. The render loop runs hero → footer.
- Below the hero it drops to a **calm register**: lower density/brightness, slower drift, weak
  or no attraction (a slow settle of the *infrastructure* motif, §14.5). Present and moving
  behind the card grids and footer, never competing with text.
- **Contrast verified numerically over the field** (transparent-glyph method, as in the hero),
  per card region — not by eye. Target ≥ 4.5:1 on body copy, ≥ 7:1 on headings.
- **All three fallbacks apply to the full-page field, not just the hero:** no-WebGL →
  `body::before` gradient stands in for the whole page; `prefers-reduced-motion` → Three.js
  never downloads, static glow only; JS disabled → static glow + `<noscript>` nav.

## 14.3 Part 3 — continuous flow, not morph-between-static-sets (the core change)

**Current engine:** precomputed position sets per stage, interpolated by `uProgress` — reads as
a slideshow of shapes with dead stops at each peak.

**New engine — curl-noise flow + attractors (stateless, GPU-side):**
- **Baseline drift = curl noise in the vertex shader.** Every particle continuously advects
  along a divergence-free curl-noise field derived from its position + `uTime`. Result: the
  field is *always* moving, at every scroll position, including at rest. Curl (incompressible)
  noise gives swirling organic current with no sources/sinks — the teamLab look.
- **Scene forms = attractors.** Each motif defines a target position per particle (its place in
  the form). Rendered position = `mix(curlDriftPosition, attractorTarget, w)` where `w` is an
  **attraction strength** that ramps up as the scene centres, holds near 1, then releases toward
  0 as the next attractor engages. At `w≈1` particles concentrate into the recognizable form;
  as `w→0` the curl term dominates and they disperse back into the flow. A small residual curl
  displacement remains even at `w≈1`, so a held form still breathes — never a frozen frame.
- **Internal current, not uniform motion.** Curl amplitude and time-rate vary with **depth
  (`vNear`) and position**, so near particles drift faster/looser and far ones slower — the
  field has current, not a single global speed.
- **Transitions read as a current changing direction.** During a hand-off, `w` for the leaving
  motif drops while the curl amplitude briefly spikes (release), then the arriving motif's `w`
  rises (re-form). Particles flow from one region to the next rather than cross-fading between
  two objects.
- **Why stateless (no GPGPU ping-pong):** keeps the current single-`THREE.Points` +
  `ShaderMaterial` architecture and is far cheaper — necessary for a full-page, wider-coverage,
  always-on field to hold 60 fps (Part 7). Cost: no true momentum/history; the flow is animated
  curl-displacement, not an integrated simulation.
- **GPGPU escalation — the specific trigger (recorded so it can't become an open-ended
  rewrite):** move to a GPGPU FBO velocity-integration sim (true advection) **only if the
  stateless field reads as *displaced rather than flowing* — i.e. particles visibly snap toward
  targets and jitter in place with no sense of momentum or continuous travel between forms.**
  That is the one condition. Anything else (density, palette, form legibility, perf) is tuned
  within the stateless engine, not by escalating. *Recommending stateless first.*

## 14.4 Part 4 — full-bleed composition

- `FORM_OFFSET_X → 0` and forms scaled so the field **spans full width and height**; the viewer
  is *inside* the form, not looking at it across the page.
- Text stays **left-aligned and legible** via the existing local scrim/vignette (the dark
  per-glyph shadow + feathered vignette that already passes ~21:1). **Contrast re-verified at
  every stage after widening** — the form now sits under the text, so this is mandatory, not
  optional.

## 14.5 Part 5 — new motif set (galaxy cut)

The spiral galaxy is dropped (most literal/illustrative, tonally apart). Four motifs read as one
continuous world, physical → human-made:

| # | Motif | Attractor form | Carries |
|---|---|---|---|
| 1 | **宇宙 — cosmos** | The ring / torus, kept. Full-bleed, viewer inside it. | Site name, tagline |
| 2 | **自然 — nature** | Organic growth: branching, flowing filaments — between a root system, a current, and a nervous system. Grows and disperses. | 勉強の軌跡 → study.html |
| 3 | **社会 — network** | Nodes + edges emerging *out of* the flow (not drawn as a diagram): connections forming and dissolving as attraction pulls drifting particles into clusters + edge bands. | 現在地 / 研究 |
| 4 | **情報基盤 — infrastructure** | A regular lattice / grid with data streaming along its lines — server racks, packet flow. The most ordered form; the flow finally organized. | ノート・ブログ・動画・SNS |

Below the hero, the field settles into a **slow drift of the infrastructure motif** behind the
cards and footer — the page ends inside the structure the narrative built.

## 14.6 Part 6 — longer scenes

- Desktop stage span **~80vh → ~120vh** (hero **~480vh**); mobile **~90vh/stage** (~360vh).
- The `tp`-synced text opacity + mobile even-spacing (§6 mobile) carry over; the readable-copy
  table (whole text blocks) is **re-measured and reported** — a longer hero should improve
  max-simultaneous / crossfade numbers; that will be confirmed, not assumed.
- Extra height = more scroll before the cards, so a **scroll-to-content affordance** stays
  present (the existing `Scroll ↓` hint on stage 1, and the field's downward current reads as
  "keep going") and the page must not feel like it's withholding content — checked in the
  below-hero still.

## 14.7 Part 7 — performance, to be measured (real browser, M5)

Reported after implementation, numerically:
- Particle count per tier as shipped.
- Median + p95 frame time while scrolling the full page, with sample count.
- Clipped-pixel % and lit-body median for each of the four motifs.
- Frame time specifically in the **below-hero** region (field behind cards).
- **Rule:** if the full-page field can't hold 60 fps, reduce **below-hero** density, never the
  hero's.

## 14.8 Canvas lifecycle (replaces the dormant model)

`#scene-canvas` stays fixed + full-viewport and renders continuously. State is a function of
scroll: **hero region** → full density/brightness, attractors active per stage; **below-hero**
→ calm register (reduced density, brightness, time-rate; infrastructure drift). No
`is-dormant` opacity-off. `visibilitychange` still pauses when the tab is hidden. Telemetry +
stage-labels hide below the hero (Part 1 bug 3).

## 14.9 Shipped values + measurements (real browser, Apple M5, headless Chrome)

- **Engine:** stateless curl-noise flow field (Ashima 3D simplex, forward-difference curl of a
  3-component potential) + attractor blend `mix(curlDrift, target, w)`; `w` peaks at each scene
  centre, dips to 0 between. Four motifs: cosmos (ring), nature (branching filaments), network
  (nodes+edges from flow), infrastructure (lattice + streaming). Full-bleed (`FORM_OFFSET_X = 0`,
  camera z 7 desktop / 8.5 mobile, form radius S = 3.5 / 2.05). Text sits inside the field.
- **Full-page lifecycle:** canvas never goes dormant; below the hero a `calmFactor` lowers
  brightness (×0.42), cuts density via `setDrawRange` (−55%), and settles the field to the
  infrastructure motif. `body.hero-passed` hides the hero telemetry/labels. Pauses only on tab-hide.
- **Particle count per tier:** 84 000 desktop / 42 000 low-power / 30 000 mobile (`?n=` override).
- **Frame time (1440×900, M5, real GPU timer + rAF pacing):**
  - Full page, auto-scroll top→bottom, **1656 frame samples:** median **16.7 ms**, p95 **17.2 ms**,
    **0 dropped frames (>20 ms)**; GPU cost **~3.3 ms** (was ~1.8 ms for the morph — curl adds ~1.5 ms).
  - Below-hero region, 180 samples: median **16.7 ms**, p95 **17.1 ms**, 0 dropped, GPU ~3.4 ms.
  - → locked 60 fps everywhere; the below-hero density cut was not needed for frame rate (kept for headroom).
- **Per-motif clipped-pixel % / lit-body median (canvas only):** cosmos 0.000 % / 0.11 ·
  nature 0.022 % / 0.08 · network 0.000 % / 0.08 · infra 0.000 % / 0.08. No blowout; the
  lit-median is lower than the old occupying-40 % formations because the full-bleed field is
  diffuse across the whole frame (deliberate — atmospheric, not a solid object).
- **Contrast (white text, transparent-glyph over bg+scrim):** cosmos 20.8 / nature 21.0 /
  network 20.9 / infra 20.9 : 1 (heading), ~20.4–20.8 : 1 (body). Below-hero **card** text over
  the veil + calm field: **20.4 : 1**. Full-bleed did not hurt contrast — text sits in the dark
  region + local scrim; all far above the 4.5 / 7 : 1 targets.
- **Longer scenes:** desktop 120 vh (480 vh hero), mobile 90 vh (360 vh) with a 50 vh head/tail
  spacer → mobile scene centres tp = [0.122, 0.374, 0.626, 0.878] (near-exact even). Readable-copy
  (240 samples, whole `.scene__content` blocks): **max 1 block > 0.5, 0 px two-visible > 0.5,
  0 px blank gap** — optimal, now with a longer readable dwell per stage.
- **GPGPU escalation:** not triggered — the field reads as flowing (curl drift continuous, forms
  release and re-form), not displaced/snapping. Stays stateless.
- **Fallbacks (unchanged, now page-wide):** reduced-motion → no Three.js, static glow; no-WebGL /
  JS-off → `body::before` gradient + `<noscript>` nav for the whole page.

*Untested at runtime: desktop Safari (per §13 Round-11 — still gated). iOS was device-verified
in an earlier round; the flow field's momentum behaviour on iOS has not been re-checked on-device.*

## 14.10 Density/brightness regression fix (Round-12 follow-up)

The first cut of the full-bleed field was too dim — lit-body median 0.08–0.17 vs the 0.4–0.6
band that holds tonal structure. Flagged as a regression (not "expected"). Three compounding
causes, all fixed:
- **Per-area density had collapsed:** full-bleed spread the form over ~2.5× the old area while
  the count went *down* (90k→84k) → <⅓ of r22 density. **Fix: 84k → 200k desktop** (110k
  low-power, 70k mobile), so per-area density is **169–186 particles / 1000 px²** vs the r22
  baseline ~174. Frame-time curve (M5): 84k→2.5 · 120k→3.5 · 160k→4.5 · **200k→5.5 ms**, every
  point locked 60 fps / 0 dropped; r29 full-page median 16.7 ms, p95 17.3, GPU 3.9 ms.
- **Curl was smearing the form:** confirmed `w` reaches 1.0 at each scene peak (clip appears
  only there); lowered the held-form residual curl (0.06 → 0.022) so the form is crisp when
  looked at and dissolves into flow on either side.
- **Per-particle brightness too low:** uAlpha 0.16 → 0.50, uExposure → 1.08, point size 16→17,
  ring tube thickened, infrastructure lattice brightened. **Form-region body-median now:
  nature 0.47, network 0.45, infra 0.42** (in band), **cosmos ~0.40** (thin ring — measured
  0.33 at α0.40, scales to ~0.41 at shipped α0.50; its dense peak could not be screenshotted
  in headless, so this one is estimated, not captured). Clipped pixels **< 0.4%** all motifs.
  Individual dots + dark gaps still visible at 1440×900.
- **Below-hero field was invisible** (×0.42 brightness, −55% density). Raised to ×0.72 / −20%
  → the infrastructure lattice is now clearly present behind the cards; card text contrast
  re-verified over it: **heading 15.2 : 1, body 19.0 : 1** (both pass). Index-block rhythm
  tightened (padding 96→64 px) so 06/07 no longer sit a viewport apart.
- **Network hierarchy:** more particles on nodes, brighter hubs (few bright / many small),
  tighter edges → reads as nodes+edges, not a cloud.
- Eyebrow numbering verified continuous **01–10** (05 present).

*Measurement caveat: the always-on 200k WebGL page destabilises headless-Chrome screenshots at
the cosmos peak specifically; cosmos's shipped still/number are from an intermediate build
(α0.40) — visually representative, numerically ~0.41 estimated. Everything else is r29-fresh.*

---
---

# 15. Round 13 — reshape three motifs, motion through the whole page (PROPOSED — pending approval)

Copy is out of scope this round (owner rewrites headings/body later); this is motion only.
Off `v2.1-density-restored`. Nothing implemented until this section is reviewed.

## 15.1 Two fixes from Round-12 feedback

- **Dial the below-hero register back** ×0.72 → **×0.62** (it currently reads as a bold lattice
  with heading text sitting on a bright grid line). Re-verify card contrast **sampling under the
  actual glyph bounding boxes** (the 15.2:1 figure looks too high for the image — the sample
  point was likely not under the glyphs), and report per stage.
- **Network distribution is inverted** — empty left-centre, nodes biased right. Rebuild so
  connection density **peaks at the centre and tapers outward**, symmetric, no holes (§15.4).

## 15.2 The full ten-stage motion table

The field now changes form and motion at **every** stage, hero → footer, as one continuous
attractor flow (no frozen backdrop below stage 04).

| # | Stage | Region | Form | Motion |
|---|---|---|---|---|
| 01 | 宇宙 cosmos | hero | **Volumetric sphere** (was ring) — particles through the volume, warm core glowing through | slow rotation, near/far parallax |
| 02 | 自然 nature | hero | **Undulating waves** (was branches) — overlapping horizontal bands | continuous ripple 揺らぎ, highest residual motion of any motif |
| 03 | 社会 network | hero | **Network, rebuilt** — centre-dense, hub hierarchy, symmetric | nodes/edges emerge + dissolve |
| 04 | 情報基盤 infra | hero | Lattice (kept) | streaming along lines |
| 05 | 基礎領域 | below | **Dispersal** — the 04 lattice releases into a DENSE unstructured drift (the raw substrate before it is organised); density stays at the calm level, only the structure is removed | slow drift, no attractor form |
| 06 | 専門領域 | below | **Orbits** — concentric elliptical paths | slow orbital drift |
| 07 | Notes | below | **Strata** — accumulated horizontal layers | slow stacking |
| 08 | Blog | below | **Flowing stream** — a directed current across the frame | steady directed drift |
| 09 | Videos | below | **Waveforms** — oscillating signal-like bands | oscillation |
| 10 | Projects | below | **Convergence** — particles gather inward to one bright form | inward pull; the page's arrival |

## 15.3 — 01 COSMOS: ring → volumetric sphere (must read as 3D, not a disc)

The old Earth failed as a flat cyan circle; this must not repeat. Depth cues, all applied:
- Particles distributed through the sphere's **volume** (`r = R·cbrt(rnd)` for uniform-ish
  volume, then bias slightly outward), **density falling toward the limb** so the silhouette is
  soft, not a hard circle.
- **Far side dimmer + smaller** than the near side — brightness and point size scale with the
  particle's view-space z (front hemisphere brighter), so you see *through* the object.
- **Continuous slow rotation** so near/far parallax is visible in motion.
- **Warm core** — ember/magenta at the centre glowing through the cool outer volume (a strong
  interior depth cue).
- Full-bleed, viewer close.
- *Verify 3D numerically:* capture two frames a few seconds apart; confirm near and far
  particles moved by **different** amounts (parallax), not a rigid disc.

## 15.4 — 02 NATURE: branches → waves (揺らぎ)

- Several **overlapping wave layers** at different depths and speeds → parallax.
- Wave = a horizontal band whose height is a sum of travelling sines in x/z plus curl; **crests
  bright, troughs dark** (tonal range, not uniform fill).
- **Highest residual curl amplitude of any motif even at peak** — this is the motif that most
  obviously never stops moving. It is the exception to "crisp at peak."

## 15.5 — 03 NETWORK: rebuild the distribution

- **Even coverage, no holes**; fills its area.
- **Connection density peaks at centre, tapers outward** — sample node positions from a
  centre-weighted radial distribution (`r = R·rnd^1.6`, dense middle), and bias edge creation
  toward central nodes so the middle is the most interconnected.
- **Hierarchy:** a few large bright hubs (high degree), many small dim nodes; edges dimmer +
  thinner than nodes.
- **Symmetric-ish**, no side bias (the current right-bias came from an asymmetric sample — fixed
  by the radial distribution + centred mean).
- Emerges from / dissolves back into the flow (attractor model).

## 15.6 Stages 05–10 — motion through the whole page

The attractor system extends from the 4 hero scenes to **all 10 stages**: `sceneF` spans 0–9,
driven by the true centres of the hero scenes (01–04) *and* the index-region blocks (05–10).
The field morphs through 10 attractors across the full page scroll; transitions use the same
`mix(curlDrift, target, w)` model, so it stays one continuous flow.

Constraints for 05–10 (all verified numerically before shipping):
- **Calm register throughout** — brightness/density at the post-dial-back level (§15.1), never
  the hero's. Motion and form change; the reading environment stays quiet.
- **Slower than the hero** — lower time-rate on the curl + attractor easing, so the field does
  not pull the reading eye.
- **Forms sit clear of the left text column** — dense mass offset right + below; **contrast
  sampled under the glyph boxes for every stage 05–10** and reported (heading ≥ 7:1, body ≥ 4.5:1).
- Attractor transitions between all of 05–10 (continuous, not cut).

## 15.7 Performance with ten forms (to be measured)

Ten resident morph targets raise attribute memory and vertex cost. Plan + budget:
- **Attribute memory** (position 3f + energy/bright/stream 3f = 24 B/particle/target, + 4 B seed):
  desktop 200k × 10 ≈ **48 MB**, low-power 110k ≈ 26 MB, mobile 70k ≈ **17 MB**. These are static
  VBOs — fine for M-class GPUs, but confirmed on device before shipping; mobile 17 MB is the one
  to watch.
- **Frame time** with all ten targets resident: median + p95 while scrolling the whole page,
  reported per the usual method. The curl noise dominates cost, not the 10-way target select, so
  the expectation is ~unchanged from the 4-motif build — but measured, not assumed.
- **Streaming fallback (only if measurement demands it):** keep just the neighbouring targets
  (floor/ceil of `sceneF` ± 1) resident and stream the rest via `bufferSubData` on stage change.
  Not pre-optimised — implemented only if 48 MB or the frame time actually breaks 60 fps.

## 15.8 Capture plan

Re-shoot all ten stages. If headless Chrome still destabilises at the cosmos peak, **hide the
nav's `backdrop-filter` for that capture** or shoot in a real browser — **no intermediate-build
still presented as representative**; any substitute is labelled as such.

## 15.9 Round-13 approved adjustments (from review)

- **05 基礎領域 is a DISPERSAL, not a second lattice.** After 04 (the hero's terminal ordered
  state) the lattice releases into a dense, unstructured drift — a change of state at the
  hero→reading handoff, and the raw substrate that 06's orbits then organise. **Hard condition:
  dense, not sparse** — keep particle count at the calm-register level and remove only the
  attractor structure (`w→0`, particles ride the curl freely). Verify with the per-area density
  metric: 05 must be comparable to 04/06, not a hole. (This is essentially the field with no
  attractor — the curl flow made visible.)
- **Sphere centre clip (01):** `r = R·cbrt(rnd)` gives the longest sight-line chord through the
  middle → projected density peaks at centre → additive white-out (the Round-6 condition), right
  where the warm core sits. Mitigation: **deliberately thin the central volume** (carve a soft
  low-density core, e.g. reject a fraction of small-r particles) and keep the **warm core small
  and localised**, not a broad bright mass. Report **clipped-pixel % sampled at the sphere centre
  specifically**, not the whole-frame average.
- **Network rim holes (03):** `rnd^1.6` is a strong centre bias → sparse rim → gap ring, which
  fights "no holes." **Tune the exponent** (start ~1.15–1.25) so the centre is clearly densest
  *and* the rim keeps continuous coverage. Report the **radial density profile** (particles /
  1000 px² in concentric bands), not an assertion.
- **05–10 uneven dwell:** `sceneF` is driven by index-block centres, whose heights are
  content-dependent — the same desync class as the mobile `tp = [0, 0.265, 0.735, 1]` bug.
  **Measure each block's scroll span + centre first and report;** even out with spacers if any
  stage is materially compressed.
- **Waves floor (02):** the higher residual is allowed, but the wave motif must still hold
  **lit-body median 0.4–0.6, clip < 2%, dots + dark gaps visible at 1440×900.** The undulation
  comes from the **wave surface travelling** (animate the band's displacement field over time),
  not from per-particle smear; cap per-particle residual if it threatens the floor.
- **Below stage 10 / behind the footer:** the **Convergence holds.** Once `sceneF` reaches 10
  (past the last block), the gathered-inward form stays, breathing slowly at the calm register —
  the page ends resting inside the arrival, not on a form that drifts apart or goes black.

## 15.10 Round-13 shipped values + measurements (M5, headless Chrome)

Ten resident morph targets (attribute-packed: 10 pos vec3 + 3 packed-eb vec4 + seed = 14 of 16
attribute slots; aux derived procedurally). `sceneF` spans 0–9 across the 4 hero scene centres +
6 index-block centres; below the hero a calm register (×0.62 brightness, ½ curl time-rate,
DENSE — no draw-range cut). Convergence holds behind the footer.

- **Attribute memory:** desktop 200k → **32.8 MB** (packing cut it from 48.8 MB), low-power
  110k ≈ 18 MB, mobile 70k ≈ 11.5 MB. Well within budget.
- **Frame time (K=10, all ten targets resident):** full-page median **16.7 ms**, p95 17.4,
  **0 dropped** (1763 samples), GPU **4.7 ms** (K=4 was 3.9 — the 10-way select cost ~0.8 ms).
  Below-hero: median 16.7, 0 dropped, GPU 4.4 ms. 60 fps throughout; streaming fallback NOT
  needed (measured).
- **Stage dwell (item 3):** hero gaps 1080 px each; below-hero gaps evened with a 60vh block
  min-height to **540 / 540 / 567 / 610 / 583 px** (was 468–610, ~30% → ~13%). Both field and
  hero text key off the same centres, so no desync.
- **Sphere centre-clip (item 1):** whole-frame 0.5%, **centre box 0.45%** (was **28%** before
  thinning the core/shell centre — the Round-6 white-out, which the whole-frame 1% masked).
- **Network radial density (item 2):** 127 / 64 / 62 / 31 / 15 lit-px per 1000 px² from centre
  → rim — centre densest, smooth taper, no gap ring (rim sparse but continuous).
- **Per-stage contrast 05–10 (sampled UNDER glyph boxes):** heading 13.1–20.5 : 1, body
  17.2–20.6 : 1 — all far above 7 / 4.5 : 1. The ×0.62 calm field keeps text high-contrast.
- **Nature waves lit-body (item 4) — DOES NOT meet the floor:** body-median **0.31**
  (crest-median 0.38, frac≥0.4 = 0.16), clip 0%. The crest/trough tonal range that was
  requested inherently pulls the whole-body median down (dark troughs by design); the crests
  reach ~0.38–0.40 but the troughs drag the median to 0.31. Reaching 0.4–0.6 whole-body would
  mean removing the troughs (a uniform slab), losing the wave. **Flagged for the owner's
  decision** — keep the wave character (0.31) or trade it for a denser blob that hits the number.
- **Sphere 3D read:** confirmed by the STATIC cues (volumetric density, warm core glowing
  through the cool volume, soft limb, front-brighter via `vNear`) — visually a clear orb.
  *Motion-parallax metric inconclusive:* a two-frame frame-diff can't isolate near/far
  displacement in a dense symmetric sphere (front/back move equal-magnitude opposite directions;
  pixel-diff reads uniform, ratio ~1.05). Proper per-particle tracking not done — **marked as a
  measurement limitation, not a verified pass.**
- Below-hero dialled back ×0.72 → ×0.62; network distribution rebuilt (centre-dense); eyebrow
  numbering continuous 01–10.

## 15.11 Round-13 review follow-up (fixes from the second review)

- **Waves — metric exception (PERMANENT, do not "fix"):** the wave motif (02) is judged on
  **crest-median ≥ 0.4**, not whole-body median. The 0.4–0.6 whole-body band was a proxy for
  "tonal structure exists"; waves fail it for the *opposite* reason — deliberate dark troughs.
  Flattening the troughs to hit the number would destroy the structure the number exists to
  protect. Shipped: **crest-median 0.40, crest/trough ratio 2.7, clip 0%**, dots + dark gaps
  visible. Every other motif stays on whole-body median 0.4–0.6. *Nobody should later re-flatten
  the waves into a uniform slab to satisfy the whole-body metric.*
- **Sphere (01) — internal structure + clip control:** restored the volumetric read with angular
  CLUMPS + radial shells + a tight warm core (glows through the cool volume). Clip held by
  **lowering per-particle brightness toward the centre** (`brCtl = 0.13 + 0.72·rn²`) rather than
  removing particles, so the density survives: **centre-box clip 0.12%** (was 22.7% when the raw
  chord density returned). *Parallax metric — honest limitation:* neither frame-diff nor
  cross-correlation cleanly quantifies rotation displacement in a dense stochastic field (the
  angular clumps are too low-contrast against particle noise to track; ratios ~1.0, correlation
  inconsistent). The 3D read is evidenced VISUALLY (clumps, shells, warm core in the still) and
  by construction, **not by a verified parallax number.** A stronger, measurable rotation cue
  would need high-contrast bands/filaments, trading the soft volumetric look — offered, not taken.
- **08 stream — legibility:** rebuilt as 9 horizontal flow-lines with a brightness ramp toward
  the leading edge + a directed +x brightness pulse in the shader → reads as a directed current.
- **09 waveforms — legibility:** rebuilt as 5 thin, regular, periodic signal traces (higher-freq
  travelling surface) → reads signal-like and distinct from 02's organic fluid waves.
- **10 convergence — moved:** offset `(+0.78S, −0.5S)` so the gathered form sits clear of the
  centre Projects card (was directly behind it).
- **Card thumbnails on-palette:** `.media-placeholder` + `.blog-image/.video-thumbnail` moved
  from a saturated blue+magenta block to a teal/cyan gradient with a faint (0.09–0.10α) warm
  accent — §2.3 (warm confined to cores) now holds in the calm reading region.
- Frame time after all changes: full-page median **16.7 ms, 0 dropped**, GPU 4.7 ms (60 fps).

## 15.12 Sphere rotation — KNOWN MEASUREMENT LIMITATION (closed, declined)

The cosmos sphere (01) reads as a 3D volume **by construction and visually** (uniform-volume
sampling, angular clumps + radial shells, a tight warm core glowing through the cool volume).
Its **rotation is not numerically verified**: both frame-diff and cross-correlation fail to
quantify near/far displacement because the internal structure is deliberately **too low-contrast
to track** against the dense particle field. A numerically-verifiable rotation cue would require
higher-contrast banding/filaments, which costs the soft volumetric quality — **this trade was
offered and declined** (the metric exists to protect the design, not the reverse). No further
work on the sphere; the 3D read stands on visual + constructional evidence.

## 15.13 Stage 06 orbits — three-dimensional (Round-13 follow-up)

Was coplanar nested ellipses on a tilted disc (read flat). Rebuilt:
- **Each ring in its own plane** — distinct inclination (15–55°) + longitude of ascending node
  + eccentricity, so rings **visibly cross** (one in front, then behind). *3D verified by the
  two-frame spin test — which works here (unlike the sphere) because rings are trackable
  features:* patches on different rings displaced **(0, 23, 16, 12) px in different directions**
  under one 0.12-rad rotation.
- **Depth via a hard near/far ramp** (additive gives no occlusion): near arc brighter + points
  larger, far arc dimmer + smaller — ramp pushed much harder for this motif only
  (`nearRamp = mix(…, 0.1+1.65·vNear, orbW)`, size `+orbW·1.35`), overall still calm register.
- **Star at the common FOCUS** (not centre) — small, tight, warm (magenta/ember, core-only); the
  ellipses are eccentric with periapsis nearer the star, adding perspective asymmetry.
- System offset +0.55S right so the dense rings clear the left text column; contrast re-sampled
  under the glyph boxes: **heading 18.1:1, body 17.8:1** (was 12/14 before the offset).
- The "vertical rule" by the ノートを読む CTA was a **field coincidence** (an orbit-ring edge),
  not a CSS element (btn-secondary has a transparent border; the only `.btn::before` is an
  invisible hover glow) — gone with the redesign.

---

# 16. Round 14 — Scroll-snap so each motif settles and holds

Reverses the earlier "never hijack scroll" rule *deliberately*, but only via **native CSS
scroll-snap** — no JS wheel/touch interception, no animated `scrollTo`. The browser keeps
ownership of inertia and momentum, and the user can always stop mid-transition. That is the
non-negotiable method constraint; a JS scroll-jack was explicitly rejected and stays rejected.

## 16.1 Mechanism

- `scroll-snap-type: y proximity` on `html` (the document scroller). **proximity, not
  mandatory** — mandatory traps the user (can't rest between points, fights find-in-page,
  keyboard, anchors). proximity settles a *deliberate* scroll onto a motif while leaving an
  escape. Chrome serialises the computed value as `y` (proximity is the default strictness).
- `scroll-snap-align: center` on `.hero .scene` **only** (stages 01–04). The index blocks
  05–10 have card grids and body copy being read — they never opt in, so they stay free-scroll.
  (Snap points exist only where `scroll-snap-align` is set; type on the container is inert
  elsewhere.)
- **Snap target = the motif peak, not the section top.** Each `.scene` is 120vh, so its
  geometric centre *is* the scroll position where that stage's `w` reaches 1.0
  (`sceneFor(scrollY + innerHeight/2)` hits an integer stage index at the centre). `align:center`
  therefore lands the fully-formed motif with no extra marker element.

## 16.2 Dwell plateau (the actual goal)

Snapping alone isn't enough — before this round `w` peaked at a single position and immediately
declined. Widened the attractor weight from a point to a **band**:

    fc = min(f, 1-f);  w = 1 - smoothstep(0.20, 0.5, fc)   // was smoothstep(0.10, …)

`w` now holds at **1.0 across fc ∈ [0, 0.20]** — a scroll band ~±24vh around each snap point —
then dissolves to `w = 0` at the midpoint (fc = 0.5) between stages. The form stays fully
resolved for the whole time the viewer rests, then still fully disperses and reforms between
stages. **The residual curl is untouched**, so at `w = 1` `amp = resid` (0.022; nature +0.03 per
the §15.11 exception) — the field keeps breathing, it is never a frozen frame. Applies globally
(below-hero forms also hold longer), which is consistent and desirable; only the *snap* is
hero-scoped.

## 16.3 Verification (M5 headless Chrome, 1440×900, measured not eyeballed)

`w` at each of the four hero snap rest positions (`snapRest(i) = centre − (innerHeight+92)/2`,
the 92px being `--nav-clearance`, which insets the snapport top so the rest sits pad/2 above true
centre — still deep inside the plateau):

| stage | sceneF at rest | w at rest |
|-------|---------------|-----------|
| 01 cosmos | 0.0000 | **1.0000** |
| 02 nature | 0.9557 | **1.0000** |
| 03 network | ~2.000 | **1.0000** |
| 04 infra  | ~3.000 | **1.0000** |

Stills: `docs/stills/s14-rest-0{1..4}-*.png` — each form fully resolved at rest. **(Updated in
§16.7: the engine now references the snapport centre, so sceneF is an exact integer at rest — the
table above originally read 0.0/0.956/1.955/2.955 before that fix.)**

## 16.4 §6 must-not-break — tested, not assumed

- **prefers-reduced-motion: reduce → snap OFF.** The rule is gated
  `@media (prefers-reduced-motion: no-preference) and (min-width: 601px)`. Emulated reduce →
  computed `scroll-snap-type: none`. ✓ (Three.js is also already skipped under reduce.)
- **Mobile (≤600px) → snap OFF** via the same `min-width: 601px` gate. Emulated 390px → `none`.
  ✓ iOS momentum + scroll-snap is historically janky; free-scroll on mobile is the stated
  acceptable outcome. **This is provisional pending the device pass** — one media-query edit
  flips it on if it feels good on the phone.
- **Anchor links / `scroll-padding-top`.** `scroll-padding-top` still computes 92px; an index
  anchor (`#found-h`, no snap-align) lands clearing the nav, unchanged from before this round —
  proximity does not fight it. ✓
- **Off-screen focus.** Focusing a below-fold hero CTA scrolled it into view (scrollY 0 → 2068,
  CTA at 496px). ✓
- **Keyboard / find-in-page.** Not trapped **by construction**: proximity (unlike mandatory)
  never blocks a scroll from resting where the user/browser put it; it only nudges when a rest
  already lands near a point. These are interaction behaviours the user will confirm in the
  device/desktop pass.

## 16.5 §7 stage-height note

Hero stages are 120vh, so adjacent snap centres are 120vh apart — a snap *could* traverse >1
viewport. proximity mitigates this (it only engages near a point; it does not force a full-stage
jump from a rest between stages). If the device pass reads it as a *jump* rather than a *settle*,
the fix is a **decision for Max** — shorten hero stages toward 100vh, or add intermediate rest
points — not chosen here.

## 16.6 Debug hooks added

`window.__field.wAt(scrollY?)` → the shader's `w` for any viewport-centre scroll position
(defaults to current); `window.__field.snapRest(i)` → the doc-space scrollY where hero stage `i`
snaps to rest. Both mirror the shader/CSS exactly and are there for the device pass too.

## 16.7 Round-14 review follow-up (network edges, interaction tests, rest-position contrast)

**1. Network edges regressed → root-cause was the snap rest, not the geometry.** The `make()`
network build (nodes + 3-nearest edges) and all render globals were **byte-identical** to
`v2.2-ten-stages` — the thin edge bands were still in the data. The regression came from *where
the snap parked the view*: the 92px nav-clearance insets the snapport, so `align:center` rested
network at **sceneF 1.955**, not 2.0. At 1.955 the target is `mix(nature, network, 0.955)` — a
4.5% blend toward the nature wave that adds a random per-particle displacement ~0.045·S, enough
to smear the thin, dim (bright 0.48) edge bands into fuzz while the bright node clusters survive.
Confirmed empirically: a capture at the *true* peak (sceneF 2.0) showed crisp edges; the snap
rest did not.

Fix (no network rebuild): reference the **snapport centre** in the engine, not the raw viewport
centre — `midOf() = scrollY + (innerHeight + SNAP_INSET)/2`, where `SNAP_INSET` is read from the
computed `scroll-padding-top`. A snap rest now lands on an **exact integer sceneF** → a pure
motif, no cross-blend. This also makes cosmos/nature/infra purer at rest. `w` stays 1.0000 at all
four (now with fc = 0 exactly). Edges restored to the R13 look: `docs/stills/s14-rest-03-network.png`.

**2. §6 keyboard + find-in-page — machine-tested (not reasoned).**
- **Keyboard** (synthetic `Input.dispatchKeyEvent`, `keyDown`, from mid-hero scrollY 1500):
  PageDown 1500→2248 (+748), Space 1500→2248 (+748), ArrowDown 1500→1540 (+40). Every press
  advances **forward**; the snap never pulls back against a keypress. (First attempt with
  `rawKeyDown` drove only PageDown — a headless quirk, not a snap effect: ArrowUp also moved 0, so
  it wasn't directional. `keyDown` drives all three.)
- **Find-in-page** (its scroll mechanic = select the match Range + `scrollIntoView`): a match on
  the stage-04 string 回路 scrolled to top 400px and **stayed at 400px** after the snap settled —
  landed and held, not dragged away.

**3. Rest-position contrast — re-sampled, and it caught a real defect.** Method: hero text set
`color:transparent` (shadow **retained** — a transparent glyph still casts its shadow, so the
pixels under the box are the true effective background), luminance vs white text under the
heading + body boxes at each rest. Headline = **p95** (the max single pixel is one stray particle;
the median is mostly dark gaps between strokes):

| stage | heading p95 | body p95 |
|-------|------------|----------|
| 01 cosmos | 18.5:1 | 16.3:1 |
| 02 nature | 10.7:1 | 16.3:1 |
| 03 network | 20.9:1 | 20.8:1 |
| 04 infra | **17.1:1** | 18.9:1 |

The infra heading **failed on first measurement (2.17:1)** — the bright horizontal lattice band
crossed the 学びを、社会へ。 row, exactly as flagged. Fix: dim the infra lattice in the **left
screen third** via clip-space x (`leftDim = mix(1, 0.15+0.85·smoothstep(-0.55,-0.15, ndcx), vInfra)`)
— infra-only (`vInfra→0` elsewhere), and consistent with the "formation sits on the right"
composition. Heading went **2.17 → 17.1:1**; the lattice still fills centre+right. Still:
`docs/stills/s14-rest-04-infra.png`.

# 17. Round 17 — Stage reduction 10 → 7 (IMPLEMENTED)

Structural reduction of the index page. No copy was rewritten; surviving headings, eyebrows,
intro paragraphs, list items and CTA labels are unchanged. Eyebrow numbers were left as-is per
the copy freeze, so they are now non-sequential (01, 02, 04, 05, 08, 09).

## 17.1 What changed (DOM)

Removed whole `<section>`s (removed from the DOM, not hidden):
- **03 network** (`scene-network`) — the hero scene + its 運営者について CTA. self-intro stays
  reachable via the injected nav/footer.
- **07 Notes** (`notes-h`) — head + its two study.html cards.
- **10 企画** (`projects-h`) — head + its three non-clickable `<div>` placeholder cards.

Merged **05 基礎領域 + 06 専門領域** into one `.index-block`:
- **Kept:** the `found-h` section and its `.index-block__head`; eyebrow `05 — 基礎領域`; heading
  `学びの土台`; found-h's intro paragraph; **spec-h's intro paragraph `一つひとつの分野が…`**
  (restored verbatim between the found-h intro and the first list); found-h's 6-item `<ul>`;
  spec-h's 3-item `<ul>` (relocated in as a second list, order preserved); one CTA
  `勉強の軌跡を見る` → study.html.
- **Dropped:** the `spec-h` section wrapper; eyebrow `06 — 専門領域`; heading `専門という軌道`;
  the duplicate CTA `ノートを読む` → study.html.

(The spec-h intro was briefly dropped in the first pass — it lived inside the dropped head
wrapper — then restored verbatim on review; only the eyebrow, heading and duplicate CTA are gone.
So the merged block carries **two intro paragraphs** and two lists under one head.)

**convergence** now anchors on the existing closing `.final-message` section (its 学問の世界へ…
copy is unchanged); the scene engine treats it as a stage centre. This keeps the stage count at 7
without inventing a section — it replaces `projects-h` as the final "gather inward" stage.

Final 7 stages (sceneF 0..6): `cosmos · nature · infra · merged(基礎/専門) · blog · videos ·
convergence(final-message)`. Motifs: cosmos, nature, infra, dispersal, stream, waveforms,
convergence. Dropped motifs: **network, orbits, strata**.

## 17.2 sceneF remap (js/scroll-scenes.js) — every site

The engine is mostly parameterized by `K = stages.length`, so the sceneF **range** follows the
stage count automatically. Sites that follow K and were **not edited** (emit the new value on
their own): the vertex-shader clamp `if(iB>(K-1)) iB=(K-1)` (now emits 6, was 9); `sceneFor()`'s
piecewise map (`centers.length`, now 7); `EBV=ceil(K/4)` (now 2, was 3); `pickPos`/`pickEB`
codegen; `rotationFor`'s `Math.min(K-2, …)`; `HERO_K`-based calm ramp (now 3, was 4).

Sites that are hardcoded to a stage index and **were edited**:

| site | before | after | reason |
|------|--------|-------|--------|
| `stages` array | 10 motif names | `['cosmos','nature','infra','dispersal','stream','waveforms','convergence']` | surviving motifs, DOM order |
| `indexBlocks` selector | `.index-region .index-block` | `+ , .index-region .final-message` | promote final-message to a stage |
| `vInfra` key | `abs(uSceneF-3.0)` | `abs(uSceneF-2.0)` | infra 3 → 2 (network removed) |
| `streamW` key | `abs(uSceneF-7.0)` | `abs(uSceneF-4.0)` | stream 7 → 4 (blog block) |
| `wfW` key | `abs(uSceneF-8.0)` | `abs(uSceneF-5.0)` | waveforms 8 → 5 (videos block) |
| `orbW` | `1.0-clamp(abs(uSceneF-5.0),0,1)` | `0.0` | orbits removed; stage 5 is now videos — pin off |
| `ROT` array | 10 entries | 7 entries, remapped 0←0,1←1,2←3,3←4,4←7,5←8,6←9 | each survivor keeps its rotation |
| header + slot comments | "TEN"/"10-way"/14 slots | "SEVEN"/"7-way"/10 slots | accuracy |

`natureW` key `abs(uSceneF-1.0)` was **deliberately not changed** (nature stays stage 1).

**Intentional dead branches (not oversights).** Two pieces of orbit/removed-stage code are left
in the file on purpose; a future reader should read them as residue of a stage removal, not as
forgotten cleanup:

- **`orbW` pinned to `0.0` rather than deleting the branch.** `orbW` still feeds two live
  expressions — `boost = 0.5+en*0.8+vNear*(0.6+orbW*0.4)` and
  `nearRamp = mix(0.55+0.45*vNear, 0.1+1.65*vNear, orbW)`. Setting `orbW = 0.0` collapses both
  `mix(...)`/`+orbW*...` to exactly their no-orbit branch, which is the correct behaviour now that
  no stage renders orbits. Deleting `orbW` outright would force rewriting those two expressions
  (and re-deriving the no-orbit forms by hand) for no functional gain and more diff risk. The
  constant is the minimal, provably-equivalent edit. **Leaving the old `abs(uSceneF-5.0)` key
  would be a bug** — stage 5 is now videos, so the orbit near/far push would wrongly fire under
  the videos motif; that is exactly why it had to be neutralised, not just re-indexed.
- **Unused `make()` cases + precompute** (`network`, `orbits`, `strata`; and their precomputed
  `nodes`/`edges`, `orbEls`, and the network/orbit constants) are left in place. They are inert:
  the `stages` array no longer names those motifs, so `make()` is never called with them and the
  precompute results are never read. They were kept deliberately to keep this change surgical and
  reversible — restoring a motif is then just re-adding its name to `stages` (+ its shader key and
  a `ROT` entry), with no need to reconstruct the generator logic. Removing them is safe cleanup
  but is out of scope for a structural stage-count change.

## 17.3 Attribute memory

Particle **count is unchanged** (desktop 200 000 / mobile 70 000). Per-particle attribute floats
= `K*3 + ceil(K/4)*4 + 1`: **43 → 30** floats (172 → 120 bytes). Target count per particle
= K: **10 → 7**.

| | before (K=10) | after (K=7) | Δ |
|---|---|---|---|
| desktop attribute bytes | 34.40 MB | 24.00 MB | −10.40 MB (−30.2%) |
| mobile attribute bytes | 12.04 MB | 8.40 MB | −3.64 MB (−30.2%) |
| desktop total targets | 2.00 M | 1.40 M | −0.60 M |
| mobile total targets | 0.70 M | 0.49 M | −0.21 M |

(CPU-side Float32 vertex buffers uploaded as attributes; GPU VRAM tracks this plus driver
overhead. Measured `__field.attributeBytes` = 24 000 000 desktop, confirming the calc.)

## 17.4 Jump navigation — scrollIntoView, measured reason

Round-16 measured that a bare hash-fragment jump lands the **heading** at the viewport top, which
leaves short index blocks outside the ±0.20-fc dwell plateau and settles the motif weight w at
**0.02–0.83**. `scrollIntoView()` on the whole `<section>` lands block-start and resolves
**w = 1.0**.

So each retained index title (merged/`stage-study`, `stage-blog`, `stage-videos`) is an
`<a class="stage-jump" href="#<section-id>">` wrapping the (unchanged) heading text. `main.js`
intercepts `.stage-jump` clicks: `preventDefault()` + `closest('section').scrollIntoView()`; the
generic `a[href^="#"]` handler is excluded via `:not(.stage-jump)`. The `href="#<section-id>"`
is the no-JS fallback — and because it targets the **section id** (not the heading id as the old
hash did), the fallback also lands within the plateau. No new scroll/animation dependency.

Hero titles were **not** wired: Round-16 showed hero hash-jumps already resolve w = 1.0 (the
plateau absorbs their 0.126-fc landing), so they have no problem to fix. convergence has no title,
so it has no jump anchor — reached by scroll only.

## 17.5 Verification (M-series, headless Chrome + SwiftShader, measured)

Local harness, Three.js served from a pinned local copy, HTTP cache disabled. Before = the
10-stage build; after = this build. Full tables live in the Round-17 work log; summary:

- **w (E.1):** after build, the **wired scrollIntoView path resolves w_ss = 1.0 at all 7 stages,
  both 1440×900 and 390×844.** The no-JS `#section-id` fallback also resolves 1.0 at all stages
  (convergence has no anchor). No stage fails.
- **Dwell plateau (E.2):** hero spacing unchanged at 1080 px → plateau ±216 px; the hero landing
  held at **fc = 0.126** (identical to Round-16) → **that margin survived**. Index spacing is
  denser with fewer stages, so the last index plateaus tightened (videos next-spacing 372 px →
  ±74 px; landing fc 0.113, ~32 px slack) but every landing stayed inside the plateau (w = 1.0).
- **Snap (E.3):** after = `snapType: y`, `heroSnapAlign: center`, `blockSnapAlign: none`,
  `finalSnapAlign: none` (desktop); `snapType: none` (mobile). Snap remains hero-only and off on
  mobile; removing scene-network did not change which sections are snap targets, and
  final-message is **not** a snap target.
- **Heights / scrollHeight (E.4):** hero 1080 (desktop) / 760 (mobile) unchanged; final-message
  204/219. **scrollHeight: desktop 8210 → 5565 (−2645), mobile 8289 → 5614 (−2675).** (The raw
  section removals net network(1080)+notes(540)+projects(540)+one-merged(540) = −2700/−2766; the
  restored spec-h intro then adds the merged block back up by +55 desktop / +91 mobile — see
  below — giving the final −2645/−2675.)
- **Merged-block intro restore (review follow-up):** spec-h's intro `一つひとつの分野が…` was
  restored verbatim between the found-h intro and the first list, so the merged block now carries
  two intro paragraphs. Measured effect: **merged block height 540 → 595 (desktop, Δ+55) / 589 →
  680 (mobile, Δ+91)** — on desktop it now exceeds the 540 px (60vh) min-height and is
  content-driven. Landing still **w_ss = 1.0** (scrollIntoView fc 0.025 desktop / 0.049 mobile,
  well inside the ±0.20 plateau). Contrast under the merged title's glyph boxes unchanged (median
  ≈ 19.5:1; worst-case actually improved 6.82 → 6.04 desktop as the taller block spreads text over
  more of the calm field; ~14 700 samples). No clipping (0%).
- **Contrast under title glyph boxes (E.5):** median ≈ 18–21:1 (light text on near-black),
  stable before→after. Worst-case per title is the recorded exception — **nature ≈ 1.25:1 over
  the bright wave crests (intentional, outside the 0.4–0.6 lit band)** — plus cosmos ≈ 1.4–1.7
  over the sphere core; both unchanged from before. Sampled under every text run of each title
  block (heading+eyebrow+intro+list+CTA), thousands of samples per block.
- **Clipped-pixel % (E.6, centre-sampled):** cosmos ≈ 0.01–0.05, nature ≈ 7.5–8 (wave crests),
  infra ≈ 2.6–5 (slightly lower after), calm index blocks 0, convergence ≈ 0.3–0.6. No regression.
- **Frame time (E.7):** UNCHANGED before→after (particle count unchanged). Headless SwiftShader
  pins desktop at median 50 ms / p95 66.7 ms and mobile at 16.7 ms / 16.8 ms — **not
  device-representative; untested on real GPU.**

## 17.6 Constraint for future edits — index-block plateau margin is now thin

Reducing to 7 stages moved the stage centres closer together in the index region, so the pixel
width of the ±0.20-fc dwell plateau (the band where a landing still resolves to w = 1.0) shrank
there. Measured half-widths (0.20 × local centre spacing), after:

| region | spacing | plateau half-width | worst measured landing slack |
|--------|---------|--------------------|------------------------------|
| hero (cosmos/nature/infra) | 1080 px | **±216 px** | fc 0.126 → ~80 px |
| index → convergence tail | 540→372 px | as low as **±74 px** (videos) | fc 0.113 → **~32 px** |

Every stage currently lands inside its plateau (all w_ss = 1.0), but the tail margin is now as
small as **~32 px**. **Constraint:** any future change to index-block height, spacing, or the
number of index stages — including editing an index block's content enough to change its height,
adding/removing a block, or changing `--nav-clearance` / `scroll-padding-top` — can move a centre
far enough to push a landing past fc = 0.20 and drop that motif below w = 1.0 on a jump. After any
such change, re-run the Round-17 w-harness and confirm every stage still lands w_ss = 1.0; do not
raise the `0.20` plateau constant to paper over a regression without re-measuring the visual cost.
(The merged-block intro restore in §17.5 is a worked example: it grew the block +55/+91 px and
was re-measured — fc stayed 0.025/0.049, safely inside — precisely because of this constraint.)

## 17.7 Stills

Regenerated (desktop 1440×900, at rest): `docs/stills/r17-0-cosmos.png`, `r17-1-nature.png`,
`r17-2-infra.png`, `r17-3-merged-study.png`, `r17-4-blog.png`, `r17-5-videos.png`,
`r17-6-convergence.png`.

**Deleted** (depicted removed stages that no longer exist): `s03-network.png`, `s06-orbits.png`,
`s07-strata.png`, `14-network.png`, `s14-rest-03-network.png`.

**Regenerated against the new below-hero structure** (still a live region, so kept not deleted):
`16-belowhero-cards.png`, `s-cards.png`, `s-belowhero.png`.

The remaining stills (interior pages, cosmos/nature/infra motif stills `s01/s02/s04`, mobile-*)
still represent the current build.

# 18. Favicon

The site previously 404'd on the favicon (the browser's default `/favicon.ico` at the origin
root). Added a favicon **derived from the nav logo mark**, reusing the existing token/geometry
definitions rather than re-deriving by eye:

- Geometry from **`css/style.css` `.logo::before`**: a hollow ring, 14px content + 2px border =
  **18px outer / 2px stroke (outer:stroke ≈ 9:1)**, `border-radius:50%`. The SVG uses `r=9.8,
  stroke-width=2.4` on a 32-unit viewBox to hold that 9:1 ratio.
- Colours from `:root` tokens: stroke **`--accent` `#3d8bff`**, glow **`--glow-cool`
  `rgba(43,217,196,0.22)`** (teal `feGaussianBlur` halo), field **`--bg` `#000000`**. Only the
  glow *blur radius* is a proportional reproduction of `box-shadow 0 0 8px` (SVG blur ≠ CSS
  box-shadow exactly); the ratios and colours are exact.

**Files** (at the **git root**, one level above the site dir, next to the redirect `index.html`
and `.nojekyll`):
- `favicon.svg` — vector, primary (`rel="icon" type="image/svg+xml"`); crisp at every size.
- `favicon.ico` — 16+16 & 32×32 (PNG-in-ICO); the conventional `/favicon.ico` path and the
  fallback for engines without SVG-favicon support.
- `apple-touch-icon.png` — 180×180, iOS home-screen (`rel="apple-touch-icon"`).

(An SVG + a 16/32 `.ico` + the 180 apple-touch PNG cover every engine; no extra standalone PNG
is referenced, so none is shipped.)

**Paths & the two-level nesting.** Git root is served at `…/RDTP-project/`; the site pages live
under `…/RDTP-project/Academic-Gate_hp/html/`. So the 11 site pages link with `../../favicon.*`
(up two levels to the git root) and the root redirect `index.html` links with `favicon.*`
(same dir). Every page carries all three `<link>` tags.

**404 status (measured).** All declared icon paths return **200** with correct content-types
(`image/svg+xml`, `image/x-icon`, `image/png`), verified both by direct fetch and by loading a
page in Chrome and fetching each `<link rel~=icon>` href. Because every page now declares its
icon, browsers fetch the declared (200) icon instead of probing the origin-root `/favicon.ico`,
so the 404 no longer occurs in normal browsing. **Caveat:** the bare origin-root
`https://max-miyazaki.github.io/favicon.ico` is the GitHub *user-site* root, not this project
repo — it cannot be served from here and is untouched; it is simply no longer requested.

# 19. Round 18 — orbits for convergence at stage 6 (motif swap + provisional placement)

Convergence was replaced by **orbits** at stage 6. Convergence had been badly placed (its dense
grey-white core sat behind the footer, dropping 各種SNS to 4.8:1 and the mobile closing line
below AA) and off-palette (a blue-violet fringe from core energy reaching the 0.62–0.80 spectrum
band). Orbits is measurably the better motif: **teal-dominant rings + a confined warm star, no
grey core (0.08% vs 7.9%), no blue-violet body** — its only warm is the star (energy 0.93 →
magenta/ember), a hot core, which is on-palette.

## 19.1 The swap (js/scroll-scenes.js) — every hardcoded site

| site | before | after |
|------|--------|-------|
| `stages[6]` | `'convergence'` | `'orbits'` |
| `orbW` shader key | `0.0` (pinned) | `1.0-clamp(abs(uSceneF-6.0),0.0,1.0)` |
| `ROT[6]` | `[0.0, 0.0]` | `[-0.1, 0.12]` (orbits' tumble) |
| `make('convergence')` | live | **inert dead code**, kept for reversibility; its comment now says so and flags its stale `oy=-S*0.9` |

Memory is unchanged (K=7): confirmed `__field.attributeBytes` = **24,000,000 desktop /
8,400,000 (8.40 MB) mobile**. The swap changes no DOM, so heights, scrollHeight, w_ss, plateau
and snap are all identical to Round-17.

## 19.2 Placement — OPTION 2, PROVISIONAL (desktop full, mobile suppressed)

**This is a provisional decision, not a preference.** Stage 6 anchors on `.final-message`, whose
rest viewport is crowded: the closing line and a full-height footer leave only a **65 px** clear
band on mobile (measured: mobile closing-line bottom y265, footer union top y330). No visible
orbit system fits 65 px without landing on text. So:

- **Desktop:** full orbits, tuned by measurement to the current layout — `oScale = 0.116`,
  `oOy = 1.88`, `oOx = S*0.15`. It sits in the clear band **below the nav pill (y87) and above the
  closing-line glyphs (y327)**: measured orb bbox **y[123, 312]**, which intersects *no* glyph
  rect, so the warm star (at the orb centre) is provably clear of every glyph.
- **Mobile:** orbits **suppressed** — pushed off-screen at zero brightness
  (`if (isMobile) return […, 12.0+…, …, 0.3, 0.0, 0]`). Stage 6 renders **nothing** over the
  content (measured: 0 lit orb pixels).

Revisit when the planned heading/section restructure gives stage 6 a real slot. **The desktop
`oScale`/`oOy` are tuned to the *current* footer/closing-line geometry and a restructure
invalidates them** (see §19.4).

## 19.3 Verification (headless Chrome + SwiftShader, measured; nature-wave exception stands)

- **w_ss:** all 7 stages = **1.000** via the wired path at 1440×900 and 390×844. Landing fc
  unchanged from Round-17 (geometry untouched).
- **Snap:** desktop `y`/`center`; mobile `none`. Unchanged.
- **Heights / scrollHeight:** identical to Round-17 (desktop 5565, mobile 5614) — the swap is
  DOM-neutral.
- **Footer-glyph contrast (the new standing check, §19.4):**
  - Desktop: **every footer element ≥ 4.5:1** — nav links / labels ~20:1, Instagram/YouTube
    ~20:1, copyright 7.29:1 (ambient); orbits contributes nothing to the footer (it's up in the
    clear band).
  - Mobile: orbits contributes **0 lit pixels**; closing line 12–18:1. **Footer-tagline measures
    3.6:1 with the orb fully suppressed** — a **pre-existing** ambient (`body::before`) condition,
    present in the convergence build too, *not* introduced by this change and not fixable without
    touching `css/style.css`. **Flagged for a future CSS round.**
- **Closing line (final-message):** 12.06:1 desktop (ambient-limited; orb never touches it — a
  measurement note: the harness must hide the final-message text before sampling its own glyph
  boxes, or it reads white-text-on-white-text and reports a false 1:1).
- **Title-glyph contrast:** medians ~18–21:1, unchanged from Round-17 (orbits doesn't touch the
  other stages). Worst-cases vary frame-to-frame on a frozen field; **nature ≈ 1.25:1 is the
  recorded wave exception, not a regression.**
- **Clipped-pixel %:** cosmos ~0.02–0.05, nature ~7.5–7.8 (wave crests), infra ~3, calm blocks 0,
  stage-6 centre ~0.4–0.6 — unchanged.
- **Frame time:** desktop median 33.3 / p95 50 ms, mobile 16.7 / 16.7 ms — within headless
  SwiftShader run-to-run variance of Round-17 (particle count unchanged); **untested on device.**

## 19.4 Standing check — footer-glyph contrast is now required

Our contrast sampling had been title-only, which is exactly why the convergence-on-footer
regression hid for two rounds. **From now on, footer-glyph contrast is part of the standard
verification set.** Any change that touches **motif geometry, placement, or stage assignment**
must measure contrast under the actual glyph bounding boxes of **every footer element** — the
Explore column (ホーム / 自己紹介 / 勉強の軌跡 / 動画 / ブログ / 各種SNS), Connect
(Instagram / YouTube), the brand logo + tagline, and the copyright line — plus the
final-message closing line, and **nothing may sit below 4.5:1** except a documented, pre-existing
non-motif condition. **Baseline established this round (Round-18):** desktop footer worst-case
**7.29:1** (all elements ≥ 4.5); mobile footer worst-case **3.6:1 (the tagline, pre-existing
ambient — the one known exception, to be fixed in CSS later)**; desktop closing line **12.06:1**.
When measuring an element's own glyph boxes, hide that text first and sample the background behind
it — never the text pixels.

## 19.5 Standing rule — motif placement offsets are tuned to specific page elements

A motif's placement offsets (`oOy`, `oScale`, `oOx`, etc.) are **calibrated against the measured
positions of specific page elements** — a footer union, a closing line, a nav pill, a card grid.
**Removing or moving those elements silently invalidates the offsets.** The worked example:
convergence's `oy = -S*0.9` was tuned to clear the *Projects card grid*; when Round-17 removed
Projects and re-anchored convergence onto `.final-message`, that offset went stale and dropped the
orb straight onto the footer — undetected until footer contrast was finally measured. Orbits'
Round-18 `oScale = 0.116 / oOy = 1.88` are likewise pinned to the *current* footer/closing-line
layout. **After any change to the stage-6 region's structure or heights, re-derive these offsets
and re-run the footer-glyph check (§19.4) — do not assume a placement survives a layout change.**

## 19.6 Stills

Regenerated: **`docs/stills/r18-6-orbits.png`** (desktop stage-6, the fitted orbit system above the
closing line, footer clear). **`r17-6-convergence.png` is retained deliberately as the pre-swap
reference** — it is the matching visual record for `make('convergence')`, which stays in the tree
as reversible dead code (§19.1); it is *not* being kept merely because it is stale. When the
heading/section restructure gives stage 6 a real slot and convergence is reconsidered, this still
is the before-image to compare against. The other stage stills (`r17-0`…`r17-5`) are unaffected
(those motifs are unchanged); mobile stage-6 renders nothing, so there is no mobile still to
regenerate.

# 20. Open items (outstanding)

## 20.1 Mobile footer-tagline contrast — 3.6:1 (accessibility gap, needs a CSS round)

**Status: open, unfixed.** At 390×844, the footer tagline
「学術領域の世界への入口を開くプラットフォーム。」 measures a worst-case **3.6:1** against its
background — **below the WCAG AA 4.5:1 floor** for normal-size text.

- **It is not motif-related.** Measured with the stage-6 motif contributing **0 lit pixels**
  (orbits is suppressed on mobile), so this is entirely the **ambient glow from `body::before`**
  (the fixed radial teal/warm pools behind everything), not the particle field. It was present in
  the convergence build too — it **predates Round-18** and the orbits work; the new footer-glyph
  check (§19.4) is simply what finally surfaced it.
- **Fixing it touches `css/style.css`,** which is the single global stylesheet, so any change to
  the tagline colour, a scrim/backing behind `.footer-tagline`, or the `body::before` glow
  **propagates to all 11 pages** — it is not a homepage-local fix and must be verified across the
  interior pages (self-intro, study, sns, the 5 peskin pages, blog, videos) as well.
- **Out of scope for the motif rounds** (which are barred from touching `css/style.css`).
  Schedule a dedicated CSS/accessibility round: re-measure the tagline (and, while there, sweep
  every footer element and the closing line on both viewports against `body::before`), then adjust
  the tagline treatment to ≥ 4.5:1 without regressing the other pages.

## 20.2 Videos heading over waveforms — 3.7:1 (index-block heading, pre-existing)

**Status: open, unfixed.** At 1440×900 the Videos heading 最新動画 (`#stage-videos h2`) over the
waveforms field (stage 6) measures a 24-frame worst-case **3.7:1 (16/24 frames below AA)**. Surfaced
by the Round-21 verification; **pre-existing and not motif-work-of-this-round**: waveforms is untouched
and `streamW = 0` at stage 6, so the Round-21 Blog change did not cause it. The cause is structural —
**index-block headings have no `hero-scrim`** (the scrim is hero-only), so a full-bleed bright motif
(the waveforms mesh) sits directly under the left heading. This is the **same class of gap as §20.1**
(a heading/label below AA over a background it can't be read against) and waits on the **same kind of
round: one that can look at index-block headings properly** — either a per-index-block scrim/backing
(CSS) or dimming the motif under the heading column (like infra's `leftDim`). Both the footer tagline
(§20.1, 3.6:1) and this (3.7:1) are parked for that round; do not fold either into a motif commit.

# 21. Round 19 — stream (stage 4): brightness flattened, then a narrow cool spectrum

`make('stream')`'s brightness was a left→right ramp `(0.35 + 0.6·sxr)·0.85` = **0.30 (left) →
0.81 (right), ~2.7×**. Measurement showed stream's particle **density is horizontally uniform**
(8×6 grid, left-third 25% ≈ uniform), and stream was the **only** below-hero motif with a
brightness gradient — dispersal (0.55) and waveforms (0.72) are flat. So the ramp was the sole
cause of the stage reading as "text left / motif right, empty middle." Flattened to **0.635 = the
mean of dispersal (0.55) and waveforms (0.72)** — the two flat-brightness below-hero motifs that
bracket stream (stages 3 and 5). Measured after: per-column mean luminance right/left ratio
**1.53× → 0.96×** (dispersal 1.01×, waveforms 0.87×); density unchanged; clipping 0→0.

**Round-19b — value moved 0.635 → 0.55 when a narrow spectrum was adopted (not drift).** Stream's
colour was then widened to a **narrow teal→cyan→blue spectrum** (energy `0.22 + 0.40·sxr`, capped
at 0.62 so it stays **below the violet threshold — cool-only, no violet/magenta/ember**;
grep-verified 0 violet pixels of ~76 000 lit). At the flat-teal brightness 0.635 the spectrum dips
below AA on ~8% of sampled frames; at **0.55** it is above AA on **every** sampled frame. **Both
values are derived from the same two references:** 0.635 = the *mean* of dispersal (0.55) and
waveforms (0.72), correct for flat teal; 0.55 = dispersal's value, the *low end* of that same
[0.55, 0.72] range, needed because a spectrum spans hues of differing luminance (teal is more
luminant than blue) and so needs the lower reference to keep every frame above AA. The move is a
principled step within the reference range, not an eyeballed nudge. Cost of the hue gradient: the
per-column luminance ratio is now **0.65×** (mildly *left*-leaning — teal brighter than blue),
the opposite of the old right-heavy split, so it does not recreate the "empty middle." Frame time
unchanged (headless 33.3 / 33.4 ms).

## 21.1 Direction is now a motion-only cue — matters for docs/stills

Stream's flow **direction is not encoded in particle positions** (the 9 streamlines are
horizontally symmetric). It was carried by two brightness mechanisms: the static left→right ramp
(**removed deliberately** here) and the shader's **traveling brightness pulse** (`streamW`:
`sin(target.x·1.5 − uTime·1.8)`, a bright wave that animates in **+x**). The static ramp was
**redundant** with the pulse, so direction still reads **in motion**. **Known property, not a
defect:** in a *still frame* — including every `docs/stills/` capture — stream's flow direction is
**not visible**; anyone comparing stills will see an evenly-lit horizontal current with no
left/right sense. That is expected. Do not "fix" it by reintroducing a static gradient; the ramp
was taken out on purpose. If a still-frame directional cue is ever wanted, it must come from
something other than brightness (e.g. particle-shape or position asymmetry), decided separately.

## 21.2 Reduced legibility margin at stage 4 — stated in distribution terms

Flattening moved the previously-**dim** left end (where the blog title 最新ブログ sits) up toward
full brightness, so the blog title now sits over a brighter motif. **State this as a distribution,
not a single frozen number** (an earlier draft recorded a "5.21:1 worst-case" — that was one
frozen frame, and frozen worst-case is noise, see §21.3). **Superseded by §22 (Round-19c):** the narrow teal→blue spectrum below was
rendered and rejected; what ships is the *reversed* blue→teal spectrum with luminance compensation.
Over a 24-frame sampled run, the
then-committed **narrow-spectrum-@0.55** stream measured blog-title worst-case: **min 5.26, median 6.6,
max 10.8 — 0 frames below AA**; median contrast ~19.8 throughout. The flat-teal step (Round-19)
measured min 4.62, 0 below AA. **Constraint for future stage-4 changes:** the margin is now thin —
the *minimum-frame* worst-case sits only ~0.8 above the AA 4.5 floor, not the ~4.7 the old dim-left
ramp gave. Any change adding brightness, saturation, or wider colour at stage 4 spends that reduced
margin; re-run the frame-distribution check (§21.3) and treat *any frame below 4.5* as a blocker.
(This is why the full-spectrum experiment, which put 2/24 frames below AA even at 0.55, and every
variant at 0.635, stayed throwaway.)

## 21.3 Standing verification standard — frame distribution, not a frozen frame

**Generalises beyond this stage.** Worst-case glyph contrast on a *single frozen frame* of an
animated particle field is **not a usable target**: the field drifts, so the single brightest
pixel under the text moves frame to frame. Measured spread of the blog-title worst-case across a
sampled run: **~5–7 contrast points** (e.g. 4.62 → 9.65 for flat teal; 3.71 → 10.51 for
spectrum@0.635) — **more than ten times** the ~0.4 gap a frozen-frame reading tempted us to tune
against. Tuning geometry/brightness to move a frozen number is tuning against noise.

**The correct test, now standard for all contrast verification** (alongside the Round-18
footer-glyph check, §19.4): sample the glyph contrast across a **run of ≥24 animating frames** and
require **no frame below AA 4.5:1** — report the distribution (min / median / max, and the count of
frames below AA), not one number. The median contrast (~19.8 here) confirms the text body is fine;
the **min-frame worst-case** is the figure that gates AA. Frozen-frame worst-case may be recorded
as context but must never be the pass/fail criterion. This applies to title glyphs, footer glyphs,
and the closing line alike.

# 22. Round 19c — stream (stage 4): reversed spectrum + luminance compensation; the colour-cluster metric

Supersedes §21's Round-19b narrow spectrum. `make('stream')` now runs energy **`0.62 − 0.40·sxr`**
(blue at the trailing/left edge → teal at the leading/right edge) with a **per-particle brightness
compensation `3.795 / (6.51 + 6.29·sxr)`** (≈0.58 left → ≈0.30 right), still capped at 0.62 so the
palette stays **cool-only** (measured 0 violet pixels of ~43 000 lit).

## 22.1 Why teal→blue (Round-19b) was rejected — and why the luminance ratio didn't catch it

The Round-19b **narrow teal→blue** spectrum (energy `0.22 + 0.40·sxr`, flat brightness 0.55) was
committed, then rejected on visual review: the distinct **blue hue piled at the right edge**, away
from the left-aligned blog title, and read as "something over there" rather than a colour spread.

The metric we had been gating on — **per-column luminance right/left ratio** — *did not capture
this failure.* Measured frame-averaged (pulse cancelled over 8 uTimes; single-frame ratios are
noise, cf. §21.3), the narrow teal→blue variant scored **R/L 1.05** — the *most balanced of every
variant* (flat teal 1.23, reversed 1.42, dispersal 1.28, waveforms 1.02). By luminance it was the
best. The blue-on-right cluster is a **hue** effect at *balanced luminance*: the ratio measures
brightness, so it is blind to a patch of distinct colour that is not also a patch of brightness.
**Recorded lesson:** the luminance ratio is a diagnostic, not a gate — it cannot adjudicate a
colour-clustering complaint.

## 22.2 The replacement metric — hue × luminance correlation

Colour clustering is now measurable. Compute the **per-column mean hue** (8 columns) and the
**per-column mean luminance**, then their **Pearson correlation**, *qualified by hue range* (only
meaningful when a hue gradient exists — hue range ≳ 10°; a flat-teal field has range ~3° and the
correlation is noise). Interpretation:

- **positive** correlation over a real hue range = the distinct (blue) hue coincides with the
  **bright** region = a **bright colour patch** that grabs the eye — the failure mode.
- **negative** = the distinct hue sits on the **dim** side and **recedes** = good.
- **~0** with small hue range = no colour variation (the flat motifs).

Measured (hue range in brackets): **teal→blue narrow +0.68 [23°]** — the only positive, i.e. bright
blue patch; **reversed blue→teal −0.96 [29°]**; **flat teal −0.72 but [3°] → noise, no gradient**;
dispersal +0.00 [2°], waveforms −0.00 [3°]. The +0.68 is the numeric signature of the cluster the
eye caught; the reversed direction moves the blue onto the dim side (−).

**Standing check (generalises beyond stage 4).** For any motif that carries a **colour gradient**,
a **positive hue×luminance correlation over a real hue range is the failure signature** — a distinct
hue sitting on the bright side, reading as a stray patch. It **must be qualified by hue range**: a
correlation over a near-flat hue profile is meaningless (flat teal's −0.72 over **3°** is noise, not
a pass — do not read it as one); treat the correlation as informative only when the hue range is
**≳ 10°**. This now stands as a required check for colour-gradient motifs **alongside** the
frame-distribution contrast standard (§21.3) and the footer-glyph contrast check (§19.4). A motif
with no colour gradient (a single-hue field) is exempt — there is no distinct hue to cluster.

## 22.3 Reversed spectrum reintroduces a luminance lean — compensated, not by eye

Putting teal (the more-luminant hue) on the right *adds* to the stream's **inherent geometric
right-lean** (flat uniform teal already measures R/L **1.23**, from particle overlap density, not
colour), so the raw reversed variant measured **R/L 1.42 (c6/c1 1.58)** — the most right-heavy of
all. The fix is a brightness term that cancels the lean, **derived from measurement, not tuned:**

- `L(sxr) = 6.51 + 6.29·sxr` is the linear fit of the reversed variant's measured frame-averaged
  per-column luminance at flat 0.55 (6.9 → 12.4 across the frame).
- brightness ∝ **1/L(sxr)** cancels the combined (geometry + hue-luminance) lean.
- **Anchor.** The numerator sets the target flat level. Two were measured:
  - **mean anchor** (5.459 = 9.925·0.55, flatten to the mean level 9.9): flattened well —
    **R/L 1.42 → 1.09** — but brightening the dim *left* raised the background under the title and
    put **1 of 24 frames below AA** (min 3.74). **Rejected:** breaks the §21.3 standard.
  - **left anchor** (3.795 = 6.9·0.55, flatten toward the *dim left* level, i.e. dim the bright
    right and leave the title-side alone): **title-safe — 0/24 frames below AA, min 6.01, median
    9.04**; **R/L 1.42 → 1.24** (= flat-teal 1.23, better than dispersal 1.28). **Shipped.**

**Tradeoff, recorded (this is the boundary that stopped further flattening):** rendered luminance is
**sublinear in brightness** on the overlap-dense right (dimming brightness 0.55→0.30 there moved
render only 12.4→10, not proportionally), so the left-anchor flattens to flat-teal parity (1.24),
not fully to 1.0. Pushing to full flatness needs *either* brightening the left (breaks title AA) *or*
dimming the right down toward the left's dim level (a uniformly faint motif — dimmer than flat-teal
and far dimmer than waveforms ~16–18). Both were **rejected deliberately**, so the compensation
stops at the **title-safe partial flatten**. The colour cluster (the actual objection) is fully
fixed independently — the hue direction, not the brightness, carries that.

**R/L 1.24 is the finished state, not unfinished work.** It is parity with flat teal (1.23) and
better than dispersal (1.28); it is the flattest luminance reachable at stage 4 without breaking the
title-AA standard (§21.3) or sinking the whole motif. A future round must **not** read 1.24 as a
loose end to drive toward 1.0 — the residual lean is bounded by the two hard constraints above, both
of which the numbers veto. If the constraints themselves change (e.g. the title moves, or the motif
is intended to sit brighter), re-derive; otherwise 1.24 is correct and closed.

## 22.4 Measured, shipped variant (comp-left), 1440×900, headless SwiftShader

Blog-title contrast (24-frame): **min 6.01 / median 9.04 / max 12.23 / 0 below AA.** Palette
cool-only: **0 violet, 0 magenta** (warm 3 px = noise). Density grid **identical** to every other
variant (positions untouched — compensation is brightness-only). Clipped 0%; lit-median 0.006.
Frame time median 33.4 ms / p95 50.1 ms (n=140). Per-column luminance
`[6.7, 7.6, 7.3, 7.3, 7.6, 8.4, 9.8, 10]` (R/L 1.24). Stills `r17-4-blog.png`, `s-cards.png`
regenerated. Direction is still a **motion-only** cue in stills (§21.1 stands — the reversed
*static* hue gradient is a colour spread, not a directional arrow).

# 23. Round 20 — 7→8: split 基礎/専門, and a warm element that migrates between them

The merged study block (§17.1) was split back into two index-blocks — **基礎領域** (stage 3) and
**専門領域** (stage 4) — and stage 3/4 became a **stacked-disc motif** whose hot core **migrates**
from the base (基礎) to the apex (専門) as the viewer scrolls between them. Stages are now:
`cosmos, nature, infra, foundation(基礎), specialty(専門), stream(Blog), waveforms(Videos), orbits`.

## 23.1 DOM split — copy restored verbatim

`#stage-study` keeps 学びの土台 (found-h), its intro paragraph, the **6-item** list, and the
勉強の軌跡を見る button → study.html. A new `#stage-specialty` block was added with **copy restored
verbatim from pre-merge commit `4c64a53`**: eyebrow `06 — 専門領域`, `<h2 id="spec-h">専門という軌道`,
the 一つひとつの分野が… paragraph, the **3-item** list, and the 「ノートを読む」 button → study.html.
The structural wrapper (id, `index-block__head reveal`, stage-jump self-link) mirrors the sibling
index-blocks; only the wrapper is new, no copy was written or altered. Eyebrow numbers stay vestigial
(05, 06, then 08 Blog — 07 was the removed Notes), unchanged by decision.

## 23.2 sceneF remap (js/scroll-scenes.js, K 7→8) — §17.2 format

| site | before (7) | after (8) | reason |
|------|-----------|-----------|--------|
| `stages` array | `…,'infra','dispersal','stream','waveforms','orbits'` | `…,'infra','foundation','specialty','stream','waveforms','orbits'` | stage 3 = 基礎 stack, 4 = 専門 stack; `dispersal` retired to dead code (§17.2 convention) |
| `streamW` key | `abs(uSceneF-4.0)` | `abs(uSceneF-5.0)` | Blog 4 → 5 |
| `wfW` key | `abs(uSceneF-5.0)` | `abs(uSceneF-6.0)` | Videos 5 → 6 |
| `orbW` key | `abs(uSceneF-6.0)` | `abs(uSceneF-7.0)` | orbits 6 → 7 |
| `ROT` array | 7 entries | 8 entries; foundation keeps the old dispersal slot `[0,0.05]`, specialty takes `[0,0.08]` (the values the stack was prototyped under); stream/waveforms/orbits keep theirs, shifted +1 | survivors keep their rotation |
| **new** `aCoh` attribute + `cohA`/`amp` | — | migration coherence (§23.4) | carry the warm core across 3→4 |
| header/slot comments | "SEVEN"/10 slots | "EIGHT"/12 slots | 8 pos + 2 eb + seed + aCoh |

`vInfra` (2.0), `natureW` (1.0), `EBV=ceil(8/4)=2`, `iB` clamp (→7), `pickPos`/`pickEB`,
`rotationFor`, `HERO_K=3`, and the `indexBlocks` selector all follow K / auto-pick the new block.
`abs(uSceneF-3.5)` in `cohA` is already correct for the new 3→4. Attribute slots 12/16.

**Layout (1440×900):** docH 5565→6050. New centres 基礎 3510, 専門 4050; spacings infra→基礎 810,
**基礎→専門 540**, 専門→Blog 540 (the split blocks came out 540px each — the index-block natural
height — not shorter, so nothing tightened). Every stage lands **fc 0.08–0.10, w=1.0** — inside its
plateau with ~50px slack (more than the old tail's 32px). No two headings share a viewport at rest.

## 23.3 The stack motif (foundation/specialty) and warm-core sizing

`make('foundation'|'specialty')`: **6 solid discs** in the xz-plane stacked in y, **linear taper**
(radius `0.60·S·(1−f)`, widest at the base), head-on (no tilt), centred at `ox = 0.45·S` (right of
the text column), stack height `1.35·S`. Cool discs run teal→cyan up the stack; the same world-x
**left-dim** as infra keeps the study text legible. Structure comes from **density concentration**
(discs = particles piled onto thin layers with void gaps): measured **lumCV32 3.09 (基礎) / 2.59
(専門)**, densCV 3.55 / 3.80 — above the infra (2.22) / nature (1.93) targets (see §22-era metric).

**Warm-core sizing (derived, not by eye).** The whole base layer warm measured 10.7% warm pixels;
cosmos's core is ~0.90%. So the core is a fraction φ = 0.90/10.7 = **0.084** of the base disc — radius
√0.084 = **0.29·base = 0.174·S**, and count 0.084·(1/6) = **1.4% of particles**, selected by index
`i % 72` (1.39%). Membership by **index, not `rnd()`**, so the SAME particles are the core at the base
(foundation) and the apex (specialty) — the precondition for migration. Energy 0.88 (= cosmos's core,
no new colour). Measured warm pixel share **1.01% (基礎) / 1.66% (専門)** vs cosmos 0.90 (specialty is a
higher *fraction* only because the stage-4 form has less cool material, not a bigger core). §22 hue×lum:
the small core **barely registers as a cluster** — hue range 11° (near the meaningfulness floor),
warmVsField ~1.0 (neutral, not a bright patch). 0 violet — cool-dominant, warm only at the hot core.

## 23.4 The migration — coherence attribute, full-only

The default morph is `p = target + curl·amp`, `amp = mix(uResidual, uDisperse, 1−w)`; at the midpoint
`w=0` → `amp=uDisperse=1.15`, so every form dissolves into curl drift and re-condenses. A warm core
placed at base→apex by `mix(targetPos)` therefore **disappears at the midpoint and reappears** — a
crossfade, not a rise (rendered and confirmed). Fix: **one float attribute `aCoh`** (1 for the
`i%72` core particles, 0 otherwise) gates the dispersal, but ONLY across 3→4:

```
cohA = aCoh * (1 - clamp(abs(uSceneF-3.5)*2, 0, 1));   // 0 at every other sceneF
amp  = mix(uResidual', uDisperse, (1-w) * (1-cohA));    // core keeps amp≈uResidual mid-transition
```

The core then holds its travelling target and **rises base→apex, staying legible** through the
midpoint (confirmed on the real files; the magenta core is a distinct blob at sceneF 3.48 where the
free version was blank).

**Full coherence (1.0) is required — partial does not work.** Derivation predicted `c ≥ 0.665` would
hold the core (`amp ≤ rCore/|curl| ≈ 0.61/1.5 = 0.40`), but **measurement showed c=0.70 does not hold
it** — the core mostly dissolved. The `|curl|≈1.5` estimate underpredicted the scatter; a core this
small needs `amp` near `uResidual`, i.e. full-or-nothing. **Recorded so the optimistic 0.665 is not
re-derived.**

**Cost:** one float/particle — **+0.8 MB desktop (200k), +0.28 MB mobile (70k)**, independent of K
(K=8: 24.0→24.8 MB desktop). Frame time **unchanged** (before/after both median 33.4 / p95 50.0 ms,
n=180, headless SwiftShader). Coherence is **inert at rest** (`w=1` → `amp=uResidual` regardless), so
the §23.3 rest metrics are undisturbed — confirmed identical with and without the attribute.

## 23.5 Colour-wash at re-condense — investigated, left as-is

At ~sceneF 3.73 (re-condensing, `w≈0.86`) the reforming cool discs additively overlap the rising core
and the magenta washes toward white. **Investigated and rejected a fix:** offsetting the apex endpoint
in x (+0.15S, +0.25S) does **not** clear the 3.73 wash (the cone is dense wherever the core is at 86%
reformed) and it **disturbs the locked apex rest** (warm px 782→1748 as the core separates from the
cap). Left as-is: a brief wash on one transient frame, acceptable; the alternatives cost a locked rest
state for no real gain. **Recorded so the offset is not re-attempted.**

## 23.6 Standing lesson — contrast at a landing is contrast against a *blend*

**Generalises to every index-block stage.** Index blocks land **~0.09 fc off-centre** by construction
(§17.6), so at a rest the *previous* stage is **10–20% mixed in**, with its own dims only partly
active. **Contrast measured at a landing is contrast against that blend, not against the stage's own
motif.** Worked example — 基礎's body-text worst contrast:

| position | sceneF | body min |
|---|---|---|
| **landing (rest)** | ~2.9 | **4.88** |
| pure foundation | 3.0 | **11.53** |
| deeper | 3.148 | 9.73 |

The 4.88 is **infra bleeding under 基礎's left text at the off-centre landing**, *not* the foundation
stack. Deepening the stack's own left-dim (floor 0.30→0.18, derived from the worst field-lum 0.165) had
**no effect** — the bright particles are infra's, not the stack's; that was tried and measured, and is
recorded here so it is not re-attempted. **Before editing a motif to fix a landing contrast, check
whether the number is the motif or the blend** (measure at pure sceneF = the stage index).

## 23.7 Standing caveat on §21.3 — frame-distribution needs an *animating* motif

§21.3 ("no frame below AA in a ≥24-frame sample; a thin margin is a dip risk") **applies where the
motif animates** — e.g. stream's traveling pulse, which spreads worst-case contrast 5–7 points and
genuinely dips. For a form that **rests static** (the stack at `w=1` drifts only by `uResidual`),
`min = median = max` — zero spread — so a thin margin is **not** a dip risk. 基礎's 4.88 has zero
variance and clears AA on every frame; it was **accepted** (Option 1). State which regime a value is in
before applying the standard: a static rest with 0 spread and a pulsing motif with 5–7 spread are not
the same problem.

## 23.8 infra's left-dim — known property, not a defect

The only real lever on §23.6's 4.88 is **infra's own `leftDim`** (strengthen it, or keep it active
later into the transition). It is **left alone deliberately**: stage 2's heading 学びを、社会へ。 sits
on the same left column, so any change needs stage-2 re-verification, and the cost of that outweighs
~6 points of margin on a value that already passes with zero variance. Recorded as a **known property
with the option noted**, not an open defect.

## 23.9 Stills

Regenerated (desktop 1440×900, at rest): **`docs/stills/r20-3-foundation.png`** (基礎, hot core at
base) and **`docs/stills/r20-4-specialty.png`** (専門, hot core at apex). The migration is a
scroll-only read (like §21.1's motion-only direction) — a still shows only the two endpoints, not the
rise. **Stale after this round:** `r17-3-merged-study.png` (the merged block no longer exists —
superseded by the two above); `r17-4-blog.png`, `r17-5-videos.png`, `r18-6-orbits.png` (content
unchanged but the stage numbers in the names are now +1: Blog 5, Videos 6, orbits 7);
`s05-dispersal.png`, `s-belowhero.png` (dispersal retired). Not regenerated this round — flagged for a
future stills pass.

# 24. Round 21 — Blog (stage 5) becomes a radiating source; and a metric limit

## 24.1 The motif — a source broadcasting (radial), by density concentration

`make('stream')` (the Blog motif, stage 5) is no longer a directed horizontal flow — it is a **warm
hot core emitting cool filaments that radiate outward** (a source broadcasting). Structure comes from
**density concentration** (§23): **16 tapered filaments with dark voids between**, centred at 0.55·S
(right of the blog text), with the same world-x left-dim as the stack keeping the heading legible.
Each filament **tapers** — thick near the core (jitter 0.055), thinning outward (`·(1−0.6·rf)`) and
dimming (0.72→0.27) — so energy concentrates at the source and dissipates at the rim (the emitting
read, not a solid bar).

**Filament count chosen OVER the metric — see §24.3.** Measured 1440×900 lumCV32 across counts (kept
palette/core/breathe): **16 → 1.61 · 16-tapered → 1.69 · 12 → 1.70 · 10 → 1.78 · 8 → 2.02**. Only 8
clears nature (1.93), and **8 reads as a hard geometric asterisk, not an emitter** — because fewer
filaments are denser per ray, and density-per-ray is exactly what both lifts lumCV *and* destroys the
soft radiating character. **16-tapered (lumCV 1.69, below nature) was chosen deliberately** for the
right read; the metric here points *away* from the goal. lumCV is a floor check for static structure,
not a quality score.

**The Round-19 reversed spectrum + `scomp` compensation were dropped, not carried over.** They were
geometry-specific to the left→right flow (a function of `sxr`); a radial form has no left→right lean
to compensate. Instead the filaments are **flat teal-cyan (energy 0.30, no radial hue gradient)**:
measured hue×luminance range collapses to **5–7° (wide) / 2–4° (tall)** — below §22's 10°
meaningfulness floor, so the correlation is noise and **there is no distinct hue to cluster**. Warm is
confined to the **hot core** (`rnd()<0.006` → measured **1.17% warm pixels**, ≈ cosmos 0.90 / stack
1.01); 0 violet — cool-only. The `streamW` shader pulse (a horizontal sweep, a mismatch for a radial
form) was replaced with a **uniform time breathe** (`0.82+0.18*sin(uTime*1.4)`); its peak is 1.0×
(was 1.2×), so it can only improve the blog-title AA.

## 24.2 Verification (1440×900, 8 stages, wired path)

| | figure |
|---|---|
| w_ss (all 8) | **1.0** (fc 0–0.03) |
| scrollHeight / heights | 6050 / [1080,1080,1080,540,540,540,540,204] — **identical to Round-20** (make-only change) |
| attribute memory | **27.2 MB** (unchanged; no new attribute) |
| frame time | median **33.3 ms** / p95 50.0 ms, n=180 (unchanged) |
| lumCV32 | cosmos 0.75 · nature 1.72 · infra 2.18 · 基礎 3.09 · 専門 2.60 · **blog 2.02** · waveforms 1.32 · orbits 0.86 |
| blog | warm 1.17% · 0 violet · hue×lum noise (range 7) · clip 0% · lit-median 0.233 |
| title contrast (24-frame min / below AA) | cosmos 5.75/0 · nature 5.88/0 · infra 7.29/0 · 基礎 16.4/0 · 専門 18.1/0 · **blog 13.3/0** · closing-line 16.3/0 |
| footer glyph contrast (24-frame, §19.4) | min **15.1 / 0 below** |

**Measurement note:** hero title contrast must be sampled by hiding *only* the heading text, **not
`.scene__content`** — the latter hides the `hero-scrim` that protects those titles, and sampling the
raw field then reports a false ~1.2:1. With the scrim kept, cosmos/nature/infra are 5.75–7.29:1.

**Pre-existing issue surfaced (not this round):** the **Videos heading (最新動画) over the waveforms
field measures 3.7:1, 16/24 frames below AA.** Waveforms (stage 6) is untouched by this round and
`streamW=0` there, so this is long-standing (index-block headings have no scrim, and the full-bleed
waveforms mesh is bright under the left heading). Flagged for a separate round.

## 24.3 Standing metric limit — lumCV is aspect-dependent for directional/radial forms

A limit of the local-structure metric (§23) we had not seen: for a **directional or radial** form,
**lumCV32 depends on viewport aspect.** The Blog burst measures **2.02 at 1440×900 but 2.9 on a tall
viewport (1280×1800)** — the same geometry, because on a wide viewport the rays foreshorten and
spread (lower per-cell contrast) while on a tall one they read denser. (The stack's discs, §23, are
far less aspect-sensitive because they concentrate density in 2D area, not along 1D rays.) So a single
lumCV figure is not aspect-invariant for ray/flow motifs: **quote the aspect, and tune to the aspect
most viewers use** (here 1440×900) rather than to whichever aspect flatters the number.

**Sharper form of the same limit — on a radial form the metric points *away* from the goal.** The
Blog filament-count choice made this unmistakable. lumCV rises as filaments *decrease* (16→1.61,
12→1.70, 10→1.78, 8→2.02) because each ray gets denser — but **density-per-ray is exactly what turns
the soft emitter into a hard geometric asterisk.** So the single lever that maximises the metric is
the same lever that destroys the thing the metric is standing in for. We shipped **16-tapered (lumCV
1.69, below nature 1.93)** over 8 (2.02) on the images, deliberately. **Rule: lumCV is a floor check
that static structure exists at all, not a quality score — when a higher lumCV comes from a change
that degrades the read, take the lower number.** (Cf. the same failure mode in §22: the luminance
ratio rating the narrow spectrum "most balanced" while the eye saw a colour split.)

## 24.4 Orbits (stage 7) — the clear band did NOT grow; the §19 constraint stands

Investigated for a scale-up and **rejected on the trace.** An intermediate measurement had suggested
the band widened to 362px (from §19's 240px), implying orbits could finally read as a system. The
trace overturned it:

- **Scroll-snap is `proximity` and hero-only** (stages 01–04, per the CSS). The index blocks and the
  final-message **have no snap point**, so there is **no fixed rest** — the closing line's viewport
  position varies *continuously* with scroll (measured: scroll 4528 → closing-line 949; 5028 → 449;
  5150 → 327).
- A user scrolling to the Blog/closing region **stops at the page bottom** (maxScroll), where the
  closing line is **highest (327px at 1440×900)** and the band is **smallest — 240px, unchanged from
  §19.** The 362px was an artifact of measuring at scroll 5028, which is **not a rest**.
- So the §19 constraint holds at 1440×900: a readable orbit system needs ~248px and the binding band
  is 240px. **Orbits was not scaled up.** (On a tall viewport the band is ~1160px even at the page
  bottom, but a scale keyed to tall would collide with the closing line at wide.)

**For any future work on stage 7 (orbits): the usable clear band at 1440×900 is 240px, measured at the
page-bottom rest — NOT 362px.** The 362px was a non-rest artifact (scroll 5028, where no one stops);
do not carry it forward from this or any earlier note. A readable orbit system needs ~248px, so at
1440×900 orbits cannot be enlarged past the current `oScale 0.116` without the system crossing the
closing line at the page bottom. Only a **viewport-conditional** scale (tall viewports have a ~1160px
band) could enlarge it, and only if it leaves 1440×900 at 0.116.

**Lesson (generalises):** contrast/clearance for an index-block or the closing region must be measured
at the **page-bottom rest** (where the previous content is highest in the viewport), because those
blocks do not snap — an intermediate scroll position is not a rest and its clearances are not real.
Mobile keeps orbits suppressed (unchanged).
