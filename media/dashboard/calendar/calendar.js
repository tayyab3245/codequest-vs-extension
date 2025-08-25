/**
 * CodeQuest - Compact D3 Calendar Renderer
 * 
 * A self-contained D3 calendar renderer that creates GitHub-style yearly heatmaps
 * with month labels and divider lines.
 * 
 * Copyright (c) 2025 tayyab3245. All rights reserved.
 */

import { state } from '../core/state.js';

/**
 * Renders a compact D3 calendar for the given year
 * @param {HTMLElement} containerEl - The container element to render the calendar in
 * @param {number} year - The year to render
 * @param {Object} minutesMap - Map of date strings (YYYY-MM-DD) to minutes spent
 */
export function renderD3Calendar(containerEl, year, minutesMap) {
    if (!containerEl || typeof d3 === 'undefined') {
        console.warn('D3 calendar requires container element and D3 library');
        return;
    }

    // Clear any existing content
    containerEl.innerHTML = '';

    // Calendar configuration
    const cellSize = 11;
    const cellGap = 1;
    const padding = { top: 20, right: 20, bottom: 20, left: 30 };
    
    // Calculate dimensions
    const weeksInYear = 53; // Maximum weeks in a year
    const daysInWeek = 7;
    const width = weeksInYear * (cellSize + cellGap) - cellGap + padding.left + padding.right;
    const height = daysInWeek * (cellSize + cellGap) - cellGap + padding.top + padding.bottom;

    // Create SVG container
    const svg = d3.select(containerEl)
        .append('svg')
        .attr('class', 'calendar-svg')
        .attr('width', width)
        .attr('height', height)
        .style('max-height', '140px')
        .style('width', '100%')
        .style('display', 'block');

    const g = svg.append('g')
        .attr('transform', `translate(${padding.left},${padding.top})`);

    // Color scale for activity levels (0-4)
    const colors = {
        0: '#2d2d2d',      // No activity (default gray)
        1: '#0e4429',      // Low activity
        2: '#006d32',      // Medium-low activity  
        3: '#26a641',      // Medium-high activity
        4: '#39d353'       // High activity
    };

    // Helper function to get activity level from minutes
    function getActivityLevel(minutes) {
        if (!minutes || minutes === 0) return 0;
        if (minutes < 30) return 1;
        if (minutes < 60) return 2;
        if (minutes < 120) return 3;
        return 4;
    }

    // Generate all days of the year
    const yearStart = new Date(year, 0, 1);
    const yearEnd = new Date(year, 11, 31);
    const allDays = d3.timeDays(yearStart, d3.timeDay.offset(yearEnd, 1));

    // Add month labels
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                       'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    const monthLabels = g.selectAll('.month-label')
        .data(d3.timeMonths(yearStart, d3.timeMonth.offset(yearEnd, 1)))
        .enter()
        .append('text')
        .attr('class', 'month-label')
        .attr('x', d => d3.timeWeek.count(d3.timeYear(d), d) * (cellSize + cellGap))
        .attr('y', -5)
        .attr('font-size', '10px')
        .attr('fill', '#9ca3af')
        .attr('font-family', 'Inter, sans-serif')
        .text(d => monthNames[d.getMonth()]);

    // Add weekday labels (Mon, Wed, Fri only to save space)
    const weekdayLabels = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
    g.selectAll('.weekday-label')
        .data([1, 3, 5]) // Monday, Wednesday, Friday indices
        .enter()
        .append('text')
        .attr('class', 'weekday-label')
        .attr('x', -8)
        .attr('y', d => d * (cellSize + cellGap) + cellSize * 0.7)
        .attr('text-anchor', 'end')
        .attr('font-size', '9px')
        .attr('fill', '#888')
        .attr('font-family', 'Inter, sans-serif')
        .text(d => weekdayLabels[d]);

    // Create day rectangles
    const dayRects = g.selectAll('.calendar-day')
        .data(allDays)
        .enter()
        .append('rect')
        .attr('class', 'calendar-day')
        .attr('width', cellSize)
        .attr('height', cellSize)
        .attr('x', d => d3.timeWeek.count(d3.timeYear(d), d) * (cellSize + cellGap))
        .attr('y', d => d.getDay() * (cellSize + cellGap))
        .attr('rx', 2)
        .attr('ry', 2)
        .attr('fill', d => {
            const dateKey = d3.timeFormat('%Y-%m-%d')(d);
            const minutes = minutesMap[dateKey] || 0;
            const level = getActivityLevel(minutes);
            return colors[level];
        })
        .attr('stroke', '#121212')
        .attr('stroke-width', 0.5)
        .attr('data-date', d => d3.timeFormat('%Y-%m-%d')(d));

    // Add month outline paths for visual separation
    const monthPaths = g.selectAll('.month-outline')
        .data(d3.timeMonths(yearStart, d3.timeMonth.offset(yearEnd, 1)))
        .enter()
        .append('path')
        .attr('class', 'month-outline')
        .attr('fill', 'none')
        .attr('stroke', '#444')
        .attr('stroke-width', 1)
        .attr('d', pathMonth);

    // Path generator for month outlines
    function pathMonth(t0) {
        const t1 = new Date(t0.getFullYear(), t0.getMonth() + 1, 0);
        const d0 = t0.getDay();
        const w0 = d3.timeWeek.count(d3.timeYear(t0), t0);
        const d1 = t1.getDay();
        const w1 = d3.timeWeek.count(d3.timeYear(t1), t1);
        const cellWithGap = cellSize + cellGap;
        
        return `M${(w0 + 1) * cellWithGap},${d0 * cellWithGap}` +
               `H${w0 * cellWithGap}V${7 * cellWithGap}` +
               `H${w1 * cellWithGap}V${(d1 + 1) * cellWithGap}` +
               `H${(w1 + 1) * cellWithGap}V0` +
               `H${(w0 + 1) * cellWithGap}Z`;
    }

    // Add tooltip functionality
    setupTooltips(dayRects, minutesMap);

    // Store reference for updates
    containerEl._d3Calendar = {
        svg: svg,
        dayRects: dayRects,
        colors: colors,
        getActivityLevel: getActivityLevel
    };
}

/**
 * Updates the colors of an existing D3 calendar without recreating the SVG
 * @param {HTMLElement} containerEl - The container element with the calendar
 * @param {Object} minutesMap - Updated map of date strings to minutes spent
 */
export function updateD3CalendarColors(containerEl, minutesMap) {
    if (!containerEl || !containerEl._d3Calendar) {
        console.warn('No D3 calendar found to update');
        return;
    }

    const { dayRects, colors, getActivityLevel } = containerEl._d3Calendar;

    // Update rectangle colors
    dayRects.attr('fill', function(d) {
        const dateKey = d3.timeFormat('%Y-%m-%d')(d);
        const minutes = minutesMap[dateKey] || 0;
        const level = getActivityLevel(minutes);
        return colors[level];
    });
}

/**
 * Main calendar rendering function (compatibility with existing code)
 */
export function renderCalendar() {
    console.log('Rendering D3 calendar...');
    const container = document.getElementById('calendar-view-content');
    if (!container) {
        console.warn('Calendar container not found');
        return;
    }

    const currentYear = new Date().getFullYear();
    const minutesMap = state?.calendar?.dailyMinutes || {};
    
    renderD3Calendar(container, currentYear, minutesMap);
}

/**
 * Update calendar colors - compatibility function
 */
export function updateCalendarColors() {
    const container = document.getElementById('calendar-view-content');
    if (!container) return;
    
    const minutesMap = state?.calendar?.dailyMinutes || {};
    updateD3CalendarColors(container, minutesMap);
}

/**
 * Render calendar with accurate data - compatibility function
 */
export function renderCalendarAccurate() {
    renderCalendar();
}

/**
 * Update calendar heatmap - compatibility function
 */
export function updateCalendarHeatmap() {
    renderCalendar();
}

/**
 * Sets up tooltip functionality for calendar days
 * @param {d3.Selection} dayRects - D3 selection of day rectangles
 * @param {Object} minutesMap - Map of date strings to minutes spent
 */
function setupTooltips(dayRects, minutesMap) {
    // Ensure tooltip element exists
    let tooltip = document.getElementById('tooltip');
    if (!tooltip) {
        tooltip = document.createElement('div');
        tooltip.id = 'tooltip';
        tooltip.style.cssText = `
            position: fixed;
            display: none;
            background-color: #333;
            color: #fff;
            padding: 5px 10px;
            border-radius: 6px;
            font-size: 12px;
            pointer-events: none;
            z-index: 100;
            font-family: Inter, sans-serif;
        `;
        document.body.appendChild(tooltip);
    }

    dayRects
        .on('mouseenter', function(event, d) {
            const dateKey = d3.timeFormat('%Y-%m-%d')(d);
            const minutes = minutesMap[dateKey] || 0;
            const problems = Math.ceil(minutes / 15);
            const date = new Date(d);
            
            tooltip.style.display = 'block';
            tooltip.textContent = `${problems} problems on ${date.toDateString()}`;
        })
        .on('mouseleave', function() {
            tooltip.style.display = 'none';
        })
        .on('mousemove', function(event) {
            const pad = 10;
            const vw = window.innerWidth;
            const tw = 200;
            let left = event.pageX + pad;
            
            if (left + tw > vw) {
                left = vw - tw - pad;
            }
            
            tooltip.style.left = `${left}px`;
            tooltip.style.top = `${event.pageY + pad}px`;
        });
}

/**
 * Placeholder for calendar auto-resize functionality
 */
export function enableCalendarAutoResize() {
    // Auto-resize functionality can be added here if needed
    console.log('Calendar auto-resize enabled');
}
