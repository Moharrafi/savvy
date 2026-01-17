FROM node:20-slim

WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN corepack enable && corepack prepare pnpm@10.28.0 --activate
RUN pnpm install --prod

COPY . .

EXPOSE 3001

CMD ["node", "server/index.js"]
