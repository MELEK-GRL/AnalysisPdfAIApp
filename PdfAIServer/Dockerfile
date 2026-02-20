# PdfAIServer – Railway deploy
FROM node:20-alpine

WORKDIR /app

COPY package.json yarn.lock* .yarnrc.yml* ./
COPY .yarn ./.yarn 2>/dev/null || true
RUN corepack enable && yarn install --immutable 2>/dev/null || npm install

COPY . .
EXPOSE 4000
CMD ["node", "src/index.js"]
