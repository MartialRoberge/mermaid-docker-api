#========================================
# Dockerfile — Chromium embarqué
#========================================
FROM node:18-slim

# Dépendances système MINIMALES pour Chromium headless
RUN apt-get update && apt-get install -y --no-install-recommends \
      libasound2 libatk-bridge2.0-0 libatk1.0-0 libcups2 \
      libdbus-1-3 libdrm2 libgbm1 libgtk-3-0 libnspr4 libnss3 \
      libx11-xcb1 libxcomposite1 libxdamage1 libxrandr2 \
      fonts-liberation xdg-utils wget && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Installation de prod
COPY package*.json ./
RUN npm install --omit=dev     # pas besoin de ci si pas de lockfile

# Copie du code
COPY . .

EXPOSE 3000
CMD ["node", "server.js"]
