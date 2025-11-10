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

        // Verificar se há configuração anterior
        const key = `irrigation_config_${selectedPlantId}`;
        const oldConfig = JSON.parse(localStorage.getItem(key) || '{}');
        const hasChanges = oldConfig.weeklyWatering !== weeklyWatering || 
                          oldConfig.wateringTime !== wateringTime;

        // Se houve mudanças, limpar exceções e sobreposições antigas
        if (hasChanges && oldConfig.weeklyWatering) {
            showConfirmModal(
                '⚠️ Atualizar Sistema de Rega',
                `<div style="text-align:left;">
                    <p><strong>Configuração Anterior:</strong></p>
                    <ul style="margin-left:1.5rem;">
                        <li>${oldConfig.weeklyWatering} regas por semana às ${oldConfig.wateringTime}</li>
                    </ul>
                    <p><strong>Nova Configuração:</strong></p>
                    <ul style="margin-left:1.5rem;">
                        <li>${weeklyWatering} regas por semana às ${wateringTime}</li>
                    </ul>
                    <p style="color:#f57c00;margin-top:1rem;"><strong>⚠️ Atenção:</strong> Todas as alterações de hora e exceções de dias específicos serão <strong>removidas</strong> para evitar conflitos com a nova configuração.</p>
                    <p style="margin-top:1rem;">Deseja continuar?</p>
                </div>`,
                () => {
                    clearIrrigationOverrides(selectedPlantId);
                    saveConfigurationConfirmed(weeklyWatering, wateringTime);
                }
            );
        } else {
            saveConfigurationConfirmed(weeklyWatering, wateringTime);
        }
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
        showModal('Sucesso', `Configurações de rega automática para "${plant.name}" foram salvas com sucesso!`, 'success');
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
                </div>
                <div class="modal-body">${message}</div>
                <div class="modal-footer" style="display:flex;gap:.5rem;">
                    <button class="btn-secondary" id="cancelBtn">Cancelar</button>
                    <button class="btn-primary" id="confirmBtn">Confirmar</button>
                </div>
            </div>`;
        document.body.appendChild(modal);
        addModalStyles();

        modal.querySelector('#cancelBtn').addEventListener('click', () => document.body.removeChild(modal));
        modal.querySelector('#confirmBtn').addEventListener('click', () => {
            document.body.removeChild(modal);
            if (typeof onConfirm === 'function') onConfirm();
        });
    }

    // Estilos do modal (acrescenta btn-secondary)
    function addModalStyles() {
        if (document.getElementById('modal-styles')) return;
        const style = document.createElement('style');
        style.id = 'modal-styles';
        style.textContent = `
            .modal-overlay{position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,.6);display:flex;justify-content:center;align-items:center;z-index:2000;backdrop-filter:blur(4px)}
            .modal-content{background:#fff;border-radius:16px;width:90%;max-width:550px;box-shadow:0 10px 40px rgba(0,0,0,.3);overflow:hidden;animation:modalSlideIn .3s ease}
            @keyframes modalSlideIn{from{transform:translateY(-50px);opacity:0}to{transform:translateY(0);opacity:1}}
            .modal-header{padding:1.5rem;border-bottom:2px solid rgba(0,0,0,.1)}
            .modal-header.info{background:linear-gradient(135deg, rgba(33,150,243,.1), rgba(3,169,244,.1))}
            .modal-header.success{background:linear-gradient(135deg, rgba(76,175,80,.1), rgba(139,195,74,.1))}
            .modal-header.warning{background:linear-gradient(135deg, rgba(255,193,7,.1), rgba(255,152,0,.1))}
            .modal-header h3{margin:0;font-size:1.3rem;color:#333}
            .modal-body{padding:2rem}
            .modal-body p{margin:0;color:#555;font-size:1.05rem;line-height:1.6}
            .modal-footer{padding:1.5rem;background:rgba(0,0,0,.02);border-top:2px solid rgba(0,0,0,.1)}
            .btn-primary{width:100%;padding:.75rem 1.5rem;background:linear-gradient(135deg,#667eea,#764ba2);color:#fff;border:none;border-radius:8px;font-size:1rem;font-weight:600;cursor:pointer;transition:all .3s}
            .btn-primary:hover{background:linear-gradient(135deg,#5568d3,#6a3f8f);transform:translateY(-2px)}
            .btn-secondary{width:100%;padding:.75rem 1.5rem;background:#e0e0e0;color:#333;border:none;border-radius:8px;font-size:1rem;font-weight:600;cursor:pointer;transition:all .3s}
            .btn-secondary:hover{background:#d5d5d5;transform:translateY(-2px)}
        `;
        document.head.appendChild(style);
    }
});