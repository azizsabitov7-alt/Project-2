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
    console.log('✅ DOM загружен');
    
    try {
        // Инициализируем Firebase
        firebase.initializeApp(firebaseConfig);
        console.log('✅ Firebase инициализирован');
    } catch (error) {
        console.log('ℹ️ Firebase уже инициализирован');
    }
    
    // Настройка обработчиков событий
    setupEventListeners();
    
    // Проверяем аутентификацию
    initAuth();
});

// Инициализация аутентификации
function initAuth() {
    firebase.auth().onAuthStateChanged((user) => {
        console.log('🔄 Состояние аутентификации:', user ? user.email : 'Нет пользователя');
        
        if (user) {
            currentUser = {
                uid: user.uid,
                email: user.email,
                displayName: user.displayName
            };
            
            localStorage.setItem('todo_user', JSON.stringify(currentUser));
            showUserInfo();
            loadTasksFromFirebase();
            
        } else {
            currentUser = null;
            localStorage.removeItem('todo_user');
            document.getElementById('auth-section').style.display = 'block';
            document.getElementById('app-content').style.display = 'none';
        }
    });
}

// Настройка обработчиков
function setupEventListeners() {
    console.log('🛠️ Настройка обработчиков...');
    
    // 1. Кнопка "Добавить"
    const addButton = document.getElementById('add-task-btn');
    const taskInput = document.getElementById('new-task-input');
    
    if (addButton) {
        console.log('✅ Кнопка "Добавить" найдена');
        addButton.addEventListener('click', addTask);
    } else {
        console.error('❌ Кнопка "Добавить" не найдена! Проверьте HTML');
    }
    
    if (taskInput) {
        taskInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') addTask();
        });
    }
    
    // 2. Кнопки фильтров
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            currentFilter = this.dataset.filter;
            renderTasks();
        });
    });
    
    // 3. Очистка выполненных
    const clearBtn = document.getElementById('clear-completed-btn');
    if (clearBtn) {
        clearBtn.addEventListener('click', clearCompletedTasks);
    }
    
    // 4. Выход
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => firebase.auth().signOut());
    }
}

// Показать информацию пользователя
function showUserInfo() {
    console.log('👤 Показываем информацию пользователя');
    
    const userEmail = document.getElementById('user-email');
    const userInfo = document.getElementById('user-info');
    const appContent = document.getElementById('app-content');
    const authSection = document.getElementById('auth-section');
    
    if (userEmail) {
        userEmail.textContent = currentUser.email;
        console.log('✅ Email установлен:', currentUser.email);
    }
    
    if (userInfo) userInfo.style.display = 'block';
    if (appContent) appContent.style.display = 'block';
    if (authSection) authSection.style.display = 'none';
    
    console.log('✅ Интерфейс пользователя показан');
}

// Загрузить задачи из Firebase
function loadTasksFromFirebase() {
    if (!currentUser) {
        console.log('⚠️ Нет пользователя для загрузки задач');
        return;
    }
    
    console.log('📥 Загрузка задач из Firebase для:', currentUser.uid);
    
    // Подписываемся на обновления в реальном времени
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
            
            console.log('✅ Задачи загружены:', tasks);
            renderTasks();
            updateStats();
            
        }, (error) => {
            console.error('❌ Ошибка загрузки из Firebase:', error);
            showMessage('Ошибка загрузки задач', 'error');
        });
}

// ДОБАВИТЬ ЗАДАЧУ
async function addTask() {
    console.log('🎯 Функция addTask вызвана');
    
    const input = document.getElementById('new-task-input');
    if (!input) {
        console.error('❌ Поле ввода не найдено!');
        return;
    }
    
    const text = input.value.trim();
    console.log('📝 Текст задачи:', text);
    
    if (!text) {
        showMessage('Введите текст задачи!', 'warning');
        return;
    }
    
    if (!currentUser) {
        console.error('❌ Нет пользователя!');
        return;
    }
    
    const taskData = {
        text: text,
        completed: false,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    };
    
    try {
        console.log('💾 Сохранение задачи в Firebase...');
        
        // Сохраняем в Firebase
        await firebase.firestore()
            .collection('users')
            .doc(currentUser.uid)
            .collection('tasks')
            .add(taskData);
        
        console.log('✅ Задача сохранена в Firebase');
        
        // Очищаем поле ввода
        input.value = '';
        input.focus();
        
        showMessage('Задача добавлена!', 'success');
        
    } catch (error) {
        console.error('❌ Ошибка сохранения:', error);
        showMessage('Ошибка при добавлении задачи: ' + error.message, 'error');
    }
}

// ОТОБРАЗИТЬ ЗАДАЧИ
function renderTasks() {
    console.log('🎨 renderTasks вызван, всего задач:', tasks.length);
    
    const container = document.getElementById('tasks-container');
    if (!container) {
        console.error('❌ Контейнер задач не найден!');
        return;
    }
    
    if (tasks.length === 0) {
        container.innerHTML = '<p class="empty-state">Задач пока нет. Добавьте первую задачу!</p>';
        console.log('📭 Нет задач для отображения');
        return;
    }
    
    // Фильтрация
    let filteredTasks = tasks;
    if (currentFilter === 'active') {
        filteredTasks = tasks.filter(t => !t.completed);
    } else if (currentFilter === 'completed') {
        filteredTasks = tasks.filter(t => t.completed);
    }
    
    console.log('🔍 После фильтрации:', filteredTasks.length, 'задач');
    
    // Генерируем HTML
    const tasksHTML = filteredTasks.map(task => `
        <div class="task-item" style="
            padding: 12px;
            margin: 8px 0;
            background: #f8f9fa;
            border-radius: 8px;
            border: 1px solid #e9ecef;
            display: flex;
            align-items: center;
            gap: 12px;
        ">
            <input type="checkbox" 
                   style="width: 20px; height: 20px;"
                   ${task.completed ? 'checked' : ''}
                   onchange="toggleTask('${task.id}')">
            <span style="
                flex: 1;
                ${task.completed ? 'text-decoration: line-through; color: #6c757d;' : ''}
            ">
                ${task.text || 'Без названия'}
            </span>
            <button onclick="deleteTask('${task.id}')" style="
                background: #dc3545;
                color: white;
                border: none;
                padding: 6px 12px;
                border-radius: 4px;
                cursor: pointer;
            ">
                Удалить
            </button>
        </div>
    `).join('');
    
    container.innerHTML = tasksHTML;
    console.log('✅ Задачи отображены');
}

// Переключить статус задачи
async function toggleTask(taskId) {
    console.log('🔄 Переключение задачи:', taskId);
    
    if (!currentUser) return;
    
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    
    const newCompleted = !task.completed;
    
    try {
        await firebase.firestore()
            .collection('users')
            .doc(currentUser.uid)
            .collection('tasks')
            .doc(taskId)
            .update({
                completed: newCompleted,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        
        console.log('✅ Статус задачи обновлен в Firebase');
        
    } catch (error) {
        console.error('❌ Ошибка обновления:', error);
        showMessage('Ошибка обновления задачи', 'error');
    }
}

// Удалить задачу
async function deleteTask(taskId) {
    console.log('🗑️ Удаление задачи:', taskId);
    
    if (!confirm('Удалить эту задачу?')) return;
    
    if (!currentUser) return;
    
    try {
        await firebase.firestore()
            .collection('users')
            .doc(currentUser.uid)
            .collection('tasks')
            .doc(taskId)
            .delete();
        
        console.log('✅ Задача удалена из Firebase');
        showMessage('Задача удалена', 'success');
        
    } catch (error) {
        console.error('❌ Ошибка удаления:', error);
        showMessage('Ошибка удаления задачи', 'error');
    }
}

// Очистить выполненные
async function clearCompletedTasks() {
    console.log('🧹 Очистка выполненных задач');
    
    const completedTasks = tasks.filter(t => t.completed);
    if (completedTasks.length === 0) {
        showMessage('Нет выполненных задач', 'info');
        return;
    }
    
    if (!confirm(`Удалить ${completedTasks.length} выполненных задач?`)) return;
    
    if (!currentUser) return;
    
    try {
        const batch = firebase.firestore().batch();
        completedTasks.forEach(task => {
            const taskRef = firebase.firestore()
                .collection('users')
                .doc(currentUser.uid)
                .collection('tasks')
                .doc(task.id);
            batch.delete(taskRef);
        });
        
        await batch.commit();
        console.log(`✅ Удалено ${completedTasks.length} выполненных задач`);
        showMessage(`Удалено ${completedTasks.length} задач`, 'success');
        
    } catch (error) {
        console.error('❌ Ошибка очистки:', error);
        showMessage('Ошибка при удалении задач', 'error');
    }
}

// Обновить статистику
function updateStats() {
    const total = tasks.length;
    const completed = tasks.filter(t => t.completed).length;
    
    const totalEl = document.getElementById('total-tasks');
    const completedEl = document.getElementById('completed-tasks');
    
    if (totalEl) {
        totalEl.textContent = total;
        console.log('📊 Всего задач:', total);
    }
    
    if (completedEl) {
        completedEl.textContent = completed;
        console.log('✅ Выполнено:', completed);
    }
}

// Показать сообщение
function showMessage(text, type = 'info') {
    console.log(`💬 ${type.toUpperCase()}: ${text}`);
    
    // Создаем уведомление
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
        animation: slideIn 0.3s ease;
        background: ${type === 'error' ? '#dc3545' : 
                    type === 'success' ? '#28a745' : 
                    type === 'warning' ? '#ffc107' : '#17a2b8'};
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transition = 'opacity 0.3s';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Глобальные функции
window.toggleTask = toggleTask;
window.deleteTask = deleteTask;

console.log('🚀 app.js загружен и готов к работе!');
