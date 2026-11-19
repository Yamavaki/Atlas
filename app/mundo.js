// Atlas — modelo do mundo: grade unica em camadas, preenchida pelas formas exatas de cada coisa (0.55)
// A grade e o indice; a verdade e a forma exata (poligono de cada construcao pela ficha, faixa de cada rua com a largura real,
// linha da muralha com espessura, margem da agua). Cada celula tem 2 unidades do mapa, o mesmo passo do indice de bairros e andares.
(function(){
const CS=2;
// usos de uma celula (o mais forte pintado por ultimo)
const USO={livre:0,campo:1,quintal:2,praca:3,rua:4,estrada:5,escada:6,cais:7,ponte:8,muralha:9,portao:10,construcao:11,detalhe:12,arvore:13,barco:14};
const USON=Object.keys(USO);
const AGUA={seco:0,rio:1,mar:2,fosso:3};
const AGUAN=["seco","rio","mar ou lago","fosso"];
// cores da grade no app
const COR={campo:"#c9c06a",quintal:"#9fc070",praca:"#e2cfa0",rua:"#bba98a",estrada:"#a8936a",escada:"#d8d0b8",cais:"#8a8a80",ponte:"#a0784a",muralha:"#3a3a3a",portao:"#7a2a2a",construcao:"#c0504d",detalhe:"#7b4fa3",arvore:"#3f7a3a",barco:"#5a4030"};
// o que pode ficar na agua sem ser erro
const AGUAOK=new Set(["palafita","ship","boat","wreck","watermill","shipwright","crane","fishery","lighthouse","cargo"]);
// adereco de rua: pode ficar na rua
const RUAOK=new Set(["lamp","bench","stall","markettent","goods","crates","cargo","cart","wagon","well","fountain","statue","marketcross","wayshrine","gallows","obelisk","maypole","flowerbed","pipes","barrel","haystack","scarecrow"]);

function inPoly(P,x,y){let c=false;for(let i=0,j=P.length-1;i<P.length;j=i++){const a=P[i],b=P[j];if((a[1]>y)!==(b[1]>y)&&x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0])c=!c}return c}

function Grade(W,H){const w=Math.ceil(W/CS)+1,h=Math.ceil(H/CS)+1,n=w*h;
  const G={cs:CS,w,h,W,H,alt:new Float32Array(n),andar:new Int8Array(n).fill(-1),bairro:new Int16Array(n).fill(-1),agua:new Uint8Array(n),uso:new Uint8Array(n),dono:new Int32Array(n).fill(-1),reserva:new Uint8Array(n),copa:new Uint8Array(n),
    objs:[],conf:new Map(),
    idx(x,y){const i=Math.floor(x/CS),j=Math.floor(y/CS);return i<0||j<0||i>=w||j>=h?-1:j*w+i},
    // pinta um poligono: chama fn(k,x,y) para cada celula cujo centro cai dentro
    poly(P,fn){if(!P||P.length<3)return;let y0=1e9,y1=-1e9;for(const v of P){if(v[1]<y0)y0=v[1];if(v[1]>y1)y1=v[1]}const j0=Math.max(0,Math.floor(y0/CS)),j1=Math.min(h-1,Math.ceil(y1/CS));
      for(let j=j0;j<=j1;j++){const y=(j+.5)*CS,xs=[];for(let i=0,k=P.length-1;i<P.length;k=i++){const a=P[i],b=P[k];if((a[1]>y)!==(b[1]>y))xs.push(a[0]+(y-a[1])*(b[0]-a[0])/(b[1]-a[1]))}xs.sort((p,q)=>p-q);
        for(let t=0;t+1<xs.length;t+=2){const i0=Math.max(0,Math.ceil(xs[t]/CS-.5)),i1=Math.min(w-1,Math.floor(xs[t+1]/CS-.5));for(let i=i0;i<=i1;i++)fn(j*w+i,(i+.5)*CS,y)}}},
    circ(cx,cy,r,fn){const j0=Math.max(0,Math.floor((cy-r)/CS)),j1=Math.min(h-1,Math.ceil((cy+r)/CS)),i0=Math.max(0,Math.floor((cx-r)/CS)),i1=Math.min(w-1,Math.ceil((cx+r)/CS));
      for(let j=j0;j<=j1;j++)for(let i=i0;i<=i1;i++){const x=(i+.5)*CS,y=(j+.5)*CS;if((x-cx)*(x-cx)+(y-cy)*(y-cy)<=r*r)fn(j*w+i,x,y)}},
    // faixa: linha com largura (ruas, muralha, pontes, fosso)
    faixa(pts,lw,fn){if(!pts||pts.length<2)return;const hw=lw/2;for(let i=1;i<pts.length;i++){const a=pts[i-1],b=pts[i],l=Math.hypot(b[0]-a[0],b[1]-a[1]);if(l<1e-6)continue;const nx=-(b[1]-a[1])/l*hw,ny=(b[0]-a[0])/l*hw;G.poly([[a[0]+nx,a[1]+ny],[b[0]+nx,b[1]+ny],[b[0]-nx,b[1]-ny],[a[0]-nx,a[1]-ny]],fn)}for(const p of pts)G.circ(p[0],p[1],hw,fn)},
    obj(o){o.n=G.objs.length;G.objs.push(o);return o.n},
    conflito(tipo,a,b,k){const key=tipo+"|"+a+"|"+(b==null?"":b);let c=G.conf.get(key);if(!c){c={tipo,a,b,n:0,x:0,y:0};G.conf.set(key,c)}c.n++;if(c.n===1){c.x=(k%w+.5)*CS;c.y=(Math.floor(k/w)+.5)*CS}},
    em(x,y){const k=G.idx(x,y);if(k<0)return null;const d=G.dono[k];return {uso:USON[G.uso[k]],agua:AGUAN[G.agua[k]],alt:+G.alt[k].toFixed(3),andar:G.andar[k],bairro:G.bairro[k],dono:d>=0?G.objs[d]:null,reserva:G.reserva[k],copa:G.copa[k]===1?"copa de árvore":G.copa[k]===2?"arbusto ou pedra":null}},
    // a forma cabe aqui? (para o editor): devolve a lista de impedimentos
    cabe(P,tipo,ignorar){const imp=new Map();G.poly(P,k=>{const u=G.uso[k],d=G.dono[k];let r=null;if(G.agua[k]&&!AGUAOK.has(tipo))r="água";else if(u===USO.muralha||u===USO.portao)r="muralha";else if(u===USO.ponte)r="ponte";else if((u===USO.rua||u===USO.estrada)&&!RUAOK.has(tipo))r="rua";else if(u===USO.construcao&&d!==ignorar)r="construção";if(r)imp.set(r,(imp.get(r)||0)+1)});return imp},
    lista(){return [...G.conf.values()].filter(c=>c.n>=2).sort((a,b)=>b.n-a.n)},
    resumo(){const R={};for(const c of G.lista())R[c.tipo]=(R[c.tipo]||0)+1;return R}};
  return G}

// monta a grade de uma cidade gerada e desenhada (o desenho ainda cria cais e fosso; a partir da 0.56 eles nascem no gerador)
function deCidade(C,AS,opt){opt=opt||{};const Z=(window.AtlasCity&&AtlasCity.Z)||1.55,TILT=(window.AtlasCity&&AtlasCity.TILT)||.7,WX=1500,WY=Math.ceil((1020+64)/TILT)+2,G=Grade(WX,WY),w=G.w,h=G.h;
  // 1. chao: altura, andar, bairro, agua
  // 0.64: o chao (altura, andar, bairro, agua) so muda quando a cidade e gerada de novo; fica guardado na propria cidade
  const G0=C._G0;if(G0&&G0.w===w&&G0.h===h){G.alt.set(G0.alt);G.andar.set(G0.andar);G.bairro.set(G0.bairro);G.agua.set(G0.agua)}else{
  const BW=C.BW,BH=C.BH;for(let j=0;j<h;j++)for(let i=0;i<w;i++){const k=j*w+i,x=(i+.5)*CS,y=(j+.5)*CS;
    const AF=C.baseAt||C.elev;if(AF&&(i%3===0&&j%3===0))G.alt[k]=AF(x,y);else if(AF)G.alt[k]=G.alt[Math.floor(j/3)*3*w+Math.floor(i/3)*3];
    if(C.BID&&BW){const q=Math.min(BH-1,j)*BW+Math.min(BW-1,i),bi=C.BID[q];if(bi>=0&&C.TBL&&C.TBL[bi])G.andar[k]=C.TBL[bi].lv;if(C.WID)G.bairro[k]=C.WID[q]}
    if(C.land(x,y)<.05)G.agua[k]=AGUA.mar;else if(C.rw&&C.rd(x,y)<C.rw)G.agua[k]=AGUA.rio}
  try{Object.defineProperty(C,"_G0",{value:{w,h,alt:G.alt.slice(),andar:G.andar.slice(),bairro:G.bairro.slice(),agua:G.agua.slice()},configurable:true,enumerable:false,writable:true})}catch(e){}}
  for(const l of C.WLS||[])G.faixa(l.pts,(l.hw||6)*2,k=>{if(!G.agua[k])G.agua[k]=AGUA.rio});
  for(const m of C._moat&&C._moat.length?C._moat:(C.MOAT||[]).map(z=>z.pts))G.faixa(m,13,k=>{if(!G.agua[k])G.agua[k]=AGUA.fosso});
  if(G.bairro.every(v=>v<0))C.inner.forEach((p,ix)=>{if(!p.sea&&p.poly)G.poly(p.poly,k=>{G.bairro[k]=ix})});
  const set=(u,dono)=>(k)=>{G.uso[k]=u;if(dono!=null)G.dono[k]=dono};
  // 2. areas abertas: campos, quintais, pracas; dentro da cidade o que nao e quarteirao e rua
  const CAMPOS=[];for(const f of C.fields||[]){const n=G.obj({tipo:"campo",nome:f.orch?"Pomar":"Campo",ref:f});CAMPOS.push(n);G.poly(f.poly,set(USO.campo,n))}
  const BL=[];for(const p of C.patches||[]){if(p.sea)continue;for(const b of(p.blocks&&p.blocks.length?p.blocks:p.block?[p.block]:[]))if(b&&b.length>2)BL.push(b)}
  for(const p of C.inner||[]){if(p.sea||!p.poly)continue;G.poly(p.poly,(k,x,y)=>{if(!G.agua[k])G.uso[k]=USO.rua})}
  for(const b of BL)G.poly(b,k=>{if(G.uso[k]===USO.rua)G.uso[k]=USO.livre});
  const QUINT=[];for(const y_ of C.yards||[]){const n=G.obj({tipo:"quintal",nome:"Quintal",ref:y_});QUINT.push(n);G.poly(y_.poly,set(USO.quintal,n))}
  for(const q of C.squares||[])G.poly(q.poly,set(USO.praca));
  for(const r of C.roads||[])G.faixa(r,6.6,k=>{if(!G.agua[k]&&G.uso[k]<USO.rua)G.uso[k]=USO.estrada});
  for(const l of C.LINES||[])if(l.t==="road")G.faixa(l.pts,7.6,k=>{if(!G.agua[k]&&G.uso[k]<USO.rua)G.uso[k]=USO.estrada});
  for(const z of C.SCON||[])G.faixa([z.a,z.b],z.w||6,k=>{if(G.uso[k]<USO.rua)G.uso[k]=USO.rua});
  // 3. estruturas: pontes, cais, escadas, muralha, portoes
  for(const b of C.bridgesR||[]){const n=G.obj({tipo:"ponte",nome:"Ponte",key:b.key});G.faixa([b.a,b.b],b.wd||6,set(USO.ponte,n))}
  for(const q of(C._qsegs&&C._qsegs.length?C._qsegs:C.QSEGS)||[]){if(q.off)continue;const n=G.obj({tipo:"cais",nome:"Cais",key:q.key});G.faixa([q.a,q.b],3,set(USO.cais,n))}
  for(const q of C.quays||[]){if(!q.sea)continue;const n=G.obj({tipo:"cais",nome:"Cais do mar"});G.faixa([q.a,q.b],4,set(USO.cais,n))}
  for(const [a,b] of C.piers||[]){const n=G.obj({tipo:"pier",nome:"Píer"});G.faixa([a,b],5,set(USO.cais,n))}
  for(const z of C.STR||[]){const n=G.obj({tipo:z.ramp?"rampa":"escada",nome:z.ramp?"Rampa":"Escada"});if(z.ramp)G.faixa([[z.x-z.dx*8,z.y-z.dy*8],[z.x+z.dx*8,z.y+z.dy*8]],z.w||7,set(USO.escada,n));else G.circ(z.x,z.y,(z.w||7)/2,set(USO.escada,n))}
  for(const wl of C.walls||[]){if(!wl.pts)continue;const n=G.obj({tipo:"muralha",nome:"Muralha"});const P=wl.closed?wl.pts.concat([wl.pts[0]]):wl.pts;G.faixa(P,4.5,(k)=>{G.uso[k]=USO.muralha;G.dono[k]=n})}
  for(const g of C.gates||[]){const n0=C.nodes[g];if(!n0)continue;let nd={x:n0.x,y:n0.y};
    // o portao fica preso na linha da muralha, como no desenho (o no da rua pode ficar ate 24 unidades fora dela)
    if(C.WALLON){let bd=C.GATESNAP||24;for(const w of C.walls||[]){if(!w.pts)continue;const W2=w.pts,m=W2.length;for(let i=0;i<m-(w.closed?0:1);i++){const a=W2[i],b=W2[(i+1)%m],dx=b[0]-a[0],dy=b[1]-a[1],l=dx*dx+dy*dy||1,tt=Math.max(0,Math.min(1,((n0.x-a[0])*dx+(n0.y-a[1])*dy)/l)),q={x:a[0]+dx*tt,y:a[1]+dy*tt},d=Math.hypot(q.x-n0.x,q.y-n0.y);if(d<bd){bd=d;nd=q}}}}
    const n=G.obj({tipo:"portao",nome:"Portão"});G.circ(nd.x,nd.y,6.5,set(USO.portao,n));G.circ(nd.x,nd.y,14,k=>{G.reserva[k]|=1})}
  for(const b of C.bridgesR||[])for(const e of[b.a,b.b])G.circ(e[0],e[1],7,k=>{G.reserva[k]|=2});
  // 4. construcoes: casas (retangulo girado exato, mais a ala), especiais e adereços pela ficha (pegada no chao)
  const obbP=(x,y,a,L,D)=>{const c=Math.cos(a),s=Math.sin(a);return [[-1,-1],[1,-1],[1,1],[-1,1]].map(([i,j])=>[x+c*i*L/2-s*j*D/2,y+s*i*L/2+c*j*D/2])};
  const pinta=(P,n,tipo,uso,ehAgua)=>{G.poly(P,k=>{const u=G.uso[k],d=G.dono[k];
      if(uso===USO.construcao){if(u===USO.construcao&&d!==n&&d>=0)G.conflito("construção sobre construção",Math.min(d,n),Math.max(d,n),k);
        else if((u===USO.rua||u===USO.estrada)&&!RUAOK.has(tipo))G.conflito("construção na rua",n,null,k);
        else if(u===USO.muralha||u===USO.portao)G.conflito("construção na muralha",n,null,k);
        else if(u===USO.ponte)G.conflito("construção na ponte",n,null,k);
        else if(G.agua[k]&&!AGUAOK.has(tipo)&&u!==USO.cais)G.conflito("construção na água",n,null,k)}
      else if(uso===USO.detalhe){if(u===USO.construcao&&d>=0&&d!==n)G.conflito("adereço sobre construção",d,n,k);else if(G.agua[k]&&!AGUAOK.has(tipo)&&u!==USO.cais&&u!==USO.ponte)G.conflito("adereço na água",n,null,k);else if(u===USO.muralha||u===USO.portao)G.conflito("adereço na muralha",n,null,k);else if((G.reserva[k]&1)&&tipo!=="lamp")G.conflito("adereço na frente do portão",n,null,k)}
      else if(uso===USO.arvore){if(u===USO.construcao&&d>=0)G.conflito("árvore em construção",d,n,k);else if(u===USO.rua&&!opt.arvRua)G.conflito("árvore na rua",n,null,k)}
      if((uso!==USO.arvore&&uso!==USO.detalhe)||u<USO.construcao){G.uso[k]=uso;G.dono[k]=n}})};
  const NAME=(AS&&AS.NAME)||{};
  for(const b of C.B||[]){if(b.k||!b.L)continue;const tp=b.form==="stilt"?"palafita":"casa",n=G.obj({tipo:tp,nome:b.form==="stilt"?"Casa sobre palafitas":"Casa",key:b.key,ref:b});pinta(obbP(b.x,b.y,b.ang||0,b.L,b.D),n,tp,USO.construcao);if(b.wing){const wg=b.wing;pinta(obbP(wg.x,wg.y,wg.ang||0,wg.L,wg.D),n,"casa",USO.construcao)}}
  const pegada=(q,F,z)=>{const L=[];for(const P of F.pegada)L.push(P.map(v=>[q.x+v[0]*z,q.y+v[1]*z]));return L};
  for(const q of C.SPB||[]){let F=null,z=1,tipo=q.id||(q.k===2?"templo":q.k===3?"castelo":"especial");
    if(q.id&&AS&&AS.ficha){F=AS.ficha(q.id,q.race,q.v,q.ang||0,q.aov);z=(q.s||1)*Z}
    else if((q.k===2||q.k===3)&&AS&&AS.fichaDe&&window.AtlasGen){const zz=q.k===3?2:(q.big?2.2:1.8),qq=Object.assign({},q,{x:0,y:0,sz:1});F=AS.fichaDe("big|"+q.k+"|"+q.race+"|"+(q.v||0).toFixed(2)+"|"+(q.ang||0).toFixed(2)+"|"+(q.big?1:0)+"|"+(q.ms||1),c=>AtlasGen.kit.drawBig(c,qq));z=zz}
    const n=G.obj({tipo,nome:q.name||NAME[q.id]||tipo,key:q.key,ref:q});
    if(F&&F.pegada.length)for(const P of pegada(q,F,z))pinta(P,n,tipo,USO.construcao);else G.circ(q.x,q.y,(q.r||12)*.7,k=>{pinta([[q.x-.1,q.y-.1],[q.x+.1,q.y-.1],[q.x,q.y+.1]],n,tipo,USO.construcao)})}
  for(const q of C.props||[]){if(!q.id)continue;const n=G.obj({tipo:q.id,nome:NAME[q.id]||q.id,key:q.key,ref:q});let F=null;if(AS&&AS.ficha)F=AS.ficha(q.id,q.race,q.v,q.ang||0,q.aov);const z=(q.s||1)*Z*(q.street?.85:1);
    if(F&&F.pegada.length)for(const P of pegada(q,F,z))pinta(P,n,q.id,USO.detalhe);else G.circ(q.x,q.y,3,k=>{if(G.uso[k]<USO.construcao){G.uso[k]=USO.detalhe;G.dono[k]=n}})}
  for(const t of C.trees||[]){const n=G.obj({tipo:"arvore",nome:"Árvore",ref:t}),r=1.6*(t[2]||1);G.circ(t[0],t[1],34*1.25*(t[2]||1)*.36,k=>{G.copa[k]=1});const P=[];for(let a=0;a<8;a++)P.push([t[0]+Math.cos(a*.785)*r,t[1]+Math.sin(a*.785)*r]);pinta(P,n,"arvore",USO.arvore)}
  // vegetacao baixa e pedras soltas (mato), caminhos de fazenda, escadas do cais e bandeirolas (no ar: so registradas)
  for(const z of C.NAT||[]){const n=G.obj({tipo:z[3]==="rock"?"pedra":"mato",nome:z[3]==="rock"?"Pedra":"Mato",ref:z}),r=1.2*(z[2]||1);G.circ(z[0],z[1],(z[3]==="rock"?18*.55*.4:20*.75*.38)*(z[2]||1),k=>{if(!G.copa[k])G.copa[k]=2});const P=[];for(let a=0;a<8;a++)P.push([z[0]+Math.cos(a*.785)*r,z[1]+Math.sin(a*.785)*r]);pinta(P,n,"mato",USO.arvore)}
  for(const fp of C.farmPaths||[]){const n=G.obj({tipo:"caminho",nome:"Caminho",ref:fp});G.faixa(fp,3,k=>{if(G.uso[k]<USO.rua&&!G.agua[k]){G.uso[k]=USO.estrada;G.dono[k]=n}})}
  for(const z of C.QST||[]){const n=G.obj({tipo:"escada",nome:"Escada do cais",key:z.key,ref:z});G.circ(z.x,z.y,3,k=>{if(G.uso[k]<USO.construcao){G.uso[k]=USO.escada;G.dono[k]=n}})}
  for(const z of C.bunting||[])G.obj({tipo:"bandeirolas",nome:"Bandeirolas",key:z.key,ref:z,aereo:1,a:z.a,b:z.b});
  // navios e barcos: casco como retangulo girado (navio grande ~32 x 9, navio ~24 x 7, barco ~8 x 3)
  for(const [L,nav] of[[C.ships||[],1],[C.boats||[],0]])for(const s of L){const n=G.obj({tipo:nav?"navio":"barco",nome:nav?"Navio":"Barco",ref:s}),Lh=nav?(s.big?32:24):8,Dh=nav?(s.big?9:7):3.2,a=s.ang||0,c=Math.cos(a),sn=Math.sin(a);G.poly([[-1,-1],[1,-1],[1,1],[-1,1]].map(([i,j])=>[s.x+c*i*Lh/2-sn*j*Dh/2,s.y+sn*i*Lh/2+c*j*Dh/2]),k=>{G.uso[k]=USO.barco;G.dono[k]=n})}

  // 5. areas (campos e pomares): o que ficou por cima delas depois de tudo pintado
  for(const [L,nm] of[[CAMPOS,"campo"],[QUINT,"quintal"]])for(const n of L){const f=G.objs[n].ref;if(!f.poly||f.poly.length<3)continue;G.poly(f.poly,k=>{const u=G.uso[k];if(u===USO.muralha||u===USO.portao)G.conflito(nm+" na muralha",n,null,k);else if(u===USO.rua||u===USO.estrada)G.conflito(nm+" na estrada",n,null,k);else if(G.agua[k]&&u!==USO.ponte&&u!==USO.cais)G.conflito(nm+" na água",n,null,k)})}
  return G}

// grade de uma regiao (0.61): agua, estradas, ruas das vilas, pontes, muralhas, campos, hortas, lagoas e todas as construcoes
function deRegiao(W,AS){const AG=window.AtlasGen,WX=W.WX||1440,WY=W.WY||1500,G=Grade(WX,WY),w=G.w,h=G.h,sg=AG.sampleGrid,sst=(a,b,x)=>{const t=Math.max(0,Math.min(1,(x-a)/(b-a)));return t*t*(3-2*t)};
  const wet=(x,y)=>{const l=sg(W.land,x,y);return l<.04||sg(W.rdist,x,y)<12.5*(1+1.7*sst(.16,-.02,l))};
  for(let j=0;j<h;j++)for(let i=0;i<w;i++){const k=j*w+i,x=(i+.5)*CS,y=(j+.5)*CS;if(i%3===0&&j%3===0)G.alt[k]=sg(W.elev,x,y);else G.alt[k]=G.alt[Math.floor(j/3)*3*w+Math.floor(i/3)*3];const l=sg(W.land,x,y);if(l<.04)G.agua[k]=AGUA.mar}
  // rio: a faixa desenhada (largura do rio no desenho), nao a margem de seguranca do gerador
  for(const rv of W.rivers||[]){if(rv.pts&&rv.pts.length>1&&rv.pts[0][0]!=null)G.faixa(rv.pts,rv.w||16,k=>{if(!G.agua[k])G.agua[k]=AGUA.rio})}
  for(const p of W.ponds||[]){const n=G.obj({tipo:"lagoa",nome:"Lagoa",ref:p}),c=Math.cos(p.a||0),s=Math.sin(p.a||0),P=[];for(let a=0;a<16;a++){const u=Math.cos(a*.3927)*p.w/2,v=Math.sin(a*.3927)*p.h/2;P.push([p.x+c*u-s*v,p.y+s*u+c*v])}G.poly(P,k=>{G.agua[k]=AGUA.lago})}
  const set=(u,dono)=>(k)=>{G.uso[k]=u;if(dono!=null)G.dono[k]=dono};
  const CAMPOS=[];for(const f of W.fieldsP||[]){if(!f.poly||f.poly.length<3)continue;const n=G.obj({tipo:"campo",nome:"Campo",ref:f});CAMPOS.push(n);G.poly(f.poly,set(USO.campo,n))}
  const QUINT=[];for(const g of W.gardens||[]){const n=G.obj({tipo:"quintal",nome:"Horta",ref:g}),c=Math.cos(g.a||0),s=Math.sin(g.a||0),P=[[-1,-1],[1,-1],[1,1],[-1,1]].map(([i,j])=>[g.x+c*i*g.w/2-s*j*g.h/2,g.y+s*i*g.w/2+c*j*g.h/2]);g._poly=P;QUINT.push(n);G.poly(P,set(USO.quintal,n))}
  for(const r of W.roads||[]){const n=G.obj({tipo:"estrada",nome:"Estrada",ref:r});G.faixa(r,5,k=>{if(!G.agua[k]){G.uso[k]=USO.estrada;G.dono[k]=n}})}
  (W.towns||[]).forEach((t,ti)=>{for(const st of t.streets||[]){const n=G.obj({tipo:"rua",nome:"Rua de "+(t.name||"vila"),ref:st});G.faixa(st,4,k=>{if(!G.agua[k]){G.uso[k]=USO.rua;G.dono[k]=n}})}});
  for(const b of W.bridges||[]){const n=G.obj({tipo:"ponte",nome:"Ponte",ref:b});G.faixa([b[0],b[1]],6,set(USO.ponte,n));for(const e of b)G.circ(e[0],e[1],6,k=>{G.reserva[k]|=2})}
  for(const wl of W.walls||[]){const n=G.obj({tipo:"muralha",nome:"Muralha",ref:wl});for(const z of wl.segs||[]){if(z.sea)continue;if(z.gate){const m=[(z.a[0]+z.b[0])/2,(z.a[1]+z.b[1])/2],g=G.obj({tipo:"portao",nome:"Portão"});G.circ(m[0],m[1],5,set(USO.portao,g));G.circ(m[0],m[1],11,k=>{G.reserva[k]|=1});continue}G.faixa([z.a,z.b],3.5,k=>{G.uso[k]=USO.muralha;G.dono[k]=n})}}
  for(const p of W.piers||[]){const n=G.obj({tipo:"pier",nome:"Píer",ref:p});const L=Array.isArray(p)?p:(p.pts||[p.a,p.b]);if(L&&L.length>1&&L[0])G.faixa(L,4,set(USO.cais,n))}
  G.uso0=G.uso.slice();// chao antes das construcoes (rua, estrada, muralha, ponte ficam conhecidas mesmo debaixo de uma casa)
  const obbP=(x,y,a,L,D)=>{const c=Math.cos(a),s=Math.sin(a);return [[-1,-1],[1,-1],[1,1],[-1,1]].map(([i,j])=>[x+c*i*L/2-s*j*D/2,y+s*i*L/2+c*j*D/2])};
  const pinta=(P,n,tipo,uso)=>{(G.objs[n].polys=G.objs[n].polys||[]).push(P);G.poly(P,k=>{const u=G.uso[k],d=G.dono[k];
      if(uso===USO.construcao){if(u===USO.construcao&&d!==n&&d>=0)G.conflito("construção sobre construção",Math.min(d,n),Math.max(d,n),k);else if((u===USO.rua||u===USO.estrada)&&!RUAOK.has(tipo))G.conflito("construção na rua",n,null,k);else if(u===USO.muralha||u===USO.portao)G.conflito("construção na muralha",n,null,k);else if(u===USO.ponte)G.conflito("construção na ponte",n,null,k);else if(G.agua[k]&&!AGUAOK.has(tipo)&&u!==USO.cais)G.conflito("construção na água",n,null,k)}
      else if(uso===USO.detalhe){if(u===USO.construcao&&d>=0&&d!==n)G.conflito("adereço sobre construção",d,n,k);else if(G.agua[k]&&!AGUAOK.has(tipo)&&u!==USO.cais&&u!==USO.ponte)G.conflito("adereço na água",n,null,k);else if(u===USO.muralha)G.conflito("adereço na muralha",n,null,k)}
      else if(uso===USO.arvore){if(u===USO.construcao&&d>=0)G.conflito("árvore em construção",d,n,k);else if(u===USO.rua)G.conflito("árvore na rua",n,null,k)}
      if((uso!==USO.arvore&&uso!==USO.detalhe)||u<USO.construcao){G.uso[k]=uso;G.dono[k]=n}})};
  const NAME=(AS&&AS.NAME)||{},KN={1:"Casa",2:"Templo",3:"Castelo",6:"Estátua",7:"Poço",8:"Torre de vigia",13:"Barco",15:"Vulcão",16:"Ruína",17:"Ruína",18:"Totem",19:"Moinho",20:"Santuário",21:"Pedra",22:"Mina",23:"Acampamento",24:"Marco",25:"Arco",26:"Arco",27:"Agulhas",28:"Rochedo",32:"Tenda",33:"Comando",34:"Fogueira",35:"Cavalos",36:"Boneco de treino"},RR={2:14,8:6,16:12,17:12,18:4,19:6,20:9,21:5,22:12,23:8,24:4,25:10,26:14,27:14,28:14,7:2.4,6:2.6,32:3,33:6,34:2,35:2,36:2};
  const NAT=new Set([15,21,25,26,27,28]),AGUAK=new Set([13]);
  for(const b of W.B||[]){if(b.k===37)continue;
    if(b.k===1&&b.L){const n=G.obj({tipo:"casa",nome:"Casa",ref:b});pinta(obbP(b.x,b.y,b.ang||0,b.L,b.D),n,"casa",USO.construcao);if(b.wing&&b.wing.L){const wg=b.wing;pinta(obbP(b.x+(wg.dx||0),b.y+(wg.dy||0),wg.ang!=null?wg.ang:(b.ang||0),wg.L,wg.D),n,"casa",USO.construcao)}continue}
    if(b.k===40&&b.id&&AS&&AS.ficha){const n=G.obj({tipo:b.id,nome:NAME[b.id]||b.id,ref:b}),F=AS.ficha(b.id,b.race,b.vv,b.ang||0);if(F&&F.pegada.length){for(const P of F.pegada)pinta(P.map(v=>[b.x+v[0],b.y+v[1]]),n,b.id,USO.detalhe)}else G.circ(b.x,b.y,3,k=>{});continue}
    if((b.k===2||b.k===3)&&AS&&AS.fichaDe&&AG.kit&&AG.kit.drawBig){const qq=Object.assign({},b,{x:0,y:0});const F=AS.fichaDe("rbig|"+b.k+"|"+b.race+"|"+(b.v||0).toFixed(2)+"|"+(b.ang||0).toFixed(2)+"|"+(b.big?1:0)+"|"+(b.ms||1)+"|"+(b.sz||1),c=>AG.kit.drawBig(c,qq)),n=G.obj({tipo:b.k===2?"templo":"castelo",nome:KN[b.k],ref:b});if(F&&F.pegada.length)for(const P of F.pegada)pinta(P.map(v=>[b.x+v[0],b.y+v[1]]),n,b.k===2?"templo":"castelo",USO.construcao);continue}
    const r=(b.r||RR[b.k]||5)*.65,n=G.obj({tipo:NAT.has(b.k)?"natural":AGUAK.has(b.k)?"barco":"k"+b.k,nome:KN[b.k]||("Objeto "+b.k),ref:b}),P=[];for(let a=0;a<10;a++)P.push([b.x+Math.cos(a*.628)*r,b.y+Math.sin(a*.628)*r]);
    if(AGUAK.has(b.k)){G.circ(b.x,b.y,r,k=>{G.uso[k]=USO.barco;G.dono[k]=n});continue}pinta(P,n,NAT.has(b.k)?"natural":"k"+b.k,b.k===6||b.k===7||b.k===34||b.k===35||b.k===36||b.k===32?USO.detalhe:USO.construcao)}
  // o que o desenho espalhou (matas, arbustos, juncos, pedras): o tronco/base conta como ocupacao; a copa vai na camada "copa"
  if(W._DECO)for(const [tp,x,y,r] of W._DECO){const n=G.obj({tipo:tp,nome:{arvore:"Árvore",mato:"Arbusto",junco:"Junco",pedra:"Pedra"}[tp]||tp,x,y,r});G.circ(x,y,r,k=>{G.copa[k]=tp==="arvore"?1:2;if(G.uso[k]<USO.rua&&!G.agua[k]){if(tp==="pedra"||Math.hypot((k%w+.5)*CS-x,(Math.floor(k/w)+.5)*CS-y)<Math.max(1.2,r*.25)){G.uso[k]=USO.arvore;G.dono[k]=n}}})}
  for(const t of W.extra||[]){if(!Array.isArray(t))continue;const n=G.obj({tipo:"arvore",nome:"Árvore",ref:t}),r=1.4*(t[2]||1);const P=[];for(let a=0;a<8;a++)P.push([t[0]+Math.cos(a*.785)*r,t[1]+Math.sin(a*.785)*r]);pinta(P,n,"arvore",USO.arvore)}
  for(const [L,nm] of[[CAMPOS,"campo"],[QUINT,"horta"]])for(const n of L){const f=G.objs[n].ref,pl=f.poly||f._poly;if(!pl)continue;G.poly(pl,k=>{const u=G.uso[k];if(u===USO.muralha||u===USO.portao)G.conflito(nm+" na muralha",n,null,k);else if(u===USO.rua||u===USO.estrada)G.conflito(nm+" na estrada",n,null,k);else if(G.agua[k]&&u!==USO.ponte&&u!==USO.cais)G.conflito(nm+" na água",n,null,k)})}
  return G}
window.AtlasMundo={deRegiao,CS,USO,USON,AGUA,AGUAN,COR,AGUAOK,RUAOK,Grade,deCidade,inPoly};
})();
