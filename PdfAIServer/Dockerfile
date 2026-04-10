# PdfAIServer – Railway Docker (Yarn 4, Corepack yok: .yarn/releases ile).
FROM node:20-alpine

WORKDIR /app

COPY package.json yarn.lock .yarnrc.yml ./
COPY .yarn/releases ./.yarn/releases/

# Dev bağımlılığı mongodb-memory-server postinstall’da Mongo indirir; imajda gerek yok.
RUN YARN_ENABLE_SCRIPTS=0 node .yarn/releases/yarn-4.9.2.cjs install --immutable

COPY . .

EXPOSE 4000

CMD ["node", "src/index.js"]
