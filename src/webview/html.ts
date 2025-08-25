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
  patternsCssUri: string;
  calendar3dCssUri: string;
  jsUri: string;
  calendar3dJsUri: string;
  cspSource: string;
  nonce: string;
  d3Uri: string;
}

export function buildDashboardHtml(options: DashboardHtmlOptions): string {
  const { patternsCssUri, calendar3dCssUri, jsUri, calendar3dJsUri, cspSource, nonce, d3Uri } = options;

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CodeQuest Coach</title>
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${cspSource} 'unsafe-inline' https://fonts.googleapis.com; script-src 'nonce-${nonce}' ${cspSource}; img-src ${cspSource} data: blob:; font-src ${cspSource} data: https://fonts.gstatic.com; connect-src ${cspSource} https: blob:; media-src ${cspSource} https: blob: data:;">
    <script nonce="${nonce}" src="${d3Uri}"></script>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');

        :root {
            --background: #2c3038;
            --light-shadow: #353a43;
            --dark-shadow: #23272d;
            --text-color: #bdc1c6;
            --accent-color-1: #6a5acd;
            --accent-color-2: #7b68ee;
            --status-unsolved: #e5a00d;
            --status-attempted: #5294e2;
            --status-solved: #16d374;
        }

        body {
            font-family: 'Inter', sans-serif;
            background-color: var(--background);
            color: var(--text-color);
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            margin: 0;
            padding: 2rem;
            box-sizing: border-box;
        }

        .dashboard-panel {
            background-color: var(--background);
            padding: 2.5rem;
            border-radius: 20px;
            width: 100%;
            max-width: 900px;
            box-shadow: 9px 9px 16px var(--dark-shadow), -9px -9px 16px var(--light-shadow);
        }

        .divider {
            height: 1px;
            width: 100%;
            background: linear-gradient(to right, var(--dark-shadow), var(--light-shadow), var(--dark-shadow));
            margin: 2.5rem 0;
            border: none;
        }

        .patterns-section .main-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 2rem;
            padding: 0 0.5rem;
        }

        .patterns-section .main-header h2 {
            margin: 0;
            font-weight: 600;
            font-size: 1.25rem;
        }

        .legend {
            display: flex;
            gap: 1.5rem;
        }

        .legend-item {
            display: flex;
            align-items: center;
            font-size: 0.8rem;
            font-weight: 600;
        }

        .legend-item .status-indicator {
            width: 12px;
            height: 12px;
            border-radius: 4px;
            margin-right: 0.5rem;
            box-shadow: 2px 2px 4px var(--dark-shadow), -2px -2px 4px var(--light-shadow);
        }
        
        .patterns-paginator {
            overflow: hidden;
        }

        .patterns-pages-container {
            display: flex;
            transition: transform 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        }

        .patterns-page {
            width: 100%;
            flex-shrink: 0;
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 2rem;
        }

        .pagination-controls {
            display: flex;
            justify-content: center;
            align-items: center;
            margin-top: 2rem;
            gap: 1rem;
        }

        .page-indicator-bar {
            display: flex;
            background-color: var(--background);
            box-shadow: inset 3px 3px 6px var(--dark-shadow), inset -3px -3px 6px var(--light-shadow);
            border-radius: 8px;
            padding: 4px;
        }

        .page-segment {
            width: 40px;
            height: 8px;
            border-radius: 6px;
            cursor: pointer;
            transition: all 0.3s ease;
        }
        
        .page-segment.active {
            background-color: #ffffff;
            box-shadow: 0 0 5px #ffffff, 0 0 10px #ffffff;
        }

        #page-indicator {
            font-weight: 600;
            font-size: 0.9rem;
            color: var(--text-color);
            min-width: 50px;
            text-align: center;
        }

        .pattern-header-clickable {
            cursor: pointer;
            padding: 0.5rem;
            border-radius: 8px;
            transition: background-color 0.2s ease;
        }
        
        .pattern-header-clickable:hover {
            background-color: var(--dark-shadow);
        }

        .pattern-title {
            font-size: 0.9rem;
            font-weight: 600;
            margin: 0 0 0.75rem 0;
            color: var(--text-color);
        }

        .segmented-bar {
            display: flex;
            gap: 4px;
            height: 8px;
            width: 100%;
        }

        .segment {
            flex-grow: 1;
            border-radius: 4px;
            background-color: var(--dark-shadow);
            box-shadow: inset 2px 2px 4px #23272d, inset -2px -2px 4px #353a43;
            cursor: pointer;
            transition: all 0.3s ease;
        }
        
        .segment:hover {
            background-color: var(--button-color);
            transform: scale(1.05);
        }
        
        .segment.active {
            background: linear-gradient(145deg, #3b82f6, #2563eb);
            box-shadow: 0 0 8px rgba(59, 130, 246, 0.5), inset 1px 1px 2px rgba(255,255,255,0.1);
            transform: scale(1.1);
        }
        
        .pattern[data-progress="1"] .segment:nth-child(-n+1),
        .pattern[data-progress="2"] .segment:nth-child(-n+2),
        .pattern[data-progress="3"] .segment:nth-child(-n+3),
        .pattern[data-progress="4"] .segment:nth-child(-n+4),
        .pattern[data-progress="5"] .segment:nth-child(-n+5) {
            background: linear-gradient(145deg, var(--accent-color-2), var(--accent-color-1));
            box-shadow: none;
        }

        .questions-container {
            max-height: 0;
            overflow: hidden;
            transition: max-height 0.4s ease-in-out;
            padding-left: 0.5rem;
            margin-top: 1rem;
        }

        .question-item {
            display: flex;
            align-items: center;
            padding: 0.75rem 0.5rem;
            border-bottom: 1px solid var(--dark-shadow);
        }
        .question-item:last-child {
            border-bottom: none;
        }

        .status-indicator {
            width: 10px;
            height: 10px;
            border-radius: 3px;
            margin-right: 1rem;
            flex-shrink: 0;
        }
        .status-indicator.unsolved { background-color: var(--status-unsolved); }
        .status-indicator.attempted { background-color: var(--status-attempted); }
        .status-indicator.solved { background-color: var(--status-solved); }

        .question-title {
            flex-grow: 1;
            font-size: 0.875rem;
        }
        
        .actions {
            display: flex;
            align-items: center;
            gap: 0.75rem;
        }

        .timer {
            font-family: 'Courier New', Courier, monospace;
            font-weight: 700;
            font-size: 0.9rem;
            width: 70px;
            text-align: right;
        }

        .action-btn {
            background: var(--background);
            color: var(--text-color);
            border: none;
            padding: 0.5rem 1rem;
            border-radius: 8px;
            cursor: pointer;
            font-size: 0.8rem;
            font-weight: 600;
            transition: all 0.2s ease-in-out;
            box-shadow: 3px 3px 6px var(--dark-shadow), -3px -3px 6px var(--light-shadow);
        }
        
        .solve-btn-icon {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 32px;
            height: 32px;
            padding: 0;
        }
        
        .solve-btn-icon svg {
            width: 16px;
            height: 16px;
            transition: color 0.2s ease;
        }
        
        .solve-btn-icon.is-solved svg {
            color: #e5484d;
        }
        
        .solve-btn-icon:not(.is-solved) svg {
             color: var(--status-solved);
        }

        .action-btn:active, .action-btn.running, .solve-btn-icon.is-solved {
            box-shadow: inset 3px 3px 6px var(--dark-shadow), inset -3px -3px 6px var(--light-shadow);
        }
        
        .action-btn.running {
            color: var(--accent-color-2);
        }

        .calendar-section .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 1.5rem;
        }

        .calendar-section h2 {
            margin: 0;
            font-weight: 600;
            font-size: 1.25rem;
        }

        .custom-dropdown {
            position: relative;
            width: 120px;
        }

        .dropdown-button {
            background: var(--background);
            color: var(--text-color);
            border: none;
            padding: 0.75rem 1rem;
            border-radius: 10px;
            cursor: pointer;
            font-size: 0.875rem;
            font-weight: 600;
            width: 100%;
            text-align: left;
            display: flex;
            justify-content: space-between;
            align-items: center;
            transition: all 0.2s ease-in-out;
            box-shadow: 5px 5px 10px var(--dark-shadow), -5px -5px 10px var(--light-shadow);
        }

        .dropdown-button:active, .dropdown-button.open {
            box-shadow: inset 5px 5px 10px var(--dark-shadow), inset -5px -5px 10px var(--light-shadow);
        }
        
        .dropdown-button .arrow {
            width: 1rem;
            height: 1rem;
            color: #9ca3af;
            transition: transform 0.2s ease;
        }

        .dropdown-button.open .arrow {
            transform: rotate(180deg);
        }

        .dropdown-menu {
            position: absolute;
            top: calc(100% + 8px);
            left: 0;
            width: 100%;
            background: var(--background);
            border-radius: 10px;
            box-shadow: 5px 5px 10px var(--dark-shadow), -5px -5px 10px var(--light-shadow);
            z-index: 10;
            overflow: hidden;
            opacity: 0;
            transform: translateY(-10px);
            visibility: hidden;
            transition: opacity 0.2s ease, transform 0.2s ease, visibility 0.2s;
        }

        .dropdown-menu.show {
            opacity: 1;
            transform: translateY(0);
            visibility: visible;
        }

        .dropdown-item {
            padding: 0.75rem 1rem;
            cursor: pointer;
            font-size: 0.875rem;
            color: var(--text-color);
            transition: all 0.2s ease;
        }

        .dropdown-item:hover {
            background-color: var(--accent-color-1);
            color: #fff;
        }

        .calendar-wrapper {
            overflow-x: auto;
            padding-bottom: 10px;
            margin-bottom: -10px;
            scrollbar-width: thin;
            scrollbar-color: var(--light-shadow) var(--dark-shadow);
        }
        .calendar-wrapper::-webkit-scrollbar { height: 8px; }
        .calendar-wrapper::-webkit-scrollbar-track { background: var(--dark-shadow); border-radius: 4px; }
        .calendar-wrapper::-webkit-scrollbar-thumb { background-color: var(--light-shadow); border-radius: 4px; border: 2px solid var(--dark-shadow); }

        #calendar-container { min-width: 855px; }
        .calendar-svg { width: 100%; height: auto; max-height: 160px; }
        .month-label, .weekday-label { fill: var(--text-color); font-size: 10px; font-family: 'Inter', sans-serif; }
        .calendar-day { transition: fill 0.3s ease; }
        .grid-background { fill: var(--background); stroke: var(--dark-shadow); stroke-width: 0.5; }
    </style>
</head>
<body>
    <div class="dashboard-panel">
        <div class="patterns-section">
            <div class="main-header">
                <h2>Algorithm Patterns</h2>
                <div class="legend">
                    <div class="legend-item"><span class="status-indicator unsolved"></span> Unsolved</div>
                    <div class="legend-item"><span class="status-indicator attempted"></span> Attempted</div>
                    <div class="legend-item"><span class="status-indicator solved"></span> Solved</div>
                </div>
            </div>
            <div class="patterns-paginator">
                <div class="patterns-pages-container" id="patterns-pages-container">
                </div>
            </div>
            <div class="pagination-controls">
                <div class="page-indicator-bar" id="page-indicator-bar">
                </div>
                <span id="page-indicator"></span>
            </div>
        </div>

        <hr class="divider" />

        <div class="calendar-section">
            <div class="header">
                <h2>Activity Heatmap</h2>
                <div class="custom-dropdown">
                    <button class="dropdown-button" id="dropdownButton">
                        <span id="selectedValue">Time</span>
                        <svg class="arrow" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                        </svg>
                    </button>
                    <div class="dropdown-menu" id="dropdownMenu">
                        <div class="dropdown-item" data-value="time">Time</div>
                        <div class="dropdown-item" data-value="solved">Solved</div>
                    </div>
                </div>
            </div>
            <div class="calendar-wrapper">
                <div id="calendar-container"></div>
            </div>
        </div>
    </div>

    <script type="module" nonce="${nonce}" src="${jsUri}"></script>
</body>
</html>`;
}
