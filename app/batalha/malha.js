// Atlas - Modo Batalha: transforma um andar do .atlasmap em malhas prontas para a placa de video.
// Vertice: x, y, u, v, camada da textura (-1 = cor lisa), r, g, b, a, matiz, saturacao, brilho  (12 numeros). Sem DOM: pode rodar em Worker.
import {materialDe,objetoDe} from "./arte.js";
import {arredonda,fita,tampa,limpa,RAIO_PADRAO,curva} from "./vetor.js";
import {trajeto,tipoPortal} from "./modelo.js";
export const VERT=12;
const hex=h=>[parseInt(h.substr(1,2),16)/255,parseInt(h.substr(3,2),16)/255,parseInt(h.substr(5,2),16)/255,1];
const BR=[1,1,1,1],TINTA=hex("#2a2018");
// um objeto = 12 vertices (sombra + arte) escritos em B a partir de off; l = camada da arte na matriz de texturas, rc = recorte da arte
export const N_OBJ=12*VERT;const UM=[1,1,1],TODO=[0,0,1,1];
// sombra projetada (como o mod Drop Shadow): [opacidade, desfoque em quadrados, espalhamento, desloca x, desloca y]
export const SD_OBJ=[.5,.2,.08,.05,.08],SD_PAREDE=[.4,.3,.15,0,0];
// trechos de um trajeto que sobram depois de tirar os vaos (portas e janelas). Cada pedaco: pontos, distancia de cada ponto no trajeto e se as pontas sao pontas de verdade
export const arcos=(P,laco)=>{const S=[0];for(let i=1;i<P.length+(laco?1:0);i++){const a=P[i-1],b=P[i%P.length];S.push(S[i-1]+Math.hypot(b[0]-a[0],b[1]-a[1]))}return S};
export function naParede(P,laco,x,y){const n=P.length;let best=1e18,res=0,acc=0;for(let i=0;i<n-(laco?0:1);i++){const a=P[i],b=P[(i+1)%n],dx=b[0]-a[0],dy=b[1]-a[1],L=Math.hypot(dx,dy);if(L<1e-9)continue;let t=((x-a[0])*dx+(y-a[1])*dy)/(L*L);t=Math.max(0,Math.min(1,t));const d=Math.hypot(a[0]+dx*t-x,a[1]+dy*t-y);if(d<best){best=d;res=acc+t*L}acc+=L}return {d:res,dist:best}}
export function pedacos(P,laco,vaos){const S=arcos(P,laco),T=S[S.length-1],n=P.length;if(!vaos||!vaos.length||T<1e-9)return [{pts:P,s:S.slice(0,n),laco:!!laco,ini:!laco,fim:!laco}];
  let K=[[0,T]];const tira=(a,b)=>{const N=[];for(const [s0,s1] of K){if(b<=s0||a>=s1){N.push([s0,s1]);continue}if(a>s0)N.push([s0,a]);if(b<s1)N.push([b,s1])}K=N};
  for(const [a,b] of vaos){tira(a,b);if(laco){tira(a-T,b-T);tira(a+T,b+T)}}
  K=K.filter(([a,b])=>b-a>1e-3);if(laco&&K.length>1&&K[0][0]<1e-9&&K[K.length-1][1]>T-1e-9){const f=K.pop();K[0]=[f[0],K[0][1]+T]}
  const em=s=>{s=laco?((s%T)+T)%T:Math.max(0,Math.min(T,s));let j=0;while(j<S.length-2&&S[j+1]<s)j++;const a=P[j],b=P[(j+1)%n],L=S[j+1]-S[j]||1,t=Math.max(0,Math.min(1,(s-S[j])/L));return [a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t]};
  return K.map(([s0,s1])=>{const pts=[em(s0)],ss=[s0];for(let j=0;j<S.length-1;j++)for(const sh of laco?[0,T]:[0]){const sj=S[j]+sh;if(sj>s0+1e-6&&sj<s1-1e-6){pts.push(P[j%n]);ss.push(sj)}}
    const o=pts.map((p,i)=>[ss[i],p]).sort((a,b)=>a[0]-b[0]);o.push([s1,em(s1)]);return {pts:o.map(x=>x[1]),s:o.map(x=>x[0]),laco:false,ini:!laco&&s0<1e-9,fim:!laco&&s1>T-1e-9}})}
// vaos de uma parede: portas e janelas presas nela (distancia no trajeto, guardada ou achada pela posicao)
export function vaosDe(A,w,P){const V=[];for(const q of A.portais||[]){if(q.parede==null||q.parede!==w.id)continue;let d=q.d;if(d==null){const r=naParede(P,w.laco,q.x,q.y);if(r.dist>.75)continue;d=r.d}V.push([d-q.raio,d+q.raio])}return V}
// cor do Dungeondraft (custom_color) nas artes coloriveis: gira o matiz a partir do vermelho, como o Dungeondraft
export function tingeDD(o,tex){if(!o.c||o.mz!=null||o.cor||!/colorable/i.test(tex||""))return o;const [r,g,b]=o.c,mx=Math.max(r,g,b),mn=Math.min(r,g,b),d=mx-mn;let h=0;if(d>0){if(mx===r)h=((g-b)/d)%6;else if(mx===g)h=(b-r)/d+2;else h=(r-g)/d+4}h*=60;if(h>180)h-=360;if(h<-180)h+=360;
  return Object.assign({},o,{mz:h,sat:mx?d/mx:0,bri:Math.max(.15,mx)})}
export function escreveObjeto(B,off,o,l,rc){rc=rc||TODO;const c=Math.cos(o.r),s=Math.sin(o.r),hw=o.w/2,hh=o.h/2,e=.00024,sd=o.sd||SD_OBJ,ua=rc[0]+e,ub=rc[2]-e,u0=o.m?ub:ua,u1=o.m?ua:ub,v0=rc[1]+e,v1=rc[3]-e,a=o.a==null?1:o.a,q=o.cor||UM,
    mz=(o.mz||0)/360,sa=o.sat==null?1:o.sat,br=o.bri==null?1:o.bri,X=[-hw,hw,hw,-hw,hw,-hw],Y=[-hh,-hh,hh,-hh,hh,hh],U=[u0,u1,u1,u0,u1,u0],V=[v0,v0,v1,v0,v1,v1];
  for(let p=0;p<2;p++){const sb=p===0,dx=sb?sd[3]:0,dy=sb?sd[4]:0;for(let i=0;i<6;i++){const k=off+(p*6+i)*VERT;B[k]=o.x+X[i]*c-Y[i]*s+dx;B[k+1]=o.y+X[i]*s+Y[i]*c+dy;B[k+2]=U[i];B[k+3]=V[i];B[k+4]=l;
    if(sb){B[k+5]=0;B[k+6]=0;B[k+7]=0;B[k+8]=o.s?sd[0]*a:0;B[k+9]=-2;B[k+10]=sd[2];B[k+11]=1}else{B[k+5]=q[0];B[k+6]=q[1];B[k+7]=q[2];B[k+8]=a;B[k+9]=mz;B[k+10]=sa;B[k+11]=br}}}}
// luz: 6 vertices de 11 numeros: x, y, lx, ly, r, g, b, forca, nucleo (luz plena / alcance), forma (camada na matriz de formas; -1 = redonda; +.25 = animada), giro
export const N_LUZ=66,LV=11;
// formas de luz: chave (atlas:luz/cone ou caminho do pacote) -> camada. O renderizador preenche
export const LUZ_IND={};
const formaDe=l=>{if(!l.tex)return -1;const i=LUZ_IND[l.tex];return i==null?-1:i+(l.anim?.25:0)};
export function escreveLuz(B,off,l){const F=formaDe(l),G=l.gir||0;const R=l.raio,f=l.forca,k0=l.dd?-1:Math.max(0,Math.min(.98,(l.claro==null?R*.45:l.claro)/R)),Q=[[-1,-1],[1,-1],[1,1],[-1,-1],[1,1],[-1,1]];for(let i=0;i<6;i++){const k=off+i*LV;B[k]=l.x+Q[i][0]*R;B[k+1]=l.y+Q[i][1]*R;B[k+2]=Q[i][0];B[k+3]=Q[i][1];B[k+4]=l.c[0];B[k+5]=l.c[1];B[k+6]=l.c[2];B[k+7]=f;B[k+8]=k0;B[k+9]=F;B[k+10]=G}}
// triangulacao por "orelhas" (poligonos simples, concavos ou nao)
export function triangula(P){const n=P.length;if(n<3)return [];let A=0;for(let i=0;i<n;i++){const a=P[i],b=P[(i+1)%n];A+=a[0]*b[1]-b[0]*a[1]}const V=[];for(let i=0;i<n;i++)V.push(A>0?i:n-1-i);const T=[];let g=0;
  const cr=(a,b,c)=>(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]),den=(a,b,c,p)=>cr(a,b,p)>=0&&cr(b,c,p)>=0&&cr(c,a,p)>=0;
  while(V.length>3&&g++<n*n){let ok=false;for(let i=0;i<V.length;i++){const ia=V[(i+V.length-1)%V.length],ib=V[i],ic=V[(i+1)%V.length],a=P[ia],b=P[ib],c=P[ic];if(cr(a,b,c)<=1e-12)continue;let dentro=false;for(const k of V){if(k===ia||k===ib||k===ic)continue;const q=P[k];if((q[0]===a[0]&&q[1]===a[1])||(q[0]===b[0]&&q[1]===b[1])||(q[0]===c[0]&&q[1]===c[1]))continue;if(den(a,b,c,q)){dentro=true;break}}if(dentro)continue;T.push(ia,ib,ic);V.splice(i,1);ok=true;break}if(!ok)V.splice(0,1)}
  if(V.length===3)T.push(V[0],V[1],V[2]);return T}
// poligono com furos: liga cada furo ao contorno por uma ponte e triangula tudo como um poligono so
export function comFuros(P,F){if(!F||!F.length)return P;const area=Q=>{let s=0;for(let i=0;i<Q.length;i++){const a=Q[i],b=Q[(i+1)%Q.length];s+=a[0]*b[1]-b[0]*a[1]}return s/2};let O=area(P)>0?P.slice():P.slice().reverse();
  const hs=F.filter(h=>h&&h.length>=3).map(h=>area(h)>0?h.slice().reverse():h.slice()).sort((a,b)=>Math.max(...b.map(q=>q[0]))-Math.max(...a.map(q=>q[0])));
  const cruza=(p,q,a,b)=>{const d=(u,v,w)=>(v[0]-u[0])*(w[1]-u[1])-(v[1]-u[1])*(w[0]-u[0]),e=(u,v)=>u[0]===v[0]&&u[1]===v[1];if(e(p,a)||e(p,b)||e(q,a)||e(q,b))return false;return d(p,q,a)*d(p,q,b)<0&&d(a,b,p)*d(a,b,q)<0};
  const restam=hs.slice();
  for(const h of hs){restam.shift();let mi=0;for(let i=1;i<h.length;i++)if(h[i][0]>h[mi][0])mi=i;const m=h[mi];
    // ponte: o ponto do contorno mais perto que se enxerga sem cruzar nenhuma borda (contorno, este furo e os que faltam)
    const ordem=O.map((q,i)=>[Math.hypot(q[0]-m[0],q[1]-m[1]),i]).sort((a,b)=>a[0]-b[0]);let best=ordem[0][1];
    const bordas=[O,h,...restam];for(const [,i] of ordem){const v=O[i];let ok=true;for(const R of bordas){for(let k=0;k<R.length&&ok;k++)if(cruza(m,v,R[k],R[(k+1)%R.length]))ok=false;if(!ok)break}if(ok){best=i;break}}
    const anel=h.slice(mi).concat(h.slice(0,mi+1));O=O.slice(0,best+1).concat(anel,[O[best]],O.slice(best+1))}return O}
export function malhaAndar(A,TEX,IND,REC){REC=REC||[];const itens=[];let ordem=0;const lay=k=>IND[k]==null?IND["m:neutro"]:IND[k],real=t=>t!=null&&t>=0?IND["r:"+TEX[t]]:null;
  const mat=t=>{const r=real(t);return r!=null?r:lay("m:"+materialDe(TEX[t]||""))},nome=t=>(TEX[t]||"").split("/").pop().toLowerCase();
  const B=[];let nv=0,SOMB=null;const v=(x,y,u,w,l,c)=>{if(SOMB)B.push(x+(SOMB[3]||0),y+(SOMB[4]||0),u,w,l,0,0,0,SOMB[0],-2,SOMB[2],1);else B.push(x,y,u,w,l,c[0],c[1],c[2],c[3],0,1,1);nv++};
  const quad=(p0,p1,p2,p3,uv,l,c)=>{v(p0[0],p0[1],uv[0][0],uv[0][1],l,c);v(p1[0],p1[1],uv[1][0],uv[1][1],l,c);v(p2[0],p2[1],uv[2][0],uv[2][1],l,c);v(p0[0],p0[1],uv[0][0],uv[0][1],l,c);v(p2[0],p2[1],uv[2][0],uv[2][1],l,c);v(p3[0],p3[1],uv[3][0],uv[3][1],l,c)};
  const kuv=t=>{const tx=TEX[t],w=IND["w:"+tx];return w&&IND["r:"+tx]!=null?256/w:.5};const mundo=(p,k)=>[p[0]*(k||.5),p[1]*(k||.5)],quadM=(a,b,c_,d,l,c,k)=>quad(a,b,c_,d,[mundo(a,k),mundo(b,k),mundo(c_,k),mundo(d,k)],l,c);
  // fita continua: uma peca so, com a juncao calculada em cada ponto; pontas soltas fecham em meia-lua
  const faixa=(P,larg,l,c,laco,pontas)=>{const n=P.length;if(n<2)return;const {E,D}=fita(P,larg,laco);for(let i=0;i<n-(laco?0:1);i++){const k=(i+1)%n;quadM(E[i],E[k],D[k],D[i],l,c)}
    const PT=Array.isArray(pontas)?pontas:[pontas,pontas];if(!laco)for(const [p,q,ok] of[[P[0],P[1],PT[0]],[P[n-1],P[n-2],PT[1]]]){if(!ok)continue;const T=tampa(p,q,larg);for(let i=0;i<T.length-1;i++)for(const z of[p,T[i],T[i+1]])v(z[0],z[1],z[0]*.5,z[1]*.5,l,c)}};
  // faixa com a arte do pacote: a imagem repete ao longo do trajeto (a altura dela e a largura da faixa). nuv: como o "normalize_uv" do Dungeondraft, cada trecho reto recebe um numero inteiro de repeticoes
  const fitaArte=(P,larg,l,c,laco,tex,nuv,vaos)=>{if(P.length<2)return;const asp=IND["a:"+tex]||4,rep=Math.max(.05,asp*larg),PS=arcos(P,laco),TT=PS[PS.length-1];
    for(const pc of pedacos(P,laco,vaos)){const Q=pc.pts,n=Q.length;if(n<2)continue;const {E,D}=fita(Q,larg,pc.laco);
      for(let i=0;i<n-(pc.laco?0:1);i++){const k=(i+1)%n,s0=pc.s[i],s1=pc.laco&&k===0?TT:pc.s[k];if(s1-s0<1e-6)continue;let u0,u1;
        let feito=false;if(nuv){const sm=(s0+s1)/2,b=sm>TT?TT:0;let j=0;while(j<PS.length-2&&PS[j+1]<=sm-b)j++;const Lj=PS[j+1]-PS[j]||1;if(Lj>=rep*.75){const nr=Math.max(1,Math.round(Lj/rep));u0=(s0-b-PS[j])/Lj*nr;u1=(s1-b-PS[j])/Lj*nr;feito=true}}if(!feito){u0=s0/rep;u1=s1/rep}
        // u segue a projecao no eixo do trecho (nos cantos a fita e um trapezio: assim a arte nao entorta na diagonal do quadrilatero)
        const dx=Q[k][0]-Q[i][0],dy=Q[k][1]-Q[i][1],Ls=Math.hypot(dx,dy)||1,ux=dx/Ls,uy=dy/Ls,du=(u1-u0)/(s1-s0),pj=(p,q)=>((p[0]-q[0])*ux+(p[1]-q[1])*uy)*du;
        quad(E[i],E[k],D[k],D[i],[[u0+pj(E[i],Q[i]),0],[u1+pj(E[k],Q[k]),0],[u1+pj(D[k],Q[k]),1],[u0+pj(D[i],Q[i]),1]],l,c)}}};
  const suaviza=(P,s)=>{if(!s||P.length<3)return P;const O=[];for(let i=0;i<P.length-1;i++){const p0=P[Math.max(0,i-1)],p1=P[i],p2=P[i+1],p3=P[Math.min(P.length-1,i+2)];for(let k=0;k<6;k++){const t=k/6,t2=t*t,t3=t2*t;O.push([.5*(2*p1[0]+(-p0[0]+p2[0])*t+(2*p0[0]-5*p1[0]+4*p2[0]-p3[0])*t2+(-p0[0]+3*p1[0]-3*p2[0]+p3[0])*t3),.5*(2*p1[1]+(-p0[1]+p2[1])*t+(2*p0[1]-5*p1[1]+4*p2[1]-p3[1])*t2+(-p0[1]+3*p1[1]-3*p2[1]+p3[1])*t3)])}}O.push(P[P.length-1]);return O};
  // l = camada, fn desenha, sb = desfoque da sombra (0 = nao faz sombra)
  const add=(l,fn,sb)=>itens.push([l,ordem++,fn,sb||0]);const SH=sd=>{SOMB=sd};
  const SM=IND["sombra:mapa"],sdDe=(e,alvo)=>e.sd===0?null:e.sd||(SM&&SM.todos&&SM.alvos&&SM.alvos[alvo]&&SM.sd)||null;
  for(const z of A.pisos||[])add(-50,()=>{const [i,j,t,c]=z;quadM([i,j],[i+1,j],[i+1,j+1],[i,j+1],mat(t),c||BR,kuv(t))});
  const PAR=new Map();for(const w of A.paredes||[])if(w.id!=null)PAR.set(w.id,w);
  // pisos de comodo seguem a parede (com os mesmos cantos arredondados); textura com escala, giro e deslocamento
  for(const p of A.padroes||[])add(p.l,()=>{const w=p.parede!=null&&PAR.get(p.parede),B0=w?trajeto(w):(p.raio?arredonda(curva(p.p,p.cv,true),p.raio,true):curva(p.p,p.cv,true)),P=comFuros(B0,p.furos&&p.furos.map(h=>p.raio?arredonda(h,p.raio,true):h)),T=triangula(P),l=mat(p.t),c=p.c||BR,es=kuv(p.t)/(p.esc||1),cr=Math.cos(p.gt||0),sr=Math.sin(p.gt||0);
    for(const k of T){const q=P[k],u=(q[0]*cr+q[1]*sr)*es+(p.ox||0),w2=(-q[0]*sr+q[1]*cr)*es+(p.oy||0);v(q[0],q[1],u,w2,l,c)}
    if(p.borda>0){const cb=p.cb||[.55,.45,.3,1];faixa(B0,p.borda,-1,cb,true);for(const h of p.furos||[])faixa(p.raio?arredonda(h,p.raio,true):h,p.borda,-1,cb,true)}});
  for(const p of A.caminhos||[])add(p.l,()=>{const n=nome(p.t),rl=real(p.t),P0=limpa(p.cv&&p.cv.some(Boolean)?curva(p.p,p.cv,p.laco):suaviza(p.p,p.suave),p.laco),P=rl!=null&&!p.suave&&IND["dd:origem"]?arredonda(P0,p.larg,p.laco):P0;const psd=sdDe(p,"caminhos");if(rl!=null){if(psd){SH(psd);fitaArte(P,p.larg,rl,BR,p.laco,TEX[p.t]);SH(null)}fitaArte(P,p.larg,rl,p.c||BR,p.laco,TEX[p.t]);return}
    if(p.estilo){const E=p.estilo,cb=p.cb||[.25,.19,.12,.6];if(E==="cerca"){faixa(P,.16,-1,TINTA,p.laco,true);faixa(P,.09,-1,[.62,.47,.3,1],p.laco,true);let acc=0;for(let i=0;i<P.length-1;i++){const a=P[i],b=P[i+1],L=Math.hypot(b[0]-a[0],b[1]-a[1]);while(acc<=L){const t=acc/L,x=a[0]+(b[0]-a[0])*t,y=a[1]+(b[1]-a[1])*t;quadM([x-.11,y-.11],[x+.11,y-.11],[x+.11,y+.11],[x-.11,y+.11],-1,TINTA);quadM([x-.07,y-.07],[x+.07,y-.07],[x+.07,y+.07],[x-.07,y+.07],-1,[.5,.36,.22,1]);acc+=1}acc-=L}return}
      if(p.borda>0)faixa(P,p.larg+2*p.borda,-1,cb,p.laco,true);if(E==="penhasco")faixa(P,p.larg+.14,-1,[.08,.07,.06,.95],p.laco,true);faixa(P,p.larg,mat(p.t),p.c||BR,p.laco,true);return}if(/shadow/.test(n)){faixa(P,p.larg,-1,[0,0,0,.22],p.laco);return}
      const fino=/fence|rail|rope|chain|vine|web/.test(n);if(psd){SH(psd);faixa(P,fino?Math.min(p.larg,.22):p.larg,-1,BR,p.laco);SH(null)}if(!fino)faixa(P,p.larg+.08,-1,[.16,.12,.09,.85],p.laco);faixa(P,fino?Math.min(p.larg,.22):p.larg,mat(p.t),fino?[.62,.5,.36,1]:BR,p.laco)},(real(p.t)!=null||!p.estilo)&&sdDe(p,"caminhos")?sdDe(p,"caminhos")[1]:0);
  const onde=new Map();
  for(const o of A.objetos||[])add(o.l,()=>{const off=B.length,r=real(o.t),l=r!=null?r:lay("o:"+objetoDe(TEX[o.t]));escreveObjeto(B,off,r!=null?tingeDD(o,TEX[o.t]):o,l,r!=null?IND["rc:"+TEX[o.t]]:REC[l]);onde.set(o,off);nv+=12},o.s?(o.sd||SD_OBJ)[1]:0);
  for(const w of A.paredes||[])add(500,()=>{const cvw=w.cv&&w.cv.some(Boolean),P=arredonda(cvw?curva(w.p,w.cv,w.laco):w.p,w.raio==null?(IND["dd:origem"]?0:RAIO_PADRAO):w.raio,w.laco,cvw?null:w.raios),g=w.larg||.18,rw=real(w.t),vaos=vaosDe(A,w,P);
    if(rw!=null){// parede com a arte do pacote: a imagem repete ao longo da parede (sem esticar); a espessura e a altura da imagem, como no Dungeondraft; portas e janelas abrem o vao
      const tx=TEX[w.t],gg=IND["h:"+tx]?Math.max(.04,Math.min(1,IND["h:"+tx]/256)):g,wsd=sdDe(w,"paredes");if(wsd){SH(wsd);fitaArte(P,gg,rw,BR,w.laco,tx,w.nuv!==false,vaos);SH(null)}fitaArte(P,gg,rw,w.c||BR,w.laco,tx,w.nuv!==false,vaos);
      // ponta da parede ("_end" do pacote), nas duas pontas soltas
      const pe=tx.replace(/(\.\w+)$/,"_end$1"),re=IND["r:"+pe];if(re!=null&&!w.laco&&P.length>1){const asp=IND["a:"+pe]||.5,len=gg*asp;for(const [p,q,m] of[[P[0],P[1],1],[P[P.length-1],P[P.length-2],0]]){const L=Math.hypot(p[0]-q[0],p[1]-q[1])||1,ux=(p[0]-q[0])/L,uy=(p[1]-q[1])/L;
        const o={x:p[0],y:p[1],r:Math.atan2(uy,ux),w:len,h:gg,m:m};const off=B.length;escreveObjeto(B,off,o,re,IND["rc:"+pe]);nv+=12}}return}
    const wsd=sdDe(w,"paredes");if(wsd){SH(wsd);for(const pc of pedacos(P,w.laco,vaos))faixa(pc.pts,g+.12,-1,BR,pc.laco);SH(null)}
    for(const pc of pedacos(P,w.laco,vaos))faixa(pc.pts,g+.12,-1,TINTA,pc.laco,[pc.ini,pc.fim]);for(const pc of pedacos(P,w.laco,vaos))faixa(pc.pts,g,mat(w.t),w.c||[.86,.84,.8,1],pc.laco,[pc.ini,pc.fim])},sdDe(w,"paredes")?sdDe(w,"paredes")[1]:0);
  // portas e janelas: tipo proprio (porta, dupla, janela) ou pelo nome da arte importada; porta aberta gira na dobradica
  const rect=(cx,cy,ux,uy,hl,hw,l,c)=>{const nx=-uy,ny=ux;quadM([cx-ux*hl+nx*hw,cy-uy*hl+ny*hw],[cx+ux*hl+nx*hw,cy+uy*hl+ny*hw],[cx+ux*hl-nx*hw,cy+uy*hl-ny*hw],[cx-ux*hl-nx*hw,cy-uy*hl-ny*hw],l,c)};
  const MAD=[.55,.36,.2,1],VID=[.62,.82,.9,1];
  for(const q of A.portais||[])add(510,()=>{const tp=q.tipo||(/window|sill|glass/.test(nome(q.t))?"janela":"porta"),L=q.raio,dx=q.dx,dy=q.dy,ab=q.fechado===false,rq=real(q.t),ea=q.ea||1,eh=q.eh||1;
    // batente (moldura) do pacote: fica parado na parede, por baixo da porta
    const rf=q.tq!=null?real(q.tq):null;if(rf!=null){const af=IND["a:"+TEX[q.tq]]||4,wf=2*L*ea,o={x:q.x,y:q.y,r:Math.atan2(dy,dx),w:wf,h:wf/af*eh,m:!!q.espelho},off=B.length;escreveObjeto(B,off,o,rf,IND["rc:"+TEX[q.tq]]);nv+=12}
    if(rq!=null){// porta ou janela do pacote: a imagem deitada ao longo da parede; aberta, gira 90 graus na dobradica
      const asp=IND["a:"+TEX[q.t]]||4,w2=2*L*ea,h2=2*L/asp*eh;let o;if(ab&&tp!=="janela"){const ux=-dy,uy=dx;o={x:q.x-dx*L+ux*L,y:q.y-dy*L+uy*L,r:Math.atan2(uy,ux),w:w2,h:h2}}else o={x:q.x,y:q.y,r:Math.atan2(dy,dx),w:w2,h:h2,m:!!q.espelho};
      const qsd=sdDe(q,"portais");if(qsd){o.s=1;o.sd=qsd}const off=B.length;escreveObjeto(B,off,o,rq,IND["rc:"+TEX[q.t]]);nv+=12;return}
    {const qsd=sdDe(q,"portais");if(qsd){SH(qsd);rect(q.x,q.y,dx,dy,L+.04,tp==="janela"?.13:.16,-1,BR);SH(null)}}
    if(tp==="janela"){rect(q.x,q.y,dx,dy,L+.04,.13,-1,TINTA);rect(q.x,q.y,dx,dy,L-.02,.08,-1,VID);rect(q.x,q.y,dx,dy,L-.02,.012,-1,[.95,.98,1,1]);return}
    const folhas=tp==="dupla"?[[-L,L],[L,L]]:[[-L,2*L]];rect(q.x,q.y,dx,dy,L,.16,-1,[.16,.12,.09,.9]);
    for(const [o,c] of folhas){const hx=q.x+dx*o,hy=q.y+dy*o,s=o<0?1:-1;if(ab){const ux=-dy,uy=dx;rect(hx+ux*c/2,hy+uy*c/2,ux,uy,c/2,.07,-1,TINTA);rect(hx+ux*c/2,hy+uy*c/2,ux,uy,c/2-.03,.045,-1,MAD)}
      else{rect(hx+dx*s*c/2,hy+dy*s*c/2,dx,dy,c/2,.11,-1,TINTA);rect(hx+dx*s*c/2,hy+dy*s*c/2,dx,dy,c/2-.04,.075,-1,MAD)}}},(sdDe(q,"portais")||[0,0])[1]);
  itens.sort((a,b)=>a[0]-b[0]||a[1]-b[1]);const G=[];for(const it of itens){const v0=nv;SOMB=null;it[2]();SOMB=null;if(!it[3]||nv===v0)continue;const g=G[G.length-1];if(g&&g.l===it[0]){g.v1=nv;g.b+=it[3];g.k++}else G.push({l:it[0],v0,v1:nv,b:it[3],k:1})}
  // grupos de sombra: um por camada que faz sombra (a sombra fica embaixo da camada inteira); no maximo 8, juntando os vizinhos menores
  while(G.length>8){let m=0,mk=1e9;for(let i=0;i<G.length-1;i++)if(G[i].k+G[i+1].k<mk){mk=G[i].k+G[i+1].k;m=i}const a=G[m],b=G[m+1];G.splice(m,2,{l:a.l,v0:a.v0,v1:b.v1,b:a.b+b.b,k:a.k+b.k})}
  const grupos=G.map(g=>({v0:g.v0,v1:g.v1,bl:g.b/g.k}));
  // luzes: x, y, lx, ly, r, g, b, forca
  const lz=malhaLuzes(A,null,TEX),tl=malhaTelhados(A,TEX,IND,PAR);
  // zonas com ambiente proprio (comodo ou forma): triangulos de cor lisa desenhados no alvo da luz antes das luzes
  const Z=[];let nz=0;const zv=(q,c)=>{Z.push(q[0],q[1],0,0,-1,c[0],c[1],c[2],1,0,1,1);nz++};
  for(const w of A.paredes||[])if(w.amb&&w.laco){const P=trajeto(w),T=triangula(P);for(const k of T)zv(P[k],w.amb)}
  for(const p of A.padroes||[])if(p.amb&&p.parede==null){const P=p.raio?arredonda(p.p,p.raio,true):p.p,T=triangula(P);for(const k of T)zv(P[k],p.amb)}
  return {verts:new Float32Array(B),n:nv,luzes:lz.verts,nl:lz.n,cache:lz.cache,onde,ondeLuz:null,zonas:new Float32Array(Z),nz,telhados:tl.verts,nt:tl.n,grupos}}
// ---------- luz com sombra das paredes ----------
// trechos que barram a luz: paredes (caminho arredondado), menos as janelas e as portas abertas
export function barreiras(A,TEX){const S=[];for(const w of A.paredes||[]){if(w.sombra===false)continue;const P=trajeto(w),n=P.length;if(n<2)continue;
    const fur=(A.portais||[]).filter(q=>q.parede!=null&&q.parede===w.id&&(tipoPortal(q,TEX)==="janela"||q.fechado===false)).map(q=>{const d=q.d!=null?q.d:naParede(P,w.laco,q.x,q.y).d;return [d-q.raio,d+q.raio]});let acc=0;
    for(let i=0;i<n-(w.laco?0:1);i++){const a=P[i],b=P[(i+1)%n],L=Math.hypot(b[0]-a[0],b[1]-a[1]);if(L<1e-9)continue;let cortes=[[0,L]];
      for(const [d0,d1] of fur){const u0=d0-acc,u1=d1-acc;if(u1<=0||u0>=L)continue;const N=[];for(const [s0,s1] of cortes){if(u1<=s0||u0>=s1){N.push([s0,s1]);continue}if(u0>s0)N.push([s0,u0]);if(u1<s1)N.push([u1,s1])}cortes=N}
      for(const [s0,s1] of cortes){const ux=(b[0]-a[0])/L,uy=(b[1]-a[1])/L;S.push([a[0]+ux*s0,a[1]+uy*s0,a[0]+ux*s1,a[1]+uy*s1])}acc+=L}}
  return S}
// poligono do que a luz alcanca (raios ate cada ponta de parede e um circulo de 48 direcoes)
export function visibilidade(cx,cy,R,S){const segs=S.filter(s=>{const dx=s[2]-s[0],dy=s[3]-s[1],l=dx*dx+dy*dy;let t=l?((cx-s[0])*dx+(cy-s[1])*dy)/l:0;t=Math.max(0,Math.min(1,t));return Math.hypot(cx-s[0]-dx*t,cy-s[1]-dy*t)<R});if(!segs.length)return null;
  const ang=[];for(let i=0;i<48;i++)ang.push(i/48*Math.PI*2-Math.PI);for(const s of segs)for(const [x,y] of[[s[0],s[1]],[s[2],s[3]]]){const a=Math.atan2(y-cy,x-cx);ang.push(a-1e-4,a,a+1e-4)}ang.sort((a,b)=>a-b);
  const P=[];for(const a of ang){const dx=Math.cos(a),dy=Math.sin(a);let tm=R;for(const s of segs){const ex=s[2]-s[0],ey=s[3]-s[1],den=dx*ey-dy*ex;if(Math.abs(den)<1e-12)continue;const fx=s[0]-cx,fy=s[1]-cy,t=(fx*ey-fy*ex)/den,u=(fx*dy-fy*dx)/den;if(t>1e-6&&u>=-1e-9&&u<=1+1e-9&&t<tm)tm=t}P.push([cx+dx*tm,cy+dy*tm])}return P}
// todas as luzes do andar: quadrado simples sem parede perto; leque com sombra quando ha. cache por luz (refaz so a que mudou)
export function malhaLuzes(A,cache,TEX){const S=cache&&cache.S||barreiras(A,TEX),novo=new Map(),partes=[];let tot=0;novo.S=S;
  for(const l of A.luzes||[]){const k=l.x+","+l.y+","+l.raio+","+(l.claro==null?"":l.claro)+","+l.forca+","+l.c.join(",")+","+(l.sombras!==false)+","+(l.dd?1:0)+","+formaDe(l)+","+(l.gir||0);let ent=cache&&cache.get(l);
    if(!ent||ent.k!==k){const B=[];const k0=l.dd?-1:Math.max(0,Math.min(.98,(l.claro==null?l.raio*.45:l.claro)/l.raio)),F=formaDe(l),G=l.gir||0,put=(x,y)=>B.push(x,y,(x-l.x)/l.raio,(y-l.y)/l.raio,l.c[0],l.c[1],l.c[2],l.forca,k0,F,G);
      const P=l.sombras===false?null:visibilidade(l.x,l.y,l.raio,S);if(!P){const Q=[];escreveLuz(Q,0,l);B.push(...Q)}else for(let i=0;i<P.length;i++){const a=P[i],b=P[(i+1)%P.length];put(l.x,l.y);put(a[0],a[1]);put(b[0],b[1])}ent={k,v:new Float32Array(B)}}
    novo.set(l,ent);partes.push(ent.v);tot+=ent.v.length}
  const out=new Float32Array(tot);let o=0;for(const v of partes){out.set(v,o);o+=v.length}return {verts:out,n:tot/LV,cache:novo}}

// ---------- telhados ----------
// quatro aguas: um pano por lado, do beiral ao centro; duas aguas: cumeeira no eixo comprido; plano: um pano so. Cada pano tem o sombreado pela direcao da luz (de cima a esquerda)
const corta=(P,nx,ny,c)=>{const O=[];for(let i=0;i<P.length;i++){const a=P[i],b=P[(i+1)%P.length],da=a[0]*nx+a[1]*ny-c,db=b[0]*nx+b[1]*ny-c;if(da>=0)O.push(a);if((da>=0)!==(db>=0)){const t=da/(da-db);O.push([a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t])}}return O};
// ---------- telhado de varias alas (retangulos): cada ala tem panos planos; onde as alas se encontram, fica o pano mais alto (da os rincoes) ----------
// ala: {x0,y0,x1,y1,tipo:"quatro"|"duas"|"plano"|"meia", eixo:"x"|"y" (cumeeira das duas aguas), lado:"N|S|L|W" (o lado baixo da meia-agua), h0 (altura do pano plano), k (inclinacao, 1)}
const EPS=1e-6;
const clip=(P,a,b,c)=>{const O=[];for(let i=0;i<P.length;i++){const p=P[i],q=P[(i+1)%P.length],dp=a*p[0]+b*p[1]+c,dq=a*q[0]+b*q[1]+c;if(dp>=-EPS)O.push(p);if((dp>=-EPS)!==(dq>=-EPS)){const t=dp/(dp-dq);O.push([p[0]+(q[0]-p[0])*t,p[1]+(q[1]-p[1])*t])}}return O.length>=3?O:null};
// panos de uma ala: altura h = a*x + b*y + c (cresce para dentro)
function panosAla(R,i){const {x0,y0,x1,y1}=R,k=R.k||1,tp=R.tipo||"quatro",L=[];
  const N={a:0,b:k,c:-k*y0,lado:"N"},S={a:0,b:-k,c:k*y1,lado:"S"},W={a:k,b:0,c:-k*x0,lado:"W"},E={a:-k,b:0,c:k*x1,lado:"L"};
  let ps;if(tp==="plano")ps=[{a:0,b:0,c:R.h0==null?.6:R.h0,lado:""}];else if(tp==="meia"){const d=R.lado||"S";ps=[{N,S,W,L:E}[d]]}
  else if(tp==="duas"){const ex=R.eixo||((x1-x0)>=(y1-y0)?"x":"y");ps=ex==="x"?[N,S]:[W,E]}else ps=[N,S,W,E];
  for(const q of ps){let P=[[x0,y0],[x1,y0],[x1,y1],[x0,y1]];for(const o of ps){if(o===q||!P)continue;P=clip(P,o.a-q.a,o.b-q.b,o.c-q.c)}if(P)L.push(Object.assign({},q,{P,ala:i}))}return L}
const hDe=(q,x,y)=>q.a*x+q.b*y+q.c;
const dentroAla=(R,x,y)=>x>=R.x0-EPS&&x<=R.x1+EPS&&y>=R.y0-EPS&&y<=R.y1+EPS;
const alturaAla=(pn,x,y)=>{let m=1e9;for(const q of pn)m=Math.min(m,hDe(q,x,y));return m};
// pedacos visiveis de um pano: tira o que fica embaixo das outras alas
function visiveis(q,ALAS,PANOS){let L=[q.P];
  for(let j=0;j<ALAS.length;j++){if(j===q.ala)continue;const R=ALAS[j],N=[];
    for(const Q of L){// fora da ala j
      for(const [a,b,c] of [[-1,0,R.x0],[1,0,-R.x1]]){const z=clip(Q,a,b,c);if(z)N.push(z)}
      let mid=clip(Q,1,0,-R.x0);if(mid)mid=clip(mid,-1,0,R.x1);if(mid){for(const [a,b,c] of [[0,-1,R.y0],[0,1,-R.y1]]){const z=clip(mid,a,b,c);if(z)N.push(z)}
        // dentro da ala j: em cada pano dela, fica onde este pano e mais alto
        let den=clip(mid,0,1,-R.y0);if(den)den=clip(den,0,-1,R.y1);if(den)for(const o of PANOS[j]){let z=den;for(const o2 of PANOS[j]){if(o2===o||!z)continue;z=clip(z,o2.a-o.a,o2.b-o.b,o2.c-o.c)}if(z)z=clip(z,q.a-o.a,q.b-o.b,q.c-o.c+(j<q.ala?-1e-4:1e-4));if(z)N.push(z)}}}
    L=N;if(!L.length)break}
  return L.filter(P=>{let a=0;for(let i=0;i<P.length;i++){const u=P[i],v=P[(i+1)%P.length];a+=u[0]*v[1]-v[0]*u[1]}return Math.abs(a)>1e-5})}
export function panosTelhado(ALAS){const PANOS=ALAS.map(panosAla),out=[];for(const pn of PANOS)for(const q of pn)for(const P of visiveis(q,ALAS,PANOS))out.push({P,q});
  // linhas de encontro (cumeeira, espigao, rincao): bordas de pedaco onde, do outro lado, o pano de cima e outro
  const topo=(x,y)=>{let m=-1e9,w=null;for(let j=0;j<ALAS.length;j++){if(!dentroAla(ALAS[j],x,y))continue;for(const o of PANOS[j]){}const h=alturaAla(PANOS[j],x,y);if(h>m+1e-4){m=h;let best=null,bh=1e9;for(const o of PANOS[j]){const v=hDe(o,x,y);if(v<bh){bh=v;best=o}}w=best}}return w};
  const igual=(a,b)=>a&&b&&Math.abs(a.a-b.a)<1e-6&&Math.abs(a.b-b.b)<1e-6&&Math.abs(a.c-b.c)<1e-4;
  const linhas=[];for(const {P,q} of out)for(let i=0;i<P.length;i++){const u=P[i],v=P[(i+1)%P.length],L=Math.hypot(v[0]-u[0],v[1]-u[1]);if(L<.05)continue;
    let cx=0,cy=0;for(const z of P){cx+=z[0];cy+=z[1]}cx/=P.length;cy/=P.length;const mx=(u[0]+v[0])/2,my=(u[1]+v[1])/2;let nx=-(v[1]-u[1])/L,ny=(v[0]-u[0])/L;if(nx*(mx-cx)+ny*(my-cy)<0){nx=-nx;ny=-ny}
    const fora=topo(mx+nx*.03,my+ny*.03);if(!fora||igual(fora,q))continue;if(Math.abs(hDe(fora,mx,my)-hDe(q,mx,my))>.02)continue;
    if(!linhas.some(l=>Math.hypot(l[0][0]-v[0],l[0][1]-v[1])<.01&&Math.hypot(l[1][0]-u[0],l[1][1]-u[1])<.01))linhas.push([u,v])}
  return {panos:out,linhas}}
export function malhaTelhados(A,TEX,IND,PAR){const B=[];let n=0;const lay=k=>IND[k]==null?IND["m:neutro"]:IND[k],real=t=>t!=null&&t>=0?IND["r:"+TEX[t]]:null;
  const v=(x,y,u,w,l,c,br)=>{B.push(x,y,u,w,l,c[0]*br,c[1]*br,c[2]*br,c[3],0,1,1);n++};
  for(const t of A.telhados||[]){if(t.alas&&t.alas.length){telhadoAlas(t,TEX,IND,PAR,v,lay,real);continue}const w=t.parede!=null&&PAR&&PAR.get(t.parede);let P=w?trajeto(w):(t.raio?arredonda(t.p,t.raio,true):t.p);if(!P||P.length<3)continue;
    let ar=0;for(let i=0;i<P.length;i++){const a=P[i],b=P[(i+1)%P.length];ar+=a[0]*b[1]-b[0]*a[1]}if(ar<0)P=P.slice().reverse();
    const rl=real(t.t),l=rl!=null?rl:lay("m:"+materialDe(TEX[t.t]||"atlas:m/telha")),c=t.c||[1,1,1,1],es=(rl!=null&&IND["w:"+TEX[t.t]]?256/IND["w:"+TEX[t.t]]:.5)/(t.esc||1),LX=-.6,LY=-.8;
    const pano=(Q,ang,br)=>{const T=triangula(Q),cs=Math.cos(ang),sn=Math.sin(ang);for(const k of T){const q=Q[k];v(q[0],q[1],(q[0]*cs+q[1]*sn)*es,(-q[0]*sn+q[1]*cs)*es,l,c,br)}};
    const luzDe=(nx,ny)=>.78+.3*(nx*LX+ny*LY);
    const RAW=w?w.p:t.p;let cx=0,cy=0;for(const q of RAW){cx+=q[0];cy+=q[1]}cx/=RAW.length;cy/=RAW.length;
    const linha=(a,b,h,cor)=>{const L=Math.hypot(b[0]-a[0],b[1]-a[1])||1,nx=-(b[1]-a[1])/L*h,ny=(b[0]-a[0])/L*h;for(const z of[[a[0]+nx,a[1]+ny],[b[0]+nx,b[1]+ny],[b[0]-nx,b[1]-ny],[a[0]+nx,a[1]+ny],[b[0]-nx,b[1]-ny],[a[0]-nx,a[1]-ny]])v(z[0],z[1],0,0,-1,cor,1)};
    if(t.estilo==="plano")pano(P,0,.95);
    else if(t.estilo==="duas"){let mx=0,ang=0;for(let i=0;i<P.length;i++){const a=P[i],b=P[(i+1)%P.length],L=Math.hypot(b[0]-a[0],b[1]-a[1]);if(L>mx){mx=L;ang=Math.atan2(b[1]-a[1],b[0]-a[0])}}const nx=-Math.sin(ang),ny=Math.cos(ang),c0=cx*nx+cy*ny;
      pano(corta(P,nx,ny,c0),ang,luzDe(nx,ny));pano(corta(P,-nx,-ny,-c0),ang,luzDe(-nx,-ny));const d=[Math.cos(ang),Math.sin(ang)];let t0=1e9,t1=-1e9;for(const q of P){const s=(q[0]-cx)*d[0]+(q[1]-cy)*d[1];t0=Math.min(t0,s);t1=Math.max(t1,s)}
      const a=[cx+d[0]*t0,cy+d[1]*t0],b=[cx+d[0]*t1,cy+d[1]*t1],h=.05;for(const z of[[a[0]+nx*h,a[1]+ny*h],[b[0]+nx*h,b[1]+ny*h],[b[0]-nx*h,b[1]-ny*h],[a[0]+nx*h,a[1]+ny*h],[b[0]-nx*h,b[1]-ny*h],[a[0]-nx*h,a[1]-ny*h]])v(z[0],z[1],0,0,-1,[.12,.08,.06,.85],1)}
    else for(let i=0;i<P.length;i++){const a=P[i],b=P[(i+1)%P.length],L=Math.hypot(b[0]-a[0],b[1]-a[1]);if(L<1e-6)continue;const ang=Math.atan2(b[1]-a[1],b[0]-a[0])+Math.PI,nx=(b[1]-a[1])/L,ny=-(b[0]-a[0])/L;pano([a,b,[cx,cy]],ang,luzDe(nx,ny))}
    if(!t.estilo||t.estilo==="quatro")for(const q of RAW)linha(q,[cx,cy],.035,[.14,.09,.06,.7]);
    // beiral escuro em volta
    const {E,D}=fita(P,.1,true);for(let i=0;i<P.length;i++){const k=(i+1)%P.length;for(const z of[E[i],E[k],D[k],E[i],D[k],D[i]])v(z[0],z[1],0,0,-1,[.1,.07,.05,.9],1)}}
  return {verts:new Float32Array(B),n}}
// telhado de alas: panos com a textura (fileiras paralelas ao beiral, caindo para fora), sombra pelo lado, cumeeiras/espigoes/rincoes e beiral
function telhadoAlas(t,TEX,IND,PAR,v,lay,real){const rl=real(t.t),l=rl!=null?rl:lay("m:"+materialDe(TEX[t.t]||"atlas:m/telha")),c=t.c||[1,1,1,1],tx=TEX[t.t],es=(rl!=null&&IND["w:"+tx]?256/IND["w:"+tx]:.5)/(t.esc||1),LX=-.6,LY=-.8;
  const {panos,linhas}=panosTelhado(t.alas);
  for(const {P,q} of panos){const g=Math.hypot(q.a,q.b);let sn=0,cs=1,br=.95;if(g>1e-9){sn=q.a/g;cs=-q.b/g;br=.8+.32*((-q.a/g)*LX+(-q.b/g)*LY)}
    const T=triangula(P);for(const k of T){const z=P[k];v(z[0],z[1],(z[0]*cs+z[1]*sn)*es,(-z[0]*sn+z[1]*cs)*es,l,c,br)}}
  // linhas de encontro: com a arte de cumeeira (caminho do pacote) ou uma linha escura
  const rq=real(t.tq),tq=TEX[t.tq],asp=IND["a:"+tq]||4,lw=t.cumeLarg||.32;
  for(const [a,b] of linhas){const L=Math.hypot(b[0]-a[0],b[1]-a[1]);if(L<1e-4)continue;const nx=-(b[1]-a[1])/L,ny=(b[0]-a[0])/L;
    if(rq!=null){const h=lw/2,u1=L/(asp*lw),P=[[a[0]+nx*h,a[1]+ny*h],[b[0]+nx*h,b[1]+ny*h],[b[0]-nx*h,b[1]-ny*h],[a[0]-nx*h,a[1]-ny*h]],U=[[0,0],[u1,0],[u1,1],[0,1]];for(const k of [0,1,2,0,2,3])v(P[k][0],P[k][1],U[k][0],U[k][1],rq,c,1)}
    else{const h=.035;for(const z of[[a[0]+nx*h,a[1]+ny*h],[b[0]+nx*h,b[1]+ny*h],[b[0]-nx*h,b[1]-ny*h],[a[0]+nx*h,a[1]+ny*h],[b[0]-nx*h,b[1]-ny*h],[a[0]-nx*h,a[1]-ny*h]])v(z[0],z[1],0,0,-1,[.12,.09,.07,.75],1)}}
  // beiral: em volta de cada ala, so nos trechos que nao ficam dentro de outra
  for(let i=0;i<t.alas.length;i++){const R=t.alas[i],E=[[[R.x0,R.y0],[R.x1,R.y0]],[[R.x1,R.y0],[R.x1,R.y1]],[[R.x1,R.y1],[R.x0,R.y1]],[[R.x0,R.y1],[R.x0,R.y0]]];
    for(const [a,b] of E){const L=Math.hypot(b[0]-a[0],b[1]-a[1]),n=Math.max(1,Math.ceil(L/.25));for(let s2=0;s2<n;s2++){const p=[a[0]+(b[0]-a[0])*s2/n,a[1]+(b[1]-a[1])*s2/n],q=[a[0]+(b[0]-a[0])*(s2+1)/n,a[1]+(b[1]-a[1])*(s2+1)/n],mx=(p[0]+q[0])/2,my=(p[1]+q[1])/2;
      if(t.alas.some((o,j)=>j!==i&&mx>o.x0+.01&&mx<o.x1-.01&&my>o.y0+.01&&my<o.y1-.01))continue;const nx=-(q[1]-p[1])/(L/n)*.05,ny=(q[0]-p[0])/(L/n)*.05;
      for(const z of[[p[0]+nx,p[1]+ny],[q[0]+nx,q[1]+ny],[q[0]-nx,q[1]-ny],[p[0]+nx,p[1]+ny],[q[0]-nx,q[1]-ny],[p[0]-nx,p[1]-ny]])v(z[0],z[1],0,0,-1,[.08,.06,.05,.9],1)}}}}
