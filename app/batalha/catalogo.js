// Atlas - Catalogo de artes: analisa cada arte dos pacotes do usuario uma vez (tamanho, parte desenhada, forma, cor,
// simetria, frente) e gera um arquivo so para a IA (com limite de tamanho) e um completo para o gerador.
import * as BIB from "./biblioteca.js";
import * as CL from "./classifica.js";
import {zip} from "./zip.js";
export const VERSAO_FICHA=2;
const QUAD=256; // px por quadrado no Dungeondraft

// ---------- guardar no navegador ----------
let pdb=null;const db=()=>pdb||(pdb=new Promise((ok,er)=>{const r=indexedDB.open("atlas-catalogo",1);r.onupgradeneeded=()=>r.result.createObjectStore("fichas");r.onsuccess=()=>ok(r.result);r.onerror=()=>er(r.error)}));
const pega=async k=>{const d=await db();return new Promise(ok=>{const q=d.transaction("fichas","readonly").objectStore("fichas").get(k);q.onsuccess=()=>ok(q.result||null);q.onerror=()=>ok(null)})};
const poe=async(k,v)=>{const d=await db();return new Promise((ok,er)=>{const t=d.transaction("fichas","readwrite");t.objectStore("fichas").put(v,k);t.oncomplete=()=>ok();t.onerror=()=>er(t.error)})};
const chave=P=>P.id+"|"+P.tam+"|"+P.mod+"|"+VERSAO_FICHA;
const CACHE=new Map();
export async function fichasDe(P){const k=chave(P);if(CACHE.has(k))return CACHE.get(k);const v=await pega(k);if(v)CACHE.set(k,v);return v}

// ---------- analise de uma imagem ----------
// ficha: [largura px, altura px, x0,y0,x1,y1 da parte desenhada (0-255), preenchimento (0-255), mascara 8x8 (hex), cor media (hex), simetria esq-dir (0-255), simetria cima-baixo (0-255)]
let tela=null,g=null;
function mede(bm){const W=bm.width,H=bm.height;if(!tela){tela=typeof OffscreenCanvas!=="undefined"?new OffscreenCanvas(64,64):Object.assign(document.createElement("canvas"),{width:64,height:64});g=tela.getContext("2d",{willReadFrequently:true})}
  const s=Math.min(1,64/Math.max(W,H)),w=Math.max(1,Math.round(W*s)),h=Math.max(1,Math.round(H*s));g.clearRect(0,0,64,64);g.drawImage(bm,0,0,w,h);const d=g.getImageData(0,0,w,h).data;
  let x0=w,y0=h,x1=-1,y1=-1,n=0,r=0,gg=0,b=0;const A=new Uint8Array(w*h);
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){const i=(y*w+x)*4,a=d[i+3];if(a>24){A[y*w+x]=1;n++;r+=d[i]*a;gg+=d[i+1]*a;b+=d[i+2]*a;if(x<x0)x0=x;if(y<y0)y0=y;if(x>x1)x1=x;if(y>y1)y1=y}}
  if(!n)return {vazio:true,w,h};
  let m=0n;for(let cy=0;cy<8;cy++)for(let cx=0;cx<8;cx++){let c=0,t=0;for(let y=Math.floor(cy*h/8);y<Math.max(Math.floor(cy*h/8)+1,Math.floor((cy+1)*h/8));y++)for(let x=Math.floor(cx*w/8);x<Math.max(Math.floor(cx*w/8)+1,Math.floor((cx+1)*w/8));x++){t++;c+=A[y*w+x]}if(c*4>=t)m|=1n<<BigInt(cy*8+cx)}
  const igual=(i,j)=>{const p=i*4,q=j*4;return A[j]&&Math.abs(d[p]-d[q])+Math.abs(d[p+1]-d[q+1])+Math.abs(d[p+2]-d[q+2])<70};
  let sh=0,sv=0;for(let y=0;y<h;y++)for(let x=0;x<w;x++){const i=y*w+x;if(!A[i])continue;if(igual(i,y*w+(w-1-x)))sh++;if(igual(i,(h-1-y)*w+x))sv++}
  let wa=0;for(let i=3;i<d.length;i+=4)wa+=d[i];
  const bw=x1-x0+1,bh=y1-y0+1;
  return {x0:Math.round(x0/w*255),y0:Math.round(y0/h*255),x1:Math.round((x1+1)/w*255),y1:Math.round((y1+1)/h*255),fill:Math.round(n/(bw*bh)*255),mask:m.toString(16).padStart(16,"0"),
    cor:wa?[r/wa,gg/wa,b/wa].map(v=>Math.round(v).toString(16).padStart(2,"0")).join(""):"000000",sh:Math.round(sh/n*255),sv:Math.round(sv/n*255)}}
async function fichaArte(P,f,a){const c="res://packs/"+P.id+"/"+a[0];let px=null;try{px=await BIB.medidas(f,a[1])}catch(e){}
  let src=null,mini=P.mini&&P.mini[BIB.md5(c)];if(mini)src=f.slice(mini[0],mini[0]+mini[1],"image/png");
  let bm=null;try{if(src)bm=await createImageBitmap(src);else{const tipo=/\.png$/i.test(a[0])?"image/png":/\.jpe?g$/i.test(a[0])?"image/jpeg":"image/webp",bl=f.slice(a[1],a[1]+a[2],tipo);
      const k=px?Math.min(1,64/Math.max(px[0],px[1])):1;bm=px&&k<1?await createImageBitmap(bl,{resizeWidth:Math.max(1,Math.round(px[0]*k)),resizeHeight:Math.max(1,Math.round(px[1]*k)),resizeQuality:"low"}):await createImageBitmap(bl)}}catch(e){}
  if(!bm)return px?[px[0],px[1]]:[0,0];if(!px)px=[bm.width,bm.height];const M=mede(bm);bm.close&&bm.close();
  if(M.vazio)return [px[0],px[1],0,0,0,0,0,"0","000000",0,0];return [px[0],px[1],M.x0,M.y0,M.x1,M.y1,M.fill,M.mask,M.cor,M.sh,M.sv]}
// analisa todos os pacotes (retoma de onde parou: cada pacote pronto fica guardado)
export async function analisar(o){o=o||{};const L=BIB.pacotesCompletos();let total=0,feito=0;for(const P of L)total+=P.artes.length;const t0=performance.now();
  for(const P of L){if(o.parar&&o.parar())break;const ja=await fichasDe(P);if(ja){feito+=P.artes.length;if(o.progresso)o.progresso(feito,total,P.nome,0);continue}
    const f=BIB.arquivoDe(P);if(!f)continue;const fichas=new Array(P.artes.length);let k=0;
    for(let i=0;i<P.artes.length;i++){if(o.parar&&o.parar())return {parado:true,feito,total};fichas[i]=await fichaArte(P,f,P.artes[i]);feito++;
      if(++k%60===0){if(o.progresso){const dt=(performance.now()-t0)/1000;o.progresso(feito,total,P.nome,dt)}await new Promise(r=>setTimeout(r,0))}}
    const v={id:P.id,nome:P.nome,fichas,quando:Date.now()};await poe(chave(P),v);CACHE.set(chave(P),v);if(o.progresso)o.progresso(feito,total,P.nome,(performance.now()-t0)/1000)}
  return {feito,total,segundos:(performance.now()-t0)/1000}}
export async function situacao(){const L=BIB.pacotesCompletos();let prontos=0,artes=0,analisadas=0;for(const P of L){artes+=P.artes.length;if(await fichasDe(P)){prontos++;analisadas+=P.artes.length}}return {pacotes:L.length,prontos,artes,analisadas}}

// ---------- entender os nomes ----------
const CORES=new Set("black white gray grey red blue green yellow orange purple pink brown dark light pale beige teal cyan magenta gold golden silver copper bronze rust rusted clean dirty cream tan olive navy maroon violet mint colorable lime aqua azure crimson ivory".split(" "));
const ehVariante=t=>CORES.has(t.toLowerCase())||/^[A-Z]?\d{1,3}[a-z]?$/.test(t)||/^[A-Za-z]$/.test(t)||/^\d+x\d+$/.test(t)||/^v\d+$/i.test(t);
const base=(rel,pref)=>{let n=rel.split("/").pop().replace(/\.(png|webp|jpe?g)$/i,"");if(pref&&n.startsWith(pref)&&n.length>pref.length+3)n=n.slice(pref.length);return n};
const pasta=rel=>rel.split("/").slice(1,-1).join("/");
// camada sugerida pelo nome
const K=(s,re)=>re.test(s);
const P_=w=>new RegExp("(?:^|[_ ])(?:"+w+")s?(?=$|[_ \\d])","i");
const RE_CHAO=P_("rug|carpet|mat|doormat|decal|stain|blood|crack|puddle|debris|floor|leaves|leaf|tuft|moss|dirt|mud|shadow|marking|line|manhole|drain|grate|scorch|splatter|footprint|track|trash_pile|litter|graffiti|paint|tile|scuff");
const RE_ALTO=P_("tree|canopy|chandelier|ceiling|hanging|roof|awning|wire|cable|banner|cloud|overhead|pergola|beam|billboard|gantry|string_light|fairy_light|drone");
const RE_SOBRE=P_("book|cup|mug|plate|bottle|candle|food|paper|scroll|letter|coin|key|knife|fork|spoon|glass|jar|vase|potion|dagger|bowl|pen|quill|phone|laptop|keyboard|mouse|card|dice|can|drink|consumable|ashtray|remote|tablet|headphone|syringe|pill");
const RE_LUZ=/(^|_)lit(_|$)|lamp|lantern|torch|candle|fire|neon|light/i;
function camada(nome,cat,wq,hq){if(cat!=="objects")return null;if(K(nome,RE_CHAO))return 100;if(K(nome,RE_ALTO))return 400;if(K(nome,RE_SOBRE)&&Math.max(wq,hq)<=1)return 300;return 200}
// frente na imagem: convencao do autor + excecoes conhecidas
const EXCECOES=[[/Fireplace_Rectangle/i,"W"]];
function frente(nome,autor,f){for(const [re,d] of EXCECOES)if(re.test(nome))return d;if(!f||f.length<11)return "?";const sh=f[9]/255,sv=f[10]/255;
  if(sh>.86&&sv>.86)return "sim";const fa=/forgotten adventures/i.test(autor);if(sh>.72&&sv<.72)return fa?"S":"N|S";if(sv>.72&&sh<.72)return fa?"S":"L|W";return fa?"S":"?"}
function forma(f){if(!f||f.length<11)return "";const w=(f[4]-f[2])||1,h=(f[5]-f[3])||1,ar=w/h,fill=f[6]/255;if(fill>.88)return "r";const mk=BigInt("0x"+(f[7]||"0")),canto=[0,7,56,63].some(b=>(mk>>BigInt(b))&1n);if(ar>.85&&ar<1.18&&fill>.68&&fill<.86&&!canto)return "o";return "i"}
const q=v=>{const r=Math.round(v*4)/4;return Number.isInteger(r)?String(r):r.toFixed(2).replace(/0$/,"")};
const tamQ=f=>f&&f[0]?q(f[0]/QUAD)+"x"+q(f[1]/QUAD):"?";
const nominal=b=>{const m=/(?:^|[_ ])(\d+(?:\.\d+)?)x(\d+(?:\.\d+)?)(?:$|[_ ])/.exec(b);return m&&+m[1]<=40&&+m[2]<=40&&+m[1]>0&&+m[2]>0?[+m[1],+m[2]]:null};
// tamanho para colocar: o do nome (o que o autor quis) ou o da imagem; avisa a escala quando a imagem e menor/maior
function tamFam(L){const G=new Map();for(const it of L){const n=nominal(it.base),f=it.f,s=n?q(n[0])+"x"+q(n[1]):tamQ(f);if(!G.has(s))G.set(s,[]);if(n&&f&&f[0])G.get(s).push(n[0]*QUAD/f[0])}
  return [...G].slice(0,6).map(([s,ks])=>{if(!ks.length)return s;const lo=Math.min(...ks),hi=Math.max(...ks);if(Math.abs(lo-1)<=.1&&Math.abs(hi-1)<=.1)return s;const r=v=>Math.round(v*100)/100;return s+" (esc "+(Math.abs(hi-lo)<.05?r(lo):r(lo)+"–"+r(hi))+")"}).join("|")+(G.size>6?"|…":"")}
function tamanhoTxt(it){const n=nominal(it.base),f=it.f;if(!n)return tamQ(f);const s=q(n[0])+"x"+q(n[1]);if(!f||!f[0])return s;const k=n[0]*QUAD/f[0];return Math.abs(k-1)>.1?s+" (esc "+(Math.round(k*100)/100)+")":s}
const cor3=h=>h&&h.length===6?h[0]+h[2]+h[4]:"";
const pct=v=>Math.min(99,Math.round(v/255*100));

// agrupa as artes de uma pasta em familias: o que muda (cor, letra, numero, tamanho) vira [a|b]
function familias(lista){const G=new Map();
  for(const it of lista){const tk=it.base.split(/[_ ]+/).filter(Boolean),chaveF=tk.map(t=>ehVariante(t)?"*":t).join("_")+"#"+tk.length;if(!G.has(chaveF))G.set(chaveF,{tk:tk.map(t=>ehVariante(t)?null:t),itens:[]});G.get(chaveF).itens.push(Object.assign(it,{tks:tk}))}
  return [...G.values()].map(F=>{const pos=F.tk.map((t,i)=>t!=null?null:[...new Set(F.itens.map(x=>x.tks[i]))]),prod=pos.reduce((a,v)=>a*(v?v.length:1),1),sep=F.itens[0].base.includes(" ")&&!F.itens[0].base.includes("_")?" ":"_";
    const alt=v=>{if(v.length===1)return v[0];const m=v.map(x=>/^([A-Za-z]*)(\d+)$/.exec(x));if(m.every(Boolean)&&new Set(m.map(x=>x[1])).size===1){const ns=m.map(x=>+x[2]).sort((a,b)=>a-b),w=m[0][2].length;if(ns[ns.length-1]-ns[0]+1===ns.length&&m.every(x=>x[2].length===w))return m[0][1]+"["+String(ns[0]).padStart(w,"0")+"-"+String(ns[ns.length-1]).padStart(w,"0")+"]"}return "["+v.join("|")+"]"};
    let modelo;if(prod===F.itens.length)modelo=F.tk.map((t,i)=>t!=null?t:alt(pos[i])).join(sep);else{const fixo=F.tk.map(t=>t==null?"*":t).join(sep);modelo=fixo+" {"+F.itens.map(x=>x.tks.filter((t,i)=>F.tk[i]==null).join(sep)).join("|")+"}"}
    return {modelo,itens:F.itens,n:F.itens.length}}).sort((a,b)=>a.modelo.localeCompare(b.modelo))}

// ---------- arquivo para a IA ----------
const LEGENDA=`## Como ler
- Arte = res://packs/<ID>/textures/<pasta>/<nome>.<ext>. Cada pacote diz ID e extensão; cada "###" diz a pasta; cada linha é uma família.
- "prefixo X" no cabeçalho da pasta: todo nome daquela pasta começa com X (junte X + nome da linha).
- Modelo do nome: [a|b] = escolha uma opção; A[1-3] = A1, A2 ou A3; "* {x|y}" = troque o * por uma das opções da lista.
- Tamanho em quadrados (1 quadrado = 256 px). "esc 1.6" = a imagem é menor que o tamanho do nome: no Dungeondraft use escala 1.6 para ocupar esse tamanho. No Dungeondraft a posição é o centro da imagem; rotação em radianos, positiva no sentido horário.
- vis x,y,l,a = parte desenhada dentro da imagem, em % da largura/altura, a partir do canto de cima à esquerda (para encostar na parede, desconte a margem).
- fr = para onde a FRENTE aponta na imagem sem girar: S baixo, N cima, L direita, W esquerda; sim = simétrico; N|S = a frente é cima ou baixo (simétrico de lado); L|W = a frente é direita ou esquerda; ? = não se sabe. Na FA a parte de trás fica no topo (fr S): parede ao norte rot 0, leste +π/2, sul π, oeste −π/2.
- c = camada sugerida: 100 chão (tapete, mancha), 200 móveis, 300 em cima de móveis, 400 alto (copa de árvore, lustre).
- f = forma: r retângulo, o redondo, i irregular. cor = cor média (hex de 3). C = muda de cor. L = tem luz. #etiquetas do autor.
- Quando a família tem tamanhos diferentes, aparece "2x1|3x1".`;
function linhaFamilia(F,P,nivel){const f0=F.itens[0].f,sz=tamFam(F.itens);let s=F.modelo;
  if(nivel<3&&s.length>140)s=F.itens[0].base+" (+"+(F.n-1)+" variações)";
  const partes=[s,sz];if(nivel>=2){const fr=frente(F.itens[0].base,P.autor,f0),c=camada(F.itens[0].base,"objects",(f0&&f0[0]||0)/QUAD,(f0&&f0[1]||0)/QUAD);if(fr!=="?")partes.push("fr "+fr);if(c)partes.push("c"+c)}
  if(nivel>=3&&f0&&f0.length>=11){partes.push("vis "+[pct(f0[2]),pct(f0[3]),pct(f0[4]-f0[2]),pct(f0[5]-f0[3])].join(","));const fo=forma(f0);if(fo)partes.push("f "+fo);partes.push("cor "+cor3(f0[8]))}
  const fl=(F.itens.some(x=>/colorable/i.test(x.base)||(x.tags||[]).some(t=>/colorable/i.test(t)))?"C":"")+(F.itens.some(x=>K(x.base,RE_LUZ)&&/(^|_)lit(_|$)|lamp|lantern|torch|candle|neon/i.test(x.base))?"L":"");if(fl&&nivel>=2)partes.push(fl);
  if(nivel>=2){const tg=[...new Set(F.itens.flatMap(x=>x.tags||[]))].filter(t=>!/colorable/i.test(t)).slice(0,3);if(tg.length)partes.push(tg.map(t=>"#"+t.replace(/\s+/g,"_")).join(" "))}
  return partes.join(" · ")}
function linhaSimples(F,cat,nivel){const f0=F.itens[0].f,partes=[nivel<3&&F.modelo.length>140?F.itens[0].base+" (+"+(F.n-1)+")":F.modelo];
  if(cat==="paths"&&f0&&f0[1])partes.push("largura "+q(f0[1]/QUAD));if((cat==="terrain"||cat==="patterns"||cat==="textures"||cat==="tilesets")&&f0&&f0[0])partes.push("repete "+q(f0[0]/QUAD)+"x"+q(f0[1]/QUAD));if(cat==="portals"&&f0&&f0[0])partes.push(tamQ(f0));
  if(nivel>=2&&f0&&f0[8])partes.push("cor "+cor3(f0[8]));return partes.join(" · ")}
const NOMES_CAT={tilesets:"Pisos em quadrados (tilesets)",objects:"Objetos",terrain:"Terrenos (pincel de chão)",patterns:"Padrões e pisos",textures:"Texturas",walls:"Paredes",paths:"Caminhos",portals:"Portas e janelas",lights:"Luzes",materials:"Materiais",material:"Materiais"};
async function montaDados(ids){const out=[];for(const P of BIB.pacotesCompletos()){if(ids&&!ids.includes(P.id))continue;const fx=await fichasDe(P),cats=new Map();
    P.artes.forEach((a,i)=>{const cat=BIB.categoria(a[0]);if(!cats.has(cat))cats.set(cat,new Map());const pa=pasta(a[0]),m=cats.get(cat);if(!m.has(pa))m.set(pa,[]);m.get(pa).push({rel:a[0],base:base(a[0],""),f:fx?fx.fichas[i]:null,tags:(a[4]||[]).map(t=>P.tags[t])})});
    const ext=[...new Set(P.artes.map(a=>a[0].split(".").pop()))].join("/");out.push({P,fx:!!fx,cats,ext})}return out}
function texto(D,nivel){const L=[];let artes=0,fams=0;
  for(const {P,cats,ext,fx} of D){const conv=/forgotten adventures/i.test(P.autor)?" · convenção: costas no topo (fr S)":"";
    L.push("","## Pacote "+P.nome+" · id "+P.id+(P.autor?" · "+P.autor:"")+" · ."+ext+conv+(fx?"":" · (sem análise: só nomes)")+" · detalhe "+["só pastas","tipos","famílias","completo"][nivel]);
    for(const [cat,m] of [...cats].sort((a,b)=>(a[0]==="objects"?1:0)-(b[0]==="objects"?1:0))){
      for(const [pa,lista0] of [...m].sort((a,b)=>a[0].localeCompare(b[0]))){let pr="";if(lista0.length>1){let p=lista0[0].base;for(const x of lista0)while(p&&!x.base.startsWith(p))p=p.slice(0,-1);const k=Math.max(p.lastIndexOf("_"),p.lastIndexOf(" "));pr=k>0&&lista0.every(x=>x.base.length>k+3)?p.slice(0,k+1):""}
        const lista=pr?lista0.map(x=>Object.assign({},x,{base:x.base.slice(pr.length)})):lista0,F=familias(lista),PR=pr?" · prefixo "+pr:"";artes+=lista.length;fams+=F.length;
        if(nivel===0){L.push("### "+pa+" · "+lista.length+" artes · "+F.length+" famílias"+PR);continue}
        if(nivel===1){// tipos: familias juntadas pelas duas primeiras palavras fixas, com tamanhos e um exemplo exato
          const T=new Map();for(const x of F){const k=x.modelo.split(/[_ ]+/).filter(t=>!/[\[\]{}*]/.test(t)).slice(0,2).join("_")||x.itens[0].base;if(!T.has(k))T.set(k,[]);T.get(k).push(x)}
          L.push("### "+pa+" · "+(NOMES_CAT[cat]||cat)+" · "+lista.length+" artes"+PR);for(const [k,xs] of T){const n=xs.reduce((s,x)=>s+x.n,0),sz=[...new Set(xs.flatMap(x=>x.itens.map(i=>tamanhoTxt(i))))].slice(0,5).join("|");L.push(k+" · "+n+(n>1?" artes":" arte")+(sz&&sz!=="?"?" · "+sz:"")+" · ex. "+xs[0].itens[0].base)}continue}
        L.push("### "+pa+" · "+(NOMES_CAT[cat]||cat)+" · "+lista.length+" artes"+PR);for(const x of F)L.push(cat==="objects"?linhaFamilia(x,P,nivel):linhaSimples(x,cat,nivel))}}}
  return {corpo:L.join("\n"),artes,fams}}
export const tokens=s=>Math.round(s.length/3.6);
// orcamento em tokens (aprox. 3,6 letras por token); null = sem limite
export async function arquivoIA(o){o=o||{};const D=await montaDados(o.pacotes||null),lim=o.orcamento||null;
  // cada pacote ganha o maior detalhe que couber; quem e pequeno fica completo, quem e enorme fica resumido
  const V=D.map(d=>[0,1,2,3].map(n=>texto([d],n))),niv=D.map(()=>lim?0:3);const custo=()=>V.reduce((s,v,i)=>s+tokens(v[niv[i]].corpo),0);
  if(lim){for(let n=1;n<=3;n++){const ord=D.map((d,i)=>i).sort((a,b)=>tokens(V[a][n].corpo)-tokens(V[b][n].corpo));for(const i of ord){const ant=niv[i];if(ant!==n-1)continue;niv[i]=n;if(custo()>lim-1500)niv[i]=ant}}}
  const T={corpo:V.map((v,i)=>v[niv[i]].corpo).join("\n"),artes:V.reduce((s,v)=>s+v[0].artes,0),fams:V.reduce((s,v)=>s+v[0].fams,0)},nivel=Math.min(...niv,3);
  let corpo=T.corpo,cortado=false;if(lim&&tokens(corpo)>lim){corpo=corpo.slice(0,Math.floor(lim*3.6));corpo=corpo.slice(0,corpo.lastIndexOf("\n"))+"\n… (cortado para caber no limite; escolha menos pacotes)";cortado=true}
  const det=["só pastas e quantidades","tipos de arte com tamanhos e um exemplo de nome exato","famílias com tamanho, frente, camada e etiquetas","completo: + parte desenhada, forma e cor"][nivel];
  const cab=["# Catálogo de artes do Atlas · formato 1","Gerado em "+new Date().toISOString().slice(0,10)+" · "+D.length+" pacotes · "+T.artes.toLocaleString("pt-BR")+" artes · "+T.fams.toLocaleString("pt-BR")+" famílias · detalhe: "+(new Set(niv).size>1?"varia por pacote (os grandes ficam resumidos)":det)+(lim?" · limite ~"+Math.round(lim/1000)+" mil tokens":""),LEGENDA].join("\n");
  const s=cab+"\n"+corpo+"\n";return {texto:s,nivel,tokens:tokens(s),cortado,artes:T.artes,familias:T.fams}}
// completo (para o gerador do Atlas e para ferramentas): JSON com tudo, comprimido
export async function arquivoCompleto(o){o=o||{};const D=await montaDados(o.pacotes||null),J={formato:"atlas-catalogo",versao:2,gerado:new Date().toISOString(),quadrado_px:QUAD,
    campos_ficha:["largura_px","altura_px","x0","y0","x1","y1","preenchimento","mascara8x8","cor","simetria_esq_dir","simetria_cima_baixo"],campos_cl:["categoria","tipo","ambientes","encosta","passavel"],pacotes:[]};
  for(const {P} of D){const fx=await fichasDe(P);J.pacotes.push({id:P.id,nome:P.nome,autor:P.autor,versao:P.versao,prefixo:P.pref||"",etiquetas:P.tags,conjuntos:P.conjuntos||{},
    artes:P.artes.map((a,i)=>{const f=fx?fx.fichas[i]:null,b=base(a[0],P.pref);const k=CL.classifica(a[0],(a[4]||[]).map(t=>P.tags[t])),oc=f&&f.length>=11&&f[0]?CL.ocupa(f[7],f[0]/QUAD,f[1]/QUAD):null;return {c:a[0],e:a[4]||[],f,cam:camada(b,BIB.categoria(a[0]),f?f[0]/QUAD:0,f?f[1]/QUAD:0),fr:frente(b,P.autor,f),fo:forma(f),cl:[k.cat,k.sub,k.amb,k.enc,k.pas?1:0],oc}})})}
  const s=JSON.stringify(J);if(typeof CompressionStream==="undefined")return {blob:new Blob([s],{type:"application/json"}),nome:"catalogo-artes.json"};
  const gz=await new Response(new Blob([s]).stream().pipeThrough(new CompressionStream("gzip"))).blob();return {blob:gz,nome:"catalogo-artes.json.gz",bruto:s.length}}
// ---------- catalogo v2 para a IA: indice + kits + um arquivo por pacote (em partes) ----------
// A ideia: a IA le sempre o indice (o que existe, em que pacote, em que arquivo) e os kits (conjuntos que combinam por ambiente);
// so abre o arquivo do pacote quando vai usar aquelas artes. Assim cabe numa conversa mesmo com 100 mil artes.
const ENC1={parede:"p",canto:"k",meio:"m",solto:"s"};
// tamanho real: o da imagem a 256 px por quadrado (scale 1, como o Dungeondraft poe). O _1x1 do nome e a casa que a arte ocupa
// (arredondada para cima), nao o tamanho: uma caneca da FA tem 80 px e se chama _1x1. Tentar tirar uma "escala do pacote" do nome deu errado
// (PeaPu daria escala 2 e latas de 3 quadrados), entao fica sempre scale 1.
function escalaPacote(){return 1}
// palavras de cada tipo (para o exemplo do kit ser a coisa em si: "Oven_..." e nao "Oven_Shovel" se houver um forno)
const PAL_SUB=new Map(CL.ARVORE.filter(r=>Array.isArray(r[2])).map(r=>[r[1],new Set(r[2])]));
const tamReal=(it,esc)=>{const f=it.f;if(f&&f[0])return q(f[0]/QUAD*esc)+"x"+q(f[1]/QUAD*esc);const n=nominal(it.base);return n?q(n[0])+"x"+q(n[1]):"?"};
const tamFamReal=(L,esc)=>{const S=[...new Set(L.map(it=>tamReal(it,esc)))];return S.slice(0,6).join("|")+(S.length>6?"|…":"")};
const slug=s=>(s||"").normalize("NFD").replace(/[̀-ͯ]/g,"").replace(/[^A-Za-z0-9]+/g,"-").replace(/^-|-$/g,"").toLowerCase().slice(0,48);
const LEGENDA2=`## Como ler (vale para todos os arquivos)
- Arte = res://packs/<ID>/<caminho>.<ext>. Cada pacote tem um código curto (P01, P02…), o ID real e a extensão no índice.
- Nos arquivos de pacote, "pasta X" diz a pasta; "prefixo Y" = todo nome ali começa com Y (junte Y + nome da linha).
- Modelo do nome: [a|b] = escolha uma; A[1-3] = A1, A2 ou A3; "* {x|y}" = troque o * por uma das opções.
- Tamanho = o tamanho real no mapa com scale 1, em quadrados (1 quadrado = 256 px). Use scale 1. O "_1x1" no fim do nome é só a casa que a arte ocupa, arredondada para cima: uma caneca chamada _1x1 tem 0.25x0.25. Não aumente a arte para encher a casa.
- A posição é o centro da imagem; rotação em radianos, positiva no sentido horário.
- fr = para onde a FRENTE aponta sem girar: S baixo, N cima, L direita, W esquerda; sim simétrico; N|S cima ou baixo; L|W um dos lados; ? não se sabe. Na FA as costas ficam no topo (fr S): encostado na parede norte rot 0, leste +π/2, sul π, oeste −π/2.
- e = onde fica: p encosta na parede, k vai no canto, m fica no meio, s solto. "passa" = dá para andar por cima (tapete, mancha, folhas).
- oc = quadrados que a arte ocupa de verdade, linha por linha de cima para baixo (1 ocupa, 0 vazio), ex. oc 110/011. Sem oc = ocupa o retângulo todo.
- c = camada: 100 chão, 200 móveis, 300 em cima de móveis, 400 alto (copa, lustre).
- vis x,y,l,a = parte desenhada dentro da imagem em % (para encostar, desconte a margem). f = forma (r retângulo, o redondo, i irregular). cor = cor média (hex de 3). C = muda de cor. L = tem luz. #etiquetas do autor.
- largura (caminhos) e repete (terrenos e texturas) em quadrados.`;
function linhaV2(F,P,cat,ambP,esc){const f0=F.itens[0].f,b0=F.itens[0].base,cl=F.itens[0].cl,partes=[F.modelo];esc=esc||1;
  if(cat==="objects"){partes.push(tamFamReal(F.itens,esc));const fr=frente(b0,P.autor,f0);if(fr!=="?")partes.push("fr "+fr);
    if(cl){partes.push("e "+ENC1[cl.enc]+(cl.pas?" passa":""));const ex=cl.amb.filter(a=>!ambP.has(a));if(ex.length)partes.push("amb "+ex.slice(0,3).join(","))}
    if(f0&&f0.length>=11&&f0[0]){const oc=CL.ocupa(f0[7],f0[0]/QUAD*esc,f0[1]/QUAD*esc);if(oc){const W=Math.round(f0[0]/QUAD*esc),r=[];for(let k=0;k<oc.length;k+=W)r.push(oc.slice(k,k+W));partes.push("oc "+r.join("/"))}}
    const c=camada(b0,"objects",(f0&&f0[0]||0)/QUAD*esc,(f0&&f0[1]||0)/QUAD*esc);if(c)partes.push("c"+c);
    if(f0&&f0.length>=11){partes.push("vis "+[pct(f0[2]),pct(f0[3]),pct(f0[4]-f0[2]),pct(f0[5]-f0[3])].join(","));const fo=forma(f0);if(fo)partes.push("f "+fo);partes.push("cor "+cor3(f0[8]))}
    const fl=(F.itens.some(x=>/colorable/i.test(x.base)||(x.tags||[]).some(t=>/colorable/i.test(t)))?"C":"")+(F.itens.some(x=>/(^|_)lit(_|$)|lamp|lantern|torch|candle|neon/i.test(x.base))?"L":"");if(fl)partes.push(fl);
    const tg=[...new Set(F.itens.flatMap(x=>x.tags||[]))].filter(t=>!/colorable/i.test(t)).slice(0,3);if(tg.length)partes.push(tg.map(t=>"#"+t.replace(/\s+/g,"_")).join(" "))}
  else{if(cat==="paths"&&f0&&f0[1])partes.push("largura "+q(f0[1]/QUAD));if(/^(terrain|patterns|textures|tilesets|materials?)$/.test(cat)&&f0&&f0[0])partes.push("repete "+q(f0[0]/QUAD)+"x"+q(f0[1]/QUAD));if(cat==="portals"&&f0&&f0[0])partes.push(tamQ(f0));if(f0&&f0[8])partes.push("cor "+cor3(f0[8]))}
  return partes.join(" · ")}
// dados de um pacote agrupados por categoria do Atlas > tipo > pasta, com familias
function gruposV2(d){const P=d.P,G=new Map(),amb=new Map();let nObj=0;
  for(const [cat,m] of d.cats)for(const [pa,lista] of m)for(const it of lista){it.cl=CL.classifica(it.rel,it.tags);it.cat=cat;it.pa=pa;const k=it.cl.cat+" › "+it.cl.sub;if(!G.has(k))G.set(k,{cat:it.cl.cat,sub:it.cl.sub,itens:[]});G.get(k).itens.push(it);if(cat==="objects"){nObj++;for(const a of it.cl.amb)amb.set(a,(amb.get(a)||0)+1)}}
  const ambP=new Set([...amb].filter(([a,n])=>n>=nObj*.6).map(x=>x[0]));
  return {G:[...G.values()].sort((a,b)=>a.cat.localeCompare(b.cat)||a.sub.localeCompare(b.sub)),ambP,amb}}
// uma secao por tipo; se passar do limite, vira pedacos (o cabecalho e a pasta se repetem)
function secaoV2(g,P,ambP,lim,esc){const tit="## "+g.cat+" › "+g.sub+" · "+g.itens.length+(g.itens.length===1?" arte":" artes"),L=["",tit],porPasta=new Map(),ped=[];let fams=0,t=0,pastaAt="";
  const poe=x=>{const tx=tokens(x)+1;if(lim&&t+tx>lim&&L.length>3){ped.push(L.join("\n"));L.length=0;L.push("",tit+" (continua)");t=0;if(!x.startsWith("pasta "))L.push(pastaAt)}L.push(x);t+=tx};
  for(const it of g.itens){const k=it.cat+"|"+it.pa;if(!porPasta.has(k))porPasta.set(k,[]);porPasta.get(k).push(it)}
  for(const [k,lista0] of [...porPasta].sort((a,b)=>a[0].localeCompare(b[0]))){const [cat,pa]=k.split("|");let pr="";
    if(lista0.length>1){let p=lista0[0].base;for(const x of lista0)while(p&&!x.base.startsWith(p))p=p.slice(0,-1);const j=Math.max(p.lastIndexOf("_"),p.lastIndexOf(" "));pr=j>0&&lista0.every(x=>x.base.length>j+3)?p.slice(0,j+1):""}
    const lista=pr?lista0.map(x=>Object.assign({},x,{base:x.base.slice(pr.length)})):lista0,F=familias(lista);fams+=F.length;
    pastaAt="pasta textures/"+pa+"/"+(pr?" · prefixo "+pr:"");poe(pastaAt);for(const x of F)poe(linhaV2(x,P,cat,ambP,cat==="objects"?esc:1))}
  ped.push(L.join("\n"));return {pedacos:ped,fams}}
// monta todos os arquivos; limPart = tokens por arquivo de pacote (os grandes viram partes)
export async function arquivoIA2(o){o=o||{};const D=await montaDados(o.pacotes||null);return montaV2(D,o)}
export function montaV2(D,o){o=o||{};const limPart=o.parte||45000,arqs=[],hoje=(o.hoje||new Date().toISOString().slice(0,10));
  const ord=D.slice().sort((a,b)=>a.P.nome.localeCompare(b.P.nome)),cod=new Map(ord.map((d,i)=>[d.P.id,"P"+String(i+1).padStart(2,"0")]));
  const arvore=new Map(),kits=new Map(),linhasPac=[];let artesT=0,famsT=0;
  const escP=new Map();
  for(const d of ord){const P=d.P,C=cod.get(P.id),{G,ambP,amb}=gruposV2(d),nome=C+"-"+slug(P.nome),esc=escalaPacote(G.flatMap(g=>g.itens.filter(it=>it.cat==="objects")));escP.set(C,esc);
    // secoes de tipo -> partes de ate limPart tokens
    const partes=[];let atual=null;
    for(const g of G){const sx=secaoV2(g,P,ambP,limPart,esc);famsT+=sx.fams;artesT+=g.itens.length;
      const ps=[];for(const pd of sx.pedacos){const t=tokens(pd);if(!atual||(atual.t+t>limPart&&atual.secs.length)){atual={secs:[],t:0,tipos:[]};partes.push(atual)}atual.secs.push(pd);atual.t+=t;ps.push(partes.length)}
      const k=g.cat+" › "+g.sub;if(!arvore.has(k))arvore.set(k,{cat:g.cat,sub:g.sub,n:0,pac:[],enc:new Map(),amb:new Map()});const A=arvore.get(k);A.n+=g.itens.length;
      for(const it of g.itens){A.enc.set(it.cl.enc,(A.enc.get(it.cl.enc)||0)+1);for(const a of it.cl.amb)A.amb.set(a,(A.amb.get(a)||0)+1)}
      const cp=new Map();for(const it of g.itens)cp.set(it.pa,(cp.get(it.pa)||0)+1);const paTop=[...cp].sort((x,y)=>y[1]-x[1])[0][0];A.pac.push({C,p0:ps[0],p1:ps[ps.length-1],n:g.itens.length,ex:g.itens.find(it=>it.pa===paTop)});
      // kits: o que este pacote tem de cada tipo (so objetos) e quantas artes de cada ambiente
      const ob=g.itens.filter(it=>it.cat==="objects");if(ob.length){if(!kits.has(C))kits.set(C,{P,C,subs:new Map(),amb:new Map()});const K=kits.get(C);K.subs.set(g.sub,{k,itens:ob,parte:ps[0]});for(const it of ob)for(const a of it.cl.amb)K.amb.set(a,(K.amb.get(a)||0)+1)}}
    const cab=(i)=>["# "+P.nome+(partes.length>1?" · parte "+(i+1)+" de "+partes.length:""),"Código "+C+" · id "+P.id+(P.autor?" · "+P.autor:"")+" · ."+d.ext+(/forgotten adventures/i.test(P.autor)?" · costas no topo (fr S)":"")+(d.fx?"":" · sem análise (só nomes: rode Analisar artes)")+(ambP.size?" · ambiente do pacote: "+[...ambP].join(", "):""),"Legenda em 00-indice.md."].join("\n");
    const arqsP=partes.map((pt,i)=>({nome:"pacotes/"+nome+(partes.length>1?"-parte"+(i+1):"")+".md",texto:cab(i)+"\n"+pt.secs.join("\n")+"\n",t:pt.t}));arqs.push(...arqsP);
    const tot=d.cats?[...d.cats.values()].reduce((s,m)=>s+[...m.values()].reduce((a,l)=>a+l.length,0),0):0,ambTop=[...amb].sort((a,b)=>b[1]-a[1]).slice(0,4).map(x=>x[0]);
    linhasPac.push(C+" · "+P.nome.replace(/_/g," ")+" · id "+P.id+(P.autor?" · "+P.autor:"")+" · ."+d.ext+" · "+tot.toLocaleString("pt-BR")+" artes"+(ambTop.length?" · "+ambTop.join(", "):"")+" · "+(arqsP.length>1?arqsP.length+" partes: "+arqsP.map(a=>a.nome.split("/")[1]).join(", "):arqsP[0]?arqsP[0].nome.split("/")[1]:"vazio")+(d.fx?"":" · sem análise"))}
  // indice
  const refP=(x,np)=>x.C+(np>1?"."+(x.p1>x.p0?x.p0+"-"+x.p1:x.p0):"")+" "+x.n;
  const nPartes=new Map();for(const a of arqs){const m=/pacotes\/(P\d+)/.exec(a.nome);nPartes.set(m[1],(nPartes.get(m[1])||0)+1)}
  const I=["# Catálogo de artes do Atlas · v2 · índice","Gerado em "+hoje+" · "+ord.length+" pacotes · "+artesT.toLocaleString("pt-BR")+" artes · "+famsT.toLocaleString("pt-BR")+" famílias.","",
    "Como usar: leia este índice e 01-kits.md. Para pôr artes de um tipo, abra o arquivo do pacote indicado (P07 = pacotes/P07-…md; P07.2 = a parte 2 desse pacote). Os nomes exatos e os detalhes (tamanho, frente, onde encosta, quadrados ocupados) estão só lá: não invente nomes.","",LEGENDA2,"","## Pacotes",...linhasPac,"","## Tipos de arte","Cada tipo: total · onde costuma ficar · ambientes · pacotes (código e quantidade) · um exemplo de caminho."];
  let catAnt="";for(const A of [...arvore.values()].sort((a,b)=>a.cat.localeCompare(b.cat)||b.n-a.n)){if(A.cat!==catAnt){I.push("","### "+A.cat);catAnt=A.cat}
    const e=[...A.enc].sort((a,b)=>b[1]-a[1])[0],am=[...A.amb].sort((a,b)=>b[1]-a[1]).slice(0,4).map(x=>x[0]),pc=A.pac.sort((a,b)=>b.n-a.n),ex=pc[0].ex;
    I.push(A.sub+" · "+A.n+(e&&A.cat!=="Chão e efeitos"?" · "+CL.ENCOSTA[e[0]]:"")+(am.length?" · "+am.join(", "):"")+" · "+pc.slice(0,14).map(x=>refP(x,nPartes.get(x.C))).join(", ")+(pc.length>14?" (+"+(pc.length-14)+" pacotes)":"")+" · ex. "+pc[0].C+" textures/"+ex.pa+"/"+ex.base)}
  // kits por ambiente: os pacotes com mais artes daquele ambiente; primeiro o que o lugar costuma ter (cama, mesa, luz...),
  // depois o resto que o pacote marca com o ambiente; um exemplo real de cada, no estilo mais comum
  const Kt=["# Catálogo de artes do Atlas · v2 · kits por ambiente","Para montar um cômodo ou lugar: escolha um ambiente e um pacote (as artes de um pacote combinam entre si). Primeiro vem o que esse lugar costuma ter, depois o resto que o pacote tem para ele. Os nomes são exemplos reais; as variações estão no arquivo do pacote. Legenda em 00-indice.md."];
  const exemplo=(l,a,eTop)=>{const comA=l.filter(x=>x.cl.amb.includes(a)),b0=comA.length?comA:l,bE=eTop?b0.filter(x=>CL.estilo(x.rel)===eTop):[],base=bE.length?bE:b0,cp=new Map();for(const x of base)cp.set(x.pa,(cp.get(x.pa)||0)+1);
    const paTop=[...cp].sort((x,y)=>y[1]-x[1])[0][0],W=PAL_SUB.get(l[0].cl.sub),cab=x=>{const t=x.base.replace(/^PP_[A-Za-z]+_(?:[A-Za-z0-9-]+_){0,4}?(?:Ext|Int|Univ|Universal|VG)[0-9]*[a-z]?_/,"").toLowerCase().split(/[^a-z]+/).filter(Boolean);return W&&(W.has(t[0])||W.has(t[0]+"_"+t[1]))?0:1};
    return base.filter(x=>x.pa===paTop).sort((x,y)=>cab(x)-cab(y)||x.base.length-y.base.length)[0]};
  const ambs=[...new Set([...kits.values()].flatMap(K=>[...K.amb.keys()]))].sort((x,y)=>x.localeCompare(y));
  for(const a of ambs){Kt.push("","## "+a);const tip=CL.TIPICOS[a]||[];
    for(const K of [...kits.values()].filter(K=>K.amb.get(a)).sort((x,y)=>y.amb.get(a)-x.amb.get(a)).slice(0,o.kitsPac||5)){
      const est=new Map();for(const S of K.subs.values())for(const it of S.itens)if(it.cl.amb.includes(a)){const e=CL.estilo(it.rel);if(e)est.set(e,(est.get(e)||0)+1)}const eTop=([...est].sort((x,y)=>y[1]-x[1])[0]||[])[0];
      const subs=[...tip.filter(t=>K.subs.has(t)),...[...K.subs].filter(([t,S])=>!tip.includes(t)&&S.itens.some(x=>x.cl.amb.includes(a))).sort((x,y)=>y[1].itens.filter(i=>i.cl.amb.includes(a)).length-x[1].itens.filter(i=>i.cl.amb.includes(a)).length).map(x=>x[0])].slice(0,o.kitsTipos||12);
      if(!subs.length)continue;Kt.push("### "+K.C+" "+K.P.nome.replace(/_/g," ")+" · "+K.amb.get(a)+" artes de "+a.toLowerCase()+(eTop?" · estilo mais comum: "+eTop:""));
      for(const t of subs){const S=K.subs.get(t),it=exemplo(S.itens,a,eTop),f=it.f,fr=frente(it.base,K.P.autor,f);
        Kt.push("- "+t+" ("+S.itens.length+") · "+K.C+(nPartes.get(K.C)>1?"."+S.parte:"")+" textures/"+it.pa+"/"+it.base+" · "+tamReal(it,escP.get(K.C)||1)+(fr!=="?"?" · fr "+fr:"")+" · e "+ENC1[it.cl.enc]+(it.cl.pas?" passa":""))}}}
  const LEIA=["# Catálogo de artes do Atlas · v2","","Este catálogo descreve as artes dos seus pacotes para uma IA (por exemplo o Claude) montar mapas com elas.","",
    "## Numa conversa","1. Anexe 00-indice.md e 01-kits.md e peça o mapa.","2. A IA diz quais arquivos de pacote precisa (ex.: P07). Anexe esses da pasta pacotes/.","3. Pronto: ela usa os nomes exatos e os detalhes de lá.","",
    "## Num Projeto do Claude","Envie todos os arquivos para o conhecimento do projeto. A IA busca sozinha o que precisar.","",
    "## Tamanhos",...[["00-indice.md",tokens(I.join("\n"))],["01-kits.md",tokens(Kt.join("\n"))]].map(([n,t])=>"- "+n+": ~"+Math.round(t/1000)+" mil tokens"),"- pacotes/: "+arqs.length+" arquivos, até ~"+Math.round(limPart/1000)+" mil tokens cada"];
  const todos=[{nome:"LEIA-ME.md",texto:LEIA.join("\n")+"\n"},{nome:"00-indice.md",texto:I.join("\n")+"\n"},{nome:"01-kits.md",texto:Kt.join("\n")+"\n"},...arqs];
  const enc=new TextEncoder(),total=todos.reduce((s,a)=>s+tokens(a.texto),0);
  return {arquivos:todos,blob:zip(todos.map(a=>({nome:a.nome,dados:enc.encode(a.texto)}))),tokens:{indice:tokens(I.join("\n")),kits:tokens(Kt.join("\n")),total},pacotes:ord.length,artes:artesT,familias:famsT,partes:arqs.length}}
// ficha de uma arte so, medida na hora quando o pacote ainda nao foi analisado (para o gerador de zonas)
const UMA=new Map();
export async function fichaUma(c){const ja=await fichaDe(c);if(ja)return ja;if(UMA.has(c))return UMA.get(c);const m=/^res:\/\/packs\/([^/]+)\/(.+)$/.exec(c);if(!m)return null;const P=BIB.pacotesCompletos().find(p=>p.id===m[1]);if(!P)return null;const a=P.artes.find(x=>x[0]===m[2]),f=BIB.arquivoDe(P);if(!a||!f)return null;
  let r=null;try{r=await fichaArte(P,f,a)}catch(e){}UMA.set(c,r);return r}
// para a busca e o gerador: ficha de um caminho (se ja analisado)
export async function fichaDe(c){const m=/^res:\/\/packs\/([^/]+)\/(.+)$/.exec(c);if(!m)return null;const P=BIB.pacotesCompletos().find(p=>p.id===m[1]);if(!P)return null;const fx=await fichasDe(P);if(!fx)return null;const i=P.artes.findIndex(a=>a[0]===m[2]);return i<0?null:fx.fichas[i]}
export {familias,camada,frente,forma};
if(typeof window!=="undefined")window.AtlasCatalogo={analisar,situacao,arquivoIA,arquivoIA2,arquivoCompleto,fichaDe,tokens};
