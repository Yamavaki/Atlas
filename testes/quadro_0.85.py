import asyncio,subprocess,time,json,zipfile,io
from playwright.async_api import async_playwright
srv=subprocess.Popen(["python3","-m","http.server","8785","--bind","127.0.0.1"],cwd="/home/claude/app",stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL);time.sleep(1)
ok=[];falha=[]
def chk(nome,c):(ok if c else falha).append(nome);print(("OK  " if c else "FALHA ")+nome)
async def main():
    try:
        async with async_playwright() as p:
            b=await p.chromium.launch(executable_path="/usr/bin/google-chrome",args=["--no-sandbox"])
            ctx=await b.new_context(viewport={"width":1400,"height":860},accept_downloads=True);pg=await ctx.new_page();errs=[];pg.on("pageerror",lambda e:errs.append(str(e.stack)[:400]))
            await pg.goto("http://127.0.0.1:8785/index.html");await pg.wait_for_timeout(1500)
            await pg.click("#bExp");await pg.click(".mitem >> text=Criar mundo de exemplo");await pg.wait_for_timeout(2500)
            await pg.click(".rail button[data-sec=notes]");await pg.wait_for_timeout(300)
            await pg.click(".shead button.primary");await pg.click(".mitem >> text=Quadro");await pg.wait_for_timeout(800)
            chk("quadro abre",await pg.locator(".qd").count()==1)
            chk("quadro na lista",await pg.locator(".item .it >> text=Quadro").count()>=1)
            # duplo clique cria texto
            await pg.mouse.dblclick(500,400);await pg.wait_for_timeout(200);await pg.keyboard.type("Ideia do vilão");await pg.keyboard.press("Control+Enter");await pg.wait_for_timeout(300)
            chk("texto criado",await pg.locator(".qd-text .qd-txt >> text=Ideia do vilão").count()==1)
            # adicionar nota pelo menu
            await pg.click(".qd-b >> text=Nota");await pg.wait_for_timeout(200);await pg.fill("#qd-menu input","crônica");await pg.wait_for_timeout(100);await pg.click("#qd-menu .mitem >> nth=0");await pg.wait_for_timeout(400)
            chk("cartao de nota",await pg.locator(".qd-nota").count()==1)
            # mais uma nota
            await pg.click(".qd-b >> text=Nota");await pg.wait_for_timeout(200);await pg.click("#qd-menu .mitem >> nth=0");await pg.wait_for_timeout(400)
            nn=await pg.locator(".qd-nota").count();chk("duas notas",nn==2)
            # mover a segunda nota para longe
            st=await pg.evaluate("()=>{const d=AtlasApp.S.quadro.dados;return d.nodes.map(n=>[n.id,n.type,n.x,n.y])}")
            nota2=[n for n in st if n[1]=="file"][-1][0]
            r=await pg.evaluate("id=>{const q=AtlasApp.S.quadro.noNaTela(id);return [q.x,q.y,q.width,q.height]}",nota2)
            await pg.mouse.move(r[0]+60,r[1]+20);await pg.mouse.down();await pg.mouse.move(r[0]+360,r[1]+260,steps=8);await pg.mouse.up();await pg.wait_for_timeout(200)
            st2=await pg.evaluate("id=>{const n=AtlasApp.S.quadro.dados.nodes.find(n=>n.id===id);return [n.x,n.y]}",nota2)
            chk("mover cartao",abs(st2[0]-[n for n in st if n[0]==nota2][0][2])>100)
            await pg.keyboard.press("f");await pg.wait_for_timeout(200)
            # ligar: da bolinha direita da 1a nota ate a 2a
            nota1=[n for n in st if n[1]=="file"][0][0]
            r1=await pg.evaluate("id=>{const q=AtlasApp.S.quadro.noNaTela(id);return [q.x,q.y,q.width,q.height]}",nota1)
            r2=await pg.evaluate("id=>{const q=AtlasApp.S.quadro.noNaTela(id);return [q.x,q.y,q.width,q.height]}",nota2)
            await pg.mouse.move(r1[0]+r1[2]/2,r1[1]+r1[3]/2);await pg.wait_for_timeout(150)
            await pg.mouse.move(r1[0]+r1[2]+1,r1[1]+r1[3]/2);await pg.mouse.down();await pg.mouse.move(r2[0]+r2[2]/2,r2[1]+r2[3]/2,steps=10);await pg.mouse.up();await pg.wait_for_timeout(300)
            ne=await pg.evaluate("()=>AtlasApp.S.quadro.dados.edges.length");chk("linha criada",ne==1)
            # selecionar a linha e mudar cor, rotulo, ligar notas
            await pg.evaluate("()=>{}")
            g=await pg.evaluate("()=>{const p=document.querySelector('.qd-l path:not(.qd-lhit)');const L=p.getTotalLength(),q=p.getPointAtLength(L/2),m=p.getScreenCTM();return [q.x*m.a+m.e,q.y*m.d+m.f]}")
            await pg.mouse.click(g[0],g[1]);await pg.wait_for_timeout(200)
            chk("painel da linha",await pg.locator(".qd-painel .qd-pt-t >> text=Linha").count()==1)
            await pg.click(".qd-painel .qd-cor[aria-label=Carmim]");await pg.fill(".qd-painel input[type=text]","deve dinheiro a");await pg.keyboard.press("Tab");await pg.wait_for_timeout(200)
            e=await pg.evaluate("()=>AtlasApp.S.quadro.dados.edges[0]");chk("cor e rotulo",e.get("color")=="1" and e.get("label")=="deve dinheiro a")
            await pg.click(".qd-painel .qd-seg button >> text=Tracejada");await pg.wait_for_timeout(100)
            await pg.screenshot(path="/tmp/q85_linha.png")
            await pg.click(".qd-painel button >> text=Ligar as notas");await pg.wait_for_timeout(300)
            t=await pg.evaluate("()=>{const e=AtlasApp.S.quadro.dados.edges[0],D=AtlasApp.S.quadro.dados,A=D.nodes.find(n=>n.id===e.fromNode),B=D.nodes.find(n=>n.id===e.toNode),ta=A.file.replace(/\\.md$/,''),tb=B.file.replace(/\\.md$/,'');const n=[...AtlasApp.S.notes.values()].find(x=>x.title===ta);return [n.content.includes('## Ligações'),n.content.includes('[['+tb+']]')]}")
            chk("ligar as notas escreve o link",t[0] and t[1])
            # desfazer / refazer
            await pg.click(".qd");await pg.keyboard.press("Escape")
            await pg.keyboard.press("Control+z");await pg.wait_for_timeout(150)
            e=await pg.evaluate("()=>AtlasApp.S.quadro.dados.edges[0].atlas||{}");chk("desfazer",e.get("estilo") is None)
            await pg.keyboard.press("Control+y");await pg.wait_for_timeout(150)
            e=await pg.evaluate("()=>AtlasApp.S.quadro.dados.edges[0].atlas||{}");chk("refazer",e.get("estilo")=="tracejada")
            # adesivo, grupo, link, mapa
            await pg.click(".qd-b >> text=Adesivo");await pg.wait_for_timeout(150);await pg.keyboard.type("Sessão 3: emboscada");await pg.keyboard.press("Control+Enter")
            await pg.click(".qd-b >> text=Mapa");await pg.wait_for_timeout(200);await pg.click("#qd-menu .mitem >> nth=0");await pg.wait_for_timeout(300)
            chk("cartao de mapa",await pg.locator(".qd-mapa").count()==1)
            # selecionar tudo e agrupar
            await pg.keyboard.press("Control+a");await pg.wait_for_timeout(100);await pg.click(".qd-painel button >> text=Agrupar");await pg.wait_for_timeout(200)
            chk("grupo",await pg.locator(".qd-group").count()==1)
            # imagem via input
            import base64
            png=base64.b64decode("iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAAFklEQVR4nGP8z8Dwn4GBgYGJAQoAACtcAQGkpXcnAAAAAElFTkSuQmCC")
            from PIL import Image;Image.new("RGB",(3000,1500),(120,60,30)).save("/tmp/q.png");chk("png de teste",True)
            await pg.set_input_files(".qd-area input[type=file]","/tmp/q.png");await pg.wait_for_timeout(800)
            chk("imagem",await pg.locator(".qd-imagem img[src^=blob]").count()==1);wh=await pg.evaluate("()=>{const n=AtlasApp.S.quadro.dados.nodes.find(n=>n.atlas&&n.atlas.img);return [n.width,n.height]}");chk("imagem proporcional",abs(wh[0]/wh[1]-2)<.02)
            nat=await pg.evaluate("()=>document.querySelector('.qd-imagem img').naturalWidth");chk("imagem reduzida a 2048",nat==2048)
            # zoom e enquadrar
            await pg.mouse.move(700,450);await pg.mouse.wheel(0,-300);await pg.wait_for_timeout(100);z=await pg.evaluate("()=>AtlasApp.S.quadro.cam().z")
            await pg.keyboard.press("f");await pg.wait_for_timeout(100);chk("zoom roda",z!=1)
            await pg.screenshot(path="/tmp/q85_quadro.png")
            # salvo: reabrir
            await pg.wait_for_timeout(600)
            await pg.click(".item .it >> text=A crônica perdida");await pg.wait_for_timeout(400)
            await pg.click(".item .it >> text=Quadro");await pg.wait_for_timeout(600)
            cnt=await pg.evaluate("()=>[AtlasApp.S.quadro.dados.nodes.length,AtlasApp.S.quadro.dados.edges.length]");chk("reabrir guarda tudo",cnt[0]>=7 and cnt[1]==1)
            await pg.reload();await pg.wait_for_timeout(1500)
            await pg.click(".rail button[data-sec=notes]");await pg.wait_for_timeout(300);await pg.click(".item .it >> text=Quadro");await pg.wait_for_timeout(800)
            cnt2=await pg.evaluate("()=>[AtlasApp.S.quadro.dados.nodes.length,AtlasApp.S.quadro.dados.edges.length]");chk("depois de recarregar",cnt2==cnt)
            chk("imagem depois de recarregar",await pg.locator(".qd-imagem img[src^=blob]").count()==1)
            # .canvas
            async with pg.expect_download() as d:await pg.click(".qd-top button >> text=.canvas")
            dl=await d.value;C=json.loads(open(await dl.path()).read())
            chk("canvas valido",all(k in n for n in C["nodes"] for k in ("id","type","x","y","width","height")) and all(e["fromNode"] and e["toNode"] for e in C["edges"]))
            # exportar vault com .canvas e imagem
            await pg.click("#bExp");await pg.click(".mitem >> text=Exportar");await pg.wait_for_timeout(200)
            await pg.screenshot(path="/tmp/q85_exp.png")
            bts=await pg.locator("#expm .mi").all_inner_texts();print(bts)
            async with pg.expect_download() as d:await pg.locator("#expm .mi").first.click()
            dl=await d.value;z=zipfile.ZipFile(open(await dl.path(),"rb"));nm=z.namelist()
            chk("zip tem .canvas",any(x.endswith(".canvas") for x in nm));chk("zip tem imagem",any(x.startswith("imagens/") for x in nm))
            cv=json.loads(z.read([x for x in nm if x.endswith(".canvas")][0]))
            fl=[n["file"] for n in cv["nodes"] if n["type"]=="file" and n["file"].endswith(".md")];chk("caminho da nota no zip",all(f in nm for f in fl))
            # importar .canvas
            open("/tmp/Importado.canvas","w").write(json.dumps({"nodes":[{"id":"a","type":"text","text":"Olá do Obsidian","x":0,"y":0,"width":250,"height":60,"color":"4"},{"id":"b","type":"text","text":"Outro","x":400,"y":0,"width":250,"height":60}],"edges":[{"id":"e","fromNode":"a","toNode":"b","fromSide":"right","toSide":"left"}]}))
            await pg.set_input_files("#imp","/tmp/Importado.canvas");await pg.wait_for_timeout(800)
            await pg.click(".item .it >> text=Importado");await pg.wait_for_timeout(600)
            chk("importar .canvas",await pg.locator(".qd-txt >> text=Olá do Obsidian").count()==1 and await pg.evaluate("()=>AtlasApp.S.quadro.dados.edges.length")==1)
            # grafo nao mostra quadros
            await pg.click(".vtabs button >> text=Grafo");await pg.wait_for_timeout(600);gt=await pg.evaluate("()=>document.querySelector('#main').innerText")
            chk("grafo sem quadros","Importado" not in gt)
            # celular
            m=await ctx.new_page();await m.set_viewport_size({"width":390,"height":800});m.on("pageerror",lambda e:errs.append(str(e.stack)[:400]))
            await m.goto("http://127.0.0.1:8785/index.html");await m.wait_for_timeout(1500)
            await m.evaluate("()=>{const o=[...AtlasApp.S.notes.values()].find(n=>n.kind==='canvas');AtlasApp.openNote(o.id)}")
            await m.wait_for_timeout(800);await m.screenshot(path="/tmp/q85_cel.png")
            print("erros:",errs);chk("sem erros",not errs)
            await b.close()
    finally:srv.terminate()
asyncio.run(main())
print(len(ok),"ok",len(falha),"falhas",falha)
