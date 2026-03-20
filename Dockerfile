FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# Remove devDependencies after build to save memory
RUN npm prune --omit=dev

EXPOSE 8080

CMD ["node", "dist/main"]
