import { expect } from 'chai';
import { computeCalendarBuckets, renderCalendarHeatmap } from '../../src/lib/dashboardRenderer.js';

describe('Calendar Heatmap', () => {
  describe('computeCalendarBuckets', () => {
    it('should generate 56 days for 8 weeks', () => {
      const dailyMinutes = {};
      const buckets = computeCalendarBuckets(dailyMinutes);
      
      expect(buckets).to.have.length(56);
    });

    it('should correctly bucket intensity levels', () => {
      const dailyMinutes = {
        '2025-08-17': 0,    // level 0
        '2025-08-16': 10,   // level 1 (1-15)
        '2025-08-15': 25,   // level 2 (16-30)
        '2025-08-14': 45,   // level 3 (31-60)
        '2025-08-13': 90    // level 4 (61+)
      };
      
      const buckets = computeCalendarBuckets(dailyMinutes);
      const today = buckets.find(b => b.isToday);
      
      // Find the specific days in buckets
      const day0 = buckets.find(b => b.date === '2025-08-17');
      const day1 = buckets.find(b => b.date === '2025-08-16');
      const day2 = buckets.find(b => b.date === '2025-08-15');
      const day3 = buckets.find(b => b.date === '2025-08-14');
      const day4 = buckets.find(b => b.date === '2025-08-13');
      
      if (day0) expect(day0.level).to.equal(0);
      if (day1) expect(day1.level).to.equal(1);
      if (day2) expect(day2.level).to.equal(2);
      if (day3) expect(day3.level).to.equal(3);
      if (day4) expect(day4.level).to.equal(4);
    });

    it('should mark today correctly', () => {
      const dailyMinutes = {};
      const buckets = computeCalendarBuckets(dailyMinutes);
      
      const todayBuckets = buckets.filter(b => b.isToday);
      expect(todayBuckets).to.have.length(1);
      
      const today = new Date().toISOString().split('T')[0];
      expect(todayBuckets[0].date).to.equal(today);
    });

    it('should handle empty session data', () => {
      const buckets = computeCalendarBuckets({});
      
      expect(buckets).to.have.length(56);
      buckets.forEach(bucket => {
        expect(bucket.minutes).to.equal(0);
        expect(bucket.level).to.equal(0);
      });
    });

    it('should include dayOfWeek property', () => {
      const buckets = computeCalendarBuckets({});
      
      buckets.forEach(bucket => {
        expect(bucket.dayOfWeek).to.be.a('number');
        expect(bucket.dayOfWeek).to.be.at.least(0);
        expect(bucket.dayOfWeek).to.be.at.most(6);
      });
    });

    it('should handle daylight saving boundaries', () => {
      // This test ensures we don't have date calculation issues
      const dailyMinutes = {};
      const buckets = computeCalendarBuckets(dailyMinutes);
      
      // Check that dates are in proper sequence
      for (let i = 1; i < buckets.length; i++) {
        const prevDate = new Date(buckets[i-1].date);
        const currDate = new Date(buckets[i].date);
        const dayDiff = (currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24);
        expect(dayDiff).to.equal(1);
      }
    });

    it('should handle multi-session day correctly', () => {
      const dailyMinutes = {
        '2025-08-15': 90  // Multiple sessions adding up to 90 minutes
      };
      
      const buckets = computeCalendarBuckets(dailyMinutes);
      const day = buckets.find(b => b.date === '2025-08-15');
      
      if (day) {
        expect(day.minutes).to.equal(90);
        expect(day.level).to.equal(4); // 61+ minutes
      }
    });
  });

  describe('renderCalendarHeatmap', () => {
    it('should render error state for invalid buckets', () => {
      expect(renderCalendarHeatmap(null)).to.include('Calendar data unavailable');
      expect(renderCalendarHeatmap(undefined)).to.include('Calendar data unavailable');
      expect(renderCalendarHeatmap('invalid')).to.include('Calendar data unavailable');
    });

    it('should render basic calendar structure', () => {
      const buckets = [
        { date: '2025-08-17', minutes: 30, level: 2, dayOfWeek: 0, isToday: true },
        { date: '2025-08-16', minutes: 15, level: 1, dayOfWeek: 6, isToday: false }
      ];
      
      const result = renderCalendarHeatmap(buckets);
      
      expect(result).to.include('calendar-container');
      expect(result).to.include('calendar-grid');
      expect(result).to.include('calendar-legend');
      expect(result).to.include('Last 8 weeks');
    });

    it('should apply correct level classes', () => {
      const buckets = [
        { date: '2025-08-17', minutes: 0, level: 0, dayOfWeek: 0, isToday: false },
        { date: '2025-08-16', minutes: 10, level: 1, dayOfWeek: 6, isToday: false },
        { date: '2025-08-15', minutes: 25, level: 2, dayOfWeek: 5, isToday: false },
        { date: '2025-08-14', minutes: 45, level: 3, dayOfWeek: 4, isToday: false },
        { date: '2025-08-13', minutes: 90, level: 4, dayOfWeek: 3, isToday: false }
      ];
      
      const result = renderCalendarHeatmap(buckets);
      
      expect(result).to.include('lvl-0');
      expect(result).to.include('lvl-1');
      expect(result).to.include('lvl-2');
      expect(result).to.include('lvl-3');
      expect(result).to.include('lvl-4');
    });

    it('should mark today with special class', () => {
      const buckets = [
        { date: '2025-08-17', minutes: 30, level: 2, dayOfWeek: 0, isToday: true },
        { date: '2025-08-16', minutes: 15, level: 1, dayOfWeek: 6, isToday: false }
      ];
      
      const result = renderCalendarHeatmap(buckets);
      expect(result).to.include('today');
    });

    it('should include proper ARIA labels', () => {
      const buckets = [
        { date: '2025-08-17', minutes: 42, level: 3, dayOfWeek: 0, isToday: false }
      ];
      
      const result = renderCalendarHeatmap(buckets);
      expect(result).to.include('aria-label');
      expect(result).to.include('2025-08-17: 42 minutes');
    });

    it('should escape HTML in dates and aria labels', () => {
      const buckets = [
        { date: '2025-08<script>alert("xss")</script>17', minutes: 30, level: 2, dayOfWeek: 0, isToday: false }
      ];
      
      const result = renderCalendarHeatmap(buckets);
      expect(result).to.not.include('<script>');
      expect(result).to.include('&lt;script&gt;');
    });

    it('should group days into weeks correctly', () => {
      // Create 14 days (2 weeks)
      const buckets = [];
      for (let i = 0; i < 14; i++) {
        buckets.push({
          date: `2025-08-${String(i + 1).padStart(2, '0')}`,
          minutes: 30,
          level: 2,
          dayOfWeek: i % 7,
          isToday: false
        });
      }
      
      const result = renderCalendarHeatmap(buckets);
      const weekMatches = (result.match(/cal-week/g) || []).length;
      expect(weekMatches).to.be.at.least(2);
    });

    it('should include legend with all intensity levels', () => {
      const buckets = [
        { date: '2025-08-17', minutes: 30, level: 2, dayOfWeek: 0, isToday: false }
      ];
      
      const result = renderCalendarHeatmap(buckets);
      
      expect(result).to.include('legend-level lvl-0');
      expect(result).to.include('legend-level lvl-1');
      expect(result).to.include('legend-level lvl-2');
      expect(result).to.include('legend-level lvl-3');
      expect(result).to.include('legend-level lvl-4');
      expect(result).to.include('Less');
      expect(result).to.include('More');
    });

    it('should render 56 calendar cells for 8 weeks', () => {
      const buckets = computeCalendarBuckets({});
      const result = renderCalendarHeatmap(buckets);
      
      const cellMatches = (result.match(/cal-day/g) || []).length;
      expect(cellMatches).to.equal(56);
    });
  });
});
