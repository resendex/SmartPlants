// Define os IDs dos elementos de forma global para reuso
const inputId = "user-input";
const historyId = "chat-history";

/**
 * Processa o envio de uma nova mensagem do utilizador.
 */
function sendMessage() {
    const inputElement = document.getElementById(inputId);
    // Verificação de segurança adicional
    if (!inputElement) {
        console.error(`Erro: Elemento de input com ID '${inputId}' não encontrado.`);
        return;
    }
    
    const message = inputElement.value;

    // 1. Valida se a mensagem não está vazia
    if (message.trim() === '') {
        return;
    }

    // 2. Adiciona a mensagem do utilizador ao lugar
    document.getElementById("message user-message").style.display = 'block';
    document.getElementById("mensagemUser").textContent = message

    
    // 3. Limpa a caixa de input
    inputElement.value = '';
}

/**
 * Lida com o evento de tecla para enviar mensagem ao pressionar Enter.
 * @param {KeyboardEvent} event - O evento de teclado.
 */
function handleKeyPress(event) {
    if (event.key === 'Enter') {
        event.preventDefault(); // Previne o comportamento padrão (como recarregar a página)
        sendMessage();
    }
}

/* --- Lógica de Inicialização e Ligações de Eventos (Incluindo Sidebar) --- */
document.addEventListener('DOMContentLoaded', () => {
    
    // --- Lógica de Eventos do Chat ---
    const sendButton = document.getElementById('send-button');
    const inputField = document.getElementById(inputId);
    
    if (sendButton) {
        sendButton.addEventListener('click', sendMessage);
    } 

    if (inputField) {
        inputField.addEventListener('keypress', handleKeyPress); 
    }
});