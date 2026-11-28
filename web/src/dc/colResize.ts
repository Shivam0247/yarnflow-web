/**
 * Table columns like the old software's grids, for every data table on every screen:
 *  - columns start at their minimum width (as wide as their content, at most 360 px), not stretched across the page
 *  - drag the right edge of a column header to make it wider or narrower
 *  - double-click that edge: best fit (as wide as the widest value)
 *  - Ctrl / ⌘ + double-click that edge: back to automatic widths for the whole table
 *  - widths are remembered per screen and table (in this browser), like the old saved layouts
 *
 * A "data table" is a table with a header (thead) inside a screen (.app). A table, or anything around it,
 * marked data-noresize is left alone (print pages are not screens, so they are never touched).
 */
const MINW = 28; // narrowest a column can be dragged
const CAP = 360; // an automatic width stops here (very long text ends in "…"; drag the column wider to see more)
const EDGE = 6; // px either side of a header's right edge that grabs it
const KEY = 'yf-cols:';

const CSS = `
.app table.yf-grid{width:max-content!important;min-width:0!important;max-width:none!important}
.app table.yf-grid>thead>tr>th{white-space:nowrap}
.app th.yf-rz-near{cursor:col-resize!important;box-shadow:inset -2px 0 0 #3B82F6!important}
.app table.yf-grid.yf-sized{table-layout:fixed;width:var(--yf-w)!important}
.app table.yf-sized>*>tr>th,.app table.yf-sized>*>tr>td{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.app table.yf-sized>*>tr>td input,.app table.yf-sized>*>tr>td select,.app table.yf-sized>*>tr>td textarea{max-width:100%;min-width:0}
.app table.yf-sized>*>tr>td>span,.app table.yf-sized>*>tr>td .lkw{max-width:100%}
.app table.yf-sized>*>tr>td>div,.app table.yf-sized>*>tr>td>a,.app table.yf-sized>*>tr>th>button{max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.app table.yf-measure>*>tr>th,.app table.yf-measure>*>tr>td{white-space:nowrap!important}
.app table.yf-measure>*>tr>*>*{max-width:none!important;overflow:visible!important}
body.yf-rz-drag,body.yf-rz-drag *{cursor:col-resize!important;user-select:none!important;-webkit-user-select:none!important}
`;

const sized = new WeakSet<HTMLElement>(); // header cells whose width we set
const orig = new WeakMap<HTMLElement, [string, string, string]>(); // their own widths from the screen, put back on reset
const sigOf = new WeakMap<HTMLTableElement, string>();
const capOf = new WeakMap<HTMLTableElement, string>(); // columns + row count the automatic widths were worked out for
const userSized = new WeakSet<HTMLTableElement>(); // widths chosen by the user (dragged, best fit or remembered)

function hash(s: string) {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  return (h >>> 0).toString(36);
}

/** header cells that decide the column widths (the first header row), or null when it has merged cells */
function heads(t: HTMLTableElement): HTMLTableCellElement[] | null {
  const row = t.tHead?.rows[0];
  if (!row) return null;
  const cells = [...row.cells];
  if (!cells.length || cells.some((c) => c.colSpan > 1)) return null;
  return cells;
}

function isGrid(t: HTMLTableElement) {
  return !!t.tHead && !!t.closest('.app') && !t.closest('[data-noresize]');
}

function tables(): HTMLTableElement[] {
  return [...document.querySelectorAll<HTMLTableElement>('.app table')].filter(isGrid);
}

/** where this table's widths are kept: screen + table position + its column names */
function storeKey(t: HTMLTableElement, cells: HTMLTableCellElement[]) {
  const i = tables().indexOf(t);
  const names = cells.map((c) => (c.textContent || '').trim().slice(0, 16)).join('|');
  return KEY + location.pathname + ':' + i + ':' + hash(names);
}

function load(k: string): number[] | null {
  try {
    const v = JSON.parse(localStorage.getItem(k) || 'null');
    return Array.isArray(v) ? v : null;
  } catch {
    return null;
  }
}
function store(k: string, w: number[] | null) {
  try {
    if (w) localStorage.setItem(k, JSON.stringify(w.map((x) => Math.round(x))));
    else localStorage.removeItem(k);
  } catch {
    /* storage blocked: widths last for this visit only */
  }
}

function setW(th: HTMLElement, w: number) {
  const px = Math.max(MINW, Math.ceil(w - 0.01)) + 'px'; // never round down: text that just fits must not get "…"
  if (!orig.has(th)) orig.set(th, [th.style.width, th.style.minWidth, th.style.maxWidth]);
  th.style.width = px;
  th.style.minWidth = px;
  th.style.maxWidth = px;
  sized.add(th);
}

/** back to automatic (content) widths */
function unsize(t: HTMLTableElement) {
  t.classList.remove('yf-sized');
  t.style.removeProperty('--yf-w');
  for (const th of t.querySelectorAll<HTMLElement>('thead th')) {
    if (!sized.has(th)) continue;
    const o = orig.get(th) ?? ['', '', ''];
    [th.style.width, th.style.minWidth, th.style.maxWidth] = o;
    sized.delete(th);
  }
}

/** the table's width while its columns have fixed widths (beats the minimum-width rule) */
function tw(t: HTMLTableElement, px: number) {
  t.style.setProperty('--yf-w', Math.ceil(px) + 'px');
}

/** fixed widths for every column (current ones, or the given ones) so one column can change on its own */
function freeze(t: HTMLTableElement, cells: HTMLTableCellElement[], widths?: number[]) {
  const w = widths ?? cells.map((c) => c.getBoundingClientRect().width);
  cells.forEach((c, i) => setW(c, w[i]));
  tw(t, w.reduce((a, b) => a + Math.max(MINW, Math.ceil(b - 0.01)), 0));
  t.classList.add('yf-sized');
}

/** widest value in column i (best fit) */
function bestFit(t: HTMLTableElement, i: number) {
  const cells = heads(t);
  if (!cells) return 0;
  const was = t.classList.contains('yf-sized') ? cells.map((c) => c.getBoundingClientRect().width) : null;
  // measure with the column squeezed: each cell's scrollWidth is then its content width
  freeze(t, cells, was ?? undefined);
  t.classList.add('yf-measure');
  setW(cells[i], MINW);
  tw(t, cells.reduce((a, c) => a + c.getBoundingClientRect().width, 0));
  let max = cells[i].scrollWidth;
  const rows = [...t.rows].slice(0, 400);
  for (const r of rows) {
    const c = r.cells[i];
    if (c && c.colSpan === 1) max = Math.max(max, c.scrollWidth);
  }
  t.classList.remove('yf-measure');
  return max + 4;
}

let near: HTMLTableCellElement | null = null;
function setNear(th: HTMLTableCellElement | null) {
  if (near === th) return;
  near?.classList.remove('yf-rz-near');
  near = th;
  near?.classList.add('yf-rz-near');
}

/** the header cell whose right edge is under the pointer (also from just inside the next cell) */
function edgeAt(e: PointerEvent | MouseEvent): HTMLTableCellElement | null {
  const el = e.target instanceof Element ? e.target.closest('th') : null;
  if (!(el instanceof HTMLTableCellElement)) return null;
  const t = el.closest('table');
  if (!t || !isGrid(t)) return null;
  const cells = heads(t);
  if (!cells || !cells.includes(el)) return null;
  const r = el.getBoundingClientRect();
  if (r.right - e.clientX <= EDGE && r.right - e.clientX >= -2) return el;
  const i = cells.indexOf(el);
  if (i > 0 && e.clientX - r.left <= EDGE - 2) return cells[i - 1];
  return null;
}

/** a table wider than its holder gets a horizontal scrollbar there (like the old grids), never cut off */
function ensureScroll(t: HTMLTableElement) {
  const par = t.parentElement;
  if (!par || par.dataset.yfScroll) return;
  const ox = getComputedStyle(par).overflowX;
  if ((ox === 'visible' || ox === 'hidden' || ox === 'clip') && t.getBoundingClientRect().width > par.clientWidth + 1) {
    par.style.overflowX = 'auto';
    par.dataset.yfScroll = '1';
  }
}

let gen = 0; // moves on when fonts finish loading
/** cheap fingerprint of what the table shows: row count and the text length of the first rows */
function contentSig(t: HTMLTableElement) {
  const rows = t.tBodies[0]?.rows;
  if (!rows) return '0';
  let n = 0;
  for (let i = 0; i < Math.min(rows.length, 80); i++) n += (rows[i].textContent || '').length;
  return rows.length + ':' + n;
}

/** automatic widths: each column as wide as its content, at most CAP */
function autoWidths(t: HTMLTableElement, cells: HTMLTableCellElement[]) {
  unsize(t);
  const w = cells.map((c) => c.getBoundingClientRect().width);
  if (w.some((x) => x > CAP)) freeze(t, cells, w.map((x) => Math.min(x + 1, CAP)));
}

function scan() {
  for (const t of tables()) {
    t.classList.add('yf-grid');
    const cells = heads(t);
    if (cells) {
      const k = storeKey(t, cells);
      if (sigOf.get(t) !== k) {
        // new table or its columns changed (e.g. "More columns"): the widths saved for these columns, else automatic
        sigOf.set(t, k);
        userSized.delete(t);
        capOf.delete(t);
        unsize(t);
        const w = load(k);
        if (w && w.length === cells.length) { freeze(t, cells, w); userSized.add(t); }
      }
      if (!userSized.has(t)) {
        // automatic widths follow the data: worked out again when the rows or their text change (loaded,
        // filtered, details shown) and once the screen font has loaded (text is wider or narrower then)
        const ck = k + '#' + gen + ':' + contentSig(t);
        if (capOf.get(t) !== ck) { capOf.set(t, ck); autoWidths(t, cells); }
      }
    }
    ensureScroll(t);
  }
}

export function installColResize() {
  const st = document.createElement('style');
  st.textContent = CSS;
  document.head.appendChild(st);

  let queued = false;
  const later = () => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => {
      queued = false;
      scan();
    });
  };
  new MutationObserver(later).observe(document.body, { childList: true, subtree: true, characterData: true });
  try {
    document.fonts.addEventListener('loadingdone', () => { gen++; later(); });
    document.fonts.ready.then(() => { gen++; later(); });
  } catch {
    /* no font loading API */
  }
  window.addEventListener('popstate', later);
  later();

  let drag: { t: HTMLTableElement; th: HTMLTableCellElement; x: number; w: number; tw: number } | null = null;

  document.addEventListener('pointermove', (e) => {
    if (drag) {
      const w = Math.max(MINW, drag.w + e.clientX - drag.x);
      setW(drag.th, w);
      tw(drag.t, drag.tw - drag.w + w);
      return;
    }
    if (e.buttons) return;
    setNear(edgeAt(e));
  }, { passive: true });

  document.addEventListener('pointerdown', (e) => {
    if (e.button !== 0) return;
    const th = edgeAt(e);
    if (!th) return;
    const t = th.closest('table') as HTMLTableElement;
    const cells = heads(t)!;
    e.preventDefault();
    e.stopPropagation();
    if (!t.classList.contains('yf-sized')) freeze(t, cells);
    userSized.add(t);
    drag = { t, th, x: e.clientX, w: th.getBoundingClientRect().width, tw: t.getBoundingClientRect().width };
    document.body.classList.add('yf-rz-drag');
  }, true);

  const end = () => {
    if (!drag) return;
    const { t } = drag;
    drag = null;
    document.body.classList.remove('yf-rz-drag');
    const cells = heads(t);
    if (cells) store(storeKey(t, cells), cells.map((c) => c.getBoundingClientRect().width));
    ensureScroll(t);
    // the click that ends a drag must not sort or filter the column
    const stop = (ev: Event) => { ev.stopPropagation(); ev.preventDefault(); };
    document.addEventListener('click', stop, { capture: true, once: true });
    setTimeout(() => document.removeEventListener('click', stop, { capture: true }), 250);
  };
  document.addEventListener('pointerup', end, true);
  document.addEventListener('pointercancel', end, true);

  document.addEventListener('dblclick', (e) => {
    const th = edgeAt(e);
    if (!th) return;
    e.preventDefault();
    e.stopPropagation();
    const t = th.closest('table') as HTMLTableElement;
    const cells = heads(t)!;
    const k = storeKey(t, cells);
    if (e.ctrlKey || e.metaKey) {
      store(k, null);
      userSized.delete(t);
      capOf.delete(t);
      autoWidths(t, cells);
      return;
    }
    const i = cells.indexOf(th);
    const fit = bestFit(t, i);
    const w = cells.map((c) => c.getBoundingClientRect().width);
    w[i] = fit;
    freeze(t, cells, w);
    userSized.add(t);
    store(k, w);
    ensureScroll(t);
  }, true);
}
