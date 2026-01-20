FROM node:20-alpine AS builder

WORKDIR /app

COPY services/service-products/package*.json ./
RUN npm install

COPY services/service-products/ .
COPY proto/products ./proto
RUN npm run build

FROM node:20-alpine

WORKDIR /app

COPY services/service-products/package*.json ./
RUN npm install --only=production

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/proto ./proto

EXPOSE 60057

CMD ["node", "dist/main.js"]
