/* eslint-disable */
// DispatchScheduleEntry — converted 1:1 from the YarnFlow design (DispatchScheduleEntry.dc.html).
// Markup, styles, sample data and behaviour are identical to the design.
import { Fragment } from 'react';
import { DCLogic, useTheme } from '@/dc/runtime';
import VoucherEntry from '@/components/VoucherEntry/VoucherEntry';

import CSS from './DispatchScheduleEntry.css?raw';

/* ----- screen logic (same as the design) ----- */
class Component extends DCLogic {
  renderVals() { return {}; }
}

/* ----- view ----- */
class DispatchScheduleEntryView extends Component {
  render() {
    const v = this.renderVals() || {};
    return (
      <>
        <style>{CSS}</style>
      <div style={{"height":"100vh","background":"#141414"}}>
        <VoucherEntry kind="ds" mode="new" />
      </div>
      </>
    );
  }
}

export default function DispatchScheduleEntry(props) {
  const theme = useTheme();
  return <DispatchScheduleEntryView {...props} theme={theme} />;
}
