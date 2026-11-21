// Atlas - Modo Batalha: formatos de pincel para pintar as mascaras das camadas.
// Cada formato e uma imagem em tons de cinza (branco = pinta). Os do Atlas sao desenhados aqui; os do usuario
// vem de imagens ou de um .zip e ficam guardados no navegador (IndexedDB "atlas-pinceis").
const T=128;
// ruido de valor com semente, para os formatos do Atlas
function ruido(sem){const P=new Uint8Array(512);let s=sem*7919+1;const p=[...Array(256).keys()];for(let i=255;i>0;i--){s=(s*16807)%2147483647;const j=s%(i+1);[p[i],p[j]]=[p[j],p[i]]}for(let i=0;i<512;i++)P[i]=p[i&255];
  const h=(x,y)=>P[(P[x&255]+y)&255]/255,v=(x,y)=>{const xi=Math.floor(x),yi=Math.floor(y),fx=x-xi,fy=y-yi,a=h(xi,yi),b=h(xi+1,yi),c=h(xi,yi+1),d=h(xi+1,yi+1),ux=fx*fx*(3-2*fx),uy=fy*fy*(3-2*fy);return a+(b-a)*ux+(c-a)*uy+(a-b-c+d)*ux*uy};
  return {v,fbm:(x,y)=>v(x,y)*.5+v(x*2.03,y*2.03)*.27+v(x*4.1,y*4.1)*.15+v(x*8.3,y*8.3)*.08,h}}
const ss=(a,b,x)=>{const t=Math.max(0,Math.min(1,(x-a)/(b-a)));return t*t*(3-2*t)};
const gera=fn=>{const d=new Uint8Array(T*T);for(let y=0;y<T;y++)for(let x=0;x<T;x++){const u=(x+.5)/T*2-1,v=(y+.5)/T*2-1;d[y*T+x]=Math.round(Math.max(0,Math.min(1,fn(u,v,Math.hypot(u,v))))*255)}return {w:T,h:T,d}};
let ATLAS=null;
export function pinceisAtlas(){if(ATLAS)return ATLAS;const R1=ruido(1),R2=ruido(2),R3=ruido(3),R4=ruido(4);
  // pontos sorteados (respingo e pedrinhas)
  const pontos=(n,sem,rmin,rmax,esp)=>{const L=[];let s=sem;const r=()=>{s=(s*16807)%2147483647;return s/2147483647};for(let i=0;i<n;i++){const a=r()*6.283,d=Math.pow(r(),esp)*.9;L.push([Math.cos(a)*d,Math.sin(a)*d,rmin+(rmax-rmin)*r()])}return L};
  const resp=pontos(70,77,.015,.09,1.6),pedr=pontos(38,91,.06,.16,.8);
  ATLAS=[
    {k:"atlas:redondo",nome:"Redondo"},
    {k:"atlas:nuvem",nome:"Nuvem",...gera((u,v,r)=>ss(1,.35,r)*ss(.3,.62,R1.fbm(u*3+5,v*3+5)+.25*(1-r)))},
    {k:"atlas:manchas",nome:"Manchas",...gera((u,v,r)=>ss(1,.55,r)*ss(.48,.56,R2.fbm(u*5+2,v*5+9)))},
    {k:"atlas:seco",nome:"Seco",...gera((u,v,r)=>{const fio=R3.v(u*2+3,v*26+1),len=R3.v(u*1.5+9,v*6);return ss(1,.6,Math.max(Math.abs(u)*.85,Math.abs(v)*1.6))*ss(.45,.62,fio*.7+len*.45)})},
    {k:"atlas:respingo",nome:"Respingo",...gera((u,v)=>{let m=0;for(const [x,y,rr] of resp){const d=Math.hypot(u-x,v-y);m=Math.max(m,ss(rr,rr*.6,d))}return m})},
    {k:"atlas:granulado",nome:"Granulado",...gera((u,v,r)=>ss(1,.3,r)*(R4.h(Math.floor((u+1)*40),Math.floor((v+1)*40))>.55?1:0))},
    {k:"atlas:pedrinhas",nome:"Pedrinhas",...gera((u,v)=>{let m=0;for(const [x,y,rr] of pedr){const d=Math.hypot((u-x)*1.15,v-y);m=Math.max(m,ss(rr,rr*.75,d))}return m})},
    {k:"atlas:borda",nome:"Borda rasgada",...gera((u,v,r)=>ss(.02,-.02,r-(.72+.22*(R1.fbm(Math.atan2(v,u)*1.6+4,1)-.5)*2)))},
    {k:"atlas:musgo",nome:"Musgo",...gera((u,v,r)=>ss(1,.45,r)*ss(.5,.62,R2.fbm(u*9+1,v*9+3))*(.6+.4*R3.v(u*20,v*20)))}];
  return ATLAS}
// ---------- pinceis do usuario ----------
const DB="atlas-pinceis";let pdb=null;
const db=()=>pdb||(pdb=new Promise((ok,er)=>{const r=indexedDB.open(DB,1);r.onupgradeneeded=()=>r.result.createObjectStore("p",{keyPath:"k"});r.onsuccess=()=>ok(r.result);r.onerror=()=>er(r.error)}));
const tx=async(modo,fn)=>{const d=await db();return new Promise((ok,er)=>{const t=d.transaction("p",modo),s=t.objectStore("p");let v;const q=fn(s);if(q)q.onsuccess=()=>{v=q.result};t.oncomplete=()=>ok(v);t.onerror=()=>er(t.error)})};
let MEUS=null;const ouvintes=new Set();const avisa=()=>{for(const f of ouvintes)try{f()}catch(e){}};
export const ouvir=f=>{ouvintes.add(f);return ()=>ouvintes.delete(f)};
// pinceis extras que vem junto com o app (pasta pinceis-extra, so na versao publicada; o repositorio nao traz)
let EXTRAS=null;
async function carregaExtras(){if(EXTRAS)return EXTRAS;EXTRAS=[];try{const base=new URL("./pinceis-extra/",import.meta.url),r=await fetch(new URL("indice.json",base));if(!r.ok)return EXTRAS;const L=await r.json();
    for(const it of L){try{const bl=await (await fetch(new URL(it.arq,base))).blob(),bm=await createImageBitmap(bl),c=document.createElement("canvas");c.width=bm.width;c.height=bm.height;const g=c.getContext("2d",{willReadFrequently:true});g.drawImage(bm,0,0);const px=g.getImageData(0,0,bm.width,bm.height).data,d=new Uint8Array(bm.width*bm.height);for(let i=0;i<d.length;i++)d[i]=px[i*4];EXTRAS.push({k:it.k,nome:it.nome,w:bm.width,h:bm.height,d,extra:1})}catch(e){}}}catch(e){}return EXTRAS}
export async function carregar(){await carregaExtras();if(MEUS)return MEUS;try{MEUS=(await tx("readonly",s=>s.getAll()))||[]}catch(e){MEUS=[]}MEUS.sort((a,b)=>a.nome.localeCompare(b.nome,"pt-BR",{numeric:true}));avisa();return MEUS}
export const meus=()=>MEUS||[];
export const extras=()=>EXTRAS||[];
export const todos=()=>pinceisAtlas().concat(extras(),meus());
export const pincel=k=>todos().find(p=>p.k===k)||null;
export async function apagar(k){await tx("readwrite",s=>s.delete(k));MEUS=(MEUS||[]).filter(p=>p.k!==k);avisa()}
// imagem -> tons de cinza (branco = pinta). Fundo claro (pincel escuro no branco) e invertido. Maior lado: 256 px
export async function deImagem(blob,nome){const bm=await createImageBitmap(blob),k=Math.min(1,256/Math.max(bm.width,bm.height)),w=Math.max(1,Math.round(bm.width*k)),h=Math.max(1,Math.round(bm.height*k)),c=document.createElement("canvas");c.width=w;c.height=h;const g=c.getContext("2d",{willReadFrequently:true});g.imageSmoothingQuality="high";g.drawImage(bm,0,0,w,h);bm.close&&bm.close();
  const px=g.getImageData(0,0,w,h).data,d=new Uint8Array(w*h);let borda=0,nb=0;for(let i=0;i<w*h;i++){const L=(px[i*4]*.299+px[i*4+1]*.587+px[i*4+2]*.114)*px[i*4+3]/255;d[i]=Math.round(L);const x=i%w,y=(i/w)|0;if(x===0||y===0||x===w-1||y===h-1){borda+=L;nb++}}
  // sem transparencia e com a borda clara: o desenho e escuro no fundo branco
  let temAlfa=false;for(let i=3;i<px.length;i+=4)if(px[i]<250){temAlfa=true;break}
  if(!temAlfa&&nb&&borda/nb>128)for(let i=0;i<d.length;i++)d[i]=255-d[i];
  // com transparencia: a forma esta no alfa (a cor do desenho nao importa)
  if(temAlfa)for(let i=0;i<w*h;i++)d[i]=px[i*4+3];
  return {k:"meu:"+nome+":"+Date.now().toString(36)+Math.random().toString(36).slice(2,6),nome:nome.replace(/\.[a-z0-9]+$/i,"").replace(/^\d+[_ -]*/,"").replace(/[_-]+/g," ").trim()||"Pincel",w,h,d}}
// .zip simples (sem senha): le o indice central e abre cada arquivo (guardado ou deflate)
export async function lerZip(file){const buf=new Uint8Array(await file.arrayBuffer()),dv=new DataView(buf.buffer);let e=-1;for(let i=buf.length-22;i>=Math.max(0,buf.length-65557);i--)if(dv.getUint32(i,true)===0x06054b50){e=i;break}if(e<0)throw new Error("O arquivo .zip de pincéis está incompleto.");
  const n=dv.getUint16(e+10,true);let p=dv.getUint32(e+16,true);const out=[];
  for(let i=0;i<n;i++){if(dv.getUint32(p,true)!==0x02014b50)break;const met=dv.getUint16(p+10,true),cs=dv.getUint32(p+20,true),nl=dv.getUint16(p+28,true),xl=dv.getUint16(p+30,true),cl=dv.getUint16(p+32,true),lo=dv.getUint32(p+42,true),nome=new TextDecoder().decode(buf.subarray(p+46,p+46+nl));p+=46+nl+xl+cl;
    if(nome.endsWith("/")||!/\.(png|webp|jpe?g|gif|bmp)$/i.test(nome)||/(^|\/)__MACOSX\//.test(nome))continue;const ln=dv.getUint16(lo+26,true),lx=dv.getUint16(lo+28,true),ini=lo+30+ln+lx,dados=buf.subarray(ini,ini+cs);
    let bl;if(met===0)bl=new Blob([dados]);else if(met===8)bl=await new Response(new Blob([dados]).stream().pipeThrough(new DecompressionStream("deflate-raw"))).blob();else continue;out.push({nome:nome.split("/").pop(),blob:bl})}
  return out}
// importa imagens e .zip; devolve quantos entraram
export async function importar(files,progresso){await carregar();const lista=[];for(const f of files){if(/\.zip$/i.test(f.name)){try{lista.push(...await lerZip(f))}catch(e){console.warn("zip",e)}}else if(/^image\//.test(f.type)||/\.(png|webp|jpe?g)$/i.test(f.name))lista.push({nome:f.name,blob:f})}
  let n=0;for(const it of lista){try{const p=await deImagem(it.blob,it.nome);await tx("readwrite",s=>s.put(p));MEUS.push(p);n++;if(progresso)progresso(n,lista.length)}catch(e){console.warn("pincel",it.nome,e)}}
  MEUS.sort((a,b)=>a.nome.localeCompare(b.nome,"pt-BR",{numeric:true}));avisa();return n}
// miniatura (branco no escuro)
export function miniatura(p,t){const c=document.createElement("canvas");c.width=t;c.height=t;const g=c.getContext("2d");if(!p.d){const r=g.createRadialGradient(t/2,t/2,0,t/2,t/2,t*.45);r.addColorStop(0,"#fff");r.addColorStop(.6,"#fff");r.addColorStop(1,"rgba(255,255,255,0)");g.fillStyle=r;g.fillRect(0,0,t,t);return c}
  const s=document.createElement("canvas");s.width=p.w;s.height=p.h;const sg=s.getContext("2d"),im=sg.createImageData(p.w,p.h);for(let i=0;i<p.d.length;i++){im.data[i*4]=im.data[i*4+1]=im.data[i*4+2]=255;im.data[i*4+3]=p.d[i]}sg.putImageData(im,0,0);const k=t/Math.max(p.w,p.h);g.drawImage(s,(t-p.w*k)/2,(t-p.h*k)/2,p.w*k,p.h*k);return c}
// valor do pincel em (u, v) de -1 a 1 (bilinear); fora = 0
export function amostra(p,u,v,h){if(h!=null){const b=amostra(p,u,v);if(b<=0)return 0;const lo=.5*h*.96,hi=1-lo,t=Math.max(0,Math.min(1,(b-lo)/(hi-lo))),k=t*t*(3-2*t),r=Math.hypot(u,v),q=Math.max(0,Math.min(1,(r-.45)/.55)),cai=1-q*q*(3-2*q);return k*(cai+(1-cai)*h)}const s=Math.max(p.w,p.h),x=(u*.5+.5)*s-(s-p.w)/2-.5,y=(v*.5+.5)*s-(s-p.h)/2-.5;if(x<-1||y<-1||x>p.w||y>p.h)return 0;const x0=Math.floor(x),y0=Math.floor(y),fx=x-x0,fy=y-y0,g=(xx,yy)=>xx<0||yy<0||xx>=p.w||yy>=p.h?0:p.d[yy*p.w+xx];
  return (g(x0,y0)*(1-fx)*(1-fy)+g(x0+1,y0)*fx*(1-fy)+g(x0,y0+1)*(1-fx)*fy+g(x0+1,y0+1)*fx*fy)/255}
