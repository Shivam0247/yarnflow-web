/* eslint-disable */
// ReceiptReturnRegister — converted 1:1 from the YarnFlow design (ReceiptReturnRegister.dc.html).
// Markup, styles, sample data and behaviour are identical to the design.
import { Fragment } from 'react';
import { DCLogic, useTheme } from '@/dc/runtime';
import VoucherList from '@/components/VoucherList/VoucherList';

import CSS from './ReceiptReturnRegister.css?raw';

/* ----- screen logic (same as the design) ----- */
class Component extends DCLogic {
  renderVals() { return {}; }
}

/* ----- view ----- */
class ReceiptReturnRegisterView extends Component {
  render() {
    const v = this.renderVals() || {};
    return (
      <>
        <style>{CSS}</style>
      <div style={{"height":"100vh","background":"#141414"}}>
        <VoucherList kind="rr" />
      </div>
      </>
    );
  }
}

export default function ReceiptReturnRegister(props) {
  const theme = useTheme();
  return <ReceiptReturnRegisterView {...props} theme={theme} />;
}
