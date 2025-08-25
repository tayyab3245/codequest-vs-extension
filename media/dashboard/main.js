/**
 * Entry file: wires everything together (DOMContentLoaded)
 */

import { postMessage } from './core/vscode.js';
import { registerMessageHandlers } from './messages/handlers.js';
import { handleTimerAction } from './timers/timers.js';
import { renderPatterns } from './patterns/render.js';
import { renderCalendar } from './calendar/calendar.js';

document.addEventListener('DOMContentLoaded', () => {
  console.log('Dashboard main.js DOMContentLoaded fired');
  
  // Basic visibility check
  const spinner = document.getElementById('loadingSpinner');
  const patternsList = document.getElementById('patterns-list');
  
  console.log('Elements found:', {
    spinner: !!spinner,
    patternsList: !!patternsList
  });
  
  // Hide spinner and show some basic content
  if (spinner) {
    spinner.style.display = 'none';
    console.log('Loading spinner hidden');
  }
  
  // Add loading placeholder to patterns list
  if (patternsList) {
    patternsList.innerHTML = '<div style="color: white; padding: 20px; text-align: center;">Loading patterns...</div>';
    console.log('Basic content added to patterns list');
  }

  // request catalog from extension
  postMessage({ command: 'codequest.getCatalog' });

  // wire timer/solve clicks (delegated)
  if (patternsList) patternsList.addEventListener('click', handleTimerAction);

  // message handlers (state, session)
  registerMessageHandlers();

  // initial render; will update again when catalog arrives
  renderPatterns();
  renderCalendar();
  import('./calendar/calendar.js').then(m => m.enableCalendarAutoResize?.());
});
