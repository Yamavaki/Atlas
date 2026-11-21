// Atlas - gerador de mapa: acampamento numa clareira da floresta, com riacho, ponte, trilha, ruinas e arvores por cima de tudo.
// So artes da Forgotten Adventures do PC; terreno do pacote em camadas com bordas suaves.
export async function gerar(o){const {B,C,MD,e}=o,M=e.mapa,log=[];if(e.tamanho&&(M.larg!==50||M.alt!==40))e.tamanho(50,40);
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
  const luz=(x,y,pre,op)=>{const L=MD.LUZES.find(q=>q[0]===pre)||MD.LUZES[0];op=op||{};OPS.push({op:"cria",a:A_,k:"luzes",item:{id:MD.novoId(M),x,y,raio:op.raio||L[2],claro:op.claro||L[3],forca:op.forca||L[4],c:(op.c||L[5]).concat(1),sombras:true}})};
  const exec=nome=>{if(OPS.length)e.hist.exec(OPS.splice(0),{nome})};
  // ---------- terreno ----------
  const r=MD.resolucao(M),WM=M.larg*r,HM=M.alt*r,hash=(x,y)=>{let h=Math.imul(x|0,374761393)+Math.imul(y|0,668265263)|0;h=Math.imul(h^h>>>13,1274126177);return ((h^h>>>16)>>>0)/4294967296};
  const vn=(x,y)=>{const x0=Math.floor(x),y0=Math.floor(y),fx=x-x0,fy=y-y0,s=t=>t*t*(3-2*t),a=hash(x0,y0),b=hash(x0+1,y0),c=hash(x0,y0+1),d=hash(x0+1,y0+1);return a+(b-a)*s(fx)+(c-a)*s(fy)+(a-b-c+d)*s(fx)*s(fy)},fbm=(x,y)=>vn(x,y)*.55+vn(x*2.1+7,y*2.1+3)*.3+vn(x*4.3+11,y*4.3+5)*.15;
  const ss=(a,b,x)=>{const t=Math.max(0,Math.min(1,(x-a)/(b-a)));return t*t*(3-2*t)},dSeg=(x,y,a,b)=>{const dx=b[0]-a[0],dy=b[1]-a[1],l=dx*dx+dy*dy;let t=l?((x-a[0])*dx+(y-a[1])*dy)/l:0;t=Math.max(0,Math.min(1,t));return Math.hypot(x-a[0]-dx*t,y-a[1]-dy*t)},dLin=(x,y,L)=>{let m=1e9;for(let i=0;i<L.length-1;i++)m=Math.min(m,dSeg(x,y,L[i],L[i+1]));return m};
  const camada=(nome,t,fn,op)=>{if(!t)return;const c=MD.novaCamada(M,{nome});c.t=MD.texDe(M,t);if(op)Object.assign(c,op);for(let y=0;y<HM;y++)for(let x=0;x<WM;x++){const v=fn((x+.5)/r,(y+.5)/r);if(v>0)c.m[y*WM+x]=Math.min(255,Math.round(v*255))}OPS.push({op:"cria",a:0,k:"camadas",item:c})};
  const VERDE={mz:18,sat:.85},A0=M.andares[0],MATA=tx(/terrain\/Forest_Terrain\/Leaves_A_01\./)||tx(/terrain\/Forest_Terrain\//),G1=tx(/terrain\/Grass_Terrain\/Grass_A_01\./),G2=tx(/terrain\/Grass_Terrain\/Grass_Short_A_01\./),TERRA=tx(/terrain\/Dirt_Terrain\/Dirt_(A|B)_0\d\./),LAMA=tx(/terrain\/Dirt_Terrain\/Grassy_Dirt_A_0\d\./)||TERRA,
    AG=tx(/terrain\/Water_Terrain\/Water_Opaque_A_02\./)||tx(/terrain\/Water_Terrain\/Water_Opaque/),AGR=tx(/terrain\/Water_Terrain\/Water_Still_A_02\./)||AG;
  if(A0.camadas&&A0.camadas[0]&&MATA){const c0=A0.camadas[0],de=MD.foto(c0);OPS.push({op:"muda",a:0,k:"camadas",id:c0.id,de,para:Object.assign({},de,{t:MD.texDe(M,MATA),nome:"Chão da mata"},VERDE)})}
  const CX=24,CY=19,clara=(x,y)=>1-ss(7.5,11,Math.hypot((x-CX)*1,(y-CY)*1.15)+3*(fbm(x*.18,y*.18)-.5));
  const RIO=[[38,-1],[37,6],[39.5,12],[38,19],[40.5,26],[39,33],[41,41]],TRILHA=[[-1,24],[8,22.5],[16,21],[CX,CY],[31,17.5],[38.6,16],[46,14],[51,13]];
  camada("Grama da clareira",G1,clara,VERDE);camada("Grama curta",G2,(x,y)=>clara(x,y)*ss(.5,.7,fbm(x*.12,y*.12)),VERDE);
  camada("Trilha",TERRA,(x,y)=>{const d=dLin(x,y,TRILHA)+.7*(fbm(x*.7,y*.7)-.5);return 1-ss(.6,1.5,d)});
  camada("Fogueira e terra batida",TERRA,(x,y)=>1-ss(1.8,3.4,Math.hypot(x-CX,y-CY)+1.2*(fbm(x*.5,y*.5)-.5)));
  camada("Margem",LAMA,(x,y)=>1-ss(1.6,3.2,dLin(x,y,RIO)+1.2*(fbm(x*.4,y*.4)-.5)));
  camada("Riacho",AG,(x,y)=>1-ss(.9,1.6,dLin(x,y,RIO)+.6*(fbm(x*.3,y*.3)-.5)));camada("Riacho raso",AGR,(x,y)=>{const d=dLin(x,y,RIO)+.6*(fbm(x*.3,y*.3)-.5);return ss(.4,1,d)*(1-ss(1.3,1.9,d))});
  exec("Floresta · terreno");
  // ---------- acampamento ----------
  const fog=um(/Campfires?\/.*Campfire_.*_Lit_.*_1x1\.|Campfire.*_1x1\./);if(fog){await put(fog,CX,CY,null);luz(CX,CY,"lareira",{raio:9,claro:3.5})}
  const tenda=acha(/Tents\/Tent_.*_\dx\d\./),saco=acha(/Bedrolls?\/Bedroll_.*_1x2\./),tronco=acha(/Logs\/Log_.*_\dx1\./),caixa=acha(/Crates\/Crate_Wood_.*_1x1\./),bar=acha(/Barrels\/Barrel_Wood_.*_A1_1x1\./),pan=um(/Cooking_Pot|Cauldron_Metal_Gray_Filled_A1_1x1\./);
  for(const [x,y,f] of [[CX-6,CY-3,[1,.4]],[CX+5.5,CY-4,[-1,.5]],[CX-4,CY+5.5,[.6,-1]]])if(tenda.length)await put(esc(tenda),x,y,f);
  for(const [x,y,f] of [[CX-2.8,CY+.5,[1,0]],[CX+2.8,CY-.3,[-1,0]],[CX+.4,CY+2.9,[0,-1]],[CX-.2,CY-2.8,[0,1]]])if(tronco.length)await put(esc(tronco),x,y,[f[1],-f[0]]);
  for(const [x,y,f] of [[CX+3.5,CY+3.5,[-1,-1]],[CX-1.5,CY+4.2,[0,-1]]])if(saco.length)await put(esc(saco),x,y,f);if(pan)await put(pan,CX+.9,CY+.6,null,{l:220});
  for(const [x,y] of [[CX+7,CY+1],[CX+7.8,CY+1.6],[CX+7.2,CY+2.3]])if(caixa.length&&R()<.9)await put(esc(R()<.5||!bar.length?caixa:bar),x,y,null,{r:R()*.4});
  const carroca=um(/Carts\/Cart_Wood_.*_2x3\./);if(carroca)await put(carroca,CX+8,CY-6,[1,.3]);const cavalo=um(/Horses?\/Horse_.*_\dx\d\./);if(cavalo)await put(cavalo,CX+10.5,CY-4,[0,1]);
  // ruinas: colunas e pedras caidas a oeste; ponte sobre o riacho
  const col=acha(/Pillars\/Pillar_Stone_.*_1x1\./),ped=acha(/Boulders\/Boulder_Stone_Mossy_.*_\dx\d\./);for(const [x,y] of [[8,9],[11,9],[8,12.5],[11.5,13]])if(col.length&&R()<.8)await put(esc(col),x,y,null,{r:R()*6.28});
  for(let i=0;i<10;i++)if(ped.length)await put(esc(ped),4+R()*44,R()*40,null,{r:R()*6.28});
  const ponte=um(/Bridges\/Bridge_Wood_.*_\dx\d\./);if(ponte)await put(ponte,38.6,16.1,[1,-.2],{l:150});
  // arvores fora da clareira (camada alta), arbustos e flora na clareira
  const arv=acha(/Tree_Tops\/Tree_Colorable_[A-D]\d_[5-8]x[5-8]\./),verdes=[[.17,.26,.17],[.2,.3,.18],[.15,.23,.2],[.24,.32,.19],[.19,.28,.22]],ARB=acha(/Flora\/Bushes\/Bush_Green_/),TUFO=acha(/Flora\/Grass_Patches\/Grass_Patch_Green\d_/),FETO=acha(/Plants\/Ferns\/Fern_Green_/),FL=acha(/Flora\/Flowers\/Flower_(White|Yellow|Purple)_/),COG=acha(/Mushrooms_Small\/Mushroom_(Brown|Tan)_/),TAB=acha(/Cattails\/Cattail_Brown_/);
  const livre=(x,y)=>dLin(x,y,TRILHA)>1.6&&dLin(x,y,RIO)>2&&Math.hypot(x-CX,y-CY)>4;
  for(let y=.6;y<M.alt;y+=1)for(let x=.6;x<M.larg;x+=1){const px=x+(R()-.5)*.8,py=y+(R()-.5)*.8;if(!livre(px,py))continue;const cl=clara(px,py),rr=R();let k=null,l=110;
    if(cl>.5){if(rr<.12&&FL.length){k=esc(FL);l=120}else if(rr<.3&&TUFO.length)k=esc(TUFO)}else{if(rr<.18&&FETO.length){k=esc(FETO);l=150}else if(rr<.26&&ARB.length){k=esc(ARB);l=200}else if(rr<.3&&COG.length)k=esc(COG)}if(k)await put(k,px,py,null,{r:R()*6.28,l})}
  for(let i=0;i<40;i++){const t=i/40,j=Math.floor(t*(RIO.length-1)),f=t*(RIO.length-1)-j,a=RIO[j],b=RIO[j+1],x=a[0]+(b[0]-a[0])*f+(R()<.5?-1:1)*(1.3+R()*.6),y=a[1]+(b[1]-a[1])*f;if(TAB.length&&R()<.7)await put(esc(TAB),x,y,null,{r:R()*6.28,l:150})}
  for(let i=0;i<70;i++){const x=R()*M.larg,y=R()*M.alt;if(clara(x,y)>.25||dLin(x,y,RIO)<2.5||dLin(x,y,TRILHA)<2)continue;if(arv.length)await put(esc(arv),x,y,null,{r:R()*6.28,l:900,c:esc(verdes),s:.9+R()*.4})}
  exec("Floresta · acampamento");
  M.andares[0].nome="Chão";e.irPara(0);e.render.carregar(M);await new Promise(r=>setTimeout(r,300));await e.artesPC().espera();
  return {andares:M.andares.map(A=>A.nome),objetos:M.andares.map(A=>(A.objetos||[]).length),falta:log}}
