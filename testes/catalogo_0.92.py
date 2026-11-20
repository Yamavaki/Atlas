import asyncio,subprocess,time,json,gzip
from playwright.async_api import async_playwright
srv=subprocess.Popen(["python3","-m","http.server","8811","--bind","127.0.0.1"],cwd="/home/claude/app",stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL);time.sleep(1)
ok=[];falha=[]
def chk(nome,c):(ok if c else falha).append(nome);print(("OK  " if c else "FALHA ")+nome,flush=True)
ARGS=["--no-sandbox","--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader","--ignore-gpu-blocklist"]
U="/mnt/user-data/uploads/"
PACS=[U+"15a8484b-PeaPu_Battle_Basics_EA.dungeondraft_pack",U+"PeaPu_Battle_Cyberpunk_Exteriors_01_Streets.dungeondraft_pack",U+"PeaPu_Battle_Cyberpunk_Exteriors_02_Slums.dungeondraft_pack",U+"PeaPu_Battle_Cyberpunk_Exteriors_03_Rave.dungeondraft_pack",U+"TCM_Highway_Signage.dungeondraft_pack",U+"7fad675e-PeaPu_Battle_Cyberpunk_Exteriors_04_Marketplace.dungeondraft_pack",U+"0d332e36-PeaPu_Battle_Sci-Fi_Interiors_01_Spaceship.dungeondraft_pack"]
async def main():
    try:
        async with async_playwright() as p:
            b=await p.chromium.launch(executable_path="/usr/bin/google-chrome",args=ARGS)
            ctx=await b.new_context(viewport={"width":1400,"height":860},accept_downloads=True);pg=await ctx.new_page();errs=[];pg.on("pageerror",lambda e:errs.append(str(e.stack)[:400]))
            await pg.goto("http://127.0.0.1:8811/index.html");await pg.wait_for_timeout(1500)
            await pg.click(".rail button[data-sec=maps]");await pg.click(".shead button.primary");await pg.click(".mitem >> text=Mapa de batalha");await pg.wait_for_timeout(2500)
            await pg.set_input_files(".bt-wrap input[accept='.dungeondraft_pack']",PACS);await pg.wait_for_function("()=>window.AtlasArtes&&window.AtlasArtes.estado().conectada&&!window.AtlasArtes.estado().lendo",timeout=120000)
            await pg.wait_for_timeout(800);st=await pg.evaluate("()=>window.AtlasArtes.estado()");print(st["pacotes"],st["artes"])
            await pg.click("button[aria-label^='Minhas artes']");await pg.wait_for_timeout(400)
            chk("botao analisar",await pg.locator(".bt-catal button >> text=Analisar artes").count()==1)
            t=time.time();await pg.click(".bt-catal button >> text=Analisar artes")
            await pg.wait_for_function("()=>document.querySelector('.bt-catal')&&/Catálogo pronto/.test(document.querySelector('.bt-catal').innerText)",timeout=900000)
            dt=time.time()-t;print("analise %.1fs para %d artes = %.2f ms/arte"%(dt,st["artes"],dt*1000/st["artes"]))
            chk("analise termina",True)
            s=await pg.evaluate("()=>AtlasCatalogo.situacao()");print(s);chk("tudo analisado",s["analisadas"]==s["artes"])
            # fichas conferidas
            f=await pg.evaluate("()=>AtlasCatalogo.fichaDe('res://packs/PieHCLp9/textures/objects/TCM Highway Signage/TCM_Broken Road Sign 01_1x2.webp')");print("ficha placa",f)
            chk("ficha com medidas da imagem",f and f[0]==160 and f[1]==320 and len(f)==11)
            # arquivo IA
            await pg.click(".bt-catal button >> text=Catálogo para IA");await pg.wait_for_timeout(200)
            for lim,nome in [("120000","120k"),("30000","30k"),("","semlimite")]:
                await pg.select_option(".bt-catopc select",lim)
                async with pg.expect_download() as d:await pg.click(".bt-catopc button >> text=Baixar")
                path=await (await d.value).path();txt=open(path,encoding="utf8").read();open(f"/tmp/catalogo_{nome}.md","w").write(txt)
                print(nome,len(txt),"letras ~",round(len(txt)/3.6/1000),"mil tokens |",txt.splitlines()[1][:200])
                if lim:chk(f"cabe em {nome}",len(txt)/3.6<=int(lim)*1.02)
            # completo
            async with pg.expect_download() as d:await pg.click(".bt-catal button >> text=Catálogo completo")
            path=await (await d.value).path();raw=open(path,"rb").read();J=json.loads(gzip.decompress(raw));n=sum(len(P["artes"]) for P in J["pacotes"])
            print("completo",len(raw)/1048576,"MB gz,",len(gzip.decompress(raw))/1048576,"MB bruto,",n,"artes");chk("completo com todas as artes",n==s["artes"])
            json.dump(J,open("/tmp/catalogo_completo.json","w"))
            # filtros da busca
            await pg.keyboard.press("Escape");await pg.wait_for_timeout(200)
            await pg.locator(".bt-wrap").click(position={"x":600,"y":400});await pg.keyboard.press("o");await pg.wait_for_timeout(400)
            if await pg.locator(".bt-fonte button[aria-selected=false] >> text=Minhas artes").count():await pg.click(".bt-fonte button >> text=Minhas artes")
            await pg.wait_for_timeout(300);n0=await pg.evaluate("()=>document.querySelector('.bt-palpc~.bt-nota').innerText");print("todas:",n0)
            await pg.select_option("select[aria-label='Tamanho']","g");await pg.wait_for_timeout(600);ng=await pg.evaluate("()=>document.querySelector('.bt-palpc~.bt-nota').innerText");print("grandes:",ng)
            nomes=await pg.locator(".bt-palpc .bt-arte").evaluate_all("bs=>bs.slice(0,5).map(b=>b.title)");print(nomes)
            chk("filtro de tamanho reduz",ng!=n0)
            await pg.select_option("select[aria-label='Tamanho']","");await pg.select_option("select[aria-label='Pacote']","PieHCLp9");await pg.wait_for_timeout(300)
            opts=await pg.locator("select[aria-label='Etiqueta'] option").all_inner_texts();print(opts[:4]);chk("etiquetas do pacote",len(opts)>=2)
            await pg.locator(".bt-palpc .bt-arte").nth(2).click(button="right");await pg.wait_for_timeout(200);await pg.locator(".bt-palpc .bt-arte").nth(4).click();await pg.wait_for_timeout(800)
            await pg.click(".bt-chips2 button >> text=Favoritas");await pg.wait_for_timeout(300);chk("favoritas",await pg.locator(".bt-palpc .bt-arte").count()==1)
            await pg.click(".bt-chips2 button >> text=Recentes");await pg.wait_for_timeout(300);chk("recentes",await pg.locator(".bt-palpc .bt-arte").count()==1)
            await pg.screenshot(path="/tmp/a92_busca.png")
            # retoma: analisar de novo nao refaz
            await pg.reload();await pg.wait_for_timeout(2500)
            chk("sem erros",not errs);print(errs)
            await b.close()
    finally:srv.terminate()
asyncio.run(main())
print(len(ok),"ok",len(falha),"falhas",falha)
