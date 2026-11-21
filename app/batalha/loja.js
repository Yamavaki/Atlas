// Atlas - Modo Batalha: armazenamento local grande (IndexedDB). Um registro por mapa: {id, nome, mapa, salvo}.
const BANCO="atlas-batalha",LOJA="mapas";let pdb=null;
const abre=()=>pdb||(pdb=new Promise((ok,er)=>{const r=indexedDB.open(BANCO,1);r.onupgradeneeded=()=>r.result.createObjectStore(LOJA,{keyPath:"id"});r.onsuccess=()=>ok(r.result);r.onerror=()=>er(r.error)}));
const tx=async(modo,fn)=>{const db=await abre();return new Promise((ok,er)=>{const t=db.transaction(LOJA,modo),q=fn(t.objectStore(LOJA));t.oncomplete=()=>ok(q&&q.result);t.onerror=()=>er(t.error)})};
// com o mundo numa pasta, o mapa vai tambem para Mapas/Batalha/<id>.atlasmap (gravado com atraso: o editor salva a cada mudanca)
const naPasta=()=>window.AtlasPasta&&window.AtlasApp&&window.AtlasApp.Store&&window.AtlasApp.Store.pasta,arq=id=>"Mapas/Batalha/"+id+".atlasmap",tempos=new Map();
const b64=u8=>{let s="";for(let i=0;i<u8.length;i+=0x8000)s+=String.fromCharCode.apply(null,u8.subarray(i,i+0x8000));return btoa(s)};
const deB64=s=>{const b=atob(s),u=new Uint8Array(b.length);for(let i=0;i<b.length;i++)u[i]=b.charCodeAt(i);return u};
const paraPasta=(id,nome,mapa)=>{clearTimeout(tempos.get(id));tempos.set(id,setTimeout(()=>{tempos.delete(id);window.AtlasPasta.gravaArquivo(arq(id),JSON.stringify({id,nome,salvo:Date.now(),mapa},(k,v)=>v instanceof Uint8Array?{$b64:b64(v)}:v)).catch(e=>console.warn("batalha na pasta",e))},2000))};
export const salvar=(id,nome,mapa)=>{if(naPasta())paraPasta(id,nome,mapa);return tx("readwrite",s=>s.put({id,nome,mapa,salvo:Date.now()}))};
export const ler=async id=>{const r=await tx("readonly",s=>s.get(id));if(!naPasta())return r;try{const f=await window.AtlasPasta.leArquivo(arq(id));if(!f)return r;const o=JSON.parse(await f.text(),(k,v)=>v&&typeof v==="object"&&typeof v.$b64==="string"?deB64(v.$b64):v);if(!r||o.salvo>r.salvo+1000){await tx("readwrite",s=>s.put(o));return o}}catch(e){console.warn("batalha da pasta",e)}return r};
export const apagar=id=>{if(naPasta())window.AtlasPasta.apagaArquivo(arq(id));return tx("readwrite",s=>s.delete(id))};
export const listar=()=>tx("readonly",s=>s.getAll()).then(L=>(L||[]).map(r=>({id:r.id,nome:r.nome,salvo:r.salvo})));
