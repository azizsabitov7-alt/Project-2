// ОБНОВЛЕННЫЙ КОД С ОБХОДОМ ОШИБКИ GOOGLE

let currentUser = null;
let tasks = [];

// DOM элементы
let loginSection, appContent;

document.addEventListener('DOMContentLoaded', function() {
    console.log("Приложение запущено");
    
    // Инициализируем элементы
    loginSection = document.getElementById('login-section');
    appContent = document.getElementById('app-content');
    
    // Загружаем локальные задачи
    loadLocalTasks();
    
    // Настраиваем обработчики
    setupEventListeners();
    
    // Прячем Firebase ошибки (работаем локально)
    hideFirebaseErrors();
    
    // Показываем локальный режим
    showLocalMode();
});

function hideFirebaseErrors() {
    // Убираем все сообщения о Firebase
    const firebaseStatus = document.getElementById('firebase-status');
    if (firebaseStatus) {
        firebaseStatus.innerHTML = '<span style="color: #6c757d;">⚠️ Локальный режим</span>';
    }
    
    const errorDivs = document.querySelectorAll('.error-message, #firebase-error');
    errorDivs.forEach(div => div.style.display = 'none');
}

function showLocalMode() {
    const infoBox = document.querySelector('.info-box');
    if (infoBox) {
        infoBox.innerHTML = `
            <h3><i class="fas fa-info-circle"></i> Информация:</h3>
            <p><strong>Режим:</strong> Локальный (без синхронизации)</p>
            <p><strong>Данные сохраняются</strong> в вашем браузере</p>
            <p><strong>Для синхронизации:</strong> Разместите приложение на HTTPS сайте</p>
        `;
    }
}

function setupEventListeners() {
    // Кнопка "Локальный режим"
    const localBtn = document.getElementById('continue-local');
    if (localBtn) {
        localBtn.addEventListener('click', function() {
            console.log("Активирован локальный режим");
            showApp();
            showNotification("Работаем локально. Данные сохраняются в вашем браузере.", "info");
        });
    }
    
    // Кнопка Google (показываем ошибку)
    const googleBtn = document.getElementById('google-login');
    if (googleBtn) {
        googleBtn.addEventListener('click', function() {
            showGoogleError();
        });
    }
    
    // Кнопка добавления задачи
    const addBtn = document.getElementById('add-task');
    const taskInput = document.getElementById('task-input');
    
    if (addBtn && taskInput) {
        addBtn.addEventListener('click', addTask);
        taskInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') addTask();
        });
    }
}

function showGoogleError() {
    const message = `
        <div style="text-align: left; background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 10px; color: #856404;">
            <h4 style="margin-top: 0; color: #856404;"><i class="fas fa-exclamation-triangle"></i> Google вход не работает локально</h4>
            <p><strong>Причина:</strong> Google блокирует вход с локальных адресов (localhost, file://) по соображениям безопасности.</p>
            <p><strong>Решение:</strong></p>
            <ol>
                <li>Разместите приложение на GitHub Pages (бесплатно)</li>
                <li>Используйте ngrok для создания HTTPS туннеля</li>
                <li>Или работайте в локальном режиме (кнопка ниже)</li>
            </ol>
            <button onclick="showApp()" style="background: #2575fc; color: white; border: none; padding: 10px 20px; border-radius: 5px; margin-top: 10px;">
                <i class="fas fa-desktop"></i> Работать локально
            </button>
        </div>
    `;
    
    // Показываем сообщение
    const container = document.querySelector('.login-section');
    if (container) {
        const errorDiv = document.createElement('div');
        errorDiv.innerHTML = message;
        errorDiv.style.margin = '20px 0';
        container.appendChild(errorDiv);
    }
}

// Остальные функции (addTask, renderTasks, saveLocalTasks, loadLocalTasks и т.д.)
// ... используйте функции из предыдущих примеров

function showApp() {
    if (loginSection) loginSection.style.display = 'none';
    if (appContent) appContent.style.display = 'block';
    renderTasks();
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'error' ? '#dc3545' : type === 'warning' ? '#ffc107' : '#28a745'};
        color: ${type === 'warning' ? '#000' : '#fff'};
        padding: 12px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 10000;
        animation: slideIn 0.3s, slideOut 0.3s 2s;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 2300);
}