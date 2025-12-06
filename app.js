// Главное приложение Todo с Firebase
class TodoApp {
    constructor() {
        this.currentUser = null;
        this.tasks = [];
        this.currentFilter = 'all';
        this.isOnline = true;
        this.isLocalMode = false;
        
        this.init();
    }
    
    async init() {
        // Ждем загрузки Firebase
        await this.waitForFirebase();
        
        // Настройка слушателей событий
        this.setupEventListeners();
        
        // Проверяем предыдущий вход
        this.checkPreviousLogin();
        
        // Мониторинг соединения
        this.setupConnectionMonitor();
        
        console.log('TodoApp инициализирован');
    }
    
    async waitForFirebase() {
        return new Promise((resolve) => {
            if (window.firebaseApp) {
                resolve();
            } else {
                const checkInterval = setInterval(() => {
                    if (window.firebaseApp) {
                        clearInterval(checkInterval);
                        resolve();
                    }
                }, 100);
            }
        });
    }
    
    setupEventListeners() {
        // Вход через Google
        document.getElementById('google-login-btn').addEventListener('click', () => this.signInWithGoogle());
        
        // Телефон (заглушка)
        document.getElementById('phone-login-btn').addEventListener('click', () => {
            this.showMessage('Вход по телефону временно недоступен', 'warning');
        });
        
        // Локальный режим
        document.getElementById('local-mode-btn').addEventListener('click', () => this.enableLocalMode());
        
        // Выход
        document.getElementById('logout-btn')?.addEventListener('click', () => this.signOut());
        
        // Добавление задачи
        document.getElementById('add-task-btn').addEventListener('click', () => this.addTask());
        document.getElementById('new-task-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addTask();
        });
        
        // Фильтры
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.currentFilter = e.target.dataset.filter;
                this.renderTasks();
            });
        });
        
        // Очистка выполненных
        document.getElementById('clear-completed-btn').addEventListener('click', () => this.clearCompletedTasks());
        
        // Обновить синхронизацию
        document.getElementById('refresh-sync')?.addEventListener('click', (e) => {
            e.preventDefault();
            location.reload();
        });
        
        // Очистить кэш
        document.getElementById('clear-cache')?.addEventListener('click', (e) => {
            e.preventDefault();
            if (confirm('Очистить кэш приложения?')) {
                localStorage.clear();
                location.reload();
            }
        });
    }
    
    setupConnectionMonitor() {
        window.addEventListener('online', () => {
            this.isOnline = true;
            this.updateConnectionStatus();
            if (this.currentUser && !this.isLocalMode) {
                this.showMessage('Соединение восстановлено', 'success');
            }
        });
        
        window.addEventListener('offline', () => {
            this.isOnline = false;
            this.updateConnectionStatus();
            this.showMessage('Нет подключения к интернету', 'warning');
        });
        
        this.updateConnectionStatus();
    }
    
    updateConnectionStatus() {
        const statusEl = document.getElementById('sync-status');
        if (!this.isOnline) {
            statusEl.textContent = 'Нет интернета';
            statusEl.className = 'status-disconnected';
        } else if (this.isLocalMode) {
            statusEl.textContent = 'Локальный режим';
            statusEl.className = 'status-disconnected';
        } else if (this.currentUser) {
            statusEl.textContent = 'Синхронизация активна';
            statusEl.className = 'status-connected';
        } else {
            statusEl.textContent = 'Ожидание входа...';
            statusEl.className = '';
        }
    }
    
    checkPreviousLogin() {
        const savedUser = localStorage.getItem('todo_user');
        if (savedUser) {
            try {
                this.currentUser = JSON.parse(savedUser);
                this.showUserInfo();
                this.loadTasks();
                this.showMessage('Восстановлен предыдущий вход', 'info');
            } catch (e) {
                console.error('Ошибка восстановления:', e);
            }
        }
        
        // Слушатель состояния аутентификации Firebase
        if (window.firebaseAuth) {
            window.firebaseAuth.onAuthStateChanged((user) => {
                if (user) {
                    this.currentUser = {
                        uid: user.uid,
                        email: user.email,
                        displayName: user.displayName,
                        photoURL: user.photoURL
                    };
                    
                    localStorage.setItem('todo_user', JSON.stringify(this.currentUser));
                    this.showUserInfo();
                    this.loadTasks();
                    
                    if (!this.isLocalMode) {
                        this.showMessage(`Добро пожаловать, ${user.email}!`, 'success');
                    }
                } else {
                    this.currentUser = null;
                    localStorage.removeItem('todo_user');
                    
                    if (!this.isLocalMode) {
                        document.getElementById('app-content').style.display = 'none';
                        document.getElementById('auth-section').style.display = 'block';
                    }
                }
            });
        }
    }
    
    async signInWithGoogle() {
        try {
            const provider = new firebase.auth.GoogleAuthProvider();
            await window.firebaseAuth.signInWithPopup(provider);
            // Автоматически обработается в onAuthStateChanged
        } catch (error) {
            console.error('Ошибка входа:', error);
            this.showMessage(`Ошибка входа: ${error.message}`, 'error');
        }
    }
    
    enableLocalMode() {
        this.isLocalMode = true;
        this.showUserInfo(); // Показываем как "Локальный пользователь"
        this.loadTasks();
        this.showMessage('Локальный режим активирован', 'info');
    }
    
    signOut() {
        if (window.firebaseAuth) {
            window.firebaseAuth.signOut();
        }
        this.currentUser = null;
        this.isLocalMode = false;
        localStorage.removeItem('todo_user');
        
        document.getElementById('app-content').style.display = 'none';
        document.getElementById('auth-section').style.display = 'block';
        this.showMessage('Вы вышли из системы', 'info');
    }
    
    showUserInfo() {
        const userInfo = document.getElementById('user-info');
        const userEmail = document.getElementById('user-email');
        const appContent = document.getElementById('app-content');
        const authSection = document.getElementById('auth-section');
        
        if (this.isLocalMode) {
            userEmail.textContent = 'Локальный пользователь';
            userInfo.style.display = 'block';
            appContent.style.display = 'block';
            authSection.style.display = 'none';
        } else if (this.currentUser) {
            userEmail.textContent = this.currentUser.email || 'Пользователь';
            userInfo.style.display = 'block';
            appContent.style.display = 'block';
            authSection.style.display = 'none';
        } else {
            userInfo.style.display = 'none';
            appContent.style.display = 'none';
            authSection.style.display = 'block';
        }
        
        this.updateConnectionStatus();
    }
    
    async loadTasks() {
        if (this.isLocalMode || !this.currentUser || !window.firebaseDb) {
            this.loadLocalTasks();
            return;
        }
        
        try {
            this.showLoading();
            
            // Загружаем из Firebase
            const snapshot = await window.firebaseDb
                .collection('users')
                .doc(this.currentUser.uid)
                .collection('tasks')
                .orderBy('createdAt', 'desc')
                .get();
            
            this.tasks = [];
            snapshot.forEach(doc => {
                this.tasks.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            
            // Также подписываемся на обновления
            this.setupRealtimeUpdates();
            
        } catch (error) {
            console.error('Ошибка загрузки из Firebase:', error);
            this.loadLocalTasks();
            this.showMessage('Используются локальные данные', 'warning');
        } finally {
            this.hideLoading();
            this.renderTasks();
            this.updateStats();
        }
    }
    
    setupRealtimeUpdates() {
        if (!this.currentUser || !window.firebaseDb) return;
        
        // Отписываемся от предыдущих слушателей
        if (this.unsubscribeTasks) {
            this.unsubscribeTasks();
        }
        
        // Подписываемся на обновления в реальном времени
        this.unsubscribeTasks = window.firebaseDb
            .collection('users')
            .doc(this.currentUser.uid)
            .collection('tasks')
            .orderBy('createdAt', 'desc')
            .onSnapshot((snapshot) => {
                this.tasks = [];
                snapshot.forEach(doc => {
                    this.tasks.push({
                        id: doc.id,
                        ...doc.data()
                    });
                });
                this.renderTasks();
                this.updateStats();
            }, (error) => {
                console.error('Ошибка реального обновления:', error);
            });
    }
    
    loadLocalTasks() {
        const saved = localStorage.getItem('local_tasks');
        if (saved) {
            try {
                this.tasks = JSON.parse(saved);
            } catch (e) {
                console.error('Ошибка загрузки локальных задач:', e);
                this.tasks = [];
            }
        } else {
            this.tasks = [];
        }
        this.renderTasks();
        this.updateStats();
    }
    
    saveLocalTasks() {
        localStorage.setItem('local_tasks', JSON.stringify(this.tasks));
    }
    
    async addTask() {
        const input = document.getElementById('new-task-input');
        const text = input.value.trim();
        
        if (!text) {
            this.showMessage('Введите текст задачи', 'warning');
            input.focus();
            return;
        }
        
        const newTask = {
            text: text,
            completed: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        if (this.isLocalMode || !this.currentUser || !window.firebaseDb) {
            // Локальное сохранение
            newTask.id = Date.now().toString();
            this.tasks.unshift(newTask);
            this.saveLocalTasks();
            this.renderTasks();
            this.updateStats();
            this.showMessage('Задача добавлена (локально)', 'success');
        } else {
            // Сохранение в Firebase
            try {
                const docRef = await window.firebaseDb
                    .collection('users')
                    .doc(this.currentUser.uid)
                    .collection('tasks')
                    .add({
                        ...newTask,
                        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                    });
                
                this.showMessage('Задача добавлена', 'success');
            } catch (error) {
                console.error('Ошибка сохранения в Firebase:', error);
                // Сохраняем локально как резерв
                newTask.id = Date.now().toString();
                this.tasks.unshift(newTask);
                this.saveLocalTasks();
                this.renderTasks();
                this.updateStats();
                this.showMessage('Задача добавлена (оффлайн)', 'info');
            }
        }
        
        input.value = '';
        input.focus();
    }
    
    async toggleTask(taskId) {
        const taskIndex = this.tasks.findIndex(t => t.id === taskId);
        if (taskIndex === -1) return;
        
        const task = this.tasks[taskIndex];
        const newCompleted = !task.completed;
        
        if (this.isLocalMode || !this.currentUser || !window.firebaseDb) {
            // Локальное обновление
            task.completed = newCompleted;
            task.updatedAt = new Date().toISOString();
            this.saveLocalTasks();
            this.renderTasks();
            this.updateStats();
        } else {
            // Обновление в Firebase
            try {
                await window.firebaseDb
                    .collection('users')
                    .doc(this.currentUser.uid)
                    .collection('tasks')
                    .doc(taskId)
                    .update({
                        completed: newCompleted,
                        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                    });
            } catch (error) {
                console.error('Ошибка обновления в Firebase:', error);
                // Локальное обновление как резерв
                task.completed = newCompleted;
                task.updatedAt = new Date().toISOString();
                this.saveLocalTasks();
                this.renderTasks();
                this.updateStats();
            }
        }
    }
    
    async deleteTask(taskId) {
        if (!confirm('Удалить эту задачу?')) return;
        
        if (this.isLocalMode || !this.currentUser || !window.firebaseDb) {
            // Локальное удаление
            this.tasks = this.tasks.filter(t => t.id !== taskId);
            this.saveLocalTasks();
            this.renderTasks();
            this.updateStats();
            this.showMessage('Задача удалена', 'success');
        } else {
            // Удаление из Firebase
            try {
                await window.firebaseDb
                    .collection('users')
                    .doc(this.currentUser.uid)
                    .collection('tasks')
                    .doc(taskId)
                    .delete();
                
                this.showMessage('Задача удалена', 'success');
            } catch (error) {
                console.error('Ошибка удаления из Firebase:', error);
                // Локальное удаление как резерв
                this.tasks = this.tasks.filter(t => t.id !== taskId);
                this.saveLocalTasks();
                this.renderTasks();
                this.updateStats();
                this.showMessage('Задача удалена (оффлайн)', 'info');
            }
        }
    }
    
    async editTask(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (!task) return;
        
        const newText = prompt('Редактировать задачу:', task.text);
        if (newText === null || newText.trim() === '') return;
        
        if (this.isLocalMode || !this.currentUser || !window.firebaseDb) {
            // Локальное редактирование
            task.text = newText.trim();
            task.updatedAt = new Date().toISOString();
            this.saveLocalTasks();
            this.renderTasks();
            this.showMessage('Задача обновлена', 'success');
        } else {
            // Обновление в Firebase
            try {
                await window.firebaseDb
                    .collection('users')
                    .doc(this.currentUser.uid)
                    .collection('tasks')
                    .doc(taskId)
                    .update({
                        text: newText.trim(),
                        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                    });
                
                this.showMessage('Задача обновлена', 'success');
            } catch (error) {
                console.error('Ошибка обновления в Firebase:', error);
                // Локальное обновление как резерв
                task.text = newText.trim();
                task.updatedAt = new Date().toISOString();
                this.saveLocalTasks();
                this.renderTasks();
                this.showMessage('Задача обновлена (оффлайн)', 'info');
            }
        }
    }
    
    async clearCompletedTasks() {
        const completedTasks = this.tasks.filter(t => t.completed);
        if (completedTasks.length === 0) {
            this.showMessage('Нет выполненных задач', 'info');
            return;
        }
        
        if (!confirm(`Удалить ${completedTasks.length} выполненных задач?`)) return;
        
        if (this.isLocalMode || !this.currentUser || !window.firebaseDb) {
            // Локальная очистка
            this.tasks = this.tasks.filter(t => !t.completed);
            this.saveLocalTasks();
            this.renderTasks();
            this.updateStats();
            this.showMessage(`Удалено ${completedTasks.length} задач`, 'success');
        } else {
            // Удаление из Firebase
            try {
                const batch = window.firebaseDb.batch();
                completedTasks.forEach(task => {
                    const taskRef = window.firebaseDb
                        .collection('users')
                        .doc(this.currentUser.uid)
                        .collection('tasks')
                        .doc(task.id);
                    batch.delete(taskRef);
                });
                
                await batch.commit();
                this.showMessage(`Удалено ${completedTasks.length} задач`, 'success');
            } catch (error) {
                console.error('Ошибка удаления из Firebase:', error);
                // Локальное удаление как резерв
                this.tasks = this.tasks.filter(t => !t.completed);
                this.saveLocalTasks();
                this.renderTasks();
                this.updateStats();
                this.showMessage(`Удалено ${completedTasks.length} задач (оффлайн)`, 'info');
            }
        }
    }
    
    renderTasks() {
        const container = document.getElementById('tasks-container');
        
        if (this.tasks.length === 0) {
            container.innerHTML = '<p class="empty-state">Задач пока нет. Добавьте первую задачу!</p>';
            return;
        }
        
        // Фильтрация
        let filteredTasks = this.tasks;
        if (this.currentFilter === 'active') {
            filteredTasks = this.tasks.filter(t => !t.completed);
        } else if (this.currentFilter === 'completed') {
            filteredTasks = this.tasks.filter(t => t.completed);
        }
        
        if (filteredTasks.length === 0) {
            container.innerHTML = `<p class="empty-state">Нет задач для фильтра "${this.currentFilter}"</p>`;
            return;
        }
        
        // Рендеринг
        container.innerHTML = filteredTasks.map(task => `
            <div class="task-item">
                <input type="checkbox" 
                       class="task-checkbox" 
                       ${task.completed ? 'checked' : ''}
                       onchange="todoApp.toggleTask('${task.id}')">
                <span class="task-text ${task.completed ? 'completed' : ''}">${this.escapeHtml(task.text)}</span>
                <div class="task-actions">
                    <button class="task-btn" onclick="todoApp.editTask('${task.id}')" title="Редактировать">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="task-btn delete" onclick="todoApp.deleteTask('${task.id}')" title="Удалить">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');
    }
    
    updateStats() {
        const total = this.tasks.length;
        const completed = this.tasks.filter(t => t.completed).length;
        
        document.getElementById('total-tasks').textContent = total;
        document.getElementById('completed-tasks').textContent = completed;
    }
    
    showLoading() {
        const container = document.getElementById('tasks-container');
        container.innerHTML = `
            <div class="loading">
                <div class="loading-spinner"></div>
                <p>Загрузка задач...</p>
            </div>
        `;
    }
    
    hideLoading() {
        // Автоматически скрывается при рендере
    }
    
    showMessage(message, type = 'info') {
        // Создаем уведомление
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        notification.style.position = 'fixed';
        notification.style.top = '20px';
        notification.style.right = '20px';
        notification.style.padding = '15px 25px';
        notification.style.borderRadius = '10px';
        notification.style.color = 'white';
        notification.style.fontWeight = '500';
        notification.style.zIndex = '1000';
        notification.style.animation = 'slideInRight 0.3s ease';
        
        // Цвета по типу
        const colors = {
            success: 'linear-gradient(135deg, #52c41a 0%, #389e0d 100%)',
            error: 'linear-gradient(135deg, #ff4d4f 0%, #cf1322 100%)',
            warning: 'linear-gradient(135deg, #faad14 0%, #d48806 100%)',
            info: 'linear-gradient(135deg, #1890ff 0%, #096dd9 100%)'
        };
        
        notification.style.background = colors[type] || colors.info;
        
        document.body.appendChild(notification);
        
        // Автоматическое удаление
        setTimeout(() => {
            notification.style.animation = 'slideInRight 0.3s ease reverse';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Создаем глобальный экземпляр приложения
let todoApp;

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    todoApp = new TodoApp();
    window.todoApp = todoApp; // Делаем глобально доступным
});