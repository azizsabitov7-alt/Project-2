// Тестовая функция для проверки нажатий
function testTap() {
    alert('✅ Кнопка работает!');
    console.log('✅ Tap detected');
    return true;
}

// На все кнопки повесьте эту функцию временно
document.querySelectorAll('button').forEach(btn => {
    btn.addEventListener('click', testTap);
    btn.addEventListener('touchstart', testTap);
});

// Простой Todo App для мобильных устройств
console.log('📱 Мобильное приложение загружается...');

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

// Глобальные переменные
let currentUser = null;
let tasks = [];

// Инициализация при загрузке
document.addEventListener('DOMContentLoaded', function() {
    console.log('✅ DOM готов');
    
    try {
        firebase.initializeApp(firebaseConfig);
        console.log('✅ Firebase инициализирован');
    } catch (e) {
        console.log('ℹ️ Firebase уже инициализирован');
    }
    
    // Настройка обработчиков для мобильных
    setupMobileEventListeners();
    
    // Проверяем аутентификацию
    setupAuth();
});

// Настройка обработчиков для мобильных
function setupMobileEventListeners() {
    console.log('🛠️ Настройка мобильных обработчиков...');
    
    // 1. Кнопка "Добавить" - используем touchstart для мобильных
    const addBtn = document.getElementById('add-task-btn');
    if (addBtn) {
        // Добавляем оба обработчика
        addBtn.addEventListener('click', addTask);
        addBtn.addEventListener('touchstart', function(e) {
            e.preventDefault(); // Предотвращаем двойное срабатывание
            addTask();
        }, {passive: false});
        
        // Стиль для лучшего нажатия на мобильных
        addBtn.style.cssText += 'padding: 18px 25px; font-size: 18px;';
        console.log('✅ Кнопка "Добавить" настроена');
    }
    
    // 2. Поле ввода
    const input = document.getElementById('new-task-input');
    if (input) {
        input.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') addTask();
        });
        
        // Увеличиваем размер для мобильных
        input.style.cssText += 'padding: 18px; font-size: 18px;';
    }
    
    // 3. Кнопки входа
    const googleBtn = document.getElementById('google-login-btn');
    if (googleBtn) {
        googleBtn.addEventListener('click', signInWithGoogle);
        googleBtn.addEventListener('touchstart', function(e) {
            e.preventDefault();
            signInWithGoogle();
        }, {passive: false});
        
        googleBtn.style.cssText += 'padding: 20px; font-size: 18px; margin: 10px 0;';
    }
    
    const localBtn = document.getElementById('local-mode-btn');
    if (localBtn) {
        localBtn.addEventListener('click', enableLocalMode);
        localBtn.addEventListener('touchstart', function(e) {
            e.preventDefault();
            enableLocalMode();
        }, {passive: false});
        
        localBtn.style.cssText += 'padding: 20px; font-size: 18px; margin: 10px 0;';
    }
    
    // 4. Фильтры - увеличиваем кнопки
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            renderTasks();
        });
        btn.style.cssText += 'padding: 15px 25px; font-size: 16px; margin: 5px;';
    });
    
    // 5. Кнопка выхода
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', signOut);
        logoutBtn.addEventListener('touchstart', function(e) {
            e.preventDefault();
            signOut();
        }, {passive: false});
    }
    
    console.log('✅ Все обработчики настроены');
}

// Настройка аутентификации
function setupAuth() {
    firebase.auth().onAuthStateChanged((user) => {
        console.log('👤 Статус аутентификации:', user ? 'Вошёл' : 'Не вошёл');
        
        if (user) {
            currentUser = {
                uid: user.uid,
                email: user.email
            };
            
            // Показываем интерфейс
            document.getElementById('user-email').textContent = user.email;
            document.getElementById('user-info').style.display = 'block';
            document.getElementById('app-content').style.display = 'block';
            document.getElementById('auth-section').style.display = 'none';
            
            // Загружаем задачи
            loadTasks();
            
            showMobileMessage('✅ Вход выполнен!', 'success');
            
        } else {
            currentUser = null;
            document.getElementById('auth-section').style.display = 'block';
            document.getElementById('app-content').style.display = 'none';
        }
    });
}

// Вход через Google
function signInWithGoogle() {
    console.log('🔄 Попытка входа через Google...');
    
    const provider = new firebase.auth.GoogleAuthProvider();
    
    // На мобильных лучше использовать redirect
    if (/iPhone|iPad|iPod|Android/i.test(navigator.userAgent)) {
        firebase.auth().signInWithRedirect(provider);
    } else {
        firebase.auth().signInWithPopup(provider).catch(error => {
            console.error('❌ Ошибка входа:', error);
            showMobileMessage('Ошибка входа', 'error');
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
    
    document.getElementById('user-email').textContent = 'Локальный пользователь';
    document.getElementById('user-info').style.display = 'block';
    document.getElementById('app-content').style.display = 'block';
    document.getElementById('auth-section').style.display = 'none';
    
    loadTasks();
    showMobileMessage('📱 Локальный режим', 'info');
}

// Выход
function signOut() {
    firebase.auth().signOut();
    tasks = [];
    renderTasks();
}

// ДОБАВИТЬ ЗАДАЧУ
function addTask() {
    console.log('🎯 Добавление задачи...');
    
    const input = document.getElementById('new-task-input');
    if (!input) {
        console.error('❌ Поле ввода не найдено');
        return;
    }
    
    const text = input.value.trim();
    if (!text) {
        showMobileMessage('✏️ Введите текст задачи', 'warning');
        return;
    }
    
    if (!currentUser) {
        console.error('❌ Нет пользователя');
        return;
    }
    
    // Создаем задачу
    const newTask = {
        text: text,
        completed: false,
        createdAt: new Date().toISOString()
    };
    
    if (currentUser.uid === 'local') {
        // Локальное сохранение
        newTask.id = Date.now().toString();
        tasks.unshift(newTask);
        saveLocalTasks();
        renderTasks();
        updateStats();
        showMobileMessage('✅ Задача добавлена', 'success');
        
    } else {
        // Сохранение в Firebase
        firebase.firestore()
            .collection('users')
            .doc(currentUser.uid)
            .collection('tasks')
            .add({
                ...newTask,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            })
            .then(() => {
                showMobileMessage('✅ Задача добавлена', 'success');
            })
            .catch(error => {
                console.error('❌ Ошибка Firebase:', error);
                showMobileMessage('❌ Ошибка сохранения', 'error');
            });
    }
    
    // Очищаем поле ввода
    input.value = '';
    input.focus();
}

// Загрузить задачи
function loadTasks() {
    if (!currentUser) return;
    
    if (currentUser.uid === 'local') {
        // Локальные задачи
        const saved = localStorage.getItem('mobile_tasks');
        if (saved) {
            try {
                tasks = JSON.parse(saved);
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
                tasks = [];
                snapshot.forEach((doc) => {
                    tasks.push({
                        id: doc.id,
                        ...doc.data()
                    });
                });
                renderTasks();
                updateStats();
            });
    }
}

// Сохранить локальные задачи
function saveLocalTasks() {
    localStorage.setItem('mobile_tasks', JSON.stringify(tasks));
}

// ОТОБРАЗИТЬ ЗАДАЧИ
function renderTasks() {
    const container = document.getElementById('tasks-container');
    if (!container) {
        console.error('❌ Контейнер не найден');
        return;
    }
    
    if (tasks.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #666; padding: 40px;">Задач пока нет</p>';
        return;
    }
    
    // Увеличиваем размер для мобильных
    container.innerHTML = tasks.map(task => `
        <div style="
            padding: 20px;
            margin: 10px 0;
            background: #f8f9fa;
            border-radius: 12px;
            border: 2px solid #e9ecef;
            display: flex;
            align-items: center;
            gap: 15px;
            font-size: 18px;
            min-height: 60px;
        ">
            <input type="checkbox" 
                   style="width: 28px; height: 28px;"
                   ${task.completed ? 'checked' : ''}
                   onchange="toggleTask('${task.id}')">
            <span style="
                flex: 1;
                ${task.completed ? 'text-decoration: line-through; color: #6c757d;' : ''}
                word-break: break-word;
            ">
                ${task.text || ''}
            </span>
            <button onclick="deleteTask('${task.id}')" style="
                background: #dc3545;
                color: white;
                border: none;
                padding: 10px 15px;
                border-radius: 6px;
                font-size: 16px;
                min-width: 50px;
            ">
                ✕
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
        showMobileMessage('🗑️ Задача удалена', 'info');
    } else {
        try {
            await firebase.firestore()
                .collection('users')
                .doc(currentUser.uid)
                .collection('tasks')
                .doc(taskId)
                .delete();
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

// Сообщение для мобильных
function showMobileMessage(text, type = 'info') {
    console.log(`💬 ${text}`);
    
    // Создаем уведомление
    const notification = document.createElement('div');
    notification.textContent = text;
    notification.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        padding: 20px 30px;
        border-radius: 15px;
        color: white;
        font-size: 18px;
        font-weight: 600;
        z-index: 10000;
        text-align: center;
        background: ${type === 'error' ? '#dc3545' : 
                    type === 'success' ? '#28a745' : 
                    type === 'warning' ? '#ffc107' : '#17a2b8'};
        box-shadow: 0 10px 30px rgba(0,0,0,0.3);
        max-width: 80%;
        word-wrap: break-word;
    `;
    
    document.body.appendChild(notification);
    
    // Автоматически скрываем
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transition = 'opacity 0.5s';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 500);
    }, 2000);
}

// Глобальные функции
window.toggleTask = toggleTask;
window.deleteTask = deleteTask;

console.log('🚀 Мобильное приложение готово!');
