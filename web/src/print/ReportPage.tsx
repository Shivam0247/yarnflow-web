/**
 * The old software's saved reports, printed in their own designs: /print/report/<Reg_Id>?asOn=…
 * (outstanding) or ?from=…&to=… (registers). Print or Save as PDF from the browser.
 */
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { YF_API } from '@/dc/api';
import { parseRepx, RepxReport } from './repx';

interface Meta { regId: number; title: string; type: string; mode: string; available: boolean }

export default function ReportPage() {
  const { regId = '1' } = useParams();
  const [sp, setSp] = useSearchParams();
  const nav = useNavigate();
  const [list, setList] = useState<Meta[]>([]);
  const [xml, setXml] = useState('');
  const [data, setData] = useState<{ params: Record<string, unknown>; rows: Record<string, unknown>[] } | null>(null);
  const [err, setErr] = useState('');
  const today = YF_API.today();
  const to = sp.get('to') ?? sp.get('asOn') ?? today;
  const from = sp.get('from') ?? '';
  const meta = list.find((m) => String(m.regId) === regId);
  const isOs = meta?.type === 'Outstanding';
  const detail = sp.get('detail') != null ? sp.get('detail') === '1' : undefined; // as saved in the design unless switched

  useEffect(() => { YF_API.get<Meta[]>('/report-designs').then(setList).catch((e) => setErr(YF_API.message(e))); }, []);
  useEffect(() => {
    setXml(''); setData(null); setErr('');
    YF_API.get<{ xml: string }>(`/report-designs/${regId}`).then((r) => setXml(r.xml)).catch((e) => setErr(YF_API.message(e)));
    YF_API.get(`/report-designs/${regId}/data`, { to, from: from || undefined, side: sp.get('side') ?? undefined })
      .then((d) => { setData(d); document.title = d.design.title; })
      .catch((e) => setErr(YF_API.message(e)));
  }, [regId, to, from, sp]);
  const design = useMemo(() => (xml ? parseRepx(xml) : null), [xml]);
  const set = (k: string, v: string) => { const n = new URLSearchParams(sp); if (v) n.set(k, v); else n.delete(k); setSp(n); };

  return (
    <div className="rp-root">
      <style>{CSS}</style>
      <div className="rp-bar">
        <select value={regId} onChange={(e) => nav(`/print/report/${e.target.value}?${sp.toString()}`)} aria-label="Report">
          {list.map((m) => <option key={m.regId} value={m.regId} disabled={!m.available}>{m.title}{m.available ? '' : ' (soon)'}</option>)}
        </select>
        {!isOs && <label>From <input type="date" value={from} onChange={(e) => set('from', e.target.value)} /></label>}
        <label>{isOs ? 'As on' : 'To'} <input type="date" value={to} onChange={(e) => set(isOs ? 'asOn' : 'to', e.target.value)} /></label>
        <label><input type="checkbox" checked={detail ?? !!design?.bands.find((x) => x.type === 'DetailBand')?.visible} onChange={(e) => set('detail', e.target.checked ? '1' : '0')} /> Detail</label>
        <button onClick={() => window.print()} disabled={!data}>Print / Save as PDF</button>
        <span>{data ? `${data.rows.length} rows` : err ? '' : 'Loading…'}</span>
        {err && <span style={{ color: '#ff8a8a' }}>{err}</span>}
      </div>
      {design && data && (
        <div className="rp-page" style={{ paddingLeft: design.margins[0] * 0.96, paddingRight: design.margins[1] * 0.96, paddingTop: design.margins[2] * 0.96, width: design.pageWidth * 0.96 }}>
          <RepxReport design={design} rows={data.rows} params={data.params} showDetail={detail} />
        </div>
      )}
    </div>
  );
}

const CSS = `
html, body { background: #e9e9e9 !important; }
.rp-root { padding: 52px 0 30px; color: #000; }
.rp-bar { position: fixed; top: 0; left: 0; right: 0; height: 44px; background: #1b1b1b; display: flex; gap: 12px; align-items: center; padding: 0 16px; z-index: 5; color: #ddd; font: 13px Arial, sans-serif; }
.rp-bar select, .rp-bar input { background: #2a2a2a; color: #eee; border: 1px solid #444; border-radius: 6px; padding: 5px 8px; font-size: 13px; }
.rp-bar button { background: #2f6fed; color: #fff; border: 0; border-radius: 6px; padding: 6px 12px; font-size: 13px; cursor: pointer; }
.rp-page { margin: 0 auto; background: #fff; box-sizing: border-box; min-height: 1100px; }
.rx-band { break-inside: avoid; }
@page { size: A4; margin: 6mm 0 8mm; @bottom-right { content: "Page " counter(page) " of " counter(pages); font: 8pt Arial; margin-right: 8mm; } }
@media print {
  html, body { background: #fff !important; }
  .rp-bar { display: none; }
  .rp-root { padding: 0; }
  .rp-page { padding-top: 0 !important; margin: 0; min-height: 0; }
}
`;
