/* eslint-disable */
// Sidebar — converted 1:1 from the YarnFlow design (Sidebar.dc.html).
// Markup, styles, sample data and behaviour are identical to the design.
import { Fragment } from 'react';
import { DCLogic, useTheme, DcLink, sx } from '@/dc/runtime';

import CSS from './Sidebar.css?raw';

/* ----- screen logic (same as the design) ----- */
class Component extends DCLogic {
  constructor(p) { super(p); this.state = { open: null, col: null }; }
  componentDidMount() { const rd = () => { try { const v = window.localStorage.getItem('yf-sb-col'); const c = v === '1'; if (c !== this.state.col) this.setState({ col: c }); } catch (e) {} }; this._rd = rd; rd(); try { window.addEventListener('storage', rd); window.addEventListener('focus', rd); } catch (e) {} }
  componentWillUnmount() { try { window.removeEventListener('storage', this._rd); window.removeEventListener('focus', this._rd); } catch (e) {} }
  setCol(c, openGroup) { try { window.localStorage.setItem('yf-sb-col', c ? '1' : '0'); } catch (e) {} const st = { col: c }; if (openGroup) st.open = [openGroup]; this.setState(st); }
  renderVals() {
    const active = ({ soe: 'so', soa: 'so', poe: 'po', poa: 'po' })[this.props.active] || (this.props.active ?? 'dash');
    const sfx = (this.props.theme ?? 'dark') === 'light' ? 'Light' : '';
    const L = (f) => (f === '#' ? '#' : f + sfx + '.dc.html');
    const top = 'display: flex; align-items: center; gap: 10px; height: 36px; padding: 0 10px; border-radius: 8px; font-size: 14px; color: var(--t1, #EDEDED); text-decoration: none;';
    const on = ' background: var(--s3, #2C2C2C); font-weight: 500;';
    const sub = 'display: flex; align-items: center; gap: 8px; height: 30px; padding: 0 8px; border-radius: 7px; font-size: 13px; color: var(--t2, #B5B5B5); text-decoration: none;';
    const subOn = ' background: var(--s3, #2C2C2C); color: var(--t1, #EDEDED); font-weight: 500;';
    const G = {
      sales: [['Sales order register', 'SalesOrderList', 'Ctrl F4', 'so'], ['Dispatch schedule', 'DispatchScheduleList', 'Ctrl F8', 'ds'], ['Sale bills', 'SaleBillList', '', 'disp'], ['E-way bills', 'EwayBills', '', 'ewb'], ['Sale returns', 'SaleReturnList', 'Ctrl ⇧ F8', 'sr'], ['General sale', 'GeneralSaleList', '⇧ F8', 'gs']],
      pur: [['Purchase order register', 'PurchaseOrderList', 'Ctrl F5', 'po'], ['Purchase bills', 'PurchaseBillList', '', 'pb'], ['Purchase returns', 'PurchaseReturnList', 'Ctrl ⇧ F9', 'pr'], ['General purchase', 'GeneralPurchaseList', '⇧ F9', 'gp'], ['Import bills · Excel', 'PurchaseBill', '', '']],
      bank: [['Bank receipt / payment', 'Payments', 'F6 · F7', 'pay'], ['Cash receipt / payment', 'Payments', '⇧ F6 · ⇧ F7', ''], ['On-account entries', 'Payments', '', ''], ['Bank reconciliation', 'Payments', '', ''], ['Cheque book inward', 'Payments', '', ''], ['Payment follow-up', 'Outstanding', '', '']],
      jv: [['Debit note', 'Payments', 'Ctrl D', ''], ['Credit note', 'Payments', 'Ctrl E', ''], ['Journal voucher', 'Payments', 'Ctrl J', ''], ['Interest debit notes', 'Outstanding', '', ''], ['Opening entries', 'Ledger', '', '']],
      acc: [['Ledgers', 'Ledger', '', 'led'], ['Outstanding & ageing', 'Outstanding', '', 'out'], ['Bill adjustment', 'Payments', '', ''], ['Pending bill adjustment', 'Outstanding', '', ''], ['Opening balances', 'Ledger', '', '']],
      inv: [['Stock & godowns', 'Stock', '', 'stock'], ['Stock ledger', 'Stock', '', ''], ['Godown transfer', 'Stock', '', ''], ['Lot & grade changes', 'Stock', '', '']],
      rep: [['Account reports', 'Reports', '', 'rep'], ['Inventory reports', 'Reports', '', ''], ['GST & e-invoice', 'Reports', '', ''], ['E-way bill closure', 'Reports', '', '']]
    };
    const owner = {};
    Object.keys(G).forEach((g) => G[g].forEach((it) => { if (it[3]) owner[it[3]] = g; }));
    const masterKeys = ['mast', 'acc', 'grp', 'yarn', 'trn'];
    const openSet = this.state.open ?? (owner[active] ? [owner[active]] : []);
    const g = {};
    Object.keys(G).forEach((k) => {
      const isOpen = openSet.indexOf(k) >= 0;
      const hasActive = owner[active] === k;
      g[k] = {
        o: isOpen,
        s: top + ' width: 100%; border: 0; background: transparent; cursor: pointer; text-align: left; font-family: inherit;' + (hasActive && !isOpen ? on : ''),
        c: 'flex: none; color: var(--t3, #8F8F8F); transition: transform .15s;' + (isOpen ? ' transform: rotate(90deg);' : ''),
        t: () => { const cur = openSet.slice(); const i = cur.indexOf(k); if (i >= 0) cur.splice(i, 1); else cur.push(k); this.setState({ open: cur }); },
        items: G[k].map((it) => ({ l: it[0], h: L(it[1]), k: '', s: sub + (it[3] && it[3] === active ? subOn : '') }))
      };
    });
    const n = {
      dash: top + (active === 'dash' ? on : ''), appr: top + (active === 'appr' ? on : ''),
      mast: top + (masterKeys.indexOf(active) >= 0 ? on : ''), set: top, help: top
    };
    const h = { dash: L('Main'), appr: L('Approvals'), mast: L('Masters') };
    const col = !!this.state.col;
    const cb = 'width: 40px; height: 40px; display: grid; place-items: center; border-radius: 10px; border: 0; padding: 0; background: transparent; color: var(--t2, #B5B5B5); cursor: pointer; text-decoration: none;';
    const cOn = ' background: var(--s3, #2C2C2C); color: var(--t1, #EDEDED);';
    const c = { btn: cb, dash: cb + (active === 'dash' ? cOn : ''), mast: cb + (masterKeys.indexOf(active) >= 0 ? cOn : '') };
    ['sales', 'pur', 'bank', 'jv', 'acc', 'inv', 'rep'].forEach((k) => { c[k] = cb + (owner[active] === k ? cOn : ''); c[k + 'Go'] = () => this.setCol(false, k); });
    return { g, n, h, c, col, exp: !col, collapse: () => this.setCol(true), expand: () => this.setCol(false) };
  }
}

/* ----- view ----- */
class SidebarView extends Component {
  render() {
    const v = this.renderVals() || {};
    return (
      <>
        <style>{CSS}</style>
      {v.col ? (
        <>
          <nav className="sbc" aria-label="Main (collapsed)" style={{"width":"100%","minHeight":"100%","boxSizing":"border-box","background":"var(--sb, #1B1B1B)","color":"var(--t1, #EDEDED)","padding":"10px 0 12px","display":"flex","flexDirection":"column","alignItems":"center","gap":"4px","fontFamily":"Inter, system-ui, sans-serif"}}>
            <button type="button" onClick={v.expand} title="Expand menu" aria-label="Expand menu" style={{"width":"40px","height":"40px","border":"0","padding":"0","borderRadius":"10px","background":"linear-gradient(135deg, #F59E0B, #EA580C)","display":"grid","placeItems":"center","cursor":"pointer","marginBottom":"10px"}}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                <circle cx="12" cy="12" r="9" />
                <path d="M5.5 6.5c4.5.5 9 4.5 10.5 12" />
                <path d="M3.4 10.5c4 0 7.8 3.2 8.8 10" />
                <path d="M9.5 3.3c3.5 2 6.6 6 7.6 11.6" />
              </svg>
            </button>
            {' '}
            <DcLink href={v.h?.dash} title="Dashboard" aria-label="Dashboard" style={sx(v.c?.dash)}>
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect width="7" height="9" x="3" y="3" rx="1" />
                <rect width="7" height="5" x="14" y="3" rx="1" />
                <rect width="7" height="9" x="14" y="12" rx="1" />
                <rect width="7" height="5" x="3" y="16" rx="1" />
              </svg>
            </DcLink>
            {' '}
            <span style={{"width":"24px","height":"1px","background":"var(--bd2, #383838)","margin":"6px 0"}} />
            {' '}
            <button type="button" onClick={v.c?.salesGo} title="Sales" aria-label="Sales" style={sx(v.c?.sales)}>
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="8" cy="21" r="1" />
                <circle cx="19" cy="21" r="1" />
                <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
              </svg>
            </button>
            {' '}
            <button type="button" onClick={v.c?.purGo} title="Purchase" aria-label="Purchase" style={sx(v.c?.pur)}>
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M2 20a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8l-7 5V8l-7 5V4a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z" />
              </svg>
            </button>
            {' '}
            <button type="button" onClick={v.c?.bankGo} title="Bank & Cash" aria-label="Bank & Cash" style={sx(v.c?.bank)}>
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M3 21h18" />
                <path d="M3 10h18" />
                <path d="m12 3 9 7H3Z" />
                <path d="M6 10v8" />
                <path d="M10 10v8" />
                <path d="M14 10v8" />
                <path d="M18 10v8" />
              </svg>
            </button>
            {' '}
            <button type="button" onClick={v.c?.jvGo} title="Journal & Notes" aria-label="Journal & Notes" style={sx(v.c?.jv)}>
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
                <path d="M14 2v4a2 2 0 0 0 2 2h4" />
                <path d="M9 15h6" />
                <path d="M12 12v6" />
              </svg>
            </button>
            {' '}
            <span style={{"width":"24px","height":"1px","background":"var(--bd2, #383838)","margin":"6px 0"}} />
            {' '}
            <button type="button" onClick={v.c?.accGo} title="Accounts" aria-label="Accounts" style={sx(v.c?.acc)}>
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
              </svg>
            </button>
            {' '}
            <button type="button" onClick={v.c?.invGo} title="Inventory" aria-label="Inventory" style={sx(v.c?.inv)}>
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="m7.5 4.27 9 5.15" />
                <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
                <path d="m3.3 7 8.7 5 8.7-5" />
                <path d="M12 22V12" />
              </svg>
            </button>
            {' '}
            <button type="button" onClick={v.c?.repGo} title="Reports & GST" aria-label="Reports & GST" style={sx(v.c?.rep)}>
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M3 3v18h18" />
                <path d="M18 17V9" />
                <path d="M13 17V5" />
                <path d="M8 17v-3" />
              </svg>
            </button>
            {' '}
            <DcLink href={v.h?.mast} title="Masters" aria-label="Masters" style={sx(v.c?.mast)}>
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect width="7" height="7" x="3" y="3" rx="1" />
                <rect width="7" height="7" x="14" y="3" rx="1" />
                <rect width="7" height="7" x="14" y="14" rx="1" />
                <rect width="7" height="7" x="3" y="14" rx="1" />
              </svg>
            </DcLink>
            <div style={{"flex":"1","minHeight":"20px"}} />
            <button type="button" onClick={v.expand} title="Expand menu" aria-label="Expand menu" style={sx(v.c?.btn)}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" aria-hidden="true">
                <path d="M21 19V5" />
                <path d="m11 6 6 6-6 6" />
                <path d="M17 12H3" />
              </svg>
            </button>
          </nav>
        </>
      ) : null}
      {' '}
      {v.exp ? (
        <>
          <nav aria-label="Main" style={{"width":"100%","minHeight":"100%","boxSizing":"border-box","background":"var(--sb, #1B1B1B)","color":"var(--t1, #EDEDED)","padding":"10px 10px 12px","display":"flex","flexDirection":"column","gap":"2px","fontFamily":"Inter, system-ui, sans-serif","fontSize":"14px","lineHeight":"20px"}}>
            <button type="button" style={{"display":"flex","alignItems":"center","gap":"10px","width":"100%","padding":"6px","borderRadius":"10px","background":"transparent","border":"0","cursor":"pointer","textAlign":"left","font":"inherit","color":"inherit","marginBottom":"6px"}}>
              <span style={{"width":"36px","height":"36px","borderRadius":"9px","background":"linear-gradient(135deg, #F59E0B, #EA580C)","display":"grid","placeItems":"center","flex":"none"}}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                  <circle cx="12" cy="12" r="9" />
                  <path d="M5.5 6.5c4.5.5 9 4.5 10.5 12" />
                  <path d="M3.4 10.5c4 0 7.8 3.2 8.8 10" />
                  <path d="M9.5 3.3c3.5 2 6.6 6 7.6 11.6" />
                </svg>
              </span>
              {' '}
              <span style={{"flex":"1","minWidth":"0"}}>
                <span style={{"display":"block","fontSize":"15px","fontWeight":"600"}}>
                  Shree Umiya Yarn
                </span>
                <span style={{"display":"block","fontSize":"12px","color":"var(--t2, #B5B5B5)"}}>
                  Avi Patel · FY 26-27
                </span>
              </span>
              {' '}
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true" style={{"color":"var(--t3, #8F8F8F)"}}>
                <path d="m7 15 5 5 5-5" />
                <path d="m7 9 5-5 5 5" />
              </svg>
            </button>
            {' '}
            <label style={{"display":"flex","alignItems":"center","gap":"8px","height":"34px","padding":"0 10px","borderRadius":"8px","background":"var(--s2, #262626)","color":"var(--t3, #8F8F8F)","marginBottom":"8px"}}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" aria-hidden="true">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.3-4.3" />
              </svg>
              {' '}
              <input type="search" aria-label="Search menus and records" placeholder="Search menu or record" style={{"flex":"1","minWidth":"0","border":"0","outline":"0","background":"transparent","font":"inherit","fontSize":"13px","color":"var(--t1, #EDEDED)"}} />
            </label>
            {' '}
            <DcLink href={v.h?.dash} style={sx(v.n?.dash)}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{"flex":"none","color":"var(--t2, #B5B5B5)"}}>
                <rect width="7" height="9" x="3" y="3" rx="1" />
                <rect width="7" height="5" x="14" y="3" rx="1" />
                <rect width="7" height="9" x="14" y="12" rx="1" />
                <rect width="7" height="5" x="3" y="16" rx="1" />
              </svg>
              Dashboard
            </DcLink>
            <div style={{"fontSize":"11px","fontWeight":"600","letterSpacing":".06em","color":"var(--t3, #8F8F8F)","padding":"14px 10px 4px"}}>
              TRANSACTIONS
            </div>
            <button type="button" style={sx(v.g?.sales?.s)} onClick={v.g?.sales?.t} aria-expanded={v.g?.sales?.o}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{"flex":"none","color":"var(--t2, #B5B5B5)"}}>
                <circle cx="8" cy="21" r="1" />
                <circle cx="19" cy="21" r="1" />
                <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
              </svg>
              <span style={{"flex":"1"}}>
                Sales
              </span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" aria-hidden="true" style={sx(v.g?.sales?.c)}>
                <path d="m9 18 6-6-6-6" />
              </svg>
            </button>
            {' '}
            {v.g?.sales?.o ? (
              <>
                <div style={{"margin":"2px 0 6px 18px","paddingLeft":"10px","borderLeft":"1px solid var(--bd2, #383838)","display":"flex","flexDirection":"column","gap":"1px"}}>
                  {(v.g?.sales?.items || []).map((x, $index) => (
                    <Fragment key={$index}>
                      <DcLink href={x?.h} style={sx(x?.s)}>
                        <span style={{"flex":"1"}}>
                          {x?.l}
                        </span>
                        <span style={{"fontSize":"11px","color":"var(--t3, #8F8F8F)"}}>
                          {x?.k}
                        </span>
                      </DcLink>
                    </Fragment>
                  ))}
                </div>
              </>
            ) : null}
            {' '}
            <button type="button" style={sx(v.g?.pur?.s)} onClick={v.g?.pur?.t} aria-expanded={v.g?.pur?.o}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{"flex":"none","color":"var(--t2, #B5B5B5)"}}>
                <path d="M2 20a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8l-7 5V8l-7 5V4a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z" />
              </svg>
              <span style={{"flex":"1"}}>
                Purchase
              </span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" aria-hidden="true" style={sx(v.g?.pur?.c)}>
                <path d="m9 18 6-6-6-6" />
              </svg>
            </button>
            {' '}
            {v.g?.pur?.o ? (
              <>
                <div style={{"margin":"2px 0 6px 18px","paddingLeft":"10px","borderLeft":"1px solid var(--bd2, #383838)","display":"flex","flexDirection":"column","gap":"1px"}}>
                  {(v.g?.pur?.items || []).map((x, $index) => (
                    <Fragment key={$index}>
                      <DcLink href={x?.h} style={sx(x?.s)}>
                        <span style={{"flex":"1"}}>
                          {x?.l}
                        </span>
                        <span style={{"fontSize":"11px","color":"var(--t3, #8F8F8F)"}}>
                          {x?.k}
                        </span>
                      </DcLink>
                    </Fragment>
                  ))}
                </div>
              </>
            ) : null}
            {' '}
            <button type="button" style={sx(v.g?.bank?.s)} onClick={v.g?.bank?.t} aria-expanded={v.g?.bank?.o}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{"flex":"none","color":"var(--t2, #B5B5B5)"}}>
                <path d="M3 21h18" />
                <path d="M3 10h18" />
                <path d="m12 3 9 7H3Z" />
                <path d="M6 10v8" />
                <path d="M10 10v8" />
                <path d="M14 10v8" />
                <path d="M18 10v8" />
              </svg>
              <span style={{"flex":"1"}}>
                {"Bank & Cash"}
              </span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" aria-hidden="true" style={sx(v.g?.bank?.c)}>
                <path d="m9 18 6-6-6-6" />
              </svg>
            </button>
            {' '}
            {v.g?.bank?.o ? (
              <>
                <div style={{"margin":"2px 0 6px 18px","paddingLeft":"10px","borderLeft":"1px solid var(--bd2, #383838)","display":"flex","flexDirection":"column","gap":"1px"}}>
                  {(v.g?.bank?.items || []).map((x, $index) => (
                    <Fragment key={$index}>
                      <DcLink href={x?.h} style={sx(x?.s)}>
                        <span style={{"flex":"1"}}>
                          {x?.l}
                        </span>
                        <span style={{"fontSize":"11px","color":"var(--t3, #8F8F8F)"}}>
                          {x?.k}
                        </span>
                      </DcLink>
                    </Fragment>
                  ))}
                </div>
              </>
            ) : null}
            {' '}
            <button type="button" style={sx(v.g?.jv?.s)} onClick={v.g?.jv?.t} aria-expanded={v.g?.jv?.o}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{"flex":"none","color":"var(--t2, #B5B5B5)"}}>
                <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
                <path d="M14 2v4a2 2 0 0 0 2 2h4" />
                <path d="M9 15h6" />
                <path d="M12 12v6" />
              </svg>
              <span style={{"flex":"1"}}>
                {"Journal & Notes"}
              </span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" aria-hidden="true" style={sx(v.g?.jv?.c)}>
                <path d="m9 18 6-6-6-6" />
              </svg>
            </button>
            {' '}
            {v.g?.jv?.o ? (
              <>
                <div style={{"margin":"2px 0 6px 18px","paddingLeft":"10px","borderLeft":"1px solid var(--bd2, #383838)","display":"flex","flexDirection":"column","gap":"1px"}}>
                  {(v.g?.jv?.items || []).map((x, $index) => (
                    <Fragment key={$index}>
                      <DcLink href={x?.h} style={sx(x?.s)}>
                        <span style={{"flex":"1"}}>
                          {x?.l}
                        </span>
                        <span style={{"fontSize":"11px","color":"var(--t3, #8F8F8F)"}}>
                          {x?.k}
                        </span>
                      </DcLink>
                    </Fragment>
                  ))}
                </div>
              </>
            ) : null}
            <div style={{"fontSize":"11px","fontWeight":"600","letterSpacing":".06em","color":"var(--t3, #8F8F8F)","padding":"14px 10px 4px"}}>
              {"ACCOUNTS & STOCK"}
            </div>
            <button type="button" style={sx(v.g?.acc?.s)} onClick={v.g?.acc?.t} aria-expanded={v.g?.acc?.o}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{"flex":"none","color":"var(--t2, #B5B5B5)"}}>
                <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
              </svg>
              <span style={{"flex":"1"}}>
                Accounts
              </span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" aria-hidden="true" style={sx(v.g?.acc?.c)}>
                <path d="m9 18 6-6-6-6" />
              </svg>
            </button>
            {' '}
            {v.g?.acc?.o ? (
              <>
                <div style={{"margin":"2px 0 6px 18px","paddingLeft":"10px","borderLeft":"1px solid var(--bd2, #383838)","display":"flex","flexDirection":"column","gap":"1px"}}>
                  {(v.g?.acc?.items || []).map((x, $index) => (
                    <Fragment key={$index}>
                      <DcLink href={x?.h} style={sx(x?.s)}>
                        <span style={{"flex":"1"}}>
                          {x?.l}
                        </span>
                        <span style={{"fontSize":"11px","color":"var(--t3, #8F8F8F)"}}>
                          {x?.k}
                        </span>
                      </DcLink>
                    </Fragment>
                  ))}
                </div>
              </>
            ) : null}
            {' '}
            <button type="button" style={sx(v.g?.inv?.s)} onClick={v.g?.inv?.t} aria-expanded={v.g?.inv?.o}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{"flex":"none","color":"var(--t2, #B5B5B5)"}}>
                <path d="m7.5 4.27 9 5.15" />
                <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
                <path d="m3.3 7 8.7 5 8.7-5" />
                <path d="M12 22V12" />
              </svg>
              <span style={{"flex":"1"}}>
                Inventory
              </span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" aria-hidden="true" style={sx(v.g?.inv?.c)}>
                <path d="m9 18 6-6-6-6" />
              </svg>
            </button>
            {' '}
            {v.g?.inv?.o ? (
              <>
                <div style={{"margin":"2px 0 6px 18px","paddingLeft":"10px","borderLeft":"1px solid var(--bd2, #383838)","display":"flex","flexDirection":"column","gap":"1px"}}>
                  {(v.g?.inv?.items || []).map((x, $index) => (
                    <Fragment key={$index}>
                      <DcLink href={x?.h} style={sx(x?.s)}>
                        <span style={{"flex":"1"}}>
                          {x?.l}
                        </span>
                        <span style={{"fontSize":"11px","color":"var(--t3, #8F8F8F)"}}>
                          {x?.k}
                        </span>
                      </DcLink>
                    </Fragment>
                  ))}
                </div>
              </>
            ) : null}
            {' '}
            <button type="button" style={sx(v.g?.rep?.s)} onClick={v.g?.rep?.t} aria-expanded={v.g?.rep?.o}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{"flex":"none","color":"var(--t2, #B5B5B5)"}}>
                <path d="M3 3v18h18" />
                <path d="M18 17V9" />
                <path d="M13 17V5" />
                <path d="M8 17v-3" />
              </svg>
              <span style={{"flex":"1"}}>
                {"Reports & GST"}
              </span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" aria-hidden="true" style={sx(v.g?.rep?.c)}>
                <path d="m9 18 6-6-6-6" />
              </svg>
            </button>
            {' '}
            {v.g?.rep?.o ? (
              <>
                <div style={{"margin":"2px 0 6px 18px","paddingLeft":"10px","borderLeft":"1px solid var(--bd2, #383838)","display":"flex","flexDirection":"column","gap":"1px"}}>
                  {(v.g?.rep?.items || []).map((x, $index) => (
                    <Fragment key={$index}>
                      <DcLink href={x?.h} style={sx(x?.s)}>
                        <span style={{"flex":"1"}}>
                          {x?.l}
                        </span>
                        <span style={{"fontSize":"11px","color":"var(--t3, #8F8F8F)"}}>
                          {x?.k}
                        </span>
                      </DcLink>
                    </Fragment>
                  ))}
                </div>
              </>
            ) : null}
            {' '}
            <DcLink href={v.h?.mast} style={sx(v.n?.mast)}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{"flex":"none","color":"var(--t2, #B5B5B5)"}}>
                <rect width="7" height="7" x="3" y="3" rx="1" />
                <rect width="7" height="7" x="14" y="3" rx="1" />
                <rect width="7" height="7" x="14" y="14" rx="1" />
                <rect width="7" height="7" x="3" y="14" rx="1" />
              </svg>
              Masters
              <span style={{"marginLeft":"auto","fontSize":"11px","color":"var(--t3, #8F8F8F)"}}>
                38
              </span>
            </DcLink>
            <div style={{"flex":"1","minHeight":"20px"}} />
            <DcLink href="#" style={sx(v.n?.set)}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" aria-hidden="true" style={{"flex":"none","color":"var(--t2, #B5B5B5)"}}>
                <path d="M20 7h-9" />
                <path d="M14 17H5" />
                <circle cx="17" cy="17" r="3" />
                <circle cx="7" cy="7" r="3" />
              </svg>
              {"Tools & Settings"}
            </DcLink>
            {' '}
            <DcLink href="#" style={sx(v.n?.help)}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" aria-hidden="true" style={{"flex":"none","color":"var(--t2, #B5B5B5)"}}>
                <circle cx="12" cy="12" r="10" />
                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                <path d="M12 17h.01" />
              </svg>
              {"Help & Support"}
            </DcLink>
            {' '}
            <button type="button" onClick={v.collapse} title="Collapse menu" style={{"display":"flex","alignItems":"center","gap":"10px","height":"36px","padding":"0 10px","borderRadius":"8px","background":"transparent","border":"0","color":"var(--t1, #EDEDED)","font":"inherit","cursor":"pointer","textAlign":"left"}}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" aria-hidden="true" style={{"color":"var(--t2, #B5B5B5)"}}>
                <path d="M3 19V5" />
                <path d="m13 6-6 6 6 6" />
                <path d="M7 12h14" />
              </svg>
              Collapse
            </button>
          </nav>
        </>
      ) : null}
      </>
    );
  }
}

export default function Sidebar(props) {
  const theme = useTheme();
  return <SidebarView {...props} theme={theme} />;
}
