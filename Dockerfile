# Dockerfile para NestJS
FROM node AS development

WORKDIR /app

COPY entrypoint.sh /entrypoint.sh
RUN sed -i 's/\r$//' /entrypoint.sh && chmod +x /entrypoint.sh

COPY package*.json ./
COPY package-lock.json  ./

RUN npm i

COPY . .

RUN npm run build

EXPOSE 3004

ENTRYPOINT [ "sh", "/entrypoint.sh" ]

CMD ["npm", "run", "start"]
