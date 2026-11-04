/**
 * Behaviour of every document type in one table. The generic engine in
 * documents.ts reads this — adding a voucher type is mostly adding a row.
 */
import type { Role } from './context.js';

export type VoucherType =
  | 'SALES_ORDER' | 'PURCHASE_ORDER' | 'DISPATCH_SCHEDULE' | 'SALE_BILL' | 'PURCHASE_BILL'
  | 'SALE_RETURN' | 'PURCHASE_RETURN' | 'GENERAL_SALE' | 'GENERAL_PURCHASE'
  | 'RECEIPT' | 'PAYMENT' | 'CONTRA' | 'JOURNAL' | 'DEBIT_NOTE' | 'CREDIT_NOTE'
  | 'STOCK_TRANSFER' | 'OPENING_STOCK';

export type Area = 'sales' | 'purchase' | 'accounts' | 'stock';
/** How a document hits the ledger */
export type Posting = 'none' | 'sale' | 'purchase' | 'saleReturn' | 'purchaseReturn' | 'receipt' | 'payment' | 'journal';

export interface TypeDef {
  type: VoucherType;
  slug: string;
  label: string;
  area: Area;
  prefix: string;
  /** which party list the document uses */
  party: 'customer' | 'supplier' | 'any' | 'none';
  /** line style: yarn items, ledger debit/credit lines, or none (receipt/payment) */
  lines: 'item' | 'journal' | 'none';
  /** compute GST on lines */
  tax: boolean;
  posting: Posting;
  /** +1 stock in, -1 stock out, 0 none, 2 = transfer */
  stock: 1 | -1 | 0 | 2;
  /** document types this one can be made against */
  sources: VoucherType[];
  /** is this a bill that carries bill-wise outstanding? */
  bill?: 'receivable' | 'payable';
  /** needs approval rules */
  approval?: 'credit' | 'amount';
  /** tracks pending quantity (orders / schedules) */
  tracksPending?: boolean;
  /** e-way bill applies */
  ewb?: boolean;
  /** roles that can create / edit */
  write: Role[];
}

const SALES: Role[] = ['ADMIN', 'ACCOUNTANT', 'SALES'];
const PURCHASE: Role[] = ['ADMIN', 'ACCOUNTANT', 'PURCHASE'];
const ACCOUNTS: Role[] = ['ADMIN', 'ACCOUNTANT'];
const STOCK: Role[] = ['ADMIN', 'ACCOUNTANT', 'PURCHASE'];

export const TYPES: Record<VoucherType, TypeDef> = {
  SALES_ORDER: { type: 'SALES_ORDER', slug: 'sales-orders', label: 'Sales order', area: 'sales', prefix: 'SAL', party: 'customer', lines: 'item', tax: true, posting: 'none', stock: 0, sources: [], approval: 'credit', tracksPending: true, write: SALES },
  PURCHASE_ORDER: { type: 'PURCHASE_ORDER', slug: 'purchase-orders', label: 'Purchase order', area: 'purchase', prefix: 'PUR', party: 'supplier', lines: 'item', tax: true, posting: 'none', stock: 0, sources: [], approval: 'amount', tracksPending: true, write: PURCHASE },
  DISPATCH_SCHEDULE: { type: 'DISPATCH_SCHEDULE', slug: 'dispatch-schedules', label: 'Dispatch schedule', area: 'sales', prefix: 'DS', party: 'customer', lines: 'item', tax: false, posting: 'none', stock: 0, sources: ['SALES_ORDER'], tracksPending: true, write: SALES },
  SALE_BILL: { type: 'SALE_BILL', slug: 'sale-bills', label: 'Sale bill', area: 'sales', prefix: 'GU', party: 'customer', lines: 'item', tax: true, posting: 'sale', stock: -1, sources: ['DISPATCH_SCHEDULE', 'SALES_ORDER'], bill: 'receivable', ewb: true, write: SALES },
  PURCHASE_BILL: { type: 'PURCHASE_BILL', slug: 'purchase-bills', label: 'Purchase bill', area: 'purchase', prefix: 'PB', party: 'supplier', lines: 'item', tax: true, posting: 'purchase', stock: 1, sources: ['PURCHASE_ORDER'], bill: 'payable', write: PURCHASE },
  SALE_RETURN: { type: 'SALE_RETURN', slug: 'sale-returns', label: 'Sale return', area: 'sales', prefix: 'SR', party: 'customer', lines: 'item', tax: true, posting: 'saleReturn', stock: 1, sources: ['SALE_BILL'], write: SALES },
  PURCHASE_RETURN: { type: 'PURCHASE_RETURN', slug: 'purchase-returns', label: 'Purchase return', area: 'purchase', prefix: 'PR', party: 'supplier', lines: 'item', tax: true, posting: 'purchaseReturn', stock: -1, sources: ['PURCHASE_BILL'], write: PURCHASE },
  GENERAL_SALE: { type: 'GENERAL_SALE', slug: 'general-sales', label: 'General sale', area: 'sales', prefix: 'GS', party: 'any', lines: 'item', tax: true, posting: 'sale', stock: 0, sources: [], bill: 'receivable', write: SALES },
  GENERAL_PURCHASE: { type: 'GENERAL_PURCHASE', slug: 'general-purchases', label: 'General purchase', area: 'purchase', prefix: 'GP', party: 'any', lines: 'item', tax: true, posting: 'purchase', stock: 0, sources: [], bill: 'payable', write: PURCHASE },
  RECEIPT: { type: 'RECEIPT', slug: 'receipts', label: 'Receipt', area: 'accounts', prefix: 'RC', party: 'any', lines: 'none', tax: false, posting: 'receipt', stock: 0, sources: [], write: ACCOUNTS },
  PAYMENT: { type: 'PAYMENT', slug: 'payments', label: 'Payment', area: 'accounts', prefix: 'PY', party: 'any', lines: 'none', tax: false, posting: 'payment', stock: 0, sources: [], write: ACCOUNTS },
  CONTRA: { type: 'CONTRA', slug: 'contras', label: 'Contra', area: 'accounts', prefix: 'CT', party: 'none', lines: 'journal', tax: false, posting: 'journal', stock: 0, sources: [], write: ACCOUNTS },
  JOURNAL: { type: 'JOURNAL', slug: 'journals', label: 'Journal voucher', area: 'accounts', prefix: 'JV', party: 'none', lines: 'journal', tax: false, posting: 'journal', stock: 0, sources: [], write: ACCOUNTS },
  DEBIT_NOTE: { type: 'DEBIT_NOTE', slug: 'debit-notes', label: 'Debit note', area: 'accounts', prefix: 'DN', party: 'none', lines: 'journal', tax: false, posting: 'journal', stock: 0, sources: [], write: ACCOUNTS },
  CREDIT_NOTE: { type: 'CREDIT_NOTE', slug: 'credit-notes', label: 'Credit note', area: 'accounts', prefix: 'CN', party: 'none', lines: 'journal', tax: false, posting: 'journal', stock: 0, sources: [], write: ACCOUNTS },
  STOCK_TRANSFER: { type: 'STOCK_TRANSFER', slug: 'stock-transfers', label: 'Godown transfer', area: 'stock', prefix: 'ST', party: 'none', lines: 'item', tax: false, posting: 'none', stock: 2, sources: [], write: STOCK },
  OPENING_STOCK: { type: 'OPENING_STOCK', slug: 'opening-stock', label: 'Opening stock', area: 'stock', prefix: 'OS', party: 'none', lines: 'item', tax: false, posting: 'none', stock: 1, sources: [], write: STOCK }
};

export const BY_SLUG: Record<string, TypeDef> = Object.fromEntries(Object.values(TYPES).map((t) => [t.slug, t]));

/** documents that never touch the ledger keep their status in the order workflow */
export const ORDER_TYPES: VoucherType[] = ['SALES_ORDER', 'PURCHASE_ORDER', 'DISPATCH_SCHEDULE'];
export const BILL_TYPES = {
  receivable: ['SALE_BILL', 'GENERAL_SALE'] as VoucherType[],
  payable: ['PURCHASE_BILL', 'GENERAL_PURCHASE'] as VoucherType[]
};
