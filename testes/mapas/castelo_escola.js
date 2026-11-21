// Atlas - mapa gerado pelo Claude: castelo-escola de magia (v2). Roda no editor aberto com as artes do PC: gerar({B,C,MD,V,e}).
// Regras (INSTRUCOES_GERAR_MAPAS + GOSTO_DO_GUSTAVO adaptadas ao Atlas):
// - planta com volumes de tamanhos diferentes, torres octogonais fundidas nos cantos, abside, sacadas a 45° (castelo_planta.js);
// - parede externa = uma volta so; paredes internas abertas; cada comodo com o piso dele;
// - andar 1 = andar de cima das torres + telhado do resto (como no Dungeondraft); andar 2 = telhado das torres;
// - terreno so com texturas do pacote, em camadas com mascara de bordas suaves (caminhos, margem do lago, manchas de grama);
// - item de mesa EM CIMA da mesa; luz onde ha fonte; arvores coloriveis em verdes (sem carnaval).
import {planta,ret,oct,chanf} from "./castelo_planta.js";
export async function gerar(o){const {B,C,MD,V,e}=o,M=e.mapa,log=[];const P=planta();if(e.tamanho&&(M.larg!==112||M.alt!==88))e.tamanho(112,88);
  // ---------- artes ----------
  const all=B.buscar({todos:true}),TOD=[];for(const i of all.itens)TOD.push(all.item(i).caminho);
  const FA=TOD.filter(k=>/\/packs\/FA35/.test(k));
  const acha=re=>FA.filter(k=>re.test(k)),um=(re,i)=>{const L=acha(re);if(!L.length){log.push("FALTOU "+re);return null}return L[(i||0)%L.length]};
  const R=(()=>{let s=4242;return()=>((s=Math.imul(s^s>>>15,2246822519)+0x9e3779b9|0)>>>0)/4294967296})(),esc=L=>L[Math.floor(R()*L.length)];
  const ART=new Map(),FR={S:[0,1],N:[0,-1],L:[1,0],W:[-1,0]};
  const arte=async k=>{if(!k)return null;if(ART.has(k))return ART.get(k);const d=await B.dims(k);if(!d)return null;let f=null;try{f=await C.fichaUma(k)}catch(x){}const nm=k.split("/").pop(),pc=B.pacoteDe(k),fr=C.frente(nm,pc&&pc.autor,f);
    const fv=FR[fr]||(fr==="L|W"?FR.L:FR.S),w=d[0]/256,h=d[1]/256,vis=f&&f.length>=11&&f[4]>f[2]?[f[2]/255,f[3]/255,f[4]/255,f[5]/255]:[0,0,1,1];
    const r={k,w,h,fv,vis,vw:(vis[2]-vis[0])*w,vh:(vis[3]-vis[1])*h,ox:((vis[0]+vis[2])/2-.5)*w,oy:((vis[1]+vis[3])/2-.5)*h};ART.set(k,r);return r};
  const gira=(x,y,r)=>[x*Math.cos(r)-y*Math.sin(r),x*Math.sin(r)+y*Math.cos(r)];
  const OPS=[[],[],[]];let A_=0;const ops=()=>OPS[A_];
  // poe a arte com o CENTRO DESENHADO em (x,y), frente para "face"; op: l camada, s escala, m espelho, r giro, c cor (coloriveis)
  const put=async(k,x,y,face,op)=>{op=op||{};const A=await arte(k);if(!A)return null;const r=face?Math.atan2(face[1],face[0])-Math.atan2(A.fv[1],A.fv[0]):(op.r||0),s=op.s||1,c=gira(A.ox*(op.m?-1:1)*s,A.oy*s,r);
    const it={id:MD.novoId(M),t:MD.texDe(M,k),x:+(x-c[0]).toFixed(3),y:+(y-c[1]).toFixed(3),r:+r.toFixed(4),w:A.w*s,h:A.h*s,l:op.l||200,s:1};if(op.m)it.m=1;if(op.c)it.c=op.c;
    ops().push({op:"cria",a:A_,k:"objetos",item:it});return Object.assign({},A,{x,y,r,s,vw:A.vw*s,vh:A.vh*s})};
  const naParede=async(k,x,y,n,op)=>{const A=await arte(k);if(!A)return null;const s=(op&&op.s)||1,prof=(Math.abs(A.fv[0])>.5?A.vw:A.vh)*s;return put(k,x+n[0]*(.16+prof/2),y+n[1]*(.16+prof/2),n,op)};
  // em cima de uma peca ja posta (u,v de -0.5 a 0.5 da area desenhada, em coordenadas do mapa)
  const sobre=async(base,k,u,v,op)=>{if(!base||!k)return;const giro=Math.abs(Math.sin(base.r||0))>.5,bw=giro?base.vh:base.vw,bh=giro?base.vw:base.vh;
    return put(k,base.x+u*bw,base.y+v*bh,null,Object.assign({r:R()*6.283,l:310},op||{}))};
  const luz=(x,y,pre,op)=>{const L=MD.LUZES.find(q=>q[0]===pre)||MD.LUZES[0];op=op||{};ops().push({op:"cria",a:A_,k:"luzes",item:{id:MD.novoId(M),x,y,raio:op.raio||L[2],claro:op.claro||L[3],forca:op.forca||L[4],c:(op.c||L[5]).concat(1),sombras:true}})};
  const TEX=TOD.filter(k=>/\/packs\/FA35TX/.test(k)),tx=(re,i)=>{const L=TEX.filter(k=>re.test(k));if(!L.length){log.push("FALTOU "+re);return null}return L[(i||0)%L.length]};
  // ---------- materiais ----------
  const W_EXT=um(/walls\/Walls_Stone\/Walls_Stone_A\/Wall_Stone_Slate_A\./)||um(/walls\/Walls_Stone\/.*Slate/),W_INT=um(/walls\/Walls_Brick\/.*Wall_Brick_Slate_A\./)||W_EXT,W_MAD=um(/walls\/Walls_Wood\/Walls_Wood_A\/Wall_Wood_Dark_A\./),W_MADC=um(/Wall_Wood_Ashen_A\./)||W_MAD;
  const PISO={diag:tx(/patterns\/.*Stone_Diagonal_Tiles_Earthy_A1\./),marmore:tx(/patterns\/.*Marble.*Black/)||tx(/Stone_Tiles?_Large/),marmore2:tx(/patterns\/.*Marble.*White/)||tx(/Stone_Patterned/),
    mad1:tx(/Wood_Pattern\/Wood_Walnut_Flooring_B\./),mad2:tx(/Wood_Pattern\/Wood_Dark_Flooring_D\./),mad3:tx(/Wood_Pattern\/Wood_Ashen_Flooring_C\./),pedra:tx(/patterns\/.*Flat_Stone_Floor_A_Slate|patterns\/.*Stone_Tiles_E_Slate/)||tx(/Stone_Tiles?_Large/),
    pedraClara:tx(/patterns\/.*Stone_Tiles_F_Earthy|patterns\/.*Stone_Square_Tiles_Earthy/),pedraEscura:tx(/patterns\/.*Dwarven_Stone_A_Slate|patterns\/.*Cobblestone_A_Slate/),quadrada:tx(/Stone_Square_Tiles_Slate|Stone_Square_Tiles_Earthy/),
    corredor:tx(/patterns\/.*Stone_Tiles_G_Slate|patterns\/.*Rectangular_Tiles.*Slate/)||tx(/Stone_Tiles?_Large/),terra:tx(/patterns\/normal\/Dirt_Pattern\/Dirt_A/)||tx(/Dirt_Pattern\//),cobb:tx(/patterns\/.*Cobblestone_A_Slate|patterns\/.*Cobblestone_A_Earthy/)};
  for(const k in PISO)if(!PISO[k])PISO[k]=PISO.pedra||tx(/Stone_Tiles?_Large/);
  const TELHA=tx(/Roof_Texture_Slate_Black_A1\./),TELHA_M=tx(/Roof_Texture_Wood_Dark_Shingle_A1\./)||TELHA,TELHA_V=tx(/Roof_Texture_Tile_Green_A1\./)||TELHA;
  const CUME=um(/paths\/.*Roof_Hip_Shingles_Gray\./),CUME_V=um(/paths\/.*Roof_Hip_Shingles_DarkGreen\./)||CUME;
  const CONE=c=>um(new RegExp("Towers/Roof_A/Roof_A_"+c+"_Tower_Octagon_C\\."))||um(/Towers\/Roof_A\/Roof_A_Gray_Tower_Octagon_C\./);
  const PORTA=um(/portals\/Doors\/Door_Wood_Dark_A_1x1\./)||um(/portals\/Doors\/Door_Wood_/),PORTA2=um(/portals\/Doors\/Door_Wood_Dark_.*2x1\./)||PORTA,JANELA=um(/portals\/Windows\/Arrowslits\/Arrowslit_Stone_Earthy_A1_1x1\./)||um(/portals\/Windows\//);
  // ---------- paredes, pisos, portas ----------
  const PAR=[[],[],[]];
  const parede=(Pp,op)=>{op=op||{};const w={id:MD.novoId(M),t:MD.texDe(M,op.t||W_EXT),p:Pp.map(q=>[q[0],q[1]]),laco:op.laco!==false,raio:op.raio==null?.1:op.raio,larg:op.larg||.3,tipo:op.laco===false?1:0,sombra:true};ops().push({op:"cria",a:A_,k:"paredes",item:w});PAR[A_].push(w);return w};
  const piso=(Pp,tex,op)=>{op=op||{};ops().push({op:"cria",a:A_,k:"padroes",item:Object.assign({id:MD.novoId(M),t:MD.texDe(M,tex),p:Pp.map(q=>[q[0],q[1]]),l:op.l==null?-40:op.l},op.extra||{})})};
  const porta=(x,y,op)=>{op=op||{};for(const w of PAR[A_]){const T=MD.trajeto(w),pj=V.projeta(T,w.laco,x,y);if(pj.dist>.3)continue;const pe=V.pontoEm(T,w.laco,pj.d);
      ops().push({op:"cria",a:A_,k:"portais",item:{id:MD.novoId(M),t:MD.texDe(M,op.t||(op.dupla?PORTA2:PORTA)),tipo:op.tipo||"porta",parede:w.id,d:+pj.d.toFixed(4),raio:op.raio||(op.dupla?1:.5),fechado:!op.aberta,x:pe[0],y:pe[1],dx:pe[2],dy:pe[3],r:Math.atan2(pe[3],pe[2])}})}};
  const centro=Q=>{let x=0,y=0;for(const q of Q){x+=q[0];y+=q[1]}return [x/Q.length,y/Q.length]};
  // =========================== TERRENO (camadas do pacote, bordas suaves) ===========================
  A_=0;const r=MD.resolucao(M),WM=M.larg*r,HM=M.alt*r;
  const hash=(x,y)=>{let h=Math.imul(x|0,374761393)+Math.imul(y|0,668265263)|0;h=Math.imul(h^h>>>13,1274126177);return ((h^h>>>16)>>>0)/4294967296};
  const vn=(x,y)=>{const x0=Math.floor(x),y0=Math.floor(y),fx=x-x0,fy=y-y0,s=t=>t*t*(3-2*t),a=hash(x0,y0),b=hash(x0+1,y0),c=hash(x0,y0+1),d=hash(x0+1,y0+1);return a+(b-a)*s(fx)+(c-a)*s(fy)+(a-b-c+d)*s(fx)*s(fy)};
  const fbm=(x,y)=>(vn(x,y)*.55+vn(x*2.1+7,y*2.1+3)*.3+vn(x*4.3+11,y*4.3+5)*.15);
  const ss=(a,b,x)=>{const t=Math.max(0,Math.min(1,(x-a)/(b-a)));return t*t*(3-2*t)};
  const dSeg=(x,y,a,b)=>{const dx=b[0]-a[0],dy=b[1]-a[1],l=dx*dx+dy*dy;let t=l?((x-a[0])*dx+(y-a[1])*dy)/l:0;t=Math.max(0,Math.min(1,t));return Math.hypot(x-a[0]-dx*t,y-a[1]-dy*t)};
  const dLin=(x,y,L)=>{let m=1e9;for(let i=0;i<L.length-1;i++)m=Math.min(m,dSeg(x,y,L[i],L[i+1]));return m};
  const camada=(nome,tex,fn,op)=>{if(!tex)return;const c=MD.novaCamada(M,{nome});c.t=MD.texDe(M,tex);if(op&&op.sobre)c.sobre=true;if(op&&op.mz){c.mz=op.mz;c.sat=op.sat||1}const m=c.m;
    for(let y=0;y<HM;y++)for(let x=0;x<WM;x++){const v=fn((x+.5)/r,(y+.5)/r);if(v>0)m[y*WM+x]=Math.min(255,Math.round(v*255))}ops().push({op:"cria",a:0,k:"camadas",item:c})};
  const A0=M.andares[0],VERDE={mz:18,sat:.85};
  const GR=[tx(/terrain\/Grass_Terrain\/Grass_A_01\./),tx(/terrain\/Grass_Terrain\/Grass_B_02\./),tx(/terrain\/Grass_Terrain\/Grass_Short_A_01\./),tx(/terrain\/Grass_Terrain\/Grass_A_05\./)];
  if(A0.camadas&&A0.camadas[0]&&GR[0]){const c0=A0.camadas[0],de=MD.foto(c0);ops().push({op:"muda",a:0,k:"camadas",id:c0.id,de,para:Object.assign({},de,{t:MD.texDe(M,GR[0]),nome:"Grama",mz:18,sat:.85})})}
  // caminhos (linha do centro) e lago
  const CAM=[[[27,0],[27.5,6],[26.5,11],[27,15]],[[56,46.5],[66,47],[76,46],[85,50]],[[67,37.5],[74,35],[80,30],[86,27]],[[85,50],[90,55],[94,60.5]],[[56,47.5],[60,52],[67,62],[69,68]],[[27,6],[18,8],[11,12]]];
  const margem=x=>69+2.5*Math.sin(x*.11+1)+3.6*(fbm(x*.15,3)-.5);
  const FLO=y=>99-4*fbm(3,y*.12);
  camada("Grama curta",GR[2],(x,y)=>ss(.45,.65,fbm(x*.09,y*.09)),VERDE);
  camada("Grama alta",GR[3],(x,y)=>ss(.55,.75,fbm(x*.13+20,y*.13))*(1-ss(-1,1,y-margem(x))),VERDE);
  camada("Trevos",tx(/terrain\/Forest_Terrain\/Clover_A_02\./),(x,y)=>ss(.68,.8,fbm(x*.21+40,y*.21+9))*(1-ss(-2,0,y-margem(x))),VERDE);
  camada("Chão da mata",tx(/terrain\/Forest_Terrain\/Forest_Floor_Needles_A_0[12]\./)||GR[1],(x,y)=>ss(-2,2,x-FLO(y))*(.65+.35*fbm(x*.3,y*.3)));
  const TERRA=tx(/terrain\/Dirt_Terrain\/Dirt_(A|B)_0\d\./)||tx(/terrain\/Dirt_Terrain\/Cave_Floor_01_Earthy_A\./);
  camada("Lama da margem",TERRA,(x,y)=>{const d=y-margem(x);return ss(-3.2,-1,d+1.2*(fbm(x*.5,y*.5)-.5))});
  camada("Caminhos de terra",TERRA,(x,y)=>{let v=0;for(const L of CAM){const w=L===CAM[0]?1.5:1.05,d=dLin(x,y,L)+.7*(fbm(x*.7,y*.7)-.5);v=Math.max(v,1-ss(w-.55,w+.45,d))}return v});
  const AG_F=tx(/terrain\/Water_Terrain\/Water_Opaque_A_02\./)||tx(/terrain\/Water_Terrain\/Water_Opaque/),AG_R=tx(/terrain\/Water_Terrain\/Water_Still_A_02\./)||AG_F;
  camada("Lago",AG_F,(x,y)=>ss(-.6,.4,y-margem(x)));
  camada("Lago raso",AG_R,(x,y)=>{const d=y-margem(x);return ss(-.4,.3,d)*(1-ss(1.2,3.6,d+1.4*(fbm(x*.35,y*.35)-.5)))});
  // =========================== ANDAR 0: castelo ===========================
  parede(P.fora,{t:W_EXT,larg:.35,raio:.1});
  for(const L of P.internas)parede(L,{t:W_INT,laco:false,larg:.25,raio:0});
  for(const c of P.comodos)piso(c.P,PISO[c.piso]||PISO.pedra,{l:c.torre?-38:-40});
  for(const d of P.portas)porta(d[0],d[1],{dupla:!!d[2]});
  for(const j of P.janelas)porta(j[0],j[1],{tipo:"janela",t:JANELA,raio:.5,aberta:true});
  // patio: caminhos de pedra com borda suave em cruz e roda em volta da fonte; grama por cima da pedra (camada "sobre")
  piso([[22,40],[56,40],[56,42.2],[22,42.2]],PISO.cobb,{l:-45,extra:{suave:.6,ruido:.5}});piso([[38,32],[40.2,32],[40.2,50],[38,50]],PISO.cobb,{l:-45,extra:{suave:.6,ruido:.5}});
  const roda=[];for(let i=0;i<20;i++){const t=i/20*6.283;roda.push([39.1+4*Math.cos(t),41.1+4*Math.sin(t)])}piso(roda,PISO.cobb,{l:-44,extra:{suave:.5,ruido:.4}});
  piso([[24,12.6],[30,12.6],[30,15.2],[24,15.2]],PISO.cobb,{l:-45,extra:{suave:.5}});
  camada("Grama sobre a pedra do pátio",GR[1],(x,y)=>{if(x<22||x>56||y<32||y>50)return 0;return ss(.6,.76,fbm(x*.6,y*.6))*.9},{sobre:true});
  // ---------------- salao principal ----------------
  {const mesas=acha(/Furniture\/Tables\/Rectangle_Tables\/Table_Rectangle_Wood_Dark_[E-K]_2x1\./),banco=um(/Bench_Wood_Dark_A1_2x1\./)||um(/Bench_Wood_Dark_/);
    const pr=acha(/Prepared_Meals\/Dishes\/Plates\/Plate_(Wood_Dark|Metal_Gray)_Filled_[AB]\d+_1x1\./),ca=acha(/Treasure\/Misc\/Chalice_Metal_(Gold|Silver)_A_(White|Yellow)_1x1\./),st=acha(/Steins\/Stein_Metal_(Gold|Silver)_A1_Water_1x1\./),
      co=acha(/Clutter\/Food\/(Breads|Fruits|Pies|Cakes|Cheese|Meats\/Cooked)\/.*_1x1\./),ve=acha(/Candles\/Candle_Wax\/Candle_(White|Yellow)_Wax_A\d_1x1\./),cop=ca.concat(st);
    const mesa0=await arte(mesas[0]),bc=await arte(banco),pm=mesa0.vw-.02;
    for(const y of [20.6,23.6,26.6,29.6]){let x=36.2;const bases=[];while(x+pm<=58.2){bases.push(await put(esc(mesas),x+pm/2,y,[0,1]));x+=pm}
      for(let xb=36.8;xb+bc.vw<=58;xb+=bc.vw+.15){await put(banco,xb+bc.vw/2,y-mesa0.vh/2-bc.vh/2-.02,[0,1]);await put(banco,xb+bc.vw/2,y+mesa0.vh/2+bc.vh/2+.02,[0,-1])}
      for(const b of bases){for(const u of [-.32,.02,.34]){if(pr.length){await sobre(b,esc(pr),u,-.27);await sobre(b,esc(pr),u+.06,.27)}if(cop.length&&R()<.7)await sobre(b,esc(cop),u+.14,-.08);if(cop.length&&R()<.7)await sobre(b,esc(cop),u-.1,.1)}
        if(co.length)await sobre(b,esc(co),-.12+R()*.24,0);if(R()<.5&&ve.length)await sobre(b,esc(ve),.22,0,{l:320})}}
    // mesa dos professores na abside, de frente para o salao
    const mA=acha(/Table_Rectangle_Wood_Walnut_[E-K]_2x1\./),cad=acha(/Seating\/Chairs\/Fancy\/Fancy_Chair_Wood_Walnut_.*_1x1\./),tro=um(/Thrones\/Throne_Leather_Red_Wood_.*_C1_1x1\.|Thrones\/Throne_Leather_.*_Wood_.*_C1_1x1\./);
    const mA0=await arte(mA[0]);for(let y=21.2;y+mA0.vw<=29.2;y+=mA0.vw-.02){const b=await put(esc(mA),61.8,y+mA0.vw/2,[-1,0]);if(pr.length)await sobre(b,esc(pr),0,-.2);if(ca.length)await sobre(b,esc(ca),.25,.2)}
    for(const y of [21.5,22.5,23.5,24.5,26.5,27.5,28.5])if(cad.length)await put(esc(cad),62.9,y,[-1,0]);if(tro)await put(tro,63,25.5,[-1,0]);
    // velas flutuando, estandartes das casas, lareiras
    for(let i=0;i<40;i++)if(ve.length)await put(esc(ve),35.5+R()*27,18.8+R()*12.5,null,{r:R()*6.28,l:900});
    for(const x of [38,48])for(const y of [22,28])luz(x,y,"vela",{raio:6,claro:2.5,forca:.85,c:[1,.82,.55]});luz(61,25,"vela",{raio:5,claro:2});
    const cores=["Red","Green","Yellow","Blue"];for(const [i,cn] of cores.entries()){const b=um(new RegExp("Flag_Banner_Fabric_"+cn+"_Large_A1_3x1\\."));if(b)await naParede(b,42.5+i*5.5,18.25,[0,1])}
    const lar=um(/Fireplaces\/Fireplace_Rectangle_Chimney_Stone_Slate_A_Wood_Dark_2x2\./)||um(/Fireplace_Rectangle_Chimney_Stone_.*_2x2\./);for(const x of [39,52]){if(lar)await naParede(lar,x,32,[0,-1]);luz(x,30.8,"lareira")}}
  // ---------------- saguao ----------------
  {const es=um(/Stairs_Stone_Slate_Wide_A_2x3\./)||um(/Stairs_Stone_.*_Wide_A_2x3\./);if(es){await put(es,23.6,29.6,[1,0]);await put(es,32.4,29.6,[-1,0])}
    const est=acha(/Statue_(Marble|Metal)_[A-Za-z]+_Standing_(Knight|Mage|Hooded)_[AB]_2x2\./);for(const [x,y,n] of [[22,23.2,[1,0]],[34,24,[-1,0]]])if(est.length)await naParede(esc(est),x,y,n,{s:.75});
    const tap=um(/Rugs_and_Carpets\/.*Runner.*Red.*_\dx\d\.|Rug_Runner.*Red/)||um(/Carpet_.*Red.*_\dx\d\./);if(tap)await put(tap,27,24,[0,1],{l:100});
    const cand=um(/Chandeliers\/Chandelier_Metal_Gray_A_Lit_2x2\./);if(cand){await put(cand,28,25.5,null,{l:900});luz(28,25.5,"lampiao",{raio:8,claro:3.5})}
    const toc=um(/Wall_Torch_A_01_1x1\./);for(const [x,y,n] of [[24,17,[1,0]],[30,17,[-1,0]],[22,27,[1,0]]])if(toc){await naParede(toc,x,y,n);luz(x+n[0]*.6,y+n[1]*.6,"tocha")}
    const vs=acha(/Potted_Plant_Multicolor1_A\d_1x1\.|Potted_Plant_.*Green.*_1x1\./);for(const [x,y] of [[23,21],[33,21]])if(vs.length)await put(esc(vs),x,y,null)}
  // ---------------- salas de aula (fileiras de carteiras para o quadro, mesa do professor) ----------------
  const aula=async(x0,y0,x1,y1,extra)=>{const cart=acha(/Tables\/Desks\/Desk_Rectangle_Wood_(Dark|Walnut)_[A-D]1_2x1\./),cad=acha(/Seating\/Chairs\/(.*\/)?Chair_Wood_(Dark|Walnut)_[B-H]_1x1\./),qd=um(/Blackboard_Wood_Dark_A1_3x1\./);
    const cx=(x0+x1)/2;if(qd)await naParede(qd,cx,y0,[0,1]);const pf=await put(um(/Fancy_Desk_Rectangle_Wood_Walnut_A1_2x1\./)||esc(cart),cx,y0+2.1,[0,1]);if(cad.length)await put(esc(cad),cx,y0+1.2,[0,1]);
    if(pf){await sobre(pf,um(/Books_and_Tomes\/Book_A_.*_1x1\./),-.3,0);await sobre(pf,um(/Candle_White_Wax_A1_1x1\./),.35,0)}
    for(let y=y0+4;y<=y1-1.4;y+=2)for(const x of [x0+2.5,x0+6.5]){if(x>x1-1.5)continue;const c0=await put(esc(cart),x,y,[0,-1]);if(cad.length){await put(esc(cad),x-.5,y+.9,[0,-1]);await put(esc(cad),x+.5,y+.9,[0,-1])}if(R()<.6)await sobre(c0,um(/Books_and_Tomes\/Book_[A-D]_.*_1x1\./,Math.floor(R()*9)),-.2+R()*.4,0)}
    if(extra)await extra(x0,y0,x1,y1);luz(cx,(y0+y1)/2,"lampiao",{raio:7,claro:3})};
  await aula(10,25,19,33,async(x0,y0,x1,y1)=>{const g=acha(/Domesticated_Animals\/.*Cage.*_1x1\./);if(g.length)for(const y of [26.2,27.4])await put(esc(g),x1-.7,y,null)});
  await aula(10,33,19,41,async(x0,y0,x1,y1)=>{const p=acha(/Quill|Feather/);for(let i=0;i<6;i++)if(p.length)await put(esc(p),x0+1.5+R()*6,y0+4+R()*3,null,{r:R()*6.28,l:120})});
  await aula(10,41,19,49,async(x0,y0,x1,y1)=>{const ar=acha(/Armor_Stand_Wood_.*_1x1\./);if(ar.length){await naParede(esc(ar),x1,y0+1.5,[-1,0]);await naParede(esc(ar),x1,y1-1.5,[-1,0])}});
  // ---------------- biblioteca ----------------
  {const es=acha(/Shelves\/.*Shelf_Wood_(Dark|Walnut)_Filled_[A-Z]\d_2x1\./),mesa=acha(/Table_Rectangle_Wood_Walnut_[BC]_3x2\./),cad=acha(/Seating\/Chairs\/(.*\/)?Chair_Wood_Walnut_[B-H]_1x1\./),liv=acha(/Books_and_Tomes\/Book_[A-Z]_.*_1x1\./),vela=acha(/Candle_(White|Yellow)_Wax_A\d_1x1\./);
    const e0=await arte(es[0]);for(let x=23.2;x+e0.vw<=37.6;x+=e0.vw+.05){if(x>26.4&&x<33.6)continue;await naParede(esc(es),x+e0.vw/2,60,[0,-1])}
    for(let y=54;y+e0.vw<=59.8;y+=e0.vw+.05)await naParede(esc(es),22,y+e0.vw/2,[1,0]);
    for(const x of [25.4,28.4])for(let y=54.4;y+e0.vw<=58.4;y+=e0.vw+.05){await put(esc(es),x,y+e0.vw/2,[-1,0]);await put(esc(es),x+e0.vh+.02,y+e0.vw/2,[1,0])}
    for(const [x,y] of [[34,55.4],[34,58.3]])if(mesa.length){const b=await put(esc(mesa),x,y,[0,1]);for(const dx of [-1,0,1])if(cad.length){await put(esc(cad),x+dx,y-1.35,[0,1]);await put(esc(cad),x+dx,y+1.35,[0,-1])}for(let k=0;k<4;k++)if(liv.length)await sobre(b,esc(liv),-.4+R()*.8,-.3+R()*.6);if(vela.length)await sobre(b,esc(vela),0,0);luz(x,y,"vela",{raio:4})}
    const glb=um(/Globes\/Globe_Large_Brace_Brass_Gray_A1_1x1\./);if(glb)await put(glb,30,60.3,null)}
  // ---------------- sala de trofeus: vitrines nas paredes e no meio, com tacas e escudos ----------------
  {const base=acha(/Display_Cases\/Display_Case_Base_Wood_Dark_[A-O]_1x2\./),top=acha(/Display_Cases\/Display_Case_Top_Metal_Gray_Clear_[AG]\d_1x2\./),base2=acha(/Display_Cases\/Display_Case_Base_Wood_Dark_[BCEJ]_2x2\./),top2=acha(/Display_Cases\/Display_Case_Top_Metal_Gray_Clear_[BCE]\d_2x2\./);
    const tc=acha(/Treasure\/Misc\/Chalice_Metal_Gold_A_.*_1x1\./),sh=acha(/Weapons\/Shields\/Shield_Metal_0[1-4]_A\d_1x1\./),it=tc.concat(sh);
    for(const x of [39.6,41.6,44.4,46.4]){for(const [y,n] of [[53,[0,1]],[60,[0,-1]]]){if(!base.length)break;const b=await naParede(esc(base),x,y,n);if(!b)continue;for(const u of [-.25,.25])if(it.length)await sobre(b,esc(it),u*.3,u,{l:305});}}
    for(const [x,n] of [[38,[1,0]],[48,[-1,0]]]){if(!base.length)break;const b=await naParede(esc(base),x,56.5,n);if(b){for(const u of [-.25,.25])if(tc.length)await sobre(b,esc(tc),u,0,{l:305});}}
    if(base2.length){const b2=await put(esc(base2),43,56.5,[0,1]);if(b2){for(const [u,v] of [[-.22,-.22],[.22,-.22],[0,.2]])if(tc.length)await sobre(b2,esc(tc),u,v,{l:305,s:1.3});}}
    luz(43,56.5,"lampiao",{raio:6,claro:3,c:[1,.92,.7]})}
  // ---------------- pocoes ----------------
  {const mesa=acha(/Table_Rectangle_Wood_Dark_[EFG]_2x1\./),cal=acha(/Cauldrons\/Cauldron_Metal_(Gray|Rusty)_Filled_[AB]\d_1x1\./),fr=acha(/Alchemy\/Glassware\/Filled\/.*_1x1\./),es=acha(/Shelf_Wood_Dark_Filled_[A-Z]\d_2x1\./),bq=acha(/Stools\/Stool_Wood_Dark_[A-C]_1x1\./);
    for(const y of [55,57.6])for(const x of [50.2,53]){const b=await put(esc(mesa),x,y,[0,-1]);if(cal.length)await sobre(b,esc(cal),-.25,0);for(let k=0;k<2;k++)if(fr.length)await sobre(b,esc(fr),.15+R()*.25,-.3+R()*.6);if(bq.length)await put(esc(bq),x,y+.95,null)}
    for(const x of [49.5,52])if(es.length)await naParede(esc(es),x,53,[0,1]);luz(50,55,"veneno",{raio:4});luz(53,58,"veneno",{raio:4});luz(51.5,56.5,"vela",{raio:5})}
  // ---------------- corredores: tochas, armaduras ----------------
  {const toc=um(/Wall_Torch_A_02_1x1\./),ar=acha(/Statue_(Metal|Stone)_[A-Za-z]+_Standing_Knight_[AB]_2x2\./);
    for(const y of [24,34,42,58])if(toc){await naParede(toc,22,y,[-1,0]);luz(21.3,y,"tocha",{raio:5})}for(const x of [27,35,45])if(toc){await naParede(toc,x,50,[0,1]);luz(x,50.7,"tocha",{raio:5})}
    for(const y of [27,39,47])if(ar.length)await naParede(esc(ar),22,y,[-1,0],{s:.5})}
  // ---------------- patio: fonte, arvores, bancos, canteiros, arbustos, colunata do lado aberto ----------------
  {const base=um(/Basin_Bases\/Basin_Base_Stone_.*Large_Circle_A1_[34]x[34]\./)||um(/Basin_Base_.*Circle_A1_\dx\d\./),est=um(/Fountain_Statue_Marble_White_Pouring_Jug_A1_1x1\./);if(base)await put(base,39.1,41.1,null,{l:150});if(est)await put(est,39.1,41.1,[0,1],{l:210});
    const arv=acha(/Tree_Tops\/Tree_Colorable_[AB]\d_[56]x[56]\./),verdes=[[.28,.42,.22],[.22,.36,.2],[.34,.44,.24],[.25,.38,.27]];
    for(const [x,y] of [[29,36.2],[49,36.2],[29,46],[49,46.4]])if(arv.length)await put(esc(arv),x,y,null,{r:R()*6.28,l:900,c:esc(verdes)});
    const banco=um(/Bench_Wood_Dark_A1_2x1\./);for(const [x,y,f] of [[39.1,36.5,[0,1]],[39.1,45.7,[0,-1]],[34.5,41.1,[1,0]],[43.7,41.1,[-1,0]]])if(banco)await put(banco,x,y,f);
    const fl=acha(/Flora\/Flowers\/Flower_(Purple|Yellow|White|Blue)_A\d_1x1\./),tp=acha(/Topiary\/Topiary_Green_[AB]\d_2x2\./);
    for(const [x0,y0,x1,y1] of [[24,34,34,38],[44,34,54,38],[24,44,34,48],[44,44,54,48]]){piso(chanf(x0,y0,x1,y1,1),PISO.terra,{l:-46,extra:{suave:.5,ruido:.5}});const cor=esc(["Purple","Yellow","White","Blue"]),F=fl.filter(k=>k.includes("Flower_"+cor));for(let x=x0+.8;x<x1-.5;x+=.85)for(let y=y0+.8;y<y1-.5;y+=.85)if(R()<.55&&F.length)await put(esc(F),x+R()*.3,y+R()*.3,null,{r:R()*6.28,l:120})}
    for(const [x,y] of [[23.4,33.4],[54.6,33.4],[23.4,48.6],[33,48.9],[46,48.9]])if(tp.length)await put(esc(tp),x,y,null,{r:R()*6.28});
    const col=um(/Pillars\/Pillar_Stone_Earthy_A2_White_1x1\./)||um(/Pillars\/Pillar_Stone_/);for(const y of [45,46.8,48.6])if(col)await put(col,56.5,y,null);
    const lp=um(/Street_Lamps\/Lamp_Metal_Brass_A_1x1\./);for(const [x,y] of [[36.6,38.6],[41.6,43.6]])if(lp){await put(lp,x,y,null);luz(x,y,"lampiao",{raio:6})}}
  e.hist.exec(ops(),{nome:"Castelo · térreo"});OPS[0]=[];await new Promise(r=>setTimeout(r,300));
  // ---------------- comodos cheios pelo gerador de zonas ----------------
  const zona=async(Pz,tipo,rq)=>{const z=e.zonas.criar(Pz,tipo,{riqueza:rq,dens:.75,bag:.7,paredes:false,fonte:"auto",pacote:"FA35OB01",estilo:""});await new Promise(r=>setTimeout(r,150));while(e.zonas.ocupado())await new Promise(r=>setTimeout(r,120));return z};
  const enc=(Q,d)=>{const [cx,cy]=centro(Q);return Q.map(q=>{const dx=q[0]-cx,dy=q[1]-cy,L=Math.hypot(dx,dy)||1;return [q[0]-dx/L*d,q[1]-dy/L*d]})};
  await zona(ret(56.2,32.2,63.8,38.8),"cozinha",2);await zona(ret(56.2,39.2,63.8,43.8),"despensa",2);await zona(ret(10.2,49.2,18.8,56.6),"dormitorio",2);
  // =========================== fora: cabana, estufas, corujal ===========================
  const hut=oct(88,51,3,1),stH=oct(97,60,3,1),est1=ret(76,14,92,21),est2=ret(84,21,92,27);
  parede(hut,{t:W_MAD,larg:.25});piso(hut,PISO.mad3);porta(85,51.5);porta(88.5,48,{tipo:"janela",t:JANELA,raio:.5,aberta:true});
  const estufa=V.uniao(est1,est2).fora;parede(estufa,{t:W_MADC,larg:.15});piso(estufa,PISO.terra);porta(86,27,{dupla:true});porta(76,17.5);
  parede(stH,{t:W_EXT,larg:.3});piso(stH,PISO.pedra);porta(94,60.5);
  {const ab=acha(/Pumpkin.*_1x1\./);for(let x=92.5;x<=98.5;x+=1.3)for(let y=44;y<=48.5;y+=1.3)if(ab.length&&R()<.8)await put(esc(ab),x+R()*.3,y+R()*.3,null,{r:R()*6.28});
    const cerca=um(/paths\/.*Fence_Wood_Dark_A_Path\./);if(cerca)ops().push({op:"cria",a:0,k:"caminhos",item:{id:MD.novoId(M),t:MD.texDe(M,cerca),p:[[91.5,43],[99.5,43],[99.5,49.5],[91.5,49.5]],larg:.25,laco:true,l:150}});
    const banc=acha(/Table_Rectangle_Wood_Ashen_[EFG]_2x1\./),vaso=acha(/Potted_Plant_.*_1x1\./),plan=acha(/Flora\/(Bushes|Plants)\/.*Green.*_1x1\./);
    for(const y of [16,18.8])for(let x=78;x<=90;x+=2.6){const b=await put(esc(banc),x,y,[0,1]);for(const u of [-.25,.25])if(vaso.length)await sobre(b,esc(vaso),u,0)}
    for(let y=22.5;y<=25.5;y+=2.6){const b=await put(esc(banc),88,y,[0,1]);for(const u of [-.25,.25])if(vaso.length)await sobre(b,esc(vaso),u,0)}
    for(let i=0;i<12;i++)if(plan.length)await put(esc(plan),85+R()*6,21.3+R()*5,null,{r:R()*6.28});luz(84,18,"lampiao",{raio:9,claro:4});
    const feno=acha(/Hay_(Pile|Bale).*_1x1\./),pe=acha(/Feather/),po=acha(/Perches\/Perch_Leather_.*_A1_1x1\./);for(let i=0;i<8;i++){const t=i/8*6.28;if(po.length)await put(esc(po),97+Math.cos(t)*2.2,60+Math.sin(t)*2.2,[Math.cos(t),Math.sin(t)])}
    for(let i=0;i<10;i++)if(pe.length)await put(esc(pe),95.5+R()*3,58.5+R()*3,null,{r:R()*6.28,l:120});if(feno.length)await put(esc(feno),97,60,null)}
  // floresta (verdes escuros), arvore grande, taboas e pedras na margem, botes
  {const arv=acha(/Tree_Tops\/Tree_Colorable_[A-D]\d_[5-8]x[5-8]\./),verdes=[[.17,.26,.17],[.2,.3,.18],[.15,.23,.2],[.24,.32,.19],[.19,.28,.22]];
    for(let i=0;i<90;i++){const y=R()*90,x=FLO(y)+1+R()*16;if(x>113)continue;if(Math.hypot(x-97,y-60)<5||(y>11&&y<29&&x<94))continue;if(arv.length)await put(esc(arv),x,y,null,{r:R()*6.28,l:900,c:esc(verdes)})}
    for(let i=0;i<14;i++){const x=R()*70,y=R()*9;if(Math.abs(x-27)<4)continue;if(arv.length)await put(esc(arv),x,y,null,{r:R()*6.28,l:900,c:esc(verdes)})}
    const big=um(/Tree_Tops\/Tree_Colorable_A2_8x7\./);if(big)await put(big,75,58,null,{l:900,c:[.24,.33,.2],s:1.15});
    const ta=acha(/Cattails\/Cattail_Brown_A\d+_1x1\./),pd=acha(/Boulders\/Boulder_Stone_Mossy_C\d+_2x2\./);for(let x=2;x<108;x+=1.1){const y=margem(x)-.2+R()*.8;if(R()<.35&&ta.length)await put(esc(ta),x,y,null,{r:R()*6.28,l:150});if(R()<.05&&pd.length)await put(esc(pd),x,y-.4,null,{r:R()*6.28})}
    const bote=acha(/Boats\/Rowboat_Wood_(Dark|Ashen)_[AB]\d?_\dx\d\./);for(const [x,y] of [[66,75],[69,76.5],[40,81]])if(bote.length)await put(esc(bote),x,y,[R()-.5,1])}
  e.hist.exec(ops(),{nome:"Castelo · exterior"});OPS[0]=[];await new Promise(r=>setTimeout(r,200));
  await zona(enc(hut,.4),"quarto",0);await zona(enc(P.T.dorm,.5),"sala",3);await zona(enc(P.T.astro,.5),"despensa",1);
  // =========================== ANDAR 1: andar de cima das torres + telhado do resto ===========================
  const escadaC=um(/Stairs_Spiral\/Botanical_Garden_Spiral_Staircase_Metal_Gray_A1_3x3\./)||um(/Spiral_Staircase_Metal_.*_3x3\./);
  const escadas=[[8.8,17.8],[38.4,14.6],[63.4,51.6],[11,60]];A_=0;for(const [x,y] of escadas)if(escadaC)await put(escadaC,x,y,null,{l:190});e.hist.exec(ops(),{nome:"Escadas"});OPS[0]=[];
  const a1=M.andares.length>1?1:e.novoAndar("1º andar · torres e telhado");for(const k of MD.TIPOS)if(!M.andares[a1][k])M.andares[a1][k]=[];A_=a1;OPS[A_]=[];
  for(const t of [P.T.dorm,P.T.diretor,P.T.astro]){parede(t,{t:W_EXT,larg:.35});piso(t,t===P.T.astro?PISO.pedra:PISO.mad1)}
  for(const t of [P.T.dorm,P.T.diretor,P.T.astro])for(const j of [[t[2][0],(t[2][1]+t[3][1])/2],[t[6][0],(t[6][1]+t[7][1])/2]])porta(j[0],j[1],{tipo:"janela",t:JANELA,raio:.5,aberta:true});
  for(const [x,y] of escadas.slice(0,3))if(escadaC)await put(escadaC,x,y,null,{l:190});
  // dormitorio (camas em volta), sala do diretor, observatorio
  {const cama=acha(/Arranged_Bed_Wood_(Walnut|Dark)_A(4|6|9|12)_1x2\./),bau=acha(/Chests\/Chest_Wood_(Dark|Walnut)_[A-D]_1x1\./),[cx,cy]=[11,20];
    for(let i=0;i<7;i++){const t=(i/7)*6.283+.3,n=[-Math.cos(t),-Math.sin(t)],x=cx+Math.cos(t)*3.3,y=cy+Math.sin(t)*3.3;if(Math.hypot(x-8.8,y-17.8)<2.3)continue;if(cama.length)await put(esc(cama),x,y,n);if(bau.length)await put(esc(bau),cx+Math.cos(t)*1.8,cy+Math.sin(t)*1.8,n)}
    const tap=um(/Rugs_and_Carpets\/.*Round.*Red.*_\dx\d\.|Rug_Round.*Red/);if(tap)await put(tap,cx,cy,null,{l:100});luz(cx,cy,"vela",{raio:6,claro:2.5,forca:.8})}
  {const [cx,cy]=[36,17],mesa=um(/Fancy_Desk_Curved_Wood_Walnut_[AB]_3x2\./)||um(/Fancy_Desk_Rectangle_Wood_Walnut_A1_2x1\./),es=acha(/Shelf_Wood_Walnut_Filled_[A-Z]\d_2x1\./),po=um(/Perches\/Perch_Leather_Red_Wood_Red_A1_1x1\./)||um(/Perches\/Perch_/),ar=um(/Armillary_Sphere_Metal_Brass_Gray_B1_1x1\./);
    const d=await put(mesa,cx-.3,cy+1.1,[0,1]);if(d){await sobre(d,um(/Books_and_Tomes\/Book_A_.*_1x1\./),-.3,0);await sobre(d,um(/Candle_White_Wax_A2_1x1\./),.3,-.1)}const ch=um(/Thrones\/Throne_Leather_.*_C1_1x1\./);if(ch)await put(ch,cx-.3,cy-.1,[0,1]);
    if(es.length){await naParede(esc(es),32,17,[1,0]);await naParede(esc(es),35.5,13,[0,1])}if(po)await put(po,33.6,19.4,null);if(ar)await put(ar,34,14.6,null);luz(cx,cy,"vela",{raio:5,claro:2})}
  {const [cx,cy]=[60,55],tel=acha(/Decor\/Telescopes\/Telescope_Metal_Brass_A[12]_/),ar=um(/Armillary_Sphere_Metal_Gold_Gray_A1_2x1\./),mesa=um(/Table_Rectangle_Wood_Dark_E_2x1\./),pp=acha(/Scrolls?_|Map_.*Paper|Paper_/);
    for(let i=0;i<7;i++){const t=i/7*6.283+.2,x=cx+Math.cos(t)*4.4,y=cy+Math.sin(t)*4.4;if(Math.hypot(x-63.4,y-51.6)<2.3)continue;if(tel.length)await put(esc(tel),x,y,[Math.cos(t),Math.sin(t)])}
    if(ar)await put(ar,cx,cy,null);const m=await put(mesa,cx-2,cy+1.8,[0,1]);for(let k=0;k<3;k++)if(m&&pp.length)await sobre(m,esc(pp),-.3+k*.3,0);luz(cx,cy,"lua",{raio:8,claro:4})}
  // telhado (alas retas) com furos nas torres; extras: abside e sacadas; torre da escada com cone neste andar
  const telh=(p,op)=>ops().push({op:"cria",a:A_,k:"telhados",item:Object.assign({id:MD.novoId(M),p},op)});
  telh(P.fora,{t:MD.texDe(M,TELHA),tq:CUME?MD.texDe(M,CUME):undefined,cq:[.82,.82,.88,1],alas:P.telhado.alas,furos:P.telhado.furos});
  for(const x of P.telhado.extras)telh(x.p,{t:MD.texDe(M,TELHA),estilo:x.estilo});
  const cone=(t,cor,a,esc2)=>{const k=CONE(cor);if(k)ops().push({op:"cria",a,k:"telhados",item:{id:MD.novoId(M),p:t,arte:MD.texDe(M,k),t:MD.texDe(M,TELHA),escArte:esc2||1.16}})};
  cone(P.T.escada,"Gray",A_);
  telh(V.uniao(est1,est2).fora,{t:MD.texDe(M,TELHA_V),tq:CUME_V?MD.texDe(M,CUME_V):undefined,alas:[{x0:76,y0:14,x1:92,y1:21,tipo:"duas",eixo:"x"},{x0:84,y0:14,x1:92,y1:27,tipo:"duas",eixo:"y"}]});
  cone(hut,"Brown",A_,1.3);cone(stH,"Brown",A_);
  e.hist.exec(ops(),{nome:"Castelo · 1º andar e telhado"});await new Promise(r=>setTimeout(r,300));
  // =========================== ANDAR 2: telhado das torres ===========================
  const a2=M.andares.length>2?2:e.novoAndar("Telhado das torres");for(const k of MD.TIPOS)if(!M.andares[a2][k])M.andares[a2][k]=[];A_=a2;OPS[A_]=[];
  cone(P.T.dorm,"Red",A_);cone(P.T.diretor,"Gray",A_);cone(P.T.astro,"Blue",A_);
  e.hist.exec(ops(),{nome:"Castelo · telhado das torres"});
  e.irPara(0);await new Promise(r=>setTimeout(r,300));await e.artesPC().espera();
  return {andares:M.andares.map(A=>A.nome),objetos:M.andares.map(A=>(A.objetos||[]).length),falta:log}}
