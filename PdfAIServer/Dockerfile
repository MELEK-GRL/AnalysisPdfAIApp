# PdfAIServer – Railway: Railpack Yarn 4 plan hatasını aşmak için Docker build (sadece Yarn).
FROM node:20-alpine

WORKDIR /app

RUN corepack enable && corepack prepare yarn@4.9.2 --activate

COPY package.json yarn.lock .yarnrc.yml ./

RUN yarn install --immutable

COPY . .

EXPOSE 4000

CMD ["node", "src/index.js"]
