### STAGE 1: Build APP ###
FROM node:16-alpine as builder-app

RUN npm config set unsafe-perm true && mkdir /app

RUN npm i npm@8 --location=global
RUN npm i @nestjs/cli --location=global
COPY ./package-lock.json ./package.json /app/nest-api/
WORKDIR /app/nest-api
RUN npm ci
COPY . /app/nest-api
RUN npm run build

### STAGE 2: Nginx ###
FROM node:16-alpine as main
LABEL maintainer="office@pandarium.pro"

ENV TZ=UTC+3
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone
COPY --from=builder-app /app/nest-api/dist /app/nest-api/dist
COPY --from=builder-app /app/nest-api/node_modules /app/nest-api/node_modules
COPY --from=builder-app /app/nest-api/package.json /app/nest-api/package.json
COPY --from=builder-app /app/nest-api/package-lock.json /app/nest-api/package-lock.json
WORKDIR /app/nest-api

CMD ["npm", "run", "start:prod"]
EXPOSE 3000