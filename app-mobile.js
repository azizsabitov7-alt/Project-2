// Firebase конфигурация
const firebaseConfig = {
    apiKey: "AIzaSyBHAnTe-bEl5AZIk5y2iiAQNHCJRcvuRzA",
    authDomain: "sync-todo-app-e617f.firebaseapp.com",
    projectId: "sync-todo-app-e617f",
    storageBucket: "sync-todo-app-e617f.firebasestorage.app",
    messagingSenderId: "1077327103318",
    appId: "1:1077327103318:web:6b333882668ca2f26802f7",
    measurementId: "G-9Y6RDHWVH8"
};

// Инициализация
let currentUser = null;
let tasks = [];
let isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

// Запуск при загрузке
document.addEventListener('DOMContentLoaded', function() {
    console.log('📱 Мобильное приложение запускается...');
    console.log('User Agent:', navigator.userAgent);
    console.log('Is Mobile:', isMobile);
    
    try {
        firebase.initializeApp(firebaseConfig);
        console.log('✅ Firebase инициализирован');
    } catch (e) {
        console.log('ℹ️ Firebase уже инициализирован');
    }
    
    setupEventListeners();
    setupAuth();
});

// Настройка обработчиков
function setupEventListeners() {
    console.log('🛠️ Настройка обработчиков...');
    
    // Кнопка входа через Google
    const googleBtn = document.getElementById('google-login-btn');
    if (googleBtn) {
        googleBtn.addEventListener('click', handleGoogleLogin);
        googleBtn.addEventListener('touchstart', function(e) {
            e.preventDefault();
            handleGoogleLogin();
        }, {passive: false});
        console.log('✅ Кнопка Google настроена');
    }
    
    // Локальный режим
    const localBtn = document.getElementById('local-mode-btn');
    if (localBtn) {
        localBtn.addEventListener('click', enableLocalMode);
        localBtn.addEventListener('touchstart', function(e) {
            e.preventDefault();
            enableLocalMode();
        }, {passive: false});
    }
    
    // Кнопка добавления задачи
    const addBtn = document.getElementById('add-task-btn');
    if (addBtn) {
        addBtn.addEventListener('click', addTask);
        addBtn.addEventListener('touchstart', function(e) {
            e.preventDefault();
            addTask();
        }, {passive: false});
    }
    
    // Поле ввода
    const input = document.getElementById('new-task-input');
    if (input) {
        input.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') addTask();
        });
    }
    
    // Выход
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', signOut);
    }
    
    console.log('✅ Все обработчики настроены');
}

// Настройка аутентификации
function setupAuth() {
    console.log('🔐 Настройка аутентификации...');
    
    // Проверяем редирект после входа (для мобильных)
    firebase.auth().getRedirectResult().then((result) => {
        if (result.user) {
            console.log('✅ Успешный вход через редирект');
            handleAuthSuccess(result.user);
        }
    }).catch((error) => {
        console.error('❌ Ошибка редиректа:', error);
        showMessage('Ошибка входа: ' + error.message, 'error');
    });
    
    // Слушатель состояния аутентификации
    firebase.auth().onAuthStateChanged((user) => {
        console.log('🔄 Состояние аутентификации изменено:', user ? user.email : 'Нет пользователя');
        
        if (user) {
            handleAuthSuccess(user);
        } else {
            // Пользователь не вошел
            currentUser = null;
            tasks = [];
            
            // Показываем экран входа
            document.getElementById('auth-section').style.display = 'block';
            document.getElementById('app-content').style.display = 'none';
            document.getElementById('user-info').style.display = 'none';
            
            console.log('👤 Пользователь не авторизован');
        }
    });
}

// Обработка успешной аутентификации
function handleAuthSuccess(user) {
    console.log('✅ Пользователь авторизован:', user.email);
    
    currentUser = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName
    };
    
    // Сохраняем в localStorage
    localStorage.setItem('todo_user_mobile', JSON.stringify(currentUser));
    
    // Показываем интерфейс
    document.getElementById('user-email').textContent = user.email;
    document.getElementById('user-info').style.display = 'block';
    document.getElementById('app-content').style.display = 'block';
    document.getElementById('auth-section').style.display = 'none';
    
    // Загружаем задачи
    loadTasks();
    
    showMessage('✅ Успешный вход!', 'success');
}

// Вход через Google (с учетом мобильных устройств)
function handleGoogleLogin() {
    console.log('🔄 Попытка входа через Google...');
    console.log('Мобильное устройство:', isMobile);
    
    const provider = new firebase.auth.GoogleAuthProvider();
    
    // На мобильных устройствах используем редирект
    if (isMobile) {
        console.log('📱 Используем редирект для мобильного устройства');
        showMessage('Открывается окно входа...', 'info');
        
        // Сохраняем информацию о попытке входа
        localStorage.setItem('login_attempt', 'true');
        
        // Используем редирект
        firebase.auth().signInWithRedirect(provider);
        
    } else {
        // На ПК используем popup
        console.log('💻 Используем popup для ПК');
        
        firebase.auth().signInWithPopup(provider)
            .then((result) => {
                console.log('✅ Успешный вход через popup');
            })
            .catch((error) => {
                console.error('❌ Ошибка входа:', error);
                showMessage('Ошибка входа: ' + error.message, 'error');
            });
    }
}

// Локальный режим
function enableLocalMode() {
    console.log('📱 Включение локального режима');
    
    currentUser = {
        uid: 'local',
        email: 'Локальный пользователь'
    };
    
    localStorage.setItem('todo_user_mobile', JSON.stringify(currentUser));
    
    document.getElementById('user-email').textContent = 'Локальный пользователь';
    document.getElementById('user-info').style.display = 'block';
    document.getElementById('app-content').style.display = 'block';
    document.getElementById('auth-section').style.display = 'none';
    
    loadTasks();
    showMessage('📱 Локальный режим активирован', 'info');
}

// Выход
function signOut() {
    firebase.auth().signOut();
    localStorage.removeItem('todo_user_mobile');
    tasks = [];
    
    document.getElementById('auth-section').style.display = 'block';
    document.getElementById('app-content').style.display = 'none';
    
    showMessage('Вы вышли из системы', 'info');
}

// Проверяем сохраненного пользователя
function checkSavedUser() {
    const savedUser = localStorage.getItem('todo_user_mobile');
    if (savedUser) {
        try {
            const user = JSON.parse(savedUser);
            console.log('📱 Восстановлен сохраненный пользователь:', user.email);
            
            if (user.uid === 'local') {
                enableLocalMode();
            }
        } catch (e) {
            console.error('❌ Ошибка восстановления:', e);
        }
    }
}

// Загрузить задачи
function loadTasks() {
    if (!currentUser) return;
    
    console.log('📥 Загрузка задач для пользователя:', currentUser.uid);
    
    if (currentUser.uid === 'local') {
        // Локальные задачи
        const saved = localStorage.getItem('mobile_tasks_' + currentUser.uid);
        if (saved) {
            try {
                tasks = JSON.parse(saved);
                console.log('📱 Загружено локальных задач:', tasks.length);
            } catch (e) {
                tasks = [];
            }
        }
        renderTasks();
        updateStats();
        
    } else {
        // Задачи из Firebase
        firebase.firestore()
            .collection('users')
            .doc(currentUser.uid)
            .collection('tasks')
            .orderBy('createdAt', 'desc')
            .onSnapshot((snapshot) => {
                console.log('🔥 Получены данные из Firebase:', snapshot.size, 'задач');
                
                tasks = [];
                snapshot.forEach((doc) => {
                    const data = doc.data();
                    tasks.push({
                        id: doc.id,
                        text: data.text || '',
                        completed: data.completed || false,
                        createdAt: data.createdAt ? data.createdAt.toDate() : new Date()
                    });
                });
                
                renderTasks();
                updateStats();
                
            }, (error) => {
                console.error('❌ Ошибка Firebase:', error);
                showMessage('Ошибка загрузки задач', 'error');
            });
    }
}

// Добавить задачу
function addTask() {
    console.log('🎯 Добавление задачи...');
    
    const input = document.getElementById('new-task-input');
    if (!input) return;
    
    const text = input.value.trim();
    if (!text) {
        showMessage('Введите текст задачи', 'warning');
        return;
    }
    
    if (!currentUser) {
        showMessage('Сначала войдите в систему', 'error');
        return;
    }
    
    const taskData = {
        text: text,
        completed: false,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
    };
    
    if (currentUser.uid === 'local') {
        // Локальное сохранение
        const newTask = {
            id: Date.now().toString(),
            ...taskData,
            createdAt: new Date()
        };
        
        tasks.unshift(newTask);
        saveLocalTasks();
        renderTasks();
        updateStats();
        showMessage('✅ Задача добавлена (локально)', 'success');
        
    } else {
        // Сохранение в Firebase
        firebase.firestore()
            .collection('users')
            .doc(currentUser.uid)
            .collection('tasks')
            .add(taskData)
            .then(() => {
                showMessage('✅ Задача добавлена', 'success');
            })
            .catch((error) => {
                console.error('❌ Ошибка сохранения:', error);
                showMessage('Ошибка сохранения: ' + error.message, 'error');
            });
    }
    
    input.value = '';
    input.focus();
}

// Сохранить локальные задачи
function saveLocalTasks() {
    if (currentUser && currentUser.uid === 'local') {
        localStorage.setItem('mobile_tasks_' + currentUser.uid, JSON.stringify(tasks));
    }
}

// Отобразить задачи
function renderTasks() {
    const container = document.getElementById('tasks-container');
    if (!container) return;
    
    if (tasks.length === 0) {
        container.innerHTML = '<p style="text-align: center; padding: 40px; color: #666;">Задач пока нет</p>';
        return;
    }
    
    container.innerHTML = tasks.map(task => `
        <div style="
            padding: 15px;
            margin: 10px 0;
            background: white;
            border: 2px solid #e0e0e0;
            border-radius: 10px;
            display: flex;
            align-items: center;
            gap: 15px;
        ">
            <input type="checkbox" 
                   style="width: 24px; height: 24px;"
                   ${task.completed ? 'checked' : ''}
                   onchange="toggleTask('${task.id}')">
            <span style="
                flex: 1;
                ${task.completed ? 'text-decoration: line-through; color: #888;' : ''}
                font-size: 16px;
            ">
                ${task.text || ''}
            </span>
            <button onclick="deleteTask('${task.id}')" style="
                background: #ff4444;
                color: white;
                border: none;
                padding: 8px 12px;
                border-radius: 5px;
                cursor: pointer;
            ">
                Удалить
            </button>
        </div>
    `).join('');
}

// Переключить статус задачи
async function toggleTask(taskId) {
    if (!currentUser) return;
    
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    
    const newCompleted = !task.completed;
    
    if (currentUser.uid === 'local') {
        task.completed = newCompleted;
        saveLocalTasks();
        renderTasks();
        updateStats();
    } else {
        try {
            await firebase.firestore()
                .collection('users')
                .doc(currentUser.uid)
                .collection('tasks')
                .doc(taskId)
                .update({ completed: newCompleted });
        } catch (error) {
            console.error('❌ Ошибка обновления:', error);
        }
    }
}

// Удалить задачу
async function deleteTask(taskId) {
    if (!confirm('Удалить задачу?')) return;
    
    if (!currentUser) return;
    
    if (currentUser.uid === 'local') {
        tasks = tasks.filter(t => t.id !== taskId);
        saveLocalTasks();
        renderTasks();
        updateStats();
        showMessage('🗑️ Задача удалена', 'info');
    } else {
        try {
            await firebase.firestore()
                .collection('users')
                .doc(currentUser.uid)
                .collection('tasks')
                .doc(taskId)
                .delete();
            showMessage('🗑️ Задача удалена', 'info');
        } catch (error) {
            console.error('❌ Ошибка удаления:', error);
        }
    }
}

// Обновить статистику
function updateStats() {
    const total = tasks.length;
    const completed = tasks.filter(t => t.completed).length;
    
    const totalEl = document.getElementById('total-tasks');
    const completedEl = document.getElementById('completed-tasks');
    
    if (totalEl) totalEl.textContent = total;
    if (completedEl) completedEl.textContent = completed;
}

// Показать сообщение
function showMessage(text, type = 'info') {
    console.log(`💬 ${type}: ${text}`);
    
    // Для мобильных лучше использовать alert
    if (isMobile) {
        alert(text);
        return;
    }
    
    // Для ПК - красивое уведомление
    const notification = document.createElement('div');
    notification.textContent = text;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 25px;
        border-radius: 8px;
        color: white;
        font-weight: 500;
        z-index: 1000;
        background: ${type === 'error' ? '#dc3545' : 
                    type === 'success' ? '#28a745' : 
                    type === 'warning' ? '#ffc107' : '#17a2b8'};
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Глобальные функции
window.toggleTask = toggleTask;
window.deleteTask = deleteTask;

// Проверяем сохраненного пользователя при загрузке
checkSavedUser();

console.log('🚀 Мобильное приложение готово! Текущий пользователь:', currentUser ? currentUser.email : 'Нет');
