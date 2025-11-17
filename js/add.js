// Funcionalidade de upload de imagem
const uploadArea = document.getElementById('uploadArea');
const fileInput = document.getElementById('fileInput');
let uploadedImage = null;

// Verificar se estamos na página add.html
if (uploadArea && fileInput) {
    // Click para abrir seletor de arquivo
    uploadArea.addEventListener('click', () => {
        fileInput.click();
    });

    // Drag and drop
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('dragover');
    });

    uploadArea.addEventListener('dragleave', () => {
        uploadArea.classList.remove('dragover');
    });

    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleFile(files[0]);
        }
    });

    // Seleção de arquivo via input
    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleFile(e.target.files[0]);
        }
    });
}

// Processar arquivo
function handleFile(file) {
    if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
            uploadedImage = e.target.result;
            console.log('Imagem carregada:', file.name);
            
            // Mostrar preview da imagem
            uploadArea.innerHTML = `
                <img src="${uploadedImage}" alt="Preview" style="max-width: 100%; max-height: 100%; object-fit: contain; border-radius: 0.5em;">
            `;
        };
        reader.readAsDataURL(file);
    } else {
        showWarningPopup('Por favor, selecione um arquivo de imagem válido.');
    }
}

// Função para mostrar pop-up de sucesso
function showSuccessPopup(message, callback) {
    const popup = document.createElement('div');
    popup.className = 'success-popup-overlay';
    popup.innerHTML = `
        <div class="success-popup-container">
            <div class="success-icon">✓</div>
            <p class="success-message">${message}</p>
            <button class="success-btn">OK</button>
        </div>
    `;
    document.body.appendChild(popup);
    
    popup.querySelector('.success-btn').addEventListener('click', () => {
        document.body.removeChild(popup);
        if (callback) callback();
    });
}

// Função para mostrar pop-up de aviso
function showWarningPopup(message) {
    const popup = document.createElement('div');
    popup.className = 'warning-popup-overlay';
    popup.innerHTML = `
        <div class="warning-popup-container">
            <p class="warning-message">${message}</p>
            <button class="warning-btn">OK</button>
        </div>
    `;
    document.body.appendChild(popup);
    
    popup.querySelector('.warning-btn').addEventListener('click', () => {
        document.body.removeChild(popup);
    });
}

// Event listeners para botões (apenas se existirem)
const btnYes = document.querySelector('.btn-yes');
const btnNo = document.querySelector('.btn-no');

if (btnYes) {
    btnYes.addEventListener('click', () => {
        if (!uploadedImage) {
            showWarningPopup('Por favor, adicione uma foto da planta primeiro.');
            return;
        }
        
        // Criar modal/formulário para coletar informações
        const formHTML = `
            <div class="plant-form-overlay">
                <div class="plant-form-container">
                    <h2>Informações da Planta</h2>
                    <form id="plantForm">
                        <div class="form-field">
                            <label for="plantName">Nome da Planta:</label>
                            <input type="text" id="plantName" name="plantName" required>
                        </div>
                        <div class="form-field-group">
                            <p class="field-instruction">Escolha uma das opções de data:</p>
                            <div class="form-field">
                                <label for="plantDate">Data de Plantio (já plantada):</label>
                                <input type="date" id="plantDate" name="plantDate" max="${new Date().toISOString().split('T')[0]}">
                                <small class="field-hint">Para plantas já plantadas (até hoje)</small>
                            </div>
                            <div class="or-divider">
                                <span>OU</span>
                            </div>
                            <div class="form-field">
                                <label for="futureDate">Data a Plantar (futura):</label>
                                <input type="date" id="futureDate" name="futureDate" min="${new Date().toISOString().split('T')[0]}">
                                <small class="field-hint">Para plantas que serão plantadas (a partir de hoje)</small>
                            </div>
                        </div>
                        <div class="form-field">
                            <label for="plantLocation">Localização:</label>
                            <input type="text" id="plantLocation" name="plantLocation" placeholder="Ex: Escritório, Sala, Varanda..." required>
                        </div>
                        <div class="form-field">
                            <label for="plantNotes">Notas (opcional):</label>
                            <textarea id="plantNotes" name="plantNotes" rows="3" placeholder="Adicione observações sobre a planta..."></textarea>
                        </div>
                        <div class="form-buttons">
                            <button type="submit" class="btn btn-confirm">Confirmar</button>
                            <button type="button" class="btn btn-cancel">Cancelar</button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', formHTML);
        
        // Adicionar validação cruzada dos campos de data
        const plantDateInput = document.getElementById('plantDate');
        const futureDateInput = document.getElementById('futureDate');
        
        // Quando um campo é preenchido, o outro fica desabilitado
        plantDateInput.addEventListener('input', () => {
            if (plantDateInput.value) {
                futureDateInput.value = '';
                futureDateInput.disabled = true;
                futureDateInput.parentElement.style.opacity = '0.5';
            } else {
                futureDateInput.disabled = false;
                futureDateInput.parentElement.style.opacity = '1';
            }
        });
        
        futureDateInput.addEventListener('input', () => {
            if (futureDateInput.value) {
                plantDateInput.value = '';
                plantDateInput.disabled = true;
                plantDateInput.parentElement.style.opacity = '0.5';
            } else {
                plantDateInput.disabled = false;
                plantDateInput.parentElement.style.opacity = '1';
            }
        });
        
        // Cancelar
        document.querySelector('.btn-cancel').addEventListener('click', () => {
            document.querySelector('.plant-form-overlay').remove();
        });
        
        // Submeter formulário
        document.getElementById('plantForm').addEventListener('submit', (e) => {
            e.preventDefault();
            
            const plantName = document.getElementById('plantName').value.trim();
            const plantDate = document.getElementById('plantDate').value;
            const futureDate = document.getElementById('futureDate').value;
            const plantLocation = document.getElementById('plantLocation').value.trim();
            const plantNotes = document.getElementById('plantNotes').value.trim();
            
            // Validação: pelo menos uma data deve ser preenchida
            if (!plantDate && !futureDate) {
                showWarningPopup('Por favor, selecione uma data (Data de Plantio ou Data a Plantar).');
                return;
            }
            
            // Determinar qual data usar e o status da planta
            let finalDate;
            let plantStatus;
            
            if (plantDate) {
                finalDate = plantDate;
                plantStatus = 'planted'; // Já plantada
            } else {
                finalDate = futureDate;
                plantStatus = 'scheduled'; // Agendada para plantar
            }
            
            // Criar objeto da planta
            const newPlant = {
                id: Date.now(),
                name: plantName,
                plantDate: finalDate,
                status: plantStatus,
                location: plantLocation,
                notes: plantNotes,
                image: uploadedImage,
                addedDate: new Date().toISOString()
            };
            
            console.log('Nova planta criada:', newPlant);
            
            // Salvar no localStorage
            let plants = JSON.parse(localStorage.getItem('myPlants') || '[]');
            console.log('Plantas existentes:', plants);
            
            plants.push(newPlant);
            localStorage.setItem('myPlants', JSON.stringify(plants));
            
            console.log('Plantas após salvar:', JSON.parse(localStorage.getItem('myPlants')));
            
            // Adicionar notificação
            if (typeof notificarNovaPlanta === 'function') {
                notificarNovaPlanta(plantName);
            }
            
            // Remover modal
            document.querySelector('.plant-form-overlay').remove();
            
            // Verificar se deve retornar para calendário
            const returnTo = sessionStorage.getItem('returnTo');
            
            if (returnTo) {
                // Salvar a planta recém-criada como selecionada
                sessionStorage.setItem('selectedPlant', newPlant.id);
                
                // Limpar o returnTo
                sessionStorage.removeItem('returnTo');
                
                // Mostrar confirmação e redirecionar para calendário
                showSuccessPopup('Planta adicionada com sucesso! Redirecionando para o calendário...', () => {
                    window.location.href = returnTo;
                });
            } else {
                // Comportamento padrão: ir para minhasplantas.html
                showSuccessPopup('Planta adicionada com sucesso!', () => {
                    window.location.href = 'minhasplantas.html';
                });
            }
        });
    });
}

if (btnNo) {
    btnNo.addEventListener('click', () => {
        window.location.href = 'inicio.html';
    });
}

