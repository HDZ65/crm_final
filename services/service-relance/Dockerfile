FROM node:20-alpine AS builder

WORKDIR /app

COPY services/service-relance/package*.json ./
RUN npm install

COPY services/service-relance/ .
COPY proto/relance ./proto
RUN npm run build

FROM node:20-alpine

WORKDIR /app

COPY services/service-relance/package*.json ./
RUN npm install --only=production

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/proto ./proto

EXPOSE 50066

CMD ["node", "dist/main.js"]
