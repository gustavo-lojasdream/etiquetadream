// config.js
window.ENV = {
  // 🔗 Fonte dos produtos
  PRODUTOS_CSV_URL: "https://docs.google.com/spreadsheets/d/1wO7TRDOSikvVZ2GCjXDSSqXpX8kbhNKXY_0P8jW7GMM/export?format=csv",
 
  // ⚙️ Validação
  VALIDAR_EAN13: false, // ✅ false = desativa verificação (aceita "LPCMTPT01PP")
 
  // 📦 Configurações de etiquetas
  POSICOES_X_QR: [-10, 277, 570],
  POSICOES_X_EAN: [45, 322, 595],

  // 📁 Nomes padrão de arquivos
  // NOME_ARQUIVO_ZPL: "etiqueta.zpl",
  NOME_ARQUIVO_TXT: "etiqueta.txt",

  // ⏱️ Tempo de exibição das mensagens
  MENSAGEM_TIMEOUT: 3000,

  // 🐞 Logar mensagens no console
  DEBUG: true,
};
