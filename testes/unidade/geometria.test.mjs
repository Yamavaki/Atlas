// Atlas - planta do castelo: volumes juntos, comodos dentro do contorno
import test from "node:test";import assert from "node:assert";
import {planta} from "../../app/batalha/geradores/castelo_planta.js";
test("planta do castelo",()=>{const P=planta();assert.ok(P.fora.length>8);assert.ok(P.comodos.length>=15);assert.ok(P.portas.length>10);assert.ok(P.telhado.alas.length>=3)});
