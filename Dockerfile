# PdfAIServer – Railway: build context = repo kökü (Root Directory boş olmalı).
# PdfAIServer/package.json kökte değil; COPY yolları bu yüzden PdfAIServer/ ile başlar.
FROM node:20-bookworm-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates curl \
    && rm -rf /var/lib/apt/lists/* \
    && mkdir -p .yarn/releases \
    && curl -fsSL https://repo.yarnpkg.com/4.9.2/packages/yarnpkg-cli/bin/yarn.js -o .yarn/releases/yarn-4.9.2.cjs

COPY PdfAIServer/package.json PdfAIServer/yarn.lock PdfAIServer/.yarnrc.yml ./

RUN YARN_ENABLE_SCRIPTS=0 node .yarn/releases/yarn-4.9.2.cjs install --immutable

COPY PdfAIServer/ ./

ENV NODE_ENV=production

EXPOSE 4000

CMD ["node", "src/index.js"]
