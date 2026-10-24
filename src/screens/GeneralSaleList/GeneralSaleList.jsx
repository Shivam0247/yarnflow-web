/* eslint-disable */
// GeneralSaleList — converted 1:1 from the YarnFlow design (GeneralSaleList.dc.html).
// Markup, styles, sample data and behaviour are identical to the design.
import { Fragment } from 'react';
import { DCLogic, useTheme } from '@/dc/runtime';
import VoucherList from '@/components/VoucherList/VoucherList';

import CSS from './GeneralSaleList.css?raw';

/* ----- screen logic (same as the design) ----- */
class Component extends DCLogic {
  renderVals() { return {}; }
}

/* ----- view ----- */
class GeneralSaleListView extends Component {
  render() {
    const v = this.renderVals() || {};
    return (
      <>
        <style>{CSS}</style>
      <div style={{"height":"100vh","background":"#141414"}}>
        <VoucherList kind="gs" />
      </div>
      </>
    );
  }
}

export default function GeneralSaleList(props) {
  const theme = useTheme();
  return <GeneralSaleListView {...props} theme={theme} />;
}
