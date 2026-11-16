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
const TYPES={livre:"Nota livre",local:"Local",personagem:"Personagem",faccao:"Facção",item:"Item",missao:"Missão",sessao:"Sessão"};
const TPL={
  livre:"",
  local:"---\ntipo: local\n---\n\n## Descrição\n\n\n## Quem vive aqui\n\n\n## Ganchos\n\n- [ ] \n\n> [!segredo] Só para o mestre\n> \n",
  personagem:"---\ntipo: personagem\n---\n\n## Aparência\n\n\n## O que quer\n\n\n## O que esconde\n\n\n## Ligações\n\n",
  faccao:"---\ntipo: faccao\n---\n\n## Objetivo\n\n\n## Membros\n\n\n## Recursos\n\n\n## Inimigos e aliados\n\n",
  item:"---\ntipo: item\n---\n\n## Descrição\n\n\n## Efeito\n\n\n## História\n\n",
  missao:"---\ntipo: missao\nstatus: aberta\n---\n\n## Objetivo\n\n\n## Etapas\n\n- [ ] \n\n## Complicações\n\n\n> [!segredo] O que realmente está acontecendo\n> \n",
  sessao:"---\ntipo: sessao\n---\n\n## Onde paramos\n\n\n## Cenas previstas\n\n- [ ] \n\n## NPCs em jogo\n\n\n## Anotações\n\n"};
const FIELDS={personagem:[["raca","Raça"],["papel","Papel"],["faccao","Facção","link"],["local","Onde vive","link"],["situacao","Situação","sel",["","vivo","morto","desaparecido","desconhecido"]],["data","Data"]],
  local:[["categoria","Tipo"],["populacao","População"],["governante","Quem governa","link"],["cultura","Cultura"],["regiao","Fica em","link"],["data","Fundação"]],
  faccao:[["lider","Líder","link"],["sede","Sede","link"],["aliados","Aliados","links"],["inimigos","Inimigos","links"],["data","Fundação"]],
  item:[["dono","Dono","link"],["onde","Onde está","link"],["data","Data"]],missao:[["status","Situação","sel",[["aberta","Aberta"],["andamento","Em andamento"],["concluida","Concluída"],["falhou","Falhou"]]],["local","Onde acontece","links"],["contratante","Quem dá","link"],["recompensa","Recompensa"],["requer","Depende de","links"],["libera","Leva a","links"],["data","Data"]],sessao:[["data","Data"],["jogadores","Quem jogou"],["lugares","Lugares visitados","links"]],livre:[["data","Data"]]};
const TCOL={missao:"#d9a441",livre:"#9a8f7a",local:"#5f8a4a",personagem:"#b5473a",faccao:"#8a4a7a",item:"#c9a24a",sessao:"#3f6f8f"};
function setProps(o,ch){const {props,body}=fm(o.content);Object.assign(props,ch);for(const k in props)if(props[k]==null||props[k]==="")delete props[k];const ks=Object.keys(props).sort((a,b)=>(a==="tipo"?-1:b==="tipo"?1:0));
  o.content=(ks.length?"---\n"+ks.map(k=>k+": "+props[k]).join("\n")+"\n---\n\n":"")+body.replace(/^\n+/,"");o.updated=now();Store.save("notes",o)}
const splitL=v=>String(v||"").split(/\s*[,;]\s*/).map(x=>x.replace(/^\[\[|\]\]$/g,"").trim()).filter(Boolean);
function shrinkImg(file,max){return new Promise((res,rej)=>{const fr=new FileReader();fr.onload=()=>{const im=new Image();im.onload=()=>{const k=Math.min(1,max/Math.max(im.width,im.height)),cv=document.createElement("canvas");cv.width=Math.round(im.width*k);cv.height=Math.round(im.height*k);cv.getContext("2d").drawImage(im,0,0,cv.width,cv.height);res(cv.toDataURL("image/jpeg",.84))};im.onerror=rej;im.src=fr.result};fr.onerror=rej;fr.readAsDataURL(file)})}
const FOLD={local:"Locais",personagem:"Personagens",faccao:"Facções",item:"Itens",missao:"Missões",sessao:"Sessões",livre:""};
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
TOOLGROUPS.push(["Mundo",[["border","Fronteiras"]]]);
const ICON={border:"M4 7l5-3 6 3 5-2v13l-5 2-6-3-5 3z",move:"M12 3v18M3 12h18M12 3l-3 3M12 3l3 3M12 21l-3-3M12 21l3-3M3 12l3-3M3 12l3 3M21 12l-3-3M21 12l-3 3",land:"M3 18c2-5 5-8 9-8s7 3 9 8M3 18h18",sea:"M3 9c2-2 4-2 6 0s4 2 6 0 4-2 6 0M3 15c2-2 4-2 6 0s4 2 6 0 4-2 6 0",
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
  t=t.replace(/!\[\[img:([\w-]+)\]\]/g,(_,id)=>{const u=CURIMG&&CURIMG[id];return u?'<img class="nimg" src="'+u+'" alt="">':""});t=t.replace(/%%([^%]+)%%/g,(_,x)=>S.players?"":'<span class="secret" title="Segredo do mestre">'+x+"</span>");
  t=t.replace(/!?\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g,(_,a,b)=>{const tt=a.trim(),raw=tt.replace(/&amp;/g,"&");return '<a class="wl'+(findNote(raw)?"":findPlace(raw)?" place":" miss")+'" data-t="'+tt+'">'+(b||tt)+"</a>"});
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
      const sec=c&&/^(segredo|secret|mestre)$/i.test(c[1]);if(sec&&S.players)continue;if(sec&&MDMODE==="foundry"){o.push('<section class="secret" id="secret-'+Math.random().toString(36).slice(2,12)+'"><p><strong>'+inline(c[2]||"Segredo do mestre")+"</strong></p>"+md(b.slice(1).join("\n"))+"</section>");continue}o.push(c?'<div class="callout'+(sec?' secret-box':'')+'"><div class="ct">'+inline(c[2]||(sec?"Segredo do mestre":c[1]))+"</div>"+md(b.slice(1).join("\n"))+"</div>":"<blockquote>"+md(b.join("\n"))+"</blockquote>");continue}
    if(li.test(l)){flush();const ord=/^\s*\d+\./.test(l),b=[];while(i<L.length&&li.test(L[i])){const t=L[i++].replace(li,""),ck=/^\[( |x|X)\]\s*(.*)/.exec(t);
        b.push(ck?'<li class="task"><input type="checkbox" disabled'+(ck[1]!==" "?" checked":"")+"> "+inline(ck[2])+"</li>":"<li>"+inline(t)+"</li>")}
      o.push((ord?"<ol>":"<ul>")+b.join("")+(ord?"</ol>":"</ul>"));continue}
    if(/^\|.*\|\s*$/.test(l)&&i+1<L.length&&/^\|[\s:|-]+\|\s*$/.test(L[i+1])){flush();const row=s=>s.trim().replace(/^\||\|$/g,"").split("|").map(c=>inline(c.trim()));const hd=row(l);i+=2;const rows=[];while(i<L.length&&/^\|.*\|\s*$/.test(L[i]))rows.push(row(L[i++]));
      o.push('<div class="tw"><table><thead><tr>'+hd.map(c=>"<th>"+c+"</th>").join("")+"</tr></thead><tbody>"+rows.map(r=>"<tr>"+r.map(c=>"<td>"+c+"</td>").join("")+"</tr>").join("")+"</tbody></table></div>");continue}
    if(!l.trim()){flush();i++;continue}
    para.push(l);i++}
  flush();return o.join("\n")}
let CURIMG=null,MDMODE="";
function mdView(src,note){CURIMG=note&&note.images||null;const d=h("div",{class:"md",html:md(fm(src).body)});CURIMG=null;d.addEventListener("click",e=>{const a=e.target.closest("a.wl");if(a){e.preventDefault();openTitle(a.dataset.t)}});
  d.addEventListener("mouseover",e=>{const a=e.target.closest("a.wl");if(a)hoverCard(a,a.dataset.t)});d.addEventListener("mouseout",e=>{if(e.target.closest("a.wl"))hoverCard(null)});return d}
function hoverCard(a,t){let c=$("#hov");if(!a){if(c)c.hidden=true;return}if(!c){c=h("div",{id:"hov",class:"hov",role:"tooltip"});document.body.append(c)}const raw=String(t).replace(/&amp;/g,"&"),n=findNote(raw),pl=!n&&findPlace(raw);c.replaceChildren();
  if(n){const {props,body}=fm(n.content),ty=TYPES[props.tipo]||"Nota";if(n.img)c.append(h("img",{src:n.img,alt:""}));c.append(h("b",{},n.title),h("small",{},ty+(props.papel?" · "+props.papel:"")+(props.categoria?" · "+props.categoria:"")),h("p",{},body.replace(/!\[\[img:[\w-]+\]\]/g,"").replace(/%%[^%]*%%/g,"").replace(/[#>*_`\[\]|-]/g," ").replace(/\s+/g," ").trim().slice(0,220)||"Sem texto ainda."))}
  else if(pl)c.append(h("b",{},pl.name),h("small",{},"Lugar no mapa "+pl.map.name),h("p",{},"Clique para abrir o mapa nesse ponto."));else c.append(h("b",{},raw),h("small",{},"Nota ainda não existe"),h("p",{},"Clique para criar."));
  const r=a.getBoundingClientRect();c.hidden=false;c.style.left=Math.min(innerWidth-300,r.left)+"px";c.style.top=(r.bottom+8+(r.bottom>innerHeight-200?-r.height-180:0))+"px"}
// lugares dos mapas (bairros, construcoes, ruas) para os links [[...]]
function findPlace(t){const n=norm(t);if(!n)return null;const ms=[...S.maps.values()].sort((a,b)=>(b.type==="city")-(a.type==="city"));for(const m of ms){if(norm(m.name)===n||(m.type==="city"&&norm(m.name.replace(/^Cidade de /i,""))===n))return {map:m,name:m.name};for(const pl of m.places||[])if(norm(pl.name)===n)return {map:m,name:pl.name,x:pl.x,y:pl.y}}
  for(const m of ms){for(const tw of m.lock||[])if(norm(tw.name)===n)return {map:m,name:tw.name};for(const pn of m.pins||[])if(norm(pn.label)===n)return {map:m,name:pn.label}}return null}
// ---------- notas ----------
function newNote(type,title,extra){const id=uid("n");let t=title||"Sem título",k=2;while(findNote(t))t=(title||"Sem título")+" "+(k++);
  const o={id,title:t,folder:FOLD[type]||"",content:(extra&&extra.content)!=null?extra.content:TPL[type]||"",updated:now()};S.notes.set(id,o);Store.save("notes",o);return o}
function openNote(id,mode){S.sec="notes";S.view=null;S.note=id;const o=S.notes.get(id);S.mode=mode||(o&&fm(o.content).body.trim()?"read":"edit");closePlace();drawAll();$("#side").classList.remove("open")}
function openTitle(t){const o=findNote(t);if(o)return openNote(o.id);const pl=findPlace(t);if(pl)return openMap(pl.map.id,pl.x!=null?{x:pl.x,y:pl.y,name:pl.name}:null);openNote(newNote("livre",t).id,"edit")}
function linksOf(n){const out=new Set(),re=/\[\[([^\]|]+)(?:\|[^\]]+)?\]\]/g;let m;const src=n.content||"";while((m=re.exec(src)))if(!/^img:/.test(m[1]))out.add(norm(m[1]));const {props}=fm(src),ty=props.tipo||"livre";for(const [k,,kind] of FIELDS[ty]||[])if(kind==="link"||kind==="links")for(const x of splitL(props[k]))out.add(norm(x));return out}
function backlinks(o){const t=norm(o.title),out=[];if(!t)return out;for(const n of S.notes.values()){if(n.id!==o.id&&linksOf(n).has(t))out.push(n)}return out}
function drawNote(){const o=S.notes.get(S.note),main=$("#main");main.replaceChildren();if(!o)return drawWelcome();
  const {props}=fm(o.content),type=props.tipo&&TYPES[props.tipo]?props.tipo:"livre";
  const title=h("input",{class:"title",type:"text",value:o.title,"aria-label":"Título da nota",onchange:e=>{const v=e.target.value.trim()||"Sem título",ex=findNote(v);if(ex&&ex.id!==o.id){toast("Já existe uma nota com esse título.");e.target.value=o.title;return}const old=o.title;o.title=v;Store.save("notes",o);renameLinks(old,v);drawSide()}});
  const typeSel=h("select",{class:"tsel","aria-label":"Tipo da nota",onchange:e=>{setProps(o,{tipo:e.target.value==="livre"?"":e.target.value});if(!o.folder||Object.values(FOLD).includes(o.folder)){o.folder=FOLD[e.target.value]||"";Store.save("notes",o)}drawNote();drawSide()}},Object.entries(TYPES).map(([k,v])=>h("option",{value:k,selected:k===type},v)));typeSel.style.borderColor=TCOL[type];
  const folder=h("input",{type:"text",value:o.folder||"",placeholder:"Pasta","aria-label":"Pasta",list:"dl-fold",onchange:e=>{o.folder=e.target.value.trim();Store.save("notes",o);drawSide()}});
  let armed=false;const del=h("button",{type:"button",class:"danger ghost",onclick:()=>{if(!armed){armed=true;del.textContent="Confirmar";setTimeout(()=>{armed=false;del.textContent="Excluir"},3000);return}Store.remove("notes",o.id);S.note=null;drawAll()}},"Excluir");
  const tog=h("button",{type:"button",class:"primary",title:"Atalho: Ctrl+E",onclick:()=>{S.mode=S.mode==="edit"?"read":"edit";drawNote()}},S.mode==="edit"?"Ler":"Editar");
  const dl=h("datalist",{id:"dl-notes"},[...S.notes.values()].map(n=>h("option",{value:n.title})),[...new Set([...S.maps.values()].flatMap(m=>(m.places||[]).filter(p=>p.k==="d"||p.k==="b").map(p=>p.name)))].map(n=>h("option",{value:n}))),dlf=h("datalist",{id:"dl-fold"},[...new Set([...S.notes.values()].map(n=>n.folder).filter(Boolean))].map(f=>h("option",{value:f})));
  // ficha
  const fields=FIELDS[type]||FIELDS.livre,grid=h("div",{class:"fgrid"});
  for(const [k,label,kind,opts] of fields){const chips=h("span",{class:"fchips"}),drawChips=()=>{chips.replaceChildren();if(kind!=="link"&&kind!=="links")return;for(const nm of splitL(fm(o.content).props[k])){const ex=findNote(nm)||findPlace(nm);chips.append(h("button",{type:"button",class:"fl"+(ex?"":" miss"),title:ex?"Abrir":"Criar nota",onclick:()=>openTitle(nm)},nm))}};
    let inp;const val=fm(o.content).props[k]||"";if(kind==="sel"){inp=h("select",{"aria-label":label,onchange:e=>setProps(o,{[k]:e.target.value})},opts.map(v=>Array.isArray(v)?v:[v,v||"—"]).map(([v,l])=>h("option",{value:v,selected:v===val},l)))}
    else inp=h("input",{type:"text",value:val,"aria-label":label,list:kind==="link"||kind==="links"?"dl-notes":null,placeholder:kind==="links"?"Nomes separados por vírgula":kind==="link"?"Nome de uma nota":k==="data"?"ex.: 1272, ou 1272-05-03":"",onchange:e=>{setProps(o,{[k]:e.target.value.trim()});drawChips()}});
    grid.append(h("label",{class:"fld"+(kind==="links"?" wide":"")},h("span",{},label),inp,chips));drawChips()}
  const pic=h("div",{class:"pic"+(o.img?" has":""),tabindex:"0",role:"button","aria-label":o.img?"Trocar imagem":"Adicionar imagem",title:"Clique ou arraste uma imagem"});if(o.img)pic.append(h("img",{src:o.img,alt:""}));else pic.append(h("span",{},type==="personagem"?"Retrato":"Imagem"));
  const pickImg=async f=>{if(!f||!/^image\//.test(f.type))return;try{o.img=await shrinkImg(f,360);Store.save("notes",o);drawNote()}catch(e){toast("Não consegui ler essa imagem.")}};
  const fi=h("input",{type:"file",accept:"image/*",hidden:true,onchange:e=>pickImg(e.target.files[0])});pic.addEventListener("click",()=>fi.click());pic.addEventListener("keydown",e=>{if(e.key==="Enter")fi.click()});pic.addEventListener("dragover",e=>{e.preventDefault();pic.classList.add("over")});pic.addEventListener("dragleave",()=>pic.classList.remove("over"));pic.addEventListener("drop",e=>{e.preventDefault();pic.classList.remove("over");pickImg(e.dataTransfer.files[0])});
  if(o.img)pic.append(h("button",{type:"button",class:"x",title:"Tirar imagem","aria-label":"Tirar imagem",onclick:e=>{e.stopPropagation();delete o.img;Store.save("notes",o);drawNote()}},"×"));
  const ficha=h("div",{class:"ficha"},pic,fi,grid);
  // lugar no mapa
  let placeCard=null;const pl=o.place&&S.maps.get(o.place.map);if(pl){placeCard=h("button",{type:"button",class:"placecard",title:"Abrir no mapa",onclick:()=>openMap(pl.id,{x:o.place.x,y:o.place.y,name:o.place.name})},o.thumb?h("img",{src:o.thumb,alt:""}):null,h("span",{},h("b",{},o.place.name||o.title),h("small",{},pl.name),h("em",{},"Abrir no mapa →")))}
  else if(props.mapa){const mp=[...S.maps.values()].find(m=>norm(m.name)===norm(props.mapa));if(mp)placeCard=h("button",{type:"button",class:"placecard",onclick:()=>openMap(mp.id,props.pino||o.title)},h("span",{},h("b",{},props.pino||o.title),h("small",{},mp.name),h("em",{},"Abrir no mapa →")))}
  const head=h("div",{class:"row"},typeSel,folder,h("span",{class:"grow"}),tog,del);
  const emptyF=type==="livre"&&!o.img&&!props.data&&S.mode!=="edit";const wrap=h("div",{class:"note t-"+type},title,head,emptyF&&!placeCard?null:h("div",{class:"ntop"},emptyF?h("span"):ficha,placeCard),dl,dlf);
  if(S.mode==="edit"){const sugg=h("div",{class:"sugg"}),ta=h("textarea",{class:"ed",spellcheck:"true","aria-label":"Conteúdo da nota",placeholder:"Escreva aqui. [[Nome]] liga a outra nota ou lugar do mapa · #etiqueta · %%segredo%% · arraste imagens para dentro."});ta.value=fm(o.content).body;
    const save=()=>{const {props}=fm(o.content),ks=Object.keys(props);o.content=(ks.length?"---\n"+ks.map(k=>k+": "+props[k]).join("\n")+"\n---\n\n":"")+ta.value;o.updated=now();Store.save("notes",o)};
    const wrapSel=(a,b,ph)=>{const s0=ta.selectionStart,s1=ta.selectionEnd,sel=ta.value.slice(s0,s1)||ph||"";ta.setRangeText(a+sel+b,s0,s1,"end");if(!ta.value.slice(s0,s1+a.length+b.length).length)return;ta.selectionStart=s0+a.length;ta.selectionEnd=s0+a.length+sel.length;ta.focus();save();suggest()};
    const linePre=pre=>{const s0=ta.value.lastIndexOf("\n",ta.selectionStart-1)+1;ta.setRangeText(pre,s0,s0,"end");ta.focus();save()};
    let si=0,items=[];const suggest=()=>{const pre=ta.value.slice(0,ta.selectionStart),m=/\[\[([^\]\n|]*)$/.exec(pre);sugg.replaceChildren();items=[];si=0;
      if(m){const q=norm(m[1]),names=new Set([...S.notes.values()].filter(n=>n.id!==o.id).map(n=>n.title));for(const mp of S.maps.values()){names.add(mp.name);for(const t of mp.lock||[])if(t.name)names.add(t.name);for(const p of mp.places||[])names.add(p.name)}
        items=[...names].filter(n=>norm(n).includes(q)).sort((a,b)=>norm(a).indexOf(q)-norm(b).indexOf(q)).slice(0,8);if(!items.length&&q)items=[m[1]];
        items.forEach((n,i)=>sugg.append(h("button",{type:"button",class:i===si?"on":"",onmousedown:e=>{e.preventDefault();pickS(i)}},findNote(n)||!q?n:findPlace(n)?n+"  · mapa":n+"  · nova nota")))}};
    const pickS=i=>{const pre=ta.value.slice(0,ta.selectionStart),m=/\[\[([^\]\n|]*)$/.exec(pre);if(!m)return;const st=ta.selectionStart-m[1].length,after=ta.value.slice(ta.selectionStart,ta.selectionStart+2)==="]]";ta.setRangeText(items[i]+(after?"":"]]"),st,ta.selectionStart,"end");if(after)ta.selectionStart=ta.selectionEnd=ta.selectionStart+2;sugg.replaceChildren();items=[];save()};
    ta.addEventListener("input",()=>{save();suggest()});ta.addEventListener("click",suggest);
    ta.addEventListener("keydown",e=>{if(items.length&&(e.key==="ArrowDown"||e.key==="ArrowUp")){e.preventDefault();si=(si+(e.key==="ArrowDown"?1:items.length-1))%items.length;[...sugg.children].forEach((b,i)=>b.classList.toggle("on",i===si));return}
      if(items.length&&(e.key==="Enter"||e.key==="Tab")){e.preventDefault();pickS(si);return}if(e.key==="Escape"){if(items.length){sugg.replaceChildren();items=[];return}S.mode="read";drawNote();return}
      const k=e.key.toLowerCase();if(e.ctrlKey||e.metaKey){if(k==="b"){e.preventDefault();wrapSel("**","**","negrito")}else if(k==="i"){e.preventDefault();wrapSel("*","*","itálico")}else if(k==="k"){e.preventDefault();wrapSel("[[","]]","")}else if(k==="h"&&e.shiftKey||k==="s"&&e.shiftKey){e.preventDefault();wrapSel("%%","%%","segredo")}}
      if(e.key==="["&&ta.value[ta.selectionStart-1]==="["&&ta.selectionStart===ta.selectionEnd){e.preventDefault();ta.setRangeText("[]]",ta.selectionStart,ta.selectionEnd,"end");ta.selectionStart=ta.selectionEnd=ta.selectionStart-2;save();suggest()}});
    const addImgs=async files=>{for(const f of files){if(!/^image\//.test(f.type))continue;try{const u=await shrinkImg(f,1000),id=uid("i");o.images=o.images||{};o.images[id]=u;ta.setRangeText("\n![[img:"+id+"]]\n",ta.selectionStart,ta.selectionEnd,"end");save()}catch(e){toast("Não consegui ler essa imagem.")}}};
    ta.addEventListener("dragover",e=>{if([...e.dataTransfer.items].some(i=>i.kind==="file"))e.preventDefault()});ta.addEventListener("drop",e=>{if(e.dataTransfer.files.length){e.preventDefault();addImgs([...e.dataTransfer.files])}});ta.addEventListener("paste",e=>{const f=[...e.clipboardData.files];if(f.length){e.preventDefault();addImgs(f)}});
    const ifile=h("input",{type:"file",accept:"image/*",multiple:true,hidden:true,onchange:e=>addImgs([...e.target.files])});
    const tb=h("div",{class:"tbar",role:"toolbar","aria-label":"Formatação"},[["B","Negrito (Ctrl+B)",()=>wrapSel("**","**","negrito")],["I","Itálico (Ctrl+I)",()=>wrapSel("*","*","itálico")],["[[ ]]","Ligar a nota ou lugar (Ctrl+K)",()=>wrapSel("[[","]]","")],["Título","Título",()=>linePre("## ")],["Lista","Lista",()=>linePre("- ")],["Tarefa","Caixa de marcar",()=>linePre("- [ ] ")],["#","Etiqueta",()=>wrapSel("#","","etiqueta")],["Segredo","Só o mestre vê (Ctrl+Shift+S)",()=>wrapSel("%%","%%","segredo")],["Imagem","Inserir imagem",()=>ifile.click()]].map(([t,ti,fn])=>h("button",{type:"button",title:ti,onclick:fn},t)),ifile);
    wrap.append(tb,sugg,ta);setTimeout(()=>ta.focus({preventScroll:true}),0)}
  else{const v=mdView(o.content,o);v.title="Clique duas vezes para editar";v.addEventListener("dblclick",e=>{if(!e.target.closest("a")){S.mode="edit";drawNote()}});if(!fm(o.content).body.trim())v.append(h("p",{class:"empty"},"Sem texto ainda. Clique duas vezes aqui ou em Editar."));wrap.append(v)}
  const bl=backlinks(o);if(bl.length)wrap.append(h("section",{class:"back"},h("h3",{},"Mencionada em"),h("div",{class:"list"},bl.map(n=>h("button",{class:"item",type:"button",onclick:()=>openNote(n.id)},n.title)))));
  main.append(wrap)}
function renameLinks(a,b){if(!a||norm(a)===norm(b))return;const re=new RegExp("\\[\\["+a.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")+"(\\|[^\\]]*)?\\]\\]","gi");for(const n of S.notes.values()){const c=(n.content||"").replace(re,(m,al)=>"[["+b+(al||"")+"]]");if(c!==n.content){n.content=c;Store.save("notes",n)}}}
// ---------- mapas ----------
let cur=null,tool="move",brush=60,undo=[];
function newMap(){const id=uid("m"),nm=A.NAMES[(Math.random()*A.NAMES.length)|0];let name="Região de "+nm,k=2;while([...S.maps.values()].some(m=>m.name===name))name="Região de "+nm+" "+(k++);
  const o={id,name,params:Object.assign({},DEF,{seed:nm.toLowerCase()+"-"+(1300+((Math.random()*200)|0))}),edits:[],lock:null,pins:[],updated:now()};S.maps.set(id,o);Store.save("maps",o);return o}
function newCityFrom(reg,town){const AC=window.AtlasCity,W=S.cur&&S.cur.W,t=W&&W.towns.find(z=>z.name===town.name),x=town.x,y=town.y,R=t?t.rmax:40,sg=A.sampleGrid;
  let site="interior",river=false,relief=.4;if(W&&sg){let wn=0;for(let k=0;k<24;k++){const a=k/24*6.2832;if(sg(W.land,x+Math.cos(a)*(R+60),y+Math.sin(a)*(R+60))<0)wn++}site=wn>=18?"ilha":wn>=10?"peninsula":wn>0?"costa":"interior";river=sg(W.rdist,x,y)<R+40;if(river&&site==="interior")site="rio";
    let e0=1,e1=0;for(let k=0;k<16;k++){const a=k/16*6.2832,e=sg(W.elev,x+Math.cos(a)*R,y+Math.sin(a)*R);e0=Math.min(e0,e);e1=Math.max(e1,e)}relief=clamp((e1-e0)*4,.15,.95)}
  const dirs=[];if(W&&W.vec)for(const r of W.vec.roads){let bi=-1,bd=1e9;r.forEach((p,i)=>{const d=Math.hypot(p[0]-x,p[1]-y);if(d<bd){bd=d;bi=i}});if(bd>R+40)continue;for(const sg2 of [1,-1])for(let i=bi+sg2;i>=0&&i<r.length;i+=sg2){if(Math.hypot(r[i][0]-x,r[i][1]-y)>R+40){const a=Math.atan2(r[i][1]-y,r[i][0]-x);if(!dirs.some(b=>Math.abs(Math.atan2(Math.sin(a-b),Math.cos(a-b)))<.6))dirs.push(+a.toFixed(3));break}}}
  const size=town.kind==="city"?clamp(Math.round(18+(town.size-26)*.6),16,40):town.kind==="town"?clamp(Math.round(10+(town.size-12)*.5),9,18):6;
  const id=uid("m"),o={id,name:"Cidade de "+town.name,type:"city",src:{map:reg.id,town:town.name},params:Object.assign({},AC.DEF,{seed:town.name.toLowerCase()+"-"+(A.hashStr(reg.params.seed||"x")%900+100),site,river,relief,size,culture:town.race||"humano",wall:town.wall?"reta":"nenhuma",citadel:town.kind==="city",plan:town.planned?"planejado":"misto",wealth:town.kind==="city"?.6:town.kind==="town"?.45:.3,foreign:town.kind==="city"?"auto":"nao",roadDirs:dirs}),updated:now()};
  S.maps.set(id,o);Store.save("maps",o);return o}
function newCity(){const AC=window.AtlasCity,id=uid("m"),nm=A.NAMES[(Math.random()*A.NAMES.length)|0];let name="Cidade de "+nm,k=2;while([...S.maps.values()].some(m=>m.name===name))name="Cidade de "+nm+" "+(k++);
  const o={id,name,type:"city",params:Object.assign({},AC.DEF,{seed:nm.toLowerCase()+"-"+(1200+((Math.random()*300)|0)),site:AC.SITES[(Math.random()*AC.SITES.length)|0][0]}),updated:now()};S.maps.set(id,o);Store.save("maps",o);return o}
// mapa de cidade: gerador proprio (city.js), com zoom, arrasto e parametros
function drawCityMap(o,main,flash){const AC=window.AtlasCity;o.params=Object.assign({},AC.DEF,o.params);o.params.wards=o.params.wards||{};o.objs=o.objs||[];o.erase=o.erase||[];if(o.params.wall===true)o.params.wall="reta";if(o.params.wall===false)o.params.wall="nenhuma";
  const mc=h("canvas",{id:"mc",width:AC.CW,height:AC.CH,"aria-label":"Mapa da cidade"}),mo=h("canvas",{id:"mo",width:AC.CW,height:AC.CH}),stage=h("div",{class:"stage"},mc,mo),busy=h("div",{class:"busy"},"Gerando…"),status=h("div",{class:"status"}),view=h("div",{class:"view"},stage),octx=mo.getContext("2d");view.style.aspectRatio=AC.CW+"/"+AC.CH;let SC=2,scT=null,lst=null,lcv=null,ltype="road",pop=null;
  const ov=mkOverlay(o,AC.CW,AC.CH,nm=>{if(!info)return null;const n=norm(nm),pl=(o.places||[]).find(p=>norm(p.name)===n||(p.k==="c"&&norm(p.name.replace(/^Cidade de /i,""))===n));return pl?info.project(pl.x,pl.y):null});stage.append(ov.svg);
  const Z={k:1,x:0,y:0},zl=h("span",{class:"zl"},"100%"),applyZ=()=>{const vw=view.clientWidth,vh=view.clientHeight;Z.x=clamp(Z.x,vw-vw*Z.k,0);Z.y=clamp(Z.y,vh-vh*Z.k,0);stage.style.transform="translate("+Z.x+"px,"+Z.y+"px) scale("+Z.k+")";zl.textContent=Math.round(Z.k*100)+"%";ov.setK(Z.k);if(Z.k>2.1&&SC<3){clearTimeout(scT);scT=setTimeout(()=>{if(Z.k>2.1&&SC<3&&C){SC=3;draw()}},450)}};
  const zoomAt=(cx,cy,f)=>{const k2=clamp(Z.k*f,1,8);Z.x=cx-(cx-Z.x)*k2/Z.k;Z.y=cy-(cy-Z.y)*k2/Z.k;Z.k=k2;applyZ()},zoomMid=f=>zoomAt(view.clientWidth/2,view.clientHeight/2,f);
  let C=null,info=null,tool="move",sel=-1,brush=40,cSel="b_town",cSize=1,cRot=20,cRace=o.params.culture,cSpread=1;const undo=[];
  const snap=()=>{undo.push(JSON.stringify({params:o.params,objs:o.objs,erase:o.erase,realms:o.realms}));if(undo.length>30)undo.shift()};
  const toWorld=ev=>{const r=mc.getBoundingClientRect(),cx=(ev.clientX-r.left)*AC.CW/r.width,cy=(ev.clientY-r.top)*AC.CH/r.height;if(!info)return null;const w=info.unproject(cx,cy);return {x:w[0],y:w[1],cx,cy}};
  function draw(){if(!C)return;const t0=performance.now();info=AC.render(C,mc,{objs:o.objs,erase:o.erase,scale:SC,fast:true,snap:true});ov.draw();drawSel();return performance.now()-t0}
  function regen(){busy.hidden=false;setTimeout(()=>{const t0=performance.now();try{C=AC.generate(Object.assign({},o.params,{title:o.name.replace(/^Cidade de /i,"")}));o.places=cityPlaces(o,C);draw();syncTown(o);Store.save("maps",o);
      status.textContent=C.inner.length+" bairros, "+C.districts.length+" distritos, "+info.houses+" construções, "+C.gates.length+" portões, "+Math.round(performance.now()-t0)+" ms"}
    catch(e){console.error(e);status.textContent="Não foi possível gerar esta cidade. Tente outra semente. ("+e.message+")"}busy.hidden=true;drawCtx();
    if(flash&&info){const f=flash;flash=null;let p=null;if(typeof f==="object"&&f.x!=null)p=[f.x,f.y];else{const nm=typeof f==="string"?f:f&&f.name,pl=(o.places||[]).find(q=>norm(q.name)===norm(nm));if(pl)p=[pl.x,pl.y]}
      if(p){const c=info.project(p[0],p[1]),vw=view.clientWidth,vh=view.clientHeight;Z.k=2.4;Z.x=vw/2-c[0]/AC.CW*vw*Z.k;Z.y=vh/2-c[1]/AC.CH*vh*Z.k;applyZ();ov.flash(c[0],c[1])}}},30)}
  // ---- selecionar e editar objetos gerados
  let selO=null,mvO=null;const AS_=window.AtlasAssets,HT_={hut:"Cabana",shed:"Barracão",row:"Casa geminada",town:"Casa",rich:"Casa rica",manor:"Solar",tavern:"Taverna",smithy:"Ferraria",farm:"Casa de sítio",barn:"Celeiro"};
  const kindOf=q=>C.B.includes(q)?"h":C.SPB.includes(q)?"s":"p",nameOf=q=>{const k=kindOf(q);if(k==="h")return HT_[q.type]||"Casa";if(q.k===3)return "Castelo / palácio";if(q.k===2)return "Templo";if(q.k===8)return "Moinho";return (AS_.NAME&&AS_.NAME[q.id])||q.id||"Objeto"};
  const fpOf=q=>{if(kindOf(q)==="h")return [q.L,q.D,q.ang];if(q.k===3&&q.fp)return [q.fp[0],q.fp[1],(q.ang||0)+.34];{const si=C&&C._sil&&C._sil(q);if(si){const w=si.w*.92;return [w,w*.62,0]}}if(q.fp)return [q.fp[0],q.fp[1],0];const w=((AS_.SIZE[q.id]||[8])[0])*1.55*1.4;return [w,w*.7,0]};
  const obbW=(x,y,a,L,D)=>{const c=Math.cos(a),s2=Math.sin(a);return [[-L/2,-D/2],[L/2,-D/2],[L/2,D/2],[-L/2,D/2]].map(([u,v])=>[x+c*u-s2*v,y+s2*u+c*v])};
  function pickAt(cx,cy){if(!C||!info)return null;if(C._pick)return C._pick(cx,cy);let best=null,by=-1e9;const test=q=>{const [L,D]=fpOf(q),p=info.project(q.x,q.y),w=Math.max(L,D)*.55+3,hgt=kindOf(q)==="h"?24*(q.hm||1)+Math.max(L,D)*.3:q.k===3?L*.9:Math.max(L,D)*.9+8;if(cx>p[0]-w&&cx<p[0]+w&&cy>p[1]-hgt&&cy<p[1]+D*.45&&p[1]>by){by=p[1];best=q}};
    for(const q of C.B)test(q);for(const q of C.SPB)test(q);for(const q of C.props)test(q);return best}
  function setOv(q,patch,full){if(!q||!q.key)return;snap();o.params.ovr=o.params.ovr||{};o.params.ovr[q.key]=Object.assign({},o.params.ovr[q.key]||{},patch);if(patch.x!=null&&q.wing){q.wing.x+=patch.x-q.x;q.wing.y+=patch.y-q.y}if(patch.a!=null)q.wing=null;for(const k in patch){if(k==="a")q.ang=patch.a;else if(k==="del"){for(const arr of[C.B,C.SPB,C.props]){const i2=arr.indexOf(q);if(i2>=0)arr.splice(i2,1)}selO=null}else q[k]=patch[k]}
    info=AC.render(C,mc,{objs:o.objs,erase:o.erase,scale:SC,fast:false,snap:true});ov.draw();drawSel();Store.save("maps",o);drawCtx()}
  let hovO=null,hovP=null,hovRaf=0;
  function drawHover(){if(!hovO||!hovP||mvO)return;if(hovO!==selO){const si=C._sil&&C._sil(hovO);if(si)octx.drawImage(si.hov,si.x,si.y)}
    const t=nameOf(hovO);octx.save();octx.font='15px "IM Fell English",Georgia,serif';const w=octx.measureText(t).width+14,x=Math.min(hovP[0]+14,AC.CW-w-4),y=Math.max(hovP[1]-30,4);octx.fillStyle="rgba(26,20,16,.92)";octx.strokeStyle="#c9a24a";octx.lineWidth=1;octx.beginPath();octx.rect(x,y,w,22);octx.fill();octx.stroke();octx.fillStyle="#f0e2c0";octx.textBaseline="middle";octx.fillText(t,x+7,y+11.5);octx.restore()}
  function drawPick(){if(tool==="sel")drawHover();if(!selO||!info)return;const [L,D,a]=fpOf(selO),pts=obbW(selO.x,selO.y,a,L,D).map(v=>info.project(v[0],v[1]));
    octx.save();octx.fillStyle="rgba(240,192,96,.22)";octx.strokeStyle="rgba(240,192,96,.75)";octx.lineWidth=1;octx.beginPath();pts.forEach((p2,i2)=>i2?octx.lineTo(p2[0],p2[1]):octx.moveTo(p2[0],p2[1]));octx.closePath();octx.fill();octx.stroke();
    const si=C._sil&&C._sil(selO);if(si){let dx=0,dy=0;if(mvO&&mvO.moved){const a0=info.project(mvO.x0,mvO.y0),a1=info.project(selO.x,selO.y);dx=a1[0]-a0[0];dy=a1[1]-a0[1];octx.globalAlpha=.75;octx.drawImage(si.ghost,si.x+dx,si.y+dy);octx.globalAlpha=1}octx.drawImage(si.sel,si.x+dx,si.y+dy)}octx.restore()}
  function redraw(){const ms=draw();Store.save("maps",o);status.textContent=status.textContent.replace(/(, )?\d+ ms$/,"")+", "+Math.round(ms)+" ms"}
  const handles=()=>{if(!C)return [];if(tool==="corner"){const ids=new Set();for(const p of C.patches)if(p.inner||p.type==="arrabalde")for(const id of p.nd)ids.add(id);return [...ids].map(id=>({id,p:info.project(C.nodes[id].x,C.nodes[id].y)})).filter(q=>q.p[0]>A.MX&&q.p[1]>A.MY&&q.p[0]<AC.CW-A.MX&&q.p[1]<AC.CH-40)}
    if(tool==="gate"){const ids=new Set();for(const w of C.walls||[])for(const id of w.ids)ids.add(id);for(const g of C.gates)ids.add(g);return [...ids].map(id=>({id,p:info.project(C.nodes[id].x,C.nodes[id].y),g:C.gates.includes(id)}))}return []};
  let drag=null;
  function drawHandles(){if(tool!=="corner"&&tool!=="gate")return;for(const q of handles()){const dp=drag&&drag.id===q.id?drag.p:q.p;octx.fillStyle=q.g?"#a8352a":"rgba(201,162,74,.95)";octx.strokeStyle="#1d160d";octx.lineWidth=1.5;octx.beginPath();octx.arc(dp[0],dp[1],q.g?10:tool==="gate"?7:8,0,7);octx.fill();octx.stroke()}}
  function drawSel(){octx.clearRect(0,0,AC.CW,AC.CH);drawHandles();if(tool==="sel")drawPick();if(sel<0||!C||!info)return;const p=C.patches[sel];if(!p)return;octx.beginPath();p.poly.forEach((v,i)=>{const q=info.project(v[0],v[1]);i?octx.lineTo(q[0],q[1]):octx.moveTo(q[0],q[1])});octx.closePath();octx.fillStyle="rgba(201,162,74,.18)";octx.fill();octx.strokeStyle="rgba(201,162,74,.95)";octx.lineWidth=2.5;octx.setLineDash([7,4]);octx.stroke();octx.setLineDash([])}
  // arrastar, aproximar, ferramentas
  let pan=null,tap=null,stroke=null;
  view.addEventListener("pointerdown",ev=>{if(ev.target.closest("button"))return;try{view.setPointerCapture(ev.pointerId)}catch(e){}if(ev.button===1){ev.preventDefault();pan=[ev.clientX,ev.clientY];return}if(ev.button===2)return;
    if(tool==="move"){pan=[ev.clientX,ev.clientY];tap=[ev.clientX,ev.clientY];return}
    if(tool==="sel"){const w=toWorld(ev);if(!w)return;const q=pickAt(w.cx,w.cy);if(q!==selO){selO=q;drawSel();drawCtx()}if(q)mvO={q,x0:q.x,y0:q.y,w0:[w.x,w.y],moved:false};else pan=[ev.clientX,ev.clientY];return}
    if(tool==="lines"){const w=toWorld(ev);if(w){lst=[[Math.round(w.x),Math.round(w.y)]];lcv=[[w.cx,w.cy]]}return}
    if(tool==="corner"||tool==="gate"){const w=toWorld(ev);if(!w)return;const r=mc.getBoundingClientRect(),tol=14*AC.CW/r.width;let best=null,bd=tol;for(const q of handles()){const d=Math.hypot(q.p[0]-w.cx,q.p[1]-w.cy);if(d<bd){bd=d;best=q}}
      if(!best){pan=[ev.clientX,ev.clientY];return}if(tool==="gate"){snap();const G=o.params.gates=o.params.gates||{add:[],del:[]};if(best.g){G.add=G.add.filter(x=>x!==best.id);if(!G.del.includes(best.id))G.del.push(best.id)}else{G.del=G.del.filter(x=>x!==best.id);if(!G.add.includes(best.id))G.add.push(best.id)}regen();return}
      drag={id:best.id,p:best.p};return}
    if(tool==="erase"){const w=toWorld(ev);if(w){stroke=[];addE(w)}return}tap=[ev.clientX,ev.clientY]});
  const addE=w=>{const l=stroke[stroke.length-1];if(l&&Math.hypot(l.x-w.x,l.y-w.y)<brush*.4)return;stroke.push({x:Math.round(w.x),y:Math.round(w.y),r:brush});octx.fillStyle="rgba(170,60,50,.4)";octx.beginPath();octx.ellipse(w.cx,w.cy,brush,brush*A.TILT,0,0,7);octx.fill()};
  view.addEventListener("pointermove",ev=>{if(tool==="sel"&&!mvO&&!pan&&ev.pointerType!=="touch"){const w=toWorld(ev);if(w){hovP=[w.cx,w.cy];if(!hovRaf)hovRaf=requestAnimationFrame(()=>{hovRaf=0;if(!hovP)return;const q=pickAt(hovP[0],hovP[1]);hovO=q;view.style.cursor=q?"pointer":"";drawSel()})}}
    if(mvO){const w=toWorld(ev);if(w){const dx=w.x-mvO.w0[0],dy=w.y-mvO.w0[1];if(Math.hypot(dx,dy)>2||mvO.moved){mvO.moved=true;mvO.q.x=mvO.x0+dx;mvO.q.y=mvO.y0+dy;drawSel()}}return}
    if(lst){const w=toWorld(ev);if(w){const l=lst[lst.length-1];if(Math.hypot(l[0]-w.x,l[1]-w.y)>9){lst.push([Math.round(w.x),Math.round(w.y)]);lcv.push([w.cx,w.cy]);drawSel();octx.strokeStyle=LTC[ltype];octx.lineWidth=LTW[ltype];octx.lineCap=octx.lineJoin="round";octx.beginPath();lcv.forEach((p,i)=>i?octx.lineTo(p[0],p[1]):octx.moveTo(p[0],p[1]));octx.stroke()}}return}
    if(drag){const w=toWorld(ev);if(w){drag.p=[w.cx,w.cy];drag.w=[w.x,w.y];drawSel()}return}if(pan){Z.x+=ev.clientX-pan[0];Z.y+=ev.clientY-pan[1];pan=[ev.clientX,ev.clientY];applyZ();return}if(stroke){const w=toWorld(ev);if(w)addE(w);return}
    if(tool==="obj"&&THUMBS&&THUMBS[cSel]){const w=toWorld(ev);drawSel();if(w&&AS_.NAME&&AS_.NAME[cSel]){const p2=info.project(w.x,w.y),z=cSize*1.55;octx.save();octx.globalAlpha=.8;octx.translate(p2[0],p2[1]);octx.scale(z,z);AS_.draw(octx,0,0,cSel,cRace,((Math.round(w.x)*7+Math.round(w.y)*3)%100)/100,cRot*Math.PI/180);octx.restore();return}if(w){const p2=info.project(w.x,w.y);w.cx=p2[0];w.cy=p2[1];const t=THUMBS[cSel],z=(OBJTREE.has(cSel)?.62:.6)*cSize*1.55;octx.strokeStyle="rgba(201,162,74,.95)";octx.lineWidth=1.5;octx.beginPath();octx.ellipse(w.cx,w.cy,14*z,14*z*A.TILT,0,0,7);octx.stroke();octx.globalAlpha=.8;octx.drawImage(t,w.cx-36*z,w.cy-64*z,72*z,72*z);octx.globalAlpha=1}}});
  const up=ev=>{pan=null;if(mvO){const m=mvO;mvO=null;if(m.moved){const nx=Math.round(m.q.x),ny=Math.round(m.q.y);m.q.x=m.x0;m.q.y=m.y0;setOv(m.q,{x:nx,y:ny})}return}if(lst){const L=lst;lst=null;lcv=null;if(L.length>=2){snap();o.params.lines=(o.params.lines||[]).concat({t:ltype,pts:L});regen()}else drawSel();return}if(drag){const d=drag;drag=null;if(d.w){const nd=C.nodes[d.id],near=nd&&nd.adj.some(([v])=>{const q=C.nodes[v];return q&&Math.hypot(q.x-d.w[0],q.y-d.w[1])<18});if(near){toast("Muito perto de outro canto. Solte um pouco mais longe.");drawSel();return}snap();o.params.nodes=o.params.nodes||{};o.params.nodes[d.id]=[Math.round(d.w[0]),Math.round(d.w[1])];regen()}else drawSel();return}if(stroke){const st=stroke;stroke=null;if(st.length){snap();o.objs=o.objs.filter(m=>!st.some(e=>Math.hypot(m.x-e.x,m.y-e.y)<e.r));const ol=o.params.lines||[],nl=ol.filter(l=>!l.pts.some(p=>st.some(e=>Math.hypot(p[0]-e.x,p[1]-e.y)<e.r)));o.erase=o.erase.concat(st);if(nl.length!==ol.length){o.params.lines=nl;regen()}else redraw()}}
    if(tap){const t=tap;tap=null;if(ev.type==="pointerup"&&Math.hypot(ev.clientX-t[0],ev.clientY-t[1])<10){const w=toWorld(ev);if(w)act(w)}}};
  view.addEventListener("pointerup",up);view.addEventListener("pointercancel",up);view.addEventListener("pointerleave",()=>{hovO=null;hovP=null;if(tool==="obj"||tool==="sel")drawSel()});
  view.addEventListener("mousedown",ev=>{if(ev.button===1)ev.preventDefault()});view.addEventListener("wheel",ev=>{ev.preventDefault();const r=view.getBoundingClientRect();zoomAt(ev.clientX-r.left,ev.clientY-r.top,Math.exp(-ev.deltaY*.0016))},{passive:false});
  function act(w){if(tool==="move"){popPlace(w);return}if(tool==="border"){const r=mc.getBoundingClientRect();ov.tap(w.cx,w.cy,16*AC.CW/r.width);return}if(tool==="obj"){snap();const n=OBJTREE.has(cSel)?cSpread:1;for(let i=0;i<n;i++){const a=Math.random()*6.28,d=i?Math.sqrt(Math.random())*(14+n*3):0,m={v:cSel,x:Math.round(w.x+Math.cos(a)*d),y:Math.round(w.y+Math.sin(a)*d*.8),s:+(cSize*(i?.85+Math.random()*.3:1)).toFixed(2)};if(isB(cSel)){m.c=cRace;m.a=cRot}o.objs.push(m)}redraw()}
    else if(tool==="ward"){const p=AC.patchAt(C,w.x,w.y);sel=p?p.i:-1;drawSel();drawCtx()}}
  // paleta
  const LTC={road:"rgba(201,162,74,.9)",canal:"rgba(63,111,143,.9)",river:"rgba(63,111,143,.9)"},LTW={road:9,canal:8,river:16};
  const TT=[["move","Navegar"],["sel","Selecionar e editar"],["ward","Editar bairro"],["corner","Mover cantos e muralha"],["gate","Portões"],["lines","Desenhar ruas, canais e rios"],["obj","Colocar objeto"],["border","Fronteiras"],["erase","Apagar"]],IC={sel:"M5 3l13 8-6 1.5L9 19z",lines:"M4 19c3 0 3-6 6-6s2 5 5 5 3-9 5-12",border:"M4 7l5-3 6 3 5-2v13l-5 2-6-3-5 3z",ward:"M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z",corner:"M4 18L9 6l6 9 5-7M9 6a1.5 1.5 0 1 0 .01 0M15 15a1.5 1.5 0 1 0 .01 0M4 18a1.5 1.5 0 1 0 .01 0",gate:"M4 20V9l8-5 8 5v11M9 20v-6a3 3 0 0 1 6 0v6"};
  const pal=h("div",{class:"pal",role:"toolbar","aria-label":"Ferramentas da cidade"}),ctx=h("div",{class:"ctx"}),hint=h("div",{class:"hintc"});
  for(const [t,l] of TT)pal.append(h("button",{type:"button",class:"tbtn","data-t":t,"aria-label":l,title:l,onclick:()=>setTool(t)},svgI(ICON[t]||IC[t]),h("span",{class:"tip"},l)));
  const HT={sel:"Toque numa construção ou objeto · arraste para mover · R gira · Delete apaga",lines:"Arraste no mapa para desenhar · a cidade se ajusta em volta",border:"Toque numa fronteira para editar · use + Desenhar fronteira para criar outra",corner:"Arraste os pontos para mudar o formato dos bairros e da muralha",gate:"Toque num ponto da muralha para abrir ou fechar um portão",move:"Arraste para mover · toque num lugar para abrir a nota ou criar uma missão",ward:"Toque num bairro para mudar função, cultura e traçado",obj:"Toque no mapa para colocar o objeto escolhido",erase:"Pinte por cima do que quer apagar"};
  document.addEventListener("keydown",function kd(e){if(!document.body.contains(mc)){document.removeEventListener("keydown",kd);return}if(tool!=="sel"||!selO||/INPUT|SELECT|TEXTAREA/.test(document.activeElement&&document.activeElement.tagName))return;if(e.key==="r"||e.key==="R"){e.preventDefault();setOv(selO,{a:(selO.ang||0)+(e.shiftKey?-1:1)*Math.PI/12})}else if(e.key==="Delete"||e.key==="Backspace"){e.preventDefault();setOv(selO,{del:1})}else if(e.key==="Escape"){selO=null;drawSel();drawCtx()}});
  function setTool(t){tool=t;if(t!=="sel")selO=null;if(pop){pop.remove();pop=null}ov.setOn(t==="border");for(const b of pal.querySelectorAll(".tbtn"))b.classList.toggle("on",b.dataset.t===t);hint.textContent=HT[t];stage.classList.toggle("draw",t!=="move");if(t!=="ward"){sel=-1}drawSel();drawCtx()}
  const B_=(label,fn,cls)=>h("button",{type:"button",class:cls||"",onclick:fn},label);
  function drawCtx(){ctx.replaceChildren();ctx.hidden=tool==="move";if(tool==="move")return;
    if(tool==="border"){ov.ctxUI(ctx,()=>{if(!C||!info)return;snap();o.realms=o.realms.filter(r=>!r.auto).concat(autoRealmsCity(o,C,info));Store.save("maps",o);ov.draw();drawCtx()},"Gerar a partir dos distritos");return}ctx.append(h("strong",{class:"cname"},(TT.find(x=>x[0]===tool)||["",""])[1]));
    if(tool==="erase")ctx.append(h("label",{class:"cf"},"Pincel",h("input",{type:"range",min:15,max:120,value:brush,"aria-label":"Tamanho do pincel",oninput:e=>brush=+e.target.value})),B_("Desfazer todas as borrachas",()=>{if(!o.erase.length)return;snap();o.erase=[];redraw()},"ghost"));
    if(tool==="ward"){if(sel<0||!C){ctx.append(h("span",{class:"cf"},"Toque num bairro do mapa."));return}const p=C.patches[sel],ov=o.params.wards[sel]||{};
      const setW=(k,v)=>{snap();const z=Object.assign({},o.params.wards[sel]||{});if(v)z[k]=v;else delete z[k];if(Object.keys(z).length)o.params.wards[sel]=z;else delete o.params.wards[sel];regen()};
      ctx.append(h("label",{class:"cf"},"Função",h("select",{"aria-label":"Função do bairro",onchange:e=>setW("type",e.target.value)},AC.WTYPES.map(([v,n])=>h("option",{value:v,selected:v===p.type},n)))),
        h("label",{class:"cf"},"Cultura",h("select",{"aria-label":"Cultura do bairro",onchange:e=>setW("race",e.target.value)},A.RACES.map(r=>h("option",{value:r,selected:r===p.race},A.RACE_PT[r])))),
        h("label",{class:"cf"},"Traçado",h("select",{"aria-label":"Traçado do bairro",onchange:e=>setW("plan",e.target.value)},[["","Automático"],["organico","Orgânico"],["planejado","Planejado"]].map(([v,n])=>h("option",{value:v,selected:(ov.plan||"")===v},n)))),
        h("label",{class:"cf"},"Muralha",h("select",{"aria-label":"Bairro dentro ou fora da muralha",onchange:e=>{snap();const z=Object.assign({},o.params.wards[sel]||{});z.inside=e.target.value==="1";o.params.wards[sel]=z;regen()}},h("option",{value:"1",selected:!!p.inner},"Dentro da cidade"),h("option",{value:"0",selected:!p.inner},"Fora da cidade"))),
        B_("Voltar ao automático",()=>{if(!o.params.wards[sel])return;snap();delete o.params.wards[sel];regen()},"ghost"))}
    if(tool==="sel"){ctx.replaceChildren();if(!selO){ctx.append(h("span",{class:"cf"},"Toque numa casa, construção ou objeto do mapa."));if(o.params.ovr&&Object.keys(o.params.ovr).length)ctx.append(B_("Desfazer todas as edições ("+Object.keys(o.params.ovr).length+")",()=>{snap();o.params.ovr={};regen()},"ghost"));return}
      const q=selO,k=kindOf(q),rot=d=>setOv(q,{a:(q.ang||0)+d}),varr=d=>{if(k==="h")setOv(q,{vs:((q.vs||0)+d+40)%40});else setOv(q,{v:+((((q.v||0)+d*(q.k===3?.34:.2))%1+1)%1).toFixed(3)})};
      ctx.append(h("strong",{class:"cname"},nameOf(q)),B_("⟲",()=>rot(-Math.PI/12),"ghost"),B_("⟳",()=>rot(Math.PI/12),"ghost"),h("span",{class:"seg"},B_("‹",()=>varr(-1)),h("button",{type:"button",disabled:true},"Variação"),B_("›",()=>varr(1))));
      if(k==="h")ctx.append(h("label",{class:"cf"},"Tipo",h("select",{"aria-label":"Tipo de casa",onchange:e=>setOv(q,{type:e.target.value})},Object.entries(HT_).map(([v,n])=>h("option",{value:v,selected:v===q.type},n)))));
      else if(q.id&&AS_.LIST)ctx.append(h("label",{class:"cf"},"Trocar por",h("select",{"aria-label":"Trocar por",onchange:e=>{q.fp=null;setOv(q,{id:e.target.value})}},AS_.LIST.map(([g,items])=>h("optgroup",{label:g},items.map(([v,n])=>h("option",{value:v,selected:v===q.id},n)))))));
      if(q.k===3)ctx.append(h("label",{class:"cf"},"Tamanho",h("input",{type:"range",min:.7,max:1.8,step:.05,value:q.ms||1,"aria-label":"Tamanho do castelo",onchange:e=>setOv(q,{ms:+e.target.value})})));
      ctx.append(B_("Apagar",()=>setOv(q,{del:1}),"danger ghost"));if(o.params.ovr&&o.params.ovr[q.key])ctx.append(B_("Voltar ao gerado",()=>{snap();delete o.params.ovr[q.key];selO=null;regen()},"ghost"));return}
    if(tool==="lines"){const LT=[["road","Rua"],["canal","Canal"],["river","Rio"]];ctx.append(h("span",{class:"seg",role:"group","aria-label":"Tipo de linha"},LT.map(([v,n])=>h("button",{type:"button","aria-pressed":String(v===ltype),onclick:()=>{ltype=v;drawCtx()}},n))),
      B_("Apagar a última",()=>{const L=o.params.lines||[];if(!L.length){toast("Nenhuma linha desenhada.");return}snap();o.params.lines=L.slice(0,-1);regen()},"ghost"),B_("Apagar todas",()=>{if(!(o.params.lines||[]).length)return;snap();o.params.lines=[];regen()},"ghost"))}
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
  // lugar tocado no modo Navegar
  const thumbAt=(x,y)=>{try{const p=info.project(x,y),k=mc.width/AC.CW,cv=document.createElement("canvas");cv.width=320;cv.height=200;cv.getContext("2d").drawImage(mc,(p[0]-120)*k,(p[1]-86)*k,240*k,150*k,0,0,320,200);return cv.toDataURL("image/jpeg",.8)}catch(e){return null}};
  const placeNote=pl=>{let n=findNote(pl.name);if(!n){n=newNote("local",pl.name,{content:""});n.folder="Locais/"+o.name.replace(/^Cidade de /i,"");const d=pl.k==="d"?null:(()=>{const pa=AC.patchAt(C,pl.x,pl.y);return pa&&C.districts.find(z=>z.ps.includes(pa))})();setProps(n,{tipo:"local",categoria:{c:"cidade",d:"distrito",b:(window.AtlasAssets.NAME||{})[pl.t]||"construção",r:"rua",g:"portão"}[pl.k],regiao:pl.k==="c"?"":d?d.name:o.name});n.content+=TPL.local.replace(/^---[\s\S]*?---\n\n/,"")}
    if(!n.place){n.place={map:o.id,x:pl.x,y:pl.y,name:pl.name};n.thumb=thumbAt(pl.x,pl.y)}Store.save("notes",n);return n};
  function popPlace(w){if(pop){pop.remove();pop=null}if(!C||!info)return;let best=null,bd=40;for(const p of o.places||[]){if(p.k==="c"||p.k==="d")continue;const d=Math.hypot(p.x-w.x,p.y-w.y);if(d<bd){bd=d;best=p}}
    if(!best){const pa=AC.patchAt(C,w.x,w.y),d=pa&&C.districts.find(z=>z.ps.includes(pa));if(d)best=(o.places||[]).find(p=>p.k==="d"&&p.name===d.name)}if(!best)return;
    const KT={b:"Construção",g:"Portão",r:"Rua",d:"Distrito",c:"Cidade"},note=findNote(best.name),qs=quests().filter(n=>splitL(fm(n.content).props.local).some(t=>norm(t)===norm(best.name))),r=mc.getBoundingClientRect(),wr=view.parentNode.getBoundingClientRect(),px=r.left+w.cx/AC.CW*r.width-wr.left,py=r.top+w.cy/AC.CH*r.height-wr.top;
    pop=h("div",{class:"mpop",style:"left:"+clamp(px-20,8,wr.width-290)+"px;top:"+clamp(py+14,8,wr.height-230)+"px"},h("button",{type:"button",class:"x","aria-label":"Fechar",onclick:()=>{pop.remove();pop=null}},"×"),h("small",{},KT[best.k]||"Lugar"),h("b",{},best.name),note&&snippet(note)?h("p",{},snippet(note)):null,
      h("div",{class:"row"},h("button",{type:"button",class:"primary",onclick:()=>openNote(placeNote(best).id,note?null:"edit")},note?"Abrir nota":"Criar nota"),h("button",{type:"button",onclick:()=>{placeNote(best);const n=newNote("missao","Missão em "+best.name);setProps(n,{status:"aberta",local:best.name});openNote(n.id,"edit")}},"+ Missão aqui")),
      qs.length?h("div",{class:"qlist"},qs.map(n=>h("button",{type:"button",class:"qi q-"+qState(n),onclick:()=>openNote(n.id)},n.title))):null);view.parentNode.append(pop)}
  function cityNotes(){if(!C||!info)return;let c=0;const before=S.notes.size,P=o.places||[],dists=P.filter(p=>p.k==="d"),blds=P.filter(p=>p.k==="b"),dOf=(x,y)=>{const pa=AC.patchAt(C,x,y);return pa&&C.districts.find(z=>z.ps.includes(pa))},reg=o.src&&S.maps.get(o.src.map);
    const city=findNote(o.name)?null:placeNote(P[0]);if(city){setProps(city,{populacao:"cerca de "+(Math.round(info.houses*6/100)*100).toLocaleString("pt-BR"),cultura:A.RACE_PT[o.params.culture]||o.params.culture,regiao:reg?reg.name:""});city.content=city.content.replace("## Descrição\n\n","## Descrição\n\n\n## Distritos\n\n"+dists.map(d=>"- [["+d.name+"]]").join("\n")+"\n\n## Lugares importantes\n\n"+blds.map(b=>"- [["+b.name+"]]").join("\n")+"\n\n");Store.save("notes",city)}
    for(const d of dists){if(findNote(d.name))continue;const n=placeNote(d),inD=blds.filter(b=>{const z=dOf(b.x,b.y);return z&&z.name===d.name});setProps(n,{regiao:o.name});if(inD.length){n.content=n.content.replace("## Quem vive aqui","## Lugares\n\n"+inD.map(b=>"- [["+b.name+"]]").join("\n")+"\n\n## Quem vive aqui");Store.save("notes",n)}}
    for(const b of blds)if(!findNote(b.name))placeNote(b);c=S.notes.size-before;drawSide();ov.draw();toast(c?c+" notas criadas e ligadas entre si.":"As notas desta cidade já existem.")}
  // exportar
  function expMenu(btn,o2){let m=$("#expm");if(m){m.remove();if(!o2)return}const opt=o2||{top:false,grid:false,cell:25,q:3,ov:true};const r=btn.getBoundingClientRect();
    const cellL=h("span",{}),upd=()=>{cellL.textContent=Math.round(opt.cell*opt.q)+" px por quadrado"};
    m=h("div",{id:"expm",class:"mpop fixed exp",style:"left:"+Math.max(8,Math.min(innerWidth-330,r.right-320))+"px;top:"+(r.bottom+6)+"px"},h("button",{type:"button",class:"x","aria-label":"Fechar",onclick:()=>m.remove()},"×"),h("b",{},"Exportar imagem"),
      h("div",{class:"seg",role:"group","aria-label":"Estilo"},[["0","Como na tela"],["1","Visto de cima (VTT)"]].map(([v,n])=>{const b=h("button",{type:"button","aria-pressed":String((v==="1")===opt.top),onclick:()=>{opt.top=v==="1";if(opt.top)opt.grid=true;m.remove();expMenu(btn,opt)}},n);return b})),
      h("label",{class:"chk"},h("input",{type:"checkbox",checked:opt.grid,onchange:e=>opt.grid=e.target.checked}),"Grade de quadrados"),
      h("label",{class:"cf"},"Quadrado",h("input",{type:"range",min:12,max:60,value:opt.cell,"aria-label":"Tamanho do quadrado",oninput:e=>{opt.cell=+e.target.value;upd()}}),cellL),
      h("label",{class:"cf"},"Nitidez",h("select",{"aria-label":"Nitidez",onchange:e=>{opt.q=+e.target.value;upd()}},[[2,"Boa (2x)"],[3,"Alta (3x)"],[4,"Máxima (4x)"]].map(([v,n])=>h("option",{value:v,selected:v===opt.q},n)))),
      opt.top?null:h("label",{class:"chk"},h("input",{type:"checkbox",checked:opt.ov,onchange:e=>opt.ov=e.target.checked}),"Fronteiras e missões"),
      h("button",{type:"button",class:"primary",onclick:()=>{m.remove();doExport(opt)}},"Baixar PNG"));
    upd();document.body.append(m)}
  async function doExport(opt){if(!C)return;busy.hidden=false;busy.textContent="Preparando a imagem…";await new Promise(r=>setTimeout(r,40));try{const cv=document.createElement("canvas");if(opt.top)AC.renderTop(C,cv,{scale:opt.q,grid:opt.grid,cell:opt.cell,objs:o.objs,erase:o.erase});else{AC.render(C,cv,{objs:o.objs,erase:o.erase,scale:opt.q});if(opt.grid)AC.gridOver(cv,opt.cell,opt.q);if(opt.ov)await svgOnto(cv,ov.svg)}
      await new Promise(res=>cv.toBlob(b=>{saveFile(safe(o.name)+(opt.top?" - vtt":"")+".png",b);res()}))}catch(e){console.error(e);toast("Não consegui gerar a imagem. Tente uma nitidez menor.")}busy.hidden=true;busy.textContent="Gerando…"}
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
  const head=h("div",{class:"mhead"},title,h("div",{class:"hact"},h("button",{type:"button",class:"primary",onclick:()=>{snap();o.params.seed=A.NAMES[(Math.random()*A.NAMES.length)|0].toLowerCase()+"-"+(1200+((Math.random()*300)|0));o.params.wards={};o.params.nodes={};o.params.gates={add:[],del:[]};o.objs=[];o.erase=[];fill();regen()}},"Sortear nova"),bPar,h("button",{type:"button",title:"Cria notas ligadas para a cidade, os distritos e as construções principais",onclick:()=>cityNotes()},"Criar notas"),h("button",{type:"button",onclick:e=>expMenu(e.currentTarget)},"Exportar"),del));
  const zbox=h("div",{class:"zbox"},h("button",{type:"button",class:"icb",title:"Desfazer (Ctrl+Z)","aria-label":"Desfazer",onclick:()=>{selO=null;hovO=null;const u=undo.pop();if(!u){toast("Nada para desfazer.");return}const nu=JSON.parse(u),same=JSON.stringify(nu.params)===JSON.stringify(o.params);Object.assign(o,nu);fill();same?redraw():regen()}},svgI("M9 14L4 9l5-5M4 9h10a6 6 0 0 1 0 12h-3")),
    h("button",{type:"button",class:"icb",title:"Afastar","aria-label":"Afastar",onclick:()=>zoomMid(1/1.4)},"−"),zl,h("button",{type:"button",class:"icb",title:"Aproximar","aria-label":"Aproximar",onclick:()=>zoomMid(1.4)},"+"),h("button",{type:"button",class:"icb",title:"Ajustar à tela","aria-label":"Ajustar à tela",onclick:()=>{Z.k=1;Z.x=Z.y=0;applyZ()}},"⤢"));
  ov.st.onChange=drawCtx;ov.st.onSnap=snap;fill();body.append(h("div",{class:"mwrap"},view,busy,pal,ctx,zbox,hint),par);main.append(h("div",{class:"mapv"},head,body,status));setTool("move");applyZ();regen()}
function openMap(id,flash){S.sec="maps";S.map=id;undo=[];tool="move";closePlace();drawAll(flash);$("#side").classList.remove("open")}
function drawMap(flash){const o=S.maps.get(S.map),main=$("#main");main.replaceChildren();if(!o)return drawWelcome();if(o.type==="city"&&window.AtlasCity)return drawCityMap(o,main,flash);
  o.params=Object.assign({},DEF,o.params);o.edits=o.edits||[];o.pins=o.pins||[];o.objs=o.objs||[];
  const mc=h("canvas",{id:"mc",width:A.CW,height:A.CH,"aria-label":"Mapa"}),mo=h("canvas",{id:"mo",width:A.CW,height:A.CH}),pins=h("div",{id:"mpins"}),stage=h("div",{class:"stage"},mc,mo,pins),busy=h("div",{class:"busy"},"Gerando…"),status=h("div",{class:"status"});
  const view=h("div",{class:"view"},stage),octx=mo.getContext("2d");let sel=null,draft=[];
  const ov=mkOverlay(o,A.CW,A.CH,nm=>{if(!cur)return null;const n=norm(nm),t=(o.lock||[]).find(z=>norm(z.name)===n);if(t)return cur.info.project(t.x,t.y);const pn=o.pins.find(z=>norm(z.label)===n);if(pn)return cur.info.project(pn.x,pn.y);const pl=findPlace(nm);if(pl&&pl.map.type==="city"&&pl.map.src&&pl.map.src.map===o.id){const t2=(o.lock||[]).find(z=>z.name===pl.map.src.town);if(t2)return cur.info.project(t2.x,t2.y)}return null});stage.insertBefore(ov.svg,pins);
  // zoom e arrasto
  const Z={k:1,x:0,y:0};
  const applyZ=()=>{const vw=view.clientWidth,vh=view.clientHeight;Z.x=clamp(Z.x,vw-vw*Z.k,0);Z.y=clamp(Z.y,vh-vh*Z.k,0);stage.style.transform="translate("+Z.x+"px,"+Z.y+"px) scale("+Z.k+")";stage.style.setProperty("--k",Z.k);ov.setK(Z.k);zl.textContent=Math.round(Z.k*100)+"%"};
  const zoomAt=(cx,cy,f)=>{const k2=clamp(Z.k*f,1,8);Z.x=cx-(cx-Z.x)*k2/Z.k;Z.y=cy-(cy-Z.y)*k2/Z.k;Z.k=k2;applyZ()};
  const fitWrap=()=>{const w=view.parentNode;if(w&&!matchMedia("(max-width:860px)").matches)w.style.maxWidth="calc((100vh - 190px) * "+mc.width+" / "+mc.height+")";else if(w)w.style.maxWidth=""};
  const zoomMid=f=>zoomAt(view.clientWidth/2,view.clientHeight/2,f),zl=h("span",{class:"zl"},"100%");
  const snap=()=>{undo.push(JSON.stringify({params:o.params,edits:o.edits,lock:o.lock,pins:o.pins,objs:o.objs,vec:o.vec||null,realms:o.realms}));if(undo.length>30)undo.shift()};
  S.snap=snap;
  function recompose(){if(!cur||!cur.info.compose){regen();return}const t0=performance.now();try{cur.info.compose(o.objs,o.edits.filter(e=>e.t==="erase"))}catch(e){console.error(e);regen();return}Store.save("maps",o);octx.clearRect(0,0,A.CW,A.CH);status.textContent=status.textContent.replace(/(, )?\d+ ms$/,"")+", "+Math.round(performance.now()-t0)+" ms"}
  function regen(){busy.hidden=false;setTimeout(()=>{const t0=performance.now();try{
      const P=Object.assign({},o.params,{edits:o.edits,lock:o.lock,vec:o.vec,objs:o.objs,title:o.name}),mkLock=W=>W.towns.map(t=>{const z={x:t.x,y:t.y,size:t.size,kind:t.kind,planned:t.planned,name:t.name,dens:Math.round(t.dens*100)/100,wall:!!t.wall,race:t.race};if(t.lockOutline)z.outline=t.lockOutline;if(t.lockSt)z.st=t.lockSt;return z});
      let W=A.generate(P);if(!(o.lock&&o.lock.length))W=A.generate(Object.assign({},P,{lock:mkLock(W),vec:W.vec}));const info=A.render(W,mc,A.makeStamps(A.mulberry(W.seed^77)));
      o.lock=mkLock(W);o.vec=W.vec;cur={W,info};S.cur=cur;if(mo.width!==mc.width||mo.height!==mc.height){mo.width=mc.width;mo.height=mc.height}view.style.aspectRatio=mc.width+"/"+mc.height;fitWrap();applyZ();drawPins();ov.draw();Store.save("maps",o);
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
    for(const t of o.lock||[]){const p=cur.info.project(t.x,t.y);const cm=[...S.maps.values()].find(m=>m.type==="city"&&m.src&&m.src.map===o.id&&m.src.town===t.name),b=h("button",{class:"hit"+(cm?" hascity":""),type:"button",title:t.name+(cm?" · duplo clique abre o mapa da cidade":""),"aria-label":t.name,style:pos(p),onclick:()=>openPlace({kind:"town",name:t.name}),ondblclick:()=>{if(cm)openMap(cm.id)}});if(fl&&norm(fl)===norm(t.name))b.classList.add("flash");pins.append(b)}
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
    else if(tool==="road"||tool==="river"||(tool==="street"&&cityI>=0)){draft.push(w);drawDraft()}
    else if(tool==="border"){const r=mc.getBoundingClientRect();ov.tap(w.cx,w.cy,16*A.CW/r.width)}}
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
    h("button",{type:"button",onclick:async()=>{const cv=document.createElement("canvas");cv.width=mc.width;cv.height=mc.height;cv.getContext("2d").drawImage(mc,0,0);await svgOnto(cv,ov.svg);cv.toBlob(b=>saveFile(safe(o.name)+".png",b))}},"Salvar PNG"),del));
  // paleta de ferramentas (flutuante, por grupo)
  const pal=h("div",{class:"pal",role:"toolbar","aria-label":"Ferramentas"}),ctx=h("div",{class:"ctx"}),hint=h("div",{class:"hintc"});
  const tipFor=(l)=>l;
  TOOLGROUPS.forEach(([g,items],gi)=>{const grp=h("div",{class:"pgrp","aria-label":g});if(gi)pal.append(h("span",{class:"psep"}));
    for(const [t,l] of items){const b=h("button",{type:"button",class:"tbtn","data-t":t,"aria-label":l,title:l,onclick:()=>setTool(t)},svgI(ICON[t]),h("span",{class:"tip"},l));grp.append(b)}pal.append(grp)});
  const HINT={border:"Toque numa fronteira para editar · use + Desenhar fronteira para criar outra",move:"Arraste para mover · roda do mouse ou dois dedos para aproximar · toque num povoado para abrir a nota",lines:"Arraste um ponto para mudar o traçado · toque em + para criar um ponto",road:"Toque no mapa para marcar os pontos da estrada",river:"Toque no mapa da nascente à foz",town:"Toque onde quer o novo povoado",untown:"Toque no povoado que quer remover",pin:"Toque onde quer o pino",obj:"Toque no mapa para colocar o objeto escolhido",erase:"Pinte por cima do que quer apagar",biome:"Pinte para transformar a área no bioma escolhido",city:"Toque no nome de um povoado para editar contorno e ruas",street:"Escolha o povoado e marque os pontos da rua"};
  const brushSl=()=>h("label",{class:"cf"},"Pincel",h("input",{type:"range",min:20,max:140,value:brush,"aria-label":"Tamanho do pincel",oninput:e=>brush=+e.target.value}));
  const B_=(label,fn,cls)=>h("button",{type:"button",class:cls||"",onclick:fn},label);
  const finish=()=>{if(draft.length<2){toast("Marque pelo menos dois pontos no mapa.");return}snap();o.vec=o.vec||{rivers:[],roads:[]};const c=draft.map(d=>[Math.round(d.x),Math.round(d.y)]);if(tool==="street"){const L=matCity(cityI);if(!L){toast("Escolha um povoado primeiro.");return}L.st.push({c,m:0})}else if(tool==="river")o.vec.rivers.push({c,w:10});else o.vec.roads.push(c);draft=[];regen()};
  const rmPoint=()=>{if(!sel){toast("Toque num ponto primeiro.");return}snap();if(sel.kind==="o"||sel.kind==="s")matCity(sel.i);const c=lineOf(sel.kind,sel.i,sel.k),min=sel.kind==="o"?4:3;if(c.length<min){if(sel.kind==="o"){toast("O contorno precisa de pelo menos 3 pontos.");undo.pop();return}removeLine(sel)}else c.splice(sel.j,1);sel=null;regen()};
  const rmLine=()=>{if(!sel){toast("Toque num ponto da linha primeiro.");return}if(sel.kind==="o"){toast("O contorno não pode ser removido. Use Restaurar cidade.");return}snap();if(sel.kind==="s")matCity(sel.i);removeLine(sel);sel=null;regen()};
  const restore=()=>{if(cityI<0||!o.lock[cityI]){toast("Escolha um povoado primeiro.");return}snap();delete o.lock[cityI].outline;delete o.lock[cityI].st;sel=null;regen()};
  const clearBr=()=>{if(!o.edits.length){toast("Este mapa não tem pinceladas.");return}snap();o.edits=[];regen()};
  function drawCtx(){if(tool==="border"){ctx.replaceChildren();ctx.hidden=false;ov.ctxUI(ctx,()=>{if(!cur)return;snap();const R=autoRealmsRegion(o,cur);if(!R||!R.length){toast("Este mapa não tem povoados para servir de capital.");return}o.realms=o.realms.filter(r=>!r.auto).concat(R);Store.save("maps",o);ov.draw();drawCtx()},"Gerar reinos automáticos");hint.textContent=HINT.border;return}
    ctx.replaceChildren();const name=(TOOLGROUPS.flatMap(g=>g[1]).find(x=>x[0]===tool)||["",""])[1];ctx.append(h("strong",{class:"cname"},name));
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
  const setTool=t=>{ov.setOn(t==="border");if(!(t==="city"||t==="street")||!(tool==="city"||tool==="street"))cityI=-1;tool=t;draft=[];sel=null;drawDraft();stage.classList.toggle("draw",!["move","lines","city"].includes(t));view.classList.toggle("grab",["move","lines","city"].includes(t));for(const b of pal.querySelectorAll("button[data-t]"))b.setAttribute("aria-pressed",String(b.dataset.t===t));drawCtx();drawPins()};
  const undoB=h("button",{type:"button",class:"icb",title:"Desfazer (Ctrl+Z)","aria-label":"Desfazer",onclick:()=>{const u=undo.pop();if(!u){toast("Nada para desfazer.");return}const nu=JSON.parse(u),J=JSON.stringify,ne=a=>J((a||[]).filter(e=>e.t!=="erase")),te=a=>J((a||[]).filter(m=>OBJTERR.has(m.v)));const fast=cur&&J(nu.params)===J(o.params)&&J(nu.lock)===J(o.lock)&&J(nu.vec||null)===J(o.vec||null)&&ne(nu.edits)===ne(o.edits)&&te(nu.objs)===te(o.objs);Object.assign(o,nu);sel=null;fill();ov.draw();fast?(drawPins(),recompose()):regen()}},svgI("M9 14L4 9l5-5M4 9h10a6 6 0 0 1 0 12h-3"));
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
  ov.st.onChange=drawCtx;ov.st.onSnap=snap;fill();body.append(h("div",{class:"mwrap"},view,busy,pal,ctx,zbox,hint),par);
  main.append(h("div",{class:"mapv"},head,body,status));setTool("move");fitWrap();applyZ();
  busy.hidden=false;setTimeout(()=>{regen();if(flash)setTimeout(()=>drawPins(flash),500)},20)}

// ---------- missoes, fronteiras e lugares nos mapas ----------
const RCOL=["#a8352a","#3f6f8f","#5f7e35","#8a4a7a","#c98f45","#2f7f74","#6b5a3a","#b5476f"];
const RKIND=[["reino","Reino"],["ducado","Ducado ou condado"],["cidade","Cidade ou bairro"],["regiao","Região"],["perigo","Zona de perigo"]];
const QST=[["aberta","Aberta"],["andamento","Em andamento"],["concluida","Concluída"],["falhou","Falhou"]];
const quests=()=>[...S.notes.values()].filter(n=>fm(n.content).props.tipo==="missao");
const qState=n=>fm(n.content).props.status||"aberta";
function qWaits(n){const t=norm(n.title),out=[];for(const x of splitL(fm(n.content).props.requer)){const q=findNote(x);if(q&&qState(q)!=="concluida")out.push(q)}for(const q of quests()){if(q.id!==n.id&&qState(q)!=="concluida"&&splitL(fm(q.content).props.libera).some(x=>norm(x)===t)&&!out.includes(q))out.push(q)}return out}
const snippet=n=>fm(n.content).body.split("\n").filter(l=>!/^\s*(#|>|- \[ \]\s*$)/.test(l)).join("\n").replace(/- \[[ xX]\] /g,"").replace(/!\[\[img:[\w-]+\]\]/g,"").replace(/%%[^%]*%%/g,"").replace(/> \[!segredo\][\s\S]*?(\n\n|$)/gi,"").replace(/[#>*_`\[\]|-]/g," ").replace(/\s+/g," ").trim().slice(0,160);
function chaik(P,closed,it){let a=P;for(let k=0;k<it;k++){const o=[],n=a.length,m=closed?n:n-1;if(!closed)o.push(a[0]);for(let i=0;i<m;i++){const p=a[i],q=a[(i+1)%n];o.push([p[0]*.75+q[0]*.25,p[1]*.75+q[1]*.25],[p[0]*.25+q[0]*.75,p[1]*.25+q[1]*.75])}if(!closed)o.push(a[n-1]);a=o}return a}
// contorno de uma mascara (marching squares); pontos em coordenadas dobradas da grade
function traceMask(m,gw,gh){const v=(x,y)=>x>=0&&y>=0&&x<gw&&y<gh&&m[y*gw+x]?1:0,adj=new Map(),K=(x,y)=>x+","+y,link=(a,b)=>{const ka=K(a[0],a[1]),kb=K(b[0],b[1]);if(!adj.has(ka))adj.set(ka,{p:a,n:[]});if(!adj.has(kb))adj.set(kb,{p:b,n:[]});adj.get(ka).n.push(kb);adj.get(kb).n.push(ka)};
  for(let j=-1;j<gh;j++)for(let i=-1;i<gw;i++){const c=v(i,j)*8+v(i+1,j)*4+v(i+1,j+1)*2+v(i,j+1);if(!c||c===15)continue;const T=[2*i+1,2*j],R=[2*i+2,2*j+1],B=[2*i+1,2*j+2],L=[2*i,2*j+1];
    const S2={1:[[L,B]],2:[[B,R]],3:[[L,R]],4:[[T,R]],5:[[T,R],[L,B]],6:[[T,B]],7:[[T,L]],8:[[T,L]],9:[[T,B]],10:[[T,L],[B,R]],11:[[T,R]],12:[[L,R]],13:[[B,R]],14:[[L,B]]}[c];for(const [a,b] of S2)link(a,b)}
  const seen=new Set(),loops=[];for(const [k,nd] of adj){if(seen.has(k))continue;const loop=[];let cur=k,prev=null,g=0;while(cur&&!seen.has(cur)&&g++<1e6){seen.add(cur);const z=adj.get(cur);loop.push(z.p);const nx=z.n.find(x=>x!==prev&&!seen.has(x));prev=cur;cur=nx}if(loop.length>5)loops.push(loop)}return loops}
function maskRealms(owner,n,gw,gh,toCanvas,step){const out=[];for(let k=0;k<n;k++){const m=new Uint8Array(gw*gh);let c=0;for(let q=0;q<m.length;q++)if(owner[q]===k){m[q]=1;c++}if(c<4){out.push(null);continue}const loops=traceMask(m,gw,gh).sort((a,b)=>b.length-a.length);if(!loops.length){out.push(null);continue}
  const L=loops[0].filter((_,q)=>q%(step||3)===0).map(p=>toCanvas(p[0]/2,p[1]/2)).map(p=>[Math.round(p[0]*10)/10,Math.round(p[1]*10)/10]);out.push(L.length>=3?L:null)}return out}
function cityPlaces(o,C){const out=[],seen=new Set(),add=(k,name,x,y,ex)=>{if(!name||seen.has(norm(name)))return;seen.add(norm(name));out.push(Object.assign({k,name,x:Math.round(x),y:Math.round(y)},ex||{}))};add("c",o.name,C.cx,C.cy);
  for(const d of C.districts)add("d",d.name,d.x,d.y,{t:d.type});for(const l of C.LEG||[])add("b",l.name,l.x,l.y,{t:l.id});
  for(const a of C.AVE||[]){const n=C.nodes[a.ids[a.ids.length>>1]];if(n)add("r",a.name,n.x,n.y)}
  for(const g of C.gates){const n=C.nodes[g],a=Math.atan2(n.y-C.cy,n.x-C.cx);add("g","Portão "+["Leste","Sul","Oeste","Norte"][((Math.round(a/1.5708)%4)+4)%4]+" de "+o.name.replace(/^Cidade de /i,""),n.x,n.y)}return out}
function syncTown(o){if(!o.src)return;const reg=S.maps.get(o.src.map);if(!reg||!reg.lock)return;const t=reg.lock.find(z=>z.name===o.src.town);if(!t)return;let ch=false;const nm=o.name.replace(/^Cidade de /i,"").trim();
  if(nm&&nm!==t.name&&!reg.lock.some(z=>z!==t&&z.name===nm)){t.name=nm;o.src.town=nm;ch=true}if(o.params.culture&&t.race!==o.params.culture){t.race=o.params.culture;ch=true}const wl=o.params.wall!=="nenhuma";if(!!t.wall!==wl){t.wall=wl;ch=true}if(ch){reg.updated=now();Store.save("maps",reg);Store.save("maps",o)}}
function qMenu(anchor,list){let c=$("#qmenu");if(c)c.remove();const r=anchor.getBoundingClientRect();c=h("div",{id:"qmenu",class:"mpop fixed",style:"left:"+Math.min(innerWidth-280,r.left)+"px;top:"+(r.bottom+6)+"px"},h("button",{type:"button",class:"x","aria-label":"Fechar",onclick:()=>c.remove()},"×"),h("small",{},"Missões aqui"),h("div",{class:"qlist"},list.map(n=>h("button",{type:"button",class:"qi q-"+qState(n),onclick:()=>{c.remove();openNote(n.id)}},n.title))));document.body.append(c);setTimeout(()=>document.addEventListener("pointerdown",function f(e){if(!c.contains(e.target)){c.remove();document.removeEventListener("pointerdown",f)}}),0)}
// camada SVG por cima do mapa: fronteiras, marcadores de missao, destaque
function mkOverlay(o,W,H,place){const NS="http://www.w3.org/2000/svg",svg=document.createElementNS(NS,"svg");svg.setAttribute("viewBox","0 0 "+W+" "+H);svg.setAttribute("class","ovl");o.realms=o.realms||[];
  const st={k:1,on:false,sel:-1,draft:null,armed:false,flash:null,onChange:()=>{},onSnap:()=>{}};
  const el=(t,a,p)=>{const e=document.createElementNS(NS,t);for(const k in a)if(a[k]!=null)e.setAttribute(k,a[k]);(p||svg).append(e);return e},pts=a=>a.map(p=>(+p[0]).toFixed(1)+","+(+p[1]).toFixed(1)).join(" ");
  const toSvg=ev=>{const m=svg.getScreenCTM();if(!m)return null;const p=new DOMPoint(ev.clientX,ev.clientY).matrixTransform(m.inverse());return [p.x,p.y]};
  const area=a=>{let s=0;for(let i=0;i<a.length;i++){const p=a[i],q=a[(i+1)%a.length];s+=p[0]*q[1]-q[0]*p[1]}return s/2};
  const cent=a=>{let x=0,y=0,A2=0;for(let i=0;i<a.length;i++){const p=a[i],q=a[(i+1)%a.length],c=p[0]*q[1]-q[0]*p[1];A2+=c;x+=(p[0]+q[0])*c;y+=(p[1]+q[1])*c}return Math.abs(A2)<1e-6?a[0]:[x/(3*A2),y/(3*A2)]};
  const inside=(a,x,y)=>{let c=false;for(let i=0,j=a.length-1;i<a.length;j=i++){const p=a[i],q=a[j];if((p[1]>y)!==(q[1]>y)&&x<(q[0]-p[0])*(y-p[1])/(q[1]-p[1])+p[0])c=!c}return c};
  const save=()=>{o.updated=now();Store.save("maps",o)},qsc=()=>(1/Math.max(1,st.k*.6)).toFixed(3),hr=r=>(r/Math.max(1,st.k*.55)).toFixed(2);
  function draw(){svg.replaceChildren();
    o.realms.forEach((r,i)=>{if(!r.pts||r.pts.length<3)return;const g=el("g",{class:"realm"+(st.on&&st.sel===i?" sel":"")}),P=pts(chaik(r.pts,true,2)),dz=r.kind==="perigo",big=r.kind==="reino";
      el("polygon",{points:P,fill:r.color,"fill-opacity":dz?.16:.07},g);el("polygon",{points:P,fill:"none",stroke:r.color,"stroke-opacity":.3,"stroke-width":big?12:8,"stroke-linejoin":"round"},g);
      el("polygon",{points:P,fill:"none",stroke:r.color,"stroke-width":big?2.6:1.8,"stroke-dasharray":big?"12 4 3 4":dz?"4 4":"9 5","stroke-linejoin":"round"},g);
      if(r.name&&r.lab!==false){const c=cent(r.pts),t=el("text",{x:c[0].toFixed(1),y:c[1].toFixed(1),class:"rlab"+(big?" big":""),"text-anchor":"middle",fill:r.color},g);t.textContent=r.name.toUpperCase()}});
    const groups=new Map();for(const n of quests()){for(const nm of splitL(fm(n.content).props.local)){const xy=place(nm);if(!xy)continue;const k=Math.round(xy[0])+","+Math.round(xy[1]);if(!groups.has(k))groups.set(k,{xy,list:[]});const G=groups.get(k);if(!G.list.includes(n))G.list.push(n)}}
    for(const {xy,list} of groups.values()){const live=list.filter(n=>!["concluida","falhou"].includes(qState(n))),m=live[0]||list[0],s=qState(m),lk=s!=="concluida"&&s!=="falhou"&&qWaits(m).length>0;
      const g=el("g",{class:"qm q-"+s+(lk?" lock":""),"data-x":xy[0].toFixed(1),"data-y":xy[1].toFixed(1),transform:"translate("+xy[0].toFixed(1)+","+xy[1].toFixed(1)+") scale("+qsc()+") translate(0,-18)",tabindex:"0",role:"button","aria-label":"Missões: "+list.map(n=>n.title).join(", ")});
      el("path",{d:"M0 12 L-6 3 A10 10 0 1 1 6 3 Z",class:"qb"},g);const t=el("text",{x:0,y:-4,"text-anchor":"middle","dominant-baseline":"central",class:"qt"},g);t.textContent=s==="concluida"?"✓":s==="falhou"?"✗":lk?"…":"!";
      if(list.length>1){el("circle",{cx:9,cy:-12,r:6,class:"qn"},g);const t2=el("text",{x:9,y:-12,"text-anchor":"middle","dominant-baseline":"central",class:"qnt"},g);t2.textContent=list.length}
      el("title",{},g).textContent=list.map(n=>n.title+" ("+(QST.find(q=>q[0]===qState(n))||["","Aberta"])[1]+")").join("\n");
      const go=e=>{e.stopPropagation();if(list.length===1)openNote(list[0].id);else qMenu(g,list)};g.addEventListener("pointerdown",e=>e.stopPropagation());g.addEventListener("click",go);g.addEventListener("keydown",e=>{if(e.key==="Enter")go(e)})}
    if(st.on&&o.realms[st.sel]){const r=o.realms[st.sel];r.pts.forEach((p,j)=>{const q=r.pts[(j+1)%r.pts.length],m=el("circle",{cx:(p[0]+q[0])/2,cy:(p[1]+q[1])/2,r:hr(3.6),class:"vm"});m.addEventListener("pointerdown",e=>{e.stopPropagation();e.preventDefault();st.onSnap();r.pts.splice(j+1,0,[(p[0]+q[0])/2,(p[1]+q[1])/2]);save();draw()})});r.pts.forEach((p,j)=>vdrag(el("circle",{cx:p[0],cy:p[1],r:hr(5.5),class:"vh"}),r,j))}
    if(st.draft&&st.draft.length){el("polyline",{points:pts(st.draft),class:"rdraft"});st.draft.forEach((p,j)=>el("circle",{cx:p[0],cy:p[1],r:hr(j?3.5:7),class:j?"vd":"vd first"}))}
    if(st.flash){el("circle",{cx:st.flash[0],cy:st.flash[1],r:14,class:"fring"});el("circle",{cx:st.flash[0],cy:st.flash[1],r:14,class:"fring b"})}}
  function vdrag(hd,r,j){let on=false,moved=false;hd.addEventListener("pointerdown",e=>{e.stopPropagation();e.preventDefault();on=true;moved=false;try{hd.setPointerCapture(e.pointerId)}catch(x){}});
    hd.addEventListener("pointermove",e=>{if(!on)return;const p=toSvg(e);if(!p)return;if(!moved){st.onSnap();moved=true}r.pts[j]=[Math.round(p[0]*10)/10,Math.round(p[1]*10)/10];hd.setAttribute("cx",p[0]);hd.setAttribute("cy",p[1]);const g=svg.querySelector(".realm.sel");if(g){const P=pts(chaik(r.pts,true,2));g.querySelectorAll("polygon").forEach(pg=>pg.setAttribute("points",P))}});
    hd.addEventListener("pointerup",()=>{if(!on)return;on=false;if(moved){save();draw()}});hd.addEventListener("dblclick",e=>{e.stopPropagation();if(r.pts.length>3){st.onSnap();r.pts.splice(j,1);save();draw()}})}
  function finish(){if(!st.draft||st.draft.length<3)return;st.onSnap();const n=o.realms.length;o.realms.push({id:uid("r"),name:"Nova fronteira",kind:n?"ducado":"reino",color:RCOL[n%RCOL.length],pts:st.draft});st.sel=n;st.draft=null;save();draw();st.onChange()}
  function tap(x,y,tol){if(st.draft){const f=st.draft[0];if(st.draft.length>=3&&Math.hypot(f[0]-x,f[1]-y)<tol){finish();return}st.draft.push([Math.round(x*10)/10,Math.round(y*10)/10]);draw();st.onChange();return}
    if(st.armed||!o.realms.length){st.armed=false;st.sel=-1;st.draft=[[Math.round(x*10)/10,Math.round(y*10)/10]];draw();st.onChange();return}
    let bi=-1,ba=1e18;o.realms.forEach((r,i)=>{if(r.pts&&inside(r.pts,x,y)){const a=Math.abs(area(r.pts));if(a<ba){ba=a;bi=i}}});if(bi>=0&&bi!==st.sel){st.sel=bi;draw();st.onChange();return}
    if(bi<0){st.sel=-1;st.draft=[[Math.round(x*10)/10,Math.round(y*10)/10]];draw();st.onChange()}}
  function ctxUI(box,auto,autoLabel){box.append(h("strong",{class:"cname"},"Fronteiras"));
    if(st.draft){box.append(h("span",{class:"cf"},st.draft.length<3?"Continue tocando no mapa para marcar a fronteira":"Toque no primeiro ponto (o maior) para fechar"),h("button",{type:"button",class:"primary",disabled:st.draft.length<3,onclick:finish},"Fechar fronteira"),h("button",{type:"button",class:"ghost",onclick:()=>{st.draft.pop();if(!st.draft.length)st.draft=null;draw();st.onChange()}},"Voltar um ponto"),h("button",{type:"button",class:"ghost",onclick:()=>{st.draft=null;draw();st.onChange()}},"Cancelar"));return}
    const r=o.realms[st.sel];
    const drawNew=h("button",{type:"button",class:st.armed?"primary":"","aria-pressed":String(st.armed),onclick:()=>{st.armed=!st.armed;st.sel=-1;draw();st.onChange()}},"+ Desenhar fronteira");
    if(!r){box.append(h("span",{class:"cf"},st.armed||!o.realms.length?"Toque no mapa ponto a ponto para desenhar":"Toque numa fronteira para editar"));if(o.realms.length)box.append(drawNew);if(auto)box.append(h("button",{type:"button",class:"primary",onclick:auto},autoLabel||"Gerar automáticas"));if(o.realms.length)box.append(h("button",{type:"button",class:"ghost",onclick:()=>{st.onSnap();o.realms=[];save();draw();st.onChange()}},"Apagar todas"));return}
    const set=(k,v)=>{st.onSnap();r[k]=v;save();draw()},note=findNote(r.name);
    box.append(h("label",{class:"cf"},"Nome",h("input",{type:"text",value:r.name||"","aria-label":"Nome da fronteira",onchange:e=>{set("name",e.target.value.trim());st.onChange()}})),
      h("label",{class:"cf"},"Tipo",h("select",{"aria-label":"Tipo de fronteira",onchange:e=>set("kind",e.target.value)},RKIND.map(([v,n])=>h("option",{value:v,selected:v===r.kind},n)))),
      h("span",{class:"sws",role:"group","aria-label":"Cor"},RCOL.map(c=>h("button",{type:"button",class:"sw"+(c===r.color?" on":""),style:"background:"+c,"aria-label":"Cor","aria-pressed":String(c===r.color),onclick:()=>{set("color",c);st.onChange()}}))),
      h("button",{type:"button",onclick:()=>{const n=findNote(r.name)||newNote(r.kind==="reino"||r.kind==="ducado"?"faccao":"local",r.name);openNote(n.id)}},note?"Abrir nota":"Criar nota"),
      h("label",{class:"chk"},h("input",{type:"checkbox",checked:r.lab!==false,onchange:e=>set("lab",e.target.checked)}),"Nome no mapa"),h("button",{type:"button",class:"danger ghost",onclick:()=>{st.onSnap();o.realms.splice(st.sel,1);st.sel=-1;save();draw();st.onChange()}},"Apagar"),
      h("button",{type:"button",class:"ghost",onclick:()=>{st.sel=-1;draw();st.onChange()}},"Pronto"),drawNew,h("span",{class:"cf dim"},"Arraste os pontos · toque duas vezes num ponto para tirar"))}
  return {svg,draw,tap,ctxUI,st,setK(k){const old=st.k;st.k=k;const s=qsc();svg.querySelectorAll(".qm").forEach(g=>g.setAttribute("transform","translate("+g.getAttribute("data-x")+","+g.getAttribute("data-y")+") scale("+s+") translate(0,-18)"));if(st.on&&Math.abs(old-k)>.05)draw()},setOn(v){st.on=v;if(!v){st.draft=null;st.sel=-1}draw()},flash(x,y){st.flash=[x,y];draw();setTimeout(()=>{st.flash=null;draw()},3200)}}}
function autoRealmsRegion(o,cur){const W=cur.W,sg=A.sampleGrid,towns=W.towns.filter(t=>t.kind!=="camp");let caps=towns.filter(t=>t.kind==="city");if(caps.length<2)caps=towns.slice().sort((a,b)=>b.size-a.size).slice(0,Math.min(4,towns.length));caps=caps.slice(0,7);if(!caps.length)return null;
  const st=10,gw=Math.ceil(A.WX/st),gh=Math.ceil(A.WY/st),own=new Int16Array(gw*gh).fill(-1);
  for(let j=0;j<gh;j++)for(let i=0;i<gw;i++){const x=i*st,y=j*st;if(sg(W.land,x,y)<0)continue;let bi=-1,bd=1e18;caps.forEach((c,k)=>{const d=Math.hypot(c.x-x,c.y-y)/(1+Math.sqrt(c.size)*.07);if(d<bd){bd=d;bi=k}});own[j*gw+i]=bi}
  const L=maskRealms(own,caps.length,gw,gh,(i,j)=>cur.info.project(clamp(i*st,0,A.WX-1),clamp(j*st,0,A.WY-1)),3);
  return caps.map((c,k)=>L[k]&&{id:uid("r"),name:"Reino de "+c.name,kind:"reino",color:RCOL[k%RCOL.length],pts:L[k],auto:1}).filter(Boolean)}
function autoRealmsCity(o,C,info){const AC=window.AtlasCity,ds=C.districts.filter(d=>d.type!=="estrangeiro"||true),pm=new Map();ds.forEach((d,k)=>{for(const p of d.ps)pm.set(p,k)});let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9;for(const d of ds)for(const p of d.ps)for(const v of p.poly){x0=Math.min(x0,v[0]);y0=Math.min(y0,v[1]);x1=Math.max(x1,v[0]);y1=Math.max(y1,v[1])}
  const st=7,gw=Math.ceil((x1-x0)/st)+1,gh=Math.ceil((y1-y0)/st)+1,own=new Int16Array(gw*gh).fill(-1);for(let j=0;j<gh;j++)for(let i=0;i<gw;i++){const p=AC.patchAt(C,x0+i*st,y0+j*st);if(p&&pm.has(p))own[j*gw+i]=pm.get(p)}
  const TC={nobre:"#8a4a7a",mercado:"#c98f45",mercadores:"#c98f45",porto:"#3f6f8f",templo:"#d9a441",castelo:"#a8352a",pobre:"#6b5a3a",producao:"#5f7e35",artesaos:"#2f7f74",arrabalde:"#6b5a3a",estrangeiro:"#b5476f"};
  const L=maskRealms(own,ds.length,gw,gh,(i,j)=>info.project(x0+i*st,y0+j*st),2);return ds.map((d,k)=>L[k]&&{id:uid("r"),name:d.name,kind:"cidade",color:TC[d.type]||RCOL[k%RCOL.length],pts:L[k],auto:1,lab:false}).filter(Boolean)}
// exportar imagem com a camada SVG por cima
function svgOnto(canvas,svg,S2){return new Promise(res=>{const cl=svg.cloneNode(true);cl.setAttribute("width",canvas.width);cl.setAttribute("height",canvas.height);cl.querySelectorAll(".vh,.vm,.vd,.rdraft,.fring").forEach(e=>e.remove());const css="text{font-family:Georgia,serif}.rlab{font-size:15px;letter-spacing:.2em;paint-order:stroke;stroke:#efe7d0;stroke-width:4px}.rlab.big{font-size:22px}.qb{fill:#d9a441;stroke:#1d160d;stroke-width:1.2}.q-concluida .qb{fill:#8f8a80}.q-falhou .qb{fill:#7a3a30}.lock .qb{fill:#b9a37a}.qt{font:bold 11px Georgia;fill:#1d160d}.qn{fill:#a8352a}.qnt{font:bold 8px Georgia;fill:#fff}";
  const sty=document.createElementNS("http://www.w3.org/2000/svg","style");sty.textContent=css;cl.prepend(sty);const url=URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(cl)],{type:"image/svg+xml"})),im=new Image();im.onload=()=>{canvas.getContext("2d").setTransform(1,0,0,1,0,0);canvas.getContext("2d").drawImage(im,0,0,canvas.width,canvas.height);URL.revokeObjectURL(url);res()};im.onerror=()=>{URL.revokeObjectURL(url);res()};im.src=url})}

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
  acts.append(h("button",{type:"button",onclick:()=>{const n=newNote("missao","Missão em "+name);setProps(n,{status:"aberta",local:name});openNote(n.id,"edit")}},"+ Missão aqui"));
  if(pin)acts.append(h("button",{type:"button",class:"danger",onclick:()=>{o.pins=o.pins.filter(p=>p!==pin);Store.save("maps",o);S.redrawPins&&S.redrawPins();closePlace()}},"Remover pino"));
  box.append(h("div",{class:"row"},h("h2",{},kindTxt),h("span",{class:"grow"}),h("button",{type:"button",onclick:closePlace},"Fechar")),nm,acts);
  {const qs=quests().filter(n=>splitL(fm(n.content).props.local).some(x=>norm(x)===norm(name)));if(qs.length)box.append(h("div",{class:"qlist"},h("small",{},"Missões aqui"),qs.map(n=>h("button",{type:"button",class:"qi q-"+qState(n),onclick:()=>openNote(n.id)},n.title))))}
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
    const V=S.view||"list",views=h("div",{class:"vtabs",role:"tablist","aria-label":"Ver notas como"},[["list","Lista"],["quests","Missões"],["graph","Grafo"],["time","Tempo"]].map(([v,l])=>h("button",{type:"button",role:"tab","aria-selected":String(V===v),class:V===v?"on":"",onclick:()=>{S.view=v==="list"?null:v;drawAll()}},l)));
    const q=h("input",{type:"search",placeholder:"Buscar (título, texto ou ficha)",value:S.q,"aria-label":"Buscar notas",oninput:e=>{S.q=e.target.value;drawList()}}),list=h("div",{class:"list"});
    const all0=[...S.notes.values()],tyOf=n=>fm(n.content).props.tipo||"livre",tags=new Map();for(const n of all0)for(const t of tagsOf(n))tags.set(t,(tags.get(t)||0)+1);
    const used=Object.entries(TYPES).filter(([k])=>all0.some(n=>tyOf(n)===k));
    const flt=h("div",{class:"fbar"},used.length>1?used.map(([k,v])=>h("button",{type:"button",class:"fc"+(S.ft===k?" on":""),style:"--c:"+TCOL[k],"aria-pressed":String(S.ft===k),onclick:()=>{S.ft=S.ft===k?null:k;drawSide();if(S.view)drawMain()}},v)):null,[...tags].sort((a,b)=>b[1]-a[1]).slice(0,14).map(([t])=>h("button",{type:"button",class:"fc tagc"+(S.tag===t?" on":""),"aria-pressed":String(S.tag===t),onclick:()=>{S.tag=S.tag===t?null:t;drawSide();if(S.view)drawMain()}},"#"+t)));
    const drawList=()=>{list.replaceChildren();const qq=norm(S.q),all=visNotes().filter(n=>!qq||norm(n.title).includes(qq)||norm(n.content).includes(qq)).sort((a,b)=>(a.folder||"").localeCompare(b.folder||"")||a.title.localeCompare(b.title));
      if(!all.length){list.append(h("p",{class:"empty"},qq||S.ft||S.tag?"Nada encontrado.":"Nenhuma nota ainda."));return}let g=null;
      for(const n of all){if((n.folder||"")!==g){g=n.folder||"";list.append(h("div",{class:"grp"},g||"Sem pasta"))}const ty=tyOf(n),pr=fm(n.content).props,sub=ty==="missao"?(QST.find(x=>x[0]===(pr.status||"aberta"))||["",""])[1]:pr.papel||pr.categoria||"";
        list.append(h("button",{class:"item"+(n.id===S.note?" on":""),type:"button",onclick:()=>openNote(n.id)},h("i",{class:"dot",style:"background:"+TCOL[ty]}),n.title,sub&&norm(sub)!==norm(n.title)?h("small",{},sub):null))}};
    side.append(h("h2",{},"Notas"),views,sel,q,flt,list);drawList()}
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
  newNote("livre","Bem-vindo ao Atlas",{content:"# Bem-vindo ao Atlas\n\nEste vault de exemplo mostra o básico.\n\n- Abra **Mapas** e toque num povoado para criar a nota dele.\n- Em qualquer nota, escreva `[[Nome]]` para ligar a outra. Exemplo: [[Irmã Ludmila]].\n- No mapa, use as ferramentas para pintar terra, mar, relevo e floresta. A ferramenta **Fronteiras** desenha reinos.\n- Missões com **Onde acontece** aparecem como marcadores no mapa. Veja o quadro em **Notas › Missões**.\n- Texto entre %%dois sinais de porcentagem%% é segredo do mestre e some na **Visão dos jogadores**.\n"});
  const n=newNote("personagem","Irmã Ludmila",{content:"---\ntipo: personagem\nlocal: \n---\n\n## Aparência\n\nHábito gasto, mãos manchadas de tinta.\n\n## O que quer\n\nTerminar a crônica do mosteiro antes do inverno.\n\n## O que esconde\n\n> [!info] Só para o mestre\n> Ela sabe quem incendiou o celeiro.\n"});n.folder="Personagens";Store.save("notes",n);
  const q1=newNote("missao","O celeiro queimado",{content:"---\ntipo: missao\nstatus: andamento\nlocal: Olshany\ncontratante: Irmã Ludmila\nrecompensa: 30 groschen e a gratidão do mosteiro\nlibera: A crônica perdida\ndata: 1403-08-12\n---\n\n## Objetivo\n\nDescobrir quem pôs fogo no celeiro do mosteiro.\n\n## Etapas\n\n- [x] Falar com a [[Irmã Ludmila]]\n- [ ] Examinar as cinzas\n\n> [!segredo] O que realmente está acontecendo\n> O próprio abade mandou queimar o celeiro para esconder o desvio de grãos. %%O abade paga os guardas da ponte.%%\n"});
  newNote("missao","A crônica perdida",{content:"---\ntipo: missao\nstatus: aberta\nlocal: Tabor\nrequer: O celeiro queimado\nrecompensa: Um mapa antigo do vale\n---\n\n## Objetivo\n\nRecuperar a crônica que a Irmã Ludmila escondeu antes do incêndio.\n"});
  newNote("sessao","Sessão 1",{content:"---\ntipo: sessao\ndata: 1403-08-12\njogadores: Ana, Bruno, Caio\nlugares: Olshany\n---\n\n## Onde paramos\n\nO grupo chegou a Olshany ao anoitecer e viu a fumaça do celeiro.\n\n## Missões\n\n- [[O celeiro queimado]]\n"});
  S.sec="notes";drawAll();toast("Mundo de exemplo criado.")}
function drawMain(flash){if(S.sec==="notes"){if(S.view==="graph")drawGraph();else if(S.view==="time")drawTime();else if(S.view==="quests")drawQuests();else drawNote()}else drawMap(flash)}
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
function exportVault(players){const files=[],used=new Set();const put=(name,data)=>{let n=name,k=2;while(used.has(n.toLowerCase()))n=name.replace(/(\.[^.]+(\.json)?)$/," "+(k++)+"$1");used.add(n.toLowerCase());files.push({name:n,data})};
  for(const n of S.notes.values()){let c=n.content||"";if(players)c=stripSecrets(c);c=c.replace(/!\[\[img:([\w-]+)\]\]/g,(m,id)=>n.images&&n.images[id]?"![]("+n.images[id]+")":"");put((n.folder?n.folder.split("/").map(safe).join("/")+"/":"")+safe(n.title)+".md",c)}
  if(!players)for(const m of S.maps.values())put("mapas/"+safe(m.name)+".map.json",JSON.stringify({name:m.name,type:m.type||"region",params:m.params,edits:m.edits||[],towns:m.lock||[],pins:m.pins||[],realms:m.realms||[],objs:m.objs||[]},null,2));
  if(!files.length){toast("O vault está vazio.");return}saveFile(players?"atlas-jogadores.zip":"atlas-vault.zip",zip(files))}
async function importFiles(list){let n=0;for(const f of list){try{const txt=await f.text(),title=f.name.replace(/\.(md|markdown|txt)$/i,"");const o=newNote("livre",title,{content:txt.replace(/\r/g,"")});o.folder="Importadas";Store.save("notes",o);n++}catch(e){}}
  S.sec="notes";drawAll();toast(n?n+" nota(s) importada(s).":"Nenhum arquivo pôde ser lido.")}

const tagsOf=n=>{const out=new Set(),re=/(^|\s)#([\p{L}\d_\/-]+)/gu;let m;const b=fm(n.content).body.replace(/```[\s\S]*?```/g,"");while((m=re.exec(b)))out.add(m[2].toLowerCase());return out};
function visNotes(){return [...S.notes.values()].filter(n=>(!S.ft||(fm(n.content).props.tipo||"livre")===S.ft)&&(!S.tag||tagsOf(n).has(S.tag)))}
function viewHead(title,sub,extra){return h("div",{class:"vhead"},h("h1",{},title),sub?h("p",{class:"dim"},sub):null,extra||null)}
// quadro de missoes
function drawQuests(){const main=$("#main");main.replaceChildren();const qs=quests().filter(n=>!S.tag||tagsOf(n).has(S.tag));
  const add=h("button",{type:"button",class:"primary",onclick:()=>{const n=newNote("missao","Nova missão");openNote(n.id,"edit")}},"+ Nova missão");
  const wrap=h("div",{class:"qboard"});main.append(h("div",{class:"vwrap"},viewHead("Missões",qs.length?"Arraste não é preciso: mude a situação no próprio cartão. Missões que dependem de outras aparecem com cadeado.":"Crie uma missão aqui, ou toque num lugar do mapa e use “+ Missão aqui”.",add),wrap));
  for(const [st,label] of QST){const col=h("section",{class:"qcol q-"+st},h("h2",{},label,h("span",{class:"cnt"},String(qs.filter(n=>qState(n)===st).length))));
    for(const n of qs.filter(n=>qState(n)===st).sort((a,b)=>a.title.localeCompare(b.title))){const p=fm(n.content).props,wt=st==="aberta"||st==="andamento"?qWaits(n):[],nx=splitL(p.libera);
      const card=h("article",{class:"qcard"+(wt.length?" lock":"")},h("button",{type:"button",class:"qtitle",onclick:()=>openNote(n.id)},wt.length?"🔒 ":"",n.title),
        p.local?h("div",{class:"qline"},h("span",{},"Onde"),splitL(p.local).map(t=>h("button",{type:"button",class:"fl"+(findNote(t)||findPlace(t)?"":" miss"),onclick:()=>openTitle(t)},t))):null,
        p.contratante?h("div",{class:"qline"},h("span",{},"Quem dá"),h("button",{type:"button",class:"fl",onclick:()=>openTitle(p.contratante.replace(/^\[\[|\]\]$/g,""))},p.contratante.replace(/^\[\[|\]\]$/g,""))):null,
        p.recompensa?h("div",{class:"qline"},h("span",{},"Recompensa"),h("em",{},p.recompensa)):null,
        wt.length?h("div",{class:"qline warn"},h("span",{},"Espera"),wt.map(q=>h("button",{type:"button",class:"fl",onclick:()=>openNote(q.id)},q.title))):null,
        nx.length?h("div",{class:"qline"},h("span",{},"Leva a"),nx.map(t=>h("button",{type:"button",class:"fl"+(findNote(t)?"":" miss"),onclick:()=>openTitle(t)},t))):null,
        h("div",{class:"qfoot"},h("select",{"aria-label":"Situação de "+n.title,onchange:e=>{setProps(n,{status:e.target.value});drawQuests()}},QST.map(([v,l])=>h("option",{value:v,selected:v===st},l))),
          p.local&&findPlace(splitL(p.local)[0])?h("button",{type:"button",class:"ghost",onclick:()=>openTitle(splitL(p.local)[0])},"Ver no mapa"):null));
      col.append(card)}
    wrap.append(col)}}
// grafo de ligacoes
function drawGraph(){const main=$("#main");main.replaceChildren();const ns=visNotes();if(!ns.length){main.append(h("div",{class:"vwrap"},viewHead("Grafo","Crie notas e ligue umas às outras com [[Nome]] ou pelos campos da ficha.")));return}
  const idx=new Map(ns.map((n,i)=>[norm(n.title),i])),E=[],ek=new Set();ns.forEach((n,i)=>{const pr=fm(n.content).props,lib=new Set(splitL(pr.libera).map(norm)),req=new Set(splitL(pr.requer).map(norm));for(const t of linksOf(n)){const j=idx.get(t);if(j==null||j===i)continue;const q=lib.has(t)?[i,j,1]:req.has(t)?[j,i,1]:[i,j,0],k=Math.min(i,j)+"-"+Math.max(i,j);if(ek.has(k)&&!q[2])continue;ek.add(k);E.push(q)}});
  const N=ns.length,P=ns.map((n,i)=>{const a=i*2.39996,r=40*Math.sqrt(i+1);return {x:Math.cos(a)*r,y:Math.sin(a)*r,vx:0,vy:0}}),deg=new Array(N).fill(0);E.forEach(([a,b])=>{deg[a]++;deg[b]++});
  const IT=N>300?120:260;for(let it=0;it<IT;it++){const t=1-it/IT;for(const p of P){p.vx=-p.x*.004;p.vy=-p.y*.004}for(let i=0;i<N;i++)for(let j=i+1;j<N;j++){const a=P[i],b=P[j];let dx=a.x-b.x,dy=a.y-b.y,d2=dx*dx+dy*dy+.01;if(d2>160000)continue;const f=4200/d2;a.vx+=dx*f/Math.sqrt(d2);a.vy+=dy*f/Math.sqrt(d2);b.vx-=dx*f/Math.sqrt(d2);b.vy-=dy*f/Math.sqrt(d2)}
    for(const [i,j] of E){const a=P[i],b=P[j],dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy)||1,f=(d-120)*.025;a.vx+=dx/d*f;a.vy+=dy/d*f;b.vx-=dx/d*f;b.vy-=dy/d*f}
    for(const p of P){const v=Math.hypot(p.vx,p.vy),m=Math.min(v,24*t+1);if(v>0){p.x+=p.vx/v*m;p.y+=p.vy/v*m}}}
  let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9;for(const p of P){x0=Math.min(x0,p.x);y0=Math.min(y0,p.y);x1=Math.max(x1,p.x);y1=Math.max(y1,p.y)}const pad=80;let vb=[x0-pad,y0-pad,x1-x0+pad*2,y1-y0+pad*2];
  const NS="http://www.w3.org/2000/svg",svg=document.createElementNS(NS,"svg"),el=(t,a,p)=>{const e=document.createElementNS(NS,t);for(const k in a)e.setAttribute(k,a[k]);(p||svg).append(e);return e};svg.setAttribute("class","graph");svg.setAttribute("role","img");svg.setAttribute("aria-label","Grafo das notas");const setVB=()=>svg.setAttribute("viewBox",vb.map(v=>v.toFixed(1)).join(" "));setVB();
  const defs=el("defs",{}),mk=el("marker",{id:"arr",viewBox:"0 0 10 10",refX:"18",refY:"5",markerWidth:"7",markerHeight:"7",orient:"auto-start-reverse"},defs);el("path",{d:"M0 0L10 5L0 10z",fill:"#d9a441"},mk);
  const gE=el("g",{}),gN=el("g",{}),lines=E.map(([a,b,q])=>el("line",{x1:P[a].x,y1:P[a].y,x2:P[b].x,y2:P[b].y,class:q?"ge q":"ge","marker-end":q?"url(#arr)":null},gE));
  const nodes=ns.map((n,i)=>{const ty=fm(n.content).props.tipo||"livre",g=el("g",{class:"gn",transform:"translate("+P[i].x.toFixed(1)+","+P[i].y.toFixed(1)+")",tabindex:"0",role:"button","aria-label":n.title});const r=5+Math.min(deg[i],12)*.9;el("circle",{r,fill:TCOL[ty]},g);if(ty==="missao"&&qState(n)==="concluida")el("circle",{r:r+3,class:"done"},g);const t=el("text",{y:r+13,"text-anchor":"middle"},g);t.textContent=n.title.length>26?n.title.slice(0,25)+"…":n.title;
    g.addEventListener("click",()=>openNote(n.id));g.addEventListener("keydown",e=>{if(e.key==="Enter")openNote(n.id)});
    g.addEventListener("mouseenter",()=>{svg.classList.add("hl");g.classList.add("on");E.forEach(([a,b],k)=>{if(a===i||b===i){lines[k].classList.add("on");nodes[a===i?b:a].classList.add("on")}})});g.addEventListener("mouseleave",()=>{svg.classList.remove("hl");svg.querySelectorAll(".on").forEach(e=>e.classList.remove("on"))});gN.append(g);return g});
  let pan=null;svg.addEventListener("pointerdown",e=>{if(e.target.closest(".gn"))return;pan=[e.clientX,e.clientY];svg.setPointerCapture(e.pointerId)});svg.addEventListener("pointermove",e=>{if(!pan)return;const r=svg.getBoundingClientRect(),k=Math.max(vb[2]/r.width,vb[3]/r.height);vb[0]-=(e.clientX-pan[0])*k;vb[1]-=(e.clientY-pan[1])*k;pan=[e.clientX,e.clientY];setVB()});svg.addEventListener("pointerup",()=>pan=null);
  svg.addEventListener("wheel",e=>{e.preventDefault();const f=Math.exp(e.deltaY*.0015),r=svg.getBoundingClientRect(),k=Math.max(vb[2]/r.width,vb[3]/r.height),mx=vb[0]+(e.clientX-r.left)*k,my=vb[1]+(e.clientY-r.top)*k;vb=[mx-(mx-vb[0])*f,my-(my-vb[1])*f,vb[2]*f,vb[3]*f];setVB()},{passive:false});
  const leg=h("div",{class:"gleg"},Object.entries(TYPES).filter(([k])=>ns.some(n=>(fm(n.content).props.tipo||"livre")===k)).map(([k,v])=>h("span",{},h("i",{class:"dot",style:"background:"+TCOL[k]}),v)),E.some(e=>e[2])?h("span",{},h("i",{class:"arrow"}),"missão leva a"):null);
  main.append(h("div",{class:"vwrap gwrap"},viewHead("Grafo",N+" notas · "+E.length+" ligações · arraste para mover, roda para aproximar",leg),svg))}
// linha do tempo
const dateKey=v=>{const m=/(-?\d{1,6})(?:[-/.](\d{1,2}))?(?:[-/.](\d{1,2}))?/.exec(String(v||""));return m?(+m[1])*10000+(+(m[2]||0))*100+(+(m[3]||0)):null};
function drawTime(){const main=$("#main");main.replaceChildren();const items=visNotes().map(n=>({n,p:fm(n.content).props})).map(z=>Object.assign(z,{k:dateKey(z.p.data)})).filter(z=>z.k!=null).sort((a,b)=>a.k-b.k);
  if(!items.length){main.append(h("div",{class:"vwrap"},viewHead("Linha do tempo","Nenhuma nota tem data ainda. Preencha o campo Data (por exemplo 1272, ou 1272-05-03) na ficha de sessões, personagens, missões ou acontecimentos.")));return}
  const tl=h("ol",{class:"tline"});let yr=null;for(const {n,p,k} of items){const y=Math.floor(k/10000);if(y!==yr){yr=y;tl.append(h("li",{class:"tyear"},String(y)))}const ty=p.tipo||"livre";
    tl.append(h("li",{class:"tev",style:"--c:"+TCOL[ty]},h("span",{class:"tdate"},p.data),h("button",{type:"button",class:"tcard",onclick:()=>openNote(n.id)},h("b",{},n.title),h("small",{},TYPES[ty]+(ty==="missao"?" · "+(QST.find(x=>x[0]===qState(n))||["",""])[1]:"")),snippet(n)?h("p",{},snippet(n)):null)))}
  main.append(h("div",{class:"vwrap"},viewHead("Linha do tempo",items.length+" acontecimentos com data"),tl))}
// segredos: tirar para os jogadores
const stripSecrets=src=>{const L=String(src||"").split("\n"),o=[];for(let i=0;i<L.length;i++){if(/^>\s*\[!(segredo|secret|mestre)\]/i.test(L[i])){while(i+1<L.length&&/^>/.test(L[i+1]))i++;continue}o.push(L[i])}return o.join("\n").replace(/%%[^%]*%%/g,"")};
// Foundry VTT: um diario com uma pagina por nota
function exportFoundry(players){const ch="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789",fid=()=>{let x="";for(let i=0;i<16;i++)x+=ch[(Math.random()*62)|0];return x};
  const notes=[...S.notes.values()].sort((a,b)=>(a.folder||"").localeCompare(b.folder||"")||a.title.localeCompare(b.title)),ids=new Map(notes.map(n=>[norm(n.title),fid()]));if(!notes.length){toast("Não há notas para exportar.");return}
  const was=S.players;S.players=!!players;MDMODE="foundry";let pages;try{pages=notes.map((n,i)=>{CURIMG=n.images||null;let html=md(fm(players?stripSecrets(n.content):n.content).body);CURIMG=null;
    const sec=[];html=html.replace(/<span class="secret"[^>]*>([\s\S]*?)<\/span>/g,(_,x)=>{sec.push(x);return ""});
    html=html.replace(/<a class="wl[^"]*" data-t="([^"]*)">([\s\S]*?)<\/a>/g,(_,t,l)=>{const id=ids.get(norm(t.replace(/&amp;/g,"&")));return id?"@UUID[."+id+"]{"+l+"}":l});
    if(sec.length&&!players)html+='<section class="secret" id="secret-'+fid()+'"><p><strong>Segredos:</strong> '+sec.join(" · ")+"</p></section>";
    const {props}=fm(n.content),ty=props.tipo||"livre",fields=(FIELDS[ty]||[]).filter(([k])=>props[k]).map(([k,l,kind])=>"<li><strong>"+esc(l)+":</strong> "+(kind==="link"||kind==="links"?splitL(props[k]).map(t=>{const id=ids.get(norm(t));return id?"@UUID[."+id+"]{"+esc(t)+"}":esc(t)}).join(", "):esc(props[k]==="concluida"?"Concluída":props[k]))+"</li>").join("");
    if(n.img)html='<img src="'+n.img+'" style="float:right;max-width:220px;margin:0 0 8px 12px">'+html;if(fields)html="<ul>"+fields+"</ul>"+html;
    return {_id:ids.get(norm(n.title)),name:n.title,type:"text",title:{show:true,level:1},text:{format:1,content:html},sort:(i+1)*1e5,ownership:{default:players?2:-1},flags:{atlas:{folder:n.folder||"",tipo:ty}}}})}finally{MDMODE="";S.players=was;CURIMG=null}
  const entry={name:players?"Atlas (jogadores)":"Atlas",pages,folder:null,sort:0,ownership:{default:players?2:0},flags:{atlas:{exported:new Date().toISOString()}}};
  saveFile(players?"atlas-foundry-jogadores.json":"atlas-foundry.json",new Blob([JSON.stringify(entry)],{type:"application/json"}));toast("No Foundry: crie um diário, clique com o botão direito nele e use Importar dados.")}
function exportMenu(btn){let m=$("#expm");if(m){m.remove();return}const r=btn.getBoundingClientRect();
  m=h("div",{id:"expm",class:"mpop fixed exp",style:"left:"+Math.max(8,Math.min(innerWidth-330,r.right-320))+"px;top:"+(r.bottom+6)+"px"},h("button",{type:"button",class:"x","aria-label":"Fechar",onclick:()=>m.remove()},"×"),h("b",{},"Exportar"),
    h("button",{type:"button",class:"mi",onclick:()=>{m.remove();exportVault()}},h("b",{},"Vault completo (.zip)"),h("small",{},"Markdown para o Obsidian, com segredos e mapas")),
    h("button",{type:"button",class:"mi",onclick:()=>{m.remove();exportVault(true)}},h("b",{},"Para os jogadores (.zip)"),h("small",{},"Sem segredos do mestre")),
    h("button",{type:"button",class:"mi",onclick:()=>{m.remove();exportFoundry(false)}},h("b",{},"Foundry VTT, diário do mestre (.json)"),h("small",{},"Uma página por nota, segredos como seções secretas")),
    h("button",{type:"button",class:"mi",onclick:()=>{m.remove();exportFoundry(true)}},h("b",{},"Foundry VTT, diário dos jogadores (.json)"),h("small",{},"Sem segredos, visível para todos")));document.body.append(m);setTimeout(()=>document.addEventListener("pointerdown",function f(e){if(!m.contains(e.target)&&e.target!==btn){m.remove();document.removeEventListener("pointerdown",f)}}),0)}

// ---------- inicio ----------
let booted=false;
function ready(){if(booted)return;booted=true;if(S.maps.size&&!S.notes.size)S.sec="maps";drawAll()}
for(const b of document.querySelectorAll(".rail button"))b.addEventListener("click",()=>{S.sec=b.dataset.sec;closePlace();drawAll();if(matchMedia("(max-width:860px)").matches&&!(S.sec==="notes"?S.note:S.map))$("#side").classList.add("open")});
$("#menu").addEventListener("click",()=>$("#side").classList.toggle("open"));
document.addEventListener("keydown",e=>{if(!(e.ctrlKey||e.metaKey)||e.altKey||e.shiftKey||(e.key!=="z"&&e.key!=="Z"))return;const ae=document.activeElement;if(ae&&(/INPUT|TEXTAREA|SELECT/.test(ae.tagName)&&ae.type!=="range"||ae.isContentEditable))return;if(S.sec!=="maps")return;const b=document.querySelector('#main button[aria-label="Desfazer"]');if(b){e.preventDefault();b.click()}});
$("#bExp").addEventListener("click",e=>exportMenu(e.currentTarget));$("#bPlay").addEventListener("click",()=>{S.players=!S.players;try{localStorage.setItem("atlas-players",S.players?"1":"")}catch(e){}$("#bPlay").setAttribute("aria-pressed",String(S.players));$("#bPlay").textContent=S.players?"Visão dos jogadores":"Visão do mestre";document.body.classList.toggle("players",S.players);drawAll()});try{if(localStorage.getItem("atlas-players")){S.players=true;document.body.classList.add("players")}}catch(e){}$("#bPlay").setAttribute("aria-pressed",String(!!S.players));$("#bPlay").textContent=S.players?"Visão dos jogadores":"Visão do mestre";
$("#imp").addEventListener("change",e=>{importFiles([...e.target.files]);e.target.value=""});
$("#main").addEventListener("pointerdown",()=>$("#side").classList.remove("open"));
drawSide();$("#main").append(h("div",{class:"welcome"},h("h1",{},"Abrindo o vault…")));
Store.init();
window.AtlasApp={S,Store};
})();
