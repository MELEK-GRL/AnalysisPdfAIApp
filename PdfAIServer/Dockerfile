# PdfAIServer – Railway Docker: Corepack yok; Yarn CLI imaj içinde indirilir (repo’da .yarn/releases şart değil).
FROM node:20-alpine

WORKDIR /app

RUN apk add --no-cache curl \
    && mkdir -p .yarn/releases \
    && curl -fsSL https://repo.yarnpkg.com/4.9.2/packages/yarnpkg-cli/bin/yarn.js -o .yarn/releases/yarn-4.9.2.cjs

COPY package.json yarn.lock .yarnrc.yml ./

# Dev bağımlılığı mongodb-memory-server postinstall’da Mongo indirir; imajda gerek yok.
RUN YARN_ENABLE_SCRIPTS=0 node .yarn/releases/yarn-4.9.2.cjs install --immutable

# .dockerignore’da .yarn var; burada indirilen Yarn silinmez.
COPY . .

EXPOSE 4000

CMD ["node", "src/index.js"]
