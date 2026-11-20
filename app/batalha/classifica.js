// Atlas - Modo Batalha: classificacao inteligente das artes dos pacotes (sem DOM).
// Pelo caminho (pastas + nome) e pelas etiquetas do autor sai: categoria e subcategoria em portugues, ambientes,
// material e cor, onde encosta (parede, canto, meio, solto) e se da para passar por cima.
// Serve para a biblioteca (escolher a mao), para o painel da arte escolhida e para o catalogo da IA.
const pal=s=>(s||"").replace(/([a-z])([A-Z])/g,"$1 $2").toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
// [categoria, subcategoria, palavras (uma basta), palavras que impedem]
export const ARVORE=[
  ["Iluminação","Luzes (forma)",["lights"],null,"pasta"],
  ["Chão e efeitos","Sombras",["shadow","shadows"]],
  ["Iluminação","Tochas e braseiros",["campfire","campfires","bonfire","bonfires","firepit","torch","torches","brazier","braziers","sconce","sconces"]],
  ["Iluminação","Velas e candelabros",["candle","candles","candelabra","candelabrum","chandelier","chandeliers"]],
  ["Iluminação","Lâmpadas e lanternas",["lamp","lamps","lantern","lanterns","table_lamp","floor_lamp","desk_lamp","lightsources","streetlight","streetlights","neon","lightbulb","spotlight"]],
  ["Natureza","Árvores",["tree","trees","palm","palms","pine","oak","willow","birch","stump","stumps","trunk","canopy"],["family","christmas","xmas","tree_house"]],
  ["Natureza","Arbustos e plantas",["bush","bushes","shrub","shrubs","plant","plants","fern","ferns","flora","hedge","reed","reeds","cactus","cacti","succulent","weed","weeds","ivy","vine","vines","botanical"]],
  ["Natureza","Flores",["flower","flowers","rose","roses","tulip","lily","blossom","petals"]],
  ["Natureza","Cogumelos e fungos",["mushroom","mushrooms","fungi","fungus","toadstool"]],
  ["Natureza","Pedras e rochas",["rock","rocks","boulder","boulders","stalagmite","stalagmites","stalactite","pebble","pebbles","crystal","crystals","ore","geode","cliff","cliffs","mountain","rubble_rock"]],
  ["Natureza","Folhas, galhos e troncos",["leaves","leaf","twig","twigs","branch","branches","log","logs","sticks","driftwood"]],
  ["Natureza","Água",["water","puddle","puddles","pond","waterfall","coral","seaweed","aquatic","lilypad","lily_pad"]],
  ["Corpos e criaturas","Corpos e ossos",["corpse","corpses","body","bodies","skeleton","skeletons","bones","bone","skull","skulls","carcass","mummified","gore","flesh","organ","organs","remains"]],
  ["Corpos e criaturas","Animais",["animal","animals","horse","cow","pig","chicken","dog","cat","bird","fish","rat","pigeon","sheep","goat","beast"]],
  ["Corpos e criaturas","Pessoas e manequins",["mannequin","mannequins","npc","person","people","pedestrian","humanoid"]],
  ["Arquitetura","Escadas",["stair","stairs","staircase","ladder","ladders","steps","escalator"]],
  ["Arquitetura","Colunas e vigas",["pillar","pillars","column","columns","beam","beams","support","supports","post","posts","arch","arches","buttress"]],
  ["Arquitetura","Portas, portões e janelas",["door_frame","doorframe","door","doors","gate","gates","window","windows","portcullis","doorway","shutter","shutters","garage"]],
  ["Arquitetura","Telhados e toldos",["dome","domes","roof","roofs","rooftop","awning","awnings","tarp","tarps","canopies","eave"]],
  ["Arquitetura","Cercas e grades",["fence","fences","railing","railings","rail","barrier","barriers","barricade","palisade","bars","grate","grating"]],
  ["Arquitetura","Muros e paredes",["wall","walls","curb","curbs","brickwork","masonry","battlement"]],
  ["Arquitetura","Pontes, plataformas e pisos",["tileset","prefab","bridge","bridges","platform","platforms","walkway","walkways","dock","docks","pier","boardwalk","scaffold","scaffolding","floor","floors","tile","tiles","inlay","inlays","planks","plank"]],
  ["Arquitetura","Construções e tendas",["tent","tents","building","buildings","tower","towers","hut","shack","shelter","well","wells","fountain","fountains","gazebo","stall","stalls","kiosk","booth","structure","structures","aqueduct","chimney","silo","windmill"]],
  ["Móveis","Camas",["bed","beds","bedding","bedroll","bedrolls","cot","cots","hammock","crib","mattress","futon","bunk"]],
  ["Móveis","Mesas",["table","tables","desk","desks","nightstand","workbench","workbenches"],["tablecloth"]],
  ["Móveis","Cadeiras, bancos e sofás",["bar_stool","barstool","chair","chairs","stool","stools","bench","benches","seating","seat","seats","sofa","sofas","couch","armchair","throne","thrones","pew","pews","booth"]],
  ["Móveis","Armários e estantes",["vanity","nightstands","wardrobe","wardrobes","cabinet","cabinets","cupboard","cupboards","shelf","shelves","shelving","bookcase","bookcases","bookshelf","bookshelves","dresser","dressers","drawer","drawers","locker","lockers","rack","racks","display","cases","vitrine","closet","fridge","refrigerator"]],
  ["Móveis","Balcões e bares",["counter","counters","bar","bars","reception","checkout"]],
  ["Armazenamento","Caixas e caixotes",["safe","safes","case","cases","toolbox_case","crate","crates","box","boxes","container","containers","pallet","pallets","package","parcel"]],
  ["Armazenamento","Barris",["barrel","barrels","keg","kegs","cask","casks","drum","drums"]],
  ["Armazenamento","Sacos e cestos",["sack","sacks","bag","bags","basket","baskets","bundle","bundles"]],
  ["Armazenamento","Baús",["chest","chests","trunk","trunks","coffer"]],
  ["Armazenamento","Potes, vasos e urnas",["vat","vats","canister","canisters","cylinder","cylinders","bucket","buckets","pot","pots","pottery","jar","jars","urn","urns","vase","vases","amphora","jug","jugs"]],
  ["Cozinha e banheiro","Fogões, fornos e lareiras",["stove","stoves","oven","ovens","fireplace","fireplaces","hearth","furnace","cauldron","grill"]],
  ["Cozinha e banheiro","Pias e bacias",["sink","sinks","basin","basins","washbasin","faucet"]],
  ["Cozinha e banheiro","Banheiras e chuveiros",["bath","bathtub","tub","tubs","shower","showers","bidet"]],
  ["Cozinha e banheiro","Vasos sanitários",["toilet","toilets","urinal","urinals","latrine","outhouse"]],
  ["Decoração","Tapetes",["rug","rugs","carpet","carpets","mat","mats","runner"]],
  ["Decoração","Quadros, placas e cartazes",["painting","paintings","frame","frames","plaque","plaques","sign","signs","signage","poster","posters","billboard","picture","portrait","map","maps","board","boards","graffiti"]],
  ["Decoração","Estátuas",["statue","statues","bust","busts","sculpture","sculptures","idol","idols","totem","gargoyle","monument"]],
  ["Decoração","Bandeiras, cortinas e tecidos",["banner","banners","flag","flags","tapestry","tapestries","curtain","curtains","drape","drapes","cloth","cloths","bunting","pennant","sheet","sheets","pillow","pillows","cushion","cushions","blanket","blankets","towel","towels","clothing","clothes","outfits","rags"]],
  ["Decoração","Espelhos",["mirror","mirrors"]],
  ["Decoração","Enfeites",["exhibit","fossil","fossils","easel","easels","sculpture_stand","umbrella","umbrellas","ornament","ornaments","decoration","decorations","adornments","trophy","trophies","taxidermy","orrery","orreries","globe","clock","clocks","vase_flowers","model"]],
  ["Decoração","Livros e papéis",["writing","stationary","stationery","ink","inkwell","stamp","stamps","quill","pen","pens","crayon","crayons","pencil","pencils","magazine","magazines","literature","sigils","envelope","envelopes","book","books","tome","tomes","scroll","scrolls","paper","papers","letter","letters","note","notes","newspaper","document","documents","folder","folders"]],
  ["Decoração","Plantas em vaso",["potted","planter","planters","flowerpot"]],
  ["Comida e louça","Comida",["egg","eggs","consumable","consumables","food","meal","meals","bread","cheese","meat","meats","fruit","fruits","vegetable","vegetables","apple","fish_food","pie","cake","soup","crops","grain","hay","wheat"]],
  ["Comida e louça","Louça e copos",["drink","drinks","tray","trays","dish","dishes","plate","plates","cup","cups","mug","mugs","bowl","bowls","kitchenware","cutlery","glass","glassware","bottle","bottles","goblet","goblets","tankard","teapot","pitcher","utensils"]],
  ["Objetos","Armas e armaduras",["cannonball","cannonballs","helmet","helmets","ammo_magazine","riot","target","targets","archery","quiver","weapons","sword","swords","axe","axes","spear","spears","bow","bows","shield","shields","armor","armour","gun","guns","rifle","rifles","pistol","ammo","ammunition","cannon","cannons","catapult","ballista"]],
  ["Objetos","Ferramentas",["tool","tools","hammer","anvil","anvils","saw","shovel","pickaxe","rake","wrench","toolbox","tongs","grindstone","loom","spinning"]],
  ["Objetos","Tesouro e joias",["treasure","coin","coins","gold_pile","gem","gems","jewel","jewels","jewelry","crown","loot","trinket","trinkets"]],
  ["Objetos","Instrumentos e jogos",["gramophone","musical","music","gym","boxing","ski","sport","attraction","dumbbell","weights","skateboard","ball","balls","sports","playground","casino","chips","instrument","instruments","piano","harp","lute","drum_kit","guitar","game","games","chess","dice","cards","toy","toys","arcade","pinball","pool_table"]],
  ["Objetos","Magia e alquimia",["spell","component","components","sigil","alchemy","potion","potions","magic","arcane","rune","runes","ritual","orb","orbs","wand","staff","grimoire","pentagram","altar","altars","crystal_ball"]],
  ["Objetos","Prisão e tortura",["breaking_wheel","trap","traps","chain","chains","shackle","shackles","cage","cages","torture","torment","restraint","restraints","rack_torture","stocks","pillory","gallows","guillotine","iron_maiden"]],
  ["Cozinha e banheiro","Higiene",["razor","razors","shaving","grooming","toiletries","toiletry","cosmetics","makeup","soap","toothbrush","comb","towel_hook","hairdryer"]],
  ["Objetos","Objetos pessoais",["cigarette","cigarettes","cigar","cigars","smoking","ashtray","ashtrays","wallet","wallets","purse","handbag","glasses","sunglasses","phone","phones","keys","keychain","watch","umbrella_closed"]],
  ["Túmulos","Caixões, túmulos e lápides",["coffin","coffins","sarcophagus","sarcophagi","grave","graves","tomb","tombs","tombstone","gravestone","headstone","burial","crypt","ossuary","mausoleum"]],
  ["Veículos","Veículos",["motorbike","motorbikes","motorcycles","bikes","wheel","wheels","tire","tires","tyre","tyres","cart","carts","wagon","wagons","carriage","carriages","ship","ships","boat","boats","canoe","raft","car","cars","truck","trucks","van","bus","vehicle","vehicles","bike","bicycle","motorcycle","train","tram","helicopter","plane","airship","spaceship","lander","rover","forklift","sail","sails","rigging","anchor"]],
  ["Equipamentos","Máquinas e tecnologia",["heater","heaters","lever","levers","control","controls","panel","panels","greeble","greebles","machine","machines","machinery","computer","computers","monitor","monitors","screen","screens","console","consoles","terminal","terminals","server","servers","electronics","tv","television","generator","engine","engines","robot","robots","hologram","vending","atm","appliance","appliances","washing","printer","camera","speaker","speakers","fan","fans","ac","radiator","boiler","pump","tank","tanks","mechanical","cog","cogs","gear_cog"]],
  ["Equipamentos","Canos e cabos",["vent","vents","pipe","pipes","cable","cables","wire","wires","duct","ducts","valve","valves","hose"]],
  ["Equipamentos","Oficina e trabalho",["workplace","equipment","workshop","forge","smithy","carpentry","tailoring","sewing","mining","mine","press","crane","pulley","winch","lumber","sawmill"]],
  ["Equipamentos","Medicina e laboratório",["anatomy","cyberware","implant","implants","prosthetic","medical","hospital","surgery","stretcher","gurney","wheelchair","iv","laboratory","lab","microscope","beaker","flask","flasks","specimen"]],
  ["Chão e efeitos","Manchas e marcas",["burrow","burrows","hole","holes","crack","cracks","stain","stains","blood","splatter","splatters","decal","decals","mark","marks","scorch","burn","burns","footprints","tracks","oil","paint","dirt_patch","mud","wound","wounds","grime"]],
  ["Chão e efeitos","Entulho e lixo",["rubble","debris","trash","garbage","junk","scrap","broken","pile","piles","litter","wreckage","ruins","ruin","rocks_small"]],
  ["Chão e efeitos","Efeitos e brilhos",["fire","flame","flames","smoke","fog","mist","magic_effect","effect","effects","glow","spark","sparks","lightning","explosion","portal","aura","beam_light","overlay","overlays"]],
  ["Chão e efeitos","Caminhos e trilhas",["path","paths","road","roads","trail","street","crosswalk","sidewalk","rail_track","railway"]],
];
const AMB=[
  ["Taverna",["tavern","inn","bar","keg","kegs","ale","beer","tankard","tankards","mug","mugs","pub","barrel"]],
  ["Cozinha",["kitchen","stove","oven","kitchenware","cutlery","cauldron","food","meal","meals","bread","dish","dishes","pantry","fridge","grill"]],
  ["Quarto",["bedroom","bed","beds","bedding","wardrobe","wardrobes","dresser","nightstand","crib"]],
  ["Biblioteca e estudo",["library","book","books","bookcase","bookshelf","bookshelves","tome","tomes","scroll","scrolls","desk","desks","study","globe"]],
  ["Banheiro",["bathroom","toilet","toilets","bath","bathtub","tub","shower","sink","urinal","latrine"]],
  ["Templo",["temple","church","altar","altars","shrine","pew","pews","holy","chapel","idol","statue","statues","monastery","cathedral"]],
  ["Cripta e cemitério",["crypt","coffin","coffins","sarcophagus","sarcophagi","grave","graves","tomb","tombs","burial","cemetery","mausoleum","ossuary","skeleton","skeletons","bones"]],
  ["Masmorra e prisão",["dungeon","prison","cell","cells","chain","chains","shackle","shackles","cage","cages","torture","torment","restraint","restraints","jail","gallows"]],
  ["Oficina e forja",["workshop","forge","smithy","anvil","anvils","workbench","workbenches","tool","tools","carpentry","tailoring","sewing","loom","workplace"]],
  ["Laboratório e alquimia",["alchemy","laboratory","lab","potion","potions","beaker","flask","flasks","glassware","specimen","arcane","ritual"]],
  ["Hospital",["hospital","medical","surgery","stretcher","gurney","wheelchair","ripperdoc","clinic"]],
  ["Loja e mercado",["shop","store","market","marketplace","stall","stalls","counter","display","goods","merchant","vendor","vending","checkout","mall"]],
  ["Escritório",["office","computer","computers","printer","filing","cubicle","reception","desk","monitor"]],
  ["Rua e cidade",["street","streets","road","roads","curb","curbs","sidewalk","crosswalk","signage","settlement","settlements","city","town","bench","streetlight","hydrant","car","cars","bus","traffic","alley","slums"]],
  ["Floresta e campo",["forest","woodlands","tree","trees","bush","bushes","log","logs","mushroom","mushrooms","flora","stump","fern","meadow","grass"]],
  ["Caverna e mina",["cave","caves","cavern","stalagmite","stalagmites","stalactite","crystal","crystals","underdark","mine","mining","ore","fungi"]],
  ["Deserto",["desert","cactus","cacti","sand","dune","dunes","palm","oasis"]],
  ["Neve e gelo",["arctic","snow","ice","frozen","igloo","glacier"]],
  ["Água, praia e porto",["aquatic","water","ship","ships","boat","boats","dock","docks","pier","beach","coral","harbor","harbour","sail","sails","anchor","fishing"]],
  ["Acampamento",["camp","camping","tent","tents","bedroll","bedrolls","campfire","tarp","tarps"]],
  ["Fazenda",["farm","farming","crop","crops","hay","barn","wheat","plow","stable","chicken","cow","pig","sheep"]],
  ["Militar e combate",["military","combat","war","weapon","weapons","armor","barricade","sandbag","sandbags","armory","barracks","siege","catapult","cannon","warzone"]],
  ["Ficção científica",["sci","scifi","spaceship","cyber","cyberpunk","cyberspace","hologram","neon","futuristic","rave","martian","lander","android","robot","server"]],
  ["Horror",["horror","gore","flesh","blood","tendril","ceremorph","eldritch","corpse","corpses"]],
  ["Moderno",["modern","electronics","tv","television","computer","fridge","car","cars","truck","atm","vending","highway","school","mall","gamestore"]],
];
const MAT=[["Madeira",["wood","wooden","oak","walnut","ashen","plank","planks","timber","bamboo","wicker"]],["Pedra",["stone","marble","granite","slate","brick","bricks","cobble","cobblestone","sandstone","volcanic","redrock","earthy","concrete","rock"]],["Metal",["metal","iron","steel","brass","copper","bronze","rusty","polished","chrome","tin"]],["Tecido e couro",["cloth","fabric","silk","leather","wool","linen","velvet","canvas"]],["Vidro e cristal",["glass","crystal","crystals"]],["Osso",["bone","bones","ivory"]],["Ouro e prata",["gold","golden","silver"]],["Plástico",["plastic"]]];
const CORES={black:"preto",white:"branco",gray:"cinza",grey:"cinza",red:"vermelho",blue:"azul",green:"verde",yellow:"amarelo",orange:"laranja",purple:"roxo",pink:"rosa",brown:"marrom",tan:"bege",olive:"oliva",navy:"marinho",teal:"azul-petróleo",cyan:"ciano",beige:"bege",dark:"escuro",light:"claro",colorable:"colorível"};
// encosta: parede, canto, meio, solto. passavel: da para andar por cima (tapete, mancha, folhas...)
const PAREDE=new Set(["wardrobe","wardrobes","cabinet","cabinets","cupboard","cupboards","shelf","shelves","shelving","bookcase","bookcases","bookshelf","bookshelves","dresser","dressers","counter","counters","sink","sinks","toilet","toilets","urinal","fireplace","fireplaces","hearth","stove","stoves","oven","ovens","painting","paintings","frame","frames","plaque","plaques","mirror","mirrors","sconce","sconces","tapestry","tapestries","curtain","curtains","locker","lockers","rack","racks","vending","fridge","refrigerator","radiator","whiteboard","blackboard","billboard","poster","posters","shower","showers","bunk","wall","washbasin","faucet","awning","awnings","shutter","shutters","window","windows","door","doors","fridge","server","servers","bar"]);
const CANTO=new Set(["corner","corners"]);
const MEIO=new Set(["table","tables","rug","rugs","carpet","carpets","fountain","fountains","altar","altars","statue","statues","pool","billiards","bed","beds","throne","thrones"]);
const PASSA=new Set(["rug","rugs","carpet","carpets","mat","mats","runner","stain","stains","blood","splatter","splatters","decal","decals","puddle","puddles","leaves","leaf","twig","twigs","grass","petals","mark","marks","scorch","burn","burns","footprints","tracks","overlay","overlays","shadow","shadows","glow","paper","papers","inlay","inlays","tile","tiles","floor","floors","grime","mud","dirt_patch","path","paths","crosswalk","oil","paint","moss","lilypad","flowers","flower","fog","mist","smoke"]);
// prefixo dos pacotes PeaPu (PP_Battle_Post-Apoc_Ext01b_): o tema nao e o tipo da arte
const PREF_PP=/^PP_[A-Za-z]+_(?:[A-Za-z0-9-]+_){0,4}?(?:Ext|Int|Univ|Universal|VG|Exterior|Interior|Cityscape|Basics)[0-9]*[a-z]?_/;
const FRACA=new Set(["glass","metal","wooden","consumable","consumables","attraction","exhibit","wall","walls","street","floor","floors","ceiling","broken","damaged","ruined","destroyed","fallen","burnt","burned"]);
const FORTE=new Set(["shadow","shadows","stain","stains","model","models","bone","bones","skull","skulls","skeleton","skeletons","corpse","corpses","stove","stoves","oven","ovens","statue","statues","cart","carts","altar","altars"]);
// o que um lugar costuma ter (para os kits: um quarto precisa de cama, mesa, cadeira, luz... mesmo que o nome nao diga "quarto")
export const TIPICOS={"Quarto":["Camas","Armários e estantes","Mesas","Cadeiras, bancos e sofás","Tapetes","Velas e candelabros","Lâmpadas e lanternas","Bandeiras, cortinas e tecidos","Espelhos"],
  "Taverna":["Mesas","Cadeiras, bancos e sofás","Balcões e bares","Barris","Louça e copos","Comida","Fogões, fornos e lareiras","Velas e candelabros","Tochas e braseiros"],
  "Cozinha":["Fogões, fornos e lareiras","Pias e bacias","Mesas","Armários e estantes","Louça e copos","Comida","Potes, vasos e urnas","Barris","Sacos e cestos"],
  "Banheiro":["Vasos sanitários","Banheiras e chuveiros","Pias e bacias","Higiene","Espelhos","Armários e estantes"],
  "Biblioteca e estudo":["Armários e estantes","Livros e papéis","Mesas","Cadeiras, bancos e sofás","Velas e candelabros","Tapetes","Enfeites"],
  "Escritório":["Mesas","Cadeiras, bancos e sofás","Armários e estantes","Livros e papéis","Máquinas e tecnologia","Lâmpadas e lanternas","Plantas em vaso"],
  "Loja e mercado":["Balcões e bares","Armários e estantes","Caixas e caixotes","Sacos e cestos","Barris","Potes, vasos e urnas","Quadros, placas e cartazes","Comida"],
  "Templo":["Estátuas","Velas e candelabros","Bandeiras, cortinas e tecidos","Tapetes","Colunas e vigas","Magia e alquimia","Cadeiras, bancos e sofás"],
  "Masmorra e prisão":["Prisão e tortura","Tochas e braseiros","Corpos e ossos","Entulho e lixo","Manchas e marcas","Baús"],
  "Oficina e forja":["Oficina e trabalho","Ferramentas","Mesas","Barris","Caixas e caixotes","Fogões, fornos e lareiras"],
  "Laboratório e alquimia":["Magia e alquimia","Medicina e laboratório","Potes, vasos e urnas","Mesas","Livros e papéis","Armários e estantes","Velas e candelabros"],
  "Hospital":["Medicina e laboratório","Camas","Armários e estantes","Cadeiras, bancos e sofás","Máquinas e tecnologia"],
  "Militar e combate":["Armas e armaduras","Caixas e caixotes","Barris","Cercas e grades","Construções e tendas","Bandeiras, cortinas e tecidos"],
  "Acampamento":["Construções e tendas","Tochas e braseiros","Sacos e cestos","Caixas e caixotes","Folhas, galhos e troncos","Cadeiras, bancos e sofás"],
  "Cripta e cemitério":["Caixões, túmulos e lápides","Estátuas","Velas e candelabros","Corpos e ossos","Árvores","Cercas e grades"],
  "Floresta e campo":["Árvores","Arbustos e plantas","Flores","Pedras e rochas","Folhas, galhos e troncos","Cogumelos e fungos","Água"],
  "Caverna e mina":["Pedras e rochas","Cogumelos e fungos","Água","Oficina e trabalho","Tochas e braseiros","Entulho e lixo"],
  "Rua e cidade":["Lâmpadas e lanternas","Quadros, placas e cartazes","Cercas e grades","Construções e tendas","Veículos","Entulho e lixo","Caixas e caixotes","Barris","Árvores"],
  "Fazenda":["Comida","Animais","Cercas e grades","Sacos e cestos","Barris","Ferramentas","Construções e tendas"],
  "Água, praia e porto":["Veículos","Água","Caixas e caixotes","Barris","Pontes, plataformas e pisos","Sacos e cestos"],
  "Deserto":["Pedras e rochas","Arbustos e plantas","Construções e tendas","Potes, vasos e urnas","Tapetes","Bandeiras, cortinas e tecidos"],
  "Neve e gelo":["Árvores","Pedras e rochas","Construções e tendas","Tochas e braseiros"],
  "Horror":["Corpos e ossos","Manchas e marcas","Velas e candelabros","Magia e alquimia","Prisão e tortura"],
  "Ficção científica":["Máquinas e tecnologia","Mesas","Cadeiras, bancos e sofás","Armários e estantes","Caixas e caixotes","Lâmpadas e lanternas","Canos e cabos","Portas, portões e janelas"],
  "Moderno":["Mesas","Cadeiras, bancos e sofás","Armários e estantes","Máquinas e tecnologia","Lâmpadas e lanternas","Plantas em vaso","Caixas e caixotes"]};
const memo=new Map();
const IDX=new Map();ARVORE.forEach((r,i)=>{for(const w of r[2])if(!IDX.has(w))IDX.set(w,i)});
const IDXA=new Map();AMB.forEach(([n,ws],i)=>{for(const w of ws){if(!IDXA.has(w))IDXA.set(w,[]);IDXA.get(w).push(i)}});
const IDXM=new Map();MAT.forEach(([n,ws],i)=>{for(const w of ws){if(!IDXM.has(w))IDXM.set(w,[]);IDXM.get(w).push(i)}});
// classifica um caminho (rel = textures/pasta/.../nome.ext). Devolve objeto compartilhado (nao altere)
export function classifica(rel,tags){const tg=(tags||[]).join(" ");const chave=rel.replace(/\.[a-z0-9]+$/i,"")+"|"+tg;let r=memo.get(chave);if(r)return r;
  const partes=rel.split("/"),pasta=partes[1]||"",nome=partes[partes.length-1].replace(/\.[a-z0-9]+$/i,""),pastas=partes.slice(2,-1).join(" ");
  const tN=pal(nome),tP=pal(pastas),tT=pal(tg),todos=new Set([...tN,...tP,...tT]),nomeS=new Set(tN);
  // juntas de duas palavras (pool_table, crystal_ball...)
  const lista=[...tN,...tP];for(let i=0;i<lista.length-1;i++)todos.add(lista[i]+"_"+lista[i+1]);
  let cat="Outros",sub="Outros";
  const tipo={objects:null,terrain:["Terreno","Terreno"],patterns:["Padrões e pisos","Padrões"],textures:["Padrões e pisos","Texturas"],materials:["Padrões e pisos","Materiais"],material:["Padrões e pisos","Materiais"],tilesets:["Padrões e pisos","Pisos em quadrados"],walls:["Paredes","Paredes"],paths:["Caminhos","Caminhos"],portals:["Portas e janelas","Portas e janelas"],lights:["Iluminação","Luzes (forma)"],caves:["Cavernas","Cavernas"],roofs:["Telhados","Telhados"]}[pasta];
  // objetos: primeiro o nome da arte (mais especifico), depois as pastas
  // a primeira palavra que casa vence (nos nomes a coisa vem antes do material e da cor: Table_Wood_Dark, Basin_Wall_Stone);
  // algumas palavras vencem em qualquer lugar (Cliff_Shadow e sombra, Animal_Bone e osso, Ship_Model e enfeite)
  const regra=(w,S)=>{const i=IDX.get(w);if(i==null)return -1;const nao=ARVORE[i][3];return nao&&nao.some(x=>S.has(x))?-1:i};
  const acha=t=>{if(!t.length)return null;const S=new Set(t);for(const w of t)if(FORTE.has(w)){const i=regra(w,S);if(i>=0)return [ARVORE[i][0],ARVORE[i][1]]}
    let fraca=null;for(let k=0;k<t.length;k++){for(const w of [t[k]+"_"+(t[k+1]||""),t[k]]){const i=regra(w,S);if(i>=0){if(FRACA.has(w)&&k<t.length-1){if(!fraca)fraca=i;continue}return [ARVORE[i][0],ARVORE[i][1]]}}}return fraca!=null?[ARVORE[fraca][0],ARVORE[fraca][1]]:null};
  // pastas: da mais funda (perto do nome) para a de fora
  const achaPastas=()=>{const ps=partes.slice(2,-1);for(let j=ps.length-1;j>=0;j--){const a=acha(pal(ps[j]));if(a)return a}return null};
  if(tipo&&pasta!=="objects")[cat,sub]=tipo;else{const a=acha(pal(nome.replace(PREF_PP,"")))||acha(tN)||achaPastas()||acha(tT);if(a)[cat,sub]=a}
  // texturas de chao: subtipo pelo material
  if(pasta!=="objects"&&/Terreno|Padrões/.test(cat)){const m=[["Grama",["grass","clover","lawn","moss","meadow"]],["Terra e lama",["dirt","mud","soil","earth","dust"]],["Areia",["sand","dune","beach"]],["Pedra e calçamento",["stone","cobble","cobblestone","rock","gravel","slate","marble","brick","bricks","flagstone","pavement","concrete","asphalt","sidewalk","tiles","tile"]],["Madeira",["wood","wooden","plank","planks","parquet","floorboard"]],["Neve e gelo",["snow","ice","frost"]],["Água",["water","sea","ocean","lava","swamp","river"]],["Folhas e mato",["leaves","forest","jungle","foliage"]],["Metal",["metal","steel","iron","grate","grating"]],["Carpete e tecido",["carpet","rug","fabric","cloth"]]];for(const [n,ws] of m)if(ws.some(w=>todos.has(w))){sub=n;break}}
  const ia=new Set(),im=new Set();for(const w of todos){const a=IDXA.get(w);if(a)for(const i of a)ia.add(i);const m=IDXM.get(w);if(m)for(const i of m)im.add(i)}
  // cano de arma nao e barril de taverna
  if(["gun","guns","cannon","cannons","rifle","weapon","weapons","tank","vehicle"].some(w=>todos.has(w))){const t=AMB.findIndex(x=>x[0]==="Taverna");ia.delete(t)}
  const amb=[...ia].sort((a,b)=>a-b).map(i=>AMB[i][0]),mat=[...im].sort((a,b)=>a-b).map(i=>MAT[i][0]);
  const cor=[...new Set(tN.map(w=>CORES[w]).filter(Boolean))];
  let enc="solto";if([...nomeS].some(w=>CANTO.has(w)))enc="canto";else if([...nomeS].some(w=>PAREDE.has(w))||/^(Muros|Portas)/.test(sub))enc="parede";else if([...nomeS].some(w=>MEIO.has(w)))enc="meio";else if(cat==="Móveis"&&/Armários|Balcões/.test(sub))enc="parede";
  if(/wall_?mounted|wallmounted|on_wall|wall_torch|wall_lamp/.test(tN.join("_"))||(nomeS.has("wall")&&cat!=="Arquitetura"))enc="parede";
  const pas=pasta!=="objects"?true:[...nomeS].some(w=>PASSA.has(w))||/Manchas|Sombras|Tapetes|Caminhos/.test(sub);
  r={cat,sub,amb,mat,cor,enc,pas};memo.set(chave,r);return r}
// texto curto para listas e para a IA
export const resumo=c=>c.cat+" › "+c.sub+(c.amb.length?" · "+c.amb.slice(0,3).join(", "):"")+(c.mat.length?" · "+c.mat.join(", "):"");
export const ENCOSTA={parede:"encosta na parede",canto:"vai no canto",meio:"fica no meio",solto:"solto"};
// estilo: palavras de material, cor e variante de madeira/pedra (para achar o mesmo conjunto)
const ESTILO=new Set(["wood","wooden","dark","light","red","walnut","ashen","oak","stone","marble","slate","sandstone","volcanic","redrock","earthy","metal","iron","brass","rusty","polished","gold","silver","black","white","gray","grey","blue","green","yellow","orange","purple","pink","brown","tan","olive","navy","teal","fancy","rustic","noble","commoner","royal","elven","dwarven","drow","stonewood","brickwood"]);
export function estilo(rel){const nome=rel.split("/").pop().replace(/\.[a-z0-9]+$/i,"");return pal(nome).filter(w=>ESTILO.has(w)).sort().join(" ")}
// quadrados ocupados: grade w x h (quadrados inteiros) a partir da mascara 8x8 da ficha do catalogo (hex de 16)
export function ocupa(mascHex,w,h){if(!mascHex||!(w>=1)||!(h>=1))return null;const W=Math.round(w),H=Math.round(h);if(W*H<2||W>12||H>12)return null;const m=BigInt("0x"+mascHex),bit=(x,y)=>Number((m>>BigInt(y*8+x))&1n);let s="";
  for(let j=0;j<H;j++)for(let i=0;i<W;i++){let c=0,t=0;for(let y=Math.floor(j*8/H);y<Math.max(Math.floor(j*8/H)+1,Math.floor((j+1)*8/H));y++)for(let x=Math.floor(i*8/W);x<Math.max(Math.floor(i*8/W)+1,Math.floor((i+1)*8/W));x++){t++;c+=bit(x,y)}s+=c*3>=t?"1":"0"}
  return s.includes("0")?s:null}
