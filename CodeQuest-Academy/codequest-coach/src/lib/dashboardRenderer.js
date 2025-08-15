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

// Export for testing (Node.js environment)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { escapeHtml, renderProblemDetails, filterProblems, computePatternStats };
}
