import os, re, json, sys, psycopg2
sys.path.insert(0, '.')
from layout import items, grid
L = '/mnt/user-data/uploads/CREATIVE24/Creatives/Layout'
c = psycopg2.connect('postgresql://yarnflow:yarnflow@localhost/yarnflow').cursor()
c.execute('''select "Bok_Code", "Bok_Name", "Bok_Type" from legacy_umiya24."BookMst"''')
books = {r[0]: f'{r[1].strip()} ({r[2]})' for r in c.fetchall()}
def xy(loc):
    m = re.findall(r'[XY]=(-?\d+)', loc or ''); return (int(m[1]), int(m[0])) if len(m) == 2 else (0, 0)
SKIP = re.compile(r'^(Btn|btn|Simple|Picture|Label|Empty|Splitter|separator)', re.I)
out = {}
for dp, _, fs in os.walk(L):
    rel = os.path.relpath(dp, L)
    scr = {}
    if 'LayoutControl.xml' in fs:
        its = items(os.path.join(dp, 'LayoutControl.xml'))
        byname = {i.get('Name'): i for i in its}
        def abspos(i, depth=0):
            x, y = xy(i.get('Location'))
            p = byname.get(i.get('ParentName'))
            if p and depth < 10:
                px, py = abspos(p, depth + 1); return (px + x, py + y)
            return (x, y)
        fields = []
        for i in its:
            if i.get('TypeName') != 'LayoutControlItem': continue
            ctl = i.get('ControlName') or ''
            if SKIP.match(ctl) or not ctl: continue
            hidden = i.get('Visibility') not in ('Always', None) or not i.get('ParentName')
            y, x = abspos(i)
            fields.append({'label': (i.get('Text') or '').strip().rstrip(':').strip(), 'control': ctl, 'hidden': hidden, 'y': y, 'x': x, 'showLabel': i.get('TextVisible') == 'true'})
        fields.sort(key=lambda f: (f['hidden'], f['y'], f['x']))
        scr['fields'] = fields
    for g in [f for f in fs if f.endswith('.xml') and f != 'LayoutControl.xml' and 'Dockable' not in f]:
        cols = grid(os.path.join(dp, g))
        vis = sorted([c2 for c2 in cols if c2.get('Visible') == 'true' and c2.get('FieldName')], key=lambda c2: int(c2.get('VisibleIndex') or 0))
        scr[g[:-4]] = [{'caption': c2.get('Caption') or c2.get('FieldName'), 'field': c2.get('FieldName'), 'sum': c2.get('SummaryType') or ''} for c2 in vis]
    if scr:
        bk = rel.split('/')[-1]
        out[rel + (f'  [{books[bk]}]' if bk in books else '')] = scr
json.dump(out, open('spec.json', 'w'), indent=1, ensure_ascii=False)
for k in sorted(out): print(k, {g: len(v) for g, v in out[k].items()})
