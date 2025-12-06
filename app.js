// Конфигурация Firebase
const firebaseConfig = {
    apiKey: "AIzaSyDkFfXZxvWYodWjTOCSU4dUevX6swMb-qA",
    authDomain: "sync-todo-app-e617f.firebaseapp.com",
    projectId: "sync-todo-app-e617f",
    storageBucket: "sync-todo-app-e617f.appspot.com",
    messagingSenderId: "205166949340",
    appId: "1:205166949340:web:30a2c94f972f4309d7e7d1",
    measurementId: "G-6JLVNKBPKZ"
};

// Инициализация Firebase
const app = firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// Состояние приложения
let currentUser = null;
let tasks = [];
let currentFilter = 'all';

// Инициализация приложения
document.addEventListener('DOMContentLoaded', function() {
    initApp();
    setupEventListeners();
    
    // Проверяем, сохранен ли пользователь в localStorage
    const savedUser = localStorage.getItem('todo_user');
    if (savedUser) {
        try {
            currentUser = JSON.parse(savedUser);
            updateUIForUser(currentUser);
            loadTasks();
        } catch (e) {
            console.error('Ошибка при чтении сохраненного пользователя:', e);
        }
    }
});

// Инициализация Firebase
function initApp() {
    // Отслеживание состояния авторизации
    auth.onAuthStateChanged((user) => {
        if (user) {
            // Пользователь вошел
            currentUser = {
                uid: user.uid,
                email: user.email,
                displayName: user.displayName,
                photoURL: user.photoURL
            };
            
            // Сохраняем в localStorage
            localStorage.setItem('todo_user', JSON.stringify(currentUser));
            
            // Обновляем UI
            updateUIForUser(currentUser);
            
            // Загружаем задачи
            loadTasks();
            
            showNotification('Вы успешно вошли!', 'success');
        } else {
            // Пользователь вышел
            currentUser = null;
            localStorage.removeItem('todo_user');
            updateUIForNoUser();
            showNotification('Вы вышли из системы', 'info');
        }
    });
    
    // Проверка подключения к Firebase
    db.enableNetwork().then(() => {
        console.log('Firebase подключен');
        updateFirebaseStatus(true);
    }).catch((error) => {
        console.error('Ошибка подключения Firebase:', error);
        updateFirebaseStatus(false);
    });
}

// Настройка обработчиков событий
function setupEventListeners() {
    // Вход через Google
    document.getElementById('google-login-btn').addEventListener('click', signInWithGoogle);
    
    // Вход по телефону
    document.getElementById('phone-login-btn').addEventListener('click', signInWithPhone);
    
    // Локальный режим
    document.getElementById('local-mode-btn').addEventListener('click', enableLocalMode);
    
    // Выход
    document.getElementById('logout-btn')?.addEventListener('click', signOut);
    
    // Добавление задачи
    document.getElementById('add-task-btn').addEventListener('click', addTask);
    document.getElementById('new-task-input').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            addTask();
        }
    });
    
    // Фильтры
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            // Удаляем активный класс у всех кнопок
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            // Добавляем активный класс текущей кнопке
            this.classList.add('active');
            currentFilter = this.dataset.filter;
            renderTasks();
        });
    });
    
    // Очистка выполненных задач
    document.getElementById('clear-completed-btn').addEventListener('click', clearCompletedTasks);
    
    // Обновление синхронизации
    document.getElementById('refresh-sync')?.addEventListener('click', function(e) {
        e.preventDefault();
        location.reload();
    });
    
    // Очистка кэша
    document.getElementById('clear-cache')?.addEventListener('click', function(e) {
        e.preventDefault();
        if (confirm('Очистить кэш приложения? Локальные данные будут удалены.')) {
            localStorage.clear();
            location.reload();
        }
    });
}

// Вход через Google
function signInWithGoogle() {
    const provider = new firebase.auth.GoogleAuthProvider();
    provider.addScope('profile');
    provider.addScope('email');
    
    showNotification('Открывается окно входа Google...', 'info');
    
    auth.signInWithPopup(provider)
        .then((result) => {
            // Успешный вход
            console.log('Успешный вход:', result.user);
        })
        .catch((error) => {
            console.error('Ошибка входа:', error);
            showNotification('Ошибка входа: ' + error.message, 'error');
        });
}

// Вход по телефону (заглушка)
function signInWithPhone() {
    showNotification('Вход по телефону временно недоступен. Используйте Google.', 'warning');
}

// Локальный режим
function enableLocalMode() {
    showNotification('Локальный режим активирован. Данные сохраняются только в браузере.', 'info');
    
    // Показываем основное содержимое
    document.getElementById('app-content').style.display = 'block';
    document.getElementById('auth-section').style.display = 'none';
    document.getElementById('sync-status').textContent = 'Локальный режим';
    document.getElementById('sync-status').className = 'status-disconnected';
    
    // Загружаем локальные задачи
    loadLocalTasks();
}

// Выход
function signOut() {
    auth.signOut()
        .then(() => {
            showNotification('Вы успешно вышли', 'info');
        })
        .catch((error) => {
            console.error('Ошибка выхода:', error);
            showNotification('Ошибка выхода', 'error');
        });
}

// Обновление UI для авторизованного пользователя
function updateUIForUser(user) {
    document.getElementById('user-email').textContent = user.email || user.displayName || 'Пользователь';
    document.getElementById('user-info').style.display = 'block';
    document.getElementById('app-content').style.display = 'block';
    document.getElementById('auth-section').style.display = 'none';
    
    // Обновляем статус синхронизации
    document.getElementById('sync-status').textContent = 'Синхронизация активна';
    document.getElementById('sync-status').className = 'status-connected';
    
    // Обновляем заголовок
    document.querySelector('h1').innerHTML = `<i class="fas fa-tasks"></i> Todo App - ${user.email || 'Мои задачи'}`;
}

// Обновление UI для неавторизованного пользователя
function updateUIForNoUser() {
    document.getElementById('user-info').style.display = 'none';
    document.getElementById('app-content').style.display = 'none';
    document.getElementById('auth-section').style.display = 'block';
    
    // Сбрасываем задачи
    tasks = [];
    renderTasks();
}

// Обновление статуса Firebase
function updateFirebaseStatus(connected) {
    const statusEl = document.getElementById('firebase-status-text');
    const syncStatusEl = document.getElementById('sync-status');
    
    if (connected) {
        statusEl.textContent = '✓ Подключен';
        statusEl.className = 'status-connected';
        if (currentUser) {
            syncStatusEl.textContent = 'Синхронизация активна';
        }
    } else {
        statusEl.textContent = '✗ Отключен';
        statusEl.className = 'status-disconnected';
        syncStatusEl.textContent = 'Синхронизация недоступна';
    }
}

// Загрузка задач из Firebase
function loadTasks() {
    if (!currentUser) {
        loadLocalTasks();
        return;
    }
    
    showLoading();
    
    // Подписываемся на изменения в коллекции задач пользователя
    db.collection('users').doc(currentUser.uid).collection('tasks')
        .orderBy('createdAt', 'desc')
        .onSnapshot((snapshot) => {
            tasks = [];
            snapshot.forEach((doc) => {
                const task = {
                    id: doc.id,
                    ...doc.data()
                };
                tasks.push(task);
            });
            
            hideLoading();
            renderTasks();
            updateStats();
            
            console.log('Задачи загружены:', tasks.length);
        }, (error) => {
            console.error('Ошибка загрузки задач:', error);
            hideLoading();
            
            // Пробуем загрузить локальные задачи
            loadLocalTasks();
            showNotification('Используются локальные данные', 'warning');
        });
}

// Загрузка локальных задач
function loadLocalTasks() {
    const localTasks = localStorage.getItem('local_tasks');
    if (localTasks) {
        try {
            tasks = JSON.parse(localTasks);
            renderTasks();
            updateStats();
        } catch (e) {
            console.error('Ошибка загрузки локальных задач:', e);
            tasks = [];
        }
    } else {
        tasks = [];
        renderTasks();
    }
}

// Сохранение локальных задач
function saveLocalTasks() {
    localStorage.setItem('local_tasks', JSON.stringify(tasks));
}

// Добавление новой задачи
function addTask() {
    const input = document.getElementById('new-task-input');
    const text = input.value.trim();
    
    if (!text) {
        showNotification('Введите текст задачи', 'warning');
        input.focus();
        return;
    }
    
    const newTask = {
        text: text,
        completed: false,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    };
    
    if (currentUser) {
        // Сохраняем в Firebase
        db.collection('users').doc(currentUser.uid).collection('tasks')
            .add(newTask)
            .then((docRef) => {
                console.log('Задача добавлена в Firebase:', docRef.id);
                input.value = '';
                input.focus();
                showNotification('Задача добавлена', 'success');
            })
            .catch((error) => {
                console.error('Ошибка добавления задачи:', error);
                showNotification('Ошибка при добавлении задачи', 'error');
            });
    } else {
        // Локальное сохранение
        newTask.id = Date.now().toString();
        newTask.createdAt = new Date().toISOString();
        newTask.updatedAt = new Date().toISOString();
        
        tasks.unshift(newTask);
        saveLocalTasks();
        renderTasks();
        updateStats();
        
        input.value = '';
        input.focus();
        showNotification('Задача добавлена (локально)', 'success');
    }
}

// Обновление статуса задачи
function toggleTask(taskId) {
    const taskIndex = tasks.findIndex(t => t.id === taskId);
    if (taskIndex === -1) return;
    
    const task = tasks[taskIndex];
    const newCompleted = !task.completed;
    
    if (currentUser) {
        // Обновляем в Firebase
        db.collection('users').doc(currentUser.uid).collection('tasks')
            .doc(taskId)
            .update({
                completed: newCompleted,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            })
            .then(() => {
                console.log('Задача обновлена в Firebase');
            })
            .catch((error) => {
                console.error('Ошибка обновления задачи:', error);
                showNotification('Ошибка при обновлении задачи', 'error');
            });
    } else {
        // Локальное обновление
        task.completed = newCompleted;
        task.updatedAt = new Date().toISOString();
        saveLocalTasks();
        renderTasks();
        updateStats();
    }
}

// Удаление задачи
function deleteTask(taskId) {
    if (!confirm('Удалить эту задачу?')) return;
    
    if (currentUser) {
        // Удаляем из Firebase
        db.collection('users').doc(currentUser.uid).collection('tasks')
            .doc(taskId)
            .delete()
            .then(() => {
                console.log('Задача удалена из Firebase');
                showNotification('Задача удалена', 'success');
            })
            .catch((error) => {
                console.error('Ошибка удаления задачи:', error);
                showNotification('Ошибка при удалении задачи', 'error');
            });
    } else {
        // Локальное удаление
        tasks = tasks.filter(t => t.id !== taskId);
        saveLocalTasks();
        renderTasks();
        updateStats();
        showNotification('Задача удалена (локально)', 'success');
    }
}

// Очистка выполненных задач
function clearCompletedTasks() {
    const completedTasks = tasks.filter(t => t.completed);
    if (completedTasks.length === 0) {
        showNotification('Нет выполненных задач для удаления', 'info');
        return;
    }
    
    if (!confirm(`Удалить ${completedTasks.length} выполненных задач?`)) return;
    
    if (currentUser) {
        // Удаляем из Firebase
        const batch = db.batch();
        completedTasks.forEach(task => {
            const taskRef = db.collection('users').doc(currentUser.uid).collection('tasks').doc(task.id);
            batch.delete(taskRef);
        });
        
        batch.commit()
            .then(() => {
                console.log('Выполненные задачи удалены из Firebase');
                showNotification(`Удалено ${completedTasks.length} задач`, 'success');
            })
            .catch((error) => {
                console.error('Ошибка удаления выполненных задач:', error);
                showNotification('Ошибка при удалении задач', 'error');
            });
    } else {
        // Локальное удаление
        tasks = tasks.filter(t => !t.completed);
        saveLocalTasks();
        renderTasks();
        updateStats();
        showNotification(`Удалено ${completedTasks.length} задач (локально)`, 'success');
    }
}

// Редактирование задачи
function editTask(taskId) {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    
    const newText = prompt('Редактировать задачу:', task.text);
    if (newText === null || newText.trim() === '') return;
    
    if (currentUser) {
        // Обновляем в Firebase
        db.collection('users').doc(currentUser.uid).collection('tasks')
            .doc(taskId)
            .update({
                text: newText.trim(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            })
            .then(() => {
                console.log('Задача отредактирована в Firebase');
                showNotification('Задача обновлена', 'success');
            })
            .catch((error) => {
                console.error('Ошибка редактирования задачи:', error);
                showNotification('Ошибка при обновлении задачи', 'error');
            });
    } else {
        // Локальное редактирование
        task.text = newText.trim();
        task.updatedAt = new Date().toISOString();
        saveLocalTasks();
        renderTasks();
        showNotification('Задача обновлена (локально)', 'success');
    }
}

// Отображение задач
function renderTasks() {
    const container = document.getElementById('tasks-container');
    
    if (tasks.length === 0) {
        container.innerHTML = '<p class="empty-state">Задач пока нет. Добавьте первую задачу!</p>';
        return;
    }
    
    // Фильтрация задач
    let filteredTasks = tasks;
    if (currentFilter === 'active') {
        filteredTasks = tasks.filter(t => !t.completed);
    } else if (currentFilter === 'completed') {
        filteredTasks = tasks.filter(t => t.completed);
    }
    
    if (filteredTasks.length === 0) {
        container.innerHTML = `<p class="empty-state">Нет задач для фильтра "${currentFilter}"</p>`;
        return;
    }
    
    // Генерация HTML для задач
    container.innerHTML = filteredTasks.map(task => `
        <div class="task-item fade-in" data-task-id="${task.id}">
            <input type="checkbox" 
                   class="task-checkbox" 
                   ${task.completed ? 'checked' : ''}
                   onchange="window.toggleTask('${task.id}')">
            <span class="task-text ${task.completed ? 'completed' : ''}">${escapeHtml(task.text)}</span>
            <div class="task-actions">
                <button class="task-btn edit" onclick="window.editTask('${task.id}')" title="Редактировать">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="task-btn delete" onclick="window.deleteTask('${task.id}')" title="Удалить">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `).join('');
}

// Обновление статистики
function updateStats() {
    const total = tasks.length;
    const completed = tasks.filter(t => t.completed).length;
    
    document.getElementById('total-tasks').textContent = total;
    document.getElementById('completed-tasks').textContent = completed;
}

// Вспомогательные функции
function showNotification(message, type = 'info') {
    // Удаляем старые уведомления
    const oldNotifications = document.querySelectorAll('.notification');
    oldNotifications.forEach(n => n.remove());
    
    // Создаем новое уведомление
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
    notification.style.boxShadow = '0 5px 20px rgba(0, 0, 0, 0.2)';
    
    // Добавляем цвет в зависимости от типа
    if (type === 'success') {
        notification.style.background = 'linear-gradient(135deg, #52c41a 0%, #389e0d 100%)';
    } else if (type === 'error') {
        notification.style.background = 'linear-gradient(135deg, #ff4d4f 0%, #cf1322 100%)';
    } else {
        notification.style.background = 'linear-gradient(135deg, #1890ff 0%, #096dd9 100%)';
    }
    
    document.body.appendChild(notification);
    
    // Удаляем уведомление через 5 секунд
    setTimeout(() => {
        if (notification.parentNode) {
            notification.style.animation = 'slideInRight 0.3s ease reverse';
            setTimeout(() => notification.remove(), 300);
        }
    }, 5000);
}

function showLoading() {
    const container = document.getElementById('tasks-container');
    container.innerHTML = `
        <div class="loading">
            <div class="loading-spinner"></div>
            <p>Загрузка задач...</p>
        </div>
    `;
}

function hideLoading() {
    // Загрузка скрывается автоматически при рендере задач
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Экспортируем функции в глобальную область видимости
window.toggleTask = toggleTask;
window.editTask = editTask;
window.deleteTask = deleteTask;
