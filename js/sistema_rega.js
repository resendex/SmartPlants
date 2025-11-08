document.addEventListener('DOMContentLoaded', () => {
    const plantSelect = document.getElementById('plantSelect');
    const configSection = document.getElementById('configSection');
    const noPlantMessage = document.getElementById('noPlantMessage');
    const weeklyWateringInput = document.getElementById('weeklyWatering');
    const wateringTimeInput = document.getElementById('wateringTime');
    const saveButton = document.getElementById('saveButton');
    const statusIndicator = document.getElementById('statusIndicator');

    const plants = JSON.parse(localStorage.getItem('myPlants') || '[]');
    let selectedPlantId = null;

    // Carregar plantas no select
    loadPlants();

    // Event Listeners
    plantSelect.addEventListener('change', handlePlantChange);
    saveButton.addEventListener('click', saveConfiguration);

    function loadPlants() {
        if (plants.length === 0) {
            plantSelect.innerHTML = '<option value="">Nenhuma planta disponível</option>';
            return;
        }

        plantSelect.innerHTML = '<option value="">-- Escolha uma planta --</option>';
        plants.forEach(plant => {
            const option = document.createElement('option');
            option.value = plant.id;
            option.textContent = plant.name;
            plantSelect.appendChild(option);
        });
    }

    function handlePlantChange(e) {
        selectedPlantId = e.target.value;

        if (!selectedPlantId) {
            configSection.classList.remove('active');
            noPlantMessage.classList.remove('hidden');
            return;
        }

        // Mostrar seção de configuração
        configSection.classList.add('active');
        noPlantMessage.classList.add('hidden');

        // Carregar configurações salvas
        loadConfiguration(selectedPlantId);

        // Simular análise automática do sistema
        simulateSensorAnalysis();
    }

    function simulateSensorAnalysis() {
        // Simula uma análise do sistema (sempre retorna OK nesta simulação)
        // Em um sistema real, isto consultaria sensores físicos
        const sensorStatus = 'ok';
        
        updateStatusIndicator(sensorStatus);
        updateFieldsState(sensorStatus);
    }

    function updateFieldsState(status) {
        const isOk = status === 'ok';
        
        // Habilitar/Desabilitar campos baseado no status do sensor
        weeklyWateringInput.disabled = !isOk;
        wateringTimeInput.disabled = !isOk;
        saveButton.disabled = !isOk;

        // Aplicar visual de desabilitado
        const configItems = document.querySelectorAll('.config-item:not(.sensor-status)');
        configItems.forEach(item => {
            if (isOk) {
                item.classList.remove('disabled');
            } else {
                item.classList.add('disabled');
            }
        });
    }

    function updateStatusIndicator(status) {
        const badge = statusIndicator.querySelector('.status-badge');
        const icon = statusIndicator.querySelector('.status-icon');
        const text = statusIndicator.querySelector('.status-text');

        // Remover classes anteriores
        badge.classList.remove('ok', 'problema', 'falha');
        
        // Adicionar nova classe e conteúdo
        badge.classList.add(status);

        switch (status) {
            case 'ok':
                icon.textContent = '✓';
                text.textContent = 'Sistema Operacional - Sensores Funcionando Corretamente';
                break;
            case 'problema':
                icon.textContent = '⚠️';
                text.textContent = 'Sistema com Problemas - Verifique os Sensores';
                break;
            case 'falha':
                icon.textContent = '✖';
                text.textContent = 'Falha no Sistema - Rega Automática Desativada';
                break;
        }
    }

    function loadConfiguration(plantId) {
        const key = `irrigation_config_${plantId}`;
        const config = JSON.parse(localStorage.getItem(key) || '{}');

        // Carregar valores ou usar padrões
        weeklyWateringInput.value = config.weeklyWatering || 3;
        wateringTimeInput.value = config.wateringTime || '08:00';
    }

    function saveConfiguration() {
        if (!selectedPlantId) {
            showModal('Erro', 'Por favor, selecione uma planta.', 'warning');
            return;
        }

        const weeklyWatering = parseInt(weeklyWateringInput.value, 10);
        const wateringTime = wateringTimeInput.value;

        // Validações
        if (weeklyWatering < 1 || weeklyWatering > 7) {
            showModal('Erro', 'O número de regas deve estar entre 1 e 7 por semana.', 'warning');
            return;
        }

        if (!wateringTime) {
            showModal('Erro', 'Por favor, defina a hora da rega.', 'warning');
            return;
        }

        // Salvar configuração (sensor sempre OK na simulação)
        const config = {
            weeklyWatering,
            wateringTime,
            sensorStatus: 'ok',
            lastUpdated: new Date().toISOString()
        };

        const key = `irrigation_config_${selectedPlantId}`;
        localStorage.setItem(key, JSON.stringify(config));

        // Feedback de sucesso
        const plant = plants.find(p => p.id == selectedPlantId);
        showModal(
            'Sucesso',
            `Configurações de rega automática para "${plant.name}" foram salvas com sucesso!`,
            'success'
        );
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
                    <button class="btn-primary" id="okBtn">OK</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Estilos do modal (inline para simplicidade)
        addModalStyles();

        modal.querySelector('#okBtn').addEventListener('click', () => {
            document.body.removeChild(modal);
        });
    }

    function addModalStyles() {
        if (document.getElementById('modal-styles')) return;

        const style = document.createElement('style');
        style.id = 'modal-styles';
        style.textContent = `
            .modal-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.6);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 2000;
                backdrop-filter: blur(4px);
            }
            .modal-content {
                background: white;
                border-radius: 16px;
                width: 90%;
                max-width: 450px;
                box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
                overflow: hidden;
                animation: modalSlideIn 0.3s ease;
            }
            @keyframes modalSlideIn {
                from { transform: translateY(-50px); opacity: 0; }
                to { transform: translateY(0); opacity: 1; }
            }
            .modal-header {
                padding: 1.5rem;
                border-bottom: 2px solid rgba(0, 0, 0, 0.1);
            }
            .modal-header.success {
                background: linear-gradient(135deg, rgba(76, 175, 80, 0.1), rgba(139, 195, 74, 0.1));
            }
            .modal-header.warning {
                background: linear-gradient(135deg, rgba(255, 193, 7, 0.1), rgba(255, 152, 0, 0.1));
            }
            .modal-header.info {
                background: linear-gradient(135deg, rgba(33, 150, 243, 0.1), rgba(3, 169, 244, 0.1));
            }
            .modal-header h3 {
                margin: 0;
                font-size: 1.3rem;
                color: #333;
            }
            .modal-body {
                padding: 2rem;
            }
            .modal-body p {
                margin: 0;
                color: #555;
                font-size: 1.05rem;
                line-height: 1.6;
            }
            .modal-footer {
                padding: 1.5rem;
                background: rgba(0, 0, 0, 0.02);
                border-top: 2px solid rgba(0, 0, 0, 0.1);
            }
            .btn-primary {
                width: 100%;
                padding: 0.75rem 1.5rem;
                background: linear-gradient(135deg, #667eea, #764ba2);
                color: white;
                border: none;
                border-radius: 8px;
                font-size: 1rem;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.3s;
            }
            .btn-primary:hover {
                background: linear-gradient(135deg, #5568d3, #6a3f8f);
                transform: translateY(-2px);
            }
        `;
        document.head.appendChild(style);
    }
});