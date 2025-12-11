// Sistema de Mensagens - Smart Plants
// Carrega e exibe a conversa selecionada

// Define os IDs dos elementos de forma global para reuso
const inputId = "user-input";
const historyId = "chat-history";

/**
 * @typedef {Object} ConversationMessage
 * @property {string} sender
 * @property {string} text
 * @property {string} time
 */

/**
 * @typedef {Object} ConversationData
 * @property {string} user
 * @property {string} avatar
 * @property {string} meta
 * @property {ConversationMessage[]} messages
 */

/**
 * Referência do objeto window com suporte à função opcional de notificação global
 * @type {Window & typeof globalThis & { notificarNovaMensagem?: (contactName: string) => void }}
 */
const smartPlantsWindow = window;

// Dados da conversa atual
/** @type {ConversationData | null} */
let currentConversation = null;

/** @type {Object.<string, ConversationData>} */
let chatHistory = {};

/**
 * Carrega o histórico completo do chat (localStorage primeiro, depois arquivo)
 */
function loadChatHistory() {
    console.log('[mandamensagem.js] Carregando histórico do chat...');

    // Primeiro tenta carregar do localStorage (mensagens da sessão atual)
    try {
        const storedHistory = localStorage.getItem('chatHistory');
        if (storedHistory) {
            const parsedHistory = JSON.parse(storedHistory);
            if (Object.keys(parsedHistory).length > 0) {
                chatHistory = parsedHistory;
                console.log('[mandamensagem.js] Histórico carregado do localStorage:', Object.keys(chatHistory).length, 'conversas');
                return Promise.resolve(chatHistory);
            }
        }
    } catch (err) {
        console.warn('[mandamensagem.js] Erro ao carregar do localStorage:', err);
    }

    // Fallback: carrega do arquivo JSON
    return fetch('../chat_history.json')
        .then(response => response.json())
        .then(data => {
            chatHistory = data || {};
            console.log('[mandamensagem.js] Histórico carregado do arquivo JSON:', Object.keys(chatHistory).length, 'conversas');
            return chatHistory;
        })
        .catch(err => {
            console.error('[mandamensagem.js] Erro ao carregar histórico:', err);
            chatHistory = {};
            return {};
        });
}

/**
 * Salva o histórico completo do chat (usando localStorage como backup)
 */
function saveChatHistory() {
    console.log('[mandamensagem.js] Salvando histórico do chat no localStorage...');
    try {
        localStorage.setItem('chatHistory', JSON.stringify(chatHistory));
        console.log('[mandamensagem.js] Histórico salvo no localStorage');
    } catch (err) {
        console.error('[mandamensagem.js] Erro ao salvar histórico:', err);
    }
}

/**
 * Carrega os dados da conversa do histórico completo
 */
function loadConversation() {
    const urlParams = new URLSearchParams(window.location.search);
    const conversationId = urlParams.get('id') || localStorage.getItem('currentConversation');
    
    if (!conversationId) {
        console.error('Nenhuma conversa selecionada!');
        window.location.href = 'chat.html';
        return;
    }
    
    // Primeiro carrega o histórico completo
    loadChatHistory().then(() => {
        // Se a conversa existe no histórico, carrega dela
        if (chatHistory[conversationId]) {
            currentConversation = chatHistory[conversationId];
            console.log('Conversa carregada do histórico:', currentConversation);
        } else {
            // Se não existe, cria uma nova baseada nos dados simulados
            const conversationData = localStorage.getItem('conversationData');
            if (conversationData) {
                currentConversation = JSON.parse(conversationData);
                // Adiciona ao histórico
                if (currentConversation) {
                    chatHistory[conversationId] = currentConversation;
                    saveChatHistory();
                }
            } else {
                console.error('Nenhuma conversa encontrada!');
                window.location.href = 'chat.html';
                return;
            }
        }
        
        // Atualiza o cabeçalho
        updateConversationHeader();
        
        // Carrega as mensagens
        loadMessages();
    });
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
    currentConversation.messages.forEach(/** @param {ConversationMessage} message */ (message) => {
        addMessageToHistory(message.text, message.sender === 'me', message.time, false);
    });

    scrollHistoryToBottom('auto');
}

/**
 * Adiciona uma mensagem ao histórico
 * @param {string} text
 * @param {boolean} isUser
 * @param {string | null} [time]
 * @param {boolean} [smoothScroll=true]
 */
function addMessageToHistory(text, isUser, time = null, smoothScroll = true) {
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
    
    scrollHistoryToBottom(smoothScroll ? 'smooth' : 'auto');
}

/**
 * Faz scroll para o fim do histórico sem afetar o resto da página
 * @param {'auto' | 'smooth'} [behavior='smooth']
 */
function scrollHistoryToBottom(behavior = 'smooth') {
    const chatHistory = document.getElementById(historyId);
    if (!chatHistory) return;

    requestAnimationFrame(() => {
        chatHistory.scrollTo({
            top: chatHistory.scrollHeight,
            behavior
        });
    });
}

/**
 * Processa o envio de uma nova mensagem do utilizador.
 */
function sendMessage() {
    console.log('[mandamensagem.js] sendMessage chamado');
    const inputElement = /** @type {HTMLInputElement | null} */ (document.getElementById(inputId));
    
    // Verificação de segurança adicional
    if (!inputElement) {
        console.error(`Erro: Elemento de input com ID '${inputId}' não encontrado.`);
        return;
    }
    
    const message = inputElement.value;
    console.log('[mandamensagem.js] Mensagem a enviar:', message);

    // 1. Valida se a mensagem não está vazia
    if (message.trim() === '') {
        return;
    }

    // 2. Adiciona a mensagem do utilizador ao histórico
    const now = new Date();
    const timeString = `${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}`;
    
    addMessageToHistory(message, true, timeString, true);
    
    // 3. Salva a mensagem na conversa
    if (currentConversation && currentConversation.messages) {
        currentConversation.messages.push({
            sender: 'me',
            text: message,
            time: timeString
        });
        localStorage.setItem('conversationData', JSON.stringify(currentConversation));
        
        // Atualiza o histórico completo
        const conversationId = localStorage.getItem('currentConversation');
        if (conversationId) {
            chatHistory[conversationId] = currentConversation;
            saveChatHistory();
        }
    }
    
    // 4. Adicionar atividade recente (fallbacks)
    const callAddMessageActivity = () => {
        try {
            console.log('[mandamensagem.js] Tentando adicionar atividade de mensagem');
            if (typeof adicionarAtividadeMensagem === 'function') {
                // Tentar obter o nome do destinatário da conversa atual
                let recipientName = 'alguém';
                
                // Primeiro, tentar do localStorage currentConversationUser (mais confiável)
                const storedUserName = localStorage.getItem('currentConversationUser');
                if (storedUserName) {
                    recipientName = storedUserName;
                } else {
                    // Fallback: tentar do localStorage currentConversation
                    const conversationId = localStorage.getItem('currentConversation');
                    if (conversationId) {
                        // Tentar do window.ChatSmartPlants se disponível
                        if (window.ChatSmartPlants && window.ChatSmartPlants.conversationsData) {
                            const conversation = window.ChatSmartPlants.conversationsData.find(c => c.id == conversationId);
                            if (conversation) {
                                recipientName = conversation.user;
                            }
                        } else {
                            // Fallback: tentar do histórico do chat
                            try {
                                const chatHistory = JSON.parse(localStorage.getItem('chat_history') || '{}');
                                if (chatHistory[conversationId] && chatHistory[conversationId].user) {
                                    recipientName = chatHistory[conversationId].user;
                                }
                            } catch (e) {
                                console.log('[mandamensagem.js] Não conseguiu obter nome do histórico');
                            }
                        }
                    }
                }
                
                console.log('[mandamensagem.js] Nome do destinatário identificado:', recipientName);
                adicionarAtividadeMensagem(recipientName);
                return true;
            }
            if (window.SmartPlantsActivities && typeof window.SmartPlantsActivities.adicionar === 'function') {
                const recipientName = currentConversation ? currentConversation.user : 'alguém';
                console.log('[mandamensagem.js] Adicionando atividade com nome:', recipientName);
                window.SmartPlantsActivities.adicionar('message', `Enviou mensagem a <strong>${recipientName}</strong> às ${timeString}`);
                return true;
            }
            console.log('[mandamensagem.js] SmartPlantsActivities não encontrado');
        } catch (e) {
            console.error('[mandamensagem.js] Erro ao registar atividade de mensagem:', e);
        }
        return false;
    };
    if (!callAddMessageActivity()) {
        setTimeout(() => {
            if (!callAddMessageActivity()) {
                console.warn('[mandamensagem.js] Falha em registar atividade de mensagem após retry');
            } else {
                console.info('[mandamensagem.js] Atividade de mensagem registada após retry');
            }
        }, 300);
    }
    
    // 5. Limpa a caixa de input
    inputElement.value = '';
    
    // 6. Gera resposta automática baseada no conteúdo da mensagem
    console.log('[mandamensagem.js] Iniciando resposta automática imediatamente');
    const lowerMessage = message.toLowerCase();
    let autoResponse = '';

    // Respostas baseadas em palavras-chave (expandidas significativamente)
    if (lowerMessage.includes('olá') || lowerMessage.includes('oi') || lowerMessage.includes('bom dia') || lowerMessage.includes('boa tarde') || lowerMessage.includes('boa noite')) {
        const greetings = [
            'Olá! Como estão as suas plantas hoje? 🌱',
            'Oi! Que bom ver-te aqui! Como vai o teu jardim? 🌿',
            'Olá! Espero que as tuas plantas estejam felizes! 😊',
            'Oi! Pronto para falar sobre plantas? 🌸',
            'Olá! Como está o teu cantinho verde? 🌳'
        ];
        autoResponse = greetings[Math.floor(Math.random() * greetings.length)];
    } else if (lowerMessage.includes('planta') || lowerMessage.includes('plantas') || lowerMessage.includes('jardim') || lowerMessage.includes('horta')) {
        const plantQuestions = [
            'Que plantas tens no teu jardim? Adoro conversar sobre jardinagem! 🌿',
            'Conta-me sobre as tuas plantas favoritas! 🌸',
            'Tens muitas plantas? Eu tenho uma coleção bem variada! 🌱',
            'Que tipo de plantas gostas mais? Flores, árvores, ervas? 🌺',
            'Como começou o teu interesse por plantas? 📖'
        ];
        autoResponse = plantQuestions[Math.floor(Math.random() * plantQuestions.length)];
    } else if (lowerMessage.includes('rega') || lowerMessage.includes('regar') || lowerMessage.includes('água') || lowerMessage.includes('regar')) {
        const wateringTips = [
            'A rega é fundamental! Eu rego as minhas plantas 2-3 vezes por semana. 💧',
            'Não regues demais! O excesso de água pode afogar as raízes. ⚠️',
            'A melhor hora para regar é de manhã cedo. O sol evapora o excesso de água. ☀️',
            'Verifica sempre se o solo está seco antes de regar. 👆',
            'Plantas em vasos precisam de mais atenção na rega. 🪴'
        ];
        autoResponse = wateringTips[Math.floor(Math.random() * wateringTips.length)];
    } else if (lowerMessage.includes('sol') || lowerMessage.includes('luz') || lowerMessage.includes('iluminação')) {
        const lightTips = [
            'A luz solar é essencial para a fotossíntese! As minhas plantas adoram sol da manhã. ☀️',
            'Cada planta tem necessidades diferentes de luz. Algumas preferem sombra. 🌳',
            'Plantas de interior precisam de luz indireta, não sol direto. 🏠',
            'Se as folhas amarelecem, pode ser falta ou excesso de luz. 🤔',
            'O sol da tarde pode queimar as folhas mais delicadas. 🔥'
        ];
        autoResponse = lightTips[Math.floor(Math.random() * lightTips.length)];
    } else if (lowerMessage.includes('fertilizante') || lowerMessage.includes('adubo') || lowerMessage.includes('nutrientes')) {
        const fertilizerTips = [
            'Uso fertilizante orgânico nas minhas plantas. Funciona muito bem! 🌱',
            'Fertilizantes NPK são essenciais: Nitrogênio, Fósforo e Potássio. 🔬',
            'Não exageres no fertilizante! Menos é mais. ⚖️',
            'Fertilizantes líquidos são absorvidos mais rapidamente. 💧',
            'Plantas em crescimento precisam de mais nitrogênio. 📈'
        ];
        autoResponse = fertilizerTips[Math.floor(Math.random() * fertilizerTips.length)];
    } else if (lowerMessage.includes('foto') || lowerMessage.includes('fotos') || lowerMessage.includes('imagem')) {
        const photoResponses = [
            'Adoro ver fotos de plantas! Tens alguma para mostrar? 📸',
            'Mostra-me as tuas plantas! Quero ver como estão crescendo. 🌱',
            'Fotos ajudam muito a identificar problemas. 📷',
            'Tens fotos do antes e depois? Adoro ver evoluções! 📈',
            'Compartilha uma foto da tua planta favorita! 🌸'
        ];
        autoResponse = photoResponses[Math.floor(Math.random() * photoResponses.length)];
    } else if (lowerMessage.includes('problema') || lowerMessage.includes('doente') || lowerMessage.includes('seca') || lowerMessage.includes('murcha') || lowerMessage.includes('amarela')) {
        const problemHelp = [
            'Oh não! Que problema tem a tua planta? Posso tentar ajudar. 😟',
            'Folhas amarelas podem indicar vários problemas. Conta-me mais detalhes. 🤔',
            'Verifica se não está a receber água demais ou de menos. 💧',
            'Pode ser falta de nutrientes ou pragas. Mostra uma foto se puderes. 🐛',
            'Não te preocupes! Muitas plantas recuperam-se com os cuidados certos. 🌱'
        ];
        autoResponse = problemHelp[Math.floor(Math.random() * problemHelp.length)];
    } else if (lowerMessage.includes('dica') || lowerMessage.includes('conselho') || lowerMessage.includes('ajuda')) {
        const tips = [
            'Claro! Uma boa dica é manter o solo sempre húmido mas não encharcado. 💡',
            'Rega sempre na base da planta, nunca nas folhas. Evita fungos. 🍄',
            'Gira os vasos regularmente para que todos os lados recebam luz. 🔄',
            'Limpa as folhas com um pano húmido para remover poeira. 🧽',
            'Plantas de interior agradecem um pouco de humidade no ar. 💨'
        ];
        autoResponse = tips[Math.floor(Math.random() * tips.length)];
    } else if (lowerMessage.includes('obrigado') || lowerMessage.includes('thanks') || lowerMessage.includes('obg')) {
        const thanks = [
            'De nada! Sempre às ordens para falar sobre plantas. 😊',
            'Foi um prazer ajudar! Volta sempre que precisares. 🌱',
            'Espero ter sido útil! Cuida bem das tuas plantas. 💚',
            'Disponível sempre para dicas de jardinagem! 📞',
            'Obrigado tu também pela conversa! Até breve. 👋'
        ];
        autoResponse = thanks[Math.floor(Math.random() * thanks.length)];
    } else if (lowerMessage.includes('tchau') || lowerMessage.includes('adeus') || lowerMessage.includes('até logo')) {
        const goodbyes = [
            'Até à próxima! Cuida bem das tuas plantas. 👋',
            'Foi ótimo conversar contigo! Até breve. 🌸',
            'Adeus! Não esqueças de regar as plantas. 💧',
            'Até logo! Continua a cuidar bem do teu jardim. 🌳',
            'Tchau! Espero ver-te em breve com mais dicas. 📅'
        ];
        autoResponse = goodbyes[Math.floor(Math.random() * goodbyes.length)];
    } else if (lowerMessage.includes('clima') || lowerMessage.includes('tempo') || lowerMessage.includes('chuva')) {
        const weatherTalk = [
            'O clima afeta muito as plantas! Algumas adoram chuva. 🌧️',
            'Plantas mediterrânicas resistem bem à seca. 🇵🇹',
            'Verão é época de crescimento para muitas plantas. ☀️',
            'Inverno é tempo de descanso para algumas espécies. ❄️',
            'O vento forte pode danificar folhas delicadas. 🌬️'
        ];
        autoResponse = weatherTalk[Math.floor(Math.random() * weatherTalk.length)];
    } else if (lowerMessage.includes('vaso') || lowerMessage.includes('pote') || lowerMessage.includes('recipiente')) {
        const potTalk = [
            'Vasos de barro são melhores - permitem respiração das raízes. 🏺',
            'Drenagem é fundamental! Furos no fundo evitam água parada. 💧',
            'Muda de vaso quando as raízes saem pelos buracos. 📏',
            'Vasos maiores permitem mais crescimento. 📈',
            'Cerâmica mantém a humidade mais tempo que plástico. ⚖️'
        ];
        autoResponse = potTalk[Math.floor(Math.random() * potTalk.length)];
    } else if (lowerMessage.includes('pragas') || lowerMessage.includes('insetos') || lowerMessage.includes('bichos')) {
        const pestTalk = [
            'Pragas são um problema comum. Identifica qual inseto é primeiro. 🐛',
            'Sabão de Marseille diluído combate muitas pragas. 🧼',
            'Plantas fortes resistem melhor às pragas. 💪',
            'Isolamento de plantas doentes previne contágio. 🚫',
            'Predadores naturais como joaninhas ajudam no controlo. 🐞'
        ];
        autoResponse = pestTalk[Math.floor(Math.random() * pestTalk.length)];
    } else if (lowerMessage.includes('sementes') || lowerMessage.includes('semente') || lowerMessage.includes('plantar')) {
        const seedTalk = [
            'Plantar sementes é mágico! Cada uma é um potencial jardim. 🌱',
            'Sementes precisam de calor e humidade para germinar. 🌡️',
            'Nem todas as sementes germinam ao mesmo tempo. ⏰',
            'Rotulagem é importante para não te esqueceres do que plantaste. 🏷️',
            'Sementes biológicas são melhores para o ambiente. 🌍'
        ];
        autoResponse = seedTalk[Math.floor(Math.random() * seedTalk.length)];
    } else {
        // Resposta genérica expandida se não encontrar palavra-chave
        const genericResponses = [
            'Interessante! Conta-me mais sobre isso. 🌱',
            'Que bom! Eu também gosto muito de plantas. 💚',
            'Obrigado por partilhar! Tens mais dicas? 📖',
            'Parece que sabes muito sobre jardinagem! 👏',
            'Vamos trocar mais experiências sobre plantas? 🤝',
            'Isso é fascinante! Como começaste com plantas? 🌿',
            'Adoro conversar sobre jardinagem! 🌸',
            'Cada planta tem a sua própria personalidade. 🌺',
            'O mundo das plantas é infinito! 📚',
            'Tens alguma planta que dá frutos? 🍎',
            'Plantas de interior purificam o ar. 🏠',
            'A paciência é fundamental na jardinagem. ⏳',
            'Cada estação traz mudanças nas plantas. 🍂',
            'Tens plantas aromáticas na cozinha? 🌿',
            'A jardinagem relaxa muito! 😌'
        ];
        autoResponse = genericResponses[Math.floor(Math.random() * genericResponses.length)];
    }
    
    console.log('[mandamensagem.js] Resposta automática gerada:', autoResponse);
    const responseTime = new Date().toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' });
    addMessageToHistory(autoResponse, false, responseTime, true);
    
    // Salva a resposta automática
    if (currentConversation && currentConversation.messages) {
        currentConversation.messages.push({
            sender: currentConversation.user,
            text: autoResponse,
            time: responseTime
        });
        localStorage.setItem('conversationData', JSON.stringify(currentConversation));
        
        // Atualiza o histórico completo
        const conversationId = localStorage.getItem('currentConversation');
        if (conversationId) {
            chatHistory[conversationId] = currentConversation;
            saveChatHistory();
        }
    }
    
    // Adiciona notificação de nova mensagem recebida (apenas se não estiver visualizando a conversa)
    if (currentConversation) {
        // Verifica se estamos na página de conversa específica
        const currentConversationId = localStorage.getItem('currentConversation');
        const isViewingCurrentConversation = window.location.pathname.includes('mensagemExemplo.html') && 
            currentConversationId && chatHistory[currentConversationId];
        
        // Só notifica se não estiver visualizando a conversa atual
        if (!isViewingCurrentConversation) {
            smartPlantsWindow.notificarNovaMensagem?.(currentConversation.user);
        }
    }
    
    // Atualiza a interface do chat (se estiver na página chat.html)
    if (window.ChatSmartPlants && typeof window.ChatSmartPlants.updateConversationCards === 'function') {
        console.log('[mandamensagem.js] Atualizando interface do chat...');
        // Recarrega o histórico primeiro
        loadChatHistory().then(() => {
            // Atualiza os dados das conversas
            if (window.ChatSmartPlants.conversationsData) {
                // Mescla dados reais com simulados
                const mergedConversations = window.ChatSmartPlants.conversationsData.map(simulated => {
                    const realConversation = chatHistory[simulated.id];
                    if (realConversation && realConversation.messages && realConversation.messages.length > 0) {
                        const lastMessage = realConversation.messages[realConversation.messages.length - 1];
                        return {
                            ...simulated,
                            ...realConversation,
                            messages: realConversation.messages,
                            lastMessage: lastMessage.text,
                            time: lastMessage.time,
                            unread: realConversation.unread || 0
                        };
                    }
                    return simulated;
                });

                // Adiciona conversas reais que não existem nos dados simulados
                Object.keys(chatHistory).forEach(id => {
                    if (!mergedConversations.find(c => c.id == id)) {
                        const realConv = chatHistory[id];
                        if (realConv.messages && realConv.messages.length > 0) {
                            const lastMessage = realConv.messages[realConv.messages.length - 1];
                            mergedConversations.push({
                                ...realConv,
                                lastMessage: lastMessage.text,
                                time: lastMessage.time
                            });
                        }
                    }
                });

                window.ChatSmartPlants.conversationsData = mergedConversations;
                console.log('[mandamensagem.js] Conversas mescladas:', mergedConversations.map(c => `${c.id} (${c.user}): ${c.time}`));
            }

            // Atualiza a interface
            window.ChatSmartPlants.updateConversationCards();
            setTimeout(() => {
                window.ChatSmartPlants.applyConversationFilters();
            }, 100);
        });
    }
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
    
    // --- Sistema de Mensagens Automáticas Periódicas ---
    startPeriodicMessages();

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

/**
 * Inicia o sistema de mensagens automáticas periódicas
 */
function startPeriodicMessages() {
    console.log('[mandamensagem.js] Iniciando sistema de mensagens automáticas...');

    // Envia primeira mensagem após 5 minutos para dar tempo ao usuário se ambientar
    setTimeout(() => {
        sendRandomAutomatedMessage();
    }, 5 * 60 * 1000); // 5 minutos

    // Depois envia mensagens de hora em hora
    setInterval(() => {
        sendRandomAutomatedMessage();
    }, 60 * 60 * 1000); // 1 hora
}

/**
 * Envia uma mensagem automatizada aleatória para uma conversa aleatória
 */
function sendRandomAutomatedMessage() {
    console.log('[mandamensagem.js] Verificando se deve enviar mensagem automática...');

    // Só envia se o usuário não estiver ativo (não está na página de chat)
    if (document.hidden || !chatHistory || Object.keys(chatHistory).length === 0) {
        console.log('[mandamensagem.js] Usuário não ativo ou sem conversas - pulando mensagem automática');
        return;
    }

    // Seleciona uma conversa aleatória que tenha mensagens
    const activeConversations = Object.entries(chatHistory).filter(([id, conv]) =>
        conv.messages && conv.messages.length > 0
    );

    if (activeConversations.length === 0) {
        console.log('[mandamensagem.js] Nenhuma conversa ativa encontrada');
        return;
    }

    // Escolhe uma conversa aleatória
    const randomIndex = Math.floor(Math.random() * activeConversations.length);
    const [conversationId, conversation] = activeConversations[randomIndex];

    // Verifica se estamos visualizando esta conversa atualmente
    const currentConversationId = localStorage.getItem('currentConversation');
    const isViewingCurrentConversation = window.location.pathname.includes('mensagemExemplo.html') &&
        currentConversationId === conversationId;

    if (isViewingCurrentConversation) {
        console.log('[mandamensagem.js] Usuário está visualizando esta conversa - pulando notificação');
        return;
    }

    // Gera uma mensagem automática aleatória
    const automatedMessage = generateRandomAutomatedMessage();

    // Adiciona a mensagem à conversa
    const messageTime = new Date().toLocaleTimeString('pt-PT', {
        hour: '2-digit',
        minute: '2-digit'
    });

    if (!conversation.messages) {
        conversation.messages = [];
    }

    conversation.messages.push({
        sender: conversation.user,
        text: automatedMessage,
        time: messageTime
    });

    // Salva no histórico
    chatHistory[conversationId] = conversation;
    saveChatHistory();

    // Dispara notificação
    smartPlantsWindow.notificarNovaMensagem?.(conversation.user);

    // Atualiza interface se estiver na página de chat
    if (window.ChatSmartPlants && typeof window.ChatSmartPlants.updateConversationCards === 'function') {
        loadChatHistory().then(() => {
            if (window.ChatSmartPlants.conversationsData) {
                const mergedConversations = window.ChatSmartPlants.conversationsData.map(simulated => {
                    const realConversation = chatHistory[simulated.id];
                    if (realConversation && realConversation.messages && realConversation.messages.length > 0) {
                        const lastMessage = realConversation.messages[realConversation.messages.length - 1];
                        return {
                            ...simulated,
                            time: lastMessage.time,
                            message: lastMessage.text.length > 50 ? lastMessage.text.substring(0, 50) + '...' : lastMessage.text,
                            unread: (realConversation.unread || 0) + 1
                        };
                    }
                    return simulated;
                });

                const existingIds = mergedConversations.map(c => c.id);
                Object.entries(chatHistory).forEach(([id, conv]) => {
                    if (!existingIds.includes(id) && conv.messages && conv.messages.length > 0) {
                        const lastMessage = conv.messages[conv.messages.length - 1];
                        mergedConversations.push({
                            id: id,
                            user: conv.user,
                            avatar: conv.avatar || '🌱',
                            meta: conv.meta || '',
                            time: lastMessage.time,
                            message: lastMessage.text.length > 50 ? lastMessage.text.substring(0, 50) + '...' : lastMessage.text,
                            unread: 1
                        });
                    }
                });

                window.ChatSmartPlants.conversationsData = mergedConversations;
                window.ChatSmartPlants.updateConversationCards();
                setTimeout(() => {
                    window.ChatSmartPlants.applyConversationFilters();
                }, 100);
            }
        });
    }

    console.log(`[mandamensagem.js] Mensagem automática enviada para ${conversation.user}: "${automatedMessage}"`);
}

/**
 * Gera uma mensagem automatizada aleatória
 */
function generateRandomAutomatedMessage() {
    const automatedMessages = [
        // Mensagens sobre plantas
        "Olá! Vi que tens plantas lindas. Como estão hoje? 🌱",
        "Que bom ver-te aqui! As tuas plantas devem estar crescendo bem. 📈",
        "Olá! Tenho uma dúvida sobre plantas de interior. Alguma sugestão? 🏠",
        "Oi! Acabei de regar as minhas plantas. E tu, já regaste hoje? 💧",
        "Olá! Que plantas recomendas para iniciantes? 🌿",
        "Oi! As minhas plantas estão com folhas novas! Que alegria! 🌸",
        "Olá! Já experimentaste plantar ervas aromáticas? Cheiram tão bem! 🌿",
        "Oi! Que tipo de solo usas para as tuas plantas? 👆",
        "Olá! Tens plantas que florescem nesta época? 🌺",
        "Oi! Como combateste as pragas nas tuas plantas? 🐛",

        // Mensagens sobre cuidados
        "Olá! Qual é a tua rotina de cuidados com plantas? 📅",
        "Oi! Já fertilizaste as plantas este mês? 🌱",
        "Olá! Como sabes quando as plantas precisam de água? 💧",
        "Oi! Tens algum truque para plantas saudáveis? 💡",
        "Olá! Como organizas o teu espaço de jardinagem? 🏡",

        // Mensagens sobre experiências
        "Oi! Qual foi a primeira planta que cultivaste? 🌱",
        "Olá! Já alguma vez salvaste uma planta quase morta? 💚",
        "Oi! Tens plantas que dão frutos ou legumes? 🍎",
        "Olá! Como começaste a tua jornada com plantas? 📖",
        "Oi! Qual é a planta mais difícil que já cultivaste? 🌵",

        // Mensagens sobre dicas
        "Olá! Tens alguma dica para plantas de sombra? 🌳",
        "Oi! Como manténs as plantas hidratadas no verão? ☀️",
        "Olá! Que fazes quando as folhas ficam amarelas? 🤔",
        "Oi! Como prevines pragas nas plantas? 🛡️",
        "Olá! Tens dicas para multiplicar plantas? 🌱",

        // Mensagens casuais
        "Oi! O tempo hoje está perfeito para cuidar do jardim! 🌤️",
        "Olá! Que bom fim de semana para as plantas! 🌸",
        "Oi! As minhas plantas parecem mais felizes hoje! 😊",
        "Olá! Nada como um bom dia de jardinagem! 🌿",
        "Oi! As plantas tornam tudo mais bonito! 🌺",

        // Mensagens sobre comunidade
        "Olá! Já participaste de algum grupo de jardinagem? 👥",
        "Oi! Adoro trocar experiências sobre plantas! 🤝",
        "Olá! Tens amigos que também gostam de plantas? 👫",
        "Oi! Que bom ter alguém para falar sobre jardinagem! 💬",
        "Olá! Vamos partilhar mais dicas de plantas? 📚"
    ];

    return automatedMessages[Math.floor(Math.random() * automatedMessages.length)];
}