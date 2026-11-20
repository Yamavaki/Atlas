// Atlas - ferramenta de teste do gerador de zonas: roda a versao deste arquivo do zonas.js dentro de um editor ja aberto
// (com as artes do usuario conectadas), sem recarregar a pagina. So para desenvolvimento.
import * as Z from "./zonas.js";
export {Z};
const RUIM_MAT=/Cracked|Substrate|Snowy|Frosty|Mossy|Dirt\d|Damage|_Z_|Overlay|Ceremorph|Drow|Dwarven|Alien|Colorable|Blood/;
const MAT_PC={
  parede:{pobre:/Walls_(Shack|Wood|Mudbrick|Adobe)\//,comum:/Walls_(PlasterWood|StoneWood|Wood|BrickWood)\//,rico:/Walls_(Stone|Brick|Plaster|PlasterWood|StoneWood)\//,nobre:/Walls_(Stone|Plaster|Brick|Mosaic)\/|Wall_Mosaic/,pedra:/Walls_(Stone|Brick|StoneWood)\//},
  madeira:{pobre:/Shack_Floors?_Pattern\/|Wood_Pattern\/.*_Texture_/,outro:/Wood_Pattern\/.*Flooring/},
  pedra:{pobre:/Cobblestone_A_|Stone_Floor_Pattern\/Cobblestone_Square/,outro:/Stone_Tiles?_(Small|Medium)|Stone_Square_Tiles|Cobblestone_Square/,rico:/Stone_Tiles?_(Large|Medium)|Stone_Patterned_Tiles|Stone_Diagonal_Tiles|Marble/},
  ladrilho:{outro:/Ceramic_Tiles_(Large|Medium)|Ceramic_Diagonal_Tile|Stone_Tiles?_Large|Marble/}};
const sorteia=(L,sem)=>L.length?L[Math.abs(Math.imul(sem|0,2654435761)>>>0)%L.length]:null;
function matZona(B,tipo,riq,estilo,sem){const ests=(estilo||"").split(" ").filter(w=>/ashen|walnut|dark|light|red|slate|earthy|redrock|sandstone|volcanic/.test(w)),cor=k=>ests.length&&ests.some(w=>new RegExp("_"+w+"_","i").test(k))?1:0;
  const lista=(cats,re)=>{const r=B.buscar({cats,todos:true,filtro:c=>re.test(c)&&!RUIM_MAT.test(c)});return r.itens.map(x=>r.item(x).caminho)};
  const pega=(cats,re)=>{const L=lista(cats,re);if(!L.length)return null;const C=L.filter(cor);return sorteia(C.length?C:L,sem)};
  const nivel=["pobre","comum","rico","nobre"][riq],pedraT=/cozinha|despensa|guarda|banheiro|capela|oficina/.test(tipo);
  const parede=pega(["walls"],MAT_PC.parede[pedraT&&riq>=1?"pedra":nivel]||MAT_PC.parede.comum)||pega(["walls"],/Walls_/);
  const tp=/cozinha|despensa|guarda|oficina/.test(tipo)?"pedra":/banheiro|capela/.test(tipo)?(riq>=2?"ladrilho":"pedra"):"madeira",M2=MAT_PC[tp];
  const piso=pega(["patterns","textures"],(riq<=0&&M2.pobre)||(riq>=2&&M2.rico)||M2.outro||M2.pobre)||pega(["patterns","textures"],M2.outro||M2.pobre);
  const porta=pega(["portals"],riq>=2&&/capela/.test(tipo)?/Doors\/Door_Stone_/:/Doors\/Door_Wood_/)||pega(["portals"],/Doors\/Door_/);
  return {parede,piso,porta}}
// ponta apagada (mesma regra do catalogo.js desta versao)
const BORDA=new Map();
async function borda(B,c){if(BORDA.has(c))return BORDA.get(c);let res={f:"",vis:null};try{const d0=await B.dims(c),k=Math.min(1,96/Math.max(d0[0],d0[1])),w=Math.max(1,Math.round(d0[0]*k)),h=Math.max(1,Math.round(d0[1]*k)),img=await B.imagemCrua(c,w,h),cv=new OffscreenCanvas(w,h),g=cv.getContext("2d");g.drawImage(img,0,0,w,h);img.close();const d=g.getImageData(0,0,w,h).data,al=(x,y)=>d[(y*w+x)*4+3];
    let x0=w,y0=h,x1=-1,y1=-1;for(let y=0;y<h;y++)for(let x=0;x<w;x++)if(al(x,y)>40){if(x<x0)x0=x;if(x>x1)x1=x;if(y<y0)y0=y;if(y>y1)y1=y}
    if(x1>=0){res.vis=[x0/w,y0/h,(x1+1)/w,(y1+1)/h];const fx=(xa,xb,ya,yb)=>{let s=0,n=0;for(let y=ya;y<=yb;y++)for(let x=xa;x<=xb;x++){s+=al(x,y);n++}return n?s/n:0};const bw=x1-x0+1,bh=y1-y0+1,ex=Math.max(1,Math.round(bw*.08)),ey=Math.max(1,Math.round(bh*.08)),my0=y0+Math.round(bh*.25),my1=y1-Math.round(bh*.25),mx0=x0+Math.round(bw*.25),mx1=x1-Math.round(bw*.25);
      const meio=fx(mx0,mx1,my0,my1)||1,Lw=fx(x0,x0+ex-1,my0,my1)/meio,Le=fx(x1-ex+1,x1,my0,my1)/meio,Ln=fx(mx0,mx1,y0,y0+ey-1)/meio,Ls=fx(mx0,mx1,y1-ey+1,y1)/meio;
      const C=[["W",Lw,Le],["L",Le,Lw],["N",Ln,Ls],["S",Ls,Ln]].filter(([,v,o])=>v<.72&&o>.78).sort((p,q)=>p[1]-q[1]);res.f=C.length?C[0][0]:"";if(bh>=bw*1.4&&Math.abs(Lw-Le)>.08)res.costas=Lw>Le?"W":"L";else if(bw>=bh*1.4&&Math.abs(Ln-Ls)>.08)res.costas=Ln>Ls?"N":"S"}}catch(e){}
  BORDA.set(c,res);return res}
// gera um comodo na forma P com as artes conectadas; devolve o que pos. o = {B, C, MD, V, e}
export async function gerar(o,P,tipo,par,semente){const {B,C,MD,V,e}=o,M=e.mapa,a=0,A=M.andares[a];par=Object.assign({},Z.PADRAO,par);semente=semente||((Math.random()*2147483647)|0)||1;
  const idx=B.porSub(),es=Z.escolheArtes(tipo,{lista:s=>idx.get(s)||[]},par,semente),cat={};
  const arte=async k=>{const d=await B.dims(k);if(!d)return null;let f=null;try{f=await C.fichaUma(k)}catch(x){}const pc=B.pacoteDe(k),nm=k.split("/").pop(),w=d[0]/256,h=d[1]/256,fa=pc&&/forgotten adventures/i.test(pc.autor||"");let fr=f&&f.length>=11?C.frente(nm,pc&&pc.autor,f):"?";const md=await borda(B,k);if(fr==="?"&&md.costas)fr={N:"S",S:"N",L:"W",W:"L"}[md.costas];if(fr==="?"&&fa)fr="S";
    return {k,w:+w.toFixed(3),h:+h.toFixed(3),fr,funde:md.f,vis:md.vis||[0,0,1,1],cam:C.camada(nm,"objects",w,h)||200,redondo:!!f&&C.forma(f)==="o"}};
  for(const [p,ks] of Object.entries(es.papeis)){cat[p]=(await Promise.all(ks.map(arte))).filter(Boolean);if(!(Z.PAPEIS[p]&&Z.PAPEIS[p].borda))for(const x of cat[p])delete x.funde}
  const zid="t"+semente,ops=[],riq=par.riqueza==null?1:par.riqueza,portas=[];
  if(par.paredes!==false){const mp=matZona(B,tipo,riq,es.estilo,semente),wid=MD.novoId(M),w={id:wid,t:MD.texDe(M,mp.parede||"atlas:m/pedra"),p:P.map(q=>[q[0],q[1]]),laco:true,raio:.25,larg:.18,tipo:0,sombra:true,z:zid};
    ops.push({op:"cria",a,k:"paredes",item:w},{op:"cria",a,k:"padroes",item:{id:MD.novoId(M),t:MD.texDe(M,mp.piso||"atlas:m/madeira"),p:w.p,l:-40,parede:wid,z:zid}});
    let best=null;for(let i=0;i<P.length;i++){const p0=P[i],p1=P[(i+1)%P.length],L=Math.hypot(p1[0]-p0[0],p1[1]-p0[1]);if(L<1.6)continue;const my=(p0[1]+p1[1])/2,nota=my+L*.15;if(!best||nota>best.nota)best={nota,mx:(p0[0]+p1[0])/2,my}}
    if(best){const T=MD.trajeto(w),pj=V.projeta(T,true,best.mx,best.my),pe=V.pontoEm(T,true,pj.d);ops.push({op:"cria",a,k:"portais",item:{id:MD.novoId(M),t:MD.texDe(M,mp.porta||"atlas:p/porta"),tipo:"porta",parede:wid,d:+pj.d.toFixed(4),raio:.5,fechado:true,x:pe[0],y:pe[1],dx:pe[2],dy:pe[3],r:Math.atan2(pe[3],pe[2]),z:zid}});portas.push([pe[0],pe[1]])}
    o.mat=mp}
  const r=Z.geraComodo({p:P,tipo,par,semente},cat,{portas,mg:par.paredes!==false?.14:.05});
  for(const x of r.objs)ops.push({op:"cria",a,k:"objetos",item:{id:MD.novoId(M),t:MD.texDe(M,x.k),x:x.x,y:x.y,r:x.r,w:x.w,h:x.h,l:x.l,s:1,z:zid,papel:x.papel}});
  for(const l of r.luzes){const L=MD.LUZES.find(q=>q[0]===l.pre)||MD.LUZES[0];ops.push({op:"cria",a,k:"luzes",item:{id:MD.novoId(M),x:l.x,y:l.y,raio:L[2],claro:L[3],forca:L[4],c:L[5].concat(1),sombras:true,z:zid}})}
  e.hist.exec(ops,{nome:"teste "+tipo});await new Promise(r=>setTimeout(r,200));await e.artesPC().espera();
  return {zid,semente,pacote:es.pacote,estilo:es.estilo,avisos:r.avisos,mat:o.mat,objs:r.objs.map(x=>x.papel+": "+x.k.split("/").pop().replace(/\.\w+$/,"")+" "+x.w+"x"+x.h)}}
export function limpar(e,zid){const A=e.mapa.andares[0],ops=[];for(const k of ["objetos","luzes","paredes","padroes","portais"])(A[k]||[]).forEach((x,i)=>{if(zid?x.z===zid:String(x.z||"").startsWith("t"))ops.push({op:"apaga",a:0,k,item:x,pos:i})});ops.sort((p,q)=>p.k===q.k?q.pos-p.pos:p.k<q.k?-1:1);if(ops.length)e.hist.exec(ops,{nome:"limpar teste"})}
