import asyncio,subprocess,time,glob
from playwright.async_api import async_playwright
srv=subprocess.Popen(["python3","-m","http.server","8814","--bind","127.0.0.1"],cwd="/home/claude/app",stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL);time.sleep(1)
ok=[];falha=[]
def chk(nome,c):(ok if c else falha).append(nome);print(("OK  " if c else "FALHA ")+nome,flush=True)
ARGS=["--no-sandbox","--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader","--ignore-gpu-blocklist"]
U="/mnt/user-data/uploads/"
PACS=sorted(glob.glob(U+"*.dungeondraft_pack"))
E="AtlasBatalha.atual()"
async def main():
    try:
        async with async_playwright() as p:
            b=await p.chromium.launch(executable_path="/usr/bin/google-chrome",args=ARGS)
            ctx=await b.new_context(viewport={"width":1400,"height":860},accept_downloads=True);pg=await ctx.new_page();errs=[];pg.on("pageerror",lambda e:errs.append(str(e.stack)[:400]))
            pg.on("console",lambda m:print("CON",m.text[:300]) if m.type=="error" and "Failed to load" not in m.text else None)
            await pg.goto("http://127.0.0.1:8814/index.html");await pg.wait_for_timeout(1500)
            await pg.click(".rail button[data-sec=maps]");await pg.click(".shead button.primary");await pg.click(".mitem >> text=Mapa de batalha");await pg.wait_for_timeout(2500)
            await pg.set_input_files(".bt-wrap input[accept='.dungeondraft_pack']",PACS);await pg.wait_for_function("()=>window.AtlasArtes&&window.AtlasArtes.estado().conectada&&!window.AtlasArtes.estado().lendo",timeout=180000);await pg.wait_for_timeout(600)
            # importar universidade
            await pg.click(".rail button[data-sec=maps]");await pg.click(".shead button.primary");await pg.wait_for_timeout(200)
            await pg.set_input_files(".bt-lado input[type=file]",U+"1123b0fe-universidade-aster_v7.dungeondraft_map");await pg.wait_for_timeout(5000);await pg.keyboard.press("Escape")
            await pg.wait_for_function("()=>AtlasBatalha.atual()&&AtlasBatalha.atual().mapa.nome.toLowerCase().includes('universidade')",timeout=60000)
            await pg.evaluate(f"()=>{E}.artesPC().espera()");await pg.wait_for_timeout(2500)
            r=await pg.evaluate("()=>{const e=AtlasBatalha.atual(),M=e.mapa,A=M.andares.flatMap(a=>a.objetos),reais=A.filter(o=>/^res:\\/\\/packs\\/(7IhYmL1i|fp1lAaD0)/.test(M.texturas[o.t]));return {n:reais.length,dz:reais.filter(o=>o.dz).length,ds:A.filter(o=>o.ds).length,s:A.filter(o=>o.s).length,tot:A.length,ex:reais.slice(0,4).map(o=>[M.texturas[o.t].split('/').pop(),o.w,o.h,o.ds]),camadas:e.render.camadasPC(),reais:e.render.reais()}}")
            print(r)
            chk("objetos importados guardam a escala do DD",r["ds"]==r["tot"])
            chk("objetos do pacote com tamanho real",r["n"]==0 or r["dz"]==r["n"])
            chk("sombras padrao nos objetos importados",r["s"]==r["tot"])
            chk("atlas de artes montado",r["camadas"]>=1)
            # nitidez: aproxima num objeto do pacote e confere variacao de pixels
            await pg.evaluate(f"()=>{{const e={E},M=e.mapa,o=M.andares.flatMap(a=>a.objetos).find(o=>/7IhYmL1i|fp1lAaD0/.test(M.texturas[o.t]))||M.andares[0].objetos[0];e.set({{cam:{{x:o.x,y:o.y,z:220}}}});e.agora()}}");await pg.wait_for_timeout(500)
            await pg.screenshot(path="/tmp/a94_zoom.png",clip={"x":380,"y":160,"width":700,"height":690})
            await pg.evaluate(f"()=>{{const e={E};e.set({{cam:{{x:32,y:32,z:12}}}});e.agora()}}");await pg.wait_for_timeout(500);await pg.screenshot(path="/tmp/a94_geral.png")
            # exportar imagem com artes do pc
            await pg.locator(".bt-wrap").click(position={"x":5,"y":5});await pg.keyboard.press("Escape")
            exp=pg.locator(".bt-b[title*='Exportar'], button[aria-label*='Exportar']")
            print("exp",await exp.count())
            if await exp.count():
                await exp.first.click();await pg.wait_for_timeout(500)
                v=await pg.evaluate("()=>[...document.querySelectorAll('select')].map(s=>s.value).filter(v=>/\\|m|\\|ft/.test(v))");print("medida",v);chk("medida padrao 1 m","1|m" in v)
                await pg.select_option("select:has(option[value='webp'])","webp") if await pg.locator("select:has(option[value='webp'])").count() else None
                pxsel=pg.locator("select:has(option[value='50'])")
                if await pxsel.count():await pxsel.first.select_option("50")
                async with pg.expect_download(timeout=240000) as d:await pg.click("button:has-text('Baixar imagem')")
                path=await (await d.value).path();import shutil;shutil.copy(path,"/tmp/a94_export.webp");chk("exportou",True)
            chk("sem erros",not errs);print(errs)
            await b.close()
    finally:srv.terminate()
asyncio.run(main())
print(len(ok),"ok",len(falha),"falhas",falha)
