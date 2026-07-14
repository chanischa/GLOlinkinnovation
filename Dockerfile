FROM node:22-bookworm-slim

WORKDIR /app

COPY backend/package*.json ./backend/
RUN cd backend && npm ci --omit=dev

COPY . .

ENV NODE_ENV=production
ENV PORT=8080
ENV GLO_DB_PATH=/var/data/glo.db
ENV GLO_RUNTIME_STATE_PATH=/var/data/runtime-ownership.json

EXPOSE 8080

CMD ["sh", "-c", "cd backend && if [ ! -f \"$GLO_DB_PATH\" ]; then npm run seed; fi && npm start"]
