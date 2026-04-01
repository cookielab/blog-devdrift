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
import { useMediaQuery } from './useMediaQuery';
import { YEARS } from '../constants/chart';
import { useFetchJson } from '../hooks/useFetchJson';
import { tooltipStyle, timeXScale, baseYScale } from '../utils/chartDefaults';

Chart.register(LineController, LineElement, PointElement, LinearScale, Filler, Tooltip, Legend);

const SENIOR_YEARS_REQUIRED = 8;
const ATTRITION_RATE = 0.5;

export default function PopulationChart() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isMobile = useMediaQuery('(max-width: 768px)');
  const populationData = useFetchJson<{ values: Record<string, number> }>('data/population-data.json');

  useEffect(() => {
    if (!populationData || !canvasRef.current) return;

    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    const totalData = YEARS.map(y => ({ x: y, y: populationData.values[String(y)] ?? null }));
    const seniorData = YEARS.map(y => {
      const pastYear = y - SENIOR_YEARS_REQUIRED;
      const pastPop = populationData.values[String(pastYear)];
      if (pastPop == null) return { x: y, y: 0 };
      return { x: y, y: +(pastPop * ATTRITION_RATE).toFixed(2) };
    });

    const chart = new Chart(ctx, {
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
            pointHitRadius: 15,
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
            pointHitRadius: 15,
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
          x: timeXScale(isMobile),
          y: {
            ...baseYScale(isMobile),
            min: 0,
            max: 45,
            ticks: {
              ...baseYScale(isMobile).ticks,
              stepSize: 5,
              callback: (v: number | string) => v === 0 ? '0' : `${v}M`,
            },
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
            ...tooltipStyle(),
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

    return () => chart.destroy();
  }, [populationData, isMobile]);

  return <div style={{ height: isMobile ? 280 : 380 }}><canvas ref={canvasRef} /></div>;
}
