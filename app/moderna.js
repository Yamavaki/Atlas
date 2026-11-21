// Atlas - cidade moderna (prototipo 1.11): era do vapor (1900), atual e cyberpunk.
// Vista de cima com predios em perspectiva oblíqua: quadras, avenidas, rodovia elevada com trevo, ferrovia, metro ou bonde, porto, parques.
(function(){
"use strict";
const MW=1500,MH=1020,MX=46,MY=64,CW=MW+92,CH=MH+110;
const clamp=(v,a,b)=>v<a?a:v>b?b:v,lerp=(a,b,t)=>a+(b-a)*t,sstep=(a,b,x)=>{const t=clamp((x-a)/(b-a),0,1);return t*t*(3-2*t)};
function hashStr(s){let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}return h>>>0}
function mulberry(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
function ruido(seed){const r=mulberry(seed),T=new Float32Array(4096);for(let i=0;i<4096;i++)T[i]=r();const vn=(x,y)=>{const xi=Math.floor(x),yi=Math.floor(y),fx=x-xi,fy=y-yi,u=fx*fx*(3-2*fx),v=fy*fy*(3-2*fy),h=(a,b)=>T[((a&63)+((b&63)<<6))];return lerp(lerp(h(xi,yi),h(xi+1,yi),u),lerp(h(xi,yi+1),h(xi+1,yi+1),u),v)};
  return (x,y,o)=>{let s=0,a=.5,n=0;for(let i=0;i<o;i++){s+=vn(x,y)*a;n+=a;x=x*2.03+17.1;y=y*2.03+9.7;a*=.5}return s/n}}
const ERAS=[["1900","Era do vapor (1850–1920)"],["atual","Atual"],["cyber","Cyberpunk"]];
const PARAMS=[["seed","Semente","text"],["era","Época","select",ERAS],["site","Terreno","select",[["costa","Costa com porto"],["rio","Cortada por rio"],["baia","Baía"],["interior","Interior"]]],
  ["traco","Traçado","select",[["grade","Grade (quadras retas)"],["misto","Misto (grade que se curva)"],["radial","Radial (anéis e avenidas)"]]],["size","Tamanho do centro","pct"],
  ["highway","Rodovia elevada com trevo","bool"],["rail","Ferrovia e estação","bool"],["metro","Metrô (ou bonde em 1900)","bool"],["green","Parques e árvores","pct"]];
const DEF={seed:"aurora-1",era:"atual",site:"costa",traco:"misto",size:.55,highway:true,rail:true,metro:true,green:.4};
const NOMES={"1900":["Bairro da Estação","Vila Operária","Bairro das Fábricas","Alto da Colina","Centro Velho","Cais do Carvão","Jardim Botânico","Bairro dos Imigrantes","Bairro Alto","Largo do Bonde"],
  atual:["Centro","Distrito Financeiro","Vila Nova","Jardim América","Porto Maravilha","Bairro Universitário","Parque das Nações","Zona Industrial","Alto da Boa Vista","Bela Vista","Moinhos"],
  cyber:["Distrito Neon","Setor 7","Kowloon Baixo","Torres Arasaka","Mercado Negro","Zona Morta","Colmeia","Anel Orbital","Docas de Sucata","Cidade Alta","Chiba"]};
const AVN=["Avenida Central","Avenida do Porto","Avenida Paulista","Avenida Atlântica","Boulevard do Rio","Avenida da Estação","Avenida das Nações","Avenida Oeste"];
const PAL={
  "1900":{chao:"#c9bb94",rua:"#a89a7c",calc:"#d6cbb0",linha:null,agua:"#6f9aa6",aguaE:"#557f8c",parque:"#8fa060",teto:["#9c4a32","#8a4030","#6e6a64","#7c5a44","#a85a3a"],parede:["#c8a888","#b89878","#a89a8a"],vidro:null,noite:false,carro:["#3a2a1c","#5a3a24"]},
  atual:{chao:"#d8d4c8",rua:"#4c4f55",calc:"#c9c6bf",linha:"#f2f0e6",agua:"#5f9cb8",aguaE:"#3f7c9c",parque:"#8fb067",teto:["#d8d6d0","#b8b6b0","#c9b8a0","#a8a8ac","#e4e0d6","#9a8f86"],parede:["#bcb8b0","#a8a49c","#cfc9be"],vidro:["#6f9cc0","#4f7fa8","#8fb8d8","#5a8a9c"],noite:false,carro:["#c0392b","#2c6fb0","#f2f2f2","#222","#e0b020","#7a7f88"]},
  cyber:{chao:"#1c1e28",rua:"#262834",calc:"#30323e",linha:"#ff3fbf",agua:"#0f2a3a",aguaE:"#081a26",parque:"#1f3a34",teto:["#2c2f3c","#343849","#262836","#3a3448"],parede:["#1e2030","#242638"],vidro:["#1a3a5a","#2a1a4a","#103a40"],noite:true,neon:["#ff3fbf","#3ff0ff","#ffe14a","#9a5bff","#3fff9a"],carro:["#ff3fbf","#3ff0ff","#ffe14a","#e0e0f0"]}};

// malha viaria organica: avenidas que saem do centro e curvam, aneis, ruas coletoras e locais que crescem e se ramificam,
// suburbios com ruas curvas e becos sem saida, rotatorias nos cruzamentos de avenidas, pontes curtas, rodovia elevada com rampas.
// As quadras sao o espaco entre as ruas (grade de 3 px), e os predios encostam na rua mais perto.
function generate(P0){const P=Object.assign({},DEF,P0),seed=hashStr(String(P.seed)+"|"+P.era+"|"+P.site+"|"+P.traco),rng=mulberry(seed),fbm=ruido(seed^0x9e37),pick=a=>a[(rng()*a.length)|0];
  const W=MW,H=MH,th=rng()*6.2832,ct=Math.cos(th),st=Math.sin(th),E=P.era;let cx=W/2,cy=H/2;
  let land=()=>200,rioPts=null;const segD=(x,y,a,b)=>{const ex=b[0]-a[0],ey=b[1]-a[1],l=ex*ex+ey*ey||1,u=clamp(((x-a[0])*ex+(y-a[1])*ey)/l,0,1);return Math.hypot(x-a[0]-ex*u,y-a[1]-ey*u)};
  if(P.site==="costa"||P.site==="baia"){const off=P.site==="baia"?Math.min(W,H)*.24:Math.min(W,H)*.36;cx-=ct*off*.42;cy-=st*off*.42;
    land=(x,y)=>{const dx=x-W/2,dy=y-H/2,al=dx*ct+dy*st,pe=-dx*st+dy*ct;let v=off-al+(fbm(x/260,y/260,3)-.5)*130;if(P.site==="baia")v-=Math.max(0,170-Math.abs(pe)*.55)*sstep(off-220,off+40,al)*1.4;return v}}
  if(P.site==="rio"){rioPts=[];const ph=rng()*6;for(let t=-.2;t<=1.2;t+=.02){const al=lerp(-W*.7,W*.7,t),pe=Math.sin(t*4+ph)*90+(fbm(t*3,ph,2)-.5)*160;rioPts.push([W/2+ct*al-st*pe,H/2+st*al+ct*pe])}
    land=(x,y)=>{let d=1e9;for(let i=0;i<rioPts.length-1;i++){const v=segD(x,y,rioPts[i],rioPts[i+1]);if(v<d)d=v}return d-30}}
  // cache da terra numa grade (rapido para consultas)
  const G=3,GW=Math.ceil(W/G),GH=Math.ceil(H/G),LG=new Float32Array(GW*GH);for(let j=0;j<GH;j++)for(let i=0;i<GW;i++)LG[j*GW+i]=land(i*G+1,j*G+1);
  const terra=(x,y)=>{const i=x/G|0,j=y/G|0;if(i<0||j<0||i>=GW||j>=GH)return -1;return LG[j*GW+i]};const seco=(x,y)=>terra(x,y)>4;
  {let bx=cx,by=cy,bv=-1e9;for(let k=0;k<40;k++){const x=cx+(rng()-.5)*200,y=cy+(rng()-.5)*200;const v=terra(x,y)+(-Math.hypot(x-cx,y-cy)*.3);if(v>bv&&terra(x,y)>60){bv=v;bx=x;by=y}}cx=bx;cy=by}
  const R0=Math.min(W,H)*(.16+P.size*.26),organico=P.traco==="radial"?.6:P.traco==="grade"?.15:.4;
  // ---- ruas
  const ruas=[],CS=10,CGW=Math.ceil(W/CS),CGH=Math.ceil(H/CS),cel=Array.from({length:CGW*CGH},()=>[]),segs=[];
  const reg=(a,b,r)=>{const id=segs.length;segs.push([a,b,r]);const x0=Math.max(0,Math.floor((Math.min(a[0],b[0])-14)/CS)),x1=Math.min(CGW-1,Math.floor((Math.max(a[0],b[0])+14)/CS)),y0=Math.max(0,Math.floor((Math.min(a[1],b[1])-14)/CS)),y1=Math.min(CGH-1,Math.floor((Math.max(a[1],b[1])+14)/CS));for(let j=y0;j<=y1;j++)for(let i=x0;i<=x1;i++)cel[j*CGW+i].push(id)};
  const perto=(x,y,r,rua,ignoraUlt)=>{const i=Math.floor(x/CS),j=Math.floor(y/CS);if(i<0||j<0||i>=CGW||j>=CGH)return null;let best=null,bd=r;for(const id of cel[j*CGW+i]){const [a,b,rr]=segs[id];if(rr===rua&&ignoraUlt)continue;const d=segD(x,y,a,b);if(d<bd){bd=d;const ex=b[0]-a[0],ey=b[1]-a[1],l=ex*ex+ey*ey||1,u=clamp(((x-a[0])*ex+(y-a[1])*ey)/l,0,1);best={p:[a[0]+ex*u,a[1]+ey*u],d,r:rr,ang:Math.atan2(ey,ex)}}}return best};
  const TIPO={art:{w:10,step:16,curv:.05,max:1400,ram:46,pr:.85,filho:"col"},col:{w:6.4,step:13,curv:.14,max:320,ram:44,pr:.72,filho:"loc"},loc:{w:4.4,step:11,curv:.16,max:190,ram:52,pr:.42,filho:"loc"}};
  const fila=[],rotat=[],becos=[],pontes=[];let nRuas=0;
  const cresce=(ini,ang,k,prof)=>{const T=TIPO[k],rua=ruas.length,pts=[ini],dd=Math.hypot(ini[0]-cx,ini[1]-cy)/R0,sub=sstep(.9,1.6,dd),curv=T.curv*(k==="art"?1:(.4+organico*1.4))*(1+sub*1.1)*(dd<.55&&P.traco!=="radial"?.25:1);
    let a=ang,len=0,ultRam=0,fim=null,ponte=false;const arco=k!=="art"&&sub>.35&&P.traco!=="grade"?(rng()<.5?-1:1)*(.022+rng()*.03)*sub:0,reta=k!=="art"&&dd<.75;const R={pts,k,w:T.w*(E==="cyber"&&k==="art"?1.3:1)};ruas.push(R);
    while(len<T.max*(k==="loc"?(.6+rng()*.8):1)){a+=reta?0:arco?arco:(fbm(pts[pts.length-1][0]/120+rua,pts[pts.length-1][1]/120,2)-.5)*curv*2;if(k==="art"&&P.traco==="radial")a=lerp(a,Math.atan2(pts[pts.length-1][1]-cy,pts[pts.length-1][0]-cx),.04);
      const p=pts[pts.length-1],n=[p[0]+Math.cos(a)*T.step,p[1]+Math.sin(a)*T.step];
      if(n[0]<-20||n[1]<-20||n[0]>W+20||n[1]>H+20){pts.push(n);break}
      if(!seco(n[0],n[1])){if(k!=="art"){fim="agua";break}let ok=false;for(let d=T.step;d<170;d+=T.step){const q=[p[0]+Math.cos(a)*d,p[1]+Math.sin(a)*d];if(seco(q[0],q[1])&&seco(q[0]+Math.cos(a)*10,q[1]+Math.sin(a)*10)){pontes.push([p,q,T.w]);pts.push(q);len+=d;ok=true;break}}if(!ok)break;continue}
      const hit=len>14?perto(n[0],n[1],k==="loc"?9:12,rua,true):null;
      if(hit){pts.push(hit.p);reg(p,hit.p,rua);fim="cruza";if(k==="art"&&ruas[hit.r].k==="art"&&!rotat.some(r=>Math.hypot(r[0]-hit.p[0],r[1]-hit.p[1])<60))rotat.push([hit.p[0],hit.p[1]]);break}
      pts.push(n);reg(p,n,rua);len+=T.step;
      if(T.filho&&len-ultRam>T.ram*(.7+rng()*.6)&&dd<2.6){ultRam=len;for(const sd of[-1,1])if(rng()<T.pr*(k==="loc"?(dd<.6?1.3:.8-sub*.35):1))fila.push([n,a+sd*(1.5708+(dd<.75?0:(rng()-.5)*.25*(1+sub*2))),T.filho,prof+1])}}
    if(!fim&&k==="loc"&&sub>.4)becos.push(pts[pts.length-1]);nRuas++};
  // avenidas: radiais saindo do centro e um anel
  const nA=P.traco==="grade"?4:5+((rng()*3)|0),a0=rng()*6.28;for(let i=0;i<nA;i++)cresce([cx,cy],a0+i/nA*6.2832+(rng()-.5)*.3,"art",0);
  if(P.traco!=="grade"){for(const rr of [R0*.62,R0*1.25]){const n=Math.round(rr*6.28/16);let prev=null,first=null;const rua=ruas.length,R={pts:[],k:"art",w:9};ruas.push(R);for(let i=0;i<=n;i++){const ang=i/n*6.2832,r=rr*(1+(fbm(Math.cos(ang)*1.3+7,Math.sin(ang)*1.3,2)-.5)*.35),p=[cx+Math.cos(ang)*r,cy+Math.sin(ang)*r*.9];
      if(!seco(p[0],p[1])){if(R.pts.length>1){prev=null;R.pts.push(null)}continue}if(prev){reg(prev,p,rua);const h=perto(p[0],p[1],6,rua,true);if(h&&ruas[h.r].k==="art"&&!rotat.some(r=>Math.hypot(r[0]-p[0],r[1]-p[1])<60))rotat.push(p)}R.pts.push(p);prev=p}}}
  else{for(const sd of[-1,1])for(const off of [R0*.5,R0*1.1]){const a1=a0+1.5708,ox=cx+Math.cos(a0)*off*sd,oy=cy+Math.sin(a0)*off*sd;cresce([ox,oy],a1,"art",0);cresce([ox,oy],a1+3.1416,"art",0)}}
  // coletoras e locais crescendo a partir das avenidas (fila em largura, mais densas no centro)
  let guard=0;const LIM=E==="cyber"?2600:2200;while(fila.length&&guard++<LIM){const idx=(rng()*Math.min(fila.length,40))|0,[p,a,k,prof]=fila.splice(idx,1)[0];if(!seco(p[0],p[1]))continue;const ini=[p[0]+Math.cos(a)*6,p[1]+Math.sin(a)*6];if(perto(ini[0],ini[1],7,-1,false)&&!perto(p[0],p[1],2,-1,false))continue;cresce(p,a,k,prof)}
  // ---- grade de quadras: rua, agua ou quadra (id)
  const Q=new Int32Array(GW*GH).fill(-2);for(let i=0;i<GW*GH;i++)if(LG[i]<=4)Q[i]=-3;
  for(const R of ruas){const w=R.w/2+1.5;for(let i=0;i<R.pts.length-1;i++){const a=R.pts[i],b=R.pts[i+1];if(!a||!b)continue;const L=Math.hypot(b[0]-a[0],b[1]-a[1]),n=Math.ceil(L/2);for(let s=0;s<=n;s++){const x=lerp(a[0],b[0],s/n),y=lerp(a[1],b[1],s/n);const r=Math.ceil(w/G);const ci=x/G|0,cj=y/G|0;for(let dj=-r;dj<=r;dj++)for(let di=-r;di<=r;di++){if(di*di+dj*dj>r*r)continue;const i2=ci+di,j2=cj+dj;if(i2>=0&&j2>=0&&i2<GW&&j2<GH)Q[j2*GW+i2]=-1}}}}
  for(const [x,y] of rotat){const r=Math.ceil(16/G),ci=x/G|0,cj=y/G|0;for(let dj=-r;dj<=r;dj++)for(let di=-r;di<=r;di++){const i2=ci+di,j2=cj+dj;if(di*di+dj*dj<=r*r&&i2>=0&&j2>=0&&i2<GW&&j2<GH&&Q[j2*GW+i2]!==-3)Q[j2*GW+i2]=-1}}
  const quadras=[];for(let s=0;s<GW*GH;s++){if(Q[s]!==-2)continue;const id=quadras.length,pl=[s];Q[s]=id;let n=0,sx=0,sy=0,borda=false;while(pl.length){const k=pl.pop();n++;const i=k%GW,j=(k/GW)|0;sx+=i;sy+=j;if(i===0||j===0||i===GW-1||j===GH-1)borda=true;for(const k2 of [k-1,k+1,k-GW,k+GW]){if(k2<0||k2>=GW*GH)continue;if(Math.abs((k2%GW)-i)>1)continue;if(Q[k2]===-2){Q[k2]=id;pl.push(k2)}}}
    const c=[sx/n*G,sy/n*G];quadras.push({id,n,c,borda,d:Math.hypot(c[0]-cx,c[1]-cy)})}
  // ferrovia
  const ferrovia=P.rail?(()=>{const ang=th+1.5708+(rng()-.5)*.5,pts=[];for(let t=-.1;t<=1.1;t+=.015){const al=lerp(-W*.75,W*.75,t),pe=R0*.9+Math.sin(t*3.2+1)*40;pts.push([cx+Math.cos(ang)*al-Math.sin(ang)*pe,cy+Math.sin(ang)*al+Math.cos(ang)*pe])}return pts})():null;
  const pertoL=(x,y,L,r)=>{if(!L)return false;for(const p of L)if(Math.abs(p[0]-x)<r&&Math.abs(p[1]-y)<r)return true;return false};
  if(ferrovia){for(const p of ferrovia){const r=Math.ceil(9/G),ci=p[0]/G|0,cj=p[1]/G|0;for(let dj=-r;dj<=r;dj++)for(let di=-r;di<=r;di++){const i2=ci+di,j2=cj+dj;if(i2>=0&&j2>=0&&i2<GW&&j2<GH&&Q[j2*GW+i2]>=0)Q[j2*GW+i2]=-4}}}
  // zonas
  for(const q of quadras){const dn=q.d/R0,n=fbm(q.c[0]/300+5,q.c[1]/300,2);let z;if(q.n<18)z="praca";else if(dn<.5)z="centro";else if(dn<.95)z=n<.45?"comercio":"misto";else z="residencial";
    if(pertoL(q.c[0],q.c[1],ferrovia,90)&&dn>.45&&q.n>60)z="industria";if(P.site!=="interior"&&P.site!=="rio"&&terra(q.c[0],q.c[1])<60&&q.n>80&&dn<1.4)z="porto";
    if(q.n>90&&q.n<1400&&rng()<P.green*.22&&z!=="porto")z="parque";if(q.borda&&q.n>4000)z="mato";q.z=z}
  {const pq=quadras.filter(q=>q.z==="centro"&&q.n>30).sort((a,b)=>a.d-b.d)[0];if(pq)pq.z="praca"}
  // ---- predios: casas ao longo das ruas nos suburbios; nas quadras do centro, predios encostados na rua
  const predios=[],arvores=[],carros=[],piscinas=[],conteineres=[],letreiros=[],OC=new Uint8Array(GW*GH);
  const zonaEm=(x,y)=>{const i=x/G|0,j=y/G|0;if(i<0||j<0||i>=GW||j>=GH)return null;const v=Q[j*GW+i];return v>=0?quadras[v]:null};
  const cabe=(cx_,cy_,a,L,D,q)=>{const ca=Math.cos(a),sa=Math.sin(a),pts=[];for(const [u,v] of [[-L/2,-D/2],[L/2,-D/2],[L/2,D/2],[-L/2,D/2],[0,0],[0,-D/2],[0,D/2],[-L/2,0],[L/2,0]]){const x=cx_+u*ca-v*sa,y=cy_+u*sa+v*ca,i=x/G|0,j=y/G|0;if(i<0||j<0||i>=GW||j>=GH)return null;const k=j*GW+i;if(Q[k]!==q.id||OC[k])return null}const fp=[[-L/2,-D/2],[L/2,-D/2],[L/2,D/2],[-L/2,D/2]].map(([u,v])=>[cx_+u*ca-v*sa,cy_+u*sa+v*ca]);return fp};
  const ocupa=(fp,m)=>{const xs=fp.map(p=>p[0]),ys=fp.map(p=>p[1]);for(let y=Math.min(...ys)-m;y<=Math.max(...ys)+m;y+=G)for(let x=Math.min(...xs)-m;x<=Math.max(...xs)+m;x+=G){const i=x/G|0,j=y/G|0;if(i>=0&&j>=0&&i<GW&&j<GH)OC[j*GW+i]=1}};
  const ALT={"1900":{centro:[3,6],comercio:[2,4],misto:[2,3],residencial:[1,2],industria:[1,2],porto:[1,2]},atual:{centro:[12,48],comercio:[4,14],misto:[3,7],residencial:[1,2],industria:[1,3],porto:[1,2]},cyber:{centro:[28,90],comercio:[10,32],misto:[6,16],residencial:[3,8],industria:[2,5],porto:[1,3]}}[E];
  const FORMAS={torre:E==="cyber"?["escalonada","gemeas","cilindro","escalonada","caixa","pinaculo"]:E==="1900"?["caixa"]:["caixa","escalonada","cilindro","gemeas","pinaculo","L"],predio:E==="1900"?["caixa","L","patio","cupula","caixa"]:["caixa","L","patio","caixa","escalonada","cupula"],casa:["duas","quatro","plano","duas","L"],galpao:E==="1900"?["dente","silo","caixa","chamine"]:["dente","caixa","silo","plano"]};
  const novo=(fp,c,z,ang,fl)=>{const tipo=z==="industria"||z==="porto"?"galpao":fl>=10?"torre":fl>=4?"predio":"casa";predios.push({fp,c,ang,forma:pick(FORMAS[tipo]),v:rng(),h:fl*(E==="1900"?3.2:2.4),tipo,cor:pick(PAL[E].teto),parede:pick(PAL[E].parede),vidro:PAL[E].vidro?pick(PAL[E].vidro):null,neon:E==="cyber"&&rng()<.4?pick(PAL.cyber.neon):null,z});
    if(E==="cyber"&&tipo!=="casa"&&rng()<.08)letreiros.push([c[0],c[1],pick(PAL.cyber.neon),pick(["RAMEN","HOTEL","2077","SYN","NEO","BAR","ZETA","KAIJU","NET"])])};
  // ao longo das ruas
  for(const R of ruas){for(let i=0;i<R.pts.length-1;i++){const a=R.pts[i],b=R.pts[i+1];if(!a||!b)continue;const L=Math.hypot(b[0]-a[0],b[1]-a[1]),ang=Math.atan2(b[1]-a[1],b[0]-a[0]);
    for(let t=4;t<L;t+=(E==="1900"?9:11)+rng()*3)for(const sd of[-1,1]){const px=lerp(a[0],b[0],t/L),py=lerp(a[1],b[1],t/L),q=zonaEm(px-Math.sin(ang)*sd*(R.w/2+9),py+Math.cos(ang)*sd*(R.w/2+9));if(!q||!["residencial","misto","comercio","centro"].includes(q.z))continue;
      const casa=q.z==="residencial",grande=q.z==="centro",Lb=casa?7+rng()*3:grande?14+rng()*8:9+rng()*5,Db=casa?6+rng()*2:grande?12+rng()*7:9+rng()*5,off=R.w/2+(casa?7:3)+Db/2,hx=px-Math.sin(ang)*sd*off,hy=py+Math.cos(ang)*sd*off,fp=cabe(hx,hy,ang,Lb,Db,q);if(!fp)continue;
      ocupa(fp,1);const [h0,h1]=ALT[q.z];novo(fp,[hx,hy],q.z,ang,Math.round(lerp(h0,h1,Math.pow(rng(),1.5))));
      if(casa){const bx=hx-Math.sin(ang)*sd*(Db/2+5),by=hy+Math.cos(ang)*sd*(Db/2+5);if(E==="atual"&&rng()<.25)piscinas.push([bx,by,ang]);else if(rng()<.6)arvores.push([bx+(rng()-.5)*4,by,.5+rng()*.3])}}}}
  // dentro das quadras do centro, industria e porto: predios maiores alinhados com a rua mais proxima
  for(const q of quadras){if(!["centro","comercio","industria","porto","misto"].includes(q.z))continue;const sp=q.z==="centro"?(E==="1900"?16:24):q.z==="industria"||q.z==="porto"?24:15,tries=Math.ceil(q.n*G*G/(sp*sp))*3;
  }
  {const caixa=new Map();for(let s=0;s<GW*GH;s++){const v=Q[s];if(v<0)continue;const i=s%GW,j=(s/GW)|0;let b=caixa.get(v);if(!b)caixa.set(v,b=[i,j,i,j]);if(i<b[0])b[0]=i;if(j<b[1])b[1]=j;if(i>b[2])b[2]=i;if(j>b[3])b[3]=j}
    for(const q of quadras){if(!["centro","comercio","industria","porto","misto"].includes(q.z))continue;const b=caixa.get(q.id);if(!b)continue;const sp=q.z==="centro"?(E==="1900"?15:22):q.z==="industria"||q.z==="porto"?22:14;
      for(let y=b[1]*G+sp/3;y<b[3]*G;y+=sp*.55)for(let x=b[0]*G+sp/3;x<b[2]*G;x+=sp*.55){const jx=x+(rng()-.5)*sp*.4,jy=y+(rng()-.5)*sp*.4;if(zonaEm(jx,jy)!==q)continue;const h=perto(jx,jy,60,-1,false);const ang=h?h.ang:0;
        if(q.z==="porto"&&rng()<.5){for(let m=0;m<5;m++)conteineres.push([jx+(rng()-.5)*14,jy+(rng()-.5)*10,ang,pick(["#c0392b","#2c6fb0","#e0a020","#3a8a4a","#7a4ab0"])]);continue}
        let L=sp*(.75+rng()*.35),D=sp*(.65+rng()*.3),fp=cabe(jx,jy,ang,L,D,q);if(!fp){L*=.6;D*=.6;fp=cabe(jx,jy,ang,L,D,q)}if(!fp)continue;ocupa(fp,1.5);const [h0,h1]=ALT[q.z];let fl=Math.round(lerp(h0,h1,Math.pow(rng(),1.6)*(q.z==="centro"?clamp(1.35-q.d/R0,.1,1):1)));novo(fp,[jx,jy],q.z,ang,fl)}}}
  // marcos: estadio, cupula, roda-gigante, tanques, marina
  const marcos=[];{const grandes=quadras.filter(q=>q.n>700&&!q.borda&&q.d<R0*1.6&&["misto","comercio","residencial","parque"].includes(q.z)).sort((a,b)=>b.n-a.n);
    if(grandes[0]){const q=grandes[0];q.z="estadio";marcos.push({id:"estadio",x:q.c[0],y:q.c[1],r:Math.min(46,Math.sqrt(q.n)*G*.32)})}
    const cen2=quadras.filter(q=>q.z==="centro"&&q.n>120).sort((a,b)=>a.d-b.d);if(cen2[1])marcos.push({id:E==="1900"?"cupula":rng()<.5?"cupula":"torreTV",x:cen2[1].c[0],y:cen2[1].c[1],r:14});
    const pq=quadras.filter(q=>q.z==="parque"&&q.n>200);if(pq[0]&&E!=="1900")marcos.push({id:"roda",x:pq[0].c[0],y:pq[0].c[1],r:16});
    for(const q of quadras.filter(q=>q.z==="industria").slice(0,3))for(let k=0;k<4;k++)marcos.push({id:"tanque",x:q.c[0]+(k%2)*16-8,y:q.c[1]+((k/2)|0)*12-6,r:6});
    if(P.site!=="interior"&&P.site!=="rio"){const pt=quadras.filter(q=>q.z==="porto"||q.z==="comercio").sort((a,b)=>terra(a.c[0],a.c[1])-terra(b.c[0],b.c[1]))[0];if(pt)marcos.push({id:"marina",x:pt.c[0],y:pt.c[1],r:20})}
    for(const m of marcos){for(let y=m.y-m.r;y<=m.y+m.r;y+=G)for(let x=m.x-m.r;x<=m.x+m.r;x+=G){const i=x/G|0,j=y/G|0;if(i>=0&&j>=0&&i<GW&&j<GH)OC[j*GW+i]=1}}}
  // parques e mato
  for(let s=0;s<GW*GH;s+=2){const v=Q[s];if(v<0||OC[s])continue;const q=quadras[v],i=s%GW,j=(s/GW)|0;const pr=q.z==="parque"?.09:q.z==="mato"?.05:q.z==="praca"?.012:q.z==="residencial"?.006:0;if(rng()<pr*(.4+P.green))arvores.push([i*G+rng()*G,j*G+rng()*G,.7+rng()*.5])}
  // carros
  const nC=E==="1900"?140:E==="cyber"?520:420;for(let i=0;i<nC*3&&carros.length<nC;i++){const R=ruas[(rng()*ruas.length)|0],k=(rng()*(R.pts.length-1))|0,a=R.pts[k],b=R.pts[k+1];if(!a||!b)continue;const t=rng(),ang=Math.atan2(b[1]-a[1],b[0]-a[0]),o=(rng()<.5?-1:1)*R.w*.22;carros.push([lerp(a[0],b[0],t)-Math.sin(ang)*o,lerp(a[1],b[1],t)+Math.cos(ang)*o,ang,pick(PAL[E].carro)])}
  // rodovia elevada com rampas onde passa perto das avenidas
  let rodovia=null,rampas=[],trevo=null;if(P.highway&&E!=="1900"){const ang=th+(rng()-.5)*.8,pts=[];for(let t=-.15;t<=1.15;t+=.01){const al=lerp(-W*.8,W*.8,t),pe=-R0*1.15+Math.sin(t*2.6+2)*80;pts.push([cx+Math.cos(ang)*al-Math.sin(ang)*pe,cy+Math.sin(ang)*al+Math.cos(ang)*pe])}rodovia=pts;
    let ult=-99;for(let i=6;i<pts.length-6;i++){if(i-ult<22)continue;const h=perto(pts[i][0],pts[i][1],26,-1,false);if(h&&ruas[h.r].k==="art"){ult=i;const t0=pts[i-5],t1=pts[i+5];rampas.push([[t0,[lerp(t0[0],h.p[0],.5),lerp(t0[1],h.p[1],.5)+6],h.p],[t1,[lerp(t1[0],h.p[0],.5),lerp(t1[1],h.p[1],.5)+6],h.p]]);if(!trevo&&rng()<.6)trevo={x:h.p[0],y:h.p[1]}}}}
  // metro (ou bonde) pelas avenidas
  const linhas=[];if(P.metro){const cores=E==="cyber"?["#ff3fbf","#3ff0ff","#ffe14a"]:E==="1900"?["#7a5a3a"]:["#d62d2d","#2d6fd6","#2da84a"];const arts=ruas.filter(r=>r.k==="art"&&r.pts.length>12&&r.pts[0]&&Math.hypot(r.pts[0][0]-cx,r.pts[0][1]-cy)<5);
    for(let k=0;k<Math.min(arts.length,E==="1900"?2:3);k++){const pts=arts[k].pts.filter(Boolean);linhas.push({pts,cor:cores[k%cores.length],est:pts.filter((_,i)=>i%7===3)})}}
  // nomes
  const nomes=[],usados=new Set();for(const z of ["centro","comercio","misto","residencial","industria","porto","parque"]){const qs=quadras.filter(q=>q.z===z&&q.n>60&&q.c[0]>80&&q.c[0]<W-80&&q.c[1]>40&&q.c[1]<H-40);if(!qs.length)continue;const n=Math.min(z==="residencial"?3:z==="misto"?2:1,qs.length);for(let i=0;i<n;i++){const q=qs[(rng()*qs.length)|0];const NZ={"1900":{centro:["Centro Velho","Largo do Bonde"],comercio:["Bairro Alto","Largo do Bonde"],misto:["Bairro dos Imigrantes","Alto da Colina"],residencial:["Vila Operária","Alto da Colina","Bairro dos Imigrantes"],industria:["Bairro das Fábricas","Bairro da Estação"],porto:["Cais do Carvão"],parque:["Jardim Botânico"]},atual:{centro:["Centro","Distrito Financeiro"],comercio:["Bela Vista","Moinhos"],misto:["Bairro Universitário","Vila Nova"],residencial:["Jardim América","Alto da Boa Vista","Vila Nova"],industria:["Zona Industrial"],porto:["Porto Maravilha"],parque:["Parque das Nações"]},cyber:{centro:["Torres Arasaka","Setor 7"],comercio:["Distrito Neon","Mercado Negro"],misto:["Kowloon Baixo","Colmeia"],residencial:["Colmeia","Chiba","Cidade Alta"],industria:["Zona Morta"],porto:["Docas de Sucata"],parque:["Anel Orbital"]}}[E][z]||NOMES[E];let nm=pick(NZ),g=0;while(usados.has(nm)&&g++<20)nm=pick(NZ.concat(NOMES[E]));usados.add(nm);nomes.push([q.c[0],q.c[1],nm])}}
  for(let i=predios.length-1;i>=0;i--){const b=predios[i];if(marcos.some(m=>Math.hypot(b.c[0]-m.x,b.c[1]-m.y)<m.r+6))predios.splice(i,1)}
  return {P,seed,marcos,land:terra,seco,rioPts,ruas,rotat,becos,pontes,quadras,Q,GW,GH,G,predios,arvores,carros,piscinas,conteineres,letreiros,rodovia,rampas,trevo,ferrovia,linhas,nomes,cx,cy,R0}}

function render(cv,C,DECO){DECO=DECO||{};const P=C.P,E=P.era,pal=PAL[E];cv.width=CW;cv.height=CH;const c=cv.getContext("2d"),rng=mulberry(C.seed^0x77);
  c.fillStyle="#cdbb93";c.fillRect(0,0,CW,CH);c.save();c.beginPath();c.rect(MX,MY,MW,MH);c.clip();c.translate(MX,MY);
  const poly=(p,f,s,lw)=>{c.beginPath();p.forEach((q,i)=>i?c.lineTo(q[0],q[1]):c.moveTo(q[0],q[1]));c.closePath();if(f){c.fillStyle=f;c.fill()}if(s){c.strokeStyle=s;c.lineWidth=lw||1;c.stroke()}};
  // chao por zona (grade de 3 px) e agua
  {const G=C.G,img=c.createImageData(MW,MH),d=img.data,ZC={centro:E==="cyber"?"#262836":E==="1900"?"#c8b896":"#cfcbc2",comercio:E==="cyber"?"#24263a":E==="1900"?"#cbbd98":"#d3cfc4",misto:pal.calc,residencial:E==="cyber"?"#1e2a2a":E==="1900"?"#b9b07e":"#b7c48e",industria:E==="cyber"?"#22232a":"#b4b0a6",porto:E==="cyber"?"#20222a":"#aeaaa0",parque:pal.parque,mato:E==="cyber"?"#1a3028":"#8aa05c",praca:E==="cyber"?"#2e3044":"#ddd4bf"},cz={};for(const k in ZC)cz[k]=hex(ZC[k]);
    const ag=hex(pal.agua),agE=hex(pal.aguaE),rua=hex(pal.rua),areia=E==="cyber"?[40,42,50]:[214,200,160];
    for(let y=0;y<MH;y++){const j=y/G|0;for(let x=0;x<MW;x++){const i=x/G|0,k2=j*C.GW+i,v=C.Q[k2],L=C.land(x,y);let col;
      if(v===-3||L<=4){const t=sstep(0,90,-L);col=L>-6&&L<=4?areia:[lerp(ag[0],agE[0],t),lerp(ag[1],agE[1],t),lerp(ag[2],agE[2],t)]}else if(v===-1)col=rua;else if(v===-4)col=E==="cyber"?[30,32,40]:[150,140,120];else{const q=C.quadras[v];col=q?cz[q.z]||cz.misto:cz.misto}
      const o=(y*MW+x)*4,nz=((x*7+y*13)%5)-2;d[o]=col[0]+nz;d[o+1]=col[1]+nz;d[o+2]=col[2]+nz;d[o+3]=255}}c.putImageData(img,MX,MY)}
  // ruas: calcada, asfalto e faixas
  const RS=C.ruas.slice().sort((a,b)=>a.w-b.w),traca=(R,w,cor,dash)=>{c.strokeStyle=cor;c.lineWidth=w;c.setLineDash(dash||[]);c.lineCap="round";c.lineJoin="round";c.beginPath();let up=true;for(const p of R.pts){if(!p){up=true;continue}if(up){c.moveTo(p[0],p[1]);up=false}else c.lineTo(p[0],p[1])}c.stroke();c.setLineDash([])};
  for(const R of RS)traca(R,R.w+3,E==="cyber"?"#3a3d50":E==="1900"?"#bfb293":"#e2ded4");
  for(const [a,b,w] of C.pontes){c.strokeStyle="rgba(0,0,0,.35)";c.lineWidth=w+8;c.beginPath();c.moveTo(a[0]+3,a[1]+4);c.lineTo(b[0]+3,b[1]+4);c.stroke();c.strokeStyle=E==="cyber"?"#4a4e66":"#9a968c";c.lineWidth=w+6;c.beginPath();c.moveTo(a[0],a[1]);c.lineTo(b[0],b[1]);c.stroke()}
  for(const R of RS)traca(R,R.w,pal.rua);
  for(const R of RS){if(R.k==="loc"||!pal.linha)continue;if(R.k==="art"){traca(R,.9,E==="cyber"?"#3ff0ff":"#f2d24a")}else traca(R,.7,pal.linha,[4,5])}
  for(const [x,y] of C.rotat){c.fillStyle=pal.rua;c.beginPath();c.arc(x,y,13,0,7);c.fill();c.fillStyle=E==="cyber"?"#1f6a5a":"#7fa85a";c.strokeStyle=E==="cyber"?"#3ff0ff":"#e8e4da";c.lineWidth=1.4;c.beginPath();c.arc(x,y,6,0,7);c.fill();c.stroke()}
  for(const [x,y] of C.becos){c.fillStyle=pal.rua;c.beginPath();c.arc(x,y,5.5,0,7);c.fill()}
  // ferrovia
  if(C.ferrovia){const f=C.ferrovia;c.lineCap="round";c.strokeStyle=E==="cyber"?"#11131a":"#5a5246";c.lineWidth=7;linha(c,f);c.strokeStyle=E==="cyber"?"#6a6e80":"#3a3028";c.lineWidth=1;for(const o of[-2,2]){c.beginPath();f.forEach((p,i)=>{const q=f[Math.min(f.length-1,i+1)],a=Math.atan2(q[1]-p[1],q[0]-p[0]);const x=p[0]-Math.sin(a)*o,y=p[1]+Math.cos(a)*o;i?c.lineTo(x,y):c.moveTo(x,y)});c.stroke()}
    c.strokeStyle=E==="cyber"?"#4a4e60":"#6a5a46";for(let i=0;i<f.length-1;i++){const a=Math.atan2(f[i+1][1]-f[i][1],f[i+1][0]-f[i][0]);for(let t=0;t<1;t+=.3){const x=lerp(f[i][0],f[i+1][0],t),y=lerp(f[i][1],f[i+1][1],t);c.beginPath();c.moveTo(x-Math.sin(a)*4,y+Math.cos(a)*4);c.lineTo(x+Math.sin(a)*4,y-Math.cos(a)*4);c.stroke()}}
    const e=f[Math.round(f.length*.48)],e2=f[Math.round(f.length*.48)+1],ae=Math.atan2(e2[1]-e[1],e2[0]-e[0]);c.save();c.translate(e[0],e[1]);c.rotate(ae);c.fillStyle=E==="1900"?"#9c4a32":E==="cyber"?"#2a2d3c":"#b8b4aa";c.fillRect(-36,-20,72,13);c.strokeStyle=INK(E);c.strokeRect(-36,-20,72,13);c.fillStyle=E==="cyber"?"#3ff0ff":"#ece4d0";c.fillRect(-32,-7,64,3);c.restore();
    const ti=Math.round(f.length*.3);for(let k=0;k<(E==="1900"?5:7);k++){const p=f[ti+k],q=f[ti+k+1];if(!p||!q)break;const a=Math.atan2(q[1]-p[1],q[0]-p[0]);c.save();c.translate(p[0],p[1]);c.rotate(a);c.fillStyle=k===0?(E==="1900"?"#1e1e22":E==="cyber"?"#ff3fbf":"#d62d2d"):E==="1900"?"#5a3a2a":E==="cyber"?"#2a2d3c":"#e8e6e0";c.fillRect(-7,-3,13,6);c.strokeStyle=INK(E);c.lineWidth=.6;c.strokeRect(-7,-3,13,6);c.restore()}
    if(E==="1900"){const p=f[ti];c.fillStyle="rgba(230,230,230,.6)";for(let k=0;k<6;k++){c.beginPath();c.arc(p[0]-k*5,p[1]-6-k*2,3+k,0,7);c.fill()}}}
  for(const L of C.linhas){c.save();c.globalAlpha=E==="cyber"?.85:.65;c.strokeStyle=L.cor;c.lineWidth=E==="1900"?2:3;if(E!=="1900")c.setLineDash([10,4]);linha(c,L.pts);c.restore();for(const s of L.est){c.fillStyle="#fff";c.beginPath();c.arc(s[0],s[1],5,0,7);c.fill();c.strokeStyle=L.cor;c.lineWidth=2;c.stroke();c.fillStyle=L.cor;c.font="bold 7px sans-serif";c.textAlign="center";c.textBaseline="middle";c.fillText(E==="1900"?"B":"M",s[0],s[1]+.5)}}
  for(const [x,y,a,cor] of C.carros){c.save();c.translate(x,y);c.rotate(a);c.fillStyle=cor;c.fillRect(-2.6,-1.3,5.2,2.6);if(E==="cyber"){c.fillStyle="rgba(255,255,255,.8)";c.fillRect(2,-1.2,.8,2.4)}c.restore()}
  for(const [x,y,a] of C.piscinas){c.save();c.translate(x,y);c.rotate(a);c.fillStyle="#4fb8d8";c.strokeStyle="#e8f4f8";c.lineWidth=1;c.fillRect(-4,-2.4,8,4.8);c.strokeRect(-4,-2.4,8,4.8);c.restore()}
  for(const [x,y,a,cor] of C.conteineres){c.save();c.translate(x,y);c.rotate(a);c.fillStyle=cor;c.fillRect(-5,-2,10,4);c.strokeStyle="rgba(0,0,0,.35)";c.lineWidth=.5;c.strokeRect(-5,-2,10,4);c.restore()}
  for(const m of C.marcos||[]){const {x,y,r}=m;c.save();
    if(m.id==="estadio"){c.fillStyle="rgba(0,0,0,.25)";c.beginPath();c.ellipse(x+5,y+4,r*1.1,r*.8,0,0,7);c.fill();c.fillStyle=E==="cyber"?"#2a2d3c":"#e8e6e0";c.strokeStyle=INK(E);c.lineWidth=1;c.beginPath();c.ellipse(x,y-6,r,r*.72,0,0,7);c.fill();c.stroke();c.fillStyle=E==="cyber"?"#ff3fbf":"#c0392b";c.beginPath();c.ellipse(x,y-6,r*.82,r*.58,0,0,7);c.fill();c.fillStyle="#5fa84a";c.beginPath();c.ellipse(x,y-6,r*.55,r*.36,0,0,7);c.fill();c.strokeStyle="rgba(255,255,255,.8)";c.lineWidth=.7;c.strokeRect(x-r*.4,y-6-r*.25,r*.8,r*.5);c.beginPath();c.moveTo(x,y-6-r*.25);c.lineTo(x,y-6+r*.25);c.stroke()}
    else if(m.id==="cupula"){c.fillStyle=E==="1900"?"#c8b896":"#d8d4c8";c.fillRect(x-r,y-6,r*2,6);c.strokeStyle=INK(E);c.strokeRect(x-r,y-6,r*2,6);c.fillStyle=E==="cyber"?"#3a3060":"#6f9a8a";c.beginPath();c.ellipse(x,y-6,r*.8,r*.9,0,Math.PI,0);c.fill();c.stroke();c.fillStyle="#d8c070";c.fillRect(x-1,y-6-r*.9-5,2,5)}
    else if(m.id==="torreTV"){c.strokeStyle=INK(E);c.fillStyle=E==="cyber"?"#3ff0ff":"#e8e6e0";c.lineWidth=3;c.beginPath();c.moveTo(x,y);c.lineTo(x,y-60);c.stroke();c.strokeStyle=c.fillStyle;c.lineWidth=1.6;c.stroke();c.beginPath();c.ellipse(x,y-46,6,3,0,0,7);c.fill();c.strokeStyle=INK(E);c.lineWidth=.6;c.stroke()}
    else if(m.id==="roda"){c.strokeStyle=E==="cyber"?"#ff3fbf":"#c0392b";c.lineWidth=1.4;c.beginPath();c.ellipse(x,y-r,r*.9,r,0,0,7);c.stroke();for(let k=0;k<12;k++){const a=k/12*6.28;c.beginPath();c.moveTo(x,y-r);c.lineTo(x+Math.cos(a)*r*.9,y-r+Math.sin(a)*r);c.stroke();c.fillStyle=["#e0b020","#2c6fb0","#3a8a4a"][k%3];c.fillRect(x+Math.cos(a)*r*.9-1.5,y-r+Math.sin(a)*r-1.5,3,3)}c.strokeStyle=INK(E);c.beginPath();c.moveTo(x-5,y);c.lineTo(x,y-r);c.lineTo(x+5,y);c.stroke()}
    else if(m.id==="tanque"){c.fillStyle="rgba(0,0,0,.2)";c.beginPath();c.ellipse(x+2,y+1,r,r*.6,0,0,7);c.fill();c.fillStyle=E==="cyber"?"#3a3d50":"#e4e2dc";c.strokeStyle=INK(E);c.lineWidth=.6;c.beginPath();c.ellipse(x,y-3,r,r*.6,0,0,7);c.fill();c.stroke()}
    else if(m.id==="marina"){for(let k=0;k<4;k++){c.strokeStyle=E==="cyber"?"#4a4e66":"#e8e4da";c.lineWidth=1.4;c.beginPath();c.moveTo(x-r+k*12,y);c.lineTo(x-r+k*12,y+r);c.stroke();for(let j=0;j<3;j++){c.fillStyle="#fff";c.fillRect(x-r+k*12+2,y+4+j*6,5,2.2)}}}
    c.restore()}
  // predios e arvores por profundidade. Cada predio e montado com partes (caixas empilhadas, torres gemeas, cilindros,
  // cupula, patio interno, galpao com telhado em dente de serra, silos, chamine) e telhados de varios tipos
  const K=.55,cen=p=>p.reduce((s,q)=>[s[0]+q[0]/p.length,s[1]+q[1]/p.length],[0,0]),esc=(fp,k,c0)=>{const c=c0||cen(fp);return fp.map(p=>[lerp(c[0],p[0],k),lerp(c[1],p[1],k)])};
  const janelas=(a,e,h0,h1,b)=>{const hh=(h1-h0)*K;if(b.tipo==="casa"||hh<6)return;const L=Math.hypot(e[0]-a[0],e[1]-a[1]),nf=Math.floor(hh/3.2),nj=Math.floor(L/(b.tipo==="torre"?3.4:4));for(let f=1;f<nf;f++)for(let j=0;j<nj;j++){const t=(j+.5)/nj,x=lerp(a[0],e[0],t),y=lerp(a[1],e[1],t)-h0*K-f*3.2;c.fillStyle=E==="cyber"?(rng()<.45?b.neon||"#ffe8a0":"rgba(40,50,80,.8)"):E==="1900"?"rgba(60,40,30,.55)":(rng()<.12?"#f8f0c0":"rgba(30,50,70,.42)");c.fillRect(x-.8,y-1.1,1.6,1.4)}};
  const caixa=(fp,h0,h1,b,teto,parede)=>{const c0=cen(fp),base=fp.map(p=>[p[0],p[1]-h0*K]),top=fp.map(p=>[p[0],p[1]-h1*K]);
    for(let i=0;i<fp.length;i++){const a=fp[i],e=fp[(i+1)%fp.length];if((a[1]+e[1])/2-c0[1]<=0)continue;poly([base[i],base[(i+1)%fp.length],top[(i+1)%fp.length],top[i]],parede||(b.tipo==="torre"&&b.vidro?b.vidro:b.parede),INK(E),.6);janelas(a,e,h0,h1,b)}
    poly(top,teto||b.cor,INK(E),.7);return top};
  const cilindro=(c0,r,h0,h1,b,cor)=>{const y0=c0[1]-h0*K,y1=c0[1]-h1*K;c.fillStyle=b.vidro||b.parede;c.beginPath();c.ellipse(c0[0],y0,r,r*.55,0,0,Math.PI);c.lineTo(c0[0]-r,y1);c.ellipse(c0[0],y1,r,r*.55,0,Math.PI,0,true);c.closePath();c.fill();c.strokeStyle=INK(E);c.lineWidth=.6;c.stroke();
    if(b.tipo!=="galpao")for(let y=y0-3;y>y1;y-=3.2)for(let k=-3;k<=3;k++){c.fillStyle=E==="cyber"?(rng()<.4?b.neon||"#ffe8a0":"rgba(40,50,80,.8)"):"rgba(30,50,70,.42)";c.fillRect(c0[0]+k*r/4-.6,y-1,1.2,1.3)}
    c.fillStyle=cor||b.cor;c.beginPath();c.ellipse(c0[0],y1,r,r*.55,0,0,7);c.fill();c.stroke()};
  const telhado=(top,b)=>{const c0=cen(top);c.strokeStyle="rgba(0,0,0,.32)";c.lineWidth=.7;
    if(b.forma==="duas"){c.beginPath();c.moveTo(lerp(top[0][0],top[1][0],.5),lerp(top[0][1],top[1][1],.5));c.lineTo(lerp(top[3][0],top[2][0],.5),lerp(top[3][1],top[2][1],.5));c.stroke();c.fillStyle="rgba(0,0,0,.12)";poly([top[1],top[2],[lerp(top[3][0],top[2][0],.5),lerp(top[3][1],top[2][1],.5)],[lerp(top[0][0],top[1][0],.5),lerp(top[0][1],top[1][1],.5)]],"rgba(0,0,0,.12)")}
    else if(b.forma==="quatro"){c.beginPath();for(const p of top){c.moveTo(p[0],p[1]);c.lineTo(c0[0],c0[1])}c.stroke()}
    else if(b.forma==="plano"&&E==="atual"){if(b.v<.4){c.fillStyle="#2a3a5a";const q=esc(top,.5);poly(q,"#2a3a5a","#8aa0c0",.4)}else{c.fillStyle="#9a9a9a";c.fillRect(c0[0]-1.5,c0[1]-1,3,2)}}};
  const itens=C.predios.map(b=>({y:b.c[1],b})).concat(C.arvores.map(t=>({y:t[1],t})));itens.sort((a,b)=>a.y-b.y);
  for(const it of itens){if(it.t){const [x,y,s]=it.t,r=5*s;c.fillStyle="rgba(0,0,0,.2)";c.beginPath();c.ellipse(x+2,y+1,r,r*.6,0,0,7);c.fill();c.fillStyle=E==="cyber"?"#1f6a5a":E==="1900"?"#5f7a3a":"#4f8a3a";c.beginPath();c.arc(x,y-r*.6,r,0,7);c.fill();c.fillStyle=E==="cyber"?"#3fd0a0":"#7aaa52";c.beginPath();c.arc(x-r*.3,y-r*.9,r*.45,0,7);c.fill();continue}
    const b=it.b,H=b.h,fp=b.fp,c0=cen(fp),L=Math.hypot(fp[1][0]-fp[0][0],fp[1][1]-fp[0][1]),D=Math.hypot(fp[3][0]-fp[0][0],fp[3][1]-fp[0][1]);
    poly(fp.map(p=>[p[0]+H*K*.35,p[1]+H*K*.12]),"rgba(0,0,0,"+(E==="cyber"?.35:.18)+")");
    let top;const f=b.forma;
    if(f==="escalonada"){const n=3;let h0=0;for(let k=0;k<n;k++){const h1=H*(k+1)/n;top=caixa(esc(fp,1-k*.22),h0,h1,b);h0=h1}}
    else if(f==="gemeas"){const u=[(fp[1][0]-fp[0][0])/4,(fp[1][1]-fp[0][1])/4];for(const s2 of[-1,1]){const cc=[c0[0]+u[0]*s2,c0[1]+u[1]*s2];top=caixa(esc(fp,.42,c0).map(p=>[p[0]+u[0]*s2,p[1]+u[1]*s2]),0,H*(s2<0?1:.85),b)}const m1=[c0[0],c0[1]-H*.6*K];c.strokeStyle=INK(E);c.lineWidth=1.6;c.beginPath();c.moveTo(m1[0]-u[0],m1[1]-u[1]);c.lineTo(m1[0]+u[0],m1[1]+u[1]);c.stroke()}
    else if(f==="cilindro"){cilindro(c0,Math.min(L,D)*.45,0,H,b)}
    else if(f==="pinaculo"){top=caixa(fp,0,H*.8,b);const t2=caixa(esc(fp,.55),H*.8,H*.92,b);const ap=[c0[0],c0[1]-H*1.12*K];for(let i=0;i<4;i++){const a=t2[i],e=t2[(i+1)%4];poly([a,e,ap],i%2?b.cor:"rgba(0,0,0,.25)",INK(E),.5)}}
    else if(f==="L"){const u=[(fp[1][0]-fp[0][0]),(fp[1][1]-fp[0][1])],w=[(fp[3][0]-fp[0][0]),(fp[3][1]-fp[0][1])];const A=[fp[0],[fp[0][0]+u[0],fp[0][1]+u[1]],[fp[0][0]+u[0]+w[0]*.45,fp[0][1]+u[1]+w[1]*.45],[fp[0][0]+w[0]*.45,fp[0][1]+w[1]*.45]],B2=[[fp[0][0]+w[0]*.45,fp[0][1]+w[1]*.45],[fp[0][0]+u[0]*.45+w[0]*.45,fp[0][1]+u[1]*.45+w[1]*.45],[fp[0][0]+u[0]*.45+w[0],fp[0][1]+u[1]*.45+w[1]],fp[3]];top=caixa(A,0,H,b);const t2=caixa(B2,0,H*(b.tipo==="casa"?1:.7),b);if(b.tipo==="casa"){telhado(top,{forma:"duas"});telhado(t2,{forma:"duas"})}}
    else if(f==="patio"){top=caixa(fp,0,H,b);poly(esc(top,.45),E==="cyber"?"#1f3a34":"#8fb067",INK(E),.5)}
    else if(f==="cupula"){top=caixa(fp,0,H,b);const r=Math.min(L,D)*.3,tc=cen(top);c.fillStyle=E==="1900"?"#7a9a8a":E==="cyber"?"#3a3060":"#c8c0b0";c.beginPath();c.ellipse(tc[0],tc[1],r,r*.55,0,Math.PI,0);c.ellipse(tc[0],tc[1]-r*.2,r,r*.9,0,0,Math.PI,true);c.fill();c.strokeStyle=INK(E);c.lineWidth=.6;c.stroke();c.fillStyle="#d8c070";c.fillRect(tc[0]-.6,tc[1]-r*1.2,1.2,3)}
    else if(f==="dente"){top=caixa(fp,0,H,b,E==="cyber"?"#2a2c36":"#a8aab0");c.strokeStyle="rgba(0,0,0,.35)";c.lineWidth=.8;const [p0,p1,p2,p3]=top;for(let t=.12;t<1;t+=.14){const a=[lerp(p0[0],p1[0],t),lerp(p0[1],p1[1],t)],e=[lerp(p3[0],p2[0],t),lerp(p3[1],p2[1],t)];c.beginPath();c.moveTo(a[0],a[1]);c.lineTo(e[0],e[1]);c.stroke();c.fillStyle="rgba(140,180,210,.5)";poly([a,e,[e[0]+2,e[1]-2],[a[0]+2,a[1]-2]],"rgba(140,180,210,.45)")}}
    else if(f==="silo"){const u=[(fp[1][0]-fp[0][0])/3,(fp[1][1]-fp[0][1])/3],r=Math.min(L,D)*.22;for(let k=-1;k<=1;k++)cilindro([c0[0]+u[0]*k,c0[1]+u[1]*k],r,0,H*2.2,{...b,tipo:"galpao",vidro:null,parede:E==="cyber"?"#34384a":"#c8c4bc"},E==="cyber"?"#4a4e66":"#a8a49c")}
    else if(f==="chamine"){top=caixa(fp,0,H,b,"#8a8a8e");const m=top[1];c.fillStyle="#7a3a2a";c.fillRect(m[0]-3,m[1]-20,4,20);c.strokeStyle=INK(E);c.strokeRect(m[0]-3,m[1]-20,4,20);c.fillStyle="rgba(110,110,110,.5)";for(let k=0;k<4;k++){c.beginPath();c.arc(m[0]-1+k*3,m[1]-24-k*3,3+k,0,7);c.fill()}}
    else{top=caixa(fp,0,H,b,b.tipo==="galpao"?(E==="cyber"?"#2a2c36":"#a8aab0"):null);if(b.tipo==="casa")telhado(top,b)}
    if(top&&b.tipo==="torre"&&E!=="1900"&&f!=="pinaculo"){const m=cen(top);if(b.h>60){c.strokeStyle=INK(E);c.lineWidth=.8;c.beginPath();c.moveTo(m[0],m[1]);c.lineTo(m[0],m[1]-12);c.stroke();if(E==="cyber"){c.fillStyle="#ff3f3f";c.beginPath();c.arc(m[0],m[1]-12,1.5,0,7);c.fill()}}else{c.fillStyle=E==="cyber"?"#ff3fbf":"#d8d0c0";c.fillRect(m[0]-2,m[1]-2,4,4)}}
    if(top&&b.neon&&H*K>10){c.save();c.shadowColor=b.neon;c.shadowBlur=8;poly(top,null,b.neon,1.4);c.restore()}}
  // rodovia elevada: sombra, pilares, pista com faixas e rampas descendo ate as avenidas
  if(C.rodovia){const R=C.rodovia,off=9,curva=(p,w,cor)=>{c.strokeStyle=cor;c.lineWidth=w;c.beginPath();c.moveTo(p[0][0],p[0][1]);c.quadraticCurveTo(p[1][0],p[1][1],p[2][0],p[2][1]);c.stroke()};c.lineCap="round";c.lineJoin="round";
    for(const rp of C.rampas)for(const p of rp){const q=[[p[0][0],p[0][1]-off],[p[1][0],p[1][1]-off*.5],p[2]];curva(q,10,E==="cyber"?"#4a4e66":"#c8c4bc");curva(q,7,E==="cyber"?"#1e2030":"#55585e")}
    c.strokeStyle="rgba(0,0,0,.3)";c.lineWidth=22;linha(c,R.map(p=>[p[0]+6,p[1]+4]));c.fillStyle=E==="cyber"?"#3a3d50":"#9a968c";for(let i=0;i<R.length;i+=4)c.fillRect(R[i][0]-2,R[i][1]-2,4,off);
    const Rp=R.map(p=>[p[0],p[1]-off]);c.strokeStyle=E==="cyber"?"#4a4e66":"#c8c4bc";c.lineWidth=21;linha(c,Rp);c.strokeStyle=E==="cyber"?"#1e2030":"#55585e";c.lineWidth=18;linha(c,Rp);
    c.strokeStyle=E==="cyber"?"#3ff0ff":"#f2d24a";c.lineWidth=.9;linha(c,Rp);c.setLineDash([6,6]);c.strokeStyle=E==="cyber"?"#ff3fbf":"#f4f4f0";for(const o of[-4.5,4.5]){c.beginPath();Rp.forEach((p,i)=>{const q=Rp[Math.min(Rp.length-1,i+1)],a=Math.atan2(q[1]-p[1],q[0]-p[0]),x=p[0]-Math.sin(a)*o,y=p[1]+Math.cos(a)*o;i?c.lineTo(x,y):c.moveTo(x,y)});c.stroke()}c.setLineDash([]);
    if(C.trevo){const t=C.trevo;for(const [sx,sy] of [[1,1],[-1,1],[1,-1],[-1,-1]]){const ax=t.x+sx*24,ay=t.y+sy*20-4;c.strokeStyle=E==="cyber"?"#4a4e66":"#c8c4bc";c.lineWidth=10;c.beginPath();c.arc(ax,ay,17,0,6.2832);c.stroke();c.strokeStyle=E==="cyber"?"#1e2030":"#55585e";c.lineWidth=7;c.stroke()}}
    for(let i=0;i<80;i++){const k=(rng()*Rp.length)|0,p=Rp[k],q=Rp[Math.min(Rp.length-1,k+1)],a=Math.atan2(q[1]-p[1],q[0]-p[0]),o=(rng()<.5?-1:1)*(2+rng()*5);c.save();c.translate(p[0]-Math.sin(a)*o,p[1]+Math.cos(a)*o);c.rotate(a);c.fillStyle=pal.carro[(rng()*pal.carro.length)|0];c.fillRect(-2.6,-1.2,5.2,2.4);c.restore()}}
  // letreiros neon
  for(const [x,y,cor,t] of C.letreiros){c.save();c.font="bold 8px sans-serif";c.textAlign="center";c.shadowColor=cor;c.shadowBlur=10;c.fillStyle=cor;c.fillText(t,x,y-24);c.restore()}
  if(E==="cyber"){const g=c.createRadialGradient(C.cx,C.cy,20,C.cx,C.cy,C.R0*1.4);g.addColorStop(0,"rgba(255,60,190,.12)");g.addColorStop(1,"rgba(60,240,255,0)");c.fillStyle=g;c.fillRect(0,0,MW,MH)}
  if(E==="1900"){c.fillStyle="rgba(120,90,40,.12)";c.fillRect(0,0,MW,MH)}
  // nomes
  c.textAlign="center";c.textBaseline="middle";for(const [x,y,n] of C.nomes){c.font=(E==="cyber"?"bold 15px sans-serif":E==="1900"?"16px 'IM Fell English SC',Georgia,serif":"bold 14px 'Alegreya Sans',sans-serif");c.lineWidth=4;c.strokeStyle=E==="cyber"?"rgba(10,10,20,.9)":"rgba(245,240,225,.9)";c.strokeText(n.toUpperCase(),x,y);c.fillStyle=E==="cyber"?"#3ff0ff":"#2a2118";c.fillText(n.toUpperCase(),x,y)}
  c.restore();
  if(window.AtlasGen&&AtlasGen.kit.moldura)AtlasGen.kit.moldura(c,MX,MY,MW,MH,DECO.frame||"");
  if(DECO.title!==false){c.font="30px 'IM Fell English SC',Georgia,serif";c.textAlign="center";c.textBaseline="middle";c.fillStyle="#1d160d";c.fillText((DECO.titleText||P.title||"Cidade de Aurora").toUpperCase(),CW/2,31)}
  return {n:C.predios.length}}
function hex(h){h=h.replace("#","");return [parseInt(h.slice(0,2),16),parseInt(h.slice(2,4),16),parseInt(h.slice(4,6),16)]}
function INK(E){return E==="cyber"?"#0a0b12":"#2b2114"}
function linha(c,P){c.beginPath();P.forEach((p,i)=>i?c.lineTo(p[0],p[1]):c.moveTo(p[0],p[1]));c.stroke()}
window.AtlasModerna={PARAMS,DEF,ERAS,CW,CH,generate,render};
})();
