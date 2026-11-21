// Atlas - Modo Batalha: formato .atlasmap (v1) e importador de .dungeondraft_map.
// Unidade: 1 quadrado. Origem no canto de cima/esquerda, y para baixo, rotacao em radianos.
// Este modulo nao usa DOM: roda no navegador, em Worker e no Node (testes e conversao de exemplos).
export const PX=256;
const NUM=/-?\d+(?:\.\d+)?(?:e-?\d+)?/g;
export const nums=s=>{if(s==null)return [];if(Array.isArray(s))return s;const i=s.indexOf("(");return ((i>=0?s.slice(i+1):s).match(NUM)||[]).map(Number)};
export const pts=s=>{const n=nums(s),o=[];for(let i=0;i+1<n.length;i+=2)o.push([n[i]/PX,n[i+1]/PX]);return o};
const vec=s=>{const n=nums(s);return [n[0]||0,n[1]||0]};
// cor do Dungeondraft: "aarrggbb" -> [r,g,b,a] de 0 a 1
export const cor=s=>{if(!s||s.length<8)return [1,1,1,1];const v=k=>parseInt(s.substr(k,2),16)/255;return [v(2),v(4),v(6),v(0)]};
export const nomeArte=t=>(t||"").split("/").pop().replace(/\.(png|webp|jpe?g)$/i,"");
const b64=u8=>{let s="";for(let i=0;i<u8.length;i+=0x8000)s+=String.fromCharCode.apply(null,u8.subarray(i,i+0x8000));return (typeof btoa==="function"?btoa(s):Buffer.from(s,"binary").toString("base64"))};
export const deB64=s=>{const b=typeof atob==="function"?atob(s):Buffer.from(s,"base64").toString("binary"),u=new Uint8Array(b.length);for(let i=0;i<b.length;i++)u[i]=b.charCodeAt(i);return u};

// indice de tamanhos a partir do catalogo compacto do mod "Catálogo de Artes" ({assets:{Categoria:{"caminho|pacote|pasta":[[arquivo,larg_px,alt_px,..]]}}})
export function indiceTamanhos(cat){const M=new Map();if(!cat||!cat.assets)return M;for(const c in cat.assets)for(const k in cat.assets[c]){const base=k.split("|")[0];for(const a of cat.assets[c][k])M.set(base+"/"+a[0],[a[1],a[2]])}return M}
// tamanho de uma arte em quadrados: catalogo, depois o "_LxA" do nome (padrao FA), depois um palpite pela familia
export function tamanhoArte(tex,TAM){const z=TAM&&TAM.get(tex);if(z&&z[0]>0)return [z[0]/PX,z[1]/PX,1];const m=/(\d+)x(\d+)(?:\.\w+)?$/.exec(tex||"");if(m)return [+m[1],+m[2],0];
  const n=nomeArte(tex).toLowerCase();if(/tree|fir_|palm/.test(n))return [3,3,0];if(/bush|boulder/.test(n))return [1.6,1.6,0];if(/pebble|coin|flower|mushroom|weed/.test(n))return [.6,.6,0];return [1,1,0]}

export function importarDD(D,opt){opt=opt||{};const TAM=opt.tamanhos||new Map(),W=D.world,TEX=[],TI=new Map(),tx=t=>{if(!t)return -1;let i=TI.get(t);if(i==null){i=TEX.length;TEX.push(t);TI.set(t,i)}return i};
  const M={v:1,nome:opt.nome||"Mapa",larg:W.width,alt:W.height,origem:"dungeondraft",grade:{cor:cor(W.grid&&W.grid.color||"80000000")},texturas:TEX,pacotes:(D.header&&D.header.asset_manifest||[]).map(p=>({id:p.id,nome:p.name,autor:p.author})),andares:[],avisos:[]};
  let semTam=0;
  // sombras do mod Drop Shadow: por no (id decimal do node_id hexadecimal). Sem o mod: sombra das paredes do proprio Dungeondraft
  const DS=D.mod&&D.mod.DropShadow&&typeof D.mod.DropShadow==="object"?D.mod.DropShadow:null,temDS=!!(DS&&Object.keys(DS).length);
  const sdDe=(id,ob)=>{if(!temDS||id==null)return null;const e=DS[String(parseInt(id,16))];if(!e||e.enabled===false)return null;const op=+(e.opacity==null?.5:e.opacity),bl=+(e.blur!=null?e.blur:e.simple_blur!=null?e.simple_blur:.2),sp=+(e.spread==null?.15:e.spread);
    return [+op.toFixed(3),+Math.max(.02,bl).toFixed(3),+(sp*.5).toFixed(3),+((+e.offset_x||0)/PX).toFixed(3),+((+e.offset_y||0)/PX).toFixed(3)]};
  const sombraParedeDD=W.wall_shadow!==false&&W.wall_shadow!=="False";
  // no Dungeondraft a chave "0" e o andar mais alto; aqui o andar 0 e o de baixo
  const ks=Object.keys(W.levels).sort((a,b)=>+b-+a);
  for(const k of ks){const L=W.levels[k],A={nome:L.label||("Andar "+k),ambiente:cor(L.environment&&L.environment.ambient_light||"ffffffff"),terreno:null,pisos:[],formas:[],padroes:[],paredes:[],portais:[],caminhos:[],objetos:[],luzes:[]};
    const T=L.terrain;if(T&&(T.enabled===true||T.enabled==="True")){const sp=nums(T.splat),n=sp.length/4,w=W.width*4,h=Math.round(n/w);A.terreno={tex:[tx(T.texture_1),tx(T.texture_2),tx(T.texture_3),tx(T.texture_4)],w,h,splat:b64(Uint8Array.from(sp))};if(h!==W.height*4)M.avisos.push("terreno do andar "+A.nome+": máscara "+w+"x"+h)}
    const Ti=L.tiles;if(Ti&&Ti.cells){const c=nums(Ti.cells),lk=Ti.lookup||{},co=Ti.colors||[];for(let i=0;i<c.length;i++){if(c[i]<0)continue;A.pisos.push([i%W.width,(i/W.width)|0,tx(lk[c[i]]||lk[String(c[i])]),co[i]&&co[i]!=="ffffffff"?cor(co[i]):null])}}
    for(const p of (L.shapes&&L.shapes.polygons)||[])A.formas.push(pts(p));
    for(const p of L.patterns||[]){const o=vec(p.position),s=vec(p.scale||"Vector2(1,1)");A.padroes.push({t:tx(p.texture),p:pts(p.points).map(v=>[v[0]*s[0]+o[0]/PX,v[1]*s[1]+o[1]/PX]),l:p.layer||0,c:p.color&&p.color!=="ffffffff"?cor(p.color):null,r:p.rotation||0})}
    const portal=(q,wall)=>{const o=vec(q.position),d=vec(q.direction||"Vector2(1,0)");A.portais.push({t:tx(q.texture),x:o[0]/PX,y:o[1]/PX,r:q.rotation||0,dx:d[0],dy:d[1],raio:(q.radius||128)/PX,fechado:!!q.closed,parede:wall});const sq=sdDe(q.node_id);if(sq)A.portais[A.portais.length-1].sd=sq};
    for(const w of L.walls||[]){const P=pts(w.points);if(P.length<2)continue;const pw={id:w.node_id,t:tx(w.texture),p:P,raio:0,laco:!!w.loop,tipo:w.type||0,c:w.color&&w.color!=="ffffffff"?cor(w.color):null,sombra:w.shadow!==false};if(w.normalize_uv===false)pw.nuv=false;const sw=sdDe(w.node_id);if(sw)pw.sd=sw;else if(!temDS&&sombraParedeDD)pw.sd=[.35,.25,.1,0,0];A.paredes.push(pw);for(const q of w.portals||[])portal(q,w.node_id)}
    for(const q of L.portals||[])portal(q,null);
    for(const p of L.paths||[]){const o=vec(p.position),s=vec(p.scale||"Vector2(1,1)"),r=p.rotation||0,cr=Math.cos(r),sr=Math.sin(r);A.caminhos.push({t:tx(p.texture),p:pts(p.edit_points).map(v=>{const x=v[0]*s[0],y=v[1]*s[1];return [x*cr-y*sr+o[0]/PX,x*sr+y*cr+o[1]/PX]}),larg:(p.width||128)/PX,l:p.layer||0,suave:p.smoothness||0,laco:!!p.loop,bloqueia:!!p.block_light});const sp=sdDe(p.node_id);if(sp)A.caminhos[A.caminhos.length-1].sd=sp}
    const sombrasDD=!!(D.mod&&Object.keys(D.mod).some(k=>/^DropShadow/.test(k))&&!(()=>{const d=D.mod.DropShadowDisabledLevels;const L=Array.isArray(d)?d:d&&typeof d==="object"?Object.keys(d).filter(z=>d[z]):[];return L.map(String).includes(String(k))})());
    for(const o of L.objects||[]){const p=vec(o.position),s=vec(o.scale||"Vector2(1,1)"),z=tamanhoArte(o.texture,TAM);if(!z[2]&&!/\d+x\d+(?:\.\w+)?$/.test(o.texture))semTam++;const q={t:tx(o.texture),x:p[0]/PX,y:p[1]/PX,r:o.rotation||0,w:z[0]*Math.abs(s[0]),h:z[1]*Math.abs(s[1]),l:o.layer||0,ds:[+Math.abs(s[0]).toFixed(4),+Math.abs(s[1]).toFixed(4)]};if(z[2])q.dz=1;if(o.mirror)q.m=1;if(o.custom_color)q.c=cor(o.custom_color);if(temDS){const so=sdDe(o.node_id);if(so){q.s=1;q.sd=so}}else if(o.shadow||sombrasDD)q.s=1;if(o.block_light)q.b=1;A.objetos.push(q)}
    for(const l of L.lights||[]){const p=vec(l.position);A.luzes.push({x:p[0]/PX,y:p[1]/PX,raio:l.range||4,forca:l.intensity==null?1:l.intensity,c:cor(l.color||"ffffffff"),sombras:l.shadows!==false,dd:1})}
    // camadas do Better Terrain Tool: guardadas cruas aqui (a mascara e um PNG); o editor converte no navegador
    const btl=D.mod&&D.mod.BetterTerrainTool&&D.mod.BetterTerrainTool.levels&&D.mod.BetterTerrainTool.levels[k];
    if(btl&&btl.layers&&btl.layers.length){const hx=s=>{s=(s||"#ffffff").replace("#","");return [parseInt(s.substr(0,2),16)/255,parseInt(s.substr(2,2),16)/255,parseInt(s.substr(4,2),16)/255]};
      A.btt=btl.layers.map(b=>{const ti=hx(b.tint_color),ta=+b.tint_amount||0,h=+b.hue||0;return {nome:b.name||"Camada",t:tx(b.tex),z:b.z||0,op:b.opacity==null?1:+b.opacity,vis:b.visible!==false,mz:Math.abs(h)<=1?h*360:h,sat:b.saturation==null?1:+b.saturation,bri:1+(+b.lightness||0),con:b.contrast==null?1:+b.contrast,
        cor:ta>0?ti.map(v=>1+(v-1)*ta):null,gt:(+b.tex_rot||0)*Math.PI/180,esc:+b.tex_scale||1,ox:(+b.tex_off_x||0)/PX,oy:(+b.tex_off_y||0)/PX,modo:["normal","multiplicar","somar","clarear"][+b.blend||0]||"normal",png:b.mask||null}})}
    M.andares.push(A)}
  if(semTam)M.avisos.push(semTam+" objetos sem tamanho conhecido (use o catálogo de artes para acertar)");

  return M}
export function resumo(M){return M.andares.map(a=>({nome:a.nome,objetos:a.objetos.length,paredes:a.paredes.length,portais:a.portais.length,caminhos:a.caminhos.length,padroes:a.padroes.length,pisos:a.pisos.length,luzes:a.luzes.length,terreno:!!a.terreno}))}
