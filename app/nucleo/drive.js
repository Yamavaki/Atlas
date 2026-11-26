// Atlas - Google Drive como cópia do mundo: "Enviar" manda o que mudou, "Atualizar" traz o que mudou lá
// (inclusive o que o Claude escreveu pelo conector do Drive). Nada muda sozinho.
// Formato na pasta do Drive igual ao da pasta do mundo: notas .md, quadros .canvas, mapas .atlasmapa.json,
// mapas de batalha Mapas/Batalha/<id>.atlasmap, imagens Imagens/<id>.webp e .atlas/indice.json.
// As artes dos pacotes (.dungeondraft_pack) nunca são enviadas.
(function(){
  "use strict";
  const ESCOPO="https://www.googleapis.com/auth/drive",API="https://www.googleapis.com/drive/v3",UP="https://www.googleapis.com/upload/drive/v3",PASTA_MIME="application/vnd.google-apps.folder";
  const K_CFG="atlas:drive:cfg",K_TOK="atlas:drive:tok",K_BASE="atlas:drive:base",K_EST="atlas:drive:estado",IDX=".atlas/drive.json",IDXV=".atlas/indice.json",BACKUPS="Backups";
  const tauri=()=>window.__TAURI__&&window.__TAURI__.core?window.__TAURI__:null;
  const ls=(k,v)=>{try{if(v===undefined)return JSON.parse(localStorage.getItem(k)||"null");if(v===null)localStorage.removeItem(k);else localStorage.setItem(k,JSON.stringify(v))}catch(e){return null}};
  // cada mundo (pasta) tem a sua pasta no Drive e o seu estado; a conta e o ID do Google Cloud valem para todos
  const mk=()=>{const AP=window.AtlasPasta,a=AP&&AP.atual&&AP.atual(),A=window.AtlasApp;return a&&A&&A.Store&&A.Store.pasta?"pasta:"+a.chave:"app"},kM=k=>k+"@"+mk();
  function migra(g){if(!g.pasta)return null;const w={pasta:g.pasta,batalhas:g.batalhas,imagens:g.imagens,backup:g.backup};ls(kM(K_CFG),w);const b=ls(K_BASE),e=ls(K_EST);if(b)ls(kM(K_BASE),b);if(e)ls(kM(K_EST),e);
    const g2=Object.assign({},g);delete g2.pasta;delete g2.batalhas;delete g2.imagens;delete g2.backup;ls(K_CFG,g2);try{localStorage.removeItem(K_BASE);localStorage.removeItem(K_EST)}catch(x){}return w}
  const cfg=()=>{const g=ls(K_CFG)||{},w=ls(kM(K_CFG))||migra(g)||{};return Object.assign({clientId:"",clientSecret:"",pasta:null,batalhas:true,imagens:true,backup:false,conta:null},w,{clientId:g.clientId||"",clientSecret:g.clientSecret||"",conta:g.conta||null})};
  const salvaCfg=c=>{const g=ls(K_CFG)||{};ls(K_CFG,Object.assign(g,{clientId:c.clientId,clientSecret:c.clientSecret,conta:c.conta}));ls(kM(K_CFG),{pasta:c.pasta,auto:c.auto,batalhas:c.batalhas,imagens:c.imagens,backup:c.backup})};
  const estado=()=>Object.assign({ultima:null,acao:null,sujo:false},ls(kM(K_EST))||{});
  const salvaEstado=e=>{ls(kM(K_EST),e);atualizaBotao()};
  const safe=s=>String(s||"Sem título").replace(/[\\/:*?"<>|#^[\]]+/g,"-").replace(/\s+/g," ").trim().slice(0,120)||"Sem título";
  const junta=(...p)=>p.filter(Boolean).join("/").replace(/\/+/g,"/");
  const uidN=()=>"n"+Date.now().toString(36)+Math.random().toString(36).slice(2,7);
  const app=()=>window.AtlasApp||{};
  const enc=new TextEncoder();

  // ---------- MD5 (o Drive informa o md5 de cada arquivo; assim se sabe o que mudou sem baixar) ----------
  function md5(u8){const K=new Int32Array(64),S=[7,12,17,22,7,12,17,22,7,12,17,22,7,12,17,22,5,9,14,20,5,9,14,20,5,9,14,20,5,9,14,20,4,11,16,23,4,11,16,23,4,11,16,23,4,11,16,23,6,10,15,21,6,10,15,21,6,10,15,21,6,10,15,21];
    for(let i=0;i<64;i++)K[i]=Math.floor(Math.abs(Math.sin(i+1))*4294967296)|0;
    const n=u8.length,tot=((n+8)>>>6)+1,W=new Int32Array(tot*16);for(let i=0;i<n;i++)W[i>>2]|=u8[i]<<((i%4)*8);W[n>>2]|=0x80<<((n%4)*8);W[tot*16-2]=(n*8)|0;W[tot*16-1]=Math.floor(n/536870912)|0;
    let a0=0x67452301,b0=0xefcdab89|0,c0=0x98badcfe|0,d0=0x10325476;
    for(let o=0;o<W.length;o+=16){let A=a0,B=b0,C=c0,D=d0;for(let i=0;i<64;i++){let F,g;if(i<16){F=(B&C)|(~B&D);g=i}else if(i<32){F=(D&B)|(~D&C);g=(5*i+1)%16}else if(i<48){F=B^C^D;g=(3*i+5)%16}else{F=C^(B|~D);g=(7*i)%16}
        const t=D;D=C;C=B;const x=(A+F+K[i]+W[o+g])|0;B=(B+((x<<S[i])|(x>>>(32-S[i]))))|0;A=t}a0=(a0+A)|0;b0=(b0+B)|0;c0=(c0+C)|0;d0=(d0+D)|0}
    let h="";for(const v of[a0,b0,c0,d0])for(let i=0;i<4;i++)h+=((v>>>(i*8))&255).toString(16).padStart(2,"0");return h}
  const bytes=async d=>typeof d==="string"?enc.encode(d):new Uint8Array(await d.arrayBuffer());

  // ---------- onde a conexão funciona ----------
  const ambiente=()=>{if(tauri())return "app";let topo=true;try{topo=window.self===window.top}catch(e){topo=false}return topo&&/^https?:$/.test(location.protocol)&&!/claudeusercontent|claude\.ai/.test(location.host)?"site":"bloqueado"};

  // ---------- login ----------
  let tokMem=null,gisCli=null;
  // 1.51.3: no celular o login usa um cliente do tipo Android (sem chave secreta), que volta para o app pelo esquema com.yamavaki.atlas
  const ANDROID=/Android/.test(navigator.userAgent);
  const b64url=u8=>btoa(String.fromCharCode(...u8)).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,"");
  const aleatorio=n=>{const u=new Uint8Array(n);crypto.getRandomValues(u);return b64url(u)};
  async function tokenDoApp(campos){campos=campos.filter(c=>!(c[0]==="client_secret"&&!c[1]));const t=tauri(),r=await t.core.invoke("google_token",{campos});let j={};try{j=JSON.parse(r)}catch(e){throw new Error("O Google respondeu de um jeito inesperado.")}
    if(j.error)throw new Error(j.error==="invalid_grant"?"A autorização expirou ou foi revogada. Conecte a conta de novo.":j.error==="invalid_client"?"O ID ou a chave do cliente não conferem com o projeto do Google Cloud.":"O Google recusou o login ("+(j.error_description||j.error)+").");return j}
  async function entrarApp(c){if(!c.clientId||!ANDROID&&!c.clientSecret)throw new Error(ANDROID?"Informe o ID do cliente Android do Google Cloud.":"Informe o ID e a chave do cliente do Google Cloud.");
    const ver=aleatorio(48),dig=new Uint8Array(await crypto.subtle.digest("SHA-256",enc.encode(ver))),est=aleatorio(16);
    const base="https://accounts.google.com/o/oauth2/v2/auth?"+new URLSearchParams({client_id:c.clientId,response_type:"code",scope:ESCOPO,code_challenge:b64url(dig),code_challenge_method:"S256",access_type:"offline",prompt:"consent",state:est}).toString();
    const [codigo,estVolta,redirect]=await tauri().core.invoke(ANDROID?"google_entrar_android":"google_entrar",{base});if(estVolta!==est)throw new Error("A resposta do login não confere. Tente de novo.");
    const j=await tokenDoApp([["code",codigo],["client_id",c.clientId],["client_secret",ANDROID?"":c.clientSecret],["redirect_uri",redirect],["grant_type","authorization_code"],["code_verifier",ver]]);
    if(!j.refresh_token)throw new Error("O Google não devolveu a autorização permanente. Remova o acesso do Atlas em myaccount.google.com/permissions e conecte de novo.");
    tokMem={acc:j.access_token,exp:Date.now()+(j.expires_in-60)*1000};ls(K_TOK,{ref:j.refresh_token})}
  const carregaGis=()=>new Promise((ok,er)=>{if(window.google&&google.accounts&&google.accounts.oauth2)return ok();const s=document.createElement("script");s.src="https://accounts.google.com/gsi/client";s.onload=()=>ok();s.onerror=()=>er(new Error("Não foi possível carregar o login do Google."));document.head.append(s)});
  async function tokenSite(c,interativo){await carregaGis();return new Promise((ok,er)=>{gisCli=google.accounts.oauth2.initTokenClient({client_id:c.clientId,scope:ESCOPO,callback:r=>{if(r.error)return er(new Error(r.error==="access_denied"?"O acesso ao Drive não foi autorizado.":"O Google recusou o login ("+r.error+")."));tokMem={acc:r.access_token,exp:Date.now()+(r.expires_in-60)*1000};ok(tokMem.acc)},error_callback:e=>er(new Error(e&&e.type==="popup_closed"?"A janela de login foi fechada.":"Não foi possível abrir a janela de login do Google."))});gisCli.requestAccessToken({prompt:interativo?"consent":""})})}
  async function token(interativo){if(tokMem&&tokMem.exp>Date.now())return tokMem.acc;const c=cfg();
    if(ambiente()==="app"){const t=ls(K_TOK);if(!t||!t.ref)throw new Error("Conta Google não conectada.");const j=await tokenDoApp([["refresh_token",t.ref],["client_id",c.clientId],["client_secret",ANDROID?"":c.clientSecret],["grant_type","refresh_token"]]);tokMem={acc:j.access_token,exp:Date.now()+(j.expires_in-60)*1000};return tokMem.acc}
    if(ambiente()==="site"){if(!c.clientId)throw new Error("Informe o ID do cliente do Google Cloud.");return tokenSite(c,!!interativo)}
    throw new Error("A sincronização com o Google Drive funciona no app do Atlas para Windows.")}

  // ---------- chamadas ao Drive ----------
  async function req(url,op,tent){op=op||{};const acc=await token();const r=await fetch(url,Object.assign({},op,{headers:Object.assign({Authorization:"Bearer "+acc},op.headers||{})}));
    if(r.status===401&&!tent){tokMem=null;return req(url,op,1)}
    if(r.status===429||r.status>=500&&!tent){await new Promise(ok=>setTimeout(ok,1500));return req(url,op,1)}
    if(!r.ok){let m="";try{const j=await r.json();m=(j.error&&(j.error.message||j.error.status))||""}catch(e){}
      throw new Error(r.status===403?"O Drive recusou o acesso"+(m?": "+m:".")+" Confira se a Google Drive API está ativada no projeto.":r.status===404?"Arquivo ou pasta não encontrado no Drive.":"O Drive respondeu "+r.status+(m?": "+m:"."))}
    return r}
  const json=async(url,op)=>(await req(url,op)).json();
  const q=s=>encodeURIComponent(s);
  async function listaFilhos(id){const out=[];let pt="";do{const j=await json(API+"/files?q="+q("'"+id+"' in parents and trashed=false")+"&fields="+q("nextPageToken,files(id,name,mimeType,md5Checksum,modifiedTime,size)")+"&pageSize=1000"+(pt?"&pageToken="+q(pt):""));out.push(...j.files);pt=j.nextPageToken}while(pt);return out}
  // tudo dentro da pasta do mundo: caminho -> arquivo, e caminho da subpasta -> id
  async function listaRemota(raiz){const arqs=new Map(),pastas=new Map([["",raiz]]),docs=[];const anda=async(id,pre)=>{for(const f of await listaFilhos(id)){const p=pre?pre+"/"+f.name:f.name;
      if(f.mimeType===PASTA_MIME){if(f.name===BACKUPS&&!pre||f.name===".obsidian"||f.name===".trash")continue;pastas.set(p,f.id);await anda(f.id,p)}
      else if(/^application\/vnd\.google-apps\./.test(f.mimeType)){docs.push(p)}
      else if(!arqs.has(p))arqs.set(p,f)}};await anda(raiz,"");return {arqs,pastas,docs}}
  async function garantePasta(pastas,rel){if(pastas.has(rel))return pastas.get(rel);const L=rel.split("/"),nome=L.pop(),pai=await garantePasta(pastas,L.join("/"));
    const j=await json(API+"/files?fields=id",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({name:nome,mimeType:PASTA_MIME,parents:[pai]})});pastas.set(rel,j.id);return j.id}
  const mimeDe=p=>/\.md$/i.test(p)?"text/markdown":/\.webp$/i.test(p)?"image/webp":/\.(json|canvas|atlasmap)$/i.test(p)?"application/json":"application/octet-stream";
  async function sobe(pastas,rel,dados,id){const u8=await bytes(dados),tipo=mimeDe(rel);
    if(id){const j=await json(UP+"/files/"+id+"?uploadType=media&fields=id,md5Checksum",{method:"PATCH",headers:{"Content-Type":tipo},body:u8});return j}
    const L=rel.split("/"),nome=L.pop(),pai=await garantePasta(pastas,L.join("/")),bd="atlas"+aleatorio(12),meta=JSON.stringify({name:nome,parents:[pai],mimeType:tipo});
    const corpo=new Blob(["--"+bd+"\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n"+meta+"\r\n--"+bd+"\r\nContent-Type: "+tipo+"\r\n\r\n",u8,"\r\n--"+bd+"--"]);
    return json(UP+"/files?uploadType=multipart&fields=id,md5Checksum",{method:"POST",headers:{"Content-Type":"multipart/related; boundary="+bd},body:corpo})}
  const baixaTexto=async id=>(await req(API+"/files/"+id+"?alt=media")).text();
  const baixaBlob=async id=>(await req(API+"/files/"+id+"?alt=media")).blob();
  const lixeira=id=>req(API+"/files/"+id,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({trashed:true})});

  // ---------- o mundo deste lado, no mesmo formato da pasta ----------
  const B64=u8=>{let s="";for(let i=0;i<u8.length;i+=0x8000)s+=String.fromCharCode.apply(null,u8.subarray(i,i+0x8000));return btoa(s)};
  const deB64=s=>{const b=atob(s),u=new Uint8Array(b.length);for(let i=0;i<b.length;i++)u[i]=b.charCodeAt(i);return u};
  const extraNota=o=>{const e={};for(const k in o)if(k!=="content"&&k!=="canvas")e[k]=o[k];return e};
  async function montaLocal(c){const {S}=app(),L=new Map(),usados=new Set(),uniq=(p,suf)=>{let x=p,k=2;while(usados.has(x.toLowerCase()))x=p.replace(/(\.[a-z.]+)$/i," ("+(suf||k++)+")$1");usados.add(x.toLowerCase());return x};
    const ind={versao:1,app:"Atlas",notas:{},mapas:{}};
    const ns=[...S.notes.values()].sort((a,b)=>String(a.id).localeCompare(String(b.id)));
    for(const o of ns){const p=uniq(junta((o.folder||"").split("/").filter(Boolean).map(safe).join("/"),safe(o.title)+(o.kind==="canvas"?".canvas":".md")));
      const txt=o.kind==="canvas"?JSON.stringify(o.canvas||{nodes:[],edges:[]},null,1):(o.content||"");L.set(p,{tipo:"nota",ref:o,dados:txt});ind.notas[p]={id:o.id,extra:extraNota(o)}}
    for(const m of [...S.maps.values()].sort((a,b)=>String(a.id).localeCompare(String(b.id)))){const p=uniq("Mapas/"+safe(m.name||m.id)+".atlasmapa.json",m.id);L.set(p,{tipo:"mapa",ref:m,dados:JSON.stringify(m)});ind.mapas[p]=m.id}
    const AP=window.AtlasPasta,emPasta=!!(AP&&AP.atual&&AP.atual()&&app().Store&&app().Store.pasta);let daqui=null;if(emPasta&&AP.listaRel)daqui=new Set((await AP.listaRel(/^Mapas\/Batalha\/[^/]+\.atlasmap$/i)).map(r=>r.slice(14,-9)));
    if(c.batalhas&&window.AtlasBatalha&&AtlasBatalha.exportarTudo)for(const x of await AtlasBatalha.exportarTudo()){if(daqui&&!daqui.has(x.id))continue;const p="Mapas/Batalha/"+x.id+".atlasmap";L.set(p,{tipo:"batalha",ref:x,dados:JSON.stringify({id:x.id,nome:x.nome,mapa:x.mapa},(k,v)=>v instanceof Uint8Array?{$b64:B64(v)}:v)})}
    const usadas=emPasta?JSON.stringify([...S.notes.values()].map(n=>[n.canvas||"",n.content||""])):null;
    if(c.imagens&&window.AtlasQuadro&&AtlasQuadro.todasImgs)for(const [k,b] of await AtlasQuadro.todasImgs())if(!usadas||usadas.includes(k))L.set("Imagens/"+k+".webp",{tipo:"imagem",ref:k,dados:b});
    for(const [p,x] of L)x.md5=md5(await bytes(x.dados));return {L,ind}}

  // ---------- comparar os dois lados com o que estava igual na última vez ----------
  // base[caminho] = {r: md5 no Drive, l: md5 deste lado} no fim da última sincronização
  const conhecido=p=>/\.(md|canvas)$/i.test(p)||/^Mapas\/[^/]+\.atlasmapa\.json$/i.test(p)||/^Mapas\/Batalha\/[^/]+\.atlasmap$/i.test(p)||/^Imagens\/[^/]+\.webp$/i.test(p);
  const quer=(c,p)=>!p.startsWith(".atlas/")&&conhecido(p)&&(c.batalhas||!/\.atlasmap$/i.test(p))&&(c.imagens||!/^Imagens\//.test(p));
  function compara(c,L,R,base,modo){const itens=[],todos=new Set([...L.keys(),...[...R.keys()].filter(p=>quer(c,p)),...Object.keys(base).filter(p=>quer(c,p))]);
    for(const p of [...todos].sort()){const l=L.get(p),r=R.get(p),b=base[p];if(p===IDX)continue;
      const lm=l&&l.md5,rm=r&&r.md5Checksum;if(l&&r&&lm===rm){itens.push({p,acao:"igual",l,r});continue}
      const mudouAqui=l?!b||lm!==b.l:!!b,mudouLa=r?!b||rm!==b.r:!!b;
      if(modo==="enviar"){
        if(l){if(!r){if(b&&!mudouAqui){itens.push({p,acao:"igual",l})}else itens.push({p,acao:"novo",l})}
          else if(!mudouAqui)itens.push({p,acao:"igual",l,r});else if(mudouLa)itens.push({p,acao:"conflito",l,r,por:b?"Alterado aqui e no Drive desde a última sincronização":"Existe aqui e no Drive com conteúdos diferentes"});else itens.push({p,acao:"alterado",l,r})}
        else if(r&&b){if(mudouLa)itens.push({p,acao:"conflito",r,por:"Apagado aqui e alterado no Drive"});else itens.push({p,acao:"remover",r})}}
      else{
        if(r){if(!l){if(b&&!mudouLa)itens.push({p,acao:"igual",r});else itens.push({p,acao:"novo",r})}
          else if(!mudouLa)itens.push({p,acao:"igual",l,r});else if(mudouAqui)itens.push({p,acao:"conflito",l,r,por:b?"Alterado aqui e no Drive desde a última sincronização":"Existe aqui e no Drive com conteúdos diferentes"});else itens.push({p,acao:"alterado",l,r})}
        else if(l&&b){if(mudouAqui)itens.push({p,acao:"conflito",l,por:"Apagado no Drive e alterado aqui"});else itens.push({p,acao:"remover",l})}}}
    return itens}

  // ---------- aplicar o que veio do Drive ----------
  const deJSON=t=>JSON.parse(t,(k,v)=>v&&typeof v==="object"&&typeof v.$b64==="string"?deB64(v.$b64):v);
  async function aplicaRemoto(p,r,indR,locais,copia){const {S,Store}=app();
    if(/\.(md|canvas)$/i.test(p)){const txt=(await baixaTexto(r.id)).replace(/\r/g,""),ix=indR.notas&&indR.notas[p],partes=p.split("/"),arq=partes.pop(),base=arq.replace(/\.(md|canvas)$/i,""),pasta=partes.join("/");
      let o=copia?null:(ix&&S.notes.get(ix.id))||(locais.get(p)&&locais.get(p).ref);
      if(!o){o=Object.assign({},ix&&!copia?ix.extra:{},{id:ix&&!copia&&!S.notes.has(ix.id)?ix.id:uidN(),title:ix&&ix.extra&&safe(ix.extra.title)===base?ix.extra.title:base,folder:pasta});if(copia)o.title=o.title+" (Drive)"}
      if(/\.canvas$/i.test(p)){o.kind="canvas";try{const C=JSON.parse(txt||"{}");o.canvas={nodes:C.nodes||[],edges:C.edges||[]}}catch(e){o.canvas={nodes:[],edges:[]}}o.content=o.content||""}else o.content=txt;
      S.notes.set(o.id,o);Store.save("notes",o);return}
    if(/\.atlasmapa\.json$/i.test(p)){const m=JSON.parse(await baixaTexto(r.id));if(!m||!m.id)return;if(copia){m.id=uidN().replace(/^n/,"m");m.name=(m.name||"Mapa")+" (Drive)"}S.maps.set(m.id,m);Store.save("maps",m);return}
    if(/\.atlasmap$/i.test(p)){const x=deJSON(await baixaTexto(r.id));if(!x||!x.id||!x.mapa)return;if(copia){x.id=x.id+"-drive";x.nome=(x.nome||"Mapa")+" (Drive)"}if(window.AtlasBatalha)await AtlasBatalha.importarTudo([x]);return}
    if(/^Imagens\/(.+)\.webp$/i.test(p)){const k=p.slice(8,-5);if(window.AtlasQuadro&&AtlasQuadro.poeImg)await AtlasQuadro.poeImg(k,await baixaBlob(r.id))}}
  async function removeLocal(l){const {Store}=app();if(!l)return;if(l.tipo==="nota")Store.remove("notes",l.ref.id);else if(l.tipo==="mapa")Store.remove("maps",l.ref.id);else if(l.tipo==="batalha"&&window.AtlasBatalha)await AtlasBatalha.apagar(l.ref.id)}

  // ---------- as duas ações ----------
  async function prepara(modo){const c=cfg();if(!c.pasta)throw new Error("Escolha a pasta do mundo no Drive.");
    const [{L,ind},R]=await Promise.all([montaLocal(c),listaRemota(c.pasta.id)]);const bt=ls(kM(K_BASE))||{},base=bt.pasta===c.pasta.id?bt.arq||{}:{};
    return {c,L,ind,R,base,itens:compara(c,L,R.arqs,base,modo),docs:R.docs}}
  const fila=async(lista,n,fn,prog)=>{let i=0,f=0;const vai=async()=>{while(i<lista.length){const k=i++;await fn(lista[k]);f++;prog&&prog(f,lista.length,lista[k])}};await Promise.all(Array.from({length:Math.min(n,lista.length)},vai))};
  function fechaBase(P,feitos){const base=Object.assign({},P.base);for(const [p,x] of Object.entries(feitos)){if(x===null)delete base[p];else base[p]=x}ls(kM(K_BASE),{pasta:P.c.pasta.id,arq:base})}
  let quieto=false;
  // 1.55.1: o índice do Drive fica em .atlas/drive.json; o antigo (.atlas/indice.json) é o da pasta do PC (id → caminho) ou o nosso antigo (caminho → id)
  const indiceRemoto=async P=>{const ix=P.R.arqs.get(IDX);if(ix)try{return JSON.parse(await baixaTexto(ix.id))}catch(e){}const iv=P.R.arqs.get(IDXV);if(iv)try{const I=JSON.parse(await baixaTexto(iv.id)),N={},M={};for(const [k,x] of Object.entries(I.notas||{})){if(!x)continue;if(x.caminho)N[x.caminho]={id:k,extra:x.extra||{}};else if(x.id)N[k]=x}for(const [k,x] of Object.entries(I.mapas||{})){if(x&&x.caminho)M[x.caminho]=k;else if(typeof x==="string")M[k]=x}return {notas:N,mapas:M,por:I.por}}catch(e){}return {}};
  // conflito resolvido: "minha" manda a deste computador, "drive" traz a do Drive, "duas" guarda as duas
  async function resolve(P,x,esc,indR,feitos){
    if(esc==="minha"){if(!x.l){await lixeira(x.r.id);feitos[x.p]=null;return}const j=await sobe(P.R.pastas,x.p,x.l.dados,x.r&&x.r.id);feitos[x.p]={r:j.md5Checksum,l:x.l.md5};return}
    if(esc==="drive"){if(!x.r){await removeLocal(x.l);feitos[x.p]=null;return}await aplicaRemoto(x.p,x.r,indR,P.L,false);feitos[x.p]={r:x.r.md5Checksum,l:"novo"};return}
    if(esc==="duas"&&x.l&&x.r){await aplicaRemoto(x.p,x.r,indR,P.L,true);const j=await sobe(P.R.pastas,x.p,x.l.dados,x.r.id);feitos[x.p]={r:j.md5Checksum,l:x.l.md5}}}
  async function fechaNovos(P,feitos){if(Object.values(feitos).some(v=>v&&v.l==="novo")){const {L}=await montaLocal(P.c);for(const [p,v] of Object.entries(feitos))if(v&&v.l==="novo")v.l=L.get(p)?L.get(p).md5:"?"}}
  async function enviar(P,escolhas,prog,seguro){let tarde=0;const subidos=[];const R=P.R.arqs,feitos={},erros=[],indR=await indiceRemoto(P);const vai=P.itens.filter(x=>x.acao==="novo"||x.acao==="alterado"||x.acao==="remover"||x.acao==="conflito"&&escolhas[x.p]&&escolhas[x.p]!=="pular");
    for(const x of P.itens)if(x.acao==="igual"&&x.l&&x.r)feitos[x.p]={r:x.r.md5Checksum,l:x.l.md5};
    quieto=true;try{await fila(vai,4,async x=>{try{if(x.acao==="conflito")return await resolve(P,x,escolhas[x.p],indR,feitos);
        // automático: confere de novo logo antes de gravar; se mudou lá nesse meio tempo, vira conflito (não sobrescreve)
        if(seguro&&x.r){const at=await json(API+"/files/"+x.r.id+"?fields=md5Checksum,trashed");if(at.md5Checksum!==x.r.md5Checksum||at.trashed){tarde++;return}}
        if(x.acao==="remover"){await lixeira(x.r.id);feitos[x.p]=null;return}
        const j=await sobe(P.R.pastas,x.p,x.l.dados,x.r&&x.r.id);feitos[x.p]={r:j.md5Checksum,l:x.l.md5};subidos.push([x.p,j.id||(x.r&&x.r.id),j.md5Checksum])}catch(e){erros.push(x.p+": "+e.message)}},prog)}finally{quieto=false}
    await fechaNovos(P,feitos);
    // indice com ids e dados que o .md nao guarda
    try{const a=aparelho();P.ind.por={id:a.id,nome:a.nome,quando:new Date().toISOString()};const ix=P.R.arqs.get(IDX);await sobe(P.R.pastas,IDX,JSON.stringify(P.ind,null,1),ix&&ix.id)}catch(e){erros.push("índice: "+e.message)}
    try{const AP=window.AtlasPasta,m=AP&&AP.meta?await AP.meta():null;if(m){const f=P.R.arqs.get(".atlas/mundo.json"),t=JSON.stringify(m,null,1);if(!f||f.md5Checksum!==md5(enc.encode(t)))await sobe(P.R.pastas,".atlas/mundo.json",t,f&&f.id)}}catch(e){}
    if(P.c.backup)try{await copiaSeguranca(P)}catch(e){erros.push("cópia de segurança: "+e.message)}
    fechaBase(P,feitos);return {n:vai.length-tarde,erros,tarde,subidos}}
  async function atualizar(P,escolhas,prog,suave){const indR=await indiceRemoto(P);
    const feitos={},erros=[],vai=P.itens.filter(x=>x.acao==="novo"||x.acao==="alterado"||x.acao==="remover"||x.acao==="conflito"&&escolhas[x.p]&&escolhas[x.p]!=="pular");
    for(const x of P.itens)if(x.acao==="igual"&&x.l&&x.r)feitos[x.p]={r:x.r.md5Checksum,l:x.l.md5};
    quieto=true;try{await fila(vai,4,async x=>{try{if(x.acao==="conflito")return await resolve(P,x,escolhas[x.p],indR,feitos);
        if(x.acao==="remover"){await removeLocal(x.l);feitos[x.p]=null;return}
        await aplicaRemoto(x.p,x.r,indR,P.L,false);feitos[x.p]={r:x.r.md5Checksum,l:"novo"}}catch(e){erros.push(x.p+": "+e.message)}},prog)}finally{quieto=false}
    // o md5 deste lado de quem acabou de chegar (o texto pode ter mudado de \r\n para \n)
    await fechaNovos(P,feitos);
    fechaBase(P,feitos);if(!suave)app().drawAll&&app().drawAll();return {n:vai.length,erros}}
  async function copiaSeguranca(P){const juntar=app().juntaMundo;if(!juntar)return;const txt=await juntar(),d=new Date(),nome="Atlas "+d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0")+" "+String(d.getHours()).padStart(2,"0")+"h"+String(d.getMinutes()).padStart(2,"0")+".atlasmundo";
    let pid=null;for(const f of await listaFilhos(P.c.pasta.id))if(f.mimeType===PASTA_MIME&&f.name===BACKUPS)pid=f.id;if(!pid)pid=(await json(API+"/files?fields=id",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({name:BACKUPS,mimeType:PASTA_MIME,parents:[P.c.pasta.id]})})).id;
    const ps=new Map([["",pid]]);await sobe(ps,nome,txt,null);const L=(await listaFilhos(pid)).filter(f=>/\.atlasmundo$/.test(f.name)).sort((a,b)=>b.name.localeCompare(a.name));for(const f of L.slice(10))await lixeira(f.id).catch(()=>{})}

  // ---------- interface ----------
  const el=(t,a,...k)=>{const e=document.createElement(t);for(const n in a||{}){const v=a[n];if(v==null||v===false)continue;if(n.startsWith("on"))e.addEventListener(n.slice(2),v);else if(n==="class")e.className=v;else e.setAttribute(n,v===true?"":v)}for(const x of k.flat())if(x!=null&&x!==false)e.append(x.nodeType?x:document.createTextNode(String(x)));return e};
  const ic=(n,s)=>window.icone?window.icone(n,s||18):el("span");
  const quando=t=>{if(!t)return "nunca";const s=(Date.now()-new Date(t))/1000;if(s<60)return "agora há pouco";if(s<3600)return "há "+Math.round(s/60)+" min";if(s<86400)return "há "+Math.round(s/3600)+" h";return new Date(t).toLocaleDateString("pt-BR",{day:"2-digit",month:"short"})+" às "+new Date(t).toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit"})};
  const conectado=()=>{const c=cfg();return ambiente()==="app"?!!(ls(K_TOK)||{}).ref:!!c.conta};
  const nomeTipo=p=>/\.canvas$/i.test(p)?"Quadro":/\.md$/i.test(p)?"Nota":/\.atlasmapa\.json$/i.test(p)?"Mapa":/\.atlasmap$/i.test(p)?"Mapa de batalha":/\.webp$/i.test(p)?"Imagem":"Arquivo";
  const nomeArq=(p,x)=>{const l=x&&(x.l||x.r);if(l&&l.tipo==="batalha")return l.ref.nome||"Mapa de batalha";if(l&&l.tipo==="mapa")return l.ref.name||"Mapa";return p.split("/").pop().replace(/\.(md|canvas|atlasmapa\.json|atlasmap|webp)$/i,"")};

  function caixa(titulo,icone,conteudo,rodape,opc){opc=opc||{};let F=document.getElementById("gdrive");if(F)F.remove();const fecha=()=>{F.remove();document.removeEventListener("keydown",tec,true)},tec=e=>{if(e.key==="Escape"&&!opc.preso){e.preventDefault();e.stopPropagation();fecha()}};
    F=el("div",{id:"gdrive",role:"dialog","aria-modal":"true","aria-label":titulo,onclick:e=>{if(e.target===F&&!opc.preso)fecha()}},el("div",{class:"gd-caixa"+(opc.largo?" largo":"")},
      el("div",{class:"gd-top"},el("span",{class:"gd-logo"},ic(icone||"nuvem",22)),el("h2",{},titulo),el("span",{class:"grow"}),opc.preso?null:el("button",{type:"button",class:"ib","aria-label":"Fechar",onclick:fecha},ic("fechar",18))),
      el("div",{class:"gd-corpo"},conteudo),rodape?el("div",{class:"gd-rod"},rodape):null));
    document.body.append(F);document.addEventListener("keydown",tec,true);F._fecha=fecha;return F}
  const toast=t=>app().toast?app().toast(t):console.log(t);

  // painel de configuracoes
  function configuracoes(){const c=cfg(),amb=ambiente(),con=conectado(),e=estado();
    const sec=(t,d,...k)=>el("section",{class:"gd-sec"},el("h3",{},t),d?el("p",{class:"gd-d"},d):null,...k);
    const chk=(k,t,d,fixo)=>el("label",{class:"gd-chk"+(fixo?" fixo":"")},el("input",{type:"checkbox",checked:fixo||c[k],disabled:fixo,onchange:ev=>{const n=cfg();n[k]=ev.target.checked;salvaCfg(n)}}),el("span",{},el("b",{},t),el("small",{},d)));
    if(amb==="bloqueado")return caixa("Google Drive","nuvem",el("div",{},sec("Indisponível nesta versão","A sincronização com o Google Drive funciona no app do Atlas para Windows. Esta versão do Atlas roda num ambiente protegido que não pode se comunicar com o Google.")),el("button",{type:"button",class:"btn",onclick:()=>document.getElementById("gdrive")._fecha()},"Fechar"));
    const idI=el("input",{type:"text",value:c.clientId,placeholder:"000000000000-xxxx.apps.googleusercontent.com",spellcheck:"false",autocomplete:"off","aria-label":"ID do cliente"}),
      segI=amb==="app"&&!ANDROID?el("input",{type:"password",value:c.clientSecret,placeholder:"GOCSPX-…",autocomplete:"off","aria-label":"Chave secreta do cliente"}):null;
    const guardaCred=()=>{const n=cfg(),id=idI.value.trim(),sg=segI?segI.value.trim():"";if(n.clientId!==id||segI&&n.clientSecret!==sg){n.clientId=id;if(segI)n.clientSecret=sg;n.conta=null;salvaCfg(n);ls(K_TOK,null);tokMem=null}};
    const conta=con?el("div",{class:"gd-conta"},el("span",{class:"gd-av"},((c.conta&&c.conta.nome)||"G").slice(0,1).toUpperCase()),el("div",{class:"grow"},el("b",{},c.conta&&c.conta.nome||"Conta Google"),el("small",{},c.conta&&c.conta.email||"Conectada")),
        el("button",{type:"button",class:"btn ghost",onclick:()=>{if(!confirmaInline(conta,"Desconectar a conta? Nada é apagado do Drive nem deste computador.",()=>{ls(K_TOK,null);tokMem=null;const n=cfg();n.conta=null;salvaCfg(n);atualizaBotao();configuracoes()}))return}},"Desconectar"))
      :el("div",{class:"gd-conta vazio"},el("div",{class:"grow"},el("b",{},"Nenhuma conta conectada"),el("small",{},"Conecte a conta Google onde o mundo vai ficar guardado.")),
        el("button",{type:"button",class:"btn primary",onclick:async ev=>{guardaCred();const b=ev.currentTarget;b.disabled=true;b.textContent=amb==="app"?"Aguardando o navegador…":"Conectando…";try{await conecta();toast("Conta Google conectada.");configuracoes()}catch(er){b.disabled=false;b.textContent="Conectar conta Google";erroEm(conta,er.message)}}},"Conectar conta Google"));
    const pasta=el("div",{class:"gd-pasta"},el("span",{class:"gd-pi"},ic("pasta",20)),el("div",{class:"grow"},el("b",{},c.pasta?c.pasta.nome:"Nenhuma pasta escolhida"),el("small",{},c.pasta?(c.pasta.caminho||"Meu Drive"):"Notas, quadros e mapas ficam nesta pasta, no mesmo formato da pasta do mundo.")),
      el("button",{type:"button",class:"btn",disabled:!con,onclick:()=>escolhePasta()},c.pasta?"Trocar":"Escolher pasta"),
      !c.pasta&&con&&window.AtlasPasta&&window.AtlasPasta.atual&&window.AtlasPasta.atual()?el("button",{type:"button",class:"btn primary",onclick:async ev=>{const b=ev.currentTarget;b.disabled=true;b.textContent="Criando…";try{const p=await ligaNovo(window.AtlasPasta.atual().nome);toast("Pasta criada no Drive: Atlas › "+p.nome);configuracoes()}catch(er){b.disabled=false;b.textContent="Criar pasta nova";erroEm(pasta,er.message)}}},"Criar pasta nova"):null);
    const ap=aparelho(),apI=el("input",{type:"text",value:ap.nome,maxlength:30,"aria-label":"Nome deste aparelho",onchange:ev=>{const a=aparelho();a.nome=ev.target.value.trim()||a.nome;ls(K_APAR,a);tPres=0}});
    const auto=c.pasta?el("label",{class:"gd-chk"},el("input",{type:"checkbox",checked:autoOn(c),onchange:ev=>{const n=cfg();n.auto=ev.target.checked;salvaCfg(n);atualizaBotao();if(n.auto)sincroniza("tudo")}}),el("span",{},el("b",{},"Sincronizar automaticamente"),el("small",{},c.pasta.pc&&!ANDROID?"Esta pasta é de um computador sincronizado pelo Google Drive para computador. Se for ESTE computador, deixe desligado: o Google Drive já mantém a pasta igual.":"Envia alguns segundos depois de cada mudança e busca o que chegou ao abrir o mundo, ao voltar para o app e a cada minuto. Só pergunta quando o mesmo arquivo mudou nos dois lados."))):null;
    const ajuda=el("details",{class:"gd-ajuda"},el("summary",{},"Como criar o ID no Google Cloud"),el("ol",{},
      el("li",{},"Abra console.cloud.google.com e crie um projeto (por exemplo, \"Atlas\")."),
      el("li",{},"Em APIs e serviços › Biblioteca, ative a Google Drive API."),
      el("li",{},"Em Tela de permissão OAuth, escolha Externo, preencha nome e e-mail e, em Usuários de teste, adicione o seu e-mail."),
      ANDROID?el("li",{},"Em Clientes › Criar cliente, escolha Android. Nome do pacote: com.yamavaki.atlas. Impressão digital SHA-1: F3:FF:78:AB:B6:A0:36:58:C6:46:03:D1:74:A9:B1:8C:42:6E:76:F8. Crie, abra o cliente e, em Configurações avançadas, ligue \"Ativar esquema de URI personalizado\" e salve."):
      el("li",{},"Em Credenciais › Criar credenciais › ID do cliente OAuth, escolha "+(amb==="app"?"App para computador":"Aplicativo da Web (com a origem "+location.origin+")")+"."),
      el("li",{},"Copie o ID do cliente"+(amb==="app"&&!ANDROID?" e a chave secreta":"")+" para o campo acima e toque em Conectar."+(ANDROID?" No celular é um ID diferente do computador (o do cliente Android), e não tem chave secreta.":"")),
      el("li",{},"No login, o Google avisa que o app não foi verificado: clique em Avançado e em Continuar. É esperado para uso pessoal.")));
    const corpo=el("div",{},
      sec("Conta",null,conta),
      sec("Pasta no Drive",null,pasta,auto,el("label",{class:"gd-campo"},el("span",{},"Nome deste aparelho (aparece para os outros)"),apI)),
      sec("O que sincronizar","As artes dos pacotes do Dungeondraft nunca são enviadas: continuam só neste computador.",
        chk("notas","Notas e quadros","Arquivos .md e .canvas, legíveis pelo Obsidian e pelo Claude",true),
        chk("mapas","Mapas de região e cidade","Parâmetros e edições de cada mapa",true),
        chk("batalhas","Mapas de batalha","Paredes, pisos, objetos e luzes (sem as artes)"),
        chk("imagens","Imagens dos quadros","Imagens coladas nos quadros, já reduzidas"),
        chk("backup","Cópia de segurança a cada envio","Guarda o mundo inteiro num arquivo .atlasmundo em Backups (mantém os 10 últimos)")),
      el("details",{class:"gd-sec gd-cred",open:!c.clientId||null},el("summary",{},el("h3",{},"Configuração do Google Cloud")),
        el("p",{class:"gd-d"},"O Atlas usa um projeto seu no Google Cloud para acessar o Drive. Os dados vão direto do seu computador para a sua conta."),
        el("label",{class:"gd-campo"},el("span",{},ANDROID?"ID do cliente Android":"ID do cliente"),idI),segI?el("label",{class:"gd-campo"},el("span",{},"Chave secreta do cliente"),segI):null,
        el("div",{class:"gd-linha"},el("button",{type:"button",class:"btn",onclick:()=>{guardaCred();toast("Configuração guardada.");configuracoes()}},"Guardar")),ajuda));
    const rod=[el("span",{class:"gd-ult"},"Última sincronização: "+quando(e.ultima)),el("span",{class:"grow"}),
      el("button",{type:"button",class:"btn",disabled:!con||!c.pasta,onclick:()=>fluxo("atualizar")},ic("importar",16),"Atualizar do Drive"),
      el("button",{type:"button",class:"btn primary",disabled:!con||!c.pasta,onclick:()=>fluxo("enviar")},ic("exportar",16),"Enviar para o Drive")];
    caixa("Google Drive","nuvem",corpo,rod)}
  function erroEm(onde,msg){let e=onde.parentNode.querySelector(".gd-erro");if(!e){e=el("p",{class:"gd-erro",role:"alert"});onde.after(e)}e.textContent=msg}
  function confirmaInline(onde,msg,sim){let e=onde.parentNode.querySelector(".gd-conf");if(e){e.remove();return false}e=el("div",{class:"gd-conf"},el("span",{},msg),el("button",{type:"button",class:"btn danger",onclick:sim},"Desconectar"),el("button",{type:"button",class:"btn ghost",onclick:()=>e.remove()},"Cancelar"));onde.after(e);return false}
  async function conecta(){const amb=ambiente(),c=cfg();if(amb==="app")await entrarApp(c);else await token(true);
    const j=await json(API+"/about?fields="+q("user(displayName,emailAddress)"));const n=cfg();n.conta={nome:j.user.displayName,email:j.user.emailAddress};salvaCfg(n);atualizaBotao()}

  // escolher a pasta do mundo no Drive
  // computadores sincronizados: pastas suas sem pasta-mãe que não são o Meu Drive
  async function computadores(){const out=[];let tok="";for(let k=0;k<8;k++){const j=await json(API+"/files?pageSize=1000&fields="+q("nextPageToken,files(id,name,parents)")+"&q="+q("mimeType='"+PASTA_MIME+"' and trashed=false and 'me' in owners")+(tok?"&pageToken="+q(tok):""));for(const f of j.files||[])if(!f.parents||!f.parents.length)out.push(f);if(!(tok=j.nextPageToken))break}return out}
  async function buscaPastas(t){const j=await json(API+"/files?pageSize=100&fields="+q("files(id,name,parents)")+"&q="+q("mimeType='"+PASTA_MIME+"' and trashed=false and name contains '"+t.replace(/\\/g,"\\\\").replace(/'/g,"\\'")+"'"));const L=j.files||[];
    // mostra de onde vem cada uma (nome da pasta-mae)
    const pais={};await Promise.all([...new Set(L.map(f=>f.parents&&f.parents[0]).filter(Boolean))].slice(0,30).map(async id=>{try{const p=await json(API+"/files/"+id+"?fields=name");pais[id]=p.name}catch(e){}}));
    return L.map(f=>Object.assign({},f,{dica:f.parents&&pais[f.parents[0]]?"em "+pais[f.parents[0]]:f.parents&&f.parents.length?"":"(computador)"}))}
  async function escolhePasta(){let pilha=[{id:"root",nome:"Meu Drive"}];const lista=el("div",{class:"gd-lista",role:"listbox","aria-label":"Pastas"}),trilha=el("div",{class:"gd-trilha"}),nova=el("input",{type:"text",placeholder:"Nome da pasta nova","aria-label":"Nome da pasta nova"});
    const virtual=id=>id==="root"||id.startsWith("__");
    const usar=el("button",{type:"button",class:"btn primary",onclick:()=>{const at=pilha[pilha.length-1];if(virtual(at.id))return;const n=cfg(),mudou=!n.pasta||n.pasta.id!==at.id;n.pasta={id:at.id,nome:at.nome,caminho:pilha.slice(0,-1).map(x=>x.nome).join(" › "),pc:pilha.some(x=>x.id==="__pc")||undefined};if(mudou)n.auto=undefined;salvaCfg(n);if(mudou){ls(kM(K_BASE),null);mundoAberto()}toast("Pasta do mundo: "+at.nome);configuracoes()}},"Usar esta pasta");
    const mostra=async()=>{const at=pilha[pilha.length-1];usar.disabled=virtual(at.id);trilha.replaceChildren(...pilha.flatMap((x,i)=>[i?el("span",{class:"sep"},"›"):"",el("button",{type:"button",class:"gd-tr",onclick:()=>{pilha=pilha.slice(0,i+1);mostra()}},x.nome)]));
      lista.replaceChildren(el("p",{class:"gd-d"},"Carregando…"));try{const L=(at.id==="__pc"?await computadores():at.id.startsWith("__b:")?await buscaPastas(at.id.slice(4)):(await listaFilhos(at.id)).filter(f=>f.mimeType===PASTA_MIME)).sort((a,b)=>a.name.localeCompare(b.name,"pt-BR"));
        lista.replaceChildren(...(L.length?L.map(f=>el("button",{type:"button",class:"gd-item",role:"option",onclick:()=>{pilha.push({id:f.id,nome:f.name});mostra()}},ic(at.id==="__pc"?"mundo":"pasta",18),el("span",{},f.name,f.dica?el("small",{class:"gd-dica"}," "+f.dica):null),ic("seta",16))):[el("p",{class:"gd-d"},at.id==="__pc"?"Nenhum computador sincronizado com este Drive. No PC, o Google Drive para computador precisa estar sincronizando alguma pasta.":at.id.startsWith("__b:")?"Nenhuma pasta com esse nome.":"Nenhuma subpasta aqui.")]))}catch(e){lista.replaceChildren(el("p",{class:"gd-erro"},e.message))}};
    const cria=el("button",{type:"button",class:"btn",onclick:async()=>{const nome=nova.value.trim();if(!nome)return nova.focus();const at=pilha[pilha.length-1];try{const j=await json(API+"/files?fields=id,name",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({name:nome,mimeType:PASTA_MIME,parents:[at.id]})});nova.value="";pilha.push({id:j.id,nome:j.name});mostra()}catch(e){toast(e.message)}}},ic("mais",16),"Criar");
    // 1.51.4: pastas do PC (Google Drive para computador ficam em "Computadores", fora do Meu Drive) e busca por nome
    const raiz=(id,nome)=>{pilha=[{id,nome}];mostra()};const busca=el("input",{type:"search",placeholder:"Buscar pasta pelo nome","aria-label":"Buscar pasta pelo nome",onkeydown:ev=>{if(ev.key==="Enter"&&busca.value.trim())raiz("__b:"+busca.value.trim(),"Busca: "+busca.value.trim())}});
    const raizes=el("div",{class:"gd-raizes"},el("button",{type:"button",class:"btn",onclick:()=>raiz("root","Meu Drive")},ic("nuvem",16),"Meu Drive"),el("button",{type:"button",class:"btn",onclick:()=>raiz("__pc","Computadores")},ic("mundo",16),"Computadores"),busca);
    caixa("Escolher a pasta do mundo","pasta",el("div",{},el("p",{class:"gd-d"},"Abra a pasta onde o mundo vai ficar e clique em Usar esta pasta. Pastas do computador sincronizadas pelo Google Drive para computador ficam em Computadores."),raizes,trilha,lista,el("div",{class:"gd-linha"},nova,cria)),
      [el("button",{type:"button",class:"btn ghost",onclick:()=>configuracoes()},"Voltar"),el("span",{class:"grow"}),usar]);mostra()}

  // revisar e executar envio/atualização
  async function fluxo(modo){const env=modo==="enviar",titulo=env?"Enviar para o Drive":"Atualizar do Drive";
    caixa(titulo,env?"exportar":"importar",el("div",{class:"gd-espera"},el("span",{class:"gd-giro"}),el("p",{},env?"Comparando este computador com o Drive…":"Verificando o que mudou no Drive…")),null,{preso:true});
    let P;try{P=await prepara(modo)}catch(e){return caixa(titulo,"nuvem",el("p",{class:"gd-erro"},e.message),[el("span",{class:"grow"}),el("button",{type:"button",class:"btn",onclick:()=>configuracoes()},"Abrir configurações")])}
    const G={novo:[],alterado:[],remover:[],conflito:[]};for(const x of P.itens)if(G[x.acao])G[x.acao].push(x);const total=G.novo.length+G.alterado.length+G.remover.length+G.conflito.length,escolhas={};
    if(!total){const e=estado();e.ultima=new Date().toISOString();e.acao=modo;e.sujo=false;salvaEstado(e);fechaBase(P,Object.fromEntries(P.itens.filter(x=>x.l&&x.r).map(x=>[x.p,{r:x.r.md5Checksum,l:x.l.md5}])));
      return caixa(titulo,"salvo",el("div",{class:"gd-ok"},ic("salvo",36),el("h3",{},"Tudo em dia"),el("p",{},env?"O Drive já tem a versão mais recente do mundo.":"Não há nada novo no Drive."),P.docs.length?el("p",{class:"gd-d"},P.docs.length+" documento(s) do Google Docs na pasta foram ignorados: o Atlas lê arquivos .md."):null),[el("span",{class:"grow"}),el("button",{type:"button",class:"btn primary",onclick:()=>document.getElementById("gdrive")._fecha()},"Fechar")])}
    const NOMES=env?{novo:"Novos no Drive",alterado:"Atualizados no Drive",remover:"Vão para a lixeira do Drive",conflito:"Alterados dos dois lados"}:{novo:"Chegam do Drive",alterado:"Atualizados com a versão do Drive",remover:"Removidos aqui (apagados no Drive)",conflito:"Alterados dos dois lados"};
    const grupo=(k,cls)=>G[k].length?el("details",{class:"gd-grupo "+cls,open:k==="conflito"||G[k].length<=8||null},el("summary",{},el("b",{},NOMES[k]),el("span",{class:"gd-n"},G[k].length)),
      el("ul",{},...G[k].map(x=>el("li",{},el("span",{class:"gd-tipo"},nomeTipo(x.p)),el("span",{class:"gd-nome",title:x.p},nomeArq(x.p,x)),k==="conflito"?el("span",{class:"gd-por"},x.por):null,
        k==="conflito"?el("select",{"aria-label":"O que fazer com "+x.p,onchange:ev=>{escolhas[x.p]=ev.target.value}},...[["pular","Decidir depois"],["minha","Ficar com a deste computador"],["drive","Ficar com a do Drive"],x.l&&x.r?["duas","Manter as duas"]:null].filter(Boolean).map(([v,t])=>el("option",{value:v},t))):null)))):null;
    const corpo=el("div",{},el("p",{class:"gd-d"},env?"Confira o que vai para a pasta "+P.c.pasta.nome+". Arquivos substituídos ficam no histórico de versões do Drive.":"Confira o que vem da pasta "+P.c.pasta.nome+" antes de aplicar."),
      el("div",{class:"gd-resumo"},...[["novo","novo","novos"],["alterado","alterado","alterados"],["remover","removido","removidos"],["conflito","conflito","conflitos"]].map(([k,t1,t2])=>el("div",{class:"gd-cont "+k+(G[k].length?"":" zero")},el("b",{},G[k].length),el("span",{},G[k].length===1?t1:t2)))),
      grupo("conflito","c"),grupo("novo","n"),grupo("alterado","a"),grupo("remover","r"),
      G.conflito.length?el("p",{class:"gd-d"},"Conflitos marcados como \"Decidir depois\" ficam como estão e aparecem de novo na próxima vez."):null);
    const exec=el("button",{type:"button",class:"btn primary",onclick:()=>executa(P,modo,escolhas,titulo)},env?"Enviar agora":"Atualizar agora");
    caixa(titulo,env?"exportar":"importar",corpo,[el("button",{type:"button",class:"btn ghost",onclick:()=>configuracoes()},"Configurações"),el("span",{class:"grow"}),el("button",{type:"button",class:"btn",onclick:()=>document.getElementById("gdrive")._fecha()},"Cancelar"),exec],{largo:true})}
  async function executa(P,modo,escolhas,titulo){const env=modo==="enviar",barra=el("div",{class:"gd-barra"},el("i",{})),txt=el("p",{class:"gd-d"},"Preparando…");
    caixa(titulo,env?"exportar":"importar",el("div",{class:"gd-espera"},el("p",{},env?"Enviando para o Drive…":"Trazendo do Drive…"),barra,txt),null,{preso:true});
    const prog=(f,n,x)=>{barra.firstChild.style.width=Math.round(f/n*100)+"%";txt.textContent=f+" de "+n+" · "+nomeArq(x.p,x)};
    let r;const tinha=SY.on;SY.on=true;try{r=env?await enviar(P,escolhas,prog):await atualizar(P,escolhas,prog)}catch(e){r={n:0,erros:[e.message]}}finally{if(!tinha)SY.on=false}
    const e=estado();if(!r.erros.length||r.n>r.erros.length){e.ultima=new Date().toISOString();e.acao=modo;if(env&&!r.erros.length)e.sujo=false;e.conflitos=0;salvaEstado(e)}if(autoOn())setTimeout(()=>sincroniza("tudo"),600);
    const ok=!r.erros.length;caixa(titulo,ok?"salvo":"nuvem",el("div",{class:ok?"gd-ok":""},ok?ic("salvo",36):null,el("h3",{},ok?(env?"Mundo enviado":"Mundo atualizado"):"Concluído com avisos"),
        el("p",{},env?(r.n?r.n+" arquivo(s) enviados para "+P.c.pasta.nome+".":"Nada a enviar."):(r.n?r.n+" arquivo(s) atualizados a partir do Drive.":"Nada a atualizar.")),
        r.erros.length?el("details",{class:"gd-grupo r",open:true},el("summary",{},el("b",{},"Não foi possível processar"),el("span",{class:"gd-n"},r.erros.length)),el("ul",{},...r.erros.slice(0,30).map(t=>el("li",{},t)))):null),
      [el("span",{class:"grow"}),el("button",{type:"button",class:"btn primary",onclick:()=>document.getElementById("gdrive")._fecha()},"Fechar")])}

  // botão da barra de cima: estado e atalhos
  function atualizaBotao(){const b=document.getElementById("bDrive");if(!b)return;const c=cfg(),e=estado(),con=conectado()&&c.pasta,au=con&&autoOn(c);
    b.dataset.est=!con?"off":SY.on?"sync":e.conflitos?"conf":SY.erro&&au?"erro":e.sujo?"sujo":"ok";
    const ou=SY.outros.length?" · também aberto em "+SY.outros.map(o=>o.nome).join(", "):"";
    const t=!con?"Google Drive: não configurado":SY.on?"Google Drive: sincronizando…":e.conflitos?"Google Drive: "+e.conflitos+" conflito(s) para resolver":SY.erro&&au?"Google Drive: erro ("+SY.erro+")":e.sujo?(au?"Google Drive: enviando em instantes":"Google Drive: há alterações não enviadas"):"Google Drive: sincronizado "+quando(e.ultima)+(au?" (automático)":"");
    b.title=t+ou;b.setAttribute("aria-label",t+ou)}
  function menu(btn){const c=cfg(),e=estado(),con=conectado()&&c.pasta;if(!con)return configuracoes();let m=document.getElementById("gdmenu");if(m){m.remove();return}const r=btn.getBoundingClientRect();
    const fecha=()=>{m.remove();document.removeEventListener("pointerdown",fora,true)},fora=ev=>{if(!m.contains(ev.target)&&ev.target!==btn&&!btn.contains(ev.target))fecha()};
    const item=(i,t,d,fn,cls)=>el("button",{type:"button",class:"gd-mi"+(cls?" "+cls:""),onclick:()=>{fecha();fn()}},el("span",{class:"gd-mii"},ic(i,18)),el("span",{},el("b",{},t),el("small",{},d)));
    m=el("div",{id:"gdmenu",class:"gd-menu",style:(()=>{const W=Math.min(320,innerWidth-16),L=Math.max(8,Math.min(r.right-W,innerWidth-W-8));return "top:"+(r.bottom+8)+"px;left:"+L+"px;max-height:calc(100vh - "+(r.bottom+16)+"px);overflow:auto"})()},
      el("div",{class:"gd-mh"},el("span",{class:"gd-av"},((c.conta&&c.conta.nome)||"G").slice(0,1).toUpperCase()),el("div",{},el("b",{},c.pasta.nome),el("small",{},(c.conta&&c.conta.email?c.conta.email+" · ":"")+"última: "+quando(e.ultima)))),
      SY.outros.length?el("p",{class:"gd-outros"},"Também aberto agora em: "+SY.outros.map(o=>o.nome+" ("+quando(o.quando)+")").join(", ")):null,
      e.conflitos?el("p",{class:"gd-aviso"},e.conflitos===1?"1 arquivo mudou aqui e no Drive. Escolha qual versão fica.":e.conflitos+" arquivos mudaram aqui e no Drive. Escolha qual versão fica."):e.sujo&&!autoOn(c)?el("p",{class:"gd-aviso"},"Há alterações neste aparelho que ainda não foram enviadas."):null,
      SY.erro&&autoOn(c)?el("p",{class:"gd-aviso"},"Última tentativa falhou: "+SY.erro):null,
      e.conflitos?item("importar","Resolver conflitos","Mostra o que mudou nos dois lados",()=>fluxo("atualizar"),"pri"):null,
      autoOn(c)?item("refazer","Sincronizar agora","Busca e envia o que mudou",()=>{sincroniza("tudo");toast("Sincronizando…")},e.conflitos?"":"pri"):null,
      item("nuvem",autoOn(c)?"Automático: ligado":"Automático: desligado",autoOn(c)?"Envia e busca sozinho. Toque para desligar":c.pasta.pc&&!ANDROID?"Pasta já sincronizada pelo Google Drive para computador":"Toque para sincronizar sozinho",()=>{const n=cfg();n.auto=!autoOn(n);salvaCfg(n);atualizaBotao();if(n.auto)sincroniza("tudo");toast(n.auto?"Sincronização automática ligada.":"Sincronização automática desligada.")}),
      item("exportar","Enviar para o Drive","Manda o que mudou aqui",()=>fluxo("enviar"),autoOn(c)?"":"pri"),
      item("importar","Atualizar do Drive","Traz o que mudou lá, inclusive pelo Claude",()=>fluxo("atualizar")),
      item("apagar","Remover cópias repetidas","Notas e mapas iguais, duplicados por engano",()=>app().removeDuplicados&&app().removeDuplicados()),
      item("ajustes","Configurações","Conta, pasta e o que sincronizar",()=>configuracoes()));
    document.body.append(m);setTimeout(()=>document.addEventListener("pointerdown",fora,true))}

  // ---------- 1.54: mundos no Drive, pasta por mundo, sincronização automática, outros aparelhos ----------
  // Cada mundo do app (pasta no PC ou pasta interna no celular) guarda a sua pasta do Drive. Com "automático"
  // ligado: envia uns segundos depois de cada edição, busca ao abrir o mundo, ao voltar para o app e a cada
  // ~40 s (só quando a lista de mudanças do Drive mostra algo nesta pasta). Só pergunta em conflito.
  const K_APAR="atlas:drive:aparelho",PRES=".atlas/aparelhos/";
  const aparelho=()=>{let a=ls(K_APAR);if(!a||!a.id){a={id:aleatorio(6).replace(/[^A-Za-z0-9]/g,"x"),nome:ANDROID?"Celular":"Computador"};ls(K_APAR,a)}return a};
  const autoOn=c=>{c=c||cfg();if(ambiente()==="bloqueado"||!conectado()||!c.pasta)return false;return c.auto!=null?!!c.auto:!(c.pasta.pc&&!ANDROID)};
  const SY={on:false,pend:null,tEnv:0,tIni:0,arq:new Set(),pastas:new Set(),chave:null,tok:null,erro:null,outros:[],vistos:{},avisoConf:0,ultBusca:0};
  const lembra=P=>{SY.chave=mk();SY.arq=new Set([...P.R.arqs.values()].map(f=>f.id));SY.pastas=new Set(P.R.pastas.values());
    const eu=aparelho().id,ag=Date.now(),L=[];for(const [p,f] of P.R.arqs){if(!p.startsWith(PRES))continue;const m=/^(.*)~([A-Za-z0-9]+)\.json$/.exec(p.slice(PRES.length));if(!m||m[2]===eu)continue;const t=+new Date(f.modifiedTime||0);if(ag-t<6*60000)L.push({nome:m[1],quando:t,id:m[2]})}
    setOutros(L)};
  function setOutros(L){const ag=Date.now(),novos=L.filter(o=>!SY.outros.some(x=>x.id===o.id));SY.outros=L;for(const o of novos)if(!SY.vistos[o.id]||ag-SY.vistos[o.id]>30*60000){SY.vistos[o.id]=ag;toast("Este mundo também está aberto em: "+o.nome+".")}atualizaBotao()}
  const nomeP=a=>a.nome.replace(/[^\p{L}\p{N} _-]/gu,"").trim()||"Aparelho";
  // pasta sincronizada pelo Google Drive para computador (sem o automático): a presença vai por um arquivo na própria pasta
  async function presencaLocal(){const AP=window.AtlasPasta,T=tauri();if(!AP||!T||!T.fs||ANDROID||!conectado()||autoOn())return;const at=AP.atual&&AP.atual();if(!at||at.tipo!=="app"||!at.chave)return;
    const dir=at.chave.replace(/[\\/]+$/,"")+"/.atlas/aparelhos",a=aparelho();
    try{await T.fs.mkdir(dir,{recursive:true}).catch(()=>{});await T.fs.writeTextFile(dir+"/"+nomeP(a)+"~"+a.id+".json",JSON.stringify({nome:a.nome,quando:new Date().toISOString()}));
      const ag=Date.now(),out=[];for(const x of await T.fs.readDir(dir)){const m=/^(.*)~([A-Za-z0-9]+)\.json$/.exec(x.name||"");if(!m||m[2]===a.id)continue;try{const st=await T.fs.stat(dir+"/"+x.name),t=st.mtime?+new Date(st.mtime):0;if(ag-t<6*60000)out.push({nome:m[1],quando:t,id:m[2]})}catch(e){}}setOutros(out)}catch(e){}}
  setInterval(()=>{if(!document.hidden)presencaLocal()},100000);
  // presença: um arquivinho por aparelho, atualizado a cada ~2 min enquanto o mundo está aberto
  let tPres=0;async function presenca(P){if(Date.now()-tPres<110000)return;tPres=Date.now();const a=aparelho(),rel=PRES+nomeP(a)+"~"+a.id+".json",f=P.R.arqs.get(rel);
    try{await sobe(P.R.pastas,rel,JSON.stringify({nome:a.nome,quando:new Date().toISOString()}),f&&f.id)}catch(e){}}
  // o que o app mostra antes e depois de receber (para redesenhar só o necessário)
  const foto=()=>{const {S}=app(),o={};if(!S)return o;for(const [id,n] of S.notes)o["n"+id]=n.updated||0;for(const [id,m] of S.maps)o["m"+id]=m.updated||0;return o};
  async function sincroniza(modo){if(!autoOn())return;if(SY.on){SY.pend=!SY.pend||SY.pend===modo?modo:"tudo";return}
    const chave=mk();SY.on=true;atualizaBotao();let rec=0,env=0,conf=0,por=null;
    try{if(modo!=="enviar"){const P=await prepara("atualizar");lembra(P);if(window.__SYNCLOG)__SYNCLOG.push(["rec",P.itens.filter(x=>x.acao!=="igual").map(x=>x.p+":"+x.acao)]);if(mk()!==chave)return;conf=P.itens.filter(x=>x.acao==="conflito").length;
        if(P.itens.some(x=>x.acao==="novo"||x.acao==="alterado"||x.acao==="remover")){const antes=foto(),r=await atualizar(P,{},null,true);rec=r.n-r.erros.length;if(rec){try{por=(await indiceRemoto(P)).por}catch(e){}const depois=foto(),mud=Object.keys(depois).filter(k=>antes[k]!==depois[k]).concat(Object.keys(antes).filter(k=>!(k in depois)));
          if(app().aposSync)app().aposSync(mud);toast((rec===1?"Chegou 1 mudança":"Chegaram "+rec+" mudanças")+(por&&por.nome&&por.id!==aparelho().id?" do "+por.nome:" do Drive")+".")}}
        presenca(P)}
      if(mk()!==chave)return;
      if(modo!=="receber"&&(estado().sujo||modo==="enviar")){const P=await prepara("enviar");lembra(P);if(window.__SYNCLOG)__SYNCLOG.push(["env",P.itens.filter(x=>x.acao!=="igual").map(x=>x.p+":"+x.acao)]);if(mk()!==chave)return;const c2=P.itens.filter(x=>x.acao==="conflito").length;conf=Math.max(conf,c2);
        if(P.itens.some(x=>x.acao==="novo"||x.acao==="alterado"||x.acao==="remover")){const r=await enviar(P,{},null,true);env=r.n-r.erros.length;if(r.erros.length)SY.erro=r.erros[0];if(r.tarde)SY.pend="tudo";
          // outro aparelho gravou o mesmo arquivo logo depois? então foi conflito: volta a base para o usuário escolher
          if(r.subidos.length){await new Promise(ok=>setTimeout(ok,2500));const bt=ls(kM(K_BASE))||{arq:{}};let ruim=0;for(const [pp,id,md] of r.subidos){try{const at=await json(API+"/files/"+id+"?fields=md5Checksum");if(at.md5Checksum!==md){ruim++;if(P.base[pp])bt.arq[pp]=P.base[pp];else delete bt.arq[pp]}}catch(e){}}if(ruim){ls(kM(K_BASE),bt);SY.pend="tudo"}}}
        presenca(P);const e=estado();e.sujo=c2>0;salvaEstado(e)}
      const e=estado();e.ultima=new Date().toISOString();e.acao="auto";e.conflitos=conf;salvaEstado(e);SY.erro=null;
      if(conf&&Date.now()-SY.avisoConf>10*60000){SY.avisoConf=Date.now();toast(conf===1?"1 arquivo mudou aqui e no outro aparelho: toque no botão do Drive para escolher.":conf+" arquivos mudaram aqui e no outro aparelho: toque no botão do Drive para escolher.")}}
    catch(er){SY.erro=er.message;console.warn("sincroniza",er)}
    finally{SY.on=false;SY.ultBusca=Date.now();atualizaBotao();if(SY.pend){const m=SY.pend;SY.pend=null;setTimeout(()=>sincroniza(m),400)}}}
  function agendaEnvio(){if(!autoOn())return;clearTimeout(SY.tEnv);if(!SY.tIni)SY.tIni=Date.now();SY.tEnv=setTimeout(()=>{SY.tIni=0;sincroniza("enviar")},Date.now()-SY.tIni>30000?300:6000)}
  // lista de mudanças do Drive: barato de consultar; só busca tudo quando algo desta pasta mudou
  async function mudouLa(){try{if(!SY.tok){SY.tok=(await json(API+"/changes/startPageToken")).startPageToken;return true}let tok=SY.tok,rel=false;
      for(let k=0;k<5&&tok;k++){const j=await json(API+"/changes?pageToken="+q(tok)+"&pageSize=500&includeRemoved=true&spaces=drive&fields="+q("nextPageToken,newStartPageToken,changes(fileId,removed,file(parents))"));
        for(const ch of j.changes||[]){if(SY.arq.has(ch.fileId)||SY.pastas.has(ch.fileId)||ch.file&&(ch.file.parents||[]).some(p=>SY.pastas.has(p)))rel=true}
        if(j.newStartPageToken){SY.tok=j.newStartPageToken;break}tok=j.nextPageToken;SY.tok=tok}return rel||SY.chave!==mk()}catch(e){return true}}
  async function vigia(forca){if(!autoOn()||document.hidden||SY.on)return;if(!forca&&Date.now()-SY.ultBusca<15000)return;SY.ultBusca=Date.now();
    if(forca||await mudouLa())sincroniza(estado().sujo?"tudo":"receber");else{const P0=SY.chave===mk()?null:1;if(P0)sincroniza("receber");else if(Date.now()-tPres>110000)sincroniza("receber")}}
  setInterval(()=>vigia(false),10000);
  document.addEventListener("visibilitychange",()=>{if(!document.hidden)setTimeout(()=>vigia(true),600)});
  addEventListener("focus",()=>setTimeout(()=>vigia(false),800));
  // o app trocou de mundo: zera o que era do outro e busca o deste
  // 1.55.2: pasta escolhida antes da 1.54 não sabe se é de um computador (Google Drive para computador); descobre pelos pais
  async function verificaPc(){const c=cfg();if(ANDROID||!conectado()||!c.pasta||c.pasta.pc!==undefined||c.pasta.pcVisto)return;try{if(!raizId)raizId=(await json(API+"/files/root?fields=id")).id;let id=c.pasta.id,pc=false;for(let k=0;k<8;k++){const f=await json(API+"/files/"+id+"?fields="+q("id,parents"));const pai=f.parents&&f.parents[0];if(!pai){pc=f.id!==raizId;break}if(pai===raizId)break;id=pai}const n=cfg();if(!n.pasta||n.pasta.id!==c.pasta.id)return;n.pasta=Object.assign({},n.pasta,{pc:pc||undefined,pcVisto:true});salvaCfg(n);atualizaBotao();if(pc&&n.auto==null)toast("Este mundo está numa pasta do Google Drive para computador: o envio automático pelo Atlas foi desligado neste PC (o Google Drive já sincroniza a pasta).")}catch(e){}}
  function mundoAberto(){setTimeout(verificaPc,300);SY.chave=null;SY.arq=new Set();SY.pastas=new Set();SY.outros=[];tPres=0;clearTimeout(SY.tEnv);SY.tIni=0;atualizaBotao();setTimeout(presencaLocal,1500);if(autoOn())setTimeout(()=>sincroniza(estado().sujo?"tudo":"receber"),800)}

  // todos os mundos do Atlas que estão no Drive: pastas que têm uma .atlas dentro
  async function buscaTodos(qs,campos){const out=[];let tok="";for(let k=0;k<10;k++){const j=await json(API+"/files?pageSize=1000&fields="+q("nextPageToken,files("+campos+")")+"&q="+q(qs)+(tok?"&pageToken="+q(tok):""));out.push(...(j.files||[]));if(!(tok=j.nextPageToken))break}return out}
  let raizId=null,cacheMundos=null;
  let promMundos=null;
  function mundosNoDrive(forca){if(!conectado())return Promise.resolve([]);if(cacheMundos&&!forca&&Date.now()-cacheMundos.t<60000)return Promise.resolve(cacheMundos.L);if(promMundos&&!forca)return promMundos;promMundos=mundosNoDrive0().finally(()=>{promMundos=null});return promMundos}
  async function mundosNoDrive0(){
    const [at,fich]=await Promise.all([buscaTodos("name='.atlas' and mimeType='"+PASTA_MIME+"' and trashed=false","id,parents"),buscaTodos("name='mundo.json' and trashed=false","id,parents")]);
    const fPor=new Map();for(const f of fich)if(f.parents)fPor.set(f.parents[0],f);if(!raizId)try{raizId=(await json(API+"/files/root?fields=id")).id}catch(e){}
    const out=[],nomes={};await fila(at.slice(0,80),6,async a=>{const pid=a.parents&&a.parents[0];if(!pid)return;try{const w=await json(API+"/files/"+pid+"?fields="+q("id,name,parents,modifiedTime,trashed"));if(w.trashed)return;
        let pc=false,onde="Meu Drive";const pai=w.parents&&w.parents[0];if(!pai)pc=true;else if(pai!==raizId){try{const p2=nomes[pai]||(nomes[pai]=await json(API+"/files/"+pai+"?fields="+q("id,name,parents")));onde=p2.name;pc=!p2.parents||!p2.parents.length}catch(e){onde=""}}
        let meta=null;const mf=fPor.get(a.id);if(mf)try{meta=JSON.parse(await baixaTexto(mf.id))}catch(e){}
        out.push({id:w.id,nome:w.name,onde,pc,meta,mod:w.modifiedTime})}catch(e){}});
    out.sort((a,b)=>String(b.mod).localeCompare(String(a.mod)));cacheMundos={t:Date.now(),L:out};return out}
  // pasta do Drive ligada a um mundo do app (pela chave do mundo)
  const cfgDe=chave=>ls(K_CFG+"@pasta:"+chave);
  function ligaEm(chave,pasta,auto){ls(K_CFG+"@pasta:"+chave,Object.assign({batalhas:true,imagens:true,backup:false},cfgDe(chave)||{},{pasta,auto:auto==null?undefined:auto}));ls(K_BASE+"@pasta:"+chave,null);ls(K_EST+"@pasta:"+chave,null)}
  // pasta nova no Drive para um mundo: Meu Drive › Atlas › <nome>
  async function criaPastaDrive(nome){let raiz=(await json(API+"/files?pageSize=10&fields="+q("files(id,name)")+"&q="+q("name='Atlas' and 'root' in parents and mimeType='"+PASTA_MIME+"' and trashed=false"))).files[0];
    if(!raiz)raiz=await json(API+"/files?fields=id,name",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({name:"Atlas",mimeType:PASTA_MIME,parents:["root"]})});
    const ja=new Set((await listaFilhos(raiz.id)).map(f=>f.name.toLowerCase()));let n=safe(nome),k=2;while(ja.has(n.toLowerCase()))n=safe(nome)+" "+(k++);
    const f=await json(API+"/files?fields=id,name",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({name:n,mimeType:PASTA_MIME,parents:[raiz.id]})});cacheMundos=null;setTimeout(()=>{cacheMundos=null},15000);return {id:f.id,nome:f.name,caminho:"Meu Drive › Atlas"}}
  // liga o mundo aberto a uma pasta nova no Drive e envia tudo
  async function ligaNovo(nome){const p=await criaPastaDrive(nome),n=cfg();n.pasta=p;n.auto=undefined;salvaCfg(n);ls(kM(K_BASE),null);const e=estado();e.sujo=true;salvaEstado(e);await sincroniza("enviar");return p}
  // baixa um mundo do Drive para uma pasta nova deste aparelho e abre (base: pasta-mãe; no celular, a interna)
  let baixando=false;
  async function baixaMundo(m,base){if(baixando){toast("Já estou baixando um mundo. Espere terminar.");return false}baixando=true;try{return await baixaMundo0(m,base)}finally{baixando=false}}
  async function baixaMundo0(m,base){const AP=window.AtlasPasta,A=app();if(!AP||!AP.criarEm)throw new Error("Este Atlas não cria pastas.");
    const tit=(m.meta&&m.meta.titulo)||m.nome;caixa("Baixando “"+tit+"”","importar",el("div",{class:"gd-espera"},el("span",{class:"gd-giro"}),el("p",{},"Trazendo o mundo do Drive para "+(AP.interno()?"este celular":"este computador")+"…")),null,{preso:true});
    SY.on=true;try{await AP.espera();const r=await AP.criarEm(m.nome,base);ligaEm(r.caminho,{id:m.id,nome:m.nome,caminho:m.onde,pc:m.pc||undefined},true);
      if(m.meta&&AP.gravaMeta)await AP.gravaMeta(m.meta);await A.Store.dePasta(false);
      const P=await prepara("atualizar");lembra(P);const x=await atualizar(P,{},null,true);const e=estado();e.ultima=new Date().toISOString();e.sujo=false;salvaEstado(e);
      A.drawAll&&A.drawAll();const F=document.getElementById("gdrive");if(F)F._fecha();
      toast("“"+tit+"” está neste aparelho"+(x.erros.length?" (com "+x.erros.length+" aviso(s))":"")+" e vai se manter sincronizado.");return true}
    catch(er){const F=document.getElementById("gdrive");if(F)F._fecha();throw er}finally{SY.on=false;atualizaBotao()}}

  const marca=()=>{if(quieto)return;const e=estado();if(!e.sujo&&conectado()&&cfg().pasta){e.sujo=true;salvaEstado(e)}agendaEnvio()};

  window.AtlasDrive={ambiente,configuracoes,menu,atualizaBotao,marca,mundoAberto,mundosNoDrive,baixaMundo,ligaNovo,criaPastaDrive,ligaEm,cfgDe,autoOn,sincroniza,aparelho,outros:()=>SY.outros,enviar:()=>fluxo("enviar"),atualizar:()=>fluxo("atualizar"),conectado,_md5:md5,_compara:compara};
})();
