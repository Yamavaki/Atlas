// Planta do castelo-escola: so geometria (testavel no Node). Regras do Gustavo: nada de caixote — volumes de tamanhos
// diferentes juntos (ala, porche, abside, sacadas a 45°, torres octogonais fundidas nos cantos), paredes a 90°/45° com vertices
// no grid, corredores de 3, portas simples em n+0,5 e duplas em n inteiro, nada de porta em parede diagonal.
import {uniao,dentro} from "../vetor.js";
export const ret=(x0,y0,x1,y1)=>[[x0,y0],[x1,y0],[x1,y1],[x0,y1]];
// retangulo com cantos cortados a 45° (k inteiro): cantos 'no','ne','se','so'
export function chanf(x0,y0,x1,y1,k,cantos){const C=new Set(cantos||["no","ne","se","so"]),P=[];
  if(C.has("no"))P.push([x0,y0+k],[x0+k,y0]);else P.push([x0,y0]);if(C.has("ne"))P.push([x1-k,y0],[x1,y0+k]);else P.push([x1,y0]);
  if(C.has("se"))P.push([x1,y1-k],[x1-k,y1]);else P.push([x1,y1]);if(C.has("so"))P.push([x0+k,y1],[x0,y1-k]);else P.push([x0,y1]);return P}
export const oct=(cx,cy,h,k)=>[[cx-h+k,cy-h],[cx+h-k,cy-h],[cx+h,cy-h+k],[cx+h,cy+h-k],[cx+h-k,cy+h],[cx-h+k,cy+h],[cx-h,cy+h-k],[cx-h,cy-h+k]];
// sacada a 45° saindo de uma parede (lado: 'W','E','N','S'), com 1 quadrado para dentro (para a uniao)
export function sacada(lado,pos,a,b,prof,k){if(lado==="W")return [[pos+1,a],[pos,a],[pos-prof,a+k],[pos-prof,b-k],[pos,b],[pos+1,b]];if(lado==="E")return [[pos-1,a],[pos,a],[pos+prof,a+k],[pos+prof,b-k],[pos,b],[pos-1,b]].reverse();
  if(lado==="S")return [[a,pos-1],[a,pos],[a+k,pos+prof],[b-k,pos+prof],[b,pos],[b,pos-1]].reverse();return [[a,pos+1],[a,pos],[a+k,pos-prof],[b-k,pos-prof],[b,pos],[b,pos+1]]}
const une=L=>{let U=L[0];for(let i=1;i<L.length;i++){const r=uniao(U,L[i]);if(!r)throw new Error("Não foi possível montar a planta do castelo (volume "+i+").");U=r.fora}return U};
// partes de uma linha (polilinha aberta) dentro de A e fora de todos os B
export function recorta(L,A,Bs,passo){passo=passo||.125;const runs=[];let cur=null;const ok=(x,y)=>dentro(A,x,y)&&!Bs.some(B=>dentro(B,x,y));
  for(let i=0;i<L.length-1;i++){const a=L[i],b=L[i+1],n=Math.max(1,Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1])/passo));for(let k=0;k<=n;k++){const t=k/n,x=a[0]+(b[0]-a[0])*t,y=a[1]+(b[1]-a[1])*t;
      const m=k<n?[a[0]+(b[0]-a[0])*(t+.5/n),a[1]+(b[1]-a[1])*(t+.5/n)]:null;if(m&&ok(m[0],m[1])){if(!cur){cur=[[x,y]];runs.push(cur)}else{const u=cur[cur.length-1];if(Math.hypot(u[0]-x,u[1]-y)>1e-9)cur.push([x,y])}}else if(cur){cur.push([x,y]);cur=null}}}
  return runs.map(r=>simpl(r)).filter(r=>r.length>=2&&Math.hypot(r[r.length-1][0]-r[0][0],r[r.length-1][1]-r[0][1])>.3)}
const simpl=P=>{const O=[P[0]];for(let i=1;i<P.length-1;i++){const a=O[O.length-1],b=P[i],c=P[i+1];if(Math.abs((b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]))>1e-7)O.push(b)}O.push(P[P.length-1]);return O.map(q=>[+q[0].toFixed(3),+q[1].toFixed(3)])};
export function planta(){
  const T={dorm:oct(11,20,5,3),diretor:oct(36,17,4,2),astro:oct(60,55,6,3),escada:oct(11,60,3,1)};
  const V={
    oeste:ret(10,20,22,60),sacTransf:sacada("W",10,26,30,1,1),sacDef:sacada("W",10,42,46,1,1),
    saguao:ret(22,20,34,32),porche:ret(24,15,30,21),
    salao:ret(34,18,64,32),abside:chanf(63,20,68,30,2,["ne","se"]),
    cozinha:ret(56,31,64,44),puxado:ret(63,34,67,41),
    sul:ret(22,50,56,60),sacBib:sacada("S",60,27,33,1,1)};
  const volumes=[V.oeste,T.dorm,V.sacTransf,V.sacDef,V.saguao,V.porche,V.salao,V.abside,T.diretor,V.cozinha,V.puxado,V.sul,T.astro,T.escada,V.sacBib];
  const fora=une(volumes);const TORRES=[T.dorm,T.diretor,T.astro,T.escada];
  // paredes internas (abertas), recortadas: dentro do castelo e fora das torres; as torres ganham a parede delas onde encostam no resto
  const linhas=[
    [[22,20],[22,32]],[[34,20],[34,32]],[[22,53],[22,60]],     // saguao | ala oeste, saguao | salao, corredor | biblioteca
    [[19,20],[19,60]],                                         // corredor da ala oeste (3 de largura)
    [[10,33],[19,33]],[[10,41],[19,41]],[[10,49],[19,49]],     // salas de aula / enfermaria
    [[22,53],[56,53]],[[38,53],[38,60]],[[48,53],[48,60]],     // corredor sul, biblioteca | trofeus | pocoes
    [[56,32],[64,32]],[[56,39],[67,39]]];                      // salao | cozinha, cozinha | despensa
  const semTorre=une(volumes.filter(v=>!TORRES.includes(v)));
  const internas=[];for(const L of linhas)for(const r of recorta(L,fora,TORRES))internas.push(r);
  for(const t of TORRES){const L=t.concat([t[0]]);for(const r of recorta(L,semTorre,[]))internas.push(r)}
  const comodos=[
    {id:"saguao",nome:"Saguão de entrada",P:une([ret(22,20,34,32),ret(24,15,30,21)]),piso:"diag"},
    {id:"salao",nome:"Salão principal",P:une([ret(34,18,64,32),V.abside]),piso:"marmore"},
    {id:"transf",nome:"Sala de Transmutação",P:une([ret(10,20,19,33),V.sacTransf]),piso:"mad1"},
    {id:"feiticos",nome:"Sala de Feitiços",P:ret(10,33,19,41),piso:"mad2"},
    {id:"defesa",nome:"Sala de Proteção Arcana",P:une([ret(10,41,19,49),V.sacDef]),piso:"mad3"},
    {id:"enfermaria",nome:"Enfermaria",P:ret(10,49,19,60),piso:"pedraClara"},
    {id:"corrOeste",nome:"Corredor oeste",P:ret(19,20,22,60),piso:"corredor"},
    {id:"corrSul",nome:"Corredor sul",P:[[22,50],[56,50],[54,52],[54,53],[22,53]],piso:"corredor"},
    {id:"biblioteca",nome:"Biblioteca",P:une([ret(22,53,38,60),V.sacBib]),piso:"mad2"},
    {id:"trofeus",nome:"Sala de troféus",P:ret(38,53,48,60),piso:"marmore"},
    {id:"pocoes",nome:"Laboratório de Alquimia",P:ret(48,53,56,60),piso:"pedraEscura"},
    {id:"cozinha",nome:"Cozinha",P:une([ret(56,32,64,39),ret(64,34,67,39)]),piso:"quadrada"},
    {id:"despensa",nome:"Despensa",P:une([ret(56,39,64,44),ret(64,39,67,41)]),piso:"quadrada"},
    {id:"dorm",nome:"Torre leste · sala comunal",P:T.dorm,piso:"mad1",torre:true},
    {id:"diretor",nome:"Torre do reitor · entrada",P:T.diretor,piso:"pedra",torre:true},
    {id:"astro",nome:"Torre de astronomia · depósito",P:T.astro,piso:"pedra",torre:true},
    {id:"escada",nome:"Escada",P:T.escada,piso:"pedra",torre:true}];
  const portas=[[27,15,1],[34,26,1],[22,30.5],[28,32,1],[45,32,1],[60.5,32],[61.5,39],[56,36.5],[67,37.5],
    [19,29.5],[19,37.5],[19,45.5],[19,53.5],[16,21],[11.5,15],[11.5,57],
    [30,53,1],[42.5,53],[51.5,53],[40.5,50],[54,52.5],[54,57.5],[36.5,21]];
  const janelas=[[44,18],[49,18],[54,18],[59,18],[9,28],[9,44],[10,37],[10,53],[30,61],[25,60],[43,60],[68,25]];
  const patio=ret(22,32,56,50);
  // telhado: alas so com angulos retos; torres (furos) sobem e levam o telhado conico delas
  const telhado={alas:[{x0:10,y0:20,x1:22,y1:60},{x0:22,y0:20,x1:34,y1:32},{x0:24,y0:15,x1:30,y1:21,tipo:"duas",eixo:"y"},{x0:34,y0:18,x1:64,y1:32,tipo:"duas",eixo:"x",k:1.35},
      {x0:56,y0:31,x1:64,y1:44},{x0:63,y0:34,x1:67,y1:41,tipo:"meia",lado:"L"},{x0:22,y0:50,x1:56,y1:60,tipo:"quatro"}],
    extras:[{p:V.abside,estilo:"quatro"},{p:V.sacTransf.slice(1,5),estilo:"quatro"},{p:V.sacDef.slice(1,5),estilo:"quatro"},{p:V.sacBib.slice(1,5),estilo:"quatro"}],
    furos:TORRES};
  return {fora,internas,comodos,portas,janelas,patio,telhado,T,V}}
