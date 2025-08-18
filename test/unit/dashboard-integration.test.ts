/**
 * CodeQuest - VS Code LeetCode Progress Tracker
 * 
 * Copyright (c) 2025 tayyab3245. All rights reserved.
 * 
 * This software is proprietary and confidential. Unauthorized reproduction,
 * distribution, or modification is strictly prohibited. See LICENSE file
 * for full terms and conditions.
 * 
 * @author tayyab3245
 * @license Proprietary
 */
import { expect } from 'chai';

/**
 * Integration tests for dashboard functionality
 * These test higher-level dashboard interactions and data processing
 */

// Mock data structures that match dashboard.js expectations
interface PatternProblem {
  key: string;
  patternKey: string;
  number: number;
  name: string;
  difficulty: string;
  solved: boolean;
  dateAttempted: string;
}

interface SegmentData {
  solved: number;
  total: number;
  difficulty: string;
  color: string;
  percentage: number;
}

// Mock functions that simulate dashboard.js data processing logic
function getColorForDifficulty(difficulty: string): string {
  const normalized = (difficulty || '').toLowerCase();
  if (normalized.startsWith('e')) return '#22c55e'; // Green for Easy
  if (normalized.startsWith('h')) return '#ef4444'; // Red for Hard
  return '#f59e0b'; // Yellow for Medium
}

function segDifficultyClass(difficulty: string): string {
  const normalized = (difficulty || '').toLowerCase();
  if (normalized.startsWith('e')) return 'easy';
  if (normalized.startsWith('h')) return 'hard';
  return 'medium';
}

function sortProblemsForSegments(problems: PatternProblem[]): PatternProblem[] {
  return problems.sort((a, b) => {
    // Sort by difficulty first (Easy, Medium, Hard), then by number
    const diffOrder = { easy: 0, medium: 1, hard: 2 };
    const aDiff = (a.difficulty || '').toLowerCase().startsWith('e') ? 0 :
                  (a.difficulty || '').toLowerCase().startsWith('h') ? 2 : 1;
    const bDiff = (b.difficulty || '').toLowerCase().startsWith('e') ? 0 :
                  (b.difficulty || '').toLowerCase().startsWith('h') ? 2 : 1;
    
    if (aDiff !== bDiff) return aDiff - bDiff;
    return a.number - b.number;
  });
}

function buildSegments(problems: PatternProblem[]): SegmentData[] {
  if (!problems || problems.length === 0) return [];

  const sorted = sortProblemsForSegments(problems);
  const segments: SegmentData[] = [];
  let currentDifficulty: string | null = null;
  let currentSegment: SegmentData | null = null;

  for (const problem of sorted) {
    const difficulty = (problem.difficulty || 'medium').toLowerCase();
    const normalizedDiff = difficulty.startsWith('e') ? 'easy' :
                          difficulty.startsWith('h') ? 'hard' : 'medium';

    if (normalizedDiff !== currentDifficulty) {
      // Start new segment
      if (currentSegment) {
        currentSegment.percentage = currentSegment.total > 0 ? 
          Math.round((currentSegment.solved / currentSegment.total) * 100) : 0;
        segments.push(currentSegment);
      }

      currentDifficulty = normalizedDiff;
      currentSegment = {
        difficulty: normalizedDiff,
        solved: 0,
        total: 0,
        color: getColorForDifficulty(normalizedDiff),
        percentage: 0
      };
    }

    if (currentSegment) {
      currentSegment.total++;
      if (problem.solved) {
        currentSegment.solved++;
      }
    }
  }

  // Add the final segment
  if (currentSegment) {
    currentSegment.percentage = currentSegment.total > 0 ? 
      Math.round((currentSegment.solved / currentSegment.total) * 100) : 0;
    segments.push(currentSegment);
  }

  return segments;
}

function calculateActivityLevel(minutes: number): number {
  if (minutes <= 0) return 0;
  if (minutes < 30) return 0;  
  if (minutes < 60) return 1;  
  if (minutes < 120) return 2; 
  return 3; 
}

describe('Dashboard Integration Tests', () => {
  describe('Pattern Segment Building', () => {
    it('should build segments for mixed difficulty problems', () => {
      const problems: PatternProblem[] = [
        { key: 'p1', patternKey: 'arrays', number: 1, name: 'Two Sum', difficulty: 'Easy', solved: true, dateAttempted: '2023-01-01' },
        { key: 'p2', patternKey: 'arrays', number: 2, name: 'Add Two Numbers', difficulty: 'Medium', solved: false, dateAttempted: '2023-01-02' },
        { key: 'p3', patternKey: 'arrays', number: 3, name: 'Longest Substring', difficulty: 'Medium', solved: true, dateAttempted: '2023-01-03' },
        { key: 'p4', patternKey: 'arrays', number: 4, name: 'Median Arrays', difficulty: 'Hard', solved: false, dateAttempted: '2023-01-04' },
      ];

      const segments = buildSegments(problems);

      expect(segments).to.have.length(3);
      
      // Easy segment
      expect(segments[0].difficulty).to.equal('easy');
      expect(segments[0].solved).to.equal(1);
      expect(segments[0].total).to.equal(1);
      expect(segments[0].percentage).to.equal(100);

      // Medium segment  
      expect(segments[1].difficulty).to.equal('medium');
      expect(segments[1].solved).to.equal(1);
      expect(segments[1].total).to.equal(2);
      expect(segments[1].percentage).to.equal(50);

      // Hard segment
      expect(segments[2].difficulty).to.equal('hard');
      expect(segments[2].solved).to.equal(0);
      expect(segments[2].total).to.equal(1);
      expect(segments[2].percentage).to.equal(0);
    });

    it('should handle empty problem list', () => {
      const segments = buildSegments([]);
      expect(segments).to.be.an('array').that.is.empty;
    });

    it('should handle single difficulty', () => {
      const problems: PatternProblem[] = [
        { key: 'p1', patternKey: 'arrays', number: 1, name: 'Problem 1', difficulty: 'Easy', solved: true, dateAttempted: '2023-01-01' },
        { key: 'p2', patternKey: 'arrays', number: 2, name: 'Problem 2', difficulty: 'Easy', solved: false, dateAttempted: '2023-01-02' },
      ];

      const segments = buildSegments(problems);
      expect(segments).to.have.length(1);
      expect(segments[0].difficulty).to.equal('easy');
      expect(segments[0].solved).to.equal(1);
      expect(segments[0].total).to.equal(2);
      expect(segments[0].percentage).to.equal(50);
    });

    it('should sort problems correctly within segments', () => {
      const problems: PatternProblem[] = [
        { key: 'p5', patternKey: 'arrays', number: 5, name: 'Problem 5', difficulty: 'Easy', solved: true, dateAttempted: '2023-01-01' },
        { key: 'p1', patternKey: 'arrays', number: 1, name: 'Problem 1', difficulty: 'Easy', solved: false, dateAttempted: '2023-01-02' },
        { key: 'p3', patternKey: 'arrays', number: 3, name: 'Problem 3', difficulty: 'Easy', solved: true, dateAttempted: '2023-01-03' },
      ];

      const sorted = sortProblemsForSegments(problems);
      expect(sorted[0].number).to.equal(1);
      expect(sorted[1].number).to.equal(3);
      expect(sorted[2].number).to.equal(5);
    });
  });

  describe('Color and CSS Class Mapping', () => {
    it('should map difficulty to correct colors', () => {
      expect(getColorForDifficulty('Easy')).to.equal('#22c55e');
      expect(getColorForDifficulty('easy')).to.equal('#22c55e');
      expect(getColorForDifficulty('Medium')).to.equal('#f59e0b');
      expect(getColorForDifficulty('medium')).to.equal('#f59e0b');
      expect(getColorForDifficulty('Hard')).to.equal('#ef4444');
      expect(getColorForDifficulty('hard')).to.equal('#ef4444');
      expect(getColorForDifficulty('')).to.equal('#f59e0b'); // Default to medium
      expect(getColorForDifficulty('unknown')).to.equal('#f59e0b');
    });

    it('should map difficulty to correct CSS classes', () => {
      expect(segDifficultyClass('Easy')).to.equal('easy');
      expect(segDifficultyClass('easy')).to.equal('easy');
      expect(segDifficultyClass('Medium')).to.equal('medium');
      expect(segDifficultyClass('medium')).to.equal('medium');
      expect(segDifficultyClass('Hard')).to.equal('hard');
      expect(segDifficultyClass('hard')).to.equal('hard');
      expect(segDifficultyClass('')).to.equal('medium'); // Default
      expect(segDifficultyClass('unknown')).to.equal('medium');
    });
  });

  describe('Activity Level Calculation', () => {
    it('should calculate correct activity levels for calendar', () => {
      expect(calculateActivityLevel(0)).to.equal(0);     // No activity
      expect(calculateActivityLevel(15)).to.equal(0);    // Light activity
      expect(calculateActivityLevel(30)).to.equal(1);    // Low activity
      expect(calculateActivityLevel(45)).to.equal(1);    // Low activity  
      expect(calculateActivityLevel(60)).to.equal(2);    // Medium activity
      expect(calculateActivityLevel(90)).to.equal(2);    // Medium activity
      expect(calculateActivityLevel(120)).to.equal(3);   // High activity
      expect(calculateActivityLevel(240)).to.equal(3);   // High activity
    });

    it('should handle edge cases', () => {
      expect(calculateActivityLevel(-10)).to.equal(0);   // Negative
      expect(calculateActivityLevel(29)).to.equal(0);    // Just under 30
      expect(calculateActivityLevel(59)).to.equal(1);    // Just under 60
      expect(calculateActivityLevel(119)).to.equal(2);   // Just under 120
    });
  });

  describe('Progress Calculation', () => {
    it('should calculate pattern progress correctly', () => {
      const segments: SegmentData[] = [
        { difficulty: 'easy', solved: 2, total: 3, percentage: 67, color: '#22c55e' },
        { difficulty: 'medium', solved: 1, total: 4, percentage: 25, color: '#f59e0b' },
        { difficulty: 'hard', solved: 0, total: 2, percentage: 0, color: '#ef4444' },
      ];

      const totalSolved = segments.reduce((sum, seg) => sum + seg.solved, 0);
      const totalProblems = segments.reduce((sum, seg) => sum + seg.total, 0);
      const overallProgress = totalProblems > 0 ? Math.round((totalSolved / totalProblems) * 100) : 0;

      expect(totalSolved).to.equal(3);
      expect(totalProblems).to.equal(9);
      expect(overallProgress).to.equal(33); // 3/9 = 33%
    });

    it('should handle zero problems gracefully', () => {
      const segments: SegmentData[] = [];
      const totalSolved = segments.reduce((sum, seg) => sum + seg.solved, 0);
      const totalProblems = segments.reduce((sum, seg) => sum + seg.total, 0);
      const overallProgress = totalProblems > 0 ? Math.round((totalSolved / totalProblems) * 100) : 0;

      expect(totalSolved).to.equal(0);
      expect(totalProblems).to.equal(0);
      expect(overallProgress).to.equal(0);
    });
  });

  describe('Data Validation and Error Handling', () => {
    it('should handle malformed problem data', () => {
      const problems: any[] = [
        { key: 'p1', name: 'Problem 1' }, // Missing required fields
        { key: 'p2', patternKey: 'arrays', number: 'invalid', name: 'Problem 2', difficulty: 'Easy', solved: true, dateAttempted: '2023-01-01' },
        null, // Null entry
        undefined, // Undefined entry
      ];

      // Filter out invalid entries like dashboard.js would
      const validProblems = problems.filter(p => p && p.key && typeof p.number === 'number');
      
      expect(validProblems).to.have.length(0); // All were invalid
    });

    it('should handle missing difficulty gracefully', () => {
      const problems: PatternProblem[] = [
        { key: 'p1', patternKey: 'arrays', number: 1, name: 'Problem 1', difficulty: '', solved: true, dateAttempted: '2023-01-01' },
        { key: 'p2', patternKey: 'arrays', number: 2, name: 'Problem 2', difficulty: undefined as any, solved: false, dateAttempted: '2023-01-02' },
      ];

      const segments = buildSegments(problems);
      expect(segments).to.have.length(1);
      expect(segments[0].difficulty).to.equal('medium'); // Default fallback
    });
  });
});
