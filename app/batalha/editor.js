// Atlas - Modo Batalha: editor. Barra de cima (mapa), ferramentas a esquerda, propriedades a direita, dica embaixo.
// Tudo o que muda o mapa passa pelo historico de comandos (desfazer e refazer) e e salvo sozinho.
import {criaRender} from "./render.js";
import {criaHistorico,alcance} from "./comandos.js";
import * as MD from "./modelo.js";
import {materialDe,objetoDe} from "./arte.js";
import {arredonda,RAIO_PADRAO,formaPontos,projeta,comprimento,pontoEm} from "./vetor.js";
const el=(t,a,...k)=>{const e=document.createElement(t);for(const n in a||{}){if(n==="class")e.className=a[n];else if(n.startsWith("on"))e.addEventListener(n.slice(2),a[n]);else if(a[n]!=null&&a[n]!==false)e.setAttribute(n,a[n]===true?"":a[n])}for(const x of k.flat())if(x!=null)e.append(x);return e};
const IC={sel:"M5 3l14 8-6 2-2 6z",mao:"M8 13V6a1.5 1.5 0 013 0v5V4.5a1.5 1.5 0 013 0V11V6a1.5 1.5 0 013 0v9a6 6 0 01-6 6h-1a6 6 0 01-5-2.6L3.6 15a1.5 1.5 0 012.5-1.6L8 15.5",obj:"M4 8l8-4 8 4v8l-8 4-8-4zM4 8l8 4 8-4M12 12v8",par:"M3 7h18M3 12h18M3 17h18M8 7v5M16 7v5M12 12v5M6 17v4M18 17v4M3 3v18M21 3v18",porta:"M5 21V4h10v17M15 21h4M12 13h.01M5 21h10",lz:"M9 18h6M10 21h4M12 3a6 6 0 00-3.5 10.9V16h7v-2.1A6 6 0 0012 3z",esp:"M4 6h.01M8 3.5h.01M7.5 8.5h.01M12 6h.01M3.5 11.5h.01M11 11h.01M16 9h.01M17 17m-4 0a4 4 0 108 0a4 4 0 10-8 0",
  desf:"M9 14L4 9l5-5M4 9h10a6 6 0 010 12h-3",ref:"M15 14l5-5-5-5M20 9H10a6 6 0 000 12h3",ima:"M6 3v9a6 6 0 0012 0V3h-4v9a2 2 0 01-4 0V3zM6 7h4M14 7h4",grade:"M3 3h18v18H3zM9 3v18M15 3v18M3 9h18M3 15h18",
  luz:"M12 8a4 4 0 100 8 4 4 0 000-8zM12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5L19 19M19 5l-1.5 1.5M6.5 17.5L5 19",enq:"M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5",dup:"M8 8h12v12H8zM4 16V4h12",esp2:"M12 3v18M9 7l-5 5 5 5zM15 7l5 5-5 5z",
  gir:"M20 12a8 8 0 11-3-6.2M20 4v5h-5",frente:"M12 19V5M6 11l6-6 6 6",tras:"M12 5v14M6 13l6 6 6-6",lixo:"M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13",painel:"M4 6h16M4 12h16M4 18h10"};
const ico=n=>{const s=document.createElementNS("http://www.w3.org/2000/svg","svg");s.setAttribute("viewBox","0 0 24 24");s.setAttribute("aria-hidden","true");const p=document.createElementNS("http://www.w3.org/2000/svg","path");p.setAttribute("d",IC[n]);s.append(p);return s};
const hexDe=c=>"#"+[0,1,2].map(i=>Math.round(Math.max(0,Math.min(1,c[i]))*255).toString(16).padStart(2,"0")).join(""),corDe=h=>[parseInt(h.substr(1,2),16)/255,parseInt(h.substr(3,2),16)/255,parseInt(h.substr(5,2),16)/255];
const arr2=(v,c)=>{const f=Math.pow(10,c==null?2:c);return Math.round(v*f)/f},GR=180/Math.PI;
export function abrirEditor(raiz,M,opt){opt=opt||{};MD.garanteIds(M);for(const A of M.andares){for(const q of A.portais||[])if(q.id==null)q.id=MD.novoId(M);MD.prendePortais(A);MD.sincroniza(A)}
  raiz.replaceChildren();const cv=el("canvas",{class:"bt-cv"}),ov=el("canvas",{class:"bt-ov"}),dica=el("div",{class:"bt-dica"}),caixaCv=el("div",{class:"bt-wrap"},cv,ov,dica);
  const barra=el("div",{class:"bt-bar"}),ferrs=el("div",{class:"bt-ferr",role:"toolbar","aria-label":"Ferramentas"}),pCorpo=el("div",{class:"bt-pc"}),pTit=el("span",{class:"bt-pt"}),painelEl=el("aside",{class:"bt-painel"},el("button",{type:"button",class:"bt-ph",onclick:()=>painelEl.classList.toggle("aberto")},ico("painel"),pTit),pCorpo);
  const root=el("div",{class:"bt bt-ed",tabindex:"-1"},barra,el("div",{class:"bt-meio"},ferrs,caixaCv,painelEl));raiz.append(root);
  let R;try{R=criaRender(cv)}catch(e){R=null;console.error(e)}
  if(!R){caixaCv.replaceChildren(el("p",{class:"bt-msg"},"Este navegador não liberou o WebGL2, que o Modo Batalha usa para desenhar."));return null}
  const t0=performance.now(),carga=R.carregar(M),g=ov.getContext("2d");
  let andar=0,luz=true,grade=true,cam={x:M.larg/2,y:M.alt/2,z:20},sujo=true,vivo=true,ultimo=0,quadros=[],ferr="sel",sel=[],arr=null,passa=null,espaco=false,cursor=null,area=null,assin="",tSalvar=0,salvando=false;
  const snap={on:true,passo:.5},pincel={arte:"arvore",esc:1,giro:0,acaso:false,camada:null};
  const espalha={artes:new Set(["arvore","arvoreEscura","arbusto"]),raio:3,dens:.45,dist:.8,tamMin:.8,tamMax:1.2,giro:true,espelho:true,cor:true,apagar:false},luzP={raio:6,claro:2.5,forca:1,c:[1,.62,.25,1]};
  let busca="",cat="",pendente=false,bLuz=null,traco=null,vsel=null,pPrev=null;
  const paredeP={modo:"linha",tex:"pedra",larg:.18,raio:RAIO_PADRAO,piso:true,pisoTex:"madeira",lados:6},portaP={tipo:"porta",larg:1};
  const VET={paredes:1,caminhos:1,padroes:1};
  const fl=()=>M.andares[andar],dpr=()=>Math.min(window.devicePixelRatio||1,2);
  const mundo=(px,py)=>[cam.x+(px-cv.width/2)/cam.z,cam.y+(py-cv.height/2)/cam.z],tela=(x,y)=>[(x-cam.x)*cam.z+cv.width/2,(y-cam.y)*cam.z+cv.height/2];
  const enc=(v,alt)=>(snap.on!==!!alt)?Math.round(v/snap.passo)*snap.passo:v;
  // ---------- historico e salvamento ----------
  const estado=el("span",{class:"bt-est"}),info=el("span",{class:"bt-info"});
  const salvaJa=async()=>{clearTimeout(tSalvar);tSalvar=0;if(!opt.salvar)return;salvando=true;estado.textContent="Salvando…";try{await opt.salvar(M);estado.textContent="Salvo"}catch(e){console.error(e);estado.textContent="Não foi possível salvar"}salvando=false};
  const agendaSalvar=()=>{estado.textContent="Alterado";clearTimeout(tSalvar);tSalvar=setTimeout(salvaJa,700)};
  const H=criaHistorico(M,(lote,sentido)=>{for(const A of M.andares)MD.sincroniza(A);if(vsel&&(!vsel.e.p||vsel.i>=vsel.e.p.length))vsel=null;if(sentido!==0){const al=alcance(lote);if(al.tudo){R.carregar(M);H.esquece()}else for(const a of al.andares){let ok=false;
        if(al.leve){const objs=[],luzes=[];for(const o of lote.ops){if(o.a!==a)continue;const e=H.item(a,o.k,o.id);if(e)(o.k==="luzes"?luzes:objs).push(e)}ok=R.atualiza(a,objs,luzes)}if(!ok)R.refazAndar(a)}}
    // tira da selecao o que deixou de existir
    if(sel.length){const A=fl(),V={};sel=sel.filter(s=>(V[s.k]||(V[s.k]=new Set(A[s.k]))).has(s.e))}
    botoes();painel();sujo=true;agendaSalvar()});
  // ---------- selecao ----------
  const tem=e=>sel.some(s=>s.e===e);
  const seleciona=L=>{sel=L.slice();passa=null;vsel=null;painel();sujo=true};
  const acertos=(x,y)=>{const A=fl(),tol=7*dpr()/cam.z;let L=[],n=0;for(const k of MD.TIPOS){if(k==="luzes"&&!luz)continue;for(const e of A[k]||[]){n++;if(MD.acerta(k,e,x,y,tol))L.push({k,e,c:MD.camada(k,e),n})}}L.sort((a,b)=>b.c-a.c||b.n-a.n);
    const W=new Map();for(const w of A.paredes||[])W.set(w.id,w);const vis=new Set();return L.map(h=>{if(h.k==="padroes"&&h.e.parede!=null){const w=W.get(h.e.parede);if(w)return {k:"paredes",e:w,c:h.c,n:h.n}}return h}).filter(h=>vis.has(h.e)?false:(vis.add(h.e),true))};
  // caixa da selecao: um objeto sozinho guarda o giro dele; o resto usa a caixa reta que cobre tudo
  const caixaSel=()=>{if(!sel.length)return null;if(sel.length===1&&sel[0].k==="objetos"){const o=sel[0].e;return {cx:o.x,cy:o.y,w:o.w,h:o.h,r:o.r,um:true}}const b=MD.uneCaixas(sel.map(s=>MD.caixa(s.k,s.e)));return {cx:(b[0]+b[2])/2,cy:(b[1]+b[3])/2,w:Math.max(b[2]-b[0],.2),h:Math.max(b[3]-b[1],.2),r:0,um:false}};
  const alcas=()=>{const B=caixaSel();if(!B)return [];const c=Math.cos(B.r),s=Math.sin(B.r),P=(a,b)=>tela(B.cx+a*c-b*s,B.cy+a*s+b*c),L=[];for(const [sx,sy] of[[-1,-1],[1,-1],[1,1],[-1,1]])L.push({t:"redim",sx,sy,p:P(sx*B.w/2,sy*B.h/2)});
    if(B.um)for(const [sx,sy] of[[0,-1],[1,0],[0,1],[-1,0]])L.push({t:"redim",sx,sy,p:P(sx*B.w/2,sy*B.h/2)});const topo=P(0,-B.h/2),d=26*dpr();L.push({t:"girar",p:[topo[0]+s*d,topo[1]-c*d],de:topo});
    if(vetUm()){const e=sel[0].e,n=e.p.length,M2=[];for(let i=0;i<n-(e.laco||sel[0].k==="padroes"?0:1);i++){const a=e.p[i],b=e.p[(i+1)%n];M2.push({t:"meio",i,p:tela((a[0]+b[0])/2,(a[1]+b[1])/2)})}return L.filter(a=>a.t==="girar").concat(M2,e.p.map((q,i)=>({t:"vert",i,p:tela(q[0],q[1])})))}return L};
  const vetUm=()=>sel.length===1&&VET[sel[0].k]&&!(sel[0].k==="padroes"&&sel[0].e.parede!=null)&&ferr==="sel";
  const alcaEm=(px,py)=>{const r=10*dpr();for(const a of alcas().reverse())if(Math.hypot(a.p[0]-px,a.p[1]-py)<=r)return a;return null};
  // itens que acompanham a selecao (os portais das paredes escolhidas)
  const comPortais=L=>{const ids=new Set(L.filter(s=>s.k==="paredes").map(s=>s.e.id));if(!ids.size)return L;const ja=new Set(L.map(s=>s.e));return L.concat(MD.anexos(fl(),ids).filter(s=>!ja.has(s.e)))};
  const redesenha=itens=>{MD.sincroniza(fl());const objs=[],luzes=[];let leve=true;for(const s of itens){if(s.k==="objetos")objs.push(s.e);else if(s.k==="luzes")luzes.push(s.e);else leve=false}if(!leve||!R.atualiza(andar,objs,luzes))R.refazAndar(andar);sujo=true};
  // muda os itens ao vivo a partir das fotos tiradas no começo do arrasto
  const aoVivo=T=>{arr.itens.forEach((s,i)=>{MD.poe(s.e,arr.antes[i]);MD.transforma(s.k,s.e,T)});redesenha(arr.itens)};
  const fecha=nome=>{const ops=[];arr.itens.forEach((s,i)=>{const de=arr.antes[i],para=MD.foto(s.e);if(JSON.stringify(de)!==JSON.stringify(para))ops.push({op:"muda",a:andar,k:s.k,id:s.e.id,de,para})});H.registra(ops,{nome});painel()};
  const cancela=()=>{if(arr&&arr.ops){fechaTraco(arr);return}if(arr&&arr.itens&&arr.moveu){arr.itens.forEach((s,i)=>MD.poe(s.e,arr.antes[i]));redesenha(arr.itens)}arr=null;sujo=true;painel()};
  const comeca=(tipo,w,extra)=>{const itens=comPortais(sel);arr=Object.assign({tipo,itens,antes:itens.map(s=>MD.foto(s.e)),w0:w,moveu:false},extra)};
  // ---------- acoes ----------
  const exec=(ops,nome,junta)=>H.exec(ops,{nome,junta});
  const muda=(L,fn,nome,junta)=>{const ops=[];for(const s of L){const de=MD.foto(s.e),para=MD.foto(s.e);fn(para,s.k);ops.push({op:"muda",a:andar,k:s.k,id:s.e.id,de,para})}exec(ops,nome,junta)};
  const transf=(T,nome,junta)=>{const ops=[];for(const s of comPortais(sel)){const de=MD.foto(s.e),c=MD.foto(s.e);MD.transforma(s.k,c,T);ops.push({op:"muda",a:andar,k:s.k,id:s.e.id,de,para:c})}exec(ops,nome,junta)};
  const apagar=()=>{if(!sel.length)return;const A=fl(),ops=[];for(const s of comPortais(sel))ops.push({op:"apaga",a:andar,k:s.k,item:s.e,pos:A[s.k].indexOf(s.e)});ops.sort((a,b)=>b.pos-a.pos);const n=sel.length;sel=[];exec(ops,"Apagar "+n)};
  const copias=(L,dx,dy)=>{const ops=[],novos=[],A=fl();for(const s of L){if(s.e.parede!=null&&(s.k==="padroes"||L.some(o=>o.k==="paredes"&&o.e.id===s.e.parede)))continue;const c=MD.clona(M,s.k,s.e);MD.transforma(s.k,c,{f:(x,y)=>[x+dx,y+dy]});ops.push({op:"cria",a:andar,k:s.k,item:c});novos.push({k:s.k,e:c});
      if(s.k==="paredes"&&s.e.id!=null)for(const x of MD.anexos(A,new Set([s.e.id]))){const p=MD.clona(M,x.k,x.e);p.parede=c.id;MD.transforma(x.k,p,{f:(x2,y2)=>[x2+dx,y2+dy]});ops.push({op:"cria",a:andar,k:x.k,item:p})}}return {ops,novos}};
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
  const tudo=()=>{const A=fl(),L=[];for(const k of MD.TIPOS)for(const e of A[k]||[])if(!(k==="padroes"&&e.parede!=null))L.push({k,e});seleciona(L)};
  // ---------- paredes e comodos ----------
  const criaParede=(P,laco)=>{const w={id:MD.novoId(M),t:MD.texDe(M,"atlas:m/"+paredeP.tex),p:P.map(q=>[+q[0].toFixed(4),+q[1].toFixed(4)]),laco:!!laco,raio:paredeP.raio,larg:paredeP.larg,tipo:0,sombra:true},ops=[{op:"cria",a:andar,k:"paredes",item:w}];
    if(laco&&paredeP.piso)ops.push({op:"cria",a:andar,k:"padroes",item:{id:MD.novoId(M),t:MD.texDe(M,"atlas:m/"+paredeP.pisoTex),p:w.p,l:-40,parede:w.id}});exec(ops,laco?"Cômodo":"Parede");return w};
  const fimTraco=fechar=>{const t=traco;traco=null;if(t&&t.P.length>=2)criaParede(t.P,fechar&&t.P.length>=3);sujo=true};
  const apagaPonto=()=>{const v=vsel;if(!v||!sel.length)return;const o=v.e,min=(o.laco||sel[0].k==="padroes")?3:2;vsel=null;if(o.p.length<=min){apagar();return}muda([{k:sel[0].k,e:o}],x=>{x.p=x.p.filter((_,i)=>i!==v.i);if(x.raios)x.raios=x.raios.filter((_,i)=>i!==v.i)},"Apagar ponto");painel(true)};
  const pisoDe=w=>(fl().padroes||[]).find(f=>f.parede===w.id);
  const ligaPiso=(w,on)=>{const A=fl(),f=pisoDe(w);if(on&&!f)exec([{op:"cria",a:andar,k:"padroes",item:{id:MD.novoId(M),t:MD.texDe(M,"atlas:m/"+paredeP.pisoTex),p:w.p,l:-40,parede:w.id}}],"Pôr piso");else if(!on&&f)exec([{op:"apaga",a:andar,k:"padroes",item:f,pos:A.padroes.indexOf(f)}],"Tirar piso")};
  // portas e janelas: acha a parede mais perto do cursor e o ponto dela (encaixado na grade ao longo da parede)
  const portaEm=(x,y,alt)=>{let m=null;for(const w of fl().paredes||[]){const r=projeta(MD.trajeto(w),w.laco,x,y);if(r.dist<.6&&(!m||r.dist<m.dist))m=Object.assign(r,{w})}if(!m)return null;const L=comprimento(MD.trajeto(m.w),m.w.laco),h=portaP.larg/2;
    let d=enc(m.d,alt);if(!m.w.laco)d=Math.max(Math.min(h,L/2),Math.min(L-Math.min(h,L/2),d));return {w:m.w,d,h:Math.min(h,L/2)}};
  const poePorta=pp=>{const q={id:MD.novoId(M),t:MD.texDe(M,"atlas:p/"+portaP.tipo),tipo:portaP.tipo,parede:pp.w.id,d:+pp.d.toFixed(4),raio:pp.h,fechado:true,x:0,y:0,dx:1,dy:0,r:0};exec([{op:"cria",a:andar,k:"portais",item:q}],portaP.tipo==="janela"?"Pôr janela":"Pôr porta")};
  // tamanho de uma arte propria: o lado maior vem da tabela, a proporcao vem do recorte da arte
  const medida=(nome,esc)=>{esc=esc==null?pincel.esc:esc;const z=MD.ARTES[nome]||MD.ARTES.generico,i=R.arte.indice["o:"+nome],rc=R.arte.recorte[i]||[0,0,1,1],S=Math.max(z[1],z[2]),p=(rc[2]-rc[0])/(rc[3]-rc[1]);return {z,i,rc,w:(p>=1?S:S*p)*esc,h:(p>=1?S/p:S)*esc}};
  // objetos novos entram na lista na hora (o andar e refeito no proximo quadro) e o traco inteiro vira um passo de desfazer
  const novoObj=(x,y)=>{const md=medida(pincel.arte),z=md.z;return {id:MD.novoId(M),t:MD.texDe(M,"atlas:o/"+pincel.arte),x,y,r:pincel.acaso?Math.floor(Math.random()*24)*Math.PI/12:pincel.giro/GR,w:arr2(md.w,3),h:arr2(md.h,3),l:pincel.camada==null?z[3]:pincel.camada}};
  const carimba=(a,x,y)=>{const o=novoObj(x,y);fl().objetos.push(o);a.ops.push({op:"cria",a:andar,k:"objetos",item:o});a.ult=[x,y];a.passo=Math.max(.5,Math.min(o.w,o.h));pendente=true;sujo=true};
  const fechaTraco=a=>{if(a!==arr&&arr!==null&&a.tipo!==arr.tipo)return;arr=null;if(!a.ops||!a.ops.length){sujo=true;return}const n=a.ops.length,nm=a.tipo==="carimbo"?(n>1?"Carimbar "+n+" objetos":"Colocar "+(MD.ARTES[pincel.arte]||["objeto"])[0].toLowerCase()):a.apagar?"Apagar "+n+" com o pincel":"Espalhar "+n+" objetos";H.esquece();H.registra(a.ops,{nome:nm});rotulo()};
  // pincel de espalhar: sorteia pontos no circulo e so aceita onde ha espaco (grade de busca montada no comeco do traco)
  const raioObj=o=>Math.max(o.w,o.h)*.4;
  const inicioEsp=(w,apagar)=>{const A=fl(),C=2,hash=new Map(),poeH=o=>{const k=Math.floor(o.x/C)+","+Math.floor(o.y/C);let L=hash.get(k);if(!L)hash.set(k,L=[]);L.push(o)};for(const o of A.objetos)if(espalha.artes.has(objetoDe(M.texturas[o.t])))poeH(o);
    arr={tipo:"esp",apagar,hash,poeH,C,ops:[],ult:null};passoEsp(w)};
  const passoEsp=w=>{const a=arr,A=fl(),R0=espalha.raio;if(a.ult&&Math.hypot(w[0]-a.ult[0],w[1]-a.ult[1])<R0*.3)return;a.ult=w;
    const perto=(x,y,r)=>{const L=[];for(let i=Math.floor((x-r)/a.C);i<=Math.floor((x+r)/a.C);i++)for(let j=Math.floor((y-r)/a.C);j<=Math.floor((y+r)/a.C);j++){const q=a.hash.get(i+","+j);if(q)for(const o of q)L.push(o)}return L};
    if(a.apagar){for(const o of perto(w[0],w[1],R0+.1)){if(Math.hypot(o.x-w[0],o.y-w[1])>R0)continue;const pos=A.objetos.indexOf(o);if(pos<0)continue;A.objetos.splice(pos,1);a.ops.push({op:"apaga",a:andar,k:"objetos",item:o,pos});const L=a.hash.get(Math.floor(o.x/a.C)+","+Math.floor(o.y/a.C));L.splice(L.indexOf(o),1);pendente=true}sujo=true;return}
    const lista=[...espalha.artes];let tam=0;for(const k of lista){const md=medida(k,1);tam+=Math.sqrt(md.w*md.h)}tam=tam/lista.length*(espalha.tamMin+espalha.tamMax)/2*Math.max(.3,espalha.dist);
    const alvo=Math.max(1,Math.min(90,Math.round(espalha.dens*Math.PI*R0*R0/(tam*tam)*1.3)));let feitos=0;
    for(let t=0;t<alvo*5&&feitos<alvo;t++){const an=Math.random()*Math.PI*2,rr=R0*Math.sqrt(Math.random()),x=w[0]+Math.cos(an)*rr,y=w[1]+Math.sin(an)*rr;if(x<0||y<0||x>M.larg||y>M.alt)continue;
      const k=lista[Math.floor(Math.random()*lista.length)],md=medida(k,1),s=espalha.tamMin+Math.random()*(espalha.tamMax-espalha.tamMin),o={id:MD.novoId(M),t:MD.texDe(M,"atlas:o/"+k),x:arr2(x,3),y:arr2(y,3),r:espalha.giro?arr2(Math.random()*Math.PI*2,3):0,w:arr2(md.w*s,3),h:arr2(md.h*s,3),l:md.z[3]};
      if(espalha.espelho&&Math.random()<.5)o.m=1;if(espalha.cor){const mz=Math.round((Math.random()-.5)*18),b=arr2(.9+Math.random()*.2,2);if(mz)o.mz=mz;if(b!==1)o.bri=b}
      const ro=raioObj(o)*espalha.dist;let livre=true;for(const q of perto(x,y,ro+3)){if(Math.hypot(q.x-x,q.y-y)<ro+raioObj(q)*espalha.dist){livre=false;break}}if(!livre)continue;
      A.objetos.push(o);a.poeH(o);a.ops.push({op:"cria",a:andar,k:"objetos",item:o});feitos++}
    if(feitos)pendente=true;sujo=true};
  const acende=(x,y)=>{const l={id:MD.novoId(M),x,y,raio:luzP.raio,claro:luzP.claro,forca:luzP.forca,c:luzP.c.slice(0,3).concat(1),sombras:true};if(!luz){luz=true;if(bLuz)bLuz.setAttribute("aria-pressed","true")}exec([{op:"cria",a:andar,k:"luzes",item:l}],"Acender luz")};
  // ---------- desenho ----------
  const ajusta=()=>{const r=caixaCv.getBoundingClientRect(),w=Math.max(2,Math.round(r.width*dpr())),h=Math.max(2,Math.round(r.height*dpr()));if(cv.width!==w||cv.height!==h){cv.width=w;cv.height=h;ov.width=w;ov.height=h;sujo=true}};
  const enquadra=()=>{ajusta();cam.z=Math.min(cv.width/(M.larg+2),cv.height/(M.alt+2));cam.x=M.larg/2;cam.y=M.alt/2;sujo=true};
  const tracado=(k,e)=>{g.beginPath();if(k==="objetos"){const C=MD.cantos(e).map(p=>tela(p[0],p[1]));g.moveTo(C[0][0],C[0][1]);for(let i=1;i<4;i++)g.lineTo(C[i][0],C[i][1]);g.closePath()}
    else if(k==="luzes"){const p=tela(e.x,e.y);g.arc(p[0],p[1],e.raio*cam.z,0,7)}
    else if(k==="portais"){const a=tela(e.x-e.dx*e.raio,e.y-e.dy*e.raio),b=tela(e.x+e.dx*e.raio,e.y+e.dy*e.raio),nx=-e.dy*.2*cam.z,ny=e.dx*.2*cam.z;g.moveTo(a[0]+nx,a[1]+ny);g.lineTo(b[0]+nx,b[1]+ny);g.lineTo(b[0]-nx,b[1]-ny);g.lineTo(a[0]-nx,a[1]-ny);g.closePath()}
    else{const P=k==="paredes"?arredonda(e.p,e.raio==null?RAIO_PADRAO:e.raio,e.laco):e.p;P.forEach((q,i)=>{const p=tela(q[0],q[1]);if(i)g.lineTo(p[0],p[1]);else g.moveTo(p[0],p[1])});if(e.laco||k==="padroes")g.closePath()}};
  const sobre=()=>{const d=dpr();g.setTransform(1,0,0,1,0,0);g.clearRect(0,0,ov.width,ov.height);g.lineJoin="round";
    // luzes: um marcador pequeno em cada uma
    if(luz)for(const l of fl().luzes||[]){const p=tela(l.x,l.y);if(p[0]<-20||p[1]<-20||p[0]>ov.width+20||p[1]>ov.height+20)continue;g.beginPath();g.arc(p[0],p[1],3.2*d,0,7);g.fillStyle=hexDe(l.c);g.fill();g.lineWidth=1.2*d;g.strokeStyle="rgba(29,22,13,.9)";g.stroke()}
    if(passa&&!arr&&ferr==="sel"&&fl()[passa.k].includes(passa.e)){g.lineWidth=1.4*d;g.strokeStyle="rgba(255,248,230,.85)";tracado(passa.k,passa.e);g.stroke()}
    if(sel.length){g.lineWidth=1.6*d;g.strokeStyle="#f3d27a";const muitos=sel.length>400;for(const s of sel){if(muitos&&s.k==="objetos")continue;if(s.k==="luzes")g.setLineDash([5*d,4*d]);tracado(s.k,s.e);g.stroke();g.setLineDash([]);if(s.k==="luzes"){const p=tela(s.e.x,s.e.y);g.beginPath();g.arc(p[0],p[1],(s.e.claro==null?s.e.raio*.45:s.e.claro)*cam.z,0,7);g.stroke()}}
      const B=caixaSel(),c=Math.cos(B.r),sn=Math.sin(B.r),P=(a,b)=>tela(B.cx+a*c-b*sn,B.cy+a*sn+b*c),Q=[P(-B.w/2,-B.h/2),P(B.w/2,-B.h/2),P(B.w/2,B.h/2),P(-B.w/2,B.h/2)];
      if(!B.um||muitos){g.beginPath();g.moveTo(Q[0][0],Q[0][1]);for(let i=1;i<4;i++)g.lineTo(Q[i][0],Q[i][1]);g.closePath();g.setLineDash([6*d,4*d]);g.lineWidth=1.2*d;g.stroke();g.setLineDash([])}
      if(!arr||arr.tipo!=="mover")for(const a of alcas()){let cor="#fff8e6";if(a.t==="girar"){g.beginPath();g.moveTo(a.de[0],a.de[1]);g.lineTo(a.p[0],a.p[1]);g.lineWidth=1.2*d;g.stroke();g.beginPath();g.arc(a.p[0],a.p[1],5.5*d,0,7)}else if(a.t==="vert"){g.beginPath();g.arc(a.p[0],a.p[1],5*d,0,7);if(vsel&&vsel.i===a.i)cor="#f3d27a"}else if(a.t==="meio"){g.beginPath();g.arc(a.p[0],a.p[1],3.2*d,0,7);cor="rgba(255,248,230,.55)"}else{g.beginPath();g.rect(a.p[0]-4.5*d,a.p[1]-4.5*d,9*d,9*d)}g.fillStyle=cor;g.fill();g.lineWidth=1.5*d;g.strokeStyle="#3b2f1c";g.stroke();g.strokeStyle="#f3d27a"}}
    if(arr&&arr.tipo==="caixa"&&arr.moveu){const a=tela(arr.w0[0],arr.w0[1]),b=tela(arr.w1[0],arr.w1[1]);g.fillStyle="rgba(243,210,122,.12)";g.strokeStyle="#f3d27a";g.lineWidth=1.2*d;g.setLineDash([5*d,4*d]);g.beginPath();g.rect(a[0],a[1],b[0]-a[0],b[1]-a[1]);g.fill();g.stroke();g.setLineDash([])}
    // parede sendo desenhada: mostra a parede como vai ficar (cantos arredondados) ate o cursor
    if(ferr==="par"){const fita2=(P,fechada)=>{if(P.length<2)return;const Q=arredonda(P,paredeP.raio,fechada);g.beginPath();Q.forEach((q,i)=>{const p=tela(q[0],q[1]);if(i)g.lineTo(p[0],p[1]);else g.moveTo(p[0],p[1])});if(fechada)g.closePath();g.lineJoin="round";g.lineCap="round";g.lineWidth=Math.max(2*d,(paredeP.larg+.12)*cam.z);g.strokeStyle="rgba(42,32,24,.8)";g.stroke();g.lineWidth=Math.max(1.2*d,paredeP.larg*cam.z);g.strokeStyle="rgba(243,210,122,.85)";g.stroke()};
      const cur=cursor?[enc(cursor[0],cursor[2]),enc(cursor[1],cursor[2])]:null;
      if(arr&&arr.tipo==="forma"&&arr.moveu){const P2=formaPontos(paredeP.modo,arr.a,arr.b,paredeP.lados);if(P2.length>=3){if(paredeP.piso){g.beginPath();arredonda(P2,paredeP.raio,true).forEach((q,i)=>{const p=tela(q[0],q[1]);if(i)g.lineTo(p[0],p[1]);else g.moveTo(p[0],p[1])});g.closePath();g.fillStyle="rgba(243,210,122,.12)";g.fill()}fita2(P2,true)}}
      else if(traco){const P2=cur?traco.P.concat([cur]):traco.P;fita2(P2,false);const f=tela(traco.P[0][0],traco.P[0][1]),fecha2=cur&&traco.P.length>=3&&Math.hypot(cur[0]-traco.P[0][0],cur[1]-traco.P[0][1])<Math.max(.2,9*dpr()/cam.z);g.beginPath();g.arc(f[0],f[1],(fecha2?8:5)*d,0,7);g.fillStyle=fecha2?"#f3d27a":"#fff8e6";g.fill();g.lineWidth=1.5*d;g.strokeStyle="#3b2f1c";g.stroke()}
      if(cur&&!arr){const p=tela(cur[0],cur[1]);g.beginPath();g.arc(p[0],p[1],3.5*d,0,7);g.fillStyle="#f3d27a";g.fill()}}
    if(ferr==="porta"&&pPrev){const q=pPrev,pt=pontoEm(MD.trajeto(q.w),q.w.laco,q.d),a=tela(pt[0]-pt[2]*q.h,pt[1]-pt[3]*q.h),b=tela(pt[0]+pt[2]*q.h,pt[1]+pt[3]*q.h);g.lineCap="butt";g.beginPath();g.moveTo(a[0],a[1]);g.lineTo(b[0],b[1]);g.lineWidth=Math.max(6*d,.34*cam.z);g.strokeStyle="rgba(42,32,24,.85)";g.stroke();g.lineWidth=Math.max(3*d,.22*cam.z);g.strokeStyle=portaP.tipo==="janela"?"#9fd0e6":"#c98a4a";g.stroke();g.lineCap="round"}
    if(ferr==="esp"&&cursor){const p=tela(cursor[0],cursor[1]),ap=espalha.apagar!==!!cursor[2];g.beginPath();g.arc(p[0],p[1],espalha.raio*cam.z,0,7);g.lineWidth=1.6*d;g.strokeStyle=ap?"#e0705f":"#f3d27a";g.setLineDash(ap?[6*d,4*d]:[]);g.stroke();g.setLineDash([]);g.fillStyle=ap?"rgba(224,112,95,.10)":"rgba(243,210,122,.08)";g.fill()}
    if(ferr==="lz"&&cursor&&!arr){const p=tela(enc(cursor[0],cursor[2]),enc(cursor[1],cursor[2])),c=hexDe(luzP.c);g.lineWidth=1.4*d;g.strokeStyle=c;g.setLineDash([5*d,4*d]);g.beginPath();g.arc(p[0],p[1],luzP.raio*cam.z,0,7);g.stroke();g.setLineDash([]);g.beginPath();g.arc(p[0],p[1],luzP.claro*cam.z,0,7);g.stroke();g.beginPath();g.arc(p[0],p[1],4*d,0,7);g.fillStyle=c;g.fill()}
    // fantasma da arte que vai ser colocada
    if(ferr==="obj"&&cursor&&!arr){const md=medida(pincel.arte),im=R.arte.quadros[md.i],T=R.arte.T,rc=md.rc,p=tela(enc(cursor[0],cursor[2]),enc(cursor[1],cursor[2])),w=md.w*cam.z,h=md.h*cam.z;if(im){g.save();g.translate(p[0],p[1]);g.rotate(pincel.acaso?0:pincel.giro/GR);g.globalAlpha=.6;g.drawImage(im,rc[0]*T,rc[1]*T,(rc[2]-rc[0])*T,(rc[3]-rc[1])*T,-w/2,-h/2,w,h);g.restore()}}};
  const rotulo=()=>{const A=fl(),m=quadros.length?quadros.reduce((a,b)=>a+b,0)/quadros.length:0;info.textContent=A.objetos.length.toLocaleString("pt-BR")+" objetos"+(m?" · "+m.toFixed(1)+" ms":"")};
  const laco=t=>{if(!root.isConnected){vivo=false;if(tSalvar)salvaJa();return}if(vivo)requestAnimationFrame(laco);ajusta();if(!sujo)return;sujo=false;if(pendente){pendente=false;R.refazAndar(andar)}const a=performance.now();R.desenhar(cam,andar,{luz,grade});if(opt.medir)R.terminar();sobre();const d=performance.now()-a;quadros.push(d);if(quadros.length>30)quadros.shift();if(t-ultimo>400){ultimo=t;rotulo()}};
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
  barra.append(grpAnd,el("span",{class:"bt-sep"}),bDesf,bRef,el("span",{class:"bt-sep"}),bSnap,selPasso,el("span",{class:"bt-sep"}),liga("grade","Mostrar a grade",()=>grade,v=>grade=v),(bLuz=liga("luz","Mostrar a luz e os pontos de luz",()=>luz,v=>{luz=v;if(ferr==="lz"||!sel.length)painel(true)})),bIco("enq","Enquadrar o mapa (F)",()=>enquadra()),el("span",{class:"bt-g"}),estado,info);
  // ---------- ferramentas ----------
  const FERR=[["sel","Selecionar","V","Clique para selecionar · arraste para mover · arraste no vazio para a caixa · Shift soma"],["mao","Mover a vista","H","Arraste para andar pelo mapa · a roda do mouse aproxima"],
    ["obj","Colocar objeto","O","Clique para colocar · arraste para carimbar uma fileira · R gira · Esc volta para Selecionar"],["esp","Espalhar","B","Arraste para espalhar as artes marcadas · Alt apaga · [ e ] mudam o pincel"],
    ["par","Parede","W","Clique ponto a ponto · clique no primeiro ponto fecha o cômodo · Enter termina · ou arraste uma forma"],["porta","Porta e janela","D","Passe sobre uma parede e clique · a peça fica presa à parede"],
    ["lz","Colocar luz","L","Clique para acender uma luz · escureça o ambiente para ver a penumbra"]];
  const bFerr={};for(const [k,n,t] of FERR){bFerr[k]=el("button",{type:"button",class:"tbtn",title:n+" ("+t+")","aria-label":n,onclick:()=>usa(k)},ico(k),el("span",{class:"tip"},n+" · "+t));ferrs.append(bFerr[k])}
  const usa=k=>{if(arr)fechaTraco(arr);if(traco&&k!=="par")fimTraco(false);pPrev=null;ferr=k;for(const f in bFerr)bFerr[f].setAttribute("aria-pressed",String(f===k));usaCursor();dica.textContent=FERR.find(f=>f[0]===k)[3];assin="";painel();sujo=true};
  // ---------- painel de propriedades ----------
  const campo=(rot,ctrl)=>el("label",{class:"bt-c"},el("span",{},rot),ctrl);
  const num=(rot,v,o,fn)=>{o=o||{};const i=el("input",{type:"number",value:arr2(v,o.casas),step:o.passo||.5,min:o.min,max:o.max,[o.fim?"onchange":"oninput"]:e=>{const x=parseFloat(e.target.value);if(isFinite(x))fn(Math.max(o.min==null?-1e9:o.min,Math.min(o.max==null?1e9:o.max,x)))}});return campo(rot,i)};
  const faixaC=(rot,v,min,max,passo,fn)=>{const tx=x=>typeof rot==="function"?rot(x):rot,c=campo(tx(v),el("input",{type:"range",min,max,step:passo,value:v,oninput:e=>{c.firstChild.textContent=tx(+e.target.value);fn(+e.target.value)}}));return c};
  const corC=(rot,c,fn)=>campo(rot,el("input",{type:"color",value:hexDe(c),oninput:e=>fn(corDe(e.target.value))}));
  const ck=(t,v,fn)=>el("label",{class:"bt-ck"},el("input",{type:"checkbox",checked:!!v,onchange:e=>fn(e.target.checked)}),t);
  const acao=(n,t,fn)=>el("button",{type:"button",class:"bt-a",title:t,onclick:fn},ico(n),el("span",{},t.replace(/ \(.*/,"")));
  const sec=(t,...k)=>el("section",{class:"bt-sec"},t?el("h3",{},t):null,...k);
  const chip=(n,cor,fn,on)=>el("button",{type:"button",class:"bt-chip","aria-pressed":on==null?null:String(on),onclick:fn},cor?el("i",{class:"bt-bola",style:"background:"+hexDe(cor)}):null,n);
  const MATS=Object.entries(MD.MATERIAIS_NOME);
  const acoes=()=>el("div",{class:"bt-acoes"},acao("dup","Duplicar (Ctrl+D)",duplicar),acao("gir","Girar 90° (R)",()=>girar(Math.PI/2)),acao("esp2","Espelhar (E)",espelhar),sel.some(s=>s.k==="objetos")?acao("frente","Trazer para a frente (])",()=>ordem(true)):null,sel.some(s=>s.k==="objetos")?acao("tras","Enviar para trás ([)",()=>ordem(false)):null,acao("lixo","Apagar (Delete)",apagar));
  const miniatura=(arte,tam)=>{const c=el("canvas",{width:tam,height:tam}),i=R.arte.indice["o:"+arte],im=R.arte.quadros[i],rc=R.arte.recorte[i]||[0,0,1,1],T=R.arte.T;if(im){const w=(rc[2]-rc[0])*T,h=(rc[3]-rc[1])*T,k=tam/Math.max(w,h);c.getContext("2d").drawImage(im,rc[0]*T,rc[1]*T,w,h,(tam-w*k)/2,(tam-h*k)/2,w*k,h*k)}return c};
  const amostra=(k,tam)=>{const c=el("canvas",{width:tam,height:tam}),im=R.arte.quadros[R.arte.indice["m:"+k]];if(im)c.getContext("2d").drawImage(im,0,0,tam,tam);return c};
  // seletor de textura com previa: mostra a escolhida e abre a grade com todas
  const escolheMat=(rot,k,fn)=>{const nome=el("b",{},MD.MATERIAIS_NOME[k]||k),am=el("span",{class:"bt-amw"},amostra(k,40)),grade=el("div",{class:"bt-mats",hidden:true}),
      bt=el("button",{type:"button",class:"bt-mat","aria-expanded":"false",title:"Escolher a textura",onclick:()=>{const ab=grade.hidden;grade.hidden=!ab;bt.setAttribute("aria-expanded",String(ab))}},am,el("span",{class:"bt-mt"},el("small",{},rot),nome),el("span",{class:"bt-car"},"▾"));
    for(const [m,n] of MATS)grade.append(el("button",{type:"button",class:"bt-mo",title:n,"aria-pressed":String(m===k),onclick:()=>{nome.textContent=n;am.replaceChildren(amostra(m,40));for(const b of grade.children)b.setAttribute("aria-pressed",String(b.title===n));grade.hidden=true;bt.setAttribute("aria-expanded","false");bt.focus();fn(m)}},amostra(m,56),el("span",{},n)));
    return el("div",{class:"bt-matw"},bt,grade)};
  // biblioteca: busca, categorias e grade de artes (marca = funcao que diz se a arte esta escolhida)
  const paleta=(marca,clica)=>{const caixa=el("div",{class:"bt-pal",role:"listbox"}),filtra=()=>{const q=MD.semAcento(busca);let n=0;for(const b of caixa.children){const k=b.dataset.k,ok=(!cat||MD.categoriaDe(k)===cat)&&(!q||MD.semAcento(MD.ARTES[k][0]).includes(q));b.hidden=!ok;if(ok)n++}vazia.hidden=n>0},
      vazia=el("p",{class:"bt-nota",hidden:true},"Nenhuma arte com esse nome."),marcaTudo=()=>{for(const b of caixa.children)b.setAttribute("aria-selected",String(marca(b.dataset.k)))};
    for(const k in MD.ARTES)caixa.append(el("button",{type:"button",class:"bt-arte",role:"option","data-k":k,title:MD.ARTES[k][0],onclick:()=>{clica(k);marcaTudo();sujo=true}},miniatura(k,52),el("span",{},MD.ARTES[k][0])));
    const chips=el("div",{class:"bt-chips"},[["","Todas"],...MD.CATEGORIAS].map(([c,n])=>chip(n,null,e=>{cat=c;for(const x of chips.children)x.setAttribute("aria-pressed",String(x===e.currentTarget));filtra()},c===cat)));
    marcaTudo();filtra();return [el("input",{type:"search",class:"bt-busca",placeholder:"Buscar arte…",value:busca,"aria-label":"Buscar arte",oninput:e=>{busca=e.target.value;filtra()}}),chips,caixa,vazia]};
  // luz: prontas, cor, forca, luz plena e penumbra. aplica(fn, nome, junta) muda a luz escolhida (ou o pincel de luz)
  const painelLuz=(l,aplica)=>{const claro=l.claro==null?l.raio*.45:l.claro;
    return [sec("Luzes prontas",el("div",{class:"bt-chips"},MD.LUZES.map(([k,n,r,cl,f,c])=>chip(n,c,()=>{aplica(e=>{e.raio=r;e.claro=cl;e.forca=f;e.c=[c[0],c[1],c[2],1]},"Luz: "+n.toLowerCase());painel(true)})))),
      sec("Cor e força",corC("Cor da luz",l.c,c=>aplica(e=>{e.c=[c[0],c[1],c[2],1]},"Cor da luz","c")),faixaC(v=>"Força · "+Math.round(v*100)+"%",l.forca,.05,3,.05,v=>aplica(e=>{e.forca=v},"Força da luz","forca"))),
      sec("Alcance",faixaC(v=>"Luz plena · "+arr2(v,1)+" quadrados",claro,0,30,.25,v=>aplica(e=>{e.claro=Math.min(v,e.raio)},"Luz plena","claro")),faixaC(v=>"Penumbra até · "+arr2(v,1)+" quadrados",l.raio,.5,40,.5,v=>aplica(e=>{e.raio=v;if(e.claro!=null&&e.claro>v)e.claro=v},"Alcance da luz","raio")),
        el("p",{class:"bt-nota"},"Dentro da luz plena fica tudo claro. Na penumbra a luz cai devagar até sumir."))]};
  // ambiente do andar: prontos, cor e claridade (a luz que existe sem nenhuma luz acesa)
  const painelAmb=()=>{const A=fl(),am=A.ambiente||[1,1,1,1],cla=Math.max(am[0],am[1],am[2]),base=cla>0?[am[0]/cla,am[1]/cla,am[2]/cla]:[1,1,1],poe=(c,nome,junta)=>exec([{op:"andar",a:andar,de:{ambiente:A.ambiente},para:{ambiente:[c[0],c[1],c[2],1]}}],nome,junta),
      k=()=>{const a=A.ambiente||[1,1,1];return Math.max(a[0],a[1],a[2])};
    return sec("Ambiente do andar",el("div",{class:"bt-chips"},MD.AMBIENTES.map(([kk,n,c])=>chip(n,c,()=>{poe(c,"Ambiente: "+n.toLowerCase());painel(true)}))),
      corC("Cor do ambiente",base,c=>{const v=k()||1;poe(c.map(x=>x*v),"Cor do ambiente","ambc")}),
      faixaC(v=>"Claridade · "+Math.round(v*100)+"%",cla,0,1,.01,v=>{const a=A.ambiente||[1,1,1,1],kk=Math.max(a[0],a[1],a[2]),b=kk>0?[a[0]/kk,a[1]/kk,a[2]/kk]:base;poe(b.map(x=>x*v),"Claridade do ambiente","ambk")}),
      el("p",{class:"bt-nota"},luz?"Escureça o ambiente para as luzes e a penumbra aparecerem.":"A luz está desligada na barra de cima."))};
  function painel(forca){const sig=ferr+"|"+andar+"|"+sel.map(s=>s.e.id).join(",");if(!forca&&sig===assin&&painelEl.contains(document.activeElement)&&document.activeElement!==painelEl.firstChild)return;assin=sig;const A=fl(),K=[],rolagem=forca?pCorpo.scrollTop:0;
    if(ferr==="obj"){pTit.textContent="Colocar objeto";const z=MD.ARTES[pincel.arte];
      K.push(sec("Biblioteca",...paleta(k=>k===pincel.arte,k=>{pincel.arte=k;pincel.camada=null;cam1.querySelector("input").value=MD.ARTES[k][3]})));
      const cam1=num("Camada",pincel.camada==null?z[3]:pincel.camada,{passo:100,casas:0},v=>{pincel.camada=v});
      K.push(sec("Como colocar",faixaC(v=>"Tamanho · "+Math.round(v*100)+"%",pincel.esc,.25,4,.05,v=>{pincel.esc=v;sujo=true}),num("Giro (graus)",pincel.giro,{passo:15,casas:0},v=>{pincel.giro=v;sujo=true}),ck("Giro ao acaso",pincel.acaso,v=>{pincel.acaso=v;sujo=true}),cam1,el("p",{class:"bt-nota"},"Camada maior fica por cima. Paredes ficam na 500.")))}
    else if(ferr==="esp"){pTit.textContent="Espalhar";
      K.push(sec("Artes do pincel",el("p",{class:"bt-nota"},"Marque uma ou várias. Cada objeto sorteia uma delas."),...paleta(k=>espalha.artes.has(k),k=>{if(espalha.artes.has(k)){if(espalha.artes.size>1)espalha.artes.delete(k)}else espalha.artes.add(k)})),
        sec("Pincel",faixaC(v=>"Tamanho do pincel · "+arr2(v,1)+" quadrados",espalha.raio,.5,15,.5,v=>{espalha.raio=v;sujo=true}),faixaC(v=>"Densidade · "+Math.round(v*100)+"%",espalha.dens,.05,1,.05,v=>{espalha.dens=v}),faixaC(v=>"Distância entre eles · "+Math.round(v*100)+"%",espalha.dist,.2,2,.05,v=>{espalha.dist=v})),
        sec("Sorteio",el("div",{class:"bt-2"},num("Tamanho mín. %",espalha.tamMin*100,{passo:5,min:10,max:400,casas:0},v=>{espalha.tamMin=Math.min(v/100,espalha.tamMax)}),num("Tamanho máx. %",espalha.tamMax*100,{passo:5,min:10,max:400,casas:0},v=>{espalha.tamMax=Math.max(v/100,espalha.tamMin)})),
          ck("Giro ao acaso",espalha.giro,v=>{espalha.giro=v}),ck("Espelhar ao acaso",espalha.espelho,v=>{espalha.espelho=v}),ck("Variar um pouco a cor",espalha.cor,v=>{espalha.cor=v})),
        sec("Borracha",ck("Apagar com o pincel (ou segure Alt)",espalha.apagar,v=>{espalha.apagar=v;sujo=true}),el("p",{class:"bt-nota"},"A borracha só tira as artes marcadas. O espalhar não encaixa na grade, para não ficar em fila.")))}
    else if(ferr==="par"){pTit.textContent="Parede";const MODOS=[["linha","Ponto a ponto"],["ret","Retângulo"],["tri","Triângulo"],["circ","Círculo"],["poli","Polígono"]];
      K.push(sec("Forma",el("div",{class:"bt-chips"},MODOS.map(([k,n])=>chip(n,null,()=>{if(traco)fimTraco(false);paredeP.modo=k;painel(true)},paredeP.modo===k))),paredeP.modo==="poli"?num("Lados",paredeP.lados,{passo:1,min:3,max:12,casas:0},v=>{paredeP.lados=Math.round(v)}):null,
          el("p",{class:"bt-nota"},paredeP.modo==="linha"?"Clique ponto a ponto. Clique no primeiro ponto para fechar o cômodo. Enter ou duplo clique termina a parede aberta; Backspace volta um ponto.":"Arraste no mapa "+(paredeP.modo==="circ"||paredeP.modo==="poli"?"do centro para fora.":"de um canto ao outro. Shift deixa os lados iguais."))),
        sec("Parede",escolheMat("Textura da parede",paredeP.tex,v=>{paredeP.tex=v}),faixaC(v=>"Espessura · "+arr2(v,2),paredeP.larg,.08,.6,.02,v=>{paredeP.larg=v;sujo=true}),faixaC(v=>"Arredondamento dos cantos · "+arr2(v,2),paredeP.raio,0,1,.05,v=>{paredeP.raio=v;sujo=true})),
        sec("Piso do cômodo",ck("Pôr piso quando a parede fechar",paredeP.piso,v=>{paredeP.piso=v;sujo=true}),escolheMat("Textura do piso",paredeP.pisoTex,v=>{paredeP.pisoTex=v})))}
    else if(ferr==="porta"){pTit.textContent="Porta e janela";
      K.push(sec("Tipo",el("div",{class:"bt-chips"},[["porta","Porta"],["dupla","Porta dupla"],["janela","Janela"]].map(([k,n])=>chip(n,null,()=>{portaP.tipo=k;if(k==="dupla"&&portaP.larg<2)portaP.larg=2;if(k!=="dupla"&&portaP.larg>=2)portaP.larg=1;painel(true)},portaP.tipo===k)))),
        sec("Tamanho",faixaC(v=>"Largura · "+arr2(v,2)+" quadrados",portaP.larg,.5,4,.25,v=>{portaP.larg=v;sujo=true}),el("p",{class:"bt-nota"},"Passe o mouse sobre uma parede: a prévia mostra onde a peça entra. Ela fica presa à parede e acompanha se a parede mudar.")))}
    else if(ferr==="lz"){pTit.textContent="Colocar luz";K.push(...painelLuz(luzP,fn=>{fn(luzP);sujo=true}),painelAmb())}
    else if(!sel.length){pTit.textContent="Mapa";
      K.push(sec("Tamanho",el("div",{class:"bt-2"},num("Largura",M.larg,{passo:1,min:4,max:200,casas:0,fim:true},v=>tamanho(Math.round(v),M.alt)),num("Altura",M.alt,{passo:1,min:4,max:200,casas:0,fim:true},v=>tamanho(M.larg,Math.round(v)))),el("p",{class:"bt-nota"},"Em quadrados. O canto de cima à esquerda fica no lugar.")));
      if(A.terreno){const T=A.terreno,usa4=T.tex.filter(t=>t>=0).length>1;K.push(sec(usa4?"Texturas do chão":"Chão",...T.tex.map((t,i)=>(t>=0||i===0||usa4)?escolheMat(usa4?"Textura "+(i+1):"Textura",t<0?"neutro":materialDe(M.texturas[t]),v=>{const tex=A.terreno.tex.slice();tex[i]=MD.texDe(M,"atlas:m/"+v);exec([{op:"andar",a:andar,de:{terreno:A.terreno},para:{terreno:Object.assign({},A.terreno,{tex})}}],"Trocar o chão")}):null),
        el("p",{class:"bt-nota"},"Camadas de textura com máscara e ajustes, como no Photoshop, chegam na 0.76.")))}
      K.push(painelAmb(),sec("Neste andar",el("p",{class:"bt-nota"},MD.TIPOS.map(k=>(A[k]||[]).length+" "+MD.NOME[k][(A[k]||[]).length===1?0:1]).join(" · "))))}
    else{const n=sel.length,um=n===1?sel[0]:null,cont={};for(const s of sel)cont[s.k]=(cont[s.k]||0)+1;pTit.textContent=um?MD.NOME[um.k][0].replace(/^./,c=>c.toUpperCase())+(um.k==="objetos"?" · "+(MD.ARTES[objetoDe(M.texturas[um.e.t])]||["Arte"])[0]:""):n+" itens";
      if(!um)K.push(sec(null,el("p",{class:"bt-nota"},Object.keys(cont).map(k=>cont[k]+" "+MD.NOME[k][cont[k]===1?0:1]).join(" · "))));K.push(sec(null,acoes()));
      const objs=sel.filter(s=>s.k==="objetos"),com=fn=>{const v=fn(objs[0].e);return objs.every(s=>fn(s.e)===v)?v:null};
      if(um&&um.k==="objetos"){const o=um.e;K.push(sec("Lugar e tamanho",el("div",{class:"bt-2"},num("X",o.x,{},v=>muda(sel,e=>{e.x=v},"Mover","x")),num("Y",o.y,{},v=>muda(sel,e=>{e.y=v},"Mover","y")),num("Largura",o.w,{min:.1,passo:.25},v=>muda(sel,e=>{e.w=v},"Tamanho","w")),num("Altura",o.h,{min:.1,passo:.25},v=>muda(sel,e=>{e.h=v},"Tamanho","h"))),
          num("Giro (graus)",((o.r*GR)%360+360)%360,{passo:15,casas:1},v=>muda(sel,e=>{e.r=v/GR},"Girar","r"))))}
      if(objs.length){const o0=objs[0].e,cam0=com(e=>e.l),op=com(e=>e.a==null?1:e.a);
        K.push(sec("Cor",faixaC(v=>"Matiz · "+Math.round(v)+"°",o0.mz||0,-180,180,1,v=>muda(objs,e=>{if(v)e.mz=v;else delete e.mz},"Matiz","mz")),faixaC(v=>"Saturação · "+Math.round(v*100)+"%",o0.sat==null?1:o0.sat,0,2,.01,v=>muda(objs,e=>{if(v===1)delete e.sat;else e.sat=v},"Saturação","sat")),
          faixaC(v=>"Brilho · "+Math.round(v*100)+"%",o0.bri==null?1:o0.bri,0,2,.01,v=>muda(objs,e=>{if(v===1)delete e.bri;else e.bri=v},"Brilho","bri")),corC("Tingir (multiplica a arte)",o0.cor||[1,1,1],c=>muda(objs,e=>{if(c[0]>.99&&c[1]>.99&&c[2]>.99)delete e.cor;else e.cor=c},"Tingir","cor")),
          faixaC(v=>"Opacidade · "+Math.round(v*100)+"%",op==null?1:op,.05,1,.05,v=>muda(objs,e=>{if(v>=1)delete e.a;else e.a=v},"Opacidade","a")),el("button",{type:"button",class:"bt-lk",onclick:()=>{muda(objs,e=>{delete e.mz;delete e.sat;delete e.bri;delete e.cor;delete e.a},"Restaurar a cor");painel(true)}},"Restaurar a cor original")),
          sec("Camada e sombra",num("Camada",cam0==null?o0.l:cam0,{passo:100,casas:0},v=>muda(objs,e=>{e.l=v},"Camada","l")),ck("Sombra",com(e=>!!e.s),v=>muda(objs,e=>{if(v)e.s=1;else delete e.s},v?"Pôr sombra":"Tirar sombra"))));
        const gr=el("div",{class:"bt-troca",hidden:true},...paleta(k=>objs.every(s=>objetoDe(M.texturas[s.e.t])===k),k=>{muda(objs,e=>{e.t=MD.texDe(M,"atlas:o/"+k);const md=medida(k,1),S=Math.max(e.w,e.h),p=md.w/md.h;e.w=arr2(p>=1?S:S*p,3);e.h=arr2(p>=1?S/p:S,3)},"Trocar a arte");painel(true)}));
        K.push(sec("Arte",el("button",{type:"button",class:"bt-a",onclick:e=>{gr.hidden=!gr.hidden;e.currentTarget.lastChild.textContent=gr.hidden?"Trocar a arte…":"Fechar a biblioteca"}},ico("obj"),el("span",{},"Trocar a arte…")),gr))}
      const lzs=sel.filter(s=>s.k==="luzes");if(lzs.length&&lzs.length===n){if(um)K.push(sec("Lugar",el("div",{class:"bt-2"},num("X",um.e.x,{},v=>muda(sel,e=>{e.x=v},"Mover","x")),num("Y",um.e.y,{},v=>muda(sel,e=>{e.y=v},"Mover","y")))));K.push(...painelLuz(lzs[0].e,(fn,nome,junta)=>muda(lzs,fn,nome,junta)))}
      const pts=sel.filter(s=>s.k==="portais");if(pts.length&&pts.length===n){const q0=pts[0].e,tp=q0.tipo||(/window|sill|glass/.test((M.texturas[q0.t]||"").toLowerCase())?"janela":"porta");
        K.push(sec("Tipo",el("div",{class:"bt-chips"},[["porta","Porta"],["dupla","Porta dupla"],["janela","Janela"]].map(([k,nm])=>chip(nm,null,()=>{muda(pts,x=>{x.tipo=k;x.t=MD.texDe(M,"atlas:p/"+k)},"Tipo da peça");painel(true)},tp===k)))),
          sec("Peça",faixaC(v=>"Largura · "+arr2(v*2,2)+" quadrados",q0.raio,.25,2,.125,v=>muda(pts,x=>{x.raio=v},"Largura","raio")),tp!=="janela"?ck("Aberta",q0.fechado===false,v=>muda(pts,x=>{x.fechado=!v},v?"Abrir":"Fechar")):null,el("p",{class:"bt-nota"},"Arraste a peça para ela deslizar pela parede.")))}
      const vet=sel.filter(s=>s.k==="paredes"||s.k==="caminhos"||s.k==="padroes");
      if(vet.length&&vet.length===n){const p0=vet[0],mat=materialDe(M.texturas[p0.e.t]||"");K.push(sec(vet.length===1?"Textura":"Textura de todos",escolheMat("Textura",mat,v=>muda(vet,e=>{e.t=MD.texDe(M,"atlas:m/"+v)},"Trocar a textura"))));
        const pars=vet.filter(s=>s.k==="paredes");if(pars.length===n){const r=pars[0].e.raio==null?RAIO_PADRAO:pars[0].e.raio;K.push(sec("Cantos",faixaC(v=>"Arredondamento · "+arr2(v,2),r,0,1,.05,v=>muda(pars,e=>{e.raio=v},"Arredondar cantos","raio")),el("p",{class:"bt-nota"},"Toda parede nasce com o canto arredondado. Zero deixa o canto vivo."),
            faixaC(v=>"Espessura · "+arr2(v,2),pars[0].e.larg||.18,.08,.6,.02,v=>muda(pars,e=>{e.larg=v},"Espessura","larg")),ck("Parede fechada",pars[0].e.laco,v=>muda(pars,w=>{w.laco=v},"Fechar parede")),el("p",{class:"bt-nota"},"Arraste os pontos para mudar a parede. Arraste a bolinha do meio de um trecho para criar um ponto novo.")));
          if(pars.length===1){const w=pars[0].e,f=w.laco?pisoDe(w):null,F=f?[{k:"padroes",e:f}]:null;if(w.laco)K.push(sec("Piso do cômodo",ck("Piso dentro da parede",!!f,v=>{ligaPiso(w,v);painel(true)}),f?escolheMat("Textura do piso",materialDe(M.texturas[f.t]||""),v=>muda(F,x=>{x.t=MD.texDe(M,"atlas:m/"+v)},"Textura do piso")):null,
              f?faixaC(v=>"Tamanho da textura · "+Math.round(v*100)+"%",f.esc||1,.25,4,.05,v=>muda(F,x=>{x.esc=v},"Tamanho da textura","esc")):null,f?faixaC(v=>"Giro da textura · "+Math.round(v)+"°",(f.gt||0)*GR,0,360,5,v=>muda(F,x=>{x.gt=v/GR},"Giro da textura","gt")):null));
            if(vsel&&vsel.e===w){const r0=w.raios&&w.raios[vsel.i]!=null?w.raios[vsel.i]:(w.raio==null?RAIO_PADRAO:w.raio),iv=vsel.i;K.push(sec("Ponto "+(iv+1),faixaC(v=>"Arredondar este canto · "+arr2(v,2),r0,0,4,.05,v=>muda(pars,x=>{const r=(x.raios||x.p.map(()=>null)).slice();r[iv]=v;x.raios=r},"Arredondar canto","rc"+iv)),el("p",{class:"bt-nota"},"Um raio grande vira uma curva."),el("button",{type:"button",class:"bt-lk",onclick:apagaPonto},"Apagar este ponto")))}}}
        const cams=vet.filter(s=>s.k==="caminhos");if(cams.length===n)K.push(sec("Caminho",faixaC(v=>"Largura · "+arr2(v,1),cams[0].e.larg||.5,.1,6,.1,v=>muda(cams,e=>{e.larg=v},"Largura","larg")),num("Camada",cams[0].e.l||0,{passo:100,casas:0},v=>muda(cams,e=>{e.l=v},"Camada","l"))));
        const pads=vet.filter(s=>s.k==="padroes");if(pads.length===n)K.push(sec("Forma",num("Camada",pads[0].e.l||0,{passo:100,casas:0},v=>muda(pads,e=>{e.l=v},"Camada","l"))))}}
    pCorpo.replaceChildren(...K);if(forca)pCorpo.scrollTop=rolagem}
  const tamanho=(larg,alt)=>{if(larg===M.larg&&alt===M.alt)return;const ops=[{op:"mapa",de:{larg:M.larg,alt:M.alt},para:{larg,alt}}];M.andares.forEach((A,i)=>{if(A.terreno)ops.push({op:"andar",a:i,de:{terreno:A.terreno},para:{terreno:MD.terrenoRedim(A.terreno,larg,alt)}})});exec(ops,"Tamanho do mapa");enquadra();painel(true)};
  // ---------- mouse, toque e teclado ----------
  const P=new Map();let pin=0;const local=e=>{const r=cv.getBoundingClientRect();return [(e.clientX-r.left)*dpr(),(e.clientY-r.top)*dpr()]};
  const zoomEm=(px,py,f)=>{const w=mundo(px,py);cam.z=Math.max(2,Math.min(400,cam.z*f));cam.x=w[0]-(px-cv.width/2)/cam.z;cam.y=w[1]-(py-cv.height/2)/cam.z;sujo=true};
  cv.addEventListener("contextmenu",e=>e.preventDefault());
  cv.addEventListener("pointerdown",e=>{root.focus({preventScroll:true});try{cv.setPointerCapture(e.pointerId)}catch(_){}const p=local(e);P.set(e.pointerId,p);if(P.size===2){cancela();arr={tipo:"pinca"};pin=0;return}
    const w=mundo(p[0],p[1]),toque=e.pointerType==="touch",vazio=x=>toque?Object.assign({tipo:"pan",p},x):Object.assign({tipo:"caixa",p,w0:w,w1:w,soma:e.shiftKey,moveu:false},x);
    if(e.button===1||e.button===2||ferr==="mao"||espaco){arr={tipo:"pan",p};cv.style.cursor="grabbing";return}
    if(ferr==="obj"){arr={tipo:"carimbo",ops:[],alt:e.altKey};carimba(arr,enc(w[0],e.altKey),enc(w[1],e.altKey));return}
    if(ferr==="esp"){inicioEsp(w,espalha.apagar!==e.altKey);return}
    if(ferr==="lz"){acende(enc(w[0],e.altKey),enc(w[1],e.altKey));return}
    if(ferr==="par"){const q=[enc(w[0],e.altKey),enc(w[1],e.altKey)];if(paredeP.modo==="linha"){if(!traco)traco={P:[q]};else{const T=traco.P,f=T[0],u=T[T.length-1];if(T.length>=3&&Math.hypot(q[0]-f[0],q[1]-f[1])<Math.max(.2,9*dpr()/cam.z))fimTraco(true);else if(Math.hypot(q[0]-u[0],q[1]-u[1])<1e-6)fimTraco(false);else T.push(q)}sujo=true;return}
      arr={tipo:"forma",a:q,b:q,p,moveu:false};return}
    if(ferr==="porta"){const pp=portaEm(w[0],w[1],e.altKey);if(pp)poePorta(pp);return}
    const hd=alcaEm(p[0],p[1]);if(hd&&(hd.t==="vert"||hd.t==="meio")){const i=hd.t==="meio"?hd.i+1:hd.i;comeca("vert",w,{p,i,ins:hd.t==="meio"});if(arr.ins){const o=arr.itens[0].e,P=o.p.slice(),a=P[hd.i],b=P[(hd.i+1)%P.length];P.splice(i,0,[(a[0]+b[0])/2,(a[1]+b[1])/2]);o.p=P;if(o.raios){const r=o.raios.slice();r.splice(i,0,null);o.raios=r}redesenha(arr.itens)}vsel={e:arr.itens[0].e,i};sujo=true;return}
    if(hd){const B=caixaSel();comeca(hd.t,w,{hd,B,p});return}
    const hits=acertos(w[0],w[1]),topo=hits[0];if(!topo){arr=vazio({limpa:!e.shiftKey});return}
    if(e.shiftKey){if(tem(topo.e))seleciona(sel.filter(s=>s.e!==topo.e));else seleciona(sel.concat([{k:topo.k,e:topo.e}]));return}
    const ja=hits.find(h=>tem(h.e)),pq=ja&&ja.k==="portais"?ja:!ja&&topo.k==="portais"?topo:null;
    if(pq&&pq.e.d!=null){const wl=(fl().paredes||[]).find(x=>x.id===pq.e.parede);if(wl){if(!tem(pq.e))seleciona([{k:"portais",e:pq.e}]);arr={tipo:"desliza",itens:[{k:"portais",e:pq.e}],antes:[MD.foto(pq.e)],w0:w,p,moveu:false,wl};return}}
    if(ja){comeca("mover",w,{p,pega:ja,hits});return}
    if(MD.FUNDO[topo.k]){arr=vazio({escolhe:topo});return}
    seleciona([{k:topo.k,e:topo.e}]);comeca("mover",w,{p,pega:topo})});
  cv.addEventListener("pointermove",e=>{const p=local(e),w=mundo(p[0],p[1]);cursor=[w[0],w[1],e.altKey];
    if(!P.has(e.pointerId)){if(ferr==="porta"){pPrev=portaEm(w[0],w[1],e.altKey);sujo=true}if(ferr==="obj"||ferr==="esp"||ferr==="lz"||ferr==="par")sujo=true;else if(ferr==="sel"&&!espaco){const h=alcaEm(p[0],p[1]),hs=h?[]:acertos(w[0],w[1]),t=hs[0]||null,ja=hs.some(x=>tem(x.e));cv.style.cursor=h?(h.t==="girar"?"grab":"nwse-resize"):ja?"move":t?"pointer":"default";const nv=t&&!ja?t:null;if((nv&&nv.e)!==(passa&&passa.e)){passa=nv;sujo=true}}return}
    const ant=P.get(e.pointerId);P.set(e.pointerId,p);if(!arr)return;
    if(arr.tipo==="pinca"){if(P.size===2){const [a,b]=[...P.values()],d=Math.hypot(a[0]-b[0],a[1]-b[1]);cam.x-=(p[0]-ant[0])/cam.z/2;cam.y-=(p[1]-ant[1])/cam.z/2;if(pin)zoomEm((a[0]+b[0])/2,(a[1]+b[1])/2,d/pin);pin=d;sujo=true}return}
    if(arr.p&&!arr.moveu&&Math.hypot(p[0]-arr.p[0],p[1]-arr.p[1])<4*dpr())return;arr.moveu=true;
    if(arr.tipo==="esp"){passoEsp(w);return}
    if(arr.tipo==="forma"){let b=[enc(w[0],e.altKey),enc(w[1],e.altKey)];if(e.shiftKey&&paredeP.modo!=="circ"&&paredeP.modo!=="poli"){const s=Math.max(Math.abs(b[0]-arr.a[0]),Math.abs(b[1]-arr.a[1]));b=[arr.a[0]+Math.sign(b[0]-arr.a[0]||1)*s,arr.a[1]+Math.sign(b[1]-arr.a[1]||1)*s]}arr.b=b;sujo=true;return}
    if(arr.tipo==="vert"){const o=arr.itens[0].e,P2=o.p.slice();P2[arr.i]=[enc(w[0],e.altKey),enc(w[1],e.altKey)];o.p=P2;redesenha(arr.itens);return}
    if(arr.tipo==="desliza"){const q=arr.itens[0].e,wl=arr.wl,T2=MD.trajeto(wl),m=projeta(T2,wl.laco,w[0],w[1]),Lw=comprimento(T2,wl.laco);let d=enc(m.d,e.altKey);if(!wl.laco)d=Math.max(q.raio,Math.min(Lw-q.raio,d));q.d=+d.toFixed(4);redesenha(arr.itens);return}
    if(arr.tipo==="carimbo"){const x=enc(w[0],arr.alt),y=enc(w[1],arr.alt);if(Math.hypot(x-arr.ult[0],y-arr.ult[1])>=arr.passo-1e-6)carimba(arr,x,y);return}
    if(arr.tipo==="pan"){cam.x-=(p[0]-ant[0])/cam.z;cam.y-=(p[1]-ant[1])/cam.z;sujo=true}
    else if(arr.tipo==="caixa"){arr.w1=w;sujo=true}
    else if(arr.tipo==="mover"){const i=arr.itens.findIndex(s=>s.e===arr.pega.e),a0=MD.ancora(arr.pega.k,arr.antes[i]),dx=enc(a0[0]+w[0]-arr.w0[0],e.altKey)-a0[0],dy=enc(a0[1]+w[1]-arr.w0[1],e.altKey)-a0[1];aoVivo({f:(x,y)=>[x+dx,y+dy]})}
    else if(arr.tipo==="girar"){const B=arr.B;let q=Math.atan2(w[1]-B.cy,w[0]-B.cx)-Math.atan2(arr.w0[1]-B.cy,arr.w0[0]-B.cx);if(snap.on!==e.altKey){const st=Math.PI/12,base=B.um?B.r:0;q=Math.round((base+q)/st)*st-base}const c=Math.cos(q),s=Math.sin(q);aoVivo({f:(x,y)=>[B.cx+(x-B.cx)*c-(y-B.cy)*s,B.cy+(x-B.cx)*s+(y-B.cy)*c],rot:q})}
    else if(arr.tipo==="redim"){const B=arr.B,hd=arr.hd,c=Math.cos(B.r),s=Math.sin(B.r),fx=B.cx+(-hd.sx*B.w/2)*c-(-hd.sy*B.h/2)*s,fy=B.cy+(-hd.sx*B.w/2)*s+(-hd.sy*B.h/2)*c,wx=enc(w[0],e.altKey)-fx,wy=enc(w[1],e.altKey)-fy,lx=wx*c+wy*s,ly=-wx*s+wy*c;
      if(B.um){const o=arr.itens[0].e,a=arr.antes[0];let nw=a.w,nh=a.h;if(hd.sx&&hd.sy){if(e.shiftKey){nw=Math.max(.1,lx*hd.sx);nh=Math.max(.1,ly*hd.sy)}else{const k=Math.max(.05,(lx*hd.sx*a.w+ly*hd.sy*a.h)/(a.w*a.w+a.h*a.h));nw=a.w*k;nh=a.h*k}}else if(hd.sx)nw=Math.max(.1,lx*hd.sx);else nh=Math.max(.1,ly*hd.sy);
        MD.poe(o,a);o.w=nw;o.h=nh;const mx=hd.sx*(nw-a.w)/2,my=hd.sy*(nh-a.h)/2;o.x=a.x+mx*c-my*s;o.y=a.y+mx*s+my*c;redesenha(arr.itens)}
      else{const k=Math.max(.05,(lx*hd.sx*B.w+ly*hd.sy*B.h)/(B.w*B.w+B.h*B.h));aoVivo({f:(x,y)=>[fx+(x-fx)*k,fy+(y-fy)*k],s:k})}}});
  const solta=e=>{if(!P.has(e.pointerId))return;P.delete(e.pointerId);pin=0;const a=arr;if(!a)return;if(a.tipo==="pinca"){if(P.size<2)arr=null;return}arr=null;usaCursor();
    if(a.ops){fechaTraco(a);sujo=true;return}
    if(a.tipo==="forma"){if(a.moveu){const P2=formaPontos(paredeP.modo,a.a,a.b,paredeP.lados);let ar=0;for(let i=0;i<P2.length;i++){const u=P2[i],v2=P2[(i+1)%P2.length];ar+=u[0]*v2[1]-v2[0]*u[1]}if(P2.length>=3&&Math.abs(ar)/2>.2)criaParede(P2,true)}sujo=true;return}
    if(a.tipo==="vert"){if(a.moveu){arr=a;fecha(a.ins?"Novo ponto":"Mover ponto");arr=null}else if(a.ins){a.itens.forEach((s,i)=>MD.poe(s.e,a.antes[i]));redesenha(a.itens);vsel=null}painel(true);sujo=true;return}
    if(a.tipo==="desliza"){if(a.moveu){arr=a;fecha("Mover porta");arr=null}sujo=true;return}
    if(a.tipo==="pan"){if(!a.moveu){if(a.escolhe)seleciona([{k:a.escolhe.k,e:a.escolhe.e}]);else if(a.limpa)seleciona([])}}
    else if(a.tipo==="caixa"){if(!a.moveu){if(a.escolhe)seleciona([{k:a.escolhe.k,e:a.escolhe.e}]);else if(a.limpa)seleciona([])}
      else{const x0=Math.min(a.w0[0],a.w1[0]),x1=Math.max(a.w0[0],a.w1[0]),y0=Math.min(a.w0[1],a.w1[1]),y1=Math.max(a.w0[1],a.w1[1]),A=fl(),L=a.soma?sel.slice():[];
        for(const k of MD.TIPOS)for(const it of A[k]||[]){if(tem(it)&&a.soma)continue;if(k==="padroes"&&it.parede!=null)continue;let ok;if(k==="objetos"||k==="luzes")ok=it.x>=x0&&it.x<=x1&&it.y>=y0&&it.y<=y1;else{const c=MD.caixa(k,it);ok=c[0]>=x0&&c[2]<=x1&&c[1]>=y0&&c[3]<=y1}if(ok)L.push({k,e:it})}seleciona(L)}}
    else if(a.tipo==="mover"){if(a.moveu){arr=a;fecha("Mover");arr=null}else if(a.hits&&a.hits.length>1&&sel.length===1){const i=a.hits.findIndex(h=>h.e===sel[0].e),prox=a.hits[(i+1)%a.hits.length];seleciona([{k:prox.k,e:prox.e}])}}
    else if(a.tipo==="girar"||a.tipo==="redim"){if(a.moveu){arr=a;fecha(a.tipo==="girar"?"Girar":"Mudar o tamanho");arr=null}}
    sujo=true};
  function usaCursor(){cv.style.cursor=ferr==="mao"||espaco?"grab":ferr==="obj"||ferr==="lz"||ferr==="par"||ferr==="porta"?"crosshair":ferr==="esp"?"none":"default"}
  cv.addEventListener("pointerup",solta);cv.addEventListener("pointercancel",solta);cv.addEventListener("pointerleave",()=>{if(!P.size){cursor=null;passa=null;sujo=true}});
  cv.addEventListener("wheel",e=>{e.preventDefault();const p=local(e);zoomEm(p[0],p[1],Math.exp(-e.deltaY*.0015))},{passive:false});
  // o teclado e ouvido no documento: o painel se refaz e o foco pode cair no corpo da pagina
  const meu=t=>root.isConnected&&(t===document.body||t===document.documentElement||root.contains(t));
  const teclaSolta=e=>{if(!meu(e.target))return;if(e.key===" "){espaco=false;usaCursor()}};
  const tecla=e=>{if(!root.isConnected){document.removeEventListener("keydown",tecla);document.removeEventListener("keyup",teclaSolta);return}if(!meu(e.target))return;const t=e.target;if(t&&(t.tagName==="INPUT"||t.tagName==="SELECT"||t.tagName==="TEXTAREA")){if(e.key==="Escape")root.focus();return}
    const k=e.key.toLowerCase(),ctrl=e.ctrlKey||e.metaKey,passo=snap.on?snap.passo:.1;let ok=true;
    if(k===" "){espaco=true;usaCursor()}else if(ctrl&&k==="z"){if(e.shiftKey)H.refazer();else H.desfazer()}else if(ctrl&&k==="y")H.refazer();else if(ctrl&&k==="d")duplicar();else if(ctrl&&k==="c")copiar();else if(ctrl&&k==="x"){copiar();apagar()}else if(ctrl&&k==="v")colar();else if(ctrl&&k==="a")tudo();
    else if(ctrl)ok=false;
    else if(traco&&(k==="enter"||k==="escape"||k==="backspace")){if(k==="backspace"){traco.P.pop();if(!traco.P.length)traco=null}else if(traco.P.length>=2)fimTraco(false);else traco=null;sujo=true}
    else if(vsel&&(k==="delete"||k==="backspace"))apagaPonto();
    else if(k==="w")usa("par");else if(k==="d")usa("porta");
    else if(k==="escape"){if(arr)cancela();else if(sel.length)seleciona([]);else if(ferr!=="sel")usa("sel")}else if(k==="delete"||k==="backspace")apagar();
    else if(k==="v")usa("sel");else if(k==="h")usa("mao");else if(k==="o")usa("obj");else if(k==="b")usa("esp");else if(k==="l")usa("lz");
    else if(ferr==="esp"&&(k==="["||k==="]")){espalha.raio=Math.max(.5,Math.min(15,espalha.raio+(k==="]"?.5:-.5)));sujo=true;const r=pCorpo.querySelector("input[type=range]");painel(true)}else if(k==="g")bSnap.click();else if(k==="f")enquadra();
    else if(k==="r"){if(ferr==="obj"){pincel.giro=(pincel.giro+(e.shiftKey?-15:15)+360)%360;painel(true);sujo=true}else girar(e.shiftKey?-Math.PI/2:Math.PI/2)}else if(k==="e")espelhar();else if(k==="]")ordem(true);else if(k==="[")ordem(false);
    else if(k==="arrowleft")empurra(-passo,0);else if(k==="arrowright")empurra(passo,0);else if(k==="arrowup")empurra(0,-passo);else if(k==="arrowdown")empurra(0,passo);else ok=false;
    if(ok)e.preventDefault()};
  document.addEventListener("keydown",tecla);document.addEventListener("keyup",teclaSolta);root.addEventListener("blur",()=>{espaco=false});
  andares();botoes();usa("sel");enquadra();estado.textContent=opt.salvar?"Salvo":"";requestAnimationFrame(laco);root.focus({preventScroll:true});
  const abertura=performance.now()-t0;
  return {cam,render:R,hist:H,abertura,carga,mapa:M,fechar:()=>{vivo=false;document.removeEventListener("keydown",tecla);document.removeEventListener("keyup",teclaSolta);if(tSalvar)salvaJa()},irPara,usa,selecao:()=>sel,seleciona,tudo,apagar,duplicar,girar,espelhar,ordem,copiar,colar,estado:()=>({andar,luz,grade,ferr,snap:Object.assign({},snap),sel:sel.length}),
    set:o=>{if(o.luz!=null)luz=o.luz;if(o.grade!=null)grade=o.grade;if(o.cam)Object.assign(cam,o.cam);if(o.snap!=null)snap.on=o.snap;if(o.passo)snap.passo=o.passo;if(o.arte)pincel.arte=o.arte;sujo=true},
    // ponto do mapa -> ponto da janela (para testes e ajudas)
    naTela:(x,y)=>{const r=cv.getBoundingClientRect(),p=tela(x,y);return [r.left+p[0]/dpr(),r.top+p[1]/dpr()]},salvarAgora:salvaJa,
    agora:()=>{ajusta();const a=performance.now();R.desenhar(cam,andar,{luz,grade});R.terminar();sobre();return performance.now()-a}}}
