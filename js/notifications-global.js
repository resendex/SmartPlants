// @ts-nocheck
// Sistema Global de Notificações - Smart Plants
// Este arquivo deve ser carregado em todas as páginas

// Funções de notificação disponíveis globalmente
window.SmartPlantsNotifications = {
    
    // Adicionar notificação genérica
    adicionar: function(tipo, mensagem, link = null, mostrarToast = true) {
        const notificacoes = JSON.parse(localStorage.getItem('notificacoes') || '[]');
        const agora = new Date();
        
        const novaNotificacao = {
            id: Date.now(),
            tipo: tipo,
            mensagem: mensagem,
            data: agora.toLocaleDateString('pt-PT'),
            hora: agora.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' }),
            lida: false,
            link: link,
            arquivada: false
        };

        notificacoes.unshift(novaNotificacao);
            // Log para depuração
            console.info('[SmartPlantsNotifications] Notificação adicionada:', novaNotificacao);
        localStorage.setItem('notificacoes', JSON.stringify(notificacoes));
        
        this.atualizarBadge();
        this.atualizarIconeHeader();
        
        // Mostrar notificação toast imediata
        if (mostrarToast) {
            this.mostrarToast(tipo, mensagem, link);
        }
    },

    // Mostrar notificação toast (popup temporário)
    mostrarToast: function(tipo, mensagem, link = null) {
        const icones = {
            'planta': '🌱',
            'rega': '💧',
            'calendario': '📅',
            'chat': '💬',
            'forum': '📢',
            'lembrete': '🔔',
            'alerta': '⚠️'
        };
        
        const icone = icones[tipo] || '📌';
        
        // Criar container de toasts se não existir
        let toastContainer = document.getElementById('toast-container');
        if (!toastContainer) {
            toastContainer = document.createElement('div');
            toastContainer.id = 'toast-container';
            toastContainer.className = 'toast-container';
            document.body.appendChild(toastContainer);
        }
        
        // Criar toast
        const toast = document.createElement('div');
        toast.className = `toast-notification toast-${tipo}`;
        toast.innerHTML = `
            <span class="toast-icon">${icone}</span>
            <div class="toast-content">
                <p class="toast-message">${mensagem}</p>
                ${link ? '<span class="toast-action">Clique para ver</span>' : ''}
            </div>
            <button class="toast-close" onclick="this.parentElement.remove()">✕</button>
        `;
        
        // Se tiver link, tornar clicável
        if (link) {
            toast.style.cursor = 'pointer';
            toast.onclick = (e) => {
                if (!e.target.classList.contains('toast-close')) {
                    window.location.href = link;
                }
            };
        }
        
        toastContainer.appendChild(toast);
        
        // Animação de entrada
        setTimeout(() => toast.classList.add('show'), 10);
        
        // Remover após 5 segundos
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 5000);
    },

    // Arquivar notificação (mover para histórico)
    arquivar: function(id) {
        const notificacoes = JSON.parse(localStorage.getItem('notificacoes') || '[]');
        const historico = JSON.parse(localStorage.getItem('notificacoesHistorico') || '[]');
        
        const index = notificacoes.findIndex(n => n.id === id);
        if (index !== -1) {
            const notificacao = notificacoes.splice(index, 1)[0];
            notificacao.arquivada = true;
            notificacao.dataArquivamento = new Date().toLocaleDateString('pt-PT');
            historico.unshift(notificacao);
            
            // Limitar histórico a 100 itens
            if (historico.length > 100) {
                historico.splice(100);
            }
            
            localStorage.setItem('notificacoes', JSON.stringify(notificacoes));
            localStorage.setItem('notificacoesHistorico', JSON.stringify(historico));
        }
        
        this.atualizarBadge();
        this.atualizarIconeHeader();
    },

    // Obter histórico de notificações
    getHistorico: function() {
        return JSON.parse(localStorage.getItem('notificacoesHistorico') || '[]');
    },

    // Limpar histórico
    limparHistorico: function() {
        localStorage.setItem('notificacoesHistorico', JSON.stringify([]));
    },
    
    // Atualizar badge em todas as páginas
    atualizarBadge: function() {
        const notificacoes = JSON.parse(localStorage.getItem('notificacoes') || '[]');
        const naoLidas = notificacoes.filter(n => !n.lida).length;
        
        const menuItems = document.querySelectorAll('a[href="notificacoes.html"].menu-item');
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
    },

    // Criar e atualizar ícone de notificações no header
    atualizarIconeHeader: function() {
        // Não mostrar ícone do header na própria página de notificações
        const isNotificacoesPage = window.location.pathname.includes('notificacoes.html');
        if (isNotificacoesPage) {
            // Remover ícone se existir na página de notificações
            const existingIcon = document.querySelector('.header-notification-icon');
            if (existingIcon) {
                existingIcon.remove();
            }
            return;
        }

        const notificacoes = JSON.parse(localStorage.getItem('notificacoes') || '[]');
        const naoLidas = notificacoes.filter(n => !n.lida).length;
        const headerRight = document.querySelector('.header-right');
        
        if (!headerRight) return;
        
        let notifIcon = document.querySelector('.header-notification-icon');
        
        // Criar ícone se não existir
        if (!notifIcon) {
            notifIcon = document.createElement('div');
            notifIcon.className = 'header-notification-icon';
            notifIcon.innerHTML = `
                <a href="notificacoes.html" class="notif-bell" title="Notificações">
                    <span class="bell-icon">🔔</span>
                    <span class="notif-badge-header" style="display: none;">0</span>
                </a>
                <div class="notif-dropdown">
                    <div class="notif-dropdown-header">
                        <span>Notificações</span>
                        <a href="notificacoes.html" class="ver-todas">Ver todas</a>
                    </div>
                    <div class="notif-dropdown-list"></div>
                </div>
            `;
            
            // Inserir antes do ícone do usuário
            const userIcon = headerRight.querySelector('.user-icon');
            if (userIcon) {
                headerRight.insertBefore(notifIcon, userIcon);
            } else {
                headerRight.appendChild(notifIcon);
            }
            
            // Configurar evento de hover/click para mostrar dropdown
            const bellBtn = notifIcon.querySelector('.notif-bell');
            const dropdown = notifIcon.querySelector('.notif-dropdown');
            
            bellBtn.addEventListener('click', (e) => {
                if (window.innerWidth <= 768) {
                    // Em mobile, vai direto para a página
                    return;
                }
                e.preventDefault();
                dropdown.classList.toggle('show');
                this.preencherDropdown();
            });
            
            // Fechar dropdown ao clicar fora
            document.addEventListener('click', (e) => {
                if (!notifIcon.contains(e.target)) {
                    dropdown.classList.remove('show');
                }
            });
        }
        
        // Atualizar badge
        const badge = notifIcon.querySelector('.notif-badge-header');
        if (badge) {
            if (naoLidas > 0) {
                badge.textContent = naoLidas > 99 ? '99+' : naoLidas;
                badge.style.display = 'flex';
                notifIcon.querySelector('.bell-icon').classList.add('has-notifications');
            } else {
                badge.style.display = 'none';
                notifIcon.querySelector('.bell-icon').classList.remove('has-notifications');
            }
        }
    },

    // Preencher dropdown com notificações recentes
    preencherDropdown: function() {
        const dropdown = document.querySelector('.notif-dropdown-list');
        if (!dropdown) return;
        
        const notificacoes = JSON.parse(localStorage.getItem('notificacoes') || '[]');
        const recentes = notificacoes.slice(0, 5); // Mostrar apenas as 5 mais recentes
        
        if (recentes.length === 0) {
            dropdown.innerHTML = '<div class="notif-empty">Sem notificações</div>';
            return;
        }
        
        const icones = {
            'planta': '🌱',
            'rega': '💧',
            'calendario': '📅',
            'chat': '💬',
            'forum': '📢',
            'lembrete': '🔔'
        };
        
        dropdown.innerHTML = recentes.map(n => `
            <div class="notif-item ${n.lida ? 'lida' : ''}" onclick="window.SmartPlantsNotifications.marcarLidaENavegar(${n.id}, '${n.link || ''}')">
                <span class="notif-item-icon">${icones[n.tipo] || '📌'}</span>
                <div class="notif-item-content">
                    <p class="notif-item-msg">${n.mensagem}</p>
                    <span class="notif-item-time">${n.hora}</span>
                </div>
            </div>
        `).join('');
    },

    // Marcar como lida e navegar
    marcarLidaENavegar: function(id, link) {
        const notificacoes = JSON.parse(localStorage.getItem('notificacoes') || '[]');
        const index = notificacoes.findIndex(n => n.id === id);
        if (index !== -1) {
            notificacoes[index].lida = true;
            localStorage.setItem('notificacoes', JSON.stringify(notificacoes));
        }
        
        if (link) {
            window.location.href = link;
        } else {
            window.location.href = 'notificacoes.html';
        }
    },

    // Injetar estilos CSS para o ícone do header
    injetarEstilos: function() {
        if (document.getElementById('notif-header-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'notif-header-styles';
        style.textContent = `
            .header-notification-icon {
                position: relative;
                margin-right: 1em;
            }
            
            .notif-bell {
                display: flex;
                align-items: center;
                justify-content: center;
                width: 2.8em;
                height: 2.8em;
                border-radius: 50%;
                background: rgba(102, 126, 234, 0.1);
                text-decoration: none;
                transition: all 0.3s ease;
                position: relative;
            }
            
            .notif-bell:hover {
                background: rgba(102, 126, 234, 0.2);
                transform: scale(1.05);
            }
            
            .bell-icon {
                font-size: 1.4em;
                transition: transform 0.3s ease;
            }
            
            .bell-icon.has-notifications {
                animation: bellShake 0.5s ease-in-out;
            }
            
            @keyframes bellShake {
                0%, 100% { transform: rotate(0); }
                25% { transform: rotate(15deg); }
                50% { transform: rotate(-15deg); }
                75% { transform: rotate(10deg); }
            }
            
            .notif-badge-header {
                position: absolute;
                top: -0.3em;
                right: -0.3em;
                background: linear-gradient(135deg, #ff6b6b 0%, #ee5a5a 100%);
                color: white;
                font-size: 0.7em;
                font-weight: 700;
                min-width: 1.6em;
                height: 1.6em;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                box-shadow: 0 2px 6px rgba(255, 107, 107, 0.4);
            }
            
            .notif-dropdown {
                position: absolute;
                top: calc(100% + 0.5em);
                right: 0;
                width: 320px;
                background: white;
                border-radius: 1em;
                box-shadow: 0 0.5em 2em rgba(0, 0, 0, 0.15);
                opacity: 0;
                visibility: hidden;
                transform: translateY(-10px);
                transition: all 0.3s ease;
                z-index: 1000;
                overflow: hidden;
            }
            
            .notif-dropdown.show {
                opacity: 1;
                visibility: visible;
                transform: translateY(0);
            }
            
            .notif-dropdown-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 1em;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                font-weight: 600;
            }
            
            .notif-dropdown-header .ver-todas {
                color: rgba(255, 255, 255, 0.9);
                font-size: 0.85em;
                text-decoration: none;
            }
            
            .notif-dropdown-header .ver-todas:hover {
                text-decoration: underline;
            }
            
            .notif-dropdown-list {
                max-height: 300px;
                overflow-y: auto;
            }
            
            .notif-item {
                display: flex;
                align-items: flex-start;
                gap: 0.8em;
                padding: 0.8em 1em;
                border-bottom: 1px solid #eee;
                cursor: pointer;
                transition: background 0.2s ease;
            }
            
            .notif-item:hover {
                background: rgba(102, 126, 234, 0.05);
            }
            
            .notif-item:last-child {
                border-bottom: none;
            }
            
            .notif-item.lida {
                opacity: 0.6;
            }
            
            .notif-item-icon {
                font-size: 1.3em;
                flex-shrink: 0;
            }
            
            .notif-item-content {
                flex: 1;
                min-width: 0;
            }
            
            .notif-item-msg {
                margin: 0;
                font-size: 0.9em;
                color: #333;
                line-height: 1.4;
                overflow: hidden;
                text-overflow: ellipsis;
                display: -webkit-box;
                -webkit-line-clamp: 2;
                -webkit-box-orient: vertical;
            }
            
            .notif-item-time {
                font-size: 0.75em;
                color: #999;
            }
            
            .notif-empty {
                padding: 2em;
                text-align: center;
                color: #999;
            }
            
            .header-right {
                display: flex;
                align-items: center;
                gap: 0.5em;
            }
            
            @media (max-width: 768px) {
                .notif-dropdown {
                    display: none !important;
                }
                
                .header-notification-icon {
                    margin-right: 0.5em;
                }
                
                .notif-bell {
                    width: 2.4em;
                    height: 2.4em;
                }
            }
            
            /* Toast Notifications */
            .toast-container {
                position: fixed;
                top: 1em;
                right: 1em;
                z-index: 10000;
                display: flex;
                flex-direction: column;
                gap: 0.8em;
                max-width: 380px;
            }
            
            .toast-notification {
                display: flex;
                align-items: flex-start;
                gap: 0.8em;
                padding: 1em 1.2em;
                background: white;
                border-radius: 1em;
                box-shadow: 0 0.5em 2em rgba(0, 0, 0, 0.2);
                transform: translateX(120%);
                transition: transform 0.3s ease;
                border-left: 4px solid #667eea;
            }
            
            .toast-notification.show {
                transform: translateX(0);
            }
            
            .toast-notification.toast-rega {
                border-left-color: #17a2b8;
            }
            
            .toast-notification.toast-planta {
                border-left-color: #28a745;
            }
            
            .toast-notification.toast-alerta {
                border-left-color: #dc3545;
                animation: toastPulse 1s infinite;
            }
            
            .toast-notification.toast-lembrete {
                border-left-color: #ffc107;
            }
            
            @keyframes toastPulse {
                0%, 100% { box-shadow: 0 0.5em 2em rgba(220, 53, 69, 0.2); }
                50% { box-shadow: 0 0.5em 2em rgba(220, 53, 69, 0.4); }
            }
            
            .toast-icon {
                font-size: 1.5em;
                flex-shrink: 0;
            }
            
            .toast-content {
                flex: 1;
            }
            
            .toast-message {
                margin: 0;
                font-size: 0.95em;
                color: #333;
                line-height: 1.4;
                font-weight: 500;
            }
            
            .toast-action {
                font-size: 0.8em;
                color: #667eea;
                font-weight: 600;
            }
            
            .toast-close {
                background: none;
                border: none;
                font-size: 1.2em;
                color: #999;
                cursor: pointer;
                padding: 0;
                line-height: 1;
                transition: color 0.2s ease;
            }
            
            .toast-close:hover {
                color: #333;
            }
            
            @media (max-width: 768px) {
                .toast-container {
                    left: 1em;
                    right: 1em;
                    max-width: none;
                }
            }
        `;
        document.head.appendChild(style);
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
        `Evento agendado: "${titulo}" para ${data}`,
        'calendario.html'
    );
};

window.notificarNovaMensagem = function(usuario) {
    window.SmartPlantsNotifications.adicionar(
        'chat',
        `Nova mensagem de ${usuario}`,
        'chat.html'
    );
};

window.notificarNovoPost = function(autor, titulo) {
    window.SmartPlantsNotifications.adicionar(
        'forum',
        `${autor} publicou: "${titulo}"`,
        'forum.html'
    );
};

window.notificarProgressoPlanta = function(nomePlanta) {
    window.SmartPlantsNotifications.adicionar(
        'planta',
        `Nova foto de progresso adicionada: "${nomePlanta}"`,
        'minhasplantas.html'
    );
};

window.notificarComentarioForum = function(autor, postTitulo) {
    window.SmartPlantsNotifications.adicionar(
        'forum',
        `${autor} comentou no post: "${postTitulo}"`,
        'forum.html'
    );
};

window.notificarLembrete = function(titulo, mensagem) {
    window.SmartPlantsNotifications.adicionar(
        'lembrete',
        `Lembrete: ${titulo} - ${mensagem}`,
        'lembretes.html'
    );
};

// Alertar sobre excesso de rega
window.notificarExcessoRega = function(nomePlanta) {
    window.SmartPlantsNotifications.adicionar(
        'alerta',
        `ATENÇÃO: "${nomePlanta}" pode estar a receber água em excesso! Aguarde alguns dias antes de regar novamente.`,
        'minhasplantas.html'
    );
};

// Sugerir mudança de vaso
window.notificarMudancaVaso = function(nomePlanta, meses) {
    window.SmartPlantsNotifications.adicionar(
        'planta',
        `🪴 "${nomePlanta}" não muda de vaso há ${meses} meses. Considere transplantá-la para um vaso maior.`,
        'minhasplantas.html'
    );
};

// Verificar plantas que precisam de atenção ao carregar
window.verificarCuidadosPlantas = function() {
    const plantas = JSON.parse(localStorage.getItem('myPlants') || '[]');
    const agora = new Date();
    
    plantas.forEach(planta => {
        // Verificar mudança de vaso
        const dataReferencia = planta.lastRepotDate || planta.plantDate;
        if (dataReferencia) {
            const mesesDesde = Math.floor((agora - new Date(dataReferencia)) / (1000 * 60 * 60 * 24 * 30));
            if (mesesDesde >= 12 && !planta.vasoAlertaEnviado) {
                window.notificarMudancaVaso(planta.name, mesesDesde);
                // Marcar alerta como enviado para não repetir
                planta.vasoAlertaEnviado = true;
            }
        }
        
        // Verificar rega em excesso
        if (planta.lastWatered) {
            const horasDesdeRega = (agora - new Date(planta.lastWatered)) / (1000 * 60 * 60);
            const frequenciaRega = planta.wateringFrequency || 72; // 3 dias por defeito
            
            if (horasDesdeRega < frequenciaRega * 0.3 && planta.regaRecente && !planta.excessoAlertaEnviado) {
                window.notificarExcessoRega(planta.name);
                planta.excessoAlertaEnviado = true;
            }
        }
    });
    
    localStorage.setItem('myPlants', JSON.stringify(plantas));
};

// Sistema de Atividades Recentes
window.SmartPlantsActivities = {
    
    // Adicionar atividade recente
    adicionar: function(icone, texto, link = null) {
        console.info('[SmartPlantsActivities] adicionar chamado com icone:', icone, 'texto:', texto);
        // Ler atividades atuais do localStorage
        let atividades = [];
        try {
            atividades = JSON.parse(localStorage.getItem('atividades_recentes') || '[]');
        } catch (e) {
            console.error('[SmartPlantsActivities] Erro ao ler atividades:', e);
        }

        const agora = new Date();

        const novaAtividade = {
            id: Date.now(),
            icone: icone,
            texto: texto,
            data: agora.toLocaleDateString('pt-PT'),
            hora: agora.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' }),
            link: link
        };

        atividades.unshift(novaAtividade);

        // Manter apenas as 10 mais recentes
        if (atividades.length > 10) {
            atividades.splice(10);
        }

        localStorage.setItem('atividades_recentes', JSON.stringify(atividades));
        console.info('[SmartPlantsActivities] Atividade adicionada:', novaAtividade);

        // Disparar evento
        window.dispatchEvent(new Event('atividadesRecentesAtualizadas'));
        console.info('[SmartPlantsActivities] Evento atividadesRecentesAtualizadas disparado');

        // BroadcastChannel
        if (typeof BroadcastChannel !== 'undefined') {
            const bc = new BroadcastChannel('smartplants-atividades');
            bc.postMessage({ type: 'atividadeAdicionada', atividades: atividades });
            console.info('[SmartPlantsActivities] BroadcastChannel postMessage enviado');
            bc.close();
        }
    },

    // Obter atividades recentes
    obter: function() {
        try {
            const stored = localStorage.getItem('atividades_recentes');
            return stored ? JSON.parse(stored) : [];
        } catch (e) {
            console.error('Erro ao obter atividades do localStorage:', e);
            return [];
        }
    },

    // Limpar atividades antigas (mais de 30 dias)
    limparAntigas: function() {
        const atividades = this.obter();
        const agora = new Date();
        const trintaDiasAtras = new Date(agora.getTime() - (30 * 24 * 60 * 60 * 1000));
        
        const atividadesFiltradas = atividades.filter(atividade => {
            const dataAtividade = new Date(atividade.data + ' ' + atividade.hora);
            return dataAtividade > trintaDiasAtras;
        });
        
        window.smartPlantsActivitiesData = atividadesFiltradas;
        try {
            localStorage.setItem('atividades_recentes', JSON.stringify(atividadesFiltradas));
        } catch (e) {
            // Ignorar erros do localStorage
        }
    }
};

// Funções de atalho para tipos específicos de atividades
window.adicionarAtividadeNovaPlanta = function(nomePlanta) {
    const agora = new Date();
    const horaFormatada = agora.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' });
    window.SmartPlantsActivities.adicionar(
        'add',
        `Adicionou <strong>${nomePlanta}</strong> às ${horaFormatada}`
    );
};

window.adicionarAtividadeRega = function(nomePlanta) {
    const agora = new Date();
    const horaFormatada = agora.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' });
    window.SmartPlantsActivities.adicionar(
        'success',
        `Regou <strong>${nomePlanta}</strong> às ${horaFormatada}`
    );
};

window.adicionarAtividadeMensagem = function(destinatario = null) {
    const agora = new Date();
    const horaFormatada = agora.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' });
    const nomeDestinatario = destinatario || 'alguém';
    window.SmartPlantsActivities.adicionar(
        'message',
        `Enviou mensagem a <strong>${nomeDestinatario}</strong> às ${horaFormatada}`
    );
};

// Inicializar quando a página carregar
document.addEventListener('DOMContentLoaded', () => {
    // Injetar estilos CSS
    window.SmartPlantsNotifications.injetarEstilos();
    
    // Atualizar badge no menu
    window.SmartPlantsNotifications.atualizarBadge();
    
    // Criar ícone de notificações no header
    window.SmartPlantsNotifications.atualizarIconeHeader();
    
    // Verificar cuidados das plantas
    window.verificarCuidadosPlantas();
    
    // Limpar atividades antigas
    window.SmartPlantsActivities.limparAntigas();
});
