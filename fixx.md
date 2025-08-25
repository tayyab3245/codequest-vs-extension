Got it—let’s tighten this up. You’re seeing four things:

December label missing

Tooltip feels dead

Weekday labeling looks off / uncertainty about week start

Duplicate section titles + legend stretching too wide

Below are drop‑in patches that fix all four without changing your look/feel.

A) December label + better month labels

Your month labels stop at November because the data range ends at new Date(year, 11, 1). Make it inclusive through year‑end.

Replace the “Month labels” block inside renderD3Calendar with:

// Month labels (now includes December)
g.selectAll('.month')
  .data(d3.timeMonths(new Date(year, 0, 1), new Date(year + 1, 0, 1)))
  .enter().append('text')
    .attr('class', 'month')
    .attr('x', d => d3.timeWeek.count(d3.timeYear(d), d3.timeMonth.ceil(d)) * cell)
    .attr('y', -6)
    .style('font-size', '10px')
    .style('fill', '#888')
    .text(d => formatMonth(d));


(Everything else in renderD3Calendar can stay as you pasted.)

B) Tooltips that always work (even with zero minutes)

Right now the code assumes a #tooltip node exists. Ensure it does, and it’ll show “0 problems …” when there’s no data.

Inside buildCalendar() (right after you set mount.innerHTML = \…`;`), add:

// Ensure tooltip element exists once
if (!document.getElementById('tooltip')) {
  const tip = document.createElement('div');
  tip.id = 'tooltip';
  document.body.appendChild(tip);
}


Tooltips will now show on hover because renderD3Calendar already sets the events and reads state.calendar.dailyMinutes[key] (0 displays “0 problems …”).

C) Weekday orientation (Sunday‑first vs Monday‑first)

GitHub’s heatmap is Sunday → Saturday vertically. Your current code does that correctly:

rows: y = d.getDay() * cell // 0=Sun … 6=Sat

labels: you display Mon / Wed / Fri at indices [1,3,5] (that’s fine)

If you prefer a Monday‑first calendar, use the following optional tweak:

At the top of renderD3Calendar, add:

const WEEK_START = 'sunday'; // change to 'monday' to switch


Then change rect positioning to:

const weekCount = WEEK_START === 'monday' ? d3.timeMonday.count : d3.timeWeek.count;
const timeYear = d3.timeYear;
const dayOfWeek = d => (WEEK_START === 'monday' ? (d.getDay() + 6) % 7 : d.getDay());

const rect = g.append('g')
  .selectAll('rect')
  .data(days)
  .enter().append('rect')
    .attr('width', cell - 1)
    .attr('height', cell - 1)
    .attr('x', d => weekCount(timeYear(d), d) * cell)
    .attr('y', d => dayOfWeek(d) * cell)
    .attr('rx', 2)
    .attr('fill', '#2d2d2d')
    .attr('stroke', '#121212')
    .attr('stroke-width', 0.5)
    .attr('data-key', d => formatKey(d));


And change weekday labels to match:

const weekdaysSun = ['S','M','T','W','T','F','S'];
const weekdaysMon = ['M','T','W','T','F','S','S'];
const labels = WEEK_START === 'monday' ? weekdaysMon : weekdaysSun;
const labelRows = WEEK_START === 'monday' ? [1,3,5] : [1,3,5]; // still Mon/Wed/Fri visually

g.selectAll('.weekday')
  .data(labelRows)
  .enter().append('text')
    .attr('class','weekday')
    .attr('x', -8)
    .attr('y', d => d * cell + cell * 0.72)
    .style('text-anchor','end')
    .style('font-size','10px')
    .style('fill','#888')
    .text(d => labels[d]);


Month outline math can stay as-is (it’s week‑based, not sensitive to the row shift).

D) Legend compact on the right + remove duplicate headings
1) Compact legend to the right

CSS – replace your .calendar-legend block with:

.calendar-legend {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.75rem;
  color: #9ca3af;
  border-top: 1px solid #374151;
  padding: 0.5rem 1rem;
  margin-left: auto;        /* push legend to the right */
  width: fit-content;       /* no stretch */
}

.calendar-legend .legend-colors {
  display: flex;
  align-items: center;
  gap: 4px;
}

.calendar-legend .legend-color {
  width: 10px;
  height: 10px;
  border-radius: 2px;
}


That makes the legend a tight capsule aligned right, not spanning the whole width.

2) Kill duplicate “Daily Activity” title

You mentioned there’s a “Daily Activity” at the section level and inside the calendar component. Easiest fix: hide the inner one and keep the section title you like.

In buildCalendar() change the header HTML to drop the <h3> entirely:

mount.innerHTML = `
  <div class="calendar-container">
    <div class="calendar-header">
      <div></div> <!-- spacer where the old h3 was -->
      <select id="yearSelector" class="year-dropdown">
        <option value="${currentYear - 1}">${currentYear - 1}</option>
        <option value="${currentYear}" selected>${currentYear}</option>
        <option value="${currentYear + 1}">${currentYear + 1}</option>
      </select>
    </div>
    <div class="calendar-svg-container">
      <div id="calendarSvgContainer"></div>
    </div>
    <div class="calendar-legend">
      <span>Less</span>
      <div class="legend-colors">
        <div class="legend-color" style="background-color:#2d2d2d;"></div>
        <div class="legend-color" style="background-color:#0e4429;"></div>
        <div class="legend-color" style="background-color:#006d32;"></div>
        <div class="legend-color" style="background-color:#26a641;"></div>
        <div class="legend-color" style="background-color:#39d353;"></div>
      </div>
      <span>More</span>
    </div>
  </div>
`;


(If you do want a title inside the component, add a flag and only render it when the outer page doesn’t show one.)

E) Sanity checks you’ll see right away

December label shows at the far right.

Hovering any cell shows a tooltip (even with “0 problems …”).

Legend is a compact pill on the right; no more full‑width stretching.

Only one “Daily Activity” heading remains.

Weekday strips are Mon/Wed/Fri by default (and you can flip to Monday‑first if you want with WEEK_START).

If anything still feels off after pasting these, tell me exactly which file/line you pasted into and what you see—I’ll adjust the diff to match your layout.