// Atlas - editor de notas com pre-visualizacao ao vivo (como o Obsidian), em cima do CodeMirror 6 (app/vendor/codemirror.js = window.CM).
// O texto continua Markdown puro; os sinais (#, **, [[ ]], - [ ]) somem fora da linha em que o cursor esta e o texto ja aparece formatado.
(function(){
  "use strict";
  function criar(cfg){
    const C=window.CM;if(!C||!C.EditorView)return null;
    const {EditorView,EditorState,Decoration,ViewPlugin,WidgetType,syntaxTree,keymap}=C;
    // ---------- pecas desenhadas no lugar do texto ----------
    class Caixa extends WidgetType{constructor(feito,pos){super();this.feito=feito;this.pos=pos}eq(o){return o.feito===this.feito&&o.pos===this.pos}
      toDOM(v){const b=document.createElement("input");b.type="checkbox";b.className="cm-caixa";b.checked=this.feito;b.setAttribute("aria-label","Marcar tarefa");
        b.addEventListener("mousedown",e=>e.preventDefault());b.addEventListener("click",e=>{e.preventDefault();const p=this.pos;v.dispatch({changes:{from:p+1,to:p+2,insert:this.feito?" ":"x"}})});return b}ignoreEvent(){return false}}
    class Bolinha extends WidgetType{constructor(t){super();this.t=t}eq(o){return o.t===this.t}toDOM(){const s=document.createElement("span");s.className="cm-bolinha";s.textContent=this.t;return s}}
    class Linha extends WidgetType{toDOM(){const s=document.createElement("span");s.className="cm-hr";return s}eq(){return true}}
    class Chip extends WidgetType{constructor(alvo,txt){super();this.alvo=alvo;this.txt=txt}eq(o){return o.alvo===this.alvo&&o.txt===this.txt}
      toDOM(){const a=document.createElement("a"),est=cfg.estadoLink?cfg.estadoLink(this.alvo):"";a.className="cm-wl"+(est?" "+est:"");a.textContent=this.txt;a.title=this.alvo;
        a.addEventListener("mousedown",e=>{if(e.button!==0)return;e.preventDefault();e.stopPropagation();if(cfg.abrirLink)cfg.abrirLink(this.alvo)});return a}ignoreEvent(){return true}}
    class Img extends WidgetType{constructor(id){super();this.id=id}eq(o){return o.id===this.id}
      toDOM(){const u=cfg.imagem&&cfg.imagem(this.id),d=document.createElement("span");d.className="cm-imgw";if(u){const i=document.createElement("img");i.src=u;i.alt="";d.append(i)}else d.textContent="(imagem)";return d}}
    // ---------- decoracoes ----------
    const esconde=Decoration.replace({}),mk=c=>Decoration.mark({class:c}),ln=c=>Decoration.line({class:c});
    const M={strong:mk("cm-strong"),em:mk("cm-em"),del:mk("cm-del"),code:mk("cm-icode"),link:mk("cm-link"),tag:mk("cm-tag"),sec:mk("cm-secret"),cru:mk("cm-cru")};
    function monta(view){const st=view.state,doc=st.doc,D=[],sel=st.selection.ranges;
      const linhasAtivas=new Set();for(const r of sel){const a=doc.lineAt(r.from).number,b=doc.lineAt(r.to).number;for(let i=a;i<=b;i++)linhasAtivas.add(i)}
      const ativo=(from,to)=>{const a=doc.lineAt(from).number,b=doc.lineAt(Math.max(from,to-1<from?from:to)).number;for(let i=a;i<=b;i++)if(linhasAtivas.has(i))return true;return false};
      const add=(f,t,d)=>{if(t>f||d.spec&&d.spec.block===undefined&&t===f&&d.point)D.push(d.range(f,t));else if(t===f&&d.startSide!==undefined)D.push(d.range(f))};
      const codigo=[];
      for(const {from,to} of view.visibleRanges){
        syntaxTree(st).iterate({from,to,enter:n=>{const nm=n.name,f=n.from,t=n.to;
          let m;if((m=/^ATXHeading(\d)$/.exec(nm))){D.push(ln("cm-h cm-h"+m[1]).range(doc.lineAt(f).from));return}
          if(nm==="SetextHeading1"||nm==="SetextHeading2"){D.push(ln("cm-h cm-h"+nm.slice(-1)).range(doc.lineAt(f).from));return}
          if(nm==="HeaderMark"){if(!ativo(f,t)){const fim=doc.sliceString(t,t+1)===" "?t+1:t;if(fim>f)D.push(esconde.range(f,fim))}return}
          if(nm==="StrongEmphasis"){if(t>f)D.push(M.strong.range(f,t));return}
          if(nm==="Emphasis"){if(t>f)D.push(M.em.range(f,t));return}
          if(nm==="Strikethrough"){if(t>f)D.push(M.del.range(f,t));return}
          if(nm==="EmphasisMark"||nm==="StrikethroughMark"){if(!ativo(f,t)&&t>f)D.push(esconde.range(f,t));return}
          if(nm==="InlineCode"){if(t>f)D.push(M.code.range(f,t));codigo.push([f,t]);return}
          if(nm==="CodeMark"){const p=n.node.parent;if(p&&p.name==="InlineCode"&&!ativo(f,t)&&t>f)D.push(esconde.range(f,t));return}
          if(nm==="FencedCode"||nm==="CodeBlock"){codigo.push([f,t]);for(let p=f;p<=t;){const L=doc.lineAt(p);D.push(ln("cm-bloco").range(L.from));if(L.to+1>t)break;p=L.to+1}return false}
          if(nm==="Blockquote"){for(let p=f;p<=t;){const L=doc.lineAt(p);D.push(ln("cm-citacao").range(L.from));if(L.to+1>t)break;p=L.to+1};return}
          if(nm==="QuoteMark"){if(!ativo(f,t)){const fim=doc.sliceString(t,t+1)===" "?t+1:t;D.push(esconde.range(f,fim))}return}
          if(nm==="HorizontalRule"){if(!ativo(f,t))D.push(Decoration.replace({widget:new Linha()}).range(f,t));return}
          if(nm==="ListMark"){const it=n.node.parent,task=it&&it.getChild("Task");if(ativo(f,t))return;
            if(task){const fim=doc.sliceString(t,t+1)===" "?t+1:t;D.push(esconde.range(f,fim));return}
            const lista=it&&it.parent,ord=lista&&lista.name==="OrderedList";if(!ord)D.push(Decoration.replace({widget:new Bolinha("•")}).range(f,t));return}
          if(nm==="TaskMarker"){const tx=doc.sliceString(f,t),feito=/x/i.test(tx);if(!ativo(f,t))D.push(Decoration.replace({widget:new Caixa(feito,f)}).range(f,t));if(feito){const L=doc.lineAt(f);if(L.to>t+1)D.push(mk("cm-feito").range(t+1,L.to))}return}
          if(nm==="Link"){const marks=[],u=n.node.getChild("URL");let c=n.node.firstChild;while(c){if(c.name==="LinkMark")marks.push(c);c=c.nextSibling}
            if(marks.length>=2){const ini=marks[0],fimTxt=marks[1];if(fimTxt.from>ini.to)D.push(M.link.range(ini.to,fimTxt.from));if(!ativo(f,t)){D.push(esconde.range(ini.from,ini.to));D.push(esconde.range(fimTxt.from,t))}}return false}
          if(nm==="Image"&&!ativo(f,t)){return false}
        }});
        // o que o Markdown nao conhece: [[links]], ![[img:id]], %%segredo%%, #etiqueta
        const txt=doc.sliceString(from,to),noCod=p=>codigo.some(([a,b])=>p>=a&&p<b);let m;
        const reI=/!\[\[img:([\w-]+)\]\]/g;while((m=reI.exec(txt))){const f=from+m.index,t=f+m[0].length;if(noCod(f))continue;if(!ativo(f,t))D.push(Decoration.replace({widget:new Img(m[1])}).range(f,t));else D.push(M.cru.range(f,t))}
        const reW=/(?<!!)\[\[([^\]|\n]+)(?:\|([^\]\n]+))?\]\]/g;while((m=reW.exec(txt))){const f=from+m.index,t=f+m[0].length;if(noCod(f))continue;if(!ativo(f,t))D.push(Decoration.replace({widget:new Chip(m[1].trim(),(m[2]||m[1]).trim())}).range(f,t));else D.push(M.link.range(f,t))}
        const reS=/%%([^%\n]+)%%/g;while((m=reS.exec(txt))){const f=from+m.index,t=f+m[0].length;if(noCod(f))continue;D.push(M.sec.range(f+2,t-2));if(!ativo(f,t)){D.push(esconde.range(f,f+2));D.push(esconde.range(t-2,t))}}
        const reT=/(^|[\s(])#([\p{L}\d_\/-]+)/gu;while((m=reT.exec(txt))){const f=from+m.index+m[1].length,t=f+1+m[2].length;if(noCod(f))continue;const L=doc.lineAt(f);if(L.from===f&&/^#+\s/.test(L.text))continue;D.push(M.tag.range(f,t))}
      }
      try{return Decoration.set(D,true)}catch(e){console.warn("decoracoes",e);return Decoration.none}}
    const vivo=ViewPlugin.fromClass(class{constructor(v){this.decorations=monta(v)}update(u){if(u.docChanged||u.selectionSet||u.viewportChanged||syntaxTree(u.startState)!==syntaxTree(u.state))this.decorations=monta(u.view)}},{decorations:v=>v.decorations});
    // ---------- sugestao de [[links]] ----------
    const sugestao=ctx=>{const m=ctx.matchBefore(/\[\[[^\]\n|]*/);if(!m)return null;const q=m.text.slice(2).toLowerCase(),nomes=(cfg.nomes?cfg.nomes():[]);
      const depois=ctx.state.sliceDoc(ctx.pos,ctx.pos+2)==="]]";
      const ops=nomes.filter(n=>n.nome.toLowerCase().includes(q)).sort((a,b)=>a.nome.toLowerCase().indexOf(q)-b.nome.toLowerCase().indexOf(q)).slice(0,40)
        .map(n=>({label:n.nome,detail:n.tipo||"",apply:(v,c,f,t)=>{const ins=n.nome+(depois?"":"]]");v.dispatch({changes:{from:f,to:t,insert:ins},selection:{anchor:f+n.nome.length+2}})}}));
      if(q&&!nomes.some(n=>n.nome.toLowerCase()===q))ops.push({label:m.text.slice(2),detail:"nova nota",apply:(v,c,f,t)=>{const s=m.text.slice(2)+(depois?"":"]]");v.dispatch({changes:{from:f,to:t,insert:s},selection:{anchor:f+m.text.length}})}});
      return {from:m.from+2,options:ops,filter:false}};
    // ---------- comandos ----------
    const envolver=(v,a,b,ph)=>{const r=v.state.selection.main,s=v.state.sliceDoc(r.from,r.to)||ph||"";v.dispatch({changes:{from:r.from,to:r.to,insert:a+s+b},selection:{anchor:r.from+a.length,head:r.from+a.length+s.length}});v.focus();return true};
    const prefixo=(v,pre)=>{const L=v.state.doc.lineAt(v.state.selection.main.head);if(L.text.startsWith(pre)){v.dispatch({changes:{from:L.from,to:L.from+pre.length,insert:""}})}else{const m=/^(#{1,6} |- \[[ x]\] |[-*+] |\d+\. |> )/.exec(L.text);v.dispatch({changes:{from:L.from,to:L.from+(m?m[0].length:0),insert:pre}})}v.focus();return true};
    const teclas=keymap.of([
      {key:"Mod-b",run:v=>envolver(v,"**","**","negrito")},{key:"Mod-i",run:v=>envolver(v,"*","*","itálico")},{key:"Mod-k",run:v=>envolver(v,"[[","]]","")},
      {key:"Mod-Shift-s",run:v=>envolver(v,"%%","%%","segredo")},{key:"Mod-Shift-x",run:v=>envolver(v,"~~","~~","riscado")},
      {key:"Mod-1",run:v=>prefixo(v,"# ")},{key:"Mod-2",run:v=>prefixo(v,"## ")},{key:"Mod-3",run:v=>prefixo(v,"### ")},{key:"Mod-l",run:v=>prefixo(v,"- [ ] ")},
      {key:"Escape",run:()=>{if(cfg.sair){cfg.sair();return true}return false}}]);
    const eventos=EditorView.domEventHandlers({
      paste:(e,v)=>{const f=[...(e.clipboardData&&e.clipboardData.files||[])].filter(x=>/^image\//.test(x.type));if(!f.length||!cfg.imagens)return false;e.preventDefault();cfg.imagens(f).then(ids=>{for(const id of ids){const r=v.state.selection.main;v.dispatch({changes:{from:r.from,to:r.to,insert:"\n![[img:"+id+"]]\n"}})}});return true},
      drop:(e,v)=>{const f=[...(e.dataTransfer&&e.dataTransfer.files||[])].filter(x=>/^image\//.test(x.type));if(!f.length||!cfg.imagens)return false;e.preventDefault();const p=v.posAtCoords({x:e.clientX,y:e.clientY})||v.state.selection.main.head;cfg.imagens(f).then(ids=>{v.dispatch({changes:{from:p,insert:ids.map(id=>"\n![[img:"+id+"]]\n").join("")}})});return true}});
    const md=C.markdown({base:C.markdownLanguage,extensions:[C.GFM],addKeymap:true});
    const state=EditorState.create({doc:cfg.texto||"",extensions:[
      C.history(),C.drawSelection(),C.dropCursor(),C.indentOnInput(),C.closeBrackets(),C.highlightSelectionMatches(),EditorView.lineWrapping,
      md,vivo,eventos,C.autocompletion({override:[sugestao],activateOnTyping:true,icons:false}),
      C.Prec.highest(teclas),keymap.of([...C.closeBracketsKeymap,...C.defaultKeymap,...C.historyKeymap,...C.completionKeymap,...C.searchKeymap,C.indentWithTab]),
      C.placeholder(cfg.dica||"Escreva aqui…"),
      EditorView.contentAttributes.of({spellcheck:"true","aria-label":"Conteúdo da nota"}),EditorView.editorAttributes.of({class:"cm-atlas"}),
      EditorView.updateListener.of(u=>{if(u.docChanged&&cfg.mudou)cfg.mudou(u.state.doc.toString())})]});
    const view=new EditorView({state});
    return {dom:view.dom,view,texto:()=>view.state.doc.toString(),focar:()=>view.focus(),
      envolver:(a,b,ph)=>envolver(view,a,b,ph),prefixo:pre=>prefixo(view,pre),
      inserir:s=>{const r=view.state.selection.main;view.dispatch({changes:{from:r.from,to:r.to,insert:s},selection:{anchor:r.from+s.length}});view.focus()},
      destruir:()=>view.destroy()}}
  window.AtlasEditor={criar,pronto:()=>!!(window.CM&&window.CM.EditorView)};
})();
