🖥️ HSA Inventory Agent
HelperSystemAdmins — агент для автоматического сбора инвентаризации компьютеров в сети и удаленного управления через VNC.

https://img.shields.io/badge/version-3.0-blue
https://img.shields.io/badge/platform-Windows-green
https://img.shields.io/badge/docker-supported-blue

📋 Оглавление
Возможности

Установка сервера

Установка агента

Проверка работы

Управление агентами

Известные проблемы

Устранение неполадок

✅ Возможности
Функция	Статус
Сбор характеристик ПК (CPU, RAM, диски, ОС)	✅ Работает
Сбор установленного ПО	✅ Работает
Автоматическая отправка на сервер	✅ Работает
Сохранение настроек	✅ Работает
Автозапуск при входе в Windows	✅ Работает
Веб-интерфейс для просмотра ПК	✅ Работает
Docker контейнер с сервером	✅ Работает
PostgreSQL для хранения данных	✅ Работает
Авто-установка TightVNC	⚠️ Частично
Удаление ПК через веб	❌ Не работает
MSI установщик	❌ Только EXE
🚀 Установка сервера
Шаг 1: Установите Docker
Windows: Скачайте Docker Desktop

Linux: sudo apt install docker.io docker-compose

Шаг 2: Скачайте проект
bash
git clone https://github.com/SkllRaIn/HSA.git
cd HSA
Шаг 3: Запустите контейнеры
bash
docker-compose up -d
Шаг 4: Проверьте что сервер работает
Откройте браузер: http://localhost:3000

Вы должны увидеть веб-интерфейс HSA.

Шаг 5: Узнайте IP сервера для подключения агентов
bash
# Windows
ipconfig | findstr "IPv4"

# Linux
ip addr show
Запомните IP (например, 192.168.1.100) — он понадобится при установке агентов.

💻 Установка агента на Windows
Способ 1: Скачать установщик (рекомендуется)
Перейдите в раздел Releases

Скачайте файл HSA_Agent_Setup_v3.0.exe

Запустите от имени администратора (ПКМ → Запуск от имени администратора)

Способ 2: Ручная установка (без установщика)
powershell
# 1. Скачайте скрипт
Invoke-WebRequest -Uri "https://raw.githubusercontent.com/SkllRaIn/HSA/main/agent/agent_collector.ps1" -OutFile "$env:TEMP\agent_collector.ps1"

# 2. Создайте папку
New-Item -ItemType Directory -Path "C:\Program Files\HSA_Agent" -Force

# 3. Скопируйте скрипт
Copy-Item "$env:TEMP\agent_collector.ps1" -Destination "C:\Program Files\HSA_Agent\"

# 4. Добавьте в автозагрузку
$regPath = "HKCU:\Software\Microsoft\Windows\CurrentVersion\Run"
Set-ItemProperty -Path $regPath -Name "HSA_Agent" -Value "powershell.exe -ExecutionPolicy Bypass -WindowStyle Hidden -File 'C:\Program Files\HSA_Agent\agent_collector.ps1'"
Процесс установки (шаг за шагом)
Шаг	Действие
1	Запустите HSA_Agent_Setup_v3.0.exe
2	Нажмите Next
3	Выберите папку установки (оставьте по умолчанию)
4	✅ Add to startup (рекомендуется)
5	✅ Install TightVNC (для удаленного управления)
6	Введите URL сервера: http://192.168.1.100:3000
7	Нажмите Install
8	Готово! Нажмите Finish
После установки
Агент автоматически:

Соберет данные о вашем ПК

Отправит их на сервер

Добавит себя в автозагрузку

🔍 Проверка работы
Проверка 1: Агент на ПК
powershell
# Запустить вручную (должно появиться окно с успехом)
powershell.exe -ExecutionPolicy Bypass -File "C:\Program Files (x86)\HSA_Agent\agent_collector.ps1"
Ожидаемый результат:

text
>>> Collecting system data...
>>> Sending data to: http://localhost:3000/api/agent/report
>>> SUCCESS: Data sent.
Проверка 2: Данные в базе
bash
docker exec -it hsa_postgres psql -U hsa_user -d hsa_inventory -c "SELECT name, manufacturer, model, last_seen FROM computers;"
Ожидаемый результат:

text
      name       |   manufacturer   |    model     |        last_seen
-----------------+------------------+--------------+-------------------------
 DESKTOP-XXX     | Dell Inc.        | OptiPlex 7070| 2026-04-27 12:00:00.000
Проверка 3: Веб-интерфейс
Откройте браузер: http://localhost:3000

Вы должны увидеть список всех подключенных компьютеров.

🗄️ Управление агентами
Просмотр всех ПК
bash
docker exec -it hsa_postgres psql -U hsa_user -d hsa_inventory -c "SELECT id, name, manufacturer, model, last_seen FROM computers;"
Удаление конкретного ПК
bash
docker exec -it hsa_postgres psql -U hsa_user -d hsa_inventory -c "DELETE FROM computers WHERE name = 'DESKTOP-XXX';"
Удаление всех ПК
bash
docker exec -it hsa_postgres psql -U hsa_user -d hsa_inventory -c "DELETE FROM computers;"
Полная очистка БД
bash
docker exec -it hsa_postgres psql -U hsa_user -d hsa_inventory -c "TRUNCATE TABLE computers RESTART IDENTITY;"
⚠️ Известные проблемы
🔴 Критические (требуют исправления)
Проблема	Описание	Временное решение
Удаление ПК через веб	Кнопка "Удалить" в веб-интерфейсе не работает	Удалять через командную строку (см. выше)
VNC не подключается	Статус VNC красный, подключение не работает	Ручная настройка (см. раздел ниже)
🟡 Частично работающие
Проблема	Описание
MSI установщик	Только EXE, нет MSI для групповых политик
Запуск после установки	Агент не запускается автоматически после установки (только после ребута)
🟢 Работающие
✅ Автозапуск после перезагрузки

✅ Сбор и отправка данных

✅ Веб-интерфейс (просмотр)

🔧 Устранение неполадок
1. VNC не подключается (красный статус)
powershell
# Проверить статус службы
Get-Service tvnserver

# Проверить порт
netstat -an | findstr :5900

# Если порт не слушается:
& "C:\Program Files\TightVNC\tvnserver.exe" -start

# Если пароль не работает:
$regPath = "HKLM:\SOFTWARE\TightVNC\Server"
Set-ItemProperty -Path $regPath -Name "Password" -Value "123456" -Type String -Force
Restart-Service tvnserver -Force
2. Агент не отправляет данные
powershell
# Проверить конфиг
Get-Content "$env:APPDATA\HSA_Agent\config.json"

# Должно быть:
# {
#   "server": "http://192.168.1.100:3000"
# }

# Исправить если неверно
$config = @{ server = "http://192.168.1.100:3000" } | ConvertTo-Json
$config | Out-File "$env:APPDATA\HSA_Agent\config.json" -Encoding UTF8
3. Автозапуск не работает
powershell
# Проверить запись в реестре
Get-ItemProperty "HKCU:\Software\Microsoft\Windows\CurrentVersion\Run"

# Если записи нет, добавить
Set-ItemProperty "HKCU:\Software\Microsoft\Windows\CurrentVersion\Run" -Name "HSA_Agent" -Value "powershell.exe -ExecutionPolicy Bypass -WindowStyle Hidden -File 'C:\Program Files (x86)\HSA_Agent\agent_collector.ps1'"
4. Slack не приходят уведомления
Проверьте веб-интерфейс сервера — там должны отображаться все ПК.

📁 Структура проекта
text
HSA/
├── agent/
│   └── agent_collector.ps1      # PowerShell скрипт агента
├── installer/
│   └── installer.iss             # Скрипт Inno Setup
├── docker/
│   ├── docker-compose.yml        # Docker Compose конфиг
│   ├── Dockerfile                # Docker образ сервера
│   └── .env.example              # Пример переменных окружения
├── server/
│   ├── server.ts                 # Node.js сервер
│   ├── lib/db.ts                 # Работа с PostgreSQL
│   └── index.html                # Веб-интерфейс
└── src/                          # React фронтенд
📝 Системные требования
Сервер
ОС: Windows / Linux / macOS

Docker: 20.10+

RAM: 1 GB

Порты: 3000 (HTTP), 5432 (PostgreSQL)

Клиент (Windows)
ОС: Windows 7 / 8 / 10 / 11

PowerShell: 5.0+

Права: Администратор (для установки VNC)

RAM: 256 MB

🛠 Разработчику
Сборка установщика
Установите Inno Setup

Откройте installer/installer.iss

Нажмите F9

Локальная разработка сервера
bash
cd server
npm install
npm run dev
Локальная разработка фронтенда
bash
cd client
npm install
npm run dev
📄 Лицензия
MIT License

👨‍💻 Контакты
GitHub: SkllRaIn

Проект: HSA Inventory Agent

⭐ Поддержка
Если проект вам полезен, поставьте звезду на GitHub!

HSA - HelperSystemAdmins | Автоматизация инвентаризации и управления ПК
