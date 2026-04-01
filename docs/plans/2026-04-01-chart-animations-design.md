# Chart Animations Design

**Date:** 2026-04-01  
**Status:** Approved

## Goal

Animate all interactive state changes across the four Chart.js charts so that transitions feel smooth rather than snapping instantly.

## Approach

Use Chart.js v4's built-in animation system — no extra packages. Two config keys control this:

- `animation` — controls data/scale transitions (initial draw, series show/hide morphs)
- `animations` — controls per-property transitions (e.g. `borderWidth` on hover)

All `chart.update('none')` calls are replaced with `chart.update()` so Chart.js uses the configured durations.

## Shared config applied to all affected charts

```ts
animation: { duration: 400, easing: 'easeOutQuart' },
animations: {
  borderWidth: { duration: 200, easing: 'easeOutQuart' },
},
```

## Per-chart changes

### SkillsChart.tsx

Two `chart.update('none')` calls:
1. Hover handler — borderWidth changes will animate via `animations.borderWidth`
2. Filter sync effect — dataset show/hide will fade via `animation`

The overlay canvas (crosshair + dot) remains instant — it is a manual canvas draw, not Chart.js state.

### ComplexityChart.tsx

One `chart.update('none')` call in the series toggle effect — replace with `chart.update()` for fade in/out.

### CategoryTrendChart.tsx

Currently destroys and rebuilds the chart on every year/compare button press. Refactor to update in-place:
- Build chart once on mount
- On year/compare change: swap `dataset.data`, add/remove compare dataset as needed, call `chart.update()`
- Radar shape morphs smoothly between years
- Label positions recalculated post-update via `requestAnimationFrame`

### PopulationChart.tsx

No interactive state changes. No modifications needed.

## Out of scope

- Animating the overlay canvas elements (crosshair line, hover dot) in SkillsChart — these are manual 2D canvas draws and are not part of Chart.js state
- CSS transitions on filter buttons (already have `transition: 'all 0.15s'`)
