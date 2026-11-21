// 1.00: motor de zonas sem navegador. Catalogo de mentira (so tamanhos), varias formas e tipos:
// nada fora da forma, nada em cima de outra peca, porta sempre alcancavel, mesmo resultado com a mesma semente.
import * as Z from "../app/batalha/zonas.js";
let ok=0,falhas=[];const chk=(n,c)=>{if(c)ok++;else{falhas.push(n);console.log("FALHA",n)}};
const A=(k,w,h,ex)=>Object.assign({k,w,h,fr:"S",vis:[.02,.02,.98,.98],cam:200},ex);
const CAT={cama:[A("cama",1,2)],criado:[A("criado",1,1)],guardaRoupa:[A("gr",2,1)],estante:[A("est",2,1)],armario:[A("arm",2,1)],bau:[A("bau",1,.8)],mesa:[A("mesa",3,2),A("mesa2",2,2)],mesinha:[A("mesinha",1.5,1)],escrivaninha:[A("esc",2,1)],bancada:[A("banc",2,1)],
  cadeira:[A("cad",.8,.8)],banqueta:[A("banq",.7,.7,{redondo:true})],bancoLongo:[A("pew",2,.8)],sofa:[A("sofa",2,1)],poltrona:[A("polt",1,1)],balcao:[A("balc",4,1),A("balc2",2,1)],barril:[A("barril",1,1,{redondo:true})],caixote:[A("cx",1,1)],saco:[A("saco",.8,.8)],pote:[A("pote",.6,.6)],
  fogao:[A("fog",2,1.5)],lareira:[A("lar",2,1.2)],pia:[A("pia",1,1)],vaso:[A("vaso",.8,1)],banheira:[A("banh",2,1)],tapete:[A("tap",3,2,{cam:100,fr:"sim"})],planta:[A("pl",.8,.8)],estatua:[A("estat",1.2,1.2)],altar:[A("altar",2,1)],armas:[A("armas",2,.6)],manequim:[A("man",1,1)],
  bigorna:[A("big",.8,.6)],forja:[A("forja",2.5,2)],ferramentas:[A("ferr",1,1)],velaChao:[A("vc",.5,.5)],tocha:[A("tocha",.4,.4)],lampada:[A("lamp",.5,.5)],louca:[A("louca",.3,.3)],comida:[A("comida",.35,.35)],livros:[A("livro",.4,.3)],velaMesa:[A("vela",.2,.2)]};
const circ=(cx,cy,r,n)=>Array.from({length:n},(_,i)=>[cx+Math.cos(i/n*6.283)*r,cy+Math.sin(i/n*6.283)*r]);
const FORMAS={ret:[[0,0],[10,0],[10,7],[0,7]],antihor:[[0,0],[0,7],[10,7],[10,0]],circ:circ(6,6,6,32),L:[[0,0],[12,0],[12,5],[6,5],[6,11],[0,11]],livre:[[0,2],[4,0],[10,1],[13,5],[9,10],[3,9]],peq:[[0,0],[3.5,0],[3.5,3],[0,3]],estreito:[[0,0],[12,0],[12,1.6],[0,1.6]]};
const dentro=(P,x,y)=>{let d=false;for(let a=0,b=P.length-1;a<P.length;b=a++){const u=P[a],v=P[b];if((u[1]>y)!==(v[1]>y)&&x<(v[0]-u[0])*(y-u[1])/(v[1]-u[1])+u[0])d=!d}return d};
const cx=o=>{const a=CAT[o.papel].find(x=>x.k===o.k);return Z.caixaDe(o.x,o.y,o.w*.96,o.h*.96,o.r,a.redondo)},cantos=o=>cx(o).c;
let total=0;
for(const tipo of Object.keys(Z.COMODOS))for(const [fm,P] of Object.entries(FORMAS))for(const sem of [1,7,42]){const portas=[[(P[0][0]+P[1][0])/2,(P[0][1]+P[1][1])/2]],z={p:P,tipo,par:{dens:.8,bag:.7},semente:sem},amb={portas,mg:.12},r=Z.geraComodo(z,CAT,amb),r2=Z.geraComodo(z,CAT,amb),id=tipo+"/"+fm+"/"+sem;total+=r.objs.length;
    chk(id+" repete igual",JSON.stringify(r.objs)===JSON.stringify(r2.objs));
    chk(id+" dentro da forma",r.objs.every(o=>cantos(o).every(q=>dentro(P,q[0],q[1]))));
    // pecas que bloqueiam nao se sobrepoem (tapete, coisas em cima e cadeiras encaixadas na propria mesa ficam de fora)
    const B=r.objs.filter(o=>!Z.PAPEIS[o.papel].passa&&!Z.PAPEIS[o.papel].em&&o.papel!=="cadeira"&&o.papel!=="banqueta");let bate=0;for(let i=0;i<B.length;i++)for(let j=i+1;j<B.length;j++){const a=B[i],b=B[j];if(a.papel===b.papel&&(Z.PAPEIS[a.papel].tol>.04||a.l!==b.l))continue;if(Z.bate(cx(a),cx(b),.05)){bate++;if(process.env.DBG)console.log(id,a.papel,b.papel)}}chk(id+" sem sobreposicao ("+bate+")",bate===0);
    // a frente da porta fica livre
    chk(id+" porta livre",B.every(o=>Math.hypot(o.x-portas[0][0],o.y-portas[0][1])>.75));
    // o que vai em cima fica em cima de um movel
    const M=r.objs.filter(o=>!Z.PAPEIS[o.papel].em);chk(id+" enfeites em cima de moveis",r.objs.filter(o=>Z.PAPEIS[o.papel].em).every(e=>M.some(m=>Math.hypot(m.x-e.x,m.y-e.y)<Math.max(m.w,m.h)/2+.1)))}
// sementes diferentes dao arranjos diferentes; obstaculo e respeitado; forma invalida nao quebra
const base={p:FORMAS.ret,tipo:"taverna",par:{}};chk("sementes diferentes",JSON.stringify(Z.geraComodo({...base,semente:1},CAT,{}).objs)!==JSON.stringify(Z.geraComodo({...base,semente:2},CAT,{}).objs));
const ob={x:5,y:3.5,w:3,h:3,r:0},ro=Z.geraComodo({...base,semente:3},CAT,{obst:[ob]});chk("obstaculo respeitado",ro.objs.filter(o=>!Z.PAPEIS[o.papel].passa&&!Z.PAPEIS[o.papel].em).every(o=>Math.abs(o.x-5)>1.4||Math.abs(o.y-3.5)>1.4));
chk("forma invalida",Z.geraComodo({p:[[0,0],[1,1]],tipo:"quarto",semente:1},CAT,{}).objs.length===0);chk("zona gigante avisa",Z.geraComodo({p:[[0,0],[80,0],[80,80],[0,80]],tipo:"quarto",semente:1},CAT,{}).avisos.length===1);
chk("sem catalogo nao quebra",Z.geraComodo({p:FORMAS.ret,tipo:"quarto",semente:1},{},{}).objs.length===0);
// escolha de artes: papel certo pelo nome, sem pecas quebradas nem tematicas
const it=(nome,sub,pac)=>({k:nome,nome,pacote:pac||"p",estilo:"",sub});
chk("serve cama",Z.serve("cama",it("Single_Bed_Wood_Dark_A_1x2","Camas"))&&!Z.serve("cama",it("Single_Bed_Dark_A_1x2","Camas"))&&!Z.serve("cama",it("Bed_Frame_Wood_A","Camas"))&&!Z.serve("cama",it("Single_Bed_Broken_A","Camas"))&&Z.serve("cama",it("Single_Bed_Broken_A","Camas"),2)&&!Z.serve("cama",it("Ceremorph_Bed_A","Camas")));
chk("serve mesa e cadeira",Z.serve("mesa",it("Table_Round_Wood_A","Mesas"))&&!Z.serve("mesa",it("Desk_Wood_A","Mesas"))&&Z.serve("cadeira",it("PP_Int01_Furniture_Chair_01a","Cadeiras, bancos e sofás"))&&!Z.serve("cadeira",it("Armchair_A","Cadeiras, bancos e sofás")));
const F={lista:s=>({"Camas":[it("Single_Bed_Dark_A","Camas","A"),it("Bed_B","Camas","B")],"Armários e estantes":[it("Wardrobe_Wood_Dark_A","Armários e estantes","A")],"Baús":[it("Chest_A","Baús","A")]})[s]||[]},e=Z.escolheArtes("quarto",F,{},5);
chk("escolhe o pacote que cobre mais",e.pacote==="A"&&e.papeis.cama[0]==="Single_Bed_Dark_A"&&e.faltam.includes("tapete"));
console.log(ok,"ok",falhas.length,"falhas ·",total,"pecas geradas");if(falhas.length)process.exit(1);
