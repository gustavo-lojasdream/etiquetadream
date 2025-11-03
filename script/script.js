const produtosTable = document.getElementById("produtosTable").getElementsByTagName("tbody")[0];
const adicionarProdutoButton = document.getElementById('adicionarProduto');
const imprimirDiretoButton = document.getElementById("imprimirDireto");
if (imprimirDiretoButton) {
    imprimirDiretoButton.addEventListener("click", () => {
        imprimirEtiquetasDireto();
        mostrarMensagem("Impressão direta iniciada", "info");
    });
}
const gerarEtiquetasButton = document.getElementById("gerarEtiquetas");
if (gerarEtiquetasButton) {
    gerarEtiquetasButton.addEventListener("click", () => {
        gerarEtiquetas();
        mostrarMensagem("Gerando arquivo de etiquetas (TXT)...", "info");
    });
}


const logList = document.getElementById("logList");

let produtosModal = {}; // Corrigido
let produtosAdicionados = {}; // Necessário para armazenar os produtos adicionados


async function carregarProdutos() {
    try {
        const urlCSV = ENV.PRODUTOS_CSV_URL; // ✅ Lendo do env
        const response = await fetch(urlCSV);
        if (!response.ok) throw new Error('Erro ao acessar a planilha.');

        const data = await response.text();
        const rows = data.split('\n').slice(1); // ignora cabeçalho
        produtosModal = {}; // limpa o cache anterior

        rows.forEach(row => {
            const [ean, descricao, preco, codigoProduto] = row.split(',');
            if (!ean) return;

            const eanLimpo = ean.trim();
            if (validarEAN13(eanLimpo)) {
                produtosModal[eanLimpo] = {
                    descricao: normalizarTexto(descricao),
                    preco: formatarPrecoBr(preco),
                    codigoProduto
                };
            } else {
                mostrarMensagem(`EAN inválido: ${eanLimpo}`, "error");
            }
        });

        if (Object.keys(produtosModal).length > 0) {
            mostrarMensagem("Produtos carregados com sucesso!", "success");
        } else {
            mostrarMensagem("Nenhum produto válido encontrado na planilha.", "alert");
        }

    } catch (error) {
        mostrarMensagem(`Erro: ${error.message}`, "error");
    }

    // ✅ Mantém o log de status da validação EAN13
    console.log(
        ENV.VALIDAR_EAN13
            ? "🔒 Validação EAN13 ATIVADA"
            : "⚙️ Validação EAN13 DESATIVADA — aceitando qualquer código"
    );
}

async function buscarProdutoPorEAN(ean, linha) {
    if (!linha) return false; // 🚨 Evita erro caso a linha não exista

    if (ENV.VALIDAR_EAN13) {
        while (ean.length < 13) {
            ean = '0' + ean;
        }
    }

    const eanInput = linha.querySelector('.ean-input');
    if (!eanInput) return false;

    eanInput.value = ean;

    if (produtosModal[ean]) {
        linha.querySelector('.nome-input').value = produtosModal[ean].descricao;
        linha.querySelector('.preco-input').value = produtosModal[ean].preco;
        mostrarMensagem("Produto encontrado.", "success");
        return true;
    } else {
        mostrarMensagem("Produto não encontrado.", "error");
        return false;
    }
}


// 🔹 Enter no campo EAN
document.addEventListener('keypress', async function (event) {
    if (event.target.classList.contains('ean-input') && event.key === 'Enter') {
        const linha = event.target.closest('tr'); // garante que é uma linha válida
        if (!linha) return;

        let ean = event.target.value.trim();
        if (ENV.VALIDAR_EAN13) while (ean.length < 13) ean = '0' + ean;

        event.target.value = ean;
        const encontrado = await buscarProdutoPorEAN(ean, linha);

        if (!encontrado) {
            event.target.focus();
            event.target.select();
        } else {
            const nextEANInput = linha.nextElementSibling?.querySelector('.ean-input');
            if (nextEANInput) nextEANInput.focus();
            else adicionarProduto();
        }
        event.preventDefault();
    }
});

// 🔹 Blur no campo EAN
document.addEventListener('blur', async function (event) {
    if (event.target.classList.contains('ean-input')) {
        const linha = event.target.closest('tr');
        if (!linha) return;
        const ean = event.target.value.trim();
        if (!ean) return;
        await buscarProdutoPorEAN(ean, linha);
    }
}, true);




function formatarPrecoBr(preco) {
    const valor = parseFloat(preco.replace(',', '.'));
    return isNaN(valor) ? 'R$ 0,00' : 'R$ ' + valor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// 🔤 Normaliza texto: remove acentos e deixa tudo MAIÚSCULO
function normalizarTexto(texto) {
    if (!texto) return "";
    return texto
        .normalize("NFD")                     // separa acentos das letras
        .replace(/[\u0300-\u036f]/g, "")      // remove acentos
        .replace(/ç/g, "c")                   // substitui ç por c
        .replace(/Ç/g, "C")                   // substitui Ç por C
        .toUpperCase();                       // tudo maiúsculo
}


function criarLinhaProduto(ean = '', nome = '', preco = 'R$ 0,00', quantidade = 1) {
    nome = normalizarTexto(nome);
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
    eanInput.focus(); // Adiciona o foco no campo EAN da nova linha
    eanInput.select(); // Opcional: Seleciona o texto dentro do campo, caso haja algum valor padrão

    eanInput.addEventListener('keydown', async function (event) {
        if (event.key === 'Enter') {
            const ean = this.value.trim();
            const produtoValido = await buscarProdutoPorEAN(ean, novaLinha);

            if (produtoValido) {
                const nextEANInput = novaLinha.nextElementSibling?.querySelector('.ean-input');
                if (nextEANInput) {
                    nextEANInput.focus();
                } else {
                    adicionarProduto();
                }
            } else {
                this.focus();
                this.select();
            }
            event.preventDefault();
        }
    });
}

function adicionarProdutoDireto(ean, nome, preco, quantidade) {
    if (ENV.VALIDAR_EAN13) {
        ean = ean.padStart(13, '0');
    }

    if (validarEAN13(ean)) {
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
        produtosAdicionados[ean] = { descricao: produto.descricao, preco: produto.preco, quantidade };
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

// ================================
// 🧾 GERAR OU IMPRIMIR ETIQUETAS (EAN ou QR)
// ================================
function gerarEtiquetas() {
    const linhasProdutos = [...produtosTable.querySelectorAll("tr")];
    const tipoSelect = document.getElementById("tipoArquivo");
    const tipoArquivo = tipoSelect ? tipoSelect.value : "txt"; // ✅ fallback para TXT
    const tipoEtiqueta = document.getElementById("tipoEtiqueta").value; // "ean" ou "qrcode"
    let zplCode = '';
    let textoEtiquetas = '';
    let produtoIndex = 0;

    // Definição das posições X (três colunas)
    const posicoesX = tipoEtiqueta === 'qrcode' ? ENV.POSICOES_X_QR : ENV.POSICOES_X_EAN;

    linhasProdutos.forEach(linha => {
        const ean = linha.querySelector("td:nth-child(1) input").value.trim();
        const nome = normalizarTexto(
            linha.querySelector("td:nth-child(2) input").value.trim()
        );
        const precoInput = linha.querySelector("td:nth-child(3) input").value;
        const preco = precoInput.replace('R$ ', '').replace('.', '').replace('.', ',');
        const quantidade = parseInt(linha.querySelector("td:nth-child(4) input").value, 10);

        // Validação
        if (!ean || !nome || isNaN(quantidade) || quantidade <= 0) return;

        for (let j = 0; j < quantidade; j++) {
            const posicaoX = posicoesX[produtoIndex % 3];
            let etiqueta = '';

            // Início do bloco (a cada 3 etiquetas)
            if (produtoIndex % 3 === 0) {
                etiqueta += '^XA\n';
                etiqueta += '^CF0,17\n';
            }

            if (tipoEtiqueta === 'ean') {
                // -----------------------
                // 📦 CÓDIGO DE BARRAS EAN
                // -----------------------
                etiqueta += `^FO${posicaoX},85^BY^BEN,70,10,50^BY2^FD${ean}^FS\n`;
                etiqueta += `^FO${posicaoX - 13},18^A0N,28^FDR$ ${preco}^FS\n`;

                const nomeLimitado = nome.length > 56 ? nome.substring(0, 56) : nome;
                const partesNome = [...Array(Math.ceil(nomeLimitado.length / 26)).keys()]
                    .map(i => nomeLimitado.substring(i * 26, (i + 1) * 26));

                etiqueta += `^FO${posicaoX - 13},46^A0N,0^FD${partesNome[0]}^FS\n`;
                if (partesNome[1]) etiqueta += `^FO${posicaoX - 13},66^A0N,0^FD${partesNome[1]}^FS\n`;
            } else {
                // -----------------------
                // 🔳 ETIQUETA QR CODE
                // -----------------------
                const xQr = posicaoX + 155;
                const yQr = 25;
                const xTexto = posicaoX + 25;
                const yPreco = 58;
                const yTextoInicial = 86;
                const espacoLinha = 22;

                let nomeLimitado = nome.substring(0, 26);
                const partesNome = [];
                for (let i = 0; i < nomeLimitado.length; i += 13) {
                    partesNome.push(nomeLimitado.substring(i, i + 13));
                }

                etiqueta += `^FO${xQr},${yQr}^BQN,2,5^FDLA,${ean}^FS\n`; // QR code
                etiqueta += `^FO${xTexto},${yPreco}^A0N,27^FDR$ ${preco}^FS\n`;

                partesNome.forEach((parte, idx) => {
                    const yPos = yTextoInicial + (idx * espacoLinha);
                    etiqueta += `^FO${xTexto},${yPos}^A0N,17^FD${parte}^FS\n`;
                });
            }

            // Fecha bloco de 3 etiquetas
            if (produtoIndex % 3 === 2) etiqueta += '^XZ\n';

            // Adiciona ao texto final
            if (tipoArquivo === 'zpl') zplCode += etiqueta;
            else textoEtiquetas += etiqueta;

            produtoIndex++;
        }
    });

    // Fecha o último grupo se sobrar menos de 3 etiquetas
    if (produtoIndex % 3 !== 0) {
        if (tipoArquivo === 'zpl') zplCode += '^XZ\n';
        else textoEtiquetas += '^XZ\n';
    }

    // Faz o download do arquivo ou exibe alerta
    if (tipoArquivo === 'zpl' && zplCode) {
        baixarArquivoZPL(zplCode);
        mostrarMensagem("Etiquetas geradas com sucesso!", "success");
    } else if (tipoArquivo === 'txt' && textoEtiquetas) {
        baixarArquivoTXT(textoEtiquetas);
        mostrarMensagem("Etiquetas geradas com sucesso!", "success");
    } else {
        mostrarMensagem("Nenhum produto válido adicionado", "alert");
    }
}


// ================================
// 🖨️ Função auxiliar para imprimir direto
// ================================
function abrirJanelaImpressao(conteudo) {
    const janelaImpressao = window.open('', '_blank');
    janelaImpressao.document.open();
    janelaImpressao.document.write(`
        <html>
            <head>
                <title>Etiquetas</title>
                <style>
                    body { font-family: monospace; white-space: pre; font-size: 13px; line-height: 1.4; padding: 20px; }
                </style>
            </head>
            <body>
                <pre>${conteudo.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>
            </body>
        </html>
    `);
    janelaImpressao.document.close();
    setTimeout(() => {
        janelaImpressao.focus();
        janelaImpressao.print();
        janelaImpressao.onafterprint = () => janelaImpressao.close();
    }, 400);
}

// ================================
// 🖨️ IMPRIMIR DIRETO (ZPL ou TXT)
// ================================
function imprimirEtiquetasDireto() {
    const linhasProdutos = [...produtosTable.querySelectorAll("tr")];
    const tipoEtiqueta = document.getElementById("tipoEtiqueta").value; // "ean" ou "qrcode"
    let conteudo = "";
    let produtoIndex = 0;

    // Definição das posições X
    const posicoesX = tipoEtiqueta === 'qrcode' ? ENV.POSICOES_X_QR : ENV.POSICOES_X_EAN;

    if (linhasProdutos.length === 0) {
        mostrarMensagem("Nenhum produto adicionado para imprimir.", "alert");
        return;
    }

    linhasProdutos.forEach(linha => {
        const ean = linha.querySelector("td:nth-child(1) input").value.trim();
        const nome = normalizarTexto(linha.querySelector("td:nth-child(2) input").value.trim());
        const preco = linha.querySelector("td:nth-child(3) input").value.replace('R$ ', '');
        const quantidade = parseInt(linha.querySelector("td:nth-child(4) input").value, 10);

        if (!ean || !nome || isNaN(quantidade) || quantidade <= 0) return;

        for (let j = 0; j < quantidade; j++) {
            const posicaoX = posicoesX[produtoIndex % 3];
            let etiqueta = '';

            if (produtoIndex % 3 === 0) {
                etiqueta += '^XA\n';
                etiqueta += '^CF0,17\n';
            }

            if (tipoEtiqueta === 'ean') {
                etiqueta += `^FO${posicaoX},85^BY^BEN,70,10,50^BY2^FD${ean}^FS\n`;
                etiqueta += `^FO${posicaoX - 13},18^A0N,28^FDR$ ${preco}^FS\n`;

                const nomeLimitado = nome.length > 56 ? nome.substring(0, 56) : nome;
                const partesNome = [...Array(Math.ceil(nomeLimitado.length / 26)).keys()]
                    .map(i => nomeLimitado.substring(i * 26, (i + 1) * 26));

                etiqueta += `^FO${posicaoX - 13},46^A0N,0^FD${partesNome[0]}^FS\n`;
                if (partesNome[1]) etiqueta += `^FO${posicaoX - 13},66^A0N,0^FD${partesNome[1]}^FS\n`;
            } else {
                const xQr = posicaoX + 155;
                const yQr = 25;
                const xTexto = posicaoX + 25;
                const yPreco = 58;
                const yTextoInicial = 86;
                const espacoLinha = 22;

                etiqueta += `^FO${xQr},${yQr}^BQN,2,5^FDLA,${ean}^FS\n`;
                etiqueta += `^FO${xTexto},${yPreco}^A0N,27^FDR$ ${preco}^FS\n`;

                const nomeLimitado = nome.substring(0, 26);
                const partesNome = [];
                for (let i = 0; i < nomeLimitado.length; i += 13) {
                    partesNome.push(nomeLimitado.substring(i, i + 13));
                }

                partesNome.forEach((parte, idx) => {
                    const yPos = yTextoInicial + (idx * espacoLinha);
                    etiqueta += `^FO${xTexto},${yPos}^A0N,17^FD${parte}^FS\n`;
                });
            }

            if (produtoIndex % 3 === 2) etiqueta += '^XZ\n';
            conteudo += etiqueta;
            produtoIndex++;
        }
    });

    if (produtoIndex % 3 !== 0) conteudo += '^XZ\n';

    if (conteudo) {
        abrirJanelaImpressao(conteudo);
        mostrarMensagem("Etiquetas enviadas para impressão.", "success");
    } else {
        mostrarMensagem("Nenhum conteúdo para imprimir.", "alert");
    }
}


// ================================
// 📄 DOWNLOAD DE ARQUIVOS
// ================================
function baixarArquivoZPL(conteudo) {
    const blob = new Blob([conteudo], { type: 'text/plain' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = ENV.NOME_ARQUIVO_ZPL;
    link.click();
}

function baixarArquivoTXT(conteudo) {
    const blob = new Blob([conteudo], { type: 'text/plain' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = ENV.NOME_ARQUIVO_TXT;
    link.click();
}

function mostrarMensagem(mensagem, tipo = "info") {
    const msg = document.createElement("div");
    msg.textContent = mensagem;
    msg.className = `mensagem ${tipo}`;
    mensagemContainer.appendChild(msg);

    setTimeout(() => msg.remove(), ENV.MENSAGEM_TIMEOUT);

    if (ENV.DEBUG) console.log(`[${tipo}] ${mensagem}`);
}

function configurarModal() {
    const modal = document.getElementById("myModal");
    const abrirModalButton = document.getElementById("abrirModal");
    const fecharModalButton = document.getElementById("fecharModal");
    const uploadCSV = document.getElementById("uploadCSV");
    const dropZone = document.getElementById("dropZone");

    // Define os tipos de arquivo aceitos
    uploadCSV.setAttribute("accept", ".csv, .txt, .xml");

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

    const fileName = file.name.toLowerCase();

    if (fileName.endsWith('.xml')) {
        const reader = new FileReader();
        reader.onload = (event) => {
            const xmlContent = event.target.result;
            processXMLFile(xmlContent); // 🔹 processa o XML
        };
        reader.readAsText(file);
    } else if (fileName.endsWith('.csv') || fileName.endsWith('.txt')) {
        const reader = new FileReader();
        reader.onload = (event) => {
            const content = event.target.result;
            processFileContent(content); // 🔹 processa CSV/TXT
        };
        reader.readAsText(file);
    } else {
        alert("Por favor, carregue um arquivo XML, CSV ou TXT.");
    }
}

// ================================
// 🧾 PROCESSAR XML (somente EAN e quantidade)
// ================================
async function processXMLFile(xmlContent) {
    try {
        limparTabela("importacao");
        logList.innerHTML = '';

        // 🔹 Garante que o banco de produtos está carregado
        if (!Object.keys(produtosModal).length) {
            await carregarProdutos();
        }

        const parser = new DOMParser();
        const xml = parser.parseFromString(xmlContent, "application/xml");

        const produtos = xml.getElementsByTagName("det");
        if (!produtos || produtos.length === 0) {
            mostrarMensagem("Nenhum produto encontrado no XML.", "error");
            return;
        }

        let totalAdicionados = 0;

        for (let item of produtos) {
            const prod = item.getElementsByTagName("prod")[0];
            if (!prod) continue;

            let ean = prod.getElementsByTagName("cEAN")[0]?.textContent.trim() || "";
            let eanTrib = prod.getElementsByTagName("cEANTrib")[0]?.textContent.trim() || "";
            let qCom = prod.getElementsByTagName("qCom")[0]?.textContent.trim() || "1";
            let qTrib = prod.getElementsByTagName("qTrib")[0]?.textContent.trim() || qCom;

            // 🔹 Remove .00 e converte para número inteiro
            let quantidade = parseInt(parseFloat(qCom.replace(',', '.')));

            // 🔹 Usa cEAN, senão tenta cEANTrib
            if (!ean || ean === "SEM GTIN" || ean === "0") ean = eanTrib;
            if (!ean || ean === "SEM GTIN" || ean === "0") continue;

            // 🔹 Busca produto carregado no banco
            const produto = produtosModal[ean];
            if (!produto) {
                console.warn(`Produto com EAN ${ean} não encontrado no banco carregado.`);
                continue;
            }

            // 🔹 Adiciona à tabela usando dados carregados
            criarLinhaProduto(ean, produto.descricao, produto.preco, quantidade);
            totalAdicionados++;
        }

        if (totalAdicionados > 0) {
            mostrarMensagem(`${totalAdicionados} produtos importados do XML com sucesso!`, "success");
        } else {
            mostrarMensagem("Nenhum produto válido encontrado no XML ou banco de produtos.", "alert");
        }

    } catch (error) {
        console.error("Erro ao processar XML:", error);
        mostrarMensagem("Erro ao processar XML.", "error");
    }
}


async function processFileContent(content) {
    console.log("Conteúdo do arquivo:", content);
    limparTabela("importacao");
    logList.innerHTML = '';

    content = content.trim();
    const delimiter = content.includes(";") ? ";" : ",";
    const rows = content
        .split(/\r?\n/)
        .map(r => r.trim())
        .filter(r => r && !/^(\s*;+\s*|,*)$/.test(r));

    if (rows.length === 0) {
        mostrarMensagem("Arquivo vazio ou inválido.", "error");
        return;
    }

    const headers = rows[0].split(delimiter)
        .map(h => h.trim().toLowerCase())
        .filter(h => h !== "");

    const indices = {
        ean: headers.indexOf('ean'),
        nome: headers.indexOf('nome'),
        preco: headers.indexOf('preco'),
        quantidade: headers.indexOf('quantidade')
    };

    if (indices.ean === -1 || indices.quantidade === -1) {
        mostrarMensagem("Arquivo com formato inválido. Necessário pelo menos 'ean' e 'quantidade'.", "error");
        return;
    }

    // 🔹 Detecta se há colunas nome e preco completas
    const temNomePreco = indices.nome !== -1 && indices.preco !== -1;

    // 🔹 Só carrega banco de produtos se faltar nome/preço
    if (!temNomePreco) {
        await carregarProdutos();
    }

    for (let row of rows.slice(1)) {
        const columns = row.split(delimiter).map(c => c.trim()).filter(c => c !== "");
        if (columns.length < 2) continue;

        let ean = columns[indices.ean] || "";
        if (ENV.VALIDAR_EAN13) while (ean.length < 13) ean = "0" + ean;

        const quantidade = parseInt(columns[indices.quantidade] || "1", 10);
        if (!ean || isNaN(quantidade) || quantidade <= 0) continue;

        // Se tem nome e preço direto no arquivo
        if (temNomePreco) {
            const nome = normalizarTexto(columns[indices.nome] || "");
            const preco = formatarPrecoBr(columns[indices.preco] || "0");
            criarLinhaProduto(ean, nome, preco, quantidade);
        } else {
            // Só EAN + quantidade → busca info na planilha
            const produtoAdicionado = await adicionarProdutoPorEAN(ean, quantidade);
            if (!produtoAdicionado) {
                mostrarMensagem("Produto com EAN " + ean + " não encontrado.", "error");
            }
        }
    }

    mostrarMensagem("Arquivo processado com sucesso!", "success");
}


function adicionarAoLog(mensagem) {
    const li = document.createElement('p');
    li.textContent = mensagem;
    logList.appendChild(li);
}

// ================================
// 🧹 LIMPAR TABELA (corrigido)
// ================================
function limparTabela(modo = "manual") {
    const tbody = document.getElementById('produtosTable').getElementsByTagName('tbody')[0];
    while (tbody.rows.length > 0) tbody.deleteRow(0);

    produtosAdicionados = {};

    if (modo === "manual") {
        // 🔹 Quando o usuário clica em "Limpar Tabela"
        carregarProdutos().then(() => {
            adicionarProduto(); // cria linha vazia já pronta para digitar
            mostrarMensagem("Tabela limpa. Pronta para digitar novos produtos.", "info");
        });
    } else if (modo === "importacao") {
        // 🔹 Quando a limpeza vem de importação
        mostrarMensagem("Tabela limpa para importar produtos.", "info");
    }
}



document.getElementById('limparTabela').addEventListener('click', () => {
    limparTabela("manual");
});

function validarEAN13(ean) {
    // Se a validação estiver desativada, sempre retorna true
    if (!ENV.VALIDAR_EAN13) return true;

    if (typeof ean !== 'string') return false;

    // Completa com zeros à esquerda
    while (ean.length < 13) ean = '0' + ean;

    // Verifica se tem exatamente 13 dígitos
    if (ean.length !== 13 || !/^\d{13}$/.test(ean)) return false;

    // Calcula o dígito verificador
    let soma = 0;
    for (let i = 0; i < 12; i++) {
        soma += (i % 2 === 0 ? 1 : 3) * parseInt(ean.charAt(i), 10);
    }
    const digitoVerificador = (10 - (soma % 10)) % 10;

    return digitoVerificador === parseInt(ean.charAt(12), 10);
}



// ================================
// 💬 MENSAGENS AO USUÁRIO
// ================================
let mensagemContainer = document.querySelector(".mensagem-container");
if (!mensagemContainer) {
    mensagemContainer = document.createElement("div");
    mensagemContainer.className = "mensagem-container";
    document.body.appendChild(mensagemContainer);
}

// function mostrarMensagem(mensagem, tipo) {
//     const novaMensagem = document.createElement("div");
//     novaMensagem.textContent = mensagem;
//     novaMensagem.className = `mensagem ${tipo} fade-in`; // Usa diretamente o tipo

//     // Adiciona a nova mensagem no contêiner
//     mensagemContainer.appendChild(novaMensagem);

//     // Remove a mensagem após 5 segundos
//     setTimeout(() => {
//         novaMensagem.classList.replace("fade-in", "fade-out");
//         novaMensagem.addEventListener("animationend", () => novaMensagem.remove());
//     }, 2500);
//     console.log(`[${tipo}] ${mensagem}`);
// }

function mostrarMensagem(mensagem, tipo = "info") {
    const msg = document.createElement("div");
    msg.textContent = mensagem;
    msg.className = `mensagem ${tipo}`;
    mensagemContainer.appendChild(msg);
    setTimeout(() => msg.remove(), 3000);
    console.log(`[${tipo}] ${mensagem}`);
}

// ================================
// ⌨️ ATALHOS
// ================================
document.addEventListener('keydown', e => {
    const key = e.key.toLowerCase();
    if (e.ctrlKey || e.metaKey) {
        if (key === 'g') {
            gerarEtiquetasButton?.click();
            e.preventDefault();
            mostrarMensagem("Gerando etiquetas...", "info");
        }
        if (key === 'p') {
            imprimirEtiquetasDireto();
            e.preventDefault();
            mostrarMensagem("Impressão direta acionada (Ctrl+P)", "info");
        }
    }
});

// Detecta se o navegador está em modo escuro ou claro
if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    console.log('O navegador está no modo escuro');
} else {
    console.log('O navegador está no modo claro');
}

window.addEventListener("DOMContentLoaded", async () => {
    await carregarProdutos();  // Carrega banco de produtos
    adicionarProduto();        // Cria 1 linha vazia para digitar EAN
});
