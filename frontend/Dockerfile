FROM node:22-alpine AS build

WORKDIR /app

COPY package*.json ./
COPY frontend/package.json ./frontend/

RUN npm install --workspace=frontend --legacy-peer-deps
COPY frontend/ ./frontend/
WORKDIR /app/frontend

ARG VITE_API_URL
RUN VITE_API_URL=$VITE_API_URL npm run build

# Stage 2: Serve
FROM nginx:alpine

COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/frontend/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]