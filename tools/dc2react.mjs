// Converts YarnFlow design (.dc.html) screens into React components, 1:1.
// usage: node dc2react.mjs <designDir> <outSrcDir>
import fs from 'node:fs';
import path from 'node:path';
import { parseDocument } from 'htmlparser2';

const [, , SRC, OUT] = process.argv;

// ---- which files become what -------------------------------------------------
const COMPONENTS = ['Sidebar', 'Assistant', 'VoucherList', 'VoucherEntry'];
const SKIP = new Set(['MainCreate', 'SalesOrderEntryPartySearch', 'EwayBillsGenerate', 'AssistantPanel', 'PurchaseOrderApproval', 'SalesOrderApproval', 'TopBar']);
export const ROUTES = {
  Login: '/login',
  Main: '/',
  Approvals: '/approvals',
  SalesOrderList: '/sales/orders',
  SalesOrderEntry: '/sales/orders/new',
  SalesOrderView: '/sales/orders/view',
  SalesOrder: '/sales/orders/record',
  DispatchScheduleList: '/sales/dispatch-schedules',
  DispatchScheduleEntry: '/sales/dispatch-schedules/new',
  DispatchScheduleView: '/sales/dispatch-schedules/view',
  SaleBillList: '/sales/bills',
  SaleBillSelect: '/sales/bills/new',
  Dispatch: '/sales/bills/entry',
  EwayBills: '/sales/eway-bills',
  SaleReturnList: '/sales/returns',
  SaleReturnEntry: '/sales/returns/new',
  SaleReturnView: '/sales/returns/view',
  GeneralSaleList: '/sales/general',
  GeneralSaleEntry: '/sales/general/new',
  GeneralSaleView: '/sales/general/view',
  PurchaseOrderList: '/purchase/orders',
  PurchaseOrderEntry: '/purchase/orders/new',
  PurchaseOrderView: '/purchase/orders/view',
  PurchaseOrder: '/purchase/orders/record',
  PurchaseBillList: '/purchase/bills',
  PurchaseBillSelect: '/purchase/bills/new',
  PurchaseBill: '/purchase/bills/entry',
  PurchaseReturnList: '/purchase/returns',
  PurchaseReturnEntry: '/purchase/returns/new',
  PurchaseReturnView: '/purchase/returns/view',
  GeneralPurchaseList: '/purchase/general',
  GeneralPurchaseEntry: '/purchase/general/new',
  GeneralPurchaseView: '/purchase/general/view',
  Payments: '/accounts/payments',
  DebitNoteList: '/accounts/debit-notes',
  DebitNoteEntry: '/accounts/debit-notes/new',
  DebitNoteView: '/accounts/debit-notes/view',
  CreditNoteList: '/accounts/credit-notes',
  CreditNoteEntry: '/accounts/credit-notes/new',
  CreditNoteView: '/accounts/credit-notes/view',
  Ledger: '/accounts/ledger',
  Outstanding: '/accounts/outstanding',
  Reports: '/reports',
  Stock: '/stock',
  Masters: '/masters',
  AccountMaster: '/masters/accounts',
  GroupMaster: '/masters/groups',
  YarnMaster: '/masters/yarn',
  TransporterMaster: '/masters/transporters'
};

// ---- helpers -------------------------------------------------------------------
const HOLE = /\{\{\s*([^}]+?)\s*\}\}/g;
const WHOLE = /^\s*\{\{\s*([^}]+?)\s*\}\}\s*$/;
const TABLEISH = new Set(['table', 'thead', 'tbody', 'tfoot', 'tr', 'colgroup', 'select', 'optgroup', 'svg', 'g', 'defs', 'linearGradient', 'radialGradient', 'clipPath', 'mask']);
const VOID = new Set(['input', 'img', 'br', 'hr', 'meta', 'link', 'col', 'area', 'source', 'wbr']);
const ATTR = {
  class: 'className', for: 'htmlFor', tabindex: 'tabIndex', readonly: 'readOnly', maxlength: 'maxLength',
  colspan: 'colSpan', rowspan: 'rowSpan', autocomplete: 'autoComplete', autofocus: 'autoFocus', spellcheck: 'spellCheck',
  contenteditable: 'contentEditable', inputmode: 'inputMode', enterkeyhint: 'enterKeyHint', 'xlink:href': 'xlinkHref',
  'xml:space': 'xmlSpace', srcset: 'srcSet', crossorigin: 'crossOrigin', novalidate: 'noValidate', datetime: 'dateTime',
  accesskey: 'accessKey', 'accept-charset': 'acceptCharset', 'http-equiv': 'httpEquiv', minlength: 'minLength'
};
const BOOL = new Set(['checked', 'disabled', 'readonly', 'selected', 'multiple', 'hidden', 'open', 'required', 'autofocus', 'novalidate']);
const INLINE = new Set(['span', 'a', 'b', 'i', 'em', 'strong', 'small', 'button', 'input', 'select', 'textarea', 'label', 'svg', 'img', 'kbd', 'code', 'sup', 'sub', 'u', 's', 'abbr', 'mark', 'time']);
const isInline = (n) => !!n && (n.type === 'text' || INLINE.has(n.name) || n.name === 'sc-if' || n.name === 'sc-for');
const camel = (s) => s.replace(/[-:]([a-z])/g, (_, c) => c.toUpperCase());

function attrName(n) {
  if (ATTR[n]) return ATTR[n];
  if (n.startsWith('aria-') || n.startsWith('data-')) return n;
  if (/^on[a-z]/.test(n)) return 'on' + n[2].toUpperCase() + n.slice(3);
  return n.includes('-') ? camel(n) : n;
}

function styleObj(s) {
  const o = {};
  for (const decl of s.split(';')) {
    const i = decl.indexOf(':');
    if (i < 0) continue;
    const k = decl.slice(0, i).trim();
    const val = decl.slice(i + 1).trim();
    if (!k) continue;
    o[k.startsWith('--') ? k : k.replace(/^-ms-/, 'ms-').replace(/-([a-z])/g, (_, c) => c.toUpperCase())] = val;
  }
  return JSON.stringify(o);
}

class Gen {
  constructor(name) { this.name = name; this.imports = new Set(); this.warn = []; }
  ref(p, scope) {
    p = p.trim();
    if (p === 'true' || p === 'false') return p;
    const parts = p.split('.');
    const head = scope.includes(parts[0]) ? parts[0] : 'v.' + parts[0];
    return head + parts.slice(1).map((x) => '?.' + x).join('');
  }
  tmpl(str, scope) {
    return '`' + str.replace(/[`\\]|\$\{/g, (m) => '\\' + m).replace(HOLE, (_, p) => '${' + this.ref(p, scope) + ' ?? ""}') + '`';
  }
  val(str, scope) {
    const m = WHOLE.exec(str);
    if (m) return '{' + this.ref(m[1], scope) + '}';
    if (HOLE.test(str)) { HOLE.lastIndex = 0; return '{' + this.tmpl(str, scope) + '}'; }
    return /["\\\n]/.test(str) ? '{' + JSON.stringify(str) + '}' : '"' + str + '"';
  }
  text(t, scope, parentTag, prev, next) {
    let s = t.data.replace(/[\t\n\r ]+/g, ' ');
    if (!s) return '';
    if (s === ' ') {
      // whitespace only matters between two inline neighbours (exactly like HTML)
      if (TABLEISH.has(parentTag) || !isInline(prev) || !isInline(next)) return '';
      return "{' '}";
    }
    if (!prev || !isInline(prev)) s = s.replace(/^ /, '');
    if (!next || !isInline(next)) s = s.replace(/ $/, '');
    if (!s) return '';
    const out = [];
    let last = 0;
    const lit = (x) => (/^[^{}<>"'&\s][^{}<>&]*[^{}<>&\s]$|^[^{}<>&\s]$/.test(x) ? x : '{' + JSON.stringify(x) + '}');
    s.replace(HOLE, (m, p, idx) => {
      if (idx > last) out.push(lit(s.slice(last, idx)));
      out.push('{' + this.ref(p, scope) + '}');
      last = idx + m.length;
    });
    if (last < s.length) out.push(lit(s.slice(last)));
    return out.join('');
  }
  kids(nodes, scope, parentTag, ind) {
    const real = nodes.filter((n) => n.type === 'text' || n.type === 'tag' || n.type === 'script' || n.type === 'style');
    return real.map((n, i) => n.type === 'text'
      ? ((t) => (t ? '  '.repeat(ind) + t : ''))(this.text(n, scope, parentTag, real[i - 1], real[i + 1]))
      : this.node(n, scope, parentTag, ind)).filter(Boolean).join('\n');
  }
  node(n, scope, parentTag, ind) {
    const pad = '  '.repeat(ind);
    if (n.type === 'text') { const t = this.text(n, scope, parentTag); return t ? pad + t : ''; }
    if (n.type !== 'tag' && n.type !== 'script' && n.type !== 'style') return '';
    const tag = n.name;
    const a = n.attribs || {};
    if (tag === 'helmet') return '';
    if (tag === 'sc-if') {
      const cond = this.ref(WHOLE.exec(a.value)[1], scope);
      return `${pad}{${cond} ? (\n${pad}  <>\n${this.kids(n.children, scope, parentTag, ind + 2)}\n${pad}  </>\n${pad}) : null}`;
    }
    if (tag === 'sc-for') {
      const list = this.ref(WHOLE.exec(a.list)[1], scope);
      const as = a.as;
      return `${pad}{(${list} || []).map((${as}, $index) => (\n${pad}  <Fragment key={$index}>\n${this.kids(n.children, [...scope, as, '$index'], parentTag, ind + 2)}\n${pad}  </Fragment>\n${pad}))}`;
    }
    if (tag === 'dc-import') {
      const comp = a.name;
      this.imports.add(comp);
      const props = Object.entries(a)
        .filter(([k]) => k !== 'name' && k !== 'theme' && !k.startsWith('hint'))
        .map(([k, val]) => `${camel(k)}=${this.val(val, scope)}`);
      return `${pad}<${comp}${props.length ? ' ' + props.join(' ') : ''} />`;
    }
    // regular element
    let outTag = tag;
    const props = [];
    const isA = tag === 'a' && a.href !== undefined;
    if (isA) { outTag = 'DcLink'; this.imports.add('$DcLink'); }
    const selectedDefault = tag === 'select' ? (n.children || []).find((c) => c.name === 'option' && c.attribs && 'selected' in c.attribs) : null;
    const hasHandler = Object.keys(a).some((k) => /^on(Change|Input)$/i.test(k));
    for (let [k, val] of Object.entries(a)) {
      if (k.startsWith('hint-') || k === 'xmlns') continue;
      if (tag === 'option' && k === 'selected') continue;
      let name = attrName(k);
      if (name === 'onInput') name = 'onChange';
      if (k === 'style') {
        if (HOLE.test(val)) { HOLE.lastIndex = 0; props.push(`style={sx(${WHOLE.exec(val) ? this.ref(WHOLE.exec(val)[1], scope) : this.tmpl(val, scope)})}`); this.imports.add('$sx'); }
        else props.push(`style={${styleObj(val)}}`);
        continue;
      }
      const dynamic = /\{\{/.test(val);
      if (!dynamic && (tag === 'input' || tag === 'textarea') && !hasHandler) {
        if (k === 'value') { props.push(`defaultValue=${JSON.stringify(val)}`); continue; }
        if (k === 'checked') { props.push('defaultChecked'); continue; }
      }
      if (!dynamic && BOOL.has(k) && (val === '' || val === k)) { props.push(name); continue; }
      props.push(`${name}=${this.val(val, scope)}`);
    }
    if (selectedDefault) {
      const sv = selectedDefault.attribs.value ?? (selectedDefault.children || []).map((c) => c.data || '').join('').trim();
      if (!('value' in a)) props.push(`defaultValue=${JSON.stringify(sv)}`);
    }
    let children = n.children || [];
    if (tag === 'textarea' && children.length) {
      const txt = children.map((c) => c.data || '').join('');
      if (!('value' in a) && txt.trim()) props.push(`defaultValue=${JSON.stringify(txt)}`);
      children = [];
    }
    if (tag === 'option' && !('value' in a)) {
      // keep value consistent with text for defaultValue matching
    }
    const open = `${pad}<${outTag}${props.length ? ' ' + props.join(' ') : ''}`;
    if (VOID.has(tag) || !children.length) return open + ' />';
    const inner = this.kids(children, scope, tag, ind + 1);
    if (!inner.trim()) return open + ' />';
    return `${open}>\n${inner}\n${pad}</${outTag}>`;
  }
}

function convert(file) {
  const name = path.basename(file, '.dc.html');
  const src = fs.readFileSync(file, 'utf8');
  const xs = src.indexOf('<x-dc>'), xe = src.indexOf('</x-dc>');
  const body = src.slice(xs + 6, xe);
  const scriptM = /<script type="text\/x-dc" data-dc-script data-props='([^']*)'>([\s\S]*?)<\/script>/.exec(src);
  const logic = scriptM ? scriptM[2].trim() : 'class Component extends DCLogic { renderVals() { return {}; } }';
  const doc = parseDocument(body, { lowerCaseTags: false, lowerCaseAttributeNames: false, recognizeSelfClosing: true, decodeEntities: true });
  // css from helmet
  let css = '';
  const findHelmet = (nodes) => nodes.forEach((n) => {
    if (n.name === 'helmet') n.children.forEach((c) => { if (c.name === 'style') css += c.children.map((t) => t.data).join('') + '\n'; });
    else if (n.children && n.type === 'tag') findHelmet(n.children);
  });
  findHelmet(doc.children);
  const g = new Gen(name);
  const jsx = g.kids(doc.children, [], 'root', 3);
  const isComp = COMPONENTS.includes(name);
  const imp = [];
  imp.push(`import { Fragment } from 'react';`);
  const rt = ['DCLogic', 'useTheme'];
  if (g.imports.has('$DcLink')) rt.push('DcLink');
  if (g.imports.has('$sx')) rt.push('sx');
  imp.push(`import { ${rt.join(', ')} } from '@/dc/runtime';`);
  for (const c of [...g.imports].filter((x) => !x.startsWith('$')).sort()) {
    imp.push(`import ${c} from '${COMPONENTS.includes(c) ? '@/components/' : '@/screens/'}${c}/${c}';`);
  }
  const out = `/* eslint-disable */
// ${name} — converted 1:1 from the YarnFlow design (${name}.dc.html).
// Markup, styles, sample data and behaviour are identical to the design.
${imp.join('\n')}

${css.trim() ? `import CSS from './${name}.css?raw';` : ''}

/* ----- screen logic (same as the design) ----- */
${logic}

/* ----- view ----- */
class ${name}View extends Component {
  render() {
    const v = this.renderVals() || {};
    return (
      <>
        ${css.trim() ? '<style>{CSS}</style>' : ''}
${jsx}
      </>
    );
  }
}

export default function ${name}(props) {
  const theme = useTheme();
  return <${name}View {...props} theme={theme} />;
}
`;
  const dir = isComp ? 'components' : 'screens';
  const d = path.join(OUT, dir, name);
  fs.mkdirSync(d, { recursive: true });
  fs.writeFileSync(path.join(d, name + '.jsx'), out);
  if (css.trim()) fs.writeFileSync(path.join(d, name + '.css'), '/* ' + name + ' styles — identical to the design. Injected only while this screen is mounted. */\n' + css.trim() + '\n');
  return { name, isComp, warn: g.warn };
}

const files = fs.readdirSync(SRC).filter((f) => f.endsWith('.dc.html') && !/Light\.dc\.html$/.test(f));
const done = [];
for (const f of files) {
  const name = f.replace('.dc.html', '');
  if (SKIP.has(name)) continue;
  done.push(convert(path.join(SRC, f)));
}
// routes
const pages = done.filter((d) => !d.isComp).map((d) => d.name);
const missing = pages.filter((p) => !ROUTES[p]);
if (missing.length) console.log('NO ROUTE for', missing);
const routes = `// Generated: one route per design screen.
import { lazy } from 'react';

export const ROUTES: Record<string, string> = ${JSON.stringify(ROUTES, null, 2)};

export const PAGES: { path: string; Component: React.LazyExoticComponent<React.ComponentType> }[] = [
${pages.filter((p) => ROUTES[p]).map((p) => `  { path: ROUTES.${p}, Component: lazy(() => import('@/screens/${p}/${p}')) }`).join(',\n')}
];
`;
fs.writeFileSync(path.join(OUT, 'app', 'routes.ts'), routes);
console.log('converted', done.length, 'files:', done.map((d) => d.name).join(' '));
