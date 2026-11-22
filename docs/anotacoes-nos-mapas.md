# Anotações do mestre nos mapas (Atlas 1.35)

Todo mapa do Atlas (região, cidade e batalha) pode ter anotações do mestre: traços à mão, linhas, áreas, pontos com ícone e textos. Elas ficam **dentro do arquivo do mapa**. Não saem no PNG exportado nem na tela dos jogadores.

Este documento explica o formato para que uma IA (por exemplo o Claude) consiga **ler** as anotações e entender o que o mestre marcou. Também explica como **escrever** anotações novas.

## Onde ficam

| Mapa | Campo | Unidade das coordenadas |
|---|---|---|
| Região (`type` vazio ou `region`) | `anot` no objeto do mapa | coordenadas do mundo da região (as mesmas de povoados, pinos e estradas: `x` de 0 a MW, `y` sem a inclinação do desenho) |
| Cidade (`type: "city"`) | `anot` no objeto do mapa | coordenadas do mundo da cidade (as mesmas dos lugares em `places`) |
| Batalha (`.atlasmap`) | `andares[i].anot`, uma lista por andar | quadrados (0,0 é o canto de cima à esquerda) |

Outros campos:

- `anotUn: "mundo"` marca que os pontos estão em coordenadas do mundo (desde a 1.35.1). Assim a anotação fica presa ao terreno quando o relevo muda.
- `anotRef: [largura, altura]` guarda o tamanho do mundo quando as anotações foram feitas. Se o tamanho do mapa mudar, o Atlas escala os pontos.

- `anotOculto: true` esconde as anotações fora da ferramenta.
- `anotCols` é o número de colunas da grade A1. Só existe em região e cidade; o padrão é 16 na região e 12 na cidade.

## Item

```json
{
  "id": "an1x2y3",
  "tipo": "ponto",
  "pts": [[613, 666]],
  "cor": "#e0776b",
  "icone": "tesouro",
  "titulo": "Item escondido",
  "texto": "A chave está atrás do altar. CD 15 para achar.",
  "nota": "[[Chave do Templo]]",
  "celula": "G7",
  "perto": "Kamenitz"
}
```

| Campo | O que é |
|---|---|
| `tipo` | `ponto` (ícone), `texto` (escrita solta), `traco` (pincel à mão), `linha` (ponto a ponto) ou `area` (contorno fechado) |
| `pts` | lista de pontos `[x, y]`; ponto e texto usam só o primeiro |
| `cor` | cor em hex |
| `larg` | largura da linha (traço, linha, área) |
| `estilo` | `solido`, `tracejado` ou `pontilhado` |
| `preench` | opacidade do preenchimento da área (0 a 0,7) |
| `seta` | `true` para pôr uma seta na ponta da linha |
| `suave` | `true` para curvar os cantos (pincel) |
| `icone` | nome do ícone do ponto (lista abaixo) |
| `tam` | tamanho do ícone (0,6 a 2,4) ou do texto (10 a 48) |
| `titulo` | nome curto, que aparece no mapa |
| `texto` | anotação livre do mestre: o que acontece ali |
| `nota` | link para uma nota do mundo, no formato `[[Título]]` |
| `celula` | célula da grade de referência (A1, B2…), calculada pelo Atlas ao salvar |
| `perto` | lugar com nome mais perto (povoado, pino, texto do mapa), calculado pelo Atlas |
| `oculto` | `true` esconde só esta anotação |
| `mostraNome` | `false` esconde o nome no mapa |

Ícones disponíveis:

| Ícone | Significado |
|---|---|
| `alfinete` | marca genérica |
| `tesouro` | tesouro |
| `perigo` | perigo |
| `encontro` | encontro |
| `caveira` | morte |
| `segredo` | segredo |
| `chave` | chave |
| `porta` | passagem |
| `armadilha` | armadilha |
| `misterio` | mistério |
| `estrela` | destaque |
| `bandeira` | missão |
| `acampamento` | acampamento |
| `pessoa` | pessoa |
| `monstro` | monstro |
| `pegadas` | rastro |
| `nota` | nota |
| `cidade` | lugar |
| `agua` | água |
| `fogo` | fogo |

## Como ler (para a IA)

- **Área tracejada com `texto`:** costuma ser uma zona de regra, como "quem entrar aqui tem encontro aleatório 1 em 6 por hora". O `titulo` resume e o `texto` dá a regra.
- **Ponto com `icone`:** algo naquele lugar. Por exemplo `tesouro`, um item escondido; `armadilha`, uma armadilha. Use `celula` e `perto` para descrever onde fica ("na célula G7, perto de Kamenitz").
- **Linha com `seta`:** um caminho, uma rota de patrulha ou uma direção de fuga.
- **Campo `nota`:** aponta para a nota do mundo com os detalhes. Leia a nota para saber mais.
- **Traço à mão sem texto:** rabisco do mestre. Trate como destaque visual sem regra.

## Como escrever (para a IA)

Acrescente itens à lista `anot` com `id` único, `tipo` e `pts` na unidade certa (coordenadas do mundo na região e na cidade, quadrados na batalha). Na região e na cidade, ponha também `anotUn: "mundo"` no mapa. `celula` e `perto` podem faltar: o Atlas recalcula os dois quando o mestre mexe na anotação.

## No app

- **Região e cidade:** botão "Anotações do mestre" na paleta de ferramentas (grupo Marcar na região).
- **Batalha:** ferramenta com o lápis, ou a tecla **N**.

Modos: Selecionar, Pincel, Linha, Área, Área à mão, Ponto e Texto.

- Duplo clique numa anotação ligada a uma nota abre a nota.
- Pôr uma nota no mapa: no painel da ferramenta, busque a nota, clique nela e clique no mapa, ou arraste a nota para o mapa. Funciona nos três mapas. Na região e na cidade, a lista lateral de notas também pode ser arrastada.
- "Criar nota desta anotação" cria uma nota de local com o texto da anotação.
- Ctrl+Z desfaz.
