/* Atlas - gerador de mapa de cidade (GPL-3.0).
   A divisao em bairros (Voronoi em espiral) e o corte dos quarteiroes em lotes seguem a ideia do
   TownGeneratorOS de Watabou (GPL-3.0, github.com/watabou/TownGeneratorOS), reescritos aqui para o
   estilo inclinado do Atlas, com relevo, agua, culturas, portos e funcoes de bairro proprias. */
(function(){
"use strict";
const A=window.AtlasGen,K=A.kit,AS=window.AtlasAssets,TILT=A.TILT,INK=K.INK,CUL=K.CUL,ROOF=K.ROOF,WALL=K.WALL;
const MW=1500,MH=1020,MX=46,MY=64,CW=MW+92,CH=MH+110,KE=64,WX=MW,WY=Math.ceil((MH+KE)/TILT)+2,GS=6,GW=Math.ceil(WX/GS)+2,GH=Math.ceil(WY/GS)+2,Z=1.55;
const clamp=(v,a,b)=>v<a?a:v>b?b:v,lerp=(a,b,t)=>a+(b-a)*t,sstep=(a,b,x)=>{const t=clamp((x-a)/(b-a),0,1);return t*t*(3-2*t)};
const SITES=[["interior","Interior"],["rio","Beira de rio"],["costa","Costa"],["peninsula","Península"],["ilha","Ilha"],["ilhas","Duas ilhas com ponte"],["lago","Beira de lago"],["arquipelago","Arquipélago"]];
const DEF={seed:"novigrad-1272",site:"costa",size:24,culture:"humano",foreign:"auto",wall:"reta",citadel:true,river:true,plan:"misto",wealth:.55,relief:.5,suburbs:.6,green:.4,magic:.35,labels:true,wards:{}};
const WTYPES=[["mercado","Praça do mercado"],["templo","Templo"],["castelo","Cidadela"],["porto","Porto"],["nobre","Nobre"],["mercadores","Mercadores"],["artesaos","Artesãos"],["producao","Produção"],["universidade","Universidade"],["militar","Quartel"],["moradia","Moradias"],["pobre","Pobre"],["parque","Jardim"],["arrabalde","Arrabalde"],["campos","Campos"],["mato","Mata"]];
const PARAMS=[["seed","Semente","text"],["site","Terreno","select",SITES],["size","Tamanho (bairros)","int",6,44],["culture","Cultura","select",A.RACES.map(r=>[r,A.RACE_PT[r]])],
  ["foreign","Bairro estrangeiro","select",[["auto","Sorteado"],["nao","Nenhum"]].concat(A.RACES.map(r=>[r,A.RACE_PT[r]]))],["plan","Traçado","select",[["misto","Misto"],["organico","Orgânico"],["planejado","Planejado (ruas paralelas)"]]],
  ["wall","Muralha","select",[["reta","Reta, com torres"],["curva","Curva"],["nenhuma","Sem muralha"]]],["citadel","Castelo","bool"],["river","Rio","bool"],
  ["wealth","Riqueza","pct"],["relief","Relevo","pct"],["suburbs","Cidade fora da muralha","pct"],["green","Jardins e árvores","pct"],["magic","Fantasia (magia)","pct"],["labels","Nomes dos bairros","bool"]];
const NM={mercado:["Praça Velha","Largo do Mercado","Praça do Sino","Feira Grande"],templo:["Adro Santo","Alto do Templo","Largo das Preces","Bairro da Sé"],castelo:["Cidadela","Castelo Alto","Fortaleza","Paço Real"],porto:["Cais Velho","Ribeira","Porto das Redes","Doca do Sal","Cais Novo"],
  nobre:["Alto dos Fidalgos","Colina Dourada","Jardins do Conde","Bairro das Torres"],mercadores:["Rua dos Ourives","Bairro da Balança","Largo dos Cambistas","Mercado Novo"],artesaos:["Bairro dos Oleiros","Rua dos Tecelões","Ferrarias","Bairro dos Tanoeiros","Sapataria"],
  producao:["Curtume","Forjas","Moinhos","Olarias","Tinturaria"],universidade:["Bairro dos Sábios","Largo das Letras","Colégio"],militar:["Quartel","Campo de Armas","Arsenal"],moradia:["Vila Nova","Bairro do Poço","Travessas","Ladeira","Bairro Baixo","Santa Clara","Bairro Alto"],pobre:["Beco da Lama","Brejo","Barracos","Fundo do Poço","Baixada"],
  parque:["Jardim do Bispo","Horto","Bosque Velho"],arrabalde:["Arrabalde","Além-Muro","Estrada Velha","Caminho da Feira","Pedras Soltas","Rocio"]};
// especiais por bairro: [id, chance, quantas]
const SPEC={mercado:[["markethall",.5,1],["statue",.4,1]],templo:[],castelo:[["barracks",.9,1],["stable",.8,1],["well",1,1],["chapel",.6,1],["granary",.6,1],["crates",1,2]],nobre:[["garden",.6,1],["bank",.5,1],["court",.4,1],["library",.3,1],["observatory",.35,1],["fountain",.5,1]],
  mercadores:[["guild",.8,1],["inn",.8,2],["bank",.4,1],["shop",1,3],["warehouse",.5,1]],artesaos:[["smithy",.9,2],["bakery",.8,1],["shop",.9,2],["alchemist",.5,1],["brewery",.4,1]],
  producao:[["tannery",.8,1],["sawmill",.6,1],["granary",.6,1],["smithy",.8,1],["brewery",.5,1],["watermill",.7,1]],universidade:[["university",1,1],["library",1,1],["observatory",.6,1],["school",.6,1]],
  militar:[["barracks",1,1],["stable",.8,1],["prison",.5,1]],moradia:[["chapel",.4,1],["school",.3,1],["well",.8,1],["bakery",.4,1],["inn",.3,1]],pobre:[["well",.8,1],["gallows",.25,1],["tannery",.3,1]],
  porto:[["warehouse",1,2],["fishery",.9,1],["shipwright",.7,1],["inn",.7,1],["crane",.8,2],["lighthouse",.6,1]],parque:[["garden",1,1],["statue",.6,1],["fountain",.5,1]],arrabalde:[["inn",.35,1],["stable",.3,1],["smithy",.3,1],["well",.5,1]]};
const MAGIC=[["wizard","nobre"],["alchemist","artesaos"],["arcane","parque"],["portal","universidade"],["crystal","mercado"],["dragonstatue","nobre"],["golem","militar"],["eldertree","parque"]];
// ---------- geometria ----------
const area=p=>{let s=0;for(let i=0;i<p.length;i++){const a=p[i],b=p[(i+1)%p.length];s+=a[0]*b[1]-b[0]*a[1]}return Math.abs(s)/2};
const sgnA=p=>{let s=0;for(let i=0;i<p.length;i++){const a=p[i],b=p[(i+1)%p.length];s+=a[0]*b[1]-b[0]*a[1]}return s<0?-1:1};
const cen=p=>{let x=0,y=0,s=0;for(let i=0;i<p.length;i++){const a=p[i],b=p[(i+1)%p.length],c=a[0]*b[1]-b[0]*a[1];x+=(a[0]+b[0])*c;y+=(a[1]+b[1])*c;s+=c}return s?[x/(3*s),y/(3*s)]:p[0].slice()};
function clip(P,mx,my,nx,ny,T,tag){const o=[],ot=[],n=P.length;for(let k=0;k<n;k++){const a=P[k],b=P[(k+1)%n],da=(a[0]-mx)*nx+(a[1]-my)*ny,db=(b[0]-mx)*nx+(b[1]-my)*ny;
    if(da<=0){o.push(a);ot.push(T?T[k]:0);if(db>0){const t=da/(da-db);o.push([lerp(a[0],b[0],t),lerp(a[1],b[1],t)]);ot.push(tag)}}else if(db<=0){const t=da/(da-db);o.push([lerp(a[0],b[0],t),lerp(a[1],b[1],t)]);ot.push(T?T[k]:0)}}
  return T?[o,ot]:o}
function inset(P,d){const s=sgnA(P);let o=P;for(let k=0;k<P.length&&o.length>2;k++){const a=P[k],b=P[(k+1)%P.length],l=Math.hypot(b[0]-a[0],b[1]-a[1])||1,nx=(b[1]-a[1])/l*s,ny=-(b[0]-a[0])/l*s,dd=typeof d==="number"?d:d[k];o=clip(o,a[0]-nx*dd,a[1]-ny*dd,nx,ny)}return o}
function inPoly(P,x,y){let c=false;for(let i=0,j=P.length-1;i<P.length;j=i++){const a=P[i],b=P[j];if((a[1]>y)!==(b[1]>y)&&x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0])c=!c}return c}
function segD(px,py,a,b){const dx=b[0]-a[0],dy=b[1]-a[1],l=dx*dx+dy*dy||1,t=clamp(((px-a[0])*dx+(py-a[1])*dy)/l,0,1);return Math.hypot(px-a[0]-dx*t,py-a[1]-dy*t)}
function polyD(px,py,pts,closed){let d=1e9;for(let i=0;i<pts.length-(closed?0:1);i++){const q=segD(px,py,pts[i],pts[(i+1)%pts.length]);if(q<d)d=q}return d}
function chaikin(pts,closed,it){let o=pts;for(let k=0;k<it;k++){const n=[];const m=o.length;if(!closed)n.push(o[0]);for(let i=0;i<(closed?m:m-1);i++){const a=o[i],b=o[(i+1)%m];n.push([lerp(a[0],b[0],.25),lerp(a[1],b[1],.25)],[lerp(a[0],b[0],.75),lerp(a[1],b[1],.75)])}if(!closed)n.push(o[m-1]);o=n}return o}
function resampleP(pts,step,closed){const o=[pts[0]];let acc=0;const P2=closed?pts.concat([pts[0]]):pts;for(let i=0;i<P2.length-1;i++){const a=P2[i],b=P2[i+1],l=Math.hypot(b[0]-a[0],b[1]-a[1]);let t=step-acc;while(t<=l){o.push([a[0]+(b[0]-a[0])*t/l,a[1]+(b[1]-a[1])*t/l]);t+=step}acc=l-(t-step)}if(!closed){const e=pts[pts.length-1];if(Math.hypot(e[0]-o[o.length-1][0],e[1]-o[o.length-1][1])>step*.4)o.push(e)}return o}
const obb=(x,y,ang,L,D)=>{const ca=Math.cos(ang),sa=Math.sin(ang);return [[-L/2,-D/2],[L/2,-D/2],[L/2,D/2],[-L/2,D/2]].map(([u,v])=>[x+ca*u-sa*v,y+sa*u+ca*v])};
const sat=(A,B)=>{for(const P of[A,B])for(let i=0;i<4;i++){const a=P[i],b=P[(i+1)%4],nx=b[1]-a[1],ny=a[0]-b[0];let a0=1e9,a1=-1e9,b0=1e9,b1=-1e9;for(const q of A){const d=q[0]*nx+q[1]*ny;a0=Math.min(a0,d);a1=Math.max(a1,d)}for(const q of B){const d=q[0]*nx+q[1]*ny;b0=Math.min(b0,d);b1=Math.max(b1,d)}if(a1<=b0+.6||b1<=a0+.6)return false}return true};
// retangulo (casa) que cabe no lote
function fitRect(lot,c,ang,L,D){const ca=Math.cos(ang),sa=Math.sin(ang);for(let k=0;k<10;k++){const pts=[[-L/2,-D/2],[L/2,-D/2],[L/2,D/2],[-L/2,D/2]].map(([u,v])=>[c[0]+ca*u-sa*v,c[1]+sa*u+ca*v]);if(pts.every(q=>inPoly(lot,q[0],q[1])))return [L,D];L*=.92;D*=.93;if(L<6||D<5)return null}return null}

function generate(P0){const P=Object.assign({},DEF,P0);if(P.wall===true)P.wall="reta";if(P.wall===false)P.wall="nenhuma";const WALLON=P.wall!=="nenhuma";
  const seed=A.hashStr(String(P.seed)+"|"+P.site),rng=A.mulberry(seed),pick=a=>a[(rng()*a.length)|0];
  const NT=new Float32Array(65536);for(let i=0;i<65536;i++)NT[i]=rng();
  const vn=(x,y)=>{const xi=Math.floor(x),yi=Math.floor(y),fx=x-xi,fy=y-yi,u=fx*fx*(3-2*fx),v=fy*fy*(3-2*fy),h=(a,b)=>NT[((a&255)+((b&255)<<8))&65535];return lerp(lerp(h(xi,yi),h(xi+1,yi),u),lerp(h(xi,yi+1),h(xi+1,yi+1),u),v)};
  const fbm=(x,y,o)=>{let s=0,a=.5,n=0;for(let i=0;i<o;i++){s+=vn(x,y)*a;n+=a;x=x*2.03+17.1;y=y*2.03+9.7;a*=.5}return s/n};
  const nP=clamp(Math.round(P.size),5,46),Rc=clamp(190+nP*12.5,240,570),SP=Rc/(10+nP*2.5);let cx=WX/2,cy=(MH/2+30)/TILT;
  // ---- terreno
  const th=1.5708+(rng()-.5)*1.5,ct=Math.cos(th),st=Math.sin(th),wob=(x,y)=>(fbm(x/250+3,y/250+8,4)-.5)*190+(fbm(x/70+1,y/70+5,2)-.5)*36;
  if(P.site==="costa"){cx-=ct*Rc*.42;cy-=st*Rc*.5}if(P.site==="lago"){cx-=ct*Rc*.3;cy-=st*Rc*.3}
  // formas irregulares: raio que varia com o angulo (cabos e baías), alongamento, giro e lóbulos
  const shape=(x,y,R,el,rot,ph,rough)=>({x,y,R,el,rot,ph,rough,lobes:Array.from({length:1+((rng()*3)|0)},()=>{const a=rng()*6.28,d=.35+rng()*.4;return [Math.cos(a)*d,Math.sin(a)*d,.45+rng()*.3]})});
  const shapeF=(S,x,y,wk)=>{const dx=x-S.x,dy=y-S.y,cr=Math.cos(S.rot),sr=Math.sin(S.rot);let u=(dx*cr+dy*sr)/S.el,v=-dx*sr+dy*cr;const a=Math.atan2(v,u),d=Math.hypot(u,v);
    const rr=S.R*(1+S.rough*((fbm(Math.cos(a)*1.3+S.ph,Math.sin(a)*1.3+S.ph,4)-.5)*1.9)+.07*Math.sin(a*3+S.ph));let m=rr-d;for(const [lx,ly,lr] of S.lobes)m=Math.max(m,S.R*lr-Math.hypot(u-lx*S.R,v-ly*S.R));return m+wob(x,y)*wk};
  let lakeS=null;if(P.site==="lago"){const R=Rc*.62+150;lakeS=shape(cx+ct*(R+Rc*.08),cy+st*(R+Rc*.08),R*.86,1.15+rng()*.55,rng()*3.14,rng()*9,.42)}
  let blobs=null;if(P.site==="ilhas"){const off=Rc*.72+56,big=rng()<.5?1:-1;blobs=[shape(cx-st*off,cy+ct*off*.9,Rc*(big>0?.74:.6),1.15+rng()*.4,th+(rng()-.5)*.8,rng()*9,.32),shape(cx+st*off,cy-ct*off*.9,Rc*(big>0?.6:.74),1.1+rng()*.45,th+(rng()-.5)*1.2,rng()*9,.32)];
    for(let i=0;i<3;i++){const a=rng()*6.28,d=Rc*1.5+rng()*160;blobs.push(shape(cx+Math.cos(a)*d,cy+Math.sin(a)*d,28+rng()*40,1+rng()*.8,rng()*3,rng()*9,.4))}}
  if(P.site==="arquipelago"){blobs=[shape(cx,cy,Rc*.56,1.1+rng()*.3,rng()*3,rng()*9,.28)];const n=3+((rng()*2)|0),a0=rng()*6.28;for(let i=0;i<n;i++){const a=a0+i/n*6.283+(rng()-.5)*.4,d=Rc*.56+Rc*.46+36+rng()*24;blobs.push(shape(cx+Math.cos(a)*d,cy+Math.sin(a)*d*.92,Rc*(.34+rng()*.14),1.1+rng()*.7,rng()*3.14,rng()*9,.38))}for(let i=0;i<5;i++){const a=rng()*6.28,d=Rc*1.8+rng()*220;blobs.push(shape(cx+Math.cos(a)*d,cy+Math.sin(a)*d,30+rng()*55,1+rng()*.9,rng()*3,rng()*9,.45))}}
  const landF=(x,y)=>{const w=wob(x,y),dx=x-cx,dy=y-cy;
    if(P.site==="costa")return (Rc*.5+50-(dx*ct+dy*st)+w)/100;
    if(P.site==="ilha")return (Rc*1.12+95-Math.hypot(dx,dy)+w)/100;
    if(P.site==="peninsula"){const al=-(dx*ct+dy*st),pe=Math.abs(-dx*st+dy*ct);return Math.max(Rc*1.02+80-Math.hypot(dx,dy)+w,al>0?Rc*.5+40-pe+w*.6:-1e9,al-Rc*1.9+w)/100}
    if(P.site==="lago")return -shapeF(lakeS,x,y,.3)/100;
    if(blobs){let m1=-1e9,m2=-1e9;for(const b of blobs){const v=shapeF(b,x,y,.22);if(v>m1){m2=m1;m1=v}else if(v>m2)m2=v}const gap=(m1-m2)*.5-16+(fbm(x/60+3,y/60,2)-.5)*10;return (m2>-60?Math.min(m1,gap):m1)/100}
    return 3};
  let river=null,rw=0;const hasRiver=P.site==="rio"||(P.river&&P.site!=="ilha"&&P.site!=="arquipelago"&&P.site!=="ilhas");
  if(hasRiver){rw=P.site==="rio"?15:10+rng()*4;const off=(rng()<.5?-1:1)*(P.site==="rio"?Rc*.12:Rc*.38),ph=rng()*6,am=50+rng()*60;river=[];
    for(let t=-1.25;t<=1.25;t+=.02){const al=t*WY*.62,pe=off+Math.sin(t*4.2+ph)*am+(fbm(t*2.2+4,ph,3)-.5)*150;river.push([cx-st*pe+ct*al,cy+ct*pe+st*al])}}
  const LG=new Float32Array(GW*GH),EG=new Float32Array(GW*GH),RG=new Float32Array(GW*GH).fill(1e4);
  for(let j=0;j<GH;j++)for(let i=0;i<GW;i++){const x=i*GS,y=j*GS,k=j*GW+i;LG[k]=landF(x,y);if(river){let d=1e9;for(let q=0;q<river.length-1;q+=2){const dd=segD(x,y,river[q],river[Math.min(river.length-1,q+2)]);if(dd<d)d=dd}RG[k]=d}}
  const sg=(g,x,y)=>{const gx=clamp(x/GS,0,GW-1.001),gy=clamp(y/GS,0,GH-1.001),xi=gx|0,yi=gy|0,fx=gx-xi,fy=gy-yi,k=yi*GW+xi;return lerp(lerp(g[k],g[k+1],fx),lerp(g[k+GW],g[k+GW+1],fx),fy)};
  const hill=[cx-ct*Rc*.5+(rng()-.5)*Rc*.5,cy-st*Rc*.5+(rng()-.5)*Rc*.4];
  for(let j=0;j<GH;j++)for(let i=0;i<GW;i++){const x=i*GS,y=j*GS,k=j*GW+i;let e=Math.max(0,fbm(x/430+2,y/430+6,4)-.36)*1.5+.36*Math.exp(-((x-hill[0])**2+(y-hill[1])**2)/(Rc*Rc*.3));
    e*=P.relief*1.5*sstep(0,1.5,LG[k])*(river?sstep(rw,rw+110,RG[k]):1);EG[k]=clamp(e,0,1)}
  const land=(x,y)=>sg(LG,x,y),elev=(x,y)=>sg(EG,x,y),rd=(x,y)=>sg(RG,x,y),wet=(x,y,m)=>land(x,y)<.05+(m||0)/100||rd(x,y)<rw+2+(m||0);
  // ---- bairros: Voronoi sobre uma espiral de pontos
  const sites=[],sa=rng()*6.28;for(let i=0;i<nP*9;i++){const a=sa+Math.sqrt(i)*5,r=i===0?0:(10+i*(2+rng()))*SP,x=cx+Math.cos(a)*r,y=cy+Math.sin(a)*r*.96;if(x<-260||y<-260||x>WX+260||y>WY+260)continue;sites.push([x,y])}
  const patches=sites.map((s,i)=>{let poly=[[-300,-300],[WX+300,-300],[WX+300,WY+300],[-300,WY+300]],T=[-1,-1,-1,-1];
    const ord=sites.map((q,j)=>[j,(q[0]-s[0])**2+(q[1]-s[1])**2]).sort((a,b)=>a[1]-b[1]);
    for(const [j,d2] of ord){if(j===i)continue;let mr=0;for(const v of poly)mr=Math.max(mr,(v[0]-s[0])**2+(v[1]-s[1])**2);if(d2>mr*4)break;const q=sites[j],l=Math.sqrt(d2);[poly,T]=clip(poly,(s[0]+q[0])/2,(s[1]+q[1])/2,(q[0]-s[0])/l,(q[1]-s[1])/l,T,j)}
    return {i,s,poly,nb:T,c:cen(poly),area:area(poly)}});
  const wetFrac=p=>{let w=0,n=0;for(const v of p.poly.concat([p.c,p.s,[(p.c[0]+p.s[0])/2,(p.c[1]+p.s[1])/2]])){n++;if(land(v[0],v[1])<.04)w++}return w/n};
  for(const p of patches){const wf=wetFrac(p);p.sea=land(p.c[0],p.c[1])<.08&&wf>=.4||wf>=.72;p.riv=river&&(p.poly.some(v=>rd(v[0],v[1])<rw+8)||rd(p.c[0],p.c[1])<rw+30);p.e=elev(p.c[0],p.c[1]);p.dn=Math.hypot(p.c[0]-cx,p.c[1]-cy)/Rc;p.type=p.sea?"agua":"mato"}
  const nbs=p=>p.nb.filter(j=>j>=0).map(j=>patches[j]);
  for(const p of patches)if(!p.sea&&nbs(p).some(q=>q.sea))p.shore=true;
  // bairros de dentro: compactos, em terra e longe da moldura
  const cand=patches.filter(p=>!p.sea&&p.c[0]>70&&p.c[0]<WX-70&&p.c[1]>110&&p.c[1]<WY-170);const med=cand.slice(0,nP).map(p=>p.area).sort((a,b)=>a-b)[Math.min(nP,cand.length)>>1]||1e9;
  const inner=[];for(const p of cand){if(inner.length>=nP)break;if(p.area>med*2.4||p.poly.some(v=>v[0]<20||v[0]>WX-20||v[1]<40||v[1]>WY-100))continue;if(inner.length&&!nbs(p).some(q=>q.inner)&&!blobs)continue;p.inner=true;inner.push(p)}
  for(const k in P.wards||{}){const p=patches[+k],o=P.wards[k];if(!p||p.sea||o.inside==null)continue;if(o.inside&&!p.inner){p.inner=true;inner.push(p)}else if(!o.inside&&p.inner&&p!==inner[0]){p.inner=false;inner.splice(inner.indexOf(p),1)}}
  // grafo de vertices e arestas
  const nodes=[],nh=new Map(),nodeAt=(x,y)=>{const gx=Math.round(x/3),gy=Math.round(y/3);for(let a=-1;a<=1;a++)for(let b=-1;b<=1;b++){const l=nh.get((gx+a)+"_"+(gy+b));if(l)for(const id of l)if(Math.hypot(nodes[id].x-x,nodes[id].y-y)<2.5)return id}const id=nodes.length;nodes.push({x,y,adj:[]});const k=gx+"_"+gy;nh.has(k)?nh.get(k).push(id):nh.set(k,[id]);return id};
  const edges=new Map(),ekey=(a,b)=>a<b?a+"_"+b:b+"_"+a;for(const p of patches){p.nd=p.poly.map(v=>nodeAt(v[0],v[1]));p.nd.forEach((a,k)=>{const b=p.nd[(k+1)%p.nd.length];if(a===b)return;let e=edges.get(ekey(a,b));if(!e){e={a,b,ps:[],len:Math.hypot(nodes[a].x-nodes[b].x,nodes[a].y-nodes[b].y)};edges.set(ekey(a,b),e);nodes[a].adj.push([b,e]);nodes[b].adj.push([a,e])}e.ps.push(p)})}
  const edgeOf=(p,k)=>edges.get(ekey(p.nd[k],p.nd[(k+1)%p.nd.length]));
  if(P.nodes&&Object.keys(P.nodes).length){for(const k in P.nodes){const n=nodes[+k];if(n){n.x=P.nodes[k][0];n.y=P.nodes[k][1]}}for(const p of patches){p.poly=p.nd.map(id=>[nodes[id].x,nodes[id].y]);p.c=cen(p.poly);p.area=area(p.poly)}for(const e of edges.values())e.len=Math.hypot(nodes[e.a].x-nodes[e.b].x,nodes[e.a].y-nodes[e.b].y)}
  for(const e of edges.values()){const a=nodes[e.a],b=nodes[e.b];e.in=e.ps.filter(p=>p.inner).length;let w=0,r=0;for(let q=0;q<=6;q++){const x=lerp(a.x,b.x,q/6),y=lerp(a.y,b.y,q/6);if(land(x,y)<.03)w++;else if(rd(x,y)<rw+1)r++}e.sea=w>=3||e.ps.some(p=>p.sea)&&w>0;e.riv=r>0}
  // pontes entre partes da cidade separadas por agua (ilhas, margens)
  const comp=new Map();{let ci=0;for(const p of inner){if(comp.has(p))continue;const stack=[p];comp.set(p,ci);while(stack.length){const q=stack.pop();q.nd.forEach((_,k)=>{const e=edgeOf(q,k);if(!e||e.sea)return;for(const z of e.ps)if(z.inner&&!comp.has(z)){comp.set(z,ci);stack.push(z)}})}ci++}}
  const plaza=inner[0],bridgesW=[];{const groups={};for(const p of inner){const g=comp.get(p);(groups[g]=groups[g]||[]).push(p)}const main=comp.get(plaza),linked=new Set([main]);
    let changed=true;while(changed){changed=false;let best=null;for(const g in groups){if(linked.has(+g))continue;for(const p of groups[g])for(const a of p.nd){const na=nodes[a];if(land(na.x,na.y)<.02)continue;for(const lg of linked)for(const q of groups[lg])for(const b of q.nd){const nb=nodes[b];if(land(nb.x,nb.y)<.02)continue;const d=Math.hypot(na.x-nb.x,na.y-nb.y);if(d<20)continue;if(!best||d<best.d)best={d,a,b,g:+g}}}}
      if(best&&best.d<Rc*1.1){const e={a:best.a,b:best.b,ps:[],len:best.d,in:2,bridge:true};nodes[best.a].adj.push([best.b,e]);nodes[best.b].adj.push([best.a,e]);bridgesW.push(e);linked.add(best.g);changed=true}}
    for(const p of inner.slice())if(!linked.has(comp.get(p))){p.inner=false;inner.splice(inner.indexOf(p),1)}
    for(const e of edges.values())e.in=e.ps.filter(p=>p.inner).length}
  // castelo
  const isEdge=p=>p.poly.some((_,k)=>{const j=p.nb[k];return j<0||!patches[j].inner});
  let castle=null;if(P.citadel&&nP>=6){let bs=-1e9;for(const p of inner){if(p===plaza||nbs(p).includes(plaza)&&inner.length>8)continue;const s=p.e*3-Math.abs(p.dn-.8)*1.2-(p.riv?.6:0)+(isEdge(p)?1:0)-(p.shore?.4:0)+rng()*.2;if(s>bs){bs=s;castle=p}}if(castle)castle.type="castelo"}
  plaza.type="mercado";
  // ---- muralha: anel(es) pela borda dos bairros de dentro
  const bE=[...edges.values()].filter(e=>e.in===1&&!e.bridge);const bAdj=new Map();for(const e of bE){for(const [u,v] of [[e.a,e.b],[e.b,e.a]]){if(!bAdj.has(u))bAdj.set(u,[]);bAdj.get(u).push([v,e])}}
  const loops=[];{const used=new Set();for(const e0 of bE){if(used.has(e0))continue;const chain=[e0.a,e0.b];used.add(e0);let cur=e0.b,guard=0,closed=false;while(guard++<2000){const nx=(bAdj.get(cur)||[]).find(([v,e])=>!used.has(e));if(!nx)break;used.add(nx[1]);cur=nx[0];if(cur===chain[0]){closed=true;break}chain.push(cur)}loops.push({ids:chain,closed})}}
  const walls=[];const gatesN=[];
  if(WALLON){for(const lp of loops){const ids=lp.ids,n=ids.length,segOk=i=>{const e=edges.get(ekey(ids[i],ids[(i+1)%n]));return e&&!e.sea};const m=lp.closed?n:n-1;
      if(lp.closed&&[...Array(m).keys()].every(segOk)){walls.push({ids:ids.slice(),closed:true});continue}
      let s0=0;if(lp.closed){for(let i=0;i<m;i++)if(!segOk(i)){s0=(i+1)%n;break}}let run=[];for(let k=0;k<m;k++){const i=(s0+k)%n;if(!segOk(i)){if(run.length>1)walls.push({ids:run,closed:false});run=[];continue}if(!run.length)run.push(ids[i]);run.push(ids[(i+1)%n])}if(run.length>1)walls.push({ids:run,closed:false})}}
  // portoes: vertices da muralha com terra seca dos dois lados
  const onWall=new Set();for(const w of walls)for(const id of w.ids)onWall.add(id);
  {const cnd=[...(WALLON?onWall:new Set(bE.filter(e=>!e.sea).flatMap(e=>[e.a,e.b])))].filter(id=>{const n=nodes[id],dx=n.x-cx,dy=n.y-cy,d=Math.hypot(dx,dy)||1;return !wet(n.x,n.y,10)&&!wet(n.x+dx/d*40,n.y+dy/d*40,6)&&!(castle&&castle.nd.includes(id))&&n.adj.some(([v,e])=>e.in===2)});
    const want=clamp(2+Math.round(nP/9),2,6);while(gatesN.length<want&&cnd.length){let best=-1,bs=-1;for(const id of cnd){const n=nodes[id];let m=1e9;for(const g of gatesN)m=Math.min(m,Math.hypot(nodes[g].x-n.x,nodes[g].y-n.y));const s=gatesN.length?m:rng();if(s>bs){bs=s;best=id}}if(gatesN.length&&bs<Rc*.5)break;gatesN.push(best);cnd.splice(cnd.indexOf(best),1)}}
  if(P.gates){for(const id of P.gates.del||[]){const i=gatesN.indexOf(id);if(i>=0)gatesN.splice(i,1)}for(const id of P.gates.add||[])if(nodes[id]&&!gatesN.includes(id))gatesN.push(id)}
  // ruas principais: caminho mais curto pelas divisas dos bairros
  const mainE=new Set();const route=(src,dstSet)=>{const dist=new Map([[src,0]]),prev=new Map(),open=[src],done=new Set();let end=-1;
    while(open.length){let bi=0;for(let q=1;q<open.length;q++)if(dist.get(open[q])<dist.get(open[bi]))bi=q;const u=open.splice(bi,1)[0];if(done.has(u))continue;done.add(u);if(dstSet.has(u)){end=u;break}
      for(const [v,e] of nodes[u].adj){if(!e.in||e.sea&&!e.bridge||(e.in===1&&WALLON&&!e.bridge))continue;const c=e.len*(1+(e.riv?1.4:0)+Math.abs(elev(nodes[u].x,nodes[u].y)-elev(nodes[v].x,nodes[v].y))*KE/Math.max(1,e.len)*4)*(mainE.has(e)?.55:1)*(e.bridge?1.3:1),nd=dist.get(u)+c;if(nd<(dist.has(v)?dist.get(v):1e18)){dist.set(v,nd);prev.set(v,[u,e]);open.push(v)}}}
    for(let u=end;u>=0&&prev.has(u);){const [pu,e]=prev.get(u);mainE.add(e);u=pu}return end>=0};
  const pn=new Set(plaza.nd);for(const g of gatesN)route(g,pn);if(castle)route(castle.nd[0],pn);for(const e of bridgesW){route(e.a,pn);mainE.add(e)}
  // estradas fora dos portoes
  const roads=[];for(const g of gatesN){const n=nodes[g],a0=Math.atan2(n.y-cy,n.x-cx);let a=a0,x=n.x,y=n.y;const pts=[[x,y]];let d0=Math.hypot(x-cx,y-cy);
    for(let s=0;s<140;s++){const want=a0+(fbm(x/260+g*.37,y/260,2)-.5)*1.1;a+=clamp(want-a,-.12,.12);let ok=false;for(const da of[0,.25,-.25,.5,-.5,.8,-.8]){const b=a+da;if(Math.abs(((b-a0+9.42)%6.283)-3.1416)<1.6)continue;const nx=x+Math.cos(b)*13,ny=y+Math.sin(b)*13,d=Math.hypot(nx-cx,ny-cy);if(d<d0-2||wet(nx,ny,8))continue;x=nx;y=ny;d0=d;a=a+da*.5;ok=true;break}
      if(!ok)break;pts.push([x,y]);if(x<-20||y<-20||x>WX+20||y>WY+20)break}
    if(pts.length>3&&!roads.some(r=>r.length>4&&polyD(pts[pts.length-1][0],pts[pts.length-1][1],r,false)<20&&pts.length<8))roads.push(pts)}
  // ---- funcao de cada bairro
  {let best=null;for(const q of nbs(plaza))if(q.inner&&q.type==="mato"&&(!best||q.area>best.area))best=q;if(best&&nP>=7)best.type="templo";
    const sh=inner.filter(p=>p.type==="mato"&&(p.shore||P.site==="rio"&&p.riv)).sort((a,b)=>a.dn-b.dn);for(let q=0;q<Math.min(sh.length,Math.max(1,Math.round(nP/7)));q++)sh[q].type="porto";
    const rest=inner.filter(p=>p.type==="mato").sort((a,b)=>a.dn-b.dn+(rng()-.5)*.16),n=rest.length,w=P.wealth,q=f=>Math.round(n*f);
    const seq=[].concat(Array(q(.1+w*.12)).fill("mercadores"),Array(q(.04+w*.14)).fill("nobre"),Array(q(.2)).fill("artesaos"),Array(Math.max(0,n-q(.1+w*.12)-q(.04+w*.14)-q(.2)-q(.1)-q(.26-w*.2))).fill("moradia"),Array(q(.1)).fill("producao"),Array(q(.26-w*.2)).fill("pobre"));
    rest.forEach((p,i)=>p.type=seq[i]||"moradia");
    for(const p of rest){if(p.type==="nobre"&&castle&&!nbs(p).includes(castle)){const alt=rest.find(z=>z.type!=="nobre"&&z.type!=="mercadores"&&nbs(z).includes(castle)&&!z.shore);if(alt){const t=alt.type;alt.type="nobre";p.type=t}}}
    for(const p of rest){if(p.type==="producao"&&!p.riv){const alt=rest.find(z=>(z.type==="moradia"||z.type==="pobre")&&z.riv&&z.dn>.4);if(alt){const t=alt.type;alt.type="producao";p.type=t}}}
    if(nP>=12){const m=rest.find(p=>(p.type==="moradia"||p.type==="artesaos")&&(castle?nbs(p).includes(castle):gatesN.some(g=>p.nd.includes(g))));if(m)m.type="militar"}
    if(nP>=20){const m=rest.filter(p=>p.type==="moradia"||p.type==="mercadores");if(m.length)m[(m.length/2)|0].type="universidade"}
    if(nP>=14&&P.green>.15){const m=rest.filter(p=>p.type==="moradia"&&p.dn>.3&&p.dn<.75);if(m.length)pick(m).type="parque"}
    const fr=P.foreign==="nao"?null:P.foreign==="auto"?(nP>=14&&rng()<.75?pick(A.RACES.filter(r=>r!==P.culture&&r!=="halfling"&&r!=="pantano")):null):P.foreign;
    if(fr&&fr!==P.culture){const m=rest.filter(p=>(p.type==="moradia"||p.type==="artesaos"||p.type==="mercadores")&&p.dn>.35);if(m.length){const p=pick(m);p.race=fr;p.foreign=true}}
    for(const p of patches){if(p.inner||p.sea)continue;const nearCity=nbs(p).some(z=>z.inner),onRoad=roads.some(r=>r.some((v,i)=>i>0&&i<22&&inPoly(p.poly,v[0],v[1])));
      if((nearCity&&(onRoad||rng()<P.suburbs*.55)||onRoad&&rng()<P.suburbs*.5)&&rng()<P.suburbs*1.6&&p.area<med*3)p.type="arrabalde";else if((nearCity||nbs(p).some(z=>nbs(z).some(y=>y.inner)))&&p.e<.35&&rng()<.78)p.type="campos";else p.type="mato"}}
  // ajustes manuais por bairro (editor)
  for(const k in P.wards||{}){const p=patches[+k],o=P.wards[k];if(!p||p.sea)continue;if(o.type)p.type=o.type;if(o.race){p.race=o.race;p.foreign=o.race!==P.culture}if(o.plan)p.planOv=o.plan}
  // ---- portos: cais reto seguindo a costa, com aterro
  const quays=[];for(const p of patches){if(p.type!=="porto")continue;const shore=[];let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9;for(const v of p.poly){x0=Math.min(x0,v[0]);x1=Math.max(x1,v[0]);y0=Math.min(y0,v[1]);y1=Math.max(y1,v[1])}
    for(let y=y0;y<y1;y+=5)for(let x=x0;x<x1;x+=5){if(!inPoly(p.poly,x,y))continue;const l=land(x,y),r=rd(x,y)-rw;if(Math.abs(l)<.06&&!(river&&r<26)||river&&Math.abs(r)<4&&l>.3)shore.push([x,y])}
    if(shore.length<4)continue;let mx=0,my=0;for(const q of shore){mx+=q[0];my+=q[1]}mx/=shore.length;my/=shore.length;let sxx=0,sxy=0,syy=0;for(const q of shore){const dx=q[0]-mx,dy=q[1]-my;sxx+=dx*dx;sxy+=dx*dy;syy+=dy*dy}
    const ang=.5*Math.atan2(2*sxy,sxx-syy),ux=Math.cos(ang),uy=Math.sin(ang);let nx=-uy,ny=ux;const tw=wet(mx+nx*25,my+ny*25);if(!tw){nx=-nx;ny=-ny}
    let t0=1e9,t1=-1e9;for(const q of shore){const t=(q[0]-mx)*ux+(q[1]-my)*uy;t0=Math.min(t0,t);t1=Math.max(t1,t)}if(t1-t0<30)continue;
    const off=river&&!(land(mx+nx*20,my+ny*20)<.05)?0:4,a=[mx+ux*t0+nx*off,my+uy*t0+ny*off],b=[mx+ux*t1+nx*off,my+uy*t1+ny*off];
    const isSea=land(mx+nx*30,my+ny*30)<.05;if(isSea){for(let j=0;j<GH;j++)for(let i=0;i<GW;i++){const x=i*GS,y=j*GS,t=(x-mx)*ux+(y-my)*uy;if(t<t0-6||t>t1+6)continue;const d=(x-mx)*nx+(y-my)*ny-off,k=j*GW+i;if(d<0&&d>-60)LG[k]=Math.max(LG[k],.06+(-d)/200);else if(d>=0&&d<60)LG[k]=Math.min(LG[k],-.06-d/220)}}
    {const L=Math.hypot(b[0]-a[0],b[1]-a[1]),dry=[];let run=null;for(let t=0;t<=L;t+=3){const x=a[0]+ux*t,y=a[1]+uy*t,ok=!river||rd(x,y)>rw+(isSea?18:3);if(ok){if(!run)run=[t,t];run[1]=t}else if(run){dry.push(run);run=null}}if(run)dry.push(run);let best=null;for(const r of dry)if(!best||r[1]-r[0]>best[1]-best[0])best=r;if(!best||best[1]-best[0]<30)continue;
      const a2=[a[0]+ux*best[0],a[1]+uy*best[0]],b2=[a[0]+ux*best[1],a[1]+uy*best[1]];a[0]=a2[0];a[1]=a2[1];b[0]=b2[0];b[1]=b2[1]}
    quays.push({a,b,n:[nx,ny],u:[ux,uy],p,sea:isSea});p.quay=quays[quays.length-1]}
  // ---- lotes
  const ALLEY=(CUL[P.culture]||{}).form==="asian"||(CUL[P.culture]||{}).form==="round"?2.6:2.1;
  const cut=(p,minSq,gc,sc,ep,split,out,dep)=>{let bi=0,bl=-1;for(let k=0;k<p.length;k++){const a=p[k],b=p[(k+1)%p.length],l=Math.hypot(b[0]-a[0],b[1]-a[1]);if(l>bl){bl=l;bi=k}}
    const a=p[bi],b=p[(bi+1)%p.length],spread=.8*gc,ratio=(1-spread)/2+rng()*spread,sq0=area(p),ang=Math.PI/6*gc*(sq0<minSq*4?0:1)*(rng()-.5);
    const ex=(b[0]-a[0])/bl,ey=(b[1]-a[1])/bl,ca=Math.cos(ang),sn=Math.sin(ang),nx=ex*ca-ey*sn,ny=ex*sn+ey*ca,mx=lerp(a[0],b[0],ratio),my=lerp(a[1],b[1],ratio),g=split?ALLEY:.4;
    for(const h of [clip(p,mx-nx*g,my-ny*g,nx,ny),clip(p,mx+nx*g,my+ny*g,-nx,-ny)]){if(h.length<3)continue;const sq=area(h);if(sq<26)continue;
      if(sq<minSq*Math.pow(2,4*sc*(rng()-.5))||dep>12){if(rng()>=ep)out.push(h)}else cut(h,minSq,gc,sc,ep,sq>minSq/(rng()*rng()),out,dep+1)}};
  // quarteirao planejado: ruas paralelas e transversais
  const grid=(blk,ang,sp1,sp2,gap)=>{const ca=Math.cos(ang),sn=Math.sin(ang),c=cen(blk);let u0=1e9,u1=-1e9,v0=1e9,v1=-1e9;for(const q of blk){const u=(q[0]-c[0])*ca+(q[1]-c[1])*sn,v=-(q[0]-c[0])*sn+(q[1]-c[1])*ca;u0=Math.min(u0,u);u1=Math.max(u1,u);v0=Math.min(v0,v);v1=Math.max(v1,v)}
    const cells=[];const nu=Math.max(1,Math.round((u1-u0)/sp1)),nv=Math.max(1,Math.round((v1-v0)/sp2)),du=(u1-u0)/nu,dv=(v1-v0)/nv;
    for(let i=0;i<nu;i++)for(let j=0;j<nv;j++){let cl=blk;const U0=u0+i*du+(i?gap/2:0),U1=u0+(i+1)*du-(i<nu-1?gap/2:0),V0=v0+j*dv+(j?gap/2:0),V1=v0+(j+1)*dv-(j<nv-1?gap/2:0);
      cl=clip(cl,c[0]+ca*U1,c[1]+sn*U1,ca,sn);if(cl.length<3)continue;cl=clip(cl,c[0]+ca*U0,c[1]+sn*U0,-ca,-sn);if(cl.length<3)continue;cl=clip(cl,c[0]-sn*V1,c[1]+ca*V1,-sn,ca);if(cl.length<3)continue;cl=clip(cl,c[0]-sn*V0,c[1]+ca*V0,sn,-ca);if(cl.length<3||area(cl)<60)continue;cells.push(cl)}return cells};
  const plannedOf=p=>p.planOv?p.planOv==="planejado":(p.type==="pobre"||p.type==="arrabalde")?false:P.plan==="planejado"?true:P.plan==="organico"?false:(p.type==="nobre"||p.type==="militar"||p.type==="universidade"||p.type==="mercadores"&&rng()<.55||p.type==="porto"&&rng()<.5||rng()<.25);
  const WP={mercadores:[330,.4,.45,.01],nobre:[900,.3,.4,.02],artesaos:[270,.5,.55,.02],moradia:[250,.55,.6,.03],pobre:[170,.6,.6,.04],producao:[420,.4,.5,.04],porto:[420,.3,.45,.03],militar:[520,0,.2,.05],templo:[300,.4,.5,.03],castelo:[480,.3,.4,.1],arrabalde:[230,.6,.6,.08],universidade:[420,.2,.3,.03],estrangeiro:[260,.5,.6,.03]};
  const B=[],yards=[],fields=[],trees=[],squares=[],SPB=[],props=[];
  const C0=CUL[P.culture]||CUL.humano,tier=(race,wl)=>{const C=CUL[race]||C0;if(race!=="humano")return {roof:[pick(C.roof),pick(C.roof)],wall:[pick(C.wall),pick(C.wall)]};
    return wl>.7?{roof:[pick(["slate","dark","tileb"]),"slate"],wall:[pick(["stone","brick","daub2"]),"stone"]}:wl>.35?{roof:[pick(["tile","tile2","tileb"]),pick(["tile","dark"])],wall:[pick(["daub","daub2","daub3"]),"daub"]}:{roof:[pick(["thatch","old","moss"]),"thatch"],wall:[pick(["daub","daub3","wood"]),"wood"]}};
  const WL={nobre:.95,mercadores:.8,templo:.7,castelo:.9,artesaos:.5,moradia:.45,porto:.45,militar:.55,producao:.4,pobre:.1,arrabalde:.15,estrangeiro:.5,universidade:.75,mercado:.7};
  const TY={mercadores:["town","row","row","rich","tavern","town"],nobre:["rich","manor","rich","rich"],artesaos:["town","row","town","smithy","town"],moradia:["town","row","town","town","hut"],pobre:["hut","hut","shed","hut","row"],producao:["smithy","barn","town","shed"],porto:["barn","town","row","barn","row"],militar:["barn","town"],templo:["town","rich","row"],castelo:["rich","barn"],arrabalde:["hut","farm","shed","hut","town"],estrangeiro:["town","row","town","rich"],universidade:["rich","town","row"],mercado:["town","row","tavern","rich"]};
  const wallPts=[];// pontos da muralha para afastar casas
  for(const w of walls){const pts=w.ids.map(id=>[nodes[id].x,nodes[id].y]);w.pts=P.wall==="curva"?chaikin(pts,w.closed,3):pts;for(const q of resampleP(w.pts,6,w.closed))wallPts.push(q)}
  const WGR=new Map();for(const q of wallPts){const k=((q[0]/30)|0)+"_"+((q[1]/30)|0);WGR.has(k)?WGR.get(k).push(q):WGR.set(k,[q])}
  const nearWall=(x,y,r)=>{const gx=(x/30)|0,gy=(y/30)|0;for(let a=-1;a<=1;a++)for(let b=-1;b<=1;b++){const l=WGR.get((gx+a)+"_"+(gy+b));if(l)for(const q of l)if(Math.hypot(q[0]-x,q[1]-y)<r)return true}return false};
  const nearQuay=(x,y)=>{let d=1e9,qq=null;for(const q of quays){const v=segD(x,y,q.a,q.b);if(v<d){d=v;qq=q}}return [d,qq]};
  const pLots=new Map();
  for(const p of patches){if(p.sea)continue;const t=p.type,race=p.race||P.culture;p.race=race;
    const ins=p.poly.map((_,k)=>{const e=edgeOf(p,k);return !e?5.5:(e.in===1&&WALLON&&P.wall!=="curva")?12:mainE.has(e)?9:p.inner?5.6:6.5});
    p.block=inset(p.poly,ins);if(p.block.length<3)continue;if(p.quay){const q=p.quay,nb=clip(p.block,q.a[0]-q.n[0]*9,q.a[1]-q.n[1]*9,q.n[0],q.n[1]);if(nb.length>2&&area(nb)>area(p.block)*.35)p.block=nb;else{quays.splice(quays.indexOf(q),1);p.quay=null}}
    p.pl=plannedOf(p);p.pal=tier(race,(WL[p.foreign?"estrangeiro":t]||.4)*(.6+P.wealth*.8));
    if(t==="mercado"){const Rp=clamp(24+nP*2.3,32,104),n=9,a0=rng()*6.28,sq=[];for(let k=0;k<n;k++){const a=a0+k/n*6.2832,r=Rp*(.86+rng()*.22);sq.push([p.c[0]+Math.cos(a)*r,p.c[1]+Math.sin(a)*r*.9])}const sqc=sq.filter(v=>!wet(v[0],v[1],4));p.square=sqc.length>4?sqc:inset(p.poly,4);squares.push({poly:p.square,kind:"praca"});pLots.set(p,[]);continue}
    if(t==="parque"){yards.push({poly:p.block,col:"#9fb060",park:1});for(let q=0;q<p.area/260;q++){const x=p.c[0]+(rng()-.5)*220,y=p.c[1]+(rng()-.5)*220;if(inPoly(inset(p.block,8),x,y)&&!wet(x,y,6))trees.push([x,y,1+rng()*.3])}pLots.set(p,[]);continue}
    if(t==="campos"){const out=[];cut(p.block,2400+rng()*2600,.25,.6,.1,false,out,0);for(const f of out){const c=cen(f);if(wet(c[0],c[1],6)||f.some(v=>wet(v[0],v[1])))continue;fields.push({poly:inset(f,1.5),c,ang:Math.atan2(f[1][1]-f[0][1],f[1][0]-f[0][0]),col:pick(["#c9b86a","#b9b060","#d4c57e","#a8b05a","#bfa85c","#9fae58","#cdb372"]),k:rng()});
        if(rng()<.18){const ang=rng()*3.14;B.push({x:c[0],y:c[1],type:"farm",race,ang,L:19,D:12,pal:tier(race,.2)});if(rng()<.7)props.push({id:"haystack",x:c[0]+18,y:c[1]+8,race});if(rng()<.3)props.push({id:"cart",x:c[0]-14,y:c[1]+10,race,ang:rng()*6})}}continue}
    if(t==="mato"){const n=p.area/(260-P.green*120),den=fbm(p.c[0]/300+9,p.c[1]/300,2);for(let q=0;q<n;q++){const x=p.c[0]+(rng()-.5)*Math.sqrt(p.area)*2.2,y=p.c[1]+(rng()-.5)*Math.sqrt(p.area)*2.2;if(!inPoly(p.poly,x,y)||wet(x,y,7)||fbm(x/130,y/130,3)<.62-den*.3-P.green*.12)continue;trees.push([x,y,.95+rng()*.4,1])}
      if(!p.inner&&rng()<.22&&p.e<.4){const x=p.c[0],y=p.c[1];if(!wet(x,y,8)){B.push({x,y,type:pick(["hut","farm"]),race,ang:rng()*3.14,L:16,D:11,pal:tier(race,.2)});props.push({id:rng()<.5?"haystack":"well",x:x+16,y:y+9,race})}}continue}
    const wp=WP[p.foreign?"estrangeiro":t]||WP.moradia;let out=[];let blocks=[p.block];
    if(p.pl&&t!=="castelo"&&t!=="templo"){let bi=0,bl=-1;for(let k=0;k<p.block.length;k++){const a=p.block[k],b=p.block[(k+1)%p.block.length],l=Math.hypot(b[0]-a[0],b[1]-a[1]);if(l>bl){bl=l;bi=k}}const a=p.block[bi],b=p.block[(bi+1)%p.block.length],ang=Math.atan2(b[1]-a[1],b[0]-a[0]);
      blocks=grid(p.block,ang,t==="nobre"?78:58,t==="nobre"?60:34,5.5);for(const bk of blocks)cut(bk,wp[0],.02,.25,wp[3],false,out,0)}
    else cut(p.block,wp[0],wp[1],wp[2],wp[3],true,out,0);
    if(t==="arrabalde"){out=out.filter(l=>{const cc=cen(l);const dR=Math.min(...roads.map(r=>polyD(cc[0],cc[1],r,false)).concat([1e9])),dW=nearWall(cc[0],cc[1],70);return dR<44||dW&&rng()<.7||rng()<.08})}
    p.blocks=blocks;pLots.set(p,out)}
  if(plaza.square){const big=plaza.square;for(const [p,lots] of pLots){if(p===plaza)continue;pLots.set(p,lots.filter(l=>{const cc=cen(l);return !inPoly(big,cc[0],cc[1])&&!l.some(v=>inPoly(big,v[0],v[1]))}))}}
  // ocupacao para nao sobrepor
  const occGrid=new Map(),addOcc=(x,y,r)=>{const k=((x/24)|0)+"_"+((y/24)|0);const o={x,y,r};occGrid.has(k)?occGrid.get(k).push(o):occGrid.set(k,[o])};
  const hit=(x,y,r)=>{const gx=(x/24)|0,gy=(y/24)|0,R=Math.ceil((r+60)/24);for(let a=-R;a<=R;a++)for(let b=-R;b<=R;b++){const l=occGrid.get((gx+a)+"_"+(gy+b));if(l)for(const o of l)if(Math.hypot(o.x-x,o.y-y)<o.r+r)return true}return false};
  // especiais primeiro: templo, castelo, prefeitura, e os de cada bairro
  for(const p of inner){if(p.type==="templo"){const big=nP>18;SPB.push({k:2,x:p.c[0],y:p.c[1],race:p.race,v:rng(),big,r:big?52:40});addOcc(p.c[0],p.c[1],big?52:40);squares.push({poly:inset(p.block,3),kind:"adro"})}
    if(p.type==="castelo"){SPB.push({k:3,x:p.c[0],y:p.c[1]+8,race:p.race,v:rng(),r:62});addOcc(p.c[0],p.c[1],60);p.cwall=chaikin(inset(p.poly,7),true,P.wall==="curva"?3:0);squares.push({poly:inset(p.poly,7),kind:"patio"})}}
  if(plaza.square){const sq=plaza.square,c=plaza.c;let bx=null,bd=-1e9;for(const v of sq){const d=-v[1];if(d>bd){bd=d;bx=v}}const hx=lerp(c[0],bx[0],.6),hy=lerp(c[1],bx[1],.6);SPB.push({id:"townhall",x:hx,y:hy,race:P.culture,v:.5,r:22});addOcc(hx,hy,22)}
  const placeSpec=(p,id,lots)=>{if(["lighthouse","crane","shipwright","fishery"].includes(id)&&!(p.quay&&(p.quay.sea||id==="fishery")))return false;const sz=(AS.SIZE[id]||[12,16])[0]*Z*.82;let best=null,bs=-1e9;for(const l of lots){if(l.used)continue;const cc=cen(l),ar=area(l);if(hit(cc[0],cc[1],sz*.8))continue;
      const qd=p.quay?nearQuay(cc[0],cc[1])[0]:0;let s=ar/(sz*sz)-Math.abs(ar-sz*sz*2.6)/(sz*sz*3)+rng()*.3;if(["warehouse","fishery","shipwright","crane","lighthouse"].includes(id))s-=qd/14;if(id==="watermill")s-=Math.max(0,rd(cc[0],cc[1])-rw-14)/8;if(s>bs){bs=s;best=l}}
    if(!best)return false;const cc=cen(best);if(id==="watermill"&&rd(cc[0],cc[1])>rw+40)return false;{const m=id==="watermill"?.45:.85;for(let k=0;k<12;k++){const a=k/12*6.2832;if(wet(cc[0]+Math.cos(a)*sz*m,cc[1]+Math.sin(a)*sz*m,1)){best.used=true;return placeSpec(p,id,lots)}}if(wet(cc[0],cc[1],3)){best.used=true;return placeSpec(p,id,lots)}}
    let x=cc[0],y=cc[1],ang=0;if(p.quay&&id==="shipwright"){const q=p.quay;const L=Math.hypot(q.b[0]-q.a[0],q.b[1]-q.a[1]),t=clamp(((x-q.a[0])*q.u[0]+(y-q.a[1])*q.u[1])/L,.15,.85);x=lerp(q.a[0],q.b[0],t)-q.n[0]*12;y=lerp(q.a[1],q.b[1],t)-q.n[1]*12;ang=Math.atan2(q.n[1],q.n[0])}
    else if(p.quay&&["crane","lighthouse"].includes(id)){const q=p.quay,L=Math.hypot(q.b[0]-q.a[0],q.b[1]-q.a[1]),t=clamp(((x-q.a[0])*q.u[0]+(y-q.a[1])*q.u[1])/L,0,1),tt=id==="lighthouse"?(t<.5?0:1):t;x=lerp(q.a[0],q.b[0],tt)-q.n[0]*5;y=lerp(q.a[1],q.b[1],tt)-q.n[1]*5}
    for(const l of lots){const c2=cen(l);if(Math.hypot(c2[0]-x,c2[1]-y)<sz*1.05)l.used=true}best.used=true;SPB.push({id,x,y,race:p.race,v:rng(),r:sz,ang});addOcc(x,y,sz);return true};
  for(const p of inner.concat(patches.filter(z=>z.type==="arrabalde"))){const lots=pLots.get(p);if(!lots||!lots.length)continue;const t=p.foreign?"moradia":p.type,list=(SPEC[t]||[]).slice();
    for(const [id,home] of MAGIC)if(home===t&&rng()<P.magic*.9)list.push([id,1,1]);
    for(const [id,ch,n] of list)for(let q=0;q<n;q++)if(rng()<ch*(t==="arrabalde"?1:.5+P.wealth))placeSpec(p,id,lots)}
  // pontes do rio
  const bridgesR=[];if(river){const rdir=(x,y)=>{let bi=0,bd=1e9;for(let i=0;i<river.length-1;i++){const d=segD(x,y,river[i],river[i+1]);if(d<bd){bd=d;bi=i}}const a=river[bi],b=river[bi+1],l=Math.hypot(b[0]-a[0],b[1]-a[1])||1;return [(b[0]-a[0])/l,(b[1]-a[1])/l]};
    const cand=[...edges.values()].filter(e=>e.in>0&&!e.sea&&e.riv).map(e=>({e,main:mainE.has(e)})).sort((a,b)=>b.main-a.main);
    for(const {e,main} of cand){const a=[nodes[e.a].x,nodes[e.a].y],b=[nodes[e.b].x,nodes[e.b].y];let t0=-1,t1=-1;for(let q=0;q<=60;q++){const x=lerp(a[0],b[0],q/60),y=lerp(a[1],b[1],q/60);if(rd(x,y)<rw+1.5){if(t0<0)t0=q/60;t1=q/60}}if(t0<0)continue;
      const wl=(t1-t0)*e.len;if(wl>rw*3.2)continue;const mx=lerp(a[0],b[0],(t0+t1)/2),my=lerp(a[1],b[1],(t0+t1)/2),rv=rdir(mx,my),ex=(b[0]-a[0])/e.len,ey=(b[1]-a[1])/e.len,dot=Math.abs(ex*rv[0]+ey*rv[1]);
      if(dot>(main?.75:.5))continue;if(bridgesR.some(z=>Math.hypot(z.m[0]-mx,z.m[1]-my)<(main?40:75)))continue;if(!main&&bridgesR.length>=Math.max(2,nP/5))continue;
      // atravessa reto, de margem a margem, na direcao perpendicular ao rio puxada para a direcao da rua
      let nx=-rv[1],ny=rv[0];if(nx*ex+ny*ey<0){nx=-nx;ny=-ny}const dx=nx*.7+ex*.3,dy=ny*.7+ey*.3,dl=Math.hypot(dx,dy),ux=dx/dl,uy=dy/dl;let h0=0,h1=0;for(let d=0;d<rw*4;d+=1){if(rd(mx-ux*d,my-uy*d)>rw+2){h0=d;break}}for(let d=0;d<rw*4;d+=1){if(rd(mx+ux*d,my+uy*d)>rw+2){h1=d;break}}
      const A=[mx-ux*(h0+6),my-uy*(h0+6)],Bb=[mx+ux*(h1+6),my+uy*(h1+6)];bridgesR.push({a:A,b:Bb,m:[mx,my],stone:main||P.wealth>.6,wd:main?8.4:5.2});for(const q of [A,Bb])addOcc(q[0],q[1],main?13:10);addOcc(mx,my,rw+4)}}
  // casas
  const HG=new Map();
  for(const p of patches){const lots=pLots.get(p);if(!lots)continue;const t=p.type,race=p.race;
    for(const lot of lots){if(lot.used)continue;if(t==="castelo"&&rng()<.3)continue;const c=cen(lot),sq=area(lot);if(wet(c[0],c[1],4)||lot.some(v=>wet(v[0],v[1],0)))continue;if(nearWall(c[0],c[1],P.wall==="curva"?13:9))continue;if(p.cwall&&polyD(c[0],c[1],p.cwall,true)<10)continue;
      const innerLot=p.block.length>2&&lot.every(v=>polyD(v[0],v[1],p.block,true)>3);
      if(!innerLot&&sq>150&&sq<700&&(t==="moradia"||t==="artesaos"||t==="mercadores"||t==="pobre"||t==="porto"||t==="estrangeiro")&&rng()<.07&&!hit(c[0],c[1],30)){squares.push({poly:inset(lot,-.01),kind:"largo"});addOcc(c[0],c[1],26);props.push({id:rng()<.5?"well":rng()<.5?"bench":"statue",x:c[0],y:c[1],race});if(rng()<.6)trees.push([c[0]+4,c[1]-3,.6]);continue}
      if(innerLot&&rng()<(t==="pobre"||t==="arrabalde"||t==="mercado"?.12:t==="nobre"?.5:.3)){yards.push({poly:lot,col:t==="nobre"?"#a3b262":rng()<.3+P.green*.4?"#aab166":"#c7b98c",g:1});if(rng()<P.green*.55&&t!=="militar")trees.push([c[0],c[1],.62+rng()*.2]);continue}
      // a frente da casa olha para a rua mais proxima
      let fk=0,fd=1e9;for(let k=0;k<lot.length;k++){const a=lot[k],b=lot[(k+1)%lot.length],m=[(a[0]+b[0])/2,(a[1]+b[1])/2],d=polyD(m[0],m[1],p.block,true)-Math.hypot(b[0]-a[0],b[1]-a[1])*.02;if(d<fd){fd=d;fk=k}}
      const a=lot[fk],b=lot[(fk+1)%lot.length];let ang=Math.atan2(b[1]-a[1],b[0]-a[0]);const ca=Math.cos(ang),sa2=Math.sin(ang);let u0=1e9,u1=-1e9,v0=1e9,v1=-1e9;for(const v of lot){const u=(v[0]-c[0])*ca+(v[1]-c[1])*sa2,w=-(v[0]-c[0])*sa2+(v[1]-c[1])*ca;u0=Math.min(u0,u);u1=Math.max(u1,u);v0=Math.min(v0,w);v1=Math.max(v1,w)}
      const FM=(CUL[race]||{}).form,FF=FM==="asian"?.74:FM==="round"||FM==="yurt"?.84:.88;let L=(u1-u0)*FF,D=(v1-v0)*FF;if(t==="nobre"){L*=.75;D*=.72}if(t==="pobre"||t==="arrabalde"){ang+=(rng()-.5)*.16}
      L=Math.min(L,t==="porto"||t==="militar"||t==="producao"?46:t==="nobre"?40:30);D=Math.min(D,26);if(D>L*1.15&&t!=="porto"){const q=L;L=D;D=q;ang+=1.5708}
      const cc=[(u0+u1)/2,(v0+v1)/2],cx2=c[0]+ca*cc[0]-sa2*cc[1],cy2=c[1]+sa2*cc[0]+ca*cc[1];let fit=fitRect(lot,[cx2,cy2],ang,L,D);if(!fit||fit[0]*fit[1]<L*D*.45){let bi=0,bl=-1;for(let k=0;k<lot.length;k++){const l=Math.hypot(lot[(k+1)%lot.length][0]-lot[k][0],lot[(k+1)%lot.length][1]-lot[k][1]);if(l>bl){bl=l;bi=k}}const a2=Math.atan2(lot[(bi+1)%lot.length][1]-lot[bi][1],lot[(bi+1)%lot.length][0]-lot[bi][0]),f2=fitRect(lot,c,a2,(u1-u0)*FF,(v1-v0)*FF*.9);if(f2&&(!fit||f2[0]*f2[1]>fit[0]*fit[1])){fit=f2;ang=a2}}
      if(!fit||fit[0]<7||fit[1]<6){if(sq>70)yards.push({poly:inset(lot,.6),col:rng()<.5?"#a9ae62":"#b8b070",g:1,rows:1});continue}[L,D]=fit;
      const r=Math.hypot(L,D)/2*.8;if(hit(cx2,cy2,r*.45))continue;
      if(t==="nobre"){yards.push({poly:lot,col:"#a3b262",g:1});if(rng()<.5+P.green*.5)trees.push([cx2+(rng()-.5)*L*.9,cy2+D*.7,.6+rng()*.2])}
      const tt=p.foreign?"estrangeiro":t;let ty=pick(TY[tt]||TY.moradia);if(sq<200&&ty!=="shed")ty=t==="pobre"||t==="arrabalde"?"hut":"row";if(ty==="row"&&L>D*1.7)ty="town";
      {const wr=obb(cx2,cy2,ang,L+3,D+3);if(wr.some(q=>wet(q[0],q[1],1))||wr.some((q,i)=>{const r=wr[(i+1)%4];return wet((q[0]+r[0])/2,(q[1]+r[1])/2,1)}))continue}
      {let ok=false;for(let k=0;k<3&&!ok;k++){const R=obb(cx2,cy2,ang,L+1.2,D+1.2),gx=(cx2/40)|0,gy=(cy2/40)|0;ok=true;for(let a=-1;a<=1&&ok;a++)for(let b2=-1;b2<=1&&ok;b2++){const l=HG.get((gx+a)+"_"+(gy+b2));if(l)for(const o2 of l)if(sat(R,o2)){ok=false;break}}if(!ok){L*=.85;D*=.87}}if(!ok||L<7||D<6)continue;const k0=((cx2/40)|0)+"_"+((cy2/40)|0),R=obb(cx2,cy2,ang,L,D);HG.has(k0)?HG.get(k0).push(R):HG.set(k0,[R])}
      B.push({x:cx2,y:cy2,type:ty,race,ang,L,D,pal:p.pal,plain:t==="militar"});
      if(p.quay&&rng()<.18){const [d,q]=nearQuay(cx2,cy2);if(d<40){const x=cx2+q.n[0]*(d*.6),y=cy2+q.n[1]*(d*.6);if(!hit(x,y,5)){props.push({id:rng()<.6?"cargo":"crates",x,y,race});addOcc(x,y,6)}}}}}
  // praca do mercado: barracas em fileiras, fonte no centro, carrocas
  if(plaza.square){const sq=plaza.square,c=plaza.c,sqi=inset(sq,7);let bi=0,bl=-1;for(let k=0;k<sq.length;k++){const a=sq[k],b=sq[(k+1)%sq.length],l=Math.hypot(b[0]-a[0],b[1]-a[1]);if(l>bl){bl=l;bi=k}}const a0=Math.atan2(sq[(bi+1)%sq.length][1]-sq[bi][1],sq[(bi+1)%sq.length][0]-sq[bi][0]),ca=Math.cos(a0),sn=Math.sin(a0);
    SPB.push({id:rng()<P.magic*.6?"crystal":"fountain",x:c[0],y:c[1],race:P.culture,v:.5,r:14});addOcc(c[0],c[1],16);
    for(let u=-260;u<=260;u+=16)for(let v=-260;v<=260;v+=13){if(Math.abs(u)<22||Math.abs(v)<9)continue;const x=c[0]+ca*u-sn*v,y=c[1]+sn*u+ca*v;if(!inPoly(sqi,x,y)||hit(x,y,7))continue;if(rng()<.78){props.push({id:"stall",x,y,race:P.culture,v:rng(),ang:a0});addOcc(x,y,7)}else if(rng()<.5){props.push({id:rng()<.5?"cart":"crates",x,y,race:P.culture,ang:a0+rng()*.6,v:rng()});addOcc(x,y,7)}}}
  // porto: pieres perpendiculares ao cais, navios encostados
  const piers=[],ships=[],boats=[];for(const q of quays){const L=Math.hypot(q.b[0]-q.a[0],q.b[1]-q.a[1]),n=Math.max(1,Math.floor(L/52));for(let i=0;i<n;i++){const t=(i+.5)/n,x=lerp(q.a[0],q.b[0],t),y=lerp(q.a[1],q.b[1],t),len=q.sea?30+rng()*22:Math.min(rw*.9,14);
      const e=[x+q.n[0]*len,y+q.n[1]*len];if(!wet(e[0],e[1],0))continue;if(q.sea&&river&&[0,.5,1].some(f=>rd(lerp(x,e[0],f),lerp(y,e[1],f))<rw+16))continue;piers.push([[x,y],e]);const pa=Math.atan2(q.n[1],q.n[0]);if(q.sea&&len>26&&rng()<.85){const sd=rng()<.5?1:-1;if(!(river&&rd(e[0]+q.u[0]*sd*11,e[1]+q.u[1]*sd*11)<rw+26))ships.push({x:e[0]-q.n[0]*len*.45+q.u[0]*sd*11,y:e[1]-q.n[1]*len*.45+q.u[1]*sd*11,ang:pa+(rng()<.5?0:3.1416),big:rng()<.55,col:rng()<.3})}else boats.push({x:e[0]+q.u[0]*7,y:e[1]+q.u[1]*7,ang:pa})}
    for(let k=0;k<3;k++){const t=rng(),x=lerp(q.a[0],q.b[0],t)-q.n[0]*4,y=lerp(q.a[1],q.b[1],t)-q.n[1]*4;if(!hit(x,y,5)){props.push({id:pick(["cargo","crates","cargo"]),x,y,race:P.culture});addOcc(x,y,6)}}}
  for(let q=0;q<(P.site==="interior"?0:7);q++){const x=80+rng()*(WX-160),y=140+rng()*(WY-380);if(land(x,y)<-.6&&!ships.some(s=>Math.hypot(s.x-x,s.y-y)<90))ships.push({x,y,ang:rng()*6.28,big:rng()<.4,col:rng()<.3})}
  if(river)for(let q=0;q<5;q++){const i=(rng()*river.length)|0,v=river[i],w=river[Math.min(river.length-1,i+1)];if(v[0]>20&&v[0]<WX-20&&v[1]>20&&v[1]<WY-60&&land(v[0],v[1])>.05)boats.push({x:v[0],y:v[1],ang:Math.atan2(w[1]-v[1],w[0]-v[0])})}
  // carrocas e postes nas ruas principais
  for(const e of mainE){if(e.bridge||rng()>.35)continue;const a=nodes[e.a],b=nodes[e.b],t=.3+rng()*.4,x=lerp(a.x,b.x,t),y=lerp(a.y,b.y,t);if(wet(x,y,2))continue;props.push({id:rng()<.35?"wagon":"cart",x,y,race:P.culture,ang:Math.atan2(b.y-a.y,b.x-a.x)+(rng()<.5?0:3.1416),v:rng(),street:1})}
  if(P.wealth>.5)for(const e of mainE){if(e.bridge||rng()>.5)continue;const a=nodes[e.a],b=nodes[e.b],t=rng(),nx=-(b.y-a.y)/e.len,ny=(b.x-a.x)/e.len,x=lerp(a.x,b.x,t)+nx*4.5,y=lerp(a.y,b.y,t)+ny*4.5;if(!wet(x,y,2)&&!hit(x,y,2))props.push({id:"lamp",x,y,race:P.culture,street:1})}
  // moinhos fora da cidade
  {const cands=patches.filter(z=>z.type==="campos"||z.type==="arrabalde");for(let k=0;k<3&&cands.length;k++){const p=pick(cands),x=p.c[0]+(rng()-.5)*40,y=p.c[1]+(rng()-.5)*40;if(!wet(x,y,6)&&!hit(x,y,14)){SPB.push({k:8,x,y,rot:rng()*3,r:12});addOcc(x,y,12)}}}
  // distritos com nome
  const districts=[];{const seen=new Set(),used=new Set();for(const p of patches){if(seen.has(p)||!(p.inner||p.type==="arrabalde")||p.sea)continue;const key=p.foreign?"f"+p.race:p.type,grp=[],stck=[p];seen.add(p);while(stck.length){const q=stck.pop();grp.push(q);for(const z of nbs(q))if(!seen.has(z)&&(z.foreign?"f"+z.race:z.type)===key&&(z.inner||z.type==="arrabalde")){seen.add(z);stck.push(z)}}
      let ar=0,x=0,y=0;for(const q of grp){ar+=q.area;x+=q.c[0]*q.area;y+=q.c[1]*q.area}let name;if(p.foreign)name="Bairro dos "+A.RACE_PT[p.race];else{const l=(NM[p.type]||NM.moradia).filter(n=>!used.has(n));name=l.length?pick(l):pick(NM[p.type]||NM.moradia)}used.add(name);grp.forEach(q=>q.district=districts.length);districts.push({name,type:p.foreign?"estrangeiro":p.type,x:x/ar,y:y/ar,area:ar,n:grp.length,race:p.race,ps:grp})}}
  for(const arr of [props,trees])for(let i=arr.length-1;i>=0;i--){const q=arr[i],x=q.x!=null?q.x:q[0],y=q.y!=null?q.y:q[1];if(wet(x,y,1.5))arr.splice(i,1)}
  const title=P.title||A.NAMES[seed%A.NAMES.length];
  return {P,seed,rng,fbm,land,elev,rd,rw,river,EG,LG,RG,sg,patches,inner,nodes,edges:[...edges.values()],mainE,gates:gatesN,roads,B,SPB,yards,fields,trees,squares,piers,ships,boats,props,districts,plaza,castle,cx,cy,Rc,title,walls,quays,bridgesW,WALLON,bridgesR}}

// ---------- texturas de chao (padroes ja achatados pela inclinacao) ----------
function mkPat(c,kind){const w=48,h=Math.round(48*TILT),cv=document.createElement("canvas");cv.width=w;cv.height=h;const x=cv.getContext("2d"),r=A.mulberry(A.hashStr(kind));
  const base={terra:"#cdb98a",cascalho:"#cfc09a",pedra:"#d4c9ab",laje:"#ddd3b8",tabua:"#a8804e",areia:"#e3cf9c"}[kind];x.fillStyle=base;x.fillRect(0,0,w,h);
  if(kind==="terra"||kind==="areia"){for(let i=0;i<70;i++){x.fillStyle=r()<.5?"rgba(90,70,30,.18)":"rgba(255,245,210,.25)";x.fillRect(r()*w,r()*h,1.2,1)}}
  else if(kind==="cascalho"){for(let i=0;i<120;i++){x.fillStyle=r()<.5?"rgba(70,60,40,.3)":"rgba(255,250,230,.35)";x.beginPath();x.ellipse(r()*w,r()*h,.9,.6,0,0,7);x.fill()}}
  else if(kind==="pedra"){x.strokeStyle="rgba(80,66,44,.42)";x.lineWidth=.7;for(let j=0;j<h;j+=4.2){const o=(Math.round(j/4.2))%2?3:0;for(let i=-6+o;i<w+6;i+=6){x.beginPath();x.ellipse(i,j+2,2.6,1.6,0,0,7);x.stroke()}}}
  else if(kind==="laje"){x.strokeStyle="rgba(80,66,44,.45)";x.lineWidth=.7;for(let j=0;j<h;j+=8){x.beginPath();x.moveTo(0,j);x.lineTo(w,j);x.stroke();const o=(Math.round(j/8))%2?6:0;for(let i=o;i<w;i+=12){x.beginPath();x.moveTo(i,j);x.lineTo(i,j+8);x.stroke()}}}
  else if(kind==="tabua"){x.strokeStyle="rgba(50,32,15,.5)";x.lineWidth=.6;for(let j=0;j<h;j+=3){x.beginPath();x.moveTo(0,j);x.lineTo(w,j);x.stroke();for(let i=(j*7)%16;i<w;i+=16){x.beginPath();x.moveTo(i,j);x.lineTo(i,j+3);x.stroke()}}}
  return c.createPattern(cv,"repeat")}

let CACHE=null;
function render(C,canvas,opt){opt=opt||{};const {P,fbm,land,elev,rd,rw,EG,LG,RG,sg,nodes}=C;let rs=A.mulberry((C.seed^9173)>>>0);const rng=()=>rs();
  canvas.width=CW;canvas.height=CH;const c=canvas.getContext("2d"),stamps=A.makeStamps(A.mulberry(C.seed^77));
  const pj=(x,y)=>[x,y*TILT-elev(x,y)*KE];
  const snowy=P.culture==="norte",dry=P.culture==="deserto"||P.culture==="indiano"||P.culture==="meso",G0=dry?[214,188,128]:snowy?[176,180,150]:[170,170,90],G1=dry?[196,166,104]:snowy?[150,160,120]:[150,158,78];
  // 1. chao e agua (guardados enquanto o terreno nao muda)
  const key=C.seed+"|"+P.relief+"|"+P.river+"|"+P.size+"|"+P.culture+"|"+(C.quays||[]).map(q=>q.a.join()).join(";");let gc,wc;
  if(CACHE&&CACHE.key===key){gc=CACHE.gc;wc=CACHE.wc}else{
  const gimg=new ImageData(MW,MH),g=gimg.data,wimg=new ImageData(MW,MH),w=wimg.data,NL=16;
  for(let sy=0;sy<MH;sy++)for(let sx=0;sx<MW;sx++){let y=sy/TILT;for(let q=0;q<3;q++)y=(sy+sg(EG,sx,y)*KE)/TILT;const e=sg(EG,sx,y),gx=(sg(EG,sx+4,y)-sg(EG,sx-4,y))/8,gy=(sg(EG,sx,y+4)-sg(EG,sx,y-4))/8,lit=clamp((gx*.85+gy*.7)*14,-1,1);
    const n1=fbm(sx/90,y/90,3),n2=((Math.imul(sx,73856093)^Math.imul(sy,19349663))>>>0)%97/97,t=clamp(n1*1.5-.25,0,1),k=(sy*MW+sx)*4;let sh=1+lit*(lit>0?.2:.36);
    const lv=(e*NL)|0;if(((sg(EG,sx+1,y)*NL)|0)!==lv||((sg(EG,sx,y+1.4)*NL)|0)!==lv)sh*=lv%4===0?.74:.84;sh*=.97+n2*.06;
    g[k]=lerp(G0[0],G1[0],t)*sh;g[k+1]=lerp(G0[1],G1[1],t)*sh;g[k+2]=lerp(G0[2],G1[2],t)*sh;g[k+3]=255;
    const L=sg(LG,sx,y),R=sg(RG,sx,y),ws=-L*100,wr=(rw-R)*3,wd=Math.max(ws,wr);
    if(wd>0){const seaK=sstep(-4,26,ws),f=sstep(0,90,Math.max(0,ws)),wv=(fbm(sx/26,y/9,2)-.5)*16;let r=lerp(112,lerp(138,84,f),seaK)+wv,gg=lerp(148,lerp(170,124,f),seaK)+wv,b=lerp(160,lerp(176,148,f),seaK)+wv;
      if(wd<2.2){r=52;gg=58;b=50}else if(wd<5&&wd>3.4){r+=46;gg+=44;b+=36}w[k]=r;w[k+1]=gg;w[k+2]=b;w[k+3]=255}}
  gc=document.createElement("canvas");gc.width=MW;gc.height=MH;gc.getContext("2d").putImageData(gimg,0,0);wc=document.createElement("canvas");wc.width=MW;wc.height=MH;wc.getContext("2d").putImageData(wimg,0,0);CACHE={key,gc,wc}}
  c.fillStyle="#cdbb93";c.fillRect(0,0,CW,CH);c.drawImage(gc,MX,MY);c.save();c.beginPath();c.rect(MX,MY,MW,MH);c.clip();c.translate(MX,MY);c.lineCap="round";c.lineJoin="round";
  const path=(poly,close)=>{c.beginPath();for(let i=0;i<poly.length+(close?1:0);i++){const a=poly[i%poly.length],b=poly[(i+1)%poly.length];if(i===0){const p=pj(a[0],a[1]);c.moveTo(p[0],p[1])}if(i<poly.length-(close?0:1)){const n=Math.max(1,Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1])/14));for(let q=1;q<=n;q++){const p=pj(lerp(a[0],b[0],q/n),lerp(a[1],b[1],q/n));c.lineTo(p[0],p[1])}}}if(close)c.closePath()};
  {c.lineWidth=.9;const hd=[],hl=[];for(let y=6;y<WY-6;y+=7)for(let x=6;x<WX-6;x+=7){const px=x+(rng()-.5)*6,py=y+(rng()-.5)*6,gx=(elev(px+3,py)-elev(px-3,py))/6,gy=(elev(px,py+3)-elev(px,py-3))/6,gg=Math.hypot(gx,gy);if(gg<.0014||rng()>gg*190||land(px,py)<.06)continue;const p=pj(px,py),len=clamp(gg*2600,3,9),q=pj(px-gx/gg*len,py-gy/gg*len);((gx*.85+gy*.7)>0?hl:hd).push([p,q])}
    c.strokeStyle="rgba(62,54,22,.5)";c.beginPath();for(const[p,q]of hd){c.moveTo(p[0],p[1]);c.lineTo(q[0],q[1])}c.stroke();c.strokeStyle="rgba(244,232,166,.45)";c.beginPath();for(const[p,q]of hl){c.moveTo(p[0],p[1]);c.lineTo(q[0],q[1])}c.stroke()}
  // 2. campos
  for(const f of C.fields){path(f.poly,true);c.fillStyle=f.col;c.fill();c.save();c.clip();const p=pj(f.c[0],f.c[1]);c.translate(p[0],p[1]);c.scale(1,TILT);c.rotate(f.ang);c.strokeStyle="rgba(80,62,20,.3)";c.lineWidth=.9;c.beginPath();const gp=f.k<.35?4:6.5;for(let y=-140;y<140;y+=gp){c.moveTo(-140,y);c.lineTo(140,y)}c.stroke();c.restore();path(f.poly,true);c.strokeStyle="rgba(72,52,20,.6)";c.lineWidth=1.1;c.stroke()}
  // 3. estradas de fora (contorno e miolo em duas passadas, sem emenda)
  const PAT={};for(const k of["terra","cascalho","pedra","laje","tabua","areia"])PAT[k]=mkPat(c,k);
  const rp=C.roads.map(r=>chaikin(r,false,2));for(const [wd,col] of [[8.6,"rgba(64,46,22,.7)"],[6.6,dry?PAT.areia:PAT.terra]]){c.strokeStyle=col;c.lineWidth=wd;for(const r of rp){path(r,false);c.stroke()}}
  // 4. ruas = vazio entre quarteiroes: o bairro inteiro recebe o calcamento e os quarteiroes vem por cima
  const rich=P.wealth,pave=p=>{const t=p.type;if(t==="porto")return PAT.pedra;if(t==="pobre"||t==="arrabalde")return dry?PAT.areia:PAT.terra;if(t==="nobre"||t==="templo"||t==="mercado"||t==="castelo"||t==="universidade")return rich>.25?PAT.laje:PAT.pedra;if(t==="mercadores")return rich>.3?PAT.pedra:PAT.cascalho;return rich>.55?PAT.pedra:rich>.3?PAT.cascalho:PAT.terra};
  const EARTH=dry?"#dcc79a":"#cbbd96";
  const urb=C.patches.filter(p=>(p.inner||p.type==="arrabalde")&&!p.sea&&p.block&&p.block.length>2);
  for(const p of urb){if(p.type==="arrabalde")continue;path(p.poly,true);c.fillStyle=pave(p);c.fill()}
  {const hs=C.B.map(b=>[b.x,b.y]);const near=(x,y)=>hs.some(h=>Math.abs(h[0]-x)<26&&Math.abs(h[1]-y)<26);const lanes=C.edges.filter(e=>!e.sea&&e.in===0&&e.len<90&&e.ps.some(p=>p.type==="arrabalde")&&[0,.5,1].every(t=>near(lerp(nodes[e.a].x,nodes[e.b].x,t),lerp(nodes[e.a].y,nodes[e.b].y,t))));for(const [wd,col] of [[6.4,"rgba(64,46,22,.5)"],[4.6,dry?PAT.areia:PAT.terra]]){c.strokeStyle=col;c.lineWidth=wd;for(const e of lanes){path([[nodes[e.a].x,nodes[e.a].y],[nodes[e.b].x,nodes[e.b].y]],false);c.stroke()}}}
  // ruas principais com calcamento mais claro e meio-fio
  {const segs=[...C.mainE].filter(e=>!e.bridge).map(e=>[[nodes[e.a].x,nodes[e.a].y],[nodes[e.b].x,nodes[e.b].y]]);for(const [wd,col] of [[10,"rgba(70,55,30,.35)"],[8.4,rich>.25?PAT.laje:PAT.cascalho]]){c.strokeStyle=col;c.lineWidth=wd;for(const s of segs){path(s,false);c.stroke()}}}
  for(const p of urb){if(p.type==="arrabalde")continue;const bl=p.blocks&&p.blocks.length?p.blocks:[p.block];for(const b of bl){path(b,true);c.fillStyle=EARTH;c.fill();c.strokeStyle="rgba(70,55,30,.5)";c.lineWidth=.8;c.stroke()}}
  for(const y of C.yards){path(y.poly,true);c.fillStyle=y.col;c.fill();if(y.rows){c.save();c.clip();const q=pj(y.poly[0][0],y.poly[0][1]);c.strokeStyle="rgba(80,90,30,.45)";c.lineWidth=.8;c.beginPath();for(let k=-40;k<40;k+=3){c.moveTo(q[0]-40,q[1]+k);c.lineTo(q[0]+40,q[1]+k+8)}c.stroke();c.restore();path(y.poly,true)}c.strokeStyle="rgba(70,60,25,.35)";c.lineWidth=.6;c.stroke()}
  for(const s of C.squares){path(s.poly,true);c.fillStyle=s.kind==="patio"?PAT.pedra:PAT.laje;c.fill();c.strokeStyle="rgba(60,48,28,.6)";c.lineWidth=1;c.stroke()}
  // 5. agua por cima (recorta o que caiu na agua), cais, pontes e pieres
  c.drawImage(wc,0,0);
  {c.strokeStyle="rgba(235,244,240,.5)";c.lineWidth=.9;c.beginPath();for(let q=0;q<1500;q++){const x=rng()*WX,y=rng()*WY;if(land(x,y)>-.12&&rd(x,y)>rw-5)continue;const p=pj(x,y),l=3+rng()*5;c.moveTo(p[0]-l,p[1]);c.quadraticCurveTo(p[0],p[1]-1.6,p[0]+l,p[1])}c.stroke()}
  for(const q of C.quays){const a=pj(q.a[0],q.a[1]),b=pj(q.b[0],q.b[1]),nx=q.n[0],ny=q.n[1]*TILT;K.poly(c,[a,b,[b[0]-nx*8,b[1]-ny*8],[a[0]-nx*8,a[1]-ny*8]],PAT.laje,null);c.strokeStyle="#4d4a41";c.lineWidth=3.2;c.beginPath();c.moveTo(a[0],a[1]);c.lineTo(b[0],b[1]);c.stroke();c.strokeStyle="#cdc6b4";c.lineWidth=1.4;c.beginPath();c.moveTo(a[0]-nx*1.4,a[1]-ny*1.4);c.lineTo(b[0]-nx*1.4,b[1]-ny*1.4);c.stroke();
    c.fillStyle="#4d4a41";const L=Math.hypot(b[0]-a[0],b[1]-a[1]);for(let t=8;t<L;t+=16){const x=lerp(a[0],b[0],t/L),y=lerp(a[1],b[1],t/L);c.fillRect(x-.8,y-2.2,1.6,2.2)}}
  const bridge=(a,b,stone,wd)=>{const pa=pj(a[0],a[1]),pb=pj(b[0],b[1]),ln=()=>{c.beginPath();c.moveTo(pa[0],pa[1]);c.lineTo(pb[0],pb[1])};c.lineCap="butt";
    if(stone){ln();c.strokeStyle="rgba(30,40,40,.35)";c.lineWidth=wd+6;c.stroke();ln();c.strokeStyle=INK;c.lineWidth=wd+3.4;c.stroke();ln();c.strokeStyle="#cdc6b4";c.lineWidth=wd+1.6;c.stroke();ln();c.strokeStyle=PAT.laje;c.lineWidth=wd-1.4;c.stroke()}
    else{ln();c.strokeStyle="#3a2a18";c.lineWidth=wd+2;c.stroke();ln();c.strokeStyle=PAT.tabua;c.lineWidth=wd;c.stroke()}c.lineCap="round"};
  for(const z of C.bridgesR||[]){bridge(z.a,z.b,z.stone,z.wd);if(z.stone){const pa=pj(z.a[0],z.a[1]),pb=pj(z.b[0],z.b[1]);c.fillStyle="#8f897a";for(const q of[pa,pb]){c.beginPath();c.arc(q[0],q[1],z.wd*.5,0,7);c.fill()}}}
  for(const e of C.bridgesW)bridge([nodes[e.a].x,nodes[e.a].y],[nodes[e.b].x,nodes[e.b].y],true,9);
  for(const r of rp){let i0=-1;for(let i=0;i<r.length;i++){const wt=rd(r[i][0],r[i][1])<rw+1.5;if(wt&&i0<0)i0=i;if(!wt&&i0>=0){bridge(r[Math.max(0,i0-1)],r[i],false,6.6);i0=-1}}}
  for(const [a,b] of C.piers){const pa=pj(a[0],a[1]),pb=pj(b[0],b[1]);c.lineCap="butt";c.strokeStyle="rgba(30,40,40,.35)";c.lineWidth=9;c.beginPath();c.moveTo(pa[0]+1.5,pa[1]+2);c.lineTo(pb[0]+1.5,pb[1]+2);c.stroke();c.strokeStyle="#3a2a18";c.lineWidth=7.6;c.beginPath();c.moveTo(pa[0],pa[1]);c.lineTo(pb[0],pb[1]);c.stroke();c.strokeStyle=PAT.tabua;c.lineWidth=5.6;c.stroke();
    c.fillStyle="#3a2a18";const L=Math.hypot(pb[0]-pa[0],pb[1]-pa[1]);for(let t=6;t<L;t+=8){const x=lerp(pa[0],pb[0],t/L),y=lerp(pa[1],pb[1],t/L);c.fillRect(x-3.6,y+2,1.2,2.4);c.fillRect(x+2.4,y+2,1.2,2.4)}c.lineCap="round"}
  // 6. objetos em ordem de profundidade
  const obj=[],fz=CUL[P.culture].fence;
  for(const b of C.B){const r2=A.mulberry((Math.imul(b.x*4|0,73856093)^Math.imul(b.y*4|0,19349663))>>>0),pk=a=>r2()<.74?a[0]:a[1],o=A.mkHouse(b.race,b.type,r2,b.ang,{L:b.L/Z,D:b.D/Z,roof:pk(b.pal.roof),wall:pk(b.pal.wall),plain:b.plain});o.wing=null;{const big=b.type==="manor"||b.type==="rich"||b.hall;o.H*=big?.85:.74;o.R=Math.min(o.R,o.D*(o.form==="asian"?.42:.5));const lim=o.D*(big?1.5:1.15)+2.5;if(o.H+o.R>lim){const k=lim/(o.H+o.R);o.H*=k;o.R*=k}if(!big){o.tower=null;o.dorm=null}}
    const p=pj(b.x,b.y),ey=(Math.abs(Math.sin(b.ang))*b.L+Math.abs(Math.cos(b.ang))*b.D)/2*TILT;obj.push({k:1,x:p[0],y:p[1]+ey,cy:p[1],o,smoke:o.smoke||b.type==="tavern"&&r2()<.5,wx:b.x,wy:b.y})}
  for(const s of C.SPB){const p=pj(s.x,s.y);obj.push(Object.assign({},s,{x:p[0],y:p[1]+(s.k===3?30:s.k===2?14:(s.r||8)*TILT*.6),py:p[1],wx:s.x,wy:s.y}))}
  for(const s of C.props){const p=pj(s.x,s.y);obj.push(Object.assign({},s,{k:40,x:p[0],y:p[1],py:p[1],wx:s.x,wy:s.y}))}
  for(const t of C.trees){const p=pj(t[0],t[1]);obj.push({k:0,x:p[0],y:p[1],s:t[2],wild:t[3],wx:t[0],wy:t[1]})}
  for(const s of C.ships){const p=pj(s.x,s.y);obj.push({k:13,x:p[0],y:p[1],ang:s.ang,big:s.big,col:s.col,wx:s.x,wy:s.y})}
  for(const s of C.boats){const p=pj(s.x,s.y);obj.push({k:14,x:p[0],y:p[1],ang:s.ang,wx:s.x,wy:s.y})}
  // muralha
  const gatePts=C.gates.map(id=>[nodes[id].x,nodes[id].y]);
  const pushWall=(pts,closed,h,gatesOn,inner)=>{const rsP=resampleP(pts,P.wall==="curva"||inner?11:14,closed);const n=rsP.length;let since=0;
    for(let i=0;i<n-(closed?0:1);i++){const u=rsP[i],v=rsP[(i+1)%n],m=[(u[0]+v[0])/2,(u[1]+v[1])/2];if(land(m[0],m[1])<.02)continue;const gd=gatesOn?Math.min(...gatePts.map(g=>Math.hypot(g[0]-m[0],g[1]-m[1])).concat([1e9])):1e9;if(gd<13)continue;
      const pu=pj(u[0],u[1]),pv=pj(v[0],v[1]),wt=rd(m[0],m[1])<rw+3;obj.push({k:wt?9:4,a:pu,b:pv,y:Math.max(pu[1],pv[1]),h});since+=Math.hypot(v[0]-u[0],v[1]-u[1]);if(since>(inner?32:52)&&!wt){since=0;const p=pj(v[0],v[1]);obj.push({k:5,x:p[0],y:p[1]+.6,inner})}}};
  if(C.WALLON){for(const w of C.walls)pushWall(w.pts,w.closed,8.5,true,false);if(fz!=="hedge")for(const g of gatePts){const p=pj(g[0],g[1]);obj.push({k:40,id:"gatehouse",x:p[0],y:p[1]+4,race:P.culture,v:.5,s:1.1,gate:1})}}
  if(C.castle&&C.castle.cwall)pushWall(C.castle.cwall,true,7,false,true);
  {const bx=[];for(const q of obj){if(q.k===1){const o=q.o,w=(Math.abs(Math.cos(o.ang))*o.L+Math.abs(Math.sin(o.ang))*o.D)/2*Z,top=q.cy-(o.H+o.R)*Z-2;bx.push({q,x0:q.x-w,x1:q.x+w,y0:top,y1:q.y,h:1})}else if(q.id&&AS.SIZE[q.id]&&!q.street){const sz=AS.SIZE[q.id],z=(q.s||1)*Z,w=sz[0]*z*.75;bx.push({q,x0:q.x-w,x1:q.x+w,y0:(q.py||q.y)-sz[1]*z*.85,y1:(q.py||q.y)+2,h:0})}else if(q.k===2||q.k===3){const w=q.k===3?52:36;bx.push({q,x0:q.x-w,x1:q.x+w,y0:q.py-(q.k===3?70:64),y1:q.y,h:0})}}
    const G=new Map(),key=(x,y)=>((x/40)|0)+"_"+((y/40)|0);for(const b of bx){for(let x=Math.floor(b.x0/40);x<=Math.floor(b.x1/40);x++)for(let y=Math.floor(b.y0/40);y<=Math.floor(b.y1/40);y++){const k=x+"_"+y;G.has(k)?G.get(k).push(b):G.set(k,[b])}}
    const drop=new Set();for(const b of bx){if(!b.h)continue;const area=(b.x1-b.x0)*(b.y1-b.y0);let cov=0;const seen=new Set();for(let x=Math.floor(b.x0/40);x<=Math.floor(b.x1/40);x++)for(let y=Math.floor(b.y0/40);y<=Math.floor(b.y1/40);y++)for(const f of G.get(x+"_"+y)||[]){if(f===b||seen.has(f)||drop.has(f.q)||f.y1<=b.y1+1)continue;seen.add(f);const ix=Math.min(b.x1,f.x1)-Math.max(b.x0,f.x0),iy=Math.min(b.y1,f.y1)-Math.max(b.y0,f.y0);if(ix>0&&iy>0)cov+=ix*iy*(f.h?1:1.4)}
      if(cov>area*.5)drop.add(b.q)}window.__drop=drop.size;
    for(let i=obj.length-1;i>=0;i--)if(drop.has(obj[i]))obj.splice(i,1)}
  obj.sort((a,b)=>a.y-b.y);const smoke=[],treeSet=P.culture==="deserto"?stamps.palm:P.culture==="norte"?stamps.con:stamps.dec,wildSet=P.culture==="deserto"?stamps.palm.concat(stamps.acacia):P.culture==="norte"?stamps.con:stamps.dec.concat(stamps.dec,stamps.con);
  const ER=opt.erase||[];
  for(const q of obj){rs=A.mulberry((Math.imul(q.x*4|0,73856093)^Math.imul(q.y*4|0,19349663)^q.k*83492791)>>>0);
    if(q.wx!=null&&ER.length&&ER.some(e=>Math.hypot(e.x-q.wx,e.y-q.wy)<e.r))continue;
    if(q.k===1){c.save();c.translate(q.x,q.cy);c.scale(Z,Z);K.drawBuilding(c,0,0,q.o);c.restore();if(q.smoke)smoke.push([q.x,q.cy-(q.o.H+q.o.R)*Z-3])}
    else if(q.k===0){const set=q.wild?wildSet:(P.culture==="japones"||P.culture==="chines")&&rng()<.6?stamps.sakura:treeSet,st=set[(rng()*set.length)|0],wd=st.width*q.s*1.25,hg=st.height*q.s*1.25;c.drawImage(st,q.x-wd/2,q.y-hg*.9,wd,hg)}
    else if(q.k===2||q.k===3){c.save();c.translate(q.x,q.py);const z=q.k===3?2:(q.big?2.2:1.8);c.scale(z,z);K.drawBig(c,Object.assign({},q,{x:0,y:0,sz:1}));c.restore()}
    else if(q.k===4){if(fz==="palisade")K.drawPalisade(c,q.a,q.b,q.h+.5);else if(fz==="hedge")K.drawHedge(c,q.a,q.b,5);else K.drawWall(c,q.a,q.b,q.h,fz)}
    else if(q.k===9)K.drawWaterWall(c,q.a,q.b,q.h,fz);
    else if(q.k===5){const s=q.inner?.85:1;if(fz==="asian")K.drawAsian(c,q.x,q.y+2,{L:9*s,D:9*s,H:8*s,R:4.4,ang:.4,roof:"jp",wall:"jpw",base:0});else if(fz==="palisade")K.drawTower(c,q.x,q.y+2,5*s,14*s,6,ROOF.hide,WALL.wooddark,false);else if(fz==="hedge"){}else K.drawTower(c,q.x,q.y+2,5.6*s,15*s,(rs()<.5?7:0),ROOF.dark,fz==="sand"?WALL.sand:WALL.stone,rs()<.5)}
    else if(q.k===8){c.save();c.translate(q.x,q.y);c.scale(1.5,1.5);K.drawMill(c,0,0,q.rot);c.restore()}
    else if(q.k===13){c.save();c.translate(q.x,q.y);c.scale(1.5,1.5);AS.shipIso(c,0,0,q.ang,q.big,q.col?"#a8352a":null);c.restore()}
    else if(q.k===14){c.save();c.translate(q.x,q.y);c.scale(1.5,1.5);AS.boat(c,0,0,q.ang);c.restore()}
    else if(q.id){const z=(q.s||1)*Z*(q.street?.85:1);c.save();c.translate(q.x,q.py!=null?q.py:q.y);c.scale(z,z);AS.draw(c,0,0,q.id,q.race,q.v,q.ang||0);c.restore()}}
  rs=A.mulberry((C.seed^99)>>>0);for(const s of smoke)K.drawSmoke(c,s[0],s[1],rng);
  // objetos colocados a mao
  if(opt.objs&&opt.objs.length){const list=opt.objs.map(m=>{const p=pj(m.x,m.y);return {m,x:p[0],y:p[1]}}).sort((a,b)=>a.y-b.y);const st2=A.makeStamps(A.mulberry(12345));
    for(const {m,x,y} of list){const z=(m.s||1)*Z;c.save();c.translate(x,y);c.scale(z,z);if(AS.NAME[m.v])AS.draw(c,0,0,m.v,m.c||P.culture,((m.x*7+m.y*3)%100)/100,(m.a||0)*Math.PI/180);
      else if(m.v.slice(0,2)==="b_"){const sp={b_hut:"hut",b_farm:"farm",b_town:"town",b_row:"row",b_rich:"rich",b_manor:"manor",b_tavern:"tavern",b_smithy:"smithy",b_barn:"barn",b_shed:"shed"}[m.v];if(sp){const o=A.mkHouse(m.c||P.culture,sp,A.mulberry((m.x*31+m.y)|0),(m.a||0)*Math.PI/180);K.drawBuilding(c,0,0,o)}else if(m.v==="b_temple"||m.v==="b_castle"){c.scale(1.2,1.2);K.drawBig(c,{k:m.v==="b_temple"?2:3,x:0,y:0,race:m.c||P.culture,v:.4,sz:1})}else if(m.v==="b_tent")K.drawTent(c,0,0,m.c||P.culture,1,false,true);else if(m.v==="b_mill")K.drawMill(c,0,0,.4);else if(m.v==="b_tower")K.drawTower(c,0,0,4.4,12,6,ROOF.dark,WALL.stone,false)}
      else{const T={oak:st2.dec,pine:st2.con,birch:st2.birch,autumn:st2.autumn,sakura:st2.sakura,blossom:st2.blossom,palm:st2.palm,willow:st2.willow,bush:st2.bush,acacia:st2.acacia,jungle:st2.jungle,snowpine:st2.snowpine,dead:st2.dead,cactus:st2.cactus,bare:st2.bare,rock:st2.rocks,boulders:st2.rockc}[m.v];if(T){const s0=T[((m.x+m.y)|0)%T.length];c.drawImage(s0,-s0.width*.45,-s0.height*.85,s0.width*.9,s0.height*.9)}}c.restore()}}
  // 7. nomes dos bairros, no lugar com menos casas por baixo
  if(P.labels){const boxes=[],cent=obj.filter(q=>q.k===1||q.k===2||q.k===3||q.id).map(q=>[q.x,q.k===1?q.cy:q.y]);c.textAlign="center";c.textBaseline="middle";
    for(const d of C.districts.slice().sort((a,b)=>b.area-a.area)){const big=d.n>1,fs=big?16:13,txt=d.name.toUpperCase().split("").join(" ");c.font=fs+'px "IM Fell English SC","IM Fell English",Georgia,serif';const wd=c.measureText(txt).width+8;
      const cands=[];for(const p of d.ps){cands.push(p.c);if(p.block)for(const v of p.block)cands.push([lerp(p.c[0],v[0],.5),lerp(p.c[1],v[1],.5)]);for(const k of p.nd){const n=nodes[k];cands.push([lerp(p.c[0],n.x,.85),lerp(p.c[1],n.y,.85)])}}cands.push([d.x,d.y]);let best=null,bs=1e9;
      for(const q of cands){if(land(q[0],q[1])<.06||rd(q[0],q[1])<rw+4)continue;const p=pj(q[0],q[1]),bx=[p[0]-wd/2,p[1]-fs*.7,p[0]+wd/2,p[1]+fs*.7];if(bx[0]<4||bx[2]>MW-4||bx[1]<4||bx[3]>MH-4||boxes.some(o=>bx[0]<o[2]&&bx[2]>o[0]&&bx[1]<o[3]&&bx[3]>o[1]))continue;let n=0;for(const h of cent)if(h[0]>bx[0]-2&&h[0]<bx[2]+2&&h[1]>bx[1]-4&&h[1]<bx[3]+12)n++;const s=n+Math.hypot(q[0]-d.x,q[1]-d.y)*.012;if(s<bs){bs=s;best=bx}}
      if(!best)continue;boxes.push(best);const x=(best[0]+best[2])/2,y=(best[1]+best[3])/2;c.lineWidth=4;c.strokeStyle="rgba(240,230,200,.9)";c.strokeText(txt,x,y);c.fillStyle="#5c1f18";c.fillText(txt,x,y)}}
  // 8. envelhecimento, grao e moldura
  const vg=c.createRadialGradient(MW/2,MH/2,MH*.45,MW/2,MH/2,MW*.75);vg.addColorStop(0,"rgba(70,45,10,0)");vg.addColorStop(1,"rgba(70,45,10,.3)");c.fillStyle=vg;c.fillRect(0,0,MW,MH);
  const gn=document.createElement("canvas");gn.width=gn.height=160;const gx=gn.getContext("2d"),gd=gx.createImageData(160,160);for(let i=0;i<gd.data.length;i+=4){const v=150+rng()*105;gd.data[i]=v;gd.data[i+1]=v*.97;gd.data[i+2]=v*.9;gd.data[i+3]=255}gx.putImageData(gd,0,0);
  c.globalCompositeOperation="multiply";c.globalAlpha=.34;c.fillStyle=c.createPattern(gn,"repeat");c.fillRect(0,0,MW,MH);c.globalAlpha=1;c.globalCompositeOperation="source-over";c.restore();
  c.strokeStyle=INK;c.lineWidth=2;c.strokeRect(MX-.5,MY-.5,MW+1,MH+1);c.lineWidth=.8;c.strokeRect(MX-6.5,MY-6.5,MW+13,MH+13);
  c.font='30px "IM Fell English SC","IM Fell English",Georgia,serif';c.textAlign="center";c.textBaseline="middle";c.fillStyle="#1d160d";const title=("Cidade de "+C.title).toUpperCase();c.fillText(title,CW/2,31);const tw=c.measureText(title).width/2+22;
  for(const s of[-1,1])K.poly(c,[[CW/2+s*tw,24],[CW/2+s*tw+6,31],[CW/2+s*tw,38],[CW/2+s*tw-6,31]],"#a8352a");
  return {n:obj.length,houses:C.B.length+C.SPB.length,project:(x,y)=>{const p=pj(x,y);return [p[0]+MX,p[1]+MY]},
    unproject:(sx,sy)=>{sx-=MX;sy-=MY;let y=sy/TILT;for(let q=0;q<4;q++)y=(sy+elev(sx,y)*KE)/TILT;return [sx,y]}}}

// bairro sob um ponto do mundo
function patchAt(C,x,y){for(const p of C.patches){if(p.sea)continue;if(inPoly(p.poly,x,y))return p}return null}
window.AtlasCity={generate,render,patchAt,DEF,PARAMS,SITES,WTYPES,CW,CH};
})();
