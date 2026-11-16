"""Bateria de testes: gera cidades (8 terrenos x 14 culturas) e regiões e conta sobreposições e duplicados.
Uso: pip install playwright && playwright install chromium && python testes/bateria.py [repetições]"""
import json,sys,collections,os,pathlib
BASE=pathlib.Path(__file__).resolve().parent.as_uri()
from playwright.sync_api import sync_playwright
N=int(sys.argv[1]) if len(sys.argv)>1 else 1
SITES=["interior","rio","costa","peninsula","ilha","ilhas","lago","arquipelago"]
CUL=["humano","anao","elfo","orc","deserto","norte","halfling","pantano","tribal","japones","chines","indiano","meso","mongol"]
RCUL=["europa","leste","sul","meso","estepe","misto"]
out={"city":[],"reg":[]}
with sync_playwright() as p:
    b=p.chromium.launch(executable_path=os.environ.get("CHROME") or None,args=["--no-sandbox"]); pg=b.new_page();errs=[]
    pg.on("pageerror",lambda e:errs.append(str(e)))
    pg.goto(BASE+"/qa_cidade.html"); pg.wait_for_timeout(300)
    k=0
    for rep in range(N):
      for i,site in enumerate(SITES):
        for j,cul in enumerate(CUL):
          k+=1
          P={"site":site,"seed":f"qa{rep}-{i}-{j}","size":[16,22,28,34][(i+j+rep)%4],"culture":cul,"wealth":[.3,.55,.85][(i+rep)%3],"relief":[.2,.6,1][(j+rep)%3],"plan":["misto","organico","planejado"][(i*j+rep)%3]}
          r=pg.evaluate("P=>{const x=run(P);if(x.err)return {err:x.err};return QA.city(C)}",P)
          r["P"]=P;out["city"].append(r)
    pg.goto(BASE+"/qa_regiao.html"); pg.wait_for_timeout(300)
    base={"smooth":.2,"plains":.3,"poi":.5,"culture":"europa","size":1,"temp":.5,"humid":.5,"climVar":.5,"waste":.1,"races":.5,"form":"regiao","sea":.5,"islands":0,"lakes":0,"rivers":1,"relief":.65,"forest":.5,"fields":.65,"towns":6,"meander":.6,"clouds":.38,"plan":"mixed","season":"verao"}
    for rep in range(N):
      for i,cul in enumerate(RCUL):
        for poi in [.3,.8]:
          P=dict(base);P.update({"seed":f"rq{rep}-{i}-{poi}","culture":cul,"poi":poi,"towns":[4,8,12][(i+rep)%3],"form":["regiao","continente","ilha"][(i+rep)%3],"waste":[.1,.4][i%2]})
          r=pg.evaluate("P=>{const x=run(P);if(x.err)return {err:x.err};return QA.region(W)}",P)
          r["P"]=P;out["reg"].append(r)
    b.close()
json.dump(out,open('resultado.json','w'))
def summ(L,name):
    err=[r for r in L if r.get('err')];ov=sum(len(r.get('ov',[])) for r in L);du=sum(len(r.get('dup',[])) for r in L);tr=sum(len(r.get('tree',[])) for r in L)
    c=collections.Counter();d=collections.Counter()
    for r in L:
        for o in r.get('ov',[]):c[tuple(sorted([str(o[0]).split(':')[0],str(o[1]).split(':')[0]]))]+=1
        for o in r.get('dup',[]):d[o[0]]+=1
    print(f"== {name}: {len(L)} mapas, erros {len(err)}, sobreposições {ov}, duplicados {du}, árvores em construção {tr}")
    for e in err[:3]:print("  ERR",e['err'],e['P'])
    print("  pares:",c.most_common(14));print("  dups:",d.most_common(10))
summ(out["city"],"cidades");summ(out["reg"],"regiões");print(errs[:3])
