/* eslint-disable */
// JournalVoucherEntry — converted 1:1 from the YarnFlow design (JournalVoucherEntry.dc.html).
// Markup, styles, sample data and behaviour are identical to the design.
import { Fragment } from 'react';
import { DCLogic, useTheme } from '@/dc/runtime';
import JournalForm from '@/components/JournalForm/JournalForm';

import CSS from './JournalVoucherEntry.css?raw';

/* ----- screen logic (same as the design) ----- */
class Component extends DCLogic {
  renderVals() { return {}; }
}

/* ----- view ----- */
class JournalVoucherEntryView extends Component {
  render() {
    const v = this.renderVals() || {};
    return (
      <>
        <style>{CSS}</style>
      <div style={{"height":"100vh","background":"#141414"}}>
        <JournalForm kind="jv" mode="new" />
      </div>
      </>
    );
  }
}

export default function JournalVoucherEntry(props) {
  const theme = useTheme();
  return <JournalVoucherEntryView {...props} theme={theme} />;
}
