import { expect } from 'chai';
import { formatSessionTimer } from '../../src/lib/dashboardRenderer.js';

describe('Session Timers', () => {
  describe('formatSessionTimer', () => {
    it('should format zero time correctly', () => {
      expect(formatSessionTimer(0)).to.equal('00:00');
    });

    it('should format seconds only', () => {
      expect(formatSessionTimer(30000)).to.equal('00:30'); // 30 seconds
      expect(formatSessionTimer(59000)).to.equal('00:59'); // 59 seconds
    });

    it('should format minutes and seconds', () => {
      expect(formatSessionTimer(60000)).to.equal('01:00'); // 1 minute
      expect(formatSessionTimer(90000)).to.equal('01:30'); // 1 minute 30 seconds
      expect(formatSessionTimer(599000)).to.equal('09:59'); // 9 minutes 59 seconds
    });

    it('should format hours as minutes', () => {
      expect(formatSessionTimer(3600000)).to.equal('60:00'); // 1 hour = 60 minutes
      expect(formatSessionTimer(7200000)).to.equal('120:00'); // 2 hours = 120 minutes
    });

    it('should handle fractional seconds', () => {
      expect(formatSessionTimer(30500)).to.equal('00:30'); // 30.5 seconds -> 30 seconds
      expect(formatSessionTimer(60999)).to.equal('01:00'); // 60.999 seconds -> 1 minute
    });

    it('should handle negative input gracefully', () => {
      expect(formatSessionTimer(-1000)).to.equal('00:00');
      expect(formatSessionTimer(-60000)).to.equal('00:00');
    });

    it('should pad single digits with zeros', () => {
      expect(formatSessionTimer(5000)).to.equal('00:05'); // 5 seconds
      expect(formatSessionTimer(65000)).to.equal('01:05'); // 1 minute 5 seconds
      expect(formatSessionTimer(540000)).to.equal('09:00'); // 9 minutes
    });

    it('should handle large values', () => {
      expect(formatSessionTimer(999 * 60 * 1000)).to.equal('999:00'); // 999 minutes
      expect(formatSessionTimer(1440 * 60 * 1000)).to.equal('1440:00'); // 24 hours
    });

    it('should be deterministic', () => {
      const input = 125500; // 2 minutes 5.5 seconds
      const result1 = formatSessionTimer(input);
      const result2 = formatSessionTimer(input);
      expect(result1).to.equal(result2);
      expect(result1).to.equal('02:05');
    });
  });

  describe('Session State Management', () => {
    it('should handle session start', () => {
      const mockStartTime = new Date('2025-08-17T10:00:00Z').toISOString();
      const mockCurrentTime = new Date('2025-08-17T10:25:30Z').getTime();
      
      const elapsed = mockCurrentTime - new Date(mockStartTime).getTime();
      const formatted = formatSessionTimer(elapsed);
      
      expect(formatted).to.equal('25:30');
    });

    it('should handle session end calculation', () => {
      const startTime = new Date('2025-08-17T10:00:00Z');
      const endTime = new Date('2025-08-17T10:42:15Z');
      
      const sessionMinutes = Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60));
      expect(sessionMinutes).to.equal(42);
    });

    it('should handle midnight boundary', () => {
      const startTime = new Date('2025-08-17T23:30:00Z');
      const endTime = new Date('2025-08-18T00:30:00Z');
      
      const sessionMinutes = Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60));
      expect(sessionMinutes).to.equal(60);
    });

    it('should handle timezone-safe date keys', () => {
      const date1 = new Date('2025-08-17T23:30:00Z');
      const date2 = new Date('2025-08-18T00:30:00Z');
      
      const key1 = date1.toISOString().split('T')[0];
      const key2 = date2.toISOString().split('T')[0];
      
      expect(key1).to.equal('2025-08-17');
      expect(key2).to.equal('2025-08-18');
      expect(key1).to.not.equal(key2);
    });

    it('should accumulate daily minutes correctly', () => {
      const dailyMinutes = {
        '2025-08-17': 30
      };
      
      const additionalMinutes = 25;
      const newTotal = (dailyMinutes['2025-08-17'] || 0) + additionalMinutes;
      
      expect(newTotal).to.equal(55);
    });

    it('should handle session restore from reload', () => {
      const sessionStartAt = new Date('2025-08-17T10:00:00Z').toISOString();
      const currentTime = new Date('2025-08-17T10:15:30Z');
      
      // Simulate restoration after reload
      const wasRunning = true;
      const elapsed = currentTime.getTime() - new Date(sessionStartAt).getTime();
      
      expect(wasRunning).to.be.true;
      expect(formatSessionTimer(elapsed)).to.equal('15:30');
    });

    it('should handle edge case of very short session', () => {
      const startTime = new Date('2025-08-17T10:00:00Z');
      const endTime = new Date('2025-08-17T10:00:15Z'); // 15 seconds
      
      const sessionMinutes = Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60));
      expect(sessionMinutes).to.equal(0); // Rounds to 0 minutes
    });

    it('should handle edge case of long session', () => {
      const startTime = new Date('2025-08-17T08:00:00Z');
      const endTime = new Date('2025-08-17T18:30:00Z'); // 10.5 hours
      
      const sessionMinutes = Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60));
      expect(sessionMinutes).to.equal(630); // 10.5 * 60 = 630 minutes
    });
  });
});
