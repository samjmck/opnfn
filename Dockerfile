FROM node:19
COPY . /app
WORKDIR /app
RUN npm install && npx wrangler build
CMD npx miniflare dist/index.js