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
- Uma propriedade por linha (`chave: valor`). Desde a 1.28 o Atlas também lê listas YAML (`- item` embaixo da chave, ou `[a, b]` na mesma linha) e arquivos com quebra de linha do Windows.
- **Outros nomes:** `aliases: Lisel, a Viúva` (ou lista YAML). Um link `[[Lisel]]` abre a nota e mostra o texto do apelido. Se um apelido for igual ao título de outra nota, o título ganha e a nota mostra um aviso.
- **Grupos:** `grupo: Conselho, Suspeitos` em qualquer tipo. As #tags do texto também contam como grupo. A barra lateral pode agrupar por pasta, tipo, grupo, local, facção ou campanha.
- **Retrato:** `imagem: retrato-lisel.png` (só o nome do arquivo; o Atlas procura em `Imagens/` primeiro e depois em qualquer subpasta).
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
| `relogio` | `segmentos` (4, 6, 8…) — `cheios` (quantos já encheram) — `dono` (link: de quem é o relógio) — `estado`: ativo · cheio · parado — `campanha` (link). A pizza é clicável e aparece pequena na nota do dono e no quadro |
| `pista` | `revela` (link: o segredo) — `nivel` (1, 2, 3: ordem da escada) — `status`: oculta · entregue · perdida — `onde` (link: lugar ou pessoa) — `sessao` (link) — `quem` (quem achou) |
| `escrito` | `formato`: nota · carta · livro · pergaminho · diario · cartaz… — `era`: classico · moderno — `papel` — `letra` — `entregue` (link: a quem foi entregue). Páginas separadas por `---` no corpo; `%%texto%%` vira segredo no JSON exportado para o Nauren |
| `livre` | `data` |

**Campos do Nauren RPG** (opcionais, aparecem num bloco compacto): em `personagem` — `nivel`, `cores`, `classe`, `vida`, `sincronia`, `travado`; em `criatura` — `nivel`, `cores`, `categoria` (1–4), `funcao`, `chefe` (sim), `vida`, `xp`. Todo tipo aceita também `aliases` e `grupo`.

O menu **+ Nova → Importar fichas do Nauren** lê o JSON exportado do Foundry (Export Data de um ator ou item, uma lista ou um lote do Importar em massa) e cria ou atualiza as notas.

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

### Recursos do texto (1.28)

- **Link para seção:** `[[Nota#Seção]]` ou `[[Nota#Seção|texto]]`; `[[#Seção]]` aponta para a própria nota.
- **Imagem pelo nome:** `![[mapa-vau.png]]` ou `![[mapa-vau.png|300]]` (largura em pixels).
- **Lista automática:** um bloco ` ```lista ` monta uma tabela das notas que batem com os filtros. Uma linha por filtro; vírgula = qualquer um dos valores; `!valor` = negação; `este` = esta nota.

````
```lista
tipo: personagem
local: este
situacao: !morto
colunas: papel, faccao
ordem: nome
```
````

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
