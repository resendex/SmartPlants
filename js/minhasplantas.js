// Carregar plantas do localStorage
function loadPlants() {
    const plants = JSON.parse(localStorage.getItem('myPlants') || '[]');
    const container = document.getElementById('plantsContainer');
    const emptyState = document.getElementById('emptyState');
    
    if (!container || !emptyState) return;
    
    if (plants.length === 0) {
        emptyState.style.display = 'block';
        container.style.display = 'none';
        return;
    }
    
    emptyState.style.display = 'none';
    container.style.display = 'grid';
    container.innerHTML = '';
    
    plants.forEach(plant => {
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
        <img src="${plant.image}" alt="${plant.name}" class="plant-image">
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

// Editar planta - abre modal com formulário para editar nome, data, notas, localização e imagem
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
                        <input type="date" id="editPlantDate" name="editPlantDate" value="${plant.plantDate ? plant.plantDate : ''}">
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
                        <button type="submit" class="btn btn-confirm">Salvar</button>
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

    let newImageData = plant.image; // por padrão mantém imagem existente

    // quando o utilizador escolhe nova imagem
    inputImage.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (!file.type.startsWith('image/')) {
            alert('Por favor selecione uma imagem válida.');
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
    document.querySelector('.btn-cancel').addEventListener('click', () => {
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
        alert('Informações da planta atualizadas.');
    });
}

// Utilitário: escapar html em strings para inserir em value/textarea de forma segura
function escapeHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

// Remover planta
function deletePlant(id) {
    if (confirm('Tem certeza que deseja remover esta planta?')) {
        let plants = JSON.parse(localStorage.getItem('myPlants') || '[]');
        plants = plants.filter(plant => plant.id !== id);
        localStorage.setItem('myPlants', JSON.stringify(plants));
        loadPlants();
    }
}

// Carregar plantas ao iniciar
document.addEventListener('DOMContentLoaded', loadPlants);