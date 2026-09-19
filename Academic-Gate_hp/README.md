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

## Where things live

| Path | What |
|---|---|
| `DESIGN.md` | **The design system + full decision log.** Tokens (§2), type scale (§3), components (§5), the hero scroll choreography + particle parameters (§6), fallbacks (§7), per-page adaptation (§8), shared header/footer (§11), and the round-by-round deviation log (§13). §35 records the Archive Sphere / Peskin removal; **§36 is the 教材 (lesson-page) contract** — naming, what belongs in the shared CSS, the light/dark tokens, and the element-selector traps; **§37 is the 勉強の軌跡 hierarchy** — three levels, when to add a 科目 page, breadcrumbs, and how empty fields are shown; **§38 is the 分野 card grid** — why 3 columns, why `auto-fill`, and how a card without a link is shown; **§39 is the 科目 page** — why cards forced a fourth level, and what was retired with the accordion; **§41–§43 are the light theme** — why borders, not surface steps, made it look flat (§41), the paper ground and the glow that had to be warmed with it (§42), and the variable two-column layout that widens the body to 860px without starving 1024px (§43); **§44 is why the theme switch is off** and how to turn it back on; **§45 is the cache-buster check**; **§46.0 is the maths-on-narrow-screens verdict**, including the one writing rule above; **§47 is the 能力開発 branch** — how a figure's colours must follow mark *size* (§47.5), the `.card` name collision (§47.6), and why `<details>` needs `::details-content` to open in print (§47.7); **§48 makes every branch four levels** — a group and a chapter are headings, not pages (§48.1), the file-naming rule decides which layer is the 科目 (§48.2), and the slug is the URL while the display name is content (§48.3); **§49 adds the 技能 layer and rewrites §48.4's rule** — a classification is a heading but a container is a page (§49.1), and the invariant is that a card descends exactly one level, not that every branch has the same depth (§49.3, which also records why three rounds of restructuring happened). Read this first. |
| `css/style.css` | Single global stylesheet. **Design tokens are defined once at the top (`:root`)** — colors, type scale, spacing, radii, `--nav-clearance`. Everything else is grouped under numbered section comments. |
| `js/layout.js` | Injects the shared `<header>` + `<footer>` into every page from one source (loads before `main.js`; sets active nav from `data-page`; `<noscript>` fallback in each placeholder). |
| `js/scroll-scenes.js` | The hero engine — Three.js particle field, per-stage morph shader, scroll-driven opacity/formation. index.html only. |
| `js/main.js` | Hamburger menu + smooth anchor scroll (runs after `layout.js`). |
| `js/starfield.js` | Paints the static star field to `#starfield` once; repaints on debounced resize. On `body.is-article` it also thins the stars behind the reading columns (`main > section, .rail`). |
| `js/theme.js` | Light/dark switch — **currently switched off (§44)**: the article's `<script>` tag is commented out, so nothing ever sets `data-theme`. Re-enable by uncommenting that one line. 教材 pages only, never the six main pages (§20.4). |
| `css/lesson-theme.css` | The 教材 theme layer: light values declared with the **site's own token names**, with the lesson's `--ink` / `--line` names aliased onto them. Loaded **after** the page's own `<style>`. **Not a light-only file** — its dark `:root` is the only definition of `--ink` / `--line` / `--on-accent` / `--footer-bg` / `--rail-bg`, so dropping it breaks dark (§44.1). |
| `html/` | 13 pages. Every `<body>` carries `data-page` (drives nav active state); a reading page adds `class="is-article"` (§35). **勉強の軌跡 branches are as deep as their content needs.** 物理 is four levels — `study.html` → `study_physics.html` (分野) → `phys-math.html` (科目) → `phys-math_1-1.html` (記事). 能力開発 is **five**, because a 技能 holds several competing 教材シリーズ while a 物理 科目 holds one curriculum — `study.html` → `study_skills.html` (分野) → `skills_mnemonics.html` (技能) → `memoryverse.html` (科目) → `memoryverse_1-1.html` (記事) (§37.2, §49). **The invariant is not depth — it is that a card descends exactly one level and never skips** (§49.3). **A classification is an `h2`; a container is a page** (§49.1). The layer that owns the chapter/section numbering is the 科目, and that is what the article filename names (§49.2). Every level after the first is a **card grid** (§38). **Flat only**: a subdirectory breaks every relative nav link — the migration trigger and recipe are in §37.2. |
| `docs/stills/` | Visual-regression baseline screenshots (current build, desktop + mobile). |
| `tools/bump.sh` | Bumps the `?v=rNN` cache buster across every page + this README. Use it instead of editing versions by hand. |
| `tools/check-cachebust.sh` | Refuses a commit that edits `css`/`js` without bumping, or that leaves pages on different versions. Runs standalone too — see **Conventions** (§45). |
| `tools/hooks/` | Version-controlled git hooks. `git config core.hooksPath Academic-Gate_hp/tools/hooks` to enable. |
| `tools/fetch-memoryverse-images.sh` | Re-fetches the nine planet images into `image/memoryverse/`. Not needed normally — they are committed. Licences and the no-modification rule are in the script header (§47.8). |
| `image/` | All site images, one flat folder plus a subfolder per 教材 (`image/memoryverse/`). Pages reference it as `../image/…`. A subfolder here is fine; a subfolder under `html/` is not (§37.2). |

## Conventions

- **Assets are cache-busted** with `?v=rNN` query strings in the HTML. Bump the number when
  editing `css`/`js` so browsers refetch. (Current: **`r54`**.) **Do not do this by hand:**

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
