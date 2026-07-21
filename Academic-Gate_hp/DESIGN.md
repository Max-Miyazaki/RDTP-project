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
