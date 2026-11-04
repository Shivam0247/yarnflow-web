/* eslint-disable */
// SalesOrderView — converted 1:1 from the YarnFlow design (SalesOrderView.dc.html).
// Markup, styles, sample data and behaviour are identical to the design.
import { Fragment } from 'react';
import { DCLogic, useTheme } from '@/dc/runtime';
import SalesOrderEntry from '@/screens/SalesOrderEntry/SalesOrderEntry';

import CSS from './SalesOrderView.css?raw';

/* ----- screen logic (same as the design) ----- */
class Component extends DCLogic {
  renderVals() { return {}; }
}

/* ----- view ----- */
class SalesOrderViewView extends Component {
  render() {
    const v = this.renderVals() || {};
    return (
      <>
        <style>{CSS}</style>
      <div style={{"height":"100vh","background":"#141414"}}>
        <SalesOrderEntry mode="view" />
      </div>
      </>
    );
  }
}

export default function SalesOrderView(props) {
  const theme = useTheme();
  return <SalesOrderViewView {...props} theme={theme} />;
}
