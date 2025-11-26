// @ts-nocheck
// Fórum Interativo - Smart Plants

let currentCategoryFilter = 'all';
let currentForumSortOrder = 'recent';
let currentForumPhotoFilter = 'all';
let currentForumStatusFilter = 'all';

let activeReactionPicker = null;

function applyPostFilters() {
    const forumPostsContainer = document.querySelector('.forum-posts');
    if (!forumPostsContainer) return;

    const posts = Array.from(forumPostsContainer.querySelectorAll('.forum-post'));
    if (!posts.length) return;

    const sortedPosts = posts.slice().sort((a, b) => {
        const aPinned = a.dataset.pinned === 'true';
        const bPinned = b.dataset.pinned === 'true';

        if (aPinned !== bPinned) {
            return aPinned ? -1 : 1;
        }

        const aTime = Date.parse(a.dataset.timestamp || '') || 0;
        const bTime = Date.parse(b.dataset.timestamp || '') || 0;
        return currentForumSortOrder === 'recent' ? bTime - aTime : aTime - bTime;
    });

    sortedPosts.forEach(post => forumPostsContainer.appendChild(post));

    sortedPosts.forEach(post => {
        const postCategory = post.getAttribute('data-category');
        const hasPhotos = post.dataset.hasPhotos === 'true';

        post.classList.toggle('is-pinned', post.dataset.pinned === 'true');

        const matchesCategory = currentCategoryFilter === 'all' || postCategory === currentCategoryFilter || postCategory === 'all';
        const matchesPhotoFilter =
            currentForumPhotoFilter === 'all' ||
            (currentForumPhotoFilter === 'with-photos' && hasPhotos) ||
            (currentForumPhotoFilter === 'without-photos' && !hasPhotos);

        const matchesStatus =
            currentForumStatusFilter === 'all' ||
            (currentForumStatusFilter === 'pinned' && post.dataset.pinned === 'true') ||
            (currentForumStatusFilter === 'saved' && post.dataset.saved === 'true');

        if (matchesCategory && matchesPhotoFilter && matchesStatus) {
            post.style.display = 'block';
            post.style.animation = 'fadeIn 0.5s ease';
        } else {
            post.style.display = 'none';
        }
    });
}

// Função para filtrar posts por categoria
function filterPosts(category) {
    currentCategoryFilter = category;
    applyPostFilters();
}

function setupForumToolbar() {
    const sortSelect = document.getElementById('forumSortSelect');
    const mediaFilterSelect = document.getElementById('forumMediaFilter');
    const statusFilterSelect = document.getElementById('forumStatusFilter');

    if (sortSelect) {
        sortSelect.addEventListener('change', (event) => {
            currentForumSortOrder = event.target.value === 'oldest' ? 'oldest' : 'recent';
            applyPostFilters();
        });
    }

    if (mediaFilterSelect) {
        mediaFilterSelect.addEventListener('change', (event) => {
            currentForumPhotoFilter = event.target.value || 'all';
            applyPostFilters();
        });
    }

    if (statusFilterSelect) {
        statusFilterSelect.addEventListener('change', (event) => {
            currentForumStatusFilter = event.target.value || 'all';
            applyPostFilters();
        });
    }
}

function ensureCommentList(post) {
    let section = post.querySelector('.comments-section');
    if (!section) {
        section = document.createElement('div');
        section.className = 'comments-section';

        const title = document.createElement('div');
        title.className = 'comments-title';
        title.textContent = '💬 Comentários';
        section.appendChild(title);

        const list = document.createElement('div');
        list.className = 'comment-list';
        section.appendChild(list);

        const footer = post.querySelector('.post-footer');
        if (footer && footer.nextSibling) {
            post.insertBefore(section, footer.nextSibling);
        } else {
            post.appendChild(section);
        }

        return list;
    }

    let commentList = section.querySelector('.comment-list');
    if (!commentList) {
        commentList = document.createElement('div');
        commentList.className = 'comment-list';
        section.appendChild(commentList);
    }
    return commentList;
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

// Função para configurar botões de interação (reagir, comentar, guardar, fixar)
function setupInteractionButtons(scope = document) {
    const container = scope instanceof Element ? scope : document;
    const interactionButtons = container.querySelectorAll('.interaction-btn');

    interactionButtons.forEach(button => {
        if (button.dataset.bound === 'true') return;
        button.dataset.bound = 'true';

        if (!button.dataset.defaultReaction) {
            const iconEl = button.querySelector('.interaction-icon');
            if (iconEl) {
                button.dataset.defaultReaction = iconEl.textContent.trim() || '👍';
            }
        }

        button.addEventListener('click', handleInteractionButton);
    });
}

function handleInteractionButton(event) {
    const button = event.currentTarget;
    const action = button.dataset.action || '';
    const post = button.closest('.forum-post');
    event.stopPropagation();

    if (!post) return;

    switch (action) {
        case 'comment':
            openCommentBox(post, button);
            break;
        case 'react':
            handleReaction(button);
            break;
        case 'save':
            toggleSave(button, post);
            break;
        case 'pin':
            togglePin(button, post);
            break;
        default:
            button.classList.toggle('active');
            break;
    }

    if (action !== 'comment') {
        button.style.transform = 'scale(0.92)';
        setTimeout(() => {
            button.style.transform = 'scale(1)';
        }, 140);
    }
}

function handleReaction(button) {
    if (activeReactionPicker && activeReactionPicker.parentElement === button) {
        closeReactionPicker();
        return;
    }

    openReactionPicker(button);
}

function openReactionPicker(button) {
    const options = (button.dataset.reactionOptions || '👍|❤️')
        .split('|')
        .map(option => option.trim())
        .filter(Boolean);

    if (!options.length) {
        showNotification('Sem reações disponíveis.');
        return;
    }

    closeReactionPicker();

    const picker = document.createElement('div');
    picker.className = 'reaction-picker';

    options.forEach(option => {
        const optionBtn = document.createElement('button');
        optionBtn.type = 'button';
        optionBtn.className = 'reaction-option';
        optionBtn.textContent = option;
        optionBtn.addEventListener('click', (event) => {
            event.stopPropagation();
            selectReaction(button, option);
            closeReactionPicker();
        });
        picker.appendChild(optionBtn);
    });

    if (button.dataset.userReacted === 'true') {
        const clearBtn = document.createElement('button');
        clearBtn.type = 'button';
        clearBtn.className = 'reaction-option reaction-clear';
        clearBtn.textContent = '❌';
        clearBtn.setAttribute('aria-label', 'Remover reação');
        clearBtn.addEventListener('click', (event) => {
            event.stopPropagation();
            removeReaction(button);
            closeReactionPicker();
        });
        picker.appendChild(clearBtn);
    }

    button.appendChild(picker);
    activeReactionPicker = picker;

    requestAnimationFrame(() => {
        picker.classList.add('visible');
    });
}

function closeReactionPicker() {
    if (!activeReactionPicker) return;
    activeReactionPicker.classList.remove('visible');
    const pickerToRemove = activeReactionPicker;
    activeReactionPicker = null;
    setTimeout(() => pickerToRemove.remove(), 120);
}

function selectReaction(button, reaction) {
    const iconEl = button.querySelector('.interaction-icon');
    const countEl = button.querySelector('.interaction-count');

    if (!button.dataset.defaultReaction && iconEl) {
        button.dataset.defaultReaction = iconEl.textContent.trim() || '👍';
    }

    if (iconEl) {
        iconEl.textContent = reaction;
    }

    if (button.dataset.userReacted !== 'true' && countEl) {
        const current = parseInt(countEl.textContent) || 0;
        countEl.textContent = (current + 1).toString();
    }

    button.dataset.userReacted = 'true';
    button.dataset.reaction = reaction;
    button.classList.add('active');

    showNotification(`Reação ${reaction} adicionada!`);
}

function removeReaction(button) {
    if (button.dataset.userReacted !== 'true') return;

    const countEl = button.querySelector('.interaction-count');
    const iconEl = button.querySelector('.interaction-icon');

    if (countEl) {
        const current = parseInt(countEl.textContent) || 0;
        countEl.textContent = Math.max(0, current - 1).toString();
    }

    if (iconEl) {
        iconEl.textContent = button.dataset.defaultReaction || '👍';
    }

    button.dataset.userReacted = 'false';
    button.dataset.reaction = 'none';
    button.classList.remove('active');

    showNotification('Reação removida.');
}

function toggleSave(button, post) {
    const isSaved = button.classList.toggle('active');
    const labelEl = button.querySelector('.interaction-label');

    post.dataset.saved = isSaved ? 'true' : 'false';

    if (labelEl) {
        const defaultLabel = button.dataset.labelDefault || 'Guardar';
        const savedLabel = button.dataset.labelSaved || 'Guardado';
        labelEl.textContent = isSaved ? savedLabel : defaultLabel;
    }

    showNotification(isSaved ? 'Post guardado na sua coleção.' : 'Post removido dos guardados.');
    applyPostFilters();
}

function togglePin(button, post) {
    const isPinned = button.classList.toggle('active');
    const labelEl = button.querySelector('.interaction-label');

    post.dataset.pinned = isPinned ? 'true' : 'false';
    post.classList.toggle('is-pinned', isPinned);

    if (labelEl) {
        const defaultLabel = button.dataset.labelDefault || 'Fixar';
        const pinnedLabel = button.dataset.labelPinned || 'Fixado';
        labelEl.textContent = isPinned ? pinnedLabel : defaultLabel;
    }

    showNotification(isPinned ? 'Post fixado no topo.' : 'Post desafixado.');
    applyPostFilters();
}

function updateCommentCount(post) {
    const list = post.querySelector('.comment-list');
    const commentBtn = post.querySelector('.interaction-btn[data-action="comment"]');
    const countEl = commentBtn ? commentBtn.querySelector('.interaction-count') : null;
    if (countEl) {
        const total = list ? list.children.length : 0;
        countEl.textContent = total.toString();
    }
}

function populateInitialComments() {
    const posts = document.querySelectorAll('.forum-post');

    posts.forEach(post => {
        const rawComments = post.dataset.initialComments;
        if (!rawComments) {
            updateCommentCount(post);
            return;
        }

        const entries = rawComments.split('|').map(entry => {
            const [author, ...messageParts] = entry.split('::');
            return {
                author: (author || '').trim(),
                message: (messageParts.join('::') || '').trim()
            };
        }).filter(item => item.author && item.message);

        if (!entries.length) {
            updateCommentCount(post);
            return;
        }

        const list = ensureCommentList(post);
        list.innerHTML = '';

        entries.forEach((entry, index) => {
            const commentItem = document.createElement('div');
            commentItem.className = 'comment-item';
            const relativeTime = index % 2 === 0 ? 'há 1 dia' : 'há 3 horas';
            commentItem.innerHTML = `
                <strong>${escapeHtml(entry.author)}</strong>
                <span>${escapeHtml(entry.message)}</span>
                <time>${relativeTime}</time>
            `;
            list.appendChild(commentItem);
        });

        updateCommentCount(post);
    });
}

document.addEventListener('click', (event) => {
    if (!activeReactionPicker) return;

    const picker = activeReactionPicker;
    const parentBtn = picker.parentElement;

    if (picker.contains(event.target)) return;
    if (parentBtn && parentBtn.contains(event.target)) return;

    closeReactionPicker();
});

document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
        closeReactionPicker();
    }
});

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
    commentBox.style.cssText = 'margin-top:16px; display:flex; gap:12px; align-items:flex-end; flex-wrap:wrap;';
    commentBox.innerHTML = `
        <textarea placeholder="Escreve um comentário..." rows="3" style="flex:1;min-width:240px;min-height:4.2em;padding:0.8em;border:1px solid #d4d4d4;border-radius:0.6em;font-family:inherit;box-shadow:0 0.2em 0.6em rgba(0,0,0,0.05);"></textarea>
        <div style="display:flex;flex-direction:column;gap:8px;min-width:120px;">
            <button class="btn-comment-submit" style="background:linear-gradient(135deg,#28a745 0%,#20c997 100%);color:white;border:none;padding:0.55em 0.9em;border-radius:0.55em;cursor:pointer;font-weight:600;">Comentar</button>
            <button class="btn-comment-cancel" style="background:#f6f7fb;border:none;padding:0.45em 0.75em;border-radius:0.55em;cursor:pointer;font-weight:600;color:#555;">Cancelar</button>
        </div>
    `;

    footer.appendChild(commentBox);

    const textarea = commentBox.querySelector('textarea');
    const submitBtn = commentBox.querySelector('.btn-comment-submit');
    const cancelBtn = commentBox.querySelector('.btn-comment-cancel');

    // Auto-focus
    setTimeout(() => textarea.focus(), 50);

    textarea.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            submitBtn.click();
        }
    });

    // Submit handler: adiciona o comentário e atualiza o contador
    submitBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const text = textarea.value.trim();
        if (!text) {
            showNotification('Escreve algo antes de comentar.');
            return;
        }

        const commentList = ensureCommentList(post);

        const commentItem = document.createElement('div');
        commentItem.className = 'comment-item';
        commentItem.innerHTML = `
            <strong>Tu</strong>
            <span>${escapeHtml(text)}</span>
            <time>${new Date().toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}</time>
        `;

        commentList.appendChild(commentItem);
        commentList.scrollTop = commentList.scrollHeight;

        updateCommentCount(post);

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
    return unsafe.replace(/[&<>"']/g, function(m) {
        switch (m) {
            case '&': return '&amp;';
            case '<': return '&lt;';
            case '>': return '&gt;';
            case '"': return '&quot;';
            case "'": return '&#39;';
            default: return m;
        }
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
    newPost.dataset.category = 'progress';
    newPost.style.animation = 'fadeIn 0.5s ease';

    const hasProgressPhotos = Array.isArray(plant.progressPhotos) && plant.progressPhotos.length > 0;
    newPost.dataset.hasPhotos = hasProgressPhotos ? 'true' : 'false';
    newPost.dataset.timestamp = new Date().toISOString();
    newPost.dataset.saved = 'false';
    newPost.dataset.pinned = 'false';
    
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
                <button class="interaction-btn" data-action="react" data-reaction-options="👍|❤️" data-reaction="none">
                    <span class="interaction-icon">👍</span>
                    <span class="interaction-count">0</span>
                </button>
                <button class="interaction-btn" data-action="comment">
                    <span class="interaction-icon">💬</span>
                    <span class="interaction-count">0</span>
                </button>
                <button class="interaction-btn" data-action="save" data-label-default="Guardar" data-label-saved="Guardado">
                    <span class="interaction-icon">🔖</span>
                    <span class="interaction-label">Guardar</span>
                </button>
            </div>
        </div>
    `;
    
    // Adiciona no topo do fórum
    forumPosts.insertBefore(newPost, forumPosts.firstChild);
    
    // Reconfigura botões de interação
    setupInteractionButtons(newPost);

    updateCommentCount(newPost);

    applyPostFilters();
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

    // Configura barra de ferramentas de filtros/ordenação
    setupForumToolbar();
    
    // Configura botões de interação
    setupInteractionButtons();
    
    // Preenche comentários presentes nos atributos de dados
    populateInitialComments();
    
    // Configura FAB
    setupFAB();

    applyPostFilters();
});

// Exporta funções para uso global
window.ForumSmartPlants = {
    filterPosts,
    createPlantProgressPost,
    showNotification
};
