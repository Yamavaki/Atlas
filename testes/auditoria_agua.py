"""Auditoria de agua: ruas que cruzam o rio sem ponte, pontes com ponta na agua ou sobre a muralha,
construcoes e camadas na agua, bacias. Uso: python testes/auditoria_agua.py [n] [json de parametros extras]"""
from playwright.sync_api import sync_playwright
import json,sys,collections,pathlib
QA=(pathlib.Path(__file__).parent/'qa_espaco.js').read_text()
N=int(sys.argv[1]) if len(sys.argv)>1 else 36;EXTRA=json.loads(sys.argv[2]) if len(sys.argv)>2 else {}
SITES=["rio","interior","costa","peninsula","lago"];LF=["colina","encosta","vale","plano","auto","penhasco"];CUL=["humano","japones","anao","deserto","chines","eslavo","mediterraneo","elfo"]
with sync_playwright() as p:
    b=p.chromium.launch(executable_path=__import__("os").environ.get("CHROME") or None,args=["--no-sandbox"])
    pg=b.new_page();errs=[];pg.on("pageerror",lambda e:errs.append(str(e)));pg.goto((pathlib.Path(__file__).parent/"qa_cidade.html").as_uri());pg.add_script_tag(content=QA)
    tot=collections.Counter();ex=[];forms=collections.Counter();k=0
    for i in range(N):
        P={"seed":f"wt{i}","site":SITES[i%5],"river":True,"landform":LF[(i//5)%6],"culture":CUL[i%8],"size":[16,22,28,34][i%4],"relief":[.5,.8,1][(i//2)%3],"wall":["reta","curva","reta"][i%3]};P.update(EXTRA)
        r=pg.evaluate("P=>{const x=run(Object.assign({},AtlasCity.DEF,P));if(x.err)return {err:x.err,st:x.stack};const s=QAS.space(C),w=QAS.water(C);return Object.assign({},w,{basinBr:QAS.basinBr(C),blkWall:s.blkWall||0,hMix:s.hMix||0,sMix:s.sMix||0,pMix:s.pMix||0,t:x.gen+x.ren})}",P)
        if r.get('err'):print('ERR',P,r['err'],r.get('st','')[:300]);continue
        k+=1;forms[str(r['canal'])]+=1
        for kk,v in r.items():
            if isinstance(v,(int,float)):tot[kk]+=v
        if r['noBridge'] or r['roadBrWall'] or r['blkWall'] or r['brOnBlk'] or r['brEndWet']:ex.append((P['seed'],P['site'],{kk:r[kk] for kk in ['noBridge','roadBrWall','blkWall','brOnBlk','brEndWet'] if r[kk]},r['ex'][:2]))
    print("cidades:",k,"formas:",dict(forms),"tempo medio",round(tot['t']/max(1,k)))
    print({kk:tot[kk] for kk in ["endBasin","basinBr","cross","noBridge","brEndWet","brOnBlk","brBr","roadBrWall","blkWall","blkWet","houseWet","treeWet","propWet","hMix","sMix","pMix","basin"]})
    for e in ex[:12]:print(' ',e)
    print(errs[:3]);b.close()
