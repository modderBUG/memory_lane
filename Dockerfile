FROM node:20-alpine

RUN addgroup -S app && adduser -S app -G app

WORKDIR /app

COPY server ./server
COPY public ./public

WORKDIR /app/server
RUN npm install --omit=dev
WORKDIR /app

# 在切换用户之前创建目录并设置所有权
RUN mkdir -p /app/thumbnails && chown -R app:app /app

USER app

EXPOSE 8080

ENV PHOTOS_DIR=/photos THUMBNAILS_DIR=/app/thumbnails PORT=8080

CMD ["node", "server/index.js"]
