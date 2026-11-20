// Atlas - Modo Batalha: gerador por zonas (sem DOM).
// Uma zona e uma forma fechada com tipo, parametros e semente. A forma vira uma grade fina (1/4 de quadrado) com a distancia
// de cada casa ate a borda; tudo o que o gerador decide usa essa grade, entao ele se adapta a retangulo, circulo, L ou forma livre.
// A mesma zona com a mesma semente e o mesmo catalogo da sempre o mesmo resultado.
// 1.00: comodos (mobiliar um espaco). Construcoes, natureza, masmorras e telhados entram nas proximas versoes sobre este motor.

export const rng=s=>{let a=(s>>>0)||1;return()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}};
const RES=.25;

// ---------- papeis: o que e cada peca e como achar nos pacotes ----------
// sub = tipos do classificador; q = o nome precisa ter uma destas palavras; nao = nao pode ter nenhuma; t = [menor lado min, maior lado max] em quadrados
// lugar: p encosta na parede, k canto, m meio, s solto; passa = nao bloqueia (tapete); luz = luz pronta acesa junto
export const PAPEIS={
  cama:{sub:["Camas"],nao:["frame","blanket","pillow","cage","pan","hay","pod","pet","dog","cat","mattress","stretcher","ladder","bunk","bedroll","baby","crib","sheet","cover","canopy","headboard","warming"],pref:["bed"],t:[.7,3.6],lugar:"p",prof:"longo"},
  criado:{sub:["Mesas","Armários e estantes"],q:["nightstand","bedside"],t:[.4,1.6],lugar:"p"},
  guardaRoupa:{sub:["Armários e estantes"],q:["wardrobe","cupboard","dresser","closet","armoire","locker","cabinet"],nao:["door","drawer","shelf","arrangement","open"],t:[.5,3.6],lugar:"p"},
  estante:{sub:["Armários e estantes"],q:["bookshelf","bookcase","shelf","shelves","shelving"],nao:["path","end","corner","arrangement","empty","ladder","newspaper"],t:[.4,4.2],lugar:"p"},
  armario:{sub:["Armários e estantes"],q:["cabinet","cupboard","shelf","shelves","locker","dresser","sideboard"],nao:["path","end","door","drawer","arrangement","wall","rack","ladder"],pref:["cupboard","cabinet"],t:[.4,4.2],lugar:"p"},
  bau:{sub:["Baús"],nao:["open","lid","armor","arm","guard"],t:[.5,2.2],lugar:"p"},
  mesa:{sub:["Mesas"],q:["table"],nao:["nightstand","desk","arrangement","torture","operating","pool","billiard","side","coffee","folding","cloth","leg","top","altar","work","picnic","end","knife","misc","base","set","saw","lamp","runner","dressing","sewing","drafting","alchemy","map","bloody"],pref:["rectangle","round","square"],t:[1.2,4.2],tmin:.95,lugar:"m"},
  mesaLonga:{sub:["Mesas"],q:["table"],nao:["nightstand","desk","arrangement","torture","operating","pool","billiard","side","coffee","folding","cloth","leg","top","altar","work","picnic","end","knife","misc","base","set","saw","lamp","runner","dressing","sewing","drafting","alchemy","map","bloody","round","square","circle"],pref:["banquet","dining","long","rectangle"],t:[.9,7],tmin:.9,tlong:2.4,lugar:"m"},
  mesaPronta:{sub:["Mesas"],q:["arrangement"],nao:["desk","nightstand"],t:[1.5,6.2],lugar:"m"},
  mesinha:{sub:["Mesas"],q:["coffee","side","end"],t:[.5,2.2],lugar:"m"},
  escrivaninha:{sub:["Mesas"],q:["desk"],nao:["arrangement","covered","cabinet","lamp","clutter","reception"],t:[.8,3.6],lugar:"p"},
  bancada:{sub:["Mesas","Oficina e trabalho","Balcões e bares"],q:["workbench","work","counter","bench"],nao:["seat","park","pew"],t:[.8,4.2],lugar:"p"},
  cadeira:{sub:["Cadeiras, bancos e sofás"],q:["chair"],nao:["arm","throne","wheel","electric","torture","rocking","high","deck","lounge","beach","barber","dentist","bar","child","childs","baby","folding","stool"],naoRe:/^Chair_Wood_[A-Za-z]+_A_1x1$/,t:[.4,1.4],lugar:"s"},
  banqueta:{sub:["Cadeiras, bancos e sofás"],q:["stool"],nao:["foot"],t:[.3,1.2],lugar:"s"},
  bancoLongo:{sub:["Cadeiras, bancos e sofás"],q:["bench","pew"],nao:["work","press","park"],t:[.4,4.2],lugar:"m"},
  sofa:{sub:["Cadeiras, bancos e sofás"],q:["sofa","couch"],nao:["piece","armrest","corner","pillow","cushion"],t:[.7,4.2],lugar:"p"},
  poltrona:{sub:["Cadeiras, bancos e sofás"],q:["armchair"],t:[.6,2],lugar:"s"},
  balcao:{sub:["Balcões e bares"],afasta:1.05,borda:true,q:["bar","counter"],nao:["stool","flap","tap","shelf","sink","corner","end","glass","drop","sign","mat","towel","chocolate","bbq","candy","grill","soap","gold","silver","metal","iron","crow","bars"],naoRe:/^Bar_Wood_[A-Za-z]+_A[34]_/,t:[.5,6.2],lugar:"p"},
  barril:{sub:["Barris"],nao:["band","lid","side","stand","rack","tap","explosive","oil","toxic","fire","burn","keg","tnt","xxx","large","top"],pref:["barrel"],t:[.5,2.2],lugar:"s",varia:2,arranjo:"fileira"},
  caixote:{sub:["Caixas e caixotes"],q:["crate","box"],nao:["lid","open","empty","music","jewel","gift","pizza","tool","mail","letter","cardboard","paper","safe","tnt","spice","spray","match","snuff","lunch","tackle","ballot","juke"],pref:["crate"],t:[.5,2.2],lugar:"s",varia:3,arranjo:"monte",tol:.02,pilha:.3},
  saco:{sub:["Sacos e cestos"],q:["sack","bag","basket"],nao:["gift","sleeping","body","punching","trash","garbage","baby","hand","back","of","tea","dye","spice","wind","saddle","money","coin"],pref:["sack"],t:[.4,2],lugar:"s",varia:3,arranjo:"monte",tol:.14},
  pote:{sub:["Potes, vasos e urnas"],q:["pot","jar","urn","amphora","vase","jug"],nao:["brain","lid","broken","shard","flower","chamber"],t:[.3,1.6],lugar:"s",varia:3,arranjo:"monte",tol:.05},
  fogao:{sub:["Fogões, fornos e lareiras"],q:["stove","oven","cooker","hearth","range"],nao:["shovel","accessor","holder","chimney","tool","poker","door","hood","micro","toaster"],t:[.7,3.6],lugar:"p",luz:"lareira"},
  lareira:{sub:["Fogões, fornos e lareiras"],q:["fireplace"],nao:["shovel","accessor","holder","tool","poker","screen","grate","filled","log","mantel","broom","bellows","iron","kindling","tongs","bucket","base","shadow","coal","box"],pref:["chimneyless","rectangle"],t:[.9,4.2],lugar:"p",luz:"lareira"},
  pia:{sub:["Pias e bacias"],q:["sink","basin","wash"],nao:["wall","water","frame"],t:[.4,2.6],lugar:"p"},
  vaso:{sub:["Vasos sanitários"],nao:["paper","brush","lid","seat","plunger","sign"],t:[.4,1.6],lugar:"p"},
  banheira:{sub:["Banheiras e chuveiros"],q:["bath","tub","shower"],nao:["baby","mat","curtain","head","drain","water","foam","bubble"],t:[.7,3.2],lugar:"p"},
  tapete:{sub:["Tapetes"],q:["rug","carpet"],nao:["path","rim","modular","rolled","stair","runner","corner","end","door","bath","beater"],t:[1.2,6.5],lugar:"m",passa:true},
  planta:{sub:["Plantas em vaso"],nao:["empty","hanging","wall","dead"],t:[.4,1.6],lugar:"k"},
  estatua:{sub:["Estátuas"],nao:["head","arm","piece","rubble","base","fallen","part","fragment","cube","obelisk","sphere","pyramid","orb","pottery","clay","bust","tiny","small","miniature","death","skull"],pref:["figure","hooded","praying","knight","mage","man","woman","saint","angel","king","queen","lion"],t:[.8,3.2],lugar:"p"},
  altar:{sub:["Magia e alquimia","Mesas"],q:["altar"],nao:["cloth","runner","candle","blood","offering","rim"],t:[.8,4.2],lugar:"m"},
  armas:{sub:["Armas e armaduras"],q:["rack","stand","display"],nao:["target"],t:[.5,3.2],lugar:"p"},
  manequim:{sub:["Armas e armaduras","Pessoas e manequins"],q:["mannequin","dummy","armor"],nao:["arm","guard","leg","helmet","piece","glove","boot","rack","skirt","module"],t:[.6,2.2],lugar:"s"},
  bigorna:{sub:["Ferramentas","Oficina e trabalho"],q:["anvil"],t:[.5,2.2],lugar:"m"},
  forja:{sub:["Oficina e trabalho","Fogões, fornos e lareiras"],q:["forge","furnace","smelter","kiln"],nao:["tool","tongs","bellows"],t:[.9,4.2],lugar:"p",luz:"lareira"},
  ferramentas:{sub:["Ferramentas","Oficina e trabalho"],q:["tool","tools","grindstone","bellows","workbench","rack"],nao:["box"],t:[.4,3.2],lugar:"p",varia:2},
  velaChao:{sub:["Velas e candelabros"],q:["candelabra","candelabrum","candlestick","standing"],nao:["wall","table","holder","small","wax"],t:[.3,1.6],lugar:"k",luz:"vela"},
  tocha:{sub:["Tochas e braseiros"],q:["torch","sconce","brazier"],nao:["unlit","off","burnt","stake","holder","handle","empty","hand","brazier"],t:[.3,1.6],lugar:"p",luz:"tocha",fino:true},
  lampada:{sub:["Lâmpadas e lanternas"],q:["lamp","lantern"],nao:["street","post","off","unlit","broken","table","desk","ceiling","hanging","shade"],t:[.3,1.6],lugar:"k",luz:"lampiao"},
  arranjoDep:{sub:["Outros","Caixas e caixotes"],todas:["storage","arrangement"],t:[.8,5.2],lugar:"k",varia:3},
  // em cima dos moveis
  louca:{sub:["Louça e copos"],q:["plate","mug","cup","bowl","tankard","goblet","jug","bottle","glass","dish","stein"],nao:["side","broken","stack","rack","shelf","counter","case","crate","empty","spill"],t:[.1,.7],em:true,varia:4},
  comida:{sub:["Comida"],q:["bread","cheese","meat","fruit","pie","food","apple","fish","cake","ham","chicken","soup","stew"],nao:["raw","rotten","mill","crop","sack","crate","barrel","tray","stall","cut","slice","hook","piece","grinder","cleaver"],t:[.1,.8],em:true,varia:4},
  livros:{sub:["Livros e papéis"],q:["book","books","scroll","paper","papers","letter","tome","journal","quill","ink"],nao:["shelf","stack","pile","case","stand","bloody","burnt","rolls","box","sheet"],t:[.1,.8],em:true,varia:4},
  velaMesa:{sub:["Velas e candelabros"],q:["candle","candles"],nao:["wall","stand","unlit","holder","candelabra","arranged","melted","chandelier","wreath","snuffer","mold","box"],t:[.08,.6],em:true,luz:"vela"},
};
// palavras que so entram quando o estado do lugar e ruim
const RUIM=["torn","ragged","tattered","messy","spilled","bloodied","broken","damaged","fallen","bloody","blood","burnt","burned","ruined","destroyed","dirty","overturned","toppled","rotten","smashed","cracked","rusty","rusted","moldy","abandoned","collapsed","debris","dead"];
const NUNCA=["shadow","overlay","colorable","glow","highlight","outline","mask","template"];
// conjuntos tematicos dos pacotes: so entram quando o tema pedir (proximas versoes)
const TEMATICO=["ceremorph","dwarven","drow","covered","torment","snowy","frosty","frozen","elven","orc","goblin","undead","xmas","christmas","halloween","spooky","wedding","nursery","invocation"];
// papeis cujo material define o estilo do comodo (madeira clara, escura...)
const MOVEIS=new Set(["cama","criado","guardaRoupa","estante","armario","bau","mesa","mesaPronta","mesinha","escrivaninha","bancada","cadeira","banqueta","bancoLongo","sofa","poltrona","balcao"]);

// ---------- comodos: receita de cada tipo ----------
// n = [minimo, maximo]; por = uma peca a cada N quadrados de area; chave = peca principal (vai primeiro, longe da porta, no meio da parede)
// com = pecas em volta (cadeiras); em = o que vai em cima (papel, quantidade relativa); perto = papel de quem fica ao lado
export const COMODOS={
  quarto:{nome:"Quarto",amb:"Quarto",itens:[{p:"tapete",n:[0,1],prob:.6},{p:"cama",n:[1,2],por:30,chave:true},{p:"criado",n:[0,2],por:14,perto:"cama",em:[["velaMesa",.5],["livros",.4]]},{p:"guardaRoupa",n:[1,2],por:22},{p:"bau",n:[0,1],prob:.7,perto:"cama"},{p:"escrivaninha",n:[0,1],min:20,com:{p:"cadeira",n:1},em:[["livros",1],["velaMesa",.4]]},{p:"estante",n:[0,1],min:26},{p:"planta",n:[0,1],prob:.3},{p:"velaChao",n:[0,1],prob:.4}],
    rico:[{p:"tapete",n:[1,1]},{p:"poltrona",n:[1,2],por:20},{p:"velaChao",n:[1,2],por:16},{p:"planta",n:[1,2],por:22},{p:"estatua",n:[0,1],min:30}]},
  dormitorio:{nome:"Dormitório",amb:"Quarto",itens:[{p:"cama",n:[2,12],por:8,chave:true,arranjo:"fileira"},{p:"bau",n:[1,8],por:12,perto:"cama"},{p:"guardaRoupa",n:[0,2],por:30},{p:"mesa",n:[0,1],min:30,com:{p:"cadeira",lados:1},em:[["louca",.6]]},{p:"tocha",n:[1,4],por:18}],rico:[{p:"tapete",n:[1,2],por:30},{p:"velaChao",n:[1,3],por:20}]},
  sala:{nome:"Sala de estar",amb:"Quarto",itens:[{p:"tapete",n:[1,1]},{p:"lareira",n:[0,1],chave:true,min:14},{p:"sofa",n:[1,2],por:24,chave:true},{p:"poltrona",n:[0,2],por:18},{p:"mesinha",n:[0,1],em:[["livros",.6],["velaMesa",.5]]},{p:"estante",n:[1,2],por:24},{p:"armario",n:[0,1],min:22},{p:"planta",n:[0,2],por:22},{p:"velaChao",n:[0,2],por:22}],
    rico:[{p:"estatua",n:[1,2],por:30},{p:"velaChao",n:[2,4],por:14},{p:"planta",n:[1,3],por:18},{p:"poltrona",n:[1,3],por:16}]},
  jantar:{nome:"Salão de jantar",amb:"Cozinha",itens:[{p:"tapete",n:[0,1],prob:.5},{p:"mesaLonga",ou:"mesa",n:[1,2],por:45,chave:true,grade:true,com:{p:"cadeira",lados:4},em:[["louca",1],["comida",.7],["velaMesa",.3]]},{p:"lareira",n:[0,1],min:22},{p:"armario",n:[1,2],por:26},{p:"velaChao",n:[0,2],por:20},{p:"planta",n:[0,1],prob:.3}],
    rico:[{p:"velaChao",n:[2,4],por:14},{p:"planta",n:[1,2],por:24}]},
  cozinha:{nome:"Cozinha",amb:"Cozinha",itens:[{p:"fogao",n:[1,1],chave:true},{p:"bancada",ou:"mesa",n:[1,2],por:16,em:[["comida",1],["louca",.8]]},{p:"pia",n:[0,1]},{p:"armario",n:[1,2],por:18},{p:"mesa",n:[0,1],min:18,com:{p:"banqueta",lados:2},em:[["comida",1],["louca",.6]]},{p:"barril",n:[1,4],por:14},{p:"saco",n:[1,4],por:14},{p:"pote",n:[0,4],por:14},{p:"caixote",n:[0,3],por:20}]},
  despensa:{nome:"Despensa e depósito",amb:"Loja e mercado",itens:[{p:"armario",n:[1,4],por:10},{p:"arranjoDep",n:[0,2],por:22},{p:"barril",n:[2,10],por:6},{p:"caixote",n:[2,10],por:6},{p:"saco",n:[1,8],por:8},{p:"pote",n:[0,5],por:10}]},
  banheiro:{nome:"Banheiro",amb:"Banheiro",itens:[{p:"banheira",n:[0,3],por:20,chave:true,min:6},{p:"vaso",n:[1,4],por:16,arranjo:"fileira"},{p:"pia",n:[1,3],por:18,perto:"vaso",arranjo:"fileira"},{p:"armario",n:[0,1],min:10},{p:"pote",n:[0,3],por:14},{p:"tapete",n:[0,1],prob:.3},{p:"planta",n:[0,1],prob:.2},{p:"bancoLongo",n:[0,2],min:24,por:30,lugar:"p"}],rico:[{p:"planta",n:[1,2]},{p:"velaChao",n:[1,2]}]},
  escritorio:{nome:"Escritório",amb:"Escritório",itens:[{p:"tapete",n:[0,1],prob:.7},{p:"escrivaninha",n:[1,1],chave:true,meio:.5,com:{p:"cadeira",n:1},em:[["livros",1],["velaMesa",.5]]},{p:"estante",n:[1,4],por:10},{p:"armario",n:[0,1]},{p:"poltrona",n:[0,2],por:18},{p:"bau",n:[0,1],prob:.5},{p:"planta",n:[0,1],prob:.5},{p:"velaChao",n:[0,1],prob:.6}],rico:[{p:"tapete",n:[1,1]},{p:"estatua",n:[0,1],min:16},{p:"velaChao",n:[1,2]}]},
  biblioteca:{nome:"Biblioteca",amb:"Biblioteca e estudo",itens:[{p:"estante",n:[3,24],por:3.5},{p:"tapete",n:[0,1],prob:.6},{p:"mesa",n:[1,3],por:30,grade:true,com:{p:"cadeira",lados:4},em:[["livros",1.4],["velaMesa",.4]]},{p:"poltrona",n:[0,2],por:26},{p:"velaChao",n:[1,4],por:18}],rico:[{p:"tapete",n:[1,2],por:40},{p:"estatua",n:[0,2],por:40},{p:"planta",n:[1,2]}]},
  taverna:{nome:"Salão de taverna",amb:"Taverna",itens:[{p:"balcao",n:[1,1],chave:true,com:{p:"banqueta",frente:true}},{p:"lareira",n:[0,1],min:30},{p:"mesa",n:[2,12],por:11,grade:true,com:{p:"cadeira",lados:4},em:[["louca",1.2],["comida",.6],["velaMesa",.3]]},{p:"barril",n:[1,5],por:16,perto:"balcao"},{p:"armario",n:[0,1],perto:"balcao"},{p:"tocha",n:[2,6],por:14}],rico:[{p:"velaChao",n:[1,3],por:20},{p:"tapete",n:[0,1]}]},
  oficina:{nome:"Oficina e forja",amb:"Oficina e forja",itens:[{p:"forja",n:[1,1],chave:true},{p:"bigorna",n:[1,1],perto:"forja"},{p:"bancada",ou:"mesa",n:[1,2],por:16},{p:"ferramentas",n:[1,3],por:12},{p:"barril",n:[1,3],por:14},{p:"caixote",n:[1,4],por:12},{p:"armas",n:[0,2],por:20},{p:"tocha",n:[1,3],por:18}]},
  capela:{nome:"Capela",amb:"Templo",itens:[{p:"altar",n:[1,1],chave:true,fundo:true,lugar:"p",afasta:.9,em:[["velaMesa",1],["livros",.3]]},{p:"bancoLongo",n:[2,12],por:6,fileira:true},{p:"estatua",n:[0,2],por:30,perto:"altar"},{p:"velaChao",n:[2,6],por:10,perto:"altar"}],rico:[{p:"estatua",n:[1,2],por:30,perto:"altar"},{p:"velaChao",n:[2,4],por:10}]},
  guarda:{nome:"Sala de guarda e armaria",amb:"Militar e combate",itens:[{p:"armas",n:[1,4],por:9},{p:"manequim",n:[0,2],por:18},{p:"mesa",n:[1,1],com:{p:"cadeira",lados:2},em:[["louca",.8]]},{p:"bau",n:[1,3],por:14},{p:"barril",n:[0,2],por:18},{p:"caixote",n:[0,3],por:14},{p:"tocha",n:[1,3],por:14}]},
  loja:{nome:"Loja",amb:"Loja e mercado",itens:[{p:"balcao",n:[1,1],chave:true},{p:"armario",n:[2,8],por:7},{p:"estante",n:[0,3],por:14},{p:"caixote",n:[1,5],por:10},{p:"barril",n:[0,3],por:14},{p:"saco",n:[0,3],por:14},{p:"tapete",n:[0,1],prob:.4},{p:"lampada",n:[0,2],por:20}],rico:[{p:"planta",n:[1,2]},{p:"tapete",n:[1,1]},{p:"velaChao",n:[1,2]}]},
};
export const NOME_PAPEL={cama:"cama",criado:"criado-mudo",guardaRoupa:"guarda-roupa",estante:"estante",armario:"armário",bau:"baú",mesa:"mesa",mesaLonga:"mesa comprida",mesinha:"mesinha",escrivaninha:"escrivaninha",bancada:"bancada",cadeira:"cadeira",banqueta:"banqueta",bancoLongo:"banco",sofa:"sofá",poltrona:"poltrona",balcao:"balcão",barril:"barril",caixote:"caixote",saco:"saco",pote:"pote",fogao:"fogão",lareira:"lareira",pia:"pia",vaso:"vaso sanitário",banheira:"banheira",tapete:"tapete",planta:"planta",estatua:"estátua",altar:"altar",armas:"suporte de armas",manequim:"manequim",bigorna:"bigorna",forja:"forja",ferramentas:"ferramentas",velaChao:"candelabro",tocha:"tocha",lampada:"lâmpada",louca:"louça",comida:"comida",livros:"livros",velaMesa:"vela"};
export const PADRAO={dens:.7,bag:.6,riqueza:1,luz:true,estado:0,fonte:"auto",pacote:"",estilo:""};
export const RIQUEZAS=["Pobre","Comum","Rico","Nobre"];
// enfeites: a riqueza do lugar decide quantos entram (o essencial nao muda)
const DECOR=new Set(["tapete","planta","velaChao","estatua","poltrona","mesinha","lampada","tocha","estante","manequim","pote"]);

// ---------- escolha das artes nos pacotes ----------
// palavras de riqueza: o lugar rico prefere pecas finas, o pobre as simples
const RICO_P=["fancy","ornate","noble","royal","gold","golden","silver","velvet","marble","luxury","gilded","decorated","carved","elegant","polished","fine","rich","silk","crystal"],POBRE_P=["plain","simple","rough","crude","straw","hay","cot","rustic","cheap","wicker","stool","bedroll","shabby","worn","old","commoner","sack"];
export const valorRiqueza=nome=>{const t=pal(nome);let v=0;for(const w of t){if(RICO_P.includes(w))v++;if(POBRE_P.includes(w))v--}return v};
const pal=s=>(s||"").replace(/([a-z])([A-Z])/g,"$1 $2").toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
// item da fonte: {k, nome, pacote, estilo, sub}. Devolve os que servem para o papel
export function serve(papel,it,estado){const R=PAPEIS[papel];if(!R||!R.sub.includes(it.sub))return false;const t=pal(it.nome),S=new Set(t),tem=w=>S.has(w)||S.has(w+"s")||t.some(x=>x.startsWith(w)&&x.length<=w.length+2);
  if(NUNCA.some(tem)||TEMATICO.some(tem))return false;if(!(estado>=2)&&RUIM.some(tem))return false;if(R.nao&&R.nao.some(tem))return false;if(R.todas&&!R.todas.every(tem))return false;if(R.naoRe&&R.naoRe.test(it.nome))return false;return !R.q||R.q.some(tem)}
// papeis que um tipo de comodo usa
export function papeisDe(tipo){const C=COMODOS[tipo],S=new Set();if(!C)return [];for(const it of C.itens.concat(C.rico||[])){S.add(it.p);if(it.ou)S.add(it.ou);if(it.com)S.add(it.com.p);for(const e of it.em||[])S.add(e[0])}return [...S]}
// escolhe pacote, estilo e ate 8 artes por papel. fonte.lista(sub) -> itens. Devolve {pacote, estilo, papeis:{papel:[k...]}, faltam:[papel]}
export function escolheArtes(tipo,fonte,par,semente){par=Object.assign({},PADRAO,par);const R=rng((semente||1)*7919+13),ps=papeisDe(tipo),cand={},subs=new Map();
  const lista=s=>{if(!subs.has(s))subs.set(s,fonte.lista(s)||[]);return subs.get(s)};
  for(const p of ps){const L=[];for(const s of PAPEIS[p].sub)for(const it of lista(s))if(serve(p,it,par.estado))L.push(it);cand[p]=L}
  // pacote: o que cobre mais papeis (as pecas principais pesam mais); entre os 3 melhores, sorteia
  const C=COMODOS[tipo],peso=new Map();for(const it of C.itens)peso.set(it.p,Math.max(peso.get(it.p)||0,it.chave?3:PAPEIS[it.p].em?.5:1));
  const cob=new Map();for(const p of ps){const vistos=new Set();for(const it of cand[p]){if(vistos.has(it.pacote))continue;vistos.add(it.pacote);cob.set(it.pacote,(cob.get(it.pacote)||0)+(peso.get(p)||.5)*Math.min(1,.4+cand[p].filter(x=>x.pacote===it.pacote).length/40))}}
  const ordem=[...cob].sort((a,b)=>b[1]-a[1]||(a[0]<b[0]?-1:1));let pac=par.pacote&&cob.has(par.pacote)?par.pacote:null;
  if(!pac&&ordem.length){const top=ordem.filter(x=>x[1]>=ordem[0][1]*.85).slice(0,3);pac=top[Math.floor(R()*top.length)][0]}
  // estilo: o mais comum entre os moveis do pacote
  const est=new Map();for(const p of ps){if(!MOVEIS.has(p))continue;for(const it of cand[p])if(it.pacote===pac&&it.estilo)est.set(it.estilo,(est.get(it.estilo)||0)+1)}
  const eo=[...est].sort((a,b)=>b[1]-a[1]||(a[0]<b[0]?-1:1));let estilo=par.estilo&&est.has(par.estilo)?par.estilo:null;if(!estilo&&eo.length){const top=eo.filter(x=>x[1]>=eo[0][1]*.6).slice(0,4);estilo=top[Math.floor(R()*top.length)][0]}
  const emb=L=>{const A=L.slice();for(let i=A.length-1;i>0;i--){const j=Math.floor(R()*(i+1));[A[i],A[j]]=[A[j],A[i]]}return A};
  const out={},faltam=[];for(const p of ps){const L=cand[p];if(!L.length){faltam.push(p);out[p]=[];continue}
    // ordem de preferencia: mesmo pacote e estilo, mesmo pacote com as palavras do estilo, mesmo pacote, outros pacotes
    const pw=estilo&&MOVEIS.has(p)?estilo.split(" "):[],g=[[],[],[],[]];for(const it of L){const i=it.pacote!==pac?3:!MOVEIS.has(p)||it.estilo===estilo?0:pw.length&&pw.some(w=>(" "+it.estilo+" ").includes(" "+w+" "))?1:2;g[i].push(it)}
    // nomes mais curtos primeiro dentro do grupo (a peca em si, nao a variante rebuscada), com sorteio entre os parecidos
    const pega=[];for(const G of g){const pf=PAPEIS[p].pref,tp=it=>{if(!pf)return 0;const t=pal(it.nome);return pf.some(w=>t.includes(w))?0:1},rq=(par.riqueza==null?1:par.riqueza)-1.5,vr=it=>-Math.sign(rq)*Math.max(-2,Math.min(2,valorRiqueza(it.nome)))*Math.min(1,Math.abs(rq)),o=emb(G).sort((a,b)=>tp(a)-tp(b)||vr(a)-vr(b)||Math.round(a.nome.length/9)-Math.round(b.nome.length/9));for(const it of o){if(pega.length>=8)break;pega.push(it.k)}if(pega.length>=8)break}
    out[p]=pega}
  return {pacote:pac,estilo,papeis:out,faltam}}

// ---------- geometria ----------
const area=P=>{let a=0;for(let i=0;i<P.length;i++){const u=P[i],v=P[(i+1)%P.length];a+=u[0]*v[1]-v[0]*u[1]}return a/2};
function dentroP(P,x,y){let d=false;for(let i=0,j=P.length-1;i<P.length;j=i++){const a=P[i],b=P[j];if((a[1]>y)!==(b[1]>y)&&x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0])d=!d}return d}
function distBorda(P,x,y){let m=1e9;for(let i=0;i<P.length;i++){const a=P[i],b=P[(i+1)%P.length],dx=b[0]-a[0],dy=b[1]-a[1],L=dx*dx+dy*dy;let t=L?((x-a[0])*dx+(y-a[1])*dy)/L:0;t=Math.max(0,Math.min(1,t));const d=Math.hypot(x-a[0]-dx*t,y-a[1]-dy*t);if(d<m)m=d}return m}
const gira=(x,y,r)=>{const c=Math.cos(r),s=Math.sin(r);return [x*c-y*s,x*s+y*c]};
const FR={S:[0,1],N:[0,-1],L:[1,0],W:[-1,0]};
// frente usada para encostar: a do catalogo ou, sem ela, o lado comprido fica paralelo a parede
// (cama e excecao: sem saber a frente, a cabeceira - o lado curto - e que encosta)
const frenteDe=a=>{const f=a.fr;if(FR[f])return FR[f];if(f==="N|S")return FR.S;if(f==="L|W")return FR.L;const v=a.vis||[0,0,1,1],larga=(v[2]-v[0])*a.w>=(v[3]-v[1])*a.h;return a.prof==="longo"?(larga?FR.L:FR.S):larga?FR.S:FR.L};
// caixa desenhada da arte, em quadrados, relativa ao centro da imagem: [cx, cy, largura, altura]
// lado da imagem que esmaece (peca modular feita para emendar): esse lado vai encostado numa parede
const FUNDE=a=>a.funde&&FR[a.funde]?FR[a.funde]:null;
const visDe=a=>{const v=a.vis||[0,0,1,1];return [((v[0]+v[2])/2-.5)*a.w,((v[1]+v[3])/2-.5)*a.h,Math.max(.05,(v[2]-v[0])*a.w),Math.max(.05,(v[3]-v[1])*a.h)]};

// dois retangulos girados (ou circulos, para pecas redondas) se sobrepoem mais que a tolerancia?
const cantosR=(x,y,w,h,r)=>{const c=Math.cos(r),s=Math.sin(r);return [[-w/2,-h/2],[w/2,-h/2],[w/2,h/2],[-w/2,h/2]].map(([a,b])=>[x+a*c-b*s,y+a*s+b*c])};
export function bate(A,B,tol){tol=tol==null?.03:tol;if(A.red&&B.red)return Math.hypot(A.x-B.x,A.y-B.y)<A.red+B.red-tol;
  if(A.red||B.red){const C=A.red?A:B,Q=A.red?B:A,c=Math.cos(-Q.r),s=Math.sin(-Q.r),dx=C.x-Q.x,dy=C.y-Q.y,lx=dx*c-dy*s,ly=dx*s+dy*c,qx=Math.max(-Q.w/2,Math.min(Q.w/2,lx)),qy=Math.max(-Q.h/2,Math.min(Q.h/2,ly));return Math.hypot(lx-qx,ly-qy)<C.red-tol}
  for(const Pg of [A.c,B.c])for(let i=0;i<4;i++){const u=Pg[i],v=Pg[(i+1)%4],nx=v[1]-u[1],ny=u[0]-v[0],L=Math.hypot(nx,ny)||1;let a0=1e9,a1=-1e9,b0=1e9,b1=-1e9;for(const q of A.c){const d=(q[0]*nx+q[1]*ny)/L;if(d<a0)a0=d;if(d>a1)a1=d}for(const q of B.c){const d=(q[0]*nx+q[1]*ny)/L;if(d<b0)b0=d;if(d>b1)b1=d}if(a1<b0+tol||b1<a0+tol)return false}return true}
export const caixaDe=(x,y,w,h,r,redondo)=>({x,y,w,h,r,c:cantosR(x,y,w,h,r),red:redondo?Math.min(w,h)/2:0});

// ---------- gerador de comodo ----------
// z = {p:[[x,y]...], tipo, par, semente}; cat = {papel:[{k,w,h,fr,vis,cam,redondo}]}
// amb = {portas:[[x,y]], janelas:[[x,y]], obst:[{x,y,w,h,r}], mg (distancia da linha da zona ate a face da parede)}
// devolve {objs:[{k,x,y,r,w,h,l,papel}], luzes:[{x,y,pre}], avisos:[], area}
export function geraComodo(z,cat,amb){amb=amb||{};const par=Object.assign({},PADRAO,z.par),C=COMODOS[z.tipo],avisos=[],objs=[],luzes=[];
  let P=z.p.map(q=>[q[0],q[1]]);if(P.length<3||!C)return {objs,luzes,avisos:["Forma ou tipo inválido."],area:0};if(area(P)<0)P.reverse(); // sentido horario na tela (y para baixo): normal para dentro = (-dy, dx)
  const A=Math.abs(area(P)),R=rng(z.semente||1),mg=amb.mg==null?.05:amb.mg;
  let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9;for(const q of P){x0=Math.min(x0,q[0]);y0=Math.min(y0,q[1]);x1=Math.max(x1,q[0]);y1=Math.max(y1,q[1])}
  if((x1-x0)*(y1-y0)>3600)return {objs,luzes,avisos:["A zona é grande demais para um cômodo (até 60 × 60 quadrados)."],area:A};
  const nx=Math.ceil((x1-x0)/RES)+2,ny=Math.ceil((y1-y0)/RES)+2,ox=x0-RES,oy=y0-RES,N=nx*ny,D=new Float32Array(N),OC=new Uint8Array(N);
  for(let j=0;j<ny;j++)for(let i=0;i<nx;i++){const x=ox+(i+.5)*RES,y=oy+(j+.5)*RES,d=distBorda(P,x,y);D[j*nx+i]=dentroP(P,x,y)?d:-d}
  const cel=(x,y)=>{const i=Math.floor((x-ox)/RES),j=Math.floor((y-oy)/RES);return i<0||j<0||i>=nx||j>=ny?-1:j*nx+i};
  const dist=(x,y)=>dentroP(P,x,y)?distBorda(P,x,y):-distBorda(P,x,y);
  // casas cobertas por um retangulo girado (cx, cy, w, h, r)
  const casas=(cx,cy,w,h,r)=>{const c=Math.cos(r),s=Math.sin(r),ex=Math.abs(w/2*c)+Math.abs(h/2*s),ey=Math.abs(w/2*s)+Math.abs(h/2*c),L=[];
    const i0=Math.max(0,Math.floor((cx-ex-ox)/RES)),i1=Math.min(nx-1,Math.floor((cx+ex-ox)/RES)),j0=Math.max(0,Math.floor((cy-ey-oy)/RES)),j1=Math.min(ny-1,Math.floor((cy+ey-oy)/RES));
    for(let j=j0;j<=j1;j++)for(let i=i0;i<=i1;i++){const dx=ox+(i+.5)*RES-cx,dy=oy+(j+.5)*RES-cy,lx=dx*c+dy*s,ly=-dx*s+dy*c;if(Math.abs(lx)<=w/2&&Math.abs(ly)<=h/2)L.push(j*nx+i)}
    if(!L.length){const k=cel(cx,cy);if(k>=0)L.push(k)}return L};
  // reservas: frente das portas (2) e das janelas (so para pecas de parede: 8); obstaculos ja no mapa (1)
  const disco=(x,y,r,bit)=>{for(let j=Math.max(0,Math.floor((y-r-oy)/RES));j<=Math.min(ny-1,Math.floor((y+r-oy)/RES));j++)for(let i=Math.max(0,Math.floor((x-r-ox)/RES));i<=Math.min(nx-1,Math.floor((x+r-ox)/RES));i++)if(Math.hypot(ox+(i+.5)*RES-x,oy+(j+.5)*RES-y)<=r)OC[j*nx+i]|=bit};
  for(const d of amb.portas||[])disco(d[0],d[1],1.05,2);for(const d of amb.janelas||[])disco(d[0],d[1],.7,8);
  const postas=[];for(const o of amb.obst||[]){for(const k of casas(o.x,o.y,o.w,o.h,o.r||0))OC[k]|=1;postas.push(caixaDe(o.x,o.y,o.w,o.h,o.r||0))}
  // andar: casa livre com 3/4 de quadrado de folga
  const anda=new Uint8Array(N),fila=new Int32Array(N),visto=new Uint8Array(N);
  const refazAnda=()=>{let n=0;for(let j=0;j<ny;j++)for(let i=0;i<nx;i++){const k=j*nx+i;let ok=D[k]>=.3&&!(OC[k]&1);if(ok)for(let b=-1;b<=1&&ok;b++)for(let a=-1;a<=1;a++){const q=(j+b)*nx+i+a;if(OC[q]&1){ok=false;break}}anda[k]=ok?1:0;n+=anda[k]}return n};
  let totalAnda=refazAnda();
  const maisPerto=(x,y)=>{let m=1e9,r=-1;for(let k=0;k<N;k++)if(anda[k]){const d=Math.hypot(ox+(k%nx+.5)*RES-x,oy+(Math.floor(k/nx)+.5)*RES-y);if(d<m){m=d;r=k}}return m<2?r:-1};
  const ancoras=(amb.portas||[]).map(d=>maisPerto(d[0],d[1])).filter(k=>k>=0);
  if(!ancoras.length){let m=-1,r=-1;for(let k=0;k<N;k++)if(anda[k]&&D[k]>m){m=D[k];r=k}if(r>=0)ancoras.push(r)}
  const ligado=()=>{const tot=refazAnda();if(!ancoras.length)return true;if(!anda[ancoras[0]])return false;visto.fill(0);let a=0,b=0,n=0;fila[b++]=ancoras[0];visto[ancoras[0]]=1;
    while(a<b){const k=fila[a++];n++;const i=k%nx;if(i>0&&anda[k-1]&&!visto[k-1]){visto[k-1]=1;fila[b++]=k-1}if(i<nx-1&&anda[k+1]&&!visto[k+1]){visto[k+1]=1;fila[b++]=k+1}if(k>=nx&&anda[k-nx]&&!visto[k-nx]){visto[k-nx]=1;fila[b++]=k-nx}if(k<N-nx&&anda[k+nx]&&!visto[k+nx]){visto[k+nx]=1;fila[b++]=k+nx}}
    for(const q of ancoras)if(!visto[q])return false;return n>=tot*.88};
  // tenta por a arte a com o centro da parte desenhada em (vx, vy) e giro r. Devolve o objeto ou null
  const cabe=(a,vx,vy,r,o)=>{o=o||{};const V=visDe(a),fol=o.folga||0,L=casas(vx,vy,V[2]+fol*2,V[3]+fol*2,r),m=o.mg==null?mg:o.mg;
    // os quatro cantos e os meios dos lados precisam estar dentro, com a margem da parede
    for(const [a1,b1] of [[-1,-1],[1,-1],[1,1],[-1,1],[0,-1],[1,0],[0,1],[-1,0]]){const q=gira(a1*V[2]/2,b1*V[3]/2,r);if(dist(vx+q[0],vy+q[1])<m-.02)return null}
    const pro=o.passa?0:(1|2|(o.parede?8:0));if(pro)for(const k of L)if(OC[k]&pro)return null;
    // conferencia exata contra as pecas ja postas (a grade sozinha deixaria passar ate 1/4 de quadrado)
    let cx=null;if(!o.passa){cx=caixaDe(vx,vy,V[2]+fol*2,V[3]+fol*2,r,a.redondo);const tg=o.tolGrupo&&PAPEIS[o.tolGrupo]?(PAPEIS[o.tolGrupo].tol||0):0;for(const q of postas)if(q!==o.ignora&&bate(cx,q,q.cadeira&&o.cadeira?.12:tg&&q.grupo===o.tolGrupo?Math.max(.03,tg):.03))return null;if(fol)cx=caixaDe(vx,vy,V[2],V[3],r,a.redondo)}
    if(o.passa)for(const k of L)if(D[k]<0)return null;
    return {L:fol?casas(vx,vy,V[2],V[3],r):L,V,cx}};
  const poe=(a,papel,vx,vy,r,o)=>{o=o||{};const t=cabe(a,vx,vy,r,o);if(!t)return null;
    if(!o.passa&&!o.semCheque){for(const k of t.L)OC[k]|=1;if(!ligado()){for(const k of t.L)OC[k]&=~1;refazAnda();return null}}else if(!o.passa)for(const k of t.L)OC[k]|=1;
    const c=gira(t.V[0],t.V[1],r),ob={k:a.k,papel,x:+(vx-c[0]).toFixed(3),y:+(vy-c[1]).toFixed(3),r:+r.toFixed(4),w:a.w,h:a.h,l:o.l!=null?o.l:a.cam||200,vx,vy,vw:t.V[2],vh:t.V[3]};
    ob.red=!!a.redondo;ob._art=a;ob._L=o.passa?[]:t.L;if(!o.passa){ob._a=t.V[2]*t.V[3];ocup+=ob._a}if(t.cx){t.cx.cadeira=!!o.cadeira;t.cx.grupo=papel;ob._c=t.cx;postas.push(t.cx)}objs.push(ob);const pre=PAPEIS[papel]&&PAPEIS[papel].luz;if(pre&&par.luz)luzes.push({x:+vx.toFixed(3),y:+vy.toFixed(3),pre,_de:ob});return ob};
  const tira=ob=>{const i=objs.indexOf(ob);if(i<0)return;objs.splice(i,1);for(const k of ob._L||[])OC[k]&=~1;const j=postas.indexOf(ob._c);if(j>=0)postas.splice(j,1);ocup-=ob._a||0;luzes.splice(0,luzes.length,...luzes.filter(l=>l._de!==ob));refazAnda()};
  // lados da forma (so os que tem tamanho para encostar algo)
  const lados=[];for(let i=0;i<P.length;i++){const a=P[i],b=P[(i+1)%P.length],L=Math.hypot(b[0]-a[0],b[1]-a[1]);if(L<.01)continue;lados.push({a,b,L,t:[(b[0]-a[0])/L,(b[1]-a[1])/L],n:[-(b[1]-a[1])/L,(b[0]-a[0])/L],i})}
  const maior=lados.slice().sort((u,v)=>v.L-u.L)[0];
  const ang0=(()=>{const B=new Float32Array(18);let tot=0;for(const s of lados){let a=Math.atan2(s.t[1],s.t[0])%(Math.PI/2);if(a<0)a+=Math.PI/2;B[Math.min(17,Math.floor(a/(Math.PI/2)*18))]+=s.L;tot+=s.L}let bi=0;for(let i=1;i<18;i++)if(B[i]>B[bi])bi=i;
    if((B[bi]+B[(bi+1)%18]+B[(bi+17)%18])/tot<.45)return 0;let sx=0,sn=0;for(const s of lados){let a=Math.atan2(s.t[1],s.t[0])%(Math.PI/2);if(a<0)a+=Math.PI/2;let d=a-(bi+.5)*Math.PI/36;if(d>Math.PI/4)d-=Math.PI/2;if(d<-Math.PI/4)d+=Math.PI/2;if(Math.abs(d)<Math.PI/24){sx+=(a>Math.PI/4&&bi<3?a-Math.PI/2:a<Math.PI/4&&bi>14?a+Math.PI/2:a)*s.L;sn+=s.L}}return sn?sx/sn:0})();
  const dPorta=(x,y)=>{let m=99;for(const d of amb.portas||[])m=Math.min(m,Math.hypot(d[0]-x,d[1]-y));return m};
  const dPapel=(x,y,p)=>{let m=99;for(const o of objs)if(o.papel===p)m=Math.min(m,Math.hypot(o.vx-x,o.vy-y));return m};
  const dTudo=(x,y)=>{let m=99;for(const o of objs)if(!PAPEIS[o.papel].passa&&!PAPEIS[o.papel].em)m=Math.min(m,Math.hypot(o.vx-x,o.vy-y)-Math.min(o.vw,o.vh)/2);return m};
  const giroPara=(a,n)=>{const f=frenteDe(a);return Math.atan2(n[1],n[0])-Math.atan2(f[1],f[0])};
  const fundoDe=a=>{const V=visDe(a),f=frenteDe(a);return f[0]?V[2]:V[3]},largDe=a=>{const V=visDe(a),f=frenteDe(a);return f[0]?V[3]:V[2]};
  // encostar na parede: anda pelo contorno e experimenta; quem tem nota maior vai primeiro
  const naParede=(a,papel,it)=>{const fd=fundoDe(a),lg=largDe(a),T=[],fu=it._semFu?null:FUNDE(a),af=it.afasta!=null?it.afasta:(PAPEIS[papel].afasta||0);
    for(const s of lados){if(s.L<Math.min(lg,1)*.6)continue;let t0=Math.min(s.L/2,lg/2+.05),t1=s.L-t0;
      // ponta apagada: so nas pontas do lado, com a ponta virada para o canto
      if(fu){const r=giroPara(a,s.n),d=gira(fu[0],fu[1],r),pr=d[0]*s.t[0]+d[1]*s.t[1];if(Math.abs(pr)<.7)continue;const t=pr<0?lg/2+.02:s.L-lg/2-.02;if(t<0||t>s.L)continue;t0=t1=t}
      const passo=.25,n0=Math.floor(R()*2)*.125;for(let t=t0+(fu?0:n0);t<=t1+1e-6;t+=passo){const x=s.a[0]+s.t[0]*t,y=s.a[1]+s.t[1]*t;if(it._evita&&it._evita.some(q=>Math.hypot(q[0]-x,q[1]-y)<1.2))continue;
        let nota=R()*2.2;if(it.chave)nota+=Math.min(dPorta(x,y),8)*.12-Math.abs(t-s.L/2)/s.L*.8+Math.min(s.L,lg*2)*.1;if(it.perto){const d=dPapel(x,y,it.perto);if(d<90)nota-=d*.45}if(it.fundo)nota+=Math.min(dPorta(x,y),20)*.4-Math.abs(t-s.L/2)/s.L*4+(s.L>=3?1:-2);
        if(papel==="tocha")nota+=Math.min(dPapel(x,y,"tocha"),6)*.25;T.push([nota,s,x,y])}}
    T.sort((u,v)=>v[0]-u[0]);const r0=o=>o;
    for(const [,s,x,y] of T.slice(0,90)){const r=giroPara(a,s.n);for(const emp of [0,.12,.25,.4]){const d=mg+fd/2+emp+af,ob=poe(a,papel,x+s.n[0]*d,y+s.n[1]*d,r,{parede:true});if(ob){ob.n=s.n;return r0(ob)}}}return fu?naParede(a,papel,Object.assign({},it,{_semFu:true})):null};
  // canto: vertices com angulo perto de 90 graus
  const noCanto=(a,papel,it)=>{const V=visDe(a),T=[];for(let i=0;i<lados.length;i++){const s=lados[i],p=lados[(i+lados.length-1)%lados.length];if(s.L<.8||p.L<.8)continue;const cr=p.t[0]*s.t[1]-p.t[1]*s.t[0],dt=p.t[0]*s.t[0]+p.t[1]*s.t[1];if(cr<.5||Math.abs(dt)>.5)continue;T.push([R()+Math.min(dPorta(s.a[0],s.a[1]),6)*.1,s,p])}
    T.sort((u,v)=>v[0]-u[0]);for(const [,s,p] of T){const r=giroPara(a,s.n),w2=(Math.abs(Math.cos(r))>.7?V[2]:V[3])/2;for(const emp of [0,.15,.3]){const d1=mg+fundoDe(a)/2+emp,d2=mg+largDe(a)/2+emp,ob=poe(a,papel,s.a[0]+s.n[0]*d1+p.n[0]*d2,s.a[1]+s.n[1]*d1+p.n[1]*d2,r,{parede:true});if(ob)return ob}}return naParede(a,papel,it)};
  // meio: o ponto mais longe das paredes e das outras pecas
  const noMeio=(a,papel,it,o)=>{o=o||{};const V=visDe(a),rm=Math.max(V[2],V[3])/2,T=[];for(let j=0;j<ny;j+=2)for(let i=0;i<nx;i+=2){const k=j*nx+i;if(D[k]<Math.min(V[2],V[3])/2+(o.folga||0)+.2)continue;const x=ox+(i+.5)*RES,y=oy+(j+.5)*RES;
      let nota=Math.min(D[k],o.passa?99:dTudo(x,y)*.7+.6)+R()*1.1;if(it.perto){const d=dPapel(x,y,it.perto);if(d<90)nota-=d*(it.pertoPeso||.5)}if(it.meio)nota+=D[k]*it.meio;T.push([nota,x,y])}
    T.sort((u,v)=>v[0]-u[0]);const giros=a.redondo?[ang0]:V[2]>=V[3]?[ang0,ang0+Math.PI/2]:[ang0+Math.PI/2,ang0];
    for(const [,x,y] of T.slice(0,60))for(const r of (R()<.5?giros:giros.slice().reverse())){const ob=poe(a,papel,x,y,r+(o.viraFrente||0),o);if(ob)return ob}return null};
  // solto: perto das paredes e dos cantos, em grupinhos
  const solto=(a,papel,it)=>{const V=visDe(a),rm=Math.max(V[2],V[3])/2,T=[];for(let j=0;j<ny;j++)for(let i=0;i<nx;i++){const k=j*nx+i;if(D[k]<rm+mg||(OC[k]&3))continue;if(R()>.35)continue;const x=ox+(i+.5)*RES,y=oy+(j+.5)*RES;
      let nota=-D[k]*1.2+R()*.8;if(it.grupo){const d=dPapel(x,y,papel);if(d<90)nota-=Math.abs(d-rm*2.1)*.9}if(it.perto){const d=dPapel(x,y,it.perto);if(d<90)nota-=d*.5}T.push([nota,x,y])}
    T.sort((u,v)=>v[0]-u[0]);for(const [,x,y] of T.slice(0,50)){const r=a.redondo?R()*6.283:ang0+Math.floor(R()*4)*Math.PI/2+(R()-.5)*.25,ob=poe(a,papel,x,y,r);if(ob)return ob}return null};
  // escolhe a arte de um papel que cabe nos limites de tamanho (a mesma para todas as pecas, ou varias quando o papel varia)
  const escolhidas=new Map();
  const arteDe=papel=>{const Rp=PAPEIS[papel],L=(cat[papel]||[]).filter(a=>{const V=visDe(a);return Math.min(V[2],V[3])>=(Rp.tmin||Rp.t[0]*.6)&&(!Rp.tlong||Math.max(V[2],V[3])>=Rp.tlong)&&Math.max(V[2],V[3])<=Rp.t[1]&&Math.min(a.w,a.h)>=Rp.t[0]*.5});if(!L.length)return null;
    if(Rp.prof)for(const a of L)a.prof=Rp.prof;if(!escolhidas.has(papel))escolhidas.set(papel,L.slice(0,Rp.varia||1));const E=escolhidas.get(papel);return E[Math.floor(R()*E.length)]};
  const riq=Math.max(0,Math.min(3,par.riqueza==null?1:par.riqueza)),fRiq=[.15,1,1.6,2.2][riq];
  const quantos=it=>{if(it.min&&A<it.min)return 0;const dec=DECOR.has(it.p),f=dec?fRiq:1;if(it.prob!=null&&R()>Math.min(1,it.prob*fRiq))return it.n[0];let n=it.por?A/it.por*(.45+par.dens*.8)*f:it.n[0]+(it.n[1]-it.n[0])*Math.min(1,par.dens*R()*1.2*f);return Math.max(it.n[0],Math.min(it.n[1],Math.round(n)))};
  // balanco: o chao ocupado por moveis tem um teto (nao lotar) e um piso (nao ficar vazio sem querer)
  let ocup=0;const teto=(.24+.14*par.dens)*[.8,1,1.08,1.15][riq]*A,piso=(.07+.11*par.dens)*[.55,1,1.2,1.35][riq]*A;
  // cadeiras em volta, banquetas na frente, e o que vai em cima
  const emVolta=(mesa,it)=>{const cd=arteDe(it.com.p);if(!cd)return;const Vc=visDe(cd),fc=fundoDe(cd),lc=largDe(cd),ux=gira(1,0,mesa.r),uy=gira(0,1,mesa.r),S=[];
    const lado=(dir,meia,comp)=>{const n=it.com.n||Math.max(1,Math.floor((comp+.15)/Math.max(.95,lc+.25)));for(let i=0;i<n;i++){const t=(i+.5)/n-.5;S.push([dir,t*comp,meia])}};
    const fMesa=frenteDe(cat[mesa.papel].find(a=>a.k===mesa.k)||{}),lf=it.com.frente||it.com.n===1?[fMesa]:mesa.vw>=mesa.vh?[[0,1],[0,-1],[1,0],[-1,0]]:[[1,0],[-1,0],[0,1],[0,-1]];
    const usa=lf.slice(0,it.com.lados||(it.com.frente||it.com.n===1?1:4));for(const d of usa)lado(d,d[0]?mesa.vw/2:mesa.vh/2,d[0]?mesa.vh:mesa.vw);
    for(const k of mesa._L)OC[k]&=~1;
    for(const [d,t,meia] of S){const off=meia+fc/2-Math.min(.18,fc*.25),lx=d[0]*off+(d[0]?0:t),ly=d[1]*off+(d[1]?0:t),x=mesa.vx+ux[0]*lx+uy[0]*ly,y=mesa.vy+ux[1]*lx+uy[1]*ly,para=gira(-d[0],-d[1],mesa.r);
      poe(cd,it.com.p,x,y,giroPara(cd,para),{mg:Math.min(mg,.03),ignora:mesa._c,cadeira:true})}
    for(const k of mesa._L)OC[k]|=1;while(!ligado()&&objs.length&&objs[objs.length-1].papel===it.com.p&&objs[objs.length-1]!==mesa){const u=objs.pop();ocup-=u._a||0;for(const k of u._L)OC[k]&=~1;const i=postas.indexOf(u._c);if(i>=0)postas.splice(i,1);for(const k of mesa._L)OC[k]|=1}refazAnda()};
  const emCima=(base,it)=>{if(!it.em||par.bag<=0)return;const ar=base.vw*base.vh,n=Math.max(0,Math.min(7,Math.round(ar*1.4*par.bag*[.3,1,1.4,1.8][riq]*(.6+R()*.6)))),postos=[];let soma=0;for(const e of it.em)soma+=e[1];
    for(let q=0;q<n;q++){let s=R()*soma,p=it.em[0][0];for(const e of it.em){s-=e[1];if(s<=0){p=e[0];break}}const a=arteDe(p);if(!a)continue;const V=visDe(a),r2=Math.hypot(V[2],V[3])/2,mw=base.vw/2-r2-.06,mh=base.vh/2-r2-.06;if(mw<0||mh<0)continue;
      for(let t=0;t<10;t++){const lx=(R()*2-1)*mw,ly=(R()*2-1)*mh;if(base.red&&Math.hypot(lx,ly)>Math.min(base.vw,base.vh)/2-r2-.08)continue;if(postos.some(o=>Math.hypot(o[0]-lx,o[1]-ly)<o[2]+r2+.03))continue;postos.push([lx,ly,r2]);const g=gira(lx,ly,base.r),r=R()*6.283,c=gira(V[0],V[1],r);
        objs.push({k:a.k,papel:p,x:+(base.vx+g[0]-c[0]).toFixed(3),y:+(base.vy+g[1]-c[1]).toFixed(3),r:+r.toFixed(3),w:a.w,h:a.h,l:Math.max(300,(base.l||200)+50),vx:base.vx+g[0],vy:base.vy+g[1],vw:V[2],vh:V[3]});
        if(PAPEIS[p].luz&&par.luz&&!luzes.some(l=>Math.hypot(l.x-base.vx,l.y-base.vy)<2.5))luzes.push({x:+(base.vx+g[0]).toFixed(3),y:+(base.vy+g[1]).toFixed(3),pre:PAPEIS[p].luz});break}}};
  // fileiras (bancos de capela): linhas viradas para a peca principal, com um corredor no meio
  const fileiras=(it,n)=>{const a=arteDe(it.p),alvo=objs.find(o=>o.papel==="altar")||null;if(!a)return 0;const lg=largDe(a),fd=fundoDe(a);let feitos=0;
    const dir=alvo&&alvo.n?alvo.n:maior.n,lat=[-dir[1],dir[0]],c0=alvo?[alvo.vx,alvo.vy]:[(x0+x1)/2-dir[0]*(y1-y0)/2,(y0+y1)/2-dir[1]*(y1-y0)/2],r=giroPara(a,[-dir[0],-dir[1]]);let vazias=0;
    for(let f=0;f<40&&feitos<n&&vazias<3;f++){const d=(alvo?Math.max(alvo.vw,alvo.vh)/2+1.3:1)+fd/2+f*(fd+.8);let pos=false;
      for(const lado of [-1,1])for(let q=0;q<3&&feitos<n;q++){const off=lado*(.55+lg/2+q*(lg+.08));if(poe(a,it.p,c0[0]+dir[0]*d+lat[0]*off,c0[1]+dir[1]*d+lat[1]*off,r)){feitos++;pos=true}else break}
      vazias=pos?0:vazias+1}return feitos};
  // mesas em fileiras: uma grade regular alinhada com as paredes, centrada no comodo (o meio nao fica vazio)
  const emGrade=(a0,it,n)=>{const Rp=PAPEIS[it.p],cd=it.com?arteDe(it.com.p):null,ex=cd?Math.max(.3,fundoDe(cd)-.15):.15,corr=.45+(1-par.dens)*.6;let melhor=null;
    // centro do espaco que ainda esta livre (o balcao e a lareira ja ocuparam o deles)
    let ccx=0,ccy=0,ccn=0;for(let k=0;k<N;k++)if(D[k]>.5&&!(OC[k]&3)){ccx+=ox+(k%nx+.5)*RES;ccy+=oy+(Math.floor(k/nx)+.5)*RES;ccn++}ccx/=ccn||1;ccy/=ccn||1;
    // experimenta as mesas do papel (a escolhida e ate tres outras): ganha a que rende mais mesas, depois a maior
    const artes=[a0,...(cat[it.p]||[]).filter(x=>x!==a0&&Math.max(visDe(x)[2],visDe(x)[3])<=Rp.t[1]&&Math.min(visDe(x)[2],visDe(x)[3])>=Rp.t[0]*.6).slice(0,3)];
    for(const a of artes){const V=visDe(a);for(const r of (Math.abs(V[2]-V[3])<.2||a.redondo?[ang0]:[ang0,ang0+Math.PI/2])){const u=gira(1,0,r),v=gira(0,1,r),px=V[2]+2*ex+corr,py=V[3]+2*ex+corr,alc=Math.hypot(x1-x0,y1-y0)/2+2;
      for(let fa=0;fa<6;fa++)for(let fb=0;fb<6;fb++){const L=[];for(let i=-Math.ceil(alc/px);i<=Math.ceil(alc/px);i++)for(let j=-Math.ceil(alc/py);j<=Math.ceil(alc/py);j++){const lx=(i+fa/6)*px,ly=(j+fb/6)*py,x=ccx+u[0]*lx+v[0]*ly,y=ccy+u[1]*lx+v[1]*ly;if(x<x0||x>x1||y<y0||y>y1)continue;if(cabe(a,x,y,r,{folga:ex+.1}))L.push([x,y,Math.hypot(x-ccx,y-ccy)])}
        if(!L.length)continue;L.sort((p,q)=>p[2]-q[2]);const usa=L.slice(0,n);let mx=0,my=0;for(const q of usa){mx+=q[0]-ccx;my+=q[1]-ccy}const nota=usa.length*100+V[2]*V[3]*4+(a===a0?3:0)-Math.hypot(mx,my)/usa.length*8-usa.reduce((t,q)=>t+q[2],0)/usa.length;if(!melhor||nota>melhor.nota)melhor={nota,usa,r,a}}}}
    const feitos=[];if(melhor){escolhidas.set(it.p,[melhor.a]);for(const [x,y] of melhor.usa){const ob=poe(melhor.a,it.p,x,y,melhor.r,{folga:.1});if(ob)feitos.push(ob)}}return feitos};
  // grupos: barris em fileira encostados numa parede; sacos, potes e caixotes amontoados num canto (as vezes empilhados)
  const grupo=(it,n)=>{const Rp=PAPEIS[it.p],tipo=it.arranjo||Rp.arranjo,feitos=[],nm=n>6&&tipo==="monte"?2:1;
    for(let m=0;m<nm&&feitos.length<n;m++){const alvo=Math.ceil((n-feitos.length)/(nm-m));const a0=arteDe(it.p);if(!a0)break;
      const evita=[];let p0=null,M=null;
      for(let tent=0;tent<(tipo==="fileira"?6:1);tent++){p0=tipo==="fileira"?naParede(a0,it.p,Object.assign({},it,{_evita:evita})):(noCanto(a0,it.p,it)||naParede(a0,it.p,it));if(!p0)break;M=[p0];
      if(tipo==="fileira"){const n0=p0.n||[0,1],td=[-n0[1],n0[0]];for(const sg of R()<.5?[1,-1]:[-1,1]){let u=p0;while(M.length<alvo){const a=arteDe(it.p);let ob=null;
          for(const gap of [.03+R()*.06,.15,.3]){const d=largDe(u._art)/2+largDe(a)/2+gap,dn=(fundoDe(a)-fundoDe(u._art))/2;ob=poe(a,it.p,u.vx+td[0]*sg*d+n0[0]*dn,u.vy+td[1]*sg*d+n0[1]*dn,giroPara(a,n0),{parede:true,tolGrupo:it.p});if(ob)break}
          if(!ob)break;ob.n=n0;M.push(ob);u=ob}}
        if(M.length<Math.min(alvo,3)&&tent<5){evita.push([p0.vx,p0.vy]);for(const o of M)tira(o);p0=null;continue}}break}
      if(!p0)break;if(tipo==="fileira"){feitos.push(...M);continue}feitos.push(p0);
      {      // monte: aneis em volta do primeiro, preferindo perto da parede e do centro do monte
        for(let tent=0;tent<alvo*14&&M.length<alvo;tent++){const a=arteDe(it.p),V=visDe(a),rr=Math.max(V[2],V[3])/2;let cx=0,cy=0;for(const o of M){cx+=o.vx;cy+=o.vy}cx/=M.length;cy/=M.length;const b=M[Math.floor(R()*M.length)],an=R()*6.283,d=Math.max(b.vw,b.vh)/2+rr-(Rp.tol||0)*.8+R()*.05,x=b.vx+Math.cos(an)*d,y=b.vy+Math.sin(an)*d;
          if(Math.hypot(x-cx,y-cy)>Math.max(1.2,Math.sqrt(alvo)*rr*1.6))continue;const ki=cel(x,y);if(ki<0||D[ki]>Math.max(1.6,Math.sqrt(alvo)*rr*1.8))continue;const r=a.redondo?R()*6.283:p0.r+(R()-.5)*(it.p==="saco"?1.2:.35),ob=poe(a,it.p,x,y,r,{tolGrupo:it.p,parede:true});if(ob){M.push(ob);feitos.push(ob)}}
        // caixotes empilhados: alguns em cima dos outros, um pouco tortos
        if(Rp.pilha)for(const o of M.slice()){if(R()>Rp.pilha*(.5+par.dens))continue;const a=arteDe(it.p),V=visDe(a);const folg=Math.min(o.vw,o.vh)-Math.hypot(V[2],V[3])*.98;if(folg<0)continue;const r=o.r+(R()-.5)*.5,c=gira(V[0],V[1],r),ox2=(R()-.5)*folg*.5,oy2=(R()-.5)*folg*.5;
          objs.push({k:a.k,papel:it.p,x:+(o.vx+ox2-c[0]).toFixed(3),y:+(o.vy+oy2-c[1]).toFixed(3),r:+r.toFixed(3),w:a.w,h:a.h,l:(o.l||200)+5,vx:o.vx+ox2,vy:o.vy+oy2,vw:V[2],vh:V[3]})}}}
    return feitos};
  // ---------- ordem: tapetes, principais, o resto por lugar ----------
  const ordem=it=>PAPEIS[it.p].passa?6:it.chave?1:it.fileira?1.5:({p:2,k:3,m:4,s:5})[PAPEIS[it.p].lugar]||5;
  const itens=C.itens.concat(riq>=2&&C.rico?C.rico.map(x=>Object.assign({rico:true},x,{n:riq>=3?[x.n[0]+1,x.n[1]+1]:x.n})):[]).map((it,i)=>[ordem(it),i,it]).sort((a,b)=>a[0]-b[0]||a[1]-b[1]).map(x=>x[2]);let faltou=new Set();
  for(let it of itens){const n=quantos(it);if(!n)continue;if(!arteDe(it.p)&&it.ou&&arteDe(it.ou))it=Object.assign({},it,{p:it.ou,lugar:PAPEIS[it.p].lugar});const Rp=PAPEIS[it.p];if(!arteDe(it.p)){if(it.n[0]>0||it.chave)faltou.add(it.p);continue}
    if(it.fileira){fileiras(it,n);continue}
    if((it.arranjo||Rp.arranjo)&&n>1){const F=grupo(it,n);if(F.length){if(F.length<it.n[0])avisos.push("Não coube: "+(NOME_PAPEL[it.p]||it.p)+".");continue}}
    if(it.grade&&n>1){const a=arteDe(it.p),F=emGrade(a,it,n);if(F.length){for(const ob of F){if(it.com)emVolta(ob,it);emCima(ob,it)}continue}}
    for(let q=0;q<n;q++){if(q>=Math.max(1,it.n[0])&&!Rp.passa&&ocup>teto)break;const a=arteDe(it.p);let ob=null;const lugar=it.lugar||Rp.lugar;
      // tapete: debaixo da peca principal (mesa, cama, sofa), depois que ela ja esta no lugar
      if(Rp.passa){const sob=["mesa","cama","sofa","mesinha","escrivaninha","altar","balcao"].find(p=>objs.some(o=>o.papel===p&&!objs.some(t=>t.papel===it.p&&Math.hypot(t.vx-o.vx,t.vy-o.vy)<1)));ob=noMeio(a,it.p,Object.assign({},it,{perto:sob,pertoPeso:2.5}),{passa:true,l:a.cam&&a.cam<200?a.cam:100})}
      else if(lugar==="p")ob=naParede(a,it.p,it);else if(lugar==="k")ob=noCanto(a,it.p,it);
      else if(lugar==="m")ob=noMeio(a,it.p,it,{folga:it.com?.75:.3})||noMeio(a,it.p,it,{folga:.15});else ob=solto(a,it.p,it);
      if(!ob&&q===0&&!Rp.em){const E=escolhidas.get(it.p)||[],todas=(cat[it.p]||[]).filter(x=>!E.includes(x)&&Math.max(visDe(x)[2],visDe(x)[3])<Math.max(visDe(a)[2],visDe(a)[3])-.2&&Math.max(visDe(x)[2],visDe(x)[3])<=Rp.t[1]&&Math.min(visDe(x)[2],visDe(x)[3])>=Rp.t[0]*.6);
        for(const b of todas.slice(0,3)){escolhidas.set(it.p,[b]);ob=lugar==="p"?naParede(b,it.p,it):lugar==="k"?noCanto(b,it.p,it):lugar==="m"?noMeio(b,it.p,it,{folga:.15}):solto(b,it.p,it);if(ob)break}}
      if(!ob){if(q<it.n[0])avisos.push("Não coube: "+(NOME_PAPEL[it.p]||it.p)+".");break}
      if(it.com)emVolta(ob,it);emCima(ob,it)}}
  // piso: se ficou vazio demais, completa com pecas de parede, canto e soltas da propria receita (uma de cada por vez)
  if(ocup<piso){const extras=itens.filter(it=>!it.chave&&!it.fileira&&!it.grade&&!PAPEIS[it.p].passa&&!PAPEIS[it.p].em&&(it.lugar||PAPEIS[it.p].lugar)!=="m"&&arteDe(it.p)&&!(it.min&&A<it.min));
    for(let volta=0,pos=true;volta<4&&pos&&ocup<piso;volta++){pos=false;for(const it of extras){if(ocup>=piso)break;if(objs.filter(o=>o.papel===it.p).length>=it.n[1])continue;if(it.arranjo||PAPEIS[it.p].arranjo){const F=grupo(it,Math.min(3,it.n[1]-objs.filter(o=>o.papel===it.p).length));if(F.length)pos=true;continue}const a=arteDe(it.p),lugar=it.lugar||PAPEIS[it.p].lugar,ob=lugar==="p"?naParede(a,it.p,it):lugar==="k"?noCanto(a,it.p,it):solto(a,it.p,it);if(ob){pos=true;emCima(ob,it)}}}}
  if(faltou.size)avisos.push("Sem arte para: "+[...faltou].map(p=>NOME_PAPEL[p]||p).join(", ")+".");
  for(const l of luzes)delete l._de;for(const o of objs){delete o.vx;delete o.vy;delete o.vw;delete o.vh;delete o._L;delete o._c;delete o._a;delete o.n;delete o.red;delete o._art}
  return {objs,luzes,avisos,area:A,anda:totalAnda}}
