# Use Node.js 20 as base
FROM node:20


WORKDIR /usr/src/app


COPY package*.json ./


RUN npm install


COPY prisma ./prisma


RUN npx prisma generate


COPY . .


RUN npm run build


EXPOSE 3000


CMD ["node", "dist/main"]
