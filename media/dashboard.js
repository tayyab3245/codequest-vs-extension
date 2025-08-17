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
  patternStats: []
};

// Preview mode state - previewLabel kept for potential future features (e.g., mode-specific styling)
let previewMode = false;
let previewLabel = '';

// UI update functions
function updateUI() {
  document.getElementById('workspacePath').textContent = state.workspacePath;
  document.getElementById('problemCount').textContent = state.problemCount.toString();
  
  if (state.installedAt) {
    const date = new Date(state.installedAt).toLocaleDateString();
    document.getElementById('installedBadge').textContent = `Installed: ${date}`;
  }

  updateCurrentProblem();
  updateProblemsList();
  updateFilterChips();
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

function updateProblemsList() {
  const container = document.getElementById('problemsList');
  const filteredProblems = filterProblems(state.problems || [], state.filter || 'all', state.solvedKeys || []);
  container.innerHTML = renderProblemsList(filteredProblems);
  updatePatternStats(state.patternStats || []);
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
    
    return `
      <div class="problem-item${solvedClass}" role="listitem" tabindex="0" data-key="${escapeHtml(problem.key)}">
        <div class="problem-info">
          <div class="problem-name">${escapeHtml(problem.pattern)} • #${escapeHtml(problem.number)} ${escapeHtml(problem.name)}</div>
          <div class="problem-meta">${escapeHtml(problem.date)} · <span class="${difficultyClass}">${escapeHtml(problem.difficulty)}</span></div>
        </div>
        ${solvedIndicator}
      </div>
    `;
  }).join('');
}

function updatePatternStats(patternStats) {
  const container = document.getElementById('patternStats');
  if (!patternStats || patternStats.length === 0) {
    container.innerHTML = '';
    return;
  }
  
  const statsHtml = patternStats.map(stat => `
    <div class="pattern-stat">
      <span>${escapeHtml(stat.pattern)}</span>
      <span class="pattern-stat-progress">${stat.solved}/${stat.total} solved</span>
    </div>
  `).join('');
  
  container.innerHTML = statsHtml;
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
    banner.textContent = 'Returned to live data.';
    banner.classList.remove('preview-on');
    exitButton.classList.add('hidden');
    
    // Announce the transition, then hide the banner after announcement
    setTimeout(() => {
      banner.textContent = '';
      banner.classList.add('hidden');
    }, 1500);
  }
}

// Message handling
window.addEventListener('message', event => {
  const message = event.data;
  
  switch (message.type) {
    case 'updateState':
      state = { ...state, ...message.data };
      updateUI();
      break;
    case 'commandResult':
      showMessage(message.message);
      break;
    case 'setPreviewMode':
      updatePreviewMode(message.data.enabled, message.data.label);
      break;
  }
});

// Command handlers
document.addEventListener('DOMContentLoaded', () => {
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
  document.getElementById('problemFilters').addEventListener('click', (e) => {
    if (e.target.classList.contains('filter-chip')) {
      const filter = e.target.dataset.filter;
      
      // Update local state immediately for responsive UI
      state.filter = filter;
      
      // Update active state
      document.querySelectorAll('.filter-chip').forEach(chip => {
        chip.classList.remove('active');
        chip.setAttribute('aria-selected', 'false');
      });
      e.target.classList.add('active');
      e.target.setAttribute('aria-selected', 'true');
      
      // Re-render problems list with new filter
      updateProblemsList();
      
      // Send filter change to extension
      vscode.postMessage({ command: 'codequest.setFilter', filter });
    }
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
