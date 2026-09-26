# Academic Gates

A physics grad student's homepage — a cinematic, scroll-driven cosmic WebGL experience.
Pure-black canvas, glowing particle fields, teal/cyan-dominant palette, large light geometric
type (Inter Tight + Noto Sans JP). Static site, no build step.

## Run it locally

The pages live in `html/` and reference assets one level up (`../css`, `../js`), so
serve from the **project root** (this folder), not from `html/`:

```sh
cd Academic-Gate_hp
python3 -m http.server 8000
# then open:  http://localhost:8000/html/index.html
```

Any static file server works. Opening the files directly via `file://` mostly works, but the
Three.js CDN behaves better over `http://`.

## Deploying / pushing

**The git repository root is one level above this folder.** This folder is
`RDTP-project/Academic-Gate_hp/`; `git` commands run from `RDTP-project/`.

Published with **GitHub Pages** from `main` at `/` (repository root), so the live site is
served from the repo root, not from this folder. `../index.html` is a meta-refresh redirect
into `html/index.html`, and `../.nojekyll` disables Jekyll. Live URL:
<https://max-miyazaki.github.io/RDTP-project/>

**Push auth is HTTPS + a `gh` CLI token — not SSH.** No SSH key is registered for this
account (`ssh -T git@github.com` returns `Permission denied (publickey)`), so the remote stays
on `https://` and credentials come from the macOS keychain via the `gh` token.

The trap: `gh` can hold **several accounts at once**, and the keychain hands git whichever one
is active. If a push fails with

```
remote: Permission to Max-Miyazaki/RDTP-project.git denied to <other-account>.
fatal: ... error: 403
```

it is not a permissions problem on the repo — it is the wrong account being active. Check and
fix with:

```sh
gh auth status                          # which account is active?
gh auth switch --user Max-Miyazaki      # switch before pushing
```

Note that `git config user.name/user.email` is separate and can be correct while the *token* is
wrong — commit authorship will look right and the push will still 403.

## Adding a lesson page

Navigation (the right-hand site tree, the rail's "one level up" line and the prev/next
links at the end of an article) is generated from **one table**: `CRUMBS` in
`js/layout.js`. Adding a page is: write the file, add one line to the table, declare the
node on `<body>`, add a card on the series page.

**1 — copy an existing article.** `html/phys-math_1-2.html` (maths) or
`html/memoryverse_1-2.html` (no maths) are the current models. Keep `class="is-article"`,
the `.rail`, and the `.foot` block — the prev/next links are inserted right after `.foot`.
Then replace, in the copy: `<title>`, `<meta name="description">`, the rail's
`.brand` (title + `SECTION …` line), the hero `<h1>`/lead, the rail `.toc` list and the
section ids it points at. Everything else in the copy can stay.

**2 — add one line to `CRUMBS` (`js/layout.js`).** Put it in reading order: the table's
order *is* the prev/next order, so inserting a row in the middle re-links its neighbours.

```js
'phys-math_2-1': { label: 'SECTION 2-1', href: 'phys-math_2-1.html', parent: 'phys-math:ch2',
                   title: '2-1　積分の基礎' },
```

| Field | Meaning |
|---|---|
| key | anything unique; the file's stem is the convention |
| `label` | short name, used in the rail's "← one level up" line |
| `title` | full name, used in the tree and in prev/next (falls back to `label`) |
| `href` | the file name. **Leave it out and set `soon: true`** for an article you have announced but not written — it shows as "（準備中）", greyed out, and becomes a link the moment you add `href` |
| `parent` | the key of the level above. A chapter with no page of its own is just a row with no `href` (e.g. `'phys-math:ch2': { label: '2章 積分', parent: 'phys-math' }`) |
| `unit` | only on a *series* row (`phys-math`, `memoryverse`): the word used in prev/next — `'記事'` or `'回'` |

**3 — declare the node on `<body>`.** `data-page` stays as it is (it drives the header
highlight); `data-node` is the new one.

```html
<body data-page="study" class="is-article" data-node="phys-math_2-1">
```

**4 — add a card on the series page** (`phys-math.html` / `memoryverse.html`). This is the
only part not generated: the cards carry a one-line description that the table does not hold.

**5 — bump the cache-buster only if you touched `css/` or `js/`.** Adding a page does not
need a bump; editing `layout.js` (i.e. the table) does.

```sh
sh Academic-Gate_hp/tools/bump.sh          # r56 → r57 across every page + README
sh Academic-Gate_hp/tools/check-cachebust.sh
```

**What you do *not* write:** the breadcrumb, the rail's "← one level up" line, the tree
entry, and the prev/next links at the end of the article. All four come from the table.

**If you forget the table entry** the page still works — `layout.js` bails out on an
unknown `data-node`, so you get no site-nav tab, no "one level up" line and no prev/next,
but no error and no broken link. Same if you forget `data-node`.

## Where things live

| Path | What |
|---|---|
| `DESIGN.md` | **The design system + full decision log.** Tokens (§2), type scale (§3), components (§5), the hero scroll choreography + particle parameters (§6), fallbacks (§7), per-page adaptation (§8), shared header/footer (§11), and the round-by-round deviation log (§13). §35 records the Archive Sphere / Peskin removal; **§36 is the 教材 (lesson-page) contract** — naming, what belongs in the shared CSS, the light/dark tokens, and the element-selector traps; **§37 is the 勉強の軌跡 hierarchy** — three levels, when to add a 科目 page, breadcrumbs, and how empty fields are shown; **§38 is the 分野 card grid** — why 3 columns, why `auto-fill`, and how a card without a link is shown; **§39 is the 科目 page** — why cards forced a fourth level, and what was retired with the accordion; **§41–§43 are the light theme** — why borders, not surface steps, made it look flat (§41), the paper ground and the glow that had to be warmed with it (§42), and the variable two-column layout that widens the body to 860px without starving 1024px (§43); **§44 is why the theme switch is off** and how to turn it back on; **§45 is the cache-buster check**; **§46.0 is the maths-on-narrow-screens verdict**, including the one writing rule above; **§47 is the 能力開発 branch** — how a figure's colours must follow mark *size* (§47.5), the `.card` name collision (§47.6), and why `<details>` needs `::details-content` to open in print (§47.7); **§48 makes every branch four levels** — a group and a chapter are headings, not pages (§48.1), the file-naming rule decides which layer is the 科目 (§48.2), and the slug is the URL while the display name is content (§48.3); **§49 adds the 技能 layer and rewrites §48.4's rule** — a classification is a heading but a container is a page (§49.1), and the invariant is that a card descends exactly one level, not that every branch has the same depth (§49.3, which also records why three rounds of restructuring happened); **§50 renames a 分野 without touching a single URL** — Latin belongs in the `.eyebrow` tier, and the constraint on a long name turned out to be the card heading and `h1`, not the breadcrumb (§50.1); **§51 splits a lesson page in two** — `grep` every `§NN` but scope it to `<main>` because DESIGN's own section numbers live in the comments (§51.2), and prove "nothing else changed" with a verbatim text diff rather than by eye (§51.3); **§52 is why lesson images must be vendored** — Wikimedia now serves only a fixed set of thumbnail widths (120/250/500/1280; everything else is a 400), so an external `onerror` chain is insurance, never a plan (§52.1), and `1fr` grid tracks refuse to shrink below min-content, which pushes long stat boxes outside their card (§52.2); **§53 puts geographic pins on those maps** — never guess a map's projection: read the printed graticule (Mars' MOLA map turns out to be linear in longitude and **Mercator** in latitude, §53.2), map the pin against the *image* rect rather than the frame, which `min-height` makes taller (§53.3), raise the leader-line SVG above the image or every pin hides under it (§53.4), and add the missing *upper* clearance to the radial layout — a label at `data-ang="90"` was covering the ［外観／地図］ toggle and made it unclickable, which `elementFromPoint` found and eyeballing did not (§53.5). **§54 moves those labels onto the enlarged map** — place them by a default rule and hand-fix only the pairs that measurably overlap (§54.2), give an overlay label `pointer-events:none` or it eats the card's own clicks (§54.4), and remember that a `@media` block adds no specificity, so an equally-specific rule inside one silently wins (§54.6). **§55 draws the graticule with the same formulas used to calibrate the pins** — never bake the grid into the image, because a drifted line then means a drifted calibration and you can check it by eye (§55.2), and Mars' overlay landing exactly on the map's own printed graticule is what finally proved the Mercator fit (§55.3). **§56 splits "the map" from "the answers"** — the picture and its graticule show whenever the map layer is on, but the pins and labels only when the card is open, or the drill gives itself away (§56.1); it also records that a blanket selector replace silently un-scoped a rule inside a `@media` block, which only showed up at 560px (§56.1), and that an `<svg>` has no `offsetParent`, so visibility checks on it must use `getComputedStyle` (§56.3). **§57 rebuilds the same lesson's "appearance" view so it cannot be confused with round 1's** — when two pages must not blend, drop the earlier layout's signature entirely rather than keeping both behind a flag (§57.1), size a three-column readout with `clamp()` instead of breakpoints (§57.3), and remember that a percentage `max-width` on a grid child resolves against its own track, not the row (§57.3). **§58 replaces that row's axis with chips** — one axis drawn the same way cannot carry real values, ordinal steps and plain rank at once, because the gap between marks then means three different things (§58.1), and giving the chips the full row width (label and value on their own line above) is what keeps every row on a single line down to 390px (§58.3). **§59 swaps two of those six measures** (surface age and exploration stage out, core size and resurfacing in) and records that the row markup needed no change at all — separating the row's *shape* from its *data* is what let the syllabus change without breaking the layout (§59.1). **§61 turns each measure into a framed card with a per-item background animation** — the round-1 spinning ring is re-derived for a rounded rectangle by putting the mask on the parent and the rotation on the child (§61.2), and the contrast claim is measured by hiding the text, diffing the effect layer on/off and reading the most-brightened pixel — measuring the brightest pixel instead just finds the border or the fixed header (§61.4). **§62 adds real units to those measures and rebuilds three of the animations** — a single-sourced figure gets verified before it ships (Mars' "1,500 nT" turned out to be an orbital-altitude value, not a surface one, §62.2), and stacked translucent layers compose multiplicatively, so the fix is usually to move a layer off the dense part rather than to dim everything (§62.4). **§63 moves the whole "appearance" layer from round 2 into round 1** — the same fact must live in one lesson only, so a misplaced feature is moved, not rebuilt (§63.1); fitting a 9th radial box means looking for angular room where boxes separate *vertically*, and trimming the new box's text beats enlarging the radius (§63.2); and deleting a toggle strips the event that used to trigger the redraw, so the lazy image's own `load` has to take over (§63.3). **§64 replaces the internal layer codes with names and adds the way back** — an internal symbol that leaks into prose has to be rewritten, not find-and-replaced, because a relation like "L3↔L2" only becomes a sentence once you say what the doorway is for (§64.1); and when two floating buttons must sit side by side, move the fixed position onto a wrapper so neither button needs to know the other's width (§64.2). **§65 replaces every hand-written breadcrumb with one table in `layout.js` and a right-side site-tree drawer** — a breadcrumb that scrolls out of view is the same as no breadcrumb, so the site's structure moved to a fixed drawer while the left rail keeps the in-article contents (§65.2); declaring the page's own node is enough because pages that declare nothing get nothing (§65.3); and `grid-template-rows: 0fr → 1fr` animates a subtree open without knowing its height (§65.3); **§66 generates the prev/next links from that same table** — the neighbours of an article are whatever the table says they are, so adding a page re-links the ones on either side of it by itself, and an unknown `data-node` is silently ignored rather than breaking the page (§66.3); **§67 puts the same 「← 一つ上」 line on the rail-less list pages** and records the trap that found — this site has **two disjoint token sets**, and `--ink*`/`--line*` exist only in `lesson-theme.css`, so a shared component in `style.css` that names one gets an *invalid* `var()` on every non-lesson page, which falls back to the inherited value (white text) and to `currentColor` (white borders) rather than to nothing; always give those references a `style.css` fallback (§67.1, which also records that the already-shipped §65 drawer had the same defect); **§68 is the hover pass** — when a hover changes the border but not the text, suspect a specificity loss rather than a missing rule, because one declaration block can be half-overridden (§68.3); `prefers-reduced-motion` needs an explicit `transform: none`, since the global rule only zeroes the *duration* and leaves the movement as a jump (§68.4); every hover belongs inside `@media (hover: hover)` or it sticks after a tap on touch (§68.4); and an unclosed `@media` at a file's end renders fine but silently swallows whatever is appended next (§68.5); **§69 makes that back-link a bordered pill and drops study.html's numbered eyebrows** — a small control should not borrow the cards' corner radius, or it reads as a miniature card (§69.1), and adding a border eats the perceived gap, so spacing set for a bare text line has to be re-measured afterwards (§69.1); **§70 unifies every pressable surface's hover** — a rounded rectangle cannot be lit by rotating the element (the corners rotate with it), so register the `conic-gradient`'s own start angle with `@property` and animate that (§70.3); keep the `animation` inside `:hover` so only the card under the cursor spins (§70.3); and never hand `position: relative` to a group of selectors wholesale — it silently overrode a `fixed` tab and dropped it to the end of the page, which an existence check cannot see (§70.4); **§71 re-picks the hover's strength by drawing it** — an effect's alpha cannot be chosen relative to another effect (“half as strong as the ring”) because the two sit on grounds of different brightness; decide it against the ground it will actually be drawn on (§71.1), and note that a black drop shadow buys nothing on a black ground (§71.2); **§72 colours the back-link's light with `--spec-teal`** — to lengthen a comet arc, widen the *bright* band, not the transparent run-up, because the faint tail reads as nothing (§72.2), and on a pill the same angular span covers wildly different amounts of edge depending on phase, so judge it across several frozen phases rather than one (§72.2); **§73 settles on one glow colour, `--spec-glow` #5fd0ff** — hue 170° reads as green on black however “cyan” it looks in a swatch, so pick the hue against the ground (§73.1); with one colour shared, the *manner* of the light carries the meaning (whole border = go back, rotating arc = go forward, §73.2); and “stop the motion” is not “remove the light” — under `prefers-reduced-motion` swap the conic for a flat fill instead of hiding the pseudo-element (§73.4); **§74 cuts the hover down to a single form** — one uniform glowing border for every pressable surface, which let the whole rotation apparatus (`@property --edge-a`, `@keyframes edgeSpin`, the conic background and the reduced-motion overrides that existed only to stop it) be deleted; §74.2 lists what went and the two greps that prove nothing was left behind; **§75 inverts the card headings and shows 「準備中」 instead of coding it in colour** — the unwritten subjects are not pages, so they have no CRUMBS row and the markup's own “is it an `<a>`?” is the only source of truth (§75.3); §75.4 lists the 16 cards; and a 12px label at `--text-tertiary` is 3.71:1, which fails AA — it went to `--text-secondary` (§75.5). Read this first. |
| `css/style.css` | Single global stylesheet. **Design tokens are defined once at the top (`:root`)** — colors, type scale, spacing, radii, `--nav-clearance`. Everything else is grouped under numbered section comments. |
| `js/layout.js` | Injects the shared `<header>` + `<footer>` into every page from one source (loads before `main.js`; sets active nav from `data-page`; `<noscript>` fallback in each placeholder). |
| `js/scroll-scenes.js` | The hero engine — Three.js particle field, per-stage morph shader, scroll-driven opacity/formation. index.html only. |
| `js/main.js` | Hamburger menu + smooth anchor scroll (runs after `layout.js`). |
| `js/starfield.js` | Paints the static star field to `#starfield` once; repaints on debounced resize. On `body.is-article` it also thins the stars behind the reading columns (`main > section, .rail`). |
| `js/theme.js` | Light/dark switch — **currently switched off (§44)**: the article's `<script>` tag is commented out, so nothing ever sets `data-theme`. Re-enable by uncommenting that one line. 教材 pages only, never the six main pages (§20.4). |
| `css/lesson-theme.css` | The 教材 theme layer: light values declared with the **site's own token names**, with the lesson's `--ink` / `--line` names aliased onto them. Loaded **after** the page's own `<style>`. **Not a light-only file** — its dark `:root` is the only definition of `--ink` / `--line` / `--on-accent` / `--footer-bg` / `--rail-bg`, so dropping it breaks dark (§44.1). |
| `html/` | 15 pages. Every `<body>` carries `data-page` (drives nav active state); a reading page adds `class="is-article"` (§35). **勉強の軌跡 branches are as deep as their content needs.** 物理 is four levels — `study.html` → `study_physics.html` (分野) → `phys-math.html` (科目) → `phys-math_1-1.html` (記事). 精神の圏域 (Orbis Mentis, formerly 能力開発) is **five**, because a 技能 holds several competing 教材シリーズ while a 物理 科目 holds one curriculum — `study.html` → `study_skills.html` (分野) → `skills_mnemonics.html` (技能) → `memoryverse.html` (科目) → `memoryverse_1-1.html` (記事) (§37.2, §49). **The invariant is not depth — it is that a card descends exactly one level and never skips** (§49.3). **A classification is an `h2`; a container is a page** (§49.1). The layer that owns the chapter/section numbering is the 科目, and that is what the article filename names (§49.2). Every level after the first is a **card grid** (§38). **Flat only**: a subdirectory breaks every relative nav link — the migration trigger and recipe are in §37.2. |
| `docs/stills/` | Visual-regression baseline screenshots (current build, desktop + mobile). |
| `tools/bump.sh` | Bumps the `?v=rNN` cache buster across every page + this README. Use it instead of editing versions by hand. |
| `tools/check-cachebust.sh` | Refuses a commit that edits `css`/`js` without bumping, or that leaves pages on different versions. Runs standalone too — see **Conventions** (§45). |
| `tools/hooks/` | Version-controlled git hooks. `git config core.hooksPath Academic-Gate_hp/tools/hooks` to enable. |
| `tools/fetch-memoryverse-images.sh` | Re-fetches the nine planet images into `image/memoryverse/`. Not needed normally — they are committed. Licences and the no-modification rule are in the script header (§47.8). |
| `image/` | All site images, one flat folder plus a subfolder per 教材 (`image/memoryverse/`). Pages reference it as `../image/…`. A subfolder here is fine; a subfolder under `html/` is not (§37.2). |

## Conventions

- **Assets are cache-busted** with `?v=rNN` query strings in the HTML. Bump the number when
  editing `css`/`js` so browsers refetch. (Current: **`r99`**.) **Do not do this by hand:**

      sh Academic-Gate_hp/tools/bump.sh        # r53 → r54, every page + this README
      sh Academic-Gate_hp/tools/bump.sh 60     # or jump to a specific number

  This rule was silently broken once (§41–§42 shipped a rewritten `lesson-theme.css` on a stale
  `r52`), so it is now **checked mechanically**. Enable the hook once per clone:

      git config core.hooksPath Academic-Gate_hp/tools/hooks

  The hook refuses a commit that changes `css/` or `js/` without a bump, and one that leaves the
  pages on different versions. **Not using hooks?** The same check runs standalone and is the one
  thing to run before pushing a CSS/JS change:

      sh Academic-Gate_hp/tools/check-cachebust.sh

  CSS comment-only edits are exempt; `git commit --no-verify` skips it. Details in DESIGN.md §45.
- **Verify in a real browser**, not an editor preview. Baselines in `docs/stills/` were shot in
  headless Chrome (Apple GPU) and, for iOS, on a real device.
- Three.js is pinned to **0.160.0** (jsdelivr → unpkg fallback), loaded from one place only —
  `js/scroll-scenes.js`'s `loadThree()`, for `index.html`. See DESIGN.md §11b.
- **Writing the maths in a 教材 page?** One rule, from DESIGN.md **§46.0 ②**: a chain of two or
  more `=` goes in `\[ … \]`, never in inline `\( … \)`. Inline maths cannot scroll — `overflow-x`
  only applies to display containers — so on a phone an inline derivation is simply cut off and
  unreachable. Single values and symbols (`\(f(5)=25\)`) stay inline. §46.0 has the markup pattern.
- **Splitting a lesson page?** Read DESIGN.md §51. Two things save you: `grep` every `§NN`
  cross-reference but **scope the search to `<main>`** — roughly 20 of the 64 hits in a lesson page
  are DESIGN's own section numbers sitting in the CSS/JS comments, and a blind replace silently
  breaks them (§51.2); and prove the untouched body is really untouched with a **verbatim text
  diff** of the rendered prose, then explain every diff block one by one (§51.3).
- **Adding a 教材 page?** Read DESIGN.md §36 first (§36.0 lists what to read before writing). The
  three traps that cost time: `style.css` styles
  the bare `header` / `footer` elements (so a lesson's own `<header>` becomes the floating nav pill);
  the shared `body.is-article` column rules out-specify a page's own layout unless it goes through
  `.main`; and a raw `<` in TeX starts an HTML tag when a letter follows it (`0<a` breaks, `0<\theta`
  is fine). **Also grep every class name in the page against `css/style.css` before importing** —
  `.card` / `.hero` / `.btn` are live site components and a lesson that reuses the name inherits
  hover glows and flex layout it never asked for (§47.6).

## Known unknown

Desktop **Safari** rendering (particle ACES tone-mapping) is unverified at runtime — this
machine can't automate desktop Safari. iOS Safari was device-tested clean. See DESIGN.md §13
(Round-11).
