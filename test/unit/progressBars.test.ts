import { expect } from 'chai';
import { renderPatternBars, computeCalendarBuckets, renderCalendarHeatmap, formatSessionTimer } from '../../src/lib/dashboardRenderer.js';

describe('Progress Bars', () => {
  describe('renderPatternBars', () => {
    it('should render empty state for no patterns', () => {
      const result = renderPatternBars([]);
      expect(result).to.include('No patterns found');
    });

    it('should render empty state for null/undefined patterns', () => {
      expect(renderPatternBars(null)).to.include('No patterns found');
      expect(renderPatternBars(undefined)).to.include('No patterns found');
    });

    it('should render basic progress bars', () => {
      const stats = [
        { pattern: 'Arrays And Hashing', solved: 3, total: 5 },
        { pattern: 'Two Pointers', solved: 1, total: 2 }
      ];

      const result = renderPatternBars(stats);
      
      expect(result).to.include('Arrays And Hashing');
      expect(result).to.include('3 / 5');
      expect(result).to.include('Two Pointers');
      expect(result).to.include('1 / 2');
      expect(result).to.include('progress-bar');
      expect(result).to.include('progress-segment');
    });

    it('should apply correct segment classes based on difficulty', () => {
      const stats = [{ pattern: 'Test Pattern', solved: 1, total: 3 }];
      const problemsMap = {
        'Test Pattern': [
          { difficulty: 'Easy' },
          { difficulty: 'Medium' },
          { difficulty: 'Hard' }
        ]
      };

      const result = renderPatternBars(stats, { problemsMap });
      
      expect(result).to.include('seg-easy solved');
      expect(result).to.include('seg-medium unsolved');
      expect(result).to.include('seg-hard unsolved');
    });

    it('should handle solved/unsolved segments correctly', () => {
      const stats = [{ pattern: 'Test', solved: 2, total: 4 }];
      const result = renderPatternBars(stats);
      
      // Should have 2 solved segments and 2 unsolved segments
      const solvedMatches = (result.match(/solved/g) || []).length;
      const unsolvedMatches = (result.match(/unsolved/g) || []).length;
      
      expect(solvedMatches).to.be.at.least(2);
      expect(unsolvedMatches).to.be.at.least(2);
    });

    it('should include proper ARIA attributes', () => {
      const stats = [{ pattern: 'Test Pattern', solved: 2, total: 5 }];
      const result = renderPatternBars(stats);
      
      expect(result).to.include('role="group"');
      expect(result).to.include('role="progressbar"');
      expect(result).to.include('aria-label');
      expect(result).to.include('aria-valuenow="2"');
      expect(result).to.include('aria-valuemax="5"');
    });

    it('should escape HTML in pattern names', () => {
      const stats = [{ pattern: '<script>alert("xss")</script>', solved: 1, total: 2 }];
      const result = renderPatternBars(stats);
      
      expect(result).to.not.include('<script>');
      expect(result).to.include('&lt;script&gt;');
    });

    it('should maintain stable order', () => {
      const stats = [
        { pattern: 'B Pattern', solved: 1, total: 2 },
        { pattern: 'A Pattern', solved: 2, total: 3 }
      ];

      const result1 = renderPatternBars(stats);
      const result2 = renderPatternBars(stats);
      
      expect(result1).to.equal(result2);
    });

    it('should handle edge case of 0 total problems', () => {
      const stats = [{ pattern: 'Empty Pattern', solved: 0, total: 0 }];
      const result = renderPatternBars(stats);
      
      expect(result).to.include('Empty Pattern');
      expect(result).to.include('0 / 0');
    });

    it('should handle 100% completion', () => {
      const stats = [{ pattern: 'Complete Pattern', solved: 3, total: 3 }];
      const result = renderPatternBars(stats);
      
      expect(result).to.include('3 / 3');
      expect(result).to.include('aria-valuenow="3"');
      expect(result).to.include('aria-valuemax="3"');
    });

    it('should default to easy difficulty when problem data missing', () => {
      const stats = [{ pattern: 'Test', solved: 1, total: 2 }];
      const problemsMap = {}; // No problem data
      
      const result = renderPatternBars(stats, { problemsMap });
      expect(result).to.include('seg-easy');
    });
  });
});
