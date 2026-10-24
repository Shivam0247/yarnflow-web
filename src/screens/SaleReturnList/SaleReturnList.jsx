/* eslint-disable */
// SaleReturnList — converted 1:1 from the YarnFlow design (SaleReturnList.dc.html).
// Markup, styles, sample data and behaviour are identical to the design.
import { Fragment } from 'react';
import { DCLogic, useTheme } from '@/dc/runtime';
import VoucherList from '@/components/VoucherList/VoucherList';

import CSS from './SaleReturnList.css?raw';

/* ----- screen logic (same as the design) ----- */
class Component extends DCLogic {
  renderVals() { return {}; }
}

/* ----- view ----- */
class SaleReturnListView extends Component {
  render() {
    const v = this.renderVals() || {};
    return (
      <>
        <style>{CSS}</style>
      <div style={{"height":"100vh","background":"#141414"}}>
        <VoucherList kind="sr" />
      </div>
      </>
    );
  }
}

export default function SaleReturnList(props) {
  const theme = useTheme();
  return <SaleReturnListView {...props} theme={theme} />;
}
