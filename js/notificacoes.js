/**
 * @typedef {'planta' | 'rega' | 'calendario' | 'chat' | 'forum' | 'lembrete'} TipoNotificacao
 */

/**
 * @typedef {Object} Notificacao
 * @property {number} id
 * @property {TipoNotificacao} tipo
 * @property {string} mensagem
 * @property {string} data
 * @property {string} hora
 * @property {boolean} lida
 * @property {string | null} link
 */

// Função para obter as notificações do localStorage
/**
 * @returns {Notificacao[]}
 */
function getNotificacoes() {
    const notificacoes = localStorage.getItem('notificacoes');
    return notificacoes ? JSON.parse(notificacoes) : [];
}

// Função para salvar notificações no localStorage
/**
 * @param {Notificacao[]} notificacoes
 */
function salvarNotificacoes(notificacoes) {
    localStorage.setItem('notificacoes', JSON.stringify(notificacoes));
}

// Função para adicionar uma nova notificação
/**
 * @param {TipoNotificacao} tipo
 * @param {string} mensagem
 * @param {string | null} [link=null]
 */
function adicionarNotificacao(tipo, mensagem, link = null) {
    const notificacoes = getNotificacoes();
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

    notificacoes.unshift(novaNotificacao); // Adiciona no início do array
    salvarNotificacoes(notificacoes);
    
    // Atualiza badge de notificações não lidas
    atualizarBadgeNotificacoes();
}

// Função para criar notificação de nova planta
/**
 * @param {string} nomePlanta
 */
function notificarNovaPlanta(nomePlanta) {
    adicionarNotificacao(
        'planta',
        `Nova planta adicionada: "${nomePlanta}"`,
        'minhasplantas.html'
    );
}

// Função para criar notificação de rega
/**
 * @param {string} nomePlanta
 */
function notificarHorarioRega(nomePlanta) {
    adicionarNotificacao(
        'rega',
        `⏰ Hora de regar "${nomePlanta}"!`,
        'regar.html'
    );
}

// Função para criar notificação de rega realizada
/**
 * @param {string} nomePlanta
 */
function notificarRegaRealizada(nomePlanta) {
    adicionarNotificacao(
        'rega',
        `✅ Você regou "${nomePlanta}"`,
        'minhasplantas.html'
    );
}

// Função para criar notificação de evento do calendário
/**
 * @param {string} titulo
 * @param {string} data
 */
function notificarEventoCalendario(titulo, data) {
    adicionarNotificacao(
        'calendario',
        `📅 Evento agendado: "${titulo}" para ${data}`,
        'calendario.html'
    );
}

// Função para criar notificação de nova mensagem no chat
/**
 * @param {string} usuario
 */
function notificarNovaMensagem(usuario) {
    adicionarNotificacao(
        'chat',
        `💬 Nova mensagem de ${usuario}`,
        'chat.html'
    );
}

// Função para criar notificação de novo post no fórum
/**
 * @param {string} autor
 * @param {string} titulo
 */
function notificarNovoPost(autor, titulo) {
    adicionarNotificacao(
        'forum',
        `📢 ${autor} publicou: "${titulo}"`,
        'forum.html'
    );
}

// Função para criar notificação de progresso da planta
/**
 * @param {string} nomePlanta
 */
function notificarProgressoPlanta(nomePlanta) {
    adicionarNotificacao(
        'planta',
        `📸 Nova foto de progresso adicionada: "${nomePlanta}"`,
        'minhasplantas.html'
    );
}

// Função para criar notificação de comentário no fórum
/**
 * @param {string} autor
 * @param {string} postTitulo
 */
function notificarComentarioForum(autor, postTitulo) {
    adicionarNotificacao(
        'forum',
        `💬 ${autor} comentou no post: "${postTitulo}"`,
        'forum.html'
    );
}

// Função para criar notificação de lembrete
/**
 * @param {string} titulo
 * @param {string} mensagem
 */
function notificarLembrete(titulo, mensagem) {
    adicionarNotificacao(
        'lembrete',
        `🔔 Lembrete: ${titulo} - ${mensagem}`,
        'lembretes.html'
    );
}

// Função para marcar notificação como lida
/**
 * @param {number} id
 */
function marcarComoLida(id) {
    const notificacoes = getNotificacoes();
    const index = notificacoes.findIndex(n => n.id === id);
    if (index !== -1) {
        notificacoes[index].lida = true;
        salvarNotificacoes(notificacoes);
        atualizarListaNotificacoes();
    }
}

// Função para marcar todas as notificações como lidas
function marcarTodasComoLidas() {
    const notificacoes = getNotificacoes();
    let houveAtualizacao = false;

    notificacoes.forEach(notificacao => {
        if (!notificacao.lida) {
            notificacao.lida = true;
            houveAtualizacao = true;
        }
    });

    if (houveAtualizacao) {
        salvarNotificacoes(notificacoes);
    }

    atualizarListaNotificacoes();
}

// Função para eliminar todas as notificações
function eliminarTodasNotificacoes() {
    const notificacoes = getNotificacoes();
    if (notificacoes.length === 0) {
        return;
    }

    localStorage.removeItem('notificacoes');
    atualizarListaNotificacoes();
}

// Função para excluir notificação
/**
 * @param {number} id
 */
function excluirNotificacao(id) {
    const notificacoes = getNotificacoes().filter(n => n.id !== id);
    salvarNotificacoes(notificacoes);
    atualizarListaNotificacoes();
}

// Função para atualizar a lista de notificações na interface
function atualizarListaNotificacoes() {
    const container = document.getElementById('notificacoesContainer');
    const emptyState = document.getElementById('emptyState');
    const markAllButton = /** @type {HTMLButtonElement | null} */ (document.getElementById('markAllReadButton'));
    const clearAllButton = /** @type {HTMLButtonElement | null} */ (document.getElementById('clearAllButton'));
    if (!container || !emptyState) return; // Não atualizar se não estiver na página de notificações
    
    const notificacoes = getNotificacoes();
    const notificacoesNaoLidas = notificacoes.filter(n => !n.lida).length;

    if (markAllButton) {
        markAllButton.disabled = notificacoesNaoLidas === 0;
    }

    if (clearAllButton) {
        clearAllButton.disabled = notificacoes.length === 0;
    }

    if (notificacoes.length === 0) {
        container.style.display = 'none';
        emptyState.style.display = 'block';
        return;
    }

    container.style.display = 'flex';
    emptyState.style.display = 'none';
    container.innerHTML = '';

    notificacoes.forEach(notificacao => {
        const icones = {
            'planta': '🌱',
            'rega': '💧',
            'calendario': '📅',
            'chat': '💬',
            'forum': '📢',
            'lembrete': '🔔'
        };
        
        const icone = icones[notificacao.tipo] || '📌';
        const elemento = document.createElement('div');
        elemento.className = `notification-item ${notificacao.lida ? 'lida' : ''}`;
        
        // Se tiver link, torna clicável
        const clickHandler = notificacao.link ? `onclick="window.location.href='${notificacao.link}'"` : '';
        const cursorStyle = notificacao.link ? 'cursor: pointer;' : '';
        
        elemento.innerHTML = `
            <div class="notification-icon">${icone}</div>
            <div class="notification-content" ${clickHandler} style="${cursorStyle}">
                <p class="notification-message">${notificacao.mensagem}</p>
                <p class="notification-time">${notificacao.data} às ${notificacao.hora}</p>
                ${notificacao.link ? `<span class="notification-link">Clique para ver detalhes →</span>` : ''}
            </div>
            <div class="notification-actions">
                ${!notificacao.lida ? 
                    `<button onclick="event.stopPropagation(); marcarComoLida(${notificacao.id})" class="btn-mark-read" title="Marcar como lida">✓</button>` : 
                    ''}
                <button onclick="event.stopPropagation(); excluirNotificacao(${notificacao.id})" class="btn-delete" title="Excluir">🗑️</button>
            </div>
        `;
        container.appendChild(elemento);
    });
    
    // Atualiza badge
    atualizarBadgeNotificacoes();
}

// Função para atualizar o badge de notificações não lidas
function atualizarBadgeNotificacoes() {
    const notificacoes = getNotificacoes();
    const naoLidas = notificacoes.filter(n => !n.lida).length;
    
    // Atualiza badge em todas as páginas
    const menuItems = document.querySelectorAll('a[href="notificacoes.html"]');
    menuItems.forEach(item => {
        let badge = /** @type {HTMLSpanElement | null} */ (item.querySelector('.notification-badge'));
        
        if (naoLidas > 0) {
            if (!badge) {
                badge = document.createElement('span');
                badge.className = 'notification-badge';
                item.appendChild(badge);
            }
            badge.textContent = naoLidas > 99 ? '99+' : String(naoLidas);
            badge.style.display = 'flex';
        } else if (badge) {
            badge.style.display = 'none';
        }
    });
}

// Verificar horários de rega periodicamente
function verificarHorariosRega() {
    const plantas = /** @type {Array<{ name: string, horarioRega?: string }>} */ (JSON.parse(localStorage.getItem('myPlants') || '[]'));
    const agora = new Date();
    
    plantas.forEach(planta => {
        if (planta.horarioRega) {
            const [hora, minuto] = planta.horarioRega.split(':');
            if (parseInt(hora) === agora.getHours() && parseInt(minuto) === agora.getMinutes()) {
                notificarHorarioRega(planta.name);
            }
        }
    });
}

// Inicializar a página
document.addEventListener('DOMContentLoaded', () => {
    atualizarListaNotificacoes();

    const markAllButton = document.getElementById('markAllReadButton');
    if (markAllButton) {
        markAllButton.addEventListener('click', marcarTodasComoLidas);
    }

    const clearAllButton = document.getElementById('clearAllButton');
    if (clearAllButton) {
        clearAllButton.addEventListener('click', eliminarTodasNotificacoes);
    }
    // Verificar horários de rega a cada minuto
    setInterval(verificarHorariosRega, 60000);
});