# Teste de rotacao dos assets (v0.53)
# 1. desenha todos os assets em todas as culturas, 8 angulos e 3 variacoes: nao pode haver erro
# 2. nos assets feitos de pecas, compara a ordem de desenho com a profundidade real de cada peca (prisma do contorno x altura)
#    "fixa" = se as pecas fossem desenhadas sempre na mesma ordem; "ordenada" = como o app desenha
# uso: CHROME=/usr/bin/google-chrome python3 testes/rotacao.py [folha.png id1,id2,... cultura]
import os,sys,json,asyncio,pathlib
from playwright.async_api import async_playwright
AQUI=pathlib.Path(__file__).resolve().parent
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(executable_path=os.environ.get("CHROME") or None,args=["--no-sandbox","--allow-file-access-from-files"])
        pg=await b.new_page(viewport={"width":1400,"height":900});errs=[];pg.on("pageerror",lambda e:errs.append(str(e)))
        await pg.goto("file://"+str(AQUI/"rotacao.html"))
        if len(sys.argv)>3:
            await pg.evaluate("([i,r])=>window.sheet(i,r,2,150,132,false)",[sys.argv[2].split(","),sys.argv[3]]);await (await pg.query_selector("#c")).screenshot(path=sys.argv[1]);print("folha",sys.argv[1])
        else:
            E=await pg.evaluate("()=>window.erros()");print("erros de execucao:",len(E),list(E.items())[:8])
            R=await pg.evaluate("()=>{const R=window.medirTudo(RACES);let ov=0,eA=0,eD=0;const ids=new Set(),pior=[];for(const [id,r,n,o,a,d,p] of R){ov+=o;eA+=a;eD+=d;ids.add(id);if(o>200&&d/o>.2)pior.push([id,r,+(d/o*100).toFixed(0)])}return {assets:ids.size,casos:R.length,pixels:ov,fixa:+(eA/ov*100).toFixed(1),ordenada:+(eD/ov*100).toFixed(1),pior:pior.slice(0,20)}}")
            print(json.dumps(R,ensure_ascii=False));
            if E or errs:sys.exit(1)
        await b.close()
asyncio.run(main())
