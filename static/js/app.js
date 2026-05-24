document.addEventListener('DOMContentLoaded', () => {
    const scrollContainer = document.querySelector('.scroll-container');
    const sections = document.querySelectorAll('.page-section');
    const navLinks = document.querySelectorAll('.nav-link');
    const cards = document.querySelectorAll('.card-reveal');

    // Инициализируем анимацию первой карточки при загрузке
    setTimeout(() => {
        if(cards[0]) cards[0].classList.add('active-reveal');
    }, 200);

    // УПРАВЛЕНИЕ АНИМАЦИОННЫМ СКРОЛЛОМ И СМЕНОЙ ЭЛЕМЕНТОВ
    scrollContainer.addEventListener('scroll', () => {
        let currentSectionId = '';
        
        sections.forEach((section, index) => {
            const sectionTop = section.offsetTop;
            const containerScroll = scrollContainer.scrollTop;
            
            // Проверка попадания секции в область видимости
            if (containerScroll >= sectionTop - window.innerHeight / 2) {
                currentSectionId = section.getAttribute('id');
                
                // Добавляем 3D-анимацию проявления карточки в этой секции
                if(cards[index]) {
                    cards[index].classList.add('active-reveal');
                }
            }
        });

        // Смена активных классов в навигационном меню
        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${currentSectionId}`) {
                link.classList.add('active');
            }
        });
    });

    // Плавное анимированное перемещение при клике на линки навигации
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('href');
            const targetSection = document.querySelector(targetId);
            
            if (targetSection) {
                targetSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });

    // ОБРАБОТКА СЕССИЙ
    const loadDefaultBtn = document.getElementById('loadDefaultSessions');
    const customSessionsInput = document.getElementById('customSessions');
    const sessionStatus = document.getElementById('sessionStatus');
    const form = document.getElementById('terminationForm');
    const statusBox = document.getElementById('statusBox');
    const submitBtn = document.getElementById('submitBtn');

    let mode = 'default';

    loadDefaultBtn.addEventListener('click', () => {
        mode = 'default';
        sessionStatus.textContent = 'Выбраны дефолтные системные сессии (10 шт)';
        sessionStatus.style.color = '#00f5d4';
    });

    customSessionsInput.addEventListener('change', (e) => {
        const count = e.target.files.length;
        if (count > 0) {
            mode = 'custom';
            sessionStatus.textContent = `Подготовлено к импорту файлов: ${count}`;
            sessionStatus.style.color = '#9d4edd';
        }
    });

    // ОТПРАВКА ДАННЫХ НА БЭКЕНД С ИМИТАЦИЕЙ ЛОГОВ В РЕАЛЬНОМ ВРЕМЕНИ
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        statusBox.style.display = 'block';
        statusBox.innerHTML = '[SYSTEM] Старт инициализации ядер...<br>';
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
            statusBox.innerHTML += '[INFO] Генерация контекста через Wellon AI Core...<br>';
            const response = await fetch('/api/terminate', {
                method: 'POST',
                body: formData
            });

            const result = await response.json();
            if (response.ok) {
                statusBox.innerHTML += `<br><span style="color:#00f5d4;">[SUCCESS] Завершено успешно!</span><br>Заявитель: ${result.reporter_name}<br>Status: ${result.telegram_response_status}`;
                
                // Автоматически добавляем запись в консоль логов на второй секции
                const coreLogsBox = document.getElementById('coreLogsBox');
                coreLogsBox.innerHTML += `<div class="log-row success">[TERMINATOR] Успешная атака сессиями на ID ${document.getElementById('tg_id').value}</div>`;
            } else {
                statusBox.innerHTML += `<br><span style="color:#f72585;">[ERROR] Ошибка сервера: ${result.detail}</span>`;
            }
        } catch (err) {
            statusBox.innerHTML += `<br><span style="color:#f72585;">[FATAL] Ошибка сети: ${err.message}</span>`;
        } finally {
            submitBtn.disabled = false;
        }
    });

    // Сброс и перезагрузка модулей
    document.getElementById('reloadBotBtn').addEventListener('click', () => {
        const coreLogsBox = document.getElementById('coreLogsBox');
        coreLogsBox.innerHTML += `<div class="log-row warning">[CORE] Перезагрузка модулей SQLite3 по требованию Wellon Hub...</div>`;
        setTimeout(() => {
            coreLogsBox.innerHTML += `<div class="log-row success">[CORE] Все конфигурации успешно восстановлены. Ожидание.</div>`;
            coreLogsBox.scrollTop = coreLogsBox.scrollHeight;
        }, 1000);
    });
});
