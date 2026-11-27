# Old Creative ERP → YarnFlow screen checklist

Source of the list: every menu switched on for a user in the old `FormPermission` table (UMIYA24),
plus how often each entry screen was used (`UserTransactionLog`, up to 23-11-2026).

Status: **Same** = checked against the old screen/data · **Compare** = exists, field-by-field check pending ·
**Missing** = not built yet · **Not used** = switched on but never used in the log.

## Entry screens (by use in the old log)

| Old menu | Uses | YarnFlow | Status |
|---|---:|---|---|
| Purchase Bill (PUR) | 45,407 | Purchase bills | Compare |
| Dispatch Schedule (Trading) | 28,500 | Dispatch schedule | Compare |
| Sale Bill (SAL) | 26,629 | Sale bills | Compare |
| Bank Reciept Voucher | 19,764 | Bank receipt / payment | Compare |
| Sales Order Entry | 15,943 | Sales order | Compare |
| Debit Note | 5,674 | Debit note | Compare |
| Bank Payment Voucher | 4,180 | Bank receipt / payment | Compare |
| Party Master | 3,458 | Masters → Accounts | Compare |
| Purchase Order Entry | 2,161 | Purchase order | Compare |
| Delivery Challan (Box/Roll) | 1,871 | Sale bills (from dispatch) | Compare |
| Bank Reconsilation | 1,805 | Bank reconciliation | Compare |
| Broker Master | 1,657 | Masters → Brokers | Compare |
| Mistry (collection) master | 1,238 | Masters → Collection persons | Compare |
| Journal Voucher | 1,076 | Journal voucher | Compare |
| Sale Return Bill | 502 | Sale returns | Compare |
| Lot Master | 448 | Masters | Compare |
| Purchase General | 341 | General purchase | Compare |
| Vehical Master | 311 | Masters → Vehicles | Compare |
| Credit Note | 230 | Credit note | Compare |
| Sales General | 215 | General sale | Compare |
| Purchase Return Bill | 204 | Purchase returns | Compare |
| Item Master | 110 | Masters → Items | Compare |
| Book Master | 107 | Masters → Books | Compare |
| Go Down | 98 | Masters → Godowns | Compare |
| Bank Reciept Retun Voucher | 82 | Receipt return register | Compare |
| Block Party | 71 | Masters → Blocked parties | Compare |
| Cash Payment / Receipt | 61 | Bank receipt / payment | Compare |
| Tax Slab Master | 32 | Masters → HSN codes | Compare |
| Brand / Grade / Area / City / Item Group | 31 | Masters | Compare |
| Proprietor / Partner Ration Master | 8 | — | Missing |
| Merge Master | 5 | — | Missing |
| On Account (bank/cash) | 2 | Bank receipt / payment | Compare |
| Opening (party, sale, purchase, DN, CN) | — | Opening bills | Compare |
| Purchase Order / Sales Order Approval | — | Approvals | Compare |
| Goods Receive Entry (GRN) / GRN Return | — | — | Not used (0 in log) |
| Attendance Entry | — | — | Not used |

## Reports

| Old menu | YarnFlow | Status |
|---|---|---|
| Outstanding (Report Selection, Party Groupwise print) | Outstanding report (old format) | Same (3 sample PDFs) |
| Saved reports (RegisterReportsMst, 26) | /print/report/… | All 26 open (15 checked against old data, 11 new) |
| Final Report → Sold Unsold | Sold / Unsold | Same (totals match) |
| Purchase Pending Stock (Stock-F9) | Purchase stock | Same (3,074 lines match) |
| Pending Order form grid prints ("Purchase Report - Pending", Brandwise Sold-UnSold) | /print/grid/stock, /print/grid/brand | Same (old PDFs 11-11 and 14-11: same pages, positions within 0.5 pt) |
| Trading Stock / Trading Report | — | Missing |
| Account Ledger / Ledger | Ledgers | Compare |
| Account Confirmation Ledger | — | Missing |
| Multiple Ledger / Group Wise Ledger | — | Missing |
| Trail Balance / Profit Loss / Balance Sheet | Account reports | Compare |
| Cash Register / Bank Register / Bank CC-OD Report | — | Missing |
| Journals Register / Tds-Tcs Register | Account reports | Compare |
| Interest Calculation Register | Account reports → Interest | Compare |
| Sales Purchase Register / GST Register / All GST Register | Registers, GSTR | Compare |
| Monthly / Yearly Register / All Register | — | Missing |
| OutStanding Bill Wise / FIFO / FIFO Monthly / Aging Wise | Outstanding & ageing | Compare |
| Party Wise Summary | saved report 19/20 | Same |
| Sales Order Register / Purchase Order Register / Order Report | Registers | Compare |
| Dispatch Report / Dispatch Register (Box/Roll) | — | Missing |
| Packing Register / Packing Report / Packing Stock | — | Missing |
| Grn Register / Grn Return Register | — | Not used |
| Stock Ledger / Stock Ledger Item Wise | Stock & godowns | Compare |
| Item Group Wise Summary / Stock Pivot | — | Missing |
| MIS Report / MMS Report | — | Missing |
| Reporting Dashboard / Dash Board (Trading dashboard, FrmTrdDashboard) | Manage Desk | All 9 tabs built; saved formats checked against old totals; the team's saved grid layouts (Creatives\\Layout\\TradingDashboard) applied |
| Manage Desk (same screen as the trading dashboard) | Manage Desk | Built (Monthly Report and Order Status rebuilt from their columns — the old procedures were not in the export) |

## Utilities

| Old menu | YarnFlow | Status |
|---|---|---|
| Common Search | Search bar | Compare |
| Collection Menu / Payment Followup Entry | — | Missing |
| Pending Adjustment / Adjustment Module | — | Missing |
| AutoDebitNote (interest) | Interest → debit notes | Compare |
| Bank Reco Excel Base / Bank Cheque Book Inward | — | Missing |
| E-Invoice / Digital Signature / Download Bill | E-way bills | Compare |
| Purchase Bill Import (Excel) | — | Missing |
| Item+Brand+Grade Wise Rate Master | — | Missing |
| WhatsApp (automatic: Sale Order text + party outstanding PDF, Sale Bill text + PDF, Bank Receipt thank-you, Bank Payment cheque note, DN / CN / interest DN PDFs, scheduled report PDFs; 1,48,368 messages in the old data) | Messages → WhatsApp | Built: official WhatsApp API (Meta templates, text + PDF in one message, delivered/read ticks) or the office-PC sender; queued on save with the old wording (sale bill and receipt texts identical to old sent ones); one-click send through WhatsApp; templates editable; old messages kept as history. Automatic like the old software: the WhatsApp Sender (wa-sender folder) on an office PC sends each message within seconds of saving, from the office WhatsApp number |
| Email (EMailConfig, EmailLogMst — 56,465 old emails) | Messages → Email | Built: same subjects / text / PDF sent automatically through Gmail, the hand-sent "Please find attached copy" email, old emails as history |
| SMS Template | Messages → WhatsApp → Message templates | Same (old templates imported) |
| File Upload (777 documents) | — | Missing |
| Year End Process / Closing Transfer Utility | — | Missing |
| Update Data To Selected Party | — | Missing |
| User Managment / User Roll Admin / Sepcial Permision / Bank CC Permission | Users | Compare |

## Print designs (Crystal, REPORT folder on the pen drive)

The 24 Crystal designs are encrypted, so each print is copied from a sample PDF of the old software.

| Print | Status |
|---|---|
| SALESBILLTRADING_GST (sale bill), CRDBNOTE (DN / CN), journal note | Same |
| PartyGroupWise outstanding (Party Groupwise Sales Outstanding) | Same (3 sample PDFs) |
| SalesOrder, PurchaseOrder, YARNCHALLAN, PUR_RETURN_GST, BANK_CASH_PAYMENT_VOUCHER, CHEQUE_SPCB, AutoDebitNote, PartyGroup | Waiting for sample PDFs |
| ACCLEDGER, CASH_BANK_LEDGER | Waiting for sample PDFs |
| AgingWise, Broker+Party, BrokerWise summary, PartyGroupWise summary, PartyWise, Monthly, InterestBase, Daily Receipt Register, Sales / Purchase register detail and summary | Waiting for sample PDFs |
