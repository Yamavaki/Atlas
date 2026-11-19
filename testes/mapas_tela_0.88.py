import asyncio,subprocess,time
from playwright.async_api import async_playwright
srv=subprocess.Popen(["python3","-m","http.server","8794","--bind","127.0.0.1"],cwd="/home/claude/app",stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL);time.sleep(1)
ok=[];falha=[]
def chk(nome,c):(ok if c else falha).append(nome);print(("OK  " if c else "FALHA ")+nome)
async def main():
    try:
        async with async_playwright() as p:
            b=await p.chromium.launch(executable_path="/usr/bin/google-chrome",args=["--no-sandbox"])
            for W,H in [(1400,860),(900,760),(390,800)]:
                ctx=await b.new_context(viewport={"width":W,"height":H},accept_downloads=True);pg=await ctx.new_page();errs=[];pg.on("pageerror",lambda e:errs.append(str(e.stack)[:400]))
                await pg.goto("http://127.0.0.1:8794/index.html");await pg.wait_for_timeout(1200)
                await pg.click("#bExp");await pg.click(".mitem >> text=Criar mundo de exemplo");await pg.wait_for_timeout(2500)
                await pg.click(".rail button[data-sec=maps]");await pg.wait_for_timeout(300)
                if not await pg.locator("#side .item").first.is_visible():await pg.click("#menu");await pg.wait_for_timeout(300)
                await pg.locator("#side .item").first.click();await pg.wait_for_timeout(1500)
                v=await pg.evaluate("()=>{const v=document.querySelector('.view').getBoundingClientRect(),m=document.querySelector('#main').getBoundingClientRect();return [v.left-m.left,v.width,m.width,v.bottom,innerHeight]}")
                tag=f"{W}px"
                chk(tag+" mapa ocupa a largura",abs(v[1]-v[2])<4 or W>860 and v[2]-v[1]<4)
                chk(tag+" mapa vai ate embaixo",v[4]-v[3]<(80 if W<=860 else 4) and v[3]<=v[4]+1)
                # ferramentas visiveis e clicaveis
                pal=await pg.evaluate("()=>{const r=document.querySelector('.pal').getBoundingClientRect(),v=document.querySelector('.view').getBoundingClientRect();return [r.top>=v.top-1,r.bottom<=v.bottom+1,r.left>=v.left-1,r.right<=v.right+1]}")
                chk(tag+" ferramentas dentro do mapa",all(pal))
                z0=await pg.locator(".zbox .zl").inner_text();await pg.click(".zbox .icb[aria-label='Aproximar']") if await pg.locator(".zbox .icb[aria-label='Aproximar']").count() else await pg.locator(".zbox .icb").nth(4).click()
                await pg.wait_for_timeout(200);z1=await pg.locator(".zbox .zl").inner_text();chk(tag+" zoom",z0!=z1)
                # sem sobreposicao entre dica e zoom
                ov=await pg.evaluate("()=>{const a=document.querySelector('.hintc'),b=document.querySelector('.zbox');if(!a||getComputedStyle(a).display==='none')return false;const r=a.getBoundingClientRect(),s=b.getBoundingClientRect();return r.right>s.left&&r.bottom>s.top&&r.top<s.bottom}")
                chk(tag+" dica nao cobre o zoom",not ov)
                # parametros
                await pg.click(".hact button >> text=Parâmetros");await pg.wait_for_timeout(300)
                vis=await pg.locator(".params").is_visible();chk(tag+" parametros abrem",vis)
                pr=await pg.evaluate("()=>{const r=document.querySelector('.params').getBoundingClientRect();return r.bottom<=innerHeight+1}")
                chk(tag+" parametros cabem na tela",pr)
                await pg.screenshot(path=f"/tmp/t88_{W}.png")
                await pg.click(".hact button >> text=Parâmetros");await pg.wait_for_timeout(200)
                # cidade
                if W>860:
                    await pg.click(".shead button.primary");await pg.click(".mitem >> text=Cidade");await pg.wait_for_timeout(2500)
                    chk(tag+" cidade abre",await pg.locator(".mapv .view canvas").count()>=1)
                    await pg.screenshot(path=f"/tmp/t88_cid_{W}.png")
                chk(tag+" sem erros",not errs);print(errs)
                await ctx.close()
    finally:srv.terminate()
asyncio.run(main())
print(len(ok),"ok",len(falha),"falhas",falha)
