/**
 * Solve & timer actions
 */

import { state, addSolvedKey } from '../core/state.js';
import { renderCalendar } from '../calendar/calendar.js';
import { postMessage } from '../core/vscode.js';
import { timerStates, renderQuestions, renderPatterns } from '../patterns/render.js';
import { formatTime } from '../utils/time.js';

export function handleTimerAction(e) {
  if (!e.target.dataset.action) return;

  const { action, id, pattern, slug, index } = e.target.dataset;

  // Solve action
  if (action === 'solve') {
    const key = `${pattern}/${slug}`;
    addSolvedKey(key);

    postMessage({ command: 'markSolved', pattern, slug });

    renderPatterns();

    // If the same panel is open, refresh its questions
    try {
      const patternContainer = document.querySelector(`[data-pattern="${pattern}"]`)?.closest('.py-6');
      const questionsContainer = patternContainer?.querySelector('.questions-container');
      if (questionsContainer) renderQuestions(pattern, Number(index), questionsContainer);
    } catch {}

    // Calendar: add 15 min credit
    const today = new Date().toISOString().split('T')[0];
    state.calendar.dailyMinutes[today] = (state.calendar.dailyMinutes[today] || 0) + 15;
    renderCalendar();
    return;
  }

  // Timer actions
  const s = timerStates[id];
  if (!s) return;
  const container = e.target.closest('.flex.items-center.gap-2');
  const startBtn = container.querySelector('[data-action="start"]');
  const stopBtn = container.querySelector('[data-action="stop"]');
  const endBtn = container.querySelector('[data-action="end"]');
  const timerDisplay = document.querySelector(`[data-timer-id="${id}"]`);

  if (action === 'start') {
    s.isRunning = true;
    s.startTime = Date.now();
    startBtn.style.display = 'none';
    stopBtn.style.display = 'block';
    endBtn.style.display = 'block';
    s.intervalId = setInterval(() => {
      const current = Date.now();
      const session = current - s.startTime;
      timerDisplay.textContent = formatTime(s.elapsedTime + session);
    }, 1000);
  } else if (action === 'stop') {
    s.isRunning = false;
    clearInterval(s.intervalId);
    s.elapsedTime += Date.now() - s.startTime;
    stopBtn.style.display = 'none';
    startBtn.style.display = 'block';
    startBtn.textContent = 'Resume';
  } else if (action === 'end') {
    s.isRunning = false;
    clearInterval(s.intervalId);
    if (s.startTime > 0) s.elapsedTime += Date.now() - s.startTime;

    const sessionMinutes = Math.ceil(s.elapsedTime / (1000 * 60));
    const today = new Date().toISOString().split('T')[0];
    state.calendar.dailyMinutes[today] = (state.calendar.dailyMinutes[today] || 0) + sessionMinutes;
    renderCalendar();

    s.elapsedTime = 0;
    s.startTime = 0;
    timerDisplay.textContent = formatTime(0);
    startBtn.textContent = 'Start';
    startBtn.style.display = 'block';
    stopBtn.style.display = 'none';
    endBtn.style.display = 'none';
  }
}
