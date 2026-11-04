/* eslint-disable */
// SaleReturnView — converted 1:1 from the YarnFlow design (SaleReturnView.dc.html).
// Markup, styles, sample data and behaviour are identical to the design.
import { Fragment } from 'react';
import { DCLogic, useTheme } from '@/dc/runtime';
import VoucherEntry from '@/components/VoucherEntry/VoucherEntry';

import CSS from './SaleReturnView.css?raw';

/* ----- screen logic (same as the design) ----- */
class Component extends DCLogic {
  renderVals() { return {}; }
}

/* ----- view ----- */
class SaleReturnViewView extends Component {
  render() {
    const v = this.renderVals() || {};
    return (
      <>
        <style>{CSS}</style>
      <div style={{"height":"100vh","background":"#141414"}}>
        <VoucherEntry kind="sr" mode="view" />
      </div>
      </>
    );
  }
}

export default function SaleReturnView(props) {
  const theme = useTheme();
  return <SaleReturnViewView {...props} theme={theme} />;
}
