FROM node:22-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:22-alpine AS runner

WORKDIR /app

RUN npm install -g serve@14

COPY --from=builder /app/dist/ng-test-fe/browser ./dist

ENV NODE_ENV=production
ENV PORT=8080

EXPOSE 8080

CMD ["sh", "-c", "serve -s /app/dist -l ${PORT}"]
