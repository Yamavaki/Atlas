// Teste rapido do Modo Batalha (segundos): importador, triangulacao e malha. Uso: node testes/batalha.mjs [mapa.dungeondraft_map ...]
import {importarDD,nums,pts,cor,tamanhoArte} from '../app/batalha/formato.js';
import {triangula,malhaAndar,VERT,N_OBJ,escreveObjeto} from '../app/batalha/malha.js';
import {MATERIAIS,OBJETOS,materialDe,objetoDe} from '../app/batalha/arte.js';
import fs from 'fs';
let falhas=0;const ok=(c,m)=>{if(!c){falhas++;console.log('FALHOU:',m)}};
ok(nums('PoolVector2Array( 1, -2.5, 3e2 )').join()==='1,-2.5,300','nums');ok(pts('Vector2( 256, 512 )')[0].join()==='1,2','pts');ok(cor('80ff0000').join()===[1,0,0,128/255].join(),'cor');
ok(tamanhoArte('x/Table_Wood_A_4x2.webp').slice(0,2).join()==='4,2','tamanho pelo nome');ok(objetoDe('a/Spiderweb_A.webp')==='teia'&&objetoDe('a/Fern_B.webp')==='samambaia','objeto pelo nome');ok(materialDe('Grass_A_01.webp')==='grama','material');
const L=[[0,0],[4,0],[4,1],[1,1],[1,4],[0,4]],T=triangula(L);let area=0;for(let i=0;i<T.length;i+=3){const a=L[T[i]],b=L[T[i+1]],c=L[T[i+2]];area+=Math.abs((b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]))/2}ok(Math.abs(area-7)<1e-9,'triangulacao em L: area '+area);
const IND={};let k=0;for(const n in MATERIAIS)IND['m:'+n]=k++;for(const n in OBJETOS)IND['o:'+n]=k++;
// 0.73: vetor (cantos arredondados), modelo, comandos
{const V=await import('../app/batalha/vetor.js'),MD=await import('../app/batalha/modelo.js'),CM=await import('../app/batalha/comandos.js');
 const Q=[[0,0],[4,0],[4,3],[0,3]],QA=V.arredonda(Q,V.RAIO_PADRAO,true);ok(V.maiorVirada(Q,true)===90&&V.maiorVirada(QA,true)<=15,'canto de 90 graus tem de virar aos poucos: '+V.maiorVirada(QA,true));
 ok(V.arredonda(Q,0,true).length===4,'raio zero deixa o canto vivo');const AB=V.arredonda([[0,0],[2,0],[2,2]],.25,false);ok(AB[0].join()==='0,0'&&AB[AB.length-1].join()==='2,2','pontas soltas ficam no lugar');
 const F=V.fita(QA,.3,true);ok(F.E.length===QA.length&&F.E.every(p=>isFinite(p[0])&&isFinite(p[1])),'fita');ok(V.dentro(Q,1,1)&&!V.dentro(Q,5,1)&&Math.abs(V.distPoli(Q,2,-1,true)-1)<1e-9,'dentro e distancia');
 const M=MD.novoMapa({larg:12,alt:8,chao:'areia'});ok(M.larg===12&&M.andares[0].terreno.w===48&&M.texturas[0]==='atlas:m/areia'&&materialDe(M.texturas[0])==='areia','mapa novo');
 const A=M.andares[0];for(let i=0;i<6;i++)A.objetos.push({t:MD.texDe(M,'atlas:o/mesa'),x:i,y:1,r:0,w:2,h:1,l:200});A.paredes.push({t:0,p:Q,laco:true});MD.garanteIds(M);ok(new Set(A.objetos.map(o=>o.id)).size===6&&A.paredes[0].id!=null,'ids');
 ok(MD.acerta('objetos',A.objetos[0],.9,1.4,0)&&!MD.acerta('objetos',A.objetos[0],1.2,1,0)&&MD.acerta('paredes',A.paredes[0],2,.1,0),'acerto do clique');
 const antes=JSON.stringify(M.andares),H=CM.criaHistorico(M,()=>{}),o=A.objetos[2],de=MD.foto(o);MD.transforma('objetos',o,{f:(x,y)=>[x+2,y+1],rot:.5,s:2});ok(o.x===4&&o.w===4&&o.r===.5,'transforma');H.registra([{op:'muda',a:0,k:'objetos',id:o.id,de,para:MD.foto(o)}]);
 H.exec([{op:'cria',a:0,k:'objetos',item:MD.clona(M,'objetos',o)}]);H.exec([{op:'apaga',a:0,k:'objetos',item:A.objetos[4],pos:4},{op:'apaga',a:0,k:'objetos',item:A.objetos[1],pos:1}]);H.exec([{op:'pos',a:0,k:'objetos',id:A.objetos[0].id,de:0,para:A.objetos.length-1}]);
 H.exec([{op:'mapa',de:{larg:12,alt:8},para:{larg:20,alt:10}},{op:'andar',a:0,de:{terreno:A.terreno},para:{terreno:MD.terrenoRedim(A.terreno,20,10)}}]);ok(M.larg===20&&A.terreno.w===80,'tamanho do mapa');
 const meio=JSON.stringify(M.andares);for(let i=0;i<5;i++)H.desfazer();ok(JSON.stringify(M.andares)===antes&&M.larg===12,'desfazer tudo volta ao começo');for(let i=0;i<5;i++)H.refazer();ok(JSON.stringify(M.andares)===meio,'refazer tudo volta ao fim');
 {const B=new Float32Array(N_OBJ);escreveObjeto(B,0,{x:1,y:1,r:0,w:2,h:1,s:1,mz:90,sat:.5,bri:1.2},3);ok(B[8]>0&&B[12*6+9]===.25&&B[12*6+10]===.5&&Math.abs(B[12*6+11]-1.2)<1e-6&&B[0]-B[12*6]>0,'objeto com sombra e ajustes de cor')}
 // 0.75: paredes por forma, cantos por ponto, portas presas, piso que segue a parede
 {const F=V.formaPontos('ret',[1,1],[5,4]),C=V.formaPontos('circ',[0,0],[3,0]),T=V.formaPontos('tri',[0,0],[4,4]),P6=V.formaPontos('poli',[0,0],[2,0],6);ok(F.length===4&&T.length===3&&P6.length===6&&C.length>=16,'formas prontas');
  ok(V.arredonda(F,0,true,[0,2,0,0]).length>4&&V.arredonda(F,0,true).length===4,'raio so de um canto');
  const B={paredes:[{id:1,p:F,laco:true}],portais:[{id:2,parede:1,d:2,raio:.5}],padroes:[{id:3,parede:1,p:[]}]};MD.sincroniza(B);ok(B.padroes[0].p===F&&Math.abs(B.portais[0].y-1)<1e-6,'porta e piso seguem a parede');
  B.paredes[0].p=F.map(q=>[q[0]+3,q[1]]);MD.sincroniza(B);ok(Math.abs(B.portais[0].x-B.paredes[0].p[0][0]-2)<.2,'porta acompanha a parede movida')}
 const m=malhaAndar(A,M.texturas,IND);ok(m.onde.size===A.objetos.length&&m.verts.length===m.n*VERT,'malha guarda onde esta cada objeto')}
for(const f of process.argv.slice(2)){const t=Date.now(),M=importarDD(JSON.parse(fs.readFileSync(f,'utf8')),{nome:f});let v=0,obj=0;for(const A of M.andares){const m=malhaAndar(A,M.texturas,IND);v+=m.n;obj+=A.objetos.length;ok(m.verts.length===m.n*VERT&&!m.verts.some(x=>!isFinite(x)),'malha com numero invalido em '+A.nome)}
  ok(M.andares.length>0&&M.larg>0,'mapa vazio '+f);console.log(f.split('/').pop(),M.larg+'x'+M.alt,M.andares.length+' andares',obj+' objetos',v+' vertices',(Date.now()-t)+' ms')}
console.log(falhas?falhas+' falha(s)':'ok');process.exit(falhas?1:0);
