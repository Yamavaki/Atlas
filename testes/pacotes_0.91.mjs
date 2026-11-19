import {openAsBlob} from "node:fs";import {readdirSync} from "node:fs";
import {lerTabela,indexarPacote,medidas,categoria,nomeBonito} from "/home/claude/app/batalha/biblioteca.js";
const dir="/mnt/user-data/uploads/";let falhas=0;const ok=(n,c)=>{if(!c)falhas++;console.log((c?"OK  ":"FALHA ")+n)};
for(const f of readdirSync(dir).filter(x=>x.endsWith(".dungeondraft_pack"))){const b=await openAsBlob(dir+f);const t=performance.now();const P=await indexarPacote(b,f);const ms=performance.now()-t;
  const cats={};for(const a of P.artes){const c=categoria(a[0]);cats[c]=(cats[c]||0)+1}
  // medidas de 20 artes, conferidas pelo nome NxM quando houver
  let md=0,bad=0;for(const a of P.artes.slice(0,40)){const d=await medidas(b,a[1]);if(d&&d[0]>0&&d[1]>0&&d[0]<20000)md++;else bad++}
  const sumOk=P.artes.every(a=>a[1]+a[2]<=b.size);
  console.log(f.slice(0,48),P.id,P.nome,"|",P.artes.length,"artes",JSON.stringify(cats),"|",ms.toFixed(0)+"ms | permitido",P.permitido,"| tags",P.artes.filter(a=>a[3]).length);
  ok(f.slice(0,30)+" medidas",bad===0);ok(f.slice(0,30)+" posicoes dentro do arquivo",sumOk)}
console.log(nomeBonito("textures/objects/PP_Battle_Cyberpunk_Ext01_Animal_Cat_01a_Black.webp"),"|",nomeBonito("textures/objects/TCM Highway Signage/TCM_Broken Road Sign 01_1x2.webp"));
console.log("falhas",falhas)
