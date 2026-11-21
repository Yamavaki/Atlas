/* Atlas - gerador e renderizador de regiao (GPL-3.0). */
(function(){
"use strict";
// ---------- utilidades ----------
function hashStr(s){let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}return h>>>0}
function mulberry(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
function makeNoise(seed){
  const p=new Uint8Array(512),r=mulberry(seed);const b=new Uint8Array(256);for(let i=0;i<256;i++)b[i]=i;
  for(let i=255;i>0;i--){const j=(r()*(i+1))|0;const t=b[i];b[i]=b[j];b[j]=t}
  for(let i=0;i<512;i++)p[i]=b[i&255];
  const f=t=>t*t*(3-2*t);
  function n(x,y){const xi=Math.floor(x),yi=Math.floor(y),xf=x-xi,yf=y-yi,X=xi&255,Y=yi&255;
    const a=p[p[X]+Y],b2=p[p[X+1]+Y],c=p[p[X]+Y+1],d=p[p[X+1]+Y+1];const u=f(xf),v=f(yf);
    return ((a+(b2-a)*u)+((c+(d-c)*u)-(a+(b2-a)*u))*v)/255}
  return function fbm(x,y,o){let s=0,a=.5,fq=1,t=0;for(let i=0;i<(o||4);i++){s+=n(x*fq,y*fq)*a;t+=a;a*=.5;fq*=2.03}return s/t}
}
const clamp=(v,a,b)=>v<a?a:v>b?b:v, lerp=(a,b,t)=>a+(b-a)*t;
const sstep=(a,b,x)=>{const t=clamp((x-a)/(b-a),0,1);return t*t*(3-2*t)};
const INK="#2b2114";
// biomas: 0 temperado,1 boreal,2 neve,3 tundra,4 deserto,5 savana,6 selva,7 pantano,8 terra arrasada
const BIOMES=["Temperado","Floresta boreal","Neve","Tundra","Deserto","Savana","Selva","Pântano","Terra arrasada","Pantanal","Manguezal","Deserto de sal","Deserto negro","Vulcânico","Geleira","Floresta mágica","Terras sombrias (corrompido)","Terra dos dragões","Alienígena","Selva bioluminescente","Floresta de cogumelos gigantes"];
const BG=[[[150,154,74],[178,170,84]],[[124,138,82],[146,154,92]],[[222,228,234],[240,243,247]],[[166,168,134],[188,184,150]],[[222,184,114],[238,204,140]],[[194,172,92],[216,192,112]],[[106,140,58],[128,156,70]],[[108,122,76],[128,136,86]],[[116,94,76],[140,114,90]],[[132,152,80],[156,170,92]],[[98,112,72],[118,126,82]],[[228,226,218],[244,242,236]],[[66,62,62],[88,82,78]],[[82,66,58],[104,82,70]],[[196,218,232],[222,236,246]],[[92,130,112],[116,150,126]],[[90,82,94],[110,98,110]],[[146,90,62],[172,110,76]],[[128,94,148],[152,116,168]],[[48,88,78],[62,106,90]],[[108,98,128],[128,116,146]]];
const BF=[[62,78,36],[42,60,40],[150,164,172],[112,120,92],[176,142,92],[140,128,68],[38,70,30],[66,82,50],[82,64,50],[56,86,44],[38,64,40],[196,196,188],[56,50,46],[48,38,34],[170,196,214],[76,60,118],[50,38,58],[88,48,34],[40,150,140],[28,92,92],[70,60,110]];
const BFOR=[1,1.15,.5,.22,.05,.3,1.45,.8,.35,.55,1.3,0,.03,.08,0,1.4,.65,.1,.9,1.6,1.2];
// culturas
const RACES=["humano","anao","elfo","orc","deserto","norte","halfling","pantano","tribal","japones","chines","indiano","meso","mongol","eslavo","mediterraneo","bizantino","egipcio","celta","andino","gnomo","pirata","vapor","moderno","cyber"],RACES0=RACES.slice(0,14);
const RACE_PT={humano:"Humanos",anao:"Anões",elfo:"Elfos",orc:"Orcs",deserto:"Povo do deserto",norte:"Nórdicos",halfling:"Halflings",pantano:"Povo do pântano",tribal:"Tribais",japones:"Japoneses",chines:"Chineses",indiano:"Indianos",meso:"Mesoamericanos",mongol:"Povos da estepe",eslavo:"Eslavos",mediterraneo:"Mediterrâneos",bizantino:"Bizantinos",egipcio:"Egípcios",celta:"Celtas",andino:"Andinos",gnomo:"Gnomos",pirata:"Piratas",vapor:"Steampunk (vapor e ferrugem)",moderno:"Moderna (atual)",cyber:"Cyberpunk"};
const CUL={
  humano:{roof:["tile","tile2","tileb","dark","thatch","slate","moss"],wall:["daub","daub","daub2","daub3","brick","stone"],form:"gable",fence:"stone",st:"stone",rf:"dark"},
  anao:{roof:["slate","dark","slate","tileb"],wall:["darkstone","stone","brick"],form:"gable",low:1,fence:"stone",st:"darkstone",rf:"slate"},
  elfo:{roof:["teal","teal","leaf","blue"],wall:["white","white","daub"],form:"gable",steep:1,fence:"hedge",st:"white",rf:"teal",trees:1},
  orc:{roof:["hide","old"],wall:["wooddark","mud"],form:"round",fence:"palisade",st:"wooddark",rf:"hide"},
  deserto:{roof:["sandtop"],wall:["sand","sand2","white"],form:"flat",fence:"sand",st:"sand",rf:"sandtop"},
  norte:{roof:["shingle","old","moss"],wall:["wooddark","wood"],form:"long",fence:"palisade",st:"wooddark",rf:"shingle"},
  halfling:{roof:["leaf"],wall:["daub"],form:"mound",fence:"hedge",st:"daub",rf:"leaf",fields:1.4},
  pantano:{roof:["thatch","old"],wall:["wood","wooddark"],form:"stilt",fence:"palisade",st:"wood",rf:"thatch"},
  japones:{roof:["jp","jp","jp","thatch"],wall:["jpw","jpw","wood"],form:"asian",fence:"asian",st:"jpw",rf:"jp"},
  chines:{roof:["cn","jp","jp","cny"],wall:["red","jpw","red"],form:"asian",fence:"asian",st:"stone",rf:"cn"},
  indiano:{roof:["terra"],wall:["ochre","pink","white","sand"],form:"flat",fence:"sand",st:"sand2",rf:"terra"},
  meso:{roof:["thatch"],wall:["lime","lime","mud"],form:"flat",fence:"stone",st:"lime",rf:"thatch"},
  mongol:{roof:["felt"],wall:["felt"],form:"yurt",fence:"palisade",st:"wood",rf:"felt"},
  tribal:{roof:["thatch","old","moss"],wall:["mud","daub"],form:"round",fence:"palisade",st:"mud",rf:"thatch"},
  eslavo:{roof:["shingle","shingle","thatch","leaf","old"],wall:["wood","wood","daub","white"],form:"gable",steep:1,fence:"palisade",st:"white",rf:"leaf"},
  mediterraneo:{roof:["terra","tile2","terra"],wall:["white","white","ochre","pink","daub2"],form:"gable",lowR:1,fence:"stone",st:"white",rf:"terra"},
  bizantino:{roof:["terra","tile2","tileb"],wall:["brick","ochre","stone","daub2"],form:"gable",lowR:1,fence:"stone",st:"brick",rf:"terra"},
  egipcio:{roof:["sandtop"],wall:["sand","sand2","sand","white"],form:"flat",fence:"sand",st:"sand2",rf:"sandtop"},
  celta:{roof:["thatch","thatch","old"],wall:["daub","mud","wood"],form:"round",fence:"palisade",st:"daub",rf:"thatch",trees:1},
  andino:{roof:["thatch","thatch","old"],wall:["darkstone","stone","darkstone"],form:"gable",steep:1,fence:"stone",st:"darkstone",rf:"thatch"},
  gnomo:{roof:["blue","teal","gold","tile2","blue"],wall:["white","pink","ochre","daub3"],form:"gable",steep:1,low:1,fence:"hedge",st:"white",rf:"blue"},
  pirata:{roof:["patch","black","old","patch","shingle"],wall:["tar","shipwood","wooddark","tar","ochre"],form:"gable",fence:"palisade",st:"tar",rf:"patch",lowR:1},
  vapor:{roof:["rust","rust","copper","iron","rust","rust"],wall:["soot","brick","iron","rust","soot"],form:"gable",fence:"stone",st:"iron",rf:"iron"},
  moderno:{roof:["tile","tile2","tileb","slate","dark","tile"],wall:["m_branco","m_creme","m_conc","m_tijolo","m_areia","m_azulc","m_verdec","m_rosa","m_amarelo"],form:"gable",fence:"stone",st:"iron",rf:"iron",mod:1},
  cyber:{roof:["iron","dark","rust","iron","slate"],wall:["m_cy1","m_cy2","m_cy3","m_cy4","m_grafite"],form:"gable",fence:"stone",st:"iron",rf:"iron",mod:2}};

// ---------- dimensoes ----------
const MX=46,MY=64,TILT=0.7,K=112,G=8,O=4;
let SC=1,CW,CH,MW,MH,WX,WY,GW,GH,OW,OH;
function setScale(k){SC=k;MW=Math.round(1440*k/8)*8;MH=Math.round(1000*k/8)*8;CW=MW+92;CH=MH+110;WX=MW;WY=Math.ceil((MH+K)/TILT)+2;GW=Math.ceil(WX/G)+2;GH=Math.ceil(WY/G)+2;OW=Math.ceil(WX/O)+1;OH=Math.ceil(WY/O)+1}
setScale(1);
const NAMES=["Vrbice","Lesnov","Kamenitz","Borek","Sedletz","Dubrava","Olshany","Hradek","Zlatnik","Mokrina","Trnava","Radim","Skalna","Brezov","Jelenov","Vysoka","Lipany","Podoli","Rybnik","Chlum","Kladno","Pisek","Tabor","Velim","Kourim","Ledec","Hostin","Mlada","Ronov","Zbirov","Krivo","Strakov","Libice","Vlasim","Sobotka","Dolany","Lomnice","Ostrov","Bechyn","Pacov","Nymburk","Hlinsko","Rokyce","Svitava","Jaromer","Polna","Ujezd","Vranov","Lhota","Bystrice","Cerhov","Doubrava","Hrusov","Kamyk","Lazne","Medlov","Nedvez","Orlik","Prosec","Stary Brod"];

function sampleGrid(g,x,y){const gx=clamp(x/G,0,GW-1.001),gy=clamp(y/G,0,GH-1.001),xi=gx|0,yi=gy|0,fx=gx-xi,fy=gy-yi,i=yi*GW+xi;
  const a=g[i],b=g[i+1],c=g[i+GW],d=g[i+GW+1];return (a+(b-a)*fx)+((c+(d-c)*fx)-(a+(b-a)*fx))*fy}
function upsample(g,out){for(let y=0;y<WY;y++){const gy=Math.min(y/G,GH-1.001),yi=gy|0,fy=gy-yi,r=yi*GW;
  for(let x=0;x<WX;x++){const gx=x/G,xi=gx|0,fx=gx-xi,i=r+xi;const a=g[i],b=g[i+1],c=g[i+GW],d=g[i+GW+1];
    out[y*WX+x]=(a+(b-a)*fx)+((c+(d-c)*fx)-(a+(b-a)*fx))*fy}}}
function resample(p,st){const o=[p[0]];let acc=0;for(let i=0;i<p.length-1;i++){const a=p[i],b=p[i+1],l=Math.hypot(b[0]-a[0],b[1]-a[1]);let t=st-acc;while(t<=l){o.push([a[0]+(b[0]-a[0])*t/l,a[1]+(b[1]-a[1])*t/l]);t+=st}acc=l-(t-st)}const e=p[p.length-1],q=o[o.length-1];if(Math.hypot(e[0]-q[0],e[1]-q[1])>.5)o.push(e);return o}
function simp(p,tol){if(p.length<3)return p.map(q=>[q[0],q[1]]);const keep=new Uint8Array(p.length);keep[0]=keep[p.length-1]=1;const st=[[0,p.length-1]];
  while(st.length){const [a,b]=st.pop();let m=-1,md=tol;const ax=p[a][0],ay=p[a][1],dx=p[b][0]-ax,dy=p[b][1]-ay,l=Math.hypot(dx,dy);for(let i=a+1;i<b;i++){const d=l<1?Math.hypot(p[i][0]-ax,p[i][1]-ay):Math.abs((p[i][0]-ax)*dy-(p[i][1]-ay)*dx)/l;if(d>md){md=d;m=i}}if(m>0){keep[m]=1;st.push([a,m],[m,b])}}
  return p.filter((_,i)=>keep[i]).map(q=>[Math.round(q[0]),Math.round(q[1])])}
function inPoly(p,x,y){let c=false;for(let i=0,j=p.length-1;i<p.length;j=i++){const a=p[i],b=p[j];if((a[1]>y)!==(b[1]>y)&&x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0])c=!c}return c}
function dsegPoly(p,x,y){let m=1e9;for(let i=0;i<p.length;i++)m=Math.min(m,dseg(x,y,p[i],p[(i+1)%p.length]));return m}
function dseg(x,y,a,b){const dx=b[0]-a[0],dy=b[1]-a[1],l=dx*dx+dy*dy||1,t=clamp(((x-a[0])*dx+(y-a[1])*dy)/l,0,1);return Math.hypot(x-a[0]-dx*t,y-a[1]-dy*t)}

function chaikin(p,n){for(let k=0;k<n;k++){const q=[p[0]];for(let i=0;i<p.length-1;i++){const a=p[i],b=p[i+1];q.push([a[0]*.75+b[0]*.25,a[1]*.75+b[1]*.25],[a[0]*.25+b[0]*.75,a[1]*.25+b[1]*.75])}q.push(p[p.length-1]);p=q}return p}

// ---------- carimbos por codigo ----------
function makeStamps(rng,ss){const SS=ss||1;
  const pal=[["#5d7534","#8a9c48"],["#4f6a2f","#7a9040"],["#677a36","#96a34c"],["#48602e","#6f8840"]];
  const dec=[],con=[];
  for(const [body,hi] of pal)for(let v=0;v<3;v++){
    const c=document.createElement("canvas");c.width=34*SS;c.height=38*SS;c.lw=34;c.lh=38;const x=c.getContext("2d");x.scale(SS,SS);
    x.fillStyle="rgba(22,28,8,.36)";x.beginPath();x.ellipse(21,33,10,4,0,0,7);x.fill();
    x.strokeStyle="#5b3d1e";x.lineWidth=2.2;x.beginPath();x.moveTo(17,35);x.lineTo(17,25);x.stroke();
    const lobes=[[17,16,8.4]];const n=4+((rng()*3)|0);
    for(let i=0;i<n;i++){const a=rng()*6.28,d=4.5+rng()*3.5;lobes.push([17+Math.cos(a)*d,16+Math.sin(a)*d*.8,4.6+rng()*2.6])}
    x.fillStyle="#1f260d";for(const[lx,ly,lr]of lobes){x.beginPath();x.arc(lx+.4,ly+.6,lr+1.5,0,7);x.fill()}
    x.fillStyle=body;for(const[lx,ly,lr]of lobes){x.beginPath();x.arc(lx,ly,lr,0,7);x.fill()}
    x.fillStyle=hi;x.globalAlpha=.9;for(const[lx,ly,lr]of lobes){x.beginPath();x.arc(lx-lr*.25,ly-lr*.3,lr*.6,0,7);x.fill()}
    x.globalAlpha=.7;x.strokeStyle="#1f260d";x.lineWidth=.8;
    for(const[lx,ly,lr]of lobes){x.beginPath();x.arc(lx,ly,lr*.72,.1,1.7);x.stroke();if(lr>5.5){x.beginPath();x.arc(lx,ly,lr*.45,.2,1.5);x.stroke()}
      x.beginPath();x.arc(lx,ly,lr,3.6,5.2);x.stroke()}
    x.globalAlpha=1;dec.push(c)}
  for(let v=0;v<4;v++){const c=document.createElement("canvas");c.width=34*SS;c.height=38*SS;c.lw=34;c.lh=38;const x=c.getContext("2d");x.scale(SS,SS);
    x.fillStyle="rgba(22,28,8,.36)";x.beginPath();x.ellipse(20,34,8,3,0,0,7);x.fill();
    x.strokeStyle="#5b3d1e";x.lineWidth=2;x.beginPath();x.moveTo(17,36);x.lineTo(17,30);x.stroke();
    const w=7+rng()*2;x.lineWidth=1;x.strokeStyle="#161d0b";x.lineJoin="round";
    for(let t=0;t<3;t++){const y0=31-t*7,ww=w*(1-t*.22);x.beginPath();x.moveTo(17-ww,y0);x.lineTo(17,y0-12);x.lineTo(17+ww,y0);x.closePath();x.fillStyle=v%2?"#3c5230":"#34482a";x.fill();x.stroke();
      x.fillStyle="rgba(120,140,70,.5)";x.beginPath();x.moveTo(17-ww*.8,y0-1);x.lineTo(17,y0-11);x.lineTo(17-ww*.1,y0-1);x.closePath();x.fill()}
    con.push(c)}
  const bush=[],rock=[];
  for(let v=0;v<6;v++){const c=document.createElement("canvas");c.width=20*SS;c.height=15*SS;c.lw=20;c.lh=15;const x=c.getContext("2d");x.scale(SS,SS);
    x.fillStyle="rgba(22,28,8,.3)";x.beginPath();x.ellipse(11,12,7,2.5,0,0,7);x.fill();
    const lb=[];const n=3+((rng()*3)|0);for(let i=0;i<n;i++)lb.push([5+rng()*10,7+rng()*3,2.6+rng()*1.8]);
    const col=v%3===0?["#566b2c","#7e9142"]:v%3===1?["#4c6230","#6f8a45"]:["#6a7433","#929a4b"];
    x.fillStyle="#1f260d";for(const[a,b,r]of lb){x.beginPath();x.arc(a,b,r+1,0,7);x.fill()}
    x.fillStyle=col[0];for(const[a,b,r]of lb){x.beginPath();x.arc(a,b,r,0,7);x.fill()}
    x.fillStyle=col[1];for(const[a,b,r]of lb){x.beginPath();x.arc(a-r*.3,b-r*.35,r*.5,0,7);x.fill()}
    bush.push(c)}
  for(let v=0;v<8;v++){const c=document.createElement("canvas");c.width=18*SS;c.height=14*SS;c.lw=18;c.lh=14;const x=c.getContext("2d");x.scale(SS,SS);
    x.fillStyle="rgba(30,25,10,.3)";x.beginPath();x.ellipse(10,11.5,7,2.3,0,0,7);x.fill();
    const n=6+((rng()*3)|0),pts=[];for(let i=0;i<n;i++){const a=3.1416+i/(n-1)*3.1416,r=4.5+rng()*2.5;pts.push([9+Math.cos(a)*r*1.15,11+Math.sin(a)*r])}
    x.lineJoin="round";x.lineWidth=.9;x.strokeStyle=INK;x.beginPath();x.moveTo(pts[0][0],pts[0][1]);for(const q of pts)x.lineTo(q[0],q[1]);x.closePath();
    const g=x.createLinearGradient(3,4,15,12);g.addColorStop(0,"#c9c2ae");g.addColorStop(1,"#857d6b");x.fillStyle=g;x.fill();x.stroke();
    const m=pts[(n/2)|0];x.fillStyle="rgba(70,62,48,.55)";x.beginPath();x.moveTo(m[0],m[1]);x.lineTo(pts[n-2][0],pts[n-2][1]);x.lineTo(pts[n-1][0],pts[n-1][1]);x.lineTo(m[0]+1,11);x.closePath();x.fill();
    x.strokeStyle="rgba(50,40,25,.6)";x.lineWidth=.6;x.beginPath();x.moveTo(m[0],m[1]+.5);x.lineTo(m[0]+1,10.5);x.moveTo(pts[1][0]+2,pts[1][1]+1.5);x.lineTo(pts[1][0]+4,pts[1][1]+2);x.stroke();
    rock.push(c)}
  const mk=(w,h,f)=>{const c=document.createElement("canvas");c.width=w*SS;c.height=h*SS;c.lw=w;c.lh=h;const xx=c.getContext("2d");xx.scale(SS,SS);f(xx);return c};
  const shadow=(x,cx,cy,rx,ry)=>{x.fillStyle="rgba(22,28,8,.32)";x.beginPath();x.ellipse(cx,cy,rx,ry,0,0,7);x.fill()};
  const blob=(x,lobes,body,hi,ink)=>{x.fillStyle=ink;for(const[a,b,r]of lobes){x.beginPath();x.arc(a+.4,b+.6,r+1.4,0,7);x.fill()}x.fillStyle=body;for(const[a,b,r]of lobes){x.beginPath();x.arc(a,b,r,0,7);x.fill()}x.fillStyle=hi;x.globalAlpha=.85;for(const[a,b,r]of lobes){x.beginPath();x.arc(a-r*.25,b-r*.3,r*.55,0,7);x.fill()}x.globalAlpha=1};
  const palm=[],acacia=[],cactus=[],snowpine=[],dead=[],willow=[],jungle=[],reed=[];
  for(let v=0;v<4;v++)palm.push(mk(34,38,x=>{shadow(x,20,34,7,2.6);const lean=(rng()-.5)*6;x.strokeStyle="#6b4a2a";x.lineWidth=2.2;x.beginPath();x.moveTo(17,35);x.quadraticCurveTo(17+lean*.3,24,17+lean,13);x.stroke();
    x.strokeStyle=INK;x.lineWidth=.5;for(let k=0;k<5;k++){x.beginPath();x.moveTo(16,33-k*4.5);x.lineTo(18.5,32.5-k*4.5);x.stroke()}
    const cx=17+lean,cy=13;for(let i=0;i<7;i++){const a=-3.1416+i/6*3.1416+(rng()-.5)*.3,l=9+rng()*3;x.strokeStyle="#1f300f";x.lineWidth=3.6;x.beginPath();x.moveTo(cx,cy);x.quadraticCurveTo(cx+Math.cos(a)*l*.6,cy+Math.sin(a)*l*.6-3,cx+Math.cos(a)*l,cy+Math.sin(a)*l*.5+3);x.stroke();
      x.strokeStyle=i%2?"#4f7a2c":"#5f8c34";x.lineWidth=2.4;x.stroke()}}));
  for(let v=0;v<3;v++)acacia.push(mk(40,34,x=>{shadow(x,22,30,11,2.6);x.strokeStyle="#5e4128";x.lineWidth=1.8;x.beginPath();x.moveTo(20,31);x.lineTo(19,20);x.lineTo(14,13);x.moveTo(19,20);x.lineTo(25,12);x.stroke();
    const l=[];for(let i=0;i<6;i++)l.push([9+i*4.4+(rng()-.5)*2,10+(rng()-.5)*2.4,3.6+rng()*1.4]);blob(x,l,"#6f7a33","#98a24a","#26300f");
    x.fillStyle="#26300f";x.globalAlpha=.4;x.fillRect(9,12.5,24,1.4);x.globalAlpha=1}));
  for(let v=0;v<4;v++)cactus.push(mk(22,30,x=>{shadow(x,13,27,6,2);x.lineCap="round";x.lineJoin="round";
    const seg=(pts,w)=>{x.strokeStyle=INK;x.lineWidth=w+1.6;x.beginPath();pts.forEach((p,i)=>i?x.lineTo(p[0],p[1]):x.moveTo(p[0],p[1]));x.stroke();x.strokeStyle="#6f8048";x.lineWidth=w;x.stroke();x.strokeStyle="#93a362";x.lineWidth=w*.32;x.beginPath();pts.forEach((p,i)=>i?x.lineTo(p[0]-w*.18,p[1]):x.moveTo(p[0]-w*.18,p[1]));x.stroke()};
    const H0=19+rng()*4;seg([[11,27],[11,27-H0]],4.4);if(v%2===0)seg([[11,18],[6,18],[6,11-rng()*2]],2.8);if(v<3)seg([[11,15],[16,15],[16,8-rng()*2]],2.8);
    x.strokeStyle="rgba(40,48,20,.55)";x.lineWidth=.5;for(let k=0;k<6;k++){const yy=26-k*3;x.beginPath();x.moveTo(12,yy);x.lineTo(13,yy-1);x.stroke()}}));
  for(let v=0;v<4;v++)snowpine.push(mk(34,38,x=>{shadow(x,20,34,8,3);x.strokeStyle="#5b3d1e";x.lineWidth=2;x.beginPath();x.moveTo(17,36);x.lineTo(17,30);x.stroke();const w=7+rng()*2;x.lineWidth=1;x.strokeStyle="#161d0b";x.lineJoin="round";
    for(let t=0;t<3;t++){const y0=31-t*7,ww=w*(1-t*.22);x.beginPath();x.moveTo(17-ww,y0);x.lineTo(17,y0-12);x.lineTo(17+ww,y0);x.closePath();x.fillStyle=v%2?"#33483a":"#2c4034";x.fill();x.stroke();
      x.fillStyle="#f2f5f7";x.beginPath();x.moveTo(17-ww*.85,y0-1);x.quadraticCurveTo(17-ww*.3,y0-3,17,y0-12);x.quadraticCurveTo(17+ww*.25,y0-5,17+ww*.75,y0-1.5);x.quadraticCurveTo(17,y0-4.5,17-ww*.85,y0-1);x.fill()}}));
  for(let v=0;v<4;v++)dead.push(mk(30,34,x=>{shadow(x,17,31,7,2.2);x.strokeStyle="#3b2a1c";x.lineCap="round";const br=(x0,y0,a,l,w,d)=>{const x1=x0+Math.cos(a)*l,y1=y0+Math.sin(a)*l;x.lineWidth=w;x.beginPath();x.moveTo(x0,y0);x.lineTo(x1,y1);x.stroke();if(d>0){br(x1,y1,a-.5-rng()*.3,l*.68,w*.62,d-1);br(x1,y1,a+.45+rng()*.3,l*.62,w*.6,d-1)}};
    br(15,31,-1.5708+(rng()-.5)*.2,9,2.6,3)}));
  for(let v=0;v<3;v++)willow.push(mk(36,38,x=>{shadow(x,20,34,10,3);x.strokeStyle="#4e3a24";x.lineWidth=2.4;x.beginPath();x.moveTo(18,35);x.lineTo(18,20);x.stroke();
    blob(x,[[18,15,8],[12,17,5.5],[24,17,5.5]],"#617a3c","#88a052","#1f2a0e");x.strokeStyle="#46602a";x.lineWidth=1;for(let i=0;i<12;i++){const sx=8+i*1.8;x.beginPath();x.moveTo(sx,16+rng()*3);x.quadraticCurveTo(sx+.5,24,sx-.4,28+rng()*4);x.stroke()}}));
  for(let v=0;v<4;v++)jungle.push(mk(40,44,x=>{shadow(x,23,40,12,3.5);x.strokeStyle="#4a321c";x.lineWidth=2.6;x.beginPath();x.moveTo(20,41);x.lineTo(20,28);x.stroke();
    const l=[[20,18,10]];for(let i=0;i<6;i++){const a=rng()*6.28,d=5+rng()*5;l.push([20+Math.cos(a)*d,18+Math.sin(a)*d*.75,5+rng()*3])}blob(x,l,v%2?"#2f5e26":"#3a6a2a","#5c8f3a","#132408")}));
  for(let v=0;v<3;v++)reed.push(mk(16,14,x=>{x.strokeStyle="#6a7a3a";x.lineWidth=.9;for(let i=0;i<7;i++){const sx=3+i*1.6+rng();x.beginPath();x.moveTo(sx,13);x.quadraticCurveTo(sx+(rng()-.5)*3,7,sx+(rng()-.5)*4,2+rng()*3);x.stroke()}x.fillStyle="#5b3d1e";x.fillRect(6,3,1.4,3);x.fillRect(10,4,1.4,3)}));
  const decTree=(body,hi,ink,trunk,pts)=>mk(34,38,x=>{shadow(x,21,33,10,4);x.strokeStyle=trunk||"#5b3d1e";x.lineWidth=2.2;x.beginPath();x.moveTo(17,35);x.lineTo(17,25);x.stroke();
    const lobes=[[17,16,8.4]];const n=4+((rng()*3)|0);for(let i=0;i<n;i++){const a=rng()*6.28,d=4.5+rng()*3.5;lobes.push([17+Math.cos(a)*d,16+Math.sin(a)*d*.8,4.6+rng()*2.6])}
    blob(x,lobes,body,hi,ink);x.globalAlpha=.6;x.strokeStyle=ink;x.lineWidth=.8;for(const[lx,ly,lr]of lobes){x.beginPath();x.arc(lx,ly,lr*.72,.1,1.7);x.stroke();x.beginPath();x.arc(lx,ly,lr,3.6,5.2);x.stroke()}x.globalAlpha=1;
    if(pts){x.fillStyle=pts;for(let k=0;k<14;k++){const[lx,ly,lr]=lobes[(rng()*lobes.length)|0],a=rng()*6.28,d=rng()*lr*.8;x.beginPath();x.arc(lx+Math.cos(a)*d,ly+Math.sin(a)*d,.8,0,7);x.fill()}}});
  const autumn=[],sakura=[],blossom=[],birch=[],bare=[],rockc=[],rocks=[];
  for(const [b,h] of [["#b8642a","#de9a4a"],["#a8402a","#d0703c"],["#c99a2e","#e8c45a"],["#9a5a2a","#c88a42"],["#b8762e","#e0a850"]])autumn.push(decTree(b,h,"#3a1e0c"));
  for(let v=0;v<4;v++)sakura.push(decTree(v%2?"#e8a8b8":"#df98ac","#f6d4dc","#5a2a34","#4a3028","#fff2f4"));
  for(let v=0;v<3;v++)blossom.push(decTree("#e8e4d6","#fbfaf2","#4a4a3a",null,"#f4c8d2"));
  for(let v=0;v<4;v++)birch.push(mk(30,40,x=>{shadow(x,18,36,7,2.6);x.strokeStyle=INK;x.lineWidth=2.6;x.beginPath();x.moveTo(15,37);x.lineTo(15,16);x.stroke();x.strokeStyle="#ece8dc";x.lineWidth=1.6;x.stroke();x.fillStyle=INK;for(let k=0;k<4;k++)x.fillRect(14.4,33-k*4.5,1.3,.8);
    const l=[];for(let i=0;i<6;i++)l.push([15+(rng()-.5)*9,8+i*2.4+(rng()-.5)*2,3.2+rng()*1.6]);blob(x,l,"#89a24a","#b4c86a","#26330e")}));
  for(let v=0;v<3;v++)bare.push(mk(30,34,x=>{shadow(x,17,31,7,2.2);x.strokeStyle="#5a4434";x.lineCap="round";const br=(x0,y0,a,l,w,d)=>{const x1=x0+Math.cos(a)*l,y1=y0+Math.sin(a)*l;x.lineWidth=w;x.beginPath();x.moveTo(x0,y0);x.lineTo(x1,y1);x.stroke();if(d>0){br(x1,y1,a-.45-rng()*.3,l*.7,w*.62,d-1);br(x1,y1,a+.4+rng()*.3,l*.66,w*.6,d-1)}};br(15,31,-1.5708+(rng()-.5)*.2,8,2.4,4);
    x.fillStyle="rgba(240,244,248,.85)";for(let k=0;k<6;k++){x.beginPath();x.arc(8+rng()*14,8+rng()*12,1.1,0,7);x.fill()}}));
  const rockShape=(x,cx,cy,w,h,c0,c1)=>{const n=7,pts=[];for(let i=0;i<n;i++){const a=3.1416+i/(n-1)*3.1416,r=.8+rng()*.35;pts.push([cx+Math.cos(a)*w*r,cy+Math.sin(a)*h*r])}
    x.lineJoin="round";x.lineWidth=.9;x.strokeStyle=INK;x.beginPath();x.moveTo(pts[0][0],pts[0][1]);for(const q of pts)x.lineTo(q[0],q[1]);x.closePath();const g=x.createLinearGradient(cx-w,cy-h,cx+w,cy);g.addColorStop(0,c0);g.addColorStop(1,c1);x.fillStyle=g;x.fill();x.stroke();
    const m=pts[(n/2)|0];x.fillStyle="rgba(60,52,40,.45)";x.beginPath();x.moveTo(m[0],m[1]);x.lineTo(pts[n-2][0],pts[n-2][1]);x.lineTo(pts[n-1][0],pts[n-1][1]);x.lineTo(m[0]+1,cy);x.closePath();x.fill();
    x.strokeStyle="rgba(50,40,25,.55)";x.lineWidth=.6;x.beginPath();for(let k=0;k<3;k++){const a=pts[1+((rng()*(n-2))|0)];x.moveTo(a[0]+1,a[1]+1);x.lineTo(a[0]+2+rng()*2,a[1]+2+rng()*2)}x.stroke()};
  for(const pal of [["#c9c2ae","#857d6b"],["#b9b3a2","#77705f"],["#d8c49c","#9c8460"],["#a9a49a","#615c55"]])for(let v=0;v<3;v++)rockc.push(mk(34,24,x=>{x.fillStyle="rgba(30,25,10,.3)";x.beginPath();x.ellipse(18,20,14,3.4,0,0,7);x.fill();
    const n=3+((rng()*4)|0),list=[];for(let i=0;i<n;i++)list.push([5+rng()*24,12+rng()*7,3+rng()*5,2.6+rng()*4]);list.sort((a,b)=>a[1]-b[1]);for(const [cx,cy,w,h] of list)rockShape(x,cx,cy+h*.3,w,h,pal[0],pal[1])}));
  for(const pal of [["#d8c49c","#9c8460"],["#c49a72","#865c3e"],["#b9b3a2","#77705f"]])for(let v=0;v<3;v++)rocks.push(mk(18,14,x=>{x.fillStyle="rgba(30,25,10,.3)";x.beginPath();x.ellipse(10,11.5,7,2.3,0,0,7);x.fill();rockShape(x,9,11,6+rng()*2,5+rng()*3,pal[0],pal[1])}));
  // 1.10: arvores dos biomas novos
  const mangue=[],magica=[],corrupt=[],alien=[],luz=[];
  for(let v=0;v<4;v++)mangue.push(mk(38,40,x=>{shadow(x,20,37,11,2.6);x.strokeStyle="#4a3424";x.lineCap="round";for(let i=0;i<7;i++){const bx=8+i*3.6+(rng()-.5)*2;x.lineWidth=1.2;x.beginPath();x.moveTo(19,26);x.quadraticCurveTo((19+bx)/2,27+rng()*3,bx,37+(rng()-.5)*1.5);x.stroke()}
    x.lineWidth=2.2;x.beginPath();x.moveTo(19,27);x.lineTo(19,19);x.stroke();const l=[[19,14,8]];for(let i=0;i<5;i++){const a=rng()*6.28,d=4+rng()*5;l.push([19+Math.cos(a)*d,14+Math.sin(a)*d*.6,4+rng()*2.6])}blob(x,l,v%2?"#3f5f2c":"#4a6a30","#6f8f44","#16240a")}));
  for(let v=0;v<4;v++)magica.push(mk(36,42,x=>{shadow(x,20,38,10,3);x.strokeStyle="#4a3450";x.lineWidth=2.2;x.beginPath();x.moveTo(18,39);x.bezierCurveTo(15,32,22,28,18,20);x.stroke();
    const l=[[18,16,9]];for(let i=0;i<5;i++){const a=rng()*6.28,d=4+rng()*5;l.push([18+Math.cos(a)*d,16+Math.sin(a)*d*.7,4.5+rng()*3])}blob(x,l,v%2?"#5b4a9a":"#3f7f86","#9a86d8","#1a1236");
    for(let i=0;i<6;i++){x.fillStyle=i%2?"rgba(190,255,240,.9)":"rgba(255,220,250,.9)";x.beginPath();x.arc(10+rng()*16,8+rng()*14,.9+rng()*.7,0,7);x.fill()}}));
  for(let v=0;v<4;v++)corrupt.push(mk(32,38,x=>{shadow(x,17,35,8,2.4);x.strokeStyle="#1d1620";x.lineCap="round";const br=(x0,y0,a,l,w,d)=>{const x1=x0+Math.cos(a)*l+(rng()-.5)*3,y1=y0+Math.sin(a)*l;x.lineWidth=w;x.beginPath();x.moveTo(x0,y0);x.quadraticCurveTo((x0+x1)/2+(rng()-.5)*5,(y0+y1)/2,x1,y1);x.stroke();if(d>0){br(x1,y1,a-.6-rng()*.4,l*.7,w*.6,d-1);br(x1,y1,a+.5+rng()*.4,l*.66,w*.6,d-1)}};
    br(16,35,-1.5708,10,3,3);x.fillStyle="rgba(150,70,190,.55)";for(let i=0;i<4;i++){x.beginPath();x.arc(8+rng()*16,6+rng()*14,1.2+rng(),0,7);x.fill()}}));
  for(let v=0;v<4;v++)alien.push(mk(30,44,x=>{shadow(x,16,41,7,2.2);const H=22+rng()*10;x.strokeStyle="#2a1c34";x.lineWidth=3.4;x.beginPath();x.moveTo(15,41);x.quadraticCurveTo(15+(rng()-.5)*8,41-H/2,15,41-H);x.stroke();x.strokeStyle="#7a5a96";x.lineWidth=2;x.stroke();
    const cy=41-H;x.fillStyle="#123a3a";x.beginPath();x.ellipse(15,cy,10,5,0,0,7);x.fill();x.fillStyle=v%2?"#3fd1c0":"#e070d0";x.beginPath();x.ellipse(15,cy-1,9,4,0,0,7);x.fill();x.fillStyle="rgba(255,255,255,.6)";x.beginPath();x.ellipse(12,cy-2,3,1.3,0,0,7);x.fill();
    for(let i=0;i<4;i++){x.fillStyle="#9ff";x.beginPath();x.arc(8+i*4.5,cy+3+rng()*2,.8,0,7);x.fill()}}));
  for(let v=0;v<4;v++)luz.push(mk(44,50,x=>{shadow(x,25,46,13,3.6);x.strokeStyle="#283a2e";x.lineWidth=3.4;x.beginPath();x.moveTo(22,47);x.lineTo(22,30);x.stroke();for(let i=0;i<4;i++){x.lineWidth=1.4;x.beginPath();x.moveTo(22,40);x.quadraticCurveTo(22+(i-1.5)*5,44,22+(i-1.5)*9,47);x.stroke()}
    const l=[[22,20,11]];for(let i=0;i<7;i++){const a=rng()*6.28,d=6+rng()*6;l.push([22+Math.cos(a)*d,20+Math.sin(a)*d*.7,5+rng()*3.5])}blob(x,l,v%2?"#1f5a52":"#26604a","#3f8a72","#0a1e1a");
    for(let i=0;i<14;i++){const gx=10+rng()*24,gy=8+rng()*24;x.fillStyle=i%3?"rgba(120,250,255,.85)":"rgba(220,140,255,.85)";x.beginPath();x.arc(gx,gy,.7+rng()*.9,0,7);x.fill()}}));
  // cogumelos gigantes (inspirados em Terraria e Zelda): chapeu largo com pintas, alguns brilham
  const fungo=[];const CAPS=[["#3a6fd0","#7fb0ff","#b8e0ff"],["#b84a3a","#e07a5a","#fff1dc"],["#7a4ab0","#a87ae0","#f0d8ff"],["#2f9a8a","#5fd0c0","#d8fff8"]];
  for(let v=0;v<8;v++)fungo.push(mk(40,48,x=>{const [c0,c1,pt]=CAPS[v%4],H=16+rng()*14,W2=9+rng()*6,lean=(rng()-.5)*6;shadow(x,21,45,W2,3);x.strokeStyle="#3a2c28";x.lineWidth=5.2;x.lineCap="round";x.beginPath();x.moveTo(20,45);x.quadraticCurveTo(20+lean*.4,45-H*.6,20+lean,45-H);x.stroke();x.strokeStyle="#e8dcc0";x.lineWidth=3.6;x.stroke();
    const cx=20+lean,cy=45-H;x.fillStyle="#1d1420";x.beginPath();x.ellipse(cx,cy+1,W2+1.4,W2*.62+1.2,0,Math.PI,0);x.lineTo(cx+W2+1.4,cy+2.4);x.lineTo(cx-W2-1.4,cy+2.4);x.fill();x.fillStyle=c0;x.beginPath();x.ellipse(cx,cy+1,W2,W2*.6,0,Math.PI,0);x.lineTo(cx+W2,cy+1.6);x.lineTo(cx-W2,cy+1.6);x.fill();
    x.fillStyle=c1;x.beginPath();x.ellipse(cx-W2*.25,cy-W2*.18,W2*.55,W2*.28,0,0,7);x.fill();x.fillStyle=pt;for(let i=0;i<5;i++){x.beginPath();x.arc(cx+(rng()-.5)*W2*1.4,cy-rng()*W2*.45,.8+rng()*1,0,7);x.fill()}
    if(v%4===0||v%4===3){x.fillStyle="rgba(170,230,255,.35)";x.beginPath();x.ellipse(cx,cy,W2+4,W2*.7+3,0,0,7);x.fill()}if(rng()<.6){x.strokeStyle="#3a2c28";x.lineWidth=2;x.beginPath();x.moveTo(27,45);x.lineTo(28,40);x.stroke();x.fillStyle=c0;x.beginPath();x.ellipse(28,39.5,3.2,1.8,0,Math.PI,0);x.fill()}}));
  // 1.11: pedras e arbustos de cada bioma (cor e forma combinando com o chao)
  const RP={11:[["#f2f0ea","#b8b4a8"],["#e6e2d6","#a8a294"]],12:[["#4a4442","#1e1a1a"],["#5c5450","#2a2422"]],13:[["#5a4640","#241a18"],["#6e544a","#2e2220"]],14:[["#e4f0f8","#8fb0c8"],["#cfe2f0","#7a9cb8"]],
    16:[["#6e6276","#2e2434"],["#5a4e62","#241a2a"]],17:[["#a8644a","#5a2e20"],["#8e5240","#4a2418"]],9:[["#a9a49a","#615c55"]],10:[["#7a7468","#3e3a32"]]},rockB={},crist={},bushB={};
  for(const k in RP){rockB[k]=[];for(const pal of RP[k])for(let v=0;v<3;v++)rockB[k].push(mk(34,24,x=>{x.fillStyle="rgba(30,25,10,.3)";x.beginPath();x.ellipse(18,20,14,3.4,0,0,7);x.fill();const n=2+((rng()*4)|0),L=[];for(let i=0;i<n;i++)L.push([5+rng()*24,12+rng()*7,3+rng()*5,2.6+rng()*(k==="13"||k==="12"?7:4)]);L.sort((a,b)=>a[1]-b[1]);for(const [cx,cy,w,h] of L)rockShape(x,cx,cy+h*.3,w,h,pal[0],pal[1])}))}
  const cristal=(cs)=>mk(30,30,x=>{x.fillStyle="rgba(20,10,30,.3)";x.beginPath();x.ellipse(15,26,9,2.6,0,0,7);x.fill();const n=3+((rng()*3)|0);for(let i=0;i<n;i++){const bx=8+rng()*14,h=8+rng()*14,w=2+rng()*2.6,lean=(rng()-.5)*6;x.fillStyle=cs[0];x.strokeStyle="#1a1426";x.lineWidth=.7;x.beginPath();x.moveTo(bx-w,26);x.lineTo(bx-w*.8+lean,26-h*.8);x.lineTo(bx+lean*1.1,26-h);x.lineTo(bx+w*.8+lean,26-h*.8);x.lineTo(bx+w,26);x.closePath();x.fill();x.stroke();x.fillStyle=cs[1];x.beginPath();x.moveTo(bx-w*.2,26);x.lineTo(bx+lean*1.1,26-h);x.lineTo(bx+w*.8+lean,26-h*.8);x.lineTo(bx+w,26);x.fill()}x.fillStyle="rgba(255,255,255,.35)";x.beginPath();x.arc(15,18,7,0,7);x.fill()});
  crist[15]=[0,1,2,3].map(v=>cristal(v%2?["#7f6ad8","#c4b6ff"]:["#3fb6c0","#a8f4f0"]));crist[18]=[0,1,2,3].map(v=>cristal(v%2?["#d050c0","#ffa8ef"]:["#40d0a0","#b0ffe0"]));crist[19]=[0,1,2].map(()=>cristal(["#2a9ab0","#90f0ff"]));crist[14]=[0,1,2].map(()=>cristal(["#a8d0ea","#f0fbff"]));
  crist[20]=[0,1,2,3,4,5].map(v=>mk(22,22,x=>{const n=2+((rng()*3)|0);for(let i=0;i<n;i++){const bx=5+rng()*12,h=4+rng()*7,w=3+rng()*3,cs=[["#3a6fd0","#9fd0ff"],["#b84a3a","#ffd8c0"],["#7a4ab0","#e0c8ff"]][(v+i)%3];x.strokeStyle="#e8dcc0";x.lineWidth=1.6;x.beginPath();x.moveTo(bx,20);x.lineTo(bx,20-h);x.stroke();x.fillStyle=cs[0];x.beginPath();x.ellipse(bx,20-h,w,w*.55,0,Math.PI,0);x.fill();x.fillStyle=cs[1];x.beginPath();x.arc(bx-w*.3,20-h-w*.25,.8,0,7);x.fill()}}));
  const arb=(cor,cl,forma)=>mk(20,18,x=>{x.fillStyle="rgba(20,20,10,.3)";x.beginPath();x.ellipse(11,15,7,2.2,0,0,7);x.fill();if(forma==="seco"){x.strokeStyle=cor;x.lineWidth=.9;for(let i=0;i<7;i++){const a=-Math.PI*(.15+rng()*.7);x.beginPath();x.moveTo(10,15);x.lineTo(10+Math.cos(a)*(4+rng()*5),15+Math.sin(a)*(4+rng()*5));x.stroke()}return}
    if(forma==="espinho"){x.strokeStyle=cor;x.lineWidth=1.1;for(let i=0;i<5;i++){let px=10,py=15,a=-Math.PI/2+(rng()-.5)*1.6;x.beginPath();x.moveTo(px,py);for(let k=0;k<3;k++){a+=(rng()-.5)*.9;px+=Math.cos(a)*3;py+=Math.sin(a)*3;x.lineTo(px,py)}x.stroke()}x.fillStyle=cl;x.beginPath();x.arc(10,8,1.2,0,7);x.fill();return}
    const L=[[10,10,4.4],[6,12,3.2],[14,12,3.2]];blob(x,L,cor,cl,"#141018");if(forma==="brilho"){for(let i=0;i<3;i++){x.fillStyle="rgba(230,255,255,.9)";x.beginPath();x.arc(5+rng()*10,6+rng()*7,.7,0,7);x.fill()}}});
  bushB[12]=[0,1,2].map(()=>arb("#5a4c40","",'seco'));bushB[13]=[0,1,2].map(()=>arb("#3a2a24","",'seco'));bushB[17]=[0,1,2].map(()=>arb("#4a2a1c","",'seco'));bushB[11]=bushB[12];
  bushB[16]=[0,1,2].map(()=>arb("#2a1c30","#b060d0","espinho"));bushB[15]=[0,1,2].map(v=>arb(v%2?"#6a58b0":"#3f8a90",v%2?"#a898e8":"#80d0d0","brilho"));bushB[18]=[0,1,2].map(v=>arb(v%2?"#c050b0":"#30b0a0",v%2?"#ff9ae8":"#9ff0e0","brilho"));
  bushB[19]=[0,1,2].map(()=>arb("#1f5a52","#50c8c0","brilho"));bushB[9]=reed;bushB[10]=reed;
  // 1.14: mais variacoes nos biomas novos (formas diferentes, nao so cor)
  // magica: espiral alta, chorona com fios de luz, copa em camadas (bonsai)
  for(let v=0;v<3;v++)magica.push(mk(30,48,x=>{shadow(x,15,45,8,2.4);x.strokeStyle="#3a2a48";x.lineWidth=2;x.beginPath();x.moveTo(15,46);for(let t=0;t<1;t+=.05)x.lineTo(15+Math.sin(t*9)*3*(1-t),46-t*34);x.stroke();
    for(let k=0;k<4;k++){const y=36-k*8,w=10-k*2;x.fillStyle=k%2?"#7a6ad0":"#4f8ab0";x.strokeStyle="#1a1236";x.lineWidth=.6;x.beginPath();x.ellipse(15,y,w,3.4,0,0,7);x.fill();x.stroke()}x.fillStyle="rgba(230,220,255,.9)";x.beginPath();x.arc(15,7,1.6,0,7);x.fill()}));
  for(let v=0;v<3;v++)magica.push(mk(40,42,x=>{shadow(x,20,39,11,2.8);x.strokeStyle="#4a3450";x.lineWidth=2.4;x.beginPath();x.moveTo(20,40);x.lineTo(20,16);x.stroke();blob(x,[[20,14,9],[13,16,6],[27,16,6]],"#6a4aa0","#a888e0","#1a1236");
    for(let i=0;i<9;i++){const sx=10+i*2.5,L=8+rng()*14;x.strokeStyle=i%2?"rgba(200,170,255,.8)":"rgba(150,240,230,.8)";x.lineWidth=.8;x.beginPath();x.moveTo(sx,16);x.quadraticCurveTo(sx+(rng()-.5)*3,16+L/2,sx+(rng()-.5)*2,16+L);x.stroke()}}));
  // terras sombrias: arvore morta com olhos, espinheiro roxo, toco com nevoa
  for(let v=0;v<3;v++)corrupt.push(mk(36,40,x=>{shadow(x,18,37,10,2.6);x.fillStyle="#2a1c30";x.strokeStyle="#0e0a12";x.lineWidth=.8;x.beginPath();x.moveTo(12,38);x.quadraticCurveTo(14,22,8,10);x.lineTo(12,12);x.quadraticCurveTo(18,20,18,8);x.lineTo(21,9);x.quadraticCurveTo(22,22,28,12);x.lineTo(30,14);x.quadraticCurveTo(24,26,24,38);x.closePath();x.fill();x.stroke();
    x.fillStyle="#d070ff";for(const [ex,ey] of [[16,24],[20,24]]){x.beginPath();x.ellipse(ex,ey,1.2,.7,0,0,7);x.fill()}}));
  for(let v=0;v<3;v++)corrupt.push(mk(30,24,x=>{x.fillStyle="rgba(120,60,160,.28)";x.beginPath();x.ellipse(15,18,14,5,0,0,7);x.fill();x.fillStyle="#2a1e22";x.strokeStyle="#0e0a12";x.beginPath();x.ellipse(15,17,6,3,0,0,7);x.fill();x.stroke();x.fillRect(9,10,12,7);x.strokeRect(9,10,12,7);x.fillStyle="#4a3a3e";x.beginPath();x.ellipse(15,10,6,2.4,0,0,7);x.fill()}));
  // alienigena: bulbos empilhados, espiral, corais em leque
  for(let v=0;v<3;v++)alien.push(mk(28,42,x=>{shadow(x,14,39,7,2);for(let k=0;k<4;k++){const r=6-k*1.1,y=36-k*8;x.fillStyle=k%2?"#40d0a0":"#d050c0";x.strokeStyle="#1a1030";x.lineWidth=.7;x.beginPath();x.arc(14,y,r,0,7);x.fill();x.stroke();x.fillStyle="rgba(255,255,255,.5)";x.beginPath();x.arc(12.5,y-2,r*.35,0,7);x.fill()}}));
  for(let v=0;v<3;v++)alien.push(mk(34,36,x=>{shadow(x,17,33,10,2.4);const cor=v%2?"#ff7ad8":"#7affd8";for(let i=0;i<7;i++){const a=-Math.PI*(.15+i*.1);x.strokeStyle=cor;x.lineWidth=1.6;x.beginPath();x.moveTo(17,33);x.quadraticCurveTo(17+Math.cos(a)*8,33+Math.sin(a)*14,17+Math.cos(a)*14,33+Math.sin(a)*24);x.stroke();x.fillStyle="#fff";x.beginPath();x.arc(17+Math.cos(a)*14,33+Math.sin(a)*24,1.2,0,7);x.fill()}}));
  // bioluminescente: samambaia gigante, arvore-lanterna
  for(let v=0;v<3;v++)luz.push(mk(40,40,x=>{shadow(x,20,37,11,2.6);for(let i=0;i<8;i++){const a=-Math.PI*(.08+i*.12);x.strokeStyle="#1f6a5a";x.lineWidth=2;x.beginPath();x.moveTo(20,37);x.quadraticCurveTo(20+Math.cos(a)*10,37+Math.sin(a)*20,20+Math.cos(a)*18,37+Math.sin(a)*26);x.stroke();x.fillStyle="rgba(120,250,255,.9)";x.beginPath();x.arc(20+Math.cos(a)*18,37+Math.sin(a)*26,1.3,0,7);x.fill()}}));
  for(let v=0;v<3;v++)luz.push(mk(30,46,x=>{shadow(x,15,43,8,2.4);x.strokeStyle="#283a2e";x.lineWidth=2.6;x.beginPath();x.moveTo(15,44);x.lineTo(15,14);x.stroke();for(let k=0;k<5;k++){const y=16+k*5,sd=k%2?1:-1;x.strokeStyle="#283a2e";x.lineWidth=1;x.beginPath();x.moveTo(15,y);x.lineTo(15+sd*7,y+3);x.stroke();x.fillStyle=k%2?"#ffd86a":"#7affea";x.beginPath();x.ellipse(15+sd*7,y+5,2,2.8,0,0,7);x.fill()}x.fillStyle="#1f5a52";x.beginPath();x.ellipse(15,12,6,4,0,0,7);x.fill()}));
  // mangue: arbusto baixo com raizes e mangue alto
  for(let v=0;v<3;v++)mangue.push(mk(30,26,x=>{shadow(x,15,24,10,2);x.strokeStyle="#4a3424";x.lineWidth=1;for(let i=0;i<9;i++){const bx=4+i*2.6;x.beginPath();x.moveTo(15,16);x.quadraticCurveTo((15+bx)/2,18,bx,24);x.stroke()}blob(x,[[15,12,6],[10,13,4],[20,13,4]],"#4a6a30","#6f8f44","#16240a")}));
  // cogumelos: com saia (estilo Zelda), cacho e chapeu achatado
  for(let v=0;v<4;v++)fungo.push(mk(36,44,x=>{const cor=[["#d8a030","#ffe4a0"],["#5fb0d0","#d0f4ff"],["#c04a7a","#ffc0dc"],["#6aa040","#d8f0b0"]][v];shadow(x,18,41,9,2.6);x.strokeStyle="#efe4c8";x.lineWidth=4;x.beginPath();x.moveTo(18,42);x.lineTo(18,18);x.stroke();x.fillStyle="#efe4c8";x.beginPath();x.ellipse(18,28,6,2,0,0,7);x.fill();
    if(v%2){for(let k=0;k<3;k++){const y=10+k*5,w=13-k*3;x.fillStyle=cor[0];x.strokeStyle="#1d1420";x.lineWidth=.7;x.beginPath();x.ellipse(18,y+4,w,w*.35,0,Math.PI,0);x.lineTo(18+w,y+5);x.lineTo(18-w,y+5);x.fill();x.stroke()}}else{x.fillStyle=cor[0];x.strokeStyle="#1d1420";x.lineWidth=.8;x.beginPath();x.ellipse(18,16,15,5,0,Math.PI,0);x.quadraticCurveTo(18,22,3,16);x.fill();x.stroke()}
    x.fillStyle=cor[1];for(let i=0;i<4;i++){x.beginPath();x.arc(10+rng()*16,10+rng()*5,1,0,7);x.fill()}}));
  return {dec,con,bush,rock,palm,acacia,cactus,snowpine,dead,willow,jungle,reed,autumn,sakura,blossom,birch,bare,rockc,rocks,mangue,magica,corrupt,alien,luz,fungo,rockB,crist,bushB}}
function poly(c,pts,fill,stroke){c.beginPath();c.moveTo(pts[0][0],pts[0][1]);for(let i=1;i<pts.length;i++)c.lineTo(pts[i][0],pts[i][1]);c.closePath();if(fill){c.fillStyle=fill;c.fill()}if(stroke){c.strokeStyle=stroke;c.stroke()}}
const ROOF={jp:["#5f6a76","#3b434d"],cn:["#4f8a6a","#2e5c45"],cny:["#d6ac46","#a07c2a"],terra:["#b9653e","#83462b"],felt:["#f0e8d6","#c7bca4"],tile2:["#c9673a","#94482a"],tileb:["#9a4a36","#6e3426"],moss:["#8a8a52","#62633a"],thatch:["#c2a868","#8f7741"],old:["#a8915a","#7b6638"],tile:["#bb573c","#8c3d2a"],dark:["#9c4631","#743222"],slate:["#80828a","#5a5c63"],shingle:["#8d6c46","#654c30"],teal:["#5c9a92","#3c6862"],leaf:["#86a453","#5d7737"],hide:["#8f6c4a","#5e4630"],snow:["#eef1f3","#bfc9d0"],sandtop:["#e8d2a2","#c9ad78"],blue:["#4f72a8","#344e78"],gold:["#d8b45a","#a68436"]};
const WALL={red:["#b8402f","#82291f"],ochre:["#dca552","#a9792f"],pink:["#df917e","#ad6a5c"],felt:["#eee6d2","#c3b8a0"],lime:["#ddd3b8","#a99f86"],jpw:["#f1ece0","#c9c1ad"],daub2:["#e6cf9a","#b89d68"],daub3:["#e8c9b4","#b99883"],brick:["#b86a4c","#874a33"],daub:["#e8dec2","#bcae8e"],stone:["#d0c9b7","#9a9484"],wood:["#b38d5c","#86663f"],white:["#f3efe3","#c8c2b0"],sand:["#e6c892","#b8955c"],sand2:["#d8ad78","#a5804c"],wooddark:["#7d5c3b","#553d26"],darkstone:["#aaa59b","#76726a"],mud:["#b99a6a","#8a6e45"]};
function drawHouse(c,x,y,o){
  const s=o.flip?-1:1,a=[.87*s,-.43],b=[-.87*s,-.43],L=o.L,D=o.D,H=o.H,R=o.R,roof=ROOF[o.roof],wall=WALL[o.wall];
  const F=[x,y],Rr=[x+a[0]*D,y+a[1]*D],Ll=[x+b[0]*L,y+b[1]*L],Oo=[Rr[0]+b[0]*L,Rr[1]+b[1]*L];
  const up=(p,h)=>[p[0],p[1]-h],mid=(p,q)=>[(p[0]+q[0])/2,(p[1]+q[1])/2],mix=(p,q,t)=>[p[0]+(q[0]-p[0])*t,p[1]+(q[1]-p[1])*t];
  const E1=up(mid(F,Rr),H+R),E2=up(mid(Ll,Oo),H+R),wl=o.flip?wall[1]:wall[0],wg=o.flip?wall[0]:wall[1];
  c.lineWidth=.8;c.lineJoin="round";
  c.fillStyle="rgba(20,22,6,.3)";c.beginPath();c.ellipse(x+3*s,y+1,L*.7,D*.45,0,0,7);c.fill();
  poly(c,[up(Rr,H),up(Oo,H),E2,E1],roof[1],INK);
  poly(c,[F,Ll,up(Ll,H),up(F,H)],wl,INK);
  poly(c,[F,Rr,up(Rr,H),E1,up(F,H)],wg,INK);
  c.strokeStyle="rgba(60,40,20,.75)";c.lineWidth=.6;c.beginPath();
  if(o.timber){const m=H*.5;c.moveTo(F[0],F[1]-m);c.lineTo(Ll[0],Ll[1]-m);c.moveTo(F[0],F[1]-m);c.lineTo(Rr[0],Rr[1]-m);
    for(const t of[.33,.66]){const p=mix(F,Ll,t);c.moveTo(p[0],p[1]);c.lineTo(p[0],p[1]-H)}}
  c.stroke();
  c.fillStyle="#3a2c1b";
  if(o.win){const n=Math.max(1,Math.round(L/4.5));for(let i=0;i<n;i++){const p=mix(F,Ll,(i+.6)/(n+.2));for(let k=0;k<(H>7?2:1);k++)c.fillRect(p[0]-.8,p[1]-H*(k?.82:.5)-(H>7?0:.8),1.6,1.9)}}
  if(o.door){const p=mid(F,Rr);c.fillRect(p[0]-1,p[1]-(o.door>1?4:2.8),2,(o.door>1?4:2.8))}
  poly(c,[up(F,H),up(Ll,H),E2,E1],roof[0],INK);
  c.strokeStyle="rgba(50,30,15,.45)";c.lineWidth=.55;c.beginPath();
  if(o.roof==="thatch"||o.roof==="old"){for(const t of[.36,.7]){const p=mix(up(F,H),E1,t),q=mix(up(Ll,H),E2,t);c.moveTo(p[0],p[1]);c.lineTo(q[0],q[1])}}
  else{const n=Math.round(L/2.2);for(let i=1;i<n;i++){const p=mix(up(F,H),up(Ll,H),i/n),q=mix(E1,E2,i/n);c.moveTo(p[0],p[1]);c.lineTo(q[0],q[1])}
    const p=mix(up(F,H),E1,.5),q=mix(up(Ll,H),E2,.5);c.moveTo(p[0],p[1]);c.lineTo(q[0],q[1])}
  c.stroke();
  if(o.chim){const p=mix(E1,E2,.3);c.fillStyle="#9a8f80";c.strokeStyle=INK;c.lineWidth=.6;c.fillRect(p[0]-1.2,p[1]-3.4,2.4,4);c.strokeRect(p[0]-1.2,p[1]-3.4,2.4,4)}
  if(o.sign){c.strokeStyle=INK;c.lineWidth=.7;c.beginPath();c.moveTo(Rr[0],Rr[1]-H*.8);c.lineTo(Rr[0]+3.5*s,Rr[1]-H*.8);c.stroke();c.fillStyle="#c9a24c";c.fillRect(Rr[0]+(s>0?1.5:-3.5),Rr[1]-H*.8,2,2.4)}
}
const hexc=h=>[parseInt(h.slice(1,3),16),parseInt(h.slice(3,5),16),parseInt(h.slice(5,7),16)];
function tint(h,t){const p=hexc(h),f=v=>{v=t>0?v+(255-v)*t:v*(1+t);return clamp(Math.round(v),0,255).toString(16).padStart(2,"0")};return "#"+f(p[0])+f(p[1])+f(p[2])}
function mixc(a,b,t){const p=hexc(a),q=hexc(b);return "rgb("+((p[0]+(q[0]-p[0])*t)|0)+","+((p[1]+(q[1]-p[1])*t)|0)+","+((p[2]+(q[2]-p[2])*t)|0)+")"}
// casa vista inclinada em qualquer angulo: x,y = centro da base na tela; o.ang = direcao da cumeeira no mundo
Object.assign(WALL,{m_conc:["#cfcbc2","#8f8b83"],m_branco:["#ece9e1","#aaa69c"],m_creme:["#e9dcbc","#b0a180"],m_tijolo:["#b9694a","#7d422e"],m_areia:["#d8c39a","#9c8862"],m_azulc:["#a9bfd0","#6d8296"],m_verdec:["#b5c7a6","#78896a"],m_rosa:["#e0b4a4","#a67c6e"],m_amarelo:["#e6cf7e","#ab964e"],m_grafite:["#6d7078","#44464d"],m_vidro:["#8fb9cf","#4f7a92"],m_vidro2:["#7fc1b6","#427f76"],m_vidro3:["#b9c6d6","#74839a"],m_bronze:["#b08f62","#735a38"],m_cy1:["#4a4f5e","#2a2d38"],m_cy2:["#5a5266","#322c3c"],m_cy3:["#3f5560","#23323a"],m_cy4:["#66605a","#3a3632"],m_cyv:["#35506a","#16222e"],m_cyv2:["#4a3a66","#1e1630"]});
function drawHouseA(c,x,y,o){
  const ca=Math.cos(o.ang),sa=Math.sin(o.ang),U=[ca,sa*TILT],V=[-sa,ca*TILT],hl=o.L/2,hd=o.D/2,H=o.H,R=o.R,tr=o.tr||0,tw=o.tw||0,roof=ROOF[o.roof].map(c0=>tint(c0,tr)),wall=WALL[o.wall].map(c0=>tint(c0,tw));
  const P=(a,b,h)=>[x+U[0]*a+V[0]*b,y+U[1]*a+V[1]*b-(h||0)],lt=(nx,ny)=>clamp(.5+.62*(-nx*.85+ny*.3),0,1);
  c.lineJoin="round";c.lineWidth=.75;
  c.fillStyle="rgba(20,22,6,.28)";c.beginPath();[P(-hl,-hd),P(hl,-hd),P(hl,hd),P(-hl,hd)].forEach((q,i)=>i?c.lineTo(q[0]+2.6,q[1]+1.2):c.moveTo(q[0]+2.6,q[1]+1.2));c.closePath();c.fill();
  const faces=[];
  for(const s of[-1,1]){const nx=-sa*s,ny=ca*s;if(ny>.02)faces.push({pts:[P(-hl,s*hd,0),P(hl,s*hd,0),P(hl,s*hd,H),P(-hl,s*hd,H)],col:mixc(wall[1],wall[0],lt(nx,ny)),kind:"long",s})}
  for(const s of[-1,1]){const nx=ca*s,ny=sa*s;if(ny>.02)faces.push({pts:[P(s*hl,-hd,0),P(s*hl,hd,0),P(s*hl,hd,H),P(s*hl,0,H+R),P(s*hl,-hd,H)],col:mixc(wall[1],wall[0],lt(nx,ny)),kind:"gable",s})}
  for(const s of[-1,1]){const vis=s*ca*R+TILT*hd;if(vis<=0)continue;faces.push({pts:[P(-hl-.6,s*(hd+.6),H-.3),P(hl+.6,s*(hd+.6),H-.3),P(hl+.6,0,H+R),P(-hl-.6,0,H+R)],col:mixc(roof[1],roof[0],lt(-sa*s,ca*s)*.8+.2),kind:"roof",s})}
  for(const f of faces){poly(c,f.pts,f.col,INK);
    c.strokeStyle="rgba(50,30,15,.42)";c.lineWidth=.5;c.beginPath();
    if(f.kind==="roof"){const s=f.s;if(o.roof==="thatch"||o.roof==="old"){for(const t of[.35,.68]){const a=P(-hl,s*hd*(1-t),H+R*t),b=P(hl,s*hd*(1-t),H+R*t);c.moveTo(a[0],a[1]);c.lineTo(b[0],b[1])}}
      else{const n=Math.max(2,Math.round(o.L/2.3));for(let i=1;i<n;i++){const a=-hl+o.L*i/n,p=P(a,s*hd,H),q=P(a,0,H+R);c.moveTo(p[0],p[1]);c.lineTo(q[0],q[1])}const p=P(-hl,s*hd*.5,H+R*.5),q=P(hl,s*hd*.5,H+R*.5);c.moveTo(p[0],p[1]);c.lineTo(q[0],q[1])}}
    else if(o.timber){c.stroke();c.strokeStyle="rgba(58,36,18,.82)";c.lineWidth=.62;c.beginPath();const L_=(a,b,h0,h1,side)=>{const p=side?P(a,f.s*hd,h0):P(f.s*hl,a,h0),q=side?P(b,f.s*hd,h1):P(f.s*hl,b,h1);c.moveTo(p[0],p[1]);c.lineTo(q[0],q[1])};
      if(f.kind==="long"){L_(-hl,hl,H*.5,H*.5,1);L_(-hl,hl,H-.2,H-.2,1);const n=Math.max(2,Math.round(o.L/4.2));for(let i=0;i<=n;i++){const u=-hl+o.L*i/n;L_(u,u,0,H,1);if(i<n){const u2=-hl+o.L*(i+1)/n;if(i%2)L_(u,u2,H*.5,H-.2,1);else L_(u2,u,H*.5,H-.2,1)}}}
      else{L_(-hd,hd,H*.5,H*.5,0);L_(0,0,0,H,0);L_(-hd,0,H*.5,H,0);L_(hd,0,H*.5,H,0)}}
    c.stroke();
    if(f.kind!=="roof"){c.fillStyle="#3a2c1b";const win=(a,b,h,w)=>{const p=f.kind==="long"?P(a,f.s*hd,h):P(f.s*hl,b,h),q=f.kind==="long"?P(a+w,f.s*hd,h):P(f.s*hl,b+w,h);c.beginPath();c.moveTo(p[0],p[1]);c.lineTo(q[0],q[1]);c.lineTo(q[0],q[1]-1.8);c.lineTo(p[0],p[1]-1.8);c.closePath();c.fill()};
      if(f.kind==="long"){if(o.win){const n=Math.max(1,Math.round(o.L/5));for(let i=0;i<n;i++){const a=-hl+o.L*(i+.5)/n-.7;win(a,0,H*.62,1.4);if(H>7)win(a,0,H*.22+1.6,1.4)}}if(o.door&&(!o.fr||o.fr===f.s)){const p=P(hl*.15,f.s*hd,0),q=P(hl*.15+(o.door>1?2.4:1.8),f.s*hd,0),h=o.door>1?3.8:2.8;c.beginPath();c.moveTo(p[0],p[1]);c.lineTo(q[0],q[1]);c.lineTo(q[0],q[1]-h);c.lineTo(p[0],p[1]-h);c.closePath();c.fill()}}
      else if(o.win)win(0,-.7,H*.6,1.4)}}
  if(o.dorm&&R>3.5){for(const s2 of[-1,1]){if(s2*ca*R+TILT*hd<=0)continue;for(const u of o.dorm){const b0=P(u-1.4,s2*hd*.55,H+R*.45),b1=P(u+1.4,s2*hd*.55,H+R*.45),tp=P(u,s2*hd*.45,H+R*.45+2.6),bs=P(u,s2*hd*.62,H+R*.38);poly(c,[b0,b1,[b1[0],b1[1]+1.6],[b0[0],b0[1]+1.6]],wall[0],INK);poly(c,[b0,tp,b1],roof[0],INK);c.fillStyle="#3a2c1b";c.fillRect(bs[0]-.6,bs[1]-.2,1.2,1.4)}}}
  if(o.chim){const p=P(hl*.42,0,H+R-.6);c.fillStyle="#9a8f80";c.strokeStyle=INK;c.lineWidth=.6;c.fillRect(p[0]-1.1,p[1]-3.2,2.2,3.8);c.strokeRect(p[0]-1.1,p[1]-3.2,2.2,3.8)}
  if(o.sign){const p=P(hl,0,H*.7);c.strokeStyle=INK;c.lineWidth=.7;c.beginPath();c.moveTo(p[0],p[1]);c.lineTo(p[0]+3,p[1]);c.stroke();c.fillStyle="#c9a24c";c.fillRect(p[0]+1.6,p[1],2,2.4)}
}
function drawBuilding(c,x,y,o){
  if(o.form==="mod")return drawMod(c,x,y,o);
  const wingD=()=>{const w=o.wing,wo=Object.assign({},o,{L:w.L,D:w.D,H:o.H*w.h,R:o.R*.85,ang:w.ang,wing:null,dorm:null,chim:false,sign:false,tower:null,towers:null});if(o.form==="asian"||o.form==="flat")drawBuilding0(c,x+w.dx,y+w.dy,wo);else drawHouseA(c,x+w.dx,y+w.dy,wo)},
    TW=(t)=>{const X=x+t.dx,Y=y+t.dy;if(o.form==="asian")drawPagoda(c,X,Y,t.h>14?3:2,t.w*2.4,o.roof==="cny"||o.roof==="cn"?"cn":"jp",o.wall==="red"?"red":"jpw");else if(o.form==="flat"){drawTower(c,X,Y,t.w,t.h,0,ROOF[o.roof]||ROOF.dark,WALL[o.wall]||WALL.sand,true);const r=t.w*.9,g=c.createRadialGradient(X-r*.3,Y-t.h-r*.8,r*.1,X,Y-t.h-r*.2,r*1.1);g.addColorStop(0,"#f3e6c0");g.addColorStop(1,"#a88a4a");c.fillStyle=g;c.strokeStyle=INK;c.lineWidth=.7;c.beginPath();c.moveTo(X-r,Y-t.h);c.bezierCurveTo(X-r,Y-t.h-r*1.4,X+r,Y-t.h-r*1.4,X+r,Y-t.h);c.closePath();c.fill();c.stroke()}else drawTower(c,X,Y,t.w,t.h,t.r,ROOF[o.roof]||ROOF.dark,WALL[o.wall]||WALL.stone,false)};
  if(o.wing&&!o.wing.front)wingD();
  if(o.tower&&o.tower.back)TW(o.tower);if(o.towers)for(const t of o.towers)if(t.back)TW(t);
  const r0=drawBuilding0(c,x,y,o);
  if(o.tower&&!o.tower.back)TW(o.tower);if(o.towers)for(const t of o.towers)if(!t.back)TW(t);
  if(o.wing&&o.wing.front)wingD();
  if((o.flowers||o.ivy)&&o.form!=="round"&&o.form!=="mound"&&o.form!=="yurt"){const ca=Math.cos(o.ang),sa=Math.sin(o.ang),P=(a,b,h)=>[x+ca*a-sa*b,y+(sa*a+ca*b)*TILT-(h||0)],hl=o.L/2,hd=o.D/2,sd=ca>=0?1:-1;
    if(o.ivy){const e=o.ivy,pts=[P(e*hl,sd*hd,0)],n=7;for(let i=0;i<=n;i++){const t=i/n,u=e*(hl-o.L*.34*t),hh=o.H*(.85-.55*t)*(.8+.2*Math.sin(i*2.1+o.L));pts.push(P(u,sd*hd,hh))}pts.push(P(e*(hl-o.L*.34),sd*hd,0));c.globalAlpha=.88;poly(c,pts,"#5d7737","rgba(40,55,20,.8)");c.globalAlpha=1;c.fillStyle="#7a9a48";for(let i=0;i<6;i++){const q=P(e*(hl-o.L*.3*((i*.37)%1)),sd*hd,o.H*(.2+((i*.53)%1)*.5));c.beginPath();c.arc(q[0],q[1],.7,0,7);c.fill()}}
    if(o.flowers){const n=Math.max(2,Math.round(o.L/3.6)),hh=o.H*.42;for(let i=0;i<n;i++){const u=-hl+o.L*(i+.5)/n;if(o.ivy&&o.ivy*u>hl-o.L*.36)continue;poly(c,[P(u-.8,sd*hd,hh),P(u+.8,sd*hd,hh),P(u+.8,sd*(hd+.6),hh),P(u-.8,sd*(hd+.6),hh)],"#7a5a32",INK);c.fillStyle=o.flowers;for(const du of[-.45,.1,.55]){const q=P(u+du,sd*(hd+.35),hh+.5);c.beginPath();c.arc(q[0],q[1],.45,0,7);c.fill()}c.fillStyle="#5d7737";const q=P(u,sd*(hd+.3),hh+.25);c.beginPath();c.arc(q[0],q[1],.35,0,7);c.fill()}}}
  if(o.veranda||o.awning||o.roofTerr){const ca=Math.cos(o.ang),sa=Math.sin(o.ang),P=(a,b,h)=>[x+ca*a-sa*b,y+(sa*a+ca*b)*TILT-(h||0)],hl=o.L/2,hd=o.D/2,sd=ca>=0?1:-1;c.lineWidth=.6;
    if(o.veranda){poly(c,[P(-hl,sd*hd,.8),P(hl,sd*hd,.8),P(hl,sd*(hd+1.8),.8),P(-hl,sd*(hd+1.8),.8)],"#a07a4a",INK);c.strokeStyle=INK;c.lineWidth=1.3;c.beginPath();const n=Math.max(2,Math.round(o.L/3.4));for(let i=0;i<=n;i++){const u=-hl+o.L*i/n,p=P(u,sd*(hd+1.6),.8),q=P(u,sd*(hd+1.6),o.H*.62);c.moveTo(p[0],p[1]);c.lineTo(q[0],q[1])}c.stroke();c.strokeStyle="#6e4c2a";c.lineWidth=.7;c.stroke();
      c.strokeStyle="rgba(60,40,20,.7)";c.lineWidth=.45;c.beginPath();for(let i=0;i<n*3;i++){const u=-hl+o.L*i/(n*3),p=P(u,sd*(hd+1.7),.8),q=P(u,sd*(hd+1.7),2);c.moveTo(p[0],p[1]);c.lineTo(q[0],q[1])}const a1=P(-hl,sd*(hd+1.7),2),b1=P(hl,sd*(hd+1.7),2);c.moveTo(a1[0],a1[1]);c.lineTo(b1[0],b1[1]);c.stroke()}
    if(o.awning){const H=o.H*.85,u0=-hl*.55,u1=hl*.55,top=[P(u0,sd*hd,H*.62),P(u1,sd*hd,H*.62)],bot=[P(u1,sd*(hd+2.4),H*.42),P(u0,sd*(hd+2.4),H*.42)];poly(c,top.concat(bot),o.awning,INK);c.fillStyle="#efe6cb";const n=5;for(let i=0;i<n;i+=2){const t0=i/n,t1=(i+1)/n,L_=(p,q,t)=>[p[0]+(q[0]-p[0])*t,p[1]+(q[1]-p[1])*t];poly(c,[L_(top[0],top[1],t0),L_(top[0],top[1],t1),L_(bot[1],bot[0],t1),L_(bot[1],bot[0],t0)],"#efe6cb",null)}
      for(const u of[u0,u1]){const p=P(u,sd*(hd+2.3),0),q=P(u,sd*(hd+2.3),H*.42);c.strokeStyle="#5a4028";c.lineWidth=.6;c.beginPath();c.moveTo(p[0],p[1]);c.lineTo(q[0],q[1]);c.stroke()}}
    if(o.roofTerr){const H=o.H*.85,u=hl*.45,w=Math.min(hl,hd)*.55;for(const [du,dv] of[[-w,-w],[w,-w],[w,w],[-w,w]]){const p=P(u+du,dv,H),q=P(u+du,dv,H+3);c.strokeStyle="#5a4028";c.lineWidth=.6;c.beginPath();c.moveTo(p[0],p[1]);c.lineTo(q[0],q[1]);c.stroke()}poly(c,[P(u-w,-w,H+3),P(u+w,-w,H+3),P(u+w,w,H+2.6),P(u-w,w,H+2.6)],o.awning||"#efe6cb",INK)}}
  return r0}
function drawBuilding0(c,x,y,o){
  if(o.form==="asian")return drawAsian(c,x,y,o);
  if(o.form==="yurt")return drawRound(c,x,y,(o.L+o.D)/4,o.H*.75,o.R*.55,Object.assign({},o,{wall:"felt",roof:"felt",yurt:1}));
  if(o.form==="flat")return drawFlat(c,x,y,o);
  if(o.form==="round")return drawRound(c,x,y,(o.L+o.D)/4,o.H,o.R*1.3,o);
  if(o.form==="mound")return drawMound(c,x,y,o);
  if(o.form==="stilt"){c.strokeStyle=INK;c.lineWidth=1.1;const hl=o.L/2,hd=o.D/2,ca=Math.cos(o.ang),sa=Math.sin(o.ang);for(const [u,v] of [[-hl,-hd],[hl,-hd],[-hl,hd],[hl,hd]]){const px=x+ca*u-sa*v,py=y+(sa*u+ca*v)*TILT;c.beginPath();c.moveTo(px,py+1);c.lineTo(px,py-4.5);c.stroke()}
    c.strokeStyle="#6a4a2a";c.lineWidth=1.8;c.beginPath();c.moveTo(x-hl*.6,y+1.5);c.lineTo(x+hl*.6,y+1.5);c.stroke();return drawHouseA(c,x,y-4.5,o)}
  if(o.form==="long")return drawHouseA(c,x,y,Object.assign({},o,{R:o.R*1.5,H:o.H*.72}));
  return drawHouseA(c,x,y,o)}
function drawAsian(c,x,y,o){const ca=Math.cos(o.ang),sa=Math.sin(o.ang),U=[ca,sa*TILT],V=[-sa,ca*TILT],hl=o.L/2,hd=o.D/2,H=o.H,R=Math.max(3,o.R),e=1.5+o.L*.06,tr=o.tr||0,roof=ROOF[o.roof].map(c0=>tint(c0,tr)),wall=WALL[o.wall].map(c0=>tint(c0,o.tw||0));
  const P=(a,b,h)=>[x+U[0]*a+V[0]*b,y+U[1]*a+V[1]*b-(h||0)],lt=(nx,ny)=>clamp(.5+.62*(-nx*.85+ny*.3),0,1);c.lineJoin="round";c.lineWidth=.75;
  c.fillStyle="rgba(20,22,6,.28)";c.beginPath();[P(-hl-e,-hd-e),P(hl+e,-hd-e),P(hl+e,hd+e),P(-hl-e,hd+e)].forEach((q,i)=>i?c.lineTo(q[0]+2.6,q[1]+1.2):c.moveTo(q[0]+2.6,q[1]+1.2));c.closePath();c.fill();
  if(o.base){const b=o.base;for(const s2 of[-1,1]){if(ca*s2>.02)poly(c,[P(-hl-b,s2*(hd+b),-2.5),P(hl+b,s2*(hd+b),-2.5),P(hl+b,s2*(hd+b),0),P(-hl-b,s2*(hd+b),0)],"#aaa392",INK);if(sa*s2>.02)poly(c,[P(s2*(hl+b),-hd-b,-2.5),P(s2*(hl+b),hd+b,-2.5),P(s2*(hl+b),hd+b,0),P(s2*(hl+b),-hd-b,0)],"#8f897a",INK)}poly(c,[P(-hl-b,-hd-b),P(hl+b,-hd-b),P(hl+b,hd+b),P(-hl-b,hd+b)],"#c9c2ae",INK)}
  for(const s2 of[-1,1]){if(ca*s2>.02){poly(c,[P(-hl,s2*hd),P(hl,s2*hd),P(hl,s2*hd,H),P(-hl,s2*hd,H)],mixc(wall[1],wall[0],lt(-sa*s2,ca*s2)),INK);
      c.strokeStyle=o.wall==="red"?"#5a1d15":"#4a3424";c.lineWidth=.7;c.beginPath();const n=Math.max(2,Math.round(o.L/3.2));for(let i=0;i<=n;i++){const a=P(-hl+o.L*i/n,s2*hd,0),b=P(-hl+o.L*i/n,s2*hd,H);c.moveTo(a[0],a[1]);c.lineTo(b[0],b[1])}c.stroke();c.lineWidth=.75;
      const d=P(0,s2*hd,0);c.fillStyle="#3a2c1b";c.fillRect(d[0]-1.1,d[1]-H*.62,2.2,H*.62)}
    if(sa*s2>.02)poly(c,[P(s2*hl,-hd),P(s2*hl,hd),P(s2*hl,hd,H),P(s2*hl,-hd,H)],mixc(wall[1],wall[0],lt(ca*s2,sa*s2)),INK)}
  const up=1.6,A=P(-hl-e,-hd-e,H-.4+up),B=P(hl+e,-hd-e,H-.4+up),C=P(hl+e,hd+e,H-.4+up),D=P(-hl-e,hd+e,H-.4+up),r1=P(-hl*.42,0,H+R),r2=P(hl*.42,0,H+R);
  const sag=(p,q,k)=>[(p[0]+q[0])/2,(p[1]+q[1])/2+k];
  const faces=[{pts:[A,B,r2,r1],cv:[A,B],n:[sa,-ca]},{pts:[D,C,r2,r1],cv:[D,C],n:[-sa,ca]},{pts:[A,D,r1],cv:[A,D],n:[-ca,-sa]},{pts:[B,C,r2],cv:[B,C],n:[ca,sa]}];
  faces.forEach(f=>f.cy=f.pts.reduce((m,q)=>m+q[1],0)/f.pts.length);faces.sort((a,b)=>a.cy-b.cy);
  for(const f of faces){const [p,q]=f.cv,m=sag(p,q,up*1.4);c.beginPath();c.moveTo(p[0],p[1]);c.quadraticCurveTo(m[0],m[1],q[0],q[1]);for(const r of f.pts.slice(2))c.lineTo(r[0],r[1]);c.closePath();
    c.fillStyle=mixc(roof[1],roof[0],lt(f.n[0],f.n[1])*.8+.2);c.fill();c.strokeStyle=INK;c.stroke();
    c.strokeStyle="rgba(20,20,20,.3)";c.lineWidth=.45;c.beginPath();const tp=f.pts.length===4?[f.pts[3],f.pts[2]]:[f.pts[2],f.pts[2]];for(let i=1;i<6;i++){const t=i/6,a=[lerp(p[0],q[0],t),lerp(p[1],q[1],t)+Math.sin(t*3.1416)*up*.7],b=[lerp(tp[0][0],tp[1][0],t),lerp(tp[0][1],tp[1][1],t)];c.moveTo(a[0],a[1]);c.lineTo(b[0],b[1])}c.stroke();c.lineWidth=.75}
  c.strokeStyle=INK;c.lineWidth=1.6;c.beginPath();c.moveTo(r1[0],r1[1]);c.lineTo(r2[0],r2[1]);c.stroke();c.lineWidth=1;c.beginPath();c.moveTo(r1[0],r1[1]);c.lineTo(r1[0]-1.4,r1[1]-1.6);c.moveTo(r2[0],r2[1]);c.lineTo(r2[0]+1.4,r2[1]-1.6);c.stroke();c.lineWidth=.75}
function drawPagoda(c,x,y,n,w,roofK,wallK){for(let i=0;i<n;i++){const s=w*(1-i*.15);drawAsian(c,x,y-i*6.2,{L:s,D:s,H:i?4.2:5,R:2.4+s*.12,ang:.7854,roof:roofK,wall:wallK})}
  c.strokeStyle=INK;c.lineWidth=1.1;const ty=y-(n-1)*6.2-4.2-2.4-w*.12*(1-(n-1)*.15);c.beginPath();c.moveTo(x,ty);c.lineTo(x,ty-7);c.stroke();c.fillStyle="#c9a24c";for(let k=0;k<3;k++){c.beginPath();c.ellipse(x,ty-1.5-k*1.8,1.3,.6,0,0,7);c.fill()}}

function drawJpCastle(c,x,y){c.lineWidth=.8;poly(c,[[x-24,y],[x+24,y],[x+19,y-11],[x-19,y-11]],"#a8a190",INK);c.strokeStyle="rgba(60,50,35,.5)";c.lineWidth=.5;c.beginPath();for(let k=1;k<4;k++){c.moveTo(x-24+k*1.3,y-k*2.8);c.lineTo(x+24-k*1.3,y-k*2.8)}c.stroke();
  poly(c,[[x-19,y-11],[x+19,y-11],[x+19,y-12.5],[x-19,y-12.5]],"#c9c2ae",INK);
  const t=[[30,8],[22,6.5],[15,6],[9,5]];let yy=y-12.5;for(const [s,h] of t){drawAsian(c,x,yy,{L:s,D:s*.7,H:h,R:3+s*.1,ang:0,roof:"jp",wall:"jpw"});yy-=h+1.6}
  c.fillStyle="#c9a24c";c.fillRect(x-4,yy-4,1.4,2.4);c.fillRect(x+2.6,yy-4,1.4,2.4)}
function onion(c,x,y,r,col){c.lineWidth=.7;c.strokeStyle=INK;const bulb=()=>{c.beginPath();c.moveTo(x-r*.5,y);c.bezierCurveTo(x-r*1.3,y-r*.7,x-r*.85,y-r*1.7,x,y-r*2.5);c.bezierCurveTo(x+r*.85,y-r*1.7,x+r*1.3,y-r*.7,x+r*.5,y);c.closePath()};
  bulb();c.fillStyle=col[0];c.fill();c.save();bulb();c.clip();c.fillStyle=col[1];c.fillRect(x+r*.15,y-r*3,r*2,r*3.2);c.restore();bulb();c.stroke();c.strokeStyle="#3a2c1b";c.lineWidth=.7;c.beginPath();c.moveTo(x,y-r*2.5);c.lineTo(x,y-r*3.4);c.moveTo(x-r*.4,y-r*3);c.lineTo(x+r*.4,y-r*3);c.stroke()}
function drawPyramid(c,x,y,w,n){c.lineWidth=.75;for(let i=0;i<n;i++){const s=w*(1-i/(n+1)),h=4.6,yy=y-i*h;poly(c,[[x-s,yy],[x,yy+s*.42],[x,yy+s*.42-h],[x-s,yy-h]],"#c9bb98",INK);poly(c,[[x,yy+s*.42],[x+s,yy],[x+s,yy-h],[x,yy+s*.42-h]],"#a2957a",INK);poly(c,[[x-s,yy-h],[x,yy-h-s*.42],[x+s,yy-h],[x,yy+s*.42-h]],"#ddd2b2",INK)}
  const top=y-n*4.6,st=w*.16;poly(c,[[x-st*.5,y+w*.42*0+2],[x+st*.5,y+2],[x+st*.25,top+w*.1],[x-st*.25,top+w*.1]],"#b9ab88",INK);c.strokeStyle="rgba(60,50,35,.6)";c.lineWidth=.5;c.beginPath();for(let k=0;k<n*2;k++){const yy=y+2-k*(y+2-top-w*.1)/(n*2),ww=lerp(st*.5,st*.25,k/(n*2));c.moveTo(x-ww,yy);c.lineTo(x+ww,yy)}c.stroke();
  drawFlat(c,x,top+w*.08,{L:w*.34,D:w*.34,H:5,ang:.7854,wall:"lime"});c.fillStyle="#a8352a";c.fillRect(x-1.2,top+w*.08-8.6,2.4,1.4)}
function drawShikhara(c,x,y,w){drawFlat(c,x-w*.7,y+1,{L:w*1.2,D:w,H:5,ang:0,wall:"sand",dome:1,domeCol:["#e8c070","#b8873c"],win:1});c.lineWidth=.8;const h=w*2.6,g=c.createLinearGradient(x-w*.6,0,x+w*.6,0);g.addColorStop(0,"#e3b06a");g.addColorStop(1,"#a8743a");c.fillStyle=g;c.strokeStyle=INK;
  c.beginPath();c.moveTo(x-w*.6,y);c.bezierCurveTo(x-w*.62,y-h*.6,x-w*.25,y-h*.92,x,y-h);c.bezierCurveTo(x+w*.25,y-h*.92,x+w*.62,y-h*.6,x+w*.6,y);c.closePath();c.fill();c.stroke();
  c.strokeStyle="rgba(90,50,20,.55)";c.lineWidth=.5;c.beginPath();for(let k=1;k<7;k++){const t=k/7,yy=y-h*t,ww=w*.6*Math.sqrt(1-t*t*.85);c.moveTo(x-ww,yy);c.quadraticCurveTo(x,yy+1.2,x+ww,yy)}c.stroke();
  c.fillStyle="#c9a24c";c.beginPath();c.ellipse(x,y-h-1,1.6,.9,0,0,7);c.fill();c.fillRect(x-.4,y-h-4,.8,3)}
function drawFlat(c,x,y,o){const ca=Math.cos(o.ang),sa=Math.sin(o.ang),U=[ca,sa*TILT],V=[-sa,ca*TILT],hl=o.L/2,hd=o.D/2,H=o.H*.85,wall=WALL[o.wall];
  const P=(a,b,h)=>[x+U[0]*a+V[0]*b,y+U[1]*a+V[1]*b-(h||0)],lt=(nx,ny)=>clamp(.5+.62*(-nx*.85+ny*.3),0,1);c.lineJoin="round";c.lineWidth=.75;
  c.fillStyle="rgba(20,22,6,.28)";c.beginPath();[P(-hl,-hd),P(hl,-hd),P(hl,hd),P(-hl,hd)].forEach((q,i)=>i?c.lineTo(q[0]+2.6,q[1]+1.2):c.moveTo(q[0]+2.6,q[1]+1.2));c.closePath();c.fill();
  for(const s of[-1,1]){if(ca*s>.02)poly(c,[P(-hl,s*hd),P(hl,s*hd),P(hl,s*hd,H),P(-hl,s*hd,H)],mixc(wall[1],wall[0],lt(-sa*s,ca*s)),INK);if(sa*s>.02)poly(c,[P(s*hl,-hd),P(s*hl,hd),P(s*hl,hd,H),P(s*hl,-hd,H)],mixc(wall[1],wall[0],lt(ca*s,sa*s)),INK)}
  poly(c,[P(-hl,-hd,H),P(hl,-hd,H),P(hl,hd,H),P(-hl,hd,H)],mixc(wall[0],"#ffffff",.25),INK);
  poly(c,[P(-hl+1,-hd+1,H),P(hl-1,-hd+1,H),P(hl-1,hd-1,H),P(-hl+1,hd-1,H)],mixc(wall[1],wall[0],.55),null);
  c.fillStyle="#3a2c1b";const fr=P(0,hd,0);c.fillRect(fr[0]-1,fr[1]-3.2,2,3.2);if(o.win){const w=P(hl*.55,hd,H*.55);c.fillRect(w[0]-.7,w[1]-1,1.4,1.8);const w2=P(-hl*.55,hd,H*.55);c.fillRect(w2[0]-.7,w2[1]-1,1.4,1.8)}
  if(o.dome){const r=Math.min(o.L,o.D)*.42,cp=P(0,0,H);poly(c,[[cp[0]-r,cp[1]],[cp[0]-r,cp[1]-1.5],[cp[0]+r,cp[1]-1.5],[cp[0]+r,cp[1]]],mixc(wall[1],wall[0],.6),INK);
    const g=c.createLinearGradient(cp[0]-r,0,cp[0]+r,0);g.addColorStop(0,o.domeCol?o.domeCol[0]:"#f4f0e4");g.addColorStop(1,o.domeCol?o.domeCol[1]:"#bdb4a0");c.fillStyle=g;c.strokeStyle=INK;c.beginPath();c.moveTo(cp[0]-r,cp[1]-1.5);c.bezierCurveTo(cp[0]-r,cp[1]-r*1.5,cp[0]+r,cp[1]-r*1.5,cp[0]+r,cp[1]-1.5);c.closePath();c.fill();c.stroke();
    c.beginPath();c.moveTo(cp[0],cp[1]-r*1.15);c.lineTo(cp[0],cp[1]-r*1.15-2.5);c.stroke()}}
function drawRound(c,x,y,r,H,R,o){const wall=WALL[o.wall],roof=ROOF[o.roof],ry=r*TILT;c.lineWidth=.75;
  c.fillStyle="rgba(20,22,6,.28)";c.beginPath();c.ellipse(x+2.4,y+1,r,ry,0,0,7);c.fill();
  const g=c.createLinearGradient(x-r,0,x+r,0);g.addColorStop(0,wall[0]);g.addColorStop(1,wall[1]);c.fillStyle=g;c.strokeStyle=INK;
  c.beginPath();c.moveTo(x-r,y-H);c.lineTo(x-r,y);c.ellipse(x,y,r,ry,0,3.1416,0,true);c.lineTo(x+r,y-H);c.ellipse(x,y-H,r,ry,0,0,3.1416);c.closePath();c.fill();c.stroke();
  c.fillStyle="#3a2c1b";c.beginPath();c.ellipse(x-r*.25,y+ry*.6-1.6,1,1.6,0,0,7);c.fill();
  const rr=r*1.22,gr=c.createLinearGradient(x-rr,0,x+rr,0);gr.addColorStop(0,roof[0]);gr.addColorStop(1,roof[1]);c.fillStyle=gr;
  c.beginPath();c.moveTo(x-rr,y-H+.6);c.ellipse(x,y-H+.6,rr,rr*TILT,0,3.1416,0,true);c.lineTo(x,y-H-R);c.closePath();c.fill();c.stroke();
  c.strokeStyle="rgba(50,30,15,.45)";c.lineWidth=.5;c.beginPath();for(let k=1;k<4;k++){const a=3.1416*k/4;c.moveTo(x,y-H-R);c.lineTo(x-Math.cos(a)*rr,y-H+.6+Math.sin(a)*rr*TILT)}c.stroke();
  if(o.yurt){c.strokeStyle="rgba(120,80,50,.7)";c.lineWidth=.8;c.beginPath();c.ellipse(x,y-H*.55,r,ry,0,0,3.1416);c.stroke();c.fillStyle="#6b4a2a";c.beginPath();c.arc(x,y-H-R,1.1,0,7);c.fill()}
  if(o.spike){c.strokeStyle=INK;c.lineWidth=.9;c.beginPath();c.moveTo(x,y-H-R);c.lineTo(x-2,y-H-R-3);c.moveTo(x,y-H-R);c.lineTo(x+2,y-H-R-3);c.stroke()}}
function drawMound(c,x,y,o){const r=(o.L+o.D)/3.2,ry=r*TILT,h=o.H*.9;c.lineWidth=.75;
  c.fillStyle="rgba(20,22,6,.25)";c.beginPath();c.ellipse(x+2.4,y+1,r*1.05,ry,0,0,7);c.fill();
  const g=c.createLinearGradient(x-r,y-h,x+r,y);g.addColorStop(0,"#9fbe5e");g.addColorStop(1,"#5f7e35");c.fillStyle=g;c.strokeStyle=INK;
  c.beginPath();c.moveTo(x-r,y);c.bezierCurveTo(x-r,y-h*1.3,x+r,y-h*1.3,x+r,y);c.ellipse(x,y,r,ry,0,0,3.1416);c.closePath();c.fill();c.stroke();
  c.strokeStyle="rgba(40,60,20,.5)";c.lineWidth=.5;c.beginPath();for(let k=0;k<5;k++){const a=-2.6+k*.5;c.moveTo(x+Math.cos(a)*r*.7,y-h*.5+Math.sin(a)*h*.4);c.lineTo(x+Math.cos(a)*r*.7+1,y-h*.5+Math.sin(a)*h*.4-1.4)}c.stroke();
  const dc=o.door>1?"#a8352a":"#3f6d3a";c.fillStyle=dc;c.strokeStyle=INK;c.lineWidth=.7;c.beginPath();c.arc(x,y+ry*.5-1.4,2,0,7);c.fill();c.stroke();
  c.fillStyle="#efe2b0";c.beginPath();c.arc(x-r*.5,y+ry*.2-2.6,1,0,7);c.arc(x+r*.5,y+ry*.2-2.6,1,0,7);c.fill();
  if(o.chim){c.fillStyle="#9a8f80";c.fillRect(x+r*.3,y-h*.95,2,3.4);c.strokeRect(x+r*.3,y-h*.95,2,3.4)}}
function drawPalisade(c,p,q,h){const n=Math.max(2,Math.round(Math.hypot(q[0]-p[0],q[1]-p[1])/2.2));c.lineWidth=.6;
  for(let i=0;i<=n;i++){const x=lerp(p[0],q[0],i/n),y=lerp(p[1],q[1],i/n),hh=h*(.9+((i*7)%3)*.08);poly(c,[[x-1.1,y],[x+1.1,y],[x+1.1,y-hh],[x,y-hh-1.6],[x-1.1,y-hh]],i%2?"#8d6a44":"#7a5a38",INK)}}
function drawHedge(c,p,q,h){const lit=(q[1]-p[1])*(q[0]-p[0])>0;c.lineWidth=.7;poly(c,[p,q,[q[0],q[1]-h],[p[0],p[1]-h]],lit?"#6f8d40":"#56713a",INK);
  c.fillStyle="#88a652";const n=Math.max(1,Math.round(Math.hypot(q[0]-p[0],q[1]-p[1])/3));for(let i=0;i<=n;i++){const x=lerp(p[0],q[0],i/n),y=lerp(p[1],q[1],i/n)-h;c.beginPath();c.arc(x,y,1.6,0,7);c.fill()}}

function drawCrater(c,x,y,w,rng){c.lineWidth=.8;c.fillStyle="#2a201c";c.beginPath();c.ellipse(x,y,w*.2,w*.08,0,0,7);c.fill();c.fillStyle="#e2632a";c.beginPath();c.ellipse(x,y+.4,w*.15,w*.05,0,0,7);c.fill();c.fillStyle="#f6b04a";c.beginPath();c.ellipse(x,y+.6,w*.07,w*.025,0,0,7);c.fill();
  const pf=[];for(let i=0;i<9;i++){const t=i/8;pf.push([x+t*t*34+(rng()-.5)*4,y-6-t*58,3+t*11+rng()*2.5])}
  for(let i=pf.length-1;i>=0;i--){const [px,py,r]=pf[i],t=i/8;c.globalAlpha=.92-t*.25;
    for(const [ox,oy,rr] of [[-r*.45,r*.15,r*.7],[r*.5,r*.1,r*.75],[0,-r*.2,r]]){c.fillStyle="#2a2628";c.beginPath();c.arc(px+ox,py+oy,rr+.9,0,7);c.fill()}
    for(const [ox,oy,rr] of [[-r*.45,r*.15,r*.7],[r*.5,r*.1,r*.75],[0,-r*.2,r]]){const g=c.createRadialGradient(px+ox-rr*.35,py+oy-rr*.45,rr*.1,px+ox,py+oy,rr);g.addColorStop(0,i<2?"#8a7a70":"#b4aca6");g.addColorStop(1,i<2?"#4a3e3a":"#6e6668");c.fillStyle=g;c.beginPath();c.arc(px+ox,py+oy,rr,0,7);c.fill()}
    c.strokeStyle="rgba(40,36,38,.45)";c.lineWidth=.6;for(let k=1;k<3;k++){c.beginPath();c.arc(px,py-r*.2,r*(1-k*.25),3.5,5.6);c.stroke()}}
  c.globalAlpha=1;c.fillStyle="rgba(246,140,60,.35)";c.beginPath();c.ellipse(x,y-6,w*.12,7,0,0,7);c.fill()}
function drawSpires(c,x,y,col,rng){const n=3+((rng()*4)|0),list=[];for(let i=0;i<n;i++){const mid=1-Math.abs(i-(n-1)/2)/n;list.push([x+(i-(n-1)/2)*8+(rng()-.5)*4,y+(rng()-.5)*6,5+rng()*3.5,(14+rng()*16)*(.6+mid*.8)])}c.fillStyle="rgba(30,25,10,.28)";c.beginPath();c.ellipse(x+4,y+2,n*6,5,0,0,7);c.fill();list.sort((a,b)=>a[1]-b[1]);c.lineJoin="round";
  for(const [px,py,w,h] of list){const g=c.createLinearGradient(px-w,0,px+w,0);g.addColorStop(0,col[2]);g.addColorStop(1,col[1]);c.fillStyle=g;c.strokeStyle=INK;c.lineWidth=.8;c.beginPath();c.moveTo(px-w,py);c.quadraticCurveTo(px-w*.8,py-h*.6,px-w*.35,py-h);c.quadraticCurveTo(px,py-h-2,px+w*.4,py-h*.96);c.quadraticCurveTo(px+w*.9,py-h*.5,px+w,py);c.closePath();c.fill();c.stroke();
    c.strokeStyle="rgba(70,40,20,.45)";c.lineWidth=.55;c.beginPath();for(let k=1;k<5;k++){const yy=py-h*k/5;c.moveTo(px-w*.85*(1-k/7),yy);c.lineTo(px+w*.85*(1-k/7),yy+(rng()-.5))}c.stroke();
    c.fillStyle="rgba(60,30,15,.25)";c.beginPath();c.moveTo(px+w*.15,py-h*.9);c.quadraticCurveTo(px+w*.85,py-h*.5,px+w,py);c.lineTo(px+w*.2,py);c.closePath();c.fill()}}
function drawArch(c,x,y,col,rng){c.lineJoin="round";const w=30+rng()*10,h=24+rng()*8,t=8;c.fillStyle="rgba(30,25,10,.28)";c.beginPath();c.ellipse(x+3,y+1.5,w*.8,5,0,0,7);c.fill();
  const N=16,out=[],inn=[];for(let i=0;i<=N;i++){const a=Math.PI+i/N*Math.PI,j=(rng()-.5)*2.2,lw=t*(i===0||i===N?1.25:.85+.3*Math.sin(i*1.7));out.push([x+Math.cos(a)*(w/2+lw)+j,y+Math.sin(a)*(h+lw*.6)+(i===0||i===N?0:j)]);inn.push([x+Math.cos(a)*(w/2-.5)+j*.5,y+Math.sin(a)*(h-2)])}
  const path=()=>{c.beginPath();out.forEach((q,i)=>i?c.lineTo(q[0],q[1]):c.moveTo(q[0],q[1]));for(let i=inn.length-1;i>=0;i--)c.lineTo(inn[i][0],inn[i][1]);c.closePath()};
  path();const g=c.createLinearGradient(x-w,y-h,x+w,y);g.addColorStop(0,col[2]);g.addColorStop(.55,col[0]);g.addColorStop(1,col[1]);c.fillStyle=g;c.fill();
  c.save();path();c.clip();c.strokeStyle="rgba(60,40,20,.4)";c.lineWidth=.6;c.beginPath();for(let k=1;k<9;k++){const yy=y-k*(h+t)/9;c.moveTo(x-w,yy+(rng()-.5)*2);for(let xx=x-w;xx<x+w;xx+=5)c.lineTo(xx,yy+(rng()-.5)*1.6)}c.stroke();
  c.fillStyle="rgba(50,30,15,.28)";c.beginPath();inn.forEach((q,i)=>i?c.lineTo(q[0]+3,q[1]+2):c.moveTo(q[0]+3,q[1]+2));for(let i=inn.length-1;i>=0;i--)c.lineTo(inn[i][0],inn[i][1]);c.fill();c.restore();
  path();c.strokeStyle=INK;c.lineWidth=.9;c.stroke();
  for(let k=0;k<7;k++){const rx=x+(rng()<.5?-1:1)*(w/2+t*.3+rng()*8),ry=y+rng()*3,rr=1.4+rng()*2.2;c.fillStyle=col[1];c.beginPath();c.ellipse(rx,ry,rr,rr*.7,0,0,7);c.fill();c.strokeStyle=INK;c.lineWidth=.5;c.stroke()}}
function drawBoulders(c,x,y,st){c.drawImage(st,x-26,y-26,52,36)}

// ajudantes de perspectiva (usam as de assets.js quando carregadas)
const PF=(x,y,ang)=>{const ca=Math.cos(ang),sa=Math.sin(ang);return (a,b,h)=>[x+ca*a-sa*b,y+(sa*a+ca*b)*TILT-(h||0)]};
const PRZ=(c,x,y,L,D,H,ang,wall,top)=>window.AtlasAssets?AtlasAssets.prism(c,x,y,L,D,H,ang,wall,top):poly(c,[[x-L/2,y],[x+L/2,y],[x+L/2,y-H],[x-L/2,y-H]],wall[0],INK);
function drawRuin(c,x,y,rng){const ang=-.35+rng()*.2,P=PF(x,y,ang),W=["#c9c2b0","#8f897a"];c.lineWidth=.7;
  c.fillStyle="rgba(20,22,6,.22)";c.beginPath();c.ellipse(x+1.5,y+1,11,4.5,0,0,7);c.fill();
  poly(c,[P(-9,-5),P(7,-5),P(7,5),P(-9,5)],"rgba(150,140,110,.35)",null);
  const parts=[];for(let i=0;i<5;i++)parts.push({u:-8+i*3.6,v:-4.5,L:3.4,D:1.6,H:3+rng()*7});for(let i=0;i<3;i++)parts.push({u:-8.6,v:-2+i*3,L:1.6,D:2.8,H:2+rng()*5});parts.push({u:4,v:3,L:2,D:2,H:1.4});parts.push({u:-2,v:3.6,L:3,D:1.4,H:1});
  parts.sort((a,b)=>(P(a.u,a.v)[1])-(P(b.u,b.v)[1]));for(const q of parts){const b=P(q.u,q.v);PRZ(c,b[0],b[1],q.L,q.D,q.H,ang,W)}
  const arch=P(-1,-4.5);c.strokeStyle=INK;c.lineWidth=.8;c.fillStyle="#2b2418";c.beginPath();c.moveTo(arch[0]-1.4,arch[1]-.2);c.lineTo(arch[0]-1.4,arch[1]-3);c.arc(arch[0],arch[1]-3,1.4,3.1416,0);c.lineTo(arch[0]+1.4,arch[1]-.2);c.fill();
  c.fillStyle="rgba(110,140,60,.75)";for(let i=0;i<4;i++){const q=P(-6+rng()*12,-3+rng()*7);c.beginPath();c.arc(q[0],q[1]-.5,1+rng()*1.2,0,7);c.fill()}}
function drawStones(c,x,y,rng){const n=8,W=["#c2bcad","#7d7768"],st=[];for(let i=0;i<n;i++){const a=i/n*6.2832+.2,px=x+Math.cos(a)*9,py=y+Math.sin(a)*9*TILT;st.push({px,py,h:4.5+rng()*3,a})}
  c.fillStyle="rgba(20,22,6,.2)";c.beginPath();c.ellipse(x+1,y+.6,11,11*TILT,0,0,7);c.fill();c.fillStyle="rgba(170,160,120,.35)";c.beginPath();c.ellipse(x,y,6,6*TILT,0,0,7);c.fill();
  const alt=()=>PRZ(c,x,y+.4,4,2.4,1.4,.3,["#b9b3a2","#77705f"]);let alDone=false;
  st.sort((a,b)=>a.py-b.py);for(const q of st){if(!alDone&&q.py>y){alt();alDone=true}PRZ(c,q.px,q.py,2.2,1.5,q.h,q.a+1.5708,W)}if(!alDone)alt();
  const a=st[1],b=st[2];if(a&&b&&a.py<y&&b.py<y){const h=Math.min(a.h,b.h);poly(c,[[a.px-1,a.py-h-1.4],[b.px+1,b.py-h-1.4],[b.px+1,b.py-h],[a.px-1,a.py-h]],"#cfc9ba",INK)}}
function drawTotem(c,x,y){const cy_=(window.AtlasAssets&&AtlasAssets.cyl);c.fillStyle="rgba(20,22,6,.25)";c.beginPath();c.ellipse(x+1,y+.5,3,1.3,0,0,7);c.fill();
  if(cy_){cy_(c,x,y,1.7,16,["#9a6a3e","#5e3e22"],.9,[[3,5,"#a8352a"],[8,9.5,"#efe6cb"],[12,13.5,"#3f6f8f"]])}else poly(c,[[x-1.6,y],[x+1.6,y],[x+1.6,y-16],[x-1.6,y-16]],"#7a5432",INK);
  c.lineWidth=.6;poly(c,[[x-1.4,y-10.5],[x-6,y-12.5],[x-5.4,y-10],[x-1.4,y-9]],"#c98f45",INK);poly(c,[[x+1.4,y-10.5],[x+6,y-12.5],[x+5.4,y-10],[x+1.4,y-9]],"#a87436",INK);
  c.fillStyle="#efe6cb";c.strokeStyle=INK;c.lineWidth=.7;c.beginPath();c.ellipse(x,y-17.2,2.3,2.6,0,0,7);c.fill();c.stroke();c.fillStyle=INK;c.fillRect(x-1.2,y-17.8,.8,.8);c.fillRect(x+.4,y-17.8,.8,.8);c.fillRect(x-.6,y-16.2,1.2,.5)}
function drawTorii(c,x,y){const r=["#d0412f","#8f2a1e"],ang=-.25,P=PF(x,y,ang),cy_=(window.AtlasAssets&&AtlasAssets.cyl);c.fillStyle="rgba(20,22,6,.22)";c.beginPath();c.ellipse(x+1,y+.6,8,2.4,ang*TILT,0,7);c.fill();
  const L=P(-5,0),R=P(5,0);for(const b of [L,R]){if(cy_)cy_(c,b[0],b[1],.75,11,r,1);else poly(c,[[b[0]-.6,b[1]],[b[0]+.6,b[1]],[b[0]+.6,b[1]-11],[b[0]-.6,b[1]-11]],r[0],INK)}
  PRZ(c,P(0,0)[0],P(0,0)[1]-8,15,1,1,ang,r);
  const a=P(-8.6,0,12.4),b=P(8.6,0,12.4),m=P(0,0,11.2);c.fillStyle="#2b2114";c.strokeStyle=INK;c.lineWidth=.6;c.beginPath();c.moveTo(a[0],a[1]-1.2);c.quadraticCurveTo(m[0],m[1]+.6,b[0],b[1]-1.2);c.lineTo(b[0]-.3,b[1]+.4);c.quadraticCurveTo(m[0],m[1]+2,a[0]+.3,a[1]+.4);c.closePath();c.fill();c.stroke();
  PRZ(c,P(0,0)[0],P(0,0)[1]-10.6,16,1.2,.8,ang,r)}
function drawGraves(c,x,y,race){const ang=-.2,P=PF(x,y,ang),asian=race==="japones"||race==="chines";c.lineWidth=.6;
  poly(c,[P(-10,-6),P(10,-6),P(10,6),P(-10,6)],"rgba(120,130,70,.45)",null);
  const fence=(u0,v0,u1,v1)=>{const n=Math.max(2,Math.round(Math.hypot(u1-u0,v1-v0)/2.4));c.strokeStyle="#5e4630";c.lineWidth=.6;c.beginPath();for(let k=0;k<=n;k++){const u=lerp(u0,u1,k/n),v=lerp(v0,v1,k/n),a=P(u,v),b=P(u,v,2.2);c.moveTo(a[0],a[1]);c.lineTo(b[0],b[1])}const a=P(u0,v0,1.8),b=P(u1,v1,1.8);c.moveTo(a[0],a[1]);c.lineTo(b[0],b[1]);c.stroke()};
  fence(-10,-6,10,-6);fence(-10,-6,-10,6);fence(10,-6,10,6);
  const G=[];for(let i=0;i<4;i++)for(let j=0;j<3;j++)G.push([-7+i*4.6,-3.5+j*3.6]);G.sort((a,b)=>P(a[0],a[1])[1]-P(b[0],b[1])[1]);
  for(const [u,v] of G){const b=P(u,v),k=(Math.abs(u*7+v*3)|0)%3;poly(c,[P(u-1.4,v+.4),P(u+1.4,v+.4),P(u+1.4,v+2.4),P(u-1.4,v+2.4)],"rgba(110,90,60,.45)",null);
    if(asian||k===0)PRZ(c,b[0],b[1],1.6,.8,3,ang,["#c4beb0","#86806f"]);else if(k===1){c.strokeStyle=INK;c.lineWidth=1.3;c.beginPath();c.moveTo(b[0],b[1]);c.lineTo(b[0],b[1]-4);c.moveTo(b[0]-1.3,b[1]-2.8);c.lineTo(b[0]+1.3,b[1]-2.8);c.stroke();c.strokeStyle="#d6d0c0";c.lineWidth=.6;c.stroke()}
    else{c.fillStyle="#b9b3a4";c.strokeStyle=INK;c.lineWidth=.5;c.beginPath();c.moveTo(b[0]-1.1,b[1]);c.lineTo(b[0]-1.1,b[1]-2.2);c.arc(b[0],b[1]-2.2,1.1,3.14,0);c.lineTo(b[0]+1.1,b[1]);c.closePath();c.fill();c.stroke()}}
  fence(-10,6,10,6)}
function drawShrine(c,x,y,race){if(race==="japones"||race==="chines"){drawAsian(c,x,y,{L:5,D:4,H:3,R:2.6,ang:0,roof:race==="chines"?"cn":"jp",wall:race==="chines"?"red":"jpw"});return}
  if(race==="indiano"){drawShikhara(c,x+2,y,3);return}
  const ang=-.3,P=PF(x,y,ang);c.fillStyle="rgba(20,22,6,.22)";c.beginPath();c.ellipse(x+1,y+.6,5,2,0,0,7);c.fill();
  PRZ(c,x,y,5.4,4,1.2,ang,["#b9b3a2","#77705f"]);PRZ(c,x,y-1.2,3.4,2.6,1,ang,["#c9c2b0","#8f897a"]);
  const cy_=(window.AtlasAssets&&AtlasAssets.cyl);if(cy_)cy_(c,x,y-2.2,1,4.6,["#d6cfbd","#8f897a"],.8);c.fillStyle="#d6cfbd";c.strokeStyle=INK;c.lineWidth=.6;c.beginPath();c.arc(x,y-7.8,1.3,0,7);c.fill();c.stroke();
  for(const [u,v] of [[2.2,1.4],[-2.2,1.4]]){const q=P(u,v,1.2);c.fillStyle="#efe6cb";c.fillRect(q[0]-.3,q[1]-1.2,.6,1.2);c.fillStyle="#f0c060";c.beginPath();c.arc(q[0],q[1]-1.6,.45,0,7);c.fill()}
  c.fillStyle="#a8352a";const f=P(0,2.4,1.2);c.beginPath();c.arc(f[0]+2.2,f[1],.7,0,7);c.fill()}
function drawMine(c,x,y){c.lineWidth=.8;c.fillStyle="#9a8f78";c.strokeStyle=INK;c.beginPath();c.moveTo(x-12,y+1);c.quadraticCurveTo(x-7,y-12,x+2,y-11);c.quadraticCurveTo(x+10,y-9,x+12,y+1);c.closePath();c.fill();c.stroke();
  c.strokeStyle="rgba(60,50,30,.4)";c.lineWidth=.5;c.beginPath();for(let i=0;i<6;i++){c.moveTo(x-9+i*3.4,y-2-i%2);c.lineTo(x-7+i*3.4,y-6-i%3)}c.stroke();
  const ang=0,P=PF(x,y-.5,ang);poly(c,[P(-3,0,0),P(3,0,0),P(3,0,6),P(-3,0,6)],"#1e1914",INK);
  const beam=(u)=>{const a=P(u,0,0),b=P(u,0,6.6);c.strokeStyle=INK;c.lineWidth=1.9;c.beginPath();c.moveTo(a[0],a[1]);c.lineTo(b[0],b[1]);c.stroke();c.strokeStyle="#7a5432";c.lineWidth=1.1;c.stroke()};beam(-3.3);beam(3.3);
  PRZ(c,P(0,0)[0],P(0,0)[1]-6.4,8.4,1.4,1.2,ang,["#8a6440","#5e4026"]);
  const R=PF(x,y+.5,0);c.strokeStyle="#4a3524";c.lineWidth=.6;c.beginPath();for(const u of [-1.3,1.3]){const a=R(u,0),b=R(u+u*.4,10);c.moveTo(a[0],a[1]);c.lineTo(b[0],b[1])}for(let k=1;k<6;k++){const a=R(-1.3-.4*k/5*1.3,k*2),b=R(1.3+.4*k/5*1.3,k*2);c.moveTo(a[0]-.4,a[1]);c.lineTo(b[0]+.4,b[1])}c.stroke();
  if(window.AtlasAssets&&AtlasAssets.cart){const q=R(0,7);c.save();c.translate(q[0],q[1]);c.scale(.55,.55);AtlasAssets.cart(c,0,0,1.5708,false);c.restore()}
  const lp=P(4.6,1);c.strokeStyle="#4a3524";c.lineWidth=.6;c.beginPath();c.moveTo(lp[0],lp[1]);c.lineTo(lp[0],lp[1]-5);c.stroke();c.fillStyle="#f0c060";c.beginPath();c.arc(lp[0],lp[1]-5.4,.8,0,7);c.fill()}


// rochedo isometrico: blocos de pedra chanfrados, tampo de grama (ou neve) e uma boca na face de quem olha
function drawRockMass(c,x,y,o){const s=o.s||1,ca=Math.cos(o.ang||0),sa=Math.sin(o.ang||0),P0=(u,v,h)=>[x+(ca*u-sa*v)*s,y+(sa*u+ca*v)*TILT*s-(h||0)*s],fl=P0(0,1)[1]>=P0(0,0)[1]?1:-1,P=(u,v,h)=>P0(u,v*fl,h);
  const RC=o.snow?["#d8dee3","#9ea8b0"]:["#b3aa96","#6f6858"],TOP=o.snow?"#f1f4f6":"#9cad5c",lt=(nx,ny)=>clamp(.5+.62*(-nx*.85+ny*.3),0,1);
  const BL=[[-2,-4,20,11,11],[6,-6,11,8,15],[-8,0,9,8,7],[1,2.2,17,6.5,8.5],[10,1,6,5,4]].map(b=>({b,sy:P(b[0],b[1])[1]})).sort((p,q)=>p.sy-q.sy);c.lineJoin="round";c.lineWidth=.8;
  c.fillStyle="rgba(20,22,6,.28)";c.beginPath();c.ellipse(x+2*s,y+2*s,17*s,7.5*s,0,0,7);c.fill();
  for(const {b} of BL){const [u,v,L,D,H]=b,hl=L/2,hd=D/2,bv=2.4,cs=[[-hl,-hd],[hl,-hd],[hl,hd],[-hl,hd]],ci=[[-hl+bv,-hd+bv],[hl-bv,-hd+bv],[hl-bv,hd-bv],[-hl+bv,hd-bv]],fn=[[0,-1],[1,0],[0,1],[-1,0]];
    for(let k=0;k<4;k++){const a=cs[k],b2=cs[(k+1)%4],nx=(ca*fn[k][0]-sa*fn[k][1]*fl),ny=(sa*fn[k][0]+ca*fn[k][1]*fl);if(ny<=-.02)continue;const col=mixc(RC[1],RC[0],lt(nx,ny));poly(c,[P(u+a[0],v+a[1],0),P(u+b2[0],v+b2[1],0),P(u+b2[0],v+b2[1],H-bv),P(u+a[0],v+a[1],H-bv)],col,INK);
      const ai=ci[k],bi=ci[(k+1)%4];poly(c,[P(u+a[0],v+a[1],H-bv),P(u+b2[0],v+b2[1],H-bv),P(u+bi[0],v+bi[1],H),P(u+ai[0],v+ai[1],H)],mixc(RC[0],TOP,.25+.3*lt(nx,ny)),INK);
      c.strokeStyle="rgba(40,34,26,.35)";c.lineWidth=.5;c.beginPath();for(let t=.2;t<1;t+=.27){const p1=P(u+lerp(a[0],b2[0],t),v+lerp(a[1],b2[1],t),H*.15),p2=P(u+lerp(a[0],b2[0],t+.06),v+lerp(a[1],b2[1],t+.06),H*.75);c.moveTo(p1[0],p1[1]);c.lineTo(p2[0],p2[1])}c.stroke();c.lineWidth=.8}
    poly(c,ci.map(q=>P(u+q[0],v+q[1],H)),TOP,INK)}
  // boca na face da frente do bloco mais a frente
  const fb=[1,2.2,17,6.5,8.5],vf=fb[1]+fb[3]/2+.05,arch=[];arch.push(P(-3.4,vf,0));for(let k=0;k<=10;k++){const t=Math.PI-Math.PI*k/10;arch.push(P(Math.cos(t)*3.4,vf,4.2+Math.sin(t)*3.2))}arch.push(P(3.4,vf,0));poly(c,arch,"#17120e",INK);
  if(o.mine){c.lineWidth=1.1;for(const u of[-3.7,3.7]){const a=P(u,vf+.2,0),b=P(u,vf+.2,7.6);c.strokeStyle=INK;c.lineWidth=2.4;c.beginPath();c.moveTo(a[0],a[1]);c.lineTo(b[0],b[1]);c.stroke();c.strokeStyle="#7a5530";c.lineWidth=1.4;c.stroke()}{const a=P(-4.6,vf+.2,7.6),b=P(4.6,vf+.2,7.6);c.strokeStyle=INK;c.lineWidth=2.6;c.beginPath();c.moveTo(a[0],a[1]);c.lineTo(b[0],b[1]);c.stroke();c.strokeStyle="#8a6238";c.lineWidth=1.6;c.stroke()}
    for(const u of[-5.4,5.4]){const q=P(u,vf+.4,5.4);c.fillStyle="rgba(255,200,90,.35)";c.beginPath();c.arc(q[0],q[1],2.6,0,7);c.fill();c.fillStyle="#f6c04a";c.beginPath();c.arc(q[0],q[1],.8,0,7);c.fill()}}
  else{c.fillStyle="rgba(120,110,95,.9)";for(const u of[-2,0,1.8]){const a=P(u-.5,vf+.02,7),b=P(u+.5,vf+.02,7),t=P(u,vf+.02,5.6);c.beginPath();c.moveTo(a[0],a[1]);c.lineTo(b[0],b[1]);c.lineTo(t[0],t[1]);c.fill()}}
  return P}
// 1.12: marcos de cada bioma (inspirados nas tabelas de marcos do Sandbox Generator): ossada gigante, cristal, cogumelo colossal,
// circulo de cogumelos, fonte termal, cone vulcanico, arvore anciã luminosa, fenda sombria, menires, monolito, ilha flutuante, caverna
function drawMarco(c,x,y,q,rng,stamps){const s=q.s||1,id=q.id,INKm="#2b2114";c.save();
  if(id==="ossada"){c.translate(x,y);c.scale(s,s);c.fillStyle="rgba(40,30,20,.25)";c.beginPath();c.ellipse(0,2,26,6,0,0,7);c.fill();c.strokeStyle="#efe6cf";c.lineWidth=2.2;c.lineCap="round";for(let i=0;i<6;i++){const xx=-14+i*5;c.beginPath();c.moveTo(xx,0);c.quadraticCurveTo(xx-4,-10,xx+1,-15+Math.abs(i-2.5)*1.2);c.stroke();c.beginPath();c.moveTo(xx,0);c.quadraticCurveTo(xx+5,-8,xx+3,-13+Math.abs(i-2.5));c.stroke()}
    c.lineWidth=2.6;c.beginPath();c.moveTo(-18,-2);c.lineTo(14,-1);c.stroke();c.fillStyle="#efe6cf";c.strokeStyle=INKm;c.lineWidth=.8;c.beginPath();c.ellipse(20,-5,7,5,.2,0,7);c.fill();c.stroke();c.fillStyle=INKm;c.beginPath();c.arc(22,-6,1.4,0,7);c.fill();c.strokeStyle="#efe6cf";c.lineWidth=1.6;c.beginPath();c.moveTo(16,-9);c.quadraticCurveTo(12,-18,18,-20);c.stroke()}
  else if(id==="cristal"){const cs=q.cor||["#7f6ad8","#c4b6ff"];c.translate(x,y);c.scale(s*1.8,s*1.8);c.fillStyle="rgba(20,10,30,.3)";c.beginPath();c.ellipse(0,0,12,3.4,0,0,7);c.fill();for(let i=0;i<5;i++){const bx=(i-2)*4+(rng()-.5)*2,h=10+rng()*16*(i===2?1.6:1),w=2.6+rng()*2,ln=(i-2)*1.6;c.fillStyle=cs[0];c.strokeStyle="#1a1426";c.lineWidth=.6;c.beginPath();c.moveTo(bx-w,0);c.lineTo(bx-w*.7+ln,-h*.8);c.lineTo(bx+ln*1.2,-h);c.lineTo(bx+w*.7+ln,-h*.8);c.lineTo(bx+w,0);c.closePath();c.fill();c.stroke();c.fillStyle=cs[1];c.beginPath();c.moveTo(bx,0);c.lineTo(bx+ln*1.2,-h);c.lineTo(bx+w*.7+ln,-h*.8);c.lineTo(bx+w,0);c.fill()}c.fillStyle="rgba(255,255,255,.25)";c.beginPath();c.arc(0,-12,12,0,7);c.fill()}
  else if(id==="cogumelo"||id==="arvore"){const L=id==="cogumelo"?stamps.fungo:(q.b===15?stamps.magica:stamps.luz),st=L[(q.v*L.length)|0],w=st.width*.5*2.4*s,h=st.height*.5*2.4*s;c.drawImage(st,x-w/2,y-h*.9,w,h);if(id==="arvore"){c.fillStyle="rgba(140,240,255,.18)";c.beginPath();c.arc(x,y-h*.55,w*.5,0,7);c.fill()}}
  else if(id==="circulo"){c.translate(x,y);for(let i=0;i<12;i++){const a=i/12*6.2832,px=Math.cos(a)*14*s,py=Math.sin(a)*6*s;if(q.b===20||q.b===15||q.b===7){c.strokeStyle="#efe6cf";c.lineWidth=1.2;c.beginPath();c.moveTo(px,py);c.lineTo(px,py-3);c.stroke();c.fillStyle=q.b===15?"#9a86d8":"#b84a3a";c.beginPath();c.ellipse(px,py-3,2.4,1.3,0,Math.PI,0);c.fill()}else{c.fillStyle="#9a958a";c.strokeStyle=INKm;c.lineWidth=.6;c.fillRect(px-1.4,py-5,2.8,5);c.strokeRect(px-1.4,py-5,2.8,5)}}if(q.b===15){c.fillStyle="rgba(200,180,255,.25)";c.beginPath();c.ellipse(0,0,13*s,5*s,0,0,7);c.fill()}}
  else if(id==="termal"){c.translate(x,y);c.fillStyle="#8a7a62";c.beginPath();c.ellipse(0,0,14*s,6*s,0,0,7);c.fill();c.fillStyle="#5fd0d0";c.beginPath();c.ellipse(0,0,11*s,4.4*s,0,0,7);c.fill();c.fillStyle="#bff4f0";c.beginPath();c.ellipse(-2,-1,5*s,1.6*s,0,0,7);c.fill();c.fillStyle="rgba(245,245,245,.55)";for(let k=0;k<5;k++){c.beginPath();c.arc((rng()-.5)*10*s,-6-k*5*s,(3+k)*s,0,7);c.fill()}}
  else if(id==="vulcao"){c.translate(x,y);c.scale(s,s);c.fillStyle="rgba(0,0,0,.25)";c.beginPath();c.ellipse(4,2,34,9,0,0,7);c.fill();c.fillStyle="#4a3a34";c.strokeStyle=INKm;c.lineWidth=1;c.beginPath();c.moveTo(-32,0);c.quadraticCurveTo(-12,-10,-8,-30);c.lineTo(8,-30);c.quadraticCurveTo(12,-10,32,0);c.closePath();c.fill();c.stroke();c.fillStyle="#6a564c";c.beginPath();c.moveTo(0,0);c.lineTo(8,-30);c.quadraticCurveTo(12,-10,32,0);c.fill();
    c.fillStyle="#e2641e";c.beginPath();c.ellipse(0,-30,8,2.4,0,0,7);c.fill();c.strokeStyle="#e2641e";c.lineWidth=1.6;c.beginPath();c.moveTo(-3,-29);c.quadraticCurveTo(-8,-16,-14,-4);c.stroke();c.fillStyle="rgba(90,84,80,.55)";for(let k=0;k<6;k++){c.beginPath();c.arc(k*3-4,-36-k*6,4+k*1.6,0,7);c.fill()}}
  else if(id==="fenda"){c.translate(x,y);c.scale(s,s);c.fillStyle="rgba(140,60,190,.25)";c.beginPath();c.ellipse(0,0,26,8,0,0,7);c.fill();c.fillStyle="#120a18";c.beginPath();c.moveTo(-24,0);for(let k=-24;k<=24;k+=4)c.lineTo(k,-2+(rng()-.5)*3);for(let k=24;k>=-24;k-=4)c.lineTo(k,2+(rng()-.5)*3);c.fill();c.strokeStyle="#b060d0";c.lineWidth=.8;c.stroke()}
  else if(id==="monolito"){c.translate(x,y);c.scale(s,s);c.fillStyle="rgba(0,0,0,.3)";c.beginPath();c.ellipse(5,1,9,3,0,0,7);c.fill();c.fillStyle="#141418";c.strokeStyle="#000";c.fillRect(-4,-30,8,30);c.fillStyle="#24242c";c.fillRect(-4,-30,3,30);c.fillStyle=q.b===18?"#3ff0d0":"#b060d0";for(let k=0;k<4;k++)c.fillRect(-1,-26+k*6,2,3)}
  else if(id==="naufragio"){c.translate(x,y);c.scale(s,s);c.rotate(-.35);c.fillStyle="rgba(60,90,100,.35)";c.beginPath();c.ellipse(0,2,20,6,0,0,7);c.fill();c.fillStyle="#5a3e28";c.strokeStyle="#2b2114";c.lineWidth=.8;c.beginPath();c.moveTo(-16,0);c.quadraticCurveTo(-8,7,14,4);c.lineTo(12,-2);c.lineTo(-2,-1);c.lineTo(-6,-4);c.closePath();c.fill();c.stroke();
    c.strokeStyle="#4a3220";c.lineWidth=1.4;c.beginPath();c.moveTo(2,-1);c.lineTo(6,-18);c.stroke();c.fillStyle="rgba(230,220,200,.75)";c.beginPath();c.moveTo(6,-17);c.lineTo(14,-12);c.lineTo(5,-9);c.fill();c.strokeStyle="rgba(240,250,255,.6)";c.beginPath();c.ellipse(0,3,22,7,0,0,Math.PI);c.stroke()}
  else if(id==="menir"){drawStones(c,x,y,rng)}
  else if(id==="caverna"){drawCave(c,x,y,false,rng)}
  else if(id==="ruina"){drawRuin(c,x,y,rng)}
  else if(id==="ilha"){const hv=46*s;c.fillStyle="rgba(0,0,0,.22)";c.beginPath();c.ellipse(x+8,y,24*s,7*s,0,0,7);c.fill();c.translate(x,y-hv);c.scale(s,s);c.fillStyle="#6a5a4a";c.strokeStyle=INKm;c.lineWidth=.9;c.beginPath();c.moveTo(-24,0);c.quadraticCurveTo(-14,22,-2,30);c.quadraticCurveTo(10,18,24,0);c.closePath();c.fill();c.stroke();c.fillStyle="#4a3e34";c.beginPath();c.moveTo(-2,30);c.quadraticCurveTo(10,18,24,0);c.lineTo(8,0);c.fill();
    c.fillStyle=q.b===19?"#2f7a62":q.b===18?"#8a5aa8":"#6f9a4a";c.beginPath();c.ellipse(0,0,25,8,0,0,7);c.fill();c.stroke();const L=q.b===19?stamps.luz:q.b===18?stamps.alien:q.b===15?stamps.magica:stamps.dec;for(let k=0;k<3;k++){const st=L[k%L.length],w=st.width*.5*.9,h=st.height*.5*.9;c.drawImage(st,-14+k*12-w/2,-2-h*.85,w,h)}
    if(q.b===19){c.strokeStyle="rgba(60,140,90,.8)";c.lineWidth=.8;for(let k=0;k<4;k++){c.beginPath();c.moveTo(-10+k*6,20);c.quadraticCurveTo(-12+k*6,32,-8+k*7,40);c.stroke()}}}
  c.restore()}
function drawCave(c,x,y,snow,rng){rng=rng||Math.random;drawRockMass(c,x,y-2,{s:.72,ang:rng()*6.283,snow});}

function drawCamp(c,x,y,race,rng){const col=race==="orc"?["#7a5d40","#5a4430"]:race==="mongol"?["#efe6d2","#c2b79f"]:["#d8c9a0","#a8976c"];c.lineWidth=.7;
  for(const [dx,dy,s] of [[-7,-2,1],[6,-3,.9],[0,3,1.1]]){const tx=x+dx,ty=y+dy;if(race==="mongol"){drawRound(c,tx,ty,3.4*s,2.6*s,2.2*s,{wall:"felt",roof:"felt",yurt:1});continue}poly(c,[[tx-4*s,ty],[tx,ty-6*s],[tx+1.5*s,ty-.5]],col[0],INK);poly(c,[[tx+1.5*s,ty-.5],[tx,ty-6*s],[tx+4.5*s,ty-1.2]],col[1],INK);c.fillStyle="#3a2c1b";c.beginPath();c.moveTo(tx-.6,ty-.2);c.lineTo(tx+.8,ty-3.6);c.lineTo(tx+1,ty-.3);c.fill()}
  c.fillStyle="#3a2c1b";c.fillRect(x-.8,y-1,1.6,1);c.fillStyle="#e07a2a";c.beginPath();c.moveTo(x-1.4,y-.8);c.lineTo(x,y-3.6);c.lineTo(x+1.4,y-.8);c.fill();c.fillStyle="#f0c050";c.beginPath();c.moveTo(x-.6,y-.8);c.lineTo(x,y-2.4);c.lineTo(x+.6,y-.8);c.fill()}


function drawWatch(c,x,y){c.strokeStyle="#5a4128";c.lineWidth=1;c.beginPath();c.moveTo(x-3.4,y);c.lineTo(x-2.4,y-14);c.moveTo(x+3.4,y);c.lineTo(x+2.4,y-14);c.moveTo(x-3,y-4);c.lineTo(x+3,y-9);c.moveTo(x+3,y-4);c.lineTo(x-3,y-9);c.stroke();
  poly(c,[[x-4,y-14],[x+4,y-14],[x+4,y-17],[x-4,y-17]],"#a37c4c",INK);poly(c,[[x-5,y-17],[x,y-22],[x+5,y-17]],"#8d6c46",INK);c.fillStyle="#a8352a";c.fillRect(x-.3,y-26,.6,4);c.beginPath();c.moveTo(x+.3,y-26);c.lineTo(x+3,y-25);c.lineTo(x+.3,y-24);c.fill()}

function drawTower(c,x,y,w,h,rh,roof,wall,cren){
  const a=[.87*w,-.43*w],b=[-.87*w,-.43*w];c.lineWidth=.8;c.lineJoin="round";
  const F=[x,y],R=[x+a[0],y+a[1]],L=[x+b[0],y+b[1]],up=(p,k)=>[p[0],p[1]-k],top=[x,y+a[1]-h-rh],B=[x,y+2*a[1]];
  poly(c,[F,L,up(L,h),up(F,h)],wall[0],INK);poly(c,[F,R,up(R,h),up(F,h)],wall[1],INK);
  c.fillStyle="#3a2c1b";c.fillRect(x-w*.45-.5,y-h*.62,1.2,2.2);
  if(cren){poly(c,[up(F,h),up(R,h),up(B,h),up(L,h)],"#b8b19f",INK);c.strokeStyle=INK;c.setLineDash([1.6,1.6]);c.lineWidth=1.6;c.beginPath();c.moveTo(L[0],L[1]-h-.8);c.lineTo(F[0],F[1]-h-.8);c.lineTo(R[0],R[1]-h-.8);c.stroke();c.setLineDash([]);c.lineWidth=.8}
  else{poly(c,[up(L,h),up(F,h),top],roof[0],INK);poly(c,[up(F,h),up(R,h),top],roof[1],INK)}
}
function drawWall(c,p,q,h,fz){const lit=(q[1]-p[1])*(q[0]-p[0])>0,sd=fz==="sand";if(fz==="asian"){c.lineWidth=.8;poly(c,[p,q,[q[0],q[1]-h],[p[0],p[1]-h]],lit?"#ece5d3":"#bdb4a0",INK);poly(c,[[p[0],p[1]-2],[q[0],q[1]-2],[q[0],q[1]],[p[0],p[1]]],"#9a9484",INK);poly(c,[[p[0]-.6,p[1]-h+.6],[q[0]+.6,q[1]-h+.6],[q[0],q[1]-h-2.4],[p[0],p[1]-h-2.4]],"#4a525c",INK);return}
  c.lineWidth=.8;poly(c,[p,q,[q[0],q[1]-h],[p[0],p[1]-h]],sd?(lit?"#e2c48e":"#b8955c"):(lit?"#cfc8b6":"#a59f8e"),INK);
  poly(c,[[p[0],p[1]-h],[q[0],q[1]-h],[q[0],q[1]-h-2.2],[p[0],p[1]-h-2.2]],"#ddd6c4",INK);
  c.strokeStyle="rgba(60,50,35,.5)";c.lineWidth=.5;c.beginPath();c.moveTo(p[0],p[1]-h*.5);c.lineTo(q[0],q[1]-h*.5);c.stroke();
  c.strokeStyle=INK;c.lineWidth=1.5;c.setLineDash([1.8,1.8]);c.beginPath();c.moveTo(p[0],p[1]-h-3);c.lineTo(q[0],q[1]-h-3);c.stroke();c.setLineDash([])}
function drawWaterWall(c,p,q,h,fz){const lit=(q[1]-p[1])*(q[0]-p[0])>0,cust=fz&&fz.c;if(cust)fz="stone";
  if(fz==="palisade"){const n=Math.max(3,Math.round(Math.hypot(q[0]-p[0],q[1]-p[1])/3));c.lineWidth=.6;for(let i=0;i<=n;i++){if(i%3===1)continue;const x=lerp(p[0],q[0],i/n),y=lerp(p[1],q[1],i/n);poly(c,[[x-1,y+1.5],[x+1,y+1.5],[x+1,y-h],[x,y-h-1.4],[x-1,y-h]],i%2?"#8d6a44":"#7a5a38",INK)}
    poly(c,[[p[0],p[1]-h*.55],[q[0],q[1]-h*.55],[q[0],q[1]-h*.55-1.6],[p[0],p[1]-h*.55-1.6]],"#a37c4c",INK);return}
  if(fz==="hedge"){c.lineWidth=.7;poly(c,[[p[0],p[1]-2.6],[q[0],q[1]-2.6],[q[0],q[1]-1.2],[p[0],p[1]-1.2]],"#a37c4c",INK);for(let i=0;i<=4;i++){const x=lerp(p[0],q[0],i/4),y=lerp(p[1],q[1],i/4);c.fillStyle="#6f8d40";c.beginPath();c.arc(x,y-3.6,1.4,0,7);c.fill()}c.strokeStyle="#4f6a2a";c.beginPath();c.moveTo(p[0],p[1]-3.4);c.quadraticCurveTo((p[0]+q[0])/2,(p[1]+q[1])/2-6,q[0],q[1]-3.4);c.stroke();return}
  const pal=cust?cust:fz==="sand"?["#e2c48e","#b8955c","#efd8a8"]:fz==="asian"?["#ece5d3","#bdb4a0","#4a525c"]:["#cfc8b6","#a59f8e","#ddd6c4"];
  c.lineWidth=.8;poly(c,[p,q,[q[0],q[1]-h],[p[0],p[1]-h]],lit?pal[0]:pal[1],INK);
  const n=Math.max(1,Math.round(Math.hypot(q[0]-p[0],q[1]-p[1])/7));c.fillStyle="#26323a";
  for(let i=0;i<n;i++){const m=[lerp(p[0],q[0],(i+.5)/n),lerp(p[1],q[1],(i+.5)/n)];c.beginPath();c.moveTo(m[0]-1.7,m[1]);c.lineTo(m[0]-1.7,m[1]-h*.42);c.arc(m[0],m[1]-h*.42,1.7,3.1416,0);c.lineTo(m[0]+1.7,m[1]);c.closePath();c.fill()}
  c.strokeStyle="rgba(30,40,45,.55)";c.lineWidth=.5;for(let i=0;i<n;i++){const m=[lerp(p[0],q[0],(i+.5)/n),lerp(p[1],q[1],(i+.5)/n)];c.beginPath();c.moveTo(m[0]-1.5,m[1]-1);c.lineTo(m[0]+1.5,m[1]-1);c.moveTo(m[0]-1.5,m[1]-2.3);c.lineTo(m[0]+1.5,m[1]-2.3);c.stroke()}
  poly(c,[[p[0],p[1]-h],[q[0],q[1]-h],[q[0],q[1]-h-2.2],[p[0],p[1]-h-2.2]],pal[2],INK);if(fz==="asian")return;
  c.strokeStyle=INK;c.lineWidth=1.4;c.setLineDash([1.6,1.6]);c.beginPath();c.moveTo(p[0],p[1]-h-2.8);c.lineTo(q[0],q[1]-h-2.8);c.stroke();c.setLineDash([])}
function drawCliff(c,x,y,w,h,rng){
  const top=[],bot=[],n=5;for(let i=0;i<=n;i++){const t=i/n;top.push([x-w/2+w*t,y+(rng()-.5)*2.2]);bot.push([x-w/2+w*t+(rng()-.5)*2,y+h*(.55+rng()*.45)*Math.sin(.4+t*2.34)])}
  c.lineJoin="round";c.lineWidth=.9;c.beginPath();c.moveTo(top[0][0],top[0][1]);for(const q of top)c.lineTo(q[0],q[1]);for(let i=bot.length-1;i>=0;i--)c.lineTo(bot[i][0],bot[i][1]);c.closePath();
  const g=c.createLinearGradient(x,y,x,y+h);g.addColorStop(0,"rgba(185,171,136,1)");g.addColorStop(.6,"rgba(140,124,92,.9)");g.addColorStop(1,"rgba(125,110,82,0)");c.fillStyle=g;c.fill();
  c.strokeStyle=INK;c.lineWidth=1;c.beginPath();c.moveTo(top[0][0],top[0][1]);for(const q of top)c.lineTo(q[0],q[1]);c.stroke();c.lineWidth=.7;
  c.strokeStyle="rgba(55,42,25,.7)";c.lineWidth=.7;c.beginPath();for(let i=1;i<n;i++){const a=top[i],b=bot[i];c.moveTo(a[0]+.5,a[1]+1.2);c.lineTo(lerp(a[0],b[0],.8)+(rng()-.5)*1.5,lerp(a[1],b[1],.8))}c.stroke();
  c.strokeStyle="rgba(240,230,195,.6)";c.lineWidth=.8;c.beginPath();c.moveTo(top[0][0],top[0][1]+.6);for(const q of top)c.lineTo(q[0],q[1]+.6);c.stroke()}
function drawShip(c,x,y,big,flip){const s=big?1.2:.72;c.save();c.translate(x,y);c.scale(flip?-s:s,s);c.lineWidth=.8/s;c.lineJoin="round";
  c.strokeStyle="rgba(240,244,244,.65)";c.beginPath();c.moveTo(-12,2.6);c.quadraticCurveTo(0,5,12,2.6);c.stroke();
  poly(c,[[-10,-3.2],[10,-3.8],[7.5,2],[-6.5,2]],"#7d5833",INK);poly(c,[[-10,-3.2],[-5.5,-3.3],[-5.5,-5.8],[-10,-5.8]],"#94693c",INK);
  c.strokeStyle=INK;c.beginPath();c.moveTo(0,-3.5);c.lineTo(0,big?-18:-11.5);c.stroke();
  if(big){poly(c,[[-6.5,-16],[6.5,-16.6],[7.6,-6.4],[-7.6,-5.8]],"#efe6cb",INK);c.fillStyle="#a8352a";c.fillRect(-1,-14.5,2,7);c.fillRect(-3.6,-12,7.2,2);poly(c,[[0,-18],[4.5,-19.2],[0,-20.4]],"#a8352a",INK)}
  else poly(c,[[0,-11.5],[6.5,-4.2],[0,-4.2]],"#efe6cb",INK);
  c.restore()}
function drawMill(c,x,y,rot){drawTower(c,x,y,4.2,13,6,ROOF.shingle,WALL.daub);c.strokeStyle="#4a3520";c.lineWidth=1.1;const cx=x+2,cy=y-15;
  for(let i=0;i<4;i++){const a=rot+i*1.5708;c.beginPath();c.moveTo(cx,cy);c.lineTo(cx+Math.cos(a)*11,cy+Math.sin(a)*11);c.stroke();
    c.save();c.translate(cx+Math.cos(a)*7,cy+Math.sin(a)*7);c.rotate(a);c.fillStyle="rgba(230,220,190,.85)";c.fillRect(-3.5,0,7,2.6);c.lineWidth=.5;c.strokeRect(-3.5,0,7,2.6);c.restore();c.lineWidth=1.1}}
function drawSmoke(c,x,y,rng){for(let i=0;i<3;i++){const px=x+i*1.8+(rng()-.5)*1.5,py=y-i*3.6,r=1.4+i*.75;c.fillStyle="#4a3d3f";c.beginPath();c.arc(px,py,r+.7,0,7);c.fill();c.fillStyle="#c9b9b3";c.beginPath();c.arc(px,py,r,0,7);c.fill();c.strokeStyle="rgba(70,50,55,.6)";c.lineWidth=.5;c.beginPath();c.arc(px,py,r*.55,.2,2.6);c.stroke()}}
function puff(c,x,y,w,h,tone,rng){
  const lobes=[],n=4+((rng()*3)|0);
  for(let i=0;i<n;i++){const t=(i+.5)/n;lobes.push([x+(t-.5)*w*.86,y+h*.12+(rng()-.5)*h*.05,h*(.28+rng()*.08)])}
  const m=Math.max(1,n-2);for(let i=0;i<m;i++){const t=(i+.5)/m;lobes.push([x+(t-.5)*w*.52+(rng()-.5)*6,y-h*.1-rng()*h*.08,h*(.33+rng()*.09)])}
  lobes.sort((a,b)=>a[1]-b[1]);
  c.fillStyle="#34342b";for(const[lx,ly,lr]of lobes){c.beginPath();c.arc(lx,ly,lr+1.5,0,7);c.fill()}
  for(const[lx,ly,lr]of lobes){
    c.save();c.beginPath();c.arc(lx,ly,lr,0,7);c.clip();c.fillStyle=tone[0];c.fillRect(lx-lr-1,ly-lr-1,lr*2+2,lr*2+2);
    const ox=lx-lr*.32,oy=ly-lr*.45;c.strokeStyle=tone[1];c.lineWidth=.75;
    for(let rr=lr*.98;rr<lr*1.75;rr+=2){c.beginPath();c.arc(ox,oy,rr,0,7);c.stroke()}
    c.restore();
    c.strokeStyle="#34342b";c.lineWidth=1.1;c.beginPath();c.arc(lx,ly,lr,3.25,6.2);c.stroke()}
}
const RFONTS={fell:'"IM Fell English SC","IM Fell English",Georgia,serif',alegreya:'Alegreya,Georgia,serif',georgia:'Georgia,"Times New Roman",serif',sans:'"Alegreya Sans",system-ui,sans-serif'};
function banner(c,x,y,text,major,rng,ff,sc){sc=sc||1;
  c.font=Math.round((major?17:13)*sc)+"px "+(ff||RFONTS.fell);
  const tw=c.measureText(text.toUpperCase()).width,h=major?26:20,w=tw+(major?74:30),x0=x-w/2,y0=y-h/2;
  c.fillStyle="rgba(20,15,5,.35)";c.fillRect(x0+3,y0+4,w,h);
  c.lineWidth=1;c.strokeStyle=INK;
  poly(c,[[x0+w-2,y0+3],[x0+w+12,y0-5],[x0+w+9,y0+h*.5],[x0+w+13,y0+h-1],[x0+w-2,y0+h-3]],"#cfc4a6",INK);
  poly(c,[[x0,y0+2],[x0+w,y0],[x0+w,y0+h-2],[x0,y0+h]],"#efe7d0",INK);
  c.fillStyle="#1d160d";c.textBaseline="middle";c.textAlign="left";c.fillText(text.toUpperCase(),x0+(major?28:14),y+1);
  if(major){poly(c,[[x0+14,y-5],[x0+19,y],[x0+14,y+5],[x0+9,y]],"#a8352a");
    const sx=x0+w-26,sy=y0-3,cols=[["#d8b63a","#a8352a"],["#2f4f86","#e8e0c8"],["#a8352a","#e8e0c8"],["#2f6a3b","#d8b63a"]][(rng()*4)|0];
    const sh=()=>{c.beginPath();c.moveTo(sx,sy);c.lineTo(sx+22,sy);c.lineTo(sx+22,sy+16);c.quadraticCurveTo(sx+21,sy+27,sx+11,sy+32);c.quadraticCurveTo(sx+1,sy+27,sx,sy+16);c.closePath()};
    c.save();sh();c.clip();c.fillStyle=cols[0];c.fillRect(sx,sy,22,34);c.fillStyle=cols[1];
    const m=(rng()*3)|0;if(m===0)c.fillRect(sx+11,sy,11,34);else if(m===1)c.fillRect(sx,sy+11,22,9);else poly(c,[[sx,sy],[sx+7,sy],[sx+22,sy+26],[sx+22,sy+34],[sx+15,sy+34],[sx,sy+8]],cols[1]);
    c.restore();sh();c.strokeStyle=INK;c.stroke()}
}

// ---------- geracao ----------
const SPEC={hut:{L:[7,9],D:[5,6],H:[3.2,4],R:[3.4,4.4],roof:["thatch","old"],wall:["daub","wood"],door:1},
    shed:{L:[5.5,7],D:[4,5],H:[2.8,3.4],R:[2.6,3.2],roof:["thatch","old","shingle"],wall:["wood","daub"]},
    farm:{L:[10,13],D:[6,7.5],H:[4.2,5],R:[4,5],roof:["thatch","thatch","shingle"],wall:["daub"],door:1,win:1},
    barn:{L:[15,19],D:[8,9.5],H:[5,6],R:[5,6],roof:["old","shingle"],wall:["wood"],door:2},
    town:{L:[9,12],D:[6,7],H:[7,8.5],R:[4.5,5.5],roof:["tile","tile","dark"],wall:["daub"],door:1,win:1,timber:1},
    row:{L:[6.5,8],D:[8,10],H:[7,8],R:[4,4.6],roof:["tile","dark"],wall:["daub"],door:1,win:1,timber:1},
    rich:{L:[13,16],D:[7.5,9],H:[8.5,10],R:[5.5,6.5],roof:["tile","dark"],wall:["daub","stone"],door:2,win:1,timber:1,chim:1},
    manor:{L:[19,23],D:[9.5,11],H:[10,11.5],R:[6.5,7.5],roof:["dark","slate"],wall:["stone"],door:2,win:1,chim:1},
    tavern:{L:[13,15],D:[7.5,8.5],H:[7.5,8.5],R:[5,6],roof:["tile","shingle"],wall:["daub"],door:2,win:1,timber:1,chim:1,sign:1},
    smithy:{L:[10,12],D:[7,8],H:[4.6,5.4],R:[4,4.6],roof:["slate","shingle"],wall:["stone"],door:2,smoke:1}};
ROOF.rust=ROOF.rust||["#b0612e","#7a3f1c"];ROOF.iron=ROOF.iron||["#6d7176","#45484c"];ROOF.patch=ROOF.patch||["#6e5a44","#463828"];ROOF.black=ROOF.black||["#4a4646","#2e2b2b"];ROOF.copper=ROOF.copper||["#5f9a86","#3d6b5b"];WALL.iron=WALL.iron||["#7c8086","#54575c"];WALL.rust=WALL.rust||["#a8623a","#74401f"];WALL.soot=WALL.soot||["#7e5546","#553529"];WALL.tar=WALL.tar||["#5e4a36","#3b2d20"];WALL.shipwood=WALL.shipwood||["#8b6a44","#5f472c"];
// casa pronta para drawBuilding, na cultura e no tipo pedidos (usada nos objetos manuais e no mapa de cidade)
function mkHouse(race,type,rng,ang,dim){if((CUL[race]||{}).mod){const m=mkMod(race,type,rng,ang,dim);if(m)return m}const sp=SPEC[type]||SPEC.town,C=CUL[race]||CUL.humano,R2=a=>a[0]+rng()*(a[1]-a[0]),pick=a=>a[(rng()*a.length)|0];let L=R2(sp.L),D=R2(sp.D),H=R2(sp.H)*.72,R=R2(sp.R)*.8,form=C.form;
  if(dim){H*=clamp(Math.sqrt(dim.L*dim.D/(L*D)),.8,1.25);L=dim.L;D=dim.D}
  if(form==="round"||form==="mound"||form==="yurt"){const m=(L+D)/2;L=m*.95;D=m*.95;if(form!=="mound")H*=.8}if(form==="asian"){H*=.85;R*=1.15}if(C.low&&!dim){L*=1.12}if(C.low)H*=.8;if(C.steep)R*=1.5;if(C.lowR)R*=.55;if(form==="flat")R=0;if(form==="long"&&type!=="shed"&&!dim)L*=1.3;
  const rural=type==="hut"||type==="shed"||type==="barn"||type==="farm",roof=rural&&form==="gable"&&race==="humano"&&rng()<.6?pick(sp.roof):dim&&dim.roof||pick(C.roof),wall=rural&&race==="humano"&&rng()<.5?pick(sp.wall):dim&&dim.wall||pick(C.wall);
  const big=type==="rich"||type==="manor"||type==="tavern",urb=type==="town"||type==="row"||big;H*=form==="gable"&&urb?.82+rng()*.45:.9+rng()*.2;
  let wing=null,tower=null,dorm=null;const ca=Math.cos(ang),sa=Math.sin(ang);
  if((form==="gable"||form==="long")&&!(dim&&dim.plain)){
    if((big||type==="farm"||type==="barn")&&rng()<(big?.7:.4)){const wl=D*(.7+rng()*.5),wd=L*(.32+rng()*.22),s0=rng()<.5?-1:1,e0=rng()<.5?-1:1,u=e0*(L/2-wd/2),v=s0*(D/2+wl/2-.6);wing={dx:ca*u-sa*v,dy:(sa*u+ca*v)*TILT,L:wl,D:wd,h:.8+rng()*.15,ang:ang+1.5708}}
    if(type==="manor"&&rng()<.6||type==="rich"&&rng()<.14||type==="tavern"&&rng()<.06){const end=rng()<.5?-1:1,u=end*L/2;tower={dx:ca*u,dy:sa*u*TILT+1,w:2.6+rng()*.8,h:H+R+4+rng()*5,r:4+rng()*2,back:(sa*end)<0}}
    if(urb&&R>2.6&&rng()<.5){dorm=[];const n=1+((L/7)|0);for(let q=0;q<n;q++)dorm.push(-L/2+L*(q+.5)/n)}}
  return {k:1,ang,type,L,D,H,R,form,roof,wall,wing,tower,dorm,tr:(rng()-.5)*.13,tw:(rng()-.5)*.07,door:sp.door,win:sp.win,timber:race==="humano"&&sp.timber&&rng()<.8,chim:sp.chim,sign:sp.sign,smoke:sp.smoke,dome:form==="flat"&&(type==="rich"||type==="manor")&&rng()<.7,spike:race==="orc"}}
// ===== construcoes modernas e cyberpunk: mesmas casas do gerador, com volumes, fachadas e coberturas proprias =====
function mkMod(race,type,rng,ang,dim){const cy=race==="cyber",sp=SPEC[type]||SPEC.town,R2=a=>a[0]+rng()*(a[1]-a[0]),pick=a=>a[(rng()*a.length)|0],C=CUL[race];
  const L=dim?dim.L:R2(sp.L),D=dim?dim.D:R2(sp.D),dn=dim&&dim.dn!=null?dim.dn:.8,sz=dim&&dim.csz||12,zt=dim&&dim.zt||"moradia",mn=Math.min(L,D);
  const zk={mercado:1.25,mercadores:1.15,nobre:.85,universidade:.8,porto:.55,artesaos:.6,moradia:.7,estrangeiro:.7,templo:.6,militar:.5,producao:.35,pobre:.3,arrabalde:.1,castelo:.9}[zt];
  const u=clamp((1.15-dn)*clamp(sz/22,.25,1.15)*(zk==null?.6:zk)+(cy?.16:0),0,1),h=rng(),t=u+(h-.5)*.5;let kind;
  if(type==="hut"||type==="shed")kind=cy?"barraco":h<.35?"barraco":"casa";
  else if(type==="barn"||type==="smithy"||(zt==="producao"&&h<.75)||(zt==="porto"&&h<.4))kind="galpao";
  else if(type==="farm")kind="casa";
  else if(type==="tavern")kind="loja";
  else{kind=t>.74?"torre":t>.44?"predio":t>.24?(rng()<.5?"sobrado":"loja"):"casa";if((type==="manor"||(type==="rich"&&rng()<.5))&&(kind==="casa"||kind==="sobrado")&&mn>8)kind="mansao";if(zt==="pobre"&&kind==="casa"&&rng()<.5)kind="barraco"}
  if(kind==="torre"&&mn<6.5)kind="predio";if(kind==="predio"&&mn<5.5)kind="sobrado";if(cy&&kind==="casa")kind="sobrado";
  if(kind==="casa")return null;
  const FH=1.7;let fl=1;
  if(kind==="sobrado")fl=2+(rng()<.25?1:0);else if(kind==="loja")fl=1+(rng()<.45?1:0);else if(kind==="predio")fl=3+Math.round(rng()*(2+u*7));else if(kind==="torre")fl=Math.min(cy?26:20,Math.round(8+u*10*rng()+rng()*5),Math.round(mn*2.2));else if(kind==="mansao")fl=2;else if(kind==="galpao")fl=2;
  const wall=kind==="torre"?(cy?pick(["m_cyv","m_cyv2","m_cy1","m_cy3"]):pick(["m_vidro","m_vidro","m_vidro2","m_vidro3","m_bronze","m_conc","m_grafite"])):kind==="mansao"&&!cy?pick(["m_branco","m_branco","m_creme","m_conc"]):kind==="galpao"?(cy?pick(["m_cy4","m_cy1","rust"]):pick(["m_conc","m_tijolo","m_azulc","m_conc","m_areia"])):kind==="barraco"?pick(["m_tijolo","m_tijolo","rust","m_conc","m_azulc","m_rosa","m_verdec"]):dim&&dim.wall&&WALL[dim.wall]&&String(dim.wall).startsWith("m_")?dim.wall:pick(C.wall);
  return {k:1,ang,type,L,D,H:fl*FH,Hm:fl*FH,R:0,form:"mod",roof:"dark",wall,kind,fl,cy:cy?1:0,mv:(rng()*997)|0,sd:(rng()*4294967295)>>>0,wing:null,tower:null,dorm:null,tr:0,tw:0,door:1,win:1}}
function drawMod(c,x,y,o){const ca=Math.cos(o.ang),sa=Math.sin(o.ang),U=[ca,sa*TILT],V=[-sa,ca*TILT],W=WALL[o.wall]||WALL.m_conc,cy=o.cy,hl=o.L/2,hd=o.D/2,snow=o.roof==="snow";
  let s=(o.sd||7)>>>0;const rn=()=>{s=(Math.imul(s,1664525)+1013904223)>>>0;return s/4294967296},pk=a=>a[(rn()*a.length)|0];
  const fl=Math.max(1,Math.round(o.fl*(o.H/(o.Hm||o.H)))),FH=1.7,H=fl*FH;
  const P=(a,b,h)=>[x+U[0]*a+V[0]*b,y+U[1]*a+V[1]*b-(h||0)],lt=(nx,ny)=>clamp(.5+.62*(-nx*.85+ny*.3),0,1);c.lineJoin="round";c.lineWidth=.7;
  const G=cy?["#3f5b78","#141c28"]:WALL[pk(["m_vidro","m_vidro","m_vidro2","m_vidro3"])],WD=cy?"#10141c":"#3d4f60",NEON=["#3df2e6","#ff3fb4","#ffd23f","#7dff5a","#b06bff","#ff7a2f"],LIT=cy?.34:.1,AW=pk(["#c0432f","#2f6f8f","#d39a2c","#3f7f4a","#7a3f8a","#cf5f2a","#285a9c"]),nz=pk(NEON);
  // sombra no chao, comprida conforme a altura
  {const sl=1.6+H*.3,st=Math.max(1,Math.ceil(sl/Math.max(2,Math.min(o.L,o.D)*.45)));c.fillStyle="rgba(20,22,6,.26)";c.beginPath();for(let k=0;k<=st;k++){const dx=sl*k/st,dy=dx*.42;[P(-hl,-hd),P(hl,-hd),P(hl,hd),P(-hl,hd)].forEach((q,i)=>i?c.lineTo(q[0]+dx,q[1]+dy):c.moveTo(q[0]+dx,q[1]+dy));c.closePath()}c.fill()}
  const face=(A0,A1,h0,h1,sh,st,len,wl)=>{const Q=(t,h)=>P(A0[0]+(A1[0]-A0[0])*t,A0[1]+(A1[1]-A0[1])*t,h),gl=st==="glass";
    poly(c,[Q(0,h0),Q(1,h0),Q(1,h1),Q(0,h1)],gl?mixc(G[1],G[0],sh):mixc(wl[1],wl[0],sh),INK);if(!st||len<1.4)return;
    const nf=Math.max(1,Math.round((h1-h0)/FH)),fh=(h1-h0)/nf,nc=Math.max(1,Math.round(len/1.9)),quad=(t0,t1,ha,hb)=>{const p=Q(t0,ha),q=Q(t1,ha),r=Q(t1,hb),z=Q(t0,hb);c.moveTo(p[0],p[1]);c.lineTo(q[0],q[1]);c.lineTo(r[0],r[1]);c.lineTo(z[0],z[1]);c.closePath()};
    if(gl){c.strokeStyle=cy?"rgba(90,220,255,.3)":"rgba(255,255,255,.34)";c.lineWidth=.28;c.beginPath();for(let f=1;f<nf;f++){const p=Q(0,h0+f*fh),q=Q(1,h0+f*fh);c.moveTo(p[0],p[1]);c.lineTo(q[0],q[1])}for(let i=1;i<nc;i++){const p=Q(i/nc,h0),q=Q(i/nc,h1);c.moveTo(p[0],p[1]);c.lineTo(q[0],q[1])}c.stroke();c.fillStyle=cy?"rgba(120,230,255,.12)":"rgba(255,255,255,.2)";c.beginPath();quad(.1,.3,h0+(h1-h0)*.08,h1-(h1-h0)*.05);c.fill();
      if(cy){c.fillStyle=nz;c.beginPath();for(let f=0;f<nf;f++)if(rn()<.3){const i=(rn()*nc)|0;quad(i/nc+.1/nc,(i+1)/nc-.1/nc,h0+f*fh+fh*.2,h0+f*fh+fh*.8)}c.globalAlpha=.75;c.fill();c.globalAlpha=1}c.lineWidth=.7;return}
    let f0=0;if(st==="shop"){c.beginPath();quad(.07,.93,h0+.2,h0+fh*.7);c.fillStyle=cy?"#1b2a36":"#526a7c";c.fill();c.beginPath();quad(.03,.97,h0+fh*.72,h0+fh*.98);c.fillStyle=cy?nz:AW;c.fill();f0=1;st=nf>3?"win":"balc"}
    if(st==="blank"){c.beginPath();quad(.38,.62,h0,h0+Math.min(h1-h0,2.2)*.85);c.fillStyle=cy?"#1c2026":"#5c6268";c.fill();return}
    if(st==="band"){c.beginPath();for(let f=f0;f<nf;f++)quad(.05,.95,h0+f*fh+fh*.3,h0+f*fh+fh*.8);c.fillStyle=mixc(G[1],G[0],sh*.7+.15);c.fill();if(cy){c.beginPath();for(let f=f0;f<nf;f++)if(rn()<.3)quad(.05,.95,h0+f*fh+fh*.16,h0+f*fh+fh*.24);c.fillStyle=nz;c.fill()}return}
    const lit=[];c.beginPath();for(let f=f0;f<nf;f++)for(let i=0;i<nc;i++){const q=[(i+.24)/nc,(i+.76)/nc,h0+f*fh+fh*.3,h0+f*fh+fh*.8];if(rn()<LIT)lit.push(q);else quad(q[0],q[1],q[2],q[3])}c.fillStyle=WD;c.fill();
    if(lit.length){c.beginPath();for(const q of lit)quad(q[0],q[1],q[2],q[3]);c.fillStyle=cy?pk(NEON):"#f1dc92";c.fill()}
    if(st==="balc"){c.strokeStyle=mixc(wl[0],"#ffffff",.55);c.lineWidth=.5;c.beginPath();for(let f=Math.max(1,f0);f<nf;f++){const p=Q(.08,h0+f*fh+.2),q=Q(.92,h0+f*fh+.2);c.moveTo(p[0],p[1]);c.lineTo(q[0],q[1])}c.stroke();c.lineWidth=.7}
    if(f0===0&&h0===0){c.beginPath();quad(.5-.5/nc*.8,.5+.5/nc*.8,0,Math.min(1.3,fh*.8));c.fillStyle=cy?"#0c0f14":"#4a3524";c.fill()}};
  const box=(a0,a1,b0,b1,h0,h1,wl,st,op)=>{op=op||{};for(const d of[-1,1]){if(ca*d>.02){const b=d>0?b1:b0;face([a0,b],[a1,b],h0,h1,lt(-sa*d,ca*d),st,a1-a0,wl)}if(sa*d>.02){const a=d>0?a1:a0;face([a,b0],[a,b1],h0,h1,lt(ca*d,sa*d),st==="shop"?"win":st,b1-b0,wl)}}
    if(op.notop)return;poly(c,[P(a0,b0,h1),P(a1,b0,h1),P(a1,b1,h1),P(a0,b1,h1)],snow?"#eef1f3":op.top||mixc(wl[0],"#ffffff",cy?.05:.3),INK);
    if(a1-a0>3&&b1-b0>3&&!op.top)poly(c,[P(a0+.45,b0+.45,h1),P(a1-.45,b0+.45,h1),P(a1-.45,b1-.45,h1),P(a0+.45,b1-.45,h1)],snow?"#dfe6ea":cy?mixc(wl[1],"#000000",.25):mixc(wl[1],wl[0],.55),null)};
  const cyl=(a,b,r,h0,h1,gl,rings)=>{const p=P(a,b,h0),hh=h1-h0,ry=r*TILT,g=c.createLinearGradient(p[0]-r,0,p[0]+r,0);g.addColorStop(0,gl[0]);g.addColorStop(.3,mixc(gl[0],"#ffffff",.3));g.addColorStop(1,gl[1]);c.fillStyle=g;c.strokeStyle=INK;c.lineWidth=.7;
    c.beginPath();c.moveTo(p[0]-r,p[1]-hh);c.lineTo(p[0]-r,p[1]);c.ellipse(p[0],p[1],r,ry,0,3.1416,0,true);c.lineTo(p[0]+r,p[1]-hh);c.ellipse(p[0],p[1]-hh,r,ry,0,0,3.1416);c.closePath();c.fill();c.stroke();
    if(rings){c.strokeStyle=cy?"rgba(90,220,255,.35)":"rgba(255,255,255,.4)";c.lineWidth=.28;const n=Math.round(hh/FH);for(let f=1;f<n;f++){c.beginPath();c.ellipse(p[0],p[1]-f*hh/n,r,ry,0,0,3.1416);c.stroke()}c.lineWidth=.7;c.strokeStyle=INK}
    c.fillStyle=snow?"#eef1f3":mixc(gl[0],"#ffffff",.25);c.beginPath();c.ellipse(p[0],p[1]-hh,r,ry,0,0,7);c.fill();c.stroke()};
  const GREY=["#c9cdd0","#8d9296"],line=(p,q,col,w)=>{c.strokeStyle=col;c.lineWidth=w;c.beginPath();c.moveTo(p[0],p[1]);c.lineTo(q[0],q[1]);c.stroke();c.lineWidth=.7};
  const panel=(a,b,h,w,hh,col,legs)=>{const p=P(a,b,h);if(legs){line([p[0]-w*.35,p[1]],[p[0]-w*.35,p[1]-legs],INK,.4);line([p[0]+w*.35,p[1]],[p[0]+w*.35,p[1]-legs],INK,.4)}const y0=p[1]-(legs||0);if(cy){c.fillStyle=col;c.globalAlpha=.22;c.fillRect(p[0]-w/2-.7,y0-hh-.7,w+1.4,hh+1.4);c.globalAlpha=1}c.fillStyle=col;c.strokeStyle=INK;c.lineWidth=.45;c.fillRect(p[0]-w/2,y0-hh,w,hh);c.strokeRect(p[0]-w/2,y0-hh,w,hh);c.fillStyle=cy?"rgba(10,12,20,.55)":"rgba(255,255,255,.7)";c.fillRect(p[0]-w*.32,y0-hh*.68,w*.64,hh*.14);c.fillRect(p[0]-w*.2,y0-hh*.4,w*.4,hh*.12);c.lineWidth=.7};
  // objetos de cobertura: caixa d'agua, ar-condicionado, casa de maquinas, paineis, jardim, heliponto, antena, outdoor
  const stuff=(a0,a1,b0,b1,h,n,ks)=>{const wa=a1-a0,wb=b1-b0;if(wa<2.4||wb<2.4)return;const it=[];for(let i=0;i<n;i++)it.push([pk(ks),a0+1.1+(wa-2.2)*rn(),b0+1.1+(wb-2.2)*rn()]);it.sort((p,q)=>(sa*p[1]+ca*p[2])-(sa*q[1]+ca*q[2]));
    for(const [k,a,b] of it){if(k==="tank"){const p=P(a,b,h);for(const dx of[-.5,.5])line([p[0]+dx,p[1]],[p[0]+dx,p[1]-.7],INK,.3);cyl(a,b,.8,h+.6,h+1.9,cy?["#7a6a52","#3c3226"]:["#9fb6c6","#5a6f80"])}
      else if(k==="ac")box(a-.6,a+.6,b-.4,b+.4,h,h+.55,GREY,null,{top:"#dfe2e4"});
      else if(k==="head")box(a-1.1,a+1.1,b-.9,b+.9,h,h+1.4,W,null);
      else if(k==="solar"&&wa>4){const w=Math.min(2.6,wa*.3),d=Math.min(1.6,wb*.3);poly(c,[P(a-w,b-d,h+.15),P(a+w,b-d,h+.15),P(a+w,b+d,h+.15),P(a-w,b+d,h+.15)],"#27456e","#16243a");c.strokeStyle="rgba(190,215,255,.6)";c.lineWidth=.22;c.beginPath();for(let i=1;i<4;i++){const p=P(a-w+2*w*i/4,b-d,h+.15),q=P(a-w+2*w*i/4,b+d,h+.15);c.moveTo(p[0],p[1]);c.lineTo(q[0],q[1])}c.stroke();c.lineWidth=.7}
      else if(k==="garden"&&wa>4){const w=Math.min(wa*.36,4),d=Math.min(wb*.36,3);poly(c,[P(a-w,b-d,h+.1),P(a+w,b-d,h+.1),P(a+w,b+d,h+.1),P(a-w,b+d,h+.1)],snow?"#e4ebe4":"#7fa650","rgba(40,60,20,.7)");for(let i=0;i<4;i++){const q=P(a+(rn()-.5)*w*1.5,b+(rn()-.5)*d*1.5,h+.5);c.fillStyle=i%2?"#4f7f36":"#5f9440";c.beginPath();c.arc(q[0],q[1],.75,0,7);c.fill()}}
      else if(k==="pool"&&wa>5){const w=Math.min(wa*.3,3),d=Math.min(wb*.3,1.8);poly(c,[P(a-w,b-d,h+.08),P(a+w,b-d,h+.08),P(a+w,b+d,h+.08),P(a-w,b+d,h+.08)],"#5ec3dd","#e9eef0")}
      else if(k==="heli"&&wa>6&&wb>6){const p=P(a0+wa/2,b0+wb/2,h+.1),r=Math.min(wa,wb)*.3;c.fillStyle=cy?"#23262e":"#7d8288";c.strokeStyle=cy?nz:"#f3f1e6";c.lineWidth=.45;c.beginPath();c.ellipse(p[0],p[1],r,r*TILT,0,0,7);c.fill();c.stroke();c.beginPath();c.moveTo(p[0]-r*.3,p[1]-r*.25);c.lineTo(p[0]-r*.3,p[1]+r*.25);c.moveTo(p[0]+r*.3,p[1]-r*.25);c.lineTo(p[0]+r*.3,p[1]+r*.25);c.moveTo(p[0]-r*.3,p[1]);c.lineTo(p[0]+r*.3,p[1]);c.stroke();c.lineWidth=.7}
      else if(k==="ant"){const p=P(a,b,h),hh=3+rn()*4;line(p,[p[0],p[1]-hh],INK,.4);line([p[0]-.6,p[1]-hh*.6],[p[0]+.6,p[1]-hh*.6],INK,.3);c.fillStyle=cy?nz:"#d8342a";c.beginPath();c.arc(p[0],p[1]-hh,.4,0,7);c.fill()}
      else if(k==="dish"){const p=P(a,b,h);line(p,[p[0],p[1]-.8],INK,.35);c.fillStyle="#e8eaec";c.strokeStyle=INK;c.lineWidth=.35;c.beginPath();c.ellipse(p[0],p[1]-1.1,.85,.55,-.5,0,7);c.fill();c.stroke();c.lineWidth=.7}
      else if(k==="bill")panel(a,b,h,Math.min(wa*.6,3.6+rn()*1.5),1.7+rn()*.8,cy?pk(NEON):pk(["#e8e2cf","#d04a37","#2f7fb0","#e2b33a","#3f8f5a"]),1+rn()*.8);
      else if(k==="duct"){const p=P(a0+.6,b,h+.35),q=P(a1-.6,b,h+.35);line(p,q,INK,1.15);line(p,q,cy?"#6d727c":"#aeb3b8",.75)}
      else if(k==="perg"&&wa>4){const w=Math.min(wa*.3,2.4),d=Math.min(wb*.3,1.8);for(const [da,db] of[[-w,-d],[w,-d],[w,d],[-w,d]])line(P(a+da,b+db,h),P(a+da,b+db,h+1.3),"#5a4028",.35);poly(c,[P(a-w,b-d,h+1.3),P(a+w,b-d,h+1.3),P(a+w,b+d,h+1.3),P(a-w,b+d,h+1.3)],cy?"rgba(61,242,230,.35)":pk(["#efe6cb","#c96a4a","#8fb0a0"]),INK)}}};
  const spire=(a,b,h,hh)=>{const p=P(a,b,h);line(p,[p[0],p[1]-hh],INK,.55);c.fillStyle=cy?nz:"#d8342a";c.beginPath();c.arc(p[0],p[1]-hh,.45,0,7);c.fill()};
  const sign=(a,b,h0,h1)=>{const p=P(a,b,h1),q=P(a,b,h0),w=.9;c.fillStyle=nz;c.globalAlpha=.25;c.fillRect(p[0]-w,p[1]-.5,w*2,q[1]-p[1]+1);c.globalAlpha=1;c.fillRect(p[0]-w/2,p[1],w,q[1]-p[1]);c.strokeStyle=INK;c.lineWidth=.3;c.strokeRect(p[0]-w/2,p[1],w,q[1]-p[1]);c.fillStyle="rgba(8,10,18,.6)";for(let t=.12;t<.9;t+=.2)c.fillRect(p[0]-w*.3,p[1]+(q[1]-p[1])*t,w*.6,(q[1]-p[1])*.1);c.lineWidth=.7},
    fe=sa>=0?1:-1,fs=ca>=0?1:-1,K=o.kind,mv=o.mv||0,ROOFK=cy?["ac","ac","duct","ant","tank","dish","bill","duct"]:["tank","ac","ac","head","solar","garden","ant","dish"];
  if(K==="barraco"){// puxadinhos empilhados, cada um de uma cor
    const n=2+(mv%3),cols=cy?["m_cy1","m_cy2","m_cy4","rust","m_cy3"]:["m_tijolo","m_tijolo","m_conc","m_azulc","m_rosa","m_verdec","m_amarelo","rust"],parts=[];
    for(let i=0;i<n;i++){const w=o.L*(.42+rn()*.25),d=o.D*(.5+rn()*.4),a=-hl+w/2+(o.L-w)*(n>1?i/(n-1):.5),b=(rn()-.5)*(o.D-d),f=1+(rn()<.55?1:0)+(cy&&rn()<.5?1:0);parts.push([a,b,w,d,f])}
    parts.sort((p,q)=>(sa*p[0]+ca*p[1])-(sa*q[0]+ca*q[1]));for(const [a,b,w,d,f] of parts){const wl=WALL[pk(cols)]||W;box(a-w/2,a+w/2,b-d/2,b+d/2,0,f*FH*.9,wl,"win",{top:snow?null:rn()<.5?(cy?"#5b4a3c":"#9a6a4a"):null});stuff(a-w/2,a+w/2,b-d/2,b+d/2,f*FH*.9,1,cy?["ant","tank","duct","dish"]:["tank","tank","dish","ac"])}
    if(cy)sign(fe*hl*.6,fs*hd,FH*.4,FH*1.6);return}
  if(K==="galpao"){const h=Math.max(3,Math.min(5,o.D*.32)),v=mv%3;
    if(v===0){// telhado em dentes de serra
      box(-hl,hl,-hd,hd,0,h,W,"blank",{notop:1});const n=Math.max(2,Math.round(o.L/5)),w=o.L/n;for(let i=sa>=0?0:n-1;sa>=0?i<n:i>=0;i+=sa>=0?1:-1){const a0=-hl+i*w,a1=a0+w;poly(c,[P(a0,-hd,h),P(a1,-hd,h),P(a1,hd,h),P(a0,hd,h)],"#555",null);poly(c,[P(a0,-hd,h),P(a0,hd,h),P(a0,hd,h+1.5),P(a0,-hd,h+1.5)],cy?"#2d4656":"#9fc4d6",INK);poly(c,[P(a0,-hd,h+1.5),P(a0,hd,h+1.5),P(a1,hd,h),P(a1,-hd,h)],snow?"#eef1f3":cy?"#4b4f58":i%2?"#8f969c":"#a2a9ae",INK);const p=P(a0,fs*hd,h),q=P(a1,fs*hd,h),r=P(a0,fs*hd,h+1.5);poly(c,[p,q,r],mixc(W[1],W[0],.5),INK)}}
    else if(v===1){// cobertura em arco
      box(-hl,hl,-hd,hd,0,h*.8,W,"blank",{notop:1});const N=8,arc=t=>[(-hd+o.D*t),h*.8+Math.sin(t*3.1416)*o.D*.2],e=fe*hl;for(let i=0;i<N;i++){const [b0,z0]=arc(ca>=0?i/N:1-i/N),[b1,z1]=arc(ca>=0?(i+1)/N:1-(i+1)/N);poly(c,[P(-hl,b0,z0),P(hl,b0,z0),P(hl,b1,z1),P(-hl,b1,z1)],snow?"#eef1f3":mixc(cy?"#3d4048":"#7f8a92",cy?"#6a6f7a":"#c3cbd1",ca>=0?i/N:1-i/N),null)}
      const pts=[];for(let i=0;i<=N;i++){const [b,z]=arc(i/N);pts.push(P(e,b,z))}poly(c,pts,mixc(W[1],W[0],.6),INK);c.strokeStyle=INK;c.lineWidth=.45;c.beginPath();for(let i=0;i<=4;i++){const a=-hl+o.L*i/4,m=P(a,0,h*.8+o.D*.2),m2=P(a,ca>=0?hd:-hd,h*.8);c.moveTo(m[0],m[1]);c.lineTo(m2[0],m2[1])}c.stroke();c.lineWidth=.7}
    else{box(-hl,hl,-hd,hd,0,h,W,"blank");stuff(-hl,hl,-hd,hd,h,3+(mv%3),["ac","duct","solar","duct","tank"])}
    if(mv%4===1||cy){const a=-fe*hl*.6,b=-fs*hd*.4;cyl(a,b,.7,0,h+5+(mv%5),cy?["#5a5e68","#2c2f36"]:["#b9694a","#7d422e"]);if(typeof puff==="function"&&mv%2){const p=P(a,b,h+6+(mv%5));c.globalAlpha=.5;c.fillStyle=cy?"#7d8a70":"#d9d6cf";for(let i=0;i<3;i++){c.beginPath();c.arc(p[0]+1+i*1.6,p[1]-1-i*1.3,1+i*.5,0,7);c.fill()}c.globalAlpha=1}}
    if(cy)sign(fe*hl*.5,fs*hd,h*.3,h*.95);return}
  if(K==="mansao"){// casa moderna: volumes deslocados, vidro, deck e piscina
    const pw=o.L*.34,a0=-hl,a1=hl-pw,m=fe>0,A0=m?a0:-a1,A1=m?a1:-a0,pa0=m?a1+.6:-hl+.4,pa1=m?hl-.4:-a1-.6;
    poly(c,[P(pa0-.3,-hd*.8,.05),P(pa1+.3,-hd*.8,.05),P(pa1+.3,hd*.8,.05),P(pa0-.3,hd*.8,.05)],cy?"#3a3d46":"#d9c7a1","rgba(60,45,25,.5)");poly(c,[P(pa0+.5,-hd*.5,.1),P(pa1-.5,-hd*.5,.1),P(pa1-.5,hd*.5,.1),P(pa0+.5,hd*.5,.1)],snow?"#cfe3ea":cy?"#3df2e6":"#5ec3dd","#eef2f3");
    box(A0,A1,-hd,hd*.55,0,FH,W,"band");const u0=A0+(A1-A0)*(mv%2?.0:.3),u1=A0+(A1-A0)*(mv%2?.7:1);box(u0,u1,-hd*.75,hd,FH,FH*2,mv%3?W:WALL.m_creme,"band");stuff(u0,u1,-hd*.75,hd,FH*2,2,["solar","garden","ac","perg"]);return}
  if(K==="sobrado"||K==="loja"){const shop=K==="loja"||cy&&mv%2,v=mv%5;
    if(v===0||fl<2){box(-hl,hl,-hd,hd,0,H,W,shop?"shop":"balc");stuff(-hl,hl,-hd,hd,H,cy?3:2,shop?["bill","ac","ac","tank","dish"]:["tank","perg","garden","solar","dish","ac"])}
    else if(v===1){// terraco na frente
      const bm=fs*hd*.15;box(-hl,hl,Math.min(-fs*hd,bm),Math.max(-fs*hd,bm),0,H,W,"win");box(-hl,hl,Math.min(bm,fs*hd),Math.max(bm,fs*hd),0,H-FH,W,shop?"shop":"win");stuff(-hl,hl,Math.min(bm,fs*hd),Math.max(bm,fs*hd),H-FH,2,["perg","garden","garden","ac"]);stuff(-hl,hl,Math.min(-fs*hd,bm),Math.max(-fs*hd,bm),H,1,ROOFK)}
    else if(v===2){// dois volumes de alturas diferentes
      const am=(rn()-.5)*o.L*.3,lo=fe>0?[-hl,am]:[am,hl],hi=fe>0?[am,hl]:[-hl,am],A=fe>0?[lo,hi]:[hi,lo];const W2=WALL[pk(CUL[cy?"cyber":"moderno"].wall)];
      box(A[0][0],A[0][1],-hd,hd,0,A[0]===lo?H-FH*.8:H,A[0]===lo?W2:W,shop&&A[0]===lo?"shop":"win");stuff(A[0][0],A[0][1],-hd,hd,A[0]===lo?H-FH*.8:H,1,ROOFK);box(A[1][0],A[1][1],-hd,hd,0,A[1]===lo?H-FH*.8:H,A[1]===lo?W2:W,shop&&A[1]===lo?"shop":"win");stuff(A[1][0],A[1][1],-hd,hd,A[1]===lo?H-FH*.8:H,1,ROOFK)}
    else if(v===3){box(-hl,hl,-hd,hd,0,H,W,shop?"shop":"win");box(-hl*.5,hl*.5,-hd*.6,hd*.6,H,H+FH*.8,W,"band");stuff(-hl*.5,hl*.5,-hd*.6,hd*.6,H+FH*.8,1,["tank","ant","dish"])}
    else{box(-hl,hl,-hd,hd,0,H,W,shop?"shop":"balc",{top:snow?null:cy?null:"#b8674a"});stuff(-hl,hl,-hd,hd,H,2,["tank","dish","ac"])}
    if(shop&&mv%3===0||cy&&mv%2===0)(cy?sign:(a,b,h0,h1)=>panel(a,b,h1,2.2,1,AW,0))(fe*hl*.55,fs*hd,FH*.35,H+ (cy?1.2:.2));return}
  if(K==="predio"){const v=mv%6,ST=pk(["win","win","balc","balc","band"]);
    if(v===0){box(-hl,hl,-hd,hd,0,H,W,rn()<.4?"shop":ST);stuff(-hl,hl,-hd,hd,H,3,ROOFK)}
    else if(v===1){box(-hl,hl,-hd,hd,0,H,W,"balc");box(-hl*.3,hl*.3,-hd*.5,hd*.5,H,H+1.5,W,null);stuff(-hl,hl,-hd,hd,H,3,["tank","tank","ac","solar","dish"])}
    else if(v===2&&o.L>9&&o.D>8){// em L
      const bm=-fs*hd*.1,wa=o.L*.42,B0=Math.min(-fs*hd,bm),B1=Math.max(-fs*hd,bm),F0=Math.min(bm,fs*hd),F1=Math.max(bm,fs*hd),e0=mv%2?-hl:hl-wa;box(-hl,hl,B0,B1,0,H,W,ST);stuff(-hl,hl,B0,B1,H,2,ROOFK);box(e0,e0+wa,F0,F1,0,H-FH,W,ST);stuff(e0,e0+wa,F0,F1,H-FH,1,["garden","perg","tank"])}
    else if(v===3){// base de lojas com torre recuada
      const ph=FH*(fl>5?2:1);box(-hl,hl,-hd,hd,0,ph,WALL[cy?"m_cy4":"m_conc"],"shop");stuff(-hl,hl,-hd,hd,ph,2,["garden","ac","perg"]);box(-hl*.72,hl*.72,-hd*.72,hd*.72,ph,H,W,ST);stuff(-hl*.72,hl*.72,-hd*.72,hd*.72,H,2,ROOFK)}
    else if(v===4&&o.L>12){// dois blocos ligados
      const g=o.L*.12,h2=H-FH*(1+mv%3),T=fe>0?[[-hl,-g,H],[g,hl,h2]]:[[g,hl,h2],[-hl,-g,H]];for(const [a0,a1,h] of T){box(a0,a1,-hd,hd,0,h,W,ST);stuff(a0,a1,-hd,hd,h,2,ROOFK)}box(-g,g,-hd*.4,hd*.4,H*.35,H*.35+FH,WALL.m_grafite,"glass")}
    else{// escalonado com terracos verdes
      const n=Math.min(3,Math.max(2,(fl/2)|0));for(let i=0;i<n;i++){const k=i/n,h0=i?H*k:0,h1=H*(i+1)/n,b0=-hd+(fs>0?0:o.D*k*.55),b1=hd-(fs>0?o.D*k*.55:0);box(-hl,hl,b0,b1,h0,h1,W,ST);if(i<n-1){const t0=fs>0?hd-o.D*(i+1)/n*.55:-hd,t1=fs>0?hd:-hd+o.D*(i+1)/n*.55;void t0;void t1}else stuff(-hl,hl,b0,b1,h1,2,ROOFK)}}
    if(cy){sign(fe*hl*.6,fs*hd,H*.25,H*.85);if(mv%2)panel(-fe*hl*.2,fs*hd,H*.5,3.2,1.8,pk(NEON),0)}return}
  // torres
  {const v=mv%7,pod=FH*(1+mv%2),PW=WALL[cy?"m_cy4":pk(["m_conc","m_grafite","m_branco"])],gls=W===WALL.m_conc||W===WALL.m_grafite?"band":"glass",mn=Math.min(hl,hd);
    if(v===0){box(-hl,hl,-hd,hd,0,pod,PW,"shop");stuff(-hl,hl,-hd,hd,pod,2,["garden","ac","perg"]);box(-hl*.78,hl*.78,-hd*.78,hd*.78,pod,H,W,gls);box(-hl*.45,hl*.45,-hd*.45,hd*.45,H,H+1.6,PW,null);spire(0,0,H+1.6,5+mv%4)}
    else if(v===1){// escalonada (art deco) com agulha
      const WM=cy?W:WALL[pk(["m_areia","m_creme","m_conc","m_tijolo"])];let h0=0;for(let i=0;i<4;i++){const k=1-i*.2,h1=H*[.45,.72,.9,1][i];box(-hl*k,hl*k,-hd*k,hd*k,h0,h1,WM,i<3?"win":"band");h0=h1}spire(0,0,H,6+mv%5)}
    else if(v===2){// cilindrica de vidro
      box(-hl,hl,-hd,hd,0,pod,PW,"shop");stuff(-hl,-hl+mn*.5,-hd,hd,pod,1,["garden"]);cyl(0,0,mn*.8,pod,H,cy?["#3f5b78","#141c28"]:[W[0],W[1]],1);const p=P(0,0,H);c.fillStyle=cy?"#1d222b":"#8a9096";c.beginPath();c.ellipse(p[0],p[1],mn*.45,mn*.45*TILT,0,0,7);c.fill();c.stroke();spire(0,0,H,4)}
    else if(v===3&&o.L>13){// duas torres sobre a mesma base, com passarela
      box(-hl,hl,-hd,hd,0,pod,PW,"shop");const g=o.L*.1,h2=H*(.68+rn()*.2),T=fe>0?[[-hl*.92,-g,H],[g,hl*.92,h2]]:[[g,hl*.92,h2],[-hl*.92,-g,H]];box(T[0][0],T[0][1],-hd*.8,hd*.8,pod,T[0][2],W,gls);stuff(T[0][0],T[0][1],-hd*.8,hd*.8,T[0][2],2,ROOFK);box(-g,g,-hd*.3,hd*.3,h2*.6,h2*.6+FH,WALL.m_grafite,"glass");box(T[1][0],T[1][1],-hd*.8,hd*.8,pod,T[1][2],W,gls);stuff(T[1][0],T[1][1],-hd*.8,hd*.8,T[1][2],2,ROOFK)}
    else if(v===4){// topo inclinado
      box(-hl*.9,hl*.9,-hd*.9,hd*.9,0,H,W,"glass",{notop:1});const e=mv%2?1:-1,hh=Math.min(6,H*.25);const q=[P(-hl*.9,-hd*.9,H+(e<0?hh:0)),P(hl*.9,-hd*.9,H+(e>0?hh:0)),P(hl*.9,hd*.9,H+(e>0?hh:0)),P(-hl*.9,hd*.9,H+(e<0?hh:0))];if(fe===e){const a=e*hl*.9;poly(c,[P(a,-hd*.9,H),P(a,hd*.9,H),P(a,hd*.9,H+hh),P(a,-hd*.9,H+hh)],mixc(G[1],G[0],.4),INK)}poly(c,[P(-hl*.9,fs*hd*.9,H),P(hl*.9,fs*hd*.9,H),P(e*hl*.9,fs*hd*.9,H+hh)],mixc(G[1],G[0],.6),INK);poly(c,q,snow?"#eef1f3":mixc(G[0],"#ffffff",.35),INK)}
    else if(v===5){box(-hl*.9,hl*.9,-hd*.9,hd*.9,0,H,W,"band");stuff(-hl*.9,hl*.9,-hd*.9,hd*.9,H,1,["heli"]);stuff(-hl*.9,hl*.9,-hd*.9,hd*.9,H,2,["ac","ant"])}
    else{// afunilada em quatro andares de volume
      let h0=0;for(let i=0;i<4;i++){const k=.95-i*.14,h1=H*(i+1)/4;box(-hl*k,hl*k,-hd*k,hd*k,h0,h1,W,i%2?"band":"glass");h0=h1}stuff(-hl*.5,hl*.5,-hd*.5,hd*.5,H,2,["ant","dish","ac"])}
    if(v===3&&o.L<=13||v>6){}
    if(cy){sign(fe*hl*.7,fs*hd*.8,H*.3,H*.8);if(mv%2)panel(-fe*hl*.1,fs*hd*.8,H*.45,3.6,2.2,pk(NEON),0);if(mv%3===0){const p=P(0,0,H+3);c.strokeStyle=nz;c.globalAlpha=.6;c.lineWidth=.5;c.beginPath();c.ellipse(p[0],p[1],mn*.9,mn*.3,0,0,7);c.stroke();c.globalAlpha=1;c.lineWidth=.7}}}}
// templos (k 2) e castelos (k 3) de cada cultura
function drawBig(c,q){if(q.k===3&&window.AtlasAssets&&AtlasAssets.fortress){AtlasAssets.fortress(c,q.x,q.y,(q.ang!=null?q.ang:-.4)+.34,.78*(q.sz||1)*(q.ms||1),q.race||"humano",q.v||0,q.cold,q.cv,q.cst);return}if(q.k===2&&q.ang!=null&&window.AtlasAssets&&AtlasAssets.templo&&AtlasAssets.templo(c,q.x,q.y,q.ang+.34,(q.big?1.3:1)*(q.sz||1)*(q.ms||1),q.race||"humano",q.v||0,q.cold?"snow":null,q.big,q.tv))return;
    if(q.k===2){c.save();if((q.v||0)<.5){c.translate(q.x,0);c.scale(-1,1);c.translate(-q.x,0)}const m=(q.big?1.3:1)*(q.sz||1)*(q.ms||1),rc=q.race||"humano",sw=q.cold?"snow":null;
      if(rc==="vapor"){// catedral da engrenagem: salao de tijolo fuliginoso, cupula de cobre, relogio, chamines e tubos
        for(const [dx,h] of[[-7,30],[-2,25]]){const x0=q.x+dx*m,y0=q.y-8*m,w=1.8*m;c.fillStyle="#9b5a3e";c.strokeStyle=INK;c.lineWidth=.7;c.fillRect(x0-w,y0-h*m,w*2,h*m);c.strokeRect(x0-w,y0-h*m,w*2,h*m);c.fillStyle="#2a2420";c.fillRect(x0-w,y0-h*m-1,w*2,1.4);
          for(let i=0;i<3;i++){c.fillStyle=i%2?"#8f8a86":"#b3aea8";c.strokeStyle="#4a3d3f";c.lineWidth=.5;c.beginPath();c.arc(x0+i*2*m,y0-h*m-3*m-i*3*m,(1.4+i*.8)*m,0,7);c.fill();c.stroke()}}
        drawHouse(c,q.x,q.y,{L:22*m,D:11*m,H:8*m,R:6*m,roof:sw||"rust",wall:"soot",win:1,door:2});drawTower(c,q.x+13*m,q.y-5*m,3.4*m,26*m,9*m,ROOF.copper,WALL.soot);
        {const cx=q.x+13*m,cy=q.y-5*m-17*m;c.fillStyle="#efe6cb";c.strokeStyle=INK;c.lineWidth=.7;c.beginPath();c.arc(cx-1.6*m,cy,2.2*m,0,7);c.fill();c.stroke();c.strokeStyle="#3a2c1b";c.lineWidth=.6;c.beginPath();c.moveTo(cx-1.6*m,cy);c.lineTo(cx-1.6*m,cy-1.6*m);c.moveTo(cx-1.6*m,cy);c.lineTo(cx-.4*m,cy+.6*m);c.stroke()}
        {const gx=q.x-2*m,gy=q.y-15*m,R0=4.2*m;c.fillStyle="#c9a24a";c.strokeStyle=INK;c.lineWidth=.7;c.beginPath();for(let k=0;k<20;k++){const an=k*3.1416/10,rr=k%2?R0:R0+1.2*m;c.lineTo(gx+Math.cos(an)*rr,gy+Math.sin(an)*rr)}c.closePath();c.fill();c.stroke();c.fillStyle="#7a4a24";c.beginPath();c.arc(gx,gy,1.4*m,0,7);c.fill()}}
      else if(rc==="deserto"){drawFlat(c,q.x,q.y,{L:18*m,D:12*m,H:7*m,ang:0,wall:"white",dome:1,domeCol:["#6f9ec8","#3d6890"],win:1});drawTower(c,q.x+13*m,q.y-4*m,2.6*m,22*m,4*m,ROOF.gold,WALL.white)}
      else if(rc==="elfo"){drawHouse(c,q.x,q.y,{L:15*m,D:8*m,H:7*m,R:9*m,roof:"teal",wall:"white",win:1,door:2});drawTower(c,q.x+11*m,q.y-5*m,3*m,24*m,14*m,ROOF.teal,WALL.white)}
      else if(rc==="anao"){drawHouse(c,q.x,q.y,{L:22*m,D:11*m,H:6*m,R:5*m,roof:sw||"slate",wall:"darkstone",win:1,door:2});drawTower(c,q.x-12*m,q.y-6*m,4.6*m,12*m,0,ROOF.slate,WALL.darkstone,true);drawTower(c,q.x+14*m,q.y-6*m,4.6*m,12*m,0,ROOF.slate,WALL.darkstone,true)}
      else if(rc==="norte"){drawHouseA(c,q.x+4*m,q.y-3*m,{L:24*m,D:9*m,H:5*m,R:11*m,ang:0,roof:sw||"shingle",wall:"wooddark",door:2});drawTower(c,q.x-10*m,q.y-2*m,3*m,9*m,8*m,ROOF[sw||"shingle"],WALL.wooddark)}
      else if(rc==="halfling")drawMound(c,q.x,q.y-3,{L:20*m,D:16*m,H:11*m,door:2,chim:1});
      else if(rc==="orc"||rc==="tribal")drawRound(c,q.x,q.y-3,9*m,6*m,12*m,{wall:rc==="orc"?"wooddark":"mud",roof:rc==="orc"?"hide":"thatch",spike:rc==="orc"});
      else if(rc==="pantano")drawBuilding(c,q.x,q.y-3,{form:"stilt",L:20*m,D:10*m,H:5.5*m,R:6*m,ang:0,roof:"thatch",wall:"wood",door:2,win:1});
      else if(rc==="japones"){// patio de cascalho, pagode atras, salao no fundo, lanternas e torii na frente do caminho
        c.fillStyle="#e3dcc6";c.strokeStyle="rgba(60,50,35,.45)";c.lineWidth=.6;c.beginPath();c.ellipse(q.x,q.y+3*m,24*m,11*m,0,0,7);c.fill();c.stroke();c.fillStyle="#cfc5a8";c.fillRect(q.x-4*m,q.y+2*m,4*m,13*m);
        drawPagoda(c,q.x+13*m,q.y-8*m,q.big?5:3,8*m,"jp","red");drawAsian(c,q.x-5*m,q.y-4*m,{L:17*m,D:9*m,H:5*m,R:6*m,ang:0,roof:"jp",wall:"jpw",base:1.5});
        for(const dx of[-9,5]){const lx=q.x+dx*m,ly=q.y+9*m;c.fillStyle="#a8a294";c.strokeStyle=INK;c.lineWidth=.6;c.fillRect(lx-.8*m,ly-3.2*m,1.6*m,3.2*m);c.strokeRect(lx-.8*m,ly-3.2*m,1.6*m,3.2*m);c.fillStyle="#8f897a";c.beginPath();c.moveTo(lx-2*m,ly-3.2*m);c.lineTo(lx,ly-4.6*m);c.lineTo(lx+2*m,ly-3.2*m);c.closePath();c.fill();c.stroke()}
        drawTorii(c,q.x-2*m,q.y+16*m)}
      else if(rc==="chines"){drawAsian(c,q.x-3*m,q.y-2,{L:18*m,D:10*m,H:5.5*m,R:6*m,ang:0,roof:"cny",wall:"red",base:2});drawPagoda(c,q.x+13*m,q.y-6*m,q.big?7:5,8*m,"cn","red")}
      else if(rc==="indiano")drawShikhara(c,q.x+4*m,q.y-2,8*m);
      else if(rc==="meso")drawPyramid(c,q.x,q.y+2,15*m,q.big?6:4);
      else if(rc==="eslavo"){drawHouse(c,q.x,q.y,{L:15*m,D:9*m,H:7*m,R:5*m,roof:sw||"leaf",wall:"white",win:1,door:2});const tw=[[q.x-9*m,q.y-6*m,2.4*m,10*m,["#6f9ec8","#3d6890"]],[q.x+9*m,q.y-6*m,2.4*m,10*m,["#6f9ec8","#3d6890"]],[q.x+1*m,q.y-8*m,3.2*m,15*m,["#e0b84e","#a8842c"]]].sort((a,b)=>a[1]-b[1]);
        for(const [x,y,w,h,col] of tw){drawTower(c,x,y,w,h,0,ROOF.slate,WALL.white,false);onion(c,x,y-.43*w-h,w*.95,col)}}
      else if(rc==="bizantino"){drawFlat(c,q.x,q.y,{L:19*m,D:14*m,H:7*m,ang:0,wall:"brick",dome:1,domeCol:["#5f9a86","#3d6b5b"],win:1});for(const dx of[-12,12])drawTower(c,q.x+dx*m,q.y-3*m,2.2*m,13*m,0,ROOF.terra,WALL.ochre,true)}
      else if(rc==="egipcio"){drawFlat(c,q.x+3*m,q.y-6*m,{L:16*m,D:12*m,H:5*m,ang:0,wall:"sand",win:0});for(const dx of[-7,7])drawFlat(c,q.x+dx*m,q.y+2*m,{L:7*m,D:4.5*m,H:11*m,ang:0,wall:"sand2",win:0});c.fillStyle="#3a2c1b";c.fillRect(q.x-1.4*m,q.y-2*m,2.8*m,4.4*m);
        for(const dx of[-12,12]){const x=q.x+dx*m,y=q.y+6*m;poly(c,[[x-1.1*m,y],[x+1.1*m,y],[x+.6*m,y-13*m],[x,y-14.6*m],[x-.6*m,y-13*m]],"#e6c892",INK);c.fillStyle="#b8955c";c.beginPath();c.moveTo(x+.1*m,y);c.lineTo(x+1.1*m,y);c.lineTo(x+.6*m,y-13*m);c.lineTo(x,y-14.6*m);c.closePath();c.fill()}}
      else if(rc==="celta"){const st_=[];for(let k=0;k<12;k++){const a=k/12*6.2832;st_.push([q.x+Math.cos(a)*15*m,q.y+Math.sin(a)*15*m*TILT])}st_.sort((a,b)=>a[1]-b[1]);
        c.fillStyle="#a7b36a";c.beginPath();c.ellipse(q.x,q.y,18*m,18*m*TILT,0,0,7);c.fill();const back=st_.filter(p=>p[1]<q.y),front=st_.filter(p=>p[1]>=q.y),stone=(x,y)=>{poly(c,[[x-1.4*m,y],[x+1.4*m,y],[x+1.2*m,y-6.5*m],[x-1.2*m,y-6.5*m]],"#b4ada0",INK);c.fillStyle="#8a847a";c.fillRect(x+.2*m,y-6.5*m,1*m,6.5*m)};
        for(const p of back)stone(p[0],p[1]);drawRound(c,q.x,q.y-1,6*m,4*m,6*m,{wall:"daub",roof:"thatch"});for(const p of front)stone(p[0],p[1])}
      else if(rc==="andino"){drawPyramid(c,q.x,q.y+2,14*m,3);drawHouse(c,q.x,q.y-12*m,{L:8*m,D:6*m,H:4*m,R:3*m,roof:"thatch",wall:"darkstone",win:0,door:2})}
      else if(rc==="gnomo"){drawHouse(c,q.x-3*m,q.y,{L:14*m,D:9*m,H:6*m,R:7*m,roof:"blue",wall:"pink",win:1,door:2});drawTower(c,q.x+10*m,q.y-5*m,3*m,24*m,11*m,ROOF.gold,WALL.white);c.fillStyle="#f6e7b0";c.strokeStyle=INK;c.lineWidth=.6;c.beginPath();c.arc(q.x+8.6*m,q.y-23*m,1.5*m,0,7);c.fill();c.stroke()}
      else if(rc==="mongol"){drawRound(c,q.x,q.y-2,9*m,4.2*m,4*m,{wall:"felt",roof:"felt",yurt:1});drawTotem(c,q.x+11*m,q.y+1)}
      else if(window.AtlasAssets&&AtlasAssets.church){const vv=((q.v||0)*2)%1,rf=sw||(vv<.4?"tile":vv<.7?"slate":"dark");c.restore();c.save();AtlasAssets.church(c,q.x,q.y,(q.ang||0)+.34+((q.v||0)<.5?0:Math.PI),m*.85,{race:rc,roof:rf,wall:vv>.55?"stone":"daub"},vv,sw)}
      else{const vv=((q.v||0)*2)%1,rf=sw||(vv<.4?"tile":vv<.7?"slate":"dark"),wl=vv>.55?"stone":"daub";
        if(vv<.33){drawHouse(c,q.x,q.y,{L:17*m,D:8*m,H:6.5*m,R:5.5*m,roof:rf,wall:wl,win:1,door:2});drawTower(c,q.x+13*m,q.y-5*m,4.4*m,15*m,9*m,ROOF[rf],WALL[wl])}
        else if(vv<.66){drawTower(c,q.x-14*m,q.y-6*m,4.8*m,17*m,11*m,ROOF[rf],WALL[wl]);drawHouse(c,q.x,q.y,{L:19*m,D:9*m,H:6*m,R:6*m,roof:rf,wall:wl,win:1,door:2});drawHouse(c,q.x+9*m,q.y+2*m,{L:6*m,D:7*m,H:4.5*m,R:3.4*m,roof:rf,wall:wl})}
        else{drawHouse(c,q.x,q.y,{L:21*m,D:10*m,H:7*m,R:6.5*m,roof:rf,wall:wl,win:1,door:2});drawTower(c,q.x+15*m,q.y-6*m,3.6*m,13*m,0,ROOF[rf],WALL[wl],true);drawTower(c,q.x-15*m,q.y-6*m,3.6*m,13*m,0,ROOF[rf],WALL[wl],true)}}
      c.restore()}
    else if(q.k===3&&q.race==="japones")drawJpCastle(c,q.x,q.y-6);
    else if(q.k===3&&q.race==="chines"){drawAsian(c,q.x,q.y-8,{L:34,D:20,H:7,R:9,ang:0,roof:"cny",wall:"red",base:3});drawPagoda(c,q.x+22,q.y-4,3,9,"cn","red")}
    else if(q.k===3&&q.race==="mongol"){for(const [dx,dy,r] of [[-14,-6,6],[14,-6,6],[0,-12,7],[0,0,11]])drawRound(c,q.x+dx,q.y+dy,r,r*.55,r*.5,{wall:"felt",roof:"felt",yurt:1});drawTotem(c,q.x-20,q.y+4);drawTotem(c,q.x+20,q.y+4)}
    else if(q.k===3&&(q.race==="orc"||q.race==="tribal"||q.race==="pantano")){const cc=[[q.x-26,q.y-12],[q.x,q.y-25],[q.x+26,q.y-12],[q.x,q.y+1]];drawPalisade(c,cc[0],cc[1],7);drawPalisade(c,cc[1],cc[2],7);drawRound(c,q.x,q.y-10,10,6,10,{wall:q.race==="orc"?"wooddark":"mud",roof:q.race==="orc"?"hide":"thatch",spike:q.race==="orc"});drawWatch(c,q.x-20,q.y-6);drawWatch(c,q.x+20,q.y-6);drawPalisade(c,cc[0],cc[3],7);drawPalisade(c,cc[3],cc[2],7);drawTotem(c,q.x,q.y+4)}
    else if(q.k===3&&q.race==="meso")drawPyramid(c,q.x,q.y-2,24,7);
    else if(q.k===3&&q.race==="indiano"){drawFlat(c,q.x,q.y-6,{L:34,D:22,H:9,ang:0,wall:"pink",dome:1,domeCol:["#f4f0e4","#bdb4a0"],win:1});drawTower(c,q.x-18,q.y-1,3,20,5,ROOF.gold,WALL.white);drawTower(c,q.x+18,q.y-1,3,20,5,ROOF.gold,WALL.white)}
    else if(q.k===3&&window.AtlasAssets&&AtlasAssets.fortress){AtlasAssets.fortress(c,q.x,q.y,(q.ang!=null?q.ang:-.4)+.34,.78*(q.sz||1)*(q.ms||1),q.race||"humano",q.v||0,q.cold,q.cv,q.cst);return}
  if(q.k===3){c.save();c.translate(q.x,q.y);const fl=(q.v||0)<.5?-1:1;c.scale(.8*(q.sz||1)*fl,.8*(q.sz||1));c.translate(-q.x,-q.y);const Cc=CUL[q.race||"humano"],st=WALL[Cc.st==='daub'||Cc.st==='mud'||Cc.st==='wood'||Cc.st==='wooddark'?'stone':Cc.st],rf=ROOF[q.cold?"snow":Cc.rf==='sandtop'?'gold':Cc.rf==='hide'||Cc.rf==='thatch'?'dark':Cc.rf];drawWall(c,[q.x-30,q.y-14],[q.x,q.y-28],8);drawWall(c,[q.x,q.y-28],[q.x+30,q.y-14],8);
      if(((q.v||0)*3)%1>.4)drawTower(c,q.x,q.y-27,5.5,17,7,rf,st);drawTower(c,q.x-30,q.y-13,5.5,15,6,rf,st);drawTower(c,q.x+30,q.y-13,5.5,15,6,rf,st);
      drawHouse(c,q.x+6,q.y-4,{L:27,D:13,H:11,R:7,roof:Object.keys(ROOF).find(k=>ROOF[k]===rf)||"dark",wall:Object.keys(WALL).find(k=>WALL[k]===st)||"stone",win:1,door:2,chim:1});drawTower(c,q.x-13,q.y-9,6.5,23,0,rf,st,true);
      drawWall(c,[q.x-30,q.y-13],[q.x,q.y+4],8);drawWall(c,[q.x,q.y+4],[q.x+30,q.y-13],8);drawTower(c,q.x,q.y+5,4.6,12,5,rf,st);c.restore()}}
// barracas de acampamento militar, uma linguagem por cultura
const TENT={humano:{sh:"A",c:["#e6dab6","#b5a77e"],tr:"#a8352a"},anao:{sh:"A",c:["#9a948a","#625d54"],tr:"#c9a24a",low:1},elfo:{sh:"cone",c:["#d3e6dc","#8fb3a4"],tr:"#c9a24a",tall:1.35},orc:{sh:"cone",c:["#7a5d40","#4f3b28"],tr:"#e8e0c8",spike:1},
  deserto:{sh:"low",c:["#4a4039","#2a2420"],tr:"#d8b070"},norte:{sh:"A",c:["#cdb88e","#917c57"],tr:"#7a2e22",beam:1},halfling:{sh:"cone",c:["#aac27a","#77904e"],tr:"#f0e2b4",tall:.8},pantano:{sh:"low",c:["#a89a5e","#746a3e"],tr:"#5a6a3a"},
  tribal:{sh:"cone",c:["#dbc9a0","#a38d60"],tr:"#a8352a",beam:1,tall:1.2},japones:{sh:"curtain",c:["#f3eee2","#cbc4b2"],tr:"#1d160d"},chines:{sh:"cone",c:["#b8352a","#7a2018"],tr:"#e0b84a"},indiano:{sh:"cone",c:["#e39a3c","#a8621f"],tr:"#f6ead0",stripe:1},
  meso:{sh:"low",c:["#c9a85e","#8f733a"],tr:"#3f8f6a"},mongol:{sh:"yurt",c:["#f0e8d6","#c7bca4"],tr:"#3a6ea8"}};
function drawTent(c,x,y,race,s,big,flag){const T=TENT[race]||TENT.humano,[c0,c1]=T.c;s*=big?1.9:1;c.lineWidth=.7;c.lineJoin="round";
  c.fillStyle="rgba(30,25,10,.25)";c.beginPath();c.ellipse(x+1.5*s,y+.4*s,5.2*s,1.7*s,0,0,7);c.fill();
  if(T.sh==="yurt"){drawRound(c,x,y,3.6*s,2.7*s,2.3*s,{wall:"felt",roof:"felt",yurt:1})}
  else if(T.sh==="A"){const h=(T.low?4.4:6)*s;poly(c,[[x-4*s,y],[x-.4*s,y-h],[x+1.4*s,y-.4*s]],c0,INK);poly(c,[[x+1.4*s,y-.4*s],[x-.4*s,y-h],[x+3.2*s,y-h*.92],[x+5*s,y-1.6*s]],c1,INK);c.fillStyle="#2c2118";c.beginPath();c.moveTo(x-1.6*s,y-.1*s);c.lineTo(x-.5*s,y-h*.62);c.lineTo(x+.3*s,y-.3*s);c.fill();
    if(T.beam){c.strokeStyle="#4a3524";c.lineWidth=.9;c.beginPath();c.moveTo(x-1.4*s,y-h-1.6*s);c.lineTo(x+.6*s,y-h+1.2*s);c.moveTo(x+.6*s,y-h-1.6*s);c.lineTo(x-1.4*s,y-h+1.2*s);c.stroke()}
    c.strokeStyle=T.tr;c.lineWidth=.9;c.beginPath();c.moveTo(x-3*s,y-h*.25);c.lineTo(x+.9*s,y-h*.3);c.stroke()}
  else if(T.sh==="cone"){const h=6.6*s*(T.tall||1),w=3.8*s;c.fillStyle=c0;c.strokeStyle=INK;c.beginPath();c.moveTo(x-w,y-.4*s);c.lineTo(x,y-h);c.lineTo(x+w,y-.4*s);c.quadraticCurveTo(x,y+1.6*s,x-w,y-.4*s);c.fill();c.stroke();c.fillStyle=c1;c.beginPath();c.moveTo(x+.5*s,y+.5*s);c.lineTo(x,y-h);c.lineTo(x+w,y-.4*s);c.quadraticCurveTo(x+w*.6,y+.4*s,x+.5*s,y+.5*s);c.fill();
    if(T.stripe){c.strokeStyle=T.tr;c.lineWidth=.8;c.beginPath();for(const f of[-.6,-.2,.25,.65]){c.moveTo(x,y-h);c.lineTo(x+w*f,y+.3*s)}c.stroke()}else{c.strokeStyle=T.tr;c.lineWidth=.9;c.beginPath();c.moveTo(x-w*.72,y-h*.24);c.quadraticCurveTo(x,y-h*.1,x+w*.72,y-h*.24);c.stroke()}
    c.fillStyle="#2c2118";c.beginPath();c.moveTo(x-1.1*s,y+.5*s);c.lineTo(x-.3*s,y-h*.42);c.lineTo(x+.5*s,y+.6*s);c.fill();
    if(T.beam||T.spike){c.strokeStyle=T.spike?"#e8e0c8":"#4a3524";c.lineWidth=.8;c.beginPath();for(const d of[-1,0,1]){c.moveTo(x,y-h+.5);c.lineTo(x+d*1.5*s,y-h-2*s)}c.stroke()}}
  else if(T.sh==="low"){const h=3.4*s,w=5.4*s;poly(c,[[x-w,y],[x-w*.55,y-h],[x+w*.55,y-h*1.08],[x+w,y-.8*s],[x+w*.2,y+.5*s]],c0,INK);poly(c,[[x+w*.2,y+.5*s],[x+w*.55,y-h*1.08],[x+w,y-.8*s]],c1,INK);c.strokeStyle=T.tr;c.lineWidth=.9;c.beginPath();c.moveTo(x-w*.75,y-h*.5);c.lineTo(x+w*.36,y-h*.42);c.stroke();c.strokeStyle="#4a3524";c.lineWidth=.7;c.beginPath();c.moveTo(x-w*.55,y-h);c.lineTo(x-w*.55,y-h-1.4*s);c.moveTo(x+w*.55,y-h*1.08);c.lineTo(x+w*.55,y-h-1.6*s);c.stroke()}
  else{const w=5*s,h=3.4*s;poly(c,[[x-w,y-2.2*s],[x-w,y-2.2*s-h],[x,y-h-3.6*s],[x,y-3.6*s]],c1,INK);poly(c,[[x,y-3.6*s],[x,y-h-3.6*s],[x+w,y-2.2*s-h],[x+w,y-2.2*s]],c0,INK);c.fillStyle=T.tr;for(const [dx,dy] of [[-w*.5,-2.9*s-h*.5],[w*.5,-2.9*s-h*.5]]){c.beginPath();c.arc(x+dx,y+dy,.9*s,0,7);c.fill()}
    c.strokeStyle="#4a3524";c.lineWidth=.8;c.beginPath();for(const dx of[-w,0,w]){c.moveTo(x+dx,y-(dx?2.2:3.6)*s);c.lineTo(x+dx,y-(dx?2.2:3.6)*s-h-1.5*s)}c.stroke();poly(c,[[x-1.6*s,y-.6*s],[x+1.6*s,y-1.2*s],[x+1.6*s,y+.2*s],[x-1.6*s,y+.8*s]],"#8a6a44",INK)}
  if(big||flag){const px=x+(T.sh==="curtain"?5.6:4.6)*s/(big?1.9:1)*(big?1.5:1),py=y,ph=(big?17:12);c.strokeStyle="#3a2c1b";c.lineWidth=.9;c.beginPath();c.moveTo(px,py);c.lineTo(px,py-ph);c.stroke();
    if(race==="japones"||race==="chines"){poly(c,[[px,py-ph],[px+2.6,py-ph],[px+2.6,py-ph+8],[px,py-ph+8]],race==="chines"?"#b8352a":"#f3eee2",INK);c.fillStyle=T.tr;c.beginPath();c.arc(px+1.3,py-ph+3,.8,0,7);c.fill()}
    else poly(c,[[px,py-ph],[px+6,py-ph+1.6],[px,py-ph+3.6]],T.tr==="#e8e0c8"||T.tr==="#f0e2b4"||T.tr==="#f6ead0"?"#a8352a":T.tr,INK)}}
function drawFire(c,x,y){c.fillStyle="#3a2c1b";c.beginPath();c.ellipse(x,y,2,.9,0,0,7);c.fill();c.fillStyle="#e07a2a";c.beginPath();c.moveTo(x-1.4,y-.2);c.quadraticCurveTo(x-.6,y-2,x,y-3.8);c.quadraticCurveTo(x+.8,y-2,x+1.4,y-.2);c.fill();c.fillStyle="#f6c04a";c.beginPath();c.moveTo(x-.6,y-.2);c.lineTo(x,y-2.2);c.lineTo(x+.6,y-.2);c.fill()}
// regiao (gerador 61): conferencia final pela grade do mundo. Campo e horta que invadem agua, estrada, rua ou muralha sao cortados;
// casa ou construcao que caiu em rua, agua, muralha, ponte ou em outra construcao procura um lugar livre perto, ou sai. Templo e castelo ficam.
function verificaRegiao(W,gvv){const g63=(gvv==null?63:gvv)>=63,g67=(gvv==null?67:gvv)>=67,g71=(gvv==null?71:gvv)>=71;const AM=window.AtlasMundo,AS=window.AtlasAssets;if(!AM||!AM.deRegiao)return null;const G=AM.deRegiao(W,AS),U=AM.USO;let mov=0,tir=0,cort=0,tirC=0;
  const ruimA=k=>G.agua[k]||G.uso[k]===U.rua||G.uso[k]===U.estrada||G.uso[k]===U.muralha||G.uso[k]===U.portao||G.uso[k]===U.ponte;
  const celsA=pl=>{const L=[];G.poly(pl,(k,x,y)=>{if(ruimA(k))L.push([x,y])});return L};
  const clipH=(P_,mx,my,nx,ny)=>{const o=[],n=P_.length;for(let k=0;k<n;k++){const a=P_[k],b=P_[(k+1)%n],da=(a[0]-mx)*nx+(a[1]-my)*ny,db=(b[0]-mx)*nx+(b[1]-my)*ny;if(da<=0){o.push(a);if(db>0){const t=da/(da-db);o.push([a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t])}}else if(db<=0){const t=da/(da-db);o.push([a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t])}}return o};
  const area=P_=>{let s=0;for(let i=0,j=P_.length-1;i<P_.length;j=i++)s+=(P_[j][0]+P_[i][0])*(P_[j][1]-P_[i][1]);return Math.abs(s/2)},cen=P_=>{let x=0,y=0;for(const v of P_){x+=v[0];y+=v[1]}return [x/P_.length,y/P_.length]};
  for(let fi=(W.fieldsP||[]).length-1;fi>=0;fi--){const f=W.fieldsP[fi];if(!f.poly||f.poly.length<3)continue;let pl=f.poly,ok=true;const a0=area(pl);
    for(let it=0;it<4;it++){const B_=celsA(pl);if(!B_.length)break;const c=cen(pl);let bx=0,by=0;for(const v of B_){bx+=v[0];by+=v[1]}bx/=B_.length;by/=B_.length;let nx=bx-c[0],ny=by-c[1];const l=Math.hypot(nx,ny);if(l<.5){ok=false;break}nx/=l;ny/=l;let hi=-1e9,lo=1e9;for(const v of pl){const d=(v[0]-c[0])*nx+(v[1]-c[1])*ny;hi=Math.max(hi,d);lo=Math.min(lo,d)}let best=null;for(let t=hi;t>lo;t-=2){const q=clipH(pl,c[0]+nx*t,c[1]+ny*t,nx,ny);if(q.length<3)break;const bb=celsA(q);if(!bb.length||bb.length<B_.length*.3){best=q;break}}if(!best){ok=false;break}pl=best}
    if(ok&&celsA(pl).length>2)ok=false;if(!ok||area(pl)<a0*.35){W.fieldsP.splice(fi,1);tirC++}else if(pl!==f.poly){f.poly=pl;cort++}}
  // hortas (retangulos): encolhem ate caber; se nao couber, saem. Arvores soltas na rua ou na agua saem.
  const ret=(g,f)=>{const c=Math.cos(g.a||0),n=Math.sin(g.a||0);return [[-1,-1],[1,-1],[1,1],[-1,1]].map(([i,j])=>[g.x+c*i*g.w*f/2-n*j*g.h*f/2,g.y+n*i*g.w*f/2+c*j*g.h*f/2])};
  for(let i=(W.gardens||[]).length-1;i>=0;i--){const g=W.gardens[i];if(!celsA(ret(g,1)).length)continue;let f=null;for(const z of[.85,.7,.55])if(!celsA(ret(g,z)).length){f=z;break}if(f){g.w*=f;g.h*=f;cort++}else{W.gardens.splice(i,1);tirC++}}
  if(W.extra){const L=W.extra.filter(t=>{if(!Array.isArray(t))return true;const k=G.idx(t[0],t[1]);if(k<0)return true;const u=G.uso0?G.uso0[k]:G.uso[k];return !(u===U.rua||u===U.estrada||G.agua[k])});W.extra.length=0;W.extra.push(...L)}
  const NB2=new Map();if(g63)for(const o of G.objs)if(o.ref&&(o.ref.k===2||o.ref.k===3))NB2.set(o.ref,o.n);
  const NATK=new Set([2,3,13,15,21,25,26,27,28,37]),RR={8:6,16:12,17:12,18:4,19:6,20:9,22:12,23:8,24:4,7:2.4,6:2.6,32:3,33:6,34:2,35:2,36:2};
  const forma=(b,dx,dy)=>{if((b.k===2||b.k===3)&&NB2.has(b)){const pl=G.objs[NB2.get(b)].polys||[];return pl.map(P_=>P_.map(v=>[v[0]+dx+(b._dx||0),v[1]+dy+(b._dy||0)]))}if(b.k===1&&b.L){const c=Math.cos(b.ang||0),s=Math.sin(b.ang||0);const L_=[[[-1,-1],[1,-1],[1,1],[-1,1]].map(([i,j])=>[b.x+dx+c*i*b.L/2-s*j*b.D/2,b.y+dy+s*i*b.L/2+c*j*b.D/2])];if(b.wing&&b.wing.L){const w=b.wing,c2=Math.cos(w.ang!=null?w.ang:(b.ang||0)),s2=Math.sin(w.ang!=null?w.ang:(b.ang||0)),wx=b.x+dx+(w.dx||0),wy=b.y+dy+(w.dy||0);L_.push([[-1,-1],[1,-1],[1,1],[-1,1]].map(([i,j])=>[wx+c2*i*w.L/2-s2*j*w.D/2,wy+s2*i*w.L/2+c2*j*w.D/2]))}return L_}if(b.k===40&&b.id&&AS&&AS.ficha){const F=AS.ficha(b.id,b.race,b.vv,b.ang||0);if(F&&F.pegada.length)return F.pegada.map(P_=>P_.map(v=>[b.x+dx+v[0],b.y+dy+v[1]]))}const r=(b.r||RR[b.k]||5)*.65,P_=[];for(let a=0;a<10;a++)P_.push([b.x+dx+Math.cos(a*.628)*r,b.y+dy+Math.sin(a*.628)*r]);return [P_]};
  const ehDetalhe=b=>b.k===40||b.k===6||b.k===7||b.k===32||b.k===34||b.k===35||b.k===36;
  // dono de cada celula contado de novo pelas formas (a grade guarda so o ultimo pintado; aqui sobreposicao conta)
  const OW=new Int32Array(G.w*G.h).fill(-1),NC=new Uint8Array(G.w*G.h),NB=new Map();for(const o of G.objs){if(!o.ref||o.ref.k==null||NATK.has(o.ref.k)&&o.ref.k!==2&&o.ref.k!==3)continue;NB.set(o.ref,o.n)}
  const regO=(L,n)=>{for(const P_ of L)G.poly(P_,k=>{if(OW[k]!==n){if(OW[k]<0)OW[k]=n;else NC[k]=Math.min(250,NC[k]+1)}})};for(const [b,n] of NB){const pl=G.objs[n].polys;regO(pl&&pl.length?pl:forma(b,0,0),n)}
  const cabe=(L,n,det)=>{let ok=true;for(const P_ of L)G.poly(P_,k=>{if(!ok)return;const u=G.uso0?G.uso0[k]:G.uso[k];if(G.agua[k]&&u!==U.cais&&u!==U.ponte||u===U.muralha||u===U.portao||u===U.ponte||(OW[k]>=0&&(OW[k]!==n||NC[k]>0))||(!det&&(u===U.rua||u===U.estrada)))ok=false});return ok};
  const mexer=new Map();for(const c of G.lista()){if(!/^construção|^adereço/.test(c.tipo))continue;let n=c.tipo==="construção sobre construção"?c.b:c.tipo==="adereço sobre construção"?c.b:c.a;let o=G.objs[n];if(c.tipo==="construção sobre construção"&&o&&o.ref&&NATK.has(o.ref.k)){n=c.a;o=G.objs[n]}if(o&&o.ref&&!NATK.has(o.ref.k))mexer.set(n,o.ref)}
  // 0.67: castelo com a ponta na agua tambem procura lugar (sem sair se nao achar)
  if(g67)for(const c of G.lista())if(c.tipo==="construção na água"){const o=G.objs[c.a];if(o&&o.ref&&o.ref.k===3)mexer.set(c.a,o.ref)}
  // templo em cima de castelo: o templo procura outro lugar
  if(g63)for(const c of G.lista())if(c.tipo==="construção sobre construção"){const A_=G.objs[c.a],B2=G.objs[c.b];if(A_&&B2&&A_.ref&&B2.ref){const t=A_.ref.k===2&&B2.ref.k===3?[c.a,A_.ref]:B2.ref.k===2&&A_.ref.k===3?[c.b,B2.ref]:null;if(t)mexer.set(t[0],t[1])}}
  const fora=new Set();for(const [n,b] of mexer){const det=ehDetalhe(b);let feito=false;for(const d of[2,3,4,6,8,10,13])for(let a=0;a<12&&!feito;a++){const dx=Math.cos(a*.5236)*d,dy=Math.sin(a*.5236)*d,L=forma(b,dx,dy);if(cabe(L,n,det)){for(const P_ of forma(b,0,0))G.poly(P_,k=>{if(OW[k]===n&&!NC[k])OW[k]=-1;else if(NC[k]>0)NC[k]--});b.x+=dx;b.y+=dy;if(b.cy!=null)b.cy+=dy;if(b.k===2||(g67&&b.k===3)){b._dx=(b._dx||0)+dx;b._dy=(b._dy||0)+dy}regO(L,n);feito=true}}if(feito)mov++;else if(!(g67&&b.k===3)){fora.add(b);tir++}}
  if(fora.size){const L=W.B.filter(b=>!fora.has(b));W.B.length=0;W.B.push(...L)}
  if(g63){const dentro=(x,y)=>{for(const [b,n] of NB2){if(fora.has(b))continue;for(const P_ of forma(b,0,0)){let c=false;for(let i=0,j=P_.length-1;i<P_.length;j=i++){const p=P_[i],q=P_[j];if((p[1]>y)!==(q[1]>y)&&x<(q[0]-p[0])*(y-p[1])/(q[1]-p[1])+p[0])c=!c}if(c)return true;for(let i=0,j=P_.length-1;i<P_.length;j=i++){const p=P_[i],q=P_[j],dx=q[0]-p[0],dy=q[1]-p[1],l=dx*dx+dy*dy||1,t=Math.max(0,Math.min(1,((x-p[0])*dx+(y-p[1])*dy)/l));if(Math.hypot(x-p[0]-dx*t,y-p[1]-dy*t)<3.2)return true}}}return false};
    const corta=L0=>{const L=[];for(let i=0;i<L0.length;i++){const a=L0[i];L.push(a);const b=L0[i+1];if(!b)break;const l=Math.hypot(b[0]-a[0],b[1]-a[1]),n=Math.floor(l/2);for(let k=1;k<n;k++)L.push([a[0]+(b[0]-a[0])*k/n,a[1]+(b[1]-a[1])*k/n])}if(!L.some(v=>dentro(v[0],v[1])))return [L0];const out=[];let cur=[];for(const v of L){if(dentro(v[0],v[1])){if(cur.length>1)out.push(cur);cur=[]}else cur.push(v)}if(cur.length>1)out.push(cur);return out};let cortadas=0;
    for(const AR of[W.roads].concat((W.towns||[]).map(t=>t.streets||[]))){if(!AR)continue;for(let i=AR.length-1;i>=0;i--){const L=AR[i];if(!Array.isArray(L)||!L.length||!Array.isArray(L[0]))continue;const P2=corta(L);if(P2.length===1&&P2[0].length===L.length)continue;cortadas++;AR.splice(i,1,...P2)}}
    mov+=0;W._ruasCortadas=cortadas}
  // 0.71: porta da casa para a rua ou estrada mais perto
  let portas=0;if(g71){const via=k=>{const u=G.uso0?G.uso0[k]:G.uso[k];return u===U.rua||u===U.estrada||u===U.praca};
    for(const b of W.B){if(b.k!==1||!b.L)continue;let v=null;for(let r=Math.min(b.L,b.D)/2+1;r<=Math.min(b.L,b.D)/2+18&&!v;r+=2)for(let a=0;a<24;a++){const an=a*.2618,k=G.idx(b.x+Math.cos(an)*r,b.y+Math.sin(an)*r);if(k>=0&&via(k)){v=[Math.cos(an),Math.sin(an)];break}}
      if(!v)continue;const d=v[0]*-Math.sin(b.ang||0)+v[1]*Math.cos(b.ang||0);if(Math.abs(d)>.25){b.fr=d>0?1:-1;portas++}}}
  return {mov,tir,cort,tirC,portas}}
function generate(P){const W=generate0(P);if((P.gv==null?65:P.gv)>=65&&W&&W.B)for(const b of W.B)if(b.k===2)b.tv=2;if((P.gv==null?61:P.gv)>=61&&W&&W.B){try{W.VERIF=verificaRegiao(W,P.gv)}catch(e){console.warn("verificaRegiao",e)}}return W}
function generate0(P){if(!["europa","leste","sul","meso","estepe","misto","eslava","mediter","antigo","celta","andes","fantasia","industrial","piratas"].includes(P.culture))P=Object.assign({},P,{culture:"europa"});
  setScale(P.size||1);
  const seed=hashStr(P.seed),rng=mulberry(seed),fbm=makeNoise(seed^0x9e37),fbm2=makeNoise(seed^0x51f1);
  const pick=a=>a[(rng()*a.length)|0];
  const heap=()=>{const hf=[],hi=[];return {size:()=>hf.length,
    push(f,i){let k=hf.length;hf.push(f);hi.push(i);while(k>0){const p=(k-1)>>1;if(hf[p]<=f)break;hf[k]=hf[p];hi[k]=hi[p];k=p}hf[k]=f;hi[k]=i},
    pop(){const top=hi[0],f=hf.pop(),i=hi.pop(),n=hf.length;if(n){let k=0;for(;;){let c=2*k+1;if(c>=n)break;if(c+1<n&&hf[c+1]<hf[c])c++;if(hf[c]>=f)break;hf[k]=hf[c];hi[k]=hi[c];k=c}hf[k]=f;hi[k]=i}return top}}};
  // forma da terra
  const N=GW*GH,land=new Float32Array(N),elev=new Float32Array(N),forest=new Float32Array(N),vari=new Float32Array(N),slope=new Float32Array(N),dist=new Float32Array(N),rdist=new Float32Array(N).fill(1e9),hadd=new Float32Array(N),fadd=new Float32Array(N),ladd=new Float32Array(N);
  const bEd=[],erList=[];
  for(const e of P.edits||[]){if(e.t==="biome"){bEd.push(e);continue}if(e.t==="erase"){erList.push(e);continue}const tgt=e.t==="land"||e.t==="sea"?ladd:e.t==="up"||e.t==="down"?hadd:fadd,sg=(e.t==="land"||e.t==="up"||e.t==="forest")?1:-1,amt=tgt===ladd?1.5:tgt===hadd?.22:1;
    const i0=Math.max(0,((e.x-e.r)/G)|0),i1=Math.min(GW-1,((e.x+e.r)/G|0)+1),j0=Math.max(0,((e.y-e.r)/G)|0),j1=Math.min(GH-1,((e.y+e.r)/G|0)+1);
    for(let j=j0;j<=j1;j++)for(let i=i0;i<=i1;i++){const d=Math.hypot(i*G-e.x,j*G-e.y);if(d<e.r)tgt[j*GW+i]+=sg*amt*sstep(e.r,e.r*.35,d)}}
  const form=P.form||"regiao",side0=(rng()*4)|0,SS_={oeste:0,leste:1,norte:2,sul:3},side=SS_[P.seaSide]!=null?SS_[P.seaSide]:P.seaSide==="auto"?((mulberry((seed^0x5ea51)>>>0)()*4)|0):side0,blobs=[],bays=[],lakes=[],cx0=WX*(.42+rng()*.16),cy0=WY*(.4+rng()*.14),edge=[[0,cy0],[WX,cy0],[cx0,0],[cx0,WY]][side];
  const D0=Math.min(WX,WY),R1=()=>rng(),fbmW=makeNoise(seed^0x3c6e),fbmC=makeNoise(seed^0x91b2);
  // cadeia de massas ao longo de uma espinha curva (peninsulas, ilhas alongadas, bracos de continente)
  const spine=(x,y,ang,len,r0,r1,n,isl)=>{let a=ang;for(let i=0;i<n;i++){const t=i/Math.max(1,n-1),r=lerp(r0,r1,t)*(.75+R1()*.5);blobs.push([x,y,r*(1+R1()*.6),r*(.6+R1()*.5),R1()*3.14,isl?1:0]);a+=(R1()-.5)*1.1;const st=len/n;x+=Math.cos(a)*st;y+=Math.sin(a)*st}};
  const inward=(x,y)=>Math.atan2(cy0-y,cx0-x);
  if(form==="ilha"){const a=R1()*6.28,n=4+((R1()*4)|0),len=D0*(.45+R1()*.3);spine(cx0-Math.cos(a)*len*.45,cy0-Math.sin(a)*len*.45,a,len,D0*.2,D0*.12,n);
    for(let k=0;k<1+((R1()*3)|0);k++){const b=blobs[(R1()*blobs.length)|0];spine(b[0],b[1],R1()*6.28,D0*(.15+R1()*.2),D0*.09,D0*.04,3)}
    for(let k=0;k<2+((R1()*3)|0);k++){const a2=R1()*6.28,r=D0*(.25+R1()*.12);bays.push([cx0+Math.cos(a2)*r,cy0+Math.sin(a2)*r,D0*(.05+R1()*.07),D0*(.04+R1()*.05),R1()*3.14])}}
  else if(form==="arquipelago"){const n=7+((R1()*6)|0);for(let i=0;i<n;i++){const x=WX*(.12+R1()*.76),y=WY*(.12+R1()*.72),big=i<3;spine(x,y,R1()*6.28,D0*(big?.3:.12),D0*(big?.13:.075),D0*.04,big?4:2+((R1()*2)|0))}}
  else if(form==="peninsula"){const a=inward(edge[0],edge[1])+(R1()-.5)*.5;spine(edge[0]-Math.cos(a)*40,edge[1]-Math.sin(a)*40,a,D0*(.75+R1()*.25),D0*.24,D0*.1,6+((R1()*3)|0));
    for(let k=0;k<2;k++){const b=blobs[2+((R1()*(blobs.length-2))|0)];spine(b[0],b[1],a+(R1()<.5?1.3:-1.3)+(R1()-.5)*.5,D0*(.12+R1()*.15),D0*.08,D0*.04,3)}}
  else if(form==="continente"){const n=4+((R1()*4)|0);for(let i=0;i<n;i++){const a=R1()*6.28,r=D0*(.08+R1()*.24);blobs.push([cx0+Math.cos(a)*r*1.5,cy0+Math.sin(a)*r,D0*(.14+R1()*.16),D0*(.1+R1()*.12),R1()*3.14])}
    const arms=2+((R1()*4)|0);for(let k=0;k<arms;k++){const a=R1()*6.28,sx=cx0+Math.cos(a)*D0*.3,sy=cy0+Math.sin(a)*D0*.25;spine(sx,sy,a+(R1()-.5)*.8,D0*(.2+R1()*.3),D0*(.1+R1()*.06),D0*.03,3+((R1()*3)|0))}
    const nb=3+((R1()*4)|0);for(let k=0;k<nb;k++){const a=R1()*6.28,r=D0*(.3+R1()*.18);bays.push([cx0+Math.cos(a)*r*1.3,cy0+Math.sin(a)*r,D0*(.06+R1()*.1),D0*(.04+R1()*.06),R1()*3.14])}
    for(let k=0;k<2+((R1()*4)|0);k++){const a=R1()*6.28,r=D0*(.5+R1()*.15);spine(cx0+Math.cos(a)*r*1.3,cy0+Math.sin(a)*r,R1()*6.28,D0*.08,D0*.045,D0*.02,2,1)}}
  else if(form==="costa"){const n=5+((R1()*4)|0);for(let i=0;i<n;i++){const t=(i+R1()*.6)/n,along=side<2?[ (side===0?.32:.68)*WX,t*WY]:[t*WX,(side===2?.32:.68)*WY];blobs.push([along[0],along[1],D0*(.1+R1()*.14),D0*(.08+R1()*.1),R1()*3.14])}
    for(let k=0;k<2+((R1()*3)|0);k++){const t=R1(),p=side<2?[(side===0?.36:.64)*WX,t*WY]:[t*WX,(side===2?.36:.64)*WY];bays.push([p[0],p[1],D0*(.06+R1()*.09),D0*(.04+R1()*.07),R1()*3.14])}}
  for(let i=0;i<(P.islands||0);i++){const x=WX*(.08+R1()*.84),y=WY*(.08+R1()*.8);spine(x,y,R1()*6.28,D0*(.05+R1()*.08),D0*(.04+R1()*.03),D0*.02,2+((R1()*2)|0),1)}
  for(let i=0;i<(P.lakes||0);i++)lakes.push([WX*(.2+R1()*.6),WY*(.2+R1()*.55),38+R1()*50,30+R1()*40,R1()*3.14]);
  const ell=(b,x,y)=>{const c=Math.cos(b[4]),s=Math.sin(b[4]),dx=x-b[0],dy=y-b[1];return Math.hypot((dx*c+dy*s)/b[2],(-dx*s+dy*c)/b[3])};
  const seaT=((P.sea==null?.5:P.sea)-.5)*.6-(form==="arquipelago"?.08:0);let anyWater=false;const rough=form==="continente"?1:form==="ilha"?.85:form==="arquipelago"?.6:.8;
  for(let j=0;j<GH;j++)for(let i=0;i<GW;i++){const x=i*G,y=j*G,k=j*GW+i,tt=[x/WX,1-x/WX,y/WY,1-y/WY][side];let L;
    if(form==="regiao")L=1;else{
      // deformacao do dominio: litoral sinuoso, cabos e enseadas
      const w1=D0*.2,qx=x+(fbmW(x/(D0*.42)+3,y/(D0*.42)+7,3)-.5)*w1*2,qy=y+(fbmW(x/(D0*.42)+31,y/(D0*.42)+17,3)-.5)*w1*2,rx=qx+(fbmC(qx/90+5,qy/90+9,2)-.5)*44,ry=qy+(fbmC(qx/90+41,qy/90+3,2)-.5)*44;
      let M=form==="costa"?(tt-.3)*2.6:form==="peninsula"?(.17-tt)*3.4:-1;for(const b of blobs){const v=(1-ell(b,rx,ry))*(b[5]?1.1:1.25);if(v>M)M=v}
      for(const b of bays){const v=1-ell(b,rx,ry);if(v>0)M-=v*1.4}
      L=M+(fbm(rx/(D0*.17)+31,ry/(D0*.17)+17,5)-.5)*.75*rough+(fbmC(x/38+11,y/38+5,3)-.5)*.22-seaT;
      if(form!=="costa"&&form!=="peninsula"){const ed=Math.min(x,y,WX-x,WY-y);L-=1-sstep(10,90,ed)}}
    for(const b of lakes){const v=1-ell(b,x,y);if(v>0)L=Math.min(L,.03-v*1.5+(fbm(x/60+3,y/60+9,2)-.5)*.3)}
    L=clamp(L+ladd[k],-1,1);land[k]=L;if(L<0)anyWater=true;
    const wx_=x+(fbm(x/260+70,y/260+40,2)-.5)*170,wy_=y+(fbm(x/260+10,y/260+90,2)-.5)*170,base=fbm(wx_/460+3,wy_/460+7,5),ridge=1-Math.abs(2*fbm2(wx_/300+9,wy_/300+2,3)-1),pass_=.3+.7*sstep(.02,.2,Math.abs(fbm2(wx_/400+20,wy_/400+60,2)-.5)*2);
    let e=Math.pow(clamp((base-.2)*2.3,0,1),1.2+(P.plains==null?.3:P.plains)*1.8)*(.65+.6*ridge*(1-(P.smooth||0)*.6))*(.2+P.relief*1.15);
    e=e*pass_*sstep(0,.34,L)+hadd[k];elev[k]=L<0?0:clamp(e,0,1);vari[k]=fbm2(x/210,y/210,3)}
  {const passes=Math.round((P.smooth==null?.2:P.smooth)*6);for(let ps=0;ps<passes;ps++){const tmp=elev.slice();for(let j=1;j<GH-1;j++)for(let i=1;i<GW-1;i++){const k=j*GW+i;if(land[k]<0)continue;elev[k]=(tmp[k]*4+tmp[k-1]+tmp[k+1]+tmp[k-GW]+tmp[k+GW]+(tmp[k-GW-1]+tmp[k-GW+1]+tmp[k+GW-1]+tmp[k+GW+1])*.5)/10}}}
  // distancia ao mar e lagos
  const sd=new Float32Array(N);for(let k=0;k<N;k++)sd[k]=land[k]<0?0:1e6;
  if(anyWater){for(let j=0;j<GH;j++)for(let i=0;i<GW;i++){const k=j*GW+i;let m=sd[k];if(i>0)m=Math.min(m,sd[k-1]+1);if(j>0){m=Math.min(m,sd[k-GW]+1);if(i>0)m=Math.min(m,sd[k-GW-1]+1.414);if(i<GW-1)m=Math.min(m,sd[k-GW+1]+1.414)}sd[k]=m}
    for(let j=GH-1;j>=0;j--)for(let i=GW-1;i>=0;i--){const k=j*GW+i;let m=sd[k];if(i<GW-1)m=Math.min(m,sd[k+1]+1);if(j<GH-1){m=Math.min(m,sd[k+GW]+1);if(i>0)m=Math.min(m,sd[k+GW-1]+1.414);if(i<GW-1)m=Math.min(m,sd[k+GW+1]+1.414)}sd[k]=m}}
  // rios
  const rivers=[];const addR=(ctrl,w)=>{const pts=chaikin(ctrl,3);rivers.push({pts,w,ctrl});const sw=w/16,dp=resample(pts,3);
    for(const q of dp){const i0=Math.max(0,((q[0]-60)/G)|0),i1=Math.min(GW-1,((q[0]+60)/G|0)+1),j0=Math.max(0,((q[1]-60)/G)|0),j1=Math.min(GH-1,((q[1]+60)/G|0)+1);
      for(let j=j0;j<=j1;j++)for(let i=i0;i<=i1;i++){const k=j*GW+i,d=Math.hypot(i*G-q[0],j*G-q[1])/sw;if(d<rdist[k])rdist[k]=d}}
    for(let j=0;j<GH;j++)for(let i=0;i<GW;i++){const k=j*GW+i;if(rdist[k]<60)continue;let m=rdist[k]*rdist[k];for(let q=0;q<dp.length;q+=4){const dx=dp[q][0]-i*G,dy=dp[q][1]-j*G,d=(dx*dx+dy*dy)/(sw*sw);if(d<m)m=d}rdist[k]=Math.sqrt(m)}};
  const nRiv=P.rivers==null?1:P.rivers;
  const VR=P.vec&&P.vec.rivers;if(VR)for(const r of VR)if(r&&r.c&&r.c.length>1)addR(r.c,r.w||10);
  if(!VR&&form==="regiao"&&nRiv>0){const river=[];let x=-40,y=WY*(.3+.4*rng()),t=0;const p1=rng()*6.28,p2=rng()*6.28,M=.35+P.meander*1.05,cy=WY*.5;
    // direcao do rio principal: classico (oeste->leste) ou sorteada/escolhida entre 8 direcoes; o rio atravessa o mapa passando perto do centro
    const RD_={"leste":0,"oeste":3.1416,"sul":1.5708,"norte":-1.5708,"sudeste":.7854,"nordeste":-.7854,"sudoeste":2.356,"noroeste":-2.356},rdA=RD_[P.riverDir]!=null?RD_[P.riverDir]:P.riverDir==="auto"?(mulberry((seed^0x41d77)>>>0)()*6.2832):null;
    if(rdA==null){while(x<WX+40&&t<1600){const th=M*(Math.sin(t*.034+p1)*1.15+Math.sin(t*.0125+p2)*.95)-(y-cy)*.0026;x+=Math.cos(th)*6;y+=Math.sin(th)*6;river.push([x,y]);t++}}
    else{const dx=Math.cos(rdA),dy=Math.sin(rdA),c0=[WX/2+(y-WY/2)*-dy*.6,WY/2+(y-WY/2)*dx*.6],Lh=Math.abs(dx)*WX/2+Math.abs(dy)*WY/2+60;x=c0[0]-dx*Lh;y=c0[1]-dy*Lh;
      let inn=false;while(t<2000){const ins=x>-80&&y>-80&&x<WX+80&&y<WY+80;if(ins)inn=true;else if(inn)break;const off=(x-c0[0])*-dy+(y-c0[1])*dx,th=rdA+M*(Math.sin(t*.034+p1)*1.15+Math.sin(t*.0125+p2)*.95)-off*.0026;x+=Math.cos(th)*6;y+=Math.sin(th)*6;river.push([x,y]);t++}}
    addR(simp(river,9),16)}
  for(let n=0,nt=VR?0:form==="regiao"?Math.max(0,nRiv-1):nRiv;n<nt;n++){let best=-1,bv=-1;
    for(let q=0;q<400;q++){const i=3+((rng()*(GW-6))|0),j=3+((rng()*(GH-6))|0),k=j*GW+i;if(land[k]<.2||rdist[k]<170||sd[k]*G<100)continue;const v=elev[k]+rng()*.2;if(v>bv){bv=v;best=k}}
    if(best<0)continue;const g=new Float32Array(N).fill(1e9),from=new Int32Array(N).fill(-1),done=new Uint8Array(N),H=heap();g[best]=0;H.push(0,best);let end=-1;
    while(H.size()){const u=H.pop();if(done[u])continue;done[u]=1;const ux=u%GW,uy=(u/GW)|0;
      if(land[u]<0||rdist[u]<10||ux<1||uy<1||ux>=GW-2||uy>=GH-2){end=u;break}
      for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){if(!dx&&!dy)continue;const v=(uy+dy)*GW+ux+dx;if(done[v])continue;
        const c=(1+elev[v]*18+fbm((ux+dx)/3.1+50,(uy+dy)/3.1+50,2)*3.4)*(dx&&dy?1.414:1),ng=g[u]+c;if(ng<g[v]){g[v]=ng;from[v]=u;H.push(ng,v)}}}
    if(end<0)continue;const cells=[];for(let u=end;u>=0;u=from[u])cells.push(u);cells.reverse();
    const raw=cells.map(c=>[(c%GW)*G,((c/GW)|0)*G]);if(raw.length>6){const a=raw[raw.length-2],b=raw[raw.length-1];if(land[end]<0)for(let q=1;q<=5;q++)raw.push([b[0]+(b[0]-a[0])*q*1.3,b[1]+(b[1]-a[1])*q*1.3]);addR(simp(raw,7),8+rng()*3)}}
  for(let k=0;k<N;k++){if(land[k]>=0)elev[k]*=(.05+.95*sstep(18,235,rdist[k]))*(anyWater?sstep(0,13,sd[k]):1);dist[k]=Math.min(rdist[k],sd[k]*G)}
  for(let j=1;j<GH-1;j++)for(let i=1;i<GW-1;i++){const k=j*GW+i;slope[k]=Math.hypot(elev[k+1]-elev[k-1],elev[k+GW]-elev[k-GW])}
  const dry=!anyWater&&!rivers.length;
  // clima e biomas
  const temp=P.temp==null?.5:P.temp,hum=P.humid==null?.5:P.humid,cv=P.climVar==null?.5:P.climVar,waste=P.waste==null?.1:P.waste,fbm3=makeNoise(seed^0x7a11);
  const biome=new Uint8Array(N),snow=new Float32Array(N),bR=new Float32Array(N),bG=new Float32Array(N),bB=new Float32Array(N),fR=new Float32Array(N),fG=new Float32Array(N),fB=new Float32Array(N),bfor=new Float32Array(N);
  const bov=new Int8Array(N).fill(-1);for(const e of bEd){const i0=Math.max(0,((e.x-e.r)/G)|0),i1=Math.min(GW-1,((e.x+e.r)/G|0)+1),j0=Math.max(0,((e.y-e.r)/G)|0),j1=Math.min(GH-1,((e.y+e.r)/G|0)+1);for(let j=j0;j<=j1;j++)for(let i=i0;i<=i1;i++){if(Math.hypot(i*G-e.x,j*G-e.y)<e.r*(.8+.35*fbm3(i/3,j/3,2)))bov[j*GW+i]=e.b}}
  for(let j=0;j<GH;j++)for(let i=0;i<GW;i++){const k=j*GW+i,x=i*G,y=j*G;
    const lat=(y/WY-.5)+(fbm3(x/(700*SC)+5,y/(700*SC)+9,3)-.5)*.35,T=(temp-.5)*.9+.56+lat*(.08+cv*.55)*Math.sqrt(SC)+(fbm3(x/(950*SC)+15,y/(950*SC)+3,2)-.5)*.1-elev[k]*.36;
    const Mo=(hum-.5)*.9+.5+(fbm3(x/(430*SC)+41,y/(430*SC)+13,4)-.5)*(.25+cv*1.1)+.18*(1-sstep(20,140,dist[k]));
    let b;if(T<.14)b=2;else if(T<.27)b=Mo>.42?1:3;else if(T<.66){b=Mo<.2&&T>.5?5:(Mo>.76&&elev[k]<.12&&dist[k]<90)?7:T<.38?1:0}else b=Mo<.36?4:Mo<.54?5:(Mo>.78&&elev[k]<.12)?7:6;
    if(waste>0&&fbm3(x/(380*SC)+77,y/(380*SC)+31,3)>1.02-waste*.55)b=8;
    if(P.bio2){const e=elev[k],dd=dist[k],nz=fbm3(x/(300*SC)+123,y/(300*SC)+57,3);
      if(T<.07)b=14;else if(b===6&&dd<34&&e<.08)b=10;else if((b===6||b===7||b===5)&&Mo>.62&&e<.09&&dd>80&&nz>.5)b=9;else if(b===4&&e<.07&&nz>.62)b=11;else if(b===4&&nz<.3)b=12;
      if(e>.5&&T>.32&&fbm3(x/(520*SC)+211,y/(520*SC)+19,2)>.66)b=13;
      if(P.dom!=null&&P.dom!=="auto"&&fbm3(x/(500*SC)+61,y/(500*SC)+17,3)>.3)b=+P.dom;
      const fa=P.fant||0;if(fa>0&&fbm3(x/(420*SC)+301,y/(420*SC)+77,3)>1.04-fa*.6){const K=P.fantK&&P.fantK!=="auto"?+P.fantK:[15,16,17,18,19,20][((fbm3(x/(1400*SC)+9,y/(1400*SC)+3,1)*6)|0)%6];b=K}}
    if(bov[k]>=0)b=bov[k];biome[k]=b;
    const sl=b===2||b===14?1:sstep(.33,.2,T)*sstep(.45,.62,elev[k])*(b===4||b===6||b===5?0:1);snow[k]=Math.max(b===2?1:b===3?.35:0,sl,P.season==="inverno"&&b!==4&&b!==5&&b!==6&&b!==8?clamp(.45+fbm3(x/90+3,y/90+7,3)*.6-(b===7?.2:0),0,1):0);
    const c0=BG[b][0],c1=BG[b][1];bR[k]=(c0[0]+c1[0])/2;bG[k]=(c0[1]+c1[1])/2;bB[k]=(c0[2]+c1[2])/2;fR[k]=BF[b][0];fG[k]=BF[b][1];fB[k]=BF[b][2];bfor[k]=BFOR[b]}
  // mistura suave das cores entre biomas
  for(const arr of[bR,bG,bB,fR,fG,fB,bfor])for(let pass=0;pass<2;pass++){const tmp=arr.slice();for(let j=1;j<GH-1;j++)for(let i=1;i<GW-1;i++){const k=j*GW+i;arr[k]=(tmp[k]*4+tmp[k-1]+tmp[k+1]+tmp[k-GW]+tmp[k+GW])/8}}
  const bAt=(x,y)=>biome[clamp(Math.round(y/G),0,GH-1)*GW+clamp(Math.round(x/G),0,GW-1)];
  // povoados
  const towns=[];{let tries=P.lock?1e9:0;if(P.lock)for(const l of P.lock){if(sampleGrid(land,l.x,l.y)>.03&&sampleGrid(rdist,l.x,l.y)>14)towns.push({x:l.x,y:l.y,size:l.size,kind:l.kind,planned:!!l.planned,ang:0,name:l.name||"",streets:[],dens:l.dens,wall:l.wall,race:l.race,lockOutline:l.outline&&l.outline.length>2?l.outline:null,lockSt:Array.isArray(l.st)?l.st:null})}while(towns.length<Math.round(P.towns*SC*SC)&&tries<5000){tries++;const c0=towns.length===0,x=c0?330+rng()*(WX-660):110+rng()*(WX-220),y=c0?430+rng()*(WY-900):190+rng()*(WY-420),d=sampleGrid(dist,x,y),e=sampleGrid(elev,x,y),sl=sampleGrid(slope,x,y);
      const lim=tries>3000?2.2:1;if((!dry&&(c0?(d<36||d>118*lim):(d<60||d>250*lim)))||sampleGrid(land,x,y)<.12||e>.34*lim||sl>.035*lim)continue;
      if(tries<4200&&[130,200,280].some(o=>sampleGrid(elev,x,y+o)>e+.16))continue;
      if(towns.some(t=>Math.hypot(t.x-x,t.y-y)<(towns.length?260:0)))continue;
      const first=towns.length===0,size=first?30:6+((rng()*11)|0);
      const kind=first?"city":size>=12?"town":"village";
      const planned=P.plan==="planned"?kind!=="village"||rng()<.5:P.plan==="organic"?false:(first||(kind==="town"&&rng()<.45));
      towns.push({x:Math.round(x/G)*G,y:Math.round(y/G)*G,size,kind,planned,ang:0,name:"",streets:[]})}
    const pool=NAMES.filter(n=>!towns.some(t=>t.name===n));let un=1;for(const t of towns){if(!t.name)t.name=pool.length?pool.splice((rng()*pool.length)|0,1)[0]:"Vila "+(un++);
      if(!(t.size>0))t.size=t.kind==="camp"?16:t.kind==="city"?30:t.kind==="town"?14:8;t.core=t.size*2.7+14;t.R=t.core+70+t.size*3;if(t.dens==null)t.dens=.5+rng()*.25;if(t.wall==null&&t.kind==="city")t.wall=true;t.wallR=t.wall?t.core+16:0}}
  // cultura de cada povoado pelo bioma, relevo e floresta em volta
  {const div=P.races==null?.5:P.races;for(const t of towns){if(t.race&&CUL[t.race])continue;const b=bAt(t.x,t.y),e=sampleGrid(elev,t.x,t.y),fo=fbm2(t.x/250+11,t.y/250+5,4),r=rng();
    const reg=P.culture||"europa";let opts;
    if(reg==="leste")opts=b===4||b===5?["mongol","mongol","chines"]:b===2||b===3?["japones","mongol"]:b===6||b===7?["chines","chines","japones"]:b===8?["orc","chines"]:["japones","chines","chines","japones"];
    else if(reg==="sul")opts=b===4?["indiano","deserto"]:b===2||b===3?["indiano","mongol"]:["indiano","indiano","indiano","tribal"];
    else if(reg==="meso")opts=b===2||b===3?["norte","meso"]:b===4?["meso","deserto"]:["meso","meso","meso","tribal"];
    else if(reg==="estepe")opts=b===6||b===7?["chines","tribal"]:b===4?["mongol","deserto"]:["mongol","mongol","mongol","norte"];
    else if(reg==="misto")opts=b===4?["deserto","mongol","indiano"]:b===5?["tribal","mongol","indiano"]:b===6?["tribal","meso","chines","elfo"]:b===7?["pantano","chines","orc"]:b===8?["orc","orc"]:b===2||b===3?["norte","anao","japones","mongol"]:b===1?["norte","japones","elfo","anao"]:["humano","japones","chines","indiano","meso","elfo","anao","halfling"];
    else if(reg==="eslava")opts=b===2||b===3?["eslavo","norte"]:b===4?["mongol","eslavo"]:["eslavo","eslavo","eslavo","humano"];
    else if(reg==="mediter")opts=b===4?["egipcio","mediterraneo"]:b===2||b===3?["mediterraneo","bizantino"]:["mediterraneo","mediterraneo","bizantino","pirata"];
    else if(reg==="antigo")opts=b===4?["egipcio","egipcio","deserto"]:["bizantino","egipcio","mediterraneo"];
    else if(reg==="celta")opts=b===2||b===3?["celta","norte"]:["celta","celta","celta","humano"];
    else if(reg==="andes")opts=b===6||b===7?["meso","andino"]:["andino","andino","andino","meso"];
    else if(reg==="industrial")opts=["vapor","vapor","vapor","gnomo","humano"];else if(reg==="piratas")opts=["pirata","pirata","pirata","mediterraneo","humano"];else if(reg==="fantasia")opts=b===2||b===3?["anao","gnomo"]:b===1?["elfo","gnomo"]:["gnomo","elfo","halfling","pirata","humano"];
    if(reg!=="europa"){let race=opts[0];if(reg==="misto"&&e>.3&&rng()<.4)race="anao";else if(rng()<.35+div*.65)race=pick(opts);t.race=race;if(t.wall==null&&(race==="mongol"||race==="halfling"))t.wall=false;continue}
    if(b===4)opts=["deserto","deserto","tribal"];else if(b===5)opts=["tribal","deserto","humano"];else if(b===6)opts=["tribal","elfo","elfo"];else if(b===7)opts=["pantano","pantano","orc"];else if(b===8)opts=["orc","orc","humano"];
    else if(b===2||b===3)opts=["norte","norte","anao"];else if(b===1)opts=["norte","humano","elfo","anao"];else opts=["humano","humano","humano","halfling","elfo","anao"];
    let race=opts[0];if(e>.3&&b!==4&&b!==6&&rng()<.7)race="anao";else if(fo>.55&&b<=1&&rng()<.55)race="elfo";else if(r<div*.9)race=pick(opts);t.race=race;
    if(t.wall==null&&(race==="halfling"||race==="elfo"&&t.kind!=="city"))t.wall=false}
    for(const t of towns){const C=CUL[t.race];t.pal={r:[rng()<.6?C.roof[0]:pick(C.roof),pick(C.roof)],w:[rng()<.6?C.wall[0]:pick(C.wall),pick(C.wall)]}}}
  // terreno suavizado sob os povoados: mantem parte da encosta, sem virar plato
  for(const t of towns){const e0=sampleGrid(elev,t.x,t.y),rr=t.core*1.9;
    for(let j=Math.max(0,((t.y-rr)/G)|0);j<=Math.min(GH-1,((t.y+rr)/G|0)+1);j++)for(let i=Math.max(0,((t.x-rr)/G)|0);i<=Math.min(GW-1,((t.x+rr)/G|0)+1);i++){const d=Math.hypot(i*G-t.x,j*G-t.y);if(d<rr){const k=j*GW+i;elev[k]=lerp(e0+(elev[k]-e0)*.42,elev[k],sstep(t.core*.8,rr,d))}}}
  for(let j=1;j<GH-1;j++)for(let i=1;i<GW-1;i++){const k=j*GW+i;slope[k]=Math.hypot(elev[k+1]-elev[k-1],elev[k+GW]-elev[k-GW])}
  // contorno de cada povoado: irregular, para no mar e nas encostas fortes
  for(const t of towns){const NA=40,sa=rng()*3.14,st=1.05+rng()*.42,ph=rng()*9,rs=[];
    for(let k=0;k<NA;k++){const a=k/NA*6.2832,cx=Math.cos(a),cy=Math.sin(a),u=cx*Math.cos(sa)+cy*Math.sin(sa),v=-cx*Math.sin(sa)+cy*Math.cos(sa),el=1/Math.hypot(u/st,v*st*.92);
      const rb=t.core*el*(.74+.6*fbm(cx*1.25+ph,cy*1.25+ph,2));let r=6;
      while(r<rb){const x=t.x+cx*r,y=t.y+cy*r;if(x<24||y<24||x>WX-24||y>WY-60||sampleGrid(land,x,y)<.05||sampleGrid(slope,x,y)>.1)break;r+=4}rs.push(Math.max(10,r))}
    let sm=rs;
    if(t.lockOutline){const pl=t.lockOutline;sm=rs.map((_,k)=>{const a=k/NA*6.2832,dx=Math.cos(a),dy=Math.sin(a);let best=0;for(let i=0;i<pl.length;i++){const p=pl[i],q=pl[(i+1)%pl.length],ex=q[0]-p[0],ey=q[1]-p[1],den=dx*ey-dy*ex;if(Math.abs(den)<1e-9)continue;const tt=((p[0]-t.x)*ey-(p[1]-t.y)*ex)/den,u=((p[0]-t.x)*dy-(p[1]-t.y)*dx)/den;if(tt>0&&u>=0&&u<=1&&tt>best)best=tt}return Math.max(10,best)})}
    else{const med=rs.slice().sort((a,b)=>a-b)[NA>>1];sm=rs.map(r=>Math.max(r,med*.62));for(let pass=0;pass<3;pass++)sm=sm.map((r,k)=>(sm[(k+NA-1)%NA]+2*r+sm[(k+1)%NA])/4)}
    t.rs=sm;t.outline=sm.map((r,k)=>[t.x+Math.cos(k/NA*6.2832)*r,t.y+Math.sin(k/NA*6.2832)*r]);t.rmax=Math.max(...sm);
    t.rel=(x,y)=>{const dx=x-t.x,dy=y-t.y,a=((Math.atan2(dy,dx)+6.2832)%6.2832)/6.2832*NA,i0=a|0,f=a-i0;return Math.hypot(dx,dy)/lerp(sm[i0%NA],sm[(i0+1)%NA],f)};
    t.inside=(x,y,m)=>t.rel(x,y)<(m||1);t.wallR=t.wall?t.rmax+12:0;t.ctrlOutline=t.lockOutline||t.outline.filter((_,k)=>k%2===0).map(q=>[Math.round(q[0]),Math.round(q[1])])}
  // floresta
  const thr=.76-P.forest*.4;
  for(let j=0;j<GH;j++)for(let i=0;i<GW;i++){const x=i*G,y=j*G,k=j*GW+i;const v=fbm2(x/250+11,y/250+5,4)*.8+elev[k]*.42+slope[k]*2;
    let f=clamp((v-thr)*7,0,1)*bfor[k]*Math.min(1,(P.forest==null?.5:P.forest)*2.2);f*=sstep(14,46,dist[k]+fbm(x/40,y/40,2)*30);
    for(const t of towns){if(Math.abs(t.x-x)>t.rmax*2.6+60||Math.abs(t.y-y)>t.rmax*2.6+90)continue;const rl=Math.min(t.rel(x,y),t.rel(x,y-34))+(fbm(x/60,y/60,2)-.5)*.45;f*=sstep(1.25,1.95+(t.kind==="village"?.4:0),rl)}
    forest[k]=land[k]<.02?0:clamp(f+fadd[k],0,1)}
  for(const t of towns)if(t.race&&CUL[t.race].trees)for(let j=0;j<GH;j++)for(let i=0;i<GW;i++){const k=j*GW+i,rl=t.rel(i*G,j*G);if(rl<.95)forest[k]=Math.max(forest[k],0)}
  // estradas: custo cresce com a rampa (faz zigue-zague em encosta), travessia de rio cara, reaproveita estradas
  const roadG=new Uint8Array(N),MOV=[[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1],[2,1],[2,-1],[-2,1],[-2,-1],[1,2],[1,-2],[-1,2],[-1,-2]];
  function astar(s,tg){const g=new Float32Array(N).fill(1e9),from=new Int32Array(N).fill(-1),done=new Uint8Array(N),H=heap(),tx=tg%GW,ty=(tg/GW)|0;g[s]=0;H.push(0,s);
    while(H.size()){const u=H.pop();if(u===tg)break;if(done[u])continue;done[u]=1;const ux=u%GW,uy=(u/GW)|0;
      for(const [dx,dy] of MOV){const vx=ux+dx,vy=uy+dy;if(vx<0||vy<0||vx>=GW-1||vy>=GH-1)continue;const v=vy*GW+vx;if(done[v]||land[v]<.01)continue;
        if(Math.abs(dx)+Math.abs(dy)===3){const m=(uy+((dy/2)|0))*GW+ux+((dx/2)|0);if(land[m]<.01||(rdist[m]<12&&!roadG[m]))continue}
        const run=Math.hypot(dx,dy),gr=Math.abs(elev[v]-elev[u])*K/(run*G);
        let c=run*(1+45*gr*gr+(gr>.12?(gr-.12)*160:0)+forest[v]*.6)+(rdist[v]<12&&!roadG[v]?70:0);if(roadG[v])c*=.22;else if(roadG[v-1]||roadG[v+1]||roadG[v-GW]||roadG[v+GW]||roadG[v-GW-1]||roadG[v-GW+1]||roadG[v+GW-1]||roadG[v+GW+1])c*=2.4;
        const ng=g[u]+c;if(ng<g[v]){g[v]=ng;from[v]=u;H.push(ng+Math.hypot(vx-tx,vy-ty)*.34,v)}}}
    const path=[];let u=tg;if(from[u]<0&&u!==s)return path;while(u>=0){path.push(u);u=from[u]}return path.reverse()}
  const cellOf=(x,y)=>clamp(Math.round(y/G),0,GH-2)*GW+clamp(Math.round(x/G),0,GW-2);
  const roads=[],roadCtrl=[];const pushRoad=ctrl=>{const pts=chaikin(ctrl,3);for(const q of resample(pts,6))roadG[cellOf(q[0],q[1])]=1;roads.push(pts);roadCtrl.push(ctrl)};
  const adj=new Map(),addE=(a,b)=>{if(a===b)return;if(!adj.has(a))adj.set(a,new Set());if(!adj.has(b))adj.set(b,new Set());adj.get(a).add(b);adj.get(b).add(a)};
  const addRoad=(a,b)=>{const cells=astar(a,b);if(cells.length<2)return;cells.forEach((c,i)=>{roadG[c]=1;if(i)addE(cells[i-1],c)})};
  if(P.vec&&P.vec.roads){for(const c of P.vec.roads){if(!c||c.length<2)continue;let cur=[c[0]];const dryP=q=>sampleGrid(land,q[0],q[1])>=.02;
      for(let i=1;i<c.length;i++){const a=c[i-1],b=c[i],n=Math.max(1,Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1])/4));let ok=dryP(a)&&dryP(b);for(let k=1;k<n&&ok;k++)if(!dryP([lerp(a[0],b[0],k/n),lerp(a[1],b[1],k/n)]))ok=false;
        if(ok)cur.push(b);else{if(cur.length>1)pushRoad(cur);cur=dryP(b)?[b]:[]}}
      if(cur.length>1)pushRoad(cur)}
    towns.forEach((t,i)=>{if(roads.some(r=>r.some(q=>Math.hypot(q[0]-t.x,q[1]-t.y)<28)))return;let bj=-1,bd=1e9;towns.forEach((o,j)=>{if(j===i)return;const d=Math.hypot(o.x-t.x,o.y-t.y);if(d<bd){bd=d;bj=j}});if(bj>=0)addRoad(cellOf(t.x,t.y),cellOf(towns[bj].x,towns[bj].y))})}
  else
  {const inT=[0],out=towns.map((_,i)=>i).slice(1);const tc=t=>cellOf(t.x,t.y);
    while(out.length){let best=null;for(const i of inT)for(const j of out){const d=Math.hypot(towns[i].x-towns[j].x,towns[i].y-towns[j].y);if(!best||d<best[2])best=[i,j,d]}
      addRoad(tc(towns[best[0]]),tc(towns[best[1]]));inT.push(best[1]);out.splice(out.indexOf(best[1]),1)}
    const byX=towns.slice().sort((a,b)=>a.x-b.x);if(byX.length){const l=byX[0],r=byX[byX.length-1];
      addRoad(tc(l),cellOf(0,l.y+(rng()-.5)*260));addRoad(tc(r),cellOf(WX,r.y+(rng()-.5)*260));
      const byY=towns.slice().sort((a,b)=>a.y-b.y);addRoad(tc(byY[0]),cellOf(byY[0].x+(rng()-.5)*300,0));
      if(towns.length>3){const a=byY[byY.length-1],b=byX[(byX.length/2)|0];if(a!==b)addRoad(tc(a),tc(b))}}}
  {const seen=new Set(),ek=(a,b)=>a<b?a*N+b:b*N+a,tcells=new Set(towns.map(t=>cellOf(t.x,t.y))),isJ=n=>adj.get(n).size!==2||tcells.has(n),chains=[];
    const walk=(s0,nx)=>{const ch=[s0];let prev=s0,cur=nx;seen.add(ek(s0,nx));for(;;){ch.push(cur);if(isJ(cur))break;let nn=null;for(const m of adj.get(cur))if(m!==prev){nn=m;break}if(nn===null||seen.has(ek(cur,nn)))break;seen.add(ek(cur,nn));prev=cur;cur=nn}return ch};
    for(const [n,ns] of adj)if(isJ(n))for(const m of ns)if(!seen.has(ek(n,m)))chains.push(walk(n,m));
    for(const [n,ns] of adj)for(const m of ns)if(!seen.has(ek(n,m)))chains.push(walk(n,m));
    const gOf=(a,b)=>Math.abs(sampleGrid(elev,b[0],b[1])-sampleGrid(elev,a[0],a[1]))*K/(Math.hypot(b[0]-a[0],b[1]-a[1])||1);
    const segOK=(a,b,gmax)=>{const dx=b[0]-a[0],dy=b[1]-a[1],l=Math.hypot(dx,dy),n=Math.max(1,Math.ceil(l/4));let pe=sampleGrid(elev,a[0],a[1]);for(let k=1;k<=n;k++){const x=a[0]+dx*k/n,y=a[1]+dy*k/n;if(sampleGrid(land,x,y)<.02||sampleGrid(rdist,x,y)<13)return false;const e=sampleGrid(elev,x,y);if(Math.abs(e-pe)*K/(l/n)>gmax)return false;pe=e}return true};
    const pull=pts=>{if(pts.length<3)return pts;const out=[pts[0]];let i=0;while(i<pts.length-1){let best=i+1,mg=0;for(let j=i+1;j<Math.min(pts.length,i+46);j++){mg=Math.max(mg,gOf(pts[j-1],pts[j]));if(j>i+1&&segOK(pts[i],pts[j],Math.max(.07,mg*1.04)))best=j}out.push(pts[best]);i=best}return out};
    for(const ch of chains){const pts=ch.map(i=>[(i%GW)*G,((i/GW)|0)*G]);pushRoad(pull(pts))}}
  // ocupacao: 1 estrada, 2 construcao/muralha, >=10 campos
  const occ=new Uint16Array(OW*OH);
  const occAt=(x,y)=>(x<0||y<0||x>=WX||y>=WY)?1:occ[((y/O)|0)*OW+((x/O)|0)];
  const disc=(x,y,r,v,force)=>{const x0=Math.max(0,((x-r)/O)|0),x1=Math.min(OW-1,((x+r)/O)|0),y0=Math.max(0,((y-r)/O)|0),y1=Math.min(OH-1,((y+r)/O)|0);
    for(let j=y0;j<=y1;j++)for(let i=x0;i<=x1;i++){const dx=i*O+2-x,dy=j*O+2-y;if(dx*dx+dy*dy<=r*r){const k=j*OW+i;if(force||!occ[k])occ[k]=v}}};
  const line=(pts,r,v)=>{for(let i=0;i<pts.length-1;i++){const a=pts[i],b=pts[i+1],n=Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1])/3)+1;for(let k=0;k<=n;k++)disc(lerp(a[0],b[0],k/n),lerp(a[1],b[1],k/n),r,v,true)}};
  for(const r of roads)line(r,4,1);
  // pontes
  const bridges=[];const findBridges=r0=>{const r=resample(r0,2);let run=null;for(let i=0;i<r.length;i++){const w=sampleGrid(rdist,r[i][0],r[i][1])<10.5;if(w&&run===null)run=i;if((!w||i===r.length-1)&&run!==null){{let a0=Math.max(0,run-1),b0=Math.min(r.length-1,i);while(a0>0&&sampleGrid(rdist,r[a0][0],r[a0][1])<12.5)a0--;while(b0<r.length-1&&sampleGrid(rdist,r[b0][0],r[b0][1])<12.5)b0++;bridges.push([r[a0],r[b0]])}run=null}}};for(const r of roads)findBridges(r);
  const splitDry=pts=>{const out=[];let cur=[];for(const q of pts){if(sampleGrid(dist,q[0],q[1])<13){if(cur.length>2)out.push(cur);cur=[]}else cur.push(q)}if(cur.length>2)out.push(cur);return out};
  // ---------- povoados ----------
  const fieldsP=[],extra=[],gardens=[];
  const SG=new Int32Array(OW*OH),SGi=new Int32Array(OW*OH),allSt=[];
  const regSt=(pts,ti,main)=>{const id=allSt.length;allSt.push({pts,ti,main});pts.forEach((q,i)=>{const x=(q[0]/O)|0,y=(q[1]/O)|0;if(x<0||y<0||x>=OW||y>=OH)return;const k=y*OW+x;SG[k]=id+1;SGi[k]=i});return id};
  const nearSt=(x,y,r,skip)=>{let best=null,bd=r;const i0=Math.max(0,((x-r)/O)|0),i1=Math.min(OW-1,((x+r)/O)|0),j0=Math.max(0,((y-r)/O)|0),j1=Math.min(OH-1,((y+r)/O)|0);
    for(let j=j0;j<=j1;j++)for(let i=i0;i<=i1;i++){const k=j*OW+i,s=SG[k]-1;if(s<0||s===skip)continue;const q=allSt[s].pts[SGi[k]],d=Math.hypot(q[0]-x,q[1]-y);if(d<bd){bd=d;best={s,i:SGi[k],q}}}return best};
  const tang=(pts,i)=>{const a=pts[Math.max(0,i-1)],b=pts[Math.min(pts.length-1,i+1)];return Math.atan2(b[1]-a[1],b[0]-a[0])};
  for(const r of roads)regSt(resample(r,3),-1,true);
  const wet=(x,y)=>{const l=sampleGrid(land,x,y);return l<.04||sampleGrid(rdist,x,y)<12.5*(1+1.7*sstep(.16,-.02,l))};

  const R2=a=>a[0]+rng()*(a[1]-a[0]);
  const typeFor=(t,x,y)=>{const d=t.rel(x,y),r=rng();
    if(t.kind==="village")return r<.3?"hut":r<.78?"farm":r<.9?"barn":r<.95?"tavern":"smithy";
    if(d>1.02)return r<.55?"hut":r<.85?"farm":"barn";
    if(t.kind==="town")return d<.45?(r<.42?"town":r<.6?"row":r<.74?"rich":r<.86?"tavern":"smithy"):(r<.42?"farm":r<.68?"town":r<.86?"hut":"barn");
    if(d<.38)return r<.38?"rich":r<.62?"row":r<.8?"town":r<.9?"tavern":"manor";
    if(d<.78)return r<.36?"town":r<.66?"row":r<.75?"smithy":r<.85?"tavern":r<.95?"rich":"farm";
    return r<.45?"town":r<.62?"row":r<.85?"farm":"hut"};
  const B=[],placed=[];const snowAt=(x,y)=>sampleGrid(snow,x,y);
  const rectPts=(cx,cy,a,L,D,st)=>{const ca=Math.cos(a),sa=Math.sin(a),o=[];for(let u=-L/2;u<=L/2+.01;u+=Math.min(st,L/2))for(let v=-D/2;v<=D/2+.01;v+=Math.min(st,D/2))o.push([cx+ca*u-sa*v,cy+sa*u+ca*v]);return o};
  const freeRect=(cx,cy,a,L,D,top)=>{for(const q of rectPts(cx,cy,a,L*.92,D*.92,3)){if(occAt(q[0],q[1])||wet(q[0],q[1]))return false}
    if(top){const H=top[0],R=top[1],hd=D/2,ca=Math.cos(a),sa=Math.sin(a);for(const u of[-L*.42,0,L*.42])for(const v of[-hd,-hd/2,0,hd/2,hd]){const hh=(H+R*(1-Math.abs(v)/hd))*.9/TILT,x=cx+ca*u-sa*v,y=cy+sa*u+ca*v;for(const f of[.5,1]){if(occAt(x,y-hh*f)===1)return false}}}return true};
  const takeRect=(cx,cy,a,L,D,v)=>{for(const q of rectPts(cx,cy,a,L,D,2.6))disc(q[0],q[1],1.9,v||2,false)};
  const house=(t,cx,cy,a,type)=>{const sp=SPEC[type],race=(t&&t.race)||"humano",C=CUL[race],cold=snowAt(cx,cy)>.5;let L=R2(sp.L),D=R2(sp.D),H=R2(sp.H)*.72,R=R2(sp.R)*.8,form=C.form;
    if(form==="round"||form==="mound"||form==="yurt"){const m=(L+D)/2;L=m*.95;D=m*.95;if(form!=="mound")H*=.8}if(form==="asian"){H*=.85;R*=1.15}if(C.low){L*=1.12;H*=.8}if(C.steep)R*=1.5;if(C.lowR)R*=.55;if(form==="flat")R=0;if(form==="long"&&type!=="shed"){L*=1.3}
    if(form==="stilt"&&wet(cx,cy))return false;
    if(!freeRect(cx,cy,a,L,D,[H,R]))return false;takeRect(cx,cy,a,L,D);
    const rural=type==="hut"||type==="shed"||type==="barn"||type==="farm";const pl=t&&t.pal,pk2=(a,all)=>{const r=rng();return r<.72?a[0]:r<.94?a[1]:pick(all)};let roof=rural&&form==="gable"&&race==="humano"&&rng()<.6?pick(sp.roof):pl?pk2(pl.r,C.roof):pick(C.roof),wall=rural&&race==="humano"&&rng()<.5?pick(sp.wall):pl?pk2(pl.w,C.wall):pick(C.wall);if(cold&&form!=="flat"&&form!=="mound")roof="snow";
    const big=type==="rich"||type==="manor"||type==="tavern",urb=type==="town"||type==="row"||big;H*=form==="gable"&&urb?.82+rng()*.45:.9+rng()*.2;
    let wing=null,tower=null,dorm=null;const ca=Math.cos(a),sa=Math.sin(a);
    if(form==="gable"||form==="long"){
      if((big||type==="farm"||type==="town"||type==="barn")&&rng()<(big?.75:.45)){const wl=D*(.7+rng()*.5),wd=L*(.32+rng()*.22),s0=rng()<.5?-1:1,e0=rng()<.5?-1:1;
        for(const [side,end] of [[s0,e0],[-s0,e0],[s0,-e0],[-s0,-e0]]){const u=end*(L/2-wd/2),v=side*(D/2+wl/2-.6),wx=cx+ca*u-sa*v,wy=cy+sa*u+ca*v;
          if(freeRect(wx,wy,a+1.5708,wl,wd,[H*.8,R*.8])){takeRect(wx,wy,a+1.5708,wl,wd);wing={dx:(wx-cx),dy:(wy-cy)*TILT,L:wl,D:wd,h:.8+rng()*.15,ang:a+1.5708};break}}}
      if(type==="manor"&&rng()<.75||type==="rich"&&rng()<.35||type==="town"&&rng()<.05||type==="tavern"&&rng()<.2){const end=rng()<.5?-1:1,u=end*L/2,tx=cx+ca*u,ty=cy+sa*u;tower={dx:tx-cx,dy:(ty-cy)*TILT+1,w:2.6+rng()*.8,h:H+R+4+rng()*5,r:4+rng()*2,back:(sa*end)<0}}
      if(urb&&R>2.6&&rng()<.5){dorm=[];const n=1+((L/7)|0);for(let q=0;q<n;q++)dorm.push(-L/2+L*(q+.5)/n)}}
    B.push({k:1,x:cx,y:cy,ang:a,ti:t?t.i:-1,type,L,D,H,R,form,roof,wall,wing,tower,dorm,tr:(rng()-.5)*.13,tw:(rng()-.5)*.07,door:sp.door,win:sp.win,timber:race==="humano"&&sp.timber&&rng()<.8,chim:sp.chim||(cold&&rng()<.5)||race==="vapor",sign:sp.sign,smoke:sp.smoke||(cold&&rng()<.25)||race==="vapor"&&rng()<.3,dome:form==="flat"&&(type==="rich"||type==="manor")&&rng()<.7,spike:race==="orc"});return true};
  const house0=(t,cx,cy,a,type)=>{
    return false};
  // casa de frente para a rua: x,y no eixo da rua, ang = direcao da rua, sd = lado
  const front=(t,x,y,ang,sd,type,half)=>{const sp=SPEC[type],gable=type==="row"||(type==="town"&&rng()<.4),a=gable?ang+1.5708:ang,dp=gable?(sp.L[0]+sp.L[1])/2:(sp.D[0]+sp.D[1])/2,nx=-Math.sin(ang)*sd,ny=Math.cos(ang)*sd;
    for(const ex of[0,2.5,5.5,9,13]){const off=half+1+dp/2+ex;if(house(t,x+nx*off,y+ny*off,a+(rng()-.5)*.06,type))return gable?(sp.D[0]+sp.D[1])/2:(sp.L[0]+sp.L[1])/2}return 0};
  const lineFront=(t,pts,half,m,suburb)=>{let acc=0,next=2+rng()*4;const gap=lerp(16,.4,t.dens);for(let i=0;i<pts.length-1;i++){const a=pts[i],b=pts[i+1],len=Math.hypot(b[0]-a[0],b[1]-a[1]);if(len<.01)continue;const ang=Math.atan2(b[1]-a[1],b[0]-a[0]);
      while(next<=acc+len){const q=(next-acc)/len,x=lerp(a[0],b[0],q),y=lerp(a[1],b[1],q),rl=t.rel(x,y);let adv=4;
        if(rl<m&&(!suburb||rl>.95)){for(const sd of[-1,1]){if(rng()<(suburb?.75-t.dens*.4:.55-t.dens*.53))continue;const w=front(t,x,y,ang,sd,suburb?(rng()<.6?"hut":"farm"):typeFor(t,x,y),half);if(w)adv=Math.max(adv,w+gap+(suburb?8+rng()*14:0))}}
        next+=adv}acc+=len}};
  const grow=(t,x,y,h,len,opt)=>{const pts=[[x,y]];let ang=h,cv=opt.straight?0:(rng()-.5)*.03,tr=0;
    for(let q=0;q<len;q+=4){const e0=sampleGrid(elev,x,y),sl=(da)=>Math.abs(sampleGrid(elev,x+Math.cos(ang+da)*8,y+Math.sin(ang+da)*8)-e0)*K/8,gr=sl(0);
      if(gr>.12){const l=sl(.5),r=sl(-.5);ang+=(l<r?1:-1)*Math.min(.5,(gr-.12)*1.6)}if(sl(0)>.5)break;
      if(!opt.straight){cv=clamp(cv+(rng()-.5)*.014,-.045,.045);ang+=cv*4}
      x+=Math.cos(ang)*4;y+=Math.sin(ang)*4;tr+=4;
      if(!t.inside(x,y,opt.m||.98)||wet(x,y)||occAt(x,y)===2)break;
      if(tr>9&&!opt.through){const n=nearSt(x,y,7,-1);if(n){pts.push([n.q[0],n.q[1]]);return {pts,join:true}}}
      pts.push([x,y])}
    return {pts,join:false}};
  const walls=[],brAdd=[];
  const buildCamp=(t,ti)=>{const R0=clamp(t.core*1.1,30,90),shape=["rect","oval","poly","rect","oval","star"][(rng()*6)|0],ax0=(()=>{const nr=nearSt(t.x,t.y,t.rmax*1.3,-1);return nr?tang(allSt[nr.s].pts,nr.i):(rng()-.5)*.8})();
    const ax=ax0+(rng()<.4?(rng()-.5)*.6:0),ca=Math.cos(ax),sa=Math.sin(ax),ar=.62+rng()*.35,ph=rng()*6,ns=5+((rng()*4)|0),Wp=(u,v)=>[t.x+ca*u-sa*v,t.y+sa*u+ca*v];
    const rad=a=>{const k=Math.cos(a),q=Math.sin(a);if(shape==="rect"){const ex=R0,ey=R0*ar;return Math.min(ex/Math.max(1e-6,Math.abs(k)),ey/Math.max(1e-6,Math.abs(q)))}if(shape==="oval")return R0/Math.hypot(k,q/ar);if(shape==="star"){const sec=6.2832/ns,b=((a+ph)%sec+sec)%sec-sec/2;return R0*(.92+.1*Math.cos(b*ns))*(1/Math.hypot(k,q/(.8+ar*.25)))}const sec=6.2832/ns,b=((a+ph)%sec+sec)%sec-sec/2;return R0*Math.cos(sec/2)/Math.cos(b)/Math.hypot(k,q/(.75+ar*.3))};
    const inside=(u,v,m)=>{const d=Math.hypot(u,v);return d<rad(Math.atan2(v,u))-(m||0)};
    const free=(x,y)=>!wet(x,y)&&occAt(x,y)!==2;t.ctrlStreets=[];t.camp={ax,shape};
    const lay=["cross","axis","ring","cross","grid"][(rng()*5)|0],sts=[];
    const addSt=(pts)=>{const ok=[];for(const q of pts){if(wet(q[0],q[1])){if(ok.length>3)break;ok.length=0;continue}ok.push(q)}if(ok.length>3){regSt(ok,ti,true);t.streets.push(ok);line(ok,3,1);for(const q of ok)roadG[cellOf(q[0],q[1])]=1;sts.push(ok)}};
    const lineUV=(a,b)=>{const pts=[],l=Math.hypot(b[0]-a[0],b[1]-a[1]);for(let f=0;f<=1.0001;f+=4/l)pts.push(Wp(lerp(a[0],b[0],f),lerp(a[1],b[1],f)));return pts};
    const span=(a)=>rad(a)+12;
    if(lay==="cross"||lay==="grid"){addSt(lineUV([-span(3.1416),0],[span(0),0]));addSt(lineUV([0,-span(-1.5708)],[0,span(1.5708)]))}
    if(lay==="axis"){addSt(lineUV([-span(3.1416),0],[span(0),0]))}
    if(lay==="grid"){for(const v of[-.5,.5]){const vv=v*R0*ar;addSt(lineUV([-R0*.9,vv],[R0*.9,vv]))}}
    if(lay==="ring"){addSt(lineUV([-span(3.1416),0],[span(0),0]));const pts=[];for(let k=0;k<=40;k++){const a=k/40*6.2832,r=rad(a)*.5;pts.push(Wp(Math.cos(a)*r,Math.sin(a)*r))}addSt(pts)}
    const onSt=(x,y,m)=>sts.some(z=>z.some(q=>Math.hypot(q[0]-x,q[1]-y)<m));
    // cerca seguindo o contorno, portoes onde as ruas cruzam
    if(t.wall!==false){const fz=CUL[t.race].fence,fence=fz==="stone"||fz==="hedge"?"palisade":fz,n=shape==="oval"||shape==="star"?28:24,pts=[];for(let k=0;k<n;k++){const a=k/n*6.2832,r=rad(a)+4;pts.push(Wp(Math.cos(a)*r,Math.sin(a)*r))}
      const segs=pts.map((a,k)=>{const b=pts[(k+1)%pts.length];let water=false,sea=false;for(let q=0;q<=6;q++){const x=lerp(a[0],b[0],q/6),y=lerp(a[1],b[1],q/6);if(sampleGrid(rdist,x,y)<12)water=true;if(sampleGrid(land,x,y)<.02)sea=true}const mx=(a[0]+b[0])/2,my=(a[1]+b[1])/2;return {a,b,gate:onSt(mx,my,9)&&!water&&!sea,water:water&&!sea,sea}});
      for(let k=0;k<segs.length;k++)if(segs[k].gate&&segs[(k+1)%segs.length].gate)segs[(k+1)%segs.length].gate=false;for(const z of segs)if(!z.sea&&!z.gate)line([z.a,z.b],3,2);walls.push({pts,segs,fence,race:t.race})}
    // comando no centro (ou junto ao cruzamento), fogueiras e areas especiais
    const cu=lay==="axis"?0:10,cv=lay==="axis"?-11:-10,cmd=Wp(cu,cv);if(free(cmd[0],cmd[1])){B.push({k:33,x:cmd[0],y:cmd[1],race:t.race,ti});disc(cmd[0],cmd[1],9,2,true)}
    const yards=[];if(rng()<.75)yards.push({u:-R0*.5*(rng()<.5?1:-1),v:R0*ar*.45*(rng()<.5?1:-1),r:R0*.24,kind:rng()<.5?"horses":"drill"});
    for(const z of yards){const q=Wp(z.u,z.v);B.push({k:37,x:q[0],y:q[1]-z.r*ar*TILT*.9,cx:q[0],cy:q[1],r:z.r,ar:1,ax,ti})}
    const dn=.78+t.dens*.22,stepU=7.6,stepV=7;
    for(let v=-R0;v<=R0;v+=stepV)for(let u=-R0*1.05;u<=R0*1.05;u+=stepU){const uu=u+((Math.round(v/stepV))%2?stepU/2:0);if(!inside(uu,v,6))continue;if(Math.hypot(uu-cu,v-cv)<12)continue;const q=Wp(uu+(rng()-.5)*1.2,v+(rng()-.5)*1);
      if(onSt(q[0],q[1],6.5))continue;const yd=yards.find(z=>Math.hypot(uu-z.u,v-z.v)<z.r);if(yd){if(yd.kind==="horses"&&rng()<.32&&free(q[0],q[1]))B.push({k:35,x:q[0],y:q[1],ti});else if(yd.kind==="drill"&&rng()<.22&&free(q[0],q[1]))B.push({k:36,x:q[0],y:q[1],ti});continue}
      if(rng()>dn||!free(q[0],q[1])||occAt(q[0],q[1]))continue;B.push({k:32,x:q[0],y:q[1],race:t.race,s:.92+rng()*.18,flag:rng()<.06,ti});disc(q[0],q[1],2.6,2,false)}
    for(let k=0;k<4+R0/12;k++){const a=rng()*6.28,r=rng()*R0*.7,u=Math.cos(a)*r,v=Math.sin(a)*r*ar,q=Wp(u,v);if(onSt(q[0],q[1],8)&&free(q[0],q[1]))B.push({k:34,x:q[0],y:q[1],ti})}
    if(t.wall!==false)for(let k=0;k<(shape==="rect"?4:5);k++){const a=shape==="rect"?ax0*0+[.6435,2.498,3.785,5.64][k]:k/5*6.2832+ph,r=rad(a)+6,q=Wp(Math.cos(a)*r,Math.sin(a)*r);if(free(q[0],q[1]))B.push({k:21,x:q[0],y:q[1],ti})}};
  towns.forEach((t,ti)=>{t.i=ti;const big=t.kind==="city";t.streets=[];if(t.kind==="camp"){buildCamp(t,ti);return}
    const inRoads=allSt.filter(z=>z.main&&z.pts.some(q=>t.inside(q[0],q[1],1.1)));
    // praca
    if(t.kind!=="village"){const pr=big?25:17,n=10,a0=rng()*6.28;t.plaza={x:t.x,y:t.y,pr,poly:Array.from({length:n},(_,i)=>{const a=a0+i/n*6.2832,r=pr*(.75+rng()*.4);return [t.x+Math.cos(a)*r,t.y+Math.sin(a)*r*.85]})};
      for(const q of t.plaza.poly)disc((q[0]+t.x)/2,(q[1]+t.y)/2,pr*.55,1,true);disc(t.x,t.y,pr*.6,1,true)}
    const mains=new Set();
    if(t.lockSt){for(const z of t.lockSt){if(!z||!z.c||z.c.length<2)continue;const pts=resample(chaikin(z.c,2),3),segs=[];let seg=[],ws=-1;
        for(let i=0;i<pts.length;i++){if(!wet(pts[i][0],pts[i][1])){if(ws>=0){if((i-ws)*3<=48&&seg.length){brAdd.push([seg[seg.length-1],pts[i]])}else{if(seg.length>1)segs.push(seg);seg=[]}ws=-1}seg.push(pts[i])}else if(ws<0)ws=i}
        if(seg.length>1)segs.push(seg);for(const g of segs){regSt(g,ti,!!z.m);t.streets.push(g);if(z.m)mains.add(g);line(g,z.m?3:2.8,1)}}}
    // pontes da cidade: limite pelo tamanho; a avenida passa pela ponte
    const rvIn=[];for(const rv of rivers)for(let i=2;i<rv.pts.length-2;i+=2){const q=rv.pts[i];if(t.inside(q[0],q[1],.8))rvIn.push([q,Math.atan2(rv.pts[i+1][1]-rv.pts[i-1][1],rv.pts[i+1][0]-rv.pts[i-1][0])])}
    if(rvIn.length&&!t.lockSt){const budget=t.kind==="village"?0:t.size>=26?2:1;let have=bridges.filter(b=>t.inside((b[0][0]+b[1][0])/2,(b[0][1]+b[1][1])/2,1.15)).length;rvIn.sort((a,b)=>Math.hypot(a[0][0]-t.x,a[0][1]-t.y)-Math.hypot(b[0][0]-t.x,b[0][1]-t.y));
      const done=bridges.map(b=>[(b[0][0]+b[1][0])/2,(b[0][1]+b[1][1])/2]);
      for(const [q,a] of rvIn){if(have>=budget)break;if(done.some(d=>Math.hypot(d[0]-q[0],d[1]-q[1])<t.rmax*.55))continue;const nx=-Math.sin(a),ny=Math.cos(a);let r1=4,r2=4;while(r1<40&&wet(q[0]+nx*r1,q[1]+ny*r1))r1+=2;while(r2<40&&wet(q[0]-nx*r2,q[1]-ny*r2))r2+=2;if(r1>=40||r2>=40)continue;
        const A=[q[0]-nx*(r2+3),q[1]-ny*(r2+3)],Bp=[q[0]+nx*(r1+3),q[1]+ny*(r1+3)];brAdd.push([A,Bp]);done.push(q);have++;
        const pts=[A,Bp];{const rp=resample(pts,3);regSt(rp,ti,true);t.streets.push(rp);mains.add(rp)}line(pts,3,1);
        for(const [P0,dir] of [[Bp,a+1.5708],[A,a-1.5708]]){const g=grow(t,P0[0],P0[1],dir,t.rmax*1.4,{straight:false,m:1.02});if(g.pts.length>2){regSt(g.pts,ti,true);t.streets.push(g.pts);mains.add(g.pts);line(g.pts,3,1)}}}}
    // avenida do porto: da praca ate a agua mais proxima
    if(!t.lockSt&&anyWater&&(t.kind!=="village"||rng()<.6)){let best=null;for(let k=0;k<36;k++){const a=k/36*6.2832,cx=Math.cos(a),cy=Math.sin(a);for(let r=8;r<t.rmax+70;r+=4){const x=t.x+cx*r,y=t.y+cy*r;if(sampleGrid(rdist,x,y)<14||occAt(x,y)===2)break;if(sampleGrid(land,x,y)<-.01){if(!best||r<best[0])best=[r,a];break}}}
      if(best){const [r,a]=best,pts=[];for(let q=6;q<r;q+=4){const x=t.x+Math.cos(a)*q,y=t.y+Math.sin(a)*q;if(sampleGrid(land,x,y)<.025)break;pts.push([x,y])}
        if(pts.length>3){const cv=(rng()-.5)*.5;for(let i=1;i<pts.length-1;i++){const f=Math.sin(i/(pts.length-1)*3.1416)*cv*6;pts[i]=[pts[i][0]-Math.sin(a)*f,pts[i][1]+Math.cos(a)*f]}regSt(pts,ti,true);t.streets.push(pts);mains.add(pts);line(pts,3,1);for(const q of pts)roadG[cellOf(q[0],q[1])]=1;t.harbor=a}}}
    // muralha no contorno, com portoes nas estradas e arcos no rio
    if(t.wall){const pts=[];t.outline.forEach((q,k)=>{if(k%2)return;const dx=q[0]-t.x,dy=q[1]-t.y,d=Math.hypot(dx,dy)||1;pts.push([q[0]+dx/d*8,q[1]+dy/d*8])});
      const segs=[];pts.forEach((a,k)=>{const b=pts[(k+1)%pts.length];let gate=false,water=false,sea=false;for(let q=0;q<=8;q++){const x=lerp(a[0],b[0],q/8),y=lerp(a[1],b[1],q/8);if(x>0&&y>0&&x<WX&&y<WY&&roadG[cellOf(x,y)])gate=true;if(sampleGrid(rdist,x,y)<12)water=true;if(sampleGrid(land,x,y)<.02)sea=true}segs.push({a,b,gate:gate&&!water&&!sea,water:water&&!sea,sea})});
      for(let k=0;k<segs.length;k++)if(segs[k].gate&&segs[(k+1)%segs.length].gate)segs[(k+1)%segs.length].gate=false;
      for(const z of segs)if(!z.sea)line([z.a,z.b],4,2);walls.push({pts,segs,fence:CUL[t.race].fence,race:t.race})}
    if(t.planned&&!t.lockSt&&t.kind!=="village"){let ax=rng()*3.14;const nr=nearSt(t.x,t.y,t.rmax,-1);if(nr)ax=tang(allSt[nr.s].pts,nr.i);
      t.axes=[];for(const a of[ax,ax+1.5708])for(const da of[0,3.1416]){const g=grow(t,t.x+Math.cos(a+da)*4,t.y+Math.sin(a+da)*4,a+da,t.rmax*1.3,{straight:true,through:true,m:1.02});if(g.pts.length>3){g.pts.unshift([t.x,t.y]);t.axes.push(g.pts)}}
      for(const g of t.axes){regSt(g,ti,true);t.streets.push(g);mains.add(g);line(g,3,1)}}
    // castelo e igreja
    if(big){for(const [RW,RH,MS] of[[74,58,1.4],[60,46,1.12],[50,38,.9]]){let bd=null,be=-1;for(let k=0;k<70;k++){const a=rng()*6.2832,r=(.25+rng()*.4),x=t.x+Math.cos(a)*t.rmax*r,y=t.y+Math.sin(a)*t.rmax*r;if(!t.inside(x,y,.72)||!t.inside(x,y-RH*.8,.8)||wet(x,y)||wet(x,y-RH*.7))continue;let free=true;for(const q of rectPts(x,y-RH*.35,0,RW,RH,6))if(occAt(q[0],q[1])===1||wet(q[0],q[1])){free=false;break}if(!free)continue;const e=sampleGrid(elev,x,y)+rng()*.02;if(e>be){be=e;bd=[x,y]}}
      if(bd){t.castle=bd;takeRect(bd[0],bd[1]-RH*.37,0,RW+2,RH,2);B.push({k:3,cv:(P.gv==null?67:P.gv)>=67?2:undefined,x:bd[0],y:bd[1],ti,ang:Math.atan2(-(t.x-bd[0]),t.y-bd[1])-.34,race:t.race,cold:snowAt(bd[0],bd[1])>.5,v:rng(),sz:1,ms:MS});break}}}
    if(t.kind!=="village"||t.size>8){const cm=big?1.3:1,L=26*cm,D=12*cm;for(let k=0;k<24;k++){const a=rng()*6.2832,r=(t.plaza?20:8)+rng()*14,x=t.x+Math.cos(a)*r,y=t.y+Math.sin(a)*r;if(freeRect(x,y-4,0,L,D,0)){takeRect(x,y-4,0,L,D+6);B.push({k:2,ti,x:x+L*.18,y:y+D*.32,big,race:t.race,cold:snowAt(x,y)>.5,v:rng(),sz:.9+rng()*.22});break}}}
    // ruas secundarias: nascem das principais, curvam, acompanham o relevo e se fundem ao encontrar outra rua
    const planned=t.planned,maxDepth=planned?3:big?3:t.kind==="town"?2:1,cap=Math.round((big?30:t.kind==="town"?12:4)*(.62+t.dens*.5)*(planned?1.5:1)),sp0=lerp(64,52,t.dens)*(t.kind==="village"?1.5:t.planned?.66:1);
    let queue=t.lockSt?[]:t.axes&&t.axes.length?t.axes.map(p=>({pts:p,d:0})):inRoads.map(z=>({pts:z.pts,d:0})).concat(t.streets.map(p=>({pts:p,d:0})));
    if(!t.lockSt&&!queue.length||(queue.length<2&&t.kind!=="village")){const a=rng()*6.2832;for(const da of[0,3.1416]){const g=grow(t,t.x,t.y,a+da,t.rmax*1.2,{straight:planned,m:1.02});if(g.pts.length>3){regSt(g.pts,ti,true);t.streets.push(g.pts);mains.add(g.pts);line(g.pts,3,1);queue.push({pts:g.pts,d:0})}}}
    if(!t.lockSt&&!planned&&(t.wall||big)){const ring=[];for(let k=0;k<=t.rs.length*2;k++){const a=k/(t.rs.length*2)*6.2832,ii=k%t.rs.length,r=t.rs[(k>>1)%t.rs.length]*.84;ring.push([t.x+Math.cos(a)*r,t.y+Math.sin(a)*r])}
      let cur=[];const flush=()=>{if(cur.length>6){const pts=resample(cur,4);regSt(pts,ti,false);t.streets.push(pts);line(pts,3,1);queue.push({pts,d:1})}cur=[]};
      for(const q of resample(ring,4)){if(wet(q[0],q[1])||occAt(q[0],q[1])===2)flush();else cur.push(q)}flush()}
    let made=0;
    while(queue.length&&made<cap){const z=queue.shift();if(z.d>=maxDepth)continue;const pts=z.pts;let acc=rng()*sp0*.6;
      for(let i=1;i<pts.length-1&&made<cap;i++){acc+=Math.hypot(pts[i][0]-pts[i-1][0],pts[i][1]-pts[i-1][1]);if(acc<sp0)continue;const p=pts[i];if(!t.inside(p[0],p[1],.95)){acc=0;continue}acc=planned?(sd0=>0)():-rng()*sp0*.5;
        const ta=tang(pts,i),core=t.rel(p[0],p[1])<(planned?.12:.35);
        for(const sd of[-1,1]){if(rng()<(planned?.04:.35))continue;const jit=planned&&!core?0:(rng()-.5)*.9,g=grow(t,p[0]+Math.cos(ta+sd*1.5708)*3,p[1]+Math.sin(ta+sd*1.5708)*3,ta+sd*1.5708+jit,(planned?1.6:.5+rng()*.8)*t.rmax,{straight:planned&&!core,m:.98});
          if(g.pts.length>(g.join?3:5)){g.pts.unshift([p[0],p[1]]);regSt(g.pts,ti,false);t.streets.push(g.pts);line(g.pts,2.2,1);queue.push({pts:g.pts,d:z.d+1});made++}}}}
    // casas de frente para as ruas
    for(const z of allSt){if(z.ti!==ti&&!(z.ti===-1&&z.pts.some(q=>t.inside(q[0],q[1],1.6))))continue;lineFront(t,z.pts,z.main?4.2:3.2,1)}
    if(t.kind!=="village")for(const z of allSt)if(z.ti===-1&&z.pts.some(q=>t.inside(q[0],q[1],1.6)))lineFront(t,z.pts,4.2,1.65,true);
    // miolo das quadras: primeiro casas (do tamanho que couber), depois hortas, poucas arvores
    {const st=5,spots=[];let wells=0;const wmax=Math.max(1,Math.round(t.size/9)),vil=t.kind==="village";
      for(let y=t.y-t.rmax;y<=t.y+t.rmax;y+=st)for(let x=t.x-t.rmax;x<=t.x+t.rmax;x+=st){const px=x+(rng()-.5)*3,py=y+(rng()-.5)*3;if(t.inside(px,py,1)&&!wet(px,py))spots.push([px,py])}
      for(let i=spots.length-1;i>0;i--){const j=(rng()*(i+1))|0,tmp=spots[i];spots[i]=spots[j];spots[j]=tmp}
      const ang=(px,py)=>{const n=nearSt(px,py,30,-1);return n?[tang(allSt[n.s].pts,n.i),Math.hypot(n.q[0]-px,n.q[1]-py)]:[rng()*3.14,99]};
      const pH=vil?.05+.3*t.dens:.06+.92*t.dens;
      for(const [px,py] of spots){if(occAt(px,py)||rng()>pH)continue;const [a,d]=ang(px,py),aa=a+(rng()<.65?0:1.5708);
        if(vil){house(t,px,py,aa,rng()<.5?"hut":"shed");continue}
        house(t,px,py,aa,typeFor(t,px,py))||house(t,px,py,aa,"row")||house(t,px,py,aa+1.5708,"row")||house(t,px,py,aa,"hut")||house(t,px,py,aa,"shed")}
      if(!vil&&t.dens>.2)for(const [px,py] of spots){if(occAt(px,py)||rng()>(t.dens-.2)*1.6)continue;const [a]=ang(px,py);for(const aa of[a,a+1.5708])if(house(t,px,py,aa,typeFor(t,px,py))||house(t,px,py,aa,"row")||house(t,px,py,aa,"hut")||house(t,px,py,aa,"shed"))break}
      if(t.dens>.5){const fine=[];for(let y=t.y-t.rmax;y<=t.y+t.rmax;y+=3.2)for(let x=t.x-t.rmax;x<=t.x+t.rmax;x+=3.2){if(t.inside(x,y,.97)&&!wet(x,y)&&!occAt(x,y))fine.push([x,y])}
        for(const [px,py] of fine){if(occAt(px,py)||rng()>(t.dens-.5)*2.2)continue;const [a]=ang(px,py);for(const aa of[a,a+1.5708])if(house(t,px,py,aa,vil?"hut":"row")||house(t,px,py,aa,"hut")||house(t,px,py,aa,"shed"))break}}
      for(const [px,py] of spots){if(occAt(px,py))continue;const [a,d]=ang(px,py),r=rng();
        if(d<9&&wells<wmax&&r<.08){B.push({k:7,ti,x:px,y:py});disc(px,py,3,2,false);wells++}
        else if(r<(vil?.3:.42*(1.25-t.dens))){const w=7+rng()*6,h=5+rng()*4;if(freeRect(px,py,a,w,h,0)){takeRect(px,py,a,w,h,3);gardens.push({x:px,y:py,a,w,h,col:pick(["#8f9a4a","#a59a55","#7f8f43","#b59a62"])})}}
        else if(r<(vil?.62:.5))extra.push([px,py,.4+rng()*.12]);
        else if(r<(vil?.8:.6))extra.push([px,py,.55+rng()*.3,"b"])}}
    if(t.plaza){const pr=t.plaza.pr||12,sty=pick(big?["feira","fonte","monumento","cruz"]:["feira","fonte","cruz"]);t.plaza.style=sty;const A_=(id,x,y,ang)=>B.push({k:40,ti,id,x,y,race:t.race,vv:rng(),ang:ang||0}),st_=(x,y,ang)=>B.push({k:6,ti,x,y,race:t.race,ang});
      const ax=rng()*3.14,ca=Math.cos(ax),sn=Math.sin(ax),PP=(u,v)=>[t.x+ca*u-sn*v,t.y+(sn*u+ca*v)*.85];
      if(sty==="feira"){for(const v of(big?[-7,-2.4,2.4,7]:[-2.6,2.6]))for(let u=-pr*.62;u<=pr*.62;u+=4.4){if(rng()<.12)continue;const q=PP(u,v);st_(q[0],q[1],ax+(v>0?3.1416:0))}const q=PP(pr*.82,0);A_("cart",q[0],q[1],ax);const w=PP(-pr*.8,big?0:5);B.push({k:7,ti,x:w[0],y:w[1]})}
      else if(sty==="fonte"){A_("fountain",t.x,t.y,0);const n=big?8:6;for(let k=0;k<n;k++){const a=k/n*6.283+.3,q=[t.x+Math.cos(a)*pr*.66,t.y+Math.sin(a)*pr*.66*.85];st_(q[0],q[1],a+1.5708)}}
      else if(sty==="monumento"){A_(pick(["statue","obelisk"]),t.x,t.y,0);for(const sd of[-1,1])for(let u=6;u<pr*.75;u+=4.4)for(const v of[-2.4,2.4]){const q=PP(u*sd,v);st_(q[0],q[1],ax+(v>0?3.1416:0))}const l=PP(0,pr*.6);A_("lamp",l[0],l[1],0)}
      else{A_("marketcross",t.x,t.y,0);const n=big?9:6;for(let k=0;k<n;k++){const a=ax+k/n*4.2,q=[t.x+Math.cos(a)*pr*.6,t.y+Math.sin(a)*pr*.6*.85];st_(q[0],q[1],a+1.5708)}const w=PP(-pr*.55,-pr*.35);B.push({k:7,ti,x:w[0],y:w[1]})}
      const cr=PP(pr*.5,-pr*.5);A_(pick(["crates","goods"]),cr[0],cr[1],ax)}
    t.ctrlStreets=t.lockSt||t.streets.filter(z=>z.length>1).map(z=>({c:simp(z,2.2),m:mains.has(z)?1:0}));
    if(!t.wall&&rng()<.7){for(let k=0;k<14;k++){const a=rng()*6.28,r=t.rmax+24+rng()*40,x=t.x+Math.cos(a)*r,y=t.y+Math.sin(a)*r;if(sampleGrid(elev,x,y)>sampleGrid(elev,t.x,t.y)+.02&&!occAt(x,y)&&!wet(x,y)&&sampleGrid(dist,x,y)>24){disc(x,y,9,2,false);B.push({k:8,ti,x,y,rot:rng()*1.57});break}}}});
  // portos: pieres no fim das ruas que chegam a agua
  const piers=[];
  if(anyWater){for(const t of towns){const max=t.kind==="village"?1:t.kind==="town"?2:4;let n=0;const ends=[];
      for(const z of allSt){if(z.ti!==t.i&&!(z.ti===-1&&z.pts.some(q=>t.inside(q[0],q[1],1.3))))continue;for(const e of[0,z.pts.length-1]){const q=z.pts[e],a=tang(z.pts,e)+(e?0:3.1416);if(t.rel(q[0],q[1])>1.9)continue;ends.push([q,a])}}
      for(const [q,a] of ends){if(n>=max)break;const cx=Math.cos(a),cy=Math.sin(a);let r=0;while(r<22&&sampleGrid(land,q[0]+cx*r,q[1]+cy*r)>-.01)r+=2;if(r>=22||sampleGrid(rdist,q[0]+cx*r,q[1]+cy*r)<14)continue;
        if(piers.some(p=>Math.hypot(p[0][0]-q[0],p[0][1]-q[1])<18))continue;const L=16+rng()*12,e=[q[0]+cx*(r+L),q[1]+cy*(r+L)];if(sampleGrid(land,e[0],e[1])>-.04)continue;
        piers.push([[q[0]+cx*(r-6),q[1]+cy*(r-6)],e]);n++;for(let k=0;k<2;k++){const o=(rng()<.5?-1:1)*(7+rng()*5),bx=e[0]-cy*o-cx*rng()*8,by=e[1]+cx*o-cy*rng()*8;if(sampleGrid(land,bx,by)<-.06)B.push({k:13,x:bx,y:by,big:rng()<.4&&t.kind!=="village",flip:rng()<.5})}}}
    for(let i=0;i<6;i++){const x=40+rng()*(WX-80),y=60+rng()*(WY-200);if(sampleGrid(land,x,y)<-.3)B.push({k:13,x,y,big:rng()<.5,flip:rng()<.5})}}
  for(const b of brAdd)bridges.push(b);
  const ponds=[],poi=P.poi==null?.5:P.poi,vmask=new Float32Array(N),mmask=new Float32Array(N),lava=[],volc=[];
  const cellsAround=(x,y,R,f)=>{const i0=Math.max(1,((x-R)/G)|0),i1=Math.min(GW-2,((x+R)/G|0)+1),j0=Math.max(1,((y-R)/G)|0),j1=Math.min(GH-2,((y+R)/G|0)+1);for(let j=j0;j<=j1;j++)for(let i=i0;i<=i1;i++)f(j*GW+i,i*G,j*G)};
  const addVolcano=(x,y,r)=>{const ph=rng()*9;cellsAround(x,y,r*1.3,(k,cx,cy)=>{const a=Math.atan2(cy-y,cx-x),d=Math.hypot(cx-x,cy-y)/(r*(.9+.2*fbm(Math.cos(a)*1.4+ph,Math.sin(a)*1.4+ph,2)));if(d>1.3)return;let cone=d<1?Math.pow(1-d,1.55)*.66*(1+.09*Math.sin(a*11+ph*3)*sstep(.15,.5,d)):0;if(d<.15)cone-=(.15-d)*1.7;elev[k]=clamp(elev[k]+cone,0,1);vmask[k]=Math.max(vmask[k],sstep(1.25,.7,d));forest[k]*=1-vmask[k]});
    volc.push({x,y,r});B.push({k:15,x,y,r,w:r});disc(x,y,r*1.15,2,true);
    const nl=2+((rng()*3)|0);for(let n=0;n<nl;n++){let a=1.5708+(n/(nl-1||1)-.5)*2.4+(rng()-.5)*.4,px=x+Math.cos(a)*r*.17,py=y+Math.sin(a)*r*.17;const pts=[[px,py]];for(let s=0;s<70;s++){let best=null,be=1e9;for(let da=-.9;da<=.9;da+=.3){const qa=a+da,qx=px+Math.cos(qa)*4,qy=py+Math.sin(qa)*4,e=sampleGrid(elev,qx,qy)+(rng()-.5)*.004;if(e<be){be=e;best=[qx,qy,qa]}}if(!best)break;px=best[0];py=best[1];a=best[2];pts.push([px,py]);if(Math.hypot(px-x,py-y)>r*(.9+rng()*.35))break}lava.push(pts)}};
  const addMesa=(x,y,r,h)=>{const ph=rng()*9,e0=sampleGrid(elev,x,y);cellsAround(x,y,r*1.4,(k,cx,cy)=>{const a=Math.atan2(cy-y,cx-x),rr=r*(.72+.5*fbm(Math.cos(a)*1.6+ph,Math.sin(a)*1.6+ph,3)),d=Math.hypot(cx-x,(cy-y)*1.15)/rr;if(d>1.3)return;const top=h*sstep(1.04,.9,d);elev[k]=Math.max(elev[k],e0+top);mmask[k]=Math.max(mmask[k],sstep(1.18,.95,d));forest[k]*=1-mmask[k]});disc(x,y,r,2,true)};
  {const lm=[];const free=(x,y,r)=>{for(let a=0;a<6.28;a+=.8)if(occAt(x+Math.cos(a)*r,y+Math.sin(a)*r)||sampleGrid(land,x+Math.cos(a)*r,y+Math.sin(a)*r)<.05||sampleGrid(rdist,x+Math.cos(a)*r,y+Math.sin(a)*r)<16)return false;return !towns.some(t=>t.rel(x,y)<1.5)&&!lm.some(q=>Math.hypot(q.x-x,q.y-y)<r+q.r+10)};
    const tries=Math.round(900*SC*SC*(.4+poi*1.2));
    for(let q=0;q<tries;q++){const x=100+rng()*(WX-200),y=150+rng()*(WY-340),b=bAt(x,y),r=rng();let o=null;
      if((b===4||b===5&&r<.4||b===8&&r<.3)&&rng()<.03&&lm.filter(z=>z.k===14).length<6*SC*SC){const w=22+rng()*30;if(free(x,y,w*1.25)){addMesa(x,y,w,.1+rng()*.12);lm.push({k:14,x,y,r:w*1.2});continue}}
      else if(b===8&&rng()<.012&&volc.length<Math.max(1,SC*1.5)){const w=54+rng()*30;if(free(x,y,w*1.2)){addVolcano(x,y,w);lm.push({k:15,x,y,r:w*1.2});continue}}
      else if((b===4||b===5||b===8||b===3)&&rng()<.012*poi){const col=b===3?["#b9b3a2","#77705f","#d6d0c0"]:b===8?["#86705e","#54443a","#a08a74"]:["#c9a06c","#8c6a44","#e0c494"];if(free(x,y,14))o={k:rng()<.35?26:27,x,y,r:14,col}}
      else if(rng()<.01*poi){if(free(x,y,14))o={k:28,x,y,r:14,st:(rng()*12)|0}}
      else if(rng()<.0045){if(free(x,y,12))o={k:16,x,y,r:12}}
      else if((b===0||b===1||b===3)&&rng()<.003){if(free(x,y,12))o={k:17,x,y,r:12}}
      else if(rng()<.03*poi&&sampleGrid(slope,x,y)>.035&&sampleGrid(elev,x,y-10)>sampleGrid(elev,x,y+10)+.02&&b!==6&&lm.filter(z=>z.k===20).length<4*SC*SC){if(free(x,y,9))o={k:20,x,y,r:9,snow:sampleGrid(snow,x,y)>.5}}
      else if(rng()<.012*poi&&sampleGrid(elev,x,y)>.22&&sampleGrid(slope,x,y)<.05&&lm.filter(z=>z.k===21).length<3*SC*SC){if(free(x,y,8))o={k:21,x,y,r:8}}
      else if(rng()<.012*poi&&sampleGrid(forest,x,y)>.1&&sampleGrid(forest,x,y)<.6&&lm.filter(z=>z.k===22).length<3*SC*SC){if(free(x,y,12))o={k:22,x,y,r:12,race:pick(["humano","orc","mongol"])}}
      else if(rng()<.01*poi&&sampleGrid(elev,x,y)>.25&&b!==4&&lm.filter(z=>z.k===25).length<2*SC*SC){if(free(x,y,10))o={k:25,x,y,r:10}}
      else if(rng()<.012*poi&&sampleGrid(slope,x,y)<.04&&(b===0||b===1||b===7||b===3)&&sampleGrid(dist,x,y)>24&&ponds.length<4*SC*SC){const w=14+rng()*16;if(free(x,y,w+6)){ponds.push({x,y,w,h:w*(.55+rng()*.3),a:rng()*3.14});disc(x,y,w,2,false);continue}}
      if(o&&lm.some(q=>q.k===o.k&&Math.hypot(q.x-o.x,q.y-o.y)<260))o=null;
      if(o){lm.push(o);disc(x,y,o.r*.8,2,false);B.push(o)}}}
  for(const m of P.objs||[]){if(!m||m.x==null)continue;const x=m.x,y=m.y,s=m.s||1;if(sampleGrid(land,x,y)<.02&&m.v!=="pond")continue;
    if(m.v==="volcano")addVolcano(x,y,58*s);else if(m.v==="mesa")addMesa(x,y,26*s,.12*s);else if(m.v==="pond"){ponds.push({x,y,w:16*s,h:16*s*.65,a:0});disc(x,y,16*s,2,true)}}
  for(let j=1;j<GH-1;j++)for(let i=1;i<GW-1;i++){const k=j*GW+i;slope[k]=Math.hypot(elev[k+1]-elev[k-1],elev[k+GW]-elev[k-GW])}
  // variacoes das casas como na cidade (cor de cada casa, materiais pela riqueza, flores e hera) e coisas proprias das culturas; usa um sorteio separado
  if(P.rvar!==false){const rv=mulberry((seed^0x6b1d)>>>0),VKr=(T,k,amt)=>{const base=T[k];if(!base||!Array.isArray(base)||typeof base[0]!=="string"||base[0][0]!=="#")return k;const v=(rv()*5)|0;if(v===2)return k;const key=k+"~r"+v;if(!T[key])T[key]=base.map(c_=>{if(typeof c_!=="string"||c_[0]!=="#"||c_.length!==7)return c_;const f=(v-2)*amt,n=parseInt(c_.slice(1),16),ch=sh=>{let x=(n>>sh)&255;x=f<0?x*(1+f):x+(255-x)*f;return Math.max(0,Math.min(255,Math.round(x)))};return "#"+((1<<24)|(ch(16)<<16)|(ch(8)<<8)|ch(0)).toString(16).slice(1)});return key};
    for(const b of B){if(b.k!==1)continue;const t=towns[b.ti],rc=t&&t.race||"humano",poor=b.type==="hut"||b.type==="farm"||b.type==="barn",rich=b.type==="rich"||b.type==="manor";
      if(b.form==="gable"||b.form==="long"){if(poor&&P.season!=="inverno"&&rv()<.45)b.roof=rc==="vapor"?"rust":rc==="pirata"?"patch":rv()<.6?"thatch":"old";else if(rich&&rv()<.4&&!["vapor","pirata"].includes(rc))b.roof=rv()<.5?"slate":"tile";
        if(!poor&&rv()<.18)b.flowers=1;if(rv()<.1)b.ivy=.5+rv()*.4}
      b.roof=typeof b.roof==="string"?VKr(ROOF,b.roof,.07):b.roof;b.wall=typeof b.wall==="string"?VKr(WALL,b.wall,.05):b.wall}
    const put=(t,id,r)=>{for(let k=0;k<30;k++){const a=rv()*6.28,d=t.rmax*(.85+rv()*.45),x=t.x+Math.cos(a)*d,y=t.y+Math.sin(a)*d;let f=true;for(let q=0;q<6.28;q+=.8)if(occAt(x+Math.cos(q)*r,y+Math.sin(q)*r*.7)||wet(x+Math.cos(q)*r,y+Math.sin(q)*r*.7))f=false;if(!f)continue;disc(x,y,r,2,false);B.push({k:40,x,y,id,race:t.race,vv:rv(),ang:rv()*6.28,r});return true}return false};
    {const reg=P.culture,pool=reg==="industrial"?["vapor","vapor","cog"]:reg==="piratas"?["pirata","pirata","galeao","caravela"]:reg==="leste"?["junco","junco","cog"]:reg==="sul"||reg==="antigo"?["dhow","dhow","caravela"]:reg==="eslava"||reg==="celta"?["drakkar","cog","cog"]:reg==="fantasia"?["galeao","pirata","caravela","cog"]:["cog","caravela","galeao","cog"];for(const b of B)if(b.k===13)b.ty=pool[(rv()*pool.length)|0]}
    for(const t of towns){if(t.race==="vapor"){const n=t.rmax>60?3:t.rmax>35?2:1;put(t,"factory",14);for(let k=1;k<n;k++)put(t,rv()<.5?"smokestack":"gasometer",8);if(rv()<.5)put(t,"scrap",6)}
      if(t.race==="pirata"){put(t,"jollyroger",4);if(rv()<.7)put(t,"hullhouse",8);if(rv()<.5)put(t,"cannon",4);if(t.rmax>40)put(t,"crowsnest",5)}}}
  for(const t of towns){if(rng()<.35+poi*.5){for(let k=0;k<24;k++){const a=rng()*6.28,r=t.rmax*(1.15+rng()*.35),x=t.x+Math.cos(a)*r,y=t.y+Math.sin(a)*r;let f=true;for(let q=0;q<6.28;q+=.8)if(occAt(x+Math.cos(q)*9,y+Math.sin(q)*7)||wet(x+Math.cos(q)*9,y+Math.sin(q)*7))f=false;if(f&&!B.some(q=>q.k===23&&Math.hypot(q.x-x,q.y-y)<200)){disc(x,y,9,2,false);B.push({k:23,x,y,race:t.race});break}}}
    if(rng()<poi*.6){const z=allSt.filter(z=>z.ti===-1);if(z.length){const zz=pick(z),q=zz.pts[(rng()*zz.pts.length)|0],a=rng()*6.28,x=q[0]+Math.cos(a)*9,y=q[1]+Math.sin(a)*9;if(!occAt(x,y)&&!wet(x,y)&&!B.some(q=>q.k===24&&Math.hypot(q.x-x,q.y-y)<160)&&!towns.some(o=>o.rel(x,y)<1.2)){disc(x,y,4,2,false);B.push({k:24,x,y,race:t.race})}}}}
  for(const t of towns){const C=CUL[t.race];if((t.race==="orc"||t.race==="tribal"||t.race==="mongol")&&t.plaza){B.push({k:18,ti:t.i,x:t.x-6,y:t.y+2})}if(t.race==="japones"){for(let k=0;k<20;k++){const a=rng()*6.28,x=t.x+Math.cos(a)*t.rmax*1.1,y=t.y+Math.sin(a)*t.rmax*1.1;if(!occAt(x,y)&&sampleGrid(land,x,y)>.05&&sampleGrid(rdist,x,y)>16&&!B.some(q=>q.k===19&&Math.hypot(q.x-x,q.y-y)<200)){disc(x,y,6,2,false);B.push({k:19,x,y});break}}}}
  // sitios: casa e celeiro perto das estradas, fora das vilas; os campos nascem em volta deles
  const farms=[];
  if(P.fields>0)for(const t of towns){const fb=bAt(t.x,t.y);if(fb===2||fb===8||fb>=11&&fb<=14||fb===16||(fb===4&&sampleGrid(rdist,t.x,t.y)>90))continue;const want=Math.round(P.fields*(1+t.size/9)*(CUL[t.race].fields||1));let n=0;
    for(let q=0;q<160&&n<want;q++){const z=pick(allSt);if(z.ti!==-1)continue;const i=(rng()*z.pts.length)|0,p=z.pts[i],rl=t.rel(p[0],p[1]);if(rl<1.35||rl>2.6)continue;if(farms.some(f=>Math.hypot(f[0]-p[0],f[1]-p[1])<55))continue;if(towns.some(o=>o!==t&&o.rel(p[0],p[1])<1.4))continue;
      const a=tang(z.pts,i),sd=rng()<.5?-1:1,nx=-Math.sin(a)*sd,ny=Math.cos(a)*sd;const tf={i:-1,race:t.race};if(!front(tf,p[0],p[1],a,sd,"farm",4.2))continue;
      const bx=p[0]+nx*24+Math.cos(a)*(rng()<.5?-12:12),by=p[1]+ny*24+Math.sin(a)*(rng()<.5?-12:12);house(tf,bx,by,a+(rng()<.5?0:1.5708),rng()<.6?"barn":"shed");extra.push([p[0]+nx*14-Math.cos(a)*14,p[1]+ny*14-Math.sin(a)*14,.6]);farms.push([p[0]+nx*16,p[1]+ny*16]);n++}}
  // campos: lotes poligonais que dividem divisas, como um mosaico
  let nextId=10;
  const FAMS=[["#dcc980","#d2bc6b","#e3d595","#cdb765"],["#c6cc78","#b3c066","#d0d285","#bcc46e"],["#c9b37a","#bd9d68","#d8c48a","#b08f5a"]];
  const ok=(x,y)=>{if(x<4||y<4||x>WX-4||y>WY-4||occAt(x,y))return false;{const b=bAt(x,y);if(b===2||b===8||b===3&&rng()<.5||(b===4&&sampleGrid(rdist,x,y)>70))return false}return sampleGrid(dist,x,y)>15&&sampleGrid(forest,x,y)<.6&&sampleGrid(slope,x,y)<.032};
  if(P.fields>0){const seeds=[];
    for(const t of towns){const want=Math.round(P.fields*(14+t.size*1.5)),ext=50+t.size*2.6,ba=rng()*3.14;
      for(let q=0,n=0;q<want*16&&n<want;q++){const a=rng()*6.2832,r0=t.rmax*(t.rel(t.x+Math.cos(a)*t.rmax,t.y+Math.sin(a)*t.rmax)>0?1/t.rel(t.x+Math.cos(a)*t.rmax,t.y+Math.sin(a)*t.rmax):1),r=r0*1.08+6+Math.sqrt(rng())*ext,x=t.x+Math.cos(a)*r,y=t.y+Math.sin(a)*r;if(!ok(x,y))continue;const sz=15+rng()*16;if(seeds.some(z=>Math.hypot(z.x-x,z.y-y)<(z.sz+sz)*.6))continue;seeds.push({x,y,sz,ba,fam:pick(FAMS)});n++}}
    for(const f of farms){const ba=rng()*3.14,fam=pick(FAMS);for(let q=0,n=0;q<60&&n<6;q++){const a=rng()*6.2832,r=14+Math.sqrt(rng())*62,x=f[0]+Math.cos(a)*r,y=f[1]+Math.sin(a)*r;if(!ok(x,y))continue;const sz=15+rng()*14;if(seeds.some(z=>Math.hypot(z.x-x,z.y-y)<(z.sz+sz)*.6))continue;seeds.push({x,y,sz,ba,fam});n++}}
    for(const z of seeds){let poly=[];const n=14,a0=rng()*6.28;
      for(let i=0;i<n;i++){const a=a0+i/n*6.2832,cx=Math.cos(a),cy=Math.sin(a),rm=z.sz*(1.3+rng()*.5);let r=3;while(r<rm&&ok(z.x+cx*(r+3),z.y+cy*(r+3)))r+=3;poly.push([z.x+cx*r,z.y+cy*r])}
      for(const o of seeds){if(o===z)continue;const dx=o.x-z.x,dy=o.y-z.y,d=Math.hypot(dx,dy);if(d>95)continue;const nx=dx/d,ny=dy/d,lim=d/2-1.4,out=[];
        for(let i=0;i<poly.length;i++){const p=poly[i],q=poly[(i+1)%poly.length],dp=(p[0]-z.x)*nx+(p[1]-z.y)*ny-lim,dq=(q[0]-z.x)*nx+(q[1]-z.y)*ny-lim;if(dp<=0)out.push(p);if((dp<0)!==(dq<0)&&dp!==dq){const u=dp/(dp-dq);out.push([p[0]+(q[0]-p[0])*u,p[1]+(q[1]-p[1])*u])}}
        poly=out;if(poly.length<3)break}
      if(poly.length<3)continue;let ar=0;for(let i=0;i<poly.length;i++){const p=poly[i],q=poly[(i+1)%poly.length];ar+=p[0]*q[1]-q[0]*p[1]}if(Math.abs(ar)/2<190)continue;
      const r=rng(),kind=r<.42?"crop":r<.72?"strips":r<.9?"pasture":"orchard",id=nextId++;
      const fp={poly,kind,cx:z.x,cy:z.y,ang:z.ba+(rng()<.35?1.5708:0)+(rng()-.5)*.25,gap:5.5+rng()*4,col:kind==="pasture"?pick(["#a9b05c","#b4b968","#9faa55"]):kind==="orchard"?"#a3ad58":pick(z.fam),col2:pick(pick(FAMS))};fieldsP.push(fp);if(P.bio2){const bb=bAt(z.x,z.y);if(bb>=4){const g=BG[bb][1],mh=(c,t)=>{const q=hexc(c);return "#"+q.map((v,i)=>Math.round(v+(g[i]-v)*t).toString(16).padStart(2,"0")).join("")};fp.col=mh(fp.col,bb>=15?.45:.32);fp.col2=mh(fp.col2,bb>=15?.45:.32)}}
      let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9;for(const p of poly){x0=Math.min(x0,p[0]);y0=Math.min(y0,p[1]);x1=Math.max(x1,p[0]);y1=Math.max(y1,p[1])}
      for(let y=y0;y<=y1;y+=O)for(let x=x0;x<=x1;x+=O)if(inPoly(poly,x,y))disc(x,y,2.5,id,false);
      {const cells=[];let me=0;for(let j=Math.max(0,((y0-G)/G)|0);j<=Math.min(GH-1,((y1+G)/G|0)+1);j++)for(let i=Math.max(0,((x0-G)/G)|0);i<=Math.min(GW-1,((x1+G)/G|0)+1);i++){const k=j*GW+i;const inside=inPoly(poly,i*G,j*G),near=inside||dsegPoly(poly,i*G,j*G)<G*1.5;if(near){cells.push([k,inside]);me+=elev[k]}}if(cells.length){me/=cells.length;for(const [k,inside] of cells)elev[k]=lerp(elev[k],me,inside?.82:.4)}}
      if(kind==="orchard"){const ca=Math.cos(fp.ang),sa=Math.sin(fp.ang);for(let u=-60;u<=60;u+=8)for(let v=-60;v<=60;v+=8){const x=z.x+ca*u-sa*v,y=z.y+sa*u+ca*v;if(inPoly(poly,x,y)&&dsegPoly(poly,x,y)>3)extra.push([x,y,.5])}}
      else if(rng()<.3){const e=(rng()*poly.length)|0,a=poly[e],b=poly[(e+1)%poly.length],l=Math.hypot(b[0]-a[0],b[1]-a[1]);for(let q=3;q<l;q+=6.5){const x=lerp(a[0],b[0],q/l),y=lerp(a[1],b[1],q/l);if(!wet(x,y)&&sampleGrid(rdist,x,y)>17)extra.push([x,y,.5])}}}}
  const brs=[];for(const b of bridges){if(towns.some(t=>t.kind!=="village"&&t.inside((b[0][0]+b[1][0])/2,(b[0][1]+b[1][1])/2,1.15))&&!brAdd.includes(b)&&brs.some(o=>towns.some(t=>t.inside(o.mx,o.my,1.2)&&t.inside((b[0][0]+b[1][0])/2,(b[0][1]+b[1][1])/2,1.2))))continue;const mx=(b[0][0]+b[1][0])/2,my=(b[0][1]+b[1][1])/2;if(brs.some(o=>Math.hypot(o.mx-mx,o.my-my)<34))continue;b.mx=mx;b.my=my;b.stone=towns.some(t=>t.kind!=="village"&&Math.hypot(t.x-mx,t.y-my)<t.core*1.7)||rng()<.3;brs.push(b)}
  // resolucao final: castelo > templo > pontos de interesse > objetos da praca > casas
  {const obbR=(x,y,a,L,D)=>{const c=Math.cos(a),s2=Math.sin(a),l=L/2,d=D/2;return [[x+c*l-s2*d,y+s2*l+c*d],[x-c*l-s2*d,y-s2*l+c*d],[x-c*l+s2*d,y-s2*l-c*d],[x+c*l+s2*d,y+s2*l-c*d]]},
    satN=(A,Bp)=>{for(const P_ of[A,Bp])for(let i=0;i<4;i++){const a=P_[i],b=P_[(i+1)%4];let nx=b[1]-a[1],ny=a[0]-b[0];const l=Math.hypot(nx,ny)||1;nx/=l;ny/=l;let a0=1e9,a1=-1e9,b0=1e9,b1=-1e9;for(const q of A){const d=q[0]*nx+q[1]*ny;a0=Math.min(a0,d);a1=Math.max(a1,d)}for(const q of Bp){const d=q[0]*nx+q[1]*ny;b0=Math.min(b0,d);b1=Math.max(b1,d)}if(a1<=b0-.3||b1<=a0-.3)return false}return true};
    const RR={2:14,8:6,16:12,17:12,18:4,19:6,20:9,21:5,22:12,23:8,24:4,25:10,26:14,27:14,28:14,7:2.4,6:2.6,32:3,33:6,34:2,35:2,36:2};
    const fp=b=>{if(b.k===1)return obbR(b.x,b.y,b.ang,b.L*.82,b.D*.82);if(b.k===40){const sz=((window.AtlasAssets&&AtlasAssets.SIZE[b.id])||[6])[0]*.55;return obbR(b.x,b.y,0,sz*1.64,sz*1.15)}if(b.k===6||b.k===7)return obbR(b.x,b.y,0,3.3,2.5);let r=b.r||RR[b.k]||5;if(b.k===3)r=26*(b.ms||1);if(b.k===2)r=13*(b.sz||1);return obbR(b.x,b.y-(b.k===3?r*.4:0),0,r*1.31,r*.98)};
    const pri=b=>b.k===3?9:b.k===2?8:b.k>=14&&b.k<=28&&b.k!==18&&b.k!==21?7:b.k===8?6:b.k===40||b.k===6||b.k===7?5:b.k===18?4:b.k===1?3:b.k===13||b.k===37?-1:2;
    const G=new Map(),order=B.map((b,i)=>[b,i]).filter(z=>pri(z[0])>=0).sort((a,b)=>pri(b[0])-pri(a[0])||a[1]-b[1]),drop=new Set();
    for(const [b] of order){const poly=fp(b),gx=(b.x/40)|0,gy=(b.y/40)|0,grp=b.k===40||b.k===6||b.k===7?"p"+b.ti:null;let bad=false;for(let a=-2;a<=2&&!bad;a++)for(let c2=-2;c2<=2&&!bad;c2++)for(const z of G.get((gx+a)+"_"+(gy+c2))||[]){if(grp&&z.grp===grp)continue;if(satN(poly,z.poly)){bad=true;break}}
      if(bad&&pri(b)<8){drop.add(b);continue}const k=gx+"_"+gy;(G.get(k)||G.set(k,[]).get(k)).push({poly,grp})}
    for(let i=B.length-1;i>=0;i--)if(drop.has(B[i]))B.splice(i,1)}
  return {WX,WY,vmask,mmask,lava,erList,ponds,biome,snow,bR,bG,bB,fR,fG,fB,bAt,P,seed,rng,fbm,fbm2,rivers,land,rdist,anyWater,dist,elev,forest,vari,slope,towns,roads,bridges:brs,walls,B,fieldsP:(()=>{for(const fp of fieldsP){let x=0,y=0;for(const p of fp.poly){x+=p[0];y+=p[1]}fp.key="fp:"+Math.round(x/fp.poly.length)+":"+Math.round(y/fp.poly.length)}return fieldsP})(),piers,extra,gardens,occAt,vec:{rivers:rivers.map(r=>({c:r.ctrl,w:Math.round(r.w)})),roads:roadCtrl}};
}

// ---------- desenho ----------
function smoothPath(c,pts){c.beginPath();c.moveTo(pts[0][0],pts[0][1]);for(let i=1;i<pts.length-1;i++){const mx=(pts[i][0]+pts[i+1][0])/2,my=(pts[i][1]+pts[i+1][1])/2;c.quadraticCurveTo(pts[i][0],pts[i][1],mx,my)}c.lineTo(pts[pts.length-1][0],pts[pts.length-1][1])}
function render(W,canvas,stamps){
  setScale(W.P.size||1);if(canvas.width!==CW||canvas.height!==CH){canvas.width=CW;canvas.height=CH}
  const {rng,fbm,rivers,towns,roads,occAt,P}=W;
  // edicoes de campos (vetor) e de estradas
  {if(!W._fp0)W._fp0=W.fieldsP.map(f=>({f,poly:f.poly,col:f.col}));const FO=P.fov||{};W.fieldsP=W._fp0.filter(z=>!(FO[z.f.key]&&FO[z.f.key].del)).map(z=>{const o=FO[z.f.key];z.f.poly=o&&o.poly||z.poly;z.f.col=o&&o.col||z.col;return z.f})}
  const ROV=P.rov||{},RW=[[3.5,2],[6,3.8],[8.5,5.6],[11,7.4]],RC={terra:"#e4d3a0",pedra:"#dcd6c4",areia:"#ecd9a8",trilha:"#d8c38e"};
  // 1. textura plana (mundo visto de cima)
  const flat=document.createElement("canvas");flat.width=WX;flat.height=WY;const f=flat.getContext("2d");
  f.lineJoin="round";f.lineCap="round";
  f.strokeStyle="rgba(70,72,24,.3)";f.lineWidth=.8;f.beginPath();for(let i=0;i<9000;i++){const x=rng()*WX,y=rng()*WY;if(occAt(x,y)||sampleGrid(W.land,x,y)<.03||sampleGrid(W.snow,x,y)>.4||W.bAt(x,y)===4||W.bAt(x,y)===8)continue;f.moveTo(x-1.6,y-1.4);f.lineTo(x,y+.6);f.lineTo(x+1.6,y-1.4)}f.stroke();
  for(const fp of W.fieldsP){const pth=()=>{f.beginPath();fp.poly.forEach((p,i)=>i?f.lineTo(p[0],p[1]):f.moveTo(p[0],p[1]));f.closePath()};
    pth();f.fillStyle=fp.col;f.fill();
    if(fp.kind==="crop"||fp.kind==="strips"){f.save();pth();f.clip();f.translate(fp.cx,fp.cy);f.rotate(fp.ang);
      if(fp.kind==="strips"){f.fillStyle=fp.col2;for(let y=-80,i=0;y<80;y+=fp.gap,i++)if(i&1)f.fillRect(-80,y,160,fp.gap);f.strokeStyle="rgba(72,52,20,.4)";f.lineWidth=.8;f.beginPath();for(let y=-80;y<80;y+=fp.gap){f.moveTo(-80,y);f.lineTo(80,y)}f.stroke()}
      f.strokeStyle="rgba(90,65,20,.22)";f.lineWidth=.8;f.beginPath();for(let y=-80;y<80;y+=3.4){f.moveTo(-80,y);f.lineTo(80,y)}f.stroke();f.restore()}
    pth();f.strokeStyle=fp.kind==="pasture"?"rgba(70,60,20,.32)":"rgba(72,52,20,.62)";f.lineWidth=1.1;f.stroke()}
  for(const t of towns){f.save();try{f.filter="blur(3px)"}catch(e){}f.globalAlpha=t.kind==="village"?.32:t.kind==="town"?.5:.58;f.fillStyle="#d8c993";f.beginPath();t.outline.forEach((q,i)=>i?f.lineTo(q[0],q[1]):f.moveTo(q[0],q[1]));f.closePath();f.fill();f.restore()}
  for(const g of W.gardens){f.save();f.translate(g.x,g.y);f.rotate(g.a);f.fillStyle=g.col;f.strokeStyle="rgba(72,52,20,.55)";f.lineWidth=.8;f.fillRect(-g.w/2,-g.h/2,g.w,g.h);f.strokeRect(-g.w/2,-g.h/2,g.w,g.h);f.strokeStyle="rgba(60,70,20,.45)";f.beginPath();for(let y=-g.h/2+1.6;y<g.h/2;y+=1.8){f.moveTo(-g.w/2+.8,y);f.lineTo(g.w/2-.8,y)}f.stroke();f.restore()}
  {const nb=Math.round(16000*SC*SC);f.lineWidth=.9;
    f.strokeStyle="rgba(150,104,52,.45)";f.beginPath();for(let i=0;i<nb;i++){const x=rng()*WX,y=rng()*WY;if(W.bAt(x,y)!==4||occAt(x,y))continue;const w=4+rng()*6;f.moveTo(x-w,y+1);f.quadraticCurveTo(x,y-3,x+w,y+1)}f.stroke();
    f.strokeStyle="rgba(60,40,30,.5)";f.beginPath();for(let i=0;i<nb/3;i++){const x=rng()*WX,y=rng()*WY;if(W.bAt(x,y)!==8||occAt(x,y))continue;let a=rng()*6.28,px=x,py=y;f.moveTo(px,py);for(let k=0;k<3;k++){a+=(rng()-.5)*1.4;px+=Math.cos(a)*3;py+=Math.sin(a)*3;f.lineTo(px,py)}}f.stroke();
    for(let i=0;i<nb/6;i++){const x=rng()*WX,y=rng()*WY;if(W.bAt(x,y)!==7||occAt(x,y)||sampleGrid(W.land,x,y)<.05)continue;const w=3+rng()*7;f.fillStyle="#4f6a6a";f.beginPath();f.ellipse(x,y,w+1,(w+1)*.55,0,0,7);f.fill();f.fillStyle="#7d9a96";f.beginPath();f.ellipse(x,y,w,w*.55,0,0,7);f.fill()}
    f.strokeStyle="rgba(160,170,180,.5)";f.beginPath();for(let i=0;i<nb/2;i++){const x=rng()*WX,y=rng()*WY;if(sampleGrid(W.snow,x,y)<.7||occAt(x,y))continue;const w=2+rng()*4;f.moveTo(x-w,y);f.lineTo(x+w,y)}f.stroke()}
  if(W.P.bio2){const nb=Math.round(9000*SC*SC),at=(x,y)=>W.bAt(x,y),ok_=(x,y,b)=>at(x,y)===b&&!occAt(x,y)&&sampleGrid(W.land,x,y)>.05;
    for(let i=0;i<nb/(1.6);i++){const x=rng()*WX,y=rng()*WY,b=at(x,y);if((b!==9&&b!==10)||occAt(x,y)||sampleGrid(W.land,x,y)<.05)continue;if(b===9&&Math.sin(x*.021/SC+y*.013/SC)+Math.sin(x*.009/SC-y*.024/SC)<.2)continue;const w=3+rng()*(b===9?16:5);f.fillStyle=b===10?"#4c5a48":"#4f6a6a";f.beginPath();f.ellipse(x,y,w+1,(w+1)*.5,0,0,7);f.fill();f.fillStyle=b===10?"#7a8a78":"#86a6a0";f.beginPath();f.ellipse(x,y,w,w*.5,0,0,7);f.fill()}
    f.strokeStyle="rgba(150,150,140,.55)";f.lineWidth=.7;f.beginPath();for(let i=0;i<nb/2;i++){const x=rng()*WX,y=rng()*WY;if(!ok_(x,y,11))continue;let a=rng()*6.28,px=x,py=y;f.moveTo(px,py);for(let k=0;k<4;k++){a+=1.05+(rng()-.5)*.4;px+=Math.cos(a)*4;py+=Math.sin(a)*2.6;f.lineTo(px,py)}}f.stroke();
    f.strokeStyle="rgba(20,18,18,.5)";f.lineWidth=.9;f.beginPath();for(let i=0;i<nb/2;i++){const x=rng()*WX,y=rng()*WY;if(!ok_(x,y,12))continue;const w=4+rng()*6;f.moveTo(x-w,y+1);f.quadraticCurveTo(x,y-3,x+w,y+1)}f.stroke();
    for(const [cl,lw] of [["rgba(110,26,8,.6)",2.2],["#e2641e",1.1]]){f.strokeStyle=cl;f.lineWidth=lw;f.beginPath();const r2=mulberry((W.seed^0x1a7a)>>>0);for(let i=0;i<nb/7;i++){const x=r2()*WX,y=r2()*WY;if(at(x,y)!==13||occAt(x,y))continue;let a=r2()*6.28,px=x,py=y;f.moveTo(px,py);for(let k=0;k<5;k++){a+=(r2()-.5)*1.2;px+=Math.cos(a)*4;py+=Math.sin(a)*4;f.lineTo(px,py)}}f.stroke()}
    f.strokeStyle="rgba(90,130,170,.6)";f.lineWidth=.9;f.beginPath();for(let i=0;i<nb/3;i++){const x=rng()*WX,y=rng()*WY;if(!ok_(x,y,14))continue;const w=3+rng()*7,a=rng()*.6-.3;f.moveTo(x-w,y-w*a);f.lineTo(x,y+1);f.lineTo(x+w,y+w*a)}f.stroke();
    for(let i=0;i<nb/3;i++){const x=rng()*WX,y=rng()*WY,b=at(x,y);if((b!==15&&b!==19&&b!==18&&b!==20)||occAt(x,y))continue;f.fillStyle=b===20?"rgba(150,220,255,.75)":b===15?"rgba(220,190,255,.7)":b===18?"rgba(120,255,230,.6)":"rgba(120,240,255,.7)";f.beginPath();f.arc(x,y,.8+rng()*1.1,0,7);f.fill()}
    f.strokeStyle="rgba(110,50,140,.45)";f.lineWidth=1;f.beginPath();for(let i=0;i<nb/4;i++){const x=rng()*WX,y=rng()*WY;if(!ok_(x,y,16))continue;let a=rng()*6.28,px=x,py=y;f.moveTo(px,py);for(let k=0;k<4;k++){a+=(rng()-.5)*1.6;px+=Math.cos(a)*5;py+=Math.sin(a)*5;f.lineTo(px,py)}}f.stroke();
    f.strokeStyle="rgba(40,20,14,.45)";f.lineWidth=1.6;f.beginPath();for(let i=0;i<nb/5;i++){const x=rng()*WX,y=rng()*WY;if(!ok_(x,y,17))continue;const a=rng()*6.28,l=6+rng()*10;f.moveTo(x,y);f.lineTo(x+Math.cos(a)*l,y+Math.sin(a)*l*.6)}f.stroke()}
  for(const lv of W.lava||[]){if(lv.length<3)continue;for(const [w,cl] of [[5,"rgba(120,30,10,.55)"],[3,"#d9541e"],[1.4,"#f6b04a"]]){f.strokeStyle=cl;f.lineWidth=w;f.lineCap="round";f.lineJoin="round";f.beginPath();lv.forEach((q,i)=>i?f.lineTo(q[0],q[1]):f.moveTo(q[0],q[1]));f.stroke()}}
  for(const pd of W.ponds||[]){f.save();f.translate(pd.x,pd.y);f.rotate(pd.a);const sh=()=>{f.beginPath();for(let i=0;i<=16;i++){const a=i/16*6.2832,r=1+.18*Math.sin(a*3+pd.w);f.lineTo(Math.cos(a)*pd.w*r,Math.sin(a)*pd.h*r)}f.closePath()};sh();f.fillStyle="#6f8a5e";f.lineWidth=5;f.strokeStyle="rgba(110,130,80,.6)";f.stroke();f.fillStyle="#7f9a9e";f.fill();f.lineWidth=1.2;f.strokeStyle="#3d5258";f.stroke();f.strokeStyle="rgba(240,248,248,.5)";f.lineWidth=.8;f.beginPath();f.moveTo(-pd.w*.4,-pd.h*.1);f.lineTo(pd.w*.1,-pd.h*.1);f.moveTo(-pd.w*.1,pd.h*.25);f.lineTo(pd.w*.35,pd.h*.25);f.stroke();f.restore()}
  if(W.anyWater){f.strokeStyle="rgba(40,58,66,.5)";f.lineWidth=.9;f.beginPath();for(let i=0;i<8000;i++){const x=rng()*WX,y=rng()*WY;if(sampleGrid(W.land,x,y)>-.04)continue;const w=3+rng()*4;f.moveTo(x-w,y);f.quadraticCurveTo(x,y-2.2,x+w,y)}f.stroke()}
  const mouth=q=>1+1.7*sstep(.16,-.02,sampleGrid(W.land,q[0],q[1]));
  const rvSeg=(rv,wd,col,skipSea)=>{const P2=rv.pts;f.strokeStyle=col;for(let i=0;i<P2.length-1;i++){const a=P2[i],b=P2[i+1];const la=sampleGrid(W.land,a[0],a[1]);if((skipSea&&la<.035)||la<-.025)continue;f.lineWidth=wd*mouth(a);f.beginPath();f.moveTo(a[0],a[1]);f.lineTo(b[0],b[1]);f.stroke()}};
  for(const rv of rivers)rvSeg(rv,20*rv.w/16,"#33403c",true);
  for(const rv of rivers){const kk=rv.w/16,river=rv.pts;rvSeg(rv,16*kk,"#7f9197");rvSeg(rv,8*kk,"#98a9ab");
    f.strokeStyle="rgba(40,58,66,.6)";f.lineWidth=.9;f.beginPath();
    for(let i=1;i<river.length-1;i++){const a=river[i],b=river[i+1];if(sampleGrid(W.land,a[0],a[1])<.06)continue;const dx=b[0]-a[0],dy=b[1]-a[1],l=Math.hypot(dx,dy)||1,nx=-dy/l,ny=dx/l;
      for(const o0 of[-5,-1.5,2,5.5]){const o=o0*kk;if(((i*7+((o0*3)|0))&3)===0)continue;const sgn=(i+((o0+6)|0))&1?1:-1;f.moveTo(a[0]+nx*o,a[1]+ny*o);f.quadraticCurveTo(a[0]+dx*.5+nx*(o+1.8*sgn),a[1]+dy*.5+ny*(o+1.8*sgn),a[0]+dx*.85+nx*o,a[1]+dy*.85+ny*o)}}f.stroke()}
  for(const [ri,r] of roads.entries()){const o=ROV[ri]||{};if(o.hide)continue;smoothPath(f,r);f.strokeStyle="rgba(74,52,22,.7)";f.lineWidth=RW[o.w==null?1:o.w][0];if(o.type==="trilha")f.setLineDash([5,4]);f.stroke();f.setLineDash([])}
  for(const t of towns)for(const s of t.streets){smoothPath(f,s);f.strokeStyle="rgba(74,52,22,.6)";f.lineWidth=4.6;f.stroke()}
  for(const t of towns){if(t.plaza){f.lineWidth=1.2;poly(f,t.plaza.poly,"#e2d3a2","rgba(74,52,22,.55)");const pl=t.plaza;f.save();f.beginPath();pl.poly.forEach((q,i)=>i?f.lineTo(q[0],q[1]):f.moveTo(q[0],q[1]));f.closePath();f.clip();f.strokeStyle="rgba(110,86,46,.35)";f.lineWidth=.5;
      if(pl.style==="fonte"||pl.style==="monumento"||pl.style==="cruz"){for(let r=3.5;r<(pl.pr||12)*1.3;r+=2.6){f.beginPath();f.ellipse(pl.x,pl.y,r,r*.85,0,0,7);f.stroke()}}else{f.beginPath();for(let k=-12;k<=12;k++){f.moveTo(pl.x-30,pl.y+k*2.2);f.lineTo(pl.x+30,pl.y+k*2.2)}f.stroke()}f.restore()}}
  for(const [ri,r] of roads.entries()){const o=ROV[ri]||{};if(o.hide||o.type==="trilha")continue;smoothPath(f,r);f.strokeStyle=RC[o.type]||RC.terra;f.lineWidth=RW[o.w==null?1:o.w][1];f.stroke()}
  for(const t of towns)for(const s of t.streets){smoothPath(f,s);f.strokeStyle="#e0cf9c";f.lineWidth=2.8;f.stroke()}
  for(const p of W.piers){f.lineCap="butt";const ln=()=>{f.beginPath();f.moveTo(p[0][0],p[0][1]);f.lineTo(p[1][0],p[1][1])};ln();f.strokeStyle="#3a2a18";f.lineWidth=5.5;f.stroke();ln();f.strokeStyle="#a37c4c";f.lineWidth=3.6;f.stroke();ln();f.strokeStyle="rgba(50,32,15,.6)";f.setLineDash([.8,2.2]);f.stroke();f.setLineDash([]);f.lineCap="round"}
  for(const br of W.bridges){const dx=br[1][0]-br[0][0],dy=br[1][1]-br[0][1],l=Math.hypot(dx,dy)||1,a=[br[0][0]-dx/l*2,br[0][1]-dy/l*2],b=[br[1][0]+dx/l*2,br[1][1]+dy/l*2];f.lineCap="butt";const ln=()=>{f.beginPath();f.moveTo(a[0],a[1]);f.lineTo(b[0],b[1])};
    if(br.stone){ln();f.strokeStyle="#4d4a41";f.lineWidth=10;f.setLineDash([2.4,5.5]);f.lineDashOffset=-2;f.stroke();f.setLineDash([]);ln();f.strokeStyle=INK;f.lineWidth=7.6;f.stroke();ln();f.strokeStyle="#cdc6b4";f.lineWidth=6.2;f.stroke();ln();f.strokeStyle="#e6d7a8";f.lineWidth=3.4;f.stroke()}
    else{ln();f.strokeStyle="#3a2a18";f.lineWidth=7;f.stroke();ln();f.strokeStyle="#9a7446";f.lineWidth=5.2;f.stroke();ln();f.strokeStyle="rgba(50,32,15,.7)";f.setLineDash([.8,2.2]);f.stroke();f.setLineDash([])}
    f.lineCap="round"}
  const tex=f.getImageData(0,0,WX,WY).data;
  // 2. relevo inclinado
  const E=new Float32Array(WX*WY),F=new Float32Array(WX*WY),V=new Float32Array(WX*WY);
  upsample(W.elev,E);upsample(W.forest,F);upsample(W.vari,V);const LF=new Float32Array(WX*WY);upsample(W.land,LF);
  let thrC=1;{const a=[];for(let y=8;y<WY-8;y+=6)for(let x=4;x<WX;x+=6){const v=E[(y-6)*WX+x]-E[(y+6)*WX+x];if(v>.004)a.push(v)}a.sort((p,q)=>p-q);thrC=Math.max(.055,a[Math.floor(a.length*.988)]||1)}
  const img=new ImageData(MW,MH),o=img.data,YB=new Uint16Array(MW*MH);
  const NL=36;for(let x=0;x<MW;x++){let ymin=MH,hidden=false,cprev=false;const xl=Math.max(0,x-6),xr=Math.min(WX-1,x+6);
    for(let y=WY-1;y>=0;y--){const i=y*WX+x,h=E[i],sy=(y*TILT-h*K)|0;
      if(sy>=ymin){hidden=true;continue}
      const yu=Math.max(0,y-6),yd=Math.min(WY-1,y+6);
      const gx=E[y*WX+xr]-E[y*WX+xl],gy=E[yd*WX+x]-E[yu*WX+x];
      const lit=clamp((gx*.85+gy*.7)*10,-1,1),steep=clamp(Math.hypot(gx,gy)*8-.15,0,1);
      const v=V[i],fo=F[i],gx_=x/G,gy_=y/G,xi_=gx_|0,yi_=Math.min(GH-2,gy_|0),fx_=gx_-xi_,fy_=gy_-yi_,k_=yi_*GW+xi_,bil=a=>(a[k_]+(a[k_+1]-a[k_])*fx_)+((a[k_+GW]+(a[k_+GW+1]-a[k_+GW])*fx_)-(a[k_]+(a[k_+1]-a[k_])*fx_))*fy_;
      const vv=(v-.5)*22;let r=bil(W.bR)+vv,g=bil(W.bG)+vv*.7,b=bil(W.bB)+vv*.4;const sn=bil(W.snow),vm_=bil(W.vmask),mm_=bil(W.mmask);if(vm_>0){r=lerp(r,82,vm_);g=lerp(g,70,vm_);b=lerp(b,64,vm_)}if(mm_>0){r=lerp(r,206,mm_);g=lerp(g,150,mm_);b=lerp(b,100,mm_)}
      r=lerp(r,r*1.05+8,h*.5);g=lerp(g,g*1.0,h*.5);b=lerp(b,b*1.02+4,h*.5);
      r=lerp(r,160,steep*.5);g=lerp(g,128,steep*.5);b=lerp(b,70,steep*.5);
      r=lerp(r,bil(W.fR),fo*.9);g=lerp(g,bil(W.fG),fo*.9);b=lerp(b,bil(W.fB),fo*.9);if(sn>0){r=lerp(r,236,sn*.92);g=lerp(g,240,sn*.92);b=lerp(b,246,sn*.92)}
      const lv_=LF[i];if(lv_<0){const dd=clamp(-lv_*1.7,0,1);r=lerp(136,96,dd);g=lerp(154,117,dd);b=lerp(158,130,dd);if(lv_>-.1){const q_=1+(lv_+.1)*1.7;r*=q_;g*=q_;b*=q_}}else if(lv_<.06&&fo<.3){const s_=(1-lv_/.06)*.8;r=lerp(r,216,s_);g=lerp(g,200,s_);b=lerp(b,152,s_)}
      const ti=i*4;let ta=tex[ti+3]/255;if(lv_<0&&ta>.8&&tex[ti+2]>tex[ti])ta*=sstep(-.16,-.01,lv_);if(ta>0){r=lerp(r,tex[ti],ta);g=lerp(g,tex[ti+1],ta);b=lerp(b,tex[ti+2],ta)}
      let sh=1+lit*(lit>0?.2:.36);const wb=lit<0?1+lit*.14:1;
      {const cq=-gy;if(cq>thrC*.7&&fo<.5&&ta<.3&&lv_>=0){const cl=sstep(thrC*.7,thrC,cq),yb=Math.max(0,y-9),top=(E[yb*WX+x]-E[Math.min(WY-1,y+3)*WX+x])<thrC*.62,str=((Math.imul(x>>1,2654435761)>>>0)%6)===0,str2=((Math.imul(x>>1,40503)>>>0)%11)===0;
        r=lerp(r,sn>.5?214:vm_>.3?96:mm_>.3?196:190,cl);g=lerp(g,sn>.5?216:vm_>.3?82:mm_>.3?128:174,cl);b=lerp(b,sn>.5?222:vm_>.3?74:mm_>.3?86:138,cl);sh=lerp(sh,top?.42:(.92+clamp(gx*5,-.22,.12))*(str?.7:str2?1.12:1),cl)}}
      if(lv_>=0&&fo<.45&&ta<.25&&y<WY-1&&x<WX-1){const lv=(h*NL)|0,cv=((E[i+WX]*NL)|0)!==lv||((E[i+1]*NL)|0)!==lv;
        if(cv){sh*=lv%4===0?.7:.8;cprev=true}else{if(cprev&&lv>0)sh*=lit>-.2?1.1:1.04;cprev=false}}else cprev=false;
      const top=sy<0?0:sy;for(let s=top;s<ymin;s++){const k=(s*MW+x)*4,gr=.975+((((Math.imul(x,73856093)^Math.imul(s,19349663))>>>0)%89)/89)*.05;o[k]=r*sh*gr;o[k+1]=g*sh*gr;o[k+2]=b*sh*wb*gr;o[k+3]=255;YB[s*MW+x]=y}
      ymin=sy;if(ymin<=0)break}}
  const tmp=document.createElement("canvas");tmp.width=MW;tmp.height=MH;tmp.getContext("2d").putImageData(img,0,0);
  const BLD={b_hut:"hut",b_farm:"farm",b_town:"town",b_row:"row",b_rich:"rich",b_manor:"manor",b_tavern:"tavern",b_smithy:"smithy",b_barn:"barn",b_shed:"shed",b_temple:2,b_castle:3,b_tower:5,b_stall:6,b_well:7,b_mill:8,b_tent:32,b_cmd:33,b_fire:34},MKEY={cave:20,watch:21,camp:22,graves:23,shrine:24,mine:25,ruin:16,stones:17,totem:18,torii:19,arch:26,spires:27,boulders:28},TREEK=new Set(["oak","pine","snowpine","autumn","sakura","blossom","birch","palm","acacia","willow","jungle","dead","cactus","bush","bare"]);
  let CACHE=null,LI=null,HID=null;const API={};const compose=(MO,ER,X)=>{setScale(W.P.size||1);let rngS=mulberry((W.seed^4242)>>>0);const rng=()=>rngS();
  // 3. papel e moldura
  const c=canvas.getContext("2d");c.setTransform(1,0,0,1,0,0);if(CACHE)c.drawImage(CACHE.base,0,0);else{c.fillStyle="#cdbb93";c.fillRect(0,0,CW,CH);
  for(let i=0;i<60;i++){const x=rng()*CW,y=rng()*CH,r=40+rng()*200,g=c.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,"rgba(110,80,35,"+(.03+rng()*.07)+")");g.addColorStop(1,"rgba(110,80,35,0)");c.fillStyle=g;c.fillRect(x-r,y-r,r*2,r*2)}
  c.drawImage(tmp,MX,MY);}
  c.save();c.beginPath();c.rect(MX,MY,MW,MH);c.clip();c.translate(MX,MY);c.lineCap="round";
  const eAt=(x,y)=>E[clamp(y|0,0,WY-1)*WX+clamp(x|0,0,WX-1)];
  const pj=(x,y)=>[x,y*TILT-eAt(x,y)*K];
  const vis=(x,y,p)=>{const sx=p[0]|0,sy=p[1]|0;if(sx<0||sy<0||sx>=MW||sy>=MH)return sy<MH+40&&sx>-20&&sx<MW+20&&sy>-10;return YB[sy*MW+sx]<=y+14};
  // 4a. hachuras de encosta: escuras no lado da sombra, claras no lado da luz
  let bc=null;if(!CACHE){const hd=[],hl=[];
    for(let y=6;y<WY-6;y+=7)for(let x=6;x<WX-6;x+=7){const px=x+(rng()-.5)*6,py=y+(rng()-.5)*6;const gx=(eAt(px+3,py)-eAt(px-3,py))/6,gy=(eAt(px,py+3)-eAt(px,py-3))/6,g=Math.hypot(gx,gy);
      if(g<.0016||rng()>g*170)continue;const k=(clamp(py|0,0,WY-1)*WX+clamp(px|0,0,WX-1))*4;if(tex[k+3]>60||LF[k>>2]<.06)continue;
      const p=pj(px,py);if(!vis(px,py,p))continue;const len=clamp(g*2600,3,10),q=pj(px-gx/g*len,py-gy/g*len);
      ((gx*.85+gy*.7)>0?hl:hd).push([p,q])}
    c.lineWidth=.9;c.strokeStyle="rgba(62,54,22,.55)";c.beginPath();for(const[p,q]of hd){c.moveTo(p[0],p[1]);c.lineTo(q[0],q[1])}c.stroke();
    c.strokeStyle="rgba(244,232,166,.5)";c.beginPath();for(const[p,q]of hl){c.moveTo(p[0],p[1]);c.lineTo(q[0],q[1])}c.stroke();bc=document.createElement("canvas");bc.width=CW;bc.height=CH;bc.getContext("2d").drawImage(canvas,0,0)}
  // 4. objetos (construcoes primeiro; arvores que cobririam uma construcao atras delas sao omitidas)
  let obj=[];if(CACHE)obj=CACHE.obj.slice();else{const CS=4,SGW=Math.ceil(MW/CS)+1,SGH=Math.ceil(MH/CS)+1,minY=new Float32Array(SGW*SGH).fill(1e9);
  const mark=(x0,y0,x1,y1,yy)=>{const i0=Math.max(0,(x0/CS)|0),i1=Math.min(SGW-1,(x1/CS)|0),j0=Math.max(0,(y0/CS)|0),j1=Math.min(SGH-1,(y1/CS)|0);for(let j=j0;j<=j1;j++)for(let i=i0;i<=i1;i++){const k=j*SGW+i;if(yy<minY[k])minY[k]=yy}};
  const blocked=(x0,y0,x1,y1,yy)=>{const i0=Math.max(0,(x0/CS)|0),i1=Math.min(SGW-1,(x1/CS)|0),j0=Math.max(0,(y0/CS)|0),j1=Math.min(SGH-1,(y1/CS)|0);for(let j=j0;j<=j1;j++)for(let i=i0;i<=i1;i++)if(minY[j*SGW+i]<yy-1)return true;return false};
  for(const b of W.B){const p=pj(b.x,b.y);if(!vis(b.x,b.y,p))continue;const ey=b.k===1?(Math.abs(Math.sin(b.ang))*b.L+Math.abs(Math.cos(b.ang))*b.D)/2*TILT:0,ex=b.k===1?(Math.abs(Math.cos(b.ang))*b.L+Math.abs(Math.sin(b.ang))*b.D)/2:0;const q=Object.assign({},b,{x:p[0],y:p[1]+ey,cy:p[1],bref:b});obj.push(q);
    const rr=b.k===1?ex+1:b.k===3?30:b.k===2?24:b.k===8?11:b.k===14||b.k===15?b.w:b.k>=16?12:5,hh=b.k===15?60:b.k>=26&&b.k<=28?24:b.k===30?32*(b.s||1):b.k===21?24:b.k===25?14:b.k===1?b.H+b.R+ey*2+2:b.k===3?36:b.k===2?28:b.k===8?21:b.k===14?b.h+6:b.k===15?b.h+30:b.k>=16?18:6;mark(q.x-rr,q.y-hh,q.x+rr,q.y+3,q.y)}
  for(const wl of W.walls){const pp=wl.pts.map(p=>pj(p[0],p[1])),NP=pp.length,fz=wl.fence||"stone";
    wl.segs.forEach((s,i)=>{const a=pp[i],b=pp[(i+1)%NP],yy=Math.max(a[1],b[1]);if(s.sea)return;
      if(s.water){obj.push({k:9,a,b,y:yy,fz},{k:5,x:a[0],y:a[1]+.6,g:0,fz},{k:5,x:b[0],y:b[1]+.6,g:0,fz})}
      else if(s.gate){const m1=[lerp(a[0],b[0],.32),lerp(a[1],b[1],.32)],m2=[lerp(a[0],b[0],.68),lerp(a[1],b[1],.68)];obj.push({k:4,a,b:m1,y:Math.max(a[1],m1[1]),fz},{k:4,a:m2,b,y:Math.max(b[1],m2[1]),fz},{k:5,x:m1[0],y:m1[1]+.6,g:1,fz},{k:5,x:m2[0],y:m2[1]+.6,g:1,fz})}
      else{obj.push({k:4,a,b,y:yy,fz});if(i%3===0&&fz!=="hedge")obj.push({k:5,x:a[0],y:a[1]+.5,g:0,fz})}
      mark(Math.min(a[0],b[0])-4,Math.min(a[1],b[1])-14,Math.max(a[0],b[0])+4,yy+2,Math.min(a[1],b[1]))})}
  // penhascos nas encostas voltadas para quem olha, rochas e arbustos
  {const cand=[];for(let y=10;y<WY-10;y+=5)for(let x=10;x<WX-10;x+=5){const gx=(eAt(x+4,y)-eAt(x-4,y))/8,gy=(eAt(x,y+4)-eAt(x,y-4))/8;if(gy<0)cand.push([x,y,Math.hypot(gx,gy)])}
    const gs=cand.map(q=>q[2]).sort((a,b)=>a-b),thr=Math.max(.0036,gs[Math.floor(gs.length*.988)]||1);const cl=[];
    for(const[x,y,g]of cand){if(g<thr||cl.length>=30||occAt(x,y)||F[(y|0)*WX+(x|0)]>.5)continue;const p=pj(x,y);if(!vis(x,y,p))continue;if(cl.some(q=>Math.abs(q[0]-p[0])<26&&Math.abs(q[1]-p[1])<20))continue;
      const w=22+rng()*12,h=clamp(g*1700,6,15);if(blocked(p[0]-w/2,p[1]-2,p[0]+w/2,p[1]+h,p[1]+h))continue;cl.push(p);
      for(let k=0;k<2;k++)if(rng()<.7){const rx=p[0]+(rng()-.5)*w,ry=p[1]+h*(.8+rng()*.4);obj.push({k:11,x:rx,y:ry,s:.55+rng()*.35,st:stamps.rock[(rng()*stamps.rock.length)|0]})}}
    for(let y=8;y<WY-8;y+=11)for(let x=6;x<WX-6;x+=11){const px=x+(rng()-.5)*10,py=y+(rng()-.5)*10,i=(py|0)*WX+(px|0);if(occAt(px,py)||LF[i]<.03)continue;
      const fo=F[i],e=E[i],g=Math.hypot(eAt(px+4,py)-eAt(px-4,py),eAt(px,py+4)-eAt(px,py-4))/8,dr=sampleGrid(W.dist,px,py);
      const rk=(e>.38&&rng()<.05)||(g>thr*.6&&fo<.4&&rng()<.16)||rng()<.004,bs=(fo>.06&&fo<.36&&rng()<.45)||(dr>14&&dr<34&&rng()<.12)||rng()<.018;
      if(!rk&&!bs)continue;if(sampleGrid(W.vmask,px,py)>.3||sampleGrid(W.mmask,px,py)>.5)continue;const p=pj(px,py);if(!vis(px,py,p))continue;
      if(rk&&W.P.bio2){const bb=W.bAt(px,py);if(bb===14&&rng()<.6)continue;const cr=stamps.crist[bb],rb=stamps.rockB[bb];if(cr&&(rng()<.55||!rb)){const sc=.7+rng()*.5;if(!blocked(p[0]-9*sc,p[1]-16*sc,p[0]+9*sc,p[1],p[1])){obj.push({k:11,x:p[0],y:p[1],s:sc,st:cr[(rng()*cr.length)|0]});continue}}if(rb){const sc=.6+rng()*.5;if(!blocked(p[0]-10*sc,p[1]-12*sc,p[0]+10*sc,p[1],p[1]))obj.push({k:11,x:p[0],y:p[1],s:sc,st:rb[(rng()*rb.length)|0],wide:1});continue}}
      if(!rk&&W.P.bio2){const bb=W.bAt(px,py),bs=stamps.bushB[bb];if(bb===14)continue;if(bs){const sc=.7+rng()*.45;if(!blocked(p[0]-9*sc,p[1]-13*sc,p[0]+9*sc,p[1],p[1]))obj.push({k:12,x:p[0],y:p[1],s:sc,st:bs[(rng()*bs.length)|0]});continue}}
      if(rk){const sc=.6+rng()*.5,bb=W.bAt(px,py),cl=rng()<.28;if(cl){if(!blocked(p[0]-14,p[1]-14,p[0]+14,p[1],p[1]))obj.push({k:11,x:p[0],y:p[1],s:.9+rng()*.4,st:stamps.rockc[(bb===4||bb===5?6:bb===8?9:(rng()*6)|0)+((rng()*3)|0)],wide:1})}else if(!blocked(p[0]-8*sc,p[1]-12*sc,p[0]+8*sc,p[1],p[1]))obj.push({k:11,x:p[0],y:p[1],s:sc,st:bb===4||bb===5?stamps.rocks[(rng()*6)|0]:rng()<.5?stamps.rock[(rng()*stamps.rock.length)|0]:stamps.rocks[6+((rng()*3)|0)]})}
      else{const sc=.7+rng()*.45;if(!blocked(p[0]-9*sc,p[1]-13*sc,p[0]+9*sc,p[1],p[1]))obj.push({k:12,x:p[0],y:p[1],s:sc,st:stamps.bush[(rng()*stamps.bush.length)|0]})}}}
  const sx=8,syw=sx/TILT;
  for(let y=4;y<WY-2;y+=syw)for(let x=2;x<WX-2;x+=sx){const px=x+(rng()-.5)*sx*1.1,py=y+(rng()-.5)*syw*1.1;if(px<1||py<1||px>=WX-1||py>=WY-1)continue;
    const i=(py|0)*WX+(px|0),fo=F[i];const lone=rng()<.009*Math.min(1,(W.P.forest==null?.5:W.P.forest)*2)&&sampleGrid(W.dist,px,py)>20&&LF[i]>.05;
    if(!(fo>.32&&rng()<fo*1.15)&&!lone)continue;if(occAt(px,py)||sampleGrid(W.vmask,px,py)>.2)continue;
    const p=pj(px,py);if(!vis(px,py,p))continue;const sc=(lone?.82:.64)+rng()*.36,w=34*sc,h=38*sc;if(blocked(p[0]-w*.32,p[1]-h*.85,p[0]+w*.32,p[1],p[1]))continue;
    const bb=W.bAt(px+(rng()-.5)*20,py+(rng()-.5)*20),sn=sampleGrid(W.snow,px,py),pk=a=>a[(rng()*a.length)|0];let st;
    if(sn>.55&&(bb<9||bb===14)&&(W.P.season!=="inverno"||bb===2||bb===3||rng()<.45))st=pk(stamps.snowpine);else if(bb===1)st=rng()<.85?pk(stamps.con):pk(stamps.dec);else if(bb===3)st=rng()<.6?pk(stamps.snowpine):pk(stamps.con);
    else if(bb===4)st=sampleGrid(W.rdist,px,py)<60||sampleGrid(W.land,px,py)<.12?pk(stamps.palm):pk(stamps.cactus);else if(bb===5)st=rng()<.8?pk(stamps.acacia):pk(stamps.bush);
    else if(bb===6)st=rng()<.25?pk(stamps.palm):pk(stamps.jungle);else if(bb===7)st=rng()<.6?pk(stamps.willow):pk(stamps.dec);else if(bb===8||bb===13||bb===17)st=pk(stamps.dead);else if(bb===9)st=rng()<.5?pk(stamps.palm):rng()<.5?pk(stamps.willow):pk(stamps.bush);else if(bb===10)st=sampleGrid(W.land,px,py)<.16||sampleGrid(W.rdist,px,py)<40?pk(stamps.mangue):rng()<.6?pk(stamps.jungle):pk(stamps.palm);else if(bb===12)st=rng()<.5?pk(stamps.dead):pk(stamps.cactus);
    else if(bb===15)st=rng()<.8?pk(stamps.magica):pk(stamps.dec);else if(bb===16)st=pk(stamps.corrupt);else if(bb===18)st=pk(stamps.alien);else if(bb===19)st=rng()<.7?pk(stamps.luz):pk(stamps.jungle);else if(bb===20)st=pk(stamps.fungo);else if(bb===11||bb===14)continue;
    else st=V[i]>.56&&E[i]>.22&&rng()<.85?pk(stamps.con):(bb===1||bb===0)&&rng()<.08?pk(stamps.birch):pk(stamps.dec);
    if(stamps.dec.includes(st)||stamps.birch.includes(st)){const se=W.P.season;if(se==="outono"&&rng()<.75)st=pk(stamps.autumn);else if(se==="primavera"&&rng()<.16)st=rng()<.5?pk(stamps.sakura):pk(stamps.blossom);else if(se==="inverno")st=pk(stamps.bare)}
    else if(W.P.season==="inverno"&&stamps.con.includes(st)&&rng()<.6)st=pk(stamps.snowpine);
    obj.push({y:p[1],x:p[0],k:0,s:sc*(bb===6||bb===19?1.15:bb===10?.9:bb===4&&st.width<25?.8:1),st})}
  {for(let i=0;i<Math.round(5000*SC*SC);i++){const px=rng()*WX,py=rng()*WY;if(W.bAt(px,py)!==7||occAt(px,py)||sampleGrid(W.land,px,py)<.05||sampleGrid(W.rdist,px,py)<14)continue;const p=pj(px,py);if(!vis(px,py,p))continue;obj.push({k:12,x:p[0],y:p[1],s:.8+rng()*.4,st:stamps.reed[(rng()*stamps.reed.length)|0]})}}
  for(const e of W.extra){if(occAt(e[0],e[1])===3||sampleGrid(W.rdist,e[0],e[1])<15||sampleGrid(W.land,e[0],e[1])<.04)continue;const p=pj(e[0],e[1]);if(!vis(e[0],e[1],p))continue;if(e[3]==="b"){obj.push({k:12,x:p[0],y:p[1],s:e[2],st:stamps.bush[(rng()*stamps.bush.length)|0]});continue}const w=34*e[2],h=38*e[2];if(blocked(p[0]-w*.32,p[1]-h*.85,p[0]+w*.32,p[1],p[1]))continue;const tn=W.towns.find(t=>t.rel(e[0],e[1])<1.4),se=W.P.season;let ar=stamps.dec;if(tn&&(tn.race==="japones"||tn.race==="chines")&&rng()<.55)ar=stamps.sakura;else if(se==="outono"&&rng()<.7)ar=stamps.autumn;else if(se==="inverno")ar=stamps.bare;else if(se==="primavera"&&rng()<.25)ar=stamps.blossom;obj.push({y:p[1],x:p[0],k:0,s:e[2],st:ar[(rng()*ar.length)|0]})}
  for(const q of obj){if(q.bref)q.key="b:"+q.bref.k+":"+Math.round(q.bref.x)+":"+Math.round(q.bref.y);else if(q.k===0||q.k===11||q.k===12)q.key="r:"+q.k+":"+Math.round(q.x)+":"+Math.round(q.y)}
  CACHE={base:bc,obj:obj.slice()}}
  for(const m of MO||[]){const n0=obj.length;try{if(m&&m.v&&m.v.slice(0,2)==="u:"){if(m.x==null)continue;const p=pj(m.x,m.y);if(!vis(m.x,m.y,p))continue;obj.push({k:41,u:m.v,x:p[0],y:p[1],man:1,s:m.s||1,ang:(m.a||0)*Math.PI/180});continue}const AS=window.AtlasAssets&&AtlasAssets.NAME[m.v];if(!m||m.x==null||!(TREEK.has(m.v)||m.v==="rock"||MKEY[m.v]||BLD[m.v]||AS))continue;if(sampleGrid(W.land,m.x,m.y)<.02||sampleGrid(W.rdist,m.x,m.y)<5)continue;const p=pj(m.x,m.y);if(!vis(m.x,m.y,p))continue;const s=m.s||1;
    if(AS){const race=m.c||(towns.find(t=>t.rel(m.x,m.y)<2.5)||towns[0]||{race:"humano"}).race;obj.push({k:40,id:m.v,x:p[0],y:p[1],man:1,s,race,vv:(((m.x*7+m.y*3)%100)/100+(m.vv||0))%1,ang:(m.a||0)*Math.PI/180});continue}
    if(BLD[m.v]){const race=m.c||(towns.find(t=>t.rel(m.x,m.y)<2.5)||towns[0]||{race:"humano"}).race,r2=mulberry((Math.imul(m.x|0,73856093)^Math.imul(m.y|0,19349663))>>>0),cold=sampleGrid(W.snow,m.x,m.y)>.5,bk=BLD[m.v];
      if(typeof bk==="string"){const o=mkHouse(race,bk,r2,(m.a||0)*Math.PI/180);if(cold&&o.form!=="flat"&&o.form!=="mound")o.roof="snow";const ey=(Math.abs(Math.sin(o.ang))*o.L+Math.abs(Math.cos(o.ang))*o.D)/2*TILT;obj.push(Object.assign(o,{x:p[0],y:p[1]+ey,cy:p[1],man:1,s,smoke:false}))}
      else obj.push({k:bk,x:p[0],y:p[1],cy:p[1],man:1,s,race,cold,v:r2(),sz:1,big:false,col:"#b5473a",rot:r2()*3,flag:1,fz:CUL[race].fence,g:1});continue}
    if(TREEK.has(m.v))obj.push({k:30,x:p[0],y:p[1],v:m.v,s:s*(m.v==="bush"?1:.9),man:1});else if(m.v==="rock")obj.push({k:31,x:p[0],y:p[1],s,man:1});
    else{const b=W.bAt(m.x,m.y),col=b===8?["#86705e","#54443a","#a08a74"]:b===4||b===5?["#c9a06c","#8c6a44","#e0c494"]:["#b9b3a2","#77705f","#d6d0c0"];obj.push({k:MKEY[m.v],x:p[0],y:p[1],man:1,s,col,st:((m.x*7+m.y*3)|0)%12,race:(towns.find(t=>t.rel(m.x,m.y)<2.5)||{race:"humano"}).race,snow:sampleGrid(W.snow,m.x,m.y)>.5})}}finally{for(let i=n0;i<obj.length;i++)obj[i].mref=m}}
  let objD=obj;if(ER&&ER.length){const ep=ER.map(e=>{const p=pj(e.x,e.y);return [p[0],p[1],e.r*e.r]});objD=obj.filter(q=>{if(q.man||q.x==null||q.k===4||q.k===5||q.k===9||q.k===13||q.k===15)return true;for(const [x,y,r2] of ep){const dx=q.x-x,dy=(q.y-y)/TILT;if(dx*dx+dy*dy<r2)return false}return true})}
  {const OV=(X&&X.ovr)||{},LYS=X&&X.layers&&X.layers.length?X.layers:DEFLY,out=[];LI=new Map(LYS.map((l,i)=>[l.id,i]));HID=new Set(LYS.filter(l=>l.hide).map(l=>l.id));
    for(const q0 of objD){let q=q0;const o=q0.key&&OV[q0.key];if(o){if(o.del)continue;q=Object.assign({},q0);
      if(o.px!=null){const dx=o.px-q0.x,dy=o.py-(q0.cy!=null?q0.cy:q0.y);q.x+=dx;q.y+=dy;if(q.cy!=null)q.cy+=dy}
      if(o.a!=null)q.ang=o.a;if(o.s!=null)q.os=o.s;if(o.v!=null)q.v=o.v;if(o.id)q.id=o.id;
      if(o.vs){if(q.st){const fam=Object.values(stamps).find(a=>Array.isArray(a)&&a.includes(q.st));if(fam)q.st=fam[(fam.indexOf(q.st)+o.vs)%fam.length]}else if(q.k===1&&q.roof){const RK=Object.keys(ROOF);q.roof=RK[(RK.indexOf(q.roof)+o.vs)%RK.length]}}}
      const ly=(o&&o.ly)||(q.mref&&q.mref.ly);q.ly=LI.has(ly)?ly:LI.has("base")?"base":LYS[0].id;out.push(q)}
    {const seen=new Set();for(const q of objD)if(q.key)seen.add(q.key);API.orph=Object.keys(OV).filter(k=>!seen.has(k))}
    objD=out}
  // 1.12: marcos dos biomas espalhados pela terra livre
  if(W.P.bio2&&(W.P.marcos??.5)>0){const rm=mulberry((W.seed^0x5a11)>>>0),MK={0:["menir","circulo","ruina","caverna"],1:["menir","caverna"],2:["termal","cristal"],3:["menir","ossada"],4:["ossada","ruina"],5:["ossada","menir"],6:["ruina"],7:["ruina","circulo"],8:["ossada","fenda"],9:["ruina","circulo"],11:["ossada","cristal"],12:["ossada","monolito"],13:["vulcao","termal","vulcao"],14:["cristal","termal"],15:["cristal","circulo","arvore","ilha"],16:["fenda","monolito","ossada"],17:["ossada","vulcao","ossada"],18:["monolito","cristal","ilha"],19:["arvore","ilha","ilha"],20:["cogumelo","cogumelo","circulo"]},
      CC={2:["#a8d0ea","#f0fbff"],11:["#e8e4dc","#ffffff"],14:["#a8d0ea","#f0fbff"],15:["#7f6ad8","#c4b6ff"],18:["#d050c0","#ffa8ef"]},esp=Math.round(150*SC/Math.sqrt(W.P.marcos??.5)),ly=LI.has("base")?"base":LYS[0].id;
    for(let gy=esp/2;gy<WY;gy+=esp)for(let gx=esp/2;gx<WX;gx+=esp){const x=gx+(rm()-.5)*esp*.7,y=gy+(rm()-.5)*esp*.7,bb=W.bAt(x,y),L=MK[bb];if(!L||rm()>(bb>=13?.55:.22))continue;if(occAt(x,y)||sampleGrid(W.land,x,y)<.08)continue;const id=L[(rm()*L.length)|0],sy=y*TILT-eAt(x,y)*K;if(objD.some(o=>o.k===50&&Math.abs(o.x-x)<60&&Math.abs(o.y-sy)<40))continue;objD.push({k:50,x,y:sy,id,b:bb,s:.8+rm()*.5,v:rm(),cor:CC[bb],ly})}}
  // 1.14: praia detalhada: coqueiros e pedras na faixa de areia das costas quentes; naufragio na agua rasa
  if(W.P.bio2){const rp=mulberry((W.seed^0x77b1)>>>0),ly=LI.has("base")?"base":LYS[0].id;let nau=0;for(let i=0;i<5000*SC;i++){const x=rp()*WX,y=rp()*WY,L=sampleGrid(W.land,x,y);const bb=W.bAt(x,y);
      if(L>.02&&L<.1&&[4,5,6,9,10,19].includes(bb)&&!occAt(x,y)){const sy=y*TILT-eAt(x,y)*K;objD.push({k:0,x,y:sy,s:.8+rp()*.4,st:stamps.palm[(rp()*stamps.palm.length)|0],ly})}
      else if(nau<2&&L<-.04&&L>-.12&&rp()<.002){const sy=y*TILT;objD.push({k:50,x,y:sy,id:"naufragio",s:.9,v:rp(),ly});nau++}}}
  // 0.61: tudo o que o desenho espalha (arvores das matas, arbustos, juncos, pedras, arvores e arbustos colocados a mao) fica registrado em coordenadas do mundo para a grade
  {const D=[];const yW=(x,sy)=>{let y=sy/TILT;for(let k=0;k<4;k++)y=(sy+eAt(x,y)*K)/TILT;return y};for(const q of objD){if(q.x==null||q.y==null)continue;let t=null,r=0;const sc=q.s||1;
      if(q.k===0){t="arvore";r=(q.st&&q.st.lw?q.st.lw:34)*sc*.36}else if(q.k===12){t=q.st&&stamps.reed&&stamps.reed.includes(q.st)?"junco":"mato";r=(q.st&&q.st.lw?q.st.lw:20)*sc*.38}else if(q.k===11){t="pedra";r=(q.st&&q.st.lw?q.st.lw:18)*sc*(q.wide?.5:.4)}else if(q.k===30){t=q.v==="bush"?"mato":"arvore";r=(q.v==="bush"?8:12)*sc}else if(q.k===31){t="pedra";r=7*sc}
      if(!t)continue;D.push([t,q.x,yW(q.x,q.y),Math.max(1,r)])}W._DECO=D}
  objD.sort((a,b)=>(LI.get(a.ly)-LI.get(b.ly))||(a.y-b.y));const smoke=[];
  const seedQ=q=>{rngS=mulberry((Math.imul((q.x||0)*4|0,73856093)^Math.imul((q.y||0)*4|0,19349663)^q.k*83492791)>>>0)};
  const drawQ=(c,q,pk)=>{const _sc=q.man&&(q.k>=16&&q.k<=28||q.k<=8||q.k>=32)&&q.s&&q.s!==1,_os=q.os&&q.os!==1;if(_os){c.save();c.translate(q.x,q.y);c.scale(q.os,q.os);c.translate(-q.x,-q.y)}if(_sc){c.save();c.translate(q.x,q.y);c.scale(q.s,q.s);c.translate(-q.x,-q.y)}try{
    if(q.k===0){const w=34*q.s,h=38*q.s;c.drawImage(q.st,q.x-w/2,q.y-h*.9,w,h)}
    else if(q.k===1){drawBuilding(c,q.x,q.cy,q);if(q.smoke&&!pk)smoke.push([q.x,q.cy-q.H-q.R-2])}
    else if(q.k===2||q.k===3)drawBig(c,q);
    else if(q.k===4){if(q.fz==="palisade")drawPalisade(c,q.a,q.b,6);else if(q.fz==="hedge")drawHedge(c,q.a,q.b,3.6);else drawWall(c,q.a,q.b,5.5,q.fz)}
    else if(q.k===9)drawWaterWall(c,q.a,q.b,5.5,q.fz);
    else if(q.k===5&&q.fz==="asian"){drawAsian(c,q.x,q.y+2,{L:q.g?10:5,D:q.g?7:5,H:q.g?7:5,R:q.g?4:3,ang:0,roof:"jp",wall:"jpw",base:q.g?1:0})}
    else if(q.k===5){if(q.fz==="palisade")drawTower(c,q.x,q.y+2,q.g?4:3.4,q.g?11:9,q.g?5:4,ROOF.hide,WALL.wooddark,false);else if(q.fz==="hedge"){if(q.g){c.strokeStyle=INK;c.fillStyle="#5f7e35";c.lineWidth=.8;c.beginPath();c.arc(q.x,q.y-4,3.4,0,7);c.fill();c.stroke()}}else drawTower(c,q.x,q.y+2,q.g?4.4:3.8,q.g?12:9.5,q.g?6:0,ROOF.dark,q.fz==="sand"?WALL.sand:WALL.stone,!q.g)}
    else if(q.k===6){if(window.AtlasAssets){c.save();c.translate(q.x,q.y);c.scale(.8,.8);AtlasAssets.draw(c,0,0,"stall",q.race||"humano",((q.x*7+q.y)%10)/10,q.ang!=null?q.ang:-.2);c.restore()}}
    else if(q.k===7){if(window.AtlasAssets){c.save();c.translate(q.x,q.y);c.scale(.8,.8);AtlasAssets.draw(c,0,0,"well",q.race||"humano",.5,0);c.restore()}}
    else if(q.k===10)drawCliff(c,q.x,q.ty,q.w,q.h,rng);
    else if(q.k===11){const w=(q.wide?34:18)*q.s,h=(q.wide?24:14)*q.s;c.drawImage(q.st,q.x-w/2,q.y-h*.85,w,h)}
    else if(q.k===12){const w=20*q.s,h=15*q.s;c.drawImage(q.st,q.x-w/2,q.y-h*.85,w,h)}
    else if(q.k===13){if(q.ty&&window.AtlasAssets&&AtlasAssets.shipV)AtlasAssets.shipV(c,q.x,q.y,q.flip?2.8:.35,q.ty,q.big?.95:.65);else drawShip(c,q.x,q.y,q.big,q.flip)}
    else if(q.k===15)drawCrater(c,q.x,q.y,q.w,rng);else if(q.k===50)drawMarco(c,q.x,q.y,q,rng,stamps);else if(q.k===32)drawTent(c,q.x,q.y,q.race,q.s||1,false,q.flag);else if(q.k===33)drawTent(c,q.x,q.y,q.race,1,true);else if(q.k===34)drawFire(c,q.x,q.y);else if(q.k===35&&window.AtlasAssets)AtlasAssets.horse(c,q.x,q.y,["#6a4a2c","#b8a080","#3a2c22"][((q.x*3)|0)%3],((q.y|0)%2)?1:-1);else if(q.k===37){const cy=q.y+q.r*TILT*.9;c.strokeStyle="#5a4028";c.lineWidth=.8;c.beginPath();c.ellipse(q.x,cy,q.r,q.r*TILT,0,0,7);c.stroke();c.beginPath();c.ellipse(q.x,cy-2.2,q.r,q.r*TILT,0,0,7);c.stroke();c.beginPath();for(let k=0;k<18;k++){const a=k/18*6.2832,px=q.x+Math.cos(a)*q.r,py=cy+Math.sin(a)*q.r*TILT;c.moveTo(px,py);c.lineTo(px,py-3)}c.stroke()}else if(q.k===36){c.strokeStyle="#5a4028";c.lineWidth=.8;c.beginPath();c.moveTo(q.x,q.y);c.lineTo(q.x,q.y-5);c.moveTo(q.x-1.6,q.y-3.6);c.lineTo(q.x+1.6,q.y-3.6);c.stroke();c.fillStyle="#d8c9a0";c.beginPath();c.arc(q.x,q.y-5.6,1.1,0,7);c.fill()}else if(q.k===40&&window.AtlasAssets)AtlasAssets.draw(c,q.x,q.y,q.id,q.race,q.vv,q.ang);else if(q.k===26)drawArch(c,q.x,q.y,q.col,rng);else if(q.k===27)drawSpires(c,q.x,q.y,q.col,rng);else if(q.k===28)drawBoulders(c,q.x,q.y,stamps.rockc[q.st%stamps.rockc.length]);else if(q.k===31){const st=stamps.rocks[(q.y|0)%stamps.rocks.length],w=22*q.s,h=17*q.s;c.drawImage(st,q.x-w/2,q.y-h*.85,w,h)}else if(q.k===30){const M={oak:stamps.dec,pine:stamps.con,snowpine:stamps.snowpine,autumn:stamps.autumn,sakura:stamps.sakura,blossom:stamps.blossom,birch:stamps.birch,palm:stamps.palm,acacia:stamps.acacia,willow:stamps.willow,jungle:stamps.jungle,dead:stamps.dead,cactus:stamps.cactus,bush:stamps.bush,bare:stamps.bare},ar=M[q.v]||stamps.dec,st=ar[((q.x*7+q.y*13)|0)%ar.length],w=st.width*q.s,h=st.height*q.s;c.drawImage(st,q.x-w/2,q.y-h*.9,w,h)}else if(q.k===16)drawRuin(c,q.x,q.y,rng);else if(q.k===17)drawStones(c,q.x,q.y,rng);else if(q.k===18)drawTotem(c,q.x,q.y);else if(q.k===20)drawCave(c,q.x,q.y,q.snow,rng);else if(q.k===21)drawWatch(c,q.x,q.y);else if(q.k===22)drawCamp(c,q.x,q.y,q.race,rng);else if(q.k===23)drawGraves(c,q.x,q.y,q.race);else if(q.k===24)drawShrine(c,q.x,q.y,q.race);else if(q.k===25)drawMine(c,q.x,q.y);else if(q.k===19)drawTorii(c,q.x,q.y);
    else if(q.k===41){const U=(X&&X.uimg||{})[q.u];if(U&&U.img.complete&&U.img.naturalWidth){const kk=.16;c.save();c.translate(q.x,q.y);c.rotate(q.ang||0);c.drawImage(U.img,-U.w*kk/2,-U.h*kk*U.base,U.w*kk,U.h*kk);c.restore()}}
    else if(q.k===8){c.save();c.translate(q.x,q.y);c.scale(.82,.82);c.translate(-q.x,-q.y);drawMill(c,q.x,q.y,q.rot);c.restore()}}finally{if(_sc)c.restore();if(_os)c.restore()}};
  for(const q of objD){if(HID.has(q.ly))continue;seedQ(q);drawQ(c,q)}
  {const sel=q=>q.key||q.mref,BIG=q=>q.k===41?60:q.k===0?26:q.k===11||q.k===12?20:q.k===1?30:q.k===3?110:q.k===2?70:q.k===40?60:50;let PK=null;
    API.pick=(sx,sy)=>{sx-=MX;sy-=MY;if(!PK){PK=document.createElement("canvas");PK.width=PK.height=3}const pc=PK.getContext("2d",{willReadFrequently:true});
      for(let i=objD.length-1;i>=0;i--){const q=objD[i];if(!sel(q)||HID.has(q.ly))continue;const b=BIG(q)*(q.os||1)*(q.man&&q.s||1);if(Math.abs(q.x-sx)>b||sy>q.y+14||sy<q.y-b*1.7)continue;pc.setTransform(1,0,0,1,0,0);pc.clearRect(0,0,3,3);pc.setTransform(1,0,0,1,1-sx,1-sy);seedQ(q);drawQ(pc,q,true);if(pc.getImageData(1,1,1,1).data[3]>40)return q}return null};
    const SC_=new Map();API.sil=q=>{if(SC_.has(q))return SC_.get(q);const b=BIG(q)*(q.os||1)*(q.man&&q.s||1),W_=Math.ceil(b*2)+8,H_=Math.ceil(b*1.7+20)+8,sc=document.createElement("canvas");sc.width=W_;sc.height=H_;const sx_=sc.getContext("2d");sx_.translate(b+4-q.x,b*1.7+4-q.y);seedQ(q);drawQ(sx_,q,true);
      let x0=W_,x1=0;{const d=sx_.getImageData(0,0,W_,H_).data;for(let y=0;y<H_;y+=2)for(let x=0;x<W_;x++)if(d[(y*W_+x)*4+3]>40){if(x<x0)x0=x;if(x>x1)x1=x}}
      const mk=(col,r)=>{const oc=document.createElement("canvas");oc.width=W_;oc.height=H_;const ox=oc.getContext("2d");for(let a2=0;a2<16;a2++)ox.drawImage(sc,Math.cos(a2*.3927)*r,Math.sin(a2*.3927)*r);ox.globalCompositeOperation="source-in";ox.fillStyle=col;ox.fillRect(0,0,W_,H_);ox.globalCompositeOperation="destination-out";ox.drawImage(sc,0,0);return oc};
      const r={w:Math.max(4,x1-x0),sel:mk("#f0c060",2),hov:mk("rgba(255,236,190,.85)",1.3),ghost:sc,x:q.x-b-4+MX,y:q.y-b*1.7-4+MY};SC_.set(q,r);return r};
    API.objs=objD}
  rngS=mulberry((W.seed^99)>>>0);for(const s of smoke)drawSmoke(c,s[0],s[1],rng);
  const DECO=(X&&X.deco)||{},TL=(X&&X.labs)||{},RF=RFONTS[DECO.font]||RFONTS.fell,OVK=JSON.stringify([TL,DECO.font||"",DECO.fs||1]);if(CACHE.ov&&CACHE.ovk!==OVK)CACHE.ov=null;
  if(!CACHE.ov){rngS=mulberry((W.seed^777)>>>0);const ovc=document.createElement("canvas");ovc.width=MW;ovc.height=MH;const c=ovc.getContext("2d");c.lineCap="round";CACHE.ovk=OVK;const LB=[];CACHE.labs=LB;
  // 6. rotulos
  towns.forEach((t,i)=>{const p=pj(t.x,t.y),ov=TL[i]||{},major=i===0||t.kind==="town",nm=ov.name||t.name;if(ov.hide){LB.push({kind:"town",i,hidden:1,name:nm});return}const x=ov.x!=null?ov.x:clamp(p[0],110,MW-130),y=ov.y!=null?ov.y:clamp(p[1]-(i===0?t.core*.72+44:t.core*.55+30),24,MH-20),sc=(DECO.fs||1)*(ov.fs||1);
    banner(c,x,y,nm,major,rng,RF,sc);c.font=Math.round((major?17:13)*sc)+"px "+RF;const w=c.measureText(nm.toUpperCase()).width+(major?74:30),hh=major?26:20;LB.push({kind:"town",i,name:nm,p:[x,y],box:[x-w/2+MX,y-hh/2+MY,x+w/2+12+MX,y+hh/2+MY]})});
  // 7. nuvens em gravura
  if(P.clouds>0){const puffs=[],per=2*(MW+MH),cl=P.clouds*1.5;
    for(let s=0;s<per;s+=44){let x,y,nx,ny;if(s<MW){x=s;y=0;nx=0;ny=1}else if(s<MW+MH){x=MW;y=s-MW;nx=-1;ny=0}else if(s<2*MW+MH){x=2*MW+MH-s;y=MH;nx=0;ny=-1}else{x=0;y=per-s;nx=1;ny=0}
      const dc=Math.min(Math.hypot(x,y),Math.hypot(MW-x,y),Math.hypot(x,MH-y),Math.hypot(MW-x,MH-y));
      const d=cl*(fbm(s/230+4,7,3)*190-30+120*Math.exp(-dc/230));if(d<22)continue;
      for(let r=-10;r<d;r+=30+rng()*14){const t=clamp(r/Math.max(d,60),0,1),w=lerp(170,84,t)*(.8+rng()*.4);
        puffs.push({r:r+rng()*10,x:x+nx*r+(rng()-.5)*40,y:y+ny*r+(rng()-.5)*26,w,h:w*(.55+rng()*.12),t})}}
    puffs.sort((a,b)=>a.r-b.r||a.y-b.y);
    for(const p of puffs){const t=p.t,m=(a,b)=>Math.round(lerp(a,b,t));puff(c,p.x,p.y,p.w,p.h,["rgb("+m(158,212)+","+m(158,209)+","+m(142,194)+")","rgb("+m(92,128)+","+m(94,128)+","+m(80,112)+")"],rng)}}
  CACHE.ov=ovc}
  c.drawImage(CACHE.ov,0,0);
  // textos livres
  {const LB=(CACHE.labs||[]).slice();for(const t of (X&&X.texts)||[]){if(!t||!t.t)continue;const p=pj(t.x,t.y),fs=t.fs||18,F=RFONTS[t.font]||RF;c.save();c.translate(p[0],p[1]);c.rotate((t.ang||0)*Math.PI/180);c.font=(t.it?"italic ":"")+fs+"px "+F;c.textAlign="center";c.textBaseline="middle";const lines=String(t.t).split("\n"),lh=fs*1.15,w_=Math.max(...lines.map(l=>c.measureText(l).width));
    lines.forEach((l,k)=>{const y=(k-(lines.length-1)/2)*lh,L2=t.caps?l.toUpperCase():l;if(t.halo!==false){c.lineWidth=Math.max(2.5,fs*.22);c.strokeStyle="rgba(240,230,200,.9)";c.lineJoin="round";c.strokeText(L2,0,y)}c.fillStyle=t.col||"#3a2c1b";c.fillText(L2,0,y)});c.restore();const hh=lh*lines.length/2;LB.push({kind:"t",ref:t,box:[p[0]-w_/2-3+MX,p[1]-hh+MY,p[0]+w_/2+3+MX,p[1]+hh+MY]})}API.labs=LB}
  // 8. envelhecimento e grao
  const vg=c.createRadialGradient(MW/2,MH/2,MH*.45,MW/2,MH/2,MW*.75);vg.addColorStop(0,"rgba(70,45,10,0)");vg.addColorStop(1,"rgba(70,45,10,.3)");c.fillStyle=vg;c.fillRect(0,0,MW,MH);
  const gn=CACHE.gn||document.createElement("canvas");if(!CACHE.gn){CACHE.gn=gn;gn.width=gn.height=160;const gx=gn.getContext("2d"),gd=gx.createImageData(160,160);
  for(let i=0;i<gd.data.length;i+=4){const v=150+rng()*105;gd.data[i]=v;gd.data[i+1]=v*.97;gd.data[i+2]=v*.9;gd.data[i+3]=255}gx.putImageData(gd,0,0)}
  c.globalCompositeOperation="multiply";c.globalAlpha=.34;c.fillStyle=c.createPattern(gn,"repeat");c.fillRect(0,0,MW,MH);c.globalAlpha=1;c.globalCompositeOperation="source-over";
  c.restore();
  moldura(c,MX,MY,MW,MH,DECO.frame||"");
  if(DECO.title!==false){c.font="30px "+RF;c.textAlign="center";c.textBaseline="middle";c.fillStyle="#1d160d";
  const title=(DECO.titleText||P.title||("Região de "+(towns[0]?towns[0].name:"Atlas"))).toUpperCase();c.fillText(title,CW/2,31);const tw=c.measureText(title).width/2+22;
  for(const s of[-1,1])poly(c,[[CW/2+s*tw,24],[CW/2+s*tw+6,31],[CW/2+s*tw,38],[CW/2+s*tw-6,31]],"#a8352a")}
  return objD.length};
  const n=compose(P.objs,(P.edits||[]).filter(e=>e.t==="erase"),{ovr:P.ovr,layers:P.layers,labs:P.tlab,deco:P.deco,texts:P.texts,uimg:P.uimg});
  return Object.assign(API,{n,compose,b:W.B.filter(b=>b.k===1).length,YB,project:(x,y)=>[x+MX,y*TILT-E[clamp(y|0,0,WY-1)*WX+clamp(x|0,0,WX-1)]*K+MY]});
}

// miniatura de um objeto para o catalogo (desenhada com as mesmas funcoes do mapa)
function objThumb(v,stamps,S){S=S||72;const cv=document.createElement("canvas");cv.width=cv.height=S;const c=cv.getContext("2d"),rng=mulberry(hashStr(v)),k=S/72;c.scale(k,k);c.lineCap="round";c.lineJoin="round";
  const T={oak:stamps.dec,pine:stamps.con,snowpine:stamps.snowpine,autumn:stamps.autumn,sakura:stamps.sakura,blossom:stamps.blossom,birch:stamps.birch,palm:stamps.palm,acacia:stamps.acacia,willow:stamps.willow,jungle:stamps.jungle,dead:stamps.dead,cactus:stamps.cactus,bush:stamps.bush,bare:stamps.bare};
  const grey=["#b9b3a2","#77705f","#d6d0c0"],sand=["#c9a06c","#8c6a44","#e0c494"];
  const sc=(f,z,x,y)=>{c.save();c.translate(x,y);c.scale(z,z);c.translate(-x,-y);f();c.restore()};
  if(T[v]){const st=T[v][0],z=Math.min(60/st.width,62/st.height);c.drawImage(st,36-st.width*z/2,66-st.height*z,st.width*z,st.height*z)}
  else if(v==="rock"){const st=stamps.rocks[6];c.drawImage(st,10,22,52,40)}
  else if(v==="boulders")c.drawImage(stamps.rockc[0],2,18,68,48);
  else if(v==="arch")sc(()=>drawArch(c,36,52,grey,rng),1.3,36,52);
  else if(v==="spires")sc(()=>drawSpires(c,36,54,sand,rng),1.5,36,54);
  else if(v==="volcano"){c.fillStyle="rgba(30,25,10,.3)";c.beginPath();c.ellipse(36,62,32,7,0,0,7);c.fill();const g=c.createLinearGradient(8,0,64,0);g.addColorStop(0,"#6e5e54");g.addColorStop(1,"#3a302c");c.fillStyle=g;c.strokeStyle=INK;c.lineWidth=1;c.beginPath();c.moveTo(4,62);c.quadraticCurveTo(24,52,31,30);c.lineTo(41,30);c.quadraticCurveTo(48,52,68,62);c.closePath();c.fill();c.stroke();
    c.strokeStyle="rgba(30,20,15,.5)";c.lineWidth=.6;for(let i=0;i<9;i++){const x=12+i*6;c.beginPath();c.moveTo(36+(x-36)*.2,32);c.lineTo(x,60);c.stroke()}c.strokeStyle="#e2632a";c.lineWidth=1.8;c.beginPath();c.moveTo(34,31);c.quadraticCurveTo(30,46,22,58);c.stroke();sc(()=>drawCrater(c,36,30,40,rng),.8,36,30)}
  else if(v==="mesa"){const g=c.createLinearGradient(0,26,0,60);g.addColorStop(0,"#d8aa76");g.addColorStop(1,"#8c6a44");c.fillStyle=g;c.strokeStyle=INK;c.lineWidth=1;c.beginPath();c.moveTo(6,60);c.lineTo(14,30);c.lineTo(58,28);c.lineTo(66,60);c.closePath();c.fill();c.stroke();c.fillStyle="#e6c08a";c.beginPath();c.ellipse(36,29,23,6,0,0,7);c.fill();c.stroke();c.strokeStyle="rgba(80,45,20,.45)";c.lineWidth=.7;for(let y=38;y<60;y+=6){c.beginPath();c.moveTo(10,y);c.lineTo(62,y+1);c.stroke()}}
  else if(v==="pond"){c.fillStyle="#6f8d98";c.strokeStyle=INK;c.lineWidth=1.2;c.beginPath();c.ellipse(36,46,28,14,0,0,7);c.fill();c.stroke();c.strokeStyle="rgba(230,240,240,.6)";c.lineWidth=.8;c.beginPath();c.moveTo(22,44);c.lineTo(34,44);c.moveTo(38,50);c.lineTo(50,50);c.stroke()}
  else if(window.AtlasAssets&&AtlasAssets.NAME[v]){const sz=AtlasAssets.SIZE[v]||[12,16],z=Math.min(2.6,30/sz[0],52/(sz[1]+sz[0]*.35));sc(()=>AtlasAssets.draw(c,36,62,v,arguments[3]||"humano",.6,.4),z,36,62)}
  else if(v.slice(0,2)==="b_"){const race=arguments[3]||"humano",B_={b_hut:"hut",b_farm:"farm",b_town:"town",b_row:"row",b_rich:"rich",b_manor:"manor",b_tavern:"tavern",b_smithy:"smithy",b_barn:"barn",b_shed:"shed"}[v];
    if(B_){const o=mkHouse(race,B_,mulberry(hashStr(v+race)),.35);o.wing=null;const z=Math.min(3,52/(o.L+o.D*.6));sc(()=>drawBuilding(c,36,46,o),z,36,46)}
    else if(v==="b_temple")sc(()=>drawBig(c,{k:2,x:36,y:50,race,v:.2,sz:1}),1.25,36,50);else if(v==="b_castle")sc(()=>drawBig(c,{k:3,x:36,y:56,race,v:.6,sz:1}),.85,36,56);
    else if(v==="b_tower")sc(()=>drawTower(c,36,56,4.4,12,6,ROOF.dark,WALL.stone,false),2.6,36,56);else if(v==="b_mill")sc(()=>drawMill(c,36,54,.4),2,36,54);
    else if(v==="b_tent")sc(()=>drawTent(c,36,52,race,1,false,true),3.6,36,52);else if(v==="b_cmd")sc(()=>drawTent(c,34,54,race,1,true),2.2,34,54);else if(v==="b_fire")sc(()=>drawFire(c,36,50),6,36,50);
    else if(v==="b_stall")sc(()=>AtlasAssets.draw(c,36,52,"stall",race,.1,-.2),4.4,36,52);
    else if(v==="b_well")sc(()=>AtlasAssets.draw(c,36,56,"well",race,.5,0),3.6,36,56)}
  else sc(()=>{const x=36,y=50;if(v==="cave")drawCave(c,x,y,false,rng);else if(v==="ruin")drawRuin(c,x,y,rng);else if(v==="stones")drawStones(c,x,y,rng);else if(v==="totem")drawTotem(c,x,y);else if(v==="torii")drawTorii(c,x,y);else if(v==="watch")drawWatch(c,x,y);else if(v==="camp")drawCamp(c,x,y,"humano",rng);else if(v==="graves")drawGraves(c,x,y,"humano");else if(v==="shrine")drawShrine(c,x,y,"humano");else if(v==="mine")drawMine(c,x,y)},{watch:1.65,totem:2.2,shrine:2.6,graves:2.6,stones:2.4,torii:1.9,camp:2.2,ruin:2,cave:2.2,mine:2.2}[v]||2,36,v==="watch"||v==="totem"||v==="torii"?66:52);
  return cv}

const DEFLY=[{id:"chao",name:"Chão"},{id:"base",name:"Principal"},{id:"frente",name:"Frente"}];
// moldura do mapa: ornamentada (faixa com regua e cantos), dupla, simples ou nenhuma
function moldura(c,MX,MY,MW,MH,tipo){if(tipo==="nenhum")return;c.save();c.strokeStyle=INK;
  if(tipo==="simples"){c.lineWidth=2;c.strokeRect(MX-.5,MY-.5,MW+1,MH+1);c.restore();return}
  if(tipo==="dupla"){c.lineWidth=2;c.strokeRect(MX-.5,MY-.5,MW+1,MH+1);c.lineWidth=.8;c.strokeRect(MX-6.5,MY-6.5,MW+13,MH+13);c.restore();return}
  const B=14,x0=MX-B,y0=MY-B,w=MW+2*B,hh=MH+2*B;c.fillStyle="#d9c79c";c.fillRect(x0,y0,w,B);c.fillRect(x0,MY+MH,w,B);c.fillRect(x0,MY,B,MH);c.fillRect(MX+MW,MY,B,MH);
  // regua: casas alternadas na faixa
  const passo=24;c.fillStyle="#3a2c1b";for(let x=MX,k=0;x<MX+MW;x+=passo,k++){if(k%2)continue;const L=Math.min(passo,MX+MW-x);c.fillRect(x,y0+B-5,L,3);c.fillRect(x,MY+MH+2,L,3)}
  for(let y=MY,k=0;y<MY+MH;y+=passo,k++){if(k%2)continue;const L=Math.min(passo,MY+MH-y);c.fillRect(x0+B-5,y,3,L);c.fillRect(MX+MW+2,y,3,L)}
  c.lineWidth=2.2;c.strokeRect(x0+.5,y0+.5,w-1,hh-1);c.lineWidth=1.4;c.strokeRect(MX-.5,MY-.5,MW+1,MH+1);c.lineWidth=.7;c.strokeRect(x0+3.5,y0+3.5,w-7,hh-7);
  for(const [cx,cy] of [[x0,y0],[x0+w-B,y0],[x0,y0+hh-B],[x0+w-B,y0+hh-B]]){c.fillStyle="#efe4c6";c.fillRect(cx,cy,B,B);c.strokeRect(cx+.5,cy+.5,B-1,B-1);const m=B/2;c.fillStyle="#a8352a";c.beginPath();c.moveTo(cx+m,cy+2.5);c.lineTo(cx+B-2.5,cy+m);c.lineTo(cx+m,cy+B-2.5);c.lineTo(cx+2.5,cy+m);c.closePath();c.fill()}
  c.restore()}
window.AtlasGen={DEFLY,sampleGrid,objThumb,mkHouse,kit:{drawMod,moldura,drawRockMass,drawFlat,mixc,drawBuilding0,drawMound,drawBuilding,drawHouseA,drawHouse,drawBig,drawTent,drawFire,drawTower,drawWall,drawWaterWall,drawPalisade,drawHedge,drawAsian,drawRound,drawShip,drawMill,drawSmoke,drawWatch,drawTorii,drawPagoda,drawShikhara,drawTotem,drawPyramid,onion,poly,banner,puff,CUL,ROOF,WALL,INK,SPEC,TENT},CULTURES:[["europa","Europa medieval"],["leste","Leste asiático (Japão, China)"],["sul","Sul da Ásia (Índia)"],["meso","Mesoamérica"],["estepe","Estepes"],["eslava","Leste europeu (eslavos)"],["mediter","Mediterrâneo"],["antigo","Mundo antigo (Egito, Bizâncio)"],["celta","Terras celtas"],["andes","Andes"],["fantasia","Fantasia (gnomos, elfos, anões, piratas)"],["industrial","Era do vapor (steampunk)"],["piratas","Costa pirata"],["misto","Mundo misto"]],BIOMES,RACES,RACES0,RACE_PT,simp,generate,render,makeStamps,mulberry,hashStr,setScale,MX,MY,TILT,G,NAMES,get CW(){return CW},get CH(){return CH},get MW(){return MW},get MH(){return MH},get WX(){return WX},get WY(){return WY},get SC(){return SC}};
})();
