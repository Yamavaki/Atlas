# Regras para gerar mapas de batalha

Checklist para quem monta mapas de batalha à mão ou por IA, no Dungeondraft ou no Atlas, quando o mapa não sai do gerador de zonas. Junta as correções feitas pelo autor até a versão 1.00.3. Leia antes de gerar.

## Fonte das artes
- Use o **catálogo v3**. No Atlas: Modo Batalha › Minhas artes › Catálogo para IA. Tamanho, parte desenhada (`vis`) e frente (`fr`) foram medidos na arte original. O v1 e o v2 mediam na miniatura recortada e erravam a caixa e a frente: não use.
- Prefira os pacotes da Forgotten Adventures. Nunca use as artes embutidas do Dungeondraft, porque o Atlas não as tem.
- Use sempre o nome exato que está no catálogo. Não invente nome.

## Variedade com equilíbrio
1. **Encaixe primeiro.** A arte tem de combinar com o tema, o estilo, a riqueza, o tamanho real e o pacote dos vizinhos. Uma arte boa já usada continua valendo.
2. **Variedade de leve.** Entre artes que encaixam igual, prefira a menos usada nos últimos mapas. Guarde uma lista das artes marcantes usadas em cada mapa. Uma diferença de encaixe sempre ganha da variedade.
3. Só o passado recente conta, os últimos cinco mapas mais ou menos.
4. **Peça marcante não repete no mesmo mapa** se houver outra que encaixe: lareira, balcão, altar, estátua, cama de casal. Peça comum pode repetir: caneca, barril, cadeira, vela.
5. Dentro de um cômodo, varie louça, comida, livros, potes e caixotes, usando várias artes diferentes.

## Riqueza manda mais que o estilo
- **Pobre:** nada "fancy", "ornate" ou "gold". Cama bagunçada, balde, sacos, cesto, caixote fazendo de mesa. Piso de tábua sem buracos.
- **Rico ou nobre:** nada "plain" ou "worn". Cama arrumada e maior, poltrona, mesinha, castiçal, planta, sem lotar de enfeites.

## Orientação (Forgotten Adventures)
- Quase tudo tem as costas no topo (`fr S`). Vale sempre o `fr` da linha do catálogo.
- Arandela e tocha de parede: `fr W`, com o suporte encostado na parede.
- Lareira em pé: `fr L`, com a cornija encostada na parede e a boca para o cômodo.
- Balcão: `fr S`, com a barra de apoio virada para o cliente. Banquetas do lado do cliente e corredor livre entre o balcão e a parede.

## Peças de conjunto
- `conj X` no catálogo indica peça com a ponta apagada para emendar. Monte duas peças da mesma família, a segunda espelhada (`m:1`), com as pontas apagadas sobrepostas em uns 0,9 quadrado. Nunca deixe uma sozinha com a ponta solta.
- Balcão da Forgotten Adventures: use A1 e A2, que são os retos. A3 e A4 são cantos.

## Paredes, bloqueio de luz e sombras
- Paredes da Forgotten Adventures de dois lados (StoneWood, BrickWood, PlasterWood…): a madeira, que é a metade de baixo da arte, fica para dentro do cômodo.
- Paredes, piso e porta devem ser do mesmo autor dos móveis. Nada de piso sci-fi ou cyberpunk em mapa medieval, e nada de paredes "Broken" ou "Ruin" num cômodo inteiro.
- Paredes bloqueiam luz. Deixe a sombra suave ligada em paredes e caminhos.
- **Penhasco de caverna, paliçada, barranco e encosta:** faça como caminho com "bloqueia luz" (`block_light`). Desde a versão 1.24, o Atlas transforma esse caminho em parede ao exportar para o Foundry. Ela bloqueia passagem, visão e luz, mas deixa o som passar.

## Telhados
- O Atlas não lê os telhados do Dungeondraft. Para o telhado ir junto, escreva-o no `.atlasmap` (veja `docs/telhados-no-atlasmap.md`) ou faça no Atlas com a ferramenta Telhado (U).
- Casa retangular: uma ala de quatro águas. Casa em L ou T: uma ala por braço, e a que sai entra até o outro lado da principal.
- Beiral: metade da espessura da parede mais 0,15 quadrado, para não aparecer a borda das paredes.
- Torre redonda: estilo `cone`, ou a arte pronta de cone do pacote.
- Águas-furtadas: em casas de dois andares ou mais, de 1 a 3 por pano comprido, viradas para a rua ou para o pátio, nunca em telhado plano.
- Chaminé, cata-vento e bandeira: objetos no andar do telhado. Ponha o telhado com `"l": 700` e as peças com camada maior, para ficarem por cima.

## Arrumação
- Cadeiras numa camada abaixo da mesa, um pouco enfiadas embaixo dela. De 2 a 4 por mesa, e não todas iguais.
- Mesas em fileira ou em grade. O meio do salão não fica vazio, mas tem espaço para andar.
- Criado-mudo ao lado da cabeceira, baú ao pé da cama, tapete debaixo da cama ou na frente da lareira.
- Sala: sofá, poltronas e mesinha virados para a lareira.
- Capela: altar no centro do fundo, bancos em fileiras com corredor e imagens sacras (anjo, santo, monge). Nada de demônio, leão ou dragão.
- Depósito e cozinha: "organizar a desorganização". Barris em fileira, caixotes empilhados nos cantos, sacos e jarros amontoados.
- Vela de mesa pequena, até 1/3 de quadrado. Estátua comum até 1,7 quadrado e fora de quarto.
- Peça comum não maior que 1/3 do lado do cômodo.
- Nada de berço, cesto de bebê, colchão nu, colcha solta ou peça de tortura fora de contexto.

## Conferir
- Em mapa grande, ou quando o autor pedir, abra o mapa, tire um print e corrija antes de entregar.
- Depois de entregar, anote as artes marcantes usadas, para a regra de variedade.
