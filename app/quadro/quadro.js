// Atlas - Quadro (canvas): cartoes de nota, texto, adesivo, imagem, mapa, grupo e link, ligados por linhas.
// Formato: JSON Canvas 1.0 (o do Obsidian). O que o Obsidian nao conhece vai em "atlas" dentro do no ou da linha.
const CORES={"1":"#E0776B","2":"#E39A4F","3":"#D4A64A","4":"#8DB06A","5":"#7FA9CC","6":"#A88BD6"},NOME_COR={"1":"Carmim","2":"Âmbar","3":"Ouro","4":"Musgo","5":"Céu","6":"Ametista"};
const corDe=c=>!c?null:CORES[c]||c;
const el=(t,a,...k)=>{const e=document.createElement(t);for(const n in a||{}){const v=a[n];if(v==null||v===false)continue;if(n==="class")e.className=v;else if(n==="style")e.style.cssText=v;else if(n.startsWith("on"))e.addEventListener(n.slice(2),v);else e.setAttribute(n,v===true?"":v)}for(const x of k.flat())if(x!=null&&x!==false)e.append(x);return e};
const ic=(n,t)=>window.icone?window.icone(n,t||18):el("span");
const uid=()=>Math.random().toString(16).slice(2,10)+Math.random().toString(16).slice(2,10);
// ---------- imagens: guardadas no navegador (IndexedDB), reduzidas para no maximo 2048 px ----------
let pdb=null;const db=()=>pdb||(pdb=new Promise((ok,er)=>{const r=indexedDB.open("atlas-arquivos",1);r.onupgradeneeded=()=>r.result.createObjectStore("img");r.onsuccess=()=>ok(r.result);r.onerror=()=>er(r.error)}));
// com o mundo numa pasta, a imagem vai tambem para Imagens/<id>.webp (e e lida de la se nao estiver no navegador)
const naPasta=()=>window.AtlasPasta&&window.AtlasApp&&window.AtlasApp.Store&&window.AtlasApp.Store.pasta;
const guardaImg=async(k,blob)=>{if(naPasta())window.AtlasPasta.gravaArquivo("Imagens/"+k+".webp",blob).catch(e=>console.warn("imagem na pasta",e));const d=await db();return new Promise((ok,er)=>{const t=d.transaction("img","readwrite");t.objectStore("img").put(blob,k);t.oncomplete=()=>ok(k);t.onerror=()=>er(t.error)})};
const leImg=async k=>{const d=await db();const b=await new Promise(ok=>{const t=d.transaction("img","readonly"),q=t.objectStore("img").get(k);q.onsuccess=()=>ok(q.result||null);q.onerror=()=>ok(null)});if(b||!naPasta())return b;const f=await window.AtlasPasta.leArquivo("Imagens/"+k+".webp");return f?new Blob([f],{type:"image/webp"}):null};
const urls=new Map();const urlImg=async k=>{if(urls.has(k))return urls.get(k);const b=await leImg(k);const u=b?URL.createObjectURL(b):null;urls.set(k,u);return u};
const abreImg=async arq=>{try{return await createImageBitmap(arq)}catch(e){const im=new Image(),u=URL.createObjectURL(arq);im.src=u;try{await im.decode();return im}finally{setTimeout(()=>URL.revokeObjectURL(u),0)}}};
export async function reduzImagem(arq,max){max=max||2048;const bmp=await abreImg(arq),k=Math.min(1,max/Math.max(bmp.width,bmp.height)),c=document.createElement("canvas");c.width=Math.round(bmp.width*k);c.height=Math.round(bmp.height*k);c.getContext("2d").drawImage(bmp,0,0,c.width,c.height);
  const blob=await new Promise(ok=>c.toBlob(ok,"image/webp",.86));return {blob,w:c.width,h:c.height}}
export {leImg};

// ---------- geometria das linhas ----------
const LADOS={top:[0,-1],bottom:[0,1],left:[-1,0],right:[1,0]};
const ponto=(n,lado)=>lado==="top"?[n.x+n.width/2,n.y]:lado==="bottom"?[n.x+n.width/2,n.y+n.height]:lado==="left"?[n.x,n.y+n.height/2]:[n.x+n.width,n.y+n.height/2];
function melhoresLados(a,b){const ca=[a.x+a.width/2,a.y+a.height/2],cb=[b.x+b.width/2,b.y+b.height/2],dx=cb[0]-ca[0],dy=cb[1]-ca[1];return Math.abs(dx)*a.height>Math.abs(dy)*a.width?(dx>0?["right","left"]:["left","right"]):(dy>0?["bottom","top"]:["top","bottom"])}
function caminhoLinha(A,B,e){let fs=e.fromSide,ts=e.toSide;if(!fs||!ts){const m=melhoresLados(A,B);fs=fs||m[0];ts=ts||m[1]}const p=ponto(A,fs),q=ponto(B,ts),reta=e.atlas&&e.atlas.curva===false;
  if(reta)return {d:"M"+p+"L"+q,p,q,meio:[(p[0]+q[0])/2,(p[1]+q[1])/2],t:[q[0]-p[0],q[1]-p[1]],t0:[p[0]-q[0],p[1]-q[1]]};
  const L=Math.max(40,Math.min(220,Math.hypot(q[0]-p[0],q[1]-p[1])*.45)),a=LADOS[fs],b=LADOS[ts],c1=[p[0]+a[0]*L,p[1]+a[1]*L],c2=[q[0]+b[0]*L,q[1]+b[1]*L];
  const bz=t=>{const u=1-t;return [u*u*u*p[0]+3*u*u*t*c1[0]+3*u*t*t*c2[0]+t*t*t*q[0],u*u*u*p[1]+3*u*u*t*c1[1]+3*u*t*t*c2[1]+t*t*t*q[1]]};
  return {d:"M"+p+"C"+c1+" "+c2+" "+q,p,q,meio:bz(.5),t:[q[0]-c2[0],q[1]-c2[1]],t0:[p[0]-c1[0],p[1]-c1[1]]}}
const seta=(q,t,cor)=>{const l=Math.hypot(t[0],t[1])||1,ux=t[0]/l,uy=t[1]/l,s=12,w=6;return el("path",{d:"M"+q+"L"+[q[0]-ux*s-uy*w,q[1]-uy*s+ux*w]+"L"+[q[0]-ux*s+uy*w,q[1]-uy*s-ux*w]+"Z",fill:cor})};
const SVG="http://www.w3.org/2000/svg";const sv=(t,a)=>{const e=document.createElementNS(SVG,t);for(const k in a||{})if(a[k]!=null)e.setAttribute(k,a[k]);return e};

// ---------- o quadro ----------
// ctx: {nota, dados, salvar(dados), resumoNota(titulo), notas(), abrirNota(titulo), mapas(), abrirMapa(id), ligarNotas(de,para,rotulo), aviso(txt)}
export function abrirQuadro(raiz,ctx){const D=ctx.dados&&ctx.dados.nodes?ctx.dados:{nodes:[],edges:[]};if(!D.edges)D.edges=[];
  raiz.replaceChildren();const vista=el("div",{class:"qd",tabindex:"0"}),mundo=el("div",{class:"qd-mundo"}),camL=sv("svg",{class:"qd-linhas",width:"1",height:"1"}),camT=el("div",{class:"qd-temp"});mundo.append(camL);vista.append(mundo);
  const barra=el("div",{class:"qd-barra",role:"toolbar","aria-label":"Ferramentas do quadro"}),painel=el("div",{class:"qd-painel",hidden:true}),zoomB=el("div",{class:"qd-zoom"}),dica=el("div",{class:"qd-dica"},"Duplo clique no vazio cria um cartão · arraste a bolinha da borda para ligar · Shift + arrastar seleciona"),mini=el("canvas",{class:"qd-mini",width:"180",height:"120"});
  const focoChip=el("button",{type:"button",class:"qd-focochip",hidden:true,onclick:()=>{foco=null;tudo()}},ic("olho",16),"Modo foco · sair");
  const legF=matchMedia("(max-width:860px)").matches||raiz.getBoundingClientRect().width<760,leg=ctx.legenda?el("div",{class:"qd-leg"+(legF?" fechada":"")},el("button",{type:"button",class:"qd-legb","aria-expanded":String(!legF),onclick:e=>{const f=leg.classList.toggle("fechada");e.currentTarget.setAttribute("aria-expanded",String(!f))}},"Legenda"),el("div",{class:"qd-legl"},ctx.legenda.map(x=>el("span",{},el("i",{class:"qd-lgl",style:"border-top:"+(x.grossa?3.5:2.4)+"px "+(x.estilo==="tracejada"?"dashed":x.estilo==="pontilhada"?"dotted":"solid")+" "+(CORES[x.cor]||x.cor)}),x.txt)))):null;
  raiz.append(vista,barra,painel,zoomB,dica,mini,focoChip);if(leg)raiz.append(leg);
  let cam={x:0,y:0,z:1},sel=new Set(),selL=null,arr=null,editando=null,tSalvar=0,foco=null,vizFoco=null;const vis=n=>!(ctx.oculto&&ctx.oculto(n));const pilha=[],refaz=[];
  const nos=new Map(),elNo=new Map();
  // ---- desfazer: foto do quadro inteiro antes de cada mudanca ----
  const foto=()=>JSON.stringify({nodes:D.nodes,edges:D.edges});
  const marca=()=>{pilha.push(foto());if(pilha.length>120)pilha.shift();refaz.length=0};
  const volta=(de,para)=>{if(!de.length)return;para.push(foto());const s=JSON.parse(de.pop());D.nodes=s.nodes;D.edges=s.edges;sel.clear();selL=null;tudo();salva()};
  const salva=()=>{clearTimeout(tSalvar);tSalvar=setTimeout(()=>ctx.salvar(D),400)};
  // ---- camera ----
  const aplicaCam=()=>{mundo.style.transform="translate("+cam.x+"px,"+cam.y+"px) scale("+cam.z+")";zoomTxt.textContent=Math.round(cam.z*100)+"%";desenhaMini()};
  const doMundo=(cx,cy)=>{const r=vista.getBoundingClientRect();return [(cx-r.left-cam.x)/cam.z,(cy-r.top-cam.y)/cam.z]};
  const zoomEm=(cx,cy,f)=>{const r=vista.getBoundingClientRect(),px=cx-r.left,py=cy-r.top,wx=(px-cam.x)/cam.z,wy=(py-cam.y)/cam.z;cam.z=Math.max(.1,Math.min(3,cam.z*f));cam.x=px-wx*cam.z;cam.y=py-wy*cam.z;aplicaCam()};
  const enquadra=()=>{const r=vista.getBoundingClientRect();if(!D.nodes.length){cam={x:r.width/2,y:r.height/2,z:1};aplicaCam();return}let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9;for(const n of D.nodes){x0=Math.min(x0,n.x);y0=Math.min(y0,n.y);x1=Math.max(x1,n.x+n.width);y1=Math.max(y1,n.y+n.height)}
    const z=Math.max(.1,Math.min(1.2,Math.min((r.width-120)/(x1-x0||1),(r.height-160)/(y1-y0||1))));cam={z,x:r.width/2-(x0+x1)/2*z,y:r.height/2-(y0+y1)/2*z};aplicaCam()};
  // ---- conteudo dos cartoes ----
  const tipoNo=n=>n.atlas&&n.atlas.kind?n.atlas.kind:n.type==="file"?(/\.(png|jpe?g|webp|gif)$/i.test(n.file||"")?"imagem":"nota"):n.type;
  const tituloArq=f=>(f||"").split("/").pop().replace(/\.md$/i,"");
  function corpoNo(n){const k=tipoNo(n),c=corDe(n.color);
    if(k==="text"||k==="adesivo"){const txt=el("div",{class:"qd-txt"});txt.textContent=n.text||"";if(!n.text)txt.append(el("span",{class:"qd-vazio"},k==="adesivo"?"Ideia…":"Duplo clique para escrever"));return [txt]}
    if(k==="nota"){const t=tituloArq(n.file),R=ctx.resumoNota(t);if(!R)return [el("div",{class:"qd-nh"},ic("livre",18),el("b",{},t)),el("div",{class:"qd-txt qd-miss"},"Nota não encontrada. Duplo clique cria.")];
      return [el("div",{class:"qd-nh"},el("i",{class:"qd-nic",style:"color:"+R.cor},ic(R.ic,18)),el("b",{},R.titulo),el("button",{type:"button",class:"qd-abre",title:"Abrir a nota","aria-label":"Abrir a nota",onclick:e=>{e.stopPropagation();ctx.abrirNota(R.titulo)}},ic("seta",16))),
        R.chips&&R.chips.length?el("div",{class:"qd-chips"},R.chips.map(x=>el("span",{class:"qd-chip",style:x.cor?"color:"+x.cor:null},x.txt))):null,
        R.objetivos&&R.objetivos.length&&ctx.marcarObjetivo?el("div",{class:"qd-objs"},R.objetivos.slice(0,6).map(o=>el("label",{class:"qd-obj"+(o.feito?" feito":""),onpointerdown:e=>e.stopPropagation()},el("input",{type:"checkbox",checked:o.feito?true:null,onchange:()=>{ctx.marcarObjetivo(R.titulo,o.i);tudo()}}),el("span",{},o.txt))),R.objetivos.length>6?el("small",{class:"qd-mais"},"+"+(R.objetivos.length-6)+" objetivos"):null):el("div",{class:"qd-txt qd-prev"},R.trecho||"")]}
    if(k==="imagem"){const im=el("img",{alt:n.atlas&&n.atlas.nome||"Imagem",draggable:"false"});const key=n.atlas&&n.atlas.img;if(key)urlImg(key).then(u=>{if(u)im.src=u;else im.replaceWith(el("div",{class:"qd-txt qd-miss"},"Imagem guardada em outro navegador."))});return [im]}
    if(k==="mapa"){const m=(ctx.mapas()||[]).find(x=>x.id===(n.atlas&&n.atlas.mapa));return [el("div",{class:"qd-nh"},el("i",{class:"qd-nic",style:"color:#8DB06A"},ic(m&&m.ic||"mapas",18)),el("b",{},m?m.nome:"Mapa apagado"),m?el("button",{type:"button",class:"qd-abre",title:"Abrir o mapa","aria-label":"Abrir o mapa",onclick:e=>{e.stopPropagation();ctx.abrirMapa(m.id)}},ic("seta",16)):null),el("div",{class:"qd-txt qd-prev"},m?m.det:"")]}
    if(k==="link")return [el("div",{class:"qd-nh"},ic("link",18),el("b",{},n.atlas&&n.atlas.titulo||n.url)),el("a",{class:"qd-url",href:n.url,target:"_blank",rel:"noopener"},n.url)];
    if(k==="group")return [el("div",{class:"qd-gt",style:c?"color:"+c:null},n.label||"Grupo")];return []}
  function montaNo(n){let d=elNo.get(n.id);const k=tipoNo(n),c=corDe(n.color);if(!d){d=el("div",{class:"qd-no","data-id":n.id});elNo.set(n.id,d);mundo.append(d)}
    d.className="qd-no qd-"+k+(sel.has(n.id)?" on":"")+(vizFoco&&!vizFoco.has(n.id)?" qd-apaga":"")+(n.atlas&&n.atlas.segredo?" qd-seg":"");d.style.cssText="left:"+n.x+"px;top:"+n.y+"px;width:"+n.width+"px;height:"+n.height+"px"+(c?";--cor:"+c:"")+(k==="group"?";z-index:0":"");
    d.replaceChildren(...corpoNo(n).filter(Boolean),el("span",{class:"qd-redim",title:"Mudar o tamanho"}),...["top","right","bottom","left"].map(l=>el("span",{class:"qd-pt qd-pt-"+l,"data-lado":l,title:"Arraste para ligar"})));return d}
  function desenhaLinhas(){camL.replaceChildren();for(const e of D.edges){const A=nos.get(e.fromNode),B=nos.get(e.toNode);if(!A||!B||!vis(A)||!vis(B))continue;const c=corDe(e.color)||"#B3A486",g=caminhoLinha(A,B,e),est=e.atlas&&e.atlas.estilo,on=selL===e.id;
      const grp=sv("g",{"data-l":e.id,class:"qd-l"+(on?" on":"")+(vizFoco&&!(vizFoco.has(e.fromNode)&&vizFoco.has(e.toNode))?" qd-apaga":"")});const gr=e.atlas&&e.atlas.grossa?1.4:1;grp.append(sv("path",{d:g.d,class:"qd-lhit"}),sv("path",{d:g.d,stroke:c,"stroke-width":(on?3.5:2.4)*gr,fill:"none","stroke-dasharray":est==="tracejada"?"10 7":est==="pontilhada"?"2 6":null,"stroke-linecap":"round"}));
      if(e.toEnd!=="none")grp.append(seta(g.q,g.t,c));if(e.fromEnd==="arrow")grp.append(seta(g.p,g.t0,c));
      if(e.label){const t=sv("text",{x:g.meio[0],y:g.meio[1]+4,"text-anchor":"middle",class:"qd-lr"});t.textContent=e.label;const w=e.label.length*7.4+16;grp.append(sv("rect",{x:g.meio[0]-w/2,y:g.meio[1]-12,width:w,height:24,rx:12,class:"qd-lbg",stroke:c}),t)}
      camL.append(grp)}}
  function tudo(){nos.clear();for(const n of D.nodes)nos.set(n.id,n);for(const [id,d] of elNo)if(!nos.has(id)||!vis(nos.get(id))){d.remove();elNo.delete(id)}if(foco&&!nos.has(foco))foco=null;vizFoco=foco?new Set([foco,...D.edges.filter(e=>e.fromNode===foco||e.toNode===foco).flatMap(e=>[e.fromNode,e.toNode])]):null;focoChip.hidden=!foco;dica.hidden=!!foco||D.nodes.length>3;
    // grupos primeiro (ficam atras)
    const ord=D.nodes.filter(vis).sort((a,b)=>(a.type==="group"?0:1)-(b.type==="group"?0:1));for(const n of ord)mundo.append(montaNo(n));mundo.insertBefore(camL,mundo.firstChild);const gs=ord.filter(n=>n.type==="group");for(const g of gs.reverse())mundo.insertBefore(elNo.get(g.id),mundo.firstChild);
    desenhaLinhas();mostraPainel();desenhaMini()}
  // ---- criar ----
  const centro=()=>{const r=vista.getBoundingClientRect();return doMundo(r.left+r.width/2,r.top+r.height/2)};
  const bate=(n,m)=>n.x<m.x+m.width+20&&m.x<n.x+n.width+20&&n.y<m.y+m.height+20&&m.y<n.y+n.height+20;
  function vaga(n){const x0=n.x,y0=n.y;for(let i=0;i<60;i++){if(!D.nodes.some(m=>m.type!=="group"&&bate(n,m)))return;const a=i*.9,r=40+i*28;n.x=Math.round(x0+Math.cos(a)*r);n.y=Math.round(y0+Math.sin(a)*r)}n.x=x0;n.y=y0}
  function cria(n,ligarDe,livre){marca();n.id=n.id||uid();if(livre&&n.type!=="group")vaga(n);D.nodes.push(n);if(ligarDe)D.edges.push({id:uid(),fromNode:ligarDe.id,toNode:n.id,color:ligarDe.color});sel=new Set([n.id]);selL=null;tudo();salva();return n}
  const criaTexto=(x,y,adesivo,ligarDe,livre)=>{const n=cria({type:"text",text:"",x:Math.round(x-130),y:Math.round(y-60),width:260,height:adesivo?160:120,color:adesivo?"3":undefined,atlas:adesivo?{kind:"adesivo"}:undefined},ligarDe,livre);setTimeout(()=>edita(n),0);return n};
  const criaNota=(titulo,x,y)=>{const c=x==null?centro():[x,y];return cria({type:"file",file:titulo+".md",x:Math.round(c[0]-150),y:Math.round(c[1]-90),width:300,height:190},null,x==null)};
  const criaMapa=(m)=>{const c=centro();return cria({type:"file",file:"Mapas/"+m.nome+".atlasmap",x:Math.round(c[0]-150),y:Math.round(c[1]-60),width:300,height:120,atlas:{kind:"mapa",mapa:m.id}},null,true)};
  const criaGrupo=()=>{const c=centro();let x=c[0]-250,y=c[1]-180,w=500,h=360;const S=[...sel].map(i=>nos.get(i)).filter(n=>n&&n.type!=="group");if(S.length){x=Math.min(...S.map(n=>n.x))-30;y=Math.min(...S.map(n=>n.y))-60;w=Math.max(...S.map(n=>n.x+n.width))-x+30;h=Math.max(...S.map(n=>n.y+n.height))-y+30}return cria({type:"group",label:"Grupo",x:Math.round(x),y:Math.round(y),width:Math.round(w),height:Math.round(h),color:"5"})};
  const criaLink=()=>{const u=prompt("Endereço (https://…)");if(!u)return;const c=centro();cria({type:"link",url:/^https?:\/\//.test(u)?u:"https://"+u,x:Math.round(c[0]-150),y:Math.round(c[1]-50),width:300,height:100},null,true)};
  async function criaImagem(arq,x,y){try{const r=await reduzImagem(arq,2048),key="img-"+uid();await guardaImg(key,r.blob);const c=x==null?centro():[x,y],k=Math.min(1,420/Math.max(r.w,r.h));cria({type:"file",file:"imagens/"+key+".webp",x:Math.round(c[0]-r.w*k/2),y:Math.round(c[1]-r.h*k/2),width:Math.round(r.w*k),height:Math.round(r.h*k),atlas:{kind:"imagem",img:key,nome:arq.name||"Imagem"}},null,x==null)}catch(e){console.error(e);ctx.aviso("Não foi possível ler essa imagem.")}}
  const inpImg=el("input",{type:"file",accept:"image/*",hidden:true,onchange:e=>{for(const f of e.target.files)criaImagem(f);e.target.value=""}});raiz.append(inpImg);
  // ---- editar texto no lugar ----
  function edita(n){const d=elNo.get(n.id);if(!d)return;const k=tipoNo(n);if(k!=="text"&&k!=="adesivo"&&k!=="group")return;editando=n.id;const campo=k==="group"?"label":"text",ta=el(k==="group"?"input":"textarea",{class:"qd-ed","aria-label":k==="group"?"Nome do grupo":"Texto do cartão"});ta.value=n[campo]||"";
    const alvo=d.querySelector(k==="group"?".qd-gt":".qd-txt");alvo.replaceWith(ta);ta.focus();const fim=()=>{if(editando!==n.id)return;editando=null;if((n[campo]||"")!==ta.value){marca();n[campo]=ta.value;salva()}montaNo(n);desenhaLinhas()};
    ta.addEventListener("blur",fim);ta.addEventListener("keydown",e=>{e.stopPropagation();if(e.key==="Escape"||(e.key==="Enter"&&(e.ctrlKey||k==="group"))){e.preventDefault();ta.blur()}});ta.addEventListener("pointerdown",e=>e.stopPropagation())}
  // ---- painel da selecao ----
  function mostraPainel(){const L=selL?D.edges.find(e=>e.id===selL):null,S=[...sel].map(i=>nos.get(i)).filter(Boolean);if(!L&&!S.length){painel.hidden=true;return}painel.hidden=false;
    const atual=L?L.color:S[0].color,cores=el("div",{class:"qd-cores"},el("button",{type:"button",class:"qd-cor qd-sem"+(!atual?" on":""),title:"Sem cor","aria-label":"Sem cor",onclick:()=>muda(o=>{delete o.color})}),Object.keys(CORES).map(k=>el("button",{type:"button",class:"qd-cor"+(atual===k?" on":""),title:NOME_COR[k],"aria-label":NOME_COR[k],style:"background:"+CORES[k],onclick:()=>muda(o=>{o.color=k})})));
    const muda=fn=>{marca();if(L)fn(L);else for(const n of S)fn(n);tudo();salva()};
    const K=[el("div",{class:"qd-pt-t"},L?"Linha":S.length>1?S.length+" cartões":({text:"Texto",adesivo:"Adesivo",nota:"Nota",imagem:"Imagem",mapa:"Mapa",link:"Link",group:"Grupo"})[tipoNo(S[0])]||"Cartão"),cores];
    if(L){const at=L.atlas||{},A=nos.get(L.fromNode),B=nos.get(L.toNode),opt=(rot,v,lista,fn)=>el("div",{class:"qd-seg"},lista.map(([k,n])=>el("button",{type:"button",class:v===k?"on":"",onclick:()=>muda(o=>fn(o,k))},n)));
      K.push(el("label",{class:"qd-lab"},"Rótulo",el("input",{type:"text",value:L.label||"",placeholder:"ex.: traiu, deve dinheiro a",onchange:e=>muda(o=>{if(e.target.value.trim())o.label=e.target.value.trim();else delete o.label})})),
        opt("Traço",at.estilo||"cheia",[["cheia","Cheia"],["tracejada","Tracejada"],["pontilhada","Pontilhada"]],(o,k)=>{o.atlas=Object.assign({},o.atlas);if(k==="cheia")delete o.atlas.estilo;else o.atlas.estilo=k}),
        opt("Forma",at.curva===false?"reta":"curva",[["curva","Curva"],["reta","Reta"]],(o,k)=>{o.atlas=Object.assign({},o.atlas);if(k==="curva")delete o.atlas.curva;else o.atlas.curva=false}),
        opt("Pontas",L.fromEnd==="arrow"?"duas":L.toEnd==="none"?"nenhuma":"seta",[["seta","Seta"],["duas","Dupla"],["nenhuma","Nenhuma"]],(o,k)=>{o.toEnd=k==="nenhuma"?"none":undefined;o.fromEnd=k==="duas"?"arrow":undefined;if(!o.toEnd)delete o.toEnd;if(!o.fromEnd)delete o.fromEnd}));
      if(A&&B&&tipoNo(A)==="nota"&&tipoNo(B)==="nota")K.push(el("button",{type:"button",class:"qd-acao",onclick:()=>{ctx.ligarNotas(tituloArq(A.file),tituloArq(B.file),L.label);ctx.aviso("Ligação escrita na nota "+tituloArq(A.file)+".")}},ic("link",16),"Ligar as notas"));
      if(A&&B&&tipoNo(A)==="nota"&&tipoNo(B)==="nota"&&ctx.tiposLigacao)K.push(el("button",{type:"button",class:"qd-acao",onclick:e=>{const r=e.currentTarget.getBoundingClientRect();perguntaTipo(L,r.left,r.top-10)}},ic("link",16),at.auto?"Mudar o tipo da ligação":"Escolher o tipo da ligação"));
      K.push(el("button",{type:"button",class:"qd-acao qd-perigo",onclick:apaga},ic("apagar",16),"Apagar a linha"));
      if(at.auto&&A&&B&&ctx.desligarTipo)K.push(el("button",{type:"button",class:"qd-acao qd-perigo",title:"Apaga a linha e tira a ligação das propriedades da nota",onclick:()=>{ctx.desligarTipo(tituloArq(A.file),tituloArq(B.file),at.auto);apaga()}},ic("apagar",16),"Apagar e tirar da nota"))}
    else{if(S.length===1&&tipoNo(S[0])==="nota"){const t=tituloArq(S[0].file);K.push(el("button",{type:"button",class:"qd-acao",onclick:()=>ctx.abrirNota(t)},ic("notas",16),"Abrir a nota"))}
      if(S.length===1)K.push(el("button",{type:"button",class:"qd-acao"+(foco===S[0].id?" on":""),title:"Apaga o que não está ligado a este cartão",onclick:()=>{foco=foco===S[0].id?null:S[0].id;tudo()}},ic("olho",16),foco===S[0].id?"Sair do foco":"Modo foco"));
      if(S.every(n=>tipoNo(n)!=="nota"))K.push(el("label",{class:"qd-chk"},el("input",{type:"checkbox",checked:S.every(n=>n.atlas&&n.atlas.segredo)?true:null,onchange:e=>muda(o=>{o.atlas=Object.assign({},o.atlas);if(e.target.checked)o.atlas.segredo=true;else delete o.atlas.segredo;if(!Object.keys(o.atlas).length)delete o.atlas})}),"Só para o mestre (some na visão dos jogadores)"));
      K.push(el("div",{class:"qd-acoes"},el("button",{type:"button",class:"qd-acao",title:"Ctrl+D",onclick:duplica},ic("item",16),"Duplicar"),S.length>1?el("button",{type:"button",class:"qd-acao",onclick:criaGrupo},ic("grupo",16),"Agrupar"):null,el("button",{type:"button",class:"qd-acao qd-perigo",onclick:apaga},ic("apagar",16),"Apagar")))}
    painel.replaceChildren(...K)}
  // ---- acoes ----
  function apaga(){if(!sel.size&&!selL)return;marca();if(selL)D.edges=D.edges.filter(e=>e.id!==selL);const ids=new Set(sel);D.nodes=D.nodes.filter(n=>!ids.has(n.id));D.edges=D.edges.filter(e=>!ids.has(e.fromNode)&&!ids.has(e.toNode));sel.clear();selL=null;tudo();salva()}
  function duplica(){if(!sel.size)return;marca();const mapa=new Map(),novos=[];for(const id of sel){const n=nos.get(id);if(!n)continue;const c=JSON.parse(JSON.stringify(n));c.id=uid();c.x+=40;c.y+=40;mapa.set(id,c.id);novos.push(c)}D.nodes.push(...novos);for(const e of D.edges.slice())if(mapa.has(e.fromNode)&&mapa.has(e.toNode))D.edges.push(Object.assign({},e,{id:uid(),fromNode:mapa.get(e.fromNode),toNode:mapa.get(e.toNode)}));sel=new Set(novos.map(n=>n.id));tudo();salva()}
  const dentroDe=(g,n)=>n.x>=g.x&&n.y>=g.y&&n.x+n.width<=g.x+g.width&&n.y+n.height<=g.y+g.height;
  // ---- ponteiro ----
  const P=new Map();let pin=0;
  vista.addEventListener("pointerdown",e=>{if(e.target.closest(".qd-ed"))return;vista.focus({preventScroll:true});const w=doMundo(e.clientX,e.clientY);P.set(e.pointerId,[e.clientX,e.clientY]);try{vista.setPointerCapture(e.pointerId)}catch(_){}
    if(P.size===2){arr={t:"pinca"};pin=0;return}
    const pt=e.target.closest(".qd-pt"),rd=e.target.closest(".qd-redim"),nd=e.target.closest(".qd-no"),ln=e.target.closest(".qd-l");
    if(e.button===1||(e.button===0&&e.altKey)){arr={t:"pan",x:e.clientX,y:e.clientY};return}
    if(pt&&nd){const n=nos.get(nd.dataset.id);arr={t:"liga",de:n,lado:pt.dataset.lado,w};return}
    if(rd&&nd){const n=nos.get(nd.dataset.id);marca();arr={t:"redim",n,w0:w,w:n.width,h:n.height};return}
    if(nd){const id=nd.dataset.id;if(e.shiftKey){if(sel.has(id))sel.delete(id);else sel.add(id)}else if(!sel.has(id)){sel=new Set([id])}selL=null;
      const mov=new Set(sel);for(const i of sel){const g=nos.get(i);if(g&&g.type==="group")for(const n of D.nodes)if(n.type!=="group"&&dentroDe(g,n))mov.add(n.id)}
      arr={t:"mover",w0:w,ini:[...mov].map(i=>{const n=nos.get(i);return [n,n.x,n.y]}),moveu:false};tudo();return}
    if(ln){selL=ln.dataset.l;sel.clear();tudo();arr=null;return}
    if(e.shiftKey){arr={t:"caixa",w0:w,w1:w};return}
    arr={t:"pan",x:e.clientX,y:e.clientY,limpa:true,moveu:false}});
  vista.addEventListener("pointermove",e=>{if(!P.has(e.pointerId))return;const ant=P.get(e.pointerId);P.set(e.pointerId,[e.clientX,e.clientY]);if(!arr)return;const w=doMundo(e.clientX,e.clientY);
    if(arr.t==="pinca"){if(P.size===2){const [a,b]=[...P.values()],d=Math.hypot(a[0]-b[0],a[1]-b[1]);if(pin)zoomEm((a[0]+b[0])/2,(a[1]+b[1])/2,d/pin);pin=d;cam.x+=(e.clientX-ant[0])/2;cam.y+=(e.clientY-ant[1])/2;aplicaCam()}return}
    if(arr.t==="pan"){cam.x+=e.clientX-ant[0];cam.y+=e.clientY-ant[1];if(Math.hypot(e.clientX-arr.x,e.clientY-arr.y)>4)arr.moveu=true;aplicaCam();return}
    if(arr.t==="mover"){const dx=w[0]-arr.w0[0],dy=w[1]-arr.w0[1];if(!arr.moveu){if(Math.hypot(dx,dy)*cam.z<3)return;arr.moveu=true;marca()}for(const [n,x,y] of arr.ini){n.x=Math.round(x+dx);n.y=Math.round(y+dy);const d=elNo.get(n.id);if(d){d.style.left=n.x+"px";d.style.top=n.y+"px"}}desenhaLinhas();return}
    if(arr.t==="redim"){const n=arr.n;n.width=Math.max(80,Math.round(arr.w+w[0]-arr.w0[0]));n.height=Math.max(50,Math.round(arr.h+w[1]-arr.w0[1]));const d=elNo.get(n.id);d.style.width=n.width+"px";d.style.height=n.height+"px";desenhaLinhas();return}
    if(arr.t==="liga"){const p=ponto(arr.de,arr.lado);camT.remove();const t=sv("path",{d:"M"+p+"L"+w,stroke:corDe(arr.de.color)||"#D4A64A","stroke-width":2.4,"stroke-dasharray":"6 5",fill:"none",class:"qd-tmp"});const old=camL.querySelector(".qd-tmp");if(old)old.remove();camL.append(t);arr.w=w;return}
    if(arr.t==="caixa"){arr.w1=w;let b=vista.querySelector(".qd-caixa");if(!b){b=el("div",{class:"qd-caixa"});mundo.append(b)}const x0=Math.min(arr.w0[0],w[0]),y0=Math.min(arr.w0[1],w[1]);b.style.cssText="left:"+x0+"px;top:"+y0+"px;width:"+Math.abs(w[0]-arr.w0[0])+"px;height:"+Math.abs(w[1]-arr.w0[1])+"px"}});
  const solta=e=>{if(!P.has(e.pointerId))return;P.delete(e.pointerId);pin=0;const a=arr;if(!a)return;if(a.t==="pinca"){if(P.size<2)arr=null;return}arr=null;
    if(a.t==="pan"){if(a.limpa&&!a.moveu&&(sel.size||selL)){sel.clear();selL=null;tudo()}return}
    if(a.t==="mover"){if(a.moveu){if(ctx.mudaArco)for(const [n] of a.ini){if(tipoNo(n)!=="nota")continue;const cx=n.x+n.width/2,cy=n.y+n.height/2,g=D.nodes.find(G=>G.type==="group"&&G.label&&cx>G.x&&cx<G.x+G.width&&cy>G.y&&cy<G.y+G.height);if(g)ctx.mudaArco(tituloArq(n.file),g.label)}salva();desenhaMini()}return}
    if(a.t==="redim"){tudo();salva();return}
    if(a.t==="caixa"){const b=vista.querySelector(".qd-caixa");if(b)b.remove();const x0=Math.min(a.w0[0],a.w1[0]),x1=Math.max(a.w0[0],a.w1[0]),y0=Math.min(a.w0[1],a.w1[1]),y1=Math.max(a.w0[1],a.w1[1]);sel=new Set(D.nodes.filter(n=>n.x>=x0&&n.y>=y0&&n.x+n.width<=x1&&n.y+n.height<=y1).map(n=>n.id));selL=null;tudo();return}
    if(a.t==="liga"){const t=camL.querySelector(".qd-tmp");if(t)t.remove();const w=a.w;if(!w)return;const alvo=document.elementsFromPoint(e.clientX,e.clientY).map(x=>x.closest&&x.closest(".qd-no")).find(x=>x&&x.dataset.id!==a.de.id);
      if(alvo){const B=nos.get(alvo.dataset.id);marca();const ts=melhoresLados(a.de,B)[1];const ed={id:uid(),fromNode:a.de.id,fromSide:a.lado,toNode:B.id,toSide:ts,color:a.de.color};D.edges.push(ed);selL=null;tudo();salva();perguntaTipo(ed,e.clientX,e.clientY)}
      else if(Math.hypot(w[0]-ponto(a.de,a.lado)[0],w[1]-ponto(a.de,a.lado)[1])>30)criaTexto(w[0],w[1],false,a.de)}};
  vista.addEventListener("pointerup",solta);vista.addEventListener("pointercancel",solta);
  vista.addEventListener("dblclick",e=>{const nd=e.target.closest(".qd-no");const w=doMundo(e.clientX,e.clientY);if(!nd){if(ctx.tiposNota)menuNovo(e,w);else criaTexto(w[0],w[1],false);return}const n=nos.get(nd.dataset.id),k=tipoNo(n);if(k==="nota"){const t=tituloArq(n.file);if(ctx.resumoNota(t))ctx.abrirNota(t);else ctx.criarNota(t)}else if(k==="mapa"&&n.atlas)ctx.abrirMapa(n.atlas.mapa);else edita(n)});
  vista.addEventListener("wheel",e=>{e.preventDefault();if(e.ctrlKey||!e.shiftKey&&Math.abs(e.deltaY)>0&&!e.deltaX)zoomEm(e.clientX,e.clientY,Math.exp(-e.deltaY*.0015));else{cam.x-=e.deltaX;cam.y-=e.deltaY;aplicaCam()}},{passive:false});
  // arrastar uma nota da lista para o quadro; colar imagem
  vista.addEventListener("dragover",e=>{if([...e.dataTransfer.types].some(t=>t==="text/x-atlas-nota"||t==="Files")){e.preventDefault();e.dataTransfer.dropEffect="copy"}});
  vista.addEventListener("drop",e=>{e.preventDefault();const w=doMundo(e.clientX,e.clientY),t=e.dataTransfer.getData("text/x-atlas-nota");if(t){criaNota(t,w[0],w[1]);return}for(const f of e.dataTransfer.files||[])if(/^image\//.test(f.type))criaImagem(f,w[0],w[1])});
  vista.addEventListener("paste",e=>{for(const it of e.clipboardData.items||[])if(it.kind==="file"&&/^image\//.test(it.type)){e.preventDefault();criaImagem(it.getAsFile())}});
  const tecla=e=>{if(!raiz.isConnected){document.removeEventListener("keydown",tecla);return}const t=e.target;if(editando||e.defaultPrevented)return;if(t!==document.body&&!raiz.contains(t))return;if(t.matches&&t.matches("input,textarea,select,[contenteditable]"))return;if(document.getElementById("qd-menu")||document.getElementById("paleta"))return;const k=e.key.toLowerCase(),ctrl=e.ctrlKey||e.metaKey;
    if(ctrl&&k==="z"){e.preventDefault();if(e.shiftKey)volta(refaz,pilha);else volta(pilha,refaz)}else if(ctrl&&k==="y"){e.preventDefault();volta(refaz,pilha)}else if(ctrl&&k==="d"){e.preventDefault();duplica()}else if(ctrl&&k==="a"){e.preventDefault();sel=new Set(D.nodes.map(n=>n.id));tudo()}
    else if(k==="delete"||k==="backspace"){e.preventDefault();apaga()}else if(k==="escape"){if(foco&&!sel.size)foco=null;sel.clear();selL=null;tudo()}else if(k==="f"&&!ctrl){enquadra()}else if(k==="enter"&&sel.size===1){e.preventDefault();edita(nos.get([...sel][0]))}};document.addEventListener("keydown",tecla);
  // ---- barra, zoom e minimapa ----
  const bot=(icn,txt,fn)=>el("button",{type:"button",class:"qd-b",title:txt,"aria-label":txt,onclick:fn},ic(icn,20),el("span",{},txt.split(" (")[0]));
  barra.append(bot("texto","Texto (duplo clique)",()=>{const c=centro();criaTexto(c[0],c[1],false,null,true)}),bot("adesivo","Adesivo",()=>{const c=centro();criaTexto(c[0],c[1],true,null,true)}),
    bot("notas","Nota",e=>menuNotas(e.currentTarget)),bot("imagem","Imagem",()=>inpImg.click()),bot("mapas","Mapa",e=>menuMapas(e.currentTarget)),bot("grupo","Grupo",criaGrupo),bot("link","Link",criaLink));
  function menuSimples(btn,itens,busca){const old=document.getElementById("qd-menu");if(old){old.remove();return}const r=btn.getBoundingClientRect(),m=el("div",{id:"qd-menu",class:"menu"}),lista=el("div",{class:"qd-mlist"}),q=busca?el("input",{type:"search",placeholder:"Buscar…","aria-label":"Buscar"}):null;
    const monta=()=>{const t=(q&&q.value||"").toLowerCase();lista.replaceChildren(...itens.filter(i=>!t||i.txt.toLowerCase().includes(t)).slice(0,60).map(i=>el("button",{type:"button",class:"mitem",onclick:()=>{m.remove();i.fn()}},el("i",{class:"tic",style:i.cor?"color:"+i.cor:null},ic(i.ic,18)),el("span",{class:"mt"},i.txt,i.det?el("small",{},i.det):null))));if(!lista.children.length)lista.append(el("p",{class:"empty"},"Nada por aqui."))};
    if(q)q.addEventListener("input",monta);m.append(...(q?[q]:[]),lista);monta();document.body.append(m);m.style.left=Math.max(8,Math.min(innerWidth-m.offsetWidth-8,r.left))+"px";m.style.top=Math.max(8,r.top-m.offsetHeight-8)+"px";(q||m.querySelector("button")).focus();
    const fecha=ev=>{if(ev.type==="keydown"&&ev.key!=="Escape")return;if(ev.type==="pointerdown"&&(m.contains(ev.target)||btn.contains(ev.target)))return;m.remove();document.removeEventListener("pointerdown",fecha,true);document.removeEventListener("keydown",fecha,true)};setTimeout(()=>{document.addEventListener("pointerdown",fecha,true);document.addEventListener("keydown",fecha,true)},0)}
  // menu aberto num ponto da tela (clique duplo no vazio, fim de uma linha)
  const menuEm=(cx,cy,itens,busca)=>{const a=el("div",{style:"position:fixed;left:"+cx+"px;top:"+(cy+14)+"px;width:1px;height:1px;pointer-events:none"});document.body.append(a);menuSimples(a,itens,busca);setTimeout(()=>a.remove(),30000)};
  // pede o nome de uma nota nova bem onde ela vai nascer
  const pedeNome=(cx,cy,dica,fn)=>{const b=el("div",{class:"qd-nome",style:"left:"+Math.max(8,Math.min(innerWidth-300,cx-140))+"px;top:"+Math.max(8,cy-20)+"px"}),i=el("input",{type:"text",placeholder:dica,"aria-label":dica});b.append(i);document.body.append(b);i.focus();
    let ok=false;const fim=v=>{if(ok)return;ok=true;b.remove();if(v&&v.trim())fn(v.trim())};i.addEventListener("keydown",e=>{if(e.key==="Enter")fim(i.value);else if(e.key==="Escape")fim("")});i.addEventListener("blur",()=>fim(i.value))};
  const menuNovo=(e,w)=>{const it=[{ic:"texto",txt:"Texto",det:"cartão de texto solto",fn:()=>criaTexto(w[0],w[1],false)},{ic:"adesivo",cor:"#E6BC62",txt:"Adesivo",det:"ideia rápida",fn:()=>criaTexto(w[0],w[1],true)}];
    if(ctx.tiposNota)for(const t of ctx.tiposNota())it.push({ic:t.ic,cor:t.cor,txt:t.nome,det:"nota nova",fn:()=>pedeNome(e.clientX,e.clientY,"Nome: "+t.nome.toLowerCase(),nm=>{const tt=ctx.novaNotaTipo(t.k,nm);if(tt){criaNota(tt,w[0],w[1]);ctx.aviso&&ctx.aviso(t.nome+" criada: "+tt)}})});
    it.push({ic:"notas",txt:"Nota que já existe…",fn:()=>menuEm(e.clientX,e.clientY,ctx.notas().map(n=>({ic:n.ic,cor:n.cor,txt:n.titulo,det:n.tipo,fn:()=>criaNota(n.titulo,w[0],w[1])})),true)});menuEm(e.clientX,e.clientY,it,false)};
  // ao ligar duas notas: que ligacao e essa (grava na nota e pinta a linha)
  const perguntaTipo=(ed,cx,cy)=>{const A=nos.get(ed.fromNode),B=nos.get(ed.toNode);if(!ctx.tiposLigacao||!A||!B||tipoNo(A)!=="nota"||tipoNo(B)!=="nota")return;const ta=tituloArq(A.file),tb=tituloArq(B.file);
    menuEm(cx,cy,ctx.tiposLigacao(ta,tb).map(t=>({ic:t.ic||"link",cor:t.cor?CORES[t.cor]:null,txt:t.nome,det:t.det,fn:()=>{if(ed.atlas&&ed.atlas.auto&&ctx.desligarTipo){const A2=nos.get(ed.fromNode),B2=nos.get(ed.toNode);if(A2&&B2)ctx.desligarTipo(tituloArq(A2.file),tituloArq(B2.file),ed.atlas.auto);ed.atlas=Object.assign({},ed.atlas);delete ed.atlas.auto;delete ed.atlas.grossa;delete ed.atlas.estilo}const r=ctx.ligarTipo(ta,tb,t.k,ed.label);marca();if(r&&r.inverte){const f=ed.fromNode,fs=ed.fromSide;ed.fromNode=ed.toNode;ed.fromSide=ed.toSide;ed.toNode=f;ed.toSide=fs}
      if(r){if(r.cor)ed.color=r.cor;else delete ed.color;if(r.atlas)ed.atlas=Object.assign({},ed.atlas,r.atlas);if(r.rotulo&&!ed.label)ed.label=r.rotulo}tudo();salva()}})),false)};
  const menuNotas=btn=>menuSimples(btn,ctx.notas().map(n=>({ic:n.ic,cor:n.cor,txt:n.titulo,det:n.tipo,fn:()=>criaNota(n.titulo)})),true);
  const menuMapas=btn=>menuSimples(btn,ctx.mapas().map(m=>({ic:m.ic,cor:"#8DB06A",txt:m.nome,det:m.det,fn:()=>criaMapa(m)})),false);
  const zoomTxt=el("span",{class:"qd-zt"});
  zoomB.append(el("button",{type:"button",class:"qd-zb",title:"Desfazer (Ctrl+Z)","aria-label":"Desfazer",onclick:()=>volta(pilha,refaz)},ic("desfazer",18)),el("button",{type:"button",class:"qd-zb",title:"Refazer","aria-label":"Refazer",onclick:()=>volta(refaz,pilha)},ic("refazer",18)),
    el("button",{type:"button",class:"qd-zb",title:"Afastar","aria-label":"Afastar",onclick:()=>{const r=vista.getBoundingClientRect();zoomEm(r.left+r.width/2,r.top+r.height/2,1/1.25)}},ic("menos",18)),zoomTxt,
    el("button",{type:"button",class:"qd-zb",title:"Aproximar","aria-label":"Aproximar",onclick:()=>{const r=vista.getBoundingClientRect();zoomEm(r.left+r.width/2,r.top+r.height/2,1.25)}},ic("mais",18)),el("button",{type:"button",class:"qd-zb",title:"Enquadrar tudo (F)","aria-label":"Enquadrar tudo",onclick:enquadra},ic("enquadrar",18)));
  function desenhaMini(){const g=mini.getContext("2d"),W=mini.width,H=mini.height;g.clearRect(0,0,W,H);if(!D.nodes.length){mini.hidden=true;return}mini.hidden=false;const r=vista.getBoundingClientRect(),vx0=-cam.x/cam.z,vy0=-cam.y/cam.z,vx1=vx0+r.width/cam.z,vy1=vy0+r.height/cam.z;
    let x0=vx0,y0=vy0,x1=vx1,y1=vy1;for(const n of D.nodes){x0=Math.min(x0,n.x);y0=Math.min(y0,n.y);x1=Math.max(x1,n.x+n.width);y1=Math.max(y1,n.y+n.height)}const k=Math.min((W-8)/(x1-x0||1),(H-8)/(y1-y0||1)),T=(x,y)=>[4+(x-x0)*k,4+(y-y0)*k];
    for(const n of D.nodes){if(!vis(n))continue;const p=T(n.x,n.y);g.fillStyle=n.type==="group"?"rgba(127,169,204,.18)":(corDe(n.color)||"#5a4c35");g.fillRect(p[0],p[1],Math.max(2,n.width*k),Math.max(2,n.height*k))}const a=T(vx0,vy0);g.strokeStyle="#D4A64A";g.lineWidth=1.5;g.strokeRect(a[0],a[1],(vx1-vx0)*k,(vy1-vy0)*k)}
  mini.addEventListener("pointerdown",e=>{const r=mini.getBoundingClientRect();let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9;const v=vista.getBoundingClientRect(),vx0=-cam.x/cam.z,vy0=-cam.y/cam.z;x0=Math.min(x0,vx0);y0=Math.min(y0,vy0);x1=Math.max(x1,vx0+v.width/cam.z);y1=Math.max(y1,vy0+v.height/cam.z);for(const n of D.nodes){x0=Math.min(x0,n.x);y0=Math.min(y0,n.y);x1=Math.max(x1,n.x+n.width);y1=Math.max(y1,n.y+n.height)}
    const k=Math.min((mini.width-8)/(x1-x0||1),(mini.height-8)/(y1-y0||1)),wx=x0+(e.clientX-r.left-4)/k,wy=y0+(e.clientY-r.top-4)/k;cam.x=v.width/2-wx*cam.z;cam.y=v.height/2-wy*cam.z;aplicaCam()});
  tudo();requestAnimationFrame(enquadra);
  return {dados:D,enquadra,selecao:()=>[...sel],linhaSel:()=>selL,cria,criaNota,criaTexto,apaga,desfazer:()=>volta(pilha,refaz),refazer:()=>volta(refaz,pilha),cam:()=>cam,
    noNaTela:id=>{const d=elNo.get(id);return d?d.getBoundingClientRect():null},atualiza:()=>tudo()}}
const copiarImgsParaPasta=async()=>{const d=await db();const ks=await new Promise(ok=>{const q=d.transaction("img","readonly").objectStore("img").getAllKeys();q.onsuccess=()=>ok(q.result||[]);q.onerror=()=>ok([])});for(const k of ks){const b=await leImg(k);if(b)await window.AtlasPasta.gravaArquivo("Imagens/"+k+".webp",b)}return ks.length};
window.AtlasQuadro={abrirQuadro,reduzImagem,leImg,copiarImgsParaPasta};
window.dispatchEvent(new Event("atlas-quadro"));
