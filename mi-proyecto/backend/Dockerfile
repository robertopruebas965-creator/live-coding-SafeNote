# Usamos una versión ligera de Node.js basada en Alpine Linux 
FROM node:18-alpine

# Instalamos herramientas de compilación necesarias para que la librería bcrypt funcione en Linux 
RUN apk add --no-cache python3 g++ make

# Directorio de trabajo dentro del contenedor
WORKDIR /app

# Copiamos los archivos de dependencias primero para aprovechar el sistema de capas de Docker 
COPY package*.json ./

# Instalamos las librerías definidas en package.json 
RUN npm install

# Copiamos el resto del código del proyecto [cite: 1, 2]
COPY . .

# Exponemos el puerto 3000 para el tráfico de la API [cite: 2]
EXPOSE 3000

# Comando para arrancar el servidor [cite: 2]
CMD ["node", "app.js"]