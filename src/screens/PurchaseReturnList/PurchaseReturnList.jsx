/* eslint-disable */
// PurchaseReturnList — converted 1:1 from the YarnFlow design (PurchaseReturnList.dc.html).
// Markup, styles, sample data and behaviour are identical to the design.
import { Fragment } from 'react';
import { DCLogic, useTheme } from '@/dc/runtime';
import VoucherList from '@/components/VoucherList/VoucherList';

import CSS from './PurchaseReturnList.css?raw';

/* ----- screen logic (same as the design) ----- */
class Component extends DCLogic {
  renderVals() { return {}; }
}

/* ----- view ----- */
class PurchaseReturnListView extends Component {
  render() {
    const v = this.renderVals() || {};
    return (
      <>
        <style>{CSS}</style>
      <div style={{"height":"100vh","background":"#141414"}}>
        <VoucherList kind="pr" />
      </div>
      </>
    );
  }
}

export default function PurchaseReturnList(props) {
  const theme = useTheme();
  return <PurchaseReturnListView {...props} theme={theme} />;
}
