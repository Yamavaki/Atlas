// Atlas - no app instalado (Tauri), le arquivos grandes do PC (pacotes .dungeondraft_pack) aos pedacos, sem carregar o arquivo inteiro.
// Imita o File do navegador: size, lastModified, slice(ini,fim,tipo) -> pedaco com arrayBuffer(). O createImageBitmap aceita o pedaco.
(function(){
  "use strict";
  const T=()=>window.__TAURI__&&window.__TAURI__.fs?window.__TAURI__:null;
  if(!T())return;
  const fs=T().fs,FIM=(fs.SeekMode&&fs.SeekMode.Start)!=null?fs.SeekMode.Start:0;
  // um arquivo aberto por pacote; as leituras de um mesmo arquivo vao em fila (seek + read nao podem se misturar)
  const abertos=new Map();
  const le=(caminho,ini,fim)=>{let a=abertos.get(caminho);if(!a){a={h:null,fila:Promise.resolve()};abertos.set(caminho,a)}
    const p=a.fila.then(async()=>{if(!a.h)a.h=await fs.open(caminho,{read:true});await a.h.seek(ini,FIM);const n=Math.max(0,fim-ini),buf=new Uint8Array(n);let pos=0;
      while(pos<n){const r=await a.h.read(buf.subarray(pos));if(!r)break;pos+=r}return pos<n?buf.slice(0,pos):buf});
    a.fila=p.catch(()=>{});return p};
  class Pedaco{constructor(c,ini,fim,tipo){this.__lazy=true;this.c=c;this.ini=ini;this.fim=fim;this.size=fim-ini;this.type=tipo||""}
    async arrayBuffer(){const u=await le(this.c,this.ini,this.fim);return u.buffer.byteLength===u.byteLength?u.buffer:u.slice().buffer}
    async blob(){return new Blob([await le(this.c,this.ini,this.fim)],{type:this.type})}
    slice(a,b,tipo){a=a||0;b=b==null?this.size:b;return new Pedaco(this.c,this.ini+a,Math.min(this.fim,this.ini+b),tipo||this.type)}}
  class Arquivo{constructor(c,tam,mod){this.c=c;this.name=c.split(/[\\/]/).pop();this.size=tam;this.lastModified=mod||0}
    slice(a,b,tipo){a=a||0;b=b==null?this.size:Math.min(b,this.size);return new Pedaco(this.c,a,b,tipo)}
    async arrayBuffer(){return new Pedaco(this.c,0,this.size).arrayBuffer()}}
  // o createImageBitmap do navegador nao conhece o pedaco: le os bytes antes
  const orig=window.createImageBitmap.bind(window);window.createImageBitmap=(src,...r)=>src&&src.__lazy?src.blob().then(b=>orig(b,...r)):orig(src,...r);
  const junta=(a,b)=>a.replace(/[\\/]+$/,"")+"/"+b;
  const API={
    // todos os .dungeondraft_pack de uma pasta (e subpastas): [caminho relativo, () => arquivo]
    async pacotes(base){const out=[];const anda=async(rel)=>{let L=[];try{L=await fs.readDir(rel?junta(base,rel):base)}catch(e){return}for(const x of L){const n=x.name;if(!n||n.startsWith("."))continue;const r=rel?rel+"/"+n:n;
        if(x.isDirectory)await anda(r);else if(/\.dungeondraft_pack$/i.test(n)){const c=junta(base,r);out.push([r,async()=>{const st=await fs.stat(c);return new Arquivo(c,st.size,st.mtime?+new Date(st.mtime):0)}])}}};
      await anda("");out.sort((a,b)=>a[0].localeCompare(b[0]));return out},
    existe:async c=>{try{return await fs.exists(c)}catch(e){return false}},
    criaPasta:async(c,leia)=>{try{if(!(await fs.exists(c)))await fs.mkdir(c,{recursive:true});if(leia&&!(await fs.exists(junta(c,"LEIA.txt"))))await fs.writeTextFile(junta(c,"LEIA.txt"),leia)}catch(e){console.warn("pasta",c,e)}},
    // pastas onde o Atlas procura pacotes sozinho: Assets do mundo aberto e Documentos/Atlas/Assets
    async pastasPadrao(){const L=[];const mundo=localStorage.getItem("atlas:pasta");if(mundo)L.push(junta(mundo,"Assets"));try{const d=await T().path.documentDir();if(d)L.push(junta(junta(d,"Atlas"),"Assets"))}catch(e){}return L},
    junta};
  window.AtlasArquivoTauri=API;
  // primeira vez: cria Documentos/Atlas/Assets com um aviso do que por la
  (async()=>{try{const d=await T().path.documentDir();if(d)await API.criaPasta(junta(junta(d,"Atlas"),"Assets"),"Coloque nesta pasta seus pacotes de arte (.dungeondraft_pack).\nO Modo Batalha do Atlas carrega os pacotes desta pasta automaticamente ao abrir.\nPacotes cujos autores não permitem a leitura por outros programas são ignorados.\n")}catch(e){}})();
})();
