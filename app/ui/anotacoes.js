// Atlas 1.35: anotacoes do mestre em qualquer mapa (regiao, cidade e batalha).
// Pincel livre, linha, area, ponto com icone e texto; cor, largura, tracejado, preenchimento; ligadas a notas.
// O host diz como converter coordenadas: T(x,y) -> tela; inv(sx,sy) -> mapa; k() = pixels de tela por unidade de largura.
// Os itens ficam no proprio mapa (o.anot ou M.anot), num formato simples que outra IA consegue ler (docs/anotacoes-nos-mapas.md).
(function(){
"use strict";
const NS_ICON={
  alfinete:"M12 21s-6-6.2-6-10.5a6 6 0 0 1 12 0C18 14.8 12 21 12 21zM12 8a2.4 2.4 0 1 0 0 4.8A2.4 2.4 0 0 0 12 8z",
  tesouro:"M4 10h16v9H4zM4 10l2-4h12l2 4M12 10v9M10 13h4",
  perigo:"M12 3l9.5 17h-19zM12 9v5M12 17.2v.6",
  encontro:"M5 4l14 14M14 18l4-4M19 4L5 18M6 14l4 4",
  caveira:"M12 3a7 7 0 0 0-7 7c0 2.6 1.4 4.4 3 5.4V19h8v-3.6c1.6-1 3-2.8 3-5.4a7 7 0 0 0-7-7zM9 10h.01M15 10h.01M10 19v2M14 19v2",
  segredo:"M2 12s3.6-6.5 10-6.5S22 12 22 12s-3.6 6.5-10 6.5S2 12 2 12zM12 9.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5z",
  chave:"M8 15a4 4 0 1 1 3.4-6.1L21 9v3h-2v2h-2v-2h-5.6A4 4 0 0 1 8 15z",
  porta:"M6 21V4h12v17M3 21h18M15 12.5h.01",
  armadilha:"M3 17h18M5 17l2-6 2 6 2-6 2 6 2-6 2 6 2-6 1 6",
  misterio:"M9 9a3 3 0 1 1 4.5 2.6c-1 .6-1.5 1.3-1.5 2.4M12 18v.5",
  estrela:"M12 3l2.7 5.6 6.1.8-4.5 4.2 1.1 6.1L12 16.8 6.6 19.7l1.1-6.1L3.2 9.4l6.1-.8z",
  bandeira:"M5 21V4M5 4h12l-2.5 4L17 12H5",
  acampamento:"M3 20L12 5l9 15zM12 5v15M9 20l3-5 3 5",
  pessoa:"M12 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM5 21c0-4 3.1-7 7-7s7 3 7 7",
  monstro:"M5 4c1 4 1 8-1 12M10 3c1 5 1 10-1 15M15 4c1 5 1 9-1 14M20 5c0 4-1 8-3 11",
  pegadas:"M8 4c1.6 0 2.5 1.6 2.5 3.8S9.6 12 8 12 5.5 10 5.5 7.8 6.4 4 8 4zM16 11c1.6 0 2.5 1.6 2.5 3.8S17.6 19 16 19s-2.5-2-2.5-4.2S14.4 11 16 11z",
  nota:"M6 3h9l4 4v14H6zM14 3v5h5M9 13h7M9 17h5",
  cidade:"M3 21V10l5-3v14M8 21V5l6 3v13M14 21V11l7 3v7",
  agua:"M12 3s6 7 6 11a6 6 0 0 1-12 0c0-4 6-11 6-11z",
  fogo:"M12 3c1 4 5 5.5 5 10a5 5 0 0 1-10 0c0-2.5 1.4-3.7 2.5-5 .3 1.6 1 2.4 2 2.7C11 8 11.4 5.5 12 3z"
};
const NOME_ICON={alfinete:"Alfinete",tesouro:"Tesouro",perigo:"Perigo",encontro:"Encontro",caveira:"Morte",segredo:"Segredo",chave:"Chave",porta:"Passagem",armadilha:"Armadilha",misterio:"Mistério",estrela:"Destaque",bandeira:"Missão",acampamento:"Acampamento",pessoa:"Pessoa",monstro:"Monstro",pegadas:"Rastro",nota:"Nota",cidade:"Lugar",agua:"Água",fogo:"Fogo"};
const CORES=["#e0776b","#e39a4f","#d4a64a","#8db06a","#5fb3a1","#6f9fd8","#a88bd6","#d77fb3","#f2ead8","#2a2018"];
const TIPO_ICON={personagem:"pessoa",criatura:"monstro",local:"cidade",faccao:"bandeira",missao:"bandeira",item:"tesouro",sessao:"nota",campanha:"estrela",relogio:"misterio",pista:"segredo",escrito:"nota",livre:"nota"};
const PATH=new Map();const p2=d=>{let P=PATH.get(d);if(!P){P=new Path2D(d);PATH.set(d,P)}return P};
let SEQ=0;const novoId=()=>"an"+Date.now().toString(36)+(SEQ++).toString(36);
const letras=n=>{let s="";n++;while(n>0){const r=(n-1)%26;s=String.fromCharCode(65+r)+s;n=Math.floor((n-1)/26)}return s};

// celula de referencia (A1): grade com 'cols' colunas sobre a area [x0,y0,x1,y1] do mapa, ou celula de 'passo' unidades
function celula(x,y,G){if(!G)return "";const cw=G.passo||((G.x1-G.x0)/(G.cols||12)),ch=G.passo||cw;const c=Math.floor((x-(G.x0||0))/cw),r=Math.floor((y-(G.y0||0))/ch);if(c<0||r<0)return "";return letras(c)+(r+1)}
const centro=it=>{const P=it.pts||[];if(!P.length)return [0,0];let x=0,y=0;for(const q of P){x+=q[0];y+=q[1]}return [x/P.length,y/P.length]};

function estiloLinha(g,it,k){const w=Math.max(1,(it.larg||3)*k);g.lineWidth=w;g.setLineDash(it.estilo==="tracejado"?[w*3.2,w*2.2]:it.estilo==="pontilhado"?[w*.1,w*2.2]:[]);g.lineCap="round";g.lineJoin="round"}
function caminho(g,P,T,fechado,suave){g.beginPath();if(!P.length)return;const S=P.map(q=>T(q[0],q[1]));if(suave&&S.length>2){g.moveTo(S[0][0],S[0][1]);for(let i=1;i<S.length-1;i++){const m=[(S[i][0]+S[i+1][0])/2,(S[i][1]+S[i+1][1])/2];g.quadraticCurveTo(S[i][0],S[i][1],m[0],m[1])}const u=S[S.length-1];g.lineTo(u[0],u[1])}else{S.forEach((q,i)=>i?g.lineTo(q[0],q[1]):g.moveTo(q[0],q[1]))}if(fechado)g.closePath()}
function rgba(hex,a){const h=String(hex||"#e0776b").replace("#","");const n=parseInt(h.length===3?h.split("").map(c=>c+c).join(""):h,16);return "rgba("+((n>>16)&255)+","+((n>>8)&255)+","+(n&255)+","+a+")"}
function rotulo(g,txt,x,y,k,cor){if(!txt)return;const fs=Math.max(10,12*k);g.font="600 "+fs+"px 'Alegreya Sans',system-ui,sans-serif";g.textAlign="center";g.textBaseline="top";g.lineWidth=Math.max(2.5,fs*.28);g.strokeStyle="rgba(20,16,12,.85)";g.setLineDash([]);g.strokeText(txt,x,y);g.fillStyle=cor||"#fff7e6";g.fillText(txt,x,y)}

// desenha todos os itens; opt: {k, sel, hov, grade, rascunho}
function desenha(g,itens,T,opt){opt=opt||{};const k=opt.k||1;g.save();
  if(opt.grade){const G=opt.grade;desenhaGrade(g,G,T,k)}
  const L=(itens||[]).filter(it=>!it.oculto).concat(opt.rascunho?[opt.rascunho]:[]);
  for(const it of L){if(it.tipo==="ponto"||it.tipo==="texto")continue;const sel=opt.sel===it.id,cor=it.cor||"#e0776b",P=it.pts||[];if(P.length<2)continue;
    if(it.tipo==="area"){caminho(g,P,T,true,it.suave);g.fillStyle=rgba(cor,it.preench==null?.18:it.preench);g.fill()}
    if(sel){caminho(g,P,T,it.tipo==="area",it.suave);estiloLinha(g,it,k);g.lineWidth+=4;g.setLineDash([]);g.strokeStyle="rgba(243,210,122,.55)";g.stroke()}
    caminho(g,P,T,it.tipo==="area",it.suave);estiloLinha(g,it,k);g.strokeStyle="rgba(20,16,12,.55)";g.lineWidth+=2;g.stroke();estiloLinha(g,it,k);g.strokeStyle=cor;g.stroke();g.setLineDash([]);
    if(it.seta&&it.tipo!=="area"){const a=T(P[P.length-2][0],P[P.length-2][1]),b=T(P[P.length-1][0],P[P.length-1][1]),an=Math.atan2(b[1]-a[1],b[0]-a[0]),s=Math.max(14*k,(it.larg||3)*k*4.2);g.beginPath();g.moveTo(b[0],b[1]);g.lineTo(b[0]-Math.cos(an-.45)*s,b[1]-Math.sin(an-.45)*s);g.lineTo(b[0]-Math.cos(an+.45)*s,b[1]-Math.sin(an+.45)*s);g.closePath();g.fillStyle=cor;g.fill()}
    if(it.titulo&&it.mostraNome!==false){const c=it.tipo==="area"?centro(it):P[Math.floor(P.length/2)],s=T(c[0],c[1]);rotulo(g,it.titulo,s[0],s[1]+4,k,"#fff7e6")}}
  for(const it of L){if(it.tipo!=="ponto"&&it.tipo!=="texto")continue;const q=(it.pts||[])[0];if(!q)continue;const s=T(q[0],q[1]),sel=opt.sel===it.id,cor=it.cor||"#e0776b";
    if(it.tipo==="texto"){const fs=Math.max(10,(it.tam||16)*Math.max(.6,k));g.font=(it.negrito===false?"500 ":"700 ")+fs+"px 'Alegreya',Georgia,serif";g.textAlign="center";g.textBaseline="middle";g.lineWidth=Math.max(3,fs*.25);g.strokeStyle="rgba(20,16,12,.85)";g.strokeText(it.titulo||"Texto",s[0],s[1]);g.fillStyle=cor;g.fillText(it.titulo||"Texto",s[0],s[1]);
      if(sel){const w=g.measureText(it.titulo||"Texto").width;g.strokeStyle="#f3d27a";g.lineWidth=1.5;g.setLineDash([4,3]);g.strokeRect(s[0]-w/2-4,s[1]-fs/2-3,w+8,fs+6);g.setLineDash([])}continue}
    const r=Math.max(9,(it.tam||1)*13*k);
    g.beginPath();g.ellipse(s[0]+1.5,s[1]+r*.9,r*.7,r*.25,0,0,7);g.fillStyle="rgba(0,0,0,.28)";g.fill();
    g.beginPath();g.arc(s[0],s[1],r,0,7);g.fillStyle=cor;g.fill();g.lineWidth=sel?3:1.6;g.strokeStyle=sel?"#f3d27a":"rgba(20,16,12,.85)";g.stroke();
    const d=NS_ICON[it.icone||"alfinete"]||NS_ICON.alfinete;g.save();g.translate(s[0]-r*.62,s[1]-r*.62);g.scale(r*1.24/24,r*1.24/24);g.lineWidth=2.2;g.lineCap="round";g.lineJoin="round";g.strokeStyle=it.corIcone||"#fff7e6";g.stroke(p2(d));g.restore();
    if(it.nota){g.beginPath();g.arc(s[0]+r*.78,s[1]-r*.78,Math.max(3,r*.26),0,7);g.fillStyle="#f3d27a";g.fill();g.lineWidth=1;g.strokeStyle="rgba(20,16,12,.85)";g.stroke()}
    if(it.titulo&&it.mostraNome!==false)rotulo(g,it.titulo,s[0],s[1]+r+3,k)}
  if(opt.hov){const it=(itens||[]).find(x=>x.id===opt.hov);if(it&&(it.texto||it.titulo||it.nota))dica(g,it,T,k)}
  g.restore()}
function dica(g,it,T,k){g.save();const kk=Math.max(1,k);const c=it.tipo==="ponto"||it.tipo==="texto"?it.pts[0]:centro(it),s=T(c[0],c[1]);const L=[];if(it.titulo)L.push([it.titulo,1]);if(it.celula)L.push(["Célula "+it.celula,0]);if(it.nota)L.push(["Nota: "+it.nota.replace(/^\[\[|\]\]$/g,""),0]);for(const ln of String(it.texto||"").split("\n").slice(0,4))if(ln.trim())L.push([ln.length>60?ln.slice(0,58)+"…":ln,0]);if(!L.length){g.restore();return}
  g.font="13px 'Alegreya Sans',system-ui,sans-serif";let w=0;for(const [t,b] of L){g.font=(b?"700 ":"")+"13px 'Alegreya Sans',system-ui,sans-serif";w=Math.max(w,g.measureText(t).width)}const hh=L.length*17+10,x=(s[0]+18*kk)/kk,y=(s[1]-(hh+8)*kk)/kk;g.scale(kk,kk);
  g.fillStyle="rgba(32,27,20,.95)";g.strokeStyle="#54452f";g.lineWidth=1;g.setLineDash([]);g.beginPath();g.rect(x,y,w+16,hh);g.fill();g.stroke();g.textAlign="left";g.textBaseline="top";L.forEach(([t,b],i)=>{g.font=(b?"700 ":"")+"13px 'Alegreya Sans',system-ui,sans-serif";g.fillStyle=b?"#f3d27a":"#ede3cc";g.fillText(t,x+8,y+6+i*17)});g.restore()}
function desenhaGrade(g,G,T,k){const cw=G.passo||((G.x1-G.x0)/(G.cols||12)),x0=G.x0||0,y0=G.y0||0,x1=G.x1,y1=G.y1;if(!(cw>0))return;const nC=Math.ceil((x1-x0)/cw),nR=Math.ceil((y1-y0)/cw),dens=G.passo?Math.max(1,Math.ceil(12/((T(cw,0)[0]-T(0,0)[0])||1))):1;
  g.save();g.strokeStyle="rgba(243,210,122,.6)";g.lineWidth=Math.max(1,k*.9);g.setLineDash([4*k,4*k]);g.beginPath();for(let c=0;c<=nC;c+=dens){const a=T(x0+c*cw,y0),b=T(x0+c*cw,y0+nR*cw);g.moveTo(a[0],a[1]);g.lineTo(b[0],b[1])}for(let r=0;r<=nR;r+=dens){const a=T(x0,y0+r*cw),b=T(x0+nC*cw,y0+r*cw);g.moveTo(a[0],a[1]);g.lineTo(b[0],b[1])}g.stroke();g.setLineDash([]);
  g.font="700 "+Math.round(11*k)+"px 'Alegreya Sans',system-ui,sans-serif";g.textAlign="center";g.textBaseline="middle";g.lineWidth=3*k;g.strokeStyle="rgba(20,16,12,.8)";g.fillStyle="#f3d27a";
  for(let c=0;c<nC;c+=dens){const p=T(x0+(c+.5)*cw,y0);g.strokeText(letras(c),p[0],p[1]+9*k);g.fillText(letras(c),p[0],p[1]+9*k)}for(let r=0;r<nR;r+=dens){const p=T(x0,y0+(r+.5)*cw);g.strokeText(String(r+1),p[0]+10*k,p[1]);g.fillText(String(r+1),p[0]+10*k,p[1])}g.restore()}

// acerta: item sob o ponto da tela (sx,sy)
function acerta(itens,sx,sy,T,k,tol){tol=tol||8;let best=null,bd=1e9;for(const it of (itens||[]).slice().reverse()){if(it.oculto)continue;const P=(it.pts||[]).map(q=>T(q[0],q[1]));if(!P.length)continue;
    if(it.tipo==="ponto"){const r=Math.max(9,(it.tam||1)*13*k);const d=Math.hypot(sx-P[0][0],sy-P[0][1]);if(d<=r+tol*.4&&d<bd){bd=d;best=it}continue}
    if(it.tipo==="texto"){if(Math.abs(sx-P[0][0])<60&&Math.abs(sy-P[0][1])<14){best=it;bd=0}continue}
    let d=1e9;for(let i=0;i<P.length-(it.tipo==="area"?0:1);i++){const a=P[i],b=P[(i+1)%P.length],dx=b[0]-a[0],dy=b[1]-a[1],L2=dx*dx+dy*dy||1,u=Math.max(0,Math.min(1,((sx-a[0])*dx+(sy-a[1])*dy)/L2));d=Math.min(d,Math.hypot(sx-a[0]-dx*u,sy-a[1]-dy*u))}
    if(it.tipo==="area"&&dentro(P,sx,sy))d=Math.min(d,tol*.6);if(d<=tol+(it.larg||3)*k/2&&d<bd){bd=d;best=it}}return best}
function dentro(P,x,y){let c=false;for(let i=0,j=P.length-1;i<P.length;j=i++){const a=P[i],b=P[j];if((a[1]>y)!==(b[1]>y)&&x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0])c=!c}return c}
function simplifica(P,eps){if(P.length<3)return P;const d=(p,a,b)=>{const dx=b[0]-a[0],dy=b[1]-a[1],L=Math.hypot(dx,dy)||1;return Math.abs(dy*p[0]-dx*p[1]+b[0]*a[1]-b[1]*a[0])/L};const rec=(i,j,o)=>{let m=-1,mi=-1;for(let k=i+1;k<j;k++){const v=d(P[k],P[i],P[j]);if(v>m){m=v;mi=k}}if(m>eps){rec(i,mi,o);o.push(P[mi]);rec(mi,j,o)}};const o=[P[0]];rec(0,P.length-1,o);o.push(P[P.length-1]);return o}

// ---------- ferramenta: controla os gestos; o host chama down/move/up/dbl/tecla e redesenha ----------
// cfg: {itens:()=>[], muda:(lista,nome)=>void, T, inv(sx,sy)->[x,y], k:()=>n, desenha:()=>void, painel:()=>void, grade:()=>G|null, lugar:(x,y)=>string, tol:()=>n, unidade:n (precisao)}
function ferramenta(cfg){const st={modo:"sel",cor:CORES[0],larg:3,estilo:"solido",icone:"alfinete",preench:.18,sel:null,hov:null,rasc:null,arr:null,mostraGrade:false};const pre=cfg.preferencias;if(pre)Object.assign(st,pre);
  const R=v=>Math.round(v*(cfg.unidade||100))/(cfg.unidade||100);
  const salvaPref=()=>{if(cfg.preferencias){for(const k of ["modo","cor","larg","estilo","icone","preench","mostraGrade"])cfg.preferencias[k]=st[k]}};
  const completa=it=>{const c=it.tipo==="ponto"||it.tipo==="texto"?it.pts[0]:centro(it),G=cfg.grade&&cfg.grade();const cel=celula(c[0],c[1],G);if(cel)it.celula=cel;else delete it.celula;const lg=cfg.lugar&&cfg.lugar(c[0],c[1]);if(lg)it.perto=lg;else delete it.perto;return it};
  const salvaItem=(it,nome)=>{const L=cfg.itens().slice(),i=L.findIndex(x=>x.id===it.id);completa(it);if(i>=0)L[i]=it;else L.push(it);cfg.muda(L,nome);st.sel=it.id;cfg.painel();cfg.desenha()};
  const atual=()=>cfg.itens().find(x=>x.id===st.sel)||null;
  const C={st,atual,
    down(sx,sy,ev){const w=cfg.inv(sx,sy);if(!w)return false;const tol=cfg.tol?cfg.tol():8;
      if(st.pend){const p=st.pend;st.pend=null;C.largaNota(sx,sy,p.titulo,p.tipo);return true}
      if(st.modo==="sel"){const it=acerta(cfg.itens(),sx,sy,cfg.T,cfg.k(),tol);st.sel=it?it.id:null;cfg.painel();cfg.desenha();if(it)st.arr={tipo:"mover",w0:w,pts0:it.pts.map(q=>q.slice()),it:JSON.parse(JSON.stringify(it)),moveu:false};return true}
      if(st.modo==="ponto"||st.modo==="texto"){const it={id:novoId(),tipo:st.modo,pts:[[R(w[0]),R(w[1])]],cor:st.modo==="texto"?"#fff7e6":st.cor,icone:st.icone,titulo:st.modo==="texto"?"Texto":""};salvaItem(it,st.modo==="texto"?"Texto no mapa":"Ponto no mapa");if(cfg.aoCriar)cfg.aoCriar(it);return true}
      if(st.modo==="pincel"||st.modo==="laco"){st.rasc={id:novoId(),tipo:st.modo==="laco"?"area":"traco",pts:[[R(w[0]),R(w[1])]],cor:st.cor,larg:st.larg,estilo:st.estilo,preench:st.preench,suave:true};st.arr={tipo:"pincel"};cfg.desenha();return true}
      if(st.modo==="linha"||st.modo==="area"){if(!st.rasc)st.rasc={id:novoId(),tipo:st.modo==="area"?"area":"linha",pts:[],cor:st.cor,larg:st.larg,estilo:st.estilo,preench:st.preench};const P=st.rasc.pts;
        if(P.length>=3&&st.modo==="area"){const f=cfg.T(P[0][0],P[0][1]);if(Math.hypot(f[0]-sx,f[1]-sy)<12){C.fim();return true}}
        if(P.length){const u=cfg.T(P[P.length-1][0],P[P.length-1][1]);if(Math.hypot(u[0]-sx,u[1]-sy)<6){C.fim();return true}}P.push([R(w[0]),R(w[1])]);cfg.desenha();cfg.painel();return true}
      return false},
    move(sx,sy){const w=cfg.inv(sx,sy);if(!w)return;
      if(st.arr&&st.arr.tipo==="pincel"&&st.rasc){const P=st.rasc.pts,u=cfg.T(P[P.length-1][0],P[P.length-1][1]);if(Math.hypot(u[0]-sx,u[1]-sy)>=3){P.push([R(w[0]),R(w[1])]);cfg.desenha()}return}
      if(st.arr&&st.arr.tipo==="mover"){const a=st.arr,dx=w[0]-a.w0[0],dy=w[1]-a.w0[1],it=atual();if(!it)return;if(!a.moveu&&Math.hypot(...[cfg.T(a.w0[0],a.w0[1])].map(p=>[p[0]-sx,p[1]-sy])[0])<4)return;a.moveu=true;it.pts=a.pts0.map(q=>[R(q[0]+dx),R(q[1]+dy)]);cfg.desenha();return}
      if(st.modo==="sel"){const it=acerta(cfg.itens(),sx,sy,cfg.T,cfg.k(),cfg.tol?cfg.tol():8),h=it?it.id:null;if(h!==st.hov){st.hov=h;cfg.desenha()}}
      if((st.modo==="linha"||st.modo==="area")&&st.rasc){st.cursor=[R(w[0]),R(w[1])];cfg.desenha()}},
    up(){const a=st.arr;st.arr=null;if(!a)return;
      if(a.tipo==="pincel"&&st.rasc){const r=st.rasc;st.rasc=null;const eps=(cfg.unidade?1/cfg.unidade:.01)*2;r.pts=simplifica(r.pts,Math.max(eps,(cfg.simplifica||1.2)));if(r.pts.length<2||(r.tipo==="area"&&r.pts.length<3)){cfg.desenha();return}salvaItem(r,r.tipo==="area"?"Área no mapa":"Traço no mapa");return}
      if(a.tipo==="mover"){const it=atual();if(!it)return;if(a.moveu){const L=cfg.itens(),i=L.findIndex(x=>x.id===it.id);const novo=it;L[i]=a.it;salvaItem(novo,"Mover anotação")}}},
    dbl(sx,sy){const it=acerta(cfg.itens(),sx,sy,cfg.T,cfg.k(),cfg.tol?cfg.tol():8);if(it&&it.nota&&cfg.abreNota){cfg.abreNota(it.nota);return true}if(st.rasc&&(st.modo==="linha"||st.modo==="area")){C.fim();return true}return false},
    fim(){const r=st.rasc;st.rasc=null;st.cursor=null;if(!r){cfg.desenha();return}if(r.pts.length<2||(r.tipo==="area"&&r.pts.length<3)){cfg.desenha();cfg.painel();return}salvaItem(r,r.tipo==="area"?"Área no mapa":"Linha no mapa")},
    cancela(){if(st.pend){st.pend=null;cfg.painel();return true}if(st.rasc){st.rasc=null;st.cursor=null;cfg.desenha();cfg.painel();return true}if(st.sel){st.sel=null;cfg.desenha();cfg.painel();return true}return false},
    apaga(){const it=atual();if(!it)return false;cfg.muda(cfg.itens().filter(x=>x.id!==it.id),"Apagar anotação");st.sel=null;cfg.painel();cfg.desenha();return true},
    tecla(e){if(e.key==="Escape"){return C.cancela()}if(e.key==="Enter"&&st.rasc){C.fim();return true}if((e.key==="Delete"||e.key==="Backspace")&&!st.rasc&&st.sel){return C.apaga()}if(e.key==="Backspace"&&st.rasc&&st.rasc.pts.length){st.rasc.pts.pop();cfg.desenha();return true}return false},
    rascunho(){if(!st.rasc)return null;if(st.cursor&&(st.modo==="linha"||st.modo==="area"))return Object.assign({},st.rasc,{pts:st.rasc.pts.concat([st.cursor])});return st.rasc},
    // nota largada no mapa: vira ponto com o icone do tipo da nota
    largaNota(sx,sy,titulo,tipo,cor){const w=cfg.inv(sx,sy);if(!w)return null;const it={id:novoId(),tipo:"ponto",pts:[[R(w[0]),R(w[1])]],cor:cor||st.cor,icone:TIPO_ICON[tipo]||"nota",titulo,nota:"[["+titulo+"]]"};salvaItem(it,"Nota no mapa");return it},
    muda(fn,nome){const it=atual();if(!it)return;const n=JSON.parse(JSON.stringify(it));fn(n);salvaItem(n,nome||"Editar anotação")},
    modo(m){if(st.rasc)C.fim();st.modo=m;if(m!=="sel")st.sel=null;salvaPref();cfg.painel();cfg.desenha()},salvaPref};
  return C}

// ---------- painel (DOM simples; o host poe onde quiser) ----------
function h(tag,attrs,...kids){const e=document.createElement(tag);for(const k in attrs||{}){const v=attrs[k];if(v==null||v===false)continue;if(k.startsWith("on"))e.addEventListener(k.slice(2),v);else if(k==="class")e.className=v;else if(k==="html")e.innerHTML=v;else if(v===true)e.setAttribute(k,"");else e.setAttribute(k,v)}for(const c of kids.flat(9)){if(c==null||c===false)continue;e.append(c.nodeType?c:document.createTextNode(String(c)))}return e}
function iconeSvg(n,size){const s=document.createElementNS("http://www.w3.org/2000/svg","svg");s.setAttribute("viewBox","0 0 24 24");s.setAttribute("width",size||18);s.setAttribute("height",size||18);s.setAttribute("aria-hidden","true");const p=document.createElementNS("http://www.w3.org/2000/svg","path");p.setAttribute("d",NS_ICON[n]||NS_ICON.alfinete);p.setAttribute("fill","none");p.setAttribute("stroke","currentColor");p.setAttribute("stroke-width","2");p.setAttribute("stroke-linecap","round");p.setAttribute("stroke-linejoin","round");s.append(p);return s}
// opts: {notas:()=>[titulos], abreNota(t), criaNota(it)->titulo, lista:true}
function painel(C,opts){opts=opts||{};const st=C.st,it=C.atual(),wrap=h("div",{class:"anp"}),ap=wrap.append.bind(wrap);wrap.append=(...a)=>ap(...a.filter(x=>x!=null&&x!==false));
  const MODOS=[["sel","Selecionar"],["pincel","Pincel"],["linha","Linha"],["area","Área"],["laco","Área à mão"],["ponto","Ponto"],["texto","Texto"]];
  wrap.append(h("div",{class:"anp-modos",role:"group","aria-label":"Ferramenta de anotação"},MODOS.map(([k,n])=>h("button",{type:"button",class:st.modo===k?"on":"","aria-pressed":String(st.modo===k),onclick:()=>C.modo(k)},n))));
  const alvo=it||null,val=(k,d)=>alvo?(alvo[k]==null?d:alvo[k]):(st[k]==null?d:st[k]),poe=(k,v,nome)=>{if(alvo)C.muda(x=>{if(v==null)delete x[k];else x[k]=v},nome);else{st[k]=v;C.salvaPref();painelDe(C)}};
  const painelDe=()=>{if(opts.redesenhaPainel)opts.redesenhaPainel()};
  if(st.rasc)wrap.append(h("p",{class:"anp-dica"},(st.modo==="linha"||st.modo==="area")?"Clique ponto a ponto · Enter, duplo clique ou clique no último ponto termina"+(st.modo==="area"?" · clicar no primeiro ponto fecha":"")+" · Esc cancela":"Solte para terminar"));
  else if(!it)wrap.append(h("p",{class:"anp-dica"},{sel:"Clique numa anotação para editar · arraste para mover · duplo clique abre a nota ligada · arraste uma nota da lista para o mapa",pincel:"Arraste para desenhar à mão livre",linha:"Clique ponto a ponto",area:"Clique ponto a ponto para contornar a área",laco:"Arraste em volta da área",ponto:"Clique onde vai o ponto",texto:"Clique onde vai o texto"}[st.modo]));
  if(it){wrap.append(h("div",{class:"anp-tit"},h("b",{},{ponto:"Ponto",texto:"Texto",traco:"Traço",linha:"Linha",area:"Área"}[it.tipo]||"Anotação"),it.celula?h("small",{},"Célula "+it.celula):null,it.perto?h("small",{},"perto de "+it.perto):null));
    const tit=h("input",{type:"text",value:it.titulo||"",placeholder:it.tipo==="texto"?"Texto":"Nome (ex.: Item escondido)","aria-label":"Nome da anotação",onchange:e=>C.muda(x=>{x.titulo=e.target.value.trim()},"Nome da anotação")});
    const txt=h("textarea",{rows:3,placeholder:"O que tem aqui? (ex.: encontro aleatório 1 em 6 por hora; a chave está atrás do altar)","aria-label":"Texto da anotação",onchange:e=>C.muda(x=>{const v=e.target.value;if(v.trim())x.texto=v;else delete x.texto},"Texto da anotação")});txt.value=it.texto||"";
    const dl=h("datalist",{id:"anp-notas"},(opts.notas?opts.notas():[]).slice(0,400).map(t=>h("option",{value:t})));
    const nota=h("input",{type:"text",list:"anp-notas",value:(it.nota||"").replace(/^\[\[|\]\]$/g,""),placeholder:"Ligar a uma nota","aria-label":"Nota ligada",onchange:e=>{const v=e.target.value.trim();C.muda(x=>{if(v)x.nota="[["+v+"]]";else delete x.nota},"Ligar nota")}});
    wrap.append(h("label",{class:"anp-c"},h("span",{},it.tipo==="texto"?"Texto":"Nome"),tit),it.tipo!=="texto"?h("label",{class:"anp-c"},h("span",{},"Anotação"),txt):null,h("label",{class:"anp-c"},h("span",{},"Nota"),nota,dl),
      h("div",{class:"anp-bts"},it.nota&&opts.abreNota?h("button",{type:"button",class:"ghost sm",onclick:()=>opts.abreNota(it.nota)},"Abrir a nota"):null,!it.nota&&opts.criaNota?h("button",{type:"button",class:"ghost sm",onclick:()=>{const t=opts.criaNota(it);if(t)C.muda(x=>{x.nota="[["+t+"]]";if(!x.titulo)x.titulo=t},"Criar nota")}},"Criar nota desta anotação"):null))}
  // aparencia (do item escolhido ou do proximo)
  const tipoA=it?it.tipo:{pincel:"traco",linha:"linha",area:"area",laco:"area",ponto:"ponto",texto:"texto"}[st.modo]||null;
  if(tipoA){wrap.append(h("div",{class:"anp-cores",role:"group","aria-label":"Cor"},CORES.map(c=>h("button",{type:"button",class:"anp-cor"+(val("cor",CORES[0])===c?" on":""),style:"background:"+c,"aria-label":"Cor "+c,onclick:()=>poe("cor",c,"Cor da anotação")})),h("input",{type:"color",value:val("cor",CORES[0]),"aria-label":"Outra cor",onchange:e=>poe("cor",e.target.value,"Cor da anotação")})));
    if(tipoA!=="ponto"&&tipoA!=="texto"){const lg=h("input",{type:"range",min:1,max:14,step:.5,value:val("larg",3),"aria-label":"Largura",onchange:e=>poe("larg",+e.target.value,"Largura")});
      wrap.append(h("label",{class:"anp-c anp-l"},h("span",{},"Largura"),lg),h("div",{class:"anp-seg",role:"group","aria-label":"Estilo da linha"},[["solido","Contínua"],["tracejado","Tracejada"],["pontilhado","Pontilhada"]].map(([k,n])=>h("button",{type:"button",class:val("estilo","solido")===k?"on":"",onclick:()=>poe("estilo",k,"Estilo da linha")},n))));
      if(tipoA==="area")wrap.append(h("label",{class:"anp-c anp-l"},h("span",{},"Preenchimento"),h("input",{type:"range",min:0,max:.7,step:.02,value:val("preench",.18),"aria-label":"Preenchimento",onchange:e=>poe("preench",+e.target.value,"Preenchimento")})));
      else wrap.append(h("label",{class:"anp-k"},h("input",{type:"checkbox",checked:!!val("seta",false),onchange:e=>poe("seta",e.target.checked||null,"Seta")})," Seta na ponta"))}
    if(tipoA==="ponto"){wrap.append(h("div",{class:"anp-icones",role:"listbox","aria-label":"Ícone"},Object.keys(NS_ICON).map(n=>h("button",{type:"button",role:"option",title:NOME_ICON[n],"aria-label":NOME_ICON[n],class:val("icone","alfinete")===n?"on":"",onclick:()=>poe("icone",n,"Ícone")},iconeSvg(n,18)))),
      h("label",{class:"anp-c anp-l"},h("span",{},"Tamanho"),h("input",{type:"range",min:.6,max:2.4,step:.1,value:val("tam",1),"aria-label":"Tamanho do ícone",onchange:e=>poe("tam",+e.target.value,"Tamanho do ícone")})))}
    if(tipoA==="texto")wrap.append(h("label",{class:"anp-c anp-l"},h("span",{},"Tamanho"),h("input",{type:"range",min:10,max:48,step:1,value:val("tam",16),"aria-label":"Tamanho do texto",onchange:e=>poe("tam",+e.target.value,"Tamanho do texto")})));
    if(it&&it.tipo!=="texto")wrap.append(h("label",{class:"anp-k"},h("input",{type:"checkbox",checked:it.mostraNome!==false,onchange:e=>C.muda(x=>{if(e.target.checked)delete x.mostraNome;else x.mostraNome=false},"Mostrar nome")})," Mostrar o nome no mapa"))}
  if(it)wrap.append(h("div",{class:"anp-bts"},h("button",{type:"button",class:"ghost sm",onclick:()=>{C.muda(x=>{x.oculto=!x.oculto},"Esconder anotação")}},it.oculto?"Mostrar":"Esconder"),h("button",{type:"button",class:"danger ghost sm",onclick:()=>C.apaga()},"Apagar")));
  if(opts.notas){const box=h("div",{class:"anp-nm"}),res=h("div",{class:"anp-nres"}),q=h("input",{type:"search",placeholder:"Buscar nota para pôr no mapa","aria-label":"Buscar nota para pôr no mapa",value:st.buscaNota||""});
    const lista=()=>{const t=(q.value||"").trim().toLowerCase();st.buscaNota=q.value;const N=opts.notas().filter(x=>!t||x.toLowerCase().includes(t)).slice(0,t?10:6);
      res.replaceChildren(...N.map(nm=>h("button",{type:"button",class:"anp-nota"+(st.pend&&st.pend.titulo===nm?" on":""),draggable:"true",title:"Clique e depois clique no mapa · ou arraste para o mapa",
        ondragstart:e=>{e.dataTransfer.setData("text/x-atlas-nota",nm);e.dataTransfer.effectAllowed="copy"},
        onclick:()=>{st.pend=st.pend&&st.pend.titulo===nm?null:{titulo:nm,tipo:opts.tipoNota?opts.tipoNota(nm):"livre"};lista();if(opts.aviso&&st.pend)opts.aviso("Clique no mapa onde vai “"+nm+"”.")}},iconeSvg(TIPO_ICON[opts.tipoNota?opts.tipoNota(nm):"livre"]||"nota",14),h("span",{},nm))))};
    q.addEventListener("input",lista);lista();box.append(h("b",{class:"anp-sub"},"Pôr uma nota no mapa"),q,res,h("p",{class:"anp-dica"},st.pend?"Agora clique no mapa onde vai “"+st.pend.titulo+"” (Esc cancela).":"Clique numa nota e depois no mapa, ou arraste a nota para o mapa. Vira um ponto ligado à nota."));wrap.append(box)}
  wrap.append(h("label",{class:"anp-k"},h("input",{type:"checkbox",checked:!!st.mostraGrade,onchange:e=>{st.mostraGrade=e.target.checked;C.salvaPref();if(opts.redesenha)opts.redesenha()}})," Grade de referência (A1, B2…)"));
  // lista de todas
  const L=opts.itens?opts.itens():[];if(L.length)wrap.append(h("details",{class:"anp-lista",open:L.length<=8},h("summary",{},L.length+(L.length>1?" anotações":" anotação")),L.map(x=>h("button",{type:"button",class:"anp-it"+(x.id===st.sel?" on":""),onclick:()=>{st.sel=x.id;st.modo="sel";if(opts.foca)opts.foca(x);if(opts.redesenha)opts.redesenha();if(opts.redesenhaPainel)opts.redesenhaPainel()}},x.tipo==="ponto"?iconeSvg(x.icone||"alfinete",14):h("i",{class:"anp-tr",style:"background:"+(x.cor||"#e0776b")}),h("span",{},x.titulo||{ponto:"Ponto",texto:"Texto",traco:"Traço",linha:"Linha",area:"Área"}[x.tipo]),x.celula?h("small",{},x.celula):null))));
  return wrap}

window.AtlasAnot={ICONES:NS_ICON,NOME_ICON,CORES,TIPO_ICON,celula,letras,desenha,acerta,ferramenta,painel,iconeSvg,centro};
})();
