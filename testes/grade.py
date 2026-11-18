"""Teste da grade do mundo (0.55): para cada cidade da bateria monta a grade pelas formas exatas e conta os conflitos.
Conflitos: construção sobre construção, construção na rua, na muralha, na ponte, na água; adereço sobre construção, na água,
na muralha; árvore em construção ou na rua. Só conta encontros de 2 células (8 unidades²) ou mais.
Uso: CHROME=/usr/bin/google-chrome python3 testes/grade.py [resultado.json]"""
import json,sys,collections,os,pathlib
BASE=pathlib.Path(__file__).resolve().parent.as_uri()
from playwright.sync_api import sync_playwright
SITES=["interior","rio","costa","peninsula","ilha","ilhas","lago","arquipelago"]
CUL=["humano","anao","elfo","orc","deserto","norte","halfling","pantano","tribal","japones","chines","indiano","meso","mongol"]
out=[]
with sync_playwright() as p:
    b=p.chromium.launch(executable_path=os.environ.get("CHROME") or None,args=["--no-sandbox","--allow-file-access-from-files"]);pg=b.new_page();errs=[]
    pg.on("pageerror",lambda e:errs.append(str(e)))
    pg.goto(BASE+"/qa_grade.html");pg.wait_for_timeout(300)
    for i,site in enumerate(SITES):
        for j,cul in enumerate(CUL):
            P={"site":site,"seed":f"qa0-{i}-{j}","size":[16,22,28,34][(i+j)%4],"culture":cul,"wealth":[.3,.55,.85][i%3],"relief":[.2,.6,1][j%3],"plan":["misto","organico","planejado"][(i*j)%3],"labels":False,"legend":False}
            r=pg.evaluate("P=>run(P)",P);r["P"]=P;out.append(r)
    b.close()
if len(sys.argv)>1:json.dump(out,open(sys.argv[1],'w'))
por=collections.Counter();cel=collections.Counter();err=[r for r in out if r.get('err')];ms=[r['ms'] for r in out if 'ms' in r]
for r in out:
    for k,v in r.get('por',{}).items():por[k]+=v
    for k,v in r.get('cel',{}).items():cel[k]+=v
print(f"== grade: {len(out)} cidades, erros {len(err)}, montagem {min(ms)}–{max(ms)} ms (média {sum(ms)//len(ms)})")
for e in err[:3]:print("  ERR",e['err'],e['P'])
for k,v in por.most_common():print(f"  {k}: {v} casos, {cel[k]} células ({cel[k]*4} unidades²)")
