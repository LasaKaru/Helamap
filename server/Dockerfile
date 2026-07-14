# ── FacilityFlow backend: Node + Express + SQLite ─────────────────────
FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=build /app/dist ./dist
# The sample map used for first-run seeding
COPY --from=build /app/seed-data ./seed-data
VOLUME /app/data
EXPOSE 4000
CMD ["node", "dist/index.js"]
