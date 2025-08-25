/**
 * All window.postMessage handlers consolidated
 */

import { mergeState, setPreviewMode, setCatalogData } from '../core/state.js';
import { updateUI } from '../ui/update.js';
import { updateSessionButtons, bindSessionToggle } from '../session/session.js';
import { renderPatterns } from '../patterns/render.js';
import { renderCalendar } from '../calendar/calendar.js';

export function registerMessageHandlers() {
  window.addEventListener('message', (event) => {
    const message = event.data;

    // Special catalog pipeline (original used command === 'catalogData')
    if (message?.command === 'catalogData') {
      // also expose to patterns renderer for title initials (unchanged behavior)
      window.__catalogData__ = message.data;
      window.__catalogNames__ = {}; // optional mapping if you need it later
      // Try to map display names if available in your HTML constants
      setCatalogData(message.data);
      renderPatterns();
      return;
    }

    // Diagnostics logging
    if (message?.type === 'diagnosticsLogged') {
      console.log('[Diagnostics]', message.data);
      return;
    }

    // Core state & preview
    switch (message?.type) {
      case 'updateState':
        mergeState(message.data || {});
        if (message?.data?.session) updateSessionButtons();
        updateUI();
        break;
      case 'setPreviewMode':
        setPreviewMode(message.data);
        const previewElement = document.getElementById('previewMode');
        const previewLabel = document.getElementById('previewLabel');
        if (previewElement && previewLabel) {
          if (message.data?.enabled) {
            previewElement.style.display = 'block';
            previewLabel.textContent = message.data?.label || '';
          } else {
            previewElement.style.display = 'none';
          }
        }
        break;
      case 'sessionStarted':
        mergeState({ session: { ...((message.data && message.data.session) || {}), running: true } });
        updateSessionButtons();
        break;
      case 'sessionEnded':
        mergeState({ session: { ...((message.data && message.data.session) || {}), running: false } });
        updateSessionButtons();
        break;
    }
  });

  // Once at startup
  bindSessionToggle();
  // AI and calendar are already initialized in main.js; no duplicate init here.
}
