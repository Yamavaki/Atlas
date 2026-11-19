/* Atlas - biblioteca de construcoes e detalhes (GPL-3.0).
   Cada construcao e desenhada no estilo da cultura escolhida (forma, telhado, parede).
   draw(c,x,y,id,race,v,ang): x,y = centro da base na tela; v = variacao 0..1; ang = giro (radianos). */
(function(){
"use strict";
const A=window.AtlasGen,K=A.kit,TILT=A.TILT,INK=K.INK,CUL=K.CUL,ROOF=K.ROOF,WALL=K.WALL,poly=K.poly;
ROOF.arcane=["#6a4fa0","#47336f"];ROOF.copper=["#5f9a86","#3d6b5b"];ROOF.black=["#4a4646","#2e2b2b"];
WALL.marble=["#f4f1ea","#cbc6ba"];
ROOF.rust=["#b0612e","#7a3f1c"];ROOF.iron=["#6d7176","#45484c"];ROOF.patch=["#6e5a44","#463828"];WALL.iron=["#7c8086","#54575c"];WALL.rust=["#a8623a","#74401f"];WALL.soot=["#7e5546","#553529"];WALL.tar=["#5e4a36","#3b2d20"];WALL.shipwood=["#8b6a44","#5f472c"];WALL.violet=["#b9aed6","#857aa6"];
const clamp=(v,a,b)=>v<a?a:v>b?b:v,lerp=(a,b,t)=>a+(b-a)*t;
const LIST=[
 ["Cívicos",[["townhall","Prefeitura"],["guild","Casa de guilda"],["bank","Casa de câmbio"],["court","Tribunal"],["prison","Prisão"],["castle","Castelo / palácio"],["mansion","Palacete com jardim"],["hospital","Enfermaria"],["barracks","Quartel"],["trainingyard","Pátio de treino"],["gatehouse","Torre de portão"],["clocktower","Torre do relógio"],["guardpost","Posto de guarda"],["aqueduct","Aqueduto"]]],
 ["Fé e saber",[["cathedral","Catedral"],["chapel","Capela"],["monastery","Mosteiro"],["library","Biblioteca"],["university","Universidade"],["observatory","Observatório"],["school","Escola"],["obelisk","Obelisco"],["wayshrine","Oratório"],["mausoleum","Mausoléu"]]],
 ["Comércio",[["markethall","Mercado coberto"],["inn","Estalagem"],["shop","Loja"],["bakery","Padaria"],["alchemist","Alquimista"],["warehouse","Armazém"],["stall","Barraca de feira"],["markettent","Tenda de feira"],["goods","Cestos e mercadorias"]]],
 ["Ofícios",[["smithy","Ferraria"],["stable","Estábulo"],["watermill","Moinho d'água"],["tannery","Curtume"],["brewery","Cervejaria"],["sawmill","Serraria"],["granary","Celeiro"],["dovecote","Pombal"],["beehives","Colmeias"],["woodpile","Pilha de lenha"],["pottery","Olaria"],["dyeworks","Tinturaria"],["winery","Vinícola"],["postmill","Moinho de vento de madeira"],["quarry","Pedreira"],["mine","Entrada de mina"]]],
 ["Porto",[["lighthouse","Farol"],["shipwright","Estaleiro"],["fishery","Pesqueiro"],["crane","Guindaste do cais"],["ship","Navio"],["boat","Barco"],["cargo","Carga do cais"]]],
 ["Lazer",[["arena","Arena"],["theater","Teatro"],["baths","Termas"],["garden","Jardim com coreto"],["gazebo","Coreto"],["marketcross","Cruzeiro"],["maypole","Mastro de festa"],["flowerbed","Canteiro de flores"]]],
 ["Fantasia",[["wizard","Torre de mago"],["arcane","Círculo arcano"],["portal","Portal arcano"],["eldertree","Árvore anciã"],["dragonstatue","Estátua de dragão"],["crystal","Cristal flutuante"],["golem","Golem de pedra"],["griffin","Estábulo de grifos"]]],
 ["Steampunk",[["factory","Fábrica com chaminés"],["smokestack","Chaminé de fábrica"],["gasometer","Gasômetro"],["boiler","Caldeira a vapor"],["pipes","Encanamento"],["scrap","Monte de sucata"],["gearwork","Engrenagem gigante"],["airship","Dirigível ancorado"]]],
 ["Piratas",[["hullhouse","Casa de casco virado"],["wreck","Navio naufragado"],["cannon","Canhão"],["jollyroger","Bandeira pirata"],["crowsnest","Torre de vigia"],["treasure","Baú do tesouro"]]],
 ["Detalhes",[["statue","Estátua"],["fountain","Fonte"],["well","Poço"],["gallows","Forca"],["cart","Carroça"],["wagon","Carruagem"],["crates","Caixas e barris"],["haystack","Monte de feno"],["ruinhouse","Casa abandonada"],["scarecrow","Espantalho"],["stairs","Escadaria de pedra"],["lamp","Poste de luz"],["bench","Banco"]]]];
const NAME={};for(const [,it] of LIST)for(const [k,n] of it)NAME[k]=n;
// ---------- estilo por cultura ----------
// kit do gerador com registro de contorno
const KR=Object.create(K);
for(const n of["drawHouseA","drawAsian","drawFlat","drawBuilding"])KR[n]=(c,x,y,o)=>{if(REC){const st=o.form==="stilt"?3:0;if(n==="drawAsian"){const e=1.5+o.L*.06;regS("cx",x,y,o.L+1.5,o.D+1.5,(o.H||0)+(o.base||0),o.ang||0);regS("cx",x,y,o.L+2*e+1,o.D+2*e+1,Math.max(3,o.R||0)+1.5,o.ang||0,(o.H||0)+(o.base||0)-1)}else regS("cx",x,y,o.L+.8,o.D+.8,(o.H||0)+(o.R||0)+st+(o.base||0),o.ang||0)}return K[n](c,x,y,o)};
KR.drawRound=(c,x,y,r,H,R,o)=>{if(REC)regS("rd",x,y,r*2,r*2,H+R);return K.drawRound(c,x,y,r,H,R,o)};
KR.drawMound=(c,x,y,o)=>{if(REC){const r=(o.L+o.D)/3.2;regS("rd",x,y,r*2,r*2,o.H*.9)}return K.drawMound(c,x,y,o)};
KR.drawTent=(c,x,y,race,s,big,flag)=>{if(REC)regS("rd",x,y,9*s*(big?1.9:1),9*s*(big?1.9:1),6*s*(big?1.9:1));return K.drawTent(c,x,y,race,s,big,flag)};
KR.drawShikhara=(c,x,y,w)=>{if(REC)regS("cx",x,y,w*1.5,w*1.5,w*3.4,.7854);return K.drawShikhara(c,x,y,w)};
KR.drawTotem=(c,x,y)=>{if(REC)regS("rd",x,y,2.4,2.4,10);return K.drawTotem(c,x,y)};
KR.drawRockMass=(c,x,y,o)=>{if(REC)regS("rd",x,y+3,24*(o.s||1),24*(o.s||1),13*(o.s||1));return K.drawRockMass(c,x,y,o)};
KR.drawWall=(c,p,q,h,fz)=>{if(REC)regP([p,q],0,h);return K.drawWall(c,p,q,h,fz)};

const ST=race=>{const C=CUL[race]||CUL.humano,f=C.form;return {race,C,form:f,asian:f==="asian",flat:f==="flat",low:f==="round"||f==="yurt"||f==="mound"||f==="stilt",roof:C.rf,wall:C.st,roofs:C.roof,walls:C.wall}};
const RF=k=>Array.isArray(k)?k:ROOF[k]||ROOF.dark,WL=k=>Array.isArray(k)?k:WALL[k]||WALL.stone;
function hall(c,x,y,L,D,H,s,o){o=o||{};if(REC){const an=(o.ang||0)+(o.exact?0:.34);if(s.asian&&!s.flat){const e=1.5+L*.06,R=Math.max(4,D*.42),b=o.base==null?1:o.base;regS("cx",x,y,L+1.5,D+1.5,H*.85+b,an);regS("cx",x,y,L+2*e+1,D+2*e+1,R+1.5,an,H*.85+b-1)}else regS("cx",x,y,L+.8,D+.8,s.flat?H*1.05:H+(o.R||D*(s.race==="elfo"?.75:.55)),an)}const ang=(o.ang||0)+(o.exact?0:.34),roof=o.roof||s.roof,wall=o.wall||s.wall;
  if(s.flat)return KR.drawFlat(c,x,y,{L,D,H:H*1.05,ang,wall,win:1,dome:o.dome,domeCol:o.domeCol});
  if(s.asian)return KR.drawAsian(c,x,y,{L,D,H:H*.85,R:Math.max(4,D*.42),ang,roof:roof==="sandtop"?"jp":roof,wall,base:o.base==null?1:o.base});
  return KR.drawHouseA(c,x,y,{L,D,H,R:o.R||D*(s.race==="elfo"?.75:.55),ang,roof:roof==="sandtop"?"dark":roof,wall:wall==="felt"?"wood":wall,win:1,door:o.door||2,timber:o.timber})}
// angulo do asset que esta sendo desenhado (sem o giro fixo de .34): torres quadradas e pagodes giram junto
let ANG_=0,ESP_=false;
// assets cujo lado +u tem funcao (roda na agua, rampa do estaleiro): nunca espelhados
const SEMESP=new Set(["watermill","shipwright","crane","stairs","gatehouse","ship","boat","cart","wagon","castle","cathedral"]);
// torre quadrada girada: (x,y) e o canto da frente, como em K.drawTower; a .7854 fica de quina, igual ao desenho antigo
function torreQ(c,x,y,w,h,rh,roof,wall,cren,ang){if(REC){regS("cx",x,y-.43*w,w,w,h+(rh||0)+(cren?1:0),ang);const R1=REC;REC=null;try{return torreQ(c,x,y,w,h,rh,roof,wall,cren,ang)}finally{REC=R1}}const cy=y-.43*w,ca=Math.cos(ang),sa=Math.sin(ang),P=(a,b,z)=>[x+ca*a-sa*b,cy+(sa*a+ca*b)*TILT-(z||0)],hl=w*.5,lt=(nx,ny)=>clamp(.5+.62*(-nx*.85+ny*.3),0,1);c.lineJoin="round";
  prism(c,x,cy,w,w,h,ang,[wall[0],wall[1]],cren?"#b8b19f":null);const C4=[[-hl,-hl],[hl,-hl],[hl,hl],[-hl,hl]],F=[];for(let k=0;k<4;k++){const p1=C4[k],p2=C4[(k+1)%4],mu=(p1[0]+p2[0])/2,mv=(p1[1]+p2[1])/2;F.push([P(mu,mv)[1],p1,p2,mu,mv])}F.sort((p,q)=>p[0]-q[0]);
  if(cren){c.strokeStyle=INK;c.setLineDash([1.6,1.6]);c.lineWidth=1.6;for(const [,p1,p2] of F.slice(2)){const a=P(p1[0],p1[1],h+.8),b=P(p2[0],p2[1],h+.8);c.beginPath();c.moveTo(a[0],a[1]);c.lineTo(b[0],b[1]);c.stroke()}c.setLineDash([]);c.lineWidth=.8}
  else if(rh>0){const ap=P(0,0,h+rh);c.lineWidth=.8;for(const [,p1,p2,mu,mv] of F){const l=Math.hypot(mu,mv)||1,wx=(ca*mu-sa*mv)/l,wy=(sa*mu+ca*mv)/l;poly(c,[P(p1[0],p1[1],h),P(p2[0],p2[1],h),ap],K.mixc(roof[1]||roof[0],roof[0],lt(wx,wy)),INK)}}
  const f=F[3],q=P(f[3]*1.01,f[4]*1.01,h*.62);c.fillStyle="#3a2c1b";c.fillRect(q[0]-.6,q[1]-2.2,1.2,2.2)}
function pagode(c,x,y,n,w,roofK,wallK,ang){if(REC)regS("cx",x,y,w,w,n*6.2+9,ang);for(let i=0;i<n;i++){const s=w*(1-i*.15);KR.drawAsian(c,x,y-i*6.2,{L:s,D:s,H:i?4.2:5,R:2.4+s*.12,ang,roof:roofK,wall:wallK})}
  c.strokeStyle=INK;c.lineWidth=1.1;const ty=y-(n-1)*6.2-4.2-2.4-w*.12*(1-(n-1)*.15);c.beginPath();c.moveTo(x,ty);c.lineTo(x,ty-7);c.stroke();c.fillStyle="#c9a24c";for(let k=0;k<3;k++){c.beginPath();c.ellipse(x,ty-1.5-k*1.8,1.3,.6,0,0,7);c.fill()}}
function tower(c,x,y,w,h,s,o){o=o||{};if(s.asian&&!o.plain)return pagode(c,x,y,Math.max(2,Math.round(h/7)),w*2.2,s.roof==="cn"||s.roof==="cny"?"cn":"jp","red",ANG_+.7854);
  const roof=RF(o.roof||(s.flat?"gold":s.roof==="sandtop"?"gold":s.roof)),wall=WL(o.wall||s.wall);torreQ(c,x,y,w,h,o.cren?0:(o.rh||w*(s.race==="elfo"?2.6:1.6)),roof,wall,!!o.cren,ANG_+.7854)}
// prisma (caixa) visto inclinado, com giro
function prism(c,x,y,L,D,H,ang,wall,top){if(REC)regS("cx",x,y,L,D,H,ang);const ca=Math.cos(ang),sa=Math.sin(ang),P=(a,b,h)=>[x+ca*a-sa*b,y+(sa*a+ca*b)*TILT-(h||0)],hl=L/2,hd=D/2,lt=(nx,ny)=>clamp(.5+.62*(-nx*.85+ny*.3),0,1);c.lineWidth=.75;c.lineJoin="round";
  for(const s of[-1,1]){if(ca*s>.02)poly(c,[P(-hl,s*hd),P(hl,s*hd),P(hl,s*hd,H),P(-hl,s*hd,H)],K.mixc(wall[1],wall[0],lt(-sa*s,ca*s)),INK);if(sa*s>.02)poly(c,[P(s*hl,-hd),P(s*hl,hd),P(s*hl,hd,H),P(s*hl,-hd,H)],K.mixc(wall[1],wall[0],lt(ca*s,sa*s)),INK)}
  poly(c,[P(-hl,-hd,H),P(hl,-hd,H),P(hl,hd,H),P(-hl,hd,H)],top||K.mixc(wall[0],"#ffffff",.2),INK);return P}
const shadow=(c,x,y,rx,ry)=>{if(SEMFX||REC)return;c.fillStyle="rgba(20,22,6,.28)";c.beginPath();c.ellipse(x+2.4,y+1,rx,ry,0,0,7);c.fill()};
const dome=(c,x,y,r,col)=>{if(REC)regS("rd",x,y,r*2,r*2,r);const g=c.createRadialGradient(x-r*.4,y-r*.6,r*.1,x,y-r*.2,r*1.1);g.addColorStop(0,K.mixc(col[0],"#ffffff",.35));g.addColorStop(1,col[1]);c.fillStyle=g;c.strokeStyle=INK;c.lineWidth=.8;c.beginPath();c.moveTo(x-r,y);c.bezierCurveTo(x-r,y-r*1.3,x+r,y-r*1.3,x+r,y);c.ellipse(x,y,r,r*TILT*.5,0,0,3.1416);c.closePath();c.fill();c.stroke();c.beginPath();c.moveTo(x,y-r*.98);c.lineTo(x,y-r*1.4);c.stroke()};
const flag=(c,x,y,h,col,wd)=>{if(REC&&h>0)regS("rd",x,y,.7,.7,h);c.strokeStyle="#3a2c1b";c.lineWidth=.8;c.beginPath();c.moveTo(x,y);c.lineTo(x,y-h);c.stroke();poly(c,[[x,y-h],[x+(wd||5),y-h+1.4],[x,y-h+3.2]],col,INK)};
const banner=(c,x,y,col)=>{poly(c,[[x-1.4,y],[x+1.4,y],[x+1.4,y+5],[x,y+4],[x-1.4,y+5]],col,INK)};
const glow=(c,x,y,r,col)=>{if(SEMFX||REC)return;const g=c.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,col);g.addColorStop(1,"rgba(0,0,0,0)");c.fillStyle=g;c.beginPath();c.arc(x,y,r,0,7);c.fill()};
const smoke=(c,x,y,col)=>{if(SEMFX||REC)return;for(let i=0;i<3;i++){const px=x+i*1.8,py=y-i*3.4,r=1.3+i*.7;c.fillStyle="#4a3d3f";c.beginPath();c.arc(px,py,r+.6,0,7);c.fill();c.fillStyle=col||"#c9b9b3";c.beginPath();c.arc(px,py,r,0,7);c.fill()}};
const crate=(c,x,y,s,col)=>{if(REC)regS("cx",x,y-1.2*s,3.4*s,3.4*s,3*s,.7854,0);const w=2.6*s;poly(c,[[x-w,y],[x,y+w*.5],[x,y+w*.5-w*1.1],[x-w,y-w*1.1]],col||"#a07a4a",INK);poly(c,[[x,y+w*.5],[x+w,y],[x+w,y-w*1.1],[x,y+w*.5-w*1.1]],"#7d5a33",INK);poly(c,[[x-w,y-w*1.1],[x,y+w*.5-w*1.1],[x+w,y-w*1.1],[x,y-w*1.6]],"#c49a62",INK)};
const barrel=(c,x,y,s)=>{if(REC)regS("rd",x,y,2.4*s,2.4*s,3*s);const r=1.7*s,h=3.6*s;c.fillStyle="#8a5e34";c.strokeStyle=INK;c.lineWidth=.6;c.beginPath();c.moveTo(x-r,y-h);c.lineTo(x-r,y);c.ellipse(x,y,r,r*.5,0,3.1416,0,true);c.lineTo(x+r,y-h);c.closePath();c.fill();c.stroke();c.fillStyle="#a8784a";c.beginPath();c.ellipse(x,y-h,r,r*.5,0,0,7);c.fill();c.stroke();c.strokeStyle="#3a2c1b";c.beginPath();c.moveTo(x-r,y-h*.3);c.lineTo(x+r,y-h*.3);c.moveTo(x-r,y-h*.75);c.lineTo(x+r,y-h*.75);c.stroke()};
const fence=(c,pts)=>{c.strokeStyle="#5a4028";c.lineWidth=.8;c.beginPath();pts.forEach((p,i)=>i?c.lineTo(p[0],p[1]-2.4):c.moveTo(p[0],p[1]-2.4));c.stroke();c.beginPath();for(const p of pts){c.moveTo(p[0],p[1]);c.lineTo(p[0],p[1]-3.2)}c.stroke()};
const horse=(c,x,y,col,f)=>{if(REC)regS("rd",x,y,3.4,3.4,3.4);f=f||1;c.fillStyle=col||"#6a4a2c";c.strokeStyle=INK;c.lineWidth=.5;c.beginPath();c.ellipse(x,y-2.6,2.6,1.3,0,0,7);c.fill();c.stroke();c.beginPath();c.moveTo(x+2*f,y-3.2);c.lineTo(x+3.6*f,y-5.2);c.lineTo(x+4.4*f,y-4.4);c.lineTo(x+2.6*f,y-2.4);c.fill();c.stroke();c.strokeStyle=col||"#6a4a2c";c.lineWidth=.7;c.beginPath();for(const dx of[-1.8,-1,1,1.8]){c.moveTo(x+dx,y-1.8);c.lineTo(x+dx,y)}c.stroke()};
// carroca em qualquer angulo
function cart(c,x,y,ang,load,covered,s){s=s||1;if(REC)regS("cx",x,y,7*s,4.8*s,(covered?8:5)*s,ang);const ca=Math.cos(ang),sa=Math.sin(ang),P=(a,b,h)=>[x+(ca*a-sa*b)*s,y+(sa*a+ca*b)*TILT*s-(h||0)*s];shadow(c,x,y,5*s,2.2*s);
  const hb=sa<0,Hs=()=>{if(covered||load==="horse"){const hp=P(7,0,0);horse(c,hp[0],hp[1],"#6a4a2c",ca>=0?1:-1);c.strokeStyle="#3a2c1b";c.lineWidth=.5;const a=P(3.5,0,1.8);c.beginPath();c.moveTo(a[0],a[1]);c.lineTo(hp[0],hp[1]-2.4);c.stroke()}};if(hb)Hs();
  for(const sd of[-1,1]){if(ca*sd<=0){const w=P(0,sd*2.6,1.6);c.fillStyle="#3a2c1b";c.beginPath();c.ellipse(w[0],w[1],1.6*s,1.6*s*Math.max(.35,Math.abs(ca)),0,0,7);c.fill()}}
  const pf=prism(c,x,y-1.6*s,7*s,4.6*s,1.6*s,ang,["#a07a4a","#6e5030"]);
  if(covered){const top=[P(-3.2,-2.3,3.2),P(3.2,-2.3,3.2),P(3.2,2.3,3.2),P(-3.2,2.3,3.2)];c.fillStyle="#efe6cb";c.strokeStyle=INK;c.lineWidth=.6;c.beginPath();const a=P(-3.2,0,8),b=P(3.2,0,8);c.moveTo(top[0][0],top[0][1]);c.quadraticCurveTo(a[0]-2*sa*s,a[1],top[3][0],top[3][1]);c.lineTo(top[2][0],top[2][1]);c.quadraticCurveTo(b[0]-2*sa*s,b[1],top[1][0],top[1][1]);c.closePath();c.fill();c.stroke();c.beginPath();c.moveTo(top[0][0],top[0][1]);c.quadraticCurveTo(a[0],a[1]-1,top[3][0],top[3][1]);c.stroke()}
  else if(load==="hay"){const m=P(0,0,4);c.fillStyle="#d8bf6a";c.strokeStyle=INK;c.lineWidth=.6;c.beginPath();c.ellipse(m[0],m[1],4*s,2.6*s,0,0,7);c.fill();c.stroke()}
  else if(load){const m=P(-1,0,3.2);crate(c,m[0],m[1]+2*s,s*.8);barrel(c,m[0]+3*s*ca,m[1]+2*s+3*s*sa*TILT,s*.7)}
  for(const sd of[-1,1]){if(ca*sd>0){const w=P(0,sd*2.6,1.6);c.fillStyle="#5a4028";c.strokeStyle=INK;c.lineWidth=.5;c.beginPath();c.ellipse(w[0],w[1],1.7*s,1.7*s*Math.max(.35,Math.abs(ca)),0,0,7);c.fill();c.stroke()}}
  if(!hb)Hs()}
// navio visto inclinado, apontando na direcao ang
function shipIso(c,x,y,ang,big,col){const s=big?1.25:.8,ca=Math.cos(ang),sa=Math.sin(ang),P=(a,b,h)=>[x+(ca*a-sa*b)*s,y+(sa*a+ca*b)*TILT*s-(h||0)*s];c.lineJoin="round";c.lineWidth=.75;
  c.strokeStyle="rgba(240,248,248,.6)";c.lineWidth=1;c.beginPath();const w0=P(-15,-6),w1=P(-17,0),w2=P(-15,6);c.moveTo(w0[0],w0[1]);c.quadraticCurveTo(w1[0],w1[1]+2,w2[0],w2[1]);c.stroke();c.lineWidth=.75;
  const N=12,deck=[],keel=[];for(let i=0;i<=N;i++){const t=i/N,a=lerp(-13,14,t),wd=Math.sin(Math.pow(t,.8)*3.1416)*4.6+(t<.2?1.6*(1-t/.2):0);deck.push([a,wd]);keel.push([a,wd*.55])}
  const side=sd=>{const pts=[];for(const [a,w] of deck)pts.push(P(a,sd*w,3.6));for(let i=keel.length-1;i>=0;i--)pts.push(P(keel[i][0],sd*keel[i][1],-.4));return pts};
  const vis=sd=>ca*sd>0?1:0;for(const sd of[-1,1])if(!vis(sd))poly(c,side(sd),"#5e4026",INK);
  const dk=[];for(const [a,w] of deck)dk.push(P(a,w,3.6));for(let i=deck.length-1;i>=0;i--)dk.push(P(deck[i][0],-deck[i][1],3.6));poly(c,dk,"#b0895a",INK);
  c.strokeStyle="rgba(70,45,20,.5)";c.lineWidth=.4;c.beginPath();for(let a=-10;a<12;a+=3){const p=P(a,-3.6,3.6),q=P(a,3.6,3.6);c.moveTo(p[0],p[1]);c.lineTo(q[0],q[1])}c.stroke();
  const cab=prism(c,...P(-10,0,3.6),5*s,7*s,3*s,ang,["#94693c","#6e4c2a"]);
  for(const sd of[-1,1])if(vis(sd)){poly(c,side(sd),"#7d5833",INK);c.strokeStyle="rgba(240,220,170,.35)";c.lineWidth=.5;c.beginPath();for(let i=0;i<=N;i++){const p=P(deck[i][0],sd*deck[i][1]*.88,2.2);i?c.lineTo(p[0],p[1]):c.moveTo(p[0],p[1])}c.stroke()}
  const masts=big?[-2,6]:[2];for(const m of masts){const b=P(m,0,3.6),t=P(m,0,big?28:19);c.strokeStyle=INK;c.lineWidth=1;c.beginPath();c.moveTo(b[0],b[1]);c.lineTo(t[0],t[1]);c.stroke();
    const sw=big?6.5:5,h1=big?(m<0?24:22):16,h2=big?9:7,q=[P(m+.6,-sw,h1),P(m+.6,sw,h1),P(m+1.6,sw,h2),P(m+1.6,-sw,h2)];c.fillStyle="#efe6cb";c.strokeStyle=INK;c.lineWidth=.6;c.beginPath();c.moveTo(q[0][0],q[0][1]);c.lineTo(q[1][0],q[1][1]);const mid=[(q[1][0]+q[2][0])/2+ca*2*s,(q[1][1]+q[2][1])/2+sa*2*s*TILT];c.quadraticCurveTo(mid[0],mid[1],q[2][0],q[2][1]);c.lineTo(q[3][0],q[3][1]);const mid2=[(q[3][0]+q[0][0])/2+ca*2*s,(q[3][1]+q[0][1])/2+sa*2*s*TILT];c.quadraticCurveTo(mid2[0],mid2[1],q[0][0],q[0][1]);c.fill();c.stroke();
    if(col){const cc=[(q[0][0]+q[2][0])/2,(q[0][1]+q[2][1])/2];c.fillStyle=col;c.beginPath();c.ellipse(cc[0],cc[1],2*s,2.2*s,0,0,7);c.fill()}
    const ft=P(m,0,big?31:21);flag(c,t[0],t[1],t[1]-ft[1]+2,"#a8352a",3.6)}}
function boat(c,x,y,ang){const ca=Math.cos(ang),sa=Math.sin(ang),P=(a,b,h)=>[x+ca*a-sa*b,y+(sa*a+ca*b)*TILT-(h||0)];const o=[],n=8;for(let i=0;i<=n;i++){const t=i/n,a=lerp(-5,5,t),w=Math.sin(t*3.1416)*1.9;o.push(P(a,w,1.2))}for(let i=n;i>=0;i--){const t=i/n,a=lerp(-5,5,t),w=Math.sin(t*3.1416)*1.9;o.push(P(a,-w,1.2))}
  c.strokeStyle="rgba(240,248,248,.55)";c.lineWidth=.8;c.beginPath();c.ellipse(x,y+.6,6,1.6,0,0,7);c.stroke();poly(c,o,"#7d5833",INK);const i0=[];for(let i=1;i<n;i++){const t=i/n;i0.push(P(lerp(-5,5,t),Math.sin(t*3.1416)*1.2,1.2))}for(let i=n-1;i>0;i--){const t=i/n;i0.push(P(lerp(-5,5,t),-Math.sin(t*3.1416)*1.2,1.2))}poly(c,i0,"#a8804e",null)}

// navios variados: tipo define casco, mastros e velas (cog, caravela, galeao, drakkar, junco, dhow, pirata, vapor)
const SHIPT={cog:{L:24,W:4.8,D:3.6,st:1,m:[[2,19,"sq"]],sail:"#efe6cb"},caravela:{L:26,W:4.4,D:3.6,st:1,m:[[-4,18,"lat"],[5,21,"lat"]],sail:"#efe6cb"},galeao:{L:34,W:5.6,D:4.6,st:2,m:[[-8,22,"sq"],[2,30,"sq"],[11,24,"sq"]],sail:"#efe6cb"},
  drakkar:{L:30,W:3.8,D:2.4,st:0,m:[[1,18,"sq"]],sail:"stripe",shields:1,oars:1,head:1},junco:{L:26,W:5.2,D:3.8,st:1,m:[[-5,18,"bat"],[5,22,"bat"]],sail:"#c8743a",hull:["#8a3a2a","#5e2618"]},dhow:{L:24,W:4.2,D:3.2,st:1,m:[[2,20,"lat"]],sail:"#f1e8d2"},
  pirata:{L:30,W:5.2,D:4.2,st:2,m:[[-5,25,"sq"],[6,27,"sq"]],sail:"#2a2624",skull:1,hull:["#4a3426","#2e2018"]},vapor:{L:30,W:5,D:4,st:1,m:[[-7,16,"sq"]],sail:"#b9ae98",funnel:1,paddle:1,hull:["#3e4044","#26282b"]}};
function shipV(c,x,y,ang,type,sc){if(REC){const T_=SHIPT[type]||SHIPT.cog;regS("cx",x,y,(T_.L+4)*(sc||1),T_.W*2.6*(sc||1),(Math.max(T_.D+3,...T_.m.map(q=>q[1]+4)))*(sc||1),ang)}const T=SHIPT[type]||SHIPT.cog,s=sc||1,ca=Math.cos(ang),sa=Math.sin(ang),P=(a,b,h)=>[x+(ca*a-sa*b)*s,y+(sa*a+ca*b)*TILT*s-(h||0)*s],L=T.L/2,HC=T.hull||["#7d5833","#5e4026"];c.lineJoin="round";c.lineWidth=.75;
  c.strokeStyle="rgba(240,248,248,.6)";c.lineWidth=1;c.beginPath();const w0=P(-L-2,-T.W*1.2),w1=P(-L-4,0),w2=P(-L-2,T.W*1.2);c.moveTo(w0[0],w0[1]);c.quadraticCurveTo(w1[0],w1[1]+2,w2[0],w2[1]);c.stroke();c.lineWidth=.75;
  const N=14,D=T.D,deck=[],keel=[];for(let i=0;i<=N;i++){const t=i/N,a=lerp(-L,L,t),wd=Math.sin(Math.pow(t,.8)*3.1416)*T.W+(t<.2&&!T.head?1.4*(1-t/.2):0),h=D+(T.head?Math.pow(Math.abs(t-.5)*2,3)*3:0)+(T.st&&t<.25?T.st*1.6*(1-t/.25):0);deck.push([a,wd,h]);keel.push([a,wd*.5])}
  const side=sd=>{const pts=[];for(const [a,w,h] of deck)pts.push(P(a,sd*w,h));for(let i=keel.length-1;i>=0;i--)pts.push(P(keel[i][0],sd*keel[i][1],-.4));return pts},vis=sd=>ca*sd>0?1:0;
  for(const sd of[-1,1])if(!vis(sd))poly(c,side(sd),HC[1],INK);
  const dk=[];for(const [a,w,h] of deck)dk.push(P(a,w*.92,Math.min(h,D)));for(let i=deck.length-1;i>=0;i--)dk.push(P(deck[i][0],-deck[i][1]*.92,Math.min(deck[i][2],D)));poly(c,dk,"#b0895a",INK);
  c.strokeStyle="rgba(70,45,20,.45)";c.lineWidth=.4;c.beginPath();for(let a=-L+3;a<L-2;a+=3){const p=P(a,-T.W*.8,D),q=P(a,T.W*.8,D);c.moveTo(p[0],p[1]);c.lineTo(q[0],q[1])}c.stroke();
  const DK=[];if(T.st)DK.push({d:P(-L*.72,0)[1],pre:1,f:()=>prism(c,...P(-L*.72,0,D),L*.32*s,T.W*1.4*s,(2.4+T.st*1.6)*s,ang,T.hull?[HC[0],HC[1]]:["#94693c","#6e4c2a"])});
  if(T.funnel)DK.push({d:P(2,0)[1],pre:1,f:()=>{const f=P(2,0,D);cyl(c,f[0],f[1],1.8*s,9*s,["#2e2e30","#141414"]);c.fillStyle="#a8352a";c.fillRect(f[0]-1.8*s,f[1]-8*s,3.6*s,1.4*s);for(let i=0;i<3;i++){c.fillStyle="rgba(150,145,140,.75)";c.beginPath();c.arc(f[0]+i*2*s,f[1]-11*s-i*3*s,(1.4+i*.8)*s,0,7);c.fill()}}});
  for(const [m,mh,kind] of T.m)DK.push({d:P(m,0)[1],f:()=>{const b=P(m,0,D),t=P(m,0,mh);c.strokeStyle=INK;c.lineWidth=1.1;c.beginPath();c.moveTo(b[0],b[1]);c.lineTo(t[0],t[1]);c.stroke();const sc_=T.sail==="stripe"?"#efe6cb":T.sail;
    if(kind==="sq"){const lv=mh>24?[[mh-2,mh*.62],[mh*.58,D+4]]:[[mh-2,D+5]];for(const [h1,h2] of lv){const sw=T.W*1.25*(h1>mh*.7&&lv.length>1?.8:1),q=[P(m+.6,-sw,h1),P(m+.6,sw,h1),P(m+1.4,sw,h2),P(m+1.4,-sw,h2)];c.fillStyle=sc_;c.strokeStyle=INK;c.lineWidth=.6;c.beginPath();c.moveTo(q[0][0],q[0][1]);c.lineTo(q[1][0],q[1][1]);const md=[(q[1][0]+q[2][0])/2+ca*2*s,(q[1][1]+q[2][1])/2+sa*2*s*TILT];c.quadraticCurveTo(md[0],md[1],q[2][0],q[2][1]);c.lineTo(q[3][0],q[3][1]);const m2=[(q[3][0]+q[0][0])/2+ca*2*s,(q[3][1]+q[0][1])/2+sa*2*s*TILT];c.quadraticCurveTo(m2[0],m2[1],q[0][0],q[0][1]);c.fill();c.stroke();
        if(T.sail==="stripe"){c.save();c.clip();c.fillStyle="#a8352a";for(let k=-2;k<=2;k+=2){const a_=P(m+1,k*sw/3,h1),b_=P(m+1,(k+1)*sw/3,h1),d_=P(m+1,(k+1)*sw/3,h2),e_=P(m+1,k*sw/3,h2);poly(c,[a_,b_,d_,e_],"#a8352a",null)}c.restore()}
        if(T.skull){const cc=[(q[0][0]+q[2][0])/2,(q[0][1]+q[2][1])/2];c.fillStyle="#efe9dc";c.beginPath();c.arc(cc[0],cc[1]-.6*s,1.3*s,0,7);c.fill();c.strokeStyle="#efe9dc";c.lineWidth=.7;c.beginPath();c.moveTo(cc[0]-1.6*s,cc[1]+.8*s);c.lineTo(cc[0]+1.6*s,cc[1]+2*s);c.moveTo(cc[0]+1.6*s,cc[1]+.8*s);c.lineTo(cc[0]-1.6*s,cc[1]+2*s);c.stroke()}}}
    else if(kind==="lat"){const q=[P(m-6,0,D+3),P(m+3,0,mh+1),P(m+5,0,D+5)],o=[ca*0-sa*3.4,(sa*0+ca*3.4)*TILT];c.fillStyle=sc_;c.strokeStyle=INK;c.lineWidth=.6;c.beginPath();c.moveTo(q[0][0],q[0][1]);c.quadraticCurveTo((q[0][0]+q[1][0])/2+o[0]*s,(q[0][1]+q[1][1])/2+o[1]*s,q[1][0],q[1][1]);c.lineTo(q[2][0],q[2][1]);c.closePath();c.fill();c.stroke()}
    else{const sw=T.W*1.2;c.fillStyle=sc_;c.strokeStyle=INK;c.lineWidth=.6;const q=[P(m+.6,-sw*.9,mh-1),P(m+.6,sw*.9,mh-1),P(m+1.4,sw,D+4),P(m+1.4,-sw,D+4)];poly(c,q,sc_,INK);c.strokeStyle="rgba(60,30,10,.6)";c.lineWidth=.5;c.beginPath();for(let k=1;k<5;k++){const f=k/5;c.moveTo(lerp(q[0][0],q[3][0],f),lerp(q[0][1],q[3][1],f));c.lineTo(lerp(q[1][0],q[2][0],f),lerp(q[1][1],q[2][1],f))}c.stroke()}
    const ft=P(m,0,mh+3);flag(c,t[0],t[1],t[1]-ft[1]+2,T.skull?"#1d1a17":"#a8352a",3.6)}});
  // o que esta no conves vai de tras para frente; o que fica atras do castelo de popa ou da chamine e desenhado antes deles
  DK.sort((p,q)=>p.d-q.d);let nk=-1;DK.forEach((p,k)=>{if(p.pre)nk=k});for(let k=0;k<=nk;k++)DK[k].f();
  for(const sd of[-1,1])if(vis(sd)){poly(c,side(sd),HC[0],INK);c.strokeStyle="rgba(240,220,170,.3)";c.lineWidth=.5;c.beginPath();for(let i=0;i<=N;i++){const p=P(deck[i][0],sd*deck[i][1]*.9,deck[i][2]*.6);i?c.lineTo(p[0],p[1]):c.moveTo(p[0],p[1])}c.stroke();
    if(T.shields)for(let i=2;i<N-1;i++){const p=P(deck[i][0],sd*deck[i][1]*.98,D-.6);c.fillStyle=["#a8352a","#e6d58a","#2f5a8a"][i%3];c.strokeStyle=INK;c.lineWidth=.4;c.beginPath();c.arc(p[0],p[1],1*s,0,7);c.fill();c.stroke()}
    if(T.oars){c.strokeStyle="#4a3524";c.lineWidth=.6;for(let i=3;i<N-2;i+=2){const p=P(deck[i][0],sd*deck[i][1],D*.6),q=P(deck[i][0]-1.5,sd*(deck[i][1]+5),-.6);c.beginPath();c.moveTo(p[0],p[1]);c.lineTo(q[0],q[1]);c.stroke()}}
    if(T.paddle){const p=P(0,sd*(T.W+.6),D*.5);c.fillStyle="#6e5232";c.strokeStyle=INK;c.lineWidth=.6;c.beginPath();c.ellipse(p[0],p[1],3.4*s,3*s,0,0,7);c.fill();c.stroke();c.beginPath();for(let k=0;k<6;k++){const an=k*1.047;c.moveTo(p[0],p[1]);c.lineTo(p[0]+Math.cos(an)*3.4*s,p[1]+Math.sin(an)*3*s)}c.stroke()}
    if(T.st>1)for(let i=4;i<N-3;i+=2){const p=P(deck[i][0],sd*deck[i][1]*.99,D*.55);c.fillStyle="#1b1b1b";c.fillRect(p[0]-.6*s,p[1]-.5*s,1.2*s,1*s)}}
  if(T.head){const p=P(L,0,D+3.4),q=P(L+1.5,0,D+5.2);c.strokeStyle=INK;c.lineWidth=1.8;c.beginPath();c.moveTo(p[0],p[1]);c.quadraticCurveTo(q[0]+1,q[1],q[0],q[1]-1.5);c.stroke();c.strokeStyle="#7d5833";c.lineWidth=1;c.stroke()}
  for(let k=nk+1;k<DK.length;k++)DK[k].f()}
// barcos: remo, vela pequena, canoa
function boatV(c,x,y,ang,kind){if(REC)regS("cx",x,y,kind==="canoa"?12.4:10,kind==="canoa"?3:4.6,kind==="vela"?10.5:2.4,ang);if(kind==="canoa"){const P=Pf(x,y,ang),o=[];for(let i=0;i<=8;i++){const t=i/8;o.push(P(lerp(-6,6,t),Math.sin(t*3.1416)*1.2,.9))}for(let i=8;i>=0;i--){const t=i/8;o.push(P(lerp(-6,6,t),-Math.sin(t*3.1416)*1.2,.9))}c.strokeStyle="rgba(240,248,248,.55)";c.lineWidth=.8;c.beginPath();c.ellipse(x,y+.6,7,1.4,0,0,7);c.stroke();poly(c,o,"#8a5e34",INK);line(c,P(-2,-3,1.6),P(-1,3,.2),.6,"#4a3524");return}
  boat(c,x,y,ang);if(kind==="vela"){const P=Pf(x,y,ang),b=P(0,0,1.2),t=P(0,0,10);line(c,b,t,.8,"#4a3524");poly(c,[P(.4,0,9.5),P(4.5,0,2.4),P(.4,0,2.4)],"#efe6cb",INK)}}
const PfF=(x,y,ang)=>{const P=Pf(x,y,ang);return P(0,1)[1]>=P(0,0)[1]?P:(u,v,h)=>P(u,-v,h)};
const Pf=(x,y,ang)=>{const ca=Math.cos(ang),sa=Math.sin(ang),e=ESP_?-1:1;return (a,b,h)=>{a*=e;const r=[x+ca*a-sa*b,y+(sa*a+ca*b)*TILT-(h||0)];if(REC&&h)REC.pp.push([r[0],r[1],h]);return r}};
const line=(c,p,q,w,col)=>{c.strokeStyle=col||"#4a3524";c.lineWidth=w||1;c.beginPath();c.moveTo(p[0],p[1]);c.lineTo(q[0],q[1]);c.stroke()};
const post=(c,P,u,v,h0,h1,w,col)=>{if(REC){const g=P(u,v,0),k=P(u,v,1);regS("rd",g[0],g[1],.8,.8,(h1-h0)*(g[1]-k[1]),0,h0*(g[1]-k[1]))}const a=P(u,v,h0),b=P(u,v,h1);c.strokeStyle=INK;c.lineWidth=(w||1)+1;c.beginPath();c.moveTo(a[0],a[1]);c.lineTo(b[0],b[1]);c.stroke();line(c,a,b,w||1,col)};
const quad=(c,P,pts,fill)=>{if(REC){const zs=P(0,0,0)[1]-P(0,0,1)[1],zz=pts.map(q=>(q[2]||0)*zs),z1=Math.max(...zz);regP(pts.map(q=>P(q[0],q[1],0)),Math.min(...zz),z1,z1<=.01)}return poly(c,pts.map(q=>P(q[0],q[1],q[2])),fill,INK)},
  // lado comprido virado para quem olha (+1 frente, -1 fundo)
  faceSg=(P,D)=>P(0,D/2+1)[1]-P(0,D/2)[1]>0?1:-1,
  door=(c,P,u,w,wd,ht,col)=>{quad(c,P,[[u-wd/2,w,0],[u+wd/2,w,0],[u+wd/2,w,ht],[u-wd/2,w,ht]],col||"#3a2c1b")},
  barnDoor=(c,P,u,w,wd,ht)=>{door(c,P,u,w,wd,ht);const a=P(u-wd/2,w,ht),b=P(u+wd/2,w,0),a2=P(u+wd/2,w,ht),b2=P(u-wd/2,w,0);c.strokeStyle="#7a5a32";c.lineWidth=.6;c.beginPath();c.moveTo(a[0],a[1]);c.lineTo(b[0],b[1]);c.moveTo(a2[0],a2[1]);c.lineTo(b2[0],b2[1]);c.stroke()},
  awning=(c,P,u0,u1,w,sg,h,col)=>{quad(c,P,[[u0,w,h],[u1,w,h],[u1,w+sg*2.6,h-1.6],[u0,w+sg*2.6,h-1.6]],col);c.strokeStyle="rgba(255,255,255,.55)";c.lineWidth=.5;c.beginPath();for(let u=u0+1.2;u<u1;u+=2.4){const p1=P(u,w,h),p2=P(u,w+sg*2.6,h-1.6);c.moveTo(p1[0],p1[1]);c.lineTo(p2[0],p2[1])}c.stroke()};
// cilindro (afinando para cima), visto inclinado
function cyl(c,x,y,r,h,col,tp,stripes){if(REC)regS("rd",x,y,r*2,r*2,h);tp=tp==null?1:tp;const r2=r*tp,ry=r*TILT,ry2=r2*TILT,g=c.createLinearGradient(x-r,0,x+r,0);g.addColorStop(0,col[0]);g.addColorStop(.35,K.mixc(col[0],"#ffffff",.25));g.addColorStop(1,col[1]);c.fillStyle=g;c.strokeStyle=INK;c.lineWidth=.8;
  c.beginPath();c.moveTo(x-r,y);c.ellipse(x,y,r,ry,0,3.1416,0,true);c.lineTo(x+r2,y-h);c.ellipse(x,y-h,r2,ry2,0,0,3.1416,true);c.closePath();c.fill();c.stroke();
  if(stripes)for(const [h0,h1,cl] of stripes){const ra=lerp(r,r2,h0/h),rb=lerp(r,r2,h1/h);c.fillStyle=cl;c.beginPath();c.moveTo(x-ra,y-h0);c.ellipse(x,y-h0,ra,ra*TILT,0,3.1416,0,true);c.lineTo(x+rb,y-h1);c.ellipse(x,y-h1,rb,rb*TILT,0,0,3.1416,true);c.closePath();c.fill();c.stroke()}
  c.fillStyle=K.mixc(col[0],"#ffffff",.15);c.beginPath();c.ellipse(x,y-h,r2,ry2,0,0,7);c.fill();c.stroke()}
function cone(c,x,y,r,h,col){if(REC)regS("rd",x,y,r*2,r*2,h);c.fillStyle=col[1];c.strokeStyle=INK;c.lineWidth=.8;c.beginPath();c.moveTo(x-r,y);c.ellipse(x,y,r,r*TILT,0,3.1416,0,true);c.lineTo(x,y-h);c.closePath();c.fill();c.stroke();c.fillStyle=col[0];c.beginPath();c.moveTo(x-r,y);c.quadraticCurveTo(x-r*.4,y+r*TILT*.9,x-r*.05,y+r*TILT);c.lineTo(x,y-h);c.closePath();c.fill()}

// telhado de quatro aguas (P centrado no bloco); faces desenhadas de tras para frente
function hipRoof(c,P,L,D,H,R,col){c.lineWidth=.75;const hl=L/2+.6,hd=D/2+.6,ri=Math.max(.01,hl-hd*.9),A=P(-hl,-hd,H),B=P(hl,-hd,H),C=P(hl,hd,H),E=P(-hl,hd,H),r1=P(-ri,0,H+R),r2=P(ri,0,H+R);
  const F=[[A,B,r2,r1],[E,A,r1],[B,C,r2],[C,E,r1,r2]].map(f=>({f,y:(f[0][1]+f[1][1])/2})).sort((a,b)=>a.y-b.y);for(const {f} of F){const fr=f[1][1]>=f[0][1]-1&&f===F[F.length-1].f;poly(c,f,K.mixc(col[1],col[0],f===F[F.length-1].f?1:f===F[0].f?.2:.6),INK)}
  c.strokeStyle="rgba(50,30,15,.35)";c.lineWidth=.45;c.beginPath();const f=F[F.length-1].f;for(let t=.25;t<1;t+=.25){const a=[f[0][0]+(f[f.length-1][0]-f[0][0])*t,f[0][1]+(f[f.length-1][1]-f[0][1])*t],b=[f[1][0]+(f[2][0]-f[1][0])*t,f[1][1]+(f[2][1]-f[1][1])*t];c.moveTo(a[0],a[1]);c.lineTo(b[0],b[1])}c.stroke()}
// portico de colunas com frontao, de frente para +v
function portico(c,P,u0,u1,v0,v1,H,n,col,top){col=col||"#f2eee4";top=top||"#e6e0d0";const ph=Math.min(5,(u1-u0)*.22);c.lineWidth=.7;
  quad(c,P,[[u0-1.2,v0,0],[u1+1.2,v0,0],[u1+1.2,v1+1.6,0],[u0-1.2,v1+1.6,0]],"#d6d0c0");quad(c,P,[[u0-1.2,v1+1.6,0],[u1+1.2,v1+1.6,0],[u1+1.2,v1+1.6,-1],[u0-1.2,v1+1.6,-1]],"#a8a294");
  for(let i=0;i<n;i++){const u=u0+(u1-u0)*i/(n-1);post(c,P,u,v1,0,H,1.5,col)}
  c.lineWidth=.7;quad(c,P,[[u0-.6,v0,H+1.4],[u1+.6,v0,H+1.4],[u1+.6,v1+.5,H+1.4],[u0-.6,v1+.5,H+1.4]],top);quad(c,P,[[u0-.6,v1+.5,H],[u1+.6,v1+.5,H],[u1+.6,v1+.5,H+1.4],[u0-.6,v1+.5,H+1.4]],K.mixc(top,"#000000",.08));
  const m=(u0+u1)/2,sl=[[[u0-.6,v0,H+1.4],[m,v0,H+1.4+ph],[m,v1+.5,H+1.4+ph],[u0-.6,v1+.5,H+1.4]],[[m,v0,H+1.4+ph],[u1+.6,v0,H+1.4],[u1+.6,v1+.5,H+1.4],[m,v1+.5,H+1.4+ph]]];for(const q of sl)quad(c,P,q,K.mixc(top,"#7a6a50",.25));
  quad(c,P,[[u0-.6,v1+.5,H+1.4],[u1+.6,v1+.5,H+1.4],[m,v1+.5,H+1.4+ph]],top);const r=P(m,v1+.55,H+1.4+ph*.42);c.strokeStyle="rgba(80,70,50,.6)";c.lineWidth=.5;c.beginPath();c.ellipse(r[0],r[1],1.1,.8,0,0,7);c.stroke()}
// poligono amostrado (circulos e arcos em perspectiva)
const arcPts=(P,cu,cv,r,h,a0,a1,n)=>{const o=[];for(let i=0;i<=n;i++){const t=a0+(a1-a0)*i/n;o.push(P(cu+Math.cos(t)*r,cv+Math.sin(t)*r,h))}return o};
// igreja com nave, transepto, abside e torres na fachada
function church(c,x,y,a,m,s,v,snow){ANG_=a-.34;const P=Pf(x,y,a),rf=snow||(s.roof==="sandtop"?"dark":s.roof),wl=s.wall==="felt"?"stone":(v>.5?"stone":s.wall),parts=[],SC=cena(P),ST={race:s.race,roof:rf,wall:wl,flat:false,asian:false};
  const N=26*m,D=10*m,H=10*m;parts.push({g:(u,v,f)=>SC.cx(u,v,N,D,H*1.6,f),u:0,v:0,f:()=>hall(c,...P(0,0),N,D,H,ST,{ang:a,exact:1,roof:rf,wall:wl,R:D*.62})});
  parts.push({g:(u,v,f)=>SC.cx(u,v,D*1.9,D*.85,H*1.5,f,{r:1.5708}),u:N*.18,v:0,f:()=>hall(c,...P(N*.18,0),D*1.9,D*.85,H*.95,ST,{ang:a+1.5708,exact:1,roof:rf,wall:wl,R:D*.55})});
  parts.push({g:(u,v,f)=>SC.rd(N/2,0,D*.45,H*.82+D*.45,f,{dy:D*.25}),u:N/2+D*.25,v:0,f:()=>{const q=P(N/2,0);cyl(c,q[0],q[1],D*.45,H*.82,WL(wl));cone(c,q[0],q[1]-H*.82,D*.5,D*.45,RF(rf))}});
  const two=v>.35;if(two){for(const sd of[-1,1])parts.push({u:-N/2-1,v:sd*(D/2-1.4*m),f:()=>tower(c,...P(-N/2-.8*m,sd*(D/2-1.6*m)),3.2*m,H*1.75,ST,{roof:rf,wall:wl,rh:7*m})})}
  else parts.push({u:-N/2-1,v:0,f:()=>tower(c,...P(-N/2-1*m,0),3.8*m,H*2,ST,{roof:rf,wall:wl,rh:9*m})});
  for(const p_ of parts)(p_.g||((u,v,f)=>SC.rd(u,v,3.4*m,H*2.6,f)))(p_.u,p_.v,p_.f);SC.fim();
  // rosacea no frontao, desenhada no plano da parede e so quando essa parede esta virada para quem olha
  for(const sg of[-1,1]){const u0=sg*(N/2+.2),vis=P(u0+sg,0)[1]-P(u0,0)[1]>.05;if(!vis)continue;const ring=[];for(let i=0;i<16;i++){const t=i/16*6.283;ring.push(P(u0,Math.cos(t)*1.7*m,H*.72+Math.sin(t)*1.7*m))}poly(c,ring,"#3a4a6a",INK);c.strokeStyle="#c9a24a";c.lineWidth=.4;c.beginPath();const ce=P(u0,0,H*.72);for(let i=0;i<6;i++){const t=i/6*6.283,q=P(u0,Math.cos(t)*1.5*m,H*.72+Math.sin(t)*1.5*m);c.moveTo(ce[0],ce[1]);c.lineTo(q[0],q[1])}c.stroke();break}}
function mosque(c,x,y,a,m,s,v){ANG_=a-.34;const P=Pf(x,y,a),W=WL(s.wall==="sandtop"?"white":s.wall),G=v<.5?["#6f9ec8","#3d6890"]:ROOF.gold,mi=()=>{const q=P(11*m,-8*m);cyl(c,q[0],q[1],1.8*m,26*m,W,.85,[[18*m,19.4*m,K.mixc(W[0],"#000000",.15)]]);cone(c,q[0],q[1]-26*m,1.9*m,4*m,G)};
  const far=P(11*m,-8*m)[1]<P(0,0)[1];if(far)mi();prism(c,x,y,22*m,16*m,8*m,a,W);for(const [u,w] of[[-9,-6],[9,-6],[-9,6],[9,6]]){const q=P(u*m,w*m,8*m);c.save();c.translate(q[0],q[1]);dome(c,0,0,2*m,G);c.restore()}const t=P(0,0,8*m);prism(c,t[0],t[1],9*m,9*m,2*m,a,W);dome(c,t[0],t[1]-2*m,6.4*m,G);
  {const fs=lado(P,s);for(let i=-2;i<=2;i++){const q=P(i*4*m,fs*8*m,0);c.fillStyle="#2b2418";c.beginPath();c.moveTo(q[0]-1*m,q[1]);c.lineTo(q[0]-1*m,q[1]-3.4*m);c.quadraticCurveTo(q[0],q[1]-5*m,q[0]+1*m,q[1]-3.4*m);c.lineTo(q[0]+1*m,q[1]);c.fill()}}if(!far)mi()}
// ---------- castelos e palacios: varias composicoes por cultura, giradas para a cidade (frente = +v) ----------
function fortress(c,x,y,a,m,race,v,cold,cv,cst){if((cv||0)>=2&&fortress2(c,x,y,a,m,race,v,cold,cst))return;ANG_=a-.34;const s=ST(race||"humano"),P=Pf(x,y,a),S=(u,w,h)=>P(u*m,w*m,(h||0)*m),C=s.C,SC=cena((u,w,h)=>S(u,w,h)),parts={push:o=>SC.chao(o.f)},add=(u,w,f,dy)=>{if(dy<=-10)SC.chao(f);else SC.rd(u,w,1.2,4,f,{dy:(dy||0)/TILT})};
  const stoneK=C.st==="daub"||C.st==="mud"||C.st==="wood"||C.st==="wooddark"?"stone":C.st,W=WL(stoneK),rfK=cold?"snow":(C.rf==="sandtop"?"gold":C.rf==="hide"||C.rf==="thatch"?"dark":C.rf),RFc=RF(rfK),fz=C.fence==="sand"?"sand":"stone",ban=race==="elfo"?"#3f7a6a":race==="anao"?"#5a5c63":race==="orc"?"#4a3a2a":race==="deserto"||race==="indiano"?"#2f6f4a":"#a8352a";
  const ground=(pts,col)=>quad(c,(u,w,h)=>S(u,w,h),pts,col);
  const cren=(q,r)=>{c.fillStyle=K.mixc(W[0],"#ffffff",.15);c.strokeStyle=INK;c.lineWidth=.5;for(let i=0;i<8;i++){const t=Math.PI*(i+.5)/8;const px=q[0]+Math.cos(t)*r,py=q[1]+Math.sin(t)*r*TILT;c.fillRect(px-.7*m,py-1.6*m,1.4*m,1.6*m);c.strokeRect(px-.7*m,py-1.6*m,1.4*m,1.6*m)}};
  const rtower=(u,w,r,h,top,col)=>SC.rd(u,w,r,h,()=>{const q=S(u,w),wc=col||W;cyl(c,q[0],q[1],r*m,h*m,wc);const t=[q[0],q[1]-h*m];if(top==="cren"){c.fillStyle=K.mixc(wc[0],"#ffffff",.2);c.strokeStyle=INK;c.lineWidth=.6;c.beginPath();c.ellipse(t[0],t[1],r*m*1.12,r*m*1.12*TILT,0,0,7);c.fill();c.stroke();cren(t,r*m*1.08)}
      else if(top==="dome"){c.save();dome(c,t[0],t[1],r*m*1.05,RFc);c.restore()}else{cone(c,t[0],t[1],r*m*1.25,r*m*(top==="tall"?3.4:2.3),RFc);if(top==="tall")flag(c,t[0],t[1]-r*m*3.4,5*m,ban)}
      c.fillStyle="#2b2418";for(const hh of[.45,.75]){c.fillRect(t[0]-.5*m,q[1]-h*m*hh,1*m,1.8*m)}});
  const stower=(u,w,L,h,top,ang2)=>SC.cx(u,w,L,L,h,()=>{const q=S(u,w),aa=a+(ang2||0);prism(c,q[0],q[1],L*m,L*m,h*m,aa,W);const Pq=Pf(q[0],q[1],aa);
      if(top==="hip")hipRoof(c,(uu,ww,hh)=>Pq(uu,ww,hh),L*m,L*m,h*m,L*m*.8,RFc);else{for(const [du,dw] of[[-1,-1],[1,-1],[-1,1],[1,1]]){const t=Pq(du*L*m*.5,dw*L*m*.5,h*m);cyl(c,t[0],t[1],1.3*m,2.4*m,W);cone(c,t[0],t[1]-2.4*m,1.6*m,3*m,RFc)}for(let i=-2;i<=2;i++){const t=Pq(i*L*m*.18,L*m*.5,h*m);c.fillStyle=K.mixc(W[0],"#ffffff",.15);c.fillRect(t[0]-.7*m,t[1]-1.5*m,1.4*m,1.5*m)}}
      c.fillStyle="#2b2418";for(const hh of[.4,.7]){const t=Pq(0,L*m*.5,h*m*hh);c.fillRect(t[0]-.6*m,t[1]-2*m,1.2*m,2*m)}});
  const wall=(u0,w0,u1,w1,h)=>SC.cx((u0+u1)/2,(w0+w1)/2,Math.hypot(u1-u0,w1-w0),1,h,()=>KR.drawWall(c,S(u0,w0),S(u1,w1),h*m,fz),{r:Math.atan2(w1-w0,u1-u0)});
  const hallp=(u,w,L,D,H,ao,o)=>SC.cx(u,w,L,D,H,()=>hall(c,...S(u,w),L*m,D*m,H*m,s,Object.assign({ang:a+(ao||0),exact:1},o||{})),{r:ao||0});
  const gate=(u,w,ao)=>SC.cx(u,w,14,6,14,()=>{const q=S(u,w),aa=a+(ao||0),Pq=Pf(q[0],q[1],aa);prism(c,q[0],q[1],9*m,6*m,11*m,aa,W);const pts=[Pq(-2.6*m,3*m,0)];for(let i=0;i<=8;i++){const t=Math.PI-Math.PI*i/8;pts.push(Pq(Math.cos(t)*2.6*m,3*m,(5.4+Math.sin(t)*2.6)*m))}pts.push(Pq(2.6*m,3*m,0));poly(c,pts,"#241b12",INK);
      for(const sd of[-1,1]){const t=Pq(sd*4.5*m,3*m,0);cyl(c,t[0],t[1],2.4*m,14*m,W);cone(c,t[0],t[1]-14*m,2.9*m,5*m,RFc)}banner(c,...Pq(0,3.1*m,10*m),ban)},{r:ao||0,dy:.5});
  const yard=(u0,w0,u1,w1,col)=>parts.push({sy:-1e9,f:()=>ground([[u0,w0,0],[u1,w0,0],[u1,w1,0],[u0,w1,0]],col)});
  const props=(list)=>{for(const [id,u,w,ao] of list)add(u,w,()=>{const q=S(u,w);const A0=ANG_,R0=REC&&[REC.dx,REC.dy,REC.m,REC.ox,REC.oy];if(REC){REC.dx+=q[0]*REC.m;REC.dy+=q[1]*REC.m;REC.m*=m}c.save();c.translate(q[0],q[1]);c.scale(m,m);if(id==="horse")horse(c,0,0,"#6e4c2a",(u*7)%2>1);else if(id==="fire")K.drawFire(c,0,0);else if(id==="tent")KR.drawTent(c,0,0,race,1.3,false,false);else if(id==="dummy"){line(c,[0,0],[0,-6],.8,"#7a5432");line(c,[-2.4,-4.4],[2.4,-4.4],.8,"#7a5432");c.fillStyle="#c9a96a";c.beginPath();c.arc(0,-6.6,1.2,0,7);c.fill()}else draw(c,0,0,id,race,.4,a+(ao||0));c.restore();ANG_=A0;if(REC){REC.dx=R0[0];REC.dy=R0[1];REC.m=R0[2]}})};
  shadow(c,x,y,34*m,13*m);
  const V=Math.floor((v||0)*3)%3;
  if(s.asian&&race==="japones"){// castelo japones: fosso, muralha branca com torres de canto, torre principal no meio sobre base de pedra alta
    yard(-28,-22,28,22,"#d8cfb3");
    const base=(u,w,L,D,H)=>add(u,w,()=>{const q=S(u,w),Pq=Pf(q[0],q[1],a),l=L*m/2,d=D*m/2,h=H*m,i=2.4*m;poly(c,[Pq(-l,d),Pq(l,d),Pq(l-i,d-i,h),Pq(-l+i,d-i,h)],"#8f897a",INK);poly(c,[Pq(l,-d),Pq(l,d),Pq(l-i,d-i,h),Pq(l-i,-d+i,h)],"#77705f",INK);poly(c,[Pq(-l,-d),Pq(-l,d),Pq(-l+i,d-i,h),Pq(-l+i,-d+i,h)],"#8a8474",INK);poly(c,[Pq(-l+i,-d+i,h),Pq(l-i,-d+i,h),Pq(l-i,d-i,h),Pq(-l+i,d-i,h)],"#b3ad9e",INK);c.strokeStyle="rgba(50,40,30,.35)";c.lineWidth=.4;c.beginPath();for(let k=1;k<5;k++){const p=Pq(-l+i*k/5,d-i*k/5,h*k/5),q2=Pq(l-i*k/5,d-i*k/5,h*k/5);c.moveTo(p[0],p[1]);c.lineTo(q2[0],q2[1])}c.stroke()});
    for(const [u0,w0,u1,w1] of[[-26,-20,26,-20],[-26,-20,-26,20],[26,-20,26,20],[-26,20,-7,20],[7,20,26,20]])wall(u0,w0,u1,w1,5);
    for(const [u,w] of[[-26,-20],[26,-20],[-26,20],[26,20]])add(u,w,()=>{const q=S(u,w);KR.drawAsian(c,q[0],q[1],{L:7*m,D:7*m,H:5*m,R:3.4*m,ang:a,roof:"jp",wall:"jpw",base:1})});
    add(0,20,()=>{const q=S(0,20);KR.drawAsian(c,q[0],q[1],{L:13*m,D:6*m,H:5.4*m,R:3.8*m,ang:a,roof:"jp",wall:"jpw",base:1})});
    // caminho do portao ate a torre
    add(0,12,()=>{const q=S(0,12),Pq=Pf(q[0],q[1],a);poly(c,[Pq(-2.6*m,-10*m),Pq(2.6*m,-10*m),Pq(2.6*m,8*m),Pq(-2.6*m,8*m)],"#c9bd9c",null)},-30);
    const lv=V===2?5:4,bh=V===1?11:9;base(0,-5,24,19,bh);add(0,-5,()=>{let q=S(0,-5,bh);for(let i=0;i<lv;i++){const k=1-i*.15;KR.drawAsian(c,q[0],q[1],{L:18*k*m,D:14*k*m,H:5.4*m,R:4.2*m*k,ang:a,roof:"jp",wall:"jpw",base:0});q=[q[0],q[1]-6.6*m]}const t=[q[0],q[1]+2*m];c.fillStyle="#c9a24a";c.beginPath();c.ellipse(t[0]-2*m,t[1],1*m,.6*m,0,0,7);c.ellipse(t[0]+2*m,t[1],1*m,.6*m,0,0,7);c.fill()},1);
    if(V===1){base(17,-8,10,9,5);add(17,-8,()=>{const q=S(17,-8,5);KR.drawAsian(c,q[0],q[1],{L:8*m,D:7*m,H:4.5*m,R:3.5*m,ang:a,roof:"jp",wall:"jpw"});KR.drawAsian(c,q[0],q[1]-5.4*m,{L:6*m,D:5*m,H:4*m,R:3*m,ang:a,roof:"jp",wall:"jpw"})},1)}
    if(V===2){for(const [u,w] of[[-16,8],[16,8]])add(u,w,()=>{const q=S(u,w);KR.drawAsian(c,q[0],q[1],{L:9*m,D:6*m,H:4*m,R:3.2*m,ang:a,roof:"jp",wall:"jpw",base:.5})})}
    props([["lamp",-6,14],["lamp",6,14],["flowerbed",-17,10],["flowerbed",17,-12]])}
  else if(s.asian){// palacio chines: eixo de portoes e saloes em terracos, muro vermelho
    yard(-28,-22,28,22,"#d6ccb0");for(const [u0,w0,u1,w1] of[[-28,-22,28,-22],[-28,-22,-28,22],[28,-22,28,22],[-28,22,-6,22],[6,22,28,22]])wall(u0,w0,u1,w1,5);
    const terr=(u,w,L,D,H,n)=>add(u,w,()=>{const q=S(u,w);for(let i=0;i<n;i++){prism(c,q[0],q[1]-i*H*m,(L-i*3)*m,(D-i*3)*m,H*m,a,["#e6e0d0","#a8a294"])}const t=[q[0],q[1]-n*H*m];KR.drawAsian(c,t[0],t[1],{L:(L-n*3-2)*m,D:(D-n*3-2)*m,H:6*m,R:5*m,ang:a,roof:race==="chines"?"cny":"cn",wall:"red",base:0})},-1);
    terr(0,-10,30,16,1.6,V===0?3:2);terr(0,8,22,10,1.4,1);add(0,22,()=>{const q=S(0,22);KR.drawAsian(c,q[0],q[1],{L:12*m,D:6*m,H:5*m,R:4*m,ang:a,roof:"cn",wall:"red",base:1})});
    for(const sd of[-1,1]){add(sd*22,-2,()=>{const q=S(sd*22,-2);KR.drawAsian(c,q[0],q[1],{L:12*m,D:7*m,H:4.5*m,R:3.8*m,ang:a+1.5708,roof:"cn",wall:"red",base:1})});if(V===2)add(sd*20,-17,()=>pagode(c,...S(sd*20,-17),4,7*m,"cn","red",ANG_+.7854))}}
  else if(s.flat&&race==="meso"){// piramide escalonada com templo no topo e palacio baixo
    yard(-28,-20,28,20,"#d6c8a0");const pyr=(u,w,n,sz)=>add(u,w,()=>{const q=S(u,w);for(let i=0;i<n;i++)prism(c,q[0],q[1]-i*4*m*sz,(30-i*5)*m*sz,(26-i*4.4)*m*sz,4*m*sz,a,["#d8d0b0","#9a917a"]);const Pq=Pf(q[0],q[1],a);quad(c,(uu,ww,hh)=>Pq(uu,ww,hh),[[-2.6*m*sz,13*m*sz,0],[2.6*m*sz,13*m*sz,0],[2.6*m*sz,(13-n*2.2)*m*sz,n*4*m*sz],[-2.6*m*sz,(13-n*2.2)*m*sz,n*4*m*sz]],"#c9bf9e");const t=[q[0],q[1]-n*4*m*sz];prism(c,t[0],t[1],8*m*sz,7*m*sz,6*m*sz,a,WL("lime"));hipRoof(c,Pf(t[0],t[1],a),8*m*sz,7*m*sz,6*m*sz,4*m*sz,ROOF.thatch);c.fillStyle="#a8352a";const d=Pf(t[0],t[1],a)(0,3.6*m*sz,2.6*m*sz);c.fillRect(d[0]-1*m*sz,d[1]-2.6*m*sz,2*m*sz,2.6*m*sz)});
    const stela=(u,w)=>add(u,w,()=>{const q=S(u,w);prism(c,q[0],q[1],3*m,1.2*m,7*m,a,["#b9b09a","#8a816c"]);c.strokeStyle="rgba(80,60,40,.6)";c.lineWidth=.4;c.beginPath();for(let h=1.5;h<7;h+=1.5){c.moveTo(q[0]-1.2*m,q[1]-h*m);c.lineTo(q[0]+1.2*m,q[1]-h*m)}c.stroke()});
    if(V===0){pyr(0,-6,5,1);hallp(-18,12,14,8,5,0);hallp(18,12,14,8,5,0);stela(-6,16);stela(6,16)}
    else if(V===1){pyr(0,-8,4,.8);add(-14,10,()=>{const q=S(-14,10);cyl(c,q[0],q[1],6*m,3*m,["#d8d0b0","#9a917a"]);cyl(c,q[0],q[1]-3*m,3.6*m,6*m,WL("lime"));c.save();dome(c,q[0],q[1]-9*m,3.6*m,["#d8d0b0","#9a917a"]);c.restore()});
      for(const sd of[-1,1])add(14+sd*4,10,()=>{const q=S(14+sd*4,10),Pq=Pf(q[0],q[1],a);poly(c,[Pq(-1.5*m,-8*m),Pq(-1.5*m,8*m),Pq(1.5*m*-sd,8*m,4*m),Pq(1.5*m*-sd,-8*m,4*m)],"#c9bf9e",INK);const r=Pq(-sd*1.2*m,0,3.4*m);c.strokeStyle="#4a3524";c.lineWidth=.8;c.beginPath();c.ellipse(r[0],r[1],1*m,1*m,0,0,7);c.stroke()});quad(c,(u,w,h)=>S(u,w,h),[[11,2,0],[17,2,0],[17,18,0],[11,18,0]],"#c9b98c");stela(0,16)}
    else{pyr(-12,-6,4,.75);pyr(12,-6,4,.75);quad(c,(u,w,h)=>S(u,w,h),[[-8,6,0],[8,6,0],[8,18,0],[-8,18,0]],"#e2d8bc");add(0,12,()=>{const q=S(0,12);prism(c,q[0],q[1],7*m,7*m,1.6*m,a,["#d8d0b0","#9a917a"])});stela(-6,18);stela(6,18)}}
  else if(s.flat){// kasbah / palacio do deserto ou indiano: muralha de barro com torres afinadas, palacio com cupulas
    const ind=race==="indiano",WS=WL(ind?"pink":C.st),dc=ind?["#f3efe3","#c8beb0"]:V===1?["#6f9ec8","#3d6890"]:ROOF.gold;yard(-27,-21,27,21,ind?"#d6c8a8":"#dccaa0");
    const tw=(u,w,h)=>add(u,w,()=>{const q=S(u,w);prism(c,q[0],q[1],6*m,6*m,h*m,a,WS);prism(c,q[0],q[1]-h*m,7*m,7*m,1.4*m,a,WS);const Pq=Pf(q[0],q[1]-(h+1.4)*m,a);for(const [du,dw] of[[-3,-3],[0,-3],[3,-3],[-3,0],[3,0],[-3,3],[0,3],[3,3]]){const t=Pq(du*m,dw*m,0);c.fillStyle=WS[0];c.fillRect(t[0]-.6*m,t[1]-1.4*m,1.2*m,1.4*m)}if(ind){const t=[q[0],q[1]-(h+1.4)*m];c.save();dome(c,t[0],t[1]-2*m,2.6*m,dc);c.restore();for(const sd of[-1,1]){const p2=Pq(sd*2.6*m,0,0);post(c,(uu,ww,hh)=>[p2[0],p2[1]-hh],0,0,0,2*m,.6,WS[1])}}});
    if(V!==2){for(const [u0,w0,u1,w1] of[[-25,-19,25,-19],[-25,-19,-25,19],[25,-19,25,19],[-25,19,-5,19],[5,19,25,19]])wall(u0,w0,u1,w1,7);for(const [u,w] of[[-25,-19],[25,-19],[-25,19],[25,19]])tw(u,w,13);tw(-5,19,10);tw(5,19,10)}
    add(0,-6,()=>{const q=S(0,-6);prism(c,q[0],q[1],30*m,16*m,10*m,a,WS);const Pq=Pf(q[0],q[1],a);for(let i=-3;i<=3;i++){const t=Pq(i*4*m,8*m,0);c.fillStyle="#2b2418";c.beginPath();c.moveTo(t[0]-1.1*m,t[1]);c.lineTo(t[0]-1.1*m,t[1]-4*m);c.quadraticCurveTo(t[0],t[1]-6*m,t[0]+1.1*m,t[1]-4*m);c.lineTo(t[0]+1.1*m,t[1]);c.fill()}
      const t=Pq(0,0,10*m);prism(c,t[0],t[1],12*m,10*m,3*m,a,WS);c.save();dome(c,t[0],t[1]-3*m,7*m,dc);c.restore();for(const [du,dw] of[[-12,-6],[12,-6],[-12,6],[12,6]]){const q2=Pq(du*m,dw*m,10*m);cyl(c,q2[0],q2[1],1.6*m,4*m,WS);c.save();dome(c,q2[0],q2[1]-4*m,2*m,dc);c.restore()}},.5);
    if(ind||V===2){parts.push({sy:-1e8,f:()=>{const G=(pts,col)=>ground(pts,col);G([[-17,3,0],[17,3,0],[17,21,0],[-17,21,0]],"#d8ccaa");for(const [u0,u1] of[[-16,-1.6],[1.6,16]])for(const [w0,w1] of[[4,10.6],[13.4,20]])G([[u0,w0,0],[u1,w0,0],[u1,w1,0],[u0,w1,0]],"#7f9c4a");
      G([[-1.6,3,.3],[1.6,3,.3],[1.6,21,.3],[-1.6,21,.3]],"#c9c2b0");G([[-1,3,.35],[1,3,.35],[1,21,.35],[-1,21,.35]],"#6a9fb2");G([[-16,10.6,.3],[16,10.6,.3],[16,13.4,.3],[-16,13.4,.3]],"#c9c2b0");G([[-16,11.2,.35],[16,11.2,.35],[16,12.8,.35],[-16,12.8,.35]],"#6a9fb2");
      c.fillStyle="#c25a6a";for(const [u,w] of[[-9,7],[9,7],[-9,17],[9,17]]){const q=S(u,w);c.beginPath();c.ellipse(q[0],q[1],2.2*m,1*m,0,0,7);c.fill()}}});
    for(const [u,w] of[[-16,4],[16,4],[-16,20],[16,20],[-3,4],[3,4]])add(u,w,()=>{const q=S(u,w);c.fillStyle="#3f5a2a";c.strokeStyle=INK;c.lineWidth=.5;c.beginPath();c.ellipse(q[0],q[1]-3.2*m,1.2*m,3.4*m,0,0,7);c.fill();c.stroke()});
    add(0,12,()=>{const q=S(0,12,.4);c.fillStyle="#c9c2b0";c.strokeStyle=INK;c.lineWidth=.6;c.beginPath();c.ellipse(q[0],q[1],3*m,1.4*m,0,0,7);c.fill();c.stroke();c.fillStyle="#7fb0c0";c.beginPath();c.ellipse(q[0],q[1],2.2*m,1*m,0,0,7);c.fill();c.strokeStyle="rgba(230,245,250,.9)";c.lineWidth=.6;c.beginPath();c.moveTo(q[0],q[1]);c.lineTo(q[0],q[1]-3.4*m);for(const sd of[-1,1]){c.moveTo(q[0],q[1]-3.4*m);c.quadraticCurveTo(q[0]+sd*1.4*m,q[1]-4*m,q[0]+sd*2*m,q[1]-.4*m)}c.stroke()})}else{hallp(-16,8,8,12,7,1.5708);hallp(16,8,8,12,7,1.5708)}
    if(V===1)for(const sd of[-1,1])add(sd*14,-16,()=>{const q=S(sd*14,-16);cyl(c,q[0],q[1],1.8*m,30*m,WS,.85);cone(c,q[0],q[1]-30*m,2*m,4*m,dc)})}
  else if(C.form==="round"||race==="mongol"){// fortes de madeira (orcs, tribais) e acampamento do khan
    if(race==="mongol"&&V===0){yard(-26,-20,26,20,"#c9bf8a");add(0,-4,()=>{const q=S(0,-4);KR.drawRound(c,q[0],q[1],12*m,6*m,6*m,{wall:"felt",roof:"felt",yurt:1})});for(let i=0;i<8;i++){const t=i/8*6.283,u=Math.cos(t)*20,w=Math.sin(t)*16;add(u,w,()=>{const q=S(u,w);KR.drawRound(c,q[0],q[1],4.4*m,3*m,2.6*m,{wall:"felt",roof:"felt",yurt:1})})}for(const sd of[-1,1])add(sd*6,10,()=>{const q=S(sd*6,10);flag(c,q[0],q[1],16*m,ban,4*m);c.strokeStyle="#5a4028";c.lineWidth=.6;c.beginPath();for(let k=0;k<5;k++){c.moveTo(q[0],q[1]-16*m);c.lineTo(q[0]+(k-2)*.8*m,q[1]-12*m)}c.stroke()});props([["horse",14,10],["fire",-10,10]].filter(p=>p[0]!=="fire"&&p[0]!=="horse"))}
    else if(race==="mongol"&&V===1){// palacio do khan: muro de barro, iurta gigante sobre plataforma, portoes
      const WS=WL("mud");yard(-26,-20,26,20,"#cfc39a");for(const [u0,w0,u1,w1] of[[-24,-18,24,-18],[-24,-18,-24,18],[24,-18,24,18],[-24,18,-5,18],[5,18,24,18]])add((u0+u1)/2,(w0+w1)/2,()=>KR.drawWall(c,S(u0,w0),S(u1,w1),5*m,"sand"),-2);
      add(0,18,()=>{const q=S(0,18);KR.drawAsian(c,q[0],q[1],{L:10*m,D:5*m,H:6*m,R:3.4*m,ang:a,roof:"cn",wall:"red",base:1})});
      add(0,-5,()=>{const q=S(0,-5);prism(c,q[0],q[1],22*m,18*m,3*m,a,["#c9c2b0","#8f897a"],"#d6d0c0");KR.drawRound(c,q[0],q[1]-3*m,10*m,7*m,6*m,{wall:"felt",roof:"felt",yurt:1});c.fillStyle="#c9a24a";c.beginPath();c.arc(q[0],q[1]-16*m,1.2*m,0,7);c.fill()});
      for(const [u,w] of[[-16,-10],[16,-10],[-16,8],[16,8]])add(u,w,()=>{const q=S(u,w);KR.drawRound(c,q[0],q[1],4.6*m,3.2*m,2.8*m,{wall:"felt",roof:"felt",yurt:1})});props([["horse",12,13],["horse",14,14]])}
    else if(race==="mongol"){// horda: aneis de iurtas, cercados de cavalos, iurta sobre carroca e estandartes
      yard(-27,-21,27,21,"#c9bf8a");for(const [R,n,sc] of[[23,10,3.6],[14,5,3.8]])for(let i=0;i<n;i++){const t=i/n*6.283+R,u=Math.cos(t)*R,w=Math.sin(t)*R*.75;add(u,w,()=>{const q=S(u,w);KR.drawRound(c,q[0],q[1],sc*m,2.6*m,2.4*m,{wall:"felt",roof:"felt",yurt:1})})}
      add(0,-2,()=>{const q=S(0,-2),Pq=Pf(q[0],q[1],a);prism(c,q[0],q[1]-2*m,14*m,10*m,1.4*m,a,["#7a5432","#4a3524"]);for(const [du,dw] of[[-5,5],[5,5],[-5,-5],[5,-5]]){const w2=Pq(du*m,dw*m,1.6*m);c.fillStyle="#5a4028";c.strokeStyle=INK;c.lineWidth=.6;c.beginPath();c.ellipse(w2[0],w2[1],1.6*m,1.6*m,0,0,7);c.fill();c.stroke()}KR.drawRound(c,q[0],q[1]-3.4*m,7*m,5*m,4*m,{wall:"felt",roof:"felt",yurt:1})});
      for(const [u,w] of[[-6,9],[6,9]])add(u,w,()=>{const q=S(u,w);c.strokeStyle="#5a4028";c.lineWidth=.8;c.beginPath();c.moveTo(q[0],q[1]);c.lineTo(q[0],q[1]-18*m);c.stroke();c.strokeStyle="#2b2418";c.lineWidth=.5;c.beginPath();for(let k=0;k<9;k++){c.moveTo(q[0],q[1]-17*m);c.lineTo(q[0]+(k-4)*.5*m,q[1]-12*m)}c.stroke()});
      add(14,10,()=>{const q=S(14,10),Pq=Pf(q[0],q[1],a);c.strokeStyle="#6e4c2a";c.lineWidth=.6;c.beginPath();for(let k=0;k<=4;k++){const p=Pq(-5*m+k*2.5*m,-3*m,0),p2=Pq(-5*m+k*2.5*m,-3*m,2*m);c.moveTo(p[0],p[1]);c.lineTo(p2[0],p2[1]);const r=Pq(-5*m+k*2.5*m,3*m,0),r2=Pq(-5*m+k*2.5*m,3*m,2*m);c.moveTo(r[0],r[1]);c.lineTo(r2[0],r2[1])}c.stroke()});props([["horse",13,9],["horse",16,11]])}
    else if(race==="orc"&&V===1){// fortaleza de pedra bruta com espinhos
      const DK=WL("darkstone");yard(-26,-20,26,20,"#8a7a5a");const sp=(q,n,r)=>{c.strokeStyle="#d8ccb0";c.lineWidth=.8;c.beginPath();for(let k=0;k<n;k++){const t=k/n*6.283;c.moveTo(q[0]+Math.cos(t)*r,q[1]+Math.sin(t)*r*TILT);c.lineTo(q[0]+Math.cos(t)*r*1.5,q[1]+Math.sin(t)*r*TILT*1.5-2*m)}c.stroke()};
      for(const [u0,w0,u1,w1] of[[-24,-18,24,-18],[-24,-18,-24,18],[24,-18,24,18],[-24,18,-6,18],[6,18,24,18]])add((u0+u1)/2,(w0+w1)/2,()=>KR.drawWall(c,S(u0,w0),S(u1,w1),8*m,"stone"),-2);
      const bt=(u,w,h)=>add(u,w,()=>{const q=S(u,w),Pq=Pf(q[0],q[1],a);poly(c,[Pq(-4*m,4*m),Pq(4*m,4*m),Pq(2.6*m,2.6*m,h*m),Pq(-2.6*m,2.6*m,h*m)],DK[0],INK);poly(c,[Pq(4*m,-4*m),Pq(4*m,4*m),Pq(2.6*m,2.6*m,h*m),Pq(2.6*m,-2.6*m,h*m)],DK[1],INK);poly(c,[Pq(-2.6*m,-2.6*m,h*m),Pq(2.6*m,-2.6*m,h*m),Pq(2.6*m,2.6*m,h*m),Pq(-2.6*m,2.6*m,h*m)],"#6a6458",INK);sp([q[0],q[1]-h*m],8,3*m);flag(c,q[0],q[1]-h*m,6*m,ban)});
      for(const [u,w] of[[-24,-18],[24,-18],[-24,18],[24,18]])bt(u,w,14);gate(0,18);
      add(0,-6,()=>{const q=S(0,-6),Pq=Pf(q[0],q[1],a),h=30;poly(c,[Pq(-8*m,8*m),Pq(8*m,8*m),Pq(4*m,4*m,h*m),Pq(-4*m,4*m,h*m)],DK[0],INK);poly(c,[Pq(8*m,-8*m),Pq(8*m,8*m),Pq(4*m,4*m,h*m),Pq(4*m,-4*m,h*m)],DK[1],INK);poly(c,[Pq(-4*m,-4*m,h*m),Pq(4*m,-4*m,h*m),Pq(4*m,4*m,h*m),Pq(-4*m,4*m,h*m)],"#5a544a",INK);sp([q[0],q[1]-h*m],10,4.4*m);
        c.fillStyle="#d84a1a";for(const hh of[10,18]){const t=Pq(0,6.4*m-hh*m*.15,hh*m);c.fillRect(t[0]-.8*m,t[1]-2*m,1.6*m,2*m)}const sk=Pq(0,7*m,24*m);c.fillStyle="#efe6cb";c.strokeStyle=INK;c.lineWidth=.5;c.beginPath();c.arc(sk[0],sk[1],1.4*m,0,7);c.fill();c.stroke()});
      add(14,6,()=>{const q=S(14,6);KR.drawRound(c,q[0],q[1],7*m,4*m,6*m,{wall:"wooddark",roof:"hide",spike:true})});props([["fire",-10,8],["dummy",-14,0],["dummy",-10,-2]])}
    else if((race==="orc"||race==="tribal")&&V===2){// acampamento de guerra: grande salao de couro, torres de espinhos, fogueiras
      yard(-26,-20,26,20,"#9a8a62");add(0,-6,()=>{const q=S(0,-6);KR.drawRound(c,q[0],q[1],15*m,8*m,10*m,{wall:"wooddark",roof:"hide",spike:true})});
      for(let k=0;k<7;k++){const t=k/7*6.283+.3,u=Math.cos(t)*22,w=Math.sin(t)*16;add(u,w,()=>{const q=S(u,w);for(const dx of[-1.2,1.2]){c.strokeStyle=INK;c.lineWidth=1.2*m;c.beginPath();c.moveTo(q[0]+dx*m,q[1]);c.lineTo(q[0]+dx*.4*m,q[1]-14*m);c.stroke();c.strokeStyle="#6e4c2a";c.lineWidth=.7*m;c.stroke()}poly(c,[[q[0]-3*m,q[1]-12*m],[q[0]+3*m,q[1]-12*m],[q[0]+2.4*m,q[1]-14*m],[q[0]-2.4*m,q[1]-14*m]],"#6e4c2a",INK);c.strokeStyle="#efe6cb";c.lineWidth=.7;c.beginPath();c.moveTo(q[0]-2.4*m,q[1]-14*m);c.lineTo(q[0]-4*m,q[1]-17*m);c.moveTo(q[0]+2.4*m,q[1]-14*m);c.lineTo(q[0]+4*m,q[1]-17*m);c.stroke();flag(c,q[0],q[1]-14*m,5*m,ban)})}
      for(const [u,w] of[[-10,8],[10,8],[0,14]])props([["fire",u,w]]);props([["tent",-14,-12],["tent",14,-12],["dummy",6,4]])}
    else{const orc=race==="orc",wc=WL("wooddark");yard(-26,-20,26,20,orc?"#9a8a62":"#b8a978");const pal=(u0,w0,u1,w1)=>add((u0+u1)/2,(w0+w1)/2,()=>K.drawPalisade(c,S(u0,w0),S(u1,w1),8*m),-2);
      for(const [u0,w0,u1,w1] of[[-24,-18,24,-18],[-24,-18,-24,18],[24,-18,24,18],[-24,18,-5,18],[5,18,24,18]])pal(u0,w0,u1,w1);
      const wt=(u,w,h)=>add(u,w,()=>{const q=S(u,w);for(const [du,dw] of[[-2,-2],[2,-2],[-2,2],[2,2]]){const b=Pf(q[0],q[1],a)(du*m,dw*m,0);c.strokeStyle=INK;c.lineWidth=1.4*m;c.beginPath();c.moveTo(b[0],b[1]);c.lineTo(b[0],b[1]-h*m);c.stroke()}prism(c,q[0],q[1]-h*m,6*m,6*m,3*m,a,wc);cone(c,q[0],q[1]-(h+3)*m,4.6*m,5*m,orc?ROOF.hide:ROOF.thatch);if(orc){c.strokeStyle="#efe6cb";c.lineWidth=.8;c.beginPath();for(const sd of[-1,1]){c.moveTo(q[0]+sd*4*m,q[1]-(h+2)*m);c.lineTo(q[0]+sd*6.4*m,q[1]-(h+4.4)*m)}c.stroke()}});
      for(const [u,w] of[[-24,-18],[24,-18],[-24,18],[24,18],[-5,18],[5,18]])wt(u,w,9);
      add(0,-5,()=>{const q=S(0,-5);KR.drawRound(c,q[0],q[1],11*m,7*m,12*m,{wall:orc?"wooddark":"mud",roof:orc?"hide":"thatch",spike:orc})});if(V!==0)add(-12,4,()=>{const q=S(-12,4);KR.drawRound(c,q[0],q[1],6*m,4*m,6*m,{wall:"mud",roof:orc?"hide":"thatch",spike:orc})});props([["haystack",14,6],["crates",12,-8]])}}
  else if(C.form==="mound"){yard(-26,-20,26,20,"#9fb060");add(0,-6,()=>{const q=S(0,-6);KR.drawMound(c,q[0],q[1],{L:36*m,D:24*m,H:18*m,door:2,chim:1})});add(-16,6,()=>{const q=S(-16,6);KR.drawMound(c,q[0],q[1],{L:14*m,D:10*m,H:9*m,door:1,chim:1})});if(V)add(16,6,()=>{const q=S(16,6);KR.drawMound(c,q[0],q[1],{L:14*m,D:10*m,H:9*m,door:1})});rtower(-20,-14,2.6,12,"cone");rtower(20,-14,2.6,12,"cone");props([["flowerbed",-6,16],["flowerbed",6,16],["beehives",18,15]])}
  else if(C.form==="long"&&V===0){// salao nordico fortificado
    const wc=WL("wooddark");yard(-26,-20,26,20,"#a8a070");const pal=(u0,w0,u1,w1)=>add((u0+u1)/2,(w0+w1)/2,()=>K.drawPalisade(c,S(u0,w0),S(u1,w1),8*m),-2);for(const [u0,w0,u1,w1] of[[-24,-18,24,-18],[-24,-18,-24,18],[24,-18,24,18],[-24,18,-5,18],[5,18,24,18]])pal(u0,w0,u1,w1);
    hallp(0,-6,32,11,6,0,{roof:cold?"snow":"shingle",wall:"wooddark",R:11});hallp(-15,6,16,7,4,1.5708,{roof:cold?"snow":"shingle",wall:"wood",R:6});if(V)hallp(15,6,16,7,4,1.5708,{roof:cold?"snow":"shingle",wall:"wood",R:6});
    for(const [u,w] of[[-24,-18],[24,-18],[-24,18],[24,18]])add(u,w,()=>{const q=S(u,w);torreQ(c,q[0],q[1],3*m,13*m,6*m,RF(cold?"snow":"shingle"),wc,false,ANG_+.7854)});add(0,18,()=>{const q=S(0,18);torreQ(c,q[0]-5*m,q[1],2.6*m,11*m,5*m,RF("shingle"),wc,false,ANG_+.7854);torreQ(c,q[0]+5*m,q[1],2.6*m,11*m,5*m,RF("shingle"),wc,false,ANG_+.7854)})}
  else if(C.form==="long"&&V===1){// motte e bailey: colina com torre de madeira, patio com salao
    const wc=WL("wooddark"),sh=RF(cold?"snow":"shingle");yard(-26,-20,26,20,"#a8a070");const pal=(u0,w0,u1,w1)=>add((u0+u1)/2,(w0+w1)/2,()=>K.drawPalisade(c,S(u0,w0),S(u1,w1),7*m),-2);for(const [u0,w0,u1,w1] of[[-6,-18,24,-18],[24,-18,24,18],[-6,18,5,18],[12,18,24,18]])pal(u0,w0,u1,w1);
    add(-14,-2,()=>{const q=S(-14,-2);c.fillStyle="#8f9a5a";c.strokeStyle=INK;c.lineWidth=.8;c.beginPath();c.ellipse(q[0],q[1],14*m,14*m*TILT,0,0,7);c.fill();c.stroke();c.fillStyle="#a3ae68";c.beginPath();c.moveTo(q[0]-14*m,q[1]);c.quadraticCurveTo(q[0]-9*m,q[1]-14*m,q[0]-5*m,q[1]-15*m);c.lineTo(q[0]+5*m,q[1]-15*m);c.quadraticCurveTo(q[0]+9*m,q[1]-14*m,q[0]+14*m,q[1]);c.closePath();c.fill();c.stroke();
      const t=[q[0],q[1]-15*m];c.fillStyle="#b8bf7a";c.beginPath();c.ellipse(t[0],t[1],5*m,5*m*TILT,0,0,7);c.fill();c.stroke();for(let k=0;k<10;k++){const th=k/10*6.283;if(Math.sin(th)<0)continue}prism(c,t[0],t[1],6*m,6*m,12*m,a,wc);hipRoof(c,Pf(t[0],t[1],a),6*m,6*m,12*m,5*m,sh);flag(c,t[0],t[1]-17*m,6*m,ban);
      c.strokeStyle="#6e4c2a";c.lineWidth=.8;c.beginPath();const b0=S(-5,6),b1=S(-14,-2,13);c.moveTo(b0[0],b0[1]);c.lineTo(b1[0]+3*m,b1[1]);c.stroke()},-4);
    hallp(10,-6,20,8,5,0,{roof:cold?"snow":"shingle",wall:"wooddark",R:8});hallp(14,8,10,6,4,1.5708,{roof:cold?"snow":"shingle",wall:"wood",R:5});props([["haystack",4,10],["woodpile",20,-12]])}
  else if(C.form==="long"){// salao do jarl em terracos de pedra com igreja de madeira e pedras runicas
    const sh=cold?"snow":"shingle";yard(-26,-20,26,20,"#a8a070");add(0,-6,()=>{const q=S(0,-6);prism(c,q[0],q[1],40*m,18*m,3*m,a,["#a39c8a","#77705f"],"#b9b3a2")},-20);
    add(0,-6,()=>{const q=S(0,-6,3);hall(c,q[0],q[1],34*m,10*m,6*m,s,{ang:a,exact:1,roof:sh,wall:"wooddark",R:12*m})},.2);
    add(18,10,()=>{const q=S(18,10);for(let i=0;i<3;i++){const k=1-i*.28;prism(c,q[0],q[1]-i*6*m,8*k*m,8*k*m,6*m,a,WL("wooddark"));hipRoof(c,Pf(q[0],q[1]-i*6*m,a),8*k*m,8*k*m,6*m,(i===2?7:2.4)*m,RF(sh))}});
    for(const [u,w] of[[-10,12],[-4,15],[4,15]])add(u,w,()=>{const q=S(u,w);poly(c,[[q[0]-1.4*m,q[1]],[q[0]+1.4*m,q[1]],[q[0]+1*m,q[1]-6*m],[q[0],q[1]-6.8*m],[q[0]-1*m,q[1]-6*m]],"#9a958a",INK);c.strokeStyle="#a8352a";c.lineWidth=.5;c.beginPath();c.moveTo(q[0]-.5*m,q[1]-1*m);c.lineTo(q[0]+.4*m,q[1]-5*m);c.stroke()});
    hallp(-18,8,12,7,4,1.5708,{roof:sh,wall:"wood",R:5});props([["fire",0,8]])}
  else{// castelos de pedra (humanos, anoes, elfos, pantano): fortaleza, palacio, castelo alto
    const elf=race==="elfo",dw=race==="anao",top=dw?"cren":elf?"tall":"cone";
    if(V===0){yard(-24,-19,24,19,"#c9bfa0");for(const [u0,w0,u1,w1] of[[-22,-17,22,-17],[-22,-17,-22,17],[22,-17,22,17],[-22,17,-6,17],[6,17,22,17]])wall(u0,w0,u1,w1,dw?9:8);
      for(const [u,w] of[[-22,-17],[22,-17],[-22,17],[22,17]])rtower(u,w,dw?4.2:3.6,dw?14:17,top);gate(0,17);stower(-6,-7,14,dw?22:27,dw?"cren":"turrets");hallp(11,-8,18,8,9,1.5708,{});hallp(-14,6,12,7,7,0,{wall:"white"});
      add(-12,8,()=>{const q=S(-17,5);torreQ(c,q[0],q[1],1.8*m,11*m,5*m,RFc,W,false,ANG_+.7854)});props([["well",8,6],["crates",14,10],["cart",-6,12]])}
    else if(V===1){yard(-28,-20,28,20,"#a3b262");add(0,12,()=>{ground([[-14,4,0],[14,4,0],[14,18,0],[-14,18,0]],"#7f9c4a");ground([[-1.5,4,0],[1.5,4,0],[1.5,20,0],[-1.5,20,0]],"#e6dcc0");ground([[-14,10,0],[14,10,0],[14,12,0],[-14,12,0]],"#e6dcc0")});props([["fountain",0,11]]);
      hallp(0,-8,36,11,12,0,{wall:elf?"white":"stone",R:6});add(0,-8,()=>{const q=S(0,-8);prism(c,q[0],q[1],10*m,13*m,18*m,a,WL(elf?"white":"stone"));hipRoof(c,Pf(q[0],q[1],a),10*m,13*m,18*m,7*m,RFc);flag(c,...S(0,-8,25),7*m,ban)},.6);
      for(const sd of[-1,1]){hallp(sd*15,2,20,9,10,1.5708,{wall:elf?"white":"stone",R:5});rtower(sd*18,-8,3.4,22,top);rtower(sd*15,13,2.8,15,dw?"cren":"cone")}
      for(const sd of[-1,1])add(sd*5,20,()=>{const q=S(sd*5,20);prism(c,q[0],q[1],2*m,2*m,5*m,a,W);c.save();dome(c,q[0],q[1]-5*m,1.2*m,RFc);c.restore()})}
    else{add(0,-2,()=>{const q=S(0,-2);prism(c,q[0],q[1],46*m,36*m,4*m,a,["#a39c8a","#77705f"],"#b9b3a2");prism(c,q[0],q[1]-4*m,34*m,26*m,4*m,a,["#a39c8a","#77705f"],"#c9c2b0")},-30);
      const H0=8;const rt2=(u,w,r,h,t)=>add(u,w,()=>{const q=S(u,w,H0);cyl(c,q[0],q[1],r*m,h*m,W);if(dw){c.fillStyle=K.mixc(W[0],"#ffffff",.2);c.strokeStyle=INK;c.lineWidth=.6;c.beginPath();c.ellipse(q[0],q[1]-h*m,r*m*1.12,r*m*1.12*TILT,0,0,7);c.fill();c.stroke();cren([q[0],q[1]-h*m],r*m*1.08)}else cone(c,q[0],q[1]-h*m,r*1.3*m,r*(t==="tall"?3.6:2.4)*m,RFc);c.fillStyle="#2b2418";c.fillRect(q[0]-.5*m,q[1]-h*m*.6,1*m,1.8*m);if(t==="tall")flag(c,q[0],q[1]-h*m-r*3.6*m,5*m,ban)});
      add(0,-6,()=>{const q=S(0,-6,H0);hall(c,q[0],q[1],24*m,10*m,12*m,s,{ang:a,exact:1,wall:elf?"white":"stone",R:7*m})},.2);add(0,6,()=>{const q=S(0,6,H0);hall(c,q[0],q[1],16*m,8*m,9*m,s,{ang:a+1.5708,exact:1,wall:elf?"white":"stone",R:5*m})},.2);
      rt2(-11,-10,4,24,"cone");rt2(11,-11,3.4,30,"tall");rt2(0,-12,5,40,"tall");rt2(-12,8,3,18,"cone");rt2(12,8,3.2,21,"cone");
      add(0,16,()=>{const q=S(0,16);for(let i=0;i<4;i++){const Pq=Pf(q[0],q[1],a);quad(c,(u,w,h)=>Pq(u,w,h),[[-4*m,(2-i*1.6)*m,i*2*m],[4*m,(2-i*1.6)*m,i*2*m],[4*m,(2-i*1.6)*m,(i+1)*2*m],[-4*m,(2-i*1.6)*m,(i+1)*2*m]],"#c9c2b0");quad(c,(u,w,h)=>Pq(u,w,h),[[-4*m,(2-i*1.6)*m,(i+1)*2*m],[4*m,(2-i*1.6)*m,(i+1)*2*m],[4*m,(.4-i*1.6)*m,(i+1)*2*m],[-4*m,(.4-i*1.6)*m,(i+1)*2*m]],"#e2dccc")}},5)}}
  SC.fim()}
// <castelos2>
// ---------- castelos 2 (0.67): pecas com tamanho real, plantas e estilos por cultura ----------
// Cada peca (trecho de muralha, torre, portaria, torre de menagem, salao, capela, adereco) entra na cena com o
// contorno do chao que ela ocupa de verdade, entao a ordem entre as pecas sai certa em qualquer angulo e a ficha
// (pegada) do castelo fica exata. A planta, a torre de menagem, as torres e os extras variam pelo v do castelo.
const CST2={
  humano:{W:"stone",tops:["tile","dark","slate","tileb"],tor:"RQ",tR:["cone","agulha"],tQ:["ameia","piramide"],hM:8,T:2.8,keep:["donjon","palacio","redonda"],pl:["quadra","concentrico","poligono"],ban:"#a8352a",sal:{}},
  anao:{W:"darkstone",tops:["slate","dark"],tor:"Q",tR:["ameia"],tQ:["ameia"],hM:10,T:3.6,keep:["donjon","donjon","salao"],pl:["quadra","concentrico"],ban:"#5a5c63",grosso:1.2,sal:{wall:"darkstone"}},
  elfo:{W:"white",tops:["teal","blue","leaf"],tor:"R",tR:["agulha"],tQ:["piramide"],hM:6,T:2.2,keep:["redonda","palacio"],pl:["palacio","poligono","palacio"],ban:"#3f7a6a",esbelto:1.35,sal:{wall:"white"},jardim:1},
  eslavo:{W:"white",tops:["leaf","shingle"],tor:"Q",tR:["cone"],tQ:["piramide"],hM:7,T:2.6,keep:["palacio","donjon"],pl:["quadra","poligono"],ban:"#a8352a",cebola:1,sal:{wall:"white"}},
  mediterraneo:{W:"white",tops:["terra","tile2"],tor:"Q",tR:["ameia"],tQ:["ameia","telhado"],hM:7,T:2.6,keep:["palacio","donjon"],pl:["quadra","palacio","poligono"],ban:"#c9a24a",sal:{wall:"white"},cipreste:1},
  bizantino:{W:"brick",tops:["terra","tileb"],tor:"RQ",tR:["ameia","cupula"],tQ:["ameia"],hM:8,T:3,keep:["palacio","redonda"],pl:["poligono","concentrico"],ban:"#7a2a6a",faixa:1,cupula:1,sal:{wall:"brick"}},
  andino:{W:"darkstone",tops:["thatch","old"],tor:"Q",tR:["plano"],tQ:["plano","telhado"],hM:6,T:3.2,keep:["salao","palacio"],pl:["poligono","quadra"],ban:"#c9a24a",sal:{wall:"darkstone",roof:"thatch"}},
  gnomo:{W:"white",tops:["blue","gold","teal","tile2"],tor:"R",tR:["agulha","cone"],tQ:["piramide"],hM:6,T:2.2,keep:["redonda","palacio"],pl:["palacio","poligono"],ban:"#3f6f8f",esbelto:1.25,variado:1,sal:{wall:"white"},jardim:1},
  pirata:{W:"stone",tops:["patch","black"],tor:"R",tR:["ameia"],tQ:["ameia"],hM:6,T:3.4,keep:["salao","donjon"],pl:["poligono","quadra"],ban:"#1d160d",baixo:1,canhao:1,sal:{wall:"tar"}},
  japones:{W:"jpw",tops:["jp"],tor:"Y",muro:"jp",tR:["cone"],tQ:["ameia"],hM:6,T:2.2,keep:["tenshu"],pl:["quadra","poligono"],ban:"#efe6cb",sal:{wall:"jpw",roof:"jp"},asia:"jp"},
  chines:{W:"red",tops:["cn","cny"],tor:"Y",muro:"cn",tR:["cone"],tQ:["ameia"],hM:7,T:2.4,keep:["pagode","terracos"],pl:["quadra","concentrico"],ban:"#c9a24a",sal:{wall:"red",roof:"cn"},asia:"cn"},
  deserto:{W:"sand",tops:["sandtop"],tor:"B",muro:"barro",tR:["ameia"],tQ:["ameia"],hM:8,T:3,keep:["kasbah"],pl:["quadra","poligono"],ban:"#2f6f4a",cupulaC:["#6f9ec8","#3d6890"],sal:{wall:"sand",roof:"sandtop"},palmeira:1},
  egipcio:{W:"sand2",tops:["sandtop"],tor:"B",muro:"barro",tR:["ameia"],tQ:["ameia"],hM:8,T:3.2,keep:["kasbah"],pl:["quadra"],ban:"#3f6f8f",pilone:1,obelisco:1,cupulaC:["#e8c070","#b8873c"],sal:{wall:"sand2",roof:"sandtop"},palmeira:1},
  indiano:{W:"pink",tops:["terra"],tor:"C",tR:["ameia"],tQ:["ameia"],hM:8,T:3,keep:["palacioI"],pl:["quadra","palacio","poligono"],ban:"#2f6f4a",cupulaC:["#f3efe3","#c8beb0"],sal:{wall:"pink",roof:"terra"},jardim:1,palmeira:1},
  meso:{W:"lime",tops:["thatch"],tor:"B",muro:"barro",tR:["plano"],tQ:["plano"],hM:5,T:3,keep:["piramide"],pl:["quadra","poligono"],ban:"#3f8a6a",sal:{wall:"lime",roof:"thatch"},estela:1},
  orc:{W:"darkstone",tops:["hide","old"],tor:"MQ",muro:"palpedra",tR:["ameia"],tQ:["ameia"],hM:8,T:3.4,keep:["redondo","donjon"],pl:["anel","quadra"],ban:"#4a3a2a",espinhos:1,sal:{wall:"wooddark",roof:"hide"}},
  tribal:{W:"mud",tops:["thatch","old"],tor:"M",muro:"pal",tR:["plano"],tQ:["plano"],hM:7,T:1.4,keep:["redondo"],pl:["anel"],ban:"#a8352a",sal:{wall:"mud",roof:"thatch"},totem:1},
  celta:{W:"stone",tops:["thatch","old"],tor:"MQ",muro:"palpedra",tR:["plano"],tQ:["plano"],hM:6,T:2.8,keep:["broch","redondo"],pl:["anel"],ban:"#3f6f4a",sal:{wall:"daub",roof:"thatch"},pedrasR:1},
  norte:{W:"stone",tops:["shingle","old","moss"],tor:"MQ",muro:"palpedra",tR:["plano"],tQ:["telhado"],hM:7,T:1.4,keep:["longo","motte"],pl:["quadra","anel"],ban:"#3f6f8f",sal:{wall:"wooddark",roof:"shingle"},runas:1},
  pantano:{W:"wood",tops:["thatch","old"],tor:"M",muro:"pal",tR:["plano"],tQ:["telhado"],hM:6,T:1.4,keep:["palafita"],pl:["anel"],ban:"#5f7e35",sal:{wall:"wood",roof:"thatch"},palafita:1},
  mongol:{W:"felt",tops:["felt"],tor:"M",muro:"pal",tR:["plano"],tQ:["telhado"],hM:5,T:1.4,keep:["iurta"],pl:["acampamento"],ban:"#3f6f8f",sal:{wall:"felt",roof:"felt"}},
  halfling:{W:"daub",tops:["leaf"],tor:"M",muro:"sebe",tR:["plano"],tQ:["telhado"],hM:4,T:2,keep:["toca"],pl:["colina"],ban:"#c9a24a",sal:{wall:"daub",roof:"leaf"},jardim:1},
  vapor:{W:["#7d8186","#54585e"],tops:["iron","copper","rust"],tor:"R",tR:["cupula","ameia"],tQ:["ameia"],hM:8,T:3,keep:["donjon","palacio"],pl:["quadra","concentrico"],ban:"#c9a24a",chamine:1,sal:{wall:"brick"}}
};
function fortress2(c,x,y,a,m,race,v,cold,cst){const E=CST2[race];if(!E)return false;
  const e0=ESP_;ESP_=false;ANG_=a-.34;const s=ST(race),P=Pf(x,y,a),S=(u,w,h)=>P(u*m,w*m,(h||0)*m),SC=cena((u,w,h)=>S(u,w,h),c);
  const hh=k=>{const t=Math.sin(((v||0)*1000+k*7.13)*12.9898)*43758.5453;return t-Math.floor(t)},pk=(arr,k)=>arr[Math.floor(hh(k)*arr.length)%arr.length];
  const W=WL(E.W),Wt=K.mixc(W[0],"#ffffff",.18),rfK=cold?"snow":pk(E.tops,1),RFt=RF(rfK),ban=E.ban,G=E.grosso||1,ESB=E.esbelto||1;
  const PREF={fortaleza:["concentrico","quadra","anel"],palacio:["palacio","quadra"],alto:["poligono","quadra","anel"]}[cst],plano=PREF?(PREF.find(z=>E.pl.includes(z))||pk(E.pl,2)):pk(E.pl,2),keepT0=cst==="alto"&&E.keep.includes("redonda")?"redonda":cst==="palacio"&&E.keep.includes("palacio")?"palacio":cst==="fortaleza"&&E.keep.includes("donjon")?"donjon":pk(E.keep,3),tor=E.tor==="RQ"?(hh(4)<.6?"R":"Q"):E.tor,topR=pk(E.tR,5),topQ=pk(E.tQ,6);
  const hM=E.hM*(E.baixo?.85:1),T=E.T;
  // ---------- desenho das partes ----------
  const slit=(p,hgt)=>{c.fillStyle="#2b2418";c.fillRect(p[0]-.35*m,p[1]-hgt*m,.7*m,hgt*m)};
  const ameiasQ=(Pq,L,D,h,col)=>{const pts=[];const n1=Math.max(2,Math.round(L/1.9)),n2=Math.max(2,Math.round(D/1.9));
    for(let i=0;i<n1;i++)for(const sd of[-1,1])pts.push([-L/2+(i+.5)*L/n1,sd*(D/2-.4)]);for(let i=0;i<n2;i++)for(const sd of[-1,1])pts.push([sd*(L/2-.4),-D/2+(i+.5)*D/n2]);
    const L2=pts.map(p=>[p,Pq(p[0]*m,p[1]*m,h*m)]).sort((A,B)=>A[1][1]-B[1][1]);for(const [,q] of L2)prism(c,q[0],q[1],.95*m,.95*m,1.4*m,ANG_+.34,col||W)};
  const anel=(t,r,col)=>{const cc=col||W;c.fillStyle=K.mixc(cc[0],"#ffffff",.2);c.strokeStyle=INK;c.lineWidth=.6;c.beginPath();c.ellipse(t[0],t[1],r*1.1,r*1.1*TILT,0,0,7);c.fill();c.stroke();
    c.fillStyle=K.mixc(cc[1],"#000000",.15);c.beginPath();c.ellipse(t[0],t[1]+.25*m,r*.72,r*.72*TILT,0,0,7);c.fill();
    const n=10,ms=[];for(let i=0;i<n;i++){const th=i/n*6.2832;ms.push([t[0]+Math.cos(th)*r,t[1]+Math.sin(th)*r*TILT])}ms.sort((A,B)=>A[1]-B[1]);c.lineWidth=.5;
    for(const q of ms){c.fillStyle=K.mixc(cc[0],"#ffffff",.12);c.fillRect(q[0]-.6*m,q[1]-1.5*m,1.2*m,1.5*m);c.strokeRect(q[0]-.6*m,q[1]-1.5*m,1.2*m,1.5*m)}};
  // trecho de muralha entre dois pontos; o caminho de ronda e as ameias ficam por cima
  const MUR=E.muro==="palpedra"?(hh(17)<.5?"pal":"pedra"):(E.muro||"pedra");
  const muro=(u0,w0,u1,w1,h,o)=>{o=o||{};const L=Math.hypot(u1-u0,w1-w0);if(L<.6)return;const n=Math.max(1,Math.ceil(L/8)),th=Math.atan2(w1-w0,u1-u0),tk=(o.T||T)*G,cw=o.W||W,est=o.est||MUR;
    if(est!=="pedra"){for(let i=0;i<n;i++){const a0=i/n,a1=(i+1)/n,ua=u0+(u1-u0)*a0,wa=w0+(w1-w0)*a0,ub=u0+(u1-u0)*a1,wb=w0+(w1-w0)*a1,um=(ua+ub)/2,wm=(wa+wb)/2,l=L/n;
      if(est==="pal"){SC.cx(um,wm,l,1.6,h+1,()=>{K.drawPalisade(c,S(ua,wa),S(ub,wb),h*m);if(E.espinhos){const Pq=Pf(...S(um,wm),a+th);c.strokeStyle="#e8dcc0";c.lineWidth=.7;for(let j=0;j<Math.round(l/3);j++){const b0=Pq((-l/2+(j+.5)*l/Math.round(l/3))*m,0,h*.6*m),b1=Pq((-l/2+(j+.5)*l/Math.round(l/3))*m,2.4*m,h*.75*m);c.beginPath();c.moveTo(b0[0],b0[1]);c.lineTo(b1[0],b1[1]);c.stroke()}}},{r:th});continue}
      if(est==="sebe"){SC.cx(um,wm,l,2.4,3.4,()=>{const Pq=Pf(...S(um,wm),a+th);prism(c,...S(um,wm),l*m,2.2*m,2.6*m,a+th,["#5f7e35","#3f5a2a"],"#7a9a4a");c.fillStyle="rgba(255,255,255,.18)";for(let j=0;j<l;j+=1.6){const q=Pq((j-l/2)*m,0,2.6*m);c.beginPath();c.arc(q[0],q[1],.7*m,0,7);c.fill()}},{r:th});continue}
      SC.cx(um,wm,l,tk,h+(est==="barro"?1.8:1.4),()=>{const q=S(um,wm),aa=a+th,Pq=Pf(q[0],q[1],aa);
        if(est==="jp"||est==="cn"){const hb=est==="jp"?h*.42:h*.22,top=est==="jp"?ROOF.jp:RF(rfK);prism(c,q[0],q[1],(l+.2)*m,(tk+.8)*m,hb*m,aa,["#a39c8a","#77705f"],"#b9b3a2");const t=Pq(0,0,hb*m);prism(c,t[0],t[1],l*m,tk*m,(h-hb)*m,aa,cw,cw[0]);const t2=Pq(0,0,h*m);prism(c,t2[0],t2[1],(l+.3)*m,(tk+1.4)*m,.9*m,aa,top,K.mixc(top[0],"#ffffff",.15))}
        else{prism(c,q[0],q[1],l*m,tk*m,h*m,aa,cw,K.mixc(cw[0],"#ffffff",.1));const k=Math.max(1,Math.round(l/1.6)),ms=[];for(let j=0;j<k;j++)for(const sd of[-1,1])ms.push(Pq((-l/2+(j+.5)*l/k)*m,sd*(tk/2-.3)*m,h*m));ms.sort((A,B)=>A[1]-B[1]);
          for(const p of ms)poly(c,[[p[0]-.45*m,p[1]],[p[0]+.45*m,p[1]],[p[0]+.3*m,p[1]-1.3*m],[p[0],p[1]-1.8*m],[p[0]-.3*m,p[1]-1.3*m]],cw[0],INK)}},{r:th})}return}
    for(let i=0;i<n;i++){const a0=i/n,a1=(i+1)/n,ua=u0+(u1-u0)*a0,wa=w0+(w1-w0)*a0,ub=u0+(u1-u0)*a1,wb=w0+(w1-w0)*a1,um=(ua+ub)/2,wm=(wa+wb)/2,l=L/n;
      SC.cx(um,wm,l,tk,h+1.4,()=>{const q=S(um,wm),aa=a+th;prism(c,q[0],q[1],l*m,tk*m,h*m,aa,cw,K.mixc(cw[0],"#ffffff",.08));const Pq=Pf(q[0],q[1],aa);
        if(E.faixa){c.strokeStyle=K.mixc(cw[1],"#ffffff",.35);c.lineWidth=.9*m;for(const sd of[-1,1]){const A_=Pq(-l/2*m,sd*tk/2*m,h*.45*m),B_=Pq(l/2*m,sd*tk/2*m,h*.45*m);if((Pq(0,sd,0)[1]-Pq(0,0,0)[1])>0){c.beginPath();c.moveTo(A_[0],A_[1]);c.lineTo(B_[0],B_[1]);c.stroke()}}}
        const k=Math.max(1,Math.round(l/1.9)),ms=[];for(let j=0;j<k;j++)for(const sd of[-1,1])ms.push(Pq((-l/2+(j+.5)*l/k)*m,sd*(tk/2-.35)*m,h*m));ms.sort((A,B)=>A[1]-B[1]);
        if(!o.liso)for(const p of ms)prism(c,p[0],p[1],.95*m,.7*m,1.4*m,aa,cw);
        for(const sd of[-1,1]){if((Pq(0,sd,0)[1]-Pq(0,0,0)[1])<=0)continue;const k2=Math.max(1,Math.floor(l/5));for(let j=0;j<k2;j++)slit(Pq((-l/2+(j+.5)*l/k2)*m,sd*tk/2*m,h*.62*m),1.6)}},{r:th})}};
  // torre redonda
  const torreR=(u,w,r,h,topo,o)=>{o=o||{};r*=G;h*=ESB;const th=topo==="agulha"?r*3.6:topo==="cone"?r*2.4:topo==="cupula"?r*1.1:topo==="cebola"?r*2.8:1.6,cw=o.W||W,rf=o.RF||RFt;
    SC.rd(u,w,r+.3,h+th,()=>{const q=S(u,w);cyl(c,q[0],q[1],r*m,h*m,cw,o.tp||1,E.faixa?[[h*.42*m,h*.47*m,cw[1]],[h*.7*m,h*.74*m,cw[1]]]:null);const t=[q[0],q[1]-h*m];
      if(topo==="ameia"||topo==="plano")anel(t,r*m*1.05,cw);
      else if(topo==="cupula"){c.save();dome(c,t[0],t[1],r*m*1.02,rf);c.restore()}
      else if(topo==="cebola"){cyl(c,t[0],t[1],r*.7*m,1.4*m,cw);K.onion(c,t[0],t[1]-1.4*m,r*.8*m,ROOF.gold)}
      else{c.fillStyle=K.mixc(cw[0],"#ffffff",.15);c.strokeStyle=INK;c.lineWidth=.6;c.beginPath();c.ellipse(t[0],t[1],r*m*1.08,r*m*1.08*TILT,0,0,7);c.fill();c.stroke();cone(c,t[0],t[1],r*1.28*m,th*m,rf)}
      if(o.flag)flag(c,t[0],t[1]-(topo==="agulha"?th:topo==="cone"?th:1.5)*m,5*m,ban);
      for(const f of[.38,.66])slit([q[0]+(hh(u*3+w)-.5)*r*.6*m,q[1]-h*m*f],1.8)},{});};
  // torre quadrada
  const torreQd=(u,w,L,h,topo,o)=>{o=o||{};L*=G;h*=ESB;const ao=o.ao||0,rh=topo==="piramide"?L*1.5:topo==="telhado"?L*.6:topo==="cebola"?L*1.8:1.6,cw=o.W||W,rf=o.RF||RFt;
    SC.cx(u,w,L,L,h+rh,()=>{const q=S(u,w),aa=a+ao,Pq=Pf(q[0],q[1],aa);prism(c,q[0],q[1],L*m,L*m,h*m,aa,cw,K.mixc(cw[0],"#ffffff",.1));
      for(const [du,dw] of[[0,1],[0,-1],[1,0],[-1,0]]){if((Pq(du,dw,0)[1]-Pq(0,0,0)[1])<=0)continue;for(const f of[.4,.7])slit(Pq(du*L/2*m,dw*L/2*m,h*f*m),1.8)}
      if(topo==="piramide"||topo==="telhado")hipRoof(c,(uu,ww,zz)=>Pq(uu,ww,zz),L*m,L*m,h*m,rh*m,rf);
      else if(topo==="cebola"){const t=Pq(0,0,h*m);cyl(c,t[0],t[1],L*.32*m,2*m,cw);K.onion(c,t[0],t[1]-2*m,L*.36*m,E.cebola?ROOF.gold:rf)}
      else{ameiasQ(Pq,L,L,h,cw);if(o.bart)for(const [du,dw] of[[-1,-1],[1,-1],[-1,1],[1,1]].map(p=>[p,Pq(p[0]*L/2*m,p[1]*L/2*m,h*m)]).sort((A,B)=>A[1][1]-B[1][1]).map(z=>z[0])){const b=Pq(du*L/2*m,dw*L/2*m,h*m);cyl(c,b[0],b[1],1.3*m,2.6*m,cw);cone(c,b[0],b[1]-2.6*m,1.6*m,3.4*m,rf)}}
      if(o.flag)flag(c,...Pq(0,0,(h+rh)*m),6*m,ban)},{r:ao})};
  const torreM=(u,w,L,h,o)=>{o=o||{};const rh=L*.8;SC.cx(u,w,L,L,h+rh+1,()=>{const q=S(u,w),Pq=Pf(q[0],q[1],a),pd=K.mixc(WL(E.sal.wall||"wooddark")[1],"#000000",.1);
      const pts=[[-1,-1],[1,-1],[-1,1],[1,1]].map(p=>[p,Pq(p[0]*L*.42*m,p[1]*L*.42*m,0)]).sort((A,B)=>A[1][1]-B[1][1]);for(const [p,b] of pts.slice(0,2)){line(c,b,[b[0],b[1]-h*m],1.1*m,pd)}
      c.strokeStyle=pd;c.lineWidth=.5*m;for(const z of[.35,.65]){const A_=Pq(-L*.42*m,L*.42*m,h*z*m),B_=Pq(L*.42*m,L*.42*m,h*z*m),C_=Pq(L*.42*m,-L*.42*m,h*z*m);c.beginPath();c.moveTo(A_[0],A_[1]);c.lineTo(B_[0],B_[1]);c.lineTo(C_[0],C_[1]);c.stroke()}
      for(const [p,b] of pts.slice(2))line(c,b,[b[0],b[1]-h*m],1.1*m,pd);const t=Pq(0,0,h*m);prism(c,t[0],t[1],L*m,L*m,2.2*m,a,WL(E.sal.wall||"wooddark"));hipRoof(c,(uu,ww,zz)=>Pq(uu,ww,zz+h*m+2.2*m),L*m,L*m,0,rh*m,RFt);if(o.flag)flag(c,...Pq(0,0,(h+rh+2.2)*m),5*m,ban)})};
  const tronco=(Pq,L,Lt,h,cw)=>{const b=[[-1,-1],[1,-1],[1,1],[-1,1]].map(p=>Pq(p[0]*L/2*m,p[1]*L/2*m,0)),t=[[-1,-1],[1,-1],[1,1],[-1,1]].map(p=>Pq(p[0]*Lt/2*m,p[1]*Lt/2*m,h*m)),o0=Pq(0,0,0),F=[];for(let i=0;i<4;i++){const j=(i+1)%4,mx=(b[i][0]+b[j][0])/2-o0[0],my=(b[i][1]+b[j][1])/2-o0[1];if(my<=0)continue;F.push([mx,[b[i],b[j],t[j],t[i]]])}
    for(const [mx,f] of F)poly(c,f,mx<0?cw[0]:cw[1],INK);poly(c,t,K.mixc(cw[0],"#ffffff",.15),INK);return t};
  const torreB=(u,w,L,h,o)=>{o=o||{};SC.cx(u,w,L,L,h+1.8,()=>{const q=S(u,w),Pq=Pf(q[0],q[1],a);tronco(Pq,L,L*.78,h,W);const P2=(uu,ww,zz)=>Pq(uu,ww,zz+h*m),ms=[];for(let i=0;i<4;i++)for(const sd of[-1,1]){ms.push(P2((-L*.39+i*L*.26)*m,sd*L*.37*m,0));ms.push(P2(sd*L*.37*m,(-L*.39+i*L*.26)*m,0))}
      ms.sort((A,B)=>A[1]-B[1]);for(const p of ms)poly(c,[[p[0]-.45*m,p[1]],[p[0]+.45*m,p[1]],[p[0]+.3*m,p[1]-1.3*m],[p[0],p[1]-1.8*m],[p[0]-.3*m,p[1]-1.3*m]],W[0],INK);for(const f of[.45,.72])slit(Pq(0,L*.42*m,h*f*m),1.6);if(o.flag)flag(c,...P2(0,0,0),6*m,ban)})};
  const torreY=(u,w,L,h,o)=>{o=o||{};SC.cx(u,w,L+2,L+2,h+L*.6+3,()=>{const q=S(u,w),Pq=Pf(q[0],q[1],a);tronco(Pq,L+1.5,L,h*.45,["#a39c8a","#77705f"]);const t=Pq(0,0,h*.45*m);KR.drawAsian(c,t[0],t[1],{L:L*m,D:L*m,H:h*.55*m,R:L*.42*m,ang:a,roof:E.asia==="cn"?rfK:"jp",wall:E.asia==="cn"?"red":"jpw",base:0})})};
  const torreC=(u,w,r,h,o)=>{o=o||{};SC.rd(u,w,r+.4,h+r*2.2,()=>{const q=S(u,w);cyl(c,q[0],q[1],r*m,h*m,W,.94);const t=[q[0],q[1]-h*m];anel(t,r*m,W);for(const [dx,dz] of[[-.5,0],[.5,0]])line(c,[t[0]+dx*r*m,t[1]-.4*m],[t[0]+dx*r*m,t[1]-r*1.1*m],.6*m,W[1]);
      c.save();dome(c,t[0],t[1]-r*1.1*m,r*.62*m,E.cupulaC||ROOF.gold);c.restore();if(o.flag)flag(c,t[0],t[1]-r*1.8*m,5*m,ban)})};
  const TORK=E.tor==="MQ"?(MUR==="pal"?"M":"Q"):tor;
  const keepT=MUR==="pal"&&keepT0==="donjon"?"redondo":keepT0;
  const torre=(u,w,s_,h,o)=>TORK==="M"?torreM(u,w,s_*.8,h,o):TORK==="B"?torreB(u,w,s_,h,o):TORK==="Y"?torreY(u,w,s_*.78,h*.8,o):TORK==="C"?torreC(u,w,s_*.55,h,o):TORK==="R"?torreR(u,w,s_*.5,h,o&&o.topo||topR,o):torreQd(u,w,s_,h,o&&o.topo||topQ,o);
  // portaria: bloco com arco e grade, ladeado por duas torres (ou uma torre so com passagem)
  const portaria=(u,w,ao,tipo)=>{const ca=Math.cos(ao),sa=Math.sin(ao),hp=hM+4,Lb=9*G,Db=7*G;
    if(MUR==="pal"||MUR==="sebe"){SC.cx(u,w,9,4,hM+6,()=>{const q=S(u,w),aa=a+ao,Pq=Pf(q[0],q[1],aa),pd=WL(E.sal.wall||"wooddark");for(const sd of[-1,1]){const b=Pq(sd*4*m,0,0);line(c,b,[b[0],b[1]-(hM+3)*m],1.3*m,pd[1])}const A_=Pq(-4.6*m,0,(hM+2.4)*m),B_=Pq(4.6*m,0,(hM+2.4)*m);line(c,A_,B_,1.2*m,pd[1]);if(MUR==="sebe"){const t=Pq(0,0,(hM+2.4)*m);c.fillStyle="#5f7e35";c.beginPath();c.ellipse(t[0],t[1],5*m,1.6*m,0,0,7);c.fill()}else{for(const sd of[-1,1]){const t=Pq(sd*4*m,0,(hM+3)*m);c.fillStyle="#e8e0cc";c.strokeStyle=INK;c.lineWidth=.5;c.beginPath();c.arc(t[0],t[1]-.6*m,.9*m,0,7);c.fill();c.stroke()}}},{r:ao});if(MUR==="pal")for(const sd of[-1,1]){const du=sd*7;torreM(u+ca*du,w+sa*du,4.6,hM+4,{flag:sd>0})}return}
    if(E.pilone){SC.cx(u,w,16,5,hM+8,()=>{const q=S(u,w),aa=a+ao,Pq=Pf(q[0],q[1],aa);for(const sd of[-1,1]){const P2=(uu,ww,zz)=>Pq(uu+sd*4.6*m,ww,zz);tronco(P2,6.6,4.6,hM+7,W);const fr=P2(0,2.4*m,(hM+3)*m);c.strokeStyle="rgba(80,60,30,.55)";c.lineWidth=.4;for(let k=0;k<4;k++){c.beginPath();c.moveTo(fr[0]-1.6*m,fr[1]+k*1.4*m);c.lineTo(fr[0]+1.6*m,fr[1]+k*1.4*m);c.stroke()}}
      prism(c,...Pq(0,0,0),3.2*m,3.2*m,(hM+3)*m,aa,W);const pts=[Pq(-1.3*m,1.7*m,0),Pq(1.3*m,1.7*m,0),Pq(1.3*m,1.7*m,5*m),Pq(-1.3*m,1.7*m,5*m)];poly(c,pts,"#241b12",INK);for(const sd of[-1,1])flag(c,...Pq(sd*7.4*m,1.8*m,0),(hM+12)*m,ban,4*m)},{r:ao});return}
    if(E.asia){SC.cx(u,w,12,7,hM+9,()=>{const q=S(u,w),aa=a+ao,Pq=Pf(q[0],q[1],aa);tronco(Pq,12,11,3,["#a39c8a","#77705f"]);const t=Pq(0,0,3*m);KR.drawAsian(c,t[0],t[1],{L:10*m,D:5*m,H:5*m,R:3.8*m,ang:aa,roof:E.asia==="cn"?rfK:"jp",wall:E.asia==="cn"?"red":"jpw",base:0});for(const sd of[1,-1]){if((Pq(0,sd,0)[1]-Pq(0,0,0)[1])<=0)continue;poly(c,[Pq(-1.8*m,sd*5.6*m,0),Pq(1.8*m,sd*5.6*m,0),Pq(1.8*m,sd*5.6*m,3*m),Pq(-1.8*m,sd*5.6*m,3*m)],"#241b12",INK)}},{r:ao});return}
    SC.cx(u,w,Lb,Db,hp+1.4,()=>{const q=S(u,w),aa=a+ao,Pq=Pf(q[0],q[1],aa);prism(c,q[0],q[1],Lb*m,Db*m,hp*m,aa,W,Wt);
      for(const sd of[1,-1]){if((Pq(0,sd,0)[1]-Pq(0,0,0)[1])<=0)continue;const pts=[Pq(-2.3*m,sd*Db/2*m,0)];for(let i=0;i<=8;i++){const t=Math.PI-Math.PI*i/8;pts.push(Pq(Math.cos(t)*2.3*m,sd*Db/2*m,(4.6+Math.sin(t)*2.3)*m))}pts.push(Pq(2.3*m,sd*Db/2*m,0));poly(c,pts,"#241b12",INK);
        c.strokeStyle="#6a5a44";c.lineWidth=.45;c.beginPath();for(let i=-2;i<=2;i++){const A_=Pq(i*.9*m,sd*Db/2*m,0),B_=Pq(i*.9*m,sd*Db/2*m,5.8*m);c.moveTo(A_[0],A_[1]);c.lineTo(B_[0],B_[1])}for(const z of[1.6,3.4]){const A_=Pq(-2.2*m,sd*Db/2*m,z*m),B_=Pq(2.2*m,sd*Db/2*m,z*m);c.moveTo(A_[0],A_[1]);c.lineTo(B_[0],B_[1])}c.stroke();
        banner(c,...Pq(0,sd*(Db/2+.1)*m,(hp-1)*m),ban)}
      ameiasQ(Pq,Lb,Db,hp,W)},{r:ao});
    if(tipo!=="simples")for(const sd of[-1,1]){const du=sd*(Lb/2+2.2*G);torre(u+ca*du,w+sa*du,6,hp+3,{flag:sd>0})}};
  // torre de menagem
  const menagem=(u,w,tipo)=>{
    if(tipo==="tenshu"){const lv=2+Math.floor(hh(21)*3),bh=7+hh(22)*4;SC.cx(u,w,24,19,bh+lv*6.6+6,()=>{const q=S(u,w),Pq=Pf(q[0],q[1],a);tronco(Pq,24,19,bh,["#a39c8a","#77705f"]);let t=Pq(0,0,bh*m);for(let i=0;i<lv;i++){const k=1-i*.16;KR.drawAsian(c,t[0],t[1],{L:17*k*m,D:13*k*m,H:5.4*m,R:4.2*k*m,ang:a,roof:"jp",wall:"jpw",base:0});t=[t[0],t[1]-6.6*m]}c.fillStyle="#c9a24a";c.beginPath();c.ellipse(t[0]-2*m,t[1]+2*m,1*m,.6*m,0,0,7);c.ellipse(t[0]+2*m,t[1]+2*m,1*m,.6*m,0,0,7);c.fill()});return}
    if(tipo==="pagode"||tipo==="terracos"){const n=tipo==="pagode"?2:3;SC.cx(u,w,30,16,n*1.6+11,()=>{const q=S(u,w);for(let i=0;i<n;i++)prism(c,q[0],q[1]-i*1.6*m,(30-i*3)*m,(16-i*3)*m,1.6*m,a,["#e6e0d0","#a8a294"]);KR.drawAsian(c,q[0],q[1]-n*1.6*m,{L:(28-n*3)*m,D:(13-n*3)*m,H:6*m,R:5*m,ang:a,roof:rfK,wall:"red",base:0})});
      if(tipo==="pagode")for(const sd of[hh(26)<.5?-1:1])SC.rd(u+sd*19,w-2,4,32,()=>pagode(c,...S(u+sd*19,w-2),4,7*m,E.asia==="cn"?"cn":"jp","red",ANG_+.7854));return}
    if(tipo==="kasbah"||tipo==="palacioI"){const WS=W,ind=tipo==="palacioI";SC.cx(u,w,28,15,22,()=>{const q=S(u,w),Pq=Pf(q[0],q[1],a);prism(c,q[0],q[1],28*m,15*m,10*m,a,WS);const fs=(Pq(0,1,0)[1]-Pq(0,0,0)[1])>0?1:-1;
        for(let i=-3;i<=3;i++){const t=Pq(i*3.8*m,fs*7.5*m,0);c.fillStyle="#2b2418";c.beginPath();c.moveTo(t[0]-1*m,t[1]);c.lineTo(t[0]-1*m,t[1]-3.6*m);c.quadraticCurveTo(t[0],t[1]-5*m,t[0]+1*m,t[1]-3.6*m);c.lineTo(t[0]+1*m,t[1]);c.fill()}
        const t=Pq(0,0,10*m);prism(c,t[0],t[1],11*m,9*m,3*m,a,WS);c.save();dome(c,t[0],t[1]-3*m,6*m,E.cupulaC||ROOF.gold);c.restore();
        const cs=[[-12,-6],[12,-6],[-12,6],[12,6]].map(p=>[p,Pq(p[0]*m,p[1]*m,10*m)]).sort((A,B)=>A[1][1]-B[1][1]);for(const [,q2] of cs){if(ind){for(const dx of[-.9,.9])line(c,[q2[0]+dx*m,q2[1]],[q2[0]+dx*m,q2[1]-2.6*m],.5*m,WS[1]);c.save();dome(c,q2[0],q2[1]-2.6*m,1.6*m,E.cupulaC);c.restore()}else{cyl(c,q2[0],q2[1],1.5*m,3.4*m,WS);c.save();dome(c,q2[0],q2[1]-3.4*m,1.5*m,E.cupulaC||ROOF.gold);c.restore()}}});
      if(!ind&&hh(23)<.6)SC.rd(u+16,w-6,2,32,()=>{const q=S(u+16,w-6);cyl(c,q[0],q[1],1.8*m,28*m,W,.85);cone(c,q[0],q[1]-28*m,2*m,4*m,E.cupulaC||ROOF.gold)});return}
    if(tipo==="piramide"){const n=4+Math.floor(hh(24)*2);SC.cx(u,w,30,26,n*4+9,()=>{const q=S(u,w),Pq=Pf(q[0],q[1],a);for(let i=0;i<n;i++)prism(c,q[0],q[1]-i*4*m,(30-i*5)*m,(26-i*4.4)*m,4*m,a,["#d8d0b0","#9a917a"]);const fs=(Pq(0,1,0)[1]-Pq(0,0,0)[1])>0?1:-1;
        poly(c,[Pq(-2.6*m,fs*13*m,0),Pq(2.6*m,fs*13*m,0),Pq(1.8*m,fs*(13-n*2.2)*m,n*4*m),Pq(-1.8*m,fs*(13-n*2.2)*m,n*4*m)],"#c9bf9e",INK);const t=[q[0],q[1]-n*4*m];KR.drawFlat(c,t[0],t[1],{L:9*m,D:7*m,H:5*m,ang:a,wall:"lime"});c.fillStyle="#a8352a";c.fillRect(t[0]-1.4*m,t[1]-6.6*m,2.8*m,1.4*m)});return}
    if(tipo==="redondo"){SC.rd(u,w,11,20,()=>{const q=S(u,w);KR.drawRound(c,q[0],q[1],11*m,7*m,12*m,{wall:E.sal.wall||"wooddark",roof:E.sal.roof||"hide",spike:!!E.espinhos})});return}
    if(tipo==="broch"){SC.rd(u,w,8,24,()=>{const q=S(u,w);cyl(c,q[0],q[1],8*m,20*m,W,.78);const t=[q[0],q[1]-20*m];anel(t,8*.78*m,W);slit([q[0],q[1]-8*m],2);slit([q[0]+3*m,q[1]-14*m],1.6)});SC.rd(u+12,w+6,5,10,()=>{const q=S(u+12,w+6);KR.drawRound(c,q[0],q[1],5*m,3.4*m,6*m,{wall:"daub",roof:"thatch"})});return}
    if(tipo==="longo"){hallp(u,w,30,10,5,0,{wall:E.sal.wall,roof:rfK,R:9});for(const sd of[-1,1])SC.rd(u+sd*15.5,w,.8,14,()=>{const q=S(u+sd*15.5,w,13);c.strokeStyle="#5a4028";c.lineWidth=.9*m;c.beginPath();c.moveTo(q[0]-1.4*m,q[1]);c.quadraticCurveTo(q[0],q[1]-2.6*m,q[0]+1.4*m,q[1]);c.stroke()});return}
    if(tipo==="motte"){SC.rd(u,w,12,24,()=>{const q=S(u,w);c.fillStyle="#8f9a5a";c.strokeStyle=INK;c.lineWidth=.8;c.beginPath();c.ellipse(q[0],q[1],12*m,12*m*TILT,0,0,7);c.fill();c.stroke();c.fillStyle="#a3ae68";c.beginPath();c.moveTo(q[0]-12*m,q[1]);c.quadraticCurveTo(q[0]-8*m,q[1]-11*m,q[0]-4*m,q[1]-11*m);c.lineTo(q[0]+4*m,q[1]-11*m);c.quadraticCurveTo(q[0]+8*m,q[1]-11*m,q[0]+12*m,q[1]);c.closePath();c.fill();c.stroke();
        const t=[q[0],q[1]-11*m];c.fillStyle="#b8bf7a";c.beginPath();c.ellipse(t[0],t[1],4.6*m,4.6*m*TILT,0,0,7);c.fill();c.stroke();prism(c,t[0],t[1],6*m,6*m,10*m,a,WL(E.sal.wall||"wooddark"));hipRoof(c,Pf(t[0],t[1],a),6*m,6*m,10*m,5*m,RFt);flag(c,t[0],t[1]-17*m,5*m,ban)});hallp(u+16,w+4,16,7,4,1.5708,{wall:E.sal.wall,roof:rfK,R:6});return}
    if(tipo==="palafita"){// casa grande sobre estacas, com passarela ate o portao e pocas de agua no patio
      SC.cx(u,w,24,11,17,()=>{const q=S(u,w);KR.drawBuilding(c,q[0],q[1],{form:"stilt",L:24*m,D:11*m,H:6*m,R:7*m,ang:a,roof:rfK,wall:"wood",door:2,win:1})});
      SC.chao(()=>{for(const [uu,ww,r] of[[-13,8,4],[12,10,3.4],[14,-8,3]]){const q=S(uu,ww);c.fillStyle="#6f8f86";c.strokeStyle="rgba(40,60,50,.5)";c.lineWidth=.5;c.beginPath();c.ellipse(q[0],q[1],r*m,r*m*TILT,0,0,7);c.fill();c.stroke()}
        const P2=(uu,ww)=>S(uu,ww,.4);c.fillStyle="#9a7a50";for(let k=0;k<9;k++){const w0=w+6+k*1.6;poly(c,[P2(-1.6,w0),P2(1.6,w0),P2(1.6,w0+1.2),P2(-1.6,w0+1.2)],"#9a7a50","rgba(60,40,20,.5)")}});
      for(const sd of[-1,1])SC.rd(u+sd*15,w+6,4.6,9,()=>{const q=S(u+sd*15,w+6);KR.drawBuilding(c,q[0],q[1],{form:"stilt",L:8*m,D:6*m,H:4*m,R:4*m,ang:a+1.5708,roof:rfK,wall:"wood",door:1,win:1})});return}
    if(tipo==="iurta"){SC.cx(u,w,17,15,20,()=>{const q=S(u,w);prism(c,q[0],q[1],17*m,15*m,1.6*m,a,["#8a6a44","#5a4028"],"#a8875e");KR.drawRound(c,q[0],q[1]-1.6*m,10*m,7*m,6*m,{wall:"felt",roof:"felt",yurt:1});c.fillStyle="#c9a24a";c.beginPath();c.arc(q[0],q[1]-14.8*m,1.2*m,0,7);c.fill()});return}
    if(tipo==="toca"){SC.rd(u,w,15,18,()=>{const q=S(u,w);KR.drawMound(c,q[0],q[1],{L:34*m,D:24*m,H:17*m,door:2,chim:1})});return}
    if(tipo==="donjon")torreQd(u,w,13,hM*2.6,E.cebola?"cebola":"ameia",{bart:!E.cebola,flag:1,RF:race==="anao"?RF(cold?"snow":"slate"):null});
    else if(tipo==="redonda")torreR(u,w,6.5,hM*2.9,E.cupula?"cupula":E.tR.includes("agulha")?"agulha":"ameia",{flag:1});
    else if(tipo==="salao"){hallp(u,w,24,11,hM+3,0,Object.assign({R:6},E.sal));torreQd(u-13,w-2,7,hM*2,topQ==="ameia"?"ameia":"piramide",{flag:1})}
    else{hallp(u,w,26,11,hM+4,0,Object.assign({R:6},E.sal));for(const sd of[-1,1])torre(u+sd*14.5,w+1,6,hM*2.1,{flag:sd>0});
      if(E.cupula)SC.rd(u,w,4,hM+12,()=>{const q=S(u,w,hM+4);cyl(c,q[0],q[1],3.6*m,2*m,W);c.save();dome(c,q[0],q[1]-2*m,3.8*m,RFt);c.restore()});
      else if(E.cebola)SC.rd(u,w,3,hM+16,()=>{const q=S(u,w,hM+9);cyl(c,q[0],q[1],2.2*m,3*m,W);K.onion(c,q[0],q[1]-3*m,2.6*m,ROOF.gold)})}};
  const hallp=(u,w,L,D,H,ao,o)=>{o=o||{};const R=o.R||Math.max(4,D*.5);SC.cx(u,w,L,D,H+R,()=>hall(c,...S(u,w),L*m,D*m,H*m,s,Object.assign({ang:a+(ao||0),exact:1,roof:rfK,R:R*m},o,{R:R*m})),{r:ao||0})};
  const capela=(u,w,ao)=>{hallp(u,w,11,6,6,ao,Object.assign({R:4},E.sal));const ca=Math.cos(ao||0),sa=Math.sin(ao||0),tu=u-ca*7.5,tw=w-sa*7.5;
    if(E.cebola)SC.rd(tu,tw,2,16,()=>{const q=S(tu,tw);prism(c,q[0],q[1],3*m,3*m,9*m,a+(ao||0),W);K.onion(c,q[0],q[1]-9*m,2*m,ROOF.gold)});
    else if(E.cupula)SC.rd(u,w,3.4,13,()=>{const q=S(u,w,7);c.save();dome(c,q[0],q[1],3.4*m,RFt);c.restore()});
    else SC.cx(tu,tw,3,3,15,()=>{const q=S(tu,tw);prism(c,q[0],q[1],3*m,3*m,9*m,a+(ao||0),W);hipRoof(c,(uu,ww,zz)=>Pf(q[0],q[1],a+(ao||0))(uu,ww,zz),3*m,3*m,9*m,6*m,RFt)},{r:ao||0})};
  const adereco=(id,u,w,ao,esc)=>{const sz=(SIZE[id]||[6,6]),k=(esc||1);SC.rd(u,w,sz[0]*.45*k,sz[1]*.6*k,()=>{const q=S(u,w);c.save();c.translate(q[0],q[1]);c.scale(m*k,m*k);draw(c,0,0,id,race,.4,a+(ao||0));c.restore()})};
  const arvore=(u,w,tipo)=>SC.rd(u,w,2.2,9,()=>{const q=S(u,w);if(tipo==="cipreste"){c.fillStyle="#3f5a2a";c.strokeStyle=INK;c.lineWidth=.5;c.beginPath();c.ellipse(q[0],q[1]-4.6*m,1.3*m,4.4*m,0,0,7);c.fill();c.stroke();return}
    line(c,q,[q[0],q[1]-3*m],.9*m,"#5a4028");c.fillStyle="#5f7e35";c.strokeStyle="rgba(30,45,15,.9)";c.lineWidth=.6;for(const [dx,dy,r] of[[0,-6,2.8],[-1.6,-4.6,2],[1.7,-4.8,2.1]]){c.beginPath();c.arc(q[0]+dx*m,q[1]+dy*m,r*m,0,7);c.fill();c.stroke()}});
  const chao=(pts,col,o)=>SC.chao(()=>{o=o||{};const L=pts.map(p=>S(p[0],p[1],0));poly(c,L,col,o.borda===false?null:"rgba(60,48,28,.45)");
    if(o.pedras){c.fillStyle="rgba(90,75,50,.18)";for(let i=0;i<o.pedras;i++){const p=[(hh(40+i)-.5)*o.lu,(hh(90+i)-.5)*o.lw];const q=S(p[0]+(o.cu||0),p[1]+(o.cw||0));c.fillRect(q[0],q[1],1.1*m,.6*m)}}});
  const caminho=(u0,w0,u1,w1,lw,col)=>{const L=Math.hypot(u1-u0,w1-w0)||1,nu=-(w1-w0)/L*lw/2,nw=(u1-u0)/L*lw/2;chao([[u0+nu,w0+nw],[u1+nu,w1+nw],[u1-nu,w1-nw],[u0-nu,w0-nw]],col||"#d6cbab",{borda:false})};
  // anel de torres + muralha numa planta poligonal (pontos em volta, no sentido do relogio); o portao fica no lado da frente
  const cerca=(V_,hm,tsz,o)=>{o=o||{};const n=V_.length,rT=(tor==="R"?tsz*.5:tsz*.55)*G,temT=i=>!o.semTorre&&(!o.cada||i%o.cada===0);for(let i=0;i<n;i++){const A_=V_[i],B_=V_[(i+1)%n],L=Math.hypot(B_[0]-A_[0],B_[1]-A_[1]),ux=(B_[0]-A_[0])/L,uy=(B_[1]-A_[1])/L,ta=rT*.75,tA=temT(i)?ta:0,tB=temT((i+1)%n)?ta:0;
      const g=o.portao&&o.portao.i===i?o.portao:null;if(g){const gu=A_[0]+ux*L*g.t,gw=A_[1]+uy*L*g.t,hw=(4.5+2.2+2.6)*G;muro(A_[0]+ux*tA,A_[1]+uy*tA,gu-ux*hw,gw-uy*hw,hm,o);muro(gu+ux*hw,gw+uy*hw,B_[0]-ux*tB,B_[1]-uy*tB,hm,o);portaria(gu,gw,Math.atan2(uy,ux),o.gtipo)}
      else muro(A_[0]+ux*tA,A_[1]+uy*tA,B_[0]-ux*tB,B_[1]-uy*tB,hm,o);
      if(o.meio&&L>30&&!g){const mu=(A_[0]+B_[0])/2,mw=(A_[1]+B_[1])/2;torre(mu,mw,tsz*.85,hm+4,{})}}
    for(let i=0;i<n;i++){if(!temT(i))continue;const p=V_[i],var_=E.variado?(.8+hh(200+i)*.6):1;torre(p[0],p[1],tsz,(hm+6)*var_,{flag:hh(300+i)>.72})}};
  shadow(c,x,y,34*m,13*m);
  // ---------- plantas ----------
  const pav=E.jardim?"#b8c48a":"#cfc4a4";
  if(plano==="concentrico"){const Uo=27,Wo=20,Ui=15,Wi0=-14,Wi1=6;
    chao([[-Uo,-Wo],[Uo,-Wo],[Uo,Wo],[-Uo,Wo]],"#a9b26e",{pedras:0});chao([[-Ui,Wi0],[Ui,Wi0],[Ui,Wi1],[-Ui,Wi1]],pav,{pedras:40,lu:30,lw:20,cw:-4});caminho(0,Wi1,0,Wo+3,4.5);
    cerca([[-Uo,-Wo],[Uo,-Wo],[Uo,Wo],[-Uo,Wo]],hM-2,5,{portao:{i:2,t:.5},gtipo:"simples",T:T*.8});
    cerca([[-Ui,Wi0],[Ui,Wi0],[Ui,Wi1],[-Ui,Wi1]],hM+2,7,{portao:{i:2,t:.5}});
    menagem(0,-6,keepT==="palacio"?"donjon":keepT);hallp(-21,4,12,6,5,1.5708,Object.assign({R:4},E.sal));adereco(hh(7)<.5?"haystack":"woodpile",20,10);adereco("cart",-12,14,.4);if(hh(8)<.6)arvore(19,-14,E.cipreste?"cipreste":0);if(hh(9)<.5)arvore(-20,-14,E.cipreste?"cipreste":0)}
  else if(plano==="poligono"){const n=hh(10)<.5?6:7,V_=[];for(let i=0;i<n;i++){const t=Math.PI/2+(i/n)*6.2832+(n===6?Math.PI/6:Math.PI/7),jr=.86+hh(20+i)*.2;V_.push([Math.cos(t)*25*jr,Math.sin(t)*19*jr])}
    // lado da frente: o que cruza o eixo da frente (w>0, u perto de 0)
    let gi=0,best=-1e9;for(let i=0;i<n;i++){const A_=V_[i],B_=V_[(i+1)%n],mw=(A_[1]+B_[1])/2-Math.abs((A_[0]+B_[0])/2)*.6;if(mw>best){best=mw;gi=i}}
    chao(V_.map(p=>[p[0]*1.12,p[1]*1.12]),"#a9b26e");chao(V_,pav,{pedras:50,lu:44,lw:34});const G_=V_[gi],H_=V_[(gi+1)%n],gm=[(G_[0]+H_[0])/2,(G_[1]+H_[1])/2];caminho(gm[0],gm[1],gm[0]*1.25,gm[1]*1.3,4.5);caminho(gm[0],gm[1],0,-4,3.6,"#c9bd9c");
    cerca(V_,hM,6,{portao:{i:gi,t:.5},cada:E.asia?2:0});
    // a torre de menagem fica no fundo, encostada no vertice mais de tras
    let bk=0;for(let i=1;i<n;i++)if(V_[i][1]<V_[bk][1])bk=i;const kp=[V_[bk][0]*.45,V_[bk][1]*.5];menagem(kp[0],kp[1],keepT==="palacio"&&hh(11)<.5?"redonda":keepT);
    const sd=kp[0]>0?-1:1;hallp(sd*12,3,13,7,6,1.5708*sd,Object.assign({R:4},E.sal));capela(-sd*12,6,0);adereco("well",3,7);if(E.canhao){adereco("cannon",-6,10,0,1.2);adereco("cannon",8,10,3.1,1.2)}}
  else if(plano==="anel"||plano==="acampamento"||plano==="colina"){const n=plano==="colina"?10:9,V_=[];for(let i=0;i<n;i++){const t=Math.PI/2+(i/n)*6.2832+Math.PI/n,jr=.9+hh(30+i)*.14;V_.push([Math.cos(t)*25*jr,Math.sin(t)*19*jr])}
    chao(V_.map(p=>[p[0]*1.1,p[1]*1.1]),plano==="colina"?"#9fb262":"#a9a26a");chao(V_,plano==="colina"?"#b5c47a":E.palafita?"#8a9a6a":"#b8a978",{pedras:30,lu:40,lw:30});caminho(0,19,0,24,4,"#c9bd9c");
    if(plano!=="acampamento")cerca(V_,hM,5,{portao:{i:n-1,t:.5},gtipo:"simples",cada:3,semTorre:plano==="colina"});
    if(plano==="acampamento"){menagem(0,-4,"iurta");for(let i=0;i<9;i++){const t=i/9*6.2832+.4,uu=Math.cos(t)*21,ww=Math.sin(t)*15;if(ww>10&&Math.abs(uu)<6)continue;SC.rd(uu,ww,3.8,6,()=>{const q=S(uu,ww);KR.drawRound(c,q[0],q[1],3.6*m,2.6*m,2.4*m,{wall:"felt",roof:"felt",yurt:1})})}
      for(const sd of[-1,1])SC.rd(sd*6,11,.6,18,()=>{const q=S(sd*6,11);line(c,q,[q[0],q[1]-18*m],.8*m,"#5a4028");c.strokeStyle="#2b2418";c.lineWidth=.5;c.beginPath();for(let k=0;k<9;k++){c.moveTo(q[0],q[1]-17*m);c.lineTo(q[0]+(k-4)*.5*m,q[1]-13*m)}c.stroke()});adereco("fire",8,4);adereco("horse",14,8);adereco("horse",16,9.5)}
    else if(plano==="colina"){menagem(0,-6,"toca");for(const [uu,ww,L] of[[-15,6,14],[15,5,12]])SC.rd(uu,ww,L*.4,8,()=>{const q=S(uu,ww);KR.drawMound(c,q[0],q[1],{L:L*m,D:L*.72*m,H:7*m,door:1,chim:hh(uu)>.5})});for(const [uu,ww] of[[-8,12],[8,12],[0,15]])arvore(uu,ww)}
    else{const kt=keepT;menagem(0,-5,kt);const sd=hh(25)<.5?-1:1;if(kt!=="motte")SC.rd(sd*14,7,5.5,11,()=>{const q=S(sd*14,7);KR.drawRound(c,q[0],q[1],5.2*m,3.6*m,6*m,{wall:E.sal.wall||"mud",roof:E.sal.roof||"thatch",spike:!!E.espinhos})});
      adereco("fire",-sd*6,9);if(E.totem)SC.rd(sd*-12,10,1.2,10,()=>KR.drawTotem(c,...S(sd*-12,10)));if(E.runas)for(const k of[0,1])SC.rd(-sd*(10+k*3),12+k,1.4,7,()=>{const q=S(-sd*(10+k*3),12+k);poly(c,[[q[0]-1.3*m,q[1]],[q[0]+1.3*m,q[1]],[q[0]+.9*m,q[1]-5.6*m],[q[0],q[1]-6.4*m],[q[0]-.9*m,q[1]-5.6*m]],"#9a958a",INK)});
      if(E.espinhos)adereco("dummy",sd*8,-12);else adereco("woodpile",sd*9,-12)}}
  else if(plano==="palacio"){const U=25,W0=-18,W1=18;chao([[-U-2,W0-2],[U+2,W0-2],[U+2,W1+2],[-U-2,W1+2]],"#a9b26e");chao([[-U,W0],[U,W0],[U,W1],[-U,W1]],E.jardim?"#9fb262":pav);
    // jardim da frente com canteiros, fonte e caminho
    SC.chao(()=>{for(const [u0,u1] of[[-15,-3],[3,15]])for(const [w0,w1] of[[4,9.5],[11.5,16]])poly(c,[[u0,w0],[u1,w0],[u1,w1],[u0,w1]].map(p=>S(p[0],p[1])),"#6f9a46","rgba(40,60,20,.5)");poly(c,[[-2,2],[2,2],[2,W1],[-2,W1]].map(p=>S(p[0],p[1])),"#e6dcc0",null);poly(c,[[-16,9.5],[16,9.5],[16,11.5],[-16,11.5]].map(p=>S(p[0],p[1])),"#e6dcc0",null)});
    caminho(0,W1,0,W1+4,4,"#e6dcc0");adereco("fountain",0,10.5,0,.9);
    cerca([[-U,W0],[U,W0],[U,W1],[-U,W1]],hM-2,4.6,{portao:{i:2,t:.5},gtipo:"simples",T:T*.7});
    const ph=hM+5;if(keepT!=="palacio"&&keepT!=="redonda"){menagem(0,-8,keepT);for(const sd of[-1,1])hallp(sd*17,-2,10,6,ph-4,1.5708,Object.assign({R:4},E.sal))}
    else{hallp(0,-8,30,11,ph,0,Object.assign({R:7},E.sal));for(const sd of[-1,1]){hallp(sd*15,-1,12,7,ph-3,1.5708,Object.assign({R:4},E.sal))}
    torre(0,-15,7,ph*2.2,{flag:1});for(const sd of[-1,1])torre(sd*16,-12,5,ph*1.7,{flag:sd>0})}
    for(const [u,w] of[[-19,5],[19,5],[-19,14],[19,14]])arvore(u,w,E.cipreste?"cipreste":0)}
  else{// quadra: patio retangular, torres nos cantos (e no meio dos lados compridos), portaria na frente
    const U=21+hh(12)*4,Wd=15+hh(13)*3;chao([[-U-3,-Wd-3],[U+3,-Wd-3],[U+3,Wd+3],[-U-3,Wd+3]],"#a9b26e");chao([[-U,-Wd],[U,-Wd],[U,Wd],[-U,Wd]],pav,{pedras:50,lu:U*2,lw:Wd*2});caminho(0,Wd,0,Wd+5,4.5);caminho(0,Wd,0,-2,3.4,"#c9bd9c");
    cerca([[-U,-Wd],[U,-Wd],[U,Wd],[-U,Wd]],hM,6,{portao:{i:2,t:.5},meio:U>23&&!E.asia,cada:E.asia?2:0});
    const kt=keepT;if(kt==="palacio"||kt==="salao")menagem(0,-Wd+7,kt);else{const ku=(hh(14)<.5?-1:1)*(U*.45);menagem(ku,-Wd*.45,kt);hallp(-ku*.9,-Wd+5.5,16,7,hM-1,0,Object.assign({R:4.5},E.sal))}
    if(E.asia){// jardim com lanternas no lugar dos saloes: menos telhados juntos
      chao([[-U+2,0],[-U+13,0],[-U+13,Wd-3],[-U+2,Wd-3]],"#8fae5a",{borda:false});for(const [uu,ww] of[[-U+5,4],[-U+10,9]])SC.rd(uu,ww,.8,3,()=>{const q=S(uu,ww);prism(c,q[0],q[1],1.2*m,1.2*m,2.2*m,a,["#a8a294","#8f897a"]);prism(c,q[0],q[1]-2.2*m,2*m,2*m,.6*m,a,["#8f897a","#6e6a5e"])});arvore(-U+7,Wd-6);hallp(U-6,5,11,6,hM-3,1.5708,Object.assign({R:3.6},E.sal))}
    else{hallp(U-5.5,4,13,7,hM-2,1.5708,Object.assign({R:4},E.sal));if(hh(15)<.65)capela(-U+7,6,1.5708);else hallp(-U+5.5,5,11,6,hM-3,1.5708,{wall:"wood",R:4})}
    adereco("well",-5,6);adereco(hh(16)<.5?"crates":"cart",6,9,.3);if(E.obelisco)for(const sd of[-1,1])SC.rd(sd*6,Wd+7,1,15,()=>{const q=S(sd*6,Wd+7);poly(c,[[q[0]-1*m,q[1]],[q[0]+1*m,q[1]],[q[0]+.6*m,q[1]-13*m],[q[0],q[1]-14.6*m],[q[0]-.6*m,q[1]-13*m]],"#e6c892",INK)});
    if(E.palmeira)for(const [uu,ww] of[[-U+4,Wd-4],[U-4,-Wd+4]])SC.rd(uu,ww,2,11,()=>{const q=S(uu,ww);line(c,q,[q[0]+.8*m,q[1]-9*m],.9*m,"#7a5a38");c.strokeStyle="#4f7a32";c.lineWidth=.9*m;for(let k=0;k<6;k++){const t=k/6*6.2832;c.beginPath();c.moveTo(q[0]+.8*m,q[1]-9*m);c.quadraticCurveTo(q[0]+.8*m+Math.cos(t)*2*m,q[1]-10.5*m,q[0]+.8*m+Math.cos(t)*4*m,q[1]-8*m+Math.sin(t)*1.2*m);c.stroke()}});
    if(E.estela)for(const sd of[-1,1])SC.rd(sd*7,Wd+6,1.6,7,()=>{const q=S(sd*7,Wd+6);prism(c,q[0],q[1],3*m,1.2*m,7*m,a,["#b9b09a","#8a816c"])});if(E.canhao)for(const sd of[-1,1])adereco("cannon",sd*(U-2),-Wd+2,sd>0?.8:2.3,1.1)}
  SC.fim();ESP_=e0;return true}
// </castelos2>
// ---------- construcoes ----------
// ---------- templos por cultura, em pecas (giram com a cidade; frente = +v) ----------
// devolve false quando a cultura usa a igreja comum
function templo(c,x,y,a,m,rc,v,sw,big,tv){const TV2=(tv||0)>=2;if(TV2&&["halfling","orc","tribal","indiano"].includes(rc))m*=.72;if(["vapor","elfo","anao","eslavo","gnomo","norte"].includes(rc))m*=1.25;const mu=(v||0)<.5?-1:1,P0=Pf(x,y,a),P=(u,w,h)=>P0(u*mu*m,w*m,(h||0)*m),S=cena(P,c);ANG_=a-.34;const TA=ANG_+.7854,fs=lado(P,null);
  const Hh=(u,w,L,D,H,R,roof,wall,o)=>S.cx(u,w,L,D,H+R,()=>KR.drawHouseA(c,...P(u,w),Object.assign({L:L*m,D:D*m,H:H*m,R:R*m,ang:a,roof,wall,win:1,door:2},o||{}))),
    Tt=(u,w,ww,h,rh,roof,wall,cren,ex)=>S.rd(u,w,ww*.62,h+rh,()=>{const q=P(u,w);torreQ(c,q[0],q[1]+.43*ww*m,ww*m,h*m,rh*m,roof,wall,!!cren,TA);if(ex)ex(q)}),
    Ff=(u,w,L,D,H,wall,o)=>S.cx(u,w,L,D,H,()=>KR.drawFlat(c,...P(u,w),Object.assign({L:L*m,D:D*m,H:H*m,ang:a,wall,win:1},o||{}))),
    piram=(w,n,topo)=>S.cx(0,0,w*1.41,w*1.41,n*4.6/m+7,()=>{const h=4.6;for(let i=0;i<n;i++){const sz=w*(1-i/(n+1))*1.41*m;prism(c,x,y-i*h,sz,sz,h,a,["#c9bb98","#a2957a"],"#ddd2b2")}
        const l0=w*1.41/2,l1=w*(1-(n-1)/(n+1))*1.41/2,st=w*.16;c.lineWidth=.6;poly(c,[P(-st*.5,fs*l0,0),P(st*.5,fs*l0,0),P(st*.3,fs*l1,n*h/m),P(-st*.3,fs*l1,n*h/m)],"#b9ab88",INK);c.strokeStyle="rgba(60,50,35,.6)";c.lineWidth=.5;c.beginPath();for(let k=1;k<n*2;k++){const t=k/(n*2),ww=lerp(st*.5,st*.3,t),p1=P(-ww,fs*lerp(l0,l1,t),n*h/m*t),p2=P(ww,fs*lerp(l0,l1,t),n*h/m*t);c.moveTo(p1[0],p1[1]);c.lineTo(p2[0],p2[1])}c.stroke();topo(y-n*h)});
  if(rc==="vapor"){for(const [u,h] of[[-7,30],[-2,25]])S.rd(u,-9,1.8,h+8,()=>{const q=P(u,-9);cyl(c,q[0],q[1],1.8*m,h*m,["#9b5a3e","#5f3424"],.85);c.fillStyle="#2a2420";c.beginPath();c.ellipse(q[0],q[1]-h*m,1.5*m,1.5*m*TILT,0,0,7);c.fill();if(!SEMFX&&!REC)for(let i=0;i<3;i++){c.fillStyle=i%2?"#8f8a86":"#b3aea8";c.strokeStyle="#4a3d3f";c.lineWidth=.5;c.beginPath();c.arc(q[0]+i*2*m,q[1]-h*m-3*m-i*3*m,(1.4+i*.8)*m,0,7);c.fill();c.stroke()}});
    Hh(0,0,22,11,8,6,sw||"rust","soot").em(()=>{const g=P(-2,0,15.5),R0=4.2*m;c.fillStyle="#c9a24a";c.strokeStyle=INK;c.lineWidth=.7;c.beginPath();for(let k=0;k<20;k++){const an=k*3.1416/10,rr=k%2?R0:R0+1.2*m;c.lineTo(g[0]+Math.cos(an)*rr,g[1]+Math.sin(an)*rr)}c.closePath();c.fill();c.stroke();c.fillStyle="#7a4a24";c.beginPath();c.arc(g[0],g[1],1.4*m,0,7);c.fill()});
    Tt(13,-9,3.4,26,9,ROOF.copper,WALL.soot,false,q=>{const cy=q[1]-17*m;c.fillStyle="#efe6cb";c.strokeStyle=INK;c.lineWidth=.7;c.beginPath();c.arc(q[0],cy,2.2*m,0,7);c.fill();c.stroke();c.strokeStyle="#3a2c1b";c.lineWidth=.6;c.beginPath();c.moveTo(q[0],cy);c.lineTo(q[0],cy-1.6*m);c.moveTo(q[0],cy);c.lineTo(q[0]+1.2*m,cy+.6*m);c.stroke()})}
  else if(rc==="deserto"){Ff(0,0,18,12,7,"white",{dome:1,domeCol:["#6f9ec8","#3d6890"]});Tt(13,-6,2.6,22,4,ROOF.gold,WALL.white)}
  else if(rc==="elfo"){Hh(0,0,15,8,7,9,"teal","white");Tt(11,-9,3,24,14,ROOF.teal,WALL.white)}
  else if(rc==="anao"){Hh(0,0,22,11,6,5,sw||"slate","darkstone");Tt(-12,-11,4.6,12,0,ROOF.slate,WALL.darkstone,true);Tt(14,-11,4.6,12,0,ROOF.slate,WALL.darkstone,true)}
  else if(rc==="norte"){Hh(4,-4,24,9,5,11,sw||"shingle","wooddark",{win:0});Tt(-10,-5,3,9,8,ROOF[sw||"shingle"],WALL.wooddark)}
  else if(TV2&&rc==="halfling"){// 0.65: toca grande no jardim, toca menor, sineira redonda e caminho de pedras
    S.chao(()=>{dc(P,"ch",0,2,19);const o=P(0,2);c.fillStyle="#9fb262";c.strokeStyle="rgba(60,70,30,.5)";c.lineWidth=.6;c.beginPath();c.ellipse(o[0],o[1],19*m,19*m*TILT,0,0,7);c.fill();c.stroke();
      c.fillStyle="#d8ccaa";c.strokeStyle="rgba(80,70,50,.5)";for(let k=0;k<5;k++){const q=P(1-k*.4,fs*(9+k*2.2));c.beginPath();c.ellipse(q[0],q[1],1.3*m,.75*m,0,0,7);c.fill();c.stroke()}});
    S.rd(0,-3,11,12,()=>{const q=P(0,-3);KR.drawMound(c,q[0],q[1],{L:22*m,D:17*m,H:12*m,door:2,chim:1})});
    S.rd(-13,5,6,7,()=>{const q=P(-13,5);KR.drawMound(c,q[0],q[1],{L:11*m,D:9*m,H:7*m,door:1})});
    S.rd(12,-2,3.4,15,()=>{const q=P(12,-2);KR.drawRound(c,q[0],q[1],3.2*m,7*m,6*m,{wall:"daub",roof:"thatch"});const t=[q[0],q[1]-9.5*m];c.fillStyle="#c9a24a";c.strokeStyle=INK;c.lineWidth=.6;c.beginPath();c.arc(t[0],t[1],1.1*m,0,7);c.fill();c.stroke()});
    for(const [u,w,cr] of[[-7,12,"#d8b14a"],[8,11,"#c4473a"],[14,8,"#e8e0f0"]])S.rd(u,w,2.4,3,()=>{const q=P(u,w);c.fillStyle="#5f7e35";c.strokeStyle="rgba(40,55,20,.8)";c.lineWidth=.6;c.beginPath();c.ellipse(q[0],q[1]-1.2*m,2.4*m,1.7*m,0,0,7);c.fill();c.stroke();c.fillStyle=cr;for(let k=0;k<4;k++){c.beginPath();c.arc(q[0]+Math.cos(k*1.7)*1.3*m,q[1]-1.6*m+Math.sin(k*1.7)*.7*m,.45*m,0,7);c.fill()}})}
  else if(TV2&&rc==="orc"){// 0.65: cabana de couro com espinhos dentro de um anel de estacas, totens e mastro de caveira
    S.chao(()=>{dc(P,"ch",0,0,18);const o=P(0,0);c.fillStyle="#9a8a68";c.strokeStyle="rgba(60,48,28,.5)";c.lineWidth=.6;c.beginPath();c.ellipse(o[0],o[1],18*m,18*m*TILT,0,0,7);c.fill();c.stroke()});
    S.rd(0,-2,9,20,()=>{const q=P(0,-2);KR.drawRound(c,q[0],q[1],9*m,6*m,12*m,{wall:"wooddark",roof:"hide",spike:true})});
    for(let k=0;k<20;k++){const t=k/20*6.2832,u=Math.cos(t)*16,w=Math.sin(t)*16;if(w*fs>10&&Math.abs(u)<5)continue;S.rd(u,w,.9,6.5,()=>post(c,P,u,w,0,5.5+(k%3)*.5,1.1,"#5a4028"))}
    for(const u of[-5,5])S.rd(u,fs*14,1.2,10,()=>{const q=P(u,fs*14);KR.drawTotem(c,q[0],q[1])});
    S.rd(-9,fs*7,1,9,()=>{post(c,P,-9,fs*7,0,8,.8,"#3a2c1b");const t=P(-9,fs*7,8.6);c.fillStyle="#e8e0cc";c.strokeStyle=INK;c.lineWidth=.6;c.beginPath();c.arc(t[0],t[1],1.2*m,0,7);c.fill();c.stroke();c.fillStyle="#2a2018";c.fillRect(t[0]-.6*m,t[1]-.3*m,.4*m,.4*m);c.fillRect(t[0]+.2*m,t[1]-.3*m,.4*m,.4*m)})}
  else if(TV2&&rc==="tribal"){// 0.65: cabana grande, duas menores, fogueira no meio do terreiro e totem
    S.chao(()=>{dc(P,"ch",0,2,19);const o=P(0,2);c.fillStyle="#b59a6a";c.strokeStyle="rgba(80,60,30,.45)";c.lineWidth=.6;c.beginPath();c.ellipse(o[0],o[1],19*m,19*m*TILT,0,0,7);c.fill();c.stroke();
      const f=P(0,fs*8);c.fillStyle="#7d7466";for(let k=0;k<8;k++){c.beginPath();c.arc(f[0]+Math.cos(k*.785)*2.2*m,f[1]+Math.sin(k*.785)*2.2*m*TILT,.6*m,0,7);c.fill()}c.fillStyle="#e07a2a";c.beginPath();c.moveTo(f[0]-1.2*m,f[1]);c.quadraticCurveTo(f[0],f[1]-4*m,f[0]+1.2*m,f[1]);c.closePath();c.fill();c.fillStyle="#f3c04a";c.beginPath();c.moveTo(f[0]-.6*m,f[1]);c.quadraticCurveTo(f[0],f[1]-2.4*m,f[0]+.6*m,f[1]);c.closePath();c.fill()});
    S.rd(0,-5,8,17,()=>{const q=P(0,-5);KR.drawRound(c,q[0],q[1],8*m,5*m,11*m,{wall:"mud",roof:"thatch"})});
    for(const u of[-13,13])S.rd(u,3,4.6,10,()=>{const q=P(u,3);KR.drawRound(c,q[0],q[1],4.4*m,3.4*m,6*m,{wall:"mud",roof:"thatch"})});
    S.rd(7,fs*12,1.2,10,()=>{const q=P(7,fs*12);KR.drawTotem(c,q[0],q[1])})}
  else if(TV2&&rc==="indiano"){// 0.65: plataforma, shikhara principal, salao de pilares na frente e dois santuarios menores
    S.chao(()=>{dc(P,"cx",0,0,26,22,0,1.6);const q=P(0,0);prism(c,q[0],q[1],26*m,22*m,1.6*m,a,["#d9b77a","#b8955c"],"#e8d3a0")});
    S.rd(0,-4,8,30,()=>{const q=P(0,-4,1.6);KR.drawShikhara(c,q[0],q[1],8*m)});
    Ff(0,fs*6,12,7,5,"sand",{win:0});
    for(const u of[-10,10])S.rd(u,-7,3.6,14,()=>{const q=P(u,-7,1.6);KR.drawShikhara(c,q[0],q[1],3.6*m)})}
  else if(rc==="halfling")S.rd(0,0,9,11,()=>KR.drawMound(c,x,y-3,{L:20*m,D:16*m,H:11*m,door:2,chim:1}));
  else if(rc==="orc"||rc==="tribal")S.rd(0,0,9,18,()=>KR.drawRound(c,x,y-3,9*m,6*m,12*m,{wall:rc==="orc"?"wooddark":"mud",roof:rc==="orc"?"hide":"thatch",spike:rc==="orc"}));
  else if(rc==="pantano")S.cx(0,0,20,10,12,()=>KR.drawBuilding(c,x,y-3,{form:"stilt",L:20*m,D:10*m,H:5.5*m,R:6*m,ang:a,roof:"thatch",wall:"wood",door:2,win:1}));
  else if(rc==="japones"||rc==="chines"){const jp=rc==="japones";
    if(jp){S.chao(()=>{dc(P,"ch",0,4,21);const o=P(0,4);c.fillStyle="#e3dcc6";c.strokeStyle="rgba(60,50,35,.45)";c.lineWidth=.6;c.beginPath();c.ellipse(o[0],o[1],21*m,21*m*TILT,0,0,7);c.fill();c.stroke();poly(c,[P(-4,3),P(0,3),P(0,22),P(-4,22)],"#cfc5a8",null)});
      for(const u of[-9,5])S.rd(u,13,1.2,5,()=>{const l=P(u,13);c.fillStyle="#a8a294";c.strokeStyle=INK;c.lineWidth=.6;c.fillRect(l[0]-.8*m,l[1]-3.2*m,1.6*m,3.2*m);c.strokeRect(l[0]-.8*m,l[1]-3.2*m,1.6*m,3.2*m);c.fillStyle="#8f897a";c.beginPath();c.moveTo(l[0]-2*m,l[1]-3.2*m);c.lineTo(l[0],l[1]-4.6*m);c.lineTo(l[0]+2*m,l[1]-3.2*m);c.closePath();c.fill();c.stroke()});
      S.cx(-2,23,17,1.6,13,()=>{const r=["#d0412f","#8f2a1e"];for(const [u] of porFundo(P,[[-7,23],[3,23]])){const b=P(u,23);cyl(c,b[0],b[1],.75*m,11*m,r,1)}const t1=P(-2,23,8);prism(c,t1[0],t1[1],15*m,1*m,1*m,a,r);const t2=P(-2,23,10.6);prism(c,t2[0],t2[1],16.4*m,1.2*m,.8*m,a,r);const t3=P(-2,23,11.4);prism(c,t3[0],t3[1],17.6*m,1.5*m,.7*m,a,["#3a2c1b","#2b2114"])})}
    const np=jp?(big?5:3):(big?7:5),pu=13,pv=jp?-11:-9;S.rd(pu,pv,4.2,np*6.2+10,()=>pagode(c,...P(pu,pv),np,8*m,jp?"jp":"cn","red",TA));
    if(jp)S.cx(-5,-6,17,9,12,()=>KR.drawAsian(c,...P(-5,-6),{L:17*m,D:9*m,H:5*m,R:6*m,ang:a,roof:"jp",wall:"jpw",base:1.5}));
    else S.cx(-3,-3,18,10,13,()=>KR.drawAsian(c,...P(-3,-3),{L:18*m,D:10*m,H:5.5*m,R:6*m,ang:a,roof:"cny",wall:"red",base:2}))}
  else if(rc==="indiano")S.rd(4,-3,8,30,()=>{const q=P(4,-3);KR.drawShikhara(c,q[0],q[1],8*m)});
  else if(rc==="meso")piram(15,big?6:4,yt=>{KR.drawFlat(c,x,yt,{L:15*m*.48,D:15*m*.48,H:5,ang:a,wall:"lime"});c.fillStyle="#a8352a";c.fillRect(x-1.2,yt-6.4,2.4,1.4)});
  else if(rc==="eslavo"){Hh(0,0,15,9,7,5,sw||"leaf","white");for(const [u,w,ww,h,col] of[[-9,-10,2.4,10,["#6f9ec8","#3d6890"]],[9,-10,2.4,10,["#6f9ec8","#3d6890"]],[1,-13,3.2,15,["#e0b84e","#a8842c"]]])Tt(u,w,ww,h,0,ROOF.slate,WALL.white,false,q=>K.onion(c,q[0],q[1]-h*m,ww*m*.95,col))}
  else if(rc==="bizantino"){Ff(0,0,19,14,7,"brick",{dome:1,domeCol:["#5f9a86","#3d6b5b"]});for(const u of[-12,12])Tt(u,-6,2.2,13,0,ROOF.terra,WALL.ochre,true)}
  else if(rc==="egipcio"){Ff(3,-8.5,16,12,5,"sand",{win:0});for(const u of[-7,7])Ff(u,3,7,4.5,11,"sand2",{win:0});
    S.cx(0,3,2.8,4.5,4.4,()=>quad(c,P,[[-1.4,3+fs*2.2,0],[1.4,3+fs*2.2,0],[1.4,3+fs*2.2,4.4],[-1.4,3+fs*2.2,4.4]],"#3a2c1b"));
    for(const u of[-12,12])S.rd(u,8.5,1.1,14.6,()=>{const o=P(u,8.5),X=o[0],Y=o[1];poly(c,[[X-1.1*m,Y],[X+1.1*m,Y],[X+.6*m,Y-13*m],[X,Y-14.6*m],[X-.6*m,Y-13*m]],"#e6c892",INK);c.fillStyle="#b8955c";c.beginPath();c.moveTo(X+.1*m,Y);c.lineTo(X+1.1*m,Y);c.lineTo(X+.6*m,Y-13*m);c.lineTo(X,Y-14.6*m);c.closePath();c.fill()})}
  else if(rc==="celta"){S.chao(()=>{dc(P,"ch",0,0,18);c.fillStyle="#a7b36a";c.beginPath();c.ellipse(x,y,18*m,18*m*TILT,0,0,7);c.fill()});
    for(let k=0;k<12;k++){const t=k/12*6.2832,u=Math.cos(t)*15,w=Math.sin(t)*15;S.rd(u,w,1.4,6.5,()=>{const o=P(u,w),X=o[0],Y=o[1];poly(c,[[X-1.4*m,Y],[X+1.4*m,Y],[X+1.2*m,Y-6.5*m],[X-1.2*m,Y-6.5*m]],"#b4ada0",INK);c.fillStyle="#8a847a";c.fillRect(X+.2*m,Y-6.5*m,1*m,6.5*m)})}
    S.rd(0,0,6,10,()=>KR.drawRound(c,x,y-1,6*m,4*m,6*m,{wall:"daub",roof:"thatch"}))}
  else if(rc==="andino")piram(14,3,yt=>KR.drawHouseA(c,x,yt,{L:8*m,D:6*m,H:4*m,R:3*m,ang:a,roof:"thatch",wall:"darkstone",win:0,door:2}));
  else if(rc==="gnomo"){Hh(-3,0,14,9,6,7,"blue","pink");Tt(10,-9,3,24,11,ROOF.gold,WALL.white,false,q=>{c.fillStyle="#f6e7b0";c.strokeStyle=INK;c.lineWidth=.6;c.beginPath();c.arc(q[0],q[1]-18*m,1.5*m,0,7);c.fill();c.stroke()})}
  else if(rc==="mongol"){S.rd(0,0,9,8.2,()=>KR.drawRound(c,x,y-2,9*m,4.2*m,4*m,{wall:"felt",roof:"felt",yurt:1}));S.rd(11,2,1.2,10,()=>{const q=P(11,2);KR.drawTotem(c,q[0],q[1])})}
  else return false;
  S.fim();return true}

// ---------- ficha: contorno e altura exatos, gravados das mesmas pecas que desenham ----------
// Com REC ligado, cada peca solida (caixa, cilindro, casa, torre, poste, painel) anota seu contorno no chao e sua altura.
// Coordenadas da ficha: (dx,dy) no chao a partir do centro do asset, ja giradas; z = altura. Unidades do proprio asset.
let REC=null,SEMFX=false;
function regS(t,sx,sy,l,d,h,ang,z0){const R=REC,m=R.m,X=R.dx+sx*m,Y=R.dy+sy*m;let hz=0,hit=z0!=null;if(hit)hz=z0*m;
  if(!hit)for(let i=R.pp.length-1;i>=0&&i>R.pp.length-80;i--){const q=R.pp[i];if(Math.abs(q[0]-sx)<1e-6&&Math.abs(q[1]-sy)<1.7){hz=(q[2]-(sy-q[1]))*m;hit=true;break}}
  if(!hit){for(let i=R.S.length-1;i>=0;i--){const k=R.S[i];if(k.gxs==null)continue;const zc=k.gys-Y;if(Math.abs(k.gxs-X)<.02&&zc>.3&&zc<=k.z1+2.5){hz=zc;hit=true;break}}
    if(!hit&&Math.abs(X-R.ox)<.02&&Y<R.oy-.3)hz=R.oy-Y}
  const gx=X-R.ox,gy=(Y+hz-R.oy)/TILT,pts=[];if(t==="rd")for(let k=0;k<12;k++){const a=k*.5236;pts.push([gx+Math.cos(a)*l*m/2,gy+Math.sin(a)*l*m/2])}
  else{const ca=Math.cos(ang||0),sa=Math.sin(ang||0);for(const [a,b] of[[-1,-1],[1,-1],[1,1],[-1,1]])pts.push([gx+(ca*a*l-sa*b*d)*m/2,gy+(sa*a*l+ca*b*d)*m/2])}
  R.S.push({t,pts,z0:hz,z1:hz+h*m,gxs:X,gys:Y+hz,r:t==="rd"?l*m/2:0,c:[gx,gy]})}
// poligono dado por pontos de tela no chao (z0..z1 em unidades de tela)
function regP(scr,z0,z1,chao){const R=REC,pts=scr.map(q=>[R.dx+q[0]*R.m-R.ox,(R.dy+q[1]*R.m-R.oy)/TILT]);if(chao){R.G.push(pts);return}
  let ar=0;for(let i=0;i<pts.length;i++){const a=pts[i],b=pts[(i+1)%pts.length];ar+=a[0]*b[1]-b[0]*a[1]}
  if(Math.abs(ar)<1.2){let a=pts[0],b=pts[0],md=0;for(const p1 of pts)for(const p2 of pts){const dd=Math.hypot(p1[0]-p2[0],p1[1]-p2[1]);if(dd>md){md=dd;a=p1;b=p2}}if(md<.05)return;const nx=-(b[1]-a[1])/md*.25,ny=(b[0]-a[0])/md*.25;R.S.push({t:"pn",pts:[[a[0]-nx,a[1]-ny],[b[0]-nx,b[1]-ny],[b[0]+nx,b[1]+ny],[a[0]+nx,a[1]+ny]],z0:z0*R.m,z1:z1*R.m});return}
  R.S.push({t:"pl",pts,z0:z0*R.m,z1:z1*R.m})}
// declaracao manual (para o que e desenhado a mao livre): dc(P,"rd",u,v,r,z0,z1) ou dc(P,"cx",u,v,l,d,z0,z1,giro)
const dc=(P,t,u,v,a,b,c_,d_,e_)=>{if(!REC)return;if(t==="ch"){const o=P(u,v,0),pts=[];for(let k=0;k<16;k++){const q=P(u+Math.cos(k*.3927)*a,v+Math.sin(k*.3927)*a,0);pts.push([REC.dx+q[0]*REC.m-REC.ox,(REC.dy+q[1]*REC.m-REC.oy)/TILT])}REC.G.push(pts);return}const g=p=>[(REC.dx+p[0]*REC.m-REC.ox),(REC.dy+p[1]*REC.m-REC.oy)/TILT],zs=(P(u,v,0)[1]-P(u,v,1)[1])*REC.m,o=g(P(u,v,0));
  if(t==="rd"){const rr=Math.hypot(...[0,1].map(i=>g(P(u+a,v,0))[i]-o[i])),pts=[];for(let k=0;k<12;k++)pts.push([o[0]+Math.cos(k*.5236)*rr,o[1]+Math.sin(k*.5236)*rr]);REC.S.push({t:"rd",pts,z0:b*zs,z1:c_*zs,r:rr,c:o})}
  else{const r=e_||0,cr=Math.cos(r),sr=Math.sin(r),pts=[[-1,-1],[1,-1],[1,1],[-1,1]].map(([i,j])=>g(P(u+cr*i*a/2-sr*j*b/2,v+sr*i*a/2+cr*j*b/2,0)));REC.S.push({t:"cx",pts,z0:c_*zs,z1:d_*zs})}};
const NULO=new Proxy(function(){},{get:(t,k)=>k===Symbol.toPrimitive?()=>0:NULO,set:()=>true,apply:()=>NULO});
const FICHAS=new Map();
function fechoConvexo(P){const p=P.slice().sort((a,b)=>a[0]-b[0]||a[1]-b[1]),cr=(o,a,b)=>(a[0]-o[0])*(b[1]-o[1])-(a[1]-o[1])*(b[0]-o[0]),lo=[],up=[];for(const q of p){while(lo.length>1&&cr(lo[lo.length-2],lo[lo.length-1],q)<=0)lo.pop();lo.push(q)}for(let i=p.length-1;i>=0;i--){const q=p[i];while(up.length>1&&cr(up[up.length-2],up[up.length-1],q)<=0)up.pop();up.push(q)}lo.pop();up.pop();return lo.concat(up)}
// ficha(id,cultura,v,ang,ov): solidos [{t,pts,z0,z1}], pegada (os que tocam o chao), aereo (acima de 2), chao (desenho no chao), alt, raio, caixa, casco
function ficha(id,race,v,ang,ov){const key=id+"|"+(race||"humano")+"|"+Math.round((v==null?.5:v)*50)+"|"+Math.round((ang||0)*100)+"|"+(ov?JSON.stringify(ov):"");return fichaDe(key,c=>draw(c,0,0,id,race,v,ang,ov),id)}
// ficha de qualquer desenho feito na origem (templos e castelos do gerador, por exemplo)
function fichaDe(key,fn,id){let F=FICHAS.get(key);if(F)return F;
  const R0=REC,A0=ANG_;REC={ox:0,oy:0,dx:0,dy:0,m:1,pp:[],S:[],G:[]};try{fn(NULO)}catch(e){REC.err=e.message}const R=REC;REC=R0;ANG_=A0;
  let alt=0,raio=0,x0=1e9,y0=1e9,x1=-1e9,y1=-1e9;const peg=[],aer=[],todos=[];for(const s of R.S){s.z0=Math.max(0,s.z0);if(s.z1>alt)alt=s.z1;(s.z0<2?peg:aer).push(s);if(s.z0<2)for(const q of s.pts){todos.push(q);const d=Math.hypot(q[0],q[1]);if(d>raio)raio=d;if(q[0]<x0)x0=q[0];if(q[0]>x1)x1=q[0];if(q[1]<y0)y0=q[1];if(q[1]>y1)y1=q[1]}}
  F={id,solidos:R.S.map(s=>({t:s.t,pts:s.pts,z0:s.z0,z1:s.z1})),pegada:peg.map(s=>s.pts),aereo:aer.map(s=>({pts:s.pts,z0:s.z0})),chao:R.G,alt,raio,caixa:peg.length?[x0,y0,x1,y1]:[0,0,0,0],casco:todos.length>2?fechoConvexo(todos):[],erro:R.err||null};
  if(FICHAS.size>4000)FICHAS.clear();FICHAS.set(key,F);return F}

// ---------- cena de pecas ----------
// Cada peca tem contorno no chao (caixa girada ou circulo), base (z) e altura. A ordem de desenho sai dos contornos,
// em qualquer angulo: quem esta atras e desenhado antes. Detalhes de face so entram quando a face olha para quem ve.
// P = projecao do asset (u,v,h) -> tela. Coordenadas de vista: X = tela, Y = profundidade (maior = mais perto de quem olha).
const yEm=(fp,x)=>{let a=1e9,b=-1e9;for(let i=0;i<fp.length;i++){const p=fp[i],q=fp[(i+1)%fp.length];if((p[0]-x)*(q[0]-x)>0)continue;const dx=q[0]-p[0];if(Math.abs(dx)<1e-9){a=Math.min(a,p[1],q[1]);b=Math.max(b,p[1],q[1])}else{const y=p[1]+(q[1]-p[1])*(x-p[0])/dx;if(y<a)a=y;if(y>b)b=y}}return a>b?null:[a,b]};
// 1: A na frente de B; -1: A atras; 0: nao se cobrem na tela
function naFrente(A,B){const x0=Math.max(A.x0,B.x0),x1=Math.min(A.x1,B.x1);if(x1-x0<.12)return 0;let s=0,mix=0;
  for(const t of[.15,.5,.85]){const x=x0+(x1-x0)*t,ra=yEm(A.fp,x),rb=yEm(B.fp,x);if(!ra||!rb)continue;const ov=Math.min(ra[1],rb[1])-Math.max(ra[0],rb[0]);
    if(ov<=.06||ov<.45*Math.min(ra[1]-ra[0],rb[1]-rb[0]))s+=ra[0]+ra[1]>rb[0]+rb[1]?1:-1;else mix++}
  if(!s){if(A.brota!=null&&dentroFp(B.fp,A.cx,A.cyv))return -1;if(B.brota!=null&&dentroFp(A.fp,B.cx,B.cyv))return 1;if(Math.abs(A.z-B.z)>.4)return A.z>B.z?1:-1;return A.cy>B.cy?1:A.cy<B.cy?-1:(A.i>B.i?1:-1)}return s>0?1:-1}
const dentroFp=(fp,x,y)=>{let c=false;for(let i=0,j=fp.length-1;i<fp.length;j=i++){const a=fp[i],b=fp[j];if((a[1]>y)!==(b[1]>y)&&x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0])c=!c}return c};
function ordemPecas(L){const n=L.length,dep=L.map(()=>[]),deg=new Array(n).fill(0),key=p=>p.cy+p.z*.001+p.i*1e-6;
  for(let i=0;i<n;i++)for(let j=i+1;j<n;j++){const f=naFrente(L[i],L[j]);if(f>0){dep[j].push(i);deg[i]++}else if(f<0){dep[i].push(j);deg[j]++}}
  const out=[],ok=new Array(n).fill(false);for(let k=0;k<n;k++){let b=-1;for(let i=0;i<n;i++)if(!ok[i]&&deg[i]<=0&&(b<0||key(L[i])<key(L[b])))b=i;if(b<0)for(let i=0;i<n;i++)if(!ok[i]&&(b<0||key(L[i])<key(L[b])))b=i;ok[b]=true;out.push(L[b]);for(const j of dep[b])deg[j]--}return out}
function cena(P,C_){const L=[],G=[],o0=P(0,0),vx=(u,v)=>P(u,v)[0]-o0[0],vy=(u,v)=>(P(u,v)[1]-o0[1])/TILT;
  const mk=(t,u,v,l,d,h,f,o)=>{o=o||{};const r=o.r||0,cr=Math.cos(r),sr=Math.sin(r),pts=[];
    if(t==="rd")for(let k=0;k<10;k++){const a=k*.62832;pts.push([u+Math.cos(a)*l/2,v+Math.sin(a)*l/2])}
    else for(const [a,b] of[[-1,-1],[1,-1],[1,1],[-1,1]])pts.push([u+cr*a*l/2-sr*b*d/2,v+sr*a*l/2+cr*b*d/2]);
    const fp=pts.map(q=>[vx(q[0],q[1]),vy(q[0],q[1])]);let x0=1e9,x1=-1e9;for(const q of fp){if(q[0]<x0)x0=q[0];if(q[0]>x1)x1=q[0]}
    L.push({t,u,v,l,d,h,r,z:o.z||0,f,det:[],fp,x0,x1,cx:vx(u,v),cyv:vy(u,v),cy:vy(u,v)+(o.dy||0),i:L.length,chao:pts,brota:o.brota==null?null:o.brota});return S};
  const S={P,pecas:L,
    chao(f){G.push(f);return S},                                   // chao: sempre primeiro
    cx(u,v,l,d,h,f,o){return mk("cx",u,v,l,d,h,f,o)},              // caixa l x d (l ao longo de u; o.r gira), altura h, base o.z
    rd(u,v,r,h,f,o){return mk("rd",u,v,r*2,r*2,h,f,o)},            // redondo de raio r
    em(f){L[L.length-1].det.push(f);return S},                     // detalhe apoiado na ultima peca
    vis(nu,nv){return vy(nu,nv)>.02*Math.hypot(nu,nv)},            // a face de normal (nu,nv) olha para quem ve?
    face(nu,nv,f){if(S.vis(nu,nv))L[L.length-1].det.push(f);return S},
    fim(){const ord=ordemPecas(L);if(cena.gancho){const pinta=(p,fe)=>{if(p.f)p.f();for(const f of p.det)f();if(C_)for(const q of fe)if(q.brota!=null&&dentroFp(p.fp,q.cx,q.cyv)){const yb=P(q.u,q.v,q.brota)[1]+q.l*.2*TILT;C_.save();C_.beginPath();C_.rect(-1e5,-1e5,2e5,1e5+yb);C_.clip();if(q.f)q.f();for(const f of q.det)f();C_.restore()}fe.push(p)};cena.gancho({G,L,ord,P,pinta});return}if(REC)for(const p of L){const zs=(P(p.u,p.v,0)[1]-P(p.u,p.v,1)[1])*REC.m;regP(p.chao.map(q=>P(q[0],q[1],0)),0,0,false);const k=REC.S[REC.S.length-1];if(k){k.t=p.t==='rd'?'rd':'cx';k.z0=p.z*zs;k.z1=(p.z+p.h)*zs;k.decl=1}}for(const f of G)f();const fe=[];
      for(const p of ord){if(p.f)p.f();for(const f of p.det)f();
        // peca que atravessa o telhado de outra (torre no canto, chamine): reaparece so do telhado para cima
        if(C_)for(const q of fe)if(q.brota!=null&&dentroFp(p.fp,q.cx,q.cyv)){const yb=P(q.u,q.v,q.brota)[1]+q.l*.2*TILT;C_.save();C_.beginPath();C_.rect(-1e5,-1e5,2e5,1e5+yb);C_.clip();if(q.f)q.f();for(const f of q.det)f();C_.restore()}
        fe.push(p)}}};
  return S}
// dois retangulos no chao, em coordenadas do mapa ({x,y,ang,L,D}): 1 se a esta na frente de b, -1 se atras, 0 se nao se cobrem
const retFp=(r,i)=>{const c=Math.cos(r.ang||0),s=Math.sin(r.ang||0),l=r.L/2,d=r.D/2,fp=[[-l,-d],[l,-d],[l,d],[-l,d]].map(q=>[r.x+c*q[0]-s*q[1],r.y+s*q[0]+c*q[1]]);let x0=1e9,x1=-1e9;for(const q of fp){if(q[0]<x0)x0=q[0];if(q[0]>x1)x1=q[0]}return {fp,x0,x1,z:r.z||0,cy:r.y,i}};
const frenteRet=(a,b)=>naFrente(retFp(a,1),retFp(b,0));
// lado (+1 ou -1 em v) tratado como frente: o que o gerador mandar (s.fr) ou, sem isso, o lado virado para quem olha
const lado=(P,s)=>s&&s.fr?s.fr:(P(0,1)[1]>=P(0,0)[1]?1:-1);
const PfS=(x,y,ang,s)=>{const P=Pf(x,y,ang);return lado(P,s)>0?P:(u,v,h)=>P(u,-v,h)};
const S_vis=(P,nu,nv)=>P(nu,nv)[1]>P(0,0)[1];
// ponto da frente de um asset redondo de raio r: o lado que o gerador mandar (s.fr) ou o virado para quem olha
const frR=(P,s,r)=>{if(s&&s.fr)return P(0,s.fr*r,0);const o=P(0,0);return [o[0],o[1]+r*TILT]};
// ordena posicoes (u,v) de tras para frente
const porFundo=(P,list)=>list.map(q=>[P(q[0],q[1])[1],q]).sort((a,b)=>a[0]-b[0]).map(z=>z[1]);
// variacao de cada exemplar (ov.vari): planta espelhada, telhado e parede sorteados entre os da cultura. O tamanho varia no gerador.
function draw(c,x,y,id,race,v,ang,ov){const e0=ESP_,a0=ANG_;try{return draw0(c,x,y,id,race,v,ang,ov)}finally{ESP_=e0;ANG_=a0}}
function draw0(c,x,y,id,race,v,ang,ov){const FV=ov&&ov.forma||0;let s=ST(race||"humano");if(ov)s=Object.assign({},s,ov);v=v==null?.5:v;ang=ang||0;ANG_=ang;ESP_=false;
  if(ov&&ov.vari){const h1=(v*7.31)%1,h2=(v*13.7)%1,h3=(v*3.17)%1;if(!ov.roof&&Array.isArray(s.roofs)&&s.roofs.length)s.roof=s.roofs[(h2*s.roofs.length)|0];if(!ov.wall&&Array.isArray(s.walls)&&s.walls.length)s.wall=s.walls[(h3*s.walls.length)|0];ESP_=h1<.5&&!SEMESP.has(id)}const rf=RF(s.roof),wl=WL(s.wall),cr=ov&&ov.ban?ov.ban:s.race==="elfo"?"#3f7a6a":s.race==="orc"?"#4a3a2a":s.race==="anao"?"#5a5c63":"#a8352a";
  switch(id){
  case "townhall":{const a=ang+.34,P=Pf(x,y,a),S=cena(P),fs=lado(P,s);
    if(FV===2)S.cx(15,-1,11,9,6+4.4,()=>hall(c,...P(15,-1),11,9,6,s,{ang:a+1.5708,exact:1}),{r:1.5708});
    S.cx(0,0,26,13,9+7.15,()=>{hall(c,...P(0,0),26,13,9,s,{ang:a,exact:1,timber:s.race==="humano"});const t=P(FV===1?-9:0,0,9);tower(c,t[0],t[1]+1,3.4,s.asian?12:15,s,{rh:7});if(!s.asian){c.fillStyle="#efe6cb";c.strokeStyle=INK;c.lineWidth=.6;c.beginPath();c.arc(t[0],t[1]-10,1.6,0,7);c.fill();c.stroke()}})
      .face(0,fs,()=>{banner(c,...P(-8,fs*6.5,8),cr);banner(c,...P(8,fs*6.5,8),cr)});S.fim();break}
  case "guild":{const a=ang+.34,P=Pf(x,y,a),S=cena(P),fs=lado(P,s);
    if(FV===2)S.cx(12,-4,9,8,6+4.4,()=>hall(c,...P(12,-4),9,8,6,s,{ang:a+1.5708,exact:1,timber:1}),{r:1.5708});else S.rd(FV===1?-15:13,-3,3,16+4.8,()=>tower(c,...P(FV===1?-15:13,-3),3,16,s,{}));
    S.cx(-2,0,24,12,8+6.6,()=>{hall(c,...P(-2,0),24,12,8,s,{ang:a,exact:1,timber:1});flag(c,...P(FV===1?6:-10,0,13),10,cr)}).face(0,fs,()=>banner(c,...P(-2,fs*6,7),"#c9a24a"));S.fim();break}
  case "bank":{const a=ang+.34,P=PfS(x,y,a,s),S=cena(P),W=WALL.marble||WL("white");shadow(c,x,y,15,6);
    S.chao(()=>quad(c,P,[[-13,-8,0],[13,-8,0],[13,4,0],[-13,4,0]],"#cfc8b6"));
    {const HB=FV===2?11:8;S.cx(0,-2,22,10,HB+(FV===1?5:4),()=>{const b=P(0,-2);prism(c,b[0],b[1],22,10,HB,a,s.flat?WL(s.wall):W);if(FV===1){const t=P(0,-2,HB);prism(c,t[0],t[1],8,8,1.4,a,s.flat?WL(s.wall):W);c.save();dome(c,t[0],t[1]-1.4,4.4,ROOF.copper);c.restore()}else if(!s.flat)hipRoof(c,Pf(b[0],b[1],a),22,10,HB,4,s.asian?RF(s.roof):ROOF.slate);flag(c,...P(10,-2,HB),9,cr)})
      .face(0,1,()=>{for(const hz of FV===2?[5.2,8.6]:[5.2])for(let i=0;i<5;i++){const q=P(-8+i*4,3,hz);c.fillStyle="#2b2418";c.fillRect(q[0]-.7,q[1]-1.8,1.4,1.8)}})}
    S.cx(0,5.3,16.4,6.2,9,()=>portico(c,P,-7,7,3,7.6,7.6,5));S.fim();break}
  case "court":{const a=ang+.34,P=PfS(x,y,a,s),S=cena(P);shadow(c,x,y,15,6);
    if(FV===1)S.cx(14.5,-4,4.6,4.6,22,()=>{const q=P(14.5,-4);torreQ(c,q[0],q[1]+2,4.6,16,6,RF(s.roof==="sandtop"?"terra":s.roof),WL(s.wall),false,a+.7854)});
    if(FV===2)for(const sd of[-1,1])S.cx(sd*15,1,6,10,7+3.5,()=>hall(c,...P(sd*15,1),10,6,7,s,{ang:a+1.5708,exact:1,R:3.5}),{r:1.5708});
    S.cx(0,-3,24,10,10+5,()=>{hall(c,...P(0,-3),24,10,10,s,{ang:a,exact:1,R:5});if(FV!==1){const top=P(0,-3,s.flat||s.asian?10:15);dome(c,top[0],top[1],FV===2?5.6:4.6,s.flat?ROOF.gold:ROOF.copper)}flag(c,...P(11,-3,10),9,cr)});
    S.cx(0,4.3,18.4,5.6,11,()=>portico(c,P,-8,8,2,6.6,9,6));S.fim();break}
  case "prison":{const a=ang+.35,P=Pf(x,y,a),S=cena(P,c),fs=lado(P,s);
    S.cx(0,0,22,14,8,()=>prism(c,x,y,22,14,8,a,WALL.darkstone,"#9a958a")).face(0,fs,()=>{for(let u=-8;u<=8.1;u+=4){quad(c,P,[[u-.8,fs*7.05,3],[u+.8,fs*7.05,3],[u+.8,fs*7.05,5.6],[u-.8,fs*7.05,5.6]],"#2a2420");line(c,P(u,fs*7.06,3),P(u,fs*7.06,5.6),.4,"#7a7a7a")}});
    for(const tu of FV===1?[-10]:FV===2?[-10,10]:[10])S.rd(tu,-6,4,15+1.5,()=>tower(c,...P(tu,-6),4,15,s,{cren:1,wall:"darkstone"}),{brota:8});S.fim();break}
  case "hospital":{const a=ang+.34,P=Pf(x,y,a),S=cena(P),W=s.flat?s.wall:"white";
    S.cx(0,-2,30,11,7+6.05,()=>{hall(c,...P(0,-2),30,11,7,s,{ang:a,exact:1,wall:W});const f=P(-12,-2,7);flag(c,f[0],f[1]-4,9,"#4a8a4a");c.fillStyle="#efe6cb";c.fillRect(f[0]+1,f[1]-12.4,3.2,1);c.fillRect(f[0]+2.1,f[1]-13.4,1,3)});
    S.cx(9,7,10,8,6+4.4,()=>hall(c,...P(9,7),10,8,6,s,{ang:a+1.5708,exact:1,wall:W}),{r:1.5708});S.fim();break}
  case "barracks":{const a=ang+.34,P0=Pf(x,y,a),P=FV===1?(u,w,h)=>P0(u,-w,h):P0,S=cena(P);if(FV===2)S.cx(-13,-14,8,8,5+3.8,()=>hall(c,...P(-13,-14),8,8,5,s,{ang:a+1.5708,exact:1,R:3.8}),{r:1.5708});S.chao(()=>quad(c,P,[[-17,0,0],[17,0,0],[17,12,0],[-17,12,0]],"rgba(200,180,130,.75)"));
    S.cx(0,-5,32,10,6+5.5,()=>{hall(c,...P(0,-5),32,10,6,s,{ang:a,exact:1});flag(c,...P(15,-4),13,cr)});
    S.cx(-17,6,.4,12,2,()=>fence(c,[P(-17,0),P(-17,12)]));S.cx(0,12,34,.4,2,()=>fence(c,[P(-17,12),P(17,12)]));S.cx(17,6,.4,12,2,()=>fence(c,[P(17,12),P(17,0)]));
    for(const u of[-9,-3,3,9])S.rd(u,7,1,5.5,()=>{post(c,P,u,7,0,4.5,.8,"#5a4028");line(c,P(u-1.4,7,3.4),P(u+1.4,7,3.4),.8,"#5a4028");const hp=P(u,7,5.2);c.fillStyle="#d8c9a0";c.beginPath();c.arc(hp[0],hp[1],1,0,7);c.fill()});S.fim();break}
  case "gatehouse":{// portao na escala da muralha (muralha ~5 unidades): bloco sobre a passagem e torres orientadas pelo portao
    const a=ang,P=Pf(x,y,a),W=WL(s.wall==="felt"?"stone":s.wall),g=s.asian?"torreado":s.gate||"torreado",mon=g==="monumental",bl=g==="simples"?9.5:mon?12.5:10.5,bd=7,bh=g==="simples"?6.5:mon?8.5:7.5,sp=bl/2+2.7,th=mon?11.5:9.5,tL=mon?5.8:5.2;
    const fs=P(0,1)[1]>=P(0,0)[1]?1:-1,FD=(u,v,h)=>P(u,v*fs,h),rf=RF(s.troof==="madeira"?"shingle":s.roof);
    const sqT=(u,L,H,rh,cren)=>{const q=P(u,0);prism(c,q[0],q[1],L,L,H,a,W,K.mixc(W[0],"#ffffff",.15));const Q=(du,dv,z)=>P(u+du,dv,z),hl=L/2;
      if(cren){const M=[];for(const du of[-hl+.6,0,hl-.6])for(const dv of[-hl+.6,0,hl-.6]){if(!du&&!dv)continue;M.push([Q(du,dv)[1],du,dv])}M.sort((p,q)=>p[0]-q[0]);for(const [,du,dv] of M){const z=Q(du,dv,H);prism(c,z[0],z[1],1.1,1.1,1.2,a,W,K.mixc(W[0],"#ffffff",.25))}}
      else{const C4=[[-hl-.4,-hl-.4],[hl+.4,-hl-.4],[hl+.4,hl+.4],[-hl-.4,hl+.4]],ap=Q(0,0,H+rh),F=[];for(let k=0;k<4;k++){const p1=C4[k],p2=C4[(k+1)%4],mu=(p1[0]+p2[0])/2,mv=(p1[1]+p2[1])/2;F.push([Q(mu,mv)[1],p1,p2,mu,mv])}F.sort((p,q)=>p[0]-q[0]);for(const [,p1,p2,mu,mv] of F){const l=Math.hypot(mu,mv)||1,wx=(Math.cos(a)*mu-Math.sin(a)*mv)/l,wy=(Math.sin(a)*mu+Math.cos(a)*mv)/l;poly(c,[Q(p1[0],p1[1],H),Q(p2[0],p2[1],H),ap],K.mixc(rf[1],rf[0],clamp(.5+.62*(-wx*.85+wy*.3),0,1)),INK)}}
      const f=Q(0,fs*(hl+.05),H*.62);c.fillStyle="#2a2018";c.fillRect(f[0]-.45,f[1]-1.6,.9,1.6)};
    const rdT=(u,r,H)=>{const q=P(u,0);cyl(c,q[0],q[1],r,H,W,.9);const t=[q[0],q[1]-H];if(s.troof==="ameias"){c.fillStyle=W[0];c.strokeStyle=INK;c.lineWidth=.6;c.beginPath();c.ellipse(t[0],t[1],r+.5,(r+.5)*TILT,0,0,7);c.fill();c.stroke();c.lineWidth=1.2;c.setLineDash([1.1,1.1]);c.beginPath();c.ellipse(t[0],t[1]-.8,r+.4,(r+.4)*TILT,0,0,3.1416);c.stroke();c.setLineDash([]);c.lineWidth=.8}else cone(c,t[0],t[1],r+.6,s.troof==="madeira"?r*1.05:r*1.75,rf);c.fillStyle="#2a2018";c.fillRect(q[0]-.45,q[1]-H*.62,.9,1.6)};
    const twr=u=>{if(!s.tshape||s.tshape==="quadrada")sqT(u,tL,th,s.troof==="madeira"?2.6:mon?5:4,!s.troof||s.troof==="ameias");else rdT(u,tL*.55,th)};
    const body=()=>{if(s.asian){const q=P(0,0);KR.drawAsian(c,q[0],q[1],{L:bl,D:bd,H:bh*.8,R:3.4,ang:a,roof:"jp",wall:"jpw",base:0})}else{const q=P(0,0);prism(c,q[0],q[1],bl,bd,bh,a,W,K.mixc(W[1],"#6a6458",.35));const M=[];for(let u=-bl/2+.7;u<=bl/2-.6;u+=1.9)for(const v of[-bd/2+.5,bd/2-.5])M.push([P(u,v)[1],u,v]);M.sort((p,q)=>p[0]-q[0]);for(const [,u,v] of M){const z=P(u,v,bh);prism(c,z[0],z[1],1.1,.9,1.1,a,W,K.mixc(W[0],"#ffffff",.25))}}
      // passagem em arco na face de quem olha (so se a face nao estiver de lado)
      if(Math.abs(P(0,bd/2)[1]-P(0,-bd/2)[1])>1.2){const dh=3.4,r=2.1,pts=[FD(-r,bd/2+.02,0)];for(let k=0;k<=8;k++){const t=Math.PI-Math.PI*k/8;pts.push(FD(Math.cos(t)*r,bd/2+.02,dh+Math.sin(t)*r))}pts.push(FD(r,bd/2+.02,0));poly(c,pts,"#241b12",INK);
        if(s.moat){poly(c,[FD(-r-.2,bd/2+.05,0),FD(r+.2,bd/2+.05,0),FD(r+.2,bd/2+7,0),FD(-r-.2,bd/2+7,0)],"#8d6c46",INK);c.strokeStyle="#3a2c1b";c.lineWidth=.45;c.beginPath();for(const u of[-r,r]){const p=FD(u,bd/2+.1,dh+1.6),q=FD(u*.9,bd/2+6.6,0);c.moveTo(p[0],p[1]);c.lineTo(q[0],q[1])}c.stroke()}
        else{c.strokeStyle="#6a5a3a";c.lineWidth=.4;c.beginPath();for(let u=-1.5;u<=1.6;u+=.75){const p=FD(u,bd/2+.03,0),q=FD(u,bd/2+.03,dh+1.4);c.moveTo(p[0],p[1]);c.lineTo(q[0],q[1])}for(let h=1;h<dh+1;h+=1.3){const p=FD(-1.9,bd/2+.03,h),q=FD(1.9,bd/2+.03,h);c.moveTo(p[0],p[1]);c.lineTo(q[0],q[1])}c.stroke()}
        if(s.ban!==false&&!s.asian)banner(c,...FD(0,bd/2+.05,bh-.6),cr)}};
    const parts=(g==="simples"||s.asian?[["b",0]]:[["t",-sp],["t",sp],["b",0]]).map(z=>({z,sy:P(z[1],0)[1]+(z[0]==="b"?.01:0)})).sort((p,q)=>p.sy-q.sy);
    for(const {z} of parts){if(z[0]==="t")twr(z[1]);else body()}break}
  case "cathedral":{if(["eslavo","bizantino","egipcio","celta","andino","gnomo"].includes(s.race)&&templo(c,x,y,ang+.34,1.69,s.race,.85,null,true)){}else if(s.asian&&templo(c,x,y,ang+.34,1.88,s.race==="japones"?"japones":"chines",.85,null,true)){}else if(s.flat)mosque(c,x,y,ang+.34,1,s,v);else{shadow(c,x,y,20,8);church(c,x,y,ang+.34,1,s,.8)}break}
  case "chapel":{const a=ang+.34,P=Pf(x,y,a),S=cena(P),W=s.flat?s.wall:"white";
    S.rd(-7.6,0,2.4,13+6,()=>tower(c,...P(-7.6,0),2.4,13,s,{rh:6}));S.cx(0,0,13,8,6+4.4,()=>hall(c,...P(0,0),13,8,6,s,{ang:a,exact:1,wall:W}));S.fim();break}
  case "monastery":{const a=ang+.34,P=Pf(x,y,a),S=cena(P);S.chao(()=>quad(c,P,[[-8,-4,0],[8,-4,0],[8,6,0],[-8,6,0]],"#9fb060"));
    S.cx(0,-9,26,8,7+4.4,()=>hall(c,...P(0,-9),26,8,7,s,{ang:a,exact:1}));S.rd(8,-12,3,18+4.8,()=>tower(c,...P(8,-12),3,18,s,{}));
    S.cx(-12,1,14,8,6+4.4,()=>hall(c,...P(-12,1),14,8,6,s,{ang:a+1.5708,exact:1}),{r:1.5708});S.cx(12,1,14,8,6+4.4,()=>hall(c,...P(12,1),14,8,6,s,{ang:a+1.5708,exact:1}),{r:1.5708});
    S.cx(0,9,22,5,4+3,()=>hall(c,...P(0,9),22,5,4,s,{ang:a,exact:1,R:3}));S.rd(0,1,2.2,3,()=>{const w=P(0,1);c.fillStyle="#5d7737";c.beginPath();c.arc(w[0],w[1]-1,2.2,0,7);c.fill()});S.fim();break}
  case "library":{const a=ang+.34,P=PfS(x,y,a,s),S=cena(P);
    if(FV===1)S.rd(-16.5,-2,4,19,()=>{const q=P(-16.5,-2);cyl(c,q[0],q[1],4,14,WL(s.wall));cone(c,q[0],q[1]-14,4.8,5,s.flat?ROOF.gold:ROOF.copper)});
    if(FV===2)for(const sd of[-1,1])S.cx(sd*12,-9,8,6,6+3.3,()=>hall(c,...P(sd*12,-9),8,6,6,s,{ang:a,exact:1,R:3.3}));
    S.cx(0,0,28,13,9+7.15,()=>{hall(c,...P(0,0),28,13,9,s,{ang:a,exact:1});const t=P(0,0,s.flat?9*1.05:9+13*.55);if(!s.asian)dome(c,t[0],t[1]+1,s.flat?5.4:4.6,s.flat?ROOF.gold:ROOF.copper)});
    S.cx(0,8,10.2,3.4,9,()=>portico(c,P,-4.5,4.5,6.5,9.4,7.4,4));S.fim();break}
  case "university":{const a=ang+.34,P=Pf(x,y,a),S=cena(P);S.chao(()=>quad(c,P,[[-10,-5,0],[10,-5,0],[10,7,0],[-10,7,0]],"#a9b46a"));
    S.cx(0,-11,32,9,9+4.95,()=>hall(c,...P(0,-11),32,9,9,s,{ang:a,exact:1}));S.rd(0,-13,3.6,25+8,()=>tower(c,...P(0,-13),3.6,25,s,{rh:8}));
    S.cx(-15,0,18,9,8+4.95,()=>hall(c,...P(-15,0),18,9,8,s,{ang:a+1.5708,exact:1}),{r:1.5708});S.cx(15,0,18,9,8+4.95,()=>{hall(c,...P(15,0),18,9,8,s,{ang:a+1.5708,exact:1});flag(c,...P(15,-8),9,cr)},{r:1.5708});
    S.rd(0,1,2.6,3,()=>{const w=P(0,1);c.fillStyle="#5d7737";c.beginPath();c.arc(w[0],w[1]-1,2.6,0,7);c.fill()});
    S.cx(0,11,24,5,5+3,()=>hall(c,...P(0,11),24,5,5,s,{ang:a,exact:1,R:3}));S.fim();break}
  case "observatory":{if(REC){const P_=Pf(x,y,ang+0.34);dc(P_,"rd",0,0,9,9,18);dc(P_,"cx",4.5,0,7,2,15,25);}const P=Pf(x,y,ang+.34),fr=S_vis(P,1,0);KR.drawRound(c,x,y,9,9,0,{wall:s.wall,roof:"slate"});const tel=()=>{const a=P(1.5,0,16),b=P(7.5,0,24);c.lineCap="round";line(c,a,b,3.4,INK);line(c,a,b,2.2,"#7a5a32");c.lineCap="butt"};if(!fr)tel();dome(c,x,y-9,8.4,ROOF.copper);if(fr)tel();const d=frR(P,s,8.9);c.fillStyle="#2b2418";c.fillRect(d[0]-1.2,d[1]-4.2,2.4,4.2);break}
  case "school":{const a=ang+.34,P=Pf(x,y,a);hall(c,...P(0,0),18,10,6,s,{ang:a,exact:1,timber:1});const b=P(4,0,6+10*.55);tower(c,b[0],b[1]+.5,1.4,4,s,{rh:3.4});c.fillStyle="#c9a24a";c.beginPath();c.arc(b[0],b[1]-2.4,.8,0,7);c.fill();break}
  case "markethall":{const L=30,D=14,H=7,a=ang+.34,P=Pf(x,y,a),S=cena(P);S.chao(()=>poly(c,[P(-L/2,-D/2),P(L/2,-D/2),P(L/2,D/2),P(-L/2,D/2)],"#cfc3a3",INK));
    for(let i=0;i<4;i++)for(const sd of[-1,1]){const u=-L/2+2+i*(L-4)/3,w=sd*(D/2-1.5);S.rd(u,w,.5,H,()=>{const p=P(u,w,0),q=P(u,w,H);c.strokeStyle="#4a3524";c.lineWidth=1.4;c.beginPath();c.moveTo(p[0],p[1]);c.lineTo(q[0],q[1]);c.stroke()})}
    for(const [u,w] of [[-8,0],[0,2],[8,-1]])S.cx(u,w,2,2,2,()=>{const p=P(u,w,0);crate(c,p[0],p[1],.7,["#b5473a","#3f6f8f","#c9a24a"][(u/8+1)|0])});
    S.cx(0,0,L+2,D+2,6,()=>KR.drawHouseA(c,x,y-H,{L:L+2,D:D+2,H:.6,R:5,ang:a,roof:s.roof==="sandtop"?"terra":s.roof,wall:"wood"}),{z:H});S.fim();break}
  case "inn":{const a=ang+.34,P=Pf(x,y,a),S=cena(P);
    if(FV===2)S.cx(0,-10,16,6,4+3.3,()=>hall(c,...P(0,-10),16,6,4,s,{ang:a,exact:1,wall:"wood"}));else{const u_=FV===1?-13:13;S.cx(u_,5,10,8,5+4.4,()=>hall(c,...P(u_,5),10,8,5,s,{ang:a+1.5708,exact:1,wall:"wood"}),{r:1.5708})}
    S.cx(0,0,22,12,9+6.6,()=>{hall(c,...P(0,0),22,12,9,s,{ang:a,exact:1,timber:1});const sg=P(-11,6,6);c.strokeStyle="#3a2c1b";c.lineWidth=.7;c.beginPath();c.moveTo(sg[0],sg[1]);c.lineTo(sg[0]-3,sg[1]);c.stroke();poly(c,[[sg[0]-3.6,sg[1]],[sg[0]-.8,sg[1]],[sg[0]-.8,sg[1]+3.4],[sg[0]-3.6,sg[1]+3.4]],"#c9a24a",INK);smoke(c,...P(3,0,16))});
    S.rd(-6,8,1,2,()=>barrel(c,...P(-6,8),.8));S.fim();break}
  case "shop":{const a=ang+.34,P=Pf(x,y,a),S=cena(P),sg=lado(P,s);S.cx(4,sg*7.2,1.6,1.6,1.6,()=>crate(c,...P(4,sg*7.2),.6));
    if(FV===2)S.cx(9,0,8,5,4+2.2,()=>hall(c,...P(9,0),8,5,4,s,{ang:a+1.5708,exact:1,wall:"wood",R:2.2}),{r:1.5708});
    S.cx(0,0,13,9,(FV===1?11:8)+4.95,()=>hall(c,x,y,13,9,FV===1?11:8,s,{ang:a,exact:1,timber:1})).face(0,sg,()=>{door(c,P,-3,sg*4.5,2,3.4);awning(c,P,-6,1,sg*4.5,sg,4.4,["#b5473a","#3f6f8f","#5f7e35"][(v*3)|0])});S.fim();break}
  case "bakery":{const a=ang+.34,P=Pf(x,y,a),S=cena(P),sg=lado(P,s),ou=FV===1?-9.5:FV===2?2:9.5,ow=FV===2?-sg*7.5:sg*2,ov_=P(ou,ow);
    S.rd(ou,ow,3.4,5.2,()=>{KR.drawRound(c,ov_[0],ov_[1],3.4,2.6,2.6,{wall:"brick",roof:"slate"});smoke(c,ov_[0],ov_[1]-9)});
    S.cx(0,0,13,9,7+4.95,()=>hall(c,x,y,13,9,7,s,{ang:a,exact:1})).face(0,sg,()=>{door(c,P,-2,sg*4.5,2,3.2);quad(c,P,[[-5.4,sg*4.6,4],[-3,sg*4.6,4],[-3,sg*4.6,5.4],[-5.4,sg*4.6,5.4]],"#c9a24a")});S.fim();break}
  case "alchemist":{const a=ang+.34,P=Pf(x,y,a),S=cena(P),sg=lado(P,s);
    if(FV===1)S.rd(7.5,-3,2.6,16,()=>{const q=P(7.5,-3);cyl(c,q[0],q[1],2.6,11,WL(s.wall));cone(c,q[0],q[1]-11,3.2,5.6,RF("arcane"));c.fillStyle="#9fe0a8";c.fillRect(q[0]-.5,q[1]-7,1,1.6)});
    if(FV===2)S.chao(()=>{for(const [u,w,col] of[[9,-3,"#7a9a4a"],[9,2,"#8a6aa8"],[12.5,-.5,"#6a9a7a"]])quad(c,P,[[u-1.6,w-2,0],[u+1.6,w-2,0],[u+1.6,w+2,0],[u-1.6,w+2,0]],col)});
    S.cx(0,0,12,9,8+4.95,()=>hall(c,x,y,12,9,8,s,{ang:a,exact:1,roof:"arcane"})).face(0,sg,()=>{door(c,P,1,sg*4.5,2,3.4);const sb=P(-4,sg*5.6,5.4),sa=P(-4,sg*4.5,6.2);c.strokeStyle=INK;c.lineWidth=.5;c.beginPath();c.moveTo(sa[0],sa[1]);c.lineTo(sb[0],sb[1]-.4);c.stroke();c.fillStyle="#6ab8a0";c.beginPath();c.arc(sb[0],sb[1]+.8,1.3,0,7);c.fill();c.stroke()})
      .em(()=>{const ch=P(3,0,11);smoke(c,ch[0],ch[1],"#9fe0a8");const ch2=P(-3,0,10);smoke(c,ch2[0],ch2[1],"#c9a8f0")});S.fim();break}
  case "warehouse":{const a=ang+.34,P=Pf(x,y,a),S=cena(P),sg=lado(P,s);
    for(const [k,u,w] of[[0,-12,10],[0,-9,11],[1,10,10.5],[1,13,9.5]])S.cx(u,sg*w,1.8,1.8,2,()=>{const q=P(u,sg*w);k?barrel(c,q[0],q[1],.8):crate(c,q[0],q[1],.8)});
    if(FV===1){for(const u of[-8.5,8.5])S.cx(u,0,16,14,7+5,()=>hall(c,...P(u,0),16,14,7,s,{ang:a,exact:1,wall:"wood",R:5})).face(0,sg,()=>barnDoor(c,P,u,sg*7,6,5))}
    else{S.cx(0,0,34,14,7+5,()=>hall(c,x,y,34,14,7,s,{ang:a,exact:1,wall:"wood",R:5})).face(0,sg,()=>barnDoor(c,P,0,sg*7,8,5.5));if(FV===2)S.rd(-14,-4,2.6,14,()=>tower(c,...P(-14,-4),2.6,10,s,{rh:4}))}S.fim();break}
  case "stall":{if(REC){const P_=Pf(x,y,ang+0);dc(P_,"cx",0,0,11,6.8,5,7.4);dc(P_,"cx",0,0,8,4,2.6,3.6);}const ca=Math.cos(ang),sa=Math.sin(ang),P=(a,b,h)=>[x+ca*a-sa*b,y+(sa*a+ca*b)*TILT-(h||0)],col=[["#b5473a","#efe6cb"],["#3f6f8f","#efe6cb"],["#5f7e35","#e8d9a0"],["#c9a24a","#7a3a2a"],["#8a4a7a","#efe6cb"]][(v*5)|0];
    prism(c,x,y,8,4,2.6,ang,["#a07a4a","#6e5030"]);const g=P(0,0,2.6);for(let i=0;i<4;i++){c.fillStyle=["#c9a24a","#7a9a4a","#b5473a","#e8d9a0"][i];c.beginPath();c.arc(g[0]-3+i*2,g[1]-.4,.8,0,7);c.fill()}
    for(const [a,b] of [[-4,-2],[4,-2],[-4,2],[4,2]]){const p=P(a,b,0),q=P(a,b,6.5);c.strokeStyle="#4a3524";c.lineWidth=.6;c.beginPath();c.moveTo(p[0],p[1]);c.lineTo(q[0],q[1]);c.stroke()}
    const r=[P(-5,-3,7.2),P(5,-3,7.2),P(5.6,3.4,5.2),P(-5.6,3.4,5.2)];poly(c,r,col[1],INK);c.save();c.beginPath();c.moveTo(r[0][0],r[0][1]);r.forEach(q=>c.lineTo(q[0],q[1]));c.closePath();c.clip();c.fillStyle=col[0];for(let i=0;i<6;i+=2){const a=P(-5+i*10/6,-3,7.2),b=P(-5+(i+1)*10/6,-3,7.2),cc=P(-5.6+(i+1)*11.2/6,3.4,5.2),d=P(-5.6+i*11.2/6,3.4,5.2);poly(c,[a,b,cc,d],col[0],null)}c.restore();c.strokeStyle=INK;c.lineWidth=.6;c.beginPath();r.forEach((q,i)=>i?c.lineTo(q[0],q[1]):c.moveTo(q[0],q[1]));c.closePath();c.stroke();break}
  case "smithy":{const a=ang+.34,P0=Pf(x,y,a),mf=FV===1?-1:1,P=(u,w,h)=>P0(u*mf,w,h),S=cena(P);
    if(FV===2)S.cx(-11,-3.5,2.6,2.6,17,()=>{const q=P(-11,-3.5);prism(c,q[0],q[1],2.6,2.6,16,a,WL("brick"));smoke(c,q[0],q[1]-17,"#8a8282")});
    S.cx(-5,0,14,10,7+5.5,()=>{hall(c,...P(-5,0),14,10,7,s,{ang:a,exact:1,wall:s.flat?s.wall:"stone"});if(FV!==2)smoke(c,...P(-8,-2,15),"#8a8282")});
    S.cx(8,.5,12,11,7.4,()=>{const g=P(8,1,0);glow(c,g[0],g[1]-1,7,"rgba(255,140,40,.55)");for(const [u,w] of porFundo(P,[[3,-4],[13,-4],[3,5],[13,5]]).slice(0,2))post(c,P,u,w,0,w<0?7:6,1,"#4a3524");prism(c,...P(8,1),3,2,2,a,["#5a5a5a","#3a3a3a"]);barrel(c,...P(11,3),.7);for(const [u,w] of porFundo(P,[[3,-4],[13,-4],[3,5],[13,5]]).slice(2))post(c,P,u,w,0,w<0?7:6,1,"#4a3524");quad(c,P,[[2,-5,7.4],[14,-5,7.4],[14,6,5.8],[2,6,5.8]],RF(s.roof==="sandtop"?"terra":s.roof)[1])});S.fim();break}
  case "stable":{const a=ang+.34,P=Pf(x,y,a),S=cena(P);S.chao(()=>quad(c,P,[[-13,2,0],[13,2,0],[13,12,0],[-13,12,0]],"rgba(190,170,110,.55)"));
    if(FV===2){S.cx(-4,-4,18,9,6+4.95,()=>hall(c,...P(-4,-4),18,9,6,s,{ang:a,exact:1,wall:"wood"}));S.cx(9,-1,15,6,5+3.3,()=>hall(c,...P(9,-1),15,6,5,s,{ang:a+1.5708,exact:1,wall:"wood"}),{r:1.5708})}
    else S.cx(0,-4,26,9,(FV===1?8:6)+4.95,()=>hall(c,...P(0,-4),26,9,FV===1?8:6,s,{ang:a,exact:1,wall:"wood"}));
    S.cx(-13,7,.4,10,2,()=>fence(c,[P(-13,2),P(-13,12)]));S.cx(0,12,26,.4,2,()=>fence(c,[P(-13,12),P(13,12)]));S.cx(13,7,.4,10,2,()=>fence(c,[P(13,12),P(13,2)]));
    for(const [u,w,col,f] of[[-5,7,"#6a4a2c",1],[5,6,"#b8a080",-1],[1,10,"#3a2c22",1]])S.rd(u,w,1.6,4,()=>horse(c,...P(u,w),col,f));S.fim();break}
  case "watermill":{const a=ang+.34,P=Pf(x,y,a),S=cena(P),r=6.5;
    S.cx(-3,0,14,10,8+5.5,()=>hall(c,...P(-3,0),14,10,8,s,{ang:a,exact:1,wall:"stone"}));
    S.cx(6,0,1.4,13,10,()=>{const wp=P(6,0);c.fillStyle="rgba(150,190,200,.7)";c.beginPath();c.ellipse(wp[0]+1,wp[1]+2,5,1.6,0,0,7);c.fill();
      const rim=[];for(let i=0;i<20;i++){const t=i/20*6.283;rim.push(P(6,Math.cos(t)*r,r*.55+Math.sin(t)*r))}c.strokeStyle="#5a4028";c.lineWidth=1.3;c.beginPath();rim.forEach((q,i)=>i?c.lineTo(q[0],q[1]):c.moveTo(q[0],q[1]));c.closePath();c.stroke();const ce=P(6,0,r*.55);c.lineWidth=.8;c.beginPath();for(let i=0;i<8;i++){const t=i/8*6.283,q=P(6,Math.cos(t)*r,r*.55+Math.sin(t)*r);c.moveTo(ce[0],ce[1]);c.lineTo(q[0],q[1])}c.stroke()});S.fim();break}
  case "pottery":{const a=ang+.34,P=Pf(x,y,a),L_=[];shadow(c,x,y,12,5);
    L_.push([P(-4,-1)[1],()=>hall(c,...P(-4,-1),11,8,5.5,s,{ang:a,exact:1,wall:s.flat?s.wall:"daub"})]);
    {const q=P(7,1);L_.push([q[1],()=>{cyl(c,q[0],q[1],3.6,3,["#a9643f","#7a4428"]);dome(c,q[0],q[1]-3,3.6,["#c27a4e","#7a4428"]);c.fillStyle="#2a1a10";c.beginPath();c.ellipse(q[0]-1,q[1]-1.2,1.1,1.4,0,0,7);c.fill();smoke(c,q[0],q[1]-8)}])}
    for(const [u,v,r] of[[2,6,1.3],[4,6.6,1.1],[0,6.8,1.4],[-3,6,1]]){const q=P(u,v);L_.push([q[1],()=>{c.fillStyle="#b86a4c";c.strokeStyle=INK;c.lineWidth=.5;c.beginPath();c.ellipse(q[0],q[1]-r,r,r*1.15,0,0,7);c.fill();c.stroke();c.fillStyle="#3a2416";c.beginPath();c.ellipse(q[0],q[1]-r*2.1,r*.5,r*.22,0,0,7);c.fill()}])}
    L_.sort((p,q)=>p[0]-q[0]).forEach(z=>z[1]());break}
  case "dyeworks":{const a=ang+.34,P=Pf(x,y,a),L_=[],CL=["#a8352a","#2f5a8a","#d8b45a","#5c2a6a","#3d6b35"];shadow(c,x,y,15,6);
    L_.push([P(-5,-2)[1],()=>hall(c,...P(-5,-2),12,8,6,s,{ang:a,exact:1,wall:"wood"})]);
    [[4,4],[8,5],[6,8.5],[10,8]].forEach(([u,v],i)=>{const q=P(u,v);L_.push([q[1],()=>{cyl(c,q[0],q[1],2,1.6,["#8d6c46","#654c30"]);c.fillStyle=CL[i];c.strokeStyle=INK;c.lineWidth=.5;c.beginPath();c.ellipse(q[0],q[1]-1.6,1.7,1.7*TILT,0,0,7);c.fill();c.stroke()}])});
    {const ps=[[-9,6],[-1,6]];const draw=()=>{for(const [u,v] of ps)post(c,P,u,v,0,7,.7,"#5a4028");line(c,P(-9,6,7),P(-1,6,7),.5,"#3a2c1b");for(let k=0;k<4;k++){const u0=-8.4+k*2;quad(c,P,[[u0,6,6.8],[u0+1.6,6,6.8],[u0+1.6,6,2.4+(k%2)],[u0,6,2.4+(k%2)]],CL[(k+1)%5])}};L_.push([P(-5,6)[1],draw])}
    L_.sort((p,q)=>p[0]-q[0]).forEach(z=>z[1]());break}
  case "winery":{if(REC){const P_=Pf(x,y,ang+0.34);dc(P_,"cx",5,-5.2,14.4,11,0,2.8);}const a=ang+.34,P=Pf(x,y,a),L_=[];shadow(c,x,y,17,7);
    for(let r=0;r<4;r++){const v=-10+r*3.2;L_.push([P(4,v)[1]-.5,()=>{line(c,P(-2,v),P(12,v),.5,"#6a5a3a");c.fillStyle=r%2?"#5d7737":"#6f8d40";for(let u=-1.5;u<=12;u+=1.6){const q=P(u,v,1.6);c.beginPath();c.arc(q[0],q[1],1.25,0,7);c.fill()}c.fillStyle="#5c2a6a";for(let u=0;u<=12;u+=3.2){const q=P(u,v,1);c.beginPath();c.arc(q[0]+.6,q[1]+.4,.5,0,7);c.fill()}}])}
    L_.push([P(-7,2)[1],()=>hall(c,...P(-7,2),13,9,6,s,{ang:a,exact:1,wall:s.flat?s.wall:"stone",R:4})]);
    for(const [u,v] of[[2,7],[4,7.4],[3,9.2]]){const q=P(u,v);L_.push([q[1],()=>barrel(c,q[0],q[1],1)])}
    L_.sort((p,q)=>p[0]-q[0]).forEach(z=>z[1]());break}
  case "postmill":{if(REC){const P_=Pf(x,y,ang+0.34);dc(P_,"rd",0,4,12.6,2,28);}const a=ang+.34,P=Pf(x,y,a),S=cena(P);shadow(c,x,y,6,3);
    const velas=()=>{const hp=P(0,4,15),aa=.4+((v||.5)*1.3);c.strokeStyle="#4a3524";c.lineWidth=.9;for(let k=0;k<4;k++){const an=aa+k*1.5708,ex=[hp[0]+Math.cos(an)*12,hp[1]+Math.sin(an)*12];c.beginPath();c.moveTo(hp[0],hp[1]);c.lineTo(ex[0],ex[1]);c.stroke();const px=-Math.sin(an),py=Math.cos(an);poly(c,[[hp[0]+Math.cos(an)*3,hp[1]+Math.sin(an)*3],ex,[ex[0]+px*2.6,ex[1]+py*2.6],[hp[0]+Math.cos(an)*3+px*2.6,hp[1]+Math.sin(an)*3+py*2.6]],"rgba(235,225,200,.85)",INK)}c.fillStyle="#3a2c1b";c.beginPath();c.arc(hp[0],hp[1],1,0,7);c.fill()};
    S.cx(0,0,7,6,17,()=>{const fr=S.vis(0,1);for(const [u,w] of[[-3,-3],[3,-3],[-3,3],[3,3]])line(c,P(u,w),P(0,0,8),.9,"#5a4028");post(c,P,0,0,0,9,1.2,"#5a4028");if(!fr)velas();const t=P(0,0,9);prism(c,t[0],t[1],7,6,8,a,WALL.wood);if(fr)velas()});S.fim();break}
  case "quarry":{if(REC){const P_=Pf(x,y,ang+0.34);dc(P_,"rd",-6,6,.8,0,13);dc(P_,"ch",0,0,13);dc(P_,"cx",-3.5,3.5,7,7,9,13.5);}const a=ang+.34,P0=Pf(x,y,a),fl=P0(0,1)[1]>=P0(0,-1)[1]?1:-1,P=(u,v,h)=>P0(u*fl,v*fl,h),L_=[],RK=["#b4ada0","#857f74"];c.fillStyle="#9d978a";c.beginPath();c.ellipse(x,y,15,7,0,0,7);c.fill();
    L_.push([P(0,-5)[1],()=>prism(c,...P(0,-5),24,5,9,a,RK,"#a7b36a")]);L_.push([P(0,-1)[1],()=>prism(c,...P(0,-1),19,4,5.5,a,RK,"#c4bdae")]);L_.push([P(0,2.6)[1],()=>prism(c,...P(0,2.6),14,3.4,2.4,a,RK,"#cbc4b4")]);
    for(const [u,v,h] of[[8,7,0],[10.6,7.2,0],[9.2,7,2.2],[-9,6.6,0]]){const q=P(u,v,h);L_.push([P(u,v)[1]+h*.01,()=>prism(c,q[0],q[1],2.4,2,2,a,["#d8d1c0","#a49d8e"])])}
    {const q=P(-6,6);L_.push([q[1],()=>{post(c,P,-6,6,0,13,1,"#5a4028");line(c,P(-6,6,13),P(-1,1,10),.8,"#5a4028");line(c,P(-1,1,10),P(-1,1,5),.4,"#2a2018")}])}
    L_.sort((p,q)=>p[0]-q[0]).forEach(z=>z[1]());break}
  case "mine":{const P=KR.drawRockMass(c,x,y-3,{s:.95,ang:ang+.34,mine:1}),vf=5.5;c.strokeStyle="#5a4a38";c.lineWidth=.7;c.beginPath();for(const u of[-1.4,1.4]){const a=P(u,vf,0),b=P(u,vf+13,0);c.moveTo(a[0],a[1]+3);c.lineTo(b[0],b[1]+3)}c.stroke();c.lineWidth=.9;c.strokeStyle="#6a4a2a";c.beginPath();for(let v=vf+1.5;v<vf+13;v+=2.2){const a=P(-2.1,v,0),b=P(2.1,v,0);c.moveTo(a[0],a[1]+3);c.lineTo(b[0],b[1]+3)}c.stroke();
    {const q=P(0,vf+8,0);const ang2=Math.atan2(P(1,vf+8)[1]-q[1],P(1,vf+8)[0]-q[0]);prism(c,q[0],q[1]+3,4.4,3.2,2.6,(ang+.34),["#7d5c3b","#553d26"],"#6e6a62");const t=[q[0],q[1]+.4];c.fillStyle="#5d5a54";c.beginPath();c.ellipse(t[0],t[1],1.8,.9,0,0,7);c.fill()}
    {const h=P(10,vf+7,0);c.fillStyle="#8a8274";c.strokeStyle=INK;c.lineWidth=.6;c.beginPath();c.moveTo(h[0]-6,h[1]+3);c.quadraticCurveTo(h[0],h[1]-4,h[0]+6,h[1]+3);c.closePath();c.fill();c.stroke()}break}
  case "mausoleum":{const a=ang+.34,P=Pf(x,y,a),M=["#f4f1ea","#cbc6ba"];shadow(c,x,y,8,4);prism(c,x,y,10,8,1.6,a,["#d0c9b7","#9a9484"]);const b=P(0,0,1.6);prism(c,b[0],b[1],7.4,5.6,7,a,M);
    const fs=faceSg(P,5.6);for(const u of[-2.6,0,2.6])post(c,P,u,fs*3.2,1.6,8.6,.7,"#e8e3d6");door(c,P,0,fs*2.82,1.8,4.2,"#2a2420");
    const top=P(0,0,8.6),ap=P(0,0,13.5),cs=[P(-4,-3.2,8.6),P(4,-3.2,8.6),P(4,3.2,8.6),P(-4,3.2,8.6)],fc=[];for(let i=0;i<4;i++){const p1=cs[i],p2=cs[(i+1)%4];fc.push([(p1[1]+p2[1])/2,[p1,p2,ap],i])}fc.sort((p,q)=>p[0]-q[0]).forEach(([_,pts,i])=>poly(c,pts,i%2?"#a8a294":"#c9c3b4",INK));break}
  case "griffin":{if(REC){const P_=Pf(x,y,ang+0.34);dc(P_,"rd",7,-1,6.2,22,32);}const a=ang+.34,P=Pf(x,y,a),L_=[];shadow(c,x,y,12,5);
    L_.push([P(-4,0)[1],()=>hall(c,...P(-4,0),13,9,6,s,{ang:a,exact:1,wall:"wood",roof:"shingle"})]);
    {const q=P(7,-1);L_.push([q[1],()=>{cyl(c,q[0],q[1],2,22,["#8d6c46","#654c30"]);c.fillStyle="#9a7446";c.strokeStyle=INK;c.lineWidth=.7;c.beginPath();c.ellipse(q[0],q[1]-22,6,3,0,0,7);c.fill();c.stroke();
      const g=[q[0],q[1]-25];c.fillStyle="#c9a24a";c.beginPath();c.ellipse(g[0],g[1],3.2,1.8,0,0,7);c.fill();c.stroke();c.fillStyle="#f3efe3";c.beginPath();c.arc(g[0]+3,g[1]-1.6,1.3,0,7);c.fill();c.stroke();c.fillStyle="#d8b45a";c.beginPath();c.moveTo(g[0]+4.2,g[1]-1.8);c.lineTo(g[0]+5.6,g[1]-1.2);c.lineTo(g[0]+4.2,g[1]-1.1);c.fill();
      c.fillStyle="#a8843a";for(const sd of[-1,1]){c.beginPath();c.moveTo(g[0]-.5,g[1]-1);c.quadraticCurveTo(g[0]+sd*2-2,g[1]-9,g[0]-6+sd*1.5,g[1]-7);c.quadraticCurveTo(g[0]-3,g[1]-3,g[0]-.5,g[1]-1);c.fill();c.stroke()}}])}
    L_.sort((p,q)=>p[0]-q[0]).forEach(z=>z[1]());break}
  case "stairs":{// lance de pedra: degraus subindo ao longo de u, muretas dos dois lados; desenhado de tras para frente
    const a=ang,ca=Math.cos(a),sa=Math.sin(a),H=s.sh||8,Ln=s.sl||12,Wd=s.sw||7,n=Math.max(3,Math.round(H/1.6)),dl=Ln/n,hw=Wd/2,ST=["#d9d1bd","#a49c88"],T_="#ece5d2",lt=(nx,ny)=>clamp(.5+.62*(-nx*.85+ny*.3),0,1);
    const P=(u,v,z)=>[x+ca*u-sa*v,y+(sa*u+ca*v)*TILT-(z||0)],hz=u=>clamp((u+Ln/2)/Ln,0,1)*H;shadow(c,x,y,Ln*.5,Wd*.5);c.lineJoin="round";
    const wall=v=>{const pts=[P(-Ln/2,v,0)];for(let k=0;k<n;k++){const u0=-Ln/2+k*dl;pts.push(P(u0,v,(k+1)*H/n+.35));pts.push(P(u0+dl,v,(k+1)*H/n+.35))}pts.push(P(Ln/2,v,0));const nx=-sa*Math.sign(v),ny=ca*Math.sign(v);poly(c,pts,K.mixc(ST[1],ST[0],lt(nx,ny)),INK)};
    const steps=()=>{const O=[];for(let k=0;k<n;k++)O.push([sa*(-Ln/2+(k+.5)*dl),k]);O.sort((p,q)=>p[0]-q[0]);for(const [,k] of O){const u0=-Ln/2+k*dl,u1=u0+dl,z=(k+1)*H/n,zb=k*H/n;
      if(ca>0)poly(c,[P(u0,-hw,zb),P(u0,hw,zb),P(u0,hw,z),P(u0,-hw,z)],K.mixc(ST[1],ST[0],lt(-ca,-sa)),"rgba(60,50,36,.8)");poly(c,[P(u0,-hw,z),P(u1,-hw,z),P(u1,hw,z),P(u0,hw,z)],T_,"rgba(60,50,36,.8)");if(ca<=0)poly(c,[P(u1,-hw,zb),P(u1,hw,zb),P(u1,hw,z),P(u1,-hw,z)],K.mixc(ST[1],ST[0],lt(ca,sa)),"rgba(60,50,36,.8)")}};
    const near=ca>=0?hw:-hw;wall(-near);steps();wall(near);break}
  case "tannery":{const a=ang+.34,P0=Pf(x,y,a),P=FV===1?(u,w,h)=>P0(-u,w,h):P0,S=cena(P);
    S.cx(-8,0,12,8,6+4.4,()=>hall(c,...P(-8,0),12,8,6,s,{ang:a,exact:1,wall:"wood"}));if(FV===2)S.cx(-8,-8,10,6,4+3.3,()=>hall(c,...P(-8,-8),10,6,4,s,{ang:a,exact:1,wall:"wood",R:3.3}));
    for(let i=0;i<3;i++){const u=4+i*4.5;S.cx(u,0,.8,5.4,6,()=>{post(c,P,u,-2.4,0,6,.8,"#5a4028");post(c,P,u,2.4,0,6,.8,"#5a4028");line(c,P(u,-2.6,5.8),P(u,2.6,5.8),.8,"#5a4028");quad(c,P,[[u,-2,5.5],[u,2,5.5],[u,1.7,1.2],[u,-1.7,1.2]],["#a8784a","#8a5e34","#c9a06a"][i])})}
    for(const [u,w] of [[2,7],[8,8]])S.rd(u,w,2.4,.6,()=>{const q=P(u,w);c.fillStyle="#6a5a3a";c.strokeStyle=INK;c.lineWidth=.6;c.beginPath();c.ellipse(q[0],q[1],2.4,1.2,0,0,7);c.fill();c.stroke()});S.fim();break}
  case "brewery":{const a=ang+.34,P=Pf(x,y,a),S=cena(P),sg=lado(P,s);
    for(const [vu,vw] of FV===1?[[-13,1]]:FV===2?[[13,-2.5],[13,4]]:[[13,1]]){const vt=P(vu,vw),rr=FV===2?3:3.6;S.rd(vu,vw,rr,10,()=>{KR.drawRound(c,vt[0],vt[1],rr,7,3,{wall:"wood",roof:s.roof==="sandtop"?"terra":s.roof});smoke(c,vt[0],vt[1]-14)})}
    for(const u of[-7,-4])S.rd(u,sg*7.4,1,2.2,()=>{const q=P(u,sg*7.4);barrel(c,q[0],q[1],.9)});
    S.cx(0,0,20,11,8+6.05,()=>hall(c,x,y,20,11,8,s,{ang:a,exact:1})).face(0,sg,()=>door(c,P,2,sg*5.5,2.4,3.6));S.fim();break}
  case "sawmill":{const a=ang+.34,P0=Pf(x,y,a),P=FV===1?(u,w,h)=>P0(-u,w,h):P0,S=cena(P);
    S.cx(-5,-2,16,9,6+4.95,()=>hall(c,...P(-5,-2),16,9,6,s,{ang:a,exact:1,wall:"wood"}));if(FV===2)S.cx(9,-5,9,6,4.6,()=>{for(const [u,w] of porFundo(P,[[5,-7.5],[13,-7.5],[5,-2.5],[13,-2.5]]))post(c,P,u,w,0,4,.8,"#5a4028");quad(c,P,[[4,-8.5,4.6],[14,-8.5,4.6],[14,-1.5,3.8],[4,-1.5,3.8]],RF(s.roof==="sandtop"?"terra":s.roof)[1])});
    S.cx(9,5.4,10,7,6,()=>{const fr=S.vis(0,1)?1:-1;for(const [w,h] of[[3,0],[5.4,0],[7.8,0],[4.2,2],[6.6,2],[5.4,4]].sort((p,q)=>p[1]-q[1]||fr*(p[0]-q[0]))){const q=P(9,w,h);prism(c,q[0],q[1],10,2.2,2,a,["#a07a4a","#7a5a32"])}});S.fim();break}
  case "granary":{const a=ang+.34,P=Pf(x,y,a),S=cena(P),sg=lado(P,s);
    for(const u of[-13,13])S.rd(u,3,3.6,7,()=>{const q=P(u,3);c.fillStyle="#d8bf6a";c.strokeStyle=INK;c.lineWidth=.6;c.beginPath();c.ellipse(q[0],q[1],3.6,2.4,0,0,7);c.fill();c.stroke();c.beginPath();c.moveTo(q[0]-3.6,q[1]);c.quadraticCurveTo(q[0],q[1]-7,q[0]+3.6,q[1]);c.fill();c.stroke()});
    S.cx(0,0,20,12,8+7,()=>hall(c,x,y,20,12,8,s,{ang:a,exact:1,wall:"wood",R:7})).face(0,sg,()=>barnDoor(c,P,0,sg*6,6,5));S.fim();break}
  case "lighthouse":{if(REC){const P_=Pf(x,y,ang+0);dc(P_,"rd",0,0,3.7,36,42);}const P=Pf(x,y,ang+.34),fs=lado(P,s);shadow(c,x,y,6,3);cyl(c,x,y,6,4,["#b9b3a2","#77705f"]);cyl(c,x,y-4,4.4,28,["#f3efe3","#bcb6a6"],.72,[[6,10,"#a8352a"],[16,20,"#a8352a"]]);
    {const d=frR(P,s,5.9);c.fillStyle="#2b2418";c.fillRect(d[0]-1,d[1]-3.4,2,3.4);for(const h of[13,23]){const w=frR(P,s,3.6);c.fillRect(w[0]-.6,w[1]-h-1.8,1.2,1.8)}}
    glow(c,x,y-36,13,"rgba(255,220,120,.6)");cyl(c,x,y-32,2.8,4.6,["#f6d06a","#c99a3a"]);cone(c,x,y-36.6,3.6,5,ROOF.dark);break}
  case "shipwright":{const P=Pf(x,y,ang),S=cena(P);S.chao(()=>{quad(c,P,[[-2,-7,0],[30,-7,-2],[30,7,-2],[-2,7,0]],"#9a7446");c.strokeStyle="rgba(50,32,15,.55)";c.lineWidth=.5;c.beginPath();for(let u=0;u<30;u+=3){const a=P(u,-7,0),b=P(u,7,0);c.moveTo(a[0],a[1]);c.lineTo(b[0],b[1])}c.stroke()});
    S.cx(15,0,22,10,5,()=>{line(c,P(4,0,.6),P(26,0,.6),1.4,"#4a3524");for(let i=0;i<7;i++){const u=5+i*3.3,w=4.4*Math.sin((i+.6)/7.2*3.1416)+1,h=w*.9,a=P(u,-w,h),m=P(u,0,.4),b=P(u,w,h);c.strokeStyle="#6e4c2a";c.lineWidth=1.1;c.beginPath();c.moveTo(a[0],a[1]);c.quadraticCurveTo(m[0],m[1]+1,b[0],b[1]);c.stroke()}});
    S.cx(-13,0,16,10,6+5.5,()=>hall(c,...P(-13,0),16,10,6,s,{ang:ang+.34,exact:1,wall:"wood"}),{r:.34});S.cx(-4,9,1.6,1.6,1.6,()=>crate(c,...P(-4,9),.7));S.fim();break}
  case "fishery":{const a=ang+.34,P=Pf(x,y,a),S=cena(P);S.chao(()=>quad(c,P,[[-10,6,0],[-2,6,0],[-2,10,0],[-10,10,0]],"rgba(120,110,80,.35)"));
    S.cx(-7,0,12,8,6+4.4,()=>hall(c,...P(-7,0),12,8,6,s,{ang:a,exact:1,wall:"wood"}));
    for(let i=0;i<2;i++){const u=5+i*6;S.cx(u,0,.8,6.6,6.5,()=>{post(c,P,u,-3,0,6.5,.8,"#5a4028");post(c,P,u,3,0,6.5,.8,"#5a4028");line(c,P(u,-3.2,6.2),P(u,3.2,6.2),.8,"#5a4028");for(let k=0;k<3;k++){const q=P(u,-1.6+k*1.6,4.6);c.fillStyle="#b9c0c2";c.beginPath();c.ellipse(q[0],q[1],.5,1.5,0,0,7);c.fill()}})}
    S.rd(3,7,1,2,()=>barrel(c,...P(3,7),.7));S.fim();break}
  case "crane":{if(REC){const P_=Pf(x,y,ang+0.34);dc(P_,"cx",8,0,17,1,14,24.5);}const a=ang+.34,P=Pf(x,y,a),S=cena(P);
    S.cx(0,0,10,8,2.4,()=>prism(c,x,y,10,8,2.4,a,["#9a7446","#6e5030"]));
    S.rd(0,0,.8,24,()=>{post(c,P,0,0,2.4,24,1.4,"#4a3524");line(c,P(0,0,22),P(16,0,18),1.4,"#4a3524");line(c,P(0,0,14),P(16,0,18),.7,"#4a3524")},{z:2.4});
    S.rd(-3,2,3,6,()=>KR.drawRound(c,...P(-3,2),3,4,2,{wall:"wood",roof:"shingle"}),{z:2.4});
    S.cx(15,0,2,2,6,()=>{line(c,P(15,0,18),P(15,0,4),.5,"#3a2c1b");crate(c,...P(15,0,3),.8)});S.fim();break}
  case "ship":{const ty=ov&&ov.ship||(s.race==="pirata"?"pirata":s.race==="norte"?"drakkar":s.asian?"junco":s.race==="vapor"?"vapor":s.race==="deserto"||s.race==="indiano"?"dhow":["cog","caravela","galeao"][((v||.5)*3)|0]);shipV(c,x,y,ang,ty,.8+(v||.5)*.3);break}
  case "boat":boatV(c,x,y,ang,["remo","vela","canoa"][((v||.5)*3)|0]);break;
  case "cargo":{if(REC){const P_=Pf(x,y,ang+0);dc(P_,"rd",9,5.6,2.4,0,1);}const P=Pf(x,y,ang);for(const [u,w,k] of porFundo(P,[[-6,0,0],[-3,2.8,0],[0,0,1],[3,4.2,1],[6,1.4,0],[-5,-4.2,0]]))k?barrel(c,...P(u,w),.9):crate(c,...P(u,w),.9);const q=P(9,5.6);c.fillStyle="#d8c9a0";c.strokeStyle=INK;c.lineWidth=.5;c.beginPath();c.ellipse(q[0],q[1],2.4,1.4,0,0,7);c.fill();c.stroke();break}
  case "arena":{if(REC){const P_=Pf(x,y,ang+0);dc(P_,"rd",0,0,22,0,9);dc(P_,"rd",-20,0,.6,9,17);dc(P_,"rd",20,0,.6,9,17);}const P=Pf(x,y,ang),fs=lado(P,s);shadow(c,x,y,22,11);const rx=22,ry=22*TILT,h=8;c.fillStyle=K.mixc(wl[1],wl[0],.5);c.strokeStyle=INK;c.lineWidth=.8;c.beginPath();c.moveTo(x-rx,y-h);c.lineTo(x-rx,y);c.ellipse(x,y,rx,ry,0,3.1416,0,true);c.lineTo(x+rx,y-h);c.ellipse(x,y-h,rx,ry,0,0,3.1416);c.closePath();c.fill();c.stroke();
    c.fillStyle="#e6dcc0";c.beginPath();c.ellipse(x,y-h,rx,ry,0,0,7);c.fill();c.stroke();for(let k=1;k<4;k++){c.strokeStyle="rgba(60,50,35,.5)";c.lineWidth=.6;c.beginPath();c.ellipse(x,y-h+k*1.2,rx-k*3,ry-k*3*TILT,0,0,7);c.stroke()}c.fillStyle="#d8bf8a";c.beginPath();c.ellipse(x,y-h+5,rx-12,ry-12*TILT,0,0,7);c.fill();c.stroke();
    // arcos da volta toda (so os do lado de quem olha aparecem); portao maior na frente
    c.fillStyle="#3a2c1b";for(let i=0;i<18;i++){const t=i/18*6.2832+.17,q=P(Math.cos(t)*rx,Math.sin(t)*rx,0);if(q[1]<y+ry*.12)continue;c.fillRect(q[0]-.7,q[1]-h*.65,1.4,3.6)}
    {const g=frR(P,s,rx);if(g[1]>y+ry*.3){c.fillStyle="#241b12";c.beginPath();c.moveTo(g[0]-2,g[1]);c.lineTo(g[0]-2,g[1]-4);c.quadraticCurveTo(g[0],g[1]-6.4,g[0]+2,g[1]-4);c.lineTo(g[0]+2,g[1]);c.fill()}}
    for(const [u] of porFundo(P,[[-rx+2,0],[rx-2,0]])){const f=P(u,0,h+1);flag(c,f[0],f[1],8,cr)}break}
  case "theater":{// teatro em meia-lua: a arquibancada e fatiada em setores, cada setor desenhado de tras para frente, com so as faces que olham para quem ve
    const a=ang+.34,P=Pf(x,y,a),S=cena(P),W=WL(s.flat?s.wall:"stone"),cv=-1,R=17,NT=5,TH=1.5,TOP=NT*TH+1.4,NS=14;shadow(c,x,y,17,8);c.lineWidth=.6;
    const pt=(r,t,h)=>P(Math.cos(t)*r,cv+Math.sin(t)*r,h),arc=(r,h,t0,t1,n)=>{const o=[];for(let k=0;k<=n;k++)o.push(pt(r,t0+(t1-t0)*k/n,h));return o};
    S.chao(()=>poly(c,arc(6,0,Math.PI,2*Math.PI,14),"#d8bf8a",INK));
    for(let k=0;k<NS;k++){const t0=Math.PI+Math.PI*k/NS,t1=Math.PI+Math.PI*(k+1)/NS,tm=(t0+t1)/2,cu=Math.cos(tm),sv=Math.sin(tm),fo=q=>{const t=Math.PI+Math.PI*(q+.5)/NS;return S.vis(Math.cos(t),Math.sin(t))},fora=fo(k);
      S.cx(cu*12,cv+sv*12,R+1.6-6,R*Math.PI/NS,TOP,()=>{const lit=clamp(.5+.62*(-(Math.cos(a)*cu-Math.sin(a)*sv)*.85+(Math.sin(a)*cu+Math.cos(a)*sv)*.3),0,1),
          tiers=()=>{for(let j=NT-1;j>=0;j--){const r0=6+j*(R-6)/NT,r1=6+(j+1)*(R-6)/NT,h=(j+1)*TH;poly(c,[pt(r0,t0,h),pt(r0,t1,h),pt(r1,t1,h),pt(r1,t0,h)],j%2?"#ddd2b6":"#d0c4a4",null);if(!fora)poly(c,[pt(r0,t0,h),pt(r0,t1,h),pt(r0,t1,h-TH),pt(r0,t0,h-TH)],"#a89c80",null)}
            c.strokeStyle="rgba(60,48,30,.35)";c.lineWidth=.4;c.beginPath();for(let j=0;j<=NT;j++){const r=6+j*(R-6)/NT,p=pt(r,t0,Math.max(TH,j*TH)),q=pt(r,t1,Math.max(TH,j*TH));c.moveTo(p[0],p[1]);c.lineTo(q[0],q[1])}c.stroke()},
          liso=(pts,col)=>{c.lineWidth=.5;poly(c,pts,col,col)},
          rim=()=>{liso([pt(R,t0,TOP),pt(R,t1,TOP),pt(R+1.6,t1,TOP),pt(R+1.6,t0,TOP)],K.mixc(W[0],"#ffffff",.2));line(c,pt(R,t0,TOP),pt(R,t1,TOP),.6,INK);line(c,pt(R+1.6,t0,TOP),pt(R+1.6,t1,TOP),.6,INK)},
          muro=()=>{liso([pt(R+1.6,t0,0),pt(R+1.6,t1,0),pt(R+1.6,t1,TOP),pt(R+1.6,t0,TOP)],K.mixc(W[1],W[0],lit));line(c,pt(R+1.6,t0,0),pt(R+1.6,t1,0),.7,INK);if(k===0||!fo(k-1))line(c,pt(R+1.6,t0,0),pt(R+1.6,t0,TOP),.7,INK);if(k===NS-1||!fo(k+1))line(c,pt(R+1.6,t1,0),pt(R+1.6,t1,TOP),.7,INK)},
          dentro=()=>{liso([pt(R,t0,NT*TH),pt(R,t1,NT*TH),pt(R,t1,TOP),pt(R,t0,TOP)],K.mixc(W[1],W[0],.35))};
        if(fora){tiers();muro();rim()}else{dentro();rim();tiers()}
        if(k===0||k===NS-1){const tt=k?2*Math.PI:Math.PI,fq=pt(R,tt,TOP);if(S.vis(0,1)){c.lineWidth=.6;poly(c,[pt(6,tt,0),pt(R+1.6,tt,0),pt(R+1.6,tt,TOP),pt(R,tt,TOP),pt(R,tt,NT*TH),pt(6,tt,TH)],K.mixc(W[1],W[0],.6),INK)}flag(c,fq[0],fq[1],8,cr)}},{r:tm})}
    S.cx(0,cv+3.2,20,5,7,()=>{const st=P(0,cv+3.2);prism(c,st[0],st[1],20,5,1.8,a,["#a07a4a","#6e5030"],"#b48a56");for(const u of[-8,8])post(c,P,u,cv+5,1.8,7,.9,"#efe9dc");c.lineWidth=.7;quad(c,P,[[-9,cv+1,7],[9,cv+1,7],[9,cv+5.6,6.2],[-9,cv+5.6,6.2]],cr)});S.fim();break}
  case "baths":{const a=ang+.34,P=Pf(x,y,a),S=cena(P),W=WL(s.flat?s.wall:"stone");shadow(c,x,y,15,6);
    S.chao(()=>{quad(c,P,[[6,-4,0],[16,-4,0],[16,8,0],[6,8,0]],"#d6d0c0");quad(c,P,[[7.5,-2.5,0],[14.5,-2.5,0],[14.5,6.5,0],[7.5,6.5,0]],"#7fb0c0");c.strokeStyle="rgba(240,250,250,.7)";c.lineWidth=.5;c.beginPath();for(let w=-1;w<6;w+=2.4){const p=P(8.5,w,0),q=P(13,w+.6,0);c.moveTo(p[0],p[1]);c.lineTo(q[0],q[1])}c.stroke()});
    S.cx(-4,-2,18,14,7,()=>{const b=P(-4,-2);prism(c,b[0],b[1],18,14,7,a,W);const t=P(-4,-2,7);dome(c,t[0],t[1],6,s.flat?ROOF.gold:ROOF.copper)});
    for(const [u,w] of[[6.4,-3.6],[15.6,-3.6],[15.6,7.6],[6.4,7.6],[11,-3.6],[11,7.6]])S.rd(u,w,.5,5,()=>post(c,P,u,w,0,5,.9,"#efe9dc"));
    S.rd(11,2,1.2,10,()=>{if(!SEMFX&&!REC)for(let i=0;i<3;i++){const q=P(11,2,4+i*3);c.fillStyle="rgba(240,240,240,.45)";c.beginPath();c.arc(q[0]+i,q[1]-i*1.4,1.4+i*.5,0,7);c.fill()}});S.fim();break}
  case "garden":{if(REC){const P_=Pf(x,y,ang+0);dc(P_,"ch",0,0,16);dc(P_,"rd",-8,-8,2.4,0,5);dc(P_,"rd",8,-8,2.4,0,5);dc(P_,"rd",-8,8,2.4,0,5);dc(P_,"rd",8,8,2.4,0,5);}const P=Pf(x,y,ang),R=16;c.fillStyle="#a3b262";c.strokeStyle="rgba(70,60,25,.5)";c.lineWidth=.7;c.beginPath();c.ellipse(x,y,R,R*TILT,0,0,7);c.fill();c.stroke();c.strokeStyle="#d8cdb0";c.lineWidth=1.6;c.beginPath();for(const [a,b] of[[P(-R,0),P(R,0)],[P(0,-R),P(0,R)]]){c.moveTo(a[0],a[1]);c.lineTo(b[0],b[1])}c.stroke();
    const it=porFundo(P,[[-8,-8,1],[8,-8,1],[-8,8,1],[8,8,1],[0,0,0]]);c.strokeStyle="rgba(70,60,25,.5)";c.lineWidth=.7;for(const [u,w,k] of it){if(k){const q=P(u,w);c.fillStyle="#5d7737";c.beginPath();c.arc(q[0],q[1]-2,2.4,0,7);c.fill();c.stroke()}else KR.drawRound(c,x,y,4.6,4,3.4,{wall:"white",roof:"copper"})}break}
  case "wizard":{if(REC){const P_=Pf(x,y,ang+0);dc(P_,"rd",0,0,6,26,48);dc(P_,"rd",8,0,2,40,48);}const P=Pf(x,y,ang),hq=P(-8,4.3),hut=()=>KR.drawRound(c,hq[0],hq[1],4.4,4.6,3.6,{wall:s.wall==="felt"?"stone":s.wall,roof:"arcane"}),bk=hq[1]<y;shadow(c,x,y,8,4);if(bk)hut();
    cyl(c,x,y,4.6,28,["#d9d2e6","#8f86a6"],.8);const ry=6*TILT;c.fillStyle="#9a92b0";c.strokeStyle=INK;c.lineWidth=.8;c.beginPath();c.ellipse(x,y-28,6,ry,0,0,7);c.fill();c.stroke();cyl(c,x,y-28,3.8,3,["#d9d2e6","#8f86a6"]);cone(c,x,y-31,5.2,17,ROOF.arcane);
    {const w0=frR(P,s,4);c.fillStyle="#f6e08a";for(const h of[8,16,23])c.fillRect(w0[0]-.8,y-h-2,1.6,2.4);c.fillStyle="#2b2418";c.fillRect(w0[0]-1.1,w0[1]-3.6,2.2,3.6)}if(!bk)hut();
    const g=P(8,0,44);glow(c,g[0],g[1],8,"rgba(160,120,255,.55)");poly(c,[[g[0],g[1]-4],[g[0]+2,g[1]],[g[0],g[1]+4],[g[0]-2,g[1]]],"#c9b0ff","#4a3a7a");for(let i=0;i<5;i++){const a=i*1.26+v*6+ang;c.fillStyle="rgba(200,180,255,.8)";c.beginPath();c.arc(x+Math.cos(a)*9,y-20+Math.sin(a)*2.6,.7,0,7);c.fill()}break}
  case "arcane":{if(REC){const P_=Pf(x,y,ang+0);dc(P_,"ch",0,0,12);dc(P_,"rd",0,0,2,6,15);}glow(c,x,y,15,"rgba(150,110,240,.35)");c.strokeStyle="rgba(150,110,240,.9)";c.lineWidth=1;c.beginPath();c.ellipse(x,y,12,12*TILT,0,0,7);c.stroke();c.beginPath();c.ellipse(x,y,8,8*TILT,0,0,7);c.stroke();c.beginPath();for(let i=0;i<5;i++){const a=i*2.513-1.57+ang,b=(i+2)*2.513-1.57+ang;c.moveTo(x+Math.cos(a)*8,y+Math.sin(a)*8*TILT);c.lineTo(x+Math.cos(b)*8,y+Math.sin(b)*8*TILT)}c.stroke();
    const st=[];for(let i=0;i<6;i++){const a=i/6*6.28+ang;st.push([x+Math.cos(a)*14,y+Math.sin(a)*14*TILT])}st.sort((p,q)=>p[1]-q[1]);for(const [px,py] of st)prism(c,px,py,2.6,2.2,6.5,ang+.5,["#a9a3b8","#6f6a7c"]);glow(c,x,y-10,6,"rgba(200,170,255,.8)");poly(c,[[x,y-15],[x+2,y-10],[x,y-6],[x-2,y-10]],"#d8c4ff","#4a3a7a");break}
  case "portal":{if(REC){const P_=Pf(x,y,ang+0.5);dc(P_,"cx",0,0,18,3.2,15,24);dc(P_,"cx",0,0,12,.6,0,22);}const a=ang+.5,P=Pf(x,y,a);shadow(c,x,y,11,4);const arc=(b,r)=>{const pts=[];for(let k=0;k<=12;k++){const t=k/12*3.1416;pts.push(P(-Math.cos(t)*r,b,16+Math.sin(t)*r*.9))}return pts};
    const g=c.createRadialGradient(x,y-12,1,x,y-12,9);g.addColorStop(0,"#f2e6ff");g.addColorStop(.5,"#9a6af0");g.addColorStop(1,"#3a2a6a");const inner=[P(-6,0,0),...arc(0,6),P(6,0,0)];poly(c,inner,g,null);
    for(const [u] of porFundo(P,[[-7.5,0],[7.5,0]]))prism(c,...P(u,0),3,3,16,a,["#a9a3b8","#6f6a7c"]);const nv=P(0,1)[1]>=P(0,0)[1]?1:-1,o=arc(-1.4*nv,7.5),o2=arc(1.4*nv,7.5);c.lineWidth=3.2;c.strokeStyle=INK;for(const ar of[o,o2]){c.beginPath();ar.forEach((q,i)=>i?c.lineTo(q[0],q[1]):c.moveTo(q[0],q[1]));c.stroke()}c.lineWidth=2;c.strokeStyle="#a9a3b8";c.beginPath();o2.forEach((q,i)=>i?c.lineTo(q[0],q[1]):c.moveTo(q[0],q[1]));c.stroke();
    glow(c,x,y-11,14,"rgba(150,110,240,.3)");break}
  case "eldertree":{if(REC){const P_=Pf(x,y,ang+0);dc(P_,"rd",0,0,6,0,20);dc(P_,"rd",0,0,11,0,1);dc(P_,"rd",0,0,15,14,50);}const ca=Math.cos(ang),sa=Math.sin(ang);shadow(c,x,y,14,6);c.fillStyle="#5a3d22";c.strokeStyle=INK;c.lineWidth=.9;c.beginPath();c.moveTo(x-6,y);c.quadraticCurveTo(x-3,y-10,x-2.4,y-20);c.lineTo(x+2.4,y-20);c.quadraticCurveTo(x+3,y-10,x+6,y);c.closePath();c.fill();c.stroke();for(let k=0;k<4;k++){const t=ang+.4+k*1.5708,ex=Math.cos(t),ey=Math.sin(t)*TILT;c.beginPath();c.moveTo(x+ex*4,y+ey*2);c.quadraticCurveTo(x+ex*9,y+ey*8+.5,x+ex*12,y+ey*12);c.stroke()}
    // copa: os galhos giram em volta do tronco (cada um tem sua profundidade)
    const lob=[[0,-30,13,0],[-10,-24,9,4],[10,-25,9,-4],[-6,-36,8,-5],[7,-36,8,5],[0,-42,7,0]].map(([dx,dy,r,dz])=>[dx*ca-dz*sa,dy+(dx*sa+dz*ca)*.18,r,dx*sa+dz*ca]).sort((p,q)=>p[3]-q[3]);for(const [dx,dy,r] of lob){c.fillStyle="#2f4a26";c.beginPath();c.arc(x+dx,y+dy,r+1,0,7);c.fill()}for(const [dx,dy,r] of lob){const g=c.createRadialGradient(x+dx-r*.4,y+dy-r*.4,1,x+dx,y+dy,r);g.addColorStop(0,"#9ac06a");g.addColorStop(1,"#4a7a3a");c.fillStyle=g;c.beginPath();c.arc(x+dx,y+dy,r,0,7);c.fill()}
    c.fillStyle="#f6e9a0";for(let i=0;i<12;i++){c.beginPath();c.arc(x+Math.cos(i*2.1+ang)*11,y-30+Math.sin(i*1.7)*10,.8,0,7);c.fill()}break}
  case "dragonstatue":{if(REC){const P_=Pf(x,y,ang+0.34);dc(P_,"rd",0,0,7,4,22);dc(P_,"rd",0,0,15,8,25);}const sd=Math.cos(ang+.34)>=0?1:-1,X=d=>x+d*sd;prism(c,x,y,12,10,4,ang+.34,WALL.stone);c.fillStyle="#7a8a80";c.strokeStyle=INK;c.lineWidth=.8;c.beginPath();c.moveTo(X(-5),y-5);c.quadraticCurveTo(X(-6),y-12,X(-2),y-14);c.quadraticCurveTo(X(2),y-20,X(5),y-21);c.lineTo(X(7),y-19);c.lineTo(X(4),y-17);c.quadraticCurveTo(X(3),y-12,X(4),y-5);c.closePath();c.fill();c.stroke();
    c.fillStyle="#5f6e66";c.beginPath();c.moveTo(X(-2),y-13);c.lineTo(X(-12),y-22);c.lineTo(X(-10),y-15);c.lineTo(X(-14),y-14);c.lineTo(X(-4),y-9);c.closePath();c.fill();c.stroke();c.fillStyle="#6c7c73";c.beginPath();c.moveTo(X(2),y-12);c.lineTo(X(11),y-24);c.lineTo(X(10),y-16);c.lineTo(X(14),y-15);c.lineTo(X(4),y-8);c.closePath();c.fill();c.stroke();c.fillStyle="#e86a2a";c.beginPath();c.arc(X(5.4),y-20.4,.6,0,7);c.fill();break}
  case "crystal":{if(REC){const P_=Pf(x,y,ang+0);dc(P_,"rd",0,0,5,8,28);dc(P_,"rd",0,0,10,10,18);}shadow(c,x,y,6,2.4);glow(c,x,y-16,14,"rgba(120,200,255,.45)");poly(c,[[x,y-28],[x+5,y-18],[x,y-8],[x-5,y-18]],"#a8e0ff","#2a5a7a");poly(c,[[x,y-28],[x+5,y-18],[x,y-8]],"#6ab8e8","#2a5a7a");for(let i=0;i<4;i++){const a=i*1.57+v*3+ang;poly(c,[[x+Math.cos(a)*9,y-14+Math.sin(a)*3-2],[x+Math.cos(a)*9+1,y-14+Math.sin(a)*3],[x+Math.cos(a)*9,y-14+Math.sin(a)*3+2],[x+Math.cos(a)*9-1,y-14+Math.sin(a)*3]],"#c8f0ff","#2a5a7a")}break}
  case "golem":{const a=ang+.5,P=Pf(x,y,a),st=["#a9a49a","#76726a"],fr=P(0,1)[1]>=P(0,0)[1],bx=(u,w,z,L,D,H)=>{const q=P(u,w,z);prism(c,q[0],q[1],L,D,H,a,st)},arms=porFundo(P,[[-7,0,6.5],[7,0,5]]);shadow(c,x,y,7,3);
    bx(arms[0][0],0,arms[0][2],2.6,2.6,8);for(const [u] of porFundo(P,[[-2.4,0],[2.4,0]]))bx(u,0,0,2.4,2.4,6);bx(0,0,6,10,5,9);bx(0,0,15.5,4.6,4,4.4);bx(arms[1][0],0,arms[1][2],2.6,2.6,8);
    if(fr){c.fillStyle="#7af0e0";for(const u of[-1.1,1.1]){const e=P(u,2.05,17.8);c.fillRect(e[0]-.5,e[1]-.5,1,1)}const r=P(0,2.55,11);c.fillRect(r[0]-.6,r[1]-1,1.2,2)}break}
  case "statue":{if(REC){const P_=Pf(x,y,ang+0.34);dc(P_,"rd",0,0,2.2,4,17);dc(P_,"cx",2.5,0,3,1,11,18);}const sd=Math.cos(ang+.34)>=0?1:-1;prism(c,x,y,6,6,4,ang+.34,WALL.stone);const g=c.createLinearGradient(x-2,0,x+2,0);g.addColorStop(0,"#b4bdb4");g.addColorStop(1,"#77837a");c.fillStyle=g;c.strokeStyle=INK;c.lineWidth=.7;c.beginPath();c.moveTo(x-1.6,y-5);c.lineTo(x-2,y-12);c.lineTo(x-1,y-14);c.lineTo(x+1,y-14);c.lineTo(x+2,y-12);c.lineTo(x+1.6,y-5);c.closePath();c.fill();c.stroke();c.beginPath();c.arc(x,y-15.2,1.4,0,7);c.fill();c.stroke();line(c,[x+1.8*sd,y-12],[x+4*sd,y-17],.9,"#6a766e");break}
  case "fountain":{if(REC){const P_=Pf(x,y,ang+0);dc(P_,"rd",0,0,8,0,2.6);dc(P_,"rd",0,0,3.2,0,12);}const P=Pf(x,y,ang);shadow(c,x,y,9,4);const rx=8,ry=8*TILT;c.fillStyle="#b9b3a2";c.strokeStyle=INK;c.lineWidth=.8;c.beginPath();c.moveTo(x-rx,y-2.4);c.lineTo(x-rx,y);c.ellipse(x,y,rx,ry,0,3.1416,0,true);c.lineTo(x+rx,y-2.4);c.ellipse(x,y-2.4,rx,ry,0,0,3.1416);c.closePath();c.fill();c.stroke();c.fillStyle="#d6d0c0";c.beginPath();c.ellipse(x,y-2.4,rx,ry,0,0,7);c.fill();c.stroke();c.fillStyle="#6a9fb2";c.beginPath();c.ellipse(x,y-2.2,rx-1.6,ry-1.2,0,0,7);c.fill();
    const jet=u=>{const e=P(u,0,3.4),m=P(u*.65,0,12);c.strokeStyle="rgba(220,240,250,.85)";c.lineWidth=.6;c.beginPath();c.moveTo(x,y-10.5);c.quadraticCurveTo(m[0],m[1],e[0],e[1]);c.stroke()},js=porFundo(P,[[-4.6,0],[4.6,0]]);jet(js[0][0]);
    c.fillStyle="#c9c2ae";c.strokeStyle=INK;c.lineWidth=.8;c.fillRect(x-1,y-9,2,7);c.strokeRect(x-1,y-9,2,7);c.beginPath();c.ellipse(x,y-9,3.2,1.4,0,0,7);c.fill();c.stroke();jet(js[1][0]);break}
  case "well":{if(REC){const P_=Pf(x,y,ang+0.34);dc(P_,"rd",0,0,3.6,0,2.6);dc(P_,"cx",0,0,9,5,8.4,11.8);}const P=Pf(x,y,ang+.34);c.fillStyle="#9a9484";c.strokeStyle=INK;c.lineWidth=.8;c.beginPath();c.moveTo(x-3.6,y-2.6);c.lineTo(x-3.6,y);c.ellipse(x,y,3.6,2.2,0,3.1416,0,true);c.lineTo(x+3.6,y-2.6);c.ellipse(x,y-2.6,3.6,2.2,0,0,3.1416);c.closePath();c.fill();c.stroke();c.fillStyle="#4e6067";c.beginPath();c.ellipse(x,y-2.6,2.4,1.3,0,0,7);c.fill();
    for(const [u] of porFundo(P,[[-3,0],[3,0]]))post(c,P,u,0,2.4,9,.9,"#5a4028");const fs=lado(P,null),sl=sg=>[P(-4.4,0,11.6),P(4.4,0,11.6),P(4.4,sg*2.4,8.4),P(-4.4,sg*2.4,8.4)];c.lineWidth=.7;poly(c,sl(-fs),rf[1]||rf[0],INK);poly(c,sl(fs),rf[0],INK);break}
  case "gallows":{if(REC){const P_=Pf(x,y,ang+0.5);dc(P_,"cx",0,0,10.4,.9,16,18);}const a=ang+.5,P=Pf(x,y,a);prism(c,x,y,12,8,3,a,["#9a7446","#6e5030"]);post(c,P,-4,0,3,17,1.3,"#4a3524");post(c,P,4,0,3,17,1.3,"#4a3524");line(c,P(-5,0,17),P(5,0,17),1.4,"#4a3524");line(c,P(1,0,17),P(1,0,12),.5,"#3a2c1b");const r=P(1,0,11.2);c.strokeStyle="#3a2c1b";c.lineWidth=.5;c.beginPath();c.arc(r[0],r[1],.9,0,7);c.stroke();break}
  case "cart":cart(c,x,y,ang||.3,v<.5?"hay":"crates",false);break;
  case "wagon":cart(c,x,y,ang||.3,"horse",true);break;
  case "crates":{const P=Pf(x,y,ang);for(const [u,w,k] of porFundo(P,[[-2,-3.7,0],[-4,0,0],[2,0,1],[-1,2.8,0],[5,2.8,1]]))k?barrel(c,...P(u,w),.9):crate(c,...P(u,w),.9);break}
  case "haystack":{if(REC){const P_=Pf(x,y,ang+0);dc(P_,"rd",0,0,6,0,10);}shadow(c,x,y,6,2.4);c.fillStyle="#d8bf6a";c.strokeStyle=INK;c.lineWidth=.7;c.beginPath();c.moveTo(x-6,y);c.quadraticCurveTo(x-6,y-9,x,y-10);c.quadraticCurveTo(x+6,y-9,x+6,y);c.ellipse(x,y,6,2.4,0,0,3.1416);c.closePath();c.fill();c.stroke();c.strokeStyle="rgba(120,90,30,.6)";c.lineWidth=.5;c.beginPath();for(let k=1;k<4;k++){c.moveTo(x-6+k*.6,y-k*2.2);c.quadraticCurveTo(x,y-k*2.2-1,x+6-k*.6,y-k*2.2)}c.stroke();break}
  case "lamp":{if(REC){const P_=Pf(x,y,ang+0);dc(P_,"cx",1.1,0,3.4,1.6,8,11.4);}const P=Pf(x,y,ang),t=P(2.2,0,11),l=P(2.2,0,8.4),bk=t[1]<y-11;const lant=()=>{glow(c,l[0],l[1]-1.2,5,"rgba(255,210,120,.6)");prism(c,l[0],l[1],1.6,1.6,2.2,ang+.6,["#f6d06a","#c99a3a"])};if(bk){line(c,[x,y-11],t,.9,"#2a2420");lant()}post(c,P,0,0,0,11,.9,"#2a2420");if(!bk){line(c,[x,y-11],t,.9,"#2a2420");lant()}break}
  case "bench":{const P=Pf(x,y,ang);for(const u of[-3,3])for(const w of[-.8,.8])post(c,P,u,w,0,1.4,.5,"#5a4028");quad(c,P,[[-3.6,-1.1,1.4],[3.6,-1.1,1.4],[3.6,1.1,1.4],[-3.6,1.1,1.4]],"#a07a4a");quad(c,P,[[-3.6,-1.1,1.4],[3.6,-1.1,1.4],[3.6,-1.1,3.6],[-3.6,-1.1,3.6]],"#8a6440");break}
  case "scarecrow":{if(REC){const P_=Pf(x,y,ang+0);dc(P_,"rd",0,0,1.6,0,12);dc(P_,"cx",0,0,8,1,2.6,7);}const P=Pf(x,y,ang),A=(u,h)=>P(u,0,h);post(c,P,0,0,0,9,.9,"#5a4028");line(c,A(-4,6.4),A(4,6.4),.9,"#5a4028");poly(c,[A(-2,6.6),A(2,6.6),A(2.4,2.6),A(-2.4,2.6)],"#8a5a3a",INK);c.fillStyle="#d8bf6a";c.strokeStyle=INK;c.lineWidth=.6;c.beginPath();c.arc(x,y-8.4,1.6,0,7);c.fill();c.stroke();poly(c,[[x-2.6,y-9.4],[x+2.6,y-9.4],[x,y-12]],"#5a4028",INK);break}
  case "flowerbed":{const r=6;shadow(c,x,y,r,r*TILT*.6);cyl(c,x,y,r,1.2,["#c9c2b0","#8f897a"]);c.fillStyle="#5f7e35";c.beginPath();c.ellipse(x,y-1.2,r-.8,(r-.8)*TILT,0,0,7);c.fill();const FL=["#c25a6a","#e8d27a","#efe6cb","#8a4a9a","#e07a3a"];for(let i=0;i<34;i++){const a=i*2.399+ang,d=Math.sqrt((i+.5)/34)*(r-1.4);c.fillStyle=FL[i%5];c.beginPath();c.arc(x+Math.cos(a)*d,y-1.6+Math.sin(a)*d*TILT,.55,0,7);c.fill()}break}
  case "mansion":{const a=ang+.34,P=Pf(x,y,a),S=cena(P),odd=s.flat||s.asian,pr=odd?s.roof:(v<.33?"slate":v<.66?"blue":"teal"),wl=odd?s.wall:(v<.5?"stone":"white");
    shadow(c,x,y,18,7);S.chao(()=>{quad(c,P,[[-18,-13,0],[18,-13,0],[18,17,0],[-18,17,0]],"#a3b262");quad(c,P,[[-1.8,-1,0],[1.8,-1,0],[1.8,17,0],[-1.8,17,0]],"#e6dcc0");quad(c,P,[[-8,6.4,0],[8,6.4,0],[8,9.6,0],[-8,9.6,0]],"#e6dcc0");
      for(const sx of[-1,1])for(const sy of[0,1]){const u0=sx*3,u1=sx*12.5,v0=sy?10.6:1,v1=sy?16:5.6;quad(c,P,[[u0,v0,0],[u1,v0,0],[u1,v1,0],[u0,v1,0]],"#7f9c4a");const m=P((u0+u1)/2,(v0+v1)/2);c.fillStyle=sy?"#c25a6a":"#e8d27a";c.beginPath();c.ellipse(m[0],m[1],2.4,1.2,0,0,7);c.fill()}});
    for(const u of[-16,16])for(const w of[-9,-3])S.rd(u,w,1.6,5,()=>{const q=P(u,w);c.fillStyle="#4f6f2e";c.strokeStyle=INK;c.lineWidth=.5;c.beginPath();c.ellipse(q[0],q[1]-2.4,1.6,2.6,0,0,7);c.fill();c.stroke()});
    S.cx(0,-8,27,8,9.5+4.4,()=>hall(c,...P(0,-8),27,8,9.5,s,{ang:a,exact:1,roof:pr,wall:wl}));
    S.cx(0,-3.2,7,5,12+3.4,()=>hall(c,...P(0,-3.2),7,5,12,s,{ang:a+1.5708,exact:1,roof:pr,wall:wl,R:3.4}),{r:1.5708});
    for(const sd of[-1,1])S.cx(sd*11.5,1.2,12,6.4,8+3.52,()=>hall(c,...P(sd*11.5,1.2),12,6.4,8,s,{ang:a+1.5708,exact:1,roof:pr,wall:wl}),{r:1.5708});
    for(const sd of[-1,1])S.rd(sd*11.5,8,2.8,13.5+6.4,()=>tower(c,...P(sd*11.5,8),2.8,13.5,s,{roof:pr,wall:wl,rh:6.4}));
    S.rd(0,8,2.6,3.2,()=>{const f=P(0,8);cyl(c,f[0],f[1],2.6,.9,["#c9c2b0","#8f897a"]);c.fillStyle="#6a9fb2";c.beginPath();c.ellipse(f[0],f[1]-.9,2,.9,0,0,7);c.fill();line(c,[f[0],f[1]-.9],[f[0],f[1]-3.2],.6,"#c9c2b0")});
    S.cx(0,17,36,.5,3.6,()=>{c.strokeStyle="#2b2b2b";c.lineWidth=.5;c.beginPath();for(let u=-18;u<=18.1;u+=1.6){if(Math.abs(u)<2.6)continue;const p=P(u,17,0),q=P(u,17,2.4);c.moveTo(p[0],p[1]);c.lineTo(q[0],q[1])}{const a1=P(-18,17,2),b1=P(-2.6,17,2),a2=P(2.6,17,2),b2=P(18,17,2);c.moveTo(a1[0],a1[1]);c.lineTo(b1[0],b1[1]);c.moveTo(a2[0],a2[1]);c.lineTo(b2[0],b2[1])}c.stroke();
      for(const sd of[-1,1]){const q=P(sd*2.8,17);prism(c,q[0],q[1],1.4,1.4,3.6,a,WL(wl))}});S.fim();break}
  case "trainingyard":{const a=ang+.34,P=Pf(x,y,a),S=cena(P);S.chao(()=>{quad(c,P,[[-12,-8,0],[12,-8,0],[12,8,0],[-12,8,0]],"#c9b98c");c.strokeStyle="rgba(90,70,40,.35)";c.lineWidth=.5;c.beginPath();for(let i=0;i<12;i++){const p=P(-11+((i*7)%22),-7+((i*5)%14),0);c.moveTo(p[0]-1,p[1]);c.lineTo(p[0]+1,p[1])}c.stroke()});
    const fen=(u0,w0,u1,w1)=>S.cx((u0+u1)/2,(w0+w1)/2,Math.abs(u1-u0)+.3,Math.abs(w1-w0)+.3,2.4,()=>{const n=Math.max(2,Math.round(Math.hypot(u1-u0,w1-w0)/3));c.strokeStyle="#5a4028";c.lineWidth=.7;c.beginPath();for(let k=0;k<=n;k++){const t=k/n,p=P(u0+(u1-u0)*t,w0+(w1-w0)*t,0),q=P(u0+(u1-u0)*t,w0+(w1-w0)*t,2.4);c.moveTo(p[0],p[1]);c.lineTo(q[0],q[1])}for(const h of[1.2,2.2]){const p=P(u0,w0,h),q=P(u1,w1,h);c.moveTo(p[0],p[1]);c.lineTo(q[0],q[1])}c.stroke()});
    fen(-12,-8,12,-8);fen(-12,-8,-12,8);fen(12,-8,12,8);fen(-12,8,12,8);
    for(const [u,w] of[[-7,-3],[-2,-3],[3,-3]])S.rd(u,w,1.4,7,()=>{const p=P(u,w,0);post(c,P,u,w,0,5,.8,"#7a5432");c.fillStyle="#c9a96a";c.strokeStyle=INK;c.lineWidth=.5;c.beginPath();c.ellipse(p[0],p[1]-5.6,1.4,1.6,0,0,7);c.fill();c.stroke();line(c,[p[0]-2.4,p[1]-4],[p[0]+2.4,p[1]-4],.8,"#7a5432")});
    for(const u of[6,9.5])S.rd(u,-4,1.2,6,()=>{const p=P(u,-4,0);post(c,P,u,-4,0,2.4,.6,"#5a4028");c.fillStyle="#efe6cb";c.strokeStyle=INK;c.lineWidth=.5;c.beginPath();c.ellipse(p[0],p[1]-4,2,2,0,0,7);c.fill();c.stroke();c.fillStyle="#a8352a";c.beginPath();c.ellipse(p[0],p[1]-4,1.1,1.1,0,0,7);c.fill();c.fillStyle="#efe6cb";c.beginPath();c.ellipse(p[0],p[1]-4,.4,.4,0,0,7);c.fill()});
    S.cx(-8,4,6,1.2,5,()=>{const r=P(-8,4,0);prism(c,r[0],r[1],6,1.2,.6,a,["#8a6440","#5e4026"]);for(let i=0;i<4;i++){const q=P(-10.4+i*1.6,4,.6);line(c,q,[q[0]+.6,q[1]-4.4],.6,"#9a958a")}});
    S.rd(11,7,.5,9,()=>flag(c,...P(11,7,0),9,cr));S.fim();break}
  case "castle":{fortress(c,x,y,ang+.34,1,race,v,false);break}
  case "ruinhouse":{if(REC){const P_=Pf(x,y,ang+0);dc(P_,"cx",0,0,12.4,9.4,0,5.6);}const P=Pf(x,y,ang),W=WL(s.flat?s.wall:v<.5?"stone":"daub"),L=12,D=9,hl=L/2,hd=D/2,hs=[5.5,2.5,4.4,1.6,5,3.2,1.2,4],jag=(u0,v0,u1,v1,k)=>{const n=5,top=[];for(let i=0;i<=n;i++){const t=i/n,h=Math.max(.6,hs[(k+i)%8]*(.6+.5*Math.sin(i*1.7+k)));top.push(P(u0+(u1-u0)*t,v0+(v1-v0)*t,h))}return [P(u0,v0,0)].concat(top).concat([P(u1,v1,0)])};
    shadow(c,x,y,8,3.4);quad(c,P,[[-hl,-hd,0],[hl,-hd,0],[hl,hd,0],[-hl,hd,0]],"#8f8a6a");c.fillStyle="#7a6a4a";for(let i=0;i<7;i++){const q=P(-hl+1+((i*37)%10),-hd+1+((i*53)%7),0);c.beginPath();c.ellipse(q[0],q[1],1.2,.6,0,0,7);c.fill()}
    const walls=[[-hl,-hd,hl,-hd,0],[-hl,hd,-hl,-hd,2],[hl,-hd,hl,hd,4],[hl,hd,-hl,hd,6]].map(w=>({w,y:P((w[0]+w[2])/2,(w[1]+w[3])/2)[1]})).sort((a,b)=>a.y-b.y);
    c.lineWidth=.7;for(const {w} of walls){const pts=jag(...w);const nx=w[3]-w[1],ny=-(w[2]-w[0]),lit=clamp(.5+.08*(ny-nx),0,1);poly(c,pts,K.mixc(W[1],W[0],lit),INK)}
    const bm=[P(-hl+1,0,4),P(hl-2,1,.4)];line(c,bm[0],bm[1],1.2,"#4a3524");c.fillStyle="#5f7e35";for(let i=0;i<5;i++){const q=P(-hl+((i*41)%12),-hd+((i*29)%9),.3);c.beginPath();c.arc(q[0],q[1]-.6,1+(i%2)*.5,0,7);c.fill()}break}
  case "maypole":{if(REC){const P_=Pf(x,y,ang+0);dc(P_,"rd",0,0,4.6,2,27);dc(P_,"rd",0,0,.7,0,30);}const r=6;cyl(c,x,y,r,1,["#c9c2b0","#8f897a"]);c.fillStyle="#5f7e35";c.beginPath();c.ellipse(x,y-1,r-.8,(r-.8)*TILT,0,0,7);c.fill();const FL=["#c25a6a","#e8d27a","#efe6cb","#8a4a9a"];for(let i=0;i<24;i++){const a=i*2.399+ang,d=2+Math.sqrt((i+.5)/24)*(r-3);c.fillStyle=FL[i%4];c.beginPath();c.arc(x+Math.cos(a)*d,y-1.4+Math.sin(a)*d*TILT,.55,0,7);c.fill()}
    const RB=["#a8352a","#3f6f8f","#c9a24a","#5f7e35","#8a4a7a","#efe6cb"],fita=i=>{const a=i/6*6.283+.3+ang;c.strokeStyle=RB[i];c.lineWidth=.6;c.beginPath();c.moveTo(x,y-26);c.quadraticCurveTo(x+Math.cos(a)*3,y-14,x+Math.cos(a)*4.4,y-2+Math.sin(a)*2);c.stroke();return Math.sin(a)};for(let i=0;i<6;i++)if(Math.sin(i/6*6.283+.3+ang)<=0)fita(i);
    cyl(c,x,y-1,.65,26,["#efe6cb","#a89a7a"],.8);c.strokeStyle="#a8352a";c.lineWidth=.5;c.beginPath();for(let h=3;h<25;h+=2.2){c.moveTo(x-.6,y-1-h);c.lineTo(x+.6,y-2.2-h)}c.stroke();
    c.strokeStyle="#3f6a2a";c.lineWidth=1.6;c.beginPath();c.ellipse(x,y-24,3,1.3,0,0,7);c.stroke();c.fillStyle="#c25a6a";for(let i=0;i<6;i++){const a=i/6*6.283+ang;c.beginPath();c.arc(x+Math.cos(a)*3,y-24+Math.sin(a)*1.3,.5,0,7);c.fill()}
    for(let i=0;i<6;i++)if(Math.sin(i/6*6.283+.3+ang)>0)fita(i);poly(c,[[x,y-27],[x+3*(Math.cos(ang)>=0?1:-1),y-28.4],[x,y-29.6]],"#a8352a",INK);break}
  case "markettent":{if(REC){const P_=Pf(x,y,ang+0);dc(P_,"rd",0,0,6.5,5,11.5);dc(P_,"rd",0,0,.5,11,15);}shadow(c,x,y,6,2.8);const cols=[["#b5473a","#efe6cb"],["#3f6f8f","#efe6cb"],["#5f7e35","#e8d9a0"],["#c9a24a","#7a3a2a"],["#8a4a7a","#efe6cb"]][(v*5)|0],P=Pf(x,y,ang),n=6,ps=[];for(let i=0;i<n;i++){const a=i/n*6.283+.26;ps.push([Math.cos(a)*5,Math.sin(a)*5])}
    const so=porFundo(P,ps),mesa=()=>{prism(c,x,y+.6,6,3,1.6,ang,["#a07a4a","#6e5030"],"#c9a36e");c.fillStyle="#d8b45a";c.beginPath();c.arc(x-1.4,y-1.4,.8,0,7);c.fill();c.fillStyle="#a8352a";c.beginPath();c.arc(x+.6,y-1.3,.7,0,7);c.fill();c.fillStyle="#6f8f3a";c.beginPath();c.arc(x+2,y-1.1,.7,0,7);c.fill()};
    // estacas de tras, mesa, estacas da frente, e so entao a lona: a beirada da lona cobre o topo das estacas
    for(const [u,w] of so.slice(0,3))post(c,P,u,w,0,5,.5,"#6e5030");mesa();for(const [u,w] of so.slice(3))post(c,P,u,w,0,5,.5,"#6e5030");
    const ap=[x,y-11.5],rim=k=>{const a=k/12*6.283+ang;return [x+Math.cos(a)*6.4,y-5+Math.sin(a)*6.4*TILT]};c.strokeStyle=INK;c.lineWidth=.7;const gs=[];for(let i=0;i<12;i++)gs.push([(rim(i)[1]+rim(i+1)[1])/2,i]);gs.sort((p,q)=>p[0]-q[0]);for(const [,i] of gs)poly(c,[ap,rim(i),rim(i+1)],i%2?cols[0]:cols[1],null);
    c.beginPath();c.ellipse(x,y-5,6.4,6.4*TILT,0,0,3.1416);c.stroke();c.beginPath();c.moveTo(x-6.4,y-5);c.lineTo(ap[0],ap[1]);c.lineTo(x+6.4,y-5);c.stroke();
    for(let i=0;i<12;i++){const q=rim(i+.5);if(q[1]<=y-5)continue;c.fillStyle=i%2?cols[0]:cols[1];c.beginPath();c.moveTo(q[0]-1.2,q[1]);c.lineTo(q[0]+1.2,q[1]);c.lineTo(q[0],q[1]+1.4);c.closePath();c.fill()}
    line(c,ap,[ap[0],ap[1]-3],.6,"#4a3524");poly(c,[[ap[0],ap[1]-3],[ap[0]+2.6*(Math.cos(ang)>=0?1:-1),ap[1]-2.4],[ap[0],ap[1]-1.8]],cols[0],INK);break}
  case "goods":{shadow(c,x,y,4.4,1.8);const P=Pf(x,y,ang),S=cena(P);const bk=(u,w,col)=>S.rd(u,w,1.3,2,()=>{const b=P(u,w);cyl(c,b[0],b[1],1.3,1.4,["#b08a52","#7a5a32"]);c.fillStyle=col;c.beginPath();c.ellipse(b[0],b[1]-1.5,1.1,.6,0,0,7);c.fill()});
    bk(-2.6,-1.2,"#a8352a");bk(.2,-1.6,"#d8b45a");S.rd(2.8,-.6,1,2,()=>barrel(c,...P(2.8,-.6),1));bk(-1.2,1.2,"#6f8f3a");S.rd(1.6,1.6,1.4,2.6,()=>{const sk=P(1.6,1.6);c.fillStyle="#d8c79a";c.strokeStyle=INK;c.lineWidth=.6;c.beginPath();c.ellipse(sk[0],sk[1]-1.2,1.6,1.4,0,0,7);c.fill();c.stroke();c.beginPath();c.moveTo(sk[0]-.6,sk[1]-2.4);c.lineTo(sk[0]+.6,sk[1]-2.4);c.stroke()});S.fim();break}
  case "clocktower":{if(REC){const P_=Pf(x,y,ang+0.35);dc(P_,"rd",0,0,6.5,30,41);}shadow(c,x,y,7,3.4);const st=s.asian?["#c94a3a","#7a2a20"]:s.flat?["#e2cfa4","#a88a5a"]:["#d6d0c0","#8f897a"];prism(c,x,y,8,8,30,ang+.35,st);const P=Pf(x,y,ang+.35);
    // relogio e janelas na face mais virada para quem olha
    const fc=porFundo(P,[[0,4],[0,-4],[4,0],[-4,0]])[3],f=P(fc[0],fc[1],22);c.fillStyle="#f3ead2";c.strokeStyle=INK;c.lineWidth=.8;c.beginPath();c.ellipse(f[0],f[1],2.8,2.6,0,0,7);c.fill();c.stroke();c.beginPath();c.moveTo(f[0],f[1]);c.lineTo(f[0],f[1]-2);c.moveTo(f[0],f[1]);c.lineTo(f[0]+1.4,f[1]+.6);c.stroke();
    for(const h of [8,15]){const w=P(fc[0],fc[1],h);c.fillStyle="#2b2418";c.fillRect(w[0]-.8,w[1]-2.4,1.6,2.4)}
    if(s.asian)KR.drawAsian(c,x,y-30,{L:10,D:10,H:.6,R:5,ang:ang+.35,roof:rf===ROOF.cn?"cn":"jp",wall:"red",base:0});else{const r=RF(s.roof);cone(c,x,y-30,6.4,11,[r[0]||"#7a3a2a",r[1]||r[0]||"#4a2a1a"])}glow(c,f[0],f[1],5,"rgba(255,230,160,.25)");break}
  case "guardpost":{if(REC){const P_=Pf(x,y,ang+0.35);dc(P_,"cx",0,0,7.4,6.2,9,11);}shadow(c,x,y,5,2.6);const P=Pf(x,y,ang+.35),S=cena(P),sg=lado(P,s);
    S.cx(0,0,6,5,11,()=>{prism(c,x,y,6,5,9,ang+.35,WL(s.wall));poly(c,[P(-3.6,-3,9),P(3.6,-3,9),P(3.6,3,9),P(-3.6,3,9)],"#8a7a5a",INK);for(const [u,w] of porFundo(P,[[-3.3,-2.7],[3.3,-2.7],[3.3,2.7],[-3.3,2.7]]))post(c,P,u,w,9,11,.6,"#8f897a");flag(c,...P(0,0,9),cr)})
      .face(0,sg,()=>{const d=P(0,sg*2.5,0);c.fillStyle="#2b2418";c.fillRect(d[0]-1,d[1]-4,2,4)});
    S.rd(4.6,sg*2,.5,8,()=>{post(c,P,4.6,sg*2,0,6,.5,"#5a4028");c.fillStyle="#c9c2b0";const sp=P(4.6,sg*2,6);c.beginPath();c.moveTo(sp[0],sp[1]-2);c.lineTo(sp[0]-.6,sp[1]);c.lineTo(sp[0]+.6,sp[1]);c.fill()});S.fim();break}
  case "aqueduct":{if(REC){const P_=Pf(x,y,ang+0.15);dc(P_,"cx",0,0,32,3.4,14,18);}const P=Pf(x,y,ang+.15),W=["#d6cfbd","#8f897a"],sg=lado(P,s);shadow(c,x,y,18,4);for(const [u] of porFundo(P,[-2,-1,0,1,2].map(i=>[i*7,0]))){const b=P(u,0);prism(c,b[0],b[1],2.4,3,14,ang+.15,W)}
    poly(c,[P(-16,-1.6,14),P(16,-1.6,14),P(16,1.6,14),P(-16,1.6,14)],"#c9c2b0",INK);poly(c,[P(-16,sg*1.6,14),P(16,sg*1.6,14),P(16,sg*1.6,18),P(-16,sg*1.6,18)],W[0],INK);poly(c,[P(-16,-1.6,18),P(16,-1.6,18),P(16,1.6,18),P(-16,1.6,18)],"#6a9fb2",INK);
    c.strokeStyle=INK;c.lineWidth=.6;for(let i=-2;i<2;i++){const a=P(i*7+1.2,sg*1.6,11),b=P(i*7+5.8,sg*1.6,11),m=P(i*7+3.5,sg*1.6,13.6);c.fillStyle="#3a3228";c.beginPath();c.moveTo(a[0],a[1]);c.quadraticCurveTo(m[0],m[1]-1.6,b[0],b[1]);c.lineTo(b[0],b[1]+11);c.lineTo(a[0],a[1]+11);c.closePath();c.globalAlpha=.25;c.fill();c.globalAlpha=1}break}
  case "obelisk":{if(REC){const P_=Pf(x,y,ang+0.4);dc(P_,"cx",0,0,3.2,3.2,2,22);}shadow(c,x,y,3,1.5);prism(c,x,y,5,5,2,ang+.4,["#c9c2b0","#77705f"]);const P=Pf(x,y,ang+.4),B=[[-1.6,-1.6],[1.6,-1.6],[1.6,1.6],[-1.6,1.6]],T=[[-1,-1],[1,-1],[1,1],[-1,1]],tip=P(0,0,22),F=[];
    for(let k=0;k<4;k++){const k2=(k+1)%4,nu=(B[k][0]+B[k2][0])/2,nv=(B[k][1]+B[k2][1])/2,d=P(nu,nv)[1];F.push([d,k,k2,P(nu,nv)[0]-P(0,0)[0]])}F.sort((p,q)=>p[0]-q[0]);
    for(const [,k,k2,dx] of F){const lit=dx<0;poly(c,[P(B[k][0],B[k][1],2),P(B[k2][0],B[k2][1],2),P(T[k2][0],T[k2][1],19),P(T[k][0],T[k][1],19)],lit?"#d6d0c0":"#9a9484",INK);poly(c,[P(T[k][0],T[k][1],19),P(T[k2][0],T[k2][1],19),tip],lit?"#e6e0d0":"#a8a294",INK)}glow(c,tip[0],tip[1],3,"rgba(255,240,200,.4)");break}
  case "wayshrine":{if(REC){const P_=Pf(x,y,ang+0.3);dc(P_,"cx",0,0,5,3.8,6,10.8);}shadow(c,x,y,3,1.4);post(c,Pf(x,y,0),0,0,0,6,1.1,"#5a4028");const P=Pf(x,y-6,ang+.3),sg=lado(P,s);prism(c,x,y-6,3.6,2.4,2.8,ang+.3,["#d6cfbd","#8f897a"]);const r=RF(s.roof);poly(c,[P(-2.4,-sg*1.8,2.8),P(2.4,-sg*1.8,2.8),P(0,-sg*1.8,4.6)],r[0]||"#7a3a2a",INK);poly(c,[P(-2.4,1.8,2.8),P(2.4,1.8,2.8),P(2.4,-1.8,2.8),P(-2.4,-1.8,2.8)],r[1]||"#5a2a1a",INK);poly(c,[P(-2.4,sg*1.8,2.8),P(2.4,sg*1.8,2.8),P(0,sg*1.8,4.6)],r[0]||"#7a3a2a",INK);
    const f=P(0,sg*1.2,1.2);c.fillStyle="#f0c060";c.beginPath();c.arc(f[0],f[1],.6,0,7);c.fill();c.fillStyle="#a8352a";const fl=P(1,sg*2.2,0);c.beginPath();c.arc(fl[0],fl[1]+6,.7,0,7);c.fill();break}
  case "dovecote":{if(REC){const P_=Pf(x,y,ang+0);dc(P_,"rd",0,0,5.7,12,19);}const P=Pf(x,y,ang+.34),fs=lado(P,s);shadow(c,x,y,5,2.6);cyl(c,x,y,4.6,12,WL(s.wall));c.fillStyle="#2b2418";const o=frR(P,s,4.4);for(let i=0;i<3;i++)for(let j=0;j<2;j++)c.fillRect(o[0]-3+i*2.4,y-10+j*3,1,1.2);const r=RF(s.roof);cone(c,x,y-12,5.6,7,[r[0]||"#7a3a2a",r[1]||"#4a2a1a"]);c.fillStyle="#efe6cb";for(const [dx,dy] of [[-2,-20],[3,-17],[6,-12]]){c.beginPath();c.ellipse(x+dx*Math.cos(ang)-2*Math.sin(ang),y+dy,1,.5,.3,0,7);c.fill()}break}
  case "beehives":{if(REC){const P_=Pf(x,y,ang+0);dc(P_,"rd",-3,-1.4,1.5,0,4);dc(P_,"rd",0,-1.4,1.5,0,4);dc(P_,"rd",3,-1.4,1.5,0,4);dc(P_,"rd",-1.5,1.4,1.5,0,4);dc(P_,"rd",1.5,1.4,1.5,0,4);}const P=Pf(x,y,ang);shadow(c,x,y,6,2.4);for(const [u,w] of porFundo(P,[[-3,-1.4],[0,-1.4],[3,-1.4],[-1.5,1.4],[1.5,1.4]])){const b=P(u,w);prism(c,b[0],b[1],1.2,1.2,.8,ang,["#8a6440","#5e4026"]);c.fillStyle="#d8b45a";c.strokeStyle=INK;c.lineWidth=.6;c.beginPath();c.moveTo(b[0]-1.3,b[1]-.8);c.quadraticCurveTo(b[0]-1.4,b[1]-3.6,b[0],b[1]-3.8);c.quadraticCurveTo(b[0]+1.4,b[1]-3.6,b[0]+1.3,b[1]-.8);c.closePath();c.fill();c.stroke();c.strokeStyle="rgba(90,60,20,.6)";c.lineWidth=.4;c.beginPath();c.moveTo(b[0]-1.2,b[1]-1.9);c.lineTo(b[0]+1.2,b[1]-1.9);c.stroke()}break}
  case "woodpile":{const P=Pf(x,y,ang+.3),su=P(1,0)[1]>=P(0,0)[1]?1:-1;shadow(c,x,y,6,2.2);if(su>0){post(c,P,-4.5,0,0,1.6,.5,"#4a3524")}prism(c,x,y,9,3.6,4,ang+.3,["#8a6440","#5e4026"],"#a8804e");c.fillStyle="#c9a36e";c.strokeStyle="#5e4026";c.lineWidth=.4;for(let i=0;i<4;i++)for(let j=0;j<3;j++){const q=P(su*4.5,-1.4+j*1.4,.7+i*1)
    ;c.beginPath();c.ellipse(q[0],q[1],.6,.5,0,0,7);c.fill();c.stroke()}if(su<0)post(c,P,-4.5,0,0,1.6,.5,"#4a3524");const ax=P(-5.5,2,0);line(c,ax,[ax[0]+2,ax[1]-2.6],.6,"#5a4028");break}
  case "gazebo":{if(REC){const P_=Pf(x,y,ang+0);dc(P_,"rd",0,0,6,0,1.2);dc(P_,"rd",0,0,7.5,7.4,13.8);}shadow(c,x,y,7,3.2);const P=Pf(x,y,ang);c.fillStyle="#d6cfbd";c.strokeStyle=INK;c.lineWidth=.7;c.beginPath();c.ellipse(x,y,6,6*TILT,0,0,7);c.fill();c.stroke();c.fillStyle="#bdb6a4";c.beginPath();c.ellipse(x,y-1,6,6*TILT,0,0,7);c.fill();c.stroke();
    // todos os pilares (de tras para frente) e so depois o telhado: a beirada do telhado cobre o topo dos pilares da frente
    const n=6,ps=[];for(let i=0;i<n;i++){const a=i/n*6.283+.3;ps.push([Math.cos(a)*5,Math.sin(a)*5])}for(const [u,w] of porFundo(P,ps))post(c,P,u,w,1,8,.6,"#efe6cb");
    const r=s.asian?["#3f6f5a","#2a4a3c"]:["#3f6f8f","#2a4a60"];cone(c,x,y-8,7.4,5,r);c.fillStyle="#c9a24a";c.beginPath();c.arc(x,y-13.4,.8,0,7);c.fill();break}
  case "marketcross":{shadow(c,x,y,4,1.8);prism(c,x,y,6,6,1,ang+.4,["#b9b3a2","#77705f"]);prism(c,x,y-1,4,4,1,ang+.4,["#c9c2b0","#8f897a"]);cyl(c,x,y-2,.9,9,["#d6d0c0","#8f897a"]);const t=[x,y-11.4];c.strokeStyle=INK;c.lineWidth=1.8;c.beginPath();c.moveTo(t[0],t[1]-2.4);c.lineTo(t[0],t[1]+1.4);c.moveTo(t[0]-1.8,t[1]-.8);c.lineTo(t[0]+1.8,t[1]-.8);c.stroke();c.strokeStyle="#d6d0c0";c.lineWidth=.9;c.stroke();break}

  // ---------- steampunk: metal, ferrugem, fumaca ----------
  case "smokestack":{if(REC){const P_=Pf(x,y,ang+0);dc(P_,"rd",0,0,3.3,0,37);}const h=26+v*10;shadow(c,x,y,5,2.4);cyl(c,x,y,3.2,h,["#9b5a3e","#5f3424"],.78);c.strokeStyle="rgba(40,24,16,.6)";c.lineWidth=.6;for(let k=4;k<h;k+=5){c.beginPath();c.ellipse(x,y-k,3.2-k/h*.7,(3.2-k/h*.7)*TILT,0,0,3.1416);c.stroke()}
    c.fillStyle="#2a2420";c.beginPath();c.ellipse(x,y-h,2.5,2.5*TILT,0,0,7);c.fill();if(!SEMFX&&!REC)for(let i=0;i<4;i++){const r=2.2+i*1.2;c.fillStyle=i%2?"rgba(178,172,168,.85)":"rgba(206,200,196,.85)";c.beginPath();c.arc(x+i*2.4,y-h-3-i*3.6,r,0,7);c.fill()}break}
  case "factory":{const a=ang+.34,P=Pf(x,y,a),S=cena(P,c),sg=lado(P,s);shadow(c,x,y,20,8);
    S.cx(0,0,26,14,13,()=>{const b=P(0,0);prism(c,b[0],b[1],26,14,9,a,WALL.soot);const n=4,su=P(1,0)[1]>=P(0,0)[1]?1:-1;
      // dentes do telhado de tras para frente; cada dente: face em pe do lado de onde se ve e agua inclinada
      for(let q=0;q<n;q++){const k=su>0?q:n-1-q,u0=-13+k*26/n,u1=u0+26/n,up=[[u0,-7,9],[u0,7,9],[u0+1.2,7,13],[u0+1.2,-7,13]],sl=[[u0+1.2,-7,13],[u0+1.2,7,13],[u1,7,9],[u1,-7,9]];quad(c,P,[[u0,-7,9],[u1,-7,9],[u1,7,9],[u0,7,9]],"#55585c");if(su>0){quad(c,P,up,"#6d7176");quad(c,P,sl,"#8a8e92")}else{quad(c,P,sl,"#8a8e92");quad(c,P,up,"#6d7176")}}})
      .face(0,sg,()=>{for(let k=0;k<5;k++){const q=P(-10+k*5,sg*7.2,4.5);c.fillStyle=k%2?"#e8b35a":"#2b2418";c.fillRect(q[0]-1,q[1]-2.6,2,2.6)}});
    for(const [u,vv,h] of[[9,-4,24],[13,3,30]])S.rd(u,vv,2.6,h,()=>{const q=P(u,vv);cyl(c,q[0],q[1],2.6,h,["#9b5a3e","#5f3424"],.8);c.fillStyle="#2a2420";c.beginPath();c.ellipse(q[0],q[1]-h,2,2*TILT,0,0,7);c.fill();if(!SEMFX&&!REC)for(let i=0;i<4;i++){c.fillStyle=i%2?"rgba(178,172,168,.85)":"rgba(206,200,196,.85)";c.beginPath();c.arc(q[0]+i*2.2,q[1]-h-3-i*3.4,2+i*1.1,0,7);c.fill()}},{brota:10});S.fim();break}
  case "gasometer":{if(REC){const P_=Pf(x,y,ang+0);dc(P_,"rd",0,0,11.3,0,15.4);}shadow(c,x,y,13,6);const r=10,h=12,fr=k=>{const an=k/8*6.2832+ang,px=x+Math.cos(an)*(r+1.2),py=y+Math.sin(an)*(r+1.2)*TILT;c.strokeStyle="#5a3a24";c.lineWidth=1;c.beginPath();c.moveTo(px,py);c.lineTo(px,py-h-3);c.stroke();return Math.sin(an)};for(let k=0;k<8;k++)if(Math.sin(k/8*6.2832+ang)<-.05)fr(k);
    c.strokeStyle="#5a3a24";c.lineWidth=1;c.beginPath();c.ellipse(x,y-h-3,r+1.2,(r+1.2)*TILT,0,3.1416,6.2832);c.stroke();cyl(c,x,y,r,h*(.6+v*.4),["#8a8e92","#55585c"]);for(let k=0;k<8;k++)if(Math.sin(k/8*6.2832+ang)>=-.05)fr(k);
    c.strokeStyle="#5a3a24";c.lineWidth=1;c.beginPath();c.ellipse(x,y-h-3,r+1.2,(r+1.2)*TILT,0,0,3.1416);c.stroke();c.beginPath();c.ellipse(x,y-h*.5,r+1.2,(r+1.2)*TILT,0,0,3.1416);c.stroke();break}
  case "boiler":{if(REC){const P_=Pf(x,y,ang+0.34);dc(P_,"rd",0,0,8,0,8.5);dc(P_,"cx",0,0,10,2.4,0,13);}const a=ang+.34,P=Pf(x,y,a),sd=Math.cos(a)>=0?1:-1;shadow(c,x,y,9,4);const q=P(0,0);c.save();c.translate(q[0],q[1]);c.fillStyle="#7a4a2c";c.strokeStyle=INK;c.lineWidth=.7;c.beginPath();c.ellipse(0,-4,8,4.2,0,0,7);c.fill();c.stroke();c.fillStyle="#9a6040";c.beginPath();c.ellipse(-1*sd,-6,6,2.4,0,0,7);c.fill();
    c.fillStyle="#c9a24a";for(let k=-6;k<=6;k+=3){c.beginPath();c.arc(k,-4+Math.abs(k)*.1,.55,0,7);c.fill()}c.restore();cyl(c,q[0]+4*sd,q[1]-3,1.1,10,["#55585c","#34373a"]);smoke(c,q[0]+4*sd,q[1]-15,"#8f8a86");c.fillStyle="#e8963a";c.beginPath();c.arc(q[0]-6*sd,q[1]-3,1.1,0,7);c.fill();break}
  case "pipes":{if(REC){const P_=Pf(x,y,ang+0.34);dc(P_,"cx",0,0,18,3.6,4,7.4);}const a=ang+.34,P=Pf(x,y,a);for(const u of[-7,0,7])post(c,P,u,0,0,5,.8,"#4a4d50");for(const [o,col] of[[-1,["#a8623a","#74401f"]],[1,["#7c8086","#54575c"]]].sort((p,q)=>P(0,p[0])[1]-P(0,q[0])[1])){const A_=P(-9,o,5),B_=P(9,o,5);c.strokeStyle=INK;c.lineWidth=3.2;c.beginPath();c.moveTo(A_[0],A_[1]);c.lineTo(B_[0],B_[1]);c.stroke();c.strokeStyle=col[0];c.lineWidth=2;c.stroke();c.strokeStyle="rgba(255,255,255,.25)";c.lineWidth=.6;c.beginPath();c.moveTo(A_[0],A_[1]-.6);c.lineTo(B_[0],B_[1]-.6);c.stroke()}
    const vq=P(2,lado(P,s),5);c.fillStyle="#c9a24a";c.strokeStyle=INK;c.lineWidth=.5;c.beginPath();c.arc(vq[0],vq[1]-2,1.2,0,7);c.fill();c.stroke();break}
  case "scrap":{if(REC){const P_=Pf(x,y,ang+0);dc(P_,"rd",0,0,9,0,8);}shadow(c,x,y,9,4);const r=K.mixc,rng=A.mulberry(((v||.5)*1e6)|0);c.fillStyle="#5e5248";c.strokeStyle=INK;c.lineWidth=.6;c.beginPath();c.moveTo(x-9,y+1);c.quadraticCurveTo(x-3,y-8,x+2,y-6);c.quadraticCurveTo(x+7,y-5,x+9,y+1);c.ellipse(x,y+1,9,3,0,0,3.1416);c.fill();c.stroke();
    for(let k=0;k<9;k++){const px=x-6+rng()*12,py=y-1-rng()*5,t=rng();if(t<.3){c.strokeStyle="#a8623a";c.lineWidth=1.4;c.beginPath();c.moveTo(px-2,py);c.lineTo(px+2.5,py-1.5);c.stroke()}else if(t<.6){c.fillStyle="#7c8086";c.strokeStyle=INK;c.lineWidth=.4;c.beginPath();c.arc(px,py,1.4,0,7);c.fill();c.stroke();c.fillStyle="#3a3a3a";c.beginPath();c.arc(px,py,.5,0,7);c.fill()}else{c.fillStyle=t<.8?"#9a5a32":"#6d7176";c.fillRect(px-1.2,py-1,2.4,1.6)}}break}
  case "gearwork":{if(REC){const P_=Pf(x,y,ang+0.34);dc(P_,"cx",0,0,22,1.8,2,22);}const P=Pf(x,y,ang+.34);shadow(c,x,y,10,4);const R0=9,n=12,rot=(v||.5)*2,pt=(t,rr)=>P(Math.cos(t)*rr,0,R0+2+Math.sin(t)*rr);for(const [u] of porFundo(P,[[-3,0],[3,0]]).slice(0,1))post(c,P,u,0,0,4,1,"#4a4d50");
    c.fillStyle="#9a6a32";c.strokeStyle=INK;c.lineWidth=.8;c.beginPath();for(let k=0;k<n*2;k++){const q=pt(rot+k*3.1416/n,k%2?R0:R0+2);c.lineTo(q[0],q[1])}c.closePath();c.fill();c.stroke();
    c.fillStyle="#c9a24a";c.beginPath();for(let k=0;k<16;k++){const q=pt(k*.3927,R0*.6);c.lineTo(q[0],q[1])}c.closePath();c.fill();c.stroke();c.fillStyle="#3a2c1b";c.beginPath();for(let k=0;k<10;k++){const q=pt(k*.6283,2);c.lineTo(q[0],q[1])}c.closePath();c.fill();post(c,P,porFundo(P,[[-3,0],[3,0]])[1][0],0,0,4,1,"#4a4d50");break}
  case "airship":{if(REC){const P_=Pf(x,y,ang+0);dc(P_,"rd",0,0,.8,0,14);dc(P_,"cx",0,0,32,12,22,35);dc(P_,"cx",0,0,10,4,19,23);dc(P_,"cx",16,0,6,1,24,32);}const P=Pf(x,y,ang),ca=Math.abs(Math.cos(ang)),sd=Math.cos(ang)>=0?1:-1,B=P(0,0,28),rx=6+10*ca;shadow(c,x,y,12,5);post(c,Pf(x,y,0),0,0,0,14,1.2,"#5a4028");for(const u of[-6,6]){const q=P(u,0,22);line(c,[x,y-14],q,.5,"#3a2c1b")}
    const fin=()=>{const t=P(14,0,28);poly(c,[t,[t[0]+5*sd*ca,t[1]-4],[t[0]+5*sd*ca,t[1]+4]],"#8a6a44",INK)},bk=P(14,0)[1]<y;if(bk)fin();c.fillStyle="#b9a27a";c.strokeStyle=INK;c.lineWidth=.8;c.beginPath();c.ellipse(B[0],B[1],rx,6,0,0,7);c.fill();c.stroke();
    c.strokeStyle="rgba(80,60,30,.5)";c.lineWidth=.5;for(let k=-10;k<=10;k+=5){const q=P(k,0,28);c.beginPath();c.ellipse(q[0],q[1],1.4*ca+.3,5.6,0,0,7);c.stroke()}if(!bk)fin();const w=3+2*ca;poly(c,[[B[0]-w,B[1]+6],[B[0]+w,B[1]+6],[B[0]+w*.8,B[1]+9],[B[0]-w*.8,B[1]+9]],"#6e5232",INK);break}
  // ---------- piratas ----------
  case "hullhouse":{if(REC){const P_=Pf(x,y,ang+0.34);dc(P_,"cx",0,0,18,9.4,3,11.4);dc(P_,"rd",-8,0,.6,4,12);}const a=ang+.34,P=Pf(x,y,a);shadow(c,x,y,12,5);const b=P(0,0);prism(c,b[0],b[1],16,8,3,a,WALL.tar);const N=12,top=[],sides=[[],[]];for(let k=0;k<=N;k++){const u=-9+18*k/N,w=4.6*Math.sin(Math.PI*(k/N*0.9+.05)),h=3+Math.sin(Math.PI*k/N)*5;sides[0].push(P(u,-w,3));sides[1].push(P(u,w,3));top.push(P(u,0,3+h))}
    const fr=P(0,1)[1]>P(0,0)[1]?1:0;for(const sd of[1-fr,fr]){const pts=sides[sd].concat(top.slice().reverse());poly(c,pts,sd===fr?"#7a5a38":"#5e4430",INK);c.strokeStyle="rgba(40,26,14,.55)";c.lineWidth=.45;c.beginPath();for(let r=.25;r<1;r+=.25)sides[sd].forEach((q,i)=>{const t_=top[i],x_=lerp(q[0],t_[0],r),y_=lerp(q[1],t_[1],r);i?c.lineTo(x_,y_):c.moveTo(x_,y_)});c.stroke()}
    c.strokeStyle=INK;c.lineWidth=1;c.beginPath();top.forEach((q,i)=>i?c.lineTo(q[0],q[1]):c.moveTo(q[0],q[1]));c.stroke();const d=P(2,(fr?1:-1)*4.2,0);c.fillStyle="#2b2418";c.fillRect(d[0]-1.2,d[1]-3.6,2.4,3.6);const fq=P(-8,0,9);flag(c,fq[0],fq[1]+5,7,"#1d1a17");break}
  case "wreck":{if(REC){const P_=Pf(x,y,ang+0.34);dc(P_,"cx",0,0,28,11,0,6);dc(P_,"cx",7,0,9,2,2,14);}const a=ang+.34,P=PfS(x,y,a,null);c.fillStyle="rgba(20,40,50,.25)";c.beginPath();c.ellipse(x,y+2,18,7,0,0,7);c.fill();const N=10,s1=[],s2=[],kl=[];for(let k=0;k<=N;k++){const u=-14+28*k/N,w=5.4*Math.sin(Math.PI*(k/N*.85+.08));s1.push(P(u,-w,2.5+k*.2));s2.push(P(u,w,1.2));kl.push(P(u,0,-1))}
    poly(c,s1.concat(kl.slice().reverse()),"#5e4430",INK);poly(c,kl.concat(s2.slice().reverse()),"#7a5a38",INK);c.strokeStyle="#3a2c1b";c.lineWidth=.7;for(let k=2;k<N;k+=2){const q=s2[k],t=P(-14+28*k/N,2,6);c.beginPath();c.moveTo(q[0],q[1]);c.lineTo(t[0],t[1]);c.stroke()}
    const m=P(3,0,2);c.strokeStyle=INK;c.lineWidth=2;c.beginPath();c.moveTo(m[0],m[1]);c.lineTo(m[0]+8,m[1]-12);c.stroke();c.strokeStyle="#5a4028";c.lineWidth=1.1;c.stroke();poly(c,[[m[0]+7,m[1]-11],[m[0]+12,m[1]-6],[m[0]+5,m[1]-5]],"rgba(220,210,180,.8)",INK);break}
  case "cannon":{if(REC){const P_=Pf(x,y,ang+0.34);dc(P_,"cx",1,0,8,3.8,0,3.8);}const a=ang+.34,P=Pf(x,y,a);shadow(c,x,y,4,2);quad(c,P,[[-2.4,-1.6,0],[2.4,-1.6,0],[2.4,1.6,0],[-2.4,1.6,0]],"#6e5232");for(const sd of[-1.8,1.8]){const q=P(0,sd,1);c.fillStyle="#4a3524";c.strokeStyle=INK;c.lineWidth=.5;c.beginPath();c.ellipse(q[0],q[1],1.4,1.4,0,0,7);c.fill();c.stroke()}
    const A_=P(-2.5,0,2.2),B_=P(4.5,0,2.6);c.strokeStyle=INK;c.lineWidth=3.2;c.lineCap="round";c.beginPath();c.moveTo(A_[0],A_[1]);c.lineTo(B_[0],B_[1]);c.stroke();c.strokeStyle="#3d3f42";c.lineWidth=2.2;c.stroke();c.lineCap="butt";c.fillStyle="#1b1b1b";c.beginPath();c.arc(B_[0],B_[1],.8,0,7);c.fill();
    for(const [u,w] of[[-3,2.6],[-3.8,2]]){const q=P(u,w);c.fillStyle="#2b2b2b";c.beginPath();c.arc(q[0],q[1]-.6,.7,0,7);c.fill()}break}
  case "jollyroger":{if(REC){const P_=Pf(x,y,ang+0);dc(P_,"rd",0,0,.6,0,15);dc(P_,"cx",4,0,8,.6,9.6,15);}const P=Pf(x,y,ang),A=(u,h)=>P(u,0,h);post(c,Pf(x,y,0),0,0,0,15,.9,"#4a3524");poly(c,[A(0,15),A(8,14.2),A(7.4,9.6),A(0,10)],"#1d1a17",INK);const m=A(3.8,12.6);c.fillStyle="#efe9dc";c.beginPath();c.arc(m[0],m[1]-.4,1.1,0,7);c.fill();c.strokeStyle="#efe9dc";c.lineWidth=.5;c.beginPath();c.moveTo(m[0]-1.4,m[1]+1);c.lineTo(m[0]+1.4,m[1]+2);c.moveTo(m[0]+1.4,m[1]+1);c.lineTo(m[0]-1.4,m[1]+2);c.stroke();break}
  case "crowsnest":{if(REC){const P_=Pf(x,y,ang+0.34);dc(P_,"cx",0,0,6.4,6.4,0,2);dc(P_,"rd",0,0,1,0,18);dc(P_,"rd",0,0,1,18,27);}const P=Pf(x,y,ang+.34);shadow(c,x,y,6,3);for(const [u,w] of porFundo(P,[[-3,-3],[3,-3],[-3,3],[3,3]]))line(c,P(u,w),P(0,0,18),.9,"#5a4028");post(c,P,0,0,0,18,1.2,"#5a4028");const t=P(0,0,18);cyl(c,t[0],t[1]+2,3.4,4,["#8a6a44","#5f472c"]);c.strokeStyle="#3a2c1b";c.lineWidth=.5;c.beginPath();c.ellipse(t[0],t[1]-1,3.4,3.4*TILT,0,0,7);c.stroke();flag(c,t[0],t[1]-2,7,"#1d1a17");break}
  case "treasure":{const a=ang+.6,P=Pf(x,y,a);prism(c,x,y,3.8,2.6,1.8,a,["#7a4a24","#5a3418"],"#8a5a2c");const t=P(0,0,1.8);prism(c,t[0],t[1],3.8,2.6,.9,a,["#c9a24a","#a8842c"],"#e0c060");c.fillStyle="#f0d870";const k=P(0,lado(P,null)*1.35,1.6);c.beginPath();c.arc(k[0],k[1],.6,0,7);c.fill();break}
  default:{hall(c,x,y,12,8,6,s,{ang})}}}
// tamanho aproximado de cada uma (raio no chao, altura) para ocupar espaco e ordenar
const SIZE={factory:[30,30],smokestack:[5,34],gasometer:[14,16],boiler:[10,12],pipes:[16,8],scrap:[10,6],gearwork:[12,20],airship:[22,30],hullhouse:[14,10],wreck:[22,14],cannon:[5,4],jollyroger:[3,16],crowsnest:[6,24],treasure:[3,3],stairs:[4,8],pottery:[14,12],dyeworks:[18,12],winery:[26,14],postmill:[9,26],quarry:[26,14],mine:[22,14],griffin:[18,34],mausoleum:[10,18],trainingyard:[24,10],castle:[60,50],ruinhouse:[12,8],mansion:[44,30],maypole:[8,30],flowerbed:[12,4],markettent:[10,12],goods:[8,5],clocktower:[9,40],guardpost:[7,14],aqueduct:[34,22],obelisk:[5,22],wayshrine:[5,10],dovecote:[7,18],beehives:[9,6],woodpile:[9,6],gazebo:[11,14],marketcross:[5,14],townhall:[16,32],guild:[15,26],bank:[13,14],court:[14,24],prison:[13,22],hospital:[17,18],barracks:[18,22],gatehouse:[10,22],cathedral:[30,60],chapel:[9,20],monastery:[18,30],library:[16,24],university:[20,40],observatory:[10,26],school:[11,16],
  markethall:[17,16],inn:[18,22],shop:[8,14],bakery:[10,14],alchemist:[8,18],warehouse:[19,16],stall:[6,8],smithy:[12,16],stable:[15,14],watermill:[11,14],tannery:[12,10],brewery:[14,16],sawmill:[12,12],granary:[14,16],
  lighthouse:[7,44],shipwright:[20,18],fishery:[13,10],crane:[8,24],ship:[18,32],boat:[6,4],cargo:[10,6],arena:[23,14],theater:[17,12],baths:[16,16],garden:[18,10],wizard:[10,50],arcane:[15,16],portal:[10,28],eldertree:[14,48],dragonstatue:[9,24],crystal:[8,30],golem:[8,20],
  statue:[4,16],fountain:[9,12],well:[4,12],gallows:[6,16],cart:[6,8],wagon:[10,12],crates:[7,6],haystack:[6,10],scarecrow:[4,12],lamp:[4,12],bench:[4,3]};
window.AtlasAssets={LIST,NAME,SIZE,draw,ficha,fichaDe,fechoConvexo,semFx:v=>{SEMFX=!!v},templo,torreQ,pagode,cena,ordemPecas,naFrente,frenteRet,cart,shipIso,boat,shipV,boatV,SHIPT,crate,barrel,horse,prism,cyl,cone,church,mosque,hipRoof,fortress};
})();
