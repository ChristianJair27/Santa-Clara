# Dockerfile
FROM node:20-bookworm-slim

# Dependencias útiles (openssl para libs/ JWT; tzdata para zona horaria)
RUN apt-get update && apt-get install -y openssl tzdata wget && rm -rf /var/lib/apt/lists/*
ENV TZ=America/Mexico_City

WORKDIR /app

# Instala solo dependencias de producción
COPY package*.json ./
RUN npm ci --omit=dev

# Copia el resto del código
COPY . .

# Asegura que el directorio de uploads exista
RUN mkdir -p public/uploads

# Variables por defecto (puedes sobreescribirlas en Dokploy)
ENV NODE_ENV=production
ENV PORT=8000

# Expón el puerto donde escucha tu app
EXPOSE 8000

# Arranque
CMD ["npm", "start"]
