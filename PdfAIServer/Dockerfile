# PdfAIServer – Railway deploy
FROM node:20-alpine

WORKDIR /app

COPY package.json yarn.lock* .yarnrc.yml* ./
RUN corepack enable && yarn install --immutable || npm install

COPY . .
EXPOSE 4000
CMD ["node", "src/index.js"]
