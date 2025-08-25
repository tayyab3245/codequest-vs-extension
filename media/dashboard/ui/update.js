/**
 * Small UI glue used by message handler
 */

import { state } from '../core/state.js';
import { updateCalendarHeatmap } from '../calendar/calendar.js';
import { renderPatterns } from '../patterns/render.js';

export function updateUI() {
  if (state.installedAt) {
    const date = new Date(state.installedAt).toLocaleDateString();
    const badge = document.getElementById('installedBadge');
    if (badge) badge.textContent = `Installed: ${date}`;
  }
  renderPatterns();
  updateCalendarHeatmap();
}
