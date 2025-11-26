// Utilitário: escapar html em strings
function escapeHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

// Carregar plantas do localStorage
function loadPlants() {
    console.log('loadPlants() chamada');
    const plants = JSON.parse(localStorage.getItem('myPlants') || '[]');
    console.log('Plantas carregadas do localStorage:', plants);
    
    const container = document.getElementById('plantsContainer');
    const emptyState = document.getElementById('emptyState');
    
    console.log('Container encontrado:', !!container);
    console.log('EmptyState encontrado:', !!emptyState);
    
    if (!container || !emptyState) {
        console.error('Elementos não encontrados!');
        return;
    }
    
    if (plants.length === 0) {
        console.log('Nenhuma planta encontrada, mostrando estado vazio');
        emptyState.style.display = 'block';
        container.style.display = 'none';
        return;
    }
    
    console.log(`Carregando ${plants.length} planta(s)`);
    emptyState.style.display = 'none';
    container.style.display = 'grid';
    container.innerHTML = '';
    
    plants.forEach((plant, index) => {
        console.log(`Criando card para planta ${index}:`, plant.name);
        const card = createPlantCard(plant);
        container.appendChild(card);
    });
}

// Criar card de planta
function createPlantCard(plant) {
    const card = document.createElement('div');
    card.className = 'plant-card';
    
    const formattedDate = plant.plantDate ? new Date(plant.plantDate).toLocaleDateString('pt-PT') : '-';
    
    // Preparar informações adicionais
    const locationInfo = plant.location ? `<p class="plant-location">📍 ${plant.location}</p>` : '';
    const notesInfo = plant.notes ? `<p class="plant-notes">📝 ${plant.notes}</p>` : '';
    
    card.innerHTML = `
        <img src="${plant.image}" alt="${plant.name}" class="plant-image" onclick="viewPlantDetails(${plant.id})">
        <div class="plant-info">
            <h3 class="plant-name">${plant.name}</h3>
            <p class="plant-date">🌱 Plantada em: ${formattedDate}</p>
            ${locationInfo}
            ${notesInfo}
            <div class="plant-actions">
                <button class="btn-edit" onclick="editPlant(${plant.id})">Editar</button>
                <button class="btn-delete" onclick="deletePlant(${plant.id})">Remover</button>
            </div>
        </div>
    `;
    
    return card;
}

const PLANT_HEALTH_VARIANTS = [
    {
        status: 'healthy',
        healthStatusText: 'Saudável',
        diagnosis: 'A {plant} está vigorosa. Continue com o esquema atual de rega e garanta luz indireta suave.'
    },
    {
        status: 'needs-water',
        healthStatusText: 'Precisa de água',
        diagnosis: 'A {plant} apresenta sinais de sede. Faça uma rega completa e verifique o solo dentro de 48 horas.'
    },
    {
        status: 'unhealthy',
        healthStatusText: 'Sob stress',
        diagnosis: 'Detectámos folhas amareladas em {plant}. Afrouxe a terra, reduza sol direto e avalie pragas.'
    }
];

function generateRandomHealthState(currentStatus) {
    if (!Array.isArray(PLANT_HEALTH_VARIANTS) || PLANT_HEALTH_VARIANTS.length === 0) {
        return null;
    }

    const availableVariants = PLANT_HEALTH_VARIANTS.filter(variant => variant.status !== currentStatus);
    const pool = availableVariants.length ? availableVariants : PLANT_HEALTH_VARIANTS;
    const randomIndex = Math.floor(Math.random() * pool.length);
    return pool[randomIndex];
}

// Ver detalhes da planta
function viewPlantDetails(id) {
    const plants = JSON.parse(localStorage.getItem('myPlants') || '[]');
    const plant = plants.find(p => p.id === id);
    if (!plant) {
        showWarningPopup('Planta não encontrada.');
        return;
    }

    // Inicializar fotos de progresso se não existir
    if (!plant.progressPhotos) {
        plant.progressPhotos = [{
            image: plant.image,
            date: plant.addedDate || new Date().toISOString()
        }];
        // Salvar a inicialização
        const plantIndex = plants.findIndex(p => p.id === id);
        if (plantIndex !== -1) {
            plants[plantIndex] = plant;
            localStorage.setItem('myPlants', JSON.stringify(plants));
        }
    }

    // Criar modal de detalhes
    const detailsHTML = `
        <div class="plant-details-overlay" id="plantDetailsOverlay">
            <div class="plant-details-container">
                <button class="close-details" onclick="closePlantDetails()">✕</button>
                
                <h1 class="details-title">${escapeHtml(plant.name)}</h1>
                
                <div class="details-content">
                    <!-- Seção de Progresso (Esquerda) -->
                    <div class="progress-section">
                        <h2 class="section-header">Progresso</h2>
                        <div class="progress-photos">
                            ${plant.progressPhotos.map((photo, index) => `
                                <div class="progress-photo-item">
                                    <div class="progress-photo-wrapper">
                                        <img src="${photo.image}" alt="Progresso ${index + 1}" class="progress-photo">
                                        <button class="delete-progress-photo" onclick="deleteProgressPhoto(${id}, ${index})" title="Remover foto">✕</button>
                                    </div>
                                    <p class="progress-date">${new Date(photo.date).toLocaleDateString('pt-PT')}</p>
                                </div>
                            `).join('')}
                            <div class="progress-photo-item add-photo-item" onclick="addProgressPhoto(${id})">
                                <div class="add-photo-button">
                                    <span class="add-icon">+</span>
                                </div>
                                <p class="progress-date">Adicionar</p>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Seção de Verificação (Direita) -->
                    <div class="verification-section">
                        <div class="vertical-bar">
                            <h3 class="bar-title">Verificar estado da Planta</h3>
                        </div>
                        
                        <div class="verification-content">
                            <button class="camera-button" onclick="importPlantPhoto(${id})">
                                <span class="camera-icon">📷</span>
                                <span>Importar Foto</span>
                            </button>
                            
                            <div class="health-status ${plant.healthStatus || 'healthy'}">
                                <p class="status-label">Estado da planta:</p>
                                <p class="status-value">${plant.healthStatusText || 'Saudável'}</p>
                            </div>
                            
                            <div class="diagnosis-section">
                                <h3 class="diagnosis-header">Diagnóstico:</h3>
                                <p class="diagnosis-text">
                                    ${plant.diagnosis || 'A ' + plant.name + ' apresenta sintomas de uma planta com falta de água. É recomendado que defina lembretes na agenda de 4 em 4 dias de forma a que a planta possa receber a quantidade necessária de água.'}
                                </p>
                                
                                <div class="diagnosis-actions">
                                    <button class="btn-schedule" onclick="schedulePlant(${plant.id})">Agendar</button>
                                    <button class="btn-dismiss" onclick="dismissDiagnosis()">Dispensar</button>
                                </div>
                            </div>
                            
                            <div class="plant-details-info">
                                <h3 class="info-header">Estado Atual</h3>
                                <div class="info-grid">
                                    <div class="info-item">
                                        <span class="info-icon">🌍</span>
                                        <span class="info-label">Solo:</span>
                                        <span class="info-value">${plant.soilType || 'Comum'}</span>
                                    </div>
                                    <div class="info-item">
                                        <span class="info-icon">💧</span>
                                        <span class="info-label">Rega:</span>
                                        <span class="info-value">${plant.wateringSchedule || 'Não Agendada'}</span>
                                    </div>
                                    <div class="info-item">
                                        <span class="info-icon">☀️</span>
                                        <span class="info-label">Luz:</span>
                                        <span class="info-value">${plant.lightStatus || 'Estável'}</span>
                                    </div>
                                    <div class="info-item">
                                        <span class="info-icon">📍</span>
                                        <span class="info-label">Local:</span>
                                        <span class="info-value">${plant.location || 'Escritório'}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', detailsHTML);
}

// Fechar detalhes da planta
function closePlantDetails() {
    const overlay = document.getElementById('plantDetailsOverlay');
    if (overlay) {
        overlay.remove();
    }
}

// Adicionar foto de progresso
function addProgressPhoto(plantId) {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
        const file = e.target.files[0];
        if (!file || !file.type.startsWith('image/')) {
            alert('Por favor, selecione uma imagem válida.');
            return;
        }
        
        const reader = new FileReader();
        reader.onload = (ev) => {
            let plants = JSON.parse(localStorage.getItem('myPlants') || '[]');
            const plantIndex = plants.findIndex(p => p.id === plantId);
            
            if (plantIndex !== -1) {
                // Garantir que progressPhotos existe e é um array
                if (!plants[plantIndex].progressPhotos || !Array.isArray(plants[plantIndex].progressPhotos)) {
                    plants[plantIndex].progressPhotos = [{
                        image: plants[plantIndex].image,
                        date: plants[plantIndex].addedDate || new Date().toISOString()
                    }];
                }
                
                // Adicionar nova foto ao array (não sobrescrever)
                plants[plantIndex].progressPhotos.push({
                    image: ev.target.result,
                    date: new Date().toISOString()
                });

                const simulatedState = generateRandomHealthState(plants[plantIndex].healthStatus);
                if (simulatedState) {
                    const plantName = plants[plantIndex].name || 'a planta';
                    const diagnosisText = simulatedState.diagnosis.replace(/\{plant\}/g, plantName);
                    plants[plantIndex].healthStatus = simulatedState.status;
                    plants[plantIndex].healthStatusText = simulatedState.healthStatusText;
                    plants[plantIndex].diagnosis = diagnosisText;
                    plants[plantIndex].healthStatusUpdatedAt = new Date().toISOString();
                }
                
                console.log(`Foto de progresso adicionada. Total: ${plants[plantIndex].progressPhotos.length}`);
                
                localStorage.setItem('myPlants', JSON.stringify(plants));
                
                // Notificar progresso
                if (typeof window.notificarProgressoPlanta === 'function') {
                    window.notificarProgressoPlanta(plants[plantIndex].name);
                }
                
                closePlantDetails();
                viewPlantDetails(plantId);

                if (simulatedState) {
                    showInfoPopup(`Estado atualizado para "${simulatedState.healthStatusText}". Diagnóstico: ${plants[plantIndex].diagnosis}`);
                }
            }
        };
        reader.readAsDataURL(file);
    };
    input.click();
}

// Remover foto de progresso
function deleteProgressPhoto(plantId, photoIndex) {
    showDeletePhotoConfirmPopup(plantId, photoIndex);
}

// Pop-up de confirmação para remover foto de progresso
function showDeletePhotoConfirmPopup(plantId, photoIndex) {
    const popup = document.createElement('div');
    popup.className = 'delete-confirm-overlay';
    popup.innerHTML = `
        <div class="delete-confirm-container">
            <h3 class="delete-confirm-title">Esta página diz</h3>
            <p class="delete-confirm-message">Tem certeza que deseja remover esta foto de progresso?</p>
            <div class="delete-confirm-buttons">
                <button class="delete-confirm-btn" id="confirmDeletePhotoBtn">OK</button>
                <button class="delete-cancel-btn" id="cancelDeletePhotoBtn">Cancelar</button>
            </div>
        </div>
    `;
    document.body.appendChild(popup);
    
    document.getElementById('confirmDeletePhotoBtn').addEventListener('click', () => {
        document.body.removeChild(popup);
        proceedDeleteProgressPhoto(plantId, photoIndex);
    });
    
    document.getElementById('cancelDeletePhotoBtn').addEventListener('click', () => {
        document.body.removeChild(popup);
    });
}

// Processar remoção da foto de progresso
function proceedDeleteProgressPhoto(plantId, photoIndex) {
    
    let plants = JSON.parse(localStorage.getItem('myPlants') || '[]');
    const plantIndex = plants.findIndex(p => p.id === plantId);
    
    if (plantIndex !== -1 && plants[plantIndex].progressPhotos) {
        // Não permitir remover se for a última foto
        if (plants[plantIndex].progressPhotos.length <= 1) {
            alert('Não é possível remover a última foto de progresso.');
            return;
        }
        
        // Remover a foto no índice especificado
        plants[plantIndex].progressPhotos.splice(photoIndex, 1);
        
        console.log(`Foto ${photoIndex} removida. Total restante: ${plants[plantIndex].progressPhotos.length}`);
        
        localStorage.setItem('myPlants', JSON.stringify(plants));
        closePlantDetails();
        viewPlantDetails(plantId);
    }
}

// Importar foto da planta (adicionar ao progresso)
function importPlantPhoto(plantId) {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
        const file = e.target.files[0];
        if (!file || !file.type.startsWith('image/')) {
            alert('Por favor, selecione uma imagem válida.');
            return;
        }
        
        const reader = new FileReader();
        reader.onload = (ev) => {
            let plants = JSON.parse(localStorage.getItem('myPlants') || '[]');
            const plantIndex = plants.findIndex(p => p.id === plantId);
            
            if (plantIndex !== -1) {
                // Garantir que progressPhotos existe e é um array
                if (!plants[plantIndex].progressPhotos || !Array.isArray(plants[plantIndex].progressPhotos)) {
                    plants[plantIndex].progressPhotos = [{
                        image: plants[plantIndex].image,
                        date: plants[plantIndex].addedDate || new Date().toISOString()
                    }];
                }
                
                // Adicionar nova foto ao array
                plants[plantIndex].progressPhotos.push({
                    image: ev.target.result,
                    date: new Date().toISOString()
                });
                
                const simulatedState = generateRandomHealthState(plants[plantIndex].healthStatus);
                if (simulatedState) {
                    const plantName = plants[plantIndex].name || 'a planta';
                    const diagnosisText = simulatedState.diagnosis.replace(/\{plant\}/g, plantName);
                    plants[plantIndex].healthStatus = simulatedState.status;
                    plants[plantIndex].healthStatusText = simulatedState.healthStatusText;
                    plants[plantIndex].diagnosis = diagnosisText;
                    plants[plantIndex].healthStatusUpdatedAt = new Date().toISOString();
                }

                console.log(`Foto importada. Total: ${plants[plantIndex].progressPhotos.length}`);
                
                localStorage.setItem('myPlants', JSON.stringify(plants));
                closePlantDetails();
                viewPlantDetails(plantId);

                if (simulatedState) {
                    showInfoPopup(`Estado atualizado para "${simulatedState.healthStatusText}". Diagnóstico: ${plants[plantIndex].diagnosis}`);
                }
            }
        };
        reader.readAsDataURL(file);
    };
    input.click();
}

// Dispensar diagnóstico
function dismissDiagnosis() {
    showInfoPopup('Diagnóstico dispensado.', closePlantDetails);
}

// Pop-up de aviso genérico
function showWarningPopup(message) {
    const popup = document.createElement('div');
    popup.className = 'warning-popup-overlay';
    popup.innerHTML = `
        <div class="warning-popup-container">
            <h3 class="warning-popup-title">Esta página diz</h3>
            <p class="warning-popup-message">${message}</p>
            <button class="warning-popup-btn">OK</button>
        </div>
    `;
    document.body.appendChild(popup);
    
    popup.querySelector('.warning-popup-btn').addEventListener('click', () => {
        document.body.removeChild(popup);
    });
}

// Pop-up de informação genérico
function showInfoPopup(message, callback) {
    const popup = document.createElement('div');
    popup.className = 'warning-popup-overlay';
    popup.innerHTML = `
        <div class="warning-popup-container">
            <h3 class="warning-popup-title">Esta página diz</h3>
            <p class="warning-popup-message">${message}</p>
            <button class="warning-popup-btn">OK</button>
        </div>
    `;
    document.body.appendChild(popup);
    
    popup.querySelector('.warning-popup-btn').addEventListener('click', () => {
        document.body.removeChild(popup);
        if (callback) callback();
    });
}

// Adicionar a lógica para redirecionar para o calendário
function schedulePlant(plantId) {
    // Remover qualquer modal de agendamento anterior
    const existingModal = document.querySelector('.schedule-selection-overlay');
    if (existingModal) {
        existingModal.remove();
    }
    
    // Modal de escolha entre agenda personalizada e automática
    const modal = document.createElement('div');
    modal.className = 'schedule-selection-overlay';
    modal.innerHTML = `
        <div class="plant-selection-modal" style="max-width: 500px;">
            <h2 class="modal-title">Escolha o Tipo de Agenda</h2>
            
            <div style="padding: 1em 0;">
                <p style="color: #555; font-size: 1em; line-height: 1.5; margin-bottom: 1.5em;">
                    Como deseja agendar as regas para esta planta?
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
                                Agendar rega manual conforme a recomendação ideal para sua planta
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
                <button class="btn-modal btn-cancel" id="cancelScheduleModal">
                    Cancelar
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Função para limpar e fechar o modal
    const closeScheduleModal = () => {
        if (document.body.contains(modal)) {
            document.body.removeChild(modal);
        }
        document.removeEventListener('keydown', handleEsc);
    };
    
    // Event listener para cancelar
    const cancelBtn = modal.querySelector('#cancelScheduleModal');
    cancelBtn.addEventListener('click', closeScheduleModal);
    
    // Click no overlay para fechar
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeScheduleModal();
        }
    });
    
    // Hover effects e click nas opções
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
            
            // Guardar planta selecionada
            sessionStorage.setItem('selectedPlant', plantId);
            
            if (type === 'custom') {
                // Verificar se há sistema automático ativo
                const irrigationConfig = JSON.parse(localStorage.getItem(`irrigation_config_${plantId}`) || '{}');
                const hasActiveIrrigation = irrigationConfig.enabled && irrigationConfig.weeklyWatering;
                
                if (hasActiveIrrigation) {
                    // Mostrar modal de conflito
                    closeScheduleModal();
                    showCustomScheduleConflictModal(plantId, irrigationConfig);
                } else {
                    // Não há conflito, ir direto para o calendário
                    closeScheduleModal();
                    closePlantDetails();
                    window.location.href = `calendario.html?plantId=${plantId}&recurrence=4&fromDiagnostic=true`;
                }
            } else {
                // Sistema Automático
                closeScheduleModal();
                closePlantDetails();
                window.location.href = `sistema_rega.html?plantId=${plantId}&frequency=4`;
            }
        });
    });
    
    // Permitir fechar com ESC
    const handleEsc = (e) => {
        if (e.key === 'Escape') {
            closeScheduleModal();
        }
    };
    document.addEventListener('keydown', handleEsc);
}

// Mostrar modal de conflito com sistema automático
function showCustomScheduleConflictModal(plantId, irrigationConfig) {
    const modal = document.createElement('div');
    modal.className = 'schedule-selection-overlay';
    
    const currentFrequency = irrigationConfig.weeklyWatering || 0;
    const isDifferentFromRecommendation = currentFrequency !== 4;
    
    modal.innerHTML = `
        <div class="plant-selection-modal" style="max-width: 550px;">
            <h2 class="modal-title" style="color: #ff9800;">⚠️ Sistema Automático Ativo</h2>
            
            <div style="padding: 1em 0;">
                <p style="color: #555; font-size: 1em; line-height: 1.6; margin-bottom: 1em;">
                    Esta planta possui o <strong>Sistema Automático</strong> ativo com <strong>${currentFrequency} regas por semana</strong>.
                </p>
                ${isDifferentFromRecommendation ? `
                    <p style="color: #667eea; font-size: 0.95em; line-height: 1.5; margin-bottom: 1em; padding: 0.8em; background: rgba(102, 126, 234, 0.1); border-radius: 8px;">
                        💡 <strong>Nota:</strong> O diagnóstico recomenda <strong>4 regas por semana</strong>. A configuração atual é diferente da recomendação.
                    </p>
                ` : ''}
                <p style="color: #555; font-size: 1em; line-height: 1.6; margin-bottom: 1em;">
                    O que deseja fazer?
                </p>
            </div>

            <div style="display: flex; flex-direction: column; gap: 1em; margin-bottom: 1.5em;">
                <!-- Opção 1: Desativar Sistema -->
                <div class="conflict-option-card" data-action="disable" style="border: 2px solid #28a745; border-radius: 0.8em; padding: 1.2em; cursor: pointer; transition: all 0.3s ease; background: rgba(40, 167, 69, 0.05);">
                    <div style="display: flex; align-items: center; gap: 1em;">
                        <div style="font-size: 2em;">📅</div>
                        <div style="flex: 1;">
                            <h3 style="margin: 0 0 0.3em 0; color: #28a745; font-size: 1.1em;">Desativar Sistema e Usar Agenda Personalizada</h3>
                            <p style="margin: 0; color: #666; font-size: 0.9em;">
                                O sistema automático será desativado e você poderá agendar regas manualmente no calendário
                            </p>
                        </div>
                    </div>
                </div>

                <!-- Opção 2: Manter Sistema -->
                <div class="conflict-option-card" data-action="keep" style="border: 2px solid #667eea; border-radius: 0.8em; padding: 1.2em; cursor: pointer; transition: all 0.3s ease; background: rgba(102, 126, 234, 0.05);">
                    <div style="display: flex; align-items: center; gap: 1em;">
                        <div style="font-size: 2em;">⚙️</div>
                        <div style="flex: 1;">
                            <h3 style="margin: 0 0 0.3em 0; color: #667eea; font-size: 1.1em;">Manter Sistema ${isDifferentFromRecommendation ? 'e Ajustar' : 'Ativo'}</h3>
                            <p style="margin: 0; color: #666; font-size: 0.9em;">
                                ${isDifferentFromRecommendation 
                                    ? 'Ajusta automaticamente para 4 regas por semana (recomendação) e adiciona regas personalizadas' 
                                    : 'Mantém o sistema ativo e adiciona regas personalizadas no calendário'}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div class="modal-buttons">
                <button class="btn-modal btn-cancel" id="cancelConflictModal">
                    Cancelar
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Função para fechar modal
    const closeConflictModal = () => {
        if (document.body.contains(modal)) {
            document.body.removeChild(modal);
        }
        document.removeEventListener('keydown', handleEscConflict);
    };
    
    // Cancelar
    modal.querySelector('#cancelConflictModal').addEventListener('click', closeConflictModal);
    
    // Click no overlay
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeConflictModal();
        }
    });
    
    // Hover e click nas opções
    const optionCards = modal.querySelectorAll('.conflict-option-card');
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
            
            if (action === 'disable') {
                // Desativar sistema automático
                irrigationConfig.enabled = false;
                localStorage.setItem(`irrigation_config_${plantId}`, JSON.stringify(irrigationConfig));
                
                closeConflictModal();
                closePlantDetails();
                window.location.href = `calendario.html?plantId=${plantId}&recurrence=4&fromDiagnostic=true`;
            } else {
                // Manter sistema e NÃO criar recorrência personalizada
                // Apenas ajustar se necessário
                if (isDifferentFromRecommendation) {
                    // Ajustar para recomendação do diagnóstico
                    irrigationConfig.weeklyWatering = 4;
                    irrigationConfig.enabled = true;
                    if (!irrigationConfig.wateringTime) {
                        irrigationConfig.wateringTime = '08:00';
                    }
                    localStorage.setItem(`irrigation_config_${plantId}`, JSON.stringify(irrigationConfig));
                }
                
                closeConflictModal();
                closePlantDetails();
                
                // Redirecionar para sistema de rega para mostrar configuração
                showInfoPopup(
                    `Sistema automático mantido${isDifferentFromRecommendation ? ' e ajustado para 4 regas por semana' : ''}.`,
                    () => {
                        sessionStorage.setItem('selectedPlant', plantId);
                        window.location.href = 'sistema_rega.html';
                    }
                );
            }
        });
    });
    
    // ESC para fechar
    const handleEscConflict = (e) => {
        if (e.key === 'Escape') {
            closeConflictModal();
        }
    };
    document.addEventListener('keydown', handleEscConflict);
}

// Editar planta
function editPlant(id) {
    let plants = JSON.parse(localStorage.getItem('myPlants') || '[]');
    const plant = plants.find(p => p.id === id);
    if (!plant) {
        alert('Planta não encontrada.');
        return;
    }

    // Modal HTML
    const modalHTML = `
        <div class="plant-form-overlay" id="editPlantOverlay">
            <div class="plant-form-container">
                <h2>Editar Planta</h2>
                <form id="editPlantForm">
                    <div class="form-field">
                        <label for="editPlantName">Nome da Planta:</label>
                        <input type="text" id="editPlantName" name="editPlantName" value="${escapeHtml(plant.name)}" required>
                    </div>
                    <div class="form-field">
                        <label for="editPlantDate">Data de Plantio:</label>
                        <input type="date" id="editPlantDate" name="editPlantDate" value="${plant.plantDate || ''}">
                    </div>
                    <div class="form-field">
                        <label for="editPlantLocation">Localização:</label>
                        <input type="text" id="editPlantLocation" name="editPlantLocation" value="${escapeHtml(plant.location || '')}">
                    </div>
                    <div class="form-field">
                        <label for="editPlantNotes">Notas:</label>
                        <textarea id="editPlantNotes" name="editPlantNotes" rows="3">${escapeHtml(plant.notes || '')}</textarea>
                    </div>
                    <div class="form-field">
                        <label>Imagem atual:</label>
                        <div style="display:flex;gap:1em;align-items:center;">
                            <img id="editImagePreview" src="${plant.image}" alt="preview" style="width:100px;height:70px;object-fit:cover;border-radius:6px;border:1px solid #ddd;">
                            <div>
                                <label for="editImageInput" style="cursor:pointer;color:#4169e1;text-decoration:underline;">Escolher nova imagem</label>
                                <input type="file" id="editImageInput" accept="image/*" style="display:none;">
                                <div style="font-size:0.9em;color:#666;margin-top:6px;">(opcional)</div>
                            </div>
                        </div>
                    </div>
                    <div class="form-buttons">
                        <button type="submit" class="btn btn-confirm">Confirmar</button>
                        <button type="button" class="btn btn-cancel">Cancelar</button>
                    </div>
                </form>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);

    const overlay = document.getElementById('editPlantOverlay');
    const form = document.getElementById('editPlantForm');
    const inputImage = document.getElementById('editImageInput');
    const preview = document.getElementById('editImagePreview');

    let newImageData = plant.image;

    // quando o utilizador escolhe nova imagem
    inputImage.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (!file.type.startsWith('image/')) {
            showWarningPopup('Por favor selecione uma imagem válida.');
            return;
        }
        const reader = new FileReader();
        reader.onload = (ev) => {
            newImageData = ev.target.result;
            preview.src = newImageData;
        };
        reader.readAsDataURL(file);
    });

    // cancelar
    document.querySelector('#editPlantOverlay .btn-cancel').addEventListener('click', () => {
        overlay.remove();
    });

    // submeter formulário e guardar alterações
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const updatedName = document.getElementById('editPlantName').value.trim();
        const updatedDate = document.getElementById('editPlantDate').value || '';
        const updatedLocation = document.getElementById('editPlantLocation').value.trim();
        const updatedNotes = document.getElementById('editPlantNotes').value.trim();

        // atualizar o objeto
        plants = plants.map(p => {
            if (p.id === id) {
                return {
                    ...p,
                    name: updatedName || p.name,
                    plantDate: updatedDate,
                    location: updatedLocation,
                    notes: updatedNotes,
                    image: newImageData || p.image,
                    updatedDate: new Date().toISOString()
                };
            }
            return p;
        });

        localStorage.setItem('myPlants', JSON.stringify(plants));
        overlay.remove();
        loadPlants();
        showInfoPopup('Informações da planta atualizadas.');
    });
}

// Remover planta
function deletePlant(id) {
    showDeleteConfirmPopup(id);
}

// Pop-up de confirmação para remover planta
function showDeleteConfirmPopup(id) {
    const popup = document.createElement('div');
    popup.className = 'delete-confirm-overlay';
    popup.innerHTML = `
        <div class="delete-confirm-container">
            <h3 class="delete-confirm-title">Esta página diz</h3>
            <p class="delete-confirm-message">Tem certeza que deseja remover esta planta?</p>
            <div class="delete-confirm-buttons">
                <button class="delete-confirm-btn" id="confirmDeleteBtn">OK</button>
                <button class="delete-cancel-btn" id="cancelDeleteBtn">Cancelar</button>
            </div>
        </div>
    `;
    document.body.appendChild(popup);
    
    document.getElementById('confirmDeleteBtn').addEventListener('click', () => {
        let plants = JSON.parse(localStorage.getItem('myPlants') || '[]');
        plants = plants.filter(plant => plant.id !== id);
        localStorage.setItem('myPlants', JSON.stringify(plants));
        document.body.removeChild(popup);
        loadPlants();
    });
    
    document.getElementById('cancelDeleteBtn').addEventListener('click', () => {
        document.body.removeChild(popup);
    });
}

// Carregar plantas ao iniciar
console.log('Script minhasplantas.js carregado');
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM carregado, chamando loadPlants()');
    loadPlants();
});