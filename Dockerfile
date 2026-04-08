FROM node:20-alpine

RUN addgroup -S app && adduser -S app -G app

WORKDIR /app

COPY server/package.json server/package-lock.json* ./
COPY server/index.js ./
COPY public ./public

RUN npm install --omit=dev

USER app

EXPOSE 8080

ENV PHOTOS_DIR=/photos PORT=8080

CMD ["node", "index.js"]
