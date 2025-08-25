// VS Code API for messaging with backend
const vscode = acquireVsCodeApi();

// Real patterns data from backend (starts empty, populated by backend)
let patternsData = [];

// Real backend state
let backendState = null;
let realCatalogData = null;

// Message listeners for backend communication
window.addEventListener('message', event => {
    const message = event.data;
    
    switch (message.type) {
        case 'state':
            console.log('📦 Received backend state:', message);
            backendState = message;
            updateUIWithBackendData(message);
            break;
            
        case 'catalogData':
            console.log('📚 Received catalog data:', message);
            realCatalogData = message.catalog;
            updatePatternsFromCatalog(message.catalog);
            break;
            
        case 'commandResult':
            console.log('✅ Command result:', message.message);
            break;
    }
});

// Request initial data from backend
function requestBackendData() {
    console.log('🔄 Requesting backend data...');
    vscode.postMessage({ command: 'getInitialState' });
    vscode.postMessage({ command: 'codequest.getCatalog' });
}

// Update UI with real backend data
function updateUIWithBackendData(state) {
    console.log('🔄 Updating UI with backend state:', state);
    
    if (state.calendar) {
        // Update calendar state
        calendarState = state;
        
        if (state.calendar.dailyMinutes) {
            // Update calendar with real data
            const calendarContainer = document.getElementById('calendar-container');
            if (calendarContainer) {
                renderD3Calendar(calendarContainer, new Date().getFullYear(), state.calendar.dailyMinutes, 'time');
            }
        }
    }
    
    // Update solved states if available
    if (state.solvedKeys && Array.isArray(state.solvedKeys)) {
        console.log('📝 Updating solved states:', state.solvedKeys.length, 'solved problems');
        updateSolvedStates(state.solvedKeys);
    }
}

// Update solved states in the UI
function updateSolvedStates(solvedKeys) {
    if (!patternsData || patternsData.length === 0) {
        console.log('⏳ No patterns data yet, storing solved keys for later update');
        return;
    }
    
    // Update patterns data with solved states
    patternsData.forEach(pattern => {
        pattern.questions.forEach(question => {
            const patternSlug = pattern.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
            const questionKey = `${patternSlug}/${question.slug || question.title.toLowerCase().replace(/\s+/g, '-')}`;
            
            if (solvedKeys.includes(questionKey)) {
                question.status = 'solved';
            } else {
                question.status = 'unsolved';
            }
        });
    });
    
    // Re-render patterns with updated states
    updatePaginationConfig();
    renderPages();
}

// Convert catalog to patterns format
function updatePatternsFromCatalog(catalog) {
    if (!catalog) return;
    
    try {
        const newPatternsData = [];
        
        for (const [patternName, bands] of Object.entries(catalog)) {
            const questions = [];
            
            // Process each band (1-5) to get exactly 4 questions per band
            for (let bandNumber = 1; bandNumber <= 5; bandNumber++) {
                const bandProblems = bands[bandNumber] || [];
                
                // Take up to 4 questions from this band
                const bandQuestions = bandProblems.slice(0, 4);
                
                bandQuestions.forEach((problem, index) => {
                    const questionKey = `${patternName}/${problem.slug}`;
                    const isSolved = backendState?.solvedKeys?.includes(questionKey) || false;
                    
                    questions.push({
                        title: problem.title,
                        slug: problem.slug,
                        pattern: patternName,
                        status: isSolved ? 'solved' : 'unsolved',
                        band: parseInt(bandNumber), // Ensure band is a number
                        url: problem.url
                    });
                });
            }
            
            // Now we have up to 20 questions (4 per band × 5 bands)
            if (questions.length > 0) {
                newPatternsData.push({
                    name: patternName.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
                    questions: questions
                });
            }
        }
        
        if (newPatternsData.length > 0) {
            console.log('🔄 Updated patterns from catalog:', newPatternsData.length, 'patterns');
            console.log('📊 Questions per pattern:', newPatternsData.map(p => `${p.name}: ${p.questions.length} questions`));
            patternsData = newPatternsData;
            updatePaginationConfig(); // Update pagination based on real data
            renderPages(); // Re-render with real data
        }
    } catch (error) {
        console.error('❌ Error updating patterns from catalog:', error);
    }
}

const timers = new Map();
const checkIconSVG = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>`;
const undoIconSVG = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>`;

function formatTime(seconds) {
    const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
    const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
}

function stopTimer(questionId, btnEl) {
    if (timers.has(questionId) && timers.get(questionId).intervalId) {
        const timerState = timers.get(questionId);
        clearInterval(timerState.intervalId);
        timers.set(questionId, { ...timerState, intervalId: null });
        if (btnEl) { 
            btnEl.textContent = "Start"; 
            btnEl.classList.remove('running'); 
        }
    }
}

function toggleTimer(questionId, timerEl, btnEl) {
    if (timers.has(questionId) && timers.get(questionId).intervalId) {
        stopTimer(questionId, btnEl);
        // End session in backend
        vscode.postMessage({ command: 'codequest.endSession' });
    } else {
        const startTime = Date.now();
        const initialSeconds = timers.has(questionId) ? timers.get(questionId).seconds : 0;
        let currentSeconds = initialSeconds;
        
        const intervalId = setInterval(() => {
            currentSeconds = initialSeconds + Math.floor((Date.now() - startTime) / 1000);
            timerEl.textContent = formatTime(currentSeconds);
        }, 1000);
        
        timers.set(questionId, { seconds: initialSeconds, intervalId });
        btnEl.textContent = "Stop";
        btnEl.classList.add('running');
        
        // Start session in backend
        vscode.postMessage({ command: 'codequest.startSession' });
    }
}

function updatePatternProgress(patternEl) {
    const questions = patternEl.querySelectorAll('.question-item');
    const solvedCount = Array.from(questions).filter(q => q.dataset.status === 'solved').length;
    const progress = Math.floor((solvedCount / 4) * 5);
    patternEl.setAttribute('data-progress', progress);
}

function createPatternElement(pattern) {
    const patternEl = document.createElement('div');
    patternEl.className = 'pattern';
    
    const headerEl = document.createElement('div');
    headerEl.className = 'pattern-header-clickable';
    
    const titleEl = document.createElement('h3');
    titleEl.className = 'pattern-title';
    titleEl.textContent = pattern.name;
    
    const barEl = document.createElement('div');
    barEl.className = 'segmented-bar';
    
    // Create 5 segments for 5 question sets (B1-B5)
    for (let i = 0; i < 5; i++) {
        const segment = document.createElement('span');
        segment.className = 'segment';
        if (i === 0) segment.classList.add('active'); // B1 active by default
        segment.dataset.questionSet = i;
        segment.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent triggering header collapse/expand
            
            // Update active segment visual
            barEl.querySelectorAll('.segment').forEach(s => s.classList.remove('active'));
            segment.classList.add('active');
            
            // Filter questions to show only this band
            filterQuestionsByBand(patternEl, i + 1); // i+1 because bands are 1-indexed
            
            // Ensure questions container is expanded
            const questionsContainer = patternEl.querySelector('.questions-container');
            if (questionsContainer && !questionsContainer.style.maxHeight) {
                questionsContainer.style.maxHeight = questionsContainer.scrollHeight + "px";
            }
        });
        barEl.appendChild(segment);
    }
    
    headerEl.appendChild(titleEl);
    headerEl.appendChild(barEl);
    
    const questionsContainerEl = document.createElement('div');
    questionsContainerEl.className = 'questions-container';
    
    // Load ALL questions from ALL bands for this pattern
    loadAllQuestions(pattern, questionsContainerEl);
    
    // Initially show B1 questions (band 1)
    filterQuestionsByBand(patternEl, 1);
    
    headerEl.addEventListener('click', (e) => {
        // Only toggle if clicking on header, not on segments
        if (!e.target.classList.contains('segment')) {
            if (questionsContainerEl.style.maxHeight) {
                questionsContainerEl.style.maxHeight = null;
            } else {
                questionsContainerEl.style.maxHeight = questionsContainerEl.scrollHeight + "px";
            }
        }
    });
    
    patternEl.appendChild(headerEl);
    patternEl.appendChild(questionsContainerEl);
    
    updatePatternProgress(patternEl);
    return patternEl;
}

// Load all questions from all bands into the container (but hide them initially)
function loadAllQuestions(pattern, questionsContainer) {
    questionsContainer.innerHTML = ''; // Clear existing questions
    
    pattern.questions.forEach((q, index) => {
        const questionId = `${pattern.name.replace(/\s/g, '-')}-${q.band}-${index}`;
        const questionItemEl = document.createElement('div');
        questionItemEl.className = 'question-item';
        questionItemEl.dataset.status = q.status || 'unsolved';
        questionItemEl.dataset.band = q.band; // Store band for filtering
        questionItemEl.style.display = 'none'; // Hide initially
        
        const statusIndicator = document.createElement('span');
        statusIndicator.className = `status-indicator ${q.status || 'unsolved'}`;
        
        const questionTitle = document.createElement('span');
        questionTitle.className = 'question-title';
        questionTitle.textContent = `B${q.band} - ${q.title}`;
        
        const actionsWrapper = document.createElement('div');
        actionsWrapper.className = 'actions';
        
        const timerEl = document.createElement('span');
        timerEl.className = 'timer';
        timerEl.textContent = formatTime(0);

        const startBtn = document.createElement('button');
        startBtn.className = 'action-btn start-btn';
        startBtn.textContent = 'Start';
        startBtn.onclick = () => toggleTimer(questionId, timerEl, startBtn);

        const solveBtn = document.createElement('button');
        solveBtn.className = 'action-btn solve-btn-icon';
        if (q.status === 'solved') {
            solveBtn.innerHTML = undoIconSVG;
            solveBtn.classList.add('is-solved');
        } else {
            solveBtn.innerHTML = checkIconSVG;
            solveBtn.classList.remove('is-solved');
        }
        
        solveBtn.onclick = () => {
            const question = q;
            const patternSlug = pattern.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
            
            if (question.status === 'solved') {
                // Mark as unsolved in backend
                question.status = 'unsolved';
                solveBtn.innerHTML = checkIconSVG;
                solveBtn.classList.remove('is-solved');
                
                // Send to backend
                vscode.postMessage({
                    command: 'codequest.markSolved',
                    pattern: patternSlug,
                    slug: question.slug || question.title.toLowerCase().replace(/\s+/g, '-'),
                    solved: false
                });
                
                stopTimer(questionId, startBtn);
            } else {
                // Mark as solved in backend
                question.status = 'solved';
                solveBtn.innerHTML = undoIconSVG;
                solveBtn.classList.add('is-solved');
                
                // Send to backend
                vscode.postMessage({
                    command: 'codequest.markSolved',
                    pattern: patternSlug,
                    slug: question.slug || question.title.toLowerCase().replace(/\s+/g, '-'),
                    solved: true
                });
                
                stopTimer(questionId, startBtn);
            }
            questionItemEl.dataset.status = question.status;
            statusIndicator.className = `status-indicator ${question.status}`;
            
            // Update progress for the pattern
            const patternEl = questionItemEl.closest('.pattern');
            updatePatternProgress(patternEl);
        };
        
        actionsWrapper.append(timerEl, startBtn, solveBtn);
        questionItemEl.append(statusIndicator, questionTitle, actionsWrapper);
        questionsContainer.appendChild(questionItemEl);
    });
}

// Filter questions to show only the specified band
function filterQuestionsByBand(patternEl, bandNumber) {
    const questionsContainer = patternEl.querySelector('.questions-container');
    if (!questionsContainer) return;
    
    const allQuestions = questionsContainer.querySelectorAll('.question-item');
    let visibleCount = 0;
    
    allQuestions.forEach(questionEl => {
        const questionBand = parseInt(questionEl.dataset.band);
        if (questionBand === bandNumber && visibleCount < 4) {
            questionEl.style.display = 'flex';
            visibleCount++;
        } else {
            questionEl.style.display = 'none';
        }
    });
    
    // Update container height after filtering
    if (questionsContainer.style.maxHeight) {
        questionsContainer.style.maxHeight = questionsContainer.scrollHeight + "px";
    }
}

// Function to show questions for a specific set (B1, B2, B3, B4, B5)
// Pagination functionality (dynamic based on real data)
const patternsPerPage = 6;
let currentPage = 0;
let totalPages = 0;

// Update pagination when patterns data changes
function updatePaginationConfig() {
    totalPages = Math.ceil(patternsData.length / patternsPerPage);
    currentPage = 0; // Reset to first page
}

function renderPages() {
    const patternsRoot = document.getElementById('patterns-pages-container');
    if (!patternsRoot) {
        console.error('patterns-pages-container not found');
        return;
    }
    
    // Don't render if we don't have real data yet
    if (!patternsData || patternsData.length === 0) {
        console.log('⏳ Waiting for real patterns data from backend...');
        return;
    }
    
    console.log('🎨 Rendering patterns with real data:', patternsData.length, 'patterns');
    
    patternsRoot.innerHTML = '';
    for (let i = 0; i < totalPages; i++) {
        const pageEl = document.createElement('div');
        pageEl.className = 'patterns-page';
        const pageData = patternsData.slice(i * patternsPerPage, (i + 1) * patternsPerPage);
        pageData.forEach(pattern => {
            pageEl.appendChild(createPatternElement(pattern));
        });
        patternsRoot.appendChild(pageEl);
    }
    renderPaginationControls();
    updatePagination();
}

function renderPaginationControls() {
    const pageIndicatorBar = document.getElementById('page-indicator-bar');
    if (!pageIndicatorBar) return;
    
    pageIndicatorBar.innerHTML = '';
    for (let i = 0; i < totalPages; i++) {
        const segment = document.createElement('div');
        segment.className = 'page-segment';
        segment.dataset.page = i;
        segment.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent bubbling to parent click handlers
            currentPage = i;
            updatePagination();
        });
        pageIndicatorBar.appendChild(segment);
    }
}

function updatePagination() {
    const pageIndicator = document.getElementById('page-indicator');
    const patternsRoot = document.getElementById('patterns-pages-container');
    const pageIndicatorBar = document.getElementById('page-indicator-bar');
    
    if (pageIndicator) {
        pageIndicator.textContent = `${currentPage + 1} / ${totalPages}`;
    }
    
    if (patternsRoot) {
        patternsRoot.style.transform = `translateX(-${currentPage * 100}%)`;
    }
    
    if (pageIndicatorBar) {
        const segments = pageIndicatorBar.querySelectorAll('.page-segment');
        segments.forEach((seg, index) => {
            seg.classList.toggle('active', index === currentPage);
        });
    }
}

// Calendar functionality with real backend data only
let calendarState = {
    calendar: {
        dailyMinutes: {},
        dailySolved: {}
    }
};

// Update calendar state when backend data arrives
function updateCalendarState(newState) {
    if (newState && newState.calendar) {
        calendarState = newState;
        console.log('📅 Updated calendar state from backend:', calendarState.calendar);
        
        // Re-render calendar with real data
        const calendarContainer = document.getElementById('calendar-container');
        if (calendarContainer) {
            const currentYear = new Date().getFullYear();
            const minutesMap = calendarState.calendar.dailyMinutes || {};
            renderD3Calendar(calendarContainer, currentYear, minutesMap, 'time');
        }
    }
}

function renderD3Calendar(containerEl, year, dataMap, viewMode = 'time') {
    if (!containerEl || typeof d3 === 'undefined') { 
        console.error('D3 not loaded or container not found');
        return; 
    }
    
    containerEl.innerHTML = '';
    
    const cellSize = 12, cellGap = 3;
    const padding = { top: 30, right: 20, bottom: 20, left: 40 };
    const width = 53 * (cellSize + cellGap) + padding.left + padding.right;
    const height = 7 * (cellSize + cellGap) + padding.top + padding.bottom;
    
    const svg = d3.select(containerEl)
        .append('svg')
        .attr('class', 'calendar-svg')
        .attr('viewBox', `0 0 ${width} ${height}`);
        
    const g = svg.append('g')
        .attr('transform', `translate(${padding.left}, ${padding.top})`);
    
    const colorSchemes = {
        solved: ['#353a43', '#0a5d3c', '#00844a', '#00ad5d', '#16d374'],
        time: ['#353a43', '#1e40af', '#1d4ed8', '#2563eb', '#3b82f6']
    };
    
    const colorScale = d3.scaleQuantize()
        .domain([0, 4])
        .range(colorSchemes[viewMode]);
    
    const getActivityLevel = (value, mode) => {
        if (!value || value <= 0) return 0;
        if (mode === 'solved') {
            if (value === 1) return 1;
            if (value <= 3) return 2;
            if (value <= 5) return 3;
            return 4;
        } else {
            if (value < 30) return 1;
            if (value < 60) return 2;
            if (value < 120) return 3;
            return 4;
        }
    };
    
    const allDays = d3.timeDays(new Date(year, 0, 1), new Date(year + 1, 0, 1));
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    
    // Month labels
    g.selectAll(".month-label")
        .data(d3.timeMonths(new Date(year, 0, 1), new Date(year + 1, 0, 1)))
        .enter().append("text")
        .attr("class", "month-label")
        .attr("x", d => d3.timeWeek.count(d3.timeYear(d), d) * (cellSize + cellGap))
        .attr("y", -10)
        .text(d => monthNames[d.getMonth()]);
    
    // Weekday labels
    const weekdayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    g.selectAll(".weekday-label")
        .data(d3.range(7))
        .enter().append("text")
        .attr("class", "weekday-label")
        .attr("x", -22)
        .attr("y", d => d * (cellSize + cellGap) + cellSize / 1.5)
        .attr("text-anchor", "middle")
        .text(d => (d % 2 !== 0) ? weekdayLabels[d] : "");
    
    // Background grid
    const gridWidth = 53 * (cellSize + cellGap) - cellGap;
    const gridHeight = 7 * (cellSize + cellGap) - cellGap;
    g.append('rect')
        .attr('class', 'grid-background')
        .attr('x', -cellGap)
        .attr('y', -cellGap)
        .attr('width', gridWidth + cellGap * 2)
        .attr('height', gridHeight + cellGap * 2)
        .attr('rx', 6);
    
    // Calendar days
    const dayRects = g.selectAll('.calendar-day')
        .data(allDays)
        .enter().append('rect')
        .attr('class', 'calendar-day')
        .attr('width', cellSize)
        .attr('height', cellSize)
        .attr('x', d => d3.timeWeek.count(d3.timeYear(d), d) * (cellSize + cellGap))
        .attr('y', d => d.getDay() * (cellSize + cellGap))
        .attr('rx', 3)
        .attr('ry', 3)
        .attr('fill', d => colorScale(getActivityLevel(dataMap[d3.timeFormat('%Y-%m-%d')(d)] || 0, viewMode)))
        .attr('data-date', d => d3.timeFormat('%Y-%m-%d')(d));
    
    addCalendarLegend(svg, colorScale, width - padding.right - 120, height - 15);
    containerEl._d3Calendar = { dayRects, getActivityLevel, dataMap, viewMode, colorScale };
}

function addCalendarLegend(svg, colorScale, x, y) {
    const legend = svg.append('g')
        .attr('transform', `translate(${x}, ${y})`);
    
    legend.append('text')
        .attr('x', -5)
        .attr('y', 8)
        .attr('text-anchor', 'end')
        .text('Less')
        .style('fill', '#bdc1c6')
        .style('font-size', '10px');
    
    legend.selectAll('.legend-square')
        .data(colorScale.range())
        .enter().append('rect')
        .attr('width', 10)
        .attr('height', 10)
        .attr('x', (d, i) => i * 14)
        .attr('y', 0)
        .attr('rx', 2)
        .attr('ry', 2)
        .attr('fill', d => d)
        .style('stroke', '#23272d')
        .style('stroke-width', 0.5);
    
    legend.append('text')
        .attr('x', colorScale.range().length * 14 + 5)
        .attr('y', 8)
        .text('More')
        .style('fill', '#bdc1c6')
        .style('font-size', '10px');
}

function updateD3Calendar(containerEl, newDataMap, newViewMode) {
    if (!containerEl || !containerEl._d3Calendar) { 
        renderD3Calendar(containerEl, new Date().getFullYear(), newDataMap, newViewMode); 
        return; 
    }
    
    const { dayRects, getActivityLevel } = containerEl._d3Calendar;
    const colorSchemes = {
        solved: ['#353a43', '#0a5d3c', '#00844a', '#00ad5d', '#16d374'],
        time: ['#353a43', '#1e40af', '#1d4ed8', '#2563eb', '#3b82f6']
    };
    
    const newColorScale = d3.scaleQuantize()
        .domain([0, 4])
        .range(colorSchemes[newViewMode]);
    
    dayRects.transition()
        .duration(500)
        .attr('fill', d => newColorScale(getActivityLevel(newDataMap[d3.timeFormat('%Y-%m-%d')(d)] || 0, newViewMode)));
    
    const svg = d3.select(containerEl).select('svg');
    svg.select('.calendar-legend').remove();
    const { width, height } = svg.node().viewBox.baseVal;
    addCalendarLegend(svg, newColorScale, width - 20 - 120, height - 15);
}

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('Initializing unified dashboard with backend integration...');
    
    // Show loading state initially
    showLoadingState();
    
    // Initialize dropdown
    initializeDropdown();
    
    // Request real data from backend
    console.log('📡 Requesting real data from backend...');
    requestBackendData();
    
    console.log('✅ Unified dashboard initialized successfully');
});

// Show loading state while waiting for backend data
function showLoadingState() {
    const patternsContainer = document.getElementById('patterns-pages-container');
    const calendarContainer = document.getElementById('calendar-container');
    
    if (patternsContainer) {
        patternsContainer.innerHTML = '<div style="text-align: center; padding: 2rem; color: var(--text-color);">Loading patterns...</div>';
    }
    
    if (calendarContainer) {
        calendarContainer.innerHTML = '<div style="text-align: center; padding: 2rem; color: var(--text-color);">Loading activity data...</div>';
    }
}

// Initialize dropdown functionality
function initializeDropdown() {
    const dropdownButton = document.getElementById('dropdownButton');
    const dropdownMenu = document.getElementById('dropdownMenu');
    const selectedValue = document.getElementById('selectedValue');
    
    if (dropdownButton && dropdownMenu) {
        dropdownButton.addEventListener('click', () => {
            dropdownMenu.classList.toggle('show');
            dropdownButton.classList.toggle('open');
        });
        
        document.querySelectorAll('.dropdown-item').forEach(item => {
            item.addEventListener('click', () => {
                const value = item.dataset.value;
                selectedValue.textContent = item.textContent;
                dropdownMenu.classList.remove('show');
                dropdownButton.classList.remove('open');
                
                // Update calendar based on selection with real data only
                const calendarContainer = document.getElementById('calendar-container');
                if (calendarContainer && calendarState && calendarState.calendar) {
                    if (value === 'solved') {
                        const solvedMap = calendarState.calendar.dailySolved || {};
                        updateD3Calendar(calendarContainer, solvedMap, 'solved');
                    } else {
                        const minutesMap = calendarState.calendar.dailyMinutes || {};
                        updateD3Calendar(calendarContainer, minutesMap, 'time');
                    }
                }
            });
        });
        
        window.addEventListener('click', (e) => {
            if (!dropdownButton.contains(e.target)) {
                dropdownMenu.classList.remove('show');
                dropdownButton.classList.remove('open');
            }
        });
    }
}
