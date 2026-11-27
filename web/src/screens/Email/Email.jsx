/* eslint-disable */
// Email — converted 1:1 from the YarnFlow design (Email.dc.html).
// Markup, styles, sample data and behaviour are identical to the design.
import { Fragment } from 'react';
import { DCLogic, useTheme } from '@/dc/runtime';
import Assistant from '@/components/Assistant/Assistant';
import Sidebar from '@/components/Sidebar/Sidebar';

import CSS from './Email.css?raw';

/* ----- screen logic (same as the design) ----- */
class Component extends DCLogic {
  constructor(p) { super(p); this.state = { filter: 'PENDING', form: '', q: '', from: '', to: '', selId: null, set: false }; this.tok = 0; }
  api() { return typeof window !== 'undefined' && window.YF_API && window.YF_API.session ? window.YF_API : null; }
  componentDidMount() { this.load(); this.loadSet(); this.iv = setInterval(() => { if (!this.state.set) this.load(); }, 15000); }
  componentWillUnmount() { clearInterval(this.iv); }
  async loadSet() { const api = this.api(); if (!api) return; try { this.setState({ cfg: await api.get('/email/settings') }); } catch (e) {} }
  async load(patch) {
    const st = { ...this.state, ...(patch || {}) }; if (patch) this.setState(patch);
    const api = this.api(); if (!api) return;
    const t = ++this.tok; const qs = new URLSearchParams();
    if (st.filter === 'OLD') qs.set('legacy', '1'); else if (st.filter !== 'ALL') qs.set('status', st.filter);
    if (st.form) qs.set('form', st.form); if (st.q.trim()) qs.set('q', st.q.trim()); if (st.from) qs.set('from', st.from); if (st.to) qs.set('to', st.to);
    try { const r = await api.get('/email/messages?' + qs.toString()); if (t !== this.tok) return; this.setState({ live: r.rows, info: r }); } catch (e) { this.setState({ done: api.message(e) }); }
  }
  async act(m, what) { const api = this.api(); if (!api || !m) return; try { await api.post('/email/messages/' + m.id + '/' + what, {}); this.setState({ done: what === 'retry' ? 'Queued again' : 'Skipped' }); await this.load(); } catch (e) { this.setState({ done: api.message(e) }); } }
  renderVals() {
    const st = this.state; const theme = this.props.theme ?? 'dark'; const cfg = st.cfg || {}; const info = st.info || {};
    const FORMS = [['', 'All documents'], ['SAL', 'Sale bill'], ['SalOrder', 'Sale order'], ['SALRTN', 'Sale return'], ['DBNT', 'Debit note'], ['CRNT', 'Credit note'], ['NOTE', 'Debit / credit note (old)'], ['SALE_BILL', 'Sale bill (by hand)'], ['DEBIT_NOTE', 'Debit note (by hand)'], ['CREDIT_NOTE', 'Credit note (by hand)']];
    const LBL = Object.fromEntries(FORMS); const SHORT = { SAL: 'SB', SalOrder: 'SO', SALRTN: 'SR', DBNT: 'DN', CRNT: 'CN', NOTE: 'NT', SALE_BILL: 'SB', SALE_RETURN: 'SR', DEBIT_NOTE: 'DN', CREDIT_NOTE: 'CN', SALES_ORDER: 'SO' };
    const tone = (s) => s === 'SENT' ? 't-green' : s === 'PENDING' || s === 'SENDING' ? 't-orange' : s === 'FAILED' || s === 'NO EMAIL' ? 't-red' : 't-gray';
    const pad = (n) => String(n).padStart(2, '0');
    const when = (t) => { if (!t) return ''; const d = new Date(t); return pad(d.getDate()) + '-' + pad(d.getMonth() + 1) + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes()); };
    const strip = (h) => String(h || '').replace(/<style[\s\S]*?<\/style>/gi, '').replace(/<br\s*\/?>(\s*)/gi, '\n').replace(/<\/(p|div|tr|h\d)>/gi, '\n').replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/[ \t]+/g, ' ').replace(/\n\s*\n+/g, '\n\n').trim();
    const rows = st.live || []; const selM = rows.find((r) => r.id === st.selId) || rows[0] || null; const c = info.counts || {};
    const atts = (m) => (m && Array.isArray(m.attachments) ? m.attachments : []);
    const sel = selM ? { type: (LBL[selM.formType] || selM.formType) + (selM.legacy ? ' · old software' : '') + (selM.user ? ' · ' + selM.user : ''), subject: selM.subject || '—', to: selM.to ? 'To: ' + selM.to : 'No email address on the party', body: selM.isHtml ? strip(selM.body) : (selM.body || '(no text — PDF only)'),
        att: atts(selM).length ? '📎 ' + atts(selM).map((a) => a.filename).join(', ') : '', status: selM.status, tagCls: 'tag ' + tone(selM.status), error: selM.error ? (selM.status === 'FAILED' ? 'Failed: ' : 'Last try: ') + selM.error : '' }
      : { type: '', subject: st.live ? 'Nothing here' : 'Loading…', to: '', body: st.live ? 'No email matches this view.' : '', att: '', status: '', tagCls: '', error: '' };
    const on = cfg.mode === 'auto';
    const forms = Array.isArray(cfg.forms) ? cfg.forms : [];
    const paused = info.pausedUntil && new Date(info.pausedUntil) > new Date();
    return {
      theme, pendingN: c.PENDING || 0, q: st.q,
      setQ: (e) => { const v = e.target.value; this.setState({ q: v }); clearTimeout(this.qt); this.qt = setTimeout(() => this.load(), 300); },
      modeTxt: !on ? 'Automatic email off' : paused ? 'Paused — sending limit' : '● Sending · ' + (info.sentToday || 0) + ' today',
      modeCls: 'tag ' + (!on ? 't-gray' : paused ? 't-orange' : 't-green'), modeTip: paused ? 'The mail server refused more mail for now; YarnFlow tries again in an hour' : 'Daily limit ' + (info.dailyLimit || 450),
      setBtn: st.set ? 'btn pr' : 'btn', toggleSet: () => this.setState({ set: !st.set }), showList: !st.set, showSet: !!st.set,
      filters: [['PENDING', 'To send'], ['SENT', 'Sent'], ['FAILED', 'Failed'], ['NO EMAIL', 'No email'], ['ALL', 'All'], ['OLD', 'Old software']].map(([k, label]) => ({ label, n: k === 'ALL' ? Object.values(c).reduce((a, b) => a + b, 0) : k === 'OLD' ? '' : c[k] || 0, cls: k === st.filter ? 'tab on' : 'tab', pick: () => this.load({ filter: k, selId: null }) })),
      forms: FORMS.map(([v, l]) => ({ v, l })), form: st.form, setForm: (e) => this.load({ form: e.target.value, selId: null }),
      from: st.from, to: st.to, setFrom: (e) => this.load({ from: e.target.value }), setTo: (e) => this.load({ to: e.target.value }),
      rows: rows.map((m) => ({ short: SHORT[m.formType] || '@', subject: m.subject || m.billNo || '—', when: when(m.createdAt), line: (m.to || 'no email') + (atts(m).length ? ' · 📎 PDF' : ''), status: m.status, tagCls: 'tag ' + tone(m.status), cls: selM && m.id === selM.id ? 'item on' : 'item', pick: () => this.setState({ selId: m.id, done: '' }) })),
      listNote: st.live ? (rows.length >= 500 ? 'Showing the latest 500 — narrow by date or search.' : rows.length ? '' : 'No emails.') : 'Loading…',
      sel, done: st.done || '',
      pdfLabel: atts(selM).length ? 'Open PDF' : 'No PDF',
      openPdf: () => { const a = atts(selM)[0]; if (a && a.link) try { window.open(a.link, '_blank', 'noopener'); } catch (e) {} },
      retry: () => this.act(selM, 'retry'), skip: () => this.act(selM, 'skip'),
      hint: on ? 'Emails go out automatically from ' + (cfg.username || 'the company email') + ' a few seconds after the document is saved.' : 'Automatic email is off — switch it on in Email setup.',
      modes: [['off', 'Off'], ['auto', 'On — email each saved document']].map(([k, label]) => ({ label, cls: (cfg.mode || 'off') === k ? 'btn pr' : 'btn', pick: () => this.setState({ cfg: { ...cfg, mode: k }, sdone: 'Not saved yet' }) })),
      formChecks: [['SAL', 'Sale bill + PDF'], ['SALRTN', 'Sale return + PDF'], ['SalOrder', 'Sale order'], ['DBNT', 'Debit note PDF'], ['CRNT', 'Credit note PDF']].map(([k, label]) => ({ label, on: forms.indexOf(k) >= 0, toggle: () => this.setState({ cfg: { ...cfg, forms: forms.indexOf(k) >= 0 ? forms.filter((x) => x !== k) : forms.concat([k]) }, sdone: 'Not saved yet' }) })),
      fields: [['host', 'Mail server', 'text', 'smtp.gmail.com'], ['port', 'Port', 'text', '587'], ['username', 'Email address', 'text', 'umiyayarnllp@gmail.com'], ['password', 'App password', 'password', '16-letter app password'], ['fromName', 'Sender name', 'text', 'Company name'], ['dailyLimit', 'Daily limit', 'text', '450 (Gmail allows 500 a day)']].map(([k, label, type, ph]) => ({ k: 'em-' + k, label, type, ph, v: cfg[k] == null ? '' : String(cfg[k]), set: (e) => this.setState({ cfg: { ...cfg, [k]: e.target.value }, sdone: 'Not saved yet' }) })),
      secure: !!cfg.secure, toggleSecure: (e) => this.setState({ cfg: { ...cfg, secure: e.target.checked }, sdone: 'Not saved yet' }),
      sdone: st.sdone || '',
      saveSet: async () => { const api = this.api(); if (!api) return; try { const s = await api.put('/email/settings', cfg); this.setState({ cfg: s, sdone: '✓ Saved' }); this.load(); } catch (e) { this.setState({ sdone: api.message(e) }); } },
      testTo: st.testTo || '', setTestTo: (e) => this.setState({ testTo: e.target.value }), tstDone: st.tstDone || '',
      testSend: async () => { const api = this.api(); if (!api) return; this.setState({ tstDone: 'Sending…' }); try { const r = await api.post('/email/test', { to: st.testTo || '' }); this.setState({ tstDone: '✓ Test email sent to ' + r.to }); } catch (e) { this.setState({ tstDone: api.message(e) }); } }
    };
  }
}

/* ----- view ----- */
class EmailView extends Component {
  render() {
    const v = this.renderVals() || {};
    return (
      <>
        <style>{CSS}</style>
      <div className={`app ${v.theme ?? ""}`}>
        <div className="sbw">
          <Sidebar active="mail" />
        </div>
        <div className="main">
          <header className="hdr">
            <div className="bc">
              <span>
                Email
              </span>
              <span className="tag t-orange">
                {v.pendingN}{" to send"}
              </span>
              <span className={v.modeCls} title={v.modeTip}>
                {v.modeTxt}
              </span>
            </div>
            <input className="inp" type="search" placeholder="Bill no, email or subject" aria-label="Search emails" style={{"width":"240px"}} value={v.q} onChange={v.setQ} />
            {' '}
            <button className={v.setBtn} type="button" onClick={v.toggleSet}>
              Email setup
            </button>
          </header>
          {v.showList ? (
            <>
              <div className="split">
                <div className="lp">
                  <div className="tabs" role="tablist">
                    {(v.filters || []).map((f, $index) => (
                      <Fragment key={$index}>
                        <button className={f?.cls} type="button" role="tab" onClick={f?.pick}>
                          {f?.label}{" "}
                          <span className="n">
                            {f?.n}
                          </span>
                        </button>
                      </Fragment>
                    ))}
                  </div>
                  <div className="bar">
                    <select className="inp" aria-label="Document type" value={v.form} onChange={v.setForm}>
                      {(v.forms || []).map((o, $index) => (
                        <Fragment key={$index}>
                          <option value={o?.v}>
                            {o?.l}
                          </option>
                        </Fragment>
                      ))}
                    </select>
                    <input className="inp" type="date" aria-label="From" value={v.from} onChange={v.setFrom} />
                    <input className="inp" type="date" aria-label="To" value={v.to} onChange={v.setTo} />
                  </div>
                  <div className="list">
                    {(v.rows || []).map((it, $index) => (
                      <Fragment key={$index}>
                        <button className={it?.cls} type="button" onClick={it?.pick}>
                          <span className="ico">
                            {it?.short}
                          </span>
                          {' '}
                          <span style={{"flex":"1","minWidth":"0","display":"flex","flexDirection":"column","gap":"4px"}}>
                            <span style={{"display":"flex","gap":"8px","alignItems":"baseline"}}>
                              <b style={{"fontWeight":"500","flex":"1","minWidth":"0","overflow":"hidden","textOverflow":"ellipsis","whiteSpace":"nowrap"}}>
                                {it?.subject}
                              </b>
                              <span className="muted" style={{"fontSize":"12px"}}>
                                {it?.when}
                              </span>
                            </span>
                            {' '}
                            <span style={{"display":"flex","gap":"8px","alignItems":"center","justifyContent":"space-between"}}>
                              <span className="t2" style={{"fontSize":"13px","overflow":"hidden","textOverflow":"ellipsis","whiteSpace":"nowrap","minWidth":"0"}}>
                                {it?.line}
                              </span>
                              <span className={it?.tagCls}>
                                {it?.status}
                              </span>
                            </span>
                          </span>
                        </button>
                      </Fragment>
                    ))}
                    <div className="muted" style={{"padding":"16px 20px"}}>
                      {v.listNote}
                    </div>
                  </div>
                </div>
                <div className="rp">
                  <div style={{"display":"flex","alignItems":"center","gap":"12px","padding":"20px 24px","borderBottom":"1px solid var(--bd)","flexWrap":"wrap"}}>
                    <div style={{"flex":"1","minWidth":"220px"}}>
                      <div className="muted" style={{"fontSize":"13px"}}>
                        {v.sel?.type}
                      </div>
                      <div style={{"fontSize":"18px","lineHeight":"26px","fontWeight":"600"}}>
                        {v.sel?.subject}
                      </div>
                      <div className="t2">
                        {v.sel?.to}
                      </div>
                    </div>
                    <span className={v.sel?.tagCls}>
                      {v.sel?.status}
                    </span>
                  </div>
                  <div style={{"padding":"20px 24px","display":"flex","flexDirection":"column","gap":"14px"}}>
                    <div className="t2" style={{"fontSize":"13px"}}>
                      {v.sel?.att}
                    </div>
                    <pre className="msg">
                      {v.sel?.body}
                    </pre>
                    {v.sel?.error ? (
                      <>
                        <div className="t-red tag" style={{"height":"auto","padding":"6px 10px","whiteSpace":"normal"}}>
                          {v.sel?.error}
                        </div>
                      </>
                    ) : null}
                    <div style={{"display":"flex","gap":"8px","flexWrap":"wrap","alignItems":"center"}}>
                      <button className="btn" type="button" onClick={v.openPdf}>
                        {v.pdfLabel}
                      </button>
                      {' '}
                      <button className="btn" type="button" onClick={v.retry}>
                        Send again
                      </button>
                      {' '}
                      <button className="btn no" type="button" onClick={v.skip}>
                        Skip
                      </button>
                      <div style={{"flex":"1"}} />
                      <span className="muted" style={{"fontSize":"13px"}}>
                        {v.done}
                      </span>
                    </div>
                    <div className="muted" style={{"fontSize":"13px"}}>
                      {v.hint}
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : null}
          {' '}
          {v.showSet ? (
            <>
              <div style={{"padding":"20px 24px","display":"flex","flexDirection":"column","gap":"18px","maxWidth":"1000px"}}>
                <div className="box" style={{"display":"flex","flexDirection":"column","gap":"12px"}}>
                  <div style={{"fontSize":"17px","fontWeight":"600"}}>
                    Send emails automatically
                  </div>
                  <div style={{"display":"flex","gap":"8px","flexWrap":"wrap"}}>
                    {(v.modes || []).map((m, $index) => (
                      <Fragment key={$index}>
                        <button className={m?.cls} type="button" onClick={m?.pick}>
                          {m?.label}
                        </button>
                      </Fragment>
                    ))}
                  </div>
                  <div className="muted" style={{"fontSize":"13px"}}>
                    When on, each document below is emailed to the party's email address as soon as it is saved — the same subject, text and PDF the old software sent.
                  </div>
                  <div style={{"display":"flex","gap":"16px","flexWrap":"wrap"}}>
                    {(v.formChecks || []).map((f, $index) => (
                      <Fragment key={$index}>
                        <label style={{"display":"flex","gap":"8px","alignItems":"center"}}>
                          <input type="checkbox" checked={f?.on} onChange={f?.toggle} />
                          {" "}{f?.label}
                        </label>
                      </Fragment>
                    ))}
                  </div>
                </div>
                <div className="box" style={{"display":"flex","flexDirection":"column","gap":"10px"}}>
                  <div style={{"fontSize":"17px","fontWeight":"600"}}>
                    Mail server
                  </div>
                  <div className="muted" style={{"fontSize":"13px"}}>
                    {"Gmail: smtp.gmail.com, port 587. Use a Gmail "}
                    <b>
                      app password
                    </b>
                    {" (Google Account → Security → 2-Step Verification → App passwords), not the normal password."}
                  </div>
                  {(v.fields || []).map((f, $index) => (
                    <Fragment key={$index}>
                      <div className="kv">
                        <label className="k" htmlFor={f?.k}>
                          {f?.label}
                        </label>
                        <input className="inp" id={f?.k} type={f?.type} style={{"flex":"1"}} placeholder={f?.ph} value={f?.v} onChange={f?.set} />
                      </div>
                    </Fragment>
                  ))}
                  {' '}
                  <label style={{"display":"flex","gap":"8px","alignItems":"center"}}>
                    <input type="checkbox" checked={v.secure} onChange={v.toggleSecure} />
                    {" SSL (port 465) — leave off for port 587"}
                  </label>
                  <div style={{"display":"flex","gap":"8px","alignItems":"center","flexWrap":"wrap"}}>
                    <button className="btn pr" type="button" onClick={v.saveSet}>
                      Save
                    </button>
                    <span className="muted" style={{"fontSize":"13px"}}>
                      {v.sdone}
                    </span>
                    <div style={{"flex":"1"}} />
                    <input className="inp" placeholder="Send a test to (email)" aria-label="Test email address" value={v.testTo} onChange={v.setTestTo} style={{"width":"240px"}} />
                    <button className="btn" type="button" onClick={v.testSend}>
                      Send test email
                    </button>
                  </div>
                  <div className="muted" style={{"fontSize":"13px"}}>
                    {v.tstDone}
                  </div>
                </div>
              </div>
            </>
          ) : null}
        </div>
        <div className="aiw">
          <Assistant page="mail" />
        </div>
      </div>
      </>
    );
  }
}

export default function Email(props) {
  const theme = useTheme();
  return <EmailView {...props} theme={theme} />;
}
