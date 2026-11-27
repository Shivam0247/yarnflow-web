/* eslint-disable */
// OrderReport — converted 1:1 from the YarnFlow design (OrderReport.dc.html).
// Markup, styles, sample data and behaviour are identical to the design.
import { Fragment } from 'react';
import { DCLogic, useTheme } from '@/dc/runtime';
import ManageDesk from '@/screens/ManageDesk/ManageDesk';



/* ----- screen logic (same as the design) ----- */
class Component extends DCLogic {
  renderVals() { return { theme: this.props.theme ?? 'dark' }; }
}

/* ----- view ----- */
class OrderReportView extends Component {
  render() {
    const v = this.renderVals() || {};
    return (
      <>
        
      <ManageDesk mode="orders" />
      </>
    );
  }
}

export default function OrderReport(props) {
  const theme = useTheme();
  return <OrderReportView {...props} theme={theme} />;
}
