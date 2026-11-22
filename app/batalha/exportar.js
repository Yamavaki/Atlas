// Atlas - Modo Batalha: exportar. Imagem por andar (em pedacos, para mapas grandes), cena do Foundry, arquivo .atlasmap e um .zip simples.
import {criaRender} from "./render.js";
import {trajeto,FONTES,tipoPortal} from "./modelo.js";
import {trajetoCaminho} from "./vetor.js";
import {objetoDe} from "./arte.js";
import {fxLuz} from "./modelo.js";

// ---------- texto (o editor desenha do mesmo jeito) ----------
const hex=c=>"#"+[0,1,2].map(i=>Math.round(Math.max(0,Math.min(1,c[i]))*255).toString(16).padStart(2,"0")).join("");
export const fonteDe=t=>(FONTES.find(f=>f[0]===t.fonte)||FONTES[0])[2];
export function desenhaTexto(gc,t,tl,z){const p=tl(t.x,t.y),px=t.tam*z;if(px<2)return;gc.save();gc.translate(p[0],p[1]);gc.rotate(t.r||0);gc.font=px+"px "+fonteDe(t);gc.textAlign="center";gc.textBaseline="middle";const L=(t.txt||"").split("\n"),lh=px*1.15;let mw=0;
  L.forEach((s,i)=>{const y=(i-(L.length-1)/2)*lh;mw=Math.max(mw,gc.measureText(s).width);if(t.contorno){gc.lineJoin="round";gc.lineWidth=Math.max(1,px*.14);gc.strokeStyle="rgba(239,231,208,.92)";gc.strokeText(s,0,y)}gc.fillStyle=hex(t.cor||[0,0,0]);gc.fillText(s,0,y)});gc.restore();t.lw=mw/z;t.lh=L.length*1.15*t.tam}

// ---------- imagem de um andar ----------
// px = pixels por quadrado. Desenha em pedacos de ate 2048 px e junta numa tela 2D (os textos vao por cima).
export async function imagemAndar(M,i,o){o=o||{};const px=o.px||100,W=Math.round(M.larg*px),H=Math.round(M.alt*px),cv=document.createElement("canvas");let T=2048;cv.width=T;cv.height=T;
  const R=criaRender(cv,{alfa:!!o.transparente});if(!R)throw new Error("Este navegador não oferece WebGL2, necessário para exportar.");T=Math.min(T,R.gl.getParameter(R.gl.MAX_VIEWPORT_DIMS)[0]||T);cv.width=T;cv.height=T;if(o.reais&&o.reais.size)R.usarReais(o.reais);R.carregar(M);
  const big=document.createElement("canvas");big.width=W;big.height=H;const g=big.getContext("2d");
  // pedacos com margem: as sombras desfocadas que passam da borda de um pedaco nao fazem emenda
  const mg=W>T||H>T?Math.min(256,Math.ceil(px*.75)):0,S=T-2*mg;
  for(let ty=0;ty<H;ty+=S)for(let tx=0;tx<W;tx+=S){const cam={x:(tx-mg+T/2)/px,y:(ty-mg+T/2)/px,z:px};R.desenhar(cam,i,{luz:o.luz!==false,grade:!!o.grade,telhados:o.telhados!==false,transparente:!!o.transparente,soAndar:!!o.soAndar});R.terminar();g.drawImage(cv,mg,mg,Math.min(S,W-tx),Math.min(S,H-ty),tx,ty,Math.min(S,W-tx),Math.min(S,H-ty));if(o.progresso)o.progresso((ty*W+tx)/(W*H));await new Promise(r=>setTimeout(r,0))}
  if(o.textos!==false)for(const t of M.andares[i].textos||[])desenhaTexto(g,t,(x,y)=>[x*px,y*px],px);
  try{const ex=R.gl.getExtension("WEBGL_lose_context");if(ex)ex.loseContext()}catch(e){}
  // JPEG nao tem transparencia: fundo escuro por baixo
  let saida=big;if(o.formato==="jpeg"){saida=document.createElement("canvas");saida.width=W;saida.height=H;const g2=saida.getContext("2d");g2.fillStyle="#1b1814";g2.fillRect(0,0,W,H);g2.drawImage(big,0,0)}
  const tipo=TIPOS_IMG[o.formato]||"image/webp",q=o.qualidade==null?.92:o.qualidade;return await new Promise((ok,er)=>saida.toBlob(b=>b?ok(b):er(new Error("Não foi possível gerar a imagem.")),tipo,q))}
export const TIPOS_IMG={webp:"image/webp",png:"image/png",jpeg:"image/jpeg"},EXT_IMG={webp:"webp",png:"png",jpeg:"jpg"};

// ---------- cena do Foundry ----------
// Paredes seguem o caminho arredondado; portas e janelas cortam a parede e entram como pecas proprias. Luzes com luz plena e penumbra.
const SENSE={NONE:0,LIMITED:10,NORMAL:20};
function pecasFoundry(M,i,o){const A=M.andares[i],px=o.px||100,dist=o.distancia||1.5,walls=[],lights=[],P=v=>Math.round(v*px*100)/100;
  for(const w of A.paredes||[]){const Q=trajeto(w),n=Q.length;if(n<2)continue;const bl=w.sombra===false;
    const pts=(A.portais||[]).filter(q=>q.parede===w.id&&q.d!=null).map(q=>({q,a:q.d-q.raio,b:q.d+q.raio}));let acc=0;
    for(let k=0;k<n-(w.laco?0:1);k++){const a=Q[k],b=Q[(k+1)%n],L=Math.hypot(b[0]-a[0],b[1]-a[1]);if(L<1e-9)continue;let cortes=[[0,L]];
      for(const z of pts){const u0=z.a-acc,u1=z.b-acc;if(u1<=0||u0>=L)continue;const N=[];for(const [s0,s1] of cortes){if(u1<=s0||u0>=s1){N.push([s0,s1]);continue}if(u0>s0)N.push([s0,u0]);if(u1<s1)N.push([u1,s1])}cortes=N}
      const ux=(b[0]-a[0])/L,uy=(b[1]-a[1])/L;for(const [s0,s1] of cortes)if(s1-s0>1e-4)walls.push({c:[P(a[0]+ux*s0),P(a[1]+uy*s0),P(a[0]+ux*s1),P(a[1]+uy*s1)],move:SENSE.NORMAL,sight:bl?SENSE.NONE:SENSE.NORMAL,light:bl?SENSE.NONE:SENSE.NORMAL,sound:SENSE.NORMAL,door:0,ds:0,dir:0});acc+=L}}
  for(const q of A.portais||[]){const a=[q.x-q.dx*q.raio,q.y-q.dy*q.raio],b=[q.x+q.dx*q.raio,q.y+q.dy*q.raio],tp=tipoPortal(q,M.texturas),c=[P(a[0]),P(a[1]),P(b[0]),P(b[1])];
    if(tp==="janela")walls.push({c,move:SENSE.NORMAL,sight:SENSE.NONE,light:SENSE.NONE,sound:SENSE.NORMAL,door:0,ds:0,dir:0,flags:{atlas:{portal:1}}});
    else walls.push({c,move:SENSE.NORMAL,sight:SENSE.NORMAL,light:SENSE.NORMAL,sound:SENSE.NORMAL,door:1,ds:q.fechado===false?1:0,dir:0,flags:{atlas:{portal:1}}})}
  // caminhos com "bloqueia luz" (penhasco de caverna, palicada, barranco, encosta) viram parede: bloqueiam passagem, visao e luz; o som passa
  for(const c of A.caminhos||[]){if(!c.bloqueia)continue;const Q=trajetoCaminho(c),n=Q.length;if(n<2)continue;for(let k=0;k<n-(c.laco?0:1);k++){const a=Q[k],b=Q[(k+1)%n];if(Math.hypot(b[0]-a[0],b[1]-a[1])<1e-6)continue;walls.push({c:[P(a[0]),P(a[1]),P(b[0]),P(b[1])],move:SENSE.NORMAL,sight:SENSE.NORMAL,light:SENSE.NORMAL,sound:SENSE.NONE,door:0,ds:0,dir:0,flags:{atlas:{caminho:true}}})}}
  for(const l of A.luzes||[]){const cl=l.claro==null?l.raio*.45:l.claro;lights.push({x:P(l.x),y:P(l.y),rotation:0,walls:l.sombras!==false,vision:false,hidden:false,config:{bright:Math.round(cl*dist*100)/100,dim:Math.round(l.raio*dist*100)/100,color:hex(l.c),alpha:.4,luminosity:.5,angle:360,attenuation:.5,coloration:1,animation:fxLuz(l)||{type:null,speed:5,intensity:5}}})}
  return {walls,lights}}
export function cenaFoundry(M,i,o){o=o||{};const A=M.andares[i],px=o.px||100,dist=o.distancia||1.5,un=o.unidade||"m",{walls,lights}=pecasFoundry(M,i,o);
  const am=A.ambiente||[1,1,1],dk=Math.round((1-Math.max(am[0],am[1],am[2]))*100)/100;
  return {name:(M.nome||"Mapa")+(M.andares.length>1?" — "+A.nome:""),width:Math.round(M.larg*px),height:Math.round(M.alt*px),padding:0,background:{src:o.imagem||"",offsetX:0,offsetY:0},backgroundColor:"#1b1814",
    grid:{type:1,size:px,distance:dist,units:un,color:"#000000",alpha:.25},tokenVision:true,fog:{exploration:true},environment:{darknessLevel:dk,globalLight:{enabled:dk<.25}},darkness:dk,
    walls,lights,drawings:[],notes:[],sounds:[],tiles:[],tokens:[],navigation:true,flags:{atlas:{versao:o.versao||"",andar:i,andares:M.andares.length}}}}

// ---------- cena unica com todos os andares (niveis nativos do Foundry V14) ----------
// Cada andar vira um nivel (imagem de fundo + faixa de altura); paredes, portas e luzes ficam presas ao nivel do andar delas.
const idF=()=>{const a="abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";let s="";for(let k=0;k<16;k++)s+=a[Math.floor(Math.random()*a.length)];return s};
export function cenaFoundryNiveis(M,o){o=o||{};const px=o.px||100,dist=o.distancia||1.5,un=o.unidade||"m",alt=o.alturaAndar||(un==="ft"?10:3),levels=[],walls=[],lights=[];
  M.andares.forEach((A,i)=>{const id=idF(),{walls:W,lights:L}=pecasFoundry(M,i,o);levels.push({_id:id,name:A.nome||("Andar "+(i+1)),sort:i,elevation:{bottom:i*alt,top:(i+1)*alt},background:{src:(o.imagens||[])[i]||""},foreground:{src:null},flags:{atlas:{andar:i}}});
    for(const w of W){w.levels=[id];w.flags={atlas:{andar:i}};walls.push(w)}for(const l of L){l.levels=[id];l.elevation=i*alt;l.flags={atlas:{andar:i}};lights.push(l)}});
  const A0=M.andares[0],am=A0.ambiente||[1,1,1],dk=Math.round((1-Math.max(am[0],am[1],am[2]))*100)/100;
  return {name:M.nome||"Mapa",width:Math.round(M.larg*px),height:Math.round(M.alt*px),padding:0,background:{src:(o.imagens||[])[0]||"",offsetX:0,offsetY:0},backgroundColor:"#1b1814",levels,initialLevel:levels[0]._id,
    grid:{type:1,size:px,distance:dist,units:un,color:"#000000",alpha:.25},tokenVision:true,fog:{exploration:true},environment:{darknessLevel:dk,globalLight:{enabled:dk<.25}},
    walls,lights,drawings:[],notes:[],sounds:[],tiles:[],tokens:[],navigation:true,flags:{atlas:{versao:o.versao||"",andares:M.andares.length,niveis:true}}}}

// ---------- arquivo .atlasmap (mascaras em base64) ----------
const b64=u8=>{let s="";for(let i=0;i<u8.length;i+=0x8000)s+=String.fromCharCode.apply(null,u8.subarray(i,i+0x8000));return btoa(s)};
export const atlasmapTexto=M=>JSON.stringify(M,(k,v)=>v instanceof Uint8Array?{$b64:b64(v)}:v);

import {zip} from "./zip.js";export {zip};
export const nomeArquivo=s=>(s||"mapa").normalize("NFD").replace(/[̀-ͯ]/g,"").replace(/[^A-Za-z0-9]+/g,"-").replace(/^-|-$/g,"").toLowerCase()||"mapa";

// ---------- arquivo unico para o modulo "DD2VTT URL Importer" do Foundry (.atlasvtt) ----------
// Um JSON com todos os andares. Cada andar e um Universal VTT (o mesmo formato do .dd2vtt, coordenadas em quadrados),
// com a imagem embutida (base64), mais o que o mod "Exportar para Foundry (Nauren)" do Dungeondraft grava em "nauren":
// nome e posicao do andar, moldura de cada porta e paredes que deixam a luz passar. As escadas vao numa lista propria.
const nomeArte=t=>String(t||"").split("/").pop().replace(/\.(png|webp|jpe?g)$/i,"");
const real_=t=>!!t&&!/^atlas:/.test(t);
const corUV=c=>"ff"+hex(c||[1,1,1]).slice(1);
// nome da moldura no padrao da Forgotten Adventures (Door_Frame_<Material>_<Cor>_...), que o modulo usa para escolher a folha
export function molduraDe(q,TEX){const fr=q.tq!=null&&real_(TEX[q.tq])?nomeArte(TEX[q.tq]):"",fo=real_(TEX[q.t])?nomeArte(TEX[q.t]):"";
  if(fr)return fr;if(/^(Door_Frame|Window_Sill)_/i.test(fo))return fo;const m=fo.match(/^Door_(Double_)?(.+)$/i);return m?"Door_Frame_"+(m[1]||"")+m[2]:null}
export function andarUVTT(M,i,o){o=o||{};const A=M.andares[i],TEX=M.texturas,px=o.px||100,{walls}=pecasFoundry(M,i,{px:1}),pt=c=>[{x:c[0],y:c[1]},{x:c[2],y:c[3]}];
  const los=[],obj=[],luzP=[];for(const w of walls){const f=w.flags&&w.flags.atlas;if(f&&f.portal)continue;if(f&&f.caminho){obj.push(pt(w.c));continue}los.push(pt(w.c));if(w.sight===SENSE.NONE)luzP.push(pt(w.c))}
  const portals=(A.portais||[]).map(q=>{const tp=tipoPortal(q,TEX),a={x:q.x-q.dx*q.raio,y:q.y-q.dy*q.raio},b={x:q.x+q.dx*q.raio,y:q.y+q.dy*q.raio},fr=molduraDe(q,TEX),
      soMold=tp!=="janela"&&(!!q.sm||!!fr&&/^Door_Frame_/i.test(nomeArte(TEX[q.t]))||q.tq!=null&&!real_(TEX[q.t]));
    return {position:{x:q.x,y:q.y},bounds:[a,b],rotation:Math.atan2(q.dy,q.dx),closed:tp!=="janela",freestanding:false,
      nauren:{texture:fr,opening:2*q.raio,frameOnly:tp==="janela"?null:soMold,leaf:real_(TEX[q.t])?nomeArte(TEX[q.t]):null,double:tp==="dupla"||2*q.raio>=1.6,open:q.fechado===false}}});
  const lights=(A.luzes||[]).map(l=>{const fx=fxLuz(l);return {position:{x:l.x,y:l.y},range:l.raio,intensity:1,color:corUV(l.c),shadows:l.sombras!==false,...(fx?{nauren:{animation:fx}}:{})}});
  const am=A.ambiente||[1,1,1];
  return {format:0.3,resolution:{map_origin:{x:0,y:0},map_size:{x:M.larg,y:M.alt},pixels_per_grid:px},line_of_sight:los,objects_line_of_sight:obj,portals,
    environment:{baked_lighting:true,ambient_light:corUV(am)},lights,
    nauren:{level:{label:A.nome||("Andar "+(i+1)),floor:i,index:M.andares.length-1-i,count:M.andares.length},light_walls:luzP,image_file:null,atlas:true}}}
// escadas: objetos com arte de escada; ligam o andar delas ao andar marcado em "Leva ao andar" (ou ao de cima)
// andar a que uma escada leva: o marcado (leva), senao o de cima, senao o de baixo; -1 se nao ha outro andar
export const ehEscadaCaminho=(M,c)=>/stair|escada|ladder|degrau/i.test(M.texturas[c.t]||"");
export function destinoEscada(M,i,e){let j=e.leva!=null?M.andares.findIndex(B=>B.id===e.leva):-1;if(j<0)j=i+1<M.andares.length?i+1:i-1;return j<0||j===i?-1:j}
export function escadasDe(M){const L=[],poe=(i,j,cells)=>{const a=Math.min(i,j),b=Math.max(i,j),K=new Set(cells.map(c=>c+""));
    // a mesma escada desenhada nos dois andares vira uma regiao so
    const d=L.find(s=>s.from===a&&s.to===b&&s.cells.filter(c=>K.has(c+"")).length>=Math.min(s.cells.length,cells.length)*.5);if(d){for(const c of cells)if(!d.cells.some(q=>q[0]===c[0]&&q[1]===c[1]))d.cells.push(c);return}L.push({kind:"stairs",from:a,to:b,cells})};
  M.andares.forEach((A,i)=>{for(const o of A.objetos||[]){if(objetoDe(M.texturas[o.t])!=="escada")continue;const j=destinoEscada(M,i,o);if(j<0)continue;
    const c=Math.cos(o.r||0),s=Math.sin(o.r||0),hw=(o.w||1)/2,hh=(o.h||1)/2,R_=Math.hypot(hw,hh),cells=[];
    for(let y=Math.floor(o.y-R_);y<=Math.ceil(o.y+R_);y++)for(let x=Math.floor(o.x-R_);x<=Math.ceil(o.x+R_);x++){const dx=x+.5-o.x,dy=y+.5-o.y,u=dx*c+dy*s,v=-dx*s+dy*c;if(Math.abs(u)<=hw+.25&&Math.abs(v)<=hh+.25)cells.push([x,y])}
    if(!cells.length)cells.push([Math.floor(o.x),Math.floor(o.y)]);poe(i,j,cells)}
    // escada pintada como caminho (textura de degraus): a faixa do caminho vira a area da escada, ligando ao andar de cima (ou ao marcado)
    for(const c of A.caminhos||[]){if(!ehEscadaCaminho(M,c))continue;const j=destinoEscada(M,i,c);if(j<0)continue;
      const Q=trajetoCaminho(c),n=Q.length;if(n<2)continue;const hw=(c.larg||1)/2+.15;let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9;for(const q of Q){x0=Math.min(x0,q[0]);y0=Math.min(y0,q[1]);x1=Math.max(x1,q[0]);y1=Math.max(y1,q[1])}
      const dS=(px,py,a,b)=>{const dx=b[0]-a[0],dy=b[1]-a[1],l2=dx*dx+dy*dy,t=l2?Math.max(0,Math.min(1,((px-a[0])*dx+(py-a[1])*dy)/l2)):0;return Math.hypot(px-a[0]-t*dx,py-a[1]-t*dy)},cells=[];
      for(let y=Math.floor(y0-hw);y<=Math.ceil(y1+hw);y++)for(let x=Math.floor(x0-hw);x<=Math.ceil(x1+hw);x++){let d=1e9;for(let k=0;k<n-(c.laco?0:1);k++)d=Math.min(d,dS(x+.5,y+.5,Q[k],Q[(k+1)%n]));if(d<=hw)cells.push([x,y])}
      if(cells.length)poe(i,j,cells)}});return L}
export async function arquivoAtlasVTT(M,o){o=o||{};const b64s=async blob=>{const u8=new Uint8Array(await blob.arrayBuffer());return b64(u8)};
  const floors=[];for(let i=0;i<M.andares.length;i++){const F=andarUVTT(M,i,o);if(o.imagens&&o.imagens[i]){F.image=await b64s(o.imagens[i].blob);F.image_format=o.imagens[i].formato||"webp"}floors.push(F)}
  return {format:"atlas-vtt",version:1,atlas:o.versao||"",name:M.nome||"Mapa",grid:{distance:o.distancia||1.5,units:o.unidade||"m",floorHeight:o.alturaAndar||(o.unidade==="ft"?10:3)},floors,stairs:escadasDe(M)}}
