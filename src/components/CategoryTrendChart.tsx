import { useRef, useState, useCallback, useEffect } from 'react';
import {
  Chart,
  RadarController,
  RadialLinearScale,
  LineElement,
  PointElement,
  Filler,
  Tooltip,
} from 'chart.js';
import { useMediaQuery } from './useMediaQuery';
import { CATEGORIES, CATEGORY_KEYS, CATEGORY_LABELS } from '../constants/chart';
import { useFetchJson } from '../hooks/useFetchJson';
import { tooltipStyle } from '../utils/chartDefaults';

Chart.register(RadarController, RadialLinearScale, LineElement, PointElement, Filler, Tooltip);

const CAT_KEYS = CATEGORY_KEYS;
const CAT_LABELS = CATEGORY_LABELS;

const PRESET_YEARS = [1970, 1980, 1990, 2000, 2010, 2020, 2026];

interface SkillData {
  category: string;
  values: Record<string, number>;
}

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

function computeAvgs(skills: SkillData[], year: number): number[] {
  return CAT_KEYS.map(key => {
    const catSkills = skills.filter(s => s.category === key);
    const vals = catSkills.map(s => s.values[String(year)] ?? 0);
    return vals.length ? Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 100) / 100 : 0;
  });
}

// Compute label positions around the radar — same geometry Chart.js uses
function getLabelPositions(cx: number, cy: number, radius: number, count: number, offset: number) {
  const positions: { x: number; y: number; anchor: string }[] = [];
  for (let i = 0; i < count; i++) {
    const angle = (2 * Math.PI * i) / count - Math.PI / 2;
    const x = cx + Math.cos(angle) * (radius + offset);
    const y = cy + Math.sin(angle) * (radius + offset);
    // Determine text anchor based on position
    let anchor = 'center';
    if (x < cx - 10) anchor = 'right';
    else if (x > cx + 10) anchor = 'left';
    positions.push({ x, y, anchor });
  }
  return positions;
}

export default function CategoryTrendChart() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<Chart | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const justBuiltRef = useRef(false);
  const [selectedYear, setSelectedYear] = useState(2026);
  const [compareYear, setCompareYear] = useState<number | null>(2000);
  const selectedYearRef = useRef(selectedYear);
  const compareYearRef = useRef(compareYear);
  const [labelPositions, setLabelPositions] = useState<{ x: number; y: number; anchor: string }[]>([]);
  const isMobile = useMediaQuery('(max-width: 768px)');

  const rawSkills = useFetchJson<{ skills: SkillData[] }>('data/skills-timeline.json');
  const skills = rawSkills?.skills ?? [];

  // After chart renders, read the radial scale geometry to position HTML labels
  const updateLabelPositions = useCallback(() => {
    const chart = chartRef.current;
    const container = containerRef.current;
    if (!chart || !container) return;

    const rScale = chart.scales.r as any;
    if (!rScale) return;

    const canvas = chart.canvas;
    const rect = canvas.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();

    // Chart.js coordinates are already in CSS-pixel space (it applies ctx.scale(dpr, dpr) internally)
    const cx = rScale.xCenter + (rect.left - containerRect.left);
    const cy = rScale.yCenter + (rect.top - containerRect.top);
    const radius = rScale.drawingArea;

    const labelOffset = isMobile ? 5 : 6;
    setLabelPositions(getLabelPositions(cx, cy, radius, CAT_KEYS.length, labelOffset));
  }, [isMobile]);

  const buildChart = useCallback(() => {
    if (!skills.length || !canvasRef.current) return;

    if (chartRef.current) {
      chartRef.current.destroy();
      chartRef.current = null;
    }

    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    const primaryAvgs = computeAvgs(skills, selectedYearRef.current);

    const datasets: any[] = [makePrimaryDataset(primaryAvgs, selectedYearRef.current)];

    if (compareYearRef.current !== null && compareYearRef.current !== selectedYearRef.current) {
      const compareAvgs = computeAvgs(skills, compareYearRef.current);
      datasets.push(makeCompareDataset(compareAvgs, compareYearRef.current));
    }

    const isMobileNow = window.matchMedia('(max-width: 768px)').matches;

    chartRef.current = new Chart(ctx, {
      type: 'radar',
      data: {
        labels: CAT_LABELS,
        datasets,
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 400, easing: 'easeOutQuart' },
        scales: {
          r: {
            min: 0,
            max: 10,
            ticks: {
              stepSize: 2,
              color: '#64748b',
              font: { size: isMobileNow ? 10 : 11 },
              backdropColor: 'transparent',
              callback: (v: any) => v === 0 ? '' : String(v),
            },
            grid: {
              color: 'rgba(58,58,58,0.6)',
            },
            angleLines: {
              color: 'rgba(58,58,58,0.4)',
            },
            pointLabels: {
              // Hide native labels — we render our own HTML labels
              display: false,
            },
          },
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            ...tooltipStyle(),
            titleFont: { size: 14, weight: 700 },
            boxWidth: 0,
            boxHeight: 0,
            callbacks: {
              title: (items: any[]) => {
                const idx = items[0]?.dataIndex;
                return idx !== undefined ? CAT_LABELS[idx] : '';
              },
              afterTitle: () => '',
              label: (item: any) => `${item.dataset.label}: ${Number(item.parsed.r).toFixed(1)}`,
            },
          },
        },
      },
    });

    // Position HTML labels after chart renders
    justBuiltRef.current = true;
    requestAnimationFrame(() => updateLabelPositions());
  }, [skills, isMobile]);

  const updateChart = useCallback(() => {
    const chart = chartRef.current;
    if (!chart || !skills.length) return;

    const primaryAvgs = computeAvgs(skills, selectedYear);
    chart.data.datasets[0].data = primaryAvgs as any;
    (chart.data.datasets[0] as any).label = String(selectedYear);

    if (compareYear !== null && compareYear !== selectedYear) {
      const compareAvgs = computeAvgs(skills, compareYear);
      if (chart.data.datasets.length > 1) {
        chart.data.datasets[1].data = compareAvgs as any;
        (chart.data.datasets[1] as any).label = String(compareYear);
      } else {
        chart.data.datasets.push(makeCompareDataset(compareAvgs, compareYear) as any);
      }
    } else {
      chart.data.datasets.splice(1);
    }

    chart.update();
    requestAnimationFrame(() => updateLabelPositions());
  }, [skills, selectedYear, compareYear, updateLabelPositions]);

  useEffect(() => { selectedYearRef.current = selectedYear; }, [selectedYear]);
  useEffect(() => { compareYearRef.current = compareYear; }, [compareYear]);

  // Build chart once when skills load or screen size changes
  useEffect(() => {
    buildChart();
    return () => { chartRef.current?.destroy(); chartRef.current = null; };
  }, [buildChart]);

  // Update data in-place when year selection changes
  useEffect(() => {
    if (!chartRef.current) return;
    if (justBuiltRef.current) {
      justBuiltRef.current = false;
      return;
    }
    updateChart();
  }, [selectedYear, compareYear, updateChart]);

  // Recalc positions on resize
  useEffect(() => {
    const handler = () => updateLabelPositions();
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, [updateLabelPositions]);

  const compareIndex = compareYear !== null ? PRESET_YEARS.indexOf(compareYear) : 0;
  const yearIndex = PRESET_YEARS.indexOf(selectedYear);

  const trackRef = useRef<HTMLDivElement>(null);

  // Resolve a clientX position to the nearest PRESET_YEARS index
  const clientXToIndex = useCallback((clientX: number) => {
    const track = trackRef.current;
    if (!track) return 0;
    const rect = track.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    return Math.round(ratio * (PRESET_YEARS.length - 1));
  }, []);

  // Drag handler factory — returns onPointerDown for a thumb
  const makeDrag = useCallback((kind: 'compare' | 'year') => (e: React.PointerEvent) => {
    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    const onMove = (ev: PointerEvent) => {
      const idx = clientXToIndex(ev.clientX);
      if (kind === 'compare') {
        if (idx < PRESET_YEARS.indexOf(selectedYearRef.current)) setCompareYear(PRESET_YEARS[idx]);
      } else {
        const ci = compareYearRef.current !== null ? PRESET_YEARS.indexOf(compareYearRef.current) : -1;
        if (idx > ci) setSelectedYear(PRESET_YEARS[idx]);
      }
    };
    const onUp = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  }, [clientXToIndex]);

  // Percentage positions for the filled track
  const maxIdx = PRESET_YEARS.length - 1;
  const leftPct = compareYear !== null ? (compareIndex / maxIdx) * 100 : 0;
  const rightPct = (yearIndex / maxIdx) * 100;

  return (
    <div>
      {/* Dual-thumb range slider */}
      <div style={{ marginBottom: '1.5rem', padding: '0 0.25rem', maxWidth: '65ch', margin: '0 auto 1.5rem' }}>
        {/* Slider track + thumbs */}
        <div className="dual-range" style={{ position: 'relative', height: 41 }}>
          {/* Clickable stop dots with labels above — inset by 9px to match thumb centers */}
          <div style={{ position: 'absolute', top: 0, left: 9, right: 9, height: 41 }}>
            {PRESET_YEARS.map((y, i) => {
              const isSelected = y === selectedYear;
              const isCompare = y === compareYear;
              const dotColor = isSelected ? '#FFCD68' : isCompare ? '#94a3b8' : '#64748b';
              return (
                <button
                  key={y}
                  className="slider-stop"
                  onClick={() => {
                    const distToCompare = compareYear !== null ? Math.abs(i - compareIndex) : Infinity;
                    const distToYear = Math.abs(i - yearIndex);
                    // Compare (left) has priority on equal distance
                    if (distToCompare <= distToYear && i < yearIndex) {
                      setCompareYear(PRESET_YEARS[i]);
                    } else if (i > compareIndex || compareYear === null) {
                      setSelectedYear(PRESET_YEARS[i]);
                    }
                  }}
                  style={{
                    position: 'absolute',
                    left: `${(i / maxIdx) * 100}%`,
                    top: 0,
                    bottom: 0,
                    transform: 'translateX(-50%)',
                    zIndex: 2,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    background: 'none',
                    border: 'none',
                    padding: '0 4px',
                    cursor: 'default',
                  }}
                  aria-label={`Select ${y}`}
                >
                  {/* Label */}
                  <span className="slider-stop-label" style={{
                    color: dotColor,
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    fontFamily: 'Inter, system-ui, sans-serif',
                    lineHeight: 1,
                    transition: 'color 150ms ease-out, opacity 150ms ease-out',
                  }}>
                    {y}
                  </span>
                  {/* Dot centered on the track: track center = 36px */}
                  <div className="slider-stop-dot" style={{
                    position: 'absolute',
                    top: 22,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    border: `2px solid ${dotColor}`,
                    background: (isSelected || isCompare) ? 'transparent' : '#1E1E1E',
                    transition: 'border-color 150ms ease-out, background 150ms ease-out, transform 150ms ease-out',
                  }} />
                </button>
              );
            })}
          </div>
          {/* Track background — inset by half thumb width (9px) to match input track */}
          <div style={{
            position: 'absolute',
            top: 24,
            left: 9,
            right: 9,
            height: 6,
            borderRadius: 3,
            background: '#3a3a3a',
          }} />
          {/* Active range fill */}
          {compareYear !== null && compareYear !== selectedYear && (
            <div style={{
              position: 'absolute',
              top: 24,
              left: `calc(9px + ${leftPct} * (100% - 18px) / 100)`,
              width: `calc(${rightPct - leftPct} * (100% - 18px) / 100)`,
              height: 6,
              borderRadius: 3,
              background: 'linear-gradient(90deg, rgba(148,163,184,0.3), rgba(255,205,104,0.3))',
              transition: 'left 150ms ease-out, width 150ms ease-out',
            }} />
          )}
          {/* Custom draggable thumbs — positioned within the 9px-inset track area */}
          <div ref={trackRef} style={{ position: 'absolute', top: 0, left: 9, right: 9, height: 41 }}>
            {/* Compare (left) thumb */}
            <div
              className="slider-thumb"
              onPointerDown={makeDrag('compare')}
              style={{
                position: 'absolute',
                left: `${leftPct}%`,
                top: 18,
                width: 18,
                height: 18,
                borderRadius: '50%',
                background: '#94a3b8',
                border: '2px solid #1E1E1E',
                transform: 'translateX(-50%)',
                cursor: 'grab',
                zIndex: 5,
                transition: 'left 150ms ease-out',
                touchAction: 'none',
              }}
              aria-label="Compare year"
            />
            {/* Year (right) thumb */}
            <div
              className="slider-thumb"
              onPointerDown={makeDrag('year')}
              style={{
                position: 'absolute',
                left: `${rightPct}%`,
                top: 18,
                width: 18,
                height: 18,
                borderRadius: '50%',
                background: '#FFCD68',
                border: '2px solid #1E1E1E',
                transform: 'translateX(-50%)',
                cursor: 'grab',
                zIndex: 6,
                transition: 'left 150ms ease-out',
                touchAction: 'none',
              }}
              aria-label="Selected year"
            />
          </div>
        </div>

        {/* Slider hover CSS */}
        <style dangerouslySetInnerHTML={{ __html: `
          .slider-thumb:hover { transform: translateX(-50%) scale(1.2); }
          .slider-stop:hover .slider-stop-label { color: #F2F0E5 !important; }
          .slider-stop:hover .slider-stop-dot { transform: translateX(-50%) scale(1.3); }
        `}} />
      </div>

      {/* Chart with HTML label overlays */}
      <div
        ref={containerRef}
        style={{ height: isMobile ? 340 : 480, maxWidth: 600, margin: '0 auto', position: 'relative', padding: isMobile ? '0 16px' : 0 }}
      >
        <canvas ref={canvasRef} />

        {/* HTML labels positioned over the chart */}
        {labelPositions.map((pos, i) => {
          const key = CAT_KEYS[i];
          const cat = CATEGORIES[key];
          if (!cat) return null;

          const fontSize = isMobile ? 11 : 13;
          const transform =
            pos.anchor === 'right' ? 'translate(-100%, -50%)' :
            pos.anchor === 'left'  ? 'translate(0, -50%)' :
            'translate(-50%, -50%)';

          return (
            <div
              key={key}
              className="radar-label"
              style={{
                position: 'absolute',
                left: pos.x,
                top: pos.y,
                transform,
                cursor: 'default',
                zIndex: 5,
              }}
            >
              <span style={{
                color: cat.color,
                fontWeight: 600,
                fontSize,
                fontFamily: 'Inter, system-ui, sans-serif',
                whiteSpace: 'nowrap',
              }}>
                {cat.label}
              </span>
              <div className="radar-label-tooltip" style={{
                display: 'none',
                position: 'absolute',
                bottom: 'calc(100% + 6px)',
                left: '50%',
                transform: 'translateX(-50%)',
                background: 'rgba(30,30,30,0.95)',
                border: `1px solid ${cat.color}55`,
                borderRadius: '0.5rem',
                padding: '0.5rem 0.8rem',
                width: isMobile ? 200 : 280,
                pointerEvents: 'none',
                zIndex: 20,
              }}>
                <div style={{
                  color: cat.color,
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  marginBottom: '0.2rem',
                  fontFamily: 'Raleway, Arial Black, sans-serif',
                }}>
                  {cat.label}
                </div>
                <div style={{ color: '#94a3b8', fontSize: '0.78rem', lineHeight: 1.5 }}>
                  {cat.desc}
                </div>
              </div>
            </div>
          );
        })}

        {/* CSS for hover — inline styles can't do :hover, so use a style tag */}
        <style dangerouslySetInnerHTML={{ __html: `
          @media (min-width: 769px) {
            .radar-label:hover .radar-label-tooltip { display: block !important; }
            .radar-label:hover > span { text-decoration: underline; text-underline-offset: 3px; }
          }
        `}} />
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem', marginTop: '1rem', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem', color: '#FFCD68' }}>
          <div style={{ width: 20, height: 3, borderRadius: 2, background: '#FFCD68' }} />
          {selectedYear}
        </div>
        {compareYear !== null && compareYear !== selectedYear && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem', color: '#94a3b8' }}>
            <div style={{ width: 20, height: 2, borderRadius: 2, background: '#94a3b8', opacity: 0.6 }} />
            {compareYear} (compare)
          </div>
        )}
      </div>
    </div>
  );
}
