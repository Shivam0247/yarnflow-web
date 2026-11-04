/* eslint-disable */
// SaleBillSelect — converted 1:1 from the YarnFlow design (SaleBillSelect.dc.html).
// Markup, styles, sample data and behaviour are identical to the design.
import { Fragment } from 'react';
import { DCLogic, useTheme } from '@/dc/runtime';
import Dispatch from '@/screens/Dispatch/Dispatch';

import CSS from './SaleBillSelect.css?raw';

/* ----- screen logic (same as the design) ----- */
class Component extends DCLogic {
  renderVals() { return {}; }
}

/* ----- view ----- */
class SaleBillSelectView extends Component {
  render() {
    const v = this.renderVals() || {};
    return (
      <>
        <style>{CSS}</style>
      <div style={{"height":"100vh","background":"#141414"}}>
        <Dispatch startPicker={true} />
      </div>
      </>
    );
  }
}

export default function SaleBillSelect(props) {
  const theme = useTheme();
  return <SaleBillSelectView {...props} theme={theme} />;
}
