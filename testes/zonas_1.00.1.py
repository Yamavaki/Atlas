# 1.01: zona com paredes/piso/porta, variar muitas vezes sem estourar as artes carregadas, apagar a zona e desfazer
# (antes as artes sumiam), somar uma forma a zona, variacoes da arte no painel.
import asyncio,subprocess,time
from playwright.async_api import async_playwright
srv=subprocess.Popen(["python3","-m","http.server","8826","--bind","127.0.0.1"],cwd="/home/claude/app",stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL);time.sleep(1)
ARGS=["--no-sandbox","--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]
U="/mnt/user-data/uploads/";E="AtlasBatalha.atual()"
PACS=[U+"0d332e36-PeaPu_Battle_Sci-Fi_Interiors_01_Spaceship.dungeondraft_pack",U+"PeaPu_Battle_Cyberpunk_Interiors_01a_Home.dungeondraft_pack"]
import os;PACS=[p for p in PACS if os.path.exists(p)]
ok=[];falha=[]
def chk(n,c):(ok if c else falha).append(n);print(("OK  " if c else "FALHA ")+n,flush=True)
ESPERA=f"()=>!{E}.zonas.ocupado()"
async def main():
  try:
    async with async_playwright() as p:
      b=await p.chromium.launch(executable_path="/usr/bin/google-chrome",args=ARGS);pg=await (await b.new_context(viewport={"width":1300,"height":860})).new_page();errs=[];pg.on("pageerror",lambda e:errs.append(str(e)[:300]))
      await pg.goto("http://127.0.0.1:8826/index.html");await pg.wait_for_timeout(1500)
      await pg.click(".rail button[data-sec=maps]");await pg.click(".shead button.primary");await pg.click(".mitem >> text=Mapa de batalha");await pg.wait_for_timeout(2500)
      await pg.set_input_files(".bt-wrap input[accept='.dungeondraft_pack']",PACS);await pg.wait_for_function("()=>AtlasArtes.estado().conectada&&!AtlasArtes.estado().lendo",timeout=180000);await pg.wait_for_timeout(800)
      await pg.evaluate(f"()=>{{const e={E};e.set({{cam:{{x:12,y:9,z:30}}}});e.usa('zon')}}");await pg.wait_for_timeout(300)
      P=[[4,3],[16,3],[16,12],[4,12]]
      zid=await pg.evaluate(f"(P)=>{E}.zonas.criar(P,'quarto').id",P);await pg.wait_for_function(ESPERA,timeout=120000);await pg.wait_for_timeout(500)
      L=await pg.evaluate(f"(id)=>{{const e={E},A=e.mapa.andares[0];return ['paredes','padroes','portais','objetos'].map(k=>(A[k]||[]).filter(x=>x.z===id).length)}}",zid);print("paredes, pisos, portas, objetos:",L)
      chk("zona cria parede, piso e porta",L[0]==1 and L[1]==1 and L[2]==1 and L[3]>=3)
      # variar muitas vezes
      for i in range(10):
        await pg.evaluate(f"(id)=>{E}.zonas.gerar(id,{{variar:true}})",zid);await pg.wait_for_function(ESPERA,timeout=120000)
      await pg.evaluate(f"()=>{E}.artesPC().espera()");await pg.wait_for_timeout(800)
      st=await pg.evaluate(f"()=>{{const a={E}.artesPC();return [a.carregadas,a.usadas(),a.faltam(),{E}.mapa.texturas.length]}}");print("carregadas, usadas, faltam, nomes:",st)
      chk("carrega só as artes usadas",st[0]<=st[1]+2 and st[2]==0)
      # apagar a zona e desfazer: as pecas voltam com as artes carregadas
      n0=await pg.evaluate(f"(id)=>{E}.zonas.daZona(id).length",zid)
      await pg.evaluate(f"(id)=>{E}.zonas.escolher(id)",zid);await pg.wait_for_timeout(200)
      await pg.click("button >> text=Apagar a zona e as peças");await pg.wait_for_timeout(400)
      chk("apagar some com tudo",await pg.evaluate(f"(id)=>{E}.zonas.daZona(id).length",zid)==0)
      await pg.evaluate("()=>document.querySelector('.bt-wrap').focus()");await pg.keyboard.press("Control+z");await pg.wait_for_timeout(1500)
      await pg.evaluate(f"()=>{E}.artesPC().espera()");n1=await pg.evaluate(f"(id)=>{E}.zonas.daZona(id).length",zid);fal=await pg.evaluate(f"()=>{E}.artesPC().faltam()")
      print("antes",n0,"depois do desfazer",n1,"faltam",fal);chk("desfazer volta a zona com as artes",n1==n0 and fal==0)
      # colocar um objeto do pacote depois disso
      k=await pg.evaluate("()=>{const r=AtlasArtes.buscar({cat:'objects',limite:5});return r.itens[3].caminho}")
      await pg.evaluate(f"(k)=>{{const e={E};e.usa('obj');e.set({{arte:k}})}}",k);await pg.wait_for_timeout(300)
      q=await pg.evaluate(f"()=>{E}.naTela(20,8)");await pg.mouse.click(*q);await pg.wait_for_timeout(1500);await pg.evaluate(f"()=>{E}.artesPC().espera()");await pg.wait_for_timeout(500)
      fal=await pg.evaluate(f"()=>{E}.artesPC().faltam()");no=await pg.evaluate(f"(k)=>{{const e={E};return e.mapa.andares[0].objetos.filter(o=>e.mapa.texturas[o.t]===k).length}}",k);print("novo",k,no,"faltam",fal);chk("objeto novo aparece (arte carregada)",fal==0 and no==1)
      # somar uma forma a zona
      await pg.evaluate(f"()=>{E}.usa('zon')");await pg.evaluate(f"(id)=>{E}.zonas.escolher(id)",zid);await pg.wait_for_timeout(200)
      await pg.click("button >> text=Somar à zona escolhida");a=await pg.evaluate(f"()=>{E}.naTela(15,6)");c=await pg.evaluate(f"()=>{E}.naTela(21,10)")
      await pg.mouse.move(*a);await pg.mouse.down();await pg.mouse.move(*c,steps=6);await pg.mouse.up();await pg.wait_for_function(ESPERA,timeout=120000);await pg.wait_for_timeout(500)
      z=await pg.evaluate(f"(id)=>{E}.zonas.lista().find(z=>z.id===id)",zid);xs=[q[0] for q in z["p"]];print("zona somada:",len(z["p"]),"pontos, x até",max(xs))
      chk("somar aumenta a zona",max(xs)>20.5 and len(z["p"])>=6)
      await pg.screenshot(path="/tmp/z101_somar.png")
      # variacoes da arte
      oid=await pg.evaluate(f"(id)=>{{const e={E},o=e.zonas.daZona(id).find(o=>o.w&&o.t!=null&&String(e.mapa.texturas[o.t]).startsWith('res://'));e.usa('sel');e.seleciona([{{k:'objetos',e:o}}]);return o.id}}",zid);await pg.wait_for_timeout(1200)
      nv=await pg.locator(".bt-sec:has(.bt-ficha) >> text=/Variações desta arte/").count();print("variações:",nv);chk("variações da arte no painel",nv==1)
      chk("sem erros",not errs);print(errs)
      await b.close()
  finally:srv.terminate()
asyncio.run(main());print(len(ok),"ok",len(falha),"falhas",falha)
