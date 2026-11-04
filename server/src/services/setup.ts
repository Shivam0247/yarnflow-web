/**
 * Creating a company sets up everything a yarn trader needs on day one:
 * financial year, chart of accounts (groups), the system ledgers used by
 * automatic postings (sales, purchase, GST, TCS/TDS, round off…), voucher
 * books for every document type, a default godown and cost center.
 */
import { and, eq } from 'drizzle-orm';
import type { Tx } from '../db/index.js';
import { accountGroups, accounts, books, companies, costCenters, financialYears, godowns, userCompanies } from '../db/schema.js';
import { fyRange } from '../lib/dates.js';
import { notFound } from '../lib/errors.js';
import { TYPES, type VoucherType } from './types.js';

type Nature = 'ASSET' | 'LIABILITY' | 'INCOME' | 'EXPENSE';
interface G { name: string; nature: Nature; parent?: string; billWise?: boolean; credit?: boolean; gp?: boolean; out?: boolean }

export const DEFAULT_GROUPS: G[] = [
  { name: 'Capital Account', nature: 'LIABILITY' },
  { name: 'Loans (Liability)', nature: 'LIABILITY' },
  { name: 'Current Liabilities', nature: 'LIABILITY' },
  { name: 'Sundry Creditors', nature: 'LIABILITY', parent: 'Current Liabilities', billWise: true, out: true },
  { name: 'Yarn Mills', nature: 'LIABILITY', parent: 'Sundry Creditors', billWise: true, out: true },
  { name: 'Brokers', nature: 'LIABILITY', parent: 'Sundry Creditors', billWise: true, out: true },
  { name: 'Transporters', nature: 'LIABILITY', parent: 'Sundry Creditors', billWise: true, out: true },
  { name: 'Duties & Taxes', nature: 'LIABILITY', parent: 'Current Liabilities' },
  { name: 'Provisions', nature: 'LIABILITY', parent: 'Current Liabilities' },
  { name: 'Fixed Assets', nature: 'ASSET' },
  { name: 'Current Assets', nature: 'ASSET' },
  { name: 'Bank Accounts', nature: 'ASSET', parent: 'Current Assets' },
  { name: 'Cash-in-hand', nature: 'ASSET', parent: 'Current Assets' },
  { name: 'Sundry Debtors', nature: 'ASSET', parent: 'Current Assets', billWise: true, credit: true, out: true },
  { name: 'Surat Debtors', nature: 'ASSET', parent: 'Sundry Debtors', billWise: true, credit: true, out: true },
  { name: 'Out-station Debtors', nature: 'ASSET', parent: 'Sundry Debtors', billWise: true, credit: true, out: true },
  { name: 'Stock-in-hand', nature: 'ASSET', parent: 'Current Assets' },
  { name: 'Loans & Advances (Asset)', nature: 'ASSET', parent: 'Current Assets' },
  { name: 'Sales Accounts', nature: 'INCOME', gp: true },
  { name: 'Direct Incomes', nature: 'INCOME', gp: true },
  { name: 'Indirect Incomes', nature: 'INCOME' },
  { name: 'Purchase Accounts', nature: 'EXPENSE', gp: true },
  { name: 'Direct Expenses', nature: 'EXPENSE', gp: true },
  { name: 'Indirect Expenses', nature: 'EXPENSE' }
];

/** System ledgers referenced by automatic postings (looked up by code). */
export const SYS = {
  SALES: 'SYS-SALES',
  SALES_EXPORT: 'SYS-SALES-EXP',
  GENERAL_SALES: 'SYS-SALES-GEN',
  PURCHASE: 'SYS-PURCHASE',
  GENERAL_PURCHASE: 'SYS-PURCHASE-GEN',
  SALES_RETURN: 'SYS-SALES-RET',
  PURCHASE_RETURN: 'SYS-PURCHASE-RET',
  CGST_OUT: 'SYS-CGST-OUT',
  SGST_OUT: 'SYS-SGST-OUT',
  IGST_OUT: 'SYS-IGST-OUT',
  CGST_IN: 'SYS-CGST-IN',
  SGST_IN: 'SYS-SGST-IN',
  IGST_IN: 'SYS-IGST-IN',
  TCS_PAYABLE: 'SYS-TCS-PAY',
  TCS_RECEIVABLE: 'SYS-TCS-REC',
  TDS_PAYABLE: 'SYS-TDS-PAY',
  ROUND_OFF: 'SYS-ROUND',
  OTHER_CHARGES: 'SYS-OTHER',
  CASH: 'SYS-CASH',
  CAPITAL: 'SYS-CAPITAL',
  BROKERAGE_INCOME: 'SYS-BROKERAGE',
  FREIGHT_INWARD: 'SYS-FREIGHT-IN',
  INTEREST_RECEIVED: 'SYS-INT-REC',
  INTEREST_PAID: 'SYS-INT-PAID',
  DISCOUNT_ALLOWED: 'SYS-DISC-ALLOWED',
  DISCOUNT_RECEIVED: 'SYS-DISC-RECEIVED'
} as const;

const SYSTEM_ACCOUNTS: { code: string; name: string; group: string; kind: string }[] = [
  { code: SYS.SALES, name: 'Yarn Sales A/c', group: 'Sales Accounts', kind: 'SALES' },
  { code: SYS.SALES_EXPORT, name: 'Yarn Sales A/c · Export', group: 'Sales Accounts', kind: 'SALES' },
  { code: SYS.GENERAL_SALES, name: 'General Sales A/c', group: 'Sales Accounts', kind: 'SALES' },
  { code: SYS.SALES_RETURN, name: 'Sales Return A/c', group: 'Sales Accounts', kind: 'SALES' },
  { code: SYS.PURCHASE, name: 'Yarn Purchase A/c', group: 'Purchase Accounts', kind: 'PURCHASE' },
  { code: SYS.GENERAL_PURCHASE, name: 'General Purchase A/c', group: 'Purchase Accounts', kind: 'PURCHASE' },
  { code: SYS.PURCHASE_RETURN, name: 'Purchase Return A/c', group: 'Purchase Accounts', kind: 'PURCHASE' },
  { code: SYS.CGST_OUT, name: 'Output CGST', group: 'Duties & Taxes', kind: 'TAX' },
  { code: SYS.SGST_OUT, name: 'Output SGST', group: 'Duties & Taxes', kind: 'TAX' },
  { code: SYS.IGST_OUT, name: 'Output IGST', group: 'Duties & Taxes', kind: 'TAX' },
  { code: SYS.CGST_IN, name: 'Input CGST', group: 'Duties & Taxes', kind: 'TAX' },
  { code: SYS.SGST_IN, name: 'Input SGST', group: 'Duties & Taxes', kind: 'TAX' },
  { code: SYS.IGST_IN, name: 'Input IGST', group: 'Duties & Taxes', kind: 'TAX' },
  { code: SYS.TCS_PAYABLE, name: 'TCS Payable', group: 'Duties & Taxes', kind: 'TAX' },
  { code: SYS.TCS_RECEIVABLE, name: 'TCS Receivable', group: 'Loans & Advances (Asset)', kind: 'TAX' },
  { code: SYS.TDS_PAYABLE, name: 'TDS Payable (194Q)', group: 'Duties & Taxes', kind: 'TAX' },
  { code: SYS.ROUND_OFF, name: 'Round Off', group: 'Indirect Expenses', kind: 'EXPENSE' },
  { code: SYS.OTHER_CHARGES, name: 'Other Charges Recovered', group: 'Indirect Incomes', kind: 'INCOME' },
  { code: SYS.CASH, name: 'Cash', group: 'Cash-in-hand', kind: 'CASH' },
  { code: SYS.CAPITAL, name: 'Capital A/c', group: 'Capital Account', kind: 'CAPITAL' },
  { code: SYS.BROKERAGE_INCOME, name: 'Brokerage Income', group: 'Indirect Incomes', kind: 'INCOME' },
  { code: SYS.FREIGHT_INWARD, name: 'Freight Inward', group: 'Direct Expenses', kind: 'EXPENSE' },
  { code: SYS.INTEREST_RECEIVED, name: 'Interest Received', group: 'Indirect Incomes', kind: 'INCOME' },
  { code: SYS.INTEREST_PAID, name: 'Interest Paid', group: 'Indirect Expenses', kind: 'EXPENSE' },
  { code: SYS.DISCOUNT_ALLOWED, name: 'Rate Difference & Discount Allowed', group: 'Indirect Expenses', kind: 'EXPENSE' },
  { code: SYS.DISCOUNT_RECEIVED, name: 'Rate Difference & Discount Received', group: 'Indirect Incomes', kind: 'INCOME' }
];

/** voucher books (series) created for a new company: [type, name, prefix, padding, fySuffix, postingAccountCode, default] */
const DEFAULT_BOOKS: [VoucherType, string, string, number, boolean, string | null, boolean][] = [
  ['SALES_ORDER', 'Sales order', 'SAL', 5, true, null, true],
  ['SALES_ORDER', 'Sales order · export', 'SEX', 5, true, null, false],
  ['PURCHASE_ORDER', 'Purchase order', 'PUR', 4, true, null, true],
  ['DISPATCH_SCHEDULE', 'Dispatch schedule', 'DS', 5, true, null, true],
  ['DISPATCH_SCHEDULE', 'Dispatch schedule · job work', 'DSJ', 5, true, null, false],
  ['SALE_BILL', 'Yarn sales tax A/c', 'GU', 5, true, SYS.SALES, true],
  ['SALE_BILL', 'Yarn sales A/c · export', 'EX', 5, true, SYS.SALES_EXPORT, false],
  ['PURCHASE_BILL', 'Yarn purchase A/c', 'PB', 5, true, SYS.PURCHASE, true],
  ['PURCHASE_BILL', 'Yarn purchase A/c · import', 'IMP', 5, true, SYS.PURCHASE, false],
  ['SALE_RETURN', 'Sales yarn return', 'SR', 5, true, SYS.SALES_RETURN, true],
  ['PURCHASE_RETURN', 'Purchase yarn return', 'PR', 5, true, SYS.PURCHASE_RETURN, true],
  ['GENERAL_SALE', 'General sale', 'GS', 5, true, SYS.GENERAL_SALES, true],
  ['GENERAL_SALE', 'Brokerage income', 'BI', 5, true, SYS.BROKERAGE_INCOME, false],
  ['GENERAL_PURCHASE', 'General purchase', 'GP', 5, true, SYS.GENERAL_PURCHASE, true],
  ['RECEIPT', 'Bank receipt', 'RC', 4, true, null, true],
  ['PAYMENT', 'Bank payment', 'PY', 4, true, null, true],
  ['CONTRA', 'Contra', 'CT', 4, true, null, true],
  ['JOURNAL', 'Journal', 'JV', 4, true, null, true],
  ['DEBIT_NOTE', 'Debit note', 'DN', 4, true, null, true],
  ['CREDIT_NOTE', 'Credit note', 'CN', 4, true, null, true],
  ['STOCK_TRANSFER', 'Godown transfer', 'ST', 4, true, null, true],
  ['OPENING_STOCK', 'Opening stock', 'OS', 4, true, null, true]
];

export interface CompanyInput {
  name: string;
  shortName?: string | null;
  legalName?: string | null;
  gstin?: string | null;
  pan?: string | null;
  address1?: string | null;
  address2?: string | null;
  city?: string | null;
  state?: string | null;
  stateCode?: string;
  pincode?: string | null;
  phone?: string | null;
  email?: string | null;
  bankName?: string | null;
  bankAccountNo?: string | null;
  ifsc?: string | null;
  fyLabel: string;
}

export async function createCompany(db: Tx, input: CompanyInput, ownerUserId?: number) {
  const { fyLabel, ...rest } = input;
  const [company] = await db.insert(companies).values({ ...rest, stateCode: rest.stateCode ?? (rest.gstin?.slice(0, 2) || '24') }).returning();
  const [fy] = await db.insert(financialYears).values({ companyId: company.id, label: fyLabel, ...fyRange(fyLabel) }).returning();

  // groups (parents first)
  const gid: Record<string, number> = {};
  for (const [i, g] of DEFAULT_GROUPS.entries()) {
    const [row] = await db
      .insert(accountGroups)
      .values({
        companyId: company.id,
        name: g.name,
        nature: g.nature,
        parentId: g.parent ? gid[g.parent] : null,
        billWise: !!g.billWise,
        creditControl: !!g.credit,
        affectsGrossProfit: !!g.gp,
        showInOutstanding: !!g.out,
        isSystem: true,
        sortOrder: i
      })
      .returning();
    gid[g.name] = row.id;
  }

  const aid: Record<string, number> = {};
  for (const a of SYSTEM_ACCOUNTS) {
    const [row] = await db
      .insert(accounts)
      .values({ companyId: company.id, groupId: gid[a.group], code: a.code, name: a.name, kind: a.kind as never, isSystem: true })
      .returning();
    aid[a.code] = row.id;
  }

  for (const [type, name, prefix, padding, withFySuffix, acc, isDefault] of DEFAULT_BOOKS) {
    await db.insert(books).values({ companyId: company.id, voucherType: type, name, prefix, padding, withFySuffix, isDefault, postingAccountId: acc ? aid[acc] : null });
  }
  await db.insert(godowns).values({ companyId: company.id, name: 'Main godown', city: rest.city ?? null, isDefault: true });
  await db.insert(costCenters).values({ companyId: company.id, name: 'Trading division', isDefault: true });
  if (ownerUserId) await db.insert(userCompanies).values({ userId: ownerUserId, companyId: company.id }).onConflictDoNothing();
  return { company, fy, groups: gid, systemAccounts: aid };
}

/** id of a system ledger (cached per company for the life of the process) */
const sysCache = new Map<string, number>();
export async function sysAccount(db: Tx, companyId: number, code: string) {
  const key = companyId + ':' + code;
  const hit = sysCache.get(key);
  if (hit) return hit;
  let [row] = await db.select({ id: accounts.id }).from(accounts).where(and(eq(accounts.companyId, companyId), eq(accounts.code, code)));
  if (!row) {
    // companies created before this ledger existed get it on first use
    const def = SYSTEM_ACCOUNTS.find((a) => a.code === code);
    if (!def) throw notFound(`System account ${code}`);
    const [g] = await db.select({ id: accountGroups.id }).from(accountGroups).where(and(eq(accountGroups.companyId, companyId), eq(accountGroups.name, def.group)));
    if (!g) throw notFound(`Group ${def.group}`);
    [row] = await db.insert(accounts).values({ companyId, groupId: g.id, code: def.code, name: def.name, kind: def.kind as never, isSystem: true }).onConflictDoNothing().returning({ id: accounts.id });
    if (!row) [row] = await db.select({ id: accounts.id }).from(accounts).where(and(eq(accounts.companyId, companyId), eq(accounts.code, code)));
  }
  sysCache.set(key, row.id);
  return row.id;
}
export const clearSysCache = () => sysCache.clear();

/** default book for a voucher type */
export async function defaultBook(db: Tx, companyId: number, type: VoucherType) {
  const rows = await db.select().from(books).where(and(eq(books.companyId, companyId), eq(books.voucherType, type)));
  const b = rows.find((r) => r.isDefault) ?? rows[0];
  if (!b) throw notFound(`Book for ${TYPES[type].label}`);
  return b;
}
