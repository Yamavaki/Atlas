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

function generate(P0){const P=Object.assign({},DEF,P0),seed=hashStr(String(P.seed)+"|"+P.era+"|"+P.site),rng=mulberry(seed),fbm=ruido(seed^0x9e37),pick=a=>a[(rng()*a.length)|0];
  const W=MW,H=MH,th=rng()*6.2832,ct=Math.cos(th),st=Math.sin(th);let cx=W/2,cy=H/2;
  // agua
  let land=()=>1,rioPts=null;
  if(P.site==="costa"||P.site==="baia"){const off=P.site==="baia"?Math.min(W,H)*.22:Math.min(W,H)*.34;cx-=ct*off*.45;cy-=st*off*.45;
    land=(x,y)=>{const dx=x-W/2,dy=y-H/2,al=dx*ct+dy*st,pe=-dx*st+dy*ct;let v=off-al+(fbm(x/260,y/260,3)-.5)*120;if(P.site==="baia")v-=Math.max(0,160-Math.abs(pe)*.55)*sstep(off-200,off+40,al)*1.4;return v}}
  if(P.site==="rio"){rioPts=[];const ph=rng()*6;for(let t=-.2;t<=1.2;t+=.02){const al=lerp(-W*.7,W*.7,t),pe=Math.sin(t*4+ph)*90+(fbm(t*3,ph,2)-.5)*160;rioPts.push([W/2+ct*al-st*pe,H/2+st*al+ct*pe])}
    const segD=(x,y,a,b)=>{const ex=b[0]-a[0],ey=b[1]-a[1],l=ex*ex+ey*ey||1,u=clamp(((x-a[0])*ex+(y-a[1])*ey)/l,0,1);return Math.hypot(x-a[0]-ex*u,y-a[1]-ey*u)};
    land=(x,y)=>{let d=1e9;for(let i=0;i<rioPts.length-1;i++){const v=segD(x,y,rioPts[i],rioPts[i+1]);if(v<d)d=v}return d-34}}
  const seco=(x,y)=>land(x,y)>6;
  // malha de ruas: grade girada, deformada no traçado misto; anéis e radiais no radial
  const B=P.era==="cyber"?66:P.era==="1900"?58:74,a0=(rng()-.5)*.6,ca=Math.cos(a0),sa=Math.sin(a0),warp=P.traco==="misto"?1:0;
  const toXY=(u,v)=>{let x=u*B,y=v*B;if(P.traco==="radial"){const r=Math.hypot(u,v)*B*.9,ang=Math.atan2(v,u);x=Math.cos(ang)*r;y=Math.sin(ang)*r}
    if(warp){const d=Math.hypot(x,y)/400;x+=(fbm(u*.18+3,v*.18,2)-.5)*90*d;y+=(fbm(u*.18,v*.18+7,2)-.5)*90*d}return [cx+x*ca-y*sa,cy+x*sa+y*ca]};
  const N=Math.ceil(Math.max(W,H)/B*.75)+2,quadras=[],R0=Math.min(W,H)*(.18+P.size*.3);
  for(let v=-N;v<N;v++)for(let u=-N;u<N;u++){let poly;if(P.traco==="radial"){const r0=Math.hypot(u,v);if(r0<.5)continue;poly=[toXY(u,v),toXY(u+1,v),toXY(u+1,v+1),toXY(u,v+1)]}else poly=[toXY(u,v),toXY(u+1,v),toXY(u+1,v+1),toXY(u,v+1)];
    const c=poly.reduce((s,p)=>[s[0]+p[0]/4,s[1]+p[1]/4],[0,0]);if(c[0]<-60||c[1]<-60||c[0]>W+60||c[1]>H+60)continue;if(poly.filter(p=>seco(p[0],p[1])).length<3)continue;
    const larg=(k)=>((k%4+4)%4===0)?9:5.5,ins=[larg(v),larg(u+1),larg(v+1),larg(u)];quadras.push({u,v,poly,c,ins,d:Math.hypot(c[0]-cx,c[1]-cy)})}
  const insetQ=(q)=>{const p=q.poly,o=[];for(let i=0;i<4;i++){const a=p[i],b=p[(i+3)%4],cc=p[(i+1)%4];const m=[(a[0]*2+cc[0]+b[0])/4,(a[1]*2+cc[1]+b[1])/4];const dx=m[0]-a[0],dy=m[1]-a[1],l=Math.hypot(dx,dy)||1,k=(q.ins[i]+q.ins[(i+3)%4])/2*1.35;o.push([a[0]+dx/l*k,a[1]+dy/l*k])}return o};
  // zonas
  const ferroviaY=P.rail?(()=>{const ang=th+1.5708+(rng()-.5)*.5,pts=[];for(let t=-.1;t<=1.1;t+=.02){const al=lerp(-W*.75,W*.75,t),pe=R0*.95+Math.sin(t*3.2+1)*40;pts.push([cx+Math.cos(ang)*al-Math.sin(ang)*pe,cy+Math.sin(ang)*al+Math.cos(ang)*pe])}return pts})():null;
  const perto=(x,y,L,r)=>{if(!L)return false;for(const p of L)if(Math.abs(p[0]-x)<r&&Math.abs(p[1]-y)<r&&Math.hypot(p[0]-x,p[1]-y)<r)return true;return false};
  for(const q of quadras){const n=fbm(q.c[0]/300+5,q.c[1]/300,2),dn=q.d/R0;let z;
    if(dn<.45)z="centro";else if(dn<.9)z=n<.42?"comercio":"misto";else z="residencial";
    if(perto(q.c[0],q.c[1],ferroviaY,120)&&dn>.5)z="industria";if(land(q.c[0],q.c[1])<70&&P.site!=="interior"&&P.site!=="rio"&&rng()<.55)z=dn<.7?"porto":"industria";
    if(rng()<P.green*.16&&z!=="porto")z="parque";if(dn>1.9&&rng()<.5)z="residencial";q.z=z;q.in=insetQ(q)}
  if(quadras.length){const pq=quadras.filter(q=>q.z==="centro").sort((a,b)=>a.d-b.d)[0];if(pq)pq.z="praca"}
  // lotes e predios
  const predios=[],arvores=[],carros=[],piscinas=[],conteineres=[],letreiros=[];
  const area=p=>{let a=0;for(let i=0;i<p.length;i++){const q=p[(i+1)%p.length];a+=p[i][0]*q[1]-q[0]*p[i][1]}return Math.abs(a)/2};
  const divide=(p,alvo,out,prof)=>{if(area(p)<=alvo||prof>6){out.push(p);return}const L=(a,b)=>Math.hypot(b[0]-a[0],b[1]-a[1]),e0=L(p[0],p[1])+L(p[2],p[3]),e1=L(p[1],p[2])+L(p[3],p[0]),t=.4+rng()*.2;
    if(e0>=e1){const m1=[lerp(p[0][0],p[1][0],t),lerp(p[0][1],p[1][1],t)],m2=[lerp(p[3][0],p[2][0],t),lerp(p[3][1],p[2][1],t)];divide([p[0],m1,m2,p[3]],alvo,out,prof+1);divide([m1,p[1],p[2],m2],alvo,out,prof+1)}
    else{const m1=[lerp(p[1][0],p[2][0],t),lerp(p[1][1],p[2][1],t)],m2=[lerp(p[0][0],p[3][0],t),lerp(p[0][1],p[3][1],t)];divide([p[0],p[1],m1,m2],alvo,out,prof+1);divide([m2,m1,p[2],p[3]],alvo,out,prof+1)}};
  const encolhe=(p,k)=>{const c=p.reduce((s,q)=>[s[0]+q[0]/p.length,s[1]+q[1]/p.length],[0,0]);return p.map(q=>[lerp(c[0],q[0],k),lerp(c[1],q[1],k)])};
  const ERA=P.era,ALT={"1900":{centro:[3,6],comercio:[2,4],misto:[2,3],residencial:[1,2],industria:[1,2],porto:[1,2]},atual:{centro:[12,45],comercio:[4,12],misto:[3,7],residencial:[1,2],industria:[1,3],porto:[1,2]},cyber:{centro:[25,80],comercio:[10,30],misto:[6,16],residencial:[4,10],industria:[2,5],porto:[1,3]}}[ERA];
  for(const q of quadras){const z=q.z,poly=q.in;if(!poly||area(poly)<120)continue;
    if(z==="parque"||z==="praca"){const nA=z==="parque"?area(poly)/180:area(poly)/900;for(let i=0;i<nA;i++){const t1=rng(),t2=rng(),a=[lerp(poly[0][0],poly[1][0],t1),lerp(poly[0][1],poly[1][1],t1)],b=[lerp(poly[3][0],poly[2][0],t1),lerp(poly[3][1],poly[2][1],t1)];arvores.push([lerp(a[0],b[0],t2),lerp(a[1],b[1],t2),.8+rng()*.5])}continue}
    const alvo=z==="centro"?(ERA==="1900"?900:2600):z==="comercio"?900:z==="industria"||z==="porto"?1800:ERA==="cyber"?700:320,lotes=[];divide(poly,alvo,lotes,0);
    for(const l of lotes){const fp=encolhe(l,z==="residencial"?.62:z==="industria"||z==="porto"?.82:.9);const c=fp.reduce((s,p)=>[s[0]+p[0]/4,s[1]+p[1]/4],[0,0]);if(!seco(c[0],c[1]))continue;
      if(z==="porto"&&rng()<.55){for(let k=0;k<6;k++)conteineres.push([c[0]+(rng()-.5)*22,c[1]+(rng()-.5)*14,rng()*.3+a0,pick(["#c0392b","#2c6fb0","#e0a020","#3a8a4a","#7a4ab0"])]);continue}
      const [h0,h1]=ALT[z];let fl=Math.round(lerp(h0,h1,Math.pow(rng(),1.6)*(z==="centro"?clamp(1.3-q.d/R0,0,1):1)));const tipo=z==="industria"||z==="porto"?"galpao":fl>=10?"torre":fl>=4?"predio":"casa";
      predios.push({fp,c,h:fl*(ERA==="1900"?3.2:2.4),tipo,cor:pick(PAL[ERA].teto),parede:pick(PAL[ERA].parede),vidro:PAL[ERA].vidro?pick(PAL[ERA].vidro):null,neon:ERA==="cyber"&&rng()<.4?pick(PAL.cyber.neon):null,z});
      if(z==="residencial"){if(ERA==="atual"&&rng()<.28)piscinas.push([lerp(c[0],l[2][0],.45),lerp(c[1],l[2][1],.45),a0]);if(rng()<.7)arvores.push([lerp(c[0],l[3][0],.5),lerp(c[1],l[3][1],.5),.55+rng()*.3])}
      if(ERA==="cyber"&&tipo!=="casa"&&rng()<.1)letreiros.push([c[0],c[1],pick(PAL.cyber.neon),pick(["RAMEN","HOTEL","2077","SYN","NEO","BAR","ZETA","KAIJU","NET"])])}}
  // carros nas ruas
  const nC=ERA==="1900"?120:ERA==="cyber"?420:340;for(let i=0;i<nC*2&&carros.length<nC;i++){const q=quadras[(rng()*quadras.length)|0];if(!q)break;const k=(rng()*4)|0,a=q.poly[k],b=q.poly[(k+1)%4],t=rng(),x=lerp(a[0],b[0],t),y=lerp(a[1],b[1],t);if(!seco(x,y))continue;carros.push([x,y,Math.atan2(b[1]-a[1],b[0]-a[0]),pick(PAL[ERA].carro)])}
  // rodovia elevada (curva suave) e trevo onde cruza a avenida principal
  let rodovia=null,trevo=null;if(P.highway&&ERA!=="1900"){const ang=th+(rng()-.5)*.8,pts=[];for(let t=-.15;t<=1.15;t+=.01){const al=lerp(-W*.8,W*.8,t),pe=-R0*1.25+Math.sin(t*2.6+2)*70;pts.push([cx+Math.cos(ang)*al-Math.sin(ang)*pe,cy+Math.sin(ang)*al+Math.cos(ang)*pe])}rodovia=pts;
    const m=pts[Math.round(pts.length*.5)],m2=pts[Math.round(pts.length*.5)+1],ad=Math.atan2(m2[1]-m[1],m2[0]-m[0]);trevo={x:m[0],y:m[1],a:ad}}
  // metro (ou bonde): linhas pelas avenidas, estacoes nas esquinas grandes
  const linhas=[];if(P.metro){const cores=ERA==="cyber"?["#ff3fbf","#3ff0ff","#ffe14a"]:ERA==="1900"?["#7a5a3a","#7a5a3a"]:["#d62d2d","#2d6fd6","#2da84a"];const nL=ERA==="1900"?2:3;
    for(let k=0;k<nL;k++){const pts=[],dirU=k%2===0,off=((k*3)%5)-2;for(let s=-N;s<=N;s++){const p=dirU?toXY(s,off*2):toXY(off*2,s);if(p[0]>-40&&p[1]>-40&&p[0]<W+40&&p[1]<H+40&&seco(p[0],p[1]))pts.push(p)}if(pts.length>3)linhas.push({pts,cor:cores[k%cores.length],est:pts.filter((_,i)=>i%3===1)})}}
  // nomes dos bairros
  const nomes=[],usados=new Set();for(const z of ["centro","comercio","misto","residencial","industria","porto","parque"]){const qs=quadras.filter(q=>q.z===z);if(!qs.length)continue;const n=Math.min(z==="residencial"?3:z==="misto"?2:1,Math.ceil(qs.length/25));for(let i=0;i<n;i++){const q=qs[(rng()*qs.length)|0];let nm=pick(NOMES[ERA]);let g=0;while(usados.has(nm)&&g++<20)nm=pick(NOMES[ERA]);usados.add(nm);nomes.push([q.c[0],q.c[1],nm])}}
  return {P,seed,land,seco,rioPts,quadras,predios,arvores,carros,piscinas,conteineres,letreiros,rodovia,trevo,ferrovia:ferroviaY,linhas,nomes,cx,cy,R0,a0,B,toXY,N,avenida:pick(AVN)}}

function render(cv,C,DECO){DECO=DECO||{};const P=C.P,E=P.era,pal=PAL[E];cv.width=CW;cv.height=CH;const c=cv.getContext("2d"),rng=mulberry(C.seed^0x77);
  c.fillStyle="#cdbb93";c.fillRect(0,0,CW,CH);c.save();c.beginPath();c.rect(MX,MY,MW,MH);c.clip();c.translate(MX,MY);
  // chao e agua
  const img=c.createImageData(MW,MH),d=img.data,ch=hex(pal.chao),ag=hex(pal.agua),agE=hex(pal.aguaE);for(let y=0;y<MH;y+=2)for(let x=0;x<MW;x+=2){const L=C.land(x,y);let col;if(L>0){const k=(rng()-.5)*8;col=[ch[0]+k,ch[1]+k,ch[2]+k]}else{const t=sstep(0,90,-L);col=[lerp(ag[0],agE[0],t),lerp(ag[1],agE[1],t),lerp(ag[2],agE[2],t)]}
    for(let j=0;j<2;j++)for(let i=0;i<2;i++){const k=((y+j)*MW+x+i)*4;d[k]=col[0];d[k+1]=col[1];d[k+2]=col[2];d[k+3]=255}}c.putImageData(img,MX,MY);
  // calcadas e ruas: quadra inteira pintada de rua, calcada por cima, depois o miolo
  const poly=(p,f,s,lw)=>{c.beginPath();p.forEach((q,i)=>i?c.lineTo(q[0],q[1]):c.moveTo(q[0],q[1]));c.closePath();if(f){c.fillStyle=f;c.fill()}if(s){c.strokeStyle=s;c.lineWidth=lw||1;c.stroke()}};
  for(const q of C.quadras){if(q.poly.some(p=>!C.seco(p[0],p[1])))continue;poly(q.poly,pal.rua)}
  for(const q of C.quadras)if(q.poly.every(p=>C.seco(p[0],p[1])))poly(q.poly,null,pal.rua,1);
  if(pal.linha){c.save();c.setLineDash(E==="cyber"?[2,5]:[5,6]);c.strokeStyle=pal.linha;c.globalAlpha=E==="cyber"?.8:.55;c.lineWidth=.8;for(const q of C.quadras){if(!q.poly.every(p=>C.seco(p[0],p[1])))continue;const p=q.poly;c.beginPath();c.moveTo(p[0][0],p[0][1]);c.lineTo(p[1][0],p[1][1]);c.moveTo(p[0][0],p[0][1]);c.lineTo(p[3][0],p[3][1]);c.stroke()}c.restore()}
  for(const q of C.quadras){if(!q.in)continue;const cor=q.z==="parque"?pal.parque:q.z==="praca"?(E==="cyber"?"#2a2c3a":"#d8d0bc"):q.z==="industria"||q.z==="porto"?(E==="cyber"?"#24262e":"#b9b4a8"):pal.calc;poly(q.in,cor,E==="cyber"?"#3a3d50":"rgba(60,50,40,.35)",.8);
    if(q.z==="praca"){c.fillStyle=E==="cyber"?"#3ff0ff":"#7fb0c8";c.beginPath();const m=q.in.reduce((s,p)=>[s[0]+p[0]/4,s[1]+p[1]/4],[0,0]);c.arc(m[0],m[1],6,0,7);c.fill()}}
  // ferrovia (embaixo da rodovia)
  if(C.ferrovia){const f=C.ferrovia;c.lineCap="round";c.strokeStyle=E==="cyber"?"#3a3d4c":"#8a8070";c.lineWidth=11;linha(c,f);c.strokeStyle=E==="cyber"?"#11131a":"#5a5246";c.lineWidth=7;linha(c,f);c.strokeStyle=E==="cyber"?"#6a6e80":"#3a3028";c.lineWidth=1;for(const o of[-2,2]){c.beginPath();f.forEach((p,i)=>{const q=f[Math.min(f.length-1,i+1)],a=Math.atan2(q[1]-p[1],q[0]-p[0]);const x=p[0]-Math.sin(a)*o,y=p[1]+Math.cos(a)*o;i?c.lineTo(x,y):c.moveTo(x,y)});c.stroke()}
    c.strokeStyle=E==="cyber"?"#4a4e60":"#6a5a46";c.lineWidth=1;for(let i=0;i<f.length-1;i++){const a=Math.atan2(f[i+1][1]-f[i][1],f[i+1][0]-f[i][0]);for(let t=0;t<1;t+=.34){const x=lerp(f[i][0],f[i+1][0],t),y=lerp(f[i][1],f[i+1][1],t);c.beginPath();c.moveTo(x-Math.sin(a)*4,y+Math.cos(a)*4);c.lineTo(x+Math.sin(a)*4,y-Math.cos(a)*4);c.stroke()}}
    const e=f[Math.round(f.length*.48)],e2=f[Math.round(f.length*.48)+1],ae=Math.atan2(e2[1]-e[1],e2[0]-e[0]);c.save();c.translate(e[0],e[1]);c.rotate(ae);c.fillStyle=E==="1900"?"#9c4a32":E==="cyber"?"#2a2d3c":"#b8b4aa";c.fillRect(-34,-18,68,12);c.strokeStyle=INK(E);c.strokeRect(-34,-18,68,12);c.fillStyle=E==="cyber"?"#3ff0ff":"#ece4d0";c.fillRect(-30,-15,60,2);c.restore();
    // trem
    const ti=Math.round(f.length*.3);for(let k=0;k<(E==="1900"?5:7);k++){const p=f[ti+k],q=f[ti+k+1];if(!p||!q)break;const a=Math.atan2(q[1]-p[1],q[0]-p[0]);c.save();c.translate(p[0],p[1]);c.rotate(a);c.fillStyle=k===0?(E==="1900"?"#1e1e22":E==="cyber"?"#ff3fbf":"#d62d2d"):E==="1900"?"#5a3a2a":E==="cyber"?"#2a2d3c":"#e8e6e0";c.fillRect(-7,-3,13,6);c.strokeStyle=INK(E);c.lineWidth=.6;c.strokeRect(-7,-3,13,6);c.restore()}
    if(E==="1900"){const p=f[ti];c.fillStyle="rgba(230,230,230,.6)";for(let k=0;k<6;k++){c.beginPath();c.arc(p[0]-k*5,p[1]-6-k*2,3+k,0,7);c.fill()}}}
  // linhas de metro/bonde
  for(const L of C.linhas){c.save();c.globalAlpha=E==="cyber"?.85:.6;c.strokeStyle=L.cor;c.lineWidth=E==="1900"?2:3;if(E!=="1900")c.setLineDash([10,4]);linha(c,L.pts);c.restore();for(const s of L.est){c.fillStyle="#fff";c.beginPath();c.arc(s[0],s[1],5,0,7);c.fill();c.strokeStyle=L.cor;c.lineWidth=2;c.stroke();c.fillStyle=L.cor;c.font="bold 7px sans-serif";c.textAlign="center";c.textBaseline="middle";c.fillText(E==="1900"?"B":"M",s[0],s[1]+.5)}}
  // carros, piscinas, conteineres
  for(const [x,y,a,cor] of C.carros){c.save();c.translate(x,y);c.rotate(a);c.fillStyle=cor;c.fillRect(-2.6,-1.3,5.2,2.6);if(E==="cyber"){c.fillStyle="rgba(255,255,255,.8)";c.fillRect(2,-1.2,.8,2.4)}c.restore()}
  for(const [x,y,a] of C.piscinas){c.save();c.translate(x,y);c.rotate(a);c.fillStyle="#4fb8d8";c.strokeStyle="#e8f4f8";c.lineWidth=1;c.fillRect(-4,-2.4,8,4.8);c.strokeRect(-4,-2.4,8,4.8);c.restore()}
  for(const [x,y,a,cor] of C.conteineres){c.save();c.translate(x,y);c.rotate(a);c.fillStyle=cor;c.fillRect(-5,-2,10,4);c.strokeStyle="rgba(0,0,0,.35)";c.lineWidth=.5;c.strokeRect(-5,-2,10,4);c.restore()}
  // predios e arvores em ordem de profundidade (perspectiva obliqua: o teto sobe e a face sul aparece)
  const itens=C.predios.map(b=>({y:b.c[1],b})).concat(C.arvores.map(t=>({y:t[1],t})));itens.sort((a,b)=>a.y-b.y);const K=.55;
  for(const it of itens){if(it.t){const [x,y,s]=it.t,r=5*s;c.fillStyle="rgba(0,0,0,.2)";c.beginPath();c.ellipse(x+2,y+1,r,r*.6,0,0,7);c.fill();c.fillStyle=E==="cyber"?"#1f6a5a":E==="1900"?"#5f7a3a":"#4f8a3a";c.beginPath();c.arc(x,y-r*.6,r,0,7);c.fill();c.fillStyle=E==="cyber"?"#3fd0a0":"#7aaa52";c.beginPath();c.arc(x-r*.3,y-r*.9,r*.45,0,7);c.fill();continue}
    const b=it.b,hh=b.h*K,top=b.fp.map(p=>[p[0],p[1]-hh]);
    c.fillStyle="rgba(0,0,0,"+(E==="cyber"?.4:.22)+")";poly(b.fp.map(p=>[p[0]+hh*.35,p[1]+hh*.12]),"rgba(0,0,0,"+(E==="cyber"?.35:.18)+")");
    // faces: as que olham para baixo (y maior) aparecem
    for(let i=0;i<4;i++){const a=b.fp[i],e=b.fp[(i+1)%4];const nx=e[1]-a[1],ny=-(e[0]-a[0]);const cen=b.c;if(((a[0]+e[0])/2-cen[0])*0+((a[1]+e[1])/2-cen[1])<=0)continue;const face=[a,e,[e[0],e[1]-hh],[a[0],a[1]-hh]];poly(face,b.tipo==="torre"&&b.vidro?b.vidro:b.parede,INK(E),.6);
      if(b.tipo!=="casa"&&hh>6){const L=Math.hypot(e[0]-a[0],e[1]-a[1]),nf=Math.floor(hh/3.2),nj=Math.floor(L/4);for(let f=1;f<nf;f++)for(let j=0;j<nj;j++){const t=(j+.5)/nj,x=lerp(a[0],e[0],t),y=lerp(a[1],e[1],t)-f*3.2;c.fillStyle=E==="cyber"?(rng()<.45?b.neon||"#ffe8a0":"rgba(40,50,80,.8)"):E==="1900"?"rgba(60,40,30,.55)":(rng()<.15?"#f8f0c0":"rgba(30,50,70,.45)");c.fillRect(x-.8,y-1.1,1.6,1.4)}}}
    poly(top,b.tipo==="galpao"?(E==="cyber"?"#2a2c36":"#a8aab0"):b.cor,INK(E),.7);
    if(b.tipo==="galpao"){c.strokeStyle="rgba(0,0,0,.3)";c.lineWidth=.6;const [p0,p1,p2,p3]=top;for(let t=.2;t<1;t+=.2){c.beginPath();c.moveTo(lerp(p0[0],p1[0],t),lerp(p0[1],p1[1],t));c.lineTo(lerp(p3[0],p2[0],t),lerp(p3[1],p2[1],t));c.stroke()}if(E==="1900"){const m=top[0];c.fillStyle="#6a3a2a";c.fillRect(m[0]+2,m[1]-14,3,14);c.fillStyle="rgba(120,120,120,.5)";c.beginPath();c.arc(m[0]+4,m[1]-18,4,0,7);c.fill()}}
    if(b.tipo==="casa"&&E!=="cyber"){const m=top.reduce((s,p)=>[s[0]+p[0]/4,s[1]+p[1]/4],[0,0]);c.strokeStyle="rgba(0,0,0,.3)";c.lineWidth=.7;c.beginPath();c.moveTo(lerp(top[0][0],top[1][0],.5),lerp(top[0][1],top[1][1],.5));c.lineTo(lerp(top[3][0],top[2][0],.5),lerp(top[3][1],top[2][1],.5));c.stroke()}
    if(b.tipo==="torre"&&E!=="1900"){const m=top.reduce((s,p)=>[s[0]+p[0]/4,s[1]+p[1]/4],[0,0]);c.fillStyle=E==="cyber"?"#ff3fbf":"#d8d0c0";c.fillRect(m[0]-2,m[1]-2,4,4);if(b.h>60){c.strokeStyle=INK(E);c.beginPath();c.moveTo(m[0],m[1]);c.lineTo(m[0],m[1]-12);c.stroke();if(E==="cyber"){c.fillStyle="#ff3f3f";c.beginPath();c.arc(m[0],m[1]-12,1.5,0,7);c.fill()}}}
    if(b.neon&&hh>10){c.save();c.shadowColor=b.neon;c.shadowBlur=8;c.strokeStyle=b.neon;c.lineWidth=1.4;poly(top,null,b.neon,1.4);c.restore()}}
  // rodovia elevada por cima: pilares, sombra, pista com faixas; trevo com alças
  if(C.rodovia){const R=C.rodovia,off=8;c.lineCap="round";c.lineJoin="round";c.strokeStyle="rgba(0,0,0,.3)";c.lineWidth=20;linha(c,R.map(p=>[p[0]+6,p[1]+4]));
    c.fillStyle=E==="cyber"?"#3a3d50":"#9a968c";for(let i=0;i<R.length;i+=4){c.fillRect(R[i][0]-2,R[i][1]-2,4,off)}
    const Rp=R.map(p=>[p[0],p[1]-off]);c.strokeStyle=E==="cyber"?"#4a4e66":"#c8c4bc";c.lineWidth=19;linha(c,Rp);c.strokeStyle=E==="cyber"?"#1e2030":"#55585e";c.lineWidth=16;linha(c,Rp);
    c.strokeStyle=E==="cyber"?"#3ff0ff":"#f2d24a";c.lineWidth=.9;linha(c,Rp);c.setLineDash([6,6]);c.strokeStyle=E==="cyber"?"#ff3fbf":"#f4f4f0";for(const o of[-4,4]){c.beginPath();Rp.forEach((p,i)=>{const q=Rp[Math.min(Rp.length-1,i+1)],a=Math.atan2(q[1]-p[1],q[0]-p[0]),x=p[0]-Math.sin(a)*o,y=p[1]+Math.cos(a)*o;i?c.lineTo(x,y):c.moveTo(x,y)});c.stroke()}c.setLineDash([]);
    if(C.trevo){const t=C.trevo;for(const [sx,sy] of [[1,1],[-1,1],[1,-1],[-1,-1]]){const ax=t.x+(Math.cos(t.a)*sx-Math.sin(t.a)*sy)*30,ay=t.y+(Math.sin(t.a)*sx+Math.cos(t.a)*sy)*30-4;c.strokeStyle=E==="cyber"?"#4a4e66":"#c8c4bc";c.lineWidth=11;c.beginPath();c.arc(ax,ay,22,0,6.2832);c.stroke();c.strokeStyle=E==="cyber"?"#1e2030":"#55585e";c.lineWidth=8;c.stroke()}
      const ang=t.a+1.5708,Lx=Math.cos(ang),Ly=Math.sin(ang);c.strokeStyle=E==="cyber"?"#1e2030":"#55585e";c.lineWidth=12;c.beginPath();c.moveTo(t.x-Lx*90,t.y-Ly*90);c.lineTo(t.x+Lx*90,t.y+Ly*90);c.stroke()}
    for(let i=0;i<70;i++){const k=(rng()*Rp.length)|0,p=Rp[k],q=Rp[Math.min(Rp.length-1,k+1)],a=Math.atan2(q[1]-p[1],q[0]-p[0]),o=(rng()<.5?-1:1)*(2+rng()*4);c.save();c.translate(p[0]-Math.sin(a)*o,p[1]+Math.cos(a)*o);c.rotate(a);c.fillStyle=pal.carro[(rng()*pal.carro.length)|0];c.fillRect(-2.6,-1.2,5.2,2.4);c.restore()}}
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
