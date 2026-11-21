// Atlas - mapa de caverna (1.15): camaras ligadas por tuneis, lago ou rio subterraneo, abismo com pontes, entrada pela borda.
// Temas: natural, cogumelos, cristais, vulcanica, gelo, ruinas anas e aquatica. Usa os carimbos de arte da regiao (cogumelos, cristais, pedras).
(function(){
"use strict";
const MW=1500,MH=1020,MX=46,MY=64,CW=MW+92,CH=MH+110,G=4,GW=Math.ceil(MW/G),GH=Math.ceil(MH/G);
const clamp=(v,a,b)=>v<a?a:v>b?b:v,lerp=(a,b,t)=>a+(b-a)*t;
function hashStr(s){let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}return h>>>0}
function mulberry(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
function ruido(seed){const r=mulberry(seed),T=new Float32Array(4096);for(let i=0;i<4096;i++)T[i]=r();const vn=(x,y)=>{const xi=Math.floor(x),yi=Math.floor(y),fx=x-xi,fy=y-yi,u=fx*fx*(3-2*fx),v=fy*fy*(3-2*fy),h=(a,b)=>T[((a&63)+((b&63)<<6))];return lerp(lerp(h(xi,yi),h(xi+1,yi),u),lerp(h(xi,yi+1),h(xi+1,yi+1),u),v)};
  return (x,y,o)=>{let s=0,a=.5,n=0;for(let i=0;i<o;i++){s+=vn(x,y)*a;n+=a;x=x*2.03+17.1;y=y*2.03+9.7;a*=.5}return s/n}}
const TEMAS=[["natural","Natural (pedra e estalagmites)"],["cogumelos","Cogumelos gigantes"],["cristais","Cristais"],["vulcanica","Vulcânica (lava)"],["gelo","Gelo"],["anao","Ruínas anãs (salões e colunas)"],["aquatica","Aquática (grutas alagadas)"]];
const PARAMS=[["seed","Semente","text"],["tema","Tema","select",TEMAS],["camaras","Câmaras","pct"],["largura","Largura dos túneis","pct"],["agua","Água ou lava","pct"],["abismo","Abismo com pontes","bool"],["entrada","Entrada pela superfície","bool"],["deco","Detalhes (pedras, estalagmites, cogumelos)","pct"],["legenda","Legenda numerada","bool"]];
const DEF={seed:"gruta-1",tema:"natural",camaras:.5,largura:.5,agua:.4,abismo:true,entrada:true,deco:.6,legenda:true};
const CAMADAS=[["deco","Pedras e estalagmites"],["plantas","Cogumelos e cristais"],["agua","Água e lava"],["pois","Pontos numerados"],["nomes","Nomes das câmaras"]];
const PAL={natural:{chao:[150,132,108],chao2:[124,108,88],rocha:[58,50,44],borda:"#2a2018",agua:[60,96,118],agua2:[36,62,84],brilho:null},
  cogumelos:{chao:[108,96,122],chao2:[86,76,100],rocha:[40,34,48],borda:"#1a1420",agua:[52,92,120],agua2:[30,56,84],brilho:"rgba(140,220,255,.2)"},
  cristais:{chao:[118,116,138],chao2:[96,94,118],rocha:[42,40,58],borda:"#16142a",agua:[70,110,150],agua2:[40,70,110],brilho:"rgba(180,160,255,.18)"},
  vulcanica:{chao:[96,76,66],chao2:[74,58,52],rocha:[34,26,24],borda:"#120a08",agua:[226,100,30],agua2:[150,40,10],brilho:"rgba(255,120,40,.16)"},
  gelo:{chao:[196,214,228],chao2:[170,190,210],rocha:[70,92,116],borda:"#24384c",agua:[90,140,180],agua2:[50,96,140],brilho:null},
  anao:{chao:[164,150,124],chao2:[140,126,102],rocha:[52,46,40],borda:"#221a12",agua:[60,96,118],agua2:[36,62,84],brilho:"rgba(255,200,120,.12)"},
  aquatica:{chao:[120,132,116],chao2:[100,112,98],rocha:[40,52,50],borda:"#14201e",agua:[56,120,130],agua2:[30,80,96],brilho:"rgba(120,255,230,.12)"}};
const NOMES={natural:["Salão das Estalagmites","Garganta Funda","Câmara do Eco","Gruta dos Morcegos","Poço Seco","Galeria Úmida","Câmara Torta"],cogumelos:["Bosque Fúngico","Câmara dos Esporos","Jardim Luminoso","Ninho dos Miconídeos","Gruta Azul"],
  cristais:["Geodo Gigante","Salão de Cristal","Câmara Cintilante","Veio de Ametista","Coração Prismático"],vulcanica:["Câmara da Forja","Rio de Fogo","Garganta de Brasa","Salão de Obsidiana","Poço Fumegante"],
  gelo:["Salão Congelado","Gruta Azul","Câmara das Estalactites","Lago Gelado","Passagem de Geada"],anao:["Grande Salão","Forja Antiga","Cripta dos Reis","Salão do Trono","Mina Abandonada","Arsenal","Câmara do Conselho"],aquatica:["Gruta Alagada","Cenote","Lago Negro","Câmara das Marés","Sifão"]};
const POIS={natural:["Ninho de morcegos","Esqueleto de aventureiro","Baú esquecido","Acampamento abandonado","Pintura rupestre","Fenda estreita"],cogumelos:["Círculo de cogumelos","Colônia de miconídeos","Esporos venenosos","Ervanário abandonado"],
  cristais:["Cristal pulsante","Golem de cristal","Veio precioso","Altar prismático"],vulcanica:["Forja antiga","Ninho de salamandra","Gêiser de vapor","Ponte de basalto"],gelo:["Criatura congelada","Lago congelado","Tesouro preso no gelo","Fonte termal"],
  anao:["Trono de pedra","Forja dos ancestrais","Tumba real","Porta selada","Armadilha de lâminas","Biblioteca rúnica"],aquatica:["Barco afundado","Ninho de criatura","Passagem submersa","Altar da maré"]};

function generate(P0){const P=Object.assign({},DEF,P0),T=P.tema,seed=hashStr(String(P.seed)+"|"+T),rng=mulberry(seed),fbm=ruido(seed^0x9e37),pick=a=>a[(rng()*a.length)|0];
  const F=new Float32Array(GW*GH).fill(-1);// >0 = chao livre
  const anao=T==="anao";
  // camaras espalhadas com distancia minima
  const nC=Math.round(9+P.camaras*14),cams=[];for(let t=0;t<nC*60&&cams.length<nC;t++){const r=anao?34+rng()*56:44+rng()*80,x=r+60+rng()*(MW-2*r-120),y=r+60+rng()*(MH-2*r-120);if(cams.some(c=>Math.hypot(c.x-x,c.y-y)<c.r+r+18))continue;cams.push({x,y,r,rx:anao?r*(1+rng()*.8):r,ry:anao?r*(.7+rng()*.5):r*(.7+rng()*.5),ang:anao?0:rng()*3.14})}
  // arvore geradora minima + alguns lacos
  const lig=[];{const dentro=new Set([0]);while(dentro.size<cams.length){let best=null,bd=1e9;for(const i of dentro)for(let j=0;j<cams.length;j++){if(dentro.has(j))continue;const d=Math.hypot(cams[i].x-cams[j].x,cams[i].y-cams[j].y);if(d<bd){bd=d;best=[i,j]}}dentro.add(best[1]);lig.push(best)}
    for(let k=0;k<Math.round(cams.length*.25);k++){const i=(rng()*cams.length)|0;let bj=-1,bd=1e9;for(let j=0;j<cams.length;j++){if(j===i||lig.some(l=>(l[0]===i&&l[1]===j)||(l[0]===j&&l[1]===i)))continue;const d=Math.hypot(cams[i].x-cams[j].x,cams[i].y-cams[j].y);if(d<bd){bd=d;bj=j}}if(bj>=0&&bd<420)lig.push([i,bj])}}
  const pintaDisco=(x,y,r,v)=>{const i0=Math.max(0,((x-r)/G)|0),i1=Math.min(GW-1,((x+r)/G)|0),j0=Math.max(0,((y-r)/G)|0),j1=Math.min(GH-1,((y+r)/G)|0);for(let j=j0;j<=j1;j++)for(let i=i0;i<=i1;i++){const d=Math.hypot(i*G-x,j*G-y);if(d<r){const k=j*GW+i;F[k]=Math.max(F[k],v*(1-d/r)+.01)}}};
  for(const c of cams){if(anao){const i0=((c.x-c.rx)/G)|0,i1=((c.x+c.rx)/G)|0,j0=((c.y-c.ry)/G)|0,j1=((c.y+c.ry)/G)|0;for(let j=Math.max(0,j0);j<=Math.min(GH-1,j1);j++)for(let i=Math.max(0,i0);i<=Math.min(GW-1,i1);i++)F[j*GW+i]=1;continue}
    for(let a=0;a<6.2832;a+=.08){const rr=c.r*(.75+fbm(Math.cos(a)*1.5+c.x*.01,Math.sin(a)*1.5+c.y*.01,3)*.5);}
    const ca=Math.cos(c.ang),sa=Math.sin(c.ang),R=Math.max(c.rx,c.ry)*1.3;for(let j=Math.max(0,((c.y-R)/G)|0);j<=Math.min(GH-1,((c.y+R)/G)|0);j++)for(let i=Math.max(0,((c.x-R)/G)|0);i<=Math.min(GW-1,((c.x+R)/G)|0);i++){const dx=i*G-c.x,dy=j*G-c.y,u=(dx*ca+dy*sa)/c.rx,v=(-dx*sa+dy*ca)/c.ry,d=Math.hypot(u,v),a=Math.atan2(v,u),borda=.78+fbm(Math.cos(a)*1.6+c.x*.013,Math.sin(a)*1.6+c.y*.013,3)*.5;if(d<borda){const k=j*GW+i;F[k]=Math.max(F[k],1-d/borda+.02)}}}
  const W0=6+P.largura*14,tuneis=[];
  for(const [a,b] of lig){const A=cams[a],B=cams[b],pts=[];const L=Math.hypot(B.x-A.x,B.y-A.y),n=Math.ceil(L/8),nx=-(B.y-A.y)/L,ny=(B.x-A.x)/L,amp=anao?0:L*.18*(rng()-.5)*2;
    for(let s=0;s<=n;s++){const t=s/n;let x=lerp(A.x,B.x,t),y=lerp(A.y,B.y,t);if(anao){x=t<.5?lerp(A.x,B.x,Math.min(1,t*2)):B.x;y=t<.5?A.y:lerp(A.y,B.y,(t-.5)*2)}else{const o=Math.sin(t*Math.PI)*amp+(fbm(x/90+a,y/90+b,2)-.5)*40;x+=nx*o;y+=ny*o}pts.push([x,y])}
    const w=anao?W0*.8:W0*(.7+rng()*.6);for(const p of pts)pintaDisco(p[0],p[1],anao?w:w*(.8+fbm(p[0]/40,p[1]/40,2)*.6),1);tuneis.push({pts,w})}
  // entrada pela borda
  let entrada=null;if(P.entrada){let best=null,bd=1e9;for(const c of cams){const ds=[[c.x,0],[c.x,MH],[0,c.y],[MW,c.y]];for(const q of ds){const d=Math.hypot(q[0]-c.x,q[1]-c.y)-c.r;if(d<bd){bd=d;best=[c,q]}}}if(best){const [c,q]=best,n=40;for(let s=0;s<=n;s++){const t=s/n,x=lerp(c.x,q[0],t),y=lerp(c.y,q[1],t);pintaDisco(x+(fbm(t*3,1,2)-.5)*30,y,W0*1.1,1)}entrada={x:q[0]===0?14:q[0]===MW?MW-14:q[0],y:q[1]===0?14:q[1]===MH?MH-14:q[1]}}}
  // aspereza da borda (automato celular leve)
  if(!anao)for(let k=0;k<GW*GH;k++){const i=k%GW,j=(k/GW)|0;F[k]+=(fbm(i*.12,j*.12,3)-.5)*.35}
  const livre=(x,y)=>{const i=x/G|0,j=y/G|0;return i>=0&&j>=0&&i<GW&&j<GH&&F[j*GW+i]>0};
  // distancia ate a parede (para sombra e decoracao)
  const DW=new Int16Array(GW*GH).fill(999);{const f=[];for(let k=0;k<GW*GH;k++)if(F[k]<=0){DW[k]=0;f.push(k)}for(let h=0;h<f.length;h++){const k=f[h],d=DW[k]+1,i=k%GW;for(const k2 of [i>0?k-1:-1,i<GW-1?k+1:-1,k-GW,k+GW]){if(k2<0||k2>=GW*GH||DW[k2]<=d)continue;DW[k2]=d;f.push(k2)}}}
  // agua ou lava: manchas de ruido dentro das camaras maiores
  const AG=new Uint8Array(GW*GH);if(P.agua>0){// lago (ou lava) so em algumas camaras grandes; na aquatica, alagado por toda parte
    const lagos=T==="aquatica"?cams:cams.slice().sort((a,b)=>b.r-a.r).slice(0,Math.max(1,Math.round(P.agua*(anao?1:4))));for(const L of lagos){const R=Math.max(L.rx,L.ry)*1.4,ox=(rng()-.5)*L.rx*.6,oy=(rng()-.5)*L.ry*.4;
      for(let j=Math.max(0,((L.y-R)/G)|0);j<=Math.min(GH-1,((L.y+R)/G)|0);j++)for(let i=Math.max(0,((L.x-R)/G)|0);i<=Math.min(GW-1,((L.x+R)/G)|0);i++){const k=j*GW+i;if(F[k]<=0||DW[k]<2)continue;const d=Math.hypot((i*G-L.x-ox)/L.rx,(j*G-L.y-oy)/L.ry)+(fbm(i*.06,j*.06,3)-.5)*.5;const lim=T==="aquatica"?.9:.55+P.agua*.25;if(d<lim)AG[k]=d<lim*.6?2:1}}}
  // abismo atravessando o mapa, com pontes onde os tuneis cruzam
  const abismo=[],pontes=[];if(P.abismo&&!anao){const ang=rng()*3.14,cx=MW/2+(rng()-.5)*300,cy=MH/2+(rng()-.5)*200;for(let t=-900;t<=900;t+=6){const o=(fbm(t/300,7,3)-.5)*260,x=cx+Math.cos(ang)*t-Math.sin(ang)*o,y=cy+Math.sin(ang)*t+Math.cos(ang)*o;abismo.push([x,y])}
    for(let s=0;s<abismo.length;s++){const [x,y]=abismo[s],w=7+fbm(s*.05,3,2)*10;for(let dj=-4;dj<=4;dj++)for(let di=-4;di<=4;di++){const i=(x/G|0)+di,j=(y/G|0)+dj;if(i<0||j<0||i>=GW||j>=GH)continue;if(Math.hypot(di*G,dj*G)<w&&F[j*GW+i]>0)AG[j*GW+i]=3}}
    for(const tn of tuneis)for(let s=1;s<tn.pts.length;s++){const p=tn.pts[s],i=p[0]/G|0,j=p[1]/G|0;if(i>=0&&j>=0&&i<GW&&j<GH&&AG[j*GW+i]===3&&!pontes.some(q=>Math.hypot(q.x-p[0],q.y-p[1])<60)){const q=tn.pts[Math.max(0,s-3)],r=tn.pts[Math.min(tn.pts.length-1,s+3)];pontes.push({x:p[0],y:p[1],ang:Math.atan2(r[1]-q[1],r[0]-q[0]),L:44,w:Math.min(14,tn.w)})}}}
  // decoracao
  const deco=[],plantas=[],colunas=[];const nD=Math.round(5200*P.deco);for(let t=0;t<nD;t++){const x=rng()*MW,y=rng()*MH,i=x/G|0,j=y/G|0;if(i<0||j<0||i>=GW||j>=GH)continue;const k=j*GW+i;if(F[k]<=0||AG[k])continue;const d=DW[k];
    if(d<=4&&rng()<.8)deco.push({k:"pedra",x,y,s:.8+rng()*.9});else if(d>3&&rng()<(T==="gelo"||T==="natural"?.22:anao?.02:.08))deco.push({k:"estal",x,y,s:.8+rng()*.8});
    if(d>2&&rng()<(T==="cogumelos"?.4:T==="cristais"?.28:T==="gelo"?.1:T==="aquatica"?.08:T==="vulcanica"?.08:anao?0:.03))plantas.push({x,y,s:.6+rng()*.7,v:rng(),k:T==="cristais"||T==="gelo"?"crist":T==="vulcanica"?"pedra":"fungo"})}
  if(anao)for(const c of cams){const nx=Math.max(1,Math.floor(c.rx*2/34)),ny=c.ry>40?2:0;for(let a=0;a<nx;a++)for(const sd of ny?[-1,1]:[]){colunas.push({x:c.x-c.rx+((a+.5)/nx)*c.rx*2,y:c.y+sd*c.ry*.55})}}
  // pontos de interesse numerados e nomes
  const pois=[],nomes=[],usadosN=new Set(),usadosP=new Set();const ordem=cams.slice().sort((a,b)=>b.r-a.r);
  for(const c of ordem.slice(0,Math.min(7,ordem.length))){const restaN=NOMES[T].filter(n=>!usadosN.has(n));if(!restaN.length)break;const nm=pick(restaN);usadosN.add(nm);nomes.push([c.x,c.y-c.ry*.55,nm])}
  for(const c of ordem.slice(0,Math.min(8,ordem.length))){const resta=POIS[T].concat(["Passagem secreta","Inscrição antiga","Ossada de criatura"]).filter(n=>!usadosP.has(n));if(!resta.length)break;const nm=pick(resta);usadosP.add(nm);let x=c.x+(rng()-.5)*c.rx*.6,y=c.y+(rng()-.5)*c.ry*.4;if(!livre(x,y)){x=c.x;y=c.y}pois.push({x,y,nome:nm})}
  if(entrada)pois.unshift({x:entrada.x,y:entrada.y,nome:"Entrada"});
  return {P,T,seed,F,DW,AG,cams,tuneis,abismo,pontes,deco,plantas,colunas,pois,nomes,entrada,quadras:cams,predios:deco}}

let STAMPS=null;
function render(cv,C,DECO){DECO=DECO||{};const HID=DECO.ocultar||{},P=C.P,T=C.T,pal=PAL[T];cv.width=CW;cv.height=CH;const c=cv.getContext("2d"),rng=mulberry(C.seed^0x77),fbm=ruido(C.seed^0x51);
  if(!STAMPS&&window.AtlasGen&&AtlasGen.makeStamps)STAMPS=AtlasGen.makeStamps(mulberry(7),2);
  c.fillStyle="#cdbb93";c.fillRect(0,0,CW,CH);c.save();c.beginPath();c.rect(MX,MY,MW,MH);c.clip();c.translate(MX,MY);
  // pixels: rocha com textura, chao com variacao e sombra junto da parede, agua/lava/abismo
  const img=c.createImageData(MW,MH),d=img.data;for(let y=0;y<MH;y++){const j=y/G|0;for(let x=0;x<MW;x++){const i=x/G|0,k=j*GW+i,o=(y*MW+x)*4,f=C.F[k];let col;
      if(f<=0){const n=fbm(x/22,y/22,3),t=fbm(x/7+3,y/7,2);col=pal.rocha.map(v=>v*(.75+n*.5)+(t-.5)*14)}
      else{const ag=HID.agua?0:C.AG[k];if(ag===3){const dd=C.DW[k];col=[10,8,12].map(v=>v+dd*1.2)}else if(ag){const n=fbm(x/30+5,y/30,2);col=(ag===2?pal.agua2:pal.agua).map(v=>v*(.92+n*.16));if(T==="vulcanica")col=col.map((v,ii)=>v*(.85+fbm(x/12,y/12,2)*.4))}
        else{const n=fbm(x/40,y/40,3),t2=fbm(x/9+7,y/9,2),dd=C.DW[k],sh=clamp(.62+dd*.07,.62,1);col=pal.chao.map((v,ii)=>lerp(v,pal.chao2[ii],n)*sh+(t2-.5)*10)}}
      d[o]=col[0];d[o+1]=col[1];d[o+2]=col[2];d[o+3]=255}}c.putImageData(img,MX,MY);
  // contorno da parede (traco de nanquim) e hachuras na rocha perto da borda
  c.strokeStyle=pal.borda;c.lineWidth=2.2;c.beginPath();for(let j=1;j<GH;j++)for(let i=1;i<GW;i++){const k=j*GW+i,a=C.F[k]>0,l=C.F[k-1]>0,u=C.F[k-GW]>0;if(a!==l){c.moveTo(i*G,j*G);c.lineTo(i*G,j*G+G)}if(a!==u){c.moveTo(i*G,j*G);c.lineTo(i*G+G,j*G)}}c.stroke();
  c.strokeStyle="rgba(0,0,0,.35)";c.lineWidth=.8;c.beginPath();for(let t=0;t<9000;t++){const x=rng()*MW,y=rng()*MH,i=x/G|0,j=y/G|0,k=j*GW+i;if(C.F[k]>0)continue;let perto=false;for(const k2 of [k+2,k-2,k+2*GW,k-2*GW,k+4,k-4])if(C.F[k2]>0){perto=true;break}if(!perto)continue;const a=rng()*6.28;c.moveTo(x,y);c.lineTo(x+Math.cos(a)*5,y+Math.sin(a)*5)}c.stroke();
  // ondas na agua, brilho na lava, borda do abismo
  if(!HID.agua){c.strokeStyle=T==="vulcanica"?"rgba(255,220,120,.6)":"rgba(230,245,255,.45)";c.lineWidth=.8;c.beginPath();for(let t=0;t<2200;t++){const x=rng()*MW,y=rng()*MH,k=(y/G|0)*GW+(x/G|0);if(C.AG[k]!==1&&C.AG[k]!==2)continue;c.moveTo(x-4,y);c.quadraticCurveTo(x,y-2,x+4,y)}c.stroke();
    if(T==="vulcanica"){c.save();c.globalCompositeOperation="lighter";for(let t=0;t<500;t++){const x=rng()*MW,y=rng()*MH,k=(y/G|0)*GW+(x/G|0);if(!C.AG[k]||C.AG[k]===3)continue;const g=c.createRadialGradient(x,y,0,x,y,22);g.addColorStop(0,"rgba(255,120,30,.12)");g.addColorStop(1,"rgba(255,120,30,0)");c.fillStyle=g;c.fillRect(x-22,y-22,44,44)}c.restore()}
    c.strokeStyle="#000";c.lineWidth=1.4;c.beginPath();for(let j=1;j<GH;j++)for(let i=1;i<GW;i++){const k=j*GW+i,a=C.AG[k]===3,l=C.AG[k-1]===3,u=C.AG[k-GW]===3;if(a!==l&&C.F[k]>0&&C.F[k-1]>0){c.moveTo(i*G,j*G);c.lineTo(i*G,j*G+G)}if(a!==u&&C.F[k]>0&&C.F[k-GW]>0){c.moveTo(i*G,j*G);c.lineTo(i*G+G,j*G)}}c.stroke()}
  // pontes
  for(const p of C.pontes){c.save();c.translate(p.x,p.y);c.rotate(p.ang);c.fillStyle=T==="vulcanica"?"#3a2a24":"#8a6a44";c.strokeStyle="#2a1a10";c.lineWidth=1;c.fillRect(-p.L/2,-p.w/2,p.L,p.w);c.strokeRect(-p.L/2,-p.w/2,p.L,p.w);c.lineWidth=.6;for(let x=-p.L/2+3;x<p.L/2;x+=3.4){c.beginPath();c.moveTo(x,-p.w/2);c.lineTo(x,p.w/2);c.stroke()}c.restore()}
  // colunas das ruinas anas
  for(const q of C.colunas){c.fillStyle="rgba(0,0,0,.3)";c.beginPath();c.ellipse(q.x+3,q.y+2,7,4,0,0,7);c.fill();c.fillStyle="#b8ac94";c.strokeStyle=pal.borda;c.lineWidth=1.2;c.beginPath();c.arc(q.x,q.y,6,0,7);c.fill();c.stroke();c.fillStyle="#d8cdb4";c.beginPath();c.arc(q.x-1.5,q.y-1.5,2.4,0,7);c.fill()}
  // pedras e estalagmites
  if(!HID.deco)for(const q of C.deco){if(q.k==="pedra"){const r=3.4*q.s;c.fillStyle=`rgb(${pal.rocha.map(v=>v+40).join(",")})`;c.strokeStyle=pal.borda;c.lineWidth=.7;c.beginPath();for(let a=0;a<6.28;a+=1.05){const rr=r*(.7+((a*997+q.x)%1)*.5);a?c.lineTo(q.x+Math.cos(a)*rr,q.y+Math.sin(a)*rr*.8):c.moveTo(q.x+rr,q.y)}c.closePath();c.fill();c.stroke()}
    else{const r=4*q.s;c.fillStyle="rgba(0,0,0,.25)";c.beginPath();c.ellipse(q.x+2,q.y+1,r,r*.5,0,0,7);c.fill();c.fillStyle=T==="gelo"?"#e4f2fa":`rgb(${pal.chao2.map(v=>v-10).join(",")})`;c.strokeStyle=pal.borda;c.lineWidth=.7;c.beginPath();c.moveTo(q.x-r,q.y);c.lineTo(q.x,q.y-r*2.2);c.lineTo(q.x+r,q.y);c.closePath();c.fill();c.stroke()}}
  // cogumelos e cristais (carimbos da regiao)
  if(!HID.plantas&&STAMPS)for(const q of C.plantas){const L=q.k==="crist"?(T==="gelo"?STAMPS.crist[14]:STAMPS.crist[15]):q.k==="pedra"?STAMPS.rockB[13]:STAMPS.fungo;if(!L||!L.length)continue;const st=L[(q.v*L.length)|0],w=st.width/2*q.s*(q.k==="fungo"?.9:1.1),h=st.height/2*q.s*(q.k==="fungo"?.9:1.1);c.drawImage(st,q.x-w/2,q.y-h*.9,w,h)}
  if(pal.brilho&&!HID.plantas){c.save();c.globalCompositeOperation="lighter";for(const q of C.plantas){if(rng()>.3)continue;const g=c.createRadialGradient(q.x,q.y-6,0,q.x,q.y-6,26);g.addColorStop(0,pal.brilho);g.addColorStop(1,"rgba(0,0,0,0)");c.fillStyle=g;c.fillRect(q.x-26,q.y-32,52,52)}c.restore()}
  // entrada: luz do dia
  if(C.entrada){const g=c.createRadialGradient(C.entrada.x,C.entrada.y,0,C.entrada.x,C.entrada.y,90);g.addColorStop(0,"rgba(255,245,210,.45)");g.addColorStop(1,"rgba(255,245,210,0)");c.fillStyle=g;c.fillRect(C.entrada.x-90,C.entrada.y-90,180,180)}
  // pontos numerados
  if(!HID.pois&&P.legenda)C.pois.forEach((p,i)=>{c.fillStyle="#f4ead0";c.strokeStyle="#7a1e14";c.lineWidth=2;c.beginPath();c.arc(p.x,p.y,9,0,7);c.fill();c.stroke();c.fillStyle="#7a1e14";c.font="bold 11px Georgia,serif";c.textAlign="center";c.textBaseline="middle";c.fillText(String(i+1),p.x,p.y+.5)});
  // nomes das camaras
  if(!HID.nomes){c.textAlign="center";c.textBaseline="middle";c.font="15px 'IM Fell English SC',Georgia,serif";for(const [x,y,n] of C.nomes){c.lineWidth=4;c.strokeStyle=T==="gelo"?"rgba(30,50,70,.85)":"rgba(240,230,205,.9)";c.strokeText(n.toUpperCase(),x,y);c.fillStyle=T==="gelo"?"#f4fbff":"#2a1d10";c.fillText(n.toUpperCase(),x,y)}}
  c.restore();
  // legenda
  if(!HID.pois&&P.legenda&&C.pois.length){const lx=MX+16,ly=MY+MH-16-C.pois.length*16-26,lw=230;c.fillStyle="rgba(240,230,205,.94)";c.strokeStyle="#3a2c1b";c.lineWidth=1.4;c.fillRect(lx,ly,lw,C.pois.length*16+26);c.strokeRect(lx,ly,lw,C.pois.length*16+26);c.fillStyle="#2a1d10";c.font="bold 13px Georgia,serif";c.textAlign="left";c.textBaseline="top";c.fillText("LEGENDA",lx+10,ly+7);c.font="12px Georgia,serif";C.pois.forEach((p,i)=>c.fillText((i+1)+". "+p.nome,lx+10,ly+24+i*16))}
  if(window.AtlasGen&&AtlasGen.kit.moldura)AtlasGen.kit.moldura(c,MX,MY,MW,MH,DECO.frame||"");
  if(DECO.title!==false){c.font="30px 'IM Fell English SC',Georgia,serif";c.textAlign="center";c.textBaseline="middle";c.fillStyle="#1d160d";c.fillText((DECO.titleText||P.title||"Caverna").toUpperCase(),CW/2,31)}
  return {n:C.cams.length}}
window.AtlasCaverna={PARAMS,DEF,CW,CH,CAMADAS,TEMAS,generate,render,resumo:C=>C.cams.length+" câmaras, "+C.tuneis.length+" túneis, "+C.pois.length+" pontos"};
})();
