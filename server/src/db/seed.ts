/**
 * Demo data — the parties, yarns, brands and transporters from the design,
 * plus six months of trading (Apr–Oct 2026) created through the real
 * document engine, so ledgers, stock and outstanding are all consistent.
 *
 *   npm run db:seed          (expects an empty, migrated database)
 *
 * Logins (change after first sign-in):
 *   admin@yarnflow.in / Admin@123     ADMIN
 *   accounts@yarnflow.in / Accounts@123  ACCOUNTANT
 *   sales@yarnflow.in / Sales@123     SALES
 *   purchase@yarnflow.in / Purchase@123  PURCHASE
 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import bcrypt from 'bcryptjs';
import { and, eq } from 'drizzle-orm';
import { createDb, type Db, type Tx } from './index.js';
import { accountGroups, accounts, brands, companies, godowns, items, salesPersons, transporters, userCompanies, users, vehicles, vouchers } from './schema.js';
import type { Ctx } from '../services/context.js';
import { createDoc, docAction, pendingLines } from '../services/documents.js';
import { generateEwb } from '../services/eway.js';
import { createInterestNotes } from '../services/analysis.js';
import { clearSysCache, createCompany } from '../services/setup.js';
import { TYPES } from '../services/types.js';

let seed = 20261023;
const rnd = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280);
const pick = <T>(a: T[]) => a[Math.floor(rnd() * a.length)];
const between = (lo: number, hi: number) => lo + Math.floor(rnd() * (hi - lo + 1));
const d = (m: number, day: number) => `2026-${String(m).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

const STATE: Record<string, [string, string]> = {
  '24': ['Gujarat', '24'], '27': ['Maharashtra', '27'], '26': ['Dadra & Nagar Haveli and Daman & Diu', '26'], '03': ['Punjab', '03'], '33': ['Tamil Nadu', '33'], '19': ['West Bengal', '19']
};
let panSeq = 1000;
const gstinFor = (state: string, name: string) => {
  const letters = (name.replace(/[^A-Z]/gi, '').toUpperCase() + 'XXXXX').slice(0, 1);
  panSeq += 37;
  return `${state}AA${'BCFHT'[panSeq % 5]}${letters}${'ABCDEFGH'[panSeq % 8]}${String(panSeq).slice(-4)}${'KLMNP'[panSeq % 5]}1Z${(panSeq % 9) + 1}`;
};

export async function seedDemo(db: Db) {
  clearSysCache();
  const pw = (s: string) => bcrypt.hash(s, 10);
  const [admin] = await db.insert(users).values({ name: 'Avi Patel', email: 'admin@yarnflow.in', mobile: '98250 11111', role: 'ADMIN', passwordHash: await pw('Admin@123') }).returning();
  const others = await db
    .insert(users)
    .values([
      { name: 'Prakash Mehta', email: 'accounts@yarnflow.in', role: 'ACCOUNTANT', passwordHash: await pw('Accounts@123') },
      { name: 'Rajesh Shah', email: 'sales@yarnflow.in', role: 'SALES', passwordHash: await pw('Sales@123') },
      { name: 'Hitesh Bhatt', email: 'purchase@yarnflow.in', role: 'PURCHASE', passwordHash: await pw('Purchase@123') }
    ])
    .returning();

  let company!: typeof companies.$inferSelect;
  let fyId = 0;
  await db.transaction(async (tx) => {
    const res = await createCompany(tx, {
      name: 'Shree Umiya Yarn', shortName: 'Umiya', legalName: 'Shree Umiya Yarn Pvt Ltd', gstin: '24AAKCS4471M1Z5', pan: 'AAKCS4471M',
      address1: '412, Textile Market, Ring Road', city: 'Surat', state: 'Gujarat', stateCode: '24', pincode: '395002', phone: '0261 2345678', email: 'accounts@umiyayarn.in',
      bankName: 'HDFC Bank', bankAccountNo: '50200012344412', ifsc: 'HDFC0000123', fyLabel: '26-27'
    }, admin.id);
    company = res.company;
    fyId = res.fy.id;
    for (const u of others) await tx.insert(userCompanies).values({ userId: u.id, companyId: company.id });
    // a second, smaller company so the company switcher has something to switch to
    await createCompany(tx, { name: 'Umiya Trading Co.', shortName: 'UTC', gstin: '24AAJFU2290K1Z8', city: 'Surat', state: 'Gujarat', stateCode: '24', fyLabel: '26-27' }, admin.id);
  });

  const C = company.id;
  const group = async (name: string) => (await db.select().from(accountGroups).where(and(eq(accountGroups.companyId, C), eq(accountGroups.name, name))))[0].id;
  const G = {
    surat: await group('Surat Debtors'), outstation: await group('Out-station Debtors'), mills: await group('Yarn Mills'), creditors: await group('Sundry Creditors'),
    brokers: await group('Brokers'), transporters: await group('Transporters'), bank: await group('Bank Accounts'), indirect: await group('Indirect Expenses'), capital: await group('Capital Account'), direct: await group('Direct Expenses')
  };

  /* -------- masters */
  const sp = await db.insert(salesPersons).values(['Avi M', 'Rajesh Shah', 'Manoj', 'Aelish', 'Krish J'].map((name) => ({ companyId: C, name }))).returning();
  await db.insert(godowns).values({ companyId: C, name: 'Pandesara godown', city: 'Surat', address: 'Plot 22, Pandesara GIDC' });
  await db.update(godowns).set({ name: 'Sachin GIDC godown', address: 'Plot 118, Sachin GIDC, Surat' }).where(and(eq(godowns.companyId, C), eq(godowns.isDefault, true)));

  const TR = [
    ['Navkar Roadlines', '24AAJFN3381Q1Z6', 'Surat → Bhiwandi, Surat → Ichalkaranji', 3.2, '98984 22410'],
    ['Jay Ambe Roadlines', '24AAKFJ6619L1Z0', 'Silvassa → Surat', 2.1, '98252 70014'],
    ['Sai Kripa Transport', '24ABUFS2207C1Z4', 'Surat → Ichalkaranji, Surat → Malegaon', 3.6, '99250 18840'],
    ['Mahalaxmi Cargo Movers', '24AAFFM9054R1Z8', 'Surat → Ludhiana', 6.8, '97140 33215'],
    ['Ganesh Freight Carriers', '24AAGFG1146N1Z2', 'Surat → Malegaon', 45, '98795 60021'],
    ['Shiv Logistics', '24ACNFS7730H1Z9', 'Surat → Tiruppur', 7.4, '90990 44178'],
    ['Shree Maruti Cargo', '24AAEFS5512K1Z1', 'Surat → Mumbai', 2.9, '98250 55120'],
    ['VRL Logistics', '29AABCV3609C1ZJ', 'Pan India', 4.5, '1800 425 1188'],
    ['Shivam Transport Services', '24ABCFS0912E1Z3', 'Surat local', 1.8, '99099 12121'],
    ['Rajdhani Transport Co.', '24AAPFR0048K1Z1', 'Surat → Kolkata', 8.9, '98240 99112']
  ] as const;
  const trs = await db
    .insert(transporters)
    .values(TR.map(([name, tid, routes, rate, mobile], i) => ({ companyId: C, name, transporterId: tid, gstin: tid, routes, rate, mobile, city: 'Surat', rateBasis: (i === 4 ? 'PER_BOX' : 'PER_KG') as never, status: (i === 9 ? 'ON_HOLD' : 'ACTIVE') as never })))
    .returning();
  await db.insert(vehicles).values(trs.slice(0, 6).map((t, i) => ({ companyId: C, transporterId: t.id, number: `GJ05${['BX', 'AV', 'CT', 'UU', 'AB', 'XY'][i]}${4120 + i * 377}`, driverName: ['Ramesh', 'Suresh', 'Jaybhai', 'Mahesh', 'Dinesh', 'Kalpesh'][i] })));

  const BR = ['Reliance', 'Sanathan', 'GTPL', 'Durga', 'J.J. Industries', 'Garden', 'Wellknown', 'Filatex', 'Indorama', 'Century', 'Saanika', 'Roscco', 'RK Fashion', 'Radiant', 'Daya', 'AYM Syntex', 'Vardhman', 'Arvind', 'JCT Fibres'];
  const brs = await db.insert(brands).values(BR.map((name) => ({ companyId: C, name }))).returning();
  const brand = (n: string) => brs.find((b) => b.name === n)!.id;

  // [code, name, description, type, denier, filament, lustre, brand, hsn, rate, stdBox]
  const IT: [string, string, string, string, string, string, string, string, string, number, number][] = [
    ['PFY-5024-SDC', '50/24 SD CAT', 'Polyester FDY 50/24 SD Cationic', 'FDY', '50', '24', 'SD', 'Reliance', '5402', 179.6, 62],
    ['PFY-10036-TX', '100/36 TEX', 'Polyester Textured 100/36', 'DTY', '100', '36', 'SD', 'GTPL', '5402', 115, 60],
    ['PFY-10836-TX', '108/36 TEX', 'Polyester Textured 108/36', 'DTY', '108', '36', 'SD', 'GTPL', '5402', 115, 60],
    ['PFY-75144-SIM', '75/144 SIM', 'Polyester 75/144 SIM', 'DTY', '75', '144', 'SD', 'Reliance', '5402', 95, 60],
    ['PFY-5048', '50/48 FDY', 'Polyester FDY 50/48', 'FDY', '50', '48', 'SD', 'Reliance', '5402', 140, 62],
    ['PFY-5012-BRT', '50/12 BRT', 'Polyester FDY 50/12 Bright', 'FDY', '50', '12', 'BR', 'Durga', '5402', 185.14, 60],
    ['FAN-MBR', 'Muskan Bright', 'Fancy yarn Muskan Bright', 'OTHER', '', '', 'BR', 'J.J. Industries', '5402', 370, 30],
    ['FAN-MGD', 'Muskan Gold', 'Fancy yarn Muskan Gold', 'OTHER', '', '', 'BR', 'J.J. Industries', '5402', 580, 30],
    ['VIC-110', '110 Vichitra', 'Vichitra 110D', 'OTHER', '110', '', 'SD', 'GTPL', '5402', 154.71, 50],
    ['PFY-5048-NL', '50/48 FDY NLBS', 'Polyester FDY 50/48 NLBS', 'FDY', '50', '48', 'SD', 'Garden', '5402', 134.12, 62],
    ['PFY-7536-SD', '75/36 FDY', 'Polyester FDY 75/36 SD Raw White', 'FDY', '75', '36', 'SD', 'Reliance', '5402', 136, 60],
    ['PFY-15048-BR', '150/48 FDY BR', 'Polyester FDY 150/48 BR', 'FDY', '150', '48', 'BR', 'Reliance', '5402', 118.5, 60],
    ['PFY-7572-SD', '75/72 Roto', 'Polyester FDY 75/72 SD Micro Roto', 'FDY', '75', '72', 'SD', 'Saanika', '5402', 138.5, 60],
    ['POY-25048', 'POY 250/48', 'Polyester POY 250/48', 'POY', '250', '48', 'SD', 'Indorama', '5402', 104, 80],
    ['DTY-8036-SIM', 'DTY 80/36 SIM', 'Polyester DTY 80/36 SIM', 'DTY', '80', '36', 'SD', 'Filatex', '5402', 128, 50],
    ['VFY-120-BR', 'Viscose 120D BR', 'Viscose Filament 120D/30F BR', 'VISCOSE', '120', '30', 'BR', 'Century', '5403', 212.5, 48],
    ['NYL-4034-SD', 'Nylon 6 FDY 40/34', 'Nylon 6 FDY 40/34 SD', 'NYLON', '40', '34', 'SD', 'JCT Fibres', '5402', 268, 24],
    ['PVS-30S', 'PV Spun 30s', 'PV Spun 30s (65/35)', 'SPUN', '30s', '', '', 'Vardhman', '5509', 210, 45.36],
    ['COT-40S-CMB', 'Cotton Combed 40s', 'Cotton Combed 40s', 'COTTON', '40s', '', '', 'Arvind', '5205', 312, 45.36],
    ['PFY-7536-CR', '75/36 Crimp', 'Polyester 75/36 Crimp', 'DTY', '75', '36', 'SD', 'Saanika', '5402', 136.76, 60],
    ['PFY-5048-CR', '50/48 CREP', 'Polyester 50/48 Crepe', 'FDY', '50', '48', 'SD', 'RK Fashion', '5402', 252.44, 26],
    ['BSY-8048', 'BSY 80/48', 'Bright BSY 80/48', 'FDY', '80', '48', 'BR', 'Radiant', '5402', 155, 60],
    ['ROTO-7572', 'Roto Lim 75/72', 'Roto Lim 75/72', 'FDY', '75', '72', 'SD', 'Daya', '5402', 105, 60],
    ['BC-5036', 'Bright Catonic 50/36', 'Bright Cationic 50/36', 'FDY', '50', '36', 'BR', 'AYM Syntex', '5402', 155.72, 60]
  ];
  const its = await db
    .insert(items)
    .values(IT.map(([code, name, description, type, denier, filament, lustre, b, hsn, rate, std]) => ({ companyId: C, code, name, description, type: type as never, denier, filament, lustre, brandId: brand(b), hsn, gstRate: 5, rate, stdBoxKg: std, conesPerBox: 6, minStock: 500 })))
    .returning();
  const gen = await db
    .insert(items)
    .values([
      { companyId: C, code: 'SRV-BROK', name: 'Brokerage service', type: 'SERVICE' as never, hsn: '9961', gstRate: 18, unit: 'NOS', isGeneral: true },
      { companyId: C, code: 'GEN-PACK', name: 'Packing material (cartons)', type: 'OTHER' as never, hsn: '4819', gstRate: 18, unit: 'NOS', isGeneral: true },
      { companyId: C, code: 'GEN-WASTE', name: 'Yarn waste', type: 'OTHER' as never, hsn: '5505', gstRate: 5, unit: 'KG', isGeneral: true }
    ])
    .returning();
  const item = (n: string) => its.find((i) => i.name === n)!;

  /* -------- accounts */
  const acc = async (v: Partial<typeof accounts.$inferInsert> & { name: string; groupId: number; kind: string }) =>
    (await db.insert(accounts).values({ companyId: C, ...v, kind: v.kind as never } as never).returning())[0];
  const brokers = [];
  for (const [name, city, mobile] of [['Mahesh Shah (Broker)', 'Surat', '98251 66870'], ['Manoj Brokers', 'Surat', '98250 30401'], ['Kiran Agency', 'Surat', '98795 11223'], ['Ramji Agency', 'Surat', '99790 44120']] as const) {
    brokers.push(await acc({ name, groupId: G.brokers, kind: 'BROKER', city, mobile, stateCode: '24', state: 'Gujarat', brokerageRate: 0.5, brokerageType: 'PER_KG', openingBalance: between(5, 40) * 1000, openingType: 'CR' }));
  }
  const hdfc = await acc({ name: 'HDFC Bank · Current ••4412', groupId: G.bank, kind: 'BANK', bankName: 'HDFC Bank', bankAccountNo: '50200012344412', ifsc: 'HDFC0000123', city: 'Surat', openingBalance: 1842300, openingType: 'DR' });
  const sbi = await acc({ name: 'SBI · Current ••0918', groupId: G.bank, kind: 'BANK', bankName: 'State Bank of India', bankAccountNo: '30887110918', ifsc: 'SBIN0001234', city: 'Surat', openingBalance: 640000, openingType: 'DR' });
  const rent = await acc({ name: 'Office Rent', groupId: G.indirect, kind: 'EXPENSE' });
  const salary = await acc({ name: 'Salary & Wages', groupId: G.indirect, kind: 'EXPENSE' });
  const elec = await acc({ name: 'Electricity Expenses', groupId: G.indirect, kind: 'EXPENSE' });
  await acc({ name: 'Telephone & Internet', groupId: G.indirect, kind: 'EXPENSE' });
  const freightOut = await acc({ name: 'Freight Outward', groupId: G.direct, kind: 'EXPENSE' });

  // customers: [name, city, state, credit limit (L), credit days, status, area]
  const CU: [string, string, string, number, number, string, string?][] = [
    ['Bhagwati Filaments', 'Surat', '24', 25, 4, 'ACTIVE', 'Udhna'], ['Meghna Yogeshbhai', 'Surat', '24', 10, 15, 'ACTIVE'], ['Riddhi Dharmesh Patel', 'Surat', '24', 8, 15, 'ACTIVE'],
    ['A P N Corporation', 'Surat', '24', 6, 1, 'ACTIVE'], ['Bansam Fabrics', 'Surat', '24', 60, 1, 'ACTIVE', 'Sachin GIDC'], ['Shree Rudraksha Poly', 'Surat', '24', 50, 4, 'ACTIVE', 'Pandesara'],
    ['Jigita Fab LLP', 'Surat', '24', 15, 15, 'ACTIVE'], ['Ganpati Silk Mill', 'Surat', '24', 20, 15, 'ACTIVE'], ['Kanvi Corporation', 'Surat', '24', 5, 15, 'ACTIVE'],
    ['Maa Ashapura Textile', 'Surat', '24', 8, 1, 'ACTIVE'], ['Sujal Synthetics', 'Surat', '24', 12, 1, 'ACTIVE'], ['Veer Enterprise', 'Surat', '24', 10, 1, 'ACTIVE'],
    ['Badra Fabrics', 'Surat', '24', 8, 15, 'ACTIVE'], ['OM Fabrics', 'Surat', '24', 6, 15, 'ON_HOLD'], ['Yogeshwar Textiles', 'Surat', '24', 6, 17, 'ACTIVE'],
    ['Chetna Textiles', 'Surat', '24', 20, 1, 'ACTIVE'], ['Geeta Fab', 'Surat', '24', 10, 15, 'ACTIVE'], ['Omkar Synthetics', 'Surat', '24', 6, 10, 'ACTIVE'],
    ['Krishna Textiles', 'Surat', '24', 6, 45, 'ON_HOLD', 'Ring Road'], ['Navrang Prints', 'Surat', '24', 5, 30, 'ACTIVE'], ['Shiv Shakti Fabrics', 'Sachin GIDC', '24', 8, 30, 'ACTIVE'],
    ['Om Sai Weaving', 'Pandesara', '24', 7.5, 30, 'ACTIVE'], ['Laxmi Creation', 'Bhiwandi', '27', 5, 30, 'ACTIVE'], ['Rannade Textile', 'Surat', '24', 15, 15, 'ACTIVE'],
    ['Diya Textiles', 'Surat', '24', 8, 15, 'ACTIVE'], ['Sai Ganesh Textiles', 'Ichalkaranji', '27', 12, 30, 'ACTIVE'], ['Punjab Knits', 'Ludhiana', '03', 10, 45, 'ACTIVE'],
    ['Tiruppur Garments Exports', 'Tiruppur', '33', 15, 45, 'ACTIVE']
  ];
  const cust: Record<string, typeof accounts.$inferSelect> = {};
  for (const [name, city, st, lim, days, status, area] of CU) {
    const gstin = gstinFor(st, name);
    cust[name] = await acc({
      name, groupId: st === '24' ? G.surat : G.outstation, kind: 'CUSTOMER', city, area: area ?? null, state: STATE[st][0], stateCode: st, gstin, pan: gstin.slice(2, 12),
      mobile: `98${between(10, 99)}${between(100, 999)} ${between(10000, 99999)}`.slice(0, 11), creditLimit: lim * 100000, creditDays: days, status: status as never,
      brokerId: rnd() < 0.5 ? pick(brokers).id : null, salesPersonId: pick(sp).id, collectionPersonId: pick(sp.slice(0, 3)).id, interestRate: 18, transporterId: pick(trs.slice(0, 7)).id,
      openingBalance: between(0, 3) ? between(20, 300) * 1000 : 0, openingType: 'DR', address1: `${between(1, 400)}, ${area ?? city} Textile Market`
    });
  }
  await db.update(accounts).set({ partyGroupId: cust['Meghna Yogeshbhai'].id }).where(eq(accounts.id, cust['Riddhi Dharmesh Patel'].id));
  await db.update(accounts).set({ partyGroupId: cust['Kanvi Corporation'].id }).where(eq(accounts.id, cust['Ganpati Silk Mill'].id));

  // suppliers / mills
  const SU: [string, string, string, number][] = [
    ['Reliance Industries', 'Silvassa', '26', 975623], ['Sanathan Textiles', 'Silvassa', '26', 840000], ['Century Rayon', 'Kalyan', '27', 446250],
    ['Bandhan Filaments', 'Surat', '24', 120000], ['Shree Durga Syntex', 'Surat', '24', 210000], ['GTPL Spinners', 'Surat', '24', 0],
    ['Wellknown Polyesters P Ltd', 'Silvassa', '26', 0], ['RK Fashion Yarns', 'Surat', '24', 0], ['Daya Tex Industries', 'Surat', '24', 0],
    ['Radiant Polyester', 'Surat', '24', 0], ['Shree Ram Yarn Trading', 'Surat', '24', 0], ['J.J. Industries', 'Surat', '24', 0], ['Garden Silk Mills', 'Surat', '24', 0], ['Saanika Industries', 'Surat', '24', 0]
  ];
  const sup: Record<string, typeof accounts.$inferSelect> = {};
  for (const [name, city, st, open] of SU) {
    const gstin = gstinFor(st, name);
    sup[name] = await acc({
      name, groupId: G.mills, kind: 'SUPPLIER', city, state: STATE[st][0], stateCode: st, gstin, pan: gstin.slice(2, 12), creditDays: pick([7, 15, 30]),
      openingBalance: open, openingType: 'CR', tdsApplicable: open > 0 || rnd() < 0.5, tdsRate: 0.1, transporterId: trs[1].id
    });
  }
  // transporter ledgers
  for (const t of trs.slice(0, 4)) {
    const a = await acc({ name: t.name + ' (A/c)', groupId: G.transporters, kind: 'TRANSPORTER', city: 'Surat', gstin: t.gstin, openingBalance: between(3, 30) * 1000, openingType: 'CR' });
    await db.update(transporters).set({ accountId: a.id }).where(eq(transporters.id, t.id));
  }

  // capital balances the opening trial balance (opening stock is added below)
  const all = await db.select().from(accounts).where(eq(accounts.companyId, C));
  const net = all.reduce((s, a) => s + (a.openingType === 'DR' ? a.openingBalance : -a.openingBalance), 0);

  /* -------- transactions (through the real engine) */
  const ctx = (tx: Tx): Ctx => ({ db: tx, userId: admin.id, role: 'ADMIN', companyId: C, fyId });
  const run = <T>(fn: (c: Ctx) => Promise<T>) => db.transaction((tx) => fn(ctx(tx)));
  const create = (slug: keyof typeof SLUG, body: unknown) => run((c) => createDoc(c, TYPES[SLUG[slug]], body)) as Promise<Record<string, unknown> & { id: number; number: string; netAmount: number; lines: { id: number; qty: number }[] }>;
  const SLUG = { cn: 'CREDIT_NOTE', dn: 'DEBIT_NOTE', so: 'SALES_ORDER', po: 'PURCHASE_ORDER', ds: 'DISPATCH_SCHEDULE', sb: 'SALE_BILL', pb: 'PURCHASE_BILL', sr: 'SALE_RETURN', pr: 'PURCHASE_RETURN', gs: 'GENERAL_SALE', gp: 'GENERAL_PURCHASE', rc: 'RECEIPT', py: 'PAYMENT', jv: 'JOURNAL', ct: 'CONTRA', os: 'OPENING_STOCK' } as const;

  // opening stock
  const lots: { item: typeof its[number]; lot: string; grade: string; brand: string; qty: number; rate: number }[] = [];
  for (const it of its) {
    const n = between(1, 2);
    for (let k = 0; k < n; k++) {
      const b = brs.find((x) => x.id === it.brandId)!.name;
      lots.push({ item: it, lot: `${it.code.split('-')[1] ?? 'L'}${between(100, 999)}${'ABCMS'[k]}`, grade: pick(['A+', 'A', '1ST', 'PQ']), brand: b, qty: between(30, 140) * 50, rate: Math.round(it.rate * 0.93 * 100) / 100 });
    }
  }
  const os = await create('os', { date: d(4, 1), narration: 'Opening stock as on 01-04-2026', lines: lots.map((l) => ({ itemId: l.item.id, brand: l.brand, lotNo: l.lot, grade: l.grade, qty: l.qty, pcs: Math.round(l.qty / (l.item.stdBoxKg || 60)), rate: l.rate })) });
  const stockValue = lots.reduce((s, l) => s + l.qty * l.rate, 0);
  const cap = (await db.select().from(accounts).where(and(eq(accounts.companyId, C), eq(accounts.code, 'SYS-CAPITAL'))))[0];
  const capOpen = Math.round((net + stockValue) * 100) / 100;
  await db.update(accounts).set({ openingBalance: Math.abs(capOpen), openingType: capOpen >= 0 ? 'CR' : 'DR' }).where(eq(accounts.id, cap.id));
  void os;

  // purchase orders → purchase bills
  const mills = Object.values(sup);
  for (let i = 0; i < 16; i++) {
    const mill = mills[i % 8];
    const it = pick(its.slice(0, 22));
    const qty = between(10, 45) * 100;
    const date = d(4 + Math.floor(i / 3), between(2, 26));
    const po = await create('po', { date, partyId: mill.id, expDeliveryDate: d(5 + Math.floor(i / 3), 5), refName: 'Hitesh', lines: [{ itemId: it.id, brand: brs.find((b) => b.id === it.brandId)!.name, qty, rate: Math.round(it.rate * 0.92 * 100) / 100, pcs: Math.round(qty / 60) }] });
    if (po.status === 'PENDING_APPROVAL' && i % 4 !== 0) await run((c) => docAction(c, TYPES.PURCHASE_ORDER, po.id, 'approve', 'Rate confirmed with mill'));
    const fresh = await run((c) => pendingLines(c, 'PURCHASE_ORDER', 'PURCHASE_BILL', mill.id));
    const line = fresh.find((l) => Number(l.voucherId) === po.id);
    if (!line || i % 5 === 4) continue;
    const parts = i % 3 === 0 ? 1 : 2;
    for (let k = 0; k < parts; k++) {
      const q = Math.round(((line.pendingQty as number) * (k === 0 ? (parts === 1 ? 1 : 0.6) : 0.3)) * 1000) / 1000;
      await create('pb', {
        date: d(Math.min(10, 4 + Math.floor(i / 3) + k), between(5, 27)), partyId: mill.id, refNo: `MI/${between(100, 999)}/${k + 1}`, refDate: date, transporterId: trs[1].id, lrNo: `JAR-${between(41000, 49999)}`,
        lines: [{ itemId: line.itemId, brand: line.brand, lotNo: `${it.code.split('-')[1] ?? 'P'}${between(100, 999)}M`, grade: pick(['A+', '1ST']), qty: q, pcs: Math.max(1, Math.round(q / 60)), rate: line.rate, sourceLineId: line.lineId }]
      });
    }
  }

  // stock lots available now (opening + purchases) for selling
  const stockRows = await db.execute<{ item_id: number; lot_no: string; grade: string; brand: string; q: string }>(
    `select item_id, lot_no, grade, max(brand) as brand, sum(qty_in - qty_out) as q from stock_entries where company_id = ${C} group by item_id, lot_no, grade having sum(qty_in - qty_out) > 300` as never
  );
  const avail = stockRows.rows.map((r) => ({ itemId: Number(r.item_id), lot: r.lot_no, grade: r.grade, brand: r.brand, q: Number(r.q) }));

  // sales orders → dispatch schedules → sale bills → receipts
  const custs = Object.values(cust).filter((c) => c.status === 'ACTIVE');
  const bills: { id: number; partyId: number; net: number }[] = [];
  for (let i = 0; i < 64; i++) {
    const party = custs[i % custs.length];
    const st = avail[(i * 7) % avail.length];
    if (!st || st.q < 300) continue;
    const it = its.find((x) => x.id === st.itemId)!;
    const qty = Math.min(Math.round(st.q * 0.7 / 10) * 10, between(20, 100) * 50);
    const month = 4 + Math.floor(i / 10);
    const date = d(month, between(2, 26));
    const so = await create('so', {
      date, partyId: party.id, salesPersonId: party.salesPersonId, brokerId: party.brokerId, processType: 'Direct dispatch', orderType: 'Yarn', priority: i % 5 === 0 ? 'URGENT' : 'NORMAL', expDeliveryDate: d(Math.min(10, month + 1), 5), refNo: `BF/PO/${between(100, 400)}`,
      lines: [{ itemId: it.id, brand: st.brand, lotNo: st.lot, grade: st.grade, qty, pcs: Math.round(qty / (it.stdBoxKg || 60)), rate: Math.round(it.rate * (1 + rnd() * 0.08) * 100) / 100 }]
    });
    if (so.status === 'PENDING_APPROVAL') {
      if (i % 3 === 0) continue; // leave some in the approvals inbox
      await run((c) => docAction(c, TYPES.SALES_ORDER, so.id, 'approve', 'Party paid last bills'));
    }
    if (i % 9 === 8) continue; // pending dispatch
    const pl = (await run((c) => pendingLines(c, 'SALES_ORDER', 'DISPATCH_SCHEDULE', party.id))).find((l) => Number(l.voucherId) === so.id);
    if (!pl) continue;
    const dsQty = i % 4 === 0 ? Math.round((pl.pendingQty as number) * 0.6) : (pl.pendingQty as number);
    const tr = trs.find((t) => t.id === party.transporterId) ?? trs[0];
    const ds = await create('ds', { date: d(Math.min(10, month + (i % 2)), between(1, 27)), partyId: party.id, transporterId: tr.id, vehicleNo: `GJ05${pick(['BX', 'AV', 'CT', 'UU'])}${between(1000, 9999)}`, lines: [{ itemId: pl.itemId, brand: pl.brand, lotNo: pl.lotNo, grade: pl.grade, qty: dsQty, pcs: Math.max(1, Math.round(dsQty / 60)), rate: pl.rate, sourceLineId: pl.lineId }] });
    st.q -= dsQty;
    if (i % 7 === 6) continue; // schedule waiting for a bill
    const dl = (await run((c) => pendingLines(c, 'DISPATCH_SCHEDULE', 'SALE_BILL', party.id))).find((l) => Number(l.voucherId) === ds.id);
    if (!dl) continue;
    const billDate = (ds.date as string) > d(10, 25) ? (ds.date as string) : d(Math.min(10, month + (i % 2)), between(Number((ds.date as string).slice(8)), 28));
    const sb = await create('sb', {
      date: billDate < (ds.date as string) ? (ds.date as string) : billDate, partyId: party.id, transporterId: tr.id, vehicleNo: ds.vehicleNo, lrNo: `${tr.name.split(' ')[0].slice(0, 3).toUpperCase()}-${between(41000, 49999)}`, distanceKm: party.stateCode === '24' ? between(8, 40) : between(250, 1600),
      lines: [{ itemId: dl.itemId, brand: dl.brand, lotNo: dl.lotNo, grade: dl.grade, qty: Math.round((dl.pendingQty as number) * (0.996 + rnd() * 0.008) * 1000) / 1000, pcs: dl.pcs, rate: dl.rate, sourceLineId: dl.lineId }]
    });
    bills.push({ id: sb.id, partyId: party.id, net: sb.netAmount });
    if (sb.ewbStatus === 'PENDING' && i % 3 !== 1) await run((c) => generateEwb(c, sb.id, {}));
  }

  // receipts (some bills fully paid, some partly, some open)
  for (const [i, b] of bills.entries()) {
    if (i % 4 === 3) continue;
    const amt = i % 3 === 0 ? Math.round(b.net * 0.5) : b.net;
    const [bill] = await db.select().from(vouchers).where(eq(vouchers.id, b.id));
    const rd = bill.date < d(10, 20) ? d(Math.min(10, Number(bill.date.slice(5, 7)) + 1), between(1, 25)) : bill.date;
    await create('rc', { date: rd > d(10, 31) ? d(10, 31) : rd, partyId: b.partyId, bankAccountId: i % 5 === 0 ? sbi.id : hdfc.id, mode: pick(['NEFT', 'RTGS', 'CHEQUE', 'UPI']), instrumentNo: `UTR${between(100000, 999999)}`, amount: amt, allocations: [{ billId: b.id, amount: amt }] });
  }

  // payments to mills (auto-adjust oldest bills first)
  for (const [i, m] of mills.slice(0, 6).entries()) {
    const open = await db.execute<{ n: string }>(`select coalesce(sum(net_amount - tds_amount),0) as n from vouchers where party_id = ${m.id} and type = 'PURCHASE_BILL'` as never);
    const due = Number(open.rows[0].n);
    if (due <= 0) continue;
    await create('py', { date: d(9 + (i % 2), between(5, 28)), partyId: m.id, bankAccountId: hdfc.id, mode: 'RTGS', instrumentNo: `RTGS${between(10000, 99999)}`, amount: Math.round(due * 0.7), autoAdjust: true });
  }

  // credit note (rate difference) against a bill, debit note to a supplier, interest debit notes
  if (bills[0]) await create('cn', { date: d(10, 20), partyId: bills[0].partyId, sourceId: bills[0].id, reason: 'Rate difference', lines: [{ description: 'Rate difference ₹1.50/kg', qty: 1000, rate: 1.5, gstRate: 5 }] });
  const pbForDn = (await db.select().from(vouchers).where(and(eq(vouchers.companyId, C), eq(vouchers.type, 'PURCHASE_BILL'))))[0];
  if (pbForDn) await create('dn', { date: d(10, 22), partyId: pbForDn.partyId, sourceId: pbForDn.id, reason: 'Short weight', lines: [{ description: 'Short weight 12 kg', qty: 12, rate: 150, gstRate: 5 }] });
  await run((c) => createInterestNotes(c, { asOn: d(10, 31), date: d(10, 31), partyIds: Object.values(cust).slice(0, 4).map((x) => x.id) }));

  // a sale return and a purchase return
  const srcBill = bills[2];
  if (srcBill) {
    const bl = (await run((c) => pendingLines(c, 'SALE_BILL', 'SALE_RETURN', srcBill.partyId)))[0];
    if (bl) await create('sr', { date: d(10, 28), partyId: srcBill.partyId, reason: 'Quality issue', lines: [{ itemId: bl.itemId, brand: bl.brand, lotNo: bl.lotNo, grade: bl.grade, qty: Math.round((bl.pendingQty as number) * 0.05), pcs: 1, rate: bl.rate, sourceLineId: bl.lineId }] });
  }
  const pbl = (await run((c) => pendingLines(c, 'PURCHASE_BILL', 'PURCHASE_RETURN')))[0];
  if (pbl) await create('pr', { date: d(10, 29), partyId: pbl.partyId, reason: 'Excess supply', lines: [{ itemId: pbl.itemId, brand: pbl.brand, lotNo: pbl.lotNo, grade: pbl.grade, qty: Math.min(150, Math.round((pbl.pendingQty as number) * 0.05)), pcs: 1, rate: pbl.rate, sourceLineId: pbl.lineId }] });

  // general sale (brokerage) & general purchase (packing), journals, contra, expenses
  await create('gs', { date: d(10, 15), partyId: sup['Wellknown Polyesters P Ltd'].id, lines: [{ itemId: gen[0].id, qty: 1, rate: 18500, description: 'Brokerage on mill orders – Sept' }] });
  await create('gp', { date: d(9, 12), partyId: sup['Shree Ram Yarn Trading'].id, refNo: 'SR/887', lines: [{ itemId: gen[1].id, qty: 400, rate: 32 }] });
  for (let m = 4; m <= 10; m++) {
    await create('jv', { date: d(m, 28), narration: `Salary & rent for ${['', '', '', '', 'April', 'May', 'June', 'July', 'August', 'September', 'October'][m]}`, lines: [{ accountId: salary.id, debit: 68000 }, { accountId: rent.id, debit: 22000 }, { accountId: elec.id, debit: between(6, 11) * 1000 }, { accountId: hdfc.id, credit: 230000 + 0 }, { accountId: sbi.id, credit: 0 }].map((l, k, arr) => (k === 3 ? { ...l, credit: (arr[0].debit ?? 0) + (arr[1].debit ?? 0) + (arr[2].debit ?? 0) } : l)).filter((l) => l.debit || l.credit) });
  }
  await create('ct', { date: d(8, 2), narration: 'Funds transfer SBI → HDFC', lines: [{ accountId: hdfc.id, debit: 300000 }, { accountId: sbi.id, credit: 300000 }] });
  await create('jv', { date: d(9, 30), narration: 'Freight on outward dispatches – Sept', lines: [{ accountId: freightOut.id, debit: 38400 }, { accountId: all.find((a) => a.name === 'Navkar Roadlines (A/c)')?.id ?? hdfc.id, credit: 38400 }] });

  return { companyId: C, adminId: admin.id };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const { db, pool } = createDb();
  const t0 = Date.now();
  seedDemo(db)
    .then(async (r) => {
      const n = await pool.query('select type, count(*) from vouchers where company_id = $1 group by type order by type', [r.companyId]);
      console.log('✓ demo data created in', Math.round((Date.now() - t0) / 1000), 's');
      for (const row of n.rows) console.log('  ', row.type.padEnd(18), row.count);
      console.log('\n  Sign in: admin@yarnflow.in / Admin@123');
      await pool.end();
    })
    .catch(async (e) => {
      console.error(e);
      await pool.end();
      process.exit(1);
    });
}
