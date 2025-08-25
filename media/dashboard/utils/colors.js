/**
 * Colors & difficulty helpers
 */

export function getColorForPercentage(pct) {
  const stops = [
    { pct: 0.0, r: 0x4a, g: 0xcf, b: 0x4a },
    { pct: 0.5, r: 0xff, g: 0xbf, b: 0x00 },
    { pct: 1.0, r: 0xf9, g: 0x4d, b: 0x4d }
  ];
  for (let i = 0; i < stops.length - 1; i++) {
    const a = stops[i], b = stops[i + 1];
    if (pct >= a.pct && pct <= b.pct) {
      const t = (pct - a.pct) / (b.pct - a.pct);
      const r = Math.round(a.r + t * (b.r - a.r));
      const g = Math.round(a.g + t * (b.g - a.g));
      const bch = Math.round(a.b + t * (b.b - a.b));
      return `rgb(${r}, ${g}, ${bch})`;
    }
  }
  return 'rgb(73,207,74)';
}

export function normDifficulty(d) {
  if (!d) return 'Medium';
  const s = String(d).toLowerCase();
  if (s.startsWith('e')) return 'Easy';
  if (s.startsWith('h')) return 'Hard';
  return 'Medium';
}

export function segDifficultyClass(diff) {
  switch (normDifficulty(diff)) {
    case 'Easy': return 'seg-easy';
    case 'Medium': return 'seg-medium';
    case 'Hard': return 'seg-hard';
    default: return '';
  }
}

export function getColorForDifficulty(difficulty) {
  const d = normDifficulty(difficulty);
  if (d === 'Easy') return '#4acf4a';
  if (d === 'Medium') return '#ffbf00';
  if (d === 'Hard') return '#f94d4d';
  return '#2d2d2d';
}
