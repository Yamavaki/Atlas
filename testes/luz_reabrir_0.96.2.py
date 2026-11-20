import asyncio,subprocess,time
from playwright.async_api import async_playwright
srv=subprocess.Popen(["python3","-m","http.server","8820","--bind","127.0.0.1"],cwd="/home/claude/app",stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL);time.sleep(1)
ARGS=["--no-sandbox","--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]
U="/mnt/user-data/uploads/";E="AtlasBatalha.atual()"
async def main():
  try:
    async with async_playwright() as p:
      b=await p.chromium.launch(executable_path="/usr/bin/google-chrome",args=ARGS);ctx=await b.new_context(viewport={"width":1300,"height":820});pg=await ctx.new_page();errs=[];pg.on("pageerror",lambda e:errs.append(str(e)[:300]))
      await pg.goto("http://127.0.0.1:8820/index.html");await pg.wait_for_timeout(1500)
      await pg.click(".rail button[data-sec=maps]");await pg.click(".shead button.primary");await pg.click(".mitem >> text=Mapa de batalha");await pg.wait_for_timeout(2500)
      await pg.click(".rail button[data-sec=maps]");await pg.click(".shead button.primary");await pg.wait_for_timeout(200)
      await pg.set_input_files(".bt-lado input[type=file]","/home/claude/x95/teste095.dungeondraft_map");await pg.wait_for_timeout(4000);await pg.keyboard.press("Escape")
      await pg.wait_for_function("()=>AtlasBatalha.atual()",timeout=60000);await pg.wait_for_timeout(800)
      async def foto(n):
        await pg.evaluate(f"()=>{{const e={E};e.seleciona([]);e.set({{cam:{{x:8,y:5,z:50}},luz:true,grade:false}});e.agora()}}");await pg.wait_for_timeout(300)
        cv=pg.locator(".bt-wrap canvas").first;await pg.screenshot(path=f"/tmp/lz_{n}.png",clip=await cv.bounding_box())
        print(n,await pg.evaluate(f"()=>JSON.stringify({E}.mapa.andares[0].luzes[0])"))
      await foto("a")
      await pg.evaluate(f"()=>{{const e={E};e.seleciona([{{k:'luzes',e:e.mapa.andares[0].luzes[0]}}])}}");await pg.wait_for_timeout(400)
      await pg.click(".bt-luzes .bt-mo[data-k='atlas:luz/cone']");await pg.wait_for_timeout(500)
      await pg.click(".bt-luzes .bt-mo[data-k='']");await pg.wait_for_timeout(500)
      await pg.click("label:has-text('Queda suave') input");await pg.wait_for_timeout(400)
      await pg.evaluate("()=>{const r=[...document.querySelectorAll('.bt-sec')].find(s=>/Alcance/.test(s.textContent)).querySelector('input[type=range]');r.value=1.5;r.dispatchEvent(new Event('input',{bubbles:true}))}");await pg.wait_for_timeout(400)
      await foto("b")
      await pg.evaluate(f"()=>{E}.salvarAgora()");await pg.wait_for_timeout(800)
      await pg.reload();await pg.wait_for_timeout(2000)
      await pg.click(".rail button[data-sec=maps]");await pg.wait_for_timeout(500)
      await pg.locator("text=/teste095/i").first.click();await pg.wait_for_timeout(4000)
      await pg.wait_for_function("()=>AtlasBatalha.atual()",timeout=60000);await pg.wait_for_timeout(800)
      await foto("c")
      from PIL import Image, ImageChops
      for x,y in [("a","b"),("a","c")]:
        d=ImageChops.difference(Image.open(f"/tmp/lz_{x}.png").convert("RGB"),Image.open(f"/tmp/lz_{y}.png").convert("RGB"));print(x,y,"diferenca",max(d.getextrema(),key=lambda e:e[1]))
      await b.close()
  finally:srv.terminate()
asyncio.run(main())
