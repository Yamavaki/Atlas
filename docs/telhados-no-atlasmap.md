# Telhados no .atlasmap (Atlas 1.31)

O Atlas **não lê os telhados do Dungeondraft**. Um telhado pode ser feito de dois jeitos:
- no próprio Atlas, com a ferramenta **Telhado (U)** do Modo Batalha;
- escrito direto no `.atlasmap`, como descrito aqui.

Cada andar tem uma lista `telhados`. O telhado costuma ficar num andar só dele, acima do último piso; ele também pode ficar no mesmo andar do cômodo.

## Unidades
- Coordenadas em **quadrados** do mapa, com (0,0) no canto de cima à esquerda; y cresce para baixo.
- 1 quadrado = 256 px no Dungeondraft.

## Textura
- O campo `t` é o **índice** de uma textura na lista `texturas` do mapa (no topo do arquivo).
- Pode ser uma textura do Atlas, como `atlas:m/telha`, ou uma arte de pacote pelo caminho `res://...` do Dungeondraft, por exemplo uma textura de telhado da Forgotten Adventures.
- `tq` (opcional): índice da arte de **cumeeira**, um caminho (`paths`) do pacote, que vai nas cumeeiras, espigões e rincões.

## Telhado de alas (o recomendado)
Alas são retângulos. Onde duas alas se sobrepõem, o Atlas desenha os rincões sozinho. Assim saem os telhados em L, T e U.

```json
{
  "p": [[10,10],[24,10],[24,26],[10,26]],
  "t": 3,
  "tq": 4,
  "estilo": "quatro",
  "beiral": 0.25,
  "alas": [
    {"x0":10,"y0":10,"x1":24,"y1":16,"tipo":"quatro"},
    {"x0":10,"y0":10,"x1":16,"y1":26,"tipo":"duas","eixo":"y"}
  ],
  "trapeiras": [
    {"x":20,"y":11.5,"lado":"N","w":1.2,"d":1.4}
  ]
}
```

- `alas[]`: `x0,y0,x1,y1` e `tipo`, que pode ser:
  - `quatro`: quatro águas;
  - `duas`: duas águas. `eixo` diz para onde corre a cumeeira: `"x"` deitada, `"y"` em pé;
  - `meia`: meia-água, um pano só. `lado` diz para onde ele **cai**: `N` (cima), `S` (baixo), `W` (esquerda), `L` (direita);
  - `plano`.
- **L e T:** a ala que sai da principal deve **entrar até o outro lado** da principal. No exemplo acima, a ala em pé começa em y0=10, que é o topo da ala deitada. Se as alas só encostarem, sai uma calha no encontro em vez do rincão.
- `p`: o contorno das alas. Basta o retângulo que cobre todas; o Atlas recalcula quando edita.
- `beiral`: quanto o telhado passa da parede, em quadrados (0 a 1,5). Use mais ou menos metade da espessura da parede mais 0,15, para cobrir a borda escura das paredes de baixo.
- `ang` e `piv` (opcionais): giro do telhado inteiro, em radianos, em volta do ponto `piv` [x,y]. As alas e as águas-furtadas são escritas **sem o giro**, no quadro do telhado. Para uma casa a 30°, escreva as alas retas em volta de `piv` e ponha `"ang": 0.5236`.
- `trapeiras[]`: águas-furtadas (janelinhas no telhado).
  - `x,y`: o centro, no quadro do telhado;
  - `lado`: para onde a janela está virada, que é o beiral do pano onde ela fica (`N`, `S`, `W`, `L`);
  - `w`: largura; `d`: comprimento (padrão 1,2 e 1,4).
  - Ponha a janela num pano inclinado, um pouco acima do beiral. Exemplo: no pano de cima (N) de uma ala de y0=10, use y entre 10,8 e 12.
- `furos[]` (opcional): polígonos convexos onde o telhado não entra, como uma torre que sobe através dele.

## Torre (cone)
```json
{"p": [[30,10],[32,10.6],[33.4,12],[34,14],[33.4,16],[32,17.4],[30,18],[28,17.4],[26.6,16],[26,14],[26.6,12],[28,10.6]],
 "t": 3, "estilo": "cone", "beiral": 0.2}
```
- `p` é o contorno da torre, com 12 a 32 pontos em volta do centro.
- O cone tem as telhas em anéis, luz em volta e uma ponta com enfeite.
- Se o pacote tiver arte pronta de telhado cônico, use `"arte": <índice da arte>`. A arte cobre a caixa da forma (`escArte` ajusta o tamanho).

## Outros estilos de forma
- Um telhado só com `p`, sem `alas`, aceita `estilo` igual a `quatro`, `duas`, `plano` ou `cone`.
- Um `p` em L com quatro águas é desenhado como alas sozinho. Mesmo assim, prefira escrever as `alas`.

## Camada
- Sem `l`, o telhado fica **por cima de tudo** do andar, e a luz de dentro dos cômodos não vaza nele.
- Com `"l": 700`, o telhado entra na ordem das camadas: objetos com camada maior, como chaminé, cata-vento ou bandeira, ficam por cima. Nesse modo a luz dos cômodos também ilumina o telhado.

## Outros campos
- `c`: tinta [r,g,b,1] de 0 a 1.
- `esc`: tamanho da textura (1 = normal).
- `parede`: id de uma parede fechada. O telhado acompanha a forma da parede (só no estilo de forma).
