# 1.00: ferramenta Zona. Gera um comodo com as artes do Atlas e com pacotes reais, repete igual com a mesma semente,
# varia, respeita o que foi mexido a mao, desfaz num passo e funciona pela interface (arrastar e clicar num comodo).
import asyncio,subprocess,time,json
from playwright.async_api import async_playwright
srv=subprocess.Popen(["python3","-m","http.server","8825","--bind","127.0.0.1"],cwd="/home/claude/app",stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL);time.sleep(1)
ARGS=["--no-sandbox","--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]
U="/mnt/user-data/uploads/";E="AtlasBatalha.atual()"
PACS=[U+"0d332e36-PeaPu_Battle_Sci-Fi_Interiors_01_Spaceship.dungeondraft_pack"]
ok=[];falha=[]
def chk(n,c):(ok if c else falha).append(n);print(("OK  " if c else "FALHA ")+n,flush=True)
ESPERA=f"()=>!{E}.zonas.ocupado()"
OBJS="(id)=>{const e=%s;return e.zonas.daZona(id).filter(o=>o.w!=null&&o.t!=null).map(o=>[o.id,o.x,o.y,o.r,e.mapa.texturas[o.t],o.w,o.h,o.l])}"%E
def dentro(P,x,y):
    c=False;j=len(P)-1
    for i in range(len(P)):
        a,b=P[i],P[j]
        if (a[1]>y)!=(b[1]>y) and x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0]:c=not c
        j=i
    return c
async def main():
  try:
    async with async_playwright() as p:
      b=await p.chromium.launch(executable_path="/usr/bin/google-chrome",args=ARGS);pg=await (await b.new_context(viewport={"width":1300,"height":860})).new_page();errs=[];pg.on("pageerror",lambda e:errs.append(str(e)[:300]))
      await pg.goto("http://127.0.0.1:8825/index.html");await pg.wait_for_timeout(1500)
      await pg.click(".rail button[data-sec=maps]");await pg.click(".shead button.primary");await pg.click(".mitem >> text=Mapa de batalha");await pg.wait_for_timeout(2500)
      await pg.evaluate(f"()=>{{const e={E};e.set({{cam:{{x:12,y:9,z:34}}}});e.usa('zon')}}");await pg.wait_for_timeout(400)
      chk("ferramenta Zona no painel",await pg.locator(".bt-pt >> text=Zona").count()==1)
      # 1) artes do Atlas: taverna num retangulo
      P=[[4,3],[16,3],[16,12],[4,12]]
      zid=await pg.evaluate(f"(P)=>{E}.zonas.criar(P,'taverna').id",P);await pg.wait_for_function(ESPERA);await pg.wait_for_timeout(300)
      o1=await pg.evaluate(OBJS,zid);print("atlas taverna:",len(o1),"objetos");chk("gera com as artes do Atlas",len(o1)>=12)
      chk("tudo dentro da zona",all(dentro(P,o[1],o[2]) for o in o1))
      nl=await pg.evaluate(f"(id)=>{E}.zonas.daZona(id).filter(o=>o.raio!=null).length",zid);print("luzes",nl);chk("acende luzes",nl>=1)
      await pg.screenshot(path="/tmp/z100_atlas.png")
      # 2) mesma semente = mesmo resultado
      await pg.evaluate(f"(id)=>{E}.zonas.gerar(id)",zid);await pg.wait_for_function(ESPERA);o2=await pg.evaluate(OBJS,zid)
      chk("mesma semente, mesmo resultado",[x[1:] for x in o1]==[x[1:] for x in o2])
      # 3) variar muda
      await pg.evaluate(f"(id)=>{E}.zonas.gerar(id,{{variar:true}})",zid);await pg.wait_for_function(ESPERA);o3=await pg.evaluate(OBJS,zid)
      chk("variar muda o arranjo",[x[1:] for x in o3]!=[x[1:] for x in o2])
      # 4) peca mexida a mao fica
      alvo=o3[0];await pg.evaluate(f"""(id)=>{{const e={E},o=e.mapa.andares[0].objetos.find(x=>x.id===id),de=Object.assign({{}},o),para=Object.assign({{}},o,{{x:o.x+.37,r:(o.r||0)+.5}});e.hist.exec([{{op:'muda',a:0,k:'objetos',id,de,para}}],{{nome:'mover'}})}}""",alvo[0])
      await pg.evaluate(f"(id)=>{E}.zonas.gerar(id,{{variar:true}})",zid);await pg.wait_for_function(ESPERA);o4=await pg.evaluate(OBJS,zid)
      fica=[x for x in o4 if x[0]==alvo[0]];print("travada:",fica[:1]);chk("peça mexida à mão é mantida",len(fica)==1 and abs(fica[0][1]-(alvo[1]+.37))<1e-6)
      # 5) desfazer volta a geracao inteira num passo
      await pg.evaluate(f"()=>{E}.hist.desfazer()");o5=await pg.evaluate(OBJS,zid);chk("desfazer volta num passo",sorted(x[0] for x in o5)==sorted(x[0] for x in o3))
      await pg.evaluate(f"()=>{E}.hist.refazer()")
      # 6) pela interface: arrastar um retangulo cria e gera
      n0=await pg.evaluate(f"()=>{E}.zonas.lista().length")
      await pg.select_option("select[aria-label='Tipo de cômodo'] >> nth=0","quarto")
      a=await pg.evaluate(f"()=>{E}.naTela(18,3)");c=await pg.evaluate(f"()=>{E}.naTela(25,9)")
      await pg.mouse.move(*a);await pg.mouse.down();await pg.mouse.move((a[0]+c[0])/2,(a[1]+c[1])/2,steps=4);await pg.mouse.move(*c,steps=4);await pg.mouse.up();await pg.wait_for_function(ESPERA);await pg.wait_for_timeout(300)
      L=await pg.evaluate(f"()=>{E}.zonas.lista().map(z=>[z.id,z.tipo,z.p.length,(z.info||{{}}).n])");print(L);chk("arrastar cria a zona e gera",len(L)==n0+1 and L[-1][1]=="quarto" and (L[-1][3] or 0)>=3)
      chk("painel da zona escolhida",await pg.locator("h3 >> text=Zona escolhida").count()==1 and await pg.locator("button >> text=Variar").count()==1)
      # 7) clicar dentro de um comodo fechado usa as paredes dele
      await pg.evaluate(f"""()=>{{const e={E},M=e.mapa,id=M.sid++;e.hist.exec([{{op:'cria',a:0,k:'paredes',item:{{id,t:0,p:[[4,14],[11,14],[11,17.5],[4,17.5]],laco:true,raio:.25,larg:.18,tipo:0,sombra:true}}}}],{{nome:'parede'}});e.set({{cam:{{x:12,y:11,z:30}}}})}}""");await pg.wait_for_timeout(400)
      await pg.select_option("select[aria-label='Tipo de cômodo'] >> nth=0","despensa")
      q=await pg.evaluate(f"()=>{E}.naTela(7.5,15.5)");await pg.mouse.click(*q);await pg.wait_for_function(ESPERA);await pg.wait_for_timeout(300)
      L=await pg.evaluate(f"()=>{E}.zonas.lista().map(z=>[z.id,z.tipo,z.parede,(z.info||{{}}).n])");print(L[-1]);chk("clique no cômodo fechado cria a zona",L[-1][1]=="despensa" and L[-1][2] is not None and (L[-1][3] or 0)>=3)
      await pg.screenshot(path="/tmp/z100_ui.png")
      # 8) pacotes reais
      await pg.set_input_files(".bt-wrap input[accept='.dungeondraft_pack']",PACS);await pg.wait_for_function("()=>AtlasArtes.estado().conectada&&!AtlasArtes.estado().lendo",timeout=180000);await pg.wait_for_timeout(800)
      await pg.evaluate(f"()=>{{const e={E};e.usa('zon');e.set({{cam:{{x:24,y:16,z:34}}}})}}")
      P2=[[18,11],[30,11],[30,20],[18,20]];z2=await pg.evaluate(f"(P)=>{E}.zonas.criar(P,'dormitorio').id",P2);await pg.wait_for_function(ESPERA,timeout=120000);await pg.wait_for_timeout(1500)
      o6=await pg.evaluate(OBJS,z2);reais=[x for x in o6 if str(x[4]).startswith("res://")];inf=await pg.evaluate(f"(id)=>{E}.zonas.lista().find(z=>z.id===id).info",z2);print("pacote:",len(o6),"objetos,",len(reais),"reais",inf)
      for x in o6[:8]:print("  ",x[4].split("/")[-1],x[5],x[6],round(x[3],2))
      chk("gera com artes dos pacotes",len(reais)>=4 and all(dentro(P2,o[1],o[2]) for o in o6))
      chk("camas no dormitório",sum(1 for x in reais if "Bed" in x[4])>=2)
      await pg.wait_for_timeout(1500);await pg.screenshot(path="/tmp/z100_pc.png")
      chk("sem erros",not errs);print(errs)
      await b.close()
  finally:srv.terminate()
asyncio.run(main());print(len(ok),"ok",len(falha),"falhas",falha)
