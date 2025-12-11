// @ts-nocheck
// Chat Interativo - Smart Plants

// Dados simulados de conversas (em produção viriam de um servidor)
const conversationsData = [
    {
        id: 1,
        user: 'PedroFlores328',
        avatar: '🌸',
        lastMessage: 'Olá, como está a tulipa?',
        time: '10:30',
        unread: 3,
        meta: '💦 Regou 3 vezes esta semana',
        messages: [
            { sender: 'PedroFlores328', text: 'Olá! Vi que tens uma tulipa também.', time: '10:15' },
            { sender: 'me', text: 'Sim! Plantei há 2 meses.', time: '10:20' },
            { sender: 'PedroFlores328', text: 'Como está a crescer?', time: '10:25' },
            { sender: 'PedroFlores328', text: 'Olá, como está a tulipa?', time: '10:30' }
        ]
    },
    {
        id: 2,
        user: 'MariaVerde',
        avatar: '🌿',
        lastMessage: 'Obrigada pelas dicas da samambaia! 🌱',
        time: 'Ontem',
        unread: 0,
        meta: '🌱 12 plantas',
        messages: [
            { sender: 'MariaVerde', text: 'Olá! Tens dicas para samambaias?', time: 'Ontem 14:00' },
            { sender: 'me', text: 'Claro! Mantém o solo sempre húmido.', time: 'Ontem 14:05' },
            { sender: 'MariaVerde', text: 'Obrigada pelas dicas da samambaia! 🌱', time: 'Ontem 14:10' }
        ]
    },
    {
        id: 3,
        user: 'CactoLover',
        avatar: '🌵',
        lastMessage: 'Vi o progresso da tua suculenta, está linda!',
        time: 'Ontem',
        unread: 0,
        meta: '🏆 Especialista em Cactos',
        messages: [
            { sender: 'CactoLover', text: 'Adorei as fotos das tuas suculentas!', time: 'Ontem 16:30' },
            { sender: 'me', text: 'Obrigado! 😊', time: 'Ontem 16:35' },
            { sender: 'CactoLover', text: 'Vi o progresso da tua suculenta, está linda!', time: 'Ontem 16:40' }
        ]
    },
    {
        id: 4,
        user: 'OrquideasPT',
        avatar: '🌺',
        lastMessage: 'Tens fotos novas da orquídea?',
        time: '2 dias',
        unread: 0,
        meta: '📸 Compartilhou 8 fotos',
        messages: [
            { sender: 'OrquideasPT', text: 'Olá! Como vão as orquídeas?', time: '2 dias 10:00' },
            { sender: 'me', text: 'Vão bem! Uma floresceu hoje.', time: '2 dias 10:30' },
            { sender: 'OrquideasPT', text: 'Tens fotos novas da orquídea?', time: '2 dias 11:00' }
        ]
    },
    {
        id: 5,
        user: 'JardimUrbano',
        avatar: '🪴',
        lastMessage: 'Vamos trocar mudas? 😊',
        time: '3 dias',
        unread: 0,
        meta: '📍 Lisboa',
        messages: [
            { sender: 'JardimUrbano', text: 'Olá! Também és de Lisboa?', time: '3 dias 15:00' },
            { sender: 'me', text: 'Sim! 😊', time: '3 dias 15:15' },
            { sender: 'JardimUrbano', text: 'Vamos trocar mudas? 😊', time: '3 dias 15:30' }
        ]
    },
    {
        id: 6,
        user: 'SunflowerFan',
        avatar: '🌻',
        lastMessage: 'Os girassóis estão a crescer bem!',
        time: '1 semana',
        unread: 0,
        meta: '☀️ Plantas de exterior',
        messages: [
            { sender: 'SunflowerFan', text: 'Plantei girassóis no jardim!', time: '1 semana 12:00' },
            { sender: 'me', text: 'Que bom! Precisam de muito sol.', time: '1 semana 12:30' },
            { sender: 'SunflowerFan', text: 'Os girassóis estão a crescer bem!', time: '1 semana 13:00' }
        ]
    }
];

let currentChatMediaFilter = 'all';
let currentSearchTerm = '';

// Função para buscar conversas
function searchConversations() {
    const searchInput = document.getElementById('searchInput');
    if (!searchInput) return;

    currentSearchTerm = searchInput.value.toLowerCase();
    applyConversationFilters();
}

function applyConversationFilters() {
    const list = document.querySelector('.conversations-list');
    if (!list) return;

    const cards = Array.from(list.querySelectorAll('.conversation-card'));
    if (!cards.length) return;

    // Sempre ordenar por mais recentes primeiro
    const sortedCards = cards.slice().sort((a, b) => {
        const aTime = Date.parse(a.dataset.timestamp || '') || 0;
        const bTime = Date.parse(b.dataset.timestamp || '') || 0;
        return bTime - aTime; // Sempre mais recentes primeiro
    });

    console.log('Cards ordenados:', sortedCards.map(card => ({
        id: card.dataset.conversationId,
        timestamp: card.dataset.timestamp,
        user: card.querySelector('.conversation-name')?.textContent,
        time: card.querySelector('.conversation-time')?.textContent
    })));

    // Limpar a lista e readicionar na ordem correta
    list.innerHTML = '';
    sortedCards.forEach(card => {
        // Remover destaque anterior
        card.classList.remove('most-recent');
        list.appendChild(card);
    });

    // Destacar a conversa mais recente (primeira da lista)
    if (sortedCards.length > 0) {
        sortedCards[0].classList.add('most-recent');
        console.log('Conversa mais recente destacada:', sortedCards[0].dataset.conversationId);
    }

    sortedCards.forEach(card => {
        const hasPhotos = card.dataset.hasPhotos === 'true';
        const matchesMedia =
            currentChatMediaFilter === 'all' ||
            (currentChatMediaFilter === 'with-photos' && hasPhotos) ||
            (currentChatMediaFilter === 'without-photos' && !hasPhotos);

        const name = card.querySelector('.conversation-name')?.textContent.toLowerCase() || '';
        const message = card.querySelector('.last-message')?.textContent.toLowerCase() || '';
        const matchesSearch =
            !currentSearchTerm ||
            name.includes(currentSearchTerm) ||
            message.includes(currentSearchTerm);

        card.style.display = matchesMedia && matchesSearch ? 'flex' : 'none';
    });
}

function setupChatToolbar() {
    const mediaSelect = document.getElementById('chatMediaFilter');

    if (mediaSelect) {
        mediaSelect.addEventListener('change', (event) => {
            currentChatMediaFilter = event.target.value;
            applyConversationFilters();
        });
    }
}

// Função para abrir conversa específica
function openConversation(conversationId) {
    // Salva o ID da conversa atual
    localStorage.setItem('currentConversation', conversationId);
    
    // Busca os dados da conversa nos dados mesclados
    const conversation = window.ChatSmartPlants.conversationsData.find(c => c.id == conversationId);
    
    if (conversation) {
        // Salva o nome do usuário também
        localStorage.setItem('currentConversationUser', conversation.user);
        
        // Salva as mensagens para a página de mensagens
        localStorage.setItem('conversationData', JSON.stringify(conversation));
        
        // Redireciona para a página de mensagens
        window.location.href = 'mensagemExemplo.html';
    }
}

// Função para configurar os cards de conversa
function setupConversationCards() {
    const conversationCards = document.querySelectorAll('.conversation-card');
    
    conversationCards.forEach((card) => {
        const conversationId = parseInt(card.getAttribute('data-conversation-id'), 10);
        if (!conversationId) return;

        card.addEventListener('click', (e) => {
            e.preventDefault();
            openConversation(conversationId);
        });
    });
}

// Função para atualizar a exibição dos cards das conversas
function updateConversationCards() {
    const conversationCards = document.querySelectorAll('.conversation-card');
    
    conversationCards.forEach((card, index) => {
        const conversationId = parseInt(card.getAttribute('data-conversation-id'), 10);
        if (!conversationId) return;
        
        const conversation = window.ChatSmartPlants.conversationsData.find(c => c.id == conversationId);
        if (!conversation) {
            console.log(`[chat.js] Conversa ${conversationId} não encontrada nos dados`);
            return;
        }
        
        // Atualiza a última mensagem
        const lastMessageElement = card.querySelector('.last-message');
        if (lastMessageElement) {
            lastMessageElement.textContent = conversation.lastMessage || 'Sem mensagens';
        }
        
        // Atualiza o horário
        const timeElement = card.querySelector('.conversation-time');
        if (timeElement) {
            timeElement.textContent = conversation.time || '';
        }
        
        // Atualiza o timestamp do card para ordenação
        if (conversation.time) {
            // Converte o tempo relativo para timestamp absoluto
            const now = new Date();
            let timestamp;

            if (conversation.time === 'Agora') {
                timestamp = now.toISOString();
                console.log(`[chat.js] Conversa ${conversationId} (${conversation.user}): "Agora" -> ${timestamp}`);
            } else if (conversation.time.includes('Ontem')) {
                const yesterday = new Date(now);
                yesterday.setDate(yesterday.getDate() - 1);
                timestamp = yesterday.toISOString();
                console.log(`[chat.js] Conversa ${conversationId} (${conversation.user}): "Ontem" -> ${timestamp}`);
            } else if (conversation.time.includes('dias')) {
                const daysAgo = parseInt(conversation.time.split(' ')[0]);
                const pastDate = new Date(now);
                pastDate.setDate(pastDate.getDate() - daysAgo);
                timestamp = pastDate.toISOString();
                console.log(`[chat.js] Conversa ${conversationId} (${conversation.user}): "${conversation.time}" -> ${timestamp}`);
            } else {
                // Para horários como "10:30", assume hoje
                const [hours, minutes] = conversation.time.split(':');
                const today = new Date(now);
                today.setHours(parseInt(hours), parseInt(minutes), 0, 0);
                timestamp = today.toISOString();
                console.log(`[chat.js] Conversa ${conversationId} (${conversation.user}): "${conversation.time}" -> ${timestamp}`);
            }

            card.setAttribute('data-timestamp', timestamp);
        } else {
            console.log(`[chat.js] Conversa ${conversationId} (${conversation.user}): sem tempo definido`);
        }
        
        // Atualiza contador de não lidas
        const unreadBadge = card.querySelector('.unread-badge');
        if (conversation.unread > 0) {
            if (!unreadBadge) {
                const badge = document.createElement('span');
                badge.className = 'unread-badge';
                badge.textContent = conversation.unread;
                card.appendChild(badge);
            } else {
                unreadBadge.textContent = conversation.unread;
            }
        } else if (unreadBadge) {
            unreadBadge.remove();
        }
    });
}

// Função para adicionar animação ao FAB
function setupFAB() {
    const fabButton = document.querySelector('.fab-button');
    
    if (fabButton) {
        fabButton.addEventListener('click', () => {
            // Mostra notificação
            showNotification('Funcionalidade de nova conversa em desenvolvimento! 💬');
        });
    }
}

// Função para mostrar notificação
function showNotification(message) {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 1em 1.5em;
        border-radius: 0.8em;
        box-shadow: 0 0.5em 2em rgba(0, 0, 0, 0.3);
        z-index: 1000;
        animation: slideIn 0.5s ease;
        font-weight: 600;
        max-width: 300px;
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.5s ease';
        setTimeout(() => notification.remove(), 500);
    }, 3000);
}

// Função para integrar com plantas do localStorage
function integrateWithPlants() {
    const plants = JSON.parse(localStorage.getItem('myPlants') || '[]');
    
    if (plants.length > 0) {
        console.log(`💬 Chat integrado com ${plants.length} plantas`);
        
        // Pode adicionar lógica para sugerir conversas baseadas nas plantas
        // Por exemplo, conectar com pessoas que têm plantas similares
    }
}

// Adiciona CSS para animações
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// Inicializa quando a página carregar
document.addEventListener('DOMContentLoaded', () => {
    console.log('💬 Chat do Smart Plants inicializado!');
    
    // Carrega o histórico do chat primeiro
    loadChatHistoryForChat().then(updatedConversations => {
        // Atualiza os dados das conversas com o histórico
        window.ChatSmartPlants.conversationsData = updatedConversations;
        
        // Pequeno delay para garantir que os elementos HTML estão prontos
        setTimeout(() => {
            // Atualiza a exibição dos cards
            updateConversationCards();
            
            // Aguardar um pouco mais para garantir que os timestamps foram atualizados
            setTimeout(() => {
                applyConversationFilters();
            }, 100);
        }, 100);
        
        // Configura pesquisa
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('input', searchConversations);
        }
        
        // Configura botão de pesquisa
        const searchBtn = document.querySelector('.search-btn');
        if (searchBtn) {
            searchBtn.addEventListener('click', searchConversations);
        }

        // Configura barra de ferramentas
        setupChatToolbar();
        
        // Configura cards de conversa
        setupConversationCards();
        
        // Configura FAB
        setupFAB();
        
        // Integra com sistema de plantas
        integrateWithPlants();
        
        // Atualiza a lista de conversas periodicamente e quando a página ganha foco
        setInterval(() => {
            loadChatHistoryForChat().then(updatedConversations => {
                window.ChatSmartPlants.conversationsData = updatedConversations;
                updateConversationCards();
                setTimeout(() => {
                    applyConversationFilters();
                }, 100);
            });
        }, 3000); // Atualiza a cada 3 segundos
        
        // Também atualiza quando a página ganha foco (usuário volta para a aba)
        window.addEventListener('focus', () => {
            console.log('[chat.js] Página ganhou foco, atualizando conversas...');
            loadChatHistoryForChat().then(updatedConversations => {
                window.ChatSmartPlants.conversationsData = updatedConversations;
                updateConversationCards();
                setTimeout(() => {
                    applyConversationFilters();
                }, 100);
            });
        });
    }).catch(err => {
        console.error('Erro ao carregar histórico do chat:', err);
        // Fallback para dados simulados
        window.ChatSmartPlants.conversationsData = conversationsData;
        
        // Mesmo código de inicialização
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('input', searchConversations);
        }
        
        const searchBtn = document.querySelector('.search-btn');
        if (searchBtn) {
            searchBtn.addEventListener('click', searchConversations);
        }

        setupChatToolbar();
        applyConversationFilters();
        setupConversationCards();
        setupFAB();
        integrateWithPlants();
    });
});

// Exporta funções para uso global
window.ChatSmartPlants = {
    openConversation,
    searchConversations,
    showNotification,
    conversationsData,
    updateConversationCards,
    applyConversationFilters
};

/**
 * Carrega o histórico completo do chat do servidor e mescla com dados simulados
 */
function loadChatHistoryForChat() {
    console.log('[chat.js] Carregando histórico do chat...');

    // Primeiro tenta carregar do localStorage (mensagens da sessão atual)
    try {
        const storedHistory = localStorage.getItem('chatHistory');
        if (storedHistory) {
            const parsedHistory = JSON.parse(storedHistory);
            if (Object.keys(parsedHistory).length > 0) {
                console.log('[chat.js] Histórico carregado do localStorage:', Object.keys(parsedHistory).length, 'conversas');

                // Mescla com dados simulados, dando prioridade aos dados reais
                const mergedConversations = conversationsData.map(simulated => {
                    const realConversation = parsedHistory[simulated.id];
                    if (realConversation && realConversation.messages && realConversation.messages.length > 0) {
                        // Usa dados reais com última mensagem atualizada
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
                Object.keys(parsedHistory).forEach(id => {
                    if (!mergedConversations.find(c => c.id == id)) {
                        const realConv = parsedHistory[id];
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

                console.log('[chat.js] Conversas mescladas:', mergedConversations.length);
                return Promise.resolve(mergedConversations);
            }
        }
    } catch (err) {
        console.warn('[chat.js] Erro ao carregar do localStorage:', err);
    }

    // Fallback: tenta carregar do servidor
    return fetch('http://localhost:8080/chat_history')
        .then(response => response.json())
        .then(data => {
            console.log('[chat.js] Histórico carregado do servidor:', Object.keys(data).length, 'conversas');

            // Mescla com dados simulados, dando prioridade aos dados reais
            const mergedConversations = conversationsData.map(simulated => {
                const realConversation = data[simulated.id];
                if (realConversation && realConversation.messages && realConversation.messages.length > 0) {
                    // Usa dados reais com última mensagem atualizada
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
            Object.keys(data).forEach(id => {
                if (!mergedConversations.find(c => c.id == id)) {
                    const realConv = data[id];
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

            console.log('[chat.js] Conversas mescladas:', mergedConversations.length);
            return mergedConversations;
        })
        .catch(err => {
            console.error('[chat.js] Erro ao carregar histórico:', err);
            return conversationsData;
        });
}
