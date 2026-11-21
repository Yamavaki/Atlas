// Atlas - gerador de mapa: taverna de beira de estrada (2 andares + telhado). So artes da Forgotten Adventures do PC.
// Planta em L com alpendre e torre de escada octogonal fundida no canto; terreno do pacote com bordas suaves; comodos mobiliados pelo gerador de zonas.
import {ret,oct,chanf} from "./castelo_planta.js";
export async function gerar(o){const {B,C,MD,V,e}=o,M=e.mapa,log=[];if(e.tamanho&&(M.larg!==46||M.alt!==36))e.tamanho(46,36);
  const SDM=[.5,.35,.1,.05,.08];M.sombra={todos:true,alvos:{objetos:true,paredes:true,portais:true,caminhos:true},sd:SDM.slice()};
  const all=B.buscar({todos:true}),TOD=[];for(const i of all.itens)TOD.push(all.item(i).caminho);const FA=TOD.filter(k=>/\/packs\/FA35/.test(k)),TEX=TOD.filter(k=>/\/packs\/FA35TX/.test(k));
  if(!FA.length)throw new Error("Este gerador usa as artes da Forgotten Adventures. Conecte a pasta de pacotes do Dungeondraft em Minhas artes.");
  const acha=re=>FA.filter(k=>re.test(k)),um=re=>{const L=acha(re);if(!L.length){log.push("faltou "+re);return null}return L[0]},tx=re=>{const L=TEX.filter(k=>re.test(k));if(!L.length){log.push("faltou "+re);return null}return L[0]};
  const R=(()=>{let s=(Math.random()*1e9)|0;return()=>((s=Math.imul(s^s>>>15,2246822519)+0x9e3779b9|0)>>>0)/4294967296})(),esc=L=>L[Math.floor(R()*L.length)];
  const ART=new Map(),FR={S:[0,1],N:[0,-1],L:[1,0],W:[-1,0]};
  const arte=async k=>{if(!k)return null;if(ART.has(k))return ART.get(k);const d=await B.dims(k);if(!d)return null;let f=null;try{f=await C.fichaUma(k)}catch(x){}const nm=k.split("/").pop(),pc=B.pacoteDe(k),fr=C.frente(nm,pc&&pc.autor,f);
    const fv=FR[fr]||(fr==="L|W"?FR.L:FR.S),w=d[0]/256,h=d[1]/256,vis=f&&f.length>=11&&f[4]>f[2]?[f[2]/255,f[3]/255,f[4]/255,f[5]/255]:[0,0,1,1];
    const r={k,w,h,fv,vw:(vis[2]-vis[0])*w,vh:(vis[3]-vis[1])*h,ox:((vis[0]+vis[2])/2-.5)*w,oy:((vis[1]+vis[3])/2-.5)*h};ART.set(k,r);return r};
  const gira=(x,y,r)=>[x*Math.cos(r)-y*Math.sin(r),x*Math.sin(r)+y*Math.cos(r)];let A_=0;const OPS=[];
  const put=async(k,x,y,face,op)=>{op=op||{};const A=await arte(k);if(!A)return null;const r=face?Math.atan2(face[1],face[0])-Math.atan2(A.fv[1],A.fv[0]):(op.r||0),s=op.s||1,c=gira(A.ox*s,A.oy*s,r);
    const it={id:MD.novoId(M),t:MD.texDe(M,k),x:+(x-c[0]).toFixed(3),y:+(y-c[1]).toFixed(3),r:+r.toFixed(4),w:A.w*s,h:A.h*s,l:op.l||200,s:1,sd:SDM.slice()};if(op.c)it.c=op.c;OPS.push({op:"cria",a:A_,k:"objetos",item:it});return Object.assign({},A,{x,y,r,vw:A.vw*s,vh:A.vh*s})};
  const naParede=async(k,x,y,n,op)=>{const A=await arte(k);if(!A)return null;const prof=(Math.abs(A.fv[0])>.5?A.vw:A.vh)*((op&&op.s)||1);return put(k,x+n[0]*(.17+prof/2),y+n[1]*(.17+prof/2),n,op)};
  const sobre=async(b,k,u,v,op)=>{if(!b||!k)return;const g=Math.abs(Math.sin(b.r||0))>.5,bw=g?b.vh:b.vw,bh=g?b.vw:b.vh;return put(k,b.x+u*bw,b.y+v*bh,null,Object.assign({r:R()*6.283,l:310},op||{}))};
  const luz=(x,y,pre,op)=>{const L=MD.LUZES.find(q=>q[0]===pre)||MD.LUZES[0];op=op||{};OPS.push({op:"cria",a:A_,k:"luzes",item:{id:MD.novoId(M),x,y,raio:op.raio||L[2],claro:op.claro||L[3],forca:op.forca||L[4],c:(op.c||L[5]).concat(1),sombras:true}})};
  const PAR=[[],[],[]];const parede=(P,op)=>{op=op||{};const w={id:MD.novoId(M),t:MD.texDe(M,op.t),p:P.map(q=>[q[0],q[1]]),laco:op.laco!==false,raio:0,larg:op.larg||.3,tipo:op.laco===false?1:0,sombra:true,sd:SDM.slice()};OPS.push({op:"cria",a:A_,k:"paredes",item:w});PAR[A_].push(w);return w};
  const piso=(P,t,op)=>{op=op||{};if(t)OPS.push({op:"cria",a:A_,k:"padroes",item:Object.assign({id:MD.novoId(M),t:MD.texDe(M,t),p:P.map(q=>[q[0],q[1]]),l:op.l==null?-40:op.l},op.extra||{})})};
  const PORTA=um(/portals\/Doors\/Door_Wood_Dark_A_1x1\./)||um(/portals\/Doors\/Door_Wood_/),JANELA=um(/portals\/Windows\/.*Window_Wood_Dark.*_1x1\./)||um(/portals\/Windows\//);
  const porta=(x,y,op)=>{op=op||{};for(const w of PAR[A_]){const T=MD.trajeto(w),pj=V.projeta(T,w.laco,x,y);if(pj.dist>.3)continue;const pe=V.pontoEm(T,w.laco,pj.d);
    OPS.push({op:"cria",a:A_,k:"portais",item:{id:MD.novoId(M),t:MD.texDe(M,op.janela?JANELA:PORTA),tipo:op.janela?"janela":op.dupla?"dupla":"porta",parede:w.id,d:+pj.d.toFixed(4),raio:op.dupla?1:.5,fechado:!op.janela,x:pe[0],y:pe[1],dx:pe[2],dy:pe[3],r:Math.atan2(pe[3],pe[2]),sd:SDM.slice()}});return}};
  const exec=nome=>{if(OPS.length)e.hist.exec(OPS.splice(0),{nome})};const espera=ms=>new Promise(r=>setTimeout(r,ms));
  const zona=async(Pz,tipo,rq)=>{e.zonas.criar(Pz,tipo,{riqueza:rq,dens:tipo==="quarto"?.95:.8,bag:.7,paredes:false,fonte:"auto",pacote:"FA35OB01",estilo:""});await espera(150);while(e.zonas.ocupado())await espera(120)};
  // ---------- terreno ----------
  const r=MD.resolucao(M),WM=M.larg*r,HM=M.alt*r,hash=(x,y)=>{let h=Math.imul(x|0,374761393)+Math.imul(y|0,668265263)|0;h=Math.imul(h^h>>>13,1274126177);return ((h^h>>>16)>>>0)/4294967296};
  const vn=(x,y)=>{const x0=Math.floor(x),y0=Math.floor(y),fx=x-x0,fy=y-y0,s=t=>t*t*(3-2*t),a=hash(x0,y0),b=hash(x0+1,y0),c=hash(x0,y0+1),d=hash(x0+1,y0+1);return a+(b-a)*s(fx)+(c-a)*s(fy)+(a-b-c+d)*s(fx)*s(fy)},fbm=(x,y)=>vn(x,y)*.55+vn(x*2.1+7,y*2.1+3)*.3+vn(x*4.3+11,y*4.3+5)*.15;
  const ss=(a,b,x)=>{const t=Math.max(0,Math.min(1,(x-a)/(b-a)));return t*t*(3-2*t)},dSeg=(x,y,a,b)=>{const dx=b[0]-a[0],dy=b[1]-a[1],l=dx*dx+dy*dy;let t=l?((x-a[0])*dx+(y-a[1])*dy)/l:0;t=Math.max(0,Math.min(1,t));return Math.hypot(x-a[0]-dx*t,y-a[1]-dy*t)},dLin=(x,y,L)=>{let m=1e9;for(let i=0;i<L.length-1;i++)m=Math.min(m,dSeg(x,y,L[i],L[i+1]));return m};
  const camada=(nome,t,fn,op)=>{if(!t)return;const c=MD.novaCamada(M,{nome});c.t=MD.texDe(M,t);if(op)Object.assign(c,op);for(let y=0;y<HM;y++)for(let x=0;x<WM;x++){const v=fn((x+.5)/r,(y+.5)/r);if(v>0)c.m[y*WM+x]=Math.min(255,Math.round(v*255))}OPS.push({op:"cria",a:0,k:"camadas",item:c})};
  const A0=M.andares[0],VERDE={mz:18,sat:.85},G1=tx(/terrain\/Grass_Terrain\/Grass_A_01\./),G2=tx(/terrain\/Grass_Terrain\/Grass_Short_A_01\./),G3=tx(/terrain\/Grass_Terrain\/Grass_A_05\./),TERRA=tx(/terrain\/Dirt_Terrain\/Dirt_(A|B)_0\d\./);
  if(A0.camadas&&A0.camadas[0]&&G1){const c0=A0.camadas[0],de=MD.foto(c0);OPS.push({op:"muda",a:0,k:"camadas",id:c0.id,de,para:Object.assign({},de,{t:MD.texDe(M,G1),nome:"Grama"},VERDE)})}
  const ESTRADA=[[0,30.5],[12,29.6],[24,30.4],[36,29.8],[46,30.6]],ATALHO=[[19,25],[19.3,27.5],[19,30]],FUNDOS=[[37,11.5],[40,12],[43,9]];
  camada("Grama curta",G2,(x,y)=>ss(.45,.65,fbm(x*.09,y*.09)),VERDE);camada("Grama alta",G3,(x,y)=>ss(.6,.78,fbm(x*.14+20,y*.14)),VERDE);
  camada("Estrada e trilhas",TERRA,(x,y)=>{let v=0;for(const [L,w] of [[ESTRADA,1.7],[ATALHO,1.1],[FUNDOS,.9]]){const d=dLin(x,y,L)+.7*(fbm(x*.7,y*.7)-.5);v=Math.max(v,1-ss(w-.5,w+.5,d))}return v});
  exec("Taverna · terreno");
  // ---------- planta ----------
  const SALAO=ret(10,10,28,22),ALA=ret(28,8,37,20),ALP=chanf(16,22,22,25,1,["se","so"]),TORRE=oct(10,10,3,1);
  let fora=V.uniao(SALAO,ALA).fora;fora=V.uniao(fora,TORRE).fora;const fora1=fora;fora=V.uniao(fora,ALP).fora;
  const W_P=um(/walls\/Walls_Stone\/Walls_Stone_A\/Wall_Stone_Earthy_A\./)||um(/walls\/Walls_Stone\//),W_M=um(/walls\/Walls_Wood\/Walls_Wood_A\/Wall_Wood_Dark_A\./)||W_P;
  const P_MAD=tx(/Wood_Pattern\/Wood_Walnut_Flooring_B\./)||tx(/Wood_Pattern\//),P_MAD2=tx(/Wood_Pattern\/Wood_Dark_Flooring_D\./)||P_MAD,P_PED=tx(/patterns\/.*Stone_Tiles_F_Earthy|patterns\/.*Flat_Stone_Floor_A_Earthy/)||tx(/Stone_Tiles?_Large/),P_COB=tx(/patterns\/.*Cobblestone_A_Earthy/)||P_PED;
  A_=0;parede(fora,{t:W_P,larg:.35});parede([[28,10],[28,20]],{t:W_M,laco:false,larg:.22});parede([[28,14],[37,14]],{t:W_M,laco:false,larg:.22});
  piso(SALAO,P_MAD);piso(ALP,P_COB,{l:-39});piso(ret(28,8,37,14),P_PED);piso(ret(28,14,37,20),P_PED);piso(TORRE,P_PED,{l:-38});
  porta(19,25,{dupla:true});porta(28,12.5);porta(32.5,14);porta(37,11.5);for(const x of [14.5,19.5,23.5])porta(x,10,{janela:true});for(const x of [12.5,25.5])porta(x,22,{janela:true});porta(37,17.5,{janela:true});porta(32.5,8,{janela:true});
  const escada=um(/Stairs_Spiral\/.*Spiral_Staircase_.*_3x3\./);if(escada)await put(escada,9.6,9.6,null,{l:190});
  // fora: poco, carroca, barris, lenha, arvores, flores e tufos
  {const poco=um(/Wells\/Well_Stone_.*_A1_2x2\./)||um(/Wells\//);if(poco)await put(poco,41,24,null);const car=um(/Carts\/Cart_Wood_.*_2x3\./)||um(/Carts\//);if(car)await put(car,41,15.5,[1,0]);
    const bar=acha(/Barrels\/Barrel_Wood_.*_A1_1x1\./);for(const [x,y] of [[38,9.4],[38.9,9.5],[38.4,10.3]])if(bar.length)await put(esc(bar),x,y,null,{r:R()*6.28});
    const len=um(/Firewood|Log_Pile|Wood_Pile/);if(len)await put(len,38,19,null,{r:1.57});
    const arv=acha(/Tree_Tops\/Tree_Colorable_[A-D]\d_[5-8]x[5-8]\./),verdes=[[.17,.26,.17],[.2,.3,.18],[.24,.32,.19],[.19,.28,.22]];
    for(const [x,y] of [[3,4],[6,16],[2,24],[44,3],[43,34],[30,34],[8,34],[40,28.5]])if(arv.length)await put(esc(arv),x+R()*1.5,y+R()*1.5,null,{r:R()*6.28,l:900,c:esc(verdes)});
    const TUFO=acha(/Flora\/Grass_Patches\/Grass_Patch_Green\d_/),CAP=acha(/Plants\/Long_Grass\/(Long_Grass|Oats)_Green_/),ARB=acha(/Flora\/Bushes\/Bush_Green_/),FL=acha(/Flora\/Flowers\/Flower_(White|Yellow|Purple)_/);
    const pip=(Q,x,y)=>{let c=false;for(let i=0,j=Q.length-1;i<Q.length;j=i++){const a=Q[i],b=Q[j];if((a[1]>y)!==(b[1]>y)&&x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0])c=!c}return c};
    for(let y=.8;y<M.alt;y+=1.1)for(let x=.8;x<M.larg;x+=1.1){const px=x+(R()-.5)*.8,py=y+(R()-.5)*.8;if(pip(fora,px,py)||px>7&&px<40&&py>6&&py<27)continue;if(dLin(px,py,ESTRADA)<2.2||dLin(px,py,ATALHO)<1.5||dLin(px,py,FUNDOS)<1.3)continue;if(Math.hypot(px-41,py-24)<2||Math.hypot(px-41,py-15.5)<2.5)continue;
      const d=fbm(px*.17,py*.17),rr=R();let k=null,l=110;if(d>.6&&rr<.6&&FL.length){k=esc(FL);l=120}else if(rr<.2+.3*d&&TUFO.length)k=esc(TUFO);else if(rr<.3+.3*d&&CAP.length){k=esc(CAP);l=130}else if(rr<.34+.2*d&&ARB.length){k=esc(ARB);l=200}if(k)await put(k,px,py,null,{r:R()*6.28,l})}
    const lp=um(/Street_Lamps\/Lamp_Metal_.*_1x1\./);if(lp){await put(lp,16.6,25.6,null);luz(16.6,25.6,"lampiao",{raio:5})}}
  exec("Taverna · térreo");await espera(200);
  await zona(ret(10.2,10.2,27.8,21.8),"taverna",2);await zona(ret(28.2,8.2,36.8,13.8),"cozinha",2);await zona(ret(28.2,14.2,36.8,19.8),"despensa",1);
  // ---------- 1o andar: quartos ----------
  const a1=M.andares.length>1?1:e.novoAndar("1º andar · quartos");for(const k of MD.TIPOS)if(!M.andares[a1][k])M.andares[a1][k]=[];A_=a1;
  parede(fora1,{t:W_M,larg:.3});for(const L of [[[12.6,15],[28,15]],[[12.6,17],[28,17]],[[20,10],[20,15]],[[19,17],[19,22]],[[28,8],[28,20]]])parede(L,{t:W_M,laco:false,larg:.2});
  piso(fora1,P_MAD2);piso(TORRE,P_PED,{l:-38});
  for(const [x,y] of [[17,15],[24,15],[15,17],[23.5,17],[28,16]])porta(x,y);for(const x of [14.5,23.5])porta(x,10,{janela:true});for(const x of [12.5,25.5])porta(x,22,{janela:true});porta(37,17.5,{janela:true});
  if(escada)await put(escada,9.6,9.6,null,{l:190});{const tp=um(/Rugs_and_Carpets\/.*Runner.*_\dx\d\./);if(tp)await put(tp,20,16,[1,0],{l:100})}
  {const vs=acha(/Potted_Plant_.*Green.*_1x1\.|Potted_Plant_Multicolor1_A\d_1x1\./),cm=um(/Chests\/Chest_Wood_Dark_[A-D]_1x1\./),cand=um(/Candles\/Candle_Wax\/Candle_(White|Yellow)_Wax_A\d_1x1\./),arm=um(/Wardrobes?\/.*_2x1\.|Cabinets?\/.*Wood_Dark.*_2x1\./);
    for(const x of [14,22,26.5])luz(x,16,"vela",{raio:3.5,claro:1.4});if(vs.length){await put(esc(vs),13.2,15.6,null);await put(esc(vs),27.4,16.4,null)}if(cm)await naParede(cm,21,15,[0,1]);if(arm)await naParede(arm,12.6,16,[1,0],{s:.8});if(cand)await put(cand,13.2,16.4,null,{l:310})}
  exec("Taverna · 1º andar");await espera(200);
  for(const Q of [ret(13.2,10.2,19.8,14.8),ret(20.2,10.2,27.8,14.8),ret(10.2,17.2,18.8,21.8),ret(19.2,17.2,27.8,21.8)])await zona(Q,"quarto",2);await zona(ret(28.2,8.2,36.8,19.8),"quarto",3);
  // telhado do alpendre neste andar
  const TELHA=tx(/Roof_Texture_Wood_Dark_Shingle_A1\./)||tx(/Roof_Texture_/),CUME=um(/paths\/.*Roof_Hip_Shingles_Brown\./);
  OPS.push({op:"cria",a:A_,k:"telhados",item:{id:MD.novoId(M),p:ALP,t:MD.texDe(M,TELHA),estilo:"duas"}});exec("Taverna · telhado do alpendre");
  // ---------- 2o andar: telhado ----------
  const a2=M.andares.length>2?2:e.novoAndar("Telhado");for(const k of MD.TIPOS)if(!M.andares[a2][k])M.andares[a2][k]=[];A_=a2;
  OPS.push({op:"cria",a:A_,k:"telhados",item:{id:MD.novoId(M),p:fora1,t:MD.texDe(M,TELHA),tq:CUME?MD.texDe(M,CUME):undefined,alas:[{x0:10,y0:10,x1:28,y1:22,tipo:"quatro",eixo:"x"},{x0:28,y0:8,x1:37,y1:20,tipo:"duas",eixo:"y"}],furos:[TORRE]}});
  const cone=um(/Towers\/Roof_A\/Roof_A1_Wood_Dark_Brown_Tower_Octagon_C\./)||um(/Towers\/Roof_A\/.*Tower_Octagon_C\./);if(cone)OPS.push({op:"cria",a:A_,k:"telhados",item:{id:MD.novoId(M),p:TORRE,arte:MD.texDe(M,cone),t:MD.texDe(M,TELHA),escArte:1.12}});
  exec("Taverna · telhado");
  M.andares[0].nome="Térreo";e.irPara(0);e.render.carregar(M);await espera(300);await e.artesPC().espera();
  return {andares:M.andares.map(A=>A.nome),objetos:M.andares.map(A=>(A.objetos||[]).length),falta:log}}
