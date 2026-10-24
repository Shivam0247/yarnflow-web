# YarnFlow Web (React + Vite)

This is the YarnFlow ERP front end. Every screen was converted 1:1 from the Claude Design file, so the markup, styles, sample data and behaviour match the design exactly. Nothing has been added and nothing has been left out.

## Run it

You need Node.js 18 or newer.

```bash
npm install
npm run dev        # starts the app at http://localhost:5173
npm run build      # builds a production version into dist/
npm run preview    # serves the built dist/ folder
```

## Folder structure

```
src/
  main.tsx                 Router. Each design screen is one route, and screens are lazy-loaded.
  app/routes.ts            Route path for every screen, for example SalesOrderList → /sales/orders
  dc/runtime.tsx           Shared helpers: DCLogic base class, useTheme, DcLink (design link → route), sx (style string → object)
  components/              Reusable building blocks that screens use
    Sidebar/               Collapsible left navigation (Sidebar.jsx + Sidebar.css)
    Assistant/             Right-side AI assistant: icon rail and chat panel
    VoucherList/           One register used for dispatch schedule, general sale/purchase and sale/purchase returns (kind = ds | gs | gp | sr | pr)
    VoucherEntry/          One entry/view form for the same five voucher types (mode = new | view)
  screens/                 One folder per design screen, each with <Screen>.jsx and <Screen>.css
    Main/                  Dashboard
    Approvals/
    SalesOrderList/  SalesOrderEntry/  SalesOrderView/  SalesOrder/
    SaleBillList/  SaleBillSelect/  Dispatch/  EwayBills/
    DispatchSchedule*/  SaleReturn*/  GeneralSale*/
    PurchaseOrderList/  PurchaseOrderEntry/  PurchaseOrderView/  PurchaseOrder/
    PurchaseBillList/  PurchaseBillSelect/  PurchaseBill/
    PurchaseReturn*/  GeneralPurchase*/
    Payments/  Ledger/  Outstanding/  Reports/  Stock/
    Masters/  AccountMaster/  GroupMaster/  YarnMaster/  TransporterMaster/
```

## How a screen is built

Each screen file has three parts:

1. **Logic.** A `Component extends DCLogic` class with `state`, event handlers and `renderVals()`, which returns the values the view uses. This is a normal React class component.
2. **View.** `render()` returns the JSX, reading values from `v` (the output of `renderVals()`).
3. **Styles.** `<Screen>.css` is loaded only while that screen is on the page, so screens never clash with each other.

Where a screen shares parts with others, it uses the shared components (`<Sidebar active="so" />`, `<Assistant page="so" />`, `<VoucherList kind="ds" />`) instead of repeating code.

## Routes

| Screen | Path |
|---|---|
| Dashboard | `/` |
| Approvals | `/approvals` |
| Sales order register / new / view / record | `/sales/orders`, `/sales/orders/new`, `/sales/orders/view`, `/sales/orders/record` |
| Dispatch schedule | `/sales/dispatch-schedules` (+ `/new`, `/view`) |
| Sale bills / new bill (pick schedule) / bill | `/sales/bills`, `/sales/bills/new`, `/sales/bills/entry` |
| E-way bills | `/sales/eway-bills` |
| Sale returns / General sale | `/sales/returns`, `/sales/general` (+ `/new`, `/view`) |
| Purchase order register / new / view / record | `/purchase/orders`, `/purchase/orders/new`, `/purchase/orders/view`, `/purchase/orders/record` |
| Purchase bills / new / bill | `/purchase/bills`, `/purchase/bills/new`, `/purchase/bills/entry` |
| Purchase returns / General purchase | `/purchase/returns`, `/purchase/general` (+ `/new`, `/view`) |
| Payments, Ledger, Outstanding | `/accounts/payments`, `/accounts/ledger`, `/accounts/outstanding` |
| Reports, Stock | `/reports`, `/stock` |
| Masters | `/masters`, `/masters/accounts`, `/masters/groups`, `/masters/yarn`, `/masters/transporters` |

## Theme

Use the **Light mode / Dark mode** switch at the bottom of the sidebar (also in the collapsed sidebar). The choice is saved. Until you pick one, the app follows the computer's system setting. The same switch exists in the design. You can also set it from the browser console:

```js
localStorage.setItem('yf-theme', 'light')
```

## Connecting real data

The sample data sits in each screen's logic class, in the same arrays as the design. To use real data, replace those arrays with API calls, for example in `componentDidMount()`, and call `this.setState(...)` with the results. The view does not need to change.
