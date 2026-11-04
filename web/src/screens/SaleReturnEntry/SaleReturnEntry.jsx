/* eslint-disable */
// SaleReturnEntry — converted 1:1 from the YarnFlow design (SaleReturnEntry.dc.html).
// Markup, styles, sample data and behaviour are identical to the design.
import { Fragment } from 'react';
import { DCLogic, useTheme } from '@/dc/runtime';
import VoucherEntry from '@/components/VoucherEntry/VoucherEntry';

import CSS from './SaleReturnEntry.css?raw';

/* ----- screen logic (same as the design) ----- */
class Component extends DCLogic {
  renderVals() { return {}; }
}

/* ----- view ----- */
class SaleReturnEntryView extends Component {
  render() {
    const v = this.renderVals() || {};
    return (
      <>
        <style>{CSS}</style>
      <div style={{"height":"100vh","background":"#141414"}}>
        <VoucherEntry kind="sr" mode="new" />
      </div>
      </>
    );
  }
}

export default function SaleReturnEntry(props) {
  const theme = useTheme();
  return <SaleReturnEntryView {...props} theme={theme} />;
}
