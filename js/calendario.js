// ========================================
// MÓDULO DE GESTÃO DE CONFLITOS
// ========================================

// Verificar se uma data específica tem conflito
function hasConflictOnDate(plantId, dateStr, excludeSource = null) {
    console.log('DEBUG hasConflictOnDate:', { plantId, dateStr, excludeSource });
    
    // Verificar sistema automático
    const irrigationConfig = JSON.parse(localStorage.getItem(`irrigation_config_${plantId}`) || '{}');
    console.log('DEBUG - Irrigation config:', irrigationConfig);
    
    if (irrigationConfig.enabled && irrigationConfig.weeklyWatering && excludeSource !== 'irrigation') {
        if (isIrrigationDay(irrigationConfig, dateStr)) {
            console.log('DEBUG - Conflito com sistema automático detectado!');
            return { hasConflict: true, source: 'irrigation', config: irrigationConfig };
        }
    }
    
    // Verificar recorrências
    const recurrences = JSON.parse(localStorage.getItem(`recurrences_${plantId}`) || '[]');
    const activeRecurrences = recurrences.filter(r => !r.stopped);
    console.log('DEBUG - Recorrências ativas:', activeRecurrences);
    
    if (excludeSource !== 'recurrence') {
        for (const rec of activeRecurrences) {
            if (isRecurrenceOccurrence(rec, dateStr)) {
                console.log('DEBUG - Conflito com recorrência detectado!', rec);
                return { hasConflict: true, source: 'recurrence', recurrence: rec };
            }
        }
    }
    
    // Verificar regas manuais
    const wateringData = JSON.parse(localStorage.getItem(`watering_${plantId}`) || '[]');
    console.log('DEBUG - Regas manuais:', wateringData);
    
    if (excludeSource !== 'manual') {
        const manualWatering = wateringData.find(w => w.date === dateStr && !w.source);
        if (manualWatering) {
            console.log('DEBUG - Conflito com rega manual detectado!', manualWatering);
            return { hasConflict: true, source: 'manual', watering: manualWatering };
        }
    }
    
    console.log('DEBUG - Nenhum conflito encontrado');
    return { hasConflict: false };
}

// Verificar se um sistema automático conflita com agendas existentes
function checkIrrigationSystemConflicts(plantId, weeklyWatering) {
    const conflicts = [];
    
    // Verificar próximos 30 dias
    const today = new Date();
    for (let i = 0; i < 30; i++) {
        const checkDate = new Date(today);
        checkDate.setDate(today.getDate() + i);
        const dateStr = toDateString(checkDate);
        
        // Simular se seria dia de rega do sistema
        const tempConfig = { enabled: true, weeklyWatering };
        if (isIrrigationDay(tempConfig, dateStr)) {
            const conflict = hasConflictOnDate(plantId, dateStr, 'irrigation');
            if (conflict.hasConflict) {
                conflicts.push({ date: dateStr, ...conflict });
            }
        }
    }
    
    return conflicts;
}

// Verificar se uma recorrência conflita com agendas existentes
function checkRecurrenceConflicts(plantId, startDate, intervalDays) {
    const conflicts = [];
    const start = new Date(startDate + 'T00:00:00');
    
    // Verificar próximas 10 ocorrências
    for (let i = 0; i < 10; i++) {
        const checkDate = new Date(start);
        checkDate.setDate(start.getDate() + (i * intervalDays));
        const dateStr = toDateString(checkDate);
        
        const conflict = hasConflictOnDate(plantId, dateStr, 'recurrence');
        if (conflict.hasConflict) {
            conflicts.push({ date: dateStr, occurrence: i + 1, ...conflict });
        }
    }
    
    return conflicts;
}

// Verificar se uma rega manual conflita
function checkManualWateringConflict(plantId, dateStr) {
    return hasConflictOnDate(plantId, dateStr, 'manual');
}

// Verificar se é dia de rega do sistema automático
function isIrrigationDay(config, dateStr) {
    if (!config || !config.enabled || !config.weeklyWatering) return false;
    
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

// Verificar se é ocorrência de recorrência
function isRecurrenceOccurrence(recurrence, dateStr) {
    if (dateStr < recurrence.startDate) return false;
    if (recurrence.excludedDates && recurrence.excludedDates.includes(dateStr)) return false;
    
    const d1 = new Date(recurrence.startDate + 'T00:00:00');
    const d2 = new Date(dateStr + 'T00:00:00');
    const diffDays = Math.round((d2 - d1) / (1000 * 60 * 60 * 24));
    
    return diffDays >= 0 && diffDays % recurrence.intervalDays === 0;
}

// Mostrar modal de conflito com opções
function showConflictModal(plantId, conflicts, actionType, actionData, onResolve) {
    const modal = document.createElement('div');
    modal.className = 'plant-selection-overlay';
    
    let conflictDescription = '';
    const conflictCount = conflicts.length;
    
    if (conflictCount > 0) {
        const sourceMap = {
            'irrigation': 'Sistema Automático',
            'recurrence': 'Rega Recorrente',
            'manual': 'Rega Manual'
        };
        
        const uniqueSources = [...new Set(conflicts.map(c => c.source))];
        const sourcesList = uniqueSources.map(s => sourceMap[s] || s).join(', ');
        
        conflictDescription = `
            <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 1em; border-radius: 6px; margin: 1em 0;">
                <strong>⚠️ ${conflictCount} Conflito(s) Detectado(s)</strong><br>
                <span style="color: #856404; font-size: 0.95em;">Com: ${sourcesList}</span>
            </div>
        `;
    }
    
    modal.innerHTML = `
        <div class="plant-selection-modal" style="max-width: 600px;">
            <h2 class="modal-title" style="color: #ff9800;">⚠️ Conflito de Agendamento</h2>
            
            <div style="padding: 1em 0;">
                <p style="color: #555; font-size: 1em; line-height: 1.6; margin-bottom: 1em;">
                    A ${actionType} que está a tentar criar conflita com agendas já existentes.
                </p>
                
                ${conflictDescription}
                
                <p style="color: #555; font-size: 1em; line-height: 1.6; margin: 1em 0;">
                    <strong>O que deseja fazer?</strong>
                </p>
            </div>

            <div style="display: flex; flex-direction: column; gap: 1em; margin-bottom: 1.5em;">
                <!-- Opção 1: Cancelar -->
                <div class="conflict-option" data-action="cancel" style="border: 2px solid #dc3545; border-radius: 0.8em; padding: 1.2em; cursor: pointer; transition: all 0.3s ease; background: rgba(220, 53, 69, 0.05);">
                    <div style="display: flex; align-items: center; gap: 1em;">
                        <div style="font-size: 2em;">❌</div>
                        <div style="flex: 1;">
                            <h3 style="margin: 0 0 0.3em 0; color: #dc3545; font-size: 1.1em;">Cancelar e Manter Agendas Existentes</h3>
                            <p style="margin: 0; color: #666; font-size: 0.9em;">
                                Não criar esta ${actionType} e manter todas as agendas atuais
                            </p>
                        </div>
                    </div>
                </div>

                <!-- Opção 2: Substituir -->
                <div class="conflict-option" data-action="replace" style="border: 2px solid #667eea; border-radius: 0.8em; padding: 1.2em; cursor: pointer; transition: all 0.3s ease; background: rgba(102, 126, 234, 0.05);">
                    <div style="display: flex; align-items: center; gap: 1em;">
                        <div style="font-size: 2em;">🔄</div>
                        <div style="flex: 1;">
                            <h3 style="margin: 0 0 0.3em 0; color: #667eea; font-size: 1.1em;">Substituir Agendas Conflitantes</h3>
                            <p style="margin: 0; color: #666; font-size: 0.9em;">
                                Remover agendas que causam conflito e criar esta ${actionType}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div class="modal-buttons">
                <button class="btn-modal btn-cancel" id="closeConflictModal">
                    Fechar
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    const closeModal = () => {
        if (document.body.contains(modal)) {
            document.body.removeChild(modal);
        }
    };
    
    modal.querySelector('#closeConflictModal').addEventListener('click', closeModal);
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });
    
    const options = modal.querySelectorAll('.conflict-option');
    options.forEach(option => {
        option.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-3px)';
            this.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
        });
        
        option.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
            this.style.boxShadow = 'none';
        });
        
        option.addEventListener('click', function() {
            const action = this.getAttribute('data-action');
            closeModal();
            
            if (action === 'cancel') {
                // Não fazer nada
                return;
            } else if (action === 'replace') {
                // Remover agendas conflitantes
                resolveConflicts(plantId, conflicts);
                // Executar ação original
                if (onResolve) onResolve(actionData);
            }
        });
    });
}

// Resolver conflitos removendo agendas conflitantes
function resolveConflicts(plantId, conflicts) {
    const uniqueDates = [...new Set(conflicts.map(c => c.date))];
    
    for (const conflict of conflicts) {
        if (conflict.source === 'irrigation') {
            // Desativar sistema automático
            const config = JSON.parse(localStorage.getItem(`irrigation_config_${plantId}`) || '{}');
            config.enabled = false;
            localStorage.setItem(`irrigation_config_${plantId}`, JSON.stringify(config));
        } else if (conflict.source === 'recurrence' && conflict.recurrence) {
            // Parar recorrência
            const recurrences = JSON.parse(localStorage.getItem(`recurrences_${plantId}`) || '[]');
            const rec = recurrences.find(r => r.id === conflict.recurrence.id);
            if (rec) rec.stopped = true;
            localStorage.setItem(`recurrences_${plantId}`, JSON.stringify(recurrences));
        } else if (conflict.source === 'manual') {
            // Remover rega manual
            const wateringData = JSON.parse(localStorage.getItem(`watering_${plantId}`) || '[]');
            const filtered = wateringData.filter(w => w.date !== conflict.date || w.source);
            localStorage.setItem(`watering_${plantId}`, JSON.stringify(filtered));
        }
    }
}

function toDateString(d) {
    return d.toISOString().split('T')[0];
}

// Função auxiliar para mostrar alertas estilizados
function showAlert(title, message) {
    const modal = document.createElement('div');
    modal.className = 'plant-selection-overlay';
    modal.innerHTML = `
        <div class="plant-selection-modal" style="max-width: 400px;">
            <h2 class="modal-title">${title}</h2>
            <div style="padding: 1em 0;">
                <p style="color: #555; font-size: 1.1em; line-height: 1.5; margin: 0;">${message}</p>
            </div>
            <div class="modal-buttons">
                <button class="btn-modal btn-confirm" id="alertOkBtn" style="width: 100%;">OK</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    
    const okBtn = modal.querySelector('#alertOkBtn');
    okBtn.addEventListener('click', () => {
        document.body.removeChild(modal);
    });
    
    // Permitir fechar com ESC
    const handleEsc = (e) => {
        if (e.key === 'Escape') {
            document.body.removeChild(modal);
            document.removeEventListener('keydown', handleEsc);
        }
    };
    document.addEventListener('keydown', handleEsc);
}

document.addEventListener('DOMContentLoaded', () => {
    // Garantir estrutura mínima (se calendário.html estiver vazio)
    ensureBaseLayout();

    let currentDate = new Date();
    let selectedPlantId = sessionStorage.getItem('selectedPlant');
    const plants = JSON.parse(localStorage.getItem('myPlants') || '[]');

    // Verificar se há parâmetros na URL para abrir modal de recorrência
    const urlParams = new URLSearchParams(window.location.search);
    const recurrenceDays = urlParams.get('recurrence');
    const plantIdFromUrl = urlParams.get('plantId');

    // Inserir conteúdo dinâmico dentro de .main-container
    const mainContainer = document.querySelector('.main-container');
    const existingContent = document.querySelector('main.content');
    if (existingContent) existingContent.remove();

    const mainContent = document.createElement('main');
    mainContent.className = 'content';
    mainContainer.appendChild(mainContent);

    // Seletor de plantas com botão para abrir modal
    const plantSelector = document.createElement('div');
    plantSelector.className = 'plant-selector';
    const currentPlant = plants.find(p => p.id == selectedPlantId);
    plantSelector.innerHTML = `
        <label for="plantSelectBtn">Planta Selecionada:</label>
        <button id="plantSelectBtn" class="btn btn-secondary" style="width: 100%; text-align: left; display: flex; justify-content: space-between; align-items: center;">
            <span>${currentPlant ? currentPlant.name : '-- Escolha uma planta --'}</span>
            <span style="font-size: 1.2em;">🌿</span>
        </button>
    `;
    mainContent.appendChild(plantSelector);

    // Botões extra
    const calendarControls = document.createElement('div');
    calendarControls.className = 'calendar-controls';
    calendarControls.innerHTML = `
        <button id="recurrenceBtn" class="btn btn-secondary">↻ Agendar recorrente</button>
    `;
    mainContent.appendChild(calendarControls);

    // Container calendário + painel info
    const calendarContainer = document.createElement('div');
    calendarContainer.className = 'calendar-container';
    mainContent.appendChild(calendarContainer);

    const infoPanel = document.createElement('div');
    infoPanel.className = 'info-panel';
    mainContent.appendChild(infoPanel);

    // Botão voltar
    const backButton = document.createElement('div');
    backButton.className = 'back-to-system';
    backButton.innerHTML = `
        <button id="backToSystemBtn" class="btn btn-back">
            <span class="btn-icon">←</span>
            Voltar
        </button>
    `;
    mainContent.appendChild(backButton);

    // Eventos
    document.getElementById('plantSelectBtn').addEventListener('click', () => {
        openPlantSelectionModal();
    });

    document.getElementById('recurrenceBtn').addEventListener('click', () => {
        if (!selectedPlantId) {
            showAlert('⚠️ Atenção', 'Selecione uma planta primeiro.');
            return;
        }
        openRecurrenceModal();
    });

    document.getElementById('backToSystemBtn').addEventListener('click', () => {
        if (selectedPlantId) {
            sessionStorage.setItem('selectedPlant', selectedPlantId);
        }
        // Voltar para a página anterior
        window.history.back();
    });

    // Inicial
    renderCalendar();
    updateInfoPanel();

    // Verificar se vem de "Minhas Plantas" com diagnóstico
    const fromDiagnostic = urlParams.get('fromDiagnostic');
    
    // Abrir modal de recorrência automaticamente se viemos da página de detalhes
    if (recurrenceDays && plantIdFromUrl) {
        setTimeout(() => {
            if (fromDiagnostic === 'true') {
                // Verificar conflito com sistema automático antes de criar recorrência
                checkDiagnosticConflictBeforeRecurrence(plantIdFromUrl, parseInt(recurrenceDays));
            } else {
                openRecurrenceModal(parseInt(recurrenceDays));
            }
        }, 500); // Pequeno delay para garantir que tudo está carregado
    }
    
    // Verificar conflito quando vem do diagnóstico
    function checkDiagnosticConflictBeforeRecurrence(plantId, days) {
        const irrigationConfig = JSON.parse(localStorage.getItem(`irrigation_config_${plantId}`) || '{}');
        const hasActiveIrrigation = irrigationConfig.enabled && irrigationConfig.weeklyWatering;
        
        if (hasActiveIrrigation) {
            // Sistema automático está ativo - não deveria acontecer, mas mostrar aviso
            const modal = document.createElement('div');
            modal.className = 'plant-selection-overlay';
            modal.innerHTML = `
                <div class="plant-selection-modal" style="max-width: 500px;">
                    <h2 class="modal-title" style="color: #dc3545;">⚠️ Erro: Sistema Já Configurado</h2>
                    
                    <div style="padding: 1em 0;">
                        <p style="color: #555; font-size: 1em; line-height: 1.6; margin-bottom: 1em;">
                            Esta planta já possui o <strong>Sistema Automático</strong> ativo com <strong>${irrigationConfig.weeklyWatering} regas por semana</strong>.
                        </p>
                        <p style="color: #555; font-size: 1em; line-height: 1.6; margin-bottom: 1em;">
                            Não é possível criar agenda personalizada com sistema automático ativo simultaneamente.
                        </p>
                        <p style="color: #667eea; font-size: 0.95em; line-height: 1.5; padding: 0.8em; background: rgba(102, 126, 234, 0.1); border-radius: 8px;">
                            💡 <strong>Dica:</strong> Volte para "Gestão do Sistema" e desative o sistema automático primeiro, ou mantenha apenas o sistema automático ativo.
                        </p>
                    </div>

                    <div class="modal-buttons" style="display: flex; gap: 0.5em;">
                        <button class="btn-modal btn-primary" id="goToSystemManagement" style="flex: 1; background: #667eea;">
                            Ir para Gestão do Sistema
                        </button>
                        <button class="btn-modal btn-cancel" id="closeErrorModal" style="flex: 1;">
                            Voltar
                        </button>
                    </div>
                </div>
            `;
            
            document.body.appendChild(modal);
            
            modal.querySelector('#goToSystemManagement').addEventListener('click', () => {
                sessionStorage.setItem('selectedPlant', plantId);
                window.location.href = 'sistema_rega.html';
            });
            
            modal.querySelector('#closeErrorModal').addEventListener('click', () => {
                document.body.removeChild(modal);
                window.location.href = 'minhasplantas.html';
            });
            
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    document.body.removeChild(modal);
                    window.location.href = 'minhasplantas.html';
                }
            });
        } else {
            // Não há conflito, pode criar a recorrência
            openRecurrenceModal(days);
        }
    }

    function renderCalendar() {
        if (!selectedPlantId) {
            calendarContainer.innerHTML = '<p class="warning">Por favor, selecione uma planta para ver o calendário.</p>';
            return;
        }

        // Carregar configuração do sistema de rega automática
        const irrigationConfig = getIrrigationConfig(selectedPlantId);

        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const prevLastDay = new Date(year, month, 0);
        const firstDayIndex = firstDay.getDay();
        const lastDayDate = lastDay.getDate();
        const prevLastDayDate = prevLastDay.getDate();
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        calendarContainer.innerHTML = '';

        // Header
        const header = document.createElement('div');
        header.className = 'calendar-header';
        header.innerHTML = `
            <button id="prevMonth" class="nav-btn">◀</button>
            <h2 class="month-year">${formatMonthName(month)} ${year}</h2>
            <button id="nextMonth" class="nav-btn">▶</button>
        `;
        calendarContainer.appendChild(header);

        // Semana
        const weekdays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
        const weekdaysRow = document.createElement('div');
        weekdaysRow.className = 'weekdays';
        weekdays.forEach(d => {
            const el = document.createElement('div');
            el.className = 'weekday';
            el.textContent = d;
            weekdaysRow.appendChild(el);
        });
        calendarContainer.appendChild(weekdaysRow);

        // Grid
        const daysGrid = document.createElement('div');
        daysGrid.className = 'days-grid';

        // Dias anteriores
        for (let x = firstDayIndex - 1; x >= 0; x--) {
            daysGrid.appendChild(createDayElement(prevLastDayDate - x, 'prev-month', null, true));
        }

        // Dias do mês
        for (let day = 1; day <= lastDayDate; day++) {
            const date = new Date(year, month, day);
            date.setHours(0, 0, 0, 0);
            const isPast = date < today;
            const isToday = date.getTime() === today.getTime();
            const dateStr = toDateString(date);
            daysGrid.appendChild(createDayElement(day, isToday ? 'today' : '', dateStr, isPast, irrigationConfig));
        }

        // Completar grade
        const totalCells = daysGrid.children.length;
        const remaining = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7);
        for (let i = 1; i <= remaining; i++) {
            daysGrid.appendChild(createDayElement(i, 'next-month', null, true));
        }

        calendarContainer.appendChild(daysGrid);

        // Navegação
        header.querySelector('#prevMonth').addEventListener('click', () => {
            currentDate.setMonth(currentDate.getMonth() - 1);
            renderCalendar();
        });
        header.querySelector('#nextMonth').addEventListener('click', () => {
            currentDate.setMonth(currentDate.getMonth() + 1);
            renderCalendar();
        });
    }

    function createDayElement(day, className, dateStr, isDisabled, irrigationConfig) {
        const dayEl = document.createElement('div');
        dayEl.className = `day ${className}`;
        const num = document.createElement('span');
        num.className = 'day-number';
        num.textContent = day;
        dayEl.appendChild(num);

        if (!isDisabled && dateStr) {
            const wateringData = getWateringData(selectedPlantId);
            let wateringInfo = wateringData.find(w => w.date === dateStr);

            if (!wateringInfo) {
                const rec = findRecurrenceOccurrence(selectedPlantId, dateStr);
                if (rec) {
                    wateringInfo = {
                        date: dateStr,
                        time: rec.time,
                        source: 'recurrence',
                        recurrenceId: rec.id,
                        intervalDays: rec.intervalDays
                    };
                }
            }

            // Verificar se é dia de rega do sistema automático
            const exceptions = getIrrigationExceptions(selectedPlantId);
            const isExcepted = exceptions.includes(dateStr);
            const isIrrigationDay = irrigationConfig && irrigationConfig.enabled && 
                                   isIrrigationOccurrence(irrigationConfig, dateStr) &&
                                   !isExcepted; // Não mostrar se foi desativado

            if (wateringInfo) {
                if (wateringInfo.completed) {
                    dayEl.classList.add('completed');
                    const chk = document.createElement('span');
                    chk.className = 'check-badge';
                    chk.textContent = '✓';
                    dayEl.appendChild(chk);
                    dayEl.addEventListener('click', () => openDayModal(dateStr, wateringInfo));
                } else {
                    // Se for irrigation_override, aplicar estilo de sistema de rega
                    if (wateringInfo.source === 'irrigation_override') {
                        dayEl.classList.add('marked', 'irrigation-watering');
                        const t = document.createElement('span');
                        t.className = 'time-badge irrigation-badge';
                        t.textContent = wateringInfo.time;
                        dayEl.appendChild(t);
                        const irrIcon = document.createElement('span');
                        irrIcon.className = 'irrigation-icon irrigation-edited';
                        irrIcon.textContent = '✎'; // Lápis para indicar personalização
                        dayEl.appendChild(irrIcon);
                        // Criar info do irrigation para o modal
                        const irrigationInfo = {
                            date: dateStr,
                            time: wateringInfo.time,
                            source: 'irrigation',
                            weeklyWatering: irrigationConfig ? irrigationConfig.weeklyWatering : null,
                            isOverride: true
                        };
                        dayEl.addEventListener('click', () => openDayModal(dateStr, irrigationInfo));
                    } else {
                        // Marcação normal ou recorrente
                        dayEl.classList.add('marked');
                        const t = document.createElement('span');
                        t.className = 'time-badge';
                        t.textContent = wateringInfo.time;
                        dayEl.appendChild(t);
                        if (wateringInfo.source === 'recurrence') {
                            const recIcon = document.createElement('span');
                            recIcon.className = 'recurrence-icon';
                            recIcon.textContent = '↻';
                            dayEl.appendChild(recIcon);
                        }
                        if (wateringInfo.source === 'irrigation') {
                            const irrIcon = document.createElement('span');
                            irrIcon.className = 'irrigation-icon';
                            irrIcon.textContent = '⚙';
                            dayEl.appendChild(irrIcon);
                        }
                        dayEl.addEventListener('click', () => openDayModal(dateStr, wateringInfo));
                    }
                }
            } else if (isIrrigationDay) {
                // Marcar dia do sistema de rega automática (sem override)
                dayEl.classList.add('marked', 'irrigation-watering');
                const t = document.createElement('span');
                t.className = 'time-badge irrigation-badge';
                t.textContent = irrigationConfig.wateringTime;
                dayEl.appendChild(t);
                const irrIcon = document.createElement('span');
                irrIcon.className = 'irrigation-icon';
                irrIcon.textContent = '⚙';
                dayEl.appendChild(irrIcon);
                const mockIrrigation = { 
                    date: dateStr, 
                    time: irrigationConfig.wateringTime, 
                    source: 'irrigation',
                    weeklyWatering: irrigationConfig.weeklyWatering,
                    isOverride: false
                };
                dayEl.addEventListener('click', () => openDayModal(dateStr, mockIrrigation));
            } else {
                // Dia vazio: abre modal rápida de agendamento
                dayEl.addEventListener('click', () => openQuickAddModal(dateStr));
            }
        } else {
            dayEl.classList.add('disabled');
        }
        return dayEl;
    }

    // Função para verificar se é dia de rega do sistema automático
    function isIrrigationOccurrence(config, dateStr) {
        if (!config || !config.enabled) return false;
        
        const targetDate = new Date(dateStr + 'T00:00:00');
        const dayOfWeek = targetDate.getDay(); // 0 = Domingo, 6 = Sábado
        
        // Calcular quais dias da semana devem ter rega baseado no número de regas por semana
        const weeklyWatering = config.weeklyWatering || 3;
        
        // Distribuir as regas uniformemente pela semana
        const irrigationDays = [];
        const interval = Math.floor(7 / weeklyWatering);
        
        for (let i = 0; i < weeklyWatering; i++) {
            irrigationDays.push((i * interval) % 7);
        }
        
        return irrigationDays.includes(dayOfWeek);
    }

    // Função para obter configuração do sistema de rega
    function getIrrigationConfig(plantId) {
        const key = `irrigation_config_${plantId}`;
        return JSON.parse(localStorage.getItem(key) || '{}');
    }

    // Modal rápida para marcar uma rega num dia vazio
    function openQuickAddModal(dateStr) {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        const date = new Date(dateStr + 'T00:00:00');
        modal.innerHTML = `
            <div class="modal-content small">
                <div class="modal-header">
                    <h3>Marcar rega (${formatDateShort(date)})</h3>
                    <button class="close-btn" aria-label="Fechar">&times;</button>
                </div>
                <div class="modal-body">
                    <label for="quickTime">Hora:</label>
                    <input type="time" id="quickTime" value="${new Date().toTimeString().slice(0,5)}">
                    <div style="display:flex;gap:.5rem;margin-top:.75rem;">
                        <button class="btn btn-primary" id="quickConfirm">Confirmar</button>
                        <button class="btn" id="quickCancel">Cancelar</button>
                    </div>
                </div>
            </div>`;
        document.body.appendChild(modal);

        const removeModal = () => modal.remove();
        modal.querySelector('.close-btn').addEventListener('click', removeModal);
        modal.addEventListener('click', e => { if (e.target === modal) removeModal(); });
        modal.querySelector('#quickCancel').addEventListener('click', removeModal);
        modal.querySelector('#quickConfirm').addEventListener('click', () => {
            const time = document.getElementById('quickTime').value;
            if (!time) { showAlert('⚠️ Atenção', 'Selecione uma hora.'); return; }
            
            // Verificar conflito antes de adicionar
            const conflict = checkManualWateringConflict(selectedPlantId, dateStr);
            console.log('DEBUG - Verificando conflito:', { plantId: selectedPlantId, dateStr, conflict });
            
            if (conflict.hasConflict) {
                console.log('DEBUG - Conflito detectado, mostrando modal');
                removeModal();
                showConflictModal(
                    selectedPlantId,
                    [{ date: dateStr, ...conflict }],
                    'rega manual',
                    { plantId: selectedPlantId, date: dateStr, time },
                    (data) => {
                        console.log('DEBUG - Resolvendo conflito e adicionando rega:', data);
                        addWatering(data.plantId, data.date, data.time);
                        renderCalendar();
                        updateInfoPanel();
                    }
                );
            } else {
                console.log('DEBUG - Nenhum conflito, adicionando rega diretamente');
                addWatering(selectedPlantId, dateStr, time);
                removeModal();
                renderCalendar();
                updateInfoPanel();
            }
        });
    }

    function openDayModal(dateStr, existingWatering) {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        const date = new Date(dateStr + 'T00:00:00');
        const formattedDate = formatDateLong(date);
        const plant = plants.find(p => p.id == selectedPlantId);

        const contentSingle = existingWatering ? `
            <p><strong>Hora da rega:</strong> ${existingWatering.time}</p>
            <div style="display:flex;gap:.5rem;flex-wrap:wrap;">
                <button class="btn btn-primary" id="editWatering">Editar hora</button>
                <button class="btn btn-danger" id="removeWatering">${existingWatering.completed ? 'Remover Registro' : 'Desmarcar Rega'}</button>
            </div>
            <div id="editForm" style="display:none;margin-top:.5rem;">
                <label for="editTime">Nova hora:</label>
                <input type="time" id="editTime" value="${existingWatering.time}">
                <button class="btn btn-primary" id="saveEdit">Guardar</button>
                <button class="btn" id="cancelEdit">Cancelar</button>
            </div>
        ` : `
            <p>Este modal completo agora só aparece para dias já marcados.</p>
        `;

        const contentRecurrence = existingWatering && existingWatering.source === 'recurrence' ? `
            <p><strong>Tipo:</strong> Rega automática a cada ${existingWatering.intervalDays} dia(s)</p>
            <p><strong>Hora:</strong> ${existingWatering.time}</p>
            <div style="display:flex;gap:.5rem;flex-wrap:wrap;">
                <button class="btn btn-danger" id="stopRecurrence">Interromper recorrência</button>
                <button class="btn btn-primary" id="skipRecurrenceOnce">Ignorar este dia</button>
            </div>
        ` : contentSingle;

        const contentIrrigation = existingWatering && existingWatering.source === 'irrigation' ? `
            <div class="irrigation-info">
                <p><strong>Sistema de Rega Automática</strong></p>
                <p><strong>Frequência:</strong> ${existingWatering.weeklyWatering} regas por semana</p>
                <p><strong>Hora:</strong> ${existingWatering.time} ${existingWatering.isOverride ? '<span style="color:#667eea;font-weight:700;">(Hora alterada)</span>' : ''}</p>
            </div>
            <div style="display:flex;gap:.5rem;flex-wrap:wrap;margin-top:1rem;">
                <button class="btn btn-primary" id="editIrrigationTime">${existingWatering.isOverride ? 'Alterar Hora Novamente' : 'Alterar Hora (só este dia)'}</button>
                <button class="btn btn-danger" id="disableIrrigationDay">Desativar (só este dia)</button>
                ${existingWatering.isOverride ? '<button class="btn btn-warning" id="restoreIrrigationTime">Restaurar Hora Original</button>' : ''}
            </div>
            <div id="editIrrigationForm" style="display:none;margin-top:1rem;padding:1rem;background:rgba(102,126,234,0.05);border-radius:8px;">
                <label for="editIrrigationTime">Nova hora para ${formatDateShort(date)}:</label>
                <input type="time" id="editIrrigationTimeInput" value="${existingWatering.time}" style="width:100%;padding:0.75rem;border:2px solid rgba(102,126,234,0.3);border-radius:8px;font-size:1rem;margin-top:0.5rem;">
                <div style="display:flex;gap:.5rem;margin-top:.75rem;">
                    <button class="btn btn-primary" id="saveIrrigationEdit">Guardar</button>
                    <button class="btn" id="cancelIrrigationEdit">Cancelar</button>
                </div>
            </div>
            <div style="margin-top:1rem;padding-top:1rem;border-top:2px solid rgba(0,0,0,0.1);">
                <button class="btn btn-secondary" id="goToIrrigationSystem">Gerir Sistema de Rega</button>
            </div>
        ` : contentRecurrence;

        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header ${existingWatering && existingWatering.source === 'irrigation' ? 'irrigation-header' : ''}">
                    <h3>${formattedDate}</h3>
                    <button class="close-btn">&times;</button>
                </div>
                <div class="modal-body">
                    <p><strong>Planta:</strong> ${plant ? plant.name : 'Desconhecida'}</p>
                    ${contentIrrigation}
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        modal.querySelector('.close-btn').addEventListener('click', () => modal.remove());
        modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });

        // Botão para ir à gestão do sistema de rega
        const goToSystemBtn = modal.querySelector('#goToIrrigationSystem');
        if (goToSystemBtn) {
            goToSystemBtn.addEventListener('click', () => {
                sessionStorage.setItem('selectedPlant', selectedPlantId);
                window.location.href = 'sistema_rega.html';
            });
        }

        // Botões para dias do sistema de rega automática
        const editIrrigationBtn = modal.querySelector('#editIrrigationTime');
        const disableIrrigationBtn = modal.querySelector('#disableIrrigationDay');
        const editIrrigationForm = modal.querySelector('#editIrrigationForm');
        
        if (editIrrigationBtn) {
            editIrrigationBtn.addEventListener('click', () => {
                if (editIrrigationForm) editIrrigationForm.style.display = 'block';
            });
        }

        if (disableIrrigationBtn) {
            disableIrrigationBtn.addEventListener('click', () => {
                if (confirm(`Desativar a rega automática para o dia ${formatDateShort(date)}?\n\nEsta rega não será realizada neste dia específico.`)) {
                    addIrrigationException(selectedPlantId, dateStr);
                    modal.remove();
                    renderCalendar();
                    updateInfoPanel();
                }
            });
        }

        const cancelIrrigationEdit = modal.querySelector('#cancelIrrigationEdit');
        const saveIrrigationEdit = modal.querySelector('#saveIrrigationEdit');
        
        if (cancelIrrigationEdit) {
            cancelIrrigationEdit.addEventListener('click', () => {
                if (editIrrigationForm) editIrrigationForm.style.display = 'none';
            });
        }

        if (saveIrrigationEdit) {
            saveIrrigationEdit.addEventListener('click', () => {
                const newTime = document.getElementById('editIrrigationTimeInput').value;
                if (!newTime) {
                    showAlert('⚠️ Atenção', 'Selecione uma hora.');
                    return;
                }
                // Criar um agendamento manual que sobrepõe o automático
                addWatering(selectedPlantId, dateStr, newTime, 'irrigation_override');
                modal.remove();
                renderCalendar();
                updateInfoPanel();
            });
        }

        const restoreIrrigationBtn = modal.querySelector('#restoreIrrigationTime');
        if (restoreIrrigationBtn) {
            restoreIrrigationBtn.addEventListener('click', () => {
                if (confirm(`Restaurar a hora original do sistema de rega para o dia ${formatDateShort(date)}?`)) {
                    // Remover a sobrescrita
                    removeWatering(selectedPlantId, dateStr);
                    modal.remove();
                    renderCalendar();
                    updateInfoPanel();
                }
            });
        }

        if (existingWatering && !existingWatering.source) {
            const rm = document.getElementById('removeWatering');
            if (rm) rm.addEventListener('click', () => {
                removeWatering(selectedPlantId, dateStr);
                modal.remove();
                renderCalendar();
                updateInfoPanel();
            });
            const editBtn = document.getElementById('editWatering');
            const editForm = document.getElementById('editForm');
            const cancelEdit = document.getElementById('cancelEdit');
            const saveEdit = document.getElementById('saveEdit');
            if (editBtn) editBtn.addEventListener('click', () => { if (editForm) editForm.style.display = 'block'; });
            if (cancelEdit) cancelEdit.addEventListener('click', () => { if (editForm) editForm.style.display = 'none'; });
            if (saveEdit) saveEdit.addEventListener('click', () => {
                const newTime = document.getElementById('editTime').value;
                if (!newTime) { showAlert('⚠️ Atenção', 'Selecione uma hora.'); return; }
                updateWateringTime(selectedPlantId, dateStr, newTime);
                modal.remove();
                renderCalendar();
                updateInfoPanel();
            });
        }

        if (existingWatering && existingWatering.source === 'recurrence') {
            const stopBtn = document.getElementById('stopRecurrence');
            const skipBtn = document.getElementById('skipRecurrenceOnce');
            if (stopBtn) stopBtn.addEventListener('click', () => {
                stopRecurrence(selectedPlantId, existingWatering.recurrenceId);
                modal.remove();
                renderCalendar();
                updateInfoPanel();
            });
            if (skipBtn) skipBtn.addEventListener('click', () => {
                addRecurrenceException(selectedPlantId, existingWatering.recurrenceId, dateStr);
                modal.remove();
                renderCalendar();
                updateInfoPanel();
            });
        }
    }

    function updateInfoPanel() {
        if (!selectedPlantId) { infoPanel.innerHTML = ''; return; }
        const plant = plants.find(p => p.id == selectedPlantId);
        const wateringData = getWateringData(selectedPlantId);
        const upcoming = wateringData
            .filter(w => !w.completed && new Date(w.date + 'T00:00:00') >= new Date(new Date().setHours(0,0,0,0)))
            .sort((a,b)=> new Date(a.date)-new Date(b.date))
            .slice(0,5);

        const recurrences = getRecurrences(selectedPlantId).filter(r => r.active);
        const irrigationConfig = getIrrigationConfig(selectedPlantId);

        infoPanel.innerHTML = `
            <h3>Próximas Regas - ${plant ? plant.name : 'Desconhecida'}</h3>
            ${irrigationConfig && irrigationConfig.enabled ? `
                <div class="irrigation-panel">
                    <h4>Sistema de Rega Automática Ativo</h4>
                    <div class="irrigation-summary">
                        <p><strong>Frequência:</strong> ${irrigationConfig.weeklyWatering} regas por semana</p>
                        <p><strong>Hora:</strong> ${irrigationConfig.wateringTime}</p>
                        ${hasIrrigationCustomizations(selectedPlantId) ? `
                            <p style="color:#ff9800;font-size:0.9rem;margin-top:0.5rem;">
                                ⚠️ Você tem ${countIrrigationCustomizations(selectedPlantId)} alterações personalizadas. 
                                Ao modificar as configurações do sistema, estas serão perdidas.
                            </p>` : ''}
                        <button class="btn btn-secondary btn-small" onclick="sessionStorage.setItem('selectedPlant', '${selectedPlantId}'); window.location.href='sistema_rega.html'">Gerir Sistema</button>
                    </div>
                </div>` : ''}
            ${upcoming.length ? `
                <ul class="watering-list">
                    ${upcoming.map(w => `
                        <li>
                            <span class="date">${formatDateShort(new Date(w.date + 'T00:00:00'))}</span>
                            <span class="time">${w.time}</span>
                        </li>
                    `).join('')}
                </ul>` : '<p>Nenhuma rega agendada manualmente.</p>'}
            ${recurrences.length ? `
                <div class="recurrence-panel">
                    <h4>Recorrências ativas</h4>
                    <ul class="recurrence-list">
                        ${recurrences.map(r => `
                            <li>
                                <span>↻ A cada ${r.intervalDays} dia(s) às ${r.time} (desde ${formatDateShort(new Date(r.startDate + 'T00:00:00'))})</span>
                                <button class="btn btn-danger btn-small" data-stop="${r.id}">Interromper</button>
                            </li>
                        `).join('')}
                    </ul>
                </div>` : ''}
        `;
        infoPanel.querySelectorAll('[data-stop]').forEach(btn => {
            btn.addEventListener('click', e => {
                stopRecurrence(selectedPlantId, e.currentTarget.getAttribute('data-stop'));
                renderCalendar(); updateInfoPanel();
            });
        });
    }

    // Recorrência helpers
    function getRecurrences(plantId) {
        return JSON.parse(localStorage.getItem(`watering_recurrences_${plantId}`) || '[]');
    }
    function saveRecurrences(plantId, list) {
        localStorage.setItem(`watering_recurrences_${plantId}`, JSON.stringify(list));
    }
    function addRecurrence(plantId, startDate, intervalDays, time) {
        const list = getRecurrences(plantId);
        list.push({ id:String(Date.now()), startDate, intervalDays:Number(intervalDays), time, active:true, excludedDates:[] });
        saveRecurrences(plantId, list);
    }
    function stopRecurrence(plantId, recurrenceId) {
        const list = getRecurrences(plantId);
        const r = list.find(x=>x.id===recurrenceId);
        if (r) { r.active = false; saveRecurrences(plantId, list); }
    }
    function addRecurrenceException(plantId, recurrenceId, dateStr) {
        const list = getRecurrences(plantId);
        const r = list.find(x=>x.id===recurrenceId);
        if (r && !r.excludedDates.includes(dateStr)) { r.excludedDates.push(dateStr); saveRecurrences(plantId, list); }
    }
    function findRecurrenceOccurrence(plantId, dateStr) {
        return getRecurrences(plantId).filter(r=>r.active).find(r => isOccurrence(r, dateStr)) || null;
    }
    function isOccurrence(recurrence, dateStr) {
        if (dateStr < recurrence.startDate) return false;
        if (recurrence.excludedDates.includes(dateStr)) return false;
        const d1 = new Date(recurrence.startDate + 'T00:00:00');
        const d2 = new Date(dateStr + 'T00:00:00');
        const diffDays = Math.round((d2 - d1)/(1000*60*60*24));
        return diffDays % recurrence.intervalDays === 0;
    }

    // Modal recorrência - modificado para aceitar parâmetro de dias
    function openRecurrenceModal(defaultDays = 2) {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        const todayStr = toDateString(new Date());
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Agendar recorrente</h3>
                    <button class="close-btn">&times;</button>
                </div>
                <div class="modal-body">
                    <label>Data de início:</label>
                    <input type="date" id="recStart" value="${todayStr}">
                    <label>A cada (dias):</label>
                    <input type="number" id="recEvery" min="1" value="${defaultDays}">
                    <label>Hora:</label>
                    <input type="time" id="recTime" value="08:00">
                    <button class="btn btn-primary" id="recConfirm">Ativar recorrência</button>
                </div>
            </div>`;
        document.body.appendChild(modal);
        modal.querySelector('.close-btn').addEventListener('click', ()=>modal.remove());
        modal.addEventListener('click', e => {
            if(e.target===modal) modal.remove();
        });
        modal.querySelector('#recConfirm').addEventListener('click', () => {
            const start = document.getElementById('recStart').value;
            const every = document.getElementById('recEvery').value;
            const time = document.getElementById('recTime').value;
            if(!start||!every||!time){
                showAlert('⚠️ Atenção', 'Preencha todos os campos.');
                return;
            }
            
            // Verificar conflitos antes de criar recorrência
            const conflicts = checkRecurrenceConflicts(selectedPlantId, start, parseInt(every));
            if (conflicts.length > 0) {
                modal.remove();
                showConflictModal(
                    selectedPlantId,
                    conflicts,
                    'rega recorrente',
                    { plantId: selectedPlantId, start, every, time },
                    (data) => {
                        addRecurrence(data.plantId, data.start, data.every, data.time);
                        renderCalendar();
                        updateInfoPanel();
                        // Mostrar sucesso apenas quando substituir
                        showAlert('✅ Sucesso', `Rega recorrente ativada: a cada ${data.every} dia(s) às ${data.time}h a partir de ${new Date(data.start+'T00:00:00').toLocaleDateString('pt-PT')}`);
                    }
                );
            } else {
                // Sem conflitos, mostrar sucesso normalmente
                addRecurrence(selectedPlantId, start, every, time);
                modal.remove();
                renderCalendar();
                updateInfoPanel();
                showAlert('✅ Sucesso', `Rega recorrente ativada: a cada ${every} dia(s) às ${time}h a partir de ${new Date(start+'T00:00:00').toLocaleDateString('pt-PT')}`);
            }
        });
    }

    // Helpers simples
    function getWateringData(plantId) {
        return JSON.parse(localStorage.getItem(`watering_${plantId}`) || '[]');
    }
    function addWatering(plantId, date, time, source = null) {
        const data = getWateringData(plantId);
        const existing = data.find(w => w.date === date);
        if (existing) {
            // Atualizar se já existe
            existing.time = time;
            if (source) existing.source = source;
        } else {
            // Adicionar novo
            const newWatering = { date, time, completed: false };
            if (source) newWatering.source = source;
            data.push(newWatering);
            
            // Adiciona notificação de evento de calendário (apenas para novos eventos)
            if (typeof window.notificarEventoCalendario === 'function') {
                const plant = plants.find(p => p.id == plantId);
                const plantName = plant ? plant.name : 'Planta';
                const formattedDate = new Date(date + 'T00:00:00').toLocaleDateString('pt-PT');
                window.notificarEventoCalendario(`Rega de ${plantName}`, formattedDate);
            }
        }
        localStorage.setItem(`watering_${plantId}`, JSON.stringify(data));
    }
    function removeWatering(plantId, date) {
        const data = getWateringData(plantId).filter(w=>w.date!==date);
        localStorage.setItem(`watering_${plantId}`, JSON.stringify(data));
    }
    // NOVO: atualizar hora de um registo existente
    function updateWateringTime(plantId, date, newTime) {
        const data = getWateringData(plantId);
        const idx = data.findIndex(w => w.date === date);
        if (idx !== -1) {
            data[idx].time = newTime;
            localStorage.setItem(`watering_${plantId}`, JSON.stringify(data));
        }
    }
    
    // Funções para exceções do sistema de rega automática
    function getIrrigationExceptions(plantId) {
        return JSON.parse(localStorage.getItem(`irrigation_exceptions_${plantId}`) || '[]');
    }
    function addIrrigationException(plantId, dateStr) {
        const exceptions = getIrrigationExceptions(plantId);
        if (!exceptions.includes(dateStr)) {
            exceptions.push(dateStr);
            localStorage.setItem(`irrigation_exceptions_${plantId}`, JSON.stringify(exceptions));
        }
    }
    
    // Verificar se há personalizações no sistema de rega
    function hasIrrigationCustomizations(plantId) {
        const exceptions = getIrrigationExceptions(plantId);
        const wateringData = JSON.parse(localStorage.getItem(`watering_${plantId}`) || '[]');
        const overrides = wateringData.filter(w => w.source === 'irrigation_override');
        return exceptions.length > 0 || overrides.length > 0;
    }
    
    // Contar personalizações
    function countIrrigationCustomizations(plantId) {
        const exceptions = getIrrigationExceptions(plantId);
        const wateringData = JSON.parse(localStorage.getItem(`watering_${plantId}`) || '[]');
        const overrides = wateringData.filter(w => w.source === 'irrigation_override');
        return exceptions.length + overrides.length;
    }
    function toDateString(d){ return d.toISOString().split('T')[0]; }
    function formatMonthName(m){
        return ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'][m];
    }
    function formatDateLong(d){
        return d.toLocaleDateString('pt-PT',{weekday:'long',year:'numeric',month:'long',day:'numeric'});
    }
    function formatDateShort(d){
        return d.toLocaleDateString('pt-PT',{day:'2-digit',month:'2-digit',year:'numeric'});
    }

    // Modal de seleção de planta
    function openPlantSelectionModal() {
        const plants = JSON.parse(localStorage.getItem('myPlants') || '[]');
        
        const modal = document.createElement('div');
        modal.className = 'plant-selection-overlay';
        
        if (plants.length === 0) {
            modal.innerHTML = `
                <div class="plant-selection-modal">
                    <h2 class="modal-title">Escolha uma Planta</h2>
                    
                    <div class="no-plants-message">
                        <div class="no-plants-icon">🌱</div>
                        <p><strong>Ainda não tem plantas cadastradas.</strong></p>
                        <p>Adicione sua primeira planta para começar!</p>
                    </div>
                    
                    <div class="modal-buttons">
                        <button class="btn-modal btn-add-plant" onclick="window.location.href='add.html'">
                            Adicionar Planta
                        </button>
                        <button class="btn-modal btn-cancel" id="cancelPlantModal">
                            Cancelar
                        </button>
                    </div>
                </div>
            `;
        } else {
            const plantOptions = plants.map(p => `
                <label class="plant-option" data-plant-id="${p.id}">
                    <input type="radio" name="plant" value="${p.id}" class="plant-radio" ${p.id == selectedPlantId ? 'checked' : ''}>
                    <span class="plant-name">${p.name}</span>
                    <span class="plant-icon">🌿</span>
                </label>
            `).join('');
            
            modal.innerHTML = `
                <div class="plant-selection-modal">
                    <h2 class="modal-title">Escolha uma Planta</h2>

                    <div class="plant-list" id="plantList">
                        ${plantOptions}
                    </div>

                    <div class="modal-buttons">
                        <button class="btn-modal btn-confirm" id="confirmPlantBtn" ${!selectedPlantId ? 'disabled' : ''}>
                            Confirmar Seleção
                        </button>
                    </div>

                    <div class="modal-buttons" style="margin-top: 1em;">
                        <button class="btn-modal btn-add-plant" onclick="window.location.href='add.html'">
                            Adicionar Planta
                        </button>
                        <button class="btn-modal btn-cancel" id="cancelPlantModal">
                            Cancelar
                        </button>
                    </div>
                </div>
            `;
        }
        
        document.body.appendChild(modal);
        
        // Event listeners
        const cancelBtn = modal.querySelector('#cancelPlantModal');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                document.body.removeChild(modal);
            });
        }
        
        const confirmBtn = modal.querySelector('#confirmPlantBtn');
        if (confirmBtn) {
            confirmBtn.addEventListener('click', () => {
                const selectedRadio = modal.querySelector('.plant-radio:checked');
                if (selectedRadio) {
                    selectedPlantId = selectedRadio.value;
                    sessionStorage.setItem('selectedPlant', selectedPlantId);
                    
                    // Atualizar botão de seleção
                    const currentPlant = plants.find(p => p.id == selectedPlantId);
                    const btn = document.getElementById('plantSelectBtn');
                    btn.querySelector('span').textContent = currentPlant ? currentPlant.name : '-- Escolha uma planta --';
                    
                    renderCalendar();
                    updateInfoPanel();
                    document.body.removeChild(modal);
                }
            });
        }
        
        // Adicionar classe selected ao clicar
        const plantOptions = modal.querySelectorAll('.plant-option');
        plantOptions.forEach(option => {
            if (option.querySelector('.plant-radio').checked) {
                option.classList.add('selected');
            }
            
            option.addEventListener('click', function(e) {
                if (e.target.tagName !== 'INPUT') {
                    const radio = this.querySelector('.plant-radio');
                    radio.checked = true;
                }
                
                plantOptions.forEach(opt => opt.classList.remove('selected'));
                this.classList.add('selected');
                
                if (confirmBtn) {
                    confirmBtn.disabled = false;
                }
            });
        });
        
        // Permitir clicar no radio button também
        const radios = modal.querySelectorAll('.plant-radio');
        radios.forEach(radio => {
            radio.addEventListener('change', function() {
                if (this.checked) {
                    const option = this.closest('.plant-option');
                    plantOptions.forEach(opt => opt.classList.remove('selected'));
                    option.classList.add('selected');
                    if (confirmBtn) {
                        confirmBtn.disabled = false;
                    }
                }
            });
        });
    }

    // Garantir que apenas o menu "Regar" fica ativo
    document.querySelectorAll('.menu-item, .menu a').forEach(item => item.classList.remove('active'));
    const regarLink = document.querySelector('.menu a[href="regar.html"], .menu-item[href="regar.html"]');
    if (regarLink) regarLink.classList.add('active');

    function ensureBaseLayout() {
        if (!document.querySelector('.main-container')) {
            const wrapper = document.createElement('div');
            wrapper.className = 'main-container';
            wrapper.innerHTML = `
                <aside class="sidebar">
                    <nav class="menu">
                        <a href="inicio.html" class="menu-item"><div class="menu-icon-placeholder">🏠</div><span>Início</span></a>
                        <a href="add.html" class="menu-item"><div class="menu-icon-placeholder">➕</div><span>Adicionar Planta</span></a>
                        <a href="notificacoes.html" class="menu-item"><div class="menu-icon-placeholder">🔔</div><span>Notificações</span></a>
                        <a href="regar.html" class="menu-item"><div class="menu-icon-placeholder">💧</div><span>Regar</span></a>
                        <a href="chat.html" class="menu-item"><div class="menu-icon-placeholder">💬</div><span>Chat</span></a>
                        <a href="minhasplantas.html" class="menu-item"><div class="menu-icon-placeholder">🌱</div><span>Minhas Plantas</span></a>
                    </nav>
                </aside>
            `;
            document.body.appendChild(wrapper);
            if (!document.querySelector('.header')) {
                const header = document.createElement('header');
                header.className = 'header';
                header.innerHTML = `
                    <div class="header-center"><h1 class="header-title">SMART PLANTS</h1></div>
                    <div class="header-right">
                        <a href="login.html" class="user-icon">
                            <div class="user-placeholder">👤</div>
                        </a>
                    </div>
                `;
                document.body.prepend(header);
            }
        }
    }
});
