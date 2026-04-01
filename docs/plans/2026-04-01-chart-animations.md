# Chart Animations Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Animate all interactive state changes across the Chart.js charts so transitions feel smooth rather than snapping instantly.

**Architecture:** Add Chart.js v4's built-in `animation` / `animations` config to all affected charts, replace `chart.update('none')` with `chart.update()`, and refactor `CategoryTrendChart` to update data in-place instead of destroying and rebuilding the chart on each year/compare change.

**Tech Stack:** Chart.js v4.4.4, React 19, Astro 5.x — all files are in `src/components/`

---

### Task 1: Animate hover highlight in SkillsChart

SkillsChart manually changes `ds.borderWidth` on hover and calls `chart.update('none')`, which snaps instantly. Adding `animations.borderWidth` to the Chart.js config and changing to `chart.update()` will make it tween smoothly.

**Files:**
- Modify: `src/components/SkillsChart.tsx`

**Step 1: Add `animations` config to the chart options**

In `SkillsChart.tsx`, find the `options` object inside the `config` passed to `new Chart(ctx, config)` (around line 331). It already has:

```ts
animation: { duration: 200 },
```

Replace that line with:

```ts
animation: { duration: 400, easing: 'easeOutQuart' },
animations: {
  borderWidth: { duration: 200, easing: 'easeOutQuart' },
},
```

**Step 2: Change hover update call from `'none'` to animated**

In `handleInteraction` (around line 276), there are two `chart.update('none')` calls — one for the hover-off branch and one for the hover-on branch. Change both from:

```ts
chart.update('none');
```

to:

```ts
chart.update();
```

**Step 3: Verify manually**

Run `npm run dev` from the repo root. Open `http://localhost:4321`. Hover over lines in the skills chart — the hovered line should smoothly thicken rather than snap.

**Step 4: Commit**

```bash
git add src/components/SkillsChart.tsx
git commit -m "feat: animate hover highlight in SkillsChart"
```

---

### Task 2: Animate filter/category toggle in SkillsChart

When categories or skills are toggled, the sync effect calls `chart.update('none')`, hiding/showing datasets instantly. Changing to `chart.update()` makes datasets fade in/out.

**Files:**
- Modify: `src/components/SkillsChart.tsx`

**Step 1: Change the filter sync update call**

Find the `useEffect` that syncs `activeCategories` / `hiddenSkills` (around line 429). It ends with:

```ts
chart.update('none');
```

Change it to:

```ts
chart.update();
```

**Step 2: Verify manually**

In the dev server, toggle category filter buttons — lines should fade in/out rather than snap.

**Step 3: Commit**

```bash
git add src/components/SkillsChart.tsx
git commit -m "feat: animate category/skill filter toggles in SkillsChart"
```

---

### Task 3: Animate series toggle in ComplexityChart

ComplexityChart's series visibility toggle calls `chart.update('none')`. Adding the animation config and switching to `chart.update()` gives a fade effect.

**Files:**
- Modify: `src/components/ComplexityChart.tsx`

**Step 1: Add animation config to chart options**

In `ComplexityChart.tsx`, find the options object (around line 72). It already has:

```ts
animation: { duration: 300 },
```

Replace with:

```ts
animation: { duration: 400, easing: 'easeOutQuart' },
```

**Step 2: Change the visibility sync update call**

Find the `useEffect` that syncs `hidden` state to the chart (around line 133). It ends with:

```ts
chart.update('none');
```

Change it to:

```ts
chart.update();
```

**Step 3: Verify manually**

Toggle series buttons in the Complexity chart — lines should fade in/out smoothly.

**Step 4: Commit**

```bash
git add src/components/ComplexityChart.tsx
git commit -m "feat: animate series toggles in ComplexityChart"
```

---

### Task 4: Refactor CategoryTrendChart to update in-place

Currently the chart is destroyed and rebuilt on every year/compare button press. This causes a full redraw flash. Refactor to update data in-place so the radar shape morphs smoothly.

**Files:**
- Modify: `src/components/CategoryTrendChart.tsx`

**Step 1: Extract a dataset factory helper**

At the top of the component function (before `buildChart`), add two small helpers that produce dataset objects — one for the primary year (gold), one for the compare year (muted). These will be reused for both the initial build and in-place updates.

```ts
function makePrimaryDataset(avgs: number[], year: number) {
  return {
    label: String(year),
    data: avgs,
    borderColor: '#FFCD68',
    backgroundColor: 'rgba(255,205,104,0.15)',
    borderWidth: 2.5,
    pointRadius: 4,
    pointBackgroundColor: '#FFCD68',
    pointBorderColor: '#1E1E1E',
    pointBorderWidth: 2,
    pointHoverRadius: 7,
    fill: true,
  };
}

function makeCompareDataset(avgs: number[], year: number) {
  return {
    label: String(year),
    data: avgs,
    borderColor: 'rgba(148,163,184,0.6)',
    backgroundColor: 'rgba(148,163,184,0.08)',
    borderWidth: 1.5,
    borderDash: [4, 4],
    pointRadius: 3,
    pointBackgroundColor: 'rgba(148,163,184,0.6)',
    pointBorderColor: '#1E1E1E',
    pointBorderWidth: 1.5,
    pointHoverRadius: 6,
    fill: true,
  };
}
```

These are plain functions inside the module (outside the component), not hooks.

**Step 2: Update `buildChart` to use the helpers and set animation config**

In `buildChart`, replace the inline dataset objects:

```ts
const datasets: any[] = [makePrimaryDataset(primaryAvgs, selectedYear)];

if (compareYear !== null && compareYear !== selectedYear) {
  const compareAvgs = computeAvgs(skills, compareYear);
  datasets.push(makeCompareDataset(compareAvgs, compareYear));
}
```

Also update the animation config in the chart options. The current options have:

```ts
animation: { duration: 300 },
```

Replace with:

```ts
animation: { duration: 400, easing: 'easeOutQuart' },
```

**Step 3: Add a separate `updateChart` function**

Add a new `useCallback` called `updateChart` that updates the existing chart in-place:

```ts
const updateChart = useCallback(() => {
  const chart = chartRef.current;
  if (!chart || !skills.length) return;

  const primaryAvgs = computeAvgs(skills, selectedYear);
  chart.data.datasets[0] = makePrimaryDataset(primaryAvgs, selectedYear) as any;

  if (compareYear !== null && compareYear !== selectedYear) {
    const compareAvgs = computeAvgs(skills, compareYear);
    if (chart.data.datasets.length > 1) {
      chart.data.datasets[1] = makeCompareDataset(compareAvgs, compareYear) as any;
    } else {
      chart.data.datasets.push(makeCompareDataset(compareAvgs, compareYear) as any);
    }
  } else {
    chart.data.datasets.splice(1);
  }

  chart.update();
  requestAnimationFrame(() => updateLabelPositions());
}, [skills, selectedYear, compareYear, updateLabelPositions]);
```

**Step 4: Wire up the effects**

Replace the single `useEffect` that calls `buildChart` with two effects:

```ts
// Build chart once when skills load or screen size changes
useEffect(() => {
  buildChart();
  return () => { chartRef.current?.destroy(); chartRef.current = null; };
}, [skills, isMobile]);

// Update data in-place when year selection changes
useEffect(() => {
  if (!chartRef.current) return;
  updateChart();
}, [selectedYear, compareYear, updateChart]);
```

The key change: `buildChart` no longer depends on `selectedYear`, `compareYear`, or `updateLabelPositions` — remove them from its `useCallback` deps. It only rebuilds when skills load or on mobile breakpoint change. Year changes go through `updateChart` instead.

**Step 5: Verify manually**

Click year buttons and compare buttons — the radar polygon should smoothly morph between shapes rather than flashing.

**Step 6: Commit**

```bash
git add src/components/CategoryTrendChart.tsx
git commit -m "feat: animate radar year/compare transitions in CategoryTrendChart"
```

---

## Done

All four interaction types are now animated:
- Hover highlight (SkillsChart line thickness)
- Filter/category toggles (SkillsChart series show/hide)
- Series toggles (ComplexityChart)
- Year/compare switching (CategoryTrendChart radar morph)
