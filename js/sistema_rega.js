document.addEventListener('DOMContentLoaded', () => {
    const plantSelect = document.getElementById('plantSelect');
    const configSection = document.getElementById('configSection');
    const noPlantMessage = document.getElementById('noPlantMessage');
    const weeklyWateringInput = document.getElementById('weeklyWatering');
    const wateringTimeInput = document.getElementById('wateringTime');
    const saveButton = document.getElementById('saveButton');
    const statusIndicator = document.getElementById('statusIndicator');
    const cancelSystemBtn = document.getElementById('cancelSystemBtn');
    const reactivateSystemBtn = document.getElementById('reactivateSystemBtn');
    const viewCalendarBtn = document.getElementById('viewCalendarBtn');

    // CORREÇÃO: definir plantas e seleção inicial
    let plants = JSON.parse(localStorage.getItem('myPlants') || '[]');
    let selectedPlantId = plantSelect.value || null;

    let currentEnabled = true;
    let lastSensorStatus = 'ok';

    // Verificar se há uma planta pré-selecionada do sessionStorage
    const preSelectedPlantId = sessionStorage.getItem('selectedPlant');
    if (preSelectedPlantId) {
        selectedPlantId = preSelectedPlantId;
        sessionStorage.removeItem('selectedPlant'); // Limpar após uso
    }

    loadPlants();

    // Event Listeners
    plantSelect.addEventListener('change', handlePlantChange);
    saveButton.addEventListener('click', saveConfiguration);
    cancelSystemBtn.addEventListener('click', onCancelSystem);          // ALTERADO
    reactivateSystemBtn.addEventListener('click', onReactivateSystem);  // NOVO
    if (viewCalendarBtn) {
        viewCalendarBtn.addEventListener('click', openCalendar);        // NOVO
    }

    function loadPlants() {
        // Recarrega sempre do localStorage (caso tenha mudado noutra página)
        plants = JSON.parse(localStorage.getItem('myPlants') || '[]');

        if (!plants.length) {
            plantSelect.innerHTML = '<option value="">Nenhuma planta disponível</option>';
            selectedPlantId = null;
            return;
        }

        const prev = selectedPlantId;
        plantSelect.innerHTML = '<option value="">-- Escolha uma planta --</option>' +
            plants.map(p => `<option value="${p.id}" ${p.id == prev ? 'selected':''}>${p.name}</option>`).join('');

        if (prev) {
            plantSelect.value = prev;
            selectedPlantId = prev; // Garantir que está definido
            handlePlantChange({ target: plantSelect });
        }
    }

    function handlePlantChange(e) {
        selectedPlantId = e.target.value;

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
        updateStatusIndicator(sensorStatus);
        updateFieldsState(sensorStatus); // mantém chamada
    }

    // ALTERADO: agora usa também o enabled atual
    function updateFieldsState(status) {
        const isOk = status === 'ok';
        updateEnabledUI(currentEnabled, isOk);
    }

    function updateStatusIndicator(status) {
        const badge = statusIndicator.querySelector('.status-badge');
        if (!badge) return;
        badge.classList.remove('ok','problema','falha');
        const icon = badge.querySelector('.status-icon');
        const text = badge.querySelector('.status-text');
        if (currentEnabled && status === 'ok') {
            badge.classList.add('ok');
            icon.textContent = '✓';
            text.textContent = 'Sistema Operacional - Sensores Funcionando Corretamente';
        } else if (currentEnabled && status !== 'ok') {
            badge.classList.add('problema');
            icon.textContent = '⚠️';
            text.textContent = 'Sistema Ativo com Problemas de Sensor';
        } else {
            badge.classList.add('falha');
            icon.textContent = '✖';
            text.textContent = 'Sistema Desativado';
        }
    }

    function loadConfiguration(plantId) {
        const key = `irrigation_config_${plantId}`;
        const config = JSON.parse(localStorage.getItem(key) || '{}');
        weeklyWateringInput.value = config.weeklyWatering || 3;
        wateringTimeInput.value = config.wateringTime || '08:00';
        currentEnabled = config.enabled !== false;
        updateEnabledUI(currentEnabled, lastSensorStatus === 'ok');
        applyControlButtonsState();
        updateCurrentConfigPanel(config); // NOVO
    }

    // NOVO: Atualizar painel de configuração atual
    function updateCurrentConfigPanel(config) {
        const panel = document.getElementById('currentConfigPanel');
        const frequencySpan = document.getElementById('currentFrequency');
        const timeSpan = document.getElementById('currentTime');
        const statusSpan = document.getElementById('currentStatus');

        if (config.weeklyWatering && config.wateringTime) {
            panel.style.display = 'block';
            frequencySpan.textContent = config.weeklyWatering;
            timeSpan.textContent = config.wateringTime;
            statusSpan.textContent = config.enabled !== false ? '✓ Ativo' : '✖ Desativado';
            statusSpan.style.color = config.enabled !== false ? '#4caf50' : '#f44336';
        } else {
            panel.style.display = 'none';
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
            showModal('Erro', 'Por favor, selecione uma planta.', 'warning');
            return;
        }

        const weeklyWatering = parseInt(weeklyWateringInput.value, 10);
        const wateringTime = wateringTimeInput.value;

        if (weeklyWatering < 1 || weeklyWatering > 7) {
            showModal('Erro', 'O número de regas deve estar entre 1 e 7 por semana.', 'warning');
            return;
        }
        if (!wateringTime) {
            showModal('Erro', 'Por favor, defina a hora da rega.', 'warning');
            return;
        }

        // SEMPRE mostrar confirmação e limpar personalizações ao guardar
        const key = `irrigation_config_${selectedPlantId}`;
        const oldConfig = JSON.parse(localStorage.getItem(key) || '{}');

        // Verificar se há personalizações que serão perdidas
        const hasCustomizations = hasIrrigationCustomizations(selectedPlantId);

        if (oldConfig.weeklyWatering) {
            // Já existe configuração - mostrar comparação
            showConfirmModal(
                '⚠️ Guardar Configuração do Sistema de Rega',
                `<div style="text-align:left;">
                    <p><strong>Configuração Anterior:</strong></p>
                    <ul style="margin-left:1.5rem;">
                        <li>${oldConfig.weeklyWatering} regas por semana às ${oldConfig.wateringTime}</li>
                    </ul>
                    <p><strong>Nova Configuração:</strong></p>
                    <ul style="margin-left:1.5rem;">
                        <li>${weeklyWatering} regas por semana às ${wateringTime}</li>
                    </ul>
                    ${hasCustomizations ? `
                        <p style="color:#f57c00;margin-top:1rem;"><strong>⚠️ Atenção:</strong> Você tem ${countIrrigationCustomizations(selectedPlantId)} alterações personalizadas que serão <strong>removidas</strong>.</p>
                    ` : ''}
                    <p style="margin-top:1rem;"><strong>Ao guardar, o sistema recomeçará como se fosse uma nova configuração.</strong></p>
                    <p>Deseja continuar?</p>
                </div>`,
                () => {
                    clearIrrigationOverrides(selectedPlantId);
                    saveConfigurationConfirmed(weeklyWatering, wateringTime);
                }
            );
        } else {
            // Primeira configuração - apenas confirmar
            showConfirmModal(
                'Ativar Sistema de Rega',
                `<div style="text-align:left;">
                    <p>Configurar sistema de rega automática:</p>
                    <ul style="margin-left:1.5rem;">
                        <li><strong>Frequência:</strong> ${weeklyWatering} regas por semana</li>
                        <li><strong>Hora:</strong> ${wateringTime}</li>
                    </ul>
                    <p style="margin-top:1rem;">Deseja ativar?</p>
                </div>`,
                () => {
                    clearIrrigationOverrides(selectedPlantId); // Limpar por precaução
                    saveConfigurationConfirmed(weeklyWatering, wateringTime);
                }
            );
        }
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

    // NOVA FUNÇÃO: Modal de sucesso com agenda
    function showSuccessScheduleModal(plantName, weeklyWatering, wateringTime, nextDates) {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        
        // Mostrar apenas as próximas 3 regas
        let datesHTML = nextDates.slice(0, 3).map((date, index) => `
            <li class="schedule-date-item-compact ${date.isToday ? 'today' : ''}">
                <span class="date-number-compact">${index + 1}º</span>
                <span class="date-info-compact">
                    <strong>${date.dayName}</strong>, ${date.dateStr}
                    ${date.isToday ? ' <span class="today-badge-compact">Hoje</span>' : ''}
                </span>
            </li>
        `).join('');
        
        modal.innerHTML = `
            <div class="modal-content success-schedule-modal-compact">
                <div class="modal-header success">
                    <h3>✅ Sistema de Rega Ativado!</h3>
                    <button class="close-btn" id="closeXBtn" aria-label="Fechar">&times;</button>
                </div>
                <div class="modal-body-compact">
                    <div class="success-summary-compact">
                        <p><strong>${plantName}</strong> • ${weeklyWatering}x/semana às ${wateringTime}</p>
                    </div>
                    
                    <div class="next-waterings-compact">
                        <h4>📅 Próximas 3 Regas:</h4>
                        <ul class="schedule-dates-list-compact">
                            ${datesHTML}
                        </ul>
                    </div>
                    
                    <div class="success-note-compact">
                        <p>💡 As regas aparecerão automaticamente no calendário.</p>
                    </div>
                </div>
                <div class="modal-footer-compact">
                    <button class="btn btn-secondary-compact" id="closeSuccessBtn">Fechar</button>
                    <button class="btn btn-primary-compact" id="viewCalendarBtnModal">📅 Ver Calendário</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Event listeners
        const closeModal = () => {
            if (document.body.contains(modal)) {
                document.body.removeChild(modal);
            }
        };
        
        modal.querySelector('#closeSuccessBtn').addEventListener('click', closeModal);
        modal.querySelector('#closeXBtn').addEventListener('click', closeModal);
        
        modal.querySelector('#viewCalendarBtnModal').addEventListener('click', () => {
            closeModal();
            openCalendar();
        });
        
        // Fechar ao clicar fora do modal
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal();
            }
        });
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

    // NOVO: lida com o toggle
    function onToggleEnabled(e) {
        if (!selectedPlantId) {
            showModal('Erro', 'Selecione uma planta primeiro.', 'warning');
            e.target.checked = false;
            return;
        }
        currentEnabled = e.target.checked;
        persistEnabled();
        updateEnabledUI(currentEnabled, lastSensorStatus === 'ok');
    }

    // NOVO: botão "Desativar sistema"
    function onCancelSystem() {
        if (!selectedPlantId) {
            showModal('Erro', 'Selecione uma planta primeiro.', 'warning');
            return;
        }
        showConfirmModal(
            'Desativar sistema de rega',
            'Tem a certeza que deseja desativar a rega automática para esta planta?',
            () => {
                currentEnabled = false;
                persistEnabled();
                updateEnabledUI(false, lastSensorStatus === 'ok');
                applyControlButtonsState(); // NOVO
                showModal('Sistema desativado', 'A rega automática foi desativada.', 'success');
            }
        );
    }

    // NOVO: reativar
    function onReactivateSystem() {
        if (!selectedPlantId) {
            showModal('Erro', 'Selecione uma planta primeiro.', 'warning');
            return;
        }
        currentEnabled = true;
        persistEnabled();
        updateEnabledUI(true, lastSensorStatus === 'ok');
        applyControlButtonsState();
        showModal('Sistema reativado', 'A rega automática foi reativada.', 'success');
    }

    // NOVO: alternar visibilidade dos botões
    function applyControlButtonsState() {
        if (currentEnabled) {
            cancelSystemBtn.style.display = 'inline-block';
            reactivateSystemBtn.style.display = 'none';
        } else {
            cancelSystemBtn.style.display = 'none';
            reactivateSystemBtn.style.display = 'inline-block';
        }
    }

    function updateEnabledUI(enabled, sensorOk) {
        const editable = enabled && sensorOk;
        weeklyWateringInput.disabled = !editable;
        wateringTimeInput.disabled = !editable;
        saveButton.disabled = !editable;

        const configItems = document.querySelectorAll('.config-item:not(.sensor-status)');
        configItems.forEach(item => item.classList.toggle('disabled', !editable));

        const badge = statusIndicator.querySelector('.status-badge');
        const icon = statusIndicator.querySelector('.status-icon');
        const text = statusIndicator.querySelector('.status-text');

        if (!enabled) {
            badge.classList.remove('ok', 'problema');
            badge.classList.add('falha');
            icon.textContent = '✖';
            text.textContent = 'Sistema Desativado';
        } else if (sensorOk) {
            badge.classList.remove('problema', 'falha');
            badge.classList.add('ok');
            icon.textContent = '✓';
            text.textContent = 'Sistema Ativado - Sensores Funcionando Corretamente';
        } else {
            badge.classList.remove('ok', 'falha');
            badge.classList.add('problema');
            icon.textContent = '⚠️';
            text.textContent = 'Sistema Ativo com Problemas de Sensor';
        }
    }

    function persistEnabled() {
        const key = `irrigation_config_${selectedPlantId}`;
        const cfg = JSON.parse(localStorage.getItem(key) || '{}');
        cfg.enabled = currentEnabled;
        localStorage.setItem(key, JSON.stringify(cfg));
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