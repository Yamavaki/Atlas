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
const DEF={form:"regiao",seed:"sasau-1403",sea:.5,islands:0,lakes:0,rivers:1,relief:.65,forest:.5,fields:.65,towns:6,meander:.6,clouds:.38,plan:"mixed"};
const PARAMS=[["form","Formação","select",[["regiao","Região interior"],["costa","Costa"],["peninsula","Península"],["ilha","Ilha"],["arquipelago","Arquipélago"],["continente","Continente"]]],
  ["seed","Semente","text"],["sea","Nível do mar","pct"],["islands","Ilhas extras","int",0,6],["lakes","Lagos","int",0,4],["rivers","Rios","int",0,3],
  ["relief","Relevo","pct"],["forest","Floresta","pct"],["fields","Campos cultivados","pct"],["towns","Povoados","int",2,9],["meander","Meandros do rio principal","pct"],
  ["clouds","Nuvens na borda","pct"],["plan","Traçado das ruas","select",[["mixed","Misto"],["organic","Orgânico"],["planned","Planejado"]]]];
const STRUCT=new Set(["form","seed","towns","plan","rivers","meander","islands","lakes"]);
const TOOLS=[["move","Navegar"],["land","Terra"],["sea","Mar"],["up","Elevar"],["down","Rebaixar"],["forest","Floresta"],["clear","Clareira"],["town","Povoado"],["untown","Remover povoado"],["pin","Pino"],["lines","Editar linhas"],["road","Nova estrada"],["river","Novo rio"],["city","Editar cidade"],["street","Nova rua"]];

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
function openMap(id,flash){S.sec="maps";S.map=id;undo=[];tool="move";closePlace();drawAll(flash);$("#side").classList.remove("open")}
function drawMap(flash){const o=S.maps.get(S.map),main=$("#main");main.replaceChildren();if(!o)return drawWelcome();
  o.params=Object.assign({},DEF,o.params);o.edits=o.edits||[];o.pins=o.pins||[];
  const mc=h("canvas",{id:"mc",width:A.CW,height:A.CH,"aria-label":"Mapa"}),mo=h("canvas",{id:"mo",width:A.CW,height:A.CH}),pins=h("div",{id:"mpins"}),stage=h("div",{class:"stage"},mc,mo,pins),busy=h("div",{class:"busy"},"Gerando…"),status=h("div",{class:"status"});
  const view=h("div",{class:"view"},stage),octx=mo.getContext("2d");let sel=null,draft=[];
  // zoom e arrasto
  const Z={k:1,x:0,y:0};
  const applyZ=()=>{const vw=view.clientWidth,vh=view.clientHeight;Z.x=clamp(Z.x,vw-vw*Z.k,0);Z.y=clamp(Z.y,vh-vh*Z.k,0);stage.style.transform="translate("+Z.x+"px,"+Z.y+"px) scale("+Z.k+")";stage.style.setProperty("--k",Z.k);zl.textContent=Math.round(Z.k*100)+"%"};
  const zoomAt=(cx,cy,f)=>{const k2=clamp(Z.k*f,1,8);Z.x=cx-(cx-Z.x)*k2/Z.k;Z.y=cy-(cy-Z.y)*k2/Z.k;Z.k=k2;applyZ()};
  const zoomMid=f=>zoomAt(view.clientWidth/2,view.clientHeight/2,f),zl=h("span",{class:"zl"},"100%");
  const snap=()=>{undo.push(JSON.stringify({params:o.params,edits:o.edits,lock:o.lock,pins:o.pins,vec:o.vec||null}));if(undo.length>30)undo.shift()};
  S.snap=snap;
  function regen(){busy.hidden=false;setTimeout(()=>{const t0=performance.now();try{
      const P=Object.assign({},o.params,{edits:o.edits,lock:o.lock,vec:o.vec,title:o.name}),W=A.generate(P),info=A.render(W,mc,A.makeStamps(A.mulberry(W.seed^77)));
      o.lock=W.towns.map(t=>{const z={x:t.x,y:t.y,size:t.size,kind:t.kind,planned:t.planned,name:t.name,dens:Math.round(t.dens*100)/100,wall:!!t.wall};if(t.lockOutline)z.outline=t.lockOutline;if(t.lockSt)z.st=t.lockSt;return z});o.vec=W.vec;cur={W,info};drawPins();Store.save("maps",o);
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
  const BR={land:"rgba(190,200,110,.45)",sea:"rgba(90,130,160,.5)",up:"rgba(230,210,150,.45)",down:"rgba(60,50,30,.45)",forest:"rgba(50,90,40,.5)",clear:"rgba(200,190,120,.45)"};
  const ptrs=new Map();let pan=null,pinch=null,stroke=null,tap=null;
  function add(w){const l=stroke[stroke.length-1];if(l&&Math.hypot(l.x-w.x,l.y-w.y)<brush*.45)return;stroke.push({t:tool,x:Math.round(w.x),y:Math.round(w.y),r:brush});octx.fillStyle=BR[tool];octx.beginPath();octx.ellipse(w.cx,w.cy,brush,brush*A.TILT,0,0,7);octx.fill()}
  function act(w){
    if(tool==="town"){snap();o.lock=(o.lock||[]).concat({x:Math.round(w.x/A.G)*A.G,y:Math.round(w.y/A.G)*A.G,size:8,kind:"village",planned:false,name:""});regen()}
    else if(tool==="untown"){let bi=-1,bd=110;(o.lock||[]).forEach((t,i)=>{const d=Math.hypot(t.x-w.x,t.y-w.y);if(d<bd){bd=d;bi=i}});if(bi<0){toast("Toque mais perto de um povoado.");return}snap();o.lock.splice(bi,1);regen()}
    else if(tool==="pin"){snap();const pn={id:uid("p"),x:w.x,y:w.y,label:"Novo local "+(o.pins.length+1)};o.pins.push(pn);Store.save("maps",o);drawPins();openPlace({kind:"pin",id:pn.id})}
    else if(tool==="road"||tool==="river"||(tool==="street"&&cityI>=0)){draft.push(w);drawDraft()}}
  view.addEventListener("pointerdown",ev=>{if(ev.target.closest("button"))return;ptrs.set(ev.pointerId,[ev.clientX,ev.clientY]);try{view.setPointerCapture(ev.pointerId)}catch(e){}
    if(ptrs.size===2){if(stroke){stroke=null;drawDraft()}tap=null;pan=null;const [a,b]=[...ptrs.values()];pinch={d:Math.hypot(a[0]-b[0],a[1]-b[1])||1,mx:(a[0]+b[0])/2,my:(a[1]+b[1])/2};return}
    if(tool==="move"||tool==="lines"||tool==="city"||(tool==="street"&&cityI<0)){pan=[ev.clientX,ev.clientY];return}
    if(BR[tool]){const w=world(ev);if(w){stroke=[];add(w)}}else tap=[ev.clientX,ev.clientY]});
  view.addEventListener("pointermove",ev=>{if(!ptrs.has(ev.pointerId))return;ptrs.set(ev.pointerId,[ev.clientX,ev.clientY]);
    if(pinch&&ptrs.size>=2){const [a,b]=[...ptrs.values()],d=Math.hypot(a[0]-b[0],a[1]-b[1])||1,mx=(a[0]+b[0])/2,my=(a[1]+b[1])/2,r=view.getBoundingClientRect();Z.x+=mx-pinch.mx;Z.y+=my-pinch.my;zoomAt(mx-r.left,my-r.top,d/pinch.d);pinch={d,mx,my};return}
    if(pan){Z.x+=ev.clientX-pan[0];Z.y+=ev.clientY-pan[1];pan=[ev.clientX,ev.clientY];applyZ();return}
    if(stroke){const w=world(ev);if(w)add(w)}});
  const up=ev=>{if(!ptrs.has(ev.pointerId))return;ptrs.delete(ev.pointerId);if(ptrs.size<2)pinch=null;pan=null;
    if(tap&&!ptrs.size){const t=tap;tap=null;if(ev.type==="pointerup"&&Math.hypot(ev.clientX-t[0],ev.clientY-t[1])<10){const w=world(ev);if(w)act(w)}}
    if(stroke&&!ptrs.size){const st=stroke;stroke=null;if(st.length){snap();o.edits=o.edits.concat(st);regen()}}};
  view.addEventListener("pointerup",up);view.addEventListener("pointercancel",up);
  view.addEventListener("wheel",ev=>{ev.preventDefault();const r=view.getBoundingClientRect();zoomAt(ev.clientX-r.left,ev.clientY-r.top,Math.exp(-ev.deltaY*.0016))},{passive:false});
  view.addEventListener("dblclick",ev=>{if(ev.target.closest("button")||tool!=="move")return;const r=view.getBoundingClientRect();zoomAt(ev.clientX-r.left,ev.clientY-r.top,1.8)});
  const removeLine=z=>{if(z.kind==="r")o.vec.rivers.splice(z.i,1);else if(z.kind==="d")o.vec.roads.splice(z.i,1);else if(z.kind==="s")o.lock[z.i].st.splice(z.k,1)};
  // cabecalho
  const title=h("input",{class:"title",type:"text",value:o.name,"aria-label":"Nome do mapa",onchange:e=>{o.name=e.target.value.trim()||"Mapa";drawSide();regen()}});
  const body=h("div",{class:"mbody"}),par=h("div",{class:"params",hidden:true});
  const bPar=h("button",{type:"button","aria-pressed":"false",onclick:()=>{par.hidden=!par.hidden;body.classList.toggle("par",!par.hidden);bPar.setAttribute("aria-pressed",String(!par.hidden));requestAnimationFrame(applyZ)}},"Parâmetros");
  let armed=false;const del=h("button",{type:"button",class:"danger",onclick:()=>{if(!armed){armed=true;del.textContent="Confirmar exclusão";setTimeout(()=>{armed=false;del.textContent="Excluir"},3000);return}Store.remove("maps",o.id);S.map=null;drawAll()}},"Excluir");
  const head=h("div",{class:"mhead"},title,h("button",{type:"button",class:"primary",onclick:()=>{snap();o.params.seed=A.NAMES[(Math.random()*A.NAMES.length)|0].toLowerCase()+"-"+(1300+((Math.random()*200)|0));o.lock=null;o.vec=null;o.edits=[];fill();regen()}},"Sortear novo"),bPar,
    h("span",{class:"zoom"},h("button",{type:"button","aria-label":"Afastar",onclick:()=>zoomMid(1/1.5)},"−"),zl,h("button",{type:"button","aria-label":"Aproximar",onclick:()=>zoomMid(1.5)},"+"),h("button",{type:"button",onclick:()=>{Z.k=1;Z.x=Z.y=0;applyZ()}},"Ajustar")),
    h("button",{type:"button",onclick:()=>mc.toBlob(b=>saveFile(safe(o.name)+".png",b))},"Salvar PNG"),del);
  // ferramentas
  const tb=h("div",{class:"tools",role:"toolbar","aria-label":"Ferramentas de edição"}),hint=h("div",{class:"status"});
  const HINT={move:"Arraste para mover. Use a roda do mouse ou dois dedos para aproximar. Toque num povoado para abrir a nota dele.",lines:"Arraste um ponto para mudar o traçado. Toque em + para criar um ponto. Selecione um ponto para remover.",road:"Toque no mapa para marcar os pontos da estrada e depois em Concluir linha.",river:"Toque no mapa para marcar os pontos do rio, da nascente à foz, e depois em Concluir linha.",town:"Toque onde quer o novo povoado.",untown:"Toque no povoado que quer remover.",pin:"Toque onde quer o pino.",city:"Toque no nome de um povoado para editar o contorno e as ruas dele.",street:"Escolha o povoado e toque no mapa para marcar os pontos da rua. Depois toque em Concluir linha."};
  const setTool=t=>{if(!(t==="city"||t==="street")||!(tool==="city"||tool==="street"))cityI=-1;tool=t;draft=[];sel=null;drawDraft();stage.classList.toggle("draw",!["move","lines","city"].includes(t));view.classList.toggle("grab",["move","lines","city"].includes(t));for(const b of tb.querySelectorAll("button[data-t]"))b.setAttribute("aria-pressed",String(b.dataset.t===t));hint.textContent=HINT[t]||"Pinte arrastando sobre o mapa. Com dois dedos você continua podendo aproximar.";drawPins()};
  TOOLS.forEach(([t,l],i)=>{if(i===1||i===7||i===10||i===13)tb.append(h("span",{class:"sep"}));tb.append(h("button",{type:"button","data-t":t,onclick:()=>setTool(t)},l))});
  tb.append(h("button",{type:"button",onclick:()=>{if(draft.length<2){toast("Marque pelo menos dois pontos no mapa.");return}snap();o.vec=o.vec||{rivers:[],roads:[]};const c=draft.map(d=>[Math.round(d.x),Math.round(d.y)]);if(tool==="street"){const L=matCity(cityI);if(!L){toast("Escolha um povoado primeiro.");return}L.st.push({c,m:0})}else if(tool==="river")o.vec.rivers.push({c,w:10});else o.vec.roads.push(c);draft=[];regen()}},"Concluir linha"),
    h("button",{type:"button",onclick:()=>{if(!sel){toast("Toque num ponto primeiro.");return}snap();if(sel.kind==="o"||sel.kind==="s")matCity(sel.i);const c=lineOf(sel.kind,sel.i,sel.k),min=sel.kind==="o"?4:3;if(c.length<min){if(sel.kind==="o"){toast("O contorno precisa de pelo menos 3 pontos.");undo.pop();return}removeLine(sel)}else c.splice(sel.j,1);sel=null;regen()}},"Remover ponto"),
    h("button",{type:"button",onclick:()=>{if(!sel){toast("Toque num ponto da linha primeiro.");return}if(sel.kind==="o"){toast("O contorno não pode ser removido. Use Restaurar cidade.");return}snap();if(sel.kind==="s")matCity(sel.i);removeLine(sel);sel=null;regen()}},"Remover linha"),
    h("button",{type:"button",onclick:()=>{if(cityI<0||!o.lock[cityI]){toast("Em Editar cidade, escolha um povoado primeiro.");return}snap();delete o.lock[cityI].outline;delete o.lock[cityI].st;sel=null;regen()}},"Restaurar cidade"),
    h("span",{class:"sep"}),h("label",{},"Pincel",h("input",{type:"range",min:20,max:140,value:brush,"aria-label":"Tamanho do pincel",oninput:e=>brush=+e.target.value})),
    h("button",{type:"button",onclick:()=>{const u=undo.pop();if(!u){toast("Nada para desfazer.");return}Object.assign(o,JSON.parse(u));sel=null;fill();regen()}},"Desfazer"),
    h("button",{type:"button",onclick:()=>{if(!o.edits.length){toast("Este mapa não tem pinceladas.");return}snap();o.edits=[];regen()}},"Limpar pinceladas"));
  // parametros
  function fill(){par.replaceChildren(h("h2",{},"Parâmetros"));
    for(const [k,label,kind,a,b] of PARAMS){const id="p_"+k;let inp,val=h("span",{});
      const ch=v=>{snap();o.params[k]=v;if(STRUCT.has(k)){o.lock=null;o.vec=null}if(k==="form")o.edits=[];regen()};
      if(kind==="select"){inp=h("select",{id,onchange:e=>ch(e.target.value)},a.map(([v,t])=>h("option",{value:v},t)));inp.value=o.params[k]}
      else if(kind==="text")inp=h("input",{id,type:"text",value:o.params[k],autocomplete:"off",onchange:e=>ch(e.target.value.trim()||"atlas")});
      else if(kind==="pct"){inp=h("input",{id,type:"range",min:0,max:100,value:Math.round(o.params[k]*100),oninput:e=>val.textContent=e.target.value+"%",onchange:e=>ch(e.target.value/100)});val.textContent=Math.round(o.params[k]*100)+"%"}
      else{inp=h("input",{id,type:"range",min:a,max:b,value:o.params[k],oninput:e=>val.textContent=e.target.value,onchange:e=>ch(+e.target.value)});val.textContent=o.params[k]}
      par.append(h("div",{class:"fld"},h("label",{for:id},label,val),inp))}}
  fill();body.append(h("div",{class:"mwrap"},view,busy),par);
  main.append(h("div",{class:"mapv"},head,tb,hint,body,status));setTool("move");applyZ();
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
  const kindTxt=town?({city:"Cidade murada",town:"Vila",village:"Aldeia"}[town.kind]||"Povoado"):"Pino";
  const acts=h("div",{class:"row"});
  if(note){acts.append(h("button",{type:"button",class:"primary",onclick:()=>{S.placeEdit=!S.placeEdit;drawPlace()}},S.placeEdit?"Ler":"Editar aqui"),h("button",{type:"button",onclick:()=>openNote(note.id)},"Abrir nota"))}
  else acts.append(h("button",{type:"button",class:"primary",onclick:()=>{newNote("local",name,{content:"---\ntipo: local\nmapa: "+o.name+"\npino: "+name+"\n---\n\n## Descrição\n\n\n## Quem vive aqui\n\n\n## Ganchos\n\n- [ ] \n"});S.placeEdit=true;drawSide();drawPlace()}},"Criar nota deste lugar"));
  if(pin)acts.append(h("button",{type:"button",class:"danger",onclick:()=>{o.pins=o.pins.filter(p=>p!==pin);Store.save("maps",o);S.redrawPins&&S.redrawPins();closePlace()}},"Remover pino"));
  box.append(h("div",{class:"row"},h("h2",{},kindTxt),h("span",{class:"grow"}),h("button",{type:"button",onclick:closePlace},"Fechar")),nm,acts);
  if(town){const set=(k,v)=>{S.snap&&S.snap();town[k]=v;if(k==="kind"){town.size={village:8,town:14,city:30}[v];town.wall=v==="city"}Store.save("maps",o);S.regen&&S.regen()};
    const rng=(label,k,min,max,val,fmt,conv)=>{const sp=h("span",{},fmt(val)),id="t_"+k;return h("div",{class:"fld"},h("label",{for:id},label,sp),h("input",{id,type:"range",min,max,value:val,oninput:e=>sp.textContent=fmt(+e.target.value),onchange:e=>set(k,conv(+e.target.value))}))};
    const kd=h("select",{id:"t_kind",onchange:e=>set("kind",e.target.value)},[["village","Aldeia"],["town","Vila"],["city","Cidade"]].map(([v,t])=>h("option",{value:v},t)));kd.value=town.kind;
    const pl=h("select",{id:"t_plan",onchange:e=>set("planned",e.target.value==="1")},h("option",{value:"0"},"Orgânico"),h("option",{value:"1"},"Planejado"));pl.value=town.planned?"1":"0";
    const wl=h("select",{id:"t_wall",onchange:e=>set("wall",e.target.value==="1")},h("option",{value:"0"},"Sem muralha"),h("option",{value:"1"},"Com muralha"));wl.value=town.wall?"1":"0";
    box.append(h("div",{class:"params"},h("div",{class:"fld"},h("label",{for:"t_kind"},"Tipo"),kd),rng("Tamanho","size",4,46,town.size,v=>String(v),v=>v),rng("Densidade de construções","dens",0,100,Math.round((town.dens==null?.6:town.dens)*100),v=>v+"%",v=>v/100),
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
    for(const m of all)list.append(h("button",{class:"item"+(m.id===S.map?" on":""),type:"button",onclick:()=>openMap(m.id)},m.name,h("small",{},(m.lock||[]).length?(m.lock.length+" povoados"):"")));
    side.append(h("h2",{},"Mapas"),h("button",{type:"button",class:"primary",onclick:()=>openMap(newMap().id)},"+ Novo mapa"),list)}}
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
