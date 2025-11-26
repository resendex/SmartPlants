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

let currentChatSortOrder = 'recent';
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

    const sortedCards = cards.slice().sort((a, b) => {
        const aTime = Date.parse(a.dataset.timestamp || '') || 0;
        const bTime = Date.parse(b.dataset.timestamp || '') || 0;
        return currentChatSortOrder === 'recent' ? bTime - aTime : aTime - bTime;
    });

    sortedCards.forEach(card => list.appendChild(card));

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
    const sortSelect = document.getElementById('chatSortSelect');
    const mediaSelect = document.getElementById('chatMediaFilter');

    if (sortSelect) {
        sortSelect.addEventListener('change', (event) => {
            currentChatSortOrder = event.target.value === 'oldest' ? 'oldest' : 'recent';
            applyConversationFilters();
        });
    }

    if (mediaSelect) {
        mediaSelect.addEventListener('change', (event) => {
            currentChatMediaFilter = event.target.value || 'all';
            applyConversationFilters();
        });
    }
}

// Função para abrir conversa específica
function openConversation(conversationId) {
    // Salva o ID da conversa atual
    localStorage.setItem('currentConversation', conversationId);
    
    // Busca os dados da conversa
    const conversation = conversationsData.find(c => c.id === conversationId);
    
    if (conversation) {
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

// Função para marcar mensagens como lidas
function markAsRead(conversationId) {
    const conversation = conversationsData.find(c => c.id === conversationId);
    if (conversation) {
        conversation.unread = 0;
    }
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

    // Aplica filtros/ordenação iniciais
    applyConversationFilters();
    
    // Configura cards de conversa
    setupConversationCards();
    
    // Configura FAB
    setupFAB();
    
    // Integra com sistema de plantas
    integrateWithPlants();
});

// Exporta funções para uso global
window.ChatSmartPlants = {
    openConversation,
    searchConversations,
    showNotification,
    conversationsData
};
