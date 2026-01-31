# Etapa 1: Construcción
FROM node:20-alpine AS build

WORKDIR /app

# Copiar package.json y package-lock.json
COPY package*.json ./

# Instalar dependencias
RUN npm ci

# Copiar todo el código fuente
COPY . .

# Construir la aplicación para producción
RUN npm run build --prod

# Etapa 2: Servidor nginx
FROM nginx:alpine

# Copiar archivos construidos desde la etapa de build
# Angular 17+ con application builder genera archivos en dist/[project]/browser/
COPY --from=build /app/dist/smartfix-samana/browser /usr/share/nginx/html

# Copiar configuración personalizada de nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Exponer puerto 80
EXPOSE 80

# Iniciar nginx
CMD ["nginx", "-g", "daemon off;"]