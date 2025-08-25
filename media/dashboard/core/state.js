/**
 * CodeQuest - State & shared data
 * (c) 2025 tayyab3245
 */

export const vscodeState = {
  vscode: typeof acquireVsCodeApi === 'function' ? acquireVsCodeApi() : { postMessage() {} }
};

// Global app state (unchanged structure)
export const state = {
  currentProblem: null,
  problems: [],
  installedAt: null,
  solvedKeys: [],
  filter: 'all',
  patternStats: [],
  session: { running: false, todayMinutes: 0 },
  calendar: { dailyMinutes: {} }
};

// Real catalog data
export let catalogData = {};

// Preview mode
export let previewMode = { enabled: false, label: '' };

// Persisted UI selections
export let openPanel = { pattern: null, segIndex: null };
export let selectedKey = null;

// Simple event bus for state updates
const bus = new EventTarget();
export const on = (type, cb) => bus.addEventListener(type, cb);
export const off = (type, cb) => bus.removeEventListener(type, cb);
const emit = (type, detail) => bus.dispatchEvent(new CustomEvent(type, { detail }));

export function mergeState(partial) {
  Object.assign(state, partial);
  emit('statechange', { state });
}

export function setCatalogData(data) {
  catalogData = data || {};
  emit('catalogchange', { catalogData });
}

export function setPreviewMode(data) {
  previewMode = data || { enabled: false, label: '' };
  emit('previewchange', { previewMode });
}

export function setOpenPanel(obj) {
  openPanel = obj || { pattern: null, segIndex: null };
}

export function setSelectedKey(k) {
  selectedKey = k ?? null;
}

export function addSolvedKey(key) {
  if (!state.solvedKeys.includes(key)) {
    state.solvedKeys.push(key);
  }
}

export function isSolvedKey(key) {
  return state.solvedKeys.includes(key);
}

// Pattern display names mapping (unchanged)
export const patternDisplayNames = {
  'arrays-and-hashing': 'Arrays & Hashing',
  'two-pointers': 'Two Pointers',
  'sliding-window': 'Sliding Window',
  'stack': 'Stack',
  'binary-search': 'Binary Search',
  'linked-list': 'Linked List',
  'trees': 'Trees',
  'tries': 'Tries',
  'trie': 'Trie',
  'prefix-sum': 'Prefix Sum',
  'intervals': 'Intervals',
  'greedy': 'Greedy',
  'dynamic-programming': 'Dynamic Programming',
  'heap-priority-queue': 'Heap / Priority Queue',
  'backtracking': 'Backtracking',
  'graphs': 'Graphs',
  'graph': 'Graphs',
  'advanced-graphs': 'Advanced Graphs',
  '1-d-dynamic-programming': '1-D Dynamic Programming',
  '2-d-dynamic-programming': '2-D Dynamic Programming',
  'greedy': 'Greedy',
  'intervals': 'Intervals',
  'math-and-geometry': 'Math & Geometry',
  'bit-manipulation': 'Bit Manipulation'
};
