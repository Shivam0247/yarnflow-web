/* eslint-disable */
// WhatsApp — converted 1:1 from the YarnFlow design (WhatsApp.dc.html).
// Markup, styles, sample data and behaviour are identical to the design.
import { Fragment } from 'react';
import { DCLogic, useTheme } from '@/dc/runtime';
import Assistant from '@/components/Assistant/Assistant';
import Sidebar from '@/components/Sidebar/Sidebar';

import CSS from './WhatsApp.css?raw';

/* ----- screen logic (same as the design) ----- */
class Component extends DCLogic {
  constructor(p) { super(p); this.state = { filter: 'PENDING', form: '', q: '', from: '', to: '', selId: null, tpl: false, tsel: null, edit: {} }; this.tok = 0; }
  api() { return typeof window !== 'undefined' && window.YF_API && window.YF_API.session ? window.YF_API : null; }
  componentDidMount() { this.load(); this.loadSet(); this.iv = setInterval(() => { if (!this.state.tpl && !this.state.set) this.load(); }, 15000); }
  async loadSet() { const api = this.api(); if (!api) return; try { const s = await api.get('/whatsapp/settings'); this.setState({ cfg: s, form0: s }); } catch (e) {} }
  async loadCloud() { const api = this.api(); if (!api) return; this.setState({ ctNote: 'Checking with Meta…' }); try { const r = await api.get('/whatsapp/cloud/templates'); this.setState({ ct: r, ctNote: r.error ? 'Meta: ' + r.error : '' }); } catch (e) { this.setState({ ctNote: api.message(e) }); } }
  componentWillUnmount() { clearInterval(this.iv); }
  async load(patch) {
    const st = { ...this.state, ...(patch || {}) }; if (patch) this.setState(patch);
    const api = this.api(); if (!api) return;
    const t = ++this.tok;
    const qs = new URLSearchParams();
    if (st.filter === 'OLD') { qs.set('legacy', '1'); } else if (st.filter !== 'ALL') qs.set('status', st.filter);
    if (st.form) qs.set('form', st.form); if (st.q.trim()) qs.set('q', st.q.trim()); if (st.from) qs.set('from', st.from); if (st.to) qs.set('to', st.to);
    try { const r = await api.get('/whatsapp/messages?' + qs.toString()); if (t !== this.tok) return; this.setState({ live: r.rows, counts: r.counts, sender: r.sender }); }
    catch (e) { this.setState({ done: api.message(e) }); }
  }
  async loadTpl() { const api = this.api(); if (!api) return; try { this.setState({ tpls: await api.get('/whatsapp/templates') }); } catch (e) { this.setState({ tdone: api.message(e) }); } }
  async mark(m, status) {
    const api = this.api(); if (!api || !m) return;
    try { await api.post('/whatsapp/messages/' + m.id + '/sent', { status }); const rows = this.state.live || []; const i = rows.findIndex((r) => r.id === m.id); const next = rows[i + 1] || rows[i - 1];
      this.setState({ done: (status === 'SENT' ? '✓ Marked sent ' : 'Skipped ') + (m.billNo || ''), selId: next ? next.id : null }); await this.load(); }
    catch (e) { this.setState({ done: api.message(e) }); }
  }
  renderVals() {
    const st = this.state; const theme = this.props.theme ?? 'dark'; const cfg = st.cfg || {};
    const FORMS = [['', 'All messages'], ['SAL', 'Sale bill'], ['SalOrder', 'Sale order'], ['BANKREC', 'Bank receipt'], ['BANKPAY', 'Bank payment'], ['DBNT', 'Debit note'], ['CRNT', 'Credit note'], ['SALRTN', 'Sale return'], ['PARTY_MASTER', 'New party']];
    const LBL = Object.fromEntries(FORMS); const SHORT = { SAL: 'SB', SalOrder: 'SO', BANKREC: 'BR', BANKPAY: 'BP', DBNT: 'DN', CRNT: 'CN', SALRTN: 'SR' };
    const tone = (s) => s === 'SENT' || s === 'DELIVERED' || s === 'READ' ? 't-green' : s === 'PENDING' ? 't-orange' : s === 'NO MOBILE' || s === 'FAILED' ? 't-red' : 't-gray';
    const pad = (n) => String(n).padStart(2, '0');
    const when = (t) => { if (!t) return ''; const d = new Date(t); return pad(d.getDate()) + '-' + pad(d.getMonth() + 1) + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes()); };
    const rowsAll = st.live || [];
    const selM = rowsAll.find((r) => r.id === st.selId) || rowsAll[0] || null;
    const c = st.counts || {};
    const pdfUrl = (m) => (m && m.attachment ? (m.attachment.indexOf('http') === 0 ? m.attachment : window.location.origin + m.attachment) : '');
    const text = (m) => !m ? '' : m.msgType === 'PDF' ? (m.caption || '') + (m.attachment ? '\n' + pdfUrl(m) : '') : (m.body || '');
    const sel = selM ? { type: (LBL[selM.formType] || selM.formType) + ' · ' + (selM.msgType === 'PDF' ? 'PDF' : selM.msgType === 'TEMPLATE' ? (selM.attachment ? 'Text + PDF · official API' : 'Text · official API') : 'Text') + (selM.legacy ? ' · old software' : '') + (selM.user ? ' · ' + selM.user : ''), no: selM.billNo || '—', to: (selM.mobile ? '+' + selM.mobile : 'No WhatsApp number on the party') + (selM.readAt ? ' · read ' + when(selM.readAt) : selM.deliveredAt ? ' · delivered ' + when(selM.deliveredAt) : ''), body: selM.msgType === 'PDF' ? (selM.caption || '') + '\n\n📎 ' + (selM.attachment || 'PDF') : (selM.attachment ? '📎 ' + (selM.caption || 'PDF') + '\n\n' : '') + (selM.body || ''), status: selM.status, tagCls: 'tag ' + tone(selM.status), error: selM.error ? 'Last try failed: ' + selM.error : '' }
      : { type: '', no: st.live ? 'Nothing here' : 'Loading…', to: '', body: st.live ? 'No message matches this view.' : '', status: '', tagCls: '', error: '' };
    const tpls = (st.tpls || []).map((t) => ({ ...t, ...(st.edit[t.formType] || {}) }));
    const tSel = tpls.find((t) => t.formType === st.tsel) || tpls[0] || null;
    const setT = (k, v) => tSel && this.setState({ edit: { ...st.edit, [tSel.formType]: { ...(st.edit[tSel.formType] || {}), [k]: v } }, tdone: '' });
    return {
      theme, pendingN: c.PENDING || 0, q: st.q,
      setQ: (e) => { const v = e.target.value; this.setState({ q: v }); clearTimeout(this.qt); this.qt = setTimeout(() => this.load(), 300); },
      tplBtn: st.tpl ? 'btn pr' : 'btn', toggleTpl: () => { const on = !st.tpl; this.setState({ tpl: on, set: false }); if (on && !st.tpls) this.loadTpl(); },
      setBtn: st.set ? 'btn pr' : 'btn', toggleSet: () => { const on = !st.set; this.setState({ set: on, tpl: false }); if (on && !st.ct) this.loadCloud(); },
      showList: !st.tpl && !st.set, showTpl: !!st.tpl && !st.set, showSet: !!st.set,
      modes: [['off', 'Off'], ['linked', 'Office PC sender (linked phone)'], ['cloud', 'Official WhatsApp API']].map(([k, label]) => ({ label, cls: (cfg.mode || 'linked') === k ? 'btn pr' : 'btn', pick: () => this.setState({ cfg: { ...cfg, mode: k }, sdone: 'Not saved yet' }) })),
      modeNote: ({ off: 'Messages are still listed here, nothing is sent automatically.', linked: 'Messages are sent by the WhatsApp Sender program on an office PC, using a phone linked by QR code (as the old software did).', cloud: "Messages are sent by the YarnFlow server through Meta's official API using approved templates; a bill's text and PDF go as one message. Delivered / read ticks come back from Meta." })[cfg.mode || 'linked'],
      fields: [['phoneNumberId', 'Phone number ID', 'text', '15 digits, from API Setup'], ['wabaId', 'Business account ID', 'text', 'WhatsApp Business Account ID'], ['appId', 'App ID', 'text', 'Meta app ID'], ['accessToken', 'Access token', 'password', 'permanent token'], ['appSecret', 'App secret', 'password', 'for checking webhook calls (recommended)'], ['displayNumber', 'WhatsApp number', 'text', 'for your reference']].map(([k, label, type, ph]) => ({ k: 'wa-' + k, label, type, ph, v: cfg[k] || '', set: (e) => this.setState({ cfg: { ...cfg, [k]: e.target.value }, sdone: 'Not saved yet' }) })),
      hookUrl: (typeof window !== 'undefined' ? window.location.origin : '') + '/api/whatsapp/webhook', verifyToken: cfg.verifyToken || '(created when you save)',
      sdone: st.sdone || '',
      saveSet: async () => { const api = this.api(); if (!api) return; try { const s = await api.put('/whatsapp/settings', cfg); this.setState({ cfg: s, sdone: '✓ Saved' }); this.load(); } catch (e) { this.setState({ sdone: api.message(e) }); } },
      refreshTpl: () => this.loadCloud(),
      submitTpl: async () => { const api = this.api(); if (!api) return; this.setState({ ctNote: 'Sending to Meta…' }); try { const r = await api.post('/whatsapp/cloud/templates/submit', {}); const bad = r.filter((x) => /^error/.test(x.result)); this.setState({ ctNote: bad.length ? bad.map((x) => x.name + ': ' + x.result).join(' · ') : 'Sent. Meta usually approves utility templates within minutes to a day.' }); await this.loadCloud(); } catch (e) { this.setState({ ctNote: api.message(e) }); } },
      tplNote: st.ctNote || 'Each message wording must be approved once by Meta before it can be sent.',
      ctpls: ((st.ct || {}).texts || []).map((t) => { const s = ((st.ct || {}).status || []).find((x) => x.name === t.name) || {}; const stx = s.status || 'NOT SUBMITTED'; return { label: t.label, name: t.name, status: stx, reason: s.reason ? 'Rejected: ' + s.reason : '', cls: 'tag ' + (stx === 'APPROVED' ? 't-green' : /REJECT|PAUSED|DISABLED/.test(stx) ? 't-red' : stx === 'NOT SUBMITTED' ? 't-gray' : 't-orange'), example: (t.doc ? '📎 PDF\n' : '') + t.example }; }),
      testTo: st.testTo || '', setTestTo: (e) => this.setState({ testTo: e.target.value }), tstDone: st.tstDone || '',
      testSend: async () => { const api = this.api(); if (!api) return; this.setState({ tstDone: 'Sending…' }); try { await api.post('/whatsapp/cloud/test', { to: st.testTo || '' }); this.setState({ tstDone: '✓ Sent — check the phone' }); } catch (e) { this.setState({ tstDone: api.message(e) }); } },
      filters: [['PENDING', 'To send'], ['SENT', 'Sent'], ['FAILED', 'Failed'], ['NO MOBILE', 'No mobile'], ['SKIPPED', 'Skipped'], ['ALL', 'All'], ['OLD', 'Old software']].map(([k, label]) => ({ label, n: k === 'ALL' ? Object.values(c).reduce((a, b) => a + b, 0) : k === 'OLD' ? '' : k === 'SENT' ? (c.SENT || 0) + (c.DELIVERED || 0) + (c.READ || 0) : c[k] || 0, cls: k === st.filter ? 'tab on' : 'tab', pick: () => this.load({ filter: k, selId: null }) })),
      forms: FORMS.map(([v, l]) => ({ v, l })), form: st.form, setForm: (e) => this.load({ form: e.target.value, selId: null }),
      from: st.from, to: st.to, setFrom: (e) => this.load({ from: e.target.value }), setTo: (e) => this.load({ to: e.target.value }),
      rows: rowsAll.map((m) => ({ short: SHORT[m.formType] || 'WA', no: (m.billNo || '—') + (m.msgType === 'PDF' ? ' · PDF' : ''), when: when(m.createdAt), line: (m.mobile ? '+' + m.mobile + ' · ' : '') + String(m.msgType === 'PDF' ? m.caption || '' : m.body || '').replace(/[*\n]+/g, ' ').slice(0, 80), status: m.status === 'READ' ? 'READ ✓✓' : m.status === 'DELIVERED' ? 'DELIVERED ✓✓' : m.status, tagCls: 'tag ' + tone(m.status), cls: selM && m.id === selM.id ? 'item on' : 'item', pick: () => this.setState({ selId: m.id, done: '' }) })),
      listNote: st.live ? (rowsAll.length >= 500 ? 'Showing the latest 500 — narrow by date or search.' : rowsAll.length ? '' : 'No messages.') : 'Loading…',
      sel, done: st.done || '',
      sendLabel: selM && selM.msgType === 'PDF' ? 'Send PDF link on WhatsApp' : 'Send on WhatsApp',
      pdfLabel: selM && selM.attachment ? 'Open PDF' : 'No PDF',
      senderTxt: (() => { if (cfg.mode === 'cloud') return '● Official WhatsApp API'; if (cfg.mode === 'off') return 'Sending off'; const b = st.sender; if (!b) return 'Sender not running'; const age = (Date.now() - new Date(b.at).getTime()) / 1000; return age < 60 ? '● Sender running' : 'Sender stopped ' + Math.round(age / 60) + ' min ago'; })(),
      senderCls: (() => { if (cfg.mode === 'cloud') return 'tag t-green'; const b = st.sender; return 'tag ' + (b && (Date.now() - new Date(b.at).getTime()) < 60000 ? 't-green' : 't-red'); })(),
      senderTip: st.sender ? 'Sending from WhatsApp ' + (st.sender.info || '') : 'Start the WhatsApp Sender on the office PC so messages go out automatically',
      retry: async () => { const api = this.api(); if (!api || !selM) return; try { await api.post('/whatsapp/messages/' + selM.id + '/retry', {}); this.setState({ done: 'Queued again' }); await this.load(); } catch (e) { this.setState({ done: api.message(e) }); } },
      hint: cfg.mode === 'cloud' ? 'Messages go out automatically through the official WhatsApp API as soon as a document is saved. Send on WhatsApp and Mark as sent are only for sending one by hand.' : 'Messages go out automatically while the WhatsApp Sender runs on the office PC. If it is not running, Send opens WhatsApp with the number and text filled in. Press send there, then come back and click Mark as sent. For a PDF, open it, save it, and attach it in the chat.',
      send: () => { if (!selM || !selM.mobile) { this.setState({ done: 'Add a mobile number on the party first' }); return; } try { window.open('https://wa.me/' + selM.mobile + '?text=' + encodeURIComponent(text(selM)), '_blank', 'noopener'); } catch (e) {} },
      openPdf: () => { if (selM && selM.attachment) try { window.open(pdfUrl(selM), '_blank', 'noopener'); } catch (e) {} },
      markSent: () => this.mark(selM, 'SENT'), skip: () => this.mark(selM, 'SKIPPED'),
      tpls: tpls.map((t) => ({ short: SHORT[t.formType] || 'WA', label: LBL[t.formType] || t.formType, note: (t.isActive ? 'Automatic' : 'Off') + (t.attachPdf ? ' · with PDF' : '') + ((t.extraReports || []).length ? ' · + ' + t.extraReports.map((x) => (x.report || x.name || x) + (x.to ? ' PDF to ' + x.to : '')).join(', ') : ''), cls: tSel && t.formType === tSel.formType ? 'item on' : 'item', pick: () => this.setState({ tsel: t.formType, tdone: '' }) })),
      tsel: tSel ? { label: LBL[tSel.formType] || tSel.formType, body: tSel.body || '', pdf: !!tSel.attachPdf, active: !!tSel.isActive } : { label: st.tpls ? 'No templates' : 'Loading…', body: '', pdf: false, active: false },
      setBody: (e) => setT('body', e.target.value), togglePdf: (e) => setT('attachPdf', e.target.checked), toggleActive: (e) => setT('isActive', e.target.checked),
      tdone: st.tdone || '',
      saveTpl: async () => { const api = this.api(); if (!api || !tSel) return; try { await api.put('/whatsapp/templates', { formType: tSel.formType, body: tSel.body, attachPdf: tSel.attachPdf, isActive: tSel.isActive }); const ed = { ...st.edit }; delete ed[tSel.formType]; this.setState({ edit: ed, tdone: '✓ Saved' }); await this.loadTpl(); } catch (e) { this.setState({ tdone: api.message(e) }); } }
    };
  }
}

/* ----- view ----- */
class WhatsAppView extends Component {
  render() {
    const v = this.renderVals() || {};
    return (
      <>
        <style>{CSS}</style>
      <div className={`app ${v.theme ?? ""}`}>
        <div className="sbw">
          <Sidebar active="wa" />
        </div>
        <div className="main">
          <header className="hdr">
            <div className="bc">
              <span>
                WhatsApp messages
              </span>
              <span className="tag t-orange">
                {v.pendingN}{" to send"}
              </span>
              <span className={v.senderCls} title={v.senderTip}>
                {v.senderTxt}
              </span>
            </div>
            <input className="inp" type="search" placeholder="Bill no, mobile or text" aria-label="Search messages" style={{"width":"240px"}} value={v.q} onChange={v.setQ} />
            {' '}
            <button className={v.tplBtn} type="button" onClick={v.toggleTpl}>
              Message templates
            </button>
            {' '}
            <button className={v.setBtn} type="button" onClick={v.toggleSet}>
              WhatsApp setup
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
                    <select className="inp" aria-label="Message type" value={v.form} onChange={v.setForm}>
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
                                {it?.no}
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
                      <div style={{"fontSize":"20px","lineHeight":"28px","fontWeight":"600"}}>
                        {v.sel?.no}
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
                    <pre className="msg">
                      {v.sel?.body}
                    </pre>
                    <div style={{"display":"flex","gap":"8px","flexWrap":"wrap","alignItems":"center"}}>
                      <button className="btn ok" type="button" onClick={v.send}>
                        {v.sendLabel}
                      </button>
                      {' '}
                      <button className="btn" type="button" onClick={v.openPdf}>
                        {v.pdfLabel}
                      </button>
                      {' '}
                      <button className="btn" type="button" onClick={v.markSent}>
                        Mark as sent
                      </button>
                      {' '}
                      <button className="btn no" type="button" onClick={v.skip}>
                        Skip
                      </button>
                      {' '}
                      <button className="btn" type="button" onClick={v.retry}>
                        Send again
                      </button>
                      <div style={{"flex":"1"}} />
                      <span className="muted" style={{"fontSize":"13px"}}>
                        {v.done}
                      </span>
                    </div>
                    {v.sel?.error ? (
                      <>
                        <div className="t-red tag" style={{"height":"auto","padding":"6px 10px","whiteSpace":"normal"}}>
                          {v.sel?.error}
                        </div>
                      </>
                    ) : null}
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
              <div style={{"padding":"20px 24px","display":"flex","flexDirection":"column","gap":"18px","maxWidth":"1100px"}}>
                <div className="box" style={{"display":"flex","flexDirection":"column","gap":"12px"}}>
                  <div style={{"fontSize":"17px","fontWeight":"600"}}>
                    How messages are sent
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
                  <div className="t2" style={{"fontSize":"13px"}}>
                    {v.modeNote}
                  </div>
                </div>
                <div className="box" style={{"display":"flex","flexDirection":"column","gap":"10px"}}>
                  <div style={{"fontSize":"17px","fontWeight":"600"}}>
                    Official WhatsApp API (Meta)
                  </div>
                  <div className="muted" style={{"fontSize":"13px"}}>
                    From Meta → WhatsApp Manager / your app's WhatsApp → API Setup. The access token should be a permanent System User token.
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
                  <div className="kv">
                    <span className="k">
                      Webhook URL
                    </span>
                    <span className="v" style={{"userSelect":"all"}}>
                      {v.hookUrl}
                    </span>
                  </div>
                  <div className="kv">
                    <span className="k">
                      Verify token
                    </span>
                    <span className="v" style={{"userSelect":"all"}}>
                      {v.verifyToken}
                    </span>
                  </div>
                  <div style={{"display":"flex","gap":"8px","alignItems":"center"}}>
                    <button className="btn pr" type="button" onClick={v.saveSet}>
                      Save
                    </button>
                    <span className="muted" style={{"fontSize":"13px"}}>
                      {v.sdone}
                    </span>
                  </div>
                </div>
                <div className="box" style={{"display":"flex","flexDirection":"column","gap":"10px"}}>
                  <div style={{"display":"flex","alignItems":"center","gap":"8px","flexWrap":"wrap"}}>
                    <div style={{"fontSize":"17px","fontWeight":"600","flex":"1"}}>
                      Message templates at Meta
                    </div>
                    <button className="btn" type="button" onClick={v.refreshTpl}>
                      Refresh status
                    </button>
                    <button className="btn pr" type="button" onClick={v.submitTpl}>
                      Send templates for approval
                    </button>
                  </div>
                  <div className="muted" style={{"fontSize":"13px"}}>
                    {v.tplNote}
                  </div>
                  {(v.ctpls || []).map((t, $index) => (
                    <Fragment key={$index}>
                      <div style={{"borderTop":"1px solid var(--bd)","paddingTop":"10px","display":"flex","flexDirection":"column","gap":"6px"}}>
                        <div style={{"display":"flex","gap":"8px","alignItems":"center"}}>
                          <b style={{"fontWeight":"500","flex":"1"}}>
                            {t?.label}{" "}
                            <span className="muted" style={{"fontWeight":"400"}}>
                              {"· "}{t?.name}
                            </span>
                          </b>
                          <span className={t?.cls}>
                            {t?.status}
                          </span>
                        </div>
                        <div className="t-red" style={{"fontSize":"13px"}}>
                          {t?.reason}
                        </div>
                        <pre className="msg" style={{"maxHeight":"220px"}}>
                          {t?.example}
                        </pre>
                      </div>
                    </Fragment>
                  ))}
                </div>
                <div className="box" style={{"display":"flex","gap":"8px","alignItems":"center","flexWrap":"wrap"}}>
                  <div style={{"fontSize":"17px","fontWeight":"600","flex":"1 1 100%"}}>
                    Test
                  </div>
                  <input className="inp" placeholder="Mobile number" aria-label="Test mobile number" value={v.testTo} onChange={v.setTestTo} style={{"width":"200px"}} />
                  {' '}
                  <button className="btn" type="button" onClick={v.testSend}>
                    Send a test receipt message
                  </button>
                  <span className="muted" style={{"fontSize":"13px"}}>
                    {v.tstDone}
                  </span>
                </div>
              </div>
            </>
          ) : null}
          {' '}
          {v.showTpl ? (
            <>
              <div className="split">
                <div className="lp">
                  {(v.tpls || []).map((t, $index) => (
                    <Fragment key={$index}>
                      <button className={t?.cls} type="button" onClick={t?.pick}>
                        <span className="ico">
                          {t?.short}
                        </span>
                        <span style={{"flex":"1","minWidth":"0","display":"flex","flexDirection":"column","gap":"4px"}}>
                          <b style={{"fontWeight":"500"}}>
                            {t?.label}
                          </b>
                          <span className="muted" style={{"fontSize":"13px"}}>
                            {t?.note}
                          </span>
                        </span>
                      </button>
                    </Fragment>
                  ))}
                </div>
                <div className="rp" style={{"padding":"20px 24px","gap":"12px"}}>
                  <div style={{"fontSize":"20px","lineHeight":"28px","fontWeight":"600"}}>
                    {v.tsel?.label}
                  </div>
                  <div className="muted" style={{"fontSize":"13px"}}>
                    {"Fields in {#…#} are filled from the document. The part between the two ---ITEMDETAIL--- lines repeats for every item."}
                  </div>
                  <textarea className="inp" aria-label="Template text" style={{"height":"420px","fontFamily":"ui-monospace, Menlo, monospace","fontSize":"13px"}} value={v.tsel?.body} onChange={v.setBody} />
                  {' '}
                  <label style={{"display":"flex","gap":"8px","alignItems":"center"}}>
                    <input type="checkbox" checked={v.tsel?.pdf} onChange={v.togglePdf} />
                    {" Also send the document PDF"}
                  </label>
                  {' '}
                  <label style={{"display":"flex","gap":"8px","alignItems":"center"}}>
                    <input type="checkbox" checked={v.tsel?.active} onChange={v.toggleActive} />
                    {" Send this message automatically when the document is saved"}
                  </label>
                  <div style={{"display":"flex","gap":"8px","alignItems":"center"}}>
                    <button className="btn pr" type="button" onClick={v.saveTpl}>
                      Save template
                    </button>
                    <span className="muted" style={{"fontSize":"13px"}}>
                      {v.tdone}
                    </span>
                  </div>
                </div>
              </div>
            </>
          ) : null}
        </div>
        <div className="aiw">
          <Assistant page="wa" />
        </div>
      </div>
      </>
    );
  }
}

export default function WhatsApp(props) {
  const theme = useTheme();
  return <WhatsAppView {...props} theme={theme} />;
}
