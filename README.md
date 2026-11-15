# Atlas

App open source para criar mundos: mapas no estilo de gravura medieval (vista inclinada) e notas ligadas entre si, no modelo do Obsidian.

Estado: **v0.2, protótipo web**. Roda direto no navegador, sem instalar nada.

## Como abrir

Abra `app/index.html` no navegador. Sem servidor, os dados ficam salvos só naquele navegador.

## O que já faz

**Mapas**
- Gerador de região com formações: região interior, costa, península, ilha, arquipélago e continente, combináveis com ilhas extras, lagos e rios.
- Relevo com curvas de nível e hachuras, rios, florestas, povoados, estradas por caminho de menor custo, pontes de madeira e de pedra, portos com píeres e barcos.
- Cidades e vilas com forma orgânica, ruas alinhadas às construções, muralha que acompanha a área construída, com portões nas estradas e arcos sobre rios.
- Plantações em lotes poligonais (mosaico), com lavoura, faixas, pasto e pomar.
- Edição: pincéis (terra, mar, elevar, rebaixar, floresta, clareira), adicionar e remover povoados, pinos, e **linhas vetoriais** para rios e estradas (arrastar pontos, criar e remover).
- Cada povoado tem parâmetros próprios: tipo, tamanho, densidade, traçado das ruas e muralha.
- Zoom com roda do mouse, dois dedos ou botões; arrastar para mover.

**Notas**
- Markdown com `[[links]]`, autocompletar, modelos por tipo, pastas, busca e "mencionada em".
- Cada povoado ou pino do mapa pode ter a sua nota, editável ao lado do mapa.
- Exportar o vault como `.zip` (notas em `.md`, mapas em `.json`) e importar `.md`.

## Estrutura

| Arquivo | Conteúdo |
|---|---|
| `app/index.html` | Casca do app |
| `app/style.css` | Tema e layout |
| `app/gen.js` | Gerador e renderizador de mapas (`window.AtlasGen`) |
| `app/app.js` | Notas, mapas, edição e armazenamento |

## Roteiro

1. Escala continental e mapa de cidade em escala própria.
2. Pacotes de assets importáveis e temas (fantasia, sépia, moderno, cyberpunk).
3. Modo sessão, linha do tempo, grafo.
4. Versão de PC (Tauri) lendo e gravando uma pasta real, compatível com Obsidian.

## Licença

GPL-3.0. Veja `LICENSE` e `NOTICE.md`.
