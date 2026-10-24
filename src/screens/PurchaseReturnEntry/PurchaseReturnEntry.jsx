/* eslint-disable */
// PurchaseReturnEntry — converted 1:1 from the YarnFlow design (PurchaseReturnEntry.dc.html).
// Markup, styles, sample data and behaviour are identical to the design.
import { Fragment } from 'react';
import { DCLogic, useTheme } from '@/dc/runtime';
import VoucherEntry from '@/components/VoucherEntry/VoucherEntry';

import CSS from './PurchaseReturnEntry.css?raw';

/* ----- screen logic (same as the design) ----- */
class Component extends DCLogic {
  renderVals() { return {}; }
}

/* ----- view ----- */
class PurchaseReturnEntryView extends Component {
  render() {
    const v = this.renderVals() || {};
    return (
      <>
        <style>{CSS}</style>
      <div style={{"height":"100vh","background":"#141414"}}>
        <VoucherEntry kind="pr" mode="new" />
      </div>
      </>
    );
  }
}

export default function PurchaseReturnEntry(props) {
  const theme = useTheme();
  return <PurchaseReturnEntryView {...props} theme={theme} />;
}
