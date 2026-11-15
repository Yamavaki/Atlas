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

// ---------- dimensoes ----------
const CW=1532,CH=1110,MX=46,MY=64,MW=1440,MH=1000;
const TILT=0.7,K=112,WX=MW,WY=Math.ceil((MH+K)/TILT)+2,G=8,GW=Math.ceil(WX/G)+2,GH=Math.ceil(WY/G)+2;
const O=4,OW=Math.ceil(WX/O)+1,OH=Math.ceil(WY/O)+1;
const NAMES=["Vrbice","Lesnov","Kamenitz","Borek","Sedletz","Dubrava","Olshany","Hradek","Zlatnik","Mokrina","Trnava","Radim","Skalna","Brezov","Jelenov","Vysoka","Lipany","Podoli","Rybnik","Chlum"];

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
function hull(p){p=p.slice().sort((a,b)=>a[0]-b[0]||a[1]-b[1]);const cr=(o,a,b)=>(a[0]-o[0])*(b[1]-o[1])-(a[1]-o[1])*(b[0]-o[0]),lo=[],up=[];
  for(const q of p){while(lo.length>1&&cr(lo[lo.length-2],lo[lo.length-1],q)<=0)lo.pop();lo.push(q)}for(let i=p.length-1;i>=0;i--){const q=p[i];while(up.length>1&&cr(up[up.length-2],up[up.length-1],q)<=0)up.pop();up.push(q)}lo.pop();up.pop();return lo.concat(up)}
function chaikin(p,n){for(let k=0;k<n;k++){const q=[p[0]];for(let i=0;i<p.length-1;i++){const a=p[i],b=p[i+1];q.push([a[0]*.75+b[0]*.25,a[1]*.75+b[1]*.25],[a[0]*.25+b[0]*.75,a[1]*.25+b[1]*.75])}q.push(p[p.length-1]);p=q}return p}

// ---------- carimbos por codigo ----------
function makeStamps(rng){
  const pal=[["#5d7534","#8a9c48"],["#4f6a2f","#7a9040"],["#677a36","#96a34c"],["#48602e","#6f8840"]];
  const dec=[],con=[];
  for(const [body,hi] of pal)for(let v=0;v<3;v++){
    const c=document.createElement("canvas");c.width=34;c.height=38;const x=c.getContext("2d");
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
  for(let v=0;v<4;v++){const c=document.createElement("canvas");c.width=34;c.height=38;const x=c.getContext("2d");
    x.fillStyle="rgba(22,28,8,.36)";x.beginPath();x.ellipse(20,34,8,3,0,0,7);x.fill();
    x.strokeStyle="#5b3d1e";x.lineWidth=2;x.beginPath();x.moveTo(17,36);x.lineTo(17,30);x.stroke();
    const w=7+rng()*2;x.lineWidth=1;x.strokeStyle="#161d0b";x.lineJoin="round";
    for(let t=0;t<3;t++){const y0=31-t*7,ww=w*(1-t*.22);x.beginPath();x.moveTo(17-ww,y0);x.lineTo(17,y0-12);x.lineTo(17+ww,y0);x.closePath();x.fillStyle=v%2?"#3c5230":"#34482a";x.fill();x.stroke();
      x.fillStyle="rgba(120,140,70,.5)";x.beginPath();x.moveTo(17-ww*.8,y0-1);x.lineTo(17,y0-11);x.lineTo(17-ww*.1,y0-1);x.closePath();x.fill()}
    con.push(c)}
  const bush=[],rock=[];
  for(let v=0;v<6;v++){const c=document.createElement("canvas");c.width=20;c.height=15;const x=c.getContext("2d");
    x.fillStyle="rgba(22,28,8,.3)";x.beginPath();x.ellipse(11,12,7,2.5,0,0,7);x.fill();
    const lb=[];const n=3+((rng()*3)|0);for(let i=0;i<n;i++)lb.push([5+rng()*10,7+rng()*3,2.6+rng()*1.8]);
    const col=v%3===0?["#566b2c","#7e9142"]:v%3===1?["#4c6230","#6f8a45"]:["#6a7433","#929a4b"];
    x.fillStyle="#1f260d";for(const[a,b,r]of lb){x.beginPath();x.arc(a,b,r+1,0,7);x.fill()}
    x.fillStyle=col[0];for(const[a,b,r]of lb){x.beginPath();x.arc(a,b,r,0,7);x.fill()}
    x.fillStyle=col[1];for(const[a,b,r]of lb){x.beginPath();x.arc(a-r*.3,b-r*.35,r*.5,0,7);x.fill()}
    bush.push(c)}
  for(let v=0;v<8;v++){const c=document.createElement("canvas");c.width=18;c.height=14;const x=c.getContext("2d");
    x.fillStyle="rgba(30,25,10,.3)";x.beginPath();x.ellipse(10,11.5,7,2.3,0,0,7);x.fill();
    const n=6+((rng()*3)|0),pts=[];for(let i=0;i<n;i++){const a=3.1416+i/(n-1)*3.1416,r=4.5+rng()*2.5;pts.push([9+Math.cos(a)*r*1.15,11+Math.sin(a)*r])}
    x.lineJoin="round";x.lineWidth=.9;x.strokeStyle=INK;x.beginPath();x.moveTo(pts[0][0],pts[0][1]);for(const q of pts)x.lineTo(q[0],q[1]);x.closePath();
    const g=x.createLinearGradient(3,4,15,12);g.addColorStop(0,"#c9c2ae");g.addColorStop(1,"#857d6b");x.fillStyle=g;x.fill();x.stroke();
    const m=pts[(n/2)|0];x.fillStyle="rgba(70,62,48,.55)";x.beginPath();x.moveTo(m[0],m[1]);x.lineTo(pts[n-2][0],pts[n-2][1]);x.lineTo(pts[n-1][0],pts[n-1][1]);x.lineTo(m[0]+1,11);x.closePath();x.fill();
    x.strokeStyle="rgba(50,40,25,.6)";x.lineWidth=.6;x.beginPath();x.moveTo(m[0],m[1]+.5);x.lineTo(m[0]+1,10.5);x.moveTo(pts[1][0]+2,pts[1][1]+1.5);x.lineTo(pts[1][0]+4,pts[1][1]+2);x.stroke();
    rock.push(c)}
  return {dec,con,bush,rock}}
function poly(c,pts,fill,stroke){c.beginPath();c.moveTo(pts[0][0],pts[0][1]);for(let i=1;i<pts.length;i++)c.lineTo(pts[i][0],pts[i][1]);c.closePath();if(fill){c.fillStyle=fill;c.fill()}if(stroke){c.strokeStyle=stroke;c.stroke()}}
const ROOF={thatch:["#c2a868","#8f7741"],old:["#a8915a","#7b6638"],tile:["#bb573c","#8c3d2a"],dark:["#9c4631","#743222"],slate:["#80828a","#5a5c63"],shingle:["#8d6c46","#654c30"]};
const WALL={daub:["#e8dec2","#bcae8e"],stone:["#d0c9b7","#9a9484"],wood:["#b38d5c","#86663f"]};
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
function drawTower(c,x,y,w,h,rh,roof,wall,cren){
  const a=[.87*w,-.43*w],b=[-.87*w,-.43*w];c.lineWidth=.8;c.lineJoin="round";
  const F=[x,y],R=[x+a[0],y+a[1]],L=[x+b[0],y+b[1]],up=(p,k)=>[p[0],p[1]-k],top=[x,y+a[1]-h-rh],B=[x,y+2*a[1]];
  poly(c,[F,L,up(L,h),up(F,h)],wall[0],INK);poly(c,[F,R,up(R,h),up(F,h)],wall[1],INK);
  c.fillStyle="#3a2c1b";c.fillRect(x-w*.45-.5,y-h*.62,1.2,2.2);
  if(cren){poly(c,[up(F,h),up(R,h),up(B,h),up(L,h)],"#b8b19f",INK);c.strokeStyle=INK;c.setLineDash([1.6,1.6]);c.lineWidth=1.6;c.beginPath();c.moveTo(L[0],L[1]-h-.8);c.lineTo(F[0],F[1]-h-.8);c.lineTo(R[0],R[1]-h-.8);c.stroke();c.setLineDash([]);c.lineWidth=.8}
  else{poly(c,[up(L,h),up(F,h),top],roof[0],INK);poly(c,[up(F,h),up(R,h),top],roof[1],INK)}
}
function drawWall(c,p,q,h){const lit=(q[1]-p[1])*(q[0]-p[0])>0;
  c.lineWidth=.8;poly(c,[p,q,[q[0],q[1]-h],[p[0],p[1]-h]],lit?"#cfc8b6":"#a59f8e",INK);
  poly(c,[[p[0],p[1]-h],[q[0],q[1]-h],[q[0],q[1]-h-2.2],[p[0],p[1]-h-2.2]],"#ddd6c4",INK);
  c.strokeStyle="rgba(60,50,35,.5)";c.lineWidth=.5;c.beginPath();c.moveTo(p[0],p[1]-h*.5);c.lineTo(q[0],q[1]-h*.5);c.stroke();
  c.strokeStyle=INK;c.lineWidth=1.5;c.setLineDash([1.8,1.8]);c.beginPath();c.moveTo(p[0],p[1]-h-3);c.lineTo(q[0],q[1]-h-3);c.stroke();c.setLineDash([])}
function drawWaterWall(c,p,q,h){const lit=(q[1]-p[1])*(q[0]-p[0])>0;
  c.lineWidth=.8;poly(c,[p,q,[q[0],q[1]-h],[p[0],p[1]-h]],lit?"#cfc8b6":"#a59f8e",INK);
  const n=Math.max(1,Math.round(Math.hypot(q[0]-p[0],q[1]-p[1])/7));c.fillStyle="#26323a";
  for(let i=0;i<n;i++){const m=[lerp(p[0],q[0],(i+.5)/n),lerp(p[1],q[1],(i+.5)/n)];c.beginPath();c.moveTo(m[0]-1.7,m[1]);c.lineTo(m[0]-1.7,m[1]-h*.42);c.arc(m[0],m[1]-h*.42,1.7,3.1416,0);c.lineTo(m[0]+1.7,m[1]);c.closePath();c.fill()}
  c.strokeStyle="rgba(30,40,45,.55)";c.lineWidth=.5;for(let i=0;i<n;i++){const m=[lerp(p[0],q[0],(i+.5)/n),lerp(p[1],q[1],(i+.5)/n)];c.beginPath();c.moveTo(m[0]-1.5,m[1]-1);c.lineTo(m[0]+1.5,m[1]-1);c.moveTo(m[0]-1.5,m[1]-2.3);c.lineTo(m[0]+1.5,m[1]-2.3);c.stroke()}
  poly(c,[[p[0],p[1]-h],[q[0],q[1]-h],[q[0],q[1]-h-2.2],[p[0],p[1]-h-2.2]],"#ddd6c4",INK);
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
function banner(c,x,y,text,major,rng){
  c.font=(major?"17px ":"13px ")+'"IM Fell English SC","IM Fell English",Georgia,serif';
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
function generate(P){
  const seed=hashStr(P.seed),rng=mulberry(seed),fbm=makeNoise(seed^0x9e37),fbm2=makeNoise(seed^0x51f1);
  const pick=a=>a[(rng()*a.length)|0];
  const heap=()=>{const hf=[],hi=[];return {size:()=>hf.length,
    push(f,i){let k=hf.length;hf.push(f);hi.push(i);while(k>0){const p=(k-1)>>1;if(hf[p]<=f)break;hf[k]=hf[p];hi[k]=hi[p];k=p}hf[k]=f;hi[k]=i},
    pop(){const top=hi[0],f=hf.pop(),i=hi.pop(),n=hf.length;if(n){let k=0;for(;;){let c=2*k+1;if(c>=n)break;if(c+1<n&&hf[c+1]<hf[c])c++;if(hf[c]>=f)break;hf[k]=hf[c];hi[k]=hi[c];k=c}hf[k]=f;hi[k]=i}return top}}};
  // forma da terra
  const N=GW*GH,land=new Float32Array(N),elev=new Float32Array(N),forest=new Float32Array(N),vari=new Float32Array(N),slope=new Float32Array(N),dist=new Float32Array(N),rdist=new Float32Array(N).fill(1e9),hadd=new Float32Array(N),fadd=new Float32Array(N),ladd=new Float32Array(N);
  for(const e of P.edits||[]){const tgt=e.t==="land"||e.t==="sea"?ladd:e.t==="up"||e.t==="down"?hadd:fadd,sg=(e.t==="land"||e.t==="up"||e.t==="forest")?1:-1,amt=tgt===ladd?1.5:tgt===hadd?.22:1;
    const i0=Math.max(0,((e.x-e.r)/G)|0),i1=Math.min(GW-1,((e.x+e.r)/G|0)+1),j0=Math.max(0,((e.y-e.r)/G)|0),j1=Math.min(GH-1,((e.y+e.r)/G|0)+1);
    for(let j=j0;j<=j1;j++)for(let i=i0;i<=i1;i++){const d=Math.hypot(i*G-e.x,j*G-e.y);if(d<e.r)tgt[j*GW+i]+=sg*amt*sstep(e.r,e.r*.35,d)}}
  const form=P.form||"regiao",side=(rng()*4)|0,blobs=[],lakes=[],cx0=WX*.5,cy0=WY*.46,edge=[[0,cy0],[WX,cy0],[cx0,0],[cx0,WY]][side];
  if(form==="ilha")blobs.push([cx0+(rng()-.5)*120,cy0+(rng()-.5)*100,WX*.35,WY*.31,rng()*3.14]);
  else if(form==="arquipelago"){const n=4+((rng()*3)|0);for(let i=0;i<n;i++)blobs.push([WX*(.16+rng()*.68),WY*(.16+rng()*.62),WX*(.1+rng()*.09),WY*(.09+rng()*.08),rng()*3.14])}
  else if(form==="peninsula")for(let i=0;i<5;i++){const t=i/4;blobs.push([lerp(edge[0],cx0,t*1.1)+(rng()-.5)*110,lerp(edge[1],cy0,t*1.1)+(rng()-.5)*110,WX*(.21-.02*i),WY*(.2-.02*i),rng()*3.14])}
  else if(form==="continente")blobs.push([cx0,cy0,WX*.5,WY*.47,rng()*.4]);
  for(let i=0;i<(P.islands||0);i++)blobs.push([WX*(.08+rng()*.84),WY*(.08+rng()*.8),50+rng()*70,45+rng()*60,rng()*3.14,1]);
  for(let i=0;i<(P.lakes||0);i++)lakes.push([WX*(.2+rng()*.6),WY*(.2+rng()*.55),38+rng()*50,30+rng()*40,rng()*3.14]);
  const ell=(b,x,y)=>{const c=Math.cos(b[4]),s=Math.sin(b[4]),dx=x-b[0],dy=y-b[1];return Math.hypot((dx*c+dy*s)/b[2],(-dx*s+dy*c)/b[3])};
  const seaT=((P.sea==null?.5:P.sea)-.5)*.6;let anyWater=false;
  for(let j=0;j<GH;j++)for(let i=0;i<GW;i++){const x=i*G,y=j*G,k=j*GW+i,tt=[x/WX,1-x/WX,y/WY,1-y/WY][side];let L;
    if(form==="regiao")L=1;else{L=form==="costa"?(tt-.3)*3:form==="peninsula"?(.13-tt)*5:-1;
      for(const b of blobs){const v=(1-ell(b,x,y))*(b[5]?1.1:1.3);if(v>L)L=v}
      L+=(fbm(x/170+31,y/170+17,4)-.5)*(form==="continente"?1.05:.62)-seaT}
    for(const b of lakes){const v=1-ell(b,x,y);if(v>0)L=Math.min(L,.03-v*1.5+(fbm(x/60+3,y/60+9,2)-.5)*.3)}
    L=clamp(L+ladd[k],-1,1);land[k]=L;if(L<0)anyWater=true;
    const wx_=x+(fbm(x/260+70,y/260+40,2)-.5)*170,wy_=y+(fbm(x/260+10,y/260+90,2)-.5)*170,base=fbm(wx_/460+3,wy_/460+7,5),ridge=1-Math.abs(2*fbm2(wx_/300+9,wy_/300+2,3)-1),pass_=.3+.7*sstep(.02,.2,Math.abs(fbm2(wx_/400+20,wy_/400+60,2)-.5)*2);
    let e=Math.pow(clamp((base-.2)*2.3,0,1),1.2)*(.65+.6*ridge)*(.2+P.relief*1.15);
    e=e*pass_*sstep(0,.34,L)+hadd[k];elev[k]=L<0?0:clamp(e,0,1);vari[k]=fbm2(x/210,y/210,3)}
  // distancia ao mar e lagos
  const sd=new Float32Array(N);for(let k=0;k<N;k++)sd[k]=land[k]<0?0:1e6;
  if(anyWater){for(let j=0;j<GH;j++)for(let i=0;i<GW;i++){const k=j*GW+i;let m=sd[k];if(i>0)m=Math.min(m,sd[k-1]+1);if(j>0){m=Math.min(m,sd[k-GW]+1);if(i>0)m=Math.min(m,sd[k-GW-1]+1.414);if(i<GW-1)m=Math.min(m,sd[k-GW+1]+1.414)}sd[k]=m}
    for(let j=GH-1;j>=0;j--)for(let i=GW-1;i>=0;i--){const k=j*GW+i;let m=sd[k];if(i<GW-1)m=Math.min(m,sd[k+1]+1);if(j<GH-1){m=Math.min(m,sd[k+GW]+1);if(i>0)m=Math.min(m,sd[k+GW-1]+1.414);if(i<GW-1)m=Math.min(m,sd[k+GW+1]+1.414)}sd[k]=m}}
  // rios
  const rivers=[];const addR=(ctrl,w)=>{const pts=chaikin(ctrl,3);rivers.push({pts,w,ctrl});for(let j=0;j<GH;j++)for(let i=0;i<GW;i++){const x=i*G,y=j*G,k=j*GW+i;let m=rdist[k];m*=m;for(let q=0;q<pts.length;q+=2){const dx=pts[q][0]-x,dy=pts[q][1]-y,d=dx*dx+dy*dy;if(d<m)m=d}rdist[k]=Math.sqrt(m)}};
  const nRiv=P.rivers==null?1:P.rivers;
  const VR=P.vec&&P.vec.rivers;if(VR)for(const r of VR)if(r&&r.c&&r.c.length>1)addR(r.c,r.w||10);
  if(!VR&&form==="regiao"&&nRiv>0){const river=[];let x=-40,y=WY*(.3+.4*rng()),t=0;const p1=rng()*6.28,p2=rng()*6.28,M=.35+P.meander*1.05,cy=WY*.5;
    while(x<WX+40&&t<1600){const th=M*(Math.sin(t*.034+p1)*1.15+Math.sin(t*.0125+p2)*.95)-(y-cy)*.0026;x+=Math.cos(th)*6;y+=Math.sin(th)*6;river.push([x,y]);t++}addR(simp(river,9),16)}
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
  // povoados
  const towns=[];{let tries=P.lock?1e9:0;if(P.lock)for(const l of P.lock){if(sampleGrid(land,l.x,l.y)>.03&&sampleGrid(rdist,l.x,l.y)>14)towns.push({x:l.x,y:l.y,size:l.size,kind:l.kind,planned:!!l.planned,ang:0,name:l.name||"",streets:[],dens:l.dens,wall:l.wall})}while(towns.length<P.towns&&tries<5000){tries++;const c0=towns.length===0,x=c0?330+rng()*(WX-660):110+rng()*(WX-220),y=c0?430+rng()*(WY-900):190+rng()*(WY-420),d=sampleGrid(dist,x,y),e=sampleGrid(elev,x,y),sl=sampleGrid(slope,x,y);
      const lim=tries>3000?2.2:1;if((!dry&&(c0?(d<36||d>118*lim):(d<60||d>250*lim)))||sampleGrid(land,x,y)<.12||e>.34*lim||sl>.035*lim)continue;
      if(tries<4200&&[130,200,280].some(o=>sampleGrid(elev,x,y+o)>e+.16))continue;
      if(towns.some(t=>Math.hypot(t.x-x,t.y-y)<(towns.length?260:0)))continue;
      const first=towns.length===0,size=first?30:6+((rng()*11)|0);
      const kind=first?"city":size>=12?"town":"village";
      const planned=P.plan==="planned"?kind!=="village"||rng()<.5:P.plan==="organic"?false:(first||(kind==="town"&&rng()<.45));
      towns.push({x:Math.round(x/G)*G,y:Math.round(y/G)*G,size,kind,planned,ang:0,name:"",streets:[]})}
    const pool=NAMES.filter(n=>!towns.some(t=>t.name===n));let un=1;for(const t of towns){if(!t.name)t.name=pool.length?pool.splice((rng()*pool.length)|0,1)[0]:"Vila "+(un++);
      t.core=t.size*2.7+14;t.R=t.core+70+t.size*3;if(t.dens==null)t.dens=.5+rng()*.25;if(t.wall==null)t.wall=t.kind==="city";t.wallR=t.wall?t.core+16:0}}
  // terreno aplainado sob os povoados
  for(const t of towns){const e0=sampleGrid(elev,t.x,t.y);for(let j=0;j<GH;j++)for(let i=0;i<GW;i++){const d=Math.hypot(i*G-t.x,j*G-t.y);if(d<t.core*2.3){const k=j*GW+i;elev[k]=lerp(e0,elev[k],sstep(t.core*1.05,t.core*2.3,d))}}}
  for(let j=1;j<GH-1;j++)for(let i=1;i<GW-1;i++){const k=j*GW+i;slope[k]=Math.hypot(elev[k+1]-elev[k-1],elev[k+GW]-elev[k-GW])}
  // floresta
  const thr=.76-P.forest*.4;
  for(let j=0;j<GH;j++)for(let i=0;i<GW;i++){const x=i*G,y=j*G,k=j*GW+i;const v=fbm2(x/250+11,y/250+5,4)*.8+elev[k]*.42+slope[k]*2;
    let f=clamp((v-thr)*7,0,1);f*=sstep(14,46,dist[k]+fbm(x/40,y/40,2)*30);
    for(const t of towns)f*=sstep((t.wallR||t.core)*1.2,(t.wallR||t.core)*1.85+45,Math.hypot(t.x-x,(t.y+36-y)*.85)+fbm(x/60,y/60,2)*50-25);forest[k]=land[k]<.02?0:clamp(f+fadd[k],0,1)}
  // estradas por caminho de menor custo
  const roadG=new Uint8Array(N);
  function astar(s,tg){const g=new Float32Array(N).fill(1e9),from=new Int32Array(N).fill(-1),done=new Uint8Array(N),H=heap(),tx=tg%GW,ty=(tg/GW)|0;g[s]=0;H.push(0,s);
    while(H.size()){const u=H.pop();if(u===tg)break;if(done[u])continue;done[u]=1;const ux=u%GW,uy=(u/GW)|0;
      for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){if(!dx&&!dy)continue;const vx=ux+dx,vy=uy+dy;if(vx<0||vy<0||vx>=GW-1||vy>=GH-1)continue;const v=vy*GW+vx;if(done[v]||land[v]<0)continue;
        let c=1+slope[v]*110+Math.abs(elev[v]-elev[u])*260+forest[v]*.5+(rdist[v]<15?26:0);c*=(dx&&dy?1.414:1)*(roadG[v]?.3:1);
        const ng=g[u]+c;if(ng<g[v]){g[v]=ng;from[v]=u;H.push(ng+Math.hypot(vx-tx,vy-ty)*.3,v)}}}
    const path=[];let u=tg;while(u>=0){path.push(u);u=from[u]}return path.reverse()}
  const cellOf=(x,y)=>clamp(Math.round(y/G),0,GH-2)*GW+clamp(Math.round(x/G),0,GW-2);
  const roads=[],roadCtrl=[];const pushRoad=ctrl=>{const pts=chaikin(ctrl,3);for(const q of resample(pts,6))roadG[cellOf(q[0],q[1])]=1;roads.push(pts);roadCtrl.push(ctrl)};
  const addRoad=(a,b)=>{const cells=astar(a,b);if(cells.length<2)return;pushRoad(simp(cells.map(i=>[(i%GW)*G,((i/GW)|0)*G]),7))};
  if(P.vec&&P.vec.roads){for(const c of P.vec.roads)if(c&&c.length>1)pushRoad(c);
    towns.forEach((t,i)=>{if(roads.some(r=>r.some(q=>Math.hypot(q[0]-t.x,q[1]-t.y)<28)))return;let bj=-1,bd=1e9;towns.forEach((o,j)=>{if(j===i)return;const d=Math.hypot(o.x-t.x,o.y-t.y);if(d<bd){bd=d;bj=j}});if(bj>=0)addRoad(cellOf(t.x,t.y),cellOf(towns[bj].x,towns[bj].y))})}
  else
  {const inT=[0],out=towns.map((_,i)=>i).slice(1);const tc=t=>cellOf(t.x,t.y);
    while(out.length){let best=null;for(const i of inT)for(const j of out){const d=Math.hypot(towns[i].x-towns[j].x,towns[i].y-towns[j].y);if(!best||d<best[2])best=[i,j,d]}
      addRoad(tc(towns[best[0]]),tc(towns[best[1]]));inT.push(best[1]);out.splice(out.indexOf(best[1]),1)}
    const byX=towns.slice().sort((a,b)=>a.x-b.x);if(byX.length){const l=byX[0],r=byX[byX.length-1];
      addRoad(tc(l),cellOf(0,l.y+(rng()-.5)*260));addRoad(tc(r),cellOf(WX,r.y+(rng()-.5)*260));
      const byY=towns.slice().sort((a,b)=>a.y-b.y);addRoad(tc(byY[0]),cellOf(byY[0].x+(rng()-.5)*300,0));
      if(towns.length>3){const a=byY[byY.length-1],b=byX[(byX.length/2)|0];if(a!==b)addRoad(tc(a),tc(b))}}}
  // ocupacao: 1 estrada, 2 construcao/muralha, >=10 campos
  const occ=new Uint16Array(OW*OH);
  const occAt=(x,y)=>(x<0||y<0||x>=WX||y>=WY)?1:occ[((y/O)|0)*OW+((x/O)|0)];
  const disc=(x,y,r,v,force)=>{const x0=Math.max(0,((x-r)/O)|0),x1=Math.min(OW-1,((x+r)/O)|0),y0=Math.max(0,((y-r)/O)|0),y1=Math.min(OH-1,((y+r)/O)|0);
    for(let j=y0;j<=y1;j++)for(let i=x0;i<=x1;i++){const dx=i*O+2-x,dy=j*O+2-y;if(dx*dx+dy*dy<=r*r){const k=j*OW+i;if(force||!occ[k])occ[k]=v}}};
  const line=(pts,r,v)=>{for(let i=0;i<pts.length-1;i++){const a=pts[i],b=pts[i+1],n=Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1])/3)+1;for(let k=0;k<=n;k++)disc(lerp(a[0],b[0],k/n),lerp(a[1],b[1],k/n),r,v,true)}};
  for(const r of roads)line(r,4,1);
  // pontes
  const bridges=[];const findBridges=r=>{let run=null;for(let i=0;i<r.length;i++){const w=sampleGrid(rdist,r[i][0],r[i][1])<11;if(w&&run===null)run=i;if((!w||i===r.length-1)&&run!==null){if(i>run)bridges.push([r[Math.max(0,run-1)],r[Math.min(r.length-1,i)]]);run=null}}};for(const r of roads)findBridges(r);
  const splitDry=pts=>{const out=[];let cur=[];for(const q of pts){if(sampleGrid(dist,q[0],q[1])<13){if(cur.length>2)out.push(cur);cur=[]}else cur.push(q)}if(cur.length>2)out.push(cur);return out};
  // ruas: seguem os dois eixos das construcoes na vista inclinada
  const AX=[[.817,.577],[-.817,.577]];
  for(const t of towns){
    const sa=rng()*3.14,st=1.1+rng()*.45,ph=rng()*9,cs=Math.cos(sa),sn=Math.sin(sa);
    t.inside=(x,y,m)=>{const dx=x-t.x,dy=y-t.y,u=(dx*cs+dy*sn)/st,v=(-dx*sn+dy*cs)*st*.92,a=Math.atan2(v,u);return Math.hypot(u,v)<t.core*(m||1)*(.7+.62*fbm(Math.cos(a)*1.2+ph,Math.sin(a)*1.2+ph,2))};
    const dryIn=(q,m)=>t.inside(q[0],q[1],m)&&sampleGrid(dist,q[0],q[1])>13;
    const runs=(pts,test)=>{const out=[];let cur=[];for(const q of pts){if(test(q))cur.push(q);else{if(cur.length>3)out.push(cur);cur=[]}}if(cur.length>3)out.push(cur);return out};
    if(t.planned){const sp=25+rng()*4,n=Math.max(1,Math.round(t.core/sp)),ext=t.core*1.6;
      for(let ai=0;ai<2;ai++){const a=AX[ai],o=AX[1-ai];for(let k=-n;k<=n;k++){if(k&&rng()<.12)continue;const off=k*sp+(k?(rng()-.5)*5:0),pts=[];for(let q=-ext;q<=ext;q+=4)pts.push([t.x+o[0]*off+a[0]*q,t.y+o[1]*off+a[1]*q]);
          if(k===0){for(const r of runs(pts,q=>t.inside(q[0],q[1],1)&&sampleGrid(land,q[0],q[1])>=0)){findBridges(r);t.streets.push(r)}}
          else for(const r of runs(pts,q=>dryIn(q,1)))t.streets.push(r)}}
      t.plaza=[t.x+(AX[0][0]+AX[1][0])*sp/2,t.y+(AX[0][1]+AX[1][1])*sp/2,sp-7]}
    else{const cand=[];for(const r of roads)for(let i=2;i<r.length-2;i+=2){if(t.inside(r[i][0],r[i][1],.85))cand.push([r[i],Math.atan2(r[i+1][1]-r[i-1][1],r[i+1][0]-r[i-1][0])])}
      const starts=[],want=cand.length?2+((t.size/4)|0):0;
      const lane=(p,dir,len,depth)=>{let x=p[0],y=p[1],ang=Math.atan2(dir[1],dir[0]);const pts=[[x,y]],cv=(rng()-.5)*.012;for(let q=0;q<len;q+=4){x+=Math.cos(ang)*4;y+=Math.sin(ang)*4;ang+=cv*4;if(!dryIn([x,y],1.05))break;pts.push([x,y])}
        if(pts.length>4){t.streets.push(pts);if(depth<1&&rng()<.6){const m=pts[(pts.length*(.4+rng()*.4))|0],o=AX[Math.abs(dir[0]*AX[0][0]+dir[1]*AX[0][1])>.7?1:0],sg=rng()<.5?1:-1;lane(m,[o[0]*sg,o[1]*sg],len*.7,depth+1)}}};
      for(let q=0;q<want*6&&starts.length<want;q++){const [p,a]=pick(cand);if(starts.some(z=>Math.hypot(z[0]-p[0],z[1]-p[1])<26))continue;starts.push(p);
        const tx=Math.cos(a),ty=Math.sin(a),o=Math.abs(tx*AX[0][0]+ty*AX[0][1])<Math.abs(tx*AX[1][0]+ty*AX[1][1])?AX[0]:AX[1],sg=rng()<.5?1:-1;lane(p,[o[0]*sg,o[1]*sg],26+rng()*(t.core*.8),0)}
      t.plaza=t.kind==="village"?null:[t.x+AX[1][0]*15,t.y+AX[1][1]*15,17]}
    for(const z of t.streets)line(z,3,1);
    if(t.plaza)disc(t.plaza[0],t.plaza[1],t.plaza[2]*.6,1,true)}
  // construcoes
  const B=[],placed=[];
  const SPEC={hut:{L:[7,9],D:[5,6],H:[3.2,4],R:[3.4,4.4],roof:["thatch","old"],wall:["daub","wood"],door:1},
    farm:{L:[10,13],D:[6,7.5],H:[4.2,5],R:[4,5],roof:["thatch","thatch","shingle"],wall:["daub"],door:1,win:1},
    barn:{L:[15,19],D:[8,9.5],H:[5,6],R:[5,6],roof:["old","shingle"],wall:["wood"],door:2},
    town:{L:[9,12],D:[6,7],H:[7.5,9],R:[4.5,5.5],roof:["tile","tile","dark"],wall:["daub"],door:1,win:1,timber:1},
    rich:{L:[13,16],D:[7.5,9],H:[9.5,11],R:[5.5,6.5],roof:["tile","dark"],wall:["daub","stone"],door:2,win:1,timber:1,chim:1},
    manor:{L:[19,23],D:[9.5,11],H:[11,12.5],R:[6.5,7.5],roof:["dark","slate"],wall:["stone"],door:2,win:1,chim:1},
    tavern:{L:[13,15],D:[7.5,8.5],H:[8,9],R:[5,6],roof:["tile","shingle"],wall:["daub"],door:2,win:1,timber:1,chim:1,sign:1},
    row:{L:[6.5,8],D:[5,5.8],H:[7,8],R:[4,4.6],roof:["tile","dark"],wall:["daub"],door:1,win:1,timber:1},
    smithy:{L:[10,12],D:[7,8],H:[4.6,5.4],R:[4,4.6],roof:["slate","shingle"],wall:["stone"],door:2,smoke:1}};
  const R2=a=>a[0]+rng()*(a[1]-a[0]);
  const typeFor=(t,x,y)=>{const d=Math.hypot(x-t.x,y-t.y)/t.core,r=rng(),out=!t.inside(x,y,1.05);
    if(t.kind==="village")return r<.3?"hut":r<.78?"farm":r<.9?"barn":r<.95?"tavern":"smithy";
    if(t.kind==="town")return d<.5?(r<.5?"town":r<.68?"rich":r<.8?"tavern":r<.9?"smithy":"farm"):(r<.5?"farm":r<.72?"town":r<.9?"hut":"barn");
    if(out)return r<.55?"hut":r<.85?"farm":"barn";
    if(d<.4)return r<.45?"rich":r<.78?"town":r<.9?"tavern":"manor";
    if(d<.8)return r<.66?"town":r<.76?"smithy":r<.85?"tavern":r<.95?"rich":"farm";
    return r<.55?"town":r<.82?"farm":"hut"};
  const foot=(L,D,flip)=>{const sg=flip?-1:1,a=[.87*sg*D,-.43*D/TILT],b=[-.87*sg*L,-.43*L/TILT];return {a,b,c:[(a[0]+b[0])/2,(a[1]+b[1])/2]}};
  const placeFoot=(cx,cy,f)=>{const X=cx-f.c[0],Y=cy-f.c[1];if(X<12||Y<20||X>WX-12||Y>WY-30)return null;
    for(let u=.08;u<=.93;u+=.283)for(let v=.08;v<=.93;v+=.283){const px=X+f.a[0]*u+f.b[0]*v,py=Y+f.a[1]*u+f.b[1]*v;if(occAt(px,py)||sampleGrid(dist,px,py)<16)return null}
    const r=Math.hypot(f.c[0],f.c[1]);for(const p of placed){const dx=p[0]-cx,dy=p[1]-cy;if(dx*dx+dy*dy<(p[2]+r)*(p[2]+r)*.4)return null}
    placed.push([cx,cy,r]);for(let u=0;u<=1.001;u+=.25)for(let v=0;v<=1.001;v+=.25)disc(X+f.a[0]*u+f.b[0]*v,Y+f.a[1]*u+f.b[1]*v,2.4,2,false);return [X,Y]};
  const build=(t,x,y,ang,type)=>{const sp=SPEC[type],L=R2(sp.L),D=R2(sp.D);const dx=Math.cos(ang),dy=Math.sin(ang)*TILT,flip=dx*dy<0;
    const at=placeFoot(x,y,foot(L,D,flip));if(!at)return false;
    B.push({k:1,x:at[0],y:at[1],cx:x,cy:y,ti:t.i,inner:t.inside(x,y,1.02),type,L,D,H:R2(sp.H)*.8,R:R2(sp.R)*.85,flip,roof:pick(sp.roof),wall:pick(sp.wall),door:sp.door,win:sp.win,timber:sp.timber&&rng()<.8,chim:sp.chim,sign:sp.sign,smoke:sp.smoke});return true};
  const along=(t,pts,m)=>{let acc=0,next=3+rng()*6;const step=13-t.dens*6.5;for(let i=0;i<pts.length-1;i++){const a=pts[i],b=pts[i+1],len=Math.hypot(b[0]-a[0],b[1]-a[1]);if(len<.01)continue;const ang=Math.atan2(b[1]-a[1],b[0]-a[0]);
      while(next<=acc+len){const q=(next-acc)/len,x=lerp(a[0],b[0],q),y=lerp(a[1],b[1],q);next+=step+rng()*4;if(!t.inside(x,y,m))continue;
        for(const sd of[-1,1]){if(rng()<.34-t.dens*.34)continue;const ty=typeFor(t,x,y);for(const off of[7.5,10,13]){if(build(t,x-Math.sin(ang)*sd*off,y+Math.cos(ang)*sd*off,ang,ty))break}}}acc+=len}};
  const walls=[];
  towns.forEach((t,ti)=>{t.i=ti;const big=t.kind==="city";
    if(big){let bd=null,be=-1;for(let k=0;k<14;k++){const a=k/14*6.2832,cx=Math.cos(a),cy=Math.sin(a);let r=t.core*1.4;while(r>10&&!t.inside(t.x+cx*r,t.y+cy*r,1))r-=4;const x=t.x+cx*r*.66,y=t.y+cy*r*.66;if(sampleGrid(dist,x,y)<40||sampleGrid(dist,x,y-24)<30)continue;const e=sampleGrid(elev,x,y)+rng()*.02;if(e>be){be=e;bd=[x,y]}}
      if(bd){t.castle=bd;placed.push([bd[0],bd[1]-16,34]);disc(bd[0],bd[1]-16,31,2,true);B.push({k:3,x:bd[0],y:bd[1],ti})}}
    if(t.plaza){placed.push([t.plaza[0],t.plaza[1],t.plaza[2]*.62]);const n=big?7:4;
      for(let i=0;i<n;i++){const a=i/n*6.28+rng(),r=t.plaza[2]*(.16+rng()*.22);B.push({k:6,ti,x:t.plaza[0]+Math.cos(a)*r,y:t.plaza[1]+Math.sin(a)*r*.7,col:pick(["#a8352a","#2f4f86","#c9a24c","#e8e0c8"])})}
      B.push({k:7,ti,x:t.plaza[0],y:t.plaza[1]})}
    if(t.kind!=="village"||t.size>8){const c0=t.plaza||[t.x,t.y,0],cm=big?1.3:1;
      for(const [ax,sg] of [[AX[1],1],[AX[1],-1],[AX[0],1],[AX[0],-1]]){const d=c0[2]*.6+17*cm,at=placeFoot(c0[0]+ax[0]*sg*d,c0[1]+ax[1]*sg*d,foot(24*cm,9*cm,false));if(at){B.push({k:2,ti,x:at[0],y:at[1],big});break}}}
    for(const z of t.streets)along(t,z,1.08);
    for(const r of roads)along(t,r,t.wall?1.5:1.2);
    {const tries=Math.round((big?2200:t.kind==="town"?480:100)*(.3+t.dens*1.2));
      for(let k=0;k<tries;k++){const a=rng()*6.2832,r=Math.sqrt(rng())*t.core*1.3,x=t.x+Math.cos(a)*r,y=t.y+Math.sin(a)*r;if(!t.inside(x,y,.97))continue;const ax=AX[rng()<.5?0:1],a2=Math.atan2(ax[1],ax[0]);build(t,x,y,a2,typeFor(t,x,y))||build(t,x,y,a2,t.kind==="village"?"hut":"row")}}
    if(!t.wall&&rng()<.7){for(let k=0;k<12;k++){const a=rng()*6.28,r=t.core+24+rng()*40,x=t.x+Math.cos(a)*r,y=t.y+Math.sin(a)*r;if(sampleGrid(elev,x,y)>sampleGrid(elev,t.x,t.y)+.02&&!occAt(x,y)&&sampleGrid(dist,x,y)>24){placed.push([x,y,9]);disc(x,y,9,2,false);B.push({k:8,ti,x,y,rot:rng()*1.57});break}}}
    if(t.wall){const p0=[];for(const b of B){if(b.ti!==ti||b.k>3||(b.k===1&&!b.inner))continue;const r=b.k===3?34:b.k===2?17:10,bx=b.k===1?b.cx:b.x,by=b.k===3?b.y-16:b.k===2?b.y-8:b.cy;for(const [ox,oy] of [[-r,-r],[r,-r],[r,r],[-r,r]])p0.push([bx+ox,by+oy])}
      if(t.plaza)p0.push([t.plaza[0],t.plaza[1]]);
      if(p0.length>11){const hl=hull(p0);let cx=0,cy=0;for(const q of hl){cx+=q[0]/hl.length;cy+=q[1]/hl.length}
        const inf=hl.map(q=>{const dx=q[0]-cx,dy=q[1]-cy,d=Math.hypot(dx,dy)||1;return [q[0]+dx/d*12,q[1]+dy/d*12]}),pts=[];
        inf.forEach((a,i)=>{const b=inf[(i+1)%inf.length],n=Math.max(1,Math.round(Math.hypot(b[0]-a[0],b[1]-a[1])/30));for(let k=0;k<n;k++)pts.push([lerp(a[0],b[0],k/n),lerp(a[1],b[1],k/n)])});
        const segs=[];pts.forEach((a,k)=>{const b=pts[(k+1)%pts.length];let gate=false,water=false,sea=false;for(let q=0;q<=8;q++){const x=lerp(a[0],b[0],q/8),y=lerp(a[1],b[1],q/8);if(x>0&&y>0&&x<WX&&y<WY&&roadG[cellOf(x,y)])gate=true;if(sampleGrid(rdist,x,y)<12)water=true;if(sampleGrid(land,x,y)<0)sea=true}
          segs.push({a,b,gate:gate&&!water&&!sea,water:water&&!sea,sea})});
        for(let k=0;k<segs.length;k++)if(segs[k].gate&&segs[(k+1)%segs.length].gate)segs[(k+1)%segs.length].gate=false;
        for(const z of segs)if(!z.sea)line([z.a,z.b],4,2);
        t.wallR=Math.max(...pts.map(q=>Math.hypot(q[0]-t.x,q[1]-t.y)));
        for(let i=B.length-1;i>=0;i--){const b=B[i];if(b.ti!==ti||b.k!==1||b.inner)continue;if(inPoly(pts,b.cx,b.cy)||segs.some(z=>dseg(b.cx,b.cy,z.a,z.b)<13))B.splice(i,1)}
        walls.push({pts,segs})}else t.wallR=0}});
  // portos e barcos
  const piers=[];
  if(anyWater){for(const t of towns){let best=null;for(let k=0;k<20;k++){const a=k/20*6.2832,cx=Math.cos(a),cy=Math.sin(a);for(let r=10;r<t.core+80;r+=6){if(sampleGrid(land,t.x+cx*r,t.y+cy*r)<-.015){if(!best||r<best[0])best=[r,cx,cy];break}}}
      if(!best)continue;const [r,cx,cy]=best,sx=t.x+cx*(r-5),sy=t.y+cy*(r-5),np=t.kind==="village"?1:t.kind==="town"?2:3;
      for(let i=0;i<np;i++){const o=(i-(np-1)/2)*16,px=sx-cy*o,py=sy+cx*o;if(sampleGrid(land,px+cx*20,py+cy*20)<-.03&&sampleGrid(land,px-cx*6,py-cy*6)>0)piers.push([[px-cx*5,py-cy*5],[px+cx*(18+rng()*10),py+cy*(18+rng()*10)]])}
      for(let i=0;i<np+1;i++){const d=34+rng()*60,o=(rng()-.5)*110,x=sx+cx*d-cy*o,y=sy+cy*d+cx*o;if(sampleGrid(land,x,y)<-.09)B.push({k:13,x,y,big:rng()<.45&&t.kind!=="village",flip:rng()<.5})}}
    for(let i=0;i<6;i++){const x=40+rng()*(WX-80),y=60+rng()*(WY-200);if(sampleGrid(land,x,y)<-.3)B.push({k:13,x,y,big:rng()<.5,flip:rng()<.5})}}
  // campos: lotes poligonais que dividem divisas, como um mosaico
  const fieldsP=[],extra=[];let nextId=10;
  const FAMS=[["#dcc980","#d2bc6b","#e3d595","#cdb765"],["#c6cc78","#b3c066","#d0d285","#bcc46e"],["#c9b37a","#bd9d68","#d8c48a","#b08f5a"]];
  const ok=(x,y)=>{if(x<4||y<4||x>WX-4||y>WY-4||occAt(x,y))return false;return sampleGrid(dist,x,y)>15&&sampleGrid(forest,x,y)<.6&&sampleGrid(slope,x,y)<.05};
  if(P.fields>0){const seeds=[];
    for(const t of towns){const want=Math.round(P.fields*(16+t.size*1.7)),R0=(t.wallR||t.core*.75)+8,R1=R0+62+t.size*4,ba=Math.atan2(AX[0][1],AX[0][0])+(rng()-.5)*.5;
      for(let q=0,n=0;q<want*16&&n<want;q++){const a=rng()*6.2832,r=R0+Math.sqrt(rng())*(R1-R0),x=t.x+Math.cos(a)*r,y=t.y+Math.sin(a)*r*1.12;if(!ok(x,y))continue;const sz=15+rng()*16;if(seeds.some(z=>Math.hypot(z.x-x,z.y-y)<(z.sz+sz)*.6))continue;seeds.push({x,y,sz,ba,fam:pick(FAMS)});n++}}
    for(const z of seeds){let poly=[];const n=14,a0=rng()*6.28;
      for(let i=0;i<n;i++){const a=a0+i/n*6.2832,cx=Math.cos(a),cy=Math.sin(a),rm=z.sz*(1.3+rng()*.5);let r=3;while(r<rm&&ok(z.x+cx*(r+3),z.y+cy*(r+3)))r+=3;poly.push([z.x+cx*r,z.y+cy*r])}
      for(const o of seeds){if(o===z)continue;const dx=o.x-z.x,dy=o.y-z.y,d=Math.hypot(dx,dy);if(d>95)continue;const nx=dx/d,ny=dy/d,lim=d/2-1.4,out=[];
        for(let i=0;i<poly.length;i++){const p=poly[i],q=poly[(i+1)%poly.length],dp=(p[0]-z.x)*nx+(p[1]-z.y)*ny-lim,dq=(q[0]-z.x)*nx+(q[1]-z.y)*ny-lim;if(dp<=0)out.push(p);if((dp<0)!==(dq<0)&&dp!==dq){const u=dp/(dp-dq);out.push([p[0]+(q[0]-p[0])*u,p[1]+(q[1]-p[1])*u])}}
        poly=out;if(poly.length<3)break}
      if(poly.length<3)continue;let ar=0;for(let i=0;i<poly.length;i++){const p=poly[i],q=poly[(i+1)%poly.length];ar+=p[0]*q[1]-q[0]*p[1]}if(Math.abs(ar)/2<190)continue;
      const r=rng(),kind=r<.42?"crop":r<.72?"strips":r<.9?"pasture":"orchard",id=nextId++;
      const fp={poly,kind,cx:z.x,cy:z.y,ang:z.ba+(rng()<.35?1.5708:0)+(rng()-.5)*.25,gap:5.5+rng()*4,col:kind==="pasture"?pick(["#a9b05c","#b4b968","#9faa55"]):kind==="orchard"?"#a3ad58":pick(z.fam),col2:pick(pick(FAMS))};fieldsP.push(fp);
      let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9;for(const p of poly){x0=Math.min(x0,p[0]);y0=Math.min(y0,p[1]);x1=Math.max(x1,p[0]);y1=Math.max(y1,p[1])}
      for(let y=y0;y<=y1;y+=O)for(let x=x0;x<=x1;x+=O)if(inPoly(poly,x,y))disc(x,y,2.5,id,false);
      if(kind==="orchard"){const ca=Math.cos(fp.ang),sa=Math.sin(fp.ang);for(let u=-60;u<=60;u+=8)for(let v=-60;v<=60;v+=8){const x=z.x+ca*u-sa*v,y=z.y+sa*u+ca*v;if(inPoly(poly,x,y)&&dsegPoly(poly,x,y)>3)extra.push([x,y,.5])}}
      else if(rng()<.3){const e=(rng()*poly.length)|0,a=poly[e],b=poly[(e+1)%poly.length],l=Math.hypot(b[0]-a[0],b[1]-a[1]);for(let q=3;q<l;q+=6.5)extra.push([lerp(a[0],b[0],q/l),lerp(a[1],b[1],q/l),.5])}}}
  const brs=[];for(const b of bridges){const mx=(b[0][0]+b[1][0])/2,my=(b[0][1]+b[1][1])/2;if(brs.some(o=>Math.hypot(o.mx-mx,o.my-my)<34))continue;b.mx=mx;b.my=my;b.stone=towns.some(t=>t.kind!=="village"&&Math.hypot(t.x-mx,t.y-my)<t.core*1.7)||rng()<.3;brs.push(b)}
  return {P,seed,rng,fbm,fbm2,rivers,land,rdist,anyWater,dist,elev,forest,vari,slope,towns,roads,bridges:brs,walls,B,fieldsP,piers,extra,occAt,vec:{rivers:rivers.map(r=>({c:r.ctrl,w:Math.round(r.w)})),roads:roadCtrl}};
}

// ---------- desenho ----------
function smoothPath(c,pts){c.beginPath();c.moveTo(pts[0][0],pts[0][1]);for(let i=1;i<pts.length-1;i++){const mx=(pts[i][0]+pts[i+1][0])/2,my=(pts[i][1]+pts[i+1][1])/2;c.quadraticCurveTo(pts[i][0],pts[i][1],mx,my)}c.lineTo(pts[pts.length-1][0],pts[pts.length-1][1])}
function render(W,canvas,stamps){
  const {rng,fbm,rivers,towns,roads,occAt,P}=W;
  // 1. textura plana (mundo visto de cima)
  const flat=document.createElement("canvas");flat.width=WX;flat.height=WY;const f=flat.getContext("2d");
  f.lineJoin="round";f.lineCap="round";
  f.strokeStyle="rgba(70,72,24,.3)";f.lineWidth=.8;f.beginPath();for(let i=0;i<9000;i++){const x=rng()*WX,y=rng()*WY;if(occAt(x,y)||sampleGrid(W.land,x,y)<.03)continue;f.moveTo(x-1.6,y-1.4);f.lineTo(x,y+.6);f.lineTo(x+1.6,y-1.4)}f.stroke();
  for(const fp of W.fieldsP){const pth=()=>{f.beginPath();fp.poly.forEach((p,i)=>i?f.lineTo(p[0],p[1]):f.moveTo(p[0],p[1]));f.closePath()};
    pth();f.fillStyle=fp.col;f.fill();
    if(fp.kind==="crop"||fp.kind==="strips"){f.save();pth();f.clip();f.translate(fp.cx,fp.cy);f.rotate(fp.ang);
      if(fp.kind==="strips"){f.fillStyle=fp.col2;for(let y=-80,i=0;y<80;y+=fp.gap,i++)if(i&1)f.fillRect(-80,y,160,fp.gap);f.strokeStyle="rgba(72,52,20,.4)";f.lineWidth=.8;f.beginPath();for(let y=-80;y<80;y+=fp.gap){f.moveTo(-80,y);f.lineTo(80,y)}f.stroke()}
      f.strokeStyle="rgba(90,65,20,.22)";f.lineWidth=.8;f.beginPath();for(let y=-80;y<80;y+=3.4){f.moveTo(-80,y);f.lineTo(80,y)}f.stroke();f.restore()}
    pth();f.strokeStyle=fp.kind==="pasture"?"rgba(70,60,20,.32)":"rgba(72,52,20,.62)";f.lineWidth=1.1;f.stroke()}
  if(W.anyWater){f.strokeStyle="rgba(40,58,66,.5)";f.lineWidth=.9;f.beginPath();for(let i=0;i<8000;i++){const x=rng()*WX,y=rng()*WY;if(sampleGrid(W.land,x,y)>-.04)continue;const w=3+rng()*4;f.moveTo(x-w,y);f.quadraticCurveTo(x,y-2.2,x+w,y)}f.stroke()}
  for(const rv of rivers){smoothPath(f,rv.pts);f.strokeStyle="#33403c";f.lineWidth=20*rv.w/16;f.stroke()}
  for(const rv of rivers){const kk=rv.w/16,river=rv.pts;smoothPath(f,river);f.strokeStyle="#7f9197";f.lineWidth=16*kk;f.stroke();smoothPath(f,river);f.strokeStyle="#98a9ab";f.lineWidth=8*kk;f.stroke();
    f.strokeStyle="rgba(40,58,66,.6)";f.lineWidth=.9;f.beginPath();
    for(let i=1;i<river.length-1;i++){const a=river[i],b=river[i+1],dx=b[0]-a[0],dy=b[1]-a[1],l=Math.hypot(dx,dy)||1,nx=-dy/l,ny=dx/l;
      for(const o0 of[-5,-1.5,2,5.5]){const o=o0*kk;if(((i*7+((o0*3)|0))&3)===0)continue;const sgn=(i+((o0+6)|0))&1?1:-1;f.moveTo(a[0]+nx*o,a[1]+ny*o);f.quadraticCurveTo(a[0]+dx*.5+nx*(o+1.8*sgn),a[1]+dy*.5+ny*(o+1.8*sgn),a[0]+dx*.85+nx*o,a[1]+dy*.85+ny*o)}}f.stroke()}
  for(const r of roads){smoothPath(f,r);f.strokeStyle="rgba(74,52,22,.7)";f.lineWidth=6;f.stroke()}
  for(const t of towns)for(const s of t.streets){smoothPath(f,s);f.strokeStyle="rgba(74,52,22,.6)";f.lineWidth=4.6;f.stroke()}
  for(const t of towns){if(t.plaza){const z=t.plaza[2]/2,a=[.817*z,.577*z],b=[-.817*z,.577*z],x=t.plaza[0],y=t.plaza[1];f.lineWidth=1.2;poly(f,[[x-a[0]-b[0],y-a[1]-b[1]],[x+a[0]-b[0],y+a[1]-b[1]],[x+a[0]+b[0],y+a[1]+b[1]],[x-a[0]+b[0],y-a[1]+b[1]]],"#e0cf9c","rgba(74,52,22,.6)")}}
  for(const r of roads){smoothPath(f,r);f.strokeStyle="#e4d3a0";f.lineWidth=3.8;f.stroke()}
  for(const t of towns)for(const s of t.streets){smoothPath(f,s);f.strokeStyle="#e0cf9c";f.lineWidth=2.8;f.stroke()}
  for(const p of W.piers){f.lineCap="butt";const ln=()=>{f.beginPath();f.moveTo(p[0][0],p[0][1]);f.lineTo(p[1][0],p[1][1])};ln();f.strokeStyle="#3a2a18";f.lineWidth=5.5;f.stroke();ln();f.strokeStyle="#a37c4c";f.lineWidth=3.6;f.stroke();ln();f.strokeStyle="rgba(50,32,15,.6)";f.setLineDash([.8,2.2]);f.stroke();f.setLineDash([]);f.lineCap="round"}
  for(const br of W.bridges){const dx=br[1][0]-br[0][0],dy=br[1][1]-br[0][1],l=Math.hypot(dx,dy)||1,a=[br[0][0]-dx/l*3,br[0][1]-dy/l*3],b=[br[1][0]+dx/l*3,br[1][1]+dy/l*3];f.lineCap="butt";const ln=()=>{f.beginPath();f.moveTo(a[0],a[1]);f.lineTo(b[0],b[1])};
    if(br.stone){ln();f.strokeStyle="#4d4a41";f.lineWidth=15;f.setLineDash([3,6.5]);f.lineDashOffset=-3;f.stroke();f.setLineDash([]);ln();f.strokeStyle="#2b2114";f.lineWidth=11.5;f.stroke();ln();f.strokeStyle="#cdc6b4";f.lineWidth=9.5;f.stroke();ln();f.strokeStyle="#e6d7a8";f.lineWidth=5;f.stroke();ln();f.strokeStyle="rgba(60,50,35,.35)";f.lineWidth=9.5;f.setLineDash([.7,3.3]);f.stroke();f.setLineDash([])}
    else{ln();f.strokeStyle="#3a2a18";f.lineWidth=10;f.stroke();ln();f.strokeStyle="#9a7446";f.lineWidth=7.5;f.stroke();ln();f.strokeStyle="rgba(50,32,15,.7)";f.setLineDash([.8,2.4]);f.stroke();f.setLineDash([])}
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
      const v=V[i],fo=F[i];let r=lerp(150,178,v),g=lerp(154,170,v),b=lerp(74,84,v);
      r=lerp(r,168,h*.5);g=lerp(g,154,h*.5);b=lerp(b,80,h*.5);
      r=lerp(r,160,steep*.5);g=lerp(g,128,steep*.5);b=lerp(b,70,steep*.5);
      r=lerp(r,62,fo*.9);g=lerp(g,78,fo*.9);b=lerp(b,36,fo*.9);
      const lv_=LF[i];if(lv_<0){const dd=clamp(-lv_*1.7,0,1);r=lerp(136,96,dd);g=lerp(154,117,dd);b=lerp(158,130,dd);if(lv_>-.1){const q_=1+(lv_+.1)*1.7;r*=q_;g*=q_;b*=q_}}else if(lv_<.06&&fo<.3){const s_=(1-lv_/.06)*.8;r=lerp(r,216,s_);g=lerp(g,200,s_);b=lerp(b,152,s_)}
      const ti=i*4;let ta=tex[ti+3]/255;if(lv_<0&&ta>.8&&tex[ti+2]>tex[ti])ta*=sstep(-.16,-.01,lv_);if(ta>0){r=lerp(r,tex[ti],ta);g=lerp(g,tex[ti+1],ta);b=lerp(b,tex[ti+2],ta)}
      let sh=1+lit*(lit>0?.2:.36);const wb=lit<0?1+lit*.14:1;
      {const cq=-gy;if(cq>thrC*.7&&fo<.5&&ta<.3&&lv_>=0){const cl=sstep(thrC*.7,thrC,cq),yb=Math.max(0,y-9),top=(E[yb*WX+x]-E[Math.min(WY-1,y+3)*WX+x])<thrC*.62,str=((Math.imul(x>>1,2654435761)>>>0)%6)===0,str2=((Math.imul(x>>1,40503)>>>0)%11)===0;
        r=lerp(r,190,cl);g=lerp(g,174,cl);b=lerp(b,138,cl);sh=lerp(sh,top?.42:(.92+clamp(gx*5,-.22,.12))*(str?.7:str2?1.12:1),cl)}}
      if(lv_>=0&&fo<.45&&ta<.25&&y<WY-1&&x<WX-1){const lv=(h*NL)|0,cv=((E[i+WX]*NL)|0)!==lv||((E[i+1]*NL)|0)!==lv;
        if(cv){sh*=lv%4===0?.7:.8;cprev=true}else{if(cprev&&lv>0)sh*=lit>-.2?1.1:1.04;cprev=false}}else cprev=false;
      const top=sy<0?0:sy;for(let s=top;s<ymin;s++){const k=(s*MW+x)*4,gr=.975+((((Math.imul(x,73856093)^Math.imul(s,19349663))>>>0)%89)/89)*.05;o[k]=r*sh*gr;o[k+1]=g*sh*gr;o[k+2]=b*sh*wb*gr;o[k+3]=255;YB[s*MW+x]=y}
      ymin=sy;if(ymin<=0)break}}
  const tmp=document.createElement("canvas");tmp.width=MW;tmp.height=MH;tmp.getContext("2d").putImageData(img,0,0);
  // 3. papel e moldura
  const c=canvas.getContext("2d");c.setTransform(1,0,0,1,0,0);c.fillStyle="#cdbb93";c.fillRect(0,0,CW,CH);
  for(let i=0;i<60;i++){const x=rng()*CW,y=rng()*CH,r=40+rng()*200,g=c.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,"rgba(110,80,35,"+(.03+rng()*.07)+")");g.addColorStop(1,"rgba(110,80,35,0)");c.fillStyle=g;c.fillRect(x-r,y-r,r*2,r*2)}
  c.drawImage(tmp,MX,MY);
  c.save();c.beginPath();c.rect(MX,MY,MW,MH);c.clip();c.translate(MX,MY);c.lineCap="round";
  const eAt=(x,y)=>E[clamp(y|0,0,WY-1)*WX+clamp(x|0,0,WX-1)];
  const pj=(x,y)=>[x,y*TILT-eAt(x,y)*K];
  const vis=(x,y,p)=>{const sx=p[0]|0,sy=p[1]|0;if(sx<0||sy<0||sx>=MW||sy>=MH)return sy<MH+40&&sx>-20&&sx<MW+20&&sy>-10;return YB[sy*MW+sx]<=y+14};
  // 4a. hachuras de encosta: escuras no lado da sombra, claras no lado da luz
  {const hd=[],hl=[];
    for(let y=6;y<WY-6;y+=7)for(let x=6;x<WX-6;x+=7){const px=x+(rng()-.5)*6,py=y+(rng()-.5)*6;const gx=(eAt(px+3,py)-eAt(px-3,py))/6,gy=(eAt(px,py+3)-eAt(px,py-3))/6,g=Math.hypot(gx,gy);
      if(g<.0016||rng()>g*170)continue;const k=(clamp(py|0,0,WY-1)*WX+clamp(px|0,0,WX-1))*4;if(tex[k+3]>60||LF[k>>2]<.06)continue;
      const p=pj(px,py);if(!vis(px,py,p))continue;const len=clamp(g*2600,3,10),q=pj(px-gx/g*len,py-gy/g*len);
      ((gx*.85+gy*.7)>0?hl:hd).push([p,q])}
    c.lineWidth=.9;c.strokeStyle="rgba(62,54,22,.55)";c.beginPath();for(const[p,q]of hd){c.moveTo(p[0],p[1]);c.lineTo(q[0],q[1])}c.stroke();
    c.strokeStyle="rgba(244,232,166,.5)";c.beginPath();for(const[p,q]of hl){c.moveTo(p[0],p[1]);c.lineTo(q[0],q[1])}c.stroke()}
  // 4. objetos (construcoes primeiro; arvores que cobririam uma construcao atras delas sao omitidas)
  const obj=[];const CS=4,SGW=Math.ceil(MW/CS)+1,SGH=Math.ceil(MH/CS)+1,minY=new Float32Array(SGW*SGH).fill(1e9);
  const mark=(x0,y0,x1,y1,yy)=>{const i0=Math.max(0,(x0/CS)|0),i1=Math.min(SGW-1,(x1/CS)|0),j0=Math.max(0,(y0/CS)|0),j1=Math.min(SGH-1,(y1/CS)|0);for(let j=j0;j<=j1;j++)for(let i=i0;i<=i1;i++){const k=j*SGW+i;if(yy<minY[k])minY[k]=yy}};
  const blocked=(x0,y0,x1,y1,yy)=>{const i0=Math.max(0,(x0/CS)|0),i1=Math.min(SGW-1,(x1/CS)|0),j0=Math.max(0,(y0/CS)|0),j1=Math.min(SGH-1,(y1/CS)|0);for(let j=j0;j<=j1;j++)for(let i=i0;i<=i1;i++)if(minY[j*SGW+i]<yy-1)return true;return false};
  for(const b of W.B){const p=pj(b.x,b.y);if(!vis(b.x,b.y,p))continue;const q=Object.assign({},b,{x:p[0],y:p[1]+(b.k===1?b.D*.3:0)});obj.push(q);
    const rr=b.k===1?b.L*.9+b.D*.8:b.k===3?30:b.k===2?24:b.k===8?11:5,hh=b.k===1?b.H+b.R+b.D*.5+3:b.k===3?36:b.k===2?28:b.k===8?21:6;mark(q.x-rr,q.y-hh,q.x+rr,q.y+3,q.y)}
  for(const wl of W.walls){const pp=wl.pts.map(p=>pj(p[0],p[1])),NP=pp.length;
    wl.segs.forEach((s,i)=>{const a=pp[i],b=pp[(i+1)%NP],yy=Math.max(a[1],b[1]);if(s.sea)return;
      if(s.water){obj.push({k:9,a,b,y:yy},{k:5,x:a[0],y:a[1]+.6,g:0},{k:5,x:b[0],y:b[1]+.6,g:0})}
      else if(s.gate){const m1=[lerp(a[0],b[0],.32),lerp(a[1],b[1],.32)],m2=[lerp(a[0],b[0],.68),lerp(a[1],b[1],.68)];obj.push({k:4,a,b:m1,y:Math.max(a[1],m1[1])},{k:4,a:m2,b,y:Math.max(b[1],m2[1])},{k:5,x:m1[0],y:m1[1]+.6,g:1},{k:5,x:m2[0],y:m2[1]+.6,g:1})}
      else{obj.push({k:4,a,b,y:yy});if(i%3===0)obj.push({k:5,x:a[0],y:a[1]+.5,g:0})}
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
      if(!rk&&!bs)continue;const p=pj(px,py);if(!vis(px,py,p))continue;
      if(rk){const sc=.6+rng()*.5;if(!blocked(p[0]-8*sc,p[1]-12*sc,p[0]+8*sc,p[1],p[1]))obj.push({k:11,x:p[0],y:p[1],s:sc,st:stamps.rock[(rng()*stamps.rock.length)|0]})}
      else{const sc=.7+rng()*.45;if(!blocked(p[0]-9*sc,p[1]-13*sc,p[0]+9*sc,p[1],p[1]))obj.push({k:12,x:p[0],y:p[1],s:sc,st:stamps.bush[(rng()*stamps.bush.length)|0]})}}}
  const sx=8,syw=sx/TILT;
  for(let y=4;y<WY-2;y+=syw)for(let x=2;x<WX-2;x+=sx){const px=x+(rng()-.5)*sx*1.1,py=y+(rng()-.5)*syw*1.1;if(px<1||py<1||px>=WX-1||py>=WY-1)continue;
    const i=(py|0)*WX+(px|0),fo=F[i];const lone=rng()<.009&&sampleGrid(W.dist,px,py)>20&&LF[i]>.05;
    if(!(fo>.32&&rng()<fo*1.15)&&!lone)continue;if(occAt(px,py))continue;
    const p=pj(px,py);if(!vis(px,py,p))continue;const sc=(lone?.82:.64)+rng()*.36,w=34*sc,h=38*sc;if(blocked(p[0]-w*.32,p[1]-h*.85,p[0]+w*.32,p[1],p[1]))continue;
    const con=V[i]>.56&&E[i]>.22&&rng()<.85;obj.push({y:p[1],x:p[0],k:0,s:sc,st:con?stamps.con[(rng()*stamps.con.length)|0]:stamps.dec[(rng()*stamps.dec.length)|0]})}
  for(const e of W.extra){const p=pj(e[0],e[1]);if(!vis(e[0],e[1],p))continue;const w=34*e[2],h=38*e[2];if(blocked(p[0]-w*.32,p[1]-h*.85,p[0]+w*.32,p[1],p[1]))continue;obj.push({y:p[1],x:p[0],k:0,s:e[2],st:stamps.dec[(rng()*stamps.dec.length)|0]})}
  obj.sort((a,b)=>a.y-b.y);const smoke=[];
  for(const q of obj){
    if(q.k===0){const w=34*q.s,h=38*q.s;c.drawImage(q.st,q.x-w/2,q.y-h*.9,w,h)}
    else if(q.k===1){drawHouse(c,q.x,q.y,q);if(q.smoke)smoke.push([q.x,q.y-q.H-q.R-2])}
    else if(q.k===2){const m=q.big?1.3:1;drawHouse(c,q.x,q.y,{L:17*m,D:8*m,H:6.5*m,R:5.5*m,roof:"tile",wall:"daub",win:1,door:2});drawTower(c,q.x+13*m,q.y-5*m,4.4*m,15*m,9*m,ROOF.tile,WALL.daub)}
    else if(q.k===3){c.save();c.translate(q.x,q.y);c.scale(.8,.8);c.translate(-q.x,-q.y);const st=WALL.stone,rf=ROOF.dark;drawWall(c,[q.x-30,q.y-14],[q.x,q.y-28],8);drawWall(c,[q.x,q.y-28],[q.x+30,q.y-14],8);
      drawTower(c,q.x,q.y-27,5.5,17,7,rf,st);drawTower(c,q.x-30,q.y-13,5.5,15,6,rf,st);drawTower(c,q.x+30,q.y-13,5.5,15,6,rf,st);
      drawHouse(c,q.x+6,q.y-4,{L:27,D:13,H:11,R:7,roof:"dark",wall:"stone",win:1,door:2,chim:1});drawTower(c,q.x-15,q.y+1,7.5,25,0,rf,st,true);
      drawWall(c,[q.x-30,q.y-13],[q.x,q.y+4],8);drawWall(c,[q.x,q.y+4],[q.x+30,q.y-13],8);drawTower(c,q.x,q.y+5,4.6,12,5,rf,st);c.restore()}
    else if(q.k===4)drawWall(c,q.a,q.b,5.5);
    else if(q.k===9)drawWaterWall(c,q.a,q.b,5.5);
    else if(q.k===5)drawTower(c,q.x,q.y+2,q.g?4.4:3.8,q.g?12:9.5,q.g?6:0,ROOF.dark,WALL.stone,!q.g);
    else if(q.k===6){c.lineWidth=.6;poly(c,[[q.x-3,q.y-2.6],[q.x+3,q.y-4],[q.x+3,q.y-1.9],[q.x-3,q.y-.5]],q.col,INK);c.strokeStyle=INK;c.beginPath();c.moveTo(q.x-3,q.y-.5);c.lineTo(q.x-3,q.y+1.2);c.moveTo(q.x+3,q.y-1.9);c.lineTo(q.x+3,q.y);c.stroke()}
    else if(q.k===7){c.fillStyle="#9a9484";c.strokeStyle=INK;c.lineWidth=.7;c.beginPath();c.ellipse(q.x,q.y,3,1.8,0,0,7);c.fill();c.stroke();c.fillStyle="#4e6067";c.beginPath();c.ellipse(q.x,q.y,1.7,.9,0,0,7);c.fill()}
    else if(q.k===10)drawCliff(c,q.x,q.ty,q.w,q.h,rng);
    else if(q.k===11){const w=18*q.s,h=14*q.s;c.drawImage(q.st,q.x-w/2,q.y-h*.85,w,h)}
    else if(q.k===12){const w=20*q.s,h=15*q.s;c.drawImage(q.st,q.x-w/2,q.y-h*.85,w,h)}
    else if(q.k===13)drawShip(c,q.x,q.y,q.big,q.flip);
    else if(q.k===8){c.save();c.translate(q.x,q.y);c.scale(.82,.82);c.translate(-q.x,-q.y);drawMill(c,q.x,q.y,q.rot);c.restore()}}
  for(const s of smoke)drawSmoke(c,s[0],s[1],rng);
  // 6. rotulos
  towns.forEach((t,i)=>{const p=pj(t.x,t.y);banner(c,clamp(p[0],110,MW-130),clamp(p[1]-(i===0?t.core*.72+44:t.core*.55+30),24,MH-20),t.name,i===0||t.kind==="town",rng)});
  // 7. nuvens em gravura
  if(P.clouds>0){const puffs=[],per=2*(MW+MH),cl=P.clouds*1.5;
    for(let s=0;s<per;s+=44){let x,y,nx,ny;if(s<MW){x=s;y=0;nx=0;ny=1}else if(s<MW+MH){x=MW;y=s-MW;nx=-1;ny=0}else if(s<2*MW+MH){x=2*MW+MH-s;y=MH;nx=0;ny=-1}else{x=0;y=per-s;nx=1;ny=0}
      const dc=Math.min(Math.hypot(x,y),Math.hypot(MW-x,y),Math.hypot(x,MH-y),Math.hypot(MW-x,MH-y));
      const d=cl*(fbm(s/230+4,7,3)*190-30+120*Math.exp(-dc/230));if(d<22)continue;
      for(let r=-10;r<d;r+=30+rng()*14){const t=clamp(r/Math.max(d,60),0,1),w=lerp(170,84,t)*(.8+rng()*.4);
        puffs.push({r:r+rng()*10,x:x+nx*r+(rng()-.5)*40,y:y+ny*r+(rng()-.5)*26,w,h:w*(.55+rng()*.12),t})}}
    puffs.sort((a,b)=>a.r-b.r||a.y-b.y);
    for(const p of puffs){const t=p.t,m=(a,b)=>Math.round(lerp(a,b,t));puff(c,p.x,p.y,p.w,p.h,["rgb("+m(158,212)+","+m(158,209)+","+m(142,194)+")","rgb("+m(92,128)+","+m(94,128)+","+m(80,112)+")"],rng)}}
  // 8. envelhecimento e grao
  const vg=c.createRadialGradient(MW/2,MH/2,MH*.45,MW/2,MH/2,MW*.75);vg.addColorStop(0,"rgba(70,45,10,0)");vg.addColorStop(1,"rgba(70,45,10,.3)");c.fillStyle=vg;c.fillRect(0,0,MW,MH);
  const gn=document.createElement("canvas");gn.width=gn.height=160;const gx=gn.getContext("2d"),gd=gx.createImageData(160,160);
  for(let i=0;i<gd.data.length;i+=4){const v=150+rng()*105;gd.data[i]=v;gd.data[i+1]=v*.97;gd.data[i+2]=v*.9;gd.data[i+3]=255}gx.putImageData(gd,0,0);
  c.globalCompositeOperation="multiply";c.globalAlpha=.34;c.fillStyle=c.createPattern(gn,"repeat");c.fillRect(0,0,MW,MH);c.globalAlpha=1;c.globalCompositeOperation="source-over";
  c.restore();
  c.strokeStyle=INK;c.lineWidth=2;c.strokeRect(MX-.5,MY-.5,MW+1,MH+1);c.lineWidth=.8;c.strokeRect(MX-6.5,MY-6.5,MW+13,MH+13);
  c.font='30px "IM Fell English SC","IM Fell English",Georgia,serif';c.textAlign="center";c.textBaseline="middle";c.fillStyle="#1d160d";
  const title=(P.title||("Região de "+(towns[0]?towns[0].name:"Atlas"))).toUpperCase();c.fillText(title,CW/2,31);const tw=c.measureText(title).width/2+22;
  for(const s of[-1,1])poly(c,[[CW/2+s*tw,24],[CW/2+s*tw+6,31],[CW/2+s*tw,38],[CW/2+s*tw-6,31]],"#a8352a");
  return {n:obj.length,b:W.B.filter(b=>b.k===1).length,YB,project:(x,y)=>{const p=pj(x,y);return [p[0]+MX,p[1]+MY]}};
}


window.AtlasGen={simp,generate,render,makeStamps,mulberry,hashStr,CW,CH,MX,MY,MW,MH,WX,WY,TILT,G,NAMES};
})();
