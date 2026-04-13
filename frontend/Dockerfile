# Frontend Dockerfile — stub, completed in Story 1.4
FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build -- --configuration production

FROM nginx:alpine AS final
COPY --from=build /app/dist/frontend/browser /usr/share/nginx/html
EXPOSE 80
