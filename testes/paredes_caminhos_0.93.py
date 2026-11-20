import asyncio,subprocess,time
from playwright.async_api import async_playwright
srv=subprocess.Popen(["python3","-m","http.server","8812","--bind","127.0.0.1"],cwd="/home/claude/app",stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL);time.sleep(1)
ok=[];falha=[]
def chk(nome,c):(ok if c else falha).append(nome);print(("OK  " if c else "FALHA ")+nome,flush=True)
ARGS=["--no-sandbox","--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader","--ignore-gpu-blocklist"]
U="/mnt/user-data/uploads/"
PACS=[U+"PeaPu_Battle_Cyberpunk_Exteriors_01_Streets.dungeondraft_pack",U+"PeaPu_Battle_Cyberpunk_Exteriors_02_Slums.dungeondraft_pack",U+"0d332e36-PeaPu_Battle_Sci-Fi_Interiors_01_Spaceship.dungeondraft_pack"]
E="AtlasBatalha.atual()"
async def main():
    try:
        async with async_playwright() as p:
            b=await p.chromium.launch(executable_path="/usr/bin/google-chrome",args=ARGS)
            ctx=await b.new_context(viewport={"width":1400,"height":860});pg=await ctx.new_page();errs=[];pg.on("pageerror",lambda e:errs.append(str(e.stack)[:400]))
            await pg.goto("http://127.0.0.1:8812/index.html");await pg.wait_for_timeout(1500)
            await pg.click(".rail button[data-sec=maps]");await pg.click(".shead button.primary");await pg.click(".mitem >> text=Mapa de batalha");await pg.wait_for_timeout(2500)
            await pg.set_input_files(".bt-wrap input[accept='.dungeondraft_pack']",PACS);await pg.wait_for_function("()=>window.AtlasArtes&&window.AtlasArtes.estado().conectada&&!window.AtlasArtes.estado().lendo",timeout=120000);await pg.wait_for_timeout(600)
            # parede com arte do pacote
            await pg.locator(".bt-wrap").click(position={"x":600,"y":400});await pg.keyboard.press("w");await pg.wait_for_timeout(300)
            await pg.click(".bt-mat:has-text('Textura da parede')");await pg.wait_for_timeout(200)
            aba=pg.locator(".bt-mats:not([hidden]) .bt-fonte button >> text=Minhas paredes");chk("aba minhas paredes",await aba.count()==1)
            await aba.click();await pg.wait_for_timeout(400);n=await pg.locator(".bt-mats:not([hidden]) .bt-mgr:not([hidden]) .bt-mo").count();print("paredes",n);chk("paredes do pacote",n>0)
            await pg.locator(".bt-mats:not([hidden]) .bt-mgr:not([hidden]) .bt-mo").first.click();await pg.wait_for_timeout(1500)
            pts=[(4,4),(12,4),(12,10),(4,10)]
            for x,y in pts:
                q=await pg.evaluate(f"()=>{E}.naTela({x},{y})");await pg.mouse.click(q[0],q[1]);await pg.wait_for_timeout(120)
            q=await pg.evaluate(f"()=>{E}.naTela(4,4)");await pg.mouse.click(q[0],q[1]);await pg.wait_for_timeout(800)
            w=await pg.evaluate(f"()=>{{const M={E}.mapa,w=M.andares[0].paredes.slice(-1)[0];return w?M.texturas[w.t]:null}}");print("parede",w)
            chk("parede usa arte do pacote",w and "/textures/walls/" in w)
            # caminho
            await pg.keyboard.press("Escape");await pg.keyboard.press("k");await pg.wait_for_timeout(300)
            await pg.click(".bt-mat:has-text('Textura')");await pg.wait_for_timeout(200)
            aba=pg.locator(".bt-mats:not([hidden]) .bt-fonte button >> text=Meus caminhos");chk("aba meus caminhos",await aba.count()==1)
            await aba.click();await pg.wait_for_timeout(300);await pg.fill(".bt-mats:not([hidden]) .bt-busca","road");await pg.wait_for_timeout(300)
            await pg.locator(".bt-mats:not([hidden]) .bt-mgr:not([hidden]) .bt-mo").first.click();await pg.wait_for_timeout(1500)
            for x,y in [(2,13),(9,14),(16,13)]:
                q=await pg.evaluate(f"()=>{E}.naTela({x},{y})");await pg.mouse.click(q[0],q[1]);await pg.wait_for_timeout(120)
            await pg.keyboard.press("Enter");await pg.wait_for_timeout(800)
            c=await pg.evaluate(f"()=>{{const M={E}.mapa,c=M.andares[0].caminhos.slice(-1)[0];return c?M.texturas[c.t]:null}}");print("caminho",c)
            chk("caminho usa arte do pacote",c and "/textures/paths/" in c)
            # porta: sem portas nos pacotes enviados, testa o desenho com uma arte de objeto
            await pg.keyboard.press("Escape");await pg.keyboard.press("d");await pg.wait_for_timeout(300)
            q=await pg.evaluate(f"()=>{E}.naTela(8,4)");await pg.mouse.move(q[0],q[1]);await pg.wait_for_timeout(100);await pg.mouse.click(q[0],q[1]);await pg.wait_for_timeout(500)
            np=await pg.evaluate(f"()=>{E}.mapa.andares[0].portais.length");chk("porta posta",np>=1)
            arte=await pg.evaluate("()=>AtlasArtes.buscar({q:'sign road',cat:'objects',limite:1}).itens[0].caminho")
            await pg.evaluate(f"async a=>{{const e={E},M=e.mapa,q=M.andares[0].portais.slice(-1)[0];const i=M.texturas.indexOf(a);q.t=i>=0?i:(M.texturas.push(a)-1);}}",arte)
            await pg.keyboard.press("Escape");await pg.keyboard.press("v");await pg.wait_for_timeout(200)
            # recarrega artes do mapa (a porta usa uma arte nova)
            await pg.evaluate(f"()=>{{const e={E};e.render.carregar(e.mapa)}}")
            # colorivel
            await pg.keyboard.press("o");await pg.wait_for_timeout(300)
            if await pg.locator(".bt-fonte button[aria-selected=false] >> text=Minhas artes").count():await pg.click(".bt-fonte button >> text=Minhas artes")
            await pg.fill(".bt-busca[aria-label='Buscar nas suas artes']","bed colorable");await pg.wait_for_timeout(500)
            await pg.locator(".bt-palpc .bt-arte").first.click();await pg.wait_for_timeout(1200)
            q=await pg.evaluate(f"()=>{E}.naTela(8,7)");await pg.mouse.click(q[0],q[1]);await pg.wait_for_timeout(500)
            await pg.keyboard.press("v");await pg.wait_for_timeout(100);await pg.mouse.click(q[0],q[1]);await pg.wait_for_timeout(500)
            chk("cor da arte colorivel",await pg.locator(".bt-sec:has(h3:text-is('Cor da arte')) input[type=color]").count()==1)
            if await pg.locator(".bt-sec:has(h3:text-is('Cor da arte')) input[type=color]").count():
                await pg.locator(".bt-sec:has(h3:text-is('Cor da arte')) input[type=color]").evaluate("i=>{i.value='#2a7fff';i.dispatchEvent(new Event('change',{bubbles:true}))}");await pg.wait_for_timeout(500)
                cc=await pg.evaluate(f"()=>{{const o={E}.mapa.andares[0].objetos.slice(-1)[0];return o.c}}");print("cor",cc);chk("cor gravada",cc and abs(cc[2]-1)<.01)
            await pg.keyboard.press("Escape");await pg.wait_for_timeout(300)
            r=await pg.evaluate(f"()=>{E}.artesPC().reais");print("artes do pc na matriz",r);chk("matriz com parede, caminho e cama",r>=3)
            await pg.evaluate(f"()=>{{const e={E};e.set({{cam:{{x:9,y:9,z:55}}}});e.agora()}}");await pg.wait_for_timeout(400);await pg.screenshot(path="/tmp/a93.png")
            # importar universidade: paredes e caminhos do pacote Slums
            await pg.click(".rail button[data-sec=maps]");await pg.click(".shead button.primary");await pg.wait_for_timeout(200)
            await pg.set_input_files(".bt-lado input[type=file]",U+"1123b0fe-universidade-aster_v7.dungeondraft_map");await pg.wait_for_timeout(6000);await pg.keyboard.press("Escape")
            await pg.wait_for_function("()=>AtlasBatalha.atual()&&AtlasBatalha.atual().mapa.nome.toLowerCase().includes('universidade')",timeout=60000)
            await pg.evaluate(f"()=>{E}.artesPC().espera()");await pg.wait_for_timeout(1500)
            u=await pg.evaluate(f"()=>{{const M={E}.mapa;return M.texturas.filter(t=>/7IhYmL1i|fp1lAaD0/.test(t)).map(t=>t.split('/textures/')[1].split('/')[0])}}");print("univ",u)
            await pg.evaluate(f"()=>{E}.agora()");await pg.screenshot(path="/tmp/a93_univ.png")
            chk("sem erros",not errs);print(errs)
            await b.close()
    finally:srv.terminate()
asyncio.run(main())
print(len(ok),"ok",len(falha),"falhas",falha)
