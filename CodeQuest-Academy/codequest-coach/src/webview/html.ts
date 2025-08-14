export interface DashboardHtmlOptions {
  cssUri: string;
  jsUri: string;
  cspSource: string;
  nonce: string;
}

export function buildDashboardHtml(options: DashboardHtmlOptions): string {
  const { cssUri, jsUri, cspSource, nonce } = options;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Security-Policy"
    content="default-src 'none'; img-src ${cspSource} https: data:; style-src ${cspSource}; script-src 'nonce-${nonce}';">
  <title>CodeQuest Dashboard</title>
  <link rel="stylesheet" href="${cssUri}">
</head>
<body>
  <div class="header">
    <h1>CodeQuest Coach</h1>
    <span id="installedBadge" class="badge">Loading...</span>
  </div>

  <div class="grid">
    <div class="card">
      <h2>Workspace</h2>
      <div class="workspace-info">
        <div>Root folder:</div>
        <div id="workspacePath" class="workspace-path">No folder open</div>
      </div>
      <div class="stats-grid">
        <div class="stat-item">
          <div id="problemCount" class="stat-value">0</div>
          <div class="stat-label">Problems found</div>
        </div>
      </div>
    </div>

    <div class="card">
      <h2>Current Problem</h2>
      <div id="currentProblem">
        <div class="no-problem">No homework.js file open</div>
      </div>
    </div>

    <div class="card">
      <h2>Commands</h2>
      <div id="previewBanner" class="status-message hidden" role="status" aria-live="polite" aria-atomic="true"></div>
      <div class="command-grid">
        <button id="startSession" class="command-btn">Start Session</button>
        <button id="endSession" class="command-btn">End Session</button>
        <button id="markSolved" class="command-btn">Mark Solved</button>
        <button id="importLegacy" class="command-btn">Import Legacy</button>
        <button id="exitPreview" class="command-btn hidden">Exit Preview</button>
      </div>
      <div id="statusMessage" class="status-message hidden"></div>
    </div>
  </div>

  <script nonce="${nonce}" src="${jsUri}"></script>
</body>
</html>`;
}
