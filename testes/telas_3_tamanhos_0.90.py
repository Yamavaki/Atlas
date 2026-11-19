import asyncio,subprocess,time
from playwright.async_api import async_playwright
srv=subprocess.Popen(["python3","-m","http.server","8800","--bind","127.0.0.1"],cwd="/home/claude/app",stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL);time.sleep(1)
ok=[];falha=[]
def chk(nome,c):(ok if c else falha).append(nome);print(("OK  " if c else "FALHA ")+nome)
ARGS=["--no-sandbox","--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader","--ignore-gpu-blocklist"]
TRANSB="""()=>{const W=innerWidth,out=[];if(document.documentElement.scrollWidth>W+1)out.push('pagina '+document.documentElement.scrollWidth);
for(const e of document.querySelectorAll('#main *, #side *, header *, .rail *')){const r=e.getBoundingClientRect();if(r.width&&r.right>W+2&&getComputedStyle(e).position!=='fixed'){let p=e.parentElement,cort=false;while(p){const o=getComputedStyle(p);if(/(hidden|auto|scroll|clip)/.test(o.overflowX)){const pr=p.getBoundingClientRect();if(pr.right<=W+2){cort=true;break}}p=p.parentElement}if(!cort)out.push((e.className&&e.className.baseVal===undefined?e.className:e.tagName)+' '+Math.round(r.right))}}return out.slice(0,5)}"""
async def main():
    try:
        async with async_playwright() as p:
            b=await p.chromium.launch(executable_path="/usr/bin/google-chrome",args=ARGS)
            for W,H in [(1400,860),(900,760),(390,800)]:
                ctx=await b.new_context(viewport={"width":W,"height":H});pg=await ctx.new_page();errs=[];pg.on("pageerror",lambda e:errs.append(str(e.stack)[:300]))
                t=f"{W}px";cel=W<=860
                async def secao(s):
                    await pg.click(f".rail button[data-sec={s}]");await pg.wait_for_timeout(300)
                async def lado():
                    if cel and not await pg.locator("#side.open").count():await pg.click("#menu");await pg.wait_for_timeout(300)
                async def olha(nome):
                    await pg.wait_for_timeout(300);tb=await pg.evaluate(TRANSB);chk(f"{t} {nome} sem nada vazando",not tb);
                    if tb:print("   ",tb)
                    await pg.screenshot(path=f"/tmp/t90_{W}_{nome}.png")
                await pg.goto("http://127.0.0.1:8800/index.html");await pg.wait_for_timeout(1200)
                await olha("inicio_vazio")
                await secao("notes");await lado();chk(t+" vazio das notas",await pg.locator("#side .vazio-l").count()==1);await olha("notas_vazio")
                await secao("maps");await lado();chk(t+" vazio dos mapas",await pg.locator("#side .vazio-l button").count()>=3)
                # atalhos
                await pg.keyboard.press("Escape");await pg.locator("body").click(position={"x":W-30,"y":H-120}) if not cel else None
                await pg.keyboard.press("?");await pg.wait_for_timeout(200);chk(t+" ? abre atalhos",await pg.locator("#atalhos").count()==1);await olha("atalhos")
                await pg.keyboard.press("Escape");await pg.wait_for_timeout(200);chk(t+" Esc fecha atalhos",await pg.locator("#atalhos").count()==0)
                await pg.click("#bExp");await pg.click(".mitem >> text=Criar mundo de exemplo");await pg.wait_for_timeout(2500)
                await secao("home");await olha("inicio")
                await secao("notes");await lado();await pg.click("#side .item >> text=A crônica perdida");await pg.wait_for_timeout(400);await olha("nota")
                await lado();await pg.click(".vtabs button >> text=Missões");await pg.wait_for_timeout(400);await olha("missoes")
                await pg.click(".qtabs button >> text=Lista");await olha("missoes_lista")
                await pg.click(".qtabs button >> text=Árvore");await olha("missoes_arvore")
                await pg.click(".qtabs button >> text=Situação")
                await pg.click(".qresumo button >> text=Quadro da campanha");await pg.wait_for_timeout(800);await olha("quadro")
                await lado();await pg.click(".vtabs button >> text=Grafo");await pg.wait_for_timeout(500);await olha("grafo")
                await secao("maps");await lado();await pg.locator("#side .item").first.click();await pg.wait_for_timeout(1500);await olha("regiao")
                await lado();await pg.click(".shead button.primary");await pg.click(".mitem >> text=Mapa de cidade");await pg.wait_for_timeout(2500);await olha("cidade")
                await lado();await pg.click(".shead button.primary");await pg.click(".mitem >> text=Mapa de batalha");await pg.wait_for_timeout(2000);await olha("batalha")
                await pg.keyboard.press("Control+k");await pg.wait_for_timeout(200);await pg.keyboard.type("atalhos");await pg.wait_for_timeout(200);await pg.keyboard.press("Enter");await pg.wait_for_timeout(200)
                chk(t+" atalhos pela busca",await pg.locator("#atalhos").count()==1);await pg.keyboard.press("Escape")
                chk(t+" sem erros",not errs);print(errs)
                await ctx.close()
    finally:srv.terminate()
asyncio.run(main())
print(len(ok),"ok",len(falha),"falhas",falha)
