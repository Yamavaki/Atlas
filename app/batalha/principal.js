// Atlas - Modo Batalha: entrada do modulo. Liga o visualizador, o importador e o armazenamento a casca do Atlas.
import {importarDD,indiceTamanhos,resumo} from "./formato.js";
import {abrirVisor} from "./visor.js";
import * as loja from "./loja.js";
export const VERSAO="0.72";
const EXEMPLOS=[["floresta-gigante","Floresta gigante"],["praia-forte","Praia do forte"],["universidade-aster","Universidade Aster"],["mata-cerrada","Mata cerrada"]];
const base=new URL(".",import.meta.url);let TAM=null,atual=null;
async function importarArquivo(arq){const t=performance.now(),txt=await arq.text(),D=JSON.parse(txt);let M;
  if(D.v&&D.andares)M=D;else if(D.world&&D.world.levels)M=importarDD(D,{nome:arq.name.replace(/\.[^.]+$/,"").replace(/[-_]+/g," "),tamanhos:TAM||new Map()});else throw new Error("Arquivo não reconhecido. Use um .dungeondraft_map ou um .atlasmap.");
  const id="bt"+Date.now().toString(36)+Math.random().toString(36).slice(2,6);await loja.salvar(id,M.nome,M);return {id,nome:M.nome,avisos:M.avisos||[],ms:performance.now()-t}}
async function importarExemplo(k){const e=EXEMPLOS.find(z=>z[0]===k);const r=await fetch(new URL("exemplos/"+k+".atlasmap.json",base));if(!r.ok)throw new Error("Exemplo não encontrado nesta instalação.");const M=await r.json(),id="bt-ex-"+k;await loja.salvar(id,M.nome||e[1],M);return {id,nome:M.nome||e[1],avisos:M.avisos||[]}}
async function carregarCatalogo(arq){const D=JSON.parse(await arq.text());TAM=indiceTamanhos(D);return TAM.size}
async function abrir(id,raiz,opt){if(atual){atual.fechar();atual=null}const r=await loja.ler(id);if(!r){raiz.replaceChildren(Object.assign(document.createElement("p"),{className:"bt-msg",textContent:"Os dados deste mapa de batalha estão guardados em outro navegador. Importe o arquivo de novo neste aqui."}));return null}
  atual=abrirVisor(raiz,r.mapa,opt);return atual}
window.AtlasBatalha={VERSAO,EXEMPLOS,importarArquivo,importarExemplo,carregarCatalogo,abrir,apagar:loja.apagar,listar:loja.listar,resumo,abrirVisor,importarDD};
window.dispatchEvent(new Event("atlas-batalha"));
