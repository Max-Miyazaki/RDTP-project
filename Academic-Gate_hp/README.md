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
| `DESIGN.md` | **The design system + full decision log.** Tokens (§2), type scale (§3), components (§5), the hero scroll choreography + particle parameters (§6), fallbacks (§7), per-page adaptation (§8), shared header/footer (§11), and the round-by-round deviation log (§13). §35 records the Archive Sphere / Peskin removal; **§36 is the 教材 (lesson-page) contract** — naming, what belongs in the shared CSS, the light/dark tokens, and the element-selector traps; **§37 is the 勉強の軌跡 hierarchy** — three levels, when to add a 科目 page, breadcrumbs, and how empty fields are shown; **§38 is the 分野 card grid** — why 3 columns, why `auto-fill`, and how a card without a link is shown; **§39 is the 科目 page** — why cards forced a fourth level, and what was retired with the accordion. Read this first. |
| `css/style.css` | Single global stylesheet. **Design tokens are defined once at the top (`:root`)** — colors, type scale, spacing, radii, `--nav-clearance`. Everything else is grouped under numbered section comments. |
| `js/layout.js` | Injects the shared `<header>` + `<footer>` into every page from one source (loads before `main.js`; sets active nav from `data-page`; `<noscript>` fallback in each placeholder). |
| `js/scroll-scenes.js` | The hero engine — Three.js particle field, per-stage morph shader, scroll-driven opacity/formation. index.html only. |
| `js/main.js` | Hamburger menu + smooth anchor scroll (runs after `layout.js`). |
| `js/starfield.js` | Paints the static star field to `#starfield` once; repaints on debounced resize. On `body.is-article` it also thins the stars behind the reading columns (`main > section, .rail`). |
| `js/theme.js` | Light/dark switch — **教材 pages only**, never the six main pages (§20.4). Loaded synchronously in `<head>`; `layout.js` calls `window.__agMountThemeBtn()` to place the button in the shared header. |
| `css/lesson-theme.css` | The 教材 theme layer: light values declared with the **site's own token names**, with the lesson's `--ink` / `--line` names aliased onto them. Loaded **after** the page's own `<style>`. |
| `html/` | 9 pages. Every `<body>` carries `data-page` (drives nav active state); a reading page adds `class="is-article"` (§35). **勉強の軌跡 is four levels** — `study.html` (分野一覧) → `study_<field>.html` (分野) → `<subject>.html` (科目) → `<subject>_<chapter>-<section>.html` (記事), e.g. `study_physics.html` → `phys-math.html` → `phys-math_1-1.html` (§37.2, §39.1). Every level after the first is a **card grid** (§38). **Flat only**: a subdirectory breaks every relative nav link — the migration trigger and recipe are in §37.2. |
| `docs/stills/` | Visual-regression baseline screenshots (current build, desktop + mobile). |

## Conventions

- **Assets are cache-busted** with `?v=rNN` query strings in the HTML. Bump the number when
  editing `css`/`js` so browsers refetch. (Current: **`r53`**.)
- **Verify in a real browser**, not an editor preview. Baselines in `docs/stills/` were shot in
  headless Chrome (Apple GPU) and, for iOS, on a real device.
- Three.js is pinned to **0.160.0** (jsdelivr → unpkg fallback), loaded from one place only —
  `js/scroll-scenes.js`'s `loadThree()`, for `index.html`. See DESIGN.md §11b.
- **Adding a 教材 page?** Read DESIGN.md §36 first. The three traps that cost time: `style.css` styles
  the bare `header` / `footer` elements (so a lesson's own `<header>` becomes the floating nav pill);
  the shared `body.is-article` column rules out-specify a page's own layout unless it goes through
  `.main`; and a raw `<` in TeX starts an HTML tag when a letter follows it (`0<a` breaks, `0<\theta`
  is fine).

## Known unknown

Desktop **Safari** rendering (particle ACES tone-mapping) is unverified at runtime — this
machine can't automate desktop Safari. iOS Safari was device-tested clean. See DESIGN.md §13
(Round-11).
