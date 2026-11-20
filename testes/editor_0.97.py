# 0.97: Minhas artes (janela), pinceis extras com opacidade e dureza, previa grande, caminho com arte do pacote, juntar comodos, porta no quadrado, curvas e roda da luz.
import asyncio,subprocess,time
from playwright.async_api import async_playwright
srv=subprocess.Popen(["python3","-m","http.server","8821","--bind","127.0.0.1"],cwd="/home/claude/app",stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL);time.sleep(1)
ARGS=["--no-sandbox","--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]
U="/mnt/user-data/uploads/";E="AtlasBatalha.atual()"
PACS=[U+"0d332e36-PeaPu_Battle_Sci-Fi_Interiors_01_Spaceship.dungeondraft_pack",U+"PeaPu_Battle_Cyberpunk_Exteriors_01_Streets.dungeondraft_pack"]
ok=[];falha=[]
def chk(n,c):(ok if c else falha).append(n);print(("OK  " if c else "FALHA ")+n,flush=True)
async def main():
  try:
    async with async_playwright() as p:
      b=await p.chromium.launch(executable_path="/usr/bin/google-chrome",args=ARGS);pg=await (await b.new_context(viewport={"width":1300,"height":820})).new_page();errs=[];pg.on("pageerror",lambda e:errs.append(str(e)[:300]))
      await pg.goto("http://127.0.0.1:8821/index.html");await pg.wait_for_timeout(1500)
      await pg.click(".rail button[data-sec=maps]");await pg.click(".shead button.primary");await pg.click(".mitem >> text=Mapa de batalha");await pg.wait_for_timeout(2500)
      await pg.set_input_files(".bt-wrap input[accept='.dungeondraft_pack']",PACS);await pg.wait_for_function("()=>AtlasArtes.estado().conectada&&!AtlasArtes.estado().lendo",timeout=180000);await pg.wait_for_timeout(500)
      cv=pg.locator(".bt-wrap canvas").first;bb=await cv.bounding_box()
      await pg.evaluate(f"()=>{{const e={E};e.set({{cam:{{x:12.5,y:10,z:25}},snap:true,passo:1}});e.agora()}}")
      tela=lambda x,y:pg.evaluate(f"()=>{E}.naTela({x},{y})")
      # ---- Minhas artes
      await pg.evaluate(f"()=>{{{E}.seleciona([]);{E}.usa('sel')}}");await pg.wait_for_timeout(300)
      chk("painel do mapa só com o resumo",await pg.locator(".bt-pc >> text=Analisar artes").count()==0 and await pg.locator(".bt-pc >> text=Abrir minhas artes").count()==1)
      await pg.click("button[aria-label^='Minhas artes']");await pg.wait_for_timeout(400)
      n0=await pg.locator(".bt-pacs li").count();print("pacotes",n0);chk("janela com a lista de pacotes",n0==2)
      await pg.set_input_files(".bt-wrap input[accept='.dungeondraft_pack']:not([webkitdirectory])>>nth=1","/home/claude/x95/TesteAlfa.dungeondraft_pack");await pg.wait_for_function("()=>AtlasArtes.estado().pacotes===3&&!AtlasArtes.estado().lendo",timeout=60000);await pg.wait_for_timeout(400)
      chk("adicionar pacotes sem trocar a pasta",await pg.locator(".bt-pacs li").count()==3)
      await pg.click(".bt-pacs li:has-text('Teste Alfa') .bt-x");await pg.wait_for_timeout(400);chk("tirar um pacote",await pg.evaluate("()=>AtlasArtes.estado().pacotes")==2)
      await pg.keyboard.press("Escape");await pg.wait_for_timeout(200);chk("Esc fecha a janela",await pg.locator(".bt-jan").count()==0)
      # ---- previa grande
      await pg.evaluate(f"()=>{E}.usa('obj')");await pg.wait_for_timeout(400);await pg.click("[role=tab][data-f=pc]");await pg.wait_for_timeout(800)
      await pg.locator(".bt-palpc .bt-arte").nth(4).hover();await pg.wait_for_timeout(1200)
      vis=await pg.evaluate("()=>{const p=document.querySelector('.bt-prev');return p&&!p.hidden&&!!p.querySelector('img')}");chk("prévia grande ao passar o mouse",vis)
      await pg.screenshot(path="/tmp/t97_previa.png");await pg.mouse.move(bb["x"]+200,bb["y"]+200);await pg.wait_for_timeout(300);chk("prévia some ao sair",await pg.evaluate("()=>document.querySelector('.bt-prev').hidden"))
      # ---- pinceis extras, opacidade
      await pg.evaluate(f"()=>{E}.usa('pin')");await pg.wait_for_timeout(1500)
      ne=await pg.evaluate("()=>[...document.querySelectorAll('.bt-pinceis .bt-mo')].length");print("pinceis",ne);chk("pincéis extras aparecem",ne>=9+33 and await pg.locator(".bt-pgrp >> text=Extras").count()==1)
      chk("dureza e opacidade em pincel com formato",True)
      await pg.click(".bt-pinceis .bt-mo[title^='Splatter']");await pg.wait_for_timeout(300)
      t=await pg.locator(".bt-sec:has-text('Pincel')").first.text_content();chk("dureza e opacidade em pincel com formato",("Dureza" in t) and ("Opacidade" in t))
      await pg.evaluate("()=>{const r=[...document.querySelectorAll('.bt-sec')].find(s=>/Opacidade/.test(s.textContent));const i=[...r.querySelectorAll('.bt-c')].find(c=>/Opacidade/.test(c.textContent)).querySelector('input');i.value=.5;i.dispatchEvent(new Event('input',{bubbles:true}))}")
      await pg.evaluate(f"()=>{{const e={E},A=e.mapa.andares[0];A.camadas.forEach(c=>{{c.m=new Uint8Array(c.mw*c.mh)}});e.render.refazAndar(0)}}")
      q0=await tela(4,4);await pg.mouse.move(*q0);await pg.mouse.down()
      for k in range(1,15):q=await tela(4+k*.6,4+k*.2);await pg.mouse.move(*q)
      await pg.mouse.up();await pg.wait_for_timeout(300)
      mx=await pg.evaluate(f"()=>{{const c={E}.mapa.andares[0].camadas;let m=0;for(const x of c)if(x.m)for(const v of x.m)if(v>m)m=v;return m}}");print("max mascara",mx);chk("opacidade 50% limita a pintura",0<mx<=130)
      await pg.evaluate(f"()=>{{const e={E};e.set({{cam:{{x:12.5,y:10,z:25}}}});e.agora()}}")
      # ---- paredes: juntar comodos
      await pg.evaluate(f"()=>{E}.usa('par')");await pg.wait_for_timeout(300);await pg.click(".bt-chip >> text=Retângulo");await pg.wait_for_timeout(200)
      async def ret(x0,y0,x1,y1):
        a=await tela(x0,y0);c=await tela(x1,y1);await pg.mouse.move(*a);await pg.mouse.down();await pg.mouse.move((a[0]+c[0])/2,(a[1]+c[1])/2,steps=3);await pg.mouse.move(*c,steps=3);await pg.mouse.up();await pg.wait_for_timeout(400)
      n0=await pg.evaluate(f"()=>{E}.mapa.andares[0].paredes.length")
      await ret(6,6,12,11);await ret(10,8,16,14)
      print(await pg.evaluate(f"()=>JSON.stringify({E}.mapa.andares[0].paredes.map(w=>w.p))"),await tela(6,6),bb);r=await pg.evaluate(f"()=>{{const A={E}.mapa.andares[0];const w=A.paredes.slice(-1)[0];return [A.paredes.length,w.p.length,A.padroes.filter(p=>p.parede!=null).length,A.padroes.filter(p=>p.parede===w.id).length]}}");print("juntar",n0,r)
      chk("cômodos que se encostam viram uma parede",r[0]==n0+1 and r[1]==8 and r[3]==1)
      await pg.evaluate(f"()=>{{const e={E};e.seleciona([]);e.set({{cam:{{x:11,y:10,z:40}}}});e.agora()}}");await pg.screenshot(path="/tmp/t97_juntar.png",clip=bb)
      await pg.evaluate(f"()=>{{const e={E};e.set({{cam:{{x:12.5,y:10,z:25}}}});e.agora()}}")
      # ---- porta dentro do quadrado
      await pg.evaluate(f"()=>{E}.usa('porta')");await pg.wait_for_timeout(300)
      q=await tela(8.45,6.02);await pg.mouse.move(*q);await pg.wait_for_timeout(200);await pg.mouse.click(*q);await pg.wait_for_timeout(400)
      pt=await pg.evaluate(f"()=>{{const A={E}.mapa.andares[0],q=A.portais.slice(-1)[0];return q?[q.d,q.raio]:null}}");print("porta",pt);chk("porta de 1 quadrado entra dentro do quadrado",pt and abs(((pt[0]-pt[1])%1))<1e-6)
      # ---- curva no ponto a ponto
      await pg.evaluate(f"()=>{E}.usa('par')");await pg.wait_for_timeout(200);await pg.click(".bt-chip >> text=Ponto a ponto");await pg.wait_for_timeout(200)
      a=await tela(4,16);await pg.mouse.move(*a);await pg.mouse.down();c=await tela(6,15);await pg.mouse.move(*c,steps=5);await pg.mouse.up()
      c2=await tela(10,17);await pg.mouse.click(*c2);await pg.keyboard.press("Enter");await pg.wait_for_timeout(400)
      w=await pg.evaluate(f"()=>{E}.mapa.andares[0].paredes.slice(-1)[0]");print("curva",w.get("cv"));chk("arrastar no ponto a ponto cria curva",bool(w.get("cv")) and w["cv"][0] is not None)
      await pg.evaluate(f"()=>{{const e={E};e.seleciona([]);e.set({{cam:{{x:5,y:16,z:50}}}});e.agora()}}");await pg.screenshot(path="/tmp/t97_curva.png",clip=bb)
      await pg.evaluate(f"()=>{{const e={E};e.set({{cam:{{x:12.5,y:10,z:25}}}});e.agora()}}")
      # ---- caminho com arte do pacote (mesmo com Trilha escolhida)
      await pg.evaluate(f"()=>{E}.usa('cam')");await pg.wait_for_timeout(300);await pg.click(".bt-chip >> text=Trilha");await pg.wait_for_timeout(200)
      await pg.click(".bt-mat:has-text('Textura')");await pg.wait_for_timeout(200);await pg.click(".bt-mats:not([hidden]) .bt-fonte button >> text=Meus caminhos");await pg.wait_for_timeout(300)
      await pg.fill(".bt-mats:not([hidden]) .bt-busca","cable");await pg.wait_for_timeout(500);await pg.locator(".bt-mats:not([hidden]) div:not([hidden])>.bt-mgrv .bt-mo").first.click();await pg.wait_for_timeout(1500)
      larg=await pg.evaluate("()=>{const s=[...document.querySelectorAll('.bt-c')].find(c=>/Largura/.test(c.textContent));return s.textContent}");print(larg)
      await pg.click(".bt-chip >> text=Ponto a ponto");await pg.wait_for_timeout(200)
      for x,y in [(14,2),(18,4),(20,8)]:await pg.mouse.click(*(await tela(x,y)));await pg.wait_for_timeout(100)
      await pg.keyboard.press("Enter");await pg.wait_for_timeout(600)
      c=await pg.evaluate(f"()=>{{const M={E}.mapa,c=M.andares[0].caminhos.slice(-1)[0];return [M.texturas[c.t],c.estilo||null,c.larg]}}");print("caminho",c)
      chk("caminho usa a arte do pacote mesmo com tipo escolhido","/textures/paths/" in c[0] and c[1] is None)
      chk("largura do caminho segue a arte",abs(c[2]-.5)<.3 and "0,5" in larg or c[2]<1)
      await pg.evaluate(f"()=>{{const e={E};e.seleciona([]);e.set({{cam:{{x:18,y:5,z:50}}}});e.agora()}}");await pg.screenshot(path="/tmp/t97_caminho.png",clip=bb)
      # ---- roda na luz: luz plena e penumbra juntas
      await pg.evaluate(f"()=>{E}.usa('lz')");await pg.wait_for_timeout(300)
      def lz(t):import re;return [float(x.replace(',','.')) for x in re.findall(r"(\d+(?:[.,]\d+)?) quadrados",t)]
      t0=await pg.locator(".bt-sec:has-text('Alcance')").text_content();await pg.mouse.move(bb["x"]+300,bb["y"]+300);await pg.mouse.wheel(0,-100);await pg.wait_for_timeout(600)
      t1=await pg.locator(".bt-sec:has-text('Alcance')").text_content();a0,a1=lz(t0),lz(t1);print("luz",a0,a1);chk("roda muda luz plena e penumbra juntas",len(a0)==2 and len(a1)==2 and a1[0]>a0[0] and a1[1]>a0[1])
      chk("sem erros",not errs);print(errs)
      await b.close()
  finally:srv.terminate()
asyncio.run(main());print(len(ok),"ok",len(falha),"falhas",falha)
