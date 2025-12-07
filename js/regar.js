// @ts-nocheck
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

document.addEventListener('DOMContentLoaded', function () {
    // Botões de ação: Calendário, Verificação, Gestão, Adicionar
    const calendarButton = document.getElementById('calendarButton');
    const verifyButton = document.getElementById('verifyButton');
    const managementButton = document.getElementById('managementButton');
    const addButton = document.getElementById('addButton');

    // Função auxiliar para remover todos os modais existentes
    function removeAllModals() {
        document.querySelectorAll('.plant-selection-overlay').forEach(modal => {
            if (document.body.contains(modal)) {
                document.body.removeChild(modal);
            }
        });
    }

    // Função para verificar se uma planta foi selecionada
    function openPlantSelectionPopup(redirectUrl) {
        removeAllModals(); // Limpar modais anteriores
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
                        <button class="btn-modal btn-add-plant-modal" id="goToAddPage">
                            Adicionar Planta
                        </button>
                        <button class="btn-modal btn-cancel" id="cancelSelection">
                            Cancelar
                        </button>
                    </div>
                </div>
            `;
        } else {
            const plantOptions = plants.map(plant => `
                <label class="plant-option" data-plant-id="${plant.id}">
                    <input type="radio" name="selectedPlant" value="${plant.id}" class="plant-radio">
                    <span class="plant-name">${plant.name}</span>
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
                        <button class="btn-modal btn-confirm" id="confirmSelection" disabled>
                            Confirmar Seleção
                        </button>
                    </div>

                    <div class="modal-buttons" style="margin-top: 1em;">
                        <button class="btn-modal btn-add-plant-modal" id="goToAddPage">
                            Adicionar Planta
                        </button>
                        <button class="btn-modal btn-cancel" id="cancelSelection">
                            Cancelar
                        </button>
                    </div>
                </div>
            `;
        }

        document.body.appendChild(modal);

        // Event listeners
        const confirmButton = document.getElementById('confirmSelection');
        const cancelButton = document.getElementById('cancelSelection');
        const addPlantButton = document.getElementById('goToAddPage');

        if (cancelButton) {
            cancelButton.addEventListener('click', function () {
                document.body.removeChild(modal);
            });
        }

        if (addPlantButton) {
            addPlantButton.addEventListener('click', function () {
                sessionStorage.setItem('returnTo', redirectUrl);
                window.location.href = 'add.html';
            });
        }

        if (confirmButton) {
            confirmButton.addEventListener('click', function () {
                const selectedPlantId = document.querySelector('input[name="selectedPlant"]:checked')?.value;
                if (selectedPlantId) {
                    sessionStorage.setItem('selectedPlant', selectedPlantId);
                    window.location.href = redirectUrl;
                } else {
                    showAlert('⚠️ Atenção', 'Por favor, selecione uma planta.');
                }
            });
        }

        // Adicionar interatividade às opções de plantas
        const plantOptions = modal.querySelectorAll('.plant-option');
        plantOptions.forEach(option => {
            option.addEventListener('click', function(e) {
                if (e.target.tagName !== 'INPUT') {
                    const radio = this.querySelector('.plant-radio');
                    radio.checked = true;
                }
                
                plantOptions.forEach(opt => opt.classList.remove('selected'));
                this.classList.add('selected');
                
                if (confirmButton) {
                    confirmButton.disabled = false;
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
                    if (confirmButton) {
                        confirmButton.disabled = false;
                    }
                }
            });
        });
    }

    // Adicionar ouvintes de eventos para cada botão
    
    // Calendário: Abre seleção de planta antes de ir para o calendário
    calendarButton.addEventListener('click', function () {
        openPlantSelectionPopup('calendario.html');
    });

    // Verificação de Rega: Redireciona DIRETAMENTE sem pop-up
    verifyButton.addEventListener('click', function () {
        window.location.href = 'verificar_rega.html';
    });

    // Gestão de Sistema: Abre pop-up para selecionar planta
    managementButton.addEventListener('click', function () {
        openPlantSelectionPopup('sistema_rega.html');
    });

    // Botão Adicionar redireciona diretamente para a página add.html (se existir)
    if (addButton) {
        addButton.addEventListener('click', function () {
            window.location.href = 'add.html';
        });
    }

    // Função para verificar agendas existentes de uma planta
    function checkExistingSchedules(plantId) {
        const plant = JSON.parse(localStorage.getItem('myPlants') || '[]').find(p => p.id == plantId);
        if (!plant) return { hasSchedules: false, details: null };
        
        // Verificar sistema de rega automática
        const irrigationConfig = JSON.parse(localStorage.getItem(`irrigation_config_${plantId}`) || '{}');
        const hasIrrigation = irrigationConfig.enabled && irrigationConfig.weeklyWatering;
        
        // Verificar agendamentos manuais
        const waterings = JSON.parse(localStorage.getItem(`watering_${plantId}`) || '[]');
        const futureWaterings = waterings.filter(w => !w.completed && w.date >= new Date().toISOString().split('T')[0]);
        
        // Verificar recorrências
        const recurrences = JSON.parse(localStorage.getItem(`recurrences_${plantId}`) || '[]');
        const activeRecurrences = recurrences.filter(r => !r.stopped);
        
        return {
            hasSchedules: hasIrrigation || futureWaterings.length > 0 || activeRecurrences.length > 0,
            hasIrrigation,
            manualCount: futureWaterings.length,
            recurrenceCount: activeRecurrences.length,
            plantName: plant.name
        };
    }

    // Função para mostrar modal de conflito de agendas
    function showScheduleConflictModal(scheduleInfo, selectedType, plantId) {
        removeAllModals();
        
        const modal = document.createElement('div');
        modal.className = 'plant-selection-overlay';
        
        let conflictDetails = '<ul style="text-align: left; margin: 1em 0; color: #666;">';
        if (scheduleInfo.hasIrrigation) {
            conflictDetails += '<li>✓ Sistema de rega automática ativo</li>';
        }
        if (scheduleInfo.manualCount > 0) {
            conflictDetails += `<li>✓ ${scheduleInfo.manualCount} rega(s) manual(is) agendada(s)</li>`;
        }
        if (scheduleInfo.recurrenceCount > 0) {
            conflictDetails += `<li>✓ ${scheduleInfo.recurrenceCount} recorrência(s) ativa(s)</li>`;
        }
        conflictDetails += '</ul>';
        
        const typeLabel = selectedType === 'custom' ? 'Agenda Personalizada' : 'Sistema Automático';
        
        modal.innerHTML = `
            <div class="plant-selection-modal" style="max-width: 550px;">
                <h2 class="modal-title" style="color: #ff9800;">⚠️ Agendas Existentes</h2>
                
                <div style="padding: 1em 0;">
                    <p style="color: #555; font-size: 1em; line-height: 1.6; margin-bottom: 0.5em;">
                        A planta <strong>${scheduleInfo.plantName}</strong> já possui agendas de rega:
                    </p>
                    ${conflictDetails}
                    <p style="color: #555; font-size: 1em; line-height: 1.6; margin-top: 1em;">
                        Deseja substituir as agendas existentes pela nova <strong>${typeLabel}</strong>?
                    </p>
                </div>

                <div class="modal-buttons" style="display: flex; gap: 0.5em; flex-wrap: wrap;">
                    <button class="btn-modal btn-confirm" id="replaceSchedules" style="flex: 1; min-width: 150px; background: #ff9800;">
                        🔄 Substituir
                    </button>
                    <button class="btn-modal btn-cancel" id="keepSchedules" style="flex: 1; min-width: 150px; background: #28a745;">
                        ✓ Manter e Adicionar
                    </button>
                    <button class="btn-modal btn-cancel" id="cancelConflict" style="width: 100%;">
                        Cancelar
                    </button>
                </div>
                
                <p style="font-size: 0.85em; color: #999; margin-top: 1em; line-height: 1.4;">
                    <strong>Substituir:</strong> Remove todas as agendas existentes<br>
                    <strong>Manter:</strong> Adiciona a nova agenda sem remover as existentes
                </p>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Event listeners
        modal.querySelector('#replaceSchedules').addEventListener('click', () => {
            clearAllSchedules(plantId);
            proceedToSchedulePage(selectedType, plantId);
        });
        
        modal.querySelector('#keepSchedules').addEventListener('click', () => {
            proceedToSchedulePage(selectedType, plantId);
        });
        
        modal.querySelector('#cancelConflict').addEventListener('click', () => {
            removeAllModals();
        });
    }

    // Função para limpar todas as agendas de uma planta
    function clearAllSchedules(plantId) {
        // Limpar sistema de rega
        const irrigationConfig = JSON.parse(localStorage.getItem(`irrigation_config_${plantId}`) || '{}');
        irrigationConfig.enabled = false;
        localStorage.setItem(`irrigation_config_${plantId}`, JSON.stringify(irrigationConfig));
        
        // Limpar agendamentos manuais
        localStorage.removeItem(`watering_${plantId}`);
        
        // Limpar recorrências
        localStorage.removeItem(`recurrences_${plantId}`);
        
        // Limpar exceções
        localStorage.removeItem(`irrigation_exceptions_${plantId}`);
    }

    // Função para prosseguir para a página de agendamento
    function proceedToSchedulePage(type, plantId) {
        removeAllModals();
        sessionStorage.setItem('selectedPlant', plantId);
        
        if (type === 'custom') {
            window.location.href = 'calendario.html';
        } else {
            window.location.href = 'sistema_rega.html';
        }
    }

    // Função para mostrar modal de escolha do tipo de agenda
    function openScheduleTypeModal() {
        removeAllModals(); // Remover modais anteriores
        
        const plants = JSON.parse(localStorage.getItem('myPlants') || '[]');
        
        // Se não houver plantas, mostrar mensagem
        if (plants.length === 0) {
            const modal = document.createElement('div');
            modal.className = 'plant-selection-overlay';
            modal.innerHTML = `
                <div class="plant-selection-modal">
                    <h2 class="modal-title">Escolha uma Planta</h2>
                    
                    <div class="no-plants-message">
                        <div class="no-plants-icon">🌱</div>
                        <p><strong>Ainda não tem plantas cadastradas.</strong></p>
                        <p>Adicione sua primeira planta para começar!</p>
                    </div>
                    
                    <div class="modal-buttons">
                        <button class="btn-modal btn-add-plant-modal" id="goToAddPageFromSchedule">
                            Adicionar Planta
                        </button>
                        <button class="btn-modal btn-cancel" id="cancelScheduleType">
                            Cancelar
                        </button>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
            
            modal.querySelector('#goToAddPageFromSchedule').addEventListener('click', () => {
                sessionStorage.setItem('returnTo', 'regar.html');
                window.location.href = 'add.html';
            });
            
            modal.querySelector('#cancelScheduleType').addEventListener('click', () => {
                removeAllModals();
            });
            
            return;
        }
        
        // Modal de seleção de planta primeiro
        const modal = document.createElement('div');
        modal.className = 'plant-selection-overlay';
        
        const plantOptions = plants.map(plant => `
            <label class="plant-option" data-plant-id="${plant.id}">
                <input type="radio" name="schedulePlant" value="${plant.id}" class="plant-radio">
                <span class="plant-name">${plant.name}</span>
                <span class="plant-icon">🌿</span>
            </label>
        `).join('');
        
        modal.innerHTML = `
            <div class="plant-selection-modal">
                <h2 class="modal-title">Escolha uma Planta para Agendar</h2>

                <div class="plant-list" id="plantListSchedule">
                    ${plantOptions}
                </div>

                <div class="modal-buttons">
                    <button class="btn-modal btn-confirm" id="confirmPlantSchedule" disabled>
                        Continuar
                    </button>
                    <button class="btn-modal btn-cancel" id="cancelPlantSchedule">
                        Cancelar
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        const confirmButton = modal.querySelector('#confirmPlantSchedule');
        const plantOptionsList = modal.querySelectorAll('.plant-option');
        
        // Interatividade das opções
        plantOptionsList.forEach(option => {
            option.addEventListener('click', function(e) {
                if (e.target.tagName !== 'INPUT') {
                    const radio = this.querySelector('.plant-radio');
                    radio.checked = true;
                }
                
                plantOptionsList.forEach(opt => opt.classList.remove('selected'));
                this.classList.add('selected');
                confirmButton.disabled = false;
            });
        });
        
        modal.querySelectorAll('.plant-radio').forEach(radio => {
            radio.addEventListener('change', function() {
                if (this.checked) {
                    const option = this.closest('.plant-option');
                    plantOptionsList.forEach(opt => opt.classList.remove('selected'));
                    option.classList.add('selected');
                    confirmButton.disabled = false;
                }
            });
        });
        
        // Confirmar planta e mostrar tipos de agenda
        confirmButton.addEventListener('click', () => {
            const selectedPlantId = modal.querySelector('input[name="schedulePlant"]:checked')?.value;
            if (!selectedPlantId) return;
            
            removeAllModals();
            showScheduleTypeModalForPlant(selectedPlantId);
        });
        
        modal.querySelector('#cancelPlantSchedule').addEventListener('click', () => {
            removeAllModals();
        });
    }

    // Função para mostrar tipos de agenda após selecionar planta
    function showScheduleTypeModalForPlant(plantId) {
        removeAllModals();
        
        const modal = document.createElement('div');
        modal.className = 'plant-selection-overlay';
        modal.innerHTML = `
            <div class="plant-selection-modal" style="max-width: 500px;">
                <h2 class="modal-title">Como deseja agendar as regas?</h2>
                
                <div style="padding: 1em 0;">
                    <p style="color: #555; font-size: 1em; line-height: 1.5; margin-bottom: 1.5em;">
                        Escolha o tipo de agenda que melhor se adapta às suas necessidades:
                    </p>
                </div>

                <div class="schedule-options" style="display: flex; flex-direction: column; gap: 1em; margin-bottom: 1.5em;">
                    <!-- Agenda Personalizada -->
                    <div class="schedule-option-card" data-type="custom" style="border: 2px solid #28a745; border-radius: 0.8em; padding: 1.5em; cursor: pointer; transition: all 0.3s ease; background: rgba(40, 167, 69, 0.05);">
                        <div style="display: flex; align-items: center; gap: 1em;">
                            <div style="font-size: 2.5em;">📅</div>
                            <div style="flex: 1;">
                                <h3 style="margin: 0 0 0.3em 0; color: #28a745; font-size: 1.2em;">Agenda Personalizada</h3>
                                <p style="margin: 0; color: #666; font-size: 0.95em;">
                                    Escolha manualmente os dias e horários de rega no calendário
                                </p>
                            </div>
                        </div>
                    </div>

                    <!-- Agenda Automática -->
                    <div class="schedule-option-card" data-type="auto" style="border: 2px solid #667eea; border-radius: 0.8em; padding: 1.5em; cursor: pointer; transition: all 0.3s ease; background: rgba(102, 126, 234, 0.05);">
                        <div style="display: flex; align-items: center; gap: 1em;">
                            <div style="font-size: 2.5em;">⚙️</div>
                            <div style="flex: 1;">
                                <h3 style="margin: 0 0 0.3em 0; color: #667eea; font-size: 1.2em;">Sistema Automático</h3>
                                <p style="margin: 0; color: #666; font-size: 0.95em;">
                                    Configure a rega automática semanal consoante a recomendação ideal para sua planta
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="modal-buttons">
                    <button class="btn-modal btn-cancel" id="cancelScheduleTypeModal">
                        Cancelar
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Event listeners
        modal.querySelector('#cancelScheduleTypeModal').addEventListener('click', () => {
            removeAllModals();
        });
        
        // Hover effects e seleção
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
                const type = this.getAttribute('data-type');
                
                // Verificar se há agendas existentes
                const scheduleInfo = checkExistingSchedules(plantId);
                
                if (scheduleInfo.hasSchedules) {
                    // Mostrar modal de conflito
                    showScheduleConflictModal(scheduleInfo, type, plantId);
                } else {
                    // Prosseguir diretamente
                    proceedToSchedulePage(type, plantId);
                }
            });
        });
        
        // Permitir fechar com ESC
        const handleEsc = (e) => {
            if (e.key === 'Escape') {
                removeAllModals();
                document.removeEventListener('keydown', handleEsc);
            }
        };
        document.addEventListener('keydown', handleEsc);
    }
});
