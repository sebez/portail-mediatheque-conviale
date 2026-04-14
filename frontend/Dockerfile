# Frontend Dockerfile — multi-stage build

# Stage 1: Angular build
FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build -- --configuration production

# Stage 2: nginx serving the static Angular build output
FROM nginx:alpine AS final

# Angular project name is "frontend" (from angular.json) → dist output: dist/frontend/browser
COPY --from=build /app/dist/frontend/browser /usr/share/nginx/html

# SPA nginx config: serve index.html for all unmatched routes (Angular client-side routing)
COPY nginx-spa.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
