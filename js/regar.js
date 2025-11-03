document.addEventListener('DOMContentLoaded', function () {
    // Botões de ação: Calendário, Verificação, Gestão, Adicionar
    const calendarButton = document.getElementById('calendarButton');
    const verifyButton = document.getElementById('verifyButton');
    const managementButton = document.getElementById('managementButton');
    const addButton = document.getElementById('addButton'); // Novo botão "Adicionar"

    // Função para verificar se uma planta foi selecionada
    function openPlantSelectionPopup(redirectUrl) {
        const plants = JSON.parse(localStorage.getItem('myPlants') || '[]');

        // Cria a janela pop-up de seleção de planta
        const popup = document.createElement('div');
        popup.className = 'popup-overlay';
        
        if (plants.length === 0) {
            // Caso não haja plantas, exibe uma mensagem de adição
            popup.innerHTML = `
                <div class="popup-container">
                    <h2>Você ainda não tem plantas registradas!</h2>
                    <p>Deseja adicionar uma planta?</p>
                    <button id="goToAddPage" class="btn">Adicionar Planta</button>
                    <button id="cancelSelection" class="btn">Cancelar</button>
                </div>
            `;
            document.body.appendChild(popup);

            // Redireciona para a página de adição de planta
            document.getElementById('goToAddPage').addEventListener('click', function () {
                window.location.href = 'add.html'; // Redireciona para a página add.html
            });

            // Fechar a janela pop-up se o usuário clicar em "Cancelar"
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
                    <button id="goToAddPage" class="btn">Adicionar Planta</button> <!-- Opção de adicionar planta -->
                    <button id="cancelSelection" class="btn">Cancelar</button>
                </div>
            `;
        }

        document.body.appendChild(popup);

        // Verifica se os elementos estão no DOM antes de adicionar os eventos
        const confirmButton = document.getElementById('confirmSelection');
        const cancelButton = document.getElementById('cancelSelection');
        const addButton = document.getElementById('goToAddPage'); // O botão de adicionar planta

        if (confirmButton && cancelButton && addButton) {
            // Manipular a confirmação da seleção
            confirmButton.addEventListener('click', function () {
                const selectedPlantId = document.querySelector('input[name="selectedPlant"]:checked')?.value;
                if (selectedPlantId) {
                    sessionStorage.setItem('selectedPlant', selectedPlantId);
                    window.location.href = redirectUrl; // Redireciona para a página desejada após confirmação
                } else {
                    alert('Por favor, selecione uma planta.');
                }
            });

            // Cancelar a seleção
            cancelButton.addEventListener('click', function () {
                document.body.removeChild(popup);
            });

            // Redirecionar para a página de adicionar planta
            addButton.addEventListener('click', function () {
                window.location.href = 'add.html'; // Redireciona para a página add.html
            });
        } else {
            console.error('Botões de confirmação ou cancelamento não encontrados.');
        }
    }

    // Função para determinar o redirecionamento baseado no botão clicado
    function getRedirectUrl(buttonId) {
        switch (buttonId) {
            case 'calendarButton':
                return 'Calendario.html';
            case 'verifyButton':
                return 'Verificacao_rega.html';
            case 'managementButton':
                return 'Gestao_sistema.html';
            default:
                return 'index.html'; // Página padrão
        }
    }

    // Adicionar ouvintes de eventos para cada botão
    calendarButton.addEventListener('click', function () {
        const redirectUrl = getRedirectUrl('calendarButton');
        openPlantSelectionPopup(redirectUrl);
    });

    verifyButton.addEventListener('click', function () {
        const redirectUrl = getRedirectUrl('verifyButton');
        openPlantSelectionPopup(redirectUrl);
    });

    managementButton.addEventListener('click', function () {
        const redirectUrl = getRedirectUrl('managementButton');
        openPlantSelectionPopup(redirectUrl);
    });

    // Botão Adicionar agora redireciona diretamente para a página add.html
    addButton.addEventListener('click', function () {
        window.location.href = 'add.html'; // Redireciona diretamente para a página de adicionar planta
    });
});
