# Verificacoes das etapas 5 a 7 (muralha, portoes, ruas, pontes, escadas, cais) sobre a grade do mundo.
import asyncio,json,sys,collections
from playwright.async_api import async_playwright
JS=r"""P=>{run(P);const G=AtlasMundo.deCidade(C,AtlasAssets),U=AtlasMundo.USO,R=[];
 const at=(x,y)=>{const k=G.idx(x,y);return k<0?null:{u:G.uso[k],a:G.agua[k],l:G.andar[k]}};
 const via=c=>c&&(c.u===U.rua||c.u===U.estrada||c.u===U.praca||c.u===U.ponte||c.u===U.cais||c.u===U.escada||c.u===U.portao);
 const segD=(px,py,a,b)=>{const dx=b[0]-a[0],dy=b[1]-a[1],l=dx*dx+dy*dy||1;let t=((px-a[0])*dx+(py-a[1])*dy)/l;t=Math.max(0,Math.min(1,t));return Math.hypot(px-a[0]-t*dx,py-a[1]-t*dy)};
 // portoes: na linha da muralha e com rua dos dois lados
 for(const g of C.gates||[]){let nd=C.nodes[g];if(!nd)continue;let dm=1e9,seg=null;for(const w of C.walls||[]){if(!w.pts)continue;const n=w.pts.length;for(let i=0;i<n-(w.closed?0:1);i++){const a=w.pts[i],b=w.pts[(i+1)%n],d=segD(nd.x,nd.y,a,b);if(d<dm){dm=d;seg=[a,b]}}}
   if(!C.WALLON)continue;if(dm>24){R.push(["portão sem muralha",nd.x,nd.y,Math.round(dm)]);continue}const pa=seg[0],pb=seg[1],tt=Math.max(0,Math.min(1,((nd.x-pa[0])*(pb[0]-pa[0])+(nd.y-pa[1])*(pb[1]-pa[1]))/((pb[0]-pa[0])**2+(pb[1]-pa[1])**2||1)));nd={x:pa[0]+(pb[0]-pa[0])*tt,y:pa[1]+(pb[1]-pa[1])*tt};const l=Math.hypot(seg[1][0]-seg[0][0],seg[1][1]-seg[0][1]),nx=-(seg[1][1]-seg[0][1])/l,ny=(seg[1][0]-seg[0][0])/l;
   for(const s of[1,-1]){let ok=false;for(const d of[9,12,15,18])if(via(at(nd.x+nx*d*s,nd.y+ny*d*s)))ok=true;if(!ok){const c=at(nd.x+nx*12*s,nd.y+ny*12*s);if(!(c&&c.a))R.push(["portão sem rua de um lado",nd.x,nd.y,s])}}}
 // pontes: rua nas duas cabecas
 for(const b of C.bridgesR||[]){const l=Math.hypot(b.b[0]-b.a[0],b.b[1]-b.a[1])||1,ux=(b.b[0]-b.a[0])/l,uy=(b.b[1]-b.a[1])/l;for(const [e,s] of[[b.a,-1],[b.b,1]]){let ok=false;for(const d of[2,4,6,8,10]){const c=at(e[0]+ux*d*s,e[1]+uy*d*s);if(c&&!c.a&&via(c))ok=true}if(!ok)R.push(["ponte sem rua na cabeça",e[0],e[1]])}}
 // escadas e rampas: ligam dois andares vizinhos, sem agua
 for(const z of C.STR||[]){const a=at(z.x-z.dx*10,z.y-z.dy*10),b=at(z.x+z.dx*10,z.y+z.dy*10);if(!a||!b)continue;if(a.a||b.a)R.push(["escada na água",z.x,z.y]);else if(a.l>=0&&b.l>=0&&Math.abs(a.l-b.l)!==1)R.push(["escada não liga andares vizinhos",z.x,z.y,a.l,b.l])}
 // cais: trechos repetidos
 const Q=(C._qsegs||[]).filter(q=>!q.off);for(let i=0;i<Q.length;i++)for(let j=i+1;j<Q.length;j++){const p=Q[i],q=Q[j],m=[(q.a[0]+q.b[0])/2,(q.a[1]+q.b[1])/2];if(segD(m[0],m[1],p.a,p.b)<2.5&&Math.abs(Math.hypot(p.b[0]-p.a[0],p.b[1]-p.a[1])-Math.hypot(q.b[0]-q.a[0],q.b[1]-q.a[1]))<20)R.push(["cais duplicado",m[0],m[1]])}
 // muralha: pontas soltas (nao na agua, nao em outra muralha)
 for(const w of C.walls||[]){if(!w.pts||w.closed||w.pts.length<2)continue;for(const e of[w.pts[0],w.pts[w.pts.length-1]]){let ok=false;for(let a=0;a<16&&!ok;a++)for(const d of[3,6,9,12]){const c=at(e[0]+Math.cos(a*.39)*d,e[1]+Math.sin(a*.39)*d);if(c&&c.a)ok=true}if(!ok&&!(C.walls.some(v=>v!==w&&v.pts&&v.pts.some(p=>Math.hypot(p[0]-e[0],p[1]-e[1])<6))))R.push(["muralha com ponta solta",e[0],e[1]])}}
 return R}"""
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(executable_path="/usr/bin/google-chrome",args=["--no-sandbox","--allow-file-access-from-files"])
        pg=await b.new_page();errs=[];pg.on("pageerror",lambda e:errs.append(str(e)))
        await pg.goto("file:///"+__import__('os').path.abspath(__import__('os').path.dirname(__file__))+"/qa_grade.html")
        if len(sys.argv)>1:await pg.evaluate("s=>{(0,eval)(s)}",open(sys.argv[1]).read())
        tot=collections.Counter();n=0;ex={}
        sites=["interior","rio","costa","ilha","lago","peninsula","colina","delta"];cults=["humano","orc","japones","deserto","pantano","anao","elfo","vapor"]
        for i in range(48):
            P={"site":sites[i%8],"seed":f"inv-{i}","size":[16,22,28,34,40,44][i%6],"culture":cults[(i*3)%8],"relief":[.2,.5,.8,1][i%4],"terraces":i%3!=0,"wall":["curva","reta","curva","nenhuma"][i%4],"labels":False}
            try:r=await pg.evaluate(JS,P)
            except Exception as e:print("ERRO",P["seed"],str(e)[:200]);continue
            n+=1
            for x in r:tot[x[0]]+=1;ex.setdefault(x[0],(P["seed"],P["site"],x[1:]))
        print(f"== invariantes: {n} cidades, erros de página {len(errs)}")
        for k,v in tot.most_common():print(f"  {k}: {v}   ex: {ex[k]}")
        await b.close()
asyncio.run(main())
