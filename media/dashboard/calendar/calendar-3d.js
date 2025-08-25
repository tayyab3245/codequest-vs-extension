/**
 * CodeQuest Coach - Modern 3D Calendar Heatmap
 * Extracted and modularized from self-contained design
 */

/**
 * Renders a modern 3D D3 calendar heatmap
 * @param {HTMLElement} containerEl - The container element
 * @param {number} year - The year to render
 * @param {Object} dataMap - Object with date keys (YYYY-MM-DD) and numeric values
 * @param {string} viewMode - 'time' or 'solved'
 */
function render3DCalendar(containerEl, year, dataMap, viewMode = 'time') {
    if (!containerEl || typeof d3 === 'undefined') {
        console.warn('3D calendar requires a container element and the D3 library.');
        return;
    }
    
    containerEl.innerHTML = '';
    
    const cellSize = 12;
    const cellGap = 3;
    const padding = { top: 30, right: 20, bottom: 20, left: 40 };
    const width = 53 * (cellSize + cellGap) + padding.left + padding.right;
    const height = 7 * (cellSize + cellGap) + padding.top + padding.bottom;
    
    const svg = d3.select(containerEl)
        .append('svg')
        .attr('class', 'calendar-3d-svg')
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
    g.selectAll(".calendar-3d-month-label")
        .data(d3.timeMonths(new Date(year, 0, 1), new Date(year + 1, 0, 1)))
        .enter()
        .append("text")
        .attr("class", "calendar-3d-month-label")
        .attr("x", d => d3.timeWeek.count(d3.timeYear(d), d) * (cellSize + cellGap))
        .attr("y", -10)
        .text(d => monthNames[d.getMonth()]);
    
    // Weekday labels
    const weekdayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    g.selectAll(".calendar-3d-weekday-label")
        .data(d3.range(7))
        .enter()
        .append("text")
        .attr("class", "calendar-3d-weekday-label")
        .attr("x", -22)
        .attr("y", d => d * (cellSize + cellGap) + cellSize / 1.5)
        .attr("text-anchor", "middle")
        .text(d => (d % 2 !== 0) ? weekdayLabels[d] : "");

    // Grid background
    const gridWidth = 53 * (cellSize + cellGap) - cellGap;
    const gridHeight = 7 * (cellSize + cellGap) - cellGap;
    g.append('rect')
        .attr('class', 'calendar-3d-grid-background')
        .attr('x', -cellGap)
        .attr('y', -cellGap)
        .attr('width', gridWidth + cellGap * 2)
        .attr('height', gridHeight + cellGap * 2)
        .attr('rx', 6);

    // Calendar day rectangles
    const dayRects = g.selectAll('.calendar-3d-day')
        .data(allDays)
        .enter()
        .append('rect')
        .attr('class', 'calendar-3d-day')
        .attr('width', cellSize)
        .attr('height', cellSize)
        .attr('x', d => d3.timeWeek.count(d3.timeYear(d), d) * (cellSize + cellGap))
        .attr('y', d => d.getDay() * (cellSize + cellGap))
        .attr('rx', 3)
        .attr('ry', 3)
        .attr('fill', d => colorScale(getActivityLevel(dataMap[d3.timeFormat('%Y-%m-%d')(d)] || 0, viewMode)))
        .attr('data-date', d => d3.timeFormat('%Y-%m-%d')(d));
    
    setup3DTooltips(dayRects, dataMap, viewMode);
    add3DCalendarLegend(svg, colorScale, width - padding.right - 120, height - 15);
    
    // Store reference for updates
    containerEl._3dCalendar = { dayRects, getActivityLevel, dataMap, viewMode };
}

/**
 * Sets up tooltips for the 3D calendar
 */
function setup3DTooltips(dayRects, dataMap, viewMode) {
    let tooltip = d3.select('body').select('#calendar-3d-tooltip');
    if (tooltip.empty()) {
        tooltip = d3.select('body')
            .append('div')
            .attr('id', 'calendar-3d-tooltip');
    }
    
    dayRects
        .on('mouseover', function(event, d) {
            d3.select(this)
                .attr('stroke', '#7b68ee')
                .attr('stroke-width', 1.5);
            
            const value = dataMap[d3.timeFormat('%Y-%m-%d')(d)] || 0;
            const dateString = d3.timeFormat('%A, %B %d, %Y')(d);
            let text = `<strong>No activity</strong> on ${dateString}`;
            
            if (value > 0) {
                if (viewMode === 'solved') {
                    text = `<strong>${value} problem${value > 1 ? 's' : ''} solved</strong> on ${dateString}`;
                } else {
                    const h = Math.floor(value / 60);
                    const m = value % 60;
                    text = `<strong>${(h > 0 ? `${h}h ` : '') + (m > 0 ? `${m}m` : '')} spent</strong> on ${dateString}`;
                }
            }
            
            tooltip
                .style('display', 'block')
                .html(text);
        })
        .on('mousemove', e => {
            tooltip
                .style('left', (e.pageX + 15) + 'px')
                .style('top', (e.pageY - 30) + 'px');
        })
        .on('mouseout', function() {
            d3.select(this).attr('stroke', 'none');
            tooltip.style('display', 'none');
        });
}

/**
 * Adds legend to the 3D calendar
 */
function add3DCalendarLegend(svg, colorScale, x, y) {
    const legend = svg.append('g')
        .attr('class', 'calendar-3d-legend')
        .attr('transform', `translate(${x}, ${y})`);
    
    legend.append('text')
        .attr('x', -5)
        .attr('y', 8)
        .attr('text-anchor', 'end')
        .text('Less');
    
    legend.selectAll('.legend-square')
        .data(colorScale.range())
        .enter()
        .append('rect')
        .attr('class', 'legend-square')
        .attr('width', 10)
        .attr('height', 10)
        .attr('x', (d, i) => i * 14)
        .attr('y', 0)
        .attr('rx', 2)
        .attr('ry', 2)
        .attr('fill', d => d);
    
    legend.append('text')
        .attr('x', colorScale.range().length * 14 + 5)
        .attr('y', 8)
        .text('More');
}

/**
 * Updates the 3D calendar with new data
 */
function update3DCalendar(containerEl, newDataMap, newViewMode) {
    if (!containerEl || !containerEl._3dCalendar) {
        render3DCalendar(containerEl, new Date().getFullYear(), newDataMap, newViewMode);
        return;
    }
    
    const { dayRects, getActivityLevel } = containerEl._3dCalendar;
    
    const colorSchemes = {
        solved: ['#353a43', '#0a5d3c', '#00844a', '#00ad5d', '#16d374'],
        time: ['#353a43', '#1e40af', '#1d4ed8', '#2563eb', '#3b82f6']
    };
    
    const newColorScale = d3.scaleQuantize()
        .domain([0, 4])
        .range(colorSchemes[newViewMode]);
    
    // Animate color transition
    dayRects.transition()
        .duration(500)
        .attr('fill', d => newColorScale(getActivityLevel(newDataMap[d3.timeFormat('%Y-%m-%d')(d)] || 0, newViewMode)));
    
    // Update tooltips
    setup3DTooltips(dayRects, newDataMap, newViewMode);
    
    // Update legend
    const svg = d3.select(containerEl).select('svg');
    svg.select('.calendar-3d-legend').remove();
    const { width, height } = svg.node().viewBox.baseVal;
    add3DCalendarLegend(svg, newColorScale, width - 20 - 120, height - 15);
    
    // Update stored references
    containerEl._3dCalendar.dataMap = newDataMap;
    containerEl._3dCalendar.viewMode = newViewMode;
}

/**
 * Creates the 3D calendar HTML structure
 */
function create3DCalendarHTML() {
    return `
        <div class="calendar-3d-container">
            <div class="calendar-3d-header">
                <div class="calendar-3d-dropdown">
                    <button class="calendar-3d-dropdown-button" id="calendar3dDropdownButton">
                        <span id="calendar3dSelectedValue">Time</span>
                        <svg class="arrow" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                        </svg>
                    </button>
                    <div class="calendar-3d-dropdown-menu" id="calendar3dDropdownMenu">
                        <div class="calendar-3d-dropdown-item" data-value="time">Time</div>
                        <div class="calendar-3d-dropdown-item" data-value="solved">Solved</div>
                    </div>
                </div>
            </div>
            <div class="calendar-3d-wrapper">
                <div class="calendar-3d-svg-container" id="calendar3dContainer"></div>
            </div>
        </div>
    `;
}

/**
 * Initializes the 3D calendar dropdown functionality
 */
function init3DCalendarDropdown(minutesMap, solvedMap) {
    const dropdownButton = document.getElementById('calendar3dDropdownButton');
    const dropdownMenu = document.getElementById('calendar3dDropdownMenu');
    const selectedValue = document.getElementById('calendar3dSelectedValue');
    const container = document.getElementById('calendar3dContainer');

    if (!dropdownButton || !dropdownMenu || !selectedValue || !container) {
        console.warn('3D Calendar dropdown elements not found');
        return;
    }

    dropdownButton.addEventListener('click', () => {
        dropdownMenu.classList.toggle('show');
        dropdownButton.classList.toggle('open');
    });

    document.querySelectorAll('.calendar-3d-dropdown-item').forEach(item => {
        item.addEventListener('click', () => {
            const view = item.getAttribute('data-value');
            const text = item.textContent;
            selectedValue.textContent = text;
            
            const dataMap = view === 'time' ? minutesMap : solvedMap;
            update3DCalendar(container, dataMap, view);
            
            dropdownMenu.classList.remove('show');
            dropdownButton.classList.remove('open');
        });
    });

    // Close dropdown when clicking outside
    window.addEventListener('click', (e) => {
        if (!dropdownButton.contains(e.target)) {
            dropdownMenu.classList.remove('show');
            dropdownButton.classList.remove('open');
        }
    });
}

// Export functions for module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        render3DCalendar,
        update3DCalendar,
        create3DCalendarHTML,
        init3DCalendarDropdown
    };
}
