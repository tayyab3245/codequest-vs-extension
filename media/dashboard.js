// NOTE: mirrored helper; kept in sync by unit test.

const vscode = acquireVsCodeApi();

// HTML escaping utility
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

// Render problem details as escaped HTML string
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

// State management
let state = {
  workspacePath: 'No folder open',
  problemCount: 0,
  currentProblem: null,
  problems: [],
  installedAt: null,
  solvedKeys: [],
  filter: 'all',
  patternStats: [],
  session: {
    running: false,
    todayMinutes: 0
  },
  calendar: {
    dailyMinutes: {}
  }
};

// Preview mode state
let previewMode = false;
let previewLabel = '';

// Session timer state
let sessionUpdateInterval = null;

// UI update functions
function updateUI() {
  document.getElementById('workspacePath').textContent = state.workspacePath;
  document.getElementById('problemCount').textContent = state.problemCount.toString();
  
  if (state.installedAt) {
    const date = new Date(state.installedAt).toLocaleDateString();
    document.getElementById('installedBadge').textContent = `Installed: ${date}`;
  }

  updateCurrentProblem();
  updatePatternStats();
  updateProblemsList();
  updateFilterChips();
  updateSessionTimer();
  updateCalendarHeatmap();
}

function updateFilterChips() {
  const currentFilter = state.filter || 'all';
  document.querySelectorAll('.filter-chip').forEach(chip => {
    const chipFilter = chip.dataset.filter;
    if (chipFilter === currentFilter) {
      chip.classList.add('active');
      chip.setAttribute('aria-selected', 'true');
    } else {
      chip.classList.remove('active');
      chip.setAttribute('aria-selected', 'false');
    }
  });
}

function updateCurrentProblem() {
  const container = document.getElementById('currentProblem');
  container.innerHTML = renderProblemDetails(state.currentProblem);
}

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

function renderProblemsList(problems) {
  if (!problems || problems.length === 0) {
    return '';
  }
  
  const solvedKeys = new Set(state.solvedKeys || []);

  return problems.map(problem => {
    const isSolved = solvedKeys.has(problem.key);
    const difficultyClass = `difficulty-${escapeHtml(problem.difficulty).toLowerCase()}`;
    const solvedClass = isSolved ? ' solved' : '';
    const solvedIndicator = isSolved ? '<span class="problem-solved-indicator">✓</span>' : '';
    
    // Create ARIA label for accessibility
    const aria = `${problem.number} — ${problem.name} — ${problem.pattern} — ${problem.difficulty}${isSolved ? ' — solved' : ''}`;
    
    return `
      <div class="problem-item${solvedClass}" role="listitem" tabindex="0" data-key="${escapeHtml(problem.key)}" aria-label="${escapeHtml(aria)}">
        <div class="problem-header">
          <span class="problem-number">${escapeHtml(problem.number)}</span>
          <span class="problem-name">${escapeHtml(problem.name)}</span>
          ${solvedIndicator}
        </div>
        <div class="problem-meta">
          <span class="problem-pattern">${escapeHtml(problem.pattern)}</span>
          <span class="problem-difficulty ${difficultyClass}">${escapeHtml(problem.difficulty)}</span>
        </div>
      </div>
    `;
  }).join('');
}

function updateProblemsList() {
  const container = document.getElementById('problemsList');
  const filteredProblems = filterProblems(state.problems, state.filter, state.solvedKeys);
  container.innerHTML = renderProblemsList(filteredProblems);
}

function updatePatternStats() {
  const container = document.getElementById('patternStats');
  if (!container) return;

  if (!state.patternStats || state.patternStats.length === 0) {
    container.innerHTML = '<div class="no-patterns">No patterns found</div>';
    return;
  }

  // Create problems map for difficulty info
  const problemsMap = {};
  if (state.problems) {
    state.problems.forEach(problem => {
      if (!problemsMap[problem.pattern]) {
        problemsMap[problem.pattern] = [];
      }
      problemsMap[problem.pattern].push(problem);
    });
  }

  // Use renderer function
  const barsHtml = renderPatternBars(state.patternStats, { problemsMap });
  container.innerHTML = barsHtml;
}

function updateSessionTimer() {
  const container = document.getElementById('sessionTimer');
  if (!container) return;

  if (!state.session) {
    container.innerHTML = '<div class="today-minutes">No session data</div>';
    return;
  }

  let timerHtml = '';

  if (state.session.running && state.session.startedAt) {
    const elapsed = Date.now() - new Date(state.session.startedAt).getTime();
    const timeStr = formatSessionTimer(elapsed);
    
    timerHtml = `
      <div class="session-badge running">
        <span>Session Running</span>
        <span class="session-time">${escapeHtml(timeStr)}</span>
      </div>
    `;

    // Set up live timer updates
    if (!sessionUpdateInterval) {
      sessionUpdateInterval = setInterval(() => {
        if (state.session.running && state.session.startedAt) {
          const elapsed = Date.now() - new Date(state.session.startedAt).getTime();
          const timeStr = formatSessionTimer(elapsed);
          const timeElement = container.querySelector('.session-time');
          if (timeElement) {
            timeElement.textContent = timeStr;
          }
        }
      }, 1000);
    }
  } else {
    timerHtml = `
      <div class="session-badge stopped">
        <span>No Active Session</span>
      </div>
    `;

    // Clear timer updates
    if (sessionUpdateInterval) {
      clearInterval(sessionUpdateInterval);
      sessionUpdateInterval = null;
    }
  }

  timerHtml += `<div class="today-minutes">Today: ${state.session.todayMinutes || 0} minutes</div>`;
  container.innerHTML = timerHtml;
}

function updateCalendarHeatmap() {
  const container = document.getElementById('calendarHeatmap');
  if (!container) return;

  if (!state.calendar || !state.calendar.dailyMinutes) {
    container.innerHTML = '<div class="calendar-error">Calendar data unavailable</div>';
    return;
  }

  // Use renderer functions
  const buckets = computeCalendarBuckets(state.calendar.dailyMinutes);
  const heatmapHtml = renderCalendarHeatmap(buckets);
  container.innerHTML = heatmapHtml;
}

// Rendering helper functions (mirrored from dashboardRenderer.js)
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

function computeCalendarBuckets(dailyMinutes) {
  const buckets = [];
  const today = new Date();
  const todayUtcStr = new Date().toISOString().split('T')[0];
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

    const dayOfWeek = date.getUTCDay();
    const isToday = dateStr === todayUtcStr;

    buckets.push({
      date: dateStr,
      minutes: minutes,
      level: level,
      dayOfWeek: dayOfWeek,
      isToday: isToday
    });
  }

  return buckets;
}

function renderCalendarHeatmap(buckets) {
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

function formatSessionTimer(ms) {
  if (ms < 0) ms = 0;
  
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

function showMessage(text, duration = 3000) {
  const el = document.getElementById('statusMessage');
  el.textContent = text;
  el.classList.remove('hidden');
  setTimeout(() => {
    el.classList.add('hidden');
  }, duration);
}

// Preview mode management
function updatePreviewMode(enabled, label) {
  previewMode = enabled;
  previewLabel = label;
  
  const banner = document.getElementById('previewBanner');
  const exitButton = document.getElementById('exitPreview');
  
  if (enabled) {
    banner.textContent = `Preview Mode: ${label}. Click "Exit Preview" to return to live data.`;
    banner.classList.remove('hidden');
    banner.classList.add('preview-on');
    exitButton.classList.remove('hidden');
  } else {
    banner.classList.add('hidden');
    banner.classList.remove('preview-on');
    exitButton.classList.add('hidden');
  }
}

// Message handling
window.addEventListener('message', event => {
  const message = event.data;
  
  switch (message.type) {
    case 'updateState':
      Object.assign(state, message.data);
      updateUI();
      break;
    case 'setPreviewMode':
      updatePreviewMode(message.data.enabled, message.data.label);
      break;
    case 'showMessage':
      showMessage(message.data.text, message.data.duration);
      break;
  }
});

// DOM event handlers
document.addEventListener('DOMContentLoaded', () => {
  // Command buttons
  document.getElementById('startSession').addEventListener('click', () => {
    vscode.postMessage({ command: 'codequest.startSession' });
  });

  document.getElementById('endSession').addEventListener('click', () => {
    vscode.postMessage({ command: 'codequest.endSession' });
  });

  document.getElementById('markSolved').addEventListener('click', () => {
    vscode.postMessage({ command: 'codequest.markSolved' });
  });

  document.getElementById('importLegacy').addEventListener('click', () => {
    vscode.postMessage({ command: 'codequest.importLegacy' });
  });

  document.getElementById('newProblem').addEventListener('click', () => {
    vscode.postMessage({ command: 'codequest.newProblem' });
  });

  document.getElementById('refreshProblems').addEventListener('click', () => {
    vscode.postMessage({ command: 'codequest.refreshProblems' });
  });

  // Filter chips
  document.querySelectorAll('.filter-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const filter = chip.dataset.filter;
      vscode.postMessage({ command: 'codequest.setFilter', filter });
    });
  });

  // Problems list event delegation
  document.getElementById('problemsList').addEventListener('click', (e) => {
    const problemItem = e.target.closest('.problem-item');
    if (problemItem) {
      const key = problemItem.dataset.key;
      vscode.postMessage({ command: 'codequest.openProblem', key });
    }
  });

  document.getElementById('problemsList').addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      const problemItem = e.target.closest('.problem-item');
      if (problemItem) {
        e.preventDefault();
        const key = problemItem.dataset.key;
        vscode.postMessage({ command: 'codequest.openProblem', key });
      }
    }
  });

  document.getElementById('exitPreview').addEventListener('click', () => {
    vscode.postMessage({ command: 'codequest.requestLiveState' });
  });

  // Request initial state
  vscode.postMessage({ command: 'getInitialState' });
});
