// Teste rapido do Modo Batalha (segundos): importador, triangulacao e malha. Uso: node testes/batalha.mjs [mapa.dungeondraft_map ...]
import {importarDD,nums,pts,cor,tamanhoArte} from '../app/batalha/formato.js';
import {triangula,malhaAndar} from '../app/batalha/malha.js';
import {MATERIAIS,OBJETOS,materialDe,objetoDe} from '../app/batalha/arte.js';
import fs from 'fs';
let falhas=0;const ok=(c,m)=>{if(!c){falhas++;console.log('FALHOU:',m)}};
ok(nums('PoolVector2Array( 1, -2.5, 3e2 )').join()==='1,-2.5,300','nums');ok(pts('Vector2( 256, 512 )')[0].join()==='1,2','pts');ok(cor('80ff0000').join()===[1,0,0,128/255].join(),'cor');
ok(tamanhoArte('x/Table_Wood_A_4x2.webp').slice(0,2).join()==='4,2','tamanho pelo nome');ok(objetoDe('a/Spiderweb_A.webp')==='teia'&&objetoDe('a/Fern_B.webp')==='samambaia','objeto pelo nome');ok(materialDe('Grass_A_01.webp')==='grama','material');
const L=[[0,0],[4,0],[4,1],[1,1],[1,4],[0,4]],T=triangula(L);let area=0;for(let i=0;i<T.length;i+=3){const a=L[T[i]],b=L[T[i+1]],c=L[T[i+2]];area+=Math.abs((b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]))/2}ok(Math.abs(area-7)<1e-9,'triangulacao em L: area '+area);
const IND={};let k=0;for(const n in MATERIAIS)IND['m:'+n]=k++;for(const n in OBJETOS)IND['o:'+n]=k++;
for(const f of process.argv.slice(2)){const t=Date.now(),M=importarDD(JSON.parse(fs.readFileSync(f,'utf8')),{nome:f});let v=0,obj=0;for(const A of M.andares){const m=malhaAndar(A,M.texturas,IND);v+=m.n;obj+=A.objetos.length;ok(m.verts.length===m.n*9&&!m.verts.some(x=>!isFinite(x)),'malha com numero invalido em '+A.nome)}
  ok(M.andares.length>0&&M.larg>0,'mapa vazio '+f);console.log(f.split('/').pop(),M.larg+'x'+M.alt,M.andares.length+' andares',obj+' objetos',v+' vertices',(Date.now()-t)+' ms')}
console.log(falhas?falhas+' falha(s)':'ok');process.exit(falhas?1:0);
