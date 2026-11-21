// Atlas - mundo numa pasta do PC (como o Obsidian). Notas viram .md, quadros .canvas, mapas .atlasmapa.json.
// Dois jeitos de mexer em arquivos: a API de pastas do Chrome/Edge (File System Access) e o app instalado (Tauri).
// O que o arquivo .md nao guarda (id, pasta das imagens, tipo) fica em .atlas/indice.json.
(function(){
  "use strict";
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
    return {nome:raiz.name,tipo:"navegador",
      async ler(rel){try{const [ps,n]=separa(rel),d=await dir(ps,false),f=await (await d.getFileHandle(n)).getFile();return {texto:await f.text(),quando:f.lastModified}}catch(e){return null}},
      async lerBin(rel){try{const [ps,n]=separa(rel),d=await dir(ps,false);return await (await d.getFileHandle(n)).getFile()}catch(e){return null}},
      async gravar(rel,dados){const [ps,n]=separa(rel),d=await dir(ps,true),h=await d.getFileHandle(n,{create:true}),w=await h.createWritable();await w.write(dados);await w.close()},
      async apagar(rel){try{const [ps,n]=separa(rel),d=await dir(ps,false);await d.removeEntry(n)}catch(e){}},
      async listar(){const out=[];const anda=async(d,pre)=>{for await(const [n,h] of d.entries()){if(n.startsWith(".")&&n!==".atlas")continue;if(h.kind==="directory"){if(n===".atlas")continue;await anda(h,pre+n+"/")}else{const f=await h.getFile();out.push({rel:pre+n,quando:f.lastModified})}}};await anda(raiz,"");return out},
      async permissao(pedir){const o={mode:"readwrite"};if((await raiz.queryPermission(o))==="granted")return true;return pedir?(await raiz.requestPermission(o))==="granted":false}}}

  // ---------- disco: app instalado (Tauri 2, plugin fs) ----------
  function discoTauri(base){
    const T=tauri(),fs=T.fs,abs=rel=>base.replace(/[\\/]+$/,"")+"/"+rel;
    return {nome:base.split(/[\\/]/).filter(Boolean).pop()||base,tipo:"app",caminho:base,
      async ler(rel){try{const p=abs(rel);if(!(await fs.exists(p)))return null;const st=await fs.stat(p);return {texto:await fs.readTextFile(p),quando:st.mtime?+new Date(st.mtime):0}}catch(e){return null}},
      async lerBin(rel){try{const u=await fs.readFile(abs(rel));return new Blob([u])}catch(e){return null}},
      async gravar(rel,dados){const p=abs(rel),d=p.slice(0,p.lastIndexOf("/"));await fs.mkdir(d,{recursive:true}).catch(()=>{});if(typeof dados==="string")await fs.writeTextFile(p,dados);else await fs.writeFile(p,new Uint8Array(await new Blob([dados]).arrayBuffer()))},
      async apagar(rel){try{await fs.remove(abs(rel))}catch(e){}},
      async listar(){const out=[];const anda=async(rel)=>{let L=[];try{L=await fs.readDir(rel?abs(rel):base)}catch(e){return}for(const x of L){const n=x.name;if(n.startsWith("."))continue;const r=rel?rel+"/"+n:n;if(x.isDirectory)await anda(r);else{let q=0;try{const st=await fs.stat(abs(r));q=st.mtime?+new Date(st.mtime):0}catch(e){}out.push({rel:r,quando:q})}}};await anda("");return out},
      async permissao(){return true}}}

  // ---------- o mundo ----------
  let D=null,IND={notas:{},mapas:{},versao:1},fila=Promise.resolve(),gravandoIdx=null;
  const salvaIndice=()=>{clearTimeout(gravandoIdx);gravandoIdx=setTimeout(()=>{fila=fila.then(()=>D&&D.gravar(IDX,JSON.stringify(IND,null,1))).catch(e=>console.warn("indice",e))},400)};
  const caminhoNota=o=>juntaP((o.folder||"").split("/").map(safe).join("/"),safe(o.title)+(o.kind==="canvas"?".canvas":".md"));
  const caminhoMapa=m=>juntaP(MAPAS,safe(m.name||m.id)+".atlasmapa.json");
  const extraNota=o=>{const e={};for(const k in o)if(k!=="content"&&k!=="canvas")e[k]=o[k];return e};
  const uidN=()=>"n"+Date.now().toString(36)+Math.random().toString(36).slice(2,7);

  const API={
    suporta:()=>!!tauri()||typeof window.showDirectoryPicker==="function",
    noApp:()=>!!tauri(),
    atual:()=>D?{nome:D.nome,tipo:D.tipo}:null,
    // escolher a pasta (precisa de um clique do usuario no navegador)
    async escolher(){if(tauri()){const T=tauri(),dl=T.dialog;if(!dl)throw new Error("Sem o diálogo de pastas no app.");const p=await dl.open({directory:true,multiple:false,title:"Escolha a pasta do mundo"});if(!p)return null;D=discoTauri(String(p));localStorage.setItem("atlas:pasta",String(p));await guardaRecente(D.nome,String(p));return D.nome}
      if(typeof window.showDirectoryPicker!=="function")throw new Error("Este navegador não abre pastas. Use o Chrome, o Edge ou o app do Atlas.");
      const h=await window.showDirectoryPicker({id:"atlas-mundo",mode:"readwrite"});D=discoFSA(h);await kv("atual",h);await guardaRecente(D.nome,null,h);return D.nome},
    // a pasta da ultima vez (no navegador so volta com um clique, por causa da permissao)
    async ultima(){if(tauri()){const p=localStorage.getItem("atlas:pasta");return p?{nome:p.split(/[\\/]/).filter(Boolean).pop(),pronta:true}:null}
      try{const h=await kv("atual");if(!h)return null;const d=discoFSA(h);return {nome:h.name,pronta:await d.permissao(false)}}catch(e){return null}},
    async reabrir(pedir){if(tauri()){const p=localStorage.getItem("atlas:pasta");if(!p)return false;D=discoTauri(p);return true}
      const h=await kv("atual");if(!h)return false;const d=discoFSA(h);if(!(await d.permissao(pedir)))return false;D=d;return true},
    async fechar(){D=null;if(tauri())localStorage.removeItem("atlas:pasta");else await kv("atual",null)},
    recentes:async()=>{try{return (await kv("recentes"))||[]}catch(e){return []}},
    async abrirRecente(r){if(tauri()&&r.caminho){D=discoTauri(r.caminho);localStorage.setItem("atlas:pasta",r.caminho);return true}if(r.h){const d=discoFSA(r.h);if(!(await d.permissao(true)))return false;D=d;await kv("atual",r.h);return true}return false},

    // le tudo: notas (.md e .canvas, inclusive as criadas fora do Atlas) e mapas
    async carregar(){if(!D)throw new Error("Nenhuma pasta aberta.");const r=await D.ler(IDX);IND=r?Object.assign({notas:{},mapas:{},versao:1},JSON.parse(r.texto||"{}")):{notas:{},mapas:{},versao:1};
      const arqs=await D.listar(),porCaminho=new Map();for(const [id,x] of Object.entries(IND.notas))porCaminho.set(x.caminho,id);
      const notas=[],mapas=[],vistos=new Set();
      for(const a of arqs){if(/\.atlasmapa\.json$/i.test(a.rel)){const t=await D.ler(a.rel);try{const m=JSON.parse(t.texto);if(m&&m.id){mapas.push(m);IND.mapas[m.id]={caminho:a.rel}}}catch(e){}continue}
        if(!/\.(md|canvas)$/i.test(a.rel))continue;const t=await D.ler(a.rel);if(!t)continue;let id=porCaminho.get(a.rel),ex=id?IND.notas[id].extra||{}:null;
        const partes=a.rel.split("/"),arq=partes.pop(),titulo=arq.replace(/\.(md|canvas)$/i,""),pasta=partes.join("/");
        if(!id){id=uidN();ex={id,title:titulo,folder:pasta,updated:a.quando||Date.now()}}
        const o=Object.assign({},ex,{id,title:ex.title||titulo,folder:ex.folder!=null?ex.folder:pasta});
        if(/\.canvas$/i.test(a.rel)){o.kind="canvas";try{const C=JSON.parse(t.texto||"{}");o.canvas={nodes:C.nodes||[],edges:C.edges||[]}}catch(e){o.canvas={nodes:[],edges:[]}}o.content=o.content||""}else o.content=t.texto.replace(/\r/g,"");
        if(a.quando&&(!o.updated||a.quando>o.updated+2000))o.updated=a.quando;IND.notas[id]={caminho:a.rel,extra:extraNota(o)};vistos.add(id);notas.push(o)}
      for(const id of Object.keys(IND.notas))if(!vistos.has(id))delete IND.notas[id];salvaIndice();return {notas,mapas,nome:D.nome}},

    gravaNota(o){if(!D)return Promise.resolve();const novo=caminhoNota(o),velho=IND.notas[o.id]&&IND.notas[o.id].caminho;IND.notas[o.id]={caminho:novo,extra:extraNota(o)};salvaIndice();
      const txt=o.kind==="canvas"?JSON.stringify(o.canvas||{nodes:[],edges:[]},null,1):(o.content||"");
      return fila=fila.then(async()=>{await D.gravar(novo,txt);if(velho&&velho!==novo)await D.apagar(velho)})},
    apagaNota(o){if(!D)return Promise.resolve();const x=IND.notas[o.id];delete IND.notas[o.id];salvaIndice();if(!x)return Promise.resolve();
      return fila=fila.then(async()=>{const t=await D.ler(x.caminho);if(t)await D.gravar(juntaP(LIXO,Date.now()+"-"+x.caminho.split("/").pop()),t.texto);await D.apagar(x.caminho)})},
    gravaMapa(m){if(!D)return Promise.resolve();const novo=caminhoMapa(m),velho=IND.mapas[m.id]&&IND.mapas[m.id].caminho;IND.mapas[m.id]={caminho:novo};salvaIndice();
      return fila=fila.then(async()=>{await D.gravar(novo,JSON.stringify(m));if(velho&&velho!==novo)await D.apagar(velho)})},
    apagaMapa(m){if(!D)return Promise.resolve();const x=IND.mapas[m.id];delete IND.mapas[m.id];salvaIndice();if(!x)return Promise.resolve();
      return fila=fila.then(async()=>{const t=await D.ler(x.caminho);if(t)await D.gravar(juntaP(LIXO,Date.now()+"-"+x.caminho.split("/").pop()),t.texto);await D.apagar(x.caminho)})},
    // arquivos soltos (imagens, mapas de batalha): caminho relativo dentro do mundo
    gravaArquivo:(rel,dados)=>D?(fila=fila.then(()=>D.gravar(rel,dados))):Promise.resolve(),
    leArquivo:rel=>D?D.lerBin(rel):Promise.resolve(null),
    apagaArquivo:rel=>D?(fila=fila.then(()=>D.apagar(rel))):Promise.resolve(),
    espera:()=>fila,
    // para testes: usar um disco em memoria
    _disco:d=>{D=d}
  };
  async function guardaRecente(nome,caminho,h){try{let L=(await kv("recentes"))||[];L=L.filter(r=>!(caminho?r.caminho===caminho:r.nome===nome));L.unshift({nome,caminho,h,quando:Date.now()});await kv("recentes",L.slice(0,8))}catch(e){}}
  window.AtlasPasta=API;
})();
