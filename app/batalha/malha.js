// Atlas - Modo Batalha: transforma um andar do .atlasmap em malhas prontas para a placa de video.
// Vertice: x, y, u, v, camada da textura (-1 = cor lisa), r, g, b, a  (9 numeros). Sem DOM: pode rodar em Worker.
import {materialDe,objetoDe} from "./arte.js";
export const VERT=9;
const hex=h=>[parseInt(h.substr(1,2),16)/255,parseInt(h.substr(3,2),16)/255,parseInt(h.substr(5,2),16)/255,1];
const BR=[1,1,1,1],TINTA=hex("#2a2018");
// triangulacao por "orelhas" (poligonos simples, concavos ou nao)
export function triangula(P){const n=P.length;if(n<3)return [];let A=0;for(let i=0;i<n;i++){const a=P[i],b=P[(i+1)%n];A+=a[0]*b[1]-b[0]*a[1]}const V=[];for(let i=0;i<n;i++)V.push(A>0?i:n-1-i);const T=[];let g=0;
  const cr=(a,b,c)=>(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]),den=(a,b,c,p)=>cr(a,b,p)>=0&&cr(b,c,p)>=0&&cr(c,a,p)>=0;
  while(V.length>3&&g++<n*n){let ok=false;for(let i=0;i<V.length;i++){const ia=V[(i+V.length-1)%V.length],ib=V[i],ic=V[(i+1)%V.length],a=P[ia],b=P[ib],c=P[ic];if(cr(a,b,c)<=1e-12)continue;let dentro=false;for(const k of V){if(k===ia||k===ib||k===ic)continue;if(den(a,b,c,P[k])){dentro=true;break}}if(dentro)continue;T.push(ia,ib,ic);V.splice(i,1);ok=true;break}if(!ok)V.splice(0,1)}
  if(V.length===3)T.push(V[0],V[1],V[2]);return T}
export function malhaAndar(A,TEX,IND){const itens=[];let ordem=0;const lay=k=>IND[k]==null?IND["m:neutro"]:IND[k];
  const mat=t=>lay("m:"+materialDe(TEX[t]||"")),nome=t=>(TEX[t]||"").split("/").pop().toLowerCase();
  const B=[];let nv=0;const v=(x,y,u,w,l,c)=>{B.push(x,y,u,w,l,c[0],c[1],c[2],c[3]);nv++};
  const quad=(p0,p1,p2,p3,uv,l,c)=>{v(p0[0],p0[1],uv[0][0],uv[0][1],l,c);v(p1[0],p1[1],uv[1][0],uv[1][1],l,c);v(p2[0],p2[1],uv[2][0],uv[2][1],l,c);v(p0[0],p0[1],uv[0][0],uv[0][1],l,c);v(p2[0],p2[1],uv[2][0],uv[2][1],l,c);v(p3[0],p3[1],uv[3][0],uv[3][1],l,c)};
  const mundo=p=>[p[0]*.5,p[1]*.5],quadM=(a,b,c_,d,l,c)=>quad(a,b,c_,d,[mundo(a),mundo(b),mundo(c_),mundo(d)],l,c);
  const faixa=(P,larg,l,c,laco)=>{const n=P.length,h=larg/2;for(let i=0;i<n-(laco?0:1);i++){const a=P[i],b=P[(i+1)%n],L=Math.hypot(b[0]-a[0],b[1]-a[1]);if(L<1e-6)continue;const nx=-(b[1]-a[1])/L*h,ny=(b[0]-a[0])/L*h;quadM([a[0]+nx,a[1]+ny],[b[0]+nx,b[1]+ny],[b[0]-nx,b[1]-ny],[a[0]-nx,a[1]-ny],l,c)}
    for(let i=laco?0:1;i<n-(laco?0:1);i++){const p=P[i];quadM([p[0]-h,p[1]-h],[p[0]+h,p[1]-h],[p[0]+h,p[1]+h],[p[0]-h,p[1]+h],l,c)}};
  const suaviza=(P,s)=>{if(!s||P.length<3)return P;const O=[];for(let i=0;i<P.length-1;i++){const p0=P[Math.max(0,i-1)],p1=P[i],p2=P[i+1],p3=P[Math.min(P.length-1,i+2)];for(let k=0;k<6;k++){const t=k/6,t2=t*t,t3=t2*t;O.push([.5*(2*p1[0]+(-p0[0]+p2[0])*t+(2*p0[0]-5*p1[0]+4*p2[0]-p3[0])*t2+(-p0[0]+3*p1[0]-3*p2[0]+p3[0])*t3),.5*(2*p1[1]+(-p0[1]+p2[1])*t+(2*p0[1]-5*p1[1]+4*p2[1]-p3[1])*t2+(-p0[1]+3*p1[1]-3*p2[1]+p3[1])*t3)])}}O.push(P[P.length-1]);return O};
  const add=(l,fn)=>itens.push([l,ordem++,fn]);
  for(const z of A.pisos||[])add(-50,()=>{const [i,j,t,c]=z;quadM([i,j],[i+1,j],[i+1,j+1],[i,j+1],mat(t),c||BR)});
  for(const p of A.padroes||[])add(p.l,()=>{const T=triangula(p.p),l=mat(p.t),c=p.c||BR;for(const k of T){const q=p.p[k];v(q[0],q[1],q[0]*.5,q[1]*.5,l,c)}});
  for(const p of A.caminhos||[])add(p.l,()=>{const n=nome(p.t),P=suaviza(p.p,p.suave);if(/shadow/.test(n)){faixa(P,p.larg,-1,[0,0,0,.22],p.laco);return}
      const fino=/fence|rail|rope|chain|vine|web/.test(n);if(!fino)faixa(P,p.larg+.08,-1,[.16,.12,.09,.85],p.laco);faixa(P,fino?Math.min(p.larg,.22):p.larg,mat(p.t),fino?[.62,.5,.36,1]:BR,p.laco)});
  for(const o of A.objetos||[])add(o.l,()=>{const l=lay("o:"+objetoDe(TEX[o.t])),c=Math.cos(o.r),s=Math.sin(o.r),hw=o.w/2,hh=o.h/2,P=(a,b)=>[o.x+a*c-b*s,o.y+a*s+b*c],e=.004,u0=o.m?1-e:e,u1=o.m?e:1-e;
      quad(P(-hw,-hh),P(hw,-hh),P(hw,hh),P(-hw,hh),[[u0,e],[u1,e],[u1,1-e],[u0,1-e]],l,BR)});
  for(const w of A.paredes||[])add(500,()=>{faixa(w.p,.3,-1,TINTA,w.laco);faixa(w.p,.18,mat(w.t),w.c||[.86,.84,.8,1],w.laco)});
  for(const q of A.portais||[])add(510,()=>{const n=nome(q.t),jan=/window|sill|glass/.test(n),L=q.raio,h=.2,dx=q.dx,dy=q.dy,nx=-dy*h,ny=dx*h,a=[q.x-dx*L,q.y-dy*L],b=[q.x+dx*L,q.y+dy*L],c=jan?[.62,.82,.9,1]:[.55,.36,.2,1];
      quadM([a[0]+nx*1.3,a[1]+ny*1.3],[b[0]+nx*1.3,b[1]+ny*1.3],[b[0]-nx*1.3,b[1]-ny*1.3],[a[0]-nx*1.3,a[1]-ny*1.3],-1,TINTA);quadM([a[0]+nx,a[1]+ny],[b[0]+nx,b[1]+ny],[b[0]-nx,b[1]-ny],[a[0]-nx,a[1]-ny],-1,c)});
  itens.sort((a,b)=>a[0]-b[0]||a[1]-b[1]);for(const it of itens)it[2]();
  // luzes: x, y, lx, ly, r, g, b, forca
  const Lz=[];for(const l of A.luzes||[]){const R=l.raio,f=l.forca;for(const [a,b] of[[-1,-1],[1,-1],[1,1],[-1,-1],[1,1],[-1,1]])Lz.push(l.x+a*R,l.y+b*R,a,b,l.c[0],l.c[1],l.c[2],f)}
  return {verts:new Float32Array(B),n:nv,luzes:new Float32Array(Lz),nl:Lz.length/8}}
