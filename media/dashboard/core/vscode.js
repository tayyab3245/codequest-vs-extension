/**
 * CodeQuest - VS Code messaging wrapper
 */

import { vscodeState } from './state.js';

export function postMessage(payload) {
  console.log('📤 Sending message to extension:', payload);
  try {
    vscodeState.vscode.postMessage(payload);
    console.log('✅ Message sent successfully');
  } catch (e) {
    console.error('❌ postMessage failed:', e, payload);
  }
}
