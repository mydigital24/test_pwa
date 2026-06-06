// SERVICE WORKER REGISTRIEREN
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js')
        .then(reg => console.log('Service Worker aktiv!', reg))
        .catch(err => console.log('Fehler beim SW-Start:', err));
    });
}

// APP LOGIK
let tasks = JSON.parse(localStorage.getItem('turboTasks')) || [];

const taskInput = document.getElementById('taskInput');
const addBtn = document.getElementById('addBtn');
const taskList = document.getElementById('taskList');

function render() {
    taskList.innerHTML = '';

    tasks.forEach((task, index) => {
        const li = document.createElement('li');
        li.className = task.completed ? 'done' : '';
        li.onclick = () => toggleTask(index);

        li.innerHTML = `
        <div class="checkbox"></div>
        <span>${task.text}</span>
        `;
        taskList.appendChild(li);
    });

    localStorage.setItem('turboTasks', JSON.stringify(tasks));
}

function addTask() {
    const text = taskInput.value.trim();
    if (!text) return;

    tasks.push({ text: text, completed: false });
    taskInput.value = '';
    render();
}

function toggleTask(index) {
    tasks[index].completed = !tasks[index].completed;
    render();
}

// Event Listener für Klick und Enter-Taste
addBtn.addEventListener('click', addTask);
taskInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') addTask();
});

// Erstes Laden der Aufgaben ausführen
render();
