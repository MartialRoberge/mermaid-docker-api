# ----  Build & runtime in one stage  ----
FROM node:18-slim

# Puppeteer a besoin de quelques libs :
RUN apt-get update && apt-get install -y --no-install-recommends \
      ca-certificates fonts-liberation libasound2 libatk-bridge2.0-0 \
      libatk1.0-0 libcups2 libdbus-1-3 libdrm2 libx11-xcb1 libxcomposite1 \
      libxdamage1 libxrandr2 libgbm1 libgtk-3-0 xdg-utils \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev          # installe puppeteer ET télécharge Chrome

COPY . .
EXPOSE 3000
CMD ["node", "server.js"]
