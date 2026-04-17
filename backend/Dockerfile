FROM node:20-slim

WORKDIR /app

# Install OpenSSL (required for Prisma)
RUN apt-get update && apt-get install -y openssl

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy source code
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Fix Prisma permissions
RUN chmod -R 755 /app/node_modules/.prisma

EXPOSE 5000

# 🚀 Auto migrate + seed + start
CMD ["sh", "-c", "npx prisma migrate deploy && node prisma/seed.js && node server.js"]