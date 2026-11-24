/* eslint-disable */
// JournalVoucherView — converted 1:1 from the YarnFlow design (JournalVoucherView.dc.html).
// Markup, styles, sample data and behaviour are identical to the design.
import { Fragment } from 'react';
import { DCLogic, useTheme } from '@/dc/runtime';
import JournalForm from '@/components/JournalForm/JournalForm';

import CSS from './JournalVoucherView.css?raw';

/* ----- screen logic (same as the design) ----- */
class Component extends DCLogic {
  renderVals() { return {}; }
}

/* ----- view ----- */
class JournalVoucherViewView extends Component {
  render() {
    const v = this.renderVals() || {};
    return (
      <>
        <style>{CSS}</style>
      <div style={{"height":"100vh","background":"#141414"}}>
        <JournalForm kind="jv" mode="view" />
      </div>
      </>
    );
  }
}

export default function JournalVoucherView(props) {
  const theme = useTheme();
  return <JournalVoucherViewView {...props} theme={theme} />;
}
