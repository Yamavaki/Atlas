import json,sys
from playwright.sync_api import sync_playwright
CITY_ALL=[("size","int",6,44),("plan","sel",["misto","organico","planejado"]),("wall","sel",["reta","curva","nenhuma"]),("citadel","bool"),("river","bool"),
 ("wealth","pct"),("relief","pct"),("suburbs","pct"),("green","pct"),("magic","pct"),("abandon","pct"),("castleStyle","sel",["fortaleza","palacio","alto"]),("arch","sel",["misto","enxaimel","pedra","colonial"]),("plazaStyle","sel",["feira","fonte","monumento","relogio","festa"]),("season","sel",["verao","inverno"]),("foreign","sel",["nao","elfo"]),("site","sel",["interior","rio","costa","ilha","lago"])]
REG_ALL=[("sea","pct"),("islands","int",0,6),("lakes","int",0,4),("rivers","int",0,3),("temp","pct"),("humid","pct"),("climVar","pct"),("waste","pct"),("races","pct"),("relief","pct"),("smooth","pct"),("plains","pct"),("poi","pct"),("forest","pct"),("fields","pct"),("towns","int",2,9),("meander","pct"),("season","sel",["verao","inverno"]),("clouds","pct"),("plan","sel",["mixed","organic","planned"])]
CBASE={"site":"rio","size":24,"culture":"humano","wealth":.5,"relief":.5,"suburbs":.5,"green":.4,"magic":.3,"abandon":.1,"plan":"misto","wall":"reta","citadel":True,"river":True}
RBASE={'smooth':.2,'plains':.3,'poi':.5,'culture':'europa','size':1,'temp':.5,'humid':.5,'climVar':.5,'waste':.1,'races':.5,'form':'regiao','sea':.5,'islands':0,'lakes':0,'rivers':1,'relief':.65,'forest':.5,'fields':.65,'towns':6,'meander':.6,'clouds':.38,'plan':'mixed','season':'verao'}
import os
ONLY=os.environ.get("ONLY","").split(",") if os.environ.get("ONLY") else None
CITY=[p for p in CITY_ALL if not ONLY or p[0] in ONLY];REG=[p for p in REG_ALL if not ONLY or p[0] in ONLY]
def vals(p):
    if p[1]=="pct":return [0,1]
    if p[1]=="int":return [p[2],p[3]]
    if p[1]=="bool":return [False,True]
    return p[2]
which=sys.argv[1] if len(sys.argv)>1 else "both"
seeds=["karak-4","mont-1","lipany-1490"]
with sync_playwright() as pw:
    b=pw.chromium.launch(executable_path="/usr/bin/google-chrome",args=["--no-sandbox"])
    out={}
    if which in("both","city"):
        pg=b.new_page(viewport={"width":1600,"height":1200});errs=[];pg.on("pageerror",lambda e:errs.append(str(e)))
        pg.goto("file:///home/claude/app/ctest.html");pg.wait_for_timeout(300)
        pg.evaluate("""()=>{window.MET=()=>{const cv=document.getElementById('c');AtlasCity.render(C,cv,{scale:.4});const d=cv.getContext('2d').getImageData(0,0,cv.width,cv.height).data;const sm=new Uint8Array(d.length/16|0);for(let i=0,j=0;j<sm.length;i+=16,j++)sm[j]=(d[i]+d[i+1]+d[i+2])/3|0;
          return {img:sm,m:{casas:C.B.length,esp:C.SPB.length,props:C.props.length,arv:C.trees.length,nat:(C.NAT||[]).length,campos:C.fields.length,quint:C.yards.length,muro:C.walls.length,ruin:C.B.filter(b=>b.ruin||b.aband).length}}};
          window.DIFF=(a,b)=>{let n=0;for(let i=0;i<a.length;i++)if(Math.abs(a[i]-b[i])>18)n++;return +(100*n/a.length).toFixed(1)}}""")
        res={}
        for p in CITY:
            rows=[]
            for sd in seeds:
                imgs=[];ms=[]
                for v in vals(p):
                    P=dict(CBASE);P["seed"]=sd;P[p[0]]=v
                    pg.evaluate("P=>{run(P);window.__L=window.__L||[];window.__L.push(MET())}",P)
                r=pg.evaluate("()=>{const L=window.__L;window.__L=[];let mx=0;for(let i=1;i<L.length;i++)mx=Math.max(mx,DIFF(L[0].img,L[i].img));return {diff:mx,m:L.map(z=>z.m)}}")
                rows.append(r)
            res[p[0]]={"diff":[r["diff"] for r in rows],"m":rows[0]["m"]}
            print("CIDADE",p[0],res[p[0]]["diff"],json.dumps(rows[0]["m"],ensure_ascii=False)[:400],flush=True)
        out["city"]=res;print("errs",errs[:3])
    if which in("both","reg"):
        pg=b.new_page(viewport={"width":1600,"height":1200});errs=[];pg.on("pageerror",lambda e:errs.append(str(e)))
        pg.goto("file:///home/claude/app/test.html");pg.wait_for_timeout(300)
        pg.evaluate("""()=>{window.MET=()=>{const cv=document.getElementById('c');const d=cv.getContext('2d').getImageData(0,0,cv.width,cv.height).data;const sm=new Uint8Array(d.length/64|0);for(let i=0,j=0;j<sm.length;i+=64,j++)sm[j]=(d[i]+d[i+1]+d[i+2])/3|0;
          const o=R.objs||[];return {img:sm,m:{arv:o.filter(q=>q.k===0).length,arb:o.filter(q=>q.k===12).length,ped:o.filter(q=>q.k===11).length,casas:o.filter(q=>q.k===1).length,poi:W.B.filter(b=>b.k>=16&&b.k<=28).length,campos:W.fieldsP.length,povo:W.towns.length,rios:(W.rivers||[]).length}}};
          window.DIFF=(a,b)=>{let n=0;for(let i=0;i<Math.min(a.length,b.length);i++)if(Math.abs(a[i]-b[i])>18)n++;return +(100*n/a.length).toFixed(1)}}""")
        res={}
        for p in REG:
            rows=[]
            for sd in seeds[:2]:
                for v in vals(p):
                    P=dict(RBASE);P["seed"]=sd;P[p[0]]=v
                    pg.evaluate("P=>{run(P);window.__L=window.__L||[];window.__L.push(MET())}",P)
                r=pg.evaluate("()=>{const L=window.__L;window.__L=[];let mx=0;for(let i=1;i<L.length;i++)mx=Math.max(mx,DIFF(L[0].img,L[i].img));return {diff:mx,m:L.map(z=>z.m)}}")
                rows.append(r)
            res[p[0]]={"diff":[r["diff"] for r in rows],"m":rows[0]["m"]}
            print("REGIAO",p[0],res[p[0]]["diff"],json.dumps(rows[0]["m"],ensure_ascii=False)[:400],flush=True)
        out["reg"]=res;print("errs",errs[:3])
    json.dump(out,open("/home/claude/audit/result_%s.json"%which,"w"),ensure_ascii=False)
    b.close()
