/**
 * Document prints laid out as the old software printed them (Crystal "SALESBILLTRADING_GST" and the
 * journal-voucher note): open /print/<slug>/<id>, then Print or Save as PDF from the browser.
 * The page is drawn at 920 × 1300 px (the old A4 at 110 dpi) and scaled to A4 when printed.
 */
import { useEffect, useState, type ReactNode } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { YF_API } from '@/dc/api';
import { inWords } from './words';

type Row = Record<string, any>;
interface PrintData {
  doc: Row & { lines: Row[]; extra: Row | null };
  company: Row & { extra: Row | null };
  party: Row | null;
  delivery: Row | null;
  transporter: Row | null;
  collector: Row | null;
  partyGroup: Row | null;
  salesPerson: Row | null;
  user: string | null;
  ledgerBalance: number | null;
  purchaseEntry: Record<string, string>;
}

/** per-company lines the old report had written into it */
const COMPANY_PRINT: Record<number, { contact?: string; seal?: boolean; sign?: boolean }> = {
  1: { contact: 'MANOJBHAI :- 9624041800', seal: true, sign: true }
};

const TERMS = [
  '1.All transactions are subject to SURAT Jurisdiction.',
  '2.Any dispute arising out of this transaction shall be referrend to "United Gujarat Yarn Dealers Association"for arbitration under their rlles and regulation.The decision given thereon shall be Binding upon buyer and seller & the Courts of Surat shall have sole jurisdiction over the said arbitration proceedings',
  '3 Goods once sold can not be taken back. 4. Cheque return charges Rs 250.00.',
  '5. Any complaints regarding goods should be made within 2 days from the receipt.',
  '6. Interest @ 24% per annum will be charged for delayed payment.',
  '7. Payment should be made bill to bill by A/c payee cheque / draft only.',
  '8. We are not reponsible for any loss or damage during transit.',
  '9. Complaints, if any, regarding the invoice must be settled within 2 days from the date of',
  '10.vnd payment cash discount'
];

const n = (v: unknown) => Number(v ?? 0) || 0;
const f = (v: unknown, d = 2) => n(v).toFixed(d);
const dmy = (s: unknown) => YF_API.dmy(s ? String(s) : '');
const dmyShort = (s: unknown) => { const d = dmy(s); return d ? d.slice(0, 6) + d.slice(8) : ''; };
/** the old prints leave the trailing "(code) (nick)" off the party name */
const printName = (p: Row | null) => (p?.printName || String(p?.name ?? '').replace(/\s*\(.*$/, '')).trim();
const address = (p: Row | null) => [p?.address1, p?.address2].filter(Boolean).join(', ');
const pctLabel = (v: number) => v.toFixed(2);

const SLUGS = {
  bill: ['sale-bills', 'sale-returns', 'general-sales'],
  note: ['debit-notes', 'credit-notes', 'interest-debit-notes', 'journals']
};

export default function PrintPage() {
  const { slug = '', id = '' } = useParams();
  const [sp] = useSearchParams();
  const [data, setData] = useState<PrintData | null>(null);
  const [err, setErr] = useState('');
  const [qr, setQr] = useState('');

  useEffect(() => {
    YF_API.get<PrintData>(`/vouchers/${slug}/${id}/print`).then(setData).catch((e) => setErr(YF_API.message(e)));
  }, [slug, id]);
  useEffect(() => {
    const text = data?.doc.extra?.einvQr;
    if (!text) return;
    import('qrcode-generator').then(({ default: qrcode }) => {
      const q = qrcode(0, 'L');
      q.addData(String(text));
      q.make();
      setQr(q.createDataURL(2, 0));
    });
  }, [data]);
  useEffect(() => {
    if (!data) return;
    document.title = `${data.doc.number} ${printName(data.party)}`.replace(/[\\/]/g, '-');
    if (sp.get('auto') === '1') setTimeout(() => window.print(), 600);
  }, [data, sp]);

  if (err) return <div style={{ padding: 40, fontFamily: 'Arial', color: '#b00' }}>{err}</div>;
  if (!data) return <div style={{ padding: 40, fontFamily: 'Arial' }}>Loading…</div>;
  const body = SLUGS.note.includes(slug) ? <NotePrint d={data} /> : <BillPrint d={data} qr={qr} />;
  return (
    <div className="pp-root">
      <style>{CSS}</style>
      <div className="pp-bar">
        <button onClick={() => window.print()}>Print / Save as PDF</button>
        <button onClick={() => history.back()}>Back</button>
        <span>{data.doc.number}</span>
      </div>
      {body}
    </div>
  );
}

/* ------------------------------------------------------------------ sale bill / sale return */
function BillPrint({ d, qr }: { d: PrintData; qr: string }) {
  const { doc, company, party, delivery } = d;
  const ce = company.extra ?? {};
  const x = doc.extra ?? {};
  const cfg = COMPANY_PRINT[company.id] ?? {};
  const lines = doc.lines;
  const l0 = lines[0] ?? {};
  const isReturn = doc.type === 'SALE_RETURN';
  const title = isReturn ? 'CREDIT NOTE' : 'TAX INVOICE';
  const gstRate = n(l0.gstRate);
  const half = gstRate / 2;
  const tax = n(doc.cgstAmount) + n(doc.sgstAmount) + n(doc.igstAmount);
  const net = n(doc.netAmount);
  const qty = lines.reduce((s, l) => s + n(l.qty), 0);
  const netRate = qty ? net / qty : 0;
  const lpc = (net * 0.015) / 30;
  const purChallan = (l: Row) => l.extra?.purChallan ?? '';
  const entryNo = (l: Row) => d.purchaseEntry[l.extra?.purEntryCode ?? l.extra?.purchaseCode] ?? l.purchaseRef ?? '';
  const itemDesc = (l: Row) => [l.itemName ?? l.description, l.grade].filter(Boolean).join(' ');
  const totalCops = lines.reduce((s, l) => s + n(l.cops), 0);
  const totalPcs = lines.reduce((s, l) => s + n(l.pcs), 0);
  const placeParty = party?.stateCode ?? '';
  const placeDelivery = delivery?.stateCode ?? '';
  const gst = (p: Row | null) => p?.gstin ?? '';
  const col = d.collector?.name ?? '';
  const partyGroup = x.partyGroup ?? d.partyGroup?.name ?? '';

  return (
    <div className="pp-page">
      <div className="b-top">
        <div className="c">|| Shree Ganeshay Namah ||</div>
        <div className="c b" style={{ fontSize: 14 }}>{title}</div>
        <div className="b-top-row"><span /><span className="c">UNDER GST ACT 2017</span><span>Eway Bill No:-&nbsp;&nbsp; {doc.ewbNo ?? ''}</span></div>
      </div>
      <div className="box">
        <div className="b-co">{company.name}</div>
        <div className="b-addr">{company.address1}</div>
        <div className="row bt" style={{ height: 22 }}>
          <div className="cell" style={{ flex: 1 }}>
            <ChatIcon />
            <span className="serif">{cfg.contact ?? (company.phone ? 'MOBILE :- ' + company.phone : '')}</span>
          </div>
          <div className="cell" style={{ width: 300, display: 'flex', fontSize: 11 }}>
            <span style={{ whiteSpace: 'nowrap', marginRight: 6 }}>Col. Preson :</span><span>{col}</span>
          </div>
        </div>
        {/* GST / invoice block */}
        <div className="row bt">
          <div className="half br">
            <div className="row" style={{ height: 20 }}>
              <div className="cell b s11" style={{ flex: 1 }}>GST NO:- {company.gstin}</div>
              <div className="cell b s11" style={{ width: 170 }}>State Code:-{company.stateCode}</div>
            </div>
            <div className="row bt s11" style={{ height: 18 }}>
              <div className="cell" style={{ width: 130 }}>Original For Recipient</div>
              <div className="cell" style={{ width: 150 }}>Duplicate for Transporter</div>
              <div className="cell">Triplicate for Supplier</div>
            </div>
            <div className="cell serif b red" style={{ fontSize: 14, height: 22 }}>Kindly verify your GST NO. if any query contact us.</div>
            <div className="cell b s11" style={{ height: 18 }}>Pan No.: {company.pan ?? ''}</div>
          </div>
          <div className="half">
            <div className="row" style={{ height: 20 }}>
              <div className="cell b s11" style={{ width: 80 }}>CIN NO. :</div>
              <div className="cell b s10">{ce.CsttinNo ?? company.cin ?? ''}</div>
            </div>
            <div className="row bt" style={{ height: 22 }}>
              <div className="cell" style={{ width: 110 }}>Invoice No.:</div>
              <div className="cell b red" style={{ fontSize: 16 }}>{doc.number}</div>
            </div>
            <div className="row" style={{ height: 22 }}>
              <div className="cell" style={{ width: 110 }}>Invoice Date :</div>
              <div className="cell b s11">{dmy(doc.date)}</div>
            </div>
            <div className="row" style={{ height: 22 }}>
              <div className="cell" style={{ width: 110 }}>Challan No.:</div>
              <div className="cell b s11">{doc.number}</div>
            </div>
          </div>
        </div>
        {/* billed to / shipped to */}
        <div className="row bt">
          <div className="half br">
            <div className="cell b s11" style={{ height: 18 }}>Detail of Receipient/ Billed To</div>
            <div className="row" style={{ height: 20 }}><div className="cell" style={{ width: 75 }}>Name :</div><div className="cell b purple s11">{printName(party)}</div></div>
            <div className="row" style={{ height: 52 }}><div className="cell" style={{ width: 75 }}>Address :</div><div className="cell s11" style={{ flex: 1, paddingTop: 3 }}>{address(party)}</div></div>
            <div className="row" style={{ height: 20 }}><div className="cell" style={{ width: 75 }}>Party Grp :</div><div className="cell nowrap" style={{ flex: 1 }}>{partyGroup}</div></div>
          </div>
          <div className="half">
            <div className="cell b s11" style={{ height: 18 }}>Detail of consignee/Address of Delivery/Shipped To</div>
            <div className="row" style={{ height: 20 }}><div className="cell" style={{ width: 55 }}>Name :</div><div className="cell b s11">{printName(delivery)}</div></div>
            <div className="row" style={{ height: 52 }}><div className="cell" style={{ width: 55 }}>Address :</div><div className="cell s11" style={{ flex: 1, paddingTop: 3 }}>{address(delivery)}</div></div>
            <div className="row" style={{ height: 20 }}>
              <div className="cell b red" style={{ width: 90 }}>Ledger Bal :</div>
              <div className="cell b red" style={{ fontSize: 14 }}>{d.ledgerBalance == null ? '' : f(d.ledgerBalance)}</div>
            </div>
          </div>
        </div>
        <div className="row bt" style={{ height: 20 }}>
          <div className="half br row">
            <div className="cell b" style={{ width: 75 }}>Mobile :</div>
            <div className="cell b s11" style={{ width: 150 }}>{party?.mobile ?? ''}</div>
            <div className="cell b s11" style={{ width: 50 }}>Email :</div>
            <div className="cell s10 nowrap" style={{ flex: 1 }}>{party?.email ?? ''}</div>
          </div>
          <div className="half row">
            <div className="cell b" style={{ width: 62 }}>Agent :</div>
            <div className="cell b s11">{doc.brokerName ?? ''}</div>
          </div>
        </div>
        <div className="row bt" style={{ height: 20 }}>
          <div className="half br row">
            <div className="cell b" style={{ width: 65 }}>GSTIN :</div>
            <div className="cell b" style={{ width: 210 }}>{gst(party)}</div>
            <div className="cell b" style={{ flex: 1 }}>Place of Supply :</div>
            <div className="cell b s11" style={{ width: 40 }}>{placeParty}</div>
          </div>
          <div className="half row">
            <div className="cell b" style={{ width: 62 }}>GSTIN :</div>
            <div className="cell b" style={{ width: 175 }}>{gst(delivery)}</div>
            <div className="cell b" style={{ flex: 1 }}>Place of Supply :</div>
            <div className="cell b s11" style={{ width: 30 }}>{placeDelivery}</div>
          </div>
        </div>
        <div className="row bt s11" style={{ height: 20 }}>
          <div className="cell" style={{ width: 75 }}>Order No. :</div>
          <div className="cell" style={{ width: 105 }}>{doc.refNo ?? ''}</div>
          <div className="cell" style={{ width: 55 }}>Ord_Dt :</div>
          <div className="cell" style={{ width: 110 }}>{dmyShort(doc.refDate).replace(/-/g, '/')}</div>
          <div className="cell" style={{ width: 55 }}>Transport :</div>
          <div className="cell b" style={{ flex: 1, paddingLeft: 30 }}>{d.transporter?.name ?? ''}</div>
        </div>
        <div className="row s11" style={{ height: 22 }}>
          <div className="cell" style={{ width: 90, fontSize: 12 }}>Vehicle No.</div>
          <div className="cell" style={{ width: 310 }}>{doc.vehicleNo ?? ''}</div>
          <div className="cell b" style={{ width: 108 }}>Supplier Name:</div>
          <div className="cell b">{x.supplier ?? ''}</div>
        </div>
        {/* item table */}
        <table className="items">
          <colgroup>
            {[35, 155, 95, 85, 60, 70, 55, 62, 65, 62, 81].map((w, i) => <col key={i} style={{ width: w }} />)}
          </colgroup>
          <thead>
            <tr>
              {['Sr.', 'Item Description', 'Pur.Challan No.', 'LrNo.', 'HSN', 'Lot No', 'Cops', 'Cartons', 'Quantity (Kg.)', 'Rate', 'Amount (In Rs.)'].map((h, i) => (
                <th key={h} style={i === 1 ? { textAlign: 'left' } : undefined}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {lines.map((l, i) => (
              <tr key={l.id} className="it">
                <td>{i + 1}</td>
                <td style={{ textAlign: 'left' }}>{itemDesc(l)}</td>
                <td className="wrap">{purChallan(l) || l.purchaseInvNo || ''}</td>
                <td>{l.lrNo ?? ''}</td>
                <td>{l.hsn ?? ''}</td>
                <td className="wrap">{l.lotNo ?? ''}</td>
                <td className="s12">{f(l.cops, 0)}</td>
                <td className="s12">{f(l.pcs, 0)}</td>
                <td className="r s12">{f(l.qty, 3)}</td>
                <td className="r s12">{f(l.rate, 4)}</td>
                <td className="r s12">{f(l.taxableAmount)}</td>
              </tr>
            ))}
            <tr className="filler"><td /><td /><td /><td /><td /><td /><td /><td /><td /><td /><td /></tr>
            <tr className="tot">
              <td /><td /><td /><td />
              <td className="blue b">Total :</td><td />
              <td className="blue b">{totalCops ? f(totalCops, 0) : ''}</td>
              <td className="blue b">{f(totalPcs, 0)}</td>
              <td className="blue b">{f(qty, 3)}</td><td />
              <td className="blue b r">{f(doc.taxableAmount)}</td>
            </tr>
          </tbody>
        </table>
        {/* bank / e-invoice | tax summary */}
        <div className="row">
          <div className="br" style={{ width: 570 }}>
            <div className="cell" style={{ height: 18, fontSize: 12 }}>Remarks : {doc.remark ?? doc.narration ?? ''}</div>
            <div className="cell b bt s11" style={{ height: 20 }}>-: Bank Details :-</div>
            <div className="row bt b s10" style={{ height: 20 }}>
              <div className="cell" style={{ width: 320 }}>Bank Name:- {company.bankName ?? ''}</div>
              <div className="cell">Bank Branch:- {ce.BANKNAMEADD ?? ''}</div>
            </div>
            <div className="row bt b s10" style={{ height: 20 }}>
              <div className="cell" style={{ width: 320 }}>Bank AccountNo:- {company.bankAccountNo ?? ''}</div>
              <div className="cell">Bank IFSC CODE:- {company.ifsc ?? ''}</div>
            </div>
            <div className="cell b bt s11" style={{ height: 18 }}>E Invoice Details</div>
            <div className="row bt" style={{ height: 18 }}>
              <div className="cell s11" style={{ width: 60 }}>IRN NO:-</div>
              <div className="cell serif s10 nowrap" style={{ flex: 1 }}>{doc.irn ?? ''}</div>
            </div>
            <div className="row" style={{ height: 18 }}>
              <div className="cell s11" style={{ width: 60 }}>ACK NO:-</div>
              <div className="cell serif s10" style={{ width: 140 }}>{doc.ackNo ?? ''}</div>
              <div className="cell s11" style={{ width: 70 }}>ACK DATE:-</div>
              <div className="cell s11">{doc.ackDate ? dmyShort(doc.ackDate).replace(/-/g, '/') : ''}</div>
            </div>
            <div className="black b" style={{ fontSize: 13, height: 18, padding: '1px 4px' }}>Lpc Per Day Payable After Due Date {lpc.toFixed(2)} Rs</div>
            <div className="black b s11" style={{ height: 38, padding: '0 4px', borderTop: '1px solid #fff' }}>
              Late payment charges will be applicable at the rate 1.5% per month plus 5% gst after the due date of payment.Above charges will be collected by cheque, DD and net banking only.
            </div>
            <div style={{ height: 22 }} />
          </div>
          <div style={{ flex: 1 }}>
            <TaxRow label="DISCOUNT :" value={f(doc.discountAmount)} h={20} />
            <TaxRow label={`FREIGHT:  ${f(doc.freightAmount)}`} value="" h={20} />
            <TaxRow label="TRANSPORTATION :" value="" h={20} />
            <TaxRow label={<span className="red b s10">Total Value Before Tax (Rs.)</span>} value={<span className="red b">{f(doc.taxableAmount)}</span>} h={20} />
            {n(doc.igstAmount) ? (
              <TaxRow label={`Add IGST @ ${pctLabel(gstRate)} %`} value={f(doc.igstAmount)} h={18} big />
            ) : (
              <>
                <TaxRow label={`Add CGST @ ${pctLabel(half)} %`} value={f(doc.cgstAmount)} h={18} big />
                <TaxRow label={`Add SGST @ ${pctLabel(half)} %`} value={f(doc.sgstAmount)} h={18} big />
              </>
            )}
            <TaxRow label="" value={f(n(doc.igstAmount) ? 0 : doc.igstAmount)} h={18} />
            <TaxRow label={<span className="b s11">Tax Amount : GST (Rs.)</span>} value={<span className="b">{f(tax)}</span>} h={20} />
            <TaxRow label={`Add TCS @ ${f(doc.tcsRate, 3)}%`} value={f(doc.tcsAmount, 3)} h={34} big />
            <TaxRow label={<span className="s10">Round off (+/-) :</span>} value={<span className="s10">{f(doc.roundOff)}</span>} h={22} />
          </div>
        </div>
        <div className="row bt" style={{ height: 36, alignItems: 'center' }}>
          <div className="cell b s11" style={{ width: 80, paddingLeft: 10 }}>NET Rate :</div>
          <div className="cell b s11" style={{ width: 200 }}>{netRate.toFixed(2)}</div>
          <div className="cell b" style={{ width: 170, fontSize: 13 }}>N.D.G</div>
          <div className="cell b" style={{ width: 210, fontSize: 13 }}>Net Value After Tax : (Rs.)</div>
          <div className="cell b" style={{ width: 45, fontSize: 30 }}>₹</div>
          <div className="cell b r" style={{ flex: 1, fontSize: 22 }}>{f(net)}</div>
        </div>
        <div className="row bt" style={{ height: 20, alignItems: 'center' }}>
          <div className="cell b red s11" style={{ width: 70 }}>Cr.Days :</div>
          <div className="cell b red s11" style={{ width: 70 }}>{doc.creditDays ?? ''}</div>
          <div className="cell b red s11" style={{ width: 58 }}>Due Dt :</div>
          <div className="cell b red s11" style={{ width: 390 }}>{dmy(doc.dueDate)}</div>
          <div className="cell" style={{ fontSize: 7 }}>Certified that the particular given above are true and correct.</div>
        </div>
        <div className="row bt" style={{ height: 18 }}>
          <div className="br row" style={{ width: 605 }}>
            <div className="cell b olive s10" style={{ width: 72 }}>Pur Bill No. :</div>
            <div className="cell b olive s10" style={{ width: 120 }}>{l0.purchaseInvNo ?? ''}</div>
            <div className="cell b olive s10" style={{ width: 175 }}>Entry No.: {entryNo(l0)}</div>
            <div className="cell b olive s11">Brand: {l0.brand ?? ''}</div>
          </div>
        </div>
        <div className="row" style={{ height: 18 }}>
          <div className="br row bt" style={{ width: 605 }}>
            <div className="cell b s11" style={{ width: 85 }}>In Word:</div>
            <div className="cell b s11">{inWords(net)}</div>
          </div>
        </div>
        <div className="row bt">
          <div style={{ width: 445, padding: '3px 4px 4px 8px' }}>
            <div className="b s11">Terms and Conditions :-</div>
            <div style={{ fontSize: 7.6, lineHeight: '10.2px', marginTop: 4 }}>{TERMS.map((t) => <div key={t}>{t}</div>)}</div>
          </div>
          <div className="br" style={{ width: 160, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {qr && <img src={qr} alt="" style={{ width: 135, height: 135, imageRendering: 'pixelated' }} />}
          </div>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {cfg.seal && <img src={`/print/seal-${company.id}.png`} alt="" style={{ width: 120 }} />}
          </div>
        </div>
        <div className="row bt c b green" style={{ height: 26, alignItems: 'center', justifyContent: 'center', fontSize: 17 }}>-:Challan Details:-</div>
        <div className="row bt b s10" style={{ height: 24, alignItems: 'center' }}>
          <div className="cell" style={{ width: 160 }}>Company Challan No:</div>
          <div className="cell nb" style={{ width: 110 }}>{purChallan(l0)}</div>
          <div className="cell" style={{ width: 90 }}>Sales Bill No:</div>
          <div className="cell red" style={{ width: 140 }}>{doc.number}</div>
          <div className="cell" style={{ width: 95 }}>Item Name:</div>
          <div className="cell nb">{itemDesc(l0)}</div>
        </div>
        <div className="row b s10" style={{ height: 24, alignItems: 'center' }}>
          <div className="cell" style={{ width: 160 }}>Company Challan Date:</div>
          <div className="cell nb" style={{ width: 110 }}>{purChallan(l0) ? dmy(l0.challanDate ?? doc.date) : ''}</div>
          <div className="cell" style={{ width: 90 }}>Sales Date:</div>
          <div className="cell nb" style={{ width: 140 }}>{dmy(doc.date)}</div>
          <div className="cell" style={{ width: 95 }}>Total Pcs:</div>
          <div className="cell" style={{ width: 60 }}>{f(totalPcs, 0)}</div>
          <div className="cell" style={{ width: 85 }}>Total Weight:</div>
          <div className="cell">{f(qty, 3)}</div>
        </div>
        <div className="row b s10" style={{ height: 22, alignItems: 'center' }}>
          <div className="cell" style={{ width: 160 }}>Company BIll No:</div>
          <div className="cell" style={{ width: 110 }}>{l0.purchaseInvNo ?? ''}</div>
          <div className="cell" style={{ width: 90 }}>Sales Challan No:</div>
          <div className="cell" style={{ width: 140 }}>{doc.number}</div>
          <div className="cell" style={{ width: 95 }}>Supplier Name:</div>
          <div className="cell nowrap" style={{ flex: 1 }}>{x.supplier ?? ''}</div>
        </div>
        <div className="row" style={{ height: 100, fontSize: 10 }}>
          <div style={{ width: 290, paddingLeft: 30 }}>Receiver's Sign</div>
          <div style={{ width: 240, paddingLeft: 30 }}>Checked By</div>
          <div style={{ flex: 1, position: 'relative' }}>
            <div className="b" style={{ fontSize: 9, marginTop: -6 }}>For {company.name}</div>
            {cfg.sign && <img src={`/print/sign-${company.id}.png`} alt="" style={{ position: 'absolute', left: 20, top: 18, width: 190 }} />}
            <div style={{ position: 'absolute', left: 40, bottom: 4 }}>Authorised Signatory</div>
          </div>
        </div>
        <div className="row bt b" style={{ height: 24, alignItems: 'center', fontSize: 12 }}>
          <div className="cell" style={{ width: 510 }}>{company.name}</div>
          <div className="cell" style={{ width: 60 }}>E-Mail :</div>
          <div className="cell">{company.email ?? ''}</div>
        </div>
      </div>
    </div>
  );
}

function ChatIcon() {
  return (
    <svg width="20" height="14" viewBox="0 0 20 14" style={{ marginRight: 8, verticalAlign: -2 }} aria-hidden>
      <rect x="0.5" y="0.5" width="19" height="13" rx="2" fill="#2fb84a" stroke="#1d7f31" />
      <path d="M10 3.2c-2.2 0-3.9 1.5-3.9 3.4 0 .7.2 1.3.6 1.8l-.5 1.6 1.7-.5c.6.3 1.3.5 2.1.5 2.2 0 3.9-1.5 3.9-3.4S12.2 3.2 10 3.2z" fill="none" stroke="#fff" strokeWidth="0.9" />
    </svg>
  );
}

function TaxRow({ label, value, h, big }: { label: ReactNode; value: ReactNode; h: number; big?: boolean }) {
  return (
    <div className="row bt" style={{ height: h }}>
      <div className="cell br" style={{ width: 162, textAlign: 'right', paddingRight: 12, fontSize: big ? 13 : 11 }}>{label}</div>
      <div className="cell r" style={{ flex: 1, fontSize: big ? 12 : 11 }}>{value}</div>
    </div>
  );
}

/* ------------------------------------------------------------------ debit / credit note (two copies) */
function NotePrint({ d }: { d: PrintData }) {
  return (
    <div className="pp-page note">
      <NoteCopy d={d} copy="Original Copy" />
      <div className="cut" />
      <NoteCopy d={d} copy="Duplicate Copy" />
    </div>
  );
}

const TAXLIKE = /^(CGST|SGST|IGST|TDS|TCS|ROUND)/i;

function NoteCopy({ d, copy }: { d: PrintData; copy: string }) {
  const { doc, company, party } = d;
  const delivery = d.delivery ?? party;
  const x = doc.extra ?? {};
  const isCredit = doc.type === 'CREDIT_NOTE';
  const isJv = doc.type === 'JOURNAL';
  const title = isCredit ? 'C R E D I T - N O T E' : isJv ? 'J O U R N A L - V O U C H E R' : 'D E BIT - N O T E';
  const acLabel = isCredit ? 'CREDIT NOTE A/C :' : isJv ? 'JOURNAL A/C :' : 'DEBIT NOTE A/C :';
  const desc: string[] = x.secondAccount
    ? [String(x.secondAccount)]
    : [...new Set(doc.lines.filter((l) => l.accountId && l.accountId !== doc.partyId && !TAXLIKE.test(String(l.accountName ?? ''))).map((l) => String(l.accountName)))];
  const cgst = n(x.cgst ?? doc.cgstAmount), sgst = n(x.sgst ?? doc.sgstAmount), igst = n(x.igst ?? doc.igstAmount);
  const tax = cgst + sgst + igst;
  const net = n(doc.amount || doc.netAmount);
  const tds = n(x.tdsAmt ?? doc.tdsAmount);
  const before = x.beforeTax != null ? n(x.beforeTax) : net - tax + tds;
  const billNo = x.billNo ?? doc.refNo ?? '';
  const billDate = x.billDate ?? dmy(doc.refDate);
  const stateName = party?.state ?? 'Gujarat';
  return (
    <div className="nbox">
      <div className="row" style={{ height: 38 }}>
        <div style={{ flex: 1, textAlign: 'center' }}>
          <div className="b s12" style={{ letterSpacing: 1 }}>{title}</div>
          <div className="b" style={{ fontSize: 15 }}>{company.name}</div>
        </div>
        <div className="b s11" style={{ position: 'absolute', right: 40, marginTop: 2 }}>{copy}</div>
      </div>
      <div className="c s10 bt" style={{ height: 16 }}>{company.address1}</div>
      <div className="row bt b s12" style={{ height: 18 }}>
        <div className="cell" style={{ width: 420 }}>{company.gstin}</div>
        <div className="cell" style={{ width: 255 }}>{company.stateCode}</div>
        <div className="cell">{stateName}</div>
      </div>
      <div className="row bt s11" style={{ height: 18 }}>
        <div className="cell b" style={{ width: 360 }}>{acLabel}</div>
        <div className="cell b s12" style={{ width: 315 }}>No.: {doc.number}</div>
        <div className="cell s12"><b>Date :</b> {dmy(doc.date)}</div>
      </div>
      <div className="row bt">
        <div className="br" style={{ width: 415, padding: '2px 4px' }}>
          <div className="row"><div style={{ width: 50 }} className="s12">M/s,</div><div className="b s12">{party?.name}</div></div>
          <div className="row" style={{ marginTop: 4 }}><div style={{ width: 55 }} className="s11">Address :</div><div className="s10" style={{ flex: 1 }}>{address(party)}</div></div>
          <div className="row s11"><div style={{ width: 55 }}>Mobile :</div><div className="nowrap" style={{ flex: 1 }}>{party?.mobile ?? ''}</div></div>
        </div>
        <div style={{ flex: 1, padding: '2px 4px' }}>
          <div className="row"><div style={{ width: 60 }} className="s12">Delivery:</div><div className="b s12">{delivery?.name}</div></div>
          <div className="row" style={{ marginTop: 4 }}><div style={{ width: 60 }} className="s11">{delivery !== party ? 'Address :' : ''}</div><div className="s10" style={{ flex: 1 }}>{address(delivery)}</div></div>
          <div className="row s11" style={{ marginTop: 4 }}><div style={{ width: 118 }}>Collection Person:</div><div>{d.collector?.name ?? ''}</div></div>
        </div>
      </div>
      <div className="row bt s11" style={{ height: 22, alignItems: 'center' }}>
        <div className="cell b" style={{ width: 60 }}>GSTIN :</div>
        <div className="cell" style={{ width: 250 }}>{party?.gstin ?? ''}</div>
        <div className="cell b" style={{ width: 120 }}>Place of Supply :</div>
        <div className="cell b" style={{ width: 160 }}>{party?.stateCode ?? ''}</div>
        <div className="cell b" style={{ width: 80 }}>Pan No. :</div>
        <div className="cell b">{party?.pan ?? ''}</div>
      </div>
      <div className="row bt b s12" style={{ height: 24, lineHeight: '22px' }}>
        <div className="c br" style={{ width: 685 }}>DESCRIPTION</div>
        <div className="c" style={{ flex: 1 }}>Amount</div>
      </div>
      <div className="row bt">
        <div className="br" style={{ width: 685, height: 185, position: 'relative' }}>
          <div className="s12" style={{ padding: '6px 8px' }}>{desc.map((t) => <div key={t}>{t}</div>)}</div>
          <div style={{ position: 'absolute', left: 10, top: 68, width: 330 }} className="s12">
            <div className="row" style={{ height: 30 }}><div className="b s11" style={{ width: 70 }}>Bill No :</div><div>{billNo}</div></div>
            <div className="row" style={{ height: 34 }}><div className="b s11" style={{ width: 70 }}>Date :</div><div>{billDate}</div></div>
            <div className="row"><div className="b s10" style={{ width: 70 }}>Remarks :</div><div className="s10" style={{ flex: 1, maxWidth: 160 }}>{doc.narration ?? doc.remark ?? ''}</div></div>
          </div>
          <div style={{ position: 'absolute', right: 8, top: 4, textAlign: 'right' }}>
            <div className="b s11" style={{ height: 60 }}>Total Value Before Tax (Rs.)</div>
            {igst ? <div className="s11" style={{ height: 22 }}>Add IGST @ {pctLabel(n(x.igstPct))} %</div> : (
              <>
                <div className="s11" style={{ height: 22 }}>Add CGST @ {pctLabel(n(x.cgstPct))} %</div>
                <div className="s11" style={{ height: 38 }}>Add SGST @ {pctLabel(n(x.sgstPct))} %</div>
              </>
            )}
            <div className="b s11" style={{ height: 28 }}>Tax Amount : GST (Rs.)</div>
            <div className="b s11">TDS Amount :</div>
          </div>
        </div>
        <div style={{ flex: 1, textAlign: 'right', fontSize: 12 }}>
          <div className="b" style={{ height: 60, padding: '8px 4px 0' }}>{f(before)}</div>
          <div style={{ height: 70, padding: '8px 4px 0' }}>
            {igst ? <div>{f(igst)}</div> : <><div>{f(cgst)}</div><div>{f(sgst)}</div></>}
          </div>
          <div className="b bt bb" style={{ height: 20, padding: '2px 4px' }}>{f(tax)}</div>
          <div style={{ padding: '8px 4px 0' }}>{f(tds)}</div>
        </div>
      </div>
      <div className="row bt" style={{ height: 38, lineHeight: '36px' }}>
        <div className="br b s11" style={{ width: 685, textAlign: 'right', paddingRight: 12 }}>Net Amount :</div>
        <div className="b r" style={{ flex: 1, fontSize: 16, paddingRight: 4 }}>{f(net)}</div>
      </div>
      <div className="bt b s12" style={{ height: 18, padding: '1px 8px' }}>{inWords(net)}</div>
      <div className="nfoot">
        <div className="b s12" style={{ height: 20, paddingLeft: 6 }}>{(d.user ?? '').toUpperCase()}</div>
        <div className="row b s12">
          <div className="sig">PREPARED BY :</div>
          <div className="sig">CHECKED BY :</div>
          <div className="sig">RECEIVER'S SIGN :</div>
          <div className="sig">AUTH.SIGN :</div>
        </div>
      </div>
    </div>
  );
}

const CSS = `
html, body { background: #e9e9e9 !important; }
.pp-root { font-family: Arial, Helvetica, sans-serif; color: #000; padding: 52px 0 30px; }
.pp-bar { position: fixed; top: 0; left: 0; right: 0; height: 40px; background: #1b1b1b; display: flex; gap: 10px; align-items: center; padding: 0 16px; z-index: 5; color: #ddd; font-size: 13px; }
.pp-bar button { background: #2f6fed; color: #fff; border: 0; border-radius: 6px; padding: 6px 12px; font-size: 13px; cursor: pointer; }
.pp-bar button + button { background: #444; }
.pp-page { width: 920px; min-height: 1300px; margin: 0 auto; background: #fff; padding: 6px 45px 20px 50px; box-sizing: border-box; font-size: 12px; position: relative; }
.pp-page * { box-sizing: border-box; }
.box { border: 1.3px solid #000; }
.row { display: flex; }
.cell { padding: 1px 4px; overflow: hidden; }
.half { width: 50%; } .half.br { width: 435px; } .half:not(.br) { flex: 1; width: auto; }
.bt { border-top: 1px solid #000; } .bb { border-bottom: 1px solid #000; } .br { border-right: 1px solid #000; }
.b { font-weight: bold; } .c { text-align: center; } .r { text-align: right; }
.s10 { font-size: 10px; } .s11 { font-size: 11px; } .s12 { font-size: 12px; }
.serif { font-family: 'Times New Roman', Times, serif; }
.red { color: #e00000; } .purple { color: #800080; } .blue { color: #0000ee; } .olive { color: #808000; } .green { color: #008000; }
.nowrap { white-space: nowrap; text-overflow: clip; } .nb { font-weight: normal; }
.black { background: #000; color: #fff; }
.b-top { height: 58px; font-size: 13px; line-height: 19px; }
.b-top-row { display: grid; grid-template-columns: 1fr auto 1fr; } .b-top-row span:last-child { text-align: right; padding-right: 45px; }
.b-co { text-align: center; font-weight: bold; font-size: 25px; height: 34px; padding-top: 2px; }
.b-addr { text-align: center; font-size: 10.5px; height: 20px; }
table.items { width: 100%; border-collapse: collapse; table-layout: fixed; border-top: 1px solid #000; }
table.items th { color: #0000ee; font-size: 11px; font-weight: bold; padding: 6px 2px; border-right: 1px solid #000; border-bottom: 1px solid #000; height: 36px; }
table.items td { font-size: 10px; padding: 4px 3px; border-right: 1px solid #000; text-align: center; vertical-align: top; }
table.items th:last-child, table.items td:last-child { border-right: 0; }
table.items td.wrap { word-break: break-all; }
table.items tr.filler td { height: 64px; }
table.items tr.tot td { border-top: 1px solid #000; border-bottom: 1px solid #000; font-size: 12px; height: 20px; padding: 2px 3px; }
.note { padding: 28px 45px 20px 55px; }
.nbox { border: 1.3px solid #000; position: relative; margin-bottom: 0; }
.nbox .nfoot { border-top: 1.3px solid #000; margin: 0 -1.3px -1.3px; background: #fff; padding-top: 4px; height: 58px; }
.sig { flex: 1; border-top: 1px solid #000; margin: 10px 18px 0 6px; padding-top: 2px; }
.cut { border-top: 1px solid #000; margin: 10px -10px 26px; }
@page { size: A4; margin: 0; }
@media print {
  html, body { background: #fff !important; }
  .pp-bar { display: none; }
  .pp-root { padding: 0; }
  .pp-page { zoom: 0.8627; margin: 0; min-height: 0; }
}
`;
