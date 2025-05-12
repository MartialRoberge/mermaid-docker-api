#=========================
# Dockerfile (version 1)
#=========================
FROM node:18-slim

# 1. Dépendances nécessaires à Chromium
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
      chromium chromium-driver \
      fonts-liberation libappindicator3-1 libasound2 \
      libatk-bridge2.0-0 libatk1.0-0 libcups2 libdbus-1-3 \
      libgdk-pixbuf2.0-0 libnspr4 libnss3 libx11-xcb1 \
      libxcomposite1 libxdamage1 libxrandr2 xdg-utils wget && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

# 2. Copie et installation
WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev          # <— remplace npm ci
COPY . .

EXPOSE 3000
CMD ["node", "server.js"]
