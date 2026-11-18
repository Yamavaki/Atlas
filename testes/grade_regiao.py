# Grade das regioes: conflitos por tipo em 24 regioes
import asyncio,collections,os,sys
from playwright.async_api import async_playwright
base={"smooth":.2,"plains":.3,"poi":.5,"culture":"europa","size":1,"temp":.5,"humid":.5,"climVar":.5,"waste":.1,"races":.5,"form":"regiao","sea":.5,"islands":0,"lakes":0,"rivers":1,"relief":.65,"forest":.5,"fields":.65,"towns":6,"meander":.6,"clouds":.38,"plan":"mixed","season":"verao"}
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(executable_path="/usr/bin/google-chrome",args=["--no-sandbox","--allow-file-access-from-files"])
        pg=await b.new_page();errs=[];pg.on("pageerror",lambda e:errs.append(str(e)))
        await pg.goto("file://"+os.path.abspath(os.path.dirname(__file__))+"/qa_grade_regiao.html")
        T=collections.Counter();NM=collections.Counter();C=collections.Counter();n=0;ms=[];ex={}
        cults=["europa","leste","sul","meso","estepe","misto","eslava","mediter","antigo","celta","andes","fantasia"]
        for i in range(24):
            P=dict(base);P.update({"gv":int(sys.argv[1]) if len(sys.argv)>1 and sys.argv[1].isdigit() else 61});P.update({"seed":f"gr{i}","culture":cults[i%12],"towns":[4,8,12][i%3],"form":["regiao","continente","ilha"][i%3],"lakes":i%2,"poi":[.3,.6][i%2]})
            r=await pg.evaluate("""P=>{const x=run(P);if(x.err)return {err:x.err};const t0=performance.now();const G=AtlasMundo.deRegiao(W,AtlasAssets);const ms=performance.now()-t0;const L=G.lista();return {ms,L:L.map(c=>[c.tipo,c.n,Math.round(c.x),Math.round(c.y),G.objs[c.a].nome+(c.b!=null?' x '+G.objs[c.b].nome:'')])}}""",P)
            if r.get("err"):print("ERRO",P["seed"],r["err"]);continue
            n+=1;ms.append(r["ms"])
            for c in r["L"]:
                T[c[0]]+=1;C[c[0]]+=c[1];ex.setdefault(c[0],(P["seed"],c[2],c[3],c[4]));NM[c[0]+' | '+c[4]]+=1
        print(f"== grade de regiões: {n} regiões, erros de página {len(errs)}, montagem {int(min(ms))}–{int(max(ms))} ms")
        for k,v in T.most_common():print(f"  {k}: {v} casos, {C[k]} células   ex: {ex[k]}")
        if '-v' in sys.argv:
            for k,v in NM.most_common(20):print('   ',v,k)
        await b.close()
asyncio.run(main())
