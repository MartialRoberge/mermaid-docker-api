FROM node:18-alpine

WORKDIR /app
COPY package.json ./
RUN npm install --omit=dev      # ← pas besoin de package-lock.json

COPY . .

EXPOSE 8080
CMD ["npm", "start"]
