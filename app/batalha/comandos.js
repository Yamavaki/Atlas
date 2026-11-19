// Atlas - Modo Batalha: comandos. Toda mudanca no mapa e um lote de operacoes que sabe ser desfeito.
// Operacoes (dados puros, podem ser gravados ou enviados):
//   {op:"muda", a, k, id, de, para}   troca o estado de um item (a = andar, k = tipo)
//   {op:"cria", a, k, item, pos}      poe um item novo (pos = lugar na lista; sem pos vai para o fim)
//   {op:"apaga",a, k, item, pos}      tira um item
//   {op:"pos",  a, k, id, de, para}   muda o lugar na lista (quem vem depois fica por cima na mesma camada)
//   {op:"andar",a, de, para}          propriedades do andar (nome, ambiente, terreno)
//   {op:"mapa", de, para}             propriedades do mapa (larg, alt, grade)
import {poe} from "./modelo.js";
export function criaHistorico(M,aoMudar,limite){limite=limite||200;const feitos=[],desfeitos=[];
  // indice id -> item por andar e tipo (refeito quando a lista muda)
  const idx=new Map(),item=(a,k,id)=>{const ch=a+k;let m=idx.get(ch);if(!m){m=new Map();for(const e of M.andares[a][k])m.set(e.id,e);idx.set(ch,m)}return m.get(id)};
  // aplica uma operacao no sentido dado (1 = fazer, -1 = desfazer)
  function aplica(o,s){const A=o.a==null?null:M.andares[o.a];
    if(o.op==="muda"){const e=item(o.a,o.k,o.id);if(e)poe(e,s>0?o.para:o.de)}
    else if(o.op==="cria"||o.op==="apaga"){const poeItem=(o.op==="cria")===(s>0),L=A[o.k];idx.delete(o.a+o.k);if(poeItem){if(o.pos==null||o.pos>L.length)L.push(o.item);else L.splice(o.pos,0,o.item)}else{const i=L.indexOf(o.item);if(i>=0)L.splice(i,1)}}
    else if(o.op==="pos"){const L=A[o.k],i=L.indexOf(item(o.a,o.k,o.id));if(i>=0){const e=L.splice(i,1)[0];L.splice(Math.max(0,Math.min(L.length,s>0?o.para:o.de)),0,e)}}
    else if(o.op==="andar"){Object.assign(A,s>0?o.para:o.de);idx.clear()}
    else if(o.op==="mapa"){Object.assign(M,s>0?o.para:o.de);idx.clear()}
    // pintura da mascara de uma camada: so o retangulo mexido (ret = x, y, largura, altura em pixels da mascara)
    else if(o.op==="mascara"){const c=item(o.a,"camadas",o.id);if(c&&c.m){const [x,y,w,h]=o.ret,src=s>0?o.para:o.de;for(let j=0;j<h;j++)c.m.set(src.subarray(j*w,j*w+w),(y+j)*c.mw+x)}}}
  const roda=(lote,s)=>{const O=lote.ops;if(s>0)for(let i=0;i<O.length;i++)aplica(O[i],1);else for(let i=O.length-1;i>=0;i--)aplica(O[i],-1)};
  const guarda=lote=>{const u=feitos[feitos.length-1];
    // junta ajustes seguidos do mesmo campo (arrastar um controle) num passo so de desfazer
    if(lote.junta&&u&&u.junta===lote.junta&&u.ops.length===lote.ops.length&&lote.t-u.t<900&&u.ops.every((o,i)=>o.op===lote.ops[i].op&&o.id===lote.ops[i].id&&o.a===lote.ops[i].a)){u.ops.forEach((o,i)=>{o.para=lote.ops[i].para});u.t=lote.t}
    else{feitos.push(lote);if(feitos.length>limite)feitos.shift()}desfeitos.length=0};
  const H={
    // faz e guarda
    exec(ops,opt){if(!ops||!ops.length)return null;const lote={ops,nome:opt&&opt.nome||"",junta:opt&&opt.junta||null,t:Date.now()};roda(lote,1);guarda(lote);aoMudar&&aoMudar(lote,1);return lote},
    // guarda o que ja foi feito ao vivo (arrasto): nao aplica de novo
    registra(ops,opt){if(!ops||!ops.length)return null;const lote={ops,nome:opt&&opt.nome||"",junta:null,t:Date.now()};guarda(lote);aoMudar&&aoMudar(lote,0);return lote},
    desfazer(){const l=feitos.pop();if(!l)return null;roda(l,-1);desfeitos.push(l);aoMudar&&aoMudar(l,-1);return l},
    refazer(){const l=desfeitos.pop();if(!l)return null;roda(l,1);feitos.push(l);aoMudar&&aoMudar(l,1);return l},
    item,esquece:()=>idx.clear(),
    pode:()=>[feitos.length,desfeitos.length],nomeDesfazer:()=>feitos.length?feitos[feitos.length-1].nome:"",nomeRefazer:()=>desfeitos.length?desfeitos[desfeitos.length-1].nome:""};
  return H}
// o que um lote exige do desenho: quais andares mudaram e se basta reescrever objetos no lugar
export function alcance(lote){const R={andares:new Set(),tudo:false,leve:true,objs:[]};for(const o of lote.ops){if(o.op==="mapa"){R.tudo=true;R.leve=false;continue}if(o.op==="andar"&&Object.keys(o.para).every(k=>k==="ambiente"||k==="camadas"))continue;if(o.op==="mascara"||o.k==="camadas"){R.camadas=true;continue}R.andares.add(o.a);
    if(o.op==="muda"&&o.k==="objetos"&&o.de.l===o.para.l&&o.de.t===o.para.t)R.objs.push(o);else if(o.op==="muda"&&o.k==="luzes")R.luz=true;else R.leve=false}return R}
