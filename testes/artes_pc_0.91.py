import asyncio,subprocess,time,glob
from playwright.async_api import async_playwright
srv=subprocess.Popen(["python3","-m","http.server","8810","--bind","127.0.0.1"],cwd="/home/claude/app",stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL);time.sleep(1)
ok=[];falha=[]
def chk(nome,c):(ok if c else falha).append(nome);print(("OK  " if c else "FALHA ")+nome,flush=True)
ARGS=["--no-sandbox","--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader","--ignore-gpu-blocklist"]
U="/mnt/user-data/uploads/"
PACS=[U+"15a8484b-PeaPu_Battle_Basics_EA.dungeondraft_pack",U+"PeaPu_Battle_Cyberpunk_Exteriors_01_Streets.dungeondraft_pack",U+"PeaPu_Battle_Cyberpunk_Exteriors_02_Slums.dungeondraft_pack",U+"TCM_Highway_Signage.dungeondraft_pack",U+"7fad675e-PeaPu_Battle_Cyberpunk_Exteriors_04_Marketplace.dungeondraft_pack",U+"a414a8b1-PeaPu_Battle_Cyberpunk_Exteriors_04_Marketplace_1.dungeondraft_pack"]
async def main():
    try:
        async with async_playwright() as p:
            b=await p.chromium.launch(executable_path="/usr/bin/google-chrome",args=ARGS)
            ctx=await b.new_context(viewport={"width":1400,"height":860});pg=await ctx.new_page();errs=[];pg.on("pageerror",lambda e:errs.append(str(e.stack)[:400]))
            pg.on("console",lambda m:print("CON",m.text[:200]) if m.type in("error","warning") and "Failed to load resource" not in m.text else None)
            await pg.goto("http://127.0.0.1:8810/index.html");await pg.wait_for_timeout(1500)
            await pg.click(".rail button[data-sec=maps]");await pg.click(".shead button.primary");await pg.click(".mitem >> text=Mapa de batalha");await pg.wait_for_timeout(2500)
            chk("secao Artes do PC no painel",await pg.locator(".bt-sec:has(h3:text-is('Minhas artes'))").count()==1)
            t=time.time()
            await pg.set_input_files(".bt-wrap input[accept='.dungeondraft_pack']",PACS);await pg.wait_for_function("()=>window.AtlasArtes&&window.AtlasArtes.estado().conectada&&!window.AtlasArtes.estado().lendo",timeout=120000)
            st=await pg.evaluate("()=>window.AtlasArtes.estado()");print(st,"%.1fs"%(time.time()-t))
            chk("pacotes lidos",st["pacotes"]==5 and st["artes"]>2800)
            chk("copia avisada",any("cópia" in x[1] for x in st["problemas"]))
            await pg.wait_for_timeout(500)
            chk("painel mostra a pasta",await pg.locator(".bt-sec:has(h3:text-is('Minhas artes')) >> text=pacotes").count()>=1)
            # objeto: ferramenta O, aba Minhas artes, busca
            await pg.locator(".bt-wrap").click(position={"x":600,"y":400});await pg.keyboard.press("o");await pg.wait_for_timeout(400)
            chk("aba minhas artes",await pg.locator(".bt-fonte button >> text=Minhas artes").count()==1)
            if await pg.locator(".bt-fonte button[aria-selected=true] >> text=Do Atlas").count():await pg.click(".bt-fonte button >> text=Minhas artes")
            await pg.fill(".bt-busca[aria-label='Buscar nas suas artes']","road sign");await pg.wait_for_timeout(500)
            n=await pg.locator(".bt-palpc .bt-arte").count();chk("busca acha placas",n>0);print("resultados",n,await pg.locator(".bt-palpc + .bt-a + .bt-nota, .bt-palpc ~ .bt-nota").first.inner_text())
            await pg.wait_for_timeout(1500)
            chk("miniaturas carregam",await pg.evaluate("()=>{const c=document.querySelector('.bt-palpc .bt-arte canvas');if(!c)return false;const d=c.getContext('2d').getImageData(0,0,c.width,c.height).data;let s=0;for(let i=3;i<d.length;i+=4)s+=d[i];return s>0}"))
            await pg.locator(".bt-palpc .bt-arte").first.click();await pg.wait_for_timeout(1500)
            arte=await pg.evaluate("()=>AtlasBatalha.atual().estado()");
            ed=await pg.evaluate("()=>AtlasBatalha.atual().artesPC().reais")
            chk("arte escolhida carregada na matriz",ed>=1)
            # colocar
            pt=await pg.evaluate("()=>AtlasBatalha.atual().naTela(10,10)")
            await pg.mouse.click(pt[0],pt[1]);await pg.wait_for_timeout(600)
            o=await pg.evaluate("()=>{const M=AtlasBatalha.atual().mapa,A=M.andares[0],o=A.objetos[A.objetos.length-1];return o?[M.texturas[o.t],o.w,o.h]:null}")
            print("objeto",o)
            chk("objeto com arte do PC e tamanho real",o and o[0].startswith("res://packs/") and o[1]>0 and o[2]>0)
            await pg.evaluate("()=>{const e=AtlasBatalha.atual();e.set({cam:{x:10,y:10,z:120}});e.agora()}");await pg.wait_for_timeout(400);await pg.screenshot(path="/tmp/a91_obj.png")
            # cor do pixel no centro do objeto nao e a arte generica: compara com a mesma cena sem a matriz real
            # textura de chao: ferramenta pintar
            await pg.keyboard.press("Escape");await pg.keyboard.press("p");await pg.wait_for_timeout(400)
            mats=pg.locator(".bt-mat").first
            if await mats.count():
                await mats.click();await pg.wait_for_timeout(200)
                tem=await pg.locator(".bt-mats .bt-fonte button >> text=Minhas texturas").count();chk("aba minhas texturas",tem>=1)
                if tem:
                    await pg.locator(".bt-mats .bt-fonte button >> text=Minhas texturas").first.click();await pg.wait_for_timeout(500)
                    await pg.fill(".bt-busca[aria-label='Buscar nos seus pacotes']","asphalt");await pg.wait_for_timeout(400)
                    k=await pg.locator(".bt-mats div:not([hidden])>.bt-mgrv .bt-mo").count();chk("acha asfalto",k>0)
                    if k:
                        await pg.locator(".bt-mats div:not([hidden])>.bt-mgrv .bt-mo").first.click();await pg.wait_for_timeout(2500)
                        tx=await pg.evaluate("()=>AtlasBatalha.atual().mapa.texturas.filter(t=>/patterns|terrain/.test(t))");print(tx)
                        chk("textura de chao do PC no mapa",len(tx)>=1)
                        await pg.evaluate("()=>{const e=AtlasBatalha.atual();e.set({cam:{x:10,y:10,z:30}});e.agora()}");await pg.wait_for_timeout(300);await pg.screenshot(path="/tmp/a91_chao.png")
            else:chk("seletor de textura",False)
            chk("sem erros na edicao",not errs);print(errs)
            # importar um mapa do Dungeondraft que usa o pacote Slums
            await pg.click(".rail button[data-sec=maps]");await pg.click(".shead button.primary");await pg.wait_for_timeout(200)
            await pg.set_input_files(".bt-lado input[type=file]",U+"1123b0fe-universidade-aster_v7.dungeondraft_map");await pg.wait_for_timeout(6000)
            await pg.keyboard.press("Escape")
            await pg.wait_for_function("()=>AtlasBatalha.atual()&&AtlasBatalha.atual().mapa.nome.toLowerCase().includes('universidade')",timeout=60000)
            await pg.evaluate("()=>AtlasBatalha.atual().artesPC().espera()");await pg.wait_for_timeout(2000)
            r=await pg.evaluate("()=>{const e=AtlasBatalha.atual(),M=e.mapa;const slum=M.texturas.filter(t=>t.includes('7IhYmL1i'));return [slum.length,e.artesPC().reais,e.render.lado()]}")
            print("universidade",r);chk("mapa importado usa as artes do pacote",r[0]>0 and r[1]>0)
            await pg.evaluate("()=>AtlasBatalha.atual().agora()");await pg.screenshot(path="/tmp/a91_univ.png")
            # recarregar: a pasta escolhida por arquivos vale so na sessao; o mapa abre com as artes do Atlas sem erro
            await pg.reload();await pg.wait_for_timeout(2500)
            chk("depois de recarregar abre sem erros",not errs)
            print("erros:",errs)
            await b.close()
    finally:srv.terminate()
asyncio.run(main())
print(len(ok),"ok",len(falha),"falhas",falha)
