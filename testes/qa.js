// verificacao de sobreposicao (so para testes)
(function(){
const obb=(x,y,a,L,D)=>{const c=Math.cos(a),s=Math.sin(a),l=L/2,d=D/2;return [[x+c*l-s*d,y+s*l+c*d],[x-c*l-s*d,y-s*l+c*d],[x-c*l+s*d,y-s*l-c*d],[x+c*l+s*d,y+s*l-c*d]]};
const sat=(A,B)=>{for(const P of[A,B])for(let i=0;i<4;i++){const p=P[i],q=P[(i+1)%4];let nx=q[1]-p[1],ny=p[0]-q[0];const l=Math.hypot(nx,ny)||1;nx/=l;ny/=l;let a0=1e9,a1=-1e9,b0=1e9,b1=-1e9;for(const v of A){const t=v[0]*nx+v[1]*ny;a0=Math.min(a0,t);a1=Math.max(a1,t)}for(const v of B){const t=v[0]*nx+v[1]*ny;b0=Math.min(b0,t);b1=Math.max(b1,t)}if(a1<=b0+.5||b1<=a0+.5)return false}return true};
const MULTI=new Set(["stall","markettent","goods","well","lamp","bench","crates","barrel","cart","wagon","woodpile","flowerbed","guardpost","haystack","ruinhouse","scarecrow","statue","fountain","boat","fire","horse","dummy","obelisk","wayshrine","beehives","dovecote","shop","warehouse","barracks","crane","fishery","tent","cargo","trainingyard","k8"]);
function check(items,dupR){// items: {id,kind,x,y,a,L,D,solid}
  const G=new Map(),K=(x,y)=>((x/40)|0)+"_"+((y/40)|0);items.forEach((o,i)=>{o.poly=obb(o.x,o.y,o.a||0,o.L*.82,o.D*.82);const k=K(o.x,o.y);G.has(k)?G.get(k).push(i):G.set(k,[i])});
  const ov=[],dup=[];
  items.forEach((o,i)=>{const gx=(o.x/40)|0,gy=(o.y/40)|0;for(let a=-2;a<=2;a++)for(let b=-2;b<=2;b++){const l=G.get((gx+a)+"_"+(gy+b));if(!l)continue;for(const j of l){if(j<=i)continue;const p=items[j];if(o.grp&&o.grp===p.grp)continue;if(sat(o.poly,p.poly))ov.push([o.id,p.id,Math.round(o.x),Math.round(o.y)])}}});
  const byId=new Map();for(const o of items){if(!o.uniq)continue;if(!byId.has(o.id))byId.set(o.id,[]);byId.get(o.id).push(o)}
  for(const [id,l] of byId)for(let i=0;i<l.length;i++)for(let j=i+1;j<l.length;j++)if(Math.hypot(l[i].x-l[j].x,l[i].y-l[j].y)<dupR)dup.push([id,Math.round(l[i].x),Math.round(l[i].y)]);
  return {ov,dup}}
window.QA={city(C){const AS=window.AtlasAssets,Z=1.55,it=[];
    C.B.forEach((b,i)=>{it.push({id:"casa:"+b.type,x:b.x,y:b.y,a:b.ang,L:b.L,D:b.D,grp:b.grp});if(b.wing)it.push({id:"ala",x:b.wing.x,y:b.wing.y,a:b.wing.ang,L:b.wing.L,D:b.wing.D,grp:"h"+i})});
    C.B.forEach((b,i)=>{if(b.wing){it[it.findIndex(o=>o.x===b.x&&o.y===b.y)].grp="h"+i}});
    for(const w of C.walls||[]){if(!w.pts||!C.WALLON)continue;const P=w.pts,n=P.length;for(let i=0;i<n-(w.closed?0:1);i++){const a=P[i],b=P[(i+1)%n],L=Math.hypot(b[0]-a[0],b[1]-a[1]),st=Math.ceil(L/12);for(let k=0;k<st;k++){const mx=a[0]+(b[0]-a[0])*(k+.5)/st,my=a[1]+(b[1]-a[1])*(k+.5)/st;if(C.gates.some(g=>Math.hypot(C.nodes[g].x-mx,C.nodes[g].y-my)<16))continue;it.push({id:"muralha",x:mx,y:my,a:Math.atan2(b[1]-a[1],b[0]-a[0]),L:L/st,D:9,grp:"wall"})}}}
    for(const q of C.SPB){if(q.k===3){const m=.78*(q.ms||1)*2;it.push({id:"castelo",x:q.x,y:q.y,a:(q.ang||0)+.34,L:58*m,D:46*m,uniq:1});continue}if(q.k===2){it.push({id:"templo",x:q.x,y:q.y,a:q.ang||0,L:(q.big?52:40)*1.1,D:(q.big?52:40)*.7,uniq:1});continue}
      const sz=(AS.SIZE[q.id]||[8])[0]*Z,fp=q.fp||[sz*1.5,sz*1.1];it.push({id:q.id||("k"+q.k),x:q.x,y:q.y,a:q.fp?0:(q.ang||0)+.34,L:fp[0],D:fp[1],uniq:!MULTI.has(q.id||("k"+q.k))||q.k===8,oob:q.x<0||q.y<0||q.x>1500})}
    for(const q of C.props){if(q.id==="stairs")continue;const sz=(AS.SIZE[q.id]||[3])[0]*Z*(q.s||1);if(q.id==="stall"||q.id==="markettent"||q.id==="goods"||q.id==="lamp"||q.id==="bench")it.push({id:q.id,x:q.x,y:q.y,a:q.ang||0,L:sz*1.1,D:sz*.8,grp:"praca"});else{const fp=q.fp||[sz*1.2,sz*.9];it.push({id:q.id,x:q.x,y:q.y,a:q.fp?0:q.ang||0,L:fp[0],D:fp[1],uniq:!MULTI.has(q.id)})}}
    const r=check(it,150);const tr=[];// arvores sobre construcoes
    const solid=it.filter(o=>!/^(stall|markettent|goods|lamp|bench|crates|woodpile|haystack|cart|wagon|flowerbed|scarecrow)$/.test(o.id));const G=new Map();solid.forEach(o=>{const k=((o.x/40)|0)+"_"+((o.y/40)|0);G.has(k)?G.get(k).push(o):G.set(k,[o])});
    for(const t of C.trees){const gx=(t[0]/40)|0,gy=(t[1]/40)|0;let hit=null;for(let a=-1;a<=1&&!hit;a++)for(let b=-1;b<=1&&!hit;b++)for(const o of G.get((gx+a)+"_"+(gy+b))||[]){if(sat(o.poly,obb(t[0],t[1],0,4*(t[2]||1),4*(t[2]||1)))){hit=o;break}}if(hit)tr.push([hit.id,Math.round(t[0]),Math.round(t[1])])}
    // medida exata (0.55): a grade do mundo pinta a pegada da ficha de cada prédio e o retângulo de cada casa
    let ovx=null,trx=null;if(window.AtlasMundo){const G=AtlasMundo.deCidade(C,AS);ovx=[];trx=[];for(const c of G.lista()){if(c.tipo==="construção sobre construção")ovx.push([G.objs[c.a].tipo,G.objs[c.b].tipo,Math.round(c.x),Math.round(c.y),c.n]);else if(c.tipo==="árvore em construção")trx.push([G.objs[c.a].tipo,Math.round(c.x),Math.round(c.y),c.n])}}
    return {ov:r.ov,dup:r.dup,tree:tr,n:it.length,ovx,trx}},
  region(W){const it=[];const R={2:14,3:26,8:6,16:12,17:12,18:4,19:6,20:9,21:8,22:12,23:8,24:4,25:10,26:14,27:14,28:14,7:2.4,6:2.6,13:8,32:3,33:6,34:2,35:2,36:2,37:0,21:5};
    for(const b of W.B){if(b.k===1){it.push({id:"casa",x:b.x,y:b.y,a:b.ang,L:b.L,D:b.D});continue}if(b.k===37||b.k===13)continue;
      if(b.k===40){const sz=((AtlasAssets.SIZE[b.id]||[6])[0])*.55;it.push({id:b.id,x:b.x,y:b.y,a:0,L:sz*2,D:sz*1.4,grp:"praca"+b.ti});continue}
      if(b.k===6||b.k===7){it.push({id:"k"+b.k,x:b.x,y:b.y,a:0,L:4,D:3,grp:"praca"+b.ti});continue}if(b.k===18){it.push({id:"k18",x:b.x,y:b.y,a:0,L:4*1.6,D:4*1.2});continue}
      let r=b.r||R[b.k]||5;if(b.k===3)r=26*(b.ms||1);if(b.k===2)r=13*(b.sz||1);it.push({id:"k"+b.k,x:b.x,y:b.y-(b.k===3?r*.4:0),a:0,L:r*1.6,D:r*1.2,uniq:b.k>=14&&b.k<=28||b.k===2||b.k===3})}
    return Object.assign(check(it,200),{n:it.length})}};
})();
