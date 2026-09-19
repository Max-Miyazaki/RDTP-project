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
| `--glow-cool` | `rgba(61,139,255,.26)` | Logo dot glow; card/button cool halo |
| `--glow-warm` | `rgba(255,61,139,0.20)` | CTA warm halo |
| `--spill-blue` | `rgba(61,139,255,.13)` (216°) | Ambient light-spill, upper-right |
| `--spill-blue-deep` | `rgba(34,78,190,.13)` (223°) | Ambient light-spill, lower-left |
| `--spill-violet` | `rgba(120,90,255,.07)` (251°) | Ambient light-spill, top-centre |

### 2.4 Stars

Plain white dots, r 0.25–1.35px, opacity 0.15–0.60, at `min(200, w*h/11000)` across the
whole viewport (canvas layer, behind content, above the ambient spill). Static — no
twinkle. The blue and red tints the field used to mix in were dropped so the site matches
the lesson pages; white is the only star colour:

| Token | Value |
|---|---|
| `--star-white` | `rgba(255,255,255,0.55)` |

**Reading pages** (`body.is-article` — any 記事 / 教材 page; see §35) step the
sky back so it never sits behind body copy or MathJax. Two halves, and they have to move
together: `style.css` blurs and dims the whole canvas (`filter: blur(1.2px); opacity:.6`),
and `starfield.js` masks the reading column — `main > section`'s rect padded 24px each
side, 80% of the stars inside it dropped, the survivors at 0.4× opacity, and every star
on the page grown +0.3px so the blur does not erase it. The column is re-measured on each
paint, so a resize re-masks. Non-article pages take none of this: the masking `rand()`
call is skipped entirely, so their PRNG stream — and therefore their sky — is untouched.

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
03 — PROFILE
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

### 5.5 Knowledge-graph control panel (study.html) — REMOVED (§35)

~~Re-skin the existing panel to the system.~~ **The Archive Sphere and its control panel
were removed in §35.** `js/knowledge-graph.js`, the `.knowledge-map` / `.control-*` /
`#graph-container` CSS, and study.html's Three.js `<script>` are all gone. Nothing on the
site uses a control panel now; if one returns, build it from the §5 component tokens rather
than restoring this block.

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
- **Ambient light-spill:** three large, very-low-opacity radials (`--spill-blue`,
  `--spill-blue-deep`, `--spill-violet`) over the black canvas, positioned to balance the
  composition (opposite the formation), not pure black + stars. Value-for-value identical
  to the lesson pages so the marketing site and the教材 read as one surface.
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
ノート (→ study.html), 最新ブログ (→ blog.html), 最新動画 (→ **videos.html**), 企画,
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
| **study.html** | Calm. Accordion restyled to hairline/surface tokens. **One section only** (`01 — 勉強の軌跡`) since §35 removed the Archive Sphere; the page now carries the plain star field like every other interior page. |
| **blog.html** | Calm. Card grid per §5.3, spectrum placeholders. |
| **videos.html** | Calm. Video card grid; now linked from index scene ④. |
| **sns.html** | Calm. SNS links become hairline cards with spectrum hover, disc icons. |
| *(記事 / 教材ページ)* | Calm, `body.is-article`. The star field steps back (§D); the body column, rhythm and PDF-embed frame come from the `body.is-article` rules in `css/style.css` (§35). The 5 `peskin-qft*.html` pages that used to sit here were removed in §35. |

**Shared nav/footer are unified across all 6 pages** — one canonical 6-item nav
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
  `sns→sns.html`). An article page maps to the nav item it belongs under — a 教材 page
  under 勉強の軌跡 sets `data-page="study"`.
- **Load order:** `layout.js` is included immediately *before* `main.js` and *after* the body
  placeholders, so the document is already parsed when it runs — it injects **synchronously on
  execution**, before `main.js` registers its `DOMContentLoaded` handlers (which query
  `.menu-toggle` / `.nav-menu` / `header`). No ordering race; `main.js` was not modified.
- Verified on all pages: correct `active` per page, 6-item nav, byte-identical footer,
  hamburger open + outside-click close, 0 console errors, and the `<noscript>` path renders
  6 links with scripts disabled.

Rejected alternatives: **B (HTML includes)** needs a build step or SSI — not viable on a static
host. **C (copy-paste + a CI diff lint)** keeps the drift risk and the toil.

---

## 11b. Knowledge map (Archive Sphere) — REMOVED (§35); notes kept for a future rebuild

**The Archive Sphere was deleted in §35** — `js/knowledge-graph.js`, its section in
`study.html`, and its CSS are gone, and so is the Three.js `<script>` that study.html carried
for it. The rebuild that this section was written for never happened. The constraints below
are kept **only as notes for a future map, not as a description of anything in the tree**;
they cost nothing to keep and they encode real bugs that were paid for once:

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

**Loaded by ONE place since §35** (grep-verified — `build/three.min.js`, `three@0.160.0`):
- `js/scroll-scenes.js` (line 58) — the `loadThree()` dynamic-injection loader
  `attempt('…jsdelivr…', '…unpkg…')`. This is how **`index.html`** gets Three.js (transitively;
  index.html has no Three `<script>` of its own — see its line-18 comment).
- ~~`html/study.html`~~ — its direct `<script src="…three.min.js">` went with the Archive
  Sphere (§35). **study.html no longer loads Three.js at all**, so the pin is now a
  single-file concern.

**The unpkg fallback cannot rescue a version bump.** Both CDNs serve the *same npm package*
`three@0.160.0`, so both hold byte-identical files; the jsdelivr→unpkg fallback is a
**CDN-availability** fallback (one host down → try the other), not a version/path fallback. Any
bump to a version where the package no longer ships `build/three.min.js` removes the file from
**both** CDNs simultaneously and `index.html` (via scroll-scenes.js) breaks with no rescue.

**Deliberately not migrating now.** Moving off the UMD build means ES-module imports
(`import * as THREE from 'three'` via an import-map or a bundler) in the scroll-field. Until
then, **hold the pin at exactly 0.160.0**; treat any change to that version number as a breaking
change that must be co-migrated, not a routine dependency bump.

### CDN fallback pattern — always create a new `<script>`, never reassign `.src`

**Every jsdelivr→unpkg fallback in the repo uses the same createElement mechanism:** on load
error, **create a new `<script>` element** pointing at unpkg and append it to `<head>`.
- `js/scroll-scenes.js` (`loadThree()`, drives `index.html`) — the original working form, and
  since §35 the only one left in the tree.
- **Any new 教材 page that loads MathJax must use this same form** — `onerror="this.onerror=null;
  var s=document.createElement('script'); s.src='…unpkg…/es5/tex-mml-chtml.js';
  document.head.appendChild(s);"` — which is what the removed `peskin-qft*.html` pages carried.

**Do NOT reintroduce the inline `this.src='…'` form anywhere** — it is known broken. **Spec
reason (one line):** reassigning `.src` on an already-run/failed parser-inserted `<script>` is a
no-op because its "already started" flag is set, so the browser never re-fetches.

Measured when this was written, jsdelivr blocked at the network layer: **index.html** recovers
Three.js via `scroll-scenes.js` (unpkg 200, `THREE.REVISION 160`); the then-present study.html and
peskin-qft.html tags recovered too (`mathjax@3 = 3.2.2`, `$e^+ e^-$` rendered). Normal loads use
jsdelivr and the fallback does not fire. Both CDNs serve byte-identical packages, so this is a
host-availability fallback, not a version one.

**Carry-forward lesson for the 教材 pages (the bug is easy to repeat):** the removed
`peskin-qft_sec2-1..4.html` set `window.MathJax` *after* the loader `<script>`, which overwrites
the loaded runtime object. It was harmless only because those four pages embedded PDFs and carried
no inline HTML math; `peskin-qft.html` ordered config **before** the loader, which is correct.
**Always put the `window.MathJax` config block before the MathJax `<script>`.**

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

## 20.3 Footer column labels in dark — 3.66:1 (accessibility gap, same family as §20.1/§20.2)

`.footer-col-label`（フッターの EXPLORE / CONNECT 見出し）は `--text-tertiary`（`rgba(255,255,255,.40)`）
を使っており、**ダーク時 3.66:1** と AA（4.5:1）を割る。**サイト 6 ページ共通の既存値**で、§36 の教材
取り込みで持ち込んだものではない（測定は §36.6）。ライト時は `lesson-theme.css` が `--text-tertiary` を
`.60` に上げるため 4.61:1 で合格する。

- **同じ根**を持つ既存ギャップ：§20.1（フッタータグライン）、§20.2（index-block 見出し）。
- **直すなら**：`--text-tertiary` を `.46` 前後へ上げる（記事の `.eyebrow` が同じ理由で `.46` を使い
  4.58:1 を確保している、§36.2）。ただし**全 6 ページの見た目が変わり、§31 の台帳を再測定する必要が
  ある**ので、モチーフ系のコミットに混ぜず、独立した CSS/アクセシビリティのラウンドで扱うこと。

## 20.4 Site-wide light theme — deliberately NOT attempted (scoped out with the 教材 import)

The 教材 pages ship a light/dark switch (`js/theme.js` + `css/lesson-theme.css`, `data-theme` on
`<html>`, remembered in `localStorage('ag-theme')`). **That switch is 教材-only. The six main pages
stay dark-fixed** and must NOT load `theme.js` — `css/style.css` has **no light path at all**
(`data-theme`, `prefers-color-scheme`, `color-scheme`: zero occurrences), so the button would
appear and change nothing.

**What the token work already buys us.** The 教材 light values are declared with the **site's own
token names** (`--text-primary`, `--hairline`, …) and the 教材's `--ink` / `--line` names are
**aliases** onto them, so each theme has exactly one source of truth. A future site-wide light
theme therefore needs **no token redesign** — it needs the two items below.

**Blocker A — 28 colours are hardcoded outside `:root`** (measured, `css/style.css`). Tokens alone
will not flip the site:

| Group | Count | Where | Why it resists a token |
|---|---|---|---|
| Black scrims / gradient overlays | 14 | `.hero .scene-list li` L851, `.hero .gate-subtitle` L858, `.hero-scrim::before` L877–879, `.index-region` L961, `.index-block__head::before` L1001–1003, `footer` L1080 | They exist to hold text **over the WebGL field**. In light they do not lighten — they invert, and the whole legibility argument (§31) has to be re-measured |
| Spectrum placeholders | 10 | `.media-placeholder` L676–680, `.video-thumbnail` L1213–1217 | teal/cyan/orange gradients tuned for a black ground |
| `#fff` | 2 | `.btn-primary .btn-disc` L591, `.pdf-frame iframe` L1418 | The PDF one is deliberate (§G: never filter the iframe) |
| `rgba(255,255,255,.55)` | 1 | `.footer-tagline` L1111 | Round-31's AA fix — re-derive, don't flip |

**Blocker B — the hero WebGL field.** `index.html`'s particle field is **additively blended on
pure black**; additive blending on a light ground washes out rather than darkening. A light index
means either a second palette + blend mode in the shader, or suppressing the field in light — a
choice, not a port.

**If this is ever picked up:** it is a dedicated round (CSS + accessibility + a shader decision),
not a follow-on to a content change. Re-measure every contrast in §31 afterwards — a light theme
invalidates the whole §31 ledger, which was measured against black.

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

**The "hue range" in this rule is always the per-column-mean range defined above — never a raw
per-pixel min-to-max.** On a field with a deliberate second-hue element (e.g. Blog's magenta core in a
teal field), a per-pixel min-max is *bimodal* and balloons to >100°, which would falsely satisfy the
≥10° gate though no gradient exists; the per-column mean washes the small core out and reports the true
spread (~3–5° for a flat field). See §25.2 for the worked case (Blog: column-mean 4.8° vs per-pixel
170–300° on the same frame).

**Amendment (2026-09-11, from the Round-28/29 drift, §30).** The per-column-mean range must be computed
over pixels **above a field-luminance floor** (exclude the static `body::before` scrim AND the star field
— both are lit, both carry their own position-dependent hue), and **only over columns with ≥ N such field
pixels** (N stated per measurement; 40 has worked). Reason: a *sparse, wide-spread* motif (the advected
drift covers the frame thinly) leaves many columns dominated by dim scrim/star pixels whose hue varies by
position — so a range computed at the old lum>0.05 floor reports **noise, not the motif**. Worked case: the
drift's column-range was **36° at floor 0.05** but **0.9–1.0° at floor 0.15** (field only), and the
robust **stdev over lit field pixels was 2.5°** (flat teal, n≈16k) — the two field measures agree, the
0.05 figure was scrim. Tell: the range **fell as motif density rose** (the opposite of a real gradient).
**Report both** the field-floored column-range (with N and the floor) AND the stdev-over-lit-pixels; when
the field is too sparse for ≥2 qualifying columns (the drift on tall), the stdev is the usable statistic.
This amends, not replaces, the metric above — the column-mean method and the ≥10° "matters" bar stand.

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
Mobile keeps orbits suppressed (unchanged). **See §26** for the reachability mechanism behind this
(sceneF 7 was unreachable at rest above a 1188px viewport height until Round-23); the 240px band here is
the footer-bound wide band. **➜ The 240px figure is SUPERSEDED for wide by §27 (Round-24): the wide band
is now 362px** after the centred-composition change; carry 362, not 240, for the wide page-bottom rest.

# §25 — The motif tiers, the offscreen metric, and the stack's frame ceiling (Round-22)

Round-22 raised Blog (stage 5) to **Scale A** (filament reach ×1.22, `0.58·S → 0.7076·S`; the hot core
held **absolute** at `0.05·S`, warm fraction `rnd()<0.009` untouched). The stack (foundation/specialty)
was left exactly as Round-20 shipped. The reasoning below is what made that split the right call rather
than raising all three index motifs by a common multiplier.

## 25.1 The motifs are tiers — measured extents at both aspects

This is the first time the eight motifs are described as **tiers** rather than one at a time. It is what
makes "read at a consistent scale" a *decidable* question: consistency is a within-tier claim, not a
whole-page one. Extent = lit-bbox area (% viewport), central 98% of projected particles, density grid,
no blend — measured at each stage's rest on the wired build.

| # | stage | wide area (w×h) | tall area (w×h) | tier |
|---|-------|-----------------|-----------------|------|
| 2 | infra | 83.3% (83×100) | 92.7% (97×95) | **full-field** — ambient lattice/signal, edge-to-edge |
| 6 | waveforms | 85.6% (92×93) | 89.8% (99×91) | **full-field** |
| 0 | cosmos | 47.7% (55×87) | 84.1% (96×87) | **hero identity** |
| 1 | nature | 50.0% (75×67) | 66.7% (98×68) | **hero identity** |
| 3 | 基礎 foundation | 19.4% (28×71) | 35.6% (51×69) | **index motif** |
| 4 | 専門 specialty | 19.1% (28×69) | 35.0% (51×68) | **index motif** |
| 5 | blog (Scale A) | **22.5%** (37×61) | **36.3%** (60×61) | **index motif** |
| 7 | orbits | 2.0% (10×20) | 4.3% (22×19) | **focal** — closing convergence, deliberately tiny |

**Tier boundaries (wide):** focal ≈2% ≪ index ≈19–22% ≪ hero ≈48–50% ≪ full-field ≈83–86%. The gaps
are large and hold at both aspects (tall compresses everything upward but preserves the ordering:
index ≈35–36% ≪ hero 67–84 ≪ full-field 90–93). So the tiers are real, not an artifact of one viewport.

**The consistency question was entirely within the index tier.** Before Round-22, blog sat at **14.4%**
— the odd one *below* 基礎 19.4 / 専門 19.1, i.e. falling out of its own tier. Scale A lifts it to
**22.5% ≈ the stack**, clustering the three index motifs at ~19–22%. The tier reads *more* consistent
after moving blog **alone**, not less — the naive worry ("raising blog alone makes the stack look
small") is backwards: the stack was already the tier anchor, and blog was the outlier that needed to
rise **to** it. This is why a common multiplier across all three was the wrong instrument (see §25.3 —
the stack cannot take one anyway).

## 25.2 Offscreen fraction — the metric lit-bbox area could not provide

**Offscreen fraction** = % of a stage's projected particles landing outside NDC `[-1,1]²` (off-frame),
per edge, computed from the stage's target attribute (`aP{k}`) through the live view-projection at the
stage's rest. **"The form is fully visible" ⇔ offscreen ≈ 0%.**

**Why lit-bbox area (§25.1) cannot catch clipping.** Lit-bbox measures the extent of the particles that
*remain on screen*. When the widest layer of a form leaves the frame, the on-screen remainder is what
gets measured — so **area can grow while the form is being cut**. On the stack this is exactly wrong:
the taper only reads when the whole form is visible (wide base narrowing upward); clip the widest disc
and you remove the layer that *carries the meaning*, yet lit-bbox counts the surviving inner discs as
growth. **Same failure shape as the lumCV case (§24.3) and the lumCV-over-off-frame-growth case** — a
floor/coverage metric rewarding the thing that breaks the read. Offscreen fraction is the complement:
it counts what *left*.

**Standing check.** Offscreen fraction now joins **lumCV32** (structure floor, §23/§24) and the
**hue×luminance cluster correlation** (§22) as a required check for **any change to a motif's scale or
placement.** A scale-up is not verified until offscreen ≈ 0% at both aspects (or the residual is
explicitly accepted as a parked item, cf. §25.4).

**Blog at Scale A — offscreen and the rest of the set (measured, wired build):**
- Offscreen: **wide 0%** (fits fully at 1440×900, both before and after Scale A); tall 15.6% → **18.6%**
  (all off the **right** edge — see §25.4).
- Warm / core: the core is **absolute and unchanged** — warm particle share ~0.9% (the `rnd()<0.009`
  core). By the **warm-pixel detector** (isWarm: hue ≥288° or ≤24°, max≥70 — the same one used for
  cosmos and the stack), warm is **0.62% of lit pixels**, confined to a tight **34×35px central cluster**
  (bbox x913–947, y452–487 at 1440×900 — dead centre of the form), hue ~300–317°. "Warm confined to a
  hot core" holds. **This is the core figure to report going forward** — not a "teal-band complement":
  of the ~2% of lit pixels outside the 150–220° teal band, only ~0.6% is the magenta core; the rest is
  teal→blue filament-edge transition (blue 220–288° ≈0.6%) and antialiased boundary pixels. The older
  "violet" detector (b>150 ∧ r>85 ∧ g<110) reads **0** here — the core is *magenta* (red-dominant,
  hue ~300–317°), not blue-violet, so violet is the wrong detector for this core; warm share is the
  right one.
- hue × luminance (the §22 metric): **hue range 4.8°, correlation gated to noise** — flat teal,
  no gradient, as intended. **Method note (read before comparing to Round 21):** §22.2 *defines* hue
  range as the spread of **per-column mean hues** (8 columns); measured that way the current build is
  **4.8°** (column means 177–182°), squarely comparable to Round 21's 5–7° and §22's "~3° flat teal."
  Round-22's first pass (`verifyfull.mjs`) instead printed a **raw per-pixel min-to-max (170–300°)**,
  which is **not the §22 figure** — a raw min-max over a field with a deliberate second-hue core is
  *bimodal* (a narrow teal cluster + a tiny magenta cluster), so it balloons to ~160° and would
  falsely trip §22's ≥10° "gradient exists" gate. Do not compare the 170–300° number to Round 21 or
  run it through §22's rule; the **column-mean range (4.8°) is the standard**. The correlation itself
  (column-mean Pearson 0.86 over the 4 populated columns) is meaningless at a 4.8° range — exactly what
  the gate is for.
- Contrast (24-frame min, wired, field-under-glyph): heading **13.3 wide / 20.7 tall**, body **18 wide /
  20.5 tall**, **0 frames below AA 4.5** at either aspect. Verified old-reach vs new-reach directly:
  identical (18/18 wide) — **Scale A does not regress the body text.** This confirms the eyeball read
  that "A keeps the spacing" (Scale B's tips crowded the left body text; Scale A does not).
- lumCV32 1.92 (up from 1.69 shipped — the wider form exposes more density structure; still below infra
  2.05, above nature 1.74; retains the 16-filament emitter character, not the hard 8-ray asterisk).

## 25.3 The stack is at its frame ceiling — do not re-attempt a scale-up

The stack (foundation/specialty) **cannot be enlarged.** Offscreen sweep, stage 3, both aspects:

| stack scale (×base) | wide 1440×900 | tall 1280×1800 |
|---|---|---|
| **1.00 (shipped)** | **0%** | 4.6% (right) |
| 1.05 | 0% | 5.3% |
| 1.10 | 0.2% (bottom) | 6.1% |
| 1.15 | 0.9% | 7.1% |
| 1.22 (= blog Scale A) | 2.1% (bottom) | 8.7% |
| 1.30 | 3.5% | 10.4% |
| 1.40 | 5.3% | 12.5% |

- On **wide** the shipped stack fits exactly (0%) and begins clipping its **base (bottom)** disc from
  **~SF 1.10**. There is essentially no headroom.
- On **tall** the shipped stack **already clips 4.6% off the right** at SF 1.00 (the narrower 1280px
  viewport; the form is centred right of centre, so its widest discs reach the right edge). Any
  enlargement worsens **both** aspects at once.
- So the largest scale that fits fully at both aspects is **≈ the current one (SF 1.00)**, and even that
  is not fully clean on tall. **The stack is maxed; the widest disc is the part that carries the taper,
  so clipping it is the one thing a scale-up must not do.** Recorded here so no future round re-attempts
  it: the taper form + right-of-centre placement + the 1280px tall viewport together fix the ceiling.

This is *why* the index tier was unified by raising **blog** to the stack rather than the reverse (§25.1):
the stack had no room to move.

## 25.4 Open item — both motifs clip the right edge on tall viewports (parked)

Not fixed this round; recorded as a known, **pre-existing** condition:

- On tall (1280×1800) the shipped **stack** clips **4.6% off the right** (spec 4.0%) and **blog** clips
  **15.6% off the right** — both because they are centred **right of centre** and a tall viewport is
  narrower than 1440, so the right side of each form runs past the frame.
- **Scale A adds ~3% to blog** (15.6% → 18.6%, all right-edge). This is the price of the tier fix; it was
  accepted because (a) wide is 0% at both scales, (b) the clip is a thin right-edge sliver of the outer
  cool filaments, not the core or the body-text side, and (c) contrast stays 20.5:1 with 0 AA failures on
  tall (§25.2).
- **Park for a dedicated tall-viewport treatment round**, alongside the index-block-heading work
  (§20.1 footer tagline 3.6:1, §20.2 Videos heading 3.7:1). A recentre or a viewport-conditional center-x
  for the right-of-centre motifs would address stack, spec, and blog together; it is out of scope for a
  scale decision and is not attempted here.

## 25.5 Stills

- **Regenerated:** `docs/stills/r22-5-blog.png` (blog at Scale A, 1440×900). Supersedes `r21-5-blog.png`.
- **Stale but not re-shot** (blog was the only changed motif; the rest are untouched, their stills stay
  current): `r21-5-blog.png` is the only stale still — kept for round history. `r20-3-foundation.png`
  and `r20-4-specialty.png` remain current (the stack did not change, §25.3); cosmos/nature/infra/
  waveforms/orbits stills are unaffected.

# §26 — Stage-7 reachability: the layout mechanism (Round-23)

This is the shared cause of three things we hit at different times — **orbits stuck at oScale 0.116
(§24.4)**, the **tall page-bottom resting on a dissolved videos↔orbits blend**, and the **sea
investigation's "tall never reaches the stage."** It lives here, not in a round note, because it is one
mechanism.

## 26.1 The mechanism and the formula

`sceneF = sceneFor(scrollMid)`, where `scrollMid = scrollY + (innerH + 92)/2` is the snapport centre
(the 92 is `scroll-padding-top: var(--nav-clearance)`). sceneF reaches the last stage's value **7.0 only
when the viewport centre can reach the final-message centre `center7`**. The furthest the viewport centre
can travel is `scrollMax + (innerH+92)/2 = scrollH − innerH/2 + 46`. With `scrollH = FM_top + FM_height +
footer` and `center7 = FM_top + FM_height/2`, the reach condition `scrollMid_max ≥ center7` reduces to:

> **sceneF 7 is reachable ⇔ `FM_height + 2·footer + 92 ≥ viewport_height`.**
> Equivalently the shortfall is `deficit = innerH/2 − FM_height/2 − footer − 46`; reachable when ≤ 0.

The footer carries coefficient 2 (it sits below the FM centre *and* it is the only term raising
`scrollH`), the FM height coefficient 1/2. **The cause is document height below the final-message centre**
— on a tall viewport there isn't enough of it (the FM's own lower half + the footer) for the viewport
centre to reach the FM centre. Before Round-23, `FM_height 204 + 2·446 + 92 = 1188px`, so:

| viewport | 1188 vs height | converged sceneF (before) | stage-7 landing |
|---|---|---|---|
| wide 1440×**900** | 1188 ≥ 900 ✅ | **7.000** | fc 0, w=1 (resolved) |
| mobile 390×**844** | 1188 ≥ 844 ✅ | **7.000** | fc 0 (motif suppressed anyway) |
| tall 1280×**1800** | 1188 < 1800 ❌ | **6.52** (306px short) | fc 0.49, **w≈0.02 (dissolved)** |

Any viewport **taller than 1188px** fails — not just the 1800 test case. At the tall shortfall, landing fc
0.49 is essentially the dissolve midpoint, which is why the tall page-bottom showed a scattered
videos↔orbits blend rather than a resolved motif.

## 26.2 The fix (Round-23) and why vh, bottom-anchored, min-width-gated

`.final-message { min-height: 100vh; display:flex; flex-direction:column; justify-content:flex-end }`,
gated to `@media (min-width: 769px)`. Setting `FM_height = 100vh = innerH` makes `FM_height + 2·footer +
92 ≥ innerH` hold at **every** height (verified reaching 7.0 at 900/1188/1200/1400/1800/**2400**px — vh
scales, a fixed spacer would not). **Bottom-anchored** so the closing line stays exactly where it was on
short viewports (wide closing y327 unchanged) — the particle field fills the space above it, so this is
NOT the Round-12 bug-2 void. **Gated to min-width:769px** (the `isMobile` boundary): phones suppress the
stage-7 motif and already reach 7.0 via their short layout, so a full-height section there would only add
an empty region above the line. It is pure document height — **not** a snap point (a snap can't pull the
viewport centre past `scrollMax`, so it adds no reach on its own) and **not** `scroll-padding-top`.

**Measured effect (before → after), settle 6s:** tall stage-7 **w 0.02 → 1.0, fc 0.49 → 0**; wide and
mobile **unchanged** (all 8 stages' w and fc identical); stages 0–6 untouched at every aspect (their
centres are above the FM). Only the stage-7 element height + `scrollHeight` change (index +696px wide /
+1596px tall). The other 10 pages that share style.css were **measured identical** (they carry no
`.final-message` element). Closing/footer contrast at the resolved rest: wide 12.1 / 7.3, tall **15.1** /
10.1, mobile 8.8 / 8.9 — 0 frames below AA at all three (24-frame). This is a **css/style.css** edit;
`.final-message` markup is index-only so the visual effect is index-only, but the file is shared — same
care as §20.1/§20.2.

## 26.3 Two standing facts to carry forward

- **Wide's clear band is 240px and footer-bound — the *reachability* fix does NOT grow it.** On a 900px
  viewport the footer (446px) eats half the frame at the page-bottom rest, leaving nav(87)→closing(327) =
  240px. Reaching stage 7 was never wide's problem; the band just is small. Opening it needs a composition
  change (rest at the FM-centre with a tall section so the footer leaves the fold), not a reachability fix.
  Tall, once reached, has a ~1140px band. **➜ SUPERSEDED for the wide case by §27 (Round-24):** the
  composition change was made — **wide's band is now 362px**, not 240px. Do not carry the 240px figure
  forward for wide; it survives only as the pre-Round-24 measurement.
- **Reading sceneF requires a settle long enough to converge.** `sfEased` approaches its target at
  0.09/frame; in a low-fps headless capture ~1.2s reads *mid-convergence*. The sea round reported wide
  "6.911" for what is actually **7.0** (it climbs 6.54→6.85→6.99→7.00 over ~4s). This is the second time a
  short settle produced a wrong number — **always settle ≥ ~5s (or poll to a plateau) before reading
  sceneF.**

# §27 — Stage-7 wide composition: centred, footer kept (Round-24)

§26 made stage 7 *reachable* on tall but left **wide's band at 240px, footer-bound** (§26.3). Round-24
opens it. The change: on short viewports the closing line is **centred** (not bottom-anchored) in a 70vh
section, and a **snap point** holds the rest at the final-message centre — lifting the footer off the
fold's pressure and opening the band to **~362px** while keeping **motif → message → footer** in one
frame. `css/style.css`, `@media (min-width:769px) and (max-height:1100px)`, overriding §26's
`min-height`/`justify-content` only on short viewports (display/flex-direction carry over).

## 27.1 Why Option 1 (header) was rejected — and why no-snap was rejected

Three compositions were built and **rendered** (the geometry alone did not settle it):
- **Option 1 (header — 100vh, top-anchored, +snap):** the closing line becomes a title under the nav and
  the footer goes off the fold. Rejected on the renders: (a) the closing line sits **directly on top of
  the motif** — they touch under the nav; (b) the message and the footer are **never on screen together**
  — at the snap rest the footer is off-fold, and scrolling past to the absolute bottom drops the closing
  off the top (motif + footer, no message). A ~750px band isn't worth losing the closing-plus-footer
  ending. **This is a composition failure the geometry (band size) doesn't show — only the renders did.**
- **Option 2 without snap:** also **rendered and rejected.** Without a snap point the natural rest is the
  **absolute bottom**, where the footer is pinned ~446px from the viewport bottom and the *centred*
  message rides to the **top and touches the motif** — reproducing exactly the Option-1 collision, with
  the order flipped to **message → motif → footer**. So **the snap point is LOAD-BEARING**, not
  decorative: it is the only thing that holds the rest at the FM-centre, where the message sits clear of
  the motif and the approved order survives. *If a future round sees a lone snap point on stage 7 and
  thinks it arbitrary: it is not. Removing it returns the message-on-motif collision.* (Stage 7 is thus
  the one index-region block with a snap point; §23.6's "index blocks land off-centre" still holds for
  3–6, which stay unsnapped.)
- **Option 2 with snap (shipped):** motif top → message centre → footer bottom, all three visible.

## 27.2 Why the boundary is a MAX-HEIGHT, not a width

The constraint is that the footer is a **fixed ~446px** and eats half of a **short** viewport at the
page-bottom rest — so it is a **height** problem, not a width one. The `min-width:769px` in the rule is
only the desktop/motif-active gate (inherited from §26, the `isMobile` boundary); the `max-height:1100px`
is what actually scopes the composition. **Someone reading a `min-width`/`max-height` pair should not
assume both conditions describe the same thing** — the width keeps it off phones, the height is the real
trigger. **Boundary = 1100px** by measurement: Option-2's centred band beats the §26 bottom-anchor band
up to the **~1150px crossover**, above which the bottom-anchor already gives ≥440px (growing to 1140px on
tall). 1100 sits inside the beneficial range and cleanly separates landscape laptops (≤1100) from
portrait/tall (≥1200). Either-side check: 1050 → Option 2 (band 455, sf 7.0, both visible); 1150 → §26
bottom-anchor (Δ0, sf 7.0, band 490) — a smooth ~455→490 step, both endings valid, nothing falls between.

## 27.3 Verification (settle 6s; rest = FM-centre snap where Option 2 active, else absolute bottom)

- **Converged sceneF:** wide 7.0, h1050 6.999, h1150 7.0, tall 7.0, mobile 7.0. **w_ss / landing fc: no
  change at any viewport** (all stages w=1, fc 0). **Per-stage heights / scrollHeight: only stage 7
  shrinks on short viewports** (wide 900→630, Δscroll −270; 1050→735, −315); **h1150, tall (1800), mobile:
  all Δ0 — §26 kept exactly** (the Q4 requirement: fix wide without regressing tall).
- **Closing / footer contrast (24-frame):** wide **16.3 / 19.3**, h1050 11.1 / 19.3, tall 15.1 / 10.1,
  mobile 8.8 / 8.9 — **0 frames below AA everywhere.** Band: wide **240→362px**, h1050 455px, tall 1140px
  (unchanged), mobile 57px (motif suppressed, moot).
- **11-page diff (measured):** only index.html changes; the other 10 are identical (no `.final-message`).
  **CSS blast radius:** `.final-message`-only, index-only visual; `scroll-snap-type` already ships
  globally on `<html>`. Reduced-motion removes the field entirely, so there is no collision to guard there.

**Wide's band is now 362px** — this supersedes the 240px figure in §24.4 and §26.3 for the wide case
(both cross-referenced). Still: `docs/stills/r24-7-orbits-wide.png` (the wide ending, motif → message →
footer). Tall's still (`r23-7-orbits-tall.png`) is unaffected.

# §28 — Stage 7: the sea, built and measured, NOT adopted (Round-25)

Stage 7 was prototyped as **学問の海 — a living water surface** (rests in ripples, scattered splashes leap,
burst, fall back). It was **fully built, wired, and measured** — it passed every gate including the
frame-time gate — and then **rejected on the read**: at this stage's geometry it renders as a **thick teal
band with splashes, not a sea.** Stage 7 **stays orbits.** `make('sea')` is kept as **inert dead code** (the
surface sheet, callable, not in the stages array — like `make('convergence')`/`make('orbits')`); the shader
block and `uSeaY` uniform are **not** in the live shader (they would corrupt orbits, gated by `seaW` at
stage 7). This section is the record of the mechanics so the motif can be revived from it.

## 28.1 The mechanics — worth keeping (all attribute-free)

- **Rest-state cycle.** The whole motif lives in stage 7's rest state, driven by `uTime`, gated by
  `seaW = 1−clamp(|uSceneF−7|)` — it plays wherever the user stops (no traverse dependency; unlike Round-20's
  migration it needs no coherence attribute, because at a rest `w=1` and nothing disperses).
- **Message-relative placement (`uSeaY` uniform).** The surface is baked at nominal `y≈0`; the shader adds
  `uSeaY`, a world-y set **0.75 world above the closing `<p>`** by tracking its **live on-screen position**
  near stage 7 (`updateSeaY` = `worldYAtScreen(<p>.top) + 0.75`, called when `sfEased>6.4`). This sits the
  surface just above the caption in **both** compositions (message centred on wide, bottom on tall) and
  slides it in with the message — *predicting* the rest scroll instead was fragile (mis-placed the tall sea
  to `uSeaY −2.7`, off the bottom). A world margin of **0.3 failed on wide** (≈33 screen-px there, the
  additive bloom reached the message → 3.7:1, 20/24 below AA) before **0.75** cleared both — the standing
  lesson: *a fixed world margin is far fewer screen-px on a short viewport.*
- **Fixed WORLD splash amplitude → auto-scales by aspect.** A given world rise projects to ~2× the
  screen-pixels on the 1800px viewport as on the 900px one, so the *same* cycle reads modest on wide and
  taller on tall with no per-aspect code. Plus a **lateral burst** at the apex so the read survives wide's
  short clearance.
- **A POPULATION of splashes (no fixed spot, no visible repeat).** The surface is split into **cells** of
  width `CW` along x; each cell is an **independent oscillator** with per-cell **phase** `hash(cell)` and
  **incommensurate per-cell period** `PERIOD·(0.72+0.56·hash(cell))` — so there is **no global beat** (the
  combined pattern's repeat is effectively unbounded; a 2.6-period contact sheet showed no two frames alike).
  Per **(cell, cycle)** hashes independently pick whether it **fires**, its **x-jitter**, **size**, and
  **start time** — splashes scatter in position (no clustering), stagger in time, and vary in height, ~1–3
  active at once. **All procedural** from `target.x` + the existing `aSeed`; **no stored attribute** (slots
  stay 12/16; memory 27.2 MB @200k desktop / 9.52 MB @70k mobile, unchanged — `uSeaY` is a uniform).
- The first build used **one fixed `SPX`** — the event happened at the same x, same phase, every period
  (it ran an animation on a loop). The cell-oscillator population above is what made it read as *alive*.

## 28.2 Verification — it passed every gate (settle ≥6s, loop paused; both aspects)

- **Message-glyph contrast**, 24-frame, field-under-text: **16.6 wide / 15.06 tall, 0 frames below AA**
  (the surface lands at exactly the 0.75 world margin, 0.806 above the glyph top; splashes rise *away* from
  the message — it sits below the waterline — so no splash-position exclusion is needed, confirmed with
  splashes running full-width). Footer glyphs not sampled on wide (below the fold at the FM-centre rest, per
  §27); on tall the footer is clear.
- **Offscreen, decomposed per §25.2:** wide 0%; tall **T 0 · B 0 · L 16.7 · R 15.9** — *purely horizontal*
  (the full-width surface's ends leave the frame; nothing off top or bottom), cleaner vertically than infra
  (T 2.3 B 3.5) or waveforms (T 1.5 B 0). Splash peak reaches screen-y 679 (592 px clear of the nav) — no
  vertical clip, no lost meaning (unlike the stack taper, §25.2).
- **lumCV32** (floor check only, §24.3): 1.78 wide / 1.64 tall. **hue×lum** (per-column-mean, §22.2): flat
  teal, range ≤2° — below the 10° floor, no cluster. **warm share (isWarm):** 0% (cool-only). **clip%** 0;
  **lit-median** ~0.02–0.08. Waterline thinning when several splashes fire: 1.3% wide / 9–14% tall — surface
  holds. **scrollHeight / heights** identical to Round-24 (JS particle change, Δ0). **attribute memory**
  unchanged.
- **Frame time — the gate PASSED.** On the real GPU path (`EXT_disjoint_timer_query_webgl2`, laptop, 200k,
  309 samples): **sea 5.10 ms vs orbits 5.40 ms** — the sea is *not* more expensive than the motif it would
  replace (the rest-state animation's per-vertex cost is real but sits under orbits' baseline here). This
  retired the open frame-time gate from the prototype rounds. (Earlier headless figures were SwiftShader,
  which clamps ~50 ms and cannot distinguish the two — labelled as such and superseded by this real-GPU
  number.)

## 28.3 Why it was NOT adopted

**It reads as a thick teal band plus splashes, not a sea.** The cause is layout, not tuning: the closing
message sits **directly under the waterline**, so there is **no vertical room for a body of water below the
surface** (wide: ~65 px of footer below a centred message; tall: the message + footer own the bottom). A sea
needs depth under its surface; this stage gives it none, so the motif collapses to a bright horizontal
surface line with splashes rising off it — legible and cheap, but not the thing. This is a **geometry
verdict** the contrast/offscreen/cost numbers can't see (they all passed) — recorded so a future round does
not re-derive it: *at stage 7's message-under-waterline geometry, a "sea" cannot get a body; do not rebuild
the sea here expecting a different read without first changing where the message sits.*

## 28.4 Parked state

`make('sea')` inert dead code (surface sheet, callable, not in `stages`); stage 7 = `'orbits'` (unchanged
from Round-24); `make('orbits')` and `make('convergence')` remain the other inert cases. No `uSeaY`
uniform, `updateSeaY`, sea shader block, or `ROT[7]` change in the live engine. The `_probe*` measurement
files (the real-engine sea-vs-orbits GPU probe) are left untracked. Mobile stays suppressed (as orbits).

---

## 29. Stage 7: the drift (流) — the current motif (Round-26/27)

Supersedes §28.4's "stage 7 = 'orbits'": after parking the sea (§28), stage 7 was redesigned. The
`stages` array now ends in `'drift'`; `orbits`/`convergence`/`sea` remain inert dead cases.

## 29.0 The three concepts considered
Drift (流) — a vortical woven current; Lattice (格) — a settling crystal of grid-nodes; Aurora (極光) —
swaying vertical light-curtains. Pick: **Drift**. Aurora was rejected on an engine limit — the morph is
`p = target + curl()·amp`, a BOUNDED offset (not an integration), so the engine can shimmer a form in
place but cannot *stream*; a curtain would only quiver. Lattice was rejected as redundant with the
foundation stages (3–4) already reading as settling structure. (Mid-session an earlier list said
Drift/Aurora/Constellation; the deliberated three are Drift/Lattice/Aurora — this line is canonical.)

## 29.1 Mechanics (attribute-free)
90 streamlines are traced once (CPU) through the divergence-free field of ψ = sin(0.8x)·cos(1.1y): each
line follows a ψ-contour and curls into a soft eddy. Particle i is placed along `driftLines[i % 90]`
(thin σ0.028 jitter → voids between lines), lifted `doy = 1.72` world above the closing message so it
clears the caption at both aspects. Flat cool teal (energy 0.30), no warm core. The shader raises the
curl amplitude at stage 7 only (`driftW`), so the whole form flows/folds; bounded, so it never drifts
away. No attribute (12/16 slots unchanged; the streamlines are a JS-side array, not per-particle data).

## 29.2 Round-27 measurement — the swirl was smearing the weave (verified, not adopted-blind)
The shipped Round-26 amplitude (driftW·0.28) read as two soft blobs, not a woven current. Measured over
the matrix driftW ∈ {0, 0.04, 0.08, 0.14, 0.28}, field-only, both aspects, with a 48×20-cell luminance
CV over the lit bbox (large-scale weave proxy — finer than lumCV32, credits voids in both axes):
  • cellCV falls MONOTONICALLY with amplitude — wide 2.38→2.14 (−10%), tall 1.79→1.32 (−26%).
  • Visually (matrix montage): wide amp-0 = two eddy RINGS with hollow centres; the swirl fills the
    centres → rings→blobs by 0.28. Tall amp-0 = two visible SPIRAL eddies; 0.28 = a formless dim haze.
  • Cause confirmed: the isotropic curl offset ±0.28·1.0 ≈ ±0.29 world ≈ the streamline spacing (~0.30),
    so it displaces particles ACROSS neighbouring lines and erases the voids. The user's hypothesis held.
  • SECONDARY (wide only): even static (amp 0), the 90 lines don't resolve into discrete streamlines —
    litFrac ~9% saturates them (200k additive) into two filled eddies. Density, independent of the swirl.
Fix applied (Round-27): driftW·0.28 → **0.08** — the largest amplitude at which the eddy voids survive
AND the flow still reads. cellCV recovers (wide →2.34, tall →1.64); the 24-frame contact sheets at 0.08
(both aspects, >1 period) show the eddies keeping hollow centres while the lobes churn and centres
migrate. One-line change, attribute-free, no CSS/scrollHeight change.

## 29.3 Gates (measured; what is not, is labelled)
  • MESSAGE field-under-text: on tall the glyph bbox sits low in-viewport (y≈1697/1800); field mean
    luminance under the glyphs ≈ 0.001 (near-black) → mean-contrast ≈ 20.6. The worst single pixel
    reaches 0.086 → worst-case contrast 7.72 — but that pixel is IDENTICAL with the canvas hidden, i.e.
    it is the STATIC body::before teal/cyan scrim, NOT the drift field. So the tall "7.72, zero spread"
    is text-against-scrim (the page's own dark gradient), not field-under-text, and it is amplitude-
    independent. Wide: glyph mid-viewport (y≈495), field max 0.061 > scrim 0.039 → some field present →
    min contrast 11.02, spread 11.02–13.81 (the field animates there). Both ≥ AA 4.5, 0 frames below.
    (Message/offscreen were fully measured at driftW·0.28, the MORE energetic case; 0.08 spreads the
    field less, so it is an equal-or-better upper bound. Offscreen at 0.28: wide T0 B0 L0 R0; tall
    T0 B0 L12.8 R8.6 — horizontal full-width spill only, no vertical.)
  • FOOTER: at the stage-7 rest the footer shows only its top padding (65px wide / 0px tall visible) and
    ZERO text glyphs are on-screen (text is below the fold) — the earlier n=0 was correct, not a sampler
    miss. Measured at the page-bottom scroll where the footer text IS visible: min contrast 15.86 wide /
    17.41 tall, 0 below AA (white text on the rgba(0,0,0,0.6) footer panel). Not a field-under-text case.
  • lumCV32 (floor, aspect-dependent): 1.63 wide / 1.16 tall @0.28. Hue×lum col-mean range 2.8°/1.1°
    (< 10° → flat teal, exempt per §22.2). Warm 0%, clipped 0%.
  • scrollHeight Δ0 (6476 wide / 13046 tall, = orbits). Memory 27.20 MB @200k (measured, attribute-free);
    @70k mobile DERIVED ≈9.52 MB by proportion, NOT directly measured. Mobile suppressed.
  • FRAME TIME: SwiftShader only (~50 ms, clamped — cannot distinguish motif cost). Real-GPU UNTESTED;
    run html/_probe.html on the laptop GPU (EXT_disjoint_timer_query_webgl2), as the sea was (5.10 ms).

## 29.4 Proposed (NOT built — awaiting approval): a true flowing woven current
0.08 mitigates the wrong mechanism. The isotropic curl is directionally wrong: it should move particles
ALONG their streamline, not across neighbours. Two options:
  (A) Along-streamline advection — animate each particle's arc-length position s = (s0 + uTime·speed +
      aSeed) mod L, sampling the streamline geometry in the shader (upload the 90×26 points as a small
      data texture; store lineId+s0 per particle via aSeed). Particles slide along their own line →
      voids persist at all times → the current genuinely flows (the teamLab "river" read). Attribute-free.
  (B) Tangent-projected offset — store the local streamline tangent in the spare aux attribute (→13/16)
      and displace ALONG it only. Cheaper; motion stays a bounded along-line shimmer, not true advection.
Either should pair with a DENSITY reduction (90→~40 lines, and/or lower per-particle brightness / wider
spacing) so individual streamlines resolve on wide instead of saturating into two eddy masses.

## 29.5 State at end of Round-27 (SUPERSEDED by §30)
stage 7 = 'drift'; driftW·0.08 isotropic-curl shimmer on a symmetric sin/cos eddy-pair field. §29.4
proposed along-streamline advection + a non-symmetric field + lower density — all three were then BUILT
in Round-28; see §30. orbits/convergence/sea remain inert. No CSS/HTML/copy change.

---

## 30. Stage 7 drift: the flowing woven current — advection build (Round-28)

Built §29.4's three coupled changes together (the amplitude was never the only problem). stage 7 = 'drift',
now an ADVECTED asymmetric current. All JS-only; no CSS/HTML/copy change; scrollHeight Δ0.

## 30.1 The non-symmetric field (breaks the eddy-pair)
ψ = sin(0.8x)·cos(1.1y) fit exactly two cells into the band → a symmetric eddy PAIR (a pair of eyes).
Bake-off of three divergence-free candidates, static weave, both aspects, scored by mirror-asymmetry
(mean|L(x)−L(mirror)|/2ΣL over the lit bbox) + cellCV + the stills:
  • C1 multi-term incommensurate sin/cos — asym 0.50/0.71; rejected (a convergence "stem" artifact on wide,
    reads as a tree; most mirror-ish).
  • C2 curl-noise (ψ = fbm value-noise) — asym 0.55/0.75 (highest both aspects), cellCV 2.40/1.99; PICKED —
    eddies of varied size at irregular positions, no mirror, reads as an irregular turbulent current.
  • C3 two anisotropic incommensurate terms — asym 0.57/0.67; rejected (reads as a single sparse diagonal
    stroke / broad band; thinner, less woven).
Shipped: ψ = fbm(value-noise) over (0.9x+3.1, 1.4y−2.2), 4 octaves; a LOCAL mulberry32 (noise perm seed
1337, line-seed 42) so the field is stable across reloads and independent of the particle rnd().

## 30.2 Density (individual streamlines resolve on wide)
Static wide saturated 90 lines into filled masses (litFrac ~9%). Fix: NLINES 90→48 AND park a fraction to
brightness 0 (DRIFT_PARK 0.5 — the mobile "off at zero brightness" trick, in-band: fewer LIT particles
share the band, all 200k kept, cost unchanged). Wide litFrac → 3.98% and the current resolves into
filaments with voids. Tall is the opposite risk — it goes thin (litFrac 0.48%); it reads as a delicate
high current, and its PRESENCE is deferred to the §30.5 composition proposal, not brightened (raising
brightness pushed the dense wide cores toward additive clip → a cool cyan-white hue shift; kept BR 0.5).

## 30.3 Advection (A) — the shader carries the flow
Streamlines baked into a float DATA TEXTURE (DPTS=26 cols × NLINES=48 rows, RG = band-space xy, NEAREST +
manual lerp along the line so there is no bleed between rows). The vertex shader, gated to stage 7,
advects each particle ALONG its own line: s = fract(s0 + uTime·spd_line + phase_line); target is REPLACED
(mixed by driftW7) with sampleLine(li,s)·(1.05,0.80)+doy, + a ±0.025 aSeed jitter for line width. Per-line
speed spd = uDriftSpeed·(0.55+0.9·hash(li)) is INCOMMENSURATE → no global beat (contact sheet over >55 s,
the slowest-line period, shows no repeat). uTime is elapsed seconds; uDriftSpeed 0.035 → line traversal
~21–55 s (a calm current). Open lines WRAP s→0 with a brightness edge-fade (smoothstep at both ends) so the
wrap is invisible. li and s0 derive from aSeed IN-SHADER (attribute-free; no gl_VertexID — the engine runs
a WebGL2 context, confirmed, but the shaders stay GLSL1 / texture2D). driftW·uDriftAmp is now only a small
RESIDUAL curl (0.06) for fine life atop the advection (well below the 0.30 line spacing, so it does not
smear). doy 1.72→2.05: the C2 current spreads more than the old motif and dipped UNDER the message on wide
(msgMin 4.4); 2.05 lifts the band clear of the message while still clearing the fixed nav.
REVERSIBILITY: uDriftAdvect=0 freezes the advection → the static C2 weave (the make() base); the old
orbits/convergence/sea cases stay inert. Attribute-free means the static fallback needs no attribute either.

## 30.4 Measured at the shipped setting (NLINES 48, PARK 0.5, BR 0.5, doy 2.05, uDriftAmp 0.06, uDriftSpeed 0.035)
WebGL2 confirmed (headless). w_ss all 8 = 1 both aspects. rest sceneF 6.959 fc 0.041 (wide) / 7.0 fc 0 (tall).
  • MESSAGE 24-frame field-under-text: WIDE min=median=max 13.81, 0 below AA — the band is lifted clear, so
    this is the STATIC scrim floor (scrim max-lum 0.026 → 13.82), field ≈ 0 under the glyphs. TALL 7.72
    (scrim, per §29.3 — field far above). 0 frames below AA either aspect.
  • NAV text (introduced risk — the lifted band touches the fixed nav): with nav hidden, field fills 1.94%
    of the nav band on wide (0.01% tall); nav text min contrast 7.46 wide / 10.8 tall — both ≥ AA (the nav
    panel backdrop protects it).
  • FOOTER (page-bottom, bg isolated via transparent text): min 15.86 wide / 17.41 tall, 0 below AA.
  • OFFSCREEN per-edge (field-only rest): wide T0 B0 L0 R0 (fully contained); tall T0 B0 L0 R0.2.
  • HUE: robust stdev over bright (lum>0.15) field pixels = 2.5° around 179° (wide, n=16369) — FLAT teal-cyan.
    The per-column-mean range (§22.2 method) reads 36° but is sparse-column NOISE here (it DECREASES as
    density rises — the opposite of a real gradient — and the field is visually flat teal). warm 0%, clip 0.31%.
  • cellCV 2.525 wide / 1.415 tall; lumCV32 0.86 / 0.27 (floors).
  • scrollHeight 6476 / 13046 (Δ0 vs orbits). ATTRIBUTE memory 27,200,000 B = 27.20 MB @200k (UNCHANGED —
    attribute-free; the earlier "25.94" was the same bytes in MiB). DATA TEXTURE adds 48·26·4·4 = 19,968 B
    ≈ 0.02 MB (a uniform sampler, not an attribute). @70k mobile: attributes ≈9.52 MB derived (untested).
  • FRAME TIME real-GPU UNTESTED (SwiftShader ~50 ms clamped). Probe via html/_probe.html. What the probe is
    comparing vs orbits: + one vertex texture fetch (two texel taps + lerp) and a handful of ALU (hashes,
    fract, smoothstep) per vertex, gated to stage 7; elsewhere driftW7=0 skips the whole block.

## 30.5 PROPOSED, NOT built — tall composition
Numbers at 1280×1800: the reachable band between the fixed nav (~87 px) and the closing message is the whole
column; at the drift rest the lit weave sits in the TOP ~third (screen y ≈ 130–880) and the message glyph
sits at y ≈ 1697 — a ~820 px void between them, and the tall weave is faint (litFrac 0.48%). Option (one,
to keep it simple): MESSAGE-RELATIVE placement of the band via a uniform like the sea's uSeaY — set doy
live from the .final-message rect (worldYAtScreen(<p> top) + a fixed clearance) so the current sits a fixed
distance above the caption at BOTH aspects instead of a fixed world height, closing the tall void and
letting a modest brightness lift read without a wide penalty (wide is already composed). This is a JS-only
uniform + a scroll/resize handler; no CSS change. Not built pending direction.

## 30.6 Current state (Round-28, working tree — uncommitted, not pushed)
stage 7 = 'drift' (advected C2 current). DRIFT_NLINES 48, DRIFT_PARK 0.5, DRIFT_BR 0.5, DRIFT_DOY 2.05;
uDriftAdvect 1, uDriftAmp 0.06, uDriftSpeed 0.035. Static fallback: uDriftAdvect=0. orbits/convergence/sea
inert. No CSS/HTML/copy change; scrollHeight Δ0. `_probe*` and SURVEY_* untracked. §30.5 is the open proposal.

---

## 30.7 Round-29 corrections + band-fit build (supersedes §30.4 placement / §30.5 "not built")

Four corrections then §30.5 built as band-fit. All JS-only; no CSS/HTML/copy; scrollHeight Δ0.

**Mobile suppression — verified, and how it survives the shader override.** The §30.3 shader REPLACES
`target` with the advected line point when driftW7>0, which ignores make()'s POSITIONAL parking (mobile
returns y=12 off-view). But BRIGHTNESS is read from the eb attribute, which the shader does NOT override —
mobile make('drift') returns brightness 0, so the advected particles render black regardless of position.
Verified on a 390×844 mobile UA/viewport: at the bottom rest the visible stage is 動画 (videos), NO teal
drift (litFrac 0.81% is the videos tail + stars, unchanged whether the gate is on or off; stage 7 is also
unreachable at 844<1188px, §Round-23). Belt-and-suspenders gate added anyway: `uDriftAdvect = isMobile ? 0
: 1`, so the whole advection/placement block is skipped on mobile and make()'s parked base is used.

**Field clamp (fixes the wide nav spill, §2).** The C2 streamlines wandered widely (ly −2.84..+2.09) so
band-fitting the p01–p99 core still let 1–2 outlier lines spill above the nav. Fix: reflect the flow at
±1.5 (LYC) during generation (flip vy at the edge, clamp ly) so no streamline leaves the band; p01–p99 ≈
full extent and the fit contains everything. Keeps the asymmetric C2 character (measured after).

**Band-fit placement (§4, built).** Uniforms uDriftCY (world centre) + uDriftSY (vertical scale) replace
the baked doy/SY. A handler updateDriftBand() (scroll+resize, JS-only, runs only while |sceneF−7|<1.05, and
never on mobile) reads the FIXED `<header>` bottom and the `.final-message <p>` top, converts to world via
worldYAtScreen (= tan(fov/2)·camZ·(1−2·screenY/H), the sea's uSeaY math), and sets uDriftSY = min(SYCAP,
bandHalf/coreHalf), uDriftCY = bandCentre − coreMid·SY — i.e. FIT the streamlines' robust core (p01–p99 of
ly, computed once at init) into [nav+24px, message−44px], centred, scale capped at SYCAP=1.3 (≈ isotropic
1.05·SX; measured — beyond this the lines visibly stretch). make() uses defaults CY0=1.0/SY0=0.8 for the
initial pre-advection frame; the live uniforms take over near stage 7. uDriftAdvect=0 still freezes the
static C2 weave (now at whatever CY/SY are live). RESULT: wide SY≈0.94 (≈ unchanged), tall SY=1.3 (capped)
centred → the tall current moves from the top-third to the vertical middle, closing the ~820px void.

**Hue metric correction → the §22.2 amendment (see there).** clip% denominator: it is the fraction of LIT
pixels (lum>0.05), not of the frame; stable across 24 frames (wide 0.28–0.29%, tall 1.53–1.68%).

## 30.8 Final measured — band-fit shipped (NLINES 48, PARK 0.5, BR 0.5, SYCAP 1.3, LYC 1.5, uDriftAmp 0.06, uDriftSpeed 0.035, uDriftAdvect isMobile?0:1)
WebGL2 confirmed headless. w_ss all 8 = 1. rest sceneF 6.959 fc 0.041 (wide) / 7.0 fc 0 (tall), ≥6 s settle.
  • BAND (luminance-mass 1–99% of the field rows, nav+message hidden): WIDE 109–453 px — 22 px below the
    nav bottom (87), 41 px above the message top (494): CONTAINED with margins (fixes §2). TALL 410–1364 px
    — 323 px below nav, 320 px above the message (1684): CENTRED in the tall band (fixes the §4 void).
  • MESSAGE 24-frame field-under-text: WIDE 13.81 (min=med=max; band lifted clear → static scrim floor,
    scrim max-lum 0.026); TALL 7.72 (scrim). 0 below AA either aspect.
  • NAV text (band sits just below the fixed nav): min contrast 7.46 wide / 10.8 tall — ≥ AA (nav panel
    backdrop; field is 1.9% of the nav band wide, ~0 tall).
  • FOOTER (page-bottom, bg isolated via transparent text): min 15.41 wide / 15.41 tall, 0 below AA.
  • OFFSCREEN per-edge: wide T0 B0 L0 R0; tall T0 B0 L0 R0.2 (contained).
  • HUE (amended §22.2): field-floored (lum>0.15) column-range 0.9° wide (23 cols) / n/a tall (too sparse,
    <2 cols); stdev over lit field pixels 2.4° wide (n≈17k) / 15.4° tall (n=313, small sample) — FLAT teal.
    warm 0%. clip% (of lit) 0.28–0.29% wide / 1.53–1.68% tall, stable across frames.
  • cellCV 2.38 wide / 1.23 tall; lumCV32 0.84 / 0.25. litPct 4.27% / 0.40% (tall delicate but now centred
    and spread across the mid-viewport). motion (mean |ΔL| between two advected frames) 0.0052 / 0.0023.
  • scrollHeight 6476 / 13046 (Δ0). ATTRIBUTE memory 27,200,000 B = 27.20 MB @200k (UNCHANGED, attribute-
    free). DATA TEXTURE 19,968 B ≈ 0.02 MB (uniform). @70k mobile ≈9.52 MB derived (untested).
  • CONTACT SHEETS both aspects, 24 frames uTime 2→64 s (> the slowest line's ~55 s period): flow migrates
    and reforms, no repeat.
  • FRAME TIME real-GPU UNTESTED (SwiftShader ~50 ms). Every vertex-shader change since orbits, for the
    probe: (1) one vertex texture fetch of uLineTex — two texel taps + a lerp (sampleLine); (2) the drift
    advection block — ~6 dhash (sin/fract), a fract, two smoothstep, a mix, gated by driftW7 (0 elsewhere);
    (3) uDriftCY/uDriftSY applied to the sampled point; (4) driftW·uDriftAmp residual curl on `amp`. Nothing
    outside stage 7 changed. gl_VertexID NOT used.

## 30.9 Current state (Round-29, working tree — uncommitted, not pushed)
stage 7 = 'drift', advected C2 current, band-fit placed (uDriftCY/uDriftSY live from nav+message), field
clamped ±1.5, SYCAP 1.3. Mobile suppressed (brightness-0 base + uDriftAdvect=0). Static fallback
uDriftAdvect=0. orbits/convergence/sea inert. No CSS/HTML/copy change; scrollHeight Δ0. `_probe*` and
SURVEY_* untracked. Open: real-GPU frame time (probe), and the laptop WebGL2/context confirmation.

---

## 30.10 Tall presence — the drift gain (Round-30)

Band-fit (§30.7) spread the same ~100k lit particles over a taller, centred band on tall, so tall went
faint (litPct 0.40% — nearly invisible) while wide stayed dense (4.27%). Fix: a uniform **uDriftGain**
multiplied into the drift's brightness INSIDE the advection block only (`vDrift=mix(1.0, edgeFade·uDriftGain,
driftW7)`) — a no-op at every other stage (driftW7=0) and on mobile (block skipped, uDriftAdvect=0). Driven
live by updateDriftBand() from the fitted vertical scale: **gain = 1 + (GAIN_CAP−1)·clamp((sy−SY_REF)/
(SYCAP−SY_REF), 0, 1)**, SY_REF 1.05 (above the wide fitted sy's settle range 0.94–0.98 → wide is EXACTLY
1.0), so tall (sy always = SYCAP 1.3) gets exactly GAIN_CAP.

**Two measured findings changed the plan (both contradicted the brief's assumption):**
1. The brief's plain **SY-ratio** gain (`uDriftSY/SY_wide` ≈ 1.3/0.94 = **1.37**) is far too weak — at gain
   1.37 tall litPct is only 1.16% (still faint). The presence loss (~10× density, wide 4.27 vs tall 0.40)
   is much larger than the 1.37× vertical stretch, because the tall band-fit also spreads particles over
   more screen area per world-unit. So the gain is driven to a measured target, not the raw ratio.
2. The brief expected clip%/hue-stdev to **degrade** as gain rises (as BR did on dense WIDE cores) — they
   do the OPPOSITE on sparse tall. Sweep at 1280×1800 (rebuilt sealib, field-only):

   | gain | litPct | clip%(of lit) | cellCV | hue stdev (n) | col-range@0.15 (cols) |
   |------|--------|---------------|--------|---------------|-----------------------|
   | 1.0  | 0.40   | 1.70          | 1.228  | 15.2 (n=324)  | 37.5 (3)  |
   | 1.3  | 0.97   | 0.71          | 1.279  | 7.6  (1544)   | 36.0 (11) |
   | 1.38 | 1.16   | 0.59          | 1.297  | 6.5  (2203)   | 34.8 (14) |
   | 1.6  | 1.84   | 0.37          | 1.344  | 4.5  (4726)   | 30.4 (29) |
   | 2.0  | 3.02   | 0.00          | 1.451  | 1.0  (12647)  | 0.9  (32) |
   | 2.5  | 4.57   | 0.15          | 1.423  | 2.1  (27688)  | 7.5  (32) |

   clip% FALLS (tall is sparse, not dense — brightening crosses more pixels above the lit floor, growing the
   denominator faster than any near-white count). And the **hue stdev of 15° at gain 1.0 was NOISE from
   n=324** — as gain lifts n above ~12k it converges to **~1–2°** (flat teal, = wide's 2.4°). So there is no
   degradation point to "back off" from; chose **GAIN_CAP = 2.0** — clearly present (litPct 3.0, ≈ wide's
   density but a touch more delicate), clip 0%, and enough field pixels to MEASURE hue. 2.5 reaches wide's
   density; 2.0 keeps tall reading as the delicate current it is.

**Run-to-run spread (don't read "stable" as bit-exact).** Gain 2.0 was measured twice: the sweep gave
clip 0.22% / hue stdev 2.9° (n=12670), the final run 0.00% / 1.0° (n=12647). Both pass with margin; the
difference is measurement noise, not a real change — each metric is read from a SINGLE captured frame, and
the advected field is a different phase at that instant (a handful of near-white pixels present in one
frame, absent in the other → clip 0.22 vs 0.00), on top of a slightly different band-fit settle (the eased
rest lands at sceneF 6.93–6.96, shifting the band a few px). So the honest tolerance at gain 2.0 is roughly
clip ≲ 0.3% and hue stdev ~1–3° — comfortably inside the gates, but not a fixed value.

**Tall hue, finally measurable and stated (the §30.8 caveat resolved).** At gain 2.0 the field carries
n=12,647 pixels > 0.15: **field-floored column-range 0.9° (32 qualifying columns), hue stdev 1.0° around
178.6°** — flat teal, a clear **PASS** of the §22.2 ≥10° bar. The earlier tall "15.4° at n=313" was
below the measurable threshold (too few field pixels), i.e. NOT-MEASURABLE, never a silent pass.

## 30.11 Final measured — tall gain shipped (adds uDriftGain to §30.8; unchanged params otherwise)
Rebuilt sealib for every metric. WebGL2 confirmed. w_ss all 8 = 1. rest sceneF 6.959 fc 0.041 (wide) /
7.0 fc 0 (tall), ≥6 s settle. **WIDE gain = 1.0 EXACTLY** (uniform read back; the drift brightness path is
bit-identical to the pre-gain build) — litPct 4.14, cellCV 2.56, hue 1.1°/stdev 0.9° (n17310), message
13.81 (0 below), footer 15.88, offscreen T0 B0 L0 R0, band 100–444 (nav+13/msg−38): matches §30.8 within
band-fit settle noise. **TALL gain = 2.0 EXACTLY** — litPct 3.02 (was 0.40), cellCV 1.451, hue col-range
0.9°/stdev 1.0° (n12647) FLAT-TEAL PASS, warm 0%, clip 0% (stable), message 7.72 (0 below, scrim floor),
footer 17.41 (0 below), band 415–1355 (nav+328/msg−329, centred), offscreen T0 B0 **L1.7 R1.8** (the
brighter full-width current now touches the side edges — horizontal spill only, vertically contained).
attribute memory 27.20 MB @200k (unchanged; texture 0.02 MB). scrollHeight 6476/13046 (Δ0). Contact sheets
both aspects, 24 frames uTime 2→64 s (> the ~55 s slowest-line period): flow migrates, no repeat.
The gain adds one scalar multiply in the drift-gated brightness path — negligible, and only at stage 7.

## 30.11a GPU frame-time gate — MEASURED on real hardware (replaces the SwiftShader UNTESTED label)
Run on the laptop GPU via `html/_probe.html`, WebGL2 confirmed (`EXT_disjoint_timer_query_webgl2` present),
200k particles, iframe ~1250–1330 px wide (wide-class composition). **Note:** the probe's "SEA" column loads
the WORKING TREE, so the label is stale — it measured the DRIFT. Same table form as the sea's §28.4:

  | run | DRIFT (working tree) | ORBITS (git baseline) | verdict |
  |-----|----------------------|-----------------------|---------|
  | 1   | **4.40 ms** (60 fps, min 58, n=131) | 5.60 ms (60 fps, min 60, n=100) | drift −1.20 ms |
  | 2   | **4.60 ms** (60 fps, min 58, n=216) | 5.50 ms (60 fps, min 56, n=327) | drift −0.90 ms |

Drift is **~1 ms CHEAPER than orbits** on both runs (advection is a texture fetch + a little ALU, gated to
stage 7; orbits ran a heavier per-vertex path) — passes the frame-time gate with margin. TALL was NOT
measured on the real GPU → **derived**: all drift changes are vertex-side and all 200k particles are
processed every frame regardless of composition, so this wide-class number is an UPPER BOUND for tall (whose
lit fraction 3.0% is below wide's 4.1%). cf. the sea's §28.4 (5.10 ms vs orbits 5.40).

## 30.12 Current state (Round-30, working tree — uncommitted, not pushed)
stage 7 = 'drift', advected C2 current, band-fit placed, tall gain (uDriftGain 1.0 wide / 2.0 tall, live from
the fitted scale). Mobile suppressed (brightness-0 base + uDriftAdvect=0). Static fallback uDriftAdvect=0.
GPU gate PASSED on real hardware (§30.11a: drift 4.4–4.6 ms vs orbits 5.5–5.6 ms, WebGL2 confirmed).
orbits/convergence/sea inert. No CSS/HTML/copy change; scrollHeight Δ0. `_probe*`/SURVEY_* untracked.
Open: real-GPU frame time (probe) + laptop WebGL2 confirmation.

---

## 30.13 docs/stills index (Round-30) — and the 7→8 numbering caveat

The canonical current still per stage (8-stage engine: cosmos 0 … drift 7). Only STAGE 7 changed by
content this round (orbits → drift); every other stage's motif is unchanged, so its latest still stands.

  | stage | motif | current still(s) |
  |-------|-------|------------------|
  | 0 | cosmos      | r17-0-cosmos.png |
  | 1 | nature      | r17-1-nature.png |
  | 2 | infra       | r17-2-infra.png |
  | 3 | foundation  | r20-3-foundation.png |
  | 4 | specialty   | r20-4-specialty.png |
  | 5 | stream/blog | r22-5-blog.png |
  | 6 | waveforms/videos | r17-5-videos.png  ← filename "5" is the OLD 7-stage index; it is stage **6** now |
  | 7 | **drift 流** | **r30-7-drift-wide.png (1440×900), r30-7-drift-tall.png (1280×1800)** |

**Stage-7 refresh.** `r30-7-drift-*` are captured from the committed drift build (3907501), settled ≥6 s at
the stage-7 rest, at the same viewports the orbits stills used. They SUPERSEDE `r24-7-orbits-wide.png` and
`r23-7-orbits-tall.png`, which are kept as the round-24 historical record (accurate for their round — not
deleted, mirroring how orbits/sea stay inert in the engine).

**Stale / historical — do not read their numbers as current stages.** These predate the Round-20 7→8 split
(foundation+specialty) and the stage-7 changes; they are archives of their rounds, not re-captured (that
would falsify them): `01-beginning / 02-galaxies / 03-earth / 04-society` (the old 4-motif naming); the
`r17-3-merged-study` (now split into stages 3+4), `r17-4-blog` (now stage 5), `r17-6-convergence` (stage-7
motif before orbits, removed); `s05-dispersal / s08-stream / s09-waveforms / s10-convergence` and
`r18-6-orbits` (orbits at the old index 6, before it moved to stage 7). The remaining July stills (12/13/15,
s01/s02/s04, s14-rest-*, interior-*, mobile-*) are older captures of unchanged stages/pages — still
representative, lower priority to refresh.

---

# 31. Round-31 — the accessibility round: index-block headings (§20.2) + footer tagline (§20.1)

Tooling+docs was Round-30's tail; this round is the parked §20 items. Measure → propose → implement
reversibly → verify every page by loading. Touches `css/style.css` (propagates to all 11 pages), so the
whole point is the cross-page verification (§31.4). All numbers from the rebuilt sealib (§30 helper).

## 31.1 Baseline (Phase A) — measured at f3e5780, before any change
Index blocks don't CSS-snap, but the scene engine centres each at `snapRest(stageIndex)`; at that scroll
the field settles to the INTEGER sceneF (3/4/5/6), so **landing == pure motif here** (no §23.6 blend — the
0.09-off landing did not appear; recorded both, they matched). 24-frame field-under-glyph, opaque-white
glyphs (all index headings/bodies are textL 1.0), min/below-AA:

  | block (stage) | heading WIDE 1440×900 | heading TALL 1280×1800 | body min (wide) |
  |---|---|---|---|
  | 基礎 foundation (3) | 16.18 (0 below) | 20.61 | 18.92 |
  | 専門 specialty (4) | 18.12 | 20.79 | 20.90 |
  | blog/stream (5) | 13.28 | 20.70 | 18.00 |
  | **videos/waveforms (6)** | **3.71 — min 3.71 / med 4.05 / max 5.54, 19-of-24 below AA** | 6.25 (0 below) | 9.23 (0 below) |

Only the **videos heading 最新動画 over waveforms, WIDE**, fails — reproduces §20.2's 3.7:1 exactly. Canvas
hidden it is 20.6:1, so the 3.71 is entirely the waveforms field (§20.2's diagnosis: no hero-scrim on
index headings). Waveforms animates → §21.3 regime (spread 3.71→5.54). Tall passes (6.25); the fail is
wide-specific. Every other heading and body clears AA with margin.

## 31.1a §20.1 footer tagline — MEASUREMENT CONTRADICTS the recorded framing
§20.1 recorded 3.6:1 as a MOBILE gap from `body::before` ambient. The tagline is `rgba(255,255,255,0.40)`
(--text-tertiary), 40% opacity, so opaque-white sampling is wrong; measured with the composited-glyph
method (full-coverage rendered luminance vs the background behind it):
  • **WIDE 3.68 · TALL 3.71 · MOBILE 3.66** — below AA on **ALL three viewports, not just mobile**.
  • The background behind the tagline is ~0.001 (near-black footer panel) on every viewport — `body::before`
    ambient barely reaches. So the cause is the **40% text opacity over the dark footer panel**, NOT the
    ambient. The footer is identical on all 11 pages → this is below AA on all 11 pages, everywhere.
  §20.1's number (3.6) is reproduced; its attribution (mobile-only, ambient-driven) is corrected here.

## 31.2 §20.2 fix — two options prototyped, CSS scrim chosen
Both fix the videos heading; the shader option costs the motif. Measured at 1440×900:

  | option | videos heading | waveforms motif cost | scope |
  |---|---|---|---|
  | baseline | 3.71 (19/24 below) | — | — |
  | **CSS scrim `.index-block__head::before` (rgba 0,0,0,.52)** | **8.51 (0 below)** | **none** (overlay, field untouched) | index.html ONLY |
  | shader `leftDim` gated to stage 6 (max(vInfra,wfW)) | 17.36 (0 below) | **lumCV32 0.175→0.472, litPct 0.77→0.48** (kills 38% of the field on the left; re-creates the left-dark/right-bright imbalance §21/§21.2 removed from stream) | JS |
PICK = CSS. It fixes the heading with zero motif cost (it is an overlay, not a field edit), is the
hero-scrim precedent (a soft feathered vignette), and is SCOPED to `.index-block__head`, which exists ONLY
in index.html (grep: 10 matches on index, 0 on the other 10 pages) — so it cannot touch any other page
(proven §31.4). The shader option over-corrects and reintroduces exactly the horizontal-imbalance failure
mode §21 fought out of stream (lumCV32 nearly triples) while dimming 38% of the waveforms. CSS chosen.

## 31.2a Scrim profile — the first version read as a BOX, softened to soft40
The first CSS scrim (rgba(0,0,0,0.52), `ellipse 115% 135%`, `transparent 100%`, `inset -1rem/-1.6rem`) lifted
videos to 8.51 but, isolated over white, read as a **hard-edged box**: the `transparent 100%` stop lands at
115%/135% of the SMALL heading box — i.e. OUTSIDE it — so the box edge clipped a still-visible gradient (a
crisp rectangular edge, visible in the isolated layer). Fixed by fading the gradient fully to transparent
INSIDE the box: **`ellipse 80% 95% at 26% 40%`, rgba(0,0,0,0.40)→0.22(42%)→0.06(70%)→transparent(88%),
`inset -1.6rem/-2.6rem`** ("soft40"). Isolated over white it is a smooth feathered vignette (no box); the
outer edge fades 0.06→transparent over ~27px ≈ **0.002 alpha/px**, no shoulder — the hero-scrim regime.
(An automated whole-crop pixel metric was unreliable here — contaminated by the transparent heading text's
anti-alias and the button box's fill — so the read rests on the isolated image + the analytic gradient +
the AA distribution.) Peak 0.40 (was 0.52); extent = head box + inset (≈114% of the ~574px head width),
peak anchored upper-left (26%/40%) over the heading. HOT-CORE: the scrim does NOT overlap the blog emitter
core or the stack warm core (both `coreUnderScrim=false`; max lit luminance under the scrim region 1.0→1.0
unchanged with the scrim on) — it only dims the moderate field directly under the heading glyphs.
videos AA under soft40: **wide 6.24 / tall 9.87 / mobile 9.1 (0 below AA)**; it lifts the passing blocks too
(wide: blog 13.3→16.3, 基礎 16.2→17.8) — no regression (§31.2b).

**Reading the isolated-layer captures (a note on the images).** In the scrim-isolated stills the head box
shows as a rectangle and parts of its interior read lighter/darker than the surround — which a pure
black-alpha gradient cannot do. That is the ISOLATION HARNESS, not the scrim: the capture composites a
white backdrop `<div>` (z-index -2) behind the scrim `::before` (z-index -1), with the WebGL canvas hidden
and the heading text set `color:transparent`; the apparent light/dark banding is that backdrop + the fixed
`body::before` ambient + the screenshot's own compositing + residual transparent-text anti-alias. It is NOT
a page background: `.index-block` and `.index-block__head` have no `background`, and the button's background
AND border are transparent (measured `rgba(0,0,0,0)`), so there is no pre-existing lighter box behind the
heads. CONFIRMED on the real page: diff the composite before vs after this round's CSS (field frozen, text
hidden) inside the head rectangle — **no pixel got brighter**: videos 0 brighter / 2927 darker (max −0.117),
基礎 0 brighter / 37 darker (max −0.095). So the only thing this round adds inside that rectangle is the
darkening gradient. **The automated whole-crop edge-step metric was unreliable here** (contaminated by the
transparent-text anti-alias and the isolation compositing) and is NOT used — the scrim's softness rests on
the analytic gradient profile (outer edge 0.06→transparent over ~27px ≈ 0.002 alpha/px, no shoulder) and
the AA frame-distribution (§31.2b).

## 31.2b Complete after-table (soft40) — all headings + bodies, wide/tall/mobile, 0 below AA
24-frame field-under-glyph (opaque headings/bodies), min contrast / below-AA count; every value is ABOVE
its §31.1 baseline (the scrim can only lift):

  | | 基礎 (3) | 専門 (4) | blog (5) | videos (6) |
  |---|---|---|---|---|
  | heading wide | 17.83 | 19.05 | 16.33 | 6.24 |
  | heading tall | 20.7 | 20.89 | 20.8 | 9.87 |
  | heading mobile(70k) | 16.33 | 20.87 | 20.8 | 9.1 |
  | body wide | 19.57 | 20.9 | 18.94 | 13.0 |
  | body mobile | 21.0 | 20.9 | 20.9 | 7.38 |
All 0 below AA on all three viewports. Mobile field is 70k (confirmed) and the index blocks reflow, so this
was measured, not inferred. (Waveforms animates → §21.3 regime, videos spread e.g. wide 6.24→8.x; the stacks
rest static → §23.7 zero spread.)

## 31.3 §20.1 fix — footer tagline opacity, smallest scoped change
`.footer-tagline` color `var(--text-tertiary)` (0.40) → `rgba(255,255,255,0.55)` — scoped to the tagline
element, NOT the shared token (which has ~18 other uses). Composited contrast after, on index: WIDE 6.26 ·
TALL 6.23 · MOBILE 6.25 (from ~3.7). Measured across **all 11 pages at mobile** (the footer is identical
everywhere): index **6.21**, the ten interior pages **4.99** each — the interior pages sit at a slightly
brighter footer background than index. **Min 4.99, all ≥ AA 4.5.** The tagline is static (footer panel, no
motif — mobile suppresses the field), so this is a zero-spread rest (§23.7): no dip risk, like §23.6's 4.88.
Reversible: restore `color: var(--text-tertiary)`.

## 31.4 Phase D — every page verified by loading (before f3e5780 css vs after)
Deterministic full-page diff at 1440×900 (all `canvas` + `iframe` hidden so the animated field / knowledge
graph / PDF viewers don't add noise; `.reveal` forced visible), masking the intended regions (tagline all
pages; `.index-block__head`±40px on index). `scrollHeight` Δ measured separately (the scrim is absolute /
z-index -1, the colour change is layout-free → Δ must be 0).

  | page | scrollHeight Δ | changed px OUTSIDE mask | note |
  |---|---|---|---|
  | index | 0 | 116 | < the same-CSS **self-diff floor of 149** → CJK font-hinting jitter at the footer row, NOT the CSS |
  | study | 0 | 0 | (83k before excluding `#graph-container`, the knowledge-graph canvas — non-deterministic, not CSS) |
  | blog, videos, self-intro, sns, peskin-qft, peskin-qft_sec2-1..4 | 0 | **0** | clean |
All 11: scrollHeight Δ0; 0 real changed pixels outside the tagline+scrim regions (index's 116 is below the
149 rendering-nondeterminism floor). `git diff --stat`: **only css/style.css** changed (28 ins, 1 del) →
the MathJax / Three.js / PDF `createElement` loaders (all in JS/HTML) are byte-identical, so those pages
render identically by construction. The `.index-block__head` scrim matched nothing on the 10 non-index
pages (their diff is 0 outside the tagline). (Phase D was run with the 0.52 profile; its conclusions —
index-only selector, absolute/layout-free, nothing changed outside the mask — are PROFILE-independent and
hold for soft40, which is the same selector at the same z-index with a larger absolute inset.)

## 31.5 §25.4 tall right-edge clipping — PROPOSAL ONLY (not built)
Approach: an **aspect-gated world-x shift** `uTallShiftX`, driven live from the viewport like the §30 band-
fit uniforms — 0 at aspect ≥ 1 (wide stays 0% clip, untouched), ramping to ≈ −0.5…−0.75 world at aspect
≤ 0.71 (tall), applied to the RIGHT-OF-CENTRE motifs (foundation, specialty, stream/blog) via their stage
gates. **Translation only, no scale** — respects §25.3 (the stack is at its frame ceiling and must not be
enlarged). A throwaway prototype (uDX offset, tall) confirmed the DIRECTION: a left shift moves lit mass
off the right edge onto the left (stack right-edge-lit 0.8%→0.2% at −1.0 world; specialty 1.3→0.6; left
edge grows), and the stack has left headroom. CAVEAT: the prototype's 1px edge-lit metric ≠ §25.4's per-
form offscreen (my stack baseline 0.8% vs §25.4's 4.6%), and forcing sceneF at a fixed scroll does not
reproduce each stage's true landing — so the ABSOLUTE numbers are not comparable; the build round must
re-measure with §25.2/§25.4's offscreen metric at each stage's real landing, and tune ΔX and the aspect
ramp to drive tall right-clip → 0 for stack/spec/blog while holding wide at 0%. Not built this round.

## 31.6 State (Round-31)
`css/style.css`: `.index-block__head::before` scrim (§20.2, soft40 profile — §31.2a) + `.footer-tagline`
0.55 (§20.1). Both reversible (delete the ::before rule; restore the tagline token). No JS/HTML change;
scrollHeight Δ0 all 11 pages; verified page-by-page (§31.4). §25.4 remains a proposal (§31.5).
`_probe*`/SURVEY_* untracked. Committed as "Round-31: index-block heading scrim + footer tagline opacity —
§20.1/§20.2 AA on all viewports" (not pushed).

---

# 32. Round-32 — Stage 6 (waveforms / 最新動画 / videos): the corrugated wave membrane (ARM 2)

The waveforms slab read as a rotating *plane*, not a volume. This round corrugates it in z so it occupies
the space at every rotation phase. One functional line changed (`js/scroll-scenes.js` waveforms `make()`);
no CSS/HTML/copy. Method throughout: characterise → calibrate the metric on the *current* build before
building → prototype behind a toggle → measure wide/tall/mobile field-only → decide. All numbers headless
(rebuilt sealib, §30 helper) unless marked real-GPU. Eight self-corrections are recorded as corrections in
§32.8 — several overturn my own earlier claims in this round.

## 32.1 The defect (characterised, Step 1)
Stage 6 = 5 thin signal lines on a slab: wide-x `±1.7·S`, thin-z `0.22·S` (x:z ≈ 7.7:1). It rotates about y
at `ROT[6]=[0,0.03]` + `clock·(0.02+…)` ≈ 0.02 rad/s (period ~314 s). At rotY ≈ π/2 (≈ every 157 s, ~14 s
window) it turns near edge-on: the projected extent collapses to a narrow vertical band right of centre with
voids left/right — this is the "hard to see" the user reported. **Perspective bounds the collapse to a
worst-phase extent ~684 px** (camera z = 7; the near-particle fan keeps it far from an orthographic
`0.129×` band) — measured, not derived (Correction 1). It is a projection defect, not the starfield
(Correction 2).

## 32.2 The fix — attribute-free z-corrugation (shipped amp 0.6 / freq 0.8)
`js/scroll-scenes.js`, waveforms `make()`:
`wzz = (wtr-2)·S·0.11  +  WAVE_CORR_AMP·S·sin(wxx·WAVE_CORR_FREQ)`  — shipped `WAVE_CORR_AMP=0.6`,
`WAVE_CORR_FREQ=0.8`. The sheet folds in z, so no rotation phase is a flat plane; it reads as a woven
membrane occupying the space. Derived from the existing `wxx` — **no `rnd()` draw, no new `setAttribute`**.
- **Toggle / dead code:** `WAVE_CORR_AMP=0` makes the added term `0·S·sin(...)` = exactly 0 (IEEE754 `x+0=x`)
  and consumes no random draws, so it reproduces the pre-round flat sheet **bit-for-bit**. Kept as inert
  dead code (the flat form stays reachable/intact).
- **Cost is structural-zero:** attribute-free → **slots 12/16 unchanged**, **memory 27.20 MB @200k
  unchanged** (K=8, EBV=⌈8/4⌉=2, `attributeBytes = (K·3+EBV·4+1+1)·4·COUNT = 34·4·COUNT`).

## 32.3 Metric calibration (Step 3, calibrated on the current build BEFORE building)
- **2-D occupancy** (broadside target bbox gridded 48×24): **`maxEmptyRect` (largest empty rectangle, % of
  bbox) is the decisive metric.** COF and cell-occupancy do NOT discriminate — both sit ~1.0 / 0.44–0.73 for
  the good broadside AND the collapsed edge-on states (scattered particles keep cells nominally occupied
  while a large void persists). Only the empty-rectangle search sees the void.
- **Collapse GATE: `maxEmptyRect < 10%`.** Set from the known-bad reference: current build worst edge-on
  **12.5% (wide) / 28.0% (tall)** — clearly failing; good broadside 1.4–6.9% — clearly passing.
- **Faint/fog:** `litPct < 0.5%` flags faintness. The `AND cellOcc_abs<0.45` form I first proposed is too
  lenient (its τ self-scales), so it must be `litPct`-driven (Correction 5).

## 32.4 The amplitude decision — amp 0.6 (Steps 4–5), field-only
| metric (wide) | current (amp 0) | **amp 0.6 (shipped)** | amp 0.9 |
|---|---|---|---|
| broadside litPct % | 0.747 | **1.161** | 1.522 |
| broadside massH / rawX px | 1268 / 1439 | **1033 / 1280** | 1075 / 1280 |
| worst edge-on `maxEmptyRect` % | **12.5 ✗** | **7.0 ✓** | 5.6 ✓ |
| worst edge-on massH px | 688 | **982** | 1101 |
| tall worst edge-on `maxEmptyRect` % | 28.0 ✗ | **3.0 ✓** | 1.7 ✓ |
| mobile broadside / edge clip % | 10.71 / 3.14 | **10.89 / 5.50** | 10.96 / 7.36 |

amp 0.6 chosen: clears the collapse gate at every phase and aspect, adds a wide density gain (0.747→1.161),
and costs less mobile edge-on clip than amp 0.9. Notes:
- **Broadside extent contracts (a stated trade, not a bug):** rawX 1439→1280, and **1280 for BOTH amps**
  (the fold envelope, not its depth, sets the projected x-extreme, so it saturates). ARM 2 **buys edge-on
  extent (worst-phase 688→982) by giving up peak broadside width** — the pre-fold broadside was overshooting
  the frame edge anyway (Correction 3). The non-monotone *massH* (1033 < 1075) is a mass-band-tail artifact,
  not geometry: rawX is identical (1280/1280); the brighter amp 0.9 (litPct 1.52 vs 1.16) pushes its 99%-mass
  boundary ~42 px further out.
- **Mobile clip is baseline, not ARM-2-introduced:** the current flat build already clips **10.71%** at
  mobile broadside; ARM 2 adds ~0.2% there (Correction 4). The real ARM-2 mobile cost is at edge-on
  (3.14→5.50 at amp 0.6).
- **Tall faintness UNCHANGED** (broadside litPct 0.172 / 0.169 / 0.167, re-measured separately per amplitude
  — Step 5 C, distinct captures proven by monotone rawX 1271/1205/1136). Corrugation is geometry, not
  density; this is the **dominant remaining defect on tall** and a **separate density arm — NOT addressed
  this round** (open item).

## 32.5 The fold-crest caustic — descriptive, NOT gated
The fold introduces a **bright vertical crest line** (a caustic where a corrugation crest runs tangent to the
view). It is in the same screen region and has a similar character to the original defect, so it is measured,
not waved away. **Concentration metric:** share of total field luminance in the brightest 10% of columns.
Current collapsed edge-on = **66–73%** (streak reference). Over a full 0→π rotation the caustic (top-10% ≥
55%) appears in **7/18 frames at amp 0.6** and **5/18 at amp 0.9**, vs current **2/18** — materially more than
the "some phases" I first wrote (Correction 7). **Acceptance:** the user reviewed the amp-0.6 broadside still
and reads the bright crest as *the wave converging* — accepted as intended appearance. Therefore
**concentration is recorded as DESCRIPTIVE, not a gate**; **`maxEmptyRect < 10%` remains the real collapse
check** (§32.3).

## 32.6 Heading contrast (最新動画) — holds with the existing §31 scrim, no change
8×8 rotation×wave grid (64 frames), amp 0.6, full-page with the shipped `.index-block__head::before` scrim:
**scrim ON 0/64 below AA on all three aspects** (min 6.33 wide / 6.16 tall / 6.78 mobile). Scrim off drops
frames below AA (13/64 wide, 16/64 mobile), so the §31 scrim stays load-bearing — but it fully covers ARM 2.
No heading change needed. (The glyph rect the grid measured under was valid — `{x192, y417.1, w120.4, h36}`,
white textL 1.0; the heading was present all along — Correction 6.)

## 32.7 Frame time — absolute MEASURED (real GPU); incremental UNTESTED
Stage 6, working tree at `WAVE_CORR_AMP=0.6`, real laptop browser, hardware GL, 1440-wide, landed via
`window.__field.snapRest(6)`, **sceneF 6.000180** (settled; confirmed at stage 6, not stage 7):
- **200k particles; frame ms = 13 one-second samples, range 3.8–4.7, typical ~4.1–4.2; SUSTAINED 60 fps** over
  the ~30 s window, no drop observed.
- **GPU-timer path:** `EXT_disjoint_timer_query_webgl2` confirmed present; the HUD's `frame ms` is the GPU-timer
  value, exponentially smoothed. The HUD has **no fps-min field → this is SUSTAINED fps, not a true minimum.**
- **The amp-0 comparison was NOT run.** The absolute cost of the shipped motif is measured; the **incremental
  cost of the corrugation vs the flat sheet is UNTESTED.** Reasoning it was judged unnecessary — **explicitly
  not a measurement:** the corrugation is one extra `sin` per stage-6 vertex in `make()`, CPU-side at build,
  adding nothing per frame in the shader, and 4.1 ms at 200k sits comfortably under the Round-30 drift figures
  (4.40/4.60 ms, §30.11a) with 60 fps never dropping.
- **Stage 7 non-regression** (`tools/probe/`, same machine, 200k, GPU-timer path): working tree **4.80 ms** vs
  frozen orbits baseline **4.60 ms**, **Δ +0.20 ms**, both sustained 60 fps (working-tree fps min − 0 vs
  baseline), samples 101 / 88, baseline orbits frozen @3e942e0. **No regression from Round-32** — as expected,
  the change is confined to stage 6's `make()`. The +0.20 ms is the **drift-vs-orbits** difference, **NOT** an
  amp-0.6-vs-amp-0 difference (`tools/probe/` is a stage-7 harness and cannot measure stage 6).

## 32.8 Corrections (Round-32) — recorded as corrections
1. **Orthographic estimate wrong.** The edge-on collapse is perspective-limited (worst-phase ~684 px), not
   orthographic (~0.129× band). Measured, not derived.
2. **"Star pollution" wrong.** The stray lit pixels at edge-on are perspective fan-out + luminance clipping,
   not the starfield.
3. **"Pure mass redistribution, x-geometry unchanged" wrong (Step 3 C).** Raw x-extent also contracts
   (1439→1280); it is a real perspective-mediated projected change from the z-fold. ARM 2 buys edge-on extent
   by giving up broadside extent.
4. **"ARM 2 over-clips / blows out mobile" overstated (Step 3).** The current flat build already clips 10.71%
   at mobile broadside (baseline); ARM 2 adds ~0.2% there. The real ARM-2 mobile cost is at edge-on
   (3.14→5.50 at amp 0.6).
5. **Fog test too lenient (Step 3 1b).** `cellOcc_abs<0.45 AND litPct<0.5%` passes the visibly-faint
   tall-broadside because `cellOcc_abs`'s τ self-scales; the faint check must be `litPct`-driven.
6. **Heading hidden in Step-4 captures (Step 4).** From Step 4 on I hid `#stage-videos h2` in the
   still/contact-sheet generators, not just the contrast-measurement pass, so 最新動画 was absent from every
   Step-4 image. It renders correctly (DOM: visible, white, 30.4 px, in viewport); the contrast rect used was
   valid and the §32.6 result is not void. Stills must show the heading; only the contrast pass hides it (to
   sample the background behind the glyphs).
7. **Caustic prevalence understated (Step 4 E).** I wrote "at some broadside phases." Measured: top-10%
   concentration ≥55% in 7/18 rotation frames at amp 0.6 (5/18 at amp 0.9) vs current 2/18 — ~a third to
   ~40%, materially more frequent than "some."
8. **endQuery/ReadPixels warning misclassified as a headless SwiftShader artifact.** In a real desktop
   browser with hardware GL, `INVALID_OPERATION: endQuery: target query is not active` fired 256× at the
   stage-6 landing, alongside a working GPU timer and plausible values; no functional impact observed. The
   warning is **not headless-specific.** Diagnosing it is left as a separate open item — not investigated or
   fixed this round.

## 32.9 State (Round-32, working tree — staged for commit, not yet committed/pushed)
stage 6 = corrugated wave membrane, `WAVE_CORR_AMP=0.6` / `WAVE_CORR_FREQ=0.8`, attribute-free; `WAVE_CORR_AMP=0`
is inert dead code reproducing the pre-round flat sheet bit-for-bit. Slots 12/16 and 27.20 MB @200k unchanged.
**Only `js/scroll-scenes.js` changed** — no CSS/HTML/copy; scrollHeight Δ0. Collapse gate `maxEmptyRect<10%`
met at every phase/aspect; heading AA holds with the §31 scrim; frame time measured (§32.7, absolute; amp-0
delta UNTESTED). Caustic accepted as intended (§32.5). `SURVEY_*` untracked (the user's, never staged). Open
items: (a) **tall faintness** — a separate density arm; (b) **Correction 8** endQuery warning diagnosis;
(c) §25.4 tall right-edge clip still a proposal (§31.5). docs/stills + probe: see the Step-8 proposals (stage-6
still is stale; no probe refreeze needed — stage 7 unchanged).

---

# 33. Round-33 — Stage 5 (Blog / 最新ブログ): the rhombicuboctahedron (replaces the radial emitter)

Stage 5's radial emitter read as a flat, planar burst — the same class of defect §32 fixed at stage 6. This
round replaces it with a **volumetric polyhedron in perspective** (the user's brief, referencing stage 2's
lattice). Propose-then-build: characterise → calibrate on the current form → bake off candidate polyhedra by
eye → build the chosen one. One functional line changed (`js/scroll-scenes.js` stage-5 `make()` case + a
module-scope precompute); no CSS/HTML/copy; stages 2, 6, 7 untouched. Numbers headless (rebuilt sealib, §30
helper) unless marked real-GPU.

## 33.1 The defect (characterised, Step 1)
The Round-21→22 emitter was **coplanar by construction**: filament and core z = `gauss(0.03·S)` against an
in-plane reach of `0.7076·S` — a depth:in-plane ratio ≈ **1:47 by std** (~1:16 by 3σ range). At rest it read
as a 2-D pinwheel with no near/far parallax; over a full y-rotation it **collapsed to a vertical line** (wide
massH 1068→**625**, worst-phase `maxEmptyRect` 14.6%, top-10% concentration 86%). Worse than the stage-6 slab
(a plane→line, not a slab→sheet). **Median `maxEmptyRect` failed the <10% collapse gate on every aspect: 12.5
(wide) / 20.8 (tall) / 16.2 (mobile)** — voids at most phases, not only edge-on.

## 33.2 The fix — rhombicuboctahedron wireframe, attribute-free
`js/scroll-scenes.js`, stage-5 `stream` case: a **rhombicuboctahedron** (24 vertices / 48 edges) rendered as
**edges-as-particles** — a hollow polyhedral shell seen in perspective (near edges larger via the shader's
size attenuation). Vertices = permutations of `(±1,±1,±(1+√2))`, edges = the min-distance vertex pairs, a
fixed tilt baked so the rest pose already reads 3-D. Particle placement is **attribute-free from `aSeed`**:
edge = `i % 48` (even allocation), param `t = rnd()` along the edge, tight perpendicular jitter.
- **Centred at the origin** (kills the tall right-spill, §33.4). Circumradius `0.62·S` wide/tall, **`0.72·S`
  mobile** (§33.3).
- **Warm core at the centroid**, absolute radius `0.05·S`, full coherence (§23 full-or-nothing).
- **No new `setAttribute`** → **slots 12/16, memory 27.20 MB @200k — both unchanged.**

## 33.3 Mobile legibility — needed, and fixed without a brightness boost
The prototype (Step 2) read as a **fuzzy ball at 70k** (1458 particles/edge, 48 edges merging at small scale).
Three changes fixed it: **even allocation** `i%48` (no lucky-thin edges), **tighter jitter** `0.006·S` mobile /
`0.008·S` desktop (was 0.012 in the proto — crisp lines, not fuzzy tubes), and a **larger mobile circumradius**
`0.72·S` (was 0.62 — separates the 48 edges). **Brightness was deliberately left alone** (energy 0.30, br 0.6)
to protect the thin mobile heading (§33.7). Result: a crisp wireframe with a visible core at 70k.
**Untried levers, recorded for a future round if more crispness is wanted:** fewer parked particles, or
near-edge brightening (both risk the heading and were not needed).

## 33.4 §25.4 — stage 5's share resolved (centring), and a metric caveat
Centring took stage 5's tall right-edge spill from the emitter's **20.8% → 0 on every edge, all three aspects**,
measured with **§25.2's projected-particle metric** (share of a stage's target particles projecting outside
NDC). **The screen-edge-lit metric is unreliable for a dim-rimmed form** — it read the old emitter's spill at
**0.1%** (the rim is faint, so few edge pixels clear the floor) versus the true 20.8%; §25.2's projected metric
is canonical, validated this round against §25.3's stage-3 stack (projected 4.85% vs recorded 4.6%). **§25.4
remains open for the stage-3 stack (4.6% tall); stage 5's share is closed.**

## 33.5 Result table (field-only; landings, settle 6 s, sceneF confirmed)
Landings: wide **scrollY 4094 / sceneF 5.0000**, tall **8234 / 5.0000**, mobile **3930 / 4.9995**.

| metric | wide | tall | mobile |
|---|---|---|---|
| **RIE** (min/max massH over full y-rot; gate **≥0.73**) | **0.978** | **0.961** | **0.972** |
| massH min/med/max | 756/769/773 | 1004/1031/1045 | 311/318/320 |
| rawX min→max | 1037→1037 | 1045→1074 | 333→333 |
| **§25.2 offscreen** L/R/T/B | 0/0/0/0 | **0/0/0/0** | 0/0/0/0 |
| litPct med | 4.22 | 1.02 | 3.38 |
| cellCV med (32×16) | 1.567 | 1.633 | 1.641 |
| lumCV32 med (**floor check only**) | 0.544 | 0.375 | 0.274 |
| concTopK med (**descriptive**) | 34.3 | 41.8 | 25.1 |
| clipPct med (**denom = lit px**) | 0.88 | 2.07 | 4.92 |
| warmPct | **0.597%** | **not measurable** | **not measurable** |
| hue colRange (§22, **form-only**, N) | 0.9° (N 50303) | 1.3° (N 21716) | 1.2° (N 10379) |

The RIE gate is **stage 2's measured 0.729** (a real volume's rotation-invariance); all three clear it with
margin, and **no phase collapses toward a line** (min massH 756 wide vs the emitter's 625). Warm core is
**0.597% on wide** (≈ cosmos share); on tall/mobile it is **not measurable** — the core is ~0.9% of particles
and too few warm pixels clear floor 0.15 on the fainter aspects (visible in the wide/mobile stills, faint on
tall), stated as not-measurable rather than a silent pass. Hue is **flat teal on all three aspects, form-only**
(see §33.11 correction 9c for why "form-only" matters). `lumCV32` recorded as a floor check only; `concTopK`
descriptive (no streak — the wireframe has no bright caustic).

## 33.6 Edge weight across viewports (Step 4 A) — identical geometry; the difference was montage scale
Point size (`gl_PointSize = clamp(uSize·boost/depth,0,8)·uPixelRatio`, uSize 17 desktop / 18 mobile) and
jitter (`0.008·S` desktop = 0.028 world; `0.006·S` mobile = 0.0123 world) are **device-dependent but NOT
aspect-dependent — wide and tall are the same geometry.** The contact-sheet impression that tall edges are
thicker/brighter is a **montage-scale artifact**, confirmed by measurement (form-only): median single-edge
run-width **wide 7 / tall 2 / mobile 3 px**; lit-px per projected-edge-length **wide 7.65 / tall 1.73 / mobile
2.95**; mean lit luminance **0.180 / 0.168 / 0.210** (equal). Both thickness measures show tall edges are *not*
thicker — the tall viewport projects the form **2× larger** (bbox 986 vs 495 px), separating the edges, while
the wide form's 48 edges overlap into a denser mesh (which inflates wide's run-width). **Recorded so a future
round does not re-litigate it:** edges are thin (1–3 px) and consistent; pixel edge-weight varying with canvas
height is ordinary projection behaviour every stage has, not a bug and not a side-effect of the mobile change.

## 33.7 Heading contrast (最新ブログ) + the scrim dependency (Step 4 C)
8×8 rotation×breathe grid, scrim vs field decomposed, glyph textL 1.0:

| | scrim ON min | below AA | scrim OFF min | below AA |
|---|---|---|---|---|
| wide | 16.33 | **0/64** | 13.28 | 0/64 |
| tall | 6.25 | **0/64** | 3.71 | 28/64 |
| mobile | 7.39 | **0/64** | 3.71 | 63/64 |

**Scrim-ON holds AA at 0/64 on all three aspects** (tightest tall 6.25) — not a blocker. **STANDING DEPENDENCY:**
centring the form makes 最新ブログ **the most scrim-dependent heading on the site** — scrim-off below-AA jumps
from the old right-placed form's 24/64 to **63/64 (mobile)** and 8/64 to **28/64 (tall)**. Any future change to
`.index-block__head::before` (the §31 scrim) puts this heading at risk first and must re-verify stage-5
mobile/tall.

## 33.8 The bake-off, the user's override, and the RIE lesson
Three edge-as-particle prototypes were built and measured (Step 2): **P1 octahedron (12 edges), P2 stella
octangula (12 edges), P3 rhombicuboctahedron (48 edges)**, all centred, identical circumradius, warm core at
centroid. **P1 and P2 cleared every gate** (RIE, spill→0, heading scrim-ON 0/64) and I **ranked P3 last on
perceptual grounds**: it reads **ball-ish** (26 faces approach a sphere → fails distinctness from stage 0's
volumetric sphere), it is the **most stage-2-adjacent in character** (18 square faces, many right angles), and
it was **weakest at 70k** (4× sparser per edge). **The user overrode the ranking on taste and adopted P3**,
accepting the wireframe/line-drawn look as intended — their call. Recorded straight, ranking not rewritten to
match the outcome.
- **The RIE lesson (record it):** P3 posted the **BEST RIE (0.976)** while reading **worst by eye**. RIE
  rewards *roundness* — a near-spherical form has the most rotation-invariant extent — so **RIE gates collapse
  but must never be read as a quality score.** Same class of finding as §32's concentration metric: a number
  that tracks one property (here, non-collapse) can move opposite to the perceptual goal.

## 33.9 Stage-0 distinctness + the scroll transition
- **Stage 0 vs stage 5 (made decidable by eye, Step 3):** stage 0 is a **dense filled sphere** + magenta core;
  stage 5 is a **hollow wireframe** + magenta core. **No collision** — filled-vs-wireframe is decisive; the
  **magenta core is the only shared element**, and it is the available lever (drop / recolour / shrink on stage
  5) if more separation is ever wanted. Nothing changed unilaterally.
- **Scroll transition (the user's "if it becomes this shape as you scroll, it's fine"):** the form **assembles**
  from the dispersing specialty stack and **dissolves** into the waveforms rather than popping in. scrollY
  3554→4634, sceneF **3.998 → 4.25 → 4.5 → 4.75 → 5.000 (assembled rhombicuboctahedron) → 5.25 → 5.5 → 5.75 →
  6.000**.

## 33.10 Frame time — absolute MEASURED (real GPU); incremental UNTESTED
Stage 5, working-tree build, real laptop browser, hardware GL, 1440-wide, landed via `snapRest(5)`, **sceneF
4.999626 confirmed at stage 5 before sampling**:
- **200k particles; frame ms = 30 one-second samples, range 3.2–4.5, most 3.3–3.6; SUSTAINED 60 fps** over
  ~30 s, no drop.
- **GPU-timer path:** `EXT_disjoint_timer_query_webgl2` confirmed present; HUD value, exponentially smoothed.
  No fps-min field → this is **SUSTAINED fps, not a true minimum.**
- **No before/after delta exists.** The retired radial emitter was not measured. **Absolute cost MEASURED; the
  incremental cost versus the old form is UNTESTED** (same stance as §32.7 — not derived, estimated, or
  inferred).
- **Reasoning (explicitly not a measurement):** stage 5 is not heavier than the §32 stage-6 reading (3.8–4.7 ms)
  despite a much higher litPct (wide 4.22% vs the corrugated sheet's 1.16%). The likely reason is that a hollow
  wireframe concentrates particles onto thin edges instead of spreading additive overdraw across a filled area.
- **Methodological note (§26.3 earning its place — a worked example):** the FIRST reading was taken at **sceneF
  4.84** — mid-transition between the stage-4 stack and the assembled polyhedron, not the rest pose — and was
  **discarded once sceneF was checked**. It gave similar numbers, so only the sceneF check caught that it was
  not measuring the adopted form. Settle, then verify sceneF, *then* read.
- Stage 7 untouched → no `tools/probe/` run applies and **no refreeze needed**.

## 33.11 Corrections (Round-33) — recorded as corrections
- **9a — the stella's "natural core anchoring" advantage does not exist.** *Believed* (Step 1): the
  interpenetrating tetrahedra anchor the warm core more naturally than the octahedron. *Measured*: for an
  **edges-only** shell all arms have an empty centre; the core is placed at the centroid identically. *Now*: no
  arm has a core-anchoring advantage.
- **9b — stella octangula edge count.** *Believed* (Step 1): 24 edges. *Measured*: two tetrahedra = 6+6.
  *Now*: **12 edges.**
- **9c — the Step-3 tall hue of 30.8° was DOM-text contamination, and the core explanation was also wrong.**
  *Believed* (Step 3): tall hue colRange 30.8°, caused by the magenta core making per-column means bimodal.
  *Measured*: **form-only** (all DOM hidden but the canvas), colRange **1.3°** at floor 0.15, stdev 0.8, N
  21716, **0 warm pixels excluded** — the core was never in the measurement; the 30.8° came from the bright
  white nav/heading/body pixels and their antialiased fringes entering the mass-band bbox on the faint tall
  form (a §22-class wrong-pixels error, the very thing §22 exists to prevent). *Now*: **the field is flat teal
  (~1.3°) on all three aspects; no gradient, and not the core.**

## 33.12 State (Round-33, working tree — staged for commit, not yet committed/pushed)
stage 5 = rhombicuboctahedron wireframe, attribute-free (`i%48`, `t=rnd()`), centred, `0.62·S` wide/tall /
`0.72·S` mobile, warm core at centroid absolute `0.05·S` full. Retired Round-21→22 radial emitter kept as
**inert dead code** under `case 'radialemitter':` (not in `stages[]`, reachable via `make('radialemitter')`),
matching the orbits/convergence/sea/§32-amp-0 pattern. Slots 12/16, 27.20 MB @200k unchanged. **Only
`js/scroll-scenes.js` changed** — no CSS/HTML/copy; scrollHeight Δ0; stages 2/6/7 unchanged (confirmed by the
transition frames). Collapse gate `maxEmptyRect<10%` met at every phase/aspect via RIE ≥0.96; spill 0; heading
AA holds with the scrim; hue flat teal; frame time measured (§33.10, absolute; incremental UNTESTED). `SURVEY_*`
untracked (the user's, never staged).
**Open items after this round:** (a) **stage-6 tall faintness** — unchanged, still its own density arm; (b)
**Correction 8** (§32) endQuery-warning diagnosis; (c) **stale stills for BOTH stage 5 and stage 6** (proposed:
`r33-5-blog-{wide,tall,mobile}`, `r32-6-videos-{wide,tall}`, superseding `r22-5-blog`/`r17-5-videos`; §30.13
rows to update — not regenerated this round); (d) **§25.4 for the stage-3 stack** (4.6% tall; stage 5's share
closed this round).

# §34 — Stage 7 (closing motif): the frozen 43° accretion disc

## 34.1 The arc of the round — drift → gas → orbital → accretion disc → freeze
Stage 7 is the closing section (final message centred, footer below; §27 snap point LOAD-BEARING). Round 34
replaced the shipped orbital rings through a sequence of **intent changes by the user**, each requiring a
metric re-aim:
- **Steps 1–4 — gas.** A viewport-filling continuous medium (large soft sprites, `uGasSize`/`uGasSoft`, CDF
  density grid). Finding: large soft sprites blend neighbours into a continuous medium. **RETIRED** to
  `case 'gascloud':` (inert dead code, matching the orbits/convergence/sea/radialemitter pattern).
- **Step 5 (user override) — "particles orbiting a black hole; the centre is invisible, only its effect is
  drawn."** Fill-vs-concentrate resolved as **CONCENTRATE** (bounded object, empty corners intended).
- **Steps 6–7 — the inclined accretion disc.** Built, then three defects fixed in order: (1) solid slab →
  particles (small tight sprites, §34.2); (2) invisible rotation → measurable Ω via discrete clumps; (3) top
  overflow → shrink `DISC_ROUT` 3.2→2.7.
- **Step 8 — granular clumps** (§34.3): the clumps were themselves solid beads; fixed by sprite footprint, not
  brightness.
- **Steps 9–11 — the orientation defect** (§34.4): the disc's tilt drifted over time, so its interior swung
  between granular and slab. **Adopted: a frozen 43° disc** (§34.5). This is the shipped form.

## 34.2 Disc geometry
Keplerian differential orbit advanced **shader-side** as a target override: `θ = θ0 + uTime·ω(r)`,
`ω(r) = DISC_W0·(DISC_RIN/r)^1.5` (`DISC_W0 0.20`), density falling outward `r = RIN+(ROUT−RIN)·h^PWR`
(`PWR 1.7`), central void inside `DISC_RIN 0.9`, `DISC_ROUT 2.7`, thin in z (`DISC_THICK 0.18`), tilted by
`DISC_INC` about its own axis, centred on the fixed world point `(0, 1.5, 0)` (**on the Y axis → spin-invariant
in position**, only its orientation is affected by the global spin — see §34.4). Gated to stage 7
(`driftW7`) **and** `uDiscOn` (mobile off, §30.7 belt-and-suspenders: uniform gate + attribute brightness 0 in
`make()`). Attribute-free from `aSeed` hashes; `dhash` in the shader mirrors `dhashJS` in `make()`; clump
centres baked via `clumpAt`.

## 34.3 Granular clumps — a sprite-footprint problem, not brightness (Step 8)
The clumps read as **solid saturated beads** (interior litFrac 98.6 / spread 0.31 = slab). The lever was NOT
particle count (dropping `DISC_CLUMPFRAC` 0.40→0.14 left the interior ~100% filled) and NOT brightness. **A
clump is denser than the body, so at the body's sprite footprint its grains overlap into a smooth fill.** Fixed
the way the body slab was fixed — a **smaller sprite for clump grains** (`DISC_CLUMPSZK 0.50`, ~3 px vs the
body's 6), so black shows between grains at high density. Also switched the clump r/θ jitter from
centre-weighted (sum-of-two, which piles grains at one point) to **box/uniform** (`dhash·2−1`), which does not
pile and gives each clump a spread of radii so differential rotation **shears it into an arc**. Params:
`DISC_CLUMPFRAC 0.42`, `DISC_CLUMPR 0.55`, `DISC_CLUMPT 0.30`, 8 clumps, sizes varied 0.55–1.75, random θ.
Result at the time (**phase-specific — see §34.6**): body granular, whole-disc spread back on the stage-0
benchmark.

## 34.4 The orientation defect and its fix (Step 11) — first-class
**Defect.** The user opened the live page and the disc interior looked markedly denser — near the Step-7 slab —
than in the Step-8 stills. Cause, confirmed from the code: the shared global spin
`points.rotation.y = rot[1] + clock·(0.02 + 0.055·cosW)` (**line 779**); at stage 7 `cosW = 1−min(1,|sfEased|) =
0`, so the disc spins about world-Y at **0.02 rad/s → 314 s period**. Spinning a **tilted** disc about Y holds
the normal's polar angle but sweeps its **azimuth**, so the angle to the camera oscillates **face-on↔edge-on**,
and the edge-on phases compress the grains along the view axis into a dense slab — **the same mechanism as the
§32 stage-6 corrugation defect.**
- **Empirical confirmation:** forcing `rotation.y` toward edge-on drove the interior to **litFrac 100 / spread 0
  — a solid slab.**
**Fix.** Ease `rotation.x`/`rotation.y` to a fixed, deterministic **0 / 0** via
`discFreeze = smooth(6.3, 6.8, sfEased)`, gated to stage 7, mirrored in `renderOnce()`. The disc then sits at a
constant tilt = `DISC_INC`; particles still ORBIT (shader θ advance, `uTime` untouched). **Only the orientation
is frozen, not the motion within it.**
- **Stages 0–6 untouched — by measurement, not assertion:** the gate is 0 for `sfEased ≤ 6.3` (stage 6 rests at
  6.0); at **stage 3, `rotation.y` still advances 0.2969 → 0.3237 (Δ0.0268)** — spin fully intact; at the disc
  rest, `rotation.y = 0.0000` and is still **0.0000 after 9 s (Δ0)** — frozen.

## 34.5 The inclination sweep — 43° chosen over 58°
Swept `DISC_INC` at the frozen tilt, real rest (sf 6.924), 1440-wide, field-only:

| INC | rim lit / spread | body lit / spread | whole spread | void | MSG min |
|-----|------------------|-------------------|--------------|------|---------|
| 0.55 (32°) | 74.1 / 1.88 | 12.0 / 5.96 | 4.02 | 0.011 | 7.09 |
| **0.75 (43°) ADOPTED** | **76.5 / 1.54** | **13.5 / 6.67** | **4.13** | **0.010** | **12.83** |
| 0.95 (54°) | 87.0 / 1.03 | 15.7 / 8.76 | 4.37 | 0.010 | 18.55 |
| 1.15 (66°) | 94.5 / 0.59 | 18.3 / 13.8 | 5.52 | 0.023 | 18.47 |
| 1.35 (77°) | 100 / 0.12 | 20.0 / 34.4 | 7.78 | **0.193** | 18.47 |

Ω is identical across rows (the orbital law is viewing-independent). **Chose 0.75 (43°) over the earlier 1.02
(58°):** more granular rim (spread 1.54 vs 1.03), body 13.5/6.67 near stage-0's 12.6/4.43, a clean round void,
comfortable message contrast, and **still reads as an inclined disc** rather than a flat ring (0.55 is too
face-on; MSG also drops to 7.09 there). **Trade, in the user's terms:** gave up the steeper disc's dramatic tilt
for a more granular interior and a clearer void — the two things asked for — and a more open disc shows the
circulation better, not worse. 1.35 rejected: void closing to 0.193, rim → slab (100 / 0.12).
- **Interaction confirmed, not assumed:** freezing did most of the work (a favourable fixed angle never
  compresses), but 0.95 frozen would have been dense *all the time*, so the lower angle was chosen deliberately.

## 34.6 Phase-dependence correction — Step-7/8 numbers superseded
Step-7 and Step-8 measurements were taken **without the freeze**, at whatever `clock` phase the harness paused
on, so they described **one phase of the oscillation**, not the motif. Specifically the **Step-8 clump figure
87.2 / 1.02 is superseded by the stable 76.5 / 1.54** (43°, frozen); the honest whole-disc spread is 4.13
(stage-0 4.43), body 13.5 / 6.67.
- **General lesson (attached):** on a motif whose orientation drifts, a **single-phase measurement is not a
  description of the motif** — it is a sample of an oscillation. This is the **same class of error as §32's
  "judge motion from frame sequences, not stills."** The methodological fix is the one already in §26.3, extended:
  settle, confirm sceneF, **and confirm the motif is not mid-oscillation** before reading; on a rotating form,
  measure a range across phase, not a point.

## 34.7 Stability evidence — the thing the user actually asked for
Interior litFrac across a **full inner orbital period** (~31 s, 8 frames) at the frozen tilt:
**[92.7, 93.4, 83.8, 80.6, 79.5, 78.3, 81.3, 84.6], range 15.1, never reaching the edge-on slab (100 / 0).**
The old behaviour swung ~4 → 36 and, forced edge-on, hit 100 / 0. The residual 15-point variation is **the
density arcs orbiting through the brightest window — i.e. the rotation, not instability**; the disc outline,
tilt, and void stay fixed. The **stability contact sheet** (one fixed inclined disc + fixed void across a full
period, only the arcs moving) is what decided adoption — visible in the picture, not only the numbers.
Ω (face-on, freeze on, in[82,128] out[131,146], dt 2): **wIn −0.1309, wOut −0.0873 → Ω 1.5** (Kepler 1.51) —
differential, inner faster, intact.

## 34.8 The landing discrepancy — record BOTH, and why (a future round WILL hit this)
The disc rest was measured at **two different scrollY on two viewports for the same sceneF phase**:
- User's laptop: **scrollY 4597 / sceneF 6.911**; `snapRest(7)` there = 4643.
- This session, 1440×900: **scrollY 5195 / sceneF 6.914**; `snapRest(7)` there = 5241.
**The invariant is the sceneF phase (~6.91); the scrollY is viewport-height dependent.** Crucially,
**`snapRest(7)` is a computed ideal the browser does NOT honour at this stage** — the native CSS scroll-snap
holds the rest **~46–68 px short** of it while the page still has room below (max scroll exceeds the rest). So a
scroll *target* of `snapRest(7)` lands short, at sceneF ~6.91 (disc **91 %** morphed, `driftW7 0.911`), **not**
7.0. **Measurements must confirm sceneF, never trust the scroll target** (§26.3). Landing via
`scrollTo(snapRest(7))` and letting snap settle reproduces the real rest on any viewport; record the actual
scrollY + sfNow each time.

## 34.9 Frame time — MEASURED pre-freeze; re-measure judged unnecessary (reasoning, marked as such)
Measured on the **pre-freeze** build (laptop browser, hardware GL, 200k, sceneF 6.911, GPU-timer path):
- **Run 1:** ~30 samples, **4.1–7.3 ms**, sustained 60 fps except a **single 45 fps reading that did not
  reproduce.**
- **Run 2:** ~25 samples, **5.0–6.2 ms**, sustained 60 fps.
- No fps-min field → these are **SUSTAINED fps, not a true minimum** (same instrument caveat as §33.10).
- **NOT re-taken after the tilt freeze.**
- **Reasoning (explicitly reasoning, not a measurement):** freezing orientation adds **no per-frame work** and
  **removes the edge-on compressed phase** (the heaviest additive-overdraw configuration), so the worst case
  should if anything be **lighter**; the pre-freeze 4.1–7.3 range spanned tilt phases including near-edge-on that
  the frozen 43° no longer visits. **Concur with not re-measuring** — but record that **stage 7 is the heaviest
  motif on the page and is the first probe target** if any frame-time concern arises.
- **Comparison, honestly:** heavier than **stage 5 (3.2–4.5)** and **stage 6 (3.8–4.7)** measured on the same
  machine this week; heavier than **drift's 4.40 / 4.60** from Round 30's probe run — but that drift figure is a
  **different session, a reference point, not a controlled A/B.**

## 34.10 Constraint ledger (Round-34, frozen 43°)
- **Contrast (decomposed, scrim hidden, 16 orbital-phase frames per block):** wide MSG 11.95 · NAV 18.43 · FOOT
  18.83; tall MSG 7.72 · NAV 19.62 · FOOT 17.41. **Nothing below 5.5 on any block, either aspect (0/16 each).**
- **Void:** rest 0.010, page-bottom 0.011 (gate <0.3); no bottom sliver (offBottom {0,0,0,0}).
- **Offscreen per edge:** wide {T:0.1,B:0,L:0,R:0}, tall {R:0.1} — negligible. **clipPct 7.05 % (2654 / 37639 lit
  px).**
- **Mobile:** `uDiscOn = 0`, field-only litPct 2.07 (stage-6 waveform bleed at the blended mobile landing, NOT
  the disc — disc gated off; §30.7 verified by measurement).
- **Slots 12/16** (6 `setAttribute`); the whole Round-34 disc + freeze is **shader/render-loop side, no new
  attribute**. `css/style.css`, HTML, copy all unchanged; scrollHeight Δ0.

## 34.11 State (Round-34, working tree — NOT committed/pushed)
Stage 7 = **frozen 43° Keplerian accretion disc** around an invisible centre at `(0,1.5,0)`: granular body +
box-jitter granular clumps (smaller clump sprite, §34.3), differential rotation (Ω 1.5) with the **orientation
frozen** (`discFreeze`, §34.4). `DISC_INC 0.75`, `DISC_ROUT 2.7`, `DISC_CLUMPFRAC 0.42`, `DISC_CLUMPR 0.55`,
`DISC_CLUMPT 0.30`, `DISC_CLUMPSZK 0.50`. Retired Round-34 prototypes kept as **inert dead code**: `case
'gascloud':` (Steps 1–4 gas) and `case 'driftcurrent':` (the pre-gas drift current), matching the
orbits/convergence/sea/radialemitter pattern. **Only `js/scroll-scenes.js` changed** — confirmed by
`git status --short` (css/style.css untouched); `SURVEY_*` untracked (the user's, never staged). Stills NOT
regenerated. **Open items:** (a) stage-7 stills for the frozen disc (wide/tall rest + bottom exist in scratch,
not promoted to `assets/`); (b) frame time not re-taken post-freeze (§34.9 — judged unnecessary); (c) the
Round-33 open items (§33.12) still stand.

---

# §35 — Removing the Archive Sphere and the Peskin notes (IMPLEMENTED)

The 3D knowledge map (`02 — THE KNOWLEDGE MAP / Archive Sphere`) and the five Peskin QFT pages
were **deleted**, not deprecated. The map had been parked "to be rebuilt" since §11b and never
was; its only data was the Peskin set, so the two go together. The 教材 styling stays and is
**generalized**, because the physics-maths articles that replace these pages will use it.

## 35.1 Deleted
| Path | Why it could go |
|---|---|
| `html/peskin-qft.html`, `html/peskin-qft_sec2-1…4.html` | The pages themselves. |
| `js/knowledge-graph.js` (1002 lines) | Loaded by `study.html` only; every node in its data was a Peskin page or PDF. |
| `pdf/PeskinQFT_Sec2-1…4.pdf` (dir now gone) | Referenced only by the deleted pages and the graph. |
| `css/style.css` — `.knowledge-map`, `#graph-container`, `.control-panel`, `.control-toggle-button`, `.control-button`, `.control-item` | Grep-verified: used by `study.html` alone. |
| `html/study.html` — the Three.js `<script>` in `<head>` | Existed only to drive the graph. **index.html is unaffected**: it gets Three.js from `scroll-scenes.js`'s own `loadThree()` (§11b). |

## 35.2 Kept deliberately
- **`body.is-article` in both halves** — the `filter: blur(1.2px); opacity:.6` rule in
  `css/style.css` and the `COLUMN_*` column masking in `js/starfield.js` (§D). Untouched.
- **`.accordion-*`**, **`.pdf-actions` / `.pdf-frame`** — the 教材 components.
- **The generic `input[type=checkbox] / [type=range]` teal accent** — it was never panel-scoped.
- **`docs/stills/interior-study*.png`** — historical baselines. They now show a page that no
  longer exists; re-shoot before using them as a regression reference.
- **§11b's rebuild notes** — kept as lessons (label sizing, the `const` reassignment bug), now
  explicitly marked as notes rather than a description of the tree.

## 35.3 The 教材 styles are now keyed to `body.is-article`, not to page names
The rhythm rules hung off `.peskin-qft-sec2-1…4` / `.qft-summary` — selectors that would have
outlived the pages they were named for. They now read:

```css
body.is-article main > section:not(.rail)                        /* 900px body column + nav clearance */
body.is-article main > section:not(.rail) ~ section:not(.rail)   /* 2つ目以降は clearance を払わない */
body.is-article main h1 / p / h2 / ul / hr                       /* rhythm, rule */
body.is-article main a:not(.btn)                                 /* link colour — .btn は除外 */
```

A new article opts in with `<body class="is-article">` — the **same** signal `starfield.js`
already reads, so the sky treatment and the text column can never disagree about what a
reading page is. `.study-path` (study.html's accordion section, **not** an article) keeps its
own identical 900px box; it is not folded in, because study.html is not `is-article`.

**Three hardenings over a plain `main > section` rule**, two of them found by measuring a
mock 2-column lesson page (`main` as a grid, a `.rail` + two body sections) rather than by
reasoning:
- **`:not(.rail)`** — a rail placed as a `main`-level element is never squeezed into the 900px
  column. `main` owns the grid/flex; this rule only *caps* the body column, it never forces
  900px: measured in the mock, the body section shrank to its grid track and `scrollWidth`
  never exceeded the viewport.
- **`~` instead of `:first-of-type` for the nav clearance.** The first attempt was
  `section:not(.rail):first-of-type`. **Measured: it matched nothing** when the rail was itself
  a `<section class="rail">` — the rail took `:first-of-type`, so *no* section paid the
  clearance and the body started under the floating nav (`padding-top: 64px`, should be 168px).
  The shipped form asks "is there a body section before me?" (`section:not(.rail) ~
  section:not(.rail)` → small padding) which is independent of where the rail sits. Re-measured:
  rail `padding-top: 0`, first body section `168px`, second `64px`.
- **`a:not(.btn)` for the link colour.** The old `.qft-summary a { color: var(--accent) }` was
  page-scoped; generalized to `body.is-article main a` it **out-specified `.btn`** (0,1,3 vs
  0,1,0) and repainted the 「PDFを開く ↗」/「ダウンロード」 pills accent-blue. Caught by diffing
  computed styles against the pre-deletion build; excluded rather than reverted.

**Known sharp edge:** `body.is-article main h2` is a *small uppercase label* tier (0.72rem),
inherited verbatim from the section notes. A lesson page that wants display-sized section
headings must use `h1` for the title and give its own headings a class, the way
`.study-path h2` opts out. Flagged here so it is a choice, not a surprise.

**Class-name collision check (`css/style.css`, grep):** `.rail`, `.box`, `.drill`, `.attempt`,
`.step`, `.fig`, `.mod-h`, `.prompt`, `.site-footer` — **0 occurrences each**. The lesson pages
also ship their own `<style>` on `--ink` / `--line` tokens (with `css/lesson-theme.css` layered
after for the light theme), whereas `style.css` is on `--text-primary` / `--hairline`; the two
systems do not currently meet. **If a lesson page ever loads `style.css` as well, re-run that
collision check first** — the global `h1/h2/p` rules in §3 would apply to it too.

## 35.4 Star masking after the change — unchanged today, one conditional gap
`starfield.js` measures `main > section` with `getBoundingClientRect()` on every paint, so it
follows whatever the CSS actually produces. The peskin column was 900px via a page class and is
900px via `body.is-article` — **measured identical: left 270, right 1170, w 900, and the same
`blur(1.2px) / opacity .6` canvas treatment**. Nothing about the masking changed.
- **It depends on the rail's tag, not on the CSS.** Measured on the mock: a rail written as
  `<section class="rail">` **is** picked up by `columns()` and thinned like any other column
  (bands `-24–284` for the rail, `629–1103` for the body). A rail written as `<aside>` or
  `<nav>` is **not** a `main > section`, so the stars behind the TOC would stay full-density
  under the blur. On a near-opaque rail (`--rail-bg`) that is invisible either way; on a
  transparent one it will show.
- **The one-line fix, if that page uses a non-`section` rail:** widen the selector in
  `columns()` to `main > section, main > .rail`. **Not done here** — no such page exists yet.

## 35.5 Verification
- **Link integrity:** every `href`/`src` on the 6 remaining pages resolves to a file on disk
  (or an external CDN) — see the run in this round's report. No reference to `peskin-qft*`,
  `PeskinQFT_*.pdf`, or `knowledge-graph.js` survives anywhere in the tree.
- **JS:** `node --check` clean on all five remaining scripts. `study.html` no longer references
  `THREE`, `#graph-container`, or any `control*` id, so there is nothing left to throw.
- **Layout (screenshotted, 1440×900 and 390×844):** study.html is a single
  `01 — 勉強の軌跡` section, `w 900 / left 270`, `scrollHeight 994`. `.study-path`'s own
  `padding-bottom: var(--space-8)` closes the page and the footer's own top hairline follows —
  **no orphaned divider, no double gap** (there was never a `<hr>` between the two sections).
  The accordion still opens/closes all three blocks (`行間埋めノート` now lists Quantum Field
  Theory / General Relativity / Cosmology as plain text), 0 console errors.
- **Parity with the deleted pages:** a `body.is-article` page built from the old sec2-1 markup
  was diffed against that page as served from a `HEAD` worktree. Section box, h1, h2, p, ul, a
  and the star-field treatment are **byte-identical computed values**. One intended difference:
  `<hr>` was the *browser default* on the sec2 pages (2px inset grey, margin 0) because only
  `.qft-summary hr` had ever been styled; it is now the designed hairline (`1px --hairline`,
  `var(--space-4)` margins) on every article page — the reason `scrollHeight` moves 1987 → 2018.

## 35.6 Not updated on purpose
The round logs (§13 onward) and the measurement tables — e.g. §20.1's "all 11 pages",
§31's per-page console table listing `peskin-qft*` — are **historical records of runs that
happened**. They are left as written; rewriting them would falsify the log. Only the living
spec sections (§3, §5.5, §8, §11, §11b, §D) were updated.

---

# §36 — 教材ページの取り込み（1-1 微分の基礎）と study.html の分野別目次（IMPLEMENTED）

単体で完結していた教材 HTML（`物理数学I 1章 微分 / 1-1 微分の基礎`）を、サイト本体の共通基盤の上に
載せ替えた。**新規** `html/phys-math_1-1.html`（1,300 行 / 148KB、SVG 図版 9 点、数式 773、演習 25 組）。
併せて study.html を**分野別目次**に作り替え、§35 で空になった「行間埋めノート」を外した。

## 36.1 命名規則（今後の教材すべてに適用）

```
<科目スラッグ>_<章>-<節>.html      例: phys-math_1-1.html, phys-math_2-1.html, em_1-1.html
```
科目スラッグ：`phys-math` / `mechanics` / `analytical-mechanics` / `em` / `thermo` / `stat-mech` /
`qm` / `sr` / `qft` / `gr` / `cosmology`。削除した `peskin-qft_sec2-1.html`（`<主題>_<節>`）と同じ骨格。

**サブディレクトリは使えない。** `layout.js` のナビは `index.html` 等の相対リンクで、1 階層深い
ページからは全リンクが 404 になり、`../css` も破綻する。`html/` 直下フラットが前提。

## 36.2 `<style>` の三分割 — 何を共通に寄せ、何を残したか

読み込み順は **`style.css` → 記事の `<style>` → `lesson-theme.css`**（テーマ上書きが最後。
`lesson-theme.css` 冒頭の注記どおり）。

| 行き先 | 対象 |
|---|---|
| **削除（共通側が持つ）** | リセット、`body`、`body::before`、`#starfield`、`a`、`:focus-visible`、ヘッダー/フッター一式（`.site-header` `.logo` `.nav-menu` `.pill-btn` `.site-footer` `.footer-*`）、`.eyebrow` の本体、星空の IIFE |
| **`lesson-theme.css` へ** | ライト/ダークのトークン、`.theme-btn`、`@media print` のテーマ部分 |
| **記事に残す** | `.wrap` `.rail` `.main` `.toc` `.progress-*` `.sec-head` `.box`（4種）`.mini-table` `.fig` `.attempt` `.hint` `.sol` `.step` `.transfer` `.drill` `.foot` `.menu-btn` `.scrim` と、教育用トークン（`--amber` `--good` `--key` `--teach` とその tint、`--mono` `--rail-w` `--surface-2` `--line-soft`） |

**値が完全一致していて共通側に寄せられたトークン**：`--bg` `--surface` `--nav-bg` `--glow-cool`
`--font`(=`--font-body`) `--nav-clear`(=`--nav-clearance` 92px) `--ease` `--radius-lg/md`、および
`--ink`=`--text-primary`(#fff) `--line`=`--hairline`(.14) `--line-strong`=`--hairline-strong`(.24)。

**寄せなかったトークンと、その理由（測定値）。** 黒地に白を合成したコントラスト比：

| | 記事 | 本体 | 判定 |
|---|---|---|---|
| `--ink-soft` / `--text-secondary` | .68 → **9.36:1** | .62 → 7.84:1 | どちらも AA。本文 15.5px の長文なので記事側を維持 |
| **`--ink-faint` / `--text-tertiary`** | **.46 → 4.56:1** | **.40 → 3.66:1** | **寄せると AA 割れ**。`.step .why` と解答の 13.5px 補足は教材の中身なので**独立維持** |

`.eyebrow` も同じ理由で色と余白だけ上書きしている（共通の `--text-tertiary` では 11px で 3.66:1）。
本体側のこの値は既存ギャップとして §20.3 に登録した。

## 36.3 アクセント色の一本化 — ダークは本体値、ライトは色相を保った暗い青

記事は `--accent:#4d94ff`、`--blue:#3d8bff` を持ち、後者は本体 `style.css` の `--accent` と同値だった。
**ダークは本体の `#3d8bff` を継承**（記事の定義を削除）。その結果 `--blue` は `--accent` と完全に同じ色に
なったので**削除**し、残っていた 2 用途（`:focus-visible` の輪郭、進捗バーのグラデーション始点）を
`var(--accent)` に置換した。

**ライトは別の値が要る**：本体の `#3d8bff` は白地で **3.31:1** しか出ず本文リンクとして不合格。色相を
保ったまま暗くした **`#1558d6`（色相 219°、本体 216°、白地 6.18:1 / 地 5.77:1）** を採用。派生も青へ：
`--accent-deep #103f9e`（9.43:1）、`--accent-tint rgba(21,88,214,.09)`、`--glow-cool rgba(21,88,214,.18)`、
`--on-accent` はダーク `#001227`（`#3d8bff` 上で 5.68:1）。

## 36.4 ライト時に共有ヘッダーが読めなくなる問題 — エイリアス方式で解決

`style.css` はダーク専用（`data-theme` / `prefers-color-scheme` の実装ゼロ）。共有ヘッダー・フッター・
ボタンが読むトークンのうち、`--text-primary` `--text-secondary` `--text-tertiary` `--hairline`
`--hairline-strong` `--glow-warm` は `lesson-theme.css` のライト側に無く、**`--nav-bg` だけ明るくなって
ロゴとナビ文字が白のまま＝実質不可視**になっていた。

対処：**ライト値を「本体のトークン名」で宣言し、教材の `--ink` / `--line` 系はそこへのエイリアスにする。**
真実の在処が 1 テーマ 1 箇所になり、共有ヘッダーと記事本文が同じ色を見ることが構造的に保証される。
ライト値：`--text-primary #14161f`(18.04:1) / `--text-secondary rgba(20,22,31,.74)`(7.69:1) /
`--text-tertiary rgba(20,22,31,.60)`(**4.62:1**。既存の `.52` は 3.63:1 で AA 割れだったので引き上げ)。

## 36.5 実装中に見つかった衝突と不具合 6 件（すべて測定で発見、推測ではない）

| # | 症状 | 原因 | 対処 |
|---|---|---|---|
| A | 記事タイトルが**画面中央固定の巨大な白いピル**になり本文が柱状に潰れた | `style.css` が**裸の `header`** を浮遊ナビ（`position:fixed`/flex/`border-radius:999px`/`backdrop-filter`）として定義。記事の `<header class="lesson-hero">` が丸ごと浴びた | `<div class="lesson-hero">` に変更 |
| B | 本文列が 760px にならず 838px、上余白 56→160px | §35 の `body.is-article main > section:not(.rail)`（**0,2,3**）が記事の `.main > section`（0,2,2）に勝っていた | 記事側を `.main` 経由で **0,3,2 / 0,4,3** に |
| C | 目次のアクティブ表示が約 90px ずれる | `style.css` の `main{position:relative}` で `<main>` が offsetParent になり `offsetTop` が文書基準でなくなる | `getBoundingClientRect().top` 基準へ |
| D | テーマ切替ボタンがヘッダーに入らず左下に浮く | **`layout.js` も注入を DOMContentLoaded で行う**ため、`<head>` から先にリスナー登録した `theme.js` の `mount()` が先に走る | `inject()` 末尾で `window.__agMountThemeBtn()` を呼ぶ明示フック。`mount()` は冪等化 |
| E | §06 の \(0<a<1\) が数式にならず生テキストで表示 | `<a` を HTML パーサがアンカー開始と解釈。**元の教材 HTML から引き継いだ不具合** | `&lt;` にエスケープ |
| F | 目次の章と節が同じ字下げで階層が読めない | §2 のリセット `*{padding:0}` が `ul` の既定字下げを消していた | `.accordion-content ul ul{padding-left:var(--space-3)}`（新クラスなし） |

**A から引ける一般則**：`style.css` は**裸の要素セレクタ**（`header` `footer` `main` `section` `p` `h1`–`h4`
`a` `img`）を持つ。教材ページを載せるときは、まずこの一覧と記事側の要素の突き合わせを行うこと。
`header` と `footer` は**サイトのクロム専用**であり、記事の構造には使えない。

**B から引ける一般則**：**共通の記事ルールは「自前レイアウトを持たないページ」向けの既定値である。**
レールや独自の measure を持つページは、`body.is-article` を含む**同等以上の詳細度**で自分の値を宣言して
上書きする（今回は `.main` を噛ませた）。共通側を緩めて特例に合わせない。

**E から引ける一般則**：数式中の `<` は、**直後が英字のときだけ** HTML タグ開始として解釈される
（`0<a` は危険、`0<\theta` や `h<0` は安全）。全数走査したところ、記事内の生の `<` は 9 箇所あるが
危険なのは 1 箇所だけだった。教材を追加するたび `<`+英字 の走査を行うこと。

## 36.6 検証（すべて headless Chrome で実測）

- **数式**：MathJax tex-svg、コンテナ **773**（ディスプレイ 82）、`mjx-merror` **0**、未処理の生 TeX **0**。
  設定ブロックはローダーより前、フォールバックは createElement 方式（§11b 準拠）。
- **図版**：SVG **9 点**すべて描画（幅 656px、`text` 要素 129）。
- **演習**：ヒントは 1 つずつ開き「次のヒント (1/2)」→「ヒントは以上」+ `disabled`、「ヒントを隠す」で
  復帰。解答は開閉のたびにラベルが入れ替わり、開いた時だけ `typesetPromise([sol])` が走る。
- **レイアウト**：レール 250px sticky、導入部と全 10 セクションが **w760 / left465**、横スクロールなし。
- **目次追従**：`先頭→01` `#d2→03` `#d5→06` `#d7→08` `#howto→10`、最下部で進捗バー **100%**。
- **モバイル 390px**：横スクロールなし、本文列 350px、目次ボタン→レールが `left:0` に、スクリムで復帰。
- **印刷**：ヘッダー・レール・星・フッター・目次ボタンが `none`、**ヒントと解答は `block`**、白地に黒。
- **FOUC なし（実測）**：`data-theme` が付くのは **12.2ms**、first-paint は **440ms**。約 428ms 先行。
- **コントラスト**：ダーク／ライトとも全項目 AA 以上。唯一の例外はダーク時の `.footer-col-label` 3.66:1 で、
  これは本体共通の既存値（§20.3）。
- **星の間引き**：`columns()` を `main > section, .rail` に拡張。**`main > .rail` では一致しない** —
  教材のレールは `<main>` の子ではなく**兄弟**（`.wrap > nav.rail + main.main`）。帯ごとの密度は
  左余白 0.0282 / レール 0.0005 / 本文列 0.0036 / 右余白 0.0244。レールが本文列よりさらに空なのは
  設計ではなく**偶然**（250px の帯に残る星の期待値が 7 個程度しかないため）。実害がないので触らない。

## 36.7 study.html — 分野別目次（統合案 A）

**用語対応**：分野 = 基礎領域 / 専門領域（従来のアコーディオンをそのまま使う）、科目 = 物理数学・
古典力学…、章、節。従来の 3 ブロックを 1 つの目次に育てる形で、物理数学が 1 箇所にしか出ない。

- **記事がある科目だけ**入れ子アコーディオンにし、無い科目は平文のまま。**開けるかどうかで中身の
  有無が分かる**ので「準備中」のような新しいラベルを足さない。
- **章は平文**。章が 1 つのうちに折りたたむとリンクまで 3 クリックかかる。`<button class="accordion-toggle">`
  に差し替えるだけで折りたためる（JS は入れ子対応済み）。
- **新しい CSS クラスは追加していない**。階層は `.accordion-*` と `<ul>` の字下げだけで出す
  （科目 366 → 章 414 → 節 438、モバイルで 44 → 92 → 116）。
- 「行間埋めノート」は §35 で中身が空になったため**ブロックごと外し、HTML にコメントで残した**。
  教科書ベースのノート（分野別目次とは別の軸）を再開するときに戻す。
- **アクセシビリティ**：全トグルに `aria-expanded` と `aria-controls` を付け、JS が開閉と同期させる。
  実測：Enter / Space で開閉し `aria-expanded` が追従、Tab は「閉じている中身を飛ばす」正しい順序
  （基礎領域 →(開くと) 物理数学 → 専門領域 → ナビ）、節リンクで Enter すると記事へ遷移。
  フォーカスリングは 2px `--accent`。
- **往復**：study.html → `phys-math_1-1.html` → ナビの「勉強の軌跡」→ study.html を確認。記事側は
  `data-page="study"` でナビがアクティブになるため、記事専用の戻るリンク（`.back-link`）は廃止した。

## 36.8 Stills

撮り直し：`interior-study.png`（目次を開いた状態）、`interior-study-mobile.png`。
新規：`interior-lesson.png` / `-light.png` / `-mobile.png` / `-solution.png`（ヒント2つ+解答を開いた状態）
/ `-figure.png`（§02 割線の図）。削除：`interior-study-graph.png`・`interior-pdf-fallback.png`・
`interior-section.png`（いずれも §35 で消えたページの記録）。

## 36.9 State（working tree — NOT committed/pushed）
新規 `html/phys-math_1-1.html`。更新 `css/style.css`（記事の見出し階層＋入れ子リストの字下げ）、
`css/lesson-theme.css`、`js/theme.js`、`js/layout.js`、`js/starfield.js`、`html/study.html`、
`html/*.html` のキャッシュバスター `r49→r50`。**未着手**：なし。**push していない**。

---

# §37 — 勉強の軌跡を分野階層に（IMPLEMENTED）

study.html を「物理学の科目一覧」から**分野一覧**に作り替え、分野ページを 1 枚置いた。
`study.html（分野一覧）→ study_physics.html（分野）→ phys-math_1-1.html（記事）` の 3 階層。

## 37.1 なぜ 3 階層か（科目ページを作らない）

| 時期 | 記事数 | 4階層のナビ用ページ数 | 3階層 |
|---|---|---|---|
| 当面（物理数学 10 本） | 10 | **8**（study + 分野6 + 科目1） | **2** |
| 物理学が一通り揃った頃 | 〜220 | 18 | 7 |

4 階層は当面**ナビ用ページが記事とほぼ同数**になる。どれも手で維持する HTML なので、
読者の利益（1 クリック減る）より作者のコストが勝つ。

**昇格ルール（将来）**：1 科目が **20〜30 節**を超えたら、**その科目だけ** `phys-math.html`
に昇格させ、分野ページからはリンクに差し替える。科目単位の段階移行で、**記事の URL は
変わらない**。科目トップの命名は §36.1 で予約済み。

**分野ページでは 基礎領域／専門領域を畳まない。** 分野専用のページで科目一覧を隠す理由が
なく、記事到達が「分野クリック → 科目を開く → 節クリック」の 3 操作で済む。アコーディオンに
するのは科目レベルだけ。

## 37.2 命名とディレクトリ

`_` が「〜に属する」、`-` は語の区切り（`peskin-qft_sec2-1.html` からの一貫した慣習）。

| 階層 | ファイル名 |
|---|---|
| 分野一覧 | `study.html` |
| 分野 | `study_physics.html` / `study_mathematics.html` / `study_chem.html` / `study_bio.html` / `study_history.html` / `study_skills.html` |
| 科目（昇格時のみ） | `phys-math.html` |
| 節 | `phys-math_1-1.html` |

**数学は `study_math` ではなく `study_mathematics`** にした。`phys-math`（物理数学）と紛れるため。

### サブディレクトリ — 見送り（移行条件とレシピ）

**移行する条件**：`html/` が **50 ファイルを超えた**とき、または**分野ごとに画像フォルダ**が
必要になったとき。現状 8 ファイル、物理学が揃っても 30 程度なのでフラットで読める。

**そのときのレシピ**（ルート相対は使えない。本番は `/RDTP-project/Academic-Gate_hp/` 配下、
ローカルは `/Academic-Gate_hp/` 配下と基準が違うため、深さから `../` を組み立てる）：

```js
// js/layout.js — NAV_ITEMS とフッターの href に前置する
var depth = (location.pathname.split('/html/')[1] || '').split('/').length - 1;
var up = new Array(depth + 1).join('../');   // 深さ1なら '../'
```

**本当のコストは layout.js ではなく**、各ページ自身の `../css/style.css` が階層ごとに変わること、
stills とドキュメントの参照、`?v=` の扱いが全部「深さ依存」になること。作業自体は機械的
（`git mv` ＋ パスの一括置換 ＋ 上記）。

## 37.3 能力開発の置き方

学問分野と**同じページの、番号付きの別セクション**に置く（`02 — Fields` / `03 — Training`）。
全ページが使っている eyebrow の連番（§3）でそのまま区切れるので、新しい装飾はゼロ。
能力開発だけ基礎／専門の区分を持たない（訓練法の平坦なリストになる）ため、同じ一覧に
混ぜると内部構造の違いが表に出る。別ページに切り出すと勉強の軌跡から隠れる。

## 37.4 中身がないものの見せ方（§36.7 の規則を一段上へ）

**中身があるものだけリンク。無いものは平文。「準備中」ラベルは付けない。**
- study.html：物理学のみリンク。数学・化学・生物学・歴史学・記憶術は平文
- **空の分野ページは作らない**（リンクされない・中身のないページは死んだ URL になる）
- **リンクの無効化（`disabled`・グレーアウト）は使わない。** 押せそうで押せない要素は支援技術に
  とっても不親切で、平文のほうが状態を正しく表す。実測：アクセシビリティツリー上で
  `role=link` を持つのは物理学だけ、他は link でも button でもない。

## 37.5 パンくず — 既存の `.eyebrow` をリンク化する

階層が 3 段になるとヘッダーのナビは**最上位にしか戻れない**ので、中間層への導線が要る。
**新しいコンポーネントは足していない。**

| ページ | eyebrow の中身 |
|---|---|
| study.html（最上位） | `01 — Study`（パンくず不要） |
| study_physics.html | `勉強の軌跡 ／ 物理学`（前者がリンク） |
| phys-math_1-1.html | `勉強の軌跡 ／ 物理学 ／ 物理数学 I ／ 1章 微分 ／ SECTION 1-1`（前 3 つがリンク） |

マークアップは `<p class="eyebrow">` → **`<nav class="eyebrow" aria-label="パンくず">`**。
`.eyebrow` のスタイルがそのまま効くので追加の見た目はない。

**記事からの戻り導線**：パンくずに加えて、レールの `.brand`「物理数学I　1章 微分」も
`study_physics.html#phys-math` へリンクした。§36 で廃止した `.back-link` は復活させていない
（パンくずが上位互換で、ヘッダーの枠も消費しない）。

## 37.6 `js/accordion.js` の切り出しとハッシュ展開

study.html にインラインで書いていた開閉処理（`aria-expanded` 同期を含む）を切り出した。
分野ページが増えるたびに複製するのは装飾ではなく仕組みの重複だから。現時点で読み込むのは
`study_physics.html` だけだが、分野が増えるほど効く。

**ハッシュ展開**：URL のハッシュが閉じたアコーディオンの中身を指しているとき、祖先も含めて
開いてからスクロールする。これが無いと、記事から `#phys-math` に戻ったときに
**「科目が閉じていて何も見えない」ページに着地する**。実測：`study_physics.html#phys-math`
で `aria-expanded=true` / 節リンクが可視。

## 37.7 CSS に足した 5 つの小さな規則（新しい見た目は足していない）

| 規則 | なぜ必要か |
|---|---|
| `.eyebrow a { color: var(--accent) }` + `:hover` | グローバルの `a{color:inherit}` のままだと、パンくずのリンク区間と現在地が同じ色で区別できない。`.study-path a` と同じ既存のリンク扱いを当てただけ |
| `.page-header + .study-path { padding-top: 0 }` | ナビ分のクリアランスは `.page-header` が払う（blog / videos / sns と同じ組み方）。両方が払うと 168px の空白になる |
| `body[data-page="study"] .page-header { max-width: 900px }` | `.page-header` の既定は 1200px（blog 等のグリッド幅）。本文が 900px の読み幅なので、そのままだと**見出しだけ左にはみ出す** |
| `.study-path ul + .eyebrow { margin-top: var(--space-8) }` | §2 のリセット `*{margin:0}` で ul の余白が消えており、次の節の eyebrow が前のリストに貼り付く |
| `.study-path h2 + ul { margin-top: var(--space-3) }` | 同上。見出しの直下にリストが密着していた |

**削除した規則**：`.study-path h2 { font-size: var(--fs-page-title) }`。h2 をページタイトルとして
使っていた頃のもので、`.page-header h1` を置いた今は **h1 と h2 がどちらも 52px** になり階層が
潰れる。削除して h2 はグローバルの節見出し階層（30.4px）に戻した。

## 37.8 検証（headless Chrome 実測）

- **往復**：`study.html →(物理学) study_physics.html →(科目を開く→1-1) phys-math_1-1.html`
  →（パンくず 物理学）→ `study_physics.html` →（パンくず 勉強の軌跡）→ `study.html`。
  レールの `.brand` からは `study_physics.html#phys-math` に着地し、科目が開いた状態。
- **キーボード（accordion.js 切り出し後）**：Enter / Space で開閉、`aria-expanded` 追従、
  Tab は閉じた中身を飛ばす（物理数学 →(開くと) 1-1 微分の基礎 → ナビ）。
  アクセシビリティツリー上も `role=button name=物理数学 expanded=true`。
- **平文の分野**：`role=link` / `role=button` を持つのは物理学だけ。フォーカス可能要素 0。
  色でも判別可能（リンク `rgb(61,139,255)` / 平文 `rgb(255,255,255)`）。
- **レイアウト**：h1 52px / h2 30.4px、見出しと本文の左端が一致（342px）、節間 64px、
  横スクロールなし。モバイル 390px では h1 32px / h2 22.4px、階層の段差
  科目 20 → 章 44 → 節 68px。
- **全 8 ページ**：JS 例外 0・失敗リクエスト 0。ローカル参照 170 件すべて解決、
  ページを跨ぐアンカー（`#phys-math`）も含めて未解決 0。
- キャッシュバスターは全ページ `?v=r51`。

## 37.9 Stills

撮り直し：`interior-study.png` / `interior-study-mobile.png`（分野一覧に変わったため）。
新規：`interior-field-physics.png` / `interior-field-physics-mobile.png`（分野ページ、科目を開いた状態）。
記事の 5 点（`interior-lesson*.png`）はパンくずが入ったので撮り直した。

## 37.10 State（working tree — NOT committed/pushed）
新規 `html/study_physics.html`、`js/accordion.js`。更新 `html/study.html`（分野一覧に全面改稿）、
`html/phys-math_1-1.html`（パンくず + レールのリンク）、`css/style.css`、全ページ `r50→r51`。

---

# §38 — 分野一覧をカードグリッドに（IMPLEMENTED）

study.html の `02 — FIELDS` / `03 — TRAINING` を、素のリストから**カードグリッド**に変えた。
分野名に一行のサブ説明が付き、幅に応じて 3 → 2 → 1 列に折り返す。
`01 — STUDY` のヘッダーは変更していない。

## 38.1 列数は 3 が上限（実測）

既存の共有ルール（`minmax(280px, 1fr)` / gap 24px / max-width 1200px）をそのまま使った実測値。

| 幅 | 列数 | カード幅 | 本文幅 | サブ説明 | 行内の高さ |
|---|---|---|---|---|---|
| 1440 | 3 | 336 | 270 | 2 行 | 175px で揃う |
| 1024 | 3 | 291 | **225** | 全て 2 行 | 172px で揃う |
| 768 | 2 | 334 | 268 | 2 行 | 166px で揃う |
| 390 | 1 | 350 | 284 | 2 行 | 揃う |

**4 列は採らない。** `max-width: 1200px` があるため 1440px でもグリッド内側は 1056px で、
`(1056+24)/(280+24) = 3.55` → 3 列が上限。4 列にするには `minmax` を 240px 程度へ下げる必要が
あり、カード幅 246 / 本文 182px（約 11 文字/行）でサブ説明が **3 行**に割れる。いま最も狭い
1024px でも本文 225px（約 14 文字/行）で 2 行に収まっており、**これが実用下限**。しかも
`minmax` は blog / videos / sns と共有なので、下げると 3 ページに波及する。

**高さは CSS を足さずに揃う。** グリッドアイテムの既定 `align-items: stretch` と、カード側の
`display:flex; flex-direction:column` による。1 行と 2 行が混在する行（生物学のみ 1 行）でも
3 枚とも同じ高さになることを実測。

## 38.2 `auto-fit` ではなく `auto-fill`（1 枚の節で差が出る）

| | 5 枚 | **1 枚** |
|---|---|---|
| `auto-fill`（既存） | 336px ×3 列 | **336px**（他と同じ） |
| `auto-fit` | 336px ×3 列（同一） | **1056px**（全幅に伸びる） |

カードが複数あるときは両者は**完全に同一**で、差が出るのは「トラック数より要素が少ない」ときだけ。
`03 — TRAINING` は 1 枚なので、`auto-fit` だとそこだけ全幅の帯になる。既存ルールが `auto-fill`
なので、**そのまま再利用すれば正しく、グリッド規則への変更はゼロ**。

## 38.3 リンクの有無をどう見せるか

**採った差は 3 つ。枠線は揃えたまま。**

| 差 | 実装 | 実測 |
|---|---|---|
| 要素そのもの | リンクは `<a class="study-card">`、他は `<div class="study-card">` | アクセシビリティツリー上 `role=link` は**物理学だけ**。グリッド内のフォーカス可能要素は 1 つ |
| 見出しの色 | `a.study-card h3 { color: var(--accent) }` | リンク `rgb(61,139,255)` / 平文 `rgb(255,255,255)` |
| ホバー | 共有の `:hover` を `a.study-card` にだけ付ける | リンク側だけ背景 .02→.04・枠線 .14→.24・カーソル pointer。平文側は無反応 |

**枠線を薄くする案は採らない。** (1) 現在のヘアラインは `--hairline`(.14) と
`--hairline-strong`(.24) の 2 段階しかなく、「もっと薄い」は 3 つ目の値＝新しい装飾になる。
(2) 薄い枠＋無反応は視覚的に disabled と同じ記号で、§37.4 で避けると決めたもの。
**記事がまだ無い分野は無効なのではなく、単に中身がないだけ**なので、他と同じ見た目で並び、
見出しが白い（＝行き先がない）と読ませるほうが正確。

## 38.4 `03 — TRAINING` に h2 を置かない

`02` の h2「学問分野」は**どのカードの名前でもないグループ名**なので要る。`03` のグループ名は
カード名そのもの（能力開発）なので、h2 を置くと「能力開発」が 2 行続けて並ぶだけになる。
`.page-header` の直後にグリッドが来る blog.html と同じ形にした。
「（自分用）」は**カード見出しに添える** — この構成では名前の出どころがカードだけなので。

## 38.5 CSS に足したもの（値は一切変えていない）

```css
.blog-grid, .video-grid, .sns-container, .study-grid { … }        /* 名前を1つ足しただけ */
.blog-card, .video-card, .sns-link, .note-card, .study-card { … } /* 同上 */
.blog-card:hover, …, a.study-card:hover { … }                     /* ホバーはリンクだけ */
a.study-card h3        { color: var(--accent); }
a.study-card:hover h3  { color: var(--text-primary); }
.study-grid > .eyebrow, .study-grid > h2 { grid-column: 1 / -1; } /* 見出しを全幅アイテムに */
.study-grid > .eyebrow { margin-bottom: 0; }
```

**節の見出しをグリッドの中に全幅アイテムとして置く**のが要点。グリッド自身の箱（max-width と
gutter）に載るので、**カードと左端が必ず揃う**（実測：見出し・カード・h1 がすべて同じ left。
1440 で 192、1024 で 51、768 で 38、390 で 20）。見出し用のコンテナ class を別に作らずに済む。

**`body[data-page="study"] .page-header { max-width: 900px }` は `:has()` 版に差し替えた。**
study.html はカードグリッド（1200px）、study_physics.html は `.study-path`（読み幅 900px）と
列幅が分かれたため、data-page では区別できない。

```css
.page-header:has(+ .study-path) { max-width: 900px; }
```

直後に続く本文ブロックに合わせる形。`:has()` が効かない環境では既定の 1200px に落ちるだけで
崩れない（Chrome 105+ / Safari 15.4+ / Firefox 121+）。**これがコードベースで最初の `:has()`**。

## 38.6 検証

- **折り返しと可読性**：1440 / 1024 / 768 / 390px で 3 / 3 / 2 / 1 列、横スクロールなし。
  サブ説明は最も狭い 1024px（本文 225px）でも 2 行に収まる。
- **高さ**：どの幅でも行内で完全に一致（1 行と 2 行が混在する行でも）。
- **遷移**：物理学カード → `study_physics.html`。
- **全 8 ページ**：JS 例外 0・失敗リクエスト 0。ローカル参照 170 件すべて解決、未解決アンカー 0。

## 38.7 State（working tree — NOT committed/pushed）
更新 `html/study.html`（02 / 03 をカードグリッドに）、`css/style.css`。
stills は `interior-study.png` / `interior-study-mobile.png` を撮り直し。

---

# §39 — 分野ページもカードに。科目ページの前倒しとアコーディオンの退役（IMPLEMENTED）

study_physics.html の科目一覧をカードグリッドにし、科目ページ `phys-math.html` を作った。
`study.html → study_physics.html → phys-math.html → phys-math_1-1.html` の **4 階層**。

## 39.1 §37.1 の 3 階層は「内容量」ではなく「機構の変更」で前倒しになった

§37.1 は 3 階層を選び、科目ページの昇格条件を **20〜30 節**とした。その前提は
**科目の中身を分野ページ上でアコーディオン展開できたこと**にある。1 枚のページに
分野 → 科目 → 章 → 節 を畳んで収められたので、科目ページが要らなかった。

**カード化はその展開機構を取り上げる。** カードは「行き先がある箱」であり、中に伸び縮みする
木を抱えられない（10 節を抱えたカードはグリッドの高さを壊す）。したがって
**「カードにする」＝「科目ページを作る」** がセットになる。

**記録**：§37.1 の昇格条件は反故にしたのではない。**内容量は変わっていない（記事は 1 本のまま）。
変わったのは表示機構で、それが階層の前提を壊した**という順序である。逆に言えば、4 階層を
避けたいなら分野ページはリストのままにするしかなかった。

**案 B（カードの下にアコーディオンを残す）を採らなかった理由**：study.html で「カード＝行き先」と
定義した直後に、同じ見た目の箱が別の動作をすると規則が割れる。実装面でも、展開パネルを
`grid-column: 1/-1` で挟むと後続カードが飛び、要素が `<a>` / `<div>` / `<button>` の 3 種混在に
なって、押せる・押せないの見分けが今より複雑になる。

## 39.2 phys-math.html の組み方（章は見出し、節がカード）

`study_physics.html` と同じ形：`eyebrow + h2` が章、その下のグリッドが節。章は §37 どおり
**平文**（リンクにしない）。章が増えたら `02 — Chapter 2` の節を足すだけで、20 節でも素直に伸びる。

**節カードのサブ説明は新しく書かない。** 記事がすでに持っている副題
（`<h1>1-1　微分の基礎<span class="sub">変化する世界を、どうやって調べるか</span></h1>`）を
そのまま使う。今後の記事も同じ位置に副題を持つので、材料は自動的に揃う。

## 39.3 アコーディオン一式と `.study-path` 一式を削除した

カード化で利用者がゼロになったため削除した。**使われない機構を「いつか使うかも」で残すほうが
害が大きい**（git 履歴からいつでも戻せる）。

| 削除したもの | 直前の利用者 |
|---|---|
| `js/accordion.js`（§37.6 で切り出したばかり） | `study_physics.html` のみ |
| `.accordion-toggle` / `:hover` / `.accordion-content` / `.accordion-content ul ul` | 同上 |
| `.study-path` とその関連（`.study-path a` / `a:hover` / `ul + .eyebrow` / `h2 + ul`） | 同上 |
| `.page-header + .study-path` | 同上 |
| **`.page-header:has(+ .study-path)`** | 同上 |

**`:has()` は不要になった（§38.5 の追記）。** あの規則は「読み幅 900px の `.study-path` の前では
見出しも 900px に」という列幅合わせだった。3 ページとも `.study-grid`（1200px）になり、
`.page-header` の既定 1200px と一致したので、**合わせる対象そのものが消えた**。実測でも
見出し・カード・h1 の左端が 3 ページ × 4 幅のすべてで一致している。結果として、
**コードベースから `:has()` はいったん無くなった**。

`.study-path a` の削除にあたっては、同じ宣言を共有していた `body.is-article main a:not(.btn)`
（記事のリンク色）を残す必要がある。セレクタリストから `.study-path a` だけを外した。

## 39.4 検証

- **3 ページの統一**：study / study_physics / phys-math のカード幅は全幅域で一致
  （1440→336 / 1024→291 / 768→334 / 390→350px）。見出し・カード・h1 の左端も 3 ページで一致
  （192 / 51 / 38 / 20px）。横スクロールなし。
- **高さ**：どのページ・どの幅でも行内で完全一致。study_physics の 8 枚は 1440px で 3+3+2、
  768px で 2×4、390px で 1×8 に折り返し、いずれも行内は同一高さ。
- **押せないカード**：`role=link` を持つのは物理数学だけ。古典力学・解析力学・電磁気学・熱力学・
  統計力学・量子力学・特殊相対性理論・場の量子論・一般相対性理論・宇宙論の **10 枚は
  link / button として公開されない**。グリッド内のフォーカス可能要素も物理数学のみ。
- **往復**：`study → study_physics → phys-math → phys-math_1-1`。記事のパンくずは
  **勉強の軌跡 ／ 物理学 ／ 物理数学 ／ 1章 微分 ／ SECTION 1-1** で、前 3 つがリンク。
  各階層へ戻れることを実測。レールの `.brand` も `phys-math.html` に付け替えた。
- **残存参照**：`study-path` / `accordion` / `:has(` は CSS・JS・HTML のどこにも無い
  （残るのは削除の経緯を書いた `css/style.css` のコメント 2 行だけ）。
- **全 9 ページ**：JS 例外 0・失敗リクエスト 0。ローカル参照 191 件すべて解決、未解決アンカー 0。
  キャッシュバスターは `?v=r52`。

## 39.5 サブ説明の文体

11 件中、量子力学だけ「確率振幅が支配する、ミクロな世界の法則」と体言止めで、他の 10 件が
すべて動詞で終わるため 1 枚だけ調子が変わっていた。内容は変えず語尾だけ揃えて
**「確率振幅から、ミクロな世界の振る舞いを導く」** とした。

## 39.6 Stills

新規 `interior-subject-phys-math.png`。撮り直し `interior-field-physics.png` /
`interior-field-physics-mobile.png`（カード化）。

## 39.7 State（working tree — NOT committed/pushed）
新規 `html/phys-math.html`。更新 `html/study_physics.html`（カード化）、
`html/phys-math_1-1.html`（パンくず・レールのリンク先）、`css/style.css`（削除）、
全ページ `r51→r52`。削除 `js/accordion.js`。

---

# §40 — 記事の2カラム: 余白の非対称を直す（実装したが REVERTED）

`phys-math_1-1.html` の `.wrap` から `max-width: 1200px` を外し、左に `--gutter` を入れた。
本文 760px は維持したまま、**レール右端〜本文** と **本文〜画面右端** が常に等しくなる。

## 40.1 「右が空いて見える」の正体は量ではなく非対称だった

| 幅 | レール | 本文 | レール〜本文 | 本文〜右端 |
|---|---|---|---|---|
| 1680 | 240..490 | 585..1345 | **95** | **335** |
| 1440 | 120..370 | 465..1225 | **95** | **215** |
| 1280 | 40..290 | 385..1145 | **95** | **135** |
| 1100 | 0..250 | 295..1055 | 45 | 45 |

`.wrap` が 1200px で止まるため、**レールの右端から先が本文領域として見えているのに
`.wrap` はその手前で終わり**、余った分（1440px なら 120px）が本文領域の「外」に残っていた。
本文は `.main` の中では中央だが、`.main` 自体が画面に対して中央でないので右へ寄って見える。
差は 1440px で 2.3 倍、1680px で 3.5 倍。**1200px 未満では既に対称**だった（レールは 1100px
以下で既に左端に接している）ので、不具合が出るのは 1200px 超のときだけ。

## 40.2 検討した案と、採らなかった理由（すべて実測）

| 案 | 1440px の 間隔 / 右余白 | 判定 |
|---|---|---|
| **採用 `.wrap{max-width:none; padding-left:var(--gutter)}`** | **179 / 179** | 対称。右余白 215→179 に縮み画面を広く使う |
| `max-width` を外すだけ | 215 / 215 | 対称。ただし**本文は 1px も動かず右余白も 215 のまま**、レールが画面端に密着 |
| 左右に `--gutter` | 143 / 215 | **非対称のまま**（右 padding のぶん `.main` が早く終わる） |
| 間隔（`.main` の padding）を広げる＝案3 | 96 / 216 | **改善しない**。原因がギャップではなく `.wrap` の右端位置にあるため |
| レールを画面左端に固定し本文を中央＝案2 | — | **破綻**。1024px で本文 132..892 がレール 0..250 と重なる。1280px でも隙間 10px |

**数式上の要点**：本文の中心は `(wrap左 + レール幅 + wrap右) / 2`。`.wrap` を中央寄せにしている
限り `wrap左 + wrap右 = 画面幅` なので、**max-width を外しても本文は 1px も動かない**
（レールだけが左へ寄る）。左に padding を足すと本文はその半分だけ右へ動く（+36px）。

## 40.3 実測（採用案）

| 幅 | レール | 本文 | 幅 | 間隔 / 右余白 |
|---|---|---|---|---|
| 1680 | 84..334 | 627..1387 | 760 | **293 / 293** |
| 1440 | 72..322 | 501..1261 | 760 | **179 / 179** |
| 1280 | 64..314 | 417..1177 | 760 | **103 / 103** |
| 1100 | 55..305 | 349..1056 | 707 | 44 / 44 |
| 1024 | 51..301 | 342..983 | 641 | 41 / 41 |
| 900 以下 | −250..0（`fixed`） | — | 760 / 350 | オフキャンバス |

**本文 760px が保たれるのは約 1100px 幅まで**で、それ以下は `.main` の padding
（`clamp(20px,4vw,56px)`）とともに縮む。これは今回の変更前からの挙動で、変わっていない。

超広幅（1680px）で間隔・右余白が 293px 残るのは、**本文 760px を維持する以上当然**なので
埋めない、という判断。

## 40.4 副作用の確認

- **900px 以下は完全に不変**。`@media (max-width:900px)` で `.wrap{padding-left:0}` と打ち消して
  いるため、本文幅（900px→760 / 768px→728 / 390px→350）もオフキャンバスの挙動
  （初期 −250 → 目次ボタンで 0 → スクリムで −250）も従来どおり。
- **目次追従・進捗バーは不変**。`getBoundingClientRect()` と `scrollHeight` 基準で、レールの
  位置に依存しない。実測で `先頭→01 / #d2→03 / #d5→06 / #d7→08 / #howto→10`、最下部で 100%。
- **星の間引きは新しい位置に自動追従**。`columns()` が毎回矩形を測るため。1440px での密度は
  左余白 0.0179 / レール 0.0024 / 間 0.0268 / 本文列 0.0031 / 右余白 0.0295 で、
  **レールと本文列だけが間引かれ、その間の 179px は間引かれていない**（テキスト列ではないため）。
- **他 3 ページは無影響**。`.wrap` は `phys-math_1-1.html` の `<style>` 内にしか存在せず、
  study / study_physics / phys-math はカード左 192px・幅 336px のまま。
- **キャッシュバスターは据え置き（r52）**。変更は記事の inline `<style>` で、`css/` `js/` の
  外部ファイルは触っていない。HTML 自体はクエリ文字列を持たないので、上げる意味がない。

## 40.5 結末 — 実装して本番に出したが、差し戻した

**採用案は一度実装・push したうえで差し戻した。** 左右が対称になること自体は実測どおり
達成できた（1440px で 179/179）が、**本文の幅も読み位置もほとんど変わらなかった**ため、
変更前のバランスのほうが良いという判断になった。

- 本文幅は 760px で不変（そもそも変えない前提）
- 本文の位置は 465..1225 → 501..1261 の **+36px** だけ
- 変わったのは主にレールの位置（120..370 → 72..322）と、右余白 215 → 179px

つまり**得られたのは「対称である」という性質だけ**で、読む体験としての差は小さかった。
`.wrap{max-width:1200px}` に戻し、`@media (max-width:900px)` に足した
`.wrap{padding-left:0}` も外した。記事の `<style>` には、同じ検討を繰り返さないよう
「外して対称にする案を一度実装したが差し戻した。再検討の前に §40 を読むこと」という
1行のコメントだけ残してある。

**この節を残す理由**：現象の分析（非対称の原因は余白の量ではなく `.wrap` の右端位置）と、
採らなかった 4 案の実測値（40.2）は、次に同じ違和感を持ったときに必ず役に立つ。
特に「`.wrap` を中央寄せにしている限り max-width を外しても本文は 1px も動かない」という
関係と、案2（レール左端固定＋本文中央）が 1024px で**重なって破綻する**ことは、
測らないと分からない。

**差し戻し後に確認したこと**：1440px でレール 120..370 / 本文 465..1225 / 間隔 95 / 右余白 215
と変更前の値に戻ること、900px 以下のオフキャンバス（初期 −250 → 目次ボタンで 0 →
スクリムで −250）、目次追従・進捗バー・星の間引きが正常に動くこと。

## 40.6 State（committed）
`ba7a25a` で実装して push、その後この差し戻しをコミット。
最終的に `html/phys-math_1-1.html` の `.wrap` は変更前と同一。

---

# §41 — ライトモードの面・枠線・色付きボックスを立て直す（IMPLEMENTED）

「全体的に薄く、面が白い板のように見える」という指摘を測って原因を切り分けた。
**面の段差ではなく、輪郭の弱さと、ダーク専用値の直書きと、雰囲気レイヤーの欠落**の3つだった。

## 41.1 調査で使った指標

コントラスト比だけでは隣り合う面の見分けやすさを説明できない（比 1.03 と 1.07 の差が
知覚とは対応しない）ので、**CIE L\* の差（ΔL\*）** を併用した。要素の面・枠線は、
**祖先を遡って合成した実効色**で測っている（`.drill .attempt` のような入れ子で背面を
取り違えないため）。

## 41.2 原因は3つ。うち2つは想定外だった

**① 面の段差は潰れていなかった。** 背景→サーフェスの ΔL\* はダーク +1.4 に対しライト +2.8 で、
**むしろライトの方が大きい**。「白い板」の主因は面ではなく**枠線**だった。

| | ダーク | ライト（調整前） |
|---|---|---|
| 枠/面 比 | 1.35〜1.99 | **1.09〜1.58** |
| ΔL\* 枠 | 14.1〜24.8 | **3.3〜16.5** |

**② `.box.principle` と `.box.target` の枠線がダーク専用値の直書きだった（バグ）。**

```css
.box.principle{ … border-color:rgba(255,61,139,.28)}   /* ← トークンでない */
.box.target   { … border-color:rgba(114,227,173,.28)}  /* ← トークンでない */
```

`--key-tint` / `--good-tint` はライトで上書きされるのに枠線だけ素通りし、暗い背景用の
明るいピンク・ミントがそのまま乗っていた。**`.box.target` は枠/面 1.09 で実質不可視**。
`.warn` と `.teach` はトークン（`--amber-line` / `--teach-line`）を使っていたので無事だった。
→ `--key-line` / `--good-line` を新設し、ダークは従来値と同一にして見た目を変えずに移行。

**③ ライトでは雰囲気レイヤーが消えていた。** `#starfield` が `display:none`、
`body::before` が `opacity:.45`。ダークの密度感は面の差ではなく、**星と背景グローが置く
微細なテクスチャ**から来ている。ライトはその両方を失って完全に平坦な単色面になっていた。

## 41.3 調整した値（ライトのみ。ダークは1つも変えていない）

| トークン | 変更前 | 変更後 | 効果 |
|---|---|---|---|
| `--bg` | `#f6f7fa` | **`#eef0f5`** | 白カードとの ΔL\* +2.8 → **+5.2** |
| `--surface-2` | `#f0f2f6` | **`#f7f8fb`** | 背景を下げたので中間層として上げる |
| `--hairline` | `.13` | **`.20`** | 枠/面 1.31 → **1.54** |
| `--hairline-strong` | `.26` | **`.34`** | |
| `--line-soft` | `.05` | **`.08`** | 節の区切り線 |
| `--footer-bg` | `#eceef3` | **`#e6e9f0`** | 背景を下げたぶん一段下げる |
| `--key-tint` / **`--key-line`** | `.07` / 直書き | **`.10` / `.38`** | 枠/面 1.38 → **1.75** |
| `--good-tint` / **`--good-line`** | `.08` / 直書き | **`.11` / `.38`** | 枠/面 **1.09 → 1.63** |
| `--amber-tint` / `--amber-line` | `.09` / `.35` | **`.11` / `.40`** | 枠/面 1.37 → **1.65** |
| `--teach-tint` / `--teach-line` | `.07` / `.30` | **`.10` / `.36`** | 枠/面 1.58 → **1.70** |
| `body::before` | `opacity:.45` | **`.7`** | 平坦さを補う。**星は出さない** |
| `--text-tertiary` | `.60` | **`.63`** | 背景を下げたぶん AA の余裕を戻す（41.5） |

**amber だけ tint / line の基準色が文字色と違っていた**（`--amber` は `#a35c00` なのに
tint/line は `rgba(214,130,20)` の明るいオレンジ）。他3種と同じく文字色基準に統一した。
これで4種が同じ強さで並ぶ。

**星を出さない理由**：白地に灰色の点が散る見え方になり、ダークの「星空」とは別物の印象に
なる。グローだけ上げて平坦さを補う。

## 41.4 調整後の実測（1440px）

| 要素 | ダーク 面ΔL\* / 枠比 | ライト 面ΔL\* / 枠比 |
|---|---|---|
| `.box.principle` | +2.6 / 1.46 | −5.8 / **1.75** |
| `.box.target` | +4.8 / 1.99 | −5.5 / **1.63** |
| `.box.warn` | +4.0 / 1.97 | −5.4 / **1.65** |
| `.box.teach` | +3.2 / 1.53 | −5.6 / **1.70** |
| `.fig` / `.drill` | +1.4 / 1.38 | +5.2 / **1.54** |
| `.transfer` / `th` | +3.0 / 1.43 | +2.8 / **1.53** |
| `.rail` | 0 / 1.35 | 0 / **1.52** |

**枠/面はダーク 1.35〜1.99 に対しライト 1.52〜1.75** で同等の帯に収まった。
色付き4種の面の L\* は 89.0〜89.4 に揃い、互いの区別は**色相**で付く。

## 41.5 コントラスト（AA 維持）

| | ダーク | ライト |
|---|---|---|
| 本文 p | 9.40 | **7.20** |
| 解説文 / eyebrow / フッター見出し | 4.58 / 4.58 / 3.66（§20.3） | **4.98** |
| ナビリンク・Connect | 7.74 | 7.72 |
| ロゴ | 19.76 | 18.04 |

背景を `#f6f7fa` → `#eef0f5` に下げたことで `--text-tertiary`(.60) が 4.61 → **4.52** と
AA の境界に寄ったため、**.63 に上げて 4.98 に戻した**。ライトは全項目 AA 以上。
ダークのフッター見出し 3.66 は §20.3 の既存ギャップで、今回の対象外。

## 41.6 一般則

**色付きコンポーネントの枠線は必ずトークン経由にすること。** 直書きするとテーマ上書きが
効かず、片方のテーマでだけ破綻する。しかもそれは「淡い」という見え方で現れるので、
バグではなくデザインの問題に見えてしまい、原因にたどり着きにくい。記事の `<style>` の
該当箇所にこの注意をコメントで残した。

**同じ族のトークンは基準色を揃えること**（`--amber` の tint/line だけ別の色を基準に
していた）。揃っていないと、片方のテーマでその族だけ強さが合わなくなる。

## 41.7 State（committed 5d6d9a7 / pushed。§42 と同じコミット）
更新 `css/lesson-theme.css`（ライトのトークン）、`html/phys-math_1-1.html`
（枠線のトークン化＋ダーク側に `--key-line` / `--good-line` を追加）。**ダークは見た目不変**。

---

# §42 — ライトを「紙の地」に。温色化と面・色の一段強化（IMPLEMENTED）

§41 で輪郭は立ったが、**地が青灰色**のままで、色付きボックスも「白に薄く色を乗せた」印象が
残っていた。地を温色に振り、面の段差と tint をもう一段上げた。**ダークは一切変更していない。**

## 42.1 値（ライトのみ）

| トークン | §41 | **§42** | 効果 |
|---|---|---|---|
| `--bg` | `#eef0f5`（R−B **−7**、青寄り） | **`#ece7df`（R−B +13、温かい）** | 白カードとの ΔL\* **+5.2 → +8.2** |
| `--surface-2` | `#f7f8fb` | **`#f8f5f0`** | 温色に追随 |
| `--hairline` | `.20` | **`.22`** | 白面で枠/面 1.54 → **1.61** |
| `--hairline-strong` | `.34` | `.36` | |
| `--line-soft` | `.08` | **`.10`** | 節の区切り線 |
| 4種の tint | `.10`〜`.11` | **`.15`（統一）** | 面が地から **−6.9〜−8.1** |
| 4種の line | `.36`〜`.40` | 据え置き | 面が暗くなっても枠/面 **1.58〜1.67** を保つ |
| `--footer-bg` | `#e6e9f0` | **`#e4ded4`** | 温色に追随 |
| `--rail-bg` | `rgba(250,251,253,.97)` | **`rgba(252,250,246,.97)`** | 同上 |

## 42.2 調整後の実測（1440px）

| 要素 | 面 | L\* | ΔL\* 面 | 枠/面 |
|---|---|---|---|---|
| 背景 | `#ece7df` | 91.8 | — | — |
| `.fig` / `.drill` / `.attempt` | `#ffffff` | 100 | **+8.2** | 1.61 / 1.78 |
| `.transfer` / `th` / `.sol` | `#f8f5f0` | 96.6 | +4.8 | 1.60 |
| `.box.principle` | `#e5cacd` | 83.7 | **−8.1** | 1.67 |
| `.box.target` | `#ccd7c9` | 84.7 | −7.1 | 1.58 |
| `.box.warn` | `#e1d2be` | 84.9 | −6.9 | 1.59 |
| `.box.teach` | `#d6cedd` | 83.8 | −8.0 | 1.64 |

**3層になった**：白カード（L\* 100）＞ 地（91.8）＞ 色付き（83.7〜84.9）。カードは浮き、
色付きは沈む。色付き4種と白カードの ΔL\* は **15.1〜16.3** で、無彩色の面とも明確に分かれる。

## 42.3 ★ 背景グローは「濁る」。実描画ピクセルで確認して暖色に振った

`body::before` は `--spill-blue` / `--spill-blue-deep` / `--spill-violet` の青紫。**温かい地に
そのまま重ねると、グローの強い所だけ地が青へ転ぶ**。グラデーションは計算で追えないので、
**スクリーンショットを canvas に描き直して実ピクセルを採取**して確かめた。

| 採取点 | 暖色化の前 | **後** |
|---|---|---|
| グロー右上 | `#dbdce2`（R−B **−7**） | **`#e4dbcf`（+21）** |
| グロー左下 | `#d9d9db`（R−B **−2**） | **`#e9dcd9`（+16）** |
| 中央 | `#e9e5de`（+11） | `#eae4dc`（+14） |
| 地（単体） | — | `#ece7df`（+13） |

対処は **ライトでだけ `--spill-*` トークンを暖色に差し替える**こと（`rgba(163,92,0,.07)` /
`rgba(192,38,103,.05)` / `rgba(91,63,208,.035)`、`opacity: 1`）。`style.css` の
`body::before` 自体は触らない。**トークンで組まれていたおかげで、テーマ側の 3 行で済んだ**
（§41.6 の一般則がそのまま効いた例）。

## 42.4 数式（MathJax SVG）の可読性

`mjx-container{color:var(--ink)}` で、SVG は `currentColor` で描かれる。色付きの面の上でも
インクは `#14161f` のままなので、**面が濃くなったぶんだけ比は下がるが十分な余裕がある**。

| 場所 | ライト 面 / 数式比 | ダーク 面 / 数式比 |
|---|---|---|
| `.box.principle` | `#e5cacd` / **11.75** | `#14050b` / 19.87 |
| `.box.target` | `#ccd7c9` / **12.09** | `#09120e` / 18.99 |
| `.box.warn` | `#e1d2be` / **12.18** | `#140d06` / 19.27 |
| `.box.teach` | `#d6cedd` / **11.78** | `#0e081c` / 19.60 |
| **`.sol`（解答）** | `#f8f5f0` / **16.59** | `#101010` / 19.05 |
| `.hint` | `#f1e7d9` / **14.71** | `#19110a` / 18.59 |

色付き面の上の**本文**も 6.09〜6.22:1 で AA 以上。

## 42.5 コントラスト（AA 維持）

| | ダーク | ライト |
|---|---|---|
| 本文 p | 9.40 | **6.91** |
| 解説文 / eyebrow / フッター見出し | 4.58 / 4.58 / 3.66（§20.3） | **4.83** |
| ナビリンク・Connect | 7.74 | 7.72 |
| ロゴ | 19.76 | 18.04 |

地を暗くしたぶん本文は 7.20 → 6.91、補助は 4.98 → 4.83 に下がるが、**いずれも AA 以上**
（補助は基準 4.5 に対し +0.33 の余裕）。

## 42.6 ダークは完全に不変

面・枠線・数式のすべての測定値が §41 時点と一桁まで一致することを確認済み。変更は
`css/lesson-theme.css` の `:root[data-theme="light"]` ブロック内だけで、ダークの `:root` と
`css/style.css` には触れていない。

## 42.7 State（committed 5d6d9a7 / pushed。§41 と同じコミット）
更新 `css/lesson-theme.css` のみ。


---

# §43 — 紙の地の微調整と、本文を広げる可変2カラム（IMPLEMENTED）

参考例との差として挙がった3点（① 地が黄色すぎる ② 本文が狭い ③ レールと本文が
中央に寄りすぎ）をまとめて直した。②③ は §40 で一度差し戻した領域だが、**§40 は
「中央寄せのまま左右を対称にする」変更で本文の幅も位置も変わらなかった**のに対し、
今回は本文幅そのものを 760 → 860px に広げて左揃えにする。目的も結果も別物である。

## 43.1 背景 — 「温かい」と「黄色い」の境目は R−B で測れる

§42 の `#ece7df` は R−B **+13**。参考例の狙いは「ほぼ無彩〜ごくわずかに温かい」で、
R−B **+3〜+5** が目標だった。2案を実測して比較した。

| | **案A（採用）** | 案B（より白に近い） | §42 |
|---|---|---|---|
| `--bg` | **`#eeedea`** | `#f1f0ec` | `#ece7df` |
| L\* | **93.7** | 94.8 | 91.8 |
| **R−B** | **+4** | +5 | +13 |
| 白カードとの ΔL\* | **+6.3** | +5.2 | +8.2 |
| 本文 / 補助テキスト | 7.10 / 4.93 | 7.20 / 4.98 | 6.91 / 4.83 |

**案A を採った理由**は段差である。案B の +5.2 は §41 で「面が浮かない」と判断した
水準とちょうど同じ値で、地を白に近づけるほど白カードが地に溶ける。地の明度は
上げたい／段差は残したい、という要求はトレードオフの関係にあり、R−B を +4 に
落としたうえで段差 +6.3 を確保できる案A が両立点だった。

**色付き 4 種は tint `.15` のまま据え置き。** 地が明るくなると、同じ tint でも
沈み込みはむしろ**増える**（§42 の −6.9〜−8.1 → 本round −7.2〜−8.5）。

| 要素 | 面 | L\* | ΔL\*（地との差） | 枠/面 |
|---|---|---|---|---|
| 背景 | `#eeedea` | 93.7 | — | — |
| `.fig` / `.drill` / `.attempt` | `#ffffff` | 100 | **+6.3** | 1.61 / 1.78 |
| `.transfer` / `th` / `.sol` | `#f8f8f6` | 97.5 | +3.8 | 1.60 |
| `.box.principle` | `#e7cfd6` | 85.3 | **−8.4** | 1.70 |
| `.box.target` | `#cedcd2` | 86.4 | −7.3 | 1.59 |
| `.box.warn` | `#e3d7c7` | 86.6 | −7.1 | 1.61 |
| `.box.teach` | `#d8d3e6` | 85.4 | −8.3 | 1.66 |

グローは §42.3 で暖色に振ってあるが、地の R−B を +13 → +4 に落とすと今度は
**グローのほうが濃く**なる。`--spill-*` を `.07/.05/.035` → **`.05/.04/.03`** に下げ、
実描画ピクセルで地の全域が R−B **+4〜+11** に収まることを確認した（計算では追えない。
§42.3 と同じ手法）。`--surface-2` `#f8f5f0`→`#f8f8f6`、`--footer-bg` `#e4ded4`→`#e7e6e2`、
`--rail-bg` も同様に無彩寄りへ追随させている。

## 43.2 本文幅 — 数式が決める下限は 853px。入れ子パディングが 132px を食う

760px では **display 数式 82 本のうち 6 本がはみ出していた**。原因の大半は本文幅では
なく**入れ子**で、解答の中の数式は `section → .drill(20) → .attempt(22) → .sol(20)` の
左右パディングにより**本文列より 132px 狭い箱**に入る。

| 必要な本文幅 | 内訳（数式の自然幅 + 入れ子の目減り） | 場所 |
|---|---|---|
| **853px** | 721 + 132 | `.sol` |
| 834px | 745 + 89 | `.sol` |
| 806px | 674 + 132 | `.sol` |
| 803px | 714 + 89 | `.sol` |
| 769px | 637 + 132 | `.sol` |
| 767px | 767 + 0 | 本文直下 |

**全 82 本が収まる最小幅は 853px**。余裕を見て **860px** とした（820px では 2 本残る）。
入れ子パディングを詰めれば同じ効果をもっと狭い本文幅で得られるが、今回は本文幅の
変更と混ぜず**意図的に見送った**（見た目の影響範囲が別物になるため）。

## 43.3 ★ 固定配置は狭い画面を殺す。レール位置を可変にした

最初の提案（レール左 32px / 間隔 56px を**固定**）は 1280px 以上では狙いどおりだが、
**1024px で本文が 692 → 645px と現状より狭くなる**。固定した余白のぶん、狭い画面で
本文に回せる幅が減るためで、ノートPCの標準幅で数式のはみ出しが増えるのは本末転倒。

対処は、**余白を画面幅の関数にして、狭いところでは余白から先に削る**こと。レール幅
250px は目次の文字量で決まるので触らない。

```css
/* レールの左余白: 1280px → 1440px で 0 → 32px */
.wrap{padding-left:clamp(0px, calc((100vw - 1280px) * .2), 32px)}
/* レール↔本文の間隔: 1024px → 1280px で 24 → 56px */
.main{padding:0 clamp(24px, calc(24px + (100vw - 1024px) * .125), 56px) 110px}
/* 本文列は左揃え。余りは右へ流す */
body.is-article .main > …{max-width:860px;margin-left:0;margin-right:auto}
```

`max-width:1200px` の中央寄せコンテナは撤廃した（§40 で残した判断の再検討にあたる）。
1200px の箱の中で中央に寄せる限り、本文を広げても位置は動かないためである。

**優先順位が幅ごとに入れ替わる構造**になっている：1280px 以上では見た目の配分を、
1024px 付近では本文幅を優先する。単一の固定値では両立しない。

## 43.4 幅ごとの実測（変更前 → 変更後）

| 幅 | レール L..R | 本文（幅） | 間隔 | 右余白 | 数式はみ出し |
|---|---|---|---|---|---|
| 1920 | 360..610 → **32..282** | 760 → **860** | 95 → 56 | 455 → 722 | 6 → **0** |
| 1440 | 120..370 → **32..282** | 760 → **860** | 95 → 56 | 215 → 242 | 6 → **0** |
| 1366 | 83..333 → **17..267** | 760 → **860** | 95 → 56 | 178 → 183 | 6 → **0** |
| 1280 | 40..290 → **0..250** | 760 → **860** | 95 → 56 | 135 → 114 | 6 → **0** |
| 1200 | 0..250 | 760 → **858** | 95 → 46 | 95 → 46 | 6 → **0** |
| 1100 | 0..250 | 760 → **783** | 45 → 34 | 45 → 34 | 6 → **4**（最大 +70） |
| **1024** | 0..250 | 692 → **726** | 41 → 24 | 41 → 24 | 7 → **6**（最大 +127） |
| 950 | 0..250 | 624 → **652** | 38 → 24 | 38 → 24 | 11 → **9** |
| 900 | オフキャンバス | 760 → **860** | — | 70 → 20 | 6 → **0** |
| 768 | オフキャンバス | 728（不変） | 20 | 20 | 6（不変） |
| 390 | オフキャンバス | 350（不変） | 20 | 20 | 39（不変） |

**全ての幅で本文が現状以上**になっている（狭い側も +23〜+34px）。ページ全体の横
スクロールはどの幅でも発生しない（`body{overflow-x:hidden}`）。

## 43.5 1024px で数式のはみ出しを 0 にはできない

レール 250px ＋ 最小限の余白 24px×3 を引くと、1024px で本文に回せるのは 726px が上限。
`.sol` の入れ子 132px を差し引くと数式が使えるのは 594px で、**必要な 721px に届かない**。
レールを畳むかパディングを削らない限り、幅の配分だけでは解けない。残る 6 本は
`mjx-container[display="true"]{overflow-x:auto}` による**数式ごとの横スクロール**で扱う。

| # | 自然幅 | 箱 | はみ出し | 場所 |
|---|---|---|---|---|
| 1 | 637 | 594 | +43 | §03 `.sol` |
| 2 | 674 | 594 | +80 | §03 `.sol` |
| 3 | 714 | 637 | +77 | §05 `.sol` |
| 4 | **721** | 594 | **+127** | §05 `.sol` |
| 5 | 767 | 726 | +41 | §07 本文直下 |
| 6 | 745 | 637 | +108 | §07 `.sol` |

6 本とも `scrollWidth > clientWidth` で、**実際にスクロールして全体を読める**ことを
確認した。ただし macOS のオーバーレイ・スクロールバーは操作するまで出ないため、
**止まっている状態では「途中で切れている」以外の手がかりが無い**。フェード等の
視覚的な手がかりを足すかは別途の判断とする。

## 43.6 既知（今回の変更とは無関係・変更前から同じ）

390px で解答をすべて開くと `scrollWidth` が 550px まで伸びる。原因は `.sol` 内の
**インライン数式**で、`overflow-x:auto` は `mjx-container[display="true"]`（別行立て）
にしか掛かっていない。`body{overflow-x:hidden}` で切り落とされるため読めない部分が
出るが、**変更前の HEAD でも数値まで完全に一致**しており、本roundの回帰ではない。

## 43.7 検証

- **ダーク完全不変**：`:root` のカスタムプロパティ全件＋主要13要素の
  `color / background / border` を HEAD 版と本round版で採取し、**差分ゼロ**。
  CSS の変更は全ハンクが `:root[data-theme="light"]` の中にある（レイアウトの
  変更は両テーマに等しく掛かる。これは本文幅を広げるという要求そのもの）。
- **ライトのコントラスト（AA 維持）**：本文 p **7.10**、補助 / eyebrow / フッター見出し
  **4.93**、ナビ 7.72、ロゴ 18.04、目次リンク 15.41。
- **星の間引きが新しい本文列に追従**（ダーク 1440px、帯ごとのインク量 /千px）：
  レール **0.007** ／ レールと本文の間 0.048 ／ 本文 **0.012** ／ 右余白 0.125。
  間引く側（レール・本文）が桁で下回る。`columns()` の対象は 11 要素。
- **900px 以下のオフキャンバス維持**：390px でレールが `position:fixed`、
  −250 → 0（メニュー）→ −250（スクリム）。

## 43.8 キャッシュバスターを r52 → r53 に上げた

§41 / §42 は `css/lesson-theme.css` を書き換えたのに `?v=` を据え置いたまま push して
いた（README の規約違反）。既に r52 でライトの CSS を取得済みのブラウザには、あの
round の色が届いていない可能性がある。本roundで **9 ページ 39 箇所を r53 に更新**し、
README の Current 表記も合わせた。**`css` / `js` を触ったら必ず上げること。**

## 43.9 State（working tree — NOT committed/pushed）
更新 `css/lesson-theme.css`（ライトのトークンのみ）、`html/phys-math_1-1.html`
（`<style>` のレイアウト3ブロック ＋ r53）、`html/` の残り 8 ページ（r53 のみ）、
`README.md`、`DESIGN.md`（§41.7 / §42.7 の State 表記も実際の commit に合わせて訂正）。

---

# §44 — 記事のテーマ切替を止める（機構は保持）（IMPLEMENTED）

サイト全体がダーク基調なのに記事ページだけライトに変わるのは一貫性を欠く、という
判断で切替を止めた。**機構は消していない。**§41〜§43 で積み上げたライトの色設計は
そのまま残してあり、要望が出れば1行で復活する。

## 44.0 復帰手順

> `html/phys-math_1-1.html` の `<head>` にある `js/theme.js` の `<script>` の
> **コメントを外す。それだけ**。`js/theme.js` も `css/lesson-theme.css` も削除して
> いないので、他に戻すものは無い。

`data-theme` 属性を付ける主体は `theme.js` しか無い。読み込まなければ属性が付かず、
`:root[data-theme="light"]` は**構造的に絶対マッチしない**。ライトの CSS は死蔵に
なるが、発火経路だけが消える形になる。

## 44.1 ★ lesson-theme.css は「ライト専用ファイル」ではない

**将来このファイルを整理するときに事故らないための記録。** 全15ルールの分類：

| 区分 | ルール | 宣言 |
|---|---|---|
| **★ ダークでも効く** | `:root` | 7 |
| **★ ダークでも効く** | `.mod-h .no, .step .sn, .drill .qn` | 1 |
| **★ ダークでも効く** | `footer` | 1 |
| **★ ダークでも効く** | `.footer-tagline` | 1 |
| **★ ダークでも効く** | `.prompt` | 1 |
| **★ ダークでも効く** | `@media (max-width: 900px) .rail` | 1 |
| **★ ダークでも効く** | `.theme-btn` / `:hover` / `:focus-visible` / `--float` | 25 |
| ライト限定 | `:root[data-theme="light"]` 系 5 ルール | 38 |
| print のみ | `@media print` | 13 |

要は **9/15 がスコープ無し**で、ダークに効いている。特にダーク側 `:root` の
`--ink` / `--line` / `--line-strong` / `--on-accent` / `--footer-bg` / `--rail-bg` /
`color-scheme` は、**記事の `<style>` にも `style.css` にも定義が無く、ここにしか無い**
（`grep` で各0件）。遮断して実測すると **14箇所が変化**した：

| 箇所 | 現状 | ファイルを外すと |
|---|---|---|
| `.drill` / `.fig` / `.sol` / `.rail` の枠線 | `rgba(255,255,255,.14)` | **`rgb(255,255,255)`（不透明な白）** |
| `footer` の背景 | `rgba(0,0,0,.6)` | 未定義 |
| 900px 以下のレール（ドロワー）の背景 | `rgba(8,8,12,.96)` | 未定義 |
| `.step .sn` / `.drill .qn` の文字 | `#001227` | `#06142e` |
| `.footer-tagline` | `.46` | `.55` |
| `color-scheme` | `dark` | `normal` |

枠線が白くなるのは、`--line` が未定義になると `border:1px solid var(--line)` が
`currentColor`（＝白）にフォールバックするため。**トークンの「未定義」は透明では
なく初期値への落下**であり、ヘアラインの場合それは最も目立つ色になる。

## 44.2 ★ 採らなかった2案とその理由（再検討の前に読むこと）

**案「ボタンだけ出さない」は現状より悪化する。** 落とし穴が2つある。

1. **`layout.js` のフックを止めてもボタンは消えない。** `theme.js` はフックとは別に
   自前の `DOMContentLoaded` でも `mount()` を呼ぶので、ヘッダーではなく画面左下に
   浮遊ボタン（`.theme-btn--float`）として出るだけになる。
2. **より本質的に、`theme.js` を読み込む限り `apply(saved() || system())` が走る。**
   `system()` は `prefers-color-scheme: light` なら `'light'` を返すので、**OS がライト
   設定の端末では記事が勝手にライトになる**。`prefers-color-scheme: light` で新規訪問を
   実測すると `data-theme=light` / 背景 `#eeedea` になった。ボタンだけ消すと、
   ライトになった人に戻す手段が無くなる。

なお **「記事だけテーマが変わる」という違和感の実際の発生経路は、ほぼこれだった**
可能性が高い。ボタンを押した覚えが無くても、OS がライトなら初回からライトで開く。

**案「`lesson-theme.css` の読み込みごと止める」は §44.1 のとおりダークが壊れる。**
やるなら先にダーク側 `:root` を記事の `<style>` か `style.css` へ移す必要があり、
「ファイルは残す」という趣旨から外れる。

## 44.3 実測（ダークが 1px も変わらないことの確認）

`:root` のカスタムプロパティ全件（38個）＋主要19要素の
`color / background / border / display / opacity` を、**現状ダークと停止後で比較**した。

| | 結果 |
|---|---|
| 差分 | **2件のみ — `data-theme` 属性（`dark` → 無し）と `.theme-btn` の有無** |
| トークン・要素の計算値 | **全一致** |
| OS がライト設定の端末 | **ダーク**（`data-theme` 無し、背景 `rgb(0,0,0)`、`color-scheme: dark`） |
| `localStorage` に旧 `light` が残る端末 | **ダーク**（キーは残るが読む人がいない。復活時に設定が戻る利点がある） |
| JS例外 / 404 | **0**。`layout.js` は `typeof window.__agMountThemeBtn === 'function'` でガード済み |
| `--key-line` / `--good-line` | **影響なし**。ダーク値は記事の `<style>` 側にある |
| 本文 860px / 可変レイアウト（§43） | **維持**。記事の `<style>` のレイアウト部分で、テーマとは独立 |

`.theme-btn` の CSS は死蔵になるが、復帰のために残す。HTML はキャッシュバスターの
対象外で `theme.js` 自体も無変更なので、`?v=` の更新は不要（§43.8）。

## 44.4 ライトの色設計は有効なまま（再開時に再調査しないこと）

停止しただけで、値は生きている。再開時は §41〜§43 をそのまま参照すればよい。

- **§41** — 「白い板」に見えた主因は面の段差ではなく**枠線**だったこと（枠/面 1.09〜1.58）。
  `--key-line` / `--good-line` のトークン化（ダーク専用値の直書きバグ）
- **§42** — 紙の地への温色化と、背景グローが**濁る**問題（実描画ピクセルでの採取手法）
- **§43** — 地の最終値 `#eeedea`（L\* 93.7 / R−B +4 / 白カードとの ΔL\* +6.3）、
  tint `.15`、枠線 `.22`、`--line-soft .10`、`--spill-*` の暖色寄せ `.05/.04/.03`

## 44.5 State（working tree — NOT committed/pushed）
更新 `html/phys-math_1-1.html`（`<script>` 1行をコメントアウト＋注記）、
`css/lesson-theme.css`（冒頭コメントのみ。**CSS の宣言は 1 行も変えていない**）、
`DESIGN.md`。
