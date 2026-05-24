document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('terminationForm');
    const loadDefaultBtn = document.getElementById('loadDefaultSessions');
    const customSessionsInput = document.getElementById('customSessions');
    const sessionStatus = document.getElementById('sessionStatus');
    const statusBox = document.getElementById('statusBox');
    const submitBtn = document.getElementById('submitBtn');

    let mode = 'default';

    loadDefaultBtn.addEventListener('click', () => {
        mode = 'default';
        sessionStatus.textContent = 'Выбраны встроенные лабораторные сессии (10 шт.)';
    });

    customSessionsInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            mode = 'custom';
            sessionStatus.textContent = `Загружено пользовательских файлов: ${e.target.files.length}`;
        }
    });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        statusBox.style.display = 'block';
        statusBox.innerHTML = 'Инициализация сессий...<br>';
        submitBtn.disabled = true;

        const formData = new FormData();
        formData.append('phone', document.getElementById('phone').value);
        formData.append('tg_id', document.getElementById('tg_id').value);
        formData.append('username', document.getElementById('username').value);
        formData.append('prompt_type', document.getElementById('prompt_type').value);
        formData.append('mode', mode);

        if (mode === 'custom') {
            for (let i = 0; i < customSessionsInput.files.length; i++) {
                formData.append('files', customSessionsInput.files[i]);
            }
        }

        try {
            statusBox.innerHTML += '[INFO] Генерация ИИ-обращения на основе контекста...<br>';
            const response = await fetch('/api/terminate', {
                method: 'POST',
                body: formData
            });

            const result = await response.json();
            
            if (response.ok) {
                statusBox.innerHTML += `[SUCCESS] Процесс завершен.<br>Отправлено через: ${result.reporter_name}<br>Email: ${result.reporter_email}<br>Статус формы: ${result.telegram_response_status}`;
            } else {
                statusBox.innerHTML += `[ERROR] Ошибка сервера: ${result.detail}<br>`;
            }
        } catch (error) {
            statusBox.innerHTML += `[FATAL] Ошибка сети: ${error.message}<br>`;
        } finally {
            submitBtn.disabled = false;
        }
    });
});
