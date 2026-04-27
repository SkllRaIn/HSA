# Build stage
FROM node:20-slim AS builder
WORKDIR /app

# Копируем конфиги зависимостей
COPY package*.json ./
RUN npm install

# Копируем исходный код
COPY . .

# Собираем фронтенд (Vite)
RUN npm run build

# Production stage
FROM node:20-slim
WORKDIR /app

# Копируем собранный фронтенд из builder
COPY --from=builder /app/dist ./dist
# Копируем серверную часть и конфиги
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/server.ts ./
COPY --from=builder /app/tsconfig.json ./
COPY --from=builder /app/db.json ./
# КОПИРУЕМ ПАПКУ LIB
COPY --from=builder /app/lib ./lib

# Устанавливаем только продакшн зависимости и tsx для запуска .ts
RUN npm install --only=production && npm install -g tsx

EXPOSE 3000

# Запуск сервера
CMD ["tsx", "server.ts"]