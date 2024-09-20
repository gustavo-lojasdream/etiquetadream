const produtosTable = document.getElementById("produtosTable").getElementsByTagName("tbody")[0];
const adicionarProdutoButton = document.getElementById("adicionarProduto");
const gerarEtiquetasButton = document.getElementById("gerarEtiquetas");

let produtos = {}; // Objeto para armazenar os produtos carregados da planilha

// Função para carregar produtos do Google Sheets
async function carregarProdutos() {
    const url = 'https://docs.google.com/spreadsheets/d/1wO7TRDOSikvVZ2GCjXDSSqXpX8kbhNKXY_0P8jW7GMM/export?format=csv';
    const response = await fetch(url);
    const data = await response.text();
    const rows = data.split('\n').slice(1); // Ignora o cabeçalho

    rows.forEach(row => {
        const [ean, descricao, preco, codigoProduto] = row.split(',');
        produtos[ean] = { descricao, preco, codigoProduto };
    });
}

// Função para adicionar uma nova linha à tabela
function adicionarProduto() {
    const novaLinha = produtosTable.insertRow();
    const celulaEAN = novaLinha.insertCell();
    const celulaNome = novaLinha.insertCell();
    const celulaPreco = novaLinha.insertCell();
    const celulaQuantidade = novaLinha.insertCell();
    const celulaAcoes = novaLinha.insertCell();

    celulaEAN.innerHTML = '<input type="text" class="ean-input">';
    celulaNome.innerHTML = '<input type="text" class="nome-input">';
    celulaPreco.innerHTML = '<input type="number" class="preco-input" value="0.00">';
    celulaQuantidade.innerHTML = '<input type="number" class="quantidade-input" min="1" value="1">';
    celulaAcoes.innerHTML = '<button class="removerProduto">Remover</button>';

    // Remover a linha
    celulaAcoes.querySelector(".removerProduto").addEventListener("click", () => {
        novaLinha.remove();
    });

    // Buscar o nome do produto ao inserir EAN
    celulaEAN.querySelector('.ean-input').addEventListener('blur', function() {
        const ean = this.value;
        buscarProdutoPorEAN(ean, novaLinha);
    });
}

// Função para buscar o nome do produto por EAN
function buscarProdutoPorEAN(ean, linha) {
    const produto = produtos[ean];
    if (produto) {
        linha.querySelector('.nome-input').value = produto.descricao;
        linha.querySelector('.preco-input').value = produto.preco;
    } else {
        alert('Produto não encontrado.');
    }
}

// Função para gerar as etiquetas ZPL
function gerarEtiquetas() {
    const linhasProdutos = produtosTable.querySelectorAll("tr");
    let zplCode = '';
    const posicoesX = [33, 315, 595];  // Posições X para etiquetas em uma mesma linha

    let produtoIndex = 0;

    linhasProdutos.forEach((linha, i) => {
        const ean = linha.querySelector("td:nth-child(1) input").value;
        const nome = linha.querySelector("td:nth-child(2) input").value;
        const preco = linha.querySelector("td:nth-child(3) input").value;
        const quantidade = parseInt(linha.querySelector("td:nth-child(4) input").value, 10);

        for (let j = 0; j < quantidade; j++) {
            // Adicionar ^XA para início do bloco de etiquetas
            if (produtoIndex % 3 === 0) {
                zplCode += '\n^XA\n';
            }

            const posicaoX = posicoesX[produtoIndex % 3];
            zplCode += `^CF0,17
^FO${posicaoX},85^BY^BEN,70,10,50^BY2^FD${ean}^FS
^FO${posicaoX - 13},19^A0N,20^FDR$ ${preco}^FS
^FO${posicaoX - 13},40^A0N,0^FD- ${nome}^FS`;

            produtoIndex++;

            // Adicionar ^XZ para finalizar a cada grupo de 3 etiquetas
            if (produtoIndex % 3 === 0) {
                zplCode += '\n^XZ\n';
            }
        }
    });

    // Verificar se restam etiquetas fora de um múltiplo de 3 e fechar com ^XZ
    if (produtoIndex % 3 !== 0) {
        zplCode += '\n^XZ\n';
    }

    if (zplCode) {
        baixarArquivoZPL(zplCode);
    } else {
        alert("Nenhum produto adicionado.");
    }
}

// Função para baixar o código ZPL gerado
function baixarArquivoZPL(zplCode) {
    const blob = new Blob([zplCode], { type: 'text/plain' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'etiquetas.zpl';
    link.click();
}

// Adicionar evento para o botão "Adicionar Produto"
adicionarProdutoButton.addEventListener("click", adicionarProduto);

// Adicionar evento para o botão "Gerar Etiquetas"
gerarEtiquetasButton.addEventListener("click", gerarEtiquetas);

// Carregar os produtos da planilha ao carregar a página
carregarProdutos();
