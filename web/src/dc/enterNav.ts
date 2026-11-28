/**
 * Enter moves to the next field, like the old software (Shift+Enter goes back).
 *
 * Works inside any element marked `data-entry` (every entry screen). Fields are visited in screen order;
 * read-only, disabled and hidden fields are skipped. After the last field the screen's save button
 * (`data-save`) gets the focus, so one more Enter saves. A dropdown that is open handles Enter itself
 * (it picks the highlighted row and then lets this move on); a field marked `data-enter="keep"` keeps
 * Enter for itself. In a text area Alt+Enter makes a new line.
 */
const FIELD =
  'input:not([type=hidden]):not([type=button]):not([type=submit]):not([type=reset]):not([type=file]):not([type=image]),select,textarea';

function usable(el: HTMLElement) {
  if ((el as HTMLInputElement).disabled) return false;
  if ((el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) && el.readOnly) return false;
  if (el.tabIndex < 0) return false;
  if (el.closest('[inert],[hidden],[aria-hidden="true"],[data-enter="skip"]')) return false;
  const r = el.getClientRects();
  if (!r.length) return false;
  const cs = getComputedStyle(el);
  return cs.visibility !== 'hidden' && cs.display !== 'none';
}

function focusField(el: HTMLElement) {
  el.focus();
  if (el instanceof HTMLInputElement && /^(text|search|tel|email|number|url|)$/.test(el.type)) {
    try {
      el.select();
    } catch {
      /* some types cannot be selected */
    }
  }
  el.scrollIntoView({ block: 'nearest', inline: 'nearest' });
}

/** the next (or previous) usable field after `from` inside its entry screen; null when there is none */
export function nextField(from: HTMLElement, back = false): HTMLElement | null {
  const root = from.closest('[data-entry]');
  if (!root) return null;
  const all = [...root.querySelectorAll<HTMLElement>(FIELD + ',[data-save]')];
  const i = all.indexOf(from);
  if (i < 0) return null;
  const step = back ? -1 : 1;
  for (let j = i + step; j >= 0 && j < all.length; j += step) {
    const el = all[j];
    if (el.hasAttribute('data-save')) {
      if (back) continue;
      if (!(el as HTMLButtonElement).disabled && el.getClientRects().length) return el;
      continue;
    }
    if (usable(el)) return el;
  }
  return null;
}

/** first usable field after a block (e.g. after an item table) */
function afterBlock(block: Element): HTMLElement | null {
  const root = block.closest('[data-entry]');
  if (!root) return null;
  const all = [...root.querySelectorAll<HTMLElement>(FIELD + ',[data-save]')];
  for (const el of all) {
    if (block.contains(el) || !(block.compareDocumentPosition(el) & Node.DOCUMENT_POSITION_FOLLOWING)) continue;
    if (el.hasAttribute('data-save') ? !(el as HTMLButtonElement).disabled && el.getClientRects().length : usable(el)) return el;
  }
  return null;
}

export function installEnterNav() {
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter' || e.defaultPrevented || e.isComposing || e.ctrlKey || e.metaKey) return;
    const t = e.target;
    if (!(t instanceof HTMLElement) || !t.matches(FIELD)) return;
    if (!t.closest('[data-entry]') || t.closest('[data-enter="keep"]')) return;
    if (t instanceof HTMLTextAreaElement && e.altKey) return; // new line
    if (e.altKey) return;
    // an empty new line of an item table: Enter leaves the table instead of walking through its blank cells
    const exit = !e.shiftKey && t.dataset.enterExit && !(t as HTMLInputElement).value?.trim() ? t.closest(t.dataset.enterExit) : null;
    const to = exit ? afterBlock(exit) : nextField(t, e.shiftKey);
    e.preventDefault();
    if (to) focusField(to);
  });
}
