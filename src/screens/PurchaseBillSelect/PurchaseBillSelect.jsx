/* eslint-disable */
// PurchaseBillSelect — converted 1:1 from the YarnFlow design (PurchaseBillSelect.dc.html).
// Markup, styles, sample data and behaviour are identical to the design.
import { Fragment } from 'react';
import { DCLogic, useTheme } from '@/dc/runtime';
import PurchaseBill from '@/screens/PurchaseBill/PurchaseBill';

import CSS from './PurchaseBillSelect.css?raw';

/* ----- screen logic (same as the design) ----- */
class Component extends DCLogic {
  renderVals() { return {}; }
}

/* ----- view ----- */
class PurchaseBillSelectView extends Component {
  render() {
    const v = this.renderVals() || {};
    return (
      <>
        <style>{CSS}</style>
      <div style={{"height":"100vh","background":"#141414"}}>
        <PurchaseBill startPicker={true} />
      </div>
      </>
    );
  }
}

export default function PurchaseBillSelect(props) {
  const theme = useTheme();
  return <PurchaseBillSelectView {...props} theme={theme} />;
}
