const { expect } = require('chai');
const { 
  renderPatternBars, 
  computeCalendarBuckets, 
  renderCalendarHeatmap, 
  formatSessionTimer 
} = require('../../src/lib/dashboardRenderer.js');

describe('Progress Bars', function() {
  describe('renderPatternBars', function() {
    it('should render empty state for no patterns', function() {
      const result = renderPatternBars([]);
      expect(result).to.include('No patterns found');
    });

    it('should render basic progress bars', function() {
      const stats = [
        { pattern: 'Arrays And Hashing', solved: 3, total: 5 },
        { pattern: 'Two Pointers', solved: 1, total: 2 }
      ];

      const result = renderPatternBars(stats);
      
      expect(result).to.include('Arrays And Hashing');
      expect(result).to.include('Solved 3 / 5');
      expect(result).to.include('Two Pointers');
      expect(result).to.include('Solved 1 / 2');
      expect(result).to.include('progress-bar');
      expect(result).to.include('progress-segment');
    });

    it('should include proper ARIA attributes', function() {
      const stats = [{ pattern: 'Test Pattern', solved: 2, total: 5 }];
      const result = renderPatternBars(stats);
      
      expect(result).to.include('role="group"');
      expect(result).to.include('role="progressbar"');
      expect(result).to.include('aria-label');
      expect(result).to.include('aria-valuenow="2"');
      expect(result).to.include('aria-valuemax="5"');
      expect(result).to.include('aria-valuetext="Solved 2 of 5"');
    });

    it('should escape HTML in pattern names', function() {
      const stats = [{ pattern: '<script>alert("xss")</script>', solved: 1, total: 2 }];
      const result = renderPatternBars(stats);
      
      expect(result).to.not.include('<script>');
      expect(result).to.include('&lt;script&gt;');
    });
  });
});

describe('Calendar Heatmap', function() {
  describe('computeCalendarBuckets', function() {
    it('should generate 56 days for 8 weeks', function() {
      const dailyMinutes = {};
      const buckets = computeCalendarBuckets(dailyMinutes);
      
      expect(buckets).to.have.length(56);
    });

    it('should correctly bucket intensity levels', function() {
      const dailyMinutes = {
        '2025-08-17': 0,    // level 0
        '2025-08-16': 10,   // level 1 (1-15)
        '2025-08-15': 25,   // level 2 (16-30)
        '2025-08-14': 45,   // level 3 (31-60)
        '2025-08-13': 90    // level 4 (61+)
      };
      
      const buckets = computeCalendarBuckets(dailyMinutes);
      
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

    it('should mark today correctly', function() {
      const dailyMinutes = {};
      const buckets = computeCalendarBuckets(dailyMinutes);
      
      const todayBuckets = buckets.filter(b => b.isToday);
      expect(todayBuckets).to.have.length(1);
      
      const today = new Date().toISOString().split('T')[0];
      expect(todayBuckets[0].date).to.equal(today);
    });
  });

  describe('renderCalendarHeatmap', function() {
    it('should render error state for invalid buckets', function() {
      expect(renderCalendarHeatmap(null)).to.include('Calendar data unavailable');
      expect(renderCalendarHeatmap(undefined)).to.include('Calendar data unavailable');
    });

    it('should render basic calendar structure', function() {
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

    it('should include proper ARIA labels', function() {
      const buckets = [
        { date: '2025-08-17', minutes: 42, level: 3, dayOfWeek: 0, isToday: false }
      ];
      
      const result = renderCalendarHeatmap(buckets);
      expect(result).to.include('aria-label');
      expect(result).to.include('2025-08-17: 42 minutes');
    });
  });
});

describe('Session Timers', function() {
  describe('formatSessionTimer', function() {
    it('should format zero time correctly', function() {
      expect(formatSessionTimer(0)).to.equal('00:00');
    });

    it('should format seconds only', function() {
      expect(formatSessionTimer(30000)).to.equal('00:30'); // 30 seconds
      expect(formatSessionTimer(59000)).to.equal('00:59'); // 59 seconds
    });

    it('should format minutes and seconds', function() {
      expect(formatSessionTimer(60000)).to.equal('01:00'); // 1 minute
      expect(formatSessionTimer(90000)).to.equal('01:30'); // 1 minute 30 seconds
    });

    it('should handle negative input gracefully', function() {
      expect(formatSessionTimer(-1000)).to.equal('00:00');
      expect(formatSessionTimer(-60000)).to.equal('00:00');
    });

    it('should pad single digits with zeros', function() {
      expect(formatSessionTimer(5000)).to.equal('00:05'); // 5 seconds
      expect(formatSessionTimer(65000)).to.equal('01:05'); // 1 minute 5 seconds
    });
  });
});
