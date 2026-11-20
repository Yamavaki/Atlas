// Atlas - Modo Batalha: exportar. Imagem por andar (em pedacos, para mapas grandes), cena do Foundry, arquivo .atlasmap e um .zip simples.
import {criaRender} from "./render.js";
import {trajeto,FONTES,tipoPortal} from "./modelo.js";

// ---------- texto (o editor desenha do mesmo jeito) ----------
const hex=c=>"#"+[0,1,2].map(i=>Math.round(Math.max(0,Math.min(1,c[i]))*255).toString(16).padStart(2,"0")).join("");
export const fonteDe=t=>(FONTES.find(f=>f[0]===t.fonte)||FONTES[0])[2];
export function desenhaTexto(gc,t,tl,z){const p=tl(t.x,t.y),px=t.tam*z;if(px<2)return;gc.save();gc.translate(p[0],p[1]);gc.rotate(t.r||0);gc.font=px+"px "+fonteDe(t);gc.textAlign="center";gc.textBaseline="middle";const L=(t.txt||"").split("\n"),lh=px*1.15;let mw=0;
  L.forEach((s,i)=>{const y=(i-(L.length-1)/2)*lh;mw=Math.max(mw,gc.measureText(s).width);if(t.contorno){gc.lineJoin="round";gc.lineWidth=Math.max(1,px*.14);gc.strokeStyle="rgba(239,231,208,.92)";gc.strokeText(s,0,y)}gc.fillStyle=hex(t.cor||[0,0,0]);gc.fillText(s,0,y)});gc.restore();t.lw=mw/z;t.lh=L.length*1.15*t.tam}

// ---------- imagem de um andar ----------
// px = pixels por quadrado. Desenha em pedacos de ate 2048 px e junta numa tela 2D (os textos vao por cima).
export async function imagemAndar(M,i,o){o=o||{};const px=o.px||100,W=Math.round(M.larg*px),H=Math.round(M.alt*px),cv=document.createElement("canvas");let T=2048;cv.width=T;cv.height=T;
  const R=criaRender(cv);if(!R)throw new Error("Este navegador não liberou o WebGL2 para exportar.");T=Math.min(T,R.gl.getParameter(R.gl.MAX_VIEWPORT_DIMS)[0]||T);cv.width=T;cv.height=T;if(o.reais&&o.reais.size)R.usarReais(o.reais);R.carregar(M);
  const big=document.createElement("canvas");big.width=W;big.height=H;const g=big.getContext("2d");
  // pedacos com margem: as sombras desfocadas que passam da borda de um pedaco nao fazem emenda
  const mg=W>T||H>T?Math.min(256,Math.ceil(px*.75)):0,S=T-2*mg;
  for(let ty=0;ty<H;ty+=S)for(let tx=0;tx<W;tx+=S){const cam={x:(tx-mg+T/2)/px,y:(ty-mg+T/2)/px,z:px};R.desenhar(cam,i,{luz:o.luz!==false,grade:!!o.grade,telhados:o.telhados!==false});R.terminar();g.drawImage(cv,mg,mg,Math.min(S,W-tx),Math.min(S,H-ty),tx,ty,Math.min(S,W-tx),Math.min(S,H-ty));if(o.progresso)o.progresso((ty*W+tx)/(W*H));await new Promise(r=>setTimeout(r,0))}
  if(o.textos!==false)for(const t of M.andares[i].textos||[])desenhaTexto(g,t,(x,y)=>[x*px,y*px],px);
  try{const ex=R.gl.getExtension("WEBGL_lose_context");if(ex)ex.loseContext()}catch(e){}
  const tipo=o.formato==="png"?"image/png":"image/webp";return await new Promise((ok,er)=>big.toBlob(b=>b?ok(b):er(new Error("Não foi possível gerar a imagem.")),tipo,.92))}

// ---------- cena do Foundry ----------
// Paredes seguem o caminho arredondado; portas e janelas cortam a parede e entram como pecas proprias. Luzes com luz plena e penumbra.
const SENSE={NONE:0,LIMITED:10,NORMAL:20};
export function cenaFoundry(M,i,o){o=o||{};const A=M.andares[i],px=o.px||100,dist=o.distancia||1.5,un=o.unidade||"m",walls=[],lights=[],P=v=>Math.round(v*px*100)/100;
  for(const w of A.paredes||[]){const Q=trajeto(w),n=Q.length;if(n<2)continue;const bl=w.sombra===false;
    const pts=(A.portais||[]).filter(q=>q.parede===w.id&&q.d!=null).map(q=>({q,a:q.d-q.raio,b:q.d+q.raio}));let acc=0;
    for(let k=0;k<n-(w.laco?0:1);k++){const a=Q[k],b=Q[(k+1)%n],L=Math.hypot(b[0]-a[0],b[1]-a[1]);if(L<1e-9)continue;let cortes=[[0,L]];
      for(const z of pts){const u0=z.a-acc,u1=z.b-acc;if(u1<=0||u0>=L)continue;const N=[];for(const [s0,s1] of cortes){if(u1<=s0||u0>=s1){N.push([s0,s1]);continue}if(u0>s0)N.push([s0,u0]);if(u1<s1)N.push([u1,s1])}cortes=N}
      const ux=(b[0]-a[0])/L,uy=(b[1]-a[1])/L;for(const [s0,s1] of cortes)if(s1-s0>1e-4)walls.push({c:[P(a[0]+ux*s0),P(a[1]+uy*s0),P(a[0]+ux*s1),P(a[1]+uy*s1)],move:SENSE.NORMAL,sight:bl?SENSE.NONE:SENSE.NORMAL,light:bl?SENSE.NONE:SENSE.NORMAL,sound:SENSE.NORMAL,door:0,ds:0,dir:0});acc+=L}}
  for(const q of A.portais||[]){const a=[q.x-q.dx*q.raio,q.y-q.dy*q.raio],b=[q.x+q.dx*q.raio,q.y+q.dy*q.raio],tp=tipoPortal(q,M.texturas),c=[P(a[0]),P(a[1]),P(b[0]),P(b[1])];
    if(tp==="janela")walls.push({c,move:SENSE.NORMAL,sight:SENSE.NONE,light:SENSE.NONE,sound:SENSE.NORMAL,door:0,ds:0,dir:0});
    else walls.push({c,move:SENSE.NORMAL,sight:SENSE.NORMAL,light:SENSE.NORMAL,sound:SENSE.NORMAL,door:1,ds:q.fechado===false?1:0,dir:0})}
  for(const l of A.luzes||[]){const cl=l.claro==null?l.raio*.45:l.claro;lights.push({x:P(l.x),y:P(l.y),rotation:0,walls:l.sombras!==false,vision:false,hidden:false,config:{bright:Math.round(cl*dist*100)/100,dim:Math.round(l.raio*dist*100)/100,color:hex(l.c),alpha:.4,luminosity:.5,angle:360,attenuation:.5,coloration:1,animation:{type:null,speed:5,intensity:5}}})}
  const am=A.ambiente||[1,1,1],dk=Math.round((1-Math.max(am[0],am[1],am[2]))*100)/100;
  return {name:(M.nome||"Mapa")+(M.andares.length>1?" — "+A.nome:""),width:Math.round(M.larg*px),height:Math.round(M.alt*px),padding:0,background:{src:o.imagem||"",offsetX:0,offsetY:0},backgroundColor:"#1b1814",
    grid:{type:1,size:px,distance:dist,units:un,color:"#000000",alpha:.25},tokenVision:true,fog:{exploration:true},environment:{darknessLevel:dk,globalLight:{enabled:dk<.25}},darkness:dk,
    walls,lights,drawings:[],notes:[],sounds:[],tiles:[],tokens:[],navigation:true,flags:{atlas:{versao:o.versao||"",andar:i,andares:M.andares.length}}}}

// ---------- arquivo .atlasmap (mascaras em base64) ----------
const b64=u8=>{let s="";for(let i=0;i<u8.length;i+=0x8000)s+=String.fromCharCode.apply(null,u8.subarray(i,i+0x8000));return btoa(s)};
export const atlasmapTexto=M=>JSON.stringify(M,(k,v)=>v instanceof Uint8Array?{$b64:b64(v)}:v);

// ---------- zip simples (sem compressao) ----------
const CRC=(()=>{const t=new Uint32Array(256);for(let n=0;n<256;n++){let c=n;for(let k=0;k<8;k++)c=c&1?0xEDB88320^(c>>>1):c>>>1;t[n]=c>>>0}return t})();
const crc32=u=>{let c=0xFFFFFFFF;for(let i=0;i<u.length;i++)c=CRC[(c^u[i])&255]^(c>>>8);return (c^0xFFFFFFFF)>>>0};
export function zip(arqs){const enc=new TextEncoder(),partes=[],dir=[];let off=0;
  for(const a of arqs){const nome=enc.encode(a.nome),d=a.dados,c=crc32(d),h=new DataView(new ArrayBuffer(30));h.setUint32(0,0x04034b50,true);h.setUint16(4,20,true);h.setUint16(6,0x0800,true);h.setUint16(8,0,true);h.setUint32(14,c,true);h.setUint32(18,d.length,true);h.setUint32(22,d.length,true);h.setUint16(26,nome.length,true);
    partes.push(new Uint8Array(h.buffer),nome,d);const e=new DataView(new ArrayBuffer(46));e.setUint32(0,0x02014b50,true);e.setUint16(4,20,true);e.setUint16(6,20,true);e.setUint16(8,0x0800,true);e.setUint32(16,c,true);e.setUint32(20,d.length,true);e.setUint32(24,d.length,true);e.setUint16(28,nome.length,true);e.setUint32(42,off,true);dir.push(new Uint8Array(e.buffer),nome);off+=30+nome.length+d.length}
  let tam=0;for(const x of dir)tam+=x.length;const f=new DataView(new ArrayBuffer(22));f.setUint32(0,0x06054b50,true);f.setUint16(8,arqs.length,true);f.setUint16(10,arqs.length,true);f.setUint32(12,tam,true);f.setUint32(16,off,true);
  return new Blob([...partes,...dir,new Uint8Array(f.buffer)],{type:"application/zip"})}
export const nomeArquivo=s=>(s||"mapa").normalize("NFD").replace(/[̀-ͯ]/g,"").replace(/[^A-Za-z0-9]+/g,"-").replace(/^-|-$/g,"").toLowerCase()||"mapa";
