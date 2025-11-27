// @ts-nocheck
// Dashboard Interativo - Smart Plants

/**
 * @typedef {Object} SmartPlant
 * @property {string|number} id
 * @property {string} [name]
 */

/**
 * @typedef {Object} WateringEntry
 * @property {string} date
 * @property {boolean} [completed]
 */

/**
 * @typedef {Object} RegasHoje
 * @property {string} [data]
 * @property {Array<string|number>} [plantas]
 */

/**
 * @typedef {Object} NotificationEntry
 * @property {boolean} [lida]
 */

// Função auxiliar para obter data de hoje no formato YYYY-MM-DD (sem problemas de fuso horário)
function getTodayDateString() {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

// Função auxiliar para verificar se é dia de rega do sistema automático
function isIrrigationDayForPlant(plantId, dateStr) {
    const config = JSON.parse(localStorage.getItem(`irrigation_config_${plantId}`) || '{}');
    if (!config || !config.enabled) return false;
    
    // Verificar exceções
    const exceptions = JSON.parse(localStorage.getItem(`irrigation_exceptions_${plantId}`) || '[]');
    if (exceptions.includes(dateStr)) return false;
    
    const targetDate = new Date(dateStr + 'T00:00:00');
    const dayOfWeek = targetDate.getDay();
    const weeklyWatering = config.weeklyWatering || 3;
    const interval = Math.floor(7 / weeklyWatering);
    
    const irrigationDays = [];
    for (let i = 0; i < weeklyWatering; i++) {
        irrigationDays.push((i * interval) % 7);
    }
    
    return irrigationDays.includes(dayOfWeek);
}

// Função auxiliar para verificar se há recorrência ativa para hoje
function hasRecurrenceToday(plantId, dateStr) {
    const recurrences = JSON.parse(localStorage.getItem(`recurrences_${plantId}`) || '[]');
    const activeRecurrences = recurrences.filter((r) => r.active !== false && !r.stopped);
    
    for (const rec of activeRecurrences) {
        if (dateStr < rec.startDate) continue;
        if (rec.excludedDates && rec.excludedDates.includes(dateStr)) continue;
        
        // Verificar se é ocorrência da recorrência
        if (rec.daysPerWeek) {
            const targetDate = new Date(dateStr + 'T00:00:00');
            const dayOfWeek = targetDate.getDay();
            const interval = Math.floor(7 / rec.daysPerWeek);
            const recDays = [];
            for (let i = 0; i < rec.daysPerWeek; i++) {
                recDays.push((i * interval) % 7);
            }
            if (recDays.includes(dayOfWeek)) return true;
        } else if (rec.intervalDays) {
            const start = new Date(rec.startDate + 'T00:00:00');
            const target = new Date(dateStr + 'T00:00:00');
            const diffDays = Math.floor((target.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
            if (diffDays >= 0 && diffDays % rec.intervalDays === 0) return true;
        }
    }
    return false;
}

// Função para obter estatísticas reais do localStorage
function obterEstatisticasReais() {
    /** @type {SmartPlant[]} */
    const plants = JSON.parse(localStorage.getItem('myPlants') || '[]');
    /** @type {NotificationEntry[]} */
    const notificacoes = JSON.parse(localStorage.getItem('notificacoes') || '[]');
    /** @type {RegasHoje} */
    const regasHoje = JSON.parse(localStorage.getItem('regasHoje') || '{}');
    
    // Usar formato de data correto (sem problemas de fuso horário)
    const today = getTodayDateString();
    
    // Contar plantas regadas hoje (dados reais do sistema de rega)
    let plantasRegadasHoje = 0;
    if (regasHoje.data === today && regasHoje.plantas) {
        plantasRegadasHoje = regasHoje.plantas.length;
    }
    
    // Contar plantas que precisam de rega hoje
    // Verifica: 1) regas manuais agendadas, 2) sistema automático, 3) recorrências
    let precisamRegar = 0;
    plants.forEach((plant) => {
        const wasWateredToday = regasHoje.plantas && regasHoje.plantas.includes(plant.id);
        
        // Se já foi regada hoje, não precisa
        if (wasWateredToday) return;
        
        /** @type {WateringEntry[]} */
        const wateringData = JSON.parse(localStorage.getItem(`watering_${plant.id}`) || '[]');
        
        // Verificar rega manual agendada para hoje
        const hasManualWateringToday = wateringData.some((w) => w.date === today && !w.completed);
        
        // Verificar sistema de rega automático
        const hasIrrigationToday = isIrrigationDayForPlant(plant.id, today);
        
        // Verificar recorrências
        const hasRecurrenceWateringToday = hasRecurrenceToday(plant.id, today);
        
        if (hasManualWateringToday || hasIrrigationToday || hasRecurrenceWateringToday) {
            precisamRegar++;
        }
    });
    
    // Se não há agendamentos para hoje, usar heurística (plantas não regadas há mais de 3 dias)
    if (precisamRegar === 0) {
        plants.forEach((plant) => {
            const wasWateredToday = regasHoje.plantas && regasHoje.plantas.includes(plant.id);
            if (wasWateredToday) return;
            
            /** @type {WateringEntry[]} */
            const wateringData = JSON.parse(localStorage.getItem(`watering_${plant.id}`) || '[]');
            const lastWatering = wateringData
                .filter((w) => w.completed)
                .sort((a, b) => b.date.localeCompare(a.date))[0];
            
            if (lastWatering) {
                const lastDate = new Date(lastWatering.date + 'T00:00:00');
                const todayDate = new Date(today + 'T00:00:00');
                const daysSinceWatering = Math.floor((todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
                if (daysSinceWatering >= 3) {
                    precisamRegar++;
                }
            } else {
                // Planta nunca foi regada, precisa de rega
                precisamRegar++;
            }
        });
    }
    
    return {
        totalPlantas: plants.length,
        regadasHoje: plantasRegadasHoje,
        precisamRegar: precisamRegar,
    notificacoes: notificacoes.filter((n) => !n.lida).length
    };
}

const ATIVIDADE_SEMANAL_PRESET = [3, 7, 5, 8, 6, 4, 2];

// Função para obter atividade semanal pré-configurada para cenários de teste
function obterAtividadeSemanalPreset() {
    return [...ATIVIDADE_SEMANAL_PRESET];
}

// Dados simulados (posteriormente podem vir de uma API/banco de dados)
const dashboardData = {
    stats: obterEstatisticasReais(), // Agora usa dados reais
    alertas: [
        {
            tipo: 'urgent',
            icone: '⚠️',
            titulo: 'Samambaia precisa de água!',
            tempo: 'Atrasada há 2 dias',
            acao: 'regar'
        },
        {
            tipo: 'warning',
            icone: '💧',
            titulo: 'Cacto - Próxima rega',
            tempo: 'Em 3 horas',
            acao: 'detalhes'
        },
        {
            tipo: 'info',
            icone: '🌿',
            titulo: 'Violeta Africana está ótima!',
            tempo: 'Última rega há 1 dia',
            acao: 'ver'
        }
    ],
    atividadeSemanal: obterAtividadeSemanalPreset(), // Segunda a Domingo (valores predefinidos)
    proximasRegas: [
        {
            dia: 'HOJE',
            hora: '15:00',
            planta: 'Violeta Africana',
            detalhes: 'Rega moderada - 200ml'
        },
        {
            dia: 'AMANHÃ',
            hora: '10:00',
            planta: 'Suculenta',
            detalhes: 'Rega leve - 50ml'
        },
        {
            dia: '12 NOV',
            hora: '09:00',
            planta: 'Orquídea',
            detalhes: 'Rega por imersão'
        }
    ],
    dicas: [
        'Sabia que regar as plantas de manhã cedo ajuda a evitar doenças fúngicas? A água tem tempo para evaporar antes do anoitecer!',
        'As plantas em vasos de barro precisam de mais água, pois a cerâmica é porosa e permite maior evaporação.',
        'Observe as folhas: folhas amareladas podem indicar excesso de água, enquanto folhas murchas indicam falta de água.',
        'A maioria das plantas prefere água em temperatura ambiente. Evite regar com água muito fria ou muito quente.',
        'Plantas suculentas e cactos precisam de menos água. Espere o solo secar completamente entre regas.'
    ]
};

// Função para atualizar estatísticas
function atualizarEstatisticas() {
    // Recarregar estatísticas reais
    dashboardData.stats = obterEstatisticasReais();
    dashboardData.atividadeSemanal = obterAtividadeSemanalPreset();
    const stats = dashboardData.stats;
    
    // Atualiza os números (com animação)
    animarNumero('.stat-card-link:nth-child(1) .stat-number', stats.totalPlantas);
    animarNumero('.stat-card-link:nth-child(2) .stat-number', stats.regadasHoje);
    animarNumero('.stat-card-link:nth-child(3) .stat-number', stats.precisamRegar);
    animarNumero('.stat-card-link:nth-child(4) .stat-number', stats.notificacoes);

    atualizarGraficoAtividade();
}

// Função para animar números
/**
 * @param {string} seletor
 * @param {number} valorFinal
 */
function animarNumero(seletor, valorFinal) {
    const elemento = document.querySelector(seletor);
    if (!elemento) return;
    
    let valorAtual = 0;
    const incremento = valorFinal / 20;
    const intervalo = setInterval(() => {
        valorAtual += incremento;
        if (valorAtual >= valorFinal) {
            elemento.textContent = valorFinal;
            clearInterval(intervalo);
        } else {
            elemento.textContent = Math.floor(valorAtual);
        }
    }, 50);
}

// Função para adicionar eventos aos botões de alerta
function configurarBotoesAlerta() {
    const botoesAlerta = document.querySelectorAll('.alert-action');
    
    botoesAlerta.forEach((botao, index) => {
        botao.addEventListener('click', () => {
            const alerta = dashboardData.alertas[index];
            
            if (alerta.acao === 'regar') {
                // Redireciona para página de regar
                window.location.href = 'regar.html';
            } else if (alerta.acao === 'detalhes') {
                // Redireciona para página de detalhes da planta
                window.location.href = 'minhasplantas.html';
            } else {
                // Mostra um alerta simples
                mostrarNotificacao('Planta saudável! Continue com os bons cuidados! 🌱');
            }
        });
    });
}

// Remove alert cards that reference plants the user doesn't have
function filterAlertsByUserPlants() {
    try {
        const plants = JSON.parse(localStorage.getItem('myPlants') || '[]');
        const plantNames = plants.map(p => (p.name || '').toLowerCase());

        const alertsContainer = document.querySelector('.alerts-container');
        if (!alertsContainer) return;

        const alertCards = Array.from(alertsContainer.querySelectorAll('.alert-card'));

        alertCards.forEach(card => {
            const titleEl = card.querySelector('.alert-title');
            const titleText = titleEl ? titleEl.textContent.toLowerCase() : card.textContent.toLowerCase();

            // If any plant name appears in the alert title, keep it. Otherwise remove the card.
            const matches = plantNames.some(name => name && titleText.includes(name));

            if (!matches) {
                card.remove();
            }
        });

        // If after filtering there are no alerts, optionally hide the alerts section
        const remaining = alertsContainer.querySelectorAll('.alert-card').length;
        if (remaining === 0) {
        const alertsSection = /** @type {HTMLElement | null} */ (document.querySelector('.alerts-section'));
        if (alertsSection) alertsSection.style.display = 'none';
        }
    } catch (err) {
        console.error('Erro ao filtrar alertas por plantas do utilizador:', err);
    }
}

// Função para mostrar notificação temporária
/**
 * @param {string} mensagem
 */
function mostrarNotificacao(mensagem) {
    // Cria elemento de notificação
    const notificacao = document.createElement('div');
    notificacao.style.cssText = `
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
    `;
    notificacao.textContent = mensagem;
    
    // Adiciona ao body
    document.body.appendChild(notificacao);
    
    // Remove após 3 segundos
    setTimeout(() => {
        notificacao.style.animation = 'slideOut 0.5s ease';
        setTimeout(() => notificacao.remove(), 500);
    }, 3000);
}

// Função para adicionar interatividade às barras do gráfico
function configurarGrafico() {
    const barras = /** @type {NodeListOf<HTMLElement & { tooltip?: HTMLDivElement }>} */ (document.querySelectorAll('.bar'));
    const dias = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];
    
    atualizarGraficoAtividade();

    barras.forEach((barra, index) => {
        const valor = dashboardData.atividadeSemanal[index];
        
        // Adiciona tooltip ao passar o mouse
        barra.addEventListener('mouseenter', (event) => {
            const tooltip = document.createElement('div');
            tooltip.className = 'chart-tooltip';
            const valorAtual = Number(barra.getAttribute('data-value') || valor || 0);
            tooltip.textContent = `${dias[index]}: ${valorAtual} plantas regadas`;
            tooltip.style.cssText = `
                position: absolute;
                background: #333;
                color: white;
                padding: 0.5em 1em;
                border-radius: 0.5em;
                font-size: 0.85em;
                white-space: nowrap;
                pointer-events: none;
                z-index: 100;
                left: ${/** @type {MouseEvent} */ (event).pageX}px;
                top: ${/** @type {MouseEvent} */ (event).pageY - 40}px;
            `;
            document.body.appendChild(tooltip);
            barra.tooltip = tooltip;
        });
        
        barra.addEventListener('mouseleave', () => {
            if (barra.tooltip) {
                barra.tooltip.remove();
                delete barra.tooltip;
            }
        });
    });
}

function atualizarGraficoAtividade() {
    const barras = /** @type {NodeListOf<HTMLElement>} */ (document.querySelectorAll('.bar'));
    if (!barras.length) return;

    const valores = dashboardData.atividadeSemanal;
    const maximo = Math.max(...valores, 1);

    barras.forEach((barra, index) => {
        const valor = valores[index] ?? 0;
        const alturaMin = valores.some((v) => v > 0) ? 30 : 8;
        const alturaUtil = 160; // px úteis dentro dos 200px do gráfico
        const alturaPx = valor > 0 ? (valor / maximo) * alturaUtil + alturaMin : alturaMin;
        barra.style.height = `${Math.round(alturaPx)}px`;
        barra.setAttribute('data-value', valor.toString());
        barra.setAttribute('aria-label', `Regas em ${index + 1}º dia da semana: ${valor}`);
    });
}

// Função para adicionar interatividade aos cards de planta
function configurarPlantas() {
    const plantItems = document.querySelectorAll('.plant-item');
    
    plantItems.forEach(item => {
        item.addEventListener('click', () => {
            const nomePlanta = item.querySelector('.plant-name').textContent;
            window.location.href = `minhasplantas.html?planta=${encodeURIComponent(nomePlanta)}`;
        });
    });
}

// Função para rotacionar dicas do dia
function rotacionarDicas() {
    const tipText = document.querySelector('.tip-text');
    if (!tipText) return;
    
    let indiceAtual = 0;
    
    setInterval(() => {
        indiceAtual = (indiceAtual + 1) % dashboardData.dicas.length;
        
        // Animação de fade
        tipText.style.opacity = '0';
        
        setTimeout(() => {
            tipText.textContent = dashboardData.dicas[indiceAtual];
            tipText.style.transition = 'opacity 0.5s ease';
            tipText.style.opacity = '1';
        }, 500);
        
    }, 10000); // Muda a cada 10 segundos
}

// Função para atualizar horários dinâmicos
function atualizarHorarios() {
    const agora = new Date();
    const horaAtual = agora.getHours();
    const minutoAtual = agora.getMinutes();
    
    // Verifica se há regas próximas
    const scheduleItems = document.querySelectorAll('.schedule-item');
    scheduleItems.forEach(item => {
        const timeValue = item.querySelector('.time-value');
        if (timeValue) {
            const [hora, minuto] = timeValue.textContent.split(':').map(Number);
            const tempoRestante = (hora * 60 + minuto) - (horaAtual * 60 + minutoAtual);
            
            if (tempoRestante > 0 && tempoRestante <= 60) {
                // Se falta menos de 1 hora, adiciona classe de destaque
                item.style.background = 'rgba(255, 215, 0, 0.2)';
                item.style.borderLeft = '0.3em solid #ffd700';
            }
        }
    });
}

// Adiciona animação CSS para notificações
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
    
    .chart-tooltip {
        animation: fadeIn 0.3s ease;
    }
    
    @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
    }
`;
document.head.appendChild(style);

// Inicializa tudo quando a página carregar
document.addEventListener('DOMContentLoaded', () => {
    console.log('🌱 Smart Plants Dashboard inicializado!');
    
    atualizarEstatisticas();
    configurarBotoesAlerta();
    configurarGrafico();
    configurarPlantas();
    rotacionarDicas();
    atualizarHorarios();
    
    // Atualiza horários a cada minuto
    setInterval(atualizarHorarios, 60000);
    
    // Atualiza estatísticas quando a página volta ao foco
    window.addEventListener('focus', () => {
        atualizarEstatisticas();
    });
    
    // Atualiza estatísticas quando há mudanças no localStorage (de outras abas)
    window.addEventListener('storage', (e) => {
        if (e.key === 'myPlants' || e.key === 'notificacoes') {
            atualizarEstatisticas();
        }
    });
});

// Exporta funções para uso em outras partes do código
window.SmartPlantsDashboard = {
    atualizarEstatisticas,
    mostrarNotificacao,
    dashboardData
};
