# ───── Dockerfile ─────
FROM node:18-slim

WORKDIR /app

# ① on copie uniquement les fichiers de dépendances
COPY package*.json ./

# ② on installe (ou ci si tu as un package-lock.json)
RUN npm install --omit=dev          # télécharge express, cors, mermaid-cli…

# ③ on ajoute tout le reste (server.js, etc.)
COPY . .

# ④ lance le serveur
CMD ["npm", "start"]
