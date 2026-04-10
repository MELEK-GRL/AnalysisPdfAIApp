# PdfAIServer – Railway Docker build (Yarn 4, Corepack).
# Alpine + corepack prepare sık kırılıyor; bookworm-slim ile Yarn indirmesi güvenilir.
FROM node:20-bookworm-slim

WORKDIR /app

ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0

RUN corepack enable && corepack prepare yarn@4.9.2 --activate

COPY package.json yarn.lock .yarnrc.yml ./

RUN yarn install --immutable

COPY . .

EXPOSE 4000

CMD ["node", "src/index.js"]
