// ПРОСТОЙ ИСПРАВЛЕННЫЙ КОД - ВСТАВЬТЕ ВЕСЬ ЭТОТ ФАЙЛ:

// Конфигурация Firebase
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
let currentFilter = 'all';

// Инициализация при загрузке
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM загружен');
    
    try {
        // Инициализируем Firebase
        firebase.initializeApp(firebaseConfig);
        console.log('Firebase инициализирован');
    } catch (error) {
        console.log('Firebase уже инициализирован или ошибка:', error);
    }
    
    // Настройка обработчиков событий
    setupEventListeners();
    
    // Проверяем, есть ли сохраненный пользователь
    checkSavedUser();
});

// Настройка всех обработчиков
function setupEventListeners() {
    console.log('Настройка обработчиков...');
    
    // 1. Кнопка "Добавить"
    const addButton = document.getElementById('add-task-btn');
    const taskInput = document.getElementById('new-task-input');
    
    if (addButton) {
        addButton.addEventListener('click', addTask);
        console.log('Кнопка "Добавить" найдена и настроена');
    } else {
        console.error('Кнопка "Добавить" не найдена! ID: add-task-btn');
    }
    
    if (taskInput) {
        taskInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                addTask();
            }
        });
        console.log('Поле ввода найдено и настроено');
    }
    
    // 2. Кнопки входа
    const googleBtn = document.getElementById('google-login-btn');
    const localBtn = document.getElementById('local-mode-btn');
    
    if (googleBtn) {
        googleBtn.addEventListener('click', signInWithGoogle);
    }
    
    if (localBtn) {
        localBtn.addEventListener('click', enableLocalMode);
    }
    
    // 3. Фильтры
    const filterButtons = document.querySelectorAll('.filter-btn');
    filterButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            // Убираем активный класс у всех
            filterButtons.forEach(b => b.classList.remove('active'));
            // Добавляем текущему
            this.classList.add('active');
            currentFilter = this.dataset.filter;
            renderTasks();
        });
    });
    
    // 4. Очистка выполненных
    const clearBtn = document.getElementById('clear-completed-btn');
    if (clearBtn) {
        clearBtn.addEventListener('click', clearCompletedTasks);
    }
    
    // 5. Выход
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', signOut);
    }
}

// Проверка сохраненного пользователя
function checkSavedUser() {
    const savedUser = localStorage.getItem('todo_user');
    if (savedUser) {
        try {
            currentUser = JSON.parse(savedUser);
            console.log('Восстановлен пользователь:', currentUser.email);
            showUserInfo();
            loadTasks();
        } catch (e) {
            console.error('Ошибка восстановления пользователя:', e);
        }
    }
}

// Вход через Google
function signInWithGoogle() {
    console.log('Попытка входа через Google...');
    
    const provider = new firebase.auth.GoogleAuthProvider();
    
    firebase.auth().signInWithPopup(provider)
        .then((result) => {
            console.log('Успешный вход:', result.user.email);
            currentUser = {
                uid: result.user.uid,
                email: result.user.email,
                displayName: result.user.displayName
            };
            
            // Сохраняем в localStorage
            localStorage.setItem('todo_user', JSON.stringify(currentUser));
            
            showUserInfo();
            loadTasks();
            
            showMessage('Успешный вход!', 'success');
        })
        .catch((error) => {
            console.error('Ошибка входа:', error);
            showMessage('Ошибка входа: ' + error.message, 'error');
        });
}

// Локальный режим
function enableLocalMode() {
    console.log('Включение локального режима');
    
    currentUser = {
        uid: 'local',
        email: 'Локальный пользователь'
    };
    
    // Показываем основной интерфейс
    document.getElementById('app-content').style.display = 'block';
    document.getElementById('auth-section').style.display = 'none';
    
    // Загружаем локальные задачи
    loadLocalTasks();
    
    showMessage('Локальный режим активирован', 'info');
}

// Показать информацию пользователя
function showUserInfo() {
    if (!currentUser) return;
    
    const userEmail = document.getElementById('user-email');
    const userInfo = document.getElementById('user-info');
    const appContent = document.getElementById('app-content');
    const authSection = document.getElementById('auth-section');
    
    if (userEmail) userEmail.textContent = currentUser.email;
    if (userInfo) userInfo.style.display = 'block';
    if (appContent) appContent.style.display = 'block';
    if (authSection) authSection.style.display = 'none';
}

// Выход
function signOut() {
    if (firebase.auth) {
        firebase.auth().signOut();
    }
    currentUser = null;
    localStorage.removeItem('todo_user');
    
    document.getElementById('app-content').style.display = 'none';
    document.getElementById('auth-section').style.display = 'block';
    
    showMessage('Вы вышли', 'info');
}

// ДОБАВИТЬ ЗАДАЧУ - ЭТО ГЛАВНАЯ ФУНКЦИЯ
function addTask() {
    console.log('Функция addTask вызвана');
    
    const input = document.getElementById('new-task-input');
    if (!input) {
        console.error('Поле ввода не найдено!');
        return;
    }
    
    const text = input.value.trim();
    console.log('Текст задачи:', text);
    
    if (!text) {
        showMessage('Введите текст задачи!', 'warning');
        return;
    }
    
    // Создаем задачу
    const newTask = {
        id: Date.now().toString(),
        text: text,
        completed: false,
        createdAt: new Date().toISOString()
    };
    
    console.log('Создана задача:', newTask);
    
    // Добавляем в массив
    tasks.unshift(newTask);
    
    // Сохраняем
    saveTasks();
    
    // Отображаем
    renderTasks();
    updateStats();
    
    // Очищаем поле ввода
    input.value = '';
    input.focus();
    
    showMessage('Задача добавлена!', 'success');
}

// Загрузить задачи
function loadTasks() {
    if (currentUser && currentUser.uid !== 'local') {
        loadTasksFromFirebase();
    } else {
        loadLocalTasks();
    }
}

// Загрузить из Firebase
function loadTasksFromFirebase() {
    if (!currentUser || !firebase.firestore) return;
    
    console.log('Загрузка из Firebase для пользователя:', currentUser.uid);
    
    firebase.firestore()
        .collection('users')
        .doc(currentUser.uid)
        .collection('tasks')
        .orderBy('createdAt', 'desc')
        .get()
        .then(snapshot => {
            tasks = [];
            snapshot.forEach(doc => {
                tasks.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            renderTasks();
            updateStats();
        })
        .catch(error => {
            console.error('Ошибка загрузки из Firebase:', error);
            loadLocalTasks();
        });
}

// Загрузить локальные задачи
function loadLocalTasks() {
    const saved = localStorage.getItem('local_tasks');
    if (saved) {
        try {
            tasks = JSON.parse(saved);
            console.log('Загружено локальных задач:', tasks.length);
        } catch (e) {
            console.error('Ошибка загрузки локальных задач:', e);
            tasks = [];
        }
    } else {
        tasks = [];
    }
    renderTasks();
    updateStats();
}

// Сохранить задачи
function saveTasks() {
    if (currentUser && currentUser.uid !== 'local') {
        saveToFirebase();
    } else {
        saveLocalTasks();
    }
}

// Сохранить в Firebase
function saveToFirebase() {
    // Для Firebase нужно сохранять каждую задачу отдельно
    // Пока просто сохраняем локально
    saveLocalTasks();
}

// Сохранить локально
function saveLocalTasks() {
    localStorage.setItem('local_tasks', JSON.stringify(tasks));
    console.log('Задачи сохранены локально:', tasks.length);
}

// Переключить статус задачи
function toggleTask(taskId) {
    console.log('Переключение задачи:', taskId);
    
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    
    task.completed = !task.completed;
    saveTasks();
    renderTasks();
    updateStats();
}

// Удалить задачу
function deleteTask(taskId) {
    if (!confirm('Удалить эту задачу?')) return;
    
    tasks = tasks.filter(t => t.id !== taskId);
    saveTasks();
    renderTasks();
    updateStats();
    
    showMessage('Задача удалена', 'success');
}

// Очистить выполненные
function clearCompletedTasks() {
    const completedCount = tasks.filter(t => t.completed).length;
    
    if (completedCount === 0) {
        showMessage('Нет выполненных задач', 'info');
        return;
    }
    
    if (!confirm(`Удалить ${completedCount} выполненных задач?`)) return;
    
    tasks = tasks.filter(t => !t.completed);
    saveTasks();
    renderTasks();
    updateStats();
    
    showMessage(`Удалено ${completedCount} задач`, 'success');
}

// ОТОБРАЗИТЬ ЗАДАЧИ - ВАЖНАЯ ФУНКЦИЯ
function renderTasks() {
    console.log('renderTasks вызван, всего задач:', tasks.length);
    
    const container = document.getElementById('tasks-container');
    if (!container) {
        console.error('Контейнер задач не найден! ID: tasks-container');
        return;
    }
    
    // Если задач нет
    if (tasks.length === 0) {
        container.innerHTML = '<p class="empty-state">Задач пока нет. Добавьте первую задачу!</p>';
        return;
    }
    
    // Фильтрация
    let filteredTasks = tasks;
    if (currentFilter === 'active') {
        filteredTasks = tasks.filter(t => !t.completed);
    } else if (currentFilter === 'completed') {
        filteredTasks = tasks.filter(t => t.completed);
    }
    
    // Если после фильтрации нет задач
    if (filteredTasks.length === 0) {
        container.innerHTML = `<p class="empty-state">Нет задач для фильтра "${currentFilter}"</p>`;
        return;
    }
    
    // Генерируем HTML
    const tasksHTML = filteredTasks.map(task => `
        <div class="task-item">
            <input type="checkbox" 
                   class="task-checkbox" 
                   ${task.completed ? 'checked' : ''}
                   onchange="toggleTask('${task.id}')">
            <span class="task-text ${task.completed ? 'completed' : ''}">
                ${task.text}
            </span>
            <div class="task-actions">
                <button class="task-btn delete" onclick="deleteTask('${task.id}')" title="Удалить">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `).join('');
    
    container.innerHTML = tasksHTML;
    console.log('Задачи отображены:', filteredTasks.length);
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
    console.log('Сообщение:', text);
    
    // Простой alert для тестирования
    alert(text);
    
    // Или можно раскомментировать для красивого уведомления:
    /*
    const notification = document.createElement('div');
    notification.textContent = text;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px;
        background: ${type === 'error' ? '#f44336' : type === 'success' ? '#4caf50' : '#2196f3'};
        color: white;
        border-radius: 5px;
        z-index: 1000;
    `;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 3000);
    */
}

// Сделать функции глобальными
window.toggleTask = toggleTask;
window.deleteTask = deleteTask;

console.log('app.js загружен и готов!');
