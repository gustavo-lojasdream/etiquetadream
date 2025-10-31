# Gerador de Etiqueta

Este é um site para gerar etiquetas personalizadas a partir de dados de arquivos CSV ou TXT. Ele permite carregar, visualizar e personalizar os dados antes de gerar as etiquetas.

## Funcionalidades

* **Carregamento de dados:** Carregue dados de arquivos CSV ou TXT.
* **Visualização de dados:** Visualize os dados em uma tabela interativa.
* **Personalização de etiquetas:** Personalize as etiquetas com base nos dados carregados.
* **Geração de etiquetas:** Gere etiquetas individuais com um clique ou use o atalho **Ctrl+G** para gerar a etiqueta da linha selecionada.
* **Interface amigável:** Interface simples e intuitiva para facilitar o uso.

## Como usar

1.**Carregue um arquivo:** Clique no botão "Carregar Arquivo" e selecione um arquivo CSV ou TXT.
2.**Visualize os dados:** Os dados serão exibidos em uma tabela.
3.**Gere a etiqueta:**
    *Clique no botão "Gerar Etiqueta" para gerar a etiqueta da linha selecionada.
    *Use o atalho **Ctrl+G** para gerar a etiqueta rapidamente.

## Arquivos de exemplo

Os arquivos de exemplo no diretório `data/` (`exemplo.csv`, `exemplo2.csv`) são arquivos CSV que demonstram o formato esperado para os dados das etiquetas.

### Estrutura dos arquivos CSV

#### exemplo.csv: Lista de produtos sem cadastro com preço e quantidade

```csv
ean;nome;preco;quantidade;
2345678901234;Produto Exemplo 2;1.58;5;
3456789012344;Produto Exemplo 3;1.58;2;
1234567890128;Produto Exemplo 1;1.58;1;
1234567890128;Produto Exemplo 4;1.58;3;
```

#### exemplo2.csv: Contagem de produtos pelo EAN

```csv
ean;quantidade;
4894290046338;5;
3456789012344;2;
4894290653031;1;
1234567890128;3;
```

* A primeira linha do arquivo define os cabeçalhos das colunas, que serão usados como rótulos para os campos na etiqueta.
* Cada linha subsequente representa um conjunto de dados para uma etiqueta individual.
* Certifique-se de que os valores estejam separados por ponto e vírgula (`;`).

## Estrutura de arquivos do projeto

* `index.html`: Arquivo HTML principal do site.
* `script/`: Diretório contendo os arquivos JavaScript.
  * `script.js`: Arquivo JavaScript principal.
  * `darkMode.js`: Arquivo JavaScript para o modo escuro.
* `styles/`: Diretório contendo os arquivos CSS.
  * `style.css`: Arquivo CSS principal.
  * `mensagem.css`: Arquivo CSS para mensagens.
  * `modal.css`: Arquivo CSS para o modal.
* `data/`: Diretório contendo arquivos de exemplo.
  * `exemplo.csv`: Arquivo CSV de exemplo.
  * `exemplo2.csv`: Arquivo CSV de exemplo.
* `src/`: Diretório contendo imagens.
  * `logo.svg`: Logo do site.
  * `logo-aba.png`: Logo do site para a aba do navegador.

## Contribuição

Contribuições são bem-vindas! Sinta-se à vontade para abrir issues e pull requests.
