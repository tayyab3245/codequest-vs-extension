/**
 * Pattern data building (exactly 20 segments)
 */

import { catalogData, state, patternDisplayNames } from '../core/state.js';
import { normDifficulty } from '../utils/colors.js';

export const maxSegmentsPerPattern = 20;

export function getPatternProblems(patternKey) {
  const entry = catalogData?.[patternKey];
  if (!entry) return [];
  if (Array.isArray(entry)) return entry;
  if (Array.isArray(entry.problems)) return entry.problems;
  const e = entry[1] || entry.easy || entry.Easy || [];
  const m = entry[2] || entry.medium || entry.Medium || [];
  const h = entry[3] || entry.hard || entry.Hard || [];
  return [
    ...e.map(p => ({ ...p, difficulty: 'Easy' })),
    ...m.map(p => ({ ...p, difficulty: 'Medium' })),
    ...h.map(p => ({ ...p, difficulty: 'Hard' })),
  ];
}

export function sortProblemsForSegments(arr) {
  const order = { Easy: 0, Medium: 1, Hard: 2 };
  return [...arr].sort((a, b) => {
    // Primary sort: by LeetCode difficulty (Easy → Medium → Hard)
    const da = order[normDifficulty(a.difficulty)], db = order[normDifficulty(b.difficulty)];
    if (da !== db) return da - db;
    
    // Secondary sort: by title for consistent ordering within same difficulty
    const ta = (a.title || '').localeCompare(b.title || '');
    if (ta !== 0) return ta;
    
    // Tertiary sort: by slug as final tiebreaker
    return (a.slug || '').localeCompare(b.slug || '');
  });
}

export function buildSegments(patternKey) {
  const problems = sortProblemsForSegments(getPatternProblems(patternKey));
  const baseProblems = [...problems];
  const allProblems = [...problems];

  // Fill up by cycling with variants
  while (allProblems.length < maxSegmentsPerPattern && baseProblems.length > 0) {
    const base = baseProblems[allProblems.length % baseProblems.length];
    const n = Math.floor(allProblems.length / baseProblems.length) + 1;
    allProblems.push({
      ...base,
      slug: `${base.slug}-variant-${n}`,
      title: `${base.title} (Variant ${n})`,
      isVariant: true
    });
  }

  // If empty, generate placeholders
  if (allProblems.length === 0) {
    for (let i = 0; i < maxSegmentsPerPattern; i++) {
      const difficulties = ['Easy', 'Medium', 'Hard'];
      const diff = difficulties[i % 3];
      allProblems.push({
        slug: `${patternKey}-problem-${i + 1}`,
        title: `${patternDisplayNames[patternKey] || patternKey} Problem ${i + 1}`,
        difficulty: diff,
        isGenerated: true
      });
    }
  }

  const finalProblems = allProblems.slice(0, maxSegmentsPerPattern);

  return finalProblems.map((p, i) => ({
    index: i,
    slug: p.slug,
    title: p.title,
    difficulty: normDifficulty(p.difficulty),
    solved: state.solvedKeys.includes(`${patternKey}/${p.slug}`),
    empty: false,
    isVariant: !!p.isVariant,
    isGenerated: !!p.isGenerated
  }));
}
