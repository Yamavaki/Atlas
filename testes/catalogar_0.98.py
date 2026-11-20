# 0.98: categorias inteligentes na biblioteca, combina com, informacao da arte escolhida e trocar por outra do mesmo tipo.
import asyncio,subprocess,time
from playwright.async_api import async_playwright
srv=subprocess.Popen(["python3","-m","http.server","8823","--bind","127.0.0.1"],cwd="/home/claude/app",stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL);time.sleep(1)
ARGS=["--no-sandbox","--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]
U="/mnt/user-data/uploads/";E="AtlasBatalha.atual()"
PACS=[U+"0d332e36-PeaPu_Battle_Sci-Fi_Interiors_01_Spaceship.dungeondraft_pack",U+"PeaPu_Battle_Cyberpunk_Exteriors_01_Streets.dungeondraft_pack"]
ok=[];falha=[]
def chk(n,c):(ok if c else falha).append(n);print(("OK  " if c else "FALHA ")+n,flush=True)
async def main():
  try:
    async with async_playwright() as p:
      b=await p.chromium.launch(executable_path="/usr/bin/google-chrome",args=ARGS);pg=await (await b.new_context(viewport={"width":1300,"height":860})).new_page();errs=[];pg.on("pageerror",lambda e:errs.append(str(e)[:300]))
      await pg.goto("http://127.0.0.1:8823/index.html");await pg.wait_for_timeout(1500)
      await pg.click(".rail button[data-sec=maps]");await pg.click(".shead button.primary");await pg.click(".mitem >> text=Mapa de batalha");await pg.wait_for_timeout(2500)
      await pg.set_input_files(".bt-wrap input[accept='.dungeondraft_pack']",PACS);await pg.wait_for_function("()=>AtlasArtes.estado().conectada&&!AtlasArtes.estado().lendo",timeout=180000);await pg.wait_for_timeout(500)
      cl=await pg.evaluate("()=>['res://packs/rwGqcJGG/textures/objects/PP_Battle_Sci-Fi_Int01_Bedding_Bed_01a_Furniture_Blue.webp','res://packs/rwGqcJGG/textures/objects/PP_Battle_Sci-Fi_Int01_Bathroom_Toilet_01a_Blue.webp','res://packs/rwGqcJGG/textures/objects/PP_Battle_Sci-Fi_Int01_Storage_Locker_01a_Blue.webp'].map(k=>AtlasArtes.classe?null:null)")
      await pg.evaluate(f"()=>{{const e={E};e.set({{cam:{{x:12,y:9,z:30}}}});e.usa('obj')}}");await pg.wait_for_timeout(400)
      if await pg.locator("[role=tab][data-f=pc][aria-selected=false]").count():await pg.click("[role=tab][data-f=pc]")
      await pg.wait_for_timeout(1200)
      cats=await pg.locator("select[aria-label=Categoria] option").all_inner_texts();print(cats[:8]);chk("categorias com contagem",len(cats)>5 and any("Móveis" in c for c in cats))
      await pg.select_option("select[aria-label=Categoria]","Móveis");await pg.wait_for_timeout(800)
      subs=await pg.locator("select[aria-label=Subcategoria] option").all_inner_texts();print(subs);chk("subcategorias da categoria",any("Camas" in s for s in subs))
      await pg.select_option("select[aria-label=Subcategoria]","Camas");await pg.wait_for_timeout(800)
      t=await pg.locator(".bt-palpc .bt-arte").evaluate_all("bs=>bs.map(b=>b.title)");print(len(t),t[:3]);chk("só camas na grade",len(t)>0 and all("Camas" in x for x in t))
      amb=await pg.locator("select[aria-label=Ambiente] option").all_inner_texts();print(amb[:6]);chk("ambientes",len(amb)>2)
      # escolher uma cama e ver o combina com
      await pg.locator(".bt-palpc .bt-arte").first.click();await pg.wait_for_timeout(1500)
      n=await pg.locator(".bt-combina .bt-arte").count();print("combina",n);chk("combina com a escolhida",n>0)
      await pg.screenshot(path="/tmp/t98_biblioteca.png",clip={"x":900,"y":80,"width":400,"height":780})
      # colocar e selecionar
      q=await pg.evaluate(f"()=>{E}.naTela(12,9)");await pg.mouse.click(*q);await pg.wait_for_timeout(800)
      await pg.evaluate(f"()=>{{const e={E},o=e.mapa.andares[0].objetos.slice(-1)[0];e.usa('sel');e.seleciona([{{k:'objetos',e:o}}])}}");await pg.wait_for_timeout(1200)
      info=await pg.locator(".bt-sec:has(.bt-ficha)").inner_text();print(info[:400]);chk("informação da arte",("Tipo" in info) and ("Pacote" in info) and ("Imagem" in info) and ("Camas" in info))
      await pg.screenshot(path="/tmp/t98_info.png",clip={"x":900,"y":80,"width":400,"height":780})
      t0=await pg.evaluate(f"()=>{{const e={E};return e.mapa.texturas[e.mapa.andares[0].objetos.slice(-1)[0].t]}}")
      await pg.click("button >> text=Trocar por outra do mesmo tipo");await pg.wait_for_timeout(800)
      alt=pg.locator(".bt-sec:has(.bt-ficha) .bt-arte[aria-selected=false]").first;await alt.click();await pg.wait_for_timeout(1500)
      t1=await pg.evaluate(f"()=>{{const e={E};return e.mapa.texturas[e.mapa.andares[0].objetos.slice(-1)[0].t]}}");print(t0,t1);chk("trocar por outra do mesmo tipo",t1!=t0 and "/objects/" in t1)
      await pg.click("button >> text=Ver na biblioteca");await pg.wait_for_timeout(1200)
      v=await pg.evaluate("()=>[document.querySelector('select[aria-label=Categoria]').value,document.querySelector('select[aria-label=Subcategoria]').value]");print(v);chk("ver na biblioteca abre filtrado",v[1]=="Camas")
      # texturas com subcategorias
      await pg.evaluate(f"()=>{E}.usa('pin')");await pg.wait_for_timeout(500);await pg.click(".bt-mat:has-text('Textura')");await pg.wait_for_timeout(300)
      await pg.click(".bt-mats:not([hidden]) .bt-fonte button >> text=Minhas texturas");await pg.wait_for_timeout(800)
      ch=await pg.locator(".bt-mats:not([hidden]) .bt-subs .bt-chip").all_inner_texts();print(ch);chk("texturas por tipo (grama, pedra…)",len(ch)>=3)
      chk("sem erros",not errs);print(errs)
      await b.close()
  finally:srv.terminate()
asyncio.run(main());print(len(ok),"ok",len(falha),"falhas",falha)
