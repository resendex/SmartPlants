// Sistema de Mensagens - Smart Plants
// Carrega e exibe a conversa selecionada

// Define os IDs dos elementos de forma global para reuso
const inputId = "user-input";
const historyId = "chat-history";

// Dados da conversa atual
let currentConversation = null;

/**
 * Carrega os dados da conversa do localStorage
 */
function loadConversation() {
    const conversationData = localStorage.getItem('conversationData');
    
    if (!conversationData) {
        console.error('Nenhuma conversa selecionada!');
        // Redireciona de volta ao chat
        window.location.href = 'chat.html';
        return;
    }
    
    try {
        currentConversation = JSON.parse(conversationData);
        console.log('Conversa carregada:', currentConversation);
        
        // Atualiza o cabeçalho
        updateConversationHeader();
        
        // Carrega as mensagens
        loadMessages();
        
    } catch (error) {
        console.error('Erro ao carregar conversa:', error);
        window.location.href = 'chat.html';
    }
}

/**
 * Atualiza o cabeçalho da conversa com os dados do usuário
 */
function updateConversationHeader() {
    if (!currentConversation) return;
    
    const avatarElement = document.getElementById('conversationAvatar');
    const nameElement = document.getElementById('conversationUserName');
    const metaElement = document.getElementById('conversationMeta');
    
    if (avatarElement) {
        avatarElement.textContent = currentConversation.avatar;
    }
    
    if (nameElement) {
        nameElement.textContent = currentConversation.user;
    }
    
    if (metaElement) {
        metaElement.textContent = currentConversation.meta;
    }
}

/**
 * Carrega e exibe todas as mensagens da conversa
 */
function loadMessages() {
    if (!currentConversation || !currentConversation.messages) return;
    
    const chatHistory = document.getElementById(historyId);
    if (!chatHistory) return;
    
    // Limpa o histórico
    chatHistory.innerHTML = '';
    
    // Adiciona cada mensagem
    currentConversation.messages.forEach(message => {
        addMessageToHistory(message.text, message.sender === 'me', message.time);
    });
    
    // Faz scroll para o final
    chatHistory.scrollTop = chatHistory.scrollHeight;
}

/**
 * Adiciona uma mensagem ao histórico
 */
function addMessageToHistory(text, isUser, time = null) {
    const chatHistory = document.getElementById(historyId);
    if (!chatHistory) return;
    
    const messageDiv = document.createElement('div');
    messageDiv.className = isUser ? 'message user-message' : 'message assistant-message';
    
    const messageContent = document.createElement('div');
    messageContent.className = 'message-content';
    messageContent.textContent = text;
    
    if (time) {
        const timeSpan = document.createElement('span');
        timeSpan.className = 'message-time';
        timeSpan.textContent = time;
        messageContent.appendChild(timeSpan);
    }
    
    messageDiv.appendChild(messageContent);
    chatHistory.appendChild(messageDiv);
    
    // Scroll para o final
    chatHistory.scrollTop = chatHistory.scrollHeight;
}

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

    // 2. Adiciona a mensagem do utilizador ao histórico
    const now = new Date();
    const timeString = `${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}`;
    
    addMessageToHistory(message, true, timeString);
    
    // 3. Salva a mensagem na conversa
    if (currentConversation && currentConversation.messages) {
        currentConversation.messages.push({
            sender: 'me',
            text: message,
            time: timeString
        });
        localStorage.setItem('conversationData', JSON.stringify(currentConversation));
    }
    
    // 4. Limpa a caixa de input
    inputElement.value = '';
    
    // 5. Simula resposta do outro usuário (opcional)
    setTimeout(() => {
        const responses = [
            'Que interessante! 😊',
            'Obrigado pela informação!',
            'Vou tentar isso com as minhas plantas.',
            'Boa dica! 🌱',
            'Tens mais fotos do progresso?'
        ];
        const randomResponse = responses[Math.floor(Math.random() * responses.length)];
        
        addMessageToHistory(randomResponse, false, 'Agora');
        
        // Salva a resposta simulada
        if (currentConversation && currentConversation.messages) {
            currentConversation.messages.push({
                sender: currentConversation.user,
                text: randomResponse,
                time: 'Agora'
            });
            localStorage.setItem('conversationData', JSON.stringify(currentConversation));
        }
        
        // Adiciona notificação de nova mensagem recebida
        if (typeof window.notificarNovaMensagem === 'function' && currentConversation) {
            window.notificarNovaMensagem(currentConversation.user);
        }
    }, 1000);
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

/* --- Lógica de Inicialização e Ligações de Eventos --- */
document.addEventListener('DOMContentLoaded', () => {
    console.log('💬 Sistema de Mensagens carregado!');
    
    // Carrega a conversa do localStorage
    loadConversation();
    
    // --- Lógica de Eventos do Chat ---
    const sendButton = document.getElementById('send-button');
    const inputField = document.getElementById(inputId);
    
    if (sendButton) {
        sendButton.addEventListener('click', sendMessage);
    } 

    if (inputField) {
        inputField.addEventListener('keypress', handleKeyPress); 
        // Foca no campo de input
        inputField.focus();
    }
});