/* eslint-disable */
// GeneralPurchaseView — converted 1:1 from the YarnFlow design (GeneralPurchaseView.dc.html).
// Markup, styles, sample data and behaviour are identical to the design.
import { Fragment } from 'react';
import { DCLogic, useTheme } from '@/dc/runtime';
import VoucherEntry from '@/components/VoucherEntry/VoucherEntry';

import CSS from './GeneralPurchaseView.css?raw';

/* ----- screen logic (same as the design) ----- */
class Component extends DCLogic {
  renderVals() { return {}; }
}

/* ----- view ----- */
class GeneralPurchaseViewView extends Component {
  render() {
    const v = this.renderVals() || {};
    return (
      <>
        <style>{CSS}</style>
      <div style={{"height":"100vh","background":"#141414"}}>
        <VoucherEntry kind="gp" mode="view" />
      </div>
      </>
    );
  }
}

export default function GeneralPurchaseView(props) {
  const theme = useTheme();
  return <GeneralPurchaseViewView {...props} theme={theme} />;
}
