// 0.95: vaos das portas nas paredes, repeticao das faixas, sombras do Drop Shadow e luzes do Dungeondraft. Uso: node testes/paredes_sombras_0.95.mjs
import {importarDD} from '../app/batalha/formato.js';
import {pedacos,naParede,vaosDe,malhaAndar,VERT,barreiras,escreveObjeto,N_OBJ} from '../app/batalha/malha.js';
import fs from 'fs';
let f=0,n=0;const ok=(c,m)=>{n++;if(!c){f++;console.log('FALHOU:',m)}else console.log('ok',m)};
// pedacos: parede reta de 6 com um vao no meio
{const R0=pedacos([[0,0],[4,0],[4,4]],false,[[1,2]]);ok(R0.length===2&&R0[1].pts[R0[1].pts.length-1].join()==='4,4','pedaco final termina na ponta (nao volta ao comeco)');}
{const P=[[0,0],[6,0]],R=pedacos(P,false,[[2.5,3.5]]);ok(R.length===2&&Math.abs(R[0].pts[1][0]-2.5)<1e-9&&Math.abs(R[1].pts[0][0]-3.5)<1e-9,'vao corta a parede reta');ok(R[0].ini&&!R[0].fim&&!R[1].ini&&R[1].fim,'pontas de verdade so nas pontas');}
// laco: quadrado 4x4 com vao no canto de inicio (passa pelo ponto 0)
{const P=[[0,0],[4,0],[4,4],[0,4]],R=pedacos(P,true,[[-.5,.5]]);ok(R.length===1&&!R[0].laco,'laco com vao vira um pedaco aberto');const L=R[0].s[R[0].s.length-1]-R[0].s[0];ok(Math.abs(L-15)<1e-9,'comprimento do laco menos o vao: '+L);
 ok(Math.abs(R[0].pts[0][0]-.5)<1e-9&&Math.abs(R[0].pts[R[0].pts.length-1][1]-.5)<1e-9,'o pedaco comeca e termina nas bordas do vao');}
{const r=naParede([[0,0],[4,0],[4,4]],false,4.2,2);ok(Math.abs(r.d-6)<1e-9&&Math.abs(r.dist-.2)<1e-9,'distancia na parede');}
// 0.95.1: a arte nao perde as bordas (margem de no maximo meio texel numa folha de 2048)
{const B=new Float32Array(N_OBJ),rc=[.1,.2,.3,.4];escreveObjeto(B,0,{x:0,y:0,r:0,w:1,h:1},256,rc);const u=B[6*VERT+2],v=B[6*VERT+3];ok(u-rc[0]<.5/2048+1e-7&&v-rc[1]<.5/2048+1e-7,'arte sem corte nas bordas ('+((u-rc[0])*2048).toFixed(2)+' px)')}
// mapa do Dungeondraft
const U='/mnt/user-data/uploads/1123b0fe-universidade-aster_v7.dungeondraft_map';
if(fs.existsSync(U)){const D=JSON.parse(fs.readFileSync(U,'utf8')),M=importarDD(D),A=M.andares[0];
  const ob=M.andares.flatMap(a=>a.objetos),comS=ob.filter(o=>o.s);ok(comS.length>=1037&&comS.every(o=>o.sd&&o.sd[0]===.5&&o.sd[1]===.2),'sombras dos objetos vem do Drop Shadow: '+comS.length);
  const pw=M.andares.flatMap(a=>a.paredes);ok(pw.every(w=>w.sd&&w.sd[0]===.4&&w.sd[1]===.4),'paredes com a sombra do mod');
  ok(M.andares.flatMap(a=>a.caminhos).every(p=>p.sd),'caminhos com sombra');
  ok(M.andares.flatMap(a=>a.luzes).every(l=>l.dd===1),'luzes do Dungeondraft marcadas');
  // vaos: toda porta ou janela presa numa parede do terreo acha o lugar nela
  let achou=0,tot=0;for(const w of A.paredes){const {trajeto}=await import('../app/batalha/modelo.js');const P=trajeto(w),V=vaosDe(A,w,P);tot+=A.portais.filter(q=>q.parede===w.id).length;achou+=V.length}
  ok(tot>0&&achou===tot,'portais achados nas paredes: '+achou+'/'+tot);
  // malha: com arte do pacote (indice falso) a parede tem vaos e faz grupos de sombra
  const IND={'m:neutro':0};for(const t of M.texturas)if(/\/walls\//.test(t)){IND['r:'+t]=768;IND['a:'+t]=4;IND['h:'+t]=64;IND['w:'+t]=256}else if(/\/objects\//.test(t)){IND['r:'+t]=256;IND['rc:'+t]=[0,0,1,1]}
  const m=malhaAndar(A,M.texturas,IND,[]);ok(m.grupos.length>=2&&m.grupos.length<=8,'grupos de sombra: '+m.grupos.length);ok(m.grupos.every(g=>g.v1>g.v0&&g.bl>0),'grupos validos');
  let somb=0;for(let i=0;i<m.n;i++)if(m.verts[i*VERT+9]===-2&&m.verts[i*VERT+8]>0)somb++;ok(somb>0,'vertices de sombra: '+somb);
  // repeticao: u das paredes passa de 1 (repete) e cada trecho reto tem numero inteiro de repeticoes
  let maxu=0;for(let i=0;i<m.n;i++){const k=i*VERT;if(m.verts[k+4]===768)maxu=Math.max(maxu,m.verts[k+2])}ok(maxu>1.5,'textura da parede repete (u max '+maxu.toFixed(2)+')');
  // pedacos sem saltos (cada trecho do pedaco fica em cima da parede)
  {const MD=await import('../app/batalha/modelo.js');let ruim=0,tot=0;for(const B of M.andares)for(const w of B.paredes){const P=MD.trajeto(w),pc=pedacos(P,w.laco,vaosDe(B,w,P));let mx=0;for(let i=1;i<P.length+(w.laco?1:0);i++){const a=P[i-1],b=P[i%P.length];mx=Math.max(mx,Math.hypot(b[0]-a[0],b[1]-a[1]))}
    for(const q of pc){tot++;for(let i=1;i<q.pts.length;i++)if(Math.hypot(q.pts[i][0]-q.pts[i-1][0],q.pts[i][1]-q.pts[i-1][1])>mx+1e-6){ruim++;break}}}ok(tot>300&&ruim===0,'pedacos de parede sem saltos: '+tot+' pedacos, '+ruim+' ruins')}
  ok(pw.every(w=>w.raio===0),'paredes do Dungeondraft sem cantos arredondados');
  // barreiras abrem nas janelas
  const S=barreiras(A,M.texturas);ok(S.length>A.paredes.length,'janelas abrem a parede para a luz: '+S.length+' trechos');
}
console.log(n-f,'ok',f,'falhas');process.exit(f?1:0)
