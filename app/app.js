/* Atlas - app de notas e mapas (GPL-3.0). */
(function(){
"use strict";
const A=window.AtlasGen,$=(s,r)=>(r||document).querySelector(s);
const esc=s=>String(s==null?"":s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const uid=p=>p+Date.now().toString(36)+Math.random().toString(36).slice(2,6);
const now=()=>new Date().toISOString(),clamp=(v,a,b)=>v<a?a:v>b?b:v;
function h(tag,attrs,...kids){const e=document.createElement(tag);for(const k in attrs||{}){const v=attrs[k];if(v==null||v===false)continue;if(k==="class")e.className=v;else if(k.startsWith("on"))e.addEventListener(k.slice(2),v);else if(k==="html")e.innerHTML=v;else if(k==="value")e.value=v;else if(v===true)e.setAttribute(k,"");else e.setAttribute(k,v)}
  for(const c of kids.flat()){if(c==null||c===false)continue;e.append(c.nodeType?c:document.createTextNode(c))}return e}
let toastT;function toast(m){const t=$("#toast");t.textContent=m;t.hidden=false;clearTimeout(toastT);toastT=setTimeout(()=>t.hidden=true,3800)}

// ---------- estado ----------
const S={notes:new Map(),maps:new Map(),sec:"notes",note:null,map:null,mode:"read",q:"",place:null};
const TYPES={livre:"Nota livre",local:"Local",personagem:"Personagem",faccao:"Facção",item:"Item",sessao:"Sessão"};
const TPL={
  livre:"",
  local:"---\ntipo: local\nmapa: \n---\n\n## Descrição\n\n\n## Quem vive aqui\n\n\n## Ganchos\n\n- [ ] \n\n## Segredos\n\n> [!info] Só para o mestre\n> \n",
  personagem:"---\ntipo: personagem\nlocal: \nfaccao: \n---\n\n## Aparência\n\n\n## O que quer\n\n\n## O que esconde\n\n\n## Ligações\n\n",
  faccao:"---\ntipo: faccao\nsede: \n---\n\n## Objetivo\n\n\n## Membros\n\n\n## Recursos\n\n\n## Inimigos e aliados\n\n",
  item:"---\ntipo: item\ndono: \n---\n\n## Descrição\n\n\n## Efeito\n\n\n## História\n\n",
  sessao:"---\ntipo: sessao\ndata: \n---\n\n## Onde paramos\n\n\n## Cenas previstas\n\n- [ ] \n\n## NPCs em jogo\n\n\n## Anotações\n\n"};
const FOLD={local:"Locais",personagem:"Personagens",faccao:"Facções",item:"Itens",sessao:"Sessões",livre:""};
const DEF={smooth:.2,plains:.3,poi:.5,culture:"europa",size:1,temp:.5,humid:.5,climVar:.5,waste:.1,races:.5,form:"regiao",seed:"sasau-1403",sea:.5,islands:0,lakes:0,rivers:1,relief:.65,forest:.5,fields:.65,towns:6,meander:.6,clouds:.38,plan:"mixed",season:"verao"};
const PARAMS=[["size","Tamanho do mapa","select",[[1,"Região (normal)"],[1.5,"Grande (2× a área)"],[2,"Continente (4× a área)"]]],["form","Formação","select",[["regiao","Região interior"],["costa","Costa"],["peninsula","Península"],["ilha","Ilha"],["arquipelago","Arquipélago"],["continente","Continente"]]],
  ["seed","Semente","text"],["sea","Nível do mar","pct"],["islands","Ilhas extras","int",0,6],["lakes","Lagos","int",0,4],["rivers","Rios","int",0,3],
  ["temp","Temperatura (frio ↔ quente)","pct"],["humid","Umidade (seco ↔ úmido)","pct"],["climVar","Variedade de climas","pct"],["waste","Terra arrasada","pct"],["culture","Região cultural","select",A.CULTURES],["races","Diversidade de culturas","pct"],["relief","Relevo (altura das serras)","pct"],["smooth","Suavidade do relevo","pct"],["plains","Planícies (nivelar terras baixas)","pct"],["poi","Pontos de interesse","pct"],["forest","Floresta","pct"],["fields","Campos cultivados","pct"],["towns","Povoados (por área de região)","int",2,9],["meander","Meandros do rio principal","pct"],
  ["season","Estação","select",[["verao","Verão"],["primavera","Primavera (flores)"],["outono","Outono"],["inverno","Inverno (neve)"]]],["clouds","Nuvens na borda","pct"],["plan","Traçado das ruas","select",[["mixed","Misto"],["organic","Orgânico"],["planned","Planejado"]]]];
const STRUCT=new Set(["culture","size","races","form","seed","towns","plan","rivers","meander","islands","lakes"]);
const TOOLGROUPS=[["Navegar",[["move","Navegar"]]],["Terreno",[["land","Terra"],["sea","Mar"],["up","Elevar"],["down","Rebaixar"]]],["Natureza",[["forest","Floresta"],["clear","Clareira"],["biome","Bioma"]]],
  ["Povoados",[["town","Novo povoado"],["untown","Remover povoado"],["city","Editar cidade"],["street","Nova rua"]]],["Linhas",[["lines","Editar rios e estradas"],["road","Nova estrada"],["river","Novo rio"]]],["Objetos",[["obj","Colocar objeto"],["erase","Apagar"]]],["Marcar",[["pin","Pino"]]]];
const OBJCAT=[["Árvores",[["oak","Carvalho"],["pine","Pinheiro"],["birch","Bétula"],["autumn","Árvore de outono"],["sakura","Cerejeira (sakura)"],["blossom","Árvore florida branca"],["willow","Salgueiro"],["palm","Palmeira"],["acacia","Acácia"],["jungle","Árvore de selva"],["snowpine","Pinheiro com neve"],["bare","Árvore sem folhas"],["dead","Árvore morta"],["cactus","Cacto"],["bush","Arbusto"]]],["Rochas e relevo",[["rock","Rocha"],["boulders","Grupo de rochas"],["spires","Agulhas de pedra"],["arch","Arco de pedra"],["mesa","Planalto (mesa)"],["volcano","Vulcão"],["pond","Lagoa"]]],["Construções",[["b_town","Casa"],["b_row","Sobrado"],["b_rich","Casarão"],["b_manor","Solar"],["b_tavern","Taverna"],["b_smithy","Ferraria"],["b_farm","Casa de campo"],["b_hut","Cabana"],["b_barn","Celeiro"],["b_shed","Barracão"],["b_temple","Templo"],["b_castle","Castelo"],["b_tower","Torre"],["b_mill","Moinho"],["b_stall","Barraca de feira"],["b_well","Poço"],["b_tent","Barraca militar"],["b_cmd","Tenda de comando"],["b_fire","Fogueira"]]],["Pontos de interesse",[["cave","Caverna"],["ruin","Ruína"],["stones","Círculo de pedras"],["watch","Torre de vigia"],["camp","Acampamento"],["mine","Mina"],["graves","Cemitério"],["shrine","Santuário"],["totem","Totem"],["torii","Portal torii"]]]];
if(window.AtlasAssets)OBJCAT.splice(3,0,...AtlasAssets.LIST.map(([g,it])=>[g,it]));
const OBJTREE=new Set(OBJCAT[0][1].map(x=>x[0])),OBJTERR=new Set(["volcano","mesa","pond"]);let THUMBS=null;let thumbRace="";const isB=v=>v.slice(0,2)==="b_"||!!(window.AtlasAssets&&AtlasAssets.NAME[v]);
const objName=v=>(OBJCAT.flatMap(g=>g[1]).find(x=>x[0]===v)||["",v])[1];
const ICON={move:"M12 3v18M3 12h18M12 3l-3 3M12 3l3 3M12 21l-3-3M12 21l3-3M3 12l3-3M3 12l3 3M21 12l-3-3M21 12l-3 3",land:"M3 18c2-5 5-8 9-8s7 3 9 8M3 18h18",sea:"M3 9c2-2 4-2 6 0s4 2 6 0 4-2 6 0M3 15c2-2 4-2 6 0s4 2 6 0 4-2 6 0",
  up:"M4 19l8-13 8 13M12 6v-3",down:"M4 6l8 13 8-13",forest:"M12 3l6 9h-4l5 7H5l5-7H6zM12 19v3",clear:"M12 4a8 8 0 1 0 .01 0M8 12h8",biome:"M12 3v3M12 18v3M3 12h3M18 12h3M6 6l2 2M16 16l2 2M18 6l-2 2M8 16l-2 2M12 8a4 4 0 1 0 .01 0",
  town:"M4 20V10l8-6 8 6v10zM10 20v-6h4v6",untown:"M4 20V10l8-6 8 6v10zM9 11l6 6M15 11l-6 6",city:"M3 20V9h3v3h3V9h3v3h3V9h3v11zM10 20v-4h4v4",street:"M4 4v16M12 4v16M20 4v16M4 12h16",
  lines:"M4 18l6-8 5 4 5-9M4 18a1.5 1.5 0 1 0 .01 0M10 10a1.5 1.5 0 1 0 .01 0M15 14a1.5 1.5 0 1 0 .01 0M20 5a1.5 1.5 0 1 0 .01 0",road:"M8 3l-3 18M16 3l3 18M12 5v3M12 11v3M12 17v3",river:"M7 3c4 4-4 7 0 11s-4 5 0 7M14 3c4 4-4 7 0 11s-4 5 0 7",pin:"M12 21s7-6 7-11a7 7 0 1 0-14 0c0 5 7 11 7 11zM12 10a2 2 0 1 0 .01 0",obj:"M12 3l7 4v8l-7 4-7-4V7zM12 11l7-4M12 11v8M12 11L5 7",erase:"M16 4l5 5-10 10H6l-3-3zM9 9l6 6M6 19h15"};
const svgI=(d)=>{const n="http://www.w3.org/2000/svg",sv=document.createElementNS(n,"svg");sv.setAttribute("viewBox","0 0 24 24");sv.setAttribute("aria-hidden","true");const p=document.createElementNS(n,"path");p.setAttribute("d",d);sv.append(p);return sv};

// ---------- armazenamento ----------
const Store={db:null,dl:null,dirty:new Set(),timers:new Map(),chain:new Map(),
  async init(){
    let db=null;try{if(window.claude&&claude.use){db=await Promise.race([claude.use("db"),new Promise(r=>setTimeout(()=>r(null),9000))]);claude.use("downloads").then(d=>this.dl=d,()=>{})}}catch(e){}
    if(db){this.db=db;let first=0;const done=()=>{if(++first===2)ready()};const t=setTimeout(()=>{if(first<2){first=2;pill("Sem resposta do vault","warn");ready()}},10000);
      for(const kind of["notes","maps"]){let got=false;db.collection(kind).onSnapshot(sn=>{applySnap(kind,sn);if(!got){got=true;done();if(first>=2)clearTimeout(t)}},e=>{pill("Vault indisponível","warn");if(!got){got=true;done()}})}
      pill("Vault na nuvem","ok")}
    else{for(const kind of["notes","maps"]){try{const raw=JSON.parse(localStorage.getItem("atlas:"+kind)||"[]");for(const o of raw)S[kind].set(o.id,o)}catch(e){}}pill("Salvo só neste navegador","warn");ready()}},
  save(kind,o){o.updated=now();const key=kind+"/"+o.id;this.dirty.add(key);clearTimeout(this.timers.get(key));pill("Salvando…");
    this.timers.set(key,setTimeout(()=>this.flush(kind,o.id),700))},
  flush(kind,id){const key=kind+"/"+id,o=S[kind].get(id);if(!o){this.dirty.delete(key);return}
    if(!this.db){this.local(kind);this.dirty.delete(key);pill("Salvo só neste navegador","warn");return}
    const body=JSON.parse(JSON.stringify(o));delete body.id;const stamp=o.updated;
    const p=(this.chain.get(key)||Promise.resolve()).then(()=>this.db.doc(key).set(body)).then(()=>{if(S[kind].get(id)&&S[kind].get(id).updated===stamp){this.dirty.delete(key)}if(!this.dirty.size)pill("Salvo","ok")},
      e=>{pill("Erro ao salvar","warn");toast(e&&e.code==="invalid_argument"?"Sem permissão para salvar neste vault.":"Não foi possível salvar agora. Tente de novo em instantes.")});
    this.chain.set(key,p)},
  local(kind){try{localStorage.setItem("atlas:"+kind,JSON.stringify([...S[kind].values()]))}catch(e){toast("Sem espaço para salvar neste navegador.")}},
  remove(kind,id){S[kind].delete(id);const key=kind+"/"+id;clearTimeout(this.timers.get(key));this.dirty.delete(key);if(this.db)this.db.doc(key).delete().catch(()=>toast("Não foi possível excluir."));else this.local(kind)}};
function pill(t,c){const p=$("#sync");p.textContent=t;p.className="pill "+(c||"")}
function applySnap(kind,sn){const m=S[kind],seen=new Set(),changed=[];
  for(const d of sn.docs){seen.add(d.id);if(Store.dirty.has(kind+"/"+d.id))continue;const body=JSON.parse(JSON.stringify(d.data()||{}));body.id=d.id;const old=m.get(d.id);
    if(!old||JSON.stringify(old)!==JSON.stringify(body)){m.set(d.id,body);changed.push(d.id)}}
  if(!sn.metadata.fromCache)for(const id of[...m.keys()])if(!seen.has(id)&&!Store.dirty.has(kind+"/"+id)){m.delete(id);changed.push(id)}
  if(!changed.length||!booted)return;drawSide();
  if(kind==="notes"){if(S.sec==="notes"&&changed.includes(S.note)){if(S.notes.has(S.note)){if(document.activeElement&&document.activeElement.classList.contains("ed"))return;drawMain()}else{S.note=null;drawMain()}}if(S.place)drawPlace()}
  else if(S.sec==="maps"&&changed.includes(S.map)){if(!S.maps.has(S.map))S.map=null;drawMain()}}

// ---------- markdown ----------
function fm(src){const m=/^---\n([\s\S]*?)\n---\n?/.exec(src||"");const props={};if(!m)return{props,body:src||""};
  for(const ln of m[1].split("\n")){const i=ln.indexOf(":");if(i>0)props[ln.slice(0,i).trim()]=ln.slice(i+1).trim().replace(/^"(.*)"$/,"$1")}return{props,body:src.slice(m[0].length)}}
const norm=t=>String(t||"").trim().toLowerCase();
function findNote(title){const n=norm(title);for(const o of S.notes.values())if(norm(o.title)===n)return o;return null}
function inline(t){t=esc(t);const codes=[];t=t.replace(/`([^`]+)`/g,(_,c)=>{codes.push(c);return "\u0001"+(codes.length-1)+"\u0001"});
  t=t.replace(/!?\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g,(_,a,b)=>{const tt=a.trim();return '<a class="wl'+(findNote(tt.replace(/&amp;/g,"&"))?"":" miss")+'" data-t="'+tt+'">'+(b||tt)+"</a>"});
  t=t.replace(/\[([^\]]+)\]\((https?:[^)\s]+)\)/g,'<a href="$2" target="_blank" rel="noopener">$1</a>');
  t=t.replace(/\*\*([^*]+)\*\*/g,"<strong>$1</strong>").replace(/(^|[\s(])\*([^*\s][^*]*)\*/g,"$1<em>$2</em>").replace(/(^|[\s(])_([^_\s][^_]*)_/g,"$1<em>$2</em>").replace(/~~([^~]+)~~/g,"<del>$1</del>");
  t=t.replace(/(^|\s)#([\p{L}\d_\/-]+)/gu,'$1<span class="tag">#$2</span>');
  return t.replace(/\u0001(\d+)\u0001/g,(_,i)=>"<code>"+codes[i]+"</code>")}
function md(src){const L=String(src||"").replace(/\r/g,"").split("\n"),o=[];let i=0,para=[],m;const flush=()=>{if(para.length){o.push("<p>"+inline(para.join(" "))+"</p>");para=[]}};
  const li=/^\s*([-*+]|\d+\.)\s+/;
  while(i<L.length){const l=L[i];
    if(/^```/.test(l)){flush();const b=[];i++;while(i<L.length&&!/^```/.test(L[i]))b.push(L[i++]);i++;o.push("<pre><code>"+esc(b.join("\n"))+"</code></pre>");continue}
    if((m=/^(#{1,6})\s+(.*)/.exec(l))){flush();o.push("<h"+m[1].length+">"+inline(m[2])+"</h"+m[1].length+">");i++;continue}
    if(/^\s*(---|\*\*\*)\s*$/.test(l)){flush();o.push("<hr>");i++;continue}
    if(/^>/.test(l)){flush();const b=[];while(i<L.length&&/^>/.test(L[i]))b.push(L[i++].replace(/^>\s?/,""));const c=/^\[!(\w+)\]\s*(.*)/.exec(b[0]||"");
      o.push(c?'<div class="callout"><div class="ct">'+inline(c[2]||c[1])+"</div>"+md(b.slice(1).join("\n"))+"</div>":"<blockquote>"+md(b.join("\n"))+"</blockquote>");continue}
    if(li.test(l)){flush();const ord=/^\s*\d+\./.test(l),b=[];while(i<L.length&&li.test(L[i])){const t=L[i++].replace(li,""),ck=/^\[( |x|X)\]\s*(.*)/.exec(t);
        b.push(ck?'<li class="task"><input type="checkbox" disabled'+(ck[1]!==" "?" checked":"")+"> "+inline(ck[2])+"</li>":"<li>"+inline(t)+"</li>")}
      o.push((ord?"<ol>":"<ul>")+b.join("")+(ord?"</ol>":"</ul>"));continue}
    if(/^\|.*\|\s*$/.test(l)&&i+1<L.length&&/^\|[\s:|-]+\|\s*$/.test(L[i+1])){flush();const row=s=>s.trim().replace(/^\||\|$/g,"").split("|").map(c=>inline(c.trim()));const hd=row(l);i+=2;const rows=[];while(i<L.length&&/^\|.*\|\s*$/.test(L[i]))rows.push(row(L[i++]));
      o.push('<div class="tw"><table><thead><tr>'+hd.map(c=>"<th>"+c+"</th>").join("")+"</tr></thead><tbody>"+rows.map(r=>"<tr>"+r.map(c=>"<td>"+c+"</td>").join("")+"</tr>").join("")+"</tbody></table></div>");continue}
    if(!l.trim()){flush();i++;continue}
    para.push(l);i++}
  flush();return o.join("\n")}
function mdView(src){const d=h("div",{class:"md",html:md(fm(src).body)});d.addEventListener("click",e=>{const a=e.target.closest("a.wl");if(a){e.preventDefault();openTitle(a.dataset.t)}});return d}

// ---------- notas ----------
function newNote(type,title,extra){const id=uid("n");let t=title||"Sem título",k=2;while(findNote(t))t=(title||"Sem título")+" "+(k++);
  const o={id,title:t,folder:FOLD[type]||"",content:(extra&&extra.content)!=null?extra.content:TPL[type]||"",updated:now()};S.notes.set(id,o);Store.save("notes",o);return o}
function openNote(id,mode){S.sec="notes";S.note=id;const o=S.notes.get(id);S.mode=mode||(o&&fm(o.content).body.trim()?"read":"edit");closePlace();drawAll();$("#side").classList.remove("open")}
function openTitle(t){const o=findNote(t)||newNote("livre",t);openNote(o.id)}
function backlinks(o){const t=norm(o.title),out=[];if(!t)return out;const re=/\[\[([^\]|]+)(?:\|[^\]]+)?\]\]/g;for(const n of S.notes.values()){if(n.id===o.id)continue;let m;re.lastIndex=0;while((m=re.exec(n.content||""))){if(norm(m[1])===t){out.push(n);break}}}return out}
function drawNote(){const o=S.notes.get(S.note),main=$("#main");main.replaceChildren();if(!o)return drawWelcome();
  const {props}=fm(o.content),type=props.tipo&&TYPES[props.tipo]?props.tipo:"livre";
  const title=h("input",{class:"title",type:"text",value:o.title,"aria-label":"Título da nota",onchange:e=>{const v=e.target.value.trim()||"Sem título",ex=findNote(v);if(ex&&ex.id!==o.id){toast("Já existe uma nota com esse título.");e.target.value=o.title;return}o.title=v;Store.save("notes",o);drawSide()}});
  const folder=h("input",{type:"text",value:o.folder||"",placeholder:"Pasta","aria-label":"Pasta",onchange:e=>{o.folder=e.target.value.trim();Store.save("notes",o);drawSide()}});
  let armed=false;const del=h("button",{type:"button",class:"danger",onclick:()=>{if(!armed){armed=true;del.textContent="Confirmar exclusão";setTimeout(()=>{armed=false;del.textContent="Excluir"},3000);return}Store.remove("notes",o.id);S.note=null;drawAll()}},"Excluir");
  const tog=h("button",{type:"button",class:"primary",onclick:()=>{S.mode=S.mode==="edit"?"read":"edit";drawNote()}},S.mode==="edit"?"Ler":"Editar");
  const chips=h("div",{class:"props"},h("span",{class:"chip"},TYPES[type]),Object.entries(props).filter(([k,v])=>k!=="tipo"&&v).map(([k,v])=>h("span",{class:"chip"},k+": ",h("b",{},v))));
  if(props.mapa){const mp=[...S.maps.values()].find(m=>norm(m.name)===norm(props.mapa));if(mp)chips.append(h("button",{type:"button",onclick:()=>openMap(mp.id,props.pino||o.title)},"Ver no mapa"))}
  const wrap=h("div",{class:"note"},title,h("div",{class:"row"},folder,h("span",{class:"grow"}),tog,del),chips);
  if(S.mode==="edit"){const sugg=h("div",{class:"sugg"}),ta=h("textarea",{class:"ed",spellcheck:"true","aria-label":"Conteúdo da nota",placeholder:"Escreva em Markdown. Use [[Nome]] para ligar a outra nota."});ta.value=o.content||"";
    ta.addEventListener("input",()=>{o.content=ta.value;Store.save("notes",o);const pre=ta.value.slice(0,ta.selectionStart),m=/\[\[([^\]\n|]*)$/.exec(pre);sugg.replaceChildren();
      if(m){const q=norm(m[1]),names=new Set([...S.notes.values()].filter(n=>n.id!==o.id).map(n=>n.title));for(const mp of S.maps.values())for(const t of mp.lock||[])if(t.name)names.add(t.name);
        [...names].filter(n=>norm(n).includes(q)).slice(0,8).forEach(n=>sugg.append(h("button",{type:"button",onclick:()=>{const st=ta.selectionStart-m[1].length;ta.setRangeText(n+"]]",st,ta.selectionStart,"end");ta.focus();ta.dispatchEvent(new Event("input"))}},n)))}});
    wrap.append(sugg,ta)}
  else wrap.append(mdView(o.content));
  const bl=backlinks(o);if(bl.length)wrap.append(h("section",{class:"back"},h("h3",{},"Mencionada em"),h("div",{class:"list"},bl.map(n=>h("button",{class:"item",type:"button",onclick:()=>openNote(n.id)},n.title)))));
  main.append(wrap)}

// ---------- mapas ----------
let cur=null,tool="move",brush=60,undo=[];
function newMap(){const id=uid("m"),nm=A.NAMES[(Math.random()*A.NAMES.length)|0];let name="Região de "+nm,k=2;while([...S.maps.values()].some(m=>m.name===name))name="Região de "+nm+" "+(k++);
  const o={id,name,params:Object.assign({},DEF,{seed:nm.toLowerCase()+"-"+(1300+((Math.random()*200)|0))}),edits:[],lock:null,pins:[],updated:now()};S.maps.set(id,o);Store.save("maps",o);return o}
function newCityFrom(reg,town){const AC=window.AtlasCity,W=S.cur&&S.cur.W,t=W&&W.towns.find(z=>z.name===town.name),x=town.x,y=town.y,R=t?t.rmax:40,sg=A.sampleGrid;
  let site="interior",river=false,relief=.4;if(W&&sg){let wn=0;for(let k=0;k<24;k++){const a=k/24*6.2832;if(sg(W.land,x+Math.cos(a)*(R+60),y+Math.sin(a)*(R+60))<0)wn++}site=wn>=18?"ilha":wn>=10?"peninsula":wn>0?"costa":"interior";river=sg(W.rdist,x,y)<R+40;if(river&&site==="interior")site="rio";
    let e0=1,e1=0;for(let k=0;k<16;k++){const a=k/16*6.2832,e=sg(W.elev,x+Math.cos(a)*R,y+Math.sin(a)*R);e0=Math.min(e0,e);e1=Math.max(e1,e)}relief=clamp((e1-e0)*4,.15,.95)}
  const size=town.kind==="city"?clamp(Math.round(18+(town.size-26)*.6),16,40):town.kind==="town"?clamp(Math.round(10+(town.size-12)*.5),9,18):6;
  const id=uid("m"),o={id,name:"Cidade de "+town.name,type:"city",src:{map:reg.id,town:town.name},params:Object.assign({},AC.DEF,{seed:town.name.toLowerCase()+"-"+(A.hashStr(reg.params.seed||"x")%900+100),site,river,relief,size,culture:town.race||"humano",wall:town.wall?"reta":"nenhuma",citadel:town.kind==="city",plan:town.planned?"planejado":"misto",wealth:town.kind==="city"?.6:town.kind==="town"?.45:.3,foreign:town.kind==="city"?"auto":"nao"}),updated:now()};
  S.maps.set(id,o);Store.save("maps",o);return o}
function newCity(){const AC=window.AtlasCity,id=uid("m"),nm=A.NAMES[(Math.random()*A.NAMES.length)|0];let name="Cidade de "+nm,k=2;while([...S.maps.values()].some(m=>m.name===name))name="Cidade de "+nm+" "+(k++);
  const o={id,name,type:"city",params:Object.assign({},AC.DEF,{seed:nm.toLowerCase()+"-"+(1200+((Math.random()*300)|0)),site:AC.SITES[(Math.random()*AC.SITES.length)|0][0]}),updated:now()};S.maps.set(id,o);Store.save("maps",o);return o}
// mapa de cidade: gerador proprio (city.js), com zoom, arrasto e parametros
function drawCityMap(o,main){const AC=window.AtlasCity;o.params=Object.assign({},AC.DEF,o.params);o.params.wards=o.params.wards||{};o.objs=o.objs||[];o.erase=o.erase||[];if(o.params.wall===true)o.params.wall="reta";if(o.params.wall===false)o.params.wall="nenhuma";
  const mc=h("canvas",{id:"mc",width:AC.CW,height:AC.CH,"aria-label":"Mapa da cidade"}),mo=h("canvas",{id:"mo",width:AC.CW,height:AC.CH}),stage=h("div",{class:"stage"},mc,mo),busy=h("div",{class:"busy"},"Gerando…"),status=h("div",{class:"status"}),view=h("div",{class:"view"},stage),octx=mo.getContext("2d");view.style.aspectRatio=AC.CW+"/"+AC.CH;
  const Z={k:1,x:0,y:0},zl=h("span",{class:"zl"},"100%"),applyZ=()=>{const vw=view.clientWidth,vh=view.clientHeight;Z.x=clamp(Z.x,vw-vw*Z.k,0);Z.y=clamp(Z.y,vh-vh*Z.k,0);stage.style.transform="translate("+Z.x+"px,"+Z.y+"px) scale("+Z.k+")";zl.textContent=Math.round(Z.k*100)+"%"};
  const zoomAt=(cx,cy,f)=>{const k2=clamp(Z.k*f,1,8);Z.x=cx-(cx-Z.x)*k2/Z.k;Z.y=cy-(cy-Z.y)*k2/Z.k;Z.k=k2;applyZ()},zoomMid=f=>zoomAt(view.clientWidth/2,view.clientHeight/2,f);
  let C=null,info=null,tool="move",sel=-1,brush=40,cSel="b_town",cSize=1,cRot=20,cRace=o.params.culture,cSpread=1;const undo=[];
  const snap=()=>{undo.push(JSON.stringify({params:o.params,objs:o.objs,erase:o.erase}));if(undo.length>30)undo.shift()};
  const toWorld=ev=>{const r=mc.getBoundingClientRect(),cx=(ev.clientX-r.left)*AC.CW/r.width,cy=(ev.clientY-r.top)*AC.CH/r.height;if(!info)return null;const w=info.unproject(cx,cy);return {x:w[0],y:w[1],cx,cy}};
  function draw(){if(!C)return;const t0=performance.now();info=AC.render(C,mc,{objs:o.objs,erase:o.erase});drawSel();return performance.now()-t0}
  function regen(){busy.hidden=false;setTimeout(()=>{const t0=performance.now();try{C=AC.generate(Object.assign({},o.params,{title:o.name.replace(/^Cidade de /i,"")}));draw();Store.save("maps",o);
      status.textContent=C.inner.length+" bairros, "+C.districts.length+" distritos, "+info.houses+" construções, "+C.gates.length+" portões, "+Math.round(performance.now()-t0)+" ms"}
    catch(e){console.error(e);status.textContent="Não foi possível gerar esta cidade. Tente outra semente. ("+e.message+")"}busy.hidden=true;drawCtx()},30)}
  function redraw(){const ms=draw();Store.save("maps",o);status.textContent=status.textContent.replace(/(, )?\d+ ms$/,"")+", "+Math.round(ms)+" ms"}
  const handles=()=>{if(!C)return [];if(tool==="corner"){const ids=new Set();for(const p of C.patches)if(p.inner||p.type==="arrabalde")for(const id of p.nd)ids.add(id);return [...ids].map(id=>({id,p:info.project(C.nodes[id].x,C.nodes[id].y)})).filter(q=>q.p[0]>A.MX&&q.p[1]>A.MY&&q.p[0]<AC.CW-A.MX&&q.p[1]<AC.CH-40)}
    if(tool==="gate"){const ids=new Set();for(const w of C.walls||[])for(const id of w.ids)ids.add(id);for(const g of C.gates)ids.add(g);return [...ids].map(id=>({id,p:info.project(C.nodes[id].x,C.nodes[id].y),g:C.gates.includes(id)}))}return []};
  let drag=null;
  function drawHandles(){if(tool!=="corner"&&tool!=="gate")return;for(const q of handles()){const dp=drag&&drag.id===q.id?drag.p:q.p;octx.fillStyle=q.g?"#a8352a":"rgba(201,162,74,.95)";octx.strokeStyle="#1d160d";octx.lineWidth=1.5;octx.beginPath();octx.arc(dp[0],dp[1],q.g?10:tool==="gate"?7:8,0,7);octx.fill();octx.stroke()}}
  function drawSel(){octx.clearRect(0,0,AC.CW,AC.CH);drawHandles();if(sel<0||!C||!info)return;const p=C.patches[sel];if(!p)return;octx.beginPath();p.poly.forEach((v,i)=>{const q=info.project(v[0],v[1]);i?octx.lineTo(q[0],q[1]):octx.moveTo(q[0],q[1])});octx.closePath();octx.fillStyle="rgba(201,162,74,.18)";octx.fill();octx.strokeStyle="rgba(201,162,74,.95)";octx.lineWidth=2.5;octx.setLineDash([7,4]);octx.stroke();octx.setLineDash([])}
  // arrastar, aproximar, ferramentas
  let pan=null,tap=null,stroke=null;
  view.addEventListener("pointerdown",ev=>{if(ev.target.closest("button"))return;try{view.setPointerCapture(ev.pointerId)}catch(e){}if(ev.button===1){ev.preventDefault();pan=[ev.clientX,ev.clientY];return}if(ev.button===2)return;
    if(tool==="move"){pan=[ev.clientX,ev.clientY];return}
    if(tool==="corner"||tool==="gate"){const w=toWorld(ev);if(!w)return;const r=mc.getBoundingClientRect(),tol=14*AC.CW/r.width;let best=null,bd=tol;for(const q of handles()){const d=Math.hypot(q.p[0]-w.cx,q.p[1]-w.cy);if(d<bd){bd=d;best=q}}
      if(!best){pan=[ev.clientX,ev.clientY];return}if(tool==="gate"){snap();const G=o.params.gates=o.params.gates||{add:[],del:[]};if(best.g){G.add=G.add.filter(x=>x!==best.id);if(!G.del.includes(best.id))G.del.push(best.id)}else{G.del=G.del.filter(x=>x!==best.id);if(!G.add.includes(best.id))G.add.push(best.id)}regen();return}
      drag={id:best.id,p:best.p};return}
    if(tool==="erase"){const w=toWorld(ev);if(w){stroke=[];addE(w)}return}tap=[ev.clientX,ev.clientY]});
  const addE=w=>{const l=stroke[stroke.length-1];if(l&&Math.hypot(l.x-w.x,l.y-w.y)<brush*.4)return;stroke.push({x:Math.round(w.x),y:Math.round(w.y),r:brush});octx.fillStyle="rgba(170,60,50,.4)";octx.beginPath();octx.ellipse(w.cx,w.cy,brush,brush*A.TILT,0,0,7);octx.fill()};
  view.addEventListener("pointermove",ev=>{if(drag){const w=toWorld(ev);if(w){drag.p=[w.cx,w.cy];drag.w=[w.x,w.y];drawSel()}return}if(pan){Z.x+=ev.clientX-pan[0];Z.y+=ev.clientY-pan[1];pan=[ev.clientX,ev.clientY];applyZ();return}if(stroke){const w=toWorld(ev);if(w)addE(w);return}
    if(tool==="obj"&&THUMBS&&THUMBS[cSel]){const w=toWorld(ev);drawSel();if(w){const t=THUMBS[cSel],z=(OBJTREE.has(cSel)?.62:.6)*cSize*1.55;octx.strokeStyle="rgba(201,162,74,.95)";octx.lineWidth=1.5;octx.beginPath();octx.ellipse(w.cx,w.cy,14*z,14*z*A.TILT,0,0,7);octx.stroke();octx.globalAlpha=.8;octx.drawImage(t,w.cx-36*z,w.cy-64*z,72*z,72*z);octx.globalAlpha=1}}});
  const up=ev=>{pan=null;if(drag){const d=drag;drag=null;if(d.w){snap();o.params.nodes=o.params.nodes||{};o.params.nodes[d.id]=[Math.round(d.w[0]),Math.round(d.w[1])];regen()}else drawSel();return}if(stroke){const st=stroke;stroke=null;if(st.length){snap();o.objs=o.objs.filter(m=>!st.some(e=>Math.hypot(m.x-e.x,m.y-e.y)<e.r));o.erase=o.erase.concat(st);redraw()}}
    if(tap){const t=tap;tap=null;if(ev.type==="pointerup"&&Math.hypot(ev.clientX-t[0],ev.clientY-t[1])<10){const w=toWorld(ev);if(w)act(w)}}};
  view.addEventListener("pointerup",up);view.addEventListener("pointercancel",up);view.addEventListener("pointerleave",()=>{if(tool==="obj")drawSel()});
  view.addEventListener("mousedown",ev=>{if(ev.button===1)ev.preventDefault()});view.addEventListener("wheel",ev=>{ev.preventDefault();const r=view.getBoundingClientRect();zoomAt(ev.clientX-r.left,ev.clientY-r.top,Math.exp(-ev.deltaY*.0016))},{passive:false});
  function act(w){if(tool==="obj"){snap();const n=OBJTREE.has(cSel)?cSpread:1;for(let i=0;i<n;i++){const a=Math.random()*6.28,d=i?Math.sqrt(Math.random())*(14+n*3):0,m={v:cSel,x:Math.round(w.x+Math.cos(a)*d),y:Math.round(w.y+Math.sin(a)*d*.8),s:+(cSize*(i?.85+Math.random()*.3:1)).toFixed(2)};if(isB(cSel)){m.c=cRace;m.a=cRot}o.objs.push(m)}redraw()}
    else if(tool==="ward"){const p=AC.patchAt(C,w.x,w.y);sel=p?p.i:-1;drawSel();drawCtx()}}
  // paleta
  const TT=[["move","Navegar"],["ward","Editar bairro"],["corner","Mover cantos e muralha"],["gate","Portões"],["obj","Colocar objeto"],["erase","Apagar"]],IC={ward:"M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z",corner:"M4 18L9 6l6 9 5-7M9 6a1.5 1.5 0 1 0 .01 0M15 15a1.5 1.5 0 1 0 .01 0M4 18a1.5 1.5 0 1 0 .01 0",gate:"M4 20V9l8-5 8 5v11M9 20v-6a3 3 0 0 1 6 0v6"};
  const pal=h("div",{class:"pal",role:"toolbar","aria-label":"Ferramentas da cidade"}),ctx=h("div",{class:"ctx"}),hint=h("div",{class:"hintc"});
  for(const [t,l] of TT)pal.append(h("button",{type:"button",class:"tbtn","data-t":t,"aria-label":l,title:l,onclick:()=>setTool(t)},svgI(ICON[t]||IC[t]),h("span",{class:"tip"},l)));
  const HT={corner:"Arraste os pontos para mudar o formato dos bairros e da muralha",gate:"Toque num ponto da muralha para abrir ou fechar um portão",move:"Arraste para mover · roda do mouse ou botão do meio para navegar",ward:"Toque num bairro para mudar função, cultura e traçado",obj:"Toque no mapa para colocar o objeto escolhido",erase:"Pinte por cima do que quer apagar"};
  function setTool(t){tool=t;for(const b of pal.querySelectorAll(".tbtn"))b.classList.toggle("on",b.dataset.t===t);hint.textContent=HT[t];stage.classList.toggle("draw",t!=="move");if(t!=="ward"){sel=-1}drawSel();drawCtx()}
  const B_=(label,fn,cls)=>h("button",{type:"button",class:cls||"",onclick:fn},label);
  function drawCtx(){ctx.replaceChildren();ctx.hidden=tool==="move";if(tool==="move")return;ctx.append(h("strong",{class:"cname"},(TT.find(x=>x[0]===tool)||["",""])[1]));
    if(tool==="erase")ctx.append(h("label",{class:"cf"},"Pincel",h("input",{type:"range",min:15,max:120,value:brush,"aria-label":"Tamanho do pincel",oninput:e=>brush=+e.target.value})),B_("Desfazer todas as borrachas",()=>{if(!o.erase.length)return;snap();o.erase=[];redraw()},"ghost"));
    if(tool==="ward"){if(sel<0||!C){ctx.append(h("span",{class:"cf"},"Toque num bairro do mapa."));return}const p=C.patches[sel],ov=o.params.wards[sel]||{};
      const setW=(k,v)=>{snap();const z=Object.assign({},o.params.wards[sel]||{});if(v)z[k]=v;else delete z[k];if(Object.keys(z).length)o.params.wards[sel]=z;else delete o.params.wards[sel];regen()};
      ctx.append(h("label",{class:"cf"},"Função",h("select",{"aria-label":"Função do bairro",onchange:e=>setW("type",e.target.value)},AC.WTYPES.map(([v,n])=>h("option",{value:v,selected:v===p.type},n)))),
        h("label",{class:"cf"},"Cultura",h("select",{"aria-label":"Cultura do bairro",onchange:e=>setW("race",e.target.value)},A.RACES.map(r=>h("option",{value:r,selected:r===p.race},A.RACE_PT[r])))),
        h("label",{class:"cf"},"Traçado",h("select",{"aria-label":"Traçado do bairro",onchange:e=>setW("plan",e.target.value)},[["","Automático"],["organico","Orgânico"],["planejado","Planejado"]].map(([v,n])=>h("option",{value:v,selected:(ov.plan||"")===v},n)))),
        h("label",{class:"cf"},"Muralha",h("select",{"aria-label":"Bairro dentro ou fora da muralha",onchange:e=>{snap();const z=Object.assign({},o.params.wards[sel]||{});z.inside=e.target.value==="1";o.params.wards[sel]=z;regen()}},h("option",{value:"1",selected:!!p.inner},"Dentro da cidade"),h("option",{value:"0",selected:!p.inner},"Fora da cidade"))),
        B_("Voltar ao automático",()=>{if(!o.params.wards[sel])return;snap();delete o.params.wards[sel];regen()},"ghost"))}
    if(tool==="corner")ctx.append(B_("Desfazer todos os cantos movidos",()=>{if(!o.params.nodes||!Object.keys(o.params.nodes).length)return;snap();o.params.nodes={};regen()},"ghost"));
    if(tool==="gate")ctx.append(h("span",{class:"cf"},"Vermelho = portão aberto"),B_("Voltar aos portões automáticos",()=>{snap();o.params.gates={add:[],del:[]};regen()},"ghost"));
    if(tool==="obj"){if(!THUMBS||thumbRace!==cRace){const st=A.makeStamps(A.mulberry(12345));THUMBS={};thumbRace=cRace;for(const [,it] of OBJCAT)for(const [v] of it)THUMBS[v]=A.objThumb(v,st,72,cRace)}
      const cats=OBJCAT.filter(([g])=>g!=="Rochas e relevo"),gi=Math.max(0,cats.findIndex(g=>g[1].some(x=>x[0]===cSel)));
      ctx.append(h("span",{class:"cf"},objName(cSel)),h("label",{class:"cf"},"Tamanho",h("input",{type:"range",min:.5,max:2,step:.1,value:cSize,"aria-label":"Tamanho do objeto",oninput:e=>cSize=+e.target.value})));
      if(OBJTREE.has(cSel))ctx.append(h("label",{class:"cf"},"Por toque",h("input",{type:"range",min:1,max:12,step:1,value:cSpread,"aria-label":"Árvores por toque",oninput:e=>cSpread=+e.target.value})));
      if(isB(cSel))ctx.append(h("label",{class:"cf"},"Cultura",h("select",{"aria-label":"Cultura da construção",onchange:e=>{cRace=e.target.value;drawCtx()}},A.RACES.map(r=>h("option",{value:r,selected:r===cRace},A.RACE_PT[r])))),h("label",{class:"cf"},"Giro",h("input",{type:"range",min:0,max:355,step:5,value:cRot,"aria-label":"Giro da construção",oninput:e=>cRot=+e.target.value})));
      ctx.append(B_("Tirar todos os colocados",()=>{if(!o.objs.length)return;snap();o.objs=[];redraw()},"ghost"));
      const tabs=h("div",{class:"otabs",role:"tablist"},cats.map(([g],k)=>h("button",{type:"button",role:"tab","aria-selected":k===gi?"true":"false",class:k===gi?"on":"",onclick:()=>{cSel=cats[k][1][0][0];drawCtx()}},g)));
      const grid=h("div",{class:"ogrid"},cats[gi][1].map(([v,n])=>{const b=h("button",{type:"button",class:"ocell"+(v===cSel?" on":""),title:n,"aria-label":n,"aria-pressed":v===cSel?"true":"false",onclick:()=>{cSel=v;drawCtx()}});const cv=document.createElement("canvas");cv.width=cv.height=72;cv.getContext("2d").drawImage(THUMBS[v],0,0);b.append(cv,h("span",{},n));return b}));
      ctx.append(h("div",{class:"obox"},tabs,grid))}}
  const par=h("aside",{class:"params","aria-label":"Parâmetros da cidade"}),body=h("div",{class:"mbody par"});
  function fill(){par.replaceChildren(h("h2",{},"Parâmetros da cidade"));for(const [k,label,kind,a,b] of AC.PARAMS){const id="c_"+k;let inp,val=h("span",{});const ch=v=>{snap();o.params[k]=v;if(k==="seed"||k==="site"||k==="size"){o.params.wards={};o.params.nodes={};o.params.gates={add:[],del:[]}}regen()};
      if(kind==="select"){inp=h("select",{id,onchange:e=>ch(e.target.value)},a.map(([v,t])=>h("option",{value:v},t)));inp.value=String(o.params[k])}
      else if(kind==="text")inp=h("input",{id,type:"text",value:o.params[k],autocomplete:"off",onchange:e=>ch(e.target.value.trim()||"atlas")});
      else if(kind==="bool"){inp=h("select",{id,onchange:e=>ch(e.target.value==="1")},h("option",{value:"1"},"Sim"),h("option",{value:"0"},"Não"));inp.value=o.params[k]?"1":"0"}
      else if(kind==="pct"){inp=h("input",{id,type:"range",min:0,max:100,value:Math.round(o.params[k]*100),oninput:e=>val.textContent=e.target.value+"%",onchange:e=>ch(e.target.value/100)});val.textContent=Math.round(o.params[k]*100)+"%"}
      else{inp=h("input",{id,type:"range",min:a,max:b,value:o.params[k],oninput:e=>val.textContent=e.target.value,onchange:e=>ch(+e.target.value)});val.textContent=o.params[k]}
      par.append(h("div",{class:"fld"},h("label",{for:id},label,val),inp))}}
  const title=h("input",{class:"title",type:"text",value:o.name,"aria-label":"Nome da cidade",onchange:e=>{o.name=e.target.value.trim()||"Cidade";drawSide();regen()}});
  let armed=false;const del=h("button",{type:"button",class:"danger ghost",onclick:()=>{if(!armed){armed=true;del.textContent="Confirmar";setTimeout(()=>{armed=false;del.textContent="Excluir"},3000);return}Store.remove("maps",o.id);S.map=null;drawAll()}},"Excluir");
  const bPar=h("button",{type:"button","aria-pressed":"true",onclick:()=>{par.hidden=!par.hidden;body.classList.toggle("par",!par.hidden);bPar.setAttribute("aria-pressed",String(!par.hidden));applyZ()}},"Parâmetros");
  const head=h("div",{class:"mhead"},title,h("div",{class:"hact"},h("button",{type:"button",class:"primary",onclick:()=>{snap();o.params.seed=A.NAMES[(Math.random()*A.NAMES.length)|0].toLowerCase()+"-"+(1200+((Math.random()*300)|0));o.params.wards={};o.params.nodes={};o.params.gates={add:[],del:[]};o.objs=[];o.erase=[];fill();regen()}},"Sortear nova"),bPar,h("button",{type:"button",onclick:()=>mc.toBlob(b=>saveFile(safe(o.name)+".png",b))},"Salvar PNG"),del));
  const zbox=h("div",{class:"zbox"},h("button",{type:"button",class:"icb",title:"Desfazer","aria-label":"Desfazer",onclick:()=>{const u=undo.pop();if(!u){toast("Nada para desfazer.");return}const nu=JSON.parse(u),same=JSON.stringify(nu.params)===JSON.stringify(o.params);Object.assign(o,nu);fill();same?redraw():regen()}},svgI("M9 14L4 9l5-5M4 9h10a6 6 0 0 1 0 12h-3")),
    h("button",{type:"button",class:"icb",title:"Afastar","aria-label":"Afastar",onclick:()=>zoomMid(1/1.4)},"−"),zl,h("button",{type:"button",class:"icb",title:"Aproximar","aria-label":"Aproximar",onclick:()=>zoomMid(1.4)},"+"),h("button",{type:"button",class:"icb",title:"Ajustar à tela","aria-label":"Ajustar à tela",onclick:()=>{Z.k=1;Z.x=Z.y=0;applyZ()}},"⤢"));
  fill();body.append(h("div",{class:"mwrap"},view,busy,pal,ctx,zbox,hint),par);main.append(h("div",{class:"mapv"},head,body,status));setTool("move");applyZ();regen()}
function openMap(id,flash){S.sec="maps";S.map=id;undo=[];tool="move";closePlace();drawAll(flash);$("#side").classList.remove("open")}
function drawMap(flash){const o=S.maps.get(S.map),main=$("#main");main.replaceChildren();if(!o)return drawWelcome();if(o.type==="city"&&window.AtlasCity)return drawCityMap(o,main);
  o.params=Object.assign({},DEF,o.params);o.edits=o.edits||[];o.pins=o.pins||[];o.objs=o.objs||[];
  const mc=h("canvas",{id:"mc",width:A.CW,height:A.CH,"aria-label":"Mapa"}),mo=h("canvas",{id:"mo",width:A.CW,height:A.CH}),pins=h("div",{id:"mpins"}),stage=h("div",{class:"stage"},mc,mo,pins),busy=h("div",{class:"busy"},"Gerando…"),status=h("div",{class:"status"});
  const view=h("div",{class:"view"},stage),octx=mo.getContext("2d");let sel=null,draft=[];
  // zoom e arrasto
  const Z={k:1,x:0,y:0};
  const applyZ=()=>{const vw=view.clientWidth,vh=view.clientHeight;Z.x=clamp(Z.x,vw-vw*Z.k,0);Z.y=clamp(Z.y,vh-vh*Z.k,0);stage.style.transform="translate("+Z.x+"px,"+Z.y+"px) scale("+Z.k+")";stage.style.setProperty("--k",Z.k);zl.textContent=Math.round(Z.k*100)+"%"};
  const zoomAt=(cx,cy,f)=>{const k2=clamp(Z.k*f,1,8);Z.x=cx-(cx-Z.x)*k2/Z.k;Z.y=cy-(cy-Z.y)*k2/Z.k;Z.k=k2;applyZ()};
  const fitWrap=()=>{const w=view.parentNode;if(w&&!matchMedia("(max-width:860px)").matches)w.style.maxWidth="calc((100vh - 190px) * "+mc.width+" / "+mc.height+")";else if(w)w.style.maxWidth=""};
  const zoomMid=f=>zoomAt(view.clientWidth/2,view.clientHeight/2,f),zl=h("span",{class:"zl"},"100%");
  const snap=()=>{undo.push(JSON.stringify({params:o.params,edits:o.edits,lock:o.lock,pins:o.pins,objs:o.objs,vec:o.vec||null}));if(undo.length>30)undo.shift()};
  S.snap=snap;
  function recompose(){if(!cur||!cur.info.compose){regen();return}const t0=performance.now();try{cur.info.compose(o.objs,o.edits.filter(e=>e.t==="erase"))}catch(e){console.error(e);regen();return}Store.save("maps",o);octx.clearRect(0,0,A.CW,A.CH);status.textContent=status.textContent.replace(/(, )?\d+ ms$/,"")+", "+Math.round(performance.now()-t0)+" ms"}
  function regen(){busy.hidden=false;setTimeout(()=>{const t0=performance.now();try{
      const P=Object.assign({},o.params,{edits:o.edits,lock:o.lock,vec:o.vec,objs:o.objs,title:o.name}),mkLock=W=>W.towns.map(t=>{const z={x:t.x,y:t.y,size:t.size,kind:t.kind,planned:t.planned,name:t.name,dens:Math.round(t.dens*100)/100,wall:!!t.wall,race:t.race};if(t.lockOutline)z.outline=t.lockOutline;if(t.lockSt)z.st=t.lockSt;return z});
      let W=A.generate(P);if(!(o.lock&&o.lock.length))W=A.generate(Object.assign({},P,{lock:mkLock(W),vec:W.vec}));const info=A.render(W,mc,A.makeStamps(A.mulberry(W.seed^77)));
      o.lock=mkLock(W);o.vec=W.vec;cur={W,info};S.cur=cur;if(mo.width!==mc.width||mo.height!==mc.height){mo.width=mc.width;mo.height=mc.height}view.style.aspectRatio=mc.width+"/"+mc.height;fitWrap();applyZ();drawPins();Store.save("maps",o);
      status.textContent=W.towns.length+" povoados, "+info.b+" construções, "+W.fieldsP.length+" lotes de campo, "+W.vec.roads.length+" estradas, "+W.vec.rivers.length+" rios, "+Math.round(performance.now()-t0)+" ms"}
    catch(e){console.error(e);status.textContent="Não foi possível gerar este mapa. Tente outra semente ou desfaça a última edição. ("+e.message+")"}
    busy.hidden=true;octx.clearRect(0,0,A.CW,A.CH);if(S.place)drawPlace()},30)}
  const pos=p=>"left:"+(p[0]/A.CW*100)+"%;top:"+(p[1]/A.CH*100)+"%";
  let cityI=-1;
  const matCity=ti=>{const L=o.lock[ti],T=cur&&cur.W.towns[ti];if(!L||!T)return null;if(!L.outline)L.outline=T.ctrlOutline.map(q=>q.slice());if(!L.st)L.st=T.ctrlStreets.map(z=>({c:z.c.map(q=>q.slice()),m:z.m}));return L};
  const lineOf=(kind,i,k)=>kind==="r"?o.vec.rivers[i].c:kind==="d"?o.vec.roads[i]:kind==="o"?o.lock[i].outline:o.lock[i].st[k].c;
  const viewLine=(kind,i,k)=>{if(kind==="o"){const L=o.lock[i];return L.outline||(cur.W.towns[i]&&cur.W.towns[i].ctrlOutline)||[]}if(kind==="s"){const L=o.lock[i];return L.st?L.st[k].c:cur.W.towns[i].ctrlStreets[k].c}return lineOf(kind,i)};
  function drawPins(fl){pins.replaceChildren();if(!cur)return;
    if(tool==="lines"&&o.vec){const mk=(kind,i)=>{const c=lineOf(kind,i);c.forEach((p,j)=>{const b=h("button",{class:"hdl "+(kind==="r"?"rv":"rd")+(sel&&sel.kind===kind&&sel.i===i&&sel.j===j?" sel":""),type:"button","aria-label":kind==="r"?"Ponto de rio":"Ponto de estrada",style:pos(cur.info.project(p[0],p[1]))});drag(b,kind,i,j);pins.append(b);
          if(j<c.length-1){const q=c[j+1],mx=Math.round((p[0]+q[0])/2),my=Math.round((p[1]+q[1])/2);pins.append(h("button",{class:"hdl mid",type:"button","aria-label":"Adicionar ponto aqui",style:pos(cur.info.project(mx,my)),onclick:()=>{snap();c.splice(j+1,0,[mx,my]);sel={kind,i,j:j+1};regen()}},"+"))}})};
      o.vec.rivers.forEach((_,i)=>mk("r",i));o.vec.roads.forEach((_,i)=>mk("d",i));return}
    if(tool==="city"||tool==="street"){
      if(cityI<0||!o.lock[cityI]){for(const [i,t] of (o.lock||[]).entries()){const p=cur.info.project(t.x,t.y);pins.append(h("button",{class:"hit pick",type:"button","aria-label":"Editar "+t.name,style:pos(p),onclick:()=>{cityI=i;sel=null;drawPins();hint.textContent="Arraste os pontos dourados para mudar o contorno e os marrons para mudar as ruas. Toque em + para criar um ponto."}},h("span",{},t.name)))}return}
      const T=cur.W.towns[cityI];if(!T)return;
      const mk=(kind,k,closed)=>{const c=viewLine(kind,cityI,k),n=c.length;c.forEach((p,j)=>{const b=h("button",{class:"hdl "+(kind==="o"?"ol":"st")+(sel&&sel.kind===kind&&sel.k===k&&sel.j===j?" sel":""),type:"button","aria-label":kind==="o"?"Ponto do contorno":"Ponto de rua",style:pos(cur.info.project(p[0],p[1]))});drag(b,kind,cityI,j,k);pins.append(b);
          if(j<n-1||closed){const q=c[(j+1)%n],mx=Math.round((p[0]+q[0])/2),my=Math.round((p[1]+q[1])/2);pins.append(h("button",{class:"hdl mid",type:"button","aria-label":"Adicionar ponto aqui",style:pos(cur.info.project(mx,my)),onclick:()=>{snap();matCity(cityI);lineOf(kind,cityI,k).splice(j+1,0,[mx,my]);sel={kind,i:cityI,j:j+1,k};regen()}},"+"))}})};
      mk("o",0,true);(o.lock[cityI].st||T.ctrlStreets).forEach((_,k)=>mk("s",k,false));return}
    for(const t of o.lock||[]){const p=cur.info.project(t.x,t.y);const b=h("button",{class:"hit",type:"button",title:t.name,"aria-label":t.name,style:pos(p),onclick:()=>openPlace({kind:"town",name:t.name})});if(fl&&norm(fl)===norm(t.name))b.classList.add("flash");pins.append(b)}
    for(const pn of o.pins){const p=cur.info.project(pn.x,pn.y);pins.append(h("button",{class:"pin",type:"button",style:pos(p),onclick:()=>openPlace({kind:"pin",id:pn.id})},h("span",{},pn.label),h("i")))}}
  function drag(b,kind,i,j,k){let st=null,moved=false;b.addEventListener("pointerdown",ev=>{ev.stopPropagation();b.setPointerCapture(ev.pointerId);st=[ev.clientX,ev.clientY];moved=false});
    b.addEventListener("pointermove",ev=>{if(!st)return;if(Math.hypot(ev.clientX-st[0],ev.clientY-st[1])>4)moved=true;if(moved){const r=mc.getBoundingClientRect();b.style.left=((ev.clientX-r.left)/r.width*100)+"%";b.style.top=((ev.clientY-r.top)/r.height*100)+"%"}});
    b.addEventListener("pointerup",ev=>{if(!st)return;st=null;sel={kind,i,j,k};if(moved){const w=world(ev);if(w){snap();if(kind==="o"||kind==="s")matCity(i);const old=lineOf(kind,i,k)[j],nw=[Math.round(w.x),Math.round(w.y)];if(kind==="s")for(const z of o.lock[i].st)for(let q=0;q<z.c.length;q++){if(Math.abs(z.c[q][0]-old[0])<1.5&&Math.abs(z.c[q][1]-old[1])<1.5)z.c[q]=nw.slice()}if(kind==="d")for(const r of o.vec.roads)for(let k=0;k<r.length;k++){if(Math.abs(r[k][0]-old[0])<1.5&&Math.abs(r[k][1]-old[1])<1.5)r[k]=nw.slice()}lineOf(kind,i,k)[j]=nw;regen();return}}drawPins()})}
  S.redrawPins=drawPins;S.regen=regen;
  function world(ev){const r=mc.getBoundingClientRect(),cx=(ev.clientX-r.left)*A.CW/r.width,cy=(ev.clientY-r.top)*A.CH/r.height,sx=Math.round(cx-A.MX),sy=Math.round(cy-A.MY);if(!cur||sx<0||sy<0||sx>=A.MW||sy>=A.MH)return null;
    return {x:sx,y:cur.info.YB[sy*A.MW+sx]||sy/A.TILT,cx,cy}}
  const drawDraft=()=>{octx.clearRect(0,0,A.CW,A.CH);if(!draft.length)return;octx.lineWidth=3;octx.strokeStyle=tool==="river"?"#3f6f8f":tool==="street"?"#c98f45":"#7a4a1c";octx.fillStyle="#f3e6c6";octx.beginPath();draft.forEach((d,i)=>i?octx.lineTo(d.cx,d.cy):octx.moveTo(d.cx,d.cy));octx.stroke();for(const d of draft){octx.beginPath();octx.arc(d.cx,d.cy,5,0,7);octx.fill();octx.stroke()}};
  const BCOL=["rgba(150,170,80,.5)","rgba(60,100,70,.5)","rgba(240,244,250,.6)","rgba(180,180,150,.5)","rgba(230,190,110,.55)","rgba(210,190,100,.5)","rgba(50,120,40,.5)","rgba(90,110,90,.55)","rgba(110,80,60,.55)"];let biomeSel=4;
  const BR={biome:"",land:"rgba(190,200,110,.45)",sea:"rgba(90,130,160,.5)",up:"rgba(230,210,150,.45)",down:"rgba(60,50,30,.45)",forest:"rgba(50,90,40,.5)",clear:"rgba(200,190,120,.45)",erase:"rgba(170,60,50,.45)"};let objSel="oak",objSize=1,objSpread=1,objRace="humano",objRot=20;
  const ptrs=new Map();let pan=null,pinch=null,stroke=null,tap=null;
  function add(w){const l=stroke[stroke.length-1];if(l&&Math.hypot(l.x-w.x,l.y-w.y)<brush*.45)return;stroke.push(tool==="biome"?{t:"biome",b:biomeSel,x:Math.round(w.x),y:Math.round(w.y),r:brush}:{t:tool,x:Math.round(w.x),y:Math.round(w.y),r:brush});octx.fillStyle=tool==="biome"?BCOL[biomeSel]:BR[tool];octx.beginPath();octx.ellipse(w.cx,w.cy,brush,brush*A.TILT,0,0,7);octx.fill()}
  function act(w){
    if(tool==="town"){snap();o.lock=(o.lock||[]).concat({x:Math.round(w.x/A.G)*A.G,y:Math.round(w.y/A.G)*A.G,size:8,kind:"village",planned:false,name:""});regen()}
    else if(tool==="untown"){let bi=-1,bd=110;(o.lock||[]).forEach((t,i)=>{const d=Math.hypot(t.x-w.x,t.y-w.y);if(d<bd){bd=d;bi=i}});if(bi<0){toast("Toque mais perto de um povoado.");return}snap();o.lock.splice(bi,1);regen()}
    else if(tool==="obj"){snap();const n=OBJTREE.has(objSel)?objSpread:1;for(let i=0;i<n;i++){const a=Math.random()*6.28,d=i?Math.sqrt(Math.random())*(14+n*3):0;o.objs.push({v:objSel,x:Math.round(w.x+Math.cos(a)*d),y:Math.round(w.y+Math.sin(a)*d*.8),s:+(objSize*(i?.85+Math.random()*.3:1)).toFixed(2)});if(isB(objSel)){const m=o.objs[o.objs.length-1];m.c=objRace;m.a=objRot}}if(OBJTERR.has(objSel))regen();else recompose()}
    else if(tool==="pin"){snap();const pn={id:uid("p"),x:w.x,y:w.y,label:"Novo local "+(o.pins.length+1)};o.pins.push(pn);Store.save("maps",o);drawPins();openPlace({kind:"pin",id:pn.id})}
    else if(tool==="road"||tool==="river"||(tool==="street"&&cityI>=0)){draft.push(w);drawDraft()}}
  view.addEventListener("pointerleave",()=>{if(tool==="obj")octx.clearRect(0,0,A.CW,A.CH)});
  view.addEventListener("pointerdown",ev=>{if(ev.target.closest("button"))return;ptrs.set(ev.pointerId,[ev.clientX,ev.clientY]);try{view.setPointerCapture(ev.pointerId)}catch(e){}
    if(ptrs.size===2){if(stroke){stroke=null;drawDraft()}tap=null;pan=null;const [a,b]=[...ptrs.values()];pinch={d:Math.hypot(a[0]-b[0],a[1]-b[1])||1,mx:(a[0]+b[0])/2,my:(a[1]+b[1])/2};return}
    if(ev.button===1){ev.preventDefault();pan=[ev.clientX,ev.clientY];view.style.cursor="grabbing";return}
    if(ev.button===2)return;
    if(tool==="move"||tool==="lines"||tool==="city"||(tool==="street"&&cityI<0)){pan=[ev.clientX,ev.clientY];return}
    if(BR[tool]!==undefined){const w=world(ev);if(w){stroke=[];add(w)}}else tap=[ev.clientX,ev.clientY]});
  view.addEventListener("pointermove",ev=>{if(tool==="obj"&&!ptrs.size&&THUMBS&&THUMBS[objSel]){const w=world(ev);octx.clearRect(0,0,A.CW,A.CH);if(w){const t=THUMBS[objSel],z=(OBJTERR.has(objSel)?(objSel==="volcano"?2.4:1.5):OBJTREE.has(objSel)?.62:isB(objSel)?.6:.55)*objSize;octx.strokeStyle="rgba(201,162,74,.95)";octx.lineWidth=1.5;octx.beginPath();octx.ellipse(w.cx,w.cy,14*Math.max(z,.6),14*Math.max(z,.6)*A.TILT,0,0,7);octx.stroke();octx.globalAlpha=.8;octx.drawImage(t,w.cx-36*z,w.cy-64*z,72*z,72*z);octx.globalAlpha=1}}
    if(!ptrs.has(ev.pointerId))return;ptrs.set(ev.pointerId,[ev.clientX,ev.clientY]);
    if(pinch&&ptrs.size>=2){const [a,b]=[...ptrs.values()],d=Math.hypot(a[0]-b[0],a[1]-b[1])||1,mx=(a[0]+b[0])/2,my=(a[1]+b[1])/2,r=view.getBoundingClientRect();Z.x+=mx-pinch.mx;Z.y+=my-pinch.my;zoomAt(mx-r.left,my-r.top,d/pinch.d);pinch={d,mx,my};return}
    if(pan){Z.x+=ev.clientX-pan[0];Z.y+=ev.clientY-pan[1];pan=[ev.clientX,ev.clientY];applyZ();return}
    if(stroke){const w=world(ev);if(w)add(w)}});
  const up=ev=>{if(!ptrs.has(ev.pointerId))return;ptrs.delete(ev.pointerId);if(ptrs.size<2)pinch=null;pan=null;view.style.cursor="";
    if(tap&&!ptrs.size){const t=tap;tap=null;if(ev.type==="pointerup"&&Math.hypot(ev.clientX-t[0],ev.clientY-t[1])<10){const w=world(ev);if(w)act(w)}}
    if(stroke&&!ptrs.size){const st=stroke;stroke=null;if(st.length){snap();if(st[0].t==="erase"){const gone=o.objs.filter(m=>st.some(e=>Math.hypot(m.x-e.x,m.y-e.y)<e.r));o.objs=o.objs.filter(m=>!gone.includes(m));o.edits=o.edits.concat(st);if(gone.some(m=>OBJTERR.has(m.v)))regen();else recompose()}else{o.edits=o.edits.concat(st);regen()}}}};
  view.addEventListener("mousedown",ev=>{if(ev.button===1)ev.preventDefault()});view.addEventListener("auxclick",ev=>ev.preventDefault());
  view.addEventListener("pointerup",up);view.addEventListener("pointercancel",up);
  view.addEventListener("wheel",ev=>{ev.preventDefault();const r=view.getBoundingClientRect();zoomAt(ev.clientX-r.left,ev.clientY-r.top,Math.exp(-ev.deltaY*.0016))},{passive:false});
  view.addEventListener("dblclick",ev=>{if(ev.target.closest("button")||tool!=="move")return;const r=view.getBoundingClientRect();zoomAt(ev.clientX-r.left,ev.clientY-r.top,1.8)});
  const removeLine=z=>{if(z.kind==="r")o.vec.rivers.splice(z.i,1);else if(z.kind==="d")o.vec.roads.splice(z.i,1);else if(z.kind==="s")o.lock[z.i].st.splice(z.k,1)};
  // cabecalho
  const title=h("input",{class:"title",type:"text",value:o.name,"aria-label":"Nome do mapa",onchange:e=>{o.name=e.target.value.trim()||"Mapa";drawSide();regen()}});
  const body=h("div",{class:"mbody"}),par=h("div",{class:"params",hidden:true});
  const bPar=h("button",{type:"button","aria-pressed":"false",onclick:()=>{par.hidden=!par.hidden;body.classList.toggle("par",!par.hidden);bPar.setAttribute("aria-pressed",String(!par.hidden));requestAnimationFrame(applyZ)}},"Parâmetros");
  let armed=false;const del=h("button",{type:"button",class:"danger ghost",onclick:()=>{if(!armed){armed=true;del.textContent="Confirmar";setTimeout(()=>{armed=false;del.textContent="Excluir"},3000);return}Store.remove("maps",o.id);S.map=null;drawAll()}},"Excluir");
  const head=h("div",{class:"mhead"},title,h("div",{class:"hact"},h("button",{type:"button",class:"primary",onclick:()=>{snap();o.params.seed=A.NAMES[(Math.random()*A.NAMES.length)|0].toLowerCase()+"-"+(1300+((Math.random()*200)|0));o.lock=null;o.vec=null;o.edits=[];fill();regen()}},"Sortear novo"),bPar,
    h("button",{type:"button",onclick:()=>mc.toBlob(b=>saveFile(safe(o.name)+".png",b))},"Salvar PNG"),del));
  // paleta de ferramentas (flutuante, por grupo)
  const pal=h("div",{class:"pal",role:"toolbar","aria-label":"Ferramentas"}),ctx=h("div",{class:"ctx"}),hint=h("div",{class:"hintc"});
  const tipFor=(l)=>l;
  TOOLGROUPS.forEach(([g,items],gi)=>{const grp=h("div",{class:"pgrp","aria-label":g});if(gi)pal.append(h("span",{class:"psep"}));
    for(const [t,l] of items){const b=h("button",{type:"button",class:"tbtn","data-t":t,"aria-label":l,title:l,onclick:()=>setTool(t)},svgI(ICON[t]),h("span",{class:"tip"},l));grp.append(b)}pal.append(grp)});
  const HINT={move:"Arraste para mover · roda do mouse ou dois dedos para aproximar · toque num povoado para abrir a nota",lines:"Arraste um ponto para mudar o traçado · toque em + para criar um ponto",road:"Toque no mapa para marcar os pontos da estrada",river:"Toque no mapa da nascente à foz",town:"Toque onde quer o novo povoado",untown:"Toque no povoado que quer remover",pin:"Toque onde quer o pino",obj:"Toque no mapa para colocar o objeto escolhido",erase:"Pinte por cima do que quer apagar",biome:"Pinte para transformar a área no bioma escolhido",city:"Toque no nome de um povoado para editar contorno e ruas",street:"Escolha o povoado e marque os pontos da rua"};
  const brushSl=()=>h("label",{class:"cf"},"Pincel",h("input",{type:"range",min:20,max:140,value:brush,"aria-label":"Tamanho do pincel",oninput:e=>brush=+e.target.value}));
  const B_=(label,fn,cls)=>h("button",{type:"button",class:cls||"",onclick:fn},label);
  const finish=()=>{if(draft.length<2){toast("Marque pelo menos dois pontos no mapa.");return}snap();o.vec=o.vec||{rivers:[],roads:[]};const c=draft.map(d=>[Math.round(d.x),Math.round(d.y)]);if(tool==="street"){const L=matCity(cityI);if(!L){toast("Escolha um povoado primeiro.");return}L.st.push({c,m:0})}else if(tool==="river")o.vec.rivers.push({c,w:10});else o.vec.roads.push(c);draft=[];regen()};
  const rmPoint=()=>{if(!sel){toast("Toque num ponto primeiro.");return}snap();if(sel.kind==="o"||sel.kind==="s")matCity(sel.i);const c=lineOf(sel.kind,sel.i,sel.k),min=sel.kind==="o"?4:3;if(c.length<min){if(sel.kind==="o"){toast("O contorno precisa de pelo menos 3 pontos.");undo.pop();return}removeLine(sel)}else c.splice(sel.j,1);sel=null;regen()};
  const rmLine=()=>{if(!sel){toast("Toque num ponto da linha primeiro.");return}if(sel.kind==="o"){toast("O contorno não pode ser removido. Use Restaurar cidade.");return}snap();if(sel.kind==="s")matCity(sel.i);removeLine(sel);sel=null;regen()};
  const restore=()=>{if(cityI<0||!o.lock[cityI]){toast("Escolha um povoado primeiro.");return}snap();delete o.lock[cityI].outline;delete o.lock[cityI].st;sel=null;regen()};
  const clearBr=()=>{if(!o.edits.length){toast("Este mapa não tem pinceladas.");return}snap();o.edits=[];regen()};
  function drawCtx(){ctx.replaceChildren();const name=(TOOLGROUPS.flatMap(g=>g[1]).find(x=>x[0]===tool)||["",""])[1];ctx.append(h("strong",{class:"cname"},name));
    if(BR[tool]!==undefined){if(tool==="biome")ctx.append(h("label",{class:"cf"},"Tipo",h("select",{"aria-label":"Bioma do pincel",onchange:e=>biomeSel=+e.target.value},A.BIOMES.map((n,i)=>h("option",{value:i,selected:i===biomeSel},n)))));ctx.append(brushSl(),B_("Limpar pinceladas",clearBr,"ghost"))}
    if(tool==="obj"){if(!THUMBS||thumbRace!==objRace){const st=A.makeStamps(A.mulberry(12345));THUMBS={};thumbRace=objRace;for(const [,it] of OBJCAT)for(const [v] of it)THUMBS[v]=A.objThumb(v,st,72,objRace)}
      const gi=Math.max(0,OBJCAT.findIndex(g=>g[1].some(x=>x[0]===objSel)));
      ctx.append(h("span",{class:"cf"},objName(objSel)+(OBJTERR.has(objSel)?" · muda o relevo, refaz o mapa":"")),h("label",{class:"cf"},"Tamanho",h("input",{type:"range",min:.5,max:2,step:.1,value:objSize,"aria-label":"Tamanho do objeto",oninput:e=>objSize=+e.target.value})));
      if(OBJTREE.has(objSel))ctx.append(h("label",{class:"cf"},"Por toque",h("input",{type:"range",min:1,max:12,step:1,value:objSpread,"aria-label":"Árvores por toque",oninput:e=>objSpread=+e.target.value})));
      if(isB(objSel))ctx.append(h("label",{class:"cf"},"Cultura",h("select",{"aria-label":"Cultura da construção",onchange:e=>{objRace=e.target.value;drawCtx()}},A.RACES.map(r=>h("option",{value:r,selected:r===objRace},A.RACE_PT[r])))),h("label",{class:"cf"},"Giro",h("input",{type:"range",min:0,max:355,step:5,value:objRot,"aria-label":"Giro da construção",oninput:e=>objRot=+e.target.value})));
      ctx.append(B_("Tirar todos os colocados",()=>{if(!o.objs.length){toast("Nenhum objeto colocado.");return}snap();const t=o.objs.some(m=>OBJTERR.has(m.v));o.objs=[];t?regen():recompose()},"ghost"));
      const tabs=h("div",{class:"otabs",role:"tablist"},OBJCAT.map(([g],k)=>h("button",{type:"button",role:"tab","aria-selected":k===gi?"true":"false",class:k===gi?"on":"",onclick:()=>{objSel=OBJCAT[k][1][0][0];drawCtx()}},g)));
      const grid=h("div",{class:"ogrid"},OBJCAT[gi][1].map(([v,n])=>{const b=h("button",{type:"button",class:"ocell"+(v===objSel?" on":""),title:n,"aria-label":n,"aria-pressed":v===objSel?"true":"false",onclick:()=>{objSel=v;drawCtx()}});const cv=document.createElement("canvas");cv.width=cv.height=72;cv.getContext("2d").drawImage(THUMBS[v],0,0);b.append(cv,h("span",{},n));return b}));
      ctx.append(h("div",{class:"obox"},tabs,grid))}
    else if(tool==="road"||tool==="river"||tool==="street")ctx.append(B_("Concluir linha",finish,"primary"),B_("Cancelar",()=>{draft=[];drawDraft()},"ghost"));
    else if(tool==="lines")ctx.append(B_("Remover ponto",rmPoint),B_("Remover linha",rmLine));
    else if(tool==="city")ctx.append(B_("Remover ponto",rmPoint),B_("Remover rua",rmLine),B_("Restaurar cidade",restore,"ghost"));
    ctx.hidden=tool==="move";hint.textContent=HINT[tool]||"Pinte arrastando sobre o mapa"}
  const setTool=t=>{if(!(t==="city"||t==="street")||!(tool==="city"||tool==="street"))cityI=-1;tool=t;draft=[];sel=null;drawDraft();stage.classList.toggle("draw",!["move","lines","city"].includes(t));view.classList.toggle("grab",["move","lines","city"].includes(t));for(const b of pal.querySelectorAll("button[data-t]"))b.setAttribute("aria-pressed",String(b.dataset.t===t));drawCtx();drawPins()};
  const undoB=h("button",{type:"button",class:"icb",title:"Desfazer","aria-label":"Desfazer",onclick:()=>{const u=undo.pop();if(!u){toast("Nada para desfazer.");return}const nu=JSON.parse(u),J=JSON.stringify,ne=a=>J((a||[]).filter(e=>e.t!=="erase")),te=a=>J((a||[]).filter(m=>OBJTERR.has(m.v)));const fast=cur&&J(nu.params)===J(o.params)&&J(nu.lock)===J(o.lock)&&J(nu.vec||null)===J(o.vec||null)&&ne(nu.edits)===ne(o.edits)&&te(nu.objs)===te(o.objs);Object.assign(o,nu);sel=null;fill();fast?(drawPins(),recompose()):regen()}},svgI("M9 14L4 9l5-5M4 9h10a6 6 0 0 1 0 12h-3"));
  const zbox=h("div",{class:"zbox"},undoB,h("span",{class:"zsep"}),h("button",{type:"button",class:"icb","aria-label":"Afastar",title:"Afastar",onclick:()=>zoomMid(1/1.5)},svgI("M5 12h14")),zl,h("button",{type:"button",class:"icb","aria-label":"Aproximar",title:"Aproximar",onclick:()=>zoomMid(1.5)},svgI("M5 12h14M12 5v14")),h("button",{type:"button",class:"icb","aria-label":"Ajustar à tela",title:"Ajustar à tela",onclick:()=>{Z.k=1;Z.x=Z.y=0;applyZ()}},svgI("M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5")));
  // parametros
  function fill(){par.replaceChildren(h("h2",{},"Parâmetros"));
    for(const [k,label,kind,a,b] of PARAMS){const id="p_"+k;let inp,val=h("span",{});
      const ch=v=>{snap();o.params[k]=v;if(STRUCT.has(k)){o.lock=null;o.vec=null}if(k==="form")o.edits=[];regen()};
      if(kind==="select"){inp=h("select",{id,onchange:e=>ch(typeof a[0][0]==="number"?+e.target.value:e.target.value)},a.map(([v,t])=>h("option",{value:v},t)));inp.value=String(o.params[k])}
      else if(kind==="text")inp=h("input",{id,type:"text",value:o.params[k],autocomplete:"off",onchange:e=>ch(e.target.value.trim()||"atlas")});
      else if(kind==="pct"){inp=h("input",{id,type:"range",min:0,max:100,value:Math.round(o.params[k]*100),oninput:e=>val.textContent=e.target.value+"%",onchange:e=>ch(e.target.value/100)});val.textContent=Math.round(o.params[k]*100)+"%"}
      else{inp=h("input",{id,type:"range",min:a,max:b,value:o.params[k],oninput:e=>val.textContent=e.target.value,onchange:e=>ch(+e.target.value)});val.textContent=o.params[k]}
      par.append(h("div",{class:"fld"},h("label",{for:id},label,val),inp))}}
  fill();body.append(h("div",{class:"mwrap"},view,busy,pal,ctx,zbox,hint),par);
  main.append(h("div",{class:"mapv"},head,body,status));setTool("move");fitWrap();applyZ();
  busy.hidden=false;setTimeout(()=>{regen();if(flash)setTimeout(()=>drawPins(flash),500)},20)}

// ---------- painel do lugar ----------
function closePlace(){S.place=null;$("#insp").hidden=true;$("#app").classList.remove("with-insp")}
function openPlace(pl){S.place=pl;S.placeEdit=false;$("#insp").hidden=false;$("#app").classList.add("with-insp");drawPlace()}
function drawPlace(){const box=$("#insp"),o=S.maps.get(S.map),pl=S.place;if(!o||!pl){closePlace();return}box.replaceChildren();
  const town=pl.kind==="town"?(o.lock||[]).find(t=>t.name===pl.name):null,pin=pl.kind==="pin"?o.pins.find(p=>p.id===pl.id):null;if(!town&&!pin){closePlace();return}
  const name=town?town.name:pin.label,note=findNote(name);
  const nm=h("input",{class:"title",type:"text",value:name,"aria-label":"Nome do lugar",style:"font-size:24px",onchange:e=>{const v=e.target.value.trim();if(!v||v===name){e.target.value=name;return}
    if(town&&o.lock.some(t=>t!==town&&t.name===v)){toast("Já existe um povoado com esse nome.");e.target.value=name;return}
    if(note&&!findNote(v)){note.title=v;Store.save("notes",note)}
    if(town){town.name=v;S.place={kind:"town",name:v};Store.save("maps",o);S.regen&&S.regen()}else{pin.label=v;Store.save("maps",o);S.redrawPins&&S.redrawPins()}drawSide();drawPlace()}});
  const kindTxt=town?({city:"Cidade murada",town:"Vila",village:"Aldeia",camp:"Acampamento militar"}[town.kind]||"Povoado"):"Pino";
  const acts=h("div",{class:"row"});
  if(note){acts.append(h("button",{type:"button",class:"primary",onclick:()=>{S.placeEdit=!S.placeEdit;drawPlace()}},S.placeEdit?"Ler":"Editar aqui"),h("button",{type:"button",onclick:()=>openNote(note.id)},"Abrir nota"))}
  else acts.append(h("button",{type:"button",class:"primary",onclick:()=>{newNote("local",name,{content:"---\ntipo: local\nmapa: "+o.name+"\npino: "+name+"\n---\n\n## Descrição\n\n\n## Quem vive aqui\n\n\n## Ganchos\n\n- [ ] \n"});S.placeEdit=true;drawSide();drawPlace()}},"Criar nota deste lugar"));
  if(town&&town.kind!=="camp"&&window.AtlasCity){const ex=[...S.maps.values()].find(m=>m.type==="city"&&m.src&&m.src.map===o.id&&m.src.town===town.name);acts.append(h("button",{type:"button",onclick:()=>{openMap(ex?ex.id:newCityFrom(o,town).id)}},ex?"Abrir mapa da cidade":"Criar mapa da cidade"))}
  if(pin)acts.append(h("button",{type:"button",class:"danger",onclick:()=>{o.pins=o.pins.filter(p=>p!==pin);Store.save("maps",o);S.redrawPins&&S.redrawPins();closePlace()}},"Remover pino"));
  box.append(h("div",{class:"row"},h("h2",{},kindTxt),h("span",{class:"grow"}),h("button",{type:"button",onclick:closePlace},"Fechar")),nm,acts);
  if(town){const set=(k,v)=>{S.snap&&S.snap();town[k]=v;if(k==="kind"){town.size={village:8,town:14,city:30,camp:16}[v];town.wall=v==="city"||v==="camp"}if(k==="race"&&(v==="halfling"))town.wall=false;Store.save("maps",o);S.regen&&S.regen()};
    const rng=(label,k,min,max,val,fmt,conv)=>{const sp=h("span",{},fmt(val)),id="t_"+k;return h("div",{class:"fld"},h("label",{for:id},label,sp),h("input",{id,type:"range",min,max,value:val,oninput:e=>sp.textContent=fmt(+e.target.value),onchange:e=>set(k,conv(+e.target.value))}))};
    const rc=h("select",{id:"t_race",onchange:e=>set("race",e.target.value)},A.RACES.map(r=>h("option",{value:r},A.RACE_PT[r])));rc.value=town.race||"humano";
    const kd=h("select",{id:"t_kind",onchange:e=>set("kind",e.target.value)},[["village","Aldeia"],["town","Vila"],["city","Cidade"],["camp","Acampamento militar"]].map(([v,t])=>h("option",{value:v},t)));kd.value=town.kind;
    const pl=h("select",{id:"t_plan",onchange:e=>set("planned",e.target.value==="1")},h("option",{value:"0"},"Orgânico"),h("option",{value:"1"},"Planejado"));pl.value=town.planned?"1":"0";
    const wl=h("select",{id:"t_wall",onchange:e=>set("wall",e.target.value==="1")},h("option",{value:"0"},"Sem muralha"),h("option",{value:"1"},"Com muralha"));wl.value=town.wall?"1":"0";
    box.append(h("div",{class:"params"},h("div",{class:"fld"},h("label",{for:"t_race"},"Cultura"),rc),h("div",{class:"fld"},h("label",{for:"t_kind"},"Tipo"),kd),rng("Tamanho","size",4,46,town.size,v=>String(v),v=>v),rng("Densidade de construções","dens",0,100,Math.round((town.dens==null?.6:town.dens)*100),v=>v+"%",v=>v/100),
      h("div",{class:"fld"},h("label",{for:"t_plan"},"Traçado das ruas"),pl),h("div",{class:"fld"},h("label",{for:"t_wall"},"Muralha"),wl)))}
  if(note){if(S.placeEdit){const ta=h("textarea",{"aria-label":"Conteúdo da nota"});ta.value=note.content||"";ta.addEventListener("input",()=>{note.content=ta.value;Store.save("notes",note)});box.append(ta)}else box.append(mdView(note.content))}
  else box.append(h("p",{class:"empty"},"Este lugar ainda não tem nota."))}

// ---------- lista lateral ----------
function drawSide(){const side=$("#side");side.replaceChildren();for(const b of document.querySelectorAll(".rail button"))b.classList.toggle("on",b.dataset.sec===S.sec);
  if(S.sec==="notes"){const sel=h("select",{"aria-label":"Criar nota",onchange:e=>{const t=e.target.value;if(!t)return;const o=newNote(t,t==="livre"?"":TYPES[t]);openNote(o.id,"edit")}},h("option",{value:""},"+ Nova nota…"),Object.entries(TYPES).map(([k,v])=>h("option",{value:k},v)));
    const q=h("input",{type:"search",placeholder:"Buscar",value:S.q,"aria-label":"Buscar notas",oninput:e=>{S.q=e.target.value;drawList()}}),list=h("div",{class:"list"});
    const drawList=()=>{list.replaceChildren();const qq=norm(S.q),all=[...S.notes.values()].filter(n=>!qq||norm(n.title).includes(qq)||norm(n.content).includes(qq)).sort((a,b)=>(a.folder||"").localeCompare(b.folder||"")||a.title.localeCompare(b.title));
      if(!all.length){list.append(h("p",{class:"empty"},qq?"Nada encontrado.":"Nenhuma nota ainda."));return}let g=null;
      for(const n of all){if((n.folder||"")!==g){g=n.folder||"";list.append(h("div",{class:"grp"},g||"Sem pasta"))}list.append(h("button",{class:"item"+(n.id===S.note?" on":""),type:"button",onclick:()=>openNote(n.id)},n.title))}};
    side.append(h("h2",{},"Notas"),sel,q,list);drawList()}
  else{const list=h("div",{class:"list"}),all=[...S.maps.values()].sort((a,b)=>a.name.localeCompare(b.name));
    if(!all.length)list.append(h("p",{class:"empty"},"Nenhum mapa ainda."));
    for(const m of all)list.append(h("button",{class:"item"+(m.id===S.map?" on":""),type:"button",onclick:()=>openMap(m.id)},m.name,h("small",{},m.type==="city"?"cidade":(m.lock||[]).length?(m.lock.length+" povoados"):"")));
    side.append(h("h2",{},"Mapas"),h("button",{type:"button",class:"primary",onclick:()=>openMap(newMap().id)},"+ Novo mapa de região"),h("button",{type:"button",onclick:()=>openMap(newCity().id)},"+ Novo mapa de cidade"),list)}}
function drawWelcome(){const main=$("#main");main.replaceChildren();const empty=!S.notes.size&&!S.maps.size;
  main.append(h("div",{class:"welcome"},h("h1",{},empty?"Seu mundo começa aqui":S.sec==="notes"?"Escolha uma nota":"Escolha um mapa"),
    h("p",{},empty?"O Atlas junta notas ligadas entre si e mapas gerados e editáveis. Cada povoado do mapa pode ter a sua nota.":"Abra um item na lista ou crie um novo."),
    h("div",{class:"row"},h("button",{type:"button",class:"primary",onclick:()=>openMap(newMap().id)},"Novo mapa"),h("button",{type:"button",onclick:()=>openNote(newNote("livre","").id,"edit")},"Nova nota"),
      empty&&h("button",{type:"button",onclick:sample},"Criar mundo de exemplo"))))}
function sample(){const m=newMap();m.name="Vale do Sasau";m.params=Object.assign({},DEF);Store.save("maps",m);
  newNote("livre","Bem-vindo ao Atlas",{content:"# Bem-vindo ao Atlas\n\nEste vault de exemplo mostra o básico.\n\n- Abra **Mapas** e toque num povoado para criar a nota dele.\n- Em qualquer nota, escreva `[[Nome]]` para ligar a outra. Exemplo: [[Irmã Ludmila]].\n- No mapa, use as ferramentas para pintar terra, mar, relevo e floresta.\n"});
  const n=newNote("personagem","Irmã Ludmila",{content:"---\ntipo: personagem\nlocal: \n---\n\n## Aparência\n\nHábito gasto, mãos manchadas de tinta.\n\n## O que quer\n\nTerminar a crônica do mosteiro antes do inverno.\n\n## O que esconde\n\n> [!info] Só para o mestre\n> Ela sabe quem incendiou o celeiro.\n"});n.folder="Personagens";Store.save("notes",n);
  S.sec="notes";drawAll();toast("Mundo de exemplo criado.")}
function drawMain(flash){if(S.sec==="notes")drawNote();else drawMap(flash)}
function drawAll(flash){drawSide();drawMain(flash)}

// ---------- exportar e importar ----------
const safe=s=>String(s||"sem-nome").replace(/[\\/:*?"<>|]+/g,"-").trim()||"sem-nome";
function crc32(u){let crc=-1;for(let i=0;i<u.length;i++){let c=(crc^u[i])&255;for(let k=0;k<8;k++)c=c&1?(c>>>1)^0xEDB88320:c>>>1;crc=(crc>>>8)^c}return(crc^-1)>>>0}
function zip(files){const enc=new TextEncoder(),parts=[],cd=[];let off=0;
  for(const f of files){const n=enc.encode(f.name),d=enc.encode(f.data),crc=crc32(d),hd=new DataView(new ArrayBuffer(30)),c=new DataView(new ArrayBuffer(46));
    hd.setUint32(0,0x04034b50,true);hd.setUint16(4,20,true);hd.setUint16(6,0x0800,true);hd.setUint16(12,0x21,true);hd.setUint32(14,crc,true);hd.setUint32(18,d.length,true);hd.setUint32(22,d.length,true);hd.setUint16(26,n.length,true);
    c.setUint32(0,0x02014b50,true);c.setUint16(4,20,true);c.setUint16(6,20,true);c.setUint16(8,0x0800,true);c.setUint16(14,0x21,true);c.setUint32(16,crc,true);c.setUint32(20,d.length,true);c.setUint32(24,d.length,true);c.setUint16(28,n.length,true);c.setUint32(42,off,true);
    parts.push(new Uint8Array(hd.buffer),n,d);cd.push(new Uint8Array(c.buffer),n);off+=30+n.length+d.length}
  const cds=cd.reduce((a,b)=>a+b.length,0),e=new DataView(new ArrayBuffer(22));e.setUint32(0,0x06054b50,true);e.setUint16(8,files.length,true);e.setUint16(10,files.length,true);e.setUint32(12,cds,true);e.setUint32(16,off,true);
  return new Blob([...parts,...cd,new Uint8Array(e.buffer)])}
async function saveFile(name,blob){if(!blob){toast("Nada para salvar.");return}
  if(Store.dl){try{await Store.dl.save({filename:name,data:blob});toast("Arquivo salvo.")}catch(e){if(!e||e.code!=="declined")toast("Não foi possível salvar o arquivo aqui.")}return}
  try{const a=h("a",{href:URL.createObjectURL(blob),download:name});document.body.append(a);a.click();a.remove()}catch(e){toast("Este navegador não permitiu salvar o arquivo.")}}
function exportVault(){const files=[],used=new Set();const put=(name,data)=>{let n=name,k=2;while(used.has(n.toLowerCase()))n=name.replace(/(\.[^.]+(\.json)?)$/," "+(k++)+"$1");used.add(n.toLowerCase());files.push({name:n,data})};
  for(const n of S.notes.values())put((n.folder?n.folder.split("/").map(safe).join("/")+"/":"")+safe(n.title)+".md",n.content||"");
  for(const m of S.maps.values())put("mapas/"+safe(m.name)+".map.json",JSON.stringify({name:m.name,params:m.params,edits:m.edits||[],towns:m.lock||[],pins:m.pins||[]},null,2));
  if(!files.length){toast("O vault está vazio.");return}saveFile("atlas-vault.zip",zip(files))}
async function importFiles(list){let n=0;for(const f of list){try{const txt=await f.text(),title=f.name.replace(/\.(md|markdown|txt)$/i,"");const o=newNote("livre",title,{content:txt.replace(/\r/g,"")});o.folder="Importadas";Store.save("notes",o);n++}catch(e){}}
  S.sec="notes";drawAll();toast(n?n+" nota(s) importada(s).":"Nenhum arquivo pôde ser lido.")}

// ---------- inicio ----------
let booted=false;
function ready(){if(booted)return;booted=true;if(S.maps.size&&!S.notes.size)S.sec="maps";drawAll()}
for(const b of document.querySelectorAll(".rail button"))b.addEventListener("click",()=>{S.sec=b.dataset.sec;closePlace();drawAll();if(matchMedia("(max-width:860px)").matches&&!(S.sec==="notes"?S.note:S.map))$("#side").classList.add("open")});
$("#menu").addEventListener("click",()=>$("#side").classList.toggle("open"));
$("#bExp").addEventListener("click",exportVault);
$("#imp").addEventListener("change",e=>{importFiles([...e.target.files]);e.target.value=""});
$("#main").addEventListener("pointerdown",()=>$("#side").classList.remove("open"));
drawSide();$("#main").append(h("div",{class:"welcome"},h("h1",{},"Abrindo o vault…")));
Store.init();
window.AtlasApp={S,Store};
})();
