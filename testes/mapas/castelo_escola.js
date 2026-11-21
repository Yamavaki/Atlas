// Atlas - mapa de exemplo gerado pelo Claude: castelo-escola de magia (grande, varios comodos, telhados de alas e torres).
// Roda dentro do editor aberto, com as artes do usuario conectadas: gerar({B,C,MD,V,e}).
// So artes da Forgotten Adventures; nomes resolvidos na hora pela biblioteca do usuario.
export async function gerar(o){const {B,C,MD,V,e}=o,M=e.mapa,a=0,ops=[],log=[],zonas=[],portasAll=[];
  // ---------- artes ----------
  const all=B.buscar({todos:true}),TOD=[];for(const i of all.itens)TOD.push(all.item(i).caminho);
  const FA=TOD.filter(k=>/\/packs\/FA35/.test(k));
  const acha=(re,lista)=>{const L=(lista||FA).filter(k=>re.test(k));return L};
  const um=(re,i)=>{const L=acha(re);if(!L.length){log.push("FALTOU "+re);return null}return L[(i||0)%L.length]};
  const ART=new Map();
  const arte=async k=>{if(!k)return null;if(ART.has(k))return ART.get(k);const d=await B.dims(k);let f=null;try{f=await C.fichaUma(k)}catch(x){}const nm=k.split("/").pop(),pc=B.pacoteDe(k);
    const fr=C.frente(nm,pc&&pc.autor,f);const FR={S:[0,1],N:[0,-1],L:[1,0],W:[-1,0]};let fv=FR[fr]||(fr==="L|W"?FR.L:FR.S);
    const w=d[0]/256,h=d[1]/256,vis=f&&f.length>=11&&f[4]>f[2]?[f[2]/255,f[3]/255,f[4]/255,f[5]/255]:[0,0,1,1];
    const r={k,w,h,fv,vis,vw:(vis[2]-vis[0])*w,vh:(vis[3]-vis[1])*h,ox:((vis[0]+vis[2])/2-.5)*w,oy:((vis[1]+vis[3])/2-.5)*h};ART.set(k,r);return r};
  const gira=(x,y,r)=>[x*Math.cos(r)-y*Math.sin(r),x*Math.sin(r)+y*Math.cos(r)];
  // poe a arte com o CENTRO DESENHADO em (x,y) e a frente apontando para "face" (vetor); l = camada
  const objs=[];
  const put=async(k,x,y,face,op)=>{op=op||{};const A=await arte(k);if(!A)return null;const r=face?Math.atan2(face[1],face[0])-Math.atan2(A.fv[1],A.fv[0]):(op.r||0),c=gira(A.ox*(op.m?-1:1),A.oy,r),s=op.s||1;
    const it={id:MD.novoId(M),t:MD.texDe(M,k),x:+(x-c[0]*s).toFixed(3),y:+(y-c[1]*s).toFixed(3),r:+r.toFixed(4),w:A.w*s,h:A.h*s,l:op.l||200,s:1};if(op.m)it.m=1;ops.push({op:"cria",a,k:"objetos",item:it});objs.push(it);return A};
  // encostada na parede: p0 ponto na linha da parede, n normal para dentro
  const naParede=async(k,x,y,n,op)=>{const A=await arte(k);if(!A)return;const prof=Math.abs(A.fv[0])>.5?A.vw:A.vh;return put(k,x+n[0]*(.12+prof/2),y+n[1]*(.12+prof/2),n,op)};
  const luz=(x,y,pre,op)=>{const L=MD.LUZES.find(q=>q[0]===pre)||MD.LUZES[0];op=op||{};ops.push({op:"cria",a,k:"luzes",item:{id:MD.novoId(M),x,y,raio:op.raio||L[2],claro:op.claro||L[3],forca:op.forca||L[4],c:(op.c||L[5]).concat(1),sombras:true}})};
  const R=(()=>{let s=12345;return()=>((s=Math.imul(s^s>>>15,2246822519)+0x9e3779b9|0)>>>0)/4294967296})();
  const esc=L=>L[Math.floor(R()*L.length)];
  // ---------- materiais ----------
  const TEXT=TOD.filter(k=>/\/packs\/FA35TX/.test(k));
  const tx=(re,i)=>{const L=acha(re,TEXT);if(!L.length){log.push("FALTOU "+re);return null}return L[(i||0)%L.length]};
  const PAREDE=um(/walls\/Walls_Stone\/.*Wall_Stone_Slate_[A-Z]\d?\./)||um(/walls\/Walls_Stone\//);
  const PAREDE_MAD=um(/walls\/Walls_Wood\/.*Wall_Wood_Dark_/)||PAREDE;
  const P_PEDRA=tx(/patterns\/.*Stone_Tiles?_Large.*Slate/)||tx(/Stone_Tiles?_Large/),P_DIAG=tx(/Stone_Diagonal_Tiles_Earthy_A1/)||P_PEDRA,P_MARM=tx(/patterns\/.*Marble.*(Black|White)/)||P_PEDRA;
  const P_MAD=tx(/Wood_Pattern\/Wood_Walnut_Flooring_[A-Z]\./)||tx(/Wood_Pattern\/.*Flooring/),P_MAD2=tx(/Wood_Pattern\/Wood_Dark_Flooring_[A-Z]\./)||P_MAD,P_MAD3=tx(/Wood_Pattern\/Wood_Ashen_Flooring_[A-Z]\./)||P_MAD;
  const P_COBB=tx(/patterns\/.*Cobblestone_A_.*Slate|patterns\/.*Cobblestone/),P_QUAD=tx(/Stone_Square_Tiles_Slate|Stone_Square_Tiles_Earthy/)||P_PEDRA,P_TERRA=tx(/patterns\/.*Dirt_Pattern\/Dirt_A|Dirt_Pattern/);
  const TELHA=tx(/Roof_Texture_Slate_Black_A1\./),TELHA2=tx(/Roof_Texture_Slate_Blue_A1\./)||TELHA,TELHA_V=tx(/Roof_Texture_Tile_Green_A1\./)||TELHA,TELHA_M=tx(/Roof_Texture_Wood_Dark_Shingle_A1\./)||TELHA;
  const CUME=um(/paths\/.*Roof_Hip_Shingles_Gray\./),CUME_V=um(/paths\/.*Roof_Hip_Shingles_Green\./)||CUME,CUME_M=um(/paths\/.*Roof_Hip_Shingles_Brown\./)||CUME;
  const PORTA=um(/portals\/Doors\/Door_Wood_Dark_[A-Z]_1x1\./)||um(/portals\/Doors\/Door_Wood_/),PORTA2=um(/portals\/Doors\/.*Double.*Wood_Dark|portals\/Doors\/Door_Wood_Dark_.*2x1/)||PORTA;
  const JANELA=um(/portals\/Windows\/Window_.*Stone.*_2x1\.|portals\/Windows\/Window_[A-Za-z_]*_2x1\./)||um(/portals\/Windows\//);
  // ---------- paredes, pisos, portas ----------
  const PAR=[];
  const parede=(P,op)=>{op=op||{};const w={id:MD.novoId(M),t:MD.texDe(M,op.t||PAREDE),p:P.map(q=>[q[0],q[1]]),laco:op.laco!==false,raio:op.raio==null?.15:op.raio,larg:op.larg||.25,tipo:0,sombra:true};ops.push({op:"cria",a,k:"paredes",item:w});PAR.push(w);
    if(op.piso)ops.push({op:"cria",a,k:"padroes",item:{id:MD.novoId(M),t:MD.texDe(M,op.piso),p:w.p,l:-40,parede:w.id}});return w};
  const ret=(x0,y0,x1,y1)=>[[x0,y0],[x1,y0],[x1,y1],[x0,y1]];
  const circ=(cx,cy,r,n)=>{n=n||28;const P=[];for(let i=0;i<n;i++){const t=i/n*Math.PI*2;P.push([+(cx+r*Math.cos(t)).toFixed(3),+(cy+r*Math.sin(t)).toFixed(3)])}return P};
  // porta em (x,y): entra em toda parede que passa ali (as dos dois comodos)
  const porta=(x,y,op)=>{op=op||{};portasAll.push([x,y]);for(const w of PAR){const T=MD.trajeto(w),pj=V.projeta(T,w.laco,x,y);if(pj.dist>.35)continue;const pe=V.pontoEm(T,w.laco,pj.d);
      ops.push({op:"cria",a,k:"portais",item:{id:MD.novoId(M),t:MD.texDe(M,op.t||(op.dupla?PORTA2:PORTA)),tipo:op.tipo||"porta",parede:w.id,d:+pj.d.toFixed(4),raio:op.raio||(op.dupla?1:.5),fechado:!op.aberta,x:pe[0],y:pe[1],dx:pe[2],dy:pe[3],r:Math.atan2(pe[3],pe[2])}})}};
  const janela=(x,y,op)=>porta(x,y,Object.assign({tipo:"janela",t:JANELA,raio:1},op||{}));
  const comodo=(nome,P,piso,op)=>{op=op||{};const w=parede(P,{piso,t:op.t,larg:op.larg});return {nome,P,w}};
  // =====================================================================
  // PLANTA (quadrados). Mapa 104 x 82. Castelo: alas em volta de um patio; torres redondas; estufas, cabana, corujal e lago fora.
  // =====================================================================
  const C_={};
  C_.saguao=comodo("Saguão de entrada",ret(20,16,32,30),P_DIAG);
  C_.salao=comodo("Salão principal",ret(32,16,62,30),P_MARM);
  C_.cozinha=comodo("Cozinha",ret(62,16,72,24),P_QUAD);
  C_.despensa=comodo("Despensa",ret(62,24,72,30),P_QUAD);
  C_.profs=comodo("Sala dos professores",ret(62,30,72,40),P_MAD2);
  C_.transf=comodo("Sala de Transfiguração",ret(8,16,20,26),P_MAD);
  C_.feiticos=comodo("Sala de Feitiços",ret(8,26,20,36),P_MAD3);
  C_.defesa=comodo("Sala de Defesa",ret(8,36,20,46),P_MAD2);
  C_.enfermaria=comodo("Enfermaria",ret(8,46,20,56),P_PEDRA);
  C_.biblioteca=comodo("Biblioteca",ret(20,52,40,62),P_MAD2);
  C_.pocoes=comodo("Sala de Poções",ret(40,52,52,62),P_COBB);
  C_.ingredientes=comodo("Depósito de ingredientes",ret(52,52,62,62),P_COBB);
  C_.trofeus=comodo("Sala de troféus",ret(44,30,62,40),P_MARM);
  C_.comunal=comodo("Sala comunal",ret(44,40,62,52),P_MAD);
  C_.dormitorio=comodo("Torre dos dormitórios",circ(14,11,5),P_MAD3);
  C_.diretor=comodo("Torre do diretor",circ(47,11.5,4.5),P_MARM);
  C_.astronomia=comodo("Torre de astronomia",circ(67.5,47,5.5,32),P_PEDRA);
  C_.estufa=comodo("Estufas",ret(78,18,96,28),P_TERRA,{t:PAREDE_MAD,larg:.18});
  C_.cabana=comodo("Cabana do guarda-caça",ret(84,40,91,46),P_MAD3,{t:PAREDE_MAD,larg:.2});
  C_.corujal=comodo("Corujal",circ(88,64,3.5,20),P_PEDRA);
  // patio: piso de pedra em volta da fonte, sem parede
  ops.push({op:"cria",a,k:"padroes",item:{id:MD.novoId(M),t:MD.texDe(M,P_COBB),p:ret(20.1,30.1,43.9,51.9),l:-45}});
  // portas
  porta(26,16,{dupla:true});            // entrada principal (norte)
  porta(32,23,{dupla:true});            // saguao -> salao
  porta(20,21);porta(26,30,{dupla:true}); // saguao -> transfiguracao, patio
  porta(62,18.5);porta(67,24);porta(62,27.5); // salao -> cozinha, cozinha -> despensa, salao -> despensa
  porta(67,30);porta(62,35);             // despensa -> professores, trofeus -> professores
  porta(14,16);                          // transfiguracao -> torre dos dormitorios
  porta(14,26);porta(14,36);porta(14,46); // corredor de salas (oeste)
  porta(20,31);porta(20,41);porta(20,50); // salas -> patio
  porta(30,52,{dupla:true});porta(46,52);porta(52,57); // biblioteca, pocoes, ingredientes
  porta(44,35);porta(44,46);porta(53,40); // patio -> trofeus, comunal; trofeus -> comunal
  porta(62,47);                          // comunal -> astronomia
  porta(47,16);                          // salao -> torre do diretor
  porta(87,28);porta(87.5,46);porta(88,60.5); // estufa, cabana, corujal
  // janelas do salao e da biblioteca (paredes de fora)
  for(const x of [36,41,46,51,56])janela(x,16);
  for(const x of [24,34])janela(x,62);
  for(const y of [20,30,40,50])janela(8,y);
  // ---------- SALAO PRINCIPAL: quatro mesas compridas, bancos, mesa alta, velas flutuando ----------
  {const mesa=um(/Table_Rectangle_Wood_Dark_A_4x2\./),banco=um(/Bench_Wood_Dark_C1_3x1\./)||um(/Bench_Wood_Dark_/);
    const ys=[19.4,22.3,25.2,28.1].map(y=>y-.35);
    for(const [i,y] of ys.entries()){for(let x=36;x<=52;x+=4){await put(mesa,x+2,y,[0,1]);}
      for(let x=36.5;x<=53;x+=3.2){await put(banco,x+1.5,y-1.25,[0,1]);await put(banco,x+1.5,y+1.25,[0,-1])}
      // loucas e comida nas mesas
      const louca=acha(/Decor\/Clutter\/Dishes\/(Plates|Goblets|Cups|Mugs|Bowls)\/.*_(Gold|Silver|Metal_Gold|Metal_Silver).*_1x1\./),comida=acha(/Clutter\/Food\/(Breads|Fruits|Meats\/Cooked|Pies|Cakes)\//);
      for(let x=36.6;x<55.6;x+=.9){if(louca.length)await put(esc(louca),x,y-.45,null,{r:R()*6.28,l:300});if(louca.length)await put(esc(louca),x+.3,y+.45,null,{r:R()*6.28,l:300});if(comida.length&&R()<.45)await put(esc(comida),x+.45,y,null,{r:R()*6.28,l:300})}}
    // mesa alta (leste), cadeiras viradas para o salao
    const mesaA=um(/Table_Rectangle_Wood_Walnut_A_4x2\./)||mesa,cad=um(/Fancy_Chair_Wood_Walnut_.*_1x1\./)||um(/Fancy_Chair_/),trono=um(/Throne_.*Gold|Throne_/);
    for(let y=17.8;y<=26;y+=4)await put(mesaA,58.6,y+2,[-1,0]);
    for(let y=18.2;y<=28.4;y+=1.1){if(Math.abs(y-23)<.6&&trono){await put(trono,60.4,23,[-1,0]);continue}await put(cad,59.9,y,[-1,0])}
    // velas flutuando (camada alta) e luzes
    const vela=acha(/Lightsources\/Candles\/Candle_Wax\/Candle_(White|Yellow|Cream)_Wax_A\d_1x1\./);
    for(let x=35;x<=58;x+=2.3)for(let y=17.5;y<=29;y+=2.6){if(vela.length)await put(esc(vela),x+R()*.8,y+R()*.8,null,{r:R()*6.28,l:400})}
    for(let x=37;x<=57;x+=5)for(const y of [19.5,26.5])luz(x,y,"vela",{raio:5,claro:2,forca:.9});
    // estandartes das quatro casas nas paredes compridas
    const cores=["Red","Green","Yellow","Blue"];for(const [i,cn] of cores.entries()){const b=um(new RegExp("Flag_Banner_Fabric_"+cn+"_Large_A1_3x1\\."));if(b){await naParede(b,38.5+i*5.5,16,[0,1]);await naParede(b,38.5+i*5.5,30,[0,-1])}}
    const lar=um(/Fireplace_Rectangle_Chimney_Stone_Slate_A_Wood_Dark_2x2\./)||um(/Fireplace_Rectangle_Chimney_Stone_.*_2x2\./);if(lar){await naParede(lar,43.5,30,[0,-1]);await naParede(lar,50.5,30,[0,-1]);luz(43.5,28.5,"lareira");luz(50.5,28.5,"lareira")}
  }
  // ---------- SAGUAO: escadaria, estatuas, tapete, tochas ----------
  {const esc_=um(/Stairs_Stone_Slate_Wide_A_2x3\./)||um(/Stairs_Stone_.*_Wide_A_2x3\./);if(esc_){await put(esc_,23,18.5,[0,1]);await put(esc_,29,18.5,[0,1])}
    const est=acha(/Statue_Marble_(Black|White)_Standing_Knight_[AB]_2x2\./);for(const [x,y] of [[21.5,26],[30.5,26]])if(est.length)await put(esc(est),x,y,[0,-1]);
    const tap=um(/Rugs_and_Carpets\/.*Runner.*Red.*_\dx\d\./)||um(/Rug_.*Red.*_2x[4-6]\./);if(tap)await put(tap,26,23,[0,1],{l:100});
    const toc=acha(/Wall_Torch_A_0[12]_1x1\./);for(const [x,y,n] of [[20,18,[1,0]],[20,28,[1,0]],[32,19,[-1,0]],[32,27,[-1,0]]])if(toc.length){await naParede(toc[0],x,y,n);luz(x+n[0]*.6,y+n[1]*.6,"tocha")}
    const cand=um(/Chandelier_Metal_Gray_A_Lit_2x2\./);if(cand){await put(cand,26,23,null,{l:400});luz(26,23,"lampiao",{raio:8,claro:4})}}
  // ---------- SALAS DE AULA: carteiras em fileiras viradas para o quadro ----------
  const salaAula=async(x0,y0,x1,y1,tema)=>{const cart=acha(/Furniture\/Tables\/Desks\/Desk_Rectangle_Wood_(Dark|Walnut)_[A-D]1_2x1\./),cad=acha(/Seating\/Chairs\/.*Chair_Wood_(Dark|Walnut)_[B-H]_1x1\./),quadro=um(/Blackboard_Wood_Dark_A1_3x1\./);
    // quadro na parede norte, mesa do professor, alunos olhando para o norte
    if(quadro)await naParede(quadro,(x0+x1)/2,y0,[0,1]);const prof=um(/Fancy_Desk_Rectangle_Wood_Walnut_A1_2x1\./)||esc(cart);await put(prof,(x0+x1)/2,y0+2.2,[0,1]);await put(esc(cad),(x0+x1)/2,y0+1.3,[0,1]);
    for(let y=y0+4.2;y<=y1-1.6;y+=2.1)for(const x of [x0+2.6,x0+6,x0+9.4].filter(x=>x<x1-1.5)){await put(esc(cart),x,y,[0,-1]);await put(esc(cad),x,y+.95,[0,-1])}
    const est=acha(/Furniture\/Shelves\/.*Shelf_Wood_(Dark|Walnut)_Filled_[A-Z]\d_2x1\./);if(est.length){await naParede(esc(est),x0,y0+3,[1,0]);await naParede(esc(est),x0,y1-2,[1,0])}
    if(tema)await tema(x0,y0,x1,y1);luz((x0+x1)/2,(y0+y1)/2,"lampiao",{raio:7,claro:3})};
  await salaAula(8,16,20,26,async(x0,y0,x1,y1)=>{const g=acha(/Domesticated_Animals\/.*(Cage|Bird|Cat).*_1x1\./);if(g.length)await put(esc(g),x1-1.2,y0+1.2,null,{r:0})});
  await salaAula(8,26,20,36,async(x0,y0,x1,y1)=>{const p=acha(/Feather|Quill/);if(p.length)for(let i=0;i<5;i++)await put(esc(p),x0+3+R()*7,y0+4+R()*5,null,{r:R()*6.28,l:300})});
  await salaAula(8,36,20,46,async(x0,y0,x1,y1)=>{const ar=acha(/Armor_Stand_Wood_.*_1x1\.|Mannequin_.*Armor/);if(ar.length){await put(esc(ar),x1-1,y0+1.2,[0,1]);await put(esc(ar),x1-1,y1-1.2,[0,-1])}});
  // ---------- TORRE DE ASTRONOMIA ----------
  {const tel=acha(/Decor\/Telescopes\/Telescope_Metal_Brass_A[12]_/);for(let i=0;i<5;i++){const t=i/5*Math.PI*2+.3;if(tel.length)await put(esc(tel),67.5+Math.cos(t)*3.8,47+Math.sin(t)*3.8,[Math.cos(t),Math.sin(t)])}
    const gl=acha(/Decor\/Office\/Globes\/Globe_Large_Brace_/);if(gl.length)await put(esc(gl),67.5,47,null);const esp=um(/Spiral_Staircase_Metal_Gray_A1_3x3\./);if(esp)await put(esp,69.5,44.5,null);luz(67.5,47,"lua",{raio:8,claro:4})}
  // ---------- SALA DE POCOES: mesas com caldeiroes, prateleiras de frascos ----------
  {const mesa=acha(/Table_Rectangle_Wood_Dark_[EFG]_2x1\./),cal=acha(/Cauldron_Metal_(Gray|Rusty)_Filled_[AB]\d_1x1\./),fr=acha(/Alchemy\/Glassware\/Filled\/.*_1x1\./),est=acha(/Shelf_Wood_Dark_Filled_[A-Z]\d_2x1\./);
    for(let y=55;y<=60;y+=2.6)for(const x of [43,46.2,49.4]){await put(esc(mesa),x,y,[0,-1]);if(cal.length)await put(esc(cal),x-.45,y,null,{r:R()*6.28,l:300});for(let k=0;k<2;k++)if(fr.length)await put(esc(fr),x+.35+R()*.4,y-.2+R()*.4,null,{r:R()*6.28,l:300})}
    if(est.length)for(const x of [42,45,48])await naParede(esc(est),x,52,[0,1]);for(const y of [54.5,58])if(est.length)await naParede(esc(est),40,y,[1,0]);
    luz(43,54,"veneno",{raio:4});luz(49,59,"veneno",{raio:4});luz(46,57,"vela",{raio:5})}
  // ---------- PATIO: fonte, arvores, bancos ----------
  {const base=um(/Fountains\/.*Fountain_Base.*Stone.*Circle.*_[34]x[34]\.|Basin_Base_Stone_.*Large_Circle_A1_[34]x[34]\./),est=um(/Fountain_Statue_Marble_White_Pouring_Jug_A1_1x1\./);if(base)await put(base,32,41,null,{l:150});if(est)await put(est,32,41,[0,1],{l:210});
    const agua=um(/Water\/.*Ripple|Water_Foam_Flow_A1/);if(agua)await put(agua,32,41,null,{l:160});
    const arv=acha(/Flora\/Trees\/Tree_Tops\/Tree_(Oak|Deciduous|Ash|Maple|Elm)[^/]*_A[12]_[4-6]x[4-6]\./);const arv2=arv.length?arv:acha(/Flora\/Trees\/Tree_Tops\/.*_[4-6]x[4-6]\./);
    for(const [x,y] of [[24,34],[40,34],[24,48],[40,48]])if(arv2.length)await put(esc(arv2),x,y,null,{r:R()*6.28,l:400});
    const banco=um(/Bench_Wood_Dark_A1_2x1\./);for(const [x,y,f] of [[32,37.4,[0,-1]],[32,44.6,[0,1]],[28.4,41,[-1,0]],[35.6,41,[1,0]]])if(banco)await put(banco,x,y,f);
    const fl=acha(/Flora\/Flowers\/Flower_.*_A\d_1x1\./);for(let i=0;i<40;i++)if(fl.length)await put(esc(fl),21+R()*22,31+R()*20,null,{r:R()*6.28,l:120})}
  // ---------- ESTUFAS: bancadas com vasos e canteiros ----------
  {const banc=acha(/Table_Rectangle_Wood_Ashen_[EFG]_2x1\./),vaso=acha(/Potted_Plant_.*_1x1\./),plan=acha(/Flora\/(Bushes|Plants|Ferns)\/.*_1x1\./);
    for(let y=20;y<=26;y+=3)for(let x=80.5;x<=93.5;x+=2.6){await put(esc(banc),x,y,[0,1]);for(let k=0;k<2;k++)if(vaso.length)await put(esc(vaso),x-.5+k*1,y,null,{r:R()*6.28,l:300})}
    for(let i=0;i<14;i++)if(plan.length)await put(esc(plan),79+R()*16,18.6+R()*.6,null,{r:R()*6.28});luz(87,23,"lampiao",{raio:8,claro:4})}
  // ---------- CORUJAL ----------
  {const feno=acha(/Hay_(Pile|Bale).*_1x1\.|Straw_/),pena=acha(/Feather/),cx=88,cy=64;for(let i=0;i<8;i++){const t=i/8*6.28;if(feno.length)await put(esc(feno),cx+Math.cos(t)*2.4,cy+Math.sin(t)*2.4,null,{r:R()*6.28})}for(let i=0;i<10;i++)if(pena.length)await put(esc(pena),cx-2+R()*4,cy-2+R()*4,null,{r:R()*6.28,l:120})}
  // ---------- EXTERIOR: caminhos, horta de aboboras, floresta, lago ----------
  {// estradas de terra: forma com a textura de terra em volta da linha
    const pp=(P,larg)=>{if(!P_TERRA)return;const {E,D}=V.fita(P,larg||1.6,false);ops.push({op:"cria",a,k:"padroes",item:{id:MD.novoId(M),t:MD.texDe(M,P_TERRA),p:E.concat(D.slice().reverse()).map(q=>[+q[0].toFixed(3),+q[1].toFixed(3)]),l:-50,raio:.6}})};
    pp([[26,2],[26,8],[26,15.6]],2.2);pp([[26,10],[50,9],[76,12],[87,17.8]]);pp([[72,34],[80,38],[87.5,39.8]]);pp([[62.5,58],[76,60],[84.7,62.2]]);
    const ab=acha(/Pumpkin.*_1x1\./);for(let i=0;i<14;i++)if(ab.length)await put(esc(ab),93+R()*5,41+R()*5,null,{r:R()*6.28});
    const arv=acha(/Flora\/Trees\/Tree_Tops\/Tree_(Oak|Deciduous|Ash|Maple|Elm|Pine|Spruce|Fir)[^/]*_[5-7]x[5-7]\./);const arv2=arv.length?arv:acha(/Flora\/Trees\/Tree_Tops\/.*_[5-7]x[5-7]\./);
    for(let i=0;i<70;i++){const x=76+R()*28,y=R()*82;if(y>14&&y<31&&x<98)continue;if(y>37&&y<49&&x>80&&x<99)continue;if(y>58&&y<70&&x>82&&x<95)continue;if(arv2.length)await put(esc(arv2),x,y,null,{r:R()*6.28,l:400})}
    for(let i=0;i<24;i++){const x=R()*104,y=R()*7;if(x>20&&x<32)continue;if(arv2.length)await put(esc(arv2),x,y,null,{r:R()*6.28,l:400})}
    const lago=[[0,66],[10,64],[22,66],[36,68],[48,67],[58,70],[66,74],[70,82],[0,82]];const agua=tx(/Water_Pattern\/.*Water_A|patterns\/.*Water/);ops.push({op:"cria",a,k:"padroes",item:{id:MD.novoId(M),t:agua?MD.texDe(M,agua):MD.texDe(M,"atlas:m/agua"),p:lago,l:-60,cv:null}});
    const barco=acha(/Vehicles\/Ships\/.*Rowboat.*_\dx\d\.|Rowboat/);if(barco.length)await put(esc(barco),30,72,[1,0])}
  // ---------- TELHADOS ----------
  const telh=(p,op)=>ops.push({op:"cria",a,k:"telhados",item:Object.assign({id:MD.novoId(M),p},op)});
  telh(ret(8,16,72,62),{t:MD.texDe(M,TELHA),tq:CUME?MD.texDe(M,CUME):undefined,alas:[
    // alas que se sobrepoem (a juncao vira rincao, como num telhado de verdade); o salao e uma duas-aguas mais alta
    {x0:8,y0:16,x1:20,y1:56},{x0:8,y0:16,x1:72,y1:30},{x0:32,y0:16,x1:62,y1:30,tipo:"duas",eixo:"x",k:1.3},{x0:62,y0:16,x1:72,y1:40},
    {x0:44,y0:28,x1:62,y1:62},{x0:20,y0:52,x1:62,y1:62},{x0:8,y0:52,x1:24,y1:56}],cq:[.7,.7,.75,1]});
  const torreArte=cor=>um(new RegExp("Towers/Roof_A/Roof_A_"+cor+"_Tower_Round_C\\."))||um(/Towers\/Roof_A\/Roof_A_[A-Za-z]+_Tower_Round_C\./);
  for(const [cm,cor] of [[C_.dormitorio,"Red"],[C_.diretor,"Gray"],[C_.astronomia,"Blue"],[C_.corujal,"Gray"]]){const k=torreArte(cor);telh(cm.P,k?{arte:MD.texDe(M,k),t:MD.texDe(M,TELHA2),escArte:1.15}:{t:MD.texDe(M,TELHA2),estilo:"quatro"})}
  telh(ret(78,18,96,28),{t:MD.texDe(M,TELHA_V),tq:CUME_V?MD.texDe(M,CUME_V):undefined,alas:[{x0:78,y0:18,x1:96,y1:28,tipo:"duas",eixo:"x"}]});
  telh(ret(84,40,91,46),{t:MD.texDe(M,TELHA_M),tq:CUME_M?MD.texDe(M,CUME_M):undefined,alas:[{x0:84,y0:40,x1:91,y1:46,tipo:"duas",eixo:"x"}]});
  e.hist.exec(ops,{nome:"Castelo-escola"});await new Promise(r=>setTimeout(r,300));await e.artesPC().espera();
  // ---------- comodos cheios pelo gerador de zonas (sem paredes proprias) ----------
  const inset=(P,d)=>{let cx=0,cy=0;for(const q of P){cx+=q[0];cy+=q[1]}cx/=P.length;cy/=P.length;return P.map(q=>{const dx=q[0]-cx,dy=q[1]-cy,L=Math.hypot(dx,dy)||1;return [q[0]-dx/L*d*1.41,q[1]-dy/L*d*1.41]})};
  const insetR=(x0,y0,x1,y1,d)=>ret(x0+d,y0+d,x1-d,y1-d);
  const Z=[[insetR(62,16,72,24,.15),"cozinha",3],[insetR(62,24,72,30,.15),"despensa",2],[insetR(62,30,72,40,.15),"sala",3],[insetR(8,46,20,56,.15),"dormitorio",2],[insetR(20,52,40,62,.15),"biblioteca",3],
    [insetR(52,52,62,62,.15),"despensa",1],[insetR(44,40,62,52,.15),"sala",3],[inset(C_.dormitorio.P,.2),"dormitorio",3],[inset(C_.diretor.P,.2),"escritorio",3],[insetR(84,40,91,46,.15),"quarto",0],[insetR(44,30,62,40,.15),"loja",3]];
  for(const [P,tipo,rq] of Z){const z=e.zonas.criar(P,tipo,{riqueza:rq,dens:.75,bag:.7,paredes:false,fonte:"auto",pacote:"FA35OB01",estilo:""});await new Promise(r=>setTimeout(r,150));while(e.zonas.ocupado())await new Promise(r=>setTimeout(r,120));zonas.push(z&&z.id)}
  await e.artesPC().espera();
  // tira o que as zonas puseram na frente das portas
  {const A=M.andares[0],rm=[];A.objetos.forEach((ob,i)=>{if(!ob.z)return;for(const [x,y] of portasAll)if(Math.hypot(ob.x-x,ob.y-y)<1.25){rm.push({op:"apaga",a:0,k:"objetos",item:ob,pos:i});break}});rm.sort((p,q)=>q.pos-p.pos);if(rm.length)e.hist.exec(rm,{nome:"portas livres"})}
  return {objetos:M.andares[0].objetos.length,paredes:PAR.length,zonas:zonas.length,falta:log}}
