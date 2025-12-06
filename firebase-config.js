// Ваша конфигурация Firebase
const firebaseConfig = {
    apiKey: "AIzaSyBHAnTe-bEl5AZIk5y2iiAQNHCJRcvuRzA",
    authDomain: "sync-todo-app-e617f.firebaseapp.com",
    projectId: "sync-todo-app-e617f",
    storageBucket: "sync-todo-app-e617f.firebasestorage.app",
    messagingSenderId: "1077327103318",
    appId: "1:1077327103318:web:6b333882668ca2f26802f7",
    measurementId: "G-9Y6RDHWVH8"
};

// Инициализация Firebase
const app = firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// Экспортируем для использования в других файлах
window.firebaseAuth = auth;
window.firebaseDb = db;
window.firebaseApp = app;