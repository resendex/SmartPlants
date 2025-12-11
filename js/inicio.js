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

// Função auxiliar para verificar se uma planta foi regada hoje (baseado no histórico)
function wasPlantWateredToday(plantId) {
    const key = `watering_history_${plantId}`;
    const history = JSON.parse(localStorage.getItem(key) || '[]');
    const today = getTodayDateString();
    return history.some(entry => entry.date === today);
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
    
    // Contar plantas regadas hoje (baseado no histórico)
    let plantasRegadasHoje = 0;
    plants.forEach(plant => {
        if (wasPlantWateredToday(plant.id)) {
            plantasRegadasHoje++;
        }
    });
    
    // Contar plantas que precisam de rega hoje
    // Verifica: 1) regas manuais agendadas, 2) sistema automático, 3) recorrências
    let precisamRegar = 0;
    plants.forEach((plant) => {
        const wasWateredToday = wasPlantWateredToday(plant.id);
        
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
            const wasWateredToday = wasPlantWateredToday(plant.id);
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

// Função para carregar plantas reais no dashboard
function carregarPlantasDashboard() {
    const plantsGrid = document.querySelector('.plants-grid');
    if (!plantsGrid) return;

    const plants = JSON.parse(localStorage.getItem('myPlants') || '[]');
    
    // Se não há plantas, mostrar mensagem
    if (plants.length === 0) {
        plantsGrid.innerHTML = `
            <div class="plant-item empty">
                <div class="plant-image">🌱</div>
                <div class="plant-name">Nenhuma planta</div>
                <div class="plant-status">Adicione plantas</div>
            </div>
        `;
        return;
    }

    // Mostrar até 4 plantas (limite do dashboard)
    const plantsToShow = plants.slice(0, 4);
    
    plantsGrid.innerHTML = '';
    
    plantsToShow.forEach(plant => {
        // Determinar status da planta
        let statusClass = 'healthy';
        let statusText = 'Saudável';
        
        if (plant.healthStatus === 'needs-water') {
            statusClass = 'needs-water';
            statusText = 'Precisa água';
        } else if (plant.healthStatus === 'unhealthy') {
            statusClass = 'unhealthy';
            statusText = 'Sob stress';
        }
        
        const plantItem = document.createElement('div');
        plantItem.className = 'plant-item';
        plantItem.onclick = () => {
            window.location.href = `minhasplantas.html?planta=${encodeURIComponent(plant.name)}`;
        };
        
        plantItem.innerHTML = `
            <div class="plant-image"><img src="${plant.image || ''}" alt="${plant.name}" style="width:3em;height:3em;object-fit:cover;border-radius:0.5em;" onerror="this.parentElement.innerHTML='🌱'"></div>
            <div class="plant-name">${plant.name}</div>
            <div class="plant-status ${statusClass}">${statusText}</div>
        `;
        
        plantsGrid.appendChild(plantItem);
    });
}

// Função para adicionar interatividade aos cards de planta
function configurarPlantas() {
    // Carregar plantas reais primeiro
    carregarPlantasDashboard();
    
    // Adicionar event listeners (já feito na carregarPlantasDashboard)
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

// Função para obter saudação baseada na hora do dia
function obterSaudacao() {
    const hora = new Date().getHours();
    const currentUser = JSON.parse(localStorage.getItem('sp_currentUser') || '{}');
    const nome = currentUser.username || '';
    
    let saudacao = '';
    let emoji = '';
    
    if (hora >= 5 && hora < 12) {
        saudacao = 'Bom dia';
        emoji = '☀️';
    } else if (hora >= 12 && hora < 19) {
        saudacao = 'Boa tarde';
        emoji = '🌤️';
    } else {
        saudacao = 'Boa noite';
        emoji = '🌙';
    }
    
    if (nome) {
        return `${saudacao}, ${nome}! ${emoji}`;
    }
    return `${saudacao}! ${emoji}`;
}

// Função para atualizar a saudação
function atualizarSaudacao() {
    const greetingElement = document.getElementById('greeting-message');
    if (greetingElement) {
        greetingElement.textContent = obterSaudacao();
    }
}

// Função para obter ícone do tempo baseado na condição
function obterIconeClima(weatherCode) {
    // Códigos da API Open-Meteo
    const iconMap = {
        0: '☀️',   // Céu limpo
        1: '🌤️',   // Principalmente limpo
        2: '⛅',   // Parcialmente nublado
        3: '☁️',   // Nublado
        45: '🌫️',  // Nevoeiro
        48: '🌫️',  // Nevoeiro com geada
        51: '🌧️',  // Chuviscos leves
        53: '🌧️',  // Chuviscos moderados
        55: '🌧️',  // Chuviscos intensos
        56: '🌧️',  // Chuviscos gelados leves
        57: '🌧️',  // Chuviscos gelados intensos
        61: '🌧️',  // Chuva leve
        63: '🌧️',  // Chuva moderada
        65: '🌧️',  // Chuva intensa
        66: '🌧️',  // Chuva gelada leve
        67: '🌧️',  // Chuva gelada intensa
        71: '❄️',  // Neve leve
        73: '❄️',  // Neve moderada
        75: '❄️',  // Neve intensa
        77: '❄️',  // Grãos de neve
        80: '🌦️',  // Aguaceiros leves
        81: '🌦️',  // Aguaceiros moderados
        82: '🌦️',  // Aguaceiros violentos
        85: '🌨️',  // Aguaceiros de neve leves
        86: '🌨️',  // Aguaceiros de neve intensos
        95: '⛈️',  // Trovoada
        96: '⛈️',  // Trovoada com granizo leve
        99: '⛈️',  // Trovoada com granizo intenso
    };
    return iconMap[weatherCode] || '🌡️';
}

// Função para obter coordenadas de uma cidade usando API de geocoding
async function obterCoordenadasCidade(cidade) {
    try {
        const response = await fetch(
            `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cidade)}&count=1&language=pt`
        );
        const data = await response.json();
        
        if (data.results && data.results.length > 0) {
            return {
                latitude: data.results[0].latitude,
                longitude: data.results[0].longitude,
                nome: data.results[0].name,
                pais: data.results[0].country
            };
        }
        return null;
    } catch (error) {
        console.error('Erro ao obter coordenadas:', error);
        return null;
    }
}

// Função para obter temperatura atual
async function obterTemperatura(latitude, longitude) {
    try {
        const response = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weather_code`
        );
        const data = await response.json();
        
        if (data.current) {
            return {
                temperatura: Math.round(data.current.temperature_2m),
                weatherCode: data.current.weather_code
            };
        }
        return null;
    } catch (error) {
        console.error('Erro ao obter temperatura:', error);
        return null;
    }
}

// Função principal para atualizar o widget de temperatura
async function atualizarTemperatura() {
    const weatherWidget = document.getElementById('weather-widget');
    const weatherIcon = document.getElementById('weather-icon');
    const weatherTemp = document.getElementById('weather-temp');
    const weatherLocation = document.getElementById('weather-location');
    
    if (!weatherWidget || !weatherIcon || !weatherTemp || !weatherLocation) return;
    
    weatherWidget.classList.add('loading');
    
    // Obter localização do perfil do utilizador
    const currentUser = JSON.parse(localStorage.getItem('sp_currentUser') || '{}');
    let cidade = currentUser.location;
    
    if (!cidade) {
        // Localização padrão se não tiver configurada
        cidade = 'Lisboa';
        weatherLocation.textContent = 'Lisboa (padrão)';
    }
    
    try {
        // Obter coordenadas da cidade
        const coordenadas = await obterCoordenadasCidade(cidade);
        
        if (!coordenadas) {
            throw new Error('Cidade não encontrada');
        }
        
        // Obter temperatura
        const clima = await obterTemperatura(coordenadas.latitude, coordenadas.longitude);
        
        if (!clima) {
            throw new Error('Não foi possível obter temperatura');
        }
        
        // Atualizar widget
        weatherIcon.textContent = obterIconeClima(clima.weatherCode);
        weatherTemp.textContent = `${clima.temperatura}°C`;
        weatherLocation.textContent = coordenadas.nome;
        weatherWidget.classList.remove('loading', 'error');
        
    } catch (error) {
        console.error('Erro ao atualizar temperatura:', error);
        weatherWidget.classList.add('error');
        weatherWidget.classList.remove('loading');
        weatherIcon.textContent = '🌡️';
        weatherTemp.textContent = 'Indisponível';
        weatherLocation.textContent = cidade || 'Defina a localização no perfil';
    }
}

// Inicializa tudo quando a página carregar
document.addEventListener('DOMContentLoaded', () => {
    console.log('🌱 Smart Plants Dashboard inicializado!');

    // ✅ NOVA: Notificação de nova mensagem no chat ao carregar a página
    setTimeout(() => {
        if (window.notificarNovaMensagem) {
            // Escolhe um usuário aleatório para simular nova mensagem (usando usuários que existem no chat)
            const usuariosAleatorios = [
                { name: 'PedroFlores328', avatar: '🌸', meta: '💦 Regou 3 vezes esta semana' },
                { name: 'MariaVerde', avatar: '🌿', meta: '🌱 12 plantas' },
                { name: 'CactoLover', avatar: '🌵', meta: '🏆 Especialista em Cactos' },
                { name: 'OrquideasPT', avatar: '🌺', meta: '📸 Compartilhou 8 fotos' },
                { name: 'JardimUrbano', avatar: '🪴', meta: '📍 Lisboa' },
                { name: 'SunflowerFan', avatar: '🌻', meta: '☀️ Plantas de exterior' }
            ];

            const usuarioEscolhido = usuariosAleatorios[Math.floor(Math.random() * usuariosAleatorios.length)];

            // Cria uma conversa real no localStorage
            const chatHistory = JSON.parse(localStorage.getItem('chatHistory') || '{}');
            const conversationId = `welcome_${usuarioEscolhido.name.toLowerCase()}`;

            // Verifica se já existe uma conversa de boas-vindas recente (últimas 24h)
            const existingConversation = chatHistory[conversationId];
            const now = new Date();
            const shouldCreateNew = !existingConversation ||
                !existingConversation.messages ||
                existingConversation.messages.length === 0 ||
                (now - new Date(existingConversation.createdAt || 0)) > (24 * 60 * 60 * 1000); // 24 horas

            if (shouldCreateNew) {
                // Cria conversa de boas-vindas
                const welcomeMessages = [
                    "Olá! Bem-vindo ao SmartPlants! 🌱 Vi que você está interessado em plantas.",
                    "Oi! Que bom ter você aqui! Quer dicas sobre jardinagem? 🌿",
                    "Olá! Sou apaixonado por plantas também! Vamos conversar? 🌸",
                    "Ei! Vi que você entrou no SmartPlants. Alguma dúvida sobre plantas? 🌵",
                    "Olá! Bem-vindo à comunidade! Que tipo de plantas você gosta? 🍎",
                    "Oi! Que bom ver você aqui! Vamos trocar experiências sobre plantas? 🌺"
                ];

                const randomMessage = welcomeMessages[Math.floor(Math.random() * welcomeMessages.length)];
                const messageTime = now.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' });

                chatHistory[conversationId] = {
                    id: conversationId,
                    user: usuarioEscolhido.name,
                    avatar: usuarioEscolhido.avatar,
                    meta: usuarioEscolhido.meta,
                    messages: [{
                        sender: usuarioEscolhido.name,
                        text: randomMessage,
                        time: messageTime
                    }],
                    createdAt: now.toISOString(),
                    unread: 1
                };

                // Salva no localStorage
                localStorage.setItem('chatHistory', JSON.stringify(chatHistory));

                // Atualiza o conversationsData se existir
                if (window.ChatSmartPlants && window.ChatSmartPlants.conversationsData) {
                    const conversationIndex = window.ChatSmartPlants.conversationsData.findIndex(c => c.id == conversationId);
                    if (conversationIndex >= 0) {
                        window.ChatSmartPlants.conversationsData[conversationIndex] = {
                            ...window.ChatSmartPlants.conversationsData[conversationIndex],
                            ...chatHistory[conversationId],
                            lastMessage: randomMessage,
                            time: messageTime,
                            unread: 1
                        };
                    } else {
                        window.ChatSmartPlants.conversationsData.push({
                            ...chatHistory[conversationId],
                            lastMessage: randomMessage,
                            time: messageTime,
                            unread: 1
                        });
                    }

                    // Atualiza a interface
                    if (typeof window.ChatSmartPlants.updateConversationCards === 'function') {
                        window.ChatSmartPlants.updateConversationCards();
                    }
                    if (typeof window.ChatSmartPlants.applyConversationFilters === 'function') {
                        setTimeout(() => {
                            window.ChatSmartPlants.applyConversationFilters();
                        }, 100);
                    }
                }

                console.log(`[inicio.js] Conversa de boas-vindas criada para ${usuarioEscolhido.name}`);
            }

            // Dispara a notificação
            window.notificarNovaMensagem(usuarioEscolhido.name);
            console.log(`[inicio.js] Notificação de nova mensagem simulada de ${usuarioEscolhido.name}`);
        }
    }, 2000); // Delay de 2 segundos para dar tempo da página carregar

    // Atualizar saudação e temperatura
    atualizarSaudacao();
    atualizarTemperatura();
    
    atualizarEstatisticas();
    configurarBotoesAlerta();
    configurarGrafico();
    configurarPlantas();
    rotacionarDicas();
    atualizarHorarios();
    
    // Atualiza horários a cada minuto
    setInterval(atualizarHorarios, 60000);
    
    // Atualiza saudação a cada minuto (para mudanças de período)
    setInterval(atualizarSaudacao, 60000);
    
    // Atualiza temperatura a cada 30 minutos
    setInterval(atualizarTemperatura, 30 * 60 * 1000);
    
    // Atualiza estatísticas quando a página volta ao foco
    window.addEventListener('focus', () => {
        atualizarEstatisticas();
        atualizarSaudacao();
    });
    
    // Atualiza estatísticas quando há mudanças no localStorage (de outras abas)
    window.addEventListener('storage', (e) => {
        if (e.key === 'myPlants' || e.key === 'regasHoje' || e.key === 'notificacoes' || e.key === 'atividades_recentes' || e.key === 'atividades_recentes_last_update') {
            console.info('[inicio.js] storage event:', e.key, e.newValue);
            atualizarEstatisticas();
            renderizarAtividadesRecentes();
        }
    });
    
    // Atualiza quando a página volta ao foco (útil quando volta de outras páginas)
    window.addEventListener('focus', () => {
        atualizarEstatisticas();
        renderizarAtividadesRecentes();
    });
    
    // Atualiza quando a página fica visível novamente
    document.addEventListener('visibilitychange', () => {
        if (!document.hidden) {
            atualizarEstatisticas();
            renderizarAtividadesRecentes();
        }
    });
    
    // Renderizar atividades recentes inicialmente
    renderizarAtividadesRecentes();

    // Fallback: checar timestamp de última atualização de atividades (caso storage event falhe)
    let lastActivitiesUpdate = localStorage.getItem('atividades_recentes_last_update');
    setInterval(() => {
        const ts = localStorage.getItem('atividades_recentes_last_update');
        console.info('[inicio.js] Polling - ts:', ts, 'last:', lastActivitiesUpdate);
        if (ts && ts !== lastActivitiesUpdate) {
            console.info('[inicio.js] Timestamp de atividades alterado, atualizando (interval)');
            lastActivitiesUpdate = ts;
            renderizarAtividadesRecentes();
        }
    }, 1000); // Mais frequente para testar
    
    // Escutar eventos customizados de atividades adicionadas (legado)
    window.addEventListener('atividadeAdicionada', (e) => {
        renderizarAtividadesRecentes();
    });

    // NOVO: Escutar evento customizado para atualização imediata
    window.addEventListener('atividadesRecentesAtualizadas', function () {
        console.info('[inicio.js] Evento customizado atividadesRecentesAtualizadas recebido, re-renderizando atividades.');
        renderizarAtividadesRecentes();
    });

    // NOVO: Escutar BroadcastChannel para cross-tab
    if (typeof BroadcastChannel !== 'undefined') {
        const bc = new BroadcastChannel('smartplants-atividades');
        bc.onmessage = function (e) {
            console.info('[inicio.js] BroadcastChannel message recebido:', e.data);
            if (e.data && e.data.type === 'atividadeAdicionada') {
                console.info('[inicio.js] BroadcastChannel atividadeAdicionada recebido com atividades:', e.data.atividades ? e.data.atividades.length : 'undefined');
                if (e.data.atividades) {
                    localStorage.setItem('atividades_recentes', JSON.stringify(e.data.atividades));
                    localStorage.setItem('atividades_recentes_last_update', Date.now().toString());
                }
                renderizarAtividadesRecentes();
            }
        };
        console.info('[inicio.js] BroadcastChannel listener adicionado');
    } else {
        console.warn('[inicio.js] BroadcastChannel não suportado');
    }
});

// Função para renderizar atividades recentes
function renderizarAtividadesRecentes() {
    const activityList = document.querySelector('.activity-list');
    if (!activityList) return;

    // Usar localStorage diretamente
    let raw = localStorage.getItem('atividades_recentes');
    console.info('[inicio.js] Conteúdo bruto localStorage.atividades_recentes:', raw);
    let atividades = [];
    try {
        atividades = JSON.parse(raw || '[]');
    } catch (e) {
        console.error('Erro ao obter atividades recentes:', e);
    }
    console.info('[inicio.js] renderizarAtividadesRecentes -> atividades lidas:', atividades.length);
    renderizarAtividadesHTML(atividades);

    // Renderizar atividades reais (prevalecem sobre exemplos estáticos)
    let html = '';
    if (atividades && atividades.length > 0) {
        console.info('[inicio.js] renderizarAtividadesRecentes - total:', atividades.length);
        atividades.forEach(atividade => {
            const iconeClass = atividade.icone || 'success';
            const iconeMap = {
                'add': '+',
                'success': '✓',
                'message': '💬'
            };
            const icone = iconeMap[iconeClass] || '✓';

            html += `
                <div class="activity-item">
                    <div class="activity-icon ${iconeClass}">${icone}</div>
                    <div class="activity-content">
                        <div class="activity-text">${atividade.texto}</div>
                        <div class="activity-time">${atividade.hora}</div>
                    </div>
                </div>
            `;
        });
    } else {
        // Não mostrar exemplos pré-definidos — mostrar mensagem limpa
        html = `
            <div class="no-activities">
                <div class="activity-empty">Sem atividades recentes</div>
            </div>
        `;
    }

    activityList.innerHTML = html;
}

function renderizarAtividadesHTML(atividades) {
    const activityList = document.querySelector('.activity-list');
    if (!activityList) return;
    // Renderizar
    let html = '';
    if (atividades && atividades.length > 0) {
        atividades.forEach(atividade => {
            const iconeClass = atividade.icone || 'success';
            const iconeMap = {
                'add': '+',
                'success': '✓',
                'message': '💬'
            };
            const icone = iconeMap[iconeClass] || '✓';

            html += `
                <div class="activity-item">
                    <div class="activity-icon ${iconeClass}">${icone}</div>
                    <div class="activity-content">
                        <div class="activity-text">${atividade.texto}</div>
                        <div class="activity-time">${atividade.hora}</div>
                    </div>
                </div>
            `;
        });
    } else {
        html = '<div class="activity-item empty"><div class="activity-content"><div class="activity-text">Sem atividades recentes</div></div></div>';
    }

    activityList.innerHTML = html;
}
