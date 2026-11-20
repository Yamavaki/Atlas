# 0.96: ambiente, sombras do mapa, formas de luz, pinceis com formato, roda do mouse e listas completas. Uso: python3 testes/editor_0.96.py
import asyncio,subprocess,time,glob,os
from playwright.async_api import async_playwright
srv=subprocess.Popen(["python3","-m","http.server","8818","--bind","127.0.0.1"],cwd="/home/claude/app",stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL);time.sleep(1)
ARGS=["--no-sandbox","--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]
U="/mnt/user-data/uploads/";E="AtlasBatalha.atual()"
PACS=[U+"0d332e36-PeaPu_Battle_Sci-Fi_Interiors_01_Spaceship.dungeondraft_pack",U+"PeaPu_Battle_Cyberpunk_Exteriors_01_Streets.dungeondraft_pack"]
MAPA="/home/claude/x95/teste095.dungeondraft_map";ZIP=U+"e2cdd22d-brushes.zip"
ok=[];falha=[]
def chk(n,c):(ok if c else falha).append(n);print(("OK  " if c else "FALHA ")+n,flush=True)
async def main():
  try:
    async with async_playwright() as p:
      b=await p.chromium.launch(executable_path="/usr/bin/google-chrome",args=ARGS);pg=await (await b.new_context(viewport={"width":1300,"height":820})).new_page();errs=[];pg.on("pageerror",lambda e:errs.append(str(e)[:300]))
      await pg.goto("http://127.0.0.1:8818/index.html");await pg.wait_for_timeout(1500)
      await pg.click(".rail button[data-sec=maps]");await pg.click(".shead button.primary");await pg.click(".mitem >> text=Mapa de batalha");await pg.wait_for_timeout(2500)
      await pg.set_input_files(".bt-wrap input[accept='.dungeondraft_pack']",PACS);await pg.wait_for_function("()=>AtlasArtes.estado().conectada&&!AtlasArtes.estado().lendo",timeout=180000)
      await pg.click(".rail button[data-sec=maps]");await pg.click(".shead button.primary");await pg.wait_for_timeout(200)
      await pg.set_input_files(".bt-lado input[type=file]",MAPA);await pg.wait_for_timeout(4000);await pg.keyboard.press("Escape")
      await pg.wait_for_function("()=>AtlasBatalha.atual()",timeout=60000);await pg.evaluate(f"()=>{E}.artesPC().espera()");await pg.wait_for_timeout(1200)
      cv=pg.locator(".bt-wrap canvas").first;bb=await cv.bounding_box();cx,cy=bb["x"]+bb["width"]/2,bb["y"]+bb["height"]/2
      # ---- ambiente: a cor escolhida e a cor do mapa; a claridade acompanha
      await pg.evaluate(f"()=>{{{E}.seleciona([]);{E}.usa('sel')}}");await pg.wait_for_timeout(400)
      async def cor(hexv):await pg.evaluate("h=>{const sec=[...document.querySelectorAll('.bt-sec')].find(s=>/Ambiente do andar/i.test(s.textContent));const i=sec.querySelector('input[type=color]');i.value=h;i.dispatchEvent(new Event('input',{bubbles:true}))}",hexv);await pg.wait_for_timeout(300)
      await cor("#1b2347");am=await pg.evaluate(f"()=>{E}.mapa.andares[0].ambiente");rng=await pg.evaluate("()=>{const sec=[...document.querySelectorAll('.bt-sec')].find(s=>/Ambiente do andar/i.test(s.textContent));return +sec.querySelector('input[type=range]').value}")
      print("ambiente",am,rng);chk("cor escura vira o ambiente",abs(am[2]-0x47/255)<.01);chk("claridade mostra a cor escolhida",abs(rng-0x47/255)<.02)
      await cor("#ffe0c0");am=await pg.evaluate(f"()=>{E}.mapa.andares[0].ambiente");chk("outra cor atualiza (clara de novo)",am[0]>.99 and am[1]>.85)
      await pg.evaluate("()=>{const sec=[...document.querySelectorAll('.bt-sec')].find(s=>/Ambiente do andar/i.test(s.textContent));const r=sec.querySelector('input[type=range]');r.value=.5;r.dispatchEvent(new Event('input',{bubbles:true}))}");await pg.wait_for_timeout(300)
      am=await pg.evaluate(f"()=>{E}.mapa.andares[0].ambiente");hx=await pg.evaluate("()=>[...document.querySelectorAll('.bt-sec')].find(s=>/Ambiente do andar/i.test(s.textContent)).querySelector('input[type=color]').value")
      print(am,hx);chk("claridade 50% escurece a mesma cor",abs(max(am[:3])-.5)<.02 and abs(am[1]/am[0]-0xe0/255)<.03);chk("cor do seletor acompanha a claridade",hx.lower()=="#807060")
      # ---- sombras do mapa
      await pg.click("text=Pôr em todos");await pg.wait_for_timeout(500)
      r=await pg.evaluate(f"()=>{{const o={E}.mapa.andares[0].objetos;return [o.length,o.filter(x=>x.s).length]}}");chk("sombra em todos os objetos",r[0]==r[1] and r[0]>0)
      await pg.evaluate("()=>{const sec=[...document.querySelectorAll('.bt-sec')].find(s=>/Sombras do mapa/i.test(s.textContent));const r=[...sec.querySelectorAll('input[type=range]')][3];r.value=90;r.dispatchEvent(new Event('input',{bubbles:true}))}");await pg.wait_for_timeout(400)
      sd=await pg.evaluate(f"()=>{E}.mapa.andares[0].objetos.map(o=>o.sd)");print(sd[0]);chk("direção muda todas as sombras",all(abs(s[3])<.01 and s[4]>0 for s in sd))
      r=await pg.evaluate(f"()=>{{const A={E}.mapa.andares[0];return [A.paredes.every(w=>w.sd&&Math.abs(w.sd[3])<.01&&w.sd[4]>0),A.portais.every(q=>q.sd&&q.sd[4]>0),A.caminhos.every(c=>c.sd&&c.sd[4]>0)]}}");print("paredes/portas/caminhos",r)
      chk("sombras do mapa valem para paredes, portas e caminhos",all(r))
      await pg.evaluate(f"()=>{{const e={E};e.set({{cam:{{x:8,y:5,z:60}},luz:false}});e.agora()}}");await pg.wait_for_timeout(200);await pg.screenshot(path="/tmp/t961_sombras.png",clip=bb)
      chk("sombras do mapa desfazem",abs((await pg.evaluate(f"()=>{{const e={E};e.hist.desfazer();return e.mapa.andares[0].objetos[0].sd[4]}}"))-.094)>.01)
      # tirar so dos objetos (paredes desmarcadas continuam)
      await pg.evaluate(f"()=>{{{E}.seleciona([]);{E}.usa('sel')}}");await pg.wait_for_timeout(300)
      for t in ["Paredes","Portas e janelas","Caminhos"]:await pg.click(f".bt-sec:has-text('Sombras do mapa') .bt-chip >> text={t}");await pg.wait_for_timeout(150)
      await pg.click("text=Tirar de todos");await pg.wait_for_timeout(400)
      r=await pg.evaluate(f"()=>{{const A={E}.mapa.andares[0];return [A.objetos.some(o=>o.s),A.paredes.every(w=>w.sd&&w.sd!==0)]}}");print(r);chk("tirar só dos objetos",(not r[0]) and r[1])
      # caixa da sombra na parede escolhida
      await pg.evaluate(f"()=>{{const e={E};e.seleciona([{{k:'paredes',e:e.mapa.andares[0].paredes[0]}}])}}");await pg.wait_for_timeout(400)
      await pg.click(".bt-sec:has-text('Sombra') label:has-text('Faz sombra') input");await pg.wait_for_timeout(300)
      chk("parede sem sombra pela caixa",await pg.evaluate(f"()=>{E}.mapa.andares[0].paredes[0].sd")==0)
      # ---- formas de luz
      await pg.evaluate(f"()=>{{const e={E};e.seleciona([{{k:'luzes',e:e.mapa.andares[0].luzes[0]}}])}}");await pg.wait_for_timeout(400)
      n=await pg.locator(".bt-luzes .bt-mo").count();chk("formas de luz do Atlas no painel",n>=8)
      await pg.click(".bt-luzes .bt-mo[data-k='atlas:luz/cone']");await pg.wait_for_timeout(600)
      l=await pg.evaluate(f"()=>{E}.mapa.andares[0].luzes[0]");chk("luz em cone",l.get("tex")=="atlas:luz/cone")
      await pg.evaluate(f"()=>{{const e={E};e.set({{cam:{{x:8,y:5,z:60}},luz:true}});e.agora()}}");await pg.wait_for_timeout(300);await pg.screenshot(path="/tmp/t96_cone.png",clip=bb)
      await pg.click(".bt-luzes .bt-mo[data-k='atlas:luz/caustica']");await pg.wait_for_timeout(600);l=await pg.evaluate(f"()=>{E}.mapa.andares[0].luzes[0]");chk("água animada",l.get("anim")==1)
      await pg.evaluate(f"()=>{{const e={E};e.agora()}}");await pg.screenshot(path="/tmp/t96_agua.png",clip=bb)
      await pg.click(".bt-luzes .bt-mo[data-k='atlas:luz/folhas']");await pg.wait_for_timeout(500);await pg.evaluate(f"()=>{{const e={E};e.agora()}}");await pg.screenshot(path="/tmp/t96_folhas.png",clip=bb)
      # alt + roda gira a luz escolhida
      g0=(await pg.evaluate(f"()=>{E}.mapa.andares[0].luzes[0].gir||0"));await pg.mouse.move(cx,cy);await pg.keyboard.down("Alt");await pg.mouse.wheel(0,100);await pg.keyboard.up("Alt");await pg.wait_for_timeout(300)
      g1=await pg.evaluate(f"()=>{E}.mapa.andares[0].luzes[0].gir||0");print("giro luz",g0,g1);chk("Alt+roda gira a luz",abs(g1-g0-0.2618)<.01)
      # ---- roda do mouse ao colocar objeto
      await pg.evaluate(f"()=>{{const e={E};e.seleciona([]);e.usa('obj')}}");await pg.wait_for_timeout(500)
      gin=pg.locator(".bt-sec:has-text('Como colocar') input[type=number]").first;v0=float(await gin.input_value())
      await pg.mouse.move(cx,cy);await pg.mouse.wheel(0,100);await pg.wait_for_timeout(500);v1=float(await pg.locator(".bt-sec:has-text('Como colocar') input[type=number]").first.input_value())
      print("giro",v0,v1);chk("roda gira o objeto a colocar",(v1-v0)%360==15)
      z0=await pg.evaluate(f"()=>{E}.cam.z");await pg.keyboard.down("Shift");await pg.mouse.wheel(0,-100);await pg.keyboard.up("Shift");await pg.wait_for_timeout(500)
      t=await pg.locator(".bt-sec:has-text('Como colocar') .bt-c").first.text_content();print("tamanho",t);chk("Shift+roda muda o tamanho",("108%" in t))
      chk("a roda nao aproximou",await pg.evaluate(f"()=>{E}.cam.z")==z0)
      await pg.keyboard.down("Control");await pg.mouse.wheel(0,-100);await pg.keyboard.up("Control");await pg.wait_for_timeout(200);chk("Ctrl+roda aproxima",await pg.evaluate(f"()=>{E}.cam.z")!=z0)
      # ---- lista completa (sem Mostrar mais) e rolagem mantida
      await pg.click("[role=tab][data-f=pc]");await pg.wait_for_timeout(800)
      info=await pg.locator(".bt-sec:has-text('Biblioteca') .bt-nota").last.text_content();print("info",info);chk("sem 'Mostrar mais'",await pg.locator("text=Mostrar mais").count()==0)
      tot=await pg.evaluate("()=>{const v=document.querySelector('.bt-palpc .bt-vgi');return v?v.offsetHeight:0}");print("altura",tot);chk("grade tem todas as artes",tot>20000)
      await pg.evaluate("()=>{const v=document.querySelector('.bt-palpc');v.scrollTop=6000}");await pg.wait_for_timeout(500)
      vis=pg.locator(".bt-palpc .bt-arte");print("celulas",await vis.count());chk("so as celulas visiveis existem",0<await vis.count()<80)
      k=await pg.evaluate("()=>{const r=document.querySelector('.bt-palpc').getBoundingClientRect();const e=document.elementFromPoint(r.left+40,r.top+60).closest('.bt-arte');e.click();return e.dataset.k}");await pg.wait_for_timeout(1500)
      await pg.mouse.click(cx+60,cy+40);await pg.wait_for_timeout(1500)
      st=await pg.evaluate("()=>document.querySelector('.bt-palpc').scrollTop");print("rolagem depois de colocar",st);chk("lista continua no mesmo lugar depois de colocar",abs(st-6000)<5)
      chk("arte nova colocada",await pg.evaluate(f"()=>{{const e={E};return e.mapa.texturas[e.mapa.andares[0].objetos.at(-1).t]}}")==k)
      # ---- pinceis: importar o zip, escolher um e pintar
      await pg.keyboard.press("Escape");await pg.evaluate(f"()=>{{const e={E};e.usa('pin')}}");await pg.wait_for_timeout(500)
      await pg.set_input_files(".bt-wrap input[accept='image/*,.zip']",ZIP);await pg.wait_for_function("()=>document.querySelectorAll('.bt-pinceis .bt-mo').length>30",timeout=60000)
      n=await pg.locator(".bt-pinceis .bt-mo").count();print("pinceis",n);chk("pinceis do zip importados",n>=9+33)
      await pg.screenshot(path="/tmp/t96_pinceis.png",clip=await pg.locator(".bt-pinceis").bounding_box())
      await pg.click(".bt-pinceis .bt-mo[title^='Splatter']");await pg.wait_for_timeout(400)
      s0=await pg.evaluate(f"()=>{{const c={E}.mapa.andares[0].camadas;return c.map(x=>x.m?x.m.reduce((a,b)=>a+b,0):-1)}}")
      await pg.mouse.move(cx-80,cy);await pg.mouse.down();await pg.mouse.move(cx+80,cy+30,steps=12);await pg.mouse.up();await pg.wait_for_timeout(500)
      s1=await pg.evaluate(f"()=>{{const c={E}.mapa.andares[0].camadas;return c.map(x=>x.m?x.m.reduce((a,b)=>a+b,0):-1)}}");print(s0,s1);chk("pincel com formato pinta a máscara",s0!=s1)
      await pg.evaluate(f"()=>{{const e={E};e.set({{luz:false}});e.agora()}}");await pg.screenshot(path="/tmp/t96_pintado.png",clip=bb)
      chk("sem erros",not errs);print(errs)
      await b.close()
  finally:srv.terminate()
asyncio.run(main());print(len(ok),"ok",len(falha),"falhas",falha)
