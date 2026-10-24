/* eslint-disable */
// Main — converted 1:1 from the YarnFlow design (Main.dc.html).
// Markup, styles, sample data and behaviour are identical to the design.
import { Fragment } from 'react';
import { DCLogic, useTheme, DcLink, sx } from '@/dc/runtime';
import Assistant from '@/components/Assistant/Assistant';
import Sidebar from '@/components/Sidebar/Sidebar';

import CSS from './Main.css?raw';

/* ----- screen logic (same as the design) ----- */
class Component extends DCLogic {
  constructor(p) { super(p); this.state = { menu: null }; }
  renderVals() {
    const theme = this.props.theme ?? 'dark';
    const sfx = theme === 'light' ? 'Light' : '';
    const L = (f) => f + sfx + '.dc.html';
    const menu = this.state.menu ?? (this.props.showMenu ?? false);
    const C = { b: '--c: #3B82F6', o: '--c: #F97316', g: '--c: #22C55E', r: '--c: #EF4444', v: '--c: #A855F7', t: '--c: #14B8A6', y: '--c: #EAB308', n: '--c: #8F8F8F' };
    const T = (l, v, s, c, h, d, dcls) => ({ l, v, s, c: C[c], h: L(h), d: d || '', dcls: dcls || 'muted' });
    const tiles = [
      T('Sales', '₹ 1,18,68,981', '75,371.708 kg · 1,961 pcs', 'b', 'SalesOrderList', '▲ 12%', 'up'),
      T('Purchase', '₹ 45,29,712', '29,368.780 kg · 806 pcs', 'o', 'PurchaseBill'),
      T('Sales return', '₹ 7,06,309', '4,565.367 kg · 140 pcs', 'r', 'Dispatch'),
      T('Purchase return', '₹ 0', '0.000 kg · 0 pcs', 'n', 'PurchaseBill'),
      T('Receipts', '₹ 54,25,755', 'Bank + cash', 'g', 'Payments'),
      T('Payments', '₹ 1,99,31,067', 'Bank + cash', 'v', 'Payments'),
      T('Sales outstanding', '₹ 78,98,66,505', 'Bill-wise receivable', 'b', 'Outstanding'),
      T('General sale O/S', '₹ 4,93,31,205', 'Non-yarn sales', 't', 'Outstanding'),
      T('Purchase outstanding', '₹ 15,23,50,686', 'Payable to mills', 'o', 'Outstanding'),
      T('General purchase O/S', '₹ 3,08,78,078', 'Expenses & services', 'y', 'Outstanding'),
      T('Debit note O/S', '₹ 1,22,96,026', 'Interest & claims', 'r', 'Outstanding'),
      T('Sales orders', '40,500 kg', 'Pending to dispatch', 'b', 'SalesOrderList'),
      T('Purchase orders', '0 kg', 'Pending to receive', 'o', 'PurchaseOrderList'),
      T('E-invoice', '1,72,657 used', 'IRN generated this FY', 't', 'Reports'),
      T('WhatsApp', 'Running', '0 in queue · 1,33,716 sent', 'g', 'Approvals', '● Live', 'up')
    ];
    const cm = [
      { t: 'Sales', items: [{ l: 'Sales order', k: 'Ctrl F4', h: L('SalesOrderEntry') }, { l: 'Sale bill', k: 'F8', h: L('Dispatch') }, { l: 'Sale return', k: 'Ctrl ⇧ F8', h: L('Dispatch') }, { l: 'General sale', k: '⇧ F8', h: L('Dispatch') }, { l: 'Dispatch schedule', k: 'Ctrl F8', h: L('SalesOrderList') }] },
      { t: 'Purchase', items: [{ l: 'Purchase order', k: 'Ctrl F5', h: L('PurchaseOrderEntry') }, { l: 'Purchase bill', k: 'F9', h: L('PurchaseBill') }, { l: 'Purchase return', k: 'Ctrl ⇧ F9', h: L('PurchaseBill') }, { l: 'General purchase', k: '⇧ F9', h: L('PurchaseBill') }] },
      { t: 'Bank & cash', items: [{ l: 'Bank receipt', k: 'F6', h: L('Payments') }, { l: 'Bank payment', k: 'F7', h: L('Payments') }, { l: 'Cash receipt', k: '⇧ F6', h: L('Payments') }, { l: 'Cash payment', k: '⇧ F7', h: L('Payments') }] },
      { t: 'Journal', items: [{ l: 'Debit note', k: 'Ctrl D', h: L('Payments') }, { l: 'Credit note', k: 'Ctrl E', h: L('Payments') }, { l: 'Journal voucher', k: 'Ctrl J', h: L('Payments') }] },
      { t: 'Masters', items: [{ l: 'Party', k: 'Ctrl M', h: L('AccountMaster') }, { l: 'Broker', k: 'Ctrl A', h: L('AccountMaster') }, { l: 'Yarn item', k: 'Ctrl I', h: L('YarnMaster') }, { l: 'All masters', k: '→', h: L('Masters') }] }
    ];
    return { theme, tiles, cm, menu, toggleMenu: () => this.setState({ menu: !menu }) };
  }
}

/* ----- view ----- */
class MainView extends Component {
  render() {
    const v = this.renderVals() || {};
    return (
      <>
        <style>{CSS}</style>
      <div className={`app ${v.theme ?? ""}`}>
        <div className="sbw">
          <Sidebar active="dash" />
        </div>
        <div className="main">
          <header className="hdr" style={{"position":"relative"}}>
            <div className="bc">
              <span>
                Dashboard
              </span>
            </div>
            <button className="btn" type="button">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" aria-hidden="true">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <path d="m7 10 5 5 5-5" />
                <path d="M12 15V3" />
              </svg>
              Export
            </button>
            {' '}
            <button className="btn pr" type="button" onClick={v.toggleMenu} aria-expanded={v.menu}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                <path d="M5 12h14" />
                <path d="M12 5v14" />
              </svg>
              Create
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                <path d="m6 9 6 6 6-6" />
              </svg>
            </button>
            {' '}
            {v.menu ? (
              <>
                <div className="cmenu" role="menu" aria-label="Create new">
                  <div className="cmh">
                    <input className="inp" type="search" placeholder="What do you want to create?" aria-label="Search create menu" style={{"flex":"1"}} />
                    <span className="muted" style={{"fontSize":"12px"}}>
                      Old shortcuts still work
                    </span>
                  </div>
                  <div className="cgrid">
                    {(v.cm || []).map((c, $index) => (
                      <Fragment key={$index}>
                        <div className="ccol">
                          <div className="cct">
                            {c?.t}
                          </div>
                          {(c?.items || []).map((x, $index) => (
                            <Fragment key={$index}>
                              <DcLink className="cit" href={x?.h} role="menuitem">
                                <span style={{"flex":"1"}}>
                                  {x?.l}
                                </span>
                                <kbd>
                                  {x?.k}
                                </kbd>
                              </DcLink>
                            </Fragment>
                          ))}
                        </div>
                      </Fragment>
                    ))}
                  </div>
                </div>
              </>
            ) : null}
          </header>
          <div className="fbar2">
            <select className="inp" aria-label="Company / branch">
              <option>
                Shree Umiya Yarn Pvt Ltd · Surat
              </option>
              <option>
                Branch · Bhiwandi
              </option>
            </select>
            {' '}
            <select className="inp" aria-label="Cost center">
              <option>
                Trading division · Shivam
              </option>
              <option>
                All cost centers
              </option>
            </select>
            {' '}
            <span style={{"display":"inline-flex","alignItems":"center","gap":"6px"}}>
              <input className="inp" type="text" defaultValue="23-10-2026" aria-label="From date" style={{"width":"118px"}} />
              <span className="muted">
                to
              </span>
              <input className="inp" type="text" defaultValue="23-10-2026" aria-label="To date" style={{"width":"118px"}} />
            </span>
            <div className="seg" role="group" aria-label="Quick period">
              <button type="button" className="on">
                Today
              </button>
              <button type="button">
                Week
              </button>
              <button type="button">
                Month
              </button>
              <button type="button">
                FY
              </button>
            </div>
            <div style={{"flex":"1"}} />
            <span style={{"display":"inline-flex","alignItems":"center","gap":"10px","fontSize":"13px"}}>
              <span className="muted">
                Today's target
              </span>
              <span style={{"width":"120px","height":"6px","borderRadius":"3px","background":"var(--s2)","overflow":"hidden","display":"inline-block"}}>
                <i style={{"display":"block","width":"100%","height":"6px","background":"#22C55E"}} />
              </span>
              <b style={{"fontWeight":"600"}}>
                ₹ 1.19 Cr
              </b>
              <span className="muted">
                of ₹ 1.00 L target
              </span>
            </span>
          </div>
          <div style={{"padding":"20px","display":"flex","flexDirection":"column","gap":"16px"}}>
            <section>
              <div style={{"display":"flex","alignItems":"baseline","gap":"10px","marginBottom":"10px"}}>
                <h2 style={{"margin":"0","fontSize":"15px","fontWeight":"600"}}>
                  Today at a glance
                </h2>
                <span className="muted" style={{"fontSize":"13px"}}>
                  Click any tile to open its register
                </span>
              </div>
              <div className="tiles">
                {(v.tiles || []).map((t, $index) => (
                  <Fragment key={$index}>
                    <DcLink className="box tile" href={t?.h}>
                      <span className="tl">
                        <span className="dot" style={sx(t?.c)}>
                          {t?.l}
                        </span>
                        <span className={t?.dcls}>
                          {t?.d}
                        </span>
                      </span>
                      <span className="tv">
                        {t?.v}
                      </span>
                      <span className="ts">
                        {t?.s}
                      </span>
                    </DcLink>
                  </Fragment>
                ))}
              </div>
            </section>
            <div style={{"display":"flex","flexWrap":"wrap","gap":"16px"}}>
              <section className="box" style={{"flex":"999 1 520px","minWidth":"0","display":"flex","flexDirection":"column"}}>
                <div className="bh">
                  <h2>
                    Sales vs purchase
                  </h2>
                  <span className="dot c-blue t2" style={{"fontSize":"13px"}}>
                    Sales ₹ 622 L
                  </span>
                  <span className="dot c-orange t2" style={{"fontSize":"13px"}}>
                    Purchase ₹ 460 L
                  </span>
                </div>
                <div style={{"display":"flex","gap":"10px","padding":"18px 16px 14px"}} role="img" aria-label="Weekly sales rose from 38 to 64 lakh and purchase from 30 to 45 lakh between weeks 32 and 43">
                  <div style={{"display":"flex","flexDirection":"column","justifyContent":"space-between","height":"186px","marginTop":"-6px","fontSize":"12px","textAlign":"right","width":"22px"}} className="muted">
                    <span>
                      72
                    </span>
                    <span>
                      54
                    </span>
                    <span>
                      36
                    </span>
                    <span>
                      18
                    </span>
                    <span>
                      0
                    </span>
                  </div>
                  <div style={{"flex":"1","minWidth":"0"}}>
                    <div style={{"height":"180px","display":"flex","justifyContent":"space-between","alignItems":"flex-end","borderBottom":"1px solid var(--bd2)","background":"repeating-linear-gradient(to top, var(--bd) 0 1px, transparent 1px 45px)","padding":"0 4px"}}>
                      <div className="bars">
                        <i style={{"height":"95px","background":"#3B82F6"}} />
                        <i style={{"height":"75px","background":"#F97316"}} />
                      </div>
                      <div className="bars">
                        <i style={{"height":"105px","background":"#3B82F6"}} />
                        <i style={{"height":"83px","background":"#F97316"}} />
                      </div>
                      <div className="bars">
                        <i style={{"height":"88px","background":"#3B82F6"}} />
                        <i style={{"height":"73px","background":"#F97316"}} />
                      </div>
                      <div className="bars">
                        <i style={{"height":"120px","background":"#3B82F6"}} />
                        <i style={{"height":"90px","background":"#F97316"}} />
                      </div>
                      <div className="bars">
                        <i style={{"height":"130px","background":"#3B82F6"}} />
                        <i style={{"height":"100px","background":"#F97316"}} />
                      </div>
                      <div className="bars">
                        <i style={{"height":"115px","background":"#3B82F6"}} />
                        <i style={{"height":"88px","background":"#F97316"}} />
                      </div>
                      <div className="bars">
                        <i style={{"height":"138px","background":"#3B82F6"}} />
                        <i style={{"height":"103px","background":"#F97316"}} />
                      </div>
                      <div className="bars">
                        <i style={{"height":"123px","background":"#3B82F6"}} />
                        <i style={{"height":"95px","background":"#F97316"}} />
                      </div>
                      <div className="bars">
                        <i style={{"height":"145px","background":"#3B82F6"}} />
                        <i style={{"height":"110px","background":"#F97316"}} />
                      </div>
                      <div className="bars">
                        <i style={{"height":"153px","background":"#3B82F6"}} />
                        <i style={{"height":"118px","background":"#F97316"}} />
                      </div>
                      <div className="bars">
                        <i style={{"height":"135px","background":"#3B82F6"}} />
                        <i style={{"height":"105px","background":"#F97316"}} />
                      </div>
                      <div className="bars">
                        <i style={{"height":"160px","background":"#3B82F6"}} />
                        <i style={{"height":"113px","background":"#F97316"}} />
                      </div>
                    </div>
                    <div style={{"display":"flex","justifyContent":"space-between","padding":"6px 4px 0","fontSize":"12px"}} className="muted">
                      <span>
                        W32
                      </span>
                      <span>
                        W33
                      </span>
                      <span>
                        W34
                      </span>
                      <span>
                        W35
                      </span>
                      <span>
                        W36
                      </span>
                      <span>
                        W37
                      </span>
                      <span>
                        W38
                      </span>
                      <span>
                        W39
                      </span>
                      <span>
                        W40
                      </span>
                      <span>
                        W41
                      </span>
                      <span>
                        W42
                      </span>
                      <span style={{"color":"var(--t1)"}}>
                        W43
                      </span>
                    </div>
                  </div>
                </div>
              </section>
              <section className="box" style={{"flex":"1 1 360px","minWidth":"0","display":"flex","flexDirection":"column","gap":"14px","paddingBottom":"16px"}}>
                <div className="bh">
                  <h2>
                    Order pipeline
                  </h2>
                  <span className="muted" style={{"fontSize":"13px"}}>
                    Oct · 86 orders
                  </span>
                </div>
                <div style={{"display":"flex","flexDirection":"column","gap":"14px","padding":"4px 16px 0"}}>
                  <div className="stage">
                    <span className="dot c-orange">
                      On hold · approval
                    </span>
                    <span className="tr">
                      <i style={{"width":"22%","background":"#F97316"}} />
                    </span>
                    <span className="r">
                      11
                    </span>
                  </div>
                  <div className="stage">
                    <span className="dot c-blue">
                      Pending dispatch
                    </span>
                    <span className="tr">
                      <i style={{"width":"52%","background":"#3B82F6"}} />
                    </span>
                    <span className="r">
                      26
                    </span>
                  </div>
                  <div className="stage">
                    <span className="dot c-violet">
                      Dispatched
                    </span>
                    <span className="tr">
                      <i style={{"width":"36%","background":"#A855F7"}} />
                    </span>
                    <span className="r">
                      18
                    </span>
                  </div>
                  <div className="stage">
                    <span className="dot c-teal">
                      Invoiced
                    </span>
                    <span className="tr">
                      <i style={{"width":"34%","background":"#14B8A6"}} />
                    </span>
                    <span className="r">
                      17
                    </span>
                  </div>
                  <div className="stage">
                    <span className="dot c-green">
                      Closed · fully dispatched
                    </span>
                    <span className="tr">
                      <i style={{"width":"28%","background":"#22C55E"}} />
                    </span>
                    <span className="r">
                      14
                    </span>
                  </div>
                </div>
                <div style={{"margin":"4px 16px 0","paddingTop":"14px","borderTop":"1px solid var(--bd)","display":"flex","gap":"16px","fontSize":"13px"}}>
                  <span className="muted">
                    Avg order
                  </span>
                  <b style={{"fontWeight":"600"}}>
                    ₹ 2.14 L
                  </b>
                  <span className="muted">
                    Avg days to pay
                  </span>
                  <b style={{"fontWeight":"600"}}>
                    41
                  </b>
                </div>
              </section>
            </div>
            <div style={{"display":"flex","flexWrap":"wrap","gap":"16px"}}>
              <section id="ai" className="box" style={{"flex":"1 1 360px","minWidth":"0","display":"flex","flexDirection":"column"}}>
                <div className="bh">
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#C084FC" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9Z" />
                  </svg>
                  <h2>
                    AI insights
                  </h2>
                  <span className="muted" style={{"fontSize":"12px"}}>
                    4 min ago
                  </span>
                </div>
                <div className="act" style={{"paddingTop":"14px"}}>
                  <span className="dot c-red" aria-hidden="true" />
                  <div>
                    <div>
                      Krishna Textiles is 18 days past terms with ₹ 2.14 L overdue.
                    </div>
                    <DcLink href="Outstanding.dc.html" className="t2" style={{"fontSize":"13px","textDecoration":"underline"}}>
                      Send WhatsApp reminder
                    </DcLink>
                  </div>
                </div>
                <div className="act">
                  <span className="dot c-green" aria-hidden="true" />
                  <div>
                    <div>
                      Viscose 120D sales up 32%. Stock covers 9 days only.
                    </div>
                    <DcLink href="PurchaseOrder.dc.html" className="t2" style={{"fontSize":"13px","textDecoration":"underline"}}>
                      Draft a mill order
                    </DcLink>
                  </div>
                </div>
                <div className="act">
                  <span className="dot c-violet" aria-hidden="true" />
                  <div>
                    <div>
                      FDY 75/36 mill rate rose ₹ 3.50/kg; 6 open quotes use the old rate.
                    </div>
                    <DcLink href="SalesOrderList.dc.html" className="t2" style={{"fontSize":"13px","textDecoration":"underline"}}>
                      Review orders
                    </DcLink>
                  </div>
                </div>
                <label style={{"display":"flex","alignItems":"center","gap":"8px","margin":"auto 16px 16px","padding":"4px 4px 4px 12px","borderRadius":"10px","background":"var(--s2)"}}>
                  <input type="text" aria-label="Ask YarnFlow AI" placeholder="Ask: outstanding of Surat parties above 60 days" style={{"flex":"1","minWidth":"0","border":"0","outline":"0","background":"transparent","fontSize":"13px","height":"32px"}} />
                  <button className="btn pr ic" type="button" aria-label="Ask" style={{"width":"32px","height":"32px"}}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                      <path d="M5 12h14" />
                      <path d="m12 5 7 7-7 7" />
                    </svg>
                  </button>
                </label>
              </section>
            </div>
            <section className="box">
              <div className="bh" style={{"paddingBottom":"12px"}}>
                <h2>
                  Recent activity
                </h2>
                <DcLink className="btn sm" href="SalesOrderList.dc.html">
                  View all
                </DcLink>
              </div>
              <div className="act" style={{"paddingTop":"0"}}>
                <svg className="ico" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" aria-hidden="true">
                  <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2" />
                  <path d="M15 18H9" />
                  <circle cx="17" cy="18" r="2" />
                  <circle cx="7" cy="18" r="2" />
                </svg>
                <span style={{"flex":"1"}}>
                  <b style={{"fontWeight":"500"}}>
                    Dhaval K.
                  </b>
                  {' '}
                  <span className="muted">
                    dispatched
                  </span>
                  {' '}
                  <b style={{"fontWeight":"500"}}>
                    SO-0415
                  </b>
                  {' '}
                  <span className="muted">
                    to Om Sai Weaving · LR NR-44817
                  </span>
                </span>
                <span className="muted">
                  12 min ago
                </span>
              </div>
              <div className="act">
                <svg className="ico" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" aria-hidden="true">
                  <rect width="20" height="14" x="2" y="5" rx="2" />
                  <path d="M2 10h20" />
                </svg>
                <span style={{"flex":"1"}}>
                  <b style={{"fontWeight":"500"}}>
                    Meera Patel
                  </b>
                  {' '}
                  <span className="muted">
                    recorded receipt of
                  </span>
                  {' '}
                  <b style={{"fontWeight":"500"}}>
                    ₹ 1,50,000
                  </b>
                  {' '}
                  <span className="muted">
                    from Krishna Textiles
                  </span>
                </span>
                <span className="muted">
                  1 hour ago
                </span>
              </div>
              <div className="act" style={{"paddingBottom":"16px"}}>
                <svg className="ico" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" aria-hidden="true">
                  <path d="M20 6 9 17l-5-5" />
                </svg>
                <span style={{"flex":"1"}}>
                  <b style={{"fontWeight":"500"}}>
                    Avi Patel
                  </b>
                  {' '}
                  <span className="muted">
                    approved
                  </span>
                  {' '}
                  <b style={{"fontWeight":"500"}}>
                    PO-0121
                  </b>
                  {' '}
                  <span className="muted">
                    · Sanathan Textiles · ₹ 8.4 L
                  </span>
                </span>
                <span className="muted">
                  3 hours ago
                </span>
              </div>
            </section>
          </div>
        </div>
        <div className="aiw">
          <Assistant page="dash" startOpen={true} />
        </div>
      </div>
      </>
    );
  }
}

export default function Main(props) {
  const theme = useTheme();
  return <MainView {...props} theme={theme} />;
}
