import asyncio,subprocess,time,json,zipfile
from playwright.async_api import async_playwright
srv=subprocess.Popen(["python3","-m","http.server","8790","--bind","127.0.0.1"],cwd="/home/claude/app",stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL);time.sleep(1)
ok=[];falha=[]
def chk(nome,c):(ok if c else falha).append(nome);print(("OK  " if c else "FALHA ")+nome)
Q="AtlasApp.S.quadro.dados"
async def main():
    try:
        async with async_playwright() as p:
            b=await p.chromium.launch(executable_path="/usr/bin/google-chrome",args=["--no-sandbox"])
            ctx=await b.new_context(viewport={"width":1400,"height":860},accept_downloads=True);pg=await ctx.new_page();errs=[];pg.on("pageerror",lambda e:errs.append(str(e.stack)[:400]))
            await pg.goto("http://127.0.0.1:8790/index.html");await pg.wait_for_timeout(1500)
            await pg.click("#bExp");await pg.click(".mitem >> text=Criar mundo de exemplo");await pg.wait_for_timeout(2500)
            # deixar a guardas oculta e com uma faccao envolvida
            await pg.evaluate("""()=>{const S=AtlasApp.S,f=[...S.notes.values()].find(n=>n.title==='Os guardas da ponte');f.content=f.content.replace('status: aberta','status: oculta\\nenvolvidos: Irmã Ludmila');AtlasApp.Store.save('notes',f)}""")
            await pg.click(".rail button[data-sec=notes]");await pg.click(".vtabs button >> text=Missões");await pg.wait_for_timeout(400)
            await pg.click(".qresumo button >> text=Quadro da campanha");await pg.wait_for_timeout(900)
            chk("abre quadro da campanha",await pg.locator(".qd").count()==1)
            nd=await pg.evaluate(f"()=>{Q}.nodes.map(n=>n.type==='group'?'G:'+n.label:(n.file||'').replace('.md',''))")
            print(nd)
            chk("campanha, 3 missoes e personagem",all(x in nd for x in ["A sombra sobre Sasau","O celeiro queimado","A crônica perdida","Os guardas da ponte","Irmã Ludmila"]))
            chk("grupo do arco","G:Ato I" in nd)
            ed=await pg.evaluate(f"()=>{Q}.edges.map(e=>[e.color,(e.atlas||{{}}).auto])")
            print(ed)
            tipos=[e[1] for e in ed]
            chk("linhas tipadas","campanha" in tipos and "abre" in tipos and "personagem" in tipos and "secundaria" in tipos)
            chk("legenda",await pg.locator(".qd-leg .qd-legl span").count()==7)
            await pg.keyboard.press("f");await pg.wait_for_timeout(300);await pg.screenshot(path="/tmp/c87_quadro.png")
            # posicoes nao mudam ao atualizar; nova missao entra
            p0=await pg.evaluate(f"()=>{Q}.nodes.map(n=>[n.id,n.x,n.y])")
            await pg.evaluate("""()=>{const S=AtlasApp.S;}""")
            # mover um cartao a mao
            await pg.evaluate(f"()=>{{const n={Q}.nodes.find(n=>n.file==='O celeiro queimado.md');n.x+=500;AtlasApp.S.quadro.atualiza()}}")
            await pg.wait_for_timeout(600)
            # nova missao via dados
            await pg.evaluate("""()=>{const S=AtlasApp.S;const all=[...S.notes.values()];const q=all.find(n=>n.title==='A crônica perdida');q.content=q.content.replace('libera: O abade corrupto','libera: O abade corrupto\\nitens: Chave do arquivo');AtlasApp.Store.save('notes',q)}""")
            await pg.evaluate("""()=>{const S=AtlasApp.S;const id='n'+Date.now();S.notes.set(id,{id,title:'O abade corrupto',content:'---\\ntipo: missao\\nstatus: oculta\\npeso: principal\\ncampanha: [[A sombra sobre Sasau]]\\n---\\n',folder:'Missões',updated:new Date().toISOString()});const j='m'+Date.now();S.notes.set(j,{id:j,title:'Chave do arquivo',content:'---\\ntipo: item\\n---\\n',updated:new Date().toISOString()})}""")
            x0=await pg.evaluate(f"()=>{Q}.nodes.find(n=>n.file==='O celeiro queimado.md').x")
            await pg.click(".qd-top button >> text=Atualizar");await pg.wait_for_timeout(700)
            x1=await pg.evaluate(f"()=>{Q}.nodes.find(n=>n.file==='O celeiro queimado.md').x")
            chk("atualizar nao move o que foi arrumado",x0==x1)
            nd=await pg.evaluate(f"()=>{Q}.nodes.map(n=>(n.file||'').replace('.md',''))")
            chk("atualizar traz missao e item novos","O abade corrupto" in nd and "Chave do arquivo" in nd)
            ed=await pg.evaluate(f"()=>{Q}.edges.map(e=>(e.atlas||{{}}).auto)")
            chk("linha de item",ed.count("item")==1)
            n1=len(ed);await pg.click(".qd-top button >> text=Atualizar");await pg.wait_for_timeout(500)
            chk("atualizar de novo nao duplica",len(await pg.evaluate(f"()=>{Q}.edges"))==n1)
            # linha feita a mao sobrevive
            await pg.evaluate(f"()=>{{const D={Q},a=D.nodes.find(n=>n.file==='Irmã Ludmila.md'),b=D.nodes.find(n=>n.file==='Chave do arquivo.md');D.edges.push({{id:'mao',fromNode:a.id,toNode:b.id,label:'guarda'}})}}")
            await pg.click(".qd-top button >> text=Atualizar");await pg.wait_for_timeout(500)
            chk("linha a mao fica",await pg.evaluate(f"()=>{Q}.edges.some(e=>e.id==='mao')"))
            # foco
            idc=await pg.evaluate(f"()=>{Q}.nodes.find(n=>n.file==='A crônica perdida.md').id")
            await pg.evaluate("id=>{}",idc)
            r=await pg.evaluate("id=>{const q=AtlasApp.S.quadro.noNaTela(id);return [q.x,q.y,q.width,q.height]}",idc)
            await pg.keyboard.press("f");await pg.wait_for_timeout(200)
            r=await pg.evaluate("id=>{const q=AtlasApp.S.quadro.noNaTela(id);return [q.x,q.y,q.width,q.height]}",idc)
            await pg.mouse.click(r[0]+r[2]/2,r[1]+12);await pg.wait_for_timeout(200)
            await pg.click(".qd-painel button >> text=Modo foco");await pg.wait_for_timeout(200)
            ap=await pg.locator(".qd-no.qd-apaga").count();tot=await pg.locator(".qd-no").count()
            chk("foco apaga o que nao liga",ap>0 and ap<tot and await pg.locator(".qd-focochip:not([hidden])").count()==1)
            await pg.screenshot(path="/tmp/c87_foco.png")
            await pg.click(".qd-focochip");await pg.wait_for_timeout(200);chk("sair do foco",await pg.locator(".qd-no.qd-apaga").count()==0)
            # cartao so para o mestre
            await pg.evaluate("()=>AtlasApp.S.quadro.cria({type:'text',text:'Segredo do abade',x:-600,y:-300,width:260,height:120})");await pg.wait_for_timeout(300)
            await pg.check(".qd-chk input");await pg.wait_for_timeout(200)
            chk("marca mestre",await pg.locator(".qd-no.qd-seg").count()==1)
            vis_m=await pg.locator(".qd-no").count()
            # visao dos jogadores
            await pg.click("#bPlay");await pg.wait_for_timeout(700)
            vis_j=await pg.locator(".qd-no").count()
            chk("jogadores nao veem oculta nem segredo",vis_j==vis_m-3 and await pg.locator(".qd-txt >> text=Segredo do abade").count()==0)
            await pg.screenshot(path="/tmp/c87_jog.png")
            await pg.click(".vtabs button >> text=Missões");await pg.wait_for_timeout(400)
            chk("missoes ocultas somem na lista dos jogadores",await pg.locator(".qcard2").count()==2 and await pg.locator(".qtodas").count()==0)
            await pg.click("#bPlay");await pg.wait_for_timeout(400)
            # export para jogadores sem segredos
            await pg.click("#bExp");await pg.click(".mitem >> text=Exportar");await pg.wait_for_timeout(200)
            async with pg.expect_download() as d:await pg.locator("#expm .mi").nth(1).click()
            z=zipfile.ZipFile(open(await (await d.value).path(),"rb"));cv=[x for x in z.namelist() if "Sasau" in x and x.endswith(".canvas")]
            C=json.loads(z.read(cv[0]));fs=[n.get("file","") for n in C["nodes"]]+[n.get("text","") for n in C["nodes"]]
            chk("zip dos jogadores sem segredo",not any("Os guardas" in f or "abade" in f.lower() for f in fs) and all(e["fromNode"] in {n["id"] for n in C["nodes"]} for e in C["edges"]))
            # pino no mapa some na visao dos jogadores
            m=await ctx.new_page();await m.set_viewport_size({"width":390,"height":800});m.on("pageerror",lambda e:errs.append(str(e.stack)[:400]))
            await m.goto("http://127.0.0.1:8790/index.html");await m.wait_for_timeout(1500)
            await m.evaluate("()=>{const o=[...AtlasApp.S.notes.values()].find(n=>n.kind==='canvas');AtlasApp.openNote(o.id)}");await m.wait_for_timeout(800);await m.screenshot(path="/tmp/c87_cel.png")
            print("erros:",errs);chk("sem erros",not errs)
            await b.close()
    finally:srv.terminate()
asyncio.run(main())
print(len(ok),"ok",len(falha),"falhas",falha)
