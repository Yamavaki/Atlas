"""Auditoria do espaço 3D das cidades com andares: objetos meio na plataforma e meio fora,
plataformas sobre a água ou sob a muralha, portões em plataforma, ruas que cruzam o rio sem ponte.
Uso: python testes/auditoria_espaco.py [n_cidades]"""
from playwright.sync_api import sync_playwright
import json,sys,collections
import pathlib
QA=(pathlib.Path(__file__).parent/"qa_espaco.js").read_text()
SITES=["interior","rio","costa","peninsula","ilha","lago"];LF=["colina","encosta","penhasco","vale","auto"];CUL=["humano","japones","anao","deserto","chines","eslavo","orc","elfo"]
N=int(sys.argv[1]) if len(sys.argv)>1 else 24
with sync_playwright() as p:
    b=p.chromium.launch(executable_path=__import__("os").environ.get("CHROME") or None,args=["--no-sandbox"])
    pg=b.new_page();errs=[];pg.on("pageerror",lambda e:errs.append(str(e)));pg.goto(""+(pathlib.Path(__file__).parent/"qa_cidade.html").as_uri());pg.add_script_tag(content=QA)
    tot=collections.Counter();ex=[];k=0
    for i in range(N):
        P={"seed":f"sp{i}","site":SITES[i%6],"landform":LF[(i//2)%5],"culture":CUL[i%8],"size":[16,22,28][i%3],"relief":[.6,.8,1][(i//3)%3],"wall":["reta","curva"][i%2]}
        r=pg.evaluate("P=>{const x=run(Object.assign({},AtlasCity.DEF,P));if(x.err)return {err:x.err};return QAS.space(C)}",P)
        if r.get('err'):print('ERR',P,r);continue
        if not r.get('ter'):continue
        k+=1
        for kk,v in r.items():
            if isinstance(v,(int,float)) and kk!='ter':tot[kk]+=v
        if r['ex']:ex.append((P['seed'],r['ex'][:3]))
    print("cidades com andares:",k)
    for kk in ["pod","blocks","houses","hMix","houseWet","spb","sMix","props","pMix","streetPropOnBlk","trees","tMix","blkWet","blkWall","wallOnBlk","gateOnBlk","brWall","crossNoBridge"]:print(f"  {kk}: {tot[kk]}")
    print(ex[:5]);print(errs[:3]);b.close()
