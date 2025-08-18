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
 * Tests for dashboard utility functions
 * These functions are extracted from media/dashboard.js for testing
 */

// Mock implementations that match dashboard.js behavior
function formatTime(ms: number): string {
  if (ms < 0) return '00:00:00';
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600).toString().padStart(2, '0');
  const minutes = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, '0');
  const seconds = (totalSeconds % 60).toString().padStart(2, '0');
  return `${hours}:${minutes}:${seconds}`;
}

function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function getColorForPercentage(pct: number): string {
  const colorStops = [
    { pct: 0.0, r: 0x4a, g: 0xcf, b: 0x4a }, // Green
    { pct: 0.5, r: 0xff, g: 0xbf, b: 0x00 }, // Yellow
    { pct: 1.0, r: 0xf9, g: 0x4d, b: 0x4d }  // Red
  ];

  for (let i = 0; i < colorStops.length - 1; i++) {
    if (pct >= colorStops[i].pct && pct <= colorStops[i + 1].pct) {
      const lower = colorStops[i];
      const upper = colorStops[i + 1];
      const range = upper.pct - lower.pct;
      const rangePct = (pct - lower.pct) / range;
      
      const r = Math.round(lower.r + rangePct * (upper.r - lower.r));
      const g = Math.round(lower.g + rangePct * (upper.g - lower.g));
      const b = Math.round(lower.b + rangePct * (upper.b - lower.b));
      
      return `rgb(${r}, ${g}, ${b})`;
    }
  }
  return 'rgb(74, 207, 74)'; // Default green
}

function normDifficulty(d: string): string {
  const s = (d || '').toLowerCase();
  if (s.startsWith('e')) return 'Easy';
  if (s.startsWith('h')) return 'Hard';
  return 'Medium';
}

function toLocalKey(d: Date): string {
  return d.toISOString().split('T')[0];
}

function startOfWeekSunday(d: Date): Date {
  const r = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  r.setDate(r.getDate() - r.getDay());
  return r;
}

function addDays(d: Date, n: number): Date {
  const result = new Date(d);
  result.setDate(d.getDate() + n);
  return result;
}

function daysBetween(a: Date, b: Date): number {
  const diffTime = Math.abs(b.getTime() - a.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

function minutesToLevel(minutes: number): number {
  if (minutes <= 0) return 0;
  if (minutes < 30) return 0;  // < 30 min
  if (minutes < 60) return 1;  // 30-59 min  
  if (minutes < 120) return 2; // 1-2 hours
  return 3; // 2+ hours
}

describe('Dashboard Utility Functions', () => {
  describe('formatTime', () => {
    it('should format zero time correctly', () => {
      expect(formatTime(0)).to.equal('00:00:00');
    });

    it('should format seconds only', () => {
      expect(formatTime(30000)).to.equal('00:00:30'); // 30 seconds
      expect(formatTime(59000)).to.equal('00:00:59'); // 59 seconds
    });

    it('should format minutes and seconds', () => {
      expect(formatTime(60000)).to.equal('00:01:00'); // 1 minute
      expect(formatTime(90000)).to.equal('00:01:30'); // 1 minute 30 seconds
    });

    it('should format hours, minutes, and seconds', () => {
      expect(formatTime(3600000)).to.equal('01:00:00'); // 1 hour
      expect(formatTime(3661000)).to.equal('01:01:01'); // 1 hour 1 minute 1 second
      expect(formatTime(7323000)).to.equal('02:02:03'); // 2 hours 2 minutes 3 seconds
    });

    it('should handle edge cases', () => {
      expect(formatTime(-1000)).to.equal('00:00:00'); // Negative time
      expect(formatTime(999)).to.equal('00:00:00'); // Less than 1 second
    });

    it('should handle large values', () => {
      expect(formatTime(24 * 3600000)).to.equal('24:00:00'); // 24 hours
      expect(formatTime(99 * 3600000 + 59 * 60000 + 59000)).to.equal('99:59:59');
    });
  });

  describe('escapeHtml', () => {
    it('should escape HTML special characters', () => {
      expect(escapeHtml('<script>alert("xss")</script>'))
        .to.equal('&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;');
    });

    it('should escape individual characters', () => {
      expect(escapeHtml('&')).to.equal('&amp;');
      expect(escapeHtml('<')).to.equal('&lt;');
      expect(escapeHtml('>')).to.equal('&gt;');
      expect(escapeHtml('"')).to.equal('&quot;');
      expect(escapeHtml("'")).to.equal('&#039;');
    });

    it('should handle empty string', () => {
      expect(escapeHtml('')).to.equal('');
    });

    it('should handle string with no special characters', () => {
      expect(escapeHtml('hello world')).to.equal('hello world');
    });

    it('should handle mixed content', () => {
      expect(escapeHtml('Hello <b>"World"</b> & \'Goodbye\''))
        .to.equal('Hello &lt;b&gt;&quot;World&quot;&lt;/b&gt; &amp; &#039;Goodbye&#039;');
    });
  });

  describe('getColorForPercentage', () => {
    it('should return green for 0%', () => {
      expect(getColorForPercentage(0)).to.equal('rgb(74, 207, 74)');
    });

    it('should return red for 100%', () => {
      expect(getColorForPercentage(1)).to.equal('rgb(249, 77, 77)');
    });

    it('should return yellow for 50%', () => {
      expect(getColorForPercentage(0.5)).to.equal('rgb(255, 191, 0)');
    });

    it('should interpolate colors correctly', () => {
      const color25 = getColorForPercentage(0.25);
      const color75 = getColorForPercentage(0.75);
      
      expect(color25).to.match(/^rgb\(\d+, \d+, \d+\)$/);
      expect(color75).to.match(/^rgb\(\d+, \d+, \d+\)$/);
      expect(color25).to.not.equal(color75);
    });

    it('should handle edge cases', () => {
      expect(getColorForPercentage(-0.1)).to.equal('rgb(74, 207, 74)'); // Below 0
      expect(getColorForPercentage(1.1)).to.equal('rgb(74, 207, 74)'); // Above 1
    });
  });

  describe('normDifficulty', () => {
    it('should normalize easy variants', () => {
      expect(normDifficulty('easy')).to.equal('Easy');
      expect(normDifficulty('Easy')).to.equal('Easy');
      expect(normDifficulty('EASY')).to.equal('Easy');
      expect(normDifficulty('e')).to.equal('Easy');
    });

    it('should normalize hard variants', () => {
      expect(normDifficulty('hard')).to.equal('Hard');
      expect(normDifficulty('Hard')).to.equal('Hard');
      expect(normDifficulty('HARD')).to.equal('Hard');
      expect(normDifficulty('h')).to.equal('Hard');
    });

    it('should default to medium', () => {
      expect(normDifficulty('medium')).to.equal('Medium');
      expect(normDifficulty('Medium')).to.equal('Medium');
      expect(normDifficulty('m')).to.equal('Medium');
      expect(normDifficulty('unknown')).to.equal('Medium');
      expect(normDifficulty('')).to.equal('Medium');
      expect(normDifficulty(null as any)).to.equal('Medium');
      expect(normDifficulty(undefined as any)).to.equal('Medium');
    });
  });

  describe('toLocalKey', () => {
    it('should format dates correctly', () => {
      const date = new Date(2023, 11, 25, 15, 30, 0); // Dec 25, 2023 3:30 PM
      expect(toLocalKey(date)).to.equal('2023-12-25');
    });

    it('should handle different times consistently', () => {
      const date1 = new Date(2023, 6, 15, 0, 0, 0); // July 15, 2023 midnight
      const date2 = new Date(2023, 6, 15, 12, 0, 0); // July 15, 2023 noon
      
      expect(toLocalKey(date1)).to.equal('2023-07-15');
      expect(toLocalKey(date2)).to.equal('2023-07-15');
    });

    it('should handle date boundaries', () => {
      const date1 = new Date(2023, 6, 15, 12, 0, 0); // July 15, 2023 noon
      const date2 = new Date(2023, 6, 16, 12, 0, 0); // July 16, 2023 noon
      
      expect(toLocalKey(date1)).to.equal('2023-07-15');
      expect(toLocalKey(date2)).to.equal('2023-07-16');
    });
  });

  describe('startOfWeekSunday', () => {
    it('should return Sunday for any day of the week', () => {
      const monday = new Date(2023, 7, 14); // Monday Aug 14, 2023 (month is 0-indexed)
      const sunday = startOfWeekSunday(monday);
      expect(sunday.getDay()).to.equal(0); // Sunday is 0
      expect(toLocalKey(sunday)).to.equal('2023-08-13');
    });

    it('should return same date if already Sunday', () => {
      const sunday = new Date(2023, 7, 13); // Sunday Aug 13, 2023
      const result = startOfWeekSunday(sunday);
      expect(result.getDay()).to.equal(0);
      expect(toLocalKey(result)).to.equal('2023-08-13');
    });

    it('should handle Saturday correctly', () => {
      const saturday = new Date(2023, 7, 12); // Saturday Aug 12, 2023
      const sunday = startOfWeekSunday(saturday);
      expect(sunday.getDay()).to.equal(0);
      expect(toLocalKey(sunday)).to.equal('2023-08-06'); // Previous Sunday
    });

    it('should handle various days of the week', () => {
      // Test a complete week starting Sunday 2023-08-13
      const testCases = [
        { day: new Date(2023, 7, 13), expected: '2023-08-13' }, // Sunday
        { day: new Date(2023, 7, 14), expected: '2023-08-13' }, // Monday
        { day: new Date(2023, 7, 15), expected: '2023-08-13' }, // Tuesday
        { day: new Date(2023, 7, 16), expected: '2023-08-13' }, // Wednesday
        { day: new Date(2023, 7, 17), expected: '2023-08-13' }, // Thursday
        { day: new Date(2023, 7, 18), expected: '2023-08-13' }, // Friday
        { day: new Date(2023, 7, 19), expected: '2023-08-13' }, // Saturday
      ];

      testCases.forEach(({ day, expected }) => {
        const result = startOfWeekSunday(day);
        expect(result.getDay()).to.equal(0, `${day.toDateString()} should find Sunday`);
        expect(toLocalKey(result)).to.equal(expected, `${day.toDateString()} should find correct Sunday`);
      });
    });
  });

  describe('addDays', () => {
    it('should add positive days', () => {
      const date = new Date(2023, 7, 15); // Aug 15, 2023
      const result = addDays(date, 5);
      expect(toLocalKey(result)).to.equal('2023-08-20');
    });

    it('should subtract days with negative input', () => {
      const date = new Date(2023, 7, 15); // Aug 15, 2023
      const result = addDays(date, -5);
      expect(toLocalKey(result)).to.equal('2023-08-10');
    });

    it('should handle month boundaries', () => {
      const date = new Date(2023, 7, 30); // Aug 30, 2023
      const result = addDays(date, 5);
      expect(toLocalKey(result)).to.equal('2023-09-04');
    });

    it('should handle zero days', () => {
      const date = new Date(2023, 7, 15); // Aug 15, 2023
      const result = addDays(date, 0);
      expect(toLocalKey(result)).to.equal('2023-08-15');
    });
  });

  describe('daysBetween', () => {
    it('should calculate difference correctly', () => {
      const date1 = new Date(2023, 7, 15); // Aug 15, 2023
      const date2 = new Date(2023, 7, 20); // Aug 20, 2023
      expect(daysBetween(date1, date2)).to.equal(5);
    });

    it('should handle reversed order', () => {
      const date1 = new Date(2023, 7, 20); // Aug 20, 2023
      const date2 = new Date(2023, 7, 15); // Aug 15, 2023
      expect(daysBetween(date1, date2)).to.equal(5);
    });

    it('should handle same date', () => {
      const date = new Date(2023, 7, 15); // Aug 15, 2023
      expect(daysBetween(date, date)).to.equal(0);
    });

    it('should handle month boundaries', () => {
      const date1 = new Date(2023, 7, 30); // Aug 30, 2023
      const date2 = new Date(2023, 8, 5); // Sep 5, 2023
      expect(daysBetween(date1, date2)).to.equal(6);
    });
  });

  describe('minutesToLevel', () => {
    it('should return correct activity levels', () => {
      expect(minutesToLevel(0)).to.equal(0);   // No activity
      expect(minutesToLevel(15)).to.equal(0);  // < 30 min
      expect(minutesToLevel(30)).to.equal(1);  // 30 min
      expect(minutesToLevel(45)).to.equal(1);  // 30-59 min
      expect(minutesToLevel(60)).to.equal(2);  // 1 hour
      expect(minutesToLevel(90)).to.equal(2);  // 1-2 hours
      expect(minutesToLevel(120)).to.equal(3); // 2+ hours
      expect(minutesToLevel(240)).to.equal(3); // 4+ hours
    });

    it('should handle edge cases', () => {
      expect(minutesToLevel(-10)).to.equal(0); // Negative
      expect(minutesToLevel(29)).to.equal(0);  // Just under 30
      expect(minutesToLevel(59)).to.equal(1);  // Just under 60
      expect(minutesToLevel(119)).to.equal(2); // Just under 120
    });
  });
});
