/**
 * YarnFlow database schema (PostgreSQL, Drizzle ORM).
 *
 * Every business record belongs to a company; transactions also belong to a
 * financial year. Money, quantities, rates and percentages are exact decimals
 * (unconstrained PostgreSQL `numeric`): values migrated from the old software keep
 * every digit they had there, and nothing is ever rounded on storage. Screens
 * format to 2/3 decimals for display only.
 *
 * One generic `vouchers` table holds every document type (orders, schedules,
 * bills, returns, receipts, payments, journals …) — exactly how accounting
 * packages like Tally model it. Type-specific behaviour lives in
 * src/services/documents.ts.
 */
import { relations, sql } from 'drizzle-orm';
import {
  boolean,
  date,
  index,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  varchar
} from 'drizzle-orm/pg-core';

const exact = (name: string) => numeric(name, { mode: 'number' });
const money = exact;
const qty = exact;
const pct = exact;
const id = () => integer('id').primaryKey().generatedByDefaultAsIdentity();
const stamps = {
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
};

/* ------------------------------------------------------------------ enums */
export const roleEnum = pgEnum('role', ['ADMIN', 'ACCOUNTANT', 'SALES', 'PURCHASE', 'VIEWER']);
export const natureEnum = pgEnum('group_nature', ['ASSET', 'LIABILITY', 'INCOME', 'EXPENSE']);
export const accountKindEnum = pgEnum('account_kind', [
  'CUSTOMER', 'SUPPLIER', 'BROKER', 'TRANSPORTER', 'BANK', 'CASH', 'TAX', 'SALES', 'PURCHASE',
  'EXPENSE', 'INCOME', 'CAPITAL', 'LOAN', 'ASSET', 'OTHER'
]);
export const gstTypeEnum = pgEnum('gst_type', ['REGULAR', 'COMPOSITION', 'UNREGISTERED', 'CONSUMER', 'SEZ', 'EXPORT']);
export const drcrEnum = pgEnum('drcr', ['DR', 'CR']);
export const statusEnum = pgEnum('record_status', ['ACTIVE', 'ON_HOLD', 'BLOCKED', 'INACTIVE']);
export const yarnTypeEnum = pgEnum('yarn_type', ['FDY', 'POY', 'DTY', 'VISCOSE', 'NYLON', 'SPUN', 'COTTON', 'OTHER', 'SERVICE']);
export const rateBasisEnum = pgEnum('rate_basis', ['PER_KG', 'PER_BOX', 'PER_TRIP']);
export const voucherTypeEnum = pgEnum('voucher_type', [
  'SALES_ORDER', 'PURCHASE_ORDER', 'DISPATCH_SCHEDULE', 'SALE_BILL', 'PURCHASE_BILL',
  'SALE_RETURN', 'PURCHASE_RETURN', 'GENERAL_SALE', 'GENERAL_PURCHASE',
  'RECEIPT', 'PAYMENT', 'CONTRA', 'JOURNAL', 'DEBIT_NOTE', 'CREDIT_NOTE', 'STOCK_TRANSFER', 'OPENING_STOCK',
  'RECEIPT_RETURN', 'PAYMENT_RETURN', 'OPENING_BALANCE', 'INTEREST_DEBIT_NOTE', 'PENDING_ADJUSTMENT'
]);
/** people the business works with who are not ledger accounts (old software: BrokerMst) */
export const personRoleEnum = pgEnum('person_role', ['PARTY_GROUP', 'BROKER', 'COLLECTOR', 'SALES_PERSON', 'GODOWN_PERSON']);
export const docStatusEnum = pgEnum('doc_status', [
  'DRAFT', 'PENDING_APPROVAL', 'OPEN', 'PARTIAL', 'COMPLETED', 'CANCELLED', 'LOCKED', 'POSTED', 'REJECTED'
]);
export const ewbStatusEnum = pgEnum('ewb_status', ['NOT_REQUIRED', 'PENDING', 'GENERATED', 'PARTB_PENDING', 'CANCELLED', 'EXPIRED', 'DELIVERED']);
export const payModeEnum = pgEnum('pay_mode', ['NEFT', 'RTGS', 'CHEQUE', 'UPI', 'CASH', 'OTHER']);
export const priorityEnum = pgEnum('priority', ['URGENT', 'NORMAL', 'LOW']);

/* --------------------------------------------------------------- tenancy */
export const companies = pgTable('companies', {
  id: id(),
  name: varchar('name', { length: 160 }).notNull(),
  shortName: varchar('short_name', { length: 60 }),
  legalName: varchar('legal_name', { length: 200 }),
  gstin: varchar('gstin', { length: 15 }),
  pan: varchar('pan', { length: 10 }),
  cin: varchar('cin', { length: 25 }),
  address1: text('address1'),
  address2: text('address2'),
  city: varchar('city', { length: 80 }),
  state: varchar('state', { length: 60 }),
  stateCode: varchar('state_code', { length: 2 }).notNull().default('24'),
  pincode: varchar('pincode', { length: 10 }),
  phone: varchar('phone', { length: 30 }),
  email: varchar('email', { length: 120 }),
  bankName: varchar('bank_name', { length: 120 }),
  bankAccountNo: varchar('bank_account_no', { length: 40 }),
  ifsc: varchar('ifsc', { length: 15 }),
  /** purchase orders above this value need approval */
  poApprovalLimit: money('po_approval_limit').notNull().default(1000000),
  /** e-way bill required above this invoice value */
  ewbThreshold: money('ewb_threshold').notNull().default(50000),
  /** companies of one business share masters (parties, items, groups, books…) kept under this company */
  masterCompanyId: integer('master_company_id'),
  legacyCode: varchar('legacy_code', { length: 20 }),
  extra: jsonb('extra').$type<Record<string, unknown>>(),
  ...stamps
});

export const financialYears = pgTable(
  'financial_years',
  {
    id: id(),
    companyId: integer('company_id').notNull().references(() => companies.id, { onDelete: 'cascade' }),
    label: varchar('label', { length: 10 }).notNull(), // "26-27"
    startDate: date('start_date', { mode: 'string' }).notNull(),
    endDate: date('end_date', { mode: 'string' }).notNull(),
    isLocked: boolean('is_locked').notNull().default(false),
    ...stamps
  },
  (t) => [uniqueIndex('fy_company_label').on(t.companyId, t.label)]
);

export const users = pgTable('users', {
  id: id(),
  name: varchar('name', { length: 120 }).notNull(),
  email: varchar('email', { length: 160 }).notNull().unique(),
  mobile: varchar('mobile', { length: 20 }),
  passwordHash: text('password_hash').notNull(),
  role: roleEnum('role').notNull().default('VIEWER'),
  isActive: boolean('is_active').notNull().default(true),
  lastLoginAt: timestamp('last_login_at', { withTimezone: true }),
  ...stamps
});

export const userCompanies = pgTable(
  'user_companies',
  {
    userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    companyId: integer('company_id').notNull().references(() => companies.id, { onDelete: 'cascade' })
  },
  (t) => [uniqueIndex('user_company_uq').on(t.userId, t.companyId)]
);

/* ---------------------------------------------------------------- masters */
export const accountGroups = pgTable(
  'account_groups',
  {
    id: id(),
    companyId: integer('company_id').notNull().references(() => companies.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 120 }).notNull(),
    parentId: integer('parent_id'),
    nature: natureEnum('nature').notNull(),
    billWise: boolean('bill_wise').notNull().default(false),
    creditControl: boolean('credit_control').notNull().default(false),
    affectsGrossProfit: boolean('affects_gross_profit').notNull().default(false),
    showInOutstanding: boolean('show_in_outstanding').notNull().default(false),
    isSystem: boolean('is_system').notNull().default(false),
    sortOrder: integer('sort_order').notNull().default(0),
    ...stamps
  },
  (t) => [uniqueIndex('group_company_name').on(t.companyId, t.name)]
);

export const accounts = pgTable(
  'accounts',
  {
    id: id(),
    companyId: integer('company_id').notNull().references(() => companies.id, { onDelete: 'cascade' }),
    groupId: integer('group_id').notNull().references(() => accountGroups.id),
    code: varchar('code', { length: 30 }),
    name: varchar('name', { length: 160 }).notNull(),
    alias: varchar('alias', { length: 160 }),
    printName: varchar('print_name', { length: 200 }),
    kind: accountKindEnum('kind').notNull().default('OTHER'),
    /** "party group" — the parent party an account belongs to (e.g. a family of firms) */
    partyGroupId: integer('party_group_id'),
    gstType: gstTypeEnum('gst_type').notNull().default('REGULAR'),
    gstin: varchar('gstin', { length: 15 }),
    pan: varchar('pan', { length: 10 }),
    address1: text('address1'),
    address2: text('address2'),
    area: varchar('area', { length: 80 }),
    city: varchar('city', { length: 80 }),
    state: varchar('state', { length: 60 }),
    stateCode: varchar('state_code', { length: 2 }),
    pincode: varchar('pincode', { length: 10 }),
    contactPerson: varchar('contact_person', { length: 120 }),
    mobile: varchar('mobile', { length: 20 }),
    phone: varchar('phone', { length: 30 }),
    email: varchar('email', { length: 160 }),
    creditLimit: money('credit_limit').notNull().default(0),
    creditDays: integer('credit_days').notNull().default(0),
    interestRate: pct('interest_rate').notNull().default(0),
    brokerId: integer('broker_id'),
    brokerageRate: exact('brokerage_rate').notNull().default(0),
    brokerageType: varchar('brokerage_type', { length: 10 }).notNull().default('PER_KG'), // PER_KG | PERCENT
    transporterId: integer('transporter_id'),
    salesPersonId: integer('sales_person_id'),
    /** who collects payment from this party (a sales person record) */
    collectionPersonId: integer('collection_person_id'),
    bankName: varchar('bank_name', { length: 120 }),
    bankAccountNo: varchar('bank_account_no', { length: 40 }),
    ifsc: varchar('ifsc', { length: 15 }),
    openingBalance: money('opening_balance').notNull().default(0),
    openingType: drcrEnum('opening_type').notNull().default('DR'),
    tdsApplicable: boolean('tds_applicable').notNull().default(false),
    tdsRate: pct('tds_rate').notNull().default(0),
    tcsApplicable: boolean('tcs_applicable').notNull().default(false),
    tcsRate: pct('tcs_rate').notNull().default(0),
    status: statusEnum('status').notNull().default('ACTIVE'),
    isSystem: boolean('is_system').notNull().default(false),
    notes: text('notes'),
    /** party | transport party | delivery party | book (sales/purchase/bank ledger) */
    partyType: varchar('party_type', { length: 20 }),
    legacyCode: varchar('legacy_code', { length: 20 }),
    extra: jsonb('extra').$type<Record<string, unknown>>(),
    ...stamps
  },
  (t) => [
    uniqueIndex('account_company_legacy').on(t.companyId, t.legacyCode),
    index('account_kind_idx').on(t.companyId, t.kind),
    index('account_group_idx').on(t.groupId)
  ]
);

export const salesPersons = pgTable('sales_persons', {
  id: id(),
  companyId: integer('company_id').notNull().references(() => companies.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 120 }).notNull(),
  mobile: varchar('mobile', { length: 20 }),
  email: varchar('email', { length: 160 }),
  isActive: boolean('is_active').notNull().default(true),
  ...stamps
});

/** Party groups ("Mistry"), brokers, collection persons, sales persons — old BrokerMst */
export const persons = pgTable(
  'persons',
  {
    id: id(),
    companyId: integer('company_id').notNull().references(() => companies.id, { onDelete: 'cascade' }),
    role: personRoleEnum('role').notNull(),
    code: varchar('code', { length: 20 }),
    name: varchar('name', { length: 160 }).notNull(),
    shortName: varchar('short_name', { length: 60 }),
    phone: varchar('phone', { length: 60 }),
    email: varchar('email', { length: 160 }),
    address1: text('address1'),
    address2: text('address2'),
    city: varchar('city', { length: 80 }),
    pan: varchar('pan', { length: 10 }),
    rate: exact('rate'),
    creditLimit: money('credit_limit'),
    creditDays: integer('credit_days'),
    isBlocked: boolean('is_blocked').notNull().default(false),
    blockReason: text('block_reason'),
    remark: text('remark'),
    extra: jsonb('extra').$type<Record<string, unknown>>(),
    ...stamps
  },
  (t) => [uniqueIndex('person_company_code').on(t.companyId, t.code), index('person_role_idx').on(t.companyId, t.role)]
);

/** Per-company settings of a shared account (old ObjectMapMst / CapitalRationMst) */
export const accountCompanies = pgTable(
  'account_companies',
  {
    accountId: integer('account_id').notNull().references(() => accounts.id, { onDelete: 'cascade' }),
    companyId: integer('company_id').notNull().references(() => companies.id, { onDelete: 'cascade' }),
    creditDays: exact('credit_days'),
    creditLimit: money('credit_limit'),
    lockDays: exact('lock_days'),
    tdsApplicable: boolean('tds_applicable'),
    tcsApplicable: boolean('tcs_applicable'),
    rcmApplicable: boolean('rcm_applicable'),
    capitalRatio: exact('capital_ratio'),
    extra: jsonb('extra').$type<Record<string, unknown>>()
  },
  (t) => [uniqueIndex('account_company_uq').on(t.accountId, t.companyId)]
);

/** Link from every migrated YarnFlow row to the exact archived row it came from */
export const legacyRefs = pgTable(
  'legacy_refs',
  {
    entity: varchar('entity', { length: 30 }).notNull(),
    entityId: integer('entity_id').notNull(),
    legacyDb: varchar('legacy_db', { length: 20 }).notNull(),
    legacyTable: varchar('legacy_table', { length: 60 }).notNull(),
    legacyKey: text('legacy_key').notNull(),
    legacyRow: integer('legacy_row'),
    legacySha: varchar('legacy_sha', { length: 64 })
  },
  (t) => [uniqueIndex('legacy_ref_uq').on(t.legacyDb, t.legacyTable, t.legacyKey, t.entity), index('legacy_ref_entity').on(t.entity, t.entityId)]
);

export const costCenters = pgTable('cost_centers', {
  id: id(),
  companyId: integer('company_id').notNull().references(() => companies.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 120 }).notNull(),
  isDefault: boolean('is_default').notNull().default(false),
  legacyCode: varchar('legacy_code', { length: 30 }),
  extra: jsonb('extra').$type<Record<string, unknown>>(),
  ...stamps
});

export const godowns = pgTable('godowns', {
  id: id(),
  companyId: integer('company_id').notNull().references(() => companies.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 120 }).notNull(),
  address: text('address'),
  city: varchar('city', { length: 80 }),
  isDefault: boolean('is_default').notNull().default(false),
  isActive: boolean('is_active').notNull().default(true),
  legacyCode: varchar('legacy_code', { length: 30 }),
  extra: jsonb('extra').$type<Record<string, unknown>>(),
  ...stamps
});

export const brands = pgTable(
  'brands',
  {
    id: id(),
    companyId: integer('company_id').notNull().references(() => companies.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 120 }).notNull(),
    millAccountId: integer('mill_account_id'),
    location: varchar('location', { length: 120 }),
    legacyCode: varchar('legacy_code', { length: 30 }),
    extra: jsonb('extra').$type<Record<string, unknown>>(),
    ...stamps
  },
  (t) => [index('brand_company_name').on(t.companyId, t.name)]
);

export const items = pgTable(
  'items',
  {
    id: id(),
    companyId: integer('company_id').notNull().references(() => companies.id, { onDelete: 'cascade' }),
    code: varchar('code', { length: 40 }).notNull(),
    name: varchar('name', { length: 160 }).notNull(), // short trading name, e.g. "50/24 SD CAT"
    description: varchar('description', { length: 240 }), // "Polyester FDY 75/36 SD Raw White"
    type: yarnTypeEnum('type').notNull().default('FDY'),
    denier: varchar('denier', { length: 20 }), // "75" / "50/24" / "30s"
    filament: varchar('filament', { length: 20 }),
    lustre: varchar('lustre', { length: 10 }), // SD | BR | FD
    brandId: integer('brand_id'),
    hsn: varchar('hsn', { length: 10 }).notNull().default('5402'),
    gstRate: pct('gst_rate').notNull().default(5),
    unit: varchar('unit', { length: 10 }).notNull().default('KG'),
    stdBoxKg: qty('std_box_kg').notNull().default(0),
    conesPerBox: integer('cones_per_box').notNull().default(0),
    rate: money('rate').notNull().default(0),
    minStock: qty('min_stock').notNull().default(0),
    isGeneral: boolean('is_general').notNull().default(false), // non-yarn / service item for general sale/purchase
    isActive: boolean('is_active').notNull().default(true),
    groupId: integer('group_id'),
    legacyCode: varchar('legacy_code', { length: 30 }),
    extra: jsonb('extra').$type<Record<string, unknown>>(),
    ...stamps
  },
  (t) => [uniqueIndex('item_company_code').on(t.companyId, t.code), index('item_name_idx').on(t.companyId, t.name)]
);

/** Item groups (old ItemGroupMst): tax / HSN / unit defaults and report grouping */
export const itemGroups = pgTable('item_groups', {
  id: id(),
  companyId: integer('company_id').notNull().references(() => companies.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 120 }).notNull(),
  hsn: varchar('hsn', { length: 20 }),
  gstRate: pct('gst_rate'),
  unit: varchar('unit', { length: 10 }),
  isService: boolean('is_service').notNull().default(false),
  legacyCode: varchar('legacy_code', { length: 30 }),
  extra: jsonb('extra').$type<Record<string, unknown>>(),
  ...stamps
});

/** Lots (old LotMst): mill lot numbers per item / party, used on order, challan and bill lines */
export const lots = pgTable(
  'lots',
  {
    id: id(),
    companyId: integer('company_id').notNull().references(() => companies.id, { onDelete: 'cascade' }),
    number: varchar('number', { length: 60 }).notNull(),
    itemId: integer('item_id'),
    partyId: integer('party_id'),
    brandId: integer('brand_id'),
    isActive: boolean('is_active').notNull().default(true),
    legacyCode: varchar('legacy_code', { length: 30 }),
    extra: jsonb('extra').$type<Record<string, unknown>>(),
    ...stamps
  },
  (t) => [index('lot_company_number').on(t.companyId, t.number), index('lot_legacy').on(t.companyId, t.legacyCode)]
);

export const transporters = pgTable('transporters', {
  id: id(),
  companyId: integer('company_id').notNull().references(() => companies.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 160 }).notNull(),
  transporterId: varchar('transporter_id', { length: 20 }), // GSTIN / TRANSIN used on e-way bills
  gstin: varchar('gstin', { length: 15 }),
  contactPerson: varchar('contact_person', { length: 120 }),
  mobile: varchar('mobile', { length: 20 }),
  address: text('address'),
  city: varchar('city', { length: 80 }),
  routes: text('routes'),
  rateBasis: rateBasisEnum('rate_basis').notNull().default('PER_KG'),
  rate: money('rate').notNull().default(0),
  accountId: integer('account_id'),
  status: statusEnum('status').notNull().default('ACTIVE'),
  legacyCode: varchar('legacy_code', { length: 30 }),
  extra: jsonb('extra').$type<Record<string, unknown>>(),
  ...stamps
});

export const vehicles = pgTable('vehicles', {
  id: id(),
  companyId: integer('company_id').notNull().references(() => companies.id, { onDelete: 'cascade' }),
  number: varchar('number', { length: 20 }).notNull(),
  transporterId: integer('transporter_id'),
  driverName: varchar('driver_name', { length: 120 }),
  driverMobile: varchar('driver_mobile', { length: 20 }),
  legacyCode: varchar('legacy_code', { length: 30 }),
  extra: jsonb('extra').$type<Record<string, unknown>>(),
  ...stamps
});

/** Voucher series ("Book" in the UI): numbering + posting account per document type */
export const books = pgTable('books', {
  id: id(),
  companyId: integer('company_id').notNull().references(() => companies.id, { onDelete: 'cascade' }),
  voucherType: voucherTypeEnum('voucher_type').notNull(),
  name: varchar('name', { length: 120 }).notNull(),
  prefix: varchar('prefix', { length: 12 }).notNull(),
  padding: integer('padding').notNull().default(5),
  withFySuffix: boolean('with_fy_suffix').notNull().default(true),
  /** sales / purchase / return ledger the document posts to */
  postingAccountId: integer('posting_account_id'),
  isDefault: boolean('is_default').notNull().default(false),
  isActive: boolean('is_active').notNull().default(true),
  /** old book transaction type and the ledger account of the book itself */
  legacyType: integer('legacy_type'),
  accountId: integer('account_id'),
  legacyCode: varchar('legacy_code', { length: 30 }),
  extra: jsonb('extra').$type<Record<string, unknown>>(),
  ...stamps
});

export const counters = pgTable(
  'counters',
  {
    id: id(),
    bookId: integer('book_id').notNull().references(() => books.id, { onDelete: 'cascade' }),
    fyId: integer('fy_id').notNull().references(() => financialYears.id, { onDelete: 'cascade' }),
    lastNumber: integer('last_number').notNull().default(0)
  },
  (t) => [uniqueIndex('counter_book_fy').on(t.bookId, t.fyId)]
);

/* ----------------------------------------------------------- transactions */
export const vouchers = pgTable(
  'vouchers',
  {
    id: id(),
    companyId: integer('company_id').notNull().references(() => companies.id, { onDelete: 'cascade' }),
    fyId: integer('fy_id').notNull().references(() => financialYears.id),
    type: voucherTypeEnum('type').notNull(),
    bookId: integer('book_id').references(() => books.id),
    number: varchar('number', { length: 40 }).notNull(),
    seq: integer('seq').notNull().default(0),
    date: date('date', { mode: 'string' }).notNull(),
    status: docStatusEnum('status').notNull().default('OPEN'),
    /** exact document type of the old software (SAL, GENSAL, BANKPAYON, PLJV …) */
    subtype: varchar('subtype', { length: 20 }),
    /** which books the document belongs to: 20 = UMIYA20 era (to FY 23-24), 24 = UMIYA24 era onwards */
    ledgerPeriod: integer('ledger_period'),
    /** a bill carried forward into the next books (the old software copied it there): outstanding there too */
    carriedToPeriod: integer('carried_to_period'),
    legacyCode: varchar('legacy_code', { length: 30 }),

    // parties & people
    partyId: integer('party_id').references(() => accounts.id),
    deliveryPartyId: integer('delivery_party_id').references(() => accounts.id),
    /** broker (person) */
    brokerId: integer('broker_id').references(() => persons.id),
    /** agent / supplier's agent (purchase side), agent on bills */
    agentId: integer('agent_id').references(() => accounts.id),
    /** how the order was placed: phone / email / mill portal / visit */
    orderMode: varchar('order_mode', { length: 30 }),
    brokerageRate: exact('brokerage_rate').notNull().default(0),
    brokerageType: varchar('brokerage_type', { length: 10 }).notNull().default('PER_KG'),
    millId: integer('mill_id').references(() => accounts.id), // supplier (mill) on sales orders
    salesPersonId: integer('sales_person_id').references(() => persons.id),
    costCenterId: integer('cost_center_id').references(() => costCenters.id),
    godownId: integer('godown_id').references(() => godowns.id),
    toGodownId: integer('to_godown_id').references(() => godowns.id),
    bankAccountId: integer('bank_account_id').references(() => accounts.id), // receipts / payments
    collectionPerson: varchar('collection_person', { length: 120 }),
    collectionPersonId: integer('collection_person_id').references(() => persons.id),

    // references
    sourceId: integer('source_id'), // the document this one was made against
    refNo: varchar('ref_no', { length: 60 }), // ref. order no / supplier invoice no
    refDate: date('ref_date', { mode: 'string' }),
    refName: varchar('ref_name', { length: 120 }),
    doNo: varchar('do_no', { length: 40 }),
    opportunityNo: varchar('opportunity_no', { length: 40 }),
    reason: varchar('reason', { length: 120 }),

    // terms
    creditDays: integer('credit_days').notNull().default(0),
    dueDate: date('due_date', { mode: 'string' }),
    expDeliveryDate: date('exp_delivery_date', { mode: 'string' }),
    processType: varchar('process_type', { length: 40 }),
    orderType: varchar('order_type', { length: 40 }),
    priority: priorityEnum('priority').notNull().default('NORMAL'),
    terms: text('terms'),

    // transport
    transporterId: integer('transporter_id').references(() => transporters.id),
    vehicleNo: varchar('vehicle_no', { length: 20 }),
    lrNo: varchar('lr_no', { length: 40 }),
    lrDate: date('lr_date', { mode: 'string' }),
    parcels: integer('parcels'),
    driverName: varchar('driver_name', { length: 120 }),
    deliveryAddress: text('delivery_address'),
    distanceKm: integer('distance_km'),

    // tax
    interState: boolean('inter_state').notNull().default(false),
    placeOfSupply: varchar('place_of_supply', { length: 2 }),
    reverseCharge: boolean('reverse_charge').notNull().default(false),
    isTcs: boolean('is_tcs').notNull().default(false),
    tcsRate: pct('tcs_rate').notNull().default(0),
    tdsRate: pct('tds_rate').notNull().default(0),
    currency: varchar('currency', { length: 3 }).notNull().default('INR'),
    exchangeRate: exact('exchange_rate').notNull().default(1),

    // totals (computed by the server)
    totalPcs: qty('total_pcs').notNull().default(0),
    totalCops: qty('total_cops').notNull().default(0),
    totalQty: qty('total_qty').notNull().default(0),
    /** total weight (kg) — the old software keeps quantity, pieces and weight separately */
    totalWeight: qty('total_weight'),
    grossAmount: money('gross_amount').notNull().default(0),
    discountAmount: money('discount_amount').notNull().default(0),
    freightAmount: money('freight_amount').notNull().default(0),
    insuranceAmount: money('insurance_amount').notNull().default(0),
    taxableAmount: money('taxable_amount').notNull().default(0),
    cgstAmount: money('cgst_amount').notNull().default(0),
    sgstAmount: money('sgst_amount').notNull().default(0),
    igstAmount: money('igst_amount').notNull().default(0),
    tcsAmount: money('tcs_amount').notNull().default(0),
    tdsAmount: money('tds_amount').notNull().default(0),
    addLess: money('add_less').notNull().default(0),
    roundOff: money('round_off').notNull().default(0),
    netAmount: money('net_amount').notNull().default(0),
    /** extra discounts on orders: quantity / cash / rate difference */
    discounts: jsonb('discounts').$type<{ label: string; amount: number }[]>().notNull().default(sql`'[]'::jsonb`),

    // receipts / payments
    mode: payModeEnum('mode'),
    instrumentNo: varchar('instrument_no', { length: 40 }),
    instrumentDate: date('instrument_date', { mode: 'string' }),
    amount: money('amount').notNull().default(0),

    // e-way bill & e-invoice
    ewbStatus: ewbStatusEnum('ewb_status').notNull().default('NOT_REQUIRED'),
    ewbNo: varchar('ewb_no', { length: 20 }),
    ewbDate: timestamp('ewb_date', { withTimezone: true }),
    ewbValidTill: timestamp('ewb_valid_till', { withTimezone: true }),
    irn: varchar('irn', { length: 80 }),
    ackNo: varchar('ack_no', { length: 30 }),
    ackDate: timestamp('ack_date', { withTimezone: true }),

    // approval
    approvedById: integer('approved_by_id').references(() => users.id),
    approvedAt: timestamp('approved_at', { withTimezone: true }),
    approvalNote: text('approval_note'),
    /** free print fields: driver licence, parcel no., haste, policy no., transport doc, adjustment bill … */
    extra: jsonb('extra').$type<Record<string, string>>(),

    remark: text('remark'),
    narration: text('narration'),
    createdById: integer('created_by_id').references(() => users.id),
    updatedById: integer('updated_by_id').references(() => users.id),
    ...stamps
  },
  (t) => [
    index('voucher_number_idx').on(t.companyId, t.fyId, t.type, t.number),
    index('voucher_legacy').on(t.legacyCode),
    index('voucher_type_date').on(t.companyId, t.fyId, t.type, t.date),
    index('voucher_party').on(t.partyId),
    index('voucher_source').on(t.sourceId)
  ]
);

export const voucherLines = pgTable(
  'voucher_lines',
  {
    id: id(),
    voucherId: integer('voucher_id').notNull().references(() => vouchers.id, { onDelete: 'cascade' }),
    lineNo: integer('line_no').notNull(),
    itemId: integer('item_id').references(() => items.id),
    accountId: integer('account_id').references(() => accounts.id), // ledger lines (journal, general purchase)
    description: varchar('description', { length: 240 }),
    brand: varchar('brand', { length: 120 }),
    lotNo: varchar('lot_no', { length: 40 }),
    grade: varchar('grade', { length: 20 }),
    hsn: varchar('hsn', { length: 10 }),
    unit: varchar('unit', { length: 10 }).notNull().default('KG'),
    godownId: integer('godown_id'),
    pcs: qty('pcs').notNull().default(0), // cartons / boxes
    cops: qty('cops').notNull().default(0),
    qty: qty('qty').notNull().default(0), // kg
    weight: qty('weight'),
    rate: exact('rate').notNull().default(0),
    basicAmount: money('basic_amount').notNull().default(0),
    discPct: pct('disc_pct').notNull().default(0),
    discAmount: money('disc_amount').notNull().default(0),
    freightPct: pct('freight_pct').notNull().default(0),
    freightAmount: money('freight_amount').notNull().default(0),
    insurancePct: pct('insurance_pct').notNull().default(0),
    insuranceAmount: money('insurance_amount').notNull().default(0),
    taxableAmount: money('taxable_amount').notNull().default(0),
    gstRate: pct('gst_rate').notNull().default(0),
    cgstAmount: money('cgst_amount').notNull().default(0),
    sgstAmount: money('sgst_amount').notNull().default(0),
    igstAmount: money('igst_amount').notNull().default(0),
    tcsAmount: money('tcs_amount').notNull().default(0),
    amount: money('amount').notNull().default(0),
    debit: money('debit').notNull().default(0), // journal-type vouchers
    credit: money('credit').notNull().default(0),
    remark1: varchar('remark1', { length: 200 }),
    remark2: varchar('remark2', { length: 200 }),
    challanNo: varchar('challan_no', { length: 40 }),
    challanDate: date('challan_date', { mode: 'string' }),
    purchaseRef: varchar('purchase_ref', { length: 40 }),
    purchaseInvNo: varchar('purchase_inv_no', { length: 40 }),
    lrNo: varchar('lr_no', { length: 40 }),
    /** line of the document this one was made from (schedule line, order line, bill line) */
    sourceLineId: integer('source_line_id'),
    /** root order line (sales / purchase order) — drives pending qty */
    orderLineId: integer('order_line_id'),
    lineStatus: varchar('line_status', { length: 20 }),
    legacyCode: varchar('legacy_code', { length: 40 }),
    extra: jsonb('extra').$type<Record<string, unknown>>()
  },
  (t) => [
    index('vline_voucher').on(t.voucherId),
    index('vline_source').on(t.sourceLineId),
    index('vline_order').on(t.orderLineId),
    index('vline_item').on(t.itemId)
  ]
);

/** Double-entry ledger postings — the single source for every account balance */
export const ledgerEntries = pgTable(
  'ledger_entries',
  {
    id: id(),
    companyId: integer('company_id').notNull().references(() => companies.id, { onDelete: 'cascade' }),
    fyId: integer('fy_id').notNull().references(() => financialYears.id),
    voucherId: integer('voucher_id').notNull().references(() => vouchers.id, { onDelete: 'cascade' }),
    accountId: integer('account_id').notNull().references(() => accounts.id),
    date: date('date', { mode: 'string' }).notNull(),
    debit: money('debit').notNull().default(0),
    credit: money('credit').notNull().default(0),
    narration: text('narration'),
    /** 20 / 24 — see vouchers.ledgerPeriod; balances are always taken within one period */
    ledgerPeriod: integer('ledger_period'),
    /** posting kind of the old software (SAL, CGST, TDS, OPENING …) */
    subtype: varchar('subtype', { length: 20 }),
    /** contra account of the posting (old AccountLedger.BkCode) */
    contraAccountId: integer('contra_account_id'),
    billNo: varchar('bill_no', { length: 60 }),
    costCenterId: integer('cost_center_id'),
    legacyCode: varchar('legacy_code', { length: 30 }),
    /** row number of the source line in the archived AccountLedger of that period */
    legacyRow: integer('legacy_row')
  },
  (t) => [index('ledger_account_date').on(t.accountId, t.date), index('ledger_voucher').on(t.voucherId), index('ledger_company_account').on(t.companyId, t.accountId, t.ledgerPeriod)]
);

/** Stock movements (in/out) per item + brand + lot + grade + godown */
export const stockEntries = pgTable(
  'stock_entries',
  {
    id: id(),
    companyId: integer('company_id').notNull().references(() => companies.id, { onDelete: 'cascade' }),
    fyId: integer('fy_id').notNull().references(() => financialYears.id),
    voucherId: integer('voucher_id').notNull().references(() => vouchers.id, { onDelete: 'cascade' }),
    voucherLineId: integer('voucher_line_id'),
    date: date('date', { mode: 'string' }).notNull(),
    itemId: integer('item_id').notNull().references(() => items.id),
    brand: varchar('brand', { length: 120 }),
    lotNo: varchar('lot_no', { length: 40 }),
    grade: varchar('grade', { length: 20 }),
    godownId: integer('godown_id').references(() => godowns.id),
    qtyIn: qty('qty_in').notNull().default(0),
    qtyOut: qty('qty_out').notNull().default(0),
    pcsIn: qty('pcs_in').notNull().default(0),
    pcsOut: qty('pcs_out').notNull().default(0),
    rate: exact('rate').notNull().default(0),
    value: money('value').notNull().default(0)
  },
  (t) => [index('stock_item').on(t.companyId, t.itemId, t.lotNo), index('stock_voucher').on(t.voucherId)]
);

/** Bill-wise settlement: a receipt / payment / note settles part of a bill */
export const billAllocations = pgTable(
  'bill_allocations',
  {
    id: id(),
    companyId: integer('company_id').notNull().references(() => companies.id, { onDelete: 'cascade' }),
    /** settling document; null for amounts settled before the books began (old "OpPaidAmt") */
    voucherId: integer('voucher_id').references(() => vouchers.id, { onDelete: 'cascade' }),
    billId: integer('bill_id').notNull().references(() => vouchers.id, { onDelete: 'cascade' }),
    amount: money('amount').notNull(),
    /** RECEIPT | JOURNAL | BILL | PENDING | OPENING_PAID */
    kind: varchar('kind', { length: 20 }),
    date: date('date', { mode: 'string' }),
    interest: money('interest'),
    tdsAmount: money('tds_amount'),
    partyId: integer('party_id'),
    ledgerPeriod: integer('ledger_period'),
    extra: jsonb('extra').$type<Record<string, unknown>>()
  },
  (t) => [index('alloc_bill').on(t.billId), index('alloc_voucher').on(t.voucherId)]
);

export const approvalLogs = pgTable('approval_logs', {
  id: id(),
  voucherId: integer('voucher_id').notNull().references(() => vouchers.id, { onDelete: 'cascade' }),
  action: varchar('action', { length: 20 }).notNull(), // SUBMITTED | APPROVED | REJECTED | REOPENED
  reason: text('reason'),
  userId: integer('user_id').references(() => users.id),
  at: timestamp('at', { withTimezone: true }).notNull().defaultNow()
});

/** Message templates (old SmsTemplate): text with {#Field#} placeholders and a ---ITEMDETAIL--- block per item */
export const messageTemplates = pgTable(
  'message_templates',
  {
    id: id(),
    companyId: integer('company_id').notNull(),
    formType: varchar('form_type', { length: 20 }).notNull(), // SAL | SALRTN | SalOrder | BANKREC | BANKPAY | DBNT | CRNT | PARTY_MASTER
    body: text('body').notNull().default(''),
    attachPdf: boolean('attach_pdf').notNull().default(false),
    /** extra reports sent with the message, e.g. [{ report: 'Party Wise Outstanding', to: 'Party Group' }] */
    extraReports: jsonb('extra_reports'),
    isActive: boolean('is_active').notNull().default(true),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
  },
  (t) => [uniqueIndex('message_template_type').on(t.companyId, t.formType)]
);

/** WhatsApp outbox and sent log (old WhatsUpMst) */
export const whatsappMessages = pgTable(
  'whatsapp_messages',
  {
    id: id(),
    companyId: integer('company_id').notNull(),
    formType: varchar('form_type', { length: 20 }).notNull(),
    msgType: varchar('msg_type', { length: 8 }).notNull(), // TEXT | PDF
    voucherId: integer('voucher_id'),
    billNo: varchar('bill_no', { length: 60 }),
    mobile: varchar('mobile', { length: 20 }),
    body: text('body'),
    caption: text('caption'),
    attachment: text('attachment'), // print link for a PDF message
    status: varchar('status', { length: 12 }).notNull().default('PENDING'), // PENDING | SENDING | SENT | FAILED | SKIPPED | NO MOBILE
    error: text('error'),
    tries: integer('tries').notNull().default(0),
    pickedAt: timestamp('picked_at', { withTimezone: true }),
    meta: jsonb('meta'), // official API: { template, lang, params }
    wamid: varchar('wamid', { length: 120 }), // WhatsApp message id, for delivered / read ticks
    deliveredAt: timestamp('delivered_at', { withTimezone: true }),
    readAt: timestamp('read_at', { withTimezone: true }),
    sentAt: timestamp('sent_at', { withTimezone: true }),
    userId: integer('user_id'),
    isManual: boolean('is_manual').notNull().default(false),
    legacy: boolean('legacy').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
  },
  (t) => [index('whatsapp_status').on(t.companyId, t.status, t.createdAt), index('whatsapp_voucher').on(t.voucherId), index('whatsapp_wamid').on(t.wamid)]
);

/** how WhatsApp messages are sent: off, the linked-phone sender, or the official WhatsApp Cloud API (one row per main company) */
export const whatsappSettings = pgTable('whatsapp_settings', {
  companyId: integer('company_id').primaryKey(),
  mode: varchar('mode', { length: 10 }).notNull().default('linked'), // off | linked | cloud
  phoneNumberId: varchar('phone_number_id', { length: 40 }),
  wabaId: varchar('waba_id', { length: 40 }),
  appId: varchar('app_id', { length: 40 }),
  accessToken: text('access_token'),
  appSecret: text('app_secret'),
  verifyToken: varchar('verify_token', { length: 80 }),
  apiVersion: varchar('api_version', { length: 10 }).notNull().default('v23.0'),
  lang: varchar('lang', { length: 10 }).notNull().default('en'),
  graphBase: varchar('graph_base', { length: 200 }), // only for testing; empty = https://graph.facebook.com
  displayNumber: varchar('display_number', { length: 30 }),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
});

export const auditLogs = pgTable(
  'audit_logs',
  {
    id: id(),
    companyId: integer('company_id'),
    userId: integer('user_id'),
    entity: varchar('entity', { length: 40 }).notNull(),
    entityId: integer('entity_id'),
    action: varchar('action', { length: 20 }).notNull(), // CREATE | UPDATE | DELETE | ACTION
    summary: text('summary'),
    data: jsonb('data'),
    at: timestamp('at', { withTimezone: true }).notNull().defaultNow()
  },
  (t) => [index('audit_entity').on(t.entity, t.entityId)]
);

/* -------------------------------------------------------------- relations */
export const voucherRelations = relations(vouchers, ({ many, one }) => ({
  lines: many(voucherLines),
  party: one(accounts, { fields: [vouchers.partyId], references: [accounts.id] })
}));
export const voucherLineRelations = relations(voucherLines, ({ one }) => ({
  voucher: one(vouchers, { fields: [voucherLines.voucherId], references: [vouchers.id] }),
  item: one(items, { fields: [voucherLines.itemId], references: [items.id] })
}));

/** emails, as the old software sent them with each bill / order / note (EmailLogMst) */
export const emailMessages = pgTable(
  'email_messages',
  {
    id: id(),
    companyId: integer('company_id').notNull(),
    formType: varchar('form_type', { length: 20 }).notNull(),
    voucherId: integer('voucher_id'),
    billNo: varchar('bill_no', { length: 60 }),
    toEmail: varchar('to_email', { length: 300 }),
    subject: text('subject'),
    body: text('body'),
    isHtml: boolean('is_html').notNull().default(false),
    attachments: jsonb('attachments'), // [{ link, filename }]
    status: varchar('status', { length: 12 }).notNull().default('PENDING'), // PENDING | SENDING | SENT | FAILED | SKIPPED | NO EMAIL
    error: text('error'),
    tries: integer('tries').notNull().default(0),
    pickedAt: timestamp('picked_at', { withTimezone: true }),
    sentAt: timestamp('sent_at', { withTimezone: true }),
    userId: integer('user_id'),
    legacy: boolean('legacy').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
  },
  (t) => [index('email_status').on(t.companyId, t.status, t.createdAt), index('email_voucher').on(t.voucherId)]
);

/** outgoing mail server (one row per main company) */
export const emailSettings = pgTable('email_settings', {
  companyId: integer('company_id').primaryKey(),
  mode: varchar('mode', { length: 10 }).notNull().default('off'), // off | auto
  host: varchar('host', { length: 120 }),
  port: integer('port').notNull().default(587),
  secure: boolean('secure').notNull().default(false), // true = SSL on 465; false = STARTTLS on 587
  username: varchar('username', { length: 200 }),
  password: text('password'),
  fromName: varchar('from_name', { length: 120 }),
  forms: jsonb('forms'), // which documents email automatically, e.g. ["SAL","SALRTN","SalOrder","DBNT","CRNT"]
  dailyLimit: integer('daily_limit').notNull().default(450),
  pausedUntil: timestamp('paused_until', { withTimezone: true }),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
});
