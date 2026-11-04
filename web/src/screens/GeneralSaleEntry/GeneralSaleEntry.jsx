/* eslint-disable */
// GeneralSaleEntry — converted 1:1 from the YarnFlow design (GeneralSaleEntry.dc.html).
// Markup, styles, sample data and behaviour are identical to the design.
import { Fragment } from 'react';
import { DCLogic, useTheme } from '@/dc/runtime';
import VoucherEntry from '@/components/VoucherEntry/VoucherEntry';

import CSS from './GeneralSaleEntry.css?raw';

/* ----- screen logic (same as the design) ----- */
class Component extends DCLogic {
  renderVals() { return {}; }
}

/* ----- view ----- */
class GeneralSaleEntryView extends Component {
  render() {
    const v = this.renderVals() || {};
    return (
      <>
        <style>{CSS}</style>
      <div style={{"height":"100vh","background":"#141414"}}>
        <VoucherEntry kind="gs" mode="new" />
      </div>
      </>
    );
  }
}

export default function GeneralSaleEntry(props) {
  const theme = useTheme();
  return <GeneralSaleEntryView {...props} theme={theme} />;
}
