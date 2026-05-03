FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
COPY backend/package.json ./backend/

RUN npm install --workspace=backend --legacy-peer-deps

COPY backend/ ./backend/

WORKDIR /app/backend

RUN npm run build
EXPOSE 5000

CMD ["npm", "start"]