/**
 * Session toggle buttons (safe against missing elements)
 */

import { state } from '../core/state.js';
import { postMessage } from '../core/vscode.js';

function el(id) { return document.getElementById(id); }

export function updateSessionButtons() {
  const playBtn = el('startSession');
  const pauseBtn = el('pauseSession');
  const stopBtn = el('endSession');

  if (!playBtn || !pauseBtn || !stopBtn) return;

  if (state.session.running) {
    playBtn.classList.add('hidden');
    pauseBtn.classList.remove('hidden');
    stopBtn.classList.remove('hidden');
  } else {
    playBtn.classList.remove('hidden');
    pauseBtn.classList.add('hidden');
    stopBtn.classList.add('hidden');
  }
}

export function bindSessionToggle() {
  const sessionToggleBtn = el('sessionToggleBtn');
  const sessionBtnText = el('sessionBtnText');

  if (!sessionToggleBtn || !sessionBtnText) return;

  sessionToggleBtn.addEventListener('click', () => {
    if (state.session.running) {
      postMessage({ command: 'codequest.endSession' });
      sessionBtnText.textContent = 'Start Study Session';
      sessionToggleBtn.className = sessionToggleBtn.className.replace('bg-red-600 hover:bg-red-700 border-red-500', 'bg-green-600 hover:bg-green-700 border-green-500');
      console.log('Study session ended. Good work!');
    } else {
      postMessage({ command: 'codequest.startSession' });
      sessionBtnText.textContent = 'End Study Session';
      sessionToggleBtn.className = sessionToggleBtn.className.replace('bg-green-600 hover:bg-green-700 border-green-500', 'bg-red-600 hover:bg-red-700 border-red-500');
      console.log('Study session started! Happy coding!');
    }
  });
}
