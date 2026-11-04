/* eslint-disable */
// CreditNoteEntry — converted 1:1 from the YarnFlow design (CreditNoteEntry.dc.html).
// Markup, styles, sample data and behaviour are identical to the design.
import { Fragment } from 'react';
import { DCLogic, useTheme } from '@/dc/runtime';
import VoucherEntry from '@/components/VoucherEntry/VoucherEntry';

import CSS from './CreditNoteEntry.css?raw';

/* ----- screen logic (same as the design) ----- */
class Component extends DCLogic {
  renderVals() { return {}; }
}

/* ----- view ----- */
class CreditNoteEntryView extends Component {
  render() {
    const v = this.renderVals() || {};
    return (
      <>
        <style>{CSS}</style>
      <div style={{"height":"100vh","background":"#141414"}}>
        <VoucherEntry kind="cn" mode="new" />
      </div>
      </>
    );
  }
}

export default function CreditNoteEntry(props) {
  const theme = useTheme();
  return <CreditNoteEntryView {...props} theme={theme} />;
}
