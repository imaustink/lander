FROM node:19-bullseye-slim

WORKDIR /opt/lander

COPY . .

RUN npm i

EXPOSE 3000

ENTRYPOINT npm start
