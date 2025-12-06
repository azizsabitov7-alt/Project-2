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

// Инициализация
let user = null;
let tasks = [];
let filter = 'all';

// Запуск при загрузке
window.onload = function() {
    firebase.initializeApp(firebaseConfig);
    initAuth();
    setupListeners();
    loadLocalTasks(); // Загружаем локальные на всякий случай
};

// Авторизация
function initAuth() {
    firebase.auth().onAuthStateChanged(u => {
        if (u) {
            user = {uid: u.uid, email: u.email};
            document.getElementById('userEmail').textContent = u.email;
            document.getElementById('auth').style.display = 'none';
            document.getElementById('app').style.display = 'block';
            loadTasksFromFirebase();
        } else {
            user = null;
            document.getElementById('auth').style.display = 'block';
            document.getElementById('app').style.display = 'none';
        }
    });
}

// Настройка обработчиков
function setupListeners() {
    // Вход
    document.getElementById('loginGoogle').onclick = () => {
        firebase.auth().signInWithPopup(new firebase.auth.GoogleAuthProvider());
    };
    
    document.getElementById('loginLocal').onclick = () => {
        user = {uid: 'local', email: 'Локальный пользователь'};
        document.getElementById('userEmail').textContent = 'Локальный пользователь';
        document.getElementById('auth').style.display = 'none';
        document.getElementById('app').style.display = 'block';
        loadLocalTasks();
    };
    
    // Выход
    document.getElementById('logout').onclick = () => {
        firebase.auth().signOut();
        tasks = [];
        renderTasks();
    };
    
    // Добавление задачи
    document.getElementById('addTask').onclick = addTask;
    document.getElementById('taskInput').onkeypress = (e) => {
        if (e.key === 'Enter') addTask();
    };
    
    // Фильтры
    document.querySelectorAll('.filter').forEach(btn => {
        btn.onclick = function() {
            filter = this.dataset.filter;
            document.querySelectorAll('.filter').forEach(b => b.style.background = '');
            this.style.background = '#ddd';
            renderTasks();
        };
    });
    
    // Очистка выполненных
    document.getElementById('clearCompleted').onclick = clearCompleted;
}

// Добавить задачу
async function addTask() {
    const input = document.getElementById('taskInput');
    const text = input.value.trim();
    if (!text) return;
    
    const task = {
        text: text,
        completed: false,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
    };
    
    if (user && user.uid !== 'local') {
        // Сохраняем в Firebase
        await firebase.firestore()
            .collection('users')
            .doc(user.uid)
            .collection('tasks')
            .add(task);
    } else {
        // Локальное сохранение
        task.id = Date.now();
        task.createdAt = new Date();
        tasks.push(task);
        saveLocalTasks();
    }
    
    input.value = '';
    renderTasks();
}

// Загрузить из Firebase
function loadTasksFromFirebase() {
    if (!user || user.uid === 'local') return;
    
    firebase.firestore()
        .collection('users')
        .doc(user.uid)
        .collection('tasks')
        .orderBy('createdAt', 'desc')
        .onSnapshot(snapshot => {
            tasks = [];
            snapshot.forEach(doc => {
                tasks.push({id: doc.id, ...doc.data()});
            });
            renderTasks();
        });
}

// Локальное сохранение
function loadLocalTasks() {
    const saved = localStorage.getItem('localTasks');
    if (saved) tasks = JSON.parse(saved);
    renderTasks();
}

function saveLocalTasks() {
    localStorage.setItem('localTasks', JSON.stringify(tasks));
}

// Переключить статус
async function toggleTask(id) {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    
    task.completed = !task.completed;
    
    if (user && user.uid !== 'local') {
        await firebase.firestore()
            .collection('users')
            .doc(user.uid)
            .collection('tasks')
            .doc(id)
            .update({completed: task.completed});
    } else {
        saveLocalTasks();
    }
    
    renderTasks();
}

// Удалить задачу
async function deleteTask(id) {
    if (!confirm('Удалить?')) return;
    
    if (user && user.uid !== 'local') {
        await firebase.firestore()
            .collection('users')
            .doc(user.uid)
            .collection('tasks')
            .doc(id)
            .delete();
    } else {
        tasks = tasks.filter(t => t.id !== id);
        saveLocalTasks();
        renderTasks();
    }
}

// Очистить выполненные
async function clearCompleted() {
    const completed = tasks.filter(t => t.completed);
    if (completed.length === 0) return;
    
    if (!confirm(`Удалить ${completed.length} выполненных задач?`)) return;
    
    if (user && user.uid !== 'local') {
        const batch = firebase.firestore().batch();
        completed.forEach(task => {
            const ref = firebase.firestore()
                .collection('users')
                .doc(user.uid)
                .collection('tasks')
                .doc(task.id);
            batch.delete(ref);
        });
        await batch.commit();
    } else {
        tasks = tasks.filter(t => !t.completed);
        saveLocalTasks();
        renderTasks();
    }
}

// Отобразить задачи
function renderTasks() {
    // Фильтрация
    let filtered = tasks;
    if (filter === 'active') filtered = tasks.filter(t => !t.completed);
    if (filter === 'completed') filtered = tasks.filter(t => t.completed);
    
    // Рендеринг
    document.getElementById('taskList').innerHTML = filtered.map(task => `
        <div class="task">
            <span onclick="toggleTask('${task.id}')" 
                  style="cursor: pointer; ${task.completed ? 'text-decoration: line-through; color: #888;' : ''}">
                ${task.text}
            </span>
            <button onclick="deleteTask('${task.id}')">✕</button>
        </div>
    `).join('');
    
    // Статистика
    document.getElementById('total').textContent = tasks.length;
    document.getElementById('completed').textContent = tasks.filter(t => t.completed).length;
}
