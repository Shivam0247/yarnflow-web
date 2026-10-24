/* eslint-disable */
// DispatchScheduleList — converted 1:1 from the YarnFlow design (DispatchScheduleList.dc.html).
// Markup, styles, sample data and behaviour are identical to the design.
import { Fragment } from 'react';
import { DCLogic, useTheme } from '@/dc/runtime';
import VoucherList from '@/components/VoucherList/VoucherList';

import CSS from './DispatchScheduleList.css?raw';

/* ----- screen logic (same as the design) ----- */
class Component extends DCLogic {
  renderVals() { return {}; }
}

/* ----- view ----- */
class DispatchScheduleListView extends Component {
  render() {
    const v = this.renderVals() || {};
    return (
      <>
        <style>{CSS}</style>
      <div style={{"height":"100vh","background":"#141414"}}>
        <VoucherList kind="ds" />
      </div>
      </>
    );
  }
}

export default function DispatchScheduleList(props) {
  const theme = useTheme();
  return <DispatchScheduleListView {...props} theme={theme} />;
}
