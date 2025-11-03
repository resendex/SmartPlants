// Função para obter as notificações do localStorage
function getNotificacoes() {
    const notificacoes = localStorage.getItem('notificacoes');
    return notificacoes ? JSON.parse(notificacoes) : [];
}

// Função para salvar notificações no localStorage
function salvarNotificacoes(notificacoes) {
    localStorage.setItem('notificacoes', JSON.stringify(notificacoes));
}

// Função para adicionar uma nova notificação
function adicionarNotificacao(tipo, mensagem) {
    const notificacoes = getNotificacoes();
    const agora = new Date();
    
    const novaNotificacao = {
        id: Date.now(),
        tipo: tipo,
        mensagem: mensagem,
        data: agora.toLocaleDateString('pt-BR'),
        hora: agora.toLocaleTimeString('pt-BR'),
        lida: false
    };

    notificacoes.unshift(novaNotificacao); // Adiciona no início do array
    salvarNotificacoes(notificacoes);
    atualizarListaNotificacoes();
}

// Função para criar notificação de nova planta
function notificarNovaPlanta(nomePlanta) {
    adicionarNotificacao(
        'planta',
        `O usuário criou a planta "${nomePlanta}".`
    );
}

// Função para criar notificação de rega
function notificarHorarioRega(nomePlanta, horario) {
    adicionarNotificacao(
        'rega',
        `Hora de regar a planta "${nomePlanta}"!`
    );
}

// Função para marcar notificação como lida
function marcarComoLida(id) {
    const notificacoes = getNotificacoes();
    const index = notificacoes.findIndex(n => n.id === id);
    if (index !== -1) {
        notificacoes[index].lida = true;
        salvarNotificacoes(notificacoes);
        atualizarListaNotificacoes();
    }
}

// Função para excluir notificação
function excluirNotificacao(id) {
    const notificacoes = getNotificacoes().filter(n => n.id !== id);
    salvarNotificacoes(notificacoes);
    atualizarListaNotificacoes();
}

// Função para atualizar a lista de notificações na interface
function atualizarListaNotificacoes() {
    const container = document.getElementById('notificacoesContainer');
    const emptyState = document.getElementById('emptyState');
    const notificacoes = getNotificacoes();

    if (notificacoes.length === 0) {
        container.style.display = 'none';
        emptyState.style.display = 'block';
        return;
    }

    container.style.display = 'flex';
    emptyState.style.display = 'none';
    container.innerHTML = '';

    notificacoes.forEach(notificacao => {
        const icone = notificacao.tipo === 'planta' ? '🌱' : '💧';
        const elemento = document.createElement('div');
        elemento.className = `notification-item ${notificacao.lida ? 'lida' : ''}`;
        elemento.innerHTML = `
            <div class="notification-icon">${icone}</div>
            <div class="notification-content">
                <p class="notification-message">${notificacao.mensagem}</p>
                <p class="notification-time">${notificacao.data} às ${notificacao.hora}</p>
                <div class="notification-actions">
                    ${!notificacao.lida ? 
                        `<button onclick="marcarComoLida(${notificacao.id})" class="btn-mark-read">Marcar como lida</button>` : 
                        ''}
                    <button onclick="excluirNotificacao(${notificacao.id})" class="btn-delete">Excluir</button>
                </div>
            </div>
        `;
        container.appendChild(elemento);
    });
}

// Verificar horários de rega periodicamente
function verificarHorariosRega() {
    const plantas = JSON.parse(localStorage.getItem('plantas') || '[]');
    const agora = new Date();
    
    plantas.forEach(planta => {
        if (planta.horarioRega) {
            const [hora, minuto] = planta.horarioRega.split(':');
            if (parseInt(hora) === agora.getHours() && parseInt(minuto) === agora.getMinutes()) {
                notificarHorarioRega(planta.nome);
            }
        }
    });
}

// Inicializar a página
document.addEventListener('DOMContentLoaded', () => {
    atualizarListaNotificacoes();
    // Verificar horários de rega a cada minuto
    setInterval(verificarHorariosRega, 60000);
});