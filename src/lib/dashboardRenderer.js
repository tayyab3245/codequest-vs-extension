// NOTE: mirrored helper; kept in sync by unit test.

/**
 * HTML rendering utilities for the dashboard webview
 */

/**
 * Escapes HTML special characters to prevent XSS injection
 * @param {string|null|undefined} text - Text to escape
 * @returns {string} - HTML-safe escaped text
 */
function escapeHtml(text) {
  if (text == null) return '';
  return String(text).replace(/[&<>"']/g, function(char) {
    return {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    }[char];
  });
}

/**
 * Renders problem details as safe HTML string
 * @param {object|null} problem - Problem object with pattern, number, name, date, difficulty
 * @returns {string} - HTML string with escaped content
 */
function renderProblemDetails(problem) {
  if (!problem) {
    return '<div class="no-problem">No homework.js file open</div>';
  }

  const difficultyClass = `difficulty-${escapeHtml(problem.difficulty).toLowerCase()}`;
  
  return `
    <div class="problem-details">
      <div class="problem-row">
        <span class="problem-label">Pattern:</span>
        <span class="problem-value">${escapeHtml(problem.pattern)}</span>
      </div>
      <div class="problem-row">
        <span class="problem-label">Problem #:</span>
        <span class="problem-value">${escapeHtml(problem.number)}</span>
      </div>
      <div class="problem-row">
        <span class="problem-label">Name:</span>
        <span class="problem-value">${escapeHtml(problem.name)}</span>
      </div>
      <div class="problem-row">
        <span class="problem-label">Date:</span>
        <span class="problem-value">${escapeHtml(problem.date)}</span>
      </div>
      <div class="problem-row">
        <span class="problem-label">Difficulty:</span>
        <span class="problem-value ${difficultyClass}">${escapeHtml(problem.difficulty)}</span>
      </div>
    </div>
  `;
}

/**
 * Filter problems based on solved state and filter type
 * @param {Array} problems - Array of problem objects
 * @param {string} filter - Filter type: 'all', 'solved', 'unsolved'
 * @param {Array} solvedKeys - Array of solved problem keys
 * @returns {Array} Filtered problems array
 */
function filterProblems(problems, filter, solvedKeys = []) {
  if (!problems || !Array.isArray(problems)) return [];
  
  const solvedSet = new Set(solvedKeys);
  
  switch (filter) {
    case 'solved':
      return problems.filter(p => p.key && solvedSet.has(p.key));
    case 'unsolved':
      return problems.filter(p => p.key && !solvedSet.has(p.key));
    default:
      return problems;
  }
}

/**
 * Compute pattern statistics from problems and solved keys
 * @param {Array} problems - Array of problem objects
 * @param {Array} solvedKeys - Array of solved problem keys
 * @returns {Array} Pattern stats with solved/total counts
 */
function computePatternStats(problems, solvedKeys = []) {
  if (!problems || !Array.isArray(problems)) return [];
  
  const solvedSet = new Set(solvedKeys);
  const patternMap = new Map();
  
  // Count total and solved per pattern
  problems.forEach(problem => {
    if (!problem.pattern) return;
    
    const pattern = problem.pattern;
    if (!patternMap.has(pattern)) {
      patternMap.set(pattern, { total: 0, solved: 0 });
    }
    
    const stats = patternMap.get(pattern);
    stats.total++;
    if (problem.key && solvedSet.has(problem.key)) {
      stats.solved++;
    }
  });
  
  // Convert to array format
  return Array.from(patternMap.entries()).map(([pattern, stats]) => ({
    pattern,
    total: stats.total,
    solved: stats.solved
  })).sort((a, b) => a.pattern.localeCompare(b.pattern));
}

/**
 * Renders segmented progress bars for patterns
 * @param {Array} patternStats - Array of pattern statistics {pattern, solved, total}
 * @param {Object} options - Rendering options (problemsMap for difficulty info)
 * @returns {string} - HTML string with escaped content
 */
function renderPatternBars(patternStats, options = {}) {
  if (!Array.isArray(patternStats) || patternStats.length === 0) {
    return '<div class="no-patterns">No patterns found</div>';
  }

  const problemsMap = options.problemsMap || {};

  return patternStats.map(function(stats) {
    const segments = [];
    const patternProblems = problemsMap[stats.pattern] || [];
    
    // Create segments based on total count
    for (let i = 0; i < stats.total; i++) {
      const problem = patternProblems[i];
      const difficulty = problem ? problem.difficulty.toLowerCase() : 'easy';
      const isSolved = i < stats.solved;
      const segmentClass = `seg-${difficulty} ${isSolved ? 'solved' : 'unsolved'}`;
      
      segments.push(`<div class="progress-segment ${segmentClass}" aria-hidden="true"></div>`);
    }

    const ariaLabel = `${stats.pattern} progress, ${stats.solved} of ${stats.total} solved`;

    return `
      <div class="pattern-progress" role="group" aria-label="${escapeHtml(ariaLabel)}">
        <div class="pattern-header">
          <span class="pattern-name">${escapeHtml(stats.pattern)}</span>
          <span class="pattern-count">Solved ${stats.solved} / ${stats.total}</span>
        </div>
        <div class="progress-bar" role="progressbar" 
             aria-valuenow="${stats.solved}" 
             aria-valuemin="0" 
             aria-valuemax="${stats.total}"
             aria-valuetext="Solved ${stats.solved} of ${stats.total}"
             aria-label="${escapeHtml(ariaLabel)}">
          ${segments.join('')}
        </div>
      </div>
    `;
  }).join('');
}

/**
 * Computes calendar buckets from session data
 * @param {Object} dailyMinutes - Map of 'YYYY-MM-DD' -> minutes
 * @returns {Array} - Array of calendar day objects for the last 8 weeks
 */
function computeCalendarBuckets(dailyMinutes) {
  const buckets = [];
  const today = new Date();
  const msPerDay = 24 * 60 * 60 * 1000;

  // Generate last 8 weeks (56 days)
  for (let i = 55; i >= 0; i--) {
    const date = new Date(today.getTime() - i * msPerDay);
    const dateStr = date.toISOString().split('T')[0];
    const minutes = dailyMinutes[dateStr] || 0;
    
    // Bucket intensity levels: 0, 1-15, 16-30, 31-60, 61+
    let level = 0;
    if (minutes > 0) {
      if (minutes <= 15) level = 1;
      else if (minutes <= 30) level = 2;
      else if (minutes <= 60) level = 3;
      else level = 4;
    }

    buckets.push({
      date: dateStr,
      minutes: minutes,
      level: level,
      dayOfWeek: date.getDay(),
      isToday: dateStr === today.toISOString().split('T')[0]
    });
  }

  return buckets;
}

/**
 * Renders calendar heatmap
 * @param {Array} buckets - Array of calendar day objects
 * @param {Object} options - Rendering options
 * @returns {string} - HTML string with escaped content
 */
function renderCalendarHeatmap(buckets, options = {}) {
  if (!Array.isArray(buckets)) {
    return '<div class="calendar-error">Calendar data unavailable</div>';
  }

  const weeks = [];
  let currentWeek = [];

  buckets.forEach(function(day, index) {
    currentWeek.push(day);
    
    // End of week (Sunday) or last day
    if (day.dayOfWeek === 0 || index === buckets.length - 1) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  });

  const weeksHtml = weeks.map(function(week) {
    const daysHtml = week.map(function(day) {
      const levelClass = `lvl-${day.level}`;
      const todayClass = day.isToday ? 'today' : '';
      const ariaLabel = `${day.date}: ${day.minutes} minutes`;
      
      return `<div class="cal-day ${levelClass} ${todayClass}" 
                   aria-label="${escapeHtml(ariaLabel)}" 
                   title="${escapeHtml(ariaLabel)}"
                   data-date="${escapeHtml(day.date)}"></div>`;
    }).join('');
    
    return `<div class="cal-week">${daysHtml}</div>`;
  }).join('');

  return `
    <div class="calendar-container">
      <div class="calendar-header">Last 8 weeks</div>
      <div class="calendar-grid">${weeksHtml}</div>
      <div class="calendar-legend">
        <span class="legend-label">Less</span>
        <div class="legend-levels">
          <div class="legend-level lvl-0" title="0 minutes"></div>
          <div class="legend-level lvl-1" title="1-15 minutes"></div>
          <div class="legend-level lvl-2" title="16-30 minutes"></div>
          <div class="legend-level lvl-3" title="31-60 minutes"></div>
          <div class="legend-level lvl-4" title="60+ minutes"></div>
        </div>
        <span class="legend-label">More</span>
      </div>
    </div>
  `;
}

/**
 * Formats session timer display
 * @param {number} ms - Milliseconds elapsed
 * @returns {string} - Formatted time string
 */
function formatSessionTimer(ms) {
  if (ms < 0) ms = 0;
  
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

// Export for testing (Node.js environment)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { 
    escapeHtml, 
    renderProblemDetails, 
    filterProblems, 
    computePatternStats,
    renderPatternBars,
    computeCalendarBuckets,
    renderCalendarHeatmap,
    formatSessionTimer
  };
}
