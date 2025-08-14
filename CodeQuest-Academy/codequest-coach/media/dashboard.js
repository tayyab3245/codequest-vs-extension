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
  installedAt: null
};

// UI update functions
function updateUI() {
  document.getElementById('workspacePath').textContent = state.workspacePath;
  document.getElementById('problemCount').textContent = state.problemCount.toString();
  
  if (state.installedAt) {
    const date = new Date(state.installedAt).toLocaleDateString();
    document.getElementById('installedBadge').textContent = `Installed: ${date}`;
  }

  updateCurrentProblem();
}

function updateCurrentProblem() {
  const container = document.getElementById('currentProblem');
  container.innerHTML = renderProblemDetails(state.currentProblem);
}

function showMessage(text, duration = 3000) {
  const el = document.getElementById('statusMessage');
  el.textContent = text;
  el.classList.remove('hidden');
  setTimeout(() => {
    el.classList.add('hidden');
  }, duration);
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

  // Request initial state
  vscode.postMessage({ command: 'getInitialState' });
});
