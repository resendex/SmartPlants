// Sistema de Simulação de Mensagens de Usuários
// Este arquivo simula mensagens de outros usuários para tornar o chat mais dinâmico

/**
 * Usuários simulados que podem enviar mensagens
 */
const simulatedUsers = [
    {
        id: 'user_orquidea',
        name: 'OrquideaLover',
        avatar: '🌸',
        meta: '🌺 Apaixonada por Orquídeas',
        interests: ['orquídeas', 'flores', 'interior'],
        messageTemplates: [
            "Olá! Vi as tuas orquídeas lindas! Como as manténs tão saudáveis? 🌸",
            "Que orquídea bonita! Qual é a espécie? 🤔",
            "As minhas orquídeas estão florescendo! E as tuas? 🌺",
            "Dica: Orquídeas gostam de luz indireta. Já experimentaste? ☀️",
            "Tens alguma orquídea que recomendas para iniciantes? 🌱"
        ]
    },
    {
        id: 'user_suculentas',
        name: 'SuculentaKing',
        avatar: '🌵',
        meta: '🌵 Especialista em Suculentas',
        interests: ['suculentas', 'cactos', 'seca'],
        messageTemplates: [
            "Ei! Suculentas são incríveis, não precisam de muita água! 💧",
            "Que suculenta linda! Eu tenho uma coleção enorme. 🌵",
            "Dica: Suculentas gostam de sol direto pela manhã. ☀️",
            "Já plantaste suculentas em jardim? Cresce que é uma beleza! 🌱",
            "Como manténs as tuas suculentas tão bonitas? 🤩"
        ]
    },
    {
        id: 'user_ervas',
        name: 'ErvasChef',
        avatar: '🌿',
        meta: '👨‍🍳 Cozinheiro & Jardineiro',
        interests: ['ervas', 'cozinha', 'culinária'],
        messageTemplates: [
            "Olá! Uso ervas frescas na cozinha. Tens manjericão? 🌿",
            "Que cheiro bom! Ervas aromáticas são perfeitas. 👃",
            "Dica: Rega ervas de manhã para não molhar as folhas. 💧",
            "Já fizeste pesto com manjericão caseiro? Delicioso! 🥬",
            "Tens alguma erva que dá bem em vaso? 🏺"
        ]
    },
    {
        id: 'user_frutas',
        name: 'FrutaViva',
        avatar: '🍎',
        meta: '🍓 Cultivo frutas orgânicas',
        interests: ['frutas', 'árvores', 'orgânico'],
        messageTemplates: [
            "Oi! Tenho árvores de fruto no quintal. Já provaste maçã caseira? 🍎",
            "Frutas orgânicas são muito melhores! 🌱",
            "Que árvore de fruto tens? Eu tenho pereira e macieira. 🌳",
            "Dica: Poda as árvores de fruto no inverno. ✂️",
            "Já fizeste compota de frutas caseiras? Deliciosa! 🍯"
        ]
    },
    {
        id: 'user_iniciante',
        name: 'PlantaNova',
        avatar: '🌱',
        meta: '🌱 Iniciante em Jardinagem',
        interests: ['iniciante', 'dicas', 'ajuda'],
        messageTemplates: [
            "Olá! Sou novo nisto das plantas. Alguma dica para iniciantes? 🤔",
            "Que planta recomendam para quem está a começar? 🌱",
            "Como sei se a planta precisa de água? 💧",
            "Já matei algumas plantas por regar demais. Socorro! 😅",
            "Obrigado pelas dicas! Estou a aprender muito. 📚"
        ]
    },
    {
        id: 'user_experiente',
        name: 'JardimMaster',
        avatar: '👨‍🌾',
        meta: '🏆 Jardineiro há 20 anos',
        interests: ['experiente', 'conselhos', 'profissional'],
        messageTemplates: [
            "Olá! Com 20 anos de experiência, plantas são a minha vida! 🌿",
            "Dica profissional: Solo bem drenado é fundamental. 🏺",
            "Já lidaste com pragas resistentes? Eu já vi de tudo. 🐛",
            "Plantas exóticas precisam de cuidados especiais. 🌺",
            "Qualquer dúvida sobre jardinagem, é só perguntar! 💡"
        ]
    }
];

/**
 * Inicia o sistema de simulação de mensagens
 */
function startMessageSimulation() {
    console.log('[message-simulator.js] Iniciando simulação de mensagens...');

    // Simula mensagens a cada 1 minuto para testar (era 30-90 minutos)
    const randomInterval = 1 * 60 * 1000; // 1 minuto

    setTimeout(() => {
        simulateRandomUserMessage();
        // Agenda a próxima mensagem
        setInterval(simulateRandomUserMessage, randomInterval);
    }, randomInterval);
}

/**
 * Simula uma mensagem de um usuário aleatório
 */
function simulateRandomUserMessage() {
    try {
        // Carrega o histórico atual do localStorage primeiro
        let chatHistory = JSON.parse(localStorage.getItem('chatHistory') || '{}');

        if (Object.keys(chatHistory).length === 0) {
            console.log('[message-simulator.js] Nenhum histórico encontrado');
            return;
        }

        // Escolhe uma conversa aleatória existente
        const conversationIds = Object.keys(chatHistory);
        const randomConversationId = conversationIds[Math.floor(Math.random() * conversationIds.length)];
        const conversation = chatHistory[randomConversationId];

        if (!conversation || !conversation.messages) {
            console.log('[message-simulator.js] Conversa inválida');
            return;
        }

        // Escolhe um usuário simulado aleatório
        const simulatedUser = simulatedUsers[Math.floor(Math.random() * simulatedUsers.length)];

        // Verifica se já existe uma conversa com este usuário simulado
        let targetConversationId = `sim_${simulatedUser.id}`;
        let targetConversation = chatHistory[targetConversationId];

        if (!targetConversation) {
            // Cria uma nova conversa simulada
            targetConversation = {
                id: targetConversationId,
                user: simulatedUser.name,
                avatar: simulatedUser.avatar,
                meta: simulatedUser.meta,
                messages: []
            };
            chatHistory[targetConversationId] = targetConversation;
            console.log(`[message-simulator.js] Criada nova conversa simulada: ${simulatedUser.name}`);
        }

        // Verifica se estamos visualizando esta conversa
        const currentConversationId = localStorage.getItem('currentConversation');
        const isViewingConversation = window.location.pathname.includes('mensagemExemplo.html') &&
            currentConversationId === targetConversationId;

        if (isViewingConversation) {
            console.log('[message-simulator.js] Usuário está visualizando esta conversa - pulando');
            return;
        }

        // Escolhe uma mensagem aleatória do usuário simulado
        const randomMessage = simulatedUser.messageTemplates[
            Math.floor(Math.random() * simulatedUser.messageTemplates.length)
        ];

        // Adiciona timestamp
        const messageTime = new Date().toLocaleTimeString('pt-PT', {
            hour: '2-digit',
            minute: '2-digit'
        });

        // Adiciona a mensagem
        targetConversation.messages.push({
            sender: simulatedUser.name,
            text: randomMessage,
            time: messageTime
        });

        // Salva o histórico atualizado no localStorage
        localStorage.setItem('chatHistory', JSON.stringify(chatHistory));

        // Dispara notificação de nova mensagem
        if (window.notificarNovaMensagem) {
            window.notificarNovaMensagem(simulatedUser.name);
            console.log(`[message-simulator.js] Notificação enviada para nova mensagem de ${simulatedUser.name}`);
        }

        // Atualiza o conversationsData se existir (para manter a interface sincronizada)
        if (window.ChatSmartPlants && window.ChatSmartPlants.conversationsData) {
            const conversationIndex = window.ChatSmartPlants.conversationsData.findIndex(c => c.id == targetConversationId);
            if (conversationIndex >= 0) {
                // Atualiza a conversa existente
                window.ChatSmartPlants.conversationsData[conversationIndex] = {
                    ...window.ChatSmartPlants.conversationsData[conversationIndex],
                    ...targetConversation,
                    lastMessage: randomMessage,
                    time: messageTime,
                    unread: (window.ChatSmartPlants.conversationsData[conversationIndex].unread || 0) + 1
                };
            } else {
                // Adiciona nova conversa
                window.ChatSmartPlants.conversationsData.push({
                    ...targetConversation,
                    lastMessage: randomMessage,
                    time: messageTime,
                    unread: 1
                });
            }

            // Atualiza a interface do chat
            if (typeof window.ChatSmartPlants.updateConversationCards === 'function') {
                window.ChatSmartPlants.updateConversationCards();
            }
            if (typeof window.ChatSmartPlants.applyConversationFilters === 'function') {
                setTimeout(() => {
                    window.ChatSmartPlants.applyConversationFilters();
                }, 100);
            }
        }

        console.log('[message-simulator.js] Mensagem simulada enviada para:', simulatedUser.name);

    } catch (error) {
        console.error('[message-simulator.js] Erro geral na simulação:', error);
    }
}

// Inicia a simulação quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', function() {
    // Pequeno delay para garantir que outros scripts carregaram
    setTimeout(startMessageSimulation, 2000);
});