import { useEffect, useRef, useState } from 'react';
import {
  Chart,
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  LogarithmicScale,
  Tooltip,
} from 'chart.js';
import { useMediaQuery } from './useMediaQuery';
import { YEARS } from '../constants/chart';
import { useFetchJson } from '../hooks/useFetchJson';
import { tooltipStyle, timeXScale, baseYScale } from '../utils/chartDefaults';

Chart.register(LineController, LineElement, PointElement, LinearScale, LogarithmicScale, Tooltip);

function fmtCount(v: number): string {
  if (v >= 1e9) return `${(v / 1e9).toFixed(1)}B`;
  if (v >= 1e6) return `${(v / 1e6).toFixed(1)}M`;
  if (v >= 1e3) return `${(v / 1e3).toFixed(0)}K`;
  return String(v);
}

const SERIES_KEYS = ['linuxLoc', 'projectBranches', 'npmPackages', 'annualCve', 'stackTechCount'] as const;

interface SeriesMeta {
  key: string;
  label: string;
  color: string;
}

export default function ComplexityChart() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<Chart | null>(null);
  const [hidden, setHidden] = useState<Set<string>>(new Set());
  const [logScale, setLogScale] = useState(true);
  const isMobile = useMediaQuery('(max-width: 768px)');

  const complexityData = useFetchJson<Record<string, any>>('data/complexity-data.json');
  const seriesMeta: SeriesMeta[] = complexityData
    ? SERIES_KEYS.map(key => ({ key, label: complexityData[key].label, color: complexityData[key].color }))
    : [];

  useEffect(() => {
    const data = complexityData;
    if (!data || !canvasRef.current) return;

    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    const datasets = SERIES_KEYS.map(key => {
      const series = data[key];
      return {
        label: series.label,
        data: YEARS.map(y => ({ x: y, y: series.values[String(y)] ?? null })),
        borderColor: series.color,
        backgroundColor: 'transparent',
        borderWidth: 3,
        borderDash: series.dash,
        pointRadius: 0,
        pointHoverRadius: 5,
        tension: 0.3,
        _key: key,
        _unit: series.unit,
      } as any;
    });

    const isMobileNow = isMobile;

    chartRef.current = new Chart(ctx, {
      type: 'line',
      data: { datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'nearest', intersect: false },
        animation: { duration: 400, easing: 'easeOutQuart' },
        scales: {
          x: timeXScale(isMobileNow),
          y: {
            ...baseYScale(isMobileNow),
            type: logScale ? 'logarithmic' : 'linear',
            min: logScale ? 1 : 0,
            ticks: {
              ...baseYScale(isMobileNow).ticks,
              callback: (v: number | string) => fmtCount(Number(v)),
            },
          },
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            ...tooltipStyle(),
            callbacks: {
              title: (items: any[]) => `${items[0].dataset.label}  ·  ${String(Math.round(items[0].parsed.x))}`,
              label: (item: any) => `${fmtCount(item.parsed.y)} ${(item.dataset as any)._unit}`,
            },
          },
        },
      },
    });

    return () => { chartRef.current?.destroy(); chartRef.current = null; };
  }, [complexityData, logScale, isMobile]);

  // Sync hidden state to chart
  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;
    chart.data.datasets.forEach((ds: any) => {
      ds.hidden = hidden.has(ds._key);
    });
    chart.update();
  }, [hidden]);

  function toggle(key: string) {
    setHidden(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  }

  const btnBase: React.CSSProperties = {
    border: '1.5px solid transparent',
    borderRadius: '999px',
    cursor: 'pointer',
    fontSize: isMobile ? '0.82rem' : '0.9rem',
    fontWeight: 600,
    padding: isMobile ? '0.45rem 0.8rem' : '0.3rem 0.85rem',
    minHeight: isMobile ? 40 : 'auto',
    transition: 'opacity 0.15s, transform 0.1s',
    userSelect: 'none' as const,
    fontFamily: 'Inter, system-ui, sans-serif',
  };

  return (
    <div>
      {seriesMeta.length > 0 && (
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: isMobile ? '0.4rem' : '0.5rem',
          marginBottom: '1rem',
        }}>
          {seriesMeta.map(s => {
            const isActive = !hidden.has(s.key);
            return (
              <button
                key={s.key}
                onClick={() => toggle(s.key)}
                style={{
                  ...btnBase,
                  background: isActive ? `${s.color}1a` : 'transparent',
                  borderColor: isActive ? s.color : '#3a3a3a',
                  color: isActive ? s.color : '#64748b',
                  opacity: isActive ? 1 : 0.45,
                }}
              >{s.label}</button>
            );
          })}
          <span style={{ marginLeft: 'auto', display: 'flex', gap: '0.3rem' }}>
            {(['log', 'linear'] as const).map(mode => {
              const active = mode === 'log' ? logScale : !logScale;
              return (
                <button
                  key={mode}
                  onClick={() => setLogScale(mode === 'log')}
                  style={{
                    ...btnBase,
                    background: active ? 'rgba(242,240,229,0.1)' : 'transparent',
                    borderColor: active ? '#F2F0E5' : '#3a3a3a',
                    color: active ? '#F2F0E5' : '#64748b',
                    opacity: active ? 1 : 0.45,
                  }}
                >{mode}</button>
              );
            })}
          </span>
        </div>
      )}
      <div style={{ height: isMobile ? 320 : 480 }}>
        <canvas ref={canvasRef} />
      </div>
    </div>
  );
}
