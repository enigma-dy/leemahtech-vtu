# Stage 1: Builder
FROM node:20 AS builder

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma

RUN npm install --legacy-peer-deps
RUN npx prisma generate

COPY . .
RUN npm run build

# Stage 2: Production
FROM node:20-alpine

WORKDIR /app


RUN apk add --no-cache curl

RUN addgroup -S appgroup && adduser -S appuser -G appgroup

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma 


USER appuser

EXPOSE 3000


CMD ["node", "dist/main.js"]