/* eslint-disable */
// ReceiptRegister — converted 1:1 from the YarnFlow design (ReceiptRegister.dc.html).
// Markup, styles, sample data and behaviour are identical to the design.
import { Fragment } from 'react';
import { DCLogic, useTheme } from '@/dc/runtime';
import VoucherList from '@/components/VoucherList/VoucherList';

import CSS from './ReceiptRegister.css?raw';

/* ----- screen logic (same as the design) ----- */
class Component extends DCLogic {
  renderVals() { return {}; }
}

/* ----- view ----- */
class ReceiptRegisterView extends Component {
  render() {
    const v = this.renderVals() || {};
    return (
      <>
        <style>{CSS}</style>
      <div style={{"height":"100vh","background":"#141414"}}>
        <VoucherList kind="rc" />
      </div>
      </>
    );
  }
}

export default function ReceiptRegister(props) {
  const theme = useTheme();
  return <ReceiptRegisterView {...props} theme={theme} />;
}
