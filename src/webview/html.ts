/**
 * CodeQuest Coach - LeetCode Progress Tracker
 * 
 * Copyright (c) 2025 tayyab3245. All rights reserved.
 * 
 * This software is proprietary and confidential. Unauthorized reproduction,
 * distribution, or modification is strictly prohibited. See LICENSE file
 * for full terms and conditions.
 * 
 * @author tayyab3245
 * @license Proprietary
 */
export interface DashboardHtmlOptions {
  cssUri: string;
  jsUri: string;
  cspSource: string;
  nonce: string;
  d3Uri: string;
}

export function buildDashboardHtml(options: DashboardHtmlOptions): string {
  const { cssUri, jsUri, cspSource, nonce, d3Uri } = options;

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}' ${cspSource}; img-src ${cspSource} data: blob:; font-src ${cspSource} data:; connect-src ${cspSource} https: blob:; media-src ${cspSource} https: blob: data:;">
    <link href="${cssUri}" rel="stylesheet">
    <script nonce="${nonce}" src="${d3Uri}"></script>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    <title>CodeQuest Coach</title>
</head>
<body class="p-4 sm:p-8">
    <div id="app-container" class="max-w-7xl mx-auto bg-[#1c1c1c] p-6 sm:p-8 rounded-2xl shadow-2xl border border-gray-800">
        
        <header class="mb-12 text-center">
            <h1 class="text-3xl sm:text-4xl font-bold text-white mb-2 tracking-tight">LeetCode Pattern Mastery</h1>
            <div id="installedBadge" class="text-sm text-gray-400"></div>
        </header>
        
        <div id="patterns-list" class="divide-y divide-gray-800">
            <!-- Patterns will be inserted here -->
        </div>

        <!-- Activity & Analysis Section -->
        <div id="analysis-section" class="mt-12 pt-8 border-t border-gray-800">
            <h2 class="text-2xl font-bold text-white mb-6">Activity & Analysis</h2>
            <div class="panel">
                <div>
                    <h3 class="font-semibold text-white mb-4">Daily Activity</h3>
                    <div id="calendar-view-content">
                        <!-- Calendar will be generated here -->
                    </div>
                </div>
            </div>
        </div>

        <div id="previewMode" class="preview-mode" style="display: none;">
            <div class="preview-banner">
                <span id="previewLabel">Preview Mode</span>
                <button id="exitPreview">Exit Preview</button>
            </div>
        </div>
    </div>

    <div id="tooltip"></div>
    <div id="messageContainer"></div>
    <div id="loadingSpinner" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div class="text-white text-xl">Loading CodeQuest Coach...</div>
    </div>

    <!-- Load modular dashboard -->
    <script type="module" nonce="${nonce}" src="${jsUri}"></script>
</body>
</html>`;
}
