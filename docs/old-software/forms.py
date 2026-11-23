import dnfile, sys, json
from dncil.cil.body import CilMethodBody
from dncil.cil.body.reader import CilMethodBodyReaderBase
class R(CilMethodBodyReaderBase):
    def __init__(self, pe, rva): self.pe=pe; self.offset=pe.get_offset_from_rva(rva)
    def read(self, n):
        d=self.pe.get_data(self.pe.get_rva_from_offset(self.offset), n); self.offset+=n; return d
    def tell(self): return self.offset
    def seek(self,o): self.offset=o; return o
pe=dnfile.dnPE(sys.argv[1]); md=pe.net.mdtables
def name(tok):
    try:
        tbl={4:md.Field,6:md.MethodDef,10:md.MemberRef}.get(tok.table)
        return str(tbl.rows[tok.rid-1].Name) if tbl else None
    except Exception: return None
def us(tok):
    try: return pe.net.user_strings.get(tok.rid).value
    except Exception: return None
PROPS={'set_Text','set_Caption','set_FieldName','set_Control','set_CustomizationFormText','set_NullText','set_ToolTip'}
out={}
for t in md.TypeDef.rows:
    tn=str(t.TypeName)
    pass
    for mi in t.MethodList:
        m=mi.row
        if str(m.Name)!='InitializeComponent' or not m.Rva: continue
        try: b=CilMethodBody(R(pe,m.Rva))
        except Exception: continue
        ev=[]; gets=[]; strs=[]
        for ins in b.instructions:
            op=ins.opcode.name
            if op=='nop': gets=[]; strs=[]; continue
            if op=='ldstr': strs.append(us(ins.operand))
            elif op in ('call','callvirt'):
                n=name(ins.operand) or ''
                if n.startswith('get_') and getattr(ins.operand,'table',0)==6: gets.append(n[4:])
                elif n in PROPS:
                    tgt=gets[0] if gets else None
                    val=strs[-1] if strs and n!='set_Control' else (gets[1] if len(gets)>1 else None)
                    if val is not None: ev.append([tgt,n[4:],val])
                    gets=[]; strs=[]
        out[tn]=ev
json.dump(out,open('forms.json','w'),ensure_ascii=False)
print(len(out),'forms')
