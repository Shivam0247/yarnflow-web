/* eslint-disable */
// Login — converted 1:1 from the YarnFlow design (Login.dc.html).
// Markup, styles, sample data and behaviour are identical to the design.
import { Fragment } from 'react';
import { DCLogic, useTheme, DcLink } from '@/dc/runtime';

import CSS from './Login.css?raw';

/* ----- screen logic (same as the design) ----- */
class Component extends DCLogic {
  constructor(p) { super(p); this.state = { email: '', password: '', show: false, remember: true, busy: false, err: '' }; }
  async submit(e) {
    if (e && e.preventDefault) e.preventDefault();
    const api = typeof window !== 'undefined' ? window.YF_API : null;
    if (!this.state.email || !this.state.password) { this.setState({ err: 'Enter your email and password' }); return; }
    if (!api) { this.setState({ err: '' }); return; } // design canvas: nothing to sign in to
    this.setState({ busy: true, err: '' });
    try { await api.login(this.state.email.trim(), this.state.password); api.go('/'); }
    catch (x) { this.setState({ busy: false, err: api.message(x) }); }
  }
  renderVals() {
    const st = this.state;
    return {
      theme: this.props.theme ?? 'dark',
      email: st.email, password: st.password, remember: st.remember, busy: st.busy, hasErr: !!st.err, err: st.err,
      pwType: st.show ? 'text' : 'password', pwLabel: st.show ? 'Hide' : 'Show', btnLabel: st.busy ? 'Signing in…' : 'Sign in',
      setEmail: (e) => this.setState({ email: e.target.value, err: '' }), setPassword: (e) => this.setState({ password: e.target.value, err: '' }),
      togglePw: () => this.setState({ show: !st.show }), toggleRemember: () => this.setState({ remember: !st.remember }),
      forgot: (e) => { if (e && e.preventDefault) e.preventDefault(); this.setState({ err: 'Ask your administrator to reset your password (Settings → Users).' }); },
      fillDemo: () => this.setState({ email: 'admin@yarnflow.in', password: 'Admin@123', err: '' }),
      submit: (e) => this.submit(e)
    };
  }
}

/* ----- view ----- */
class LoginView extends Component {
  render() {
    const v = this.renderVals() || {};
    return (
      <>
        <style>{CSS}</style>
      <div className={`lg ${v.theme ?? ""}`}>
        <aside className="lg-side">
          <div className="lg-brand">
            <span className="lg-logo">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                <circle cx="12" cy="12" r="9" />
                <path d="M5.5 6.5c4.5.5 9 4.5 10.5 12" />
                <path d="M3.4 10.5c4 0 7.8 3.2 8.8 10" />
                <path d="M9.5 3.3c3.5 2 6.6 6 7.6 11.6" />
              </svg>
            </span>
            <span>
              <span className="lg-name" style={{"display":"block"}}>
                YarnFlow
              </span>
              <span className="lg-sub">
                Yarn trading ERP
              </span>
            </span>
          </div>
          <div className="lg-hero">
            <h1>
              Orders, bills, stock and accounts — in one place.
            </h1>
            <p>
              Sales and purchase orders, dispatch, GST bills with e-way bills, outstanding and ageing, ledgers and reports for your yarn business.
            </p>
            <div className="lg-pt">
              <i>
                ₹
              </i>
              <div>
                <b>
                  Outstanding that is always right
                </b>
                <span>
                  Party, group, broker and collection-person wise ageing.
                </span>
              </div>
            </div>
            <div className="lg-pt">
              <i>
                ⇄
              </i>
              <div>
                <b>
                  Order to bill in two clicks
                </b>
                <span>
                  Pick a dispatch schedule and the bill fills itself.
                </span>
              </div>
            </div>
            <div className="lg-pt">
              <i>
                ▦
              </i>
              <div>
                <b>
                  Lot-wise stock
                </b>
                <span>
                  Every carton, lot and grade across godowns.
                </span>
              </div>
            </div>
          </div>
          <div className="lg-foot">
            © Shree Umiya Yarn Pvt Ltd · Surat
          </div>
        </aside>
        <main className="lg-main">
          <form className="lg-card" onSubmit={v.submit}>
            <h2>
              Sign in
            </h2>
            <div className="muted">
              Use your YarnFlow account to continue.
            </div>
            <div className="lg-f">
              <label htmlFor="lg-email">
                Email
              </label>
              <input id="lg-email" className="inp" type="email" autoComplete="username" placeholder="you@company.in" value={v.email} onChange={v.setEmail} />
            </div>
            <div className="lg-f">
              <label htmlFor="lg-pw">
                Password
              </label>
              <div className="lg-pw">
                <input id="lg-pw" className="inp" type={v.pwType} autoComplete="current-password" placeholder="Your password" value={v.password} onChange={v.setPassword} />
                <button type="button" onClick={v.togglePw}>
                  {v.pwLabel}
                </button>
              </div>
            </div>
            <div className="lg-row">
              <label>
                <input type="checkbox" checked={v.remember} onChange={v.toggleRemember} style={{"accentColor":"#3B82F6"}} />
                Keep me signed in
              </label>
              <DcLink href="#" onClick={v.forgot}>
                Forgot password?
              </DcLink>
            </div>
            {v.hasErr ? (
              <>
                <div className="lg-err" role="alert">
                  {v.err}
                </div>
              </>
            ) : null}
            {' '}
            <button className="btn pr" type="submit" disabled={v.busy}>
              {v.busy ? (
                <>
                  <span className="spin" />
                </>
              ) : null}
              {v.btnLabel}
            </button>
            <div className="lg-demo">
              <b>
                Demo logins
              </b>
              {" — admin@yarnflow.in / Admin@123 · sales@yarnflow.in / Sales@123 · accounts@yarnflow.in / Accounts@123 · "}
              <button type="button" onClick={v.fillDemo}>
                fill admin
              </button>
            </div>
          </form>
        </main>
      </div>
      </>
    );
  }
}

export default function Login(props) {
  const theme = useTheme();
  return <LoginView {...props} theme={theme} />;
}
