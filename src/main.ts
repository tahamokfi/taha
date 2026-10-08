import { inject } from '@vercel/analytics';
import './style.css';

// Vercel Web Analytics: cookieless page views, only reported from the deployed site.
inject();

const root = document.documentElement;
root.classList.add('js');

// Light and dark mode. The inline script in index.html applies the theme before first paint;
// here the toggle flips it, remembers the choice, and follows the system until one is made.
type Theme = 'light' | 'dark';
const systemDark = matchMedia('(prefers-color-scheme: dark)');
const toggle = document.querySelector<HTMLButtonElement>('.theme-toggle');
const themeColor = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');

function storedTheme(): Theme | null {
  try {
    const value = localStorage.getItem('theme');
    return value === 'light' || value === 'dark' ? value : null;
  } catch {
    return null;
  }
}

function applyTheme(theme: Theme) {
  root.dataset.theme = theme;
  if (themeColor) themeColor.content = theme === 'dark' ? '#0a0d13' : '#f7f8fa';
  toggle?.setAttribute('aria-label', theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
}

applyTheme(storedTheme() ?? (systemDark.matches ? 'dark' : 'light'));
toggle?.addEventListener('click', () => {
  const next: Theme = root.dataset.theme === 'dark' ? 'light' : 'dark';
  applyTheme(next);
  try {
    localStorage.setItem('theme', next);
  } catch {
    // private mode or blocked storage: the switch still works for this visit
  }
});
systemDark.addEventListener('change', (e) => {
  if (!storedTheme()) applyTheme(e.matches ? 'dark' : 'light');
});

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
