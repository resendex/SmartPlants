// Fórum Interativo - Smart Plants

// Função para filtrar posts por categoria
function filterPosts(category) {
    const posts = document.querySelectorAll('.forum-post');
    
    posts.forEach(post => {
        const postCategory = post.getAttribute('data-category');
        
        if (category === 'all' || postCategory === category || postCategory === 'all') {
            post.style.display = 'block';
            // Animação de entrada
            post.style.animation = 'fadeIn 0.5s ease';
        } else {
            post.style.display = 'none';
        }
    });
}

// Função para configurar botões de categoria
function setupCategoryButtons() {
    const categoryButtons = document.querySelectorAll('.category-btn');
    
    categoryButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Remove active de todos os botões
            categoryButtons.forEach(btn => btn.classList.remove('active'));
            
            // Adiciona active ao botão clicado
            button.classList.add('active');
            
            // Filtra os posts
            const category = button.getAttribute('data-category');
            filterPosts(category);
        });
    });
}

// Função para configurar botões de interação (like, comentar, guardar)
function setupInteractionButtons() {
    const interactionButtons = document.querySelectorAll('.interaction-btn');
    
    interactionButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            e.stopPropagation();

            const iconEl = button.querySelector('.interaction-icon');
            const icon = iconEl ? iconEl.textContent : '';

            // If this is the comment icon, open the comment box for this post
            if (icon === '💬') {
                const post = button.closest('.forum-post');
                if (post) openCommentBox(post, button);
                return;
            }

            // For other interaction types (like/guardar) toggle active state
            button.classList.toggle('active');

            // Incrementa/decrementa contador se existir
            const countElement = button.querySelector('.interaction-count');
            if (countElement) {
                let count = parseInt(countElement.textContent) || 0;

                if (button.classList.contains('active')) {
                    count++;
                    showNotification(`Ação realizada com sucesso! ${icon}`);
                } else {
                    count--;
                }

                countElement.textContent = count;
            }

            // Adiciona animação
            button.style.transform = 'scale(0.9)';
            setTimeout(() => {
                button.style.transform = 'scale(1)';
            }, 100);
        });
    });
}

// Abre uma caixa de comentário dentro do post e foca o textarea
function openCommentBox(post, triggerButton) {
    // Se já existir uma caixa de comentário neste post, foca o textarea
    let existing = post.querySelector('.comment-box');
    if (existing) {
        const ta = existing.querySelector('textarea');
        if (ta) ta.focus();
        return;
    }

    const footer = post.querySelector('.post-footer') || post;

    const commentBox = document.createElement('div');
    commentBox.className = 'comment-box';
    commentBox.style.cssText = 'margin-top:12px; display:flex; gap:8px; align-items:flex-start;';
    commentBox.innerHTML = `
        <textarea placeholder="Escreve um comentário..." rows="2" style="flex:1;padding:0.6em;border:1px solid #ddd;border-radius:0.4em;font-family:inherit;"></textarea>
        <div style="display:flex;flex-direction:column;gap:8px;">
            <button class="btn-comment-submit" style="background:linear-gradient(135deg,#28a745 0%,#20c997 100%);color:white;border:none;padding:0.5em 0.8em;border-radius:0.4em;cursor:pointer;">Comentar</button>
            <button class="btn-comment-cancel" style="background:#f0f0f0;border:none;padding:0.4em 0.6em;border-radius:0.4em;cursor:pointer;">Cancelar</button>
        </div>
    `;

    footer.appendChild(commentBox);

    const textarea = commentBox.querySelector('textarea');
    const submitBtn = commentBox.querySelector('.btn-comment-submit');
    const cancelBtn = commentBox.querySelector('.btn-comment-cancel');

    // Auto-focus
    setTimeout(() => textarea.focus(), 50);

    // Submit handler: add a simple comment element and increment count
    submitBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const text = textarea.value.trim();
        if (!text) {
            showNotification('Escreve algo antes de comentar.');
            return;
        }

        // Append simple comment under the post (after footer)
        const commentList = post.querySelector('.comment-list') || document.createElement('div');
        commentList.className = 'comment-list';
        commentList.style.cssText = 'margin-top:12px; padding-left:12px; border-left:2px solid rgba(0,0,0,0.04);';

        const commentItem = document.createElement('div');
        commentItem.className = 'comment-item';
        commentItem.style.cssText = 'margin-bottom:8px;';
        commentItem.innerHTML = `<strong>Tu:</strong> <span>${escapeHtml(text)}</span>`;

        commentList.appendChild(commentItem);

        // If commentList was just created, append it after footer
        if (!post.querySelector('.comment-list')) {
            footer.parentElement.appendChild(commentList);
        }

        // Update comment count on the interaction button if present
        const commentBtn = Array.from(post.querySelectorAll('.interaction-btn')).find(b => {
            const ic = b.querySelector('.interaction-icon');
            return ic && ic.textContent === '💬';
        });

        if (commentBtn) {
            const countEl = commentBtn.querySelector('.interaction-count');
            if (countEl) {
                let count = parseInt(countEl.textContent) || 0;
                countEl.textContent = (count + 1).toString();
            }
        }

        showNotification('Comentário adicionado!');

        // Remove the comment box
        commentBox.remove();
    });

    cancelBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        commentBox.remove();
    });
}

// Pequena função para escapar HTML em comentários
function escapeHtml(unsafe) {
    return unsafe.replace(/[&<>\"]/g, function(m) {
        switch (m) {
            case '&': return '&amp;';
            case '<': return '&lt;';
            case '>': return '&gt;';
            case '"': return '&quot;';
            default: return m;
        }
    });
}

// Função para configurar botão de juntar-se ao grupo
function setupJoinButtons() {
    const joinButtons = document.querySelectorAll('.join-btn');
    
    joinButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            e.stopPropagation();
            
            if (button.textContent.includes('Juntar-se')) {
                button.textContent = '✓ Membro do Grupo';
                button.style.background = 'linear-gradient(135deg, #28a745 0%, #20c997 100%)';
                showNotification('Juntou-se ao grupo com sucesso! 🎉');
            } else {
                button.textContent = 'Juntar-se ao Grupo';
                button.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
                showNotification('Saiu do grupo');
            }
        });
    });
}

// Função para criar novo post (integração com plantas)
function createPlantProgressPost() {
    const plants = JSON.parse(localStorage.getItem('myPlants') || '[]');
    
    if (plants.length === 0) {
        showNotification('Adicione uma planta primeiro para compartilhar o progresso! 🌱');
        return;
    }
    
    // Mostra opções de plantas
    const plantOptions = plants.map((plant, index) => 
        `<option value="${index}">${plant.name}</option>`
    ).join('');
    
    const modal = document.createElement('div');
    modal.className = 'post-modal';
    modal.innerHTML = `
        <div class="post-modal-content">
            <button class="close-modal" onclick="this.parentElement.parentElement.remove()">✕</button>
            <h2>Compartilhar Progresso da Planta 🌱</h2>
            
            <div class="modal-field">
                <label>Selecione a planta:</label>
                <select id="plant-select" class="modal-input">
                    ${plantOptions}
                </select>
            </div>

            <div id="progress-preview" class="progress-preview">
                <!-- Fotos de progresso serão mostradas aqui -->
            </div>
            
            <div class="modal-field">
                <label>Título do post:</label>
                <input type="text" id="post-title" class="modal-input" placeholder="Ex: Minha rosa após 3 meses!">
            </div>
            
            <div class="modal-field">
                <label>Descrição:</label>
                <textarea id="post-description" class="modal-textarea" rows="4" placeholder="Conte sobre o progresso da sua planta..."></textarea>
            </div>
            
            <div class="modal-buttons">
                <button class="btn-confirm" onclick="submitPlantPost()">Publicar</button>
                <button class="btn-cancel" onclick="this.parentElement.parentElement.parentElement.remove()">Cancelar</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Configura listener para mudança de planta selecionada
    const plantSelect = document.getElementById('plant-select');
    if (plantSelect) {
        plantSelect.addEventListener('change', updateProgressPreview);
        // Mostra preview inicial
        updateProgressPreview();
    }
}

// Função para atualizar preview das fotos de progresso
function updateProgressPreview() {
    const plants = JSON.parse(localStorage.getItem('myPlants') || '[]');
    const plantSelect = document.getElementById('plant-select');
    const previewContainer = document.getElementById('progress-preview');
    
    if (!plantSelect || !previewContainer) return;
    
    const plantIndex = parseInt(plantSelect.value);
    const plant = plants[plantIndex];
    
    if (!plant || !plant.progressPhotos || plant.progressPhotos.length === 0) {
        previewContainer.innerHTML = `
            <div class="no-progress">
                <p>⚠️ Esta planta ainda não tem fotos de progresso.</p>
                <p style="font-size: 0.9em; color: #666;">Adicione fotos em "Minhas Plantas" para compartilhar!</p>
            </div>
        `;
        return;
    }
    
    // Mostra as fotos de progresso
    const photosHTML = plant.progressPhotos.map((photo, index) => {
        const date = new Date(photo.date);
        const daysDiff = Math.floor((new Date() - date) / (1000 * 60 * 60 * 24));
        const timeLabel = daysDiff === 0 ? 'Hoje' : 
                         daysDiff === 1 ? 'Ontem' : 
                         daysDiff < 7 ? `Há ${daysDiff} dias` :
                         daysDiff < 30 ? `Há ${Math.floor(daysDiff / 7)} semanas` :
                         `Há ${Math.floor(daysDiff / 30)} meses`;
        
        return `
            <div class="preview-photo-item">
                <img src="${photo.image}" alt="Progresso ${index + 1}" class="preview-photo">
                <span class="preview-label">${timeLabel}</span>
            </div>
        `;
    }).join('');
    
    previewContainer.innerHTML = `
        <div class="progress-preview-header">
            <h4>📸 Fotos de Progresso (${plant.progressPhotos.length})</h4>
            <span class="preview-subtitle">Estas fotos serão compartilhadas no post</span>
        </div>
        <div class="progress-preview-grid">
            ${photosHTML}
        </div>
    `;
}

// Submeter novo post
window.submitPlantPost = function() {
    const plantIndex = document.getElementById('plant-select').value;
    const title = document.getElementById('post-title').value;
    const description = document.getElementById('post-description').value;
    
    if (!title.trim()) {
        showNotification('Por favor, adicione um título! ✍️');
        return;
    }
    
    const plants = JSON.parse(localStorage.getItem('myPlants') || '[]');
    const plant = plants[plantIndex];
    
    if (!plant) {
        showNotification('Planta não encontrada! ❌');
        return;
    }
    
    // Verifica se tem fotos de progresso
    if (!plant.progressPhotos || plant.progressPhotos.length === 0) {
        if (!confirm('Esta planta não tem fotos de progresso. Deseja publicar mesmo assim?')) {
            return;
        }
    }
    
    addPostToForum(plant, title, description);
    
    // Adiciona notificação de novo post
    if (typeof window.notificarNovoPost === 'function') {
        window.notificarNovoPost('Você', title);
    }
    
    document.querySelector('.post-modal').remove();
    showNotification('Post publicado com sucesso! 🎉');
};

// Função para adicionar post ao fórum dinamicamente
function addPostToForum(plant, title, description) {
    const forumPosts = document.querySelector('.forum-posts');
    
    const newPost = document.createElement('div');
    newPost.className = 'forum-post progress-post';
    newPost.setAttribute('data-category', 'progress');
    newPost.style.animation = 'fadeIn 0.5s ease';
    
    // Verifica se tem fotos de progresso
    let progressGalleryHTML = '';
    if (plant.progressPhotos && plant.progressPhotos.length > 0) {
        // Usa as fotos reais de progresso
        const progressPhotosHTML = plant.progressPhotos.map((photo, index) => {
            const photoDate = new Date(photo.date);
            const daysSincePlanting = plant.plantDate ? 
                Math.floor((photoDate - new Date(plant.plantDate)) / (1000 * 60 * 60 * 24)) : index * 7;
            
            const weekNumber = Math.floor(daysSincePlanting / 7);
            const weekLabel = weekNumber === 0 ? 'Início' : `Semana ${weekNumber}`;
            
            // Destaca a última foto
            const highlightClass = index === plant.progressPhotos.length - 1 ? 'highlight' : '';
            
            return `
                <div class="progress-item ${highlightClass}">
                    <img src="${photo.image}" alt="${plant.name} - ${weekLabel}" class="progress-photo">
                    <span class="progress-label">${weekLabel}</span>
                </div>
            `;
        }).join('');
        
        progressGalleryHTML = `
            <div class="progress-gallery">
                ${progressPhotosHTML}
            </div>
        `;
    } else {
        // Fallback se não houver fotos
        progressGalleryHTML = `
            <div class="no-progress-message" style="padding: 2em; text-align: center; background: rgba(102, 126, 234, 0.05); border-radius: 0.8em; margin: 1em 0;">
                <p style="color: #666; margin: 0;">📷 Nenhuma foto de progresso disponível ainda.</p>
            </div>
        `;
    }
    
    newPost.innerHTML = `
        <div class="post-header">
            <div class="post-author">
                <div class="author-avatar">🌱</div>
                <div class="author-info">
                    <h3 class="author-name">Você</h3>
                    <span class="post-time">Agora</span>
                </div>
            </div>
            <span class="post-category progress">📈 Progresso</span>
        </div>
        
        <div class="post-content">
            <h2 class="post-title">${title}</h2>
            <p class="post-text">${description}</p>
            
            ${progressGalleryHTML}
            
            <div class="plant-stats">
                <span class="stat-badge">🌱 ${plant.name}</span>
                <span class="stat-badge">📅 Plantada em ${new Date(plant.plantDate).toLocaleDateString('pt-PT')}</span>
                ${plant.progressPhotos ? `<span class="stat-badge">📸 ${plant.progressPhotos.length} foto(s)</span>` : ''}
            </div>
        </div>
        
        <div class="post-footer">
            <div class="post-interactions">
                <button class="interaction-btn">
                    <span class="interaction-icon">👍</span>
                    <span class="interaction-count">0</span>
                </button>
                <button class="interaction-btn">
                    <span class="interaction-icon">💬</span>
                    <span class="interaction-count">0</span>
                </button>
            </div>
        </div>
    `;
    
    // Adiciona no topo do fórum
    forumPosts.insertBefore(newPost, forumPosts.firstChild);
    
    // Reconfigura botões de interação
    setupInteractionButtons();
}

// Função para configurar FAB
function setupFAB() {
    const fabButton = document.querySelector('.fab-button');
    
    if (fabButton) {
        fabButton.addEventListener('click', () => {
            createPlantProgressPost();
        });
    }
}

// Função para mostrar notificação
function showNotification(message) {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 1em 1.5em;
        border-radius: 0.8em;
        box-shadow: 0 0.5em 2em rgba(0, 0, 0, 0.3);
        z-index: 1000;
        animation: slideIn 0.5s ease;
        font-weight: 600;
        max-width: 300px;
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.5s ease';
        setTimeout(() => notification.remove(), 500);
    }, 3000);
}

// Adiciona CSS para animações e modal
const style = document.createElement('style');
style.textContent = `
    @keyframes fadeIn {
        from {
            opacity: 0;
            transform: translateY(20px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
    
    @keyframes slideIn {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }
    
    .post-modal {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.7);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000;
        animation: fadeIn 0.3s ease;
    }
    
    .post-modal-content {
        background: white;
        padding: 2em;
        border-radius: 1em;
        max-width: 500px;
        width: 90%;
        position: relative;
        box-shadow: 0 0.5em 2em rgba(0, 0, 0, 0.3);
    }
    
    .close-modal {
        position: absolute;
        top: 1em;
        right: 1em;
        background: none;
        border: none;
        font-size: 1.5em;
        cursor: pointer;
        color: #999;
        transition: color 0.3s ease;
    }
    
    .close-modal:hover {
        color: #333;
    }
    
    .post-modal-content h2 {
        margin: 0 0 1.5em 0;
        color: #333;
        font-size: 1.5em;
    }
    
    .modal-field {
        margin-bottom: 1.5em;
    }
    
    .modal-field label {
        display: block;
        font-weight: 600;
        color: #333;
        margin-bottom: 0.5em;
    }
    
    .modal-input,
    .modal-textarea {
        width: 100%;
        padding: 0.8em;
        border: 0.1em solid #ddd;
        border-radius: 0.5em;
        font-size: 1em;
        font-family: Arial, sans-serif;
        box-sizing: border-box;
    }
    
    .modal-input:focus,
    .modal-textarea:focus {
        outline: none;
        border-color: #667eea;
    }
    
    .modal-buttons {
        display: flex;
        gap: 1em;
        margin-top: 2em;
    }
    
    .modal-buttons button {
        flex: 1;
        padding: 1em;
        border: none;
        border-radius: 0.6em;
        font-weight: 600;
        font-size: 1em;
        cursor: pointer;
        transition: all 0.3s ease;
    }
    
    .btn-confirm {
        background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
        color: white;
    }
    
    .btn-confirm:hover {
        transform: translateY(-0.2em);
        box-shadow: 0 0.3em 1em rgba(40, 167, 69, 0.3);
    }
    
    .btn-cancel {
        background: #f0f0f0;
        color: #666;
    }
    
    .btn-cancel:hover {
        background: #e0e0e0;
    }
`;
document.head.appendChild(style);

// Inicializa quando a página carregar
document.addEventListener('DOMContentLoaded', () => {
    console.log('👥 Fórum do Smart Plants inicializado!');
    
    // Configura botões de categoria
    setupCategoryButtons();
    
    // Configura botões de interação
    setupInteractionButtons();
    
    // Configura botões de juntar-se ao grupo
    setupJoinButtons();
    
    // Configura FAB
    setupFAB();
});

// Exporta funções para uso global
window.ForumSmartPlants = {
    filterPosts,
    createPlantProgressPost,
    showNotification
};
