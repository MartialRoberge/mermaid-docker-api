# Dockerfile (version simple)
FROM node:20-slim

WORKDIR /app

# on copie uniquement les métadonnées pour tirer profit du cache Docker
COPY package.json ./

# ↓↓↓  ICI  ↓↓↓
RUN npm install --omit=dev      # installe puppeteer ET télécharge Chrome
# ↑↑↑  pas « npm ci »

# puis on copie le reste du code
COPY . .

EXPOSE 3000
CMD ["node", "server.js"]
