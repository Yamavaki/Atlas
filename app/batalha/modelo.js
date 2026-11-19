// Atlas - Modo Batalha: o que existe num andar e como cada coisa se mede, se acerta com o clique e se transforma.
// Sem DOM. O editor, o gerador e (depois) o Modo Claude falam com o mapa por aqui e pelos comandos.
import {distPoli,dentro,caixaPts,pontoEm,projeta,distSeg,arredonda,RAIO_PADRAO} from "./vetor.js";
// o caminho que a parede desenha (com os cantos arredondados): portas e janelas andam sobre ele
export const trajeto=w=>arredonda(w.p,w.raio==null?RAIO_PADRAO:w.raio,w.laco,w.raios);
export const TIPOS=["objetos","luzes","textos","telhados","paredes","portais","caminhos","padroes"];
export const NOME={objetos:["objeto","objetos"],luzes:["luz","luzes"],paredes:["parede","paredes"],portais:["porta ou janela","portas e janelas"],textos:["texto","textos"],telhados:["telhado","telhados"],caminhos:["caminho","caminhos"],padroes:["forma","formas"]};
export const FUNDO={paredes:1,caminhos:1,padroes:1,telhados:1}; // clicar seleciona; arrastar sem estar selecionado abre a caixa de selecao
export const MATERIAIS_NOME={grama:"Grama",trevo:"Trevo",selva:"Selva",terra:"Terra",lama:"Lama",areia:"Areia",pedra:"Pedra",rocha:"Rocha",concreto:"Concreto",madeira:"Madeira",madeiraEscura:"Madeira escura",agua:"Água",aguaFunda:"Água funda",ladrilho:"Ladrilho",tapete:"Tapete",metal:"Metal",asfalto:"Asfalto",neve:"Neve",telha:"Telha",neutro:"Neutro"};
// artes proprias: nome na tela, tamanho padrao em quadrados e camada padrao
export const ARTES={arvore:["Árvore",3,3,400],arvoreEscura:["Árvore escura",3,3,400],pinheiro:["Pinheiro",2.5,2.5,400],palmeira:["Palmeira",3,3,400],arbusto:["Arbusto",1.5,1.5,300],samambaia:["Samambaia",1,1,200],capim:["Capim",1,1,100],flor:["Flor",.5,.5,100],cogumelo:["Cogumelo",.5,.5,100],
  pedra:["Pedra",1.5,1.5,200],seixos:["Seixos",1,1,100],tronco:["Tronco",2,1,200],toco:["Toco",1,1,200],raiz:["Raiz",1.5,1.5,100],cipo:["Cipó",2,1,300],cristal:["Cristal",1,1,200],teia:["Teia",1.5,1.5,300],ossos:["Ossos",1,1,100],pilar:["Pilar",1,1,300],ondas:["Ondas",2,1,50],vitoria:["Vitória-régia",1,1,100],
  mesa:["Mesa",2,1,200],mesaRedonda:["Mesa redonda",1.5,1.5,200],cadeira:["Cadeira",.6,.6,200],cama:["Cama",1,2,200],barril:["Barril",.8,.8,200],caixote:["Caixote",1,1,200],bau:["Baú",1,.7,200],estante:["Estante",2,.6,200],fogo:["Fogueira",1,1,200],luminaria:["Luminária",.5,.5,300],tapete:["Tapete",2,3,50],escada:["Escada",1,2,100],loucaBranca:["Louça",.7,.7,200],movel:["Móvel",1.5,.8,200],navio:["Navio",4,8,200],generico:["Marcador",1,1,200]};
// categorias da biblioteca
export const CATEGORIAS=[["natureza","Natureza"],["pedras","Pedras e ruínas"],["moveis","Móveis"],["recipientes","Baús e caixas"],["luz","Fogo e luz"],["outros","Outros"]];
const CAT={natureza:"arvore arvoreEscura pinheiro palmeira arbusto samambaia capim flor cogumelo cipo raiz tronco toco vitoria ondas",pedras:"pedra seixos cristal pilar ossos teia",moveis:"mesa mesaRedonda cadeira cama estante movel tapete escada loucaBranca",recipientes:"barril caixote bau",luz:"fogo luminaria",outros:"navio generico"};
export const categoriaDe=k=>{for(const c in CAT)if(CAT[c].split(" ").includes(k))return c;return "outros"};
export const semAcento=t=>(t||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase();
// luzes prontas: alcance (penumbra ate), luz plena, forca, cor
export const LUZES=[["vela","Vela",2,.8,.85,[1,.72,.38]],["tocha","Tocha",6,2.5,1,[1,.62,.25]],["lareira","Lareira",8,3.5,1.2,[1,.5,.18]],["lampiao","Lampião",5,2.5,1,[1,.88,.62]],["magica","Mágica",6,2,1.1,[.5,.7,1]],["lua","Luar",12,6,.6,[.72,.78,1]],["veneno","Veneno",4,1.5,1,[.45,1,.4]]];
// ambientes prontos (a cor que a luz do andar tem sem nenhuma luz acesa)
export const AMBIENTES=[["dia","Dia",[1,1,1]],["tarde","Fim de tarde",[.95,.74,.55]],["noite","Noite",[.2,.25,.42]],["interior","Interior",[.42,.38,.33]],["caverna","Caverna",[.08,.08,.11]],["breu","Breu",[0,0,0]]];
// --- medidas ---
export function cantos(o){const c=Math.cos(o.r),s=Math.sin(o.r),hw=o.w/2,hh=o.h/2;return [[-hw,-hh],[hw,-hh],[hw,hh],[-hw,hh]].map(([a,b])=>[o.x+a*c-b*s,o.y+a*s+b*c])}
const caixaTxt=e=>({x:e.x,y:e.y,r:e.r||0,w:Math.max(.3,e.lw||((e.txt||"").length*e.tam*.5)),h:e.lh||e.tam*1.2});
export function caixa(k,e){if(k==="objetos")return caixaPts(cantos(e));if(k==="textos")return caixaPts(cantos(caixaTxt(e)));if(k==="portais")return caixaPts([[e.x-e.dx*e.raio,e.y-e.dy*e.raio],[e.x+e.dx*e.raio,e.y+e.dy*e.raio]],.15);if(k==="luzes")return [e.x-.4,e.y-.4,e.x+.4,e.y+.4];return caixaPts(e.p,k==="caminhos"?(e.larg||.5)/2:k==="paredes"?.15:0)}
export function uneCaixas(L){let b=[1e9,1e9,-1e9,-1e9];for(const c of L){b[0]=Math.min(b[0],c[0]);b[1]=Math.min(b[1],c[1]);b[2]=Math.max(b[2],c[2]);b[3]=Math.max(b[3],c[3])}return b}
export function acerta(k,e,x,y,tol){if(k==="textos")e=caixaTxt(e);if(k==="objetos"||k==="textos"){const c=Math.cos(-e.r),s=Math.sin(-e.r),dx=x-e.x,dy=y-e.y,lx=dx*c-dy*s,ly=dx*s+dy*c;return Math.abs(lx)<=Math.max(e.w/2,tol)&&Math.abs(ly)<=Math.max(e.h/2,tol)}
  if(k==="luzes")return Math.hypot(x-e.x,y-e.y)<=Math.max(.35,tol*1.6);if(k==="portais")return distSeg(x,y,[e.x-e.dx*e.raio,e.y-e.dy*e.raio],[e.x+e.dx*e.raio,e.y+e.dy*e.raio])<=.2+tol;if(k==="paredes")return distPoli(e.p,x,y,e.laco)<=.15+tol;if(k==="caminhos")return distPoli(e.p,x,y,e.laco)<=Math.max((e.larg||.5)/2,.12)+tol;
  if(k==="telhados")return e.p.length>2&&dentro(e.p,x,y);return e.p.length>2&&dentro(e.p,x,y)}
export const camada=(k,e)=>k==="luzes"?1e4:k==="textos"?9e3:k==="telhados"?800:k==="portais"?510:k==="paredes"?500:e.l||0;
// portas, janelas e pisos presos a uma parede seguem a parede (posicao derivada, recalculada depois de cada mudanca)
export function sincroniza(A){if(!A.paredes||!A.paredes.length)return;const W=new Map();for(const w of A.paredes)if(w.id!=null)W.set(w.id,w);
  for(const q of A.portais||[]){if(q.d==null)continue;const w=W.get(q.parede);if(!w)continue;const p=pontoEm(trajeto(w),w.laco,q.d);q.x=p[0];q.y=p[1];q.dx=p[2];q.dy=p[3];q.r=Math.atan2(p[3],p[2])}
  for(const k of["padroes","telhados"])for(const f of A[k]||[]){if(f.parede==null)continue;const w=W.get(f.parede);if(w&&f.p!==w.p)f.p=w.p}}
// prende a parede os portais importados (guardam so x, y)
export function prendePortais(A){const W=new Map();for(const w of A.paredes||[])if(w.id!=null)W.set(w.id,w);for(const q of A.portais||[]){if(q.d!=null||q.parede==null)continue;const w=W.get(q.parede);if(!w)continue;const m=projeta(trajeto(w),w.laco,q.x,q.y);if(m.dist<.6)q.d=+m.d.toFixed(4)}}
export const anexos=(A,ids)=>{const L=[];for(const k of["portais","padroes","telhados"])for(const e of A[k]||[])if(e.parede!=null&&ids.has(e.parede))L.push({k,e});return L};
// ponto de referencia para o encaixe na grade
export const ancora=(k,e)=>e.p?[e.p[0][0],e.p[0][1]]:[e.x,e.y];
// estado guardado para desfazer: copia rasa (as listas de pontos nunca sao alteradas no lugar, sempre trocadas)
export const foto=e=>Object.assign({},e);
export function poe(e,st){for(const k in e)if(!(k in st))delete e[k];Object.assign(e,st)}
// T = {f:(x,y)=>[x,y], rot:radianos, s:escala}
export function transforma(k,e,T){const rot=T.rot||0,s=T.s==null?1:T.s;
  if(e.p){e.p=e.p.map(p=>T.f(p[0],p[1]));if(e.furos)e.furos=e.furos.map(h=>h.map(p=>T.f(p[0],p[1])));if(k==="caminhos"&&s!==1)e.larg=(e.larg||.5)*s;return}
  if(e.furos)e.furos=e.furos.map(h=>h.map(p=>T.f(p[0],p[1])));
  const q=T.f(e.x,e.y);e.x=q[0];e.y=q[1];if(k==="textos"){e.r=(e.r||0)+rot;e.tam*=s;if(e.lw)e.lw*=s}else if(k==="objetos"){e.r+=rot;e.w*=s;e.h*=s}else if(k==="luzes"){e.raio*=s;if(e.claro!=null)e.claro*=s}else if(k==="portais"){const c=Math.cos(rot),n=Math.sin(rot),dx=e.dx,dy=e.dy;e.dx=dx*c-dy*n;e.dy=dx*n+dy*c;e.r=(e.r||0)+rot;e.raio*=s}}
// --- mapa ---
export function texDe(M,nome){let i=M.texturas.indexOf(nome);if(i<0){i=M.texturas.length;M.texturas.push(nome)}return i}
const b64=u8=>{let s="";for(let i=0;i<u8.length;i+=0x8000)s+=String.fromCharCode.apply(null,u8.subarray(i,i+0x8000));return typeof btoa==="function"?btoa(s):Buffer.from(s,"binary").toString("base64")};
const deB64=s=>{const b=typeof atob==="function"?atob(s):Buffer.from(s,"base64").toString("binary"),u=new Uint8Array(b.length);for(let i=0;i<b.length;i++)u[i]=b.charCodeAt(i);return u};
export function terrenoLiso(larg,alt,tex){const w=larg*4,h=alt*4,u=new Uint8Array(w*h*4);for(let i=0;i<u.length;i+=4)u[i]=255;return {tex:[tex,-1,-1,-1],w,h,splat:b64(u)}}
// muda o tamanho do terreno guardando o que ja estava pintado (canto de cima a esquerda fixo)
export function terrenoRedim(T,larg,alt){const w=larg*4,h=alt*4,a=deB64(T.splat),u=new Uint8Array(w*h*4);for(let y=0;y<h;y++)for(let x=0;x<w;x++){const k=(y*w+x)*4;if(x<T.w&&y<T.h){const j=(y*T.w+x)*4;u[k]=a[j];u[k+1]=a[j+1];u[k+2]=a[j+2];u[k+3]=a[j+3]}else u[k]=255}return {tex:T.tex.slice(),w,h,splat:b64(u)}}
export function andarVazio(nome,terreno){return {nome,ambiente:[1,1,1,1],terreno,pisos:[],formas:[],padroes:[],paredes:[],portais:[],caminhos:[],objetos:[],luzes:[],textos:[]}}
export function novoMapa(o){o=o||{};const larg=Math.max(4,Math.min(200,Math.round(o.larg||30))),alt=Math.max(4,Math.min(200,Math.round(o.alt||20)));
  const M={v:1,nome:o.nome||"Novo mapa de batalha",larg,alt,origem:"atlas",grade:{cor:[0,0,0,.35]},texturas:[],pacotes:[],andares:[],avisos:[],sid:1};
  const A=andarVazio("Térreo",null);A.camadas=[novaCamada(M,{mat:o.chao||"grama",nome:MATERIAIS_NOME[o.chao||"grama"],cheia:true})];M.andares.push(A);return M}
// todo item ganha um id proprio (as paredes importadas guardam o delas, que os portais usam)
export function garanteIds(M){for(const A of M.andares)if(A.camadas&&!TIPOS.includes("camadas"))for(const c of A.camadas)if(c.id==null)c.id=(M.sid=(M.sid||1)+1);let mx=M.sid||1;const usados=new Set();for(const A of M.andares)for(const k of TIPOS)for(const e of A[k]||[])if(e.id!=null){if(usados.has(e.id)&&k!=="paredes")e.id=null;else{usados.add(e.id);if(typeof e.id==="number"&&e.id>=mx)mx=e.id+1}}
  for(const A of M.andares)for(const k of TIPOS){if(!A[k])A[k]=[];for(const e of A[k])if(e.id==null)e.id=mx++}M.sid=mx;return M}
export const novoId=M=>M.sid++;
export function clona(M,k,e){const c=JSON.parse(JSON.stringify(e));c.id=novoId(M);return c}

// ---------- camadas de textura do chao (como no Photoshop) ----------
// camada: {id, nome, t (textura), vis, op (opacidade), modo (normal|multiplicar|clarear|somar), esc, gt (giro), ox, oy, mz, sat, bri, con, cor, m (mascara Uint8Array mw x mh, null = cheia)}
export const MODOS=[["normal","Normal"],["multiplicar","Multiplicar"],["clarear","Clarear"],["somar","Somar"]];
export const resolucao=M=>Math.max(2,Math.min(8,Math.floor(2048/Math.max(M.larg,M.alt))));
export function novaCamada(M,o){o=o||{};const r=resolucao(M),c={id:novoId(M),nome:o.nome||"Camada",t:o.t!=null?o.t:texDe(M,"atlas:m/"+(o.mat||"terra")),vis:true,op:1,modo:"normal",esc:1,gt:0,ox:0,oy:0,mw:M.larg*r,mh:M.alt*r,m:null};
  if(!o.cheia)c.m=new Uint8Array(c.mw*c.mh);return Object.assign(c,o.extra||{})}
// muda a resolucao/tamanho de uma mascara guardando o desenho (canto de cima a esquerda fixo; area nova: cheia ou vazia)
export function redimMascara(m,w,h,W,H,cheio){const u=new Uint8Array(W*H);if(cheio)u.fill(255);if(!m){if(!cheio)u.fill(255);return u}for(let y=0;y<Math.min(h,H);y++)u.set(m.subarray(y*w,y*w+Math.min(w,W)),y*W);return u}
// novo tamanho do mapa: guarda o desenho no lugar (canto de cima a esquerda fixo); se a resolucao mudar, reamostra
export function redimCamadas(L,larg0,larg,alt,r){return L.map(c=>{const W=larg*r,H=alt*r;if(!c.m)return Object.assign({},c,{mw:W,mh:H});const r0=c.mw/larg0;if(Math.abs(r0-r)<1e-9)return Object.assign({},c,{m:redimMascara(c.m,c.mw,c.mh,W,H,false),mw:W,mh:H});
  const u=new Uint8Array(W*H);for(let y=0;y<H;y++){const oy=Math.floor(y*r0/r);if(oy>=c.mh)break;for(let x=0;x<W;x++){const ox=Math.floor(x*r0/r);if(ox<c.mw)u[y*W+x]=c.m[oy*c.mw+ox]}}return Object.assign({},c,{m:u,mw:W,mh:H})})}
// troca o terreno antigo (4 texturas misturadas, do Dungeondraft) por camadas: a 1a cheia, as outras com a mascara do peso dela
export function converteTerreno(M,A){if(!A.terreno||A.camadas)return false;const T=A.terreno,r=resolucao(M),W=M.larg*r,H=M.alt*r,sp=deB64(T.splat),L=[];
  const usa=T.tex.map((t,i)=>t>=0||i===0);const peso=(x,y,k)=>{const sx=Math.min(T.w-1,Math.floor(x*T.w/W)),sy=Math.min(T.h-1,Math.floor(y*T.h/H)),j=(sy*T.w+sx)*4;return [sp[j],sp[j+1],sp[j+2],sp[j+3]]};
  const ms=[1,2,3].map(()=>new Uint8Array(W*H));for(let y=0;y<H;y++)for(let x=0;x<W;x++){const p=peso(x,y);let s=p[0]||0;if(p[0]+p[1]+p[2]+p[3]<1){p[0]=255;s=255}for(let k=1;k<4;k++){s+=p[k];ms[k-1][y*W+x]=s>0?Math.round(255*p[k]/s):0}}
  const nomeT=t=>t<0?"Base":(M.texturas[t]||"").split("/").pop().replace(/\.\w+$/,"").replace(/[_-]+/g," ");
  L.push(novaCamada(M,{t:T.tex[0]<0?texDe(M,"atlas:m/neutro"):T.tex[0],nome:nomeT(T.tex[0]),cheia:true}));
  for(let k=1;k<4;k++)if(T.tex[k]>=0&&ms[k-1].some(v=>v>0)){const c=novaCamada(M,{t:T.tex[k],nome:nomeT(T.tex[k]),cheia:true});c.m=ms[k-1];c.mw=W;c.mh=H;L.push(c)}
  A.camadas=L;delete A.terreno;return true}

// caminhos prontos: material, largura, estilo, borda e cor da borda
export const CAMINHOS=[["estrada","Estrada","terra",2,"estrada",.1,[.3,.22,.13,.55]],["trilha","Trilha","terra",1,"estrada",.06,[.3,.22,.13,.45]],["calcada","Calçada","pedra",2,"estrada",.08,[.2,.19,.17,.7]],["rio","Rio","agua",2.5,"rio",.35,[.55,.45,.3,.95]],["riacho","Riacho","agua",1,"rio",.2,[.5,.42,.3,.9]],["cerca","Cerca","madeira",.2,"cerca",0,null],["penhasco","Penhasco","rocha",1.2,"penhasco",.25,[.12,.1,.08,.7]]];
export const FORMAS=[["chao","Chão","terra",0,null],["agua","Água","agua",.35,[.62,.52,.34,.95]],["lago","Lago fundo","aguaFunda",.4,[.42,.55,.6,.9]],["pedra","Pedra","rocha",.12,[.12,.1,.08,.8]],["tapete","Tapete","tapete",.1,[.55,.42,.2,1]]];
export const FONTES=[["fell","Medieval",'"IM Fell English",Georgia,serif'],["alegreya","Livro",'"Alegreya",Georgia,serif'],["sans","Simples",'"Alegreya Sans",system-ui,sans-serif']];
// ---------- andares ----------
export const ESTILOS_TELHADO=[["quatro","Quatro águas"],["duas","Duas águas"],["plano","Plano"]];
export function idsAndares(M){let n=1;for(const A of M.andares)if(A.id&&/^a\d+$/.test(A.id))n=Math.max(n,+A.id.slice(1)+1);for(const A of M.andares)if(!A.id)A.id="a"+(n++);return M}
// copia um andar com ids novos (as ligacoes com paredes acompanham)
export function copiaAndar(M,A){const B=structuredClone(A);B.id=null;B.nome=A.nome+" (cópia)";const mapa=new Map();for(const w of B.paredes||[]){const n=novoId(M);mapa.set(w.id,n);w.id=n}
  for(const k of TIPOS.concat(["camadas"])){if(k==="paredes")continue;for(const e of B[k]||[]){e.id=novoId(M);if(e.parede!=null&&mapa.has(e.parede))e.parede=mapa.get(e.parede)}}return B}