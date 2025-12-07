// @ts-nocheck

document.addEventListener('DOMContentLoaded', () => {
    const plantSelectBtn = document.getElementById('plantSelectBtn');
    const selectedPlantNameSpan = document.getElementById('selectedPlantName');
    const configSection = document.getElementById('configSection');
    const noPlantMessage = document.getElementById('noPlantMessage');
    const weeklyWateringInput = document.getElementById('weeklyWatering');
    const wateringTimeInput = document.getElementById('wateringTime');
    const saveButton = document.getElementById('saveButton');
    const viewCalendarBtn = document.getElementById('viewCalendarBtn');
    
    // Elementos do status card
    const statusCard = document.getElementById('statusCard');
    const statusIconSimple = document.getElementById('statusIconSimple');
    const statusTitle = document.getElementById('statusTitle');
    const statusDetail = document.getElementById('statusDetail');
    const toggleStatusBtn = document.getElementById('toggleStatusBtn');

    // CORREÇÃO: definir plantas e seleção inicial
    let plants = JSON.parse(localStorage.getItem('myPlants') || '[]');
    let selectedPlantId = null;

    let currentEnabled = true;
    let lastSensorStatus = 'ok';

    // Verificar se há uma planta pré-selecionada do sessionStorage
    const preSelectedPlantId = sessionStorage.getItem('selectedPlant');
    if (preSelectedPlantId) {
        selectedPlantId = preSelectedPlantId;
        // NÃO limpar do sessionStorage aqui - pode ser necessário para outras operações
    }

    // Verificar se há parâmetros na URL (vindo de minhas plantas)
    const urlParams = new URLSearchParams(window.location.search);
    const plantIdFromUrl = urlParams.get('plantId');
    const frequencyFromUrl = urlParams.get('frequency');
    
    if (plantIdFromUrl) {
        selectedPlantId = plantIdFromUrl;
        sessionStorage.setItem('selectedPlant', plantIdFromUrl);
    }

    loadPlants();
    
    // Se veio com frequência predefinida da recomendação (4 vezes por semana)
    if (frequencyFromUrl && selectedPlantId) {
        // Aguardar um pouco para garantir que o DOM está pronto
        setTimeout(() => {
            // Definir 4 regas por semana conforme recomendação do diagnóstico
            weeklyWateringInput.value = 4;
            
            // Verificar se há agendas existentes e mostrar aviso
            checkAndShowDiagnosticWarning(selectedPlantId);
        }, 100);
    }

    // Event Listeners
    plantSelectBtn.addEventListener('click', openPlantSelectionModal);
    saveButton.addEventListener('click', saveConfiguration);
    toggleStatusBtn.addEventListener('click', handleToggleStatus);
    if (viewCalendarBtn) {
        viewCalendarBtn.addEventListener('click', openCalendar);
    }
    
    const clearSchedulesBtn = document.getElementById('clearSchedulesBtn');
    if (clearSchedulesBtn) {
        clearSchedulesBtn.addEventListener('click', () => confirmClearAllSchedules(selectedPlantId));
    }

    function loadPlants() {
        // Recarrega sempre do localStorage (caso tenha mudado noutra página)
        plants = JSON.parse(localStorage.getItem('myPlants') || '[]');

        if (!plants.length) {
            selectedPlantNameSpan.textContent = 'Nenhuma planta disponível';
            selectedPlantId = null;
            configSection.classList.remove('active');
            noPlantMessage.classList.remove('hidden');
            return;
        }

        if (selectedPlantId) {
            const plant = plants.find(p => p.id == selectedPlantId);
            if (plant) {
                selectedPlantNameSpan.textContent = plant.name;
                handlePlantChange(selectedPlantId);
            } else {
                // Planta não encontrada
                selectedPlantNameSpan.textContent = '-- Escolha uma planta --';
                configSection.classList.remove('active');
                noPlantMessage.classList.remove('hidden');
            }
        } else {
            // Nenhuma planta selecionada
            selectedPlantNameSpan.textContent = '-- Escolha uma planta --';
            configSection.classList.remove('active');
            noPlantMessage.classList.remove('hidden');
        }
    }

    function handlePlantChange(plantId) {
        selectedPlantId = plantId;

        if (!selectedPlantId) {
            configSection.classList.remove('active');
            noPlantMessage.classList.remove('hidden');
            return;
        }

        configSection.classList.add('active');
        noPlantMessage.classList.add('hidden');

        loadConfiguration(selectedPlantId);
        simulateSensorAnalysis();
    }

    function simulateSensorAnalysis() {
        const sensorStatus = 'ok';
        lastSensorStatus = sensorStatus;
        updateEnabledUI(currentEnabled, sensorStatus === 'ok');
    }

    function loadConfiguration(plantId) {
        const key = `irrigation_config_${plantId}`;
        const config = JSON.parse(localStorage.getItem(key) || '{}');
        weeklyWateringInput.value = config.weeklyWatering || 3;
        wateringTimeInput.value = config.wateringTime || '08:00';
        currentEnabled = config.enabled !== false;
        updateEnabledUI(currentEnabled, lastSensorStatus === 'ok');
        updateStatusCard(config);
        updateActiveSchedulesSection(plantId);
    }
    
    // Mostrar aviso quando vem do diagnóstico
    function checkAndShowDiagnosticWarning(plantId) {
        const hasSchedules = hasAnySchedules(plantId);
        
        if (hasSchedules) {
            const scheduleCount = countAllSchedules(plantId);
            showConfirmModal(
                '⚠️ Aviso do Diagnóstico',
                `Esta planta possui ${scheduleCount} rega(s) agendada(s). Para aplicar a recomendação do diagnóstico (4 regas por semana), todas as regas atuais serão desfeitas. Deseja continuar?`,
                () => {
                    // Usuário confirmou - limpar todas as agendas e materializar a nova
                    clearAllSchedulesForPlant(plantId);
                    materializeDiagnosticSchedule(plantId);
                    showModal('Sucesso', 'Recomendação do diagnóstico aplicada com sucesso! 4 regas por semana foram agendadas.', 'success');
                    loadConfiguration(plantId);
                },
                () => {
                    // Usuário cancelou - voltar para minhas plantas
                    window.location.href = 'minhasplantas.html';
                }
            );
        } else {
            // Não há agendas existentes, materializar diretamente
            materializeDiagnosticSchedule(plantId);
            showModal('Sucesso', 'Recomendação do diagnóstico aplicada! 4 regas por semana foram agendadas.', 'success');
            loadConfiguration(plantId);
        }
    }
    
    // Materializar a agenda recomendada do diagnóstico
    function materializeDiagnosticSchedule(plantId) {
        const config = {
            enabled: true,
            weeklyWatering: 4,
            wateringTime: '08:00'
        };
        
        const key = `irrigation_config_${plantId}`;
        localStorage.setItem(key, JSON.stringify(config));
        
        // Atualizar os campos do formulário
        weeklyWateringInput.value = 4;
        wateringTimeInput.value = '08:00';
        currentEnabled = true;
        
        // Notificar sistema de rega ativado
        if (typeof window.notificarSistemaRega === 'function') {
            const plants = JSON.parse(localStorage.getItem('myPlants') || '[]');
            const plant = plants.find(p => p.id == plantId);
            if (plant) {
                window.notificarSistemaRega(plant.name, 4);
            }
        }
    }
    
    // Verificar se há qualquer tipo de agenda
    function hasAnySchedules(plantId) {
        const wateringData = JSON.parse(localStorage.getItem(`watering_${plantId}`) || '[]');
        const recurrences = JSON.parse(localStorage.getItem(`recurrences_${plantId}`) || '[]');
        const irrigationConfig = JSON.parse(localStorage.getItem(`irrigation_config_${plantId}`) || '{}');
        
        const futureWaterings = wateringData.filter(w => !w.completed && w.date >= new Date().toISOString().split('T')[0]);
        const activeRecurrences = recurrences.filter(r => !r.stopped);
        const hasActiveIrrigation = irrigationConfig.enabled && irrigationConfig.weeklyWatering;
        
        return futureWaterings.length > 0 || activeRecurrences.length > 0 || hasActiveIrrigation;
    }
    
    // Contar todas as agendas
    function countAllSchedules(plantId) {
        const wateringData = JSON.parse(localStorage.getItem(`watering_${plantId}`) || '[]');
        const recurrences = JSON.parse(localStorage.getItem(`recurrences_${plantId}`) || '[]');
        const irrigationConfig = JSON.parse(localStorage.getItem(`irrigation_config_${plantId}`) || '{}');
        
        const futureWaterings = wateringData.filter(w => !w.completed && w.date >= new Date().toISOString().split('T')[0]);
        const activeRecurrences = recurrences.filter(r => !r.stopped);
        const irrigationCount = (irrigationConfig.enabled && irrigationConfig.weeklyWatering) ? 1 : 0;
        
        return futureWaterings.length + activeRecurrences.length + irrigationCount;
    }
    
    // Atualizar seção de calendarização ativa
    function updateActiveSchedulesSection(plantId) {
        const activeSchedulesSection = document.getElementById('activeSchedulesSection');
        const activeSchedulesList = document.getElementById('activeSchedulesList');
        const clearSchedulesBtn = document.getElementById('clearSchedulesBtn');
        
        if (!activeSchedulesSection || !activeSchedulesList) return;
        
        const wateringData = JSON.parse(localStorage.getItem(`watering_${plantId}`) || '[]');
        const recurrences = JSON.parse(localStorage.getItem(`recurrences_${plantId}`) || '[]');
        const irrigationConfig = JSON.parse(localStorage.getItem(`irrigation_config_${plantId}`) || '{}');
        
        const futureWaterings = wateringData.filter(w => !w.completed && w.date >= new Date().toISOString().split('T')[0]);
        const activeRecurrences = recurrences.filter(r => !r.stopped);
        const hasActiveIrrigation = irrigationConfig.enabled && irrigationConfig.weeklyWatering;
        
        let html = '';
        
        // Sistema automático
        if (hasActiveIrrigation) {
            html += `
                <div class="schedule-item">
                    <span class="schedule-icon">⚙️</span>
                    <div class="schedule-info">
                        <strong>Sistema Automático</strong>
                        <span>${irrigationConfig.weeklyWatering}x por semana às ${irrigationConfig.wateringTime}</span>
                    </div>
                    <button class="btn-remove-schedule" onclick="removeIrrigationSystem(${plantId})" title="Desmarcar">
                        ✕
                    </button>
                </div>
            `;
        }
        
        // Recorrências
        activeRecurrences.forEach((rec, index) => {
            html += `
                <div class="schedule-item">
                    <span class="schedule-icon">↻</span>
                    <div class="schedule-info">
                        <strong>Rega Recorrente</strong>
                        <span>${rec.daysPerWeek || rec.intervalDays} ${rec.daysPerWeek ? 'dia(s) por semana' : 'dia(s) de intervalo'} às ${rec.time}</span>
                    </div>
                    <button class="btn-remove-schedule" onclick="removeRecurrence(${plantId}, ${rec.id})" title="Desmarcar">
                        ✕
                    </button>
                </div>
            `;
        });
        
        // Regas manuais futuras
        if (futureWaterings.length > 0) {
            html += `
                <div class="schedule-item">
                    <span class="schedule-icon">📅</span>
                    <div class="schedule-info">
                        <strong>Regas Manuais</strong>
                        <span>${futureWaterings.length} rega(s) agendada(s)</span>
                    </div>
                    <button class="btn-remove-schedule" onclick="removeManualWaterings(${plantId})" title="Desmarcar todas">
                        ✕
                    </button>
                </div>
            `;
        }
        
        if (html) {
            activeSchedulesList.innerHTML = html;
            activeSchedulesSection.style.display = 'block';
            // Esconder o botão geral
            clearSchedulesBtn.style.display = 'none';
        } else {
            activeSchedulesSection.style.display = 'none';
        }
    }
    
    // Funções globais para remover agendas individuais
    window.removeIrrigationSystem = function(plantId) {
        showConfirmModal(
            'Desmarcar Sistema Automático',
            'Tem certeza que deseja desativar o sistema automático de rega?',
            () => {
                const irrigationConfig = JSON.parse(localStorage.getItem(`irrigation_config_${plantId}`) || '{}');
                irrigationConfig.enabled = false;
                irrigationConfig.weeklyWatering = 0;
                localStorage.setItem(`irrigation_config_${plantId}`, JSON.stringify(irrigationConfig));
                
                showModal('Sucesso', 'Sistema automático desativado.', 'success');
                loadConfiguration(plantId);
            }
        );
    };
    
    window.removeRecurrence = function(plantId, recurrenceId) {
        showConfirmModal(
            'Desmarcar Rega Recorrente',
            'Tem certeza que deseja remover esta rega recorrente?',
            () => {
                let recurrences = JSON.parse(localStorage.getItem(`recurrences_${plantId}`) || '[]');
                recurrences = recurrences.filter(r => r.id !== recurrenceId);
                localStorage.setItem(`recurrences_${plantId}`, JSON.stringify(recurrences));
                
                showModal('Sucesso', 'Rega recorrente removida.', 'success');
                loadConfiguration(plantId);
            }
        );
    };
    
    window.removeManualWaterings = function(plantId) {
        const wateringData = JSON.parse(localStorage.getItem(`watering_${plantId}`) || '[]');
        const futureCount = wateringData.filter(w => !w.completed && w.date >= new Date().toISOString().split('T')[0]).length;
        
        showConfirmModal(
            'Desmarcar Regas Manuais',
            `Tem certeza que deseja remover ${futureCount} rega(s) manual(is) agendada(s)?`,
            () => {
                // Manter apenas regas completadas ou passadas
                const updated = wateringData.filter(w => w.completed || w.date < new Date().toISOString().split('T')[0]);
                localStorage.setItem(`watering_${plantId}`, JSON.stringify(updated));
                
                showModal('Sucesso', 'Regas manuais removidas.', 'success');
                loadConfiguration(plantId);
            }
        );
    };
    
    // Confirmar limpeza de todas as agendas
    function confirmClearAllSchedules(plantId) {
        if (!plantId) return;
        
        const count = countAllSchedules(plantId);
        
        showConfirmModal(
            'Confirmar Desmarcação',
            `Tem certeza que deseja desmarcar todas as ${count} rega(s) agendada(s)? Esta ação não pode ser desfeita.`,
            () => {
                clearAllSchedulesForPlant(plantId);
                showModal('Sucesso', 'Todas as regas foram desmarcadas.', 'success');
                loadConfiguration(plantId);
            }
        );
    }
    
    // Limpar todas as agendas de uma planta
    function clearAllSchedulesForPlant(plantId) {
        // Limpar sistema de rega
        const irrigationConfig = JSON.parse(localStorage.getItem(`irrigation_config_${plantId}`) || '{}');
        irrigationConfig.enabled = false;
        irrigationConfig.weeklyWatering = 0;
        localStorage.setItem(`irrigation_config_${plantId}`, JSON.stringify(irrigationConfig));
        
        // Limpar regas manuais futuras
        localStorage.removeItem(`watering_${plantId}`);
        
        // Limpar recorrências
        localStorage.removeItem(`recurrences_${plantId}`);
        
        // Limpar exceções
        localStorage.removeItem(`irrigation_exceptions_${plantId}`);
    }

    // NOVO: Atualizar painel de configuração atual
    // Atualizar status card com configuração atual
    function updateStatusCard(config) {
        if (config.weeklyWatering && config.wateringTime) {
            statusCard.style.display = 'flex';
            const isActive = config.enabled !== false;
            
            statusCard.classList.toggle('inactive', !isActive);
            statusIconSimple.textContent = isActive ? '✓' : '✖';
            statusTitle.textContent = isActive ? 'Sistema Ativo' : 'Sistema Desativado';
            statusDetail.textContent = `${config.weeklyWatering}x/semana às ${config.wateringTime}`;
            toggleStatusBtn.textContent = isActive ? 'Desativar' : 'Ativar';
        } else {
            statusCard.style.display = 'none';
        }
    }

    // NOVO: Abrir calendário com planta selecionada
    function openCalendar() {
        if (!selectedPlantId) {
            showModal('Erro', 'Por favor, selecione uma planta primeiro.', 'warning');
            return;
        }
        // Guardar planta selecionada no sessionStorage
        sessionStorage.setItem('selectedPlant', selectedPlantId);
        // Redirecionar para o calendário
        window.location.href = 'calendario.html';
    }

    function saveConfiguration() {
        if (!selectedPlantId) {
            showModal('Aviso', 'Por favor, selecione uma planta.', 'warning');
            return;
        }

        const weeklyWatering = parseInt(weeklyWateringInput.value, 10);
        const wateringTime = wateringTimeInput.value;

        if (weeklyWatering < 1 || weeklyWatering > 7) {
            showModal('Erro', 'O número de regas deve estar entre 1 e 7.', 'error');
            return;
        }
        if (!wateringTime) {
            showModal('Erro', 'Por favor, selecione uma hora.', 'error');
            return;
        }

        // Verificar se há regas personalizadas (manuais ou recorrentes)
        const hasPersonalizedSchedules = hasPersonalizedWaterings(selectedPlantId);
        
        if (hasPersonalizedSchedules) {
            // Mostrar modal de conflito com regas personalizadas
            showPersonalizedScheduleConflictModal(selectedPlantId, weeklyWatering, wateringTime);
        } else {
            // Verificar personalizações do sistema de rega
            const hasCustomizations = hasIrrigationCustomizations(selectedPlantId);

            if (hasCustomizations) {
                const count = countIrrigationCustomizations(selectedPlantId);
                showConfirmModal(
                    'Confirmar Alterações',
                    `Existem ${count} personalizações no calendário que serão removidas. Continuar?`,
                    () => {
                        clearIrrigationOverrides(selectedPlantId);
                        saveConfigurationConfirmed(weeklyWatering, wateringTime);
                    }
                );
            } else {
                saveConfigurationConfirmed(weeklyWatering, wateringTime);
            }
        }
    }
    
    // Verificar se há regas personalizadas (manuais ou recorrentes)
    function hasPersonalizedWaterings(plantId) {
        const wateringData = JSON.parse(localStorage.getItem(`watering_${plantId}`) || '[]');
        const recurrences = JSON.parse(localStorage.getItem(`recurrences_${plantId}`) || '[]');
        
        const futureWaterings = wateringData.filter(w => !w.completed && w.date >= new Date().toISOString().split('T')[0] && !w.source);
        const activeRecurrences = recurrences.filter(r => !r.stopped);
        
        return futureWaterings.length > 0 || activeRecurrences.length > 0;
    }
    
    // Contar regas personalizadas
    function countPersonalizedWaterings(plantId) {
        const wateringData = JSON.parse(localStorage.getItem(`watering_${plantId}`) || '[]');
        const recurrences = JSON.parse(localStorage.getItem(`recurrences_${plantId}`) || '[]');
        
        const futureWaterings = wateringData.filter(w => !w.completed && w.date >= new Date().toISOString().split('T')[0] && !w.source);
        const activeRecurrences = recurrences.filter(r => !r.stopped);
        
        return futureWaterings.length + activeRecurrences.length;
    }
    
    // Mostrar modal de conflito com regas personalizadas
    function showPersonalizedScheduleConflictModal(plantId, weeklyWatering, wateringTime) {
        const count = countPersonalizedWaterings(plantId);
        
        const modal = document.createElement('div');
        modal.className = 'plant-selection-overlay';
        modal.innerHTML = `
            <div class="plant-selection-modal" style="max-width: 550px;">
                <h2 class="modal-title" style="color: #ff9800;">⚠️ Regas Personalizadas Existentes</h2>
                
                <div style="padding: 1em 0;">
                    <p style="color: #555; font-size: 1em; line-height: 1.6; margin-bottom: 1em;">
                        Esta planta possui <strong>${count} rega(s) personalizada(s)</strong> agendada(s) no calendário (regas manuais ou recorrentes).
                    </p>
                    <p style="color: #555; font-size: 1em; line-height: 1.6; margin-bottom: 1em;">
                        O que deseja fazer?
                    </p>
                </div>

                <div style="display: flex; flex-direction: column; gap: 1em; margin-bottom: 1.5em;">
                    <!-- Opção 1: Remover personalizadas -->
                    <div class="schedule-option-card" data-action="remove" style="border: 2px solid #667eea; border-radius: 0.8em; padding: 1.2em; cursor: pointer; transition: all 0.3s ease; background: rgba(102, 126, 234, 0.05);">
                        <div style="display: flex; align-items: center; gap: 1em;">
                            <div style="font-size: 2em;">⚙️</div>
                            <div style="flex: 1;">
                                <h3 style="margin: 0 0 0.3em 0; color: #667eea; font-size: 1.1em;">Remover Personalizadas e Ativar Sistema</h3>
                                <p style="margin: 0; color: #666; font-size: 0.9em;">
                                    Remove todas as regas personalizadas e ativa o sistema automático (${weeklyWatering}x por semana)
                                </p>
                            </div>
                        </div>
                    </div>

                    <!-- Opção 2: Manter personalizadas -->
                    <div class="schedule-option-card" data-action="keep" style="border: 2px solid #28a745; border-radius: 0.8em; padding: 1.2em; cursor: pointer; transition: all 0.3s ease; background: rgba(40, 167, 69, 0.05);">
                        <div style="display: flex; align-items: center; gap: 1em;">
                            <div style="font-size: 2em;">📅</div>
                            <div style="flex: 1;">
                                <h3 style="margin: 0 0 0.3em 0; color: #28a745; font-size: 1.1em;">Manter Personalizadas e Adicionar Sistema</h3>
                                <p style="margin: 0; color: #666; font-size: 0.9em;">
                                    Mantém as regas personalizadas e adiciona o sistema automático em dias livres
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="modal-buttons">
                    <button class="btn-modal btn-cancel" id="cancelPersonalizedConflict">
                        Cancelar
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Função para fechar modal
        const closeModal = () => {
            if (document.body.contains(modal)) {
                document.body.removeChild(modal);
            }
        };
        
        // Cancelar
        modal.querySelector('#cancelPersonalizedConflict').addEventListener('click', closeModal);
        
        // Click no overlay
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal();
            }
        });
        
        // Hover e click nas opções
        const optionCards = modal.querySelectorAll('.schedule-option-card');
        optionCards.forEach(card => {
            card.addEventListener('mouseenter', function() {
                this.style.transform = 'translateY(-3px)';
                this.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
            });
            
            card.addEventListener('mouseleave', function() {
                this.style.transform = 'translateY(0)';
                this.style.boxShadow = 'none';
            });
            
            card.addEventListener('click', function() {
                const action = this.getAttribute('data-action');
                
                closeModal();
                
                if (action === 'remove') {
                    // Remover todas as regas personalizadas
                    clearPersonalizedWaterings(plantId);
                    // Verificar e limpar personalizações do sistema
                    if (hasIrrigationCustomizations(plantId)) {
                        clearIrrigationOverrides(plantId);
                    }
                    saveConfigurationConfirmed(weeklyWatering, wateringTime);
                } else {
                    // Manter personalizadas e adicionar sistema
                    // Verificar e limpar apenas personalizações do sistema
                    if (hasIrrigationCustomizations(plantId)) {
                        clearIrrigationOverrides(plantId);
                    }
                    saveConfigurationConfirmed(weeklyWatering, wateringTime);
                }
            });
        });
    }
    
    // Limpar regas personalizadas (manuais e recorrentes)
    function clearPersonalizedWaterings(plantId) {
        // Remover regas manuais futuras
        const wateringData = JSON.parse(localStorage.getItem(`watering_${plantId}`) || '[]');
        const filtered = wateringData.filter(w => w.completed || w.date < new Date().toISOString().split('T')[0] || w.source);
        localStorage.setItem(`watering_${plantId}`, JSON.stringify(filtered));
        
        // Remover recorrências
        localStorage.removeItem(`recurrences_${plantId}`);
    }

    // Verificar se há personalizações no sistema de rega
    function hasIrrigationCustomizations(plantId) {
        const exceptions = JSON.parse(localStorage.getItem(`irrigation_exceptions_${plantId}`) || '[]');
        const wateringData = JSON.parse(localStorage.getItem(`watering_${plantId}`) || '[]');
        const overrides = wateringData.filter(w => w.source === 'irrigation_override');
        return exceptions.length > 0 || overrides.length > 0;
    }

    // Contar personalizações
    function countIrrigationCustomizations(plantId) {
        const exceptions = JSON.parse(localStorage.getItem(`irrigation_exceptions_${plantId}`) || '[]');
        const wateringData = JSON.parse(localStorage.getItem(`watering_${plantId}`) || '[]');
        const overrides = wateringData.filter(w => w.source === 'irrigation_override');
        return exceptions.length + overrides.length;
    }

    function saveConfigurationConfirmed(weeklyWatering, wateringTime) {
        // Ativar imediatamente para permitir verificação
        currentEnabled = true;
        
        const config = {
            weeklyWatering,
            wateringTime,
            sensorStatus: lastSensorStatus,
            enabled: currentEnabled,
            lastUpdated: new Date().toISOString()
        };

        const key = `irrigation_config_${selectedPlantId}`;
        localStorage.setItem(key, JSON.stringify(config));

        const plant = plants.find(p => p.id == selectedPlantId);
        
        // Calcular próximas datas de rega
        const nextWateringDates = calculateNextWateringDates(weeklyWatering, wateringTime);
        
        // Mostrar modal de sucesso com agenda
        showSuccessScheduleModal(plant.name, weeklyWatering, wateringTime, nextWateringDates);
        
        // Atualizar UI
        updateEnabledUI(currentEnabled, lastSensorStatus === 'ok');
        loadConfiguration(selectedPlantId);
    }

    // NOVA FUNÇÃO: Calcular próximas datas de rega
    function calculateNextWateringDates(weeklyWatering, wateringTime) {
        const today = new Date();
        const dayOfWeek = today.getDay(); // 0 = Domingo, 6 = Sábado
        const interval = Math.floor(7 / weeklyWatering);
        const irrigationDays = [];
        
        // Calcular dias da semana que terão rega
        for (let i = 0; i < weeklyWatering; i++) {
            irrigationDays.push((i * interval) % 7);
        }
        
        // Encontrar as próximas 7 ocorrências
        const nextDates = [];
        const daysOfWeekNames = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
        
        for (let i = 0; i < 14; i++) { // Procurar nos próximos 14 dias
            const checkDate = new Date(today);
            checkDate.setDate(today.getDate() + i);
            const checkDayOfWeek = checkDate.getDay();
            
            if (irrigationDays.includes(checkDayOfWeek)) {
                nextDates.push({
                    date: checkDate,
                    dayName: daysOfWeekNames[checkDayOfWeek],
                    dateStr: checkDate.toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit', year: 'numeric' }),
                    isToday: i === 0
                });
                
                if (nextDates.length >= 5) break; // Mostrar apenas 5 próximas
            }
        }
        
        return nextDates;
    }

    // Modal de sucesso simplificado
    function showSuccessScheduleModal(plantName, weeklyWatering, wateringTime, nextDates) {
        const nextDate = nextDates[0];
        const message = `
            <p><strong>${plantName}</strong> configurado para regar <strong>${weeklyWatering}x por semana</strong> às <strong>${wateringTime}</strong>.</p>
            <p style="margin-top:1rem;">📅 Próxima rega: <strong>${nextDate.dayName}, ${nextDate.dateStr}</strong></p>
            <p style="margin-top:0.5rem;color:#666;font-size:0.9rem;">💡 Verifique o calendário para visualizar todas as regas agendadas.</p>
        `;
        
        showModal('✅ Sistema de Rega Ativado!', message, 'success');
        
        // Ativar o sistema e recarregar configuração
        currentEnabled = true;
        loadConfiguration(selectedPlantId);
    }

    // Função para limpar exceções e sobreposições do sistema de rega
    function clearIrrigationOverrides(plantId) {
        // Limpar exceções (dias desativados)
        localStorage.removeItem(`irrigation_exceptions_${plantId}`);
        
        // Limpar sobreposições de hora (irrigation_override)
        const wateringData = JSON.parse(localStorage.getItem(`watering_${plantId}`) || '[]');
        const cleanedData = wateringData.filter(w => w.source !== 'irrigation_override');
        localStorage.setItem(`watering_${plantId}`, JSON.stringify(cleanedData));
    }

    // Alternar ativação do sistema
    function handleToggleStatus() {
        if (!selectedPlantId) return;
        
        const key = `irrigation_config_${selectedPlantId}`;
        const config = JSON.parse(localStorage.getItem(key) || '{}');
        
        if (!config.weeklyWatering) {
            showModal('Aviso', 'Configure o sistema antes de ativar.', 'warning');
            return;
        }
        
        const newEnabled = !currentEnabled;
        const action = newEnabled ? 'ativar' : 'desativar';
        
        showConfirmModal(
            'Confirmar',
            `Deseja ${action} o sistema de rega automática?`,
            () => {
                currentEnabled = newEnabled;
                config.enabled = newEnabled;
                localStorage.setItem(key, JSON.stringify(config));
                updateStatusCard(config);
                updateEnabledUI(currentEnabled, lastSensorStatus === 'ok');
                
                const plant = plants.find(p => p.id == selectedPlantId);
                showModal(
                    'Sucesso',
                    `Sistema de rega ${newEnabled ? 'ativado' : 'desativado'} para ${plant.name}.`,
                    'success'
                );
            }
        );
    }

    function updateEnabledUI(enabled, sensorOk) {
        // Sempre permitir edição dos campos quando há planta selecionada
        weeklyWateringInput.disabled = !selectedPlantId;
        wateringTimeInput.disabled = !selectedPlantId;
        saveButton.disabled = !selectedPlantId;
        viewCalendarBtn.disabled = !selectedPlantId;
    }

    // NOVO: modal de confirmação
    function showConfirmModal(title, message, onConfirm) {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header info">
                    <h3>${title}</h3>
                    <button class="close-btn" id="closeConfirmXBtn" aria-label="Fechar">&times;</button>
                </div>
                <div class="modal-body">${message}</div>
                <div class="modal-footer" style="display:flex;gap:.5rem;">
                    <button class="btn-secondary" id="cancelBtn">Cancelar</button>
                    <button class="btn-primary" id="confirmBtn">Confirmar</button>
                </div>
            </div>`;
        document.body.appendChild(modal);
        addModalStyles();

        const closeModal = () => {
            if (document.body.contains(modal)) {
                document.body.removeChild(modal);
            }
        };

        modal.querySelector('#cancelBtn').addEventListener('click', closeModal);
        modal.querySelector('#closeConfirmXBtn').addEventListener('click', closeModal);
        modal.querySelector('#confirmBtn').addEventListener('click', () => {
            closeModal();
            if (typeof onConfirm === 'function') onConfirm();
        });
        
        // Fechar ao clicar fora do modal
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal();
            }
        });
    }

    // Função genérica para mostrar modais simples (avisos, erros, sucesso)
    function showModal(title, message, type = 'info') {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';

        const icon = type === 'success' ? '✅' : type === 'warning' ? '⚠️' : 'ℹ️';

        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header ${type}">
                    <h3>${icon} ${title}</h3>
                    <button class="close-btn" id="closeModalXBtn" aria-label="Fechar">&times;</button>
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
        addModalStyles();

        const closeModal = () => {
            if (document.body.contains(modal)) {
                document.body.removeChild(modal);
            }
        };

        modal.querySelector('#okBtn').addEventListener('click', closeModal);
        modal.querySelector('#closeModalXBtn').addEventListener('click', closeModal);
        
        // Fechar ao clicar fora do modal
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal();
            }
        });
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
                    const newPlantId = selectedRadio.value;
                    selectedPlantId = newPlantId;
                    
                    // Atualizar botão de seleção
                    const currentPlant = plants.find(p => p.id == newPlantId);
                    if (currentPlant && selectedPlantNameSpan) {
                        selectedPlantNameSpan.textContent = currentPlant.name;
                    }
                    
                    // Processar a mudança de planta
                    handlePlantChange(newPlantId);
                    
                    // Fechar modal
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

    // Estilos do modal (acrescenta btn-secondary e close-btn)
    function addModalStyles() {
        if (document.getElementById('modal-styles')) return;
        const style = document.createElement('style');
        style.id = 'modal-styles';
        style.textContent = `
            .modal-overlay{position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,.6);display:flex;justify-content:center;align-items:center;z-index:2000;backdrop-filter:blur(4px)}
            .modal-content{background:#fff;border-radius:16px;width:90%;max-width:550px;box-shadow:0 10px 40px rgba(0,0,0,.3);overflow:hidden;animation:modalSlideIn .3s ease;position:relative}
            @keyframes modalSlideIn{from{transform:translateY(-50px);opacity:0}to{transform:translateY(0);opacity:1}}
            .modal-header{padding:1.5rem;border-bottom:2px solid rgba(0,0,0,.1);position:relative}
            .modal-header.info{background:linear-gradient(135deg, rgba(33,150,243,.1), rgba(3,169,244,.1))}
            .modal-header.success{background:linear-gradient(135deg, rgba(76,175,80,.1), rgba(139,195,74,.1))}
            .modal-header.warning{background:linear-gradient(135deg, rgba(255,193,7,.1), rgba(255,152,0,.1))}
            .modal-header h3{margin:0;font-size:1.3rem;color:#333;padding-right:2.5rem}
            .close-btn{position:absolute;right:1rem;top:50%;transform:translateY(-50%);background:transparent;border:none;font-size:2rem;color:#999;cursor:pointer;width:2.5rem;height:2.5rem;display:flex;align-items:center;justify-content:center;border-radius:50%;transition:all .2s}
            .close-btn:hover{background:rgba(0,0,0,.1);color:#333}
            .modal-body{padding:2rem}
            .modal-body p{margin:0;color:#555;font-size:1.05rem;line-height:1.6}
            .modal-footer{padding:1.5rem;background:rgba(0,0,0,.02);border-top:2px solid rgba(0,0,0,.1);display:flex;gap:.5rem}
            .btn-primary{width:100%;padding:.75rem 1.5rem;background:linear-gradient(135deg,#667eea,#764ba2);color:#fff;border:none;border-radius:8px;font-size:1rem;font-weight:600;cursor:pointer;transition:all .3s}
            .btn-primary:hover{background:linear-gradient(135deg,#5568d3,#6a3f8f);transform:translateY(-2px)}
            .btn-secondary{width:100%;padding:.75rem 1.5rem;background:#e0e0e0;color:#333;border:none;border-radius:8px;font-size:1rem;font-weight:600;cursor:pointer;transition:all .3s}
            .btn-secondary:hover{background:#d5d5d5;transform:translateY(-2px)}
            .success-schedule-modal-compact{max-width:480px}
            .modal-body-compact{padding:1.5rem}
            .success-summary-compact{background:rgba(76,175,80,.08);padding:1rem;border-radius:8px;margin-bottom:1rem;text-align:center}
            .success-summary-compact p{margin:0;font-size:1rem;color:#333;font-weight:500}
            .next-waterings-compact h4{margin:.75rem 0 .5rem 0;color:#667eea;font-size:1rem;font-weight:600}
            .schedule-dates-list-compact{list-style:none;padding:0;margin:0}
            .schedule-date-item-compact{display:flex;align-items:center;padding:.65rem .75rem;margin-bottom:.4rem;background:rgba(102,126,234,.06);border-radius:6px;border-left:3px solid #667eea;transition:all .2s}
            .schedule-date-item-compact:hover{background:rgba(102,126,234,.12)}
            .schedule-date-item-compact.today{background:rgba(255,193,7,.1);border-left-color:#ffc107}
            .date-number-compact{font-size:1.1rem;font-weight:700;color:#667eea;margin-right:.75rem;min-width:1.5rem}
            .date-info-compact{flex:1;font-size:.9rem;color:#555}
            .date-info-compact strong{color:#333;font-weight:600}
            .today-badge-compact{display:inline;padding:.15rem .5rem;background:#ffc107;color:#fff;border-radius:8px;font-size:.75rem;font-weight:600}
            .success-note-compact{margin-top:1rem;padding:.75rem;background:rgba(33,150,243,.06);border-left:3px solid #2196f3;border-radius:4px}
            .success-note-compact p{color:#555;font-size:.85rem;margin:0}
            .modal-footer-compact{padding:1rem 1.5rem;background:rgba(0,0,0,.02);border-top:2px solid rgba(0,0,0,.1);display:flex;gap:.5rem}
            .btn-secondary-compact{flex:1;padding:.7rem 1rem;background:#e0e0e0;color:#333;border:none;border-radius:8px;font-size:.95rem;font-weight:600;cursor:pointer;transition:all .3s}
            .btn-secondary-compact:hover{background:#d5d5d5;transform:translateY(-2px)}
            .btn-primary-compact{flex:1;padding:.7rem 1rem;background:linear-gradient(135deg,#667eea,#764ba2);color:#fff;border:none;border-radius:8px;font-size:.95rem;font-weight:600;cursor:pointer;transition:all .3s}
            .btn-primary-compact:hover{background:linear-gradient(135deg,#5568d3,#6a3f8f);transform:translateY(-2px)}
        `;
        document.head.appendChild(style);
    }
});