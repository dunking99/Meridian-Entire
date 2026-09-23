# UI Design review — context for continuing this project

## What this project is
11 candidate UI designs for the same product concept — a personal portfolio/finance
dashboard — built to compare against each other before committing to one direction.
Designs 1-4 are static Vite builds served from `UI-Design-N/dist/` on port 3000.
Designs 5-11 are Next.js apps, each on its own port (4005-4011). `start-all.sh`
(Mac/Linux) and `start-all.ps1` (Windows) boot everything plus a `viewer.html`
at `http://localhost:3000/viewer.html`.

## What's been done so far (in an earlier session, on Mac)
1. **Full visual review of all 11 designs** — screenshots at desktop width, clicked
   through each design's nav, judged purely on visual identity (not code). All 11
   turned out to share a "Meridian" private-markets-desk framing to varying degrees.
2. **Synthesized a "best of breed" component list** — for each page type (Overview,
   Holdings, Performance, Allocation, X-Ray, Activity, News, Research), identified
   which specific design did that component best, with reasoning for how picks
   from different designs would combine.
3. **Built three companion artifacts** (all hosted on claude.ai, so they're already
   accessible from any device — nothing to move):
   - **Tally** — a working synthesized mockup combining the best picks into one
     coherent product, with each borrowed pattern labeled by source design.
     https://claude.ai/code/artifact/99d8761e-cc90-424a-ba28-a23cbf8efe22
   - **Colorways** — 12 full alternate dashboard pages, each with its own distinct
     color scheme AND distinct layout (not just recolors), for evaluating color
     direction against the marketing goal below.
     https://claude.ai/code/artifact/15ea53a9-d829-43fb-9908-dfe4e7c548ca
   - **Layout Planner** — an empty wireframe tool (nav placement + 6 content
     skeletons, e.g. hero+rail, bento, split-screen) where each box can be labeled
     with which component goes there. Includes a reference drawer with the
     shortlisted ideas by job (hero, chart, holdings table, allocation, etc.),
     autosaves to the browser via localStorage.
     https://claude.ai/code/artifact/8bbd1d52-97f2-4556-9035-62baed21b732

## Key decisions / preferences established
- **Long-term vision: this product will be marketed**, not just personal use — so
  colour/positioning decisions should be judged on differentiation and target
  buyer, not personal taste alone.
- Leaning toward **light/warm-neutral as the base**, not dark-terminal — most of
  the 11 designs defaulted to a dark "trading desk" look, which is both crowded
  (Robinhood/crypto/Bloomberg-alikes) and a mismatch for a *personal* (not
  day-trading) framing. Warm/light reads as differentiated whitespace.
- Semantic gain/loss colour must stay separate from the brand accent colour
  (validated via the dataviz skill's contrast/colourblind-safety checker) —
  several of the original 11 designs reuse the same hue for both, which was
  flagged as a repeat weakness.
- Buy/sell colour convention should follow money-flow (cash out = neutral,
  cash in = gain-green), not "buy=bad/sell=good" — Design 4 had this inverted.

## Where things were left off
Working through the **Layout Planner** to pick a nav placement + content skeleton
for the Overview page, then filling in which component (by source design) goes in
each box — that decision isn't finalized yet. Once a skeleton is chosen, the next
natural step is applying it as a real high-fidelity mockup (like Tally, but with
the chosen layout skeleton instead of Tally's original one).

## Practical notes
- If you copied this folder from macOS, delete every `UI-Design-N/node_modules`
  before running `start-all.sh` / `start-all.ps1` again — native packages don't
  carry over between OSes; both scripts reinstall automatically on first run.
