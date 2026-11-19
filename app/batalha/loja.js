// Atlas - Modo Batalha: armazenamento local grande (IndexedDB). Um registro por mapa: {id, nome, mapa, salvo}.
const BANCO="atlas-batalha",LOJA="mapas";let pdb=null;
const abre=()=>pdb||(pdb=new Promise((ok,er)=>{const r=indexedDB.open(BANCO,1);r.onupgradeneeded=()=>r.result.createObjectStore(LOJA,{keyPath:"id"});r.onsuccess=()=>ok(r.result);r.onerror=()=>er(r.error)}));
const tx=async(modo,fn)=>{const db=await abre();return new Promise((ok,er)=>{const t=db.transaction(LOJA,modo),q=fn(t.objectStore(LOJA));t.oncomplete=()=>ok(q&&q.result);t.onerror=()=>er(t.error)})};
export const salvar=(id,nome,mapa)=>tx("readwrite",s=>s.put({id,nome,mapa,salvo:Date.now()}));
export const ler=id=>tx("readonly",s=>s.get(id));
export const apagar=id=>tx("readwrite",s=>s.delete(id));
export const listar=()=>tx("readonly",s=>s.getAll()).then(L=>(L||[]).map(r=>({id:r.id,nome:r.nome,salvo:r.salvo})));
