// Sistema Global de Notificações - Smart Plants
// Este arquivo deve ser carregado em todas as páginas

// Funções de notificação disponíveis globalmente
window.SmartPlantsNotifications = {
    
    // Adicionar notificação genérica
    adicionar: function(tipo, mensagem, link = null) {
        const notificacoes = JSON.parse(localStorage.getItem('notificacoes') || '[]');
        const agora = new Date();
        
        const novaNotificacao = {
            id: Date.now(),
            tipo: tipo,
            mensagem: mensagem,
            data: agora.toLocaleDateString('pt-PT'),
            hora: agora.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' }),
            lida: false,
            link: link
        };

        notificacoes.unshift(novaNotificacao);
        localStorage.setItem('notificacoes', JSON.stringify(notificacoes));
        
        this.atualizarBadge();
    },
    
    // Atualizar badge em todas as páginas
    atualizarBadge: function() {
        const notificacoes = JSON.parse(localStorage.getItem('notificacoes') || '[]');
        const naoLidas = notificacoes.filter(n => !n.lida).length;
        
        const menuItems = document.querySelectorAll('a[href="notificacoes.html"]');
        menuItems.forEach(item => {
            let badge = item.querySelector('.notification-badge');
            
            if (naoLidas > 0) {
                if (!badge) {
                    badge = document.createElement('span');
                    badge.className = 'notification-badge';
                    item.style.position = 'relative';
                    item.appendChild(badge);
                }
                badge.textContent = naoLidas > 99 ? '99+' : naoLidas;
                badge.style.display = 'flex';
            } else if (badge) {
                badge.style.display = 'none';
            }
        });
    }
};

// Funções de atalho para tipos específicos de notificações
window.notificarNovaPlanta = function(nomePlanta) {
    window.SmartPlantsNotifications.adicionar(
        'planta',
        `🌱 Nova planta adicionada: "${nomePlanta}"`,
        'minhasplantas.html'
    );
};

window.notificarRegaRealizada = function(nomePlanta) {
    window.SmartPlantsNotifications.adicionar(
        'rega',
        `✅ Você regou "${nomePlanta}"`,
        'minhasplantas.html'
    );
};

window.notificarHorarioRega = function(nomePlanta) {
    window.SmartPlantsNotifications.adicionar(
        'rega',
        `⏰ Hora de regar "${nomePlanta}"!`,
        'regar.html'
    );
};

window.notificarEventoCalendario = function(titulo, data) {
    window.SmartPlantsNotifications.adicionar(
        'calendario',
        `📅 Evento agendado: "${titulo}" para ${data}`,
        'calendario.html'
    );
};

window.notificarNovaMensagem = function(usuario) {
    window.SmartPlantsNotifications.adicionar(
        'chat',
        `💬 Nova mensagem de ${usuario}`,
        'chat.html'
    );
};

window.notificarNovoPost = function(autor, titulo) {
    window.SmartPlantsNotifications.adicionar(
        'forum',
        `📢 ${autor} publicou: "${titulo}"`,
        'forum.html'
    );
};

window.notificarProgressoPlanta = function(nomePlanta) {
    window.SmartPlantsNotifications.adicionar(
        'planta',
        `📸 Nova foto de progresso adicionada: "${nomePlanta}"`,
        'minhasplantas.html'
    );
};

window.notificarComentarioForum = function(autor, postTitulo) {
    window.SmartPlantsNotifications.adicionar(
        'forum',
        `💬 ${autor} comentou no post: "${postTitulo}"`,
        'forum.html'
    );
};

window.notificarLembrete = function(titulo, mensagem) {
    window.SmartPlantsNotifications.adicionar(
        'lembrete',
        `🔔 Lembrete: ${titulo} - ${mensagem}`,
        'lembretes.html'
    );
};

// Inicializar badge quando a página carregar
document.addEventListener('DOMContentLoaded', () => {
    window.SmartPlantsNotifications.atualizarBadge();
});
