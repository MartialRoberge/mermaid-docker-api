FROM node:18-slim

# Install Chromium dependencies
RUN apt-get update && apt-get install -y     chromium chromium-driver     fonts-liberation libappindicator3-1 libasound2     libatk-bridge2.0-0 libatk1.0-0 libcups2     libdbus-1-3 libgdk-pixbuf2.0-0 libnspr4     libnss3 libx11-xcb1 libxcomposite1 libxdamage1     libxrandr2 xdg-utils wget --no-install-recommends     && apt-get clean && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY . .

RUN npm install

EXPOSE 3000
CMD ["node", "server.js"]
