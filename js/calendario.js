document.addEventListener('DOMContentLoaded', () => {
    // Garantir estrutura mínima (se calendário.html estiver vazio)
    ensureBaseLayout();

    let currentDate = new Date();
    let selectedPlantId = sessionStorage.getItem('selectedPlant');
    const plants = JSON.parse(localStorage.getItem('myPlants') || '[]');

    // Verificar se há parâmetros na URL para abrir modal de recorrência
    const urlParams = new URLSearchParams(window.location.search);
    const recurrenceDays = urlParams.get('recurrence');
    const plantIdFromUrl = urlParams.get('plantId');

    // Inserir conteúdo dinâmico dentro de .main-container
    const mainContainer = document.querySelector('.main-container');
    const existingContent = document.querySelector('main.content');
    if (existingContent) existingContent.remove();

    const mainContent = document.createElement('main');
    mainContent.className = 'content';
    mainContainer.appendChild(mainContent);

    // Seletor de plantas
    const plantSelector = document.createElement('div');
    plantSelector.className = 'plant-selector';
    plantSelector.innerHTML = `
        <label for="plantSelect">Selecionar Planta:</label>
        <select id="plantSelect">
            <option value="">-- Escolha uma planta --</option>
            ${plants.map(p => `<option value="${p.id}" ${p.id == selectedPlantId ? 'selected' : ''}>${p.name}</option>`).join('')}
        </select>
    `;
    mainContent.appendChild(plantSelector);

    // Botões extra
    const calendarControls = document.createElement('div');
    calendarControls.className = 'calendar-controls';
    calendarControls.innerHTML = `
        <button id="recurrenceBtn" class="btn btn-secondary">↻ Agendar recorrente</button>
    `;
    mainContent.appendChild(calendarControls);

    // Container calendário + painel info
    const calendarContainer = document.createElement('div');
    calendarContainer.className = 'calendar-container';
    mainContent.appendChild(calendarContainer);

    const infoPanel = document.createElement('div');
    infoPanel.className = 'info-panel';
    mainContent.appendChild(infoPanel);

    // Eventos
    document.getElementById('plantSelect').addEventListener('change', (e) => {
        selectedPlantId = e.target.value;
        sessionStorage.setItem('selectedPlant', selectedPlantId);
        renderCalendar();
        updateInfoPanel();
    });

    document.getElementById('recurrenceBtn').addEventListener('click', () => {
        if (!selectedPlantId) {
            alert('Selecione uma planta primeiro.');
            return;
        }
        openRecurrenceModal();
    });

    // Inicial
    renderCalendar();
    updateInfoPanel();

    // Abrir modal de recorrência automaticamente se viemos da página de detalhes
    if (recurrenceDays && plantIdFromUrl) {
        setTimeout(() => {
            openRecurrenceModal(parseInt(recurrenceDays));
        }, 500); // Pequeno delay para garantir que tudo está carregado
    }

    function renderCalendar() {
        if (!selectedPlantId) {
            calendarContainer.innerHTML = '<p class="warning">Por favor, selecione uma planta para ver o calendário.</p>';
            return;
        }

        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const prevLastDay = new Date(year, month, 0);
        const firstDayIndex = firstDay.getDay();
        const lastDayDate = lastDay.getDate();
        const prevLastDayDate = prevLastDay.getDate();
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        calendarContainer.innerHTML = '';

        // Header
        const header = document.createElement('div');
        header.className = 'calendar-header';
        header.innerHTML = `
            <button id="prevMonth" class="nav-btn">◀</button>
            <h2 class="month-year">${formatMonthName(month)} ${year}</h2>
            <button id="nextMonth" class="nav-btn">▶</button>
        `;
        calendarContainer.appendChild(header);

        // Semana
        const weekdays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
        const weekdaysRow = document.createElement('div');
        weekdaysRow.className = 'weekdays';
        weekdays.forEach(d => {
            const el = document.createElement('div');
            el.className = 'weekday';
            el.textContent = d;
            weekdaysRow.appendChild(el);
        });
        calendarContainer.appendChild(weekdaysRow);

        // Grid
        const daysGrid = document.createElement('div');
        daysGrid.className = 'days-grid';

        // Dias anteriores
        for (let x = firstDayIndex - 1; x >= 0; x--) {
            daysGrid.appendChild(createDayElement(prevLastDayDate - x, 'prev-month', null, true));
        }

        // Dias do mês
        for (let day = 1; day <= lastDayDate; day++) {
            const date = new Date(year, month, day);
            date.setHours(0, 0, 0, 0);
            const isPast = date < today;
            const isToday = date.getTime() === today.getTime();
            const dateStr = toDateString(date);
            daysGrid.appendChild(createDayElement(day, isToday ? 'today' : '', dateStr, isPast));
        }

        // Completar grade
        const totalCells = daysGrid.children.length;
        const remaining = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7);
        for (let i = 1; i <= remaining; i++) {
            daysGrid.appendChild(createDayElement(i, 'next-month', null, true));
        }

        calendarContainer.appendChild(daysGrid);

        // Navegação
        header.querySelector('#prevMonth').addEventListener('click', () => {
            currentDate.setMonth(currentDate.getMonth() - 1);
            renderCalendar();
        });
        header.querySelector('#nextMonth').addEventListener('click', () => {
            currentDate.setMonth(currentDate.getMonth() + 1);
            renderCalendar();
        });
    }

    function createDayElement(day, className, dateStr, isDisabled) {
        const dayEl = document.createElement('div');
        dayEl.className = `day ${className}`;
        const num = document.createElement('span');
        num.className = 'day-number';
        num.textContent = day;
        dayEl.appendChild(num);

        if (!isDisabled && dateStr) {
            const wateringData = getWateringData(selectedPlantId);
            let wateringInfo = wateringData.find(w => w.date === dateStr);

            if (!wateringInfo) {
                const rec = findRecurrenceOccurrence(selectedPlantId, dateStr);
                if (rec) {
                    wateringInfo = {
                        date: dateStr,
                        time: rec.time,
                        source: 'recurrence',
                        recurrenceId: rec.id,
                        intervalDays: rec.intervalDays
                    };
                }
            }

            if (wateringInfo) {
                if (wateringInfo.completed) {
                    dayEl.classList.add('completed');
                    const chk = document.createElement('span');
                    chk.className = 'check-badge';
                    chk.textContent = '✓';
                    dayEl.appendChild(chk);
                    dayEl.addEventListener('click', () => openDayModal(dateStr, wateringInfo));
                } else {
                    dayEl.classList.add('marked');
                    const t = document.createElement('span');
                    t.className = 'time-badge';
                    t.textContent = wateringInfo.time;
                    dayEl.appendChild(t);
                    if (wateringInfo.source === 'recurrence') {
                        const recIcon = document.createElement('span');
                        recIcon.className = 'recurrence-icon';
                        recIcon.textContent = '↻';
                        dayEl.appendChild(recIcon);
                    }
                    dayEl.addEventListener('click', () => openDayModal(dateStr, wateringInfo));
                }
            } else {
                // Dia vazio: abre modal rápida de agendamento
                dayEl.addEventListener('click', () => openQuickAddModal(dateStr));
            }
        } else {
            dayEl.classList.add('disabled');
        }
        return dayEl;
    }

    // Modal rápida para marcar uma rega num dia vazio
    function openQuickAddModal(dateStr) {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        const date = new Date(dateStr + 'T00:00:00');
        modal.innerHTML = `
            <div class="modal-content small">
                <div class="modal-header">
                    <h3>Marcar rega (${formatDateShort(date)})</h3>
                    <button class="close-btn" aria-label="Fechar">&times;</button>
                </div>
                <div class="modal-body">
                    <label for="quickTime">Hora:</label>
                    <input type="time" id="quickTime" value="${new Date().toTimeString().slice(0,5)}">
                    <div style="display:flex;gap:.5rem;margin-top:.75rem;">
                        <button class="btn btn-primary" id="quickConfirm">Confirmar</button>
                        <button class="btn" id="quickCancel">Cancelar</button>
                    </div>
                </div>
            </div>`;
        document.body.appendChild(modal);

        const removeModal = () => modal.remove();
        modal.querySelector('.close-btn').addEventListener('click', removeModal);
        modal.addEventListener('click', e => { if (e.target === modal) removeModal(); });
        modal.querySelector('#quickCancel').addEventListener('click', removeModal);
        modal.querySelector('#quickConfirm').addEventListener('click', () => {
            const time = document.getElementById('quickTime').value;
            if (!time) { alert('Selecione uma hora.'); return; }
            addWatering(selectedPlantId, dateStr, time);
            removeModal();
            renderCalendar();
            updateInfoPanel();
        });
    }

    function openDayModal(dateStr, existingWatering) {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        const date = new Date(dateStr + 'T00:00:00');
        const formattedDate = formatDateLong(date);
        const plant = plants.find(p => p.id == selectedPlantId);

        const contentSingle = existingWatering ? `
            <p><strong>Hora da rega:</strong> ${existingWatering.time}</p>
            <div style="display:flex;gap:.5rem;flex-wrap:wrap;">
                <button class="btn btn-primary" id="editWatering">Editar hora</button>
                <button class="btn btn-danger" id="removeWatering">${existingWatering.completed ? 'Remover Registro' : 'Desmarcar Rega'}</button>
            </div>
            <div id="editForm" style="display:none;margin-top:.5rem;">
                <label for="editTime">Nova hora:</label>
                <input type="time" id="editTime" value="${existingWatering.time}">
                <button class="btn btn-primary" id="saveEdit">Guardar</button>
                <button class="btn" id="cancelEdit">Cancelar</button>
            </div>
        ` : `
            <p>Este modal completo agora só aparece para dias já marcados.</p>
        `;

        const contentRecurrence = existingWatering && existingWatering.source === 'recurrence' ? `
            <p><strong>Tipo:</strong> Rega automática a cada ${existingWatering.intervalDays} dia(s)</p>
            <p><strong>Hora:</strong> ${existingWatering.time}</p>
            <div style="display:flex;gap:.5rem;flex-wrap:wrap;">
                <button class="btn btn-danger" id="stopRecurrence">Interromper recorrência</button>
                <button class="btn btn-primary" id="skipRecurrenceOnce">Ignorar este dia</button>
            </div>
        ` : contentSingle;

        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>${formattedDate}</h3>
                    <button class="close-btn">&times;</button>
                </div>
                <div class="modal-body">
                    <p><strong>Planta:</strong> ${plant ? plant.name : 'Desconhecida'}</p>
                    ${contentRecurrence}
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        modal.querySelector('.close-btn').addEventListener('click', () => modal.remove());
        modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });

        if (existingWatering && !existingWatering.source) {
            const rm = document.getElementById('removeWatering');
            if (rm) rm.addEventListener('click', () => {
                removeWatering(selectedPlantId, dateStr);
                modal.remove();
                renderCalendar();
                updateInfoPanel();
            });
            const editBtn = document.getElementById('editWatering');
            const editForm = document.getElementById('editForm');
            const cancelEdit = document.getElementById('cancelEdit');
            const saveEdit = document.getElementById('saveEdit');
            if (editBtn) editBtn.addEventListener('click', () => { if (editForm) editForm.style.display = 'block'; });
            if (cancelEdit) cancelEdit.addEventListener('click', () => { if (editForm) editForm.style.display = 'none'; });
            if (saveEdit) saveEdit.addEventListener('click', () => {
                const newTime = document.getElementById('editTime').value;
                if (!newTime) { alert('Selecione uma hora.'); return; }
                updateWateringTime(selectedPlantId, dateStr, newTime);
                modal.remove();
                renderCalendar();
                updateInfoPanel();
            });
        }

        if (existingWatering && existingWatering.source === 'recurrence') {
            const stopBtn = document.getElementById('stopRecurrence');
            const skipBtn = document.getElementById('skipRecurrenceOnce');
            if (stopBtn) stopBtn.addEventListener('click', () => {
                stopRecurrence(selectedPlantId, existingWatering.recurrenceId);
                modal.remove();
                renderCalendar();
                updateInfoPanel();
            });
            if (skipBtn) skipBtn.addEventListener('click', () => {
                addRecurrenceException(selectedPlantId, existingWatering.recurrenceId, dateStr);
                modal.remove();
                renderCalendar();
                updateInfoPanel();
            });
        }
    }

    function updateInfoPanel() {
        if (!selectedPlantId) { infoPanel.innerHTML = ''; return; }
        const plant = plants.find(p => p.id == selectedPlantId);
        const wateringData = getWateringData(selectedPlantId);
        const upcoming = wateringData
            .filter(w => !w.completed && new Date(w.date + 'T00:00:00') >= new Date(new Date().setHours(0,0,0,0)))
            .sort((a,b)=> new Date(a.date)-new Date(b.date))
            .slice(0,5);

        const recurrences = getRecurrences(selectedPlantId).filter(r => r.active);

        infoPanel.innerHTML = `
            <h3>Próximas Regas - ${plant ? plant.name : 'Desconhecida'}</h3>
            ${upcoming.length ? `
                <ul class="watering-list">
                    ${upcoming.map(w => `
                        <li>
                            <span class="date">${formatDateShort(new Date(w.date + 'T00:00:00'))}</span>
                            <span class="time">${w.time}</span>
                        </li>
                    `).join('')}
                </ul>` : '<p>Nenhuma rega agendada.</p>'}
            ${recurrences.length ? `
                <div class="recurrence-panel">
                    <h4>Recorrências ativas</h4>
                    <ul class="recurrence-list">
                        ${recurrences.map(r => `
                            <li>
                                <span>↻ A cada ${r.intervalDays} dia(s) às ${r.time} (desde ${formatDateShort(new Date(r.startDate + 'T00:00:00'))})</span>
                                <button class="btn btn-danger btn-small" data-stop="${r.id}">Interromper</button>
                            </li>
                        `).join('')}
                    </ul>
                </div>` : ''}
        `;
        infoPanel.querySelectorAll('[data-stop]').forEach(btn => {
            btn.addEventListener('click', e => {
                stopRecurrence(selectedPlantId, e.currentTarget.getAttribute('data-stop'));
                renderCalendar(); updateInfoPanel();
            });
        });
    }

    // Recorrência helpers
    function getRecurrences(plantId) {
        return JSON.parse(localStorage.getItem(`watering_recurrences_${plantId}`) || '[]');
    }
    function saveRecurrences(plantId, list) {
        localStorage.setItem(`watering_recurrences_${plantId}`, JSON.stringify(list));
    }
    function addRecurrence(plantId, startDate, intervalDays, time) {
        const list = getRecurrences(plantId);
        list.push({ id:String(Date.now()), startDate, intervalDays:Number(intervalDays), time, active:true, excludedDates:[] });
        saveRecurrences(plantId, list);
    }
    function stopRecurrence(plantId, recurrenceId) {
        const list = getRecurrences(plantId);
        const r = list.find(x=>x.id===recurrenceId);
        if (r) { r.active = false; saveRecurrences(plantId, list); }
    }
    function addRecurrenceException(plantId, recurrenceId, dateStr) {
        const list = getRecurrences(plantId);
        const r = list.find(x=>x.id===recurrenceId);
        if (r && !r.excludedDates.includes(dateStr)) { r.excludedDates.push(dateStr); saveRecurrences(plantId, list); }
    }
    function findRecurrenceOccurrence(plantId, dateStr) {
        return getRecurrences(plantId).filter(r=>r.active).find(r => isOccurrence(r, dateStr)) || null;
    }
    function isOccurrence(recurrence, dateStr) {
        if (dateStr < recurrence.startDate) return false;
        if (recurrence.excludedDates.includes(dateStr)) return false;
        const d1 = new Date(recurrence.startDate + 'T00:00:00');
        const d2 = new Date(dateStr + 'T00:00:00');
        const diffDays = Math.round((d2 - d1)/(1000*60*60*24));
        return diffDays % recurrence.intervalDays === 0;
    }

    // Modal recorrência - modificado para aceitar parâmetro de dias
    function openRecurrenceModal(defaultDays = 2) {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        const todayStr = toDateString(new Date());
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Agendar recorrente</h3>
                    <button class="close-btn">&times;</button>
                </div>
                <div class="modal-body">
                    <label>Data de início:</label>
                    <input type="date" id="recStart" value="${todayStr}">
                    <label>A cada (dias):</label>
                    <input type="number" id="recEvery" min="1" value="${defaultDays}">
                    <label>Hora:</label>
                    <input type="time" id="recTime" value="08:00">
                    <button class="btn btn-primary" id="recConfirm">Ativar recorrência</button>
                </div>
            </div>`;
        document.body.appendChild(modal);
        modal.querySelector('.close-btn').addEventListener('click', ()=>modal.remove());
        modal.addEventListener('click', e => {
            if(e.target===modal) modal.remove();
        });
        modal.querySelector('#recConfirm').addEventListener('click', () => {
            const start = document.getElementById('recStart').value;
            const every = document.getElementById('recEvery').value;
            const time = document.getElementById('recTime').value;
            if(!start||!every||!time){
                alert('Preencha todos os campos.');
                return;
            }
            addRecurrence(selectedPlantId, start, every, time);
            modal.remove();
            renderCalendar();
            updateInfoPanel();
            alert(`Rega recorrente ativada: a cada ${every} dia(s) às ${time}h a partir de ${new Date(start+'T00:00:00').toLocaleDateString('pt-PT')}`);
        });
    }

    // Helpers simples
    function getWateringData(plantId) {
        return JSON.parse(localStorage.getItem(`watering_${plantId}`) || '[]');
    }
    function addWatering(plantId, date, time) {
        const data = getWateringData(plantId);
        if (!data.some(w=>w.date===date)) {
            data.push({ date, time, completed:false });
            localStorage.setItem(`watering_${plantId}`, JSON.stringify(data));
        }
    }
    function removeWatering(plantId, date) {
        const data = getWateringData(plantId).filter(w=>w.date!==date);
        localStorage.setItem(`watering_${plantId}`, JSON.stringify(data));
    }
    // NOVO: atualizar hora de um registo existente
    function updateWateringTime(plantId, date, newTime) {
        const data = getWateringData(plantId);
        const idx = data.findIndex(w => w.date === date);
        if (idx !== -1) {
            data[idx].time = newTime;
            localStorage.setItem(`watering_${plantId}`, JSON.stringify(data));
        }
    }
    function toDateString(d){ return d.toISOString().split('T')[0]; }
    function formatMonthName(m){
        return ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'][m];
    }
    function formatDateLong(d){
        return d.toLocaleDateString('pt-PT',{weekday:'long',year:'numeric',month:'long',day:'numeric'});
    }
    function formatDateShort(d){
        return d.toLocaleDateString('pt-PT',{day:'2-digit',month:'2-digit',year:'numeric'});
    }

    // Garantir menu "Regar" ativo (se estrutura criada dinamicamente)
    const regarLink = document.querySelector('.menu a[href="regar.html"], .menu-item[href="regar.html"]');
    if (regarLink) regarLink.classList.add('active');

    function ensureBaseLayout() {
        if (!document.querySelector('.main-container')) {
            const wrapper = document.createElement('div');
            wrapper.className = 'main-container';
            wrapper.innerHTML = `
                <aside class="sidebar">
                    <nav class="menu">
                        <a href="inicio.html" class="menu-item"><div class="menu-icon-placeholder">🏠</div><span>Início</span></a>
                        <a href="add.html" class="menu-item"><div class="menu-icon-placeholder">➕</div><span>Adicionar Planta</span></a>
                        <a href="notificacoes.html" class="menu-item"><div class="menu-icon-placeholder">🔔</div><span>Notificações</span></a>
                        <a href="regar.html" class="menu-item"><div class="menu-icon-placeholder">💧</div><span>Regar</span></a>
                        <a href="chat.html" class="menu-item"><div class="menu-icon-placeholder">💬</div><span>Chat</span></a>
                        <a href="minhasplantas.html" class="menu-item"><div class="menu-icon-placeholder">🌱</div><span>Minhas Plantas</span></a>
                    </nav>
                </aside>
            `;
            document.body.appendChild(wrapper);
            if (!document.querySelector('.header')) {
                const header = document.createElement('header');
                header.className = 'header';
                header.innerHTML = `
                    <div class="header-center"><h1 class="header-title">SMART PLANTS</h1></div>
                    <div class="header-right">
                        <a href="login.html" class="user-icon">
                            <div class="user-placeholder">👤</div>
                        </a>
                    </div>
                `;
                document.body.prepend(header);
            }
        }
    }
});
