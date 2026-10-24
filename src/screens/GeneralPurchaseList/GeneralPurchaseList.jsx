/* eslint-disable */
// GeneralPurchaseList — converted 1:1 from the YarnFlow design (GeneralPurchaseList.dc.html).
// Markup, styles, sample data and behaviour are identical to the design.
import { Fragment } from 'react';
import { DCLogic, useTheme } from '@/dc/runtime';
import VoucherList from '@/components/VoucherList/VoucherList';

import CSS from './GeneralPurchaseList.css?raw';

/* ----- screen logic (same as the design) ----- */
class Component extends DCLogic {
  renderVals() { return {}; }
}

/* ----- view ----- */
class GeneralPurchaseListView extends Component {
  render() {
    const v = this.renderVals() || {};
    return (
      <>
        <style>{CSS}</style>
      <div style={{"height":"100vh","background":"#141414"}}>
        <VoucherList kind="gp" />
      </div>
      </>
    );
  }
}

export default function GeneralPurchaseList(props) {
  const theme = useTheme();
  return <GeneralPurchaseListView {...props} theme={theme} />;
}
