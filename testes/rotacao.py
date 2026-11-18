# Teste dos assets (regras em planejamento/atlas-regras-de-assets.md)
# 1. todos os assets, todas as culturas, 8 angulos, 3 variacoes: nenhum erro de execucao
# 2. ordem das pecas contra a profundidade real (prisma do contorno x altura de cada peca)
# 3. ficha: todo asset tem solidos gravados e a silhueta desenhada cabe neles (no maximo 25% fora em qualquer angulo)
# 4. todo asset gira: o desenho a 0 e a 90 graus nao pode ser identico, salvo os redondos listados em REDONDOS
# uso: CHROME=/usr/bin/google-chrome python3 testes/rotacao.py   |   ... rotacao.py folha.png id1,id2 cultura
import os,sys,json,asyncio,pathlib
from playwright.async_api import async_playwright
AQUI=pathlib.Path(__file__).resolve().parent
REDONDOS={"crowsnest","clocktower","obelisk","haystack","smokestack","scrap","flowerbed","lighthouse","dovecote","observatory","arena","crystal","fountain","gasometer","gazebo","markettent","maypole","garden","wizard","marketcross","eldertree","mine","quarry","cathedral","theater","well"}
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(executable_path=os.environ.get("CHROME") or None,args=["--no-sandbox","--allow-file-access-from-files"])
        pg=await b.new_page(viewport={"width":1400,"height":900});errs=[];pg.on("pageerror",lambda e:errs.append(str(e)))
        await pg.goto("file://"+str(AQUI/"rotacao.html"))
        if len(sys.argv)>3:
            await pg.evaluate("([i,r])=>window.sheet(i,r,2,150,132,false)",[sys.argv[2].split(","),sys.argv[3]]);await (await pg.query_selector("#c")).screenshot(path=sys.argv[1]);print("folha",sys.argv[1]);await b.close();return
        falha=False
        E=await pg.evaluate("()=>window.erros()");print("1. erros de execucao:",len(E),list(E.items())[:8]);falha|=bool(E)
        R=await pg.evaluate("()=>{const R=window.medirTudo(['humano','deserto','japones']);let ov=0,eA=0,eD=0;for(const z of R){ov+=z[3];eA+=z[4];eD+=z[5]}return {fixa:+(eA/ov*100).toFixed(1),ordenada:+(eD/ov*100).toFixed(1)}}")
        print("2. ordem das pecas (% de pontos disputados errados):",json.dumps(R));falha|=R["ordenada"]>12
        F=await pg.evaluate("()=>{const R=window.fichaTudo(RACES,[0,3,5]);const sem=[...new Set(R.filter(z=>!z[2]||z[7]).map(z=>z[0]))],fora={};let ok=0;for(const z of R){if(z[3]<=10)ok++;if(z[3]>25)fora[z[0]]=Math.max(fora[z[0]]||0,z[3])}return {casos:R.length,dentro10:ok,semFicha:sem,fora25:fora}}")
        print("3. fichas:",json.dumps(F));falha|=bool(F["semFicha"])or bool(F["fora25"])
        G=await pg.evaluate("()=>{const fix=[];for(const id of IDS){shot(G1,NEW,id,'humano',0,.6);const a=G1.getImageData(0,0,360,360).data.slice();shot(G1,NEW,id,'humano',Math.PI/2,.6);const b=G1.getImageData(0,0,360,360).data;let d=0;for(let i=3;i<a.length;i+=16)if(Math.abs(a[i]-b[i])+Math.abs(a[i-3]-b[i-3])>60)d++;if(d<8)fix.push(id)}return fix}")
        G=[g for g in G if g not in REDONDOS];print("4. assets que nao giram (fora os redondos):",G);falha|=bool(G)
        await b.close()
        if falha or errs:print("FALHOU",errs[:3]);sys.exit(1)
        print("ok")
asyncio.run(main())
