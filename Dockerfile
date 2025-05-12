# ─── base avec Chrome + dépendances déjà incluses ────────────────
FROM ghcr.io/puppeteer/puppeteer:20.7.4

# ----------------------------------------------------------------
#  ce tag contient :
#    • node 20.x
#    • chromium + toutes les bibliothèques GTK/GLib
#    • fontconfig, nss, etc.
# ----------------------------------------------------------------

WORKDIR /app

# dépendances Node
COPY package*.json ./
RUN npm install --omit=dev        # ou pnpm / yarn au choix

# ton code
COPY . .

CMD ["node","server.js"]
