import psycopg2, json, sys
c = psycopg2.connect('postgresql://yarnflow:yarnflow@localhost/yarnflow'); cur = c.cursor()
tables = sys.argv[1].split(',')
res = {}
for t in tables:
    cur.execute("select column_name from information_schema.columns where table_schema='legacy_umiya24' and table_name=%s and column_name not in ('_row','_sha') order by ordinal_position", (t,))
    cols = [r[0] for r in cur.fetchall()]
    if not cols: continue
    blank = "(x is null or btrim(x) in ('','0','0.00','0.000','Null','NULL','False','false','0.0') or x ~ '^0+(\\.0+)?$' or x ~ '^1900-01-01')"
    parts = []
    for col in cols:
        e = f'"{col}"'
        parts.append(f"count(*) filter (where not {blank.replace('x', e)})")
    cur.execute(f'select count(*), {", ".join(parts)} from legacy_umiya24."{t}"')
    row = cur.fetchone(); n = row[0]
    used = []
    for col, k in zip(cols, row[1:]):
        if k:
            cur.execute(f'select "{col}", count(*) from legacy_umiya24."{t}" where not {blank.replace("x", chr(34)+col+chr(34))} group by 1 order by 2 desc limit 3')
            used.append({'col': col, 'filled': k, 'pct': round(100*k/max(n,1),1), 'top': [str(v)[:30] for v, _ in cur.fetchall()]})
    res[t] = {'rows': n, 'cols': len(cols), 'used': used, 'unused': [c for c in cols if c not in {u['col'] for u in used}]}
    print(t, n, 'rows;', len(used), 'of', len(cols), 'columns used', file=sys.stderr)
json.dump(res, open('usage.json', 'w'), indent=1, ensure_ascii=False)
