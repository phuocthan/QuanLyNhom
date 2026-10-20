FROM node:24-bookworm-slim
WORKDIR /app
COPY package.json ./
COPY dist ./dist
COPY server ./server
RUN node --check server/index.mjs
ENV NODE_ENV=production
ENV PORT=8080
EXPOSE 8080
CMD ["node","server/index.mjs"]
