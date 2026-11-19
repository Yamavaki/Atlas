// Atlas - Modo Batalha: o que existe num andar e como cada coisa se mede, se acerta com o clique e se transforma.
// Sem DOM. O editor, o gerador e (depois) o Modo Claude falam com o mapa por aqui e pelos comandos.
import {distPoli,dentro,caixaPts} from "./vetor.js";
export const TIPOS=["objetos","luzes","paredes","caminhos","padroes"];
export const NOME={objetos:["objeto","objetos"],luzes:["luz","luzes"],paredes:["parede","paredes"],caminhos:["caminho","caminhos"],padroes:["forma","formas"]};
export const FUNDO={paredes:1,caminhos:1,padroes:1}; // clicar seleciona; arrastar sem estar selecionado abre a caixa de selecao
export const MATERIAIS_NOME={grama:"Grama",trevo:"Trevo",selva:"Selva",terra:"Terra",lama:"Lama",areia:"Areia",pedra:"Pedra",rocha:"Rocha",concreto:"Concreto",madeira:"Madeira",madeiraEscura:"Madeira escura",agua:"Água",aguaFunda:"Água funda",ladrilho:"Ladrilho",tapete:"Tapete",metal:"Metal",asfalto:"Asfalto",neve:"Neve",telha:"Telha",neutro:"Neutro"};
// artes proprias: nome na tela, tamanho padrao em quadrados e camada padrao
export const ARTES={arvore:["Árvore",3,3,400],arvoreEscura:["Árvore escura",3,3,400],pinheiro:["Pinheiro",2.5,2.5,400],palmeira:["Palmeira",3,3,400],arbusto:["Arbusto",1.5,1.5,300],samambaia:["Samambaia",1,1,200],capim:["Capim",1,1,100],flor:["Flor",.5,.5,100],cogumelo:["Cogumelo",.5,.5,100],
  pedra:["Pedra",1.5,1.5,200],seixos:["Seixos",1,1,100],tronco:["Tronco",2,1,200],toco:["Toco",1,1,200],raiz:["Raiz",1.5,1.5,100],cipo:["Cipó",2,1,300],cristal:["Cristal",1,1,200],teia:["Teia",1.5,1.5,300],ossos:["Ossos",1,1,100],pilar:["Pilar",1,1,300],ondas:["Ondas",2,1,50],vitoria:["Vitória-régia",1,1,100],
  mesa:["Mesa",2,1,200],mesaRedonda:["Mesa redonda",1.5,1.5,200],cadeira:["Cadeira",.6,.6,200],cama:["Cama",1,2,200],barril:["Barril",.8,.8,200],caixote:["Caixote",1,1,200],bau:["Baú",1,.7,200],estante:["Estante",2,.6,200],fogo:["Fogueira",1,1,200],luminaria:["Luminária",.5,.5,300],tapete:["Tapete",2,3,50],escada:["Escada",1,2,100],loucaBranca:["Louça",.7,.7,200],movel:["Móvel",1.5,.8,200],navio:["Navio",4,8,200],generico:["Marcador",1,1,200]};
// --- medidas ---
export function cantos(o){const c=Math.cos(o.r),s=Math.sin(o.r),hw=o.w/2,hh=o.h/2;return [[-hw,-hh],[hw,-hh],[hw,hh],[-hw,hh]].map(([a,b])=>[o.x+a*c-b*s,o.y+a*s+b*c])}
export function caixa(k,e){if(k==="objetos")return caixaPts(cantos(e));if(k==="luzes")return [e.x-.4,e.y-.4,e.x+.4,e.y+.4];return caixaPts(e.p,k==="caminhos"?(e.larg||.5)/2:k==="paredes"?.15:0)}
export function uneCaixas(L){let b=[1e9,1e9,-1e9,-1e9];for(const c of L){b[0]=Math.min(b[0],c[0]);b[1]=Math.min(b[1],c[1]);b[2]=Math.max(b[2],c[2]);b[3]=Math.max(b[3],c[3])}return b}
export function acerta(k,e,x,y,tol){if(k==="objetos"){const c=Math.cos(-e.r),s=Math.sin(-e.r),dx=x-e.x,dy=y-e.y,lx=dx*c-dy*s,ly=dx*s+dy*c;return Math.abs(lx)<=Math.max(e.w/2,tol)&&Math.abs(ly)<=Math.max(e.h/2,tol)}
  if(k==="luzes")return Math.hypot(x-e.x,y-e.y)<=Math.max(.35,tol*1.6);if(k==="paredes")return distPoli(e.p,x,y,e.laco)<=.15+tol;if(k==="caminhos")return distPoli(e.p,x,y,e.laco)<=Math.max((e.larg||.5)/2,.12)+tol;
  return e.p.length>2&&dentro(e.p,x,y)}
export const camada=(k,e)=>k==="luzes"?1e4:k==="paredes"?500:e.l||0;
// ponto de referencia para o encaixe na grade
export const ancora=(k,e)=>e.p?[e.p[0][0],e.p[0][1]]:[e.x,e.y];
// estado guardado para desfazer: copia rasa (as listas de pontos nunca sao alteradas no lugar, sempre trocadas)
export const foto=e=>Object.assign({},e);
export function poe(e,st){for(const k in e)if(!(k in st))delete e[k];Object.assign(e,st)}
// T = {f:(x,y)=>[x,y], rot:radianos, s:escala}
export function transforma(k,e,T){const rot=T.rot||0,s=T.s==null?1:T.s;
  if(e.p){e.p=e.p.map(p=>T.f(p[0],p[1]));if(k==="caminhos"&&s!==1)e.larg=(e.larg||.5)*s;return}
  const q=T.f(e.x,e.y);e.x=q[0];e.y=q[1];if(k==="objetos"){e.r+=rot;e.w*=s;e.h*=s}else if(k==="luzes")e.raio*=s;else if(k==="portais"){const c=Math.cos(rot),n=Math.sin(rot),dx=e.dx,dy=e.dy;e.dx=dx*c-dy*n;e.dy=dx*n+dy*c;e.r=(e.r||0)+rot;e.raio*=s}}
// --- mapa ---
export function texDe(M,nome){let i=M.texturas.indexOf(nome);if(i<0){i=M.texturas.length;M.texturas.push(nome)}return i}
const b64=u8=>{let s="";for(let i=0;i<u8.length;i+=0x8000)s+=String.fromCharCode.apply(null,u8.subarray(i,i+0x8000));return typeof btoa==="function"?btoa(s):Buffer.from(s,"binary").toString("base64")};
const deB64=s=>{const b=typeof atob==="function"?atob(s):Buffer.from(s,"base64").toString("binary"),u=new Uint8Array(b.length);for(let i=0;i<b.length;i++)u[i]=b.charCodeAt(i);return u};
export function terrenoLiso(larg,alt,tex){const w=larg*4,h=alt*4,u=new Uint8Array(w*h*4);for(let i=0;i<u.length;i+=4)u[i]=255;return {tex:[tex,-1,-1,-1],w,h,splat:b64(u)}}
// muda o tamanho do terreno guardando o que ja estava pintado (canto de cima a esquerda fixo)
export function terrenoRedim(T,larg,alt){const w=larg*4,h=alt*4,a=deB64(T.splat),u=new Uint8Array(w*h*4);for(let y=0;y<h;y++)for(let x=0;x<w;x++){const k=(y*w+x)*4;if(x<T.w&&y<T.h){const j=(y*T.w+x)*4;u[k]=a[j];u[k+1]=a[j+1];u[k+2]=a[j+2];u[k+3]=a[j+3]}else u[k]=255}return {tex:T.tex.slice(),w,h,splat:b64(u)}}
export function andarVazio(nome,terreno){return {nome,ambiente:[1,1,1,1],terreno,pisos:[],formas:[],padroes:[],paredes:[],portais:[],caminhos:[],objetos:[],luzes:[]}}
export function novoMapa(o){o=o||{};const larg=Math.max(4,Math.min(200,Math.round(o.larg||30))),alt=Math.max(4,Math.min(200,Math.round(o.alt||20)));
  const M={v:1,nome:o.nome||"Novo mapa de batalha",larg,alt,origem:"atlas",grade:{cor:[0,0,0,.35]},texturas:[],pacotes:[],andares:[],avisos:[],sid:1};
  M.andares.push(andarVazio("Térreo",terrenoLiso(larg,alt,texDe(M,"atlas:m/"+(o.chao||"grama")))));return M}
// todo item ganha um id proprio (as paredes importadas guardam o delas, que os portais usam)
export function garanteIds(M){let mx=M.sid||1;const usados=new Set();for(const A of M.andares)for(const k of TIPOS)for(const e of A[k]||[])if(e.id!=null){if(usados.has(e.id)&&k!=="paredes")e.id=null;else{usados.add(e.id);if(typeof e.id==="number"&&e.id>=mx)mx=e.id+1}}
  for(const A of M.andares)for(const k of TIPOS){if(!A[k])A[k]=[];for(const e of A[k])if(e.id==null)e.id=mx++}M.sid=mx;return M}
export const novoId=M=>M.sid++;
export function clona(M,k,e){const c=JSON.parse(JSON.stringify(e));c.id=novoId(M);return c}
