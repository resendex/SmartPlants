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
        alert('Por favor, selecione um arquivo de imagem válido.');
    }
}

// Event listeners para botões (apenas se existirem)
const btnYes = document.querySelector('.btn-yes');
const btnNo = document.querySelector('.btn-no');

if (btnYes) {
    btnYes.addEventListener('click', () => {
        if (!uploadedImage) {
            alert('Por favor, adicione uma foto da planta primeiro.');
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
                        <div class="form-field">
                            <label for="plantDate">Data de Plantio:</label>
                            <input type="date" id="plantDate" name="plantDate" required>
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
        
        // Cancelar
        document.querySelector('.btn-cancel').addEventListener('click', () => {
            document.querySelector('.plant-form-overlay').remove();
        });
        
        // Submeter formulário
        document.getElementById('plantForm').addEventListener('submit', (e) => {
            e.preventDefault();
            
            const plantName = document.getElementById('plantName').value.trim();
            const plantDate = document.getElementById('plantDate').value;
            const plantLocation = document.getElementById('plantLocation').value.trim();
            const plantNotes = document.getElementById('plantNotes').value.trim();
            
            // Criar objeto da planta
            const newPlant = {
                id: Date.now(),
                name: plantName,
                plantDate: plantDate,
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
            
            // Redirecionar para minhas plantas
            alert('Planta adicionada com sucesso!');
            window.location.href = 'minhasplantas.html';
        });
    });
}

if (btnNo) {
    btnNo.addEventListener('click', () => {
        window.location.href = 'inicio.html';
    });
}

