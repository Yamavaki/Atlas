// Atlas - Modo Batalha: o modelo de vetor unico (paredes, caminhos e contornos). Sem DOM: pode rodar em Worker.
// Um vetor e uma lista de pontos [x,y] em quadrados. Daqui saem o arredondamento dos cantos e a fita continua.
export const RAIO_PADRAO=.25; // todo canto de parede nasce arredondado; raio em quadrados
const hip=Math.hypot;
// tira pontos repetidos em sequencia (e o ultimo igual ao primeiro, num laco)
export function limpa(P,laco){const O=[];for(const p of P){const u=O[O.length-1];if(!u||hip(p[0]-u[0],p[1]-u[1])>1e-6)O.push(p)}
  if(laco&&O.length>1){const a=O[0],b=O[O.length-1];if(hip(a[0]-b[0],a[1]-b[1])<1e-6)O.pop()}return O}
// troca cada canto por um arco de raio r (limitado a 45% do trecho mais curto que chega nele)
export function arredonda(P,r,laco){P=limpa(P,laco);const n=P.length;if(!(r>0)||n<3)return P;const O=[];
  for(let i=0;i<n;i++){const b=P[i];if(!laco&&(i===0||i===n-1)){O.push(b);continue}
    const a=P[(i+n-1)%n],c=P[(i+1)%n];let ux=a[0]-b[0],uy=a[1]-b[1],vx=c[0]-b[0],vy=c[1]-b[1];const d1=hip(ux,uy),d2=hip(vx,vy);ux/=d1;uy/=d1;vx/=d2;vy/=d2;
    const th=Math.acos(Math.max(-1,Math.min(1,ux*vx+uy*vy)));if(th>Math.PI-.03||th<.05){O.push(b);continue}
    const tg=Math.tan(th/2),t=Math.min(r/tg,.45*Math.min(d1,d2)),rr=t*tg;let bx=ux+vx,by=uy+vy;const bl=hip(bx,by);bx/=bl;by/=bl;
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
