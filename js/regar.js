document.addEventListener('DOMContentLoaded', function () {
    // Botões de ação: Calendário, Verificação, Gestão, Adicionar
    const calendarButton = document.getElementById('calendarButton');
    const verifyButton = document.getElementById('verifyButton');
    const managementButton = document.getElementById('managementButton');
    const addButton = document.getElementById('addButton');

    // Função para verificar se uma planta foi selecionada
    function openPlantSelectionPopup(redirectUrl) {
        const plants = JSON.parse(localStorage.getItem('myPlants') || '[]');
        const popup = document.createElement('div');
        popup.className = 'popup-overlay';
        
        if (plants.length === 0) {
            popup.innerHTML = `
                <div class="popup-container">
                    <h2>Você ainda não tem plantas registradas!</h2>
                    <p>Deseja adicionar uma planta?</p>
                    <button id="goToAddPage" class="btn">Adicionar Planta</button>
                    <button id="cancelSelection" class="btn">Cancelar</button>
                </div>
            `;
            document.body.appendChild(popup);

            document.getElementById('goToAddPage').addEventListener('click', function () {
                // Salvar a URL de retorno no sessionStorage
                sessionStorage.setItem('returnTo', redirectUrl);
                window.location.href = 'add.html';
            });

            document.getElementById('cancelSelection').addEventListener('click', function () {
                document.body.removeChild(popup);
            });

            return;
        } else {
            // Se houver plantas registradas, exibe a lista de plantas para seleção
            popup.innerHTML = `
                <div class="popup-container">
                    <h2>Escolha uma Planta</h2>
                    <div id="plantSelectionContainer">
                        ${plants.map(plant => `
                            <div class="plant-item">
                                <input type="radio" name="selectedPlant" value="${plant.id}" id="plant-${plant.id}">
                                <label for="plant-${plant.id}">${plant.name}</label>
                            </div>
                        `).join('')}
                    </div>
                    <button id="confirmSelection" class="btn">Confirmar Seleção</button>
                    <button id="goToAddPage" class="btn">Adicionar Planta</button>
                    <button id="cancelSelection" class="btn">Cancelar</button>
                </div>
            `;
        }

        document.body.appendChild(popup);

        // Verifica se os elementos estão no DOM antes de adicionar os eventos
        const confirmButton = document.getElementById('confirmSelection');
        const cancelButton = document.getElementById('cancelSelection');
        const addPlantButton = document.getElementById('goToAddPage');

        if (confirmButton && cancelButton && addPlantButton) {
            // Manipular a confirmação da seleção
            confirmButton.addEventListener('click', function () {
                const selectedPlantId = document.querySelector('input[name="selectedPlant"]:checked')?.value;
                if (selectedPlantId) {
                    sessionStorage.setItem('selectedPlant', selectedPlantId);
                    window.location.href = redirectUrl;
                } else {
                    alert('Por favor, selecione uma planta.');
                }
            });

            // Cancelar a seleção
            cancelButton.addEventListener('click', function () {
                document.body.removeChild(popup);
            });

            // Redirecionar para a página de adicionar planta com retorno
            addPlantButton.addEventListener('click', function () {
                // Salvar a URL de retorno no sessionStorage
                sessionStorage.setItem('returnTo', redirectUrl);
                window.location.href = 'add.html';
            });
        } else {
            console.error('Botões de confirmação ou cancelamento não encontrados.');
        }
    }

    // Adicionar ouvintes de eventos para cada botão
    
    // Calendário: Abre pop-up para selecionar planta
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
});
