// Atlas - Artes do PC: le os pacotes .dungeondraft_pack direto da pasta do usuario, sem copiar nem enviar nada.
// Um pacote e um arquivo PCK do Godot: cabecalho, tabela (caminho, posicao, tamanho) e os arquivos em seguida.
// Guardamos so a tabela (no IndexedDB); cada imagem e lida na hora, cortando o pedaco do arquivo.
const TXT=new TextDecoder();
// md5 curto (RFC 1321), so para nomes de arquivo
export function md5(s){const b=new TextEncoder().encode(s),n=((b.length+8>>6)+1)*16,w=new Int32Array(n);for(let i=0;i<b.length;i++)w[i>>2]|=b[i]<<(i%4*8);w[b.length>>2]|=0x80<<(b.length%4*8);w[n-2]=b.length*8;
  const K=[],S=[7,12,17,22,5,9,14,20,4,11,16,23,6,10,15,21];for(let i=0;i<64;i++)K[i]=Math.floor(Math.abs(Math.sin(i+1))*4294967296)|0;let a=0x67452301,bb=0xefcdab89|0,c=0x98badcfe|0,d=0x10325476;
  for(let o=0;o<n;o+=16){let A=a,B=bb,C=c,D=d;for(let i=0;i<64;i++){let f,g;if(i<16){f=(B&C)|(~B&D);g=i}else if(i<32){f=(D&B)|(~D&C);g=(5*i+1)%16}else if(i<48){f=B^C^D;g=(3*i+5)%16}else{f=C^(B|~D);g=7*i%16}
    const t=D;D=C;C=B;const x=(A+f+K[i]+w[o+g])|0,r=S[(i>>4)*4+i%4];B=(B+((x<<r)|(x>>>(32-r))))|0;A=t}a=(a+A)|0;bb=(bb+B)|0;c=(c+C)|0;d=(d+D)|0}
  return [a,bb,c,d].map(v=>[0,8,16,24].map(s=>((v>>>s)&255).toString(16).padStart(2,"0")).join("")).join("")}
const u32=(dv,o)=>dv.getUint32(o,true),u64=(dv,o)=>dv.getUint32(o,true)+dv.getUint32(o+4,true)*4294967296;
const fatia=async(blob,ini,fim)=>new DataView(await blob.slice(ini,fim).arrayBuffer());

// ---------- leitura de um pacote ----------
export async function lerTabela(blob){let dv=await fatia(blob,0,Math.min(blob.size,1<<22));if(dv.byteLength<92||TXT.decode(new Uint8Array(dv.buffer,0,4))!=="GDPC")throw new Error("Não é um pacote do Dungeondraft.");
  const fmt=u32(dv,4);let p=20,base=0;if(fmt>=2){const flags=u32(dv,20);base=u64(dv,24);p=32;if(flags&1)throw new Error("Pacote cifrado.")}p+=64;const n=u32(dv,p);p+=4;if(n>5000000)throw new Error("Tabela estranha.");
  let ini=0;const E=[];const garante=async k=>{if(p+k<=dv.byteLength)return;ini+=p;dv=await fatia(blob,ini,Math.min(blob.size,ini+Math.max(1<<22,k*2)));p=0;if(dv.byteLength<k)throw new Error("Pacote cortado.")};
  for(let i=0;i<n;i++){await garante(4);const L=u32(dv,p);p+=4;await garante(L+32+(fmt>=2?4:0));let s=new Uint8Array(dv.buffer,dv.byteOffset+p,L);let z=s.indexOf(0);if(z>=0)s=s.subarray(0,z);const nome=TXT.decode(s);p+=L;
    const off=u64(dv,p)+base,tam=u64(dv,p+8);p+=32;if(fmt>=2)p+=4;E.push([nome,off,tam])}
  return E}
const leTexto=async(blob,e)=>TXT.decode(await blob.slice(e[1],e[1]+e[2]).arrayBuffer());
// le a tabela, o pack.json (nome, autor, permissao) e as etiquetas
export async function indexarPacote(blob,arquivo){const E=await lerTabela(blob);let J={};const pj=E.find(e=>/^res:\/\/packs\/[^/]+\/pack\.json$/.test(e[0]))||E.find(e=>/^res:\/\/packs\/[^/]+\.json$/.test(e[0]));
  if(pj)try{J=JSON.parse(await leTexto(blob,pj))}catch(e){}
  const id=J.id||(pj?pj[0].split("/")[3].replace(/\.json$/,""):arquivo),raiz="res://packs/"+id+"/",etq={},todas={},tags=[],conjuntos={};
  for(const t of E.filter(e=>e[0].endsWith(".dungeondraft_tags")&&e[2]>2)){try{const T=JSON.parse(await leTexto(blob,t));for(const [k,L] of Object.entries(T.tags||{})){let ti=tags.indexOf(k);if(ti<0){ti=tags.length;tags.push(k)}for(const c of L){if(!etq[c])etq[c]=k;(todas[c]||(todas[c]=[])).push(ti)}}Object.assign(conjuntos,T.sets||{})}catch(e){}}
  const mini={};for(const [c,o,s] of E){const m=/\/thumbnails\/([0-9a-f]{32})\.(png|webp|jpe?g)$/.exec(c);if(m)mini[m[1]]=[o,s]}
  const vistos=new Set(),artes=[];
  for(const [c,o,s] of E){if(!c.startsWith(raiz+"textures/")||!/\.(png|webp|jpe?g)$/i.test(c))continue;const rel=c.slice(raiz.length);if(vistos.has(c))continue;vistos.add(c);artes.push([rel,o,s,etq[rel]||"",todas[rel]||[]])}
  // prefixo comum dos nomes dos objetos (ex.: "PP_Battle_Cyberpunk_Ext01_"), tirado na hora de mostrar
  const bases=artes.filter(a=>a[0].startsWith("textures/objects/")).map(a=>a[0].split("/").pop());let pref="";if(bases.length>1){let p=bases[0];for(const b of bases)while(p&&!b.startsWith(p))p=p.slice(0,-1);const k=p.lastIndexOf("_");pref=k>0?p.slice(0,k+1):""}
  return {v:3,tags,conjuntos,mini,cor:J.custom_color_overrides||null,arquivo,tam:blob.size,mod:blob.lastModified||0,id,pref,nome:J.name||arquivo.replace(/\.dungeondraft_pack$/i,""),autor:J.author||"",versao:J.version||"",
    permitido:J.allow_3rd_party_mapping_software_to_read!==false,artes}}
// categoria pela pasta: objects, terrain, patterns, paths, walls, lights, portals...
export const categoria=rel=>{const m=/^textures\/([^/]+)/.exec(rel);return m?m[1]:"outros"};
export const nomeBonito=(rel,pref)=>{let n=rel.split("/").pop();if(pref&&n.startsWith(pref)&&n.length>pref.length+4)n=n.slice(pref.length);return n.replace(/\.(png|webp|jpe?g)$/i,"").replace(/^(PP_Battle_|PP_|TCM_|FA_)/,"").replace(/_\d+x\d+$/,"").replace(/[_]+/g," ").trim()};
export const grupoBonito=t=>(t||"").replace(/^(PP_|TCM_|FA_)/,"").replace(/_/g," ").trim();
// largura e altura lendo so o comeco da imagem (webp ou png)
export async function medidas(blob,off){const dv=await fatia(blob,off,off+40),b=i=>dv.getUint8(i),tag=String.fromCharCode(b(12),b(13),b(14),b(15));
  if(b(0)===0x89&&b(1)===0x50)return [dv.getUint32(16),dv.getUint32(20)];
  if(tag==="VP8X")return [1+(b(24)|b(25)<<8|b(26)<<16),1+(b(27)|b(28)<<8|b(29)<<16)];
  if(tag==="VP8L"){const v=dv.getUint32(21,true);return [1+(v&0x3FFF),1+((v>>>14)&0x3FFF)]}
  if(tag==="VP8 ")return [dv.getUint16(26,true)&0x3FFF,dv.getUint16(28,true)&0x3FFF];return null}

// ---------- a biblioteca (no navegador) ----------
const DB="atlas-artes",IDX=3;let pdb=null;
const db=()=>pdb||(pdb=new Promise((ok,er)=>{const r=indexedDB.open(DB,1);r.onupgradeneeded=()=>{const d=r.result;d.createObjectStore("cfg");d.createObjectStore("pacotes")};r.onsuccess=()=>ok(r.result);r.onerror=()=>er(r.error)}));
const tx=async(st,modo,fn)=>{const d=await db();return new Promise((ok,er)=>{const t=d.transaction(st,modo),s=t.objectStore(st);let v;const q=fn(s);if(q)q.onsuccess=()=>{v=q.result};t.oncomplete=()=>ok(v);t.onerror=()=>er(t.error)})};
const pegaCfg=k=>tx("cfg","readonly",s=>s.get(k)),poeCfg=(k,v)=>tx("cfg","readwrite",s=>{s.put(v,k)});
const ESTADO={pasta:null,nome:"",arquivos:new Map(),pacotes:new Map(),caminho:new Map(),precisa:false,problemas:[],lendo:false};
const ouvintes=new Set();const avisa=()=>{for(const f of ouvintes)try{f(estado())}catch(e){}};
export const ouvir=f=>{ouvintes.add(f);return ()=>ouvintes.delete(f)};
export const suportaPasta=()=>typeof window!=="undefined"&&"showDirectoryPicker" in window;
export function estado(){let artes=0,bloq=0;for(const P of ESTADO.pacotes.values()){if(P.permitido)artes+=P.artes.length;else bloq++}
  return {conectada:ESTADO.pacotes.size>0,nome:ESTADO.nome,pacotes:ESTADO.pacotes.size,artes,bloqueados:bloq,precisaPermissao:ESTADO.precisa,lendo:ESTADO.lendo,problemas:ESTADO.problemas.slice(),soNestaSessao:!ESTADO.pasta&&ESTADO.pacotes.size>0}}
async function* varre(dir,pre){for await (const [n,h] of dir.entries()){if(h.kind==="directory"){if(!/^\./.test(n))yield* varre(h,pre+n+"/")}else if(/\.dungeondraft_pack$/i.test(n))yield [pre+n,h]}}
// monta o indice: reaproveita o que ja foi lido se o arquivo nao mudou
async function montar(lista,progresso,acrescenta){ESTADO.lendo=true;if(!acrescenta)ESTADO.problemas=[];avisa();const antigos=new Map();try{for(const P of (await tx("pacotes","readonly",s=>s.getAll()))||[])antigos.set(P.arquivo,P)}catch(e){}
  if(!acrescenta){ESTADO.arquivos.clear();ESTADO.pacotes.clear();ESTADO.caminho.clear()}let i=0;
  for(const [rel,pega] of lista){i++;let f;try{f=await pega()}catch(e){ESTADO.problemas.push([rel,"não deu para abrir (se está no OneDrive, deixe “sempre neste dispositivo”)"]);continue}
    ESTADO.arquivos.set(rel,f);let P=antigos.get(rel);if(!P||P.v!==IDX||P.tam!==f.size||P.mod!==(f.lastModified||0)){try{P=await indexarPacote(f,rel);await tx("pacotes","readwrite",s=>{s.put(P,rel)})}catch(e){ESTADO.problemas.push([rel,e&&e.name==="NotReadableError"?"não deu para ler (se está no OneDrive, deixe “sempre neste dispositivo”)":(e.message||"erro ao ler")]);continue}}
    if(ESTADO.pacotes.has(P.id)){ESTADO.problemas.push([rel,"é cópia de “"+ESTADO.pacotes.get(P.id).arquivo+"”"]);continue}
    ESTADO.pacotes.set(P.id,P);if(P.permitido)for(const a of P.artes)ESTADO.caminho.set("res://packs/"+P.id+"/"+a[0],[P,a]);if(progresso)progresso(i,lista.length,P.nome)}
  ESTADO.lendo=false;avisa();return estado()}
export async function conectarPasta(progresso){const dir=await window.showDirectoryPicker({id:"atlas-artes",mode:"read"});ESTADO.pasta=dir;ESTADO.nome=dir.name;ESTADO.precisa=false;try{await poeCfg("pasta",dir)}catch(e){}
  const L=[];for await (const [rel,h] of varre(dir,""))L.push([rel,()=>h.getFile()]);L.sort((a,b)=>a[0].localeCompare(b[0]));return montar(L,progresso)}
// sem escolher pasta (Firefox, Safari, celular): os arquivos escolhidos valem so enquanto a pagina estiver aberta
export async function conectarArquivos(files,progresso){ESTADO.pasta=null;const L=[...files].filter(f=>/\.dungeondraft_pack$/i.test(f.name)).map(f=>[f.webkitRelativePath||f.name,async()=>f]);ESTADO.nome=L.length?(L[0][0].includes("/")?L[0][0].split("/")[0]:L.length+" pacotes"):"";return montar(L,progresso)}
// acrescenta pacotes (soltos ou de outra pasta) aos que ja estao abertos
export async function acrescentarArquivos(files,progresso){const L=[...files].filter(f=>/\.dungeondraft_pack$/i.test(f.name)).map(f=>[f.webkitRelativePath||f.name,async()=>f]);if(!L.length)return estado();const antes=ESTADO.pacotes.size;const r=await montar(L,progresso,true);if(ESTADO.nome&&ESTADO.pacotes.size>antes&&!/\+/.test(ESTADO.nome))ESTADO.nome+=" + outros";else if(!ESTADO.nome)ESTADO.nome=L.length+" pacotes";return estado()}
// tira um pacote da lista (so nesta sessao; o arquivo nao e mexido)
export function removerPacote(id){const P=ESTADO.pacotes.get(id);if(!P)return;for(const a of P.artes)ESTADO.caminho.delete("res://packs/"+id+"/"+a[0]);ESTADO.pacotes.delete(id);ESTADO.arquivos.delete(P.arquivo);avisa()}
// ao abrir o app: a pasta guardada so volta com permissao; se o navegador pedir, precisa de um clique (reautorizar)
export async function restaurar(){let dir=null;try{dir=await pegaCfg("pasta")}catch(e){}if(!dir||!dir.queryPermission)return estado();ESTADO.nome=dir.name;
  const p=await dir.queryPermission({mode:"read"});if(p==="granted"){ESTADO.pasta=dir;const L=[];for await (const [rel,h] of varre(dir,""))L.push([rel,()=>h.getFile()]);L.sort((a,b)=>a[0].localeCompare(b[0]));return montar(L)}
  ESTADO.precisa=true;ESTADO._dir=dir;avisa();return estado()}
export async function reautorizar(progresso){const dir=ESTADO._dir;if(!dir)return estado();if((await dir.requestPermission({mode:"read"}))!=="granted")return estado();ESTADO.pasta=dir;ESTADO.precisa=false;const L=[];for await (const [rel,h] of varre(dir,""))L.push([rel,()=>h.getFile()]);L.sort((a,b)=>a[0].localeCompare(b[0]));return montar(L,progresso)}
export async function desconectar(){ESTADO.pasta=null;ESTADO._dir=null;ESTADO.precisa=false;ESTADO.nome="";ESTADO.arquivos.clear();ESTADO.pacotes.clear();ESTADO.caminho.clear();try{await poeCfg("pasta",null);await tx("pacotes","readwrite",s=>{s.clear()})}catch(e){}avisa()}
export const tem=c=>ESTADO.caminho.has(c);
// etiquetas mais usadas (de um pacote ou de todos), so de uma categoria
export function etiquetas(pacote,cat){const N=new Map();for(const P of ESTADO.pacotes.values()){if(!P.permitido||(pacote&&P.id!==pacote))continue;for(const a of P.artes){if(cat&&categoria(a[0])!==cat)continue;for(const t of a[4]||[]){const k=P.tags[t];if(!/colorable/i.test(k))N.set(k,(N.get(k)||0)+1)}}}return [...N].sort((a,b)=>b[1]-a[1])}
export const pacotesCompletos=()=>[...ESTADO.pacotes.values()].filter(P=>P.permitido);
export const arquivoDe=P=>ESTADO.arquivos.get(P.arquivo);
export const pacotes=()=>[...ESTADO.pacotes.values()].map(P=>({id:P.id,nome:P.nome,autor:P.autor,artes:P.artes.length,permitido:P.permitido,arquivo:P.arquivo}));
// busca nas artes: q (texto), cat (objects, terrain, patterns...), pacote (id); devolve {caminho, nome, grupo, cat, pacote}
const semAc=s=>(s||"").normalize("NFD").replace(/[̀-ͯ]/g,"").toLowerCase();
export function buscar(o){o=o||{};const q=semAc(o.q).split(/\s+/).filter(Boolean),R=[],lim=o.todos?Infinity:(o.limite||300);let total=0;
  for(const P of ESTADO.pacotes.values()){if(!P.permitido||(o.pacote&&P.id!==o.pacote))continue;const ti=o.tag?(P.tags||[]).indexOf(o.tag):-2;if(o.tag&&ti<0)continue;for(const a of P.artes){const cat=categoria(a[0]);if(o.cats&&!o.cats.includes(cat))continue;if(o.cat&&cat!==o.cat)continue;
    if(ti>=0&&!(a[4]||[]).includes(ti))continue;if(o.lista&&!o.lista.has("res://packs/"+P.id+"/"+a[0]))continue;if(o.filtro&&!o.filtro("res://packs/"+P.id+"/"+a[0],a))continue;
    if(q.length){const t=semAc(a[0]+" "+a[3]);if(!q.every(w=>t.includes(w)))continue}total++;if(R.length<lim)R.push(o.todos?[P,a,cat]:{caminho:"res://packs/"+P.id+"/"+a[0],nome:nomeBonito(a[0],P.pref),grupo:grupoBonito(a[3]),cat,pacote:P.nome})}}
  return {itens:R,total,item:o.todos?r=>({caminho:"res://packs/"+r[0].id+"/"+r[1][0],nome:nomeBonito(r[1][0],r[0].pref),grupo:grupoBonito(r[1][3]),cat:r[2],pacote:r[0].nome}):x=>x}}
export const info=c=>{const z=ESTADO.caminho.get(c);return z?{nome:nomeBonito(z[1][0],z[0].pref),grupo:grupoBonito(z[1][3]),tags:(z[1][4]||[]).map(i=>z[0].tags[i]),cat:categoria(z[1][0]),pacote:z[0].nome,autor:z[0].autor}:null};
const blobDe=c=>{const z=ESTADO.caminho.get(c);if(!z)return null;const f=ESTADO.arquivos.get(z[0].arquivo);if(!f)return null;const a=z[1],tipo=/\.png$/i.test(a[0])?"image/png":/\.jpe?g$/i.test(a[0])?"image/jpeg":"image/webp";return f.slice(a[1],a[1]+a[2],tipo)};
const DIM=new Map();
export async function dims(c){if(DIM.has(c))return DIM.get(c);const z=ESTADO.caminho.get(c);if(!z)return null;const f=ESTADO.arquivos.get(z[0].arquivo);let d=null;try{d=await medidas(f,z[1][1])}catch(e){}if(!d){try{const b=await createImageBitmap(blobDe(c));d=[b.width,b.height];b.close()}catch(e){}}DIM.set(c,d);return d}
// imagens: a original (para o mapa) e a miniatura (para as listas), com memoria limitada
const BMP=new Map(),MINI=new Map(),LIM_BMP=400,LIM_MINI=1500;
const guarda=(M,k,v,lim)=>{M.set(k,v);if(M.size>lim){const k0=M.keys().next().value,v0=M.get(k0);M.delete(k0);Promise.resolve(v0).then(x=>{if(x&&x.close)x.close();else if(typeof x==="string")URL.revokeObjectURL(x)}).catch(()=>{})}};
// imagem crua (sem pre-multiplicar o alfa), ja no tamanho pedido: texturas de chao, cujo alfa e altura e nao transparencia
export function imagemCrua(c,w,h){const b=blobDe(c);if(!b)return Promise.resolve(null);return createImageBitmap(b,{premultiplyAlpha:"none",colorSpaceConversion:"none",resizeWidth:w,resizeHeight:h,resizeQuality:"high"}).catch(()=>createImageBitmap(b).catch(()=>null))}
export function imagem(c){if(BMP.has(c)){const v=BMP.get(c);BMP.delete(c);BMP.set(c,v);return v}const b=blobDe(c);if(!b)return Promise.resolve(null);const p=createImageBitmap(b).catch(()=>null);guarda(BMP,c,p,LIM_BMP);return p}
export const blobMini=c=>{const z=ESTADO.caminho.get(c);if(!z||!z[0].mini)return null;const m=z[0].mini[md5(c)];if(!m)return null;const f=ESTADO.arquivos.get(z[0].arquivo);return f?f.slice(m[0],m[0]+m[1],"image/png"):null};
export function miniatura(c,tam){tam=tam||96;const k=c+"|"+tam;if(MINI.has(k))return MINI.get(k);if(tam<=64){const bm=blobMini(c);if(bm){const p=Promise.resolve(URL.createObjectURL(bm));guarda(MINI,k,p,LIM_MINI);return p}}const b=blobDe(c);if(!b)return Promise.resolve(null);
  const p=createImageBitmap(b).then(async bm=>{const s=Math.min(1,tam/Math.max(bm.width,bm.height)),cv=document.createElement("canvas");cv.width=Math.max(1,Math.round(bm.width*s));cv.height=Math.max(1,Math.round(bm.height*s));cv.getContext("2d").drawImage(bm,0,0,cv.width,cv.height);bm.close();
    const bl=await new Promise(ok=>cv.toBlob(ok,"image/webp",.85));return bl?URL.createObjectURL(bl):null}).catch(()=>null);guarda(MINI,k,p,LIM_MINI);return p}
// so artes que funcionam como objeto ou como textura de chao (paredes e caminhos ficam com a arte do Atlas)
export const usavel=c=>/\/textures\/(objects|terrain|patterns|textures|materials?|walls|paths|portals|tilesets|lights)\//.test(c);
export const ehMaterial=c=>/\/textures\/(terrain|patterns|textures|materials?|tilesets)\//.test(c);
if(typeof window!=="undefined")window.AtlasArtes={estado,ouvir,suportaPasta,conectarPasta,conectarArquivos,restaurar,reautorizar,desconectar,buscar,info,dims,imagem,imagemCrua,miniatura,tem,pacotes,usavel,ehMaterial,acrescentarArquivos,removerPacote};
