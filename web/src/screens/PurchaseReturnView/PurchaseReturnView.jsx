/* eslint-disable */
// PurchaseReturnView — converted 1:1 from the YarnFlow design (PurchaseReturnView.dc.html).
// Markup, styles, sample data and behaviour are identical to the design.
import { Fragment } from 'react';
import { DCLogic, useTheme } from '@/dc/runtime';
import VoucherEntry from '@/components/VoucherEntry/VoucherEntry';

import CSS from './PurchaseReturnView.css?raw';

/* ----- screen logic (same as the design) ----- */
class Component extends DCLogic {
  renderVals() { return {}; }
}

/* ----- view ----- */
class PurchaseReturnViewView extends Component {
  render() {
    const v = this.renderVals() || {};
    return (
      <>
        <style>{CSS}</style>
      <div style={{"height":"100vh","background":"#141414"}}>
        <VoucherEntry kind="pr" mode="view" />
      </div>
      </>
    );
  }
}

export default function PurchaseReturnView(props) {
  const theme = useTheme();
  return <PurchaseReturnViewView {...props} theme={theme} />;
}
