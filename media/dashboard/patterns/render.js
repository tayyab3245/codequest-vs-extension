/**
 * Pattern list + question panel rendering
 */

import { state, openPanel, setOpenPanel, selectedKey, setSelectedKey } from '../core/state.js';
import { buildSegments } from './data.js';
import { segDifficultyClass } from '../utils/colors.js';
import { formatTime } from '../utils/time.js';
import { postMessage } from '../core/vscode.js';

// stable ref to active question container
let activeQuestionList = null;

// Timer store (per-problem)
export const timerStates = {}; // { [problemId]: { elapsedTime, isRunning, intervalId, startTime } }

export function renderPatterns() {
  const patternsList = document.getElementById('patterns-list');
  patternsList.innerHTML = '';

  for (const patternKey in (state?.catalogData || {})) {
    // NOTE: we render based on global catalogData too; but we also rebuild via event
  }

  // Iterate through catalogData keys actually present on window state (we track via message)
  const cd = window.__catalogData__ || {};
  const patternKeys = Object.keys(cd).filter(k => !k.startsWith('__'));
  for (const patternKey of patternKeys) {
    const displayName = window.__catalogNames__?.[patternKey] || patternKey;
    const segments = buildSegments(patternKey);
    const totalProblems = segments.length; // always 20
    const totalSolved = segments.filter(s => s.solved).length;

    // container
    const patternContainer = document.createElement('div');
    patternContainer.className = 'pattern-row py-6 first:pt-0 last:pb-0';

    const mainRow = document.createElement('div');
    mainRow.className = 'flex items-center justify-between';

    const left = document.createElement('div');
    left.className = 'flex items-center';

    const initial = document.createElement('div');
    initial.className = 'text-2xl font-bold text-gray-600 mr-4 w-8 text-center';
    initial.textContent = (displayName || patternKey).charAt(0);
    left.appendChild(initial);

    const nameAndBar = document.createElement('div');
    const title = document.createElement('h3');
    title.className = 'text-lg font-semibold text-white mb-2';
    title.textContent = displayName || patternKey;
    nameAndBar.appendChild(title);

    const bar = document.createElement('div');
    bar.className = 'pattern-bar';

    segments.forEach((seg, index) => {
      const segment = document.createElement('div');
      segment.className = 'pattern-bar-segment cursor-pointer';
      segment.dataset.pattern = patternKey;
      segment.dataset.segIndex = String(seg.index);
      segment.dataset.problemId = seg.slug;
      segment.title = `${seg.title} • ${seg.difficulty}${seg.solved ? ' • Solved' : ''}${seg.isVariant ? ' (Variant)' : ''}${seg.isGenerated ? ' (Generated)' : ''}`;

      if (seg.solved) {
        segment.classList.add('solved', segDifficultyClass(seg.difficulty));
      }

      segment.addEventListener('click', handleSegmentClick);
      bar.appendChild(segment);
    });

    nameAndBar.appendChild(bar);
    left.appendChild(nameAndBar);
    mainRow.appendChild(left);

    const stats = document.createElement('div');
    stats.className = 'text-md font-medium text-gray-400';
    stats.textContent = `${totalSolved}/${totalProblems}`;
    mainRow.appendChild(stats);

    patternContainer.appendChild(mainRow);

    const questionsContainer = document.createElement('div');
    questionsContainer.className = 'questions-container pl-12';
    patternContainer.appendChild(questionsContainer);

    patternsList.appendChild(patternContainer);

    // re-open previously open panel
    if (openPanel.pattern === patternKey && openPanel.segIndex != null) {
      const targetBtn = bar.querySelector(`[data-seg-index="${openPanel.segIndex}"]`);
      if (targetBtn) {
        targetBtn.classList.add('expanded');
        renderQuestions(patternKey, Number(openPanel.segIndex), questionsContainer);
        questionsContainer.classList.add('open');
        activeQuestionList = questionsContainer;
      }
    }
  }
}

export function renderQuestions(patternKey, segIndex, container) {
  container.innerHTML = '';
  const segments = buildSegments(patternKey);
  const seg = segments[segIndex];
  if (!seg) {
    container.innerHTML = `<div class="text-gray-500 italic py-4">Invalid segment index.</div>`;
    return;
  }

  const questionList = document.createElement('div');
  questionList.className = 'space-y-3 pt-4';

  const key = `${patternKey}/${seg.slug}`;
  const isSolved = seg.solved;
  const isSelected = selectedKey === key;

  const problemId = `${patternKey}-${seg.slug}`;
  if (!timerStates[problemId]) {
    timerStates[problemId] = { elapsedTime: 0, isRunning: false, intervalId: null, startTime: 0 };
  }
  const timerState = timerStates[problemId];

  const item = document.createElement('div');
  item.className = `problem-item flex justify-between items-center bg-[#2d2d2d] p-3 rounded-lg${isSelected ? ' is-selected' : ''}`;
  item.tabIndex = 0;

  const questionInfo = document.createElement('div');

  // ID label with B1-B5 difficulty buckets
  const questionId = document.createElement('span');
  questionId.className = 'text-gray-500 mr-3 font-mono text-sm';
  
  // B1-B5 difficulty bucket system based on position in sorted 20-segment progression
  // Problems are sorted: Easy → Medium → Hard, so position indicates difficulty progression
  let bucket = 'B1'; // Default
  if (segIndex >= 0 && segIndex <= 3) {
    bucket = 'B1';      // 20% - Easiest (segments 0-3)
  } else if (segIndex >= 4 && segIndex <= 7) {
    bucket = 'B2';      // 20% - Easy-Medium (segments 4-7)
  } else if (segIndex >= 8 && segIndex <= 11) {
    bucket = 'B3';      // 20% - Medium (segments 8-11)
  } else if (segIndex >= 12 && segIndex <= 15) {
    bucket = 'B4';      // 20% - Medium-Hard (segments 12-15)
  } else if (segIndex >= 16 && segIndex <= 19) {
    bucket = 'B5';      // 20% - Hardest (segments 16-19)
  }
  
  questionId.textContent = bucket;

  const questionName = document.createElement('span');
  questionName.className = 'text-white';
  questionName.textContent = seg.title;

  questionInfo.appendChild(questionId);
  questionInfo.appendChild(questionName);

  const controls = document.createElement('div');
  controls.className = 'flex items-center gap-3';

  const solveButtonHTML = !isSolved
    ? `<button class="btn-solve" data-action="solve" data-pattern="${patternKey}" data-slug="${seg.slug}" data-index="${segIndex}">Mark Solved</button>`
    : '';

  controls.innerHTML = `
    ${solveButtonHTML}
    <span class="timer-display font-mono text-sm text-gray-400" data-timer-id="${problemId}">${formatTime(timerState.elapsedTime)}</span>
    <div class="flex items-center gap-2">
      <button class="timer-btn timer-btn-start" data-action="start" data-id="${problemId}" ${timerState.isRunning ? 'style="display:none;"' : ''}>Start</button>
      <button class="timer-btn timer-btn-stop" data-action="stop" data-id="${problemId}" ${!timerState.isRunning ? 'style="display:none;"' : ''}>Stop</button>
      <button class="timer-btn timer-btn-end" data-action="end" data-id="${problemId}" ${timerState.elapsedTime === 0 && !timerState.isRunning ? 'style="display:none;"' : ''}>End Session</button>
    </div>
    <div class="status-tag ${isSolved ? 'tag-solved' : 'tag-unsolved'}">${isSolved ? 'Solved' : 'Unsolved'}</div>
  `;

  questionInfo.addEventListener('click', () => {
    setSelectedKey(key);
    renderQuestions(patternKey, segIndex, container);
    postMessage({ command: 'codequest.openOrCreateProblem', pattern: patternKey, slug: seg.slug });
  });

  item.appendChild(questionInfo);
  item.appendChild(controls);
  questionList.appendChild(item);

  container.appendChild(questionList);
}

export function handleSegmentClick(event) {
  if (event.target.dataset.action) return; // ignore timer btns
  
  const clicked = event.target;
  const { pattern, segIndex } = clicked.dataset;
  
  const patternContainer = clicked.closest('.pattern-row');
  const questionsContainer = patternContainer?.querySelector('.questions-container');
  const barContainer = clicked.parentElement;
  const isOpen = clicked.classList.contains('expanded');

  if (!patternContainer || !questionsContainer) {
    console.error('Missing required elements for segment click');
    return;
  }

  barContainer.querySelectorAll('.pattern-bar-segment').forEach(seg => seg.classList.remove('expanded'));

  if (activeQuestionList && activeQuestionList !== questionsContainer) {
    activeQuestionList.classList.remove('open');
  }

  if (isOpen) {
    questionsContainer.classList.remove('open');
    activeQuestionList = null;
    setOpenPanel({ pattern: null, segIndex: null });
  } else {
    clicked.classList.add('expanded');
    renderQuestions(pattern, Number(segIndex), questionsContainer);
    questionsContainer.classList.add('open');
    activeQuestionList = questionsContainer;
    setOpenPanel({ pattern, segIndex: Number(segIndex) });
  }
}
