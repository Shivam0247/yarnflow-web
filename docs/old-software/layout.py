import sys, xml.etree.ElementTree as ET, json
def items(path):
    root = ET.parse(path).getroot()
    out = []
    for it in root.iter('property'):
        n = it.get('name', '')
        if n.startswith('Item') and it.get('iskey') == 'true':
            p = {c.get('name'): (c.text or '') for c in it if c.get('name')}
            if 'TypeName' in p: out.append(p)
    return out
def grid(path):
    root = ET.parse(path).getroot(); cols = []
    for c in root.iter('property'):
        if c.get('name','').startswith('Item') and c.get('iskey')=='true':
            p = {x.get('name'): (x.text or '') for x in c if x.get('name')}
            if 'FieldName' in p or 'Caption' in p: cols.append(p)
    return cols
if __name__ == '__main__':
    f = sys.argv[1]
    if f.endswith('LayoutControl.xml'):
        its = items(f)
        print(sorted(set(k for i in its for k in i))[:80])
        for i in its[:6]: print({k: i.get(k) for k in ('TypeName','Name','Text','Visibility','ControlName','Location','ParentName','TextVisible')})
    else:
        cs = grid(f); print(sorted(set(k for c in cs for k in c)))
        for c in cs[:5]: print(c.get('FieldName'), c.get('Caption'), c.get('Visible'), c.get('VisibleIndex'))
