/**
 * Shared types used across the extension
 */

import type { ProblemInfo } from './lib/problemPath';

export type DifficultyBand = 1 | 2 | 3 | 4 | 5;

export interface CatalogProblem {
  pattern: string;   // 'arrays-and-hashing'
  title: string;     // 'Two Sum'
  slug: string;      // 'two-sum'
  band: DifficultyBand;
  url: string;       // canonical link
}

export interface Catalog {
  version: string;
  problems: CatalogProblem[];
}

export interface SolvedInfo {
  solvedAt: string; // ISO
}

export interface PatternStats {
  pattern: string;
  solved: number;
  total: number;
}

export interface SessionInfo {
  running: boolean;
  startedAt?: string; // ISO
  todayMinutes: number;
}

export interface CalendarData {
  dailyMinutes: Record<string, number>; // 'YYYY-MM-DD' -> minutes
}

export interface ExtensionState {
  workspacePath: string;
  problemCount: number;
  currentProblem: ProblemInfo | null;
  problems: ProblemInfo[];
  solvedKeys: string[];
  filter: 'all' | 'unsolved' | 'solved';
  patternStats: PatternStats[];
  installedAt: string;
  session: SessionInfo;
  calendar: CalendarData;
}
