/**
 * CodeQuest - VS Code messaging wrapper
 */

import { vscodeState } from './state.js';

export function postMessage(payload) {
  try {
    vscodeState.vscode.postMessage(payload);
  } catch (e) {
    console.warn('postMessage failed', e, payload);
  }
}
