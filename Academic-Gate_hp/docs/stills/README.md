# docs/stills — 見た目の基準の画面（Visual-regression baselines）

撮影：headless Chrome（Apple M5、ANGLE Metal）。desktop は 1440×900、mobile は 375×812（2倍）。粒子は場面ごとに8秒待って形が落ち着いてから。

## いまの基準（2026-11、DESIGN.md §135）
| ファイル | 内容 |
|---|---|
| `home-01-seed-*` 〜 `home-06-step-*` | ホームの6つの場面（種・根・学問の樹・私の枝・実り・一歩） |
| `home-static-*` | 動きを減らす設定のホーム全体（静的な SVG と CSS の絵。WebGL 無しも同じ） |
| `self-intro-research-*` | 自己紹介の 02 — RESEARCH（研究の階層。js/research.js、ホームの 04 と共通） |
| `interior-*` | 勉強の軌跡・教材のページ（ホームの作り直しでは変えていない） |

## 履歴
`01-*`〜`17-*`、`mobile-*`、`r17-*`〜`r30-*`、`s-*`、`s14-*` は旧ホーム（scroll-scenes.js、DESIGN.md §6・§14〜§34）の基準。
DESIGN.md から名前で参照されているので、消さずに残してある。いまのホームとは一致しない。
