document.addEventListener("DOMContentLoaded", function () {
    const adicionarProdutoButton = document.getElementById('adicionarProduto');
    const gerarEtiquetasButton = document.getElementById('gerarEtiquetas');

    if (adicionarProdutoButton) {
        adicionarProdutoButton.addEventListener('click', adicionarProduto);
    }

    if (gerarEtiquetasButton) {
        gerarEtiquetasButton.addEventListener('click', gerarEtiquetas);
    }
});

document.addEventListener("DOMContentLoaded", function () {
    const toggleButton = document.getElementById('darkModeToggle');

    // Função para atualizar o ícone do botão
    const atualizarIconeDarkMode = () => {
        toggleButton.textContent = document.body.classList.contains('dark-mode') ? '🌞' : '🌙';
    };

    // Função para aplicar o tema
    const aplicarTema = (darkMode) => {
        document.body.classList.toggle('dark-mode', darkMode);
        atualizarIconeDarkMode();
        localStorage.setItem('darkMode', darkMode); // Salva a escolha do usuário
    };

    // Verifica a preferência armazenada no localStorage
    const userPrefersDark = localStorage.getItem('darkMode');

    if (userPrefersDark !== null) {
        // Se o usuário tiver uma preferência armazenada, aplica ela
        aplicarTema(userPrefersDark === 'true');
    } else {
        // Caso contrário, usa a preferência do sistema
        const userPrefersSystemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        aplicarTema(userPrefersSystemDark);
    }

    // Alterna entre os modos ao clicar no botão
    toggleButton.addEventListener('click', () => {
        const isDarkMode = !document.body.classList.contains('dark-mode'); // Inverte o estado atual
        aplicarTema(isDarkMode);
    });

    // Listener para mudanças na preferência de tema do sistema
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', event => {
        // Só muda o tema se o usuário não tiver definido uma preferência manual
        if (localStorage.getItem('darkMode') === null) {
            aplicarTema(event.matches);
        }
    });

    // Carrega os produtos e configura o modal
    const inicializar = () => {
        carregarProdutos();
        configurarModal();
    };

    inicializar();
});