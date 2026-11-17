// Auditoria do espaco 3D (so para testes): mede apoio de objetos, plataformas x agua x muralha x ruas
(function(){
const inP=(P,x,y)=>{let c=false;for(let i=0,j=P.length-1;i<P.length;j=i++){const a=P[i],b=P[j];if((a[1]>y)!==(b[1]>y)&&x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0])c=!c}return c};
const segD=(x,y,a,b)=>{const dx=b[0]-a[0],dy=b[1]-a[1],l=dx*dx+dy*dy||1;let t=((x-a[0])*dx+(y-a[1])*dy)/l;t=t<0?0:t>1?1:t;return Math.hypot(x-a[0]-t*dx,y-a[1]-t*dy)};
window.QAS={space(C){const T=C.TBL||[],Z=1.55,AS=window.AtlasAssets;if(!C.TER)return {ter:0};
  const G=new Map();T.forEach((b,i)=>{let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9;for(const v of b.poly){x0=Math.min(x0,v[0]);x1=Math.max(x1,v[0]);y0=Math.min(y0,v[1]);y1=Math.max(y1,v[1])}b._bb=[x0,y0,x1,y1];for(let gx=Math.floor(x0/40);gx<=Math.floor(x1/40);gx++)for(let gy=Math.floor(y0/40);gy<=Math.floor(y1/40);gy++){const k=gx+"_"+gy;G.has(k)?G.get(k).push(i):G.set(k,[i])}});
  const sup=(x,y)=>{for(const i of G.get(((x/40)|0)+"_"+((y/40)|0))||[]){const b=T[i];if(x<b._bb[0]||x>b._bb[2]||y<b._bb[1]||y>b._bb[3])continue;if(inP(b.poly,x,y))return i}return -1};
  const hAt=i=>i<0?null:T[i].h;
  const mixed=(pts)=>{const s=pts.map(p=>sup(p[0],p[1]));return s.some(v=>v!==s[0])};
  const obbPts=(x,y,a,L,D,k)=>{const c=Math.cos(a),s=Math.sin(a),l=L/2*k,d=D/2*k;return [[x,y],[x+c*l-s*d,y+s*l+c*d],[x-c*l-s*d,y-s*l+c*d],[x-c*l+s*d,y-s*l-c*d],[x+c*l+s*d,y+s*l-c*d]]};
  const ring=(x,y,r,n)=>{const o=[[x,y]];for(let k=0;k<n;k++){const a=k/n*6.2832;o.push([x+Math.cos(a)*r,y+Math.sin(a)*r])}return o};
  const wet=(x,y)=>C.land(x,y)<.04||C.rw&&C.rd(x,y)<C.rw;
  const R={ter:1,blocks:T.length,houses:0,hMix:0,spb:0,sMix:0,props:0,pMix:0,trees:0,tMix:0,blkWet:0,blkWall:0,wallOnBlk:0,gateOnBlk:0,streetPropOnBlk:0,houseWet:0,brWall:0,crossNoBridge:0,ex:[]};
  for(const b of C.B){if(b.k)continue;R.houses++;if(mixed(obbPts(b.x,b.y,b.ang,b.L,b.D,.85))){R.hMix++;if(R.ex.length<6)R.ex.push(["casa",Math.round(b.x),Math.round(b.y)])}if(wet(b.x,b.y))R.houseWet++}
  for(const q of C.SPB){R.spb++;if(q.k===2||q.k===3||q.k===8||q.k===13||q.k===14)continue;const r=q.id?((AS.SIZE[q.id]||[6])[0])*Z*.42:(q.r||10)*.55;if(q.pod){R.pod=(R.pod||0)+1;continue}if(mixed(ring(q.x,q.y,r,8))){R.sMix++;if(R.ex.length<10)R.ex.push([q.id||("k"+q.k),Math.round(q.x),Math.round(q.y)])}}
  for(const q of C.props){if(q.id==="stairs")continue;R.props++;const r=((AS.SIZE[q.id]||[6])[0])*Z*(q.s||1)*.42;const m=mixed(ring(q.x,q.y,r,4));if(m)R.pMix++;if(q.street&&sup(q.x,q.y)>=0)R.streetPropOnBlk++}
  for(const t of C.trees){R.trees++;if(mixed(ring(t[0],t[1],3*(t[2]||1),4)))R.tMix++}
  const WL=(C.walls||[]).filter(w=>w.pts&&C.WALLON);const wallD=(x,y)=>{let d=1e9;for(const w of WL){const P=w.pts,n=P.length;for(let i=0;i<n-(w.closed?0:1);i++)d=Math.min(d,segD(x,y,P[i],P[(i+1)%n]))}return d};
  for(const b of T){let wetN=0,wallN=0;const [x0,y0,x1,y1]=b._bb;for(let y=y0;y<=y1;y+=4)for(let x=x0;x<=x1;x+=4){if(!inP(b.poly,x,y))continue;if(wet(x,y))wetN++;if(WL.length&&wallD(x,y)<5)wallN++}if(wetN)R.blkWet++;if(wallN)R.blkWall++}
  for(const w of WL){const P=w.pts,n=P.length;for(let i=0;i<n-(w.closed?0:1);i++){const a=P[i],b=P[(i+1)%n],L=Math.hypot(b[0]-a[0],b[1]-a[1]);for(let t=0;t<L;t+=6){const x=a[0]+(b[0]-a[0])*t/L,y=a[1]+(b[1]-a[1])*t/L;if(sup(x,y)>=0){R.wallOnBlk++}}}}
  for(const g of C.gates){const n=C.nodes[g];if(sup(n.x,n.y)>=0)R.gateOnBlk++}
  const BR=(C.bridgesR||[]).map(z=>[z.a,z.b]).concat((C.bridgesW||[]).map(e=>[[C.nodes[e.a].x,C.nodes[e.a].y],[C.nodes[e.b].x,C.nodes[e.b].y]]));
  for(const [a,b] of BR){const L=Math.hypot(b[0]-a[0],b[1]-a[1]);for(let t=0;t<=L;t+=3){const x=a[0]+(b[0]-a[0])*t/L,y=a[1]+(b[1]-a[1])*t/L;if(WL.length&&wallD(x,y)<6){R.brWall++;break}}}
  if(C.rw)for(const e of C.edges){if(!(e.in>0)||e.sea||e.in===1&&C.WALLON)continue;const a=[C.nodes[e.a].x,C.nodes[e.a].y],b=[C.nodes[e.b].x,C.nodes[e.b].y],L=e.len;let cx=null;for(let t=0;t<=L;t+=2){const x=a[0]+(b[0]-a[0])*t/L,y=a[1]+(b[1]-a[1])*t/L;if(C.rd(x,y)<C.rw-1){cx=[x,y];break}}if(!cx)continue;if(!BR.some(([p,q])=>segD(cx[0],cx[1],p,q)<C.rw*1.6))R.crossNoBridge++}
  return R}};
})();
// detalhes de travessias sem ponte (para depurar)
window.QAS.cross=function(C){const o=[];const BR=(C.bridgesR||[]).map(z=>[z.a,z.b]);const segD=(x,y,a,b)=>{const dx=b[0]-a[0],dy=b[1]-a[1],l=dx*dx+dy*dy||1;let t=((x-a[0])*dx+(y-a[1])*dy)/l;t=t<0?0:t>1?1:t;return Math.hypot(x-a[0]-t*dx,y-a[1]-t*dy)};
  for(const e of C.edges){if(!(e.in>0)||e.sea||e.in===1&&C.WALLON)continue;const a=[C.nodes[e.a].x,C.nodes[e.a].y],b=[C.nodes[e.b].x,C.nodes[e.b].y],L=e.len;let t0=-1,t1=-1;for(let t=0;t<=L;t+=1){const x=a[0]+(b[0]-a[0])*t/L,y=a[1]+(b[1]-a[1])*t/L;if(C.rd(x,y)<C.rw-1){if(t0<0)t0=t;t1=t}}if(t0<0)continue;const m=[a[0]+(b[0]-a[0])*(t0+t1)/2/L,a[1]+(b[1]-a[1])*(t0+t1)/2/L];if(BR.some(([p,q])=>segD(m[0],m[1],p,q)<C.rw*1.6))continue;o.push({m:m.map(Math.round),wl:t1-t0,L:Math.round(L),main:C.mainE.has(e),riv:e.riv})}return o};
