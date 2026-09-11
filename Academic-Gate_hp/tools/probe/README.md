# Stage-7 GPU probe

A real-hardware frame-time harness for the stage-7 hero motif. It answers one question:
**does the currently-shipping stage-7 motif cost more GPU than the motif it replaced?**
SwiftShader (headless) clamps frame time and can't distinguish motif cost, so this gate must be
run on a **real GPU**, in a real browser — it can't be automated in the headless harness.

## What it measures

- **WORKING TREE** — the live engine: `_probe.html` loads the real `html/index.html` in an iframe,
  which loads `js/scroll-scenes.js` (today's stage-7 motif — the drift 流). Whatever ships, this measures.
- **BASELINE** — the frozen **orbits** engine: `_probe-orbits.html` loads `_probe-orbits.js`, a copy of
  the git-HEAD `scroll-scenes.js` at **3e942e0** (Round-24), the last engine before drift. This is the
  thing the current motif replaced.

Both iframes run the real page at a desktop-class width (1000px logical, so the motif is **not**
mobile-suppressed), scrolled to the stage-7 (closing) rest, at the same particle count on the same
machine. The readout is each page's **own telemetry** (`#telemetry .t-ms` / `.t-fps`), which uses the
GPU timer `EXT_disjoint_timer_query_webgl2` where the browser exposes it (WebGL2) and falls back to a
frame-time estimate otherwise — the "measurement path" row tells you which. **Absolute FPS varies by
machine; the delta between the two sides is the test.**

## How to run

1. Serve the repo over HTTP (paths are relative; `file://` won't load the iframes). From the repo root:
   `python3 -m http.server 8941`
2. Open **`http://localhost:8941/Academic-Gate_hp/tools/probe/_probe.html`** in a real browser on the
   **laptop's real GPU** (not headless / SwiftShader). Chrome/Edge expose the GPU timer.
3. Leave particles at **200k** (desktop's real count). Click **Measure WORKING TREE**, keep the tab
   focused, and let it run until **samples ≥ 60** (≈60s — long enough to catch thermal throttling).
   Then click **Measure BASELINE** and do the same.
4. Read the verdict (SHIP / MARGINAL / HOLD) — it's `working tree ≈ baseline`. Record the six numbers
   (frame-ms / FPS / FPS-min × working-tree/baseline), the **measurement path**, and the iframe width
   into **DESIGN.md** (see §28.4 for the sea's numbers and §30.11a for the drift's — same table form).

The probe is desktop/wide-class only; tall is derived in DESIGN (all changes are vertex-side and all
200k particles are processed every frame regardless of composition, so the wide number is an upper bound).

## Refreshing the baseline when a new motif is adopted

The baseline should always be **the motif the current one replaced**. When a new stage-7 motif ships and
you want the next probe to compare against today's drift (not orbits):

1. Freeze the then-current engine: `cp js/scroll-scenes.js tools/probe/_probe-baseline.js`
   (name it for the motif it captures, e.g. `_probe-drift-baseline.js`), and note the commit it was
   frozen at.
2. Point the baseline page at it: in `_probe-orbits.html` (rename it too if you like), change the last
   `<script src="_probe-orbits.js?v=orb">` to the new frozen file.
3. Update the labels in `_probe.html` — the `<div class="pathrow">…orbits · frozen @3e942e0</div>` line
   and the "The two sides" note — to name the new baseline and its commit.
4. Keep the old frozen baseline in git history; don't delete it (it documents that comparison).

## Files

- `_probe.html` — the harness UI (loads both sides in an iframe, reads their telemetry, renders a verdict).
- `_probe-orbits.html` — the baseline page (a copy of `html/index.html` that loads the frozen engine).
- `_probe-orbits.js` — the frozen orbits engine (git `scroll-scenes.js` @3e942e0). No relative paths;
  pulls Three.js 0.160.0 from the CDN like the real engine.
