# --- Build bosqichi ---
FROM node:22-alpine AS build
WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma
COPY prisma.config.ts ./
RUN npm ci

COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# --- Runtime bosqichi ---
FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production

COPY package*.json ./
COPY prisma ./prisma
COPY prisma.config.ts ./
RUN npm ci --omit=dev

COPY --from=build /app/dist ./dist

EXPOSE 4000

# Konteyner ko'tarilganda avval migratsiyalar qo'llanadi, keyin server ishga tushadi
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/server.js"]
