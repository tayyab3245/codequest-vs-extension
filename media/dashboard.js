// LeetCode Pattern Mastery Dashboard

// VS Code API
const vscode = acquireVsCodeApi();

// State management
let state = {
  currentProblem: null,
  problems: [],
  installedAt: null,
  solvedKeys: [],
  filter: 'all',
  patternStats: [],
  session: {
    running: false,
    todayMinutes: 0
  },
  calendar: {
    dailyMinutes: {}
  }
};

// Real catalog data from extension
let catalogData = {};

// Pattern display names mapping  
const patternDisplayNames = {
  'arrays-and-hashing': 'Arrays & Hashing',
  'two-pointers': 'Two Pointers', 
  'sliding-window': 'Sliding Window',
  'stack': 'Stack',
  'binary-search': 'Binary Search',
  'linked-list': 'Linked List',
  'trees': 'Trees',
  'tries': 'Tries',
  'heap-priority-queue': 'Heap / Priority Queue',
  'backtracking': 'Backtracking',
  'graphs': 'Graphs',
  'advanced-graphs': 'Advanced Graphs',
  '1-d-dynamic-programming': '1-D Dynamic Programming',
  '2-d-dynamic-programming': '2-D Dynamic Programming',
  'greedy': 'Greedy',
  'intervals': 'Intervals',
  'math-and-geometry': 'Math & Geometry',
  'bit-manipulation': 'Bit Manipulation'
};

// Preview mode state
let previewMode = { enabled: false, label: '' };
let activeQuestionList = null;

// Color coding system - Green (left) to Red (right) gradient from EXAMPLE.html
function getColorForPercentage(pct) {
  const colorStops = [
    { pct: 0.0, r: 0x4a, g: 0xcf, b: 0x4a }, // Green
    { pct: 0.5, r: 0xff, g: 0xbf, b: 0x00 }, // Yellow
    { pct: 1.0, r: 0xf9, g: 0x4d, b: 0x4d }  // Red
  ];

  for (let i = 0; i < colorStops.length - 1; i++) {
    if (pct >= colorStops[i].pct && pct <= colorStops[i + 1].pct) {
      const lower = colorStops[i];
      const upper = colorStops[i + 1];
      const range = upper.pct - lower.pct;
      const rangePct = (pct - lower.pct) / range;
      
      const r = Math.round(lower.r + rangePct * (upper.r - lower.r));
      const g = Math.round(lower.g + rangePct * (upper.g - lower.g));
      const b = Math.round(lower.b + rangePct * (upper.b - lower.b));
      
      return `rgb(${r}, ${g}, ${b})`;
    }
  }
  return 'rgb(73, 207, 74)'; // Default green
}

// Track open panel and selection persistently
let openPanel = { pattern: null, segIndex: null };
let selectedKey = null;

// Timer states for each problem
const timerStates = {};

// Utility functions
function escapeHtml(unsafe) {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatTime(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600).toString().padStart(2, '0');
  const minutes = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, '0');
  const seconds = (totalSeconds % 60).toString().padStart(2, '0');
  return `${hours}:${minutes}:${seconds}`;
}

// UI update functions
function updateUI() {
  if (state.installedAt) {
    const date = new Date(state.installedAt).toLocaleDateString();
    document.getElementById('installedBadge').textContent = `Installed: ${date}`;
  }

  updatePatternSegments();
  updateCalendarHeatmap();
}

// Configurable max segments (one per problem)
const maxSegmentsPerPattern = 20; // exactly 20 segments per pattern

// Normalize difficulty to three buckets
function normDifficulty(d) {
  if (!d) return 'Medium';
  const s = String(d).toLowerCase();
  if (s.startsWith('e')) return 'Easy';
  if (s.startsWith('h')) return 'Hard';
  return 'Medium';
}

// Get flat problem list for a pattern from various possible shapes
function getPatternProblems(patternKey) {
  const entry = catalogData?.[patternKey];
  if (!entry) return [];
  if (Array.isArray(entry)) return entry;
  if (Array.isArray(entry.problems)) return entry.problems;
  const e = entry[1] || entry.easy || entry.Easy || [];
  const m = entry[2] || entry.medium || entry.Medium || [];
  const h = entry[3] || entry.hard || entry.Hard || [];
  return [
    ...e.map(p => ({ ...p, difficulty: 'Easy' })),
    ...m.map(p => ({ ...p, difficulty: 'Medium' })),
    ...h.map(p => ({ ...p, difficulty: 'Hard' })),
  ];
}

// Sort Easy -> Medium -> Hard, then by title/slug
function sortProblemsForSegments(arr) {
  const order = { Easy: 0, Medium: 1, Hard: 2 };
  return [...arr].sort((a, b) => {
    const da = order[normDifficulty(a.difficulty)], db = order[normDifficulty(b.difficulty)];
    if (da !== db) return da - db;
    const ta = (a.title || '').localeCompare(b.title || '');
    if (ta) return ta;
    return (a.slug || '').localeCompare(b.slug || '');
  });
}

// Build segments: exactly 20 per pattern, generate additional questions if needed
function buildSegments(patternKey) {
  const problems = sortProblemsForSegments(getPatternProblems(patternKey));
  const segments = [];
  
  // If we have fewer than 20 problems, we need to generate more
  const baseProblems = [...problems];
  const allProblems = [...problems];
  
  // Fill up to 20 by cycling through existing problems with variations
  while (allProblems.length < maxSegmentsPerPattern && baseProblems.length > 0) {
    const baseProblem = baseProblems[allProblems.length % baseProblems.length];
    const variant = {
      ...baseProblem,
      slug: `${baseProblem.slug}-variant-${Math.floor(allProblems.length / baseProblems.length) + 1}`,
      title: `${baseProblem.title} (Variant ${Math.floor(allProblems.length / baseProblems.length) + 1})`,
      isVariant: true
    };
    allProblems.push(variant);
  }
  
  // If still no problems, generate generic ones
  if (allProblems.length === 0) {
    for (let i = 0; i < maxSegmentsPerPattern; i++) {
      const difficulties = ['Easy', 'Medium', 'Hard'];
      const difficulty = difficulties[i % 3];
      allProblems.push({
        slug: `${patternKey}-problem-${i + 1}`,
        title: `${patternDisplayNames[patternKey] || patternKey} Problem ${i + 1}`,
        difficulty: difficulty,
        isGenerated: true
      });
    }
  }
  
  // Take exactly 20 problems
  const finalProblems = allProblems.slice(0, maxSegmentsPerPattern);
  
  for (let i = 0; i < maxSegmentsPerPattern; i++) {
    const problem = finalProblems[i];
    segments.push({
      index: i,
      slug: problem.slug,
      title: problem.title,
      difficulty: normDifficulty(problem.difficulty),
      solved: state.solvedKeys.includes(`${patternKey}/${problem.slug}`),
      empty: false,
      isVariant: problem.isVariant || false,
      isGenerated: problem.isGenerated || false
    });
  }
  
  return segments;
}

function segDifficultyClass(diff) {
  switch (normDifficulty(diff)) {
    case 'Easy': return 'seg-easy';
    case 'Medium': return 'seg-medium';
    case 'Hard': return 'seg-hard';
    default: return '';
  }
}

// Pattern rendering - exactly 20 segments per pattern
function renderPatterns() {
  const patternsList = document.getElementById('patterns-list');
  patternsList.innerHTML = '';
  
  // Iterate through catalog data patterns
  for (const patternKey in catalogData) {
    const displayName = patternDisplayNames[patternKey] || patternKey;
    
    // Get exactly 20 segments (all filled with questions)
    const segments = buildSegments(patternKey);
    const totalProblems = segments.length; // Always 20
    const totalSolved = segments.filter(s => s.solved).length;

    const patternContainer = document.createElement('div');
    patternContainer.className = 'py-6 first:pt-0 last:pb-0';
    
    const mainRow = document.createElement('div');
    mainRow.className = 'flex items-center justify-between';
    
    const leftSection = document.createElement('div');
    leftSection.className = 'flex items-center';
    
    const initial = document.createElement('div');
    initial.className = 'text-2xl font-bold text-gray-600 mr-4 w-8 text-center';
    initial.textContent = displayName.charAt(0);
    leftSection.appendChild(initial);
    
    const nameAndBar = document.createElement('div');
    const title = document.createElement('h3');
    title.className = 'text-lg font-semibold text-white mb-2';
    title.textContent = displayName;
    nameAndBar.appendChild(title);

    const bar = document.createElement('div');
    // Use dedicated CSS class for consistent 400px width across all patterns
    bar.className = 'pattern-bar';
    
    // Create exactly 20 segments per pattern (all with questions)
    segments.forEach((seg, index) => {
      const segment = document.createElement('div');
      segment.className = 'pattern-bar-segment cursor-pointer';
      segment.dataset.pattern = patternKey;
      segment.dataset.segIndex = String(seg.index);
      segment.dataset.problemId = seg.slug;
      segment.title = `${seg.title} • ${seg.difficulty}${seg.solved ? ' • Solved' : ''}${seg.isVariant ? ' (Variant)' : ''}${seg.isGenerated ? ' (Generated)' : ''}`;
      
      // Apply position-based color coding: Green (left) to Red (right)
      if (seg.solved) {
        segment.classList.add('solved');
        // Color based on position (index), not difficulty - from EXAMPLE.html
        segment.style.backgroundColor = getColorForPercentage(index / 19);
      } else {
        // Gray for unsolved
        segment.style.backgroundColor = '#2d2d2d';
      }
      
      segment.addEventListener('click', handleSegmentClick);
      bar.appendChild(segment);
    });
    
    nameAndBar.appendChild(bar);
    leftSection.appendChild(nameAndBar);
    mainRow.appendChild(leftSection);
    
    const stats = document.createElement('div');
    stats.className = 'text-md font-medium text-gray-400';
    stats.textContent = `Solved ${totalSolved}/${totalProblems}`;
    mainRow.appendChild(stats);
    
    patternContainer.appendChild(mainRow);
    
    const questionsContainer = document.createElement('div');
    questionsContainer.className = 'questions-container pl-12';
    patternContainer.appendChild(questionsContainer);
    
    patternsList.appendChild(patternContainer);

    // Reopen previously open panel
    if (openPanel.pattern === patternKey && openPanel.segIndex !== null && openPanel.segIndex !== undefined) {
      const targetBtn = bar.querySelector(`[data-seg-index="${openPanel.segIndex}"]`);
      if (targetBtn) {
        targetBtn.classList.add('expanded');
        renderQuestions(patternKey, Number(openPanel.segIndex), questionsContainer);
        questionsContainer.classList.add('open');
        activeQuestionList = questionsContainer;
      }
    }
  }
}

// Color function matching example
function getColorForDifficulty(difficulty) {
  const diff = normDifficulty(difficulty);
  if (diff === 'Easy') return '#4acf4a';
  if (diff === 'Medium') return '#ffbf00';
  if (diff === 'Hard') return '#f94d4d';
  return '#2d2d2d';
}

function renderQuestions(patternKey, segIndex, container) {
  container.innerHTML = '';
  const segments = buildSegments(patternKey);
  const seg = segments[segIndex];
  
  // All segments now have questions, no empty check needed
  if (!seg) {
    container.innerHTML = `<div class="text-gray-500 italic py-4">Invalid segment index.</div>`;
    return;
  }
  
  const questionList = document.createElement('div');
  questionList.className = 'space-y-3 pt-4';
  
  const key = `${patternKey}/${seg.slug}`;
  const isSolved = seg.solved;
  const isSelected = selectedKey === key;

  // Initialize timer state if not exists
  const problemId = `${patternKey}-${seg.slug}`;
  if (!timerStates[problemId]) {
    timerStates[problemId] = { elapsedTime: 0, isRunning: false, intervalId: null, startTime: 0 };
  }
  const timerState = timerStates[problemId];

  const item = document.createElement('div');
  item.className = `problem-item flex justify-between items-center bg-[#2d2d2d] p-3 rounded-lg${isSelected ? ' is-selected' : ''}`;
  item.tabIndex = 0;

  const questionInfo = document.createElement('div');
  
  // Generate question ID based on pattern and difficulty
  const questionId = document.createElement('span');
  questionId.className = 'text-gray-500 mr-3 font-mono text-sm';
  const patternAbbrev = patternKey.split('-').map(word => word.charAt(0).toUpperCase()).join('');
  const dInit = seg.difficulty === 'Easy' ? 'E' : seg.difficulty === 'Medium' ? 'M' : 'H';
  questionId.textContent = `${patternAbbrev}-${dInit}${String(segIndex + 1).padStart(2, '0')}`;
  
  const questionName = document.createElement('span');
  questionName.className = 'text-white';
  questionName.textContent = seg.title;
  
  questionInfo.appendChild(questionId);
  questionInfo.appendChild(questionName);

  const controls = document.createElement('div');
  controls.className = 'flex items-center gap-3';
  
  const solveButtonHTML = !isSolved 
    ? `<button class="btn-solve" data-action="solve" data-pattern="${patternKey}" data-slug="${seg.slug}" data-index="${segIndex}">Mark Solved</button>` 
    : '';

  controls.innerHTML = `
    ${solveButtonHTML}
    <span class="timer-display font-mono text-sm text-gray-400" data-timer-id="${problemId}">${formatTime(timerState.elapsedTime)}</span>
    <div class="flex items-center gap-2">
      <button class="timer-btn timer-btn-start" data-action="start" data-id="${problemId}" ${timerState.isRunning ? 'style="display:none;"' : ''}>Start</button>
      <button class="timer-btn timer-btn-stop" data-action="stop" data-id="${problemId}" ${!timerState.isRunning ? 'style="display:none;"' : ''}>Stop</button>
      <button class="timer-btn timer-btn-end" data-action="end" data-id="${problemId}" ${timerState.elapsedTime === 0 && !timerState.isRunning ? 'style="display:none;"' : ''}>End Session</button>
    </div>
    <div class="status-tag ${isSolved ? 'tag-solved' : 'tag-unsolved'}">${isSolved ? 'Solved' : 'Unsolved'}</div>
  `;

  // Add click handler for problem selection (not timer buttons)
  questionInfo.addEventListener('click', () => {
    selectedKey = key; // persist selection for animation/pill state
    // Repaint selection without closing
    renderQuestions(patternKey, segIndex, container);
    // Open or create (no duplicates)
    vscode.postMessage({ command: 'codequest.openOrCreateProblem', pattern: patternKey, slug: seg.slug });
  });
  
  item.appendChild(questionInfo);
  item.appendChild(controls);
  questionList.appendChild(item);
  
  container.appendChild(questionList);
}function handleTimerAction(e) {
  if (!e.target.dataset.action) return;
  
  const { action, id, pattern, slug, index } = e.target.dataset;
  
  // Handle solve action
  if (action === 'solve') {
    const key = `${pattern}/${slug}`;
    
    // Add to solved set
    if (!state.solvedKeys.includes(key)) {
      state.solvedKeys.push(key);
    }
    
    // Send message to extension
    vscode.postMessage({
      command: 'markSolved',
      pattern: pattern,
      slug: slug
    });
    
    // Re-render the pattern to update colors and the current question
    renderPatterns();
    
    // If this question is currently open, re-render it
    if (openPanel.pattern === pattern && openPanel.segIndex === Number(index)) {
      const patternContainer = document.querySelector(`[data-pattern="${pattern}"]`).closest('.py-6');
      const questionsContainer = patternContainer.querySelector('.questions-container');
      renderQuestions(pattern, Number(index), questionsContainer);
    }
    
    // Update calendar with solved activity
    const today = new Date().toISOString().split('T')[0];
    if (!state.calendar.dailyMinutes[today]) {
      state.calendar.dailyMinutes[today] = 0;
    }
    state.calendar.dailyMinutes[today] += 15; // Add 15 minutes for solving a problem
    renderCalendar();
    
    return;
  }
  
  // Handle timer actions
  const state_timer = timerStates[id];
  const container = e.target.closest('.flex.items-center.gap-2');
  const startBtn = container.querySelector('[data-action="start"]');
  const stopBtn = container.querySelector('[data-action="stop"]');
  const endBtn = container.querySelector('[data-action="end"]');
  const timerDisplay = document.querySelector(`[data-timer-id="${id}"]`);

  if (action === 'start') {
    state_timer.isRunning = true;
    state_timer.startTime = Date.now();
    startBtn.style.display = 'none';
    stopBtn.style.display = 'block';
    endBtn.style.display = 'block';
    state_timer.intervalId = setInterval(() => {
      const currentTime = Date.now();
      const sessionTime = currentTime - state_timer.startTime;
      timerDisplay.textContent = formatTime(state_timer.elapsedTime + sessionTime);
    }, 1000);
  } else if (action === 'stop') {
    state_timer.isRunning = false;
    clearInterval(state_timer.intervalId);
    state_timer.elapsedTime += Date.now() - state_timer.startTime;
    stopBtn.style.display = 'none';
    startBtn.style.display = 'block';
    startBtn.textContent = 'Resume';
  } else if (action === 'end') {
    state_timer.isRunning = false;
    clearInterval(state_timer.intervalId);
    if (state_timer.startTime > 0) {
      state_timer.elapsedTime += Date.now() - state_timer.startTime;
    }
    console.log(`Session for ${id} ended. Total time: ${formatTime(state_timer.elapsedTime)}`);
    
    // Add session time to calendar
    const sessionMinutes = Math.ceil(state_timer.elapsedTime / (1000 * 60));
    const today = new Date().toISOString().split('T')[0];
    if (!state.calendar.dailyMinutes[today]) {
      state.calendar.dailyMinutes[today] = 0;
    }
    state.calendar.dailyMinutes[today] += sessionMinutes;
    renderCalendar();
    
    // Reset state
    state_timer.elapsedTime = 0;
    state_timer.startTime = 0;
    timerDisplay.textContent = formatTime(0);
    startBtn.textContent = 'Start';
    startBtn.style.display = 'block';
    stopBtn.style.display = 'none';
    endBtn.style.display = 'none';
  }
}

// EXACT copy of segment click handler from example
function handleSegmentClick(event) {
  if (event.target.dataset.action) return; // Prevent timer clicks from triggering this
  const clickedSegment = event.target;
  const { pattern, problemId, segIndex } = clickedSegment.dataset;
  const patternContainer = clickedSegment.closest('.py-6');
  const questionsContainer = patternContainer.querySelector('.questions-container');
  const barContainer = clickedSegment.parentElement;
  const isAlreadyOpen = clickedSegment.classList.contains('expanded');

  barContainer.querySelectorAll('.pattern-bar-segment').forEach(seg => seg.classList.remove('expanded'));
  
  if (activeQuestionList && activeQuestionList !== questionsContainer) {
    activeQuestionList.classList.remove('open');
  }
  
  if (isAlreadyOpen) {
    questionsContainer.classList.remove('open');
    activeQuestionList = null;
    openPanel = { pattern: null, segIndex: null };
  } else {
    clickedSegment.classList.add('expanded');
    renderQuestions(pattern, Number(segIndex), questionsContainer);
    questionsContainer.classList.add('open');
    activeQuestionList = questionsContainer;
    openPanel = { pattern, segIndex: Number(segIndex) };
  }
}

// Legacy pattern segments function (keeping for compatibility)
function updatePatternSegments() {
  renderPatterns();
}

// Calendar heatmap functions
function renderCalendar() {
    const calendarView = document.getElementById('calendar-view-content');
    const tooltip = document.getElementById('tooltip');
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const daysToShow = 182; // Approx 6 months

    let calendarHTML = `
        <div id="month-labels-container" class="flex text-xs text-gray-400 mb-2"></div>
        <div class="calendar-scroll-container">
            <div class="calendar-grid"></div>
        </div>
        <div class="flex justify-between items-center mt-3 text-xs text-gray-500">
            <span>Problems per day</span>
            <div class="flex items-center gap-1">
                <span>0</span>
                <div class="w-3 h-3 rounded-sm bg-[#0e4429]"></div>
                <div class="w-3 h-3 rounded-sm bg-[#006d32]"></div>
                <div class="w-3 h-3 rounded-sm bg-[#26a641]"></div>
                <div class="w-3 h-3 rounded-sm bg-[#39d353]"></div>
                <span>5+</span>
            </div>
        </div>`;
    calendarView.innerHTML = calendarHTML;
    
    const grid = calendarView.querySelector('.calendar-grid');
    const monthLabelsContainer = calendarView.querySelector('#month-labels-container');
    const activityLevels = ['#0e4429', '#006d32', '#26a641', '#39d353'];
    const counts = [1, 3, 5, 6];

    const today = new Date();
    const startDate = new Date();
    startDate.setDate(today.getDate() - daysToShow);
    
    // Adjust start date to the beginning of that week (Sunday)
    startDate.setDate(startDate.getDate() - startDate.getDay());

    let monthLabelHTML = '';
    let lastMonth = -1;
    let monthColCount = 0;

    const totalDays = daysToShow + today.getDay() + 1;

    for (let i = 0; i <= totalDays; i++) {
        const currentDate = new Date(startDate);
        currentDate.setDate(startDate.getDate() + i);
        
        // Logic for positioning month labels
        if (currentDate.getDay() === 0) { // New week (column) starts on Sunday
            if (currentDate.getMonth() !== lastMonth) {
                if(lastMonth !== -1) {
                     monthLabelHTML += `<span style="width: ${monthColCount * 20}px" class="text-left">${monthNames[lastMonth]}</span>`;
                }
                lastMonth = currentDate.getMonth();
                monthColCount = 0;
            }
            monthColCount++;
        }

        const day = document.createElement('div');
        day.className = 'calendar-day';
        
        // Use actual calendar data based on real activity
        const dateStr = currentDate.toISOString().split('T')[0];
        const dayMinutes = state.calendar.dailyMinutes[dateStr] || 0;
        
        let problemCount = 0;
        if (dayMinutes > 0) {
            // Convert minutes to problem count (roughly 15 minutes per problem)
            problemCount = Math.ceil(dayMinutes / 15);
            let level = 0;
            if (problemCount >= 6) level = 3;      // 5+ problems
            else if (problemCount >= 5) level = 2; // 3-4 problems  
            else if (problemCount >= 3) level = 1; // 1-2 problems
            else level = 0;                        // <1 problem
            
            day.style.backgroundColor = activityLevels[level];
        } else {
            // Check if any problems were solved on this date from state.solved
            let solvedToday = 0;
            if (state.solved) {
                for (const patternKey in state.solved) {
                    for (const problemId in state.solved[patternKey]) {
                        const solvedData = state.solved[patternKey][problemId];
                        if (solvedData && solvedData.solvedAt) {
                            const solvedDate = new Date(solvedData.solvedAt).toISOString().split('T')[0];
                            if (solvedDate === dateStr) {
                                solvedToday++;
                            }
                        }
                    }
                }
            }
            
            if (solvedToday > 0) {
                problemCount = solvedToday;
                let level = 0;
                if (solvedToday >= 6) level = 3;
                else if (solvedToday >= 5) level = 2; 
                else if (solvedToday >= 3) level = 1;
                else level = 0;
                
                day.style.backgroundColor = activityLevels[level];
            } else {
                // No activity - keep default gray
                problemCount = 0;
            }
        }
        
        day.dataset.count = problemCount;
        
        // Add tooltip events
        day.addEventListener('mouseenter', (e) => {
            tooltip.style.display = 'block';
            tooltip.textContent = `${e.target.dataset.count} problems on ${currentDate.toDateString()}`;
        });
        day.addEventListener('mouseleave', () => { 
            tooltip.style.display = 'none'; 
        });
        day.addEventListener('mousemove', (e) => {
            tooltip.style.left = `${e.pageX + 10}px`;
            tooltip.style.top = `${e.pageY + 10}px`;
        });

        grid.appendChild(day);
    }
    // Add the last month label
    monthLabelHTML += `<span style="width: ${monthColCount * 20}px" class="text-left">${monthNames[lastMonth]}</span>`;
    monthLabelsContainer.innerHTML = monthLabelHTML;

    // Drag to scroll logic
    const slider = calendarView.querySelector('.calendar-scroll-container');
    let isDown = false, startX, scrollLeft;
    slider.addEventListener('mousedown', (e) => { 
        isDown = true; 
        slider.classList.add('grabbing'); 
        startX = e.pageX - slider.offsetLeft; 
        scrollLeft = slider.scrollLeft; 
    });
    slider.addEventListener('mouseleave', () => { 
        isDown = false; 
        slider.classList.remove('grabbing'); 
    });
    slider.addEventListener('mouseup', () => { 
        isDown = false; 
        slider.classList.remove('grabbing'); 
    });
    slider.addEventListener('mousemove', (e) => { 
        if (!isDown) return; 
        e.preventDefault(); 
        const x = e.pageX - slider.offsetLeft; 
        const walk = (x - startX) * 2; // scroll-fast 
        slider.scrollLeft = scrollLeft - walk; 
    });
    
    // Scroll to the end by default to show today's date
    slider.scrollLeft = slider.scrollWidth;
}

function updateCalendarHeatmap() {
  renderCalendar();
}

// Session button handlers
function updateSessionButtons() {
  const playBtn = document.getElementById('startSession');
  const pauseBtn = document.getElementById('pauseSession');
  const stopBtn = document.getElementById('endSession');

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

// Message handling
window.addEventListener('message', event => {
  const message = event.data;
  
  switch (message.type) {
    case 'updateState':
      state = { ...state, ...message.data };
      updateUI();
      break;
    case 'setPreviewMode':
      previewMode = message.data;
      const previewElement = document.getElementById('previewMode');
      const previewLabel = document.getElementById('previewLabel');
      
      if (previewMode.enabled) {
        previewElement.style.display = 'block';
        previewLabel.textContent = previewMode.label;
      } else {
        previewElement.style.display = 'none';
      }
      break;
  }
});

// Handle catalog data from extension
window.addEventListener('message', event => {
  const message = event.data;
  
  if (message.command === 'catalogData') {
    catalogData = message.data;
    renderPatterns(); // Re-render patterns with real data
  }
});

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
  // Request catalog data from extension
  vscode.postMessage({ command: 'codequest.getCatalog' });
  
  // Add timer action handler
  document.getElementById('patterns-list').addEventListener('click', handleTimerAction);

  // Initial render (will be updated when catalog data arrives)
  renderPatterns();
  renderCalendar();
});
