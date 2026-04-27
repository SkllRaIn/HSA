---

🖥️ HSA Inventory Agent

HelperSystemAdmins — агент для автоматического сбора инвентаризации ПК в сети и удалённого управления через VNC.






---

📋 Содержание

Возможности

Установка сервера

Установка агента

Проверка работы

Управление агентами

Известные проблемы

Устранение неполадок

Структура проекта

Системные требования



---

✅ Возможности

Функция	Статус

Сбор характеристик ПК (CPU, RAM, диски, ОС)	✅
Сбор установленного ПО	✅
Автоматическая отправка данных	✅
Сохранение настроек	✅
Автозапуск при входе в Windows	✅
Веб-интерфейс	✅
Docker-контейнер сервера	✅
PostgreSQL база данных	✅
Автоустановка TightVNC	⚠️ Частично
Удаление ПК через веб	❌
MSI установщик	❌



---

🚀 Установка сервера

1. Установка Docker

Windows:
Скачайте Docker Desktop

Linux:

sudo apt install docker.io docker-compose

2. Клонирование проекта

git clone https://github.com/SkllRaIn/HSA.git
cd HSA

3. Запуск контейнеров

docker-compose up -d

4. Проверка

Откройте:
👉 http://localhost:3000


---

5. Получение IP сервера

# Windows
ipconfig | findstr "IPv4"

# Linux
ip addr show

Пример:

192.168.1.100


---

💻 Установка агента (Windows)

🔹 Способ 1 (рекомендуется)

1. Перейдите в Releases


2. Скачайте HSA_Agent_Setup_v3.0.exe


3. Запустите от имени администратора




---

🔹 Способ 2 (ручной)

Invoke-WebRequest -Uri "https://raw.githubusercontent.com/SkllRaIn/HSA/main/agent/agent_collector.ps1" -OutFile "$env:TEMP\agent_collector.ps1"

New-Item -ItemType Directory -Path "C:\Program Files\HSA_Agent" -Force

Copy-Item "$env:TEMP\agent_collector.ps1" -Destination "C:\Program Files\HSA_Agent\"

$regPath = "HKCU:\Software\Microsoft\Windows\CurrentVersion\Run"
Set-ItemProperty -Path $regPath -Name "HSA_Agent" -Value "powershell.exe -ExecutionPolicy Bypass -WindowStyle Hidden -File 'C:\Program Files\HSA_Agent\agent_collector.ps1'"


---

📦 Установка через мастер

Шаг	Действие

1	Запустите .exe
2	Next
3	Выберите папку
4	✅ Add to startup
5	✅ Install TightVNC
6	Укажите сервер: http://192.168.1.100:3000
7	Install
8	Finish



---

⚙️ После установки

Агент автоматически:

собирает данные

отправляет их на сервер

добавляет себя в автозапуск



---

🔍 Проверка работы

1. Проверка агента

powershell.exe -ExecutionPolicy Bypass -File "C:\Program Files (x86)\HSA_Agent\agent_collector.ps1"

Ожидаемый результат:

>>> Collecting system data...
>>> Sending data to: http://localhost:3000/api/agent/report
>>> SUCCESS: Data sent.


---

2. Проверка базы данных

docker exec -it hsa_postgres psql -U hsa_user -d hsa_inventory -c "SELECT name, manufacturer, model, last_seen FROM computers;"


---

3. Веб-интерфейс

👉 http://localhost:3000


---

🗄️ Управление агентами

Просмотр

SELECT id, name, manufacturer, model, last_seen FROM computers;

Удаление одного ПК

DELETE FROM computers WHERE name = 'DESKTOP-XXX';

Очистка

TRUNCATE TABLE computers RESTART IDENTITY;


---

⚠️ Известные проблемы

🔴 Критические

Проблема	Решение

Удаление через веб	Использовать SQL
VNC не работает	Настройка вручную



---

🟡 Частично

Нет MSI установщика

Агент не стартует сразу после установки



---

🟢 Работает стабильно

Автозапуск

Сбор данных

Веб-интерфейс



---

🔧 Устранение неполадок

VNC

Get-Service tvnserver
netstat -an | findstr :5900

Запуск:

& "C:\Program Files\TightVNC\tvnserver.exe" -start


---

Агент не отправляет данные

Get-Content "$env:APPDATA\HSA_Agent\config.json"

Исправление:

$config = @{ server = "http://192.168.1.100:3000" } | ConvertTo-Json
$config | Out-File "$env:APPDATA\HSA_Agent\config.json" -Encoding UTF8


---

Автозапуск

Get-ItemProperty "HKCU:\Software\Microsoft\Windows\CurrentVersion\Run"


---

📁 Структура проекта

HSA/
├── agent/
├── installer/
├── docker/
├── server/
└── src/


---

📝 Системные требования

Сервер

Docker 20.10+

RAM: 1 GB

Порты: 3000, 5432


Клиент

Windows 7+

PowerShell 5+

RAM: 256 MB



---

🛠 Разработка

Сборка установщика

Установите Inno Setup

Откройте installer.iss

Нажмите F9



---

Сервер

cd server
npm install
npm run dev

Фронтенд

cd client
npm install
npm run dev


---

📄 Лицензия

MIT License


---

👨‍💻 Автор

GitHub: SkllRaIn


---

⭐ Поддержка

Если проект оказался полезным — поставьте ⭐ на GitHub!