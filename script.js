document.addEventListener('DOMContentLoaded', () => {

    // ─── STATE ───────────────────────────────────────────────────────────
    let currentDate = new Date();
    let selectedDateStr = dateStr(currentDate);
    let editingTaskId = null;
    let selectedIcon = '📋';
    let iconPickerOpen = false;

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
    const btnToggleBadge= document.getElementById('btn-toggle-badges');
    const btnTestNotif  = document.getElementById('btn-send-test-notification');

    // ─── CONSTANTS ───────────────────────────────────────────────────────
    const MONATE = ["Januar","Februar","März","April","Mai","Juni","Juli","August","September","Oktober","November","Dezember"];
    const WOCHENTAGE = ["So","Mo","Di","Mi","Do","Fr","Sa"];
    const ICONS = ['📋','✅','⚡','🎯','💪','🧠','💼','📚','🏃','🚴','🧘','🍎','☕','🍽️','🛒','🏋️','😴','🌅','⏰','📅','💻','📱','❤️','🎨'];
    const MOTIVATIONS_FREIZEIT = ["Kurze Pause — du hast es verdient! ☀️", "Jetzt mal durchatmen. 🌿", "Ein Moment für dich. 🧘", "Aufladen für das Nächste. ⚡"];

    // ─── HELPERS ─────────────────────────────────────────────────────────
    function dateStr(date) { return `${date.getFullYear()}-${pad(date.getMonth()+1)}-${pad(date.getDate())}`; }
    function pad(n) { return String(n).padStart(2, '0'); }
    function toMin(timeStr) { if (!timeStr || !timeStr.includes(':')) return 0; const [h, m] = timeStr.split(':').map(Number); return h * 60 + m; }
    function minToStr(totalMin) { totalMin = Math.round(totalMin); const h = Math.floor(totalMin / 60); const m = totalMin % 60; return h === 0 ? `${m}m` : (m > 0 ? `${h}h ${m}m` : `${h}h`); }
    function timeFromMin(min) { return `${pad(Math.floor(min / 60))}:${pad(min % 60)}`; }
    function randItem(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
    function nowMin() { const n = new Date(); return n.getHours() * 60 + n.getMinutes(); }
    function todayStr() { return dateStr(new Date()); }

    // ─── STORAGE ─────────────────────────────────────────────────────────
    function loadData() { try { return JSON.parse(localStorage.getItem('planner_tasks')) || {}; } catch(e) { return {}; } }
    function saveData(data) { localStorage.setItem('planner_tasks', JSON.stringify(data)); updateAppBadge(); }

    function ensureDay(data, ds) {
        if (!data[ds] || data[ds].length === 0) {
            data[ds] = [
                { id: '__aufstehen__', title: 'Aufstehen', icon: '🌅', time: '07:00', endTime: '', notes: '', completed: false },
                { id: '__schlafen__',  title: 'Schlafen',  icon: '😴', time: '22:00', endTime: '', notes: '', completed: false }
            ];
            saveData(data);
        }
    }

    // ─── INITIATION ──────────────────────────────────────────────────────
    buildIconPicker();
    initTheme();
    renderHeader();
    renderTimeline();
    setupEvents();
    updateSettingsUI();

    setInterval(() => { renderTimeline(); }, 60000);

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
    function updateSettingsUI() {
        if ('Notification' in window) {
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
            btnToggleNotif.textContent = 'Untertützt nicht';
            btnToggleNotif.disabled = true;
        }

        if ('setAppBadge' in navigator) {
            btnToggleBadge.textContent = 'Verfügbar';
            btnToggleBadge.className = 'btn-pill-action granted';
        } else {
            btnToggleBadge.textContent = 'Nicht unterstützt';
            btnToggleBadge.className = 'btn-pill-action';
        }
    }

    async function requestNotificationPermission() {
        if (!('Notification' in window)) return;
        const permission = await Notification.requestPermission();
        updateSettingsUI();
    }

    function sendTestNotification() {
        if (!('Notification' in window) || Notification.permission !== 'granted') {
            alert('Bitte aktiviere zuerst die Mitteilungen oben.');
            return;
        }
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.ready.then(reg => {
                reg.showNotification('Strukturierter Planer', {
                    body: 'Mitteilungen funktionieren einwandfrei offline! ⚡',
                    icon: 'icon.png'
                });
            });
        } else {
            new Notification('Strukturierter Planer', { body: 'Mitteilung funktioniert!' });
        }
    }

    // Rechnet verbleibende Aufgaben für den Badge aus
    function updateAppBadge() {
        if (!('setAppBadge' in navigator)) return;
        const data = loadData();
        const todayTasks = data[todayStr()] || [];
        const uncompletedCount = todayTasks.filter(t => !t.completed).length;

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
        const dayTasks = data[selectedDateStr] || [];

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

        row.innerHTML = `
        ${isCurrent ? `<div class="live-time-line" style="top: ${pct}%;"><span class="live-time-text">${timeFromMin(curMin)}</span></div>` : ''}
        <div class="time-col">
        <span class="start-time">${task.time}</span>
        ${endLabel ? `<span class="end-time-small">${endLabel}</span>` : ''}
        <div class="time-dot ${linePast ? 'past-dot' : ''} ${isCurrent ? 'current-dot' : ''}"></div>
        <div class="duration-line" style="${lineStyle}"></div>
        </div>
        <div class="content-col ${task.completed ? 'completed' : ''} ${isCurrent ? 'active-task' : ''} ${linePast && !isCurrent ? 'past-card' : ''}">
        <div class="task-left">
        <span class="task-emoji">${task.icon || '📋'}</span>
        <div class="task-text">
        <h2>${task.title}${isCurrent ? '<span class="live-dot"></span>' : ''}</h2>
        ${task.notes ? `<p>${task.notes}</p>` : ''}
        <span class="task-duration-badge">${durLabel}</span>
        </div>
        </div>
        <label class="checkbox-container" onclick="event.stopPropagation()">
        <input type="checkbox" ${task.completed ? 'checked' : ''}>
        <span class="custom-checkbox"></span>
        </label>
        </div>`;

        row.querySelector('.content-col').addEventListener('click', () => openModal(task));
        row.querySelector('input[type="checkbox"]').addEventListener('change', e => {
            task.completed = e.target.checked; saveData(data); renderTimeline();
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
        <label class="checkbox-container" onclick="event.stopPropagation()">
        <input type="checkbox" ${task.completed ? 'checked' : ''}>
        <span class="custom-checkbox"></span>
        </label>
        </div>
        </div>`;
        wrapper.querySelector('.content-col').addEventListener('click', () => openModal(task));
        wrapper.querySelector('input[type="checkbox"]').addEventListener('change', e => {
            task.completed = e.target.checked; saveData(data); renderTimeline();
        });
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
        if (task) {
            editingTaskId = task.id; modalTitleEl.textContent = 'Eintrag bearbeiten';
            inputTitle.value = task.title; inputTime.value = task.time;
            inputEndTime.value = task.endTime || ''; inputNotes.value = task.notes || '';
            selectedIcon = task.icon || '📋'; iconDisplay.textContent = selectedIcon;
            btnDelete.style.display = (task.id === '__aufstehen__' || task.id === '__schlafen__') ? 'none' : 'block';
        } else {
            editingTaskId = null; modalTitleEl.textContent = 'Neuer Eintrag';
            inputTitle.value = ''; inputTime.value = presetTime || currentTimeRounded();
            inputEndTime.value = ''; inputNotes.value = ''; selectedIcon = '📋'; iconDisplay.textContent = '📋';
            btnDelete.style.display = 'none';
        }
        modal.classList.add('open');
        setTimeout(() => inputTitle.focus(), 250);
    }

    function closeModal() { modal.classList.remove('open'); settingsModal.classList.remove('open'); }
    function currentTimeRounded() { const n = new Date(); return timeFromMin((Math.ceil((n.getHours() * 60 + n.getMinutes()) / 30) * 30) % 1440); }

    function saveModalData() {
        const title = inputTitle.value.trim(), time = inputTime.value;
        if (!title || !time) return;
        let endTime = inputEndTime.value; if (endTime && toMin(endTime) <= toMin(time)) endTime = '';

        const data = loadData(); if (!data[selectedDateStr]) data[selectedDateStr] = [];

        if (editingTaskId) {
            const task = data[selectedDateStr].find(t => t.id === editingTaskId);
            if (task) { task.title = title; task.icon = selectedIcon; task.time = time; task.endTime = endTime; task.notes = inputNotes.value.trim(); }
        } else {
            data[selectedDateStr].push({ id: Date.now().toString(), title, icon: selectedIcon, time, endTime, notes: inputNotes.value.trim(), completed: false });
        }
        saveData(data); closeModal(); renderTimeline();
    }

    function deleteCurrentTask() {
        if (!editingTaskId) return;
        const data = loadData();
        if (data[selectedDateStr]) data[selectedDateStr] = data[selectedDateStr].filter(t => t.id !== editingTaskId);
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
        btnTestNotif.onclick = sendTestNotification;

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
    function goToday() { currentDate = new Date(); selectedDateStr = dateStr(currentDate); renderHeader(); renderTimeline(); }
});
