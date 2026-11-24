/**
 * Renders a saved report design of the old software (DevExpress .repx, the layouts the team saved
 * under Creatives\DevExpressReports) over rows that carry the old field names. Bands, group headers
 * and footers, tables, labels, running sums and the old number / date formats are drawn as designed;
 * the page header repeats on every printed page.
 */
import type { CSSProperties, ReactNode } from 'react';

type Row = Record<string, unknown>;
const U = 0.96; // report units are 1/100 inch → px at 96 dpi

interface Ctl {
  type: string;
  attrs: Record<string, string>;
  expr: Record<string, string>;
  summary: string | null;
  children: Ctl[];
}
interface Band {
  type: string;
  attrs: Record<string, string>;
  level: number;
  height: number;
  visible: boolean;
  groupFields: { field: string; desc: boolean }[];
  sortFields: { field: string; desc: boolean }[];
  controls: Ctl[];
  subBands: Band[];
}
export interface Design {
  pageWidth: number;
  margins: [number, number, number, number];
  landscape: boolean;
  bands: Band[];
  styles: Record<string, Record<string, string>>;
}

const items = (el: Element | null | undefined) => (el ? Array.from(el.children).filter((c) => /^Item\d+$/.test(c.tagName)) : []);
const child = (el: Element, tag: string) => Array.from(el.children).find((c) => c.tagName === tag) ?? null;
const attrs = (el: Element) => Object.fromEntries(Array.from(el.attributes).map((a) => [a.name, a.value]));

function parseCtl(el: Element): Ctl {
  const expr: Record<string, string> = {};
  for (const b of items(child(el, 'ExpressionBindings'))) {
    if ((b.getAttribute('EventName') ?? 'BeforePrint') === 'BeforePrint') expr[b.getAttribute('PropertyName') ?? 'Text'] = b.getAttribute('Expression') ?? '';
  }
  const sum = child(el, 'Summary');
  const kids = [...items(child(el, 'Controls')), ...items(child(el, 'Rows')), ...items(child(el, 'Cells'))].map(parseCtl);
  return { type: el.getAttribute('ControlType') ?? '', attrs: attrs(el), expr, summary: sum?.getAttribute('Running') ?? null, children: kids };
}
const fields = (el: Element | null) => items(el).map((f) => ({ field: f.getAttribute('FieldName') ?? '', desc: f.getAttribute('SortOrder') === 'Descending' }));

function parseBand(el: Element): Band {
  return {
    type: el.getAttribute('ControlType') ?? '',
    attrs: attrs(el),
    level: Number(el.getAttribute('Level') ?? 0),
    height: Number(el.getAttribute('HeightF') ?? 0),
    visible: el.getAttribute('Visible') !== 'false',
    groupFields: fields(child(el, 'GroupFields')),
    sortFields: fields(child(el, 'SortFields')),
    controls: items(child(el, 'Controls')).map(parseCtl),
    subBands: items(child(el, 'SubBands')).map(parseBand)
  };
}

export function parseRepx(xml: string): Design {
  const doc = new DOMParser().parseFromString(xml.replace(/^﻿/, ''), 'application/xml');
  const root = doc.documentElement;
  const m = (root.getAttribute('Margins') ?? '100, 100, 100, 100').split(',').map((s) => Number(s.trim()));
  const styles: Design['styles'] = {};
  for (const s of items(child(root, 'StyleSheet'))) styles[s.getAttribute('Name') ?? ''] = attrs(s);
  return {
    pageWidth: Number(root.getAttribute('PageWidth') ?? 850),
    margins: [m[0], m[1], m[2], m[3]],
    landscape: root.getAttribute('Landscape') === 'true',
    bands: items(child(root, 'Bands')).map(parseBand),
    styles
  };
}

/* ------------------------------------------------------------------ formatting */
const pad = (n: number) => String(n).padStart(2, '0');
function asDate(v: unknown): Date | null {
  if (v instanceof Date) return v;
  const s = String(v ?? '');
  let m = /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2})(?::(\d{2}))?)?/.exec(s);
  if (m) return new Date(+m[1], +m[2] - 1, +m[3], +(m[4] ?? 0), +(m[5] ?? 0), +(m[6] ?? 0));
  m = /^(\d{2})-(\d{2})-(\d{4})$/.exec(s);
  if (m) return new Date(+m[3], +m[2] - 1, +m[1]);
  return null;
}
function fmtDate(d: Date, pat: string) {
  const h12 = d.getHours() % 12 || 12;
  const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return pat.replace(/yyyy|yy|MMM|MM|M|dd|d|HH|H|hh|h|mm|ss|tt/g, (t) => ({
    yyyy: String(d.getFullYear()), yy: String(d.getFullYear()).slice(2), MMM: MON[d.getMonth()], MM: pad(d.getMonth() + 1), M: String(d.getMonth() + 1),
    dd: pad(d.getDate()), d: String(d.getDate()), HH: pad(d.getHours()), H: String(d.getHours()), hh: pad(h12), h: String(h12),
    mm: pad(d.getMinutes()), ss: pad(d.getSeconds()), tt: d.getHours() < 12 ? 'AM' : 'PM'
  } as Record<string, string>)[t]);
}
const inr = (n: number, dec: number) => n.toLocaleString('en-IN', { minimumFractionDigits: dec, maximumFractionDigits: dec });

/** .NET composite format "{0:n2}", "Print On: {0:dd-MM-yyyy}", … */
export function netFormat(fmt: string | undefined, v: unknown): string {
  if (v == null || v === '') return fmt && !/\{0/.test(fmt) ? fmt : '';
  if (!fmt) {
    if (typeof v === 'number') return String(v);
    const d = /^\d{4}-\d{2}-\d{2}/.test(String(v)) ? asDate(v) : null;
    return d ? fmtDate(d, 'dd-MM-yyyy') : String(v);
  }
  return fmt.replace(/\{0(?::([^}]*))?\}/g, (_, spec?: string) => {
    if (!spec) return String(v);
    const num = Number(v);
    const ns = /^([nNfF])(\d*)$/.exec(spec);
    if (ns && !Number.isNaN(num)) {
      const dec = ns[2] === '' ? 2 : Number(ns[2]);
      return /[nN]/.test(ns[1]) ? inr(num, dec) : num.toFixed(dec);
    }
    if (/^[cC]\d*$/.test(spec) && !Number.isNaN(num)) return '₹' + inr(num, spec.length > 1 ? Number(spec.slice(1)) : 2);
    if (/^[#0,.]+$/.test(spec) && !Number.isNaN(num)) {
      const dec = (spec.split('.')[1] ?? '').length;
      return spec.includes(',') ? inr(num, dec) : num.toFixed(dec);
    }
    const d = asDate(v);
    if (d) {
      if (spec === 'd') return fmtDate(d, 'dd-MM-yyyy');
      if (spec === 'D') return fmtDate(d, 'dd MMM yyyy');
      if (spec === 'g' || spec === 'G') return fmtDate(d, 'dd-MM-yyyy HH:mm');
      return fmtDate(d, spec);
    }
    return String(v);
  });
}

/* ------------------------------------------------------------------ expressions */
interface Scope { row: Row | null; group: Row[]; report: Row[]; params: Record<string, unknown> }
function evalExpr(expr: string, s: Scope, summary: string | null): unknown {
  const e = expr.trim();
  let m = /^\[([^\]]+)\]$/.exec(e);
  if (m) return s.row?.[m[1]] ?? s.group[0]?.[m[1]] ?? s.report[0]?.[m[1]] ?? '';
  m = /^sum(Sum|Max|Min|Count|Avg|DCount)\(\[([^\]]+)\]\)$/i.exec(e);
  if (m) {
    const set = summary === 'Report' ? s.report : summary === 'Group' || summary === 'Page' ? s.group : s.row ? [s.row] : s.group;
    const vals = set.map((r) => r[m![2]]).filter((v) => v != null && v !== '');
    const nums = vals.map(Number).filter((x) => !Number.isNaN(x));
    switch (m[1].toLowerCase()) {
      case 'sum': return nums.reduce((a, b) => a + b, 0);
      case 'max': return nums.length ? Math.max(...nums) : '';
      case 'min': return nums.length ? Math.min(...nums) : '';
      case 'avg': return nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : '';
      case 'count': return vals.length;
      case 'dcount': return new Set(vals.map(String)).size;
    }
  }
  if (/^[A-Za-z_]\w*$/.test(e)) return s.params[e] ?? s.row?.[e] ?? '';
  m = /^'(.*)'$/.exec(e);
  if (m) return m[1];
  return '';
}

/* ------------------------------------------------------------------ styling */
function color(c?: string) {
  if (!c) return undefined;
  if (c === 'Transparent') return 'transparent';
  const p = c.split(',').map((x) => Number(x.trim()));
  if (p.length === 4 && p.every((x) => !Number.isNaN(x))) return `rgba(${p[1]},${p[2]},${p[3]},${p[0] / 255})`;
  if (p.length === 3 && p.every((x) => !Number.isNaN(x))) return `rgb(${p[0]},${p[1]},${p[2]})`;
  return c.toLowerCase();
}
function font(f?: string): CSSProperties {
  if (!f) return {};
  const [fam, size, ...rest] = f.split(',').map((s) => s.trim());
  const st = rest.join(',');
  const pt = parseFloat(size ?? '9');
  return {
    fontFamily: `'${fam}', ${fam === 'Calibri' ? 'Carlito, ' : ''}Arial, sans-serif`,
    fontSize: `${pt}pt`,
    fontWeight: /Bold/.test(st) ? 700 : 400,
    fontStyle: /Italic/.test(st) ? 'italic' : undefined,
    textDecoration: /Underline/.test(st) ? 'underline' : undefined
  };
}
function align(a?: string): CSSProperties {
  const v = a ?? 'TopLeft';
  const h = /Right/.test(v) ? 'flex-end' : /Center/.test(v) ? 'center' : 'flex-start';
  const vv = /^Middle/.test(v) ? 'center' : /^Bottom/.test(v) ? 'flex-end' : 'flex-start';
  return { display: 'flex', justifyContent: h, alignItems: vv, textAlign: /Right/.test(v) ? 'right' : /Center/.test(v) ? 'center' : /Justify/.test(v) ? 'justify' : 'left' };
}
function borders(b: string | undefined, w: number, c: string): CSSProperties {
  if (!b || b === 'None') return {};
  const all = b === 'All';
  const line = `${w}px solid ${c}`;
  const has = (k: string) => all || b.includes(k);
  return { borderLeft: has('Left') ? line : undefined, borderRight: has('Right') ? line : undefined, borderTop: has('Top') ? line : undefined, borderBottom: has('Bottom') ? line : undefined };
}
function padding(p?: string): CSSProperties {
  if (!p) return {};
  const [l, r, t, b, dpi] = p.split(',').map((x) => Number(x.trim()));
  const k = 96 / (dpi || 100);
  return { paddingLeft: l * k, paddingRight: r * k, paddingTop: t * k, paddingBottom: b * k };
}
const xy = (s?: string) => (s ?? '0,0').split(',').map((x) => Number(x.trim()) || 0);

type Inherit = Record<string, string>;
function boxStyle(a: Inherit): CSSProperties {
  return {
    ...font(a.Font),
    color: color(a.ForeColor),
    background: color(a.BackColor),
    ...borders(a.Borders, Number(a.BorderWidth ?? 1), color(a.BorderColor) ?? '#000'),
    ...padding(a.Padding),
    ...align(a.TextAlignment)
  };
}
const INHERITED = ['Font', 'ForeColor', 'Padding', 'TextAlignment', 'BorderColor', 'BorderWidth', 'Borders'];

/* ------------------------------------------------------------------ rendering */
function textOf(c: Ctl, s: Scope, now: Date) {
  if (c.type === 'XRPageInfo') {
    const fmt = c.attrs.TextFormatString;
    if (c.attrs.PageInfo === 'DateTime' || /\{0:[^}]*[dyMH]/.test(fmt ?? '')) return netFormat(fmt, now);
    return ''; // page numbers are printed in the page margin
  }
  if (c.expr.Text != null) return netFormat(c.attrs.TextFormatString, evalExpr(c.expr.Text, s, c.summary));
  return c.attrs.Text ?? '';
}

function Control({ c, s, inh, now, w, h }: { c: Ctl; s: Scope; inh: Inherit; now: Date; w?: number; h?: number }): ReactNode {
  if (c.attrs.Visible === 'false' || c.expr.Visible === 'false') return null;
  const own: Inherit = { ...inh, ...Object.fromEntries(Object.entries(c.attrs).filter(([k]) => INHERITED.includes(k) || k === 'BackColor')) };
  const [x, y] = xy(c.attrs.LocationFloat);
  const [sw, sh] = xy(c.attrs.SizeF);
  const flow = c.type === 'XRTable';
  const pos: CSSProperties = w != null ? { width: w, minHeight: h, flex: 'none' }
    : flow ? { position: 'relative', marginLeft: x * U, top: y * U, width: sw * U }
    : { position: 'absolute', left: x * U, top: y * U, width: sw * U, height: sh * U };
  const wrap = c.attrs.WordWrap === 'false' ? { whiteSpace: 'nowrap' as const } : { whiteSpace: 'pre-wrap' as const, overflowWrap: 'anywhere' as const };
  if (c.type === 'XRTable') {
    const rows = c.children;
    const tw = sw * U, th = sh * U;
    const rw = rows.reduce((a, r) => a + (Number(r.attrs.Weight) || 1), 0);
    const tInh: Inherit = { ...own };
    delete tInh.Borders; delete tInh.BackColor;
    return (
      <div style={{ ...pos, ...borders(c.attrs.Borders, Number(c.attrs.BorderWidth ?? 1), color(c.attrs.BorderColor) ?? '#000') }}>
        {rows.map((r, i) => {
          const rh = (th * (Number(r.attrs.Weight) || 1)) / rw;
          const cw = r.children.reduce((a, k) => a + (Number(k.attrs.Weight) || 1), 0);
          return (
            <div key={i} style={{ display: 'flex', minHeight: rh, alignItems: 'stretch' }}>
              {r.children.map((k, j) => <Control key={j} c={k} s={s} inh={{ ...tInh, ...Object.fromEntries(Object.entries(r.attrs).filter(([q]) => INHERITED.includes(q))) }} now={now} w={(tw * (Number(k.attrs.Weight) || 1)) / cw} h={rh} />)}
            </div>
          );
        })}
      </div>
    );
  }
  if (c.type === 'XRPictureBox' || c.type === 'XRLine' || c.type === 'XRBarCode' || c.type === 'XRChart') return null;
  const text = textOf(c, s, now);
  const cellInh = { ...own };
  if (c.type === 'XRTableCell' && !c.attrs.Borders) delete cellInh.Borders;
  return (
    <div style={{ ...pos, ...boxStyle(cellInh), boxSizing: 'border-box', overflow: 'hidden', ...wrap, lineHeight: 1.15 }}>
      <span style={{ maxWidth: '100%' }}>{text}</span>
    </div>
  );
}

function BandView({ b, s, styles, now }: { b: Band; s: Scope; styles: Design['styles']; now: Date }) {
  if (!b.visible) return null;
  const st = styles[b.attrs.StyleName] ?? {};
  const inh: Inherit = Object.fromEntries(Object.entries({ ...st, ...b.attrs }).filter(([k]) => INHERITED.includes(k) && k !== 'Borders'));
  const bg = color(b.attrs.BackColor ?? st.BackColor);
  return (
    <>
      {b.height > 0 && b.controls.length > 0 && (
        <div className="rx-band" style={{ position: 'relative', minHeight: b.height * U, background: bg === 'transparent' ? undefined : bg }}>
          {b.controls.map((c, i) => <Control key={i} c={c} s={s} inh={inh} now={now} />)}
        </div>
      )}
      {b.subBands.map((sb, i) => <BandView key={i} b={sb} s={s} styles={styles} now={now} />)}
    </>
  );
}

const cmp = (a: unknown, b: unknown) => {
  const na = Number(a), nb = Number(b);
  if (a !== '' && b !== '' && a != null && b != null && !Number.isNaN(na) && !Number.isNaN(nb)) return na - nb;
  return String(a ?? '').localeCompare(String(b ?? ''));
};

/** showDetail: the old report screen's Detail / Summary choice (overrides the band's saved visibility) */
export function RepxReport({ design, rows, params, showDetail }: { design: Design; rows: Row[]; params: Record<string, unknown>; showDetail?: boolean }) {
  const now = new Date();
  const B = design.bands;
  const pageHeader = B.filter((b) => b.type === 'PageHeaderBand');
  const reportHeader = B.filter((b) => b.type === 'ReportHeaderBand');
  const reportFooter = B.filter((b) => b.type === 'ReportFooterBand');
  const saved = B.find((b) => b.type === 'DetailBand');
  const detail = saved && showDetail != null ? { ...saved, visible: showDetail } : saved;
  // group headers: highest Level is the outermost group
  const heads = B.filter((b) => b.type === 'GroupHeaderBand').sort((a, b) => b.level - a.level);
  const foots = B.filter((b) => b.type === 'GroupFooterBand');
  const footOf = (lv: number) => foots.find((f) => f.level === lv);
  const keys = heads.map((h) => h.groupFields);
  const sorted = [...rows].sort((a, b) => {
    for (const gf of [...keys.flat(), ...(detail?.sortFields ?? [])]) {
      const c = cmp(a[gf.field], b[gf.field]);
      if (c) return gf.desc ? -c : c;
    }
    return 0;
  });
  const base: Scope = { row: null, group: sorted, report: sorted, params };
  const out: ReactNode[] = [];
  let k = 0;
  const walk = (set: Row[], depth: number) => {
    if (depth >= heads.length) {
      if (detail) for (const r of set) out.push(<BandView key={k++} b={detail} s={{ ...base, row: r, group: set }} styles={design.styles} now={now} />);
      return;
    }
    const h = heads[depth];
    const groups: Row[][] = [];
    for (const r of set) {
      const last = groups[groups.length - 1];
      if (last && h.groupFields.every((gf) => String(last[0][gf.field] ?? '') === String(r[gf.field] ?? ''))) last.push(r);
      else groups.push([r]);
    }
    for (const g of groups) {
      out.push(<BandView key={k++} b={h} s={{ ...base, row: g[0], group: g }} styles={design.styles} now={now} />);
      walk(g, depth + 1);
      const f = footOf(h.level);
      if (f) out.push(<BandView key={k++} b={f} s={{ ...base, row: g[g.length - 1], group: g }} styles={design.styles} now={now} />);
    }
  };
  walk(sorted, 0);
  const width = (design.pageWidth - design.margins[0] - design.margins[1]) * U;
  return (
    <table className="rx" style={{ width, borderCollapse: 'collapse' }}>
      <thead>
        <tr><td style={{ padding: 0 }}>{pageHeader.map((b, i) => <BandView key={i} b={b} s={{ ...base, row: sorted[0] ?? null }} styles={design.styles} now={now} />)}</td></tr>
      </thead>
      <tbody>
        <tr>
          <td style={{ padding: 0 }}>
            {reportHeader.map((b, i) => <BandView key={'rh' + i} b={b} s={base} styles={design.styles} now={now} />)}
            {out}
            {reportFooter.map((b, i) => <BandView key={'rf' + i} b={b} s={base} styles={design.styles} now={now} />)}
          </td>
        </tr>
      </tbody>
    </table>
  );
}
