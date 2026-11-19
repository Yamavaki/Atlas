// Atlas - Modo Batalha: visualizador (camera, andares, luz, grade, medidor).
import {criaRender} from "./render.js";
const el=(t,a,...k)=>{const e=document.createElement(t);for(const n in a||{}){if(n==="class")e.className=a[n];else if(n.startsWith("on"))e.addEventListener(n.slice(2),a[n]);else if(a[n]!=null&&a[n]!==false)e.setAttribute(n,a[n])}for(const x of k)if(x!=null)e.append(x);return e};
export function abrirVisor(raiz,mapa,opt){opt=opt||{};raiz.replaceChildren();const cv=el("canvas",{class:"bt-cv"}),barra=el("div",{class:"bt-bar"}),info=el("span",{class:"bt-info"}),caixa=el("div",{class:"bt-wrap"},cv);
  raiz.append(el("div",{class:"bt"},barra,caixa));let R;try{R=criaRender(cv)}catch(e){R=null;console.error(e)}
  if(!R){caixa.replaceChildren(el("p",{class:"bt-msg"},"Este navegador não liberou o WebGL2, que o Modo Batalha usa para desenhar."));return null}
  const t0=performance.now(),carga=R.carregar(mapa);let andar=0,luz=true,grade=true,cam={x:mapa.larg/2,y:mapa.alt/2,z:20},sujo=true,ultimo=0,quadros=[];
  const dpr=()=>Math.min(window.devicePixelRatio||1,2);
  const ajusta=()=>{const r=caixa.getBoundingClientRect(),w=Math.max(2,Math.round(r.width*dpr())),h=Math.max(2,Math.round(r.height*dpr()));if(cv.width!==w||cv.height!==h){cv.width=w;cv.height=h;sujo=true}};
  const enquadra=()=>{ajusta();cam.z=Math.min(cv.width/(mapa.larg+2),cv.height/(mapa.alt+2));cam.x=mapa.larg/2;cam.y=mapa.alt/2;sujo=true};
  const rotulo=()=>{const A=mapa.andares[andar],m=quadros.length?quadros.reduce((a,b)=>a+b,0)/quadros.length:0;info.textContent=A.objetos.length+" objetos · "+A.luzes.length+" luzes"+(m?" · "+m.toFixed(1)+" ms por quadro":"")};
  const laco=t=>{if(vivo)requestAnimationFrame(laco);ajusta();if(!sujo)return;sujo=false;const a=performance.now();R.desenhar(cam,andar,{luz,grade});if(opt.medir)R.terminar();const d=performance.now()-a;quadros.push(d);if(quadros.length>30)quadros.shift();if(t-ultimo>400){ultimo=t;rotulo()}};
  let vivo=true;
  // barra: andares, luz, grade, enquadrar
  const bAnd=mapa.andares.map((A,i)=>el("button",{type:"button",class:"bt-b",title:A.nome,onclick:()=>{andar=i;marca();sujo=true;rotulo()}},String(i+1))),nomeA=el("span",{class:"bt-nome"});
  const marca=()=>{bAnd.forEach((b,i)=>b.setAttribute("aria-pressed",String(i===andar)));nomeA.textContent=mapa.andares[andar].nome};
  const liga=(txt,get,set)=>{const b=el("button",{type:"button",class:"bt-b",onclick:()=>{set(!get());b.setAttribute("aria-pressed",String(get()));sujo=true}},txt);b.setAttribute("aria-pressed",String(get()));return b};
  barra.append(el("span",{class:"bt-t"},"Andar"),...bAnd,nomeA,el("span",{class:"bt-g"}),liga("Luz",()=>luz,v=>luz=v),liga("Grade",()=>grade,v=>grade=v),el("button",{type:"button",class:"bt-b",onclick:enquadra},"Enquadrar"),info);
  // camera: arrastar, roda do mouse, pinca
  const P=new Map();let pin=0;const local=e=>{const r=cv.getBoundingClientRect();return [(e.clientX-r.left)*dpr(),(e.clientY-r.top)*dpr()]};
  const zoomEm=(px,py,f)=>{const wx=cam.x+(px-cv.width/2)/cam.z,wy=cam.y+(py-cv.height/2)/cam.z;cam.z=Math.max(2,Math.min(400,cam.z*f));cam.x=wx-(px-cv.width/2)/cam.z;cam.y=wy-(py-cv.height/2)/cam.z;sujo=true};
  cv.addEventListener("pointerdown",e=>{cv.setPointerCapture(e.pointerId);P.set(e.pointerId,local(e));pin=0});
  cv.addEventListener("pointermove",e=>{if(!P.has(e.pointerId))return;const a=P.get(e.pointerId),b=local(e);if(P.size===1){cam.x-=(b[0]-a[0])/cam.z;cam.y-=(b[1]-a[1])/cam.z;sujo=true}P.set(e.pointerId,b);
    if(P.size===2){const [p,q]=[...P.values()],d=Math.hypot(p[0]-q[0],p[1]-q[1]);if(pin)zoomEm((p[0]+q[0])/2,(p[1]+q[1])/2,d/pin);pin=d}});
  const solta=e=>{P.delete(e.pointerId);pin=0};cv.addEventListener("pointerup",solta);cv.addEventListener("pointercancel",solta);
  cv.addEventListener("wheel",e=>{e.preventDefault();const p=local(e);zoomEm(p[0],p[1],Math.exp(-e.deltaY*.0015))},{passive:false});
  marca();enquadra();requestAnimationFrame(laco);
  const abertura=performance.now()-t0;
  return {cam,render:R,abertura,carga,fechar:()=>{vivo=false},irPara:(i)=>{andar=i;marca();sujo=true},estado:()=>({andar,luz,grade}),set:(o)=>{if(o.luz!=null)luz=o.luz;if(o.grade!=null)grade=o.grade;if(o.cam)Object.assign(cam,o.cam);sujo=true},
    agora:()=>{ajusta();const a=performance.now();R.desenhar(cam,andar,{luz,grade});R.terminar();return performance.now()-a}}}
