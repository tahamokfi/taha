import './style.css';

const root = document.documentElement;
root.classList.add('js');

// Keep "now" current so ongoing roles always run to today.
const today = new Date();
const now = today.getFullYear() + today.getMonth() / 12 + (today.getDate() - 1) / 365;
const y0 = 2011;
const y1 = Math.max(2027, Math.ceil(now + 0.25));
root.style.setProperty('--now', now.toFixed(3));
root.style.setProperty('--y1', String(y1));

const copyright = document.querySelector('.foot span');
if (copyright) copyright.textContent = `© ${today.getFullYear()} Taha Mokfi`;

// Axis ticks every three years.
const ticks = document.getElementById('ticks');
if (ticks) {
  for (let year = y0; year < y1; year += 3) {
    const tick = document.createElement('span');
    tick.className = 'tick';
    tick.style.setProperty('--t', String(year));
    tick.textContent = String(year);
    ticks.append(tick);
  }
}

// One chapter open at a time. Hovering previews a row, a click or tap pins it.
const list = document.querySelector<HTMLElement>('.chapters');
const rows = Array.from(document.querySelectorAll<HTMLElement>('.chapters .row'));
let pinned: HTMLElement | null = null;
let hovered: HTMLElement | null = null;
let timer = 0;

function open(row: HTMLElement | null) {
  for (const r of rows) {
    const isOpen = r === row;
    r.classList.toggle('open', isOpen);
    r.querySelector('.row-head')?.setAttribute('aria-expanded', String(isOpen));
  }
  list?.classList.toggle('has-active', row !== null);
}

function later(fn: () => void, ms: number) {
  clearTimeout(timer);
  timer = window.setTimeout(fn, ms);
}

for (const row of rows) {
  row.querySelector('.row-head')?.addEventListener('click', () => {
    clearTimeout(timer);
    pinned = pinned === row ? null : row;
    open(pinned);
  });
}

// Track real pointer movement rather than enter events, so rows sliding under a
// still cursor while another row opens or closes never trigger a cascade.
list?.addEventListener('pointermove', (e) => {
  if (e.pointerType !== 'mouse') return;
  const row = (e.target as Element).closest<HTMLElement>('.row');
  if (!row || row === hovered) return;
  hovered = row;
  later(() => {
    if (hovered === row) open(row);
  }, 90);
});
list?.addEventListener('pointerleave', (e) => {
  if (e.pointerType !== 'mouse') return;
  hovered = null;
  later(() => open(pinned), 160);
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && pinned) {
    pinned = null;
    open(null);
  }
});
