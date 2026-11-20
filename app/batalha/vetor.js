// Atlas - Modo Batalha: o modelo de vetor unico (paredes, caminhos e contornos). Sem DOM: pode rodar em Worker.
// Um vetor e uma lista de pontos [x,y] em quadrados. Daqui saem o arredondamento dos cantos e a fita continua.
export const RAIO_PADRAO=.25; // todo canto de parede nasce arredondado; raio em quadrados
const hip=Math.hypot;
// tira pontos repetidos em sequencia (e o ultimo igual ao primeiro, num laco)
export function limpa(P,laco){const O=[];for(const p of P){const u=O[O.length-1];if(!u||hip(p[0]-u[0],p[1]-u[1])>1e-6)O.push(p)}
  if(laco&&O.length>1){const a=O[0],b=O[O.length-1];if(hip(a[0]-b[0],a[1]-b[1])<1e-6)O.pop()}return O}
// troca cada canto por um arco de raio r (limitado a 45% do trecho mais curto que chega nele)
export function arredonda(P,r,laco,raios){P=limpa(P,laco);const n=P.length,temR=raios&&raios.some(x=>x>0);if((!(r>0)&&!temR)||n<3)return P;const O=[];
  for(let i=0;i<n;i++){const b=P[i],rc=raios&&raios[i]!=null?raios[i]:r;if((!laco&&(i===0||i===n-1))||!(rc>0)){O.push(b);continue}
    const a=P[(i+n-1)%n],c=P[(i+1)%n];let ux=a[0]-b[0],uy=a[1]-b[1],vx=c[0]-b[0],vy=c[1]-b[1];const d1=hip(ux,uy),d2=hip(vx,vy);ux/=d1;uy/=d1;vx/=d2;vy/=d2;
    const th=Math.acos(Math.max(-1,Math.min(1,ux*vx+uy*vy)));if(th>Math.PI-.03||th<.05){O.push(b);continue}
    const tg=Math.tan(th/2),t=Math.min(rc/tg,.45*Math.min(d1,d2)),rr=t*tg;let bx=ux+vx,by=uy+vy;const bl=hip(bx,by);bx/=bl;by/=bl;
    const dc=rr/Math.sin(th/2),cx=b[0]+bx*dc,cy=b[1]+by*dc,p1x=b[0]+ux*t,p1y=b[1]+uy*t,p2x=b[0]+vx*t,p2y=b[1]+vy*t,a0=Math.atan2(p1y-cy,p1x-cx);
    let da=Math.atan2(p2y-cy,p2x-cx)-a0;while(da>Math.PI)da-=2*Math.PI;while(da<-Math.PI)da+=2*Math.PI;
    const k=Math.max(2,Math.ceil(Math.abs(da)/(Math.PI/14)));for(let j=0;j<=k;j++){const an=a0+da*j/k;O.push([cx+Math.cos(an)*rr,cy+Math.sin(an)*rr])}}
  return O}
// as duas bordas de uma fita de largura larg seguindo P, com a juncao calculada em cada ponto (sem emenda solta)
export function fita(P,larg,laco){const n=P.length,h=larg/2,E=[],D=[];if(n<2)return {E,D};
  const dir=(a,b)=>{const x=b[0]-a[0],y=b[1]-a[1],l=hip(x,y)||1;return [x/l,y/l]};
  for(let i=0;i<n;i++){const p=P[i];let d0=null,d1=null;if(laco||i>0)d0=dir(P[(i+n-1)%n],p);if(laco||i<n-1)d1=dir(p,P[(i+1)%n]);if(!d0)d0=d1;if(!d1)d1=d0;
    let nx=-(d0[1]+d1[1]),ny=d0[0]+d1[0];const l=hip(nx,ny);if(l<1e-6){nx=-d1[1];ny=d1[0]}else{nx/=l;ny/=l}
    const k=h/Math.max(.35,-nx*d1[1]+ny*d1[0]);E.push([p[0]+nx*k,p[1]+ny*k]);D.push([p[0]-nx*k,p[1]-ny*k])}
  return {E,D}}
// meia-lua que fecha a ponta solta de uma fita: p = ponta, q = ponto vizinho
export function tampa(p,q,larg){const h=larg/2,a0=Math.atan2(p[1]-q[1],p[0]-q[0]),O=[];for(let j=0;j<=6;j++){const an=a0-Math.PI/2+Math.PI*j/6;O.push([p[0]+Math.cos(an)*h,p[1]+Math.sin(an)*h])}return O}
export function distSeg(x,y,a,b){const dx=b[0]-a[0],dy=b[1]-a[1],l=dx*dx+dy*dy;let t=l?((x-a[0])*dx+(y-a[1])*dy)/l:0;t=Math.max(0,Math.min(1,t));return hip(x-a[0]-dx*t,y-a[1]-dy*t)}
export function distPoli(P,x,y,laco){let m=1e9;const n=P.length;if(n===1)return hip(x-P[0][0],y-P[0][1]);for(let i=0;i<n-(laco?0:1);i++)m=Math.min(m,distSeg(x,y,P[i],P[(i+1)%n]));return m}
export function dentro(P,x,y){let c=false;for(let i=0,j=P.length-1;i<P.length;j=i++){const a=P[i],b=P[j];if((a[1]>y)!==(b[1]>y)&&x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0])c=!c}return c}
export function caixaPts(P,f){f=f||0;let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9;for(const p of P){if(p[0]<x0)x0=p[0];if(p[0]>x1)x1=p[0];if(p[1]<y0)y0=p[1];if(p[1]>y1)y1=p[1]}return [x0-f,y0-f,x1+f,y1+f]}
// maior virada entre dois trechos seguidos, em graus (para os testes)
export function maiorVirada(P,laco){let m=0;const n=P.length;for(let i=laco?0:1;i<n-(laco?0:1);i++){const a=P[(i+n-1)%n],b=P[i],c=P[(i+1)%n],d=Math.atan2(c[1]-b[1],c[0]-b[0])-Math.atan2(b[1]-a[1],b[0]-a[0]);let t=Math.abs(d);if(t>Math.PI)t=2*Math.PI-t;m=Math.max(m,t)}return m*180/Math.PI}
// medidas ao longo da linha (portas e janelas ficam presas a parede pela distancia desde o primeiro ponto)
export function comprimento(P,laco){let L=0;const n=P.length;for(let i=0;i<n-(laco?0:1);i++){const a=P[i],b=P[(i+1)%n];L+=hip(b[0]-a[0],b[1]-a[1])}return L}
export function pontoEm(P,laco,d){const n=P.length;let x=P[0][0],y=P[0][1],dx=1,dy=0;for(let i=0;i<n-(laco?0:1);i++){const a=P[i],b=P[(i+1)%n],L=hip(b[0]-a[0],b[1]-a[1]);if(L<1e-9)continue;dx=(b[0]-a[0])/L;dy=(b[1]-a[1])/L;if(d<=L){return [a[0]+dx*d,a[1]+dy*d,dx,dy]}d-=L;x=b[0];y=b[1]}return [x,y,dx,dy]}
export function projeta(P,laco,x,y){const n=P.length;let m={d:0,dist:1e9,seg:0},acc=0;for(let i=0;i<n-(laco?0:1);i++){const a=P[i],b=P[(i+1)%n],dx=b[0]-a[0],dy=b[1]-a[1],l2=dx*dx+dy*dy,L=Math.sqrt(l2);if(L<1e-9)continue;let t=((x-a[0])*dx+(y-a[1])*dy)/l2;t=Math.max(0,Math.min(1,t));const ds=hip(x-a[0]-dx*t,y-a[1]-dy*t);if(ds<m.dist)m={d:acc+t*L,dist:ds,seg:i,ini:acc,fim:acc+L};acc+=L}return m}
// formas prontas (pontos no sentido horario da tela)
export function formaPontos(modo,a,b,lados){const x0=Math.min(a[0],b[0]),x1=Math.max(a[0],b[0]),y0=Math.min(a[1],b[1]),y1=Math.max(a[1],b[1]);
  if(modo==="ret")return [[x0,y0],[x1,y0],[x1,y1],[x0,y1]];if(modo==="tri")return [[(x0+x1)/2,y0],[x1,y1],[x0,y1]];
  const R=hip(b[0]-a[0],b[1]-a[1]);if(R<1e-6)return [];const n=modo==="circ"?Math.max(16,Math.min(96,Math.ceil(2*Math.PI*R/.45))):Math.max(3,lados||6),a0=modo==="circ"?0:Math.atan2(b[1]-a[1],b[0]-a[0]),O=[];
  for(let i=0;i<n;i++){const an=a0+i*2*Math.PI/n;O.push([+(a[0]+Math.cos(an)*R).toFixed(4),+(a[1]+Math.sin(an)*R).toFixed(4)])}return O}
// ---------- uniao de dois poligonos simples (juntar comodos e formas que se encostam) ----------
// corta as bordas nos cruzamentos (inclusive trechos sobrepostos), fica com o que esta fora do outro poligono e liga os pedacos em lacos.
// Devolve {fora:[pontos], furos:[[pontos]...]} ou null quando nao se tocam.
const area2=P=>{let s=0;for(let i=0;i<P.length;i++){const a=P[i],b=P[(i+1)%P.length];s+=a[0]*b[1]-b[0]*a[1]}return s/2};
const EPS=1e-7;
function noBorda(P,x,y){for(let i=0;i<P.length;i++){const a=P[i],b=P[(i+1)%P.length];if(distSeg(x,y,a,b)<1e-6)return true}return false}
function cortes(A,B){// pontos de corte de cada borda de A pelas bordas de B (t de 0 a 1)
  const out=[];for(let i=0;i<A.length;i++){const a=A[i],b=A[(i+1)%A.length],ts=[0,1],ex=b[0]-a[0],ey=b[1]-a[1],L2=ex*ex+ey*ey;
    for(let j=0;j<B.length;j++){const c=B[j],d=B[(j+1)%B.length],fx=d[0]-c[0],fy=d[1]-c[1],den=ex*fy-ey*fx;
      if(Math.abs(den)<1e-12){// paralelas: se estao na mesma reta, as pontas de uma cortam a outra
        const cr=(c[0]-a[0])*ey-(c[1]-a[1])*ex;if(Math.abs(cr)>1e-9*Math.sqrt(L2))continue;for(const p of[c,d]){const t=((p[0]-a[0])*ex+(p[1]-a[1])*ey)/L2;if(t>EPS&&t<1-EPS)ts.push(t)}continue}
      const t=((c[0]-a[0])*fy-(c[1]-a[1])*fx)/den,u=((c[0]-a[0])*ey-(c[1]-a[1])*ex)/den;if(t>EPS&&t<1-EPS&&u>-EPS&&u<1+EPS)ts.push(t)}
    ts.sort((p,q)=>p-q);for(let k=0;k<ts.length-1;k++){if(ts[k+1]-ts[k]<EPS)continue;out.push([[a[0]+ex*ts[k],a[1]+ey*ts[k]],[a[0]+ex*ts[k+1],a[1]+ey*ts[k+1]]])}}
  return out}
export function uniao(A,B){A=limpa(A,true);B=limpa(B,true);if(A.length<3||B.length<3)return null;if(area2(A)<0)A=A.slice().reverse();if(area2(B)<0)B=B.slice().reverse();
  const SA=cortes(A,B),SB=cortes(B,A),seg=[];let toca=false;
  const mesmo=(s,L)=>L.some(t=>hip(t[0][0]-s[0][0],t[0][1]-s[0][1])<1e-6&&hip(t[1][0]-s[1][0],t[1][1]-s[1][1])<1e-6),contra=(s,L)=>L.some(t=>hip(t[0][0]-s[1][0],t[0][1]-s[1][1])<1e-6&&hip(t[1][0]-s[0][0],t[1][1]-s[0][1])<1e-6);
  for(const s of SA){const mx=(s[0][0]+s[1][0])/2,my=(s[0][1]+s[1][1])/2;if(noBorda(B,mx,my)){toca=true;if(contra(s,SB))continue;seg.push(s);continue}if(dentro(B,mx,my)){toca=true;continue}seg.push(s)}
  for(const s of SB){const mx=(s[0][0]+s[1][0])/2,my=(s[0][1]+s[1][1])/2;if(noBorda(A,mx,my)){toca=true;continue}if(dentro(A,mx,my)){toca=true;continue}seg.push(s)}
  if(!toca)return null;
  // liga os pedacos: cada um comeca onde o anterior termina
  const k=p=>Math.round(p[0]*1e5)+","+Math.round(p[1]*1e5),porIni=new Map();for(const s of seg){const kk=k(s[0]);if(!porIni.has(kk))porIni.set(kk,[]);porIni.get(kk).push(s)}
  const usado=new Set(),lacos=[];for(const s0 of seg){if(usado.has(s0))continue;const L=[];let s=s0,g=0;while(s&&!usado.has(s)&&g++<10000){usado.add(s);L.push(s[0]);const nx=(porIni.get(k(s[1]))||[]).filter(t=>!usado.has(t));s=nx[0]||null}if(L.length>=3)lacos.push(simplifica(L))}
  if(!lacos.length)return null;lacos.sort((p,q)=>Math.abs(area2(q))-Math.abs(area2(p)));const fora=lacos[0];if(area2(fora)<=0)return null;
  return {fora,furos:lacos.slice(1).filter(L=>area2(L)<0&&L.length>=3)}}
// tira pontos no meio de trechos retos
export function simplifica(P){let O=P.slice(),mudou=true;while(mudou&&O.length>3){mudou=false;for(let i=0;i<O.length;i++){const a=O[(i+O.length-1)%O.length],b=O[i],c=O[(i+1)%O.length],cr=(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]);if(Math.abs(cr)<1e-9||hip(b[0]-a[0],b[1]-a[1])<1e-7){O.splice(i,1);mudou=true;break}}}return O}
// curvas de Bezier: cv[i] e a alca de saida do ponto i (a de entrada e o espelho). Sem alcas o trecho fica reto
export function curva(P,cv,laco){if(!cv||!cv.some(Boolean)||P.length<2)return P;const n=P.length,O=[],N=16;
  for(let i=0;i<n-(laco?0:1);i++){const a=P[i],b=P[(i+1)%n],h1=cv[i],h2=cv[(i+1)%n];O.push(a);if(!h1&&!h2)continue;
    const c1=h1?[a[0]+h1[0],a[1]+h1[1]]:a,c2=h2?[b[0]-h2[0],b[1]-h2[1]]:b;for(let k=1;k<N;k++){const t=k/N,u=1-t,A=u*u*u,B=3*u*u*t,C=3*u*t*t,D=t*t*t;O.push([A*a[0]+B*c1[0]+C*c2[0]+D*b[0],A*a[1]+B*c1[1]+C*c2[1]+D*b[1]])}}
  if(!laco)O.push(P[n-1]);return O}
