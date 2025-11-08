document.addEventListener('DOMContentLoaded', () => {
    const plantsContainer = document.getElementById('plantsContainer');
    const saveButton = document.querySelector('.ButtonGuardar');
    const plants = JSON.parse(localStorage.getItem('myPlants') || '[]');

    // Renderizar plantas dinamicamente
    renderPlants();

    function renderPlants() {
        if (plants.length === 0) {
            plantsContainer.innerHTML = `
                <div class="no-plants">
                    <p>Você ainda não tem plantas registradas.</p>
                    <a href="add.html" class="btn-add">Adicionar Planta</a>
                </div>
            `;
            saveButton.style.display = 'none';
            return;
        }

        let html = '<h3>Qual(ais) da(s) planta(s) regou?</h3>';
        
        plants.forEach(plant => {
            const nextWatering = getNextWatering(plant.id);
            const wateringInfo = nextWatering ? 
                `<span class="next-watering">Próxima rega: ${formatDate(nextWatering.date)} às ${nextWatering.time}</span>` : 
                '<span class="no-watering">Nenhuma rega agendada</span>';
            
            html += `
                <div class="opcao">
                    <label>
                        <input type="checkbox" name="plantas" value="${plant.id}" data-plant-name="${plant.name}">
                        <span class="plant-name">${plant.name}</span>
                        ${wateringInfo}
                    </label>
                </div>
            `;
        });

        plantsContainer.innerHTML = html;
    }

    // Botão Guardar
    saveButton.addEventListener('click', () => {
        const checkedBoxes = document.querySelectorAll('input[name="plantas"]:checked');
        
        if (checkedBoxes.length === 0) {
            showModal('Aviso', 'Por favor, selecione pelo menos uma planta que foi regada.', 'warning');
            return;
        }

        const wateredPlants = [];
        checkedBoxes.forEach(checkbox => {
            const plantId = checkbox.value;
            const plantName = checkbox.dataset.plantName;
            const nextWatering = getNextWatering(plantId);
            
            wateredPlants.push({
                id: plantId,
                name: plantName,
                completedWatering: nextWatering
            });
        });

        showConfirmationModal(wateredPlants);
    });

    function showConfirmationModal(wateredPlants) {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';

        let plantsList = '';
        let hasSchedules = false;

        wateredPlants.forEach(plant => {
            if (plant.completedWatering) {
                hasSchedules = true;
                plantsList += `
                    <li class="plant-schedule-item">
                        <strong>${plant.name}</strong>
                        <span class="completed-schedule">
                            Rega realizada: ${formatDate(plant.completedWatering.date)} às ${plant.completedWatering.time}
                        </span>
                    </li>
                `;
            } else {
                plantsList += `
                    <li class="plant-schedule-item no-schedule">
                        <strong>${plant.name}</strong>
                        <span class="no-schedule-text">Sem agendamento registrado</span>
                    </li>
                `;
            }
        });

        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header ${hasSchedules ? 'success' : 'info'}">
                    <h3>${hasSchedules ? '✅ Confirmar Rega Realizada' : 'ℹ️ Confirmar Rega'}</h3>
                    <button class="close-btn">&times;</button>
                </div>
                <div class="modal-body">
                    <p class="modal-message">
                        ${hasSchedules ? 
                            'Ao confirmar, as seguintes regas serão marcadas como realizadas:' : 
                            'As plantas selecionadas serão registradas como regadas:'}
                    </p>
                    <ul class="plants-list">
                        ${plantsList}
                    </ul>
                    <p class="modal-question">Deseja continuar?</p>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-cancel" id="cancelBtn">Cancelar</button>
                    <button class="btn btn-confirm" id="confirmBtn">Confirmar Rega</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Event listeners
        const closeBtn = modal.querySelector('.close-btn');
        const cancelBtn = modal.querySelector('#cancelBtn');
        const confirmBtn = modal.querySelector('#confirmBtn');

        closeBtn.addEventListener('click', () => document.body.removeChild(modal));
        cancelBtn.addEventListener('click', () => document.body.removeChild(modal));
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) document.body.removeChild(modal);
        });

        confirmBtn.addEventListener('click', () => {
            processWatering(wateredPlants);
            document.body.removeChild(modal);
        });
    }

    function processWatering(wateredPlants) {
        let completedCount = 0;

        wateredPlants.forEach(plant => {
            if (plant.completedWatering) {
                // Marcar como rega completada em vez de remover
                markWateringAsCompleted(plant.id, plant.completedWatering.date, plant.completedWatering.time);
                completedCount++;
            }
            
            // Registrar histórico de rega
            registerWateringHistory(plant.id);
        });

        // Mensagem de sucesso
        const message = completedCount > 0 ? 
            `Rega confirmada! ${completedCount} rega(s) foi/foram realizada(s) com sucesso.` :
            'Rega registrada com sucesso!';

        showModal('Sucesso', message, 'success');

        // Limpar seleções e re-renderizar
        setTimeout(() => {
            renderPlants();
        }, 1500);
    }

    function getNextWatering(plantId) {
        const key = `watering_${plantId}`;
        const waterings = JSON.parse(localStorage.getItem(key) || '[]');
        
        if (waterings.length === 0) return null;

        // Ordenar por data (mais próxima primeiro)
        const sorted = waterings
            .filter(w => !w.completed) // Filtrar apenas não completadas
            .map(w => ({
                date: w.date,
                time: w.time,
                dateObj: new Date(w.date + 'T' + w.time)
            }))
            .sort((a, b) => a.dateObj - b.dateObj);

        // Retornar a mais próxima no futuro ou presente
        const now = new Date();
        const future = sorted.find(w => w.dateObj >= now);
        
        return future || sorted[0]; // Se não houver futuras, retorna a mais recente
    }

    function markWateringAsCompleted(plantId, date, time) {
        const key = `watering_${plantId}`;
        const waterings = JSON.parse(localStorage.getItem(key) || '[]');
        
        // Marcar a rega específica como completada
        const updated = waterings.map(w => {
            if (w.date === date && w.time === time) {
                return { ...w, completed: true, completedAt: new Date().toISOString() };
            }
            return w;
        });
        
        localStorage.setItem(key, JSON.stringify(updated));
    }

    function registerWateringHistory(plantId) {
        const key = `watering_history_${plantId}`;
        const history = JSON.parse(localStorage.getItem(key) || '[]');
        
        history.push({
            date: new Date().toISOString().split('T')[0],
            time: new Date().toTimeString().slice(0, 5)
        });

        localStorage.setItem(key, JSON.stringify(history));
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
                    <button class="btn btn-primary" id="okBtn">OK</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        modal.querySelector('#okBtn').addEventListener('click', () => {
            document.body.removeChild(modal);
        });
    }

    function formatDate(dateStr) {
        const date = new Date(dateStr + 'T00:00:00');
        return date.toLocaleDateString('pt-PT', { 
            day: '2-digit', 
            month: '2-digit',
            year: 'numeric'
        });
    }
});