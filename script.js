document.addEventListener('DOMContentLoaded', () => {

    // ─── STATE ───────────────────────────────────────────────────────────
    let currentDate = new Date();
    let selectedDateStr = dateStr(currentDate);
    let editingTaskId = null;
    let editingRoutineId = null;
    let modalSelectedStatus = 'not-started';
    let selectedIcon = '📋';
    let iconPickerOpen = false;
    let shouldScrollToCurrentTime = true;

    // ─── DOM ─────────────────────────────────────────────────────────────
    const monthLabel   = document.getElementById('current-month-label');
    const dateStrip    = document.getElementById('date-strip');
    const timeline     = document.getElementById('timeline');
    const progressBar  = document.getElementById('day-progress');
    const progressTime = document.getElementById('progress-time-label');
    const nextBanner   = document.getElementById('next-task-banner');
    const nextIcon     = document.getElementById('next-task-icon');
    const nextTitle    = document.getElementById('next-task-title');
    const nextTime     = document.getElementById('next-task-time');

    const modal        = document.getElementById('task-modal');
    const modalBackdrop= document.querySelector('#task-modal .modal-backdrop');
    const modalTitleEl = document.getElementById('modal-title');
    const inputTitle   = document.getElementById('task-title');
    const inputTime    = document.getElementById('task-time');
    const inputEndTime = document.getElementById('task-end-time');
    const inputNotes   = document.getElementById('task-notes');
    const btnCancel    = document.getElementById('modal-cancel');
    const btnDelete    = document.getElementById('modal-delete');
    const btnSave      = document.getElementById('modal-save');
    const iconDisplay  = document.getElementById('icon-display');
    const iconPicker   = document.getElementById('icon-picker');

    // Settings elements
    const settingsModal = document.getElementById('settings-modal');
    const btnSettings   = document.getElementById('btn-settings');
    const btnSettingsClose = document.getElementById('settings-close');
    const settingsBackdrop = document.querySelector('#settings-modal .modal-backdrop');
    const themeAuto     = document.getElementById('theme-auto');
    const themeLight    = document.getElementById('theme-light');
    const themeDark     = document.getElementById('theme-dark');
    const btnToggleNotif= document.getElementById('btn-toggle-notifications');
    const notificationStatus = document.getElementById('notification-status');
    const btnToggleBadge= document.getElementById('btn-toggle-badges');
    const notifyBeforeToggle = document.getElementById('notify-before-toggle');
    const notifyStartToggle = document.getElementById('notify-start-toggle');
    const notifyEndToggle = document.getElementById('notify-end-toggle');
    const btnTestNotif  = document.getElementById('btn-send-test-notification');
    const btnExportData = document.getElementById('btn-export-data');
    const btnImportData = document.getElementById('btn-import-data');
    const importFileInput = document.getElementById('import-file-input');
    const suggestionBanner = document.getElementById('suggestion-banner');
    const suggestionText = document.getElementById('suggestion-text');
    const suggestionAction = document.getElementById('suggestion-action');

    const inputNotifyBefore = document.getElementById('task-notify-before');
    const inputNotifyStart = document.getElementById('task-notify-start');
    const inputNotifyEnd = document.getElementById('task-notify-end');
    const notifyToggleGroup = document.getElementById('task-notify-toggle-group');
    const statusToggleGroup = document.getElementById('task-status-toggle-group');
    const inputAdditionalTimes = document.getElementById('task-additional-times');
    const inputCheckable = document.getElementById('task-checkable');
    const checkableToggle = document.getElementById('task-checkable-toggle');
    const inputRepeatMon = document.getElementById('repeat-mon');
    const inputRepeatTue = document.getElementById('repeat-tue');
    const inputRepeatWed = document.getElementById('repeat-wed');
    const inputRepeatThu = document.getElementById('repeat-thu');
    const inputRepeatFri = document.getElementById('repeat-fri');
    const inputRepeatSat = document.getElementById('repeat-sat');
    const inputRepeatSun = document.getElementById('repeat-sun');

    // ─── CONSTANTS ───────────────────────────────────────────────────────
    const MONATE = ["Januar","Februar","März","April","Mai","Juni","Juli","August","September","Oktober","November","Dezember"];
    const WOCHENTAGE = ["So","Mo","Di","Mi","Do","Fr","Sa"];
    const ICONS = ['📋','✅','⚡','🎯','💪','🧠','💼','📚','🏃','🚴','🧘','🍎','☕','🍽️','🛒','🏋️','😴','🌅','⏰','📅','💻','📱','❤️','🎨','📎','🔒','✈️','🛏️','🎵','🎬','🧾','🧹','🛠️','🎁','💡','📈','🧪','🥗','🍹','🧳','☀️','🌙','🌈','🥇','🧩'];
    const MOTIVATIONS_FREIZEIT = ["Kurze Pause — du hast es verdient! ☀️", "Jetzt mal durchatmen. 🌿", "Ein Moment für dich. 🧘", "Aufladen für das Nächste. ⚡"];
    const DEFAULT_SETTINGS = { notifyBefore: true, notifyStart: true, notifyEnd: true };
    const NOTIFICATION_OFFSET_MIN = 5;

    // ─── HELPERS ─────────────────────────────────────────────────────────
    function dateStr(date) { return `${date.getFullYear()}-${pad(date.getMonth()+1)}-${pad(date.getDate())}`; }
    function pad(n) { return String(n).padStart(2, '0'); }
    function toMin(timeStr) { if (!timeStr || !timeStr.includes(':')) return 0; const [h, m] = timeStr.split(':').map(Number); return h * 60 + m; }
    function minToStr(totalMin) { totalMin = Math.round(totalMin); const h = Math.floor(totalMin / 60); const m = totalMin % 60; return h === 0 ? `${m}m` : (m > 0 ? `${h}h ${m}m` : `${h}h`); }
    function timeFromMin(min) { return `${pad(Math.floor(min / 60))}:${pad(min % 60)}`; }
    function randItem(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
    function nowMin() { const n = new Date(); return n.getHours() * 60 + n.getMinutes(); }
    function todayStr() { return dateStr(new Date()); }

    const STATUS_STATES = [
        { key: 'not-started', label: 'Nicht gestartet', color: '#ff3b30' },
        { key: 'in-progress', label: 'In Arbeit', color: '#ffcc00' },
        { key: 'done', label: 'Erledigt', color: '#34c759' }
    ];

    function normalizeStatus(task) {
        if (task.status === 'done' || task.completed) return 'done';
        if (task.status === 'in-progress') return 'in-progress';
        return 'not-started';
    }

    function getStatusLabel(status) {
        const state = STATUS_STATES.find(s => s.key === status);
        return state ? state.label : 'Unbekannt';
    }

    function isTaskDone(task) {
        return normalizeStatus(task) === 'done';
    }

    function getTaskSource(task) {
        return task.originalTask || task;
    }

    function isTaskCheckable(task) {
        return task.checkable !== false;
    }

    function createStatusControls(task, sourceTask, status, data) {
        const wrapper = document.createElement('div');
        wrapper.className = 'task-status-wrapper';

        // don't show controls for non-checkable tasks
        if (!isTaskCheckable(sourceTask)) return wrapper;

        const states = [
            { key: 'not-started', colorClass: 'status-not-started' },
            { key: 'in-progress', colorClass: 'status-progress' },
            { key: 'done', colorClass: 'status-done' }
        ];

        states.forEach(s => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = `task-status-button ${s.colorClass}` + (s.key === status ? ' active' : '');
            btn.setAttribute('data-status', s.key);
            const indicator = document.createElement('span');
            indicator.className = 'status-indicator';
            btn.appendChild(indicator);
            wrapper.appendChild(btn);

            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const newStatus = s.key;
                // If it's a routine instance, store in routine history
                if (task && task.isRoutine && task.routineId) {
                    markRoutineStatus(selectedDateStr, task.routineId, newStatus);
                } else {
                    // Update task in stored data for the selected date
                    const store = loadData();
                    ensureDay(store, selectedDateStr);
                    const day = store[selectedDateStr];
                    // find by original id (sourceTask) or by id
                    const tid = sourceTask.id || sourceTask.baseId || sourceTask.displayId;
                    const idx = day.findIndex(x => x.id === tid);
                    if (idx !== -1) {
                        day[idx].status = newStatus;
                        day[idx].completed = newStatus === 'done';
                    }
                    saveData(store);
                }

                // update UI (simple approach: re-render whole timeline)
                renderTimeline();
            });
        });

        return wrapper;
    }

    function nextStatus(status) {
        if (status === 'not-started') return 'in-progress';
        if (status === 'in-progress') return 'done';
        return 'not-started';
    }

    function parseAdditionalTimeBlocks(task) {
        const blocks = [];
        if (task.time) blocks.push({ time: task.time, endTime: task.endTime || '' });
        if (task.additionalTimes) {
            task.additionalTimes.split(',').map(part => part.trim()).filter(Boolean).forEach(range => {
                const [start, end] = range.split('-').map(segment => segment.trim());
                if (!start) return;
                const validStart = /^\d{1,2}:\d{2}$/.test(start);
                const validEnd = end ? /^\d{1,2}:\d{2}$/.test(end) : true;
                if (validStart && validEnd) {
                    blocks.push({ time: start, endTime: end || '' });
                }
            });
        }
        return blocks;
    }

    function expandTaskBlocks(tasks) {
        return tasks.flatMap(task => {
            const blocks = parseAdditionalTimeBlocks(task);
            if (blocks.length === 0) return [task];
            return blocks.map((block, index) => ({
                ...task,
                time: block.time,
                endTime: block.endTime,
                displayId: `${task.id}-${index}`,
                baseId: task.id,
                originalTask: task
            }));
        });
    }

    // ─── STORAGE ─────────────────────────────────────────────────────────
    function loadData() {
        try {
            const stored = JSON.parse(localStorage.getItem('planner_tasks')) || {};
            if (!Array.isArray(stored.__routines__)) stored.__routines__ = stored.__routines__ || [];
            if (!stored.__routineHistory__) stored.__routineHistory__ = {};
            return stored;
        } catch (e) {
            return { __routines__: [], __routineHistory__: {} };
        }
    }

    function saveData(data) {
        localStorage.setItem('planner_tasks', JSON.stringify(data));
        updateAppBadge();
    }

    function ensureDay(data, ds) {
        if (!data[ds] || data[ds].length === 0) {
            data[ds] = [
                { id: '__aufstehen__', title: 'Aufstehen', icon: '🌅', time: '07:00', endTime: '', notes: '', completed: false, notifyBefore: true, notifyStart: true, notifyEnd: false },
                { id: '__schlafen__',  title: 'Schlafen',  icon: '😴', time: '22:00', endTime: '', notes: '', completed: false, notifyBefore: true, notifyStart: true, notifyEnd: false }
            ];
            saveData(data);
        }
    }

    function getWeekdayIndex(dateKey) {
        return new Date(dateKey).getDay();
    }

    function getRoutines() {
        return loadData().__routines__ || [];
    }

    function getRoutineHistory() {
        return loadData().__routineHistory__ || {};
    }

    function markRoutineStatus(dateKey, routineId, status) {
        const data = loadData();
        if (!data.__routineHistory__) data.__routineHistory__ = {};
        if (!data.__routineHistory__[dateKey]) data.__routineHistory__[dateKey] = {};
        data.__routineHistory__[dateKey][routineId] = status;
        saveData(data);
    }

    function getRoutineStatus(dateKey, routineId) {
        const history = getRoutineHistory();
        const stored = history[dateKey] && history[dateKey][routineId];
        if (stored === 'done' || stored === true) return 'done';
        if (stored === 'in-progress') return 'in-progress';
        return 'not-started';
    }

    function isRoutineCompleted(dateKey, routineId) {
        return getRoutineStatus(dateKey, routineId) === 'done';
    }

    function buildRoutineInstance(routine, dateKey) {
        const status = getRoutineStatus(dateKey, routine.id);
        return {
            ...routine,
            id: routine.id,
            routineId: routine.id,
            isRoutine: true,
            dateKey,
            status,
            completed: status === 'done',
            notifyBefore: routine.notifyBefore !== false,
            notifyStart: routine.notifyStart !== false,
            notifyEnd: routine.notifyEnd !== false
        };
    }

    function getRoutineInstancesForDate(dateKey) {
        const weekday = getWeekdayIndex(dateKey);
        return getRoutines()
            .filter(routine => Array.isArray(routine.repeatDays) && routine.repeatDays.includes(weekday))
            .map(routine => buildRoutineInstance(routine, dateKey));
    }

    function getDayTasks(dateKey) {
        const data = loadData();
        ensureDay(data, dateKey);
        const dayTasks = data[dateKey] || [];
        const routineInstances = getRoutineInstancesForDate(dateKey);
        const routineIds = new Set(routineInstances.map(r => r.routineId));
        const filteredDayTasks = dayTasks.filter(task => !(task.routineId && routineIds.has(task.routineId)));
        return expandTaskBlocks([...filteredDayTasks, ...routineInstances]);
    }

    function getIncompleteTasks(dateKey) {
        return getDayTasks(dateKey).filter(t => isTaskCheckable(t) && !isTaskDone(t) && t.id !== '__aufstehen__' && t.id !== '__schlafen__');
    }

    function getPreviousDayKey(dateKey) {
        const date = new Date(dateKey);
        date.setDate(date.getDate() - 1);
        return dateStr(date);
    }

    function copyIncompleteTasksToToday() {
        const todayKey = todayStr();
        const yesterdayKey = getPreviousDayKey(todayKey);
        const data = loadData();
        const missing = getIncompleteTasks(yesterdayKey).filter(prev => {
            return !(data[todayKey] || []).some(today => today.title === prev.title && today.time === prev.time);
        });
        if (!data[todayKey]) data[todayKey] = [];
        missing.forEach(task => {
            const copy = { ...task, id: Date.now().toString() + Math.random().toString(36).slice(2), completed: false };
            delete copy.routineId;
            data[todayKey].push(copy);
        });
        saveData(data);
        renderTimeline();
        updateSuggestionBanner();
    }

    function updateSuggestionBanner() {
        const todayKey = todayStr();
        const yesterdayKey = getPreviousDayKey(todayKey);
        const incomplete = getIncompleteTasks(yesterdayKey);
        if (selectedDateStr === todayKey && incomplete.length > 0) {
            suggestionBanner.style.display = 'block';
            suggestionText.textContent = `Vom Vortag sind ${incomplete.length} Aufgaben noch offen. Möchtest du sie heute übernehmen?`;
            suggestionAction.textContent = 'Vorschlagen';
        } else {
            suggestionBanner.style.display = 'none';
        }
    }

    function exportData() {
        const data = loadData();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `planner-export-${todayStr()}.json`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
    }

    function importDataFile(file) {
        const reader = new FileReader();
        reader.onload = () => {
            try {
                const imported = JSON.parse(reader.result);
                if (typeof imported !== 'object' || imported === null || Array.isArray(imported)) throw new Error('Ungültiges Format');
                localStorage.setItem('planner_tasks', JSON.stringify(imported));
                renderTimeline();
                updateSettingsUI();
                updateSuggestionBanner();
                alert('Import erfolgreich!');
            } catch (e) {
                alert('Import fehlgeschlagen: ' + e.message);
            }
        };
        reader.readAsText(file);
    }

    function offerExportPrompt() {
        const data = loadData();
        const hasTasks = Object.keys(data).some(key => key && key !== '__routines__' && key !== '__routineHistory__');
        const hasRoutines = Array.isArray(data.__routines__) && data.__routines__.length > 0;
        if (!hasTasks && !hasRoutines) return;

        const lastPrompt = localStorage.getItem('planner_export_prompted');
        const now = new Date();
        const nextPromptDate = lastPrompt ? new Date(lastPrompt) : null;
        if (!nextPromptDate || now - nextPromptDate >= 3 * 24 * 60 * 60 * 1000) {
            if (confirm('Möchtest du deine Planner-Daten exportieren?')) {
                exportData();
            }
            localStorage.setItem('planner_export_prompted', now.toISOString());
        }
    }

    // ─── INITIATION ──────────────────────────────────────────────────────
    buildIconPicker();
    initTheme();
    renderHeader();
    renderTimeline();
    checkDueNotifications();
    setupEvents();
    updateSettingsUI();
    offerExportPrompt();

    setInterval(() => { renderTimeline(); checkDueNotifications(); }, 60000);

    // ─── THEME CONFIG ────────────────────────────────────────────────────
    function initTheme() {
        const savedTheme = localStorage.getItem('planner_theme') || 'auto';
        applyTheme(savedTheme);
    }

    function applyTheme(theme) {
        document.querySelectorAll('.segment-btn').forEach(btn => btn.classList.remove('active'));
        if (theme === 'dark') {
            document.documentElement.setAttribute('data-theme', 'dark');
            themeDark.classList.add('active');
        } else if (theme === 'light') {
            document.documentElement.setAttribute('data-theme', 'light');
            themeLight.classList.add('active');
        } else {
            document.documentElement.removeAttribute('data-theme');
            themeAuto.classList.add('active');
        }
        localStorage.setItem('planner_theme', theme);
    }

    // ─── APPLE APPLE PWA CORES (Mitteilungen & Badges) ────────────────────
    function loadSettings() {
        try {
            return { ...DEFAULT_SETTINGS, ...JSON.parse(localStorage.getItem('planner_settings') || '{}') };
        } catch (e) {
            return { ...DEFAULT_SETTINGS };
        }
    }

    function saveSettings(settings) {
        localStorage.setItem('planner_settings', JSON.stringify(settings));
        updateSettingsUI();
    }

    function getNotificationPermissionLabel() {
        if (!('Notification' in window)) return 'Mitteilungen werden nicht unterstützt.';
        if (Notification.permission === 'granted') return 'Mitteilungen sind aktiv.';
        if (Notification.permission === 'denied') return 'Blockiert – prüfe die Browser-Berechtigungen.';
        return 'Noch nicht aktiviert. Tippe auf Aktivieren.';
    }

    function getNotificationPermissionClass() {
        if (!('Notification' in window) || Notification.permission === 'denied') return 'settings-note error';
        if (Notification.permission === 'granted') return 'settings-note success';
        return 'settings-note';
    }

    function updateSettingsUI() {
        const settings = loadSettings();

        if ('Notification' in window) {
            btnToggleNotif.disabled = false;
            if (Notification.permission === 'granted') {
                btnToggleNotif.textContent = 'Erlaubt';
                btnToggleNotif.className = 'btn-pill-action granted';
            } else if (Notification.permission === 'denied') {
                btnToggleNotif.textContent = 'Blockiert';
                btnToggleNotif.className = 'btn-pill-action';
            } else {
                btnToggleNotif.textContent = 'Aktivieren';
                btnToggleNotif.className = 'btn-pill-action';
            }
        } else {
            btnToggleNotif.textContent = 'Nicht unterstützt';
            btnToggleNotif.disabled = true;
        }

        if (notificationStatus) {
            notificationStatus.textContent = getNotificationPermissionLabel();
            notificationStatus.className = getNotificationPermissionClass();
        }

        if ('setAppBadge' in navigator) {
            btnToggleBadge.textContent = 'Verfügbar';
            btnToggleBadge.className = 'btn-pill-action granted';
        } else {
            btnToggleBadge.textContent = 'Nicht unterstützt';
            btnToggleBadge.className = 'btn-pill-action';
        }

        notifyBeforeToggle.textContent = settings.notifyBefore ? 'Ein' : 'Aus';
        notifyBeforeToggle.className = 'btn-pill-action' + (settings.notifyBefore ? ' granted' : '');
        notifyStartToggle.textContent = settings.notifyStart ? 'Ein' : 'Aus';
        notifyStartToggle.className = 'btn-pill-action' + (settings.notifyStart ? ' granted' : '');
        notifyEndToggle.textContent = settings.notifyEnd ? 'Ein' : 'Aus';
        notifyEndToggle.className = 'btn-pill-action' + (settings.notifyEnd ? ' granted' : '');
    }

    async function requestNotificationPermission() {
        if (!('Notification' in window)) {
            alert('Dein Browser unterstützt keine Mitteilungen.');
            return;
        }

        if (Notification.permission === 'denied') {
            alert('Mitteilungen sind blockiert. Öffne die Browser-Einstellungen und aktiviere sie für diese Seite.');
            updateSettingsUI();
            return;
        }

        const permission = await Notification.requestPermission();
        updateSettingsUI();
        if (permission === 'granted') {
            checkDueNotifications();
            alert('Mitteilungen wurden aktiviert. Teste sie mit der Testnachricht.');
        }
    }

    function showNotification(title, body) {
        if (!('Notification' in window) || Notification.permission !== 'granted') return;
        const options = {
            body,
            icon: 'icon.png',
            badge: 'icon.png',
            tag: `${title}-${body}`
        };
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.ready.then(reg => reg.showNotification(title, options)).catch(err => {
                console.warn('Service Worker Notification failed, fallback to Notification API', err);
                try { new Notification(title, options); } catch (e) { console.warn('Notification fallback failed', e); }
            });
        } else {
            try {
                new Notification(title, options);
            } catch (err) {
                console.warn('Notification failed', err);
            }
        }
    }

    function getNotificationHistory() {
        try {
            return JSON.parse(localStorage.getItem('planner_notification_history') || '{}');
        } catch (e) {
            return {};
        }
    }

    function saveNotificationHistory(history) {
        localStorage.setItem('planner_notification_history', JSON.stringify(history));
    }

    function hasNotificationBeenSent(taskId, type, date) {
        const history = getNotificationHistory();
        return history[date] && history[date][taskId] && history[date][taskId].includes(type);
    }

    function markNotificationSent(taskId, type, date) {
        const history = getNotificationHistory();
        if (!history[date]) history[date] = {};
        if (!history[date][taskId]) history[date][taskId] = [];
        if (!history[date][taskId].includes(type)) {
            history[date][taskId].push(type);
            saveNotificationHistory(history);
        }
    }

    function checkDueNotifications() {
        if (!('Notification' in window) || Notification.permission !== 'granted') return;
        const settings = loadSettings();
        const dateKey = todayStr();
        const tasks = getDayTasks(dateKey);
        const currentMinute = nowMin();

        tasks.forEach(task => {
            if (!task.time || !task.title || task.completed) return;
            const taskMin = toMin(task.time);
            const beforeMin = taskMin - NOTIFICATION_OFFSET_MIN;
            const endMin = task.endTime ? toMin(task.endTime) : null;
            const taskId = task.id || `${task.title}-${task.time}`;

            if (settings.notifyBefore && task.notifyBefore !== false && beforeMin >= 0 && currentMinute >= beforeMin && currentMinute <= beforeMin + 2 && !hasNotificationBeenSent(taskId, 'before', dateKey)) {
                showNotification('Bald startet deine Aufgabe', `In ${NOTIFICATION_OFFSET_MIN} Minuten: ${task.title}`);
                markNotificationSent(taskId, 'before', dateKey);
            }
            if (settings.notifyStart && task.notifyStart !== false && currentMinute >= taskMin && currentMinute <= taskMin + 2 && !hasNotificationBeenSent(taskId, 'start', dateKey)) {
                showNotification('Deine Aufgabe beginnt jetzt', `${task.title} startet um ${task.time}`);
                markNotificationSent(taskId, 'start', dateKey);
            }
            if (settings.notifyEnd && task.notifyEnd !== false && endMin !== null && currentMinute >= endMin && currentMinute <= endMin + 2 && !hasNotificationBeenSent(taskId, 'end', dateKey)) {
                showNotification('Deine Aufgabe endet', `${task.title} endet um ${task.endTime}`);
                markNotificationSent(taskId, 'end', dateKey);
            }
        });
    }

    function sendTestNotification() {
        if (!('Notification' in window)) {
            alert('Mitteilungen werden von deinem Browser nicht unterstützt.');
            return;
        }
        if (Notification.permission !== 'granted') {
            if (Notification.permission === 'denied') {
                alert('Mitteilungen sind blockiert. Bitte aktiviere sie in den Browser-Einstellungen.');
            } else {
                alert('Bitte aktiviere zuerst die Mitteilungen oben.');
            }
            return;
        }

        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.ready.then(reg => {
                reg.showNotification('Strukturierter Planer', {
                    body: 'Mitteilungen funktionieren einwandfrei offline! ⚡',
                    icon: 'icon.png'
                });
            }).catch(err => {
                console.warn('Test notification failed via Service Worker', err);
                try { new Notification('Strukturierter Planer', { body: 'Mitteilung funktioniert!' }); } catch (error) { console.warn('Notification fallback failed', error); }
            });
        } else {
            try {
                new Notification('Strukturierter Planer', { body: 'Mitteilung funktioniert!' });
            } catch (err) {
                console.warn('Test notification failed', err);
            }
        }
    }

    // Rechnet verbleibende Aufgaben für den Badge aus
    function updateAppBadge() {
        if (!('setAppBadge' in navigator)) return;
        const todayTasks = getDayTasks(todayStr()) || [];
        const uncompletedCount = todayTasks.filter(t => isTaskCheckable(t) && !isTaskDone(t) && t.id !== '__aufstehen__' && t.id !== '__schlafen__').length;

        if (uncompletedCount > 0) {
            navigator.setAppBadge(uncompletedCount).catch(() => {});
        } else {
            navigator.clearAppBadge().catch(() => {});
        }
    }

    // ─── ICON PICKER ─────────────────────────────────────────────────────
    function buildIconPicker() {
        iconPicker.innerHTML = '';
        ICONS.forEach(emoji => {
            const btn = document.createElement('button');
            btn.className = 'icon-option';
            btn.textContent = emoji;
            btn.type = 'button';
            btn.addEventListener('click', () => {
                selectedIcon = emoji;
                iconDisplay.textContent = emoji;
                iconPicker.style.display = 'none';
                iconPickerOpen = false;
            });
            iconPicker.appendChild(btn);
        });
    }

    // ─── HEADER / DATE STRIP ─────────────────────────────────────────────
    function renderHeader() {
        monthLabel.textContent = `${MONATE[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
        dateStrip.innerHTML = '';
        const y = currentDate.getFullYear(), mo = currentDate.getMonth();
        const days = new Date(y, mo + 1, 0).getDate();
        const today = todayStr();

        for (let i = 1; i <= days; i++) {
            const d = new Date(y, mo, i), ds = dateStr(d);
            const el = document.createElement('div');
            el.className = `date-item ${ds === selectedDateStr ? 'active' : ''} ${ds === today ? 'today-marker' : ''}`;
            el.innerHTML = `<span class="weekday">${WOCHENTAGE[d.getDay()]}</span><span class="day-num">${pad(i)}</span>`;
            el.addEventListener('click', () => {
                document.querySelectorAll('.date-item').forEach(x => x.classList.remove('active'));
                el.classList.add('active');
                selectedDateStr = ds;
                renderTimeline();
            });
            dateStrip.appendChild(el);
            if (ds === selectedDateStr) {
                setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' }), 60);
            }
        }
    }

    // ─── TIMELINE ────────────────────────────────────────────────────────
    function renderTimeline() {
        timeline.innerHTML = '';
        const data = loadData();
        ensureDay(data, selectedDateStr);
        const dayTasks = getDayTasks(selectedDateStr);

        const aufTask  = dayTasks.find(t => t.id === '__aufstehen__');
        const schlTask = dayTasks.find(t => t.id === '__schlafen__');
        const midTasks = dayTasks.filter(t => t.id !== '__aufstehen__' && t.id !== '__schlafen__').sort((a, b) => toMin(a.time) - toMin(b.time));

        const isToday = selectedDateStr === todayStr(), isPast = selectedDateStr < todayStr(), curMin = nowMin();
        const startMin = toMin(aufTask.time), endMin = toMin(schlTask.time), totalMin = Math.max(1, endMin - startMin);

        if (isToday) {
            const pct = ((curMin - startMin) / totalMin) * 100;
            progressBar.style.width = `${Math.min(100, Math.max(0, pct))}%`;
            const remaining = endMin - curMin;
            progressTime.textContent = remaining > 0 && curMin >= startMin ? minToStr(remaining) + ' übrig' : '';
        } else {
            progressBar.style.width = isPast ? '100%' : '0%';
            progressTime.textContent = '';
        }

        updateNextTaskBanner(midTasks, aufTask, schlTask, isToday, curMin);
        timeline.appendChild(makeFixedRow(aufTask, isPast || (isToday && toMin(aufTask.time) <= curMin), data, false));

        let lastMin = startMin;
        midTasks.forEach(task => {
            const taskMin = toMin(task.time);
            if (taskMin > lastMin) {
                timeline.appendChild(makeGapRow(timeFromMin(lastMin), task.time, taskMin - lastMin, isToday, isPast, curMin, task));
                lastMin = taskMin;
            }
            let dur = 60;
            if (task.endTime && toMin(task.endTime) > taskMin) dur = toMin(task.endTime) - taskMin;
            timeline.appendChild(makeTaskRow(task, dur, isToday, isPast, curMin, taskMin, taskMin + dur, data));
            lastMin = taskMin + dur;
        });

        if (endMin > lastMin) {
            timeline.appendChild(makeGapRow(timeFromMin(lastMin), schlTask.time, endMin - lastMin, isToday, isPast, curMin, schlTask));
        }
        timeline.appendChild(makeFixedRow(schlTask, isPast || (isToday && toMin(schlTask.time) <= curMin), data, true));
        updateAppBadge();
        updateSuggestionBanner();
        if (selectedDateStr === todayStr() && shouldScrollToCurrentTime) {
            scrollToCurrentTime();
        }
    }

    function focusCurrentTime() {
        currentDate = new Date();
        selectedDateStr = todayStr();
        shouldScrollToCurrentTime = true;
        renderHeader();
        renderTimeline();
    }

    function scrollToCurrentTime() {
        const activeContent = timeline.querySelector('.content-col.active-task');
        const targetRow = activeContent ? activeContent.closest('.timeline-row') : timeline.querySelector('.live-time-line')?.closest('.timeline-row');
        if (!targetRow) return;
        targetRow.scrollIntoView({ behavior: 'smooth', block: 'center' });
        shouldScrollToCurrentTime = false;
    }

    function makeGapRow(startTime, endTime, durMin, isToday, isPast, curMin, nextTask) {
        const startMin = toMin(startTime), endMin = toMin(endTime), isCurrent = isToday && curMin >= startMin && curMin < endMin;
        const linePast = isPast || (isToday && startMin <= curMin), height = Math.max(64, durMin * 1.4);
        const row = document.createElement('div'); row.className = 'timeline-row'; row.style.minHeight = height + 'px';

        const remainMin = isCurrent ? (endMin - curMin) : durMin;
        const subText = (isCurrent && nextTask && nextTask.id !== '__schlafen__') ? `In ${minToStr(remainMin)}: ${nextTask.title}` : `${startTime} – ${endTime} (${minToStr(durMin)})`;
        const quote = isCurrent ? randItem(MOTIVATIONS_FREIZEIT) : '';

        let lineStyle = '', pct = 0;
        if (linePast && !isCurrent) lineStyle = 'background: var(--past-line-color);';
        else if (isCurrent) {
            pct = Math.max(0, Math.min(100, ((curMin - startMin) / durMin) * 100));
            lineStyle = `background: linear-gradient(to bottom, var(--past-line-color) ${pct}%, var(--future-line-color) ${pct}%);`;
        }

        row.innerHTML = `
        ${isCurrent ? `<div class="live-time-line" style="top: ${pct}%;"><span class="live-time-text">${timeFromMin(curMin)}</span></div>` : ''}
        <div class="time-col">
        <span class="start-time" style="color:var(--text-muted)">${startTime}</span>
        <div class="time-dot ${linePast ? 'past-dot' : ''} ${isCurrent ? 'current-dot' : ''}"></div>
        <div class="duration-line" style="${lineStyle}"></div>
        </div>
        <div class="content-col free-space-card ${isCurrent ? 'active-task' : ''}">
        <div class="free-text"><span class="free-text-main">${subText}</span>${quote ? `<span class="free-text-sub">${quote}</span>` : ''}</div>
        </div>`;
        row.querySelector('.content-col').addEventListener('click', () => openModal(null, startTime));
        return row;
    }

    function makeTaskRow(task, durMin, isToday, isPast, curMin, taskMin, taskEndMin, data) {
        const isCurrent = isToday && curMin >= taskMin && curMin < taskEndMin, linePast = isPast || (isToday && taskMin < curMin);
        const row = document.createElement('div'); row.className = 'timeline-row'; row.style.minHeight = Math.max(64, durMin * 1.4) + 'px';
        const endLabel = task.endTime ? `bis ${task.endTime}` : '', durLabel = `${minToStr(durMin)}`;

        let lineStyle = '', pct = 0;
        if (linePast && !isCurrent) lineStyle = 'background: var(--past-line-color);';
        else if (isCurrent) {
            pct = Math.max(0, Math.min(100, ((curMin - taskMin) / durMin) * 100));
            lineStyle = `background: linear-gradient(to bottom, var(--past-line-color) ${pct}%, var(--future-line-color) ${pct}%);`;
        }

        const sourceTask = getTaskSource(task);
        const status = normalizeStatus(sourceTask);
        const taskDone = isTaskDone(sourceTask);
        const canCheck = isTaskCheckable(sourceTask);

        row.innerHTML = `
        ${isCurrent ? `<div class="live-time-line" style="top: ${pct}%;"><span class="live-time-text">${timeFromMin(curMin)}</span></div>` : ''}
        <div class="time-col">
        <span class="start-time">${task.time}</span>
        ${endLabel ? `<span class="end-time-small">${endLabel}</span>` : ''}
        <div class="time-dot ${linePast ? 'past-dot' : ''} ${isCurrent ? 'current-dot' : ''}"></div>
        <div class="duration-line" style="${lineStyle}"></div>
        </div>
        <div class="content-col ${taskDone ? 'completed' : ''} ${isCurrent ? 'active-task' : ''} ${linePast && !isCurrent ? 'past-card' : ''}">
        <div class="task-left">
        <span class="task-emoji">${task.icon || '📋'}</span>
        <div class="task-text">
        <h2>${task.title}${isCurrent ? '<span class="live-dot"></span>' : ''}</h2>
        ${task.notes ? `<p>${task.notes}</p>` : ''}
        <span class="task-duration-badge">${durLabel}</span>
        </div>
        </div>
        
        </div>`;

        const contentCol = row.querySelector('.content-col');
        contentCol.addEventListener('click', () => openModal(task));
        // insert status controls
        try {
            const controls = createStatusControls(task, sourceTask, status, data);
            // place controls at the end of the content column
            contentCol.appendChild(controls);
        } catch (err) {
            const statusWrapper = row.querySelector('.task-status-wrapper');
            if (statusWrapper) statusWrapper.remove();
        }

        // --- Swipe gestures (native-like) ---
        const swipeActions = document.createElement('div');
        swipeActions.className = 'swipe-actions';
        swipeActions.innerHTML = `<button class="swipe-delete-btn">Löschen</button>`;
        row.appendChild(swipeActions);

        let startX = 0, startY = 0, currentX = 0, dragging = false;
        const SWIPE_RIGHT_THRESHOLD = 60;
        const SWIPE_LEFT_THRESHOLD = -80;

        function handleSwipeRight() {
            const newStatus = nextStatus(status);
            if (task && task.isRoutine && task.routineId) {
                markRoutineStatus(selectedDateStr, task.routineId, newStatus);
            } else {
                const store = loadData(); ensureDay(store, selectedDateStr);
                const day = store[selectedDateStr];
                const tid = sourceTask.id || sourceTask.baseId || sourceTask.displayId;
                const idx = day.findIndex(x => x.id === tid);
                if (idx !== -1) {
                    day[idx].status = newStatus;
                    day[idx].completed = newStatus === 'done';
                    saveData(store);
                }
            }
            try { if (navigator.vibrate) navigator.vibrate(8); } catch (e) {}
            renderTimeline();
        }

        contentCol.addEventListener('touchstart', (ev) => {
            const t = ev.touches[0]; startX = t.clientX; startY = t.clientY; dragging = true; currentX = 0; contentCol.style.transition = 'none';
        }, { passive: true });

        contentCol.addEventListener('touchmove', (ev) => {
            if (!dragging) return;
            const t = ev.touches[0]; const dx = t.clientX - startX; const dy = t.clientY - startY;
            if (Math.abs(dy) > Math.abs(dx)) return; // vertical scroll
            ev.preventDefault(); currentX = dx;
            const translate = Math.max(-100, Math.min(100, dx));
            contentCol.style.transform = `translateX(${translate}px)`;
        }, { passive: false });

        contentCol.addEventListener('touchend', (ev) => {
            dragging = false; contentCol.style.transition = 'transform 0.18s ease';
            if (currentX > SWIPE_RIGHT_THRESHOLD) {
                handleSwipeRight();
                contentCol.style.transform = 'translateX(0)';
                swipeActions.classList.remove('visible');
            } else if (currentX < SWIPE_LEFT_THRESHOLD) {
                contentCol.style.transform = 'translateX(-80px)';
                swipeActions.classList.add('visible');
            } else {
                contentCol.style.transform = 'translateX(0)';
                swipeActions.classList.remove('visible');
            }
            currentX = 0;
        });

        // delete action
        const delBtn = swipeActions.querySelector('.swipe-delete-btn');
        delBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (!confirm('Eintrag löschen?')) return;
            const store = loadData();
            if (task && task.isRoutine) {
                store.__routines__ = (store.__routines__ || []).filter(r => r.id !== sourceTask.id);
            } else {
                store[selectedDateStr] = (store[selectedDateStr] || []).filter(t => t.id !== sourceTask.id);
            }
            saveData(store);
            renderTimeline();
        });
        return row;
    }

    function makeFixedRow(task, isPastLine, data, isBottom) {
        const wrapper = document.createElement('div'); wrapper.className = `fixed-row ${isBottom ? 'bottom' : 'top'}`;
        wrapper.innerHTML = `
        <div class="timeline-row" style="min-height:50px;">
        <div class="time-col">
        <span class="start-time" style="font-weight:700">${task.time}</span>
        <div class="time-dot ${isPastLine ? 'past-dot' : ''}"></div>
        ${!isBottom ? `<div class="duration-line ${isPastLine ? 'past-line' : ''}"></div>` : ''}
        </div>
        <div class="content-col ${task.completed ? 'completed' : ''}">
        <div class="task-left">
        <span class="task-emoji">${task.icon}</span>
        <div class="task-text"><h2 style="font-weight:700">${task.title}</h2></div>
        </div>
        
        </div>
        </div>`;
        wrapper.querySelector('.content-col').addEventListener('click', () => openModal(task));
        // no checkbox in fixed rows anymore
        return wrapper;
    }

    function updateNextTaskBanner(midTasks, aufTask, schlTask, isToday, curMin) {
        if (!isToday) { nextBanner.style.display = 'none'; return; }
        const allTasks = [aufTask, ...midTasks, schlTask].filter(t => t && t.time).sort((a, b) => toMin(a.time) - toMin(b.time));
        const next = allTasks.find(t => toMin(t.time) > curMin);

        if (!next) { nextBanner.style.display = 'none'; return; }
        const minUntil = toMin(next.time) - curMin;

        nextIcon.textContent  = next.icon || '📋';
        nextTitle.textContent = next.title;
        nextTime.textContent  = minUntil <= 60 ? `in ${minToStr(minUntil)}` : `um ${next.time}`;
        nextBanner.style.display = 'block';
    }

    // ─── MODAL CONTROLS ──────────────────────────────────────────────────
    function openModal(task = null, presetTime = null) {
        iconPickerOpen = false; iconPicker.style.display = 'none';
        const settings = loadSettings();
        if (task) {
            task = getTaskSource(task);
            editingTaskId = task.id; editingRoutineId = task.isRoutine ? task.routineId : null;
            modalTitleEl.textContent = 'Eintrag bearbeiten';
            inputTitle.value = task.title; inputTime.value = task.time;
            inputEndTime.value = task.endTime || ''; inputNotes.value = task.notes || '';
            inputAdditionalTimes.value = task.additionalTimes || '';
            inputCheckable.checked = task.checkable !== false;
            selectedIcon = task.icon || '📋'; iconDisplay.textContent = selectedIcon;
            inputNotifyBefore.checked = task.notifyBefore !== false;
            inputNotifyStart.checked = task.notifyStart !== false;
            inputNotifyEnd.checked = task.notifyEnd !== false;
            // status for tasks / routine instances
            modalSelectedStatus = task.status || (task.isRoutine ? getRoutineStatus(selectedDateStr, task.routineId) : 'not-started');
            inputRepeatMon.checked = Array.isArray(task.repeatDays) ? task.repeatDays.includes(1) : false;
            inputRepeatTue.checked = Array.isArray(task.repeatDays) ? task.repeatDays.includes(2) : false;
            inputRepeatWed.checked = Array.isArray(task.repeatDays) ? task.repeatDays.includes(3) : false;
            inputRepeatThu.checked = Array.isArray(task.repeatDays) ? task.repeatDays.includes(4) : false;
            inputRepeatFri.checked = Array.isArray(task.repeatDays) ? task.repeatDays.includes(5) : false;
            inputRepeatSat.checked = Array.isArray(task.repeatDays) ? task.repeatDays.includes(6) : false;
            inputRepeatSun.checked = Array.isArray(task.repeatDays) ? task.repeatDays.includes(0) : false;
            btnDelete.style.display = (task.id === '__aufstehen__' || task.id === '__schlafen__') ? 'none' : 'block';
        } else {
            editingTaskId = null; editingRoutineId = null; modalTitleEl.textContent = 'Neuer Eintrag';
            inputTitle.value = ''; inputTime.value = presetTime || currentTimeRounded();
            inputEndTime.value = ''; inputNotes.value = ''; inputAdditionalTimes.value = ''; inputCheckable.checked = true; selectedIcon = '📋'; iconDisplay.textContent = '📋';
            inputNotifyBefore.checked = settings.notifyBefore;
            inputNotifyStart.checked = settings.notifyStart;
            inputNotifyEnd.checked = settings.notifyEnd;
            inputRepeatMon.checked = false;
            inputRepeatTue.checked = false;
            inputRepeatWed.checked = false;
            inputRepeatThu.checked = false;
            inputRepeatFri.checked = false;
            inputRepeatSat.checked = false;
            inputRepeatSun.checked = false;
            btnDelete.style.display = 'none';
            modalSelectedStatus = 'not-started';
        }
        modal.classList.add('open');
        updateModalToggleUI();
        setTimeout(() => inputTitle.focus(), 250);
    }

    function closeModal() { modal.classList.remove('open'); settingsModal.classList.remove('open'); }
    function currentTimeRounded() { const n = new Date(); return timeFromMin((Math.ceil((n.getHours() * 60 + n.getMinutes()) / 30) * 30) % 1440); }

    function updateModalToggleUI() {
        const repeatControls = [
            inputRepeatMon,
            inputRepeatTue,
            inputRepeatWed,
            inputRepeatThu,
            inputRepeatFri,
            inputRepeatSat,
            inputRepeatSun
        ].map(input => ({ input, label: input.closest('label') }));
        repeatControls.forEach(({ input, label }) => {
            if (label) label.classList.toggle('active', input.checked);
        });

        document.querySelectorAll('#task-notify-toggle-group .toggle-option').forEach(button => {
            const target = document.getElementById(button.dataset.target);
            button.classList.toggle('active', target && target.checked);
        });

        document.querySelectorAll('#task-checkable-toggle .toggle-option').forEach(button => {
            button.classList.toggle('active', String(inputCheckable.checked) === button.dataset.value);
        });

        // status buttons
        if (statusToggleGroup) {
            statusToggleGroup.querySelectorAll('.toggle-option').forEach(btn => {
                btn.classList.toggle('active', btn.dataset.status === modalSelectedStatus);
            });
        }
    }

    function attachModalToggleControls() {
        const toggleInputs = [
            inputRepeatMon,
            inputRepeatTue,
            inputRepeatWed,
            inputRepeatThu,
            inputRepeatFri,
            inputRepeatSat,
            inputRepeatSun
        ];

        toggleInputs.forEach(input => {
            const label = input.closest('label');
            if (!label) return;
            label.addEventListener('click', e => {
                if (e.target === input) return;
                e.preventDefault();
                input.checked = !input.checked;
                updateModalToggleUI();
            });
            input.addEventListener('change', updateModalToggleUI);
        });

        document.querySelectorAll('#task-notify-toggle-group .toggle-option').forEach(button => {
            button.addEventListener('click', () => {
                const target = document.getElementById(button.dataset.target);
                if (!target) return;
                target.checked = !target.checked;
                updateModalToggleUI();
            });
        });

        document.querySelectorAll('#task-checkable-toggle .toggle-option').forEach(button => {
            button.addEventListener('click', () => {
                inputCheckable.checked = button.dataset.value === 'true';
                updateModalToggleUI();
            });
        });

        // status buttons in modal
        if (statusToggleGroup) {
            statusToggleGroup.querySelectorAll('.toggle-option').forEach(button => {
                button.addEventListener('click', () => {
                    modalSelectedStatus = button.dataset.status || 'not-started';
                    updateModalToggleUI();
                });
            });
        }
    }

    function saveModalData() {
        const title = inputTitle.value.trim(), time = inputTime.value;
        if (!title || !time) return;
        let endTime = inputEndTime.value; if (endTime && toMin(endTime) <= toMin(time)) endTime = '';

        const repeatDays = [];
        if (inputRepeatMon.checked) repeatDays.push(1);
        if (inputRepeatTue.checked) repeatDays.push(2);
        if (inputRepeatWed.checked) repeatDays.push(3);
        if (inputRepeatThu.checked) repeatDays.push(4);
        if (inputRepeatFri.checked) repeatDays.push(5);
        if (inputRepeatSat.checked) repeatDays.push(6);
        if (inputRepeatSun.checked) repeatDays.push(0);

        const additionalTimes = inputAdditionalTimes.value.trim();
        const checkable = inputCheckable.checked;
        const selectedStatus = modalSelectedStatus || 'not-started';
        const data = loadData(); if (!data[selectedDateStr]) data[selectedDateStr] = [];
        const notifyBefore = inputNotifyBefore.checked;
        const notifyStart = inputNotifyStart.checked;
        const notifyEnd = inputNotifyEnd.checked;

        if (editingRoutineId) {
            if (repeatDays.length === 0) {
                data.__routines__ = (data.__routines__ || []).filter(r => r.id !== editingRoutineId);
                    data[selectedDateStr].push({
                    id: Date.now().toString(),
                    title,
                    icon: selectedIcon,
                    time,
                    endTime,
                    notes: inputNotes.value.trim(),
                    additionalTimes,
                    checkable,
                        status: selectedStatus,
                        completed: selectedStatus === 'done',
                    notifyBefore,
                    notifyStart,
                    notifyEnd
                });
            } else {
                    const routine = data.__routines__.find(r => r.id === editingRoutineId);
                if (routine) {
                    routine.title = title;
                    routine.icon = selectedIcon;
                    routine.time = time;
                    routine.endTime = endTime;
                    routine.notes = inputNotes.value.trim();
                    routine.additionalTimes = additionalTimes;
                    routine.checkable = checkable;
                    routine.notifyBefore = notifyBefore;
                    routine.notifyStart = notifyStart;
                    routine.notifyEnd = notifyEnd;
                    routine.status = selectedStatus;
                    // update routine history if marking done/in-progress
                    markRoutineStatus(selectedDateStr, routine.id, selectedStatus);
                    routine.repeatDays = repeatDays;
                }
            }
        } else if (editingTaskId) {
            const taskIndex = data[selectedDateStr].findIndex(t => t.id === editingTaskId);
            if (taskIndex !== -1) {
                const task = data[selectedDateStr][taskIndex];
                if (repeatDays.length > 0) {
                    const routine = {
                        id: Date.now().toString(),
                        title,
                        icon: selectedIcon,
                        time,
                        endTime,
                        notes: inputNotes.value.trim(),
                        additionalTimes,
                        checkable,
                        status: selectedStatus,
                        completed: selectedStatus === 'done',
                        notifyBefore,
                        notifyStart,
                        notifyEnd,
                        repeatDays,
                        createdAt: selectedDateStr
                    };
                    data.__routines__ = data.__routines__ || [];
                    data.__routines__.push(routine);
                    data[selectedDateStr].splice(taskIndex, 1);
                } else {
                    task.title = title;
                    task.icon = selectedIcon;
                    task.time = time;
                    task.endTime = endTime;
                    task.notes = inputNotes.value.trim();
                    task.additionalTimes = additionalTimes;
                    task.checkable = checkable;
                    task.status = task.status || 'not-started';
                    task.notifyBefore = notifyBefore;
                    task.notifyStart = notifyStart;
                    task.notifyEnd = notifyEnd;
                    task.repeatDays = undefined;
                }
            }
        } else if (repeatDays.length > 0) {
            const routine = {
                id: Date.now().toString(),
                title,
                icon: selectedIcon,
                time,
                endTime,
                notes: inputNotes.value.trim(),
                additionalTimes,
                checkable,
                status: 'not-started',
                notifyBefore,
                notifyStart,
                notifyEnd,
                repeatDays,
                createdAt: selectedDateStr
            };
            data.__routines__ = data.__routines__ || [];
            data.__routines__.push(routine);
        } else {
            data[selectedDateStr].push({
                id: Date.now().toString(),
                title,
                icon: selectedIcon,
                time,
                endTime,
                notes: inputNotes.value.trim(),
                additionalTimes,
                checkable,
                status: selectedStatus,
                completed: selectedStatus === 'done',
                notifyBefore,
                notifyStart,
                notifyEnd
            });
        }
        saveData(data); closeModal(); renderTimeline(); checkDueNotifications();
    }

    function deleteCurrentTask() {
        const data = loadData();
        if (editingRoutineId) {
            data.__routines__ = (data.__routines__ || []).filter(r => r.id !== editingRoutineId);
        } else if (editingTaskId && data[selectedDateStr]) {
            data[selectedDateStr] = data[selectedDateStr].filter(t => t.id !== editingTaskId);
        }
        saveData(data); closeModal(); renderTimeline();
    }

    // ─── EVENTS ──────────────────────────────────────────────────────────
    function setupEvents() {
        document.getElementById('prev-month').onclick = () => changeMonth(-1);
        document.getElementById('next-month').onclick = () => changeMonth(1);
        document.getElementById('add-task-floating').onclick = () => openModal();
        document.getElementById('btn-today').onclick = goToday;

        btnCancel.onclick = closeModal; btnSave.onclick = saveModalData; btnDelete.onclick = deleteCurrentTask;
        modalBackdrop.onclick = closeModal; settingsBackdrop.onclick = closeModal;

        // Settings Button Toggles
        btnSettings.onclick = () => { settingsModal.classList.add('open'); updateSettingsUI(); };
        btnSettingsClose.onclick = closeModal;

        themeAuto.onclick = () => applyTheme('auto');
        themeLight.onclick = () => applyTheme('light');
        themeDark.onclick = () => applyTheme('dark');

        btnToggleNotif.onclick = requestNotificationPermission;
        btnToggleBadge.onclick = () => {
            if ('setAppBadge' in navigator) navigator.clearAppBadge().catch(() => {});
        };
        btnTestNotif.onclick = sendTestNotification;
        notifyBeforeToggle.onclick = () => { const settings = loadSettings(); settings.notifyBefore = !settings.notifyBefore; saveSettings(settings); };
        notifyStartToggle.onclick = () => { const settings = loadSettings(); settings.notifyStart = !settings.notifyStart; saveSettings(settings); };
        notifyEndToggle.onclick = () => { const settings = loadSettings(); settings.notifyEnd = !settings.notifyEnd; saveSettings(settings); };
        btnExportData.onclick = exportData;
        btnImportData.onclick = () => importFileInput.click();
        importFileInput.onchange = e => {
            if (e.target.files && e.target.files[0]) importDataFile(e.target.files[0]);
            e.target.value = '';
        };
        suggestionAction.onclick = copyIncompleteTasksToToday;

        attachModalToggleControls();

        iconDisplay.addEventListener('click', e => {
            e.stopPropagation(); iconPickerOpen = !iconPickerOpen;
            iconPicker.style.display = iconPickerOpen ? 'grid' : 'none';
        });

        document.addEventListener('keydown', e => {
            if (modal.classList.contains('open') && e.key === 'Enter' && e.target.tagName !== 'TEXTAREA') saveModalData();
            if (e.key === 'Escape') closeModal();
        });

            if ('serviceWorker' in navigator) {
                navigator.serviceWorker.register('./sw.js').catch(() => {});
            }
    }

    function changeMonth(dir) { currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + dir, 1); selectedDateStr = dateStr(currentDate); renderHeader(); renderTimeline(); }
    function goToday() { currentDate = new Date(); selectedDateStr = todayStr(); shouldScrollToCurrentTime = true; renderHeader(); renderTimeline(); }

});
