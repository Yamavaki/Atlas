# Formato do mundo do Atlas

Guia para quem escreve no mundo do Atlas por fora: outra IA, o Obsidian, um script.
O Atlas guarda tudo em arquivos comuns numa pasta. Quem segue este guia escreve notas que o Atlas entende inteiras: a ficha, o quadro da campanha, a árvore de missões e o mapa.

Versão do Atlas: 1.23. Código: <https://github.com/Yamavaki/Atlas>

## 1. A pasta do mundo

```
<pasta do mundo>/
  Campanhas/      notas tipo: campanha
  Missões/        notas tipo: missao
  Personagens/    notas tipo: personagem (NPCs e personagens dos jogadores)
  Criaturas/      notas tipo: criatura (monstros e inimigos)
  Locais/         notas tipo: local
  Facções/        notas tipo: faccao
  Itens/          notas tipo: item
  Sessões/        notas tipo: sessao
  Quadros/        quadros .canvas (JSON Canvas do Obsidian)
  Mapas/          mapas gerados (.atlasmapa.json) e Mapas/Batalha/ — NÃO MEXER
  Imagens/        imagens dos quadros (.webp) — NÃO MEXER
  Assets/         pacotes de arte do Modo Batalha — NÃO MEXER
  Backups/        cópias do mundo — NÃO MEXER
  .atlas/         índice interno e lixeira — NÃO MEXER
```

- As pastas são só organização. O Atlas lê todo `.md` e `.canvas` de qualquer subpasta. O que decide o tipo é a propriedade `tipo`, não a pasta.
- Nome do arquivo = título da nota: `A sombra sobre Sasau.md`. Os títulos têm de ser únicos no mundo inteiro, porque os links são pelo título.
- Texto em UTF-8 e fim de linha LF.
- Uma nota criada fora do Atlas entra no índice sozinha na próxima leitura. O Atlas percebe mudanças na pasta em poucos segundos.

## 2. Cabeçalho (propriedades)

```
---
tipo: missao
status: aberta
peso: principal
campanha: "[[A sombra sobre Sasau]]"
envolvidos: "[[Abade Tomas]], [[Irmã Ludmila]]"
---
```

- O cabeçalho fica entre linhas `---`, no topo do arquivo.
- Uma propriedade por linha, sempre `chave: valor` numa linha só.
- **Não** usar listas YAML em várias linhas (`- item` embaixo da chave). O Atlas ainda não lê esse formato.
- **Links:** `[[Título]]`. Vários links ficam na mesma linha, separados por vírgula. Também vale o nome sem colchetes: `local: Olshany`.
- **Valores de escolha:** sempre minúsculos e sem acento (`concluida`, `secundaria`, `medio`).
- **Propriedades vazias:** pode omitir a linha.

## 3. Tipos e propriedades

| tipo | propriedades |
|---|---|
| `campanha` | `estado`: planejada · andamento · pausada · concluida — `principal`: sim (só a campanha atual) — `jogadores` — `inicio` — `regiao` (links: onde se passa) — `envolvidos` (links: facções e personagens da campanha) |
| `missao` | `status`: oculta · aberta · andamento · concluida · falhou · abandonada — `peso`: principal · secundaria — `campanha` (link) — `arco` (texto, ex.: Ato I) — `prioridade`: alta · media · baixa — `contratante` (link: quem dá) — `local` (links: onde acontece) — `envolvidos` (links) — `criaturas` (links) — `itens` (links) — `recompensa` (texto) — `requer` (links: missões que vêm antes) — `libera` (links: missões que esta abre) — `falha` (links: missões que acontecem se esta falhar) — `sessoes` (links) — `data` |
| `personagem` | `quem`: jogador (vazio = NPC) — `lado`: aliado · neutro · inimigo — `raca` — `papel` — `faccao` (link) — `local` (link: onde vive) — `situacao`: vivo · morto · desaparecido · desconhecido — `data` |
| `criatura` | `perigo`: baixo · medio · alto · mortal — `faccao` (link) — `habitat` (links: onde aparece) — `data` |
| `local` | `categoria`: regiao · cidade · vila · masmorra · ponto · outro — `mapa` — `populacao` — `governante` (link) — `cultura` — `regiao` (link: fica em) — `data` |
| `faccao` | `lider` (link) — `sede` (link) — `aliados` (links) — `inimigos` (links) — `data` |
| `item` | `dono` (link) — `onde` (link) — `data` |
| `sessao` | `data` — `jogadores` — `lugares` (links) |
| `livre` | `data` |

## 4. Corpo das notas (modelos do Atlas)

Missão:
```
## Objetivo

O gancho em 1 a 3 frases.

## Objetivos

- [ ] Primeiro passo
- [ ] Segundo passo

## Complicações


## Recompensas


## Consequências

- Se der certo: 
- Se der errado: 

> [!segredo] O que realmente está acontecendo
> 
```

Campanha: `## Resumo`, `## Arcos` (lista numerada), `## Ganchos para os jogadores`, `> [!segredo] O que só o mestre sabe`.
Personagem: `## Aparência`, `## O que quer`, `## O que esconde`, `## Ligações`.
Criatura: `## Aparência`, `## Comportamento`, `## Ataques e habilidades`, `## Pontos fracos`, `## O que deixa para trás`.
Local: `## Descrição`, `## Quem vive aqui`, `## Ganchos`, `> [!segredo] Só para o mestre`.
Facção: `## Objetivo`, `## Membros`, `## Recursos`, `## Inimigos e aliados`.
Item: `## Descrição`, `## Efeito`, `## História`.
Sessão: `## Onde paramos`, `## Cenas previstas`, `## NPCs em jogo`, `## Anotações`.

- As caixinhas `- [ ]` e `- [x]` em qualquer lugar da missão contam como objetivos. Elas aparecem no cartão do quadro e na barra de progresso.
- **Segredo do mestre:** use o bloco `> [!segredo] ...` ou `%%texto%%` no meio da frase. Os dois somem na visão dos jogadores.
- **Ligações livres:** no fim, em `## Ligações`, uma por linha: `- [[Destino]] — o que liga`.
- **Links no texto:** `[[Título]]` ou `[[Título|texto mostrado]]`.

## 5. Como o quadro da campanha é montado

O quadro (aba Teia em Missões) se monta e se atualiza sozinho a partir das propriedades. Não é preciso escrever o `.canvas` da campanha.

| propriedade | linha no quadro |
|---|---|
| missão `campanha` | campanha → missão (dourada grossa se principal, laranja se paralela), quando a missão não tem missão anterior |
| `libera` / `requer` | missão → missão: "abre" (cheia) ou "precisa de" (vermelha tracejada) |
| `falha` | missão → missão "se falhar" (vermelha) |
| `local`, campanha `regiao` | → lugar (azul) |
| `contratante`, `envolvidos` | → personagem (vermelha pontilhada) ou facção (violeta pontilhada) |
| `itens` | → item (verde) |
| `criaturas` | → criatura (laranja pontilhada) |
| personagem/criatura `faccao` | → facção "faz parte de" |
| `arco` | missões do mesmo arco ficam numa moldura com o nome do arco |

A Árvore (outra aba de Missões) segue `requer`, `libera` e `falha`, a partir da campanha.

## 6. Missões principais e paralelas

- A campanha é uma nota `tipo: campanha`, e cada missão aponta para ela em `campanha`.
- **Principal** (`peso: principal`): é a espinha da história. Encadeie as principais com `libera` (ou `requer`) para formar a sequência.
- **Paralela** (`peso: secundaria`): é opcional. Pode `requer` uma principal, para só abrir depois dela, ou `libera` algo.
- **Consequência:** é outra missão, ligada no campo `falha` da missão que pode dar errado.
- **Arcos:** agrupe as missões com `arco` (Ato I, Ato II…).
- **Missão secreta:** use `status: oculta` para missões que os jogadores ainda não conhecem. Ela some na visão dos jogadores.
- Todo nome usado em `[[ ]]` deve existir ou ser criado junto. Um link para nota que não existe aparece como "ainda não existe · criar".

## 7. Quadros `.canvas`

- Os quadros seguem o JSON Canvas 1.0, o formato do Obsidian.
- O que o Obsidian não conhece fica no campo `atlas` de cada nó ou linha. Exemplos: `kind` (adesivo, imagem, mapa), `auto` (tipo da ligação), `estilo`, `grossa`, `segredo`.
- O quadro de uma campanha tem a chave `campanha` no índice e se refaz pelas propriedades. Prefira mudar as notas e não o `.canvas` dele.

## 8. Onde está no código

- `app/app.js`: tipos (`TYPES`), modelos (`TPL`), campos da ficha (`FIELDS`), cores e ícones (`TCOL`, `TICO`), pastas (`FOLD`), tipos de ligação (`LIGS`, `ligarTipo`), montagem do quadro (`sincronizaCampanha`) e árvore (`arvoreMissoes`).
- `app/nucleo/pasta.js`: leitura e gravação da pasta e o índice `.atlas/indice.json`.
- `app/quadro/quadro.js`: o quadro (canvas).
