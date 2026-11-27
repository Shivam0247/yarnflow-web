/* eslint-disable */
// Share — converted 1:1 from the YarnFlow design (Share.dc.html).
// Markup, styles, sample data and behaviour are identical to the design.
import { Fragment } from 'react';
import { DCLogic, useTheme } from '@/dc/runtime';

import CSS from './Share.css?raw';

/* ----- screen logic (same as the design) ----- */
class Component extends DCLogic {
  constructor(p) { super(p); this.state = { busy: false, msg: '', err: false }; }
  api() { return typeof window !== 'undefined' && window.YF_API && window.YF_API.session ? window.YF_API : null; }
  componentWillUnmount() { clearTimeout(this.t); }
  say(msg, err) { this.setState({ msg, err: !!err, busy: false }); clearTimeout(this.t); this.t = setTimeout(() => this.setState({ msg: '' }), err ? 7000 : 4000); }
  async send(channel) {
    const api = this.api(); const vid = String(this.props.vid || ''); const os = String(this.props.os || '');
    if (!api) return;
    if (!vid && !os) { this.say('Save the document first', true); return; }
    this.setState({ busy: true, msg: channel === 'email' ? 'Sending email…' : 'Sending on WhatsApp…', err: false });
    try {
      const r = os ? await api.post('/share/outstanding', { qs: os, channel }) : await api.post('/share/' + channel + '/' + vid, {});
      const who = r.sent ? r.sent.join(', ') : r.to;
      this.say((channel === 'email' ? '✉ Sending email to ' : '✓ Sending on WhatsApp to ') + (who || 'party') + (r.missing && r.missing.length ? ' · none for ' + r.missing.join(', ') : ''));
    } catch (e) { this.say(api.message(e), true); }
  }
  renderVals() {
    const st = this.state; const os = !!this.props.os;
    return {
      busy: st.busy, msg: st.msg, msgCls: st.err ? 'msg err' : 'msg',
      waTitle: os ? 'Send this outstanding to the party on WhatsApp' : 'Send to the party on WhatsApp',
      mailTitle: os ? 'Email this outstanding to the party' : 'Email to the party',
      wa: () => this.send('whatsapp'), mail: () => this.send('email')
    };
  }
}

/* ----- view ----- */
class ShareView extends Component {
  render() {
    const v = this.renderVals() || {};
    return (
      <>
        <style>{CSS}</style>
      <span className="shr">
        <button className="ib wa" type="button" title={v.waTitle} aria-label="Send on WhatsApp" onClick={v.wa} disabled={v.busy}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
            <path d="M9 10a.5.5 0 0 0 1 0V9a.5.5 0 0 0-1 0v1a5 5 0 0 0 5 5h1a.5.5 0 0 0 0-1h-1a.5.5 0 0 0 0 1" />
          </svg>
        </button>
        {' '}
        <button className="ib" type="button" title={v.mailTitle} aria-label="Send by email" onClick={v.mail} disabled={v.busy}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect width="20" height="16" x="2" y="4" rx="2" />
            <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
          </svg>
        </button>
        {' '}
        {v.msg ? (
          <>
            <span className={v.msgCls} role="status">
              {v.msg}
            </span>
          </>
        ) : null}
      </span>
      </>
    );
  }
}

export default function Share(props) {
  const theme = useTheme();
  return <ShareView {...props} theme={theme} />;
}
