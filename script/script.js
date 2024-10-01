const produtosTable = document.getElementById("produtosTable").getElementsByTagName("tbody")[0];
const adicionarProdutoButton = document.getElementById('adicionarProduto');
const gerarEtiquetasButton = document.getElementById("gerarEtiquetas");
const logList = document.getElementById("logList");

let produtosModal = {}; // Corrigido
let produtosAdicionados = {}; // Necessário para armazenar os produtos adicionados


async function carregarProdutos() {
    try {
        const url = 'https://docs.google.com/spreadsheets/d/1wO7TRDOSikvVZ2GCjXDSSqXpX8kbhNKXY_0P8jW7GMM/export?format=csv';
        const response = await fetch(url);
        if (!response.ok) throw new Error('Erro ao acessar a planilha.');

        const data = await response.text();
        const rows = data.split('\n').slice(1); // Ignora o cabeçalho
        if (!rows.length) throw new Error('A planilha está vazia.');

        // Limpa a tabela de produtos antes de adicionar os novos
        produtosTable.innerHTML = '';

        rows.forEach(row => {
            const [ean, descricao, preco, codigoProduto] = row.split(',');
            if (validarEAN13(ean.trim())) {
                produtosModal[ean.trim()] = { descricao, preco: formatarPrecoBr(preco), codigoProduto };
            } else {
                mostrarMensagem(`EAN inválido: ${ean.trim()}`, "error");
            }
        });
        // Adiciona produto apenas se existir algum produto carregado
        if (Object.keys(produtosModal).length > 0) {
            mostrarMensagem("Carregado", "success");
        }
    } catch (error) {
        mostrarMensagem(`Erro: ${error.message}`, "error");
    }
}

async function buscarProdutoPorEAN(ean, linha) {
    // Completa o EAN com zeros à esquerda se tiver menos de 13 dígitos
    while (ean.length < 13) {
        ean = '0' + ean;
    }

    // Atualiza o campo de entrada do EAN
    linha.querySelector('.ean-input').value = ean; // Atualiza o campo de entrada com o EAN modificado

    // Verifica se o EAN modificado existe no produtosModal
    if (produtosModal[ean]) {
        linha.querySelector('.nome-input').value = produtosModal[ean].descricao; // Preenche o nome
        linha.querySelector('.preco-input').value = produtosModal[ean].preco; // Preenche o preço
        mostrarMensagem("Produto encontrado.", "success");
        return true;
    } else {
        mostrarMensagem("Produto não encontrado.", "error");
        return false;
    }
}

document.addEventListener('keypress', async function (event) {
    if (event.target.classList.contains('ean-input') && event.key === 'Enter') {
        let ean = event.target.value.trim();
        
        // Completa o EAN com zeros à esquerda se tiver menos de 13 dígitos
        while (ean.length < 13) {
            ean = '0' + ean;
        }

        // Atualiza o campo de entrada do EAN
        event.target.value = ean; // Atualiza o campo de entrada com o EAN modificado

        const linha = event.target.closest('.linha-produto');
        const encontrado = await buscarProdutoPorEAN(ean, linha);

        if (!encontrado) {
            event.target.focus();
            event.target.select();
        } else {
            const nextEANInput = linha.nextElementSibling?.querySelector('.ean-input');
            if (nextEANInput) {
                nextEANInput.focus();
            } else {
                adicionarProduto();
            }
        }
        event.preventDefault(); // Previne o comportamento padrão do Enter
    }
});

function formatarPrecoBr(preco) {
    const valor = parseFloat(preco.replace(',', '.'));
    return isNaN(valor) ? 'R$ 0,00' : 'R$ ' + valor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function criarLinhaProduto(ean = '', nome = '', preco = 'R$ 0,00', quantidade = 1) {
    const novaLinha = produtosTable.insertRow(); // Adiciona uma nova linha ao final da tabela
    novaLinha.innerHTML = `
        <td><input type="text" class="ean-input" value="${ean}" placeholder="EAN"></td>
        <td><input type="text" class="nome-input" value="${nome}" placeholder="Nome" readonly></td>
        <td><input type="text" class="preco-input" value="${preco}" placeholder="Preço" readonly></td>
        <td><input type="number" class="quantidade-input" min="1" value="${quantidade}"></td>
        <td><button class="removerProduto">Remover</button></td>
    `;

    novaLinha.querySelector(".removerProduto").addEventListener("click", () => {
        novaLinha.remove(); // Remove a linha
        delete produtosAdicionados[ean]; // Remove o produto do objeto de produtos adicionados
    });

    return novaLinha; // Retorna a nova linha criada
}

// Função para adicionar produto na tabela
function adicionarProduto() {
    const novaLinha = criarLinhaProduto();
    produtosTable.appendChild(novaLinha);

    

    const eanInput = novaLinha.querySelector('.ean-input');
    eanInput.addEventListener('keydown', async function(event) {
        if (event.key === 'Enter') {
            const ean = this.value.trim();
            const produtoValido = await buscarProdutoPorEAN(ean, novaLinha);

            if (produtoValido) {
                // Se o produto for válido, move o foco para a próxima linha
                const nextEANInput = novaLinha.nextElementSibling?.querySelector('.ean-input');
                if (nextEANInput) {
                    nextEANInput.focus();
                } else {
                    adicionarProduto(); // Adiciona uma nova linha
                    const lastEANInput = produtosTable.querySelector("tr:last-child .ean-input");
                    if (lastEANInput) {
                        lastEANInput.focus();
                    }
                }
            } else {
                // Mantém o foco no campo EAN, limpa o valor e seleciona todo o texto
                this.focus();
                this.select(); // Seleciona o texto (neste caso, nada, pois foi limpo)
            }
            event.preventDefault();
        }
    });

    eanInput.focus(); // Foca no campo EAN da nova linha
}

function adicionarProdutoDireto(ean, nome, preco, quantidade) {
    // Completa o EAN com zeros à esquerda se tiver menos de 13 dígitos
    ean = ean.padStart(13, '0');

    if (validarEAN13(ean)) {
        // Adiciona o produto à lista de produtos
        produtosAdicionados[ean] = { descricao: nome, preco, quantidade };
        criarLinhaProduto(ean, nome, preco, quantidade);
    } else {
        mostrarMensagem(`EAN inválido: ${ean}`, "error");
    }
}

// A função para adicionar produto por EAN já está definida em seu código
async function adicionarProdutoPorEAN(ean, quantidade) {
    const produto = produtosModal[ean.trim()];

    if (produto) {
        // Adiciona o produto à lista de produtos
        produtos[ean] = { descricao: produto.descricao, preco: produto.preco, quantidade };
        const novaLinha = criarLinhaProduto(ean, produto.descricao, produto.preco, quantidade);
        
        // Inserir a nova linha na posição correta (índice 1)
        produtosTable.insertBefore(novaLinha, produtosTable.rows[1]);

        mostrarMensagem("Produto adicionado com sucesso.", "success");

        console.log(`Produto adicionado: EAN = ${ean}, Quantidade = ${quantidade}`);
        return true;
    } else {
        mostrarMensagem("Produto com EAN " + ean + " não encontrado no banco de dados.", "error");
        return false;
    }
}

function gerarEtiquetas() {
    const linhasProdutos = [...produtosTable.querySelectorAll("tr")];
    let zplCode = '';
    let textoEtiquetas = '';
    const tipoArquivo = document.getElementById("tipoArquivo").value;
    const posicoesX = [45, 322, 595];
    let produtoIndex = 0;

    linhasProdutos.forEach(linha => {
        const ean = linha.querySelector("td:nth-child(1) input").value.trim();
        const nome = linha.querySelector("td:nth-child(2) input").value.trim();
        const precoInput = linha.querySelector("td:nth-child(3) input").value;
        const preco = precoInput.replace('R$ ', '').replace('.', '').replace('.', ',');
        const quantidade = parseInt(linha.querySelector("td:nth-child(4) input").value, 10);

        // Validação de dados
        if (!ean || !nome || isNaN(quantidade) || quantidade <= 0) {
            return;
        }

        for (let j = 0; j < quantidade; j++) {
            const posicaoX = posicoesX[produtoIndex % 3];
            const nomeLimitado = nome.length > 56 ? nome.substring(0, 56) : nome;
            const partesNome = [...Array(Math.ceil(nomeLimitado.length / 26)).keys()].map(i => nomeLimitado.substring(i * 26, (i + 1) * 26));

            if (tipoArquivo === 'zpl') {
                if (produtoIndex % 3 === 0) {
                    zplCode += '^XA\n';
                }

                zplCode += `^CF0,17\n^FO${posicaoX},85^BY^BEN,70,10,50^BY2^FD${ean}^FS\n`;
                zplCode += `^FO${posicaoX - 13},18^A0N,28^FDR$ ${preco}^FS\n`;
                zplCode += `^FO${posicaoX - 13},46^A0N,0^FD${partesNome[0]}^FS\n`;
                if (partesNome[1]) {
                    zplCode += `^FO${posicaoX - 13},66^A0N,0^FD${partesNome[1]}^FS\n`;
                }

                if (produtoIndex % 3 === 2) {
                    zplCode += '\n^XZ\n';
                }
            } else {
                if (produtoIndex % 3 === 0) {
                    textoEtiquetas += '^XA\n';
                }

                textoEtiquetas += `^CF0,17\n^FO${posicaoX},85^BY^BEN,70,10,50^BY2^FD${ean}^FS\n`;
                textoEtiquetas += `^FO${posicaoX - 13},18^A0N,28^FDR$ ${preco}^FS\n`;
                textoEtiquetas += `^FO${posicaoX - 13},46^A0N,0^FD${partesNome[0]}^FS\n`;
                if (partesNome[1]) {
                    textoEtiquetas += `^FO${posicaoX - 13},66^A0N,0^FD${partesNome[1]}^FS\n`;
                }

                if (produtoIndex % 3 === 2) {
                    textoEtiquetas += '^XZ\n';
                }
            }

            produtoIndex++;
        }
    });

    // Finalizando o código e fazendo o download
    if (tipoArquivo === 'zpl' && zplCode) {
        if (produtoIndex % 3 !== 0) {
            zplCode += '^XZ\n';
        }
        baixarArquivoZPL(zplCode);
        mostrarMensagem("Etiquetas geradas com sucesso!", "success");
    } else if (tipoArquivo === 'txt' && textoEtiquetas) {
        if (produtoIndex % 3 !== 0) {
            textoEtiquetas += '^XZ\n';
        }
        baixarArquivoTXT(textoEtiquetas);
        mostrarMensagem("Etiquetas geradas com sucesso!", "success");
    } else {
        mostrarMensagem("Nenhum produto válido adicionado", "alert");
    }
}

function baixarArquivoZPL(zplCode) {
    const blob = new Blob([zplCode], { type: 'text/plain' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'etiquetas.zpl';
    link.click();
}

function baixarArquivoTXT(textoEtiquetas) {
    const blob = new Blob([textoEtiquetas], { type: 'text/plain' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'etiquetas.txt';
    link.click();
}

function mostrarMensagem(mensagem, tipo = 'info') {
    // Implementar a função para mostrar mensagens ao usuário
    console.log(`${tipo.toUpperCase()}: ${mensagem}`);
}

function configurarModal() {
    const modal = document.getElementById("myModal");
    const abrirModalButton = document.getElementById("abrirModal");
    const fecharModalButton = document.getElementById("fecharModal");
    const uploadCSV = document.getElementById("uploadCSV");
    const dropZone = document.getElementById("dropZone");

    // Define os tipos de arquivo aceitos
    uploadCSV.setAttribute("accept", ".csv, .txt");

    // Abre o modal
    abrirModalButton.onclick = () => modal.style.display = "block";

    // Fecha o modal ao clicar no botão "Fechar"
    fecharModalButton.onclick = () => {
        modal.style.display = "none";
        uploadCSV.value = ""; // Reinicia o input de arquivo
    };

    // Fecha o modal ao clicar fora dele
    window.onclick = (event) => {
        if (event.target === modal) {
            modal.style.display = "none";
            uploadCSV.value = ""; // Reinicia o input de arquivo
        }
    };

    // Função para processar o upload do arquivo
    uploadCSV.addEventListener("change", (event) => {
        const files = event.target.files;
        processFiles(files);
        modal.style.display = "none"; // Fecha o modal após o upload
        uploadCSV.value = ""; // Reinicia o input de arquivo
    });

    // Função para drag and drop
    dropZone.addEventListener("click", () => {
        uploadCSV.click();
    });

    dropZone.addEventListener("dragover", (event) => {
        event.preventDefault();
        dropZone.classList.add("drag-over");
    });

    dropZone.addEventListener("dragleave", () => {
        dropZone.classList.remove("drag-over");
    });

    dropZone.addEventListener("drop", (event) => {
        event.preventDefault();
        dropZone.classList.remove("drag-over");
        const files = event.dataTransfer.files;
        processFiles(files);
        modal.style.display = "none"; // Fecha o modal após o upload
        uploadCSV.value = ""; // Reinicia o input de arquivo
    });
}

function processFiles(files) {
    const file = files[0];
    if (!file) {
        alert("Nenhum arquivo selecionado.");
        return;
    }

    // Verifica se o arquivo é um CSV ou TXT
    const fileType = file.type;
    if (!["text/csv", "text/plain"].includes(fileType) && !file.name.endsWith('.csv') && !file.name.endsWith('.txt')) {
        alert("Por favor, carregue um arquivo CSV ou TXT.");
        return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
        const content = event.target.result;
        processFileContent(content); // Processa o conteúdo do arquivo
    };
    reader.readAsText(file);
}


async function processFileContent(content) {
    console.log("Conteúdo do arquivo:", content);
    limparTabela();
    produtos = {}; // Reinicializa o objeto de produtos
    logList.innerHTML = '';

    content = content.trim();
    const delimiter = content.includes(";") ? ";" : ",";
    const rows = content.split(/\r?\n/).filter(row => row.trim() !== '');

    // Obtém os cabeçalhos da primeira linha
    const headers = rows[0].split(delimiter).map(item => item.trim().toLowerCase());
    const indices = {
        ean: headers.indexOf('ean'),
        nome: headers.indexOf('nome'),
        preco: headers.indexOf('preco'),
        quantidade: headers.indexOf('quantidade')
    };

    // Verifica se o cabeçalho tem pelo menos 'ean' e 'quantidade'
    if (indices.ean === -1 || indices.quantidade === -1) {
        mostrarMensagem("Arquivo com formato inválido. Necessário pelo menos 'ean' e 'quantidade'.", "error");
        return;
    }

    // Carrega os produtos para busca posterior
    await carregarProdutos();

    // Processa cada linha do arquivo
    for (let row of rows.slice(1)) {
        const columns = row.split(delimiter).map(item => item.trim());
        let ean = columns[indices.ean];

        // Completa o EAN com zeros à esquerda se tiver menos de 13 dígitos
        while (ean.length < 13) {
            ean = '0' + ean;
        }

        const quantidadeStr = columns[indices.quantidade];
        const quantidade = parseInt(quantidadeStr, 10);

        // Validação do EAN
        if (!validarEAN13(ean)) {
            mostrarMensagem("EAN inválido: " + ean, "error");
            continue; // Continua para a próxima linha
        }

        if (!columns[indices.nome] && !columns[indices.preco]) {
            // Se só temos EAN e quantidade
            const produtoAdicionado = await adicionarProdutoPorEAN(ean, quantidade);
            if (!produtoAdicionado) {
                mostrarMensagem("Produto com EAN " + ean + " não encontrado no banco de dados.", "error");
            }
        } else if (columns[indices.nome] && columns[indices.preco]) {
            let nome = columns[indices.nome];
            let precoStr = columns[indices.preco];
            let preco = formatarPrecoBr(precoStr);

            if (produtos[ean]) {
                mostrarMensagem("Produto já adicionado: " + ean, "warning");
                continue; // Evita adicionar o mesmo produto novamente
            }
            produtos[ean] = { descricao: nome, preco, quantidade };
            criarLinhaProduto(ean, nome, preco, quantidade);
        } else {
            mostrarMensagem("Informações incompletas para o EAN: " + ean, "error");
        }
    }

    mostrarMensagem("Arquivo processado com sucesso!", "success");
}


function adicionarAoLog(mensagem) {
    const li = document.createElement('p');
    li.textContent = mensagem;
    logList.appendChild(li);
}


function limparTabela() {
    const produtosTable = document.getElementById('produtosTable').getElementsByTagName('tbody')[0];
    while (produtosTable.rows.length > 0) {
        produtosTable.deleteRow(0);
    }
}

document.getElementById('limparTabela').addEventListener('click', () => {
    limparTabela();
    carregarProdutos(); // Recarregue os produtos após limpar a tabela
});

function limparTabela() {
    const produtosTable = document.getElementById('produtosTable').getElementsByTagName('tbody')[0];
    while (produtosTable.rows.length > 0) {
        produtosTable.deleteRow(0);
    }
    produtos = {}; // Reinicialize o objeto de produtos aqui
    produtosModal = {}; // Também reinicialize o objeto de produtosModal
}

function validarEAN13(ean) {
    // Verifica se o EAN é uma string
    if (typeof ean !== 'string') {
        console.warn(`EAN inválido: ${ean}.`);
        return false;
    }

    // Completa o EAN com zeros à esquerda se tiver menos de 13 dígitos
    while (ean.length < 13) {
        ean = '0' + ean;
    }

    // Verifica o comprimento do EAN
    if (ean.length !== 13) {
        console.warn(`EAN inválido: ${ean}. Deve ter exatamente 13 dígitos.`);
        adicionarAoLog(`EAN inválido: ${ean}. Deve ter exatamente 13 dígitos.`);
        return false;
    }

    // Verifica se todos os caracteres são dígitos
    if (!/^\d{13}$/.test(ean)) {
        console.warn(`EAN inválido: ${ean}. Todos os caracteres devem ser dígitos.`);
        adicionarAoLog(`EAN inválido: ${ean}. Todos os caracteres devem ser dígitos.`);
        return false;
    }

    let soma = 0;
    for (let i = 0; i < 12; i++) {
        soma += (i % 2 === 0 ? 1 : 3) * parseInt(ean.charAt(i), 10);
    }
    const digitoVerificador = (10 - (soma % 10)) % 10;

    // Verifica se o dígito verificador está correto
    if (digitoVerificador !== parseInt(ean.charAt(12), 10)) {
        console.warn(`EAN inválido: ${ean}. Dígito verificador inválido.`);
        adicionarAoLog(`EAN inválido: ${ean}. Dígito verificador inválido.`);
        return false;
    }

    return true; // EAN é válido
}


// Seleciona ou cria o contêiner de mensagens
let mensagemContainer = document.querySelector(".mensagem-container");

if (!mensagemContainer) {
    mensagemContainer = document.createElement("div");
    mensagemContainer.className = "mensagem-container";
    document.body.appendChild(mensagemContainer);
}

function mostrarMensagem(mensagem, tipo) {
    const novaMensagem = document.createElement("div");
    novaMensagem.textContent = mensagem;
    novaMensagem.className = `mensagem ${tipo} fade-in`; // Usa diretamente o tipo

    // Adiciona a nova mensagem no contêiner
    mensagemContainer.appendChild(novaMensagem);

    // Remove a mensagem após 5 segundos
    setTimeout(() => {
        novaMensagem.classList.replace("fade-in", "fade-out");
        novaMensagem.addEventListener("animationend", () => novaMensagem.remove());
    }, 2500);
    console.log(`[${tipo}] ${mensagem}`);
}

// Detecta se o navegador está em modo escuro ou claro
if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    console.log('O navegador está no modo escuro');
} else {
    console.log('O navegador está no modo claro');
}