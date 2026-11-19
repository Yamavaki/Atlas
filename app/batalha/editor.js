// Atlas - Modo Batalha: editor. Barra de cima (mapa), ferramentas a esquerda, propriedades a direita, dica embaixo.
// Tudo o que muda o mapa passa pelo historico de comandos (desfazer e refazer) e e salvo sozinho.
import {criaRender} from "./render.js";
import {criaHistorico,alcance} from "./comandos.js";
import * as MD from "./modelo.js";
import {materialDe,objetoDe} from "./arte.js";
import {arredonda,RAIO_PADRAO} from "./vetor.js";
const el=(t,a,...k)=>{const e=document.createElement(t);for(const n in a||{}){if(n==="class")e.className=a[n];else if(n.startsWith("on"))e.addEventListener(n.slice(2),a[n]);else if(a[n]!=null&&a[n]!==false)e.setAttribute(n,a[n]===true?"":a[n])}for(const x of k.flat())if(x!=null)e.append(x);return e};
const IC={sel:"M5 3l14 8-6 2-2 6z",mao:"M8 13V6a1.5 1.5 0 013 0v5V4.5a1.5 1.5 0 013 0V11V6a1.5 1.5 0 013 0v9a6 6 0 01-6 6h-1a6 6 0 01-5-2.6L3.6 15a1.5 1.5 0 012.5-1.6L8 15.5",obj:"M12 3a6 6 0 00-3.5 10.9h7A6 6 0 0012 3zM12 14v7M9 21h6",
  desf:"M9 14L4 9l5-5M4 9h10a6 6 0 010 12h-3",ref:"M15 14l5-5-5-5M20 9H10a6 6 0 000 12h3",ima:"M6 3v9a6 6 0 0012 0V3h-4v9a2 2 0 01-4 0V3zM6 7h4M14 7h4",grade:"M3 3h18v18H3zM9 3v18M15 3v18M3 9h18M3 15h18",
  luz:"M12 8a4 4 0 100 8 4 4 0 000-8zM12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5L19 19M19 5l-1.5 1.5M6.5 17.5L5 19",enq:"M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5",dup:"M8 8h12v12H8zM4 16V4h12",esp:"M12 3v18M9 7l-5 5 5 5zM15 7l5 5-5 5z",
  gir:"M20 12a8 8 0 11-3-6.2M20 4v5h-5",frente:"M12 19V5M6 11l6-6 6 6",tras:"M12 5v14M6 13l6 6 6-6",lixo:"M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13",painel:"M4 6h16M4 12h16M4 18h10"};
const ico=n=>{const s=document.createElementNS("http://www.w3.org/2000/svg","svg");s.setAttribute("viewBox","0 0 24 24");s.setAttribute("aria-hidden","true");const p=document.createElementNS("http://www.w3.org/2000/svg","path");p.setAttribute("d",IC[n]);s.append(p);return s};
const hexDe=c=>"#"+[0,1,2].map(i=>Math.round(Math.max(0,Math.min(1,c[i]))*255).toString(16).padStart(2,"0")).join(""),corDe=h=>[parseInt(h.substr(1,2),16)/255,parseInt(h.substr(3,2),16)/255,parseInt(h.substr(5,2),16)/255];
const arr2=(v,c)=>{const f=Math.pow(10,c==null?2:c);return Math.round(v*f)/f},GR=180/Math.PI;
export function abrirEditor(raiz,M,opt){opt=opt||{};MD.garanteIds(M);for(const A of M.andares)for(const q of A.portais||[])if(q.id==null)q.id=MD.novoId(M);
  raiz.replaceChildren();const cv=el("canvas",{class:"bt-cv"}),ov=el("canvas",{class:"bt-ov"}),dica=el("div",{class:"bt-dica"}),caixaCv=el("div",{class:"bt-wrap"},cv,ov,dica);
  const barra=el("div",{class:"bt-bar"}),ferrs=el("div",{class:"bt-ferr",role:"toolbar","aria-label":"Ferramentas"}),pCorpo=el("div",{class:"bt-pc"}),pTit=el("span",{class:"bt-pt"}),painelEl=el("aside",{class:"bt-painel"},el("button",{type:"button",class:"bt-ph",onclick:()=>painelEl.classList.toggle("aberto")},ico("painel"),pTit),pCorpo);
  const root=el("div",{class:"bt bt-ed",tabindex:"-1"},barra,el("div",{class:"bt-meio"},ferrs,caixaCv,painelEl));raiz.append(root);
  let R;try{R=criaRender(cv)}catch(e){R=null;console.error(e)}
  if(!R){caixaCv.replaceChildren(el("p",{class:"bt-msg"},"Este navegador não liberou o WebGL2, que o Modo Batalha usa para desenhar."));return null}
  const t0=performance.now(),carga=R.carregar(M),g=ov.getContext("2d");
  let andar=0,luz=true,grade=true,cam={x:M.larg/2,y:M.alt/2,z:20},sujo=true,vivo=true,ultimo=0,quadros=[],ferr="sel",sel=[],arr=null,passa=null,espaco=false,cursor=null,area=null,assin="",tSalvar=0,salvando=false;
  const snap={on:true,passo:.5},pincel={arte:"arvore",esc:1,giro:0,acaso:false,camada:null};
  const fl=()=>M.andares[andar],dpr=()=>Math.min(window.devicePixelRatio||1,2);
  const mundo=(px,py)=>[cam.x+(px-cv.width/2)/cam.z,cam.y+(py-cv.height/2)/cam.z],tela=(x,y)=>[(x-cam.x)*cam.z+cv.width/2,(y-cam.y)*cam.z+cv.height/2];
  const enc=(v,alt)=>(snap.on!==!!alt)?Math.round(v/snap.passo)*snap.passo:v;
  // ---------- historico e salvamento ----------
  const estado=el("span",{class:"bt-est"}),info=el("span",{class:"bt-info"});
  const salvaJa=async()=>{clearTimeout(tSalvar);tSalvar=0;if(!opt.salvar)return;salvando=true;estado.textContent="Salvando…";try{await opt.salvar(M);estado.textContent="Salvo"}catch(e){console.error(e);estado.textContent="Não foi possível salvar"}salvando=false};
  const agendaSalvar=()=>{estado.textContent="Alterado";clearTimeout(tSalvar);tSalvar=setTimeout(salvaJa,700)};
  const H=criaHistorico(M,(lote,sentido)=>{if(sentido!==0){const al=alcance(lote);if(al.tudo){R.carregar(M);H.esquece()}else for(const a of al.andares){let ok=false;
        if(al.leve){const objs=[],luzes=[];for(const o of lote.ops){if(o.a!==a)continue;const e=H.item(a,o.k,o.id);if(e)(o.k==="luzes"?luzes:objs).push(e)}ok=R.atualiza(a,objs,luzes)}if(!ok)R.refazAndar(a)}}
    // tira da selecao o que deixou de existir
    if(sel.length){const A=fl(),V={};sel=sel.filter(s=>(V[s.k]||(V[s.k]=new Set(A[s.k]))).has(s.e))}
    botoes();painel();sujo=true;agendaSalvar()});
  // ---------- selecao ----------
  const tem=e=>sel.some(s=>s.e===e);
  const seleciona=L=>{sel=L.slice();passa=null;painel();sujo=true};
  const acertos=(x,y)=>{const A=fl(),tol=7*dpr()/cam.z,L=[];let n=0;for(const k of MD.TIPOS){if(k==="luzes"&&!luz)continue;for(const e of A[k]||[]){n++;if(MD.acerta(k,e,x,y,tol))L.push({k,e,c:MD.camada(k,e),n})}}L.sort((a,b)=>b.c-a.c||b.n-a.n);return L};
  // caixa da selecao: um objeto sozinho guarda o giro dele; o resto usa a caixa reta que cobre tudo
  const caixaSel=()=>{if(!sel.length)return null;if(sel.length===1&&sel[0].k==="objetos"){const o=sel[0].e;return {cx:o.x,cy:o.y,w:o.w,h:o.h,r:o.r,um:true}}const b=MD.uneCaixas(sel.map(s=>MD.caixa(s.k,s.e)));return {cx:(b[0]+b[2])/2,cy:(b[1]+b[3])/2,w:Math.max(b[2]-b[0],.2),h:Math.max(b[3]-b[1],.2),r:0,um:false}};
  const alcas=()=>{const B=caixaSel();if(!B)return [];const c=Math.cos(B.r),s=Math.sin(B.r),P=(a,b)=>tela(B.cx+a*c-b*s,B.cy+a*s+b*c),L=[];for(const [sx,sy] of[[-1,-1],[1,-1],[1,1],[-1,1]])L.push({t:"redim",sx,sy,p:P(sx*B.w/2,sy*B.h/2)});
    if(B.um)for(const [sx,sy] of[[0,-1],[1,0],[0,1],[-1,0]])L.push({t:"redim",sx,sy,p:P(sx*B.w/2,sy*B.h/2)});const topo=P(0,-B.h/2),d=26*dpr();L.push({t:"girar",p:[topo[0]+s*d,topo[1]-c*d],de:topo});return L};
  const alcaEm=(px,py)=>{const r=10*dpr();for(const a of alcas().reverse())if(Math.hypot(a.p[0]-px,a.p[1]-py)<=r)return a;return null};
  // itens que acompanham a selecao (os portais das paredes escolhidas)
  const comPortais=L=>{const ids=new Set(L.filter(s=>s.k==="paredes").map(s=>s.e.id));if(!ids.size)return L;return L.concat((fl().portais||[]).filter(q=>ids.has(q.parede)).map(e=>({k:"portais",e})))};
  const redesenha=itens=>{const objs=[],luzes=[];let leve=true;for(const s of itens){if(s.k==="objetos")objs.push(s.e);else if(s.k==="luzes")luzes.push(s.e);else leve=false}if(!leve||!R.atualiza(andar,objs,luzes))R.refazAndar(andar);sujo=true};
  // muda os itens ao vivo a partir das fotos tiradas no começo do arrasto
  const aoVivo=T=>{arr.itens.forEach((s,i)=>{MD.poe(s.e,arr.antes[i]);MD.transforma(s.k,s.e,T)});redesenha(arr.itens)};
  const fecha=nome=>{const ops=[];arr.itens.forEach((s,i)=>{const de=arr.antes[i],para=MD.foto(s.e);if(JSON.stringify(de)!==JSON.stringify(para))ops.push({op:"muda",a:andar,k:s.k,id:s.e.id,de,para})});H.registra(ops,{nome});painel()};
  const cancela=()=>{if(arr&&arr.itens&&arr.moveu){arr.itens.forEach((s,i)=>MD.poe(s.e,arr.antes[i]));redesenha(arr.itens)}arr=null;sujo=true;painel()};
  const comeca=(tipo,w,extra)=>{const itens=comPortais(sel);arr=Object.assign({tipo,itens,antes:itens.map(s=>MD.foto(s.e)),w0:w,moveu:false},extra)};
  // ---------- acoes ----------
  const exec=(ops,nome,junta)=>H.exec(ops,{nome,junta});
  const muda=(L,fn,nome,junta)=>{const ops=[];for(const s of L){const de=MD.foto(s.e),para=MD.foto(s.e);fn(para,s.k);ops.push({op:"muda",a:andar,k:s.k,id:s.e.id,de,para})}exec(ops,nome,junta)};
  const transf=(T,nome,junta)=>{const ops=[];for(const s of comPortais(sel)){const de=MD.foto(s.e),c=MD.foto(s.e);MD.transforma(s.k,c,T);ops.push({op:"muda",a:andar,k:s.k,id:s.e.id,de,para:c})}exec(ops,nome,junta)};
  const apagar=()=>{if(!sel.length)return;const A=fl(),ops=[];for(const s of comPortais(sel))ops.push({op:"apaga",a:andar,k:s.k,item:s.e,pos:A[s.k].indexOf(s.e)});ops.sort((a,b)=>b.pos-a.pos);const n=sel.length;sel=[];exec(ops,"Apagar "+n)};
  const copias=(L,dx,dy)=>{const ops=[],novos=[],A=fl();for(const s of L){const c=MD.clona(M,s.k,s.e);MD.transforma(s.k,c,{f:(x,y)=>[x+dx,y+dy]});ops.push({op:"cria",a:andar,k:s.k,item:c});novos.push({k:s.k,e:c});
      if(s.k==="paredes"&&s.e.id!=null)for(const q of A.portais||[])if(q.parede===s.e.id){const p=MD.clona(M,"portais",q);p.parede=c.id;MD.transforma("portais",p,{f:(x,y)=>[x+dx,y+dy]});ops.push({op:"cria",a:andar,k:"portais",item:p})}}return {ops,novos}};
  const duplicar=()=>{if(!sel.length)return;const {ops,novos}=copias(sel,1,1);exec(ops,"Duplicar");seleciona(novos)};
  const copiar=()=>{if(sel.length)area={itens:sel.map(s=>({k:s.k,e:JSON.parse(JSON.stringify(s.e))})),c:caixaSel()}};
  const colar=()=>{if(!area)return;const alvo=cursor||[cam.x,cam.y],dx=enc(alvo[0]-area.c.cx),dy=enc(alvo[1]-area.c.cy),{ops,novos}=copias(area.itens,dx,dy);exec(ops,"Colar");seleciona(novos)};
  const girar=q=>{const B=caixaSel();if(!B)return;const c=Math.cos(q),s=Math.sin(q);transf({f:(x,y)=>[B.cx+(x-B.cx)*c-(y-B.cy)*s,B.cy+(x-B.cx)*s+(y-B.cy)*c],rot:q},"Girar")};
  const espelhar=()=>{const B=caixaSel();if(!B)return;muda(comPortais(sel),(e,k)=>{if(e.p)e.p=e.p.map(p=>[2*B.cx-p[0],p[1]]);else{e.x=2*B.cx-e.x;if(k==="objetos"){e.r=-e.r;if(e.m)delete e.m;else e.m=1}else if(k==="portais"){e.dx=-e.dx}}},"Espelhar")};
  const empurra=(dx,dy)=>{if(sel.length)transf({f:(x,y)=>[x+dx,y+dy]},"Mover","seta")};
  const ordem=frente=>{const A=fl(),objs=sel.filter(s=>s.k==="objetos").map(s=>s.e);if(!objs.length)return;const S=new Set(objs),cx=MD.uneCaixas(objs.map(o=>MD.caixa("objetos",o)));let alvo=null;
    for(const o of A.objetos){if(S.has(o))continue;const c=MD.caixa("objetos",o);if(c[0]<cx[2]&&c[2]>cx[0]&&c[1]<cx[3]&&c[3]>cx[1])alvo=alvo==null?o.l:frente?Math.max(alvo,o.l):Math.min(alvo,o.l)}
    const ops=[],L=A.objetos.slice();for(const e of frente?objs:objs.slice().reverse()){if(alvo!=null&&e.l!==alvo){const de=MD.foto(e);ops.push({op:"muda",a:andar,k:"objetos",id:e.id,de,para:Object.assign({},de,{l:alvo})})}const i=L.indexOf(e);L.splice(i,1);if(frente)L.push(e);else L.unshift(e);ops.push({op:"pos",a:andar,k:"objetos",id:e.id,de:i,para:frente?L.length-1:0})}
    exec(ops,frente?"Trazer para a frente":"Enviar para trás")};
  const tudo=()=>{const A=fl(),L=[];for(const k of MD.TIPOS)for(const e of A[k]||[])L.push({k,e});seleciona(L)};
  // tamanho de uma arte propria: o lado maior vem da tabela, a proporcao vem do recorte da arte
  const medida=nome=>{const z=MD.ARTES[nome]||MD.ARTES.generico,i=R.arte.indice["o:"+nome],rc=R.arte.recorte[i]||[0,0,1,1],S=Math.max(z[1],z[2]),p=(rc[2]-rc[0])/(rc[3]-rc[1]);return {z,i,rc,w:(p>=1?S:S*p)*pincel.esc,h:(p>=1?S/p:S)*pincel.esc}};
  const coloca=(w,alt)=>{const md=medida(pincel.arte),z=md.z,o={id:MD.novoId(M),t:MD.texDe(M,"atlas:o/"+pincel.arte),x:enc(w[0],alt),y:enc(w[1],alt),r:pincel.acaso?Math.floor(Math.random()*24)*Math.PI/12:pincel.giro/GR,w:arr2(md.w,3),h:arr2(md.h,3),l:pincel.camada==null?z[3]:pincel.camada};exec([{op:"cria",a:andar,k:"objetos",item:o}],"Colocar "+z[0].toLowerCase())};
  // ---------- desenho ----------
  const ajusta=()=>{const r=caixaCv.getBoundingClientRect(),w=Math.max(2,Math.round(r.width*dpr())),h=Math.max(2,Math.round(r.height*dpr()));if(cv.width!==w||cv.height!==h){cv.width=w;cv.height=h;ov.width=w;ov.height=h;sujo=true}};
  const enquadra=()=>{ajusta();cam.z=Math.min(cv.width/(M.larg+2),cv.height/(M.alt+2));cam.x=M.larg/2;cam.y=M.alt/2;sujo=true};
  const tracado=(k,e)=>{g.beginPath();if(k==="objetos"){const C=MD.cantos(e).map(p=>tela(p[0],p[1]));g.moveTo(C[0][0],C[0][1]);for(let i=1;i<4;i++)g.lineTo(C[i][0],C[i][1]);g.closePath()}
    else if(k==="luzes"){const p=tela(e.x,e.y);g.arc(p[0],p[1],e.raio*cam.z,0,7)}
    else{const P=k==="paredes"?arredonda(e.p,e.raio==null?RAIO_PADRAO:e.raio,e.laco):e.p;P.forEach((q,i)=>{const p=tela(q[0],q[1]);if(i)g.lineTo(p[0],p[1]);else g.moveTo(p[0],p[1])});if(e.laco||k==="padroes")g.closePath()}};
  const sobre=()=>{const d=dpr();g.setTransform(1,0,0,1,0,0);g.clearRect(0,0,ov.width,ov.height);g.lineJoin="round";
    // luzes: um marcador pequeno em cada uma
    if(luz)for(const l of fl().luzes||[]){const p=tela(l.x,l.y);if(p[0]<-20||p[1]<-20||p[0]>ov.width+20||p[1]>ov.height+20)continue;g.beginPath();g.arc(p[0],p[1],3.2*d,0,7);g.fillStyle=hexDe(l.c);g.fill();g.lineWidth=1.2*d;g.strokeStyle="rgba(29,22,13,.9)";g.stroke()}
    if(passa&&!arr&&ferr==="sel"&&fl()[passa.k].includes(passa.e)){g.lineWidth=1.4*d;g.strokeStyle="rgba(255,248,230,.85)";tracado(passa.k,passa.e);g.stroke()}
    if(sel.length){g.lineWidth=1.6*d;g.strokeStyle="#f3d27a";const muitos=sel.length>400;for(const s of sel){if(muitos&&s.k==="objetos")continue;if(s.k==="luzes")g.setLineDash([5*d,4*d]);tracado(s.k,s.e);g.stroke();g.setLineDash([])}
      const B=caixaSel(),c=Math.cos(B.r),sn=Math.sin(B.r),P=(a,b)=>tela(B.cx+a*c-b*sn,B.cy+a*sn+b*c),Q=[P(-B.w/2,-B.h/2),P(B.w/2,-B.h/2),P(B.w/2,B.h/2),P(-B.w/2,B.h/2)];
      if(!B.um||muitos){g.beginPath();g.moveTo(Q[0][0],Q[0][1]);for(let i=1;i<4;i++)g.lineTo(Q[i][0],Q[i][1]);g.closePath();g.setLineDash([6*d,4*d]);g.lineWidth=1.2*d;g.stroke();g.setLineDash([])}
      if(!arr||arr.tipo!=="mover")for(const a of alcas()){if(a.t==="girar"){g.beginPath();g.moveTo(a.de[0],a.de[1]);g.lineTo(a.p[0],a.p[1]);g.lineWidth=1.2*d;g.stroke();g.beginPath();g.arc(a.p[0],a.p[1],5.5*d,0,7)}else{g.beginPath();g.rect(a.p[0]-4.5*d,a.p[1]-4.5*d,9*d,9*d)}g.fillStyle="#fff8e6";g.fill();g.lineWidth=1.5*d;g.strokeStyle="#3b2f1c";g.stroke();g.strokeStyle="#f3d27a"}}
    if(arr&&arr.tipo==="caixa"&&arr.moveu){const a=tela(arr.w0[0],arr.w0[1]),b=tela(arr.w1[0],arr.w1[1]);g.fillStyle="rgba(243,210,122,.12)";g.strokeStyle="#f3d27a";g.lineWidth=1.2*d;g.setLineDash([5*d,4*d]);g.beginPath();g.rect(a[0],a[1],b[0]-a[0],b[1]-a[1]);g.fill();g.stroke();g.setLineDash([])}
    // fantasma da arte que vai ser colocada
    if(ferr==="obj"&&cursor&&!arr){const md=medida(pincel.arte),im=R.arte.quadros[md.i],T=R.arte.T,rc=md.rc,p=tela(enc(cursor[0],cursor[2]),enc(cursor[1],cursor[2])),w=md.w*cam.z,h=md.h*cam.z;if(im){g.save();g.translate(p[0],p[1]);g.rotate(pincel.acaso?0:pincel.giro/GR);g.globalAlpha=.6;g.drawImage(im,rc[0]*T,rc[1]*T,(rc[2]-rc[0])*T,(rc[3]-rc[1])*T,-w/2,-h/2,w,h);g.restore()}}};
  const rotulo=()=>{const A=fl(),m=quadros.length?quadros.reduce((a,b)=>a+b,0)/quadros.length:0;info.textContent=A.objetos.length.toLocaleString("pt-BR")+" objetos"+(m?" · "+m.toFixed(1)+" ms":"")};
  const laco=t=>{if(!root.isConnected){vivo=false;if(tSalvar)salvaJa();return}if(vivo)requestAnimationFrame(laco);ajusta();if(!sujo)return;sujo=false;const a=performance.now();R.desenhar(cam,andar,{luz,grade});if(opt.medir)R.terminar();sobre();const d=performance.now()-a;quadros.push(d);if(quadros.length>30)quadros.shift();if(t-ultimo>400){ultimo=t;rotulo()}};
  // ---------- barra de cima ----------
  const bIco=(n,t,fn,extra)=>el("button",Object.assign({type:"button",class:"bt-b bt-i",title:t,"aria-label":t,onclick:fn},extra),ico(n));
  const liga=(n,t,get,set)=>{const b=bIco(n,t,()=>{set(!get());b.setAttribute("aria-pressed",String(get()));sujo=true});b.setAttribute("aria-pressed",String(get()));return b};
  const bDesf=bIco("desf","Desfazer (Ctrl+Z)",()=>H.desfazer()),bRef=bIco("ref","Refazer (Ctrl+Shift+Z)",()=>H.refazer());
  const botoes=()=>{const [a,b]=H?H.pode():[0,0];bDesf.disabled=!a;bRef.disabled=!b;bDesf.title=a?"Desfazer: "+(H.nomeDesfazer()||"última mudança")+" (Ctrl+Z)":"Nada para desfazer";bRef.title=b?"Refazer: "+(H.nomeRefazer()||"mudança")+" (Ctrl+Shift+Z)":"Nada para refazer"};
  const selPasso=el("select",{class:"bt-s","aria-label":"Passo do encaixe",title:"Passo do encaixe na grade",onchange:e=>{snap.passo=+e.target.value}},el("option",{value:"1"},"1 quadrado"),el("option",{value:"0.5",selected:true},"½ quadrado"),el("option",{value:"0.25"},"¼ de quadrado"));
  const bSnap=liga("ima","Encaixar na grade (G) · segure Alt para inverter",()=>snap.on,v=>{snap.on=v;selPasso.disabled=!v});
  let bAnd=[];const nomeA=el("span",{class:"bt-nome"}),grpAnd=el("span",{class:"bt-grp"});
  const marca=()=>{bAnd.forEach((b,i)=>b.setAttribute("aria-pressed",String(i===andar)));nomeA.textContent=fl().nome};
  const irPara=i=>{if(i===andar||!M.andares[i])return;andar=i;sel=[];marca();painel();rotulo();sujo=true};
  const andares=()=>{bAnd=M.andares.map((A,i)=>el("button",{type:"button",class:"bt-b",title:A.nome,onclick:()=>irPara(i)},String(i+1)));grpAnd.replaceChildren(el("span",{class:"bt-t"},"Andar"),...bAnd,nomeA);marca()};
  barra.append(grpAnd,el("span",{class:"bt-sep"}),bDesf,bRef,el("span",{class:"bt-sep"}),bSnap,selPasso,el("span",{class:"bt-sep"}),liga("grade","Mostrar a grade",()=>grade,v=>grade=v),liga("luz","Mostrar a luz e os pontos de luz",()=>luz,v=>luz=v),bIco("enq","Enquadrar o mapa (F)",()=>enquadra()),el("span",{class:"bt-g"}),estado,info);
  // ---------- ferramentas ----------
  const FERR=[["sel","Selecionar","V","Clique para selecionar · arraste para mover · arraste no vazio para a caixa · Shift soma"],["mao","Mover a vista","H","Arraste para andar pelo mapa · a roda do mouse aproxima"],["obj","Colocar objeto","O","Escolha a arte ao lado e clique no mapa · R gira · Esc volta para Selecionar"]];
  const bFerr={};for(const [k,n,t] of FERR){bFerr[k]=el("button",{type:"button",class:"tbtn",title:n+" ("+t+")","aria-label":n,onclick:()=>usa(k)},ico(k),el("span",{class:"tip"},n+" · "+t));ferrs.append(bFerr[k])}
  const usa=k=>{ferr=k;for(const f in bFerr)bFerr[f].setAttribute("aria-pressed",String(f===k));cv.style.cursor=k==="mao"?"grab":k==="obj"?"crosshair":"default";dica.textContent=FERR.find(f=>f[0]===k)[3];assin="";painel();sujo=true};
  // ---------- painel de propriedades ----------
  const campo=(rot,ctrl)=>el("label",{class:"bt-c"},el("span",{},rot),ctrl);
  const num=(rot,v,o,fn)=>{o=o||{};const i=el("input",{type:"number",value:arr2(v,o.casas),step:o.passo||.5,min:o.min,max:o.max,[o.fim?"onchange":"oninput"]:e=>{const x=parseFloat(e.target.value);if(isFinite(x))fn(Math.max(o.min==null?-1e9:o.min,Math.min(o.max==null?1e9:o.max,x)))}});return campo(rot,i)};
  const faixaC=(rot,v,min,max,passo,fn)=>{const tx=x=>typeof rot==="function"?rot(x):rot,c=campo(tx(v),el("input",{type:"range",min,max,step:passo,value:v,oninput:e=>{c.firstChild.textContent=tx(+e.target.value);fn(+e.target.value)}}));return c};
  const corC=(rot,c,fn)=>campo(rot,el("input",{type:"color",value:hexDe(c),oninput:e=>fn(corDe(e.target.value))}));
  const selC=(rot,ops,v,fn)=>campo(rot,el("select",{onchange:e=>fn(e.target.value)},ops.map(([k,n])=>el("option",{value:k,selected:String(k)===String(v)},n))));
  const acao=(n,t,fn)=>el("button",{type:"button",class:"bt-a",title:t,onclick:fn},ico(n),el("span",{},t.replace(/ \(.*/,"")));
  const sec=(t,...k)=>el("section",{class:"bt-sec"},t?el("h3",{},t):null,...k);
  const MATS=Object.entries(MD.MATERIAIS_NOME);
  const acoes=()=>el("div",{class:"bt-acoes"},acao("dup","Duplicar (Ctrl+D)",duplicar),acao("gir","Girar 90° (R)",()=>girar(Math.PI/2)),acao("esp","Espelhar (E)",espelhar),sel.some(s=>s.k==="objetos")?acao("frente","Trazer para a frente (])",()=>ordem(true)):null,sel.some(s=>s.k==="objetos")?acao("tras","Enviar para trás ([)",()=>ordem(false)):null,acao("lixo","Apagar (Delete)",apagar));
  const miniatura=(arte,tam)=>{const c=el("canvas",{width:tam,height:tam}),im=R.arte.quadros[R.arte.indice["o:"+arte]];if(im)c.getContext("2d").drawImage(im,0,0,tam,tam);return c};
  function painel(forca){const sig=ferr+"|"+andar+"|"+sel.map(s=>s.e.id).join(",");if(!forca&&sig===assin&&painelEl.contains(document.activeElement)&&document.activeElement!==painelEl.firstChild)return;assin=sig;const A=fl(),K=[];
    if(ferr==="obj"){pTit.textContent="Colocar objeto";const gradeA=el("div",{class:"bt-pal",role:"listbox","aria-label":"Artes"});for(const k in MD.ARTES){const z=MD.ARTES[k];gradeA.append(el("button",{type:"button",class:"bt-arte",role:"option",title:z[0],"aria-selected":String(k===pincel.arte),onclick:()=>{pincel.arte=k;pincel.camada=null;painel(true);sujo=true}},miniatura(k,52),el("span",{},z[0])))}
      const z=MD.ARTES[pincel.arte];K.push(sec("Arte",gradeA),sec("Como colocar",faixaC(v=>"Tamanho · "+Math.round(v*100)+"%",pincel.esc,.25,4,.05,v=>{pincel.esc=v;sujo=true}),num("Giro (graus)",pincel.giro,{passo:15,casas:0},v=>{pincel.giro=v;sujo=true}),
        el("label",{class:"bt-ck"},el("input",{type:"checkbox",checked:pincel.acaso,onchange:e=>{pincel.acaso=e.target.checked;sujo=true}}),"Giro ao acaso"),num("Camada",pincel.camada==null?z[3]:pincel.camada,{passo:100,casas:0},v=>{pincel.camada=v}),el("p",{class:"bt-nota"},"Camada maior fica por cima. Paredes ficam na 500.")))}
    else if(!sel.length){pTit.textContent="Mapa";
      K.push(sec("Tamanho",el("div",{class:"bt-2"},num("Largura",M.larg,{passo:1,min:4,max:200,casas:0,fim:true},v=>tamanho(Math.round(v),M.alt)),num("Altura",M.alt,{passo:1,min:4,max:200,casas:0,fim:true},v=>tamanho(M.larg,Math.round(v)))),el("p",{class:"bt-nota"},"Em quadrados. O canto de cima à esquerda fica no lugar.")));
      if(A.terreno){const T=A.terreno,usa4=T.tex.filter(t=>t>=0).length>1;K.push(sec(usa4?"Texturas do chão":"Chão",T.tex.map((t,i)=>(t>=0||i===0||usa4)?selC(usa4?"Textura "+(i+1):"Material",MATS,t<0?"neutro":materialDe(M.texturas[t]),v=>{const tex=T.tex.slice();tex[i]=MD.texDe(M,"atlas:m/"+v);exec([{op:"andar",a:andar,de:{terreno:A.terreno},para:{terreno:Object.assign({},A.terreno,{tex})}}],"Trocar o chão")}):null)))}
      K.push(sec("Luz do andar",corC("Luz ambiente",A.ambiente||[1,1,1,1],c=>exec([{op:"andar",a:andar,de:{ambiente:A.ambiente},para:{ambiente:[c[0],c[1],c[2],1]}}],"Luz ambiente","amb")),el("p",{class:"bt-nota"},"Branco é dia claro. Escureça para noite ou interior.")),
        sec("Neste andar",el("p",{class:"bt-nota"},MD.TIPOS.map(k=>(A[k]||[]).length+" "+MD.NOME[k][(A[k]||[]).length===1?0:1]).join(" · "))))}
    else{const n=sel.length,um=n===1?sel[0]:null,cont={};for(const s of sel)cont[s.k]=(cont[s.k]||0)+1;pTit.textContent=um?MD.NOME[um.k][0].replace(/^./,c=>c.toUpperCase())+(um.k==="objetos"?" · "+(MD.ARTES[objetoDe(M.texturas[um.e.t])]||["Arte"])[0]:""):n+" itens";
      if(!um)K.push(sec(null,el("p",{class:"bt-nota"},Object.keys(cont).map(k=>cont[k]+" "+MD.NOME[k][cont[k]===1?0:1]).join(" · "))));K.push(sec(null,acoes()));
      const objs=sel.filter(s=>s.k==="objetos"),com=fn=>{const v=fn(objs[0].e);return objs.every(s=>fn(s.e)===v)?v:null};
      if(um&&um.k==="objetos"){const o=um.e;K.push(sec("Lugar e tamanho",el("div",{class:"bt-2"},num("X",o.x,{},v=>muda(sel,e=>{e.x=v},"Mover","x")),num("Y",o.y,{},v=>muda(sel,e=>{e.y=v},"Mover","y")),num("Largura",o.w,{min:.1,passo:.25},v=>muda(sel,e=>{e.w=v},"Tamanho","w")),num("Altura",o.h,{min:.1,passo:.25},v=>muda(sel,e=>{e.h=v},"Tamanho","h"))),
          num("Giro (graus)",((o.r*GR)%360+360)%360,{passo:15,casas:1},v=>muda(sel,e=>{e.r=v/GR},"Girar","r"))))}
      if(objs.length){const cam0=com(e=>e.l),op=com(e=>e.a==null?1:e.a),cor=objs[0].e.cor||[1,1,1];K.push(sec("Aparência",num("Camada",cam0==null?objs[0].e.l:cam0,{passo:100,casas:0},v=>muda(objs,e=>{e.l=v},"Camada","l")),faixaC(v=>"Opacidade · "+Math.round(v*100)+"%",op==null?1:op,.05,1,.05,v=>muda(objs,e=>{if(v>=1)delete e.a;else e.a=v},"Opacidade","a")),
          corC("Cor (multiplica a arte)",cor,c=>muda(objs,e=>{if(c[0]>.99&&c[1]>.99&&c[2]>.99)delete e.cor;else e.cor=c},"Cor","cor")),objs.some(s=>s.e.cor)?el("button",{type:"button",class:"bt-lk",onclick:()=>{muda(objs,e=>{delete e.cor},"Tirar a cor");painel(true)}},"Tirar a cor"):null))}
      if(um&&um.k==="luzes"){const l=um.e;K.push(sec("Luz",el("div",{class:"bt-2"},num("X",l.x,{},v=>muda(sel,e=>{e.x=v},"Mover","x")),num("Y",l.y,{},v=>muda(sel,e=>{e.y=v},"Mover","y"))),faixaC(v=>"Alcance · "+arr2(v,1)+" quadrados",l.raio,.5,30,.5,v=>{muda(sel,e=>{e.raio=v},"Alcance","raio")}),faixaC(v=>"Força · "+arr2(v,2),l.forca,.05,3,.05,v=>muda(sel,e=>{e.forca=v},"Força","forca")),corC("Cor",l.c,c=>muda(sel,e=>{e.c=[c[0],c[1],c[2],1]},"Cor da luz","c"))))}
      const vet=sel.filter(s=>s.k==="paredes"||s.k==="caminhos"||s.k==="padroes");
      if(vet.length&&vet.length===n){const p0=vet[0],mat=materialDe(M.texturas[p0.e.t]||"");K.push(sec(vet.length===1?"Material":"Material de todos",selC("Material",MATS,mat,v=>muda(vet,e=>{e.t=MD.texDe(M,"atlas:m/"+v)},"Material"))));
        const pars=vet.filter(s=>s.k==="paredes");if(pars.length===n){const r=pars[0].e.raio==null?RAIO_PADRAO:pars[0].e.raio;K.push(sec("Cantos",faixaC(v=>"Arredondamento · "+arr2(v,2),r,0,1,.05,v=>muda(pars,e=>{e.raio=v},"Arredondar cantos","raio")),el("p",{class:"bt-nota"},"Toda parede nasce com o canto arredondado. Zero deixa o canto vivo."),
            faixaC(v=>"Espessura · "+arr2(v,2),pars[0].e.larg||.18,.08,.6,.02,v=>muda(pars,e=>{e.larg=v},"Espessura","larg")),el("label",{class:"bt-ck"},el("input",{type:"checkbox",checked:!!pars[0].e.laco,onchange:e=>muda(pars,w=>{w.laco=e.target.checked},"Fechar parede")}),"Parede fechada")))}
        const cams=vet.filter(s=>s.k==="caminhos");if(cams.length===n)K.push(sec("Caminho",faixaC(v=>"Largura · "+arr2(v,1),cams[0].e.larg||.5,.1,6,.1,v=>muda(cams,e=>{e.larg=v},"Largura","larg")),num("Camada",cams[0].e.l||0,{passo:100,casas:0},v=>muda(cams,e=>{e.l=v},"Camada","l"))));
        const pads=vet.filter(s=>s.k==="padroes");if(pads.length===n)K.push(sec("Forma",num("Camada",pads[0].e.l||0,{passo:100,casas:0},v=>muda(pads,e=>{e.l=v},"Camada","l"))))}}
    pCorpo.replaceChildren(...K)}
  const tamanho=(larg,alt)=>{if(larg===M.larg&&alt===M.alt)return;const ops=[{op:"mapa",de:{larg:M.larg,alt:M.alt},para:{larg,alt}}];M.andares.forEach((A,i)=>{if(A.terreno)ops.push({op:"andar",a:i,de:{terreno:A.terreno},para:{terreno:MD.terrenoRedim(A.terreno,larg,alt)}})});exec(ops,"Tamanho do mapa");enquadra();painel(true)};
  // ---------- mouse, toque e teclado ----------
  const P=new Map();let pin=0;const local=e=>{const r=cv.getBoundingClientRect();return [(e.clientX-r.left)*dpr(),(e.clientY-r.top)*dpr()]};
  const zoomEm=(px,py,f)=>{const w=mundo(px,py);cam.z=Math.max(2,Math.min(400,cam.z*f));cam.x=w[0]-(px-cv.width/2)/cam.z;cam.y=w[1]-(py-cv.height/2)/cam.z;sujo=true};
  cv.addEventListener("contextmenu",e=>e.preventDefault());
  cv.addEventListener("pointerdown",e=>{root.focus({preventScroll:true});try{cv.setPointerCapture(e.pointerId)}catch(_){}const p=local(e);P.set(e.pointerId,p);if(P.size===2){cancela();arr={tipo:"pinca"};pin=0;return}
    const w=mundo(p[0],p[1]),toque=e.pointerType==="touch",vazio=x=>toque?Object.assign({tipo:"pan",p},x):Object.assign({tipo:"caixa",p,w0:w,w1:w,soma:e.shiftKey,moveu:false},x);
    if(e.button===1||e.button===2||ferr==="mao"||espaco){arr={tipo:"pan",p};cv.style.cursor="grabbing";return}
    if(ferr==="obj"){coloca(w,e.altKey);return}
    const hd=alcaEm(p[0],p[1]);if(hd){const B=caixaSel();comeca(hd.t,w,{hd,B,p});return}
    const hits=acertos(w[0],w[1]),topo=hits[0];if(!topo){arr=vazio({limpa:!e.shiftKey});return}
    if(e.shiftKey){if(tem(topo.e))seleciona(sel.filter(s=>s.e!==topo.e));else seleciona(sel.concat([{k:topo.k,e:topo.e}]));return}
    const ja=hits.find(h=>tem(h.e));if(ja){comeca("mover",w,{p,pega:ja,hits});return}
    if(MD.FUNDO[topo.k]){arr=vazio({escolhe:topo});return}
    seleciona([{k:topo.k,e:topo.e}]);comeca("mover",w,{p,pega:topo})});
  cv.addEventListener("pointermove",e=>{const p=local(e),w=mundo(p[0],p[1]);cursor=[w[0],w[1],e.altKey];
    if(!P.has(e.pointerId)){if(ferr==="obj")sujo=true;else if(ferr==="sel"&&!espaco){const h=alcaEm(p[0],p[1]),hs=h?[]:acertos(w[0],w[1]),t=hs[0]||null,ja=hs.some(x=>tem(x.e));cv.style.cursor=h?(h.t==="girar"?"grab":"nwse-resize"):ja?"move":t?"pointer":"default";const nv=t&&!ja?t:null;if((nv&&nv.e)!==(passa&&passa.e)){passa=nv;sujo=true}}return}
    const ant=P.get(e.pointerId);P.set(e.pointerId,p);if(!arr)return;
    if(arr.tipo==="pinca"){if(P.size===2){const [a,b]=[...P.values()],d=Math.hypot(a[0]-b[0],a[1]-b[1]);cam.x-=(p[0]-ant[0])/cam.z/2;cam.y-=(p[1]-ant[1])/cam.z/2;if(pin)zoomEm((a[0]+b[0])/2,(a[1]+b[1])/2,d/pin);pin=d;sujo=true}return}
    if(arr.p&&!arr.moveu&&Math.hypot(p[0]-arr.p[0],p[1]-arr.p[1])<4*dpr())return;arr.moveu=true;
    if(arr.tipo==="pan"){cam.x-=(p[0]-ant[0])/cam.z;cam.y-=(p[1]-ant[1])/cam.z;sujo=true}
    else if(arr.tipo==="caixa"){arr.w1=w;sujo=true}
    else if(arr.tipo==="mover"){const i=arr.itens.findIndex(s=>s.e===arr.pega.e),a0=MD.ancora(arr.pega.k,arr.antes[i]),dx=enc(a0[0]+w[0]-arr.w0[0],e.altKey)-a0[0],dy=enc(a0[1]+w[1]-arr.w0[1],e.altKey)-a0[1];aoVivo({f:(x,y)=>[x+dx,y+dy]})}
    else if(arr.tipo==="girar"){const B=arr.B;let q=Math.atan2(w[1]-B.cy,w[0]-B.cx)-Math.atan2(arr.w0[1]-B.cy,arr.w0[0]-B.cx);if(snap.on!==e.altKey){const st=Math.PI/12,base=B.um?B.r:0;q=Math.round((base+q)/st)*st-base}const c=Math.cos(q),s=Math.sin(q);aoVivo({f:(x,y)=>[B.cx+(x-B.cx)*c-(y-B.cy)*s,B.cy+(x-B.cx)*s+(y-B.cy)*c],rot:q})}
    else if(arr.tipo==="redim"){const B=arr.B,hd=arr.hd,c=Math.cos(B.r),s=Math.sin(B.r),fx=B.cx+(-hd.sx*B.w/2)*c-(-hd.sy*B.h/2)*s,fy=B.cy+(-hd.sx*B.w/2)*s+(-hd.sy*B.h/2)*c,wx=enc(w[0],e.altKey)-fx,wy=enc(w[1],e.altKey)-fy,lx=wx*c+wy*s,ly=-wx*s+wy*c;
      if(B.um){const o=arr.itens[0].e,a=arr.antes[0];let nw=a.w,nh=a.h;if(hd.sx&&hd.sy){if(e.shiftKey){nw=Math.max(.1,lx*hd.sx);nh=Math.max(.1,ly*hd.sy)}else{const k=Math.max(.05,(lx*hd.sx*a.w+ly*hd.sy*a.h)/(a.w*a.w+a.h*a.h));nw=a.w*k;nh=a.h*k}}else if(hd.sx)nw=Math.max(.1,lx*hd.sx);else nh=Math.max(.1,ly*hd.sy);
        MD.poe(o,a);o.w=nw;o.h=nh;const mx=hd.sx*(nw-a.w)/2,my=hd.sy*(nh-a.h)/2;o.x=a.x+mx*c-my*s;o.y=a.y+mx*s+my*c;redesenha(arr.itens)}
      else{const k=Math.max(.05,(lx*hd.sx*B.w+ly*hd.sy*B.h)/(B.w*B.w+B.h*B.h));aoVivo({f:(x,y)=>[fx+(x-fx)*k,fy+(y-fy)*k],s:k})}}});
  const solta=e=>{if(!P.has(e.pointerId))return;P.delete(e.pointerId);pin=0;const a=arr;if(!a)return;if(a.tipo==="pinca"){if(P.size<2)arr=null;return}arr=null;usaCursor();
    if(a.tipo==="pan"){if(!a.moveu){if(a.escolhe)seleciona([{k:a.escolhe.k,e:a.escolhe.e}]);else if(a.limpa)seleciona([])}}
    else if(a.tipo==="caixa"){if(!a.moveu){if(a.escolhe)seleciona([{k:a.escolhe.k,e:a.escolhe.e}]);else if(a.limpa)seleciona([])}
      else{const x0=Math.min(a.w0[0],a.w1[0]),x1=Math.max(a.w0[0],a.w1[0]),y0=Math.min(a.w0[1],a.w1[1]),y1=Math.max(a.w0[1],a.w1[1]),A=fl(),L=a.soma?sel.slice():[];
        for(const k of MD.TIPOS)for(const it of A[k]||[]){if(tem(it)&&a.soma)continue;let ok;if(k==="objetos"||k==="luzes")ok=it.x>=x0&&it.x<=x1&&it.y>=y0&&it.y<=y1;else{const c=MD.caixa(k,it);ok=c[0]>=x0&&c[2]<=x1&&c[1]>=y0&&c[3]<=y1}if(ok)L.push({k,e:it})}seleciona(L)}}
    else if(a.tipo==="mover"){if(a.moveu){arr=a;fecha("Mover");arr=null}else if(a.hits&&a.hits.length>1&&sel.length===1){const i=a.hits.findIndex(h=>h.e===sel[0].e),prox=a.hits[(i+1)%a.hits.length];seleciona([{k:prox.k,e:prox.e}])}}
    else if(a.tipo==="girar"||a.tipo==="redim"){if(a.moveu){arr=a;fecha(a.tipo==="girar"?"Girar":"Mudar o tamanho");arr=null}}
    sujo=true};
  const usaCursor=()=>{cv.style.cursor=ferr==="mao"||espaco?"grab":ferr==="obj"?"crosshair":"default"};
  cv.addEventListener("pointerup",solta);cv.addEventListener("pointercancel",solta);cv.addEventListener("pointerleave",()=>{if(!P.size){cursor=null;passa=null;sujo=true}});
  cv.addEventListener("wheel",e=>{e.preventDefault();const p=local(e);zoomEm(p[0],p[1],Math.exp(-e.deltaY*.0015))},{passive:false});
  root.addEventListener("keydown",e=>{const t=e.target;if(t&&(t.tagName==="INPUT"||t.tagName==="SELECT"||t.tagName==="TEXTAREA")){if(e.key==="Escape")root.focus();return}
    const k=e.key.toLowerCase(),ctrl=e.ctrlKey||e.metaKey,passo=snap.on?snap.passo:.1;let ok=true;
    if(k===" "){espaco=true;usaCursor()}else if(ctrl&&k==="z"){if(e.shiftKey)H.refazer();else H.desfazer()}else if(ctrl&&k==="y")H.refazer();else if(ctrl&&k==="d")duplicar();else if(ctrl&&k==="c")copiar();else if(ctrl&&k==="x"){copiar();apagar()}else if(ctrl&&k==="v")colar();else if(ctrl&&k==="a")tudo();
    else if(ctrl)ok=false;else if(k==="escape"){if(arr)cancela();else if(sel.length)seleciona([]);else if(ferr!=="sel")usa("sel")}else if(k==="delete"||k==="backspace")apagar();
    else if(k==="v")usa("sel");else if(k==="h")usa("mao");else if(k==="o")usa("obj");else if(k==="g")bSnap.click();else if(k==="f")enquadra();
    else if(k==="r"){if(ferr==="obj"){pincel.giro=(pincel.giro+(e.shiftKey?-15:15)+360)%360;painel(true);sujo=true}else girar(e.shiftKey?-Math.PI/2:Math.PI/2)}else if(k==="e")espelhar();else if(k==="]")ordem(true);else if(k==="[")ordem(false);
    else if(k==="arrowleft")empurra(-passo,0);else if(k==="arrowright")empurra(passo,0);else if(k==="arrowup")empurra(0,-passo);else if(k==="arrowdown")empurra(0,passo);else ok=false;
    if(ok)e.preventDefault()});
  root.addEventListener("keyup",e=>{if(e.key===" "){espaco=false;usaCursor()}});root.addEventListener("blur",()=>{espaco=false});
  andares();botoes();usa("sel");enquadra();estado.textContent=opt.salvar?"Salvo":"";requestAnimationFrame(laco);root.focus({preventScroll:true});
  const abertura=performance.now()-t0;
  return {cam,render:R,hist:H,abertura,carga,mapa:M,fechar:()=>{vivo=false;if(tSalvar)salvaJa()},irPara,usa,selecao:()=>sel,seleciona,tudo,apagar,duplicar,girar,espelhar,ordem,copiar,colar,estado:()=>({andar,luz,grade,ferr,snap:Object.assign({},snap),sel:sel.length}),
    set:o=>{if(o.luz!=null)luz=o.luz;if(o.grade!=null)grade=o.grade;if(o.cam)Object.assign(cam,o.cam);if(o.snap!=null)snap.on=o.snap;if(o.passo)snap.passo=o.passo;if(o.arte)pincel.arte=o.arte;sujo=true},
    // ponto do mapa -> ponto da janela (para testes e ajudas)
    naTela:(x,y)=>{const r=cv.getBoundingClientRect(),p=tela(x,y);return [r.left+p[0]/dpr(),r.top+p[1]/dpr()]},salvarAgora:salvaJa,
    agora:()=>{ajusta();const a=performance.now();R.desenhar(cam,andar,{luz,grade});R.terminar();sobre();return performance.now()-a}}}
