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
    
    const formattedDate = new Date(plant.plantDate).toLocaleDateString('pt-PT');
    
    card.innerHTML = `
        <img src="${plant.image}" alt="${plant.name}" class="plant-image">
        <div class="plant-info">
            <h3 class="plant-name">${plant.name}</h3>
            <p class="plant-date">Plantada em: ${formattedDate}</p>
            <div class="plant-actions">
                <button class="btn-edit" onclick="editPlant(${plant.id})">Editar</button>
                <button class="btn-delete" onclick="deletePlant(${plant.id})">Remover</button>
            </div>
        </div>
    `;
    
    return card;
}

// Editar planta
function editPlant(id) {
    // Implementar lógica de edição
    console.log('Editar planta:', id);
    alert('Funcionalidade de edição em desenvolvimento');
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