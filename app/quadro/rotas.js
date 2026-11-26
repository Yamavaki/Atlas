// Atlas - rotas das linhas do quadro (1.58)
// As linhas contornam os cartões (caminho em ângulo reto com cantos arredondados), saem de pontos
// espalhados no lado do cartão e, quando passam pelo mesmo corredor, ficam lado a lado (paralelas)
// em vez de uma por cima da outra. Linhas com pontos próprios (atlas.pts) seguem os pontos.

const DIR={top:[0,-1],bottom:[0,1],left:[-1,0],right:[1,0]};
const M=18,STUB=24,PASSO=16,RAIO=14;

export function melhoresLados(a,b){const ca=[a.x+a.width/2,a.y+a.height/2],cb=[b.x+b.width/2,b.y+b.height/2],dx=cb[0]-ca[0],dy=cb[1]-ca[1];return Math.abs(dx)*a.height>Math.abs(dy)*a.width?(dx>0?["right","left"]:["left","right"]):(dy>0?["bottom","top"]:["top","bottom"])}
// lado do cartão que olha para um ponto
function ladoPara(n,pt){const c=[n.x+n.width/2,n.y+n.height/2],dx=pt[0]-c[0],dy=pt[1]-c[1];return Math.abs(dx)*n.height>Math.abs(dy)*n.width?(dx>0?"right":"left"):(dy>0?"bottom":"top")}
const pontoLado=(n,lado,f)=>{f=f==null?.5:f;return lado==="top"?[n.x+n.width*f,n.y]:lado==="bottom"?[n.x+n.width*f,n.y+n.height]:lado==="left"?[n.x,n.y+n.height*f]:[n.x+n.width,n.y+n.height*f]};

// ---------- heap simples ----------
class Heap{constructor(){this.a=[]}push(k,v){const a=this.a;a.push([k,v]);let i=a.length-1;while(i){const p=(i-1)>>1;if(a[p][0]<=a[i][0])break;[a[p],a[i]]=[a[i],a[p]];i=p}}
  pop(){const a=this.a,t=a[0],l=a.pop();if(a.length){a[0]=l;let i=0;for(;;){const L=2*i+1,R=L+1;let m=i;if(L<a.length&&a[L][0]<a[m][0])m=L;if(R<a.length&&a[R][0]<a[m][0])m=R;if(m===i)break;[a[m],a[i]]=[a[i],a[m]];i=m}}return t}get size(){return this.a.length}}

// segmento em ângulo reto atravessa o retângulo (interior)?
const corta=(x0,y0,x1,y1,r)=>{if(x0===x1){const a=Math.min(y0,y1),b=Math.max(y0,y1);return x0>r[0]&&x0<r[2]&&b>r[1]&&a<r[3]}const a=Math.min(x0,x1),b=Math.max(x0,x1);return y0>r[1]&&y0<r[3]&&b>r[0]&&a<r[2]};
const dentro=(x,y,r)=>x>r[0]&&x<r[2]&&y>r[1]&&y<r[3];

// caminho em ângulo reto de ps a qs, saindo na direção da e chegando na direção db, sem atravessar obstáculos
function ortogonal(ps,da,qs,db,obs){
  const bx0=Math.min(ps[0],qs[0])-260,bx1=Math.max(ps[0],qs[0])+260,by0=Math.min(ps[1],qs[1])-260,by1=Math.max(ps[1],qs[1])+260;
  const O=obs.filter(r=>r[2]>bx0&&r[0]<bx1&&r[3]>by0&&r[1]<by1&&!dentro(ps[0],ps[1],r)&&!dentro(qs[0],qs[1],r));
  // caminhos simples primeiro (L e Z): se algum está livre, usa
  const livre=P=>{for(let i=1;i<P.length;i++)for(const r of O)if(corta(P[i-1][0],P[i-1][1],P[i][0],P[i][1],r))return false;return true};
  const mx=(ps[0]+qs[0])/2,my=(ps[1]+qs[1])/2,cand=[];
  if(ps[0]===qs[0]||ps[1]===qs[1])cand.push([ps,qs]);
  const horA=da[0]!==0,horB=db[0]!==0;
  if(horA&&horB)cand.push([ps,[mx,ps[1]],[mx,qs[1]],qs]);else if(!horA&&!horB)cand.push([ps,[ps[0],my],[qs[0],my],qs]);
  cand.push([ps,[qs[0],ps[1]],qs],[ps,[ps[0],qs[1]],qs]);
  const bom=P=>{// não pode voltar para dentro do cartão de origem/destino (primeiro passo na direção da saída)
    const v=[P[1][0]-P[0][0],P[1][1]-P[0][1]],w=[P[P.length-1][0]-P[P.length-2][0],P[P.length-1][1]-P[P.length-2][1]];
    return !(v[0]*da[0]+v[1]*da[1]<0)&&!(w[0]*db[0]+w[1]*db[1]>0)};
  for(const P of cand)if(bom(P)&&livre(P))return P;
  // busca na grade de coordenadas "interessantes" (bordas dos obstáculos), com custo por curva
  const X=new Set([ps[0],qs[0],mx]),Y=new Set([ps[1],qs[1],my]);
  for(const r of O){X.add(r[0]);X.add(r[2]);Y.add(r[1]);Y.add(r[3])}
  const xs=[...X].sort((a,b)=>a-b),ys=[...Y].sort((a,b)=>a-b),nx=xs.length,ny=ys.length;
  if(nx*ny>9000)return null;
  const ix=new Map(xs.map((v,i)=>[v,i])),iy=new Map(ys.map((v,i)=>[v,i]));
  const bloq=(i,j)=>{const x=xs[i],y=ys[j];for(const r of O)if(dentro(x,y,r))return true;return false};
  const BL=new Uint8Array(nx*ny);for(let i=0;i<nx;i++)for(let j=0;j<ny;j++)BL[j*nx+i]=bloq(i,j)?1:0;
  const D4=[[1,0],[-1,0],[0,1],[0,-1]],dirIdx=d=>d[0]===1?0:d[0]===-1?1:d[1]===1?2:3;
  const s0=[ix.get(ps[0]),iy.get(ps[1])],s1=[ix.get(qs[0]),iy.get(qs[1])],chegada=dirIdx(db.map(v=>-v));
  const N=nx*ny*4,dist=new Float64Array(N).fill(Infinity),prev=new Int32Array(N).fill(-1),H=new Heap();
  const k0=((s0[1]*nx+s0[0])<<2)|dirIdx(da);dist[k0]=0;H.push(0,k0);let fim=-1;const CURVA=60;
  while(H.size){const [c,k]=H.pop();if(c>dist[k])continue;const d=k&3,p=k>>2,i=p%nx,j=(p/nx)|0;
    if(i===s1[0]&&j===s1[1]){if(d===chegada||fim<0){fim=k;if(d===chegada)break}continue}
    for(let nd=0;nd<4;nd++){if((d^1)===nd&&(d>>1)===(nd>>1))continue;const ni=i+D4[nd][0],nj=j+D4[nd][1];if(ni<0||nj<0||ni>=nx||nj>=ny)continue;
      if(BL[nj*nx+ni]&&!(ni===s1[0]&&nj===s1[1]))continue;
      const x0=xs[i],y0=ys[j],x1=xs[ni],y1=ys[nj];let ok=true;for(const r of O)if(corta(x0,y0,x1,y1,r)){ok=false;break}if(!ok)continue;
      const nk=((nj*nx+ni)<<2)|nd,nc=c+Math.abs(x1-x0)+Math.abs(y1-y0)+(nd!==d?CURVA:0)+(ni===s1[0]&&nj===s1[1]&&nd!==chegada?CURVA:0);
      if(nc<dist[nk]){dist[nk]=nc;prev[nk]=k;H.push(nc,nk)}}}
  if(fim<0)return null;const P=[];for(let k=fim;k>=0;k=prev[k]){const p=k>>2;P.push([xs[p%nx],ys[(p/nx)|0]])}P.reverse();return P}

function simplifica(P){const R=[P[0]];for(let i=1;i<P.length;i++){const a=R[R.length-1],b=P[i];if(Math.abs(a[0]-b[0])<.01&&Math.abs(a[1]-b[1])<.01)continue;
    if(R.length>1){const z=R[R.length-2];if((Math.abs(z[0]-a[0])<.01&&Math.abs(a[0]-b[0])<.01)||(Math.abs(z[1]-a[1])<.01&&Math.abs(a[1]-b[1])<.01)){R[R.length-1]=b;continue}}R.push(b)}return R}

// caminho SVG com cantos arredondados
export function arredonda(P,raio){raio=raio||RAIO;if(P.length<3)return "M"+P[0]+"L"+P[P.length-1];let d="M"+P[0];
  for(let i=1;i<P.length-1;i++){const a=P[i-1],b=P[i],c=P[i+1],l1=Math.hypot(b[0]-a[0],b[1]-a[1]),l2=Math.hypot(c[0]-b[0],c[1]-b[1]),r=Math.min(raio,l1/2,l2/2);
    if(r<.5){d+="L"+b;continue}const u=[(b[0]-a[0])/l1,(b[1]-a[1])/l1],v=[(c[0]-b[0])/l2,(c[1]-b[1])/l2];d+="L"+[b[0]-u[0]*r,b[1]-u[1]*r]+"Q"+b+" "+[b[0]+v[0]*r,b[1]+v[1]*r]}
  return d+"L"+P[P.length-1]}
function meioDe(P){let L=0;for(let i=1;i<P.length;i++)L+=Math.hypot(P[i][0]-P[i-1][0],P[i][1]-P[i-1][1]);let h=L/2;for(let i=1;i<P.length;i++){const s=Math.hypot(P[i][0]-P[i-1][0],P[i][1]-P[i-1][1]);if(h<=s&&s>0){const t=h/s;return [P[i-1][0]+(P[i][0]-P[i-1][0])*t,P[i-1][1]+(P[i][1]-P[i-1][1])*t]}h-=s}return P[0]}

// forma da linha: "pontos" (o usuário colocou pontos), "reta", "curva" (a antiga) ou "contorna" (padrão)
export const formaDe=e=>{const a=e.atlas||{};return a.pts&&a.pts.length?"pontos":a.curva===false?"reta":a.forma==="curva"?"curva":"contorna"};

function curvaAntiga(A,B,fs,ts,p,q){const L=Math.max(40,Math.min(220,Math.hypot(q[0]-p[0],q[1]-p[1])*.45)),a=DIR[fs],b=DIR[ts],c1=[p[0]+a[0]*L,p[1]+a[1]*L],c2=[q[0]+b[0]*L,q[1]+b[1]*L];
  const bz=t=>{const u=1-t;return [u*u*u*p[0]+3*u*u*t*c1[0]+3*u*t*t*c2[0]+t*t*t*q[0],u*u*u*p[1]+3*u*u*t*c1[1]+3*u*t*t*c2[1]+t*t*t*q[1]]};
  return {d:"M"+p+"C"+c1+" "+c2+" "+q,p,q,meio:bz(.5),t:[q[0]-c2[0],q[1]-c2[1]],t0:[p[0]-c1[0],p[1]-c1[1]],P:[p,bz(.25),bz(.5),bz(.75),q]}}

// ---------- todas as linhas de uma vez ----------
// cache: rota bruta por linha, refeita só quando a linha ou os cartões em volta mudam
export function criaRoteador(){const cache=new Map();
  return function rotear(D,nos,vis,rapido){const t0=performance.now();let pend=false;const R=new Map(),obsNos=D.nodes.filter(n=>n.type!=="group"&&vis(n));
    const rect=n=>[n.x-M,n.y-M,n.x+n.width+M,n.y+n.height+M];const obs=obsNos.map(rect);
    // 1) lados de cada linha
    const L=[];for(const e of D.edges){const A=nos.get(e.fromNode),B=nos.get(e.toNode);if(!A||!B||!vis(A)||!vis(B))continue;const f=formaDe(e),pts=f==="pontos"?e.atlas.pts:null;
      let fs=e.fromSide,ts=e.toSide;if(pts){fs=fs||ladoPara(A,pts[0]);ts=ts||ladoPara(B,pts[pts.length-1])}else if(!fs||!ts){const m=melhoresLados(A,B);fs=fs||m[0];ts=ts||m[1]}
      L.push({e,A,B,f,pts,fs,ts})}
    // 2) várias linhas no mesmo lado do cartão: pontos espalhados ao longo do lado, na ordem do outro cartão
    const porLado=new Map(),add=(n,lado,l,ponta)=>{const k=n.id+"|"+lado;if(!porLado.has(k))porLado.set(k,[]);porLado.get(k).push([l,ponta])};
    for(const l of L){if(l.f==="curva"||l.f==="reta")continue;add(l.A,l.fs,l,0);add(l.B,l.ts,l,1)}
    for(const [k,lst] of porLado){if(lst.length<2){for(const [l,pt] of lst)l["f"+pt]=.5;continue}const lado=k.split("|")[1],hor=lado==="top"||lado==="bottom",n=pt=>pt[1]?pt[0].A:pt[0].B;
      lst.sort((a,b)=>{const o1=n(a),o2=n(b);return hor?(o1.x+o1.width/2)-(o2.x+o2.width/2):(o1.y+o1.height/2)-(o2.y+o2.height/2)});
      const no=lst[0][1]?lst[0][0].B:lst[0][0].A,len=hor?no.width:no.height,passo=Math.min(PASSO*1.4,len*.8/(lst.length));
      lst.forEach(([l,pt],i)=>{l["f"+pt]=.5+(i-(lst.length-1)/2)*passo/len})}
    // linha sozinha entre dois lados que se olham: alinha as pontas para sair reta (sem degrau)
    for(const l of L){if(l.f!=="contorna"||l.f0!==.5||l.f1!==.5)continue;const {A,B,fs,ts}=l;
      if((fs==="right"&&ts==="left"&&A.x+A.width<B.x)||(fs==="left"&&ts==="right"&&B.x+B.width<A.x)){const y0=Math.max(A.y,B.y)+12,y1=Math.min(A.y+A.height,B.y+B.height)-12;if(y1>y0){const y=Math.min(y1,Math.max(y0,(A.y+A.height/2+B.y+B.height/2)/2));l.f0=(y-A.y)/A.height;l.f1=(y-B.y)/B.height}}
      if((fs==="bottom"&&ts==="top"&&A.y+A.height<B.y)||(fs==="top"&&ts==="bottom"&&B.y+B.height<A.y)){const x0=Math.max(A.x,B.x)+12,x1=Math.min(A.x+A.width,B.x+B.width)-12;if(x1>x0){const x=Math.min(x1,Math.max(x0,(A.x+A.width/2+B.x+B.width/2)/2));l.f0=(x-A.x)/A.width;l.f1=(x-B.x)/B.width}}}
    // 3) rota de cada linha
    for(const l of L){const {e,A,B,fs,ts}=l;const p=pontoLado(A,fs,l.f0),q=pontoLado(B,ts,l.f1);
      if(l.f==="reta"){R.set(e.id,{d:"M"+p+"L"+q,p,q,meio:[(p[0]+q[0])/2,(p[1]+q[1])/2],t:[q[0]-p[0],q[1]-p[1]],t0:[p[0]-q[0],p[1]-q[1]],P:[p,q],fixo:true});continue}
      if(l.f==="curva"){const r=curvaAntiga(A,B,fs,ts,pontoLado(A,fs),pontoLado(B,ts));r.fixo=true;R.set(e.id,r);continue}
      if(l.f==="pontos"){const P=[p,...l.pts.map(v=>[v[0],v[1]]),q];R.set(e.id,{P,pontos:true,fixo:true});continue}
      const da=DIR[fs],db=DIR[ts],ps=[p[0]+da[0]*STUB,p[1]+da[1]*STUB],qs=[q[0]+db[0]*STUB,q[1]+db[1]*STUB];
      const bx0=Math.min(ps[0],qs[0])-260,bx1=Math.max(ps[0],qs[0])+260,by0=Math.min(ps[1],qs[1])-260,by1=Math.max(ps[1],qs[1])+260;
      let sig=p+";"+q+";"+fs+ts;for(const r of obs)if(r[2]>bx0&&r[0]<bx1&&r[3]>by0&&r[1]<by1)sig+=";"+r;
      const c=cache.get(e.id);let P;
      if(c&&c.sig===sig)P=c.P;else{const lento=rapido||performance.now()-t0>90;if(lento&&!rapido)pend=true;const meio=lento?null:ortogonal(ps,da,qs,db,obs);
        P=meio?simplifica([p,...meio,q]):simplifica([p,ps,...(da[0]!==0&&db[0]!==0?[[(ps[0]+qs[0])/2,ps[1]],[(ps[0]+qs[0])/2,qs[1]]]:da[1]!==0&&db[1]!==0?[[ps[0],(ps[1]+qs[1])/2],[qs[0],(ps[1]+qs[1])/2]]:[[qs[0],ps[1]]]),qs,q]);
        if(!lento)cache.set(e.id,{sig,P})}
      R.set(e.id,{P:P.map(v=>v.slice())})}
    // 4) linhas no mesmo corredor ficam paralelas (afasta segmentos que se sobrepõem)
    const segs=[];for(const [id,r] of R){if(r.fixo)continue;const P=r.P;for(let i=1;i<P.length-2;i++){const a=P[i],b=P[i+1];if(Math.abs(a[0]-b[0])<.5)segs.push({v:true,c:a[0],lo:Math.min(a[1],b[1]),hi:Math.max(a[1],b[1]),a,b});else if(Math.abs(a[1]-b[1])<.5)segs.push({v:false,c:a[1],lo:Math.min(a[0],b[0]),hi:Math.max(a[0],b[0]),a,b})}}
    for(const v of [true,false]){const S=segs.filter(s=>s.v===v).sort((x,y)=>x.c-y.c||x.lo-y.lo),feito=new Set();
      for(let i=0;i<S.length;i++){if(feito.has(i))continue;const g=[S[i]];feito.add(i);for(let j=i+1;j<S.length&&S[j].c-S[i].c<PASSO*.6;j++){if(feito.has(j))continue;if(g.some(s=>S[j].lo<s.hi-1&&S[j].hi>s.lo+1)){g.push(S[j]);feito.add(j)}}
        if(g.length<2)continue;g.sort((x,y)=>x.lo-y.lo);const base=g.reduce((s,x)=>s+x.c,0)/g.length;g.forEach((s,k)=>{const nc=base+(k-(g.length-1)/2)*PASSO*.75;if(v){s.a[0]=nc;s.b[0]=nc}else{s.a[1]=nc;s.b[1]=nc}})}}
    // 5) desenho
    for(const [id,r] of R){if(r.d&&!r.pontos)continue;const P=r.P,n=P.length;r.d=arredonda(P,r.pontos?22:RAIO);r.p=P[0];r.q=P[n-1];r.meio=meioDe(P);r.t=[P[n-1][0]-P[n-2][0],P[n-1][1]-P[n-2][1]];r.t0=[P[0][0]-P[1][0],P[0][1]-P[1][1]]}
    for(const id of cache.keys())if(!R.has(id))cache.delete(id);
    R.pendente=pend;return R}}
