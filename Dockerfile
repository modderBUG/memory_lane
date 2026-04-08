FROM node:20-alpine

RUN addgroup -S app && adduser -S app -G app

WORKDIR /app

COPY server/package.json server/package-lock.json* ./
COPY server/index.js ./
COPY public ./public

RUN npm install --omit=dev

USER app

EXPOSE 8080

ENV PHOTOS_DIR=/photos THUMBNAILS_DIR=/app/thumbnails PORT=8080

# Create thumbnails directory with write permissions
RUN mkdir -p /app/thumbnails && chown app:app /app/thumbnails

CMD ["node", "index.js"]
