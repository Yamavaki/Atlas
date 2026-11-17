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
  if(C.rw)for(const e of C.edges){if(!(e.in>0)||e.sea||e.in===1&&C.WALLON)continue;const a=[C.nodes[e.a].x,C.nodes[e.a].y],b=[C.nodes[e.b].x,C.nodes[e.b].y],L=e.len;let cx=null;for(let t=0;t<=L;t+=2){const x=a[0]+(b[0]-a[0])*t/L,y=a[1]+(b[1]-a[1])*t/L;if(C.rd(x,y)<C.rw-1){cx=[x,y];break}}if(!cx)continue;if(!BR.some(([p,q])=>segD(cx[0],cx[1],p,q)<Math.max(C.rw*1.6,64)))R.crossNoBridge++}
  return R}};
})();
// detalhes de travessias sem ponte (para depurar)
window.QAS.cross=function(C){const o=[];const BR=(C.bridgesR||[]).map(z=>[z.a,z.b]);const segD=(x,y,a,b)=>{const dx=b[0]-a[0],dy=b[1]-a[1],l=dx*dx+dy*dy||1;let t=((x-a[0])*dx+(y-a[1])*dy)/l;t=t<0?0:t>1?1:t;return Math.hypot(x-a[0]-t*dx,y-a[1]-t*dy)};
  for(const e of C.edges){if(!(e.in>0)||e.sea||e.in===1&&C.WALLON)continue;const a=[C.nodes[e.a].x,C.nodes[e.a].y],b=[C.nodes[e.b].x,C.nodes[e.b].y],L=e.len;let t0=-1,t1=-1;for(let t=0;t<=L;t+=1){const x=a[0]+(b[0]-a[0])*t/L,y=a[1]+(b[1]-a[1])*t/L;if(C.rd(x,y)<C.rw-1){if(t0<0)t0=t;t1=t}}if(t0<0)continue;const m=[a[0]+(b[0]-a[0])*(t0+t1)/2/L,a[1]+(b[1]-a[1])*(t0+t1)/2/L];if(BR.some(([p,q])=>segD(m[0],m[1],p,q)<Math.max(C.rw*1.6,64)))continue;o.push({m:m.map(Math.round),wl:t1-t0,L:Math.round(L),main:C.mainE.has(e),riv:e.riv})}return o};
// travessias de agua, pontes e estradas (auditoria mais rigorosa)
(function(){
const segD=(x,y,a,b)=>{const dx=b[0]-a[0],dy=b[1]-a[1],l=dx*dx+dy*dy||1;let t=((x-a[0])*dx+(y-a[1])*dy)/l;t=t<0?0:t>1?1:t;return Math.hypot(x-a[0]-t*dx,y-a[1]-t*dy)};
const inP=(P,x,y)=>{let c=false;for(let i=0,j=P.length-1;i<P.length;j=i++){const a=P[i],b=P[j];if((a[1]>y)!==(b[1]>y)&&x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0])c=!c}return c};
const chaikin=(pts,it)=>{let o=pts;for(let k=0;k<it;k++){const n=[o[0]];for(let i=0;i<o.length-1;i++){const a=o[i],b=o[i+1];n.push([a[0]*.75+b[0]*.25,a[1]*.75+b[1]*.25],[a[0]*.25+b[0]*.75,a[1]*.25+b[1]*.75])}n.push(o[o.length-1]);o=n}return o};
window.QAS.water=function(C){const R={cross:0,noBridge:0,obl:0,brEndWet:0,brOnBlk:0,brBr:0,roadBrWall:0,houseWet:0,treeWet:0,propWet:0,blkWet:0,basin:0,canal:0,ex:[]};if(!C.rw)return R;
  const wetAt=(x,y)=>C.land(x,y)<.04||C.rd(x,y)<C.rw;const WLN=[C.river].concat((C.LINES||[]).filter(l=>l.t!=="road").map(l=>l.pts)).filter(Boolean);
  const side=(x,y)=>{let bd=1e9,s=0;for(const L of WLN)for(let i=0;i<L.length-1;i++){const d=segD(x,y,L[i],L[i+1]);if(d<bd){bd=d;const a=L[i],b=L[i+1];s=Math.sign((b[0]-a[0])*(y-a[1])-(b[1]-a[1])*(x-a[0]))}}return s};
  const BR=(C.bridgesR||[]).map(z=>[z.a,z.b]).concat((C.bridgesW||[]).map(e=>[[C.nodes[e.a].x,C.nodes[e.a].y],[C.nodes[e.b].x,C.nodes[e.b].y]]));
  const WL=(C.walls||[]).filter(w=>w.pts&&C.WALLON);const wallD=(x,y)=>{let d=1e9;for(const w of WL){const P=w.pts,n=P.length;for(let i=0;i<n-(w.closed?0:1);i++)d=Math.min(d,segD(x,y,P[i],P[(i+1)%n]))}return d};
  for(const e of C.edges){if(!(e.in>0)||e.sea||e.in===1&&C.WALLON)continue;const a=[C.nodes[e.a].x,C.nodes[e.a].y],b=[C.nodes[e.b].x,C.nodes[e.b].y],L=e.len;let run=null,last=null;
    for(let t=0;t<=L;t+=1){const x=a[0]+(b[0]-a[0])*t/L,y=a[1]+(b[1]-a[1])*t/L,w=C.rd(x,y)<C.rw-1&&C.land(x,y)>.04;if(w&&!run&&last)run={p0:last};if(!w&&run){run.p1=[x,y];
        const BAS=(C.WLS||[]).filter(l=>l.basin).map(l=>l.basin),thruB=BAS.some(b=>segD(b[0],b[1],run.p0,[x,y])<b[2]);if(thruB)R.endBasin=(R.endBasin||0)+1;if(!thruB&&side(run.p0[0],run.p0[1])!==side(x,y)){R.cross++;const pts=[run.p0,[(run.p0[0]+x)/2,(run.p0[1]+y)/2],[x,y]];if(!BR.some(([p,q])=>pts.some(z=>segD(z[0],z[1],p,q)<Math.max(C.rw*1.6,64)))){R.noBridge++;if(R.ex.length<5)R.ex.push(pts[1].map(Math.round))}}run=null}if(!w)last=[x,y]}}
  for(const [p,q] of BR){if(wetAt(p[0],p[1])||wetAt(q[0],q[1]))R.brEndWet++;const L=Math.hypot(q[0]-p[0],q[1]-p[1]);if(L<1)continue;const dir=[(q[0]-p[0])/L,(q[1]-p[1])/L],nr=Math.abs(dir[0]*1+0);for(let t=7;t<=L-7;t+=3){const x=p[0]+dir[0]*t,y=p[1]+dir[1]*t;if((C.TBL||[]).some(bl=>inP(bl.poly,x,y))){R.brOnBlk++;break}}}
  for(let i=0;i<BR.length;i++)for(let j=i+1;j<BR.length;j++){const [a,b]=BR[i],[c,d]=BR[j];const m=[(c[0]+d[0])/2,(c[1]+d[1])/2];if(segD(m[0],m[1],a,b)<6||segD((a[0]+b[0])/2,(a[1]+b[1])/2,c,d)<6)R.brBr++}
  if(WL.length)for(const r0 of C.roads||[]){const r=chaikin(r0,2);let i0=-1;for(let i=0;i<r.length;i++){const wt=C.rd(r[i][0],r[i][1])<C.rw+1.5;if(wt&&i0<0)i0=i;if(!wt&&i0>=0){const A=r[Math.max(0,i0-1)],B=r[i];let near=false;for(let t=0;t<=1;t+=.1){if(wallD(A[0]+(B[0]-A[0])*t,A[1]+(B[1]-A[1])*t)<9)near=true}if(near)R.roadBrWall++;i0=-1}}}
  for(const b of C.B){if(!b.k&&wetAt(b.x,b.y))R.houseWet++}for(const t of C.trees)if(wetAt(t[0],t[1]))R.treeWet++;for(const q of C.props)if(wetAt(q.x,q.y)&&q.id!=="boat")R.propWet++;
  for(const bl of C.TBL||[]){let n=0;for(const v of bl.poly)if(wetAt(v[0],v[1]))n++;if(n)R.blkWet++}
  R.basin=(C.WLS||[]).filter(l=>l.basin).length;R.canal=C.RFORM||"";return R};
})();
// construcoes sobre a agua pela pegada inteira (nao so o centro)
window.QAS.overWater=function(C){const Z=1.55,AS=window.AtlasAssets,wet=(x,y)=>C.land(x,y)<.04||C.rw&&C.rd(x,y)<C.rw+.5,o={h:0,s:0,p:0,ex:[]};
  const obbP=(x,y,a,L,D)=>{const c=Math.cos(a),s=Math.sin(a),l=L/2,d=D/2;return [[x,y],[x+c*l-s*d,y+s*l+c*d],[x-c*l-s*d,y-s*l+c*d],[x-c*l+s*d,y-s*l-c*d],[x+c*l+s*d,y+s*l-c*d],[x+c*l,y+s*l],[x-c*l,y-s*l],[x-s*d,y+c*d],[x+s*d,y-c*d]]};
  for(const b of C.B){if(b.k||b.form==="stilt")continue;if(obbP(b.x,b.y,b.ang,b.L*.9,b.D*.9).some(q=>wet(q[0],q[1]))){o.h++;if(o.ex.length<8)o.ex.push(["casa",Math.round(b.x),Math.round(b.y)])}}
  for(const q of C.SPB){if(q.k===13||q.k===14||q.k===8)continue;if(["lighthouse","crane","fishery","shipwright","cargo","boat","ship"].includes(q.id))continue;const r=q.k===2?(q.big?22:17):q.k===3?40:q.id?((AS.SIZE[q.id]||[6])[0])*Z*.45:(q.r||10)*.6;const pts=[[q.x,q.y]];for(let k=0;k<8;k++)pts.push([q.x+Math.cos(k*.785)*r,q.y+Math.sin(k*.785)*r]);if(pts.some(z=>wet(z[0],z[1]))){o.s++;if(o.ex.length<8)o.ex.push([q.id||"k"+q.k,Math.round(q.x),Math.round(q.y)])}}
  for(const q of C.props){if(["boat","cargo","crane","crates","barrel"].includes(q.id))continue;const r=((AS.SIZE[q.id]||[4])[0])*Z*(q.s||1)*.4;const pts=[[q.x,q.y]];for(let k=0;k<6;k++)pts.push([q.x+Math.cos(k*1.05)*r,q.y+Math.sin(k*1.05)*r]);if(pts.some(z=>wet(z[0],z[1]))){o.p++;if(o.ex.length<8)o.ex.push([q.id,Math.round(q.x),Math.round(q.y)])}}
  return o};
window.QAS.basinBr=function(C){const segD=(x,y,a,b)=>{const dx=b[0]-a[0],dy=b[1]-a[1],l=dx*dx+dy*dy||1;let t=((x-a[0])*dx+(y-a[1])*dy)/l;t=t<0?0:t>1?1:t;return Math.hypot(x-a[0]-t*dx,y-a[1]-t*dy)};let n=0;for(const b of (C.WLS||[]).filter(l=>l.basin).map(l=>l.basin))for(const z of C.bridgesR||[])if(segD(b[0],b[1],z.a,z.b)<b[2]+1)n++;return n};
// v0.43: pegadas inteiras (tamanho desenhado) contra agua e contra pontes
(function(){
const Z=1.55;
const obb=(x,y,a,L,D)=>{const c=Math.cos(a),s=Math.sin(a),l=L/2,d=D/2;return [[x+c*l-s*d,y+s*l+c*d],[x-c*l-s*d,y-s*l+c*d],[x-c*l+s*d,y-s*l-c*d],[x+c*l+s*d,y+s*l-c*d]]};
const sat=(A,B)=>{for(const P of[A,B])for(let i=0;i<P.length;i++){const a=P[i],b=P[(i+1)%P.length],nx=b[1]-a[1],ny=a[0]-b[0];let a0=1e9,a1=-1e9,b0=1e9,b1=-1e9;for(const q of A){const d=q[0]*nx+q[1]*ny;a0=Math.min(a0,d);a1=Math.max(a1,d)}for(const q of B){const d=q[0]*nx+q[1]*ny;b0=Math.min(b0,d);b1=Math.max(b1,d)}if(a1<=b0||b1<=a0)return false}return true};
const fps=C=>{const AS=window.AtlasAssets,o=[];
  for(const b of C.B){if(b.k||b.form==="stilt")continue;o.push(["casa",b,obb(b.x,b.y,b.ang,b.L*.92,b.D*.92)])}
  for(const q of C.SPB){if(q.k===13||q.k===14||q.k===8||q.k===3)continue;if(["lighthouse","crane","fishery","shipwright","cargo","boat","ship"].includes(q.id))continue;
    if(q.k===2){const r=q.big?52:40;o.push(["templo",q,obb(q.x,q.y,q.ang||0,r*1.0,r*.66)]);continue}
    const sz=((AS.SIZE[q.id]||[8])[0])*Z,fp=q.fp||[sz*1.4,sz*1.0];o.push([q.id||"k"+q.k,q,obb(q.x,q.y,q.fp?0:(q.ang||0)+.34,fp[0]*.85,fp[1]*.85)])}
  for(const q of C.props){if(["boat","cargo","crane","crates","barrel","stairs"].includes(q.id))continue;const sz=((AS.SIZE[q.id]||[4])[0])*Z*(q.s||1);o.push([q.id,q,obb(q.x,q.y,q.ang||0,sz*.9,sz*.65)])}
  return o};
window.QAS.fpWater=function(C){const wet=(x,y)=>C.land(x,y)<.04||C.rw&&C.rd(x,y)<C.rw+.5,r={n:0,ex:[]};
  for(const [t,q,P] of fps(C)){if(t==="watermill")continue;const pts=P.slice();for(let i=0;i<4;i++){const a=P[i],b=P[(i+1)%4];pts.push([(a[0]+b[0])/2,(a[1]+b[1])/2])}if(pts.some(z=>wet(z[0],z[1]))){r.n++;if(r.ex.length<8)r.ex.push([t,Math.round(q.x),Math.round(q.y)])}}return r};
window.QAS.onBridge=function(C){const r={n:0,ex:[]},BR=(C.bridgesR||[]).map(z=>[z.a,z.b,z.wd||6]);
  const dk=BR.map(([a,b,w])=>{const L=Math.hypot(b[0]-a[0],b[1]-a[1])||1,ux=(b[0]-a[0])/L,uy=(b[1]-a[1])/L;return obb((a[0]+b[0])/2,(a[1]+b[1])/2,Math.atan2(uy,ux),L+12,w+2)});
  for(const [t,q,P] of fps(C)){if(dk.some(D=>sat(P,D))){r.n++;if(r.ex.length<8)r.ex.push([t,Math.round(q.x),Math.round(q.y)])}}return r};
})();
