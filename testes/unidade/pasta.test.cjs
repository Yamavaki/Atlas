// Atlas - testes da pasta do mundo (disco em memoria): gravar, renomear, apagar para a lixeira, ler notas feitas fora.
const test=require("node:test"),assert=require("node:assert");
global.window={};global.localStorage={getItem(){return null},setItem(){},removeItem(){}};
require("../../app/nucleo/pasta.js");const P=window.AtlasPasta;
const F=new Map(),mem={nome:"Teste",tipo:"mem",async ler(r){return F.has(r)?{texto:F.get(r),quando:1}:null},async lerBin(r){return F.has(r)?new Blob([F.get(r)]):null},async gravar(r,d){F.set(r,typeof d==="string"?d:String(d))},async apagar(r){F.delete(r)},async listar(){return [...F.keys()].filter(k=>!k.startsWith(".atlas")).map(rel=>({rel,quando:1}))},async permissao(){return true}};
const espera=async()=>{await new Promise(r=>setTimeout(r,500));await P.espera()};
test("le nota criada fora (Obsidian)",async()=>{P._disco(mem);F.set("Personagens/Alda.md","# Alda");const r=await P.carregar();assert.equal(r.notas.length,1);assert.equal(r.notas[0].title,"Alda");assert.equal(r.notas[0].folder,"Personagens")});
test("grava, renomeia e apaga",async()=>{const o={id:"n1",title:"Missão 1",folder:"Missões",content:"Oi"};await P.gravaNota(o);await espera();assert.ok(F.has("Missões/Missão 1.md"));
  o.title="Missão Um";await P.gravaNota(o);await espera();assert.ok(F.has("Missões/Missão Um.md"));assert.ok(!F.has("Missões/Missão 1.md"));
  await P.apagaNota(o);await espera();assert.ok(!F.has("Missões/Missão Um.md"));assert.ok([...F.keys()].some(k=>k.startsWith(".atlas/lixeira/")))});
test("quadro e mapa",async()=>{await P.gravaNota({id:"n2",title:"Q",folder:"Quadros",kind:"canvas",canvas:{nodes:[{id:"a"}],edges:[]}});await P.gravaMapa({id:"m1",name:"Região",type:"region"});await espera();
  const r=await P.carregar();assert.ok(r.notas.some(n=>n.kind==="canvas"&&n.canvas.nodes.length===1));assert.equal(r.mapas[0].name,"Região")});
