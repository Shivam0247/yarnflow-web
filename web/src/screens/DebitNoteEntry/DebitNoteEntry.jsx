/* eslint-disable */
// DebitNoteEntry — converted 1:1 from the YarnFlow design (DebitNoteEntry.dc.html).
// Markup, styles, sample data and behaviour are identical to the design.
import { Fragment } from 'react';
import { DCLogic, useTheme } from '@/dc/runtime';
import VoucherEntry from '@/components/VoucherEntry/VoucherEntry';

import CSS from './DebitNoteEntry.css?raw';

/* ----- screen logic (same as the design) ----- */
class Component extends DCLogic {
  renderVals() { return {}; }
}

/* ----- view ----- */
class DebitNoteEntryView extends Component {
  render() {
    const v = this.renderVals() || {};
    return (
      <>
        <style>{CSS}</style>
      <div style={{"height":"100vh","background":"#141414"}}>
        <VoucherEntry kind="dn" mode="new" />
      </div>
      </>
    );
  }
}

export default function DebitNoteEntry(props) {
  const theme = useTheme();
  return <DebitNoteEntryView {...props} theme={theme} />;
}
