FROM node:18-slim

# libs nécessaires à Chrome headless
RUN apt-get update && apt-get install -y \
        wget ca-certificates fonts-liberation libasound2 libatk-bridge2.0-0 \
        libcups2 libdbus-1-3 libdrm2 libgbm1 libgtk-3-0 libnss3 libx11-xcb1 \
        libxcomposite1 libxdamage1 libxrandr2 libxshmfence1 libxss1 libxtst6 \
        libgdk-pixbuf2.0-0 libpango-1.0-0 libpangocairo-1.0-0 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev      # ou `npm ci` si tu ajoutes package-lock.json
COPY . .

ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser \
    PUPPETEER_SKIP_DOWNLOAD=true

CMD ["node", "server.js"]
