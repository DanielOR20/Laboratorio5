# Imagen base oficial de Node.js en versión LTS ligera (Alpine)
FROM node:20-alpine

# Definir directorio de trabajo en el contenedor
WORKDIR /usr/src/app

# Copiar archivos de definición de paquetes
COPY package*.json ./

# Instalar dependencias de producción
RUN npm ci --only=production

# Copiar el código fuente
COPY src/ ./src/

# Exponer el puerto por defecto de Express
EXPOSE 3000

# Definir variables de entorno por defecto
ENV NODE_ENV=production
ENV PORT=3000

# Comando para iniciar la aplicación
CMD ["node", "src/index.js"]

