/* Atlas - gerador de mapa de cidade (GPL-3.0).
   A divisao em bairros (Voronoi em espiral) e o corte dos quarteiroes em lotes seguem a ideia do
   TownGeneratorOS de Watabou (GPL-3.0, github.com/watabou/TownGeneratorOS), reescritos aqui para o
   estilo inclinado do Atlas, com relevo, agua, culturas e funcoes de bairro proprias. */
(function(){
"use strict";
const A=window.AtlasGen,K=A.kit,TILT=A.TILT,INK=K.INK,CUL=K.CUL,ROOF=K.ROOF,WALL=K.WALL;
const MW=1500,MH=1020,MX=46,MY=64,CW=MW+92,CH=MH+110,KE=64,WX=MW,WY=Math.ceil((MH+KE)/TILT)+2,GS=6,GW=Math.ceil(WX/GS)+2,GH=Math.ceil(WY/GS)+2;
const clamp=(v,a,b)=>v<a?a:v>b?b:v,lerp=(a,b,t)=>a+(b-a)*t,sstep=(a,b,x)=>{const t=clamp((x-a)/(b-a),0,1);return t*t*(3-2*t)};
const SITES=[["interior","Interior"],["rio","Beira de rio"],["costa","Costa"],["peninsula","Península"],["ilha","Ilha"],["lago","Beira de lago"],["arquipelago","Arquipélago"]];
const DEF={seed:"novigrad-1272",site:"costa",size:24,culture:"humano",foreign:"auto",wall:true,citadel:true,river:true,plan:"misto",wealth:.55,relief:.5,suburbs:.5,green:.4,labels:true};
const PARAMS=[["seed","Semente","text"],["site","Terreno","select",SITES],["size","Tamanho (bairros)","int",6,44],["culture","Cultura","select",A.RACES.map(r=>[r,A.RACE_PT[r]])],
  ["foreign","Bairro estrangeiro","select",[["auto","Sorteado"],["nao","Nenhum"]].concat(A.RACES.map(r=>[r,A.RACE_PT[r]]))],["plan","Traçado","select",[["misto","Misto"],["organico","Orgânico"],["planejado","Planejado"]]],
  ["wealth","Riqueza","pct"],["relief","Relevo","pct"],["suburbs","Arrabaldes fora do muro","pct"],["green","Jardins e árvores","pct"],["wall","Muralha","bool"],["citadel","Castelo","bool"],["river","Rio","bool"],["labels","Nomes dos bairros","bool"]];
const WARD={mercado:"Praça do mercado",templo:"Bairro do templo",castelo:"Cidadela",porto:"Porto",nobre:"Bairro nobre",mercadores:"Bairro dos mercadores",artesaos:"Bairro dos artesãos",producao:"Oficinas e produção",militar:"Quartel",moradia:"Moradias",pobre:"Bairro pobre",parque:"Jardim",arrabalde:"Arrabalde",estrangeiro:"Bairro estrangeiro"};
const NM={mercado:["Praça Velha","Largo do Mercado","Praça do Sino","Feira Grande"],templo:["Adro Santo","Alto do Templo","Largo das Preces","Bairro da Sé"],castelo:["Cidadela","Castelo Alto","Fortaleza","Paço Real"],porto:["Cais Velho","Ribeira","Porto das Redes","Doca do Sal","Cais Novo"],
  nobre:["Alto dos Fidalgos","Colina Dourada","Jardins do Conde","Bairro das Torres"],mercadores:["Rua dos Ourives","Bairro da Balança","Largo dos Cambistas","Mercado Novo"],artesaos:["Bairro dos Oleiros","Rua dos Tecelões","Ferrarias","Bairro dos Tanoeiros","Sapataria"],
  producao:["Curtume","Forjas","Moinhos","Olarias","Tinturaria"],militar:["Quartel","Campo de Armas","Arsenal"],moradia:["Vila Nova","Bairro do Poço","Travessas","Ladeira","Bairro Baixo","Santa Clara","Bairro Alto"],pobre:["Beco da Lama","Brejo","Barracos","Fundo do Poço","Baixada"],
  parque:["Jardim do Bispo","Horto","Bosque Velho"],arrabalde:["Arrabalde","Além-Muro","Estrada Velha","Caminho da Feira","Pedras Soltas"]};
// ---------- geometria de poligonos convexos ----------
const area=p=>{let s=0;for(let i=0;i<p.length;i++){const a=p[i],b=p[(i+1)%p.length];s+=a[0]*b[1]-b[0]*a[1]}return Math.abs(s)/2};
const sgnA=p=>{let s=0;for(let i=0;i<p.length;i++){const a=p[i],b=p[(i+1)%p.length];s+=a[0]*b[1]-b[0]*a[1]}return s<0?-1:1};
const cen=p=>{let x=0,y=0,s=0;for(let i=0;i<p.length;i++){const a=p[i],b=p[(i+1)%p.length],c=a[0]*b[1]-b[0]*a[1];x+=(a[0]+b[0])*c;y+=(a[1]+b[1])*c;s+=c}return s?[x/(3*s),y/(3*s)]:p[0].slice()};
// mantem o lado onde (p-m).n<=0 ; T guarda a etiqueta de cada aresta
function clip(P,mx,my,nx,ny,T,tag){const o=[],ot=[],n=P.length;for(let k=0;k<n;k++){const a=P[k],b=P[(k+1)%n],da=(a[0]-mx)*nx+(a[1]-my)*ny,db=(b[0]-mx)*nx+(b[1]-my)*ny;
    if(da<=0){o.push(a);ot.push(T?T[k]:0);if(db>0){const t=da/(da-db);o.push([lerp(a[0],b[0],t),lerp(a[1],b[1],t)]);ot.push(tag)}}else if(db<=0){const t=da/(da-db);o.push([lerp(a[0],b[0],t),lerp(a[1],b[1],t)]);ot.push(T?T[k]:0)}}
  return T?[o,ot]:o}
function inset(P,d){const s=sgnA(P);let o=P;for(let k=0;k<P.length&&o.length>2;k++){const a=P[k],b=P[(k+1)%P.length],l=Math.hypot(b[0]-a[0],b[1]-a[1])||1,nx=(b[1]-a[1])/l*s,ny=-(b[0]-a[0])/l*s,dd=typeof d==="number"?d:d[k];o=clip(o,a[0]-nx*dd,a[1]-ny*dd,nx,ny)}return o}
function inPoly(P,x,y){let c=false;for(let i=0,j=P.length-1;i<P.length;j=i++){const a=P[i],b=P[j];if((a[1]>y)!==(b[1]>y)&&x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0])c=!c}return c}
function segD(px,py,a,b){const dx=b[0]-a[0],dy=b[1]-a[1],l=dx*dx+dy*dy||1,t=clamp(((px-a[0])*dx+(py-a[1])*dy)/l,0,1);return Math.hypot(px-a[0]-dx*t,py-a[1]-dy*t)}

function generate(P0){const P=Object.assign({},DEF,P0),seed=A.hashStr(String(P.seed)+"|"+P.site),rng=A.mulberry(seed),pick=a=>a[(rng()*a.length)|0];
  // ruido
  const NT=new Float32Array(65536);for(let i=0;i<65536;i++)NT[i]=rng();
  const vn=(x,y)=>{const xi=Math.floor(x),yi=Math.floor(y),fx=x-xi,fy=y-yi,u=fx*fx*(3-2*fx),v=fy*fy*(3-2*fy),h=(a,b)=>NT[((a&255)+((b&255)<<8))&65535];return lerp(lerp(h(xi,yi),h(xi+1,yi),u),lerp(h(xi,yi+1),h(xi+1,yi+1),u),v)};
  const fbm=(x,y,o)=>{let s=0,a=.5,n=0;for(let i=0;i<o;i++){s+=vn(x,y)*a;n+=a;x=x*2.03+17.1;y=y*2.03+9.7;a*=.5}return s/n};
  const nP=clamp(Math.round(P.size),5,46),Rc=clamp(190+nP*12.5,240,570),SP=Rc/(10+nP*2.5);let cx=WX/2,cy=(MH/2+30)/TILT;
  // ---- terreno: terra (L>0), rio, relevo
  const th=1.5708+(rng()-.5)*1.5,ct=Math.cos(th),st=Math.sin(th),wob=(x,y)=>(fbm(x/250+3,y/250+8,4)-.5)*190+(fbm(x/70+1,y/70+5,2)-.5)*36;
  if(P.site==="costa"){cx-=ct*Rc*.42;cy-=st*Rc*.5}if(P.site==="lago"){cx-=ct*Rc*.25;cy-=st*Rc*.25}
  const blobs=P.site==="arquipelago"?[[cx,cy,Rc*1.02+70]].concat(Array.from({length:5},(_,i)=>{const a=i*1.26+rng(),d=Rc*1.5+210+rng()*170;return [cx+Math.cos(a)*d,cy+Math.sin(a)*d*.9,70+rng()*120]})):null;
  const lake=[cx+ct*(Rc*.55+150),cy+st*(Rc*.55+150),150+rng()*70];
  const landF=(x,y)=>{const w=wob(x,y),dx=x-cx,dy=y-cy;
    if(P.site==="costa")return (Rc*.5+50-(dx*ct+dy*st)+w)/100;
    if(P.site==="ilha")return (Rc*1.12+95-Math.hypot(dx,dy)+w)/100;
    if(P.site==="peninsula"){const al=-(dx*ct+dy*st),pe=Math.abs(-dx*st+dy*ct);return Math.max(Rc*1.02+80-Math.hypot(dx,dy)+w,al>0?Rc*.5+40-pe+w*.6:-1e9,al-Rc*1.9+w)/100}
    if(P.site==="lago")return (Math.hypot(x-lake[0],y-lake[1])-lake[2]+w*.5)/100;
    if(P.site==="arquipelago"){let m=-1e9;for(const b of blobs)m=Math.max(m,b[2]-Math.hypot(x-b[0],y-b[1])+w*.7);return m/100}
    return 3};
  let river=null,rw=0;const hasRiver=P.site==="rio"||(P.river&&P.site!=="ilha"&&P.site!=="arquipelago");
  if(hasRiver){rw=P.site==="rio"?15:10+rng()*4;const off=(rng()<.5?-1:1)*(P.site==="rio"?Rc*.12:Rc*.38),ph=rng()*6,am=50+rng()*60;river=[];
    for(let t=-1.25;t<=1.25;t+=.02){const al=t*WY*.62,pe=off+Math.sin(t*4.2+ph)*am+(fbm(t*2.2+4,ph,3)-.5)*150;river.push([cx-st*pe+ct*al*(P.site==="costa"||P.site==="lago"||P.site==="peninsula"?1:1),cy+ct*pe+st*al])}}
  const LG=new Float32Array(GW*GH),EG=new Float32Array(GW*GH),RG=new Float32Array(GW*GH).fill(1e4);
  for(let j=0;j<GH;j++)for(let i=0;i<GW;i++){const x=i*GS,y=j*GS,k=j*GW+i;LG[k]=landF(x,y);if(river){let d=1e9;for(let q=0;q<river.length-1;q+=2){const dd=segD(x,y,river[q],river[Math.min(river.length-1,q+2)]);if(dd<d)d=dd}RG[k]=d}}
  const sg=(g,x,y)=>{const gx=clamp(x/GS,0,GW-1.001),gy=clamp(y/GS,0,GH-1.001),xi=gx|0,yi=gy|0,fx=gx-xi,fy=gy-yi,k=yi*GW+xi;return lerp(lerp(g[k],g[k+1],fx),lerp(g[k+GW],g[k+GW+1],fx),fy)};
  const hill=[cx-ct*Rc*.5+(rng()-.5)*Rc*.5,cy-st*Rc*.5+(rng()-.5)*Rc*.4];
  for(let j=0;j<GH;j++)for(let i=0;i<GW;i++){const x=i*GS,y=j*GS,k=j*GW+i;let e=Math.max(0,fbm(x/430+2,y/430+6,4)-.36)*1.5+.36*Math.exp(-((x-hill[0])**2+(y-hill[1])**2)/(Rc*Rc*.3));
    e*=P.relief*1.5*sstep(0,1.5,LG[k])*(river?sstep(rw,rw+110,RG[k]):1);EG[k]=clamp(e,0,1)}
  const land=(x,y)=>sg(LG,x,y),elev=(x,y)=>sg(EG,x,y),rd=(x,y)=>sg(RG,x,y),wet=(x,y,m)=>land(x,y)<.05+(m||0)/100||rd(x,y)<rw+2+(m||0);
  // ---- bairros: Voronoi sobre uma espiral de pontos (como no TownGeneratorOS)
  const sites=[],sa=rng()*6.28;for(let i=0;i<nP*9;i++){const a=sa+Math.sqrt(i)*5,r=i===0?0:(10+i*(2+rng()))*SP,x=cx+Math.cos(a)*r,y=cy+Math.sin(a)*r*.96;if(x<-260||y<-260||x>WX+260||y>WY+260)continue;sites.push([x,y])}
  const patches=sites.map((s,i)=>{let poly=[[-300,-300],[WX+300,-300],[WX+300,WY+300],[-300,WY+300]],T=[-1,-1,-1,-1];
    const ord=sites.map((q,j)=>[j,(q[0]-s[0])**2+(q[1]-s[1])**2]).sort((a,b)=>a[1]-b[1]);
    for(const [j,d2] of ord){if(j===i)continue;let mr=0;for(const v of poly)mr=Math.max(mr,(v[0]-s[0])**2+(v[1]-s[1])**2);if(d2>mr*4)break;const q=sites[j],l=Math.sqrt(d2);[poly,T]=clip(poly,(s[0]+q[0])/2,(s[1]+q[1])/2,(q[0]-s[0])/l,(q[1]-s[1])/l,T,j)}
    return {i,s,poly,nb:T,c:cen(poly),area:area(poly)}});
  for(const p of patches){let w=0,n=0;for(const v of p.poly.concat([p.c,p.s])){n++;if(land(v[0],v[1])<.04)w++}p.sea=land(p.c[0],p.c[1])<.1&&w>=n*.5||w>=n*.75;p.shore=!p.sea&&(w>0||p.nb.some(j=>j>=0&&patches[j]&&false));p.riv=river&&(p.poly.some(v=>rd(v[0],v[1])<rw+8)||rd(p.c[0],p.c[1])<rw+30);p.e=elev(p.c[0],p.c[1]);p.dn=Math.hypot(p.c[0]-cx,p.c[1]-cy)/Rc;p.type=p.sea?"agua":"mato"}
  for(const p of patches)if(!p.sea&&p.nb.some(j=>j>=0&&patches[j].sea))p.shore=true;
  const inner=[];for(const p of patches){if(inner.length>=nP)break;if(!p.sea&&p.c[0]>60&&p.c[0]<WX-60&&p.c[1]>90&&p.c[1]<WY-150){p.inner=true;inner.push(p)}}
  // grafo de vertices e arestas dos bairros
  const nodes=[],nh=new Map(),nodeAt=(x,y)=>{const gx=Math.round(x/3),gy=Math.round(y/3);for(let a=-1;a<=1;a++)for(let b=-1;b<=1;b++){const l=nh.get((gx+a)+"_"+(gy+b));if(l)for(const id of l)if(Math.hypot(nodes[id].x-x,nodes[id].y-y)<2.5)return id}const id=nodes.length;nodes.push({x,y,adj:[]});const k=gx+"_"+gy;nh.has(k)?nh.get(k).push(id):nh.set(k,[id]);return id};
  const edges=new Map();for(const p of patches){p.nd=p.poly.map(v=>nodeAt(v[0],v[1]));p.nd.forEach((a,k)=>{const b=p.nd[(k+1)%p.nd.length];if(a===b)return;const key=a<b?a+"_"+b:b+"_"+a;let e=edges.get(key);if(!e){e={a,b,ps:[],len:Math.hypot(nodes[a].x-nodes[b].x,nodes[a].y-nodes[b].y)};edges.set(key,e);nodes[a].adj.push([b,e]);nodes[b].adj.push([a,e])}e.ps.push(p)})}
  for(const e of edges.values()){const a=nodes[e.a],b=nodes[e.b];e.in=e.ps.filter(p=>p.inner).length;let w=0,r=0;for(let q=0;q<=6;q++){const x=lerp(a.x,b.x,q/6),y=lerp(a.y,b.y,q/6);if(land(x,y)<.03)w++;else if(rd(x,y)<rw+1)r++}e.sea=w>=3||w>0&&(land(a.x,a.y)<.03||land(b.x,b.y)<.03);e.riv=r>0;e.wallE=e.in===1&&P.wall}
  // castelo: bairro de borda mais alto; praca: o bairro central
  const plaza=inner[0];plaza.type="mercado";
  const isEdge=p=>p.poly.some((_,k)=>{const j=p.nb[k];return j<0||!patches[j].inner});
  let castle=null;if(P.citadel&&nP>=8){let bs=-1e9;for(const p of inner){if(p===plaza||!isEdge(p)||p.shore&&rng()<.5)continue;const s=p.e*3-Math.abs(p.dn-.8)-(p.riv?.6:0)+rng()*.2;if(s>bs){bs=s;castle=p}}if(castle)castle.type="castelo"}
  // portoes e ruas principais (caminho mais curto pelas divisas dos bairros ate a praca)
  const wallNodes=new Set();for(const e of edges.values())if(e.in===1&&!e.sea){wallNodes.add(e.a);wallNodes.add(e.b)}
  const gates=[];{const cand=[...wallNodes].filter(id=>{const n=nodes[id],dx=n.x-cx,dy=n.y-cy,d=Math.hypot(dx,dy)||1;return !wet(n.x,n.y,10)&&!wet(n.x+dx/d*40,n.y+dy/d*40,6)&&n.adj.filter(([,e])=>e.in>0).length>=2&&!(castle&&castle.nd.includes(id))});
    const want=clamp(2+Math.round(nP/9),2,6);while(gates.length<want&&cand.length){let best=-1,bs=-1;for(const id of cand){const n=nodes[id];let m=1e9;for(const g of gates)m=Math.min(m,Math.hypot(nodes[g].x-n.x,nodes[g].y-n.y));const s=gates.length?m:rng();if(s>bs){bs=s;best=id}}if(gates.length&&bs<Rc*.5)break;gates.push(best);cand.splice(cand.indexOf(best),1)}}
  const pn=new Set(plaza.nd),mainE=new Set();
  for(const g of gates){const dist=new Map([[g,0]]),prev=new Map(),open=[g],done=new Set();let end=-1;
    while(open.length){let bi=0;for(let q=1;q<open.length;q++)if(dist.get(open[q])<dist.get(open[bi]))bi=q;const u=open.splice(bi,1)[0];if(done.has(u))continue;done.add(u);if(pn.has(u)){end=u;break}
      for(const [v,e] of nodes[u].adj){if(!e.in||e.sea||e.in===1&&P.wall&&u!==g)continue;const c=e.len*(1+(e.riv?1.6:0)+Math.abs(elev(nodes[u].x,nodes[u].y)-elev(nodes[v].x,nodes[v].y))*KE/e.len*4)*(mainE.has(e)?.6:1),nd=dist.get(u)+c;if(nd<(dist.has(v)?dist.get(v):1e18)){dist.set(v,nd);prev.set(v,[u,e]);open.push(v)}}}
    for(let u=end;u>=0&&prev.has(u);){const [pu,e]=prev.get(u);mainE.add(e);u=pu}}
  // estradas fora dos portoes
  const roads=[];for(const g of gates){const n=nodes[g];let a=Math.atan2(n.y-cy,n.x-cx),x=n.x,y=n.y;const pts=[[x,y]];for(let s=0;s<120;s++){a+=(fbm(x/140+s*.01,y/140,2)-.5)*.5;let ok=false;for(const da of[0,.35,-.35,.7,-.7,1.1,-1.1]){const nx=x+Math.cos(a+da)*13,ny=y+Math.sin(a+da)*13;if(!wet(nx,ny,8)){x=nx;y=ny;a+=da*.6;ok=true;break}}if(!ok)break;pts.push([x,y]);if(x<-20||y<-20||x>WX+20||y>WY+20)break}if(pts.length>3)roads.push(pts)}
  // ---- funcao de cada bairro
  const nbs=p=>p.nb.filter(j=>j>=0).map(j=>patches[j]);
  {let best=null;for(const q of nbs(plaza))if(q.inner&&q.type==="mato"&&(!best||q.area>best.area))best=q;if(best&&nP>=7)best.type="templo";
    const sh=inner.filter(p=>p.type==="mato"&&(p.shore||P.site==="rio"&&p.riv)).sort((a,b)=>a.dn-b.dn);for(let q=0;q<Math.min(sh.length,Math.max(1,Math.round(nP/7)));q++)sh[q].type="porto";
    const rest=inner.filter(p=>p.type==="mato").sort((a,b)=>a.dn-b.dn+(rng()-.5)*.16),n=rest.length,w=P.wealth,q=f=>Math.round(n*f);
    const seq=[].concat(Array(q(.1+w*.12)).fill("mercadores"),Array(q(.04+w*.14)).fill("nobre"),Array(q(.2)).fill("artesaos"),Array(Math.max(0,n-q(.1+w*.12)-q(.04+w*.14)-q(.2)-q(.1)-q(.26-w*.2))).fill("moradia"),Array(q(.1)).fill("producao"),Array(q(.26-w*.2)).fill("pobre"));
    rest.forEach((p,i)=>p.type=seq[i]||"moradia");
    for(const p of rest){if(p.type==="nobre"&&castle&&!nbs(p).includes(castle)){const alt=rest.find(z=>z.type!=="nobre"&&z.type!=="mercadores"&&nbs(z).includes(castle)&&!z.shore);if(alt){const t=alt.type;alt.type="nobre";p.type=t}}}
    for(const p of rest){if(p.type==="producao"&&!p.riv){const alt=rest.find(z=>(z.type==="moradia"||z.type==="pobre")&&z.riv&&z.dn>.4);if(alt){const t=alt.type;alt.type="producao";p.type=t}}}
    if(nP>=12){const m=rest.find(p=>(p.type==="moradia"||p.type==="artesaos")&&(castle?nbs(p).includes(castle):gates.some(g=>p.nd.includes(g))));if(m)m.type="militar"}
    if(nP>=16&&P.green>.15){const m=rest.filter(p=>p.type==="moradia"&&p.dn>.3&&p.dn<.75);if(m.length)pick(m).type="parque"}
    const fr=P.foreign==="nao"?null:P.foreign==="auto"?(nP>=14&&rng()<.75?pick(A.RACES.filter(r=>r!==P.culture&&r!=="halfling"&&r!=="pantano")):null):P.foreign;
    if(fr&&fr!==P.culture){const m=rest.filter(p=>(p.type==="moradia"||p.type==="artesaos"||p.type==="mercadores")&&p.dn>.35);if(m.length){const p=pick(m);p.race=fr;p.foreign=true}}
    for(const p of patches){if(p.inner||p.sea)continue;const nearCity=nbs(p).some(z=>z.inner),onRoad=roads.some(r=>r.some((v,i)=>i>0&&i<16&&inPoly(p.poly,v[0],v[1])));
      if(nearCity&&onRoad&&rng()<P.suburbs*1.5)p.type="arrabalde";else if((nearCity||nbs(p).some(z=>nbs(z).some(y=>y.inner)))&&p.e<.35&&rng()<.72)p.type="campos";else p.type="mato"}}
  // ---- lotes: corte recursivo dos quarteiroes (createAlleys do TownGeneratorOS, adaptado)
  const cut=(p,minSq,gc,sc,ep,split,out,dep)=>{let bi=0,bl=-1;for(let k=0;k<p.length;k++){const a=p[k],b=p[(k+1)%p.length],l=Math.hypot(b[0]-a[0],b[1]-a[1]);if(l>bl){bl=l;bi=k}}
    const a=p[bi],b=p[(bi+1)%p.length],spread=.8*gc,ratio=(1-spread)/2+rng()*spread,sq0=area(p),ang=Math.PI/6*gc*(sq0<minSq*4?0:1)*(rng()-.5);
    const ex=(b[0]-a[0])/bl,ey=(b[1]-a[1])/bl,ca=Math.cos(ang),sn=Math.sin(ang),nx=ex*ca-ey*sn,ny=ex*sn+ey*ca,mx=lerp(a[0],b[0],ratio),my=lerp(a[1],b[1],ratio),g=split?1.7:0;
    for(const h of [clip(p,mx-nx*g,my-ny*g,nx,ny),clip(p,mx+nx*g,my+ny*g,-nx,-ny)]){if(h.length<3)continue;const sq=area(h);if(sq<30)continue;
      if(sq<minSq*Math.pow(2,4*sc*(rng()-.5))||dep>11){if(rng()>=ep)out.push(h)}else cut(h,minSq,gc,sc,ep,sq>minSq/(rng()*rng()),out,dep+1)}};
  const planned=p=>P.plan==="planejado"?true:P.plan==="organico"?false:(p.type==="nobre"||p.type==="militar"||p.type==="mercadores"&&rng()<.5||rng()<.22);
  const WP={mercadores:[430,.42,.5,.03],nobre:[1150,.3,.5,.05],artesaos:[340,.55,.6,.05],moradia:[300,.62,.7,.07],pobre:[190,.95,.85,.24],producao:[520,.45,.55,.1],porto:[560,.3,.45,.08],militar:[640,0,.2,.1],templo:[380,.45,.5,.08],castelo:[520,.3,.4,.3],arrabalde:[250,.9,.8,.42],estrangeiro:[330,.5,.6,.06]};
  const B=[],yards=[],fields=[],trees=[],squares=[],extra=[];
  const C0=CUL[P.culture]||CUL.humano,tier=(race,wl)=>{const C=CUL[race]||C0;if(race!=="humano")return {roof:[pick(C.roof),pick(C.roof)],wall:[pick(C.wall),pick(C.wall)]};
    return wl>.7?{roof:[pick(["slate","dark","tileb"]),"slate"],wall:[pick(["stone","brick","daub2"]),"stone"]}:wl>.35?{roof:[pick(["tile","tile2","tileb"]),pick(["tile","dark"])],wall:[pick(["daub","daub2","daub3"]),"daub"]}:{roof:[pick(["thatch","old","moss"]),"thatch"],wall:[pick(["daub","daub3","wood"]),"wood"]}};
  const WL={nobre:.95,mercadores:.8,templo:.7,castelo:.9,artesaos:.5,moradia:.45,porto:.45,militar:.55,producao:.4,pobre:.1,arrabalde:.12,estrangeiro:.5};
  const TY={mercadores:["town","row","row","rich","tavern","town"],nobre:["rich","manor","rich","rich"],artesaos:["town","row","town","smithy","town"],moradia:["town","row","town","town","hut"],pobre:["hut","hut","shed","farm"],producao:["smithy","barn","town","smithy","shed"],porto:["barn","town","tavern","barn","row"],militar:["barn"],templo:["town","rich","row"],castelo:["rich","barn"],arrabalde:["hut","farm","shed","hut"],estrangeiro:["town","row","town","rich"]};
  for(const p of patches){if(p.sea)continue;const t=p.type,race=p.race||P.culture;p.race=race;
    const ins=p.poly.map((_,k)=>{const e=edges.get(p.nd[k]<p.nd[(k+1)%p.nd.length]?p.nd[k]+"_"+p.nd[(k+1)%p.nd.length]:p.nd[(k+1)%p.nd.length]+"_"+p.nd[k]);return !e?5:e.wallE?13:mainE.has(e)?8:p.inner?5:7});
    p.block=inset(p.poly,ins);if(p.block.length<3)continue;p.pl=planned(p);p.pal=tier(race,(WL[t]||.4)*(.6+P.wealth*.8));
    if(t==="mercado"){squares.push({poly:inset(p.poly,5),kind:"praca"});p.special=[p.c[0],p.c[1]];continue}
    if(t==="parque"){yards.push({poly:p.block,col:"#9fb060",park:1});for(let q=0;q<p.area/300;q++){const x=p.c[0]+(rng()-.5)*220,y=p.c[1]+(rng()-.5)*220;if(inPoly(inset(p.block,8),x,y)&&!wet(x,y,6))trees.push([x,y,1+rng()*.3])}continue}
    if(t==="campos"){const out=[];cut(p.block,2400+rng()*2600,.25,.6,.12,false,out,0);for(const f of out){const c=cen(f);if(wet(c[0],c[1],6)||f.some(v=>wet(v[0],v[1])))continue;fields.push({poly:inset(f,1.5),c,ang:Math.atan2(f[1][1]-f[0][1],f[1][0]-f[0][0]),col:pick(["#c9b86a","#b9b060","#d4c57e","#a8b05a","#bfa85c","#9fae58","#cdb372"]),k:rng()});if(rng()<.1)B.push({x:c[0],y:c[1],type:"farm",race,ang:rng()*3.14,L:19,D:12,pal:tier(race,.2)})}continue}
    if(t==="mato"){const n=p.area/(260-P.green*120),den=fbm(p.c[0]/300+9,p.c[1]/300,2);for(let q=0;q<n;q++){const x=p.c[0]+(rng()-.5)*Math.sqrt(p.area)*2.2,y=p.c[1]+(rng()-.5)*Math.sqrt(p.area)*2.2;if(!inPoly(p.poly,x,y)||wet(x,y,7)||fbm(x/130,y/130,3)<.62-den*.3-P.green*.12)continue;trees.push([x,y,.95+rng()*.4,1])}continue}
    const wp=WP[p.foreign?"estrangeiro":t]||WP.moradia,out=[];cut(p.block,wp[0]*(p.pl?1.05:1),p.pl?.04:wp[1],p.pl?wp[2]*.4:wp[2],wp[3]*(1.4-P.wealth*.6),true,out,0);
    let sp=null;if(t==="templo"||t==="castelo"){sp=p.c;p.special=sp;squares.push({poly:inset(p.block,t==="castelo"?4:16),kind:t==="castelo"?"patio":"adro"})}
    const bd=inset(p.block,2.5);
    for(const lot of out){const c=cen(lot),sq=area(lot);if(wet(c[0],c[1],5)||lot.some(v=>wet(v[0],v[1],1)))continue;if(sp&&Math.hypot(c[0]-sp[0],c[1]-sp[1])<(t==="castelo"?98:62))continue;
      const innerLot=bd.length>2&&lot.every(v=>inPoly(bd,v[0],v[1]));
      if(innerLot&&rng()<(t==="pobre"||t==="arrabalde"?.25:.62)){yards.push({poly:lot,col:t==="nobre"?"#a3b262":rng()<.3+P.green*.4?"#aab166":"#c7b98c",g:1});if(rng()<P.green*.55&&t!=="militar")trees.push([c[0],c[1],.62+rng()*.2]);continue}
      let bi=0,bl=-1;for(let k=0;k<lot.length;k++){const a=lot[k],b=lot[(k+1)%lot.length],l=Math.hypot(b[0]-a[0],b[1]-a[1]);if(l>bl){bl=l;bi=k}}
      const a=lot[bi],b=lot[(bi+1)%lot.length];let ang=Math.atan2(b[1]-a[1],b[0]-a[0]);const ca=Math.cos(ang),sa2=Math.sin(ang);let u0=1e9,u1=-1e9,v0=1e9,v1=-1e9;for(const v of lot){const u=(v[0]-c[0])*ca+(v[1]-c[1])*sa2,w=-(v[0]-c[0])*sa2+(v[1]-c[1])*ca;u0=Math.min(u0,u);u1=Math.max(u1,u);v0=Math.min(v0,w);v1=Math.max(v1,w)}
      const f=Math.sqrt(Math.min(1,sq/((u1-u0)*(v1-v0))))*.93;let L=(u1-u0)*f*(t==="nobre"?.72:.9),D=(v1-v0)*f*(t==="nobre"?.68:.86);if(t==="pobre"||t==="arrabalde"){L*=.82;D*=.8;ang+=(rng()-.5)*.5}
      if(D>L){const q=L;L=D;D=q;ang+=1.5708}L=Math.min(L,t==="porto"||t==="militar"?46:t==="nobre"?40:30);D=Math.min(D,L*.78,22);if(L<9||D<7)continue;
      if(t==="nobre"){yards.push({poly:lot,col:"#a3b262",g:1});if(rng()<.5+P.green*.5)trees.push([c[0]+(rng()-.5)*L*.9,c[1]+D*.62,.6+rng()*.2])}
      let ty=pick(TY[p.foreign?"estrangeiro":t]||TY.moradia);if(sq<210&&ty!=="shed")ty=t==="pobre"||t==="arrabalde"?"hut":"row";if(ty==="row"&&L>D*1.7)ty="town";
      B.push({x:c[0],y:c[1],type:ty,race,ang,L,D,pal:p.pal,plain:t==="militar"})}}
  // ---- construcoes especiais
  const SPB=[];if(plaza.special){const c=plaza.c,rr=Math.sqrt(plaza.area)*.3;for(let q=0;q<10+nP/3;q++){const a=q*2.4+rng(),r=rr*(.35+.6*rng()),x=c[0]+Math.cos(a)*r,y=c[1]+Math.sin(a)*r*.9;if(!wet(x,y,4))SPB.push({k:6,x,y,col:pick(["#b5473a","#3f6f8f","#c9a24a","#5f7e35","#8a4a7a","#d8c9a0"])})}SPB.push({k:7,x:c[0],y:c[1]});
    const hx=c[0]-rr*.95,hy=c[1]-rr*.75;if(!wet(hx,hy,8))B.push({x:hx,y:hy,type:"manor",race:P.culture,ang:.2,L:38,D:19,pal:tier(P.culture,.9),hall:1})}
  for(const p of inner){if(p.type==="templo")SPB.push({k:2,x:p.c[0],y:p.c[1],race:p.race,v:rng(),big:nP>18});if(p.type==="castelo")SPB.push({k:3,x:p.c[0],y:p.c[1]+16,race:p.race,v:rng()});
    if(p.type==="militar")for(let q=0;q<7;q++){const x=p.c[0]+(rng()-.5)*60,y=p.c[1]+(rng()-.5)*50;if(!B.some(b=>Math.hypot(b.x-x,b.y-y)<24)&&!wet(x,y,4))SPB.push({k:32,x,y,race:p.race,flag:q===0})}
    if(p.type==="producao"&&p.riv){for(let q=0;q<40;q++){const x=p.c[0]+(rng()-.5)*150,y=p.c[1]+(rng()-.5)*150;if(rd(x,y)<rw+26&&rd(x,y)>rw+12&&inPoly(p.poly,x,y)&&!B.some(b=>Math.hypot(b.x-x,b.y-y)<22)){SPB.push({k:8,x,y,rot:rng()*3});break}}}}
  // porto: pieres e navios
  const piers=[],ships=[];for(const p of patches){if(p.type!=="porto")continue;let n=0;for(let q=0;q<22&&n<3;q++){const a=q/22*6.283+rng();let hit=null;for(let r=10;r<Math.sqrt(p.area)*1.1;r+=4){const x=p.c[0]+Math.cos(a)*r,y=p.c[1]+Math.sin(a)*r;if(land(x,y)<.0||rd(x,y)<rw-2){hit=[x,y];break}}
      if(!hit||piers.some(z=>Math.hypot(z[0][0]-hit[0],z[0][1]-hit[1])<46))continue;const len=P.site==="rio"&&land(hit[0],hit[1])>0?rw*.8:34+rng()*26,e=[hit[0]+Math.cos(a)*len,hit[1]+Math.sin(a)*len];if(land(e[0],e[1])>-.05&&!(rd(e[0],e[1])<rw))continue;
      piers.push([[hit[0]-Math.cos(a)*8,hit[1]-Math.sin(a)*8],e]);n++;if(len>30)ships.push({x:e[0]-Math.sin(a)*13+Math.cos(a)*4,y:e[1]+Math.cos(a)*13,big:rng()<.5,flip:rng()<.5})}}
  for(let q=0;q<(P.site==="interior"?0:5);q++){const x=80+rng()*(WX-160),y=140+rng()*(WY-380);if(land(x,y)<-.5&&!ships.some(s=>Math.hypot(s.x-x,s.y-y)<80))ships.push({x,y,big:rng()<.3,flip:rng()<.5})}
  // nomes: bairros vizinhos de mesma funcao formam um distrito
  const districts=[];{const seen=new Set(),used=new Set();for(const p of patches){if(seen.has(p)||!(p.inner||p.type==="arrabalde")||p.sea)continue;const key=p.foreign?"f"+p.race:p.type,grp=[],st=[p];seen.add(p);while(st.length){const q=st.pop();grp.push(q);for(const z of nbs(q))if(!seen.has(z)&&(z.foreign?"f"+z.race:z.type)===key&&(z.inner||z.type==="arrabalde")){seen.add(z);st.push(z)}}
      let ar=0,x=0,y=0;for(const q of grp){ar+=q.area;x+=q.c[0]*q.area;y+=q.c[1]*q.area}let name;if(p.foreign)name="Bairro dos "+A.RACE_PT[p.race];else{const l=(NM[p.type]||NM.moradia).filter(n=>!used.has(n));name=l.length?pick(l):pick(NM[p.type]||NM.moradia)}used.add(name);grp.forEach(q=>q.district=districts.length);districts.push({name,type:p.foreign?"estrangeiro":p.type,x:x/ar,y:y/ar,area:ar,n:grp.length,race:p.race})}}
  const title=P.title||A.NAMES[seed%A.NAMES.length];
  return {P,seed,rng,fbm,land,elev,rd,rw,river,EG,LG,RG,sg,patches,inner,nodes,edges:[...edges.values()],mainE,gates,roads,B,SPB,yards,fields,trees,squares,piers,ships,districts,plaza,castle,cx,cy,Rc,title}}

function render(C,canvas){const {P,rng:rng0,fbm,land,elev,rd,rw,EG,LG,RG,sg,nodes}=C;let rs=A.mulberry((C.seed^9173)>>>0);const rng=()=>rs();
  canvas.width=CW;canvas.height=CH;const c=canvas.getContext("2d"),stamps=A.makeStamps(A.mulberry(C.seed^77));
  const pj=(x,y)=>[x,y*TILT-elev(x,y)*KE];
  const snowy=P.culture==="norte",dry=P.culture==="deserto"||P.culture==="indiano"||P.culture==="meso",G0=dry?[214,188,128]:snowy?[176,180,150]:[170,170,90],G1=dry?[196,166,104]:snowy?[150,160,120]:[150,158,78];
  // 1. chao (grama, sombra do relevo, degraus de nivel) e agua, pixel a pixel
  const gimg=c.createImageData(MW,MH),g=gimg.data,wc=document.createElement("canvas");wc.width=MW;wc.height=MH;const wx=wc.getContext("2d"),wimg=wx.createImageData(MW,MH),w=wimg.data,NL=16;
  for(let sy=0;sy<MH;sy++)for(let sx=0;sx<MW;sx++){let y=sy/TILT;for(let q=0;q<3;q++)y=(sy+sg(EG,sx,y)*KE)/TILT;const e=sg(EG,sx,y),gx=(sg(EG,sx+4,y)-sg(EG,sx-4,y))/8,gy=(sg(EG,sx,y+4)-sg(EG,sx,y-4))/8,lit=clamp((gx*.85+gy*.7)*14,-1,1);
    const n1=fbm(sx/90,y/90,3),n2=((Math.imul(sx,73856093)^Math.imul(sy,19349663))>>>0)%97/97,t=clamp(n1*1.5-.25,0,1),k=(sy*MW+sx)*4;let sh=1+lit*(lit>0?.2:.36);
    const lv=(e*NL)|0;if(((sg(EG,sx+1,y)*NL)|0)!==lv||((sg(EG,sx,y+1.4)*NL)|0)!==lv)sh*=lv%4===0?.74:.84;sh*=.97+n2*.06;
    g[k]=lerp(G0[0],G1[0],t)*sh;g[k+1]=lerp(G0[1],G1[1],t)*sh;g[k+2]=lerp(G0[2],G1[2],t)*sh;g[k+3]=255;
    const L=sg(LG,sx,y),R=sg(RG,sx,y);if(L<0||R<rw){const d=L<0?-L*100:Math.min(40,(rw-R)*3),sea=L<0,f=sstep(0,90,d),wv=(fbm(sx/26,y/9,2)-.5)*16;let r=lerp(138,84,f)+wv,gg=lerp(170,124,f)+wv,b=lerp(176,148,f)+wv;if(!sea){r=112+wv;gg=148+wv;b=160+wv}
      if(d<2.2){r=52;gg=58;b=50}else if(d<5&&d>3.4){r+=46;gg+=44;b+=36}w[k]=r;w[k+1]=gg;w[k+2]=b;w[k+3]=255}}
  c.fillStyle="#cdbb93";c.fillRect(0,0,CW,CH);const gc=document.createElement("canvas");gc.width=MW;gc.height=MH;gc.getContext("2d").putImageData(gimg,0,0);wx.putImageData(wimg,0,0);
  c.drawImage(gc,MX,MY);c.save();c.beginPath();c.rect(MX,MY,MW,MH);c.clip();c.translate(MX,MY);c.lineCap="round";c.lineJoin="round";
  const path=(poly,close)=>{c.beginPath();for(let i=0;i<poly.length+(close?1:0);i++){const a=poly[i%poly.length],b=poly[(i+1)%poly.length];if(i===0){const p=pj(a[0],a[1]);c.moveTo(p[0],p[1])}if(i<poly.length-(close?0:1)){const n=Math.max(1,Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1])/14));for(let q=1;q<=n;q++){const p=pj(lerp(a[0],b[0],q/n),lerp(a[1],b[1],q/n));c.lineTo(p[0],p[1])}}}if(close)c.closePath()};
  // hachuras de encosta
  {c.lineWidth=.9;const hd=[],hl=[];for(let y=6;y<WY-6;y+=7)for(let x=6;x<WX-6;x+=7){const px=x+(rng()-.5)*6,py=y+(rng()-.5)*6,gx=(elev(px+3,py)-elev(px-3,py))/6,gy=(elev(px,py+3)-elev(px,py-3))/6,gg=Math.hypot(gx,gy);if(gg<.0014||rng()>gg*190||land(px,py)<.06)continue;const p=pj(px,py),len=clamp(gg*2600,3,9),q=pj(px-gx/gg*len,py-gy/gg*len);((gx*.85+gy*.7)>0?hl:hd).push([p,q])}
    c.strokeStyle="rgba(62,54,22,.5)";c.beginPath();for(const[p,q]of hd){c.moveTo(p[0],p[1]);c.lineTo(q[0],q[1])}c.stroke();c.strokeStyle="rgba(244,232,166,.45)";c.beginPath();for(const[p,q]of hl){c.moveTo(p[0],p[1]);c.lineTo(q[0],q[1])}c.stroke()}
  // 2. campos cultivados
  for(const f of C.fields){path(f.poly,true);c.fillStyle=f.col;c.fill();c.save();c.clip();const p=pj(f.c[0],f.c[1]);c.translate(p[0],p[1]);c.scale(1,TILT);c.rotate(f.ang);c.strokeStyle="rgba(80,62,20,.3)";c.lineWidth=.9;c.beginPath();const gp=f.k<.35?4:6.5;for(let y=-140;y<140;y+=gp){c.moveTo(-140,y);c.lineTo(140,y)}c.stroke();c.restore();path(f.poly,true);c.strokeStyle="rgba(72,52,20,.6)";c.lineWidth=1.1;c.stroke()}
  // 3. chao urbano, quintais e pracas
  const rich=P.wealth,EARTH=dry?"#dcc79a":"#cfc09a";
  for(const p of C.patches){if(!(p.inner||p.type==="arrabalde")||p.sea)continue;path(p.poly,true);c.fillStyle=p.type==="arrabalde"?"rgba(200,184,140,.6)":EARTH;c.fill()}
  for(const y of C.yards){path(y.poly,true);c.fillStyle=y.col;c.fill();c.strokeStyle="rgba(70,60,25,.35)";c.lineWidth=.7;c.stroke()}
  const cobble=(poly,col,step)=>{path(poly,true);c.fillStyle=col;c.fill();c.strokeStyle="rgba(60,48,28,.6)";c.lineWidth=1;c.stroke();c.save();path(poly,true);c.clip();const q=pj(poly[0][0],poly[0][1]);let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9;for(const v of poly){const p=pj(v[0],v[1]);x0=Math.min(x0,p[0]);x1=Math.max(x1,p[0]);y0=Math.min(y0,p[1]);y1=Math.max(y1,p[1])}
    c.strokeStyle="rgba(70,58,36,.34)";c.lineWidth=.6;c.beginPath();let r=0;for(let y=y0;y<y1;y+=step*TILT,r++){c.moveTo(x0,y);c.lineTo(x1,y);for(let x=x0+(r%2)*step*.6;x<x1;x+=step*1.2){c.moveTo(x,y);c.lineTo(x,y+step*TILT)}}c.stroke();c.restore()};
  for(const s of C.squares)cobble(s.poly,s.kind==="adro"?"#d6ccb2":s.kind==="patio"?"#c9c1aa":rich>.35?"#d9cfb4":"#d2c296",s.kind==="praca"?6:5);
  // 4. ruas: de terra nos bairros simples, calcadas nas principais e nos bairros ricos
  const seg=e=>[[nodes[e.a].x,nodes[e.a].y],[nodes[e.b].x,nodes[e.b].y]];
  const stroke=(pts,wd,col,edge)=>{path(pts,false);c.strokeStyle=edge||"rgba(64,46,22,.7)";c.lineWidth=wd+1.8;c.stroke();c.strokeStyle=col;c.lineWidth=wd;c.stroke()};
  const smooth=pts=>{let o=pts;for(let k=0;k<2;k++){const n=[o[0]];for(let i=0;i<o.length-1;i++){const a=o[i],b=o[i+1];n.push([lerp(a[0],b[0],.25),lerp(a[1],b[1],.25)],[lerp(a[0],b[0],.75),lerp(a[1],b[1],.75)])}n.push(o[o.length-1]);o=n}return o};
  for(const r of C.roads)stroke(smooth(r),6.5,"#d3bf8e");
  const stE=C.edges.filter(e=>(e.in>0||e.ps.some(p=>p.type==="arrabalde"))&&!e.sea&&!(e.wallE&&!C.mainE.has(e)));
  for(const e of stE){if(C.mainE.has(e))continue;const pavd=e.ps.some(p=>p.type==="nobre"||p.type==="mercadores"||p.type==="templo")&&rich>.3;stroke(seg(e),e.in?4.6:3.6,pavd?"#d8cdb0":"#cdb98a")}
  for(const e of C.mainE){const s=seg(e);stroke(s,8.4,rich>.25?"#ddd3b8":"#d3bf8e");if(rich>.25){path(s,false);c.strokeStyle="rgba(70,58,36,.38)";c.lineWidth=5.6;c.setLineDash([.7,3.6]);c.stroke();c.lineWidth=2;c.lineDashOffset=2;c.stroke();c.setLineDash([]);c.lineDashOffset=0}}
  // 5. agua por cima do chao, pontes e pieres
  c.drawImage(wc,0,0);
  {c.strokeStyle="rgba(235,244,240,.5)";c.lineWidth=.9;c.beginPath();for(let q=0;q<1500;q++){const x=rng()*WX,y=rng()*WY;if(land(x,y)>-.12&&rd(x,y)>rw-5)continue;const p=pj(x,y),l=3+rng()*5;c.moveTo(p[0]-l,p[1]);c.quadraticCurveTo(p[0],p[1]-1.6,p[0]+l,p[1])}c.stroke()}
  const bridge=(a,b,stone,wd)=>{const pa=pj(a[0],a[1]),pb=pj(b[0],b[1]),ln=()=>{c.beginPath();c.moveTo(pa[0],pa[1]);c.lineTo(pb[0],pb[1])};c.lineCap="butt";
    if(stone){ln();c.strokeStyle=INK;c.lineWidth=wd+3.4;c.stroke();ln();c.strokeStyle="#cdc6b4";c.lineWidth=wd+1.6;c.stroke();ln();c.strokeStyle="#e2d6b4";c.lineWidth=wd-2.6;c.stroke();ln();c.strokeStyle="rgba(60,50,35,.55)";c.lineWidth=wd+1.6;c.setLineDash([1,5]);c.stroke();c.setLineDash([])}
    else{ln();c.strokeStyle="#3a2a18";c.lineWidth=wd+2;c.stroke();ln();c.strokeStyle="#9a7446";c.lineWidth=wd;c.stroke();ln();c.strokeStyle="rgba(50,32,15,.7)";c.setLineDash([.8,2.4]);c.stroke();c.setLineDash([])}c.lineCap="round"};
  for(const e of stE){if(!e.riv)continue;const [a,b]=seg(e);let t0=-1,t1=-1;for(let q=0;q<=40;q++){const x=lerp(a[0],b[0],q/40),y=lerp(a[1],b[1],q/40);if(rd(x,y)<rw+1.5){if(t0<0)t0=q/40;t1=q/40}}if(t0<0||(t1-t0)*e.len>rw*5)continue;const main=C.mainE.has(e);if(!main&&((e.a*7+e.b)%3===0))continue;
    const m=6/e.len;bridge([lerp(a[0],b[0],t0-m),lerp(a[1],b[1],t0-m)],[lerp(a[0],b[0],t1+m),lerp(a[1],b[1],t1+m)],main||rich>.6,main?8.4:4.6)}
  for(const r of C.roads){const s=smooth(r);let i0=-1;for(let i=0;i<s.length;i++){const wt=rd(s[i][0],s[i][1])<rw+1.5;if(wt&&i0<0)i0=i;if(!wt&&i0>=0){bridge(s[Math.max(0,i0-1)],s[i],false,6.5);i0=-1}}}
  for(const [a,b] of C.piers){const pa=pj(a[0],a[1]),pb=pj(b[0],b[1]);c.lineCap="butt";for(const [wd,col] of [[8,"#3a2a18"],[6,"#9a7446"]]){c.strokeStyle=col;c.lineWidth=wd;c.beginPath();c.moveTo(pa[0],pa[1]);c.lineTo(pb[0],pb[1]);c.stroke()}c.strokeStyle="rgba(50,32,15,.7)";c.lineWidth=6;c.setLineDash([.8,2.6]);c.beginPath();c.moveTo(pa[0],pa[1]);c.lineTo(pb[0],pb[1]);c.stroke();c.setLineDash([]);c.lineCap="round"}
  // 6. objetos em ordem de profundidade
  const obj=[],Z=1.55,fz=CUL[P.culture].fence;
  for(const b of C.B){const r2=A.mulberry((Math.imul(b.x*4|0,73856093)^Math.imul(b.y*4|0,19349663))>>>0),pk=a=>r2()<.74?a[0]:a[1],o=A.mkHouse(b.race,b.type,r2,b.ang,{L:b.L/Z,D:b.D/Z,roof:pk(b.pal.roof),wall:pk(b.pal.wall),plain:b.plain});if(b.hall&&!o.tower&&(o.form==="gable"||o.form==="long"))o.tower={dx:Math.cos(b.ang)*o.L/2,dy:Math.sin(b.ang)*o.L/2*TILT+1,w:3.2,h:o.H+o.R+7,r:5.5,back:Math.sin(b.ang)<0};
    const p=pj(b.x,b.y),ey=(Math.abs(Math.sin(b.ang))*b.L+Math.abs(Math.cos(b.ang))*b.D)/2*TILT;obj.push({k:1,x:p[0],y:p[1]+ey,cy:p[1],o,smoke:o.smoke||b.type==="tavern"&&r2()<.5})}
  for(const s of C.SPB){const p=pj(s.x,s.y);obj.push(Object.assign({},s,{x:p[0],y:p[1]+(s.k===3?26:s.k===2?10:0),py:p[1]}))}
  for(const t of C.trees){const p=pj(t[0],t[1]);obj.push({k:0,x:p[0],y:p[1],s:t[2],wild:t[3],wx:t[0],wy:t[1]})}
  for(const s of C.ships){const p=pj(s.x,s.y);obj.push({k:13,x:p[0],y:p[1],big:s.big,flip:s.flip})}
  if(P.wall){const gs=new Set(C.gates);for(const e of C.edges){if(!e.wallE||e.sea)continue;let a=[nodes[e.a].x,nodes[e.a].y],b=[nodes[e.b].x,nodes[e.b].y];const l=e.len,cutA=gs.has(e.a)?9/l:0,cutB=gs.has(e.b)?9/l:0;const a2=[lerp(a[0],b[0],cutA),lerp(a[1],b[1],cutA)],b2=[lerp(b[0],a[0],cutB),lerp(b[1],a[1],cutB)];
      const n=Math.max(1,Math.round(l/46));for(let q=0;q<n;q++){const u=[lerp(a2[0],b2[0],q/n),lerp(a2[1],b2[1],q/n)],v=[lerp(a2[0],b2[0],(q+1)/n),lerp(a2[1],b2[1],(q+1)/n)],pu=pj(u[0],u[1]),pv=pj(v[0],v[1]),wt=rd((u[0]+v[0])/2,(u[1]+v[1])/2)<rw+3;obj.push({k:wt?9:4,a:pu,b:pv,y:Math.max(pu[1],pv[1])});if(q>0&&!wt)obj.push({k:5,x:pu[0],y:pu[1]+.6,g:0})}
      for(const [id,cutv,pt] of [[e.a,cutA,a2],[e.b,cutB,b2]]){const p=cutv?pj(pt[0],pt[1]):pj(nodes[id].x,nodes[id].y);if(rd(nodes[id].x,nodes[id].y)<rw+3&&!cutv)continue;obj.push({k:5,x:p[0],y:p[1]+.6,g:cutv?1:0,id:cutv?-1:id})}}}
  obj.sort((a,b)=>a.y-b.y);const smoke=[],seenT=new Set(),treeSet=P.culture==="deserto"?stamps.palm:P.culture==="norte"?stamps.con:stamps.dec,wildSet=P.culture==="deserto"?stamps.palm.concat(stamps.acacia):P.culture==="norte"?stamps.con:stamps.dec.concat(stamps.dec,stamps.con);
  const wallSegs=C.edges.filter(e=>e.wallE&&!e.sea).map(seg);
  for(const q of obj){rs=A.mulberry((Math.imul(q.x*4|0,73856093)^Math.imul(q.y*4|0,19349663)^q.k*83492791)>>>0);
    if(q.k===1){c.save();c.translate(q.x,q.cy);c.scale(Z,Z);K.drawBuilding(c,0,0,q.o);c.restore();if(q.smoke)smoke.push([q.x,q.cy-(q.o.H+q.o.R)*Z-3])}
    else if(q.k===0){if(q.wild&&P.wall&&wallSegs.some(s=>segD(q.wx,q.wy,s[0],s[1])<34))continue;const set=q.wild?wildSet:(P.culture==="japones"||P.culture==="chines")&&rng()<.6?stamps.sakura:treeSet,st=set[(rng()*set.length)|0],wd=st.width*q.s*1.25,hg=st.height*q.s*1.25;c.drawImage(st,q.x-wd/2,q.y-hg*.9,wd,hg)}
    else if(q.k===2||q.k===3){c.save();c.translate(q.x,q.py);c.scale(q.k===3?1.9:1.75,q.k===3?1.9:1.75);K.drawBig(c,Object.assign({},q,{x:0,y:0,sz:1}));c.restore()}
    else if(q.k===4){if(fz==="palisade")K.drawPalisade(c,q.a,q.b,9);else if(fz==="hedge")K.drawHedge(c,q.a,q.b,5);else K.drawWall(c,q.a,q.b,8.5,fz)}
    else if(q.k===9)K.drawWaterWall(c,q.a,q.b,8.5,fz);
    else if(q.k===5){if(q.id>=0){if(seenT.has(q.id))continue;seenT.add(q.id)}if(fz==="asian")K.drawAsian(c,q.x,q.y+2,{L:q.g?15:8,D:q.g?10:8,H:q.g?10:7,R:q.g?6:4,ang:0,roof:"jp",wall:"jpw",base:q.g?1.5:0});else if(fz==="palisade")K.drawTower(c,q.x,q.y+2,q.g?6:5,q.g?17:14,q.g?7:6,ROOF.hide,WALL.wooddark,false);else if(fz==="hedge"){}else K.drawTower(c,q.x,q.y+2,q.g?6.6:5.6,q.g?19:14.5,q.g?9:0,ROOF.dark,fz==="sand"?WALL.sand:WALL.stone,!q.g)}
    else if(q.k===6){c.save();c.translate(q.x,q.y);c.scale(1.9,1.9);c.lineWidth=.6;K.poly(c,[[-3,-2.6],[3,-4],[3,-1.9],[-3,-.5]],q.col,INK);c.strokeStyle=INK;c.beginPath();c.moveTo(-3,-.5);c.lineTo(-3,1.2);c.moveTo(3,-1.9);c.lineTo(3,0);c.stroke();c.restore()}
    else if(q.k===7){c.fillStyle="#9a9484";c.strokeStyle=INK;c.lineWidth=.9;c.beginPath();c.ellipse(q.x,q.y,7,4.2,0,0,7);c.fill();c.stroke();c.fillStyle="#5d8796";c.beginPath();c.ellipse(q.x,q.y,5,2.8,0,0,7);c.fill();c.stroke();c.fillStyle="#b9b3a2";c.fillRect(q.x-1.2,q.y-7,2.4,7);c.strokeRect(q.x-1.2,q.y-7,2.4,7)}
    else if(q.k===8){c.save();c.translate(q.x,q.y);c.scale(1.5,1.5);K.drawMill(c,0,0,q.rot);c.restore()}
    else if(q.k===13){c.save();c.translate(q.x,q.y);c.scale(1.7,1.7);K.drawShip(c,0,0,q.big,q.flip);c.restore()}
    else if(q.k===32){c.save();c.translate(q.x,q.y);c.scale(1.7,1.7);K.drawTent(c,0,0,q.race,1,false,q.flag);c.restore()}}
  rs=A.mulberry((C.seed^99)>>>0);for(const s of smoke)K.drawSmoke(c,s[0],s[1],rng);
  // 7. nomes dos bairros
  if(P.labels){const boxes=[];c.textAlign="center";c.textBaseline="middle";for(const d of C.districts.slice().sort((a,b)=>b.area-a.area)){const p=pj(d.x,d.y),big=d.n>1,fs=big?17:14,txt=d.name.toUpperCase().split("").join(" ");c.font=fs+'px "IM Fell English SC","IM Fell English",Georgia,serif';const wd=c.measureText(txt).width+8,bx=[p[0]-wd/2,p[1]-fs*.7,p[0]+wd/2,p[1]+fs*.7];
      if(bx[0]<4||bx[2]>MW-4||bx[1]<4||bx[3]>MH-4||boxes.some(o=>bx[0]<o[2]&&bx[2]>o[0]&&bx[1]<o[3]&&bx[3]>o[1]))continue;boxes.push(bx);c.lineWidth=4;c.strokeStyle="rgba(240,230,200,.88)";c.strokeText(txt,p[0],p[1]);c.fillStyle="#5c1f18";c.fillText(txt,p[0],p[1])}}
  // 8. envelhecimento, grao e moldura
  const vg=c.createRadialGradient(MW/2,MH/2,MH*.45,MW/2,MH/2,MW*.75);vg.addColorStop(0,"rgba(70,45,10,0)");vg.addColorStop(1,"rgba(70,45,10,.3)");c.fillStyle=vg;c.fillRect(0,0,MW,MH);
  const gn=document.createElement("canvas");gn.width=gn.height=160;const gx=gn.getContext("2d"),gd=gx.createImageData(160,160);for(let i=0;i<gd.data.length;i+=4){const v=150+rng()*105;gd.data[i]=v;gd.data[i+1]=v*.97;gd.data[i+2]=v*.9;gd.data[i+3]=255}gx.putImageData(gd,0,0);
  c.globalCompositeOperation="multiply";c.globalAlpha=.34;c.fillStyle=c.createPattern(gn,"repeat");c.fillRect(0,0,MW,MH);c.globalAlpha=1;c.globalCompositeOperation="source-over";c.restore();
  c.strokeStyle=INK;c.lineWidth=2;c.strokeRect(MX-.5,MY-.5,MW+1,MH+1);c.lineWidth=.8;c.strokeRect(MX-6.5,MY-6.5,MW+13,MH+13);
  c.font='30px "IM Fell English SC","IM Fell English",Georgia,serif';c.textAlign="center";c.textBaseline="middle";c.fillStyle="#1d160d";const title=("Cidade de "+C.title).toUpperCase();c.fillText(title,CW/2,31);const tw=c.measureText(title).width/2+22;
  for(const s of[-1,1])K.poly(c,[[CW/2+s*tw,24],[CW/2+s*tw+6,31],[CW/2+s*tw,38],[CW/2+s*tw-6,31]],"#a8352a");
  return {n:obj.length,houses:C.B.length,project:(x,y)=>{const p=pj(x,y);return [p[0]+MX,p[1]+MY]}}}

window.AtlasCity={generate,render,DEF,PARAMS,SITES,WARD,CW,CH};
})();
