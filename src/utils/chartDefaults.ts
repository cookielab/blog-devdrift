export function tooltipStyle() {
  return {
    backgroundColor: '#252525',
    borderColor: '#3a3a3a',
    borderWidth: 1,
    titleColor: '#F2F0E5',
    titleFont: { size: 14 },
    bodyColor: '#94a3b8',
    bodyFont: { size: 13 },
    padding: 14,
  };
}

export function timeXScale(isMobile: boolean) {
  const step = isMobile ? 10 : 5;
  return {
    type: 'linear' as const,
    min: 1970,
    max: 2026,
    ticks: {
      color: '#64748b',
      font: { size: isMobile ? 11 : 13 },
      stepSize: step,
      maxRotation: 0,
      callback: (v: number | string) => {
        const n = Number(v);
        return (Number.isInteger(n) && n % step === 0 && n <= 2026) ? String(n) : '';
      },
    },
    grid: { color: 'rgba(58,58,58,0.8)' },
    border: { color: '#3a3a3a' },
  };
}

export function baseYScale(isMobile: boolean) {
  return {
    ticks: {
      color: '#64748b',
      font: { size: isMobile ? 11 : 13 },
    },
    grid: { color: 'rgba(58,58,58,0.5)' },
    border: { color: '#3a3a3a' },
  };
}
