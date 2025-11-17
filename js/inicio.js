// Dashboard Interativo - Smart Plants

// Função para obter estatísticas reais do localStorage
function obterEstatisticasReais() {
    const plants = JSON.parse(localStorage.getItem('myPlants') || '[]');
    const notificacoes = JSON.parse(localStorage.getItem('notificacoes') || '[]');
    const regasHoje = JSON.parse(localStorage.getItem('regasHoje') || '{}');
    
    const today = new Date().toISOString().split('T')[0];
    
    // Contar plantas regadas hoje (dados reais do sistema de rega)
    let plantasRegadasHoje = 0;
    if (regasHoje.data === today && regasHoje.plantas) {
        plantasRegadasHoje = regasHoje.plantas.length;
    }
    
    // Contar plantas que precisam de rega
    // Verifica calendário de cada planta e identifica as que têm rega agendada para hoje mas não foram regadas
    let precisamRegar = 0;
    plants.forEach(plant => {
        const wateringData = JSON.parse(localStorage.getItem(`watering_${plant.id}`) || '[]');
        const hasWateringToday = wateringData.some(w => w.date === today && !w.completed);
        const wasWateredToday = regasHoje.plantas && regasHoje.plantas.includes(plant.id);
        
        if (hasWateringToday && !wasWateredToday) {
            precisamRegar++;
        }
    });
    
    // Se não há agendamentos, usar heurística (plantas não regadas há mais de 3 dias)
    if (precisamRegar === 0) {
        plants.forEach(plant => {
            const wateringData = JSON.parse(localStorage.getItem(`watering_${plant.id}`) || '[]');
            const lastWatering = wateringData
                .filter(w => w.completed)
                .sort((a, b) => new Date(b.date) - new Date(a.date))[0];
            
            if (lastWatering) {
                const daysSinceWatering = Math.floor((new Date(today) - new Date(lastWatering.date)) / (1000 * 60 * 60 * 24));
                if (daysSinceWatering >= 3) {
                    precisamRegar++;
                }
            } else {
                // Planta nunca foi regada, precisa de rega
                const wasWateredToday = regasHoje.plantas && regasHoje.plantas.includes(plant.id);
                if (!wasWateredToday) {
                    precisamRegar++;
                }
            }
        });
    }
    
    return {
        totalPlantas: plants.length,
        regadasHoje: plantasRegadasHoje,
        precisamRegar: precisamRegar,
        notificacoes: notificacoes.filter(n => !n.lida).length
    };
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
    atividadeSemanal: [6, 8, 4, 9, 7, 5, 4], // Segunda a Domingo
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
    const stats = dashboardData.stats;
    
    // Atualiza os números (com animação)
    animarNumero('.stat-card-link:nth-child(1) .stat-number', stats.totalPlantas);
    animarNumero('.stat-card-link:nth-child(2) .stat-number', stats.regadasHoje);
    animarNumero('.stat-card-link:nth-child(3) .stat-number', stats.precisamRegar);
    animarNumero('.stat-card-link:nth-child(4) .stat-number', stats.notificacoes);
}

// Função para animar números
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

// Função para mostrar notificação temporária
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
    const barras = document.querySelectorAll('.bar');
    const dias = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];
    
    barras.forEach((barra, index) => {
        const valor = dashboardData.atividadeSemanal[index];
        
        // Adiciona tooltip ao passar o mouse
        barra.addEventListener('mouseenter', (e) => {
            const tooltip = document.createElement('div');
            tooltip.className = 'chart-tooltip';
            tooltip.textContent = `${dias[index]}: ${valor} plantas regadas`;
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
                left: ${e.pageX}px;
                top: ${e.pageY - 40}px;
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
