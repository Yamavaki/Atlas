// Atlas - Modo Batalha: transforma um andar do .atlasmap em malhas prontas para a placa de video.
// Vertice: x, y, u, v, camada da textura (-1 = cor lisa), r, g, b, a, matiz, saturacao, brilho  (12 numeros). Sem DOM: pode rodar em Worker.
import {materialDe,objetoDe} from "./arte.js";
import {arredonda,fita,tampa,limpa,RAIO_PADRAO} from "./vetor.js";
export const VERT=12;
const hex=h=>[parseInt(h.substr(1,2),16)/255,parseInt(h.substr(3,2),16)/255,parseInt(h.substr(5,2),16)/255,1];
const BR=[1,1,1,1],TINTA=hex("#2a2018");
// um objeto = 12 vertices (sombra + arte) escritos em B a partir de off; l = camada da arte na matriz de texturas, rc = recorte da arte
export const N_OBJ=12*VERT;const UM=[1,1,1],TODO=[0,0,1,1],SX=.07,SY=.11;
export function escreveObjeto(B,off,o,l,rc){rc=rc||TODO;const c=Math.cos(o.r),s=Math.sin(o.r),hw=o.w/2,hh=o.h/2,e=.004,ua=rc[0]+e,ub=rc[2]-e,u0=o.m?ub:ua,u1=o.m?ua:ub,v0=rc[1]+e,v1=rc[3]-e,a=o.a==null?1:o.a,q=o.cor||UM,
    mz=(o.mz||0)/360,sa=o.sat==null?1:o.sat,br=o.bri==null?1:o.bri,X=[-hw,hw,hw,-hw,hw,-hw],Y=[-hh,-hh,hh,-hh,hh,hh],U=[u0,u1,u1,u0,u1,u0],V=[v0,v0,v1,v0,v1,v1];
  for(let p=0;p<2;p++){const sb=p===0,dx=sb?SX:0,dy=sb?SY:0;for(let i=0;i<6;i++){const k=off+(p*6+i)*VERT;B[k]=o.x+X[i]*c-Y[i]*s+dx;B[k+1]=o.y+X[i]*s+Y[i]*c+dy;B[k+2]=U[i];B[k+3]=V[i];B[k+4]=l;
    if(sb){B[k+5]=0;B[k+6]=0;B[k+7]=0;B[k+8]=o.s?.42*a:0;B[k+9]=0;B[k+10]=1;B[k+11]=1}else{B[k+5]=q[0];B[k+6]=q[1];B[k+7]=q[2];B[k+8]=a;B[k+9]=mz;B[k+10]=sa;B[k+11]=br}}}}
// luz: 6 vertices de 9 numeros: x, y, lx, ly, r, g, b, forca, nucleo (luz plena / alcance)
export const N_LUZ=54;
export function escreveLuz(B,off,l){const R=l.raio,f=l.forca,k0=Math.max(0,Math.min(.98,(l.claro==null?R*.45:l.claro)/R)),Q=[[-1,-1],[1,-1],[1,1],[-1,-1],[1,1],[-1,1]];for(let i=0;i<6;i++){const k=off+i*9;B[k]=l.x+Q[i][0]*R;B[k+1]=l.y+Q[i][1]*R;B[k+2]=Q[i][0];B[k+3]=Q[i][1];B[k+4]=l.c[0];B[k+5]=l.c[1];B[k+6]=l.c[2];B[k+7]=f;B[k+8]=k0}}
// triangulacao por "orelhas" (poligonos simples, concavos ou nao)
export function triangula(P){const n=P.length;if(n<3)return [];let A=0;for(let i=0;i<n;i++){const a=P[i],b=P[(i+1)%n];A+=a[0]*b[1]-b[0]*a[1]}const V=[];for(let i=0;i<n;i++)V.push(A>0?i:n-1-i);const T=[];let g=0;
  const cr=(a,b,c)=>(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]),den=(a,b,c,p)=>cr(a,b,p)>=0&&cr(b,c,p)>=0&&cr(c,a,p)>=0;
  while(V.length>3&&g++<n*n){let ok=false;for(let i=0;i<V.length;i++){const ia=V[(i+V.length-1)%V.length],ib=V[i],ic=V[(i+1)%V.length],a=P[ia],b=P[ib],c=P[ic];if(cr(a,b,c)<=1e-12)continue;let dentro=false;for(const k of V){if(k===ia||k===ib||k===ic)continue;if(den(a,b,c,P[k])){dentro=true;break}}if(dentro)continue;T.push(ia,ib,ic);V.splice(i,1);ok=true;break}if(!ok)V.splice(0,1)}
  if(V.length===3)T.push(V[0],V[1],V[2]);return T}
export function malhaAndar(A,TEX,IND,REC){REC=REC||[];const itens=[];let ordem=0;const lay=k=>IND[k]==null?IND["m:neutro"]:IND[k];
  const mat=t=>lay("m:"+materialDe(TEX[t]||"")),nome=t=>(TEX[t]||"").split("/").pop().toLowerCase();
  const B=[];let nv=0;const v=(x,y,u,w,l,c)=>{B.push(x,y,u,w,l,c[0],c[1],c[2],c[3],0,1,1);nv++};
  const quad=(p0,p1,p2,p3,uv,l,c)=>{v(p0[0],p0[1],uv[0][0],uv[0][1],l,c);v(p1[0],p1[1],uv[1][0],uv[1][1],l,c);v(p2[0],p2[1],uv[2][0],uv[2][1],l,c);v(p0[0],p0[1],uv[0][0],uv[0][1],l,c);v(p2[0],p2[1],uv[2][0],uv[2][1],l,c);v(p3[0],p3[1],uv[3][0],uv[3][1],l,c)};
  const mundo=p=>[p[0]*.5,p[1]*.5],quadM=(a,b,c_,d,l,c)=>quad(a,b,c_,d,[mundo(a),mundo(b),mundo(c_),mundo(d)],l,c);
  // fita continua: uma peca so, com a juncao calculada em cada ponto; pontas soltas fecham em meia-lua
  const faixa=(P,larg,l,c,laco,pontas)=>{const n=P.length;if(n<2)return;const {E,D}=fita(P,larg,laco);for(let i=0;i<n-(laco?0:1);i++){const k=(i+1)%n;quadM(E[i],E[k],D[k],D[i],l,c)}
    if(pontas&&!laco)for(const [p,q] of[[P[0],P[1]],[P[n-1],P[n-2]]]){const T=tampa(p,q,larg);for(let i=0;i<T.length-1;i++)for(const z of[p,T[i],T[i+1]])v(z[0],z[1],z[0]*.5,z[1]*.5,l,c)}};
  const suaviza=(P,s)=>{if(!s||P.length<3)return P;const O=[];for(let i=0;i<P.length-1;i++){const p0=P[Math.max(0,i-1)],p1=P[i],p2=P[i+1],p3=P[Math.min(P.length-1,i+2)];for(let k=0;k<6;k++){const t=k/6,t2=t*t,t3=t2*t;O.push([.5*(2*p1[0]+(-p0[0]+p2[0])*t+(2*p0[0]-5*p1[0]+4*p2[0]-p3[0])*t2+(-p0[0]+3*p1[0]-3*p2[0]+p3[0])*t3),.5*(2*p1[1]+(-p0[1]+p2[1])*t+(2*p0[1]-5*p1[1]+4*p2[1]-p3[1])*t2+(-p0[1]+3*p1[1]-3*p2[1]+p3[1])*t3)])}}O.push(P[P.length-1]);return O};
  const add=(l,fn)=>itens.push([l,ordem++,fn]);
  for(const z of A.pisos||[])add(-50,()=>{const [i,j,t,c]=z;quadM([i,j],[i+1,j],[i+1,j+1],[i,j+1],mat(t),c||BR)});
  for(const p of A.padroes||[])add(p.l,()=>{const T=triangula(p.p),l=mat(p.t),c=p.c||BR;for(const k of T){const q=p.p[k];v(q[0],q[1],q[0]*.5,q[1]*.5,l,c)}});
  for(const p of A.caminhos||[])add(p.l,()=>{const n=nome(p.t),P=limpa(suaviza(p.p,p.suave),p.laco);if(/shadow/.test(n)){faixa(P,p.larg,-1,[0,0,0,.22],p.laco);return}
      const fino=/fence|rail|rope|chain|vine|web/.test(n);if(!fino)faixa(P,p.larg+.08,-1,[.16,.12,.09,.85],p.laco);faixa(P,fino?Math.min(p.larg,.22):p.larg,mat(p.t),fino?[.62,.5,.36,1]:BR,p.laco)});
  const onde=new Map();
  for(const o of A.objetos||[])add(o.l,()=>{const off=B.length,l=lay("o:"+objetoDe(TEX[o.t]));escreveObjeto(B,off,o,l,REC[l]);onde.set(o,off);nv+=12});
  for(const w of A.paredes||[])add(500,()=>{const P=arredonda(w.p,w.raio==null?RAIO_PADRAO:w.raio,w.laco),g=w.larg||.18;faixa(P,g+.12,-1,TINTA,w.laco,true);faixa(P,g,mat(w.t),w.c||[.86,.84,.8,1],w.laco,true)});
  for(const q of A.portais||[])add(510,()=>{const n=nome(q.t),jan=/window|sill|glass/.test(n),L=q.raio,h=.2,dx=q.dx,dy=q.dy,nx=-dy*h,ny=dx*h,a=[q.x-dx*L,q.y-dy*L],b=[q.x+dx*L,q.y+dy*L],c=jan?[.62,.82,.9,1]:[.55,.36,.2,1];
      quadM([a[0]+nx*1.3,a[1]+ny*1.3],[b[0]+nx*1.3,b[1]+ny*1.3],[b[0]-nx*1.3,b[1]-ny*1.3],[a[0]-nx*1.3,a[1]-ny*1.3],-1,TINTA);quadM([a[0]+nx,a[1]+ny],[b[0]+nx,b[1]+ny],[b[0]-nx,b[1]-ny],[a[0]-nx,a[1]-ny],-1,c)});
  itens.sort((a,b)=>a[0]-b[0]||a[1]-b[1]);for(const it of itens)it[2]();
  // luzes: x, y, lx, ly, r, g, b, forca
  const Lz=[],ondeLuz=new Map();for(const l of A.luzes||[]){ondeLuz.set(l,Lz.length);escreveLuz(Lz,Lz.length,l)}
  return {verts:new Float32Array(B),n:nv,luzes:new Float32Array(Lz),nl:Lz.length/9,onde,ondeLuz}}
