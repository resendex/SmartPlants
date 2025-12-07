// @ts-nocheck

document.addEventListener('DOMContentLoaded', () => {
    const plantsContainer = document.getElementById('plantsContainer');
    const saveButton = document.querySelector('.ButtonGuardar');
    const plants = JSON.parse(localStorage.getItem('myPlants') || '[]');

    // Renderizar plantas dinamicamente
    renderPlants();

    function renderPlants() {
        if (plants.length === 0) {
            plantsContainer.innerHTML = `
                <div class="no-plants">
                    <p>Você ainda não tem plantas registradas.</p>
                    <a href="add.html" class="btn-add">Adicionar Planta</a>
                </div>
            `;
            saveButton.style.display = 'none';
            return;
        }

        let html = '<h3>Qual(ais) da(s) planta(s) regou?</h3>';
        
        plants.forEach(plant => {
            const nextWatering = getNextWatering(plant.id);
            const irrigationWatering = getTodayIrrigationWatering(plant.id);
            
            let wateringInfo = '';
            
            // Prioridade: sistema de rega de hoje
            if (irrigationWatering) {
                wateringInfo = `
                    <div class="watering-info-container">
                        <span class="next-watering irrigation-watering">
                            <span class="irrigation-badge">Sistema Automático</span>
                            Rega agendada para hoje às ${irrigationWatering.time}
                        </span>
                        <button class="btn-remove-schedule" data-plant-id="${plant.id}" data-type="irrigation" title="Remover esta agenda do calendário">
                            🗑️ Remover Agenda
                        </button>
                    </div>
                `;
            } else if (nextWatering) {
                const isToday = isDateToday(nextWatering.date);
                const typeLabel = nextWatering.source === 'recurrence' ? 'Recorrente' : 'Manual';
                
                wateringInfo = `
                    <div class="watering-info-container">
                        <span class="next-watering ${nextWatering.source === 'recurrence' ? 'recurrence-watering' : ''}">
                            ${typeLabel}: ${isToday ? 'Hoje' : formatDate(nextWatering.date)} às ${nextWatering.time}
                        </span>
                        ${isToday ? `
                            <button class="btn-remove-schedule" data-plant-id="${plant.id}" data-date="${nextWatering.date}" data-type="manual" title="Remover esta agenda do calendário">
                                🗑️ Remover Agenda
                            </button>
                        ` : ''}
                    </div>
                `;
            } else {
                wateringInfo = '<span class="no-watering">Nenhuma rega agendada</span>';
            }
            
            html += `
                <div class="opcao">
                    <label>
                        <input type="checkbox" name="plantas" value="${plant.id}" data-plant-name="${plant.name}">
                        <span class="plant-name">${plant.name}</span>
                        ${wateringInfo}
                    </label>
                </div>
            `;
        });

        plantsContainer.innerHTML = html;
        
        // Adicionar event listeners aos botões de remover
        document.querySelectorAll('.btn-remove-schedule').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const plantId = btn.dataset.plantId;
                const type = btn.dataset.type;
                const date = btn.dataset.date;
                removeSchedule(plantId, type, date);
            });
        });
    }

    // Botão Guardar
    saveButton.addEventListener('click', () => {
        const checkedBoxes = document.querySelectorAll('input[name="plantas"]:checked');
        
        if (checkedBoxes.length === 0) {
            showModal('Aviso', 'Por favor, selecione pelo menos uma planta que foi regada.', 'warning');
            return;
        }

        const wateredPlants = [];
        checkedBoxes.forEach(checkbox => {
            const plantId = checkbox.value;
            const plantName = checkbox.dataset.plantName;
            const nextWatering = getNextWatering(plantId);
            
            wateredPlants.push({
                id: plantId,
                name: plantName,
                completedWatering: nextWatering
            });
        });

        showConfirmationModal(wateredPlants);
    });

    function showConfirmationModal(wateredPlants) {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';

        let plantsList = '';
        let hasSchedules = false;

        wateredPlants.forEach(plant => {
            const plantId = plant.id;
            const todayIrrigation = getTodayIrrigationWatering(plantId);
            const nextWatering = getNextWatering(plantId);
            const nextSchedule = getNextScheduleInfo(plantId);
            
            let scheduleInfo = '';
            
            // Verificar agenda para hoje
            if (todayIrrigation) {
                hasSchedules = true;
                scheduleInfo = `
                    <div class="schedule-info irrigation-schedule">
                        <span class="schedule-badge irrigation-badge">Sistema Automático</span>
                        <span class="schedule-text">Agendado para hoje às ${todayIrrigation.time}</span>
                    </div>
                `;
            } else if (nextWatering && isDateToday(nextWatering.date)) {
                hasSchedules = true;
                const typeLabel = nextWatering.source === 'recurrence' ? 'Recorrente' : 'Manual';
                scheduleInfo = `
                    <div class="schedule-info manual-schedule">
                        <span class="schedule-badge ${nextWatering.source === 'recurrence' ? 'recurrence-badge' : 'manual-badge'}">${typeLabel}</span>
                        <span class="schedule-text">Agendado para hoje às ${nextWatering.time}</span>
                    </div>
                `;
            } else if (nextSchedule) {
                scheduleInfo = `
                    <div class="schedule-info upcoming-schedule">
                        <span class="schedule-badge upcoming-badge">${nextSchedule.type}</span>
                        <span class="schedule-text">Próxima: ${nextSchedule.date} às ${nextSchedule.time}</span>
                    </div>
                `;
            } else {
                scheduleInfo = `
                    <div class="schedule-info no-schedule-info">
                        <span class="no-schedule-text">Sem agendamento registrado</span>
                    </div>
                `;
            }

            plantsList += `
                <li class="plant-schedule-item ${todayIrrigation ? 'has-irrigation' : ''}">
                    <strong>${plant.name}</strong>
                    ${scheduleInfo}
                </li>
            `;
        });

        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header ${hasSchedules ? 'success' : 'info'}">
                    <h3>${hasSchedules ? '✅ Confirmar Rega Realizada' : 'ℹ️ Confirmar Rega'}</h3>
                    <button class="close-btn">&times;</button>
                </div>
                <div class="modal-body">
                    <p class="modal-message">
                        As plantas selecionadas serão registradas como regadas:
                    </p>
                    <ul class="plants-list">
                        ${plantsList}
                    </ul>
                    <p class="modal-question">Deseja continuar?</p>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-cancel" id="cancelBtn">Cancelar</button>
                    <button class="btn btn-confirm" id="confirmBtn">Confirmar Rega</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Event listeners
        const closeBtn = modal.querySelector('.close-btn');
        const cancelBtn = modal.querySelector('#cancelBtn');
        const confirmBtn = modal.querySelector('#confirmBtn');

        closeBtn.addEventListener('click', () => document.body.removeChild(modal));
        cancelBtn.addEventListener('click', () => document.body.removeChild(modal));
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) document.body.removeChild(modal);
        });

        confirmBtn.addEventListener('click', () => {
            processWatering(wateredPlants);
            document.body.removeChild(modal);
        });
    }
    
    // NOVA FUNÇÃO: Obter informação da próxima agenda
    function getNextScheduleInfo(plantId) {
        const irrigationConfig = JSON.parse(localStorage.getItem(`irrigation_config_${plantId}`) || '{}');
        const waterings = JSON.parse(localStorage.getItem(`watering_${plantId}`) || '[]');
        
        let nextDates = [];
        
        // Verificar sistema de rega automática
        if (irrigationConfig.enabled && irrigationConfig.weeklyWatering) {
            const weeklyWatering = irrigationConfig.weeklyWatering || 3;
            const interval = Math.floor(7 / weeklyWatering);
            const irrigationDays = [];
            
            for (let i = 0; i < weeklyWatering; i++) {
                irrigationDays.push((i * interval) % 7);
            }
            
            // Procurar próxima data do sistema
            const today = new Date();
            for (let i = 1; i < 14; i++) {
                const checkDate = new Date(today);
                checkDate.setDate(today.getDate() + i);
                const checkDayOfWeek = checkDate.getDay();
                const dateStr = checkDate.toISOString().split('T')[0];
                
                const exceptions = JSON.parse(localStorage.getItem(`irrigation_exceptions_${plantId}`) || '[]');
                
                if (irrigationDays.includes(checkDayOfWeek) && !exceptions.includes(dateStr)) {
                    const override = waterings.find(w => w.date === dateStr && w.source === 'irrigation_override');
                    nextDates.push({
                        date: checkDate.toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit' }),
                        time: override ? override.time : irrigationConfig.wateringTime,
                        type: 'Sistema Automático',
                        dateObj: checkDate
                    });
                    break;
                }
            }
        }
        
        // Verificar agendamentos manuais e recorrentes
        const today = new Date();
        const todayStr = today.toISOString().split('T')[0];
        
        waterings
            .filter(w => !w.completed && w.date > todayStr && w.source !== 'irrigation_override')
            .forEach(w => {
                const wDate = new Date(w.date + 'T00:00:00');
                nextDates.push({
                    date: wDate.toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit' }),
                    time: w.time,
                    type: w.source === 'recurrence' ? 'Recorrente' : 'Manual',
                    dateObj: wDate
                });
            });
        
        // Ordenar e retornar a mais próxima
        if (nextDates.length > 0) {
            nextDates.sort((a, b) => a.dateObj - b.dateObj);
            return nextDates[0];
        }
        
        return null;
    }

    function processWatering(wateredPlants) {
        let completedCount = 0;
        let registeredTodayCount = 0;
        const today = new Date();
        const todayStr = today.toISOString().split('T')[0];
        const nowTime = today.toTimeString().slice(0, 5);

        wateredPlants.forEach(plant => {
            const key = `watering_${plant.id}`;
            const waterings = JSON.parse(localStorage.getItem(key) || '[]');
            
            // Verificar se há rega do sistema automático para hoje
            const todayIrrigation = getTodayIrrigationWatering(plant.id);
            
            if (todayIrrigation) {
                // É uma rega do sistema automático
                const existingWatering = waterings.find(w => w.date === todayStr && w.source === 'irrigation');
                
                if (existingWatering) {
                    // Já existe, marcar como completada
                    existingWatering.completed = true;
                    existingWatering.completedAt = new Date().toISOString();
                } else {
                    // Criar registro de rega do sistema automático como completada
                    waterings.push({ 
                        date: todayStr, 
                        time: todayIrrigation.time, 
                        source: 'irrigation',
                        completed: true, 
                        completedAt: new Date().toISOString() 
                    });
                }
                localStorage.setItem(key, JSON.stringify(waterings));
                completedCount++;
            } else if (plant.completedWatering) {
                // É uma rega manual/recorrente agendada
                markWateringAsCompleted(plant.id, plant.completedWatering.date, plant.completedWatering.time);
                completedCount++;
            } else {
                // Se não há rega agendada para hoje, registar rega manual no calendário
                const alreadyToday = waterings.some(w => w.date === todayStr);
                if (!alreadyToday) {
                    // Adiciona registo de rega manual para hoje
                    waterings.push({ date: todayStr, time: nowTime, completed: true, completedAt: new Date().toISOString() });
                    localStorage.setItem(key, JSON.stringify(waterings));
                    registeredTodayCount++;
                }
            }
            // Registrar histórico de rega
            registerWateringHistory(plant.id);
            
            // Remover notificações de rega para esta planta
            removeWateringNotifications(plant.id, plant.name);
        });
        
        // Atualizar estatísticas de rega de hoje
        atualizarEstatisticasRega(wateredPlants);

        // Mensagem de sucesso
        let message = '';
        if (completedCount > 0 && registeredTodayCount > 0) {
            message = `Rega confirmada! ${completedCount} rega(s) agendada(s) e ${registeredTodayCount} rega(s) manual(is) foram registadas no calendário.`;
        } else if (completedCount > 0) {
            message = `Rega confirmada! ${completedCount} rega(s) foi/foram realizada(s) com sucesso.`;
        } else if (registeredTodayCount > 0) {
            message = `A rega de hoje foi confirmada e registada no calendário!`;
        } else {
            message = 'Rega registada com sucesso!';
        }

        showModal('Sucesso', message, 'success');

        // Limpar seleções e re-renderizar
        setTimeout(() => {
            renderPlants();
        }, 1500);
    }

    // NOVO: Verificar se há rega do sistema automático para hoje
    function getTodayIrrigationWatering(plantId) {
        const irrigationConfig = JSON.parse(localStorage.getItem(`irrigation_config_${plantId}`) || '{}');
        
        if (!irrigationConfig.enabled || !irrigationConfig.weeklyWatering) {
            return null;
        }
        
        const today = new Date();
        const todayStr = today.toISOString().split('T')[0];
        const dayOfWeek = today.getDay();
        
        // Verificar se hoje é dia de rega do sistema
        const weeklyWatering = irrigationConfig.weeklyWatering || 3;
        const interval = Math.floor(7 / weeklyWatering);
        const irrigationDays = [];
        
        for (let i = 0; i < weeklyWatering; i++) {
            irrigationDays.push((i * interval) % 7);
        }
        
        if (!irrigationDays.includes(dayOfWeek)) {
            return null;
        }
        
        // Verificar se não foi desativado para hoje
        const exceptions = JSON.parse(localStorage.getItem(`irrigation_exceptions_${plantId}`) || '[]');
        if (exceptions.includes(todayStr)) {
            return null;
        }
        
        // Verificar se há override de hora ou se já foi completada
        const waterings = JSON.parse(localStorage.getItem(`watering_${plantId}`) || '[]');
        
        // Verificar se já foi regada hoje (sistema automático completado)
        const completedToday = waterings.find(w => w.date === todayStr && w.source === 'irrigation' && w.completed);
        if (completedToday) {
            return null; // Já foi regada, não mostrar novamente
        }
        
        const override = waterings.find(w => w.date === todayStr && w.source === 'irrigation_override');
        
        return {
            date: todayStr,
            time: override ? override.time : irrigationConfig.wateringTime,
            source: 'irrigation',
            isOverride: !!override
        };
    }

    function getNextWatering(plantId) {
        const key = `watering_${plantId}`;
        const waterings = JSON.parse(localStorage.getItem(key) || '[]');
        
        if (waterings.length === 0) return null;

        const today = new Date().toISOString().split('T')[0];

        // Ordenar por data (mais próxima primeiro)
        const sorted = waterings
            .filter(w => !w.completed && w.source !== 'irrigation_override') // Filtrar apenas não completadas e não override
            .map(w => ({
                date: w.date,
                time: w.time,
                source: w.source,
                dateObj: new Date(w.date + 'T' + w.time)
            }))
            .sort((a, b) => a.dateObj - b.dateObj);

        // Retornar a mais próxima de hoje
        const todayWatering = sorted.find(w => w.date === today);
        
        return todayWatering || null;
    }
    
    // NOVO: Verificar se data é hoje
    function isDateToday(dateStr) {
        const today = new Date().toISOString().split('T')[0];
        return dateStr === today;
    }
    
    // NOVO: Remover agenda do calendário
    function removeSchedule(plantId, type, date) {
        const plantName = plants.find(p => p.id === plantId)?.name || 'Planta';
        
        showConfirmModal(
            'Remover Agenda',
            `Deseja remover a agenda de rega de hoje para "${plantName}"?\n\nA rega não será mais lembrada no calendário.`,
            () => {
                if (type === 'irrigation') {
                    // Adicionar exceção para o sistema de rega
                    const todayStr = new Date().toISOString().split('T')[0];
                    const exceptions = JSON.parse(localStorage.getItem(`irrigation_exceptions_${plantId}`) || '[]');
                    if (!exceptions.includes(todayStr)) {
                        exceptions.push(todayStr);
                        localStorage.setItem(`irrigation_exceptions_${plantId}`, JSON.stringify(exceptions));
                    }
                } else {
                    // Remover agendamento manual
                    const waterings = JSON.parse(localStorage.getItem(`watering_${plantId}`) || '[]');
                    const filtered = waterings.filter(w => w.date !== date);
                    localStorage.setItem(`watering_${plantId}`, JSON.stringify(filtered));
                }
                
                showModal('Sucesso', 'Agenda removida com sucesso!', 'success');
                renderPlants();
            }
        );
    }
    
    // NOVO: Modal de confirmação genérico
    function showConfirmModal(title, message, onConfirm) {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header info">
                    <h3>${title}</h3>
                </div>
                <div class="modal-body">
                    <p style="white-space: pre-line;">${message}</p>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-cancel" id="cancelConfirmBtn">Cancelar</button>
                    <button class="btn btn-confirm" id="confirmConfirmBtn">Confirmar</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        
        modal.querySelector('#cancelConfirmBtn').addEventListener('click', () => {
            document.body.removeChild(modal);
        });
        
        modal.querySelector('#confirmConfirmBtn').addEventListener('click', () => {
            document.body.removeChild(modal);
            if (onConfirm) onConfirm();
        });
    }

    function markWateringAsCompleted(plantId, date, time) {
        const key = `watering_${plantId}`;
        const waterings = JSON.parse(localStorage.getItem(key) || '[]');
        
        // Marcar a rega específica como completada
        const updated = waterings.map(w => {
            if (w.date === date && w.time === time) {
                return { ...w, completed: true, completedAt: new Date().toISOString() };
            }
            return w;
        });
        
        localStorage.setItem(key, JSON.stringify(updated));
    }

    function registerWateringHistory(plantId) {
        const key = `watering_history_${plantId}`;
        const history = JSON.parse(localStorage.getItem(key) || '[]');
        
        history.push({
            date: new Date().toISOString().split('T')[0],
            time: new Date().toTimeString().slice(0, 5)
        });

        localStorage.setItem(key, JSON.stringify(history));
    }

    function showModal(title, message, type = 'info') {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';

        const icon = type === 'success' ? '✅' : type === 'warning' ? '⚠️' : 'ℹ️';

        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header ${type}">
                    <h3>${icon} ${title}</h3>
                </div>
                <div class="modal-body">
                    <p>${message}</p>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-primary" id="okBtn">OK</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        modal.querySelector('#okBtn').addEventListener('click', () => {
            document.body.removeChild(modal);
        });
    }

    function formatDate(dateStr) {
        const date = new Date(dateStr + 'T00:00:00');
        return date.toLocaleDateString('pt-PT', { 
            day: '2-digit', 
            month: '2-digit',
            year: 'numeric'
        });
    }
    
    // Função para atualizar estatísticas de rega no localStorage
    function atualizarEstatisticasRega(wateredPlants) {
        const today = new Date().toISOString().split('T')[0];
        
        // Buscar estatísticas existentes ou criar nova estrutura
        let regasHoje = JSON.parse(localStorage.getItem('regasHoje') || '{}');
        
        // Limpar dados de dias anteriores
        if (regasHoje.data !== today) {
            regasHoje = {
                data: today,
                plantas: []
            };
        }
        
        // Adicionar plantas regadas hoje (evitar duplicatas)
        wateredPlants.forEach(plant => {
            if (!regasHoje.plantas.includes(plant.id)) {
                regasHoje.plantas.push(plant.id);
            }
        });
        
        // Salvar no localStorage
        localStorage.setItem('regasHoje', JSON.stringify(regasHoje));
        
        // Disparar evento personalizado para atualizar dashboard em tempo real
        window.dispatchEvent(new Event('regasAtualizadas'));
    }
    
    // Função para remover notificações de rega para uma planta específica
    function removeWateringNotifications(plantId, plantName) {
        const notificacoes = JSON.parse(localStorage.getItem('notificacoes') || '[]');
        
        // Filtrar notificações que não sejam de rega para esta planta
        const filteredNotifications = notificacoes.filter(notif => {
            // Manter notificação se não for de rega OU se não mencionar o nome da planta
            return notif.tipo !== 'rega' || !notif.mensagem.includes(`"${plantName}"`);
        });
        
        // Salvar notificações filtradas
        localStorage.setItem('notificacoes', JSON.stringify(filteredNotifications));
        
        // Atualizar badge de notificações
        if (window.SmartPlantsNotifications && typeof window.SmartPlantsNotifications.atualizarBadge === 'function') {
            window.SmartPlantsNotifications.atualizarBadge();
        }
    }
});