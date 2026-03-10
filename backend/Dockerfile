FROM node:20-alpine

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build || echo "No build script yet"

EXPOSE 5000

CMD ["npx", "nodemon", "src/server.ts"]
