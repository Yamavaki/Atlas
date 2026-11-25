// Atlas - mundo numa pasta do PC (como o Obsidian). Notas viram .md, quadros .canvas, mapas .atlasmapa.json.
// Dois jeitos de mexer em arquivos: a API de pastas do Chrome/Edge (File System Access) e o app instalado (Tauri).
// O que o arquivo .md nao guarda (id, pasta das imagens, tipo) fica em .atlas/indice.json.
(function(){
  "use strict";
  const LEIA_ASSETS="Coloque nesta pasta seus pacotes de arte (.dungeondraft_pack).\nO Modo Batalha do Atlas carrega os pacotes desta pasta automaticamente ao abrir.\nPacotes cujos autores não permitem a leitura por outros programas são ignorados.\n";
  const IDX=".atlas/indice.json",MAPAS="Mapas",LIXO=".atlas/lixeira";
  const tauri=()=>window.__TAURI__&&window.__TAURI__.fs?window.__TAURI__:null;
  const safe=s=>String(s||"Sem título").replace(/[\\/:*?"<>|#^[\]]+/g,"-").replace(/\s+/g," ").trim().slice(0,120)||"Sem título";
  const juntaP=(...p)=>p.filter(Boolean).join("/").replace(/\/+/g,"/");

  // ---------- guardar a pasta escolhida entre uma visita e outra ----------
  const idb=()=>new Promise((ok,er)=>{const r=indexedDB.open("atlas-pasta",1);r.onupgradeneeded=()=>r.result.createObjectStore("kv");r.onsuccess=()=>ok(r.result);r.onerror=()=>er(r.error)});
  const kv=async(k,v)=>{const db=await idb();return new Promise((ok,er)=>{const t=db.transaction("kv",v===undefined?"readonly":"readwrite"),s=t.objectStore("kv"),r=v===undefined?s.get(k):v===null?s.delete(k):s.put(v,k);r.onsuccess=()=>ok(r.result);r.onerror=()=>er(r.error)})};

  // ---------- disco: Chrome/Edge (handle de pasta) ----------
  function discoFSA(raiz){
    const dir=async(partes,criar)=>{let d=raiz;for(const p of partes)d=await d.getDirectoryHandle(p,{create:!!criar});return d};
    const separa=rel=>{const L=rel.split("/").filter(Boolean);return [L.slice(0,-1),L[L.length-1]]};
    return {nome:raiz.name,tipo:"navegador",async sub(n){try{return await raiz.getDirectoryHandle(n)}catch(e){return null}},
      async ler(rel){try{const [ps,n]=separa(rel),d=await dir(ps,false),f=await (await d.getFileHandle(n)).getFile();return {texto:await f.text(),quando:f.lastModified}}catch(e){return null}},
      async lerBin(rel){try{const [ps,n]=separa(rel),d=await dir(ps,false);return await (await d.getFileHandle(n)).getFile()}catch(e){return null}},
      async quando(rel){try{const [ps,n]=separa(rel),d=await dir(ps,false);return (await (await d.getFileHandle(n)).getFile()).lastModified||0}catch(e){return null}},
      async gravar(rel,dados){const [ps,n]=separa(rel),d=await dir(ps,true),h=await d.getFileHandle(n,{create:true}),w=await h.createWritable();await w.write(dados);await w.close()},
      async apagar(rel){try{const [ps,n]=separa(rel),d=await dir(ps,false);await d.removeEntry(n)}catch(e){}},
      async listar(filtro,semStat){const out=[];const anda=async(d,pre)=>{for await(const [n,h] of d.entries()){if(n.startsWith(".")&&n!==".atlas")continue;if(h.kind==="directory"){if(n===".atlas"||filtro&&!pre&&PESADAS.has(n))continue;await anda(h,pre+n+"/")}else{if(filtro&&!filtro(pre+n))continue;const f=semStat?null:await h.getFile();out.push({rel:pre+n,quando:f?f.lastModified:0})}}};await anda(raiz,"");return out},
      async permissao(pedir){const o={mode:"readwrite"};if((await raiz.queryPermission(o))==="granted")return true;return pedir?(await raiz.requestPermission(o))==="granted":false}}}

  // ---------- disco: app instalado (Tauri 2, plugin fs) ----------
  function discoTauri(base){
    const T=tauri(),fs=T.fs,abs=rel=>base.replace(/[\\/]+$/,"")+"/"+rel;
    return {nome:base.split(/[\\/]/).filter(Boolean).pop()||base,tipo:"app",caminho:base,async sub(){return null},
      async ler(rel){try{const p=abs(rel);if(!(await fs.exists(p)))return null;const st=await fs.stat(p);return {texto:await fs.readTextFile(p),quando:st.mtime?+new Date(st.mtime):0}}catch(e){return null}},
      async lerBin(rel){try{const u=await fs.readFile(abs(rel));return new Blob([u])}catch(e){return null}},
      async quando(rel){try{const p=abs(rel);if(!(await fs.exists(p)))return null;const st=await fs.stat(p);return st.mtime?+new Date(st.mtime):0}catch(e){return null}},
      async gravar(rel,dados){const p=abs(rel),d=p.slice(0,p.lastIndexOf("/"));await fs.mkdir(d,{recursive:true}).catch(()=>{});if(typeof dados==="string")await fs.writeTextFile(p,dados);else await fs.writeFile(p,new Uint8Array(await new Blob([dados]).arrayBuffer()))},
      async apagar(rel){try{await fs.remove(abs(rel))}catch(e){}},
      async listar(filtro,semStat){const out=[];const anda=async(rel)=>{let L=[];try{L=await fs.readDir(rel?abs(rel):base)}catch(e){return}for(const x of L){const n=x.name;if(n.startsWith("."))continue;const r=rel?rel+"/"+n:n;if(x.isDirectory){if(filtro&&!rel&&PESADAS.has(n))continue;await anda(r)}else{if(filtro&&!filtro(r))continue;let q=0;if(!semStat)try{const st=await fs.stat(abs(r));q=st.mtime?+new Date(st.mtime):0}catch(e){}out.push({rel:r,quando:q})}}};await anda("");return out},
      async permissao(){return true}}}

  // ---------- o mundo ----------
  let D=null,IND={notas:{},mapas:{},versao:1},fila=Promise.resolve(),gravandoIdx=null,VISTO=new Map(),TXT=new Map();
  // 1.35.1: antes de gravar, confere se o arquivo mudou por fora desde a ultima leitura; se mudou, o disco ganha
  // (a versao da memoria vai para a lixeira) e o app recebe a versao nova por API.aoMudarFora
  const ehMesmo=(rel,texto)=>TXT.has(rel)&&TXT.get(rel)===texto;
  async function gravaSeguro(rel,txt,tipo,id){const q0=VISTO.get(rel);if(q0!=null&&D.quando){const q=await D.quando(rel);if(q&&q>q0+1000){const t=await D.ler(rel);
        if(t&&!ehMesmo(rel,t.texto)&&t.texto!==txt){await D.gravar(juntaP(LIXO,Date.now()+"-conflito-"+rel.split("/").pop()),txt).catch(()=>{});VISTO.set(rel,t.quando||q);TXT.set(rel,t.texto);
          if(API.aoMudarFora)try{API.aoMudarFora(tipo,id,rel,t.texto)}catch(e){console.warn(e)}return false}}}
    await D.gravar(rel,txt);TXT.set(rel,txt);const q2=D.quando?await D.quando(rel):null;if(q2)VISTO.set(rel,q2);return true}
  const relev=rel=>/\.(md|canvas)$/i.test(rel)||/\.atlasmapa\.json$/i.test(rel),PESADAS=new Set(["Assets","Backups"]);let LIMG=null;
  const salvaIndice=()=>{clearTimeout(gravandoIdx);gravandoIdx=setTimeout(()=>{fila=fila.then(()=>D&&D.gravar(IDX,JSON.stringify(IND,null,1))).catch(e=>console.warn("indice",e))},400)};
  const caminhoNota=o=>juntaP((o.folder||"").split("/").filter(x=>x.trim()).map(safe).join("/"),safe(o.title)+(o.kind==="canvas"?".canvas":".md"));
  const caminhoMapa=m=>juntaP(MAPAS,safe(m.name||m.id)+".atlasmapa.json");
  const extraNota=o=>{const e={};for(const k in o)if(k!=="content"&&k!=="canvas")e[k]=o[k];return e};
  const uidN=()=>"n"+Date.now().toString(36)+Math.random().toString(36).slice(2,7);

  const API={
    suporta:()=>{if(tauri())return true;let solto=true;try{solto=window.self===window.top}catch(e){solto=false}return solto&&typeof window.showDirectoryPicker==="function"},
    noApp:()=>!!tauri(),
    // 1.54: no celular cada mundo e uma pasta dentro do app (nao ha seletor de pastas); no PC o padrao e Documentos/Atlas
    interno:()=>!!tauri()&&/Android/.test(navigator.userAgent),
    async basePadrao(){const T=tauri();if(!T||!T.path)return null;const j=(a,b)=>a.replace(/[\\/]+$/,"")+"/"+b;if(API.interno())return j(await T.path.appDataDir(),"Mundos");try{return j(await T.path.documentDir(),"Atlas/Mundos")}catch(e){return j(await T.path.homeDir(),"Atlas/Mundos")}},
    // cria a pasta de um mundo novo (base: a padrao ou a escolhida) e abre; nome repetido ganha " 2", " 3"...
    async criarEm(nome,base){const T=tauri();if(!T)throw new Error("Só no app do Atlas.");base=base||await API.basePadrao();const lim=String(nome||"Mundo").replace(/[\\/:*?"<>|]+/g,"-").replace(/\s+/g," ").trim().slice(0,80)||"Mundo";let p=base.replace(/[\\/]+$/,"")+"/"+lim,k=2;
      while(await T.fs.exists(p).catch(()=>false)){const L=await T.fs.readDir(p).catch(()=>[]);if(!L.length)break;p=base.replace(/[\\/]+$/,"")+"/"+lim+" "+(k++)}
      await T.fs.mkdir(p,{recursive:true});D=discoTauri(p);localStorage.setItem("atlas:pasta",p);await guardaRecente(D.nome,p);return {nome:D.nome,caminho:p}},
    // escolhe so o lugar (pasta-mae) no PC
    async escolheLugar(){const T=tauri();if(!T||!T.dialog||API.interno())return null;const p=await T.dialog.open({directory:true,multiple:false,title:"Onde guardar o mundo novo"});return p?String(p):null},
    atual:()=>D?{nome:D.nome,tipo:D.tipo,chave:D.caminho||D.nome}:null,
    // escolher a pasta (precisa de um clique do usuario no navegador)
    async escolher(titulo){if(API.interno()){const n=API.pedeNome?await API.pedeNome(titulo):"Mundo";if(!n)return null;return (await API.criarEm(n)).nome}
      if(tauri()){const T=tauri(),dl=T.dialog;if(!dl)throw new Error("O seletor de pastas não está disponível.");const p=await dl.open({directory:true,multiple:false,title:titulo||"Escolha a pasta do mundo"});if(!p)return null;D=discoTauri(String(p));localStorage.setItem("atlas:pasta",String(p));await guardaRecente(D.nome,String(p));return D.nome}
      if(typeof window.showDirectoryPicker!=="function")throw new Error("Este navegador não abre pastas. Use o Chrome, o Edge ou o app do Atlas.");
      const h=await window.showDirectoryPicker({id:"atlas-mundo",mode:"readwrite"});D=discoFSA(h);await kv("atual",h);await guardaRecente(D.nome,null,h);return D.nome},
    // a pasta da ultima vez (no navegador so volta com um clique, por causa da permissao)
    async ultima(){if(tauri()){const p=localStorage.getItem("atlas:pasta");return p?{nome:p.split(/[\\/]/).filter(Boolean).pop(),pronta:true}:null}
      try{const h=await kv("atual");if(!h)return null;const d=discoFSA(h);return {nome:h.name,pronta:await d.permissao(false)}}catch(e){return null}},
    async reabrir(pedir){if(tauri()){const p=localStorage.getItem("atlas:pasta");if(!p)return false;D=discoTauri(p);return true}
      const h=await kv("atual");if(!h)return false;const d=discoFSA(h);if(!(await d.permissao(pedir)))return false;D=d;return true},
    async fechar(){D=null;if(tauri())localStorage.removeItem("atlas:pasta");else await kv("atual",null)},
    recentes:async()=>{try{return (await kv("recentes"))||[]}catch(e){return []}},
    chaveRecente:chaveR,
    // muda a ficha de um mundo da lista (patch); null tira da lista (nao apaga a pasta)
    atualizaRecente:(k,patch)=>mexeRecente(k,r=>Object.assign({},r,patch)),
    removeRecente:k=>mexeRecente(k,()=>null),
    // ficha do mundo aberto, gravada na propria pasta (.atlas/mundo.json): vai junto com a pasta (Drive, outro PC)
    async meta(){if(!D)return null;try{const r=await D.ler(".atlas/mundo.json");return r&&r.texto?JSON.parse(r.texto):null}catch(e){return null}},
    async gravaMeta(o){if(!D)return false;try{await D.gravar(".atlas/mundo.json",JSON.stringify(o,null,1));return true}catch(e){return false}},
    // ficha de um mundo que nao esta aberto (so no app do PC, que grava direto na pasta)
    async gravaMetaEm(r,o){if(!(tauri()&&r&&r.caminho))return false;try{await discoTauri(r.caminho).gravar(".atlas/mundo.json",JSON.stringify(o,null,1));return true}catch(e){return false}},
    async abrirRecente(r){if(tauri()&&r.caminho){D=discoTauri(r.caminho);localStorage.setItem("atlas:pasta",r.caminho);return true}if(r.h){const d=discoFSA(r.h);if(!(await d.permissao(true)))return false;D=d;await kv("atual",r.h);return true}return false},

    // le tudo: notas (.md e .canvas, inclusive as criadas fora do Atlas) e mapas
    // subpasta do mundo (no Chrome): o Modo Batalha olha a "Assets" para achar os pacotes de arte
    subpasta:async n=>D&&D.sub?D.sub(n):null,
    async carregar(){if(!D)throw new Error("Nenhuma pasta aberta.");if(!(await D.ler("Assets/LEIA.txt")))D.gravar("Assets/LEIA.txt",LEIA_ASSETS).catch(()=>{});const r=await D.ler(IDX);IND=r?Object.assign({notas:{},mapas:{},versao:1},JSON.parse(r.texto||"{}")):{notas:{},mapas:{},versao:1};
      const arqs=await D.listar(),porCaminho=new Map();for(const [id,x] of Object.entries(IND.notas))porCaminho.set(x.caminho,id);
      const notas=[],mapas=[],vistos=new Set();
      for(const a of arqs){if(/\.atlasmapa\.json$/i.test(a.rel)){const t=await D.ler(a.rel);try{const m=JSON.parse(t.texto);if(m&&m.id){mapas.push(m);IND.mapas[m.id]={caminho:a.rel}}}catch(e){}continue}
        if(!/\.(md|canvas)$/i.test(a.rel))continue;const t=await D.ler(a.rel);if(!t)continue;TXT.set(a.rel,t.texto);let id=porCaminho.get(a.rel),ex=id?IND.notas[id].extra||{}:null;
        const partes=a.rel.split("/"),arq=partes.pop(),titulo=arq.replace(/\.(md|canvas)$/i,""),pasta=partes.join("/");
        if(!id){id=uidN();ex={id,title:titulo,folder:pasta,updated:a.quando||Date.now()}}
        const o=Object.assign({},ex,{id,title:ex.title||titulo,folder:ex.folder!=null?ex.folder:pasta});
        if(/\.canvas$/i.test(a.rel)){o.kind="canvas";try{const C=JSON.parse(t.texto||"{}");o.canvas={nodes:C.nodes||[],edges:C.edges||[]}}catch(e){o.canvas={nodes:[],edges:[]}}o.content=o.content||""}else o.content=t.texto.replace(/\r/g,"");
        if(a.quando&&(!o.updated||a.quando>o.updated+2000))o.updated=a.quando;IND.notas[id]={caminho:a.rel,extra:extraNota(o)};vistos.add(id);notas.push(o)}
      for(const id of Object.keys(IND.notas))if(!vistos.has(id))delete IND.notas[id];salvaIndice();VISTO=new Map(arqs.filter(a=>relev(a.rel)).map(a=>[a.rel,a.quando]));return {notas,mapas,nome:D.nome}},
    // o que mudou na pasta desde a ultima olhada (outro programa: Google Drive para computador, Obsidian, o Claude pelo Drive)
    async verifica(){if(!D)return null;const arqs=await D.listar(relev),agora=new Map(arqs.map(a=>[a.rel,a.quando])),R={notas:[],mapas:[],apagadas:[],mapasApagados:[]};
      const porCaminho=new Map();for(const [id,x] of Object.entries(IND.notas))porCaminho.set(x.caminho,id);const mapaPorCaminho=new Map();for(const [id,x] of Object.entries(IND.mapas))mapaPorCaminho.set(x.caminho,id);
      for(const [rel,q] of agora){const v=VISTO.get(rel);if(v!=null&&(!q||v===q))continue;const t=await D.ler(rel);if(!t)continue;if(ehMesmo(rel,t.texto))continue;TXT.set(rel,t.texto);
        if(/\.atlasmapa\.json$/i.test(rel)){try{const m=JSON.parse(t.texto);if(m&&m.id){IND.mapas[m.id]={caminho:rel};R.mapas.push({m,texto:t.texto})}}catch(e){}continue}
        let id=porCaminho.get(rel),ex=id?IND.notas[id].extra||{}:null;const partes=rel.split("/"),arq=partes.pop(),titulo=arq.replace(/\.(md|canvas)$/i,""),pasta=partes.join("/");
        if(!id){id=uidN();ex={id,title:titulo,folder:pasta}}const o=Object.assign({},ex,{id,title:ex.title||titulo,folder:ex.folder!=null?ex.folder:pasta,updated:t.quando||Date.now()});
        if(/\.canvas$/i.test(rel)){o.kind="canvas";try{const C=JSON.parse(t.texto||"{}");o.canvas={nodes:C.nodes||[],edges:C.edges||[]}}catch(e){continue}o.content=o.content||""}else o.content=t.texto.replace(/\r/g,"");
        IND.notas[id]={caminho:rel,extra:extraNota(o)};R.notas.push(o)}
      for(const rel of VISTO.keys()){if(agora.has(rel))continue;const id=porCaminho.get(rel);if(id){R.apagadas.push(id);delete IND.notas[id]}const mi=mapaPorCaminho.get(rel);if(mi){R.mapasApagados.push(mi);delete IND.mapas[mi]}}
      VISTO=agora;if(R.notas.length||R.mapas.length||R.apagadas.length||R.mapasApagados.length)salvaIndice();return R},

    // rele uma nota do disco se o arquivo for mais novo que a ultima leitura; devolve {texto} ou null
    async releNota(id){if(!D||!D.quando)return null;const x=IND.notas[id];if(!x)return null;const rel=x.caminho,q0=VISTO.get(rel),q=await D.quando(rel);if(!q||(q0!=null&&q<=q0+1000))return null;const t=await D.ler(rel);if(!t)return null;VISTO.set(rel,t.quando||q);if(ehMesmo(rel,t.texto))return null;TXT.set(rel,t.texto);return {texto:t.texto,canvas:/\.canvas$/i.test(rel)}},
    gravaNota(o){if(!D)return Promise.resolve();const novo=caminhoNota(o),velho=IND.notas[o.id]&&IND.notas[o.id].caminho;IND.notas[o.id]={caminho:novo,extra:extraNota(o)};salvaIndice();
      const txt=o.kind==="canvas"?JSON.stringify(o.canvas||{nodes:[],edges:[]},null,1):(o.content||"");
      return fila=fila.then(async()=>{const ok=await gravaSeguro(velho&&velho!==novo?velho:novo,txt,"nota",o.id);if(!ok)return;if(velho&&velho!==novo){await D.gravar(novo,txt);TXT.set(novo,txt);const q=D.quando?await D.quando(novo):null;if(q)VISTO.set(novo,q);await D.apagar(velho);VISTO.delete(velho);TXT.delete(velho)}})},
    apagaNota(o){if(!D)return Promise.resolve();const x=IND.notas[o.id];delete IND.notas[o.id];salvaIndice();if(!x)return Promise.resolve();
      return fila=fila.then(async()=>{const t=await D.ler(x.caminho);if(t)await D.gravar(juntaP(LIXO,Date.now()+"-"+x.caminho.split("/").pop()),t.texto);await D.apagar(x.caminho)})},
    gravaMapa(m){if(!D)return Promise.resolve();const novo=caminhoMapa(m),velho=IND.mapas[m.id]&&IND.mapas[m.id].caminho;IND.mapas[m.id]={caminho:novo};salvaIndice();
      const txtM=JSON.stringify(m);return fila=fila.then(async()=>{const ok=await gravaSeguro(velho&&velho!==novo?velho:novo,txtM,"mapa",m.id);if(!ok)return;if(velho&&velho!==novo){await D.gravar(novo,txtM);TXT.set(novo,txtM);await D.apagar(velho);VISTO.delete(velho);TXT.delete(velho)}})},
    apagaMapa(m){if(!D)return Promise.resolve();const x=IND.mapas[m.id];delete IND.mapas[m.id];salvaIndice();if(!x)return Promise.resolve();
      return fila=fila.then(async()=>{const t=await D.ler(x.caminho);if(t)await D.gravar(juntaP(LIXO,Date.now()+"-"+x.caminho.split("/").pop()),t.texto);await D.apagar(x.caminho)})},
    // arquivos soltos (imagens, mapas de batalha): caminho relativo dentro do mundo
    gravaArquivo:(rel,dados)=>D?(fila=fila.then(()=>D.gravar(rel,dados))):Promise.resolve(),
    leArquivo:rel=>D?D.lerBin(rel):Promise.resolve(null),
    // imagem por nome de arquivo (![[Retrato.png]]): procura em qualquer subpasta, a comecar por Imagens/
    async achaArquivo(nome){if(!D||!nome)return null;if(!LIMG||Date.now()-LIMG.t>15000)LIMG={t:Date.now(),L:(await D.listar(r=>/\.(png|jpe?g|webp|gif|avif)$/i.test(r),true)).map(a=>a.rel)};const q=String(nome).replace(/\\/g,"/").toLowerCase(),fim=q.includes("/")?q:"/"+q;
      const c=LIMG.L.filter(r=>("/"+r.toLowerCase()).endsWith(fim));return c.sort((a,b)=>(b.toLowerCase().startsWith("imagens/")-a.toLowerCase().startsWith("imagens/"))||a.length-b.length)[0]||null},
    apagaArquivo:rel=>D?(fila=fila.then(()=>D.apagar(rel))):Promise.resolve(),
    espera:()=>fila,
    // para testes: usar um disco em memoria
    _disco:d=>{D=d},_usarHandle:h=>{D=discoFSA(h);return D.nome}
  };
  // 1.51: lista de mundos (biblioteca): guarda tambem a ficha de cada um (titulo, cor, icone, etiquetas, fixado, arquivado, contagens)
  function chaveR(r){return r.caminho||r.nome}
  async function guardaRecente(nome,caminho,h){try{let L=(await kv("recentes"))||[];const k=caminho||nome,ant=L.find(r=>chaveR(r)===k)||{};L=L.filter(r=>chaveR(r)!==k);L.unshift(Object.assign({},ant,{nome,caminho,h:h||ant.h,quando:Date.now()}));await kv("recentes",L.slice(0,60))}catch(e){}}
  async function mexeRecente(k,fn){try{let L=(await kv("recentes"))||[];const i=L.findIndex(r=>chaveR(r)===k);if(i<0)return false;const r=fn(L[i]);if(r===null)L.splice(i,1);else L[i]=r;await kv("recentes",L);return true}catch(e){return false}}
  window.AtlasPasta=API;
})();
