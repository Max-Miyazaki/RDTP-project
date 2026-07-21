# Academic Gates

A physics grad student's homepage — a cinematic, scroll-driven cosmic WebGL experience.
Pure-black canvas, glowing particle fields, teal/cyan-dominant palette, large light geometric
type (Inter Tight + Noto Sans JP). Static site, no build step.

## Run it locally

The pages live in `html/` and reference assets one level up (`../css`, `../js`, `../pdf`), so
serve from the **project root** (this folder), not from `html/`:

```sh
cd Academic-Gate_hp
python3 -m http.server 8000
# then open:  http://localhost:8000/html/index.html
```

Any static file server works. Opening the files directly via `file://` mostly works, but the
Three.js CDN and PDF embeds behave better over `http://`.

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
| `DESIGN.md` | **The design system + full decision log.** Tokens (§2), type scale (§3), components (§5), the hero scroll choreography + particle parameters (§6), fallbacks (§7), per-page adaptation (§8), shared header/footer (§11), knowledge-map rebuild constraints (§11b), and the round-by-round deviation log (§13). Read this first. |
| `css/style.css` | Single global stylesheet. **Design tokens are defined once at the top (`:root`)** — colors, type scale, spacing, radii, `--nav-clearance`. Everything else is grouped under numbered section comments. |
| `js/layout.js` | Injects the shared `<header>` + `<footer>` into every page from one source (loads before `main.js`; sets active nav from `data-page`; `<noscript>` fallback in each placeholder). |
| `js/scroll-scenes.js` | The hero engine — Three.js particle field, per-stage morph shader, scroll-driven opacity/formation. index.html only. |
| `js/knowledge-graph.js` | study.html's 3D "Archive Sphere" knowledge map. **Being rebuilt from scratch — see DESIGN.md §11b for constraints; don't invest further here.** |
| `js/main.js` | Hamburger menu + smooth anchor scroll (runs after `layout.js`). |
| `js/starfield.js` | Paints the static star field to `#starfield` once; repaints on debounced resize. |
| `html/` | 11 pages. Every `<body>` carries `data-page` (drives nav active state). |
| `pdf/` | Section-note PDFs (Peskin QFT). Linked directly + embedded with a fallback. |
| `docs/stills/` | Visual-regression baseline screenshots (current build, desktop + mobile). |

## Conventions

- **Assets are cache-busted** with `?v=rNN` query strings in the HTML. Bump the number when
  editing `css`/`js` so browsers refetch. (Current: `r22`.)
- **Verify in a real browser**, not an editor preview. Baselines in `docs/stills/` were shot in
  headless Chrome (Apple GPU) and, for iOS, on a real device.
- Three.js is pinned to **0.160.0** (jsdelivr → unpkg fallback) to match what study.html expects.

## Known unknown

Desktop **Safari** rendering (particle ACES tone-mapping) is unverified at runtime — this
machine can't automate desktop Safari. iOS Safari was device-tested clean. See DESIGN.md §13
(Round-11).
