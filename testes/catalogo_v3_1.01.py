# 0.99: catalogo v2 para a IA (indice + kits + um arquivo por pacote), feito no navegador com pacotes reais.
import asyncio,subprocess,time,json,gzip,zipfile,re,io
from playwright.async_api import async_playwright
srv=subprocess.Popen(["python3","-m","http.server","8824","--bind","127.0.0.1"],cwd="/home/claude/app",stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL);time.sleep(1)
ok=[];falha=[]
def chk(nome,c):(ok if c else falha).append(nome);print(("OK  " if c else "FALHA ")+nome,flush=True)
ARGS=["--no-sandbox","--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader","--ignore-gpu-blocklist"]
U="/mnt/user-data/uploads/"
PACS=[U+"15a8484b-PeaPu_Battle_Basics_EA.dungeondraft_pack",U+"PeaPu_Battle_Cyberpunk_Exteriors_01_Streets.dungeondraft_pack",U+"TCM_Highway_Signage.dungeondraft_pack",U+"0d332e36-PeaPu_Battle_Sci-Fi_Interiors_01_Spaceship.dungeondraft_pack"]
async def main():
    try:
        async with async_playwright() as p:
            b=await p.chromium.launch(executable_path="/usr/bin/google-chrome",args=ARGS)
            ctx=await b.new_context(viewport={"width":1400,"height":860},accept_downloads=True);pg=await ctx.new_page();errs=[];pg.on("pageerror",lambda e:errs.append(str(e.stack)[:400]))
            await pg.goto("http://127.0.0.1:8824/index.html");await pg.wait_for_timeout(1500)
            await pg.click(".rail button[data-sec=maps]");await pg.click(".shead button.primary");await pg.click(".mitem >> text=Mapa de batalha");await pg.wait_for_timeout(2500)
            await pg.set_input_files(".bt-wrap input[accept='.dungeondraft_pack']",PACS);await pg.wait_for_function("()=>window.AtlasArtes&&AtlasArtes.estado().conectada&&!AtlasArtes.estado().lendo",timeout=180000)
            st=await pg.evaluate("()=>AtlasArtes.estado()");print(st["pacotes"],st["artes"])
            await pg.click("button[aria-label^='Minhas artes']");await pg.wait_for_timeout(400)
            await pg.click(".bt-catal button >> text=Analisar artes")
            await pg.wait_for_function("()=>/Catálogo pronto/.test(document.querySelector('.bt-catal').innerText)",timeout=900000)
            await pg.click(".bt-catal button >> text=Catálogo para IA");await pg.wait_for_timeout(200)
            async with pg.expect_download() as d:await pg.click(".bt-catopc button >> text=Baixar catálogo v3")
            dl=await d.value;raw=open(await dl.path(),"rb").read();open("/tmp/catalogo_v3.zip","wb").write(raw);Z=zipfile.ZipFile(io.BytesIO(raw))
            nomes=Z.namelist();print(nomes);chk("tem LEIA-ME, índice e kits",{"LEIA-ME.md","00-indice.md","01-kits.md"}<=set(nomes))
            pacs=[n for n in nomes if n.startswith("pacotes/")];chk("um arquivo por pacote",len({n.split("-")[0] for n in pacs})==st["pacotes"])
            I=Z.read("00-indice.md").decode();K=Z.read("01-kits.md").decode()
            print(I[:300]);chk("índice pequeno",len(I)/3.6<15000);chk("kits com ambientes",K.count("\n## ")>=3)
            # soma das artes nas secoes dos pacotes = total
            tot=0
            for n in pacs:
                for m in re.finditer(r"^## .+? · (\d+) artes?$",Z.read(n).decode(),re.M):tot+=int(m.group(1))
            print("artes nas seções",tot);chk("todas as artes nos arquivos de pacote",tot==st["artes"])
            # os exemplos do indice e dos kits existem de verdade
            ids=dict(re.findall(r"^(P\d+) · .+? · id (\S+) ",I,re.M));ext=dict(re.findall(r"^(P\d+) · .+? · \.(\w+)",I,re.M))
            ex=re.findall(r"ex\. (P\d+) (textures/\S+)",I)+re.findall(r"· (P\d+)(?:\.\d+)? (textures/\S+) ·",K)
            caminhos=["res://packs/"+ids[c]+"/"+r+"."+ext[c] for c,r in ex]
            achou=await pg.evaluate("cs=>cs.filter(c=>AtlasArtes.classe(c)).length",caminhos);print("exemplos",len(caminhos),"existem",achou)
            chk("exemplos com caminho real",len(caminhos)>10 and achou==len(caminhos))
            # um arquivo de pacote tem os campos novos
            P=Z.read(pacs[-1]).decode();print(P[:900]);chk("linhas com e/fr/oc",(" · e " in P) and (" · fr " in P))
            # completo v2 com classes
            async with pg.expect_download() as d:await pg.click(".bt-catal button >> text=Catálogo completo")
            J=json.loads(gzip.decompress(open(await (await d.value).path(),"rb").read()));a=J["pacotes"][0]["artes"][0];print(J["versao"],a)
            chk("completo v2 com classes",J["versao"]==2 and len(a["cl"])==5)
            # v3: fichas medidas na original (objetos) e caixa diferente da imagem toda
            v=await pg.evaluate("""async()=>{const L=AtlasArtes.buscar({cats:["objects"],todos:true}),n=Math.min(40,L.itens.length);let v3=0,crop=0;for(let i=0;i<n;i++){const c=L.item(L.itens[i]).caminho,f=await AtlasCatalogo.fichaDe(c);if(f&&f[11]===2&&f.length>=14)v3++;if(f&&(f[2]>3||f[3]>3||f[4]<252||f[5]<252))crop++}return {n,v3,crop}}""");print(v)
            chk("fichas v3 nos objetos",v["v3"]==v["n"]);chk("parte desenhada medida (não a imagem toda)",v["crop"]>=v["n"]*.3)
            T="\n".join(Z.read(n).decode() for n in nomes);chk("legenda de conjunto",("conj W|L|N|S" in T));chk("versão v3 no índice","· v3 ·" in I)
            chk("sem erros",not errs);print(errs)
            await b.close()
    finally:srv.terminate()
asyncio.run(main());print(len(ok),"ok",len(falha),"falhas",falha)
