import { useEffect, useRef } from 'react';
import {
  Chart,
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  Filler,
  Tooltip,
  Legend,
} from 'chart.js';

Chart.register(LineController, LineElement, PointElement, LinearScale, Filler, Tooltip, Legend);

const YEARS = Array.from({ length: 57 }, (_, i) => 1970 + i);
const SENIOR_YEARS_REQUIRED = 8;
const ATTRITION_RATE = 0.5;

export default function PopulationChart() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}data/population-data.json`)
      .then(r => r.json())
      .then(data => {
        const ctx = canvasRef.current?.getContext('2d');
        if (!ctx) return;

        const totalData = YEARS.map(y => ({ x: y, y: data.values[String(y)] ?? null }));
        const seniorData = YEARS.map(y => {
          const pastYear = y - SENIOR_YEARS_REQUIRED;
          const pastPop = data.values[String(pastYear)];
          if (pastPop == null) return { x: y, y: 0 };
          return { x: y, y: +(pastPop * ATTRITION_RATE).toFixed(2) };
        });

        new Chart(ctx, {
          type: 'line',
          data: {
            datasets: [
              {
                label: 'Total developers worldwide (millions)',
                data: totalData,
                borderColor: 'rgba(255,255,255,0.7)',
                backgroundColor: 'rgba(255,205,104,0.05)',
                borderWidth: 3,
                pointRadius: 0,
                pointHoverRadius: 8,
                pointHoverBackgroundColor: '#FFCD68',
                pointHoverBorderColor: '#1E1E1E',
                pointHoverBorderWidth: 3,
                hitRadius: 15,
                tension: 0.35,
                fill: '+1',
              },
              {
                label: 'Estimated senior developers (8+ years)',
                data: seniorData,
                borderColor: '#FFCD68',
                borderDash: [6, 4],
                borderWidth: 2,
                pointRadius: 0,
                pointHoverRadius: 8,
                pointHoverBackgroundColor: '#FFCD68',
                pointHoverBorderColor: '#1E1E1E',
                pointHoverBorderWidth: 3,
                hitRadius: 15,
                tension: 0.35,
                fill: 'origin',
                backgroundColor: 'rgba(255,205,104,0.08)',
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: { mode: 'nearest', intersect: false },
            animation: { duration: 300 },
            scales: {
              x: {
                type: 'linear',
                min: 1970,
                max: 2026,
                ticks: {
                  color: '#64748b',
                  font: { size: 13 },
                  stepSize: 5,
                  callback: (v: any) => (Number.isInteger(v) && v % 5 === 0) ? String(v) : '',
                  maxRotation: 0,
                },
                grid: { color: 'rgba(58,58,58,0.8)' },
                border: { color: '#3a3a3a' },
              },
              y: {
                min: 0,
                max: 45,
                ticks: {
                  color: '#64748b',
                  font: { size: 13 },
                  stepSize: 5,
                  callback: (v: any) => v === 0 ? '0' : `${v}M`,
                },
                grid: { color: 'rgba(58,58,58,0.5)' },
                border: { color: '#3a3a3a' },
              },
            },
            plugins: {
              legend: {
                display: true,
                position: 'bottom' as const,
                labels: {
                  color: '#94a3b8',
                  font: { size: 12, family: 'Inter' },
                  usePointStyle: false,
                  boxWidth: 20,
                  padding: 16,
                },
              },
              tooltip: {
                backgroundColor: '#252525',
                borderColor: '#3a3a3a',
                borderWidth: 1,
                titleColor: '#F2F0E5',
                titleFont: { size: 14 },
                bodyColor: '#94a3b8',
                bodyFont: { size: 13 },
                padding: 14,
                callbacks: {
                  title: (items: any[]) => String(Math.round(items[0].parsed.x)),
                  label: (item: any) => {
                    const val = Number(item.parsed.y).toFixed(1);
                    return item.datasetIndex === 0
                      ? `~${val}M developers total`
                      : `~${val}M estimated seniors`;
                  },
                },
              },
            },
          },
        });
      });
  }, []);

  const isMobile = typeof window !== 'undefined' && window.matchMedia('(max-width: 768px)').matches;
  return <div style={{ height: isMobile ? 280 : 380 }}><canvas ref={canvasRef} /></div>;
}
